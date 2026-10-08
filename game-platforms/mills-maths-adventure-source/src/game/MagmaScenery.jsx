import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { useSession, requestMoveTo, playerState } from "./sessionStore.js";
import { clampToBounds } from "../data/regions.js";
import {
  MAGMA_BOUNDS, MAGMA_CHALLENGE_SPOTS, SUMMIT_SPOT, MAGMA_WELCOME_SIGN, VOLCANO,
  magmaGroundHeight,
} from "../data/magma/magmaLayout.js";
import { LavaSea, Lowland, VolcanoBody, TrailRibbon, PathRibbons, Plazas } from "./magma/MagmaTerrain.jsx";
import {
  LavaClock, MagmaLighting, CraterPlume, EmberFountain, AmbientEmbers, DistantVolcanoes, HotFootPuff,
} from "./magma/MagmaAtmosphere.jsx";
import { MagmaBridges, MagmaPlatforms } from "./magma/MagmaBridges.jsx";
import {
  Boulders, DeadTrees, Lanterns, TrailTorches, SummitDressing, VolcanoStreams, PlazaDressing,
  BasaltColumnsField, ObsidianGrove, GeyserFlats, EmberForge, LakeSetPiece, CinderCones,
  DragonBones, FireGarden,
} from "./magma/MagmaSetPieces.jsx";
import MagmaChallengeStages from "./magma/MagmaChallengeStages.jsx";
import { useActiveMagmaChallenge } from "./magma/magmaActive.js";
import { inMagmaChallengeView, MAGMA_RECORDS_STAND } from "../data/magma/magmaChallenges.js";
import { magmaShelfEntries } from "../data/magma/magmaRecords.js";
import { useFarmChallengeActive } from "./farmChallengeActive.js";
import TrophyStandAssembly from "./TrophyStand.jsx";

/**
 * MAGMA MULTIPLES — scenery root (the sixth region). Land only: terrain,
 * the volcano + summit trail, lava, bridges, the eight reserved clearings
 * and their set-pieces, atmosphere. All positions come from
 * data/magma/magmaLayout.js + magmaProps.js.
 */

/** A world label that only shows when the player is within `range` metres
 * (so far-off labels don't float through the volcano). */
function NearLabel({ position, text, range = 46, distanceFactor = 22, sign = "open" }) {
  const [show, setShow] = useState(false);
  const last = useRef(false);
  useFrame(() => {
    const d = Math.hypot(playerState.x - position[0], playerState.z - position[2]);
    const dy = Math.abs((playerState.y || 0) - position[1]);
    const on = d < range && dy < 14;
    if (on !== last.current) { last.current = on; setShow(on); }
  });
  if (!show) return null;
  return (
    <Html position={position} center distanceFactor={distanceFactor} className="ix-badge-anchor" zIndexRange={[24, 0]}>
      <div className={`unlock-sign ${sign}`}>{text}</div>
    </Html>
  );
}

export default function MagmaScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const touchMode = useUI((s) => s.touchMode);

  // Tap-to-move on the actual terrain (the flat catcher plane would put the
  // target behind the mountain when you tap its slopes).
  const onTap = useCallback((e) => {
    if (useSession.getState().activeEncounterId) return;
    e.stopPropagation();
    const { x, z } = clampToBounds(e.point.x, e.point.z, MAGMA_BOUNDS);
    requestMoveTo(x, z, null);
  }, []);
  const tap = touchMode ? onTap : undefined;
  const [wx, wz] = MAGMA_WELCOME_SIGN.position;
  // The running challenge (if any): props in its camera corridor step out
  // of shot, area labels come down, clashing set-pieces step aside.
  const magmaKey = useActiveMagmaChallenge();
  const challengeOn = useFarmChallengeActive();
  const hide = useMemo(() => (magmaKey ? (x, z) => inMagmaChallengeView(magmaKey, x, z) : null), [magmaKey]);

  return (
    <group>
      <LavaClock />
      <MagmaLighting highGfx={highGfx} />

      {/* Ground, lava, the volcano. */}
      <LavaSea />
      <Lowland onTap={tap} />
      <VolcanoBody onTap={tap} />
      <TrailRibbon />
      <VolcanoStreams />
      <PathRibbons />
      <Plazas />
      <MagmaBridges />
      <MagmaPlatforms />

      {/* Dressing. */}
      <Boulders hide={hide} />
      <DeadTrees hide={hide} />
      <Lanterns hide={hide} />
      <TrailTorches />
      <SummitDressing />
      <PlazaDressing />

      {/* One landmark per reserved clearing. */}
      <BasaltColumnsField />
      <ObsidianGrove hide={hide} />
      <GeyserFlats />
      <EmberForge />
      <LakeSetPiece hideObelisk={magmaKey === "lake"} />
      <CinderCones />
      <DragonBones hideRibs={magmaKey === "bones"} />
      <FireGarden />

      {/* Sky theatre. */}
      <CraterPlume />
      <EmberFountain />
      {highGfx && <AmbientEmbers />}
      <DistantVolcanoes />
      <HotFootPuff />

      {/* The ten multiplicative challenges (only the running one is drawn,
          plus the permanent Tenfold Terraces staircase). */}
      <MagmaChallengeStages />

      {/* The trophy stand on the arrival plaza — identical to the farm's and
          the snow world's (trophy.glb, ten pigeonholes, grand trophy). */}
      <TrophyStandAssembly
        position={MAGMA_RECORDS_STAND.position}
        rotationY={MAGMA_RECORDS_STAND.rotationY}
        entries={magmaShelfEntries()}
        groupScale={4.2}
      />

      {/* Labels: the welcome tablet, each clearing, the summit — all down
          while a challenge has the screen. */}
      {!challengeOn && (
        <>
          <NearLabel position={[wx, 1.55, wz]} text={MAGMA_WELCOME_SIGN.text} range={30} distanceFactor={10} />
          {MAGMA_CHALLENGE_SPOTS.map((s) => (
            <NearLabel key={s.id} position={[s.center[0], magmaGroundHeight(s.center[0], s.center[1]) + 3.2, s.center[1]]} text={s.label} />
          ))}
          <NearLabel position={[SUMMIT_SPOT.center[0], VOLCANO.height + 3.4, SUMMIT_SPOT.center[1]]} text={`🌋 ${SUMMIT_SPOT.label}`} range={30} />
        </>
      )}
    </group>
  );
}
