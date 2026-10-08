import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import {
  JUNGLE_BOUNDS, JUNGLE_SPOTS, JUNGLE_LANDMARKS, JUNGLE_WELCOME_SIGN, terrainHeight, GREAT_TREE,
} from "../data/jungle/jungleLayout.js";
import { JungleGround, TrailRibbons, DistantRanges } from "./jungle/JungleTerrain.jsx";
import { JungleWaterSurfaces, Waterfall, WadeRipples } from "./jungle/JungleWater.jsx";
import JungleTrees from "./jungle/JungleTrees.jsx";
import JungleFlora from "./jungle/JungleFlora.jsx";
import JungleSetPieces from "./jungle/JungleSetPieces.jsx";
import {
  JungleClock, JungleLighting, Sunbeams, Pollen, Fireflies, Butterflies, Birds, FallingLeaves,
} from "./jungle/JungleAtmosphere.jsx";
import { useFarmChallengeActive } from "./farmChallengeActive.js";

/**
 * EMERALD JUNGLE — scenery root (the seventh region). Land only: the
 * terrain, river + waterfall + lagoon, the forests and undergrowth, the
 * set-pieces (temple, Great Tree, vine cliffs, mushroom glade, bridges…) and
 * the atmosphere. All positions come from data/jungle/jungleLayout.js +
 * jungleProps.js.
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

export default function JungleScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  const challengeOn = useFarmChallengeActive();

  // Tap-to-move on the actual terrain (the flat catcher plane would put the
  // target under the hills when you tap their slopes).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, JUNGLE_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode ? onTap : undefined;
  const [wx, wz] = JUNGLE_WELCOME_SIGN.position;
  // DEV-only layer isolation for profiling: set window.__JG_ONLY = ["JungleTrees", …]
  // before entering the jungle to draw just those layers (stripped from builds).
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__JG_ONLY) || window.__JG_ONLY.includes(k);

  return (
    <group>
      <JungleClock />
      <JungleLighting highGfx={highGfx} />

      {/* Ground, trails, water. */}
      {ON("JungleGround") && <JungleGround onTap={tap} />}
      {ON("TrailRibbons") && <TrailRibbons />}
      {ON("JungleWaterSurfaces") && <JungleWaterSurfaces />}
      {ON("Waterfall") && <Waterfall highGfx={highGfx} />}
      {ON("WadeRipples") && <WadeRipples />}

      {/* The forest + the undergrowth. */}
      {ON("JungleTrees") && <JungleTrees highGfx={highGfx} />}
      {ON("JungleFlora") && <JungleFlora highGfx={highGfx} />}

      {/* Landmarks, bridges, climbable things. */}
      {ON("JungleSetPieces") && <JungleSetPieces highGfx={highGfx} onTap={tap} />}

      {/* Sky theatre. */}
      {ON("DistantRanges") && <DistantRanges horizon="#bcdcd3" />}
      {ON("Sunbeams") && <Sunbeams />}
      {highGfx && <Pollen />}
      {ON("Fireflies") && <Fireflies />}
      {ON("Butterflies") && <Butterflies count={highGfx ? 24 : 12} />}
      {ON("Birds") && <Birds />}
      {highGfx && <FallingLeaves />}

      {/* Labels: the welcome sign, each clearing and the big landmarks — all
          down while a challenge has the screen. */}
      {!challengeOn && (
        <>
          <NearLabel position={[wx, terrainHeight(wx, wz) + 2.6, wz]} text={JUNGLE_WELCOME_SIGN.text} range={26} distanceFactor={10} />
          {JUNGLE_SPOTS.map((s) => (
            <NearLabel key={s.id} position={[s.center[0], terrainHeight(s.center[0], s.center[1]) + 3.4, s.center[1]]} text={s.label} />
          ))}
          {Object.entries(JUNGLE_LANDMARKS).map(([k, l]) => (
            <NearLabel
              key={k}
              position={[l.center[0], (k === "treehouse" ? GREAT_TREE.deckY + 3.6 : terrainHeight(l.center[0], l.center[1]) + 4), l.center[1]]}
              text={`🌿 ${l.label}`}
              range={k === "treehouse" ? 26 : 34}
            />
          ))}
        </>
      )}
    </group>
  );
}
