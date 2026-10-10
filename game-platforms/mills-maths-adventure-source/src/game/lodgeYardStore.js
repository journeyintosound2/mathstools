import { create } from "zustand";

import {
  generateYardSet,
  gradeYardCount,
  yardTillAfter,
  checkYardChange,
  YARD_ROUNDS_PER_SET,
  YARD_CHANGE_POINTS,
} from "../data/snow/lodgeYardChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * LODGE YARD STORE (LY) — session state for the friends-of-100 challenge.
 * Round 2 (2026-09-29):
 *   paying   tap coins (addCoin) — each is a jump along the number line
 *            from the price; undoCoin takes the last back; giveChange()
 *            only goes through on exactly 100c
 *   typing   say how much change that was → submitChange()
 * Correct change → celebrate (auto-next); wrong → shake + worked card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-lodgeyard-best";

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

export const useLodgeYard = create((set, get) => ({
  // "idle" | "intro" | "paying" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  coins: [], // cents, in the order given
  overshot: false, // the till went past 100c at some point this round
  countResult: null, // gradeYardCount() once the change is given
  note: null, // { text, tone, at }
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
      rounds: generateYardSet(),
      roundIndex: 0,
      coins: [],
      overshot: false,
      countResult: null,
      note: null,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "paying" });
  },

  /** Put one coin in the change pile (a jump along the line). */
  addCoin(cents) {
    const { status, coins, overshot } = get();
    const round = get().currentRound();
    if (status !== "paying" || !round || coins.length >= 20) return;
    const next = [...coins, cents];
    const till = yardTillAfter(round, next);
    set({
      coins: next,
      overshot: overshot || till > 100,
      note: till > 100 ? { text: `${till}c is past $1! Take a coin back.`, tone: "bad", at: Date.now() } : null,
    });
  },

  /** Take the last coin back. */
  undoCoin() {
    const { status, coins } = get();
    if (status !== "paying" || !coins.length) return;
    set({ coins: coins.slice(0, -1), note: null });
  },

  /** "Give the change" — only exactly 100c goes through. */
  giveChange() {
    const { status, coins, overshot } = get();
    const round = get().currentRound();
    if (status !== "paying" || !round) return;
    const g = gradeYardCount(round, coins, overshot);
    if (!g.done) {
      set({ note: { text: g.note, tone: "warm", at: Date.now() } });
      return;
    }
    set((s) => ({
      status: "typing",
      countResult: g,
      note: { text: g.note, tone: "good", at: Date.now() },
      score: s.score + g.points,
    }));
  },

  /** The whole change. Returns "invalid" | "correct" | "wrong". */
  submitChange(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkYardChange(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? YARD_CHANGE_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, countResult, coins, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, countResult, coins, typedCorrect }];
    if (roundIndex + 1 < YARD_ROUNDS_PER_SET) {
      set({
        status: "paying",
        roundIndex: roundIndex + 1,
        coins: [],
      overshot: false,
      countResult: null,
      note: null,
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
        icon: "☕",
        title: "The Lodge Yard",
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
      coins: [],
      overshot: false,
      countResult: null,
      note: null,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
