import { create } from "zustand";

import {
  generateTradeSet,
  gradeTradeTap,
  TRADE_ROUNDS_PER_SET,
  TRADE_BOTH_BONUS,
} from "../data/farm/tradingPostChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * TRADING POST STORE (F10) — session state for the FDP-conversion challenge.
 * A round has TWO stalls to pay; tapping a tag resolves that stall (10 pts
 * if right). When both stalls are resolved: both right → +5 bonus +
 * celebrate (auto-next); any wrong → shake + the chain reason card.
 * Local-only progress like the other farm challenges.
 */

const BEST_KEY = "mma-farm-trade-best";

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

export const useTradingPost = create((set, get) => ({
  // "idle" | "intro" | "trading" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  // Per-stall resolutions this round: { [stall]: { chosenIndex, correct } }
  resolved: {},
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
      rounds: generateTradeSet(),
      roundIndex: 0,
      resolved: {},
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status === "intro") set({ status: "trading" });
  },

  /** Tap a price tag at one of the two target stalls. */
  tapTag(stall, index) {
    const { status, resolved } = get();
    if (status !== "trading" || resolved[stall]) return;
    const round = get().currentRound();
    if (!round) return;
    const target = round.targets.find((t) => t.stall === stall);
    if (!target) return;
    const grade = gradeTradeTap(target, index);
    const nextResolved = { ...resolved, [stall]: { chosenIndex: index, correct: grade.correct } };
    const allDone = round.targets.every((t) => nextResolved[t.stall]);
    const allCorrect = allDone && round.targets.every((t) => nextResolved[t.stall].correct);
    set((s) => ({
      resolved: nextResolved,
      score: s.score + grade.points + (allCorrect ? TRADE_BOTH_BONUS : 0),
      status: allDone ? (allCorrect ? "celebrate" : "feedback") : "trading",
    }));
  },

  next() {
    const { status, roundIndex, score, resolved } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, resolved }];
    if (roundIndex + 1 < TRADE_ROUNDS_PER_SET) {
      set({ status: "trading", roundIndex: roundIndex + 1, resolved: {}, results });
      return;
    }
    writeBest(score);
    reportFarmCompletion("trade", score, TRADE_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🏪",
        title: "The Trading Post",
        message: `${score} points — +${score} XP, +${coins} coins!`,
      });
    }
    set({ status: "done", results, bestScore: Math.max(readBest(), score) });
  },

  exit() {
    set({ status: "idle", rounds: [], roundIndex: 0, resolved: {}, results: [], score: 0 });
  },
}));
