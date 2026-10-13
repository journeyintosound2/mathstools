/**
 * Persistence layer (Version 1: localStorage only).
 *
 * This file is the ONLY place that knows *where* progress is stored.
 * The rest of the app just calls loadProgress() / saveProgress().
 *
 * ---------------------------------------------------------------------------
 * SWAPPING IN FIREBASE LATER:
 * Replace the bodies of loadProgress() and saveProgress() with Firestore
 * reads/writes (e.g. doc(db, "students", uid)). Because everything else
 * depends only on these two function signatures, no other file needs to
 * change. You may want to make them async and await them in the store.
 * ---------------------------------------------------------------------------
 */

import { DEFAULT_JOURNEY } from "../data/journey.js";

const STORAGE_KEY = "mills-maths-adventure:v1";

// The shape we persist. Kept flat and JSON-friendly on purpose.
export const DEFAULT_PROGRESS = {
  // profile.studentCode + classCode are LOCAL-only optional fields for the
  // Year 7 classroom pilot (Phase 2O). No login, no accounts — just a display
  // name and an optional code a teacher can use to identify a device's results.
  // `color` is the outfit colour; skin/hair/hairStyle/hat/hatColour/glasses are
  // the enriched "shape" avatar (W3-A). `created` is set once the student has
  // designed their character, so we don't force the creator on every launch.
  profile: {
    name: "", color: "#3a86ff", studentCode: "", classCode: "",
    skin: "#f1c27d", hair: "#3b2a1a", hairStyle: "short",
    hat: "none", hatColour: "#e63946", glasses: false,
    // The chosen rigged player character (W7-B): "explorer" | "cat" | "goat".
    character: "explorer",
    created: false,
  },
  level: 1,
  xp: 0, // total XP earned
  coins: 0,
  completedEncounters: [], // encounter ids finished at least once (incl. one-time treasure)
  completedQuests: [], // quest ids whose rewards have been granted
  // Adaptive-difficulty performance profiles, keyed by skill id. Each holds
  // attempts/correct/streaks/accuracy/workingDifficulty (see adaptiveSelector).
  skillProfiles: {},

  // --- Missions / badges (Phase 2D) ---
  // The active mission is stored as a full (normalised) object so that
  // teacher-built ad-hoc missions — which aren't in the static MISSIONS
  // registry — survive a reload. activeMissionId is kept for convenience.
  activeMission: null, // the mission object currently driving the game (or null)
  activeMissionId: null, // its id (or null)
  missionProgress: null, // progress record for the active mission (see missionEngine)
  completedMissions: [], // mission ids whose rewards have been granted (award-once)
  earnedBadges: [], // [{ badgeId, earnedAt }] — the student's badge collection

  // --- Story / onboarding (Phase 2I) ---
  // Tiny persisted flags for the guided journey. The maths steps stay DERIVED
  // from badges/missions; these only track narrative beats so they don't replay.
  onboardingSeen: false, // the first-time welcome overlay has been shown
  sageMet: false, // the player has spoken to Sage at least once (main quest step 1)
  championClaimed: false, // the Island Champion reward has been claimed (final step)
  seenUnlocks: [], // unlock ids whose celebration banner has been dismissed

  // --- The journey (2026-10-13) — the progression: training on Harbour
  // Green, then each world's gate opening in turn (see data/journey.js). Only
  // the story beats are saved here (training step, intros seen, gates
  // celebrated); which gates are OPEN is always DERIVED from the warm-ups and
  // trophies, so it can never drift from the real save.
  journey: DEFAULT_JOURNEY,
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields don't break old saves.
    return {
      ...DEFAULT_PROGRESS, ...parsed,
      profile: { ...DEFAULT_PROGRESS.profile, ...parsed.profile },
      journey: { ...DEFAULT_JOURNEY, ...(parsed.journey || {}) },
    };
  } catch (err) {
    console.warn("Could not load saved progress:", err);
    return null;
  }
}

export function saveProgress(state) {
  try {
    const toSave = {
      profile: state.profile,
      level: state.level,
      xp: state.xp,
      coins: state.coins,
      completedEncounters: state.completedEncounters,
      completedQuests: state.completedQuests,
      skillProfiles: state.skillProfiles,
      // Missions / badges (Phase 2D).
      activeMission: state.activeMission,
      activeMissionId: state.activeMissionId,
      missionProgress: state.missionProgress,
      completedMissions: state.completedMissions,
      earnedBadges: state.earnedBadges,
      // Story / onboarding (Phase 2I).
      onboardingSeen: state.onboardingSeen,
      sageMet: state.sageMet,
      championClaimed: state.championClaimed,
      seenUnlocks: state.seenUnlocks,
      // The journey (2026-10-13).
      journey: state.journey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear progress:", err);
  }
}
