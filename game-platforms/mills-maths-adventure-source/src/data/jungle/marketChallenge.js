/**
 * SUNNY MARKET (Sunny Knoll, host Mr. Pearce) — pure logic for the second
 * Emerald Jungle challenge: PRICES ON THE LADDER and BEST BUYS (NSW
 * MA4-RAT-C-01: "financial applications of rates, such as best buys").
 *
 * The vine ladder hangs in front of the fruit stalls: fruit on the top
 * vine, dollars on the bottom (money is held in whole CENTS — a move that
 * would make a fraction of a cent is refused). Students build their OWN way
 * to the amount they need — halve, double, split, join, stretch — and type
 * the price each time. Nobody is told to "go through one": a student may
 * discover the price of one fruit and use it (the unitary method), or build
 * up from friendly pieces; both are equally good (Jeff, 2026-10-10 —
 * accuracy, not the fastest route; the teacher names methods later).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  any way up         "4 lemons cost $9. How much for 7?" — halve and
 *                          join, or find one lemon, or …
 *   S2  friendly pieces    "6 papayas cost $10. How much for 9?" — one papaya
 *                          isn't whole cents, so a piece of 3 (or 2) is the
 *                          friendly step
 *   S3  how many can I buy? "$12 buys 8 coconuts. How many for $21?" — the
 *                          dollar vine leads; the student types the fruit
 *   S4  best buy           two stalls, a three-vine ladder (A's $ · fruit ·
 *                          B's $): build both to the SAME amount of fruit,
 *                          then choose
 *   S5  best buy by the kg  the same with kilograms (1.5 kg for $6 vs 2 kg
 *                          for $7.50)
 *
 * Scoring (vineLadder.js): 25 a round, −4 per wrong number, never below 9
 * when the final answer is right; a wrong stall keeps 10 − 4 per wrong
 * number. ANY route counts the same.
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import {
  fewestMoves, rungFor, vineText, fmtMoney, fmtKg, gcd, oneMoveValues,
} from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";

const DOLLARS = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };

export const MARKET_FRUIT = [
  { kind: "count", icon: "🍍", one: "pineapple", many: "pineapples" },
  { kind: "count", icon: "🥥", one: "coconut", many: "coconuts" },
  { kind: "count", icon: "🥭", one: "mango", many: "mangoes" },
  { kind: "count", icon: "🥑", one: "avocado", many: "avocados" },
  { kind: "count", icon: "🍋", one: "lemon", many: "lemons" },
  { kind: "count", icon: "🥝", one: "kiwi fruit", many: "kiwi fruit" },
];
export const MARKET_KG = [
  { kind: "kg", icon: "🍇", one: "grapes", many: "grapes" },
  { kind: "kg", icon: "🍒", one: "cherries", many: "cherries" },
  { kind: "kg", icon: "🍓", one: "strawberries", many: "strawberries" },
  { kind: "kg", icon: "🥜", one: "nuts", many: "nuts" },
];

const ALL = ["again", "x2", "h2", "split", "times", "join", "gap"];
export const MARKET_MOVES = [ALL, ALL, ALL, [...ALL, "x10"], [...ALL, "x10"]];

const ladder = (fruit, items, cents) => ({ top: fruit, bottom: DOLLARS, a: items, b: cents });
const amt = (fruit, v) => (fruit.kind === "kg" ? fmtKg(v) : vineText(fruit, v));

function makeRound(i, stage, rand) {
  for (let t = 0; t < 80; t++) {
    const r = stage >= 3 ? makeCompare(stage, rand) : makeReach(stage, rand);
    if (r) return r;
  }
  return makeReach(0, rand);
}

function makeReach(stage, rand) {
  const fruit = pick(MARKET_FRUIT, rand);
  const moves = MARKET_MOVES[stage];
  let L, drive = "top", target;
  if (stage === 0) {
    // Whole-cent prices for every piece; a target that isn't a simple
    // multiple of the deal, so there's real building to do.
    const u = pick([150, 250, 120, 180, 350, 75, 60, 80, 225, 45, 90, 125], rand);
    const n0 = randInt(3, 6, rand);
    const t = randInt(2, 12, rand);
    if (t === n0 || gcd(t, n0) !== 1) return null;
    L = ladder(fruit, n0, n0 * u);
    target = t;
  } else if (stage === 1) {
    // Friendly pieces: ONE wouldn't be whole cents, a piece of q is.
    const q = pick([2, 3, 4], rand);
    const p = pick(q === 2 ? [175, 325, 125, 375, 225] : q === 3 ? [500, 400, 700, 1000, 200, 800] : [250, 350, 450, 650, 150], rand);
    if (p % q === 0) return null;
    const m = randInt(2, 3, rand);
    const k = randInt(2, 6, rand);
    if (k === m || gcd(k, m) !== 1) return null;
    L = ladder(fruit, q * m, p * m);
    target = q * k;
  } else {
    // How many can I buy? The dollar vine leads.
    const q = randInt(2, 5, rand);
    const p = pick([200, 300, 400, 500, 600], rand);
    const m = randInt(2, 6, rand);
    const k = randInt(2, 9, rand);
    if (k === m || gcd(k, m) !== 1 || p * m > 3000 || p === q * 100) return null;
    L = ladder(fruit, q * m, p * m);
    drive = "bottom";
    target = p * k;
  }
  const startD = drive === "top" ? L.a : L.b;
  const maxDrive = Math.max(target * 2, startD * 3);
  const best = fewestMoves(L, drive, [startD], target, moves, maxDrive, 4);
  if (best.min < 2 || best.min > 3) return null;
  if (stage === 1 && fewestMoves(L, drive, [startD], 1, moves, maxDrive, 1).min === 1) return null; // ONE must be impossible
  const goal = rungFor(L, drive, target);
  if (!goal) return null;
  const r = {
    kind: "reach",
    layout: "single",
    ladders: [{ L, start: [[L.a, L.b]] }],
    L, drive, target, goal, moves, maxDrive, fruit,
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    sig: `r${stage}:${fruit.one}:${L.a}:${L.b}>${target}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = marketQuestion(r);
  r.working = solveLines(r, `${vineText(fruit, L.a)} cost ${fmtMoney(L.b)}.`);
  r.working.push(drive === "top" ? `${vineText(fruit, goal[0])} cost ${fmtMoney(goal[1])}.` : `${fmtMoney(goal[1])} buys ${vineText(fruit, goal[0])}.`);
  r.celebrate = `${amt(fruit, goal[0])} = ${fmtMoney(goal[1])}`;
  return r;
}

function makeCompare(stage, rand) {
  const moves = MARKET_MOVES[stage];
  let fruit, A, B;
  if (stage === 3) {
    fruit = pick(MARKET_FRUIT, rand);
    const [nA, nB] = shuffle([3, 4, 5, 6, 8, 10], rand).slice(0, 2);
    const uA = randInt(10, 30, rand) * 5, uB = randInt(10, 30, rand) * 5;
    if (Math.abs(uA - uB) < 5 || uA === uB) return null;
    A = ladder(fruit, nA, nA * uA);
    B = ladder(fruit, nB, nB * uB);
  } else {
    fruit = pick(MARKET_KG, rand);
    const [mA, mB] = shuffle([500, 1000, 1500, 2000, 2500, 3000], rand).slice(0, 2);
    const uA = randInt(12, 36, rand) * 25, uB = randInt(12, 36, rand) * 25; // $ per kg
    if (Math.abs(uA - uB) < 25) return null;
    if ((mA * uA) % 1000 || (mB * uB) % 1000) return null;
    A = ladder(fruit, mA, (mA * uA) / 1000);
    B = ladder(fruit, mB, (mB * uB) / 1000);
  }
  // The trap: the stall with MORE fruit also costs MORE in total, so the
  // bare totals can't settle it.
  if ((A.a > B.a) !== (A.b > B.b)) return null;
  const unitA = A.b / A.a, unitB = B.b / B.a;
  const better = unitA < unitB ? 0 : 1;
  // A common rung reachable in a move or two (any common amount works).
  const maxDrive = Math.max(A.a, B.a) * 12;
  const oneA = oneMoveValues(A, "top", A.a, moves, maxDrive);
  const oneB = oneMoveValues(B, "top", B.a, moves, maxDrive);
  oneA.set(A.a, null);
  oneB.set(B.a, null);
  let plan = null;
  for (const [v, sa] of oneA) {
    if (!oneB.has(v)) continue;
    const sb = oneB.get(v);
    const cost = (sa ? 1 : 0) + (sb ? 1 : 0);
    if (!plan || cost < plan.cost || (cost === plan.cost && v < plan.v)) plan = { v, cost };
  }
  if (!plan || plan.cost < 1) return null;
  const cA = rungFor(A, "top", plan.v), cB = rungFor(B, "top", plan.v);
  const r = {
    kind: "compare",
    layout: "shared",
    ladders: [{ L: A, start: [[A.a, A.b]], name: "Stall A" }, { L: B, start: [[B.a, B.b]], name: "Stall B" }],
    L: A, drive: "top", fruit, moves, better, maxDrive,
    phases: [
      { type: "common", planAt: plan.v },
      { type: "call", options: [{ label: "Stall A" }, { label: "Stall B" }], correct: better, final: true, ask: "Which stall is the better buy?" },
    ],
    sig: `c${stage}:${fruit.one}:${A.a}:${A.b}|${B.a}:${B.b}`,
  };
  if (!planRound(r, 3)) return null;
  r.q = marketQuestion(r);
  r.working = solveLines(r, `Stall A: ${amt(fruit, A.a)} for ${fmtMoney(A.b)} · Stall B: ${amt(fruit, B.a)} for ${fmtMoney(B.b)}.`);
  r.working.push(`Same amount, ${amt(fruit, plan.v)}: ${fmtMoney(cA[1])} vs ${fmtMoney(cB[1])}.`);
  r.working.push(`${r.ladders[better].name} is the better buy.`);
  r.celebrate = `${r.ladders[better].name} is the better buy`;
  return r;
}

export function generateMarketSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The question for a round: { lead, ask }. */
export function marketQuestion(r) {
  if (r.kind === "compare") {
    const [A, B] = r.ladders.map((l) => l.L);
    return {
      lead: `Stall A: ${amt(r.fruit, A.a)} for ${fmtMoney(A.b)}. Stall B: ${amt(r.fruit, B.a)} for ${fmtMoney(B.b)}.`,
      ask: "Which stall is the better buy?",
    };
  }
  const L = r.L;
  const lead = `${vineText(r.fruit, L.a)} cost ${fmtMoney(L.b)}.`;
  if (r.drive === "top") return { lead, ask: `How much for ${vineText(r.fruit, r.goal[0])}?` };
  return { lead: `${fmtMoney(L.b)} buys ${vineText(r.fruit, L.a)}.`, ask: `How many ${r.fruit.many} for ${fmtMoney(r.goal[1])}?` };
}
