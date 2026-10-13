import { create } from "zustand";
import {
  DEFAULT_PROGRESS,
  loadProgress,
  saveProgress,
  clearProgress,
} from "./storage.js";
import { QUESTS } from "../data/quests.js";
import { shouldComplete } from "../quests/questEngine.js";
import { newProfile, suggestDifficulty } from "../maths/adaptive/adaptiveSelector.js";
import { getMission, normaliseMission, validateMission } from "../data/missions.js";
import { createMissionProgress } from "../missions/missionEngine.js";
import { isPass, scorePercent } from "../missions/scoring.js";
import { isValidBadge, makeEarnedBadge } from "../data/badges.js";

// XP required to advance one level. Keeping it constant makes the XP bar
// easy to reason about. Tweak freely (or make it scale with level later).
export const XP_PER_LEVEL = 100;

// Derive level + bar values from total XP.
export function deriveLevel(totalXp) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForLevel: XP_PER_LEVEL };
}

// Load any saved progress, then ALWAYS recompute level from total XP so the
// displayed level can never drift from the saved XP (XP is the source of truth).
const loaded = loadProgress() || DEFAULT_PROGRESS;
const initial = { ...loaded, level: deriveLevel(loaded.xp).level };

/**
 * Persistent progress store.
 *
 * Holds everything that survives a refresh: profile, total XP, coins, the set
 * of completed encounters and the set of completed quests. Every mutating
 * action writes through to storage.js so saving "just happens".
 *
 * This store knows nothing about the 3D world or the maths engines. It deals
 * only in ids and numbers, which keeps the layers cleanly separated.
 */
export const useProgress = create((set, get) => ({
  ...initial,

  // Save the character-creator choices.
  setProfile(profile) {
    set({ profile });
    saveProgress(get());
  },

  /**
   * Award raw XP / coins with no encounter attached (used by the DevPanel).
   * Returns whether the student levelled up.
   */
  awardRewards({ xp = 0, coins = 0 }) {
    const prev = get();
    const prevLevel = deriveLevel(prev.xp).level;
    const newXp = prev.xp + xp;
    set({ xp: newXp, coins: prev.coins + coins, level: deriveLevel(newXp).level });
    saveProgress(get());
    return { leveledUp: deriveLevel(newXp).level > prevLevel, newLevel: deriveLevel(newXp).level };
  },

  /**
   * Complete an encounter. This is the single entry point every encounter
   * type calls when it finishes.
   *
   *   encounterId  which encounter finished
   *   xp, coins    rewards to grant for THIS completion
   *   oneTime      if true and the encounter is already completed, grant
   *                nothing (used by treasure so coins are awarded only once)
   *
   * After recording the encounter it re-evaluates quests (which may complete
   * and grant their own rewards). Returns a summary for celebratory UI.
   */
  completeEncounter({ encounterId, xp = 0, coins = 0, oneTime = false, passed = true }) {
    const prev = get();
    const already = prev.completedEncounters.includes(encounterId);

    // One-time encounters never pay out twice.
    if (oneTime && already) {
      return {
        awarded: false,
        alreadyCompleted: true,
        passed: true,
        leveledUp: false,
        newlyCompletedQuests: [],
      };
    }

    const prevLevel = deriveLevel(prev.xp).level;
    const newXp = prev.xp + xp;
    // XP/coins are always awarded (participation + correct answers), but the
    // encounter is only RECORDED as completed — and quests only progress — when
    // the student PASSED (Phase 2G). A failed attempt earns participation XP but
    // does not unlock anything.
    const recordCompletion = passed && !already;
    const completedEncounters = recordCompletion
      ? [...prev.completedEncounters, encounterId]
      : prev.completedEncounters;

    set({
      xp: newXp,
      coins: prev.coins + coins,
      level: deriveLevel(newXp).level,
      completedEncounters,
    });
    saveProgress(get());

    // Quests may now be complete — only re-evaluated on a pass.
    const newlyCompletedQuests = passed ? get()._syncQuests() : [];

    const finalLevel = deriveLevel(get().xp).level;
    return {
      awarded: true,
      passed,
      alreadyCompleted: already,
      leveledUp: finalLevel > prevLevel,
      newLevel: finalLevel,
      newlyCompletedQuests,
    };
  },

  /**
   * Internal: auto-complete any quests whose requirements are now met and
   * whose unlock conditions are satisfied, granting their rewards once. Loops
   * so that completing one quest can immediately unlock the next in a chain.
   * Returns the list of quests completed by this call.
   */
  _syncQuests() {
    const newly = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const quest of Object.values(QUESTS)) {
        if (shouldComplete(quest, get())) {
          const xpAdd = quest.rewards?.xp || 0;
          const coinAdd = quest.rewards?.coins || 0;
          const newXp = get().xp + xpAdd;
          set({
            completedQuests: [...get().completedQuests, quest.id],
            xp: newXp,
            coins: get().coins + coinAdd,
            level: deriveLevel(newXp).level,
          });
          newly.push(quest);
          changed = true;
        }
      }
    }
    if (newly.length) saveProgress(get());
    return newly;
  },

  // Wipe everything (used by the Reset Progress buttons).
  resetProgress() {
    clearProgress();
    set({ ...DEFAULT_PROGRESS });
  },

  /**
   * CLOUD PROGRESS (2026-10-13): put a signed-in student's save in place.
   * `progress` = the merged payload's progress (progressMerge.js). merge →
   * those fields are set (the merge already kept the best of both); replace →
   * another student's save was on this device, so everything else goes back
   * to the defaults too (their active mission included). The profile stays.
   */
  applyCloudProgress(progress = {}, { replace = false } = {}) {
    const keep = [
      "xp", "coins", "completedEncounters", "completedQuests", "completedMissions", "earnedBadges",
      "skillProfiles", "onboardingSeen", "sageMet", "championClaimed", "seenUnlocks", "journey",
    ];
    const base = replace ? { ...DEFAULT_PROGRESS, profile: get().profile } : {};
    const patch = {};
    for (const k of keep) if (progress[k] !== undefined) patch[k] = progress[k];
    if (patch.journey) {
      // guideTo is a one-off hint for THIS device — a merge keeps it.
      const guideTo = replace ? null : ((get().journey || {}).guideTo ?? null);
      patch.journey = { ...DEFAULT_PROGRESS.journey, ...patch.journey, guideTo };
    }
    const xp = Number(patch.xp ?? base.xp ?? get().xp) || 0;
    set({ ...base, ...patch, xp, level: deriveLevel(xp).level });
    saveProgress(get());
  },

  // --- Developer helper: force-complete an encounter (DevPanel). ----------
  devCompleteEncounter(encounterId) {
    get().completeEncounter({ encounterId, xp: 0, coins: 0, oneTime: false });
  },

  // ====================================================================
  // ADAPTIVE-DIFFICULTY PERFORMANCE PROFILES (per skill)
  // ====================================================================

  // Read a skill's profile (or a fresh default if none yet).
  getSkillProfile(skillId) {
    return get().skillProfiles[skillId] || newProfile();
  },

  // The difficulty level to serve next for a skill (defaults to Medium = 2).
  getWorkingDifficulty(skillId) {
    return get().skillProfiles[skillId]?.workingDifficulty ?? 2;
  },

  /**
   * Record one attempt at a skill and let the adaptive selector nudge the
   * working difficulty. The selector decides the new level from the streaks;
   * when the level moves we reset the streaks so it steps gradually.
   * Returns the updated profile.
   */
  recordSkillAttempt(skillId, isCorrect) {
    const profiles = { ...get().skillProfiles };
    const p = { ...(profiles[skillId] || newProfile()) };

    p.attempts += 1;
    if (isCorrect) {
      p.correct += 1;
      p.streak += 1;
      p.incorrectStreak = 0;
    } else {
      p.streak = 0;
      p.incorrectStreak += 1;
    }
    p.accuracy = Math.round((p.correct / p.attempts) * 100);
    p.lastAttempt = Date.now();

    const suggested = suggestDifficulty(p);
    if (suggested !== p.workingDifficulty) {
      p.workingDifficulty = suggested;
      p.streak = 0;
      p.incorrectStreak = 0;
    }

    profiles[skillId] = p;
    set({ skillProfiles: profiles });
    saveProgress(get());
    return p;
  },

  // ====================================================================
  // MISSIONS / BADGES (Phase 2D)
  //
  // The store OWNS persistence and reward-granting; the pure missionEngine
  // owns the maths (filters, generation, progress maths). This keeps the
  // curriculum logic separate from game/progress code. A Firebase teacher
  // portal would later replace storage.js's read/write and write missions
  // remotely — these store actions would be unchanged.
  // ====================================================================

  // The active mission object (the stored object is the source of truth so
  // teacher-built missions work; falls back to the registry by id).
  getActiveMission() {
    return get().activeMission || (get().activeMissionId ? getMission(get().activeMissionId) : null);
  },

  // True once this mission's rewards have been granted (award-once guard).
  isMissionCompleted(missionId) {
    return get().completedMissions.includes(missionId);
  },

  /**
   * Activate a mission locally: it becomes the active mission and a fresh
   * progress record is created. Re-activating a mission already completed is
   * allowed (e.g. for practice) but will not pay its rewards again.
   */
  activateMission(missionId) {
    const mission = getMission(missionId);
    if (!mission) return false;
    set({
      activeMission: mission,
      activeMissionId: mission.missionId,
      missionProgress: createMissionProgress(mission),
    });
    saveProgress(get());
    return true;
  },

  /**
   * Activate a teacher-built (ad-hoc) mission from a raw config object, e.g.
   * from the prototype Teacher Mission Setup panel. The raw object is normalised
   * and validated against the curriculum. Returns { ok, problems }.
   */
  activateCustomMission(raw) {
    const mission = normaliseMission(raw);
    const { valid, problems } = validateMission(mission);
    if (!valid) return { ok: false, problems };
    set({
      activeMission: mission,
      activeMissionId: mission.missionId,
      missionProgress: createMissionProgress(mission),
    });
    saveProgress(get());
    return { ok: true, problems: [], mission };
  },

  // Stop driving the game by a mission (keeps completed missions & badges).
  clearActiveMission() {
    set({ activeMission: null, activeMissionId: null, missionProgress: null });
    saveProgress(get());
  },

  /**
   * Reset TEACHER / FREE-CHOICE mission state only (Phase 2J). Clears the active
   * mission and forgets completed NON-story missions so they can be re-assigned,
   * WITHOUT touching the curated main story (npc-* missions and story flags) or
   * the maths/skill profiles. Keeps the two systems cleanly separate.
   */
  resetFreeChoiceMissions() {
    const keptCompleted = (get().completedMissions || []).filter((id) =>
      String(id).startsWith("npc-")
    );
    const active = get().getActiveMission();
    const clearActive = active && active.kind !== "story";
    set({
      completedMissions: keptCompleted,
      ...(clearActive ? { activeMission: null, activeMissionId: null, missionProgress: null } : {}),
    });
    saveProgress(get());
  },

  /**
   * Reset WORLD progression only (Phase 2G): clears the signals that gate the
   * world — completed missions, completed encounters, earned badges and the
   * active mission — so zones re-lock and quest chains restart. Keeps XP, coins,
   * level, profile and adaptive skill profiles intact.
   */
  resetWorldProgression() {
    set({
      completedMissions: [],
      completedEncounters: [],
      completedQuests: [],
      earnedBadges: [],
      activeMission: null,
      activeMissionId: null,
      missionProgress: null,
      // Restart the guided journey too (keeps XP/coins/profile/skill profiles).
      sageMet: false,
      championClaimed: false,
      seenUnlocks: [],
    });
    saveProgress(get());
  },

  // ====================================================================
  // STORY / ONBOARDING (Phase 2I)
  //
  // Tiny persisted narrative flags. The maths-driven main-quest steps remain
  // DERIVED from badges/missions (see data/mainQuest.js); these only record the
  // few story beats that must not replay (welcome shown, Sage met, reward
  // claimed, which unlock celebrations were dismissed).
  // ====================================================================

  setOnboardingSeen(seen = true) {
    set({ onboardingSeen: Boolean(seen) });
    saveProgress(get());
  },

  setSageMet(met = true) {
    if (get().sageMet === Boolean(met)) return;
    set({ sageMet: Boolean(met) });
    saveProgress(get());
  },

  // Claim the Island Champion reward (final main-quest step). One-way latch.
  claimChampion() {
    if (get().championClaimed) return false;
    set({ championClaimed: true });
    saveProgress(get());
    return true;
  },

  // Record that an unlock's celebration banner has been dismissed (so it never
  // replays). Idempotent.
  markUnlockSeen(unlockId) {
    if (!unlockId || get().seenUnlocks.includes(unlockId)) return;
    set({ seenUnlocks: [...get().seenUnlocks, unlockId] });
    saveProgress(get());
  },

  // ====================================================================
  // THE JOURNEY (2026-10-13) — the saved story beats of the progression
  // (data/journey.js). `patch` is merged into `journey`; list helpers add an
  // id once. Which gates are open is DERIVED, never stored.
  // ====================================================================
  updateJourney(patch = {}) {
    const next = { ...(get().journey || {}), ...patch };
    set({ journey: next });
    saveProgress(get());
    return next;
  },
  journeyAdd(listName, id) {
    const j = get().journey || {};
    const list = Array.isArray(j[listName]) ? j[listName] : [];
    if (!id || list.includes(id)) return false;
    get().updateJourney({ [listName]: [...list, id] });
    return true;
  },

  // DevPanel: replay the first-time onboarding (welcome + meet Sage).
  resetOnboarding() {
    set({ onboardingSeen: false, sageMet: false });
    saveProgress(get());
  },

  // DevPanel: reset the narrative flags only (keeps maths progress/badges).
  // Use "Reset world progression" for a full journey restart.
  resetMainQuestFlags() {
    set({ sageMet: false, championClaimed: false, seenUnlocks: [] });
    saveProgress(get());
  },

  // Restart progress on the active mission only (keeps everything else).
  resetMissionProgress() {
    const mission = get().getActiveMission();
    set({ missionProgress: mission ? createMissionProgress(mission) : null });
    saveProgress(get());
  },

  /**
   * Award a badge to the student exactly once. Returns the badge record if it
   * was newly earned, or null if invalid / already held.
   */
  awardBadge(badgeId) {
    if (!badgeId || !isValidBadge(badgeId)) return null;
    if (get().earnedBadges.some((b) => b.badgeId === badgeId)) return null;
    const record = makeEarnedBadge(badgeId);
    set({ earnedBadges: [...get().earnedBadges, record] });
    saveProgress(get());
    return record;
  },

  hasBadge(badgeId) {
    return get().earnedBadges.some((b) => b.badgeId === badgeId);
  },

  /**
   * Record one answered mission question — PROGRESS TRACKING ONLY (Phase 2G).
   * It updates answered/correct so the HUD can show live progress, but it does
   * NOT complete the mission or grant rewards. Completion is decided at the end
   * of the challenge by finalizeActiveMission(), based on the PASS THRESHOLD —
   * so answering every question without passing no longer completes a mission.
   */
  recordMissionAttempt(isCorrect, xpEarned = 0) {
    const mission = get().getActiveMission();
    if (!mission) return { active: false };

    const prev =
      get().missionProgress && get().missionProgress.missionId === mission.missionId
        ? get().missionProgress
        : createMissionProgress(mission);
    const progress = { ...prev };
    progress.answered += 1;
    if (isCorrect) progress.correct += 1;
    progress.xpEarned += Math.max(0, Math.round(xpEarned));

    set({ missionProgress: progress });
    saveProgress(get());
    return { active: true, answered: progress.answered, correct: progress.correct };
  },

  /**
   * Finish the active mission for a completed challenge. Only a PASS (score ≥
   * PASS_THRESHOLD) completes the mission and grants its rewards (XP/coins/badge)
   * exactly once. A fail leaves the mission incomplete so no badge/gate unlocks.
   *
   *   { correct, total }  the challenge result
   * Returns { passed, scorePercent, justCompleted, badge, rewardXP, rewardCoins,
   *           leveledUp, newLevel }.
   */
  finalizeActiveMission({ correct = 0, total = 0 } = {}) {
    const mission = get().getActiveMission();
    if (!mission) return { active: false, passed: false };

    const passed = isPass(correct, total);
    const base = {
      active: true,
      passed,
      scorePercent: scorePercent(correct, total),
      justCompleted: false,
      badge: null,
      rewardXP: 0,
      rewardCoins: 0,
      leveledUp: false,
      newLevel: deriveLevel(get().xp).level,
    };

    const prog = {
      ...(get().missionProgress && get().missionProgress.missionId === mission.missionId
        ? get().missionProgress
        : createMissionProgress(mission)),
    };
    const alreadyDone = prog.rewarded || get().completedMissions.includes(mission.missionId);

    if (passed && !alreadyDone) {
      prog.complete = true;
      prog.rewarded = true;
      prog.completedAt = Date.now();
      const prevLevel = deriveLevel(get().xp).level;
      const newXp = get().xp + (mission.rewardXP || 0);
      set({
        xp: newXp,
        coins: get().coins + (mission.rewardCoins || 0),
        level: deriveLevel(newXp).level,
        completedMissions: [...get().completedMissions, mission.missionId],
        missionProgress: prog,
      });
      const badge = mission.rewardBadge ? get().awardBadge(mission.rewardBadge) : null;
      saveProgress(get());
      return {
        ...base,
        justCompleted: true,
        badge: badge ? badge.badgeId : null,
        rewardXP: mission.rewardXP || 0,
        rewardCoins: mission.rewardCoins || 0,
        leveledUp: deriveLevel(newXp).level > prevLevel,
        newLevel: deriveLevel(newXp).level,
      };
    }

    set({ missionProgress: prog });
    saveProgress(get());
    return base;
  },
}));
