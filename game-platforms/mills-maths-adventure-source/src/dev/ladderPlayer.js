/**
 * THE PERFECT LADDER PLAYER (dev only) — plays any Emerald Jungle round
 * through its REAL store using only the public verbs, following the
 * round's own plan (`r.solve`, from data/jungle/roundKit.js planRound).
 * Shared by the jungle challenge checks and the round-outcome checks.
 */
import { onSide, other, fmtVal, vineOn } from "../data/jungle/vineLadder.js";
import { driveAt } from "../game/jungle/ladderStore.js";

/** Hang one planned rung: select its source rung(s), make the move, type the partner. */
export function stepLadder(S, step, r) {
  const get = S.getState;
  const li = step.li;
  if (get().active !== li) get().setActive(li);
  const d = driveAt(r, get().phase, li);
  const rungs = get().ladders[li].rungs;
  const want = [rungs.findIndex((x) => onSide(x, d) === step.a)];
  if (step.b !== undefined) want.push(rungs.findIndex((x) => onSide(x, d) === step.b));
  for (const i of [...get().sel]) get().select(li, i);
  for (const i of want) get().select(li, i);
  get().choose(step.op);
  if (step.n) get().pickN(step.n);
  const p = get().pending;
  if (!p) return false;
  const pv = vineOn(r.ladders[li].L, other(d));
  return get().submit(fmtVal(pv, p.partner)) === "correct";
}

/** Play the current phase of a round from its plan. */
export function playPhase(S, r, skipBuilt = false) {
  const get = S.getState;
  const i = get().phase;
  const ph = r.phases[i];
  const plan = r.solve[i];
  for (const st of plan.steps) {
    if (get().status !== "play" || get().phase !== i) break;
    if (skipBuilt) {
      const d = driveAt(r, i, st.li);
      if (get().ladders[st.li].rungs.some((x) => onSide(x, d) === st.v)) continue;
    }
    stepLadder(S, st, r);
  }
  if (get().status !== "play" || get().phase !== i) return;
  if (ph.type === "smallest") get().claim();
  else if (ph.type === "call") get().call(plan.call);
  else if (ph.type === "type") get().submit(fmtVal(ph.vine, ph.answer));
}

/** Play a whole round perfectly (every phase). */
export function playRound(S, r, skipBuilt = false) {
  const get = S.getState;
  for (let guard = 0; guard < 12; guard++) {
    if (get().status !== "play") return;
    playPhase(S, r, skipBuilt);
  }
}
