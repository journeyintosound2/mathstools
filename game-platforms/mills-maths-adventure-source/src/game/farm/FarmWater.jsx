import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { FARM_CREEK, POND_LEVEL } from "../../data/farm/farmTerrain.js";
import { FARM_POND } from "../../data/farm/farmLayout.js";
import { makeWaterMaterial } from "../jungle/jungleMaterials.js";
import { riverGeometry, discGeometry } from "../jungle/JungleWater.jsx";

/**
 * FARM WATER — the knee-deep creek (a flowing ribbon, foam at the banks) and
 * the duck pond (lazy swirl), plus the pond's fish that leap out now and
 * then. Wading ripples come from the jungle's WadeRipples (farmWaterAt).
 */
export function FarmWaterSurfaces() {
  const mat = useMemo(() => makeWaterMaterial(), []);
  const geos = useMemo(() => ({
    creek: riverGeometry(FARM_CREEK, 0.55, 1.1),
    pond: discGeometry(FARM_POND.center[0], FARM_POND.center[1], FARM_POND.radius + 0.6, FARM_POND.radius + 0.6, POND_LEVEL + 0.004, 0.05, 0.05),
  }), []);
  return (
    <group>
      {Object.entries(geos).map(([k, g]) => (
        <mesh key={k} geometry={g} material={mat} receiveShadow renderOrder={1} />
      ))}
    </group>
  );
}

/** Little orange fish that arc out of the duck pond at intervals. */
const FISH = 4;
export function PondFish() {
  const refs = useRef([]);
  const fish = useMemo(() => Array.from({ length: FISH }, (_, i) => ({
    a: (i / FISH) * Math.PI * 2 + 0.4, r: 2.5 + (i % 3) * 1.8, period: 5.5 + i * 1.7, off: i * 1.3,
  })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    fish.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const ph = ((t + f.off) % f.period) / f.period; // 0..1
      const jump = ph < 0.16 ? ph / 0.16 : -1;
      g.visible = jump >= 0;
      if (jump < 0) return;
      const x = FARM_POND.center[0] + Math.cos(f.a) * f.r + Math.cos(f.a + 1.57) * (jump - 0.5) * 1.6;
      const z = FARM_POND.center[1] + Math.sin(f.a) * f.r + Math.sin(f.a + 1.57) * (jump - 0.5) * 1.6;
      g.position.set(x, POND_LEVEL + Math.sin(jump * Math.PI) * 0.75, z);
      g.rotation.set(0, -f.a, (0.5 - jump) * 2.2);
    });
  });
  return (
    <group>
      {fish.map((_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <mesh scale={[0.32, 0.1, 0.08]}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial color="#f4913e" emissive="#5a2a06" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.3]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color="#e2701c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export { THREE };
