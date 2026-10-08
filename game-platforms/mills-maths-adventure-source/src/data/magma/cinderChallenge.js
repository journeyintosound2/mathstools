/**
 * CART TABLES (Cinder Cones, host Steve) — pure logic for the RATIO TABLE
 * challenge: multiplying AND dividing with the same tool.
 *
 * PEDAGOGY — the ratio table (Middleton & van den Heuvel-Panhuizen; Fosnot
 * & Dolk) is the "for each" idea made into a calculating tool: for each
 * cart, 24 rocks. Students build new columns with moves they TRUST —
 * double, halve, ×10, ÷10, add two columns, subtract one from another —
 * so 16 carts is 10 + 5 + 1 or double-double-double-double, and the
 * distributive and associative properties are used without being named.
 * The same table runs BACKWARDS for division (how many carts does 360 rocks
 * fill? build until the rocks row says 360 — Anghileri's chunking, in a
 * table) and handles non-unit rates (4 carts : 18 rocks → halve → 2 : 9),
 * which is proportional reasoning (Siemon's next big idea). The scene only
 * ever fills in the CARTS row; the student works out every rock count.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  double + add         3, 4, 5, 6, 8 carts
 *   S2  ×10 and halving      5, 10, 15, 20, 30, 50 carts
 *   S3  mix your moves       9, 11, 12, 16, 18, 19, 21, 25 carts
 *   S4  run it backwards     "360 rocks — how many carts?" (division)
 *   S5  not one cart         4 : 18, 3 : 5 … (non-unit rates)
 *
 * Scoring (per round, max 25):
 *   reach the target column     15 (− 3 for each wrong rock count, min 6)
 *   efficiency vs the fewest columns possible: equal 10 · one more 6 · else 3
 * A full table (8 new columns) without the target ends the round.
 */
import { buildSet, pick, randInt } from "./magmaMath.js";

export const CINDER_REACH_POINTS = 15;
export const CINDER_MISS_PENALTY = 3;
export const CINDER_REACH_MIN = 6;
export const CINDER_EFF_POINTS = [10, 6, 3];
export const CINDER_MAX_NEW = 8;
const MAX_CARTS = 1000;

export const CINDER_OPS = [
  { id: "x2", label: "× 2", arity: 1 },
  { id: "h2", label: "÷ 2", arity: 1 },
  { id: "x10", label: "× 10", arity: 1 },
  { id: "d10", label: "÷ 10", arity: 1 },
  { id: "add", label: "+", arity: 2 },
  { id: "sub", label: "−", arity: 2 },
];

/** Carts value an op makes from column cart values (null if not allowed). */
export function cinderOpCarts(op, a, b) {
  let c;
  if (op === "x2") c = a * 2;
  else if (op === "h2") c = a / 2;
  else if (op === "x10") c = a * 10;
  else if (op === "d10") c = a / 10;
  else if (op === "add") c = b === undefined ? null : a + b;
  else if (op === "sub") c = b === undefined ? null : Math.abs(a - b);
  if (c === null || !Number.isInteger(c) || c <= 0 || c > MAX_CARTS) return null;
  return c;
}

/** Rocks for a carts value at the round's rate (null if not whole). */
export function cinderRocks(r, carts) {
  const v = (carts * r.r0) / r.c0;
  return Number.isInteger(v) ? v : null;
}

/** The op as an exact op on BOTH rows (rocks may refuse to halve). */
export function cinderApply(r, op, colA, colB) {
  const c = cinderOpCarts(op, colA[0], colB ? colB[0] : undefined);
  if (c === null) return null;
  const rocks = cinderRocks(r, c);
  if (rocks === null) return null;
  return [c, rocks];
}

const OP_TEXT = { x2: "× 2", h2: "÷ 2", x10: "× 10", d10: "÷ 10", add: "+", sub: "−" };

const _cache = new Map();
/**
 * The fewest NEW columns that reach the target carts value, with one such
 * path (breadth-first over sets of cart values; depth ≤ 5).
 */
export function cinderBestPath(r) {
  const key = `${r.c0}:${r.r0}>${r.targetCarts}`;
  if (_cache.has(key)) return _cache.get(key);
  const ok = (c) => c !== null && cinderRocks(r, c) !== null;
  let frontier = [{ vals: [r.c0], path: [] }];
  const seen = new Set([String(r.c0)]);
  let found = null;
  for (let depth = 1; depth <= 5 && !found; depth++) {
    const next = [];
    for (const st of frontier) {
      const v = st.vals;
      const cands = [];
      for (let i = 0; i < v.length; i++) {
        for (const op of ["x2", "h2", "x10", "d10"]) cands.push({ op, i, c: cinderOpCarts(op, v[i]) });
        for (let j = i + 1; j < v.length; j++) {
          cands.push({ op: "add", i, j, c: cinderOpCarts("add", v[i], v[j]) });
          cands.push({ op: "sub", i, j, c: cinderOpCarts("sub", v[i], v[j]) });
        }
      }
      for (const cd of cands) {
        if (!ok(cd.c) || v.includes(cd.c)) continue;
        const step = { op: cd.op, a: v[cd.i], b: cd.j !== undefined ? v[cd.j] : undefined, c: cd.c };
        if (cd.c === r.targetCarts) { found = [...st.path, step]; break; }
        if (depth === 5) continue;
        const vals = [...v, cd.c].sort((x, y) => x - y);
        const k = vals.join(",");
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ vals, path: [...st.path, step] });
      }
      if (found) break;
    }
    frontier = next.length > 6000 ? next.slice(0, 6000) : next;
  }
  const res = found ? { min: found.length, path: found } : { min: 6, path: [] };
  _cache.set(key, res);
  return res;
}

const UNIT_RATES = [6, 8, 12, 15, 24, 25, 16];
const S5_BASES = [[4, 18], [3, 5], [2, 7], [4, 6], [5, 12], [6, 15], [4, 10]];

function makeRound(i, stage, rand) {
  // Every table needs at least two moves (one move is just a fact).
  for (let t = 0; t < 30; t++) {
    const r = makeRoundOnce(i, stage, rand);
    if (r.min >= 2 || t === 29) return r;
  }
  return null;
}

function makeRoundOnce(i, stage, rand) {
  let c0 = 1, r0, targetRow = "top", targetCarts;
  if (stage < 4) r0 = pick(UNIT_RATES, rand);
  if (stage === 0) targetCarts = pick([3, 4, 5, 6, 8], rand);
  else if (stage === 1) targetCarts = pick([5, 10, 15, 20, 30, 50], rand);
  else if (stage === 2) targetCarts = pick([9, 11, 12, 16, 18, 19, 21, 25], rand);
  else if (stage === 3) {
    targetRow = "bottom";
    targetCarts = pick([11, 12, 14, 15, 16, 20, 25, 30, 40], rand);
  } else {
    [c0, r0] = pick(S5_BASES, rand);
    const unit = c0; // carts must be a multiple of c0 / gcd for whole rocks
    let k;
    do k = randInt(2, 8, rand); while (k * unit === c0);
    targetCarts = k * unit;
    if (cinderRocks({ c0, r0 }, targetCarts) === null) targetCarts = c0 * 3;
    targetRow = rand() < 0.5 ? "top" : "bottom";
  }
  const r = { c0, r0, targetRow, targetCarts };
  r.targetRocks = cinderRocks(r, targetCarts);
  const best = cinderBestPath(r);
  return {
    ...r,
    sig: `${c0}:${r0}>${targetCarts}${targetRow}`,
    min: best.min,
    working: cinderWorking(r, best.path),
  };
}

function cinderWorking(r, path) {
  const lines = [`${r.c0} cart${r.c0 > 1 ? "s" : ""} → ${r.r0} rocks`];
  for (const s of path) {
    const rocks = cinderRocks(r, s.c);
    const how = s.b !== undefined ? `${s.a} ${OP_TEXT[s.op]} ${s.b}` : `${s.a} ${OP_TEXT[s.op]}`;
    lines.push(`${how} → ${s.c} carts → ${rocks} rocks`);
  }
  lines.push(r.targetRow === "top"
    ? `${r.targetCarts} carts carry ${r.targetRocks} rocks.`
    : `${r.targetRocks} rocks fill ${r.targetCarts} carts.`);
  return lines;
}

export function generateCinderSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The question line for a round. */
export function cinderQuestion(r) {
  const rate = r.c0 === 1 ? `Each cart carries ${r.r0} rocks.` : `${r.c0} carts carry ${r.r0} rocks.`;
  return r.targetRow === "top"
    ? { rate, ask: `How many rocks fill ${r.targetCarts} carts?` }
    : { rate, ask: `How many carts do ${r.targetRocks} rocks fill?` };
}

/** Has a column hit the target? */
export function cinderHit(r, col) {
  return col[0] === r.targetCarts;
}

/** Efficiency points for a finished table (`used` new columns). */
export function cinderEfficiency(r, used) {
  if (used <= r.min) return CINDER_EFF_POINTS[0];
  if (used <= r.min + 1) return CINDER_EFF_POINTS[1];
  return CINDER_EFF_POINTS[2];
}

export function cinderReachPoints(misses) {
  return Math.max(CINDER_REACH_MIN, CINDER_REACH_POINTS - CINDER_MISS_PENALTY * misses);
}
