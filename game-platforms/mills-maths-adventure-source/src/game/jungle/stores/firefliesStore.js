import { createLadderStore } from "../ladderStore.js";
import { generateFirefliesSet } from "../../../data/jungle/firefliesChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * FIREFLY GRAPHS store — the ladder stood up as a graph: minutes along the ground, kilometres up the redwood. A wrong number is a firefly OFF the line.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useFirefliesChallenge = createLadderStore({
  key: "fireflies",
  generate: generateFirefliesSet,
  texts: {
    hung: (r, L, rung) => `✨ ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — a firefly on the line.`,
    goal: (r, L, rung) => `✨ ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — right on the line!`,
    common: (r, v) => `Both walkers at ${vineChip(r.ladders[0].L.top, v)} — whose firefly is higher? That line is steeper.`,
    needCommon: () => "First hang a firefly for BOTH walkers at the same time — then call it.",
    wrong: (r, L, p, v, d) => `That firefly is off the line! ${vineChip(d === "top" ? L.bottom : L.top, v)} doesn't belong at ${vineChip(d === "top" ? L.top : L.bottom, p.value)}. Try again.`,
  },
});
