import { create } from "zustand";

import {
  generateRoundSet,
  gradePlacement,
  feedbackFor,
  ROUNDS_PER_SET,
} from "../data/farm/fenceChallenge.js";
import { CHALLENGE_FENCE } from "../data/farm/farmLayout.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * FENCE CHALLENGE STORE (F2) — session state for the farm's in-world
 * challenge. The maths lives in data/farm/fenceChallenge.js (pure); this
 * store only sequences rounds and hands out rewards.
 *
 * Progress is LOCAL-ONLY for now (best score in localStorage) — cloud
 * achievements can be wired later once the mechanic has been proven in class.
 */

const BEST_KEY = "mma-farm-fence-best";
const COINS_PER_BULLSEYE = 3;

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
    /* private mode etc. — best score is a nicety only */
  }
}

export const useFarmChallenge = create((set, get) => ({
  // "idle" | "placing" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  results: [], // [{ round, grade, placedFromRed }]
  score: 0, // POINTS (banded by closeness; 25 max per round)
  bullseyes: 0,
  bestScore: readBest(),

  start() {
    set({
      status: "placing",
      rounds: generateRoundSet(),
      roundIndex: 0,
      results: [],
      score: 0,
      bullseyes: 0,
      bestScore: readBest(),
    });
  },

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  /** Place at the player's current spot. `playerX` is the world x position. */
  place(playerX) {
    const { status } = get();
    if (status !== "placing") return;
    const round = get().currentRound();
    if (!round) return;
    // Distance from the RED (west) post, clamped to the fence.
    const placedFromRed = Math.max(0, Math.min(round.length, playerX - CHALLENGE_FENCE.x1));
    const grade = gradePlacement(round, placedFromRed);
    set((s) => ({
      status: "feedback",
      results: [...s.results, { round, grade, placedFromRed }],
      score: s.score + grade.points,
      bullseyes: s.bullseyes + (grade.band === "bullseye" ? 1 : 0),
    }));
  },

  next() {
    const { status, roundIndex, score } = get();
    if (status !== "feedback") return;
    if (roundIndex + 1 < ROUNDS_PER_SET) {
      set({ status: "placing", roundIndex: roundIndex + 1 });
      return;
    }
    // Set complete — local best + a small reward, then the summary card.
    const bullseyes = get().bullseyes;
    writeBest(score);
    reportFarmCompletion("fence", score, ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5) + bullseyes * COINS_PER_BULLSEYE;
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🚜",
        title: "Fence Challenge",
        message: `${score} points${bullseyes ? ` (${bullseyes} bullseye${bullseyes > 1 ? "s" : ""}!)` : ""} — +${score} XP, +${coins} coins!`,
      });
    }
    set({ status: "done", bestScore: Math.max(readBest(), score) });
  },

  exit() {
    set({ status: "idle", rounds: [], roundIndex: 0, results: [], score: 0, bullseyes: 0 });
  },

  /** Feedback line for the round just placed (or null). */
  lastFeedback() {
    const { results } = get();
    const last = results[results.length - 1];
    return last ? feedbackFor(last.round, last.grade) : null;
  },
}));
