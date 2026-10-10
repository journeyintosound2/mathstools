import { create } from "zustand";

import {
  generateGroveSet,
  gradeGroveGrab,
  gradeGroveAdjust,
  checkGroveTotal,
  GROVE_ROUNDS_PER_SET,
  GROVE_TOTAL_POINTS,
} from "../data/snow/groveLightsChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * GROVE LIGHTS STORE (GV) — session state for the compensation challenge.
 * Three-part rounds (Trading-Post-style):
 *   grabbing   pick the friendly bundle pile → chooseGrab()
 *   adjusting  the FRIENDLY bundles hang (even after a wrong grab — the
 *              student sees the quick way), then pick the fix → chooseAdjust()
 *   typing     the true fix performs (ping!), type the total → submitTotal()
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-pines-best";

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

export const useGroveLights = create((set, get) => ({
  // "idle" | "intro" | "grabbing" | "adjusting" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  grabResult: null, // gradeGroveGrab() after Part A
  adjustResult: null, // gradeGroveAdjust() after Part B
  // Round 2 (Jeff, 2026-09-29): a wrong pick SHAKES and the student tries
  // again — only a first-try pick scores. `missNote` is the nudge on the card.
  missedThisPart: false,
  missNote: null,
  missAt: 0,
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
      rounds: generateGroveSet(),
      roundIndex: 0,
      grabResult: null,
      adjustResult: null,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "grabbing" });
  },

  /** Part A: pick a bundle pile. Wrong → shake + try again (no points). */
  chooseGrab(bundles) {
    const { status, missedThisPart } = get();
    if (status !== "grabbing") return;
    const round = get().currentRound();
    if (!round || !round.grabOptions.includes(bundles)) return;
    const grab = gradeGroveGrab(round, bundles);
    if (!grab.correct) {
      set({ missedThisPart: true, missNote: grab.label, missAt: Date.now() });
      return;
    }
    const points = missedThisPart ? 0 : grab.points;
    set((s) => ({
      status: "adjusting",
      grabResult: { ...grab, points, label: points ? grab.label : "✨ That's the closest bundle!" },
      missedThisPart: false,
      missNote: null,
      score: s.score + points,
    }));
  },

  /** Part B: pick the fix. Wrong → shake + try again (no points). */
  chooseAdjust(value) {
    const { status, missedThisPart } = get();
    if (status !== "adjusting") return;
    const round = get().currentRound();
    if (!round) return;
    const adj = gradeGroveAdjust(round, value);
    if (!adj.correct) {
      set({ missedThisPart: true, missNote: "Not that one — compare what you hung with what it needed.", missAt: Date.now() });
      return;
    }
    const points = missedThisPart ? 0 : adj.points;
    set((s) => ({
      status: "typing",
      adjustResult: { ...adj, points, label: points ? adj.label : "💡 Fixed!" },
      missedThisPart: false,
      missNote: null,
      score: s.score + points,
    }));
  },

  /** Part C: the typed total. Returns "invalid" | "correct" | "wrong". */
  submitTotal(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkGroveTotal(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? GROVE_TOTAL_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, grabResult, adjustResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, grabResult, adjustResult, typedCorrect }];
    if (roundIndex + 1 < GROVE_ROUNDS_PER_SET) {
      set({
        status: "grabbing",
        roundIndex: roundIndex + 1,
        grabResult: null,
        adjustResult: null,
        missedThisPart: false,
        missNote: null,
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
        icon: "🎄",
        title: "Christmas Tree Grove",
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
      grabResult: null,
      adjustResult: null,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
