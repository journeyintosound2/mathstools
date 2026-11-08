import { confirmExplorer } from "../cloud/explorerProfile.js";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import { useProgress } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import PlayerCharacter from "../game/characters/PlayerCharacter.jsx";
import { PLAYER_CHARACTERS } from "../game/characters/characterModels.js";
import { Bi, LanguageSelector } from "../i18n/i18n.jsx";
import { useCloud } from "../cloud/cloudSession.js";

// A slowly-rotating 3D preview of the CHOSEN character, idling.
function SpinningExplorer({ profile, character }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.7; });
  return (
    <group ref={ref}>
      <PlayerCharacter profile={profile} character={character} modeOverride="idle" />
    </group>
  );
}

/**
 * The welcome screen (was the character creator — the customisable avatar is
 * retired now the game has proper rigged characters). The student PICKS a
 * character (Explorer / Cool Cat / DJ Goat — a live idling preview swaps as
 * they toggle), enters their name (and optional student code), then sets off.
 */
export default function CharacterCreator() {
  const profile = useProgress((s) => s.profile);
  const setProfile = useProgress((s) => s.setProfile);
  const resetProgress = useProgress((s) => s.resetProgress);
  const startGame = useSession((s) => s.startGame);

  // A student launched from their dashboard arrives with ?code=… (or ?student=…)
  // in the URL. Use it to pre-fill the code field AND sign them in automatically,
  // so their mission / Fraction Farm completions save to their teacher without a
  // second login. Read once on mount; normalise to the same shape the code field
  // expects (upper-case, letters/digits/hyphen only).
  const urlCode = useMemo(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const raw = q.get("code") || q.get("student") || "";
      return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    } catch { return ""; }
  }, []);

  const [name, setName] = useState(profile.name || "");
  const [studentCode, setStudentCode] = useState(profile.studentCode || urlCode || "");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [signedInName, setSignedInName] = useState("");
  const [character, setCharacter] = useState(profile.character || "explorer");

  // Auto sign-in when a code came in via the URL. Non-blocking: a wrong/inactive
  // code shows why; a connection blip stays silent (they can still play, and
  // pressing Start will retry). Skips if cloud is off or already signed in.
  useEffect(() => {
    if (!urlCode) return;
    const cloud = useCloud.getState();
    if (!cloud.enabled || cloud.isRegistered()) return;
    let cancelled = false;
    (async () => {
      setSigningIn(true);
      setSignInError("");
      let result;
      try {
        result = await cloud.registerWithCode(urlCode);
      } catch (err) {
        result = { ok: false, error: String((err && err.message) || err) };
      }
      if (cancelled) return;
      setSigningIn(false);
      if (result && result.ok) {
        const s = result.student || {};
        setSignedInName(s.name || [s.firstName, s.surname].filter(Boolean).join(" ") || "");
      } else if (result) {
        const msg = result.error || "";
        if (!/connect|network|offline/i.test(msg)) setSignInError(msg);
      }
    })();
    return () => { cancelled = true; };
  }, [urlCode]);

  async function handleStart() {
    if (signingIn) return;
    const code = studentCode.trim();

    // If a student code was entered, sign in online RIGHT HERE (on the load
    // screen) so their results save to their class account and their progress
    // resumes where they left off — no need to sign in again "in world".
    if (code) {
      const cloud = useCloud.getState();
      // Skip a second sign-in if the URL auto-sign-in already registered them
      // with this same code (e.g. launched from the student dashboard).
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
        // If the code was wrong/inactive, hold on this screen and show why so
        // they can fix it. If we simply couldn't reach the cloud, don't block
        // play — fall through and let them play (results still save locally).
        if (!result.ok) {
          const msg = result.error || "Could not sign in.";
          const connIssue = /connect|network|offline/i.test(msg);
          if (!connIssue) {
            setSignInError(msg);
            return;
          }
          setSignInError("");
        }
      }
    }

    confirmExplorer({ name, character, code, prevCode: profile.studentCode || "", touchedName: name !== profile.name, touchedChar: character !== profile.character });
    startGame();
  }

  const editing = Boolean(profile.created);
  const chosen = PLAYER_CHARACTERS.find((c) => c.id === character) || PLAYER_CHARACTERS[0];

  return (
    <div className="creator-screen">
      <div className="creator-card creator-card--wide">
        {/* Language picker — first thing on load, for EALD students. */}
        <div className="creator-lang">
          <span className="creator-lang-label"><Bi>Choose your language</Bi></span>
          <LanguageSelector />
        </div>

        <h1 className="creator-title">{editing ? <Bi>Your character</Bi> : "Mills Maths Adventure"}</h1>
        <p className="creator-subtitle">
          {editing
            ? <Bi>Pick your character and update your details, then head back out!</Bi>
            : <Bi>Pick your character, tell us your name, and set off across Number Island!</Bi>}
        </p>

        <div className="creator-body">
          {/* Left column: the live spinning 3D character + the picker. */}
          <div className="creator-left">
            <div className="creator-preview" style={{ height: 320 }}>
              <Canvas camera={{ position: [0, 1.6, 3.6], fov: 40 }}>
                <hemisphereLight args={["#ffffff", "#cdeccd", 1.0]} />
                <directionalLight position={[3, 5, 4]} intensity={1.1} />
                <group position={[0, -1.2, 0]}>
                  <SpinningExplorer profile={profile} character={character} />
                </group>
              </Canvas>
            </div>

            {/* Character toggle — swaps the live preview above. */}
            <div className="char-picker" role="group" aria-label="Choose your character">
              {PLAYER_CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  className={`char-picker-btn${character === c.id ? " selected" : ""}`}
                  onClick={() => setCharacter(c.id)}
                  aria-pressed={character === c.id}
                >
                  <Bi>{c.label}</Bi>
                </button>
              ))}
            </div>
            <div className="char-blurb"><Bi>{chosen.blurb}</Bi></div>
          </div>

          {/* Right column: just the details. */}
          <div className="creator-right">
            <label className="field-label" htmlFor="student-name"><Bi>Your name</Bi></label>
            <input id="student-name" className="text-input" type="text" placeholder="e.g. Sam"
              value={name} maxLength={20} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()} />

            <label className="field-label" htmlFor="student-code">
              <Bi>Student code</Bi> <span className="field-optional"><Bi>(optional — for your teacher)</Bi></span>
            </label>
            <input id="student-code" className="text-input" type="text" placeholder="e.g. 7M-12"
              value={studentCode} maxLength={16} onChange={(e) => { setStudentCode(e.target.value); setSignInError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()} />
          </div>

          {/* Full-width actions row under both columns. */}
          <div className="creator-actions">
            <button className="primary-button" onClick={handleStart} disabled={signingIn}>
              {signingIn
                ? <Bi>Signing in…</Bi>
                : editing ? <Bi>Save & play →</Bi> : <Bi>Start Adventure →</Bi>}
            </button>
            {signInError && <div className="validation-msg" role="alert">{signInError}</div>}
            {signedInName && !signInError && (
              <div role="status" style={{ marginTop: 8, color: "#15803d", fontWeight: 600, fontSize: ".9rem" }}>
                ✓ Signed in as {signedInName} — your work will save to your teacher.
              </div>
            )}

            <button className="link-button" onClick={() => useUI.getState().setCloudLogin(true)}
              title="Save your results to your class account">
              <Bi>☁ Sign in with student code (save online)</Bi>
            </button>

            <button className="link-button" onClick={() => { resetProgress(); setName(""); setStudentCode(""); setCharacter("explorer"); }}>
              <Bi>Reset saved progress</Bi>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
