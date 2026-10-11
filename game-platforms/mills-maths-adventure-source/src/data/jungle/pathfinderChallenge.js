/**
 * PATHFINDER (Sky Shrine, host Ms. Bacon) — pure logic: the CAPSTONE.
 * Expeditions that need one ladder AFTER another: the answer to the first
 * becomes the target of the next (map → metres → minutes; swaps → prices;
 * paddling → water to carry). Contexts from all nine clearings. Every
 * ladder is a free route — any moves, any order — and only wrong numbers
 * cost (Jeff, 2026-10-10: reward accuracy, not the fastest way; the old
 * "pick the easiest route" capstone was dropped for this).
 *
 * The Sky Shrine's three vine bridges light up leg by leg; a finished
 * expedition lights the shrine's crystal.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  one ladder, bigger numbers   swaps · prices · speeds · flow
 *   S2  one ladder, decimals          kitchen measures · map scales · km/h
 *   S3  two ladders: map → walk       map cm → real m → seconds at walking pace
 *   S4  two ladders: swap → buy       bananas → mangoes → dollars
 *   S5  two ladders: paddle → drink   km → hours → litres of water
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number.
 */
import { buildSet, pick } from "../magma/magmaMath.js";
import { rungFor, fmtVal, vineChip } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import {
  SEC, MET, KM1, HOUR1, LIT, LIT1, ML, CUPS, DOLLARS, BLUE, YELLOW, num, count, ALL_MOVES, ALL_MOVES_10,
} from "./jungleUnits.js";
import { BANANA, MANGO } from "./swapChallenge.js";

const MAP_CM = num("cm", 1, "map centimetre", "map cm", "🗺️");
const REAL = num("m", 0, "metre", "metres", "🥾");

function makeRound(i, stage, rand) {
  for (let t = 0; t < 160; t++) {
    const r = [oneBig, oneDecimal, mapWalk, swapBuy, paddleDrink][stage](rand, i % 3);
    if (r) return r;
  }
  return oneBig(rand, 0);
}

function oneLeg(L, target, q, celebrate, sig, rand, drive = "top") {
  const r = {
    kind: "reach", layout: "single",
    ladders: [{ L, start: [[L.a, L.b]] }],
    drive, moves: ALL_MOVES_10,
    maxDrive: Math.max(target * 2, (drive === "top" ? L.a : L.b) * 12),
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    legs: null, sig,
  };
  if (!planRound(r, 5) || r.solve[0].steps.length < 2) return null;
  const goal = rungFor(L, drive, target);
  r.goal = goal;
  r.q = q(goal);
  r.working = solveLines(r, `${vineChip(L.top, L.a)} ↔ ${vineChip(L.bottom, L.b)}`);
  r.celebrate = celebrate(goal);
  return r;
}

function oneBig(rand, which) {
  if (which === 0) {
    const [a, b] = pick([[3, 2], [4, 3], [5, 2], [5, 3], [4, 5]], rand);
    const T = a * pick([14, 16, 18, 24, 25, 15], rand);
    if (T > 150) return null;
    return oneLeg({ top: BANANA, bottom: MANGO, a, b }, T,
      (g) => ({ lead: `🐒 The monkeys swap ${a} 🍌 for ${b} 🥭.`, ask: `The expedition brings ${g[0]} bananas. How many mangoes?` }),
      (g) => `${g[0]} 🍌 ↔ ${g[1]} 🥭`, `b0:${a}/${b}>${T}`, rand);
  }
  if (which === 1) {
    const [n, c] = pick([[4, 900], [6, 1500], [3, 750], [8, 1200], [5, 1250]], rand);
    const T = pick([10, 14, 18, 22, 9, 15], rand);
    if (T === n) return null;
    const fruit = count("🥥", "coconut", "coconuts");
    return oneLeg({ top: fruit, bottom: DOLLARS, a: n, b: c }, T,
      (g) => ({ lead: `🥥 ${n} coconuts cost ${fmtVal(DOLLARS, c)}.`, ask: `How much for ${g[0]} coconuts for the trip?` }),
      (g) => `${g[0]} 🥥 = ${fmtVal(DOLLARS, g[1])}`, `b1:${n}/${c}>${T}`, rand);
  }
  const [d, t] = pick([[12, 8], [9, 6], [15, 10], [14, 4], [21, 6]], rand);
  const T = pick([28, 36, 44, 50, 18, 26], rand);
  return oneLeg({ top: SEC, bottom: MET, a: t, b: d }, T,
    () => ({ lead: `🦆 The duck swims ${d} m every ${t} s.`, ask: `How far does it swim in ${T} s?` }),
    (g) => `${g[1]} m in ${T} s`, `b2:${d}/${t}>${T}`, rand);
}

function oneDecimal(rand, which) {
  if (which === 0) {
    const L = { top: CUPS, bottom: ML, a: 10, b: 250 };
    const T = pick([15, 25, 35, 45, 55, 65], rand);
    return oneLeg(L, T,
      (g) => ({ lead: "🥣 1 cup = 250 mL.", ask: `The damper recipe needs ${fmtVal(CUPS, g[0])} of water. How many mL?` }),
      (g) => `${fmtVal(CUPS, g[0])} = ${g[1]} mL`, `d0:${T}`, rand);
  }
  if (which === 1) {
    const [c, m] = pick([[20, 50], [40, 100], [50, 40], [30, 75]], rand);
    const T = pick([35, 45, 55, 65, 75, 85, 25], rand);
    const L = { top: MAP_CM, bottom: REAL, a: c, b: m };
    return oneLeg(L, T,
      (g) => ({ lead: `🗺️ The map's scale bar: ${fmtVal(MAP_CM, c)} = ${m} m.`, ask: `The route is ${fmtVal(MAP_CM, g[0])}. How far is the walk?` }),
      (g) => `${fmtVal(MAP_CM, g[0])} = ${g[1]} m`, `d1:${c}/${m}>${T}`, rand);
  }
  const [km, h] = pick([[90, 15], [75, 15], [100, 25], [120, 20]], rand);
  const T = pick([25, 35, 45, 30, 40], rand);
  if (T === h) return null;
  return oneLeg({ top: HOUR1, bottom: KM1, a: h, b: km }, T,
    (g) => ({ lead: `🛶 The kayak paddles ${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}.`, ask: `How far in ${fmtVal(HOUR1, g[0])}?` }),
    (g) => `${fmtVal(KM1, g[1])} in ${fmtVal(HOUR1, g[0])}`, `d2:${km}/${h}>${T}`, rand);
}

/** Two ladders in a row: leg 1's answer is leg 2's target. */
function chain(L1, t1, L2, legs, texts, sig) {
  const g1 = rungFor(L1, "top", t1);
  if (!g1) return null;
  const t2 = g1[1];
  const g2 = rungFor(L2, "top", t2);
  if (!g2 || t2 === L2.a) return null;
  const r = {
    kind: "chain", layout: "chain",
    ladders: [{ L: L1, start: [[L1.a, L1.b]], name: legs[0] }, { L: L2, start: [[L2.a, L2.b]], name: legs[1] }],
    drive: "top", moves: ALL_MOVES_10,
    maxDrive: Math.max(t1, t2) * 2 + 50,
    legs,
    phases: [
      { type: "build", goals: [{ li: 0, target: t1 }], leg: 0, ask: texts.ask1(g1) },
      { type: "build", goals: [{ li: 1, target: t2 }], leg: 1, ask: texts.ask2(g1, g2), say: texts.say(g1) },
    ],
    goal: g2, legGoals: [g1, g2], sig,
    legDone: [`${vineChip(L1.top, g1[0])} ↔ ${vineChip(L1.bottom, g1[1])}`, `${vineChip(L2.top, g2[0])} ↔ ${vineChip(L2.bottom, g2[1])}`],
  };
  if (!planRound(r, 5)) return null;
  r.q = { lead: texts.lead, ask: texts.ask };
  r.working = solveLines(r, texts.lead);
  r.celebrate = texts.done(g1, g2);
  return r;
}

function mapWalk(rand) {
  const [c, m] = pick([[20, 50], [10, 20], [40, 100], [10, 25], [20, 30]], rand);
  const R = pick([30, 40, 50, 60, 70, 80, 45, 35], rand);
  const [wm, ws] = pick([[50, 40], [20, 15], [25, 20], [10, 8], [30, 25]], rand);
  const L1 = { top: MAP_CM, bottom: REAL, a: c, b: m };
  const L2 = { top: REAL, bottom: SEC, a: wm, b: ws };
  return chain(L1, R, L2, ["🗺️ Map → metres", "🚶 Metres → seconds"], {
    lead: `🗺️ Scale ${fmtVal(MAP_CM, c)} = ${m} m. You walk ${wm} m every ${ws} s.`,
    ask: `The route is ${fmtVal(MAP_CM, R)} on the map. How long is the walk?`,
    ask1: () => `Ladder 1: ${fmtVal(MAP_CM, R)} on the map is how many metres?`,
    ask2: (g1) => `Ladder 2: how many seconds to walk ${g1[1]} m?`,
    say: (g1) => `${g1[1]} m to walk — now the walking ladder.`,
    done: (g1, g2) => `${fmtVal(MAP_CM, R)} → ${g1[1]} m → ${g2[1]} s`,
  }, `mw:${c}/${m}>${R}|${wm}/${ws}`);
}

function swapBuy(rand) {
  const [a, b] = pick([[3, 2], [5, 2], [4, 3], [6, 4], [5, 3]], rand);
  const T = a * pick([3, 4, 5, 6, 8, 2.5], rand);
  if (!Number.isInteger(T)) return null;
  const [n, c] = pick([[4, 300], [2, 150], [5, 400], [3, 120], [6, 450]], rand);
  const L1 = { top: BANANA, bottom: MANGO, a, b };
  const L2 = { top: MANGO, bottom: DOLLARS, a: n, b: c };
  return chain(L1, T, L2, ["🐒 Bananas → mangoes", "💲 Mangoes → dollars"], {
    lead: `🐒 ${a} 🍌 swap for ${b} 🥭. At the market, ${n} 🥭 sell for ${fmtVal(DOLLARS, c)}.`,
    ask: `Swap ${T} bananas, then sell the mangoes. How much money?`,
    ask1: () => `Ladder 1: ${T} 🍌 swap for how many 🥭?`,
    ask2: (g1) => `Ladder 2: ${g1[1]} 🥭 sell for how much?`,
    say: (g1) => `${g1[1]} mangoes to sell — now the market ladder.`,
    done: (g1, g2) => `${T} 🍌 → ${g1[1]} 🥭 → ${fmtVal(DOLLARS, g2[1])}`,
  }, `sb:${a}/${b}>${T}|${n}/${c}`);
}

function paddleDrink(rand) {
  const [km, h] = pick([[60, 10], [90, 15], [80, 20], [120, 20], [45, 10]], rand);
  const D = pick([90, 120, 150, 180, 60, 75, 135], rand);
  const [dl, dh] = pick([[5, 10], [6, 10], [15, 20], [3, 5], [9, 10]], rand); // litres (tenths) per hour (tenths)
  const L1 = { top: KM1, bottom: HOUR1, a: km, b: h };
  const L2 = { top: HOUR1, bottom: LIT1, a: dh, b: dl };
  return chain(L1, D, L2, ["🛶 Km → hours", "💧 Hours → litres"], {
    lead: `🛶 The kayak paddles ${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}. Each paddler drinks ${fmtVal(LIT1, dl)} every ${fmtVal(HOUR1, dh)}.`,
    ask: `The trip is ${fmtVal(KM1, D)}. How much water should each paddler carry?`,
    ask1: () => `Ladder 1: how long to paddle ${fmtVal(KM1, D)}?`,
    ask2: (g1) => `Ladder 2: how much water in ${fmtVal(HOUR1, g1[1])}?`,
    say: (g1) => `${fmtVal(HOUR1, g1[1])} of paddling — now the water ladder.`,
    done: (g1, g2) => `${fmtVal(KM1, D)} → ${fmtVal(HOUR1, g1[1])} → ${fmtVal(LIT1, g2[1])}`,
  }, `pd:${km}/${h}>${D}|${dl}/${dh}`);
}

export function generatePathfinderSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export const __parts = [
  (r) => oneBig(r, Math.floor(r() * 3)),
  (r) => oneDecimal(r, Math.floor(r() * 3)),
  mapWalk, swapBuy, paddleDrink,
];
export { ALL_MOVES, LIT, MET, BLUE, YELLOW };
