/**
 * WORLD UNLOCKS — data-driven gates/paths that open as the student progresses
 * (Phase 2G). Unlock conditions read EXISTING progress (completed missions and
 * earned badges), so nothing extra needs to be persisted — the unlock state is
 * derived (see src/systems/unlockEngine.js).
 *
 *   id        unique id
 *   name      label shown on the gate / in the DevPanel
 *   type      "bridge" | "gate" | "rewardArea" (visual only)
 *   position  [x, z]
 *   rotationY optional facing (radians)
 *   color     accent colour
 *   requires  { completedMissions?: [], badges?: [], completedEncounters?: [] }
 *             (all listed conditions must be met)
 *   hint      short text for guidance / DevPanel
 */
// SANDBOX MODEL (W1-B): the world is OPEN in free-play — every gate is passable
// so a student can roam to any character and never get stuck. Each gate keeps its
// original badge requirement as `campaignRequires` so the teacher-driven / campaign
// layer (and a future "lock the world" mode) can re-lock it later. `requires: {}`
// means the unlock engine treats it as open; `sandboxOpen` suppresses the
// "the world changed!" celebration (there's nothing to reveal — it starts open).
export const WORLD_UNLOCKS = [
  {
    id: "bridge-fdp",
    name: "Fraction Bridge",
    type: "bridge",
    position: [31, 4], // on the path from the plaza toward Fern's ash fields
    rotationY: -0.6,
    color: "#e76f51",
    requires: {},
    campaignRequires: { badges: ["integer-adventurer"] },
    sandboxOpen: true,
    hint: "Cross to the Fraction Volcano.",
  },
  {
    id: "gate-algebra",
    name: "Algebra Gate",
    type: "gate",
    position: [98.5, 4.8], // the middle of the rope bridge to Alby's lighthouse
    rotationY: 0.6,
    color: "#4cc9f0",
    requires: {},
    campaignRequires: { badges: ["fraction-explorer"] },
    sandboxOpen: true,
    hint: "Head to the Algebra Coast.",
  },
  {
    id: "reward-grove",
    name: "Champion's Grove Gate",
    type: "rewardArea",
    position: [0, -44], // the foot of Schoolhouse Hill's school gate
    color: "#ffd166",
    requires: {},
    campaignRequires: { badges: ["algebra-apprentice"] },
    sandboxOpen: true,
    hint: "Explore the Champion's Grove.",
  },
];

export function getUnlock(id) {
  return WORLD_UNLOCKS.find((u) => u.id === id) || null;
}
