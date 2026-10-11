/**
 * TALL TREE TAPE (The Great Tree, host Ms. Ewings) — pure logic: CONVERTING
 * UNITS. When both edges of a tape measure the SAME thing in different units
 * (metres and centimetres), every rung is a conversion — and ONE number
 * crosses from one edge to the other at every rung (Vergnaud's function
 * relation; the conversion factor). ICCAMS found this "between the lines"
 * multiplier much harder than working along a line, so the tape gives it a
 * whole challenge: students first SPOT the across number on three given
 * rungs, then may use it ("↔ Across" jumps straight to the target) — or keep
 * building along. Both are equally good; only wrong numbers cost.
 *
 * The tape hangs VERTICALLY from a bamboo gantry under the Great Tree: the
 * left edge is one unit, the right edge the other, zero at the ground.
 *
 * A SET is 15 rounds, 3 per stage (metric only — Jeff, 2026-10-10):
 *   S1  metric pairs      m ↔ cm, km ↔ m, L ↔ mL, cm ↔ mm
 *   S2  kitchen measures  cups ↔ mL (× 250), tablespoons ↔ mL (× 20),
 *                         teaspoons ↔ mL (× 5)
 *   S3  paces             "8 paces ≈ 6 m" — the across number is awkward
 *                         (0.75), so this stage is along-only: the point is
 *                         that working along ALWAYS works
 *   S4  three edges       m | cm | mm (or h | min | s) on one tape: the shared
 *                         middle vine, a target on both outer edges
 *   S5  along or across   kg ↔ g, h ↔ min, $ ↔ cents, L ↔ mL — spot the
 *                         across number, then your choice
 * In every round with an across step the LAST round of the stage leads
 * from the RIGHT edge (backwards: 650 cm → ? m — across means ÷).
 */
import { buildSet, pick, shuffle } from "../magma/magmaMath.js";
import { rungFor, fmtVal, fmtDec } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import {
  MET, MET1, MET2, KM2, CM, CM1, MM, LIT2, ML, CUPS, TBSP, TSP, PACES, KG2, GRAM, HOUR2, MIN, SEC, DOLLARS, CENTS, num, ALL_MOVES_10, ALL_MOVES,
} from "./jungleUnits.js";

const K = num("", 2, "", "");

// [left vine, right vine, left base for 1 unit, right base for 1 unit, across k (display), goal values (left base)]
const METRIC = [
  { left: MET2, right: CM, a: 100, b: 100, k: 100, goals: [125, 240, 375, 460, 85, 315, 530, 175], what: "how high the monkey climbed" },
  { left: KM2, right: MET, a: 100, b: 1000, k: 1000, goals: [150, 225, 340, 75, 410, 265], what: "the trail" },
  { left: LIT2, right: ML, a: 100, b: 1000, k: 1000, goals: [125, 250, 175, 320, 75, 450], what: "the water bottle" },
  { left: CM1, right: MM, a: 10, b: 10, k: 10, goals: [45, 125, 72, 38, 96, 155], what: "the beetle" },
];
const KITCHEN = [
  { left: CUPS, right: ML, a: 10, b: 250, k: 250, goals: [15, 25, 30, 35, 45, 40], what: "the coconut milk" },
  { left: TBSP, right: ML, a: 10, b: 20, k: 20, goals: [25, 35, 45, 60, 70, 15], what: "the honey" },
  { left: TSP, right: ML, a: 10, b: 5, k: 5, goals: [25, 35, 70, 90, 45, 15], what: "the vanilla" },
];
const MIXED = [
  { left: KG2, right: GRAM, a: 100, b: 1000, k: 1000, goals: [125, 250, 175, 75, 320, 45], what: "the bag of nuts" },
  { left: HOUR2, right: MIN, a: 100, b: 60, k: 60, goals: [150, 25, 75, 125, 225, 50], what: "the walk" },
  { left: DOLLARS, right: CENTS, a: 100, b: 100, k: 100, goals: [350, 125, 275, 405, 85, 610], what: "the price" },
  { left: LIT2, right: ML, a: 100, b: 1000, k: 1000, goals: [225, 150, 375, 60, 410], what: "the jug" },
];
// Paces: [paces, metres in tenths] — and the paces to go.
const PACE_SETS = [[8, 60, [20, 12, 28, 30, 36]], [5, 40, [15, 20, 25, 35, 12]], [10, 70, [25, 15, 30, 45]], [6, 50, [9, 15, 18, 21, 30]], [4, 30, [10, 14, 18, 22, 26]]];

const unitWord = (v) => (v.kind === "money" ? "dollars" : v.many);
const unitShort = (v) => (v.kind === "money" ? "$" : v.unit);

function makeRound(i, stage, rand) {
  for (let t = 0; t < 120; t++) {
    const r = stage === 0 ? across(pick(METRIC, rand), i % 3 === 2, rand)
      : stage === 1 ? across(pick(KITCHEN, rand), i % 3 === 2, rand)
        : stage === 2 ? paces(i % 3 === 2, rand)
          : stage === 3 ? threeEdges(rand)
            : across(pick(MIXED, rand), i % 3 === 2, rand);
    if (r) return r;
  }
  return across(METRIC[0], false, rand);
}

/** Spot the across number on three given rungs, then reach the target (any way). */
function across(P, backwards, rand) {
  const L = { top: P.left, bottom: P.right, a: P.a, b: P.b };
  const start = [[P.a, P.b], [P.a * 2, P.b * 2], [P.a / 2, P.b / 2]];
  if (!Number.isInteger(start[2][0]) || !Number.isInteger(start[2][1])) start.pop();
  const gv = pick(P.goals, rand);
  const drive = backwards ? "bottom" : "top";
  const goalRung = rungFor(L, "top", gv);
  if (!goalRung) return null;
  const target = backwards ? goalRung[1] : gv;
  if (start.some((s) => s[0] === gv)) return null;
  const leftTxt = (v) => fmtVal(P.left, v);
  const rightTxt = (v) => fmtVal(P.right, v);
  const r = {
    kind: "tape",
    layout: "single",
    vertical: true,
    ladders: [{ L, start }],
    drive,
    moves: [...ALL_MOVES_10, "across"],
    moveLabels: { across: backwards ? `↔ Across ÷ ${P.k}` : `↔ Across × ${P.k}` },
    maxDrive: Math.max(target * 3, (drive === "top" ? P.a : P.b) * 12),
    phases: [
      {
        type: "type", label: `${unitShort(P.left)} × `, unit: `= ${unitShort(P.right)}`, vine: K, answer: P.k * 100, unlock: "across",
        ask: `What number takes you ACROSS from ${unitWord(P.left)} to ${unitWord(P.right)} on EVERY rung?`,
        slipName: "the across number", right: `✓ × ${P.k} on every rung — it's the across number. Use ↔ Across, or keep building along.`,
      },
      { type: "build", goals: [{ li: 0, target }] },
    ],
    acrossK: P.k,
    goal: goalRung,
    sig: `x:${P.left.unit || "$"}>${P.right.unit}:${gv}:${backwards ? "b" : "f"}`,
  };
  if (!planRound(r, 5)) return null;
  r.q = {
    lead: `📏 The tape: ${unitWord(P.left)} on the left edge, ${unitWord(P.right)} on the right.`,
    ask: backwards ? `${rightTxt(goalRung[1])} — what is that in ${unitWord(P.left)}?` : `${leftTxt(gv)} — what is that in ${unitWord(P.right)}?`,
  };
  r.phases[1].ask = r.q.ask;
  r.working = [
    `${leftTxt(P.a)} = ${rightTxt(P.b)} · ${leftTxt(P.a * 2)} = ${rightTxt(P.b * 2)}: every ${unitShort(P.right)} number is the ${unitShort(P.left)} number × ${P.k}.`,
    backwards ? `${rightTxt(goalRung[1])} ÷ ${P.k} = ${leftTxt(gv)}` : `${leftTxt(gv)} × ${P.k} = ${rightTxt(goalRung[1])}`,
  ];
  r.celebrate = `${leftTxt(goalRung[0])} = ${rightTxt(goalRung[1])}`;
  return r;
}

/** Paces ↔ metres: along only (the across number is an awkward decimal). */
function paces(backwards, rand) {
  const [p, m, goals] = pick(PACE_SETS, rand);
  const L = { top: PACES, bottom: MET1, a: p, b: m };
  const gv = pick(goals, rand);
  const goalRung = rungFor(L, "top", gv);
  if (!goalRung || gv === p) return null;
  const drive = backwards ? "bottom" : "top";
  const target = backwards ? goalRung[1] : gv;
  const r = {
    kind: "tape",
    layout: "single",
    vertical: true,
    ladders: [{ L, start: [[p, m]] }],
    drive,
    moves: ALL_MOVES,
    maxDrive: Math.max(target * 2, (drive === "top" ? p : m) * 12),
    phases: [{ type: "build", goals: [{ li: 0, target }] }],
    goal: goalRung,
    sig: `p:${p}/${m}:${gv}:${backwards ? "b" : "f"}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = {
    lead: `👣 Ms. Ewings measured her stride: ${p} paces ≈ ${fmtVal(MET1, m)}.`,
    ask: backwards ? `How many paces to walk ${fmtVal(MET1, goalRung[1])}?` : `How far is ${gv} paces?`,
  };
  r.working = solveLines(r, `${p} paces ↔ ${fmtVal(MET1, m)}`);
  r.celebrate = `${gv} paces ≈ ${fmtVal(MET1, goalRung[1])}`;
  return r;
}

/** Three edges on one tape: the middle vine shared, a target on both outer edges. */
function threeEdges(rand) {
  const kind = rand() < 0.6 ? "m" : "h";
  if (kind === "m") {
    const gv = pick([125, 250, 175, 340, 85, 205, 460, 315], rand); // metres (hundredths)
    const A = { top: MET2, bottom: CM, a: 100, b: 100 };
    const B = { top: MET2, bottom: MM, a: 100, b: 1000 };
    return tri(A, B, gv, "📏 metres", "centimetres", "millimetres", "m | cm | mm", rand);
  }
  const gv = pick([25, 50, 75, 150, 125, 200, 225], rand); // hours (hundredths)
  const A = { top: HOUR2, bottom: MIN, a: 100, b: 60 };
  const B = { top: HOUR2, bottom: SEC, a: 100, b: 3600 };
  return tri(A, B, gv, "⏱ hours", "minutes", "seconds", "h | min | s", rand);
}

function tri(A, B, gv, mid, upWord, downWord, tag) {
  const gA = rungFor(A, "top", gv), gB = rungFor(B, "top", gv);
  if (!gA || !gB) return null;
  const r = {
    kind: "tape3",
    layout: "shared",
    vertical: true,
    ladders: [{ L: A, start: [[A.a, A.b]], name: upWord }, { L: B, start: [[B.a, B.b]], name: downWord }],
    drive: "top",
    moves: [...ALL_MOVES_10, "across"],
    acrossFree: true,
    maxDrive: gv * 3,
    phases: [{ type: "build", goals: [{ li: 0, target: gv }, { li: 1, target: gv }], hint: "Reach the 🎯 on BOTH edges — along, or ↔ Across" }],
    sig: `3:${tag}:${gv}`,
  };
  if (!planRound(r, 5)) return null;
  const v = fmtVal(A.top, gv);
  r.q = { lead: `📏 Three edges on one tape: ${tag}.`, ask: `${v} — in ${upWord}? In ${downWord}?` };
  r.working = [`${v} = ${fmtVal(A.bottom, gA[1])} = ${fmtVal(B.bottom, gB[1])}`];
  r.celebrate = `${v} = ${fmtVal(A.bottom, gA[1])} = ${fmtVal(B.bottom, gB[1])}`;
  r.mid = mid;
  return r;
}

export function generateTapeSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

export const __parts = [
  (rand) => across(pick(METRIC, rand), rand() < 0.3, rand),
  (rand) => across(pick(KITCHEN, rand), rand() < 0.3, rand),
  (rand) => paces(rand() < 0.3, rand),
  threeEdges,
  (rand) => across(pick(MIXED, rand), rand() < 0.3, rand),
];
export { fmtDec };
