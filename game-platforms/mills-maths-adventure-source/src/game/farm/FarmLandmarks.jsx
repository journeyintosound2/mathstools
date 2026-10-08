import React, { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import {
  FARM_ENTRY_ARCH, FARM_MAP_BOARD, FARM_SIGNPOSTS, FARM_BIG_WINDMILL, FARM_POND, FARM_PICNIC, FARM_SCARECROW, BIG_AMBER,
  MILK_TRUCK, FARM_MUD, FARM_AREAS, BOUNDARY_FENCE, TRADE_AREA, FARM_SPAWN, FARM_WELCOME_SIGN,
} from "../../data/farm/farmLayout.js";
import {
  terrainHeight, FARM_BRIDGES, ensureFarmStructures, FARM_PATHS, GRID, getFarmGrid, POND_LEVEL, FARM_CREEK,
} from "../../data/farm/farmTerrain.js";
import { FARM_FOOTPRINTS } from "../../data/farm/farmProps.js";
import { getGroundColours } from "./FarmTerrain.jsx";
import { buildAmber } from "./farmGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { finish, merge } from "../jungle/jungleGeometry.js";
import { flatMat, signTexture, getFarmTextures } from "./farmMaterials.js";
import { Box, Cyl, Rod } from "./farmKit.jsx";
import { SignBoard } from "./FarmBuildings.jsx";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { playerState } from "../sessionStore.js";

/**
 * FARM LANDMARKS — the timber FARM GATE arch (with its cattle grid + flower
 * barrels), the painted MAP of the farm, the finger-post SIGNPOSTS, the
 * timber BRIDGES over the creek, the big four-sail WINDMILL on Windmill Hill
 * (its sails turn), the Market Green's bunting + marquee, the duck pond's
 * jetty, the summit picnic spot, the scarecrow, the big liquid amber with its
 * kickable leaf carpet, the milk tanker and the pig pen's mud splashes.
 */
const Y = (x, z) => terrainHeight(x, z);
const WOOD = "#7a5a3c", WOOD_DARK = "#5a3f28";

// ---------------------------------------------------------------------------
// THE FARM GATE — two big timber posts, a crossbeam, a hanging sign.
// ---------------------------------------------------------------------------
function EntryArch() {
  const A = FARM_ENTRY_ARCH;
  const [x, z] = A.position;
  const y = Y(x, z);
  const tex = useMemo(() => signTexture([A.text, "½ · ¼ · ⅓ · 75% · 0.5"], { w: 1024, h: 256, bg: "#8a5a32", fg: "#fff6dc", font: "bold 118px Georgia, serif", sub: "bold 52px Georgia, serif" }), [A.text]);
  const W = A.width, H = A.height;
  return (
    <group position={[x, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * W) / 2, 0, 0]}>
          <Cyl p={[0, H / 2, 0]} rt={0.26} rb={0.32} h={H} seg={10} m={WOOD_DARK} />
          <Cyl p={[0, 0.25, 0]} rt={0.45} rb={0.5} h={0.5} seg={10} m="#8f8a7c" />
          {/* Flower barrels at the gate posts. */}
          <group position={[s * 1.1, 0, 1.0]}>
            <Cyl p={[0, 0.35, 0]} rt={0.48} rb={0.42} h={0.7} seg={12} m={WOOD} />
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} position={[Math.cos(k * 1.3) * 0.25, 0.8, Math.sin(k * 1.3) * 0.25]} material={flatMat(k % 2 ? "#ff6fae" : "#ffd23f", { roughness: 0.6 })}>
                <icosahedronGeometry args={[0.16, 0]} />
              </mesh>
            ))}
            <mesh position={[0, 0.72, 0]} material={flatMat("#4f8f30")}><sphereGeometry args={[0.36, 8, 5]} /></mesh>
          </group>
        </group>
      ))}
      <Box p={[0, H - 0.25, 0]} s={[W + 1.4, 0.42, 0.42]} m={WOOD_DARK} />
      <Box p={[0, H + 0.12, 0]} s={[W + 0.4, 0.22, 0.3]} m={WOOD} />
      {[-1, 1].map((s) => <Box key={s} p={[s * (W / 2 - 0.9), H - 0.95, 0]} r={[0, 0, s * 0.75]} s={[1.9, 0.18, 0.18]} m={WOOD} />)}
      {/* The hanging sign. */}
      <group position={[0, H - 1.45, 0]}>
        {[-1, 1].map((s) => <Rod key={s} a={[s * 2.2, 1.0, 0]} b={[s * 2.2, 0.5, 0]} r={0.025} m="#3a3a3a" cast={false} />)}
        <Box s={[5.0, 1.15, 0.12]} m={WOOD_DARK} />
        {tex && [0.065, -0.065].map((o, k) => (
          <mesh key={k} position={[0, 0, o]} rotation={[0, k ? Math.PI : 0, 0]}>
            <planeGeometry args={[4.8, 1.0]} />
            <meshStandardMaterial map={tex} roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* The cattle grid across the drive. */}
      <Box p={[0, 0.02, 0]} s={[W - 1.2, 0.06, 2.4]} m="#3b3a36" cast={false} />
      {Array.from({ length: 11 }).map((_, k) => <Box key={k} p={[0, 0.07, -1.1 + k * 0.22]} s={[W - 1.1, 0.06, 0.07]} m={flatMat("#8a8f92", { metalness: 0.6, roughness: 0.4 })} cast={false} />)}
      {/* The letterbox (an old milk can on a post). */}
      <group position={[W / 2 + 1.6, 0, 1.6]}>
        <Box p={[0, 0.55, 0]} s={[0.12, 1.1, 0.12]} m={WOOD} />
        <Cyl p={[0, 1.35, 0]} r={[0, 0, Math.PI / 2]} rt={0.22} rb={0.22} h={0.6} seg={12} m="#c43a2a" />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE FARM MAP — a painted map of the whole property on a timber board.
// ---------------------------------------------------------------------------
function mapTexture() {
  if (typeof document === "undefined") return null;
  ensureFarmStructures();
  const W = 640, H = 568;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#e9dcb8"; g.fillRect(0, 0, W, H);
  const fx = BOUNDARY_FENCE.halfW, fz = BOUNDARY_FENCE.halfD;
  const m = 26;
  const sx = (W - m * 2) / (fx * 2), sz = (H - m * 2 - 30) / (fz * 2);
  const P = (x, z) => [m + (x + fx) * sx, m + 30 + (z + fz) * sz];
  // Ground: the terrain's colours, softened + hill-shaded.
  const cols = getGroundColours();
  const { h } = getFarmGrid();
  const img = g.getImageData(0, 0, W, H);
  for (let py = m + 30; py < H - m; py++) {
    for (let px = m; px < W - m; px++) {
      const x = (px - m) / sx - fx, z = (py - m - 30) / sz - fz;
      const i = Math.round(x - GRID.xMin), j = Math.round(z - GRID.zMin);
      const k = j * GRID.nx + i;
      const shade = 1 + (h[k] - h[k + 1]) * 0.18 + (h[k] - h[k + GRID.nx]) * 0.12;
      const o = (py * W + px) * 4;
      const c = (v) => Math.max(0, Math.min(255, Math.pow(v, 1 / 2.2) * 255 * shade * 0.92 + 18));
      img.data[o] = c(cols[k * 3]); img.data[o + 1] = c(cols[k * 3 + 1]); img.data[o + 2] = c(cols[k * 3 + 2]);
    }
  }
  g.putImageData(img, 0, 0);
  // The creek + pond.
  g.strokeStyle = "#4f9fd0"; g.lineWidth = 5; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); FARM_CREEK.pts.forEach(([x, z], i) => { const [a, b] = P(Math.max(-fx, x), z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke();
  g.fillStyle = "#4f9fd0"; { const [a, b] = P(FARM_POND.center[0], FARM_POND.center[1]); g.beginPath(); g.arc(a, b, FARM_POND.radius * sx, 0, 7); g.fill(); }
  // Tracks.
  g.strokeStyle = "#8a6438"; g.lineWidth = 3.4; g.setLineDash([]);
  for (const p of FARM_PATHS) { g.beginPath(); p.pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); }
  // Buildings.
  g.fillStyle = "#7a3a2a";
  for (const f of FARM_FOOTPRINTS) {
    if (!/barn|house|shed|mill|silo|glass|coop/.test(f.id)) continue;
    const [a, b] = P(f.x, f.z);
    if (f.shape === "circle") { g.beginPath(); g.arc(a, b, Math.max(2, f.r * sx), 0, 7); g.fill(); }
    else { g.save(); g.translate(a, b); g.rotate(-f.rot); g.fillRect((-f.w / 2) * sx, (-f.d / 2) * sz, f.w * sx, f.d * sz); g.restore(); }
  }
  // The fence + title.
  g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.setLineDash([6, 4]);
  { const [a, b] = P(-fx, -fz); const [c, d] = P(fx, fz); g.strokeRect(a, b, c - a, d - b); }
  g.setLineDash([]);
  g.fillStyle = "#4f321b"; g.font = "bold 30px Georgia, serif"; g.textAlign = "center";
  g.fillText("FRACTION FARM", W / 2, 36);
  // Area names with their icons.
  g.font = "bold 17px Georgia, serif";
  for (const a of FARM_AREAS) {
    const [px, py] = P(a.c[0], a.c[1]);
    const label = `${a.icon} ${a.name}`;
    const w = g.measureText(label).width + 12;
    g.fillStyle = a.challenge ? "rgba(255,248,225,0.92)" : "rgba(235,245,225,0.85)";
    g.fillRect(px - w / 2, py - 13, w, 24);
    g.strokeStyle = a.challenge ? "#c0392b" : "#5a7a3a"; g.lineWidth = 2; g.strokeRect(px - w / 2, py - 13, w, 24);
    g.fillStyle = "#3b2414"; g.fillText(label, px, py + 5);
  }
  // You are here.
  { const [a, b] = P(FARM_SPAWN.x, FARM_SPAWN.z);
    g.fillStyle = "#e63946"; g.beginPath(); g.arc(a, b, 9, 0, 7); g.fill();
    g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#e63946"; g.font = "bold 18px Georgia, serif"; g.fillText("YOU ARE HERE", a, b + 30); }
  // A compass rose.
  g.fillStyle = "#4f321b"; g.font = "bold 20px Georgia, serif"; g.fillText("N ↑", W - 44, 34);
  g.strokeStyle = "#4f321b"; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function MapBoard() {
  const B = FARM_MAP_BOARD;
  const [x, z] = B.position;
  const tex = useMemo(mapTexture, []);
  return (
    <group position={[x, Y(x, z), z]} rotation={[0, B.rotationY, 0]}>
      {[-1, 1].map((s) => <Box key={s} p={[s * 1.7, 1.3, -0.05]} s={[0.16, 2.6, 0.16]} m={WOOD_DARK} />)}
      <Box p={[0, 1.75, -0.08]} s={[3.5, 2.95, 0.1]} m={WOOD} />
      {tex && (
        <mesh position={[0, 1.75, -0.02]}>
          <planeGeometry args={[3.3, 2.93]} />
          <meshStandardMaterial map={tex} roughness={0.9} />
        </mesh>
      )}
      <Box p={[0, 3.32, 0.05]} r={[0.5, 0, 0]} s={[3.8, 0.1, 0.5]} m={flatMat("#ffffff", { map: getFarmTextures().redIron, metalness: 0.2 })} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNPOSTS — finger-posts at the junctions (each arrow points down its track).
// ---------------------------------------------------------------------------
function Signpost({ s }) {
  const [x, z] = s.at;
  const y = Y(x, z);
  const arrows = useMemo(() => s.arrows.map(([label, to]) => ({
    label, yaw: Math.atan2(-(to[1] - z), to[0] - x),
    tex: signTexture(label, { w: 512, h: 112, font: "bold 54px Georgia, serif", bg: "#8a6038" }),
  })), [s, x, z]);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 1.4, 0]} rt={0.09} rb={0.12} h={2.8} seg={7} m={WOOD_DARK} />
      <mesh position={[0, 2.86, 0]} material={flatMat(WOOD_DARK)}><coneGeometry args={[0.13, 0.18, 7]} /></mesh>
      {arrows.map((a, i) => (
        <group key={i} position={[0, 2.45 - i * 0.46, 0]} rotation={[0, a.yaw, 0]}>
          <Box p={[0.95, 0, 0]} s={[1.9, 0.38, 0.07]} m="#8a6038" />
          <mesh position={[1.98, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={flatMat("#8a6038")}><coneGeometry args={[0.24, 0.3, 3]} /></mesh>
          {a.tex && [0.04, -0.04].map((o, k) => (
            <mesh key={k} position={[0.9, 0, o]} rotation={[0, k ? Math.PI : 0, 0]}>
              <planeGeometry args={[1.76, 0.34]} />
              <meshStandardMaterial map={a.tex} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BRIDGES — arched plank decks with posts + rails, bank to bank.
// ---------------------------------------------------------------------------
function bridgeGeometry(b) {
  const parts = [];
  const C = (h) => new THREE.Color(h);
  const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
  const L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const yaw = Math.atan2(-uz, ux);
  const n = Math.ceil(L / 0.32);
  const hw = b.halfWidth + 0.1;
  const plank = (t, k) => {
    const g = new THREE.BoxGeometry(0.28, 0.08, hw * 2);
    const t2 = Math.min(1, t + 0.01), t1 = Math.max(0, t - 0.01);
    const pitch = Math.atan2(b.deckAt(t2) - b.deckAt(t1), (t2 - t1) * L);
    g.rotateZ(pitch);
    g.rotateY(yaw);
    g.translate(b.from[0] + dx * t, b.deckAt(t) - 0.04, b.from[1] + dz * t);
    const shade = 0.85 + ((k * 37) % 10) / 40;
    return finish(g, C("#8a6a46").multiplyScalar(shade), 0);
  };
  for (let i = 0; i <= n; i++) parts.push(plank(i / n, i));
  // Bearers underneath + posts + top rails each side.
  for (const s of [-1, 1]) {
    const off = hw + 0.12;
    const posts = Math.max(3, Math.round(L / 1.8));
    let prev = null;
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const px = b.from[0] + dx * t + nx * off * s, pz = b.from[1] + dz * t + nz * off * s;
      const y0 = b.deckAt(t);
      const post = new THREE.BoxGeometry(0.12, 1.15, 0.12);
      post.translate(px, y0 + 0.45, pz);
      parts.push(finish(post, C("#5a4030"), 0));
      if (i > 0 && i < posts) {
        // The pile down into the creek bed.
        const gy = terrainHeight(px, pz);
        if (y0 - gy > 0.3) {
          const pile = new THREE.CylinderGeometry(0.1, 0.12, y0 - gy + 0.2, 6);
          pile.translate(px, (y0 + gy) / 2 - 0.1, pz);
          parts.push(finish(pile, C("#4a3626"), 0));
        }
      }
      const top = [px, y0 + 1.0, pz];
      if (prev) {
        const len = Math.hypot(top[0] - prev[0], top[1] - prev[1], top[2] - prev[2]);
        const r = new THREE.BoxGeometry(len, 0.09, 0.09);
        r.rotateZ(Math.atan2(top[1] - prev[1], Math.hypot(top[0] - prev[0], top[2] - prev[2])));
        r.rotateY(yaw);
        r.translate((top[0] + prev[0]) / 2, (top[1] + prev[1]) / 2, (top[2] + prev[2]) / 2);
        parts.push(finish(r, C("#7a5a3c"), 0));
        const r2 = r.clone();
        r2.translate(0, -0.45, 0);
        parts.push(finish(r2, C("#6d5036"), 0));
      }
      prev = top;
    }
  }
  return merge(parts);
}
function Bridges() {
  ensureFarmStructures();
  const geo = useMemo(() => {
    const g = FARM_BRIDGES.map(bridgeGeometry);
    return g;
  }, []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "farm-bridge", roughness: 0.9 }), []);
  return (
    <group>
      {geo.map((g, i) => <mesh key={i} geometry={g} material={mat} castShadow receiveShadow />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE BIG WINDMILL on Windmill Hill — a white tower mill, a timber cap and
// four lattice sails that turn slowly. Visible from all over the farm.
// ---------------------------------------------------------------------------
function BigWindmill() {
  const Wm = FARM_BIG_WINDMILL;
  const [x, z] = Wm.position;
  const y = Y(x, z);
  const H = Wm.height;
  const sails = useRef();
  useFrame((_, dt) => { if (sails.current) sails.current.rotation.z += dt * 0.45; });
  const brick = flatMat("#f1ece0", { roughness: 0.85 });
  return (
    <group position={[x, y, z]} rotation={[0, Wm.rotationY, 0]}>
      <StaticBatch>
        <Cyl p={[0, 0.4, 0]} rt={3.4} rb={3.6} h={0.8} seg={16} m="#9a9284" />
        <Cyl p={[0, H / 2 + 0.6, 0]} rt={2.0} rb={3.1} h={H} seg={16} m={brick} />
        {/* A gallery round the tower + its rail. */}
        <Cyl p={[0, H * 0.45, 0]} rt={3.4} rb={3.4} h={0.18} seg={20} m={WOOD} />
        {Array.from({ length: 16 }).map((_, k) => {
          const a = (k / 16) * Math.PI * 2;
          return <Box key={k} p={[Math.cos(a) * 3.3, H * 0.45 + 0.5, Math.sin(a) * 3.3]} s={[0.07, 1.0, 0.07]} m={WOOD_DARK} cast={false} />;
        })}
        <mesh position={[0, H * 0.45 + 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={flatMat(WOOD_DARK)}><torusGeometry args={[3.3, 0.05, 4, 32]} /></mesh>
        {/* Door + windows. */}
        <Box p={[0, 1.45, 3.0]} r={[-0.06, 0, 0]} s={[1.3, 2.1, 0.12]} m="#3f6b4a" />
        {[0.32, 0.62].map((f) => <Box key={f} p={[0, H * f + 0.9, 2.6 - f * 0.9]} r={[-0.06, 0, 0]} s={[0.8, 1.0, 0.1]} m="#3b4a52" />)}
        {/* The cap. */}
        <group position={[0, H + 0.6, 0]}>
          <mesh material={flatMat("#6b4a32", { roughness: 0.8 })} castShadow>
            <sphereGeometry args={[2.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <Box p={[0, 0.9, 1.8]} s={[0.4, 0.4, 1.4]} m={WOOD_DARK} />
          {/* Tail pole + fan. */}
          <Rod a={[0, 0.4, -1.8]} b={[0, -H * 0.5, -6.2]} r={0.08} m={WOOD_DARK} />
        </group>
      </StaticBatch>
      <group ref={sails} position={[0, H + 1.5, 2.65]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={flatMat("#3a2a1e")}><cylinderGeometry args={[0.3, 0.3, 0.5, 10]} /></mesh>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI) / 2 + 0.3]}>
            <Box p={[0, 3.6, 0.1]} s={[0.22, 7.2, 0.18]} m={WOOD_DARK} />
            {/* The lattice + a cloth. */}
            {Array.from({ length: 8 }).map((_, i) => <Box key={i} p={[0.55, 1.4 + i * 0.75, 0.15]} s={[1.1, 0.06, 0.05]} m={WOOD} cast={false} />)}
            <Box p={[1.1, 4.1, 0.15]} s={[0.06, 5.5, 0.05]} m={WOOD} cast={false} />
            <mesh position={[0.55, 4.1, 0.2]} castShadow>
              <planeGeometry args={[1.1, 5.4]} />
              <meshStandardMaterial color="#f2ead6" side={THREE.DoubleSide} roughness={0.9} transparent opacity={0.93} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** The summit picnic table + a bench facing the view south over the farm. */
function Picnic() {
  const [x, z] = FARM_PICNIC.position;
  const y = Y(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, FARM_PICNIC.rotationY, 0]}>
      <Box p={[0, 0.75, 0]} s={[1.9, 0.08, 0.85]} m={WOOD} />
      {[-1, 1].map((s) => <Box key={s} p={[0, 0.42, s * 0.75]} s={[1.9, 0.07, 0.32]} m={WOOD} />)}
      {[-0.75, 0.75].map((xx) => <Box key={xx} p={[xx, 0.38, 0]} r={[0, 0, 0]} s={[0.1, 0.75, 1.7]} m={WOOD_DARK} />)}
      <group position={[3.5, 0, 2.5]} rotation={[0, -0.3, 0]}>
        <Box p={[0, 0.45, 0]} s={[1.8, 0.07, 0.42]} m={WOOD} />
        <Box p={[0, 0.8, -0.2]} r={[-0.2, 0, 0]} s={[1.8, 0.35, 0.05]} m={WOOD} />
        {[-0.7, 0.7].map((xx) => <Box key={xx} p={[xx, 0.22, 0]} s={[0.08, 0.45, 0.4]} m={WOOD_DARK} />)}
      </group>
    </group>
  );
}

/** The duck pond's little jetty. */
function Jetty() {
  const c = FARM_POND.center;
  const a = -0.6; // toward the north-east bank
  const r0 = FARM_POND.radius + 2.6, r1 = FARM_POND.radius - 2.2;
  const x0 = c[0] + Math.cos(a) * r0, z0 = c[1] + Math.sin(a) * r0;
  const yaw = Math.atan2(-(Math.sin(a + Math.PI)), Math.cos(a + Math.PI));
  const L = r0 - r1;
  const deck = POND_LEVEL + 0.45;
  const gy = terrainHeight(x0, z0);
  return (
    <group position={[x0, 0, z0]} rotation={[0, yaw, 0]}>
      {Array.from({ length: Math.round(L / 0.3) }).map((_, i) => <Box key={i} p={[0.15 + i * 0.3, Math.max(deck, gy + 0.08), 0]} s={[0.26, 0.07, 1.4]} m={i % 3 ? WOOD : "#6d5036"} />)}
      {[0.3, L / 2, L - 0.2].map((d) => [-1, 1].map((s) => <Cyl key={`${d}${s}`} p={[d, deck - 0.6, s * 0.62]} rt={0.08} rb={0.09} h={1.4} seg={6} m={WOOD_DARK} />))}
    </group>
  );
}

/** The scarecrow in the carrot patch (straw hat, flannel shirt). */
function Scarecrow() {
  const { x, z } = FARM_SCARECROW;
  const y = Y(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, 0.5, 0]}>
      <Box p={[0, 1.0, 0]} s={[0.09, 2.0, 0.09]} m={WOOD_DARK} />
      <Box p={[0, 1.55, 0]} s={[1.6, 0.08, 0.08]} m={WOOD_DARK} />
      <Box p={[0, 1.4, 0]} s={[0.55, 0.65, 0.3]} m="#b83a3a" />
      {[-1, 1].map((s) => <Box key={s} p={[s * 0.62, 1.52, 0]} s={[0.55, 0.2, 0.2]} m="#a83232" />)}
      <Box p={[0, 0.95, 0]} s={[0.45, 0.35, 0.26]} m="#3a5a8a" />
      <mesh position={[0, 1.95, 0]} material={flatMat("#e6cf8a")}><sphereGeometry args={[0.22, 10, 8]} /></mesh>
      <mesh position={[0, 2.12, 0]} material={flatMat("#d9b45a")}><cylinderGeometry args={[0.42, 0.42, 0.05, 14]} /></mesh>
      <mesh position={[0, 2.25, 0]} material={flatMat("#d9b45a")}><cylinderGeometry args={[0.18, 0.22, 0.25, 12]} /></mesh>
      {/* A crow on the arm. */}
      <mesh position={[0.72, 1.7, 0]} material={flatMat("#1e1e22")}><sphereGeometry args={[0.1, 8, 6]} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE MARKET GREEN — bunting strung between poles, a striped marquee, hay
// bale seats round the big liquid amber, a produce cart.
// ---------------------------------------------------------------------------
function buntingGeometry(poles) {
  const parts = [];
  const cols = ["#e63946", "#f4a261", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5"].map((c) => new THREE.Color(c));
  for (let i = 0; i < poles.length - 1; i++) {
    const [ax, ay, az] = poles[i], [bx, by, bz] = poles[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(4, Math.round(L / 0.5));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const sag = Math.sin(t * Math.PI) * 0.6;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t - sag;
      const yaw = Math.atan2(-(bz - az), bx - ax);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([-0.17, 0, 0, 0.17, 0, 0, 0, -0.38, 0], 3));
      g.setIndex([0, 2, 1]);
      g.rotateY(yaw);
      g.translate(x, y, z);
      g.computeVertexNormals();
      parts.push(finish(g, cols[(k + i) % cols.length], 1));
    }
  }
  return merge(parts);
}
function MarketGreen() {
  const [tx, tz] = [TRADE_AREA.x, TRADE_AREA.z];
  const poles = useMemo(() => {
    const pts = [[tx - 9, tz - 4], [tx - 4, tz - 7], [tx + 4, tz - 7], [tx + 9, tz - 4], [tx + 10, tz + 3]];
    return pts.map(([x, z]) => [x, terrainHeight(x, z) + 4.2, z]);
  }, [tx, tz]);
  const geo = useMemo(() => buntingGeometry(poles), [poles]);
  const flagMat = useMemo(() => makeFoliageMaterial({ sway: 1.5, side: THREE.DoubleSide, key: "farm-bunting" }), []);
  const [mx, mz] = [tx + 13, tz - 1];
  const my = terrainHeight(mx, mz);
  return (
    <group>
      <StaticBatch>
        {poles.map(([x, y, z], i) => <Cyl key={i} p={[x, y - 2.1, z]} rt={0.06} rb={0.08} h={4.3} seg={6} m="#f4f0e6" />)}
        {/* The marquee (open-sided, striped). */}
        <group position={[mx, my, mz]}>
          {[[-2, -2], [2, -2], [2, 2], [-2, 2]].map(([px, pz], i) => <Box key={i} p={[px, 1.2, pz]} s={[0.08, 2.4, 0.08]} m="#f4f0e6" />)}
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[0, 3.0, 0]} rotation={[0, (k * Math.PI) / 2 + Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[3.0, 1.3, 4, 1, true, -Math.PI / 4, Math.PI / 2]} />
              <meshStandardMaterial color={k % 2 ? "#e63946" : "#fff8ec"} side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
          ))}
          {/* A trestle of jam jars + a cake stand. */}
          <Box p={[0, 0.78, 0]} s={[2.6, 0.08, 0.9]} m="#f4f0e6" />
          {[-1, 1].map((s) => <Box key={s} p={[s * 1.1, 0.39, 0]} s={[0.08, 0.78, 0.8]} m="#8a8a8a" />)}
          {Array.from({ length: 8 }).map((_, k) => (
            <Cyl key={k} p={[-1.0 + k * 0.28, 0.92, -0.2 + (k % 2) * 0.3]} rt={0.08} rb={0.08} h={0.2} seg={8} m={["#c0392b", "#e67e22", "#8e44ad", "#f1c40f"][k % 4]} />
          ))}
        </group>
        {/* A produce cart of pumpkins + a chalkboard. */}
        <group position={[tx - 11, terrainHeight(tx - 11, tz + 3), tz + 3]} rotation={[0, 0.5, 0]}>
          <Box p={[0, 0.85, 0]} s={[2.0, 0.5, 1.2]} m={WOOD} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.2, 0.5, s * 0.68]} rotation={[Math.PI / 2, 0, 0]} material={flatMat(WOOD_DARK)}>
              <torusGeometry args={[0.45, 0.06, 6, 16]} />
            </mesh>
          ))}
          <Rod a={[-1.0, 0.8, -0.3]} b={[-1.9, 0.4, -0.3]} r={0.04} m={WOOD_DARK} />
          <Rod a={[-1.0, 0.8, 0.3]} b={[-1.9, 0.4, 0.3]} r={0.04} m={WOOD_DARK} />
          {[[-0.5, 0], [0.1, -0.25], [0.6, 0.2], [-0.1, 0.3], [0.3, -0.05]].map(([px, pz], k) => (
            <mesh key={k} position={[px, 1.25 + (k === 4 ? 0.3 : 0), pz]} scale={[1, 0.75, 1]} material={flatMat(k === 2 ? "#e3c54a" : "#e2741f", { roughness: 0.6 })}>
              <sphereGeometry args={[0.28, 10, 8]} />
            </mesh>
          ))}
        </group>
      </StaticBatch>
      <mesh geometry={geo} material={flagMat} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// The big LIQUID AMBER on the Market Green, over a carpet of fallen leaves
// that flutter up as you walk through.
// ---------------------------------------------------------------------------
const AMBER_COLORS = ["#c2542c", "#d97b33", "#d9a441"];
function BigLiquidAmber() {
  const [ax, az] = BIG_AMBER.position;
  const ay = terrainHeight(ax, az);
  const geo = useMemo(() => buildAmber(7), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0.6, leafy: true, key: "farm-amber-big" }), []);
  const leafRefs = useRef([]);
  const leaves = useMemo(() => Array.from({ length: BIG_AMBER.leafCount }, (_, i) => {
    const a = i * 2.399;
    const r = 0.6 + (i / BIG_AMBER.leafCount) * BIG_AMBER.leafRadius;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    return { x, z, g: terrainHeight(ax + x, az + z) - ay, rot: (i * 1.7) % Math.PI, color: AMBER_COLORS[i % 3], vy: 0, vx: 0, vz: 0, y: 0.03, spin: 0 };
  }), [ax, az, ay]);
  const last = useRef({ x: 0, z: 0 });
  useFrame((_, dt) => {
    const px = playerState.x - ax, pz = playerState.z - az;
    if (Math.hypot(px, pz) > 14 && leaves.every((l) => l.y <= 0.03)) return;
    const moving = Math.hypot(playerState.x - last.current.x, playerState.z - last.current.z) > 0.01;
    last.current = { x: playerState.x, z: playerState.z };
    leaves.forEach((leaf, i) => {
      const m = leafRefs.current[i];
      if (!m) return;
      if (moving && leaf.y <= 0.03 && Math.hypot(px - leaf.x, pz - leaf.z) < 1.1) {
        leaf.vy = 1.6 + Math.random() * 1.6;
        leaf.vx = (leaf.x - px) * (1.2 + Math.random()) + (Math.random() - 0.5);
        leaf.vz = (leaf.z - pz) * (1.2 + Math.random()) + (Math.random() - 0.5);
        leaf.spin = 6 + Math.random() * 8;
      }
      if (leaf.y > 0.03 || leaf.vy > 0) {
        leaf.vy -= 4.5 * dt;
        leaf.x += leaf.vx * dt; leaf.z += leaf.vz * dt;
        leaf.y = Math.max(0.03, leaf.y + leaf.vy * dt);
        leaf.vx *= 1 - 1.6 * dt; leaf.vz *= 1 - 1.6 * dt;
        leaf.rot += leaf.spin * dt;
        if (leaf.y <= 0.03 && leaf.vy < 0) {
          leaf.vy = 0; leaf.vx = 0; leaf.vz = 0; leaf.spin = 0;
          const d = Math.hypot(leaf.x, leaf.z);
          if (d > BIG_AMBER.leafRadius) { leaf.x *= BIG_AMBER.leafRadius / d; leaf.z *= BIG_AMBER.leafRadius / d; }
          leaf.g = terrainHeight(ax + leaf.x, az + leaf.z) - ay;
        }
      }
      m.position.set(leaf.x, leaf.g + leaf.y, leaf.z);
      m.rotation.set(-Math.PI / 2 + Math.sin(leaf.rot) * 0.5, leaf.rot * 0.3, leaf.rot);
    });
  });
  return (
    <group position={[ax, ay, az]}>
      <mesh geometry={geo} material={mat} scale={1.4} position={[0, -0.2, 0]} castShadow receiveShadow />
      {leaves.map((leaf, i) => (
        <mesh key={i} ref={(el) => { leafRefs.current[i] = el; }} position={[leaf.x, leaf.g + leaf.y, leaf.z]} rotation={[-Math.PI / 2, 0, leaf.rot]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshStandardMaterial color={leaf.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The MILK TANKER (the teacher's Meshy model; primitive fallback).
// ---------------------------------------------------------------------------
const MILK_TRUCK_URL = `${import.meta.env.BASE_URL}models/milk-truck.glb`;
const MILK_TRUCK_SCALE = 2.2;
try { useGLTF.preload(MILK_TRUCK_URL); } catch { /* ignore */ }
function MilkTruckModel() {
  const { scene } = useGLTF(MILK_TRUCK_URL);
  return <primitive object={scene} scale={MILK_TRUCK_SCALE} />;
}
class ModelBoundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function PrimitiveMilkTruck() {
  return (
    <group>
      <Box p={[0, 0.55, 0]} s={[4.6, 0.35, 1.9]} m="#4a5563" />
      <Box p={[1.75, 1.25, 0]} s={[1.2, 1.15, 1.8]} m="#3a7bd5" />
      <Cyl p={[-0.7, 1.45, 0]} r={[0, 0, Math.PI / 2]} rt={0.85} rb={0.85} h={2.9} seg={18} m="#f3f0e8" />
      {[[-1.7, 0.85], [-1.7, -0.85], [0.4, 0.85], [0.4, -0.85], [1.8, 0.85], [1.8, -0.85]].map(([wx, wz], i) => (
        <Cyl key={i} p={[wx, 0.35, wz]} r={[Math.PI / 2, 0, 0]} rt={0.35} rb={0.35} h={0.24} seg={12} m="#23272e" />
      ))}
    </group>
  );
}
function MilkTruck() {
  const [x, z] = MILK_TRUCK.position;
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, MILK_TRUCK.rotationY || 0, 0]}>
      <ModelBoundary fallback={<PrimitiveMilkTruck />}>
        <Suspense fallback={<PrimitiveMilkTruck />}>
          <MilkTruckModel />
        </Suspense>
      </ModelBoundary>
    </group>
  );
}

/** Mud splashes when the player wades through the pig pen's wallow. */
function MudSplash() {
  const [mx, mz] = FARM_MUD.center;
  const R = FARM_MUD.radius;
  const POOL = 24;
  const drops = useRef(Array.from({ length: POOL }, () => ({ live: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0 })));
  const refs = useRef([]);
  const cursor = useRef(0);
  const acc = useRef(0);
  const last = useRef({ x: 0, z: 0 });
  useFrame((_, dt) => {
    const moved = Math.hypot(playerState.x - last.current.x, playerState.z - last.current.z);
    last.current = { x: playerState.x, z: playerState.z };
    const g = terrainHeight(playerState.x, playerState.z);
    const inMud = Math.hypot(playerState.x - mx, playerState.z - mz) < R && (playerState.y || 0) < g + 0.5;
    if (inMud && moved > 0.001) {
      acc.current += moved;
      if (acc.current >= 0.45) {
        acc.current = 0;
        for (let k = 0; k < 3; k++) {
          const d = drops.current[cursor.current];
          Object.assign(d, {
            live: true, x: playerState.x + (Math.random() - 0.5) * 0.35, z: playerState.z + (Math.random() - 0.5) * 0.35, y: g + 0.06, g,
            vy: 1.6 + Math.random() * 1.7, vx: (Math.random() - 0.5) * 1.8, vz: (Math.random() - 0.5) * 1.8,
          });
          cursor.current = (cursor.current + 1) % POOL;
        }
      }
    }
    for (let i = 0; i < POOL; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const d = drops.current[i];
      if (!d.live) { if (m.visible) m.visible = false; continue; }
      d.vy -= 9 * dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
      if (d.y <= d.g + 0.02 && d.vy < 0) { d.live = false; m.visible = false; continue; }
      m.visible = true;
      m.position.set(d.x, d.y, d.z);
    }
  });
  return (
    <group>
      {Array.from({ length: POOL }).map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} visible={false}>
          <sphereGeometry args={[0.09, 6, 5]} />
          <meshStandardMaterial color="#5a3d28" />
        </mesh>
      ))}
    </group>
  );
}

/** A "Welcome" flower bed + bench beside Mills at the arrival. */
function ArrivalGarden() {
  const [x, z] = FARM_WELCOME_SIGN.position;
  const beds = useMemo(() => {
    const out = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const bx = x - 2.4 + Math.cos(a) * 1.3, bz = z + 1.8 + Math.sin(a) * 0.8;
      out.push([bx, terrainHeight(bx, bz), bz, ["#ff6fae", "#ffd23f", "#ffffff", "#b07cff"][k % 4]]);
    }
    return out;
  }, [x, z]);
  return (
    <group>
      {beds.map(([bx, by, bz, c], i) => (
        <mesh key={i} position={[bx, by + 0.18, bz]} material={flatMat(c, { roughness: 0.6 })}>
          <icosahedronGeometry args={[0.2, 0]} />
        </mesh>
      ))}
      <mesh position={[x - 2.4, terrainHeight(x - 2.4, z + 1.8) + 0.05, z + 1.8]} scale={[1.6, 0.25, 1]} material={flatMat("#5a3d28")}>
        <sphereGeometry args={[1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

export default function FarmLandmarks() {
  return (
    <group>
      <StaticBatch>
        <EntryArch />
        <MapBoard />
        {FARM_SIGNPOSTS.map((s) => <Signpost key={s.id} s={s} />)}
        <Picnic />
        <Jetty />
        <Scarecrow />
        <ArrivalGarden />
      </StaticBatch>
      <Bridges />
      <BigWindmill />
      <MarketGreen />
      <BigLiquidAmber />
      <MilkTruck />
      <MudSplash />
    </group>
  );
}

export { SignBoard };
