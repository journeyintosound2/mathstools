import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import {
  SNOW_BOUNDS, SNOW_WELCOME_SIGN, SNOW_RECORDS_STAND, SNOW_CHALLENGE_SPOTS, GIANT_SNOWMAN, SNOW_LAKE, SNOW_LODGE,
  FROZEN_FALLS,
} from "../data/snow/snowLayout.js";
import { terrainHeight, LIFT, SNOW_CHUTE_PATHS } from "../data/snow/snowTerrain.js";
import { useFarmChallengeActive, useActiveSnowChallenge } from "./farmChallengeActive.js";
import { snowShelfEntries } from "../data/snow/snowRecords.js";
import TrophyStandAssembly from "./TrophyStand.jsx";
import { SnowGround, TrailRibbons } from "./snow/SnowTerrain.jsx";
import { SnowIce, SnowLake, FrozenFalls, ColdSplash } from "./snow/SnowWater.jsx";
import { SnowTrees, SnowRocks, SnowUndergrowth } from "./snow/SnowFlora.jsx";
import {
  Lodge, Cabins, Igloos, FortFrost, Chairlift, ChuteDressing, SnowBridges, SnowStreetFurniture,
} from "./snow/SnowBuildings.jsx";
import SnowLandmarks from "./snow/SnowLandmarks.jsx";
import SnowAnimals from "./snow/SnowAnimals.jsx";
import { SnowLighting, Snowfall, Aurora, DistantPeaks, ChimneySmoke } from "./snow/SnowAtmosphere.jsx";
import { JungleClock, Birds } from "./jungle/JungleAtmosphere.jsx";

/**
 * SNOWBALL SUMS — scenery root (rebuilt 2026-10-08 as a big alpine valley the
 * size of Fraction Farm / the Emerald Jungle). Rising snowfields and pine
 * forests, big hills to SLIDE down (two toboggan chutes + a chairlift back
 * up), a frozen river + pond to SKATE on, a glacier lake of icy water with
 * snowy islands, floes and plank bridges, the lodge village with glowing
 * windows and smoking chimneys, a giant snowman, an ice cave under the
 * escarpment and the aurora over jagged peaks. All positions come from
 * data/snow/ (layout, terrain, props); the renderer lives in game/snow/.
 */

/** A world label that only shows when the player is within `range` metres. */
function NearLabel({ position, text, range = 40, distanceFactor = 20, dy = 18 }) {
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

const LANDMARK_LABELS = [
  { id: "lodge", p: [SNOW_LODGE.x, SNOW_LODGE.z], h: 13.5, text: "🏔️ Alpine Lodge", range: 34 },
  { id: "giant", p: GIANT_SNOWMAN.position, h: 20, text: "⛄ Snowman Hill", range: 40 },
  { id: "lift", p: LIFT.from, h: 7.5, text: "🚡 Chairlift — ride up Big Sled Hill", range: 22 },
  { id: "lake", p: [SNOW_LAKE.center[0] - 27, SNOW_LAKE.center[1] + 24], h: 2.6, text: "🧊 Glacier Lake — too cold to swim!", range: 16 },
  { id: "falls", p: [FROZEN_FALLS.position[0], FROZEN_FALLS.position[1] + 8], h: 6, text: "❄️ The Frozen Falls", range: 30 },
  ...SNOW_CHUTE_PATHS.map((c) => ({ id: c.id, p: c.pts[0], h: 5.5, text: c.id === "big-run" ? "🛷 Big Sled Run — step in and slide!" : "🛷 Tumble Run — step in and slide!", range: 18 })),
];

export default function SnowScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  // While an in-world challenge runs the world goes quiet: labels come down,
  // and that challenge's idle dressing makes way for its own scene.
  const challengeOn = useFarmChallengeActive();
  const snowKey = useActiveSnowChallenge();
  // Tap-to-move on the actual terrain (taps on hill slopes land on them).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, SNOW_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode ? onTap : undefined;
  const [wx, wz] = SNOW_WELCOME_SIGN.position;
  const [sx, sz] = SNOW_RECORDS_STAND.position;
  // DEV-only layer isolation for profiling: window.__SNOW_ONLY = ["SnowTrees", …].
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__SNOW_ONLY) || window.__SNOW_ONLY.includes(k);

  return (
    <group>
      <JungleClock />
      <SnowLighting highGfx={highGfx} />

      {/* The ground, the trails, the ice and the glacier lake. */}
      {ON("SnowGround") && <SnowGround onTap={tap} />}
      {ON("TrailRibbons") && <TrailRibbons />}
      {ON("SnowIce") && <SnowIce />}
      {ON("SnowLake") && <SnowLake />}
      {ON("FrozenFalls") && <FrozenFalls />}
      <ColdSplash />

      {/* Forests, rocks + undergrowth. */}
      {ON("SnowTrees") && <SnowTrees highGfx={highGfx} />}
      {ON("SnowRocks") && <SnowRocks highGfx={highGfx} />}
      {ON("SnowUndergrowth") && <SnowUndergrowth highGfx={highGfx} />}

      {/* The village, the fort, the lift, the chutes, bridges + furniture. */}
      {ON("Lodge") && <Lodge />}
      {ON("Cabins") && <Cabins />}
      {ON("Igloos") && <Igloos />}
      {ON("FortFrost") && <FortFrost />}
      {ON("Chairlift") && <Chairlift />}
      {ON("Chutes") && <ChuteDressing />}
      {ON("Bridges") && <SnowBridges />}
      {ON("Furniture") && <SnowStreetFurniture />}
      {ON("Landmarks") && <SnowLandmarks activeKey={snowKey} />}
      {ON("Animals") && <SnowAnimals />}
      {ON("Trophy") && (
        <TrophyStandAssembly position={SNOW_RECORDS_STAND.position} y={terrainHeight(sx, sz)} rotationY={SNOW_RECORDS_STAND.rotationY} entries={snowShelfEntries()} />
      )}

      {/* Sky theatre: the horizon peaks, the aurora, falling snow, smoke. */}
      {ON("DistantPeaks") && <DistantPeaks />}
      {ON("Aurora") && <Aurora />}
      {ON("Snowfall") && <Snowfall count={highGfx ? 2200 : 900} />}
      {ON("Smoke") && <ChimneySmoke />}
      {ON("Birds") && highGfx && <Birds />}

      {/* Labels — all down while a challenge has the screen. */}
      {!challengeOn && (
        <>
          <NearLabel position={[wx, terrainHeight(wx, wz) + 2.7, wz]} text={SNOW_WELCOME_SIGN.text} range={22} distanceFactor={10} />
          {SNOW_CHALLENGE_SPOTS.map((s) => (
            <NearLabel key={s.id} position={[s.center[0], terrainHeight(s.center[0], s.center[1]) + 4.2, s.center[1]]} text={`❄️ ${s.label}`} range={30} />
          ))}
          {LANDMARK_LABELS.map((l) => (
            <NearLabel key={l.id} position={[l.p[0], terrainHeight(l.p[0], l.p[1]) + l.h, l.p[1]]} text={l.text} range={l.range} />
          ))}
        </>
      )}
    </group>
  );
}
