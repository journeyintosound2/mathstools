import React, { useEffect } from "react";

import { useRoundOutcome } from "../game/roundOutcome.js";
import { SnowWorking } from "./SnowCardParts.jsx";
import { kh } from "./keyHints.js";

/**
 * The ONE "right answer" card every in-world challenge shows (farm, snow,
 * magma, jungle — game/roundOutcome.js has the rule).
 *
 *   Full marks   a slim "✓ … · +25 XP · ⭐ total" strip that moves on by
 *                itself after `ms`.
 *   A slip       the answer was right but points went on the way: confetti
 *                still flies (the 3D stage celebrates), and the card says
 *                there was a slip along the way, shows the XP the round
 *                still earned and the quick way, then waits for Next.
 *
 * `children` is the challenge's own one-line summary ("8 + 6 = 14").
 * `detail` (optional) names what slipped ("3 🍋 ↔ $6.50 — it's $6.75").
 * `working` (optional) a worked solution under `workingLabel` — the jungle
 * passes none: any route up its ladder is as good as another, so it never
 * shows a "quicker" one (Jeff, 2026-10-10).
 */
export default function RoundCelebrate({ useStore, max = 25, ms = 2200, working, workingLabel = "The quick way:", detail, children }) {
  const { points, slipped } = useRoundOutcome(useStore, max);
  const roundIndex = useStore((s) => s.roundIndex);
  const total = useStore((s) => (s.rounds && s.rounds.length) || 15);
  const score = useStore((s) => s.score);

  // Full-marks rounds move on by themselves; a slip waits to be read.
  useEffect(() => {
    if (slipped) return undefined;
    const t = setTimeout(() => {
      const st = useStore.getState();
      if (st.status === "celebrate" && st.roundIndex === roundIndex) st.next();
    }, ms);
    return () => clearTimeout(t);
  }, [slipped, roundIndex, ms, useStore]);

  if (!slipped) {
    return (
      <div className="farm-challenge-card mini round-celebrate">
        <div className="farm-challenge-head">
          <span>
            ✓ {children}
          </span>
          <span className="round-xp">+{points} XP</span>
          <span className="round-total">⭐ {score}</span>
        </div>
      </div>
    );
  }

  const lines = Array.isArray(working) ? working : working ? [working] : [];
  const last = roundIndex + 1 >= total;
  return (
    <div className="farm-challenge-card round-celebrate slip">
      <div className="round-slip-head">
        <span className="round-slip-tick">✓</span>
        <span className="round-slip-title">{children}</span>
        <span className="round-xp big">+{points} XP</span>
      </div>
      <div className="round-slip-note">
        <b>Right answer!</b> There was a slip along the way, so this round earned {points} of {max} XP.
        {" "}Get every step right first time for the full {max}.
      </div>
      {detail && <div className="round-slip-detail">{detail}</div>}
      {lines.length > 0 && (
        <>
          <div className="round-slip-sub">{workingLabel}</div>
          <SnowWorking lines={lines} />
        </>
      )}
      <div className="farm-challenge-buttons">
        <button
          className="primary-button"
          onClick={(e) => {
            e.currentTarget.blur();
            useStore.getState().next();
          }}
        >
          {last ? kh("Finish (Enter)") : kh("Next round (Enter)")}
        </button>
        <span className="round-total">⭐ {score}</span>
      </div>
    </div>
  );
}
