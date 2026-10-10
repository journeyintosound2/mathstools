import { create } from "zustand";

import {
  generateMeadowSet,
  gradeMeadowPredict,
  gradeMeadowCall,
  checkMeadowTotal,
  meadowMaxHops,
  MEADOW_ROUNDS_PER_SET,
  MEADOW_TOTAL_POINTS,
  MEADOW_PREDICT_POINTS,
} from "../data/snow/meadowLevelChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * MEADOW LEVEL STORE (ML) — session state for the levelling challenge.
 *   hopping     (2026-09-28) the student HOPS balls across one tap at a time
 *               → hop(±1), then CALLS it → call("match" | "cant"). A wrong
 *               call is a nudge, not a dead end: the hopping carries on,
 *               but the round's +10 is gone (first call scores).
 *   typing      type the total via the double → submitTotal()
 * The old predict-first path (predicting → levelling) is kept in the store
 * for the checks, but the panel no longer uses it.
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-snowmen-best";

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

export const useMeadowLevel = create((set, get) => ({
  // "idle" | "intro" | "predicting" | "levelling" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  predictResult: null, // gradeMeadowPredict() / the scored call after Part A
  levelStartedAt: 0, // Date.now() when the hops began (drives the 3D)
  // Hop-it-yourself state: balls moved so far (from the ORIGINAL taller
  // snowman), when the latest hop started + its direction (for the 3D
  // flight), whether a wrong call has already been made this round (no
  // points after that), and the nudge text shown on the card.
  hops: 0,
  hopAt: 0,
  hopDir: 1,
  callMissed: false,
  callNote: null,
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
      rounds: generateMeadowSet(),
      roundIndex: 0,
      predictResult: null,
      levelStartedAt: 0,
      hops: 0,
      hopAt: 0,
      hopDir: 1,
      callMissed: false,
      callNote: null,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "hopping" });
  },

  /** Hop one ball across (+1, from the taller) or back (−1). */
  hop(dir) {
    const { status, hops } = get();
    if (status !== "hopping" || (dir !== 1 && dir !== -1)) return;
    const round = get().currentRound();
    if (!round) return;
    const next = hops + dir;
    if (next < 0 || next > meadowMaxHops(round)) return;
    set({ hops: next, hopAt: Date.now(), hopDir: dir, callNote: null });
  },

  /**
   * Part A (hop-it-yourself): call "match" or "cant". A wrong call leaves the
   * student hopping with a nudge; the round's points go with it. A right call
   * moves to typing — on an odd gap the towers settle as near-twins.
   */
  call(kind) {
    const { status, hops, callMissed } = get();
    if (status !== "hopping") return;
    const round = get().currentRound();
    if (!round) return;
    const g = gradeMeadowCall(round, hops, kind);
    if (!g.done) {
      set({ callMissed: true, callNote: g.label });
      return;
    }
    const points = callMissed ? 0 : MEADOW_PREDICT_POINTS;
    set((s) => ({
      status: "typing",
      hops: round.canTwin ? hops : round.moves,
      hopAt: 0,
      callNote: null,
      predictResult: {
        correct: points > 0,
        points,
        label: points > 0 ? g.label : g.label.replace(/ \+\d+ pts$/, ""),
      },
      score: s.score + points,
    }));
  },

  /** Part A: predict the hop count — the TRUE hops always play out next. */
  choosePredict(choice) {
    const { status } = get();
    if (status !== "predicting") return;
    const round = get().currentRound();
    if (!round) return;
    const predict = gradeMeadowPredict(round, choice);
    set((s) => ({
      status: "levelling",
      predictResult: predict,
      levelStartedAt: Date.now(),
      score: s.score + predict.points,
    }));
  },

  /** Called by the panel when the hop animation completes. */
  finishLevel() {
    if (get().status !== "levelling") return;
    set({ status: "typing" });
  },

  /** Part B: the typed total. Returns "invalid" | "correct" | "wrong". */
  submitTotal(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkMeadowTotal(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? MEADOW_TOTAL_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, predictResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, predictResult, typedCorrect }];
    if (roundIndex + 1 < MEADOW_ROUNDS_PER_SET) {
      set({
        status: "hopping",
        roundIndex: roundIndex + 1,
        predictResult: null,
        levelStartedAt: 0,
        hops: 0,
        hopAt: 0,
        hopDir: 1,
        callMissed: false,
        callNote: null,
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
        icon: "⛄",
        title: "Snowman Meadow",
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
      predictResult: null,
      levelStartedAt: 0,
      hops: 0,
      hopAt: 0,
      hopDir: 1,
      callMissed: false,
      callNote: null,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
