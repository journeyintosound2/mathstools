import { createLadderStore } from "../ladderStore.js";
import { generateTapeSet } from "../../../data/jungle/tapeChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * TALL TREE TAPE store — a vertical tape with one unit on each edge. The across number unlocks the ↔ Across move (straight to the target).
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useTapeChallenge = createLadderStore({
  key: "tape",
  generate: generateTapeSet,
  texts: {
    goal: (r, L, rung) => `📏 ${vineChip(L.top, rung[0])} = ${vineChip(L.bottom, rung[1])} — the monkey checks the tape!`,
    typeWrong: (r, ph, v) => `Check two rungs: what do you multiply the left number by to get the right one? (${v / 100} doesn't work on every rung.)`,
    acrossLocked: () => "Find the across number first.",
  },
});
