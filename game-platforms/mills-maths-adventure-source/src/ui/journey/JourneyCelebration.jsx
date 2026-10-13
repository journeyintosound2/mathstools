import React, { useEffect, useMemo } from "react";

import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useFarmChallengeActive } from "../../game/farmChallengeActive.js";
import { useJourney } from "../../game/journeyStore.js";
import { journeyWorld, JOURNEY_WORLDS, TROPHIES_TO_OPEN } from "../../data/journey.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * "THE GATE IS OPEN!" (the journey, 2026-10-13) — the big moment when a
 * world opens: passing the third island warm-up opens the igloo gate; the
 * 7th trophy in a world opens the next one. It waits until the challenge /
 * conversation that earned it has closed, then offers to point the way
 * (a waypoint to the new gate — via the gate home when you're off the
 * island). Dismissing records it, so it never replays.
 */
export default function JourneyCelebration() {
  const key = useJourney((s) => s.celebrate);
  const phase = useSession((s) => s.phase);
  const enc = useSession((s) => s.activeEncounterId);
  const regionId = useSession((s) => s.currentRegionId);
  const busy = useFarmChallengeActive();
  const blocked = useUI((s) => s.mapOpen || Boolean(s.wallView) || s.farmTrophyOpen || s.snowTrophyOpen || s.magmaTrophyOpen || s.jungleTrophyOpen || s.trophyOpen);
  const show = Boolean(key) && phase === "playing" && !enc && !busy && !blocked;

  useEffect(() => {
    if (show) useUI.getState().playSound("levelUp");
  }, [show]);

  // Confetti pieces (CSS only) — a fixed scatter per celebration.
  const confetti = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100, delay: (i % 7) * 0.12, hue: [44, 199, 340, 140, 18, 270][i % 6], rot: (i * 53) % 360,
  })), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); useJourney.getState().dismissCelebration(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  if (!show) return null;
  const w = journeyWorld(key);
  if (!w) return null;
  const prev = JOURNEY_WORLDS[JOURNEY_WORLDS.indexOf(w) - 1] || null;
  const onIsland = regionId === "island-1";
  const J = useJourney.getState();

  return (
    <div className="jcard-overlay jcelebrate-overlay">
      <div className="jconfetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <i key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, background: `hsl(${c.hue} 90% 58%)`, transform: `rotate(${c.rot}deg)` }} />
        ))}
      </div>
      <div className="jcard-wrap">
      <div className="jcard jcelebrate" role="dialog" aria-modal="true" aria-label={`${w.name} is open`} style={{ "--world": w.color }}>
        <div className="jcelebrate-ribbon"><Bi>Gate open!</Bi></div>
        <div className="jcelebrate-icon" aria-hidden="true">
          <span className="jcelebrate-lock">🔓</span>
          <span className="jcelebrate-world">{w.icon}</span>
        </div>
        <h2 className="jcard-title">{w.short ? "The Playground" : w.name} <Bi>is open!</Bi></h2>
        <div className="jcard-body">
          <p>
            {prev
              ? <>{TROPHIES_TO_OPEN} {prev.icon} {prev.name} trophies — brilliant! </>
              : <><Bi>You passed all three island warm-ups — brilliant!</Bi> </>}
            {w.gate[0].toUpperCase() + w.gate.slice(1)} is open now — you'll find it at {w.where}.
          </p>
          <p className="jcelebrate-topic">{w.icon} {w.topic}</p>
        </div>
        <div className="jcard-actions">
          <button className="jbtn jbtn-go" autoFocus onClick={() => J.dismissCelebration(true)}>
            📍 {onIsland ? <Bi>Show me the way</Bi> : <Bi>Show me the way home</Bi>}
          </button>
          <button className="jbtn jbtn-quiet" onClick={() => J.dismissCelebration(false)}><Bi>Later</Bi></button>
        </div>
      </div>
      </div>
    </div>
  );
}
