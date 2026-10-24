import React, { useEffect, useRef, useState } from "react";
import DemoButton, { DemoRound } from "./demo/DemoButton.jsx";
import DemoStartCard from "./demo/DemoStartCard.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { useVeggiePlot } from "../game/veggiePlotStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { VEGGIE_ROUNDS_PER_SET, VEGGIE_TYPE_POINTS } from "../data/farm/veggiePlotChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/**
 * THE VEGGIE PLOT — 2D panel (F11). AREA rounds: DRAG the width + length edges
 * (or nudge with the arrow keys), "Lock the bed" for placement points, then
 * type the harvest product as a fraction in the BOTTOM bar (so the array stays
 * visible). POTION rounds: predict GROW or SHRINK. Correct → celebrate
 * auto-advances; wrong → camera shake + reason card. Esc quits.
 */

const CELEBRATE_MS = 2000;

/**
 * A tiny stacked fraction input (numerator over denominator) + Harvest button.
 * Numerator autofocuses; "/" or ↓ jumps to the denominator; Enter submits.
 */
function FractionField({ onSubmit, wobble, pointsLabel }) {
  const [num, setNum] = useState("");
  const [den, setDen] = useState("");
  const numRef = useRef(null);
  const denRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => numRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);
  const submit = () => onSubmit(`${num}/${den}`);
  const onlyDigits = (v) => v.replace(/[^0-9]/g, "");
  return (
    <>
      <span className={`veggie-frac${wobble ? " wobble" : ""}`}>
        <input
          ref={numRef}
          className="veggie-frac-in"
          inputMode="numeric"
          value={num}
          maxLength={3}
          aria-label="numerator"
          onChange={(e) => setNum(onlyDigits(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            else if (e.key === "/" || e.key === "ArrowDown") { e.preventDefault(); denRef.current?.focus(); }
          }}
        />
        <span className="veggie-frac-bar" />
        <input
          ref={denRef}
          className="veggie-frac-in"
          inputMode="numeric"
          value={den}
          maxLength={3}
          aria-label="denominator"
          onChange={(e) => setDen(onlyDigits(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            else if (e.key === "ArrowUp") { e.preventDefault(); numRef.current?.focus(); }
          }}
        />
      </span>
      <button className="primary-button" onClick={submit}>Harvest (+{pointsLabel})</button>
    </>
  );
}

export default function VeggiePlotPanel() {
  const status = useVeggiePlot((s) => s.status);
  const roundIndex = useVeggiePlot((s) => s.roundIndex);
  const score = useVeggiePlot((s) => s.score);
  const bestScore = useVeggiePlot((s) => s.bestScore);
  const round = useVeggiePlot((s) => s.currentRound());
  const cols = useVeggiePlot((s) => s.cols);
  const rows = useVeggiePlot((s) => s.rows);
  const placeResult = useVeggiePlot((s) => s.placeResult);
  const typedCorrect = useVeggiePlot((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [inputWobble, setInputWobble] = useState(false);

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useVeggiePlot.getState().exit();
    }
  }, [status, regionId]);

  // Keys: Esc quits; Enter starts/locks/advances; arrows nudge the edges.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useVeggiePlot.getState();
      if (e.key === "Escape") { st.exit(); return; }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (st.status === "placing" && !typingInField) {
        if (e.key === "ArrowLeft") st.setCols(st.cols - 1);
        if (e.key === "ArrowRight") st.setCols(st.cols + 1);
        if (e.key === "ArrowUp") st.setRows(st.rows + 1);
        if (e.key === "ArrowDown") st.setRows(st.rows - 1);
      }
      if (e.key !== "Enter" || typingInField) return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "placing") st.lockPlace();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Wrong answer / wrong prediction → shake.
  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitFraction(val) {
    const result = useVeggiePlot.getState().submitProduct(val);
    if (result !== "correct" && result !== "wrong") {
      setInputWobble(true);
      setTimeout(() => setInputWobble(false), 400);
    }
  }

  return (
    <>
    <div className="farm-challenge-panel">
      {/* The ready card (2026-10-24): the live demo teaches the rules now
          (game/demo/scripts/farmDemos.js) — no written instructions. */}
      {status === "intro" && (
        <DemoStartCard
          icon="🥬"
          title="The Veggie Plot"
          onStart={() => useVeggiePlot.getState().beginRounds()}
          onQuit={() => useVeggiePlot.getState().exit()}
        />
      )}

      {status === "placing" && round && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              🥕 <DemoRound>Round {roundIndex + 1}/{VEGGIE_ROUNDS_PER_SET} · {score} pts</DemoRound> — plant {round.widthStr} wide × {round.lengthStr} long
            </span>
            <DemoButton />
            <button className="primary-button weigh-lock" onClick={(e) => { e.currentTarget.blur(); useVeggiePlot.getState().lockPlace(); }}>
              {kh("Lock the bed (Enter)")}
            </button>
            <button className="link-button" onClick={() => useVeggiePlot.getState().exit()}>Quit</button>
          </div>
          {/* Touch: step the two edges with buttons too — the bed is small on a phone. */}
          {useUI.getState().touchMode && (
            <div className="farm-challenge-buttons veggie-nudge">
              <span className="veggie-nudge-label">Wide</span>
              <button className="plank-piece-btn" aria-label="Narrower" onClick={(e) => { e.currentTarget.blur(); const st = useVeggiePlot.getState(); st.setCols(st.cols - 1); }}>◀</button>
              <button className="plank-piece-btn" aria-label="Wider" onClick={(e) => { e.currentTarget.blur(); const st = useVeggiePlot.getState(); st.setCols(st.cols + 1); }}>▶</button>
              <span className="veggie-nudge-label">Long</span>
              <button className="plank-piece-btn" aria-label="Shorter" onClick={(e) => { e.currentTarget.blur(); const st = useVeggiePlot.getState(); st.setRows(st.rows - 1); }}>▼</button>
              <button className="plank-piece-btn" aria-label="Longer" onClick={(e) => { e.currentTarget.blur(); const st = useVeggiePlot.getState(); st.setRows(st.rows + 1); }}>▲</button>
            </div>
          )}
        </div>
      )}

      {status === "predicting" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-line big">
            🧪 A potion multiplies the {round.veg}'s height by <span className="fc-value">{round.factorStr}</span>. Grow or shrink?
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useVeggiePlot.getState().predict("grow"); }}>
              ↑ Grows
            </button>
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useVeggiePlot.getState().predict("shrink"); }}>
              ↓ Shrinks
            </button>
            <button className="link-button" onClick={() => useVeggiePlot.getState().exit()}>Quit</button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useVeggiePlot} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.kind === "area" ? `${round.widthStr} × ${round.lengthStr} = ${round.productStr}` : (round.grows ? "It grows!" : "It shrinks!")}
        </RoundCelebrate>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">
            {round.kind === "potion"
              ? "Not quite! +0 pts"
              : typedCorrect === false
                ? "Not the harvest count! +0 pts"
                : "+0 pts"}
          </div>
          <div className="farm-challenge-prompt">{round.reason}</div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={(e) => { e.currentTarget.blur(); useVeggiePlot.getState().next(); }}>
              {roundIndex + 1 < VEGGIE_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🥕 The Veggie Plot — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useVeggiePlot.getState().start()}>Play again</button>
            <button className="link-button" onClick={() => useVeggiePlot.getState().exit()}>Back to the farm</button>
          </div>
        </div>
      )}
    </div>

    {/* The typing answer bar is a SIBLING of the (transformed) panel so its
        position:fixed is measured from the viewport — it pins to the BOTTOM of
        the screen, keeping the array visible. */}
    {status === "typing" && round && placeResult && (
      <div className="veggie-answer-bar">
        <div className="veggie-planted">🌱 Bed planted! +{placeResult.points} pts</div>
        <div className="veggie-answer-row">
          <span className="veggie-sentence">{round.widthStr} × {round.lengthStr} =</span>
          <FractionField key={roundIndex} wobble={inputWobble} pointsLabel={VEGGIE_TYPE_POINTS} onSubmit={submitFraction} />
        </div>
      </div>
    )}
    </>
  );
}
