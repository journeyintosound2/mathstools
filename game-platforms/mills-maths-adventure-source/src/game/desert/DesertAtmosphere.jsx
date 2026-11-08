import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import { terrainHeight, outsideRim, quicksandAt } from "../../data/desert/desertTerrain.js";
import { DESERT_BOUNDARY, OASIS_POOL, DUNE_SEA, MESAS } from "../../data/desert/desertLayout.js";
import { getDesertTextures } from "./desertMaterials.js";
import { buildTumbleweed } from "./desertGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";

/**
 * DESERT ATMOSPHERE — the hot early-afternoon SUN that follows the player
 * (so shadows work across the big desert), a blazing sun disc in the sky,
 * SAND blown along the ground by the wind, DUST DEVILS wandering the flats,
 * TUMBLEWEEDS bouncing past on the breeze, VULTURES circling high over the
 * dunes + mesas and BUTTERFLIES round the oasis.
 */
// The sun sits high in the south-west; light comes in from there.
export const SUN_DIR = new THREE.Vector3(-30, 52, 26).normalize();
const SUN_OFFSET = SUN_DIR.clone().multiplyScalar(80);
const WIND = new THREE.Vector2(0.94, -0.34).normalize();

export function DesertLighting({ highGfx }) {
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
        color="#fff0d2"
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

/** A blazing sun disc low in the sky toward the light (follows the camera). */
export function SunDisc() {
  const g = useRef();
  const tex = getDesertTextures().glow;
  useFrame(({ camera }) => {
    if (g.current) g.current.position.copy(camera.position).addScaledVector(SUN_DIR, 520);
  });
  return (
    <group ref={g}>
      <sprite scale={[120, 120, 1]}>
        <spriteMaterial map={tex} color="#fff3cf" transparent opacity={0.85} depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
      <sprite scale={[36, 36, 1]}>
        <spriteMaterial map={tex} color="#ffffff" transparent opacity={1} depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

/** Sand blown along the ground round the player (streaks low over the sand). */
export function BlowingSand({ count = 380, radius = 30 }) {
  const tex = getDesertTextures().dust;
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2 * radius, z: (Math.random() - 0.5) * 2 * radius, y: Math.random() * 1.4,
    sp: 3 + Math.random() * 4, ph: Math.random() * 6.28,
  })), [count, radius]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state, dt) => {
    const a = geo.attributes.position;
    const px = playerState.x, pz = playerState.z;
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      s.x += WIND.x * s.sp * dt;
      s.z += WIND.y * s.sp * dt;
      // Wrap round the player.
      if (s.x > radius) s.x -= radius * 2; else if (s.x < -radius) s.x += radius * 2;
      if (s.z > radius) s.z -= radius * 2; else if (s.z < -radius) s.z += radius * 2;
      const x = px + s.x, z = pz + s.z;
      const gy = outsideRim(x, z) > 0 ? -999 : terrainHeight(x, z);
      a.setXYZ(i, x, gy + 0.08 + s.y * (0.5 + 0.5 * Math.sin(t * 1.3 + s.ph)), z);
    });
    a.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.55} sizeAttenuation transparent opacity={0.55} depthWrite={false} color="#f0d4a2" />
    </points>
  );
}

/** Dust devils: little whirlwinds of sand wandering the open desert. */
const DEVIL_PATHS = [
  { c: [-40, 60], r: 26, sp: 0.05 }, { c: [70, -30], r: 30, sp: -0.04 }, { c: [-70, -10], r: 22, sp: 0.06 }, { c: [40, 70], r: 24, sp: -0.05 },
];
export function DustDevils({ high = true }) {
  const tex = getDesertTextures().dust;
  const N = high ? 70 : 36;
  const devils = useMemo(() => DEVIL_PATHS.map((p) => ({ ...p, parts: Array.from({ length: N }, () => ({ h: Math.random(), a: Math.random() * 6.28, sp: 2 + Math.random() * 2 })) })), [N]);
  const geos = useMemo(() => devils.map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }), [devils, N]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    devils.forEach((d, k) => {
      const a = t * d.sp + k * 1.7;
      const cx = d.c[0] + Math.cos(a) * d.r + Math.sin(a * 2.3) * 4, cz = d.c[1] + Math.sin(a) * d.r;
      const gy = terrainHeight(cx, cz);
      const pos = geos[k].attributes.position;
      d.parts.forEach((p, i) => {
        p.a += p.sp * dt * 2.5;
        p.h += dt * 0.12;
        if (p.h > 1) p.h -= 1;
        const H = 7.5, R = 0.35 + p.h * 1.6;
        pos.setXYZ(i, cx + Math.cos(p.a) * R, gy + p.h * H, cz + Math.sin(p.a) * R);
      });
      pos.needsUpdate = true;
    });
  });
  return (
    <group>
      {geos.map((g, i) => (
        <points key={i} geometry={g} frustumCulled={false}>
          <pointsMaterial map={tex} size={1.3} sizeAttenuation transparent opacity={0.6} depthWrite={false} color="#e8c896" />
        </points>
      ))}
    </group>
  );
}

/** Tumbleweeds rolling + bouncing downwind past the player (they respawn upwind). */
export function RollingTumbleweeds({ count = 6 }) {
  const geo = useMemo(() => buildTumbleweed(21), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "d-tumble-roll" }), []);
  const refs = useRef([]);
  const st = useMemo(() => Array.from({ length: count }, () => ({ x: 0, z: 0, life: 0, sp: 3 + Math.random() * 2, s: 0.7 + Math.random() * 0.5, bounce: Math.random() * 6 })), [count]);
  useFrame((state, dt) => {
    st.forEach((w, i) => {
      const m = refs.current[i];
      if (!m) return;
      w.life -= dt;
      if (w.life <= 0) {
        // Respawn upwind of the player, off to one side, somewhere along the wind.
        const side = (Math.random() - 0.5) * 50, back = 20 + Math.random() * 30;
        w.x = playerState.x - WIND.x * back - WIND.y * side;
        w.z = playerState.z - WIND.y * back + WIND.x * side;
        w.life = 14 + Math.random() * 8;
      }
      w.x += WIND.x * w.sp * dt;
      w.z += WIND.y * w.sp * dt;
      const q = quicksandAt(w.x, w.z);
      if (outsideRim(w.x, w.z) > -4 || (q && q.sdf < 0)) { m.visible = false; return; }
      w.bounce += dt * w.sp * 1.6;
      const hop = Math.abs(Math.sin(w.bounce)) * 0.7 * w.s;
      m.visible = true;
      m.position.set(w.x, terrainHeight(w.x, w.z) + hop - 0.05, w.z);
      m.rotation.z -= dt * w.sp * 1.3;
      m.rotation.y = Math.atan2(WIND.x, WIND.y) + Math.PI / 2;
      m.scale.setScalar(w.s);
    });
  });
  return (
    <group>
      {st.map((_, i) => <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={geo} material={mat} castShadow visible={false} />)}
    </group>
  );
}

/** Vultures circling high over the dunes and the mesas (big, slow, gliding). */
export function Vultures() {
  const flocks = useMemo(() => [
    { c: DUNE_SEA.c, r: 34, y: 52, n: 3, sp: 0.045 },
    { c: MESAS[0].c, r: 26, y: 46, n: 2, sp: -0.05 },
    { c: [0, -40], r: 44, y: 66, n: 2, sp: 0.035 },
  ], []);
  const birds = useMemo(() => flocks.flatMap((f, fi) => Array.from({ length: f.n }, (_, k) => ({ f, k, ph: k * 2.1 + fi }))), [flocks]);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    birds.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * b.f.sp + b.ph;
      g.position.set(b.f.c[0] + Math.cos(a) * (b.f.r + b.k * 5), b.f.y + Math.sin(t * 0.5 + b.k) * 3, b.f.c[1] + Math.sin(a) * (b.f.r + b.k * 5));
      g.rotation.y = -a + (b.f.sp > 0 ? Math.PI : 0);
      g.rotation.z = (b.f.sp > 0 ? 1 : -1) * 0.25;
      const flap = Math.sin(t * 2.4 + b.k * 3) * 0.12;
      g.children[0].rotation.z = 0.08 + flap;
      g.children[1].rotation.z = -0.08 - flap;
    });
  });
  return (
    <group>
      {birds.map((b, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          {[1, -1].map((side) => (
            <group key={side}>
              <mesh position={[side * 1.3, 0, 0]}><boxGeometry args={[2.6, 0.06, 0.7]} /><meshBasicMaterial color="#2b2420" /></mesh>
            </group>
          ))}
          <mesh position={[0, 0, 0.3]}><boxGeometry args={[0.35, 0.25, 1.2]} /><meshBasicMaterial color="#2b2420" /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Butterflies fluttering round the oasis. */
const WING = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.22, 0, 0.12, 0.2, 0, -0.14], 3));
  g.setIndex([0, 1, 2]);
  g.computeVertexNormals();
  return g;
})();
export function OasisButterflies({ count = 14 }) {
  const flies = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return {
      home: [OASIS_POOL.c[0] + Math.cos(a) * (OASIS_POOL.rx + 3), OASIS_POOL.c[1] + Math.sin(a) * (OASIS_POOL.rz + 3)],
      ph: Math.random() * 6.28, sp: 0.35 + Math.random() * 0.3, col: ["#ffb43a", "#4ac6ff", "#ff6fae", "#fff36a"][i % 4],
    };
  }), [count]);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flies.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * f.sp + f.ph;
      const x = f.home[0] + Math.sin(a) * 2.5, z = f.home[1] + Math.cos(a * 0.8) * 2.5;
      g.position.set(x, terrainHeight(x, z) + 1.1 + Math.sin(a * 3.1) * 0.35, z);
      g.rotation.y = -a * 0.8 + Math.PI / 2;
      const flap = Math.sin(t * 18 + f.ph) * 1.1;
      g.children[0].rotation.x = flap;
      g.children[1].rotation.x = -flap;
    });
  });
  return (
    <group>
      {flies.map((f, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh geometry={WING}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
          <mesh geometry={WING} scale={[1, 1, -1]}><meshStandardMaterial color={f.col} side={THREE.DoubleSide} emissive={f.col} emissiveIntensity={0.25} /></mesh>
        </group>
      ))}
    </group>
  );
}
export { DESERT_BOUNDARY };
