import React, { useEffect, useRef, useState } from "react";

import { useSledSlope } from "../game/sledSlopeStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  SLED_ROUNDS_PER_SET,
  SLED_MAX_SLIDES,
} from "../data/snow/sledSlopeChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";
import { kh } from "./keyHints.js";

/**
 * SLEDDING SLOPE — 2D panel (SL). (The rope thought-experiment was retired
 * in the 2026-09-28 audit.) SLIDE the roped pair with the nudge buttons (or
 * ↓/→ down 1, ↑/← up 1) until the back sled sits on a decade, RACE! to
 * confirm, then TYPE the difference. Wrong difference → camera shake + the
 * constant-difference story on the reason card. Esc quits.
 */

const CELEBRATE_MS = 2600;


export default function SledSlopePanel() {
  const status = useSledSlope((s) => s.status);
  const roundIndex = useSledSlope((s) => s.roundIndex);
  const score = useSledSlope((s) => s.score);
  const bestScore = useSledSlope((s) => s.bestScore);
  const round = useSledSlope((s) => s.currentRound());
  const slid = useSledSlope((s) => s.slid);
  const slidesUsed = useSledSlope((s) => s.slidesUsed);
  const slideResult = useSledSlope((s) => s.slideResult);
  const typedCorrect = useSledSlope((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  // Leaving the snow world ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useSledSlope.getState().exit();
    }
  }, [status, regionId]);

  // Fresh input + autofocus whenever a typing phase begins.
  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  // Keys: Esc quits; Enter starts/races/advances; arrows nudge (→/↑ +1, ←/↓ −1).
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useSledSlope.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (st.status === "sliding") {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          st.nudge(1);
          return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          st.nudge(-1);
          return;
        }
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "sliding") st.confirmSlide();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Wrong typed difference → shake.
  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useSledSlope.getState().submitDiff(typed);
    if (result === "invalid") {
      setInputWobble(true);
      setTimeout(() => setInputWobble(false), 400);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="farm-challenge-panel snow-dock">
      {status === "intro" && (
        <SnowIntro
          icon="🛷"
          title="Sledding Slope"
          steps={[
            <>Slide both sleds until the smaller number is a <b>tens number</b>.</>,
            <>The rope never stretches, so the gap stays the same. Now find it!</>,
          ]}
          example="62 − 29  =  63 − 30  =  33"
          onStart={() => useSledSlope.getState().beginRounds()}
          onQuit={() => useSledSlope.getState().exit()}
        />
      )}

      {status === "sliding" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="🛷"
            roundIndex={roundIndex}
            total={SLED_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useSledSlope.getState().exit()}
          />
          <div className="snow-q">
            <span className="fc-value">{round.a + slid} − {round.b + slid}</span>
          </div>
          <div className="snow-sub">
            Slide both sleds until the smaller number is a tens number (like 30).
          </div>
          <div className="plank-pieces">
            <button
              className="plank-piece-btn"
              disabled={slidesUsed >= SLED_MAX_SLIDES}
              onClick={(e) => {
                e.currentTarget.blur();
                useSledSlope.getState().nudge(-1);
              }}
            >
              ◀ Both −1
            </button>
            <button
              className="plank-piece-btn"
              disabled={slidesUsed >= SLED_MAX_SLIDES}
              onClick={(e) => {
                e.currentTarget.blur();
                useSledSlope.getState().nudge(1);
              }}
            >
              Both +1 ▶
            </button>
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useSledSlope.getState().confirmSlide();
              }}
            >
              {kh("That's it! (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "typing" && round && slideResult && (
        <div className="farm-challenge-card">
          <div className={`farm-challenge-verdict ${slideResult.correct ? "good" : "warm"}`}>
            {slideResult.label}

          </div>
          <div className="snow-q">
            {round.a + slid} − {round.b + slid} = ? What is the gap?
          </div>
          <div className={`weigh-input-row${inputWobble ? " wobble" : ""}`}>
            <input
              ref={inputRef}
              className="text-input weigh-input"
              type="text"
              inputMode="numeric"
              placeholder="?"
              value={typed}
              maxLength={4}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            />
            <span className="weigh-unit">apart</span>
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useSledSlope} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.a} − {round.b} = {round.gap} — and they're off! 🛷🛷
        </RoundCelebrate>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict bad">
            {typedCorrect === false ? "Not quite — here's how it works:" : "Here's how it works:"}
          </div>
          <SnowWorking lines={round.working} />
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useSledSlope.getState().next();
              }}
            >
              {roundIndex + 1 < SLED_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🛷 Sledding Slope — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useSledSlope.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useSledSlope.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
