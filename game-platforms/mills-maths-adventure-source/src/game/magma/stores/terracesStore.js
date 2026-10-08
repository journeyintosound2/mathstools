import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateTerracesSet, terraceStones, canShift, gradeTerraceSlide, checkTerraceResult,
  checkTerraceFact, terracePoints,
} from "../../../data/magma/terracesChallenge.js";

/**
 * TENFOLD TERRACES store.
 *   fact   (tens/decimal-fact rounds) type the basic fact first
 *   slide  ◀ ×10 / ▶ ÷10 slide the digit stones, then Lock (graded once)
 *   type   type the answer — placeholder zeros drop in when it's right
 */
export const useTerracesChallenge = createMagmaStore({
  key: "terraces",
  generate: generateTerracesSet,
  fresh: (r) => ({
    phase: r && r.fact ? "fact" : "slide",
    shift: 0,
    slideCorrect: null,
    factCorrect: null,
    typedCorrect: null,
    lastSlide: null,
  }),
  actions: (set, get, api) => ({
    submitFact(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "fact" || !r) return "invalid";
      const c = checkTerraceFact(r, text);
      if (!c.valid) return "invalid";
      if (c.correct) {
        api.award(terracePoints(r).fact);
        api.say(`${r.fact[0]} × ${r.fact[1]} = ${r.fact[0] * r.fact[1]} ✓ Now slide it!`, "good");
      } else {
        api.say(`${r.fact[0]} × ${r.fact[1]} = ${r.fact[0] * r.fact[1]}. Now slide it!`, "bad");
      }
      set({ phase: "slide", factCorrect: c.correct });
      return c.correct ? "correct" : "wrong";
    },
    slide(dir) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "slide" || !r) return;
      const stones = terraceStones(r.start);
      const s = get().shift + dir;
      if (!canShift(stones, s)) {
        api.say(dir > 0 ? "The top terrace is the thousands — no higher!" : "That's the lowest terrace!", "warm");
        return;
      }
      set({ shift: s, lastSlide: { dir, at: Date.now() } });
    },
    lock() {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "slide" || !r) return;
      const g = gradeTerraceSlide(r, get().shift);
      if (g.correct) api.award(terracePoints(r).slide);
      api.say(g.note, g.correct ? "good" : "bad");
      set({ phase: "type", slideCorrect: g.correct, shift: r.shift, lastSlide: { dir: 0, at: Date.now() } });
    },
    submitResult(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "type" || !r) return "invalid";
      const c = checkTerraceResult(r, text);
      if (!c.valid) return "invalid";
      if (c.correct) api.award(terracePoints(r).result);
      set({ typedCorrect: c.correct });
      api.endRound();
      return c.correct ? "correct" : "wrong";
    },
    onEnter() {
      if (get().phase === "slide") get().lock();
    },
  }),
});
