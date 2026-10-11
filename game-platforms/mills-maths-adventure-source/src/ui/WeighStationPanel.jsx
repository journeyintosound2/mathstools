import React, { useEffect, useRef, useState } from "react";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { useWeighStation } from "../game/weighStationStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { WEIGH_ROUNDS_PER_SET, WEIGH_TYPE_POINTS } from "../data/farm/weighStationChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/**
 * WEIGH STATION — 2D panel (F9, v2 — Decimal-Zoom-tool flow). Numeric
 * rounds: DRAG the marker on the beam (or nudge with ← →), "Lock it in" for
 * banded points (bullseye!), then TYPE the rounded value into the input box.
 * Judgement rounds keep the tap-a-card flow. Correct typing → celebrate
 * auto-advances; wrong → camera shake + reason card. Esc quits.
 */

const CELEBRATE_MS = 2000;
const NUDGE = 0.01;

export default function WeighStationPanel() {
  const status = useWeighStation((s) => s.status);
  const roundIndex = useWeighStation((s) => s.roundIndex);
  const score = useWeighStation((s) => s.score);
  const bestScore = useWeighStation((s) => s.bestScore);
  const round = useWeighStation((s) => s.currentRound());
  const locateResult = useWeighStation((s) => s.locateResult);
  const typedCorrect = useWeighStation((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useWeighStation.getState().exit();
    }
  }, [status, regionId]);

  // Fresh input + autofocus whenever a typing phase begins.
  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  // Keys: Esc quits; Enter starts/locks/advances; ← → nudge the marker.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useWeighStation.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (st.status === "locating" && !typingInField) {
        if (e.key === "ArrowLeft") st.setMarkerFrac(st.markerFrac - NUDGE);
        if (e.key === "ArrowRight") st.setMarkerFrac(st.markerFrac + NUDGE);
      }
      if (e.key !== "Enter" || typingInField) return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "locating") st.lockIn();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Wrong typed answer / wrong scenario → shake.
  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useWeighStation.getState().submitRounded(typed);
    if (result === "invalid") {
      setInputWobble(true);
      setTimeout(() => setInputWobble(false), 400);
      inputRef.current?.focus();
    }
  }

  const placeShort = round && round.kind === "round" ? round.place : "";

  return (
    <div className="farm-challenge-panel">
      {status === "intro" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>⚖️ The Weigh Station</span>
          </div>
          <div className="farm-challenge-line big">
            Slide the marker to where the weight sits — <span className="fc-value">then round it!</span>
          </div>
          <div className="farm-challenge-line">
            Dead centre = 🎯 BULLSEYE. Then type the rounded value. Halfway rounds UP!
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useWeighStation.getState().beginRounds();
              }}
            >
              {kh("Start! (Enter)")}
            </button>
            <button className="link-button" onClick={() => useWeighStation.getState().exit()}>
              Quit
            </button>
          </div>
        </div>
      )}

      {status === "locating" && round && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              ⚖️ Round {roundIndex + 1}/{WEIGH_ROUNDS_PER_SET} · {score} pts — drag the marker to {round.exactStr}{useUI.getState().touchMode ? "" : " (← → to nudge)"}
            </span>
            <button
              className="primary-button weigh-lock"
              onClick={(e) => {
                e.currentTarget.blur();
                useWeighStation.getState().lockIn();
              }}
            >
              {kh("Lock it in (Enter)")}
            </button>
            <button className="link-button" onClick={() => useWeighStation.getState().exit()}>
              Quit
            </button>
          </div>
          {useUI.getState().touchMode && (
            <div className="farm-challenge-buttons">
              <button className="plank-piece-btn" aria-label="Nudge left" onClick={(e) => { e.currentTarget.blur(); const st = useWeighStation.getState(); st.setMarkerFrac(st.markerFrac - NUDGE * 2.5); }}>◀ nudge</button>
              <button className="plank-piece-btn" aria-label="Nudge right" onClick={(e) => { e.currentTarget.blur(); const st = useWeighStation.getState(); st.setMarkerFrac(st.markerFrac + NUDGE * 2.5); }}>nudge ▶</button>
            </div>
          )}
        </div>
      )}

      {status === "typing" && round && locateResult && (
        <div className="farm-challenge-card">
          <div
            className={`farm-challenge-verdict ${
              locateResult.band === "bullseye" ? "bullseye" : locateResult.points > 0 ? "good" : "warm"
            }`}
          >
            {locateResult.label} +{locateResult.points} pts
          </div>
          <div className="farm-challenge-line big">
            Now round {round.exactStr} to <span className="fc-value">{round.place}</span>:
          </div>
          <div className={`weigh-input-row${inputWobble ? " wobble" : ""}`}>
            {round.money && <span className="weigh-unit">$</span>}
            <input
              ref={inputRef}
              className="text-input weigh-input"
              type="text"
              inputMode="decimal"
              placeholder={round.money ? "0.00" : "0.0"}
              value={typed}
              maxLength={8}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            />
            {!round.money && <span className="weigh-unit">kg</span>}
            <button className="primary-button" onClick={submitTyped}>
              Check (+{WEIGH_TYPE_POINTS})
            </button>
          </div>
        </div>
      )}

      {status === "choosing" && round && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              ⚖️ Round {roundIndex + 1}/{WEIGH_ROUNDS_PER_SET} · {score} pts — {round.prompt}
            </span>
            <button className="link-button" onClick={() => useWeighStation.getState().exit()}>
              Quit
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useWeighStation} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.kind === "round" ? `${round.exactStr} ≈ ${round.correctStr}` : "Spot on!"}
        </RoundCelebrate>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">
            {round.kind === "judge"
              ? "Not that job! +0 pts"
              : typedCorrect === false
                ? "Not the rounded value! +0 pts"
                : "+0 pts"}
          </div>
          <div className="farm-challenge-prompt">{round.reason}</div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useWeighStation.getState().next();
              }}
            >
              {roundIndex + 1 < WEIGH_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>⚖️ The Weigh Station — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useWeighStation.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useWeighStation.getState().exit()}>
              Back to the farm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
