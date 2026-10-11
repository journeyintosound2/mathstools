import React from "react";

import VineLadder, { CompareLadder, useLadderScale, niceEnd, ladderEnd } from "./VineLadder.jsx";
import { driveAt } from "../ladderStore.js";
import { rungFor, onSide } from "../../../data/jungle/vineLadder.js";

/**
 * The vine ladder(s) of the running round, drawn the way the round lays
 * them out — shared by every jungle stage:
 *   single   one ladder (ladder 0)
 *   chain    one ladder at a time: the current LEG's (Pathfinder, the
 *            per-hour barrels, the map's scale step)
 *   shared   two ladders sharing their top vine: a three-vine ladder (A's
 *            vine above, the shared vine in the middle, B's below) — best
 *            buys, two racers, two pipes, part : part : whole potions
 * A stage reads `useLadderRound(store)` once and passes it in, so its own
 * scenery (stalls, racers, barrels…) reacts to the same state.
 */

export function useLadderRound(useStore) {
  const status = useStore((s) => s.status);
  const round = useStore((s) => s.currentRound());
  const ladders = useStore((s) => s.ladders);
  const active = useStore((s) => s.active);
  const sel = useStore((s) => s.sel);
  const pending = useStore((s) => s.pending);
  const wrong = useStore((s) => s.wrong);
  const hits = useStore((s) => s.hits);
  const common = useStore((s) => s.common);
  const called = useStore((s) => s.called);
  const calls = useStore((s) => s.calls);
  const phase = useStore((s) => s.phase);
  const trial = useStore((s) => s.trial);
  const last = useStore((s) => s.last);
  const typed = useStore((s) => s.typed);
  const running = Boolean(round && (status === "play" || status === "celebrate" || status === "feedback"));
  const ended = status === "celebrate" || status === "feedback";
  const ph = running ? round.phases[Math.min(phase, round.phases.length - 1)] : null;
  return { useStore, status, round, ladders, active, sel, pending, wrong, hits, common, called, calls, phase, ph, trial, last, typed, running, ended };
}

/** The ladder a chain round is showing now. */
export function chainLadder(S) {
  const { round, ph } = S;
  if (!ph) return 0;
  if (ph.show !== undefined) return ph.show;
  if (ph.type === "build" && ph.goals.length) return ph.goals[0].li;
  if (ph.ladders && ph.ladders.length) return ph.ladders[0];
  // A type/call phase in a chain: show the ladder of the leg it belongs to.
  const legPh = round.phases.find((p) => p.leg === ph.leg && p.type === "build");
  return legPh ? legPh.goals[0].li : 0;
}

/** Targets still to reach on ladder li (as [top, bottom]), this phase. */
export function goalsOn(S, li) {
  const { round, ph, phase } = S;
  if (!ph || ph.type !== "build") return [];
  const d = driveAt(round, phase, li);
  return ph.goals.filter((g) => g.li === li).map((g) => rungFor(round.ladders[li].L, d, g.target)).filter(Boolean);
}

/** The scale (top units at the right-hand end) a set of ladders needs. */
/** The ladders a round is drawing right now. */
export function shownLadders(S) {
  if (!S.running) return [0];
  const layout = S.round.layout || "single";
  if (layout === "shared") return [0, 1];
  if (layout === "chain") return [chainLadder(S)];
  if (layout === "graph") return S.round.ladders.map((_, i) => i);
  return [0];
}

export function useSetScale(S, lis, idleEnd = 12) {
  const { running, round, ladders, pending } = S;
  let endTop = niceEnd(idleEnd);
  if (running) {
    const tops = [];
    for (const li of lis) {
      if (ladders[li]) ladders[li].rungs.forEach((r) => tops.push(r[0]));
    }
    if (pending && lis.includes(pending.li)) tops.push(pending.rung[0]);
    const maxShown = Math.max(...tops, 0);
    const goalTops = lis.flatMap((li) => goalsOn(S, li).map((g) => g[0]));
    const goalTop = goalTops.length ? Math.max(...goalTops) : null;
    const startTop = Math.min(...lis.map((li) => round.ladders[li].start[0][0]));
    endTop = ladderEnd(maxShown, goalTop, startTop);
    if (round.endTop) endTop = Math.max(endTop, round.endTop);
  }
  const scaleRef = useLadderScale(endTop);
  return { endTop, scaleRef };
}

/**
 * Draw the round's ladder(s). `ys` = [top, bottom] for one ladder;
 * `ys3` = [A, shared, B] for a shared layout. `names(li)` → [top, bottom]
 * vine names; `sharedNames` → [A, shared, B].
 */
export default function LadderSet({
  S, ys = [2.75, 1.35], ys3 = [2.85, 2.0, 1.15], names, sharedNames, labels = true, idleL, idleNames, fruit = false, posts = true,
  nameStyle, startTicks = true, extra = null, extraShared = null, fruitKinds, scale = null, chipGap = 0.4, midGap = 0.28, nameAt = null,
  hideRungs = false,
}) {
  const { running, ended, round, ladders, active, sel, pending, wrong, hits, common, called, phase, useStore } = S;
  const layout = running ? round.layout || "single" : "single";
  const shared = layout === "shared";
  const li = layout === "chain" ? chainLadder(S) : 0;
  const lis = shared ? [0, 1] : [li];
  const own = useSetScale(S, lis, idleL ? idleL.a * 3 : 12);
  const { endTop, scaleRef } = scale || own;

  if (!running) {
    if (!idleL) return null;
    return <VineLadder L={idleL} ys={ys} rungs={[]} scaleRef={scaleRef} names={idleNames} idle labels={labels} posts={posts} nameStyle={nameStyle} chipGap={chipGap} nameAt={nameAt} />;
  }

  const tap = ended ? undefined : (l, i) => useStore.getState().select(l, i);
  if (shared) {
    const goals = [0, 1].flatMap((l) => goalsOn(S, l).map((g) => ({ li: l, t: g[0] })));
    return (
      <CompareLadder
        ladders={round.ladders.slice(0, 2).map((l, k) => ({ L: l.L, rungs: ladders[k] ? ladders[k].rungs : [] }))}
        ys={ys3}
        scaleRef={scaleRef}
        active={ended ? -1 : active}
        sel={ended ? [] : sel}
        pending={!ended ? pending : null}
        wrong={!ended ? wrong : null}
        common={common}
        called={called}
        better={round.better ?? null}
        endTop={endTop}
        labels={labels}
        names={sharedNames ? sharedNames(round) : null}
        onTap={tap}
        goals={goals}
        hits={hits}
        nameStyle={nameStyle}
        extra={extraShared}
        chipGap={chipGap}
        midGap={midGap}
        nameAt={nameAt}
        posts={posts}
      />
    );
  }
  const d = driveAt(round, phase, li);
  const L = round.ladders[li].L;
  return (
    <VineLadder
      key={`lad-${li}`}
      L={L}
      ys={ys}
      rungs={ladders[li] ? ladders[li].rungs : []}
      scaleRef={scaleRef}
      drive={d}
      sel={ended || active !== li ? [] : sel}
      active
      pending={!ended && pending && pending.li === li ? pending : null}
      wrong={!ended && wrong && wrong.li === li ? wrong : null}
      goals={goalsOn(S, li)}
      hitTops={hits.filter((h) => h.li === li).map((h) => h.t)}
      startTop={startTicks && round.ticks !== false ? onSide(round.ladders[li].start[0], "top") : null}
      fruit={fruit}
      fruitKinds={fruitKinds}
      onTap={tap ? (i) => tap(li, i) : undefined}
      names={names ? names(round, li) : null}
      labels={labels}
      idle={hideRungs}
      endTop={endTop}
      posts={posts}
      nameStyle={nameStyle}
      extra={extra}
      chipGap={chipGap}
      nameAt={nameAt}
    />
  );
}

export { useLadderScale, niceEnd };
