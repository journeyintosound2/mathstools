import React, { useCallback, useState } from "react";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import DialogueBox from "../dialogue/DialogueBox.jsx";

/**
 * DynamicDialogue (Phase 2I) — a progress-aware conversation whose lines are
 * computed at the moment of talking (Mills and the topic NPCs). Unlike the
 * static DialogueEncounter it grants NO reward and records NO completion, so it
 * is freely repeatable ("remind me what to do").
 *
 * It reads session.dynamicDialogue ({ speaker, lines, action? }). On the last
 * line, if an `action` is present, a button starts that mission (the ONLY way
 * NPC missions begin — by talking to the NPC) beside "Maybe later". Shown in
 * the game's dialogue box (ui/dialogue/DialogueBox.jsx).
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

  const beginMission = useCallback(() => {
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
  }, [action, activateMission, phase, startGame, openEncounter, closeEncounter]);

  const next = useCallback(() => {
    if (isLast) beginMission();
    else setLine((l) => Math.min(l + 1, lines.length - 1));
  }, [isLast, beginMission, lines.length]);

  if (!dlg) return null;
  return (
    <DialogueBox
      speaker={dlg.speaker}
      lines={lines}
      index={Math.min(line, Math.max(0, lines.length - 1))}
      onNext={next}
      onBack={() => setLine((l) => Math.max(0, l - 1))}
      onSkipToEnd={() => setLine(lines.length - 1)}
      onClose={closeEncounter}
      primaryLabel={isLast ? (action ? action.label : "Goodbye") : "Next"}
      secondaryLabel={action ? "Maybe later" : null}
      onSecondary={closeEncounter}
    />
  );
}
