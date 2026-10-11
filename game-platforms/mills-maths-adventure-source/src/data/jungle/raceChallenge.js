/**
 * LAGOON RACE (Lily Lagoon, host Mr. Heywood) — pure logic: SPEED IS A RATE
 * (NSW MA4-RAT-C-01: rates, "speed as a rate"). A racer's form card — "🐸 6 m
 * every 4 s" — is the first rung of a ladder with SECONDS on the top vine and
 * METRES below (time is what the clock runs; distance follows it). Students
 * build their own way along (again, double, halve, split, join…) to answer
 * the race questions; racers then swim the lanes in front of the ladder.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  how far?          "The frog swims 6 m every 4 s. How far in 20 s?"
 *   S2  how long?         "How long to swim across the 30 m lagoon?" (the
 *                         METRES vine leads; type the seconds)
 *   S3  who's faster?     two racers, a three-vine ladder sharing the SECONDS
 *                         vine: build both to the same time, then call it.
 *                         The trap: the racer with the bigger distance on its
 *                         card is the SLOWER one ("12 is more than 9…")
 *   S4  race to the bank  both racers to the same distance (the shared vine
 *                         is METRES now): who gets there first? Trap: the
 *                         winner's card has the bigger TIME number
 *   S5  kayak tour        km and hours with tenths: how far in 4 h, how long
 *                         for 15 km, and how far in ONE hour (its speed)
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number; a wrong
 * final call keeps 10 − 4 per wrong number.
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import { rungFor, oneMoveValues, fmtVal } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import { SEC, MET, KM1, HOUR1, ALL_MOVES } from "./jungleUnits.js";

export const RACERS = [
  { id: "frog", icon: "🐸", name: "Frog", the: "the frog" },
  { id: "turtle", icon: "🐢", name: "Turtle", the: "the turtle" },
  { id: "duck", icon: "🦆", name: "Duck", the: "the duck" },
];
// Form cards: [metres, seconds].
const RATES = [[6, 4], [9, 6], [10, 4], [12, 8], [15, 6], [8, 5], [6, 5], [10, 8], [12, 5], [9, 4], [14, 8], [5, 2], [7, 2], [12, 10], [8, 3], [9, 2]];
// Kayak: [km tenths, hours tenths].
const KAYAKS = [[90, 15], [120, 20], [75, 15], [100, 25], [60, 15], [150, 25], [45, 15], [80, 20], [105, 15], [140, 20]];

const timeVsDist = (t, d) => ({ top: SEC, bottom: MET, a: t, b: d });
const distVsTime = (d, t) => ({ top: MET, bottom: SEC, a: d, b: t });

function makeRound(i, stage, rand) {
  for (let t = 0; t < 150; t++) {
    const r = stage === 0 ? howFar(rand) : stage === 1 ? howLong(rand) : stage === 2 ? faster(rand) : stage === 3 ? toTheBank(rand) : kayak(i % 3, rand);
    if (r) return r;
  }
  return howFar(rand);
}

// A target one move away (a straight "× 5") is fine now and then; most
// rounds need two or more rungs so there's real building to do.
const stepsOk = (r, rand) => r.solve[0].steps.length >= 2 || rand() < 0.3;

function single(racer, L, drive, target, extra, rand = Math.random) {
  const r = {
    kind: "reach",
    layout: "single",
    ladders: [{ L, start: [[L.a, L.b]], name: racer.name }],
    drive, moves: ALL_MOVES, maxDrive: Math.max(target * 2, (drive === "top" ? L.a : L.b) * 12),
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    racers: [racer],
    ...extra,
  };
  if (!planRound(r, 4) || !stepsOk(r, rand)) return null;
  return r;
}

function howFar(rand) {
  const racer = pick(RACERS, rand);
  const [d, t] = pick(RATES, rand);
  const T = randInt(5, 40, rand);
  if (T === t || T % t === 0 && T / t <= 2) return null;
  const goal = rungFor(timeVsDist(t, d), "top", T);
  if (!goal || goal[1] > 60 || goal[1] < 8) return null;
  const r = single(racer, timeVsDist(t, d), "top", T, { goal, race: { kind: "time", T } }, rand);
  if (!r) return null;
  r.sig = `far:${racer.id}:${d}/${t}>${T}`;
  r.q = { lead: `${racer.icon} ${racer.name} swims ${d} m every ${t} s.`, ask: `How far does it swim in ${T} s?` };
  r.working = solveLines(r, `${d} m every ${t} s.`);
  r.working.push(`In ${T} s ${racer.the} swims ${goal[1]} m.`);
  r.celebrate = `${racer.icon} ${goal[1]} m in ${T} s`;
  return r;
}

function howLong(rand) {
  const racer = pick(RACERS, rand);
  const [d, t] = pick(RATES, rand);
  const D = randInt(12, 60, rand);
  if (D === d || (D % d === 0 && D / d <= 2)) return null;
  const goal = rungFor(timeVsDist(t, d), "bottom", D);
  if (!goal || goal[0] > 60) return null;
  const r = single(racer, timeVsDist(t, d), "bottom", D, { goal, race: { kind: "dist", D } }, rand);
  if (!r) return null;
  r.sig = `long:${racer.id}:${d}/${t}>${D}`;
  r.q = { lead: `${racer.icon} ${racer.name} swims ${d} m every ${t} s.`, ask: `How long to swim ${D} m across the lagoon?` };
  r.working = solveLines(r, `${d} m every ${t} s.`);
  r.working.push(`${D} m takes ${goal[0]} s.`);
  r.celebrate = `${racer.icon} ${D} m in ${goal[0]} s`;
  return r;
}

/** A common value both ladders reach in ≤ 1 move each (and not both starts). */
function commonPlan(A, B, moves, maxDrive) {
  const oneA = oneMoveValues(A, "top", A.a, moves, maxDrive);
  const oneB = oneMoveValues(B, "top", B.a, moves, maxDrive);
  oneA.set(A.a, null);
  oneB.set(B.a, null);
  let plan = null;
  for (const [v, sa] of oneA) {
    if (!oneB.has(v)) continue;
    const sb = oneB.get(v);
    const cost = (sa ? 1 : 0) + (sb ? 1 : 0);
    if (cost < 1) continue;
    if (!plan || cost < plan.cost || (cost === plan.cost && v < plan.v)) plan = { v, cost };
  }
  return plan;
}

function faster(rand) {
  const [ra, rb] = shuffle(RACERS, rand).slice(0, 2);
  const [[dA, tA], [dB, tB]] = shuffle(RATES, rand).slice(0, 2);
  const sA = dA / tA, sB = dB / tB;
  if (Math.abs(sA - sB) < 0.1) return null;
  // The trap: the bigger distance on the card belongs to the SLOWER racer.
  if ((dA > dB) === (sA > sB) || dA === dB) return null;
  const A = timeVsDist(tA, dA), B = timeVsDist(tB, dB);
  const maxDrive = Math.max(tA, tB) * 12;
  const plan = commonPlan(A, B, ALL_MOVES, maxDrive);
  if (!plan) return null;
  const better = sA > sB ? 0 : 1;
  const names = [ra, rb];
  const r = {
    kind: "compare",
    layout: "shared",
    ladders: [{ L: A, start: [[tA, dA]], name: ra.name }, { L: B, start: [[tB, dB]], name: rb.name }],
    drive: "top", moves: ALL_MOVES, maxDrive, better,
    phases: [
      { type: "common", planAt: plan.v, hint: "Build both racers to the SAME number of seconds" },
      { type: "call", options: names.map((x) => ({ label: x.name, icon: x.icon })), correct: better, final: true, ask: "Who is faster?" },
    ],
    racers: names,
    race: { kind: "common" },
    sig: `fast:${dA}/${tA}|${dB}/${tB}`,
  };
  if (!planRound(r, 3)) return null;
  const cA = rungFor(A, "top", plan.v), cB = rungFor(B, "top", plan.v);
  r.q = { lead: `${ra.icon} ${ra.name}: ${dA} m every ${tA} s. ${rb.icon} ${rb.name}: ${dB} m every ${tB} s.`, ask: "Who is faster?" };
  r.working = solveLines(r, "Line both racers up at the same time:");
  r.working.push(`In ${plan.v} s: ${ra.name} ${cA[1]} m, ${rb.name} ${cB[1]} m.`);
  r.working.push(`${names[better].name} goes further in the same time — faster.`);
  r.celebrate = `${names[better].icon} ${names[better].name} is faster`;
  return r;
}

function toTheBank(rand) {
  const [ra, rb] = shuffle(RACERS, rand).slice(0, 2);
  const [[dA, tA], [dB, tB]] = shuffle(RATES, rand).slice(0, 2);
  const sA = dA / tA, sB = dB / tB;
  if (Math.abs(sA - sB) < 0.1) return null;
  // The trap: the winner's card has the BIGGER time number.
  if ((tA > tB) !== (sA > sB) || tA === tB) return null;
  // The far bank: a distance BOTH racers reach in whole seconds.
  const g = (x, y) => (y ? g(y, x % y) : x);
  const uA = dA / g(dA, tA), uB = dB / g(dB, tB);
  const unit = (uA * uB) / g(uA, uB);
  const options = [];
  for (let D = unit; D <= 60; D += unit) if (D >= 18) options.push(D);
  if (!options.length) return null;
  const D = pick(options, rand);
  const A = distVsTime(dA, tA), B = distVsTime(dB, tB);
  const gA = rungFor(A, "top", D), gB = rungFor(B, "top", D);
  if (!gA || !gB || gA[1] === gB[1] || D === dA || D === dB) return null;
  if (gA[1] > 60 || gB[1] > 60) return null;
  const better = gA[1] < gB[1] ? 0 : 1;
  const names = [ra, rb];
  const r = {
    kind: "fill",
    layout: "shared",
    ladders: [{ L: A, start: [[dA, tA]], name: ra.name }, { L: B, start: [[dB, tB]], name: rb.name }],
    drive: "top", moves: ALL_MOVES, maxDrive: D * 2, better,
    phases: [
      { type: "build", goals: [{ li: 0, target: D }, { li: 1, target: D }], hint: `Build BOTH racers to ${D} m` },
      { type: "call", options: names.map((x) => ({ label: x.name, icon: x.icon })), correct: better, final: true, ask: `Who reaches the far bank (${D} m) first?` },
    ],
    racers: names,
    race: { kind: "dist", D },
    sig: `bank:${dA}/${tA}|${dB}/${tB}>${D}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `${ra.icon} ${ra.name}: ${dA} m every ${tA} s. ${rb.icon} ${rb.name}: ${dB} m every ${tB} s.`, ask: `Race to the far bank, ${D} m away!` };
  r.working = solveLines(r, `Both racers to ${D} m:`);
  r.working.push(`${ra.name} takes ${gA[1]} s, ${rb.name} takes ${gB[1]} s.`);
  r.working.push(`${names[better].name} gets there first.`);
  r.celebrate = `${names[better].icon} ${names[better].name} wins — ${Math.min(gA[1], gB[1])} s`;
  return r;
}

const KAYAK = { id: "kayak", icon: "🛶", name: "Kayak", the: "the kayak" };
function kayak(which, rand) {
  const [km, h] = pick(KAYAKS, rand);
  const L = { top: HOUR1, bottom: KM1, a: h, b: km };
  const speed = km / h; // km per hour
  let r;
  if (which === 0) {
    const T = pick([20, 25, 30, 35, 40, 45, 50, 60], rand);
    if (T === h) return null;
    const goal = rungFor(L, "top", T);
    if (!goal) return null;
    r = single(KAYAK, L, "top", T, { goal, race: { kind: "time", T } }, rand);
    if (!r) return null;
    r.q = { lead: `🛶 The kayak paddles ${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}.`, ask: `How far does it go in ${fmtVal(HOUR1, T)}?` };
    r.celebrate = `🛶 ${fmtVal(KM1, goal[1])} in ${fmtVal(HOUR1, T)}`;
    r.sig = `kfar:${km}/${h}>${T}`;
  } else if (which === 1) {
    const D = pick([60, 80, 90, 100, 120, 150, 180, 200, 240], rand);
    if (D === km) return null;
    const goal = rungFor(L, "bottom", D);
    if (!goal || goal[0] > 80 || goal[0] % 5) return null; // whole or half hours
    r = single(KAYAK, L, "bottom", D, { goal, race: { kind: "dist", D } }, rand);
    if (!r) return null;
    r.q = { lead: `🛶 The kayak paddles ${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}.`, ask: `How long to paddle ${fmtVal(KM1, D)}?` };
    r.celebrate = `🛶 ${fmtVal(KM1, D)} in ${fmtVal(HOUR1, goal[0])}`;
    r.sig = `klong:${km}/${h}>${D}`;
  } else {
    if (h === 10) return null;
    const goal = rungFor(L, "top", 10);
    if (!goal) return null;
    r = single(KAYAK, L, "top", 10, { goal, race: { kind: "time", T: 10 } }, rand);
    if (!r) return null;
    r.q = { lead: `🛶 The kayak paddles ${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}.`, ask: "How far does it go in ONE hour? (That's its speed.)" };
    r.celebrate = `🛶 ${fmtVal(KM1, goal[1])} in 1 hour — ${speed} km per hour`;
    r.sig = `kspeed:${km}/${h}`;
  }
  r.working = solveLines(r, `${fmtVal(KM1, km)} in ${fmtVal(HOUR1, h)}.`);
  r.working.push(r.celebrate.replace("🛶 ", ""));
  return r;
}

export function generateRaceSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** (dev) one round of a stage, or null — for the generator checks. */
export const __makeRound = makeRound;
export const __parts = [howFar, howLong, faster, toTheBank, (rand) => kayak(Math.floor(rand() * 3), rand)];
