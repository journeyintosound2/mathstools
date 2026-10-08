import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  MAGMA_BOULDERS, MAGMA_DEAD_TREES, MAGMA_LANTERNS, TRAIL_TORCHES, VOLCANO,
  trailPoint, trailRadius, trailHeight, TRAIL_END, magmaGroundHeight, MAGMA_WELCOME_SIGN, LAVA_Y,
  CRATER_GATE, magmaSlideAt, volcanoSurface, isOnTrail,
} from "../../data/magma/magmaLayout.js";
import {
  PLAZA_BRAZIERS, BRIDGE_BRAZIERS, BASALT_COLUMNS, OBSIDIAN_CLUSTERS, GEYSERS,
  MUD_POTS, FORGE, LAKE_OBELISK, LAVA_FALLS, CINDER_CONES, DRAGON, FIRE_FLOWERS,
  EMBER_TREES, CRATER_LIP_STONES, CRATER_GATE_PILLARS, SUMMIT_BEACON,
} from "../../data/magma/magmaProps.js";
import { Brazier } from "./MagmaBridges.jsx";
import { makeLavaFlowMaterial, getMagmaTextures } from "./magmaMaterials.js";

/**
 * MAGMA SET-PIECES — the dressing that gives each part of the world its own
 * character: boulders + charred trees + lanterns everywhere, torches up the
 * summit trail, the sealed crater gate, and one landmark set-piece per
 * reserved clearing (Basalt Columns, Obsidian Grove, Geyser Flats, Ember
 * Forge, the Lava Lake obelisk + lava falls, Cinder Cones, Dragon Bones,
 * the Fire Flower Garden). Repeated props are INSTANCED.
 */

const g0 = (x, z) => magmaGroundHeight(x, z);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/** Instanced mesh from a list of { p:[x,y,z], r:[x,y,z], s:[x,y,z]|number, c? }. */
function Instanced({ geometry, material, items, castShadow = true, receiveShadow = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((it, i) => {
      _p.set(it.p[0], it.p[1], it.p[2]);
      _e.set(...(it.r || [0, 0, 0]));
      _q.setFromEuler(_e);
      const s = it.s === undefined ? 1 : it.s;
      if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.set(s, s, s);
      _m.compose(_p, _q, _s);
      m.setMatrixAt(i, _m);
      if (it.c) m.setColorAt(i, _c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
}

const STD = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true, ...opts });

// ---------------------------------------------------------------------------
// World-wide scatter: boulders, charred trees, ring-road lanterns.
// ---------------------------------------------------------------------------
// While a challenge runs, scatter props standing in its camera corridor are
// shrunk to nothing (the instance count stays fixed) — `hide(x, z)`.
const HIDDEN = 0.0001;

export function Boulders({ hide }) {
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const mat = useMemo(() => STD({ color: "#ffffff" }), []);
  const items = useMemo(() => MAGMA_BOULDERS.map(([x, z, s, r]) => {
    const rad = 0.55 + s * 1.15;
    const off = hide && hide(x, z);
    return {
      p: [x, g0(x, z) + rad * 0.35, z],
      r: [r * 3, r * 6.2, r * 1.7],
      s: off ? HIDDEN : [rad, rad * (0.7 + r * 0.35), rad * (0.85 + s * 0.2)],
      c: ["#3b3331", "#4a3f3b", "#332b29", "#55463f"][Math.floor(r * 4) % 4],
    };
  }), [hide]);
  return <Instanced geometry={geo} material={mat} items={items} receiveShadow />;
}

function deadTreeGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.12, 0.26, 3.2, 6);
  trunk.translate(0, 1.6, 0);
  parts.push(trunk);
  const branch = (len, y, rz, ry) => {
    const b = new THREE.CylinderGeometry(0.05, 0.11, len, 5);
    b.translate(0, len / 2, 0);
    b.rotateZ(rz);
    b.rotateY(ry);
    b.translate(0, y, 0);
    parts.push(b);
  };
  branch(1.5, 2.2, 0.9, 0.3);
  branch(1.2, 2.6, -0.8, 1.9);
  branch(1.0, 1.7, 0.7, 3.6);
  branch(0.8, 2.95, -0.5, 4.8);
  return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}
export function DeadTrees({ hide }) {
  const geo = useMemo(deadTreeGeometry, []);
  const mat = useMemo(() => STD({ color: "#1f1817" }), []);
  const items = useMemo(() => MAGMA_DEAD_TREES.map(([x, z, s, r]) => ({
    p: [x, g0(x, z) - 0.1, z], r: [0.05 * (s - 0.5), r * 6.28, 0.06 * (r - 0.5)], s: hide && hide(x, z) ? HIDDEN : 0.8 + s * 0.7,
  })), [hide]);
  return <Instanced geometry={geo} material={mat} items={items} />;
}

export function Lanterns({ hide }) {
  const post = useMemo(() => {
    const a = new THREE.CylinderGeometry(0.07, 0.1, 2.0, 6); a.translate(0, 1.0, 0);
    const arm = new THREE.BoxGeometry(0.5, 0.07, 0.07); arm.translate(0.22, 1.95, 0);
    return mergeGeometries([a.toNonIndexed(), arm.toNonIndexed()]);
  }, []);
  const head = useMemo(() => { const h = new THREE.OctahedronGeometry(0.2, 0); h.translate(0.42, 1.68, 0); return h; }, []);
  const postMat = useMemo(() => STD({ color: "#2b2422", metalness: 0.4, roughness: 0.6 }), []);
  const headMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffa040", toneMapped: false }), []);
  const items = useMemo(() => MAGMA_LANTERNS.map(([x, z]) => ({ p: [x, g0(x, z), z], r: [0, Math.atan2(z, -x) + Math.PI, 0], s: hide && hide(x, z) ? HIDDEN : 1 })), [hide]);
  return (
    <group>
      <Instanced geometry={post} material={postMat} items={items} />
      <Instanced geometry={head} material={headMat} items={items} castShadow={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// The volcano: trail torches, rim boulders, crater lip, sealed rune gate,
// summit beacon, lava streams down the flank.
// ---------------------------------------------------------------------------
export function TrailTorches() {
  const bracket = useMemo(() => { const b = new THREE.BoxGeometry(0.16, 0.9, 0.16); b.translate(0, 0.45, 0); return b; }, []);
  const flame = useMemo(() => { const f = new THREE.ConeGeometry(0.17, 0.5, 6); f.translate(0, 1.15, 0); return f; }, []);
  const bMat = useMemo(() => STD({ color: "#2a2120", metalness: 0.3 }), []);
  const fMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff8a2a", toneMapped: false }), []);
  const items = useMemo(() => TRAIL_TORCHES.map((t) => {
    const [x, z] = trailPoint(t.phi, -VOLCANO.pathW / 2 + 0.35);
    return { p: [x, t.y + 0.9, z] };
  }), []);
  return (
    <group>
      <Instanced geometry={bracket} material={bMat} items={items} />
      <Instanced geometry={flame} material={fMat} items={items} castShadow={false} />
    </group>
  );
}

export function SummitDressing() {
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const mat = useMemo(() => STD({ color: "#ffffff" }), []);
  // Rim kerb boulders round the summit's outer edge — except where the trail
  // arrives (the collision kerb has the same gap).
  const rim = useMemo(() => {
    const out = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = VOLCANO.rRim - 0.35;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      if (isOnTrail(x, z) || isOnTrail(x * 0.97, z * 0.97)) continue; // the trail's arrival gap
      out.push({ p: [x, VOLCANO.height + 0.18, z], r: [i, i * 2.1, i * 0.7], s: [0.55, 0.42 + (i % 3) * 0.1, 0.5], c: i % 2 ? "#3a2f2c" : "#2c2422" });
    }
    return out;
  }, []);
  const lip = useMemo(() => CRATER_LIP_STONES.map((s) => ({
    p: [s.c[0], VOLCANO.height + 0.55, s.c[1]], r: [s.rot, s.rot * 2, s.rot * 0.5], s: [s.s, s.s * 0.9, s.s], c: "#2a201e",
  })), []);
  // Boulders bedded along the foot of the trail's inner wall, and rock
  // outcrops scattered over the bare flank (break up the big smooth faces).
  const wallRocks = useMemo(() => {
    const out = [];
    for (let phi = 0.9, i = 0; phi < TRAIL_END - 0.2; phi += 2.6 / trailRadius(phi), i++) {
      if (i % 3 === 1) continue;
      const [x, z] = trailPoint(phi, -VOLCANO.pathW / 2 - 0.15);
      const s = 0.45 + ((i * 37) % 10) / 22;
      out.push({ p: [x, trailHeight(phi) + s * 0.35, z], r: [i, i * 1.7, i * 0.4], s: [s, s * 0.8, s], c: i % 2 ? "#3a302c" : "#4a3c35" });
    }
    return out;
  }, []);
  const flankRocks = useMemo(() => {
    const out = [];
    for (let i = 0; i < 220; i++) {
      const a = i * 2.39996;
      const r = VOLCANO.rRim + 2 + ((i * 0.618034) % 1) * (VOLCANO.rBase - VOLCANO.rRim - 4);
      const x = r * Math.cos(a), z = r * Math.sin(a);
      const k = (r + 0.7) / r, k2 = (r - 0.7) / r;
      if (i % 3 === 0 || !magmaSlideAt(x, z) || !magmaSlideAt(x * k, z * k) || !magmaSlideAt(x * k2, z * k2)) continue;
      const s = 0.3 + ((i * 13) % 9) / 18;
      out.push({ p: [x, volcanoSurface(r, a, true) + s * 0.2, z], r: [i * 0.3, i, i * 0.7], s: [s * 1.2, s * 0.7, s], c: i % 3 ? "#2e2624" : "#3e322d" });
    }
    return out;
  }, []);
  return (
    <group>
      <Instanced geometry={geo} material={mat} items={rim} />
      <Instanced geometry={geo} material={mat} items={lip} />
      <Instanced geometry={geo} material={mat} items={wallRocks} receiveShadow />
      <Instanced geometry={geo} material={mat} items={flankRocks} />
      <CraterGate />
      <Brazier position={SUMMIT_BEACON} y={VOLCANO.height} scale={1.6} />
    </group>
  );
}

/** The sealed rune gate on the crater lip — the "not yet" door. */
function CraterGate() {
  const seal = useRef();
  useFrame((state) => {
    if (!seal.current) return;
    const t = state.clock.elapsedTime;
    seal.current.rotation.z = t * 0.25;
    seal.current.children.forEach((c, i) => { if (c.material) c.material.opacity = 0.55 + 0.35 * Math.sin(t * 2 + i); });
  });
  const [gx, gz] = CRATER_GATE.position;
  const yaw = Math.atan2(gx, gz); // local +z faces OUT, away from the crater
  const y = VOLCANO.height;
  return (
    <group position={[gx, y, gz]} rotation={[0, yaw, 0]}>
      {[-2.1, 2.1].map((sx) => (
        <mesh key={sx} position={[sx, 2.0, 0]} castShadow>
          <boxGeometry args={[0.9, 4.2, 0.9]} />
          <meshStandardMaterial color="#2a2120" flatShading roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 4.35, 0]} castShadow>
        <boxGeometry args={[5.4, 0.7, 1.1]} />
        <meshStandardMaterial color="#332826" flatShading roughness={0.9} />
      </mesh>
      {/* The rune seal: a glowing disc + spinning rune ring + a cross bar. */}
      <mesh position={[0, 2.1, 0.05]}>
        <circleGeometry args={[1.55, 32]} />
        <meshStandardMaterial color="#2a0c08" emissive="#a0200a" emissiveIntensity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <group ref={seal} position={[0, 2.1, 0.1]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.12, 0.42, 0.02]} />
              <meshBasicMaterial color="#ffb347" toneMapped={false} transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
        <mesh>
          <torusGeometry args={[0.7, 0.05, 6, 24]} />
          <meshBasicMaterial color="#ff7a2a" toneMapped={false} transparent opacity={0.8} />
        </mesh>
      </group>
      {[[-1, 1], [1, 1]].map(([sx], i) => (
        <mesh key={`bar${i}`} position={[0, 2.1, 0.2]} rotation={[0, 0, sx * 0.785]}>
          <boxGeometry args={[3.4, 0.2, 0.12]} />
          <meshStandardMaterial color="#3a2e2a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Glowing lava streams down the bare flank (they slip under the trail). */
const STREAM_ANGLES = [22, 140, 205, 318];
export function VolcanoStreams() {
  const mat = useMemo(() => makeLavaFlowMaterial({ speed: 0.7 }), []);
  const geo = useMemo(() => {
    const pos = [], flow = [], idx = [];
    STREAM_ANGLES.forEach((deg, si) => {
      const a0 = (deg * Math.PI) / 180;
      let base = -1, along = 0;
      for (let r = VOLCANO.rRim + 2 + (si % 2) * 3; r <= VOLCANO.rBase - 1.5; r += 0.3) {
        const a = a0 + Math.sin(r * 0.23 + si) * 0.05 + Math.sin(r * 0.71 + si * 2) * 0.012;
        const x = r * Math.cos(a), z = r * Math.sin(a);
        const tx = -Math.sin(a), tz = Math.cos(a);
        const hw = 0.6 + Math.min(0.6, (r - VOLCANO.rRim - 2) * 0.025);
        const L = [x + tx * hw, z + tz * hw], R = [x - tx * hw, z - tz * hw];
        // Only on bare flank, clear of the trail edges.
        const ok = magmaSlideAt(x, z) && magmaSlideAt(L[0], L[1]) && magmaSlideAt(R[0], R[1]) &&
          magmaSlideAt(x * (r + 0.6) / r, z * (r + 0.6) / r) && magmaSlideAt(x * (r - 0.6) / r, z * (r - 0.6) / r);
        if (!ok) { base = -1; continue; }
        const yl = volcanoSurface(Math.hypot(L[0], L[1]), Math.atan2(L[1], L[0]), true) + 0.12;
        const yr = volcanoSurface(Math.hypot(R[0], R[1]), Math.atan2(R[1], R[0]), true) + 0.12;
        along += 0.3;
        const vi = pos.length / 3;
        pos.push(L[0], yl, L[1], R[0], yr, R[1]);
        flow.push(0, along, 1, along);
        if (base >= 0) idx.push(base, vi, base + 1, base + 1, vi, vi + 1);
        base = vi;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
    g.setIndex(idx);
    return g;
  }, []);
  return <mesh geometry={geo} material={mat} />;
}

// ---------------------------------------------------------------------------
// Spawn plaza: braziers + the welcome tablet; braziers at the main bridge.
// ---------------------------------------------------------------------------
export function PlazaDressing() {
  const [wx, wz] = MAGMA_WELCOME_SIGN.position;
  return (
    <group>
      {PLAZA_BRAZIERS.map((p, i) => <Brazier key={`pb${i}`} position={p} y={g0(p[0], p[1])} />)}
      {BRIDGE_BRAZIERS.map((p, i) => <Brazier key={`bb${i}`} position={p} y={g0(p[0], p[1])} scale={1.15} />)}
      <group position={[wx, 0, wz]} rotation={[0, MAGMA_WELCOME_SIGN.rotationY, 0]}>
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 1.8, 6]} />
            <meshStandardMaterial color="#2a2120" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 1.55, 0]} castShadow>
          <boxGeometry args={[2.9, 1.05, 0.22]} />
          <meshStandardMaterial color="#4a3a33" flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.55, 0.12]}>
          <boxGeometry args={[2.6, 0.08, 0.02]} />
          <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// BASALT COLUMNS
// ---------------------------------------------------------------------------
export function BasaltColumnsField() {
  const geo = useMemo(() => { const g = new THREE.CylinderGeometry(1, 1, 1, 6); g.translate(0, 0.5, 0); return g; }, []);
  const mat = useMemo(() => STD({ color: "#ffffff" }), []);
  const capGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.97, 0.97, 0.04, 6); return g; }, []);
  const capMat = useMemo(() => STD({ color: "#6a5e58" }), []);
  const items = useMemo(() => BASALT_COLUMNS.map((c, i) => ({
    p: [c.c[0], -0.2, c.c[1]], r: [0, (i * 0.7) % 1.05, 0], s: [c.r, c.h + 0.2, c.r], c: ["#3a3331", "#443b38", "#332c2a"][i % 3],
  })), []);
  const caps = useMemo(() => BASALT_COLUMNS.map((c, i) => ({ p: [c.c[0], c.h + 0.02, c.c[1]], r: [0, (i * 0.7) % 1.05, 0], s: [c.r, 1, c.r] })), []);
  return (
    <group>
      <Instanced geometry={geo} material={mat} items={items} receiveShadow />
      <Instanced geometry={capGeo} material={capMat} items={caps} castShadow={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// OBSIDIAN GROVE — black-glass spires, some with violet hearts.
// ---------------------------------------------------------------------------
export function ObsidianGrove({ hide }) {
  const geo = useMemo(() => { const g = new THREE.ConeGeometry(1, 1, 5); g.translate(0, 0.5, 0); return g; }, []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#15101a", metalness: 0.75, roughness: 0.12, flatShading: true }), []);
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: "#241830", emissive: "#5a2a96", emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.18, flatShading: true }), []);
  const { a, b } = useMemo(() => {
    const A = [], B = [];
    OBSIDIAN_CLUSTERS.forEach((cl) => cl.spires.forEach((s) => {
      // Spires in a running challenge's camera corridor shrink away.
      const off = hide && hide(cl.c[0], cl.c[1]);
      const it = { p: [cl.c[0] + s.dx, g0(cl.c[0], cl.c[1]) - 0.1, cl.c[1] + s.dz], r: [s.tx, s.dx * 2, s.tz], s: off ? HIDDEN : [s.r, s.h, s.r] };
      (s.glow ? B : A).push(it);
    }));
    return { a: A, b: B };
  }, [hide]);
  return (
    <group>
      <Instanced geometry={geo} material={dark} items={a} />
      <Instanced geometry={geo} material={glow} items={b} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GEYSER FLATS — vents that erupt on a cycle + bubbling mud pots.
// ---------------------------------------------------------------------------
function Geyser({ g }) {
  const tex = getMagmaTextures().puff;
  const puffs = useRef([]);
  const column = useRef();
  const y0 = g0(g.c[0], g.c[1]);
  useFrame((state) => {
    const t = state.clock.elapsedTime + g.phase;
    const cyc = (t % g.period) / g.period; // 0..1
    const erupt = cyc < 0.28 ? Math.sin((cyc / 0.28) * Math.PI) : 0;
    if (column.current) {
      column.current.scale.set(1, 0.05 + erupt * 7, 1);
      column.current.material.opacity = erupt * 0.55;
      column.current.visible = erupt > 0.01;
    }
    puffs.current.forEach((s, i) => {
      if (!s) return;
      const a = ((t * 0.35 + i / puffs.current.length) % 1);
      const lift = a * (2.5 + erupt * 7);
      s.position.set(g.c[0] + Math.sin(i * 2.1 + t * 0.3) * 0.4 * a, y0 + 0.3 + lift, g.c[1] + Math.cos(i * 1.7) * 0.4 * a);
      const sc = 0.8 + a * (1.8 + erupt * 2.5);
      s.scale.set(sc, sc, 1);
      s.material.opacity = (1 - a) * (0.18 + erupt * 0.5);
    });
  });
  return (
    <group>
      <mesh position={[g.c[0], y0 + 0.12, g.c[1]]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[g.r, 0.32, 6, 12]} />
        <meshStandardMaterial color="#6a5a4a" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[g.c[0], y0 + 0.05, g.c[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[g.r, 12]} />
        <meshStandardMaterial color="#c9b98a" emissive="#5a4a20" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={column} position={[g.c[0], y0, g.c[1]]}>
        <cylinderGeometry args={[g.r * 0.35, g.r * 0.6, 1, 10, 1, true]} />
        <meshBasicMaterial color="#f4f1ea" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {tex && Array.from({ length: 7 }).map((_, i) => (
        <sprite key={i} ref={(el) => (puffs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#f2eee8" />
        </sprite>
      ))}
    </group>
  );
}
function MudPot({ c }) {
  const bubbles = useRef([]);
  const y0 = g0(c[0], c[1]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bubbles.current.forEach((b, i) => {
      if (!b) return;
      const a = ((t * 0.7 + i * 0.37) % 1);
      const s = Math.sin(a * Math.PI) * 0.22;
      b.scale.set(s, s, s);
    });
  });
  return (
    <group position={[c[0], y0, c[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[1.3, 14]} />
        <meshStandardMaterial color="#5b4636" roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.25, 1.75, 14]} />
        <meshStandardMaterial color="#8a7a62" flatShading />
      </mesh>
      {[[0.3, 0.2], [-0.4, -0.3], [0.1, -0.5]].map(([x, z], i) => (
        <mesh key={i} ref={(el) => (bubbles.current[i] = el)} position={[x, 0.05, z]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#6b5442" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
export function GeyserFlats() {
  return (
    <group>
      {GEYSERS.map((g) => <Geyser key={g.id} g={g} />)}
      {MUD_POTS.map((c, i) => <MudPot key={i} c={c} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// EMBER FORGE — an open-fronted stone smithy with a glowing furnace.
// ---------------------------------------------------------------------------
export function EmberForge() {
  const { center, yaw, w, d, h } = FORGE;
  const glow = useRef();
  const smoke = useRef([]);
  const tex = getMagmaTextures().puff;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (glow.current) glow.current.emissiveIntensity = 1.4 + Math.sin(t * 6) * 0.25 + Math.sin(t * 13) * 0.15;
    smoke.current.forEach((s, i) => {
      if (!s) return;
      const a = ((t * 0.18 + i / 5) % 1);
      s.position.set(Math.sin(t * 0.4 + i) * 0.4 + a * 1.2, h + 2.2 + a * 7, -d / 2 + 0.9 - a * 0.6);
      const sc = 1 + a * 3;
      s.scale.set(sc, sc, 1);
      s.material.opacity = (1 - a) * 0.45;
    });
  });
  const stone = "#4a3d37", slate = "#2a2324";
  return (
    <group>
      <group position={[center[0], g0(center[0], center[1]), center[1]]} rotation={[0, yaw, 0]}>
        {/* Back + side walls (open at the front, local +z). */}
        <mesh position={[0, h / 2, -d / 2]} castShadow receiveShadow><boxGeometry args={[w, h, 0.6]} /><meshStandardMaterial color={stone} flatShading /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * w) / 2, h / 2, -0.3]} castShadow receiveShadow><boxGeometry args={[0.6, h, d - 0.6]} /><meshStandardMaterial color={stone} flatShading /></mesh>
        ))}
        {/* Slate roof sloping toward the front + front beam on posts. */}
        <mesh position={[0, h + 0.35, -0.2]} rotation={[0.22, 0, 0]} castShadow><boxGeometry args={[w + 0.8, 0.3, d + 0.9]} /><meshStandardMaterial color={slate} flatShading /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={`p${s}`} position={[s * (w / 2 - 0.3), h / 2, d / 2 - 0.1]} castShadow><boxGeometry args={[0.35, h, 0.35]} /><meshStandardMaterial color="#3a2a20" flatShading /></mesh>
        ))}
        {/* Chimney + smoke. */}
        <mesh position={[1.6, h + 1.5, -d / 2 + 0.6]} castShadow><boxGeometry args={[1.1, 3.2, 1.1]} /><meshStandardMaterial color="#3d322d" flatShading /></mesh>
        <group position={[1.6, 0, 0]}>
          {tex && Array.from({ length: 5 }).map((_, i) => (
            <sprite key={i} ref={(el) => (smoke.current[i] = el)}>
              <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#3a3534" />
            </sprite>
          ))}
        </group>
        {/* Furnace with a glowing mouth. */}
        <mesh position={[0, 1.0, -d / 2 + 1.2]} castShadow><boxGeometry args={[2.4, 2.0, 1.6]} /><meshStandardMaterial color="#3a2e29" flatShading /></mesh>
        <mesh position={[0, 0.9, -d / 2 + 2.01]}>
          <planeGeometry args={[1.2, 0.8]} />
          <meshStandardMaterial ref={glow} color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {/* Tool rack on the back wall. */}
        {[-2.4, -2.0, -1.6].map((x, i) => (
          <mesh key={`t${i}`} position={[x, 1.7, -d / 2 + 0.36]}><boxGeometry args={[0.08, 1.0 + i * 0.15, 0.06]} /><meshStandardMaterial color="#5a5552" metalness={0.6} roughness={0.4} /></mesh>
        ))}
      </group>
      {/* Anvil on a stump. */}
      <group position={[FORGE.anvil[0], g0(...FORGE.anvil), FORGE.anvil[1]]} rotation={[0, yaw + 0.4, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[0.45, 0.5, 0.7, 8]} /><meshStandardMaterial color="#4a3020" flatShading /></mesh>
        <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[1.0, 0.3, 0.45]} /><meshStandardMaterial color="#3d3b3b" metalness={0.7} roughness={0.35} /></mesh>
        <mesh position={[0.62, 0.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><coneGeometry args={[0.16, 0.4, 6]} /><meshStandardMaterial color="#3d3b3b" metalness={0.7} roughness={0.35} /></mesh>
        <mesh position={[-0.1, 1.04, 0]}><boxGeometry args={[0.5, 0.06, 0.12]} /><meshStandardMaterial color="#ff7a2a" emissive="#ff4a00" emissiveIntensity={1.2} /></mesh>
      </group>
      {/* Quench trough. */}
      <group position={[FORGE.quench[0], g0(...FORGE.quench), FORGE.quench[1]]} rotation={[0, yaw, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[1.6, 0.7, 0.8]} /><meshStandardMaterial color="#4a3d37" flatShading /></mesh>
        <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.4, 0.6]} /><meshStandardMaterial color="#1b2630" roughness={0.1} metalness={0.3} /></mesh>
      </group>
      {FORGE.barrels.map((p, i) => (
        <mesh key={`br${i}`} position={[p[0], g0(p[0], p[1]) + 0.5, p[1]]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 1.0, 10]} />
          <meshStandardMaterial color={i % 2 ? "#5a3a22" : "#6b4428"} />
        </mesh>
      ))}
      {FORGE.oreCarts.map((p, i) => (
        <group key={`oc${i}`} position={[p[0], g0(p[0], p[1]), p[1]]} rotation={[0, yaw + 1.2, 0]}>
          <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[1.5, 0.7, 1.0]} /><meshStandardMaterial color="#4a3a2e" flatShading /></mesh>
          {[[-0.5, 0.55], [0.5, 0.55], [-0.5, -0.55], [0.5, -0.55]].map(([x, z], k) => (
            <mesh key={k} position={[x, 0.28, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.12, 10]} /><meshStandardMaterial color="#2a2524" metalness={0.5} /></mesh>
          ))}
          {[[-0.3, 0.1], [0.25, -0.15], [0.05, 0.25]].map(([x, z], k) => (
            <mesh key={`o${k}`} position={[x, 1.1, z]} rotation={[k, k * 2, 0]}><dodecahedronGeometry args={[0.25, 0]} /><meshStandardMaterial color="#ff8a3a" emissive="#ff5a10" emissiveIntensity={0.8} flatShading /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// LAVA LAKE — the islet obelisk + the lava-falls cliff.
// ---------------------------------------------------------------------------
export function LakeSetPiece({ hideObelisk = false }) {
  const runes = useRef();
  useFrame((state) => {
    if (runes.current) runes.current.material.opacity = 0.6 + 0.35 * Math.sin(state.clock.elapsedTime * 1.6);
  });
  const [ox, oz] = LAKE_OBELISK.c;
  const oy = g0(ox, oz);
  const F = LAVA_FALLS;
  const flowMat = useMemo(() => makeLavaFlowMaterial({ speed: 1.6 }), []);
  const cliff = useMemo(() => {
    // Jagged faceted rock buttresses (stretched dodecahedra) forming a
    // cliff wall behind the lake, tallest in the middle where the falls pour.
    const out = [];
    let k = 0;
    for (let z = F.z1 - 3; z <= F.z2 + 3; z += 1.9) {
      for (let row = 0; row < 3; row++) {
        const mid = 1 - Math.abs(z) / (F.z2 + 4);
        const h = F.height * (0.45 + 0.55 * mid) * (1 - row * 0.12) * (0.85 + 0.15 * Math.sin(z * 1.7 + row));
        out.push({
          p: [F.x - 2.0 - row * 2.6, h * 0.42 - 1.2, z + (row % 2) * 0.9],
          s: [2.1 + row * 0.4, h * 0.62, 1.7],
          r: [0.08 * Math.sin(k), k * 1.37, 0.1 * Math.cos(k * 0.7)],
          c: ["#3a2f2b", "#2e2523", "#45372f"][k % 3],
        });
        k++;
      }
    }
    return out;
  }, [F]);
  const boxGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const rockMat = useMemo(() => STD({ color: "#ffffff" }), []);
  // Each fall: a ribbon from the cliff lip, down the face, out onto the lake.
  const fallGeo = useMemo(() => {
    const pos = [], flow = [], idx = [];
    F.falls.forEach((fl) => {
      const N = 18;
      const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = F.x - 1.2 + t * 2.4 + Math.pow(t, 3) * 1.2;
        const top = F.height * 0.68;
        const y = top - (top - LAVA_Y) * Math.pow(t, 1.15);
        pos.push(x, y, fl.z - fl.w / 2, x, y, fl.z + fl.w / 2);
        flow.push(0, t * 9, 1, t * 9);
        if (i > 0) { const a = base + (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 2));
    g.setIndex(idx);
    return g;
  }, [F]);
  return (
    <group>
      {/* Obelisk with glowing rune bands (it steps aside while the Lava
          Channels challenge is filmed across the islet). */}
      <group position={[ox, oy, oz]} visible={!hideObelisk}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[2.0, 0.6, 2.0]} /><meshStandardMaterial color="#2a2120" flatShading /></mesh>
        <mesh position={[0, LAKE_OBELISK.h / 2 + 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.62, LAKE_OBELISK.h, 4]} />
          <meshStandardMaterial color="#1a1416" metalness={0.6} roughness={0.25} flatShading />
        </mesh>
        <mesh position={[0, LAKE_OBELISK.h + 1.15, 0]} castShadow>
          <coneGeometry args={[0.42, 0.9, 4]} />
          <meshStandardMaterial color="#ff7a2a" emissive="#ff4a00" emissiveIntensity={1.3} />
        </mesh>
        <mesh ref={runes} position={[0, LAKE_OBELISK.h / 2 + 0.4, 0]}>
          <cylinderGeometry args={[0.52, 0.56, LAKE_OBELISK.h * 0.75, 4, 6, true]} />
          <meshBasicMaterial color="#ff8a3a" wireframe transparent opacity={0.8} toneMapped={false} />
        </mesh>
      </group>
      {/* The cliff + falls. */}
      <Instanced geometry={boxGeo} material={rockMat} items={cliff} receiveShadow />
      <mesh geometry={fallGeo} material={flowMat} />
      {F.falls.map((fl, i) => (
        <mesh key={i} position={[F.x + 2.6, LAVA_Y + 0.05, fl.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[fl.w * 0.9, 16]} />
          <meshBasicMaterial color="#ffd27a" toneMapped={false} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CINDER CONES — little steep cones, each with a glowing vent and smoke.
// ---------------------------------------------------------------------------
export function CinderCones() {
  const tex = getMagmaTextures().puff;
  const puffs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    puffs.current.forEach((s, i) => {
      if (!s) return;
      const cc = CINDER_CONES[i % CINDER_CONES.length];
      const k = Math.floor(i / CINDER_CONES.length);
      const a = ((t * 0.12 + k / 3 + i * 0.13) % 1);
      s.position.set(cc.c[0] + a * 1.5, cc.h + 0.4 + a * 6, cc.c[1] - a * 0.8);
      const sc = 0.8 + a * 3;
      s.scale.set(sc, sc, 1);
      s.material.opacity = (1 - a) * 0.4;
    });
  });
  return (
    <group>
      {CINDER_CONES.map((cc, i) => (
        <group key={i} position={[cc.c[0], g0(cc.c[0], cc.c[1]) - 0.2, cc.c[1]]}>
          <mesh position={[0, cc.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[cc.r * 0.28, cc.r, cc.h, 11, 3, true]} />
            <meshStandardMaterial color={i % 2 ? "#4a2a22" : "#3a2420"} flatShading roughness={1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, cc.h - 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[cc.r * 0.26, 11]} />
            <meshBasicMaterial color="#ff6a1a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {tex && Array.from({ length: CINDER_CONES.length * 3 }).map((_, i) => (
        <sprite key={i} ref={(el) => (puffs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#55504e" />
        </sprite>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// DRAGON BONES — a fossil ribcage arching over the path.
// ---------------------------------------------------------------------------
/** One curved rib: bulges out from the foot, curls in under the spine. */
const _ribCache = new Map();
function ribGeo(span, height, side) {
  const key = `${span.toFixed(2)}-${height.toFixed(2)}-${side}`;
  if (_ribCache.has(key)) return _ribCache.get(key);
  const pts = [
    [span, 0], [span * 1.08, height * 0.32], [span * 0.98, height * 0.62], [span * 0.62, height * 0.88], [0.45, height * 0.98],
  ].map(([x, y]) => new THREE.Vector3(x * side, y, 0));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.21, 6, false);
  _ribCache.set(key, g);
  return g;
}

export function DragonBones({ hideRibs = false }) {
  const bone = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e6d8bd", roughness: 0.8, flatShading: true }), []);
  const ribs = DRAGON.ribs;
  const [sx, sz] = DRAGON.spineStart, [ex, ez] = DRAGON.spineEnd;
  const spine = useMemo(() => {
    const out = [];
    const n = 15;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ p: [sx + (ex - sx) * t, 4.6 + Math.sin(t * Math.PI) * 1.4, sz + (ez - sz) * t], s: 0.42 + Math.sin(t * Math.PI) * 0.18 });
    }
    return out;
  }, [sx, sz, ex, ez]);
  const vGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const sk = DRAGON.skull;
  const skY = g0(sk.c[0], sk.c[1]);
  return (
    <group>
      {/* Ribs + spine + tail arch over the clearing; they step aside while
          Grow the Dragon puts its own skeletons there. */}
      <group visible={!hideRibs}>
      {ribs.map((rb, i) => (
        <group key={i} position={[rb.c[0], 0, rb.c[1]]} rotation={[0, DRAGON.yaw + Math.PI / 2, 0]}>
          {[1, -1].map((side) => (
            <mesh key={side} geometry={ribGeo(rb.span, rb.height, side)} material={bone} castShadow />
          ))}
        </group>
      ))}
      <Instanced geometry={vGeo} material={bone} items={spine} />
      <Instanced geometry={vGeo} material={bone} items={DRAGON.tail.map((p, i) => ({ p: [p[0], g0(p[0], p[1]) + 0.3, p[1]], s: 0.45 - i * 0.07, r: [i, i * 2, 0] }))} />
      </group>
      {/* The skull, resting on its jaw at the clearing's edge. */}
      <group position={[sk.c[0], skY, sk.c[1]]} rotation={[0, sk.yaw, 0]}>
        <mesh position={[0, 1.3, 0]} castShadow><boxGeometry args={[2.6, 2.2, 2.4]} /><primitive object={bone} attach="material" /></mesh>
        <mesh position={[0, 0.9, 2.1]} castShadow><boxGeometry args={[1.8, 1.2, 2.2]} /><primitive object={bone} attach="material" /></mesh>
        <mesh position={[0, 0.35, 1.7]} castShadow><boxGeometry args={[1.7, 0.4, 2.6]} /><primitive object={bone} attach="material" /></mesh>
        {[-0.65, 0.65].map((x) => (
          <mesh key={x} position={[x, 1.6, 1.21]}><circleGeometry args={[0.38, 8]} /><meshBasicMaterial color="#ff6a1a" toneMapped={false} /></mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`h${s}`} position={[s * 1.0, 2.6, -0.6]} rotation={[-0.9, 0, s * 0.35]} castShadow>
            <coneGeometry args={[0.28, 1.9, 6]} /><primitive object={bone} attach="material" />
          </mesh>
        ))}
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <mesh key={`t${x}`} position={[x, 0.42, 3.15]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.1, 0.35, 4]} /><primitive object={bone} attach="material" /></mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// FIRE FLOWER GARDEN — glowing flowers (instanced) + ember trees.
// ---------------------------------------------------------------------------
export function FireGarden() {
  const stem = useMemo(() => { const g = new THREE.CylinderGeometry(0.03, 0.04, 1, 4); g.translate(0, 0.5, 0); return g; }, []);
  const head = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const stemMat = useMemo(() => STD({ color: "#2f3a24" }), []);
  const heads = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: "#ff5a1a", emissive: "#ff3a00", emissiveIntensity: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: "#ffb02a", emissive: "#ff8a00", emissiveIntensity: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: "#ff2a4a", emissive: "#e0102a", emissiveIntensity: 0.8, flatShading: true }),
  ], []);
  const stems = useMemo(() => FIRE_FLOWERS.map((f) => ({ p: [f.c[0], g0(f.c[0], f.c[1]), f.c[1]], s: [1.5, f.h, 1.5], r: [0.1 * Math.sin(f.rot), 0, 0.1 * Math.cos(f.rot)] })), []);
  const byHue = useMemo(() => [0, 1, 2].map((hu) => FIRE_FLOWERS.filter((f) => f.hue === hu).map((f) => ({
    p: [f.c[0], g0(f.c[0], f.c[1]) + f.h, f.c[1]], s: [0.26, 0.19, 0.26], r: [0, f.rot, 0],
  }))), []);
  const trunk = useMemo(deadTreeGeometry, []);
  const trunkMat = useMemo(() => STD({ color: "#1d1514" }), []);
  const leafGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 0), []);
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ff6a1a", emissive: "#ff4400", emissiveIntensity: 0.8, flatShading: true }), []);
  const leaves = useMemo(() => EMBER_TREES.flatMap(([x, z], i) => [
    [0.9, 2.9, 0.4], [-0.8, 3.2, 0.5], [0.2, 3.7, -0.6], [-0.3, 2.5, -0.9], [0.7, 3.4, -0.4],
  ].map(([dx, dy, dz], k) => ({ p: [x + dx * 1.3, g0(x, z) + dy * 1.3, z + dz * 1.3], s: 0.8 + ((i + k) % 3) * 0.25, r: [k, i, 0] }))), []);
  const treeItems = useMemo(() => EMBER_TREES.map(([x, z], i) => ({ p: [x, g0(x, z), z], s: 1.3, r: [0, i * 2.2, 0] })), []);
  return (
    <group>
      <Instanced geometry={stem} material={stemMat} items={stems} castShadow={false} />
      {byHue.map((items, i) => <Instanced key={i} geometry={head} material={heads[i]} items={items} castShadow={false} />)}
      <Instanced geometry={trunk} material={trunkMat} items={treeItems} />
      <Instanced geometry={leafGeo} material={leafMat} items={leaves} />
    </group>
  );
}
