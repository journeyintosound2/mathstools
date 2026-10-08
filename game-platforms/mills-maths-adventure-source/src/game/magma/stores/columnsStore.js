import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateColumnsSet, gradeColumnsKeep, gradeColumnsClaim, columnsMissing,
} from "../../../data/magma/columnsChallenge.js";

/** COLUMN RECTANGLES store — dial the rows, Keep rectangles, claim "all". */
export const useColumnsChallenge = createMagmaStore({
  key: "columns",
  generate: generateColumnsSet,
  fresh: () => ({ rows: 1, kept: [], claimResult: null, missing: [], lastKeep: null }),
  actions: (set, get, api) => ({
    setRows(r) {
      const round = get().currentRound();
      if (get().status !== "play" || !round) return;
      set({ rows: Math.max(1, Math.min(round.n, Math.round(r))) });
    },
    stepRows(d) {
      get().setRows(get().rows + d);
    },
    keep() {
      const round = get().currentRound();
      if (get().status !== "play" || !round) return;
      const g = gradeColumnsKeep(round, get().rows, get().kept);
      if (g.kind === "new") {
        set({ kept: [...get().kept, g.pair], lastKeep: { at: Date.now(), pair: g.pair } });
        api.say(g.note, "good");
      } else {
        api.say(g.note, g.kind === "leftover" ? "bad" : "warm");
      }
    },
    claim() {
      const round = get().currentRound();
      if (get().status !== "play" || !round) return;
      const c = gradeColumnsClaim(round, get().kept);
      api.award(c.findPoints + c.claimPoints);
      set({ claimResult: c, missing: columnsMissing(round, get().kept) });
      api.endRound();
    },
    onEnter() {
      get().keep();
    },
  }),
});
