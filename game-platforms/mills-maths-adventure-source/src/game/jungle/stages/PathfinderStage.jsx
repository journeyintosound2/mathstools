import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { usePathfinderChallenge } from "../stores/pathfinderStore.js";
import LadderSet, { useLadderRound } from "./LadderSet.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { vineShort } from "../../../data/jungle/jungleUnits.js";

/**
 * PATHFINDER — the capstone at the Sky Shrine: an expedition planned ladder
 * by ladder. One vine ladder at a time hangs in front of the shrine; in
 * front of it, a row of stepping stones (one per ladder, then the shrine's
 * crystal) lights up leg by leg as each ladder is finished, and a little
 * explorer hops along them. The leg you've finished shows its answer above
 * the ladder — it's the target of the next one.
 */

const YS = [2.75, 1.35];
// Stepping stones BEHIND the ladder (they show just under the bottom vine).
const STONES = [[-3.4, -3.4], [0.3, -3.6], [4.0, -3.4]];

function Stone({ position, lit, last }) {
  const glow = useRef();
  useFrame(({ clock }) => {
    if (glow.current) glow.current.material.emissiveIntensity = lit ? 0.7 + Math.sin(clock.elapsedTime * 3) * 0.2 : 0.05;
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.95, 0.24, 9]} />
        <meshStandardMaterial color="#8d8a72" roughness={0.95} flatShading />
      </mesh>
      <mesh ref={glow} position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 16]} />
        <meshStandardMaterial color={lit ? "#ffd166" : "#6d6a58"} emissive="#ffb000" emissiveIntensity={0.05} />
      </mesh>
      {last && (
        <mesh position={[0, 0.85, 0]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color={lit ? "#9ee7ff" : "#5d7d88"} emissive="#3ad0ff" emissiveIntensity={lit ? 1.2 : 0.05} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Hopper({ to }) {
  const ref = useRef();
  const from = useRef(to);
  const t0 = useRef(null);
  const key = useRef(to.join());
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (key.current !== to.join()) { from.current = [g.position.x, g.position.z]; key.current = to.join(); t0.current = clock.elapsedTime; }
    const f = t0.current === null ? 1 : Math.min(1, (clock.elapsedTime - t0.current) / 0.9);
    g.position.x = from.current[0] + (to[0] - from.current[0]) * f;
    g.position.z = from.current[1] + (to[1] - from.current[1]) * f;
    g.position.y = 0.3 + Math.sin(f * Math.PI) * 0.8;
  });
  return (
    <group ref={ref} position={[to[0], 0.3, to[1]]}>
      <mesh position={[0, 0.35, 0]}><capsuleGeometry args={[0.13, 0.32, 4, 8]} /><meshStandardMaterial color="#457b9d" /></mesh>
      <mesh position={[0, 0.72, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#e8c39e" /></mesh>
      <mesh position={[0, 0.83, 0]}><cylinderGeometry args={[0.2, 0.2, 0.04, 12]} /><meshStandardMaterial color="#c2a36b" /></mesh>
    </group>
  );
}

export default function PathfinderStage({ labels = true }) {
  const S = useLadderRound(usePathfinderChallenge);
  const { running, round, ended, status, phase } = S;
  const legs = running ? (round.legs ? round.legs.length : 1) : 2;
  // Legs done: chain rounds count their finished build phases.
  const done = !running ? 0 : ended ? legs : round.legs ? Math.min(legs, round.phases.slice(0, phase).filter((p) => p.type === "build").length) : 0;
  const stoneFor = (k) => STONES[Math.min(STONES.length - 1, legs === 1 ? (k === 0 ? 0 : 2) : k)];
  const at = stoneFor(done);

  return (
    <group>
      <LadderSet
        S={S}
        ys={YS}
        labels={labels}
        idleL={{ top: { kind: "num", unit: "cm", dp: 1, icon: "🗺️", one: "map cm", many: "map cm" }, bottom: { kind: "num", unit: "m", dp: 0, icon: "🥾", one: "metre", many: "metres" }, a: 20, b: 50 }}
        idleNames={["🗺️ map cm", "🥾 m"]}
        names={(r, li) => [vineShort(r.ladders[li].L.top), vineShort(r.ladders[li].L.bottom)]}
      />
      {STONES.map((p, k) => (
        <Stone key={k} position={p} lit={k === 0 ? running : legs === 1 ? (k === 2 && done >= 1) || (k === 1 && done >= 1) : k <= done} last={k === STONES.length - 1} />
      ))}
      {[0, 1].map((k) => (
        <mesh key={`b${k}`} position={[(STONES[k][0] + STONES[k + 1][0]) / 2, 0.16, (STONES[k][1] + STONES[k + 1][1]) / 2]}>
          <boxGeometry args={[Math.abs(STONES[k + 1][0] - STONES[k][0]) - 1.5, 0.08, 0.5]} />
          <meshStandardMaterial color={done > k ? "#c9a46a" : "#7a6a4c"} emissive={done > k ? "#ffb000" : "#000"} emissiveIntensity={done > k ? 0.25 : 0} />
        </mesh>
      ))}
      <Hopper to={at} />

      {status === "celebrate" && <ConfettiBurst origin={[STONES[2][0], 1.2, STONES[2][1]]} />}
    </group>
  );
}
