import React, { useEffect } from "react";
import RoundCelebrate from "./RoundCelebrate.jsx";

import { useMilkSplitter } from "../game/milkSplitterStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import {
  MILK_ROUNDS_PER_SET,
  pourDurationMs,
  milkReasonA,
  milkReasonB,
} from "../data/farm/milkSplitterChallenge.js";
import DottedText from "./MilkNotation.jsx";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";

/**
 * MILK SPLITTER — 2D panel (F8). One-off intro card, then a slim strip; the
 * machine, chutes and jugs do the talking in-world. Wrong answers get the
 * crate-style pacing: animation → 1s beat → camera shake + reason card with
 * a manual Next. Keyboard: Enter starts/advances; Esc quits.
 */

const VERDICT_DELAY_MS = 1000;
const CELEBRATE_MS = 2200;

export default function MilkSplitterPanel() {
  const status = useMilkSplitter((s) => s.status);
  const roundIndex = useMilkSplitter((s) => s.roundIndex);
  const score = useMilkSplitter((s) => s.score);
  const bestScore = useMilkSplitter((s) => s.bestScore);
  const aCorrect = useMilkSplitter((s) => s.aCorrect);
  const bCorrect = useMilkSplitter((s) => s.bCorrect);
  const round = useMilkSplitter((s) => s.currentRound());
  const regionId = useSession((s) => s.currentRegionId);

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useMilkSplitter.getState().exit();
    }
  }, [status, regionId]);

  // Enter = start / next; Esc = quit.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useMilkSplitter.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Pour timing: run the division animation in full, then either move to
  // labelling (prediction right) or — after a 1s beat — shake + reason card.
  useEffect(() => {
    if (status !== "pouring") return undefined;
    const st = useMilkSplitter.getState();
    const r = st.currentRound();
    if (!r) return undefined;
    const animMs = pourDurationMs(r);
    if (st.aCorrect) {
      const t = setTimeout(() => st.pourDone(), animMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      playerState.camShake = { start: Date.now(), dur: 550 };
      st.pourDone(); // aCorrect false → feedback
    }, animMs + VERDICT_DELAY_MS);
    return () => clearTimeout(t);
  }, [status, roundIndex]);

  // Wrong notation choice → shake as the card appears.
  useEffect(() => {
    if (status === "feedback" && aCorrect && bCorrect === false) {
      playerState.camShake = { start: Date.now(), dur: 450 };
    }
  }, [status, aCorrect, bCorrect]);


  if (status === "idle") return null;

  const inPlay = ["predicting", "pouring", "labelling"].includes(status);

  return (
    <div className="farm-challenge-panel">
      {status === "intro" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🥛 The Milk Splitter</span>
          </div>
          <div className="farm-challenge-line big">
            The machine shares the milk by <span className="fc-value">dividing</span>.
          </div>
          <div className="farm-challenge-line">
            Predict: will each cup's share STOP, or REPEAT forever? Tap a chute —
            then pick the correct way to WRITE it.
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useMilkSplitter.getState().beginRounds();
              }}
            >
              {kh("Start! (Enter)")}
            </button>
            <button className="link-button" onClick={() => useMilkSplitter.getState().exit()}>
              Quit
            </button>
          </div>
        </div>
      )}

      {inPlay && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              🥛 Round {Math.min(roundIndex + 1, MILK_ROUNDS_PER_SET)}/{MILK_ROUNDS_PER_SET} · {score} pts
              {status === "predicting" && round ? ` — ${round.n} L, ${round.d} cups` : ""}
              {status === "labelling" ? " — how is it written?" : ""}
            </span>
            <button className="link-button" onClick={() => useMilkSplitter.getState().exit()}>
              Quit
            </button>
          </div>
          {/* Touch: the chutes + jugs are small on a phone — the same choices here. */}
          {status === "predicting" && useUI.getState().touchMode && (
            <div className="order-card-row">
              <button className="plank-piece-btn order-card-chip" onClick={(e) => { e.currentTarget.blur(); useMilkSplitter.getState().predict(true); }}>
                ✋ STOPS
              </button>
              <button className="plank-piece-btn order-card-chip" onClick={(e) => { e.currentTarget.blur(); useMilkSplitter.getState().predict(false); }}>
                🔁 REPEATS
              </button>
            </div>
          )}
          {status === "labelling" && round && useUI.getState().touchMode && (
            <div className="order-card-row">
              {round.options.map((opt, i) => (
                <button key={i} className="plank-piece-btn order-card-chip milk-notation" onClick={(e) => { e.currentTarget.blur(); useMilkSplitter.getState().chooseNotation(i); }}>
                  <DottedText text={opt} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useMilkSplitter} ms={CELEBRATE_MS}>
          {round.n} L shared by {round.d} — {round.isTerminating ? "it stops ✋" : "it repeats forever 🔁"}
        </RoundCelebrate>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className={`farm-challenge-verdict ${!aCorrect ? "bad" : "warm"}`}>
            {!aCorrect
              ? round.isTerminating
                ? "It STOPPED! ✋ +0 for the prediction"
                : "It keeps REPEATING! 🔁 +0 for the prediction"
              : "Right split — but the writing's off."}
          </div>
          <div className="farm-challenge-prompt">
            <DottedText text={!aCorrect ? milkReasonA(round) : milkReasonB(round)} />
          </div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useMilkSplitter.getState().next();
              }}
            >
              {roundIndex + 1 < MILK_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🥛 The Milk Splitter — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useMilkSplitter.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useMilkSplitter.getState().exit()}>
              Back to the farm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
