import React, { useEffect } from "react";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { useTradingPost } from "../game/tradingPostStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { TRADE_ROUNDS_PER_SET, TRADE_STALL_NAMES } from "../data/farm/tradingPostChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/** The trade, as tappable rows (touch devices). */
function TouchTrade({ round }) {
  const resolved = useTradingPost((s) => s.resolved);
  return (
    <div className="trade-touch">
      <div className="farm-challenge-line">{round.prompt}</div>
      {round.targets.map((t) => {
        const res = resolved[t.stall];
        return (
          <div key={t.stall} className="trade-touch-row">
            <span className="trade-touch-name">{TRADE_STALL_NAMES[t.stall]}</span>
            {t.tags.map((tag, i) => (
              <button
                key={i}
                disabled={Boolean(res)}
                className={`plank-piece-btn order-card-chip${res && res.chosenIndex === i ? (res.correct ? " good" : " bad") : ""}`}
                onClick={(e) => { e.currentTarget.blur(); useTradingPost.getState().tapTag(t.stall, i); }}
              >
                {tag}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * TRADING POST — 2D panel (F10). One-off intro card, then a slim strip; the
 * stalls and their price tags do the work in-world. Both stalls right →
 * celebrate auto-advances; any wrong → camera shake + the chain reason
 * card. Keyboard: Enter starts/advances; Esc quits.
 */

const CELEBRATE_MS = 2200;

export default function TradingPostPanel() {
  const status = useTradingPost((s) => s.status);
  const roundIndex = useTradingPost((s) => s.roundIndex);
  const score = useTradingPost((s) => s.score);
  const bestScore = useTradingPost((s) => s.bestScore);
  const round = useTradingPost((s) => s.currentRound());
  const regionId = useSession((s) => s.currentRegionId);

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useTradingPost.getState().exit();
    }
  }, [status, regionId]);

  // Enter = start / next; Esc = quit.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useTradingPost.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Any wrong tag → shake as the reason card appears.
  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  return (
    <div className="farm-challenge-panel">
      {status === "intro" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🏪 The Trading Post</span>
          </div>
          <div className="farm-challenge-line big">
            Three stalls, three languages — <span className="fc-value">one value!</span>
          </div>
          <div className="farm-challenge-line">
            A crate arrives priced in ONE notation. Tap the tag worth the SAME amount at each
            of the other two stalls. Watch out for ×10 tricksters!
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useTradingPost.getState().beginRounds();
              }}
            >
              {kh("Start! (Enter)")}
            </button>
            <button className="link-button" onClick={() => useTradingPost.getState().exit()}>
              Quit
            </button>
          </div>
        </div>
      )}

      {status === "trading" && round && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              🏪 Round {roundIndex + 1}/{TRADE_ROUNDS_PER_SET} · {score} pts
            </span>
            <button className="link-button" onClick={() => useTradingPost.getState().exit()}>
              Quit
            </button>
          </div>
          {/* Touch: on a phone the stall tags are small — the seller's price
              and both stalls' tags are in the card too (same choices). */}
          {useUI.getState().touchMode && <TouchTrade round={round} />}
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useTradingPost} ms={CELEBRATE_MS} working={round.working || round.reason}>
          🎉 Traded! {round.chain}
        </RoundCelebrate>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">Wrong tag at a stall!</div>
          <div className="farm-challenge-prompt">{round.reason}</div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useTradingPost.getState().next();
              }}
            >
              {roundIndex + 1 < TRADE_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🏪 The Trading Post — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useTradingPost.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useTradingPost.getState().exit()}>
              Back to the farm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
