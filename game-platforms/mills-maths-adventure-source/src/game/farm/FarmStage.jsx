import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { playerState } from "../sessionStore.js";
import { farmChallengeView } from "../../data/farm/farmCameras.js";
import { challengePadY } from "../../data/farm/farmTerrain.js";

/**
 * FARM STAGE — one challenge's 3D scene, lifted onto its level pad and only
 * MOUNTED while the player is within range of it. The big farm spreads the
 * ten challenges hundreds of metres apart behind hills, and their idle scenes
 * (the Round-Up herd, the fruit piles, the stalls…) are hundreds of small
 * meshes — drawing all ten from everywhere was ~40 % of the farm's draw calls.
 * Hysteresis (in at IN m, out at OUT m) stops a flicker at the edge. A running
 * challenge parks the player at its own stage, so it is always in range.
 */
const IN = 120;
const OUT = 132;

export default function FarmStage({ k, children }) {
  const centre = useMemo(() => {
    const v = farmChallengeView(k);
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
