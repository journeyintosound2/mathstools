/**
 * HALVE & DOUBLE (Geyser Flats, host Mr. Heywood) — pure logic for the
 * HALVING-AND-DOUBLING challenge.
 *
 * PEDAGOGY — halving one factor and doubling the other keeps the product
 * because the ARRAY keeps its area: cut the rectangle in half and slide one
 * half alongside the other — half as many rows, twice as long, the very same
 * tiles. That is the picture behind 16 × 25 = 8 × 50 = 4 × 100 (Fosnot &
 * Dolk's "doubling and halving" landmark; the associative property in
 * disguise: 16 × 25 = 8 × 2 × 25). The student drives the geysers: each
 * steam blast cuts the terrace and restacks it, and a chain records every
 * form. They decide WHEN the form is easy enough to just know — that
 * judgement, not the arithmetic, is the strategy.
 *
 * "Easy" = one factor is 10/100/1000, or both factors are single digits
 * once their zeros are put aside (7 × 30, 6 × 500).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  even × 5          18 × 5 → 9 × 10
 *   S2  × 25              28 × 25 → 14 × 50 → 7 × 100
 *   S3  × 15 / 35 / 45    14 × 35 → 7 × 70
 *   S4  longer chains     16 × 125 → 8 × 250 → 4 × 500
 *   S5  which way?        both factors even — only one way helps
 *
 * Scoring (per round, max 25):
 *   the product (typed when you press Solve)   15
 *   the form you solved from is easy           10 (a helpful step but not
 *                                              easy yet = 4)
 */
import { buildSet, pick, randInt, stripZeros, isPowerOfTen } from "./magmaMath.js";

export const GEYSER_PRODUCT_POINTS = 15;
export const GEYSER_EASY_POINTS = 10;
export const GEYSER_STEP_POINTS = 4;

/** Is a × b an easy form? */
export function geyserEasy(a, b) {
  if (isPowerOfTen(a) || isPowerOfTen(b)) return true;
  return stripZeros(a) <= 9 && stripZeros(b) <= 9;
}

function orient(x, y, rand) {
  return rand() < 0.5 ? [x, y] : [y, x];
}

const S2 = [12, 16, 24, 28, 32, 36, 44];
const S3 = [[12, 15], [14, 15], [16, 15], [18, 15], [12, 35], [14, 35], [16, 35], [18, 35], [12, 45], [14, 45], [16, 45], [18, 45]];
const S4 = [[16, 125], [32, 25], [24, 125], [48, 25], [64, 5], [8, 125], [16, 75]];
const S5 = [[18, 50], [16, 50], [24, 50], [36, 50], [14, 50], [22, 50]];

function makeRound(i, stage, rand) {
  let a, b;
  if (stage === 0) {
    let x;
    do x = randInt(6, 24, rand) * 2; while (x % 10 === 0);
    [a, b] = orient(x, 5, rand);
  } else if (stage === 1) {
    [a, b] = orient(pick(S2, rand), 25, rand);
  } else if (stage === 2) {
    [a, b] = orient(...pick(S3, rand), rand);
  } else if (stage === 3) {
    [a, b] = orient(...pick(S4, rand), rand);
  } else {
    [a, b] = orient(...pick(S5, rand), rand);
  }
  const best = geyserBestChain(a, b);
  const r = { a, b, product: a * b, sig: `${Math.min(a, b)}x${Math.max(a, b)}` };
  return { ...r, best, working: geyserWorking(r, best) };
}

/**
 * The shortest chain to an easy form (breadth-first over halve/double
 * moves, depth ≤ 5). Returns [[a, b], …] starting with the round's pair.
 */
export function geyserBestChain(a, b) {
  let frontier = [[[a, b]]];
  const seen = new Set([`${a}x${b}`]);
  for (let d = 0; d <= 5; d++) {
    for (const chain of frontier) {
      const [x, y] = chain[chain.length - 1];
      if (geyserEasy(x, y)) return chain;
    }
    const next = [];
    for (const chain of frontier) {
      const [x, y] = chain[chain.length - 1];
      const moves = [];
      if (x % 2 === 0) moves.push([x / 2, y * 2]);
      if (y % 2 === 0) moves.push([x * 2, y / 2]);
      for (const m of moves) {
        const k = `${m[0]}x${m[1]}`;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push([...chain, m]);
      }
    }
    frontier = next;
  }
  return [[a, b]];
}

function geyserWorking(r, best) {
  const chain = best.map(([x, y]) => `${x} × ${y}`).join(" = ");
  const [ex, ey] = best[best.length - 1];
  const lines = [chain];
  if (best.length > 1) {
    const [x0, y0] = best[0], [x1] = best[1];
    lines.unshift(x1 === x0 / 2 ? `Halve the ${x0}, double the ${y0}.` : `Double the ${x0}, halve the ${y0}.`);
  }
  lines.push(`${ex} × ${ey} = ${r.product} — the tiles never changed.`);
  return lines;
}

export function generateGeysersSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** Apply a move: "rows" halves the rows (a) and doubles the length (b). */
export function geyserMove(a, b, which) {
  if (which === "rows") return a % 2 === 0 ? [a / 2, b * 2] : null;
  return b % 2 === 0 ? [a * 2, b / 2] : null;
}

/** Grade a Solve: points for the form solved from + the typed product. */
export function gradeGeyserSolve(round, chain, text) {
  const t = String(text ?? "").trim().replace(/[,\s]/g, "");
  if (!/^\d+$/.test(t)) return { valid: false };
  const correct = Number(t) === round.product;
  const [x, y] = chain[chain.length - 1];
  const easy = geyserEasy(x, y);
  const formPoints = easy ? GEYSER_EASY_POINTS : chain.length > 1 ? GEYSER_STEP_POINTS : 0;
  return {
    valid: true,
    correct,
    easy,
    formPoints,
    productPoints: correct ? GEYSER_PRODUCT_POINTS : 0,
  };
}
