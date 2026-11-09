import React, { useMemo } from "react";
import * as THREE from "three";

import { tiledBox } from "../desert/desertKit.jsx";
import { getQtMats, qtMat } from "./qtMaterials.js";

/**
 * QT KIT — tiny building blocks for the Quotient Temple's set pieces: a box
 * (metre UVs, a named material or a colour), a cylinder, a beam from a → b,
 * a lathe (turned shapes — urns, column bases, the cobra's coils).
 */
export function mat(m) {
  if (!m) return getQtMats().stone;
  if (typeof m !== "string") return m;
  const M = getQtMats();
  return M[m] || qtMat(m);
}
export function QBox({ p, s, m, rot, tile = 1, cast = false }) {
  return <mesh position={p} rotation={rot} geometry={tiledBox(s[0], s[1], s[2], tile)} material={mat(m)} castShadow={cast} receiveShadow />;
}
export function QCyl({ p, rt, rb, h, m, seg = 16, rot, open = false }) {
  return (
    <mesh position={p} rotation={rot} material={mat(m)} receiveShadow>
      <cylinderGeometry args={[rt, rb === undefined ? rt : rb, h, seg, 1, open]} />
    </mesh>
  );
}
export function QSphere({ p, r, m, s, seg = 16, rot }) {
  return (
    <mesh position={p} scale={s} rotation={rot} material={mat(m)}>
      <sphereGeometry args={[r, seg, Math.max(6, Math.round(seg * 0.6))]} />
    </mesh>
  );
}
export function QBeam({ a, b, w = 0.3, t = 0.3, m, tile = 1 }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
    const dir = Bv.clone().sub(A);
    const L = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    return { pos: A.clone().add(Bv).multiplyScalar(0.5), quat: q, len: L };
  }, [a, b]);
  return <mesh position={pos} quaternion={quat} geometry={tiledBox(w, t, len, tile)} material={mat(m)} receiveShadow />;
}
const _lathe = new Map();
/** A turned shape: pts = [[r, y], …] bottom → top. */
export function QLathe({ p, pts, m, seg = 20, s, rot }) {
  const k = `${JSON.stringify(pts)}|${seg}`;
  let g = _lathe.get(k);
  if (!g) {
    g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), seg);
    _lathe.set(k, g);
  }
  return <mesh position={p} scale={s} rotation={rot} geometry={g} material={mat(m)} receiveShadow />;
}
