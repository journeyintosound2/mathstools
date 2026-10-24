import React, { useEffect, useRef, useState } from "react";

import { useMeadowLevel } from "../game/meadowLevelStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  MEADOW_ROUNDS_PER_SET,
  meadowCountsAfterHops,
  meadowMaxHops,
} from "../data/snow/meadowLevelChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";
import { kh } from "./keyHints.js";

/**
 * SNOWMAN MEADOW — 2D panel (ML). HOP snowballs across one tap at a time
 * (button, → or Space; ← or Backspace hops one back), watch the equation
 * chain grow, then CALL it: "They match!" (key 1) or "They can never match"
 * (key 2). Then TYPE the total via the double. Wrong total → camera shake +
 * the worked levelling on the reason card. Esc quits.
 * (2026-09-28 audit: replaced "predict the hop count first", which asked
 * Year 7s for an idea — half the difference — before they'd seen one hop.)
 */

const CELEBRATE_MS = 2200;

export default function MeadowLevelPanel() {
  const status = useMeadowLevel((s) => s.status);
  const roundIndex = useMeadowLevel((s) => s.roundIndex);
  const score = useMeadowLevel((s) => s.score);
  const bestScore = useMeadowLevel((s) => s.bestScore);
  const round = useMeadowLevel((s) => s.currentRound());
  const predictResult = useMeadowLevel((s) => s.predictResult);
  const hops = useMeadowLevel((s) => s.hops);
  const callNote = useMeadowLevel((s) => s.callNote);
  const typedCorrect = useMeadowLevel((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  // Leaving the snow world ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useMeadowLevel.getState().exit();
    }
  }, [status, regionId]);

  // Fresh input + autofocus whenever a typing phase begins.
  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  // Keys: Esc quits; Enter starts/advances; → / Space hop; ← / Backspace hop
  // back; 1 = "They match!", 2 = "They can never match".
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useMeadowLevel.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (st.status === "hopping") {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          st.hop(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "Backspace") {
          e.preventDefault();
          st.hop(-1);
          return;
        }
        if (e.key === "1") { st.call("match"); return; }
        if (e.key === "2") { st.call("cant"); return; }
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Wrong typed total → shake.
  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useMeadowLevel.getState().submitTotal(typed);
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
          icon="⛄"
          title="Snowman Meadow"
          onStart={() => useMeadowLevel.getState().beginRounds()}
          onQuit={() => useMeadowLevel.getState().exit()}
        />
      )}

      {status === "hopping" && round && (() => {
        const now = meadowCountsAfterHops(round, hops);
        return (
          <div className="farm-challenge-card">
            <SnowRoundHead
              icon="⛄"
              roundIndex={roundIndex}
              total={MEADOW_ROUNDS_PER_SET}
              score={score}
              onQuit={() => useMeadowLevel.getState().exit()}
            />
            {callNote ? (
              <div className="farm-challenge-verdict warm">{callNote}</div>
            ) : (
              <div className="snow-q">
                Make the snowmen the <span className="fc-value">same height</span>.
              </div>
            )}
            <div className="snow-sub">
              Now: {now.left} and {now.right} · {hops} hop{hops === 1 ? "" : "s"} so far
            </div>
            <div className="plank-pieces">
              <button
                className="plank-piece-btn"
                disabled={hops === 0}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useMeadowLevel.getState().hop(-1);
                }}
              >
                ↩ Hop back
              </button>
              <button
                className="plank-piece-btn"
                disabled={hops >= meadowMaxHops(round)}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useMeadowLevel.getState().hop(1);
                }}
              >
                Hop a snowball ➜
              </button>
            </div>
            <div className="plank-pieces" style={{ marginTop: 2 }}>
              <button
                className="plank-piece-btn"
                style={{ borderColor: "#2a9d2a" }}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useMeadowLevel.getState().call("match");
                }}
              >
                ⛄⛄ They match!
              </button>
              <button
                className="plank-piece-btn"
                style={{ borderColor: "#8a5fd3" }}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useMeadowLevel.getState().call("cant");
                }}
              >
                🤔 They can never match
              </button>
            </div>
          </div>
        );
      })()}

      {status === "typing" && round && (
        <div className="farm-challenge-card">
          {predictResult && (
            <div className={`farm-challenge-verdict ${predictResult.correct ? "good" : "warm"}`}>
              {predictResult.label}
            </div>
          )}
          {/* The insight, AFTER the hopping: half the gap, not the whole gap. */}
          <div className="snow-sub">
            {round.canTwin
              ? <>They were {round.diff} apart, but it took only {round.diff / 2} hop{round.diff / 2 === 1 ? "" : "s"} — every hop makes one snowman smaller AND the other bigger.</>
              : <>They were {round.diff} apart. An odd gap can't be shared evenly, so the closest is {round.level} and {round.level + 1}.</>}
          </div>
          {/* Round 2 (Jeff, 2026-09-29): answer the ORIGINAL sum — the double
              is the helper you can see, not the question. */}
          <div className="snow-q">
            <span className="fc-value">{round.left} + {round.right}</span> = ?
          </div>
          <div className="snow-sub">
            {round.canTwin
              ? <>Hint: it's the same as {round.level} + {round.level} — double {round.level}.</>
              : <>Hint: it's the same as {round.level} + {round.level + 1} — double {round.level}, plus 1.</>}
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
            <span className="weigh-unit">snowballs</span>
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useMeadowLevel} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.left} + {round.right} = {round.canTwin ? `double ${round.level}` : `double ${round.level} + 1`} = {round.total}!
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
                useMeadowLevel.getState().next();
              }}
            >
              {roundIndex + 1 < MEADOW_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>⛄ Snowman Meadow — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useMeadowLevel.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useMeadowLevel.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
