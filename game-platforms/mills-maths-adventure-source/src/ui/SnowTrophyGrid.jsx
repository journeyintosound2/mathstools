import React, { useEffect, useState } from "react";

import JourneyStrip from "./journey/JourneyStrip.jsx";
import { useUI } from "./effects/uiStore.js";
import { snowTrophyRows } from "../data/snow/snowRecords.js";

/**
 * SNOW TROPHY GRID — the achievements wall opened from the Snowball Sums
 * trophy stand (snow-records). Identical in look + behaviour to the farm's
 * FarmTrophyGrid (it reuses the same .ftrophy-* styles): a grid of the TEN
 * trophy slots showing each earned medal, with a click-through detail view.
 * (All ten challenges are built; the old "coming soon" placeholder text went
 * 2026-10-13.)
 */

const MEDAL_EMOJI = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function medalCupColor(medal) {
  return medal ? medal.color : "#c7bda8";
}

export default function SnowTrophyGrid() {
  const open = useUI((s) => s.snowTrophyOpen);
  const setSnowTrophy = useUI((s) => s.setSnowTrophy);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) { setSelected(null); return undefined; }
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else setSnowTrophy(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, setSnowTrophy]);

  if (!open) return null;

  const rows = snowTrophyRows();
  const earned = rows.filter((r) => r.medal).length;
  const golds = rows.filter((r) => r.medal && r.medal.id === "gold").length;
  const detail = selected ? rows.find((r) => r.key === selected) : null;

  return (
    <div className="ftrophy-overlay" onClick={() => setSnowTrophy(false)}>
      <div className="ftrophy-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ftrophy-header">
          <h2>🏆 Snowball Sums Trophies</h2>
          <button className="dev-close" onClick={() => setSnowTrophy(false)}>✕</button>
        </div>
        <div className="ftrophy-subtitle">
          {earned}/{rows.length} trophies earned · {golds} gold. Ten addition and subtraction strategies round the valley.
        </div>
        {/* The journey (2026-10-13): medals + the 7 that open the next world. */}
        {!detail && <JourneyStrip worldKey="snow" />}

        {detail ? (
          <div className="ftrophy-detail">
            <button className="link-button" onClick={() => setSelected(null)}>← All trophies</button>
            <div className="ftrophy-detail-body">
              <div className="ftrophy-detail-cup" style={{ color: medalCupColor(detail.medal) }}>
                🏆
              </div>
              <div className="ftrophy-detail-text">
                <h3>{detail.icon} {detail.name}</h3>
                <div className="ftrophy-detail-skill">{detail.skill}</div>
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
                  {r.best > 0 ? `${r.pct}%` : "not played"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
