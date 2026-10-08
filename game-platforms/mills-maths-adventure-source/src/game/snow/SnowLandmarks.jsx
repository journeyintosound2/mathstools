import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  SNOW_ARCH, SNOW_MAP_BOARD, SNOW_WELCOME_SIGN, GIANT_SNOWMAN, SNOWMEN, XMAS_TREES, VILLAGE_TREE, CAVE_AREA,
  SNOW_CHALLENGE_SPOTS, SNOW_SPAWN, SNOW_BOUNDARY, SNOW_LAKE, GROVE_TREE_POS, GROVE_BOX_POS, MEADOW_TOWER_LEFT,
  MEADOW_TOWER_RIGHT, VILLAGE_LEFT_STAND, VILLAGE_RIGHT_STAND, VILLAGE_BUILD_SITE, YARD_STALL, YARD_BOARD,
  RANGE_FRAME_POS, SLOPE_LANE, GIANT_SNOWMAN as GS, CAVE_MOUTH,
} from "../../data/snow/snowLayout.js";
import {
  snowPadLevel, terrainHeight, GRID, getSnowGrid, SNOW_TRAILS, FROZEN_RIVER, SNOW_CHUTE_PATHS, LIFT, lakeEdgeDist, ensureSnowStructures,
} from "../../data/snow/snowTerrain.js";
import { CAVE_ROCKS } from "../../data/snow/snowProps.js";
import { getSnowGroundColours } from "./SnowTerrain.jsx";
import { buildSnowRock } from "./snowGeometry.js";
import { getSnowTextures } from "./snowMaterials.js";
import { flatMat, signTexture } from "../farm/farmMaterials.js";
import { Box, Cyl } from "../farm/farmKit.jsx";
import { finish, merge, vnoise3 } from "../jungle/jungleGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import StaticBatch from "../jungle/StaticBatch.jsx";

/**
 * SNOW LANDMARKS — the welcome ARCH over the trail, the painted TRAIL MAP,
 * the welcome board, the GIANT SNOWMAN on Snowman Hill, the ICE CAVE's
 * rocky mouth under the escarpment (with icicles + a cold glow), the
 * meadow's snowmen, the decorated Christmas trees (the village's big one
 * sparkles), and each challenge area's IDLE dressing — so every area reads
 * as itself on approach and nothing invisible stands where a challenge's
 * colliders are (hidden while that challenge runs its own scene).
 */
const Y = (x, z) => terrainHeight(x, z);
const FAR = 130;
const WOOD = "#6e4c30", WOOD_DARK = "#4a3322";
const C = (h) => new THREE.Color(h);

// ---------------------------------------------------------------------------
// THE WELCOME ARCH
// ---------------------------------------------------------------------------
function WelcomeArch() {
  const A = SNOW_ARCH;
  const [x, z] = A.position;
  const y = Y(x, z);
  const blocks = flatMat("#ffffff", { map: getSnowTextures().blocks, roughness: 0.9 });
  const tex = useMemo(() => signTexture([A.text, "❄  10 + 10 = 20  ❄"], { w: 1024, h: 256, bg: "#2f5f9a", border: "#1d3b63", fg: "#ffffff", font: "bold 112px Georgia, serif", sub: "bold 50px Georgia, serif" }), [A.text]);
  const W = A.width, H = A.height;
  return (
    <group position={[x, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * W) / 2, 0, 0]}>
          <Box p={[0, H / 2 - 0.4, 0]} s={[1.3, H + 0.8, 1.3]} m={blocks} tile={1.6} />
          <Box p={[0, H + 0.12, 0]} s={[1.55, 0.25, 1.55]} m="#f4f8fd" />
          <mesh position={[0, H + 0.5, 0]} material={flatMat("#f4f8fd")}><sphereGeometry args={[0.55, 12, 9]} /></mesh>
          <mesh position={[0, H + 1.12, 0]} material={flatMat("#f4f8fd")}><sphereGeometry args={[0.38, 12, 9]} /></mesh>
          <mesh position={[0, H + 1.18, 0.33]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#e8813a")}><coneGeometry args={[0.06, 0.32, 7]} /></mesh>
          <Box p={[0, 1.4, 0.68]} s={[0.5, 0.6, 0.06]} m={new THREE.MeshStandardMaterial({ color: "#ffe2a6", emissive: "#ffd27a", emissiveIntensity: 1.2 })} cast={false} />
        </group>
      ))}
      {/* The log lintel + the sign + a garland with baubles. */}
      <Cyl p={[0, H - 0.2, 0]} r={[0, 0, Math.PI / 2]} rt={0.3} rb={0.3} h={W + 1.6} seg={10} m={WOOD} />
      <Box p={[0, H + 0.12, 0]} s={[W + 1.4, 0.16, 0.5]} m="#f4f8fd" cast={false} />
      <group position={[0, H - 1.3, 0]}>
        {[-1, 1].map((s) => <Box key={s} p={[s * 2.3, 0.85, 0]} s={[0.06, 0.6, 0.06]} m="#3a3a3a" cast={false} />)}
        <Box s={[5.6, 1.35, 0.14]} m={WOOD_DARK} />
        {tex && [0.075, -0.075].map((o, k) => (
          <mesh key={k} position={[0, 0, o]} rotation={[0, k ? Math.PI : 0, 0]}>
            <planeGeometry args={[5.4, 1.2]} />
            <meshStandardMaterial map={tex} roughness={0.8} />
          </mesh>
        ))}
        <Box p={[0, 0.72, 0]} s={[5.7, 0.12, 0.3]} m="#f4f8fd" cast={false} />
      </group>
      {Array.from({ length: 15 }, (_, i) => {
        const t = i / 14;
        const gx = -W / 2 + W * t;
        const gy = H - 0.12 - Math.sin(Math.PI * t) * 0.16;
        return (
          <group key={i}>
            <mesh position={[gx, gy, 0.32]} material={flatMat("#2c5a3c")}><icosahedronGeometry args={[0.24, 0]} /></mesh>
            {i % 2 === 0 && <mesh position={[gx, gy - 0.22, 0.42]} material={flatMat(["#e63946", "#ffd166", "#4cc9f0"][(i / 2) % 3], { emissive: ["#e63946", "#ffd166", "#4cc9f0"][(i / 2) % 3] })}><sphereGeometry args={[0.1, 8, 6]} /></mesh>}
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE TRAIL MAP — the whole valley painted on a board at the arrival.
// ---------------------------------------------------------------------------
function mapTexture() {
  if (typeof document === "undefined") return null;
  ensureSnowStructures();
  const W = 640, H = 600;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#dfe8f2"; g.fillRect(0, 0, W, H);
  const fx = SNOW_BOUNDARY.halfW + 6, fz = SNOW_BOUNDARY.halfD + 6;
  const m = 22, top = 40;
  const sx = (W - m * 2) / (fx * 2), sz = (H - m * 2 - top) / (fz * 2);
  const P = (x, z) => [m + (x + fx) * sx, m + top + (z + fz) * sz];
  const cols = getSnowGroundColours();
  const { h } = getSnowGrid();
  const img = g.getImageData(0, 0, W, H);
  for (let py = m + top; py < H - m; py++) {
    for (let px = m; px < W - m; px++) {
      const x = (px - m) / sx - fx, z = (py - m - top) / sz - fz;
      const i = Math.round(x - GRID.xMin), j = Math.round(z - GRID.zMin);
      const k = j * GRID.nx + i;
      const shade = 1 + (h[k] - h[k + 1]) * 0.22 + (h[k] - h[k + GRID.nx]) * 0.16;
      const o = (py * W + px) * 4;
      const c = (v) => Math.max(0, Math.min(255, Math.pow(v, 1 / 2.2) * 255 * shade * 0.9 + 10));
      let r = c(cols[k * 3]), gg = c(cols[k * 3 + 1]), b = c(cols[k * 3 + 2]);
      if (lakeEdgeDist(x, z) < 0) { r = 70; gg = 130; b = 185; }
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b;
    }
  }
  g.putImageData(img, 0, 0);
  const line = (pts, col, wdt, dash = []) => {
    g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash); g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke();
    g.setLineDash([]);
  };
  line(FROZEN_RIVER.pts, "#8fd0ee", 5);
  for (const p of SNOW_TRAILS) line(p.pts, "#7a5a3c", 2.6);
  for (const c of SNOW_CHUTE_PATHS) line(c.pts, "#d0342c", 4, [8, 5]);
  line([LIFT.from, LIFT.to], "#2b2f36", 2.4, [3, 4]);
  g.fillStyle = "#2f6fb5"; g.font = "bold 22px Georgia, serif"; g.textAlign = "center";
  g.fillText("SNOWBALL SUMS — TRAIL MAP", W / 2, 34);
  g.font = "bold 15px Georgia, serif";
  const tag = (x, z, label, red) => {
    const [px, py] = P(x, z);
    const w = g.measureText(label).width + 10;
    g.fillStyle = red ? "rgba(255,250,240,0.93)" : "rgba(235,244,255,0.88)";
    g.fillRect(px - w / 2, py - 11, w, 21);
    g.strokeStyle = red ? "#c0392b" : "#2f6fb5"; g.lineWidth = 2; g.strokeRect(px - w / 2, py - 11, w, 21);
    g.fillStyle = "#1d2a3a"; g.fillText(label, px, py + 5);
  };
  for (const s of SNOW_CHALLENGE_SPOTS) tag(s.center[0], s.center[1], s.label, true);
  tag(-8, 43, "Lodge", false);
  tag(GS.position[0], GS.position[1] - 8, "Snowman Hill", false);
  tag(120, -32, "Big Sled Hill", false);
  tag(SNOW_LAKE.center[0] + 22, SNOW_LAKE.center[1] + 14, "Glacier Lake", false);
  tag(-46, -48, "Frozen River", false);
  tag(LIFT.from[0] - 8, LIFT.from[1] + 6, "Chairlift", false);
  {
    const [a, b] = P(SNOW_SPAWN.x, SNOW_SPAWN.z);
    g.fillStyle = "#e63946"; g.beginPath(); g.arc(a, b, 8, 0, 7); g.fill();
    g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#e63946"; g.font = "bold 16px Georgia, serif"; g.fillText("YOU ARE HERE", a, b - 14);
  }
  g.fillStyle = "#1d2a3a"; g.font = "bold 18px Georgia, serif"; g.fillText("N ↑", W - 40, 30);
  g.strokeStyle = "#2f5f9a"; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function MapBoard() {
  const B = SNOW_MAP_BOARD;
  const [x, z] = B.position;
  const tex = useMemo(mapTexture, []);
  return (
    <group position={[x, Y(x, z), z]} rotation={[0, B.rotationY, 0]}>
      {[-1, 1].map((s) => <Box key={s} p={[s * 1.7, 1.4, -0.05]} s={[0.18, 2.8, 0.18]} m={WOOD_DARK} />)}
      <Box p={[0, 1.85, -0.08]} s={[3.5, 3.2, 0.1]} m={WOOD} />
      {tex && (
        <mesh position={[0, 1.85, -0.02]}>
          <planeGeometry args={[3.3, 3.1]} />
          <meshStandardMaterial map={tex} roughness={0.9} />
        </mesh>
      )}
      <Box p={[0, 3.6, 0.1]} r={[0.45, 0, 0]} s={[3.9, 0.14, 0.7]} m={WOOD_DARK} />
      <Box p={[0, 3.72, 0.12]} r={[0.45, 0, 0]} s={[4.0, 0.12, 0.72]} m="#f4f8fd" cast={false} />
    </group>
  );
}

function WelcomeBoard() {
  const [x, z] = SNOW_WELCOME_SIGN.position;
  const tex = useMemo(() => signTexture(["Welcome!", "Explore the valley ❄"], { w: 512, h: 220, bg: "#7a4f2c", font: "bold 76px Georgia, serif", sub: "bold 40px Georgia, serif" }), []);
  return (
    <group position={[x, Y(x, z), z]} rotation={[0, SNOW_WELCOME_SIGN.rotationY, 0]}>
      {[-0.85, 0.85].map((px) => <Cyl key={px} p={[px, 0.95, 0]} rt={0.09} rb={0.11} h={1.9} seg={8} m={WOOD_DARK} />)}
      <Box p={[0, 1.55, 0]} s={[2.4, 1.05, 0.12]} m={WOOD} />
      {tex && <mesh position={[0, 1.55, 0.07]}><planeGeometry args={[2.3, 0.98]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>}
      <Box p={[0, 2.13, 0]} s={[2.55, 0.14, 0.2]} m="#f4f8fd" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE GIANT SNOWMAN on Snowman Hill (≈ 18 m with his hat).
// ---------------------------------------------------------------------------
function giantSnowmanGeometry() {
  const parts = [];
  const snow = (x, y, z, nx, ny) => C("#f6f9fe").lerp(C("#d3deee"), Math.max(0, -ny) * 0.5 + (vnoise3(x * 0.6, y * 0.6, z * 0.6) - 0.5) * 0.12);
  const ball = (r, y) => {
    const g = new THREE.SphereGeometry(r, 36, 26);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), yy = p.getY(i), z = p.getZ(i);
      const k = 1 + (vnoise3(x * 0.45 + 3, yy * 0.45, z * 0.45) - 0.5) * 0.06;
      p.setXYZ(i, x * k, yy * k * 0.94, z * k);
    }
    g.computeVertexNormals();
    g.translate(0, y, 0);
    parts.push(finish(g, snow, 0));
  };
  ball(4.4, 3.6);
  ball(3.15, 9.4);
  ball(2.25, 13.75);
  const add = (g, col) => parts.push(finish(g, typeof col === "string" ? C(col) : col, 0));
  // Coal eyes + smile + buttons (all on the +z face).
  for (const [x, y] of [[-0.75, 14.35], [0.75, 14.35]]) { const g = new THREE.SphereGeometry(0.26, 8, 6); g.translate(x, y, 2.05); add(g, "#22252c"); }
  for (let k = 0; k < 7; k++) {
    const a = -0.9 + (k / 6) * 1.8;
    const g = new THREE.SphereGeometry(0.15, 6, 5);
    g.translate(Math.sin(a) * 1.15, 13.2 - Math.cos(a) * 0.45, 2.0 + Math.cos(a) * 0.15);
    add(g, "#22252c");
  }
  for (const y of [10.6, 9.4, 8.2]) { const g = new THREE.SphereGeometry(0.3, 8, 6); g.translate(0, y, 3.05 - Math.abs(y - 9.4) * 0.12); add(g, "#22252c"); }
  // The carrot nose.
  { const g = new THREE.ConeGeometry(0.34, 2.0, 10); g.rotateX(Math.PI / 2); g.translate(0, 13.8, 3.1); add(g, "#e8813a"); }
  // The scarf (a ring + a hanging tail).
  { const g = new THREE.TorusGeometry(2.35, 0.42, 8, 24); g.rotateX(Math.PI / 2); g.translate(0, 11.85, 0);
    add(g, (x, y, z) => (Math.floor((Math.atan2(z, x) + Math.PI) * 2.5) % 2 ? C("#d0342c") : C("#f2f2f2"))); }
  { const g = new THREE.BoxGeometry(0.9, 2.6, 0.32); g.rotateZ(0.12); g.translate(1.3, 10.6, 2.45); add(g, (x, y) => (Math.floor(y * 2) % 2 ? C("#d0342c") : C("#f2f2f2"))); }
  // The top hat.
  { const g = new THREE.CylinderGeometry(2.2, 2.2, 0.22, 20); g.translate(0, 15.75, 0); add(g, "#23262e"); }
  { const g = new THREE.CylinderGeometry(1.45, 1.4, 2.1, 20); g.translate(0, 16.9, 0); add(g, "#23262e"); }
  { const g = new THREE.CylinderGeometry(1.43, 1.43, 0.36, 20); g.translate(0, 16.0, 0); add(g, "#c0392b"); }
  { const g = new THREE.SphereGeometry(1.45, 16, 6, 0, Math.PI * 2, 0, 0.6); g.scale(1, 0.4, 1); g.translate(0, 17.9, 0); add(g, "#f4f8fd"); }
  // Stick arms — one waving.
  const arm = (a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(r * 0.6, r, A.distanceTo(B), 6);
    g.translate(0, A.distanceTo(B) / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate(A.x, A.y, A.z);
    add(g, "#5b4030");
  };
  arm([2.7, 10.2, 0], [6.4, 13.6, 0.4], 0.22);
  arm([5.6, 12.8, 0.3], [6.6, 12.6, 1.0], 0.1);
  arm([-2.7, 9.8, 0], [-6.4, 8.4, 0.8], 0.22);
  arm([-5.6, 8.7, 0.6], [-6.5, 9.6, 0.9], 0.1);
  return merge(parts);
}
function GiantSnowman() {
  const geo = useMemo(giantSnowmanGeometry, []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-giant", roughness: 0.9 }), []);
  const [x, z] = GIANT_SNOWMAN.position;
  return <mesh geometry={geo} material={mat} position={[x, Y(x, z) - 0.6, z]} rotation={[0, GIANT_SNOWMAN.rotationY, 0]} castShadow receiveShadow />;
}

// ---------------------------------------------------------------------------
// THE ICE CAVE MOUTH — a rocky hooded entrance in the escarpment foot.
// ---------------------------------------------------------------------------
function caveGeometry() {
  const parts = [];
  const { r, depth } = CAVE_MOUTH;
  // The hood: a half-tube of rock running back into the cliff.
  const outer = new THREE.CylinderGeometry(r + 0.9, r + 0.9, depth, 22, 4, true, -Math.PI / 2, Math.PI);
  outer.rotateX(-Math.PI / 2);
  outer.translate(0, 0, -depth / 2);
  const p = outer.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = vnoise3(x * 0.5 + 7, y * 0.5, z * 0.5) - 0.5;
    p.setXYZ(i, x * (1 + n * 0.25), Math.max(-0.4, y * (1 + n * 0.2)), z);
  }
  outer.computeVertexNormals();
  parts.push(finish(outer, (x, y, z, nx, ny) => (ny > 0.45 + (vnoise3(x, y, z) - 0.5) * 0.3 ? C("#eef4fb") : C("#5d6573").lerp(C("#8a93a1"), vnoise3(x * 1.3, y * 1.3, z))), 0));
  // Rocks framing the arch.
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (k / 10);
    const rr = r + 0.5;
    const g = buildSnowRock(k * 7 + 3);
    const s = 1.1 + vnoise3(k, 2, 3) * 0.9;
    g.scale(s, s * (0.8 + 0.4 * vnoise3(k, 5, 1)), s);
    g.rotateY(k * 1.3);
    g.translate(Math.cos(a) * rr, Math.sin(a) * rr - 0.6, 0.3);
    parts.push(g);
  }
  return merge(parts);
}
function caveInnerGeometry() {
  const { r, depth } = CAVE_MOUTH;
  const inner = new THREE.CylinderGeometry(r, r, depth, 22, 1, true, -Math.PI / 2, Math.PI);
  inner.rotateX(-Math.PI / 2);
  inner.translate(0, 0, -depth / 2);
  const back = new THREE.CircleGeometry(r, 22, 0, Math.PI);
  back.translate(0, 0, -depth + 0.05);
  return [inner, back];
}
function icicleCurtain() {
  const parts = [];
  const { r } = CAVE_MOUTH;
  for (let k = 0; k < 22; k++) {
    const a = 0.18 + (Math.PI - 0.36) * (k / 21);
    const L = 0.5 + vnoise3(k * 1.7, 1, 2) * 1.4 * Math.sin(a);
    const g = new THREE.ConeGeometry(0.12 + L * 0.05, L, 5);
    g.rotateX(Math.PI);
    g.translate(Math.cos(a) * (r - 0.1), Math.sin(a) * (r - 0.1) - L / 2, 0.2);
    parts.push(finish(g, (x, y) => C("#bfe9fb").lerp(C("#ffffff"), 0.4), 0));
  }
  return merge(parts);
}
function CaveMouth() {
  const geo = useMemo(caveGeometry, []);
  const [inner, back] = useMemo(caveInnerGeometry, []);
  const ice = useMemo(icicleCurtain, []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-cave", roughness: 0.92, flat: true }), []);
  const iceMat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-icicle", roughness: 0.15, emissive: "#14303d" }), []);
  const glow = useRef();
  useFrame((state) => {
    if (glow.current) glow.current.material.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 0.9) * 0.05;
  });
  const y = snowPadLevel("cave");
  const rocks = CAVE_ROCKS;
  const pillarGeo = useMemo(() => {
    const parts = rocks.map(([x, z, rr], i) => {
      const g = buildSnowRock(i * 11 + 5, { crag: true });
      g.scale(rr * 0.75, rr * 0.9, rr * 0.75);
      g.rotateY(i * 2.1);
      g.translate(x, Y(x, z) - 0.4, z);
      return g;
    });
    return merge(parts);
  }, [rocks]);
  return (
    <group>
      <group position={[CAVE_MOUTH.x, y, CAVE_MOUTH.z]}>
        <mesh geometry={geo} material={mat} castShadow receiveShadow />
        <mesh geometry={inner}><meshStandardMaterial color="#101826" side={THREE.BackSide} roughness={1} /></mesh>
        <mesh geometry={back}><meshStandardMaterial color="#0b111c" roughness={1} /></mesh>
        <mesh geometry={ice} material={iceMat} />
        {/* A cold blue glow deep inside (crystals in the dark). */}
        <mesh ref={glow} position={[0, 1.2, -0.15]}>
          <circleGeometry args={[1.5, 20]} />
          <meshBasicMaterial color="#5fd0ff" transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {[[-2.6, 0.9], [-1.9, 0.55], [2.4, 1.2], [3.1, 0.6], [1.6, 0.45]].map(([cx, cs], i) => (
          <mesh key={i} position={[cx, cs * 0.8, 0.1 - (i % 2) * 0.3]} rotation={[0, i, (cx > 0 ? -1 : 1) * 0.25]}>
            <coneGeometry args={[0.35 * cs, 1.8 * cs, 6]} />
            <meshStandardMaterial color="#9fe3f5" emissive="#3fb6e0" emissiveIntensity={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <mesh geometry={pillarGeo} material={mat} castShadow receiveShadow />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SNOWMEN + DECORATED TREES
// ---------------------------------------------------------------------------
const HATS = ["#23262e", "#c0392b", "#2f6fb5", "#2e8b57"];
const SCARVES = ["#d64545", "#3a86ff", "#ffbe0b", "#8e44ad", "#2e8b57"];
function Snowman({ x, z, i, scale = 1 }) {
  const y = Y(x, z);
  const hat = HATS[i % HATS.length], scarf = SCARVES[i % SCARVES.length];
  const kind = i % 3; // top hat · bobble beanie · bucket
  return (
    <group position={[x, y - 0.1, z]} rotation={[0, (x * 7 + z * 3) % 6.28, 0]} scale={scale}>
      {[[0.62, 0.62], [1.42, 0.46], [2.02, 0.32]].map(([yy, r], k) => (
        <mesh key={k} castShadow position={[0, yy, 0]} material={flatMat("#f6f9ff", { roughness: 0.9 })}><sphereGeometry args={[r, 14, 12]} /></mesh>
      ))}
      {[[-0.1, 2.1, 0.28], [0.1, 2.1, 0.28], [0, 1.5, 0.44], [0, 1.32, 0.45], [0, 1.14, 0.44]].map((p, k) => (
        <mesh key={k} position={p} material={flatMat("#2b2b2b")}><sphereGeometry args={[0.035, 6, 5]} /></mesh>
      ))}
      <mesh position={[0, 2.0, 0.42]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#e8813a")}><coneGeometry args={[0.05, 0.3, 8]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.55, 1.5, 0]} rotation={[0, 0, s * -0.9]} material={flatMat("#6b4a2e")}><cylinderGeometry args={[0.03, 0.04, 0.8, 5]} /></mesh>
      ))}
      <mesh position={[0, 1.78, 0]} material={flatMat(scarf)}><torusGeometry args={[0.3, 0.06, 8, 14]} /></mesh>
      {kind === 0 && (
        <>
          <mesh position={[0, 2.32, 0]} material={flatMat(hat)}><cylinderGeometry args={[0.24, 0.24, 0.05, 12]} /></mesh>
          <mesh castShadow position={[0, 2.46, 0]} material={flatMat(hat)}><cylinderGeometry args={[0.15, 0.15, 0.26, 12]} /></mesh>
        </>
      )}
      {kind === 1 && (
        <>
          <mesh position={[0, 2.26, 0]} material={flatMat(scarf)}><sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 2.54, 0]} material={flatMat("#ffffff")}><sphereGeometry args={[0.08, 8, 6]} /></mesh>
        </>
      )}
      {kind === 2 && <mesh position={[0, 2.38, 0]} rotation={[0.2, 0, 0.15]} material={flatMat("#8a96a3", { metalness: 0.5, roughness: 0.4 })}><cylinderGeometry args={[0.17, 0.22, 0.3, 12]} /></mesh>}
    </group>
  );
}
function XmasTree({ x, z, scale = 1, seed = 0 }) {
  const y = Y(x, z);
  const baubles = useMemo(() => {
    const cols = ["#e63946", "#ffd166", "#4cc9f0", "#f4a261", "#c77dff"];
    const out = [];
    for (let i = 0; i < 16; i++) {
      const tier = i % 4;
      const a = (i / 16) * Math.PI * 2 * 3 + seed;
      const r = [0.95, 0.78, 0.58, 0.38][tier];
      const yy = [1.25, 1.75, 2.3, 2.8][tier];
      out.push({ x: Math.cos(a) * r, y: yy, z: Math.sin(a) * r, col: cols[i % cols.length] });
    }
    return out;
  }, [seed]);
  return (
    <group position={[x, y - 0.05, z]} scale={scale}>
      <mesh castShadow position={[0, 0.45, 0]} material={flatMat(WOOD_DARK)}><cylinderGeometry args={[0.16, 0.22, 0.9, 7]} /></mesh>
      {[[1.15, 1.15, 1.5], [1.8, 0.9, 1.3], [2.45, 0.66, 1.1], [3.0, 0.42, 0.9]].map(([yy, r, hh], k) => (
        <group key={k}>
          <mesh castShadow position={[0, yy, 0]} material={flatMat(k % 2 ? "#2f6e4f" : "#28604a")}><coneGeometry args={[r, hh, 9]} /></mesh>
          <mesh position={[0, yy + hh * 0.2, 0]} material={flatMat("#eef4fd")}><coneGeometry args={[r * 0.8, hh * 0.28, 9]} /></mesh>
        </group>
      ))}
      {baubles.map((b, k) => (
        <mesh key={k} position={[b.x, b.y, b.z]} material={flatMat(b.col, { emissive: b.col, roughness: 0.3 })}><sphereGeometry args={[0.085, 8, 7]} /></mesh>
      ))}
      <mesh position={[0, 3.6, 0]} rotation={[0, 0, Math.PI / 10]} material={new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffc23a", emissiveIntensity: 1.6 })}>
        <cylinderGeometry args={[0.22, 0.22, 0.07, 5]} />
      </mesh>
    </group>
  );
}
/** Gift boxes under the village tree. */
function Gifts({ x, z }) {
  const y = Y(x, z);
  const cols = [["#d0342c", "#ffd166"], ["#2f6fb5", "#ffffff"], ["#2e8b57", "#ffd166"], ["#8e44ad", "#ffffff"], ["#ffbe0b", "#d0342c"]];
  return (
    <group position={[x, y, z]}>
      {cols.map(([c, rb], i) => {
        const a = i * 1.26 + 0.4, r = 1.9 + (i % 2) * 0.4, s = 0.45 + (i % 3) * 0.14;
        return (
          <group key={i} position={[Math.cos(a) * r, s / 2, Math.sin(a) * r]} rotation={[0, a, 0]}>
            <Box s={[s, s, s]} m={c} />
            <Box s={[s + 0.02, s + 0.02, 0.08]} m={rb} cast={false} />
            <Box s={[0.08, s + 0.02, s + 0.02]} m={rb} cast={false} />
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// IDLE DRESSING at each challenge's collider spots.
// ---------------------------------------------------------------------------
function PlainFir({ x, z, h = 5.2 }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 0.5, 0]} rt={0.18} rb={0.24} h={1} seg={7} m={WOOD_DARK} />
      {[[1.3, 1.5, 2.0], [2.4, 1.15, 1.7], [3.4, 0.8, 1.4], [4.3, 0.45, 1.1]].map(([yy, r, hh], k) => (
        <group key={k}>
          <mesh castShadow position={[0, yy, 0]} material={flatMat("#2a5a40")}><coneGeometry args={[r, hh, 9]} /></mesh>
          <mesh position={[0, yy + hh * 0.22, 0]} material={flatMat("#eef4fd")}><coneGeometry args={[r * 0.8, hh * 0.28, 9]} /></mesh>
        </group>
      ))}
    </group>
  );
}
function LightsBox({ x, z }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      <Box p={[0, 0.35, 0]} s={[1.2, 0.7, 0.8]} m="#8a5a32" />
      {[-0.3, 0, 0.3].map((dx, i) => (
        <mesh key={i} position={[dx, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} material={flatMat(["#ffd166", "#4cc9f0", "#e63946"][i], { emissive: ["#ffd166", "#4cc9f0", "#e63946"][i] })}>
          <torusGeometry args={[0.16, 0.05, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
}
function Plinth({ x, z, w = 1.6 }) {
  return <Box p={[x, Y(x, z) + 0.2, z]} s={[w, 0.4, w]} m={flatMat("#ffffff", { map: getSnowTextures().blocks })} tile={1.2} />;
}
function CocoaStall({ x, z }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      <Box p={[0, 0.55, 0]} s={[2.4, 1.1, 0.9]} m="#7a4f2c" />
      <Box p={[0, 1.14, 0]} s={[2.6, 0.08, 1.1]} m="#f3ead6" />
      {[-1.1, 1.1].map((dx) => <Box key={dx} p={[dx, 1.6, -0.35]} s={[0.1, 2.0, 0.1]} m={WOOD_DARK} />)}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} p={[-1.05 + i * 0.42, 2.62, 0.1]} r={[0.35, 0, 0]} s={[0.42, 0.06, 1.3]} m={i % 2 ? "#ffffff" : "#c0392b"} />
      ))}
      <Cyl p={[0.6, 1.33, 0]} rt={0.14} rb={0.12} h={0.3} seg={10} m="#f3ead6" />
      <Cyl p={[-0.4, 1.36, 0.1]} rt={0.22} rb={0.22} h={0.36} seg={12} m="#8a96a3" />
    </group>
  );
}
function Chalkboard({ x, z }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      {[-0.7, 0.7].map((dx) => <Box key={dx} p={[dx, 0.8, 0]} s={[0.1, 1.6, 0.1]} m={WOOD_DARK} />)}
      <Box p={[0, 1.2, 0.02]} s={[1.6, 1.0, 0.06]} m="#2e3a33" />
      <Box p={[0, 1.74, 0]} s={[1.7, 0.08, 0.14]} m="#f4f8fd" cast={false} />
    </group>
  );
}
function TargetBoard({ x, z }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      {[-0.8, 0.8].map((dx) => <Box key={dx} p={[dx, 1.0, 0]} s={[0.12, 2.0, 0.12]} m={WOOD_DARK} />)}
      <Box p={[0, 1.4, 0.03]} s={[1.9, 1.3, 0.08]} m="#7a4f2c" />
      {[[0.55, "#ffffff"], [0.4, "#d0342c"], [0.25, "#ffffff"], [0.11, "#d0342c"]].map(([r, c], i) => (
        <mesh key={i} position={[0, 1.4, 0.08 + i * 0.005]} material={flatMat(c)}><circleGeometry args={[r, 20]} /></mesh>
      ))}
    </group>
  );
}
function SledMarkers() {
  // Marker poles up the groomed Sledding Slope run (the challenge's own
  // number window replaces them while it runs).
  const { z, xBottom, xTop } = SLOPE_LANE;
  return (
    <group>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const x = xBottom + (xTop - xBottom) * t;
        return [-1, 1].map((s) => {
          const zz = z + s * 2.6;
          return (
            <group key={`${i}${s}`} position={[x, Y(x, zz), zz]}>
              <Cyl p={[0, 0.7, 0]} rt={0.04} rb={0.05} h={1.4} seg={6} m="#f4f8fd" />
              <Box p={[0, 1.25, 0]} s={[0.08, 0.3, 0.4]} m={i % 2 ? "#2f6fb5" : "#d0342c"} cast={false} />
            </group>
          );
        });
      })}
    </group>
  );
}
function IdleDressing({ active }) {
  return (
    <group>
      {active !== "range" && <TargetBoard x={RANGE_FRAME_POS[0]} z={RANGE_FRAME_POS[1]} />}
      {active !== "grove" && (
        <>
          <PlainFir x={GROVE_TREE_POS[0]} z={GROVE_TREE_POS[1]} />
          <LightsBox x={GROVE_BOX_POS[0]} z={GROVE_BOX_POS[1]} />
        </>
      )}
      {active !== "meadow" && (
        <>
          <Snowman x={MEADOW_TOWER_LEFT[0]} z={MEADOW_TOWER_LEFT[1]} i={1} scale={1.1} />
          <Snowman x={MEADOW_TOWER_RIGHT[0]} z={MEADOW_TOWER_RIGHT[1]} i={2} scale={1.1} />
        </>
      )}
      {active !== "village" && (
        <>
          <Plinth x={VILLAGE_LEFT_STAND[0]} z={VILLAGE_LEFT_STAND[1]} />
          <Plinth x={VILLAGE_RIGHT_STAND[0]} z={VILLAGE_RIGHT_STAND[1]} />
          <Plinth x={VILLAGE_BUILD_SITE[0]} z={VILLAGE_BUILD_SITE[1]} w={2.2} />
        </>
      )}
      {active !== "yard" && (
        <>
          <CocoaStall x={YARD_STALL[0]} z={YARD_STALL[1]} />
          <Chalkboard x={YARD_BOARD[0]} z={YARD_BOARD[1]} />
        </>
      )}
      {active !== "sled" && <SledMarkers />}
    </group>
  );
}

export default function SnowLandmarks({ activeKey }) {
  const big = VILLAGE_TREE;
  return (
    <group>
      <StaticBatch farDist={FAR}>
        <WelcomeArch />
        <MapBoard />
        <WelcomeBoard />
        {SNOWMEN.map(([x, z], i) => <Snowman key={i} x={x} z={z} i={i} />)}
        {XMAS_TREES.filter(([x, z]) => !(x === big[0] && z === big[1])).map(([x, z], i) => <XmasTree key={i} x={x} z={z} seed={i} scale={1.15 + (i % 3) * 0.12} />)}
        <XmasTree x={big[0]} z={big[1]} scale={2.4} seed={7} />
        <Gifts x={big[0]} z={big[1]} />
      </StaticBatch>
      <GiantSnowman />
      <CaveMouth />
      <IdleDressing active={activeKey} />
    </group>
  );
}
