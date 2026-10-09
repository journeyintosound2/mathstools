import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { rng, segDistT, toWorld } from "../../data/schoolyard/schoolyardGeom.js";
import { rawHeight, terrainHeight, coastZ } from "../../data/schoolyard/schoolyardTerrain.js";
import { SCHOOL_FENCE, SCHOOL_FRONT_GATE, SEA_Y, BACKDROP } from "../../data/schoolyard/schoolyardLayout.js";
import { Kit } from "./schoolKit.js";
import { kitMat, schoolMat, getSchoolTextures } from "./schoolMaterials.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { buildBroadleaf, buildRock, buildPalmTrunk, buildPalmFronds } from "../jungle/jungleGeometry.js";
import { buildGum } from "../farm/farmGeometry.js";
import { buildNorfolk } from "./schoolGeometry.js";
import { inPierView } from "../../data/schoolyard/schoolyardProps.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";

/**
 * THE VIEW FROM THE SCHOOL (never walkable) — Coffs Harbour around the
 * campus: the streets (Camperdown St out the front gate, Harbour Dr, the
 * town's grid down the hill) with footpaths, power poles + a little traffic;
 * hundreds of houses + the town centre's shops and units; street trees,
 * Norfolk pines along the foreshore; the bush on Beacon Hill + the
 * hinterland ridges; Jetty Beach, the long timber JETTY, the harbour with
 * its rock breakwalls out to MUTTONBIRD ISLAND, the marina's boats and yachts
 * on the sea. Plus the school's own black palisade fence + front gates.
 */
const H = (x, z) => (Math.abs(x) < 170 && Math.abs(z) < 165 ? terrainHeight(x, z) : rawHeight(x, z));

// ---------------------------------------------------------------------------
// STREETS
// ---------------------------------------------------------------------------
function townStreets() {
  const out = BACKDROP.streets.map((s) => ({ ...s, main: true }));
  const shore = (x) => coastZ(x) - 30;
  // Streets running across the slope (parallel to the beach).
  for (const z of [176, 214]) out.push({ id: `cross-${z}`, a: [-480, z], b: [480, z], hw: 4.2 });
  // The beachfront parade (follows the shore).
  const pts = [];
  for (let x = -520; x <= 520; x += 20) pts.push([x, shore(x)]);
  out.push({ id: "parade", pts, hw: 4.5 });
  // Streets down the hill to the beach.
  for (const x of [-300, -220, -80, 40, 230, 320, 420]) out.push({ id: `down-${x}`, a: [x, 137], b: [x, shore(x)], hw: 4.0 });
  // Up behind the school.
  out.push({ id: "ridge", a: [-480, -240], b: [480, -240], hw: 4.5 });
  for (const x of [-60, 80, 250]) out.push({ id: `up-${x}`, a: [x, -142], b: [x, -240], hw: 4 });
  return out.map((s) => ({ ...s, pts: s.pts || [s.a, s.b] }));
}
const STREETS = townStreets();
function nearStreet(x, z, pad) {
  for (const s of STREETS) {
    for (let i = 0; i < s.pts.length - 1; i++) {
      const { d } = segDistT(x, z, s.pts[i][0], s.pts[i][1], s.pts[i + 1][0], s.pts[i + 1][1]);
      if (d < s.hw + pad) return true;
    }
  }
  return false;
}
const inSchool = (x, z, pad) => x > SCHOOL_FENCE.xMin - pad && x < SCHOOL_FENCE.xMax + pad && z > SCHOOL_FENCE.zMin - pad && z < SCHOOL_FENCE.zMax + pad;

function ribbonAlong(pos, uv, idx, pts, half, lift, offset = 0, vScale = 1) {
  // Resample to ~4 m, drape on the ground.
  const P = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
    for (let k = 0; k < n; k++) P.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  P.push(pts[pts.length - 1]);
  let v = 0, base = -1;
  for (let i = 0; i < P.length; i++) {
    const [x, z] = P[i];
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i > 0) v += Math.hypot(x - P[i - 1][0], z - P[i - 1][1]);
    const vi = pos.length / 3;
    for (const s of [-1, 0, 1]) {
      const px = x + nx * (offset + half * s), pz = z + nz * (offset + half * s);
      pos.push(px, H(px, pz) + lift, pz);
      uv.push((s * half) * vScale, v * vScale);
    }
    if (base >= 0) for (let k = 0; k < 2; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
    base = vi;
  }
}
function buildStreetGeos() {
  const road = { pos: [], uv: [], idx: [] }, path = { pos: [], uv: [], idx: [] }, line = { pos: [], uv: [], idx: [] };
  for (const s of STREETS) {
    ribbonAlong(road.pos, road.uv, road.idx, s.pts, s.hw, 0.08);
    for (const side of [-1, 1]) ribbonAlong(path.pos, path.uv, path.idx, s.pts, 0.8, 0.1, side * (s.hw + 1.2));
    ribbonAlong(line.pos, line.uv, line.idx, s.pts, 0.07, 0.11);
  }
  const mk = (b) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    g.setIndex(b.idx);
    g.computeVertexNormals();
    return g;
  };
  return { road: mk(road), path: mk(path), line: mk(line) };
}
function dashTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 8; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 8, 32);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1 / 6);
  return t;
}
export function TownStreets() {
  const geos = useMemo(buildStreetGeos, []);
  const tex = getSchoolTextures();
  const dash = useMemo(dashTexture, []);
  return (
    <group>
      <mesh geometry={geos.road} receiveShadow>
        <meshStandardMaterial map={tex.asphalt} roughness={0.95} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh geometry={geos.path} receiveShadow>
        <meshStandardMaterial map={tex.slab} roughness={0.95} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh geometry={geos.line}>
        <meshStandardMaterial alphaMap={dash} transparent alphaTest={0.5} color="#f4f4ef" polygonOffset polygonOffsetFactor={-5} polygonOffsetUnits={-5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// HOUSES + THE TOWN
// ---------------------------------------------------------------------------
const WALLS = ["#f2ede2", "#e9dcc4", "#c97c58", "#b5653f", "#f5f5f0", "#d9cbb0", "#a8b4b8", "#e6d2a8", "#bf6e4a"];
const ROOFS = ["#a8452f", "#b8553a", "#5e6870", "#7c858c", "#3f4a52", "#9b4a34", "#c5c7c2", "#6f2f28"];
function buildTown() {
  const R = rng(9901);
  const houses = [], blocks = [];
  const tryLot = (x, z, big) => {
    if (inSchool(x, z, 14) || nearStreet(x, z, 5) || z > coastZ(x) - 38) return;
    const d = Math.hypot(x, z - 60);
    if (d > 700) return;
    // The bush on Beacon Hill + up the back stays mostly bush.
    const bush = (x < -200 && z < 250) || z < -260 || (x < -170 && z < 130);
    if (bush && R() < 0.85) return;
    const gx = (rawHeight(x + 3, z) - rawHeight(x - 3, z)) / 6, gz = (rawHeight(x, z + 3) - rawHeight(x, z - 3)) / 6;
    if (Math.hypot(gx, gz) > 0.45) return;
    const y = Math.min(rawHeight(x - 4, z - 4), rawHeight(x + 4, z + 4), rawHeight(x, z)) - 0.3;
    const yaw = (R() < 0.5 ? 0 : Math.PI / 2) + (R() - 0.5) * 0.12;
    if (big) {
      const w = 14 + R() * 16, dpt = 12 + R() * 10, h = 7 + Math.floor(R() * 4) * 3.2;
      blocks.push({ x, y, z, s: 1, sx: w, sy: h, sz: dpt, rot: yaw, tint: R(), wall: WALLS[Math.floor(R() * WALLS.length)] });
    } else {
      const w = 9 + R() * 6, dpt = 8 + R() * 5, h = 3.2 + (R() < 0.25 ? 3 : 0);
      houses.push({ x, y, z, s: 1, sx: w, sy: h, sz: dpt, rot: yaw, tint: R(), wall: WALLS[Math.floor(R() * WALLS.length)], roof: ROOFS[Math.floor(R() * ROOFS.length)] });
    }
  };
  for (let x = -640; x <= 640; x += 19) {
    for (let z = -560; z <= 420; z += 19) {
      const jx = x + (R() - 0.5) * 5, jz = z + (R() - 0.5) * 5;
      // The town centre (east of Harbour Dr): shops + units.
      const centre = jx > 165 && jx < 400 && jz > -120 && jz < 150;
      tryLot(jx, jz, centre && R() < 0.75);
    }
  }
  return { houses, blocks };
}

function houseRoofGeo() {
  // A unit hip roof: base 1 × 1 at y 0, ridge along x at y 1.
  const g = new THREE.BufferGeometry();
  const v = [
    [-0.55, 0, -0.55], [0.55, 0, -0.55], [0.55, 0, 0.55], [-0.55, 0, 0.55], [-0.2, 1, 0], [0.2, 1, 0],
  ];
  const f = [[3, 2, 5, 4], [1, 0, 4, 5], [0, 3, 4], [2, 1, 5]];
  const pos = [];
  for (const face of f) {
    const tri = face.length === 3 ? [face] : [[face[0], face[1], face[2]], [face[0], face[2], face[3]]];
    for (const t of tri) for (const k of t) pos.push(...v[k]);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function houseBodyGeo() {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  // Darker window bands baked into vertex colours would need more verts —
  // instead a slightly darker base row reads as a verandah shadow.
  return g;
}
function windowBandTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#56646e";
  g.fillRect(8, 20, 18, 22); g.fillRect(38, 20, 18, 22);
  g.fillStyle = "#e9e6dd"; g.fillRect(0, 58, 64, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function Town({ highGfx }) {
  const T = useMemo(buildTown, []);
  const geos = useMemo(() => ({ body: houseBodyGeo(), roof: houseRoofGeo() }), []);
  const winTex = useMemo(windowBandTexture, []);
  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, map: winTex });
    // Window tiles in metres: stretch the UVs by the instance's scale.
    body.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
        #ifdef USE_INSTANCING
          vec3 isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec2 fs = abs(normal.x) > 0.5 ? vec2(isc.z, isc.y) : abs(normal.z) > 0.5 ? vec2(isc.x, isc.y) : vec2(0.0);
          vMapUv = uv * fs / vec2(4.0, 3.2);
        #endif`);
    };
    body.customProgramCacheKey = () => "sy-house-body";
    return { body, roof: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75 }), flat: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, map: winTex }) };
  }, [winTex]);
  mats.flat.onBeforeCompile = mats.body.onBeforeCompile;
  mats.flat.customProgramCacheKey = () => "sy-house-body";
  const roofs = useMemo(() => T.houses.map((h) => ({ ...h, y: h.y + h.sy, sy: Math.min(h.sx, h.sz) * 0.22 })), [T]);
  const wallTint = (it, c) => c.set(it.wall);
  const roofTint = (it, c) => c.set(it.roof);
  return (
    <group>
      <InstancedChunks items={T.houses} geometry={geos.body} material={mats.body} tile={360} castShadow={false} tintFn={wallTint} />
      <InstancedChunks items={roofs} geometry={geos.roof} material={mats.roof} tile={360} castShadow={false} tintFn={roofTint} />
      <InstancedChunks items={T.blocks} geometry={geos.body} material={mats.flat} tile={360} castShadow={false} tintFn={wallTint} />
      {void highGfx}
    </group>
  );
}

// ---------------------------------------------------------------------------
// TOWN TREES, THE FORESHORE PINES + THE BUSH
// ---------------------------------------------------------------------------
function buildTownTrees(highGfx) {
  const R = rng(4471);
  const street = [], pines = [], palms = [], bush = [];
  for (let k = 0; k < 9000; k++) {
    const x = -680 + R() * 1360, z = -600 + R() * 1000;
    if (inSchool(x, z, 10) || z > coastZ(x) - 24 || Math.hypot(x, z - 60) > 720) continue;
    if (nearStreet(x, z, 1.5)) continue;
    const bushy = (x < -190 && z < 260) || z < -250 || (x < -165 && z < 140);
    const y = rawHeight(x, z);
    if (bushy) {
      if (bush.length < (highGfx ? 1400 : 800)) bush.push({ x, y, z, s: 0.8 + R() * 0.6, rot: R() * 6.28, tint: R() });
    } else if (R() < 0.18 && street.length < (highGfx ? 700 : 420) && !(inPierView(x, z, 0.3) && z < 250)) {
      street.push({ x, y, z, s: 0.6 + R() * 0.5, rot: R() * 6.28, tint: R() });
    }
  }
  // Norfolk pines + palms along the beachfront.
  for (let x = -500; x <= 520; x += 22) {
    const z = coastZ(x) - 34 + (R() - 0.5) * 4;
    if (Math.abs(x - 135) < 12) continue;
    if (inPierView(x, z, 0.22) && R() < 0.7) continue;
    if (R() < 0.6) pines.push({ x, y: rawHeight(x, z), z, s: 0.8 + R() * 0.4, rot: R() * 6.28, tint: R() });
    else palms.push({ x, y: rawHeight(x, z), z, s: 0.9 + R() * 0.3, rot: R() * 6.28, tint: R() });
  }
  return { street, pines, palms, bush };
}
const leafTint = (it, c) => c.setRGB(0.88 + 0.2 * it.tint, 0.95 + 0.08 * Math.sin(it.tint * 9), 0.86 + 0.12 * (1 - it.tint));
export function TownTrees({ highGfx }) {
  const T = useMemo(() => buildTownTrees(highGfx), [highGfx]);
  const mats = useMemo(() => ({
    tree: makeFoliageMaterial({ sway: 0.4, leafy: true, key: "sy-town-tree" }),
    pine: makeFoliageMaterial({ sway: 0.2, key: "sy-town-pine" }),
    frond: makeFoliageMaterial({ sway: 1.0, side: THREE.DoubleSide, key: "sy-town-frond" }),
  }), []);
  const geos = useMemo(() => {
    const t = buildPalmTrunk(5, { height: 8, lean: 0.2 });
    return {
      street: buildBroadleaf(31, { height: 8, far: true }),
      gum: buildGum(9, { height: 15, far: true }),
      pine: buildNorfolk(3, { far: true }),
      palm: [t, buildPalmFronds(5, t.userData.top)],
    };
  }, []);
  return (
    <group>
      <InstancedChunks items={T.street} geometry={geos.street} material={mats.tree} tile={360} tintFn={leafTint} />
      <InstancedChunks items={T.bush} geometry={geos.gum} material={mats.tree} tile={360} tintFn={leafTint} />
      <InstancedChunks items={T.pines} geometry={geos.pine} material={mats.pine} tile={360} tintFn={leafTint} />
      <InstancedChunks items={T.palms} geometry={geos.palm[0]} material={mats.tree} tile={360} tintFn={leafTint} />
      <InstancedChunks items={T.palms} geometry={geos.palm[1]} material={mats.frond} tile={360} tintFn={leafTint} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE HARBOUR — the jetty, the breakwalls, Muttonbird Island, the marina.
// ---------------------------------------------------------------------------
function buildHarbour() {
  const kit = new Kit();
  // The Coffs Harbour Jetty: a long timber deck on paired piles.
  const J = BACKDROP.jetty;
  const dx = J.to[0] - J.from[0], dz = J.to[1] - J.from[1], L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const y = J.y;
  const yaw = Math.atan2(-dz, dx);
  kit.boxY("timber", (J.from[0] + J.to[0]) / 2, (J.from[1] + J.to[1]) / 2, L / 2, J.halfWidth, y - 0.35, y, yaw, { color: "#b39270", faces: { bottom: true } });
  for (let s = 0; s <= L; s += 5) {
    const cx = J.from[0] + ux * s, cz = J.from[1] + uz * s;
    for (const side of [-1, 1]) {
      const px = cx + nx * side * (J.halfWidth - 0.3), pz = cz + nz * side * (J.halfWidth - 0.3);
      const g = Math.max(SEA_Y - 6, rawHeight(px, pz));
      kit.post("timber", px, pz, g - 0.5, y - 0.3, 0.22, 8, { color: "#7a5b40" });
    }
    kit.beam("timber", [cx + nx * J.halfWidth, y - 0.5, cz + nz * J.halfWidth], [cx - nx * J.halfWidth, y - 0.5, cz - nz * J.halfWidth], 0.25, 0.3, { color: "#6e5038" });
  }
  for (const side of [-1, 1]) {
    const a = [J.from[0] + nx * side * (J.halfWidth - 0.1), y + 1.0, J.from[1] + nz * side * (J.halfWidth - 0.1)];
    const b = [J.to[0] + nx * side * (J.halfWidth - 0.1), y + 1.0, J.to[1] + nz * side * (J.halfWidth - 0.1)];
    kit.tube("timber", a, b, 0.07, 6, { color: "#8a6a4c" });
    for (let s = 0; s <= L; s += 3) {
      const px = J.from[0] + ux * s + nx * side * (J.halfWidth - 0.1), pz = J.from[1] + uz * s + nz * side * (J.halfWidth - 0.1);
      kit.post("timber", px, pz, y, y + 1.0, 0.06, 5, { color: "#8a6a4c", cap: false });
    }
  }
  // The marina: pontoons.
  const M = BACKDROP.marina;
  for (let k = 0; k < 4; k++) {
    kit.boxY("paint", M.c[0] - M.hx + 6 + k * 15, M.c[1], 0.9, M.hz, SEA_Y - 0.2, SEA_Y + 0.35, 0, { color: "#d8d4c8" });
  }
  kit.boxY("paint", M.c[0], M.c[1] - M.hz, M.hx, 1.0, SEA_Y - 0.2, SEA_Y + 0.35, 0, { color: "#d8d4c8" });
  return kit.build();
}
function buildBreakwallRocks() {
  const R = rng(2207);
  const items = [];
  const along = (pts, w) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 2.4);
      const nx = -(bz - az) / L, nz = (bx - ax) / L;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        for (let j = -2; j <= 2; j++) {
          const o = (j / 2) * w + (R() - 0.5) * 1.5;
          const x = ax + (bx - ax) * t + nx * o, z = az + (bz - az) * t + nz * o;
          const hh = SEA_Y + 2.2 - Math.abs(j) * 1.2;
          items.push({ x, y: hh, z, s: 1.4 + R() * 1.4, rot: R() * 6.28, rx: R(), rz: R(), tint: R() });
        }
      }
    }
  };
  along([...BACKDROP.breakwall, [BACKDROP.muttonbird.c[0] - 30, BACKDROP.muttonbird.c[1] - 26]], 6);
  along(BACKDROP.southBreakwall, 6);
  return items;
}
function buildMuttonbird() {
  const m = BACKDROP.muttonbird;
  const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const bump = 1 + 0.08 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7);
    const yy = Math.pow(Math.max(0, y), 0.8);
    p.setXYZ(i, m.c[0] + x * m.rx * bump, SEA_Y - 4 + yy * (m.h + 4), m.c[1] + z * m.rz * bump);
    // Rocky shore → green grassy top (the shearwaters' burrows).
    c.set("#7f7a6c").lerp(new THREE.Color("#6f9a48"), Math.min(1, Math.max(0, (yy - 0.12) * 4)));
    if (yy > 0.6) c.lerp(new THREE.Color("#8fb860"), (yy - 0.6) * 1.2);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
const BOAT_SPOTS = (() => {
  const R = rng(611);
  const M = BACKDROP.marina;
  const out = [];
  for (let k = 0; k < 4; k++) for (let j = -2; j <= 2; j++) {
    if (R() < 0.25) continue;
    for (const s of [-1, 1]) out.push({ x: M.c[0] - M.hx + 6 + k * 15 + s * 3.4, z: M.c[1] + j * 6, rot: Math.PI / 2, s: 0.8 + R() * 0.5, sail: R() < 0.6, moored: true });
  }
  // Yachts out on the water.
  for (const [x, z, r] of [[60, 470, 0.4], [-140, 420, 1.9], [220, 560, 2.6], [-40, 610, 0.9], [400, 330, 1.2]]) out.push({ x, z, rot: r, s: 1.3, sail: true, moored: false });
  return out;
})();
function Boats() {
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    BOAT_SPOTS.forEach((b, i) => {
      const o = refs.current[i];
      if (!o) return;
      o.position.y = SEA_Y + 0.15 + Math.sin(t * 0.9 + i) * 0.12;
      o.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.04;
      if (!b.moored) {
        o.position.x = b.x + Math.sin(t * 0.03 + i) * 25;
      }
    });
  });
  const mats = useMemo(() => ({
    hull: new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.4 }),
    deck: new THREE.MeshStandardMaterial({ color: "#c9b48e", roughness: 0.8 }),
    sail: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7, side: THREE.DoubleSide }),
    mast: new THREE.MeshStandardMaterial({ color: "#d8dadc", metalness: 0.6, roughness: 0.3 }),
  }), []);
  const sailGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0, 8); s.lineTo(3.2, 0.3); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group>
      {BOAT_SPOTS.map((b, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[b.x, SEA_Y, b.z]} rotation={[0, b.rot, 0]} scale={b.s}>
          <mesh material={mats.hull} scale={[1.1, 0.7, 4.2]} position={[0, 0.2, 0]}><sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
          <mesh material={mats.deck} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.0, 4.0, 1]}><circleGeometry args={[1, 12]} /></mesh>
          {b.sail ? (
            <>
              <mesh material={mats.mast} position={[0, 4.5, 0.4]}><cylinderGeometry args={[0.06, 0.06, 9, 6]} /></mesh>
              {!b.moored && <mesh geometry={sailGeo} material={mats.sail} position={[0, 0.8, 0.4]} rotation={[0, Math.PI / 2, 0]} />}
            </>
          ) : (
            <mesh material={mats.hull} position={[0, 0.9, -0.6]} scale={[0.8, 0.6, 1.4]}><boxGeometry args={[1, 1, 1]} /></mesh>
          )}
        </group>
      ))}
    </group>
  );
}
export function Harbour() {
  const built = useMemo(buildHarbour, []);
  const rocks = useMemo(buildBreakwallRocks, []);
  const rockGeo = useMemo(() => [buildRock(3), buildRock(11)], []);
  const rockMat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "sy-breakwall", roughness: 0.95, flat: true }), []);
  const mb = useMemo(buildMuttonbird, []);
  const half = Math.ceil(rocks.length / 2);
  return (
    <group>
      {built.map(({ key, geometry }) => <mesh key={key} geometry={geometry} material={kitMat(key)} castShadow receiveShadow />)}
      <InstancedChunks items={rocks.slice(0, half)} geometry={rockGeo[0]} material={rockMat} tile={360} tintFn={(it, c) => c.setRGB(0.6 + 0.2 * it.tint, 0.6 + 0.18 * it.tint, 0.58 + 0.15 * it.tint)} />
      <InstancedChunks items={rocks.slice(half)} geometry={rockGeo[1]} material={rockMat} tile={360} tintFn={(it, c) => c.setRGB(0.55 + 0.2 * it.tint, 0.55 + 0.18 * it.tint, 0.53 + 0.15 * it.tint)} />
      <mesh geometry={mb} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      <Boats />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SCHOOL FENCE + FRONT GATES, power poles on Camperdown St, traffic.
// ---------------------------------------------------------------------------
function fenceTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = "#1d2125";
  for (let x = 4; x < 128; x += 16) g.fillRect(x, 0, 5, 128);
  g.fillRect(0, 10, 128, 6); g.fillRect(0, 104, 128, 6);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function buildFence() {
  const pos = [], uv = [], idx = [];
  const kit = new Kit();
  const F = SCHOOL_FENCE, o = 0.6;
  const loop = [[F.xMin - o, F.zMin - o], [F.xMax + o, F.zMin - o], [F.xMax + o, F.zMax + o], [F.xMin - o, F.zMax + o], [F.xMin - o, F.zMin - o]];
  const gate = SCHOOL_FRONT_GATE;
  const gx0 = gate.position[0] - gate.width / 2, gx1 = gate.position[0] + gate.width / 2;
  const carGate = [106, 122]; // the car-park drive
  for (let i = 0; i < loop.length - 1; i++) {
    const [ax, az] = loop[i], [bx, bz] = loop[i + 1];
    const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 2.5);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
      const mx = (x0 + x1) / 2;
      if (Math.abs(z0 - (F.zMax + o)) < 0.01 && Math.abs(z1 - (F.zMax + o)) < 0.01 && ((mx > gx0 && mx < gx1) || (mx > carGate[0] && mx < carGate[1]))) continue;
      const y0 = H(x0, z0), y1 = H(x1, z1);
      const vi = pos.length / 3;
      pos.push(x0, y0, z0, x1, y1, z1, x1, y1 + 2.1, z1, x0, y0 + 2.1, z0);
      const u0 = (k * 2.5) / 2.5, u1 = u0 + 1;
      uv.push(u0, 0, u1, 0, u1, 1, u0, 1);
      idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
      kit.post("metal", x0, z0, y0 - 0.2, y0 + 2.25, 0.05, 6, { color: "#1d2125" });
    }
  }
  // Brick gate pillars + the open gates.
  for (const x of [gx0 - 0.4, gx1 + 0.4, carGate[0] - 0.4, carGate[1] + 0.4]) {
    const z = F.zMax + o, y = H(x, z);
    kit.boxY("brick", x, z, 0.4, 0.4, y - 0.3, y + 2.6, 0, { topKey: "slab" });
  }
  for (const [x, dir] of [[gx0, 1], [gx1, -1]]) {
    const z = F.zMax + o, y = H(x, z);
    // Swung open, inward.
    kit.boxY("metal", x + dir * 0.2, z - 1.6, 0.05, 1.6, y + 0.1, y + 2.0, 0, { color: "#1d2125" });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Power poles along Camperdown St (timber poles + cross-arms + wires).
  const wires = [];
  for (let x = -200; x <= 220; x += 38) {
    const z = 131.5, y = H(x, z);
    kit.post("timber", x, z, y - 0.3, y + 10, 0.16, 8, { color: "#6e5440" });
    kit.beam("timber", [x - 1.1, y + 9.4, z], [x + 1.1, y + 9.4, z], 0.12, 0.12, { color: "#6e5440" });
    wires.push([x, y + 9.5, z]);
  }
  for (let i = 0; i < wires.length - 1; i++) {
    for (const o2 of [-0.9, 0.9]) {
      const a = wires[i], b = wires[i + 1];
      const m = [(a[0] + b[0]) / 2 + o2, Math.min(a[1], b[1]) - 0.6, a[2]];
      kit.tube("dark", [a[0] + o2, a[1], a[2]], m, 0.015, 3);
      kit.tube("dark", m, [b[0] + o2, b[1], b[2]], 0.015, 3);
    }
  }
  return { panels: g, built: kit.build() };
}
export function SchoolFence() {
  const { panels, built } = useMemo(buildFence, []);
  const tex = useMemo(fenceTexture, []);
  return (
    <group>
      <mesh geometry={panels}>
        <meshStandardMaterial map={tex} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.6} metalness={0.3} />
      </mesh>
      {built.map(({ key, geometry }) => <mesh key={key} geometry={geometry} material={kitMat(key)} castShadow receiveShadow />)}
    </group>
  );
}

/** A little traffic on Camperdown St + Harbour Dr. */
const TRAFFIC = [
  { s: "camperdown", sp: 9, ph: 0, col: "#d33b2c", lane: 1.8 }, { s: "camperdown", sp: -8, ph: 0.4, col: "#f2f2f2", lane: -1.8 },
  { s: "camperdown", sp: 10, ph: 0.7, col: "#2f5fb0", lane: 1.8 }, { s: "harbour-dr", sp: 9, ph: 0.2, col: "#e8e8ea", lane: 1.9 },
  { s: "harbour-dr", sp: -9, ph: 0.55, col: "#1f2a44", lane: -1.9 }, { s: "edinburgh", sp: 8, ph: 0.3, col: "#5a5a60", lane: 1.7 },
  { s: "cross-176", sp: -8, ph: 0.1, col: "#e2a33a", lane: -1.6 },
];
export function Traffic() {
  const cars = useMemo(() => TRAFFIC.map((c) => ({ ...c, st: STREETS.find((s) => s.id === c.s) })).filter((c) => c.st), []);
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    cars.forEach((c, i) => {
      const o = refs.current[i];
      if (!o) return;
      const [a, b] = [c.st.pts[0], c.st.pts[c.st.pts.length - 1]];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let u = ((t * Math.abs(c.sp)) / L + c.ph) % 1;
      if (c.sp < 0) u = 1 - u;
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      const x = a[0] + (b[0] - a[0]) * u - uz * c.lane, z = a[1] + (b[1] - a[1]) * u + ux * c.lane;
      o.position.set(x, H(x, z) + 0.05, z);
      o.rotation.y = Math.atan2(ux * Math.sign(c.sp), uz * Math.sign(c.sp));
    });
  });
  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[1.8, 0.7, 4.3]} /><meshStandardMaterial color={c.col} roughness={0.35} /></mesh>
          <mesh position={[0, 1.2, -0.2]}><boxGeometry args={[1.6, 0.55, 2.4]} /><meshStandardMaterial color="#1f2830" roughness={0.3} /></mesh>
        </group>
      ))}
    </group>
  );
}

export { toWorld };
