import React, { useMemo } from "react";
import * as THREE from "three";
import { flatMat } from "./farmMaterials.js";

/**
 * FARM KIT — tiny building blocks for the farm's hand-built set-pieces:
 * world-scale-UV boxes (so one board / iron texture tiles at the same size
 * on every wall), gable + gambrel roofs, prisms and rods. Everything here is
 * static (StaticBatch merges it).
 */
const _geoCache = new Map();

/** BoxGeometry whose UVs are in metres / `tile` (consistent texel size). */
export function texBox(w, h, d, tile = 2) {
  const k = `b${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${tile}`;
  if (_geoCache.has(k)) return _geoCache.get(k);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Face order: +x, −x, +y, −y, +z, −z (4 verts each).
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  _geoCache.set(k, g);
  return g;
}

/** A box mesh. `m` = material (or a colour string → flat material). */
export function Box({ p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], m = "#999999", tile = 2, cast = true, receive = true }) {
  const mat = typeof m === "string" ? flatMat(m) : m;
  const geo = texBox(s[0], s[1], s[2], tile);
  return <mesh position={p} rotation={r} geometry={geo} material={mat} castShadow={cast} receiveShadow={receive} />;
}

/** A cylinder mesh (axis y). */
export function Cyl({ p = [0, 0, 0], r = [0, 0, 0], rt = 0.5, rb = 0.5, h = 1, seg = 12, m = "#999999", open = false, cast = true, uvTile = 0 }) {
  const mat = typeof m === "string" ? flatMat(m) : m;
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
    if (uvTile) {
      const uv = g.attributes.uv;
      const circ = Math.PI * 2 * Math.max(rt, rb);
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * circ) / uvTile, (uv.getY(i) * h) / uvTile);
    }
    return g;
  }, [rt, rb, h, seg, open, uvTile]);
  return <mesh position={p} rotation={r} geometry={geo} material={mat} castShadow={cast} receiveShadow />;
}

/** A rod (thin cylinder) from a → b. */
export function Rod({ a, b, r = 0.05, m = "#666666", seg = 6, cast = true }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat, len };
  }, [a, b]);
  const mat = typeof m === "string" ? flatMat(m) : m;
  return (
    <mesh position={pos} quaternion={quat} castShadow={cast} material={mat}>
      <cylinderGeometry args={[r, r, len, seg]} />
    </mesh>
  );
}

/**
 * A triangular PRISM — a gable end infill: base width `w` (x), height `h`
 * (y, apex in the middle), extruded `d` along z. Origin at the base centre.
 */
export function prismGeometry(w, h, d) {
  const k = `p${w}|${h}|${d}`;
  if (_geoCache.has(k)) return _geoCache.get(k);
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  // World-ish UVs for board textures.
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2 + p.getZ(i) / 2, p.getY(i) / 2);
  g.computeVertexNormals();
  _geoCache.set(k, g);
  return g;
}
/** A polygon (x, y points) extruded `d` along z, centred. */
export function extrudeGeometry(pts, d, key) {
  const k = `e${key}|${d}`;
  if (key && _geoCache.has(k)) return _geoCache.get(k);
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2 + p.getZ(i) / 2, p.getY(i) / 2);
  g.computeVertexNormals();
  if (key) _geoCache.set(k, g);
  return g;
}

/**
 * A GABLE ROOF over a w (x) × d (z) building whose eaves sit at y = 0: ridge
 * along x, rising `rise`, overhanging `oh`. Two cladding slabs + the gable
 * infills (wall material).
 */
export function GableRoof({ w, d, rise, oh = 0.5, roof, wall, tile = 2, thick = 0.14 }) {
  const slope = Math.atan2(rise, d / 2);
  const slabW = Math.hypot(d / 2, rise) + oh / Math.cos(slope);
  const L = w + oh * 2;
  const cy = rise - (Math.sin(slope) * slabW) / 2 + (Math.cos(slope) * thick) / 2;
  const cz = (Math.cos(slope) * slabW) / 2 + (Math.sin(slope) * thick) / 2;
  return (
    <group>
      {[1, -1].map((s) => (
        <Box key={s} p={[0, cy, s * cz]} r={[s * slope, 0, 0]} s={[L, thick, slabW]} m={roof} tile={tile} />
      ))}
      {wall && <mesh geometry={prismGeometry(d, rise, w)} rotation={[0, Math.PI / 2, 0]} material={typeof wall === "string" ? flatMat(wall) : wall} castShadow receiveShadow />}
    </group>
  );
}

/** Ridge-cap + barge boards for a gable roof (trim colour). */
export function RoofTrim({ w, d, rise, oh = 0.5, color = "#f3e9d6", thick = 0.14 }) {
  const slope = Math.atan2(rise, d / 2);
  const slabW = Math.hypot(d / 2, rise) + oh / Math.cos(slope);
  const cy = rise - (Math.sin(slope) * slabW) / 2 + Math.cos(slope) * thick;
  const cz = (Math.cos(slope) * slabW) / 2 + Math.sin(slope) * thick;
  return (
    <group>
      <Box p={[0, rise + thick + 0.05, 0]} s={[w + oh * 2 + 0.06, 0.12, 0.32]} m={color} />
      {[-1, 1].map((ex) => [-1, 1].map((sz) => (
        <Box key={`${ex}${sz}`} p={[ex * (w / 2 + oh + 0.02), cy, sz * cz]} r={[sz * slope, 0, 0]} s={[0.07, 0.24, slabW]} m={color} />
      )))}
    </group>
  );
}

/** A window: frame + glass (+ sill), facing +z, centred. */
export function Window({ p, w = 1.1, h = 1.2, r = [0, 0, 0], frame = "#f5efe2", glass = "#6f93a8", shutters = null }) {
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, 0.03]} s={[w + 0.16, h + 0.16, 0.06]} m={frame} cast={false} />
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={glass} roughness={0.15} metalness={0.3} emissive="#203040" emissiveIntensity={0.25} />
      </mesh>
      <Box p={[0, 0, 0.07]} s={[0.05, h, 0.03]} m={frame} cast={false} />
      <Box p={[0, 0, 0.07]} s={[w, 0.05, 0.03]} m={frame} cast={false} />
      <Box p={[0, -h / 2 - 0.1, 0.09]} s={[w + 0.3, 0.07, 0.18]} m={frame} cast={false} />
      {shutters && [-1, 1].map((s) => <Box key={s} p={[s * (w / 2 + 0.28), 0, 0.05]} s={[0.4, h + 0.1, 0.05]} m={shutters} cast={false} />)}
    </group>
  );
}

/** A ladder from the ground up a wall (along y), facing +z. */
export function Ladder({ p, h = 4, w = 0.5, m = "#8a7350" }) {
  const rungs = Math.floor(h / 0.32);
  return (
    <group position={p}>
      {[-1, 1].map((s) => <Box key={s} p={[(s * w) / 2, h / 2, 0]} s={[0.05, h, 0.05]} m={m} cast={false} />)}
      {Array.from({ length: rungs }).map((_, i) => <Box key={i} p={[0, 0.25 + i * 0.32, 0]} s={[w, 0.035, 0.035]} m={m} cast={false} />)}
    </group>
  );
}
