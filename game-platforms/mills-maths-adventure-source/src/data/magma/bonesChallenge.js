/**
 * GROW THE DRAGON (Dragon Bones, host Ms. Brookes) — pure logic for the
 * MULTIPLICATIVE COMPARISON / SCALING challenge.
 *
 * PEDAGOGY — Siemon's multiplicative thinking is, at heart, the move from
 * "how many more?" (additive) to "how many TIMES as many?" (multiplicative
 * comparison) — and its failure shows up as the classic additive error in
 * proportion problems (Karplus's Mr Short / Mr Tall: add the same amount
 * to every part). Here the student builds the grown-up dragon from the
 * baby's bones. One adult bone is given; the rest must be set. If the skull
 * is 3 times as long, EVERY bone is 3 times as long — and an adult built by
 * ADDING the same amount to each bone comes out visibly wonky (a stubby
 * tail, a giant head) next to the true ghost. Factors of 1.5 and 2.5 are
 * where the additive trap bites hardest; shrinking (a toy model) shows a
 * scale factor can be less than one.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  twice / three times      ×2, ×3
 *   S2  one and a half           ×1.5 (the additive trap: 2 → 3 is "+1"?)
 *   S3  shrink it                a toy dragon ×½, ×⅓, ×¼
 *   S4  two and a half           ×2.5
 *   S5  how many times?          say the factor first, then build
 *
 * Scoring (per round, max 25):
 *   S1–S4  5 per correct bone (3 bones) + 10 if all right on the first Raise
 *   S5     the factor (one try) 10 + 5 per correct bone
 * One retry: after a wrong Raise the ghost shows the true dragon; bones
 * fixed on the second Raise still earn their 5.
 */
import { buildSet, randInt, shuffle, pick } from "./magmaMath.js";

export const BONE_NAMES = ["Skull", "Neck", "Body", "Tail"];
export const BONES_PER_BONE = 5;
export const BONES_FIRST_TRY = 10;
export const BONES_FACTOR_POINTS = 10;
export const BONES_MAX_LEN = 60;

/** k as text ("3", "1.5", "½"). */
export function factorText(num, den) {
  if (den === 1) return String(num);
  if (num === 1) return { 2: "½", 3: "⅓", 4: "¼" }[den] || `1/${den}`;
  return String(num / den);
}

function makeRound(i, stage, rand) {
  let num, den, baby;
  const distinct = (lo, hi, step = 1) => {
    const pool = [];
    for (let v = lo; v <= hi; v += step) pool.push(v);
    return shuffle(pool, rand).slice(0, 4);
  };
  if (stage === 0) { num = pick([2, 3], rand); den = 1; baby = distinct(1, 7); }
  else if (stage === 1) { num = 3; den = 2; baby = distinct(2, 12, 2); }
  else if (stage === 2) { num = 1; den = pick([2, 3, 4], rand); baby = distinct(den, den * 8, den); }
  else if (stage === 3) { num = 5; den = 2; baby = distinct(2, 10, 2); }
  else {
    // S5: integer or a half factor, asked for first.
    const opt = pick([[2, 1], [3, 1], [4, 1], [5, 1], [3, 2]], rand);
    [num, den] = opt;
    baby = den === 1 ? distinct(1, 8) : distinct(2, 12, 2);
  }
  const adult = baby.map((b) => (b * num) / den);
  const toy = stage === 2;
  const r = {
    num, den, baby, adult, toy,
    askFactor: stage === 4,
    factorText: factorText(num, den),
    sig: `${num}/${den}:${baby.join(",")}`,
  };
  return { ...r, working: bonesWorking(r) };
}

function bonesWorking(r) {
  const what = r.toy ? "toy" : "grown-up";
  const k = r.factorText;
  const lines = [
    `Skull: ${r.baby[0]} → ${r.adult[0]}. That's ${r.den === 1 && r.num > 1 ? `${k} times as long` : `× ${k}`} — for EVERY bone.`,
    BONE_NAMES.slice(1).map((n, j) => `${n} ${r.baby[j + 1]} × ${k} = ${r.adult[j + 1]}`).join(" · "),
  ];
  const add = r.adult[0] - r.baby[0];
  if (add !== 0) lines.push(`Adding ${Math.abs(add)} to every bone would make a wonky ${what} dragon!`);
  return lines;
}

export function generateBonesSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** The student's starting values for the three bones (the baby's lengths). */
export function bonesStart(r) {
  return r.baby.slice(1);
}

/**
 * Grade a Raise. `vals` = the three adult bones the student set.
 * Returns { correct:[bool×3], all, additive:[bool×3] }.
 */
export function gradeBonesRaise(r, vals) {
  const add = r.adult[0] - r.baby[0];
  const correct = vals.map((v, j) => v === r.adult[j + 1]);
  const additive = vals.map((v, j) => !correct[j] && v === r.baby[j + 1] + add);
  return { correct, all: correct.every(Boolean), additive };
}

/** The S5 factor (accepts 1.5, 1½, 3/2, "3 times"). */
export function checkBonesFactor(r, text) {
  let t = String(text ?? "").trim().toLowerCase().replace(/times|x|×/g, "").trim();
  t = t.replace("½", ".5").replace(/^\./, "0.");
  let v = null;
  if (/^\d+(\.\d+)?$/.test(t)) v = Number(t);
  else if (/^\d+\s*\/\s*\d+$/.test(t)) { const [a, b] = t.split("/").map(Number); v = b ? a / b : null; }
  else if (/^\d+\s+\.5$/.test(t)) v = Number(t.replace(/\s+/, ""));
  if (v === null) return { valid: false, correct: false };
  return { valid: true, correct: Math.abs(v - r.num / r.den) < 1e-9 };
}

/** Bone lengths as a dragon PROPORTION check: the scale each bone implies. */
export function bonesScales(r, vals) {
  return [r.adult[0] / r.baby[0], ...vals.map((v, j) => v / r.baby[j + 1])];
}
