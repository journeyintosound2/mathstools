import React, { useMemo } from "react";
import * as THREE from "three";

import { desertMat, getDesertTextures } from "./desertMaterials.js";

/**
 * DESERT KIT — little building blocks shared by the desert's set-pieces:
 * boxes whose UVs are in METRES (so a brick texture keeps its size on any
 * block — StaticBatch can then merge them all), cylinders, a stair flight
 * (steps + balustrades + newel posts) for any straight flight, and a sloped
 * block between two points.
 */

/** A box geometry with UVs scaled to metres / `tile` on every face. */
const _boxCache = new Map();
export function tiledBox(w, h, d, tile = 1) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${tile}`;
  if (_boxCache.has(k)) return _boxCache.get(k);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Face order: +x, −x, +y, −y, +z, −z (4 verts each).
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
    }
  }
  _boxCache.set(k, g);
  return g;
}

/** A box: p = centre, s = size, m = material (or colour), tile = texture metres. */
export function Box({ p, s, m, rot = [0, 0, 0], tile = 1, cast = true, receive = true }) {
  const mat = typeof m === "string" ? desertMat(m) : m;
  return (
    <mesh position={p} rotation={rot} geometry={tiledBox(s[0], s[1], s[2], tile)} material={mat} castShadow={cast} receiveShadow={receive} />
  );
}
export function Cyl({ p, rt, rb, h, m, seg = 16, rot = [0, 0, 0], cast = true }) {
  const mat = typeof m === "string" ? desertMat(m) : m;
  return (
    <mesh position={p} rotation={rot} material={mat} castShadow={cast} receiveShadow>
      <cylinderGeometry args={[rt, rb, h, seg]} />
    </mesh>
  );
}
/** A block running from a → b (3D points), w wide, t thick (a beam, a rail, a slope). */
export function Beam({ a, b, w = 0.3, t = 0.3, m, tile = 1, cast = true }) {
  const mat = typeof m === "string" ? desertMat(m) : m;
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const L = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    return { pos: A.clone().add(B).multiplyScalar(0.5), quat: q, len: L };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} geometry={tiledBox(w, t, len, tile)} material={mat} castShadow={cast} receiveShadow />
  );
}

/**
 * A STAIR FLIGHT from its bottom edge to its top edge (a flight object from
 * desertTerrain.js: from, to, hw, h0, h1, n, run, rise, ux, uz). Every step
 * is a block from below ground up to its tread; balustrades run up both sides
 * (`walls`: "both" | "left" | "right" | "none"); newel posts with finials at
 * the foot. `stepMat`, `wallMat` = materials.
 */
export function Flight({ f, stepMat, wallMat, walls = "both", wallH = 0.85, wallT = 0.42, finial = "#d9a441", deep = 1.2 }) {
  const yaw = Math.atan2(f.ux, f.uz);
  const steps = useMemo(() => Array.from({ length: f.n }, (_, k) => {
    const s = (k + 0.5) * f.run;
    const top = f.h0 + (k + 1) * f.rise;
    const bottom = Math.min(f.h0, top) - deep;
    return { x: f.from[0] + f.ux * s, z: f.from[1] + f.uz * s, y: (top + bottom) / 2, h: top - bottom };
  }), [f, deep]);
  const sides = walls === "both" ? [1, -1] : walls === "left" ? [1] : walls === "right" ? [-1] : [];
  const off = f.hw + wallT / 2;
  // (Local left of travel = (−uz, ux).)
  const sideAt = (s, sd) => [f.from[0] + f.ux * s - f.uz * off * sd, f.from[1] + f.uz * s + f.ux * off * sd];
  return (
    <group>
      {steps.map((st, i) => (
        <mesh key={i} position={[st.x, st.y, st.z]} rotation={[0, yaw, 0]} geometry={tiledBox(f.hw * 2, st.h, f.run + 0.002, 1)} material={stepMat} castShadow receiveShadow />
      ))}
      {sides.map((sd) => {
        const [ax, az] = sideAt(-0.3, sd), [bx, bz] = sideAt(f.L + 0.1, sd);
        const a = [ax, f.h0 + wallH * 0.5 + 0.05, az], b = [bx, f.h1 + wallH * 0.5 + 0.05, bz];
        const [px, pz] = sideAt(-0.35, sd);
        return (
          <group key={sd}>
            <Beam a={a} b={b} w={wallT} t={wallH + 0.6} m={wallMat} tile={1.2} />
            {/* A solid skirt under the rail down to the ground at the low end. */}
            <mesh position={[px, f.h0 + 0.1, pz]} rotation={[0, yaw, 0]} geometry={tiledBox(wallT + 0.12, 1.9, 0.6, 1)} material={wallMat} castShadow />
            {finial && (
              <mesh position={[px, f.h0 + 1.25, pz]} material={desertMat(finial, { metal: 0.55, rough: 0.35 })} castShadow>
                <sphereGeometry args={[0.24, 12, 8]} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** A painted text board's texture is in desertMaterials (signTexture). */
export function Post({ x, y, z, h = 2.4, r = 0.08, m = "#6e4a2a" }) {
  return <Cyl p={[x, y + h / 2, z]} rt={r} rb={r * 1.15} h={h} m={m} seg={6} />;
}
export { getDesertTextures, desertMat };
