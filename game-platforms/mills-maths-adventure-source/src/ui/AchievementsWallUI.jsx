import React, { useEffect, useMemo, useState } from "react";

import { useSession, playerState } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import { useProgress } from "../progress/store.js";
import { useResults } from "../results/resultStore.js";
import { useFarmChallengeActive } from "../game/farmChallengeActive.js";
import { inWallPromptZone, WALL_BOARDS } from "../data/island/wallView.js";
import { achievementsSummary } from "../data/island/achievements.js";
import { Bi } from "../i18n/i18n.jsx";

/**
 * THE ACHIEVEMENTS WALL — the prompt ("Enter · Look at the Achievements
 * Wall") when you stand in front of it on Harbour Green, and the controls
 * while you look: ← / → step board to board, ↑ zooms in on a board, ↓ backs
 * out to the whole wall, 1–6 jump straight to a world, Enter / Esc steps
 * away. Touch + mouse get the same as buttons. The camera work is in
 * Player.jsx; the boards themselves are 3D (game/island/AchievementsWall).
 */
function useInWallZone() {
  const [inZone, setInZone] = useState(false);
  useEffect(() => {
    let raf = 0, last = false;
    const tick = () => {
      const on = useSession.getState().currentRegionId === "island-1" && inWallPromptZone(playerState.x, playerState.z);
      if (on !== last) { last = on; setInZone(on); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return inZone;
}

const isTyping = (e) => {
  const t = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
  return t === "input" || t === "textarea" || t === "select" || (e.target && e.target.isContentEditable);
};

export default function AchievementsWallUI() {
  const inZone = useInWallZone();
  const wallView = useUI((s) => s.wallView);
  const touchMode = useUI((s) => s.touchMode);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const challengeActive = useFarmChallengeActive();
  const anyOverlay = useUI((s) => s.questLogOpen || s.trophyOpen || s.resultsOpen || s.howToOpen || s.pilotOpen || s.cloudLoginOpen);
  const canPrompt = inZone && !wallView && !activeEncounterId && !challengeActive && !anyOverlay;

  // Keys: Enter opens (in the zone); while looking, the arrows / 1–6 / Esc.
  useEffect(() => {
    function onKey(e) {
      if (isTyping(e)) return;
      const ui = useUI.getState();
      const v = ui.wallView;
      if (!v) {
        if (e.key === "Enter" && canPrompt) { e.preventDefault(); ui.openWall(-1); }
        return;
      }
      const k = e.key;
      const lk = k.length === 1 ? k.toLowerCase() : k;
      if (k === "Escape" || k === "Enter" || k === "Backspace") { e.preventDefault(); ui.closeWall(); }
      else if (k === "ArrowLeft" || lk === "a") { e.preventDefault(); ui.wallStep(-1); }
      else if (k === "ArrowRight" || lk === "d") { e.preventDefault(); ui.wallStep(1); }
      else if (k === "ArrowUp" || lk === "w") { e.preventDefault(); ui.wallZoom(true); }
      else if (k === "ArrowDown" || lk === "s") { e.preventDefault(); ui.wallZoom(false); }
      else if (/^[1-6]$/.test(k)) { e.preventDefault(); ui.openWall(Number(k) - 1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canPrompt]);

  // A modal popping up (e.g. a dialogue) or a challenge starting ends the look.
  useEffect(() => {
    if (wallView && (activeEncounterId || challengeActive)) useUI.getState().closeWall();
  }, [wallView, activeEncounterId, challengeActive]);

  // Hide the HUD + other prompts while looking (body class → CSS).
  useEffect(() => {
    document.body.classList.toggle("wall-view", Boolean(wallView));
    return () => document.body.classList.remove("wall-view");
  }, [wallView]);

  // The focused board's caption (also read by screen readers).
  const progress = useProgress();
  const results = useResults((r) => r.results);
  const summary = useMemo(() => (wallView ? achievementsSummary(progress, results) : null), [wallView, progress, results]);

  if (wallView && summary) {
    const P = wallView.panel >= 0 ? summary.panels[wallView.panel] : null;
    const t = summary.totals;
    return (
      <div className="wall-view-ui" role="region" aria-label="Achievements Wall">
        <button className="wall-leave" onClick={() => useUI.getState().closeWall()}>
          <span aria-hidden="true">✕</span> <Bi>Step back</Bi>
        </button>
        <div className="wall-caption" aria-live="polite">
          <button className="wall-arrow" aria-label="Previous board" onClick={() => useUI.getState().wallStep(-1)}>‹</button>
          <div className="wall-caption-body">
            {P ? (
              <>
                <div className="wall-caption-title" style={{ "--wall-c": P.color }}>
                  <span className="wall-caption-icon" aria-hidden="true">{P.icon}</span>
                  <span>{P.title}</span>
                  <span className="wall-caption-count">{wallView.panel + 1} / {WALL_BOARDS}</span>
                </div>
                <div className="wall-caption-text">{P.summary}</div>
              </>
            ) : (
              <>
                <div className="wall-caption-title" style={{ "--wall-c": "#2a5f9e" }}>
                  <span className="wall-caption-icon" aria-hidden="true">🏆</span>
                  <span><Bi>Achievements Wall</Bi></span>
                </div>
                <div className="wall-caption-text">
                  {t.trophies} of {t.trophySlots} trophies ({t.golds} gold) · {t.keys} Playground keys · {t.badges} {t.badges === 1 ? "badge" : "badges"} · level {t.level}
                </div>
              </>
            )}
            <div className="wall-caption-keys">
              {touchMode ? (
                <>
                  <button className="wall-chip" onClick={() => useUI.getState().wallZoom(!P)}>{P ? <Bi>Whole wall</Bi> : <Bi>Zoom in</Bi>}</button>
                </>
              ) : (
                <>
                  <span><kbd>←</kbd><kbd>→</kbd> <Bi>boards</Bi></span>
                  <span><kbd>↑</kbd><kbd>↓</kbd> <Bi>zoom</Bi></span>
                  <span><kbd>1</kbd>–<kbd>6</kbd> <Bi>worlds</Bi></span>
                  <span><kbd>Esc</kbd> <Bi>step back</Bi></span>
                </>
              )}
            </div>
          </div>
          <button className="wall-arrow" aria-label="Next board" onClick={() => useUI.getState().wallStep(1)}>›</button>
        </div>
      </div>
    );
  }

  if (!canPrompt) return null;
  return (
    <button className="wall-prompt" onClick={() => useUI.getState().openWall(-1)}>
      {!touchMode && <kbd>Enter</kbd>}
      <span className="wall-prompt-icon" aria-hidden="true">🏆</span>
      <span><Bi>Look at the Achievements Wall</Bi></span>
    </button>
  );
}
