import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { terrainHeight } from "../../data/snow/snowTerrain.js";
import { SNOW_PEAKS, SNOW_LODGE } from "../../data/snow/snowLayout.js";
import { buildPeak } from "./snowGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { LODGE_CHIMNEY, cabinChimneys } from "./SnowBuildings.jsx";

/**
 * SNOW ATMOSPHERE — a low WINTER-AFTERNOON sun that follows the player (so
 * shadows work across the whole valley), gently falling SNOW round the
 * camera, the AURORA rippling over the northern peaks, a ring of jagged
 * snow-capped MOUNTAINS on the horizon (with a snowfield under them), and
 * wood smoke curling from the lodge + cabin chimneys.
 */
export const SNOW_SUN_DIR = new THREE.Vector3(-30, 38, 42).normalize();
const SUN_OFFSET = SNOW_SUN_DIR.clone().multiplyScalar(80);

export function SnowLighting({ highGfx }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const px = Math.round(playerState.x / 2) * 2, pz = Math.round(playerState.z / 2) * 2;
    const py = Math.round((playerState.y || 0) / 2) * 2;
    l.position.set(px + SUN_OFFSET.x, py + SUN_OFFSET.y, pz + SUN_OFFSET.z);
    target.position.set(px, py, pz);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        intensity={1.55}
        color="#ffeedd"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={220}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SNOWFALL — GPU flakes in a box that wraps round the camera.
// ---------------------------------------------------------------------------
const FLAKE_VS = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uSize;
  attribute vec4 aSeed;
  varying float vAlpha;
  void main() {
    vec3 box = vec3(72.0, 40.0, 72.0);
    vec3 p = aSeed.xyz * box;
    p.y -= uTime * (1.1 + aSeed.w * 1.3);
    p.x += sin(uTime * 0.55 + aSeed.w * 23.0) * 1.3 + uTime * 0.45;
    p.z += cos(uTime * 0.47 + aSeed.x * 19.0) * 1.1 + uTime * 0.12;
    vec3 base = uCam - box * 0.5 + vec3(0.0, 8.0, 0.0);
    p = base + mod(p - base, box);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = uSize * (0.55 + aSeed.w * 0.9) * (300.0 / max(dist, 1.0));
    vAlpha = (1.0 - smoothstep(14.0, 46.0, dist)) * smoothstep(0.6, 3.0, dist);
  }
`;
const FLAKE_FS = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.12, 0.5, d)) * vAlpha * 0.9;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0), a);
  }
`;
export function Snowfall({ count = 1800 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 4);
    let s = 9;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < count * 4; i++) seed[i] = r();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uSize: { value: 0.09 } },
    vertexShader: FLAKE_VS, fragmentShader: FLAKE_FS, transparent: true, depthWrite: false,
  }), []);
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uCam.value.copy(state.camera.position);
    mat.uniforms.uSize.value = 0.09 * state.gl.getPixelRatio() * (state.size.height / 700);
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
}

// ---------------------------------------------------------------------------
// THE AURORA — rippling additive curtains over the northern peaks.
// ---------------------------------------------------------------------------
function AuroraRibbon({ y, z, x = 0, width = 520, color, opacity = 0.3, speed = 0.3, phase = 0, height = 60, tilt = 0.25 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 90, 6);
    const c = new Float32Array(g.attributes.position.count * 3);
    const col = new THREE.Color(color);
    const top = new THREE.Color("#8a5cf0");
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = (p.getY(i) + height / 2) / height; // 0 bottom → 1 top
      const k = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.15)), 1.4) * (v < 0.15 ? v / 0.15 : 1);
      const cc = col.clone().lerp(top, Math.max(0, v - 0.45) * 1.4).multiplyScalar(k);
      c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }, [width, height, color]);
  useFrame((state) => {
    const g = ref.current && ref.current.geometry;
    if (!g) return;
    const t = state.clock.elapsedTime * speed + phase;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const xx = pos.getX(i);
      pos.setZ(i, Math.sin(xx * 0.012 + t) * 22 + Math.sin(xx * 0.031 - t * 1.7) * 7);
    }
    pos.needsUpdate = true;
  });
  return (
    <mesh ref={ref} geometry={geo} position={[x, y, z]} rotation={[tilt, 0, 0]}>
      <meshBasicMaterial vertexColors transparent opacity={opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
    </mesh>
  );
}
export function Aurora() {
  return (
    <group>
      <AuroraRibbon y={170} z={-380} color="#4cf0a0" opacity={0.55} speed={0.22} phase={0} height={90} />
      <AuroraRibbon y={190} z={-340} x={-60} color="#3fd8d0" opacity={0.4} speed={0.3} phase={2.1} height={70} width={440} />
      <AuroraRibbon y={205} z={-410} x={80} color="#7d6cf2" opacity={0.32} speed={0.18} phase={4.4} height={70} width={420} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE HORIZON — jagged peaks on a far snowfield.
// ---------------------------------------------------------------------------
export function DistantPeaks() {
  const geos = useMemo(() => [buildPeak(1), buildPeak(2), buildPeak(3)], []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-peak", roughness: 0.95, flat: true }), []);
  return (
    <group>
      {SNOW_PEAKS.map(([x, z, s, h], i) => (
        <mesh key={i} geometry={geos[i % 3]} material={mat} position={[x, -6, z]} scale={[s, h, s]} rotation={[0, i * 1.9, 0]} />
      ))}
      {/* The far snowfield the peaks stand on (under the modelled terrain). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <circleGeometry args={[720, 48]} />
        <meshStandardMaterial color="#e9eff8" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// CHIMNEY SMOKE — soft puffs rising + drifting from every chimney.
// ---------------------------------------------------------------------------
export function ChimneySmoke() {
  const emitters = useMemo(() => {
    const ly = terrainHeight(SNOW_LODGE.x, SNOW_LODGE.z);
    return [[SNOW_LODGE.x + LODGE_CHIMNEY[0], ly + 11.9, SNOW_LODGE.z + LODGE_CHIMNEY[1]], ...cabinChimneys()];
  }, []);
  const PER = 7;
  const ref = useRef();
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.6, 1), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    let i = 0;
    emitters.forEach(([x, y, z], e) => {
      const far = Math.hypot(playerState.x - x, playerState.z - z) > 150;
      for (let k = 0; k < PER; k++) {
        const life = 7;
        const u = ((t + e * 1.3 + (k / PER) * life) % life) / life;
        const s = far ? 0.0001 : (0.45 + u * 1.9) * (u > 0.8 ? (1 - u) / 0.2 : 1) * (u < 0.06 ? u / 0.06 : 1);
        tmp.position.set(x + u * 3.2 + Math.sin(u * 6 + e) * 0.4, y + u * 6.5, z + u * 1.2 + Math.cos(u * 5 + k) * 0.3);
        tmp.scale.setScalar(s);
        tmp.rotation.set(u * 2, k, 0);
        tmp.updateMatrix();
        m.setMatrixAt(i++, tmp.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, emitters.length * PER]} frustumCulled={false}>
      <meshStandardMaterial color="#dfe3ea" transparent opacity={0.42} depthWrite={false} roughness={1} />
    </instancedMesh>
  );
}
