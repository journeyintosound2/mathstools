import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateBonesSet, bonesStart, gradeBonesRaise, checkBonesFactor, BONES_PER_BONE, BONES_FIRST_TRY,
  BONES_FACTOR_POINTS, BONES_MAX_LEN, BONE_NAMES,
} from "../../../data/magma/bonesChallenge.js";

/**
 * GROW THE DRAGON store.
 *   factor  (S5) say how many times as long, first
 *   build   set the three bones, then Raise!
 *   retry   one more Raise after a wonky dragon (the ghost shows the truth)
 */
export const useBonesChallenge = createMagmaStore({
  key: "bones",
  generate: generateBonesSet,
  fresh: (r) => ({
    phase: r && r.askFactor ? "factor" : "build",
    vals: r ? bonesStart(r) : [1, 1, 1],
    raises: 0,
    earned: [false, false, false],
    grade: null,
    factorCorrect: null,
    lastRaise: null,
  }),
  actions: (set, get, api) => ({
    submitFactor(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "factor" || !r) return "invalid";
      const c = checkBonesFactor(r, text);
      if (!c.valid) return "invalid";
      if (c.correct) api.award(BONES_FACTOR_POINTS);
      api.say(
        c.correct ? `Yes — ${r.factorText} times as long! +${BONES_FACTOR_POINTS}` : `${r.baby[0]} → ${r.adult[0]} is ${r.factorText} times as long.`,
        c.correct ? "good" : "bad"
      );
      set({ phase: "build", factorCorrect: c.correct });
      return c.correct ? "correct" : "wrong";
    },
    nudge(j, d) {
      if (get().status !== "play" || (get().phase !== "build" && get().phase !== "retry")) return;
      const vals = get().vals.slice();
      vals[j] = Math.max(1, Math.min(BONES_MAX_LEN, vals[j] + d));
      set({ vals });
    },
    setVal(j, v) {
      if (get().status !== "play") return;
      const vals = get().vals.slice();
      vals[j] = Math.max(1, Math.min(BONES_MAX_LEN, Math.round(v) || 1));
      set({ vals });
    },
    raise() {
      const r = get().currentRound();
      if (get().status !== "play" || (get().phase !== "build" && get().phase !== "retry") || !r) return;
      const g = gradeBonesRaise(r, get().vals);
      const raises = get().raises + 1;
      const earned = get().earned.slice();
      g.correct.forEach((ok, j) => {
        if (ok && !earned[j]) {
          earned[j] = true;
          api.award(BONES_PER_BONE);
        }
      });
      if (g.all && raises === 1 && !r.askFactor) api.award(BONES_FIRST_TRY);
      set({ raises, earned, grade: g, lastRaise: { at: Date.now() } });
      if (g.all || raises >= 2) {
        api.endRound();
        return;
      }
      const addIdx = g.additive.findIndex(Boolean);
      api.say(
        addIdx >= 0
          ? `Wonky! The ${BONE_NAMES[addIdx + 1].toLowerCase()} got the SAME amount ADDED — grown-ups scale. Fix it and raise again!`
          : "Wonky dragon! Compare with the ghost, fix the red bones and raise again.",
        "bad"
      );
      set({ phase: "retry" });
    },
    onEnter() {
      if (get().phase === "build" || get().phase === "retry") get().raise();
    },
  }),
});
