import React, { useEffect } from "react";

import { useAdmin } from "../../game/adminStore.js";
import { useJourney } from "../../game/journeyStore.js";
import { useSession } from "../../game/sessionStore.js";
import { useProgress } from "../../progress/store.js";
import { REGIONS } from "../../data/regions.js";
import { JOURNEY_WORLDS } from "../../data/journey.js";

/**
 * THE ADMIN PANEL (2026-10-13) — only while admin mode is on (opened from
 * the 🛠️ chip on the HUD). Jump straight to any world, finish the training,
 * or switch admin mode off. Nothing here changes trophies or missions.
 */
const STOPS = [
  { id: "island-1", icon: "🏝️" },
  ...JOURNEY_WORLDS.map((w) => ({ id: w.regionId, icon: w.icon })),
  { id: "cabin", icon: "🪵", note: "inside Snowball Sums" },
];

export default function AdminPanel() {
  const open = useAdmin((s) => s.panelOpen);
  const on = useAdmin((s) => s.on);
  const here = useSession((s) => s.currentRegionId);
  const journey = useProgress((s) => s.journey);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") useAdmin.getState().closePanel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open || !on) return null;
  const A = useAdmin.getState();
  const trainingLeft = !(journey && journey.trainingDone);

  return (
    <div className="modal-overlay admin-overlay" onClick={() => A.closePanel()}>
      <div className="admin-card" role="dialog" aria-modal="true" aria-label="Admin mode" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => A.closePanel()} aria-label="Close">✕</button>
        <div className="admin-kicker">🛠️ Admin mode</div>
        <h2 className="admin-title">Every gate is open</h2>
        <p className="admin-note">For testing. Your trophies, keys and journey aren't changed — turn admin mode off and the gates follow your real progress again.</p>

        <h3 className="admin-sub">Jump to a world</h3>
        <div className="admin-grid">
          {STOPS.filter((s) => REGIONS[s.id]).map((s) => (
            <button key={s.id} className={`admin-go${s.id === here ? " is-here" : ""}`} disabled={s.id === here} onClick={() => A.travel(s.id)}>
              <span aria-hidden="true">{s.icon}</span>
              <b>{REGIONS[s.id].name}</b>
              {s.id === here ? <small>You're here</small> : s.note ? <small>{s.note}</small> : null}
            </button>
          ))}
        </div>

        <div className="admin-actions">
          {trainingLeft && (
            <button className="admin-btn" onClick={() => { useJourney.getState().adminFinishTraining(); A.closePanel(); }}>
              🎓 Finish the training
            </button>
          )}
          <button className="admin-btn admin-off" onClick={() => A.turnOff()}>Turn admin mode off</button>
        </div>
      </div>
    </div>
  );
}

/** The small 🛠️ chip on the HUD while admin mode is on. */
export function AdminChip({ inMenu = false, onClick }) {
  const on = useAdmin((s) => s.on);
  if (!on) return null;
  return (
    <button className={inMenu ? "cog-main-btn admin-chip" : "hud-icon-btn admin-chip"} title="Admin mode" onClick={() => { onClick && onClick(); useAdmin.getState().openPanel(); }}>
      🛠️ Admin
    </button>
  );
}
