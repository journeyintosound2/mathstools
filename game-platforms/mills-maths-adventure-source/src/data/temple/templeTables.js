/**
 * TIMESTABLE TEMPLE (2026-11-08) — the times-table FLUENCY engine. PURE: no
 * React, no stores — the headless checks drive every rule here.
 *
 * Jeff's design (2026-11-08):
 *   • eleven tables in order of difficulty — 10, 5, 11, 2, 4, 8, 3, 6, 9, 12, 7
 *   • a 90-second round per station; bronze / silver / gold = how many right
 *   • the tables open ONE AT A TIME (a 🥉 on a station opens the next)
 *   • the targets allow for the time it takes to TYPE an answer (more digits
 *     = a little more time), and an untimed PRACTICE for every station
 *   • MIXED milestones after each family: the Anchors (10, 5, 11), the
 *     Doubling family (2, 4, 8), the Threes family (3, 6, 9, 12), then the 7s
 *     and the GRAND MIX on top of the pyramid. No division here.
 *
 * Fifteen stations in all. On top of the medals the engine keeps a record of
 * EVERY fact (right / wrong / how fast) so that:
 *   • a fact is "fluent" once it has been answered FAST on two different days
 *     (fast = within 3 s + the typing allowance) — and a slip un-fluents it;
 *   • each fact sits in a review box (Leitner): fast answers push the next
 *     review out (1 → 3 → 7 → 14 → 30 days), a miss brings it back today —
 *     the TEMPLE WARM-UP is built from the facts that are due;
 *   • the mixes + the Grand Mix lean towards the student's own weak facts;
 *   • the times-table square (12 × 12, 78 different facts because 7 × 4 is
 *     4 × 7) lights up fact by fact.
 */
import { MEDALS } from "../farm/farmRecords.js";

// ---------------------------------------------------------------------------
// Tuning — every number a teacher might want to change, in one place.
// ---------------------------------------------------------------------------
export const ROUND_SECONDS = 90;
export const WARMUP_SECONDS = 60;
/** Typing allowance per digit of the answer (seconds). */
export const TYPE_S_PER_DIGIT = 0.4;
/** Thinking time per question each medal expects (seconds). */
export const THINK_S = { gold: 1.2, silver: 2.2, bronze: 3.5 };
/** Switching between tables is harder: the mixes allow a little more. */
export const MIX_EXTRA_S = 0.2;
/** A FAST answer: within this many ms + the typing allowance per digit. */
export const FAST_MS = 3000;
export const FAST_MS_PER_DIGIT = 400;
/** Review gaps (days) for Leitner boxes 0‥5. */
export const REVIEW_DAYS = [0, 1, 3, 7, 14, 30];
/** Coins for reaching each medal on a station for the first time. */
export const MEDAL_COINS = { bronze: 10, silver: 20, gold: 40 };

export const TABLE_ORDER = [10, 5, 11, 2, 4, 8, 3, 6, 9, 12, 7];

// ---------------------------------------------------------------------------
// The families + the fifteen stations (in the order they open).
// ---------------------------------------------------------------------------
export const FAMILIES = [
  { id: "anchors", name: "The Anchors", icon: "⚓", color: "#2f9c8f", where: "Bazaar Square", tables: [10, 5, 11],
    blurb: "Tens, fives and elevens — the patterns everything else leans on." },
  { id: "doubling", name: "The Doubling Family", icon: "🌴", color: "#3f7fc4", where: "the Oasis", tables: [2, 4, 8],
    blurb: "Double it. Double it again. And again." },
  { id: "threes", name: "The Threes Family", icon: "🪨", color: "#c4553c", where: "the top of the Red Mesa", tables: [3, 6, 9, 12],
    blurb: "Know your 3s and the 6s, 9s and 12s follow." },
  { id: "sevens", name: "The 7s", icon: "☀️", color: "#d68a00", where: "the Sun Temple", tables: [7],
    blurb: "The last table — and you already know most of it." },
  { id: "summit", name: "The Grand Mix", icon: "✨", color: "#c99a1a", where: "the Sunstone, on top of the Great Pyramid", tables: TABLE_ORDER,
    blurb: "Every table, all at once." },
];
export const FAMILY = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

const table = (t, family) => ({ key: `x${t}`, kind: "table", table: t, family, name: `The ${t}s`, short: `${t}s`, icon: `×${t}` });
export const STATIONS = [
  table(10, "anchors"), table(5, "anchors"), table(11, "anchors"),
  { key: "mix1", kind: "mix", family: "anchors", name: "Anchor Mix", short: "Mix", icon: "⚓", newTables: [10, 5, 11], reviewTables: [] },
  table(2, "doubling"), table(4, "doubling"), table(8, "doubling"),
  { key: "mix2", kind: "mix", family: "doubling", name: "Doubling Mix", short: "Mix", icon: "🌴", newTables: [2, 4, 8], reviewTables: [10, 5, 11] },
  table(3, "threes"), table(6, "threes"), table(9, "threes"), table(12, "threes"),
  { key: "mix3", kind: "mix", family: "threes", name: "Threes Mix", short: "Mix", icon: "🪨", newTables: [3, 6, 9, 12], reviewTables: [10, 5, 11, 2, 4, 8] },
  table(7, "sevens"),
  { key: "grand", kind: "grand", family: "summit", name: "The Grand Mix", short: "Grand", icon: "✨", newTables: TABLE_ORDER, reviewTables: [] },
];
export const STATION_KEYS = STATIONS.map((s) => s.key);
export function stationOf(key) {
  return STATIONS.find((s) => s.key === key) || null;
}
export function stationIndex(key) {
  return STATIONS.findIndex((s) => s.key === key);
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------
/** One key per fact, order-free: 7 × 4 and 4 × 7 are both "4x7". */
export function factKey(a, b) {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}
export const digitsOf = (n) => String(n).length;
/** All 78 different facts of the 12 × 12 square. */
export const ALL_FACTS = (() => {
  const out = [];
  for (let a = 1; a <= 12; a++) for (let b = a; b <= 12; b++) out.push({ a, b, key: `${a}x${b}`, ans: a * b });
  return out;
})();
const FACT_BY_KEY = new Map(ALL_FACTS.map((f) => [f.key, f]));
export function factOf(key) {
  return FACT_BY_KEY.get(key) || null;
}
/** A table's twelve facts, the table first: 7 × 1 … 7 × 12. */
export function tableFacts(t) {
  return Array.from({ length: 12 }, (_, i) => ({ a: t, b: i + 1, key: factKey(t, i + 1), ans: t * (i + 1) }));
}
/** The facts a station draws from (unique by key) + each one's weight. */
export function stationPool(station, stats = null, today = 0) {
  const st = typeof station === "string" ? stationOf(station) : station;
  if (!st) return [];
  if (st.kind === "table") return tableFacts(st.table).map((f) => ({ ...f, w: 1 }));
  const seen = new Set();
  const take = (tables) => {
    const out = [];
    for (const t of tables) for (const f of tableFacts(t)) if (!seen.has(f.key)) { seen.add(f.key); out.push(f); }
    return out;
  };
  let pool;
  if (st.kind === "grand") {
    pool = ALL_FACTS.map((f) => ({ ...f, w: 1 }));
  } else {
    const fresh = take(st.newTables);
    const review = take(st.reviewTables);
    const wf = review.length ? 0.6 / fresh.length : 1 / fresh.length;
    const wr = review.length ? 0.4 / review.length : 0;
    pool = [...fresh.map((f) => ({ ...f, w: wf })), ...review.map((f) => ({ ...f, w: wr }))];
  }
  // Lean towards the student's own weak facts (gently in the mixes, more in the Grand Mix).
  if (stats) {
    const k = st.kind === "grand" ? 1 : 0.5;
    pool = pool.map((f) => ({ ...f, w: f.w * (1 + k * (weakness(stats[f.key], today) - 1)) }));
  }
  return pool;
}

/** 1 (fluent, not due) … 3 (missed last time). */
export function weakness(s, today = 0) {
  if (!s || !s.n) return 2;
  if (s.lastWrong) return 3;
  if (isFluent(s)) return s.due <= today ? 1.5 : 1;
  return 2;
}

// ---------------------------------------------------------------------------
// Targets (Jeff: "consider the time it takes to type an answer")
// ---------------------------------------------------------------------------
/** Mean digits of the answers a station asks. */
export function avgDigits(station) {
  const pool = stationPool(station);
  return pool.reduce((a, f) => a + digitsOf(f.ans), 0) / Math.max(1, pool.length);
}
/** { bronze, silver, gold } — answers right in 90 s. */
export function targetsFor(station) {
  const st = typeof station === "string" ? stationOf(station) : station;
  if (!st) return { bronze: 0, silver: 0, gold: 0 };
  const extra = st.kind === "table" ? 0 : MIX_EXTRA_S;
  const type = TYPE_S_PER_DIGIT * avgDigits(st);
  const n = (think) => Math.floor(ROUND_SECONDS / (think + extra + type));
  return { bronze: n(THINK_S.bronze), silver: n(THINK_S.silver), gold: n(THINK_S.gold) };
}
/** The medal (MEDALS entry) a score earns at a station, or null. */
export function medalFor(station, score) {
  const t = targetsFor(station);
  const id = score >= t.gold ? "gold" : score >= t.silver ? "silver" : score >= t.bronze ? "bronze" : null;
  return id ? MEDALS.find((m) => m.id === id) : null;
}
const RANK = { bronze: 1, silver: 2, gold: 3 };
export function medalRank(m) {
  return m ? RANK[m.id || m] || 0 : 0;
}
/** "4 more for 🥈" — the next medal up, or null at gold. */
export function nextMedalGap(station, score) {
  const t = targetsFor(station);
  for (const id of ["bronze", "silver", "gold"]) if (score < t[id]) return { id, need: t[id] - score, target: t[id] };
  return null;
}
/** A fast answer for this many digits? */
export function fastLimitMs(digits) {
  return FAST_MS + FAST_MS_PER_DIGIT * digits;
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------
/** Mulberry32 — a tiny seeded random (the checks + the demo use seeds). */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** A question from a fact: both orders get asked (7 × 4 AND 4 × 7). */
export function questionOf(f, rand = Math.random) {
  const swap = f.a !== f.b && rand() < 0.5;
  const a = swap ? f.b : f.a;
  const b = swap ? f.a : f.b;
  return { a, b, ans: a * b, key: factKey(a, b), digits: digitsOf(a * b) };
}
/**
 * A deck of `n` questions for a station.
 *   table  — the twelve facts shuffled, again and again (never the same fact
 *            twice in a row across the join) — no skip-counting up the table
 *   mix / grand — weighted draws (new family 60 %, earlier families 40 %,
 *            weak facts more often), never a fact asked in the last few
 */
export function makeDeck(station, { n = 140, rand = Math.random, stats = null, today = 0 } = {}) {
  const st = typeof station === "string" ? stationOf(station) : station;
  const out = [];
  if (!st) return out;
  if (st.kind === "table") {
    const facts = tableFacts(st.table);
    // Never three in a row going up (or down) the table — that would let a
    // student skip-count instead of recalling.
    const counts = (list) => list.some((f, i) => i >= 2 && Math.abs(f.b - list[i - 1].b) === 1 && f.b - list[i - 1].b === list[i - 1].b - list[i - 2].b);
    while (out.length < n) {
      const tail = out.slice(-2).map((q) => ({ b: q.a === st.table ? q.b : q.a, key: q.key }));
      let cyc = shuffle(facts, rand);
      for (let tries = 0; tries < 40; tries++) {
        const joined = [...tail, ...cyc];
        if (!(tail.length && cyc[0].key === tail[tail.length - 1].key) && !counts(joined)) break;
        cyc = shuffle(facts, rand);
      }
      for (const f of cyc) out.push(questionOf(f, rand));
    }
    return out.slice(0, n);
  }
  const pool = stationPool(st, stats, today);
  return weightedDeck(pool, n, rand);
}
export function weightedDeck(pool, n, rand = Math.random) {
  const out = [];
  if (!pool.length) return out;
  const gap = Math.min(8, Math.floor(pool.length / 2));
  const recent = [];
  while (out.length < n) {
    const ok = pool.filter((f) => !recent.includes(f.key));
    const list = ok.length ? ok : pool;
    const total = list.reduce((a, f) => a + f.w, 0);
    let r = rand() * total;
    let pick = list[list.length - 1];
    for (const f of list) {
      r -= f.w;
      if (r <= 0) { pick = f; break; }
    }
    out.push(questionOf(pick, rand));
    recent.push(pick.key);
    if (recent.length > gap) recent.shift();
  }
  return out;
}
/**
 * The TEMPLE WARM-UP deck: the facts due for review (most overdue first),
 * then the weakest facts seen so far, cycled. Empty if nothing's been seen.
 */
export function warmupDeck(stats, today, { n = 100, rand = Math.random } = {}) {
  const due = dueFacts(stats, today);
  const seen = Object.keys(stats || {}).filter((k) => stats[k] && stats[k].n > 0 && factOf(k));
  if (!seen.length) return [];
  const weak = seen
    .filter((k) => !due.includes(k))
    .sort((p, q) => weakness(stats[q], today) - weakness(stats[p], today) || (stats[p].box || 0) - (stats[q].box || 0));
  const order = [...due, ...weak].slice(0, 30);
  const pool = order.map((k, i) => ({ ...factOf(k), w: i < due.length ? 3 : 1 }));
  return weightedDeck(pool, n, rand);
}

/** Put a missed fact back into the deck `at` questions on (a copy). */
export function reinsert(rounds, from, q, gaps = [3]) {
  const out = [...rounds];
  let shift = 0;
  for (const g of gaps) {
    const i = Math.min(out.length, from + g + shift);
    const flip = { ...q, a: q.b, b: q.a };
    out.splice(i, 0, shift % 2 ? q : flip);
    shift++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The quick way — shown when an answer slips (built on the family order).
// ---------------------------------------------------------------------------
const STRATEGY_ORDER = [1, 10, 11, 5, 2, 4, 8, 3, 6, 9, 12, 7];
/**
 * A one-line strategy for a × b, using the factor from the EARLIEST family
 * ("× 10" before "× 5" before "× 2" …) — so a slip on 8 × 7 says "double the
 * 4s", the way the temple taught it. Always ends "= answer".
 */
export function strategyFor(a, b) {
  const f = STRATEGY_ORDER.find((x) => x === a || x === b) ?? a;
  const o = f === a ? b : a;
  const ans = a * b;
  const q = `${f} × ${o}`;
  switch (f) {
    case 1: return `Anything × 1 stays the same: ${q} = ${ans}`;
    case 10: return `× 10 moves the digits one place: ${o} → ${ans}`;
    case 11:
      if (o <= 9) return `${q}: write the ${o} twice → ${ans}`;
      return `${o} × 10 + ${o}: ${o * 10} + ${o} = ${ans}`;
    case 5: return `Half of ${o} × 10: half of ${o * 10} = ${ans}`;
    case 2: return `Double ${o}: ${o} + ${o} = ${ans}`;
    case 4: return `Double, then double again: ${o} → ${o * 2} → ${ans}`;
    case 8: return `Double the 4s: 4 × ${o} = ${o * 4}, double it = ${ans}`;
    case 3: return `Double, then one more ${o}: ${o * 2} + ${o} = ${ans}`;
    case 6: return o === 6 ? `6 × 6 = 36 — a square: 6 rows of 6` : `Double the 3s: 3 × ${o} = ${o * 3}, double it = ${ans}`;
    case 9: return `10 lots take away one lot: ${o * 10} − ${o} = ${ans}`;
    case 12: return `10 lots + 2 lots: ${o * 10} + ${o * 2} = ${ans}`;
    case 7: return o === 7 ? `7 × 7 = 49 — a square: 7 rows of 7` : `5 lots + 2 lots: ${o * 5} + ${o * 2} = ${ans}`;
    default: return `${q} = ${ans}`;
  }
}

// ---------------------------------------------------------------------------
// Fact records (per device) — fluency + spaced review.
// ---------------------------------------------------------------------------
export const FACTS_KEY = "mma-tables-facts";
/** A local day number (days since 1970 in the device's own time zone). */
export function dayNumber(now = Date.now()) {
  const d = new Date(now);
  return Math.floor((now - d.getTimezoneOffset() * 60000) / 86400000);
}
export function readFactStats() {
  try {
    const raw = localStorage.getItem(FACTS_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
export function writeFactStats(stats) {
  try {
    localStorage.setItem(FACTS_KEY, JSON.stringify(stats));
  } catch {
    /* a nicety only */
  }
}
/** Fluent = answered fast on two different days (a slip resets it). */
export function isFluent(s) {
  return Boolean(s && Array.isArray(s.fd) && s.fd.length >= 2);
}
/**
 * Record one answer (returns a NEW stats object). `ms` = from the question
 * appearing to the answer going in.
 */
export function recordAnswer(stats, key, { right, ms = 0, digits = 2, today = dayNumber() }) {
  const prev = stats[key] || { n: 0, r: 0, w: 0, fd: [], box: 0, due: today };
  const s = { ...prev, fd: [...(prev.fd || [])], n: prev.n + 1, last: today };
  if (right) {
    s.r++;
    s.lastWrong = false;
    const fast = ms <= fastLimitMs(digits);
    s.ms = Math.round(ms);
    if (fast) {
      if (!s.fd.includes(today)) s.fd = [...s.fd, today].slice(-4);
      // One box up per day at most (a fact can't race to 30 days in one sitting).
      if (s.boxDay !== today) {
        s.box = Math.min(REVIEW_DAYS.length - 1, (s.box || 0) + 1);
        s.boxDay = today;
      }
      s.due = today + REVIEW_DAYS[s.box];
    } else {
      s.due = today + 1;
    }
  } else {
    s.w++;
    s.lastWrong = true;
    s.fd = [];
    s.box = 0;
    s.boxDay = today;
    s.due = today;
  }
  return { ...stats, [key]: s };
}
/** Facts due for review today (seen before), most overdue / lowest box first. */
export function dueFacts(stats, today = dayNumber()) {
  return Object.keys(stats || {})
    .filter((k) => factOf(k) && stats[k] && stats[k].n > 0 && (stats[k].due ?? today) <= today)
    .sort((p, q) => (stats[p].due - stats[q].due) || ((stats[p].box || 0) - (stats[q].box || 0)));
}
/** A square cell's state: unseen | missed | learning | fluent (+ due). */
export function factState(s, today = dayNumber()) {
  if (!s || !s.n) return { state: "unseen", due: false };
  const due = (s.due ?? today) <= today;
  if (s.lastWrong) return { state: "missed", due: true };
  if (isFluent(s)) return { state: "fluent", due };
  return { state: "learning", due };
}
export function squareSummary(stats, today = dayNumber()) {
  let fluent = 0, learning = 0, missed = 0, seen = 0;
  for (const f of ALL_FACTS) {
    const st = factState(stats[f.key], today).state;
    if (st !== "unseen") seen++;
    if (st === "fluent") fluent++;
    else if (st === "learning") learning++;
    else if (st === "missed") missed++;
  }
  return { fluent, learning, missed, seen, total: ALL_FACTS.length, due: dueFacts(stats, today).length };
}

// ---------------------------------------------------------------------------
// Bests, medals, unlocks (bests sync to the cloud like every world's).
// ---------------------------------------------------------------------------
export const TABLES_BEST_KEYS = Object.fromEntries(STATION_KEYS.map((k) => [k, `mma-tables-${k}-best`]));
export function readTablesBest(key) {
  try {
    const v = Number(localStorage.getItem(TABLES_BEST_KEYS[key]));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}
export function writeTablesBest(key, score) {
  try {
    if (score > readTablesBest(key)) localStorage.setItem(TABLES_BEST_KEYS[key], String(score));
  } catch {
    /* a nicety only */
  }
}
export function allBests() {
  return Object.fromEntries(STATION_KEYS.map((k) => [k, readTablesBest(k)]));
}
/** Is station i open? The first always; then a 🥉 on the one before. */
export function stationOpen(key, bests = allBests(), admin = false) {
  const i = stationIndex(key);
  if (i <= 0 || admin) return i >= 0;
  const prev = STATIONS[i - 1];
  return medalRank(medalFor(prev, bests[prev.key] || 0)) >= 1;
}
/** The station to go to next: the first open one without a 🥉, then without 🥇. */
export function nextStation(bests = allBests()) {
  const open = STATIONS.filter((s) => stationOpen(s.key, bests));
  return open.find((s) => !medalFor(s, bests[s.key] || 0))
    || STATIONS.find((s) => stationOpen(s.key, bests) && medalRank(medalFor(s, bests[s.key] || 0)) < 3)
    || null;
}
/** The rows for the journey (+ any trophy list): one per station. */
export function tablesTrophyRows(bests = allBests()) {
  return STATIONS.map((s) => {
    const best = bests[s.key] || 0;
    const t = targetsFor(s);
    const medal = medalFor(s, best);
    return {
      key: s.key, icon: s.icon, name: s.name, unit: "right", best, targets: t, medal,
      pct: Math.max(0, Math.min(100, Math.round((best / Math.max(1, t.gold)) * 100))),
      open: stationOpen(s.key, bests),
    };
  });
}

/** Coins for a finished timed round: 1 per 5 right + any new medal's bonus. */
export function roundCoins(station, score, bestBefore) {
  const before = medalRank(medalFor(station, bestBefore));
  const after = medalRank(medalFor(station, score));
  let bonus = 0;
  for (const id of ["bronze", "silver", "gold"]) if (RANK[id] > before && RANK[id] <= after) bonus += MEDAL_COINS[id];
  return Math.floor(score / 5) + bonus;
}
