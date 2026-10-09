import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import { SCHOOLYARD_BOUNDS, SCHOOL_AREAS, SCHOOLYARD_WELCOME } from "../data/schoolyard/schoolyardLayout.js";
import { isOnSchoolTrack, terrainHeight } from "../data/schoolyard/schoolyardTerrain.js";
import Footprints from "./Footprints.jsx";
import { JungleClock } from "./jungle/JungleAtmosphere.jsx";
import { Clouds } from "./island/IslandAtmosphere.jsx";
import { SchoolTerrain, FarLand, SchoolSea, SchoolTerraces, SchoolTracks, PlaygroundMarkings } from "./schoolyard/SchoolGround.jsx";
import { SchoolStructures } from "./schoolyard/SchoolStructures.jsx";
import { SchoolBuildings } from "./schoolyard/SchoolBuildings.jsx";
import { SchoolLighting, SchoolGulls, Lorikeets } from "./schoolyard/SchoolAtmosphere.jsx";
import { SchoolTrees, SchoolShrubs } from "./schoolyard/SchoolFlora.jsx";
import { SchoolFurniture } from "./schoolyard/SchoolFurniture.jsx";
import SchoolLandmarks from "./schoolyard/SchoolLandmarks.jsx";
import { TownStreets, Town, TownTrees, Harbour, SchoolFence, Traffic } from "./schoolyard/SchoolBackdrop.jsx";

/**
 * RETRIEVAL PRACTICE PLAYGROUND — scenery root (rebuilt 2026-10-09). A big
 * hillside high school on the Coffs Coast, after Coffs Harbour High: red-
 * brick blocks under terracotta roofs stepping up the hill on three levels,
 * open concrete corridors + stair towers, the fig quad, the garden
 * courtyard, the big red-roofed school hall (the Head Teacher's padlocked
 * doors), the canteen, the oval, the courts under the COLA, the ag plot,
 * the bush track up to the Sky Pier — and the town falling away to Jetty
 * Beach, the jetty, the harbour and Muttonbird Island below. Positions come
 * from data/schoolyard/ (layout, terrain, props); the renderer lives in
 * game/schoolyard/.
 */

/** A world label that only shows when the player is within `range` (and near its level). */
function NearLabel({ position, text, range = 34, distanceFactor = 20, dy = 7 }) {
  const [show, setShow] = useState(false);
  const last = useRef(false);
  useFrame(() => {
    const d = Math.hypot(playerState.x - position[0], playerState.z - position[2]);
    const yy = Math.abs((playerState.y || 0) + 3 - position[1]);
    const on = d < range && d > 5 && yy < dy;
    if (on !== last.current) { last.current = on; setShow(on); }
  });
  if (!show) return null;
  return (
    <Html position={position} center distanceFactor={distanceFactor} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className="unlock-sign open">{text}</div>
    </Html>
  );
}

export default function SchoolyardScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  // Tap-to-move on the real ground (taps on the terraces + decks land on them).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, SCHOOLYARD_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode ? onTap : undefined;
  // DEV-only layer isolation for profiling: window.__SY_ONLY = ["SchoolBuildings", …].
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__SY_ONLY) || window.__SY_ONLY.includes(k);
  const [wx, wz] = SCHOOLYARD_WELCOME.position;

  return (
    <group>
      <JungleClock />
      <SchoolLighting highGfx={highGfx} />

      {/* The ground, the land down to the sea, the sea. */}
      {ON("SchoolTerrain") && <SchoolTerrain onTap={tap} />}
      {ON("FarLand") && <FarLand />}
      {ON("SchoolSea") && <SchoolSea />}
      {ON("SchoolTerraces") && <SchoolTerraces />}
      {ON("SchoolTracks") && <SchoolTracks />}
      {ON("Markings") && <PlaygroundMarkings />}

      {/* The built school. */}
      {ON("SchoolStructures") && <SchoolStructures />}
      {ON("SchoolBuildings") && <SchoolBuildings />}

      {/* Trees, gardens + school furniture. */}
      {ON("SchoolTrees") && <SchoolTrees highGfx={highGfx} />}
      {ON("SchoolShrubs") && <SchoolShrubs highGfx={highGfx} />}
      {ON("SchoolFurniture") && <SchoolFurniture />}
      {ON("Landmarks") && <SchoolLandmarks />}

      {/* Beyond the fence: the streets, the town, the harbour. */}
      {ON("SchoolFence") && <SchoolFence />}
      {ON("TownStreets") && <TownStreets />}
      {ON("Town") && <Town highGfx={highGfx} />}
      {ON("TownTrees") && <TownTrees highGfx={highGfx} />}
      {ON("Harbour") && <Harbour />}
      {ON("Traffic") && <Traffic />}

      {/* Sky life. */}
      {ON("Clouds") && <Clouds />}
      {ON("Gulls") && <SchoolGulls />}
      {ON("Lorikeets") && highGfx && <Lorikeets />}

      {/* Footprints along the bush track + the gravel paths. */}
      <Footprints test={isOnSchoolTrack} heightAt={terrainHeight} color="#5a4630" life={2.4} stride={0.55} size={0.15} />

      {/* Area labels as you approach. */}
      <NearLabel position={[wx, 2.8, wz]} text={SCHOOLYARD_WELCOME.text} range={20} distanceFactor={10} />
      {SCHOOL_AREAS.map((a) => (
        <NearLabel key={a.id} position={[a.c[0], a.y, a.c[1]]} text={`${a.icon} ${a.name}`} range={30} />
      ))}
    </group>
  );
}
