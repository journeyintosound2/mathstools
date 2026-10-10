import { create } from "zustand";

import {
  generateVeggieSet,
  gradeVeggiePlace,
  gradeVeggiePotion,
  checkAreaProduct,
  VEGGIE_ROUNDS_PER_SET,
  VEGGIE_TYPE_POINTS,
} from "../data/farm/veggiePlotChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * VEGGIE PLOT STORE (F11) — session state for the multiplying-fractions
 * challenge. AREA rounds are two-part (like the Weigh Station):
 *   placing   drag the width + length edges to the named fractions → lockPlace()
 *   typing    key the harvest product into the input → submitProduct()
 * POTION rounds are a single tap:
 *   predicting  tap GROW or SHRINK → predict()
 * Correct → celebrate (auto-next); wrong → shake + reason card.
 */

const BEST_KEY = "mma-farm-veggie-best";

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

function statusForRound(round) {
  return round && round.kind === "potion" ? "predicting" : "placing";
}

export const useVeggiePlot = create((set, get) => ({
  // "idle" | "intro" | "placing" | "typing" | "predicting" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  cols: 0, // width edge — columns selected (0..gridCols)
  rows: 0, // length edge — rows selected (0..gridRows)
  placeResult: null, // { correct, points } after lockPlace
  typedCorrect: null,
  potionChoice: null, // "grow" | "shrink"
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
      rounds: generateVeggieSet(),
      roundIndex: 0,
      cols: 0,
      rows: 0,
      placeResult: null,
      typedCorrect: null,
      potionChoice: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: statusForRound(get().currentRound()) });
  },

  /** Drag/nudge the WIDTH edge (only while placing). Clamped to the grid. */
  setCols(n) {
    if (get().status !== "placing") return;
    const round = get().currentRound();
    if (!round) return;
    set({ cols: Math.max(0, Math.min(round.gridCols, Math.round(n))) });
  },

  /** Drag/nudge the LENGTH edge (only while placing). Clamped to the grid. */
  setRows(n) {
    if (get().status !== "placing") return;
    const round = get().currentRound();
    if (!round) return;
    set({ rows: Math.max(0, Math.min(round.gridRows, Math.round(n))) });
  },

  /** Part A: lock the bed — 10 points if both edges match, then the typing box. */
  lockPlace() {
    const { status, cols, rows } = get();
    if (status !== "placing") return;
    const round = get().currentRound();
    if (!round) return;
    const place = gradeVeggiePlace(round, cols, rows);
    set((s) => ({
      status: "typing",
      placeResult: place,
      score: s.score + place.points,
    }));
  },

  /** Part B: the typed product. Returns "invalid" | "correct" | "wrong". */
  submitProduct(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkAreaProduct(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? VEGGIE_TYPE_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  /** Potion rounds: tap GROW or SHRINK. */
  predict(choice) {
    const { status } = get();
    if (status !== "predicting") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeVeggiePotion(round, choice);
    set((s) => ({
      status: grade.correct ? "celebrate" : "feedback",
      potionChoice: choice,
      score: s.score + grade.points,
    }));
  },

  next() {
    const { status, roundIndex, rounds, score, placeResult, typedCorrect, potionChoice } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, placeResult, typedCorrect, potionChoice }];
    if (roundIndex + 1 < VEGGIE_ROUNDS_PER_SET) {
      set({
        status: statusForRound(rounds[roundIndex + 1]),
        roundIndex: roundIndex + 1,
        cols: 0,
        rows: 0,
        placeResult: null,
        typedCorrect: null,
        potionChoice: null,
        results,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("veggie", score, VEGGIE_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🥕",
        title: "The Veggie Plot",
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
      cols: 0,
      rows: 0,
      placeResult: null,
      typedCorrect: null,
      potionChoice: null,
      results: [],
      score: 0,
    });
  },
}));
