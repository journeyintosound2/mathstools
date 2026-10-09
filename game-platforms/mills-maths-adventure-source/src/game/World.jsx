import React from "react";
import { Environment, Lightformer } from "@react-three/drei";

import Player from "./Player.jsx";
import Interactable from "./Interactable.jsx";
import Effects from "./Effects.jsx";
import IslandScenery from "./IslandScenery.jsx";
import { getInteractablesForRegion } from "../data/interactables.js";
import { getRegion } from "../data/regions.js";
import { useSession } from "./sessionStore.js";
import { useUI } from "../ui/effects/uiStore.js";
import SchoolyardScenery from "./SchoolyardScenery.jsx";
import FarmScenery from "./FarmScenery.jsx";
import FenceChallenge from "./FenceChallenge.jsx";
import RoundUpChallenge from "./RoundUpChallenge.jsx";
import OrderPartsChallenge from "./OrderPartsChallenge.jsx";
import CratePackingChallenge from "./CratePackingChallenge.jsx";
import MilkSplitterChallenge from "./MilkSplitterChallenge.jsx";
import WeighStationChallenge from "./WeighStationChallenge.jsx";
import TradingPostChallenge from "./TradingPostChallenge.jsx";
import VeggiePlotChallenge from "./VeggiePlotChallenge.jsx";
import PlankGapChallenge from "./PlankGapChallenge.jsx";
import FarmShopChallenge from "./FarmShopChallenge.jsx";
import { isOnFarmPath, terrainHeight as farmTerrainHeight } from "../data/farm/farmTerrain.js";
import FarmStage from "./farm/FarmStage.jsx";
import SnowScenery from "./SnowScenery.jsx";
import SnowballRangeChallenge from "./SnowballRangeChallenge.jsx";
import RinkGlideChallenge from "./RinkGlideChallenge.jsx";
import GroveLightsChallenge from "./GroveLightsChallenge.jsx";
import MeadowLevelChallenge from "./MeadowLevelChallenge.jsx";
import SledSlopeChallenge from "./SledSlopeChallenge.jsx";
import VillageSplitChallenge from "./VillageSplitChallenge.jsx";
import ColonyPairsChallenge from "./ColonyPairsChallenge.jsx";
import CaveCrystalsChallenge from "./CaveCrystalsChallenge.jsx";
import LodgeYardChallenge from "./LodgeYardChallenge.jsx";
import AuroraLookoutChallenge from "./AuroraLookoutChallenge.jsx";
import CabinScenery from "./CabinScenery.jsx";
import { isOnSnow, terrainHeight as snowTerrainHeight } from "../data/snow/snowTerrain.js";
import SnowStage from "./snow/SnowStage.jsx";
import Portal, { HaybalePortal, IglooPortal, VolcanoPortal, JunglePortal } from "./Portal.jsx";
import JungleScenery from "./JungleScenery.jsx";
import { JUNGLE_REGION_ID, isOnJunglePath, terrainHeight as jungleTerrainHeight } from "../data/jungle/jungleLayout.js";
import MagmaScenery from "./MagmaScenery.jsx";
import { MAGMA_REGION_ID, isOnAsh, magmaGroundHeight } from "../data/magma/magmaLayout.js";
import { GroundTapCatcher, DestinationMarker } from "./TapToMove.jsx";
import { SkyDome } from "./SkyBackdrop.jsx";
import Footprints from "./Footprints.jsx";
import TitleCamera from "./TitleCamera.jsx";

/**
 * The whole 3D scene: lighting, the island, scenery, the player and the NPCs.
 * Lives inside the <Canvas> in App.jsx.
 *
 * `title` = the title screen is up: the same world renders behind the menu,
 * the player stands still (hidden) and TitleCamera flies the camera — a
 * cinematic loop round Number Island (or a slow orbit in the other worlds,
 * when "Edit character" is opened mid-adventure).
 */
export default function World({ title = false }) {
  // Geometry/colours + which scenery to render come from the ACTIVE region.
  const regionId = useSession((s) => s.currentRegionId);
  const geo = getRegion(regionId).geometry;
  const isIsland = regionId === "island-1";
  // Fraction Farm runs on LATE-AFTERNOON light: a lower, more golden sun.
  const isFarm = regionId === "farm-parts-whole";
  // Snowball Sums runs on TWILIGHT light: a cool moonlit key, indigo fill and
  // the aurora/stars/moon drawn by SnowScenery.
  const isSnow = regionId === "snow-sums";
  // The Lodge Interior (CB) runs on FIRELIGHT: a warm dim key + a deep warm
  // hemisphere, with the fire + candles carrying the local glow.
  const isCabin = regionId === "cabin";
  // Magma Multiples runs on a hazy LAVA SUNSET: a low warm-red key light that
  // follows the player (the world is far bigger than one shadow frustum), a
  // warm sky / dark-red bounce hemisphere, and lots of emissive lava.
  const isMagma = regionId === MAGMA_REGION_ID;
  // Emerald Jungle runs on bright LATE-MORNING light: a warm sun that
  // follows the player (shadows across the big valley), a pale sky / deep
  // green bounce hemisphere, misty blue-green haze in the distance.
  const isJungle = regionId === JUNGLE_REGION_ID;
  // The Retrieval Practice Playground runs on a bright COFFS COAST MORNING: a
  // sun that follows the player (shadows across the big school), a pale sea
  // horizon (the SkyDome's true horizon, like the island) and a soft
  // sky / lawn-green bounce.
  const isSchool = regionId === "schoolyard";
  const region = getRegion(regionId);
  const touchMode = useUI((s) => s.touchMode);
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  return (
    <>
      {/* Soft sky background (per region). Fog warmed slightly toward the sky so
          the horizon reads as atmospheric depth (soft-cartoon look, W5-A). */}
      <color attach="background" args={[geo.skyColor]} />
      <fog attach="fog" args={[geo.skyColor, geo.fogNear || 55, geo.fogFar || 98]} />

      {/* Gradient sky dome + hazy distant islands (W5-E). Sky is cheap → always
          on; islands (island region only) add a little geometry → High only.
          Horizon colour = fog colour so the fogged distance blends in. */}
      <SkyDome horizon={geo.skyColor} top={isCabin ? "#120c07" : geo.skyTop || undefined} radius={isMagma ? 470 : isJungle || isFarm || isSnow || isIsland || isSchool ? 640 : undefined} trueHorizon={isIsland || isSchool} />

      {/* --- Soft-cartoon lighting (W5-A) ---
          A warm key light (soft shadows), a warm sky/ground hemisphere fill, and
          a cool RIM/back light that rims characters + hilltops with a gentle glow
          (the signature "Zelda" edge light). On High quality a procedural,
          asset-light Environment (Lightformers — no HDR download) adds soft
          image-based ambient/reflections; on Low we skip it and shrink the shadow
          map so phones/tablets stay smooth. */}
      {/* Fill is kept LOW on High so the environment adds shaping, not extra
          brightness (otherwise High just looks washed-out vs Low). */}
      <hemisphereLight
        args={[
          isFarm ? "#fff0d8" : isSnow ? "#dce6ff" : isCabin ? "#ffcf9e" : isMagma ? "#ffc29a" : isJungle ? "#e4f4ff" : isIsland || isSchool ? "#eaf6ff" : "#fff4e0",
          isFarm ? "#6f8a4a" : isSnow ? "#8f97b8" : isCabin ? "#3a2716" : isMagma ? "#6a2a1c" : isJungle ? "#4d6e33" : isIsland ? "#7aa65a" : isSchool ? "#8f9a74" : "#a9cf97",
          isSnow ? (highGfx ? 0.62 : 0.95) : isCabin ? (highGfx ? 0.4 : 0.6) : isMagma ? (highGfx ? 0.75 : 1.15) : isJungle || isFarm || isIsland || isSchool ? (highGfx ? 0.62 : 0.95) : highGfx ? 0.45 : 0.8,
        ]}
      />
      <ambientLight intensity={isSnow ? (highGfx ? 0.12 : 0.26) : isCabin ? (highGfx ? 0.16 : 0.28) : highGfx ? 0.12 : 0.28} />
      {/* Number Island, Magma Multiples, Emerald Jungle, Fraction Farm, Snowball Sums + the Playground bring their OWN player-following key light. */}
      {!isMagma && !isJungle && !isFarm && !isSnow && !isIsland && !isSchool && <directionalLight
        position={isFarm ? [-30, 14, 12] : isSnow ? [22, 28, -18] : isCabin ? [-8, 22, 10] : [20, 30, 16]}
        intensity={isFarm ? 1.35 : isSnow ? 0.95 : isCabin ? 0.55 : 1.5}
        color={isFarm ? "#ffd9a0" : isSnow ? "#bdcdff" : isCabin ? "#ffcf9e" : "#fff0cc"}
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />}
      {/* Cool rim/back light — no shadow, cheap; gives the edge glow. */}
      <directionalLight position={[-18, 12, -22]} intensity={0.8} color="#bcd8ff" />

      {highGfx && (
        <Environment resolution={64} frames={1}>
          {/* Gentle, dim IBL — soft reflections/shaping without raising exposure. */}
          <Lightformer form="circle" intensity={0.55} color="#fff6e6" position={[0, 8, 0]} scale={[12, 12, 1]} />
          <Lightformer intensity={0.3} color="#bcd7ff" position={[-10, 3, -10]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.28} color="#ffe1c2" position={[10, 2, 8]} scale={[10, 10, 1]} />
        </Environment>
      )}

      {/* --- NUMBER ISLAND (rebuilt 2026-10-09): the hub — see IslandScenery. --- */}
      {isIsland && <IslandScenery title={title} />}

      {/* --- SCHOOLYARD scenery (the second region, W2-B) --- */}
      {regionId === "schoolyard" && <SchoolyardScenery />}

      {/* --- PARTS OF A WHOLE FARM (the third region, F1) + its in-world
          challenges: the fence (F2) and the Round-Up herd (F3). --- */}
      {regionId === "farm-parts-whole" && (
        <>
          <FarmScenery />
          {/* The ten challenge stages, each lifted onto its level pad (the
              farm rolls now — data/farm/farmTerrain.js challengePadY) and
              only mounted while the player is near it (FarmStage). */}
          <FarmStage k="fence"><FenceChallenge /></FarmStage>
          <FarmStage k="roundup"><RoundUpChallenge /></FarmStage>
          <FarmStage k="order"><OrderPartsChallenge /></FarmStage>
          <FarmStage k="crate"><CratePackingChallenge /></FarmStage>
          <FarmStage k="milk"><MilkSplitterChallenge /></FarmStage>
          <FarmStage k="weigh"><WeighStationChallenge /></FarmStage>
          <FarmStage k="trade"><TradingPostChallenge /></FarmStage>
          <FarmStage k="veggie"><VeggiePlotChallenge /></FarmStage>
          <FarmStage k="plank"><PlankGapChallenge /></FarmStage>
          <FarmStage k="shop"><FarmShopChallenge /></FarmStage>
          {/* Footprints stamped along the dirt tracks as you walk. */}
          <Footprints test={isOnFarmPath} heightAt={farmTerrainHeight} color="#5a3d28" life={2.6} stride={0.5} size={0.15} />
        </>
      )}

      {/* --- SNOWBALL SUMS (the fourth region, S1): twilight snow world with
          the aurora, penguins, the slippery ice rink and TEN reserved
          challenge areas. --- */}
      {isSnow && (
        <>
          <SnowScenery />
          {/* The ten challenge stages, each lifted onto its level pad (the
              valley rolls now — data/snow/snowTerrain.js challengePadY) and
              only mounted while the player is near it (SnowStage). */}
          <SnowStage k="range"><SnowballRangeChallenge /></SnowStage>
          <SnowStage k="rink"><RinkGlideChallenge /></SnowStage>
          <SnowStage k="grove"><GroveLightsChallenge /></SnowStage>
          <SnowStage k="meadow"><MeadowLevelChallenge /></SnowStage>
          <SnowStage k="sled"><SledSlopeChallenge /></SnowStage>
          <SnowStage k="village"><VillageSplitChallenge /></SnowStage>
          <SnowStage k="colony"><ColonyPairsChallenge /></SnowStage>
          <SnowStage k="cave"><CaveCrystalsChallenge /></SnowStage>
          <SnowStage k="yard"><LodgeYardChallenge /></SnowStage>
          <SnowStage k="lights"><AuroraLookoutChallenge /></SnowStage>
          {/* Footprints stamped in the snow everywhere off the ice + water. */}
          <Footprints test={isOnSnow} heightAt={snowTerrainHeight} color="#aabdd8" life={2.4} stride={0.5} size={0.16} />
        </>
      )}

      {/* --- THE LODGE INTERIOR (CB, the fifth region): the log-cabin great
          room behind the lodge's ajar door. --- */}
      {isCabin && <CabinScenery />}

      {/* --- MAGMA MULTIPLES (the sixth region): the volcano / lava world.
          Land only for now — the eight clearings are reserved for future
          multiplicative challenges. Ash footprints on the open rock. --- */}
      {isMagma && (
        <>
          <MagmaScenery />
          <Footprints test={isOnAsh} heightAt={magmaGroundHeight} color="#241a17" life={2.2} stride={0.55} size={0.16} />
        </>
      )}

      {/* --- EMERALD JUNGLE (the seventh region): the jungle valley. Land
          only for now — ten clearings are reserved for future challenges.
          Footprints on the dirt trails. --- */}
      {isJungle && (
        <>
          <JungleScenery />
          <Footprints test={isOnJunglePath} heightAt={jungleTerrainHeight} color="#4e3820" life={2.4} stride={0.55} size={0.15} />
        </>
      )}

      {/* Teleport Gates for the active region (W2-C) — walk in to travel. The
          Fraction Farm gate uses the haybale variant; the Snowball Sums gate
          is an igloo; "cabindoor" portals draw NO swirl — their visuals are
          the matching ajar doors (SnowScenery LodgeDoor / CabinScenery). */}
      {(region.portals || []).map((p) => {
        // Gates stand on the ground (the island, farm, snow + jungle roll);
        // on the big island their labels show only when you're near.
        const gy = region.groundHeight ? region.groundHeight(p.position[0], p.position[1]) : 0;
        const lr = isIsland ? 42 : isSchool ? 30 : 0;
        return p.variant === "cabindoor" ? null : p.variant === "jungle" ? (
          <JunglePortal key={p.id} position={p.position} rotationY={p.rotationY} label={p.label} y={gy} labelRange={lr} />
        ) : p.variant === "volcano" ? (
          <VolcanoPortal key={p.id} position={p.position} rotationY={p.rotationY} label={p.label} y={isIsland ? gy : 0} labelRange={lr} />
        ) : p.variant === "igloo" ? (
          <IglooPortal key={p.id} position={p.position} rotationY={p.rotationY} label={p.label} y={isSnow || isIsland ? gy : 0} labelRange={lr} />
        ) : p.variant === "haybale" ? (
          <HaybalePortal key={p.id} position={p.position} rotationY={p.rotationY} label={p.label} y={isFarm || isIsland ? gy : 0} labelRange={lr} />
        ) : (
          <Portal
            key={p.id}
            position={p.position}
            rotationY={p.rotationY}
            label={p.label}
            y={isIsland || isSchool ? gy : 0}
            labelRange={lr}
          />
        );
      })}

      {/* Interactables for the ACTIVE region — island NPCs/board/etc., or the
          schoolyard NPCs (Helen/Darby/Elka). Data-driven + region-scoped. */}
      {getInteractablesForRegion(regionId).map((data) => (
        <Interactable key={data.id} data={data} />
      ))}

      {/* Tap-to-move (W4): an invisible ground catcher + a destination marker,
          only in touch mode. Characters/portals sit above the catcher and take
          taps first, so this only fires on empty ground. */}
      {touchMode && !title && <GroundTapCatcher />}
      {touchMode && !title && <DestinationMarker />}

      {/* The student's character (shared across regions; also drives the
          camera — except on the title screen, where TitleCamera flies it). */}
      <Player cinematic={title} />
      {title && <TitleCamera regionId={regionId} />}

      {/* Post-processing (W5-B): AO + subtle bloom, High graphics only. */}
      {highGfx && <Effects snow={isSnow} />}
    </>
  );
}
