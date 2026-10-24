import React, { useEffect, useState } from "react";

import { startDemo } from "../../game/demo/demoRunner.js";
import { activeDemoDef } from "../../game/demo/registry.js";
import { demoSeen } from "../../game/demo/demoStore.js";
import { HostFace } from "./DemoOverlay.jsx";
import { kh } from "../keyHints.js";

/**
 * THE READY CARD (2026-10-24) — what a challenge opens on once its demo has
 * been watched on this device (the very first time, the demo plays by itself).
 * No written rules any more: the host, the challenge's name and two big
 * buttons — ▶ Watch how to play (the live demo) or Let's go!
 *
 * Replaces the old text "how to play" intros everywhere (SnowIntro — used by
 * every Snowball Sums, Magma Multiples and Emerald Jungle card — and the farm
 * cards' own intros).
 */
export default function DemoStartCard({ icon, title, onStart, onQuit, demoKey }) {
  const def = activeDemoDef(demoKey);
  // First time on this device the demo starts by itself a moment from now —
  // don't flash this card first (it appears anyway if that doesn't happen).
  const [show, setShow] = useState(() => !def || demoSeen(def.key));
  useEffect(() => {
    if (show) return undefined;
    const t = setTimeout(() => setShow(true), 1600);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div className="farm-challenge-card demo-start">
      <div className="demo-start-head">
        {def ? <HostFace host={def.host} size={64} /> : <span className="demo-start-icon">{icon}</span>}
        <div className="demo-start-titles">
          {def && <span className="demo-start-kicker">{def.host}</span>}
          <span className="demo-start-title">
            {icon} {title}
          </span>
        </div>
      </div>
      <div className="demo-start-buttons">
        {def && (
          <button
            className="demo-watch"
            onClick={(e) => {
              e.currentTarget.blur();
              startDemo(def, "intro");
            }}
          >
            <span className="demo-watch-play">▶</span>
            <span>
              Watch how to play
              <small>2 quick examples</small>
            </span>
          </button>
        )}
        <button
          className="primary-button demo-letsgo"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
        >
          {kh("Let's go! (Enter)")}
        </button>
      </div>
      {onQuit && (
        <button className="link-button demo-start-quit" onClick={onQuit}>
          Quit
        </button>
      )}
    </div>
  );
}
