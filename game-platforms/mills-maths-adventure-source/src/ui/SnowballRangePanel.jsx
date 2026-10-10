import React, { useEffect, useRef, useState } from "react";

import { useSnowballRange } from "../game/snowballRangeStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { RANGE_ROUNDS_PER_SET } from "../data/snow/snowballRangeChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * SNOWBALL RANGE — 2D panel (SR). Weigh-Station pacing: SPLIT the handful
 * (tap a gap in the 3D row, or nudge with ← →) then "Throw!" for the exact
 * split points, then TYPE the finished total into the input box. Correct
 * typing → celebrate auto-advances; wrong → camera shake + reason card.
 * Esc quits; leaving the snow world auto-exits.
 */

const CELEBRATE_MS = 2000;

export default function SnowballRangePanel() {
  const status = useSnowballRange((s) => s.status);
  const roundIndex = useSnowballRange((s) => s.roundIndex);
  const score = useSnowballRange((s) => s.score);
  const bestScore = useSnowballRange((s) => s.bestScore);
  const round = useSnowballRange((s) => s.currentRound());
  const splitResult = useSnowballRange((s) => s.splitResult);
  const attempts = useSnowballRange((s) => s.attempts);
  const typedCorrect = useSnowballRange((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  // Leaving the snow world ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useSnowballRange.getState().exit();
    }
  }, [status, regionId]);

  // Fresh input + autofocus whenever a typing phase begins.
  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  // Keys: Esc quits; Enter starts/throws/advances; ← → nudge the divider.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useSnowballRange.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (st.status === "splitting" && !typingInField) {
        if (e.key === "ArrowLeft") st.setSplit(st.splitIndex - 1);
        if (e.key === "ArrowRight") st.setSplit(st.splitIndex + 1);
      }
      if (e.key !== "Enter" || typingInField) return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "splitting") st.throwSplit();
      else if (st.status === "missed") st.retrySplit();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Wrong typed answer, or a throw that didn't fill the frame → shake.
  useEffect(() => {
    if (status === "feedback" || status === "missed") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex, attempts]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useSnowballRange.getState().submitSum(typed);
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
          icon="❄️"
          title="The Snowball Range"
          steps={[
            <>Move the <b style={{ color: "#e04747" }}>red pole</b> to fill the crate to <b>exactly 10</b>, then Throw.</>,
            <>Then say how many snowballs there are altogether.</>,
          ]}
          example="8 + 5  →  8 + 2 = 10  →  10 + 3 = 13"
          onStart={() => useSnowballRange.getState().beginRounds()}
          onQuit={() => useSnowballRange.getState().exit()}
        />
      )}

      {status === "splitting" && round && (
        <div className="farm-challenge-card">
          {/* The counts and the sum live in the 3D scene (the crate, the
              pole, the chip above). The card asks ONE question. */}
          <SnowRoundHead
            icon="❄️"
            roundIndex={roundIndex}
            total={RANGE_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useSnowballRange.getState().exit()}
          />
          <div className="snow-q">How many snowballs will fill the crate?</div>
          <div className="snow-sub">
            Drag the red pole (or use ← →). Balls on its left go in the crate.
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useSnowballRange.getState().throwSplit();
              }}
            >
              Throw! (Enter)
            </button>
          </div>
        </div>
      )}

      {/* MISSED — the frame isn't full, so the round does not move on. The
          crate is showing the gaps (or the bounced surplus) behind this card;
          the student re-splits and throws again. From here the sockets
          preview the fill live, so the second go is supported. */}
      {status === "missed" && round && splitResult && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict warm">{splitResult.label}</div>
          <div className="snow-q">
            Fill the crate to exactly <span className="fc-value">{round.nextTen}</span> first.
          </div>
          <div className="snow-sub">
            {splitResult.short
              ? "Count the empty spaces — that's how many to throw into the crate."
              : "Only the empty spaces can take a snowball. Throw fewer."}
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useSnowballRange.getState().retrySplit();
              }}
            >
              Try again (Enter)
            </button>
            <button className="link-button" onClick={() => useSnowballRange.getState().exit()}>
              Quit
            </button>
          </div>
        </div>
      )}

      {status === "typing" && round && splitResult && (
        <div className="farm-challenge-card">
          <div className={`farm-challenge-verdict ${splitResult.correct ? "good" : "warm"}`}>
            {splitResult.label}
          </div>
          {/* The sum itself is on the crate ("18 + 7 → 20 + 5"), so the card
              only asks the question and takes the answer. */}
          <div className="snow-q">How many snowballs altogether?</div>
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
            <span className="weigh-unit">snowballs</span>
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useSnowballRange} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.start} + {round.comp} = {round.nextTen}, then + {round.rest} = {round.sum}!
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
                useSnowballRange.getState().next();
              }}
            >
              {roundIndex + 1 < RANGE_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>❄️ The Snowball Range — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useSnowballRange.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useSnowballRange.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
