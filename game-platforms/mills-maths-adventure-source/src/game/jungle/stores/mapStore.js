import { createLadderStore } from "../ladderStore.js";
import { generateMapSet } from "../../../data/jungle/mapChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * TREASURE MAP store — map centimetres and real metres; the trail vine is where the explorer digs.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useMapChallenge = createLadderStore({
  key: "map",
  generate: generateMapSet,
  texts: {
    goal: (r, L, rung) => `⛏️ ${vineChip(L.top, rung[0])} on the map ↔ ${vineChip(L.bottom, rung[1])} on the ground — dig here!`,
    typeWrong: (r, ph) => (ph.vine.unit === "m" && ph.label && ph.label.startsWith("1 cm") ? "There are 100 cm in every metre — how many metres is that many cm?" : "Add the two legs together."),
  },
});
