/**
 * LAVA CHANNELS (Lava Lake Islet, host Mr. Pearce) — pure logic for the
 * DIVISION challenge: friendly chunks, both meanings, remainders.
 *
 * PEDAGOGY — division is where multiplicative thinking is tested hardest
 * (Siemon: division should be learnt WITH multiplication, through the same
 * array). The cauldron holds D, the stone channel is d wide, and every row
 * poured uses d. Pouring in chunks is Anghileri's progression from
 * repeated subtraction (one row at a time) to HIGH-LEVEL CHUNKING (ten rows
 * at once, then the rest): 156 ÷ 12 = 10 rows + 3 rows. The filled channel
 * is an OPEN ARRAY — the quotient is its length. Over-pouring spills (you
 * must estimate k × d against what's left before you pour), which is the
 * quotient-estimation skill behind every written method.
 * The same rectangle answers SHARING (partitive) questions: 12 moulds, pour
 * one into each per row — the rows are the share each mould gets. And
 * remainders are taught in CONTEXT (Anghileri's most common error): round
 * UP for rafts, DOWN for full bags, or say the LEFTOVER.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  2-digit ÷ 1-digit        72 ÷ 4
 *   S2  3-digit ÷ 1-digit        156 ÷ 6
 *   S3  ÷ 2-digit                156 ÷ 12
 *   S4  remainders in context    rafts (round up) · full bags · leftovers
 *   S5  sharing                  share 156 among 12 moulds
 *
 * Scoring (per round, max 25):
 *   pouring: fewest pours (one per non-zero digit of the answer) 15 ·
 *            no more than the quick buttons' greedy count 12 ·
 *            up to two more 8 · else 4;  − 3 per spill (min 0)
 *   the answer (rows, the share, or the context answer)         10
 */
import { buildSet, randInt, pick } from "./magmaMath.js";

export const LAKE_ANSWER_POINTS = 10;
export const LAKE_SPILL_PENALTY = 3;

const BUTTONS = [
  [1, 2, 5, 10],
  [1, 2, 5, 10, 20, 50],
  [1, 2, 5, 10, 20],
  [1, 2, 5, 10],
  [1, 2, 5, 10, 20],
];

export function lakeButtons(r) {
  return BUTTONS[r.stage ?? 0];
}

function nonZeroDigits(n) {
  return String(n).split("").filter((c) => c !== "0").length || 1;
}

function greedyCount(q, buttons) {
  let left = q, n = 0;
  const bs = buttons.slice().sort((a, b) => b - a);
  while (left > 0) {
    const b = bs.find((x) => x <= left);
    left -= b;
    n++;
  }
  return n;
}

const CONTEXTS = {
  up: (D, d) => ({ ask: `${D} explorers, ${d} per lava raft. How many rafts so EVERYONE crosses?`, unit: "rafts" }),
  down: (D, d) => ({ ask: `${D} fire gems, ${d} per bag. How many FULL bags?`, unit: "full bags" }),
  left: (D, d) => ({ ask: `${D} lava rocks in rows of ${d}. How many are LEFT OVER?`, unit: "left over" }),
};

function makeRound(i, stage, rand) {
  let d, q, rem = 0, kind = "rows", ctx = null;
  if (stage === 0) {
    d = randInt(3, 9, rand);
    do q = randInt(11, 24, rand); while (q * d > 99 || q % 10 === 0);
  } else if (stage === 1) {
    d = randInt(3, 9, rand);
    do q = randInt(21, 99, rand); while (q * d < 100 || q * d > 999 || q % 10 === 0);
  } else if (stage === 2) {
    d = randInt(11, 25, rand);
    do q = randInt(11, 29, rand); while (q * d > 999 || q % 10 === 0);
  } else if (stage === 3) {
    d = randInt(4, 9, rand);
    q = randInt(6, 15, rand);
    rem = randInt(1, d - 1, rand);
    kind = ["up", "down", "left"][i % 3];
    ctx = CONTEXTS[kind](q * d + rem, d);
  } else {
    kind = "share";
    d = randInt(4, 12, rand);
    do q = randInt(11, 30, rand); while (q * d > 400 || q % 10 === 0);
  }
  const D = q * d + rem;
  const answer = kind === "up" ? q + 1 : kind === "left" ? rem : q;
  const r = { D, d, q, rem, kind, ctx, answer, stage, sig: `${D}/${d}${kind}` };
  return {
    ...r,
    bestPours: nonZeroDigits(q),
    greedyPours: greedyCount(q, BUTTONS[stage]),
    working: lakeWorking(r),
  };
}

/** Place-value chunks of q (13 → [10, 3]; 48 → [40, 8]). */
export function lakeChunks(q) {
  const s = String(q);
  return s.split("").map((c, k) => Number(c) * 10 ** (s.length - 1 - k)).filter((v) => v > 0);
}

function lakeWorking(r) {
  const lines = [];
  let left = r.D;
  for (const k of lakeChunks(r.q)) {
    const what = r.kind === "share" ? `${k} into each mould` : `${k} row${k > 1 ? "s" : ""}`;
    lines.push(`Pour ${what} (${k} × ${r.d} = ${k * r.d}) → ${left - k * r.d} left`);
    left -= k * r.d;
  }
  const chunks = lakeChunks(r.q);
  const sum = chunks.length > 1 ? `${chunks.join(" + ")} =` : "That's";
  if (r.kind === "share") lines.push(`${sum} ${r.q} in each of the ${r.d} moulds.`);
  else lines.push(`${sum} ${r.q} rows${r.rem ? `, ${r.rem} left over` : ""}.`);
  if (r.kind === "up") lines.push(`${r.q} full rafts leave ${r.rem} explorer${r.rem > 1 ? "s" : ""} behind — you need ${r.q + 1} rafts!`);
  if (r.kind === "down") lines.push(`Only ${r.q} bags are FULL — the ${r.rem} leftover gem${r.rem > 1 ? "s" : ""} can't fill one.`);
  if (r.kind === "left") lines.push(`The ${r.rem} left in the cauldron is the answer.`);
  return lines;
}

export function generateLakeSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** Try to pour k rows with `left` lava in the cauldron. */
export function lakePour(r, left, k) {
  if (!Number.isInteger(k) || k <= 0) return { ok: false, invalid: true };
  const use = k * r.d;
  if (use > left) return { ok: false, spill: true, use };
  return { ok: true, use, left: left - use, done: left - use < r.d };
}

/** Pouring points from the number of pours + spills. */
export function lakePourPoints(r, pours, spills) {
  let p;
  if (pours <= r.bestPours) p = 15;
  else if (pours <= r.greedyPours) p = 12;
  else if (pours <= r.greedyPours + 2) p = 8;
  else p = 4;
  return Math.max(0, p - LAKE_SPILL_PENALTY * spills);
}

/** The final question for a round. */
export function lakeAnswerPrompt(r) {
  if (r.kind === "share") return `How much lava does EACH mould get?`;
  if (r.ctx) return r.ctx.ask;
  return `${r.D} ÷ ${r.d} = ? (how many rows)`;
}

export function checkLakeAnswer(r, text) {
  const t = String(text ?? "").trim().replace(/[a-z\s]+$/i, "");
  if (!/^\d+$/.test(t)) return { valid: false, correct: false };
  return { valid: true, correct: Number(t) === r.answer };
}
