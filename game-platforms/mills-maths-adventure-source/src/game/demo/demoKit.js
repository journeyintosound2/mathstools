/**
 * Small helpers the demo scripts share (pure — the headless checks import them).
 */

/** A seeded random (mulberry32) — same seed, same numbers, every time. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A round from the challenge's OWN generator that fits `pred` — so a demo's
 * example is always a real, valid round (and the demo keeps working if the
 * generator changes), but the numbers are hand-picked for teaching: easy,
 * friendly, nothing that lands on a trap. Deterministic (seeds 1, 2, 3 …).
 */
export function roundWhere(gen, pred = () => true, { tries = 4000, from = 1 } = {}) {
  let fallback = null;
  for (let seed = from; seed < from + tries; seed++) {
    const r = gen(seeded(seed));
    if (!fallback) fallback = r;
    if (pred(r)) return r;
  }
  if (typeof console !== "undefined") console.warn("[demo] no round matched — using the first generated");
  return fallback;
}

/** "a", "a and b", "a, b and c". */
export function listWords(xs) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
