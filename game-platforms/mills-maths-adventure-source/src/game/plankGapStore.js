import { create } from "zustand";

import {
  generatePlankSet,
  gradePlank,
  sumPlanks,
  PLANK_ROUNDS_PER_SET,
} from "../data/farm/plankGapChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * PLANK THE GAP STORE (F12) — session state for the add/subtract-fractions
 * challenge. The student LAYS planks (each an integer number of twelfths) to
 * fill the gap, then checks:
 *   filling   tap plank pieces (½ ⅓ ¼ ⅙ 1/12) → they lay onto the grid;
 *             undo / clear to fix; "Fill it!" grades the sum vs the gap.
 * Exact fill → celebrate (auto-next); over/under → shake + reason card.
 */

const BEST_KEY = "mma-farm-plank-best";

function readBest() {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function writeBest(score) {
  try {
    if (score > readBest()) localStorage.setItem(BEST_KEY, String(score));
  } catch {
    /* best score is a nicety only */
  }
}

export const usePlankGap = create((set, get) => ({
  // "idle" | "intro" | "filling" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  laid: [], // twelfth-values the student has laid this round (in order)
  result: null, // gradePlank result after check
  results: [],
  score: 0,
  bestScore: readBest(),

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  /** Twelfths laid so far this round. */
  laidTw() {
    return sumPlanks(get().laid);
  },

  start() {
    set({
      status: "intro",
      rounds: generatePlankSet(),
      roundIndex: 0,
      laid: [],
      result: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "filling" });
  },

  /** Lay one plank of `tw` twelfths (only while filling). Capped a little over
   *  the gap so an over-fill is obvious without running away. */
  addPlank(tw) {
    if (get().status !== "filling") return;
    const round = get().currentRound();
    if (!round) return;
    if (sumPlanks(get().laid) + tw > round.gapTw + 12) return; // sanity cap
    set((s) => ({ laid: [...s.laid, tw] }));
  },

  /** Remove the last plank laid. */
  removeLast() {
    if (get().status !== "filling") return;
    set((s) => ({ laid: s.laid.slice(0, -1) }));
  },

  /** Clear all laid planks. */
  clear() {
    if (get().status !== "filling") return;
    set({ laid: [] });
  },

  /** Check the fill. Exact → celebrate; over/under → feedback. */
  check() {
    if (get().status !== "filling") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradePlank(round, sumPlanks(get().laid));
    set((s) => ({
      status: grade.correct ? "celebrate" : "feedback",
      result: grade,
      score: s.score + grade.points,
    }));
  },

  next() {
    const { status, roundIndex, score, result } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, result }];
    if (roundIndex + 1 < PLANK_ROUNDS_PER_SET) {
      set({
        status: "filling",
        roundIndex: roundIndex + 1,
        laid: [],
        result: null,
        results,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("plank", score, PLANK_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🪵",
        title: "Plank the Gap",
        message: `${score} points — +${score} XP, +${coins} coins!`,
      });
    }
    set({ status: "done", results, bestScore: Math.max(readBest(), score) });
  },

  exit() {
    set({
      status: "idle",
      rounds: [],
      roundIndex: 0,
      laid: [],
      result: null,
      results: [],
      score: 0,
    });
  },
}));
