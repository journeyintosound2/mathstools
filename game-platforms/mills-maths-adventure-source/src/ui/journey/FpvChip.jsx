import React from "react";

import { useUI } from "../effects/uiStore.js";
import { useSession } from "../../game/sessionStore.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * While the FIRST-PERSON VIEW is on (/ on a keyboard, 👁️ on a phone or
 * iPad), a small chip says how to look around and how to come back
 * (2026-10-13 — the training teaches it, so it needs to be findable).
 */
export default function FpvChip() {
  const fpv = useUI((s) => s.fpv);
  const touch = useUI((s) => s.touchMode);
  const wall = useUI((s) => Boolean(s.wallView));
  const enc = useSession((s) => s.activeEncounterId);
  if (!fpv || wall || enc) return null;
  return (
    <div className="fpv-chip" role="status">
      <span className="fpv-chip-eye" aria-hidden="true">👁️</span>
      <span className="fpv-chip-text">
        <b><Bi>First-person view</Bi></b>
        <span>{touch ? <Bi>Drag to look around · tap 👁️ to come back</Bi> : <Bi>Arrow keys to look around · press / to come back</Bi>}</span>
      </span>
      <button className="fpv-chip-x" onClick={(e) => { e.currentTarget.blur(); useUI.getState().setFpv(false); }} aria-label="Leave first-person view">✕</button>
    </div>
  );
}
