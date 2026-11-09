import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { playerState } from "../sessionStore.js";
import {
  TORCHES, BRAZIERS, LAMPS, SAND_POOLS, SAND_EDGE, CELL, QT_HALL, sandAt,
} from "../../data/qtemple/qtempleWorld.js";
import { makeQuicksandMaterial } from "../desert/desertMaterials.js";
import { getQtTextures, qtMat } from "./qtMaterials.js";
import { mat } from "./qtKit.jsx";

/**
 * THE QUOTIENT TEMPLE's AIR + FIRE — the lighting (a warm low key + a small
 * POOL of point lights that always sits on the torches, braziers + lamps
 * nearest you, so the rooms you're in glow without paying for 40 lights),
 * the flickering flames, the lanterns, dust drifting in the window light,
 * the two SINKING SAND pools (the desert's swirling quicksand shader) with
 * sand pouring into them from cracks in the ceiling, and the court's well
 * of daylight.
 */

// Every fire in the temple: { p: [x, y, z], kind, power }.
function torchFlamePos([x, z, y, yaw]) {
  return [x + Math.sin(yaw) * 0.32, y + 0.22, z + Math.cos(yaw) * 0.32];
}
export const FIRES = [
  ...TORCHES.map((t) => ({ p: torchFlamePos(t), kind: "torch" })),
  ...BRAZIERS.map((b) => ({ p: [b.p[0], b.y + 1.95, b.p[1]], kind: "brazier" })),
  ...LAMPS.map(([x, z, y]) => ({ p: [x, y, z], kind: "lamp" })),
];
const POWER = { torch: { i: 9, d: 11 }, brazier: { i: 22, d: 18 }, lamp: { i: 8, d: 10 } };

/** The light pool: `n` warm point lights hop to the fires nearest you. */
function LightPool({ n }) {
  const lights = useRef([]);
  const slots = useRef(Array.from({ length: n }, () => ({ src: -1, want: -1, k: 0 })));
  const tick = useRef(0);
  useFrame((state, dt) => {
    tick.current -= dt;
    const px = playerState.x, py = playerState.y || 0, pz = playerState.z;
    if (tick.current <= 0) {
      tick.current = 0.35;
      // The n nearest fires (height counts double — other floors stay dark).
      const ranked = FIRES.map((f, i) => ({ i, d: Math.hypot(f.p[0] - px, (f.p[1] - py) * 2, f.p[2] - pz) }))
        .sort((a, b) => a.d - b.d).slice(0, n).map((r) => r.i);
      const taken = new Set(slots.current.map((s) => s.want).filter((w) => ranked.includes(w)));
      const free = ranked.filter((r) => !taken.has(r));
      for (const s of slots.current) if (!ranked.includes(s.want)) s.want = free.shift() ?? -1;
    }
    const t = state.clock.elapsedTime;
    slots.current.forEach((s, i) => {
      const L = lights.current[i];
      if (!L) return;
      // Fade out → move → fade in.
      if (s.src !== s.want) {
        s.k = Math.max(0, s.k - dt * 4);
        if (s.k === 0) {
          s.src = s.want;
          if (s.src >= 0) { const f = FIRES[s.src]; L.position.set(f.p[0], f.p[1] + 0.3, f.p[2]); L.distance = POWER[f.kind].d; }
        }
      } else if (s.src >= 0) s.k = Math.min(1, s.k + dt * 3);
      const f = s.src >= 0 ? FIRES[s.src] : null;
      const flick = 0.86 + 0.14 * Math.sin(t * 9.1 + i * 2.3) * Math.sin(t * 5.3 + i);
      L.intensity = f ? POWER[f.kind].i * s.k * flick : 0;
    });
  });
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <pointLight key={i} ref={(el) => { lights.current[i] = el; }} color="#ffb060" intensity={0} distance={12} decay={1.6} />
      ))}
    </>
  );
}

export function QtLighting({ highGfx }) {
  return (
    <>
      {/* A soft warm key from "above the windows" (no shadows — it's indoors). */}
      <directionalLight position={[30, 60, 20]} intensity={highGfx ? 0.35 : 0.5} color="#ffe2b8" />
      <directionalLight position={[-40, 20, -30]} intensity={0.18} color="#9fb8ff" />
      <LightPool n={highGfx ? 6 : 3} />
    </>
  );
}

/** Every flame + its glow halo, flickering. */
export function Flames() {
  const refs = useRef([]);
  const flameM = useMemo(() => qtMat("#ffcf7a", { emissive: "#ff9a2a", ei: 2.6, rough: 1, toneMapped: false }), []);
  const coreM = useMemo(() => qtMat("#fff3c4", { emissive: "#fff0b0", ei: 3, rough: 1, toneMapped: false }), []);
  const glowM = useMemo(() => new THREE.SpriteMaterial({ map: getQtTextures().glow, color: "#ffb35a", transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  const lanternM = useMemo(() => qtMat("#ffe0a0", { emissive: "#ffc060", ei: 1.8, toneMapped: false }), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const s = 1 + 0.16 * Math.sin(t * 11 + i * 1.7) + 0.1 * Math.sin(t * 17.3 + i * 0.6);
      g.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      g.rotation.y = t * 0.8 + i;
    });
  });
  return (
    <group>
      {FIRES.map((f, i) => {
        const big = f.kind === "brazier" ? 2.1 : 1;
        if (f.kind === "lamp") {
          return (
            <group key={i} position={f.p}>
              <mesh material={lanternM}><cylinderGeometry args={[0.28, 0.22, 0.6, 8]} /></mesh>
              <mesh position={[0, 0.38, 0]} material={mat("iron")}><coneGeometry args={[0.36, 0.3, 8]} /></mesh>
              <sprite material={glowM} scale={[2.6, 2.6, 1]} />
            </group>
          );
        }
        return (
          <group key={i} position={f.p}>
            <group ref={(el) => { refs.current[i] = el; }} scale={big}>
              <mesh position={[0, 0.22 * big, 0]} material={flameM}><coneGeometry args={[0.17 * big, 0.62 * big, 7]} /></mesh>
              <mesh position={[0, 0.14 * big, 0]} material={coreM}><coneGeometry args={[0.08 * big, 0.3 * big, 6]} /></mesh>
            </group>
            <sprite material={glowM} position={[0, 0.3 * big, 0]} scale={[1.9 * big, 1.9 * big, 1]} />
          </group>
        );
      })}
    </group>
  );
}

/** Dust drifting through the Great Hall's light (and down the Descent). */
export function DustMotes({ count = 260 }) {
  const ref = useRef();
  const { geo, base } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const base = [];
    let k = 7;
    const R = () => { k = (k * 16807) % 2147483647; return k / 2147483647; };
    for (let i = 0; i < count; i++) {
      const inHall = i < count * 0.8;
      const x = inHall ? (R() - 0.5) * 50 : (R() - 0.5) * 16;
      const z = inHall ? -28 + R() * 60 : 38 + R() * 34;
      const y = inHall ? QT_HALL + 1 + R() * 22 : -14 + R() * 18;
      base.push([x, y, z, R() * 6.28]);
      pos.set([x, y, z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, base };
  }, [count]);
  const m = useMemo(() => new THREE.PointsMaterial({ color: "#ffe6b0", size: 0.09, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = geo.attributes.position;
    for (let i = 0; i < base.length; i++) {
      const [x, y, z, ph] = base[i];
      a.setXYZ(i, x + Math.sin(t * 0.15 + ph) * 0.8, y + Math.sin(t * 0.11 + ph * 2) * 0.6, z + Math.cos(t * 0.13 + ph) * 0.8);
    }
    a.needsUpdate = true;
  });
  return <points ref={ref} geometry={geo} material={m} frustumCulled={false} />;
}

/** A swirling sinking-sand disc for each pool (the desert's quicksand shader). */
function poolGeometry(p) {
  const ANG = 64, RINGS = 10;
  const R = p.r + 0.35;
  const pos = [], loc = [], dep = [], idx = [];
  for (let j = 0; j <= RINGS; j++) {
    const r = (R * j) / RINGS;
    for (let a = 0; a <= ANG; a++) {
      const ang = (a / ANG) * Math.PI * 2;
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      pos.push(p.c[0] + x, 0, p.c[1] + z);
      loc.push(x, z);
      dep.push(Math.max(0, p.r - r));
    }
  }
  const row = ANG + 1;
  for (let j = 0; j < RINGS; j++) for (let a = 0; a < ANG; a++) {
    const i0 = j * row + a, i1 = i0 + 1, i2 = i0 + row, i3 = i2 + 1;
    idx.push(i0, i1, i2, i1, i3, i2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aLocal", new THREE.Float32BufferAttribute(loc, 2));
  g.setAttribute("aDepth", new THREE.Float32BufferAttribute(dep, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function SandPools() {
  const m = useMemo(() => makeQuicksandMaterial(), []);
  const geos = useMemo(() => SAND_POOLS.map((p) => poolGeometry(p)), []);
  const ring = useRef();
  const st = useRef({ on: 0, t: 0 });
  // The sand pouring in from the ceiling.
  const fallM = useMemo(() => {
    const t = getQtTextures().sandfall.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 2);
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: "#fff0d0", fog: true });
  }, []);
  const puffM = useMemo(() => new THREE.MeshBasicMaterial({ color: "#e2c28a", transparent: true, opacity: 0.35, depthWrite: false }), []);
  const falls = useMemo(() => [
    { c: [SAND_POOLS[0].c[0] + 1.2, SAND_POOLS[0].c[1] - 0.8], y0: SAND_POOLS[0].floor, y1: CELL.pit.ceil, r: 0.55 },
    { c: [SAND_POOLS[1].c[0], SAND_POOLS[1].c[1]], y0: SAND_POOLS[1].floor, y1: CELL.court.ceil, r: 0.4 },
  ], []);
  useFrame((state, dt) => {
    fallM.map.offset.y = (state.clock.elapsedTime * 1.4) % 1;
    // A slow ring where you're wading.
    const s = sandAt(playerState.x, playerState.z);
    const inSand = Boolean(s && (playerState.y || 0) < s.pool.floor + 0.2);
    const k = st.current;
    k.on += ((inSand ? 1 : 0) - k.on) * Math.min(1, dt * 5);
    k.t += dt;
    if (ring.current) {
      ring.current.visible = k.on > 0.02;
      if (s && inSand) ring.current.position.set(playerState.x, s.pool.floor + 0.06, playerState.z);
      const sc = 0.8 + ((k.t * 0.9) % 1) * 1.1;
      ring.current.scale.set(sc, sc, sc);
      ring.current.material.opacity = k.on * (1 - ((k.t * 0.9) % 1)) * 0.55;
    }
  });
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} material={m} position={[0, SAND_POOLS[i].floor + 0.025, 0]} receiveShadow renderOrder={1} />)}
      {falls.map((f, i) => (
        <group key={i}>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r) => (
            <mesh key={r} position={[f.c[0], (f.y0 + f.y1) / 2, f.c[1]]} rotation={[0, r, 0]} material={fallM}>
              <planeGeometry args={[f.r * 2.4, f.y1 - f.y0]} />
            </mesh>
          ))}
          {/* A puff where it lands. */}
          <mesh position={[f.c[0], f.y0 + 0.3, f.c[1]]} material={puffM} scale={[1, 0.45, 1]}>
            <sphereGeometry args={[f.r * 2.2, 12, 8]} />
          </mesh>
          {/* The crack it pours from. */}
          <mesh position={[f.c[0], f.y1 - 0.02, f.c[1]]} rotation={[Math.PI / 2, 0, 0]} material={mat("#1a120a")}>
            <circleGeometry args={[f.r * 1.8, 10]} />
          </mesh>
        </group>
      ))}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.5, 0.62, 28]} />
        <meshBasicMaterial color="#5a3a1a" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
export { SAND_EDGE };

/** The court's well of daylight: a bright disc in the ceiling + its shaft. */
export function LightWell() {
  const c = CELL.court;
  const shaftM = useMemo(() => new THREE.MeshBasicMaterial({ map: getQtTextures().shaft, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: "#fff0c8", toneMapped: false, fog: false }), []);
  const skyM = useMemo(() => qtMat("#ffffff", { emissive: "#fff6dc", ei: 2.5, toneMapped: false }), []);
  const floorY = -14; // lands on the middle terrace
  const h = c.ceil - floorY;
  return (
    <group>
      <mesh position={[64, c.ceil - 0.02, -56]} rotation={[Math.PI / 2, 0, 0]} material={skyM}><circleGeometry args={[4.1, 32]} /></mesh>
      <group position={[64, (c.ceil + floorY) / 2, -56]}>
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((r) => (
          <mesh key={r} rotation={[0, r, 0]} material={shaftM} renderOrder={5}><planeGeometry args={[8, h]} /></mesh>
        ))}
      </group>
      <pointLight position={[64, floorY + 6, -56]} intensity={30} distance={26} decay={1.4} color="#fff0d0" />
    </group>
  );
}
