import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getQuicksandPits, quicksandAt, POOL_LEVEL, poolEdgeDist } from "../../data/desert/desertTerrain.js";
import { OASIS_POOL, QS_EDGE } from "../../data/desert/desertLayout.js";
import { playerState } from "../sessionStore.js";
import { makeQuicksandMaterial, makeOasisWaterMaterial, getDesertTextures } from "./desertMaterials.js";

/**
 * DESERT WATER — the QUICKSAND surfaces (a dark, wet, slowly turning swirl
 * laid exactly at each pit's level; the ground under it dips, so you sink to
 * your knees as you wade the soft edge) and the OASIS pool. Plus a puff of
 * sand + a ring of ripples where you're wading the quicksand.
 */
const ANG = 96, RAD = 16;
/** Where along a ray from (cx, cz) the pit's SDF crosses `target` (bisection). */
function crossAt(pit, cx, cz, ux, uz, r0, r1, target) {
  const f = (r) => {
    const q = quicksandAt(cx + ux * r, cz + uz * r);
    return (q && q.pit === pit ? q.sdf : 99) - target;
  };
  let a = r0, b = r1, fa = f(a);
  for (let i = 0; i < 26; i++) {
    const m = (a + b) / 2, fm = f(m);
    if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}
function pitGeometry(pit) {
  const [cx, cz] = pit.c;
  const pos = [], loc = [], dep = [], idx = [];
  const EDGE = -0.12;
  const R = pit.ring ? pit.rOut + 3 : Math.max(pit.rx, pit.rz) + 3;
  for (let a = 0; a <= ANG; a++) {
    const ang = (a / ANG) * Math.PI * 2;
    const ux = Math.cos(ang), uz = Math.sin(ang);
    let rIn, rOut;
    if (pit.ring) {
      const mid = (pit.rIn + pit.rOut) / 2;
      rIn = crossAt(pit, cx, cz, ux, uz, mid, 0.5, EDGE);
      rOut = crossAt(pit, cx, cz, ux, uz, mid, R, EDGE);
    } else {
      rIn = 0;
      rOut = crossAt(pit, cx, cz, ux, uz, 0, R, EDGE);
    }
    for (let k = 0; k <= RAD; k++) {
      const t = k / RAD;
      const r = rIn + (rOut - rIn) * t;
      const x = cx + ux * r, z = cz + uz * r;
      const q = quicksandAt(x, z);
      // A gentle dimple toward the middle — it looks like it's draining down.
      const dIn = Math.max(0, -(q && q.pit === pit ? q.sdf : 0));
      pos.push(x, pit.level + 0.012 - 0.22 * Math.min(1, Math.max(0, (dIn - QS_EDGE) / 4)), z);
      loc.push(x - cx, z - cz);
      dep.push(Math.max(0, -(q && q.pit === pit ? q.sdf : 0)));
    }
  }
  for (let a = 0; a < ANG; a++) {
    for (let k = 0; k < RAD; k++) {
      const i0 = a * (RAD + 1) + k, i1 = i0 + 1, j0 = (a + 1) * (RAD + 1) + k, j1 = j0 + 1;
      idx.push(i0, j0, i1, i1, j0, j1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aLocal", new THREE.Float32BufferAttribute(loc, 2));
  g.setAttribute("aDepth", new THREE.Float32BufferAttribute(dep, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Normals point up (a level sheet).
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  g.computeBoundingSphere();
  return g;
}

export function QuicksandPits() {
  const mat = useMemo(() => makeQuicksandMaterial(), []);
  const geos = useMemo(() => getQuicksandPits().map((p) => pitGeometry(p)), []);
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} material={mat} receiveShadow renderOrder={1} />)}
    </group>
  );
}

/** A puff of sand + a slow ring where you're wading the quicksand's edge. */
export function SinkPuffs() {
  const ring = useRef();
  const puffs = useRef();
  const tex = getDesertTextures().dust;
  const state = useRef({ t: 0, on: 0 });
  useFrame((_, dt) => {
    const q = quicksandAt(playerState.x, playerState.z);
    const inSand = Boolean(q && q.sdf < 0 && (playerState.y || 0) < q.pit.level + 0.1);
    const s = state.current;
    s.on += ((inSand ? 1 : 0) - s.on) * Math.min(1, dt * 5);
    s.t += dt;
    if (ring.current) {
      ring.current.visible = s.on > 0.02;
      if (q && inSand) ring.current.position.set(playerState.x, q.pit.level + 0.03, playerState.z);
      const k = 0.8 + ((s.t * 0.9) % 1) * 1.1;
      ring.current.scale.set(k, k, k);
      ring.current.material.opacity = s.on * (1 - ((s.t * 0.9) % 1)) * 0.55;
    }
    if (puffs.current) {
      puffs.current.visible = s.on > 0.02;
      if (q && inSand) puffs.current.position.set(playerState.x, q.pit.level + 0.4, playerState.z);
      puffs.current.material.opacity = s.on * 0.5;
      puffs.current.rotation.y += dt * 0.6;
    }
  });
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.75, 28]} />
        <meshBasicMaterial color="#5a3a1c" transparent opacity={0} depthWrite={false} />
      </mesh>
      <sprite ref={puffs} scale={[1.8, 1.2, 1]} visible={false}>
        <spriteMaterial map={tex} color="#d9b483" transparent opacity={0} depthWrite={false} />
      </sprite>
    </group>
  );
}

/** The oasis pool's surface (aEdge = metres in from the shore). */
export function OasisPool() {
  const mat = useMemo(() => makeOasisWaterMaterial(), []);
  const geo = useMemo(() => {
    const P = OASIS_POOL;
    const S = 0.6;
    const x0 = P.c[0] - P.rx - 3, x1 = P.c[0] + P.rx + 3, z0 = P.c[1] - P.rz - 3, z1 = P.c[1] + P.rz + 3;
    const nx = Math.ceil((x1 - x0) / S) + 1, nz = Math.ceil((z1 - z0) / S) + 1;
    const pos = [], edge = [], idx = [], keep = new Int32Array(nx * nz).fill(-1);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * S, z = z0 + j * S;
      const e = poolEdgeDist(x, z);
      // The mesh runs on under the shore; the ground rising through the
      // water draws the real (smooth) shoreline.
      if (e > 1.7) continue;
      keep[j * nx + i] = pos.length / 3;
      pos.push(x, POOL_LEVEL, z);
      edge.push(Math.max(0, -e));
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = keep[j * nx + i], b = keep[j * nx + i + 1], c = keep[(j + 1) * nx + i], d = keep[(j + 1) * nx + i + 1];
      if (a >= 0 && b >= 0 && c >= 0) idx.push(a, c, b);
      if (b >= 0 && c >= 0 && d >= 0) idx.push(b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    return g;
  }, []);
  return <mesh geometry={geo} material={mat} renderOrder={2} />;
}
export { QS_EDGE };
