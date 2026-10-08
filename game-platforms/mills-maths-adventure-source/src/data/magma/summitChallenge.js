/**
 * STRATEGY SUMMIT (the crater rim, host Ms. Bacon) — pure logic for the
 * CAPSTONE: choosing a multiplicative strategy.
 *
 * PEDAGOGY — Siemon's top zones of multiplicative thinking ("strategic
 * thinking", "reflective knowing") are about CHOOSING: looking at the
 * numbers first and picking the property that makes them easy. Fosnot &
 * Dolk call it computational fluency — not one method, but the right
 * method for these numbers. Each round shows THREE rune tablets, each the
 * same problem rewritten a different way (all correct — the summit never
 * shows a wrong method): halve-and-double, factor to a ten, split by place
 * value, round and adjust, multiples of ten, the nines trick, chunked
 * division, and a ratio ("for each") step. The student picks the EASIEST
 * way for these numbers, then does it — one step per line, typing the last.
 * Mirrors Snowball Sums' Aurora Lookout so the two capstones feel the same.
 *
 * Eight problem ARCHETYPES on a fixed 15-round schedule (every archetype in
 * every set). The best tablet is unambiguous by construction (e.g. the
 * split rounds avoid 4s and 8s, where doubling twice is just as good).
 *
 * Scoring (per round, max 25):
 *   the easiest tablet 10 · either other tablet 5
 *   the answer, worked your way 15
 */
import { buildSet, randInt, pick, shuffle } from "./magmaMath.js";

export const SUMMIT_BEST_POINTS = 10;
export const SUMMIT_OTHER_POINTS = 5;
export const SUMMIT_ANSWER_POINTS = 15;

export const SUMMIT_SCHEDULE = [
  "split", "halve", "tens", "round", "factor", "nines", "rate", "chunk",
  "halve", "split", "round", "factor", "nines", "chunk", "rate",
];

const W = (key, name, show, steps) => ({ key, name, show, steps });

const ARCHETYPES = {
  // 6 × 23 — split by place value.
  split(rand) {
    const x = pick([3, 6, 7], rand);
    let y;
    do y = randInt(21, 74, rand); while (![1, 2, 3].includes(y % 10));
    const t = y - (y % 10), o = y % 10, up = t + 10;
    return {
      q: `${x} × ${y}`, answer: x * y,
      best: W("split", "Split it", `${x} × ${t} + ${x} × ${o}`, [`${x} × ${y} = ${x} × ${t} + ${x} × ${o}`, `= ${x * t} + ${x * o}`]),
      alts: [
        W("round", "Round and adjust", `${x} × ${up} − ${x} × ${up - y}`, [`${x} × ${y} = ${x} × ${up} − ${x} × ${up - y}`, `= ${x * up} − ${x * (up - y)}`]),
        x % 3 === 0
          ? W("factor", "Factor it", `${x / 3} × 3 × ${y}`, [`${x} × ${y} = ${x / 3} × (3 × ${y})`, `= ${x / 3} × ${3 * y}`])
          : W("counton", "Add up the groups", `${y} + ${y} + … (${x} times)`, [`${y} × ${x} = ${Array(x).fill(y).join(" + ")}`]),
      ],
    };
  },
  // 14 × 35 — halve one, double the other.
  halve(rand) {
    const [x, y] = pick([[14, 35], [16, 35], [18, 45], [14, 45], [12, 35], [16, 45], [18, 35], [12, 45]], rand);
    return {
      q: `${x} × ${y}`, answer: x * y,
      best: W("halve", "Halve and double", `${x / 2} × ${y * 2}`, [`${x} × ${y} = ${x / 2} × ${y * 2}`]),
      alts: [
        W("split", "Split it", `10 × ${y} + ${x - 10} × ${y}`, [`${x} × ${y} = 10 × ${y} + ${x - 10} × ${y}`, `= ${10 * y} + ${(x - 10) * y}`]),
        W("split2", "Split the other one", `${x} × 30 + ${x} × ${y - 30}`, [`${x} × ${y} = ${x} × 30 + ${x} × ${y - 30}`, `= ${x * 30} + ${x * (y - 30)}`]),
      ],
    };
  },
  // 30 × 40 — multiples of ten.
  tens(rand) {
    let a, b;
    do { a = randInt(2, 9, rand); b = randInt(2, 9, rand); } while (a === b);
    return {
      q: `${a * 10} × ${b * 10}`, answer: a * b * 100,
      best: W("tens", "Facts and tens", `${a} × ${b} × 100`, [`${a * 10} × ${b * 10} = ${a} × ${b} × 10 × 10`, `= ${a * b} × 100`]),
      alts: [
        W("onefact", "One ten at a time", `${a * 10} × ${b} × 10`, [`${a * 10} × ${b * 10} = ${a * 10} × ${b} × 10`, `= ${a * 10 * b} × 10`]),
        W("halve", "Halve and double", `${a * 20} × ${b * 5}`, [`${a * 10} × ${b * 10} = ${a * 20} × ${b * 5}`]),
      ],
    };
  },
  // 6 × 29 — round and adjust.
  round(rand) {
    const x = randInt(3, 8, rand);
    const y = pick([19, 29, 39, 49, 59], rand);
    const up = y + 1;
    return {
      q: `${x} × ${y}`, answer: x * y,
      best: W("round", "Round and adjust", `${x} × ${up} − ${x}`, [`${x} × ${y} = ${x} × ${up} − ${x} × 1`, `= ${x * up} − ${x}`]),
      alts: [
        W("split", "Split it", `${x} × ${y - 9} + ${x} × 9`, [`${x} × ${y} = ${x} × ${y - 9} + ${x} × 9`, `= ${x * (y - 9)} + ${x * 9}`]),
        W("split5", "Split at the five", `${x} × ${y - 4} + ${x} × 4`, [`${x} × ${y} = ${x} × ${y - 4} + ${x} × 4`, `= ${x * (y - 4)} + ${x * 4}`]),
      ],
    };
  },
  // 25 × 28 — factor to make a hundred.
  factor(rand) {
    const k = randInt(3, 9, rand);
    const y = 4 * k;
    return {
      q: `25 × ${y}`, answer: 100 * k,
      best: W("factor", "Make a hundred", `25 × 4 × ${k}`, [`25 × ${y} = 25 × 4 × ${k}`, `= 100 × ${k}`]),
      alts: [
        W("split", "Split it", `20 × ${y} + 5 × ${y}`, [`25 × ${y} = 20 × ${y} + 5 × ${y}`, `= ${20 * y} + ${5 * y}`]),
        W("halve", "Halve and double once", `50 × ${2 * k}`, [`25 × ${y} = 50 × ${2 * k}`]),
      ],
    };
  },
  // 9 × 34 — ten groups, take one away.
  nines(rand) {
    let y;
    do y = randInt(13, 48, rand); while (y % 10 === 0 || y % 10 === 5);
    const t = y - (y % 10), o = y % 10;
    return {
      q: `9 × ${y}`, answer: 9 * y,
      best: W("nines", "Ten groups, take one", `10 × ${y} − ${y}`, [`9 × ${y} = 10 × ${y} − 1 × ${y}`, `= ${10 * y} − ${y}`]),
      alts: [
        W("split", "Split it", `9 × ${t} + 9 × ${o}`, [`9 × ${y} = 9 × ${t} + 9 × ${o}`, `= ${9 * t} + ${9 * o}`]),
        W("factor", "Three threes", `3 × 3 × ${y}`, [`9 × ${y} = 3 × (3 × ${y})`, `= 3 × ${3 * y}`]),
      ],
    };
  },
  // 6 gems cost 15 — how much for 18? (for each / ratio)
  rate(rand) {
    for (;;) {
      const n = pick([4, 6, 8], rand);
      const c = pick([10, 14, 15, 18, 22], rand);
      if (c % n === 0) continue;
      const m = pick([3, 4, 5], rand);
      return {
        q: `${n} gems cost ${c} coins. ${n * m} gems?`, answer: c * m,
        best: W("times", "How many times as many?", `${n * m} is ${m} × ${n}, so ${m} × ${c}`, [`${n * m} gems = ${m} lots of ${n} gems`, `cost = ${m} × ${c}`]),
        alts: [
          W("unit", "Find one first", `1 gem = ${c} ÷ ${n}, then × ${n * m}`, [`1 gem = ${c} ÷ ${n} = ${c / n}`, `${n * m} gems = ${c / n} × ${n * m}`]),
          W("table", "Build a table", `${n} → ${c}, ${2 * n} → ${2 * c}, …`, [`${n} gems → ${c} · ${2 * n} gems → ${2 * c}`, `keep adding ${n} gems → ${c} coins until ${n * m}`]),
        ],
      };
    }
  },
  // 168 ÷ 12 — chunk out ten groups.
  chunk(rand) {
    const d = pick([12, 14, 16, 18], rand);
    const k = randInt(2, 8, rand);
    const q = 10 + k, D = q * d;
    return {
      q: `${D} ÷ ${d}`, answer: q,
      best: W("chunk", "Take out ten groups", `${10 * d} ÷ ${d} + ${k * d} ÷ ${d}`, [`${D} = ${10 * d} + ${k * d}`, `= ${10 * d} ÷ ${d} + ${k * d} ÷ ${d}`]),
      alts: [
        W("halve", "Halve both", `${D / 2} ÷ ${d / 2}`, [`${D} ÷ ${d} = ${D / 2} ÷ ${d / 2}`]),
        W("factor", "Divide in two steps", `${D} ÷ 2 ÷ ${d / 2}`, [`${D} ÷ ${d} = ${D} ÷ 2 ÷ ${d / 2}`, `= ${D / 2} ÷ ${d / 2}`]),
      ],
    };
  },
};

export const SUMMIT_ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

function makeRound(i, stage, rand) {
  const kind = SUMMIT_SCHEDULE[i];
  let a;
  for (let t = 0; t < 40; t++) {
    a = ARCHETYPES[kind](rand);
    // No tablet and no step may give the answer away.
    const re = new RegExp(`(^|[^0-9.])${a.answer}([^0-9.]|$)`);
    const leaks = [a.best, ...a.alts].some((w) => re.test(w.show) || w.steps.some((s) => re.test(s)));
    if (!leaks) break;
  }
  const choices = shuffle([{ ...a.best, best: true }, ...a.alts.map((w) => ({ ...w, best: false }))], rand);
  return {
    kind, q: a.q, answer: a.answer, choices,
    sig: `${kind}:${a.q}`,
    working: [`Easiest: ${a.best.show}`, ...a.best.steps, `= ${a.answer}`],
  };
}

export function generateSummitSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export function gradeSummitPick(r, key) {
  const c = r.choices.find((w) => w.key === key);
  if (!c) return { valid: false };
  return c.best
    ? { valid: true, best: true, points: SUMMIT_BEST_POINTS, note: `The easiest way — +${SUMMIT_BEST_POINTS}!` }
    : { valid: true, best: false, points: SUMMIT_OTHER_POINTS, note: `That works! There's an even easier tablet. +${SUMMIT_OTHER_POINTS}` };
}

export function checkSummitAnswer(r, text) {
  const t = String(text ?? "").trim().replace(/[,\s]/g, "").replace(/coins?$/i, "");
  if (!/^\d+$/.test(t)) return { valid: false, correct: false };
  return { valid: true, correct: Number(t) === r.answer };
}
