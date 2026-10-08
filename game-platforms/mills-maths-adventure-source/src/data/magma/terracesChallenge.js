/**
 * TENFOLD TERRACES (host Ms. Ewings) — pure logic for the ×10 PLACE-VALUE
 * challenge.
 *
 * PEDAGOGY — Siemon names the multiplicative structure of place value
 * (each place is TEN TIMES the one to its right) as the idea most students
 * never get, and Hurst & Hurrell found half of Year 6 could not explain
 * the ×10 "rules" they use. The terraces make the structure physical: each
 * stone terrace is ten times the one below it, the decimal point is a FIXED
 * glowing orb, and multiplying by ten moves every DIGIT up one terrace. The
 * point never moves — the digits do — which kills the "just add a zero"
 * rule at the exact place it breaks (3.5 × 10 is 35, not 3.50). Zeros are
 * PLACEHOLDERS: they fade out while the digits move and drop back in to hold
 * the empty places once the student has said the number. The same idea then
 * powers the multiples-of-ten facts (30 × 40 is 3 × 4 = 12, climbed two
 * terraces) and the decimal facts (0.4 × 6 is 24, slid DOWN one terrace).
 *
 * All values are exact integers of THOUSANDTHS (3.5 → 3500) — no floats.
 * Terraces run from thousands (place 3) down to thousandths (place −3).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  whole × 10/100/1000   47 × 100
 *   S2  decimals × 10/100     3.5 × 10, 0.42 × 100, 2.06 × 10
 *   S3  ÷ 10 / ÷ 100          470 ÷ 10, 35 ÷ 100, 6 ÷ 10
 *   S4  tens facts            30 × 40 = 3 × 4, two terraces up
 *   S5  decimal facts         0.4 × 6 = 24, one terrace down
 *
 * Scoring (per round, max 25):
 *   S1–S3  slide the digits (first Lock) 10 · type the answer 15
 *   S4–S5  the fact 5 · slide 8 · type the answer 12
 */
import { buildSet, randInt, pick, fmtThousandths, parseThousandths } from "./magmaMath.js";

export const TERRACE_TOP = 3; // thousands
export const TERRACE_BOTTOM = -3; // thousandths
export const TERRACE_NAMES = {
  3: "Thousands", 2: "Hundreds", 1: "Tens", 0: "Ones", [-1]: "Tenths", [-2]: "Hundredths", [-3]: "Thousandths",
};
export const TERRACE_SHORT = { 3: "Th", 2: "H", 1: "T", 0: "O", [-1]: "t", [-2]: "h", [-3]: "th" };

const POW = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];

export function terracePoints(r) {
  return r.fact ? { fact: 5, slide: 8, result: 12 } : { fact: 0, slide: 10, result: 15 };
}

/** The digit STONES of a value (thousandths): first→last non-zero digit. */
export function terraceStones(v) {
  const out = [];
  for (let p = TERRACE_TOP + 1; p >= TERRACE_BOTTOM; p--) {
    const d = Math.floor(v / POW[p + 3]) % 10;
    out.push({ place: p, digit: d });
  }
  const nz = out.filter((s) => s.digit !== 0);
  if (!nz.length) return [];
  const hi = nz[0].place, lo = nz[nz.length - 1].place;
  return out.filter((s) => s.place <= hi && s.place >= lo);
}

/** Places that need a placeholder ZERO once stones sit at `stones`. */
export function terracePlaceholders(stones) {
  if (!stones.length) return [0];
  const places = stones.map((s) => s.place);
  const hi = Math.max(0, ...places), lo = Math.min(0, ...places);
  const out = [];
  for (let p = hi; p >= lo; p--) if (!places.includes(p)) out.push(p);
  return out;
}

/** Shift stones by s places (positive = ×10s). */
export function shiftStones(stones, s) {
  return stones.map((st) => ({ ...st, place: st.place + s }));
}

/** Can the stones shift by s and stay on the terraces? */
export function canShift(stones, s) {
  return stones.every((st) => st.place + s <= TERRACE_TOP && st.place + s >= TERRACE_BOTTOM);
}

const T = (whole, thou = 0) => whole * 1000 + thou;

function times(i, rand) {
  const k = pick([1, 2, 3], rand);
  let w;
  for (;;) {
    const kind = randInt(0, 2, rand);
    if (kind === 0) w = randInt(2, 9, rand);
    else if (kind === 1) { do w = randInt(11, 99, rand); while (w % 10 === 0); }
    else w = pick([120, 230, 405, 360, 508, 750], rand);
    if (w * POW[k] <= 9999) break;
  }
  return { start: T(w), shift: k, text: `${w} × ${POW[k]}` };
}

function decTimes(i, rand) {
  const x = randInt(1, 9, rand), y = randInt(1, 9, rand), z = randInt(1, 9, rand);
  const forms = [
    { start: T(x, y * 100), shift: 1 }, // 3.5 × 10 — the "add a zero" trap
    { start: T(x, y * 100), shift: 2 }, // 3.5 × 100
    { start: T(0, x * 100 + y * 10), shift: 1 }, // 0.42 × 10
    { start: T(0, x * 100 + y * 10), shift: 2 }, // 0.42 × 100
    { start: T(x, y * 10), shift: 1 }, // 2.06 × 10
    { start: T(x, y * 100 + z * 10), shift: 1 }, // 2.45 × 10
  ];
  // Round 4 of every set (the first S2 round) is ALWAYS the trap.
  const f = i === 3 ? forms[0] : pick(forms, rand);
  return { ...f, text: `${fmtThousandths(f.start)} × ${POW[f.shift]}` };
}

function divide(i, rand) {
  const x = randInt(1, 9, rand), y = randInt(1, 9, rand), z = randInt(1, 9, rand);
  const forms = [
    { start: T(x * 100 + y * 10), shift: -1 }, // 470 ÷ 10
    { start: T(x * 10 + y), shift: -1 }, // 47 ÷ 10
    { start: T(x * 10 + y), shift: -2 }, // 35 ÷ 100
    { start: T(x), shift: -1 }, // 6 ÷ 10
    { start: T(x * 100 + y * 10 + z), shift: -2 }, // 345 ÷ 100
    { start: T(x, y * 100), shift: -1 }, // 4.5 ÷ 10
  ];
  const f = pick(forms, rand);
  return { ...f, text: `${fmtThousandths(f.start)} ÷ ${POW[-f.shift]}` };
}

function tensFact(i, rand) {
  for (;;) {
    const a = randInt(2, 9, rand), b = randInt(2, 9, rand);
    const form = randInt(0, 3, rand);
    let A, B, shift;
    if (form === 0) { A = a * 10; B = b; shift = 1; }
    else if (form === 1) { A = a * 10; B = b * 10; shift = 2; }
    else if (form === 2) { A = a * 100; B = b; shift = 2; }
    else { A = a * 10; B = b * 100; shift = 3; }
    if (a * b * POW[shift] > 9999) continue;
    return { start: T(a * b), shift, fact: [a, b], text: `${A} × ${B}` };
  }
}

function decFact(i, rand) {
  for (;;) {
    const a = randInt(2, 9, rand), b = randInt(2, 9, rand);
    const form = randInt(0, 3, rand);
    let text, shift, fa = a, fb = b;
    if (form === 0) { text = `0.${a} × ${b}`; shift = -1; }
    else if (form === 1) { text = `0.${a} × 0.${b}`; shift = -2; }
    else if (form === 2) { text = `0.0${a} × ${b}`; shift = -2; }
    else { fa = 10 + a; text = `1.${a} × ${b}`; shift = -1; }
    if (form === 3 && b > 5) continue; // keep the 1.x facts friendly (≤ 95)
    return { start: T(fa * fb), shift, fact: [fa, fb], text };
  }
}

const MAKERS = [times, decTimes, divide, tensFact, decFact];

export function generateTerracesSet(rand = Math.random) {
  return buildSet((i, stage) => {
    const r = MAKERS[stage](i, rand);
    const result = r.shift >= 0 ? r.start * POW[r.shift] : r.start / POW[-r.shift];
    const round = { ...r, result, sig: r.text };
    return { ...round, working: terraceWorking(round) };
  }, rand);
}

function terraceWorking(r) {
  const n = Math.abs(r.shift);
  const dir = r.shift > 0 ? "UP" : "DOWN";
  const move = `every digit moves ${n === 1 ? "ONE terrace" : n === 2 ? "TWO terraces" : "THREE terraces"} ${dir}`;
  const lines = [];
  if (r.fact) {
    lines.push(`Start with the fact: ${r.fact[0]} × ${r.fact[1]} = ${r.fact[0] * r.fact[1]}`);
    lines.push(r.shift > 0
      ? `The zeros make it ${POW[n]} times bigger — ${move}.`
      : `The decimals make it ${POW[n]} times smaller — ${move}.`);
  } else {
    lines.push(`${r.shift > 0 ? "×" : "÷"} ${POW[n]} → ${move}. The point stays put.`);
  }
  lines.push(`${r.text} = ${fmtThousandths(r.result)}`);
  return lines;
}

/** Grade the first Lock: { correct, note }. */
export function gradeTerraceSlide(r, s) {
  if (s === r.shift) {
    return { correct: true, note: `${Math.abs(s) === 1 ? "One terrace" : `${Math.abs(s)} terraces`} ${s > 0 ? "up" : "down"} — spot on!` };
  }
  const n = Math.abs(r.shift);
  const want = `${n === 1 ? "ONE terrace" : `${n} terraces`} ${r.shift > 0 ? "UP" : "DOWN"}`;
  if (Math.sign(s) !== Math.sign(r.shift) && s !== 0) {
    return { correct: false, note: `Wrong way! ${r.shift > 0 ? "Bigger" : "Smaller"} means ${want}.` };
  }
  return { correct: false, note: `Not quite — ${r.shift > 0 ? "× " : "÷ "}${POW[n]} moves every digit ${want}.` };
}

/** The typed answer (decimals OK, compared exactly). */
export function checkTerraceResult(r, text) {
  const v = parseThousandths(text);
  if (v === null) return { valid: false, correct: false };
  return { valid: true, correct: v === r.result };
}

export function checkTerraceFact(r, text) {
  const t = String(text ?? "").trim();
  if (!/^\d+$/.test(t)) return { valid: false, correct: false };
  return { valid: true, correct: Number(t) === r.fact[0] * r.fact[1] };
}
