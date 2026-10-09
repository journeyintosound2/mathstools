import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { playerState, useSession, requestMoveTo } from "./sessionStore.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";
import { getInteractableStatus } from "./interactableStatus.js";
import { groundHeightAt } from "../systems/collisionEngine.js";
import { getRegion } from "../data/regions.js";
import CharacterAvatar from "./characters/CharacterAvatar.jsx";
import { useFarmChallengeActive, useActiveSnowChallenge } from "./farmChallengeActive.js";
import { inSnowChallengeView } from "../data/snow/snowLayout.js";
import { useActiveMagmaChallenge } from "./magma/magmaActive.js";
import { inMagmaChallengeView } from "../data/magma/magmaChallenges.js";
import { MAGMA_REGION_ID } from "../data/magma/magmaLayout.js";
import { useActiveJungleChallenge } from "./jungle/jungleActive.js";
import { inJungleChallengeView } from "../data/jungle/jungleChallenges.js";
import { JUNGLE_REGION_ID } from "../data/jungle/jungleLayout.js";

// Default interaction range (in world units) if an object doesn't set one.
// NOTE: this is the INTERACTION radius (when "Press E" appears), which is
// deliberately LARGER than an object's solid COLLISION radius (in
// worldColliders) so you can stand near an object and still interact.
const INTERACT_RANGE = 3.6;

/**
 * A generic interactable object in the world.
 *
 * Driven entirely by data (src/data/interactables.js). It reports proximity to
 * the session store and shows a floating status badge whose icon/colour depend
 * on the encounter type + completion state (see interactableStatus.js). It does
 * NOT know about maths or encounter behaviour — only its own id and position.
 */
export default function Interactable({ data }) {
  const setNearby = useSession((s) => s.setNearby);
  const clearNearby = useSession((s) => s.clearNearby);
  const nearbyId = useSession((s) => s.nearbyId);
  // True whenever ANY encounter modal is open. We use this to fade the
  // world-space labels so they never overlap / clutter the modal.
  const modalOpen = useSession((s) => Boolean(s.activeEncounterId));
  // True whenever an in-world challenge (farm or snow) is running. The world
  // goes QUIET then: no badges calling for attention, no turning to face the
  // player, no talk/wave clip, and the interaction pads fade right down — the
  // challenge owns the student's attention.
  const challengeActive = useFarmChallengeActive();
  const quiet = modalOpen || challengeActive;
  // Snow challenges are filmed from the south: a host standing in the
  // camera's line (Pip beside the range, the placeholder hosts) steps out of
  // the picture entirely while its challenge runs.
  const snowKey = useActiveSnowChallenge();
  const magmaKey = useActiveMagmaChallenge();
  const jungleKey = useActiveJungleChallenge();
  const outOfShot =
    (Boolean(snowKey) && data.regionId === "snow-sums" &&
      inSnowChallengeView(snowKey, data.position[0], data.position[1])) ||
    (Boolean(magmaKey) && data.regionId === MAGMA_REGION_ID &&
      inMagmaChallengeView(magmaKey, data.position[0], data.position[1])) ||
    (Boolean(jungleKey) && data.regionId === JUNGLE_REGION_ID &&
      inJungleChallengeView(jungleKey, data.position[0], data.position[1]));
  const completed = useProgress((s) =>
    s.completedEncounters.includes(data.encounterId)
  );

  const touchMode = useUI((s) => s.touchMode);
  const [x, z] = data.position;
  const isNearby = nearbyId === data.id;
  const status = getInteractableStatus(data, completed);
  // Lift the floating badge for scaled-up characters (e.g. the boss) so it clears
  // their head instead of covering their face.
  const badgeY = badgeHeight(data.model) * (data.model === "npc" ? (data.scale || 1) : 1);
  const interactRange = data.interactionRadius || INTERACT_RANGE;

  // Ref to the character body so NPCs can turn to face the player.
  const bodyRef = useRef();
  // Mirror `quiet` into a ref so the per-frame loop can read it without
  // re-subscribing every render.
  const quietRef = useRef(quiet);
  quietRef.current = quiet;

  // Big rolling regions (the farm) set `badgeRange` / `drawRange`: a badge
  // only shows within badgeRange metres (world badges don't hide behind
  // hills, so a far one would float over the scenery), and a character is
  // only drawn within drawRange (beyond it, it's a speck in the haze).
  const region = getRegion(useSession((s) => s.currentRegionId));
  const badgeRange = region.badgeRange || Infinity;
  const drawRange = region.drawRange || Infinity;
  const [badgeFar, setBadgeFar] = useState(false);
  const badgeFarRef = useRef(false);
  const drawGate = useRef();

  // Proximity check each frame (cheap; reads the shared non-reactive position).
  // Uses the object's INTERACTION radius (larger than its collision radius).
  // NPCs also smoothly rotate to face the player as they move around.
  useFrame(() => {
    const dist = Math.hypot(playerState.x - x, playerState.z - z);
    if (dist <= interactRange) setNearby(data.id);
    else clearNearby(data.id);
    if (badgeRange < Infinity) {
      const far = badgeFarRef.current ? dist > badgeRange - 6 : dist > badgeRange;
      if (far !== badgeFarRef.current) { badgeFarRef.current = far; setBadgeFar(far); }
    }
    if (drawGate.current && drawRange < Infinity) drawGate.current.visible = dist < drawRange;

    // While a challenge (or an encounter modal) is running the NPC holds
    // still rather than tracking the player — no peripheral motion competing
    // with the maths. Freezing (rather than snapping back to rest) means the
    // change itself isn't a movement the student notices.
    if (bodyRef.current && data.model === "npc" && !quietRef.current) {
      const target = Math.atan2(playerState.x - x, playerState.z - z);
      const cur = bodyRef.current.rotation.y;
      let d = target - cur;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest way round
      bodyRef.current.rotation.y = cur + d * 0.2; // ease toward the player
    }
  });

  // Sit the object ON its surface, using the ACTIVE region's ground (the
  // Schoolyard's tiers, or island-1's plateau/stairs) so it isn't buried/floating.
  const surfaceY = region.groundHeight ? region.groundHeight(x, z) : groundHeightAt(x, z);

  // Touch (W4-C): tapping this object walks the player to the edge of its
  // interaction radius and flags it as the approach target, so the "Interact
  // with X?" confirm appears on arrival. stopPropagation keeps the tap from also
  // registering as a plain ground move. Only active in touchMode.
  function handleTap(e) {
    if (!touchMode) return;
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const dx = playerState.x - x;
    const dz = playerState.z - z;
    const d = Math.hypot(dx, dz) || 1;
    const stop = Math.max(0, interactRange - 0.8); // land comfortably inside range
    requestMoveTo(x + (dx / d) * stop, z + (dz / d) * stop, data.id);
  }

  return (
    <group position={[x, surfaceY, z]} visible={!outOfShot}>
     <group ref={drawGate}>
      {/* Glowing interaction pad, brighter when in range. Fades right down
          while a challenge runs so the ground stays clean under the action. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[interactRange, 32]} />
        <meshStandardMaterial
          color={data.color}
          transparent
          opacity={quiet ? 0.05 : isNearby ? 0.35 : 0.14}
        />
      </mesh>

      {/* The body. NPCs use the CharacterAvatar (glTF model when configured, else
          the low-poly fallback); other props (board/chest/gate/sign/trophy) keep
          their primitive Model. A `scale` makes a character larger (e.g. the boss). */}
      {data.model === "npc" ? (
        <group ref={bodyRef} onPointerDown={handleTap}>
          {/* `characterId` lets an interactable borrow another character's
              model (e.g. Pip/Fern/Alby/Mills hosting the farm challenges). */}
          {/* `nearby` drives the talk/wave clip — forced OFF while a challenge
              runs so every character rests on its idle pose instead. */}
          <CharacterAvatar
            id={data.characterId || data.id}
            color={data.color}
            scale={data.scale || 1}
            nearby={isNearby && !quiet}
          />
        </group>
      ) : (
        <group scale={data.scale || 1} onPointerDown={handleTap}>
          <Model model={data.model} color={data.color} open={completed} />
        </group>
      )}
     </group>

      {/* Floating status badge (icon + name + caption), styled by tone.
          Faded out while a modal is open OR a challenge is running, so no
          character sits there calling "Talk to me" over the maths.
          zIndexRange keeps world badges UNDER the challenge cards (z 28). */}
      <Html position={[0, badgeY, 0]} center distanceFactor={11} className="ix-badge-anchor" zIndexRange={[24, 0]}>
        <div
          className={`ix-badge tone-${status.tone} ${isNearby && !quiet ? "near" : ""} ${
            quiet || badgeFar ? "ix-hidden" : ""
          }`}
        >
          <span className="ix-badge-icon">{status.icon}</span>
          <span className="ix-badge-text">
            <span className="ix-badge-name">{data.name}</span>
            {status.label && <span className="ix-badge-label">{status.label}</span>}
          </span>
        </div>
      </Html>
    </group>
  );
}

// How high the floating badge sits, per model.
function badgeHeight(model) {
  if (model === "chest") return 1.9;
  if (model === "gate") return 3.4;
  if (model === "board") return 3.0;
  if (model === "sign") return 2.6;
  if (model === "trophy") return 2.6;
  if (model === "bench") return 2.4;
  if (model === "none") return 3.0;
  return 3.2; // npc
}

/**
 * The simple primitive "model" for each interactable. No external 3D assets.
 * Add a new shape here and a new `model` value in interactables.js to extend.
 */
function Model({ model, color, open = false }) {
  // "none": interaction/badge only — the visual lives in the region scenery
  // (e.g. the farm trophy stand glb + its dynamic cups in FarmScenery).
  if (model === "none") return null;

  if (model === "chest") {
    // The lid is hinged at the BACK top edge of the box. Rotating the hinge
    // group on X swings the lid up/back, so a claimed chest looks open.
    // `open` comes from completedEncounters, so it persists across refreshes
    // and returns to closed when progress is reset.
    return (
      <group>
        {/* Box base */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.9]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Dark interior, only really visible once the lid is open */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.0, 0.4, 0.7]} />
          <meshStandardMaterial color="#3b2a1a" />
        </mesh>
        {/* A little gold glint inside an opened chest */}
        {open && (
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.85, 0.12, 0.55]} />
            <meshStandardMaterial color="#ffd166" emissive="#d4a017" emissiveIntensity={0.4} />
          </mesh>
        )}

        {/* Hinged lid (pivot at back-top edge). */}
        <group position={[0, 0.8, -0.45]} rotation={[open ? -2.0 : 0, 0, 0]}>
          <mesh castShadow position={[0, 0.15, 0.45]}>
            <boxGeometry args={[1.25, 0.35, 0.95]} />
            <meshStandardMaterial color="#8d5524" />
          </mesh>
          {/* lock/latch, only shown when closed */}
          {!open && (
            <mesh position={[0, -0.05, 0.95]}>
              <boxGeometry args={[0.2, 0.3, 0.08]} />
              <meshStandardMaterial color="#ffd166" />
            </mesh>
          )}
        </group>
      </group>
    );
  }

  if (model === "gate") {
    return (
      <group>
        <mesh castShadow position={[-1.1, 1.4, 0]}>
          <boxGeometry args={[0.4, 2.8, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh castShadow position={[1.1, 1.4, 0]}>
          <boxGeometry args={[0.4, 2.8, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh castShadow position={[0, 2.6, 0]}>
          <boxGeometry args={[2.6, 0.4, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.4, 1.3, 0]}>
          <boxGeometry args={[0.15, 2.4, 0.15]} />
          <meshStandardMaterial color="#6c757d" />
        </mesh>
        <mesh position={[0.4, 1.3, 0]}>
          <boxGeometry args={[0.15, 2.4, 0.15]} />
          <meshStandardMaterial color="#6c757d" />
        </mesh>
      </group>
    );
  }

  if (model === "board") {
    // A mission board: two posts + a panel.
    return (
      <group>
        <mesh castShadow position={[-0.7, 0.8, 0]}><boxGeometry args={[0.18, 1.6, 0.18]} /><meshStandardMaterial color="#8d6e63" /></mesh>
        <mesh castShadow position={[0.7, 0.8, 0]}><boxGeometry args={[0.18, 1.6, 0.18]} /><meshStandardMaterial color="#8d6e63" /></mesh>
        <mesh castShadow position={[0, 1.7, 0]}><boxGeometry args={[2.0, 1.3, 0.14]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 1.7, 0.08]}><boxGeometry args={[1.7, 1.0, 0.04]} /><meshStandardMaterial color="#f1faee" /></mesh>
      </group>
    );
  }

  if (model === "sign") {
    // A signpost: a post + an angled board.
    return (
      <group>
        <mesh castShadow position={[0, 0.7, 0]}><boxGeometry args={[0.16, 1.4, 0.16]} /><meshStandardMaterial color="#8d6e63" /></mesh>
        <mesh castShadow position={[0, 1.4, 0]} rotation={[0, 0, 0.04]}><boxGeometry args={[1.3, 0.7, 0.12]} /><meshStandardMaterial color={color} /></mesh>
      </group>
    );
  }

  if (model === "bench") {
    // A display bench: plank top on two legs + a low backboard. The trophy
    // CUPS themselves are rendered dynamically (FarmScenery's TrophyShelf)
    // so they can reflect the player's live best scores.
    return (
      <group>
        {[-1.1, 1.1].map((dx) => (
          <mesh key={dx} castShadow position={[dx, 0.3, 0]}>
            <boxGeometry args={[0.22, 0.6, 0.7]} />
            <meshStandardMaterial color="#6b4f2a" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.66, 0]}>
          <boxGeometry args={[3.0, 0.14, 0.9]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh castShadow position={[0, 1.15, -0.38]}>
          <boxGeometry args={[3.0, 0.85, 0.1]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
      </group>
    );
  }

  if (model === "trophy") {
    // A trophy stand: pedestal + golden cup.
    return (
      <group>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[1.0, 0.8, 1.0]} /><meshStandardMaterial color="#6b4f2a" /></mesh>
        <mesh castShadow position={[0, 1.2, 0]}><cylinderGeometry args={[0.5, 0.28, 0.9, 16]} /><meshStandardMaterial color={color} emissive="#d4a017" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.34, 14, 14]} /><meshStandardMaterial color={color} emissive="#d4a017" emissiveIntensity={0.4} /></mesh>
      </group>
    );
  }

  // Default: an NPC (box body + sphere head), the original look.
  return (
    <group>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1, 1.4, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 2, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
