import React, { useCallback, useRef, useState } from "react";

import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import { announceResult } from "../effects/announce.js";
import DialogueBox from "../dialogue/DialogueBox.jsx";

/**
 * DialogueEncounter — a short scripted conversation (encounters.js), shown in
 * the game's dialogue box (ui/dialogue/DialogueBox.jsx), one line at a time.
 *
 * On the last line, completing the dialogue marks the encounter done and
 * grants any one-time reward (so a chatty student can't farm XP by talking
 * repeatedly).
 */
export default function DialogueEncounter({ encounter }) {
  const { speaker, lines } = encounter.config;
  const closeEncounter = useSession((s) => s.closeEncounter);
  const completeEncounter = useProgress((s) => s.completeEncounter);
  const [line, setLine] = useState(0);
  const completedRef = useRef(false);
  const isLast = line + 1 >= lines.length;

  const finish = useCallback(() => {
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
  }, [completeEncounter, closeEncounter, encounter]);

  const next = useCallback(() => {
    if (isLast) finish();
    else setLine((l) => Math.min(l + 1, lines.length - 1));
  }, [isLast, finish, lines.length]);

  return (
    <DialogueBox
      speaker={speaker}
      lines={lines}
      index={line}
      onNext={next}
      onBack={() => setLine((l) => Math.max(0, l - 1))}
      onSkipToEnd={() => setLine(lines.length - 1)}
      onClose={closeEncounter}
      primaryLabel={isLast ? "Goodbye" : "Next"}
    />
  );
}
