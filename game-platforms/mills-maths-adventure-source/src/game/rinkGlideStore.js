import { create } from "zustand";

import {
  generateRinkSet,
  gradeGlide,
  RINK_ROUNDS_PER_SET,
  RINK_MAX_QUEUE,
} from "../data/snow/rinkGlideChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * ICE RINK GLIDE STORE (RG) — session state for the glide-by-tens challenge.
 * The student PLANS a queue of pushes (planning), presses GO and the penguin
 * skates the jumps (gliding — paced by the panel via RINK_PUSH_MS), then the
 * landing is graded (celebrate / feedback).
 *
 * NOTE: progress is LOCAL-ONLY for now (localStorage best + XP/coins) — the
 * snow world has no teacher-task/cloud completion path yet (same note as the
 * Snowball Range store).
 */

const BEST_KEY = "mma-snow-rink-best";

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

export const useRinkGlide = create((set, get) => ({
  // "idle" | "intro" | "planning" | "gliding" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  queue: [], // the planned pushes (±10 / ±1)
  glideStartedAt: 0, // Date.now() when GO was pressed (drives the 3D glide)
  landResult: null, // gradeGlide() result after the glide finishes
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
      rounds: generateRinkSet(),
      roundIndex: 0,
      queue: [],
      glideStartedAt: 0,
      landResult: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "planning" });
  },

  /** Queue one push (only while planning; the queue is capped). */
  addPush(v) {
    const { status, queue } = get();
    if (status !== "planning") return;
    const round = get().currentRound();
    if (!round || !round.buttons.includes(v)) return;
    if (queue.length >= RINK_MAX_QUEUE) return;
    set({ queue: [...queue, v] });
  },

  undoPush() {
    const { status, queue } = get();
    if (status !== "planning" || queue.length === 0) return;
    set({ queue: queue.slice(0, -1) });
  },

  clearQueue() {
    if (get().status !== "planning") return;
    set({ queue: [] });
  },

  /** GO — the penguin skates the queued pushes (panel times the finish). */
  go() {
    const { status, queue } = get();
    if (status !== "planning" || queue.length === 0) return;
    set({ status: "gliding", glideStartedAt: Date.now() });
  },

  /** Called by the panel when the glide animation completes — grades. */
  finishGlide() {
    const { status, queue } = get();
    if (status !== "gliding") return;
    const round = get().currentRound();
    if (!round) return;
    const land = gradeGlide(round, queue);
    set((s) => ({
      status: land.landed ? "celebrate" : "feedback",
      landResult: land,
      score: s.score + land.points,
    }));
  },

  next() {
    const { status, roundIndex, score, landResult, queue } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, queue, landResult }];
    if (roundIndex + 1 < RINK_ROUNDS_PER_SET) {
      set({
        status: "planning",
        roundIndex: roundIndex + 1,
        queue: [],
        glideStartedAt: 0,
        landResult: null,
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
        icon: "⛸️",
        title: "The Ice Rink",
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
      queue: [],
      glideStartedAt: 0,
      landResult: null,
      results: [],
      score: 0,
    });
  },
}));
