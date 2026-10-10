import React, { useEffect, useRef, useState } from "react";

import { useColonyPairs } from "../game/colonyPairsStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  COLONY_ROUNDS_PER_SET,
  COLONY_PAIR_MS,
  COLONY_WADDLE_MS,
} from "../data/snow/colonyPairsChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * PENGUIN COLONY — 2D panel (PC). PREDICT the hiding double (buttons or
 * keys 1–4 — any TRUE form scores), watch the rows pair off one beat at a
 * time, then TYPE the total via the double. Wrong total → shake + the
 * near-double story. Esc quits; leaving the snow world exits.
 */

const CELEBRATE_MS = 2200;
const PAIR_TAIL_MS = 700;

export default function ColonyPairsPanel() {
  const status = useColonyPairs((s) => s.status);
  const roundIndex = useColonyPairs((s) => s.roundIndex);
  const score = useColonyPairs((s) => s.score);
  const bestScore = useColonyPairs((s) => s.bestScore);
  const round = useColonyPairs((s) => s.currentRound());
  const predictResult = useColonyPairs((s) => s.predictResult);
  const typedCorrect = useColonyPairs((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useColonyPairs.getState().exit();
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
      const st = useColonyPairs.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      const num = Number(e.key);
      if (st.status === "predicting" && num >= 1 && num <= 4) {
        st.choosePredict(num - 1);
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // The pairing plays out (waddle first on diff-2), then the typing box.
  useEffect(() => {
    if (status !== "pairing") return undefined;
    const r = useColonyPairs.getState().currentRound();
    if (!r) return undefined;
    const pairs = r.diff === 2 ? r.a + 1 : r.a;
    const ms = (r.diff === 2 ? COLONY_WADDLE_MS : 0) + pairs * COLONY_PAIR_MS + PAIR_TAIL_MS;
    const t = setTimeout(() => useColonyPairs.getState().finishPairing(), Math.min(ms, 9000));
    return () => clearTimeout(t);
  }, [status, roundIndex]);

  useEffect(() => {
    if (status === "feedback") {
      playerState.camShake = { start: Date.now(), dur: 500 };
    }
  }, [status, roundIndex]);


  if (status === "idle") return null;

  function submitTyped() {
    const result = useColonyPairs.getState().submitTotal(typed);
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
          icon="🐧"
          title="Penguin Colony"
          steps={[
            <>Pair up the penguins. Pick the <b>double</b> that helps.</>,
            <>Then find the total.</>,
          ]}
          example="7 + 8  →  double 7 = 14  →  14 + 1 = 15"
          onStart={() => useColonyPairs.getState().beginRounds()}
          onQuit={() => useColonyPairs.getState().exit()}
        />
      )}

      {status === "predicting" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="🐧"
            roundIndex={roundIndex}
            total={COLONY_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useColonyPairs.getState().exit()}
          />
          <div className="snow-q">{round.prompt}</div>
          <div className="plank-pieces">
            {round.options.map((o, i) => (
              <button
                key={i}
                className="plank-piece-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  useColonyPairs.getState().choosePredict(i);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "pairing" && round && predictResult && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>{predictResult.label} — watch them pair up…</span>
          </div>
        </div>
      )}

      {status === "typing" && round && (
        <div className="farm-challenge-card">
          {predictResult && (
            <div className={`farm-challenge-verdict ${predictResult.correct ? "good" : "warm"}`}>
              {predictResult.label}
            </div>
          )}
          <div className="snow-q">
            {round.diff === 0
              ? <>Perfect pairs: <span className="fc-value">double {round.a}</span>. How many penguins?</>
              : round.diff === 1
                ? <>{round.a} pairs and one left over: <span className="fc-value">double {round.a}, then +1</span>. How many penguins?</>
                : <>One waddled across, so it's {round.middleBase} + {round.middleBase}: <span className="fc-value">double {round.middleBase}</span>. How many?</>}
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
            <span className="weigh-unit">penguins</span>
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useColonyPairs} ms={CELEBRATE_MS} working={round.working || round.reason}>
              {round.a} + {round.b} = {round.total}!
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
                useColonyPairs.getState().next();
              }}
            >
              {roundIndex + 1 < COLONY_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🐧 Penguin Colony — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useColonyPairs.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useColonyPairs.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
