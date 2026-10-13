import React from "react";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useJourney, guideToGoal } from "../../game/journeyStore.js";
import { TROPHIES_TO_OPEN } from "../../data/journey.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * "YOUR JOURNEY" — the Quest Log's map of the whole progression (2026-10-13):
 * the training, the island warm-ups, then every world in order — open or
 * 🔒, its trophies against the 7 that open the next, and the one goal
 * that's live now (with 📍 to point the way). Replaces the old "Unlock
 * Number Island" main-quest list.
 */
export default function JourneyPanel() {
  const js = useJourney((s) => s.js);
  const j = useProgress((s) => s.journey) || {};
  const regionId = useSession((s) => s.currentRegionId);
  if (!js) return null;
  const g = js.goal;

  const replay = () => {
    useProgress.getState().updateJourney({ trainingDone: false, trainingSkipped: false, trainingStarted: true, step: 0 });
    useUI.getState().setQuestLog(false);
  };

  return (
    <div className="jpanel">
      <h3 className="questlog-subhead">🧭 <Bi>Your journey</Bi></h3>
      <ol className="jpath">
        <li className={`jstop ${js.trainingActive ? "now" : "done"}`}>
          <span className="jstop-icon" aria-hidden="true">🎓</span>
          <span className="jstop-text">
            <b><Bi>Training on Harbour Green</Bi></b>
            <small>{js.trainingDone ? "✓ Done" : `Step ${Math.min((j.step || 0) + 1, 8)} of 8`}</small>
          </span>
          {!js.trainingActive && regionId === "island-1" && (
            <button className="jstop-btn" onClick={replay}><Bi>Replay</Bi></button>
          )}
        </li>
        <li className={`jstop ${js.worlds[0].open ? "done" : "now"}`}>
          <span className="jstop-icon" aria-hidden="true">🏝️</span>
          <span className="jstop-text">
            <b><Bi>Island warm-ups</Bi></b>
            <small className="jstop-friends">
              {js.friends.map((f) => (
                <span key={f.id} className={f.done ? "done" : ""}>{f.done ? "✓" : f.icon} {f.name}</span>
              ))}
            </small>
          </span>
          <span className="jstop-count">{js.friendsDone}/{js.friendsNeed}</span>
        </li>
        {js.worlds.map((w) => {
          const isGoal = g.worldKey === w.key && (g.kind === "trophies" || g.kind === "keys" || g.kind === "travel");
          const cls = !w.open ? "locked" : w.complete ? "done" : isGoal ? "now" : "open";
          const r = w.requirement;
          return (
            <li key={w.key} className={`jstop ${cls}`} style={{ "--world": w.color }}>
              <span className="jstop-icon" aria-hidden="true">{w.open ? w.icon : "🔒"}</span>
              <span className="jstop-text">
                <b>{w.name}</b>
                <small>
                  {!w.open
                    ? (r.kind === "friends"
                      ? `Pass the three island warm-ups to open it (${r.have}/${r.need})`
                      : `Needs ${r.need} ${r.fromIcon} ${r.fromName} trophies (${r.have}/${r.need})`)
                    : w.trophies
                      ? `${w.medals} of ${w.total} trophies${w.complete ? " ✓" : ` — ${TROPHIES_TO_OPEN} open the next world`}`
                      : `${js.keys} of ${js.totalKeys} keys${js.bossDone ? " · Head Teacher beaten ✓" : ""}`}
                  {w.kept && !w.earned ? " · kept open" : ""}
                </small>
                {w.open && w.trophies && (
                  <span className="jstop-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, Math.round((w.medals / TROPHIES_TO_OPEN) * 100))}%` }} />
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {g.kind !== "free" && (
        <div className="jpanel-goal">
          <span><b><Bi>Next:</Bi></b> {g.text}</span>
          <button className="jbtn jbtn-go jbtn-sm" onClick={() => { guideToGoal(); useUI.getState().setQuestLog(false); }}>📍 <Bi>Show me</Bi></button>
        </div>
      )}
    </div>
  );
}
