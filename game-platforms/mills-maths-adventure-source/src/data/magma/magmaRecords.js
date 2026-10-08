/**
 * MAGMA RECORDS — pure helpers for the Magma Multiples trophy stand: the TEN
 * trophy slots (one per challenge, in the recommended learning order), the
 * best-score keys and the rows shown in the trophy grid.
 *
 * Every set is 15 rounds × 25 points = 375 (the farm/snow standard). Bests
 * are LOCAL-ONLY (`mma-magma-<key>-best`) like the snow world's — there is
 * no cloud completion path for the magma world yet.
 *
 * Medal thresholds are IMPORTED from the farm (MEDALS/medalFor) so gold /
 * silver / bronze can never drift between the three trophy stands.
 */
import { MEDALS, medalFor } from "../farm/farmRecords.js";
import { MAGMA_CHALLENGES } from "./magmaChallenges.js";

export { MEDALS, medalFor };

export const MAGMA_ROUNDS_PER_SET = 15;
export const MAGMA_POINTS_PER_ROUND = 25;
export const MAGMA_MAX_SCORE = MAGMA_ROUNDS_PER_SET * MAGMA_POINTS_PER_ROUND; // 375

// Slot order = reading order on the stand (top row first) = learning order.
export const MAGMA_CHALLENGE_IDS = MAGMA_CHALLENGES.map((c) => c.key);

export const MAGMA_BEST_KEYS = Object.fromEntries(
  MAGMA_CHALLENGE_IDS.map((id) => [id, `mma-magma-${id}-best`])
);

export const MAGMA_MAX_SCORES = Object.fromEntries(
  MAGMA_CHALLENGE_IDS.map((id) => [id, MAGMA_MAX_SCORE])
);

export const MAGMA_TROPHY_META = MAGMA_CHALLENGES.map((c) => ({
  key: c.key,
  icon: c.icon,
  name: c.name,
  unit: "points",
  skill: c.skill,
  host: c.host.name,
  blurb: c.blurb,
}));

/** Best score for a magma challenge key (localStorage-guarded; 0 if unset). */
export function readMagmaBest(challenge) {
  try {
    const v = Number(localStorage.getItem(MAGMA_BEST_KEYS[challenge]));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

/** Save a best (only if it beats the stored one). */
export function writeMagmaBest(challenge, score) {
  try {
    if (score > readMagmaBest(challenge)) localStorage.setItem(MAGMA_BEST_KEYS[challenge], String(score));
  } catch {
    /* a best score is a nicety only */
  }
}

/** Percentage (0–100, rounded) of the maximum for a challenge's best. */
export function magmaBestPercent(challenge, best = readMagmaBest(challenge)) {
  const max = MAGMA_MAX_SCORES[challenge] || 1;
  return Math.max(0, Math.min(100, Math.round((best / max) * 100)));
}

/** Full per-slot trophy data for the grid: best, %, medal, max, blurb. */
export function magmaTrophyRows() {
  return MAGMA_TROPHY_META.map((r) => {
    const best = readMagmaBest(r.key);
    const pct = magmaBestPercent(r.key, best);
    return { ...r, best, pct, medal: medalFor(pct), max: MAGMA_MAX_SCORES[r.key] || 0 };
  });
}

/** Entries for the 3D trophy stand — [{ key, percent }] in slot order. */
export function magmaShelfEntries() {
  return MAGMA_CHALLENGE_IDS.map((key) => ({ key, percent: magmaBestPercent(key) }));
}
