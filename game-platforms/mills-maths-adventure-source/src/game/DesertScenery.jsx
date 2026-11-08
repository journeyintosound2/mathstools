import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { queueTap } from "./touchGesture.js";
import { clampToBounds } from "../data/regions.js";
import {
  DESERT_BOUNDS, DESERT_SPOTS, DESERT_LANDMARKS, DESERT_WELCOME_SIGN, DESERT_REGION_ID, PYRAMID,
} from "../data/desert/desertLayout.js";
import { terrainHeight, desertGroundHeight, SUNSTONE_TOP } from "../data/desert/desertTerrain.js";
import { useFarmChallengeActive } from "./farmChallengeActive.js";
import { JungleClock } from "./jungle/JungleAtmosphere.jsx";
import MapBoard3D from "./maps/MapBoard3D.jsx";
import { DesertGround, TrailRibbons, DesertHorizon } from "./desert/DesertTerrain.jsx";
import { QuicksandPits, SinkPuffs, OasisPool } from "./desert/DesertWater.jsx";
import DesertFlora from "./desert/DesertFlora.jsx";
import DesertLandmarks from "./desert/DesertLandmarks.jsx";
import DesertTown from "./desert/DesertTown.jsx";
import DesertWonders from "./desert/DesertWonders.jsx";
import {
  DesertLighting, SunDisc, BlowingSand, DustDevils, RollingTumbleweeds, Vultures, OasisButterflies,
} from "./desert/DesertAtmosphere.jsx";

/**
 * SUNSTONE DESERT — scenery root (the eighth region, built 2026-11-08). Land
 * only: the terrain (dunes, mesas, canyon cliffs), the quicksand + the oasis,
 * the cacti + palms, the landmarks (the Great Pyramid, the Sun Temple, the
 * Sky Pyramid, Sundial Rise, the Sun Arch, the mesas' stairs, ladders + rope
 * bridge), the bazaar town + the Caravan Gate, the wonders (the Dune Ship,
 * the Sand Sphinx, Crystal Hollow, the Fossil Dig, camels) and the
 * atmosphere. All positions come from data/desert/.
 */

/** A world label that only shows when the player is within `range` metres. */
function NearLabel({ position, text, range = 40, distanceFactor = 20, dy = 16 }) {
  const [show, setShow] = useState(false);
  const last = useRef(false);
  useFrame(() => {
    const d = Math.hypot(playerState.x - position[0], playerState.z - position[2]);
    const yy = Math.abs((playerState.y || 0) - position[1]);
    const on = d < range && yy < dy;
    if (on !== last.current) { last.current = on; setShow(on); }
  });
  if (!show) return null;
  return (
    <Html position={position} center distanceFactor={distanceFactor} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="unlock-sign open">{text}</div>
    </Html>
  );
}

export default function DesertScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  const challengeOn = useFarmChallengeActive();
  // Tap-to-move on the actual terrain (taps on dune slopes land on them).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, DESERT_BOUNDS);
    queueTap(() => requestMoveTo(x, z, null)); // only if it was a TAP (not a drag)
  }, []);
  const tap = touchMode ? onTap : undefined;
  const [wx, wz] = DESERT_WELCOME_SIGN.position;
  // DEV-only layer isolation for profiling: window.__DS_ONLY = ["DesertFlora", …].
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__DS_ONLY) || window.__DS_ONLY.includes(k);

  return (
    <group>
      <JungleClock />
      <DesertLighting highGfx={highGfx} />

      {/* Ground, trails, quicksand + the oasis. */}
      {ON("DesertGround") && <DesertGround onTap={tap} />}
      {ON("TrailRibbons") && <TrailRibbons />}
      {ON("Quicksand") && <QuicksandPits />}
      <SinkPuffs />
      {ON("OasisPool") && <OasisPool />}

      {/* Cacti, palms, scrub, rocks. */}
      {ON("DesertFlora") && <DesertFlora highGfx={highGfx} />}

      {/* The landmarks, the town, the wonders. */}
      {ON("DesertLandmarks") && <DesertLandmarks />}
      {ON("DesertTown") && <DesertTown />}
      {ON("DesertWonders") && <DesertWonders highGfx={highGfx} />}

      {/* The painted map board by the arrival (opens the full-screen map). */}
      <MapBoard3D regionId={DESERT_REGION_ID} roof="#c4553c" />

      {/* Sky theatre. */}
      {ON("DesertHorizon") && <DesertHorizon />}
      <SunDisc />
      {ON("BlowingSand") && <BlowingSand count={highGfx ? 380 : 160} />}
      {ON("DustDevils") && <DustDevils high={highGfx} />}
      {ON("Tumbleweeds") && <RollingTumbleweeds count={highGfx ? 6 : 3} />}
      {ON("Vultures") && <Vultures />}
      <OasisButterflies count={highGfx ? 14 : 8} />

      {/* Labels: the welcome sign, each spot, the landmarks — all down while
          a challenge has the screen. */}
      {!challengeOn && (
        <>
          <NearLabel position={[wx, terrainHeight(wx, wz) + 3.2, wz]} text={DESERT_WELCOME_SIGN.text} range={24} distanceFactor={10} />
          {DESERT_SPOTS.map((s) => (
            <NearLabel key={s.id} position={[s.center[0], desertGroundHeight(s.center[0], s.center[1]) + 3.6, s.center[1]]} text={`${s.icon} ${s.label}`} range={30} />
          ))}
          {Object.entries(DESERT_LANDMARKS).map(([k, l]) => (
            <NearLabel
              key={k}
              position={[l.center[0], k === "sunstone" ? SUNSTONE_TOP + 6.5 : k === "pyramid" ? PYRAMID.top + 10 : terrainHeight(l.center[0], l.center[1]) + 5, l.center[1]]}
              text={`${l.icon} ${l.label}`}
              range={k === "sunstone" ? 18 : k === "pyramid" ? 46 : 36}
              dy={k === "pyramid" ? 40 : 16}
            />
          ))}
        </>
      )}
    </group>
  );
}
