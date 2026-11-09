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
 * Pick n questions from a bank, interleaving types so the same one never
 * appears twice in a row, and (where room allows) balancing basic/expected
 * so a 20-round deals its whole span. Dupes within a type are allowed when
 * the generator can't make enough distinct questions for a fair deal.
 */
export function dealRound(bankId, n, rand = Math.random) {
  const bank = getBank(bankId);
  if (!bank) throw new Error("dealRound: no bank " + bankId);
  const basic = bank.types.filter((t) => t.level === "basic");
  const expected = bank.types.filter((t) => t.level === "expected");
  const halfN = Math.ceil(n / 2);
  const dealFrom = (pool, k) => {
    const out = [];
    if (!pool.length) return out;
    const shuf = pool.slice().sort(() => rand() - 0.5);
    let i = 0;
    while (out.length < k) { out.push(shuf[i % shuf.length]); i++; }
    return out;
  };
  const picks = [];
  // Take ~half from each level when both exist, else all from the one that does.
  if (basic.length && expected.length) {
    picks.push(...dealFrom(basic, halfN));
    picks.push(...dealFrom(expected, n - halfN));
  } else {
    picks.push(...dealFrom(basic.length ? basic : expected, n));
  }
  // Shuffle, then de-run: no two consecutive questions of the same type id.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  for (let i = 1; i < picks.length; i++) {
    if (picks[i].id !== picks[i - 1].id) continue;
    for (let j = i + 1; j < picks.length; j++) {
      if (picks[j].id !== picks[i - 1].id) { [picks[i], picks[j]] = [picks[j], picks[i]]; break; }
    }
  }
  // Generate: each type's `gen()` returns a question. Carry the type across.
  return picks.slice(0, n).map((t, i) => {
    const q = t.gen();
    return { ...q, _typeId: t.id, _level: t.level, _round: i + 1 };
  });
}
