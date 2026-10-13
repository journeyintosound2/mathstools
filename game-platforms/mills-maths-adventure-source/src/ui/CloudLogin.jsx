import React, { useEffect, useState } from "react";

import { useUI } from "./effects/uiStore.js";
import { useCloud } from "../cloud/cloudSession.js";
import { useProgress } from "../progress/store.js";
import { studentChipLabel } from "../cloud/studentSession.js";
import { Bi } from "../i18n/i18n.jsx";
import ProgressSyncLine from "./cloud/ProgressSyncLine.jsx";

/**
 * CloudLogin (Phase 3B) — the optional student-code / demo sign-in overlay.
 *
 * Two clear choices:
 *   1. Enter your student code → validate against Firebase `students/{code}` →
 *      cloud save ON (name comes from Firebase, NOT typed here).
 *   2. Skip / Demo → play locally only, nothing syncs.
 *
 * Invalid code → friendly error + retry + skip. Closing without choosing leaves
 * the current mode unchanged (default = pending = local only).
 */
export default function CloudLogin() {
  const open = useUI((s) => s.cloudLoginOpen);
  const setOpen = useUI((s) => s.setCloudLogin);
  const registerWithCode = useCloud((s) => s.registerWithCode);
  const skipDemo = useCloud((s) => s.skipDemo);
  const clearSession = useCloud((s) => s.clearSession);
  const status = useCloud((s) => s.status);
  const mode = useCloud((s) => s.mode);
  const student = useCloud((s) => s.student);
  const profile = useProgress((s) => s.profile);

  const [code, setCode] = useState(profile?.studentCode || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setError("");
    const r = await registerWithCode(code);
    setBusy(false);
    if (r.ok) setOpen(false);
    else setError(r.error || "Could not sign in.");
  }

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-card cloud-login-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        <h2 className="cloud-title">☁ Sign in to save online</h2>

        {mode === "registered" && student ? (
          // Signed in: where their progress is saved + a way out (a shared
          // iPad's next student signs out, then in with their own code).
          <>
            <p className="cloud-signed">Signed in as <strong>{studentChipLabel(student)}</strong> · cloud save on.</p>
            <ProgressSyncLine />
            <div className="modal-actions">
              <button className="cloud-signout" onClick={() => { clearSession(); setOpen(false); }}>
                <Bi>Sign out</Bi>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="cloud-intro">
              Enter your <strong>student code</strong> to save your results to your class account.
              Don't have one? Use <strong>Demo mode</strong> — your results still save on this device.
            </p>

            <label className="cloud-field" htmlFor="cloud-code">Student code</label>
            <input
              id="cloud-code"
              className="text-input"
              type="text"
              placeholder="e.g. ZK7Q2"
              value={code}
              maxLength={16}
              disabled={busy}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            {error && <div className="validation-msg">{error}</div>}
            {status === "connecting" && <div className="cloud-status-line">Connecting…</div>}

            <div className="modal-actions">
              <button className="primary-button" onClick={submit} disabled={busy || !code.trim()}>
                {busy ? "Checking…" : "Sign in & save online"}
              </button>
              <button className="link-button" onClick={() => { skipDemo(); setOpen(false); }}>
                Skip · Demo mode (local only)
              </button>
            </div>
          </>
        )}
        <p className="cloud-note">No name is collected here — it comes from your student record. Demo mode never syncs.</p>
      </div>
    </div>
  );
}
