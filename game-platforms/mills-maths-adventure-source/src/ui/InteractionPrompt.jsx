import React, { useState } from "react";

import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import { getInteractable } from "../data/interactables.js";
import { useFarmChallengeActive } from "../game/farmChallengeActive.js";
import { triggerInteraction } from "../game/interaction.js";
import { useChests } from "../game/chestStore.js";
import { speakerInfo } from "./dialogue/speakers.js";
import { Bi } from "../i18n/i18n.jsx";

/**
 * The "Enter — Talk to Pip" prompt shown when the player is near something
 * they can use and nothing is open (2026-10-13: the interaction key is now
 * ENTER, and the prompt matches the Achievements Wall's — navy, a gold rim,
 * a gold keycap). A face for a character (their portrait), an icon for
 * things. Clicking it does the same as the key. Hidden in touch mode, where
 * the tap-to-approach "Interact with X?" confirm (W4-C) replaces it.
 */
function thingIcon(it) {
  if (it.mapBoard) return "🗺️";
  if (it.model === "chest" || /chest/i.test(it.id)) return "🪙";
  if (/sign|board|stand|records/i.test(`${it.id} ${it.model || ""}`)) return "🪧";
  if (it.model === "gate") return "🚪";
  return "✨";
}

function PromptFace({ it }) {
  const [broken, setBroken] = useState(false);
  const info = it.model === "npc" ? speakerInfo(it.name) : null;
  if (info && info.img && !broken) {
    return <img className="ixp-face" src={info.img} alt="" draggable="false" onError={() => setBroken(true)} />;
  }
  return <span className="ixp-icon" aria-hidden="true">{it.model === "npc" && !/sign|board|stand|records/i.test(it.id) ? "💬" : thingIcon(it)}</span>;
}

export default function InteractionPrompt() {
  const nearbyId = useSession((s) => s.nearbyId);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const touchMode = useUI((s) => s.touchMode);
  // While a challenge runs, its panel owns the interface — no prompt.
  const challengeActive = useFarmChallengeActive();
  const chestOpen = useChests((s) => Boolean(nearbyId && s.opened[nearbyId]));

  if (touchMode || !nearbyId || activeEncounterId || challengeActive) return null;

  const interactable = getInteractable(nearbyId);
  if (!interactable) return null;

  return (
    <button
      type="button"
      className="interaction-prompt ixp"
      key={interactable.id}
      onClick={() => triggerInteraction(interactable)}
      onMouseDown={(e) => e.preventDefault() /* never keeps the focus (Enter is the key) */}
      tabIndex={-1}
    >
      <span className="ixp-badge"><PromptFace it={interactable} /></span>
      <span className="ixp-label"><Bi block={false}>{interactable.model === "chest" && chestOpen ? "Look in the chest" : interactable.promptLabel}</Bi></span>
      <kbd className="ixp-key" aria-label="Enter">Enter <span aria-hidden="true">↵</span></kbd>
    </button>
  );
}
