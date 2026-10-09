import { useFarmChallenge } from "./farmChallengeStore.js";
import { useRoundUp } from "./roundUpStore.js";
import { useOrderParts } from "./orderPartsStore.js";
import { useCratePacking } from "./cratePackingStore.js";
import { useMilkSplitter } from "./milkSplitterStore.js";
import { useWeighStation } from "./weighStationStore.js";
import { useTradingPost } from "./tradingPostStore.js";
import { useVeggiePlot } from "./veggiePlotStore.js";
import { usePlankGap } from "./plankGapStore.js";
import { useFarmShop } from "./farmShopStore.js";
import { useSnowballRange } from "./snowballRangeStore.js";
import { useRinkGlide } from "./rinkGlideStore.js";
import { useGroveLights } from "./groveLightsStore.js";
import { useMeadowLevel } from "./meadowLevelStore.js";
import { useSledSlope } from "./sledSlopeStore.js";
import { useVillageSplit } from "./villageSplitStore.js";
import { useColonyPairs } from "./colonyPairsStore.js";
import { useCaveCrystals } from "./caveCrystalsStore.js";
import { useLodgeYard } from "./lodgeYardStore.js";
import { useAuroraLookout } from "./auroraLookoutStore.js";
import { MAGMA_STORES, useActiveMagmaChallenge } from "./magma/magmaActive.js";
import { JUNGLE_STORES, useActiveJungleChallenge } from "./jungle/jungleActive.js";

// Every in-world challenge store, in one list. Add a new challenge here and
// BOTH the hook and the non-reactive getter pick it up.
const CHALLENGE_STORES = [
  useFarmChallenge, useRoundUp, useOrderParts, useCratePacking, useMilkSplitter,
  useWeighStation, useTradingPost, useVeggiePlot, usePlankGap, useFarmShop,
  useSnowballRange, useRinkGlide, useGroveLights, useMeadowLevel, useSledSlope,
  useVillageSplit, useColonyPairs, useCaveCrystals, useLodgeYard, useAuroraLookout,
  // Magma Multiples (the ten multiplicative challenges).
  ...MAGMA_STORES.map(([, store]) => store),
  // Emerald Jungle (the vine-ladder challenges).
  ...JUNGLE_STORES.map(([, store]) => store),
];

/**
 * NON-REACTIVE read of the same question, safe to call every frame from a
 * useFrame loop (no subscription, no re-render). Used by the world-quieting
 * pass: while a challenge runs, NPCs stop turning to face the player and the
 * wandering wildlife holds still, so nothing competes with the challenge for
 * the student's attention.
 */
export function isAnyChallengeActive() {
  for (const store of CHALLENGE_STORES) {
    if (store.getState().status !== "idle") return true;
  }
  return false;
}

// The ten Snowball Sums challenges, keyed like SNOW_CHALLENGE_VIEWS in
// data/snow/snowLayout.js (the view corridors that clear the camera's line).
const SNOW_CHALLENGES = [
  ["range", useSnowballRange], ["rink", useRinkGlide], ["grove", useGroveLights],
  ["meadow", useMeadowLevel], ["sled", useSledSlope], ["village", useVillageSplit],
  ["colony", useColonyPairs], ["cave", useCaveCrystals], ["yard", useLodgeYard],
  ["lights", useAuroraLookout],
];

/** NON-REACTIVE: the running snow challenge's key ("range" …) or null. */
export function activeSnowChallengeKey() {
  for (const [key, store] of SNOW_CHALLENGES) {
    if (store.getState().status !== "idle") return key;
  }
  return null;
}

/**
 * REACTIVE: the running snow challenge's key, or null. Drives the view
 * clearing (scenery, host NPCs and the parked player step out of the
 * camera's line) and the bottom-docked question panel.
 */
export function useActiveSnowChallenge() {
  const on = [
    useSnowballRange((s) => s.status !== "idle"),
    useRinkGlide((s) => s.status !== "idle"),
    useGroveLights((s) => s.status !== "idle"),
    useMeadowLevel((s) => s.status !== "idle"),
    useSledSlope((s) => s.status !== "idle"),
    useVillageSplit((s) => s.status !== "idle"),
    useColonyPairs((s) => s.status !== "idle"),
    useCaveCrystals((s) => s.status !== "idle"),
    useLodgeYard((s) => s.status !== "idle"),
    useAuroraLookout((s) => s.status !== "idle"),
  ];
  const i = on.indexOf(true);
  return i < 0 ? null : SNOW_CHALLENGES[i][0];
}

/**
 * Is ANY in-world challenge (Fraction Farm, Snowball Sums OR Magma Multiples) currently
 * running? Used to suppress the generic interaction UI ("Press E …" /
 * tap-confirm) while a challenge has the screen — the challenge panels own
 * the interface then. Also drives the world-quieting pass (badges hidden,
 * NPCs resting, wildlife still, area labels off).
 */
export function useFarmChallengeActive() {
  const a = useFarmChallenge((s) => s.status !== "idle");
  const b = useRoundUp((s) => s.status !== "idle");
  const c = useOrderParts((s) => s.status !== "idle");
  const d = useCratePacking((s) => s.status !== "idle");
  const e = useMilkSplitter((s) => s.status !== "idle");
  const f = useWeighStation((s) => s.status !== "idle");
  const g = useTradingPost((s) => s.status !== "idle");
  const h = useVeggiePlot((s) => s.status !== "idle");
  const i = usePlankGap((s) => s.status !== "idle");
  const j = useFarmShop((s) => s.status !== "idle");
  const k = useSnowballRange((s) => s.status !== "idle");
  const l = useRinkGlide((s) => s.status !== "idle");
  const m = useGroveLights((s) => s.status !== "idle");
  const n = useMeadowLevel((s) => s.status !== "idle");
  const o = useSledSlope((s) => s.status !== "idle");
  const p = useVillageSplit((s) => s.status !== "idle");
  const q = useColonyPairs((s) => s.status !== "idle");
  const r = useCaveCrystals((s) => s.status !== "idle");
  const t = useLodgeYard((s) => s.status !== "idle");
  const u = useAuroraLookout((s) => s.status !== "idle");
  const mg = useActiveMagmaChallenge();
  const jg = useActiveJungleChallenge();
  return a || b || c || d || e || f || g || h || i || j || k || l || m || n || o || p || q || r || t || u || mg !== null || jg !== null;
}
