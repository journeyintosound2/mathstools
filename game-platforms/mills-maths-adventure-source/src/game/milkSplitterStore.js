import { create } from "zustand";

import {
  generateMilkSet,
  MILK_ROUNDS_PER_SET,
  MILK_PREDICT_POINTS,
  MILK_NOTATION_POINTS,
} from "../data/farm/milkSplitterChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * MILK SPLITTER STORE (F8) — session state for the terminating-vs-recurring
 * challenge. The maths lives in data/farm/milkSplitterChallenge.js (pure).
 *
 * Round flow (statuses):
 *   intro       one-off instruction card
 *   predicting  tap the STOPS or REPEATS chute            (+10 if right)
 *   pouring     the machine performs the division (panel times this)
 *   labelling   pick the correct dot-notation jug          (+15 if right)
 *   celebrate   both right → jug shelved + confetti, auto-next
 *   feedback    something wrong → shake + reason card, manual Next
 *
 * Local-only progress (matching the other farm challenges).
 */

const BEST_KEY = "mma-farm-milk-best";

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

export const useMilkSplitter = create((set, get) => ({
  // "idle" | "intro" | "predicting" | "pouring" | "labelling" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  prediction: null, // true = predicted STOPS (terminating)
  aCorrect: null,
  chosenIndex: null,
  bCorrect: null,
  results: [], // [{ round, aCorrect, bCorrect, points }]
  score: 0,
  shelved: { stops: 0, repeats: 0 }, // labelled jugs on each chute this set
  bestScore: readBest(),

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  start() {
    set({
      status: "intro",
      rounds: generateMilkSet(),
      roundIndex: 0,
      prediction: null,
      aCorrect: null,
      chosenIndex: null,
      bCorrect: null,
      results: [],
      score: 0,
      shelved: { stops: 0, repeats: 0 },
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status === "intro") set({ status: "predicting" });
  },

  /** Part A: tap a chute. `predictStops` true = terminating. */
  predict(predictStops) {
    const { status } = get();
    if (status !== "predicting") return;
    const round = get().currentRound();
    if (!round) return;
    const aCorrect = predictStops === round.isTerminating;
    set((s) => ({
      status: "pouring",
      prediction: predictStops,
      aCorrect,
      score: s.score + (aCorrect ? MILK_PREDICT_POINTS : 0),
    }));
  },

  /** The pour animation has finished (timed by the panel). */
  pourDone() {
    const { status, aCorrect } = get();
    if (status !== "pouring") return;
    set({ status: aCorrect ? "labelling" : "feedback" });
  },

  /** Part B: tap a notation jug. */
  chooseNotation(index) {
    const { status } = get();
    if (status !== "labelling") return;
    const round = get().currentRound();
    if (!round) return;
    const bCorrect = index === round.correctIndex;
    set((s) => ({
      status: bCorrect ? "celebrate" : "feedback",
      chosenIndex: index,
      bCorrect,
      score: s.score + (bCorrect ? MILK_NOTATION_POINTS : 0),
      shelved: bCorrect
        ? {
            ...s.shelved,
            [round.isTerminating ? "stops" : "repeats"]:
              s.shelved[round.isTerminating ? "stops" : "repeats"] + 1,
          }
        : s.shelved,
    }));
  },

  next() {
    const { status, roundIndex, score, aCorrect, bCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [
      ...get().results,
      {
        round,
        aCorrect: Boolean(aCorrect),
        bCorrect: Boolean(bCorrect),
        points: (aCorrect ? MILK_PREDICT_POINTS : 0) + (bCorrect ? MILK_NOTATION_POINTS : 0),
      },
    ];
    if (roundIndex + 1 < MILK_ROUNDS_PER_SET) {
      set({
        status: "predicting",
        roundIndex: roundIndex + 1,
        prediction: null,
        aCorrect: null,
        chosenIndex: null,
        bCorrect: null,
        results,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("milk", score, MILK_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🥛",
        title: "The Milk Splitter",
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
      prediction: null,
      aCorrect: null,
      chosenIndex: null,
      bCorrect: null,
      results: [],
      score: 0,
      shelved: { stops: 0, repeats: 0 },
    });
  },
}));
