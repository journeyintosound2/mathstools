import { create } from "zustand";

import {
  generateSledSet,
  gradeSledPredict,
  gradeSledSlide,
  checkSledDiff,
  SLED_ROUNDS_PER_SET,
  SLED_DIFF_POINTS,
  SLED_MAX_SLIDES,
} from "../data/snow/sledSlopeChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * SLED SLOPE STORE (SL) — session state for the constant-difference
 * challenge. Three-part rounds:
 *   predicting  the rope thought-experiment (bigger/same/smaller)
 *   sliding     nudge the roped PAIR ±1 to put the back sled on a decade,
 *               then confirm with RACE! (a wrong resting spot reveals the
 *               friendly position before typing)
 *   typing      type the difference off the friendly pair → the sleds RACE
 * Correct typing → celebrate (the downhill race, auto-next); wrong → shake
 * + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-sled-best";

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

export const useSledSlope = create((set, get) => ({
  // "idle" | "intro" | "predicting" | "sliding" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  slid: 0, // how far the PAIR has been nudged (signed)
  slidesUsed: 0,
  predictResult: null,
  slideResult: null,
  typedCorrect: null,
  raceStartedAt: 0, // Date.now() when the celebrate race began (3D anim)
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
      rounds: generateSledSet(),
      roundIndex: 0,
      slid: 0,
      slidesUsed: 0,
      predictResult: null,
      slideResult: null,
      typedCorrect: null,
      raceStartedAt: 0,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    // 2026-09-28: straight to sliding — the rope prediction is retired.
    set({ status: "sliding" });
  },

  /** Part A: the rope prediction. */
  choosePredict(choice) {
    const { status } = get();
    if (status !== "predicting") return;
    const round = get().currentRound();
    if (!round) return;
    const predict = gradeSledPredict(round, choice);
    set((s) => ({
      status: "sliding",
      predictResult: predict,
      score: s.score + predict.points,
    }));
  },

  /** Nudge the roped pair by ±1 (both sleds together — always together). */
  nudge(delta) {
    const { status, slid, slidesUsed } = get();
    if (status !== "sliding" || Math.abs(delta) !== 1) return;
    if (slidesUsed >= SLED_MAX_SLIDES) return;
    set({ slid: slid + delta, slidesUsed: slidesUsed + 1 });
  },

  /** Part B: RACE! — graded on the back sled resting on a decade. */
  confirmSlide() {
    const { status, slid } = get();
    if (status !== "sliding") return;
    const round = get().currentRound();
    if (!round) return;
    const slide = gradeSledSlide(round, slid);
    set((s) => ({
      status: "typing",
      slideResult: slide,
      // Round 2 (Jeff, 2026-09-29): the sleds STAY where the student left
      // them — no jumping to the friendly spot. They still find the gap from
      // there (it's the same gap!), but only a tens-number spot earns the
      // slide points, so gold needs the easy position.
      slid,
      score: s.score + slide.points,
    }));
  },

  /** Part C: the typed difference. Returns "invalid" | "correct" | "wrong". */
  submitDiff(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkSledDiff(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      raceStartedAt: correct ? Date.now() : 0,
      score: s.score + (correct ? SLED_DIFF_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, predictResult, slideResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, predictResult, slideResult, typedCorrect }];
    if (roundIndex + 1 < SLED_ROUNDS_PER_SET) {
      set({
        status: "sliding",
        roundIndex: roundIndex + 1,
        slid: 0,
        slidesUsed: 0,
        predictResult: null,
        slideResult: null,
        typedCorrect: null,
        raceStartedAt: 0,
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
        icon: "🛷",
        title: "Sledding Slope",
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
      slid: 0,
      slidesUsed: 0,
      predictResult: null,
      slideResult: null,
      typedCorrect: null,
      raceStartedAt: 0,
      results: [],
      score: 0,
    });
  },
}));
