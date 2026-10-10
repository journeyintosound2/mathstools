import { useProgress } from "../progress/store.js";

/**
 * ROUND OUTCOMES — one rule for every in-world challenge (farm, snow, magma,
 * jungle; Jeff, 2026-10-10):
 *
 *   • the round's FINAL answer is right  → celebrate (confetti), even if
 *     something slipped earlier in the round. When points were lost on the
 *     way, the card says so ("a slip along the way") and shows the XP the
 *     round still earned, then waits for Next so it can be read.
 *   • the final answer is wrong          → feedback (shake + the quick way).
 *
 * XP is banked AS POINTS LAND (1 point = 1 XP, the rate every challenge
 * already used at the end of a set), so each round's XP is real the moment
 * the card shows it, and quitting a set part-way keeps what was earned. The
 * end of a set now pays only its coins.
 *
 * Every challenge store is tracked here (farmChallengeActive.js registers
 * them all once). A store only needs the shared fields every challenge
 * already has: status, roundIndex, score.
 */

const marks = new WeakMap(); // store → { roundIndex, startScore }

export function trackChallengeStore(store, { xpPerPoint = 1 } = {}) {
  if (!store || marks.has(store)) return;
  const s0 = store.getState();
  marks.set(store, { roundIndex: s0.roundIndex ?? 0, startScore: s0.score ?? 0 });
  store.subscribe((s, prev) => {
    const m = marks.get(store);
    const score = s.score ?? 0;
    const before = prev.score ?? 0;
    // A new set (status back to idle/intro, or the score reset) or a new
    // round: remember the score this round started from.
    if (s.status === "idle" || s.status === "intro" || score < before) {
      m.roundIndex = s.roundIndex ?? 0;
      m.startScore = score;
    } else if ((s.roundIndex ?? 0) !== m.roundIndex) {
      m.roundIndex = s.roundIndex ?? 0;
      m.startScore = before; // the total carried into the new round
    }
    // Bank the XP for points as they land.
    const gained = score - before;
    if (gained > 0 && s.status !== "idle") useProgress.getState().awardRewards({ xp: gained * xpPerPoint });
  });
}

export function trackChallengeStores(stores, options = new Map()) {
  for (const s of stores) trackChallengeStore(s, options.get(s));
}

/** Points earned so far THIS round (non-reactive; state = store.getState()). */
export function roundPointsOf(store, state = store.getState()) {
  const m = marks.get(store);
  return Math.max(0, (state.score ?? 0) - (m ? m.startScore : 0));
}

/** A celebrated round that still lost points on the way. */
export function roundSlipped(store, max = 25, state = store.getState()) {
  return state.status === "celebrate" && roundPointsOf(store, state) < max;
}

/** REACTIVE: { points, slipped } for the current round's result card. */
export function useRoundOutcome(useStore, max = 25) {
  const score = useStore((s) => s.score ?? 0);
  const status = useStore((s) => s.status);
  useStore((s) => s.roundIndex);
  const points = roundPointsOf(useStore, { score });
  return { points, slipped: status === "celebrate" && points < max, max };
}

/** Is this store on the round-outcome rule? (the checks ask) */
export function isTrackedStore(store) {
  return marks.has(store);
}
