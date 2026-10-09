import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { getJungleChallenge, BUILT_JUNGLE_CHALLENGES } from "../../data/jungle/jungleChallenges.js";
import { playerState } from "../sessionStore.js";
import { useActiveJungleChallenge } from "./jungleActive.js";
import SwapStage from "./stages/SwapStage.jsx";
import MarketStage from "./stages/MarketStage.jsx";

/**
 * EMERALD JUNGLE — the challenge layer. Each BUILT challenge's scene stands
 * in its clearing's STAGE FRAME (x right, +z toward the camera). Unlike the
 * magma stages, the jungle's are drawn even when idle (empty vines between
 * their posts, the stall, the monkeys) so a clearing reads as "something
 * happens here" from the trail — but only within MOUNT_RANGE of the player
 * (the farm's FarmStage rule), and always while that challenge runs.
 */

const STAGES = { swap: SwapStage, market: MarketStage };
const MOUNT_RANGE = 110;
// World chips (HTML) draw over everything, so an idle stage only shows its
// labels when you're standing near it.
const LABEL_RANGE = 26;

export function JungleStageFrame({ challengeKey, children }) {
  const c = getJungleChallenge(challengeKey);
  if (!c || !c.frame) return null;
  const f = c.frame;
  return (
    <group position={[f.origin[0], f.y, f.origin[1]]} rotation={[0, f.yaw, 0]}>
      {children}
    </group>
  );
}

function NearStage({ c, running }) {
  const [state, setState] = useState(0); // 0 far · 1 mounted · 2 close enough for labels
  const last = useRef(0);
  useFrame(() => {
    const o = c.frame.origin;
    const d = Math.hypot(playerState.x - o[0], playerState.z - o[1]);
    const s = d < LABEL_RANGE ? 2 : d < MOUNT_RANGE ? 1 : 0;
    if (s !== last.current) { last.current = s; setState(s); }
  });
  const Stage = STAGES[c.key];
  if (!Stage || (state === 0 && !running)) return null;
  return (
    <JungleStageFrame challengeKey={c.key}>
      <Stage labels={running || state === 2} />
    </JungleStageFrame>
  );
}

export default function JungleChallengeStages() {
  const key = useActiveJungleChallenge();
  return (
    <group>
      {BUILT_JUNGLE_CHALLENGES.map((c) => <NearStage key={c.key} c={c} running={key === c.key} />)}
    </group>
  );
}
