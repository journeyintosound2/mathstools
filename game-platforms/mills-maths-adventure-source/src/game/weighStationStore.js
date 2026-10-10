import { create } from "zustand";

import {
  generateWeighSet,
  gradeWeigh,
  gradeLocate,
  checkRoundedInput,
  WEIGH_ROUNDS_PER_SET,
  WEIGH_TYPE_POINTS,
} from "../data/farm/weighStationChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * WEIGH STATION STORE (F9, v2) — session state for the rounding challenge.
 * Numeric rounds are two-part (like the teacher's Decimal Zoom tool):
 *   locating  drag the marker to the reading's spot → lockIn() (banded pts)
 *   typing    key the rounded value into the input → submitRounded()
 * Judgement rounds keep the tap-a-scenario flow ("choosing").
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 */

const BEST_KEY = "mma-farm-weigh-best";

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
  return round && round.kind === "judge" ? "choosing" : "locating";
}

export const useWeighStation = create((set, get) => ({
  // "idle" | "intro" | "locating" | "typing" | "choosing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  markerFrac: 0.5, // the draggable estimate marker (0..1 along the beam)
  locateResult: null, // { err, band, points, label } after lockIn
  typedCorrect: null,
  chosenIndex: null, // judgement rounds
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
      rounds: generateWeighSet(),
      roundIndex: 0,
      markerFrac: 0.5,
      locateResult: null,
      typedCorrect: null,
      chosenIndex: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: statusForRound(get().currentRound()) });
  },

  /** Drag/nudge the estimate marker (only while locating). */
  setMarkerFrac(frac) {
    if (get().status !== "locating") return;
    set({ markerFrac: Math.max(0, Math.min(1, frac)) });
  },

  /** Part A: lock the estimate in — banded points, then the typing box. */
  lockIn() {
    const { status, markerFrac } = get();
    if (status !== "locating") return;
    const round = get().currentRound();
    if (!round) return;
    const locate = gradeLocate(round, markerFrac);
    set((s) => ({
      status: "typing",
      locateResult: locate,
      score: s.score + locate.points,
    }));
  },

  /** Part B: the typed rounded value. Returns "invalid" | "correct" | "wrong". */
  submitRounded(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkRoundedInput(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? WEIGH_TYPE_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  /** Judgement rounds: tap a scenario card. */
  choose(index) {
    const { status } = get();
    if (status !== "choosing") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeWeigh(round, index);
    set((s) => ({
      status: grade.correct ? "celebrate" : "feedback",
      chosenIndex: index,
      score: s.score + grade.points,
    }));
  },

  next() {
    const { status, roundIndex, rounds, score, locateResult, typedCorrect, chosenIndex } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, locateResult, typedCorrect, chosenIndex }];
    if (roundIndex + 1 < WEIGH_ROUNDS_PER_SET) {
      set({
        status: statusForRound(rounds[roundIndex + 1]),
        roundIndex: roundIndex + 1,
        markerFrac: 0.5,
        locateResult: null,
        typedCorrect: null,
        chosenIndex: null,
        results,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("weigh", score, WEIGH_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "⚖️",
        title: "The Weigh Station",
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
      markerFrac: 0.5,
      locateResult: null,
      typedCorrect: null,
      chosenIndex: null,
      results: [],
      score: 0,
    });
  },
}));
