import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { useUI } from "../ui/effects/uiStore.js";
import { playerState } from "./sessionStore.js";
import { useFarmChallengeActive } from "./farmChallengeActive.js";
import { JungleClock } from "./jungle/JungleAtmosphere.jsx";
import MapBoard3D from "./maps/MapBoard3D.jsx";
import { QT_REGION_ID, QT_SPOTS, QT_RETURN_PORTAL, qtGroundHeight } from "../data/qtemple/qtempleWorld.js";
import QtStructure from "./qtemple/QtStructure.jsx";
import QtHall from "./qtemple/QtHall.jsx";
import QtRooms from "./qtemple/QtRooms.jsx";
import { QtLighting, Flames, DustMotes, SandPools, LightWell } from "./qtemple/QtAtmosphere.jsx";

/**
 * THE QUOTIENT TEMPLE — scenery root (the ninth region, built 2026-11-09).
 * The inside of the temple whose door stands in Sunstone Desert: the
 * vestibule, the Grand Descent (three flights + two landings, 18 m down),
 * the Great Hall, and the wings off it — the Hall of Heads, the Scribes'
 * Library, the Sunken Pit, the Cobra Throne, the Treasury and the
 * Guardians' Court. Exploration only for now (the challenges come later).
 * Plan + physics: data/qtemple/qtempleWorld.js; the look: game/qtemple/.
 */

/** A world label that only shows when the player is within `range` metres. */
function NearLabel({ position, text, range = 30, distanceFactor = 14, dy = 7 }) {
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

export default function QTempleScenery() {
  const highGfx = useUI((s) => s.graphicsQuality) === "high";
  const challengeOn = useFarmChallengeActive();
  return (
    <group>
      <JungleClock />
      <QtLighting highGfx={highGfx} />
      <QtStructure />
      <QtHall />
      <QtRooms />
      <Flames />
      <DustMotes count={highGfx ? 320 : 140} />
      <SandPools />
      <LightWell />
      <MapBoard3D regionId={QT_REGION_ID} roof="#7a4a1c" />
      {!challengeOn && (
        <>
          {QT_SPOTS.filter((s) => s.id !== "doors").map((s) => {
            const y = qtGroundHeight(s.center[0], s.center[1], 0) + 3.6;
            return <NearLabel key={s.id} position={[s.center[0], y, s.center[1]]} text={`${s.icon} ${s.label}`} range={s.id === "hall" ? 22 : 16} />;
          })}
          <NearLabel position={[QT_RETURN_PORTAL[0], 4.6, QT_RETURN_PORTAL[1] - 0.6]} text="☀️ Back to Sunstone Desert" range={5} distanceFactor={6} />
        </>
      )}
    </group>
  );
}
