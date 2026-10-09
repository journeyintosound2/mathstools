import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import { useProgress, deriveLevel } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import PlayerCharacter from "../game/characters/PlayerCharacter.jsx";
import { PLAYER_CHARACTERS } from "../game/characters/characterModels.js";
import { Bi, LanguageSelector } from "../i18n/i18n.jsx";
import { useCloud } from "../cloud/cloudSession.js";

/**
 * THE TITLE SCREEN (2026-10-09) — the game's front door, over a live
 * cinematic flyover of Number Island (World renders behind it in `title`
 * mode; TitleCamera flies the camera).
 *
 *   curtain    a branded loading screen until the island has drawn its
 *              first frames (WorldReady), with a rotating tip
 *   splash     the logo + "Press Enter or tap to start"
 *   menu       Continue (returning players) / Start adventure, Change
 *              character, Sign in with student code, Options
 *   character  pick your explorer on a turntable (‹ ›), your name and
 *              (optional) student code — then Set off! (or Save & play)
 *   options    language, graphics, sound, touch controls
 *
 * Opened again mid-adventure (⚙ → Edit character) it goes straight to the
 * character card, with Back returning you to the game.
 *
 * Keeps the old welcome screen's behaviour: a ?code= in the URL signs the
 * student in automatically; a code typed here signs in before play (a wrong
 * code holds here and says why; no connection falls through to local play).
 */

const TIPS = [
  "Stand in front of the Achievements Wall on Harbour Green and press Enter to see every trophy you've won.",
  "Every world has its own gate on Number Island — the igloo, the volcano arch, the haybales, the mossy arch and the school gate.",
  "Pip, Fern and Alby each have a warm-up — score 80% or more to pass.",
  "Signposts point the way at every junction. The painted map by the arch shows the whole island.",
  "Hold Shift to run, press Space to jump.",
];

function useUrlCode() {
  return useMemo(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const raw = q.get("code") || q.get("student") || "";
      return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    } catch { return ""; }
  }, []);
}

/** The game's logo lockup. */
function GameLogo() {
  return (
    <h1 className="tl-logo" aria-label="Mills Maths Adventure">
      <span className="tl-logo-top" aria-hidden="true">Mills Maths</span>
      <span className="tl-logo-main" aria-hidden="true" data-text="Adventure">Adventure</span>
    </h1>
  );
}

function Curtain({ gone }) {
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  useEffect(() => {
    if (gone) return undefined;
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4200);
    return () => clearInterval(id);
  }, [gone]);
  return (
    <div className={`tl-curtain${gone ? " is-gone" : ""}`} aria-hidden={gone}>
      <div className="tl-curtain-inner">
        <GameLogo />
        <div className="tl-loader" role="progressbar" aria-label="Loading"><span /></div>
        <p className="tl-loading-text"><Bi>Building Number Island…</Bi></p>
        <p className="tl-tip" key={tip}>{TIPS[tip]}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The character turntable (its own little canvas).
// ---------------------------------------------------------------------------
function Turntable({ profile, character }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.6; });
  return (
    <group position={[0, -0.95, 0]}>
      <group ref={ref}>
        <PlayerCharacter profile={profile} character={character} modeOverride="idle" />
      </group>
      {/* A sandy podium with a ring of foam. */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.24, 40]} />
        <meshStandardMaterial color="#f1dca0" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.12, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  );
}

function CharacterCard({ profile, editing, onBack, onDone, urlSignedIn }) {
  const urlCode = useUrlCode();
  const resetProgress = useProgress((s) => s.resetProgress);
  const [name, setName] = useState(profile.name || "");
  const [studentCode, setStudentCode] = useState(profile.studentCode || urlCode || "");
  const [character, setCharacter] = useState(profile.character || "explorer");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const idx = Math.max(0, PLAYER_CHARACTERS.findIndex((c) => c.id === character));
  const chosen = PLAYER_CHARACTERS[idx];
  const step = (d) => setCharacter(PLAYER_CHARACTERS[(idx + d + PLAYER_CHARACTERS.length) % PLAYER_CHARACTERS.length].id);
  const nameRef = useRef(null);
  useEffect(() => { if (!editing && nameRef.current) nameRef.current.focus({ preventScroll: true }); }, [editing]);

  async function handleStart() {
    if (signingIn) return;
    const code = studentCode.trim();
    if (code) {
      const cloud = useCloud.getState();
      const already = cloud.isRegistered()
        && String((cloud.student && cloud.student.studentCode) || "").toUpperCase() === code.toUpperCase();
      if (cloud.enabled && !already) {
        setSigningIn(true);
        setSignInError("");
        let result;
        try {
          result = await cloud.registerWithCode(code);
        } catch (err) {
          result = { ok: false, error: String((err && err.message) || err) };
        }
        setSigningIn(false);
        // A wrong / inactive code holds here and says why; no connection
        // falls through so local play is never blocked.
        if (!result.ok) {
          const msg = result.error || "Could not sign in.";
          if (!/connect|network|offline/i.test(msg)) { setSignInError(msg); return; }
          setSignInError("");
        }
      }
    }
    useProgress.getState().setProfile({
      ...useProgress.getState().profile,
      name: name.trim() || "Explorer",
      studentCode: code,
      character,
      created: true,
    });
    onDone();
  }

  // ← / → on the turntable (when you're not typing).
  useEffect(() => {
    function onKey(e) {
      const t = (e.target && e.target.tagName ? e.target.tagName : "").toLowerCase();
      if (t === "input" || t === "select" || t === "textarea") { if (e.key === "Escape") e.target.blur(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "Escape") { e.preventDefault(); onBack(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="tl-card tl-char" aria-labelledby="tl-char-h">
      <h2 id="tl-char-h" className="tl-card-title">{editing ? <Bi>Your character</Bi> : <Bi>Choose your explorer</Bi>}</h2>
      <div className="tl-char-body">
        <div className="tl-turntable">
          <div className="tl-turntable-stage">
            <Canvas camera={{ position: [0, 0.12, 3.7], fov: 36 }} dpr={[1, 2]} gl={{ alpha: true }}>
              <hemisphereLight args={["#ffffff", "#f1dca0", 1.05]} />
              <directionalLight position={[2.5, 4, 3]} intensity={1.25} />
              <Turntable profile={profile} character={character} />
            </Canvas>
          </div>
          <div className="tl-turntable-nav">
            <button className="tl-round" onClick={() => step(-1)} aria-label="Previous character">‹</button>
            <div className="tl-turntable-name" aria-live="polite">
              <strong><Bi>{chosen.label}</Bi></strong>
              <span><Bi>{chosen.blurb}</Bi></span>
            </div>
            <button className="tl-round" onClick={() => step(1)} aria-label="Next character">›</button>
          </div>
          <div className="tl-dots" role="radiogroup" aria-label="Characters">
            {PLAYER_CHARACTERS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={c.id === character}
                aria-label={c.label}
                className={`tl-dot${c.id === character ? " is-on" : ""}`}
                onClick={() => setCharacter(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="tl-fields">
          <label className="tl-label" htmlFor="tl-name"><Bi>Your name</Bi></label>
          <input id="tl-name" ref={nameRef} className="tl-input" type="text" placeholder="e.g. Sam" autoComplete="off"
            value={name} maxLength={20} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()} />

          <label className="tl-label" htmlFor="tl-code">
            <Bi>Student code</Bi> <span className="tl-optional"><Bi>(optional — for your teacher)</Bi></span>
          </label>
          <input id="tl-code" className="tl-input" type="text" placeholder="e.g. 7M-12" autoComplete="off"
            value={studentCode} maxLength={16}
            onChange={(e) => { setStudentCode(e.target.value); setSignInError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleStart()} />
          {signInError && <div className="tl-error" role="alert">{signInError}</div>}
          {urlSignedIn && !signInError && <div className="tl-ok" role="status">✓ Signed in as {urlSignedIn} — your work will save to your teacher.</div>}

          <div className="tl-actions">
            <button className="tl-btn tl-btn-primary" onClick={handleStart} disabled={signingIn}>
              {signingIn ? <Bi>Signing in…</Bi> : editing ? <Bi>Save & play</Bi> : <Bi>Set off!</Bi>}
            </button>
            <button className="tl-btn tl-btn-ghost" onClick={onBack}><Bi>Back</Bi></button>
          </div>

          {editing && (
            confirmReset ? (
              <div className="tl-confirm" role="alertdialog" aria-labelledby="tl-reset-q">
                <p id="tl-reset-q"><Bi>This clears everything saved on this device — your trophies, keys and level. Are you sure?</Bi></p>
                <div className="tl-actions">
                  <button className="tl-btn tl-btn-danger" onClick={() => {
                    resetProgress();
                    try {
                      Object.keys(localStorage).filter((k) => /^mma-(farm|snow|magma)-.*-best$|^mma-visited:/.test(k)).forEach((k) => localStorage.removeItem(k));
                    } catch { /* local only */ }
                    setName(""); setStudentCode(""); setCharacter("explorer"); setConfirmReset(false);
                  }}><Bi>Yes, reset</Bi></button>
                  <button className="tl-btn tl-btn-ghost" onClick={() => setConfirmReset(false)}><Bi>Cancel</Bi></button>
                </div>
              </div>
            ) : (
              <button className="tl-link" onClick={() => setConfirmReset(true)}><Bi>Reset saved progress</Bi></button>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function Toggle({ on, onClick, labels = ["On", "Off"] }) {
  return (
    <div className="tl-seg" role="group">
      <button className={on ? "is-on" : ""} aria-pressed={on} onClick={() => !on && onClick()}><Bi>{labels[0]}</Bi></button>
      <button className={!on ? "is-on" : ""} aria-pressed={!on} onClick={() => on && onClick()}><Bi>{labels[1]}</Bi></button>
    </div>
  );
}

function OptionsCard({ onBack }) {
  const graphics = useUI((s) => s.graphicsQuality);
  const sound = useUI((s) => s.soundEnabled);
  const touch = useUI((s) => s.touchMode);
  const ui = useUI.getState();
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); onBack(); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);
  return (
    <section className="tl-card tl-options" aria-labelledby="tl-opt-h">
      <h2 id="tl-opt-h" className="tl-card-title"><Bi>Options</Bi></h2>
      <div className="tl-opt-row">
        <span className="tl-opt-name"><Bi>Language</Bi></span>
        <LanguageSelector />
      </div>
      <div className="tl-opt-row">
        <span className="tl-opt-name"><Bi>Graphics</Bi><small><Bi>High looks richest; Low runs smoother on tablets.</Bi></small></span>
        <Toggle on={graphics === "high"} onClick={ui.toggleGraphicsQuality} labels={["High", "Low"]} />
      </div>
      <div className="tl-opt-row">
        <span className="tl-opt-name"><Bi>Sound</Bi></span>
        <Toggle on={sound} onClick={ui.toggleSound} />
      </div>
      <div className="tl-opt-row">
        <span className="tl-opt-name"><Bi>Touch controls</Bi><small><Bi>Tap to move and on-screen buttons.</Bi></small></span>
        <Toggle on={touch} onClick={ui.toggleTouchMode} />
      </div>
      <div className="tl-actions">
        <button className="tl-btn tl-btn-ghost" onClick={onBack} autoFocus><Bi>Back</Bi></button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
export default function TitleScreen() {
  const ready = useUI((s) => s.worldReady);
  const touchMode = useUI((s) => s.touchMode);
  const started = useSession((s) => s.started);
  const profile = useProgress((s) => s.profile);
  const xp = useProgress((s) => s.xp);
  const cloudMode = useCloud((s) => s.mode);
  const cloudStudent = useCloud((s) => s.student);
  const editing = Boolean(profile.created);
  const [screen, setScreen] = useState(started ? "character" : "splash");
  const [curtainGone, setCurtainGone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedInName, setSignedInName] = useState("");
  const urlCode = useUrlCode();
  const menuRef = useRef(null);

  // The curtain lifts once the island is drawing (or after a long wait, so a
  // slow device never sits on it forever).
  useEffect(() => {
    if (ready) { const id = setTimeout(() => setCurtainGone(true), 350); return () => clearTimeout(id); }
    const id = setTimeout(() => setCurtainGone(true), 20000);
    return () => clearTimeout(id);
  }, [ready]);

  // Hide every in-world label while the title is up.
  useEffect(() => {
    document.body.classList.add("title-open");
    return () => document.body.classList.remove("title-open");
  }, []);

  // A ?code= in the URL signs the student in straight away.
  useEffect(() => {
    if (!urlCode) return undefined;
    const cloud = useCloud.getState();
    if (!cloud.enabled || cloud.isRegistered()) return undefined;
    let cancelled = false;
    (async () => {
      let result;
      try { result = await cloud.registerWithCode(urlCode); } catch (err) { result = { ok: false, error: String((err && err.message) || err) }; }
      if (cancelled || !result || !result.ok) return;
      const s = result.student || {};
      setSignedInName(s.name || [s.firstName, s.surname].filter(Boolean).join(" ") || "");
    })();
    return () => { cancelled = true; };
  }, [urlCode]);

  const go = useCallback(() => {
    setLeaving(true);
    setTimeout(() => useSession.getState().startGame(), 450);
  }, []);

  // Splash: any key / tap moves on to the menu.
  useEffect(() => {
    if (screen !== "splash" || !curtainGone) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === "Tab" || e.key === "Shift") return;
      e.preventDefault();
      setScreen("menu");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, curtainGone]);

  // Menu: ↑ / ↓ move between the items; focus the first one on arrival.
  useEffect(() => {
    if (screen !== "menu") return undefined;
    const items = () => Array.from(menuRef.current ? menuRef.current.querySelectorAll(".tl-item:not([disabled])") : []);
    const first = items()[0];
    if (first) first.focus({ preventScroll: true });
    function onKey(e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const list = items();
      if (!list.length) return;
      e.preventDefault();
      const i = list.indexOf(document.activeElement);
      const n = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
      list[n < 0 ? 0 : n].focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  async function onContinue() {
    if (busy) return;
    // Quietly re-join the class account if a code was saved (never blocks play).
    const code = (profile.studentCode || "").trim();
    const cloud = useCloud.getState();
    if (code && cloud.enabled && !cloud.isRegistered()) {
      setBusy(true);
      try {
        await Promise.race([cloud.registerWithCode(code), new Promise((r) => setTimeout(r, 7000))]);
      } catch { /* local play is fine */ }
      setBusy(false);
    }
    go();
  }

  const chosen = PLAYER_CHARACTERS.find((c) => c.id === profile.character) || PLAYER_CHARACTERS[0];
  const level = deriveLevel(xp || 0).level;
  const signedIn = cloudMode === "registered" && cloudStudent;
  const signedLabel = signedIn ? (cloudStudent.name || [cloudStudent.firstName, cloudStudent.surname].filter(Boolean).join(" ") || cloudStudent.studentCode || "") : "";

  return (
    <div className={`tl-root${leaving ? " is-leaving" : ""}${curtainGone ? " is-live" : ""}`}>
      <div className="tl-scrim" aria-hidden="true" />
      <div className={`tl-column${screen === "character" ? " is-wide" : ""}`}>
        {(screen === "splash" || screen === "menu") && <GameLogo />}
        {(screen === "splash" || screen === "menu") && (
          <p className="tl-tagline"><Bi>A maths adventure across Number Island</Bi></p>
        )}

        {screen === "splash" && curtainGone && (
          <button className="tl-press" onClick={() => setScreen("menu")}>
            {touchMode ? <Bi>Tap to start</Bi> : <Bi>Press Enter or tap to start</Bi>}
          </button>
        )}

        {screen === "menu" && (
          <nav className="tl-menu" ref={menuRef} aria-label="Main menu">
            {editing ? (
              <button className="tl-item tl-item-primary" style={{ "--i": 0 }} onClick={onContinue} disabled={busy}>
                <span className="tl-item-label">{busy ? <Bi>Signing in…</Bi> : <Bi>Continue</Bi>}</span>
                <span className="tl-item-sub">{profile.name || "Explorer"} · <Bi block={false}>{chosen.label}</Bi> · Level {level}</span>
              </button>
            ) : (
              <button className="tl-item tl-item-primary" style={{ "--i": 0 }} onClick={() => setScreen("character")}>
                <span className="tl-item-label"><Bi>Start adventure</Bi></span>
                <span className="tl-item-sub"><Bi>Pick your explorer and set off</Bi></span>
              </button>
            )}
            {editing && (
              <button className="tl-item" style={{ "--i": 1 }} onClick={() => setScreen("character")}>
                <span className="tl-item-label"><Bi>Change character</Bi></span>
                <span className="tl-item-sub"><Bi>Your explorer, name and student code</Bi></span>
              </button>
            )}
            <button className="tl-item" style={{ "--i": 2 }} onClick={() => useUI.getState().setCloudLogin(true)}>
              <span className="tl-item-label"><Bi>Sign in with student code</Bi></span>
              <span className="tl-item-sub">
                {signedIn ? <>✓ {signedLabel}</> : <Bi>Save your work for your teacher</Bi>}
              </span>
            </button>
            <button className="tl-item" style={{ "--i": 3 }} onClick={() => setScreen("options")}>
              <span className="tl-item-label"><Bi>Options</Bi></span>
              <span className="tl-item-sub"><Bi>Language, graphics and sound</Bi></span>
            </button>
          </nav>
        )}

        {screen === "character" && (
          <CharacterCard
            profile={profile}
            editing={editing}
            urlSignedIn={signedInName}
            onBack={() => (started ? go() : setScreen("menu"))}
            onDone={go}
          />
        )}
        {screen === "options" && <OptionsCard onBack={() => setScreen("menu")} />}

        {(screen === "splash" || screen === "menu") && (
          <div className="tl-foot">
            <LanguageSelector compact />
            <span className="tl-credit">Mills Maths Tools</span>
          </div>
        )}
      </div>
      <Curtain gone={curtainGone} />
    </div>
  );
}
