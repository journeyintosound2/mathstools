import React, { useEffect } from "react";
import DemoButton, { DemoRound } from "./demo/DemoButton.jsx";

import { useRoundUp } from "../game/roundUpStore.js";
import { useSession } from "../game/sessionStore.js";
import { ROUNDUP_ROUNDS_PER_SET } from "../data/farm/roundUpChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/**
 * THE ROUND-UP — 2D panel (F3). Same live-movement pattern as the Fence
 * Challenge card: NOT a modal, the player keeps walking/herding while it
 * shows. Shows the herd size and a LIVE pen count (the skill being built is
 * working out HOW MANY, not counting), then the equal-groups reasoning on
 * feedback while the herd regroups behind it.
 *
 * Keyboard: Enter submits (while herding) / advances (on feedback).
 */
export default function RoundUpPanel() {
  const status = useRoundUp((s) => s.status);
  const roundIndex = useRoundUp((s) => s.roundIndex);
  const rounds = useRoundUp((s) => s.rounds);
  const score = useRoundUp((s) => s.score);
  const bestScore = useRoundUp((s) => s.bestScore);
  const results = useRoundUp((s) => s.results);
  const cows = useRoundUp((s) => s.cows);
  const hint = useRoundUp((s) => s.hint);
  const regionId = useSession((s) => s.currentRegionId);

  const penned = cows.filter((c) => c.state === "penned").length;

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useRoundUp.getState().exit();
    }
  }, [status, regionId]);

  // Enter = submit / next. Esc = quit the challenge.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useRoundUp.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "herding") st.submit();
      else if (st.status === "feedback") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // The "walk closer" hint fades itself out.
  useEffect(() => {
    if (!hint) return undefined;
    const t = setTimeout(() => useRoundUp.getState().setHint(null), 1800);
    return () => clearTimeout(t);
  }, [hint]);

  if (status === "idle") return null;

  const round = rounds[roundIndex] || null;
  const last = results[results.length - 1] || null;
  const lastFeedback = useRoundUp.getState().lastFeedback();

  return (
    <div className="farm-challenge-panel">
      <div className="farm-challenge-card">
        {status !== "done" && (
          <div className="farm-challenge-head">
            <span>🐄 The Round-Up</span>
            <span>
              <DemoRound>Round {Math.min(roundIndex + 1, ROUNDUP_ROUNDS_PER_SET)}/{ROUNDUP_ROUNDS_PER_SET} · Score {score}</DemoRound>
            </span>
            <DemoButton />
          </div>
        )}

        {status === "herding" && round && (
          <>
            {/* One idea per line, key value highlighted (teacher feedback). */}
            <div className="farm-challenge-line">Your herd has {round.herd} cows.</div>
            <div className="farm-challenge-line big">
              Round up <span className="fc-value">{round.display}</span> of the herd into the pen!
            </div>
            <div className="roundup-count">
              In the pen: <strong>{penned}</strong>
            </div>
            {hint && <div className="farm-challenge-hint">{hint}</div>}
            {/* Touch (phones / iPads): the cows are tiny on a small screen, so
                the pen can be filled from the card too — one cow at a time. */}
            {useUI.getState().touchMode && (
              <div className="farm-challenge-buttons">
                <button
                  className="plank-piece-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    const st = useRoundUp.getState();
                    const cow = st.cows.find((c) => c.state === "field");
                    if (cow) st.toggleCow(cow.id);
                  }}
                >
                  🐄 Pen a cow
                </button>
                <button
                  className="plank-piece-btn"
                  disabled={!penned}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    const st = useRoundUp.getState();
                    const last = st.pennedOrder[st.pennedOrder.length - 1];
                    if (last !== undefined) st.toggleCow(last);
                  }}
                >
                  ↩ Let one out
                </button>
              </div>
            )}
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useRoundUp.getState().submit();
                }}
              >
                {kh("That's the round-up! (Enter)")}
              </button>
              <button className="link-button" onClick={() => useRoundUp.getState().exit()}>
                Quit
              </button>
            </div>
          </>
        )}

        {status === "feedback" && last && (
          <>
            <div className={`farm-challenge-verdict ${last.grade.correct ? "good" : "bad"}`}>
              {last.grade.correct ? "✓ Perfect round-up!" : "✗ Not quite"}
            </div>
            <div className="farm-challenge-prompt">{lastFeedback}</div>
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useRoundUp.getState().next();
                }}
              >
                {roundIndex + 1 < ROUNDUP_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
              </button>
            </div>
          </>
        )}

        {status === "done" && (
          <>
            <div className="farm-challenge-head">
              <span>🐄 The Round-Up — complete!</span>
            </div>
            <div className="farm-challenge-prompt">
              You rounded up {score} of {ROUNDUP_ROUNDS_PER_SET} exactly. Best so far: {Math.max(bestScore, score)}/{ROUNDUP_ROUNDS_PER_SET}.
            </div>
            <div className="farm-challenge-buttons">
              <button className="primary-button" onClick={() => useRoundUp.getState().start()}>
                Play again
              </button>
              <button className="link-button" onClick={() => useRoundUp.getState().exit()}>
                Back to the farm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
