import { create } from "zustand";

import {
  generateColonySet,
  gradeColonyPredict,
  checkColonyTotal,
  COLONY_ROUNDS_PER_SET,
  COLONY_TOTAL_POINTS,
} from "../data/snow/colonyPairsChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * COLONY PAIRS STORE (PC) — session state for the doubles/near-doubles
 * challenge.
 *   predicting  pick the hiding double → choosePredict()
 *   pairing     the rows align and pairs light one beat at a time (diff-2
 *               rounds waddle one across first) — panel-timed
 *   typing      type the total via the double → submitTotal()
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-colony-best";

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

export const useColonyPairs = create((set, get) => ({
  // "idle" | "intro" | "predicting" | "pairing" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  predictResult: null,
  pairStartedAt: 0, // Date.now() when the pairing began (drives the 3D)
  typedCorrect: null,
  results: [],
  score: 0,
  bestScore: readBest(),

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  start() {
    set({
      status: "intro",
      rounds: generateColonySet(),
      roundIndex: 0,
      predictResult: null,
      pairStartedAt: 0,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "predicting" });
  },

  /** Part A: pick a doubles-form. Any TRUE form scores. */
  choosePredict(optionIndex) {
    const { status } = get();
    if (status !== "predicting") return;
    const round = get().currentRound();
    if (!round || !round.options[optionIndex]) return;
    const predict = gradeColonyPredict(round, optionIndex);
    set((s) => ({
      status: "pairing",
      predictResult: predict,
      pairStartedAt: Date.now(),
      score: s.score + predict.points,
    }));
  },

  /** Called by the panel when the pairing animation completes. */
  finishPairing() {
    if (get().status !== "pairing") return;
    set({ status: "typing" });
  },

  /** Part B: the typed total. Returns "invalid" | "correct" | "wrong". */
  submitTotal(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkColonyTotal(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? COLONY_TOTAL_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, predictResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, predictResult, typedCorrect }];
    if (roundIndex + 1 < COLONY_ROUNDS_PER_SET) {
      set({
        status: "predicting",
        roundIndex: roundIndex + 1,
        predictResult: null,
        pairStartedAt: 0,
        typedCorrect: null,
        results,
      });
      return;
    }
    writeBest(score);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🐧",
        title: "Penguin Colony",
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
      predictResult: null,
      pairStartedAt: 0,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
