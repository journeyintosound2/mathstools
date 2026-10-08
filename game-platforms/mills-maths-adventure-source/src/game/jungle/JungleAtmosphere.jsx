import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { jungleClock, makeSunbeamMaterial, getJungleTextures } from "./jungleMaterials.js";
import { terrainHeight, JUNGLE_SPOTS, LAGOON, TEMPLE_ANCHOR } from "../../data/jungle/jungleLayout.js";
import { getJungleProps, REDWOOD_HOLLOW } from "../../data/jungle/jungleProps.js";

/**
 * JUNGLE ATMOSPHERE — the clock, the warm late-morning SUN that follows the
 * player (so shadows work across the big map), SUNBEAMS slanting through the
 * canopy (Redwood Hollow, the temple, the palm grove), drifting POLLEN in the
 * light, FIREFLIES round the lagoon + mushroom glade, BUTTERFLIES over the
 * flowers, BIRDS wheeling high overhead and LEAVES drifting down in the hollow.
 */

/** Ticks the shared jungle clock (wind, water, beams). */
export function JungleClock() {
  useFrame((state) => { jungleClock.uTime.value = state.clock.elapsedTime; });
  return null;
}

// The sun sits high in the south-east; light comes in from there.
export const SUN_DIR = new THREE.Vector3(26, 46, 18).normalize();
const SUN_OFFSET = SUN_DIR.clone().multiplyScalar(70);

export function JungleLighting({ highGfx }) {
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
        intensity={1.75}
        color="#fff1d2"
        castShadow
        shadow-mapSize={highGfx ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={190}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SUNBEAMS — soft additive shafts tilted along the sun's direction, each one
// turned to face the camera round its own axis.
// ---------------------------------------------------------------------------
const BEAM_AREAS = [
  { c: REDWOOD_HOLLOW.center, r: 26, n: 16, len: 34, w: [2.5, 5] },
  { c: TEMPLE_ANCHOR.c, r: 16, n: 6, len: 24, w: [2, 4], dx: 10 },
  { c: [-25, 101], r: 14, n: 5, len: 20, w: [1.8, 3.2] },
  { c: [33, 4], r: 12, n: 4, len: 26, w: [2, 3.5] },
  { c: [-44, 29], r: 12, n: 5, len: 18, w: [1.5, 3] },
];
export function Sunbeams() {
  const { camera } = useThree();
  const mat = useMemo(() => makeSunbeamMaterial(), []);
  const beams = useMemo(() => {
    const out = [];
    let s = 41;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (const A of BEAM_AREAS) {
      for (let i = 0; i < A.n; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * A.r;
        const x = A.c[0] + (A.dx || 0) + Math.cos(a) * d, z = A.c[1] + Math.sin(a) * d;
        out.push({ x, z, y: terrainHeight(x, z), len: A.len * (0.75 + r() * 0.5), w: A.w[0] + r() * (A.w[1] - A.w[0]), seed: r() });
      }
    }
    return out;
  }, []);
  const geos = useMemo(() => beams.map((b) => {
    const g = new THREE.PlaneGeometry(1, 1, 1, 1);
    g.translate(0, 0.5, 0); // base at the ground, grows up the sun direction
    g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(4).fill(b.seed), 1));
    return g;
  }), [beams]);
  const refs = useRef([]);
  const axis = SUN_DIR;
  const tmp = useMemo(() => ({ q: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(), n: new THREE.Vector3(), m: new THREE.Matrix4(), x: new THREE.Vector3() }), []);
  useFrame(() => {
    beams.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      // Basis: Y along the sun axis, Z toward the camera (projected ⟂ axis).
      tmp.v.set(camera.position.x - b.x, camera.position.y - b.y, camera.position.z - b.z);
      tmp.n.copy(tmp.v).addScaledVector(axis, -tmp.v.dot(axis)).normalize();
      tmp.x.crossVectors(axis, tmp.n).normalize();
      tmp.m.makeBasis(tmp.x, axis, tmp.n);
      m.quaternion.setFromRotationMatrix(tmp.m);
      m.position.set(b.x, b.y - 1, b.z);
      m.scale.set(b.w, b.len, 1);
    });
  });
  return (
    <group>
      {beams.map((b, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geos[i]} material={mat} renderOrder={6} frustumCulled={false} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Floating motes: pollen (warm, near the player) + fireflies (by the lagoon
// and in the mushroom glade). One points cloud each.
// ---------------------------------------------------------------------------
export function Pollen({ count = 260, radius = 26 }) {
  const tex = getJungleTextures().glow;
  const { camera } = useThree();
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2 * radius, y: Math.random() * 9, z: (Math.random() - 0.5) * 2 * radius,
    vy: 0.05 + Math.random() * 0.12, sw: Math.random() * 6.28,
  })), [count, radius]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const a = geo.attributes.position.array;
    const cx = camera.position.x * 0.5 + playerState.x * 0.5, cz = camera.position.z * 0.5 + playerState.z * 0.5;
    const cy = playerState.y || 0;
    seeds.forEach((s, i) => {
      s.y += s.vy * dt;
      if (s.y > 9) s.y = 0;
      let x = s.x + Math.sin(t * 0.3 + s.sw) * 1.2;
      let z = s.z + Math.cos(t * 0.25 + s.sw) * 1.2;
      x = ((x - cx + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cx;
      z = ((z - cz + radius) % (2 * radius) + 2 * radius) % (2 * radius) - radius + cz;
      a[i * 3] = x; a[i * 3 + 1] = cy - 0.5 + s.y; a[i * 3 + 2] = z;
    });
    geo.attributes.position.needsUpdate = true;
  });
  if (!tex) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.14} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} color="#fff2b0" />
    </points>
  );
}

export function Fireflies() {
  const tex = getJungleTextures().glow;
  const swarms = useMemo(() => [
    { c: [LAGOON.center[0] - 6, LAGOON.center[1] - 2], r: 18, n: 60 },
    { c: [-48, 28], r: 16, n: 70 },
    { c: [-62, -63], r: 22, n: 50 },
  ], []);
  const total = swarms.reduce((a, s) => a + s.n, 0);
  const seeds = useMemo(() => swarms.flatMap((s) => Array.from({ length: s.n }, () => {
    const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * s.r;
    const x = s.c[0] + Math.cos(a) * d, z = s.c[1] + Math.sin(a) * d;
    return { x, z, y: terrainHeight(x, z) + 0.4 + Math.random() * 2.2, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.6 };
  })), [swarms]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    return g;
  }, [total]);
  const mat = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = geo.attributes.position.array;
    seeds.forEach((s, i) => {
      a[i * 3] = s.x + Math.sin(t * s.sp + s.ph) * 1.4;
      a[i * 3 + 1] = s.y + Math.sin(t * s.sp * 1.7 + s.ph) * 0.5;
      a[i * 3 + 2] = s.z + Math.cos(t * s.sp * 0.8 + s.ph) * 1.4;
    });
    geo.attributes.position.needsUpdate = true;
    if (mat.current) mat.current.opacity = 0.65 + 0.3 * Math.sin(t * 2.1);
  });
  if (!tex) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial ref={mat} map={tex} size={0.32} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} color="#d9ff7a" toneMapped={false} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// BUTTERFLIES — little flapping pairs of wings meandering over the flowers.
// ---------------------------------------------------------------------------
const WING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.12, 0.2, 0.34, 0.18, 0.3, 0.02);
  s.bezierCurveTo(0.34, -0.12, 0.14, -0.2, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
})();
export function Butterflies({ count = 22 }) {
  const flowers = useMemo(() => getJungleProps().flowers, []);
  const flies = useMemo(() => {
    const out = [];
    const cols = ["#ffb43a", "#4ac6ff", "#ff6fae", "#fff36a", "#b88cff"];
    for (let i = 0; i < count && flowers.length; i++) {
      const f = flowers[(i * 37) % flowers.length];
      out.push({ home: [f.x, f.z], ph: Math.random() * 6.28, sp: 0.35 + Math.random() * 0.3, col: cols[i % cols.length] });
    }
    return out;
  }, [count, flowers]);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flies.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * f.sp + f.ph;
      const x = f.home[0] + Math.sin(a) * 3 + Math.sin(a * 2.3) * 1.2;
      const z = f.home[1] + Math.cos(a * 0.8) * 3;
      const y = terrainHeight(x, z) + 0.9 + Math.sin(a * 3.1) * 0.35 + 0.4;
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
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.9}>
          <mesh geometry={WING} rotation={[0, 0, 0]}>
            <meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} />
          </mesh>
          <mesh geometry={WING} scale={[1, 1, -1]}>
            <meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BIRDS wheeling high over the valley (simple flapping V shapes).
// ---------------------------------------------------------------------------
export function Birds() {
  const flocks = useMemo(() => [
    { c: [-20, 0], r: 70, y: 62, n: 6, sp: 0.06 },
    { c: [40, -80], r: 50, y: 70, n: 5, sp: -0.05 },
    { c: [-40, 90], r: 45, y: 55, n: 4, sp: 0.07 },
  ], []);
  const refs = useRef([]);
  const birds = useMemo(() => flocks.flatMap((f, fi) => Array.from({ length: f.n }, (_, k) => ({ f, k, ph: k * 0.11 + fi }))), [flocks]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    birds.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * b.f.sp + b.ph;
      g.position.set(b.f.c[0] + Math.cos(a) * (b.f.r + b.k * 2), b.f.y + Math.sin(t * 0.7 + b.k) * 2, b.f.c[1] + Math.sin(a) * (b.f.r + b.k * 2));
      g.rotation.y = -a + (b.f.sp > 0 ? Math.PI : 0);
      const flap = Math.sin(t * 7 + b.k) * 0.5;
      g.children[0].rotation.z = flap;
      g.children[1].rotation.z = -flap;
    });
  });
  return (
    <group>
      {birds.map((b, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          {[1, -1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.55, 0, 0]}>
                <boxGeometry args={[1.1, 0.04, 0.32]} />
                <meshBasicMaterial color="#2d3a3a" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// FALLING LEAVES in Redwood Hollow (High graphics).
// ---------------------------------------------------------------------------
export function FallingLeaves({ count = 70 }) {
  const ref = useRef();
  const leaves = useMemo(() => Array.from({ length: count }, () => ({
    x: REDWOOD_HOLLOW.center[0] + (Math.random() - 0.5) * 50, z: REDWOOD_HOLLOW.center[1] + (Math.random() - 0.5) * 50,
    ph: Math.random(), sp: 0.04 + Math.random() * 0.04, spin: Math.random() * 6,
  })), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    leaves.forEach((l, i) => {
      const a = (t * l.sp + l.ph) % 1;
      const g = terrainHeight(l.x, l.z);
      dummy.position.set(l.x + Math.sin(t * 0.9 + l.spin) * 1.5, g + 22 * (1 - a) + 0.1, l.z + Math.cos(t * 0.7 + l.spin) * 1.5);
      dummy.rotation.set(t * 1.3 + l.spin, t * 0.8, t * 1.1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={[0.22, 0.14]} />
      <meshStandardMaterial color="#b0652e" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export { JUNGLE_SPOTS };
