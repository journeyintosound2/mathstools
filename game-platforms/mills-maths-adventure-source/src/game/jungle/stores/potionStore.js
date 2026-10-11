import { createLadderStore } from "../ladderStore.js";
import { generatePotionSet } from "../../../data/jungle/potionChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * MUSHROOM POTIONS store — scoops of moonberry (🔵) and sunfruit (🟡); a wrong amount on a target rung pours the wrong colour in the scene.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const usePotionChallenge = createLadderStore({
  key: "potion",
  generate: generatePotionSet,
  texts: {
    goal: (r, L, rung) => `🧪 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — pour it in!`,
    common: (r, v) => `Both potions with ${vineChip(r.ladders[0].L.top, v)} — now compare the yellow: which is bluer?`,
    needCommon: () => "First build BOTH potions to the same number of blue scoops — then compare.",
    additive: (r, L, src, p, v, d) => `Adding the same scoops to both changes the colour — and slides the vine off zero! Whatever you do to the ${L.top.many}, do it to the ${L.bottom.many} too.`,
  },
});
