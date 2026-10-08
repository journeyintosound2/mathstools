/**
 * FLOWER COMBOS (Fire Flower Garden, host Trevor) — pure logic for the
 * FOR-EACH (Cartesian product) challenge.
 *
 * PEDAGOGY — Siemon's "for each" idea is the hardest of the multiplicative
 * models (it is where multiplication stops being "groups of") and the
 * gateway to ratio. Every combination of a flower and a pot is one plant —
 * and when the combos are planted in order they LAY THEMSELVES OUT AS AN
 * ARRAY: FOR EACH flower, a whole row of pots. The garden never pre-draws
 * the empty grid (that would give the structure away); it appears as the
 * student plants. "Plant a whole row" is the for-each button. A third
 * attribute (a glow) copies the whole array once per glow — 3 × 4 × 2 —
 * and the inverse rounds run it backwards (24 combos from 6 flowers: how
 * many pots?), which is division as a missing factor.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  small             2–3 flowers × 2–4 pots
 *   S2  bigger            3–5 × 3–5
 *   S3  add a glow        2–3 × 2–3 × 2 glows
 *   S4  missing factor    "24 combos from 6 flowers — how many pots?"
 *   S5  big gardens       4–6 × 4–6, and a three-glow garden
 *
 * Scoring (per round, max 25):
 *   the prediction (combos, or the missing factor), one try     10
 *   "That's every combo!" with the garden complete             15
 *   (an incomplete garden scores its share and shows the gaps)
 */
import { buildSet, randInt } from "./magmaMath.js";

export const GARDEN_PREDICT_POINTS = 10;
export const GARDEN_PLANT_POINTS = 15;

export const GARDEN_FLOWERS = [
  { name: "Fire Lily", color: "#ff4a1c" },
  { name: "Sun Poppy", color: "#ffc21a" },
  { name: "Ember Rose", color: "#ff2f6d" },
  { name: "Ash Daisy", color: "#f2ede4" },
  { name: "Glow Orchid", color: "#b45cff" },
  { name: "Lava Tulip", color: "#ff8a1a" },
];
export const GARDEN_POTS = [
  { name: "Clay", color: "#b8613a" },
  { name: "Stone", color: "#8a8580" },
  { name: "Obsidian", color: "#1d1622" },
  { name: "Gold", color: "#e8b923" },
  { name: "Copper", color: "#c9743d" },
  { name: "Bone", color: "#e9dcc0" },
];
export const GARDEN_GLOWS = [
  { name: "Ember glow", color: "#ff7a1a" },
  { name: "Moon glow", color: "#9fd8ff" },
  { name: "Star glow", color: "#fff3a0" },
];

function makeRound(i, stage, rand) {
  let f, p, g = 1, inverse = false;
  if (stage === 0) { f = randInt(2, 3, rand); p = randInt(2, 4, rand); }
  else if (stage === 1) { f = randInt(3, 5, rand); p = randInt(3, 5, rand); }
  else if (stage === 2) { f = randInt(2, 3, rand); p = randInt(2, 3, rand); g = 2; }
  else if (stage === 3) { f = randInt(3, 6, rand); p = randInt(3, 6, rand); inverse = true; }
  else if (i === 13) { f = randInt(2, 3, rand); p = 3; g = 3; }
  else { f = randInt(4, 6, rand); p = randInt(4, 6, rand); }
  const total = f * p * g;
  const r = { f, p, g, total, inverse, sig: `${f}x${p}x${g}${inverse ? "i" : ""}` };
  return { ...r, working: gardenWorking(r) };
}

function gardenWorking(r) {
  const lines = [`For EACH of the ${r.f} flowers there's a whole row of ${r.p} pots.`];
  if (r.g > 1) {
    lines.push(`${r.f} × ${r.p} = ${r.f * r.p} combos for one glow…`);
    lines.push(`…and that whole garden again FOR EACH of the ${r.g} glows: ${r.f * r.p} × ${r.g} = ${r.total}`);
  } else if (r.inverse) {
    lines.push(`${r.f} rows of ? make ${r.total} — ${r.total} ÷ ${r.f} = ${r.p} pots.`);
  } else {
    lines.push(`${r.f} rows × ${r.p} = ${r.total} combos.`);
  }
  return lines;
}

export function generateGardenSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The number the prediction asks for (combos, or pots when inverse). */
export function gardenPredictTarget(r) {
  return r.inverse ? r.p : r.total;
}

export function gradeGardenPredict(r, text) {
  const t = String(text ?? "").trim();
  if (!/^\d+$/.test(t)) return { valid: false };
  const want = gardenPredictTarget(r);
  const correct = Number(t) === want;
  let note;
  if (correct) note = r.inverse ? `Yes — ${r.p} pots! ${r.f} × ${r.p} = ${r.total}. +10` : `Spot on — ${r.total} combos! +10`;
  else if (!r.inverse && Number(t) === r.f + r.p + (r.g > 1 ? r.g : 0)) note = `That ADDS them — but every flower goes with EVERY pot. Let's plant and see!`;
  else note = r.inverse ? `Let's plant and find out how many pots there are.` : `Not quite — let's plant them all and see.`;
  return { valid: true, correct, note };
}

export const gardenKey = (fi, pi, gi = 0) => `${fi}-${pi}-${gi}`;

/** Grade "That's every combo!" from the planted set. */
export function gradeGardenClaim(r, planted) {
  const n = planted.size ?? planted.length;
  const all = n >= r.total;
  return { all, n, points: all ? GARDEN_PLANT_POINTS : Math.floor((GARDEN_PLANT_POINTS * n) / r.total) };
}

/** Every combo key for a round (for the reveal of the gaps). */
export function gardenAllKeys(r) {
  const out = [];
  for (let gi = 0; gi < r.g; gi++) for (let fi = 0; fi < r.f; fi++) for (let pi = 0; pi < r.p; pi++) out.push(gardenKey(fi, pi, gi));
  return out;
}
