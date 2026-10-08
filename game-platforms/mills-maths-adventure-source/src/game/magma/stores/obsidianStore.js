import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateObsidianSet, obsidianColRange, obsidianRowRange, obsidianPieces, obsidianPiecePoints,
  gradeObsidianCrack, checkObsidianValue, obsidianTotalOf, OBSIDIAN_TOTAL_POINTS,
} from "../../../data/magma/obsidianChallenge.js";

/**
 * CRACK THE CRYSTAL store.
 *   crack   move the crack (columns; then rows on area rounds) and lock it
 *   pieces  type each piece in turn (one try each)
 *   total   type the whole product
 */
export const useObsidianChallenge = createMagmaStore({
  key: "obsidian",
  generate: generateObsidianSet,
  fresh: (r) => ({
    phase: "crack",
    crackStep: "cols",
    cols: r ? Math.max(1, Math.floor(r.b / 2)) : 1,
    rows: r ? Math.max(1, Math.floor(r.a / 2)) : 1,
    pieces: [],
    pieceIndex: 0,
    pieceResults: [],
    totalCorrect: null,
  }),
  actions: (set, get, api) => ({
    moveCrack(d) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "crack" || !r) return;
      if (get().crackStep === "rows") {
        const R = obsidianRowRange(r);
        set({ rows: Math.max(R.min, Math.min(R.max, get().rows + d)) });
        return;
      }
      const C = obsidianColRange(r);
      let v = get().cols + d;
      if (v === C.skip) v += d; // no crack on the edge itself
      if (v < C.min || v > C.max) return;
      set({ cols: v });
    },
    setCrack(v) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "crack" || !r) return;
      if (get().crackStep === "rows") {
        const R = obsidianRowRange(r);
        set({ rows: Math.max(R.min, Math.min(R.max, Math.round(v))) });
        return;
      }
      const C = obsidianColRange(r);
      let x = Math.max(C.min, Math.min(C.max, Math.round(v)));
      if (x === C.skip) x = x - 1 >= C.min ? x - 1 : x + 1;
      set({ cols: x });
    },
    lockCrack() {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "crack" || !r) return;
      if (r.kind === "area" && get().crackStep === "cols") {
        set({ crackStep: "rows" });
        api.say("Now crack the ROWS.", "warm");
        return;
      }
      const rows = r.kind === "area" ? get().rows : null;
      const g = gradeObsidianCrack(r, get().cols, rows);
      api.award(g.points);
      api.say(g.note, g.tone);
      set({ phase: "pieces", pieces: obsidianPieces(r, get().cols, rows), pieceIndex: 0, pieceResults: [] });
    },
    /** Returns "invalid" | "correct" | "wrong". */
    submitPiece(text) {
      const { pieces, pieceIndex, pieceResults } = get();
      if (get().status !== "play" || get().phase !== "pieces") return "invalid";
      const p = pieces[pieceIndex];
      const c = checkObsidianValue(p.value, text);
      if (!c.valid) return "invalid";
      const pts = obsidianPiecePoints(pieces.length)[pieceIndex];
      if (c.correct) {
        api.award(pts);
        api.say(`${p.rows} × ${p.cols} = ${p.value} ✓`, "good");
      } else {
        api.say(`${p.rows} × ${p.cols} is ${p.value}.`, "bad");
      }
      const done = pieceIndex + 1 >= pieces.length;
      set({ pieceResults: [...pieceResults, c.correct], pieceIndex: pieceIndex + 1, phase: done ? "total" : "pieces" });
      return c.correct ? "correct" : "wrong";
    },
    submitTotal(text) {
      const r = get().currentRound();
      if (get().status !== "play" || get().phase !== "total" || !r) return "invalid";
      const c = checkObsidianValue(obsidianTotalOf(get().pieces), text);
      if (!c.valid) return "invalid";
      if (c.correct) api.award(OBSIDIAN_TOTAL_POINTS);
      set({ totalCorrect: c.correct });
      api.endRound();
      return c.correct ? "correct" : "wrong";
    },
    onEnter() {
      if (get().phase === "crack") get().lockCrack();
    },
  }),
});
