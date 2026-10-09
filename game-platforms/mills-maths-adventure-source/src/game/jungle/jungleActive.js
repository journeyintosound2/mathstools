import { useSwapChallenge } from "./stores/swapStore.js";
import { useMarketChallenge } from "./stores/marketStore.js";

/**
 * EMERALD JUNGLE — the BUILT challenge stores in one place (registry order =
 * trophy order). farmChallengeActive.js spreads these in, so the
 * world-quieting pass, the Press-E suppression and the one-challenge-at-a-
 * time rule cover the jungle automatically. (The pilot builds two; add each
 * new store here as it lands.)
 */
export const JUNGLE_STORES = [
  ["swap", useSwapChallenge],
  ["market", useMarketChallenge],
];

export function jungleStore(key) {
  const hit = JUNGLE_STORES.find(([k]) => k === key);
  return hit ? hit[1] : null;
}

/** NON-REACTIVE: the running jungle challenge's key, or null (frame-safe). */
export function activeJungleChallengeKey() {
  for (const [key, store] of JUNGLE_STORES) {
    if (store.getState().status !== "idle") return key;
  }
  return null;
}

/** REACTIVE: the running jungle challenge's key, or null (fixed hook count). */
export function useActiveJungleChallenge() {
  const on = JUNGLE_STORES.map(([, store]) => store((s) => s.status !== "idle")); // eslint-disable-line react-hooks/rules-of-hooks
  const i = on.indexOf(true);
  return i < 0 ? null : JUNGLE_STORES[i][0];
}

/** Exit every jungle challenge except `keep`. */
export function exitJungleExcept(keep) {
  for (const [key, store] of JUNGLE_STORES) {
    if (key !== keep && store.getState().status !== "idle") store.getState().exit();
  }
}
