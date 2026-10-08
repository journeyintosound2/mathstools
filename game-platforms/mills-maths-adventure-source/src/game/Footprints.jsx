import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { playerState } from "./sessionStore.js";

/**
 * FOOTPRINTS — while the player walks on a soft-ground patch (snow / ash), small
 * prints are stamped behind them and fade out over ~1 second. A fixed pool of
 * prints is recycled (oldest reused), so there's no per-frame allocation and no
 * React re-renders — positions/opacity are written straight to the meshes.
 *
 * Props: center [x,z], radius, color — one instance per patch. OR pass a
 * `test(x,z) => bool` predicate to stamp prints on an arbitrary region (e.g. the
 * farm's dirt lanes), with optional `life` / `stride` / `size` overrides.
 */
const POOL = 28;
const LIFE = 1.0; // seconds a print lasts
const STRIDE = 0.55; // distance walked between prints

export default function Footprints({ center, radius, color = "#aebfca", test, life = LIFE, stride = STRIDE, size = 0.17, heightAt }) {
  const refs = useRef([]);
  const prints = useMemo(
    () => Array.from({ length: POOL }, () => ({ born: -999, x: 0, z: 0, y: 0.05 })),
    []
  );
  const cursor = useRef(0);
  const acc = useRef(0);
  const last = useRef({ x: playerState.x, z: playerState.z });
  const side = useRef(1);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const dx = playerState.x - last.current.x;
    const dz = playerState.z - last.current.z;
    const moved = Math.hypot(dx, dz);
    last.current.x = playerState.x;
    last.current.z = playerState.z;

    const onPatch = test
      ? test(playerState.x, playerState.z)
      : Math.hypot(playerState.x - center[0], playerState.z - center[1]) < radius;

    if (onPatch && moved > 0.0001) {
      acc.current += moved;
      if (acc.current >= stride) {
        acc.current = 0;
        // offset left/right of the direction of travel for a footstep look
        const inv = 1 / (moved || 1);
        const px = -dz * inv, pz = dx * inv; // perpendicular
        const p = prints[cursor.current];
        p.born = t;
        p.x = playerState.x + px * 0.16 * side.current;
        p.z = playerState.z + pz * 0.16 * side.current;
        // Optional terrain-following height (regions with hills/mountains).
        p.y = heightAt ? heightAt(p.x, p.z) + 0.05 : 0.05;
        side.current *= -1;
        cursor.current = (cursor.current + 1) % POOL;
      }
    }

    for (let i = 0; i < POOL; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const age = t - prints[i].born;
      if (prints[i].born < 0 || age > life) {
        if (m.visible) m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(prints[i].x, prints[i].y, prints[i].z);
      m.material.opacity = 0.5 * (1 - age / life);
    }
  });

  return (
    <group>
      {Array.from({ length: POOL }).map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <circleGeometry args={[size, 14]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
