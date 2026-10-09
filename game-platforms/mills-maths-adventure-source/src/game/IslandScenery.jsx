import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import { ISLAND_BOUNDS, ISLAND_AREAS, ISLAND_WELCOME, PLAZA, LIGHTHOUSE, GATES } from "../data/island/islandLayout.js";
import {
  terrainHeight, islandWaterAt, isOnIslandPath, isOnSand, isOnSnowIsland, PLAZA_DECK_Y, islandGroundHeight,
} from "../data/island/islandTerrain.js";
import { IslandGround, PathRibbons } from "./island/IslandTerrain.jsx";
import { Ocean, EmeraldFalls, IslandLava, HazardEffects } from "./island/IslandWater.jsx";
import { IslandTrees, IslandUndergrowth, IslandCrops, IslandGrassField } from "./island/IslandFlora.jsx";
import IslandBuildings from "./island/IslandBuildings.jsx";
import IslandLandmarks from "./island/IslandLandmarks.jsx";
import AchievementsWall from "./island/AchievementsWall.jsx";
import {
  IslandClock, IslandLighting, Clouds, Seagulls, IslandButterflies, Crabs, Dolphins, IslandSmoke, FarIslands,
} from "./island/IslandAtmosphere.jsx";
import { JungleClock } from "./jungle/JungleAtmosphere.jsx";
import { WadeRipples } from "./jungle/JungleWater.jsx";
import Footprints from "./Footprints.jsx";
import { GuidanceMarker } from "./WorldScenery.jsx";

/**
 * NUMBER ISLAND — scenery root (rebuilt 2026-10-09: ~2.5× across the old
 * island, to the standard of the rebuilt Snowball Sums / Emerald Jungle).
 * A sunny tropical island in a turquoise sea: Harbour Green + the jetty where
 * you arrive, the welcome arch and the Achievements Wall, Main Street's
 * cottages up to the raised Mission Plaza (fountain, Mission Board, trophy),
 * Schoolhouse Hill (the Playground's school gate), Frosty Peak + Igloo Hollow
 * (the Snowball Sums igloo), Pip's thermometer number line, Ember Peak + the
 * Ember Terrace (the Magma Multiples arch), Fern's ash fields, Haybale
 * Meadows (the Fraction Farm gate), the Emerald Lagoon + falls (the Emerald
 * Jungle arch), Sunny Cove, and Alby's lighthouse out on its islet over a
 * rope bridge. All positions come from data/island/; the renderer lives in
 * game/island/.
 *
 * `title` = the title-screen flyover: the same island, minus labels, the
 * guidance marker and the per-player effects.
 */

/** Within this many metres of a world gate, the gate's own sign does the
 *  talking — the area name above it would only stack on top of it. */
const GATE_QUIET = 11;
function nearAGate(x, z) {
  for (const g of Object.values(GATES)) if (Math.hypot(x - g.position[0], z - g.position[1]) < GATE_QUIET) return true;
  return false;
}

/**
 * A world label that shows while the player is between `inner` and `range`
 * metres away — an area name announces itself as you APPROACH, then steps
 * aside once you're standing in the place (and near a gate, see GATE_QUIET).
 */
function NearLabel({ position, text, range = 40, inner = 0, quietAtGates = false, distanceFactor = 20, dy = 16 }) {
  const [show, setShow] = useState(false);
  const last = useRef(false);
  useFrame(() => {
    const d = Math.hypot(playerState.x - position[0], playerState.z - position[2]);
    const yy = Math.abs((playerState.y || 0) - position[1]);
    const on = d < range && d >= inner && yy < dy && !(quietAtGates && nearAGate(playerState.x, playerState.z));
    if (on !== last.current) { last.current = on; setShow(on); }
  });
  if (!show) return null;
  return (
    <Html position={position} center distanceFactor={distanceFactor} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="unlock-sign open">{text}</div>
    </Html>
  );
}

// Area labels sit a little above the ground at each area's heart (the plaza's
// on its deck; the lighthouse's above the islet path).
const AREA_LABEL_SKIP = new Set(["green"]); // the arrival green has its own welcome sign
function areaLabelPos(a) {
  if (a.id === "plaza") return [PLAZA.center[0], PLAZA_DECK_Y + 6.2, PLAZA.center[1] - 2];
  if (a.id === "lighthouse") return [LIGHTHOUSE.position[0] - 5, terrainHeight(LIGHTHOUSE.position[0] - 5, LIGHTHOUSE.position[1] + 4) + 4, LIGHTHOUSE.position[1] + 4];
  const [x, z] = a.c;
  return [x, terrainHeight(x, z) + (a.id === "frosty" || a.id === "ember" ? 6 : 4.2), z];
}

// Footprints: paths, the sand and the snow (each its own colour).
const onPathOrSand = (x, z) => isOnIslandPath(x, z) || isOnSand(x, z);

export default function IslandScenery({ title = false }) {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  // Tap-to-move on the actual terrain (taps on hillsides land on them).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, ISLAND_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode && !title ? onTap : undefined;
  // DEV-only layer isolation for profiling: window.__ISL_ONLY = ["IslandTrees", …].
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__ISL_ONLY) || window.__ISL_ONLY.includes(k);
  const [wx, wz] = ISLAND_WELCOME.position;

  return (
    <group>
      <JungleClock />
      <IslandClock />
      <IslandLighting highGfx={highGfx} />

      {/* The ground, the paths, the sea, the falls and Ember Peak's lava. */}
      {ON("IslandGround") && <IslandGround onTap={tap} />}
      {ON("PathRibbons") && <PathRibbons />}
      {ON("Ocean") && <Ocean />}
      {ON("EmeraldFalls") && <EmeraldFalls highGfx={highGfx} />}
      {ON("IslandLava") && <IslandLava highGfx={highGfx} />}

      {/* Trees, undergrowth, crops + the grass field. */}
      {ON("IslandTrees") && <IslandTrees highGfx={highGfx} title={title} />}
      {ON("IslandUndergrowth") && <IslandUndergrowth highGfx={highGfx} />}
      {ON("IslandCrops") && <IslandCrops highGfx={highGfx} />}
      {ON("IslandGrass") && <IslandGrassField high={highGfx} />}

      {/* The village, the plaza, the school, the lighthouse, the harbour. */}
      {ON("IslandBuildings") && <IslandBuildings highGfx={highGfx} />}
      {ON("IslandLandmarks") && <IslandLandmarks />}
      {ON("AchievementsWall") && <AchievementsWall />}

      {/* Sky theatre + island life. */}
      {ON("FarIslands") && <FarIslands />}
      {ON("Clouds") && <Clouds />}
      {ON("Seagulls") && <Seagulls />}
      {ON("Butterflies") && <IslandButterflies count={highGfx ? 24 : 12} />}
      {ON("Crabs") && <Crabs />}
      {ON("Dolphins") && <Dolphins />}
      {ON("Smoke") && <IslandSmoke />}

      {!title && (
        <>
          <WadeRipples waterAt={islandWaterAt} />
          <HazardEffects />
          <Footprints test={onPathOrSand} heightAt={islandGroundHeight} color="#8c6a45" life={2.4} stride={0.5} size={0.15} />
          <Footprints test={isOnSnowIsland} heightAt={terrainHeight} color="#a9bcd6" life={2.4} stride={0.5} size={0.16} />
          <GuidanceMarker />
          <NearLabel position={[wx, terrainHeight(wx, wz) + 2.9, wz]} text={`🌴 ${ISLAND_WELCOME.text}`} range={22} distanceFactor={10} />
          {ISLAND_AREAS.filter((a) => !AREA_LABEL_SKIP.has(a.id)).map((a) => (
            <NearLabel key={a.id} position={areaLabelPos(a)} text={`${a.icon} ${a.name}`} range={a.id === "frosty" || a.id === "ember" ? 30 : 34}
              inner={a.id === "plaza" ? 0 : 8} quietAtGates />
          ))}
        </>
      )}
    </group>
  );
}
