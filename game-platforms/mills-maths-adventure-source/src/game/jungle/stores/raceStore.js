import { createLadderStore } from "../ladderStore.js";
import { generateRaceSet } from "../../../data/jungle/raceChallenge.js";
import { vineChip } from "../../../data/jungle/vineLadder.js";

/**
 * LAGOON RACE store — the vine ladder with seconds and metres. A wrong distance for the target time sends the racer past (or short of) the student's flag in the lanes.
 * Generic wording comes from ladderStore.js; these lines are this
 * challenge's own.
 */
export const useRaceChallenge = createLadderStore({
  key: "race",
  generate: generateRaceSet,
  texts: {
    goal: (r, L, rung) => `🏁 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — on your marks!`,
    common: (r, v) => `Both racers at ${vineChip(r.ladders[0].L.top, v)} — now compare: who is faster?`,
    needCommon: () => "First build BOTH racers to the same time (or distance) — then call it.",
  },
});
