import React, { useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * STATIC BATCH — draw a pile of hand-placed, never-moving meshes (bridges,
 * stairs, rails, pillars, signs…) as a handful of MERGED meshes, one per
 * distinct material look. The children mount once (so their geometry and
 * materials are built exactly as written), get baked into world space and
 * merged, then the originals are hidden (instanced meshes inside are left
 * alone and keep drawing). Hundreds of draw calls → dozens.
 *
 * Only for static things: anything animated (useFrame on a ref) must live
 * outside the batch. Meshes may opt out with userData.noBatch.
 *
 * `farDist` (optional) adds a FAR LOD: beyond that many metres from the
 * camera the whole batch swaps to ONE untextured, vertex-coloured mesh
 * (each texture's average colour baked in; transparent glass left out) — a
 * far-off homestead in the haze is one draw instead of a dozen.
 */
const isPatched = (m) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile;
const q = (v, step) => Math.round((v ?? 0) / step) * step;
/** Everything about a material that can't be baked into vertex colours. */
function matKey(m) {
  const c = (v) => (v && v.getHexString ? v.getHexString() : "-");
  return [
    m.type, isPatched(m) ? `${c(m.color)}|${m.uuid}` : "", c(m.emissive), q(m.emissiveIntensity ?? 0, 0.05), m.map ? m.map.uuid : "-", m.alphaMap ? m.alphaMap.uuid : "-",
    q(m.roughness, 0.1), q(m.metalness, 0.1), m.flatShading ? 1 : 0, m.side, m.transparent ? 1 : 0, q(m.opacity, 0.05), m.alphaTest,
    m.toneMapped ? 1 : 0, m.depthWrite ? 1 : 0, m.blending, m.polygonOffset ? `${m.polygonOffsetFactor}` : "",
  ].join("|");
}
const _col = new THREE.Color();
const _emi = new THREE.Color();

/** A texture's average colour (sampled once, cached) — for the far LOD. */
const avgCache = new Map();
function textureAverage(tex) {
  if (!tex) return null;
  if (avgCache.has(tex.uuid)) return avgCache.get(tex.uuid);
  let out = null;
  try {
    const img = tex.image;
    if (img && typeof document !== "undefined") {
      const c = document.createElement("canvas");
      c.width = c.height = 8;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      // sRGB texture → linear working colour.
      out = tex.colorSpace === THREE.SRGBColorSpace
        ? new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace)
        : new THREE.Color(r / n / 255, g / n / 255, b / n / 255);
    }
  } catch (e) {
    out = null;
  }
  avgCache.set(tex.uuid, out);
  return out;
}

export default function StaticBatch({ children, farDist }) {
  const ref = useRef();
  const [merged, setMerged] = useState(null);
  const lod = useRef(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map();
    const farGeos = [];
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.noBatch || Array.isArray(o.material)
        // Custom per-vertex attributes (wind sway etc.) feed custom shaders — leave those alone.
        || Object.keys(o.geometry.attributes).some((k) => !["position", "normal", "uv", "color"].includes(k))) {
        return;
      }
      const m = o.material;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      // Keep a common attribute set: position, normal, uv, color.
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      // Bake the material colour into the vertex colours, so pieces that differ
      // only by colour share one merged draw.
      const n = g.attributes.position.count;
      const tint = !isPatched(m) && m.color ? _col.copy(m.color) : _col.setRGB(1, 1, 1);
      const had = g.attributes.color && (m.vertexColors || false);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = had ? g.attributes.color.getX(i) : 1, gg = had ? g.attributes.color.getY(i) : 1, b = had ? g.attributes.color.getZ(i) : 1;
        col[i * 3] = r * tint.r; col[i * 3 + 1] = gg * tint.g; col[i * 3 + 2] = b * tint.b;
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (farDist && !m.transparent && !m.alphaTest && !m.alphaMap && !isPatched(m)) {
        // Far LOD copy: the texture's average colour × the baked colours, plus a little of the glow.
        const avg = textureAverage(m.map);
        const f = g.clone();
        const fc = f.attributes.color.array;
        const glow = m.emissive ? _emi.copy(m.emissive).multiplyScalar(m.emissiveIntensity ?? 1) : null;
        for (let i = 0; i < n; i++) {
          if (avg) { fc[i * 3] *= avg.r; fc[i * 3 + 1] *= avg.g; fc[i * 3 + 2] *= avg.b; }
          if (glow) { fc[i * 3] += glow.r; fc[i * 3 + 1] += glow.g; fc[i * 3 + 2] += glow.b; }
        }
        f.deleteAttribute("uv");
        farGeos.push(f);
      }
      const key = matKey(m);
      if (!groups.has(key)) groups.set(key, { material: m, geos: [], cast: false, receive: false, src: [] });
      const grp = groups.get(key);
      grp.geos.push(g);
      grp.src.push(o);
      grp.cast = grp.cast || o.castShadow;
      grp.receive = grp.receive || o.receiveShadow;
    });
    const out = [];
    const mats = [];
    for (const grp of groups.values()) {
      const geo = mergeGeometries(grp.geos, false);
      grp.geos.forEach((g) => g.dispose());
      if (!geo) continue;
      geo.computeBoundingSphere();
      let mat = grp.material;
      if (!isPatched(mat)) {
        mat = mat.clone();
        mat.color.setRGB(1, 1, 1);
        mat.vertexColors = true;
        mats.push(mat);
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = grp.cast;
      mesh.receiveShadow = grp.receive;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      out.push(mesh);
      // The originals stay in the tree (React owns them) but stop drawing.
      grp.src.forEach((o) => { o.visible = false; });
    }
    let far = null;
    if (farDist && farGeos.length) {
      const geo = mergeGeometries(farGeos, false);
      farGeos.forEach((g) => g.dispose());
      if (geo) {
        geo.computeBoundingSphere();
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
        mats.push(mat);
        far = new THREE.Mesh(geo, mat);
        far.matrixAutoUpdate = false;
        far.updateMatrix();
        far.visible = false;
        out.push(far);
        // Near meshes vs the far mesh; patched (custom-shader) groups always draw.
        const near = out.filter((m) => m !== far && !isPatched(m.material));
        lod.current = { far, near, centre: geo.boundingSphere.center.clone(), radius: geo.boundingSphere.radius, isFar: false };
      }
    }
    setMerged(out);
    return () => {
      lod.current = null;
      out.forEach((m) => m.geometry.dispose());
      mats.forEach((m) => m.dispose());
    };
  }, []);
  const _w = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    const L = lod.current;
    if (!L || !L.far.parent) return;
    const w = L.far.parent.localToWorld(_w.current.copy(L.centre));
    const d = camera.position.distanceTo(w) - L.radius;
    const isFar = L.isFar ? d > farDist - 10 : d > farDist;
    if (isFar === L.isFar) return;
    L.isFar = isFar;
    L.far.visible = isFar;
    L.near.forEach((m) => { m.visible = !isFar; });
  });
  return (
    <>
      <group ref={ref}>{children}</group>
      {merged && merged.map((m, i) => <primitive key={i} object={m} />)}
    </>
  );
}
