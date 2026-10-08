import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateGardenSet, gradeGardenPredict, gradeGardenClaim, gardenKey, gardenAllKeys,
  GARDEN_PREDICT_POINTS,
} from "../../../data/magma/gardenChallenge.js";

/**
 * FLOWER COMBOS store.
 *   predict  type how many combos (or the missing factor)
 *   plant    pick a flower + pot (+ glow) and Plant, or a whole row, or copy
 *            a glow's garden to every glow; then "That's every combo!"
 */
export const useGardenChallenge = createMagmaStore({
  key: "garden",
  generate: generateGardenSet,
  fresh: () => ({ phase: "predict", planted: [], sel: { f: 0, p: 0, g: 0 }, predictCorrect: null, claimResult: null, lastPlant: null }),
  actions: (set, get, api) => ({
    submitPredict(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "predict" || !r) return "invalid";
      const g = gradeGardenPredict(r, text);
      if (!g.valid) return "invalid";
      if (g.correct) api.award(GARDEN_PREDICT_POINTS);
      api.say(g.note, g.correct ? "good" : "warm");
      set({ phase: "plant", predictCorrect: g.correct });
      return g.correct ? "correct" : "wrong";
    },
    choose(kind, idx) {
      set({ sel: { ...get().sel, [kind]: idx } });
    },
    _plantKeys(keys) {
      const have = new Set(get().planted);
      const add = keys.filter((k) => !have.has(k));
      if (!add.length) {
        api.say("Already planted!", "warm");
        return 0;
      }
      set({ planted: [...get().planted, ...add], lastPlant: { keys: add, at: Date.now() }, note: null });
      return add.length;
    },
    plant() {
      if (get().status !== "play" || get().phase !== "plant") return;
      const { f, p, g } = get().sel;
      get()._plantKeys([gardenKey(f, p, g)]);
    },
    plantRow() {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "plant" || !r) return;
      const { f, g } = get().sel;
      const keys = [];
      for (let p = 0; p < r.p; p++) keys.push(gardenKey(f, p, g));
      get()._plantKeys(keys);
    },
    copyGlow() {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "plant" || !r || r.g < 2) return;
      const g0 = get().sel.g;
      const mine = get().planted.filter((k) => k.endsWith(`-${g0}`));
      if (!mine.length) {
        api.say("Plant this glow's garden first, then copy it!", "warm");
        return;
      }
      const keys = [];
      for (let g = 0; g < r.g; g++) {
        if (g === g0) continue;
        for (const k of mine) keys.push(k.replace(/-\d+$/, `-${g}`));
      }
      get()._plantKeys(keys);
    },
    claim() {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "plant" || !r) return;
      const c = gradeGardenClaim(r, new Set(get().planted));
      api.award(c.points);
      const have = new Set(get().planted);
      set({ claimResult: { ...c, missing: gardenAllKeys(r).filter((k) => !have.has(k)) } });
      api.endRound();
    },
    onEnter() {
      if (get().phase === "plant") get().plant();
    },
  }),
});
