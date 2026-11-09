/**
 * Bank adapter — turns the website's `MMTQ.run(bank)` shape into the Playground's.
 *
 * Each bank module below builds its question types with `C` + helpers from
 * `questionCore.js`, then calls `defineBank(meta, types)` to register itself.
 * The Playground reads the registered banks through `getBank(id)` / `listBanks()`.
 * `types` is an array of `{ level:"basic"|"expected", id, label, gen, check? }`.
 */
const REGISTRY = new Map();

export function defineBank(meta, types) {
  if (!meta || !meta.id) throw new Error("defineBank: meta.id required");
  const entry = { meta, types: Array.isArray(types) ? types : [] };
  REGISTRY.set(meta.id, entry);
  return entry;
}

export function getBank(id) { return REGISTRY.get(id) || null; }
export function listBanks() { return Array.from(REGISTRY.values()); }

/**
 * Deal an n-question round from a bank.
 *
 * - Half Basic, half Expected (when the bank has both), every type dealt out
 *   evenly from a shuffled deck so a 20-round covers the whole outcome.
 * - The round CLIMBS: Basic first, then Expected, each in the bank's own
 *   (easiest-first) type order with a little jitter — the same as the
 *   website's whole-topic quizzes.
 * - The same type never appears twice in a row, and a repeated question
 *   (same prompt + diagram) is re-rolled up to 40 times.
 * - `opts.climb === false` keeps a plain shuffle (the boss exam shuffles its
 *   own pool anyway).
 */
export function dealRound(bankId, n, rand = Math.random, opts = {}) {
  const bank = getBank(bankId);
  if (!bank) throw new Error("dealRound: no bank " + bankId);
  const order = new Map(bank.types.map((t, i) => [t.id, i]));
  const basic = bank.types.filter((t) => t.level === "basic");
  const expected = bank.types.filter((t) => t.level === "expected");
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dealFrom = (pool, k) => {
    const out = [];
    let deck = [];
    while (out.length < k && pool.length) { if (!deck.length) deck = shuffle(pool); out.push(deck.pop()); }
    return out;
  };
  let picks;
  if (basic.length && expected.length) {
    const nb = Math.ceil(n / 2);
    picks = dealFrom(basic, nb).concat(dealFrom(expected, n - nb));
  } else picks = dealFrom(basic.length ? basic : expected, n);

  // Climb: level, then type order with jitter. Re-jitter until no type sits
  // next to itself (a few tries is plenty), then fall back to swapping.
  const lv = (t) => (t.level === "basic" ? 0 : 1);
  const hasRun = (arr) => arr.some((t, i) => i > 0 && t.id === arr[i - 1].id);
  if (opts.climb === false) picks = shuffle(picks);
  else {
    let best = picks;
    for (let tries = 0; tries < 80; tries++) {
      const order2 = picks.map((t) => ({ t, o: lv(t) * 1000 + order.get(t.id) + rand() * (2.2 + tries * 0.15) })).sort((a, b) => a.o - b.o).map((k) => k.t);
      best = order2;
      if (!hasRun(order2)) break;
    }
    picks = best;
  }
  for (let i = 1; i < picks.length; i++) {
    if (picks[i].id !== picks[i - 1].id) continue;
    for (let j = 0; j < picks.length; j++) {
      if (j === i) continue;
      const a2 = picks.slice(); [a2[i], a2[j]] = [a2[j], a2[i]];
      const ok = (k) => k <= 0 || k >= a2.length || a2[k].id !== a2[k - 1].id;
      if (ok(i) && ok(i + 1) && ok(j) && ok(j + 1)) { picks = a2; break; }
    }
  }

  const seen = new Set();
  return picks.slice(0, n).map((t, i) => {
    let q = null;
    for (let tries = 0; tries < 40; tries++) {
      const c = t.gen();
      const d = c.diagram;
      const key = t.id + "|" + (c.key || c.prompt + JSON.stringify((d && (d.config || d.grid || d.html)) || "") + JSON.stringify(c.options || ""));
      q = c;
      if (!seen.has(key)) { seen.add(key); break; }
    }
    return { ...q, _typeId: t.id, _label: t.label, _level: t.level, _round: i + 1, _bank: bankId };
  });
}
