import React from "react";

import { useSession, clearMoveTarget } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import { getInteractable } from "../data/interactables.js";
import { triggerInteraction } from "../game/interaction.js";
import { useFarmChallengeActive } from "../game/farmChallengeActive.js";

/**
 * Touch "Interact with X?" confirm (W4-C).
 *
 * After the player TAPS a character and walks over to it, this card appears
 * (approachId is set AND the player has arrived → nearbyId === approachId).
 * "Interact" runs the exact same logic as pressing Enter; "Cancel" dismisses it.
 * Touch-only; on desktop the "Press Enter" prompt is used instead.
 */
export default function InteractConfirm() {
  const touchMode = useUI((s) => s.touchMode);
  const approachId = useSession((s) => s.approachId);
  const nearbyId = useSession((s) => s.nearbyId);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const clearApproach = useSession((s) => s.clearApproach);

  // While a farm challenge runs, its panel owns the interface.
  const challengeActive = useFarmChallengeActive();

  // Only when: touch mode, we tapped something, we've ARRIVED at it, and no
  // modal is already open.
  const arrived = touchMode && approachId && approachId === nearbyId && !activeEncounterId && !challengeActive;
  if (!arrived) return null;

  const target = getInteractable(approachId);
  if (!target) return null;

  function onInteract() {
    const t = getInteractable(approachId);
    clearApproach();
    triggerInteraction(t);
  }
  function onCancel() {
    clearMoveTarget(); // clears the walk target + the approach
  }

  return (
    <div className="interact-confirm">
      <div className="interact-confirm-card">
        <div className="interact-confirm-title">Interact with {target.name}?</div>
        <div className="interact-confirm-buttons">
          <button className="primary-button" onClick={onInteract}>Interact</button>
          <button className="link-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
