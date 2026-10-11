import React, { useEffect, useState } from "react";
import { touchWords } from "../keyHints.js";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";

/**
 * DynamicDialogue (Phase 2I) — a progress-aware conversation whose lines are
 * computed at the moment of talking (Sage and the topic NPCs). Unlike the
 * static DialogueEncounter it grants NO reward and records NO completion, so it
 * is freely repeatable ("remind me what to do").
 *
 * It reads session.dynamicDialogue ({ speaker, lines, action? }). On the last
 * line, if an `action` is present, a button starts that mission (the ONLY way
 * NPC missions begin — by talking to the NPC). Otherwise it just says goodbye.
 */
export default function DynamicDialogue() {
  const dlg = useSession((s) => s.dynamicDialogue);
  const closeEncounter = useSession((s) => s.closeEncounter);
  const openEncounter = useSession((s) => s.openEncounter);
  const startGame = useSession((s) => s.startGame);
  const phase = useSession((s) => s.phase);
  const activateMission = useProgress((s) => s.activateMission);

  const [line, setLine] = useState(0);

  const lines = dlg?.lines || [];
  const action = dlg?.action || null;
  const isLast = line + 1 >= lines.length;

  function beginMission() {
    if (action) {
      // Activate only if it's not already the active mission — re-activating
      // would reset progress, so an assigned mission RESUMES instead of restarts.
      if (useProgress.getState().activeMissionId !== action.missionId) {
        activateMission(action.missionId);
      }
      if (phase !== "playing") startGame();
      openEncounter("mission-active"); // replaces this dialogue with the runner
    } else {
      closeEncounter();
    }
  }

  function advance() {
    if (isLast) beginMission();
    else setLine((l) => l + 1);
  }

  // Enter advances / confirms.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, lines.length, action]);

  if (!dlg) return null;
  const primaryLabel = isLast ? (action ? action.label : "Goodbye") : "Next →";

  return (
    <div className="modal-card">
      <button className="modal-close" onClick={closeEncounter} title="Close" aria-label="Close">✕</button>
      <div className="modal-header">
        <span className="modal-npc" style={{ color: "#2d6a4f" }}>{dlg.speaker}</span>
        <span className="modal-progress">{line + 1} / {lines.length}</span>
      </div>

      <p className="dialogue-line">“{touchWords(lines[line])}”</p>

      <div className="modal-actions">
        <button className="primary-button" onClick={advance}>{primaryLabel}</button>
        {isLast && action && (
          <button className="link-button" onClick={closeEncounter}>Maybe later</button>
        )}
        {!isLast && (
          <button className="link-button" onClick={beginMission}>Skip</button>
        )}
      </div>
    </div>
  );
}
