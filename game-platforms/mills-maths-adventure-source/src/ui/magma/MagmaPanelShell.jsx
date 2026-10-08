import React, { useEffect, useRef, useState } from "react";

import { useSession, playerState } from "../../game/sessionStore.js";
import { MAGMA_REGION_ID } from "../../data/magma/magmaLayout.js";
import { getMagmaChallenge } from "../../data/magma/magmaChallenges.js";
import { MAGMA_ROUNDS_PER_SET } from "../../data/magma/magmaRecords.js";
import { SnowIntro, SnowRoundHead, SnowWorking } from "../SnowCardParts.jsx";

/**
 * MAGMA MULTIPLES — the shared 2D card for all ten challenges. Same shape as
 * the Snowball Sums cards (bottom-docked, two-step intro + one example,
 * "Round 3 of 15 · ⭐ 50", worked steps one per line) so the three worlds
 * feel like one game. The SCENE owns the maths; this card owns the input.
 *
 * Each challenge passes:
 *   useStore   its zustand store (createMagmaStore)
 *   intro      { steps: [node, node], example: string }
 *   Play       the live-round controls (rendered under the round header)
 *   celebrate  (round, state) → the one-line "✓ …" for a full-marks round
 *   Feedback   (optional) extra lines on the feedback card
 *
 * Shared behaviour: Esc quits; Enter = Let's go / the challenge's onEnter /
 * Next; leaving the magma world exits; a wrong answer (feedback, or a "bad"
 * note) gives the camera its little shake; full-marks rounds auto-advance.
 */

const CELEBRATE_MS = 2200;

export function MagmaNote({ note }) {
  if (!note) return null;
  const cls = note.tone === "bad" ? "bad snow-shake" : note.tone === "good" ? "good" : "warm";
  return (
    <div key={note.at} className={`farm-challenge-verdict magma-note ${cls}`}>
      {note.text}
    </div>
  );
}

/**
 * A number box + Check. `onSubmit(text)` returns "invalid" | "correct" |
 * "wrong"; invalid wobbles and keeps the text, otherwise the box clears.
 */
export function MagmaNumberInput({ onSubmit, placeholder = "?", label, unit, maxLength = 7, inputMode = "numeric", autoFocus = true, width }) {
  const [text, setText] = useState("");
  const [wobble, setWobble] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoFocus, label]);
  function go() {
    const res = onSubmit(text);
    if (res === "invalid") {
      setWobble(true);
      setTimeout(() => setWobble(false), 400);
      ref.current?.focus();
      return;
    }
    setText("");
    ref.current?.focus();
  }
  return (
    <div className={`weigh-input-row magma-input-row${wobble ? " wobble" : ""}`}>
      {label && <span className="magma-input-label">{label}</span>}
      <input
        ref={ref}
        className="text-input weigh-input"
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={text}
        maxLength={maxLength}
        style={width ? { width } : undefined}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            go();
          }
        }}
      />
      {unit && <span className="weigh-unit">{unit}</span>}
      <button className="primary-button" onClick={go}>
        Check
      </button>
    </div>
  );
}

/** A big tap button that blurs itself (so Enter/Esc keep working). */
export function MagmaButton({ children, onClick, className = "plank-piece-btn", disabled, title, active }) {
  return (
    <button
      className={`${className}${active ? " active" : ""}`}
      disabled={disabled}
      title={title}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export default function MagmaPanelShell({ useStore, intro, Play, celebrate, Feedback }) {
  const status = useStore((s) => s.status);
  const roundIndex = useStore((s) => s.roundIndex);
  const score = useStore((s) => s.score);
  const bestScore = useStore((s) => s.bestScore);
  const note = useStore((s) => s.note);
  const round = useStore((s) => s.currentRound());
  const key = useStore((s) => s.key);
  const regionId = useSession((s) => s.currentRegionId);
  const meta = getMagmaChallenge(key);

  // Leaving the world ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== MAGMA_REGION_ID) useStore.getState().exit();
  }, [status, regionId, useStore]);

  // Keys: Esc quits; Enter advances.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useStore.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      const inField = e.target && /input|textarea|select/i.test(e.target.tagName || "");
      if (inField) return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "play") st.onEnter?.();
      else if (st.status === "feedback" || st.status === "celebrate") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, useStore]);

  // The wrong-answer camera wobble.
  useEffect(() => {
    if (status === "feedback") playerState.camShake = { start: Date.now(), dur: 500 };
  }, [status, roundIndex]);
  useEffect(() => {
    if (note?.tone === "bad") playerState.camShake = { start: Date.now(), dur: 380 };
  }, [note?.at, note?.tone]);

  // Full-marks rounds move on by themselves.
  useEffect(() => {
    if (status !== "celebrate") return undefined;
    const t = setTimeout(() => useStore.getState().next(), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [status, roundIndex, useStore]);

  if (status === "idle" || !meta) return null;
  const st = useStore.getState();
  const quit = () => st.exit();

  return (
    <div className="farm-challenge-panel snow-dock magma-dock">
      {status === "intro" && (
        <SnowIntro
          icon={meta.icon}
          title={meta.name}
          steps={intro.steps}
          example={intro.example}
          onStart={() => st.beginRounds()}
          onQuit={quit}
        />
      )}

      {status === "play" && round && (
        <div className="farm-challenge-card">
          <SnowRoundHead icon={meta.icon} roundIndex={roundIndex} total={MAGMA_ROUNDS_PER_SET} score={score} onQuit={quit} />
          <Play round={round} />
          <MagmaNote note={note} />
        </div>
      )}

      {status === "celebrate" && round && (
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>
              ✓ {celebrate(round, st)} · ⭐ {score}
            </span>
          </div>
        </div>
      )}

      {status === "feedback" && round && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-verdict warm">
            {st.roundPoints > 0 ? `+${st.roundPoints} this round — here's the quick way:` : "Here's how it works:"}
          </div>
          {Feedback && <Feedback round={round} />}
          <SnowWorking lines={round.working} />
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                st.next();
              }}
            >
              {roundIndex + 1 < MAGMA_ROUNDS_PER_SET ? "Next round (Enter)" : "Finish (Enter)"}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>
              {meta.icon} {meta.name} — complete!
            </span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => st.start()}>
              Play again
            </button>
            <button className="link-button" onClick={quit}>
              Back to the volcano
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
