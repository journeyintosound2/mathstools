import { create } from "zustand";

import {
  generateCrateSet,
  gradeCrate,
  crateFeedback,
  CRATE_ROUNDS_PER_SET,
} from "../data/farm/cratePackingChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * CRATE PACKING STORE (F6) — session state for the HCF challenge. The maths
 * lives in data/farm/cratePackingChallenge.js (pure); tapping a crate size
 * commits the answer immediately (no separate submit). Pack/spill animation
 * lives in game/CratePackingChallenge.jsx.
 *
 * Local-only progress (matching the other farm challenges).
 */

const BEST_KEY = "mma-farm-crate-best";

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

export const useCratePacking = create((set, get) => ({
  // "idle" | "intro" | "choosing" | "feedback" | "done"
  // "intro" shows the one-off instruction card; play itself keeps the screen
  // clear (results are shown IN-WORLD: confetti / leftover explosion).
  status: "idle",
  rounds: [],
  roundIndex: 0,
  results: [], // [{ round, grade }]
  score: 0,
  bestScore: readBest(),

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  start() {
    set({
      status: "intro",
      rounds: generateCrateSet(),
      roundIndex: 0,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  /** Dismiss the instruction card and play. */
  beginRounds() {
    if (get().status === "intro") set({ status: "choosing" });
  },

  /** Tap a crate size — commits the answer for this round. */
  choose(size) {
    const { status } = get();
    if (status !== "choosing") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeCrate(round, size);
    set((s) => ({
      status: "feedback",
      results: [...s.results, { round, grade }],
      score: s.score + grade.points,
    }));
  },

  next() {
    const { status, roundIndex, score } = get();
    if (status !== "feedback") return;
    if (roundIndex + 1 < CRATE_ROUNDS_PER_SET) {
      set({ status: "choosing", roundIndex: roundIndex + 1 });
      return;
    }
    writeBest(score);
    reportFarmCompletion("crate", score, CRATE_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "📦",
        title: "Crate Packing",
        message: `${score} points — +${score} XP, +${coins} coins!`,
      });
    }
    set({ status: "done", bestScore: Math.max(readBest(), score) });
  },

  exit() {
    set({ status: "idle", rounds: [], roundIndex: 0, results: [], score: 0 });
  },

  lastResult() {
    const { results } = get();
    return results[results.length - 1] || null;
  },

  lastFeedback() {
    const last = get().lastResult();
    return last ? crateFeedback(last.round, last.grade) : null;
  },
}));
