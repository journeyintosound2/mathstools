import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * MAGMA STAGE KIT — small shared pieces for the ten challenge scenes. Every
 * stage is drawn in its own STAGE FRAME (x right, +z toward the camera,
 * y up, origin = the apparatus centre on the ground).
 */

/** A world-space chip (HTML) — never covers the card (zIndexRange). */
export function Chip({ position, children, className = "fc-count-chip", df = 10, style }) {
  return (
    <Html position={position} center distanceFactor={df} zIndexRange={[24, 0]} style={{ pointerEvents: "none" }}>
      <div className={className} style={style}>{children}</div>
    </Html>
  );
}

/** A low paved stone pad the apparatus stands on. */
export function StonePad({ w, d, y = 0.04, color = "#3a302c", position = [0, 0, 0] }) {
  return (
    <mesh position={[position[0], y, position[2]]} receiveShadow>
      <boxGeometry args={[w, 0.08, d]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

/** Shared materials (created once per scene). */
export function useMagmaMats() {
  return useMemo(() => ({
    rock: new THREE.MeshStandardMaterial({ color: "#4a3d38", roughness: 0.9, flatShading: true }),
    darkRock: new THREE.MeshStandardMaterial({ color: "#2a2220", roughness: 0.95, flatShading: true }),
    basalt: new THREE.MeshStandardMaterial({ color: "#5b5450", roughness: 0.85, flatShading: true }),
    lava: new THREE.MeshStandardMaterial({ color: "#ff6a1a", emissive: "#ff4a00", emissiveIntensity: 1.1, roughness: 0.5 }),
    glowRed: new THREE.MeshStandardMaterial({ color: "#ff3b2f", emissive: "#ff1a00", emissiveIntensity: 0.9 }),
    glowGold: new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffb000", emissiveIntensity: 0.8 }),
    glowGreen: new THREE.MeshStandardMaterial({ color: "#7dff9a", emissive: "#2bd65a", emissiveIntensity: 0.7 }),
    ghost: new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffb000", emissiveIntensity: 0.4, transparent: true, opacity: 0.28, depthWrite: false }),
  }), []);
}

/** Eases a ref'd object's position toward `target` every frame. */
export function useEase(ref, target, k = 10) {
  useFrame((_, dt) => {
    const o = ref.current;
    if (!o) return;
    const a = 1 - Math.exp(-k * dt);
    o.position.x += (target[0] - o.position.x) * a;
    o.position.y += (target[1] - o.position.y) * a;
    o.position.z += (target[2] - o.position.z) * a;
  });
}

/** A short burst of glowing sparks (embers) at a point, keyed by `at`. */
export function Sparks({ origin, at, color = "#ffb347", count = 26, spread = 1.4 }) {
  const group = useRef();
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        p: new THREE.Vector3(),
        v: new THREE.Vector3((Math.random() - 0.5) * spread * 3, 2 + Math.random() * 3.5, (Math.random() - 0.5) * spread * 3),
      })),
    // a new burst every time `at` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [at, count, spread]
  );
  const t = useRef(0);
  useMemo(() => { t.current = 0; }, [at]);
  useFrame((_, dt) => {
    if (!group.current) return;
    t.current += dt;
    group.current.children.forEach((m, i) => {
      const q = parts[i];
      q.v.y -= 9 * dt;
      q.p.addScaledVector(q.v, dt);
      m.position.copy(q.p);
      const life = 1 - t.current / 1.1;
      m.visible = life > 0;
      m.scale.setScalar(Math.max(0.01, life));
    });
  });
  if (!at) return null;
  return (
    <group ref={group} position={origin}>
      {parts.map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.07, 0]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Seconds since a timestamp (ms), for one-shot animations. */
export function since(at) {
  return at ? (Date.now() - at) / 1000 : 999;
}

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
