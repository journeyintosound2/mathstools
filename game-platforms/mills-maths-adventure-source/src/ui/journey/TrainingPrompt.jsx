import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useProgress } from "../../progress/store.js";
import { useSession, playerState } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { useFarmChallengeActive } from "../../game/farmChallengeActive.js";
import { useMediaQuery, COMPACT_QUERY } from "../useMediaQuery.js";
import { useJourney, currentCoach, TRAINING_STUCK_AFTER_MS } from "../../game/journeyStore.js";
import { TRAINING_STEPS, TRAINING_PROMPTS } from "../../data/training.js";
import { inWallPromptZone } from "../../data/island/wallView.js";
import { compassAngle, targetDistance } from "../../data/taskCompass.js";
import { Bi } from "../../i18n/i18n.jsx";

/**
 * THE TRAINING PROMPT (2026-10-13, Jeff: the training "wasn't overly clear …
 * tucked away in the corner … highlight the keys to press"). While the
 * Harbour Green training runs, ONE big prompt owns the screen — the way games
 * teach even very young players:
 *
 *   • one thing at a time, with a big picture of exactly what to press: the
 *     real keys as keycaps (W A S D, Shift, Space, /, E, Enter, M) that LIGHT
 *     UP the moment you press them — or, on a phone / iPad, a little drawing
 *     of the control plus a pulsing ring and a pointing hand ON the real
 *     joystick / Jump / 👁️ / Talk / 🗺️ button
 *   • the prompt changes as you go (in first-person → "press / again"; next
 *     to Mills → "press E now"), with its own arrow when there's somewhere to
 *     walk to
 *   • a progress bar that fills as you do it, then a big green ✓ and a cheer
 *     before the next step slides in
 *   • everything else that could distract (the journey tracker, the hint
 *     bar, the old touch coach, the waypoint chip) steps aside meanwhile
 *
 * No "skip training" — every player does it once (Jeff: students would skip
 * it). After a full minute on one step a small "Stuck? Skip this step"
 * appears, so a step can never trap anyone.
 *
 * Keyboard computers: docked bottom-centre. Touch + small screens: under the
 * top row (the controls it points at are at the bottom).
 */
const DONE_MS = 1500;
const MOVE_CODES = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const SHIFT = ["ShiftLeft", "ShiftRight"];

/** Which keys are held right now (by e.code). */
function useHeldKeys(active) {
  const [held, setHeld] = useState(() => new Set());
  useEffect(() => {
    if (!active) return undefined;
    const down = (e) => setHeld((h) => (h.has(e.code) ? h : new Set(h).add(e.code)));
    const up = (e) => setHeld((h) => { if (!h.has(e.code)) return h; const n = new Set(h); n.delete(e.code); return n; });
    const clear = () => setHeld(new Set());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [active]);
  return held;
}

/** Is the player standing at the Achievements Wall's prompt spot? */
function useAtWall(active) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) { setOn(false); return undefined; }
    const id = setInterval(() => setOn(inWallPromptZone(playerState.x, playerState.z)), 200);
    return () => clearInterval(id);
  }, [active]);
  return on;
}

function Key({ codes, label, held, cap, wide = "", pulse = false, dim = false }) {
  const down = codes.some((c) => held.has(c));
  return (
    <span className={`tk${wide ? ` tk-${wide}` : ""}${down ? " is-down" : ""}${pulse && !down ? " is-pulse" : ""}${dim ? " is-dim" : ""}`}>
      <kbd>{label}</kbd>
      {cap && <small><Bi>{cap}</Bi></small>}
    </span>
  );
}

/** W A S D (or the arrows) as a little key cluster. */
function MoveCluster({ codes, labels, held, pulse }) {
  return (
    <span className="tk-cluster" aria-hidden="true">
      <span className="tk-cl-row"><Key codes={[codes[0]]} label={labels[0]} held={held} pulse={pulse} /></span>
      <span className="tk-cl-row">
        <Key codes={[codes[1]]} label={labels[1]} held={held} pulse={pulse} />
        <Key codes={[codes[2]]} label={labels[2]} held={held} pulse={pulse} />
        <Key codes={[codes[3]]} label={labels[3]} held={held} pulse={pulse} />
      </span>
    </span>
  );
}

const C = TRAINING_PROMPTS.caps;

/** The keyboard picture for a step. */
function KeyPicture({ kind, held, phase }) {
  switch (kind) {
    case "move":
      return (
        <div className="tk-row">
          <MoveCluster codes={["KeyW", "KeyA", "KeyS", "KeyD"]} labels={["W", "A", "S", "D"]} held={held} pulse />
          <span className="tk-or"><Bi>{C.or}</Bi></span>
          <MoveCluster codes={["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]} labels={["↑", "←", "↓", "→"]} held={held} />
        </div>
      );
    case "look":
      return (
        <div className="tk-row">
          <Key codes={["KeyZ"]} label="Z" cap={C.turnLeft} held={held} pulse />
          <span className="tk-turn" aria-hidden="true">⟲ ⟳</span>
          <Key codes={["KeyX"]} label="X" cap={C.turnRight} held={held} pulse />
        </div>
      );
    case "run":
      return (
        <div className="tk-row">
          <Key codes={SHIFT} label="⇧ Shift" wide="wide" cap={C.hold} held={held} pulse />
          <span className="tk-plus" aria-hidden="true">+</span>
          <Key codes={MOVE_CODES} label="W" cap={C.move} held={held} pulse />
        </div>
      );
    case "jump":
      return (
        <div className="tk-row">
          <Key codes={["Space"]} label="Space" wide="space" cap={C.jump} held={held} pulse />
        </div>
      );
    case "fpv":
      return (
        <div className="tk-row">
          <Key codes={["Slash", "NumpadDivide"]} label="/" cap={C.eyes} held={held} pulse />
          {phase === "fpvBack" && (
            <>
              <span className="tk-or" aria-hidden="true">·</span>
              <MoveCluster codes={["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]} labels={["↑", "←", "↓", "→"]} held={held} />
            </>
          )}
        </div>
      );
    case "talk":
      return (
        <div className="tk-row">
          <Key codes={["KeyE"]} label="E" cap={C.talk} held={held} pulse={phase === "near"} dim={phase !== "near"} />
        </div>
      );
    case "wall":
      return (
        <div className="tk-row">
          <Key codes={["Enter", "NumpadEnter"]} label="Enter ↵" wide="wide" cap={C.look} held={held} pulse={phase === "near"} dim={phase !== "near"} />
        </div>
      );
    case "map":
      return (
        <div className="tk-row">
          <Key codes={["KeyM"]} label="M" cap={C.map} held={held} pulse />
          <span className="tk-or"><Bi>{C.or}</Bi></span>
          <span className="tk-chip" aria-hidden="true">🗺️ Map</span>
        </div>
      );
    default:
      return null;
  }
}

/** The touch picture for a step (a drawing of the control to use). */
function TouchPicture({ kind, phase }) {
  switch (kind) {
    case "joy":
      return <span className="tg"><span className="tg-joy"><i /></span><small><Bi>{C.push}</Bi></small></span>;
    case "joyRun":
      return <span className="tg"><span className="tg-joy is-run"><i /></span><small><Bi>{C.pushEdge}</Bi></small></span>;
    case "drag":
      return <span className="tg"><span className="tg-drag" aria-hidden="true"><b>👆</b></span><small><Bi>{C.drag}</Bi></small></span>;
    case "jump":
      return <span className="tg"><span className="tg-btn tg-jump">⤒</span><small><Bi>{C.jump}</Bi></small></span>;
    case "eye":
      return <span className="tg"><span className="tg-btn tg-eye">👁️</span><small><Bi>{C.eyes}</Bi></small></span>;
    case "talk":
      return <span className={`tg${phase === "near" ? "" : " is-dim"}`}><span className="tg-btn tg-talk">💬</span><small><Bi>{C.talk}</Bi></small></span>;
    case "wall":
      return <span className={`tg${phase === "near" ? "" : " is-dim"}`}><span className="tg-btn tg-wall">🏆</span><small><Bi>{C.look}</Bi></small></span>;
    case "map":
      return <span className="tg"><span className="tg-btn tg-map">🗺️</span><small><Bi>{C.map}</Bi></small></span>;
    default:
      return null;
  }
}

/** A live arrow to where the step wants you to go. */
function WayArrow({ where }) {
  const arrowRef = useRef(null);
  const distRef = useRef(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      const ang = compassAngle(playerState.x, playerState.z, playerState.camYaw || 0, where.x, where.z);
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${ang}rad)`;
      if (distRef.current) distRef.current.textContent = `${Math.max(0, Math.round(targetDistance(playerState.x, playerState.z, where.x, where.z)))} m`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [where]);
  return (
    <span className="tway">
      <span className="tway-dial">
        <span className="tway-arrow" ref={arrowRef} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40"><path d="M12 2 L20 20 L12 15.5 L4 20 Z" fill="currentColor" /></svg>
        </span>
      </span>
      <span className="tway-text">
        <b>{where.icon} {where.label}</b>
        <span ref={distRef} />
      </span>
    </span>
  );
}

/** A pulsing ring + a pointing hand on a real on-screen control. */
function Spotlight({ selector }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!selector) { setRect(null); return undefined; }
    const measure = () => {
      const el = Array.from(document.querySelectorAll(selector)).find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!el) { setRect((p) => (p ? null : p)); return; }
      const r = el.getBoundingClientRect();
      setRect((p) => (p && Math.abs(p.x - r.left) < 1 && Math.abs(p.y - r.top) < 1 && Math.abs(p.w - r.width) < 1 && Math.abs(p.h - r.height) < 1
        ? p : { x: r.left, y: r.top, w: r.width, h: r.height }));
    };
    measure();
    const id = setInterval(measure, 250);
    return () => clearInterval(id);
  }, [selector]);
  if (!rect) return null;
  const low = rect.y + rect.h / 2 > (typeof window !== "undefined" ? window.innerHeight : 800) / 2;
  const pad = 8;
  return (
    <div className={`tspot${low ? " is-low" : " is-high"}`} aria-hidden="true"
      style={{ left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2 }}>
      <span className="tspot-hand">{low ? "👇" : "👆"}</span>
    </div>
  );
}

/** The step's live phase: what it's asking for right now. */
function usePhase(step, active) {
  const fpv = useUI((s) => s.fpv);
  const nearbyId = useSession((s) => s.nearbyId);
  const atWall = useAtWall(active && step && step.prompt && step.prompt.near === "wall");
  if (!step || !step.prompt) return "";
  if (step.prompt.keys === "fpv" && fpv) return "fpvBack";
  if (step.prompt.near === "sage") return nearbyId === "sage" ? "near" : "far";
  if (step.prompt.near === "wall") return atWall ? "near" : "far";
  return "";
}

/** The sentence for the step's phase (keyboard or touch wording). */
function sentenceFor(step, phase, touch) {
  const P = touch ? TRAINING_PROMPTS.touch : TRAINING_PROMPTS.key;
  if (phase === "fpvBack") return P.fpvBack;
  if (phase === "near") return step.prompt.near === "sage" ? P.talkNear : P.wallNear;
  return touch ? step.touch : step.key;
}

/** Where to point on screen (touch: the control; keyboard: only the 🗺️ button / wall prompt). */
function spotFor(step, phase, touch) {
  const k = step.prompt;
  if (k.keys === "map") return ".hud-map-btn";
  if (k.near === "wall" && phase === "near") return ".wall-prompt";
  if (!touch) return null;
  if (k.touch === "joy" || k.touch === "joyRun") return ".touch-joy, .touch-joy-ghost";
  if (k.touch === "jump") return ".touch-btn-jump";
  if (k.touch === "eye") return ".touch-btn-eye";
  if (k.touch === "talk" && phase === "near") return ".touch-action";
  return null;
}

export default function TrainingPrompt() {
  const journey = useProgress((s) => s.journey);
  const regionId = useSession((s) => s.currentRegionId);
  const phaseOfGame = useSession((s) => s.phase);
  const enc = useSession((s) => s.activeEncounterId);
  const busy = useFarmChallengeActive();
  const overlay = useUI((s) => s.mapOpen || Boolean(s.wallView) || s.questLogOpen || s.resultsOpen || s.howToOpen ||
    s.pilotOpen || s.cloudLoginOpen || s.trophyOpen);
  const touch = useUI((s) => s.touchMode);
  const compact = useMediaQuery(COMPACT_QUERY);
  const flash = useJourney((s) => s.flash);
  const base = useJourney((s) => s.base);
  const frac = useJourney((s) => s.frac);
  const [now, setNow] = useState(Date.now());
  const panelRef = useRef(null);

  const cur = currentCoach({ journey }, regionId);
  const training = Boolean(cur && cur.scope === "training" && cur.step && !cur.card);
  const step = training ? cur.step : null;
  const doneRecent = Boolean(flash && flash.scope === "training" && now - flash.at < DONE_MS);
  const blocked = phaseOfGame !== "playing" || regionId !== "island-1";
  const hiddenNow = blocked || Boolean(enc) || busy || overlay;
  const showDone = doneRecent && !hiddenNow;
  const showStep = training && !hiddenNow && !doneRecent;
  const placeTop = touch || compact;

  const held = useHeldKeys(showStep && !touch);
  const phase = usePhase(step, showStep);

  // Tick for the "done" cheer, the stuck valve.
  useEffect(() => {
    if (!training && !doneRecent) return undefined;
    const id = setInterval(() => setNow(Date.now()), doneRecent ? 120 : 1000);
    return () => clearInterval(id);
  }, [training, doneRecent]);

  // While the training runs, everything that would compete steps aside.
  const trainingOn = !blocked && (training || doneRecent);
  useEffect(() => {
    const b = document.body.classList;
    b.toggle("training-on", trainingOn);
    b.toggle("tp-bottom", trainingOn && !placeTop);
    return () => { b.remove("training-on"); b.remove("tp-bottom"); };
  }, [trainingOn, placeTop]);

  // The panel's height, so the "Press E" / wall prompts can sit above it.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--tp-h", `${Math.round(el.offsetHeight)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  });

  if (!showStep && !showDone) return null;
  const cls = `tprompt${placeTop ? " is-top" : " is-bottom"}${compact ? " is-compact" : ""}`;
  const index = training ? cur.index : TRAINING_STEPS.length;
  const pips = (
    <span className="tp-pips" aria-hidden="true">
      {TRAINING_STEPS.map((t, i) => (
        <span key={t.id} className={i < index ? "done" : i === index && showStep ? "now" : ""} />
      ))}
    </span>
  );

  if (showDone) {
    const next = training ? cur.step : null;
    return (
      <div className={`${cls} is-done`} ref={panelRef} role="status" aria-live="polite" key={`done-${flash.at}`}>
        <div className="tp-head">
          <span className="tp-kicker">🎓 <Bi>{TRAINING_PROMPTS.training}</Bi></span>
          {pips}
        </div>
        <div className="tp-done">
          <span className="tp-check" aria-hidden="true">✓</span>
          <span className="tp-done-text"><Bi>{flash.done || flash.title}</Bi></span>
        </div>
        {next && (
          <div className="tp-next"><Bi>{TRAINING_PROMPTS.next}</Bi> <span aria-hidden="true">{next.icon}</span> <Bi>{next.title}</Bi></div>
        )}
      </div>
    );
  }

  const meter = step.meter === "m" || step.meter === "x" || step.meter === "turn";
  const showArrow = step.where && phase === "far";
  const stuck = base && base.key === cur.key && now - base.t > TRAINING_STUCK_AFTER_MS;
  const sentence = sentenceFor(step, phase, touch);
  const J = useJourney.getState();

  return (
    <>
      <div className={cls} ref={panelRef} role="status" aria-live="polite" key={`step-${step.id}`}>
        <div className="tp-head">
          <span className="tp-kicker">🎓 <Bi>{TRAINING_PROMPTS.training}</Bi></span>
          {pips}
          <span className="tp-count">{cur.index + 1} / {cur.total}</span>
        </div>
        <div className="tp-main">
          <div className="tp-title">
            <span className="tp-icon" aria-hidden="true">{step.icon}</span>
            <span className="tp-name"><Bi>{step.title}</Bi></span>
          </div>
          <div className="tp-picture">
            {showArrow ? <WayArrow where={step.where} /> : null}
            {touch
              ? <TouchPicture kind={step.prompt.touch} phase={phase} />
              : <KeyPicture kind={step.prompt.keys} held={held} phase={phase} />}
          </div>
        </div>
        <div className={`tp-say${phase === "near" || phase === "fpvBack" ? " is-now" : ""}`}><Bi>{sentence}</Bi></div>
        {step.meter === "x" ? (
          <div className="tp-count-pips" aria-hidden="true">
            {Array.from({ length: step.goal.amount }, (_, i) => (
              <span key={i} className={i < Math.round(frac * step.goal.amount) ? "on" : ""}>{i < Math.round(frac * step.goal.amount) ? "✓" : i + 1}</span>
            ))}
          </div>
        ) : meter ? (
          <div className="tp-meter" aria-hidden="true"><span style={{ width: `${Math.round(frac * 100)}%` }} /></div>
        ) : null}
        {stuck && (
          <button className="tp-stuck" onClick={(e) => { e.currentTarget.blur(); J.advance(cur); }}>
            <Bi>{TRAINING_PROMPTS.stuck}</Bi> ›
          </button>
        )}
      </div>
      <Spotlight selector={spotFor(step, phase, touch)} />
      {touch && step.prompt.touch === "drag" && <div className="tdrag-zone" aria-hidden="true"><span>👆</span></div>}
    </>
  );
}
