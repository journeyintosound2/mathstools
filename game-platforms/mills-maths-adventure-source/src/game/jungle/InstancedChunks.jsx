import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * INSTANCED CHUNKS — draws a big list of identical things (trees, ferns,
 * rocks…) as one InstancedMesh PER TILE of the map, so the camera and the
 * shadow camera each cull whole tiles they can't see. Optional `maxDist`
 * hides far tiles of small things (ferns, flowers) entirely; optional
 * `lodGeometry` + `lodDist` swaps far tiles to a cheaper mesh (same look
 * from a distance, a quarter of the triangles — shadows included).
 *
 * items: [{ x, y, z, s, rot, tint, lean?, sx?, sy?, sz?, rx?, rz? }]
 * tintFn(item, color) sets the per-instance colour (multiplies the vertex colours).
 */
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

function Tile({ items, geometry, lodGeometry, lodDist, farGeometry, farDist, material, castShadow, receiveShadow, tintFn, sink, center, maxDist }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      _e.set(it.rx || 0, it.rot || 0, it.rz || 0, "YXZ");
      _q.setFromEuler(_e);
      if (it.lean) {
        // Lean the whole plant toward its own facing (palms lean out).
        _q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -it.lean));
      }
      const s = it.s || 1;
      _s.set(s * (it.sx || 1), s * (it.sy || 1), s * (it.sz || 1));
      _p.set(it.x, it.y - (sink || 0) * s, it.z);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
      if (tintFn) {
        _c.setRGB(1, 1, 1);
        tintFn(it, _c);
        mesh.setColorAt(i, _c);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, tintFn, sink]);
  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (!mesh || (!maxDist && !lodGeometry && !farGeometry)) return;
    const d = Math.hypot(camera.position.x - center[0], camera.position.z - center[1]);
    if (maxDist) mesh.visible = d < maxDist;
    if (lodGeometry || farGeometry) {
      const g = farGeometry && d > farDist ? farGeometry : lodGeometry && d > lodDist ? lodGeometry : geometry;
      if (mesh.geometry !== g) mesh.geometry = g;
    }
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

export default function InstancedChunks({ items, geometry, lodGeometry = null, lodDist = 70, farGeometry = null, farDist = 150, material, tile = 72, castShadow = false, receiveShadow = true, tintFn, sink = 0, maxDist = 0 }) {
  const buckets = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = `${Math.floor(it.x / tile)},${Math.floor(it.z / tile)}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    return [...map.entries()].map(([k, arr]) => {
      const [i, j] = k.split(",").map(Number);
      return { k, arr, center: [(i + 0.5) * tile, (j + 0.5) * tile] };
    });
  }, [items, tile]);
  if (!geometry || !material) return null;
  return (
    <group>
      {buckets.map((b) => (
        <Tile
          key={b.k}
          items={b.arr}
          geometry={geometry}
          lodGeometry={lodGeometry}
          lodDist={lodDist + tile * 0.5}
          farGeometry={farGeometry}
          farDist={farDist + tile * 0.5}
          material={material}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          tintFn={tintFn}
          sink={sink}
          center={b.center}
          maxDist={maxDist ? maxDist + tile * 0.71 : 0}
        />
      ))}
    </group>
  );
}
