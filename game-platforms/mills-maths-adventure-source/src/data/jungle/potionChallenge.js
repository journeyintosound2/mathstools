/**
 * MUSHROOM POTIONS (Mushroom Glade, host Ms. Brookes) — pure logic:
 * MIXTURES. A recipe "2 🔵 : 3 🟡" describes a mixture: scale it up or down on
 * the ladder and the potion keeps its colour, whatever the size of the batch;
 * add the SAME number of scoops to both and the colour changes (the additive
 * trap again — Hart; Karplus). Part : part vs part : whole, and sharing a
 * cauldron in a given ratio (NSW MA4-RAT-C-01: "divide a quantity in a given
 * ratio"). Noelting's orange-juice comparisons ("which is bluer?").
 *
 * Moonberry (🔵) on the top vine, sunfruit (🟡) below; the cauldron takes the
 * colour of what is poured, next to a vial of the recipe's colour and a
 * "too blue · just right · too yellow" meter (so colour is never the only cue).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  bigger batch       recipe 2 : 3 — make it with 8 🔵 (or 12 🟡)
 *   S2  same potion?       Fern changed the recipe (× 3 both, or + 2 both):
 *                          call SAME or DIFFERENT colour (a wrong call is a
 *                          slip — the two pours show why), then fix it on the
 *                          ladder
 *   S3  which is bluer?    3 : 5 vs 4 : 7 — a three-vine ladder sharing the
 *                          BLUE vine: build both to the same blue, then call.
 *                          Trap: the recipe with MORE blue scoops is not the
 *                          bluer one
 *   S4  fill the cauldron  part : part : whole — the shared middle vine is the
 *                          TOTAL; blue above, yellow below; fill 30 scoops
 *   S5  three ingredients  a red ember-berry too (2 : 3 : 1) — start from the
 *                          red, or from the total
 *
 * Accuracy only (vineLadder.js): 25 a round, −4 per wrong number or wrong
 * "same?" call; a wrong final call keeps 10 − 4 per wrong number.
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import { rungFor, oneMoveValues, gcd } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import { BLUE, YELLOW, RED, TOTAL, ALL_MOVES } from "./jungleUnits.js";

const RECIPES = [[2, 3], [1, 4], [3, 2], [2, 5], [3, 4], [1, 3], [4, 3], [3, 5], [2, 1], [5, 2], [1, 2], [4, 5]];
const THREES = [[2, 3, 1], [1, 2, 1], [3, 2, 1], [2, 1, 1], [1, 3, 2], [2, 2, 1], [4, 1, 1], [3, 1, 2]];

const by = (b, y) => ({ top: BLUE, bottom: YELLOW, a: b, b: y });

function makeRound(i, stage, rand) {
  for (let t = 0; t < 150; t++) {
    const r = [bigger, samePotion, bluer, fillCauldron, threeIngredients][stage](rand, i % 3);
    if (r) return r;
  }
  return bigger(rand, 0);
}

function bigger(rand, which) {
  const [b, y] = pick(RECIPES, rand);
  const L = by(b, y);
  const fromYellow = which === 2;
  const k = pick([2.5, 3, 4, 5, 6, 1.5, 3.5], rand);
  const target = fromYellow ? y * k : b * k;
  if (!Number.isInteger(target) || target > 40) return null;
  const goal = rungFor(L, fromYellow ? "bottom" : "top", target);
  if (!goal || goal[0] > 40 || goal[1] > 40) return null;
  const r = {
    kind: "reach", layout: "single",
    ladders: [{ L, start: [[b, y]] }],
    drive: fromYellow ? "bottom" : "top",
    moves: ALL_MOVES, maxDrive: 80,
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    goal, recipe: [b, y], pour: [{ b: goal[0], y: goal[1] }],
    sig: `big:${b}:${y}:${fromYellow ? "y" : "b"}${target}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = fromYellow
    ? { lead: `🧪 The glow potion: ${b} 🔵 for every ${y} 🟡.`, ask: `You have ${goal[1]} 🟡 sunfruit scoops. How many 🔵 make the same potion?` }
    : { lead: `🧪 The glow potion: ${b} 🔵 for every ${y} 🟡.`, ask: `Make a big batch with ${goal[0]} 🔵. How many 🟡?` };
  r.working = solveLines(r, `${b} 🔵 ↔ ${y} 🟡`);
  r.working.push(`${goal[0]} 🔵 : ${goal[1]} 🟡 — the same colour, a bigger batch.`);
  r.celebrate = `${goal[0]} 🔵 : ${goal[1]} 🟡 — just right!`;
  return r;
}

function samePotion(rand, which) {
  const [b, y] = pick(RECIPES, rand);
  const L = by(b, y);
  const same = which === 1 ? true : which === 0 ? false : rand() < 0.5;
  let fb, fy, how;
  if (same) {
    const k = pick([2, 3, 4], rand);
    fb = b * k; fy = y * k; how = `× ${k} to both`;
  } else {
    const c = randInt(1, 4, rand);
    fb = b + c; fy = y + c; how = `+ ${c} to both`;
    if (fb * y === fy * b) return null;
  }
  if (fb > 24 || fy > 30) return null;
  const goal = rungFor(L, "top", fb);
  if (!goal || goal[1] > 60) return null;
  const r = {
    kind: "same", layout: "single",
    ladders: [{ L, start: [[b, y]] }],
    drive: "top", moves: ALL_MOVES, maxDrive: 80,
    phases: [
      {
        type: "call", ask: `Fern's batch is ${fb} 🔵 : ${fy} 🟡. Same colour as the recipe?`,
        options: [{ label: "Same colour", icon: "🟢" }, { label: "Different colour", icon: "🎨" }],
        correct: same ? 0 : 1, final: false, slipName: "Fern's batch: called",
        right: same ? `✓ Same colour — ${how} keeps the mix.` : `✓ Different — ${how} changes the mix (watch the pours).`,
        wrong: same ? `It's the SAME colour — ${how} scales the whole recipe.` : `It's DIFFERENT — ${how} adds the same to both, which changes the mix.`,
      },
      { type: "build", goals: [{ li: 0, target: fb }], ask: `With Fern's ${fb} 🔵, how many 🟡 make the recipe's colour?` },
    ],
    goal, recipe: [b, y], fern: [fb, fy], same,
    pour: [{ b: fb, y: fy, who: "Fern" }, { b: goal[0], y: goal[1] }],
    sig: `same:${b}:${y}:${fb}:${fy}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🧪 Recipe: ${b} 🔵 for every ${y} 🟡. Fern did ${how}.`, ask: "Same potion?" };
  r.working = [`Fern did ${how}: ${same ? "multiplying both keeps the recipe" : "adding the same to both changes it"}.`];
  r.working.push(...solveLines(r).filter(Boolean));
  r.working.push(`${fb} 🔵 needs ${goal[1]} 🟡${same ? " — exactly Fern's batch." : ` (Fern used ${fy}).`}`);
  r.celebrate = same ? `Same potion — ${fb} 🔵 : ${goal[1]} 🟡` : `Fixed: ${fb} 🔵 : ${goal[1]} 🟡`;
  return r;
}

function bluer(rand) {
  const [[b1, y1], [b2, y2]] = shuffle(RECIPES, rand).slice(0, 2);
  if (b1 * y2 === b2 * y1) return null;
  // The trap: the recipe with MORE blue scoops is the LESS blue potion.
  const p1 = b1 / (b1 + y1), p2 = b2 / (b2 + y2);
  if ((b1 > b2) === (p1 > p2) || b1 === b2) return null;
  if (Math.abs(p1 - p2) < 0.04) return null;
  const A = by(b1, y1), B = by(b2, y2);
  const oneA = oneMoveValues(A, "top", b1, ALL_MOVES, 40);
  const oneB = oneMoveValues(B, "top", b2, ALL_MOVES, 40);
  oneA.set(b1, null); oneB.set(b2, null);
  let plan = null;
  for (const [v, sa] of oneA) {
    if (!oneB.has(v)) continue;
    const cost = (sa ? 1 : 0) + (oneB.get(v) ? 1 : 0);
    if (cost < 1) continue;
    if (!plan || cost < plan.cost || (cost === plan.cost && v < plan.v)) plan = { v, cost };
  }
  if (!plan) return null;
  const better = p1 > p2 ? 0 : 1;
  const cA = rungFor(A, "top", plan.v), cB = rungFor(B, "top", plan.v);
  const r = {
    kind: "compare", layout: "shared",
    ladders: [{ L: A, start: [[b1, y1]], name: "Potion A" }, { L: B, start: [[b2, y2]], name: "Potion B" }],
    drive: "top", moves: ALL_MOVES, maxDrive: 40, better,
    phases: [
      { type: "common", planAt: plan.v, hint: "Build both potions to the SAME number of 🔵 scoops" },
      { type: "call", ask: "Which potion is bluer?", options: [{ label: "Potion A", icon: "🧪" }, { label: "Potion B", icon: "⚗️" }], correct: better, final: true },
    ],
    recipes: [[b1, y1], [b2, y2]],
    pour: [{ b: b1, y: y1, who: "A" }, { b: b2, y: y2, who: "B" }],
    sig: `bluer:${b1}:${y1}|${b2}:${y2}`,
  };
  if (!planRound(r, 3)) return null;
  r.q = { lead: `🧪 Potion A: ${b1} 🔵 : ${y1} 🟡. Potion B: ${b2} 🔵 : ${y2} 🟡.`, ask: "Which potion is bluer?" };
  r.working = solveLines(r, "Line both potions up at the same blue:");
  r.working.push(`With ${plan.v} 🔵: A needs ${cA[1]} 🟡, B needs ${cB[1]} 🟡 — less yellow is bluer.`);
  r.celebrate = `${r.ladders[better].name} is bluer`;
  return r;
}

function fillCauldron(rand) {
  const [b, y] = pick(RECIPES, rand);
  const t = b + y;
  const T = pick([20, 24, 30, 36, 40, 18, 28, 45, 35], rand);
  const A = { top: TOTAL, bottom: BLUE, a: t, b }, B = { top: TOTAL, bottom: YELLOW, a: t, b: y };
  const gA = rungFor(A, "top", T), gB = rungFor(B, "top", T);
  if (!gA || !gB || T === t) return null;
  const r = {
    kind: "fill", layout: "shared",
    ladders: [{ L: A, start: [[t, b]], name: "🔵 blue" }, { L: B, start: [[t, y]], name: "🟡 yellow" }],
    drive: "top", moves: ALL_MOVES, maxDrive: 90,
    phases: [{ type: "build", goals: [{ li: 0, target: T }, { li: 1, target: T }], hint: `Build to ${T} scoops in all — then read the 🔵 and the 🟡` }],
    recipe: [b, y], pour: [{ b: gA[1], y: gB[1] }], total: T,
    sig: `fill:${b}:${y}>${T}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🧪 Recipe ${b} 🔵 : ${y} 🟡 — that's ${t} scoops in every batch.`, ask: `The cauldron holds ${T} scoops. How many 🔵 and how many 🟡?` };
  r.working = solveLines(r, `${t} scoops in all ↔ ${b} 🔵 and ${y} 🟡`);
  r.working.push(`${gA[1]} 🔵 + ${gB[1]} 🟡 = ${T} scoops.`);
  r.celebrate = `${gA[1]} 🔵 + ${gB[1]} 🟡 = ${T}`;
  return r;
}

function threeIngredients(rand, which) {
  const [b, y, e] = pick(THREES, rand);
  const fromTotal = which === 2;
  const share = fromTotal ? { v: TOTAL, n: b + y + e } : { v: RED, n: e };
  const T = fromTotal ? pick([12, 18, 24, 30, 36, 42], rand) : pick([3, 4, 5, 6, 8, 10], rand);
  const A = { top: share.v, bottom: BLUE, a: share.n, b }, B = { top: share.v, bottom: YELLOW, a: share.n, b: y };
  const gA = rungFor(A, "top", T), gB = rungFor(B, "top", T);
  if (!gA || !gB || T === share.n || gA[1] > 40 || gB[1] > 40) return null;
  const redAt = fromTotal ? (T * e) / (b + y + e) : T;
  if (!Number.isInteger(redAt)) return null;
  const r = {
    kind: "three", layout: "shared",
    ladders: [{ L: A, start: [[share.n, b]], name: "🔵 blue" }, { L: B, start: [[share.n, y]], name: "🟡 yellow" }],
    drive: "top", moves: ALL_MOVES, maxDrive: Math.max(T * 2, 40),
    phases: [{ type: "build", goals: [{ li: 0, target: T }, { li: 1, target: T }], hint: `Reach ${fromTotal ? `${T} scoops in all` : `${T} 🔴`} on both — then read the 🔵 and the 🟡` }],
    recipe3: [b, y, e], pour: [{ b: gA[1], y: gB[1], e: redAt }],
    sig: `three:${b}:${y}:${e}:${fromTotal ? "t" : "r"}${T}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = fromTotal
    ? { lead: `🧪 Ember potion: ${b} 🔵 : ${y} 🟡 : ${e} 🔴 (${b + y + e} scoops a batch).`, ask: `Fill a ${T}-scoop cauldron. How many 🔵 and 🟡?` }
    : { lead: `🧪 Ember potion: ${b} 🔵 : ${y} 🟡 : ${e} 🔴.`, ask: `You have ${T} 🔴 ember-berries. How many 🔵 and 🟡?` };
  r.working = solveLines(r, `${b} 🔵 : ${y} 🟡 : ${e} 🔴`);
  r.working.push(`${gA[1]} 🔵 : ${gB[1]} 🟡 : ${redAt} 🔴`);
  r.celebrate = `${gA[1]} 🔵 : ${gB[1]} 🟡 : ${redAt} 🔴`;
  return r;
}

export function generatePotionSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export const __parts = [
  (rand) => bigger(rand, Math.floor(rand() * 3)),
  (rand) => samePotion(rand, Math.floor(rand() * 3)),
  bluer,
  fillCauldron,
  (rand) => threeIngredients(rand, Math.floor(rand() * 3)),
];

// ---------------------------------------------------------------------------
// COLOUR — pigments mix like paint (a weighted geometric mean of each
// channel's reflectance), so blue + yellow really makes green.
// ---------------------------------------------------------------------------
const PIG = { b: [0.09, 0.32, 0.95], y: [1.0, 0.86, 0.08], e: [0.95, 0.18, 0.1] };

/** Potion colour for amounts { b, y, e } → [r, g, b] in 0..1. */
export function potionRGB({ b = 0, y = 0, e = 0 }) {
  const n = b + y + e;
  if (n <= 0) return [0.6, 0.6, 0.6];
  return [0, 1, 2].map((c) => Math.exp((b * Math.log(PIG.b[c]) + y * Math.log(PIG.y[c]) + e * Math.log(PIG.e[c])) / n));
}
/** "#rrggbb" for a potion. */
export function potionHex(m) {
  return `#${potionRGB(m).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("")}`;
}
/** Blue share 0..1 of a two-colour potion (the meter). */
export const blueShare = ({ b = 0, y = 0 }) => (b + y ? b / (b + y) : 0.5);

export { gcd };
