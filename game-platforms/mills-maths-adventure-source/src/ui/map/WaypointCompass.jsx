import React, { useEffect, useRef } from "react";

import { useUI } from "../effects/uiStore.js";
import { useSession, playerState } from "../../game/sessionStore.js";
import { useFarmChallengeActive } from "../../game/farmChallengeActive.js";
import { compassAngle, targetDistance } from "../../data/taskCompass.js";
import { hasRegionMap } from "../../data/maps/regionMaps.js";

/**
 * The waypoint chip (2026-10-10): once a place is picked on the world map, an
 * arrow at the top of the screen points to it with the distance; 🗺 reopens
 * the map, ✕ clears it. Arriving clears it with a "You made it!" toast;
 * leaving the world clears it too. Hidden while a challenge has the screen.
 */
export default function WaypointCompass() {
  const wp = useUI((s) => s.waypoint);
  const regionId = useSession((s) => s.currentRegionId);
  const busy = useFarmChallengeActive();
  const arrowRef = useRef(null);
  const distRef = useRef(null);

  // A waypoint belongs to one world.
  useEffect(() => {
    if (wp && wp.regionId !== regionId) useUI.getState().clearWaypoint();
  }, [wp, regionId]);

  const live = wp && wp.regionId === regionId && !busy;
  useEffect(() => {
    if (!live) return undefined;
    let raf;
    const tick = () => {
      const w = useUI.getState().waypoint;
      if (!w) return;
      const d = targetDistance(playerState.x, playerState.z, w.x, w.z);
      if (d <= (w.arrive || 4)) {
        useUI.getState().clearWaypoint();
        useUI.getState().pushToast({ type: "reward", icon: "📍", title: "You made it!", message: w.label === "Marked spot" ? "You reached your waypoint." : `You've reached ${w.label}.` });
        return;
      }
      const ang = compassAngle(playerState.x, playerState.z, playerState.camYaw || 0, w.x, w.z);
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${ang}rad)`;
      if (distRef.current) distRef.current.textContent = `${Math.round(d)} m`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, wp]);

  if (!live) return null;
  return (
    <div className="hud-compass hud-wp">
      <div className="hud-compass-arrow" ref={arrowRef} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="46" height="46">
          <path d="M12 2 L20 20 L12 15.5 L4 20 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="hud-compass-text">
        <div className="hud-compass-label">{wp.icon || "📍"} {wp.label}</div>
        <div className="hud-compass-dist" ref={distRef}></div>
      </div>
      {hasRegionMap(regionId) && (
        <button className="hud-wp-btn" onClick={(e) => { e.currentTarget.blur(); useUI.getState().openMap(); }} title="Open the map (M)" aria-label="Open the map">🗺️</button>
      )}
      <button className="hud-wp-btn" onClick={(e) => { e.currentTarget.blur(); useUI.getState().clearWaypoint(); }} title="Clear the waypoint" aria-label="Clear the waypoint">✕</button>
    </div>
  );
}
