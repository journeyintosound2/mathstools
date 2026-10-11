/**
 * ROUND KIT — shared helpers for the jungle's round generators (pure).
 *
 * Every vine-ladder round is { ladders, drive, phases, moves, maxDrive, … }
 * (game/jungle/ladderStore.js runs it). `planRound` works out ONE way
 * through every phase — the headless checks play it through the real store,
 * and a feedback card can show it as "one way". It is never a score: the
 * student's own route is just as good (Jeff, 2026-10-10).
 */
import { fewestMoves, onSide, stepText, rungFor, vineChip } from "./vineLadder.js";

export const driveFor = (r, li, ph) => (ph && ph.drive) || (r.ladders[li] && r.ladders[li].drive) || r.drive || "top";

/**
 * One way through the round → r.solve = [{ steps, call?, type?, claim? }]
 * per phase (steps = [{ li, op, a, b?, n?, v }]), or null if a goal is out of
 * reach with the moves on offer. `commonAt` (optional) names the shared value
 * a common phase should meet at.
 */
export function planRound(r, depth = 5) {
  // Rungs hung so far, per ladder, as [top, bottom] (a phase may lead with
  // either vine).
  const rungs = r.ladders.map((l) => l.start.map((x) => [...x]));
  const moves = r.moves.filter((m) => m !== "across");
  const solve = [];
  for (const ph of r.phases) {
    const out = { steps: [] };
    const reach = (li, target) => {
      const d = driveFor(r, li, ph);
      const vals = rungs[li].map((x) => onSide(x, d));
      if (vals.includes(target)) return true;
      const L = r.ladders[li].L;
      const base = onSide(r.ladders[li].start[0], d);
      // fewestMoves treats startVals[0] as the "again" base: keep it first.
      const ordered = [base, ...vals.filter((v) => v !== base)];
      const res = fewestMoves(L, d, ordered, target, moves, r.maxDrive, depth);
      if (res.min > depth) return false;
      for (const s of res.path) {
        out.steps.push({ li, ...s });
        rungs[li].push(rungFor(L, d, s.v));
      }
      return true;
    };
    if (ph.type === "build") {
      // A goal must still need building when its phase begins.
      for (const g of ph.goals) {
        const d = driveFor(r, g.li, ph);
        if (rungs[g.li].some((x) => onSide(x, d) === g.target)) return null;
      }
      for (const g of ph.goals) if (!reach(g.li, g.target)) return null;
    } else if (ph.type === "common") {
      const at = ph.planAt;
      if (at === undefined) return null;
      for (const li of ph.ladders || [0, 1]) if (!reach(li, at)) return null;
    } else if (ph.type === "smallest") {
      if (!reach(ph.li || 0, ph.smallest[0])) return null;
      out.claim = true;
    } else if (ph.type === "call") {
      out.call = ph.correct;
    } else if (ph.type === "type") {
      out.type = ph.answer;
    }
    solve.push(out);
  }
  r.solve = solve;
  return r;
}

/** "One way" lines for a feedback card, from r.solve. */
export function solveLines(r, lead) {
  const lines = lead ? [lead] : [];
  r.solve.forEach((s, i) => {
    const ph = r.phases[i];
    for (const st of s.steps) {
      const name = r.ladders.length > 1 && r.ladders[st.li].name ? `${r.ladders[st.li].name}: ` : "";
      lines.push(name + stepText(r.ladders[st.li].L, driveFor(r, st.li, ph), st));
    }
    if (ph.type === "type" && ph.explain) lines.push(ph.explain);
    if (ph.type === "call" && ph.explain) lines.push(ph.explain);
  });
  return lines;
}

/** The goal rung [top, bottom] for a build goal. */
export function goalRung(r, g, ph) {
  return rungFor(r.ladders[g.li].L, driveFor(r, g.li, ph), g.target);
}

/** "7 🍋 ↔ $15.75" for a goal. */
export function goalChip(r, g, ph) {
  const L = r.ladders[g.li].L;
  const [t, b] = goalRung(r, g, ph);
  return `${vineChip(L.top, t)} ↔ ${vineChip(L.bottom, b)}`;
}

/** Retry a maker until it returns a round (the checks fuzz every generator). */
export function attempt(make, tries = 120, fallback) {
  for (let t = 0; t < tries; t++) {
    const r = make();
    if (r) return r;
  }
  return fallback ? fallback() : null;
}
