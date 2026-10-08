import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { terrainHeight, FARM_CREEK } from "../../data/farm/farmTerrain.js";
import { getFarmProps } from "../../data/farm/farmProps.js";
import { FARM_FIELDS } from "../../data/farm/farmLayout.js";
import { getJungleTextures } from "../jungle/jungleMaterials.js";

/**
 * FARM ATMOSPHERE — the warm LATE-AFTERNOON sun that follows the player (so
 * shadows work across the whole big farm), butterflies over the wildflowers,
 * sunflowers + lavender, dragonflies darting along the creek, thistledown
 * drifting on the breeze, and a flock of birds wheeling high.
 */
export const FARM_SUN_DIR = new THREE.Vector3(-34, 40, 22).normalize();
const SUN_OFFSET = FARM_SUN_DIR.clone().multiplyScalar(72);

export function FarmLighting({ highGfx }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    // Snap to a 2 m grid so shadow texels don't swim while walking.
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
        intensity={1.85}
        color="#ffe2b0"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
    </>
  );
}

const WING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.12, 0.2, 0.34, 0.18, 0.3, 0.02);
  s.bezierCurveTo(0.34, -0.12, 0.14, -0.2, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
})();
export function FarmButterflies({ count = 26 }) {
  const homes = useMemo(() => {
    const P = getFarmProps();
    const out = [];
    const fl = P.flowers;
    for (let i = 0; i < Math.min(count - 8, fl.length); i++) out.push([fl[(i * 53) % fl.length].x, fl[(i * 53) % fl.length].z]);
    // Over the sunflowers + the lavender too.
    for (const f of FARM_FIELDS.filter((q) => q.kind === "sunflower" || q.kind === "lavender")) {
      for (let k = 0; k < 4; k++) out.push([f.c[0] + (k - 1.5) * f.rx * 0.4, f.c[1] + ((k % 2) - 0.5) * f.rz * 0.6]);
    }
    return out;
  }, [count]);
  const flies = useMemo(() => {
    const cols = ["#ffb43a", "#f4f1e6", "#ff6fae", "#fff36a", "#7cc6ff"];
    return homes.map((h, i) => ({ home: h, ph: i * 1.37, sp: 0.35 + ((i * 7) % 10) / 33, col: cols[i % cols.length] }));
  }, [homes]);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flies.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const far = Math.hypot(f.home[0] - playerState.x, f.home[1] - playerState.z) > 80;
      g.visible = !far;
      if (far) return;
      const a = t * f.sp + f.ph;
      const x = f.home[0] + Math.sin(a) * 3 + Math.sin(a * 2.3) * 1.2;
      const z = f.home[1] + Math.cos(a * 0.8) * 3;
      const y = terrainHeight(x, z) + 1.0 + Math.sin(a * 3.1) * 0.35;
      g.position.set(x, y, z);
      g.rotation.y = -a * 0.8 + Math.PI / 2;
      const flap = Math.sin(t * 18 + f.ph) * 1.1;
      g.children[0].rotation.x = flap;
      g.children[1].rotation.x = -flap;
    });
  });
  return (
    <group>
      {flies.map((f, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.85}>
          <mesh geometry={WING}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
          <mesh geometry={WING} scale={[1, 1, -1]}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Dragonflies darting low over the creek. */
export function Dragonflies({ count = 8 }) {
  const homes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const k = Math.floor(((i + 0.5) / count) * (FARM_CREEK.pts.length - 1));
    return { p: FARM_CREEK.pts[k], lvl: FARM_CREEK.lvl[k], ph: i * 2.1 };
  }), [count]);
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    homes.forEach((h, i) => {
      const g = refs.current[i];
      if (!g) return;
      const far = Math.hypot(h.p[0] - playerState.x, h.p[1] - playerState.z) > 60;
      g.visible = !far;
      if (far) return;
      // Dart, hover, dart.
      const seg = Math.floor((t + h.ph) / 1.6);
      const f = ((t + h.ph) % 1.6) / 1.6;
      const r = (s) => { const v = Math.sin(s * 91.7 + i * 13.3) * 43758.5; return v - Math.floor(v); };
      const ax = (r(seg) - 0.5) * 6, az = (r(seg + 0.5) - 0.5) * 6;
      const bx = (r(seg + 1) - 0.5) * 6, bz = (r(seg + 1.5) - 0.5) * 6;
      const e = f < 0.25 ? f / 0.25 : 1;
      const k = e * e * (3 - 2 * e);
      g.position.set(h.p[0] + ax + (bx - ax) * k, h.lvl + 0.6 + Math.sin(t * 3 + i) * 0.1, h.p[1] + az + (bz - az) * k);
      g.rotation.y = Math.atan2(bx - ax, bz - az);
      g.children[1].rotation.z = Math.sin(t * 60) * 0.4;
      g.children[2].rotation.z = -Math.sin(t * 60) * 0.4;
    });
  });
  return (
    <group>
      {homes.map((_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.012, 0.32, 5]} /><meshStandardMaterial color="#1f7fa0" emissive="#0c3a4a" emissiveIntensity={0.4} metalness={0.4} /></mesh>
          <mesh position={[0, 0.01, 0.05]}><boxGeometry args={[0.36, 0.005, 0.05]} /><meshStandardMaterial color="#d8f0ff" transparent opacity={0.6} /></mesh>
          <mesh position={[0, 0.01, -0.02]}><boxGeometry args={[0.32, 0.005, 0.045]} /><meshStandardMaterial color="#d8f0ff" transparent opacity={0.6} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Thistledown + seed fluff drifting on the breeze round the player. */
export function Thistledown({ count = 120, radius = 30 }) {
  const tex = getJungleTextures().glow;
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2 * radius, y: 0.5 + Math.random() * 7, z: (Math.random() - 0.5) * 2 * radius,
    sw: Math.random() * 6.28,
  })), [count, radius]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const a = geo.attributes.position.array;
    const cx = playerState.x, cz = playerState.z, cy = playerState.y || 0;
    seeds.forEach((s, i) => {
      s.x += dt * 0.9; s.z += dt * 0.35; // the breeze (west → east)
      s.y += Math.sin(t * 0.7 + s.sw) * dt * 0.15;
      let x = s.x + Math.sin(t * 0.5 + s.sw) * 0.8;
      let z = s.z + Math.cos(t * 0.4 + s.sw) * 0.8;
      x = ((x - cx + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cx;
      z = ((z - cz + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cz;
      a[i * 3] = x; a[i * 3 + 1] = cy + s.y; a[i * 3 + 2] = z;
    });
    geo.attributes.position.needsUpdate = true;
  });
  if (!tex) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.16} sizeAttenuation transparent opacity={0.75} depthWrite={false} color="#fffaf0" />
    </points>
  );
}
