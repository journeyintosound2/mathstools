import React, { useEffect, useRef, useState } from "react";

import { useUI } from "./effects/uiStore.js";
import { useSession, touchInput, playerState, clearMoveTarget } from "../game/sessionStore.js";
import { claimPointer } from "../game/touchGesture.js";
import { getInteractable } from "../data/interactables.js";
import { triggerInteraction } from "../game/interaction.js";
import { useFarmChallengeActive } from "../game/farmChallengeActive.js";
import { Bi } from "../i18n/i18n.jsx";
import { useProgress } from "../progress/store.js";
import { actionIcon, actionText } from "./touchActionLabel.js";

/**
 * PHONE / iPad CONTROLS (rebuilt 2026-10-11 — Jeff: "you can't run, or
 * interact (talk) with characters" on a phone or iPad).
 *
 *   LEFT THUMB   a floating JOYSTICK: put your thumb down anywhere in the
 *                lower-left of the screen and push. A small push walks, a
 *                push to the rim RUNS (the ring turns orange). Camera-
 *                relative, exactly like WASD.
 *   RIGHT THUMB  DRAG anywhere else on the 3D view to swing the camera
 *                round (replaces the old ⟲ ⟳ buttons).
 *   TAP          the ground to walk there (a long way → you run), or a
 *                character / its name badge to go and talk to them.
 *   BUTTONS      Jump, and a big TALK / OPEN button whenever you're standing
 *                by someone or something (the touch version of E).
 *
 * The joystick + drag read raw pointer events on the canvas, so a tap still
 * reaches the 3D world (game/touchGesture.js decides tap vs drag). Nothing
 * here re-renders per move: the knob is moved through refs.
 */

const RUN_AT = 0.9; // fraction of the joystick's reach that starts a run
const YAW_PER_SCREEN = 4.2; // radians of camera swing for a full-width drag
const PITCH_PER_SCREEN = 2.2; // first-person view: radians of tilt for a full-height drag

function inJoystickZone(x, y, w, h) {
  const portrait = h > w;
  return x < w * (portrait ? 0.5 : 0.42) && y > h * (portrait ? 0.32 : 0.28);
}

function joyRadius() {
  const m = Math.min(window.innerWidth, window.innerHeight);
  return Math.round(Math.max(44, Math.min(64, m * 0.12)));
}

function holdHandlers(set) {
  return {
    onPointerDown: (e) => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); set(true); },
    onPointerUp: () => set(false),
    onPointerCancel: () => set(false),
    onLostPointerCapture: () => set(false),
    onContextMenu: (e) => e.preventDefault(),
  };
}

export default function TouchControls() {
  const touchMode = useUI((s) => s.touchMode);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const mapOpen = useUI((s) => s.mapOpen);
  const wallView = useUI((s) => s.wallView);
  const blocked = !touchMode || Boolean(activeEncounterId) || mapOpen || Boolean(wallView);

  // What the Player allows right now (joystick? camera drag? jump?).
  const [caps, setCaps] = useState(() => ({ ...playerState.touchCaps }));
  useEffect(() => {
    if (!touchMode) return undefined;
    const id = setInterval(() => {
      const c = playerState.touchCaps;
      setCaps((p) => (p.walk === c.walk && p.walkAxis === c.walkAxis && p.orbit === c.orbit && p.jump === c.jump && p.look === c.look ? p : { ...c }));
    }, 150);
    return () => clearInterval(id);
  }, [touchMode]);
  const capsRef = useRef(caps);
  capsRef.current = caps;
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  // ---- joystick + camera drag (raw pointer events on the 3D canvas) ------
  const [joy, setJoy] = useState(null); // { x, y, r } while a thumb is on it
  const [running, setRunning] = useState(false);
  const knobRef = useRef(null);
  const joyPtr = useRef(null); // { id, x0, y0, r, shown }
  const camPtrs = useRef(new Map()); // id → { lastX, x0, y0, claimed }
  const [usedJoy, setUsedJoy] = useState(false);

  useEffect(() => {
    if (!touchMode) return undefined;
    const resetJoy = () => {
      joyPtr.current = null;
      touchInput.moveX = 0;
      touchInput.moveY = 0;
      touchInput.run = false;
      setJoy(null);
      setRunning(false);
    };
    const onDown = (e) => {
      if (blockedRef.current) return;
      const t = e.target;
      const onCanvas = t && t.tagName === "CANVAS" && t.closest && t.closest(".game-shell");
      if (!onCanvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const c = capsRef.current;
      if (c.walk && !joyPtr.current && inJoystickZone(e.clientX, e.clientY, w, h)) {
        const r = joyRadius();
        // Keep the whole base on screen.
        const pad = r + 14;
        const x0 = Math.min(w - pad, Math.max(pad, e.clientX));
        const y0 = Math.min(h - pad, Math.max(pad, e.clientY));
        joyPtr.current = { id: e.pointerId, x0, y0, r, shown: false, sx: e.clientX, sy: e.clientY };
        return;
      }
      if (c.orbit || c.look) camPtrs.current.set(e.pointerId, { lastX: e.clientX, lastY: e.clientY, x0: e.clientX, y0: e.clientY, claimed: false });
    };
    const onMove = (e) => {
      const j = joyPtr.current;
      if (j && e.pointerId === j.id) {
        if (!j.shown) {
          // Only show + take over once the thumb really pushes (a tap in the
          // zone is still a tap on the world).
          if (Math.hypot(e.clientX - j.sx, e.clientY - j.sy) < 8) return;
          j.shown = true;
          claimPointer(e.pointerId);
          clearMoveTarget();
          setJoy({ x: j.x0, y: j.y0, r: j.r });
          setUsedJoy(true);
        }
        let dx = e.clientX - j.x0;
        let dy = e.clientY - j.y0;
        const d = Math.hypot(dx, dy);
        if (d > j.r) { dx *= j.r / d; dy *= j.r / d; }
        const vx = dx / j.r;
        const vy = dy / j.r;
        const axisX = capsRef.current.walkAxis === "x";
        touchInput.moveX = vx;
        touchInput.moveY = axisX ? 0 : -vy;
        const mag = axisX ? Math.abs(vx) : Math.hypot(vx, vy);
        const run = !axisX && mag >= RUN_AT;
        if (run !== touchInput.run) { touchInput.run = run; setRunning(run); }
        if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${axisX ? 0 : dy}px)`;
        return;
      }
      const cp = camPtrs.current.get(e.pointerId);
      if (cp) {
        if (!cp.claimed) {
          if (Math.hypot(e.clientX - cp.x0, e.clientY - cp.y0) < 10) return;
          cp.claimed = true;
          claimPointer(e.pointerId);
        }
        const dx = e.clientX - cp.lastX;
        const dy = e.clientY - (cp.lastY ?? e.clientY);
        cp.lastX = e.clientX;
        cp.lastY = e.clientY;
        if (capsRef.current.orbit || capsRef.current.look) touchInput.yawDelta -= (dx / Math.max(320, window.innerWidth)) * YAW_PER_SCREEN;
        // First-person view: drag up to look up, down to look down.
        if (capsRef.current.look) touchInput.pitchDelta -= (dy / Math.max(320, window.innerHeight)) * PITCH_PER_SCREEN;
      }
    };
    const onUp = (e) => {
      const j = joyPtr.current;
      if (j && e.pointerId === j.id) resetJoy();
      camPtrs.current.delete(e.pointerId);
    };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("pointermove", onMove, { capture: true, passive: true });
    window.addEventListener("pointerup", onUp, { capture: true, passive: true });
    window.addEventListener("pointercancel", onUp, { capture: true, passive: true });
    window.addEventListener("blur", resetJoy);
    return () => {
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
      window.removeEventListener("blur", resetJoy);
      resetJoy();
      camPtrs.current.clear();
    };
  }, [touchMode]);

  // A modal / the map opening mid-push lets go of everything.
  useEffect(() => {
    if (!blocked) return;
    joyPtr.current = null;
    touchInput.moveX = 0;
    touchInput.moveY = 0;
    touchInput.run = false;
    touchInput.jump = false;
    setJoy(null);
    setRunning(false);
  }, [blocked]);
  useEffect(() => {
    if (caps.walk) return;
    joyPtr.current = null;
    touchInput.moveX = 0;
    touchInput.moveY = 0;
    touchInput.run = false;
    setJoy(null);
    setRunning(false);
  }, [caps.walk]);

  // ---- tap a character → walk over → the conversation opens ------------
  const approachId = useSession((s) => s.approachId);
  const nearbyId = useSession((s) => s.nearbyId);
  const challengeActive = useFarmChallengeActive();
  useEffect(() => {
    if (!touchMode || !approachId || approachId !== nearbyId || activeEncounterId || challengeActive) return;
    const it = getInteractable(approachId);
    clearMoveTarget(); // also clears the approach
    if (it) triggerInteraction(it);
  }, [touchMode, approachId, nearbyId, activeEncounterId, challengeActive]);

  // ---- the first-time coach card ----------------------------------------
  const [coach, setCoach] = useState(() => {
    try { return Number(localStorage.getItem("mma-touch-coach") || 0) < 3; } catch { return true; }
  });
  useEffect(() => {
    if (!touchMode || !coach) return undefined;
    try { localStorage.setItem("mma-touch-coach", String(Number(localStorage.getItem("mma-touch-coach") || 0) + 1)); } catch { /* ok */ }
    const id = setTimeout(() => setCoach(false), 12000);
    return () => clearTimeout(id);
  }, [touchMode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (usedJoy) { const id = setTimeout(() => setCoach(false), 2500); return () => clearTimeout(id); } return undefined; }, [usedJoy]);

  if (blocked) return null;
  const trainingOn = !useProgress.getState().journey?.trainingDone && !useProgress.getState().journey?.trainingSkipped;

  const near = nearbyId && !challengeActive ? getInteractable(nearbyId) : null;
  const act = near ? actionText(near) : null;
  // The FIRST-PERSON VIEW button (2026-10-13 — the training teaches it):
  // whenever you could walk, or to come back out of it.
  const showEye = (caps.walk && caps.walkAxis !== "x" && !challengeActive) || caps.look;

  return (
    <div className="touch-layer" aria-hidden={false}>
      {/* The joystick: a resting ghost bottom-left, or the live one under the thumb. */}
      {caps.walk && !joy && (
        <div className={`touch-joy-ghost${caps.walkAxis === "x" ? " axis-x" : ""}`} aria-hidden="true">
          <div className="touch-joy-knob" />
          <span className="touch-joy-label"><Bi>{caps.walkAxis === "x" ? "Slide" : "Move"}</Bi></span>
        </div>
      )}
      {caps.walk && joy && (
        <div
          className={`touch-joy${running ? " is-running" : ""}${caps.walkAxis === "x" ? " axis-x" : ""}`}
          style={{ left: joy.x, top: joy.y, width: joy.r * 2, height: joy.r * 2 }}
          aria-hidden="true"
        >
          <div className="touch-joy-knob" ref={knobRef} />
          {running && <span className="touch-joy-run"><Bi>RUN</Bi></span>}
        </div>
      )}

      <div className="touch-right">
        {near && act && (
          <button
            className="touch-action"
            onClick={(e) => {
              e.currentTarget.blur();
              const it = getInteractable(useSession.getState().nearbyId);
              if (it) { clearMoveTarget(); triggerInteraction(it); }
            }}
          >
            <span className="touch-action-icon" aria-hidden="true">{actionIcon(near)}</span>
            <span className="touch-action-text">
              <span className="touch-action-verb"><Bi>{act.verb}</Bi></span>
              {act.rest && <span className="touch-action-rest">{act.rest}</span>}
            </span>
          </button>
        )}
        {showEye && (
          <button
            className={`touch-btn touch-btn-eye${caps.look ? " is-on" : ""}`}
            aria-label={caps.look ? "Leave first-person view" : "First-person view"}
            aria-pressed={caps.look}
            onClick={(e) => { e.currentTarget.blur(); useUI.getState().toggleFpv(); }}
          >
            <span aria-hidden="true">👁️</span>
          </button>
        )}
        {caps.jump && (
          <button className="touch-btn touch-btn-jump" aria-label="Jump" {...holdHandlers((v) => { touchInput.jump = v; })}>
            <span aria-hidden="true">⤒</span>
            <span className="touch-btn-label"><Bi>Jump</Bi></span>
          </button>
        )}
      </div>

      {coach && caps.walk && !trainingOn && (
        <div className="touch-coach" role="note">
          <span>👈 <Bi>Thumb here to walk — push to the edge to run</Bi></span>
          <span>👉 <Bi>Drag to look around</Bi></span>
          <span>👆 <Bi>Tap someone to talk</Bi></span>
        </div>
      )}
    </div>
  );
}

/**
 * Phone held upright during a challenge: the stage has to share a narrow
 * screen with the card, so a small pill suggests turning the phone sideways
 * (it never blocks anything; ✕ hides it for the session).
 */
let rotateHintDismissed = false;
export function RotateHint() {
  const challengeActive = useFarmChallengeActive();
  const [hidden, setHidden] = useState(rotateHintDismissed);
  const [portraitPhone, setPortraitPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px) and (orientation: portrait)");
    const on = () => setPortraitPhone(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, []);
  if (!challengeActive || !portraitPhone || hidden) return null;
  return (
    <div className="rotate-hint" role="note">
      <span className="rotate-hint-icon" aria-hidden="true">📱↻</span>
      <span><Bi>Turn your phone sideways for a bigger view</Bi></span>
      <button aria-label="Hide" onClick={() => { rotateHintDismissed = true; setHidden(true); }}>✕</button>
    </div>
  );
}
