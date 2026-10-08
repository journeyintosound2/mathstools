import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { playerState } from "../sessionStore.js";
import { snowChallengeView } from "../../data/snow/snowCameras.js";
import { challengePadY } from "../../data/snow/snowTerrain.js";

/**
 * SNOW STAGE — one Snowball Sums challenge's 3D scene, lifted onto its level
 * pad (the valley rolls now) and only MOUNTED while the player is within range
 * of it (the ten stages are spread across a big valley; drawing every idle
 * scene from everywhere is wasted work). Hysteresis stops a flicker at the
 * edge; a running challenge parks the player at its own stage, so it's always
 * in range.
 */
const IN = 120;
const OUT = 132;

export default function SnowStage({ k, children }) {
  const centre = useMemo(() => {
    const v = snowChallengeView(k);
    return [v.look[0], v.look[2]];
  }, [k]);
  const near = () => Math.hypot(playerState.x - centre[0], playerState.z - centre[1]);
  const [on, setOn] = useState(() => near() < IN);
  const onRef = useRef(on);
  useFrame(() => {
    const d = near();
    const next = onRef.current ? d < OUT : d < IN;
    if (next !== onRef.current) {
      onRef.current = next;
      setOn(next);
    }
  });
  return <group position={[0, challengePadY(k), 0]}>{on ? children : null}</group>;
}
