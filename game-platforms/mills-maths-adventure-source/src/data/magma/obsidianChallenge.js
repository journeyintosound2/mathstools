/**
 * CRACK THE CRYSTAL (Obsidian Grove, host Ms. Mahoney) — pure logic for the
 * SPLIT-ARRAY / AREA-MODEL challenge (the distributive property).
 *
 * PEDAGOGY — the distributive property is the engine behind nearly every
 * mental multiplication strategy (Siemon; Hurst & Hurrell's "connected big
 * ideas"), and the ARRAY is where it can be SEEN: a 7 × 8 crystal cracks
 * into a 7 × 5 piece and a 7 × 3 piece — two facts you know. The same move
 * scales up unchanged:
 *   • by place value      6 × 23 = 6 × 20 + 6 × 3
 *   • by GROWING it        6 × 19 = 6 × 20 − 6 × 1   (compensation — the
 *     crack goes PAST the edge and a ghost column is added, then removed)
 *   • the AREA MODEL      14 × 23 cracks both ways into four pieces —
 *     tens × tens, tens × ones, ones × tens, ones × ones — the picture
 *     behind the written algorithm and, later, (a + b)(c + d).
 * The student chooses WHERE to crack (a friendly crack earns the bonus) and
 * then works out each piece and the total, so the strategy is theirs.
 * Small products show every crystal tile; big ones become an open REGION
 * (Siemon: the region model is the bridge to multi-digit multiplication).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  facts past five   6–9 × 6–9          crack at 5 (or 2, or grow to 10)
 *   S2  place value       3–9 × 12–39        crack at the tens
 *   S3  grow it           3–9 × _8/_9        crack PAST the edge to the next ten
 *   S4  area model        11–19 × 12–29      TWO cracks, four pieces
 *   S5  mixed             one of each kind (place / grow / area)
 *
 * Scoring (per round, max 25):
 *   the crack           friendly 5 (S3: a split at the tens still earns 2;
 *                       S4: one friendly crack of two earns 2)
 *   the pieces          10 shared across the pieces (5+5 or 3+3+2+2),
 *                       one try each — a wrong piece is shown, then on
 *   the total           10
 */
import { buildSet, randInt, pick, shuffle } from "./magmaMath.js";

export const OBSIDIAN_CRACK_POINTS = 5;
export const OBSIDIAN_PIECE_POINTS = 10;
export const OBSIDIAN_TOTAL_POINTS = 10;
/** Show individual crystal tiles up to this many (else the open region). */
export const OBSIDIAN_TILE_LIMIT = 360;

const nextTen = (n) => Math.ceil((n + 1) / 10) * 10;
const tensOf = (n) => n - (n % 10);

function round(kind, a, b) {
  return { kind, a, b, product: a * b, sig: `${kind}${a}x${b}` };
}

function makeKind(kind, rand) {
  if (kind === "facts") {
    return round("facts", randInt(6, 9, rand), randInt(6, 9, rand));
  }
  if (kind === "place") {
    let b;
    do b = randInt(12, 39, rand); while (b % 10 === 0 || b % 10 >= 8);
    return round("place", randInt(3, 9, rand), b);
  }
  if (kind === "grow") {
    return round("grow", randInt(3, 9, rand), pick([9, 19, 29, 39, 18, 28, 49], rand));
  }
  // area model: two-digit × two-digit, neither a multiple of ten
  let a, b;
  do a = randInt(11, 19, rand); while (a % 10 === 0);
  do b = randInt(12, 29, rand); while (b % 10 === 0);
  return round("area", a, b);
}

const STAGE_KIND = ["facts", "place", "grow", "area"];

/** The FRIENDLY crack(s) for a round — used for the worked solution. */
export function obsidianBestCrack(r) {
  if (r.kind === "facts") return { cols: r.b >= 7 ? (r.b === 9 ? 10 : 5) : 5 };
  if (r.kind === "place") return { cols: tensOf(r.b) };
  if (r.kind === "grow") return { cols: nextTen(r.b) };
  return { cols: tensOf(r.b), rows: tensOf(r.a) };
}

/** Column-crack range: 1 … b−1, plus growing to the next ten for _7/_8/_9. */
export function obsidianColRange(r) {
  const canGrow = r.kind !== "area" && r.b % 10 >= 7;
  return { min: 1, max: canGrow ? nextTen(r.b) : r.b - 1, skip: r.b, canGrow };
}

/** Row-crack range (area rounds only): 1 … a−1. */
export function obsidianRowRange(r) {
  return { min: 1, max: r.a - 1 };
}

/**
 * The PIECES a crack makes, in typing order:
 *   [{ rows, cols, value, take }]  — `take` marks the ghost to subtract.
 */
export function obsidianPieces(r, cols, rows = null) {
  if (r.kind === "area" && rows) {
    const rs = [rows, r.a - rows];
    const cs = [cols, r.b - cols];
    const out = [];
    for (const rr of rs) for (const cc of cs) out.push({ rows: rr, cols: cc, value: rr * cc, take: false });
    return out;
  }
  if (cols > r.b) {
    return [
      { rows: r.a, cols, value: r.a * cols, take: false },
      { rows: r.a, cols: cols - r.b, value: r.a * (cols - r.b), take: true },
    ];
  }
  return [
    { rows: r.a, cols, value: r.a * cols, take: false },
    { rows: r.a, cols: r.b - cols, value: r.a * (r.b - cols), take: false },
  ];
}

/** Points for each piece (sums to OBSIDIAN_PIECE_POINTS). */
export function obsidianPiecePoints(count) {
  return count === 4 ? [3, 3, 2, 2] : [5, 5];
}

function isFriendlyCols(r, cols) {
  if (r.kind === "facts") return [2, 5, r.b - 2, r.b - 5, 10].includes(cols);
  if (r.kind === "place") return cols === tensOf(r.b) || (cols > r.b && cols === nextTen(r.b));
  if (r.kind === "grow") return cols === nextTen(r.b);
  return cols === tensOf(r.b) || (cols > r.b && cols === nextTen(r.b));
}

/** Grade the crack(s): { points, note, tone }. */
export function gradeObsidianCrack(r, cols, rows = null) {
  if (r.kind === "area") {
    const fc = cols === tensOf(r.b);
    const fr = rows === tensOf(r.a);
    if (fc && fr) return { points: 5, tone: "good", note: "Cracked at the tens both ways — four friendly pieces! +5" };
    if (fc || fr) return { points: 2, tone: "warm", note: `One friendly crack. Cracking at the TENS (${tensOf(r.a)} and ${tensOf(r.b)}) makes every piece easy. +2` };
    return { points: 0, tone: "warm", note: `Those pieces are tricky — the tens (${tensOf(r.a)} and ${tensOf(r.b)}) make friendlier cracks.` };
  }
  if (r.kind === "grow") {
    if (cols === nextTen(r.b)) return { points: 5, tone: "good", note: `Grown to ${nextTen(r.b)} — now just take the ghost away! +5` };
    if (cols === tensOf(r.b)) return { points: 2, tone: "warm", note: `That works! Growing to ${nextTen(r.b)} would be even quicker. +2` };
    return { points: 0, tone: "warm", note: `It works — but try growing it to ${nextTen(r.b)} and taking the extra away.` };
  }
  if (isFriendlyCols(r, cols)) {
    const grow = cols > r.b;
    return {
      points: 5, tone: "good",
      note: grow ? `Grown to ${cols} — a friendly ten! +5` : `A friendly crack: ${cols} + ${r.b - cols}. +5`,
    };
  }
  const hint = r.kind === "facts" ? "Pieces of 5 (or 2) are facts you know." : `Cracking at ${tensOf(r.b)} keeps the tens together.`;
  return { points: 0, tone: "warm", note: `That works — ${hint}` };
}

/** One piece's typed value: { valid, correct }. */
export function checkObsidianValue(expected, text) {
  const t = String(text ?? "").trim().replace(/[,\s]/g, "");
  if (!/^\d+$/.test(t)) return { valid: false, correct: false };
  return { valid: true, correct: Number(t) === expected };
}

/** Worked solution (best crack), one step per line. */
export function obsidianWorking(r) {
  const best = obsidianBestCrack(r);
  const pieces = obsidianPieces(r, best.cols, best.rows || null);
  if (r.kind === "area") {
    return [
      `Crack ${r.a} into ${tensOf(r.a)} + ${r.a % 10} and ${r.b} into ${tensOf(r.b)} + ${r.b % 10}.`,
      pieces.map((p) => `${p.rows} × ${p.cols} = ${p.value}`).join(" · "),
      `${pieces.map((p) => p.value).join(" + ")} = ${r.product}`,
    ];
  }
  if (best.cols > r.b) {
    return [
      `Grow ${r.b} to ${best.cols} — add ${best.cols - r.b} ghost column${best.cols - r.b > 1 ? "s" : ""}.`,
      `${r.a} × ${best.cols} = ${pieces[0].value}, take away ${r.a} × ${best.cols - r.b} = ${pieces[1].value}`,
      `${pieces[0].value} − ${pieces[1].value} = ${r.product}`,
    ];
  }
  return [
    `Crack ${r.b} into ${best.cols} + ${r.b - best.cols}.`,
    `${r.a} × ${best.cols} = ${pieces[0].value} and ${r.a} × ${r.b - best.cols} = ${pieces[1].value}`,
    `${pieces[0].value} + ${pieces[1].value} = ${r.product}`,
  ];
}

/** Total from a set of pieces (respecting the ghost). */
export function obsidianTotalOf(pieces) {
  return pieces.reduce((s, p) => s + (p.take ? -p.value : p.value), 0);
}

export function generateObsidianSet(rand = Math.random) {
  // S5 = one of each harder kind, shuffled.
  const s5 = shuffle(["place", "grow", "area"], rand);
  return buildSet((i, stage) => {
    const kind = stage < 4 ? STAGE_KIND[stage] : s5[i - 12];
    const r = makeKind(kind, rand);
    return { ...r, working: obsidianWorking(r) };
  }, rand);
}

/** Show tiles (true) or the open region (false)? */
export function obsidianShowsTiles(r) {
  return r.kind !== "area" && r.a * Math.max(r.b, obsidianColRange(r).max) <= OBSIDIAN_TILE_LIMIT;
}
