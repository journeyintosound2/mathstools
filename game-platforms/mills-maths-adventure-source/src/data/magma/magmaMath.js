/**
 * MAGMA MULTIPLES — tiny shared helpers for the ten challenge logic files
 * (pure; no React, no stores). Every set is 15 rounds = 5 concept STAGES ×
 * 3 rounds, solutions-first, all integers unless a stage is ABOUT decimals
 * (then exact decimal strings are built from integers — no float dust).
 */

export const ROUNDS = 15;
export const STAGES = 5;

/** Concept stage (0–4) for a round index. */
export function stageFor(i) {
  return Math.max(0, Math.min(STAGES - 1, Math.floor(i / (ROUNDS / STAGES))));
}

export function randInt(min, max, rand = Math.random) {
  return min + Math.floor(rand() * (max - min + 1));
}

export function pick(list, rand = Math.random) {
  return list[Math.floor(rand() * list.length)];
}

export function shuffle(list, rand = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a 15-round set from a per-round generator, never repeating a round
 * (same `sig`) inside the set. `make(roundIndex, stage, rand)` returns a
 * round with a `sig` string.
 */
export function buildSet(make, rand = Math.random) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < ROUNDS; i++) {
    const stage = stageFor(i);
    let r = null;
    for (let t = 0; t < 60; t++) {
      r = make(i, stage, rand);
      if (!seen.has(r.sig)) break;
    }
    seen.add(r.sig);
    out.push({ ...r, roundIndex: i, stage });
  }
  return out;
}

/**
 * Read a typed whole number: tolerates spaces, thousands commas and a
 * trailing unit word ("1,200", "1 200", "36 rocks"). null if not a number.
 */
export function parseWhole(text) {
  const t = String(text ?? "").trim().toLowerCase().replace(/[a-z\s]+$/g, "").replace(/[,\s]/g, "");
  if (!/^-?\d+$/.test(t)) return null;
  return Number(t);
}

/**
 * Read a typed decimal EXACTLY as a [integer, scale] pair (3.50 → 350 / 100)
 * and compare against an exact target given in thousandths. Returns the
 * value in thousandths, or null. "0.4", ".4", "2.40", "1,200.5" all work.
 */
export function parseThousandths(text) {
  let t = String(text ?? "").trim().replace(/[,\s]/g, "");
  if (t.startsWith(".")) t = "0" + t;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const neg = t.startsWith("-");
  if (neg) t = t.slice(1);
  const [w, f = ""] = t.split(".");
  if (f.length > 3 && /[1-9]/.test(f.slice(3))) return null; // finer than thousandths
  const frac = (f + "000").slice(0, 3);
  const v = Number(w) * 1000 + Number(frac);
  return neg ? -v : v;
}

/** Thousandths → a clean decimal string (3500 → "3.5", 60 → "0.06"). */
export function fmtThousandths(v) {
  const neg = v < 0;
  const a = Math.abs(v);
  const w = Math.floor(a / 1000);
  const f = String(a % 1000).padStart(3, "0").replace(/0+$/, "");
  const s = (f ? `${w}.${f}` : `${w}`);
  return neg ? `-${s}` : s;
}

/** Whole number with thin thousands spacing for big products (12 000). */
export function fmt(n) {
  return n >= 10000 ? n.toLocaleString("en-AU") : String(n);
}

/** All factor pairs [a, b] with a ≤ b and a × b = n (includes 1 × n). */
export function factorPairs(n) {
  const out = [];
  for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

export function isPrime(n) {
  if (n < 2) return false;
  for (let a = 2; a * a <= n; a++) if (n % a === 0) return false;
  return true;
}

/** Strip trailing zeros (4500 → 45). */
export function stripZeros(n) {
  let v = n;
  while (v !== 0 && v % 10 === 0) v /= 10;
  return v;
}

/** Is n a power of ten (10, 100, 1000 …)? */
export function isPowerOfTen(n) {
  if (n < 10) return false;
  return stripZeros(n) === 1;
}
