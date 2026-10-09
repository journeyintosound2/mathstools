import React, { useMemo } from "react";
import * as THREE from "three";
import { GradientTexture } from "@react-three/drei";

/**
 * SKY + HORIZON BACKDROP (W5-E).
 *
 * `SkyDome` is a large inside-out sphere with a vertical gradient (warm/pale at
 * the horizon → deeper blue overhead), excluded from fog and drawn behind
 * everything; its horizon colour matches the fog/sky colour so the fogged
 * distance blends smoothly into it.
 *
 * `DistantIslands` is a ring of low, rounded landmasses out past the play area,
 * sitting IN the (now extended) ocean so they read as distant islands rather
 * than floating in the sky. A couple carry a lighthouse / a cabin and several
 * have scattered pines, hazed by the fog. Purely decorative — no colliders, and
 * the walkable ground is untouched.
 */
export function SkyDome({ horizon = "#bde0fe", top = "#6ea9e6", radius = 130, trueHorizon = false }) {
  if (trueHorizon) return <HorizonSkyDome horizon={horizon} top={top} radius={radius} />;
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false}>
        <GradientTexture stops={[0, 0.55, 1]} colors={[horizon, mixHex(horizon, top, 0.5), top]} size={512} />
      </meshBasicMaterial>
    </mesh>
  );
}

/**
 * A sky dome whose gradient is keyed to ELEVATION, not the sphere's UVs: the
 * horizon colour (= the fog colour) holds from below the horizon up to a few
 * degrees above it, then deepens to the zenith. Used on Number Island, whose
 * open sea is seen from high up (the title flyover): there the old UV
 * gradient put a darker band right where the fogged sea meets the sky.
 */
function HorizonSkyDome({ horizon, top, radius }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uHorizon: { value: new THREE.Color(horizon) },
      uMid: { value: new THREE.Color(mixHex(horizon, top, 0.5)) },
      uTop: { value: new THREE.Color(top) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uHorizon; uniform vec3 uMid; uniform vec3 uTop;
      varying vec3 vDir;
      void main() {
        float e = clamp(vDir.y, 0.0, 1.0);
        vec3 c = mix(uHorizon, uMid, smoothstep(0.03, 0.32, e));
        c = mix(c, uTop, smoothstep(0.3, 0.95, e));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }), [horizon, top]);
  return (
    <mesh renderOrder={-1} material={mat}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
}

// A little pine for the distant islands.
function MiniPine({ x, z, y, s = 1 }) {
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.12, 0.16, 1, 6]} /><meshStandardMaterial color="#6b4f3a" /></mesh>
      <mesh position={[0, 1.5, 0]}><coneGeometry args={[0.8, 1.8, 8]} /><meshStandardMaterial color="#3f7d4f" /></mesh>
      <mesh position={[0, 2.4, 0]}><coneGeometry args={[0.55, 1.2, 8]} /><meshStandardMaterial color="#4f9160" /></mesh>
    </group>
  );
}

// A simple candy-striped lighthouse with a lantern room.
function Lighthouse({ x, z, y }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 3, 0]}><cylinderGeometry args={[0.9, 1.4, 6, 12]} /><meshStandardMaterial color="#f4f4f4" /></mesh>
      <mesh position={[0, 2, 0]}><cylinderGeometry args={[1.12, 1.25, 1, 12]} /><meshStandardMaterial color="#d64545" /></mesh>
      <mesh position={[0, 4, 0]}><cylinderGeometry args={[0.95, 1.02, 1, 12]} /><meshStandardMaterial color="#d64545" /></mesh>
      {/* lantern room + light */}
      <mesh position={[0, 6.3, 0]}><cylinderGeometry args={[0.7, 0.8, 1, 12]} /><meshStandardMaterial color="#33506b" /></mesh>
      <mesh position={[0, 6.4, 0]}><sphereGeometry args={[0.42, 12, 10]} /><meshStandardMaterial color="#ffe08a" emissive="#ffd166" emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 7.0, 0]}><coneGeometry args={[0.85, 0.9, 12]} /><meshStandardMaterial color="#8a1f1f" /></mesh>
    </group>
  );
}

// A cosy timber cabin with a pitched roof.
function Cabin({ x, z, y }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[3.4, 2, 2.6]} /><meshStandardMaterial color="#a9713e" /></mesh>
      <mesh castShadow position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.6, 1.6, 4]} /><meshStandardMaterial color="#6b3f2a" /></mesh>
      <mesh position={[0, 0.6, 1.31]}><boxGeometry args={[0.7, 1.2, 0.1]} /><meshStandardMaterial color="#5a3a24" /></mesh>
    </group>
  );
}

const ISLAND_COUNT = 14;
export function DistantIslands({ color = "#6f9e6a" }) {
  const isles = useMemo(() => {
    const out = [];
    for (let i = 0; i < ISLAND_COUNT; i++) {
      const a = (i / ISLAND_COUNT) * Math.PI * 2 + (i % 3) * 0.11;
      const r = 58 + ((i * 37) % 14); // 58..72 out — inside the extended ocean
      const w = 10 + ((i * 53) % 9);
      const h = 4 + ((i * 29) % 5);
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, w, h, i });
    }
    return out;
  }, []);

  return (
    <group>
      {isles.map((s) => {
        const topY = -1 + s.h; // world height of the mound's crown
        const lighthouse = s.i === 0;
        const cabin = s.i === 3;
        return (
          <group key={s.i}>
            {/* the landmass */}
            <mesh position={[s.x, -1, s.z]} scale={[s.w, s.h, s.w]}>
              <sphereGeometry args={[1, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} roughness={1} flatShading />
            </mesh>
            {/* a sandy shore ring at the water line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s.x, -0.85, s.z]}>
              <ringGeometry args={[s.w * 0.9, s.w * 1.12, 24]} />
              <meshStandardMaterial color="#e7d29a" />
            </mesh>
            {/* landmarks on the two nearest isles */}
            {lighthouse && <Lighthouse x={s.x} z={s.z} y={topY - 0.5} />}
            {cabin && <Cabin x={s.x + s.w * 0.3} z={s.z} y={topY - 0.6} />}
            {/* scattered pines on the rest */}
            {!lighthouse && [0, 1, 2].map((k) => {
              const ox = ((s.i * 7 + k * 13) % 10) / 10 - 0.5;
              const oz = ((s.i * 5 + k * 17) % 10) / 10 - 0.5;
              return <MiniPine key={k} x={s.x + ox * s.w * 0.8} z={s.z + oz * s.w * 0.8} y={topY - 0.4} s={1 + (k % 2) * 0.4} />;
            })}
          </group>
        );
      })}
    </group>
  );
}

function mixHex(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return "#" + ca.lerp(cb, t).getHexString();
}
