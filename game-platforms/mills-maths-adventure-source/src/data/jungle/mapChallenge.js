/**
 * TREASURE MAP (Canopy Lookout, host Ms. Mahoney) — pure logic: SCALE IS A
 * RATIO. A map's scale is the first rung of a ladder with MAP centimetres on
 * the top vine and REAL metres below; the bottom vine IS the trail — an
 * explorer walks it and digs where the student says, and the chest is there
 * (or isn't). NSW MA4-RAT-C-01 (ratios; scale in context).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  simple scale      1 cm = 10 m: the route is 7 cm — how far to walk?
 *   S2  scale bars        2 cm = 50 m: 7 cm → ? m
 *   S3  backwards         the trail is 175 m — how long is it on the map?
 *                         (the real vine leads; type map cm)
 *   S4  ratio scales      1 : 2500 — first say what 1 cm on the map is in
 *                         real metres (2500 cm = 25 m), then the route
 *   S5  long routes       1 : 25 000 and a two-leg route: both legs, then
 *                         the whole trip
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number.
 */
import { buildSet, pick } from "../magma/magmaMath.js";
import { rungFor, fmtVal } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import { CM1, MET, num, ALL_MOVES_10 } from "./jungleUnits.js";

export const MAP_CM = { ...CM1, icon: "🗺️", one: "map centimetre", many: "map cm" };
export const REAL_M = { ...MET, icon: "🥾", one: "real metre", many: "real metres" };

const ROUTES = [30, 40, 45, 60, 70, 75, 80, 90, 25, 35, 55, 65, 85]; // map tenths of a cm

function makeRound(i, stage, rand) {
  for (let t = 0; t < 150; t++) {
    const r = [simple, bars, backwards, ratioScale, longRoute][stage](rand);
    if (r) return r;
  }
  return simple(rand);
}

function route(L, drive, target, extra) {
  const r = {
    kind: "reach", layout: "single",
    ladders: [{ L, start: [[L.a, L.b]] }],
    drive, moves: ALL_MOVES_10,
    maxDrive: Math.max(target * 2, (drive === "top" ? L.a : L.b) * 12),
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    ...extra,
  };
  return planRound(r, 4) ? r : null;
}

function simple(rand) {
  const s = pick([10, 20, 5, 50, 25], rand);
  const L = { top: MAP_CM, bottom: REAL_M, a: 10, b: s };
  const R = pick(ROUTES, rand);
  const goal = rungFor(L, "top", R);
  if (!goal || goal[1] > 500) return null;
  const r = route(L, "top", R, { goal, scale: `1 cm = ${s} m` });
  if (!r) return null;
  r.sig = `s:${s}>${R}`;
  r.q = { lead: `🗺️ Scale: 1 cm on the map = ${s} m on the ground.`, ask: `The dotted route is ${fmtVal(MAP_CM, R)}. How far is the walk?` };
  r.working = solveLines(r, `1 cm ↔ ${s} m`);
  r.celebrate = `${fmtVal(MAP_CM, R)} on the map = ${goal[1]} m on the ground`;
  return r;
}

const BARS = [[20, 50], [40, 100], [20, 30], [50, 40], [30, 75], [40, 30], [20, 15], [50, 125]]; // [map tenths, m]

function bars(rand) {
  const [c, m] = pick(BARS, rand);
  const L = { top: MAP_CM, bottom: REAL_M, a: c, b: m };
  const R = pick(ROUTES, rand);
  const goal = rungFor(L, "top", R);
  if (!goal || R === c || goal[1] > 600) return null;
  const r = route(L, "top", R, { goal, scale: `${fmtVal(MAP_CM, c)} = ${m} m` });
  if (!r) return null;
  r.sig = `b:${c}/${m}>${R}`;
  r.q = { lead: `🗺️ The scale bar: ${fmtVal(MAP_CM, c)} = ${m} m.`, ask: `The route is ${fmtVal(MAP_CM, R)} on the map. How far is the walk?` };
  r.working = solveLines(r, `${fmtVal(MAP_CM, c)} ↔ ${m} m`);
  r.celebrate = `${fmtVal(MAP_CM, R)} = ${goal[1]} m`;
  return r;
}

function backwards(rand) {
  const [c, m] = pick([...BARS, [10, 10], [10, 20], [10, 25]], rand);
  const L = { top: MAP_CM, bottom: REAL_M, a: c, b: m };
  const R = pick(ROUTES, rand);
  const goal = rungFor(L, "top", R);
  if (!goal || R === c || goal[1] > 600) return null;
  const r = route(L, "bottom", goal[1], { goal, scale: `${fmtVal(MAP_CM, c)} = ${m} m` });
  if (!r) return null;
  r.sig = `k:${c}/${m}>${goal[1]}`;
  r.q = { lead: `🗺️ Scale: ${fmtVal(MAP_CM, c)} = ${m} m.`, ask: `The trail to the waterfall is ${goal[1]} m. How long is it on the map?` };
  r.working = solveLines(r, `${fmtVal(MAP_CM, c)} ↔ ${m} m`);
  r.celebrate = `${goal[1]} m = ${fmtVal(MAP_CM, R)} on the map`;
  return r;
}

const SCALE_M = num("m", 0, "metre", "metres", "🥾");
const RATIOS = [2500, 5000, 1000, 2000, 500, 4000];

function ratioScale(rand) {
  const N = pick(RATIOS, rand);
  const s = N / 100; // metres per map cm
  const L = { top: MAP_CM, bottom: REAL_M, a: 10, b: s };
  const R = pick(ROUTES, rand);
  const goal = rungFor(L, "top", R);
  if (!goal || goal[1] > 600) return null;
  const r = {
    kind: "scale", layout: "single",
    ladders: [{ L, start: [[10, s]] }],
    drive: "top", moves: ALL_MOVES_10, maxDrive: Math.max(R * 2, 120),
    phases: [
      {
        type: "type", hideLadder: true, vine: SCALE_M, answer: s, label: "1 cm on the map =", unit: "m real",
        ask: `1 : ${N.toLocaleString("en-AU")} means 1 cm on the map is ${N.toLocaleString("en-AU")} cm on the ground. How many METRES is that?`,
        slipName: `1 : ${N} in metres`, right: `✓ ${N.toLocaleString("en-AU")} cm = ${s} m — that's the first rung.`,
      },
      { type: "build", goals: [{ li: 0, target: R }], ask: `The route is ${fmtVal(MAP_CM, R)} on the map. How far is the walk?` },
    ],
    goal, scale: `1 : ${N}`,
    sig: `r:${N}>${R}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🗺️ This map's scale is 1 : ${N.toLocaleString("en-AU")}.`, ask: "First, what is 1 cm on the map in real metres?" };
  r.working = [`${N.toLocaleString("en-AU")} cm = ${s} m (100 cm in every metre).`, ...solveLines(r, `1 cm ↔ ${s} m`)];
  r.celebrate = `${fmtVal(MAP_CM, R)} = ${goal[1]} m`;
  return r;
}

function longRoute(rand) {
  const N = pick([25000, 20000, 50000, 10000], rand);
  const s = N / 100;
  const L = { top: MAP_CM, bottom: REAL_M, a: 10, b: s };
  const l1 = pick([20, 30, 40, 15, 25, 35], rand), l2 = pick([20, 30, 40, 50, 15, 25, 45], rand);
  if (l1 === l2) return null;
  const g1 = rungFor(L, "top", l1), g2 = rungFor(L, "top", l2);
  if (!g1 || !g2) return null;
  const total = g1[1] + g2[1];
  const r = {
    kind: "long", layout: "single",
    ladders: [{ L, start: [[10, s]] }],
    drive: "top", moves: ALL_MOVES_10, maxDrive: 120,
    phases: [
      {
        type: "type", hideLadder: true, vine: SCALE_M, answer: s, label: "1 cm on the map =", unit: "m real",
        ask: `1 : ${N.toLocaleString("en-AU")} — what is 1 cm on the map in real metres?`,
        slipName: `1 : ${N} in metres`, right: `✓ 1 cm ↔ ${s} m.`,
      },
      { type: "build", goals: [{ li: 0, target: l1 }, { li: 0, target: l2 }], ask: `Leg 1 is ${fmtVal(MAP_CM, l1)}, leg 2 is ${fmtVal(MAP_CM, l2)}. Reach BOTH on the ladder.` },
      { type: "type", vine: REAL_M, answer: total, label: "The whole trip =", unit: "m", ask: "How far is the whole trip?", slipName: "the whole trip" },
    ],
    legsCm: [l1, l2], goals2: [g1, g2], scale: `1 : ${N}`, total,
    sig: `l:${N}>${l1}+${l2}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🗺️ Scale 1 : ${N.toLocaleString("en-AU")}. Two legs: ${fmtVal(MAP_CM, l1)} then ${fmtVal(MAP_CM, l2)}.`, ask: "How far is the whole trip?" };
  r.working = [`1 cm ↔ ${s} m`, ...solveLines(r).slice(0), `${g1[1]} m + ${g2[1]} m = ${total} m`];
  r.celebrate = `${g1[1]} m + ${g2[1]} m = ${total} m`;
  return r;
}

export function generateMapSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export const __parts = [simple, bars, backwards, ratioScale, longRoute];
