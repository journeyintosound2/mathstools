/**
 * FACTOR FORGE (Ember Forge, host Robot) — pure logic for the FLEXIBLE
 * FACTORING challenge (the associative + commutative properties).
 *
 * PEDAGOGY — "factor strategies" are the last of Siemon's mental
 * multiplication strategies and the one that most needs the
 * factor-factor-product idea to be SECURE: a number is not just itself, it
 * is every way it can be built (24 is 4 × 6 is 2 × 12 is 3 × 8), and
 * factors can be regrouped and reordered freely. The forge makes both moves
 * physical. HAMMER an ingot to split it into a factor pair; FUSE any two
 * ingots by working out their product. The skill is choosing what to fuse
 * FIRST: 25 × 24 → 25 × 4 × 6 → 100 × 6. Primes won't split ("13 is
 * prime — it won't break!"), which keeps prime/composite in view.
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  5 × even            5 × 14 = 5 × 2 × 7 = 10 × 7
 *   S2  25 × (4s)           25 × 28 = 25 × 4 × 7 = 100 × 7
 *   S3  15/35/45/50 × even  35 × 8 = 35 × 2 × 4 = 70 × 4
 *   S4  three ingots        4 × 13 × 25 — fuse 4 × 25 first, no split!
 *   S5  bigger              125 × 24, 75 × 12
 *
 * Scoring (per round, max 25):
 *   a fusion ON THE WAY that MAKES a ten (a power of ten, or a multiple
 *   of ten from two ingots that weren't) — not the final fusion, so
 *   multiplying the two starting numbers straight out never earns it   10
 *   the final fusion right first time                                  15
 */
import { buildSet, pick, randInt, isPowerOfTen, stripZeros } from "./magmaMath.js";

export const FORGE_FRIENDLY_POINTS = 10;
export const FORGE_FINAL_POINTS = 15;
export const FORGE_MAX_INGOTS = 6;

const S1 = [14, 16, 18, 22, 24, 26, 28, 32, 34, 36];
const S2 = [12, 16, 24, 28, 32, 36, 44, 48];
const S3 = [[15, 6], [15, 8], [35, 4], [35, 8], [45, 6], [45, 12], [50, 14], [50, 18], [15, 14]];
const S4 = [[4, 13, 25], [5, 17, 2], [2, 36, 5], [25, 7, 4], [5, 23, 20], [4, 9, 25], [2, 19, 5], [25, 11, 8]];
const S5 = [[125, 24], [75, 12], [35, 16], [125, 16], [25, 36], [45, 14], [75, 8]];

/** Factor pairs a × b (2 ≤ a ≤ b) — the ways an ingot can split. */
export function forgeSplits(n) {
  const out = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

/** Does fusing x and y MAKE a ten? */
export function forgeFriendly(x, y) {
  const p = x * y;
  if (isPowerOfTen(p)) return true;
  return p % 10 === 0 && x % 10 !== 0 && y % 10 !== 0;
}

/** A friendly plan for the worked solution. */
export function forgePlan(ingots) {
  let best = null;
  for (let i = 0; i < ingots.length; i++) {
    for (let j = 0; j < ingots.length; j++) {
      if (i === j) continue;
      const n = ingots[j];
      const fs = [];
      for (let f = 2; f <= n; f++) if (n % f === 0) fs.push(f);
      for (const f of fs) {
        const p = ingots[i] * f;
        const score = isPowerOfTen(p) ? 0 : p % 10 === 0 && ingots[i] % 10 !== 0 && f % 10 !== 0 ? 1 : 9;
        if (score > 1) continue;
        const cand = { i, j, f, p, score, split: f !== n, strip: stripZeros(p) };
        // The friendly fusion must leave something to fuse afterwards.
        if (ingots.length - 2 + (cand.split ? 1 : 0) < 1) continue;
        const better =
          !best || cand.score < best.score ||
          (cand.score === best.score && cand.split < best.split) ||
          (cand.score === best.score && cand.split === best.split && cand.strip < best.strip);
        if (better) best = cand;
      }
    }
  }
  return best;
}

function forgeWorking(ingots, product) {
  const plan = forgePlan(ingots);
  if (!plan) return [`${ingots.join(" × ")} = ${product}`];
  const lines = [];
  const rest = ingots.filter((_, k) => k !== plan.i && k !== plan.j);
  if (plan.split) {
    lines.push(`Hammer ${ingots[plan.j]} into ${plan.f} × ${ingots[plan.j] / plan.f}.`);
    rest.push(ingots[plan.j] / plan.f);
  }
  lines.push(`Fuse ${ingots[plan.i]} × ${plan.f} = ${plan.p} — a friendly ${plan.p}!`);
  lines.push(`${plan.p} × ${rest.join(" × ")} = ${product}`);
  return lines;
}

function makeRound(i, stage, rand) {
  let ingots;
  if (stage === 0) ingots = [5, pick(S1, rand)];
  else if (stage === 1) ingots = [25, pick(S2, rand)];
  else if (stage === 2) ingots = pick(S3, rand).slice();
  else if (stage === 3) ingots = pick(S4, rand).slice();
  else ingots = pick(S5, rand).slice();
  if (ingots.length === 2 && randInt(0, 1, rand)) ingots.reverse();
  const product = ingots.reduce((a, b) => a * b, 1);
  return { sig: ingots.join("x"), ingots, product, working: forgeWorking(ingots, product) };
}

export function generateForgeSet(rand = Math.random) {
  return buildSet(makeRound, rand);
}

/** Split ingot k into a pair: returns the new ingot list, or null. */
export function forgeSplit(ingots, k, pair) {
  if (ingots.length >= FORGE_MAX_INGOTS) return null;
  const n = ingots[k];
  if (!pair || pair[0] * pair[1] !== n || pair[0] < 2) return null;
  return [...ingots.slice(0, k), pair[0], pair[1], ...ingots.slice(k + 1)];
}

/**
 * Fuse ingots i and j with a typed product. Returns
 *   { valid, correct, ingots?, friendly, final }.
 */
export function forgeFuse(ingots, i, j, text) {
  const t = String(text ?? "").trim().replace(/[,\s]/g, "");
  if (!/^\d+$/.test(t) || i === j) return { valid: false };
  const p = ingots[i] * ingots[j];
  const final = ingots.length === 2;
  if (Number(t) !== p) return { valid: true, correct: false, final };
  const lo = Math.min(i, j), hi = Math.max(i, j);
  const next = ingots.filter((_, k) => k !== lo && k !== hi);
  next.splice(lo, 0, p);
  return { valid: true, correct: true, ingots: next, friendly: forgeFriendly(ingots[i], ingots[j]), final };
}
