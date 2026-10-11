/**
 * FIREFLY GRAPHS (Redwood Hollow, host Mr. Dawson) — pure logic: STAND THE
 * LADDER UP. Lay the time vine along the ground and stand the distance vine
 * up a giant redwood: every rung becomes a point — a firefly — and a true
 * ladder's fireflies sit on ONE straight line from the roots (the origin).
 * Steeper = faster. Distance–time graphs (NSW MA4-RAT-C-01: "interpret
 * distance–time graphs", "calculate speeds").
 *
 * The SAME ladder store and moves as every other challenge; only the
 * picture changes (game/jungle/stages/GraphLadder.jsx). A wrong partner is a
 * firefly OFF the line; adding the same to both makes a line that misses
 * the roots (the untied zero, now a graph that doesn't start at 0).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  light the line     "2 km every 30 min" — how far in 2 hours?
 *   S2  steeper is faster  two walkers on one graph: line them up at the same
 *                          time, then call the faster (steeper) one
 *   S3  read the line      the line is already lit — how long to walk 5 km?
 *                          (the distance axis leads)
 *   S4  match the story    three lines, each with ONE firefly at a different
 *                          time; the story "3 km every 45 min" matches one of
 *                          them — hang more fireflies on any line to check
 *   S5  speed on the line  one firefly at (45 min, 3 km): how far in ONE hour
 *                          (its speed), then how long for a longer walk
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number; a wrong
 * final call keeps 10 − 4 per wrong number (S4: 0 — the call is the round).
 */
import { buildSet, pick, shuffle } from "../magma/magmaMath.js";
import { rungFor, oneMoveValues, fmtVal } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import { MIN, KM1, ALL_MOVES } from "./jungleUnits.js";

export const WALKERS = [
  { name: "Kai", color: "#ff9f1c", icon: "🟠" },
  { name: "Ana", color: "#3a86ff", icon: "🔵" },
  { name: "Tui", color: "#2bd65a", icon: "🟢" },
];
// [km tenths, minutes]
const RATES = [[20, 30], [30, 45], [40, 60], [10, 15], [50, 60], [30, 40], [20, 25], [60, 90], [15, 20], [25, 30], [45, 60], [35, 30], [40, 50], [30, 20]];
const L = (km, min) => ({ top: MIN, bottom: KM1, a: min, b: km });
const km = (v) => fmtVal(KM1, v);

function makeRound(i, stage, rand) {
  for (let t = 0; t < 160; t++) {
    const r = [lightLine, steeper, readLine, matchStory, speedLine][stage](rand);
    if (r) return r;
  }
  return lightLine(rand);
}

const base = (extra) => ({ layout: "graph", drive: "top", moves: ALL_MOVES, ...extra });

function lightLine(rand) {
  const [d, t] = pick(RATES, rand);
  const T = pick([60, 75, 90, 100, 120, 150, 45, 80], rand);
  const lad = L(d, t);
  const goal = rungFor(lad, "top", T);
  if (!goal || T === t || goal[1] > 120) return null;
  const r = {
    kind: "reach", ...base({}),
    ladders: [{ L: lad, start: [[t, d]], name: "Kai" }],
    maxDrive: 240,
    phases: [{ type: "build", goals: [{ li: 0, target: T }] }],
    walkers: [WALKERS[0]], goal,
    sig: `ll:${d}/${t}>${T}`,
  };
  if (!planRound(r, 4) || !(r.solve[0].steps.length >= 2 || rand() < 0.35)) return null;
  r.q = { lead: `🚶 Kai walks ${km(d)} every ${t} min.`, ask: `How far in ${T} min?` };
  r.working = solveLines(r, `${t} min ↔ ${km(d)}`);
  r.celebrate = `✨ ${T} min ↔ ${km(goal[1])} — on the line`;
  return r;
}

function steeper(rand) {
  const [[dA, tA], [dB, tB]] = shuffle(RATES, rand).slice(0, 2);
  const sA = dA / tA, sB = dB / tB;
  if (Math.abs(sA - sB) < 0.08) return null;
  if ((dA > dB) === (sA > sB) || dA === dB) return null; // the bigger distance belongs to the slower walker
  const A = L(dA, tA), B = L(dB, tB);
  const oneA = oneMoveValues(A, "top", tA, ALL_MOVES, 240);
  const oneB = oneMoveValues(B, "top", tB, ALL_MOVES, 240);
  oneA.set(tA, null); oneB.set(tB, null);
  let plan = null;
  for (const [v, sa] of oneA) {
    if (!oneB.has(v) || v > 180) continue;
    const cost = (sa ? 1 : 0) + (oneB.get(v) ? 1 : 0);
    if (cost < 1) continue;
    if (!plan || cost < plan.cost || (cost === plan.cost && v < plan.v)) plan = { v, cost };
  }
  if (!plan) return null;
  const better = sA > sB ? 0 : 1;
  const ws = [WALKERS[0], WALKERS[1]];
  const r = {
    kind: "compare", ...base({}),
    ladders: [{ L: A, start: [[tA, dA]], name: "Kai" }, { L: B, start: [[tB, dB]], name: "Ana" }],
    maxDrive: 240, better,
    phases: [
      { type: "common", planAt: plan.v, hint: "Hang a firefly for BOTH walkers at the same time" },
      { type: "call", ask: "Who walks faster — whose line is steeper?", options: ws.map((w) => ({ label: w.name, icon: w.icon })), correct: better, final: true },
    ],
    walkers: ws,
    sig: `st:${dA}/${tA}|${dB}/${tB}`,
  };
  if (!planRound(r, 3)) return null;
  const cA = rungFor(A, "top", plan.v), cB = rungFor(B, "top", plan.v);
  r.q = { lead: `🚶 Kai: ${km(dA)} every ${tA} min. Ana: ${km(dB)} every ${tB} min.`, ask: "Who is faster?" };
  r.working = solveLines(r, "Both walkers at the same time:");
  r.working.push(`At ${plan.v} min: Kai ${km(cA[1])}, Ana ${km(cB[1])} — further in the same time = steeper = faster.`);
  r.celebrate = `${ws[better].name}'s line is steeper — faster`;
  return r;
}

function readLine(rand) {
  const [d, t] = pick(RATES, rand);
  const D = pick([30, 40, 50, 60, 70, 80, 25, 35, 45], rand);
  const lad = L(d, t);
  const goal = rungFor(lad, "bottom", D);
  if (!goal || D === d || goal[0] > 200) return null;
  const r = {
    kind: "reach", ...base({ drive: "bottom" }),
    ladders: [{ L: lad, start: [[t, d]], name: "Ana" }],
    maxDrive: 160,
    phases: [{ type: "build", goals: [{ li: 0, target: D }] }],
    walkers: [WALKERS[1]], goal, lineLit: true,
    sig: `rl:${d}/${t}>${D}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🚶 Ana's line goes through ${t} min and ${km(d)}.`, ask: `How long does she take to walk ${km(D)}?` };
  r.working = solveLines(r, `${t} min ↔ ${km(d)}`);
  r.celebrate = `✨ ${km(D)} takes ${goal[0]} min`;
  return r;
}

function matchStory(rand) {
  // Three walkers with three different speeds; each line is labelled by ONE
  // firefly at its own time, never the story's numbers.
  const speeds = shuffle([[4, 60], [5, 60], [6, 60], [3, 60], [4.5, 60]], rand).slice(0, 3);
  const pick3 = [];
  for (const [kmh] of speeds) {
    const opts = [15, 20, 30, 40, 45, 60, 90, 80].map((m) => [Math.round(kmh * m / 6), m]).filter(([d, m]) => Number.isInteger((kmh * m) / 6) && d > 0 && d <= 80);
    if (!opts.length) return null;
    pick3.push(pick(opts, rand));
  }
  const story = Math.floor(rand() * 3);
  const [sd, sm] = pick3[story];
  // The story's own pair: an equivalent pair at a DIFFERENT time.
  const kmh = speeds[story][0];
  const storyOpts = [15, 20, 30, 40, 45, 60, 90, 120].filter((m) => m !== sm && Number.isInteger((kmh * m) / 6) && (kmh * m) / 6 <= 120);
  if (!storyOpts.length) return null;
  const stM = pick(storyOpts, rand);
  const stD = (kmh * stM) / 6;
  const ws = WALKERS;
  const r = {
    kind: "match", ...base({}),
    ladders: pick3.map(([d, m], i) => ({ L: L(d, m), start: [[m, d]], name: ws[i].name })),
    maxDrive: 240, partial: 0,
    phases: [{
      type: "call", ladders: [0, 1, 2], final: true, correct: story, exploreLabel: "🔍 Hang fireflies on a line to check",
      ask: `Who walked "${km(stD)} every ${stM} min"?`,
      options: ws.map((w) => ({ label: w.name, icon: w.icon })),
    }],
    walkers: ws,
    sig: `ms:${pick3.map((p) => p.join("/")).join("|")}:${story}`,
  };
  if (!planRound(r, 3)) return null;
  r.q = { lead: `📖 The story: "I walked ${km(stD)} every ${stM} minutes."`, ask: "Which line is the storyteller?" };
  r.working = [
    `${ws[story].name}'s firefly: ${sm} min ↔ ${km(sd)}.`,
    `Same speed as ${km(stD)} every ${stM} min — the same ladder, the same line.`,
  ];
  r.celebrate = `${ws[story].name} is the storyteller`;
  return r;
}

function speedLine(rand) {
  const [d, t] = pick(RATES.filter(([, m]) => m !== 60), rand);
  const lad = L(d, t);
  const hour = rungFor(lad, "top", 60);
  if (!hour) return null;
  const D = pick([60, 80, 100, 120, 90, 50], rand);
  const g2 = rungFor(lad, "bottom", D);
  if (!g2 || D === d || D === hour[1] || g2[0] > 240) return null;
  const r = {
    kind: "speed", ...base({}),
    ladders: [{ L: lad, start: [[t, d]], name: "Tui" }],
    maxDrive: 260,
    phases: [
      { type: "build", goals: [{ li: 0, target: 60 }], ask: "How far in ONE hour (60 min)? That's the speed." },
      { type: "build", goals: [{ li: 0, target: D }], drive: "bottom", ask: `At that speed, how long to walk ${km(D)}?`, say: `${km(hour[1])} an hour — ${hour[1] / 10} km per hour!` },
    ],
    walkers: [WALKERS[2]], goal: g2, lineLit: true,
    sig: `sp:${d}/${t}>${D}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🚶 Tui's line goes through ${t} min and ${km(d)}.`, ask: "Speed first, then the long walk." };
  r.working = solveLines(r, `${t} min ↔ ${km(d)}`);
  r.celebrate = `${hour[1] / 10} km per hour · ${km(D)} in ${g2[0]} min`;
  return r;
}

export function generateFirefliesSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export const __parts = [lightLine, steeper, readLine, matchStory, speedLine];
