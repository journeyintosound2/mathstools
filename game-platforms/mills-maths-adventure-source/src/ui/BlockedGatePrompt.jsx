import React, { useEffect, useState } from "react";

import { useSession, playerState } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";

/**
 * BlockedGatePrompt (Phase 2H-D) — a small contextual banner shown while the
 * player is near a LOCKED gate / boundary (e.g. "Complete Pip's Integer
 * challenge to raise the Fraction Bridge").
 *
 * It POLLS playerState.blockedHint/blockedExpiry (the Player refreshes them
 * while near a locked collider). The hint lingers for ≥3s after the last
 * near-contact, so it stays readable when the student stops, then fades. It
 * never appears over a maths/quest/trophy modal, and updates smoothly when the
 * player approaches a different gate (no flicker).
 */
export default function BlockedGatePrompt() {
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const questLogOpen = useUI((s) => s.questLogOpen);
  const trophyOpen = useUI((s) => s.trophyOpen);
  const [hint, setHint] = useState(null);
  const [icon, setIcon] = useState("🔒");

  useEffect(() => {
    const t = setInterval(() => {
      const active = playerState.blockedHint && Date.now() < playerState.blockedExpiry;
      setHint(active ? playerState.blockedHint : null);
      // Locked gates show a padlock; ride / hazard hints (chutes, the lift,
      // the icy lake, lava, bounces) set blockedIcon = "" for none.
      setIcon(playerState.blockedIcon ?? "🔒");
    }, 150); // poll (smooth, no per-frame React churn / flicker)
    return () => clearInterval(t);
  }, []);

  const modalOpen = Boolean(activeEncounterId) || questLogOpen || trophyOpen;
  if (!hint || modalOpen) return null;
  return <div className="blocked-gate-prompt">{icon ? `${icon} ` : ""}{hint}</div>;
}
