/**
 * WATERFALL BARRELS (Waterfall Pool, host Trevor) — pure logic: a RATE is a
 * ratio of two DIFFERENT measures — litres PER second, beats PER minute
 * (NSW MA4-RAT-C-01: "explain the differences between ratios and rates",
 * "convert between units for rates"). As the time grows, the water grows
 * with it (covariation) — the ladder shows both at once.
 *
 * A bamboo pipe from the falls fills wooden barrels: "4 L every 10 s" is the
 * first rung, SECONDS on the top vine and LITRES below.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  how much?         "4 L every 10 s. How much in 1 minute (60 s)?"
 *   S2  fill it           "The barrel holds 30 L. Set the timer." (the
 *                         litres vine leads; type the seconds — a wrong time
 *                         over- or under-fills the barrel in the scene)
 *   S3  per minute, per hour  two ladders in a row: litres in 1 minute, then
 *                         a MINUTES ladder from that rung to 1 hour
 *   S4  two pipes         a three-vine ladder sharing SECONDS: both pipes to
 *                         the same time, then the total they pour together
 *   S5  rates everywhere  heartbeats per minute, drumbeats, ants carrying
 *                         leaves, rain in mm per hour
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number.
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import { rungFor, fmtVal } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import { SEC, MIN, LIT, BEATS, DRUMS, LEAVES, RAIN, ALL_MOVES } from "./jungleUnits.js";

// Pipes: [litres, seconds].
const PIPES = [[4, 10], [3, 20], [2, 5], [5, 12], [6, 15], [3, 4], [5, 6], [7, 10], [2, 3], [9, 20], [4, 6], [8, 15], [3, 8], [5, 4]];

const flow = (s, l) => ({ top: SEC, bottom: LIT, a: s, b: l });

function makeRound(i, stage, rand) {
  for (let t = 0; t < 160; t++) {
    const r = [howMuch, fillIt, perHour, twoPipes, everywhere][stage](rand, i % 3);
    if (r) return r;
  }
  return howMuch(rand);
}

// A target one move away (a straight "× 6") now and then; most rounds need
// two or more rungs. Rates-everywhere rounds may always be one move.
function base(L, drive, target, extra, rand = Math.random, oneOk = 0.3) {
  const r = {
    kind: "reach",
    layout: "single",
    ladders: [{ L, start: [[L.a, L.b]] }],
    drive, moves: ALL_MOVES, maxDrive: Math.max(target * 2, (drive === "top" ? L.a : L.b) * 12),
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    ...extra,
  };
  if (!planRound(r, 4) || !(r.solve[0].steps.length >= 2 || rand() < oneOk)) return null;
  return r;
}

function howMuch(rand) {
  const [l, s] = pick(PIPES, rand);
  const T = pick([60, 30, 90, 45, 120, 75, 40, 100], rand);
  if (T === s) return null;
  const L = flow(s, l);
  const goal = rungFor(L, "top", T);
  if (!goal || goal[1] > 80) return null;
  const r = base(L, "top", T, { goal, fill: { litres: goal[1], seconds: T } }, rand);
  if (!r) return null;
  const when = T === 60 ? "1 minute (60 s)" : T === 120 ? "2 minutes (120 s)" : `${T} s`;
  r.q = { lead: `💧 The pipe pours ${l} L every ${s} s.`, ask: `How much water in ${when}?` };
  r.sig = `much:${l}/${s}>${T}`;
  r.working = solveLines(r, `${l} L every ${s} s.`);
  r.working.push(`${T} s pours ${goal[1]} L.`);
  r.celebrate = `💧 ${goal[1]} L in ${T} s`;
  return r;
}

function fillIt(rand) {
  const [l, s] = pick(PIPES, rand);
  const C = pick([24, 30, 36, 40, 45, 48, 50, 60, 27, 35], rand);
  if (C === l) return null;
  const L = flow(s, l);
  const goal = rungFor(L, "bottom", C);
  if (!goal || goal[0] > 240) return null;
  const r = base(L, "bottom", C, { goal, fill: { litres: C, seconds: goal[0], barrel: C } }, rand);
  if (!r) return null;
  r.q = { lead: `💧 The pipe pours ${l} L every ${s} s. The barrel holds ${C} L.`, ask: "How many seconds to fill it to the brim?" };
  r.sig = `fill:${l}/${s}>${C}`;
  r.working = solveLines(r, `${l} L every ${s} s.`);
  r.working.push(`${C} L takes ${goal[0]} s.`);
  r.celebrate = `🪣 ${C} L in ${goal[0]} s — full to the brim`;
  return r;
}

function perHour(rand) {
  const [l, s] = pick(PIPES, rand);
  if (60 % s !== 0 && (60 * l) % s !== 0) return null;
  const L1 = flow(s, l);
  const g1 = rungFor(L1, "top", 60);
  if (!g1 || s === 60) return null;
  const X = g1[1];
  const L2 = { top: MIN, bottom: LIT, a: 1, b: X };
  const r = {
    kind: "chain",
    layout: "chain",
    ladders: [{ L: L1, start: [[s, l]], name: "Seconds" }, { L: L2, start: [[1, X]], name: "Minutes" }],
    drive: "top", moves: [...ALL_MOVES, "x10"], maxDrive: 240,
    legs: ["💧 Litres in 1 minute", "⏳ Litres in 1 hour"],
    phases: [
      { type: "build", goals: [{ li: 0, target: 60 }], leg: 0, ask: "How many litres in 1 minute (60 s)?" },
      { type: "build", goals: [{ li: 1, target: 60 }], leg: 1, ask: "So how many litres in 1 hour (60 minutes)?", say: `${X} L every minute — now build the MINUTES ladder.` },
    ],
    fill: { litres: X * 60, seconds: 3600, perHour: true },
    legDone: [`60 s ↔ ${X} L`, `60 min ↔ ${X * 60} L`],
    sig: `hour:${l}/${s}`,
  };
  if (!planRound(r, 4) || r.solve[0].steps.length < 1) return null;
  r.q = { lead: `💧 The pipe pours ${l} L every ${s} s.`, ask: "Litres per minute — then per hour?" };
  r.working = solveLines(r, `${l} L every ${s} s.`);
  r.working.push(`${X} L a minute → ${X * 60} L an hour.`);
  r.celebrate = `💧 ${X} L a minute = ${X * 60} L an hour`;
  return r;
}

function twoPipes(rand) {
  const [[lA, sA], [lB, sB]] = shuffle(PIPES, rand).slice(0, 2);
  if (sA === sB) return null;
  const T = pick([20, 30, 40, 60, 24, 36, 45, 12, 15], rand);
  const A = flow(sA, lA), B = flow(sB, lB);
  const gA = rungFor(A, "top", T), gB = rungFor(B, "top", T);
  if (!gA || !gB || T === sA || T === sB) return null;
  if (gA[1] + gB[1] > 90) return null;
  const total = gA[1] + gB[1];
  const r = {
    kind: "fill",
    layout: "shared",
    ladders: [{ L: A, start: [[sA, lA]], name: "Pipe A" }, { L: B, start: [[sB, lB]], name: "Pipe B" }],
    drive: "top", moves: ALL_MOVES, maxDrive: T * 2,
    phases: [
      { type: "build", goals: [{ li: 0, target: T }, { li: 1, target: T }], hint: `Build BOTH pipes to ${T} s` },
      { type: "type", ask: `Together, how many litres in ${T} s?`, label: "A + B =", vine: LIT, answer: total, slipName: "the total" },
    ],
    fill: { litres: total, seconds: T, two: [gA[1], gB[1]] },
    sig: `two:${lA}/${sA}|${lB}/${sB}>${T}`,
  };
  if (!planRound(r, 4) || r.solve[0].steps.length < 2) return null;
  r.q = { lead: `💧 Pipe A: ${lA} L every ${sA} s. Pipe B: ${lB} L every ${sB} s.`, ask: `Both pour into one barrel for ${T} s.` };
  r.working = solveLines(r, `Both pipes to ${T} s:`);
  r.working.push(`${gA[1]} L + ${gB[1]} L = ${total} L.`);
  r.celebrate = `💧 ${gA[1]} L + ${gB[1]} L = ${total} L`;
  return r;
}

// Rates everywhere: [vine, lead text, start [per, amount], target, top vine, ask].
const EVERYWHERE = [
  { id: "heart", top: SEC, bottom: BEATS, pairs: [[15, 18], [10, 12], [15, 21], [12, 16], [20, 25], [10, 14], [15, 24]], lead: (a, b) => `💓 Your heart beats ${b} times in ${a} s.`, ask: "Beats in one minute (60 s)?", target: 60, done: (g) => `💓 ${g[1]} beats a minute` },
  { id: "drum", top: SEC, bottom: DRUMS, pairs: [[5, 8], [4, 6], [6, 10], [5, 9], [3, 4]], lead: (a, b) => `🥁 The drummer plays ${b} beats every ${a} s.`, ask: "How many beats in 30 s?", target: 30, done: (g) => `🥁 ${g[1]} beats in 30 s` },
  { id: "ants", top: MIN, bottom: LEAVES, pairs: [[5, 12], [4, 9], [6, 15], [3, 8], [5, 7]], lead: (a, b) => `🐜 The ants carry ${b} leaves every ${a} minutes.`, ask: "How many leaves in an hour (60 min)?", target: 60, done: (g) => `🍃 ${g[1]} leaves an hour` },
  { id: "rain", top: MIN, bottom: RAIN, pairs: [[20, 3], [15, 2], [30, 4], [12, 5], [20, 7]], lead: (a, b) => `🌧 The rain gauge fills ${b} mm every ${a} minutes.`, ask: "How much rain in an hour (60 min)?", target: 60, done: (g) => `🌧 ${g[1]} mm an hour` },
];

function everywhere(rand, which) {
  const ctx = which === 0 ? EVERYWHERE[0] : which === 1 ? pick([EVERYWHERE[1], EVERYWHERE[2]], rand) : EVERYWHERE[3];
  const [a, b] = pick(ctx.pairs, rand);
  const L = { top: ctx.top, bottom: ctx.bottom, a, b };
  const goal = rungFor(L, "top", ctx.target);
  if (!goal) return null;
  const r = base(L, "top", ctx.target, { goal, context: ctx.id }, rand, 1);
  if (!r) return null;
  r.q = { lead: ctx.lead(a, b), ask: ctx.ask };
  r.sig = `ev:${ctx.id}:${a}/${b}`;
  r.working = solveLines(r, ctx.lead(a, b));
  r.celebrate = ctx.done(goal);
  r.working.push(r.celebrate);
  return r;
}

export function generateBarrelsSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export { fmtVal };

/** (dev) one round of a stage, or null — for the generator checks. */
export const __makeRound = makeRound;
export const __parts = [howMuch, fillIt, perHour, twoPipes, (rand) => everywhere(rand, Math.floor(rand() * 3))];
