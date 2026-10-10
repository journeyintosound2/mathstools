import { create } from "zustand";

import {
  generateOrderSet,
  gradeOrder,
  orderFeedback,
  ORDER_ROUNDS_PER_SET,
} from "../data/farm/orderPartsChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * ORDER THE PARTS STORE (F4) — session state for the carrot-garden ordering
 * challenge. The maths lives in data/farm/orderPartsChallenge.js (pure);
 * this store sequences rounds and tracks the row arrangement (item ids in
 * left→right slot order). Swap/confetti/shake animation lives in
 * game/OrderPartsChallenge.jsx.
 *
 * Local-only progress (matching the other farm challenges).
 */

const BEST_KEY = "mma-farm-order-best";

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

export const useOrderParts = create((set, get) => ({
  // "idle" | "ordering" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  arrangement: [], // item ids in current left→right slot order
  selectedId: null, // the lifted carrot awaiting its swap partner
  results: [], // [{ round, grade }]
  score: 0,
  bestScore: readBest(),

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  start() {
    const rounds = generateOrderSet();
    set({
      status: "ordering",
      rounds,
      roundIndex: 0,
      arrangement: rounds[0].items.map((it) => it.id),
      selectedId: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  /** Tap a carrot: first tap lifts it, second tap swaps the pair. */
  tapItem(itemId) {
    const { status, selectedId, arrangement } = get();
    if (status !== "ordering") return;
    if (!selectedId) {
      set({ selectedId: itemId });
      return;
    }
    if (selectedId === itemId) {
      set({ selectedId: null }); // tap again to put it down
      return;
    }
    const a = arrangement.indexOf(selectedId);
    const b = arrangement.indexOf(itemId);
    if (a < 0 || b < 0) return;
    const next = [...arrangement];
    [next[a], next[b]] = [next[b], next[a]];
    set({ arrangement: next, selectedId: null });
  },

  /** "Check the order!" — grade, then feedback (confetti or shake+reveal). */
  check() {
    const { status, arrangement } = get();
    if (status !== "ordering") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeOrder(round, arrangement);
    set((s) => ({
      status: "feedback",
      selectedId: null,
      results: [...s.results, { round, grade }],
      score: s.score + grade.points,
      // On a miss the row REVEALS itself: slide into the correct order.
      arrangement: grade.correct ? arrangement : grade.sortedIds,
    }));
  },

  next() {
    const { status, roundIndex, rounds, score } = get();
    if (status !== "feedback") return;
    if (roundIndex + 1 < ORDER_ROUNDS_PER_SET) {
      set({
        status: "ordering",
        roundIndex: roundIndex + 1,
        arrangement: rounds[roundIndex + 1].items.map((it) => it.id),
        selectedId: null,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("order", score, ORDER_ROUNDS_PER_SET);
    if (score > 0) {
      const coins = Math.floor(score / 5);
      // XP was banked round by round as the points landed (game/roundOutcome.js).
      useProgress.getState().awardRewards({ coins });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🥕",
        title: "Order the Parts",
        message: `${score} points — +${score} XP, +${coins} coins!`,
      });
    }
    set({ status: "done", bestScore: Math.max(readBest(), score) });
  },

  exit() {
    set({
      status: "idle",
      rounds: [],
      roundIndex: 0,
      arrangement: [],
      selectedId: null,
      results: [],
      score: 0,
    });
  },

  lastResult() {
    const { results } = get();
    return results[results.length - 1] || null;
  },

  lastFeedback() {
    const last = get().lastResult();
    return last ? orderFeedback(last.round, last.grade) : null;
  },
}));
