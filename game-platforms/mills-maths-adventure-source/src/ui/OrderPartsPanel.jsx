import React, { useEffect } from "react";

import { useOrderParts } from "../game/orderPartsStore.js";
import { useSession } from "../game/sessionStore.js";
import { ORDER_ROUNDS_PER_SET } from "../data/farm/orderPartsChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/**
 * ORDER THE PARTS — 2D panel (F4). Same slim, live (non-modal) card as the
 * other farm challenges: one idea per line, no helper paragraphs.
 * Keyboard: Enter checks (while ordering) / advances (on feedback).
 */
export default function OrderPartsPanel() {
  const status = useOrderParts((s) => s.status);
  const roundIndex = useOrderParts((s) => s.roundIndex);
  const score = useOrderParts((s) => s.score);
  const bestScore = useOrderParts((s) => s.bestScore);
  const selectedId = useOrderParts((s) => s.selectedId);
  const arrangement = useOrderParts((s) => s.arrangement);
  const touch = useUI((s) => s.touchMode);
  const regionId = useSession((s) => s.currentRegionId);
  const last = useOrderParts((s) => s.lastResult());
  const lastFeedback = useOrderParts.getState().lastFeedback();

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useOrderParts.getState().exit();
    }
  }, [status, regionId]);

  // Enter = check / next. Esc = quit the challenge.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useOrderParts.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "ordering") st.check();
      else if (st.status === "feedback") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  if (status === "idle") return null;

  return (
    <div className="farm-challenge-panel">
      <div className="farm-challenge-card">
        {status !== "done" && (
          <div className="farm-challenge-head">
            <span>🥕 Order the Parts</span>
            <span>
              Round {Math.min(roundIndex + 1, ORDER_ROUNDS_PER_SET)}/{ORDER_ROUNDS_PER_SET} · {score} pts
            </span>
          </div>
        )}

        {status === "ordering" && (
          <>
            <div className="farm-challenge-line big">
              Order the carrots: <span className="fc-value">smallest → largest</span>
            </div>
            <div className="farm-challenge-line">
              {selectedId ? "Now tap the carrot to swap it with." : "Tap two carrots to swap them."}
            </div>
            {/* Touch: the same row as big chips in the card (the 3D carrots
                are small on a phone) — tap two to swap, exactly like the field. */}
            {touch && (
              <div className="order-card-row" role="group" aria-label="The carrots, left to right">
                {arrangement.map((id) => {
                  const it = (useOrderParts.getState().currentRound()?.items || []).find((x) => x.id === id);
                  if (!it) return null;
                  return (
                    <button
                      key={id}
                      className={`plank-piece-btn order-card-chip${selectedId === id ? " active" : ""}`}
                      onClick={(e) => { e.currentTarget.blur(); useOrderParts.getState().tapItem(id); }}
                    >
                      🥕 {it.display}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useOrderParts.getState().check();
                }}
              >
                {kh("Check the order! (Enter)")}
              </button>
              <button className="link-button" onClick={() => useOrderParts.getState().exit()}>
                Quit
              </button>
            </div>
          </>
        )}

        {status === "feedback" && last && (
          <>
            <div className={`farm-challenge-verdict ${last.grade.correct ? "good" : last.grade.points > 0 ? "warm" : "bad"}`}>
              {last.grade.correct ? "🥕 Harvested! +25 pts" : `Not quite — +${last.grade.points} pts`}
            </div>
            <div className="farm-challenge-prompt">{lastFeedback}</div>
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useOrderParts.getState().next();
                }}
              >
                {roundIndex + 1 < ORDER_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
              </button>
            </div>
          </>
        )}

        {status === "done" && (
          <>
            <div className="farm-challenge-head">
              <span>🥕 Order the Parts — complete!</span>
            </div>
            <div className="farm-challenge-prompt">
              You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
            </div>
            <div className="farm-challenge-buttons">
              <button className="primary-button" onClick={() => useOrderParts.getState().start()}>
                Play again
              </button>
              <button className="link-button" onClick={() => useOrderParts.getState().exit()}>
                Back to the farm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
