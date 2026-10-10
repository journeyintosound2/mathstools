import { create } from "zustand";

import {
  generateCaveSet,
  gradeCaveChoose,
  checkCaveAnswer,
  CAVE_ROUNDS_PER_SET,
  CAVE_ANSWER_POINTS,
} from "../data/snow/caveCrystalsChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * CAVE CRYSTALS STORE (IC) — session state for the think-addition
 * challenge.
 *   choosing   count up or count back? → chooseDirection()
 *   lighting   the crystals glow one beat at a time in the WINNING
 *              direction (panel-timed via CAVE_GLOW_MS)
 *   typing     type the answer off the lit wall → submitAnswer()
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-cave-best";

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

export const useCaveCrystals = create((set, get) => ({
  // "idle" | "intro" | "choosing" | "lighting" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  chooseResult: null,
  chosen: null, // the direction the student picked — it lights FIRST (round 2)
  lightStartedAt: 0, // Date.now() when the glows began (drives the 3D)
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
      rounds: generateCaveSet(),
      roundIndex: 0,
      chooseResult: null,
      lightStartedAt: 0,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "choosing" });
  },

  /** Part A: pick the direction — the WINNING direction always lights. */
  chooseDirection(direction) {
    const { status } = get();
    if (status !== "choosing") return;
    const round = get().currentRound();
    if (!round) return;
    const choose = gradeCaveChoose(round, direction);
    set((s) => ({
      status: "lighting",
      chooseResult: choose,
      chosen: direction,
      lightStartedAt: Date.now(),
      score: s.score + choose.points,
    }));
  },

  /** Called by the panel when the glow animation completes. */
  finishLighting() {
    if (get().status !== "lighting") return;
    set({ status: "typing" });
  },

  /** Part B: the typed answer. Returns "invalid" | "correct" | "wrong". */
  submitAnswer(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkCaveAnswer(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? CAVE_ANSWER_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, chooseResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, chooseResult, typedCorrect }];
    if (roundIndex + 1 < CAVE_ROUNDS_PER_SET) {
      set({
        status: "choosing",
        roundIndex: roundIndex + 1,
        chooseResult: null,
        chosen: null,
        lightStartedAt: 0,
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
        icon: "🌌",
        title: "The Ice Cave",
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
      chooseResult: null,
      lightStartedAt: 0,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
