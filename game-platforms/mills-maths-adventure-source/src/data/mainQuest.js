/**
 * MAIN QUEST CHAIN — "Unlock Number Island" (Phase 2I).
 *
 * ARCHITECTURE — two separate systems, deliberately kept apart:
 *
 *   1. MAIN_QUEST_CHAIN (this file) — the CURATED default story path. It is
 *      hand-authored and IS allowed to name specific NPCs/topics:
 *        Pip = Integers, Fern = FDP, Alby = Algebra, then Retrieval Practice Playground.
 *      It reuses the flexible mission system for its steps (the npc-* missions),
 *      but it is just one fixed itinerary through that system.
 *
 *   2. THE MISSION SYSTEM (data/missions.js, missions/missionEngine.js and the
 *      curriculum registry) — FLEXIBLE topic/skill/difficulty assignment. Teacher
 *      and free-choice missions can target ANY registered topic/skill and are
 *      NOT limited to Integers/FDP/Algebra. Guidance for those missions goes
 *      through data/questTargets.js, which maps a topic to a zone/NPC where one
 *      exists and otherwise falls back safely to the Mission Board.
 *
 * Nothing in the mission system depends on this curated chain; this chain only
 * consumes the mission system. Keep that direction of dependency.
 *
 * The student's guided journey is expressed as PURE data + derivations. Like the
 * unlock engine, the main quest carries NO new persisted progression of its own
 * for the maths steps — each step is DERIVED from existing progress (earned
 * badges / completed missions), so it always matches the real save and survives
 * a refresh automatically.
 *
 * Three tiny extra flags DO get persisted (in the progress store): whether the
 * welcome was seen, whether Sage has been met, and whether the Champion reward
 * was claimed. They're pure booleans — no maths/curriculum logic here.
 *
 * This module imports ONLY data + the pure unlock engine. No React, no stores.
 *
 * Snapshot shape (built by mainQuestSnapshot):
 *   { onboardingSeen, sageMet, championClaimed,
 *     completedMissions:[], earnedBadges:[{badgeId}], completedEncounters:[],
 *     activeMissionId, missionProgress }
 */
import { getChain } from "./npcQuestChains.js";
import { getInteractable } from "./interactables.js";
import { resolveMissionTarget } from "./questTargets.js";
import {
  getNpcAction,
  isUnlockedById,
  getUnlockStates,
} from "../systems/unlockEngine.js";
import { SCHOOLYARD_CHARACTERS } from "./schoolyard/schoolyardLayout.js";
import { isBossCharacter, isBossUnlocked, isBossDefeated, keysEarned, SCHOOLYARD_KEY_COUNT } from "./schoolyard/schoolyardProgress.js";

function badgeIds(snap) {
  return (snap.earnedBadges || []).map((b) => b.badgeId);
}

// ---- Main quest steps -----------------------------------------------------
// Each non-terminal step knows when it is `done` (derived) and where to point
// guidance. The terminal "champion" step is appended when every step is done.

export const MAIN_QUEST_CHAIN = {
  id: "unlock-number-island",
  title: "Unlock Number Island",
  steps: [
    {
      id: "meet-sage",
      label: "Speak to Mills near where you start",
      hint: "Talk to Mills near where you start",
      targetId: "sage",
      done: (s) => Boolean(s.sageMet),
    },
    {
      id: "pip",
      label: "Complete Pip's Integer mission",
      hint: "Find Pip at Pip's Number Line",
      targetId: "pip",
      // Tied to the STORY mission id (npc-pip-1), not just the badge — so a
      // teacher/free Integer mission that happens to award the same badge does
      // NOT advance the main story.
      done: (s) => (s.completedMissions || []).includes("npc-pip-1"),
    },
    {
      id: "fern",
      label: "Complete Fern's FDP mission at Fern's Ash Fields",
      hint: "Find Fern at Fern's Ash Fields",
      targetId: "fern",
      done: (s) => (s.completedMissions || []).includes("npc-fern-1"),
    },
    {
      id: "alby",
      label: "Complete Alby's mission at Alby's Lighthouse",
      hint: "Find Alby at Alby's Lighthouse",
      targetId: "alby",
      done: (s) => (s.completedMissions || []).includes("npc-alby-1"),
    },
  ],
};

// The terminal state — the island journey is done; the next step is travelling
// on. (W6-B: Retrieval Practice Playground now holds the portal to the SchoolYard.)
export const CHAMPION_STEP = {
  id: "champion",
  label: "Island explored!",
  hint: "Head up Schoolhouse Hill and through the school gate to the Retrieval Practice Playground.",
  targetId: null,
  done: () => true,
};

/**
 * Resolve the main quest to the CURRENT step: the first step that is not yet
 * done. When every step is done, returns the terminal Champion step with
 * complete=true.
 */
// Back-compat alias (older imports used MAIN_QUEST). MAIN_QUEST_CHAIN is the
// canonical name now that the curated chain is clearly distinct from missions.
export const MAIN_QUEST = MAIN_QUEST_CHAIN;

export function resolveMainQuest(snap = {}) {
  const steps = MAIN_QUEST_CHAIN.steps;
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i].done(snap)) return { stepIndex: i, step: steps[i], complete: false };
  }
  return { stepIndex: steps.length, step: CHAMPION_STEP, complete: true };
}

/** Light "what next?" guidance for the curated chain. Pure. */
export function mainQuestGuidance(snap = {}) {
  const { step } = resolveMainQuest(snap);
  return { text: step.hint, targetId: step.targetId, stepId: step.id, source: "mainQuest" };
}

/**
 * The single "where do I go now?" resolver the HUD + marker use. It cleanly
 * separates the two systems:
 *
 *   - If a TEACHER/FREE-CHOICE mission is active and unfinished, guide the
 *     student to where that mission's TOPIC is played — a dedicated zone/NPC if
 *     one exists, otherwise the Mission Board (via questTargets, never forced
 *     onto Pip/Fern/Alby).
 *   - Otherwise follow the curated MAIN_QUEST_CHAIN.
 *
 * NPC-chain missions (id `npc-*`) belong to the curated story, so they do NOT
 * trigger the free-choice override — the chain guidance handles them.
 *
 * `activeMission` is the full active-mission object (or null).
 */
export function resolveStudentGuidance(snap = {}, activeMission = null) {
  // Only non-story (teacher/free) missions override the curated chain. Story
  // missions (kind "story", the npc-* chains) are owned by the chain guidance.
  const isStory =
    !activeMission ||
    activeMission.kind === "story" ||
    String(activeMission.missionId || "").startsWith("npc-");
  if (activeMission && !isStory) {
    const done =
      (snap.missionProgress && snap.missionProgress.complete) ||
      (snap.completedMissions || []).includes(activeMission.missionId);
    if (!done) {
      const t = resolveMissionTarget(activeMission);
      return { text: t.text, targetId: t.targetId, source: "mission", fallback: Boolean(t.fallback) };
    }
  }
  return mainQuestGuidance(snap);
}

/**
 * Dialogue shown when the student reaches the NPC/marker a teacher/free-choice
 * mission is routed to. It offers to START/RESUME that assigned mission (the
 * mission's own selected skills/difficulty — NOT the NPC's default story
 * mission). Pure. `npcId` may be a topic NPC (Pip/Fern/Alby) or a marker.
 */
export function assignedMissionDialogue(npcId, mission) {
  const speaker = (NPC_META[npcId] && NPC_META[npcId].speaker) || "Guide";
  return {
    speaker,
    lines: [
      "You have an assigned mission to complete here!",
      `“${mission.title}” — give it your best.`,
      "Score at least 60% to pass.",
    ],
    action: { label: "Start assigned mission", missionId: mission.missionId },
  };
}

/** Should the first-time welcome overlay auto-show? Only for a brand-new save. */
export function shouldShowOnboarding(snap = {}) {
  return !snap.onboardingSeen;
}

// ---- Sage dialogue (progress-aware) ---------------------------------------
// Keyed by the CURRENT main-quest step, so Sage always explains the next move.

const SAGE_LINES = {
  "meet-sage": [
    "Welcome, Explorer! I'm Mills, and this is Number Island — the whole island is yours to explore.",
    "Pip, Fern and Alby each have a quick number warm-up: Pip is under Frosty Peak, Fern is in the ash fields below Ember Peak, and Alby is out at the lighthouse.",
    "The school gate on Schoolhouse Hill leads to the Retrieval Practice Playground — nine teachers, nine keys and the Head Teacher.",
    "Every other world has its own gate too — the igloo, the volcano arch, the haybales and the mossy arch. Follow the signposts, or check the big map by the arch.",
    "And see the wall beside the arch? That's your Achievements Wall. Stand in front of it and press Enter (or tap a board) to see everything you've won.",
  ],
  pip: [
    "The whole island is open — explore and try a warm-up with any character.",
    "Pip, Fern and Alby each have a quick number challenge for you.",
    "Up Main Street, through the plaza, then follow the signposts — Pip's thermometer stands under Frosty Peak.",
  ],
  fern: [
    "Nice going! Keep exploring the island at your own pace.",
    "Fern is down in her ash fields below Ember Peak if you'd like another challenge.",
  ],
  alby: [
    "You're on a roll — the whole island is yours to roam.",
    "Alby is out at the lighthouse — take the east road and cross the rope bridge.",
  ],
  grove: [
    "Wonderful work — Pip, Fern and Alby are all done! The Retrieval Practice Playground is through the school gate on Schoolhouse Hill.",
    "Wander in whenever you like.",
  ],
  champion: [
    "You are an Island Champion!",
    "Replay warm-ups or explore the island freely.",
  ],
};

/** The lines Sage should speak right now, based on progress. Pure. */
export function sageDialogue(snap = {}) {
  const { step } = resolveMainQuest(snap);
  return SAGE_LINES[step.id] || SAGE_LINES["meet-sage"];
}

// ---- Topic-NPC dialogue (before / retry / after a mission) ----------------

const NPC_META = {
  pip: { speaker: "Pip", zone: "Pip's Number Line", unlocks: "Fern's Ash Fields", topic: "integer" },
  fern: { speaker: "Fern", zone: "Fern's Ash Fields", unlocks: "Alby's Lighthouse", topic: "FDP" },
  alby: { speaker: "Alby", zone: "Alby's Lighthouse", unlocks: "Retrieval Practice Playground", topic: "algebra" },
};

// Schoolyard characters (W2-F) — generated from the layout list with their Coffs
// Coast flavour lines.
for (const c of SCHOOLYARD_CHARACTERS) {
  NPC_META[c.id] = {
    speaker: c.name, zone: "the Schoolyard", unlocks: "the schoolyard",
    topic: "number", flavor: c.flavor,
  };
}

/**
 * Progress-aware dialogue for a topic NPC. Returns:
 *   { speaker, lines, action? }
 * where `action = { label, missionId }` means "start this mission" (offered as a
 * button). NPC missions are STILL begun by talking to the NPC — never from the
 * HUD or board. When the chain is finished there is no action (just a cheer).
 */
export function npcDialogue(npcId, snap = {}) {
  const meta = NPC_META[npcId];
  const chain = getChain(npcId);
  if (!meta || !chain) return { speaker: "?", lines: ["..."] };

  const cm = snap.completedMissions || [];
  const action = getNpcAction(chain, cm);

  // Boss (Head Teacher) gating — only for her DEFAULT challenge (a teacher task
  // overlaid on her, i.e. a teacher step, bypasses the lock).
  if (isBossCharacter(npcId) && !(action.step && action.step.teacher)) {
    if (isBossDefeated(cm)) {
      const bossChar = SCHOOLYARD_CHARACTERS.find((c) => c.id === npcId);
      return { speaker: meta.speaker, lines: bossChar ? bossChar.complete : ["Well done, champion!"] };
    }
    if (!isBossUnlocked(cm)) {
      return {
        speaker: meta.speaker,
        lines: [
          "I'm the Head Teacher — you'll need all 8 keys to take me on!",
          `You've earned ${keysEarned(cm)} of ${SCHOOLYARD_KEY_COUNT}. Beat the other staff to collect the rest.`,
        ],
      };
    }
    // Unlocked and not yet defeated → fall through and offer the challenge.
  }

  if (action.kind === "complete") {
    return {
      speaker: meta.speaker,
      lines: [
        "Nice warm-up — thanks for the number practice!",
        "Explore the island, or see if your teacher has set you a task.",
      ],
    };
  }

  // Teacher-assigned task: present a generic intro (safe even when the task is
  // off-theme for this NPC) using the assignment's own title/description. When
  // several tasks are queued on this NPC, show the position ("Task 2 of 3").
  if (action.step && action.step.teacher) {
    const retrying =
      snap.activeMissionId === action.missionId &&
      snap.missionProgress &&
      !snap.missionProgress.complete;
    const teacherSteps = (chain.steps || []).filter((s) => s.teacher);
    const total = teacherSteps.length;
    const doneCount = teacherSteps.filter((s) => cm.includes(s.missionId)).length;
    const position = Math.min(total, doneCount + 1);
    const opener =
      total > 1
        ? `Your teacher set ${total} tasks here — this is task ${position} of ${total}.`
        : "Your teacher set a task for you here!";
    return {
      speaker: meta.speaker,
      lines: retrying
        ? ["Don't give up — you've got this!", "Score at least 60% to pass. Ready to try again?"]
        : [
            opener,
            `“${action.step.label}” — ${action.step.intro}`,
            "Score at least 60% to pass — ready?",
          ],
      action: { label: retrying ? "Try again" : "Start task", missionId: action.missionId },
    };
  }

  // "Retry" = they have this very warm-up active but haven't passed it yet.
  const isRetry =
    snap.activeMissionId === action.missionId &&
    snap.missionProgress &&
    !snap.missionProgress.complete;

  let lines;
  let label;
  if (isRetry) {
    lines = ["Don't give up — you've got this!", "Score at least 60% to pass. Ready to try again?"];
    label = "Try again";
  } else {
    lines = [
      `Hi! I'm ${meta.speaker} — welcome to ${meta.zone}.`,
      ...(meta.flavor ? [meta.flavor] : []),
      "Fancy a quick number warm-up? Score at least 60% to pass — ready?",
    ];
    label = "Start warm-up";
  }
  return { speaker: meta.speaker, lines, action: { label, missionId: action.missionId } };
}

// What Sage-like Island Spirit says at the Retrieval Practice Playground podium.
export const CHAMPION_CLAIM_LINES = [
  "You opened every path on Number Island!",
  "Integers, Fractions and Algebra — all mastered.",
  "You are the Island Champion. Wear it with pride!",
];

// ---- Unlock celebration moments -------------------------------------------
// Short, one-line "the world changed!" banners. Keyed by unlock id.

export const UNLOCK_CELEBRATIONS = {
  "bridge-fdp": { icon: "🌉", message: "The Fraction Bridge rises!" },
  "gate-algebra": { icon: "⚡", message: "The Algebra path is open!" },
  "reward-grove": { icon: "🏆", message: "Pip, Fern and Alby — all done!" },
};

/**
 * The first unlock that is open but whose celebration hasn't been seen yet, or
 * null. Pure — `seenUnlocks` is the persisted list of celebrations already
 * dismissed, so a celebration never replays after a refresh.
 */
export function pendingCelebration(snap = {}) {
  const seen = snap.seenUnlocks || [];
  const states = getUnlockStates(snap);
  // Sandbox gates start open, so there's nothing to "reveal" — skip their
  // celebration (only a gate that actually transitions from locked → open, i.e.
  // a campaign gate, should celebrate).
  const hit = states.find(
    (u) => u.unlocked && !u.sandboxOpen && UNLOCK_CELEBRATIONS[u.id] && !seen.includes(u.id)
  );
  if (!hit) return null;
  return { id: hit.id, ...UNLOCK_CELEBRATIONS[hit.id] };
}

// ---- Snapshot builder -----------------------------------------------------

/** Build the pure snapshot the functions above expect, from a progress state. */
export function mainQuestSnapshot(p = {}) {
  return {
    onboardingSeen: Boolean(p.onboardingSeen),
    sageMet: Boolean(p.sageMet),
    championClaimed: Boolean(p.championClaimed),
    seenUnlocks: p.seenUnlocks || [],
    completedMissions: p.completedMissions || [],
    earnedBadges: p.earnedBadges || [],
    completedEncounters: p.completedEncounters || [],
    activeMissionId: p.activeMissionId || null,
    missionProgress: p.missionProgress || null,
  };
}

/** Resolve the current main-quest target interactable (or null). */
export function mainQuestTarget(snap = {}) {
  const { step } = resolveMainQuest(snap);
  return step.targetId ? getInteractable(step.targetId) : null;
}

// Re-export so callers can check a single unlock without importing the engine.
export { isUnlockedById };
