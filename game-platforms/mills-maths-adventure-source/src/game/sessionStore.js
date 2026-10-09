import { create } from "zustand";

import { DEFAULT_REGION_ID, getRegion } from "../data/regions.js";

/**
 * Session store: transient, in-memory state for the current play session.
 * Nothing here is saved to disk (that's what progress/store.js is for).
 *
 * It is the bridge between the 3D world (which detects proximity) and the
 * 2D HTML UI (which shows the prompt and the encounter modal).
 */
export const useSession = create((set, get) => ({
  // "creator" while setting up the character, "playing" once in the world.
  phase: "creator",

  // Id of the INTERACTABLE the player is currently standing near (or null).
  nearbyId: null,

  // Id of the ENCOUNTER whose modal is open (or null). Note: an interactable
  // references an encounter, so these are deliberately different id spaces.
  activeEncounterId: null,

  // A progress-aware, ad-hoc conversation (Phase 2I) — used by Sage and the
  // topic NPCs, whose lines are computed from the main-quest state rather than
  // stored statically. When set, App renders <DynamicDialogue/> for the special
  // encounter id "__dialogue__". Shape: { speaker, lines:[], action? }.
  dynamicDialogue: null,

  // Which REGION the player is currently in (W2). The renderer + Player read the
  // active region for geometry/bounds/spawn. Default is the original island.
  currentRegionId: DEFAULT_REGION_ID,

  // Tap-to-interact (W4-C): the id of the interactable the player tapped to
  // approach. REACTIVE so the "Interact with X?" confirm can appear once the
  // player arrives near it (nearbyId === approachId). Cleared on cancel/confirm,
  // on a plain ground tap, or when keyboard movement takes over.
  approachId: null,
  setApproach(id) {
    set({ approachId: id || null });
  },
  clearApproach() {
    if (get().approachId !== null) set({ approachId: null });
  },

  // Travel to another region: switch the active region and teleport the player
  // to its spawn. Used by the Teleport Gate (W2-C). No-op for an unknown id.
  setRegion(id) {
    const r = getRegion(id);
    if (!r || get().currentRegionId === r.id) return;
    set({ currentRegionId: r.id, nearbyId: null, activeEncounterId: null, dynamicDialogue: null });
    requestTeleport(r.spawn.x, r.spawn.z);
    // The Achievements Wall's explorer's log ("visited ✓" on each world's board).
    try { localStorage.setItem(`mma-visited:${r.id}`, "1"); } catch { /* a nicety only */ }
  },

  // Has the player been into the world yet this session? (The title screen
  // opens straight on the character card when "Edit character" brings it back.)
  started: false,
  startGame() {
    set({ phase: "playing", started: true });
  },

  // Re-open the character creator to edit the avatar (keeps all progress).
  openCreator() {
    set({ phase: "creator", nearbyId: null, activeEncounterId: null, dynamicDialogue: null });
  },

  // Return to the character creator and clear transient state. Used by the
  // Reset Progress buttons (paired with resetProgress() in the progress store).
  restart() {
    playerState.x = 0;
    playerState.z = 0;
    set({ phase: "creator", nearbyId: null, activeEncounterId: null, dynamicDialogue: null });
  },

  // Called by an interactable when the player enters its range.
  setNearby(id) {
    if (get().nearbyId !== id) set({ nearbyId: id });
  },

  // Called by an interactable when the player leaves its range. Only clears if
  // the interactable leaving is the one we currently think is nearby.
  clearNearby(id) {
    if (get().nearbyId === id) set({ nearbyId: null });
  },

  openEncounter(encounterId) {
    set({ activeEncounterId: encounterId });
  },

  // Open an ad-hoc, progress-aware conversation (Sage / topic NPCs).
  openDialogue(dialogue) {
    set({ dynamicDialogue: dialogue, activeEncounterId: "__dialogue__" });
  },

  closeEncounter() {
    set({ activeEncounterId: null, dynamicDialogue: null });
  },
}));

/**
 * Shared, NON-reactive player position.
 *
 * The player's position changes every animation frame. Putting it in React
 * state would trigger a re-render 60 times a second, so instead we keep it
 * in this plain object. The Player component writes to it; interactables read
 * from it inside their own useFrame loops to measure distance.
 */
export const playerState = {
  x: 0,
  y: 0, // current height (published for the DevPanel inspector)
  z: 0,
  camYaw: 0,
  // When set to { x, z }, the Player snaps there on the next frame and clears it
  // (used by "Return to Hub" / DevPanel teleports on the larger map).
  teleport: null,
  // Tap-to-move destination (W4). When set to { x, z }, the Player walks toward
  // it each frame (respecting collisions/bounds/ground) and clears it on arrival.
  // Any keyboard movement cancels it, so touch + WASD coexist. Non-reactive.
  moveTarget: null,
  // Locked-gate/boundary hint + its expiry timestamp (Phase 2H-D). The Player
  // refreshes these while near a locked gate; BlockedGatePrompt polls them and
  // shows the hint until `blockedExpiry` passes (a ≥3s linger).
  blockedHint: null,
  blockedExpiry: 0,
  // The player model's current yaw (the group's rotation.y), published each
  // frame so PlayerCharacter can rotate the jump's root motion into world
  // space — see `jumpRootStep`.
  facing: 0,
  // Jump ROOT MOTION handshake. PlayerCharacter strips the forward travel out
  // of the jump clip (so the body can't move itself and snap back) and posts
  // the world-space step it wants here; Player.jsx applies it through the
  // normal bounds/collider/step-up path, then clears it. null = not jumping.
  jumpRootStep: null,
};

/**
 * Shared, NON-reactive on-screen control state (W4-E). The touch Jump / rotate
 * buttons write here; the Player reads it each frame and OR-combines it with the
 * physical keyboard, so both input methods work together.
 */
export const touchInput = {
  jump: false,
  rotateLeft: false,
  rotateRight: false,
};

// Request the player be moved to (x, z) on the next frame.
export function requestTeleport(x, z) {
  playerState.teleport = { x, z };
}

// Tap-to-move: walk to (x, z). `approachId` optionally marks an interactable the
// player is heading toward, so the UI can offer an "Interact?" confirm on arrival
// (null clears any prior approach — used by plain ground taps).
export function requestMoveTo(x, z, approachId = null) {
  playerState.moveTarget = { x, z };
  useSession.setState({ approachId: approachId || null });
}

// Cancel any pending tap-to-move (e.g. keyboard input, stuck, or a cancelled
// approach). Also clears the approach so no confirm pops up.
export function clearMoveTarget() {
  playerState.moveTarget = null;
  useSession.setState({ approachId: null });
}
