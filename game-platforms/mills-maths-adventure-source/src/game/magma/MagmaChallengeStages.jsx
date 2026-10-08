import React from "react";

import { getMagmaChallenge } from "../../data/magma/magmaChallenges.js";
import { useActiveMagmaChallenge } from "./magmaActive.js";
import ColumnsStage from "./stages/ColumnsStage.jsx";
import ObsidianStage from "./stages/ObsidianStage.jsx";
import TerracesStage, { TerracesSetPiece } from "./stages/TerracesStage.jsx";
import GeysersStage from "./stages/GeysersStage.jsx";
import ForgeStage from "./stages/ForgeStage.jsx";
import GardenStage from "./stages/GardenStage.jsx";
import CinderStage from "./stages/CinderStage.jsx";
import LakeStage from "./stages/LakeStage.jsx";
import BonesStage from "./stages/BonesStage.jsx";
import SummitStage from "./stages/SummitStage.jsx";

/**
 * MAGMA MULTIPLES — the challenge layer. Only the RUNNING challenge's scene
 * is drawn (in its own stage frame, so every scene is authored in simple
 * local coordinates: x right, +z toward the camera). The Tenfold Terraces
 * staircase is permanent scenery, so it is always drawn.
 */

const STAGES = {
  columns: ColumnsStage,
  obsidian: ObsidianStage,
  terraces: TerracesStage,
  geysers: GeysersStage,
  forge: ForgeStage,
  garden: GardenStage,
  cinder: CinderStage,
  lake: LakeStage,
  bones: BonesStage,
  summit: SummitStage,
};

export function StageFrame({ challengeKey, children }) {
  const c = getMagmaChallenge(challengeKey);
  if (!c) return null;
  const f = c.frame;
  return (
    <group position={[f.origin[0], f.y, f.origin[1]]} rotation={[0, f.yaw, 0]}>
      {children}
    </group>
  );
}

export default function MagmaChallengeStages() {
  const key = useActiveMagmaChallenge();
  const Stage = key ? STAGES[key] : null;
  return (
    <group>
      <StageFrame challengeKey="terraces">
        <TerracesSetPiece />
      </StageFrame>
      {Stage && (
        <StageFrame challengeKey={key}>
          {/* A warm work-light over the apparatus so the maths reads
              clearly in the dusky lava light. */}
          <pointLight position={[0, 9, 4]} color="#fff1dc" intensity={60} distance={32} decay={1.4} />
          <Stage />
        </StageFrame>
      )}
    </group>
  );
}
