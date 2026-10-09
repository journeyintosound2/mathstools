import React, { useEffect, useState } from "react";

import { useUI } from "./effects/uiStore.js";
import { jungleTrophyRows } from "../data/jungle/jungleRecords.js";

/**
 * JUNGLE TROPHY GRID — opened from the Emerald Jungle trophy stand on the
 * arrival glade (jungle-records). The Magma grid's look + behaviour (the
 * shared .ftrophy-* styles): the TEN proportional-reasoning challenges in
 * the recommended order. Challenges still to be built show "coming soon".
 */

const MEDAL_EMOJI = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function medalCupColor(medal) {
  return medal ? medal.color : "#c7bda8";
}

export default function JungleTrophyGrid() {
  const open = useUI((s) => s.jungleTrophyOpen);
  const setJungleTrophy = useUI((s) => s.setJungleTrophy);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) { setSelected(null); return undefined; }
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else setJungleTrophy(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, setJungleTrophy]);

  if (!open) return null;

  const rows = jungleTrophyRows();
  const open10 = rows.filter((r) => !r.soon).length;
  const earned = rows.filter((r) => r.medal).length;
  const golds = rows.filter((r) => r.medal && r.medal.id === "gold").length;
  const detail = selected ? rows.find((r) => r.key === selected) : null;

  return (
    <div className="ftrophy-overlay" onClick={() => setJungleTrophy(false)}>
      <div className="ftrophy-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ftrophy-header">
          <h2>🏆 Emerald Jungle Trophies</h2>
          <button className="dev-close" onClick={() => setJungleTrophy(false)}>✕</button>
        </div>
        <div className="ftrophy-subtitle">
          {earned}/{rows.length} trophies earned · {golds} gold. {open10} vine-ladder challenges open now (more coming soon) — start with the Monkey Swap in the Palm Grove!
        </div>

        {detail ? (
          <div className="ftrophy-detail">
            <button className="link-button" onClick={() => setSelected(null)}>← All trophies</button>
            <div className="ftrophy-detail-body">
              <div className="ftrophy-detail-cup" style={{ color: medalCupColor(detail.medal) }}>
                🏆
              </div>
              <div className="ftrophy-detail-text">
                <h3>{detail.icon} {detail.name}</h3>
                <div className="ftrophy-detail-skill">{detail.skill} · with {detail.host}</div>
                <p>{detail.blurb}</p>
                <div className="ftrophy-detail-stats">
                  <span className="ftrophy-medal-tag" style={{ background: medalCupColor(detail.medal) }}>
                    {detail.medal ? detail.medal.label : detail.soon ? "Coming soon" : "No trophy yet"}
                  </span>
                  <span>Best: <b>{detail.best}</b> / {detail.max} ({detail.pct}%)</span>
                </div>
                {detail.soon && <div className="ftrophy-hint">Coming soon — this clearing is still being built.</div>}
                {!detail.soon && !detail.medal && <div className="ftrophy-hint">Score 50% for bronze, 75% for silver, 100% for gold.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="ftrophy-grid">
            {rows.map((r) => (
              <button key={r.key} className={`ftrophy-tile${r.soon ? " soon" : ""}`} onClick={() => setSelected(r.key)}>
                <div className="ftrophy-tile-cup" style={{ color: medalCupColor(r.medal) }}>
                  {r.medal ? MEDAL_EMOJI[r.medal.id] : "🏆"}
                </div>
                <div className="ftrophy-tile-name">{r.icon} {r.name}</div>
                <div className={`ftrophy-tile-best ${r.medal ? "won" : ""}`}>
                  {r.soon ? "coming soon" : r.best > 0 ? `${r.pct}%` : "not yet"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
