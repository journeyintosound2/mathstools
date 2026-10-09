import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { magmaClock } from "../magma/magmaMaterials.js";
import { buildCloud, buildCrab } from "./islandGeometry.js";
import { getIslandProps } from "../../data/island/islandProps.js";
import { terrainHeight, isOnSand, SEA_Y } from "../../data/island/islandTerrain.js";
import {
  COTTAGES, CRAB_BEACHES, SEAGULL_FLOCKS,
} from "../../data/island/islandLayout.js";

/**
 * ISLAND ATMOSPHERE — the bright tropical-morning SUN that follows the player
 * (shadows across the whole big island), slow-drifting CUMULUS clouds,
 * SEAGULLS wheeling over the beaches, BUTTERFLIES over the wildflowers,
 * CRABS scuttling sideways along the sand, DOLPHINS arcing out of the sea
 * off Sunny Cove, chimney SMOKE from the village, and far-off ISLANDS on the
 * hazy horizon. Also ticks the magma clock (Ember Peak's lava shader).
 */
export const ISLAND_SUN_DIR = new THREE.Vector3(30, 50, 38).normalize();
const SUN_OFFSET = ISLAND_SUN_DIR.clone().multiplyScalar(80);

/** Ticks the lava clock (the jungle clock is ticked by JungleClock). */
export function IslandClock() {
  useFrame((state) => { magmaClock.uTime.value = state.clock.elapsedTime; });
  return null;
}

export function IslandLighting({ highGfx }) {
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
        intensity={1.95}
        color="#fff3dc"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-52}
        shadow-camera-right={52}
        shadow-camera-top={52}
        shadow-camera-bottom={-52}
        shadow-camera-near={1}
        shadow-camera-far={210}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// CLOUDS — soft cumulus drifting slowly west → east (wrapping round).
// ---------------------------------------------------------------------------
const CLOUD_SPOTS = [
  [-120, 95, -160, 1.4], [40, 110, -210, 1.8], [170, 90, -90, 1.3], [-210, 105, 30, 1.6], [110, 85, 120, 1.2],
  [-60, 120, 210, 1.7], [230, 115, 170, 1.5], [-250, 95, -230, 1.9], [0, 130, -330, 2.3], [300, 100, -20, 1.6],
  [-320, 110, 140, 2.0], [80, 95, -60, 1.0],
];
export function Clouds() {
  const geos = useMemo(() => [buildCloud(1), buildCloud(2), buildCloud(3), buildCloud(4)], []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: new THREE.Color("#c9d9ec"), emissiveIntensity: 0.35, flatShading: false }), []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    CLOUD_SPOTS.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const span = 760;
      const x = ((c[0] + t * 1.6 + span / 2) % span + span) % span - span / 2;
      m.position.set(x, c[1], c[2]);
    });
  });
  return (
    <group>
      {CLOUD_SPOTS.map((c, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geos[i % 4]} material={mat} scale={[c[3], c[3] * 0.8, c[3]]} rotation={[0, i * 1.3, 0]} frustumCulled={false} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// SEAGULLS — white gulls gliding in lazy circles (the odd flap).
// ---------------------------------------------------------------------------
const GULL_WING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.08); s.lineTo(0.55, 0.12); s.lineTo(1.05, -0.02); s.lineTo(0.5, -0.1); s.lineTo(0, -0.08); s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
})();
export function Seagulls() {
  const gulls = useMemo(() => SEAGULL_FLOCKS.flatMap(([cx, cz], fi) => Array.from({ length: 4 }, (_, k) => ({
    c: [cx, cz], r: 14 + k * 4.5 + fi * 2, y: 17 + k * 2.4 + (fi % 2) * 5, sp: (0.16 + k * 0.025) * (fi % 2 ? -1 : 1), ph: k * 1.7 + fi,
  }))), []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gulls.forEach((g, i) => {
      const o = refs.current[i];
      if (!o) return;
      const far = Math.hypot(g.c[0] - playerState.x, g.c[1] - playerState.z) > 170;
      o.visible = !far;
      if (far) return;
      const a = t * g.sp + g.ph;
      o.position.set(g.c[0] + Math.cos(a) * g.r, g.y + Math.sin(t * 0.6 + g.ph) * 1.5, g.c[1] + Math.sin(a) * g.r);
      // Heading = the tangent of the circle; bank into the turn.
      o.rotation.set(0, -a + (g.sp > 0 ? Math.PI : 0), g.sp > 0 ? 0.28 : -0.28);
      // Glide most of the time, flap in bursts.
      const burst = Math.sin(t * 0.5 + g.ph * 2) > 0.55;
      const flap = burst ? Math.sin(t * 9 + g.ph) * 0.55 : 0.12 + Math.sin(t * 1.3 + g.ph) * 0.05;
      o.children[1].rotation.z = flap;
      o.children[2].rotation.z = -flap;
    });
  });
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8, side: THREE.DoubleSide }), []);
  const grey = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c3cbd4", roughness: 0.8, side: THREE.DoubleSide }), []);
  return (
    <group>
      {gulls.map((g, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.9}>
          <mesh material={white} scale={[0.22, 0.2, 0.62]}><sphereGeometry args={[1, 10, 6]} /></mesh>
          <group position={[0.12, 0.05, 0]}><mesh geometry={GULL_WING} material={grey} /></group>
          <group position={[-0.12, 0.05, 0]} scale={[-1, 1, 1]}><mesh geometry={GULL_WING} material={grey} /></group>
          <mesh position={[0, 0.06, 0.62]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.05, 0.2, 6]} /><meshStandardMaterial color="#f2b632" /></mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BUTTERFLIES over the wildflowers.
// ---------------------------------------------------------------------------
const BWING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.12, 0.2, 0.34, 0.18, 0.3, 0.02);
  s.bezierCurveTo(0.34, -0.12, 0.14, -0.2, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
})();
export function IslandButterflies({ count = 24 }) {
  const flies = useMemo(() => {
    const fl = getIslandProps().flowers;
    const cols = ["#ffb43a", "#f4f1e6", "#ff6fae", "#fff36a", "#7cc6ff", "#b48cff"];
    const out = [];
    for (let i = 0; i < Math.min(count, fl.length); i++) {
      const f = fl[Math.floor((i / count) * fl.length)];
      out.push({ home: [f.x, f.z], ph: i * 1.37, sp: 0.35 + ((i * 7) % 10) / 33, col: cols[i % cols.length] });
    }
    return out;
  }, [count]);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flies.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const far = Math.hypot(f.home[0] - playerState.x, f.home[1] - playerState.z) > 70;
      g.visible = !far;
      if (far) return;
      const a = t * f.sp + f.ph;
      const x = f.home[0] + Math.sin(a) * 2.6 + Math.sin(a * 2.3) * 1.1;
      const z = f.home[1] + Math.cos(a * 0.8) * 2.6;
      g.position.set(x, terrainHeight(x, z) + 0.9 + Math.sin(a * 3.1) * 0.35, z);
      g.rotation.y = -a * 0.8 + Math.PI / 2;
      const flap = Math.sin(t * 18 + f.ph) * 1.1;
      g.children[0].rotation.x = flap;
      g.children[1].rotation.x = -flap;
    });
  });
  return (
    <group>
      {flies.map((f, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.8}>
          <mesh geometry={BWING}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
          <mesh geometry={BWING} scale={[1, 1, -1]}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CRABS — scuttling sideways up and down the beaches, then pausing.
// ---------------------------------------------------------------------------
export function Crabs() {
  const crabs = useMemo(() => {
    const out = [];
    let s = 41;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (const [cx, cz, rad] of CRAB_BEACHES) {
      for (let k = 0; k < 5; k++) {
        // Find a sandy spot near the beach centre.
        for (let tries = 0; tries < 40; tries++) {
          const a = r() * Math.PI * 2, d = r() * rad;
          const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
          const y = terrainHeight(x, z);
          if (isOnSand(x, z) && y > SEA_Y + 0.05 && y < 1.6) { out.push({ x, z, ph: r() * 10, dir: r() * Math.PI * 2, sp: 0.5 + r() * 0.5 }); break; }
        }
      }
    }
    return out;
  }, []);
  const geo = useMemo(() => buildCrab(), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), []);
  const ref = useRef();
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    crabs.forEach((c, i) => {
      const near = Math.hypot(c.x - playerState.x, c.z - playerState.z) < 80;
      // Scuttle for 2 s, rest for 2 s, alternating direction.
      const cyc = (t * c.sp + c.ph) % 4;
      const leg = Math.floor((t * c.sp + c.ph) / 4);
      const side = leg % 2 ? 1 : -1;
      const u = Math.min(1, cyc / 2);
      const off = (side > 0 ? u : 1 - u) * 1.6 - 0.8;
      const sx = Math.cos(c.dir), sz = -Math.sin(c.dir);
      const x = c.x + sx * off, z = c.z + sz * off;
      tmp.position.set(x, terrainHeight(x, z) + (cyc < 2 ? Math.abs(Math.sin(t * 22 + i)) * 0.02 : 0), z);
      tmp.rotation.set(0, c.dir, 0);
      tmp.scale.setScalar(near ? 1 : 0.0001);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, crabs.length]} frustumCulled={false} castShadow />;
}

// ---------------------------------------------------------------------------
// DOLPHINS — a pair arcing out of the sea off Sunny Cove now and then.
// ---------------------------------------------------------------------------
function dolphinGeometry() {
  // A swept, tapered body along +z with a dorsal fin + tail flukes.
  const pts = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    const r = Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.32 + 0.02;
    pts.push(new THREE.Vector2(r, (t - 0.5) * 2.4));
  }
  const body = new THREE.LatheGeometry(pts, 12);
  body.rotateX(Math.PI / 2);
  body.scale(1, 0.85, 1);
  const fin = new THREE.ConeGeometry(0.1, 0.42, 4);
  fin.rotateX(-0.6);
  fin.translate(0, 0.38, 0.1);
  const fluke = new THREE.BoxGeometry(0.75, 0.04, 0.22);
  fluke.translate(0, 0, -1.22);
  const parts = [body, fin, fluke].map((g) => g.toNonIndexed());
  const n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3);
  let o = 0;
  for (const g of parts) { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.computeVertexNormals();
  return out;
}
const DOLPHIN_PATHS = [
  { c: [74, 92], dir: 0.6, period: 9, ph: 0 },
  { c: [76.5, 93.5], dir: 0.6, period: 9, ph: 0.35 },
  { c: [-34, 106], dir: -0.4, period: 11, ph: 4 },
];
export function Dolphins() {
  const geo = useMemo(dolphinGeometry, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7d93a8", roughness: 0.35, metalness: 0.1 }), []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    DOLPHIN_PATHS.forEach((d, i) => {
      const m = refs.current[i];
      if (!m) return;
      const u = ((t + d.ph) % d.period) / 1.8; // a leap lasts 1.8 s, then a long swim under
      if (u > 1 || Math.hypot(d.c[0] - playerState.x, d.c[1] - playerState.z) > 150) { m.visible = false; return; }
      m.visible = true;
      const s = (u - 0.5) * 7;
      const fx = Math.sin(d.dir), fz = Math.cos(d.dir);
      m.position.set(d.c[0] + fx * s, SEA_Y - 0.9 + Math.sin(Math.PI * u) * 2.3, d.c[1] + fz * s);
      m.rotation.set(-Math.cos(Math.PI * u) * 0.9, d.dir, 0);
    });
  });
  return (
    <group>
      {DOLPHIN_PATHS.map((_, i) => <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geo} material={mat} visible={false} castShadow />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CHIMNEY SMOKE — soft puffs from the village cottages.
// ---------------------------------------------------------------------------
function chimneys() {
  const out = COTTAGES.map((c) => {
    const lx = c.w / 2 - 1.1, lz = -c.d / 4;
    const cs = Math.cos(c.rotationY), sn = Math.sin(c.rotationY);
    const x = c.x + lx * cs + lz * sn, z = c.z - lx * sn + lz * cs;
    return [x, terrainHeight(c.x, c.z) + 3.2 + 2.1 + 1.45, z];
  });
  return out;
}
export function IslandSmoke() {
  const emitters = useMemo(chimneys, []);
  const PER = 6;
  const ref = useRef();
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 1), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    let i = 0;
    emitters.forEach(([x, y, z], e) => {
      const far = Math.hypot(playerState.x - x, playerState.z - z) > 140;
      for (let k = 0; k < PER; k++) {
        const life = 6.5;
        const u = ((t + e * 1.3 + (k / PER) * life) % life) / life;
        const s = far ? 0.0001 : (0.4 + u * 1.5) * (u > 0.8 ? (1 - u) / 0.2 : 1) * (u < 0.06 ? u / 0.06 : 1);
        tmp.position.set(x + u * 3.0 + Math.sin(u * 6 + e) * 0.3, y + u * 5.5, z + u * 1.4 + Math.cos(u * 5 + k) * 0.3);
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
      <meshStandardMaterial color="#eef0f2" transparent opacity={0.4} depthWrite={false} roughness={1} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// FAR ISLANDS on the hazy horizon (each a little different).
// ---------------------------------------------------------------------------
function farIslandGeometry(seed, peak) {
  const g = new THREE.CylinderGeometry(0.1, 1, 1, 24, 6);
  const p = g.attributes.position;
  const col = [];
  const c = new THREE.Color();
  let s = seed * 9301 + 49297;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const bumps = Array.from({ length: 5 }, () => [r() * Math.PI * 2, 0.15 + r() * 0.25]);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i) + 0.5, z = p.getZ(i);
    const a = Math.atan2(z, x);
    let w = 1;
    for (const [ba, bs] of bumps) w += Math.cos(a - ba) * bs * 0.4;
    // A soft dome (or a sharp peak).
    const rr = Math.hypot(x, z);
    const hgt = peak ? Math.pow(Math.max(0, 1 - rr), 1.6) : Math.sqrt(Math.max(0, 1 - rr * rr)) * 0.7;
    x *= w; z *= w;
    y = y > 0.99 ? hgt : Math.min(y, hgt);
    p.setXYZ(i, x, y, z);
    if (y < 0.06) c.set("#e8d7a0");
    else if (peak && y > 0.55) c.set("#8a8a86");
    else c.set(y < 0.18 ? "#6faa52" : "#4f8a42").lerp(new THREE.Color("#3f6f3a"), r() * 0.3);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
const FAR_ISLANDS = [
  { a: -2.2, d: 300, w: 46, h: 22, peak: true },
  { a: -1.6, d: 360, w: 30, h: 9 },
  { a: -0.8, d: 290, w: 38, h: 13 },
  { a: 0.1, d: 340, w: 60, h: 16 },
  { a: 0.9, d: 300, w: 26, h: 7 },
  { a: 1.45, d: 380, w: 52, h: 28, peak: true },
  { a: 2.2, d: 310, w: 34, h: 11 },
  { a: 2.9, d: 350, w: 44, h: 15 },
  { a: 3.6, d: 280, w: 22, h: 8 },
  { a: 4.3, d: 330, w: 40, h: 12 },
  { a: 5.0, d: 370, w: 58, h: 30, peak: true },
  { a: 5.7, d: 300, w: 28, h: 9 },
];
export function FarIslands() {
  const geos = useMemo(() => [farIslandGeometry(1, false), farIslandGeometry(2, false), farIslandGeometry(3, true), farIslandGeometry(4, true)], []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), []);
  return (
    <group>
      {FAR_ISLANDS.map((f, i) => (
        <mesh
          key={i}
          geometry={geos[(f.peak ? 2 : 0) + (i % 2)]}
          material={mat}
          position={[Math.cos(f.a) * f.d, SEA_Y - 0.6, Math.sin(f.a) * f.d]}
          scale={[f.w, f.h, f.w * 0.8]}
          rotation={[0, i * 1.7, 0]}
        />
      ))}
    </group>
  );
}
