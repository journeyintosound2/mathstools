import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateLakeSet, lakePour, lakePourPoints, checkLakeAnswer, LAKE_ANSWER_POINTS,
} from "../../../data/magma/lakeChallenge.js";

/**
 * LAVA CHANNELS store.
 *   pour    pour chunks of rows (buttons or "pour ___ rows"); a chunk that
 *           needs more lava than is left SPILLS (−3) and isn't poured
 *   answer  the rows / share / context answer
 */
export const useLakeChallenge = createMagmaStore({
  key: "lake",
  generate: generateLakeSet,
  fresh: (r) => ({ phase: "pour", left: r ? r.D : 0, pours: [], spills: 0, lastPour: null, pourPoints: 0, answerCorrect: null }),
  actions: (set, get, api) => ({
    pour(k) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "pour" || !r) return "invalid";
      const res = lakePour(r, get().left, k);
      if (res.invalid) return "invalid";
      if (res.spill) {
        set({ spills: get().spills + 1, lastPour: { k, spill: true, at: Date.now() } });
        api.say(`${k} rows need ${res.use} — only ${get().left} left. SPLASH! (−3)`, "bad");
        return "wrong";
      }
      const pours = [...get().pours, k];
      set({ pours, left: res.left, lastPour: { k, spill: false, at: Date.now() } });
      if (res.done) {
        const pts = lakePourPoints(r, pours.length, get().spills);
        api.award(pts);
        set({ phase: "answer", pourPoints: pts });
        api.say(res.left > 0 ? `Poured! ${res.left} left in the cauldron — not enough for another row.` : "Poured — the cauldron is empty!", "good");
      } else {
        api.say(`${k} row${k > 1 ? "s" : ""} = ${k * r.d} poured · ${res.left} left`, "good");
      }
      return "correct";
    },
    submitAnswer(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "answer" || !r) return "invalid";
      const c = checkLakeAnswer(r, text);
      if (!c.valid) return "invalid";
      if (c.correct) api.award(LAKE_ANSWER_POINTS);
      set({ answerCorrect: c.correct });
      api.endRound();
      return c.correct ? "correct" : "wrong";
    },
  }),
});
