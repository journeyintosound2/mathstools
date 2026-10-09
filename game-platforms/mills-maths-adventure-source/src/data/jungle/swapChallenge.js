/**
 * MONKEY SWAP (Palm Grove, host Mr. Morgan) — pure logic for the first
 * Emerald Jungle challenge: a ratio is a COMPOSED UNIT you can repeat.
 *
 * The monkeys swap fruit: "3 bananas for 2 mangoes". The vine ladder is
 * strung between two palms — bananas on the top vine, mangoes below, tied
 * together at zero. The starting rung IS the deal; every new rung is
 * another fair swap. Students build rungs with moves (again, double, × 10,
 * join, halve, split); the SCENE fills in one vine and the student types the
 * partner on the other. Real fruit hangs from the vines in the early stages
 * (3 bananas above every 2 mangoes — the bundle you can SEE), then fades so
 * the numbers do the work (model of → model for).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  build it up      "again" only — 3, 4 or 5 swaps
 *   S2  jump ahead       again · × 2 · × 10 · join — 8 to 40 swaps
 *   S3  backwards        the monkey names the MANGOES; you find the bananas
 *   S4  half a swap      even deals (4 ↔ 6): halve the deal to reach 10 bananas
 *   S5  the smallest swap a big offer (12 ↔ 8) split down to 3 ↔ 2 — the same
 *                        deal, simplified (equivalent ratios)
 *
 * Scoring (per round, max 25):
 *   reach the target rung      15 (− 3 for each wrong partner, min 6)
 *   efficiency vs the fewest moves: equal 10 · one more 6 · else 3
 *   S5: claiming before the smallest swap costs 5; one extra move is free
 */
import { buildSet, pick, randInt } from "../magma/magmaMath.js";
import { fewestMoves, rungFor, stepText, vineChip, gcd } from "./vineLadder.js";

export const BANANA = { kind: "count", icon: "🍌", one: "banana", many: "bananas" };
export const MANGO = { kind: "count", icon: "🥭", one: "mango", many: "mangoes" };

const S1_DEALS = [[3, 2], [2, 3], [4, 3], [3, 4], [5, 2], [2, 5], [5, 3], [3, 5], [4, 5], [5, 4]];
const S4_DEALS = [[4, 6], [6, 4], [4, 10], [10, 4], [6, 10], [10, 6], [8, 6], [6, 8], [2, 6], [6, 2]];
const S5_BASES = [[3, 2], [2, 3], [4, 3], [3, 4], [5, 2], [2, 5], [5, 3], [3, 5], [5, 4], [4, 5]];

export const SWAP_MOVES = [
  ["again"],
  ["again", "x2", "x10", "join"],
  ["again", "x2", "x10", "join"],
  ["again", "x2", "h2", "x10", "join"],
  ["h2", "split"],
];

function ladder(a, b) {
  return { top: BANANA, bottom: MANGO, a, b };
}

function makeRound(i, stage, rand) {
  for (let t = 0; t < 60; t++) {
    const r = makeRoundOnce(stage, rand);
    if (r) return r;
  }
  // Never reached in practice (the checks fuzz it); a safe fallback.
  return makeRoundOnce(0, rand);
}

function makeRoundOnce(stage, rand) {
  const moves = SWAP_MOVES[stage];
  if (stage === 4) {
    // The smallest swap: a big offer that splits down to a coprime deal.
    const [a, b] = pick(S5_BASES, rand);
    const m = pick([4, 6, 8, 9, 10, 12], rand);
    if (a * m > 60 || b * m > 60) return null;
    const L = ladder(a * m, b * m);
    const best = fewestMoves(L, "top", [a * m], a, moves, a * m);
    if (best.min > 3) return null;
    return finish({ kind: "smallest", L, drive: "top", start: [[a * m, b * m]], target: a, smallest: [a, b], moves, best, m, fruit: false, maxDrive: a * m });
  }
  let L, drive = "top", k, target;
  if (stage === 0) {
    const [a, b] = pick(S1_DEALS, rand);
    L = ladder(a, b);
    k = randInt(3, 5, rand);
    target = a * k;
  } else if (stage === 1) {
    const [a, b] = pick(S1_DEALS, rand);
    L = ladder(a, b);
    k = pick([8, 11, 12, 20, 21, 22, 30, 40], rand);
    target = a * k;
    if (target > 100) return null;
  } else if (stage === 2) {
    const [a, b] = pick(S1_DEALS, rand);
    L = ladder(a, b);
    drive = "bottom";
    k = pick([6, 8, 11, 12, 20, 21], rand);
    target = b * k;
    if (target > 100) return null;
  } else {
    const [a, b] = pick(S4_DEALS, rand);
    L = ladder(a, b);
    const half = randInt(1, 5, rand); // (half + ½) deals
    target = (a * (2 * half + 1)) / 2;
    k = half + 0.5;
  }
  const start = [[L.a, L.b]];
  const maxDrive = Math.max(target * 2, (drive === "top" ? L.a : L.b) * 12);
  const best = fewestMoves(L, drive, [drive === "top" ? L.a : L.b], target, moves, maxDrive);
  if (stage === 0 && best.min !== k - 1) return null;
  if (stage > 0 && (best.min < 2 || best.min > 4)) return null;
  if (stage === 3 && !best.path.some((s) => s.op === "h2")) return null;
  const rung = rungFor(L, drive, target);
  if (!rung) return null;
  // Real fruit hangs from the vines while the numbers stay small.
  const fruit = stage === 0 || (stage === 1 && rung[0] <= 30 && rung[1] <= 30);
  return finish({ kind: "reach", L, drive, start, target, moves, best, fruit, maxDrive, k });
}

function finish(r) {
  const { L, drive } = r;
  const goal = rungFor(L, drive, r.target);
  const working = [`The deal: ${vineChip(L.top, r.start[0][0])} ↔ ${vineChip(L.bottom, r.start[0][1])}`];
  for (const s of r.best.path) working.push(stepText(L, drive, s));
  if (r.kind === "smallest") {
    const g = gcd(r.start[0][0], r.start[0][1]);
    working.push(`${r.smallest[0]} 🍌 ↔ ${r.smallest[1]} 🥭 won't split into whole fruit — it's the smallest swap.`);
    working.push(`${r.start[0][0]} ↔ ${r.start[0][1]} is the SAME deal, ${g} times over.`);
  } else if (drive === "top") {
    working.push(`${goal[0]} bananas get ${goal[1]} mangoes.`);
  } else {
    working.push(`${goal[1]} mangoes cost ${goal[0]} bananas.`);
  }
  return {
    ...r,
    ladders: [{ L, start: r.start }],
    goal,
    min: r.best.min,
    sig: `${r.kind}:${L.a}:${L.b}:${drive}>${r.target}`,
    working,
  };
}

export function generateSwapSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The question for a round: { lead, ask }. */
export function swapQuestion(r) {
  const [a, b] = r.start[0];
  if (r.kind === "smallest") {
    return { lead: `A big monkey offers ${a} 🍌 for ${b} 🥭.`, ask: "Split it down to the SMALLEST fair swap." };
  }
  const lead = `The deal: ${a} 🍌 for ${b} 🥭.`;
  if (r.drive === "top") return { lead, ask: `How many mangoes for ${r.goal[0]} bananas?` };
  return { lead, ask: `The monkey wants ${r.goal[1]} mangoes. How many bananas?` };
}
