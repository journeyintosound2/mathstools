import { createMagmaStore } from "../createMagmaStore.js";
import { generateSummitSet, gradeSummitPick, checkSummitAnswer, SUMMIT_ANSWER_POINTS } from "../../../data/magma/summitChallenge.js";

/**
 * STRATEGY SUMMIT store.
 *   pick  choose one of three rune tablets (all correct; the easiest +10)
 *   work  do it that way — type the answer
 */
export const useSummitChallenge = createMagmaStore({
  key: "summit",
  generate: generateSummitSet,
  fresh: () => ({ phase: "pick", picked: null, pickBest: null, typedCorrect: null }),
  actions: (set, get, api) => ({
    pick(key) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "pick" || !r) return;
      const g = gradeSummitPick(r, key);
      if (!g.valid) return;
      api.award(g.points);
      api.say(g.note, g.best ? "good" : "warm");
      set({ phase: "work", picked: key, pickBest: g.best });
    },
    submit(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "work" || !r) return "invalid";
      const c = checkSummitAnswer(r, text);
      if (!c.valid) return "invalid";
      if (c.correct) api.award(SUMMIT_ANSWER_POINTS);
      set({ typedCorrect: c.correct });
      api.endRound();
      return c.correct ? "correct" : "wrong";
    },
  }),
});
