import React from "react";

import { useJourney } from "../../game/journeyStore.js";
import { JOURNEY_WORLDS, TROPHIES_TO_OPEN } from "../../data/journey.js";
import { MedalKey } from "./JourneyCoach.jsx";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * The strip at the top of every world's trophy grid (2026-10-13): how the
 * medals work, and how many trophies open the next world — seven 🥉-or-
 * better slots that fill as you win them.
 */
export default function JourneyStrip({ worldKey }) {
  const js = useJourney((s) => s.js);
  const i = JOURNEY_WORLDS.findIndex((w) => w.key === worldKey);
  if (i < 0) return null;
  const next = JOURNEY_WORLDS[i + 1] || null;
  const ws = js ? js.worlds[i] : null;
  const nextOpen = js && next ? js.worlds[i + 1].open : false;
  const have = ws ? Math.min(ws.medals, TROPHIES_TO_OPEN) : 0;

  return (
    <div className={`jstrip${nextOpen ? " is-open" : ""}`}>
      <div className="jstrip-how">
        <b><Bi>How trophies work</Bi></b>
        <span><Bi>Your best score in a challenge wins its medal. Play again any time to upgrade it.</Bi></span>
        <MedalKey />
      </div>
      {next && (
        <div className="jstrip-goal">
          <div className="jstrip-goal-text">
            {nextOpen
              ? <>✓ {next.icon} <b>{next.short || next.name}</b> <Bi>is open!</Bi></>
              : <><Bi>Win</Bi> {TROPHIES_TO_OPEN} <Bi>trophies (bronze or better) to open</Bi> {next.icon} <b>{next.short || next.name}</b></>}
          </div>
          <div className="jstrip-slots" aria-label={`${have} of ${TROPHIES_TO_OPEN} trophies`}>
            {Array.from({ length: TROPHIES_TO_OPEN }, (_, k) => (
              <span key={k} className={k < have ? "on" : ""}>{k < have ? "🏆" : ""}</span>
            ))}
            <b>{have} / {TROPHIES_TO_OPEN}</b>
          </div>
        </div>
      )}
    </div>
  );
}
