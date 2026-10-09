import React from "react";

import { useProgress } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";

/**
 * OnboardingWelcome (Phase 2I) — a short, one-time welcome shown only for a
 * BRAND-NEW save. It points the player to Mills on Harbour Green, then gets
 * out of the way (the player stays in control — no cutscene). Closing it sets
 * onboardingSeen, so it never replays after a refresh.
 *
 * It hides while any encounter modal is open so it can't overlap a conversation.
 */
export default function OnboardingWelcome() {
  const phase = useSession((s) => s.phase);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const onboardingSeen = useProgress((s) => s.onboardingSeen);
  const setOnboardingSeen = useProgress((s) => s.setOnboardingSeen);

  if (phase !== "playing" || onboardingSeen || activeEncounterId) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-emoji">🏝️</div>
        <h2 className="onboarding-title">Welcome to Number Island</h2>
        <p className="onboarding-text">
          The whole island is open — follow Main Street through the arch and explore! Say hello to{" "}
          <strong>Mills</strong> right here on the green, then find <strong>Pip</strong>, <strong>Fern</strong>{" "}
          and <strong>Alby</strong> for a number warm-up each. Every world has its own gate, and the{" "}
          <strong>Achievements Wall</strong> beside the arch shows everything you win.
        </p>
        <button className="primary-button" onClick={() => setOnboardingSeen(true)}>
          Let’s go!
        </button>
        <button className="link-button" onClick={() => { setOnboardingSeen(true); useUI.getState().setHowTo(true); }}>
          How to play
        </button>
      </div>
    </div>
  );
}
