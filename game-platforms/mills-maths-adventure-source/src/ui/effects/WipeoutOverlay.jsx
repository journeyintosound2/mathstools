import React, { useEffect } from "react";

import { useWipeout, WIPE } from "../../game/hazardRescue.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * "WIPED OUT!" — what you see when you fall into deep water (Jeff, 2026-10-13:
 * "play a 'you died' type animation and then send them back to the starting
 * spawn point"). Timed against game/hazardRescue.js's WIPE:
 *
 *   0 ms      a blue wash rises from the edges while you sink (Player.jsx)
 *   500 ms    a cartoon iris starts closing on the middle of the screen
 *   1150 ms   dark — the card drops in: a sinking ring of bubbles, WIPED
 *             OUT!, what happened, and "Back to the start…" filling up
 *   2200 ms   (you're moved to the spawn behind the card)
 *   2700 ms   the card lifts away, the iris opens on the spawn
 *   3300 ms   gone
 *
 * It blocks clicks while it plays. Reduced motion: a plain fade instead.
 */
const ICONS = { water: "🌊", lake: "🥶" };

export default function WipeoutOverlay() {
  const active = useWipeout((s) => s.active);

  useEffect(() => {
    if (!active) return undefined;
    const id = active.id;
    const left = Math.max(0, WIPE.endAt - (Date.now() - active.at));
    const timer = setTimeout(() => useWipeout.getState().end(id), left);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;
  const icon = /lake/i.test(active.line || "") ? ICONS.lake : ICONS.water;
  const ms = (n) => `${n}ms`;
  return (
    <div
      className="wipe"
      key={active.id}
      role="alert"
      aria-live="assertive"
      style={{
        "--wipe-close": ms(WIPE.closeAt),
        "--wipe-shut": ms(WIPE.shutAt - WIPE.closeAt),
        "--wipe-card": ms(WIPE.shutAt - 60),
        "--wipe-open": ms(WIPE.openAt),
        "--wipe-opening": ms(WIPE.endAt - WIPE.openAt),
        "--wipe-fill": ms(WIPE.teleportAt - WIPE.shutAt + 300),
      }}
    >
      <div className="wipe-tint" />
      <div className="wipe-iris" />
      <div className="wipe-card">
        <div className="wipe-badge" aria-hidden="true">
          <span className="wipe-icon">{icon}</span>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="wipe-bubble" style={{ "--i": i }} />)}
        </div>
        <h2 className="wipe-title"><Bi>Wiped out!</Bi></h2>
        <p className="wipe-line"><Bi>{active.line || "You fell into the deep water!"}</Bi></p>
        <div className="wipe-back">
          <span className="wipe-bar"><i /></span>
          <span className="wipe-back-text"><Bi block={false}>Back to the start…</Bi></span>
        </div>
      </div>
    </div>
  );
}
