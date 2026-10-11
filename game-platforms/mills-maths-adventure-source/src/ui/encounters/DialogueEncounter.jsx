import React, { useEffect, useRef, useState } from "react";
import { touchWords } from "../keyHints.js";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import { announceResult } from "../effects/announce.js";

/**
 * DialogueEncounter — shows a short conversation, one line at a time.
 *
 * On the last line, completing the dialogue marks the encounter done and
 * grants any one-time reward (so a chatty student can't farm XP by talking
 * repeatedly). Enter advances the conversation.
 */
export default function DialogueEncounter({ encounter }) {
  const { speaker, lines } = encounter.config;

  const closeEncounter = useSession((s) => s.closeEncounter);
  const completeEncounter = useProgress((s) => s.completeEncounter);

  const [line, setLine] = useState(0);
  const completedRef = useRef(false);
  const isLast = line + 1 >= lines.length;

  function finish() {
    if (!completedRef.current) {
      completedRef.current = true;
      // oneTime so the small reward is granted only on the first conversation.
      const result = completeEncounter({
        encounterId: encounter.id,
        xp: encounter.rewards?.xp || 0,
        coins: encounter.rewards?.coins || 0,
        oneTime: true,
      });
      announceResult(result); // celebrate any quest/level reached by talking
    }
    closeEncounter();
  }

  function advance() {
    if (isLast) finish();
    else setLine((l) => l + 1);
  }

  // Enter advances the dialogue.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      advance();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  return (
    <div className="modal-card">
      <button className="modal-close" onClick={closeEncounter} title="Close" aria-label="Close">✕</button>
      <div className="modal-header">
        <span className="modal-npc" style={{ color: "#2d6a4f" }}>
          {speaker}
        </span>
        <span className="modal-progress">
          {line + 1} / {lines.length}
        </span>
      </div>

      <p className="dialogue-line">“{touchWords(lines[line])}”</p>

      <div className="modal-actions">
        <button className="primary-button" onClick={advance}>
          {isLast ? "Goodbye" : "Next →"}
        </button>
        <button className="link-button" onClick={finish}>
          Skip
        </button>
      </div>
    </div>
  );
}
