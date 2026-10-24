import React, { useEffect, useRef, useState } from "react";

import { useDemo } from "../../game/demo/demoStore.js";
import { finishDemo, currentDemo, skipDemo, togglePause, watchAgain, installDemoAutoplay } from "../../game/demo/demoRunner.js";
import { DEMOS, demoFor } from "../../game/demo/registry.js";
import { useUI } from "../effects/uiStore.js";
import { speakerInfo } from "../dialogue/speakers.js";
import { kh } from "../keyHints.js";

/**
 * THE DEMO OVERLAY (2026-10-24) — what the student sees while a challenge
 * plays itself (game/demo/demoRunner.js):
 *
 *   • the CONSOLE — "▶ DEMO · Example 1 of 2", the host's portrait, the step
 *     ("Step 1 · Fill the crate") and what they're saying, a 🤔 thinking bar
 *     when the watcher is asked to predict, and Read aloud / Pause / Skip.
 *     It sits in the corner AWAY from the challenge card (top when the card
 *     is docked at the bottom, bottom when it's at the top); on phones and
 *     iPads it's a strip the stage camera frames itself around
 *     (game/stageViewport.js);
 *   • the HAND — a cartoon glove that glides to the real button / 3D object,
 *     presses it (a ripple) and drags the pole, with a soft gold ring on the
 *     thing it's about to touch;
 *   • a BLOCKER — the student's own taps + keys are held back so the demo
 *     can't be knocked off course (Esc / Skip ends it, Space pauses);
 *   • the "YOUR TURN!" card — Watch again / Let's go! (or Back to my game).
 */

function rich(text) {
  const parts = String(text || "").split("**");
  return parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>));
}

export function HostFace({ host, size = 52 }) {
  const info = speakerInfo(host || "");
  return (
    <span className="demo-face" style={{ width: size, height: size, "--hc": info.color }}>
      {info.img ? <img src={info.img} alt="" draggable={false} /> : <span className="demo-face-icon">{info.icon}</span>}
    </span>
  );
}

/** Where the card is docked → which side the console goes. */
function useConsoleSide(active) {
  const [side, setSide] = useState("top");
  useEffect(() => {
    if (!active) return undefined;
    const measure = () => {
      const H = window.innerHeight;
      const W = window.innerWidth;
      // Everything the student reads: the card, plus any answer bar a
      // challenge pins to the screen edge on its own (the Veggie Plot's).
      const els = [
        document.querySelector(".farm-challenge-panel .farm-challenge-card") || document.querySelector(".farm-challenge-panel"),
        document.querySelector(".veggie-answer-bar"),
      ].filter(Boolean);
      let top = false;
      let bottom = false;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.height < 4 || r.width < 4) continue;
        // Docked down the right-hand side (sideways phone): console top-left.
        if (r.left > W * 0.4 && r.height > H * 0.5) return setSide("top");
        if ((r.top + r.bottom) / 2 > H / 2) bottom = true;
        else top = true;
      }
      if (bottom && !top) setSide("top");
      else if (top && !bottom) setSide("bottom");
    };
    measure();
    const t = setInterval(measure, 300);
    return () => clearInterval(t);
  }, [active]);
  return side;
}

function Hand({ hand }) {
  if (!hand || hand.hidden) return null;
  return (
    <div
      className={`demo-hand${hand.press ? " press" : ""}${hand.drag ? " drag" : ""}`}
      style={{ transform: `translate(${Math.round(hand.x)}px, ${Math.round(hand.y)}px)` }}
      aria-hidden="true"
    >
      {hand.press && <span key={hand.at} className="demo-ripple" />}
      <svg className="demo-glove" viewBox="0 0 64 84" width="58" height="76">
        <defs>
          <linearGradient id="demoGlove" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e9eef7" />
          </linearGradient>
        </defs>
        {/* cuff */}
        <rect x="17" y="64" width="32" height="15" rx="5" fill="#ffcf4a" stroke="#1d2a44" strokeWidth="3" />
        <rect x="17" y="69" width="32" height="3" fill="#e2a91a" />
        {/* palm + knuckles */}
        <path
          d="M14 44 C14 36 20 33 25 35 L25 40 L25 10 C25 3 37 3 37 10 L37 33 C39 29 47 29 48 35 C51 31 58 33 58 40 L58 52 C58 62 52 67 45 67 L26 67 C19 67 14 61 14 54 Z"
          fill="url(#demoGlove)"
          stroke="#1d2a44"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* thumb */}
        <path d="M25 44 C19 40 10 42 11 49 C12 55 19 57 25 54" fill="url(#demoGlove)" stroke="#1d2a44" strokeWidth="3" strokeLinejoin="round" />
        {/* finger creases */}
        <path d="M37 33 L37 44 M48 36 L48 45" stroke="#1d2a44" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
        <path d="M28 14 L34 14" stroke="#c9d4e6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Spot({ spot }) {
  if (!spot) return null;
  return (
    <div
      className={`demo-spot${spot.circle ? " circle" : ""}`}
      style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
      aria-hidden="true"
    />
  );
}

function Console({ def, side }) {
  const example = useDemo((s) => s.example);
  const examples = useDemo((s) => s.examples);
  const step = useDemo((s) => s.step);
  const caption = useDemo((s) => s.caption);
  const paused = useDemo((s) => s.paused);
  const speak = useDemo((s) => s.speak);
  const [nudge, setNudge] = useState(0);
  useEffect(() => {
    const on = () => setNudge(Date.now());
    window.addEventListener("mma-demo-nudge", on);
    return () => window.removeEventListener("mma-demo-nudge", on);
  }, []);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  return (
    <div className={`demo-console side-${side}`} role="region" aria-label="How to play demo">
      <div className="demo-bar">
        <span className="demo-badge" title={def.name}>
          <span className="demo-rec" /> DEMO
        </span>
        <span className="demo-ex" aria-label={`Example ${example + 1} of ${examples}`}>
          {Array.from({ length: examples }, (_, i) => (
            <i key={i} className={i < example ? "done" : i === example ? "now" : ""} />
          ))}
          <b>Example {example + 1} of {examples}</b>
        </span>
        <span className="demo-ctl">
          {canSpeak && (
            <button
              className={`demo-icon${speak ? " on" : ""}`}
              title={speak ? "Stop reading aloud" : "Read it aloud"}
              aria-label={speak ? "Stop reading aloud" : "Read it aloud"}
              onClick={(e) => {
                e.currentTarget.blur();
                useDemo.getState().setSpeak(!speak);
              }}
            >
              {speak ? "🔊" : "🔈"}
            </button>
          )}
          <button
            className="demo-icon"
            title={paused ? "Play" : "Pause"}
            aria-label={paused ? "Play" : "Pause"}
            onClick={(e) => {
              e.currentTarget.blur();
              togglePause();
            }}
          >
            {paused ? "▶" : "❚❚"}
          </button>
          <button
            key={nudge}
            className={`demo-skip${nudge ? " nudge" : ""}`}
            onClick={(e) => {
              e.currentTarget.blur();
              skipDemo();
            }}
          >
            {kh("Skip (Esc)")} ⏭
          </button>
        </span>
      </div>
      <div className="demo-talk">
        <HostFace host={def.host} size={54} />
        <div className="demo-words">
          <div className="demo-who">
            <b>{def.host}</b>
            {!step && <span className="demo-name">{def.icon} {def.name}</span>}
            {step && (
              <span className="demo-step">
                <span className="demo-step-n">{step.n}</span> {step.title}
              </span>
            )}
          </div>
          <div key={caption ? caption.at : "none"} className={`demo-line${caption && caption.think ? " think" : ""}`}>
            {caption ? (
              <>
                {caption.think && <span className="demo-think-icon">🤔</span>}
                {rich(caption.text)}
              </>
            ) : (
              <span className="demo-dots"><i /><i /><i /></span>
            )}
          </div>
          {caption && caption.think && <div key={`b${caption.at}`} className="demo-thinkbar" style={{ animationDuration: `${caption.ms || 3000}ms` }} />}
          {paused && <div className="demo-paused">Paused — {kh("press ▶ (or Space)")} to carry on</div>}
        </div>
      </div>
    </div>
  );
}

function EndCard({ def, mode }) {
  const goRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => goRef.current && goRef.current.focus({ preventScroll: true }), 80);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="demo-end-wrap" role="dialog" aria-label="Your turn">
      <div className="demo-end">
        <div className="demo-end-burst" aria-hidden="true" />
        <HostFace host={def.host} size={88} />
        <div className="demo-end-kicker">{def.icon} {def.name}</div>
        <h2 className="demo-end-title">Your turn!</h2>
        <div className="demo-end-sub">{mode === "replay" ? "Ready to carry on?" : "Do it just like the demo."}</div>
        <div className="demo-end-buttons">
          <button className="demo-again" onClick={(e) => { e.currentTarget.blur(); watchAgain(); }}>
            ↻ Watch again
          </button>
          <button ref={goRef} className="primary-button demo-go" onClick={(e) => { e.currentTarget.blur(); finishDemo(currentDemo()); }}>
            {mode === "replay" ? kh("Back to my game (Enter)") : kh("Let's go! (Enter)")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemoOverlay() {
  const active = useDemo((s) => s.active);
  const key = useDemo((s) => s.key);
  const mode = useDemo((s) => s.mode);
  const ended = useDemo((s) => s.ended);
  const hand = useDemo((s) => s.hand);
  const spot = useDemo((s) => s.spot);
  const touch = useUI((s) => s.touchMode);
  const side = useConsoleSide(active);
  const def = demoFor(key);

  useEffect(() => {
    installDemoAutoplay(DEMOS);
  }, []);

  // The hand is busy on the 3D stage BEHIND the card (a small screen, a tall
  // card) → the card ghosts out so the watcher can see what it's doing.
  useEffect(() => {
    let ghost = false;
    if (active && hand && !hand.hidden && ((spot && spot.circle) || hand.drag)) {
      const card = document.querySelector(".farm-challenge-panel .farm-challenge-card");
      if (card) {
        const r = card.getBoundingClientRect();
        const pad = 26;
        ghost = hand.x > r.left - pad && hand.x < r.right + pad && hand.y > r.top - pad && hand.y < r.bottom + pad;
      }
    }
    document.body.classList.toggle("demo-ghost-card", ghost);
  }, [active, hand, spot]);
  useEffect(() => () => document.body.classList.remove("demo-ghost-card"), []);

  // Hold back the student's own keys while the demo plays. Synthetic events
  // (the demo pressing Enter in a box) are let through.
  useEffect(() => {
    if (!active) return undefined;
    function onKey(e) {
      if (!e.isTrusted) return;
      e.stopImmediatePropagation();
      const st = useDemo.getState();
      if (e.type !== "keydown") return;
      if (st.ended) {
        if (e.key === "Enter") {
          e.preventDefault();
          finishDemo(currentDemo());
        } else if (e.key === "Escape") {
          e.preventDefault();
          finishDemo(currentDemo());
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        skipDemo();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        togglePause();
      } else if (!e.repeat) {
        window.dispatchEvent(new Event("mma-demo-nudge"));
      }
    }
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    // A text box that grabs focus mid-demo would pop the phone keyboard up.
    function onFocus(e) {
      if (touch && e.target && /input|textarea/i.test(e.target.tagName || "") && !e.target.closest(".demo-console, .demo-end")) e.target.blur();
    }
    document.addEventListener("focusin", onFocus, true);
    if (touch && document.activeElement && /input|textarea/i.test(document.activeElement.tagName || "")) document.activeElement.blur();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      document.removeEventListener("focusin", onFocus, true);
    };
  }, [active, touch]);

  if (!active || !def) return null;
  return (
    <div className="demo-layer">
      <div
        className="demo-blocker"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new Event("mma-demo-nudge"));
        }}
        onWheel={(e) => e.stopPropagation()}
      />
      {!ended && <Spot spot={spot} />}
      {!ended && <Hand hand={hand} />}
      {!ended && <Console def={def} side={side} />}
      {ended && <EndCard def={def} mode={mode} />}
    </div>
  );
}
