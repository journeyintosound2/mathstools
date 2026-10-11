import React, { useEffect } from "react";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { usePlankGap } from "../game/plankGapStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  PLANK_ROUNDS_PER_SET, PLANK_PIECES, twDisplay,
} from "../data/farm/plankGapChallenge.js";
import { kh } from "./keyHints.js";

/**
 * PLANK THE GAP — 2D panel (F12). Tap plank pieces (½ ⅓ ¼ ⅙ 1/12) to lay them
 * across the gap; Undo / Clear to fix; "Fill it!" checks the sum against the
 * gap. Exact → celebrate auto-advances; over/under → camera shake + reason.
 */

const CELEBRATE_MS = 1800;

export default function PlankGapPanel() {
  const status = usePlankGap((s) => s.status);
  const roundIndex = usePlankGap((s) => s.roundIndex);
  const score = usePlankGap((s) => s.score);
  const bestScore = usePlankGap((s) => s.bestScore);
  const round = usePlankGap((s) => s.currentRound());
  const laid = usePlankGap((s) => s.laid);
  const result = usePlankGap((s) => s.result);
  const regionId = useSession((s) => s.currentRegionId);

  const laidTw = laid.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      usePlankGap.getState().exit();
    }
  }, [status, regionId]);

  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = usePlankGap.getState();
      if (e.key === "Escape") { st.exit(); return; }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (st.status === "filling" && e.key === "Backspace") { e.preventDefault(); st.removeLast(); return; }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "filling") st.check();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  useEffect(() => {
    if (status === "feedback") playerState.camShake = { start: Date.now(), dur: 500 };
  }, [status, roundIndex]);


  if (status === "idle") return null;

  return (
    <div className="farm-challenge-panel">
      {status === "intro" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head"><span>🪵 Plank the Gap</span></div>
          <div className="farm-challenge-line big">
            Fill the gap in the fence <span className="fc-value">exactly</span> — lay planks that add up!
          </div>
          <div className="farm-challenge-line">
            Every plank snaps to the same twelfths grid, so ½ + ⅓ = 6/12 + 4/12. Later: subtraction — fill what's left.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); usePlankGap.getState().beginRounds(); }}>
              {kh("Start! (Enter)")}
            </button>
            <button className="link-button" onClick={() => usePlankGap.getState().exit()}>Quit</button>
          </div>
        </div>
      )}

      {status === "filling" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🪵 Round {roundIndex + 1}/{PLANK_ROUNDS_PER_SET} · {score} pts</span>
            <button className="link-button" onClick={() => usePlankGap.getState().exit()}>Quit</button>
          </div>
          {round.kind === "subtract" ? (
            <>
              <div className="farm-challenge-line">
                The trough is <span className="fc-value">{round.totalStr}</span> long, and{" "}
                <span className="fc-value">{round.preStr}</span> is already laid.
              </div>
              <div className="farm-challenge-line big">
                The empty gap = <strong>{round.totalStr} − {round.preStr}</strong>. Work it out, then lay that much!
              </div>
            </>
          ) : (
            <div className="farm-challenge-line big">
              Fill the <span className="fc-value">{round.gapStr}</span> gap — lay planks that add up to it.
            </div>
          )}
          <div className="farm-challenge-line">
            Laid so far: <strong>{twDisplay(laidTw)}</strong>
          </div>
          <div className="plank-pieces">
            {PLANK_PIECES.map((p) => (
              <button
                key={p.id}
                className="plank-piece-btn"
                style={{ borderColor: p.color }}
                onClick={(e) => { e.currentTarget.blur(); usePlankGap.getState().addPlank(p.tw); }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); usePlankGap.getState().check(); }}>
              {kh("Fill it! (Enter)")}
            </button>
            <button className="link-button" onClick={() => usePlankGap.getState().removeLast()}>↶ Undo</button>
            <button className="link-button" onClick={() => usePlankGap.getState().clear()}>Clear</button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={usePlankGap} ms={CELEBRATE_MS} working={round.working || round.reason}>
          Gap filled — {round.gapStr}!
        </RoundCelebrate>
      )}

      {status === "feedback" && round && result && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">
            {result.over ? "Too much — that overhangs the gap!" : "Not enough to fill it yet!"} +0 pts
          </div>
          <div className="farm-challenge-prompt">{round.reason}</div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); usePlankGap.getState().next(); }}>
              {roundIndex + 1 < PLANK_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head"><span>🪵 Plank the Gap — complete!</span></div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => usePlankGap.getState().start()}>Play again</button>
            <button className="link-button" onClick={() => usePlankGap.getState().exit()}>Back to the farm</button>
          </div>
        </div>
      )}
    </div>
  );
}
