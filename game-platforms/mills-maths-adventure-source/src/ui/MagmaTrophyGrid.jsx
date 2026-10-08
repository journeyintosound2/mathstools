import React, { useEffect, useState } from "react";

import { useUI } from "./effects/uiStore.js";
import { magmaTrophyRows } from "../data/magma/magmaRecords.js";

/**
 * MAGMA TROPHY GRID — the achievements wall opened from the Magma Multiples
 * trophy stand on the arrival plaza (magma-records). Same look + behaviour
 * as the farm and snow grids (the shared .ftrophy-* styles): the TEN
 * multiplicative challenges in the recommended order, each tile opening a
 * detail card (skill, host, best, medal).
 */

const MEDAL_EMOJI = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function medalCupColor(medal) {
  return medal ? medal.color : "#c7bda8";
}

export default function MagmaTrophyGrid() {
  const open = useUI((s) => s.magmaTrophyOpen);
  const setMagmaTrophy = useUI((s) => s.setMagmaTrophy);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) { setSelected(null); return undefined; }
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else setMagmaTrophy(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, setMagmaTrophy]);

  if (!open) return null;

  const rows = magmaTrophyRows();
  const earned = rows.filter((r) => r.medal).length;
  const golds = rows.filter((r) => r.medal && r.medal.id === "gold").length;
  const detail = selected ? rows.find((r) => r.key === selected) : null;

  return (
    <div className="ftrophy-overlay" onClick={() => setMagmaTrophy(false)}>
      <div className="ftrophy-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ftrophy-header">
          <h2>🏆 Magma Multiples Trophies</h2>
          <button className="dev-close" onClick={() => setMagmaTrophy(false)}>✕</button>
        </div>
        <div className="ftrophy-subtitle">
          {earned}/{rows.length} trophies earned · {golds} gold. Ten multiplying challenges — start with the Basalt Columns!
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
                    {detail.medal ? detail.medal.label : "No trophy yet"}
                  </span>
                  <span>Best: <b>{detail.best}</b> / {detail.max} ({detail.pct}%)</span>
                </div>
                {!detail.medal && <div className="ftrophy-hint">Score 50% for bronze, 75% for silver, 100% for gold.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="ftrophy-grid">
            {rows.map((r) => (
              <button key={r.key} className="ftrophy-tile" onClick={() => setSelected(r.key)}>
                <div className="ftrophy-tile-cup" style={{ color: medalCupColor(r.medal) }}>
                  {r.medal ? MEDAL_EMOJI[r.medal.id] : "🏆"}
                </div>
                <div className="ftrophy-tile-name">{r.icon} {r.name}</div>
                <div className={`ftrophy-tile-best ${r.medal ? "won" : ""}`}>
                  {r.best > 0 ? `${r.pct}%` : "not yet"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
