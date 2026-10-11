import { createLadderStore } from "../ladderStore.js";
import { generateTempleSet } from "../../../data/jungle/templeChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * TEMPLE OF TRUTH store — call each tablet (ladder works / breaks), then finish it or say why it breaks.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useTempleChallenge = createLadderStore({
  key: "temple",
  generate: generateTempleSet,
  texts: {
    goal: (r, L, rung) => `🗿 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — the tablet is complete!`,
  },
});
