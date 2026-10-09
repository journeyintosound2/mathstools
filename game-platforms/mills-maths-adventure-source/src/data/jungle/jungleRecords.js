/**
 * JUNGLE RECORDS — pure helpers for the Emerald Jungle trophy stand (the
 * Magma pattern): the TEN trophy slots in the recommended learning order,
 * the best-score keys and the rows the trophy grid + the Achievements Wall
 * show. Every set is 15 rounds × 25 points = 375. Bests are LOCAL-ONLY
 * (`mma-jungle-<key>-best`), like the snow and magma worlds.
 *
 * Challenges not built yet (the pilot builds two) are flagged `soon` so the
 * grid and the wall can say "coming soon" instead of "not played".
 */
import { MEDALS, medalFor } from "../farm/farmRecords.js";
import { JUNGLE_CHALLENGES } from "./jungleChallenges.js";

export { MEDALS, medalFor };

export const JUNGLE_ROUNDS_PER_SET = 15;
export const JUNGLE_POINTS_PER_ROUND = 25;
export const JUNGLE_MAX_SCORE = JUNGLE_ROUNDS_PER_SET * JUNGLE_POINTS_PER_ROUND; // 375

export const JUNGLE_CHALLENGE_IDS = JUNGLE_CHALLENGES.map((c) => c.key);

export const JUNGLE_BEST_KEYS = Object.fromEntries(
  JUNGLE_CHALLENGE_IDS.map((id) => [id, `mma-jungle-${id}-best`])
);

export const JUNGLE_MAX_SCORES = Object.fromEntries(
  JUNGLE_CHALLENGE_IDS.map((id) => [id, JUNGLE_MAX_SCORE])
);

export const JUNGLE_TROPHY_META = JUNGLE_CHALLENGES.map((c) => ({
  key: c.key,
  icon: c.icon,
  name: c.name,
  unit: "points",
  skill: c.skill,
  host: c.host.name,
  blurb: c.blurb,
  soon: !c.built,
}));

/** Best score for a jungle challenge key (localStorage-guarded; 0 if unset). */
export function readJungleBest(challenge) {
  try {
    const v = Number(localStorage.getItem(JUNGLE_BEST_KEYS[challenge]));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

/** Save a best (only if it beats the stored one). */
export function writeJungleBest(challenge, score) {
  try {
    if (score > readJungleBest(challenge)) localStorage.setItem(JUNGLE_BEST_KEYS[challenge], String(score));
  } catch {
    /* a best score is a nicety only */
  }
}

/** Percentage (0–100, rounded) of the maximum for a challenge's best. */
export function jungleBestPercent(challenge, best = readJungleBest(challenge)) {
  const max = JUNGLE_MAX_SCORES[challenge] || 1;
  return Math.max(0, Math.min(100, Math.round((best / max) * 100)));
}

/** Full per-slot trophy data for the grid: best, %, medal, max, blurb, soon. */
export function jungleTrophyRows() {
  return JUNGLE_TROPHY_META.map((r) => {
    const best = r.soon ? 0 : readJungleBest(r.key);
    const pct = jungleBestPercent(r.key, best);
    return { ...r, best, pct, medal: medalFor(pct), max: JUNGLE_MAX_SCORES[r.key] || 0 };
  });
}

/** Entries for the 3D trophy stand — [{ key, percent }] in slot order. */
export function jungleShelfEntries() {
  return JUNGLE_TROPHY_META.map((r) => ({ key: r.key, percent: r.soon ? 0 : jungleBestPercent(r.key) }));
}
