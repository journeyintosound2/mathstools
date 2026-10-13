import React from "react";

import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useJourney, guideToGoal, currentCoach } from "../../game/journeyStore.js";
import { useProgress } from "../../progress/store.js";
import { journeyWorld } from "../../data/journey.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * THE JOURNEY TRACKER (2026-10-13) — the one next goal, always on screen:
 * the island warm-ups (Pip ✓ Fern ✓ Alby), "Snowball Sums is open — go
 * through the igloo gate", or "❄️ 4 / 7 trophies → opens 🌋 Magma
 * Multiples". 📍 sets a waypoint to whatever the goal needs next; the card
 * itself opens the Quest Log's journey page.
 *
 * Desktop / tablet: a small card under the stats. Phones: `JourneyMini`, a
 * short segment inside the stats pill.
 */
function useGoal() {
  const js = useJourney((s) => s.js);
  const regionId = useSession((s) => s.currentRegionId);
  const journey = useProgress((s) => s.journey);
  if (!js) return null;
  // The coach (training / a world's tour) owns that corner while it runs.
  if (currentCoach({ journey }, regionId)) return null;
  return { js, g: js.goal, regionId };
}

export default function JourneyTracker() {
  const st = useGoal();
  if (!st) return null;
  const { js, g, regionId } = st;
  const openLog = () => useUI.getState().setQuestLog(true);
  const nextWorld = g.nextKey ? journeyWorld(g.nextKey) : null;
  const canGuide = g.kind !== "free";
  const guideLabel = g.kind === "friends" && g.friendId ? `Find ${js.friends.find((f) => f.id === g.friendId).name}` : "Show me the way";

  return (
    <div className={`jtrack k-${g.kind}`}>
      <button className="jtrack-body" onClick={(e) => { e.currentTarget.blur(); openLog(); }} title="Your journey (Quest Log)">
        <span className="jtrack-kicker">🧭 <Bi>Your journey</Bi></span>
        <span className="jtrack-title"><span aria-hidden="true">{g.icon}</span> <Bi>{g.title}</Bi></span>
        {g.kind === "friends" && (
          <span className="jtrack-friends">
            {js.friends.map((f) => (
              <span key={f.id} className={f.done ? "done" : f.id === g.friendId ? "next" : ""} title={`${f.name}${f.done ? " ✓" : ""}`}>
                {f.icon}{f.done && <i>✓</i>}
              </span>
            ))}
            <b>{g.have} / {g.need}</b>
          </span>
        )}
        {(g.kind === "trophies" || g.kind === "keys") && (
          <span className="jtrack-progress">
            <span className="jtrack-bar"><span style={{ width: `${Math.round((g.have / g.need) * 100)}%` }} /></span>
            <b>{g.have} / {g.need}</b>
          </span>
        )}
        {g.kind === "travel" && <span className="jtrack-text"><Bi>{g.text}</Bi></span>}
        {g.kind === "free" && <span className="jtrack-text"><Bi>{g.text}</Bi></span>}
        {g.kind === "friends" && <span className="jtrack-sub"><Bi>{g.reward}</Bi></span>}
        {g.kind === "trophies" && nextWorld && (
          <span className="jtrack-sub">🥉+ · <Bi>Opens</Bi> {nextWorld.icon} {nextWorld.short || nextWorld.name}</span>
        )}
        {g.kind === "keys" && <span className="jtrack-sub">🏆 <Bi>Then the Head Teacher</Bi></span>}
      </button>
      {canGuide && regionId !== "cabin" && (
        <button
          className="jtrack-guide"
          onClick={(e) => { e.currentTarget.blur(); guideToGoal(); }}
          title={guideLabel}
          aria-label={guideLabel}
        >📍</button>
      )}
    </div>
  );
}

/** Phones: the goal as a short segment inside the stats pill. */
export function JourneyMini() {
  const st = useGoal();
  if (!st) return null;
  const { g } = st;
  const text = g.kind === "friends" || g.kind === "trophies" || g.kind === "keys" ? `${g.have}/${g.need}` : g.kind === "travel" ? "!" : "";
  return (
    <button
      className={`jmini k-${g.kind}`}
      onClick={(e) => { e.stopPropagation(); e.currentTarget.blur(); useUI.getState().setQuestLog(true); }}
      aria-label={`Your journey: ${g.title}${text ? ` ${text}` : ""}`}
    >
      <span aria-hidden="true">{g.kind === "keys" ? "🔑" : g.icon}</span>{text && <b>{text}</b>}
    </button>
  );
}
