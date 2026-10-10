import { create } from "zustand";

import {
  generateShopSet,
  gradeShop,
  SHOP_ROUNDS_PER_SET,
} from "../data/farm/farmShopChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * THE FARM SHOP STORE (F13) — session state for the percentages capstone. Each
 * round the student TYPES one number (a $ price, a % or a count) and checks it:
 *   playing    type the answer → "Ring it up!" grades vs the round's value;
 * exact → celebrate (auto-next); wrong → feedback card with the working.
 * The market-day CHAIN carries the correct running price forward round to round.
 */

const BEST_KEY = "mma-farm-shop-best";

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

export const useFarmShop = create((set, get) => ({
  // "idle" | "intro" | "playing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  input: "", // the student's typed answer this round
  result: null, // gradeShop result after check
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
      rounds: generateShopSet(),
      roundIndex: 0,
      input: "",
      result: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "playing" });
  },

  setInput(v) {
    if (get().status !== "playing") return;
    set({ input: v });
  },

  /** Grade the typed answer. Exact (within tolerance) → celebrate; else feedback. */
  check() {
    if (get().status !== "playing") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeShop(round, get().input);
    if (!grade.valid) return; // ignore empty / non-numeric entries
    set((s) => ({
      status: grade.correct ? "celebrate" : "feedback",
      result: grade,
      score: s.score + grade.points,
    }));
  },

  next() {
    const { status, roundIndex, score } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, result: get().result }];
    if (roundIndex + 1 < SHOP_ROUNDS_PER_SET) {
      set({
        status: "playing",
        roundIndex: roundIndex + 1,
        input: "",
        result: null,
        results,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("shop", score, SHOP_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🏪",
        title: "The Farm Shop",
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
      input: "",
      result: null,
      results: [],
      score: 0,
    });
  },
}));
