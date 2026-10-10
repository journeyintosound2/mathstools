import React, { useEffect, useRef, useState } from "react";

import { useCaveCrystals } from "../game/caveCrystalsStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  CAVE_ROUNDS_PER_SET,
  caveLightingMs,
} from "../data/snow/caveCrystalsChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * THE ICE CAVE — 2D panel (IC). CHOOSE the direction (buttons or keys 1–2:
 * count up / count back), watch the crystals glow one beat at a time, then
 * TYPE the answer — how many glows (up) or where you landed (back). Wrong
 * answer → shake + the think-addition story. Esc quits.
 */

const CELEBRATE_MS = 2200;

export default function CaveCrystalsPanel() {
  const status = useCaveCrystals((s) => s.status);
  const roundIndex = useCaveCrystals((s) => s.roundIndex);
  const score = useCaveCrystals((s) => s.score);
  const bestScore = useCaveCrystals((s) => s.bestScore);
  const round = useCaveCrystals((s) => s.currentRound());
  const chooseResult = useCaveCrystals((s) => s.chooseResult);
  const typedCorrect = useCaveCrystals((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useCaveCrystals.getState().exit();
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
      const st = useCaveCrystals.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (st.status === "choosing") {
        if (e.key === "1") st.chooseDirection("up");
        if (e.key === "2") st.chooseDirection("back");
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // The glows play one beat per crystal — then the typing box.
  useEffect(() => {
    if (status !== "lighting") return undefined;
    const st = useCaveCrystals.getState();
    const r = st.currentRound();
    const ms = r ? caveLightingMs(r, st.chosen || r.kind) : 3000;
    const t = setTimeout(() => useCaveCrystals.getState().finishLighting(), ms);
    return () => clearTimeout(t);
  }, [status, roundIndex]);

  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useCaveCrystals.getState().submitAnswer(typed);
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
          icon="🌌"
          title="The Ice Cave"
          steps={[
            <>Count <b>up</b> or count <b>back</b> — pick the quicker way.</>,
            <>The crystals light up each step. Then answer the sum.</>,
          ]}
          example="52 − 49: count up 49 → 52 = 3 steps.   52 − 3: count back 3 → 49"
          onStart={() => useCaveCrystals.getState().beginRounds()}
          onQuit={() => useCaveCrystals.getState().exit()}
        />
      )}

      {status === "choosing" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="🌌"
            roundIndex={roundIndex}
            total={CAVE_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useCaveCrystals.getState().exit()}
          />
          <div className="snow-q">
            <span className="fc-value">{round.a} − {round.b}</span> — which way is quicker?
          </div>
          <div className="plank-pieces">
            <button
              className="plank-piece-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                useCaveCrystals.getState().chooseDirection("up");
              }}
            >
              ⬆ Count UP from {round.b} to {round.a}
            </button>
            <button
              className="plank-piece-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                useCaveCrystals.getState().chooseDirection("back");
              }}
            >
              ⬇ Count BACK {round.b} from {round.a}
            </button>
          </div>
        </div>
      )}

      {status === "lighting" && round && chooseResult && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>{chooseResult.label} — watch the crystals…</span>
          </div>
        </div>
      )}

      {status === "typing" && round && (
        <div className="farm-challenge-card">
          <div className="snow-q">
            {round.kind === "up"
              ? <>Counting up from {round.b} to {round.a}: <span className="fc-value">how many steps</span>?</>
              : <>Counting back {round.b} from {round.a}: <span className="fc-value">where did you land</span>?</>}
          </div>
          <div className={`weigh-input-row${inputWobble ? " wobble" : ""}`}>
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
            <span className="weigh-unit">= {round.a} − {round.b}</span>
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useCaveCrystals} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.a} − {round.b} = {round.answer}!
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
                useCaveCrystals.getState().next();
              }}
            >
              {roundIndex + 1 < CAVE_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🌌 The Ice Cave — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useCaveCrystals.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useCaveCrystals.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
