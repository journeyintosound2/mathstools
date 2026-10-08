import { createMagmaStore } from "../createMagmaStore.js";
import { generateGeysersSet, geyserMove, gradeGeyserSolve } from "../../../data/magma/geysersChallenge.js";

/**
 * HALVE & DOUBLE store.
 *   shape  steam-cut the terrace (halve rows ⇄ halve length), then Solve
 *   type   type the product from the form you stopped at
 */
export const useGeysersChallenge = createMagmaStore({
  key: "geysers",
  generate: generateGeysersSet,
  fresh: (r) => ({ phase: "shape", chain: r ? [[r.a, r.b]] : [], lastMove: null, solveResult: null }),
  actions: (set, get, api) => ({
    move(which) {
      if (get().status !== "play" || get().phase !== "shape") return;
      const chain = get().chain;
      const [a, b] = chain[chain.length - 1];
      const next = geyserMove(a, b, which);
      if (!next) {
        const odd = which === "rows" ? a : b;
        api.say(`${odd} is odd — it won't halve into whole ${which === "rows" ? "rows" : "columns"}!`, "warm");
        return;
      }
      if (next[0] > 2000 || next[1] > 2000) return;
      const prev = chain[chain.length - 2];
      const nextChain = prev && prev[0] === next[0] && prev[1] === next[1] ? chain.slice(0, -1) : [...chain, next];
      set({ chain: nextChain, lastMove: { which, from: [a, b], to: next, at: Date.now() }, note: null });
    },
    restart() {
      const r = get().currentRound();
      if (get().status !== "play" || !r) return;
      set({ chain: [[r.a, r.b]], phase: "shape", lastMove: null, note: null });
    },
    solve() {
      if (get().status !== "play" || get().phase !== "shape") return;
      set({ phase: "type" });
    },
    back() {
      if (get().status !== "play" || get().phase !== "type") return;
      set({ phase: "shape" });
    },
    submit(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "type" || !r) return "invalid";
      const g = gradeGeyserSolve(r, get().chain, text);
      if (!g.valid) return "invalid";
      api.award(g.formPoints + g.productPoints);
      set({ solveResult: g });
      api.endRound();
      return g.correct ? "correct" : "wrong";
    },
    onEnter() {
      if (get().phase === "shape") get().solve();
    },
  }),
});
