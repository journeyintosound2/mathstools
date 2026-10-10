import React, { useEffect, useRef, useState } from "react";

import { useVillageSplit } from "../game/villageSplitStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { VILLAGE_ROUNDS_PER_SET, villageSite } from "../data/snow/villageSplitChallenge.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "./SnowCardParts.jsx";
import RoundCelebrate from "./RoundCelebrate.jsx";

/**
 * IGLOO VILLAGE — 2D panel (VG). Round 2 (2026-09-29): no multiple-choice
 * steps. The student BUILDS the sum — "Move a ten" / "Move a one" from each
 * igloo (or tap the blocks in the world), "Swap 10 ones for a ten" when the
 * middle pile reaches ten, then "Done!". Then they type a + b. A missed swap
 * shakes and says what to do. Esc quits; leaving the snow world exits.
 */

const CELEBRATE_MS = 2200;

/** One source igloo's controls (compact: label over two side-by-side buttons). */
function IglooControls({ label, side, round, moved }) {
  const st = useVillageSplit.getState;
  const tensLeft = round["t" + side] - moved["t" + side];
  const onesLeft = round["o" + side] - moved["o" + side];
  return (
    <div className="snow-village-col">
      <div className="snow-village-label">{label}</div>
      <div className="snow-village-btns">
        <button
          className="plank-piece-btn"
          disabled={tensLeft === 0}
          onClick={(e) => {
            e.currentTarget.blur();
            st().moveBlock(side, "ten");
          }}
        >
          ➡ a ten <small>({tensLeft})</small>
        </button>
        <button
          className="plank-piece-btn"
          disabled={onesLeft === 0}
          onClick={(e) => {
            e.currentTarget.blur();
            st().moveBlock(side, "one");
          }}
        >
          ➡ a one <small>({onesLeft})</small>
        </button>
      </div>
    </div>
  );
}

export default function VillageSplitPanel() {
  const status = useVillageSplit((s) => s.status);
  const roundIndex = useVillageSplit((s) => s.roundIndex);
  const score = useVillageSplit((s) => s.score);
  const bestScore = useVillageSplit((s) => s.bestScore);
  const round = useVillageSplit((s) => s.currentRound());
  const moved = useVillageSplit((s) => s.moved);
  const regrouped = useVillageSplit((s) => s.regrouped);
  const buildNote = useVillageSplit((s) => s.buildNote);
  const typedCorrect = useVillageSplit((s) => s.typedCorrect);
  const regionId = useSession((s) => s.currentRegionId);
  const [typed, setTyped] = useState("");
  const [inputWobble, setInputWobble] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status !== "idle" && regionId !== "snow-sums") {
      useVillageSplit.getState().exit();
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
      const st = useVillageSplit.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      const typingInField = e.target && /input|textarea/i.test(e.target.tagName || "");
      if (typingInField) return;
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "building") st.finishBuild();
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
    if (buildNote?.tone === "bad") playerState.camShake = { start: Date.now(), dur: 400 };
  }, [buildNote?.at, buildNote?.tone]);


  if (status === "idle") return null;

  const site = round ? villageSite(round, moved, regrouped) : { tens: 0, ones: 0 };

  function submitTyped() {
    const result = useVillageSplit.getState().submitTotal(typed);
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
          icon="🧊"
          title="Igloo Village"
          steps={[
            <>Move the <b>tens</b> and <b>ones</b> from both igloos into the middle igloo (tap them, or use the buttons).</>,
            <>10 ones or more? <b>Swap 10 ones for a ten!</b> Then say how many.</>,
          ]}
          example="38 + 25 → 5 tens + 13 ones → 6 tens + 3 ones = 63"
          onStart={() => useVillageSplit.getState().beginRounds()}
          onQuit={() => useVillageSplit.getState().exit()}
        />
      )}

      {status === "building" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead
            icon="🧊"
            roundIndex={roundIndex}
            total={VILLAGE_ROUNDS_PER_SET}
            score={score}
            onQuit={() => useVillageSplit.getState().exit()}
          />
          <div className="snow-q">
            Build <span className="fc-value">{round.a}</span> + <span className="fc-value">{round.b}</span> in the middle igloo
          </div>
          <div className="snow-village-cols">
            <IglooControls label={`Igloo ${round.a}`} side="a" round={round} moved={moved} />
            <div className="snow-village-col snow-village-mid">
              <div className="snow-village-label">
                Middle: <span className="snow-village-count">{site.tens} ten{site.tens === 1 ? "" : "s"} · {site.ones} one{site.ones === 1 ? "" : "s"}</span>
              </div>
              <div className="snow-village-btns">
                <button
                  className="plank-piece-btn"
                  disabled={regrouped || site.ones < 10}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    useVillageSplit.getState().regroup();
                  }}
                >
                  🔄 10 ones → 1 ten
                </button>
                <button
                  className="primary-button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    useVillageSplit.getState().finishBuild();
                  }}
                >
                  ✅ Done!
                </button>
              </div>
            </div>
            <IglooControls label={`Igloo ${round.b}`} side="b" round={round} moved={moved} />
          </div>
          {buildNote && (
            <div
              key={buildNote.at}
              className={`farm-challenge-verdict ${buildNote.tone === "bad" ? "bad snow-shake" : "warm"}`}
            >
              {buildNote.text}
            </div>
          )}
        </div>
      )}

      {status === "typing" && round && (
        <div className="farm-challenge-card">
          {buildNote && <div className={`farm-challenge-verdict ${buildNote.tone}`}>{buildNote.text}</div>}
          <div className="snow-q">
            {round.a} + {round.b} = ?
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
            <button className="primary-button" onClick={submitTyped}>
              Check
            </button>
          </div>
        </div>
      )}

      {status === "celebrate" && round && (
        <RoundCelebrate useStore={useVillageSplit} ms={CELEBRATE_MS} working={round.working || round.reason}>
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
                useVillageSplit.getState().next();
              }}
            >
              {roundIndex + 1 < VILLAGE_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>🧊 Igloo Village — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useVillageSplit.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useVillageSplit.getState().exit()}>
              Back to the snow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
