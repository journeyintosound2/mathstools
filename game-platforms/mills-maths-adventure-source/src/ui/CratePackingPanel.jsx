import React, { useEffect, useState } from "react";
import DemoButton, { DemoRound } from "./demo/DemoButton.jsx";
import DemoStartCard from "./demo/DemoStartCard.jsx";
import { useDemo } from "../game/demo/demoStore.js";

import { useCratePacking } from "../game/cratePackingStore.js";
import { useSession, playerState } from "../game/sessionStore.js";
import { CRATE_ROUNDS_PER_SET } from "../data/farm/cratePackingChallenge.js";
import { kh } from "./keyHints.js";
import { useUI } from "./effects/uiStore.js";
import { CRATE_SIZES } from "../data/farm/farmLayout.js";

/**
 * CRATE PACKING — 2D panel (F6, v5). The instruction card shows ONCE at the
 * start; during play only a slim header strip remains so the fruit is never
 * covered.
 *
 * Feedback pacing (teacher feedback): the partition/remainder animation
 * always plays out IN FULL first. A correct (HCF) round then auto-advances.
 * A WRONG round (spill OR a smaller common factor) waits 1s after the
 * animation, SHAKES the camera, and shows a small reason card with a Next
 * button — no auto-advance, the student reads the why.
 * Keyboard: Enter starts (intro) / advances (feedback); Esc quits.
 */

const STAGGER_MS = 50; // must match STAGGER in CratePackingChallenge.jsx
const TRAVEL_MS = 900; // approx flight time of the last fruit
const VERDICT_DELAY_MS = 1000; // beat between animation end and the verdict

function animationMs(round) {
  return Math.max(round.n1, round.n2) * STAGGER_MS + TRAVEL_MS;
}

export default function CratePackingPanel() {
  const status = useCratePacking((s) => s.status);
  const roundIndex = useCratePacking((s) => s.roundIndex);
  const score = useCratePacking((s) => s.score);
  const bestScore = useCratePacking((s) => s.bestScore);
  const regionId = useSession((s) => s.currentRegionId);
  const last = useCratePacking((s) => s.lastResult());
  const lastFeedback = useCratePacking.getState().lastFeedback();
  const [showVerdict, setShowVerdict] = useState(false);

  // Leaving the farm ends the challenge.
  useEffect(() => {
    if (status !== "idle" && regionId !== "farm-parts-whole") {
      useCratePacking.getState().exit();
    }
  }, [status, regionId]);

  // Enter = start (intro) / skip (feedback). Esc = quit.
  useEffect(() => {
    if (status === "idle") return undefined;
    function onKey(e) {
      const st = useCratePacking.getState();
      if (e.key === "Escape") {
        st.exit();
        return;
      }
      if (e.key !== "Enter") return;
      if (st.status === "intro") st.beginRounds();
      else if (st.status === "feedback") st.next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Feedback pacing: animation first, always. Then HCF → auto-next;
  // wrong (spill or non-HCF common factor) → 1s beat, camera shake, and the
  // reason card (manual Next).
  useEffect(() => {
    if (status !== "feedback") {
      setShowVerdict(false);
      return undefined;
    }
    const st = useCratePacking.getState();
    const lastR = st.lastResult();
    if (!lastR) return undefined;
    const animMs = animationMs(lastR.round);
    if (lastR.grade.result === "hcf") {
      // (The last example of a demo holds here under its "Your turn!" card.)
      const t = setTimeout(() => { if (!useDemo.getState().hold) st.next(); }, animMs + 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      playerState.camShake = { start: Date.now(), dur: 550 };
      setShowVerdict(true);
    }, animMs + VERDICT_DELAY_MS);
    return () => clearTimeout(t);
  }, [status, roundIndex]);

  if (status === "idle") return null;

  return (
    <div className="farm-challenge-panel">
      {/* The ready card (2026-10-24): the live demo teaches the rules now
          (game/demo/scripts/farmDemos.js) — no written instructions. */}
      {status === "intro" && (
        <DemoStartCard
          icon="📦"
          title="Crate Packing"
          onStart={() => useCratePacking.getState().beginRounds()}
          onQuit={() => useCratePacking.getState().exit()}
        />
      )}

      {(status === "choosing" || status === "feedback") && !showVerdict && (
        /* Slim strip only — the world stays visible; results play in-world. */
        <div className="farm-challenge-card mini">
          <div className="farm-challenge-head">
            <span>📦 <DemoRound>Round {Math.min(roundIndex + 1, CRATE_ROUNDS_PER_SET)}/{CRATE_ROUNDS_PER_SET} · {score} pts</DemoRound></span>
            <DemoButton />
            <button className="link-button" onClick={() => useCratePacking.getState().exit()}>
              Quit
            </button>
          </div>
          {/* Touch: the crates are small on a phone — pick a group size here too. */}
          {status === "choosing" && useUI.getState().touchMode && (
            <div className="order-card-row" role="group" aria-label="Group sizes">
              {CRATE_SIZES.map((size) => (
                <button
                  key={size}
                  className="plank-piece-btn order-card-chip"
                  onClick={(e) => { e.currentTarget.blur(); useCratePacking.getState().choose(size); }}
                >
                  groups of {size}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "feedback" && showVerdict && last && (
        /* The reason card — appears AFTER the reveal + a 1s beat, with the
           camera shake. Manual Next so the why gets read. */
        <div className="farm-challenge-card">
          <div className={`farm-challenge-verdict ${last.grade.result === "common" ? "warm" : "bad"}`}>
            {last.grade.result === "common"
              ? `It splits… but a bigger size works! +${last.grade.points} pts`
              : "Leftovers! That size doesn't fit. +0 pts"}
          </div>
          <div className="farm-challenge-prompt">{lastFeedback}</div>
          <div className="farm-challenge-buttons">
            <button
              className="primary-button"
              onClick={(e) => {
                e.currentTarget.blur();
                useCratePacking.getState().next();
              }}
            >
              {roundIndex + 1 < CRATE_ROUNDS_PER_SET ? kh("Next round (Enter)") : kh("Finish (Enter)")}
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="farm-challenge-card">
          <div className="farm-challenge-head">
            <span>📦 Crate Packing — complete!</span>
          </div>
          <div className="farm-challenge-prompt">
            You scored {score} points. Best so far: {Math.max(bestScore, score)} points.
          </div>
          <div className="farm-challenge-buttons">
            <button className="primary-button" onClick={() => useCratePacking.getState().start()}>
              Play again
            </button>
            <button className="link-button" onClick={() => useCratePacking.getState().exit()}>
              Back to the farm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
