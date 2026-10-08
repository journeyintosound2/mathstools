import { create } from "zustand";

import { useProgress } from "../../progress/store.js";
import { useUI } from "../../ui/effects/uiStore.js";
import { getMagmaChallenge } from "../../data/magma/magmaChallenges.js";
import {
  MAGMA_ROUNDS_PER_SET, MAGMA_POINTS_PER_ROUND, readMagmaBest, writeMagmaBest,
} from "../../data/magma/magmaRecords.js";

/**
 * MAGMA STORE FACTORY — every Magma Multiples challenge shares one set
 * lifecycle (the farm/snow pattern), so it lives here once:
 *
 *   idle → intro → play → (celebrate | feedback) → play … → done
 *
 *   intro      the 2-step "how to play" card
 *   play       the round is live; the challenge's own `phase` field says
 *              which step of the round the student is on
 *   celebrate  a full-marks round — auto-advances (the panel's timer)
 *   feedback   anything less — the worked solution, then Next
 *   done       set finished: best saved (local-only), XP + coins awarded
 *
 * Shared state: rounds, roundIndex, score, roundPoints (this round so far,
 * capped at 25 by construction), note ({ text, tone, at } — the live
 * one-line verdict under the controls), bestScore, results.
 *
 * Each challenge adds:
 *   generate()      → the 15 rounds (pure, from its data/magma logic file)
 *   fresh(round)    → the per-round state reset at the start of each round
 *   actions(set, get, api) → its own verbs (built on api.award / api.say /
 *                    api.endRound so scoring stays in one place)
 *   onEnter         (optional, inside actions) — what Enter does mid-round
 */
export function createMagmaStore({ key, generate, fresh, actions }) {
  const meta = getMagmaChallenge(key);

  return create((set, get) => {
    const api = {
      /** Bank points for this round (the round never exceeds 25). */
      award(points) {
        const p = Math.max(0, Math.min(points, MAGMA_POINTS_PER_ROUND - get().roundPoints));
        if (p > 0) set((s) => ({ score: s.score + p, roundPoints: s.roundPoints + p }));
        return p;
      },
      /** Live one-line verdict: tone "good" | "warm" | "bad". */
      say(text, tone = "warm") {
        set({ note: { text, tone, at: Date.now() } });
      },
      /** Finish the round: full marks → celebrate, otherwise feedback. */
      endRound(extra = {}) {
        const full = get().roundPoints >= MAGMA_POINTS_PER_ROUND;
        set({ status: full ? "celebrate" : "feedback", ...extra });
      },
    };

    const reset = (round) => ({
      roundPoints: 0,
      note: null,
      ...fresh(round),
    });

    return {
      key,
      status: "idle",
      rounds: [],
      roundIndex: 0,
      score: 0,
      roundPoints: 0,
      note: null,
      results: [],
      bestScore: readMagmaBest(key),
      ...fresh(null),

      currentRound() {
        const { rounds, roundIndex } = get();
        return rounds[roundIndex] || null;
      },

      start() {
        const rounds = generate();
        set({
          status: "intro",
          rounds,
          roundIndex: 0,
          score: 0,
          results: [],
          bestScore: readMagmaBest(key),
          ...reset(rounds[0]),
        });
      },

      beginRounds() {
        if (get().status !== "intro") return;
        set({ status: "play" });
      },

      next() {
        const { status, roundIndex, score, roundPoints, rounds } = get();
        if (status !== "feedback" && status !== "celebrate") return;
        const results = [...get().results, { round: rounds[roundIndex], points: roundPoints }];
        if (roundIndex + 1 < MAGMA_ROUNDS_PER_SET && roundIndex + 1 < rounds.length) {
          set({ status: "play", roundIndex: roundIndex + 1, results, ...reset(rounds[roundIndex + 1]) });
          return;
        }
        writeMagmaBest(key, score);
        if (score > 0) {
          const coins = Math.floor(score / 5);
          useProgress.getState().awardRewards({ xp: score, coins });
          useUI.getState().pushToast({
            type: "reward",
            icon: meta?.icon || "🌋",
            title: meta?.name || "Magma Multiples",
            message: `${score} points — +${score} XP, +${coins} coins!`,
          });
        }
        set({ status: "done", results, bestScore: Math.max(readMagmaBest(key), score) });
      },

      exit() {
        set({ status: "idle", rounds: [], roundIndex: 0, score: 0, results: [], ...reset(null) });
      },

      ...actions(set, get, api),
    };
  });
}
