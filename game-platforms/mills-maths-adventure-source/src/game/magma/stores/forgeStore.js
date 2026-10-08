import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateForgeSet, forgeSplits, forgeSplit, forgeFuse, FORGE_FRIENDLY_POINTS, FORGE_FINAL_POINTS,
  FORGE_MAX_INGOTS,
} from "../../../data/magma/forgeChallenge.js";

/**
 * FACTOR FORGE store. Tap ingots to select (one → hammer it into a factor
 * pair; two → fuse them by typing their product). The last fusion is the
 * answer.
 */
export const useForgeChallenge = createMagmaStore({
  key: "forge",
  generate: generateForgeSet,
  fresh: (r) => ({
    ingots: r ? r.ingots.slice() : [],
    selected: [],
    friendlyDone: false,
    finalMissed: false,
    finalCorrect: null,
    lastEvent: null,
  }),
  actions: (set, get, api) => ({
    select(k) {
      if (get().status !== "play") return;
      const sel = get().selected;
      if (sel.includes(k)) set({ selected: sel.filter((x) => x !== k) });
      else set({ selected: sel.length >= 2 ? [sel[1], k] : [...sel, k] });
    },
    clearSelection() {
      set({ selected: [] });
    },
    split(pair) {
      if (get().status !== "play") return;
      const sel = get().selected;
      if (sel.length !== 1) return;
      const k = sel[0];
      const n = get().ingots[k];
      if (!forgeSplits(n).length) {
        api.say(`${n} is PRIME — it won't break!`, "warm");
        return;
      }
      if (get().ingots.length >= FORGE_MAX_INGOTS) {
        api.say("The anvil is full — fuse some ingots first.", "warm");
        return;
      }
      const next = forgeSplit(get().ingots, k, pair);
      if (!next) return;
      set({ ingots: next, selected: [], lastEvent: { type: "split", k, pair, at: Date.now() } });
      api.say(`Clang! ${n} = ${pair[0]} × ${pair[1]}`, "good");
    },
    /** Returns "invalid" | "correct" | "wrong". */
    fuse(text) {
      if (get().status !== "play") return "invalid";
      const sel = get().selected;
      if (sel.length !== 2) return "invalid";
      const [i, j] = sel;
      const { ingots } = get();
      const res = forgeFuse(ingots, i, j, text);
      if (!res.valid) return "invalid";
      if (!res.correct) {
        if (res.final) set({ finalMissed: true });
        api.say(`Not quite — check ${ingots[i]} × ${ingots[j]} again.`, "bad");
        return "wrong";
      }
      const p = ingots[i] * ingots[j];
      set({ ingots: res.ingots, selected: [], lastEvent: { type: "fuse", at: Date.now(), value: p, friendly: res.friendly } });
      // The bonus is for making a ten ON THE WAY (not the final answer).
      if (res.friendly && !res.final && !get().friendlyDone) {
        api.award(FORGE_FRIENDLY_POINTS);
        set({ friendlyDone: true });
        api.say(`${ingots[i]} × ${ingots[j]} = ${p} — you made a friendly ${p}! +${FORGE_FRIENDLY_POINTS}`, "good");
      } else {
        api.say(`${ingots[i]} × ${ingots[j]} = ${p} ✓`, "good");
      }
      if (res.final) {
        const first = !get().finalMissed;
        if (first) api.award(FORGE_FINAL_POINTS);
        set({ finalCorrect: first });
        api.endRound();
      }
      return "correct";
    },
  }),
});
