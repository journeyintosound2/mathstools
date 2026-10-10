import { create } from "zustand";

import {
  generateLookoutSet,
  gradeLookoutPick,
  checkLookoutAnswer,
  LOOKOUT_ROUNDS_PER_SET,
  LOOKOUT_ANSWER_POINTS,
} from "../data/snow/auroraLookoutChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * AURORA LOOKOUT STORE (AL) — session state for the capstone.
 *   picking   choose the tool (brightest 10 / sound 5 / unsound 0)
 *   typing    execute against the scaffold — the CHOSEN tool's scaffold
 *             when the choice was sound, else the brightest one
 * Correct answer → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-lights-best";

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

export const useAuroraLookout = create((set, get) => ({
  // "idle" | "intro" | "picking" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  pickResult: null,
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
      rounds: generateLookoutSet(),
      roundIndex: 0,
      pickResult: null,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "picking" });
  },

  /** Part A: pick the tool. */
  choosePick(key) {
    const { status } = get();
    if (status !== "picking") return;
    const round = get().currentRound();
    if (!round) return;
    const pickR = gradeLookoutPick(round, key);
    set((s) => ({
      status: "typing",
      pickResult: pickR,
      score: s.score + pickR.points,
    }));
  },

  /** Part B: execute — the typed result. */
  submitAnswer(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkLookoutAnswer(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? LOOKOUT_ANSWER_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, pickResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, pickResult, typedCorrect }];
    if (roundIndex + 1 < LOOKOUT_ROUNDS_PER_SET) {
      set({
        status: "picking",
        roundIndex: roundIndex + 1,
        pickResult: null,
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
        icon: "✨",
        title: "Aurora Lookout",
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
      pickResult: null,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
