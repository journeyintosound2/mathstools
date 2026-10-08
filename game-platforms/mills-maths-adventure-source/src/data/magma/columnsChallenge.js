/**
 * COLUMN RECTANGLES (Basalt Columns, host Mr. Dawson) — pure logic for the
 * ARRAYS + FACTOR PAIRS challenge, the first Magma Multiples build.
 *
 * PEDAGOGY — Siemon's first multiplicative big idea is the move from "groups
 * of" to the ARRAY: a rectangle of equal rows, read as factor × factor =
 * product. Here the student OWNS the array: N basalt columns, and a rows
 * dial (−/+). The columns stand themselves up in that many rows; when the
 * rows don't divide N, the columns that don't fit glow red at the side (the
 * remainder is SEEN, not told). "Keep" records a perfect rectangle. The
 * round asks for EVERY rectangle N can make — so the student has to be
 * systematic (1 row, 2 rows, 3 rows…) and notices for themselves that
 *   • 3 rows of 8 and 8 rows of 3 are the SAME rectangle turned
 *     (commutativity) — keeping the turned one says so, it isn't new;
 *   • once the rows pass the other side, the pairs only turn around (√N);
 *   • a PRIME has only one rectangle (one long row), and a SQUARE has a
 *     rectangle that turns into itself.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  little numbers    composites 6–15 (2 rectangles)
 *   S2  three rectangles  12, 18, 20, 28, 32, 45
 *   S3  primes            a prime + a semiprime + a prime/semiprime mix
 *   S4  squares           9, 16, 25, 36, 49
 *   S5  rich numbers      24, 30, 36, 40, 42, 48 (4–5 rectangles)
 *
 * Scoring (per round, max 25):
 *   rectangles found when you say "That's all of them!"  20 × found / all
 *   …said only once every one was found (first claim)    + 5
 * A claim with rectangles still hiding ends the round and SHOWS the missing
 * ones — the reveal is the teaching.
 */
import { buildSet, pick, factorPairs, isPrime } from "./magmaMath.js";

export const COLUMNS_FIND_POINTS = 20;
export const COLUMNS_CLAIM_POINTS = 5;

const STAGE_POOLS = [
  [6, 8, 9, 10, 14, 15],
  [12, 18, 20, 28, 32, 45],
  null, // primes — built below
  [9, 16, 25, 36, 49],
  [24, 30, 36, 40, 42, 48],
];
const PRIMES = [7, 11, 13, 17, 19, 23, 29, 31, 37];
const SEMIPRIMES = [21, 22, 26, 33, 34, 35, 38, 39];

function makeRound(i, stage, rand) {
  let n;
  if (stage === 2) {
    // Round 7 is always a prime; 6 and 8 are a coin toss.
    n = i % 3 === 1 ? pick(PRIMES, rand) : rand() < 0.5 ? pick(PRIMES, rand) : pick(SEMIPRIMES, rand);
  } else {
    n = pick(STAGE_POOLS[stage], rand);
  }
  const pairs = factorPairs(n);
  const prime = isPrime(n);
  const square = pairs.some(([a, b]) => a === b);
  const list = pairs.map(([a, b]) => `${a} × ${b}`).join(", ");
  const working = [
    `${n} columns can stand as: ${list}.`,
    pairs.length > 1
      ? `Go in order — 1 row, 2 rows, 3 rows… After ${pairs[pairs.length - 1][0]} rows the rectangles just turn around.`
      : `Only one long row works — ${n} is PRIME.`,
  ];
  if (square) {
    const s = pairs.find(([a, b]) => a === b)[0];
    working.push(`${s} × ${s} is a SQUARE — turn it and it's the same shape.`);
  }
  return { sig: `c${n}`, n, pairs, prime, square, working };
}

export function generateColumnsSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** How N columns stand in `rows` rows. */
export function columnsLayout(n, rows) {
  const r = Math.max(1, Math.min(n, rows));
  const perRow = Math.floor(n / r);
  const leftover = n - r * perRow;
  return { rows: r, perRow, leftover, exact: leftover === 0 };
}

const pairKey = (a, b) => (a <= b ? `${a}x${b}` : `${b}x${a}`);

/**
 * "Keep" the current arrangement. `kept` = list of [rows, perRow] already
 * kept (as shown). Returns { kind, note, pair? }:
 *   leftover  doesn't fit — nothing kept
 *   new       a new rectangle (pair = [rows, perRow])
 *   turned    the same rectangle as one already kept, turned on its side
 *   again     exactly the one already kept
 */
export function gradeColumnsKeep(round, rows, kept) {
  const L = columnsLayout(round.n, rows);
  if (!L.exact) {
    return {
      kind: "leftover",
      note: `${L.rows} rows of ${L.perRow} leaves ${L.leftover} over — that's not a rectangle.`,
    };
  }
  const same = kept.find(([a, b]) => a === L.rows && b === L.perRow);
  if (same) return { kind: "again", note: `You already kept ${L.rows} × ${L.perRow}.` };
  const turned = kept.find(([a, b]) => pairKey(a, b) === pairKey(L.rows, L.perRow));
  if (turned) {
    return {
      kind: "turned",
      note: `Same rectangle, turned! ${L.rows} × ${L.perRow} = ${turned[0]} × ${turned[1]}`,
    };
  }
  return {
    kind: "new",
    pair: [L.rows, L.perRow],
    note: L.rows === 1 ? `One long row — 1 × ${round.n} ✓` : `${L.rows} rows of ${L.perRow} — a rectangle! ✓`,
  };
}

/** Distinct rectangles found (turned pairs count once). */
export function columnsFound(round, kept) {
  const keys = new Set(kept.map(([a, b]) => pairKey(a, b)));
  return round.pairs.filter(([a, b]) => keys.has(pairKey(a, b))).length;
}

/** The pairs NOT yet found (for the reveal). */
export function columnsMissing(round, kept) {
  const keys = new Set(kept.map(([a, b]) => pairKey(a, b)));
  return round.pairs.filter(([a, b]) => !keys.has(pairKey(a, b)));
}

/** Points for a claim: { all, findPoints, claimPoints }. */
export function gradeColumnsClaim(round, kept) {
  const found = columnsFound(round, kept);
  const all = found === round.pairs.length;
  return {
    all,
    found,
    total: round.pairs.length,
    findPoints: Math.round((COLUMNS_FIND_POINTS * found) / round.pairs.length),
    claimPoints: all ? COLUMNS_CLAIM_POINTS : 0,
  };
}
