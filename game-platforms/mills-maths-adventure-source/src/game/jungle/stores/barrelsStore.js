import { createLadderStore } from "../ladderStore.js";
import { generateBarrelsSet } from "../../../data/jungle/barrelsChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * WATERFALL BARRELS store — seconds (or minutes) and litres. A wrong time for a full barrel overflows (or under-fills) it in the scene.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useBarrelsChallenge = createLadderStore({
  key: "barrels",
  generate: generateBarrelsSet,
  texts: {
    goal: (r, L, rung) => `💧 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — open the tap!`,
    typeWrong: () => "Add what each pipe poured in that time.",
  },
});
