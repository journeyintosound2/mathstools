/**
 * SUNNY MARKET (Sunny Knoll, host Mr. Pearce) — pure logic for the second
 * Emerald Jungle challenge: the UNITARY METHOD, friendly pieces and BEST BUYS
 * (NSW MA4-RAT-C-01: "apply the unitary method", "financial applications of
 * rates, such as best buys").
 *
 * The vine ladder hangs in front of the fruit stalls: fruit on the top
 * vine, dollars on the bottom (money is held in whole CENTS — a move that
 * would make a fraction of a cent is refused). The new move is SPLIT: chop
 * the rung into n equal pieces on BOTH vines at once.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  go through one     "4 pineapples cost $10. How much for 7?" — split
 *                          to ONE, then stretch (× 7)
 *   S2  a friendlier piece "6 papayas cost $10. How much for 9?" — ONE costs
 *                          $1.666…, so split into a friendlier piece (3 for $5)
 *   S3  how many can I buy? "$12 buys 8 coconuts. How many for $21?" — the
 *                          dollar vine leads; the student types the fruit
 *   S4  best buy           two stalls, two ladders on the same fruit scale —
 *                          build both to the SAME number of fruit, then choose
 *   S5  best buy by the kg  the same with kilograms (1.5 kg for $6 vs 2 kg
 *                          for $7.50)
 *
 * Scoring (per round, max 25):
 *   S1–S3  reach the target 15 (− 3 per wrong partner, min 6) + efficiency
 *          10 / 6 / 3 vs the fewest moves
 *   S4–S5  a common rung on both ladders 10 (− 2 per wrong partner, min 4)
 *          + the right stall 15
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import {
  fewestMoves, rungFor, stepText, vineText, fmtMoney, fmtKg, gcd, oneMoveValues,
} from "./vineLadder.js";

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

export const MARKET_MOVES = [
  ["split", "times", "join", "x2"],
  ["split", "times", "join", "x2", "h2"],
  ["split", "times", "join", "x2", "h2"],
  ["split", "times", "join", "x2", "h2", "x10"],
  ["split", "times", "join", "x2", "h2", "x10"],
];

const ladder = (fruit, items, cents) => ({ top: fruit, bottom: DOLLARS, a: items, b: cents });

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
  let L, drive = "top", target, pieceQ = 0;
  if (stage === 0) {
    // Through ONE: a whole-cent unit price, a target that shares no factor
    // with the starting count (so splitting to one IS the friendly route).
    const u = pick([150, 250, 120, 180, 350, 75, 60, 80, 225, 45, 90, 125], rand);
    const n0 = randInt(3, 6, rand);
    const t = randInt(2, 12, rand);
    if (t === n0 || gcd(t, n0) !== 1) return null;
    L = ladder(fruit, n0, n0 * u);
    target = t;
  } else if (stage === 1) {
    // A friendlier piece: ONE wouldn't be whole cents, a piece of q is.
    const q = pick([2, 3, 4], rand);
    const p = pick(q === 2 ? [175, 325, 125, 375, 225] : q === 3 ? [500, 400, 700, 1000, 200, 800] : [250, 350, 450, 650, 150], rand);
    if (p % q === 0) return null;
    const m = randInt(2, 3, rand);
    const k = randInt(2, 6, rand);
    if (k === m || gcd(k, m) !== 1) return null;
    L = ladder(fruit, q * m, p * m);
    target = q * k;
    pieceQ = q;
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
  const working = [`${vineText(fruit, L.a)} cost ${fmtMoney(L.b)}.`];
  for (const s of best.path) working.push(stepText(L, drive, s));
  if (stage === 1) working.push(`(One ${fruit.one} would be ${fmtMoney(L.b)} ÷ ${L.a} = ${fmtMoney(Math.floor(L.b / L.a))}… — not whole cents, so a piece of ${pieceQ} is friendlier.)`);
  working.push(drive === "top" ? `${vineText(fruit, goal[0])} cost ${fmtMoney(goal[1])}.` : `${fmtMoney(goal[1])} buys ${vineText(fruit, goal[0])}.`);
  return {
    kind: "reach",
    ladders: [{ L, start: [[L.a, L.b]] }],
    L, drive, target, goal, moves, best, min: best.min, maxDrive, fruit,
    sig: `r${stage}:${fruit.one}:${L.a}:${L.b}>${target}`,
    working,
  };
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
  // A plan: the common rung reachable in the fewest moves (≤ 1 per ladder).
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
    if (!plan || cost < plan.cost || (cost === plan.cost && v < plan.v)) plan = { v, cost, steps: [sa, sb] };
  }
  if (!plan || plan.cost < 1) return null;
  const cA = rungFor(A, "top", plan.v), cB = rungFor(B, "top", plan.v);
  const name = (i) => (i === 0 ? "Stall A" : "Stall B");
  const working = [
    `Stall A: ${vineText(fruit, A.a)} for ${fmtMoney(A.b)} · Stall B: ${vineText(fruit, B.a)} for ${fmtMoney(B.b)}.`,
  ];
  plan.steps.forEach((s, i) => { if (s) working.push(`${name(i)}: ${stepText(i === 0 ? A : B, "top", s)}`); });
  working.push(`Same amount, ${vineText(fruit, plan.v)}: ${fmtMoney(cA[1])} vs ${fmtMoney(cB[1])}.`);
  working.push(`${name(better)} is the better buy.`);
  return {
    kind: "compare",
    ladders: [{ L: A, start: [[A.a, A.b]], name: "Stall A" }, { L: B, start: [[B.a, B.b]], name: "Stall B" }],
    L: A, drive: "top", fruit, moves, better, plan, maxDrive, min: plan.cost,
    sig: `c${stage}:${fruit.one}:${A.a}:${A.b}|${B.a}:${B.b}`,
    working,
  };
}

export function generateMarketSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The question for a round: { lead, ask }. */
export function marketQuestion(r) {
  if (r.kind === "compare") {
    const [A, B] = r.ladders.map((l) => l.L);
    const amt = (L) => (r.fruit.kind === "kg" ? `${fmtKg(L.a)} of ${r.fruit.many}` : vineText(r.fruit, L.a));
    return {
      lead: `Stall A: ${amt(A)} for ${fmtMoney(A.b)}. Stall B: ${amt(B)} for ${fmtMoney(B.b)}.`,
      ask: "Which stall is the better buy?",
    };
  }
  const L = r.L;
  const lead = `${vineText(r.fruit, L.a)} cost ${fmtMoney(L.b)}.`;
  if (r.drive === "top") return { lead, ask: `How much for ${vineText(r.fruit, r.goal[0])}?` };
  return { lead: `${fmtMoney(L.b)} buys ${vineText(r.fruit, L.a)}.`, ask: `How many ${r.fruit.many} for ${fmtMoney(r.goal[1])}?` };
}

