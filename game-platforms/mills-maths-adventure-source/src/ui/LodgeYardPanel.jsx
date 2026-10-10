import React, { useEffect, useRef, useState } from "react";

import { useLodgeYard } from "../game/lodgeYardStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { YARD_ROUNDS_PER_SET, YARD_COINS, yardTillAfter } from "../data/snow/lodgeYardChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * THE LODGE YARD — 2D panel (LY). Round 2 (2026-09-29): tap COINS to count
 * up from the price to $1 — each coin is a jump on the board's number line
 * and "Total so far" climbs (65c → 70c → 100c). Undo takes a coin back.
 * "Give the change" works only on exactly 100c; then say how much change
 * that was. Esc quits; leaving the snow world exits.
 */

const CELEBRATE_MS = 2200;

export default function LodgeYardPanel() {
  const status = useLodgeYard((s) => s.status);
  const roundIndex = useLodgeYard((s) => s.roundIndex);
  const score = useLodgeYard((s) => s.score);
  const bestScore = useLodgeYard((s) => s.bestScore);
  const round = useLodgeYard((s) => s.currentRound());
  const coins = useLodgeYard((s) => s.coins);
  const note = useLodgeYard((s) => s.note);
  const typedCorrect = useLodgeYard((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useLodgeYard.getState().exit();
    }
  }, [status, regionId]);

  // Fresh input + autofocus at each typed step.
  useEffect(() => {
    if (status === "typing") {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [status, roundIndex]);

  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useLodgeYard.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (st.status === "paying" && e.key === "Backspace") {
        st.undoCoin();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "paying") st.giveChange();
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

  useEffect(() => {
    if (note?.tone === "bad") playerState.camShake = { start: Date.now(), dur: 350 };
  }, [note?.at, note?.tone]);


  if (status === "idle") return null;

  const till = round ? yardTillAfter(round, coins) : 0;

  function wobble() {
    setInputWobble(true);
    setTimeout(() => setInputWobble(false), 400);
    inputRef.current?.focus();
  }

  function submitCurrent() {
    const st = useLodgeYard.getState();
    let result = "invalid";
    if (st.status === "typing") result = st.submitChange(typed);
    if (result === "invalid") wobble();
  }

  return (
    <div className="farm-challenge-panel snow-dock">
      {status === "intro" && (
        <SnowIntro
          icon="☕"
          title="The Lodge Yard"
          steps={[
            <>A hot chocolate costs less than $1. You pay with <b>$1 (100c)</b>.</>,
            <>Use coins to <b>count up</b> from the price to 100c. That's your change!</>,
          ]}
          example="65c + 5c → 70c,  + 10c + 20c → 100c.  Change: 35c"
          onStart={() => useLodgeYard.getState().beginRounds()}
          onQuit={() => useLodgeYard.getState().exit()}
        />
      )}

      {status === "paying" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="☕"
            roundIndex={roundIndex}
            total={YARD_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useLodgeYard.getState().exit()}
          />
          <div className="snow-q">
            Count up from <span className="fc-value">{round.price}c</span> to <span className="fc-value">100c</span>
          </div>
          <div className="yard-coins">
            {YARD_COINS.map((c) => (
              <button
                key={c}
                className={`yard-coin${c === 1 ? "" : " silver"}${c < 10 ? " small" : ""}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  useLodgeYard.getState().addCoin(c);
                }}
              >
                {c}c
              </button>
            ))}
          </div>
          <div className="yard-total">
            Total so far:{" "}
            <span className={till > 100 ? "over" : ""}>
              {coins.length ? `${round.price}c ${coins.map((c) => `+ ${c}c`).join(" ")} = ${till}c` : `${round.price}c`}
            </span>
          </div>
          {note && (
            <div key={note.at} className={`farm-challenge-verdict ${note.tone === "bad" ? "bad snow-shake" : "warm"}`}>
              {note.text}
            </div>
          )}
          <div className="farm-challenge-buttons">
            <button
              className="plank-piece-btn"
              disabled={!coins.length}
              onClick={(e) => {
                e.currentTarget.blur();
                useLodgeYard.getState().undoCoin();
              }}
            >
              ↩ Take one back
            </button>
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useLodgeYard.getState().giveChange();
              }}
            >
              💰 Give the change (Enter)
            </button>
          </div>
        </div>
      )}

      {status === "typing" && round && (
        <div className="farm-challenge-card">
          {note && <div className={`farm-challenge-verdict ${note.tone}`}>{note.text}</div>}
          <div className="snow-q">
            {coins.map((c) => `${c}c`).join(" + ")} — how much change is that?
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
              onKeyDown={(e) => e.key === "Enter" && submitCurrent()}
            />
            <span className="weigh-unit">cents</span>
            <button className="primary-button" onClick={submitCurrent}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useLodgeYard} ms={CELEBRATE_MS} working={round.working || round.reason}>
              Your change is {round.change}c — enjoy the hot chocolate!
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
                useLodgeYard.getState().next();
              }}
            >
              {roundIndex + 1 < YARD_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>☕ The Lodge Yard — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useLodgeYard.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useLodgeYard.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
