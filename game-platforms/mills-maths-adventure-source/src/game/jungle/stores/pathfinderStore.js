import { createLadderStore } from "../ladderStore.js";
import { generatePathfinderSet } from "../../../data/jungle/pathfinderChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * PATHFINDER store — expedition legs, one ladder after another.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const usePathfinderChallenge = createLadderStore({
  key: "pathfinder",
  generate: generatePathfinderSet,
  texts: {
    goal: (r, L, rung) => `🧭 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — leg done!`,
  },
});
