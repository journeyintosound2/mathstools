import { create } from "zustand";

import {
  generateRoundUpSet,
  gradeRoundUp,
  roundUpFeedback,
  fieldSpots,
  penSlots,
  formationSlots,
  ROUNDUP_ROUNDS_PER_SET,
  ROUNDUP_IDLE_HERD,
} from "../data/farm/roundUpChallenge.js";
import { useProgress } from "../progress/store.js";
import { reportFarmCompletion } from "../cloud/farmCompletion.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * ROUND-UP STORE (F3) — session state for the herding challenge. The maths
 * lives in data/farm/roundUpChallenge.js (pure); this store sequences rounds,
 * tracks which cow is where LOGICALLY (field vs penned — the walking
 * animation lives in RoundUpChallenge.jsx), and hands out rewards.
 *
 * Progress is LOCAL-ONLY for now (matching the Fence Challenge) — cloud
 * achievements once the mechanic is proven in class.
 */

const BEST_KEY = "mma-farm-roundup-best";
export const XP_PER_CORRECT = 12;
const COINS_PER_CORRECT = 6;

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

function makeCows(count) {
  const spots = fieldSpots(count);
  return spots.map((s, i) => ({ id: `cow-${i}`, state: "field", fieldSpot: s }));
}

export const useRoundUp = create((set, get) => ({
  // "idle" | "herding" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  results: [], // [{ round, grade }]
  score: 0,
  bestScore: readBest(),

  // The herd. While idle this is the ambient grazing herd; each round
  // re-deals it to the round's herd size. Pen slots are assigned in the
  // order cows are penned (slot index = position in pennedOrder).
  cows: makeCows(ROUNDUP_IDLE_HERD),
  pennedOrder: [], // cow ids in the order they entered the pen
  penSlotsFor(cowId) {
    const idx = get().pennedOrder.indexOf(cowId);
    if (idx < 0) return null;
    return penSlots(Math.max(get().cows.length, 1))[idx] || null;
  },

  // The equal-groups reveal (feedback only): [{x,z,highlight,group}] aligned
  // with cows by index, or null.
  formation: null,

  // A transient hint ("walk closer to that cow"), cleared by the panel.
  hint: null,
  setHint(hint) {
    set({ hint });
  },

  pennedCount() {
    return get().cows.filter((c) => c.state === "penned").length;
  },
  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  start() {
    const rounds = generateRoundUpSet();
    set({
      status: "herding",
      rounds,
      roundIndex: 0,
      results: [],
      score: 0,
      bestScore: readBest(),
      cows: makeCows(rounds[0].herd),
      pennedOrder: [],
      formation: null,
      hint: null,
    });
  },

  /** Toggle a cow between field and pen (called by the 3D layer after its
   *  own proximity check). Only while herding. */
  toggleCow(cowId) {
    const { status, cows, pennedOrder } = get();
    if (status !== "herding") return;
    const cow = cows.find((c) => c.id === cowId);
    if (!cow) return;
    if (cow.state === "field") {
      set({
        cows: cows.map((c) => (c.id === cowId ? { ...c, state: "penned" } : c)),
        pennedOrder: [...pennedOrder, cowId],
      });
    } else {
      set({
        cows: cows.map((c) => (c.id === cowId ? { ...c, state: "field" } : c)),
        pennedOrder: pennedOrder.filter((id) => id !== cowId),
      });
    }
  },

  /** "That's the round-up!" — grade the pen count, reveal the equal groups. */
  submit() {
    const { status } = get();
    if (status !== "herding") return;
    const round = get().currentRound();
    if (!round) return;
    const grade = gradeRoundUp(round, get().pennedCount());
    set((s) => ({
      status: "feedback",
      results: [...s.results, { round, grade }],
      score: s.score + (grade.correct ? 1 : 0),
      formation: formationSlots(round), // ALL cows regroup into equal groups
    }));
  },

  next() {
    const { status, roundIndex, rounds, score } = get();
    if (status !== "feedback") return;
    if (roundIndex + 1 < ROUNDUP_ROUNDS_PER_SET) {
      const nextRound = rounds[roundIndex + 1];
      set({
        status: "herding",
        roundIndex: roundIndex + 1,
        cows: makeCows(nextRound.herd),
        pennedOrder: [],
        formation: null,
      });
      return;
    }
    writeBest(score);
    reportFarmCompletion("roundup", score, ROUNDUP_ROUNDS_PER_SET);
    if (score > 0) {
      // XP was banked round by round (game/roundOutcome.js — XP_PER_CORRECT a cow round).
      useProgress.getState().awardRewards({ coins: score * COINS_PER_CORRECT });
      useUI.getState().pushToast({
        type: "reward",
        icon: "🐄",
        title: "The Round-Up",
        message: `${score}/${ROUNDUP_ROUNDS_PER_SET} rounded up — +${score * XP_PER_CORRECT} XP, +${score * COINS_PER_CORRECT} coins!`,
      });
    }
    set({ status: "done", bestScore: Math.max(readBest(), score), formation: null });
  },

  exit() {
    set({
      status: "idle",
      rounds: [],
      roundIndex: 0,
      results: [],
      score: 0,
      cows: makeCows(ROUNDUP_IDLE_HERD),
      pennedOrder: [],
      formation: null,
      hint: null,
    });
  },

  lastFeedback() {
    const { results } = get();
    const last = results[results.length - 1];
    return last ? roundUpFeedback(last.round, last.grade) : null;
  },
}));
