import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import { useProgress, deriveLevel } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import PlayerCharacter from "../game/characters/PlayerCharacter.jsx";
import { PLAYER_CHARACTERS } from "../game/characters/characterModels.js";
import { Bi, LanguageSelector } from "../i18n/i18n.jsx";
import { useCloud } from "../cloud/cloudSession.js";
import { forgetProgressOwner } from "../cloud/progressSync.js";
import { SYNCED_KEY } from "../cloud/progressMerge.js";
import { useResults } from "../results/resultStore.js";
import { useAdmin } from "../game/adminStore.js";

// "Start new game" reloads the page and lands straight on the character card.
// (Read ONCE as the page loads — not in a render, which React may repeat.)
const NEW_GAME_FLAG = "mma-new-game";
const JUST_STARTED_NEW_GAME = (() => {
  try {
    const f = sessionStorage.getItem(NEW_GAME_FLAG);
    if (f) sessionStorage.removeItem(NEW_GAME_FLAG);
    return Boolean(f);
  } catch { return false; }
})();

/**
 * START NEW GAME (2026-10-13): sign out (sending anything not yet saved, so
 * a signed-in student's cloud save is untouched), clear EVERYTHING this
 * device holds for the game — progress, results, every world's trophies,
 * visits, the journey — then reload clean (dropping any ?code= so it doesn't
 * sign straight back in) onto the character card. Settings (language,
 * graphics, sound, touch) and admin mode are kept.
 */
async function startNewGame() {
  const cloud = useCloud.getState();
  if (cloud.mode === "registered") { try { await cloud.clearSession(); } catch { /* a local reset goes on */ } }
  useProgress.getState().resetProgress();
  try { useResults.getState().clearResults(); } catch { /* ok */ }
  try {
    Object.keys(localStorage)
      .filter((k) => SYNCED_KEY.test(k) || /^mma-(farm|snow|magma|jungle)-.*-best$|^mma-visited:|^mma-touch-coach$|^mma-demo-seen:/.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* local only */ }
  forgetProgressOwner();
  try { sessionStorage.setItem(NEW_GAME_FLAG, "1"); } catch { /* lands on the menu instead */ }
  window.location.replace(window.location.pathname + window.location.hash);
}

function NewGameCard({ onBack }) {
  const [busy, setBusy] = useState(false);
  const signedIn = useCloud((s) => s.mode === "registered");
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !busy) { e.preventDefault(); onBack(); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, busy]);
  return (
    <section className="tl-card tl-newgame" role="alertdialog" aria-labelledby="tl-new-h">
      <h2 id="tl-new-h" className="tl-card-title"><Bi>Start a new game?</Bi></h2>
      <p className="tl-card-text"><Bi>This starts again from the very beginning on this device — the training, the warm-ups, every trophy and your level.</Bi></p>
      {signedIn && <p className="tl-card-text tl-card-note"><Bi>Signed-in students get their progress back from the cloud next time they sign in.</Bi></p>}
      <div className="tl-actions">
        <button className="tl-btn tl-btn-danger" disabled={busy} onClick={async () => { setBusy(true); await startNewGame(); }}>
          {busy ? <Bi>Starting…</Bi> : <Bi>Yes, start a new game</Bi>}
        </button>
        <button className="tl-btn tl-btn-ghost" onClick={onBack} disabled={busy} autoFocus><Bi>Cancel</Bi></button>
      </div>
    </section>
  );
}

/** Admin mode (data/adminMode.js): the password lock, or switch it off. */
function AdminCard({ onBack }) {
  const on = useAdmin((s) => s.on);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { if (!on && inputRef.current) inputRef.current.focus({ preventScroll: true }); }, [on]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); onBack(); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);
  async function unlock(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await useAdmin.getState().unlock(pw);
    setBusy(false);
    if (ok) { setPw(""); setErr(""); onBack(); } else { setErr("That isn't the admin password."); setPw(""); }
  }
  return (
    <section className="tl-card tl-admin-card" aria-labelledby="tl-admin-h">
      <h2 id="tl-admin-h" className="tl-card-title">🛠️ Admin mode</h2>
      {on ? (
        <>
          <p className="tl-card-text">Admin mode is on: every world gate is open, and the 🛠️ button in the game jumps to any world. Your progress isn't changed.</p>
          <div className="tl-actions">
            <button className="tl-btn tl-btn-ghost" onClick={onBack} autoFocus>Back</button>
            <button className="tl-btn tl-btn-danger" onClick={() => { useAdmin.getState().turnOff(); onBack(); }}>Turn admin mode off</button>
          </div>
        </>
      ) : (
        <form onSubmit={unlock}>
          <p className="tl-card-text">For testing new worlds: opens every gate without winning the trophies first.</p>
          <label className="tl-label" htmlFor="tl-admin-pw">Password</label>
          <input id="tl-admin-pw" ref={inputRef} className="tl-input" type="password" autoComplete="off" value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(""); }} />
          {err && <div className="tl-error" role="alert">{err}</div>}
          <div className="tl-actions">
            <button className="tl-btn tl-btn-primary" type="submit" disabled={busy || !pw}>{busy ? "Checking…" : "Unlock"}</button>
            <button className="tl-btn tl-btn-ghost" type="button" onClick={onBack}>Back</button>
          </div>
        </form>
      )}
    </section>
  );
}

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
  "The worlds open one at a time, from the easiest to the hardest — win 7 trophies in a world to open the next.",
  "Pass Pip's, Fern's and Alby's warm-ups to open the igloo gate to Snowball Sums.",
  "Signposts point the way at every junction. The painted map by the arch shows the whole island.",
  "Hold Shift to run, press Space to jump.",
];
// The same tips for a phone / iPad (no keyboard words).
const TOUCH_TIPS = [
  "Stand in front of the Achievements Wall on Harbour Green and tap Look to see every trophy you've won.",
  TIPS[1],
  TIPS[2],
  "Signposts point the way at every junction. Tap 🗺️ to see the whole map and set a waypoint.",
  "Left thumb to walk — push to the edge to run. Drag with your right thumb to look around.",
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
  const touch = useUI((s) => s.touchMode);
  const tips = touch ? TOUCH_TIPS : TIPS;
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
        <p className="tl-tip" key={tip}>{tips[tip]}</p>
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
                <p className="tl-reset-note"><Bi>Signed-in students get their progress back from the cloud next time they sign in.</Bi></p>
                <div className="tl-actions">
                  <button className="tl-btn tl-btn-danger" onClick={async () => {
                    // Signed in? Sign out FIRST (sending anything not yet saved),
                    // so the reset only clears this device — the student's cloud
                    // save is untouched and comes back next time they sign in.
                    const cloud = useCloud.getState();
                    if (cloud.mode === "registered") { try { await cloud.clearSession(); } catch { /* local reset goes on */ } }
                    resetProgress();
                    try {
                      // (The jungle's bests too — since the journey, any best keeps a
                      // world open, so a reset must clear every world's.)
                      Object.keys(localStorage).filter((k) => /^mma-(farm|snow|magma|jungle)-.*-best$|^mma-visited:|^mma-demo-seen:/.test(k)).forEach((k) => localStorage.removeItem(k));
                    } catch { /* local only */ }
                    forgetProgressOwner();
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
        <span className="tl-opt-name"><Bi>Touch controls</Bi><small><Bi>On-screen joystick, Talk and Jump buttons.</Bi></small></span>
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
  const adminOn = useAdmin((s) => s.on);
  // Just after "Start new game": straight to picking an explorer.
  const [screen, setScreen] = useState(started || JUST_STARTED_NEW_GAME ? "character" : "splash");
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
            {editing && (
              <button className="tl-item" style={{ "--i": 2 }} onClick={() => setScreen("newgame")}>
                <span className="tl-item-label"><Bi>Start new game</Bi></span>
                <span className="tl-item-sub"><Bi>Start again from the very beginning</Bi></span>
              </button>
            )}
            <button className="tl-item" style={{ "--i": 3 }} onClick={() => useUI.getState().setCloudLogin(true)}>
              <span className="tl-item-label"><Bi>Sign in with student code</Bi></span>
              <span className="tl-item-sub">
                {signedIn ? <>✓ {signedLabel}</> : <Bi>Save your work for your teacher</Bi>}
              </span>
            </button>
            <button className="tl-item" style={{ "--i": 4 }} onClick={() => setScreen("options")}>
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
        {screen === "newgame" && <NewGameCard onBack={() => setScreen("menu")} />}
        {screen === "admin" && <AdminCard onBack={() => setScreen("menu")} />}

        {(screen === "splash" || screen === "menu") && (
          <div className="tl-foot">
            <LanguageSelector compact />
            <span className="tl-credit">Mills Maths Tools</span>
            <button className={`tl-admin-link${adminOn ? " is-on" : ""}`} onClick={() => setScreen("admin")} title="Admin mode">
              {adminOn ? "🛠️ Admin on" : "🔒 Admin"}
            </button>
          </div>
        )}
      </div>
      <Curtain gone={curtainGone} />
    </div>
  );
}
