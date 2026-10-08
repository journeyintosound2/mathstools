import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  LAKE_LEVEL, lakeEdgeDist, terrainHeight, slopeAt, FROZEN_RIVER, getSnowPads, getIcePatches, SNOW_CHUTE_PATHS, FLOE_TOP,
} from "../../data/snow/snowTerrain.js";
import { SNOW_LAKE, ICE_FLOES, FROZEN_FALLS } from "../../data/snow/snowLayout.js";
import { makeIceMaterial, makeLakeMaterial } from "./snowMaterials.js";
import { buildChuteRibbon } from "./SnowTerrain.jsx";
import { playerState } from "../sessionStore.js";

/**
 * SNOW WATER + ICE — the glacier lake (cold, rippling, foam at the shore,
 * slush chunks drifting), the floating ice floes, the glossy ice of the
 * frozen pond / river / puddles / chute floors, and the FROZEN WATERFALL
 * hanging off the escarpment.
 */

/** The lake surface: a grid over the lake at LAKE_LEVEL, only where it's wet. */
function buildLakeGeometry() {
  const L = SNOW_LAKE;
  const x0 = L.center[0] - L.rx - 8, x1 = L.center[0] + L.rx + 8;
  const z0 = L.center[1] - L.rz - 8, z1 = L.center[1] + L.rz + 8;
  const step = 1;
  const nx = Math.round((x1 - x0) / step) + 1, nz = Math.round((z1 - z0) / step) + 1;
  const pos = new Float32Array(nx * nz * 3);
  const edge = new Float32Array(nx * nz);
  const wet = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * step, z = z0 + j * step, k = j * nx + i;
    pos[k * 3] = x; pos[k * 3 + 1] = LAKE_LEVEL; pos[k * 3 + 2] = z;
    const e = lakeEdgeDist(x, z);
    edge[k] = Math.max(0, -e);
    wet[k] = e < 1.2 && terrainHeight(x, z) < LAKE_LEVEL + 0.4 ? 1 : 0;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    if (wet[a] || wet[b] || wet[c] || wet[d]) idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nx * nz * 3).map((_, q) => (q % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Slush chunks drifting slowly round the lake (instanced, bobbing). */
function SlushChunks({ count = 46 }) {
  const ref = useRef();
  const chunks = useMemo(() => {
    const out = [];
    let seed = 7;
    const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let n = 0; n < 400 && out.length < count; n++) {
      const x = SNOW_LAKE.center[0] + (r() - 0.5) * SNOW_LAKE.rx * 2, z = SNOW_LAKE.center[1] + (r() - 0.5) * SNOW_LAKE.rz * 2;
      if (lakeEdgeDist(x, z) > -2.5) continue;
      out.push({ x, z, s: 0.4 + r() * 0.9, rot: r() * 6.28, ph: r() * 6.28, sp: 0.15 + r() * 0.2 });
    }
    return out;
  }, [count]);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1.1, 0.22, 6, 1);
    return g;
  }, []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    chunks.forEach((c, i) => {
      const dx = Math.sin(t * 0.05 * c.sp + c.ph) * 2.2, dz = Math.cos(t * 0.04 * c.sp + c.ph) * 1.6;
      let x = c.x + dx, z = c.z + dz;
      if (lakeEdgeDist(x, z) > -1.5) { x = c.x; z = c.z; }
      tmp.position.set(x, LAKE_LEVEL + 0.03 + Math.sin(t * 1.3 + c.ph) * 0.03, z);
      tmp.rotation.set(Math.sin(t * 0.9 + c.ph) * 0.05, c.rot + t * 0.02 * c.sp, Math.cos(t * 0.8 + c.ph) * 0.05);
      tmp.scale.set(c.s * 1.3, 1, c.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, chunks.length]} frustumCulled={false} receiveShadow>
      <meshStandardMaterial color="#eef6fc" roughness={0.45} />
    </instancedMesh>
  );
}

/** The hexagonal ICE FLOES (you can stand on them — they're solid). */
function Floes() {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 0.92, 1, 6, 1);
    g.translate(0, -0.5, 0);
    return g;
  }, []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => { if (m) m.rotation.z = Math.sin(t * 0.9 + i) * 0.012; });
  });
  return (
    <group>
      {ICE_FLOES.map((f, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} position={[f.c[0], FLOE_TOP, f.c[1]]} rotation={[0, i * 0.7, 0]}>
          <mesh geometry={geo} scale={[f.r, 1.1, f.r]} castShadow receiveShadow>
            <meshStandardMaterial color="#cfe6f3" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.03, 0]} scale={[f.r * 0.86, 0.12, f.r * 0.86]}>
            <cylinderGeometry args={[1, 1, 1, 6]} />
            <meshStandardMaterial color="#f6fafe" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The pond disc (its pad's superellipse) at the pond's ice level. */
function padDisc(f, lift) {
  const N = 72;
  const pos = [f.c[0], f.level + lift, f.c[1]];
  const uv = [f.c[0] / 18, f.c[1] / 18];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    const x = f.c[0] + dx * (rim - 0.1), z = f.c[1] + dz * (rim - 0.1);
    pos.push(x, f.level + lift, z);
    uv.push(x / 18, z / 18);
  }
  const idx = [];
  for (let i = 1; i <= N; i++) idx.push(0, i + 1, i);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function riverRibbon(lift) {
  const R = FROZEN_RIVER;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < R.pts.length; i++) {
    const [x, z] = R.pts[i];
    const a = R.pts[Math.max(0, i - 1)], b = R.pts[Math.min(R.pts.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    const hw = R.hw[i] - 0.05;
    for (const s of [-1, 0, 1]) {
      const px = x + nx * hw * s, pz = z + nz * hw * s;
      pos.push(px, R.lvl[i] + lift, pz);
      uv.push(px / 18, pz / 18);
    }
    if (i > 0) {
      const o = (i - 1) * 3, p = i * 3;
      idx.push(o, o + 1, p, o + 1, p + 1, p, o + 1, o + 2, p + 1, o + 2, p + 2, p + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function patchDisc(x, z, r, lift) {
  const N = 28;
  const pos = [], uv = [], idx = [];
  pos.push(x, terrainHeight(x, z) + lift, z); uv.push(x / 18, z / 18);
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r * (0.92 + 0.08 * Math.sin(a * 3 + x));
    const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
    pos.push(px, terrainHeight(px, pz) + lift, pz);
    uv.push(px / 18, pz / 18);
  }
  for (let i = 1; i <= N; i++) idx.push(0, i + 1, i);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** All the ice: pond + falls pool, river, puddles, runouts, chute floors. */
export function SnowIce() {
  const mat = useMemo(() => makeIceMaterial(), []);
  const geos = useMemo(() => {
    const out = [];
    for (const f of getSnowPads()) if (f.ice) out.push(padDisc(f, 0.025));
    out.push(riverRibbon(0.025));
    for (const p of getIcePatches()) out.push(patchDisc(p.x, p.z, p.r, 0.03));
    for (const c of SNOW_CHUTE_PATHS) out.push(buildChuteRibbon(c, 0.03));
    return out;
  }, []);
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} material={mat} receiveShadow renderOrder={1} />)}
    </group>
  );
}

export function SnowLake() {
  const geo = useMemo(buildLakeGeometry, []);
  const mat = useMemo(() => makeLakeMaterial(), []);
  return (
    <group>
      <mesh geometry={geo} material={mat} receiveShadow renderOrder={2} />
      <SlushChunks />
      <Floes />
    </group>
  );
}

/**
 * THE FROZEN WATERFALL — a curtain of blue-white ice columns pouring off the
 * escarpment lip into its pool, icicles fringing the top, a frozen splash
 * mound at the foot, and a little glittering mist.
 */
export function FrozenFalls() {
  const [fx, fz] = FROZEN_FALLS.position;
  const W = FROZEN_FALLS.width;
  const poolY = terrainHeight(fx, fz + 6);
  // The lip: walk north from the pool until the cliff flattens out on top.
  const zTop = useMemo(() => {
    for (let z = fz + 1; z > fz - 30; z -= 0.5) {
      if (terrainHeight(fx, z) > poolY + 5 && slopeAt(fx, z) < 0.45) return z + 0.5;
    }
    return fz - 8;
  }, [fx, fz, poolY]);
  const zBot = fz + 4;
  /** The ice CURTAIN: a sheet of ridged ice draped down the cliff face,
   *  standing a little proud of the rock, bluer as it falls. */
  const curtain = useMemo(() => {
    const NX = 36, NZ = 44;
    const pos = [], col = [], idx = [];
    const cTop = new THREE.Color("#f4fbff"), cBot = new THREE.Color("#8fd3ee");
    for (let j = 0; j <= NZ; j++) {
      const v = j / NZ;
      const z0 = zTop + (zBot - zTop) * v;
      for (let i = 0; i <= NX; i++) {
        const u = i / NX;
        const edge = 1 - Math.pow(Math.abs(u * 2 - 1), 3);
        const x = fx + (u - 0.5) * W * (0.8 + 0.25 * v);
        const ridge = 0.5 + 0.5 * Math.sin(i * 1.9 + Math.sin(i * 0.7) * 2);
        const proud = (0.25 + 0.45 * ridge) * edge;
        const z = z0 + proud * 0.9;
        const y = terrainHeight(x, z0) + 0.15 + proud * 0.6;
        pos.push(x, Math.max(y, poolY + 0.05), z);
        const c = cTop.clone().lerp(cBot, Math.min(1, v * 1.1)).multiplyScalar(0.92 + 0.12 * ridge);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b2 = a + 1, c = a + NX + 1, d = c + 1;
      idx.push(a, c, b2, b2, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [fx, W, zTop, zBot, poolY]);
  /** Big icicles fringing the lip + frozen columns standing at the foot. */
  const spikes = useMemo(() => {
    const out = [];
    let sd = 5;
    const r = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    for (let i = 0; i < 22; i++) {
      const x = fx - W * 0.55 + r() * W * 1.1;
      const L = 0.8 + r() * 2.4;
      out.push({ x, y: terrainHeight(x, zTop) + 0.1, z: zTop + 0.6, L, r: 0.12 + L * 0.06, down: true });
    }
    for (let i = 0; i < 9; i++) {
      const x = fx - W * 0.45 + r() * W * 0.9;
      const z = zBot - 1.5 + r() * 2;
      const L = 1.2 + r() * 3.2;
      out.push({ x, y: Math.max(terrainHeight(x, z), poolY), z, L, r: 0.25 + r() * 0.3, down: false, lean: (r() - 0.5) * 0.3 });
    }
    return out;
  }, [fx, W, zTop, zBot, poolY]);
  const sparkle = useRef();
  useFrame((state) => {
    if (sparkle.current) sparkle.current.emissiveIntensity = 0.22 + Math.sin(state.clock.elapsedTime * 1.3) * 0.06;
  });
  return (
    <group>
      <mesh geometry={curtain} castShadow receiveShadow>
        <meshStandardMaterial ref={sparkle} vertexColors emissive="#5fb8de" emissiveIntensity={0.22} roughness={0.12} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      {spikes.map((c, i) => (
        <mesh key={i} position={[c.x, c.down ? c.y - c.L / 2 : c.y + c.L / 2, c.z]} rotation={[c.down ? Math.PI : 0, i, c.lean || 0]} castShadow>
          <coneGeometry args={[c.r, c.L, 6]} />
          <meshStandardMaterial color={i % 2 ? "#d8f3ff" : "#b7e5f7"} emissive="#7cc6e8" emissiveIntensity={0.2} roughness={0.15} />
        </mesh>
      ))}
      {/* The frozen splash mound where the falls meet the pool. */}
      <mesh position={[fx, poolY - 0.25, zBot - 0.5]} scale={[W * 0.6, 1.3, 2.6]} castShadow receiveShadow>
        <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dff4fc" roughness={0.3} emissive="#9fdcf2" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

/** A splash + shiver ring where the player hopped into the icy lake. */
export function ColdSplash() {
  const ring = useRef();
  const drops = useRef();
  useFrame(() => {
    const h = playerState.lavaHit;
    const g = ring.current;
    if (!g) return;
    if (!h || Date.now() - h.t > 900) { g.visible = false; if (drops.current) drops.current.visible = false; return; }
    const k = (Date.now() - h.t) / 900;
    g.visible = true;
    g.position.set(h.x, LAKE_LEVEL + 0.05, h.z);
    g.scale.setScalar(0.6 + k * 2.6);
    g.material.opacity = 0.8 * (1 - k);
    if (drops.current) {
      drops.current.visible = true;
      drops.current.position.set(h.x, LAKE_LEVEL + 0.3 + Math.sin(k * Math.PI) * 1.2, h.z);
      drops.current.scale.setScalar(0.6 + k);
      drops.current.material.opacity = 0.9 * (1 - k);
    }
  });
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.6, 1, 28]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh ref={drops} visible={false}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#dff3ff" transparent opacity={0.9} depthWrite={false} wireframe />
      </mesh>
    </group>
  );
}
