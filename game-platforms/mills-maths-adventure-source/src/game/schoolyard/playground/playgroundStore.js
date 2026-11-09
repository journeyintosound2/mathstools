/**
 * PLAYGROUND CHALLENGE STATE (2026-11-10).
 *
 * The Retrieval Practice Playground's 16 characters (and the boss) all open ONE
 * modal: `PlaygroundVeil`. This store carries its live state — which challenge
 * the student is in, the 20 generated questions, where they are, how it has
 * gone and (when it's over) the medal.
 *
 * Only the FIRST check of each question scores. A nudge (unreadable input, right
 * value in the wrong form) never uses the attempt. Jeff's bronze / silver / gold
 * thresholds are 10 / 15 / 19 out of 20.
 */
import { create } from "zustand";
import C from "../../../data/schoolyard/challenges/questionCore.js";
import { dealRound } from "../../../data/schoolyard/challenges/banks/_adapt.js";
import { savePlaygroundBest, readPlaygroundBest } from "./playgroundProgress.js";

/** Bronze / silver / gold thresholds (Jeff, 2026-11-09). */
export const MEDAL = { bronze: 10, silver: 15, gold: 19 };

export function medalFor(score, total = 20) {
  // Thresholds are out of 20; a longer round (the 60-question exam) is scaled:
  // bronze 30/60, silver 45/60, gold 57/60.
  const r = total ? (score * 20) / total : 0;
  if (r >= MEDAL.gold - 1e-9) return "gold";
  if (r >= MEDAL.silver - 1e-9) return "silver";
  if (r >= MEDAL.bronze - 1e-9) return "bronze";
  return null;
}

/** Icon for a medal, used in the done card and the trophy grid. */
export const medalIcon = (m) => (m === "gold" ? "🥇" : m === "silver" ? "🥈" : m === "bronze" ? "🥉" : "");

export const usePlayground = create((set, get) => ({
  active: null,
  questions: [],
  index: 0,
  attempts: [],
  phase: "idle",
  leaveOpen: false,
  previousBest: null,

  /**
   * Start a challenge. `def` carries:
   *   { id, bankId, name, color, outcome, host, areaId, flavor, roundSize? }
   * roundSize defaults to 20; the boss passes 60.
   */
  open(def) {
    const roundSize = def.roundSize || 20;
    const questions = def.questions || dealRound(def.bankId, roundSize);
    set({
      active: def,
      questions,
      index: 0,
      attempts: questions.map(() => ({ used: false, ok: false, nudge: null, input: null })),
      phase: "intro",
      leaveOpen: false,
      previousBest: readPlaygroundBest(def.id),
    });
  },

  /** Student pressed Begin on the intro card. */
  begin() {
    if (get().phase !== "intro") return;
    set({ phase: "question" });
  },

  /** Student checks their answer. Returns { ok, nudge }. */
  check(input) {
    const { phase, questions, index, attempts } = get();
    if (phase !== "question") return { ok: false };
    const q = questions[index];
    const r = C.check(q, input);
    const next = attempts.slice();
    if (r.nudge) {
      next[index] = { ...next[index], nudge: r.nudge, input };
    } else {
      const ok = Boolean(r.ok);
      next[index] = { used: true, ok, nudge: null, input, swapped: Boolean(r.swapped) };
    }
    set({ attempts: next, phase: r.nudge ? "question" : "settled" });
    return r.nudge ? { nudge: r.nudge } : { ok: Boolean(r.ok) };
  },

  /** Skip advances the index; the question goes down as wrong. */
  skip() {
    const { phase, questions, index, attempts } = get();
    if (phase !== "question" && phase !== "settled") return;
    if (phase === "question") {
      const next = attempts.slice();
      next[index] = { used: true, ok: false, nudge: null, input: null, skipped: true };
      set({ attempts: next });
    }
    get().advance();
  },

  /** Next question (or finish if we're on the last). */
  advance() {
    const { questions, index } = get();
    if (index + 1 >= questions.length) {
      get().finish();
      return;
    }
    set({ index: index + 1, phase: "question" });
  },

  /** End of round: compute medal, save best, award key if bronze+. */
  finish() {
    const { active, attempts, questions, previousBest } = get();
    const score = attempts.filter((a) => a.ok).length;
    const medal = medalFor(score, questions.length);
    const earned = savePlaygroundBest(active.id, { score, total: questions.length, medal, when: Date.now() }, previousBest);
    set({ phase: "done", result: { score, total: questions.length, medal, earned, previousBest } });
    // Bridge: a bronze+ medal marks the NPC's `warmup-<npcId>` mission
    // complete, so the existing schoolyard key/hall/trophy logic unlocks.
    // Lazy import keeps this file free of a top-level progress-store dep
    // (handy for the Node harness).
    if (medal) {
      const npcId = active.npcId || null;
      const missionId = `warmup-${npcId || active.id}`;
      try {
        import("../../../progress/store.js").then((m) => {
          m.useProgress?.getState?.().markMissionComplete?.(missionId);
        }).catch(() => { /* harness or SSR — ignore */ });
      } catch { /* ignore */ }
    }
  },

  /** × or Esc — opens a confirm ("leave this challenge?"). */
  askLeave() { set({ leaveOpen: true }); },
  cancelLeave() { set({ leaveOpen: false }); },

  /** Close without saving the current round. The previous best stays. */
  leave() {
    set({ active: null, questions: [], index: 0, attempts: [], phase: "idle", leaveOpen: false });
  },
}));

/** Non-reactive peek, for tests + the camera. */
export const peek = () => usePlayground.getState();
