import { create } from "zustand";

import {
  generateRangeSet,
  gradeRangeSplit,
  checkRangeSum,
  RANGE_ROUNDS_PER_SET,
  RANGE_TYPE_POINTS,
} from "../data/snow/snowballRangeChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * SNOWBALL RANGE STORE (SR) — session state for the bridging-to-ten
 * challenge, the first Snowball Sums build. Two-part rounds (Weigh-Station
 * pacing):
 *   splitting  slide the divider through the handful → throwSplit()
 *   typing     key the finished total into the input → submitSum()
 * Correct typing → celebrate (auto-next); wrong → shake + reason card.
 *
 * THE TEN-FRAME MUST BE FILLED TO CONTINUE (2026-07-29, teacher call). A
 * throw that doesn't complete the frame does NOT advance the round — the
 * gaps (or the bounced surplus) show, then the divider comes straight back
 * for another go. Only an exact fill opens the typing box, so every student
 * physically bridges to the ten before they ever state a total.
 *   `attempts`  how many throws this round has taken (0 before the first).
 * Part A's +10 is awarded on the FIRST attempt only, so the max set score is
 * unchanged at 375 and the split still measures whether they KNEW the
 * complement — the retries teach it rather than score it.
 *
 * NOTE: progress is LOCAL-ONLY for now (localStorage best + XP/coins) — the
 * snow world has no teacher-task/cloud completion path yet (the farm's
 * reportFarmCompletion is farm-specific). Wire a snow equivalent when snow
 * challenges become teacher-assignable.
 */

const BEST_KEY = "mma-snow-range-best";

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

export const useSnowballRange = create((set, get) => ({
  // "idle" | "intro" | "splitting" | "missed" | "typing" | "celebrate"
  // | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  // The divider through the handful: how many snowballs are aimed at the
  // crate (the LEFT group). Starts at 0 — never the answer, so the student
  // must always make a real choice.
  splitIndex: 0,
  splitResult: null, // { correct, short, points, label } after throwSplit
  // Throws taken on the current round. 0 before the first. Part A scores on
  // attempt 1 only; from attempt 2 the sockets preview the fill live, so the
  // retry is scaffolded rather than a guess.
  attempts: 0,
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
      rounds: generateRangeSet(),
      roundIndex: 0,
      splitIndex: 0,
      splitResult: null,
      attempts: 0,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "splitting" });
  },

  /** Move the divider (tap a gap in the 3D row, or ← → nudge). */
  setSplit(index) {
    if (get().status !== "splitting") return;
    const round = get().currentRound();
    if (!round) return;
    set({ splitIndex: Math.max(0, Math.min(round.add, index)) });
  },

  /**
   * Part A: throw with the current split.
   *
   * An EXACT fill opens the typing box. Anything else stays in "missed" —
   * the crate shows the gaps or the bounced surplus, and `retrySplit()`
   * hands the divider back. The round cannot advance on an unfilled frame.
   * Points land on the first attempt only.
   */
  throwSplit() {
    const { status, splitIndex, attempts } = get();
    if (status !== "splitting") return;
    const round = get().currentRound();
    if (!round) return;
    const graded = gradeRangeSplit(round, splitIndex);
    const attemptNo = attempts + 1;
    // gradeRangeSplit always prices a correct split at RANGE_SPLIT_POINTS;
    // only the first throw of the round is allowed to bank it.
    const points = attemptNo === 1 ? graded.points : 0;
    const split = {
      ...graded,
      attempt: attemptNo,
      points,
      scored: points > 0,
      // Don't promise points a later attempt didn't earn.
      label: graded.correct && points === 0 ? "❄️ Crate full — ten!" : graded.label,
    };
    set((s) => ({
      status: graded.correct ? "typing" : "missed",
      splitResult: split,
      attempts: attemptNo,
      score: s.score + points,
    }));
  },

  /** Hand the divider back after a miss — same round, same handful. */
  retrySplit() {
    if (get().status !== "missed") return;
    set({ status: "splitting", splitIndex: 0, splitResult: null });
  },

  /** Part B: the typed total. Returns "invalid" | "correct" | "wrong". */
  submitSum(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkRangeSum(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? RANGE_TYPE_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, splitResult, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, splitResult, typedCorrect }];
    if (roundIndex + 1 < RANGE_ROUNDS_PER_SET) {
      set({
        status: "splitting",
        roundIndex: roundIndex + 1,
        splitIndex: 0,
        splitResult: null,
        attempts: 0,
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
        icon: "❄️",
        title: "The Snowball Range",
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
      splitIndex: 0,
      splitResult: null,
      attempts: 0,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
