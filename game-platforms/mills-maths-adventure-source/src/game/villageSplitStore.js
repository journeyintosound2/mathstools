import { create } from "zustand";

import {
  generateVillageSet,
  gradeVillageBuild,
  villageSite,
  checkVillageTotal,
  VILLAGE_ROUNDS_PER_SET,
  VILLAGE_BUILD_POINTS,
  VILLAGE_TOTAL_POINTS,
} from "../data/snow/villageSplitChallenge.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * VILLAGE SPLIT STORE (VG) — session state for the partitioning challenge.
 * Round 2 (2026-09-29): the student BUILDS the sum themselves.
 *   building   move each rod / cube from the two igloos to the middle one
 *              (moveBlock / moveAll), swap ten ones for a ten (regroup),
 *              then "Done!" (finishBuild) — the first Done that is right
 *              scores VILLAGE_BUILD_POINTS; a missed swap is a nudge
 *   typing     the build stands finished; type a + b
 * Correct total → celebrate (auto-next); wrong → shake + reason card.
 *
 * NOTE: progress is LOCAL-ONLY for now — same note as the other snow stores.
 */

const BEST_KEY = "mma-snow-village-best";

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

export const useVillageSplit = create((set, get) => ({
  // "idle" | "intro" | "building" | "typing" | "celebrate" | "feedback" | "done"
  status: "idle",
  rounds: [],
  roundIndex: 0,
  moved: { ta: 0, tb: 0, oa: 0, ob: 0 }, // blocks moved to the middle igloo
  regrouped: false, // ten ones swapped for a ten
  buildMissed: false, // a Done pressed with 10+ ones left un-swapped
  buildNote: null, // { text, tone: "good"|"warm"|"bad", at }
  buildPoints: 0,
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
      rounds: generateVillageSet(),
      roundIndex: 0,
      moved: { ta: 0, tb: 0, oa: 0, ob: 0 },
      regrouped: false,
      buildMissed: false,
      buildNote: null,
      buildPoints: 0,
      typedCorrect: null,
      results: [],
      score: 0,
      bestScore: readBest(),
    });
  },

  beginRounds() {
    if (get().status !== "intro") return;
    set({ status: "building" });
  },

  /** Move ONE rod ("ten") or cube ("one") from igloo "a" or "b". */
  moveBlock(side, kind) {
    const { status, moved } = get();
    const round = get().currentRound();
    if (status !== "building" || !round) return false;
    const key = (kind === "ten" ? "t" : "o") + side;
    if (!(key in moved) || moved[key] >= round[key]) return false;
    set({ moved: { ...moved, [key]: moved[key] + 1 }, buildNote: null });
    return true;
  },

  /** Move everything of one kind from one igloo (the "all" shortcut). */
  moveAll(side, kind) {
    const { status, moved } = get();
    const round = get().currentRound();
    if (status !== "building" || !round) return;
    const key = (kind === "ten" ? "t" : "o") + side;
    set({ moved: { ...moved, [key]: round[key] }, buildNote: null });
  },

  /** Swap ten ones in the middle igloo for one new ten. */
  regroup() {
    const { status, moved, regrouped } = get();
    const round = get().currentRound();
    if (status !== "building" || !round || regrouped) return false;
    if (villageSite(round, moved, false).ones < 10) {
      set({ buildNote: { text: "You need 10 ones in the middle igloo to make a ten.", tone: "warm", at: Date.now() } });
      return false;
    }
    set({ regrouped: true, buildNote: null });
    return true;
  },

  /** "Done!" — grade the build. */
  finishBuild() {
    const { status, moved, regrouped, buildMissed } = get();
    const round = get().currentRound();
    if (status !== "building" || !round) return;
    const g = gradeVillageBuild(round, moved, regrouped);
    if (!g.done) {
      set({
        buildMissed: buildMissed || g.miss,
        buildNote: { text: g.note, tone: g.miss ? "bad" : "warm", at: Date.now() },
      });
      return;
    }
    const pts = buildMissed ? 0 : VILLAGE_BUILD_POINTS;
    set((s) => ({
      status: "typing",
      buildPoints: pts,
      score: s.score + pts,
      buildNote: {
        text: pts ? g.note : g.note.replace(/ \+\d+ pts$/, ""),
        tone: pts ? "good" : "warm",
        at: Date.now(),
      },
    }));
  },

  /** The finished total. Returns "invalid" | "correct" | "wrong". */
  submitTotal(text) {
    const { status } = get();
    if (status !== "typing") return "invalid";
    const round = get().currentRound();
    if (!round) return "invalid";
    const { valid, correct } = checkVillageTotal(round, text);
    if (!valid) return "invalid";
    set((s) => ({
      status: correct ? "celebrate" : "feedback",
      typedCorrect: correct,
      score: s.score + (correct ? VILLAGE_TOTAL_POINTS : 0),
    }));
    return correct ? "correct" : "wrong";
  },

  next() {
    const { status, roundIndex, score, buildPoints, typedCorrect } = get();
    if (status !== "feedback" && status !== "celebrate") return;
    const round = get().currentRound();
    const results = [...get().results, { round, buildPoints, typedCorrect }];
    if (roundIndex + 1 < VILLAGE_ROUNDS_PER_SET) {
      set({
        status: "building",
        roundIndex: roundIndex + 1,
        moved: { ta: 0, tb: 0, oa: 0, ob: 0 },
      regrouped: false,
      buildMissed: false,
      buildNote: null,
      buildPoints: 0,
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
        icon: "🧊",
        title: "Igloo Village",
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
      moved: { ta: 0, tb: 0, oa: 0, ob: 0 },
      regrouped: false,
      buildMissed: false,
      buildNote: null,
      buildPoints: 0,
      typedCorrect: null,
      results: [],
      score: 0,
    });
  },
}));
