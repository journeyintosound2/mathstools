import React, { useEffect, useRef, useState } from "react";

import { useAuroraLookout } from "../game/auroraLookoutStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  LOOKOUT_ROUNDS_PER_SET,
} from "../data/snow/auroraLookoutChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * AURORA LOOKOUT — 2D panel (AL). Round 2 (2026-09-29): three BIG tiles,
 * each THIS sum rewritten a different way (all correct) — "which way is
 * easiest?" (click or keys 1–3). Then the student does the sum the way THEY
 * picked, one small step per line, typing the last one. Wrong answer →
 * shake + the easiest way worked through. Esc quits.
 */

const CELEBRATE_MS = 2400;

export default function AuroraLookoutPanel() {
  const status = useAuroraLookout((s) => s.status);
  const roundIndex = useAuroraLookout((s) => s.roundIndex);
  const score = useAuroraLookout((s) => s.score);
  const bestScore = useAuroraLookout((s) => s.bestScore);
  const round = useAuroraLookout((s) => s.currentRound());
  const pickResult = useAuroraLookout((s) => s.pickResult);
  const picked = round && pickResult ? (round.choices || []).find((c) => c.key === pickResult.key) : null;
  const typedCorrect = useAuroraLookout((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useAuroraLookout.getState().exit();
    }
  }, [status, regionId]);

  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useAuroraLookout.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      const num = Number(e.key);
      const offered = st.currentRound()?.options || [];
      if (st.status === "picking" && num >= 1 && num <= offered.length) {
        st.choosePick(offered[num - 1]);
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useAuroraLookout.getState().submitAnswer(typed);
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
          icon="✨"
          title="Aurora Lookout"
          steps={[
            <>The lights write a sum in the sky. There are three ways to do it — they all work!</>,
            <>Pick the <b>easiest</b> way, then do the sum.</>,
          ]}
          example="47 + 29 → 47 + 30 − 1 → 77 − 1 = 76"
          onStart={() => useAuroraLookout.getState().beginRounds()}
          onQuit={() => useAuroraLookout.getState().exit()}
        />
      )}

      {status === "picking" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="✨"
            roundIndex={roundIndex}
            total={LOOKOUT_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useAuroraLookout.getState().exit()}
          />
          <div className="snow-q snow-big-sum">{round.expr}</div>
          <div className="snow-sub">Which way is easiest?</div>
          <div className="snow-choices">
            {(round.choices || []).map((c, i) => (
              <button
                key={c.key}
                className="snow-choice"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useAuroraLookout.getState().choosePick(c.key);
                }}
              >
                <span className="snow-choice-sum" style={c.show.length > 12 ? { fontSize: "1.3rem" } : undefined}>{c.show.replace(/ ([+−=]) /g, "\u00a0$1\u00a0")}</span>
                <small>
                  {i + 1}. {c.label}
                </small>
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "typing" && round && pickResult && (
        <div className="farm-challenge-card">
          <div className={`farm-challenge-verdict ${pickResult.best ? "good" : "warm"}`}>{pickResult.label}</div>
          <div className="snow-sub">
            {round.expr} → <b>{(picked || round.choices[0]).show}</b>
          </div>
          <div className="snow-exec">
            {(picked || round.choices[0]).steps.map((line, i, all) =>
              i < all.length - 1 ? (
                <div key={i} className="snow-exec-line">{line}</div>
              ) : (
                <div key={i} className={`snow-exec-line weigh-input-row${inputWobble ? " wobble" : ""}`}>
                  <span>{line.replace(/\s*\?$/, "")}</span>
                  <input
                    ref={inputRef}
                    className="text-input weigh-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="?"
                    value={typed}
                    maxLength={3}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                  />
                  <button className="primary-button" onClick={submitTyped}>
                    Check
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useAuroraLookout} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.expr} = {round.answer}
              {pickResult && !pickResult.best ? ` · easiest: ${round.choices.find((c) => c.key === round.best).show}` : ""}
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
                useAuroraLookout.getState().next();
              }}
            >
              {roundIndex + 1 < LOOKOUT_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>✨ Aurora Lookout — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points. You know lots of ways to add and take away!
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useAuroraLookout.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useAuroraLookout.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
