import React, { useEffect, useState } from "react";
import DemoButton, { DemoRound } from "./demo/DemoButton.jsx";

import { useFarmChallenge } from "../game/farmChallengeStore.js";
import { playerState, useSession } from "../game/sessionStore.js";
import { CHALLENGE_FENCE } from "../data/farm/farmLayout.js";
import { ROUNDS_PER_SET } from "../data/farm/fenceChallenge.js";
import { kh } from "./keyHints.js";

/**
 * FENCE CHALLENGE — 2D panel (F2). A small card overlaid on the world while
 * the challenge runs. Movement stays LIVE (the whole point is walking the
 * fence), so this is NOT a modal — it never freezes the player.
 *
 * Keyboard: Enter places (while placing) / advances (on feedback).
 */

// The player must be near the fence line to place (generous corridor).
const NEAR_Z = 9;
const NEAR_X = 5;

function playerNearFence() {
  return (
    Math.abs(playerState.z - CHALLENGE_FENCE.z) <= NEAR_Z &&
    playerState.x >= CHALLENGE_FENCE.x1 - NEAR_X &&
    playerState.x <= CHALLENGE_FENCE.x2 + NEAR_X
  );
}

export default function FarmChallengePanel() {
  const status = useFarmChallenge((s) => s.status);
  const roundIndex = useFarmChallenge((s) => s.roundIndex);
  const rounds = useFarmChallenge((s) => s.rounds);
  const score = useFarmChallenge((s) => s.score);
  const bullseyes = useFarmChallenge((s) => s.bullseyes);
  const bestScore = useFarmChallenge((s) => s.bestScore);
  const results = useFarmChallenge((s) => s.results);

  const [near, setNear] = useState(false);
  const regionId = useSession((s) => s.currentRegionId);

  // Leaving the farm (e.g. stepping into the return portal) ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useFarmChallenge.getState().exit();
    }
  }, [status, regionId]);

  // Poll proximity while placing (playerState is a plain mutable object).
  useEffect(() => {
    if (status !== "placing") return undefined;
    const t = setInterval(() => setNear(playerNearFence()), 150);
    return () => clearInterval(t);
  }, [status]);

  // Enter = place / next. Esc = quit the challenge.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useFarmChallenge.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "placing" && playerNearFence()) st.place(playerState.x);
      else if (st.status === "feedback") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  if (status === "idle") return null;

  const round = rounds[roundIndex] || null;
  const last = results[results.length - 1] || null;
  const lastFeedback = useFarmChallenge.getState().lastFeedback();

  return (
    <div className="farm-challenge-panel">
      <div className="farm-challenge-card">
        {status !== "done" && (
          <div className="farm-challenge-head">
            <span>🚜 Fence Challenge</span>
            <span>
              <DemoRound>Round {Math.min(roundIndex + 1, ROUNDS_PER_SET)}/{ROUNDS_PER_SET} · {score} pts</DemoRound>
              {bullseyes > 0 ? ` · 🎯×${bullseyes}` : ""}
            </span>
            <DemoButton />
          </div>
        )}

        {status === "placing" && round && (
          <>
            {/* One idea per line, key values highlighted — low reading load,
                high attention (teacher feedback). */}
            <div className="farm-challenge-line">The fence is {round.length} m long.</div>
            <div className="farm-challenge-line big">
              Place the {round.item} <span className="fc-value">{round.display}</span> of the way along,
            </div>
            <div className="farm-challenge-line big">
              starting from the{" "}
              <span className={round.fromEnd === "red" ? "fc-red" : "fc-blue"}>
                {round.fromEnd.toUpperCase()} post
              </span>.
            </div>
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                disabled={!near}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useFarmChallenge.getState().place(playerState.x);
                }}
              >
                {near ? kh("Place it here (Enter)") : "Walk closer to the fence…"}
              </button>
              <button className="link-button" onClick={() => useFarmChallenge.getState().exit()}>
                Quit
              </button>
            </div>
          </>
        )}

        {status === "feedback" && last && (
          <>
            <div
              className={`farm-challenge-verdict ${
                last.grade.band === "bullseye" ? "bullseye" : last.grade.correct ? "good" : last.grade.points > 0 ? "warm" : "bad"
              }`}
            >
              {last.grade.label}
            </div>
            <div className="farm-challenge-prompt">{lastFeedback}</div>
            <div className="farm-challenge-buttons">
              <button
                className="primary-button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useFarmChallenge.getState().next();
                }}
              >
                {roundIndex + 1 < ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
              </button>
            </div>
          </>
        )}

        {status === "done" && (
          <>
            <div className="farm-challenge-head">
              <span>🚜 Fence Challenge — complete!</span>
            </div>
            <div className="farm-challenge-prompt">
              You scored {score} points{bullseyes > 0 ? ` with ${bullseyes} bullseye${bullseyes > 1 ? "s" : ""} 🎯` : ""}.
              Best so far: {Math.max(bestScore, score)} points.
            </div>
            <div className="farm-challenge-buttons">
              <button className="primary-button" onClick={() => useFarmChallenge.getState().start()}>
                Play again
              </button>
              <button className="link-button" onClick={() => useFarmChallenge.getState().exit()}>
                Back to the farm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
