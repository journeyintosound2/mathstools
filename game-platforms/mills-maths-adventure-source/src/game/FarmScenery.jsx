import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import {
  FARM_BOUNDS, FARM_AREAS, FARM_WELCOME_SIGN, FARM_RECORDS_STAND, FARM_MUD, FARM_BIG_WINDMILL,
} from "../data/farm/farmLayout.js";
import { terrainHeight, farmWaterAt } from "../data/farm/farmTerrain.js";
import { farmBestPercent } from "../data/farm/farmRecords.js";
import { useFarmChallengeActive } from "./farmChallengeActive.js";
import { useFarmChallenge } from "./farmChallengeStore.js";
import { useRoundUp } from "./roundUpStore.js";
import { useOrderParts } from "./orderPartsStore.js";
import { useCratePacking } from "./cratePackingStore.js";
import { useMilkSplitter } from "./milkSplitterStore.js";
import { useWeighStation } from "./weighStationStore.js";
import { useTradingPost } from "./tradingPostStore.js";
import { useVeggiePlot } from "./veggiePlotStore.js";
import { usePlankGap } from "./plankGapStore.js";
import { useFarmShop } from "./farmShopStore.js";
import Footprints from "./Footprints.jsx";
import TrophyStandAssembly from "./TrophyStand.jsx";
import { FarmGround, TrackRibbons } from "./farm/FarmTerrain.jsx";
import { FarmWaterSurfaces, PondFish } from "./farm/FarmWater.jsx";
import { FarmTrees, FarmCrops, FarmUndergrowth, FarmGrassField } from "./farm/FarmFlora.jsx";
import FarmFences from "./farm/FarmFences.jsx";
import FarmBuildings from "./farm/FarmBuildings.jsx";
import FarmLandmarks from "./farm/FarmLandmarks.jsx";
import FarmAnimals from "./farm/FarmAnimals.jsx";
import { FarmLighting, FarmButterflies, Dragonflies, Thistledown } from "./farm/FarmAtmosphere.jsx";
import { WadeRipples } from "./jungle/JungleWater.jsx";
import { DistantRanges } from "./jungle/JungleTerrain.jsx";
import { JungleClock, Birds, Pollen } from "./jungle/JungleAtmosphere.jsx";

/**
 * FRACTION FARM — scenery root (rebuilt 2026-10-07 as a big, rolling,
 * explorable farm the size of the Emerald Jungle). Big rolling hills separate
 * themed areas, each home to one of the ten fraction challenges: the
 * homestead + the Farm Gate Shop, the orchard's packing shed, the carrot
 * patch, the old sawmill on the creek, the dairy, the cattle run, the long
 * paddock, the grain silos, the glasshouse gardens and the market green.
 * All positions come from data/farm/ (layout, terrain, props); the renderer
 * lives in game/farm/.
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

/** The trophy stand, wired live to the ten farm challenges' best scores. */
function FarmTrophyStand() {
  const best = {
    fence: useFarmChallenge((s) => s.bestScore), roundup: useRoundUp((s) => s.bestScore), order: useOrderParts((s) => s.bestScore),
    crate: useCratePacking((s) => s.bestScore), milk: useMilkSplitter((s) => s.bestScore), weigh: useWeighStation((s) => s.bestScore),
    trade: useTradingPost((s) => s.bestScore), veggie: useVeggiePlot((s) => s.bestScore), plank: usePlankGap((s) => s.bestScore),
    shop: useFarmShop((s) => s.bestScore),
  };
  const entries = ["fence", "roundup", "order", "crate", "milk", "weigh", "trade", "veggie", "plank", "shop"]
    .map((key) => ({ key, percent: farmBestPercent(key, best[key]) }));
  const [x, z] = FARM_RECORDS_STAND.position;
  return <TrophyStandAssembly position={FARM_RECORDS_STAND.position} y={terrainHeight(x, z)} rotationY={FARM_RECORDS_STAND.rotationY} entries={entries} />;
}

const inMud = (x, z) => Math.hypot(x - FARM_MUD.center[0], z - FARM_MUD.center[1]) < FARM_MUD.radius;

export default function FarmScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);
  const challengeOn = useFarmChallengeActive();
  // Tap-to-move on the actual terrain (a flat catcher plane would put the
  // target under the hills when you tap their slopes).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, FARM_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode ? onTap : undefined;
  const [wx, wz] = FARM_WELCOME_SIGN.position;
  // DEV-only layer isolation for profiling: window.__FARM_ONLY = ["FarmTrees", …].
  const ON = (k) => !(import.meta.env.DEV && typeof window !== "undefined" && window.__FARM_ONLY) || window.__FARM_ONLY.includes(k);

  return (
    <group>
      <JungleClock />
      <FarmLighting highGfx={highGfx} />

      {/* Ground, farm tracks, the creek + duck pond. */}
      {ON("FarmGround") && <FarmGround onTap={tap} />}
      {ON("TrackRibbons") && <TrackRibbons />}
      {ON("FarmWater") && <FarmWaterSurfaces />}
      {ON("FarmWater") && <PondFish />}
      <WadeRipples waterAt={farmWaterAt} />

      {/* Trees, crops, hay + undergrowth, the grass. */}
      {ON("FarmTrees") && <FarmTrees highGfx={highGfx} />}
      {ON("FarmCrops") && <FarmCrops highGfx={highGfx} />}
      {ON("FarmUndergrowth") && <FarmUndergrowth highGfx={highGfx} />}
      {ON("FarmGrassField") && <FarmGrassField key={highGfx ? "hi" : "lo"} high={highGfx} />}

      {/* Fences, buildings, landmarks, animals. */}
      {ON("FarmFences") && <FarmFences highGfx={highGfx} />}
      {ON("FarmBuildings") && <FarmBuildings />}
      {ON("FarmLandmarks") && <FarmLandmarks />}
      {ON("FarmAnimals") && <FarmAnimals />}
      {ON("Trophy") && <FarmTrophyStand />}
      <Footprints test={inMud} heightAt={terrainHeight} color="#4a3220" size={0.2} life={2.5} stride={0.5} />

      {/* Sky theatre. */}
      {ON("DistantRanges") && <DistantRanges horizon="#f2dcb2" />}
      {ON("Birds") && <Birds />}
      {ON("Butterflies") && <FarmButterflies count={highGfx ? 30 : 16} />}
      {ON("Dragonflies") && <Dragonflies />}
      {highGfx && <Thistledown />}
      {highGfx && <Pollen count={140} radius={24} />}

      {/* Labels: the welcome, each themed area — all down while a challenge has the screen. */}
      {!challengeOn && (
        <>
          <NearLabel position={[wx, terrainHeight(wx, wz) + 2.7, wz]} text={FARM_WELCOME_SIGN.text} range={24} distanceFactor={10} />
          {FARM_AREAS.map((a) => {
            const [x, z] = a.id === "windmill" ? FARM_BIG_WINDMILL.position : a.c;
            const h = a.id === "windmill" ? 18 : a.challenge ? 4.4 : 3.6;
            return <NearLabel key={a.id} position={[x, terrainHeight(x, z) + h, z]} text={`${a.icon} ${a.name}`} range={a.challenge ? 30 : 38} />;
          })}
        </>
      )}
    </group>
  );
}
