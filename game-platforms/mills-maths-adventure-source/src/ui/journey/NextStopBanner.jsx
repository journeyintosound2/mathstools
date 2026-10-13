import React, { useEffect, useRef } from "react";

import { useSession, playerState } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useProgress } from "../../progress/store.js";
import { useFarmChallengeActive } from "../../game/farmChallengeActive.js";
import { useJourney, currentCoach, gateWaypoint, homeGateWaypoint, guideToGoal } from "../../game/journeyStore.js";
import { useWipeout } from "../../game/hazardRescue.js";
import { journeyWorld } from "../../data/journey.js";
import { compassAngle, targetDistance } from "../../data/taskCompass.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * "NEXT STOP" (2026-10-13, Jeff: "when Pip, Fern, Alby are complete, the
 * notification is just a small thing in the top left corner … a much more
 * obvious/better solution so the students know what to do next").
 *
 * While a world is OPEN but not yet visited (the journey's "travel" goal) a
 * big banner sits at the top of the screen in that world's colour —
 *
 *     NEXT STOP                                         ↗
 *     ❄️  Snowball Sums is open!                       86 m
 *         Go through the igloo gate — Igloo Hollow, under Frosty Peak.
 *
 * — with a live arrow + distance to the gate (or, off the island, to the
 * gate home first). The first time it shows on the island it also drops a
 * waypoint on the gate (the tall golden beam you can see over the trees),
 * and the gate's own sign says "NEW!". Tap / click it to point the way
 * again. It goes the moment you step through.
 */
const guided = new Set(); // worlds the banner has already dropped a waypoint for (this session)

export function useNextStop() {
  const js = useJourney((s) => s.js);
  const journey = useProgress((s) => s.journey);
  const regionId = useSession((s) => s.currentRegionId);
  const phase = useSession((s) => s.phase);
  const enc = useSession((s) => s.activeEncounterId);
  const celebrate = useJourney((s) => s.celebrate);
  const busy = useFarmChallengeActive();
  const overlay = useUI((s) => s.mapOpen || Boolean(s.wallView) || s.questLogOpen || s.resultsOpen || s.howToOpen ||
    s.pilotOpen || s.cloudLoginOpen || s.trophyOpen || s.farmTrophyOpen || s.snowTrophyOpen || s.magmaTrophyOpen || s.jungleTrophyOpen);
  const wiping = useWipeout((s) => Boolean(s.active));
  if (!js || !js.goal || js.goal.kind !== "travel") return null;
  if (phase !== "playing" || enc || celebrate || busy || overlay || wiping) return null;
  if (currentCoach({ journey }, regionId)) return null;
  const w = journeyWorld(js.goal.worldKey);
  if (!w) return null;
  return { w, goal: js.goal, regionId };
}

export default function NextStopBanner({ compact = false }) {
  const st = useNextStop();
  const arrowRef = useRef(null);
  const distRef = useRef(null);
  const onIsland = st && st.regionId === "island-1";
  const target = st ? (onIsland ? gateWaypoint(st.w.key) : homeGateWaypoint(st.regionId)) : null;
  const tx = target ? target.x : null;
  const tz = target ? target.z : null;

  // The first time on the island: put the golden beam on the gate.
  useEffect(() => {
    if (!st || !onIsland || guided.has(st.w.key)) return;
    guided.add(st.w.key);
    const ui = useUI.getState();
    if (!ui.waypoint) { const wp = gateWaypoint(st.w.key); if (wp) ui.setWaypoint(wp); }
  }, [st && st.w.key, onIsland]); // eslint-disable-line react-hooks/exhaustive-deps

  // The live arrow + distance.
  useEffect(() => {
    if (tx === null) return undefined;
    let raf;
    const tick = () => {
      const ang = compassAngle(playerState.x, playerState.z, playerState.camYaw || 0, tx, tz);
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${ang}rad)`;
      if (distRef.current) distRef.current.textContent = `${Math.max(0, Math.round(targetDistance(playerState.x, playerState.z, tx, tz)))} m`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tx, tz]);

  if (!st) return null;
  const { w } = st;
  const title = `${w.short ? "The Playground" : w.name} is open!`;
  const line = onIsland
    ? `Go through ${w.gate} — ${w.where}.`
    : "Head back to Number Island first — through the gate home.";
  return (
    <button
      type="button"
      className={`nextstop${compact ? " is-compact" : ""}`}
      style={{ "--world": w.color }}
      onClick={(e) => { e.currentTarget.blur(); guideToGoal(); }}
      onMouseDown={(e) => e.preventDefault()}
      aria-label={`Next stop: ${title} ${line}`}
    >
      <span className="nextstop-icon" aria-hidden="true">
        <span className="nextstop-ring" />
        <span className="nextstop-emoji">{w.icon}</span>
      </span>
      <span className="nextstop-text">
        <span className="nextstop-kicker"><Bi block={false}>Next stop</Bi></span>
        <span className="nextstop-title"><Bi block={false}>{title}</Bi></span>
        {!compact && <span className="nextstop-line"><Bi block={false}>{line}</Bi></span>}
      </span>
      {target && (
        <span className="nextstop-dial" aria-hidden="true">
          <span className="nextstop-arrow" ref={arrowRef}>
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2 L20 20 L12 15.5 L4 20 Z" fill="currentColor" /></svg>
          </span>
          <span className="nextstop-dist" ref={distRef} />
        </span>
      )}
    </button>
  );
}
