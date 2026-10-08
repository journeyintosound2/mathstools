import { useColumnsChallenge } from "./stores/columnsStore.js";
import { useObsidianChallenge } from "./stores/obsidianStore.js";
import { useTerracesChallenge } from "./stores/terracesStore.js";
import { useGeysersChallenge } from "./stores/geysersStore.js";
import { useForgeChallenge } from "./stores/forgeStore.js";
import { useGardenChallenge } from "./stores/gardenStore.js";
import { useCinderChallenge } from "./stores/cinderStore.js";
import { useLakeChallenge } from "./stores/lakeStore.js";
import { useBonesChallenge } from "./stores/bonesStore.js";
import { useSummitChallenge } from "./stores/summitStore.js";

/**
 * MAGMA MULTIPLES — the ten challenge stores in one place (registry order =
 * trophy order). The farm/snow helpers in farmChallengeActive.js spread
 * these in, so the world-quieting pass, the Press-E suppression and the
 * one-challenge-at-a-time rule cover the magma world automatically.
 */
export const MAGMA_STORES = [
  ["columns", useColumnsChallenge],
  ["obsidian", useObsidianChallenge],
  ["terraces", useTerracesChallenge],
  ["geysers", useGeysersChallenge],
  ["forge", useForgeChallenge],
  ["garden", useGardenChallenge],
  ["cinder", useCinderChallenge],
  ["lake", useLakeChallenge],
  ["bones", useBonesChallenge],
  ["summit", useSummitChallenge],
];

export function magmaStore(key) {
  const hit = MAGMA_STORES.find(([k]) => k === key);
  return hit ? hit[1] : null;
}

/** NON-REACTIVE: the running magma challenge's key, or null (frame-safe). */
export function activeMagmaChallengeKey() {
  for (const [key, store] of MAGMA_STORES) {
    if (store.getState().status !== "idle") return key;
  }
  return null;
}

/**
 * REACTIVE: the running magma challenge's key, or null. (The list is fixed,
 * so the hook count never changes between renders.)
 */
export function useActiveMagmaChallenge() {
  const on = MAGMA_STORES.map(([, store]) => store((s) => s.status !== "idle")); // eslint-disable-line react-hooks/rules-of-hooks
  const i = on.indexOf(true);
  return i < 0 ? null : MAGMA_STORES[i][0];
}

/** Exit every magma challenge except `keep` (a magma key, or anything else). */
export function exitMagmaExcept(keep) {
  for (const [key, store] of MAGMA_STORES) {
    if (key !== keep && store.getState().status !== "idle") store.getState().exit();
  }
}
