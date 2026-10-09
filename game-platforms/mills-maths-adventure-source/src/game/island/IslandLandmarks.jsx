import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, Cyl, Rod, GableRoof } from "../farm/farmKit.jsx";
import { flatMat, getFarmTextures } from "../farm/farmMaterials.js";
import { getIslandTextures, islandSignTexture } from "./islandMaterials.js";
import { getIslandGroundColours } from "./IslandTerrain.jsx";
import { useFontsReady } from "./useFontsReady.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { playerState } from "../sessionStore.js";
import { getMagmaTextures } from "../magma/magmaMaterials.js";
import {
  ISLAND_ARCH, ISLAND_MAP_BOARD, ISLAND_WELCOME, ISLAND_SPAWN, ISLAND_SIGNPOSTS, LAMP_POSTS, PIP_THERMOMETER, GATES,
  FERN_ASH, FERN_SPOT, ISLAND_AREAS, FROSTY_PEAK, EMERALD_BLUFF, PLAZA, LIGHTHOUSE, SCHOOLHOUSE,
} from "../../data/island/islandLayout.js";
import { GRID, getIslandGrid, terrainHeight, islandPadLevel, PLAZA_DECK_Y } from "../../data/island/islandTerrain.js";

/**
 * ISLAND LANDMARKS — the welcome ARCH over Main Street, the painted island
 * MAP board (drawn from the real terrain), the finger-post SIGNPOSTS, the
 * street LAMPS, the compass-rose LANDING where you arrive, Pip's giant
 * THERMOMETER number line (−10 … +10, its red level rising and falling),
 * Igloo Hollow's snowmen + sled, Fern's steaming ash vents + basalt columns,
 * the Ember Terrace's hex paving, the mossy ruins by the jungle gate and
 * the summit cairn on Frosty Peak (telescope + pennant).
 */
const TAU = Math.PI * 2;
const T = () => getIslandTextures();
const gY = (x, z) => terrainHeight(x, z);

// ---------------------------------------------------------------------------
// THE ARCH
// ---------------------------------------------------------------------------
function WelcomeArch() {
  const ready = useFontsReady();
  const A = ISLAND_ARCH;
  const [ax, az] = A.position;
  const y = gY(ax, az);
  const sign = useMemo(() => islandSignTexture(A.text, {
    w: 1024, h: 200, bg: "#1f5fa8", border: "#ffcf4a", fg: "#fffaf0",
    font: "400 118px 'MMA Display', 'Trebuchet MS', sans-serif",
  }), [ready, A.text]);
  const ashlar = flatMat("#ffffff", { map: T().ashlar, roughness: 0.9 });
  const beam = useMemo(() => {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      pts.push(new THREE.Vector3((t - 0.5) * A.width, A.height - 0.4 + Math.sin(Math.PI * t) * 1.1, 0));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.22, 8, false);
  }, [A.width, A.height]);
  return (
    <group position={[ax, y, az]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * A.width) / 2, 0, 0]}>
          <Box p={[0, 0.3, 0]} s={[1.9, 0.6, 1.9]} m={flatMat("#ffffff", { map: T().ashlarDark })} tile={1.2} />
          <Box p={[0, (A.height - 0.6) / 2 + 0.6, 0]} s={[1.4, A.height - 0.6, 1.4]} m={ashlar} tile={1.4} />
          <Box p={[0, A.height + 0.05, 0]} s={[1.7, 0.22, 1.7]} m="#e2d5bb" />
          {/* Lantern on top. */}
          <Cyl p={[0, A.height + 0.35, 0]} rt={0.18} rb={0.26} h={0.4} m="#2f3a46" />
          <mesh position={[0, A.height + 0.85, 0]}>
            <boxGeometry args={[0.55, 0.65, 0.55]} />
            <meshStandardMaterial color="#fff3c8" emissive="#ffcf6a" emissiveIntensity={1.1} />
          </mesh>
          <mesh position={[0, A.height + 1.32, 0]} rotation={[0, Math.PI / 4, 0]} material={flatMat("#2f3a46")}><coneGeometry args={[0.5, 0.42, 4]} /></mesh>
        </group>
      ))}
      <mesh geometry={beam} material={flatMat("#7a5232", { roughness: 0.85 })} castShadow />
      {/* The sign board, hung under the beam (both faces). */}
      <group position={[0, A.height - 0.25, 0]}>
        <Box p={[0, 0, 0]} s={[A.width - 1.7, 1.55, 0.18]} m="#ffcf4a" />
        <mesh position={[0, 0, 0.1]}><planeGeometry args={[A.width - 2.0, 1.3]} /><meshStandardMaterial map={sign} roughness={0.6} /></mesh>
        <mesh position={[0, 0, -0.1]} rotation={[0, Math.PI, 0]}><planeGeometry args={[A.width - 2.0, 1.3]} /><meshStandardMaterial map={sign} roughness={0.6} /></mesh>
        {[-1, 1].map((s) => <Rod key={s} a={[s * 3.2, 0.75, 0]} b={[s * 3.2, 1.25 + 0.6, 0]} r={0.03} m="#2f3a46" />)}
      </group>
      {/* Climbing flowers up the posts. */}
      {[-1, 1].flatMap((s) => Array.from({ length: 9 }).map((_, k) => (
        <mesh key={`${s}${k}`} position={[(s * A.width) / 2 + Math.sin(k * 1.7) * 0.72, 0.9 + k * 0.62, 0.72 * Math.cos(k * 1.7)]} material={flatMat(k % 3 ? "#4f9a3a" : ["#ff6b8a", "#ffd23f", "#ffffff"][k % 3], { roughness: 0.8 })}>
          <icosahedronGeometry args={[0.24, 0]} />
        </mesh>
      )))}
    </group>
  );
}
/** Bunting strung from the arch to the lamps (gently swaying). */
function Bunting() {
  const ref = useRef();
  const A = ISLAND_ARCH;
  const lines = useMemo(() => {
    const y0 = gY(A.position[0], A.position[1]);
    const out = [];
    const ends = [
      [[-A.width / 2, A.height - 0.2, 0], [-6.2 - A.position[0], 3.6 + gY(-6.2, 64.5) - y0, 64.5 - A.position[1]]],
      [[A.width / 2, A.height - 0.2, 0], [6.2 - A.position[0], 3.6 + gY(6.2, 64.5) - y0, 64.5 - A.position[1]]],
    ];
    const cols = ["#ff5a6a", "#ffd23f", "#2f8ad8", "#3aa76d", "#ff8a3d", "#b07cff"];
    ends.forEach(([a, b], li) => {
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t;
        const yy = a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * 0.6;
        out.push({ p: [x, yy, z], c: cols[(k + li) % cols.length], r: Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2 });
      }
    });
    return out;
  }, [A]);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((m, i) => { m.rotation.x = Math.sin(state.clock.elapsedTime * 2.2 + i) * 0.25; });
  });
  const tri = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.22, 0); s.lineTo(0.22, 0); s.lineTo(0, -0.42); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group position={[A.position[0], gY(A.position[0], A.position[1]), A.position[1]]}>
      <group ref={ref}>
        {lines.map((f, i) => (
          <mesh key={i} geometry={tri} position={f.p} rotation={[0, f.r, 0]}>
            <meshStandardMaterial color={f.c} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE ISLAND MAP BOARD (painted from the real terrain colours)
// ---------------------------------------------------------------------------
function mapTexture() {
  if (typeof document === "undefined") return null;
  const S = 512;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  // Parchment.
  g.fillStyle = "#f3e2b8"; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S);
  const { h } = getIslandGrid();
  const { col, mix } = getIslandGroundColours();
  const span = 250; // metres shown across
  const c = new THREE.Color();
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const x = -span / 2 + (px / S) * span + 6, z = -span / 2 + (py / S) * span + 2;
      const i = Math.round(x - GRID.xMin), j = Math.round(z - GRID.zMin);
      if (i < 0 || j < 0 || i >= GRID.nx || j >= GRID.nz) continue;
      const k = j * GRID.nx + i;
      const o = (py * S + px) * 4;
      if (h[k] < 0) {
        const d = Math.min(1, -h[k] / 6);
        c.setRGB(0.55 - 0.3 * d, 0.85 - 0.25 * d, 0.86 - 0.1 * d);
      } else {
        c.setRGB(col[k * 3], col[k * 3 + 1], col[k * 3 + 2]).convertLinearToSRGB();
        // Painterly: lift the saturation a little + hill shading.
        const hx = h[k + 1] - h[k - 1] || 0;
        c.multiplyScalar(1 + Math.max(-0.25, Math.min(0.25, -hx * 0.18)));
        if (mix[k * 4 + 1] > 0.5) c.setRGB(0.96, 0.97, 1.0);
      }
      img.data[o] = Math.min(255, c.r * 255); img.data[o + 1] = Math.min(255, c.g * 255); img.data[o + 2] = Math.min(255, c.b * 255);
    }
  }
  g.putImageData(img, 0, 0);
  const P = (x, z) => [((x - 6 + span / 2) / span) * S, ((z - 2 + span / 2) / span) * S];
  // Gates as glowing rings, places as labels.
  const gateCol = { playground: "#3f79dd", snow: "#26c6da", magma: "#ff4a1a", farm: "#ffb21a", jungle: "#22b04a" };
  for (const gt of Object.values(GATES)) {
    const [mx, my] = P(gt.position[0], gt.position[1]);
    g.beginPath(); g.arc(mx, my, 9, 0, TAU); g.fillStyle = gateCol[gt.id]; g.fill();
    g.lineWidth = 3; g.strokeStyle = "#ffffff"; g.stroke();
  }
  g.font = "800 15px 'MMA Rounded', 'Trebuchet MS', sans-serif";
  g.textAlign = "center";
  const show = ["plaza", "school", "frosty", "ember", "meadows", "lagoon", "lighthouse", "cove", "green"];
  for (const a of ISLAND_AREAS) {
    if (!show.includes(a.id)) continue;
    const [mx, my] = P(a.c[0], a.c[1] + (a.id === "green" ? 6 : 0));
    g.lineWidth = 4; g.strokeStyle = "rgba(255,250,235,0.9)";
    g.strokeText(a.name, mx, my - 12); g.fillStyle = "#3b2a1d"; g.fillText(a.name, mx, my - 12);
  }
  // "You are here" star.
  const [yx, yy] = P(ISLAND_MAP_BOARD.position[0], ISLAND_MAP_BOARD.position[1]);
  g.fillStyle = "#e23d3d";
  g.beginPath();
  for (let k = 0; k <= 10; k++) {
    const a = -Math.PI / 2 + (k / 10) * TAU;
    const r = k % 2 ? 5 : 12;
    if (k === 0) g.moveTo(yx + Math.cos(a) * r, yy + Math.sin(a) * r); else g.lineTo(yx + Math.cos(a) * r, yy + Math.sin(a) * r);
  }
  g.fill();
  g.font = "800 13px 'MMA Rounded', 'Trebuchet MS', sans-serif";
  g.fillStyle = "#e23d3d"; g.fillText("You are here", yx, yy + 26);
  // Title cartouche + compass + a border.
  g.fillStyle = "rgba(255,247,225,0.92)"; g.fillRect(S / 2 - 150, 12, 300, 46);
  g.strokeStyle = "#7a5232"; g.lineWidth = 3; g.strokeRect(S / 2 - 150, 12, 300, 46);
  g.font = "400 34px 'MMA Display', 'Trebuchet MS', sans-serif"; g.fillStyle = "#1f5fa8";
  g.fillText("NUMBER ISLAND", S / 2, 48);
  g.save(); g.translate(S - 52, S - 56);
  g.fillStyle = "#7a5232"; g.beginPath(); g.moveTo(0, -30); g.lineTo(8, 0); g.lineTo(0, 30); g.lineTo(-8, 0); g.closePath(); g.fill();
  g.fillStyle = "#e23d3d"; g.beginPath(); g.moveTo(0, -30); g.lineTo(8, 0); g.lineTo(-8, 0); g.closePath(); g.fill();
  g.font = "800 16px 'MMA Rounded', sans-serif"; g.fillStyle = "#3b2a1d"; g.fillText("N", 0, -36);
  g.restore();
  g.strokeStyle = "#7a5232"; g.lineWidth = 10; g.strokeRect(5, 5, S - 10, S - 10);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function MapBoard() {
  const ready = useFontsReady();
  const tex = useMemo(mapTexture, [ready]);
  const M = ISLAND_MAP_BOARD;
  const y = gY(M.position[0], M.position[1]);
  const shingle = getFarmTextures().shingles;
  return (
    <group position={[M.position[0], y, M.position[1]]} rotation={[0, M.rotationY, 0]}>
      {[-2.55, 2.55].map((s) => <Box key={s} p={[s, 1.7, 0]} s={[0.26, 3.4, 0.26]} m="#7a5232" />)}
      <Box p={[0, 2.0, -0.06]} s={[5.0, 3.5, 0.14]} m="#6b4528" />
      <mesh position={[0, 2.0, 0.025]}><planeGeometry args={[4.6, 3.2]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
      <group position={[0, 3.95, 0]}>
        <GableRoof w={5.6} d={1.1} rise={0.6} oh={0.2} roof={flatMat("#ffffff", { map: shingle })} wall="#6b4528" tile={1.5} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNPOSTS, LAMPS, THE LANDING, THE WELCOME SIGN
// ---------------------------------------------------------------------------
function Signpost({ s }) {
  const ready = useFontsReady();
  const [x, z] = s.at;
  const y = gY(x, z);
  const boards = useMemo(() => s.arrows.map(([label]) => islandSignTexture(label, {
    w: 512, h: 96, bg: "#8a5a32", border: "#5b3a1f", fg: "#fff6dc", font: "800 46px 'MMA Rounded', 'Trebuchet MS', sans-serif",
  })), [s, ready]);
  return (
    <group position={[x, y, z]}>
      <Box p={[0, 1.45, 0]} s={[0.18, 2.9, 0.18]} m="#6b4528" />
      <mesh position={[0, 2.98, 0]} rotation={[0, Math.PI / 4, 0]} material={flatMat("#6b4528")}><coneGeometry args={[0.18, 0.22, 4]} /></mesh>
      {s.arrows.map(([label, to], i) => {
        const yaw = Math.atan2(to[0] - x, to[1] - z) - Math.PI / 2;
        return (
          <group key={label} position={[0, 2.55 - i * 0.5, 0]} rotation={[0, yaw, 0]}>
            <Box p={[1.05, 0, 0]} s={[2.1, 0.38, 0.07]} m="#8a5a32" />
            <mesh position={[2.18, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={flatMat("#8a5a32")}><coneGeometry args={[0.27, 0.32, 3]} /></mesh>
            <mesh position={[1.05, 0, 0.04]}><planeGeometry args={[2.0, 0.36]} /><meshStandardMaterial map={boards[i]} roughness={0.8} /></mesh>
            <mesh position={[1.05, 0, -0.04]} rotation={[0, Math.PI, 0]}><planeGeometry args={[2.0, 0.36]} /><meshStandardMaterial map={boards[i]} roughness={0.8} /></mesh>
          </group>
        );
      })}
    </group>
  );
}
function Lamp({ x, z }) {
  const onPlaza = Math.max(Math.abs(x - PLAZA.center[0]), Math.abs(z - PLAZA.center[1])) < PLAZA.apothem;
  const y = onPlaza ? PLAZA_DECK_Y : gY(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 0.2, 0]} rt={0.16} rb={0.24} h={0.4} m="#2b4a3a" />
      <Cyl p={[0, 1.8, 0]} rt={0.06} rb={0.09} h={3.2} m="#2b4a3a" />
      <mesh position={[0, 3.55, 0]}>
        <boxGeometry args={[0.36, 0.48, 0.36]} />
        <meshStandardMaterial color="#fff3c8" emissive="#ffcf6a" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 3.92, 0]} rotation={[0, Math.PI / 4, 0]} material={flatMat("#2b4a3a")}><coneGeometry args={[0.36, 0.3, 4]} /></mesh>
      <Box p={[0, 3.34, 0]} s={[0.46, 0.06, 0.46]} m="#2b4a3a" />
    </group>
  );
}
function Landing() {
  const [x, z] = [ISLAND_SPAWN.x, ISLAND_SPAWN.z];
  const y = gY(x, z);
  const rose = useMemo(() => {
    if (typeof document === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 512;
    const g = cv.getContext("2d");
    g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, 512, 512);
    // Flagstone rings.
    for (let r = 250; r > 40; r -= 52) {
      g.beginPath(); g.arc(256, 256, r, 0, TAU); g.strokeStyle = "rgba(120,100,70,0.55)"; g.lineWidth = 4; g.stroke();
      const n = Math.round(r / 18);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + r;
        g.beginPath(); g.moveTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); g.lineTo(256 + Math.cos(a) * (r - 52), 256 + Math.sin(a) * (r - 52)); g.stroke();
      }
    }
    // The compass rose.
    const pt = (a, r) => [256 + Math.cos(a) * r, 256 + Math.sin(a) * r];
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + (k / 8) * TAU;
      const long = k % 2 === 0;
      const tip = pt(a, long ? 200 : 120), l = pt(a - 0.25, 34), r2 = pt(a + 0.25, 34);
      g.fillStyle = long ? (k === 0 ? "#d6453a" : "#2f5d8a") : "#c9a24a";
      g.beginPath(); g.moveTo(256, 256); g.lineTo(l[0], l[1]); g.lineTo(tip[0], tip[1]); g.lineTo(r2[0], r2[1]); g.closePath(); g.fill();
    }
    g.beginPath(); g.arc(256, 256, 26, 0, TAU); g.fillStyle = "#f6e6b8"; g.fill(); g.strokeStyle = "#7a5a32"; g.lineWidth = 5; g.stroke();
    g.fillStyle = "#3b2a1d"; g.font = "800 44px 'MMA Rounded', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("N", 256, 34);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  return (
    <group position={[x, y + 0.035, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.6, 48]} />
        <meshStandardMaterial map={rose} roughness={0.85} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[4.55, 4.85, 48]} />
        <meshStandardMaterial color="#b8a487" roughness={0.9} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
    </group>
  );
}
function WelcomeSign() {
  const ready = useFontsReady();
  const W = ISLAND_WELCOME;
  const y = gY(W.position[0], W.position[1]);
  const tex = useMemo(() => islandSignTexture(["Welcome to", "Number Island!"], {
    w: 512, h: 220, bg: "#2f8f6a", border: "#1d5a43", font: "700 44px 'MMA Rounded', 'Trebuchet MS', sans-serif", sub: "400 64px 'MMA Display', 'Trebuchet MS', sans-serif",
  }), [ready]);
  return (
    <group position={[W.position[0], y, W.position[1]]} rotation={[0, -0.5, 0]}>
      {[-0.9, 0.9].map((s) => <Box key={s} p={[s, 0.9, 0]} s={[0.14, 1.8, 0.14]} m="#6b4528" />)}
      <Box p={[0, 1.65, -0.04]} s={[2.1, 0.95, 0.08]} m="#1d5a43" />
      <mesh position={[0, 1.65, 0.01]}><planeGeometry args={[2.0, 0.86]} /><meshStandardMaterial map={tex} roughness={0.75} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// PIP'S THERMOMETER — an integer number line, −10 … +10 (animated level).
// ---------------------------------------------------------------------------
function Thermometer() {
  const ready = useFontsReady();
  const P = PIP_THERMOMETER;
  const y = gY(P.position[0], P.position[1]);
  const liquid = useRef();
  const scale = useMemo(() => {
    if (typeof document === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 1024;
    const g = cv.getContext("2d");
    g.fillStyle = "#f7fbff"; g.fillRect(0, 0, 256, 1024);
    g.textAlign = "right"; g.textBaseline = "middle";
    for (let v = -10; v <= 10; v++) {
      const yy = 960 - ((v + 10) / 20) * 900;
      const major = v % 5 === 0;
      g.fillStyle = v === 0 ? "#1f2937" : v < 0 ? "#2f7dd1" : "#d6453a";
      g.fillRect(150, yy - (major ? 4 : 2), major ? 90 : 55, major ? 8 : 4);
      g.font = `${major ? 800 : 700} ${major ? 64 : 40}px 'MMA Rounded', 'Trebuchet MS', sans-serif`;
      g.fillText(v > 0 ? `+${v}` : `${v}`, 138, yy);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [ready]);
  // The tube spans y 1.5 → 6.0 (−10 → +10).
  const y0 = 1.5, y1 = 6.0;
  useFrame((state) => {
    if (!liquid.current) return;
    const v = Math.round(Math.sin(state.clock.elapsedTime * 0.35) * 8);
    const target = y0 + ((v + 10) / 20) * (y1 - y0);
    const cur = liquid.current.scale.y;
    const next = cur + (target - y0 + 0.3 - cur) * 0.05;
    liquid.current.scale.y = next;
    liquid.current.position.y = y0 - 0.3 + next / 2;
  });
  return (
    <group position={[P.position[0], y, P.position[1]]} rotation={[0, P.rotationY, 0]}>
      <Box p={[0, 3.4, -0.16]} s={[1.6, 6.6, 0.2]} m="#2f5d8a" />
      <mesh position={[0.15, 3.75, -0.05]}><planeGeometry args={[1.2, 4.9]} /><meshStandardMaterial map={scale} roughness={0.7} /></mesh>
      <mesh position={[0.55, 3.75, 0.08]}>
        <cylinderGeometry args={[0.14, 0.14, 4.9, 12, 1, true]} />
        <meshStandardMaterial color="#e8f6ff" transparent opacity={0.45} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={liquid} position={[0.55, 3.0, 0.08]} scale={[1, 3, 1]}>
        <cylinderGeometry args={[0.09, 0.09, 1, 10]} />
        <meshStandardMaterial color="#e23d3d" emissive="#a01818" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.55, 1.0, 0.08]}>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#e23d3d" emissive="#a01818" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      <Box p={[0, 0.25, 0]} s={[2.0, 0.5, 1.0]} m={flatMat("#ffffff", { map: T().ashlarDark })} tile={1} />
      {/* A snow cap on the top. */}
      <mesh position={[0, 6.75, -0.12]} scale={[1, 0.35, 0.5]} material={flatMat("#f4f8fd")}><sphereGeometry args={[0.9, 14, 8]} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// IGLOO HOLLOW, FERN'S ASH FIELDS, THE EMBER TERRACE, THE JUNGLE RUINS, THE SUMMIT
// ---------------------------------------------------------------------------
function Snowman({ x, z, s = 1, r = 0 }) {
  const y = gY(x, z);
  const snow = flatMat("#f7fbff", { roughness: 0.7 });
  return (
    <group position={[x, y, z]} rotation={[0, r, 0]} scale={s}>
      <mesh position={[0, 0.6, 0]} material={snow} castShadow><sphereGeometry args={[0.7, 16, 12]} /></mesh>
      <mesh position={[0, 1.5, 0]} material={snow} castShadow><sphereGeometry args={[0.5, 16, 12]} /></mesh>
      <mesh position={[0, 2.15, 0]} material={snow} castShadow><sphereGeometry args={[0.36, 14, 10]} /></mesh>
      <mesh position={[0, 2.18, 0.36]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#f4772e")}><coneGeometry args={[0.07, 0.34, 8]} /></mesh>
      {[-0.12, 0.12].map((ex) => <mesh key={ex} position={[ex, 2.28, 0.31]} material={flatMat("#20242c")}><sphereGeometry args={[0.045, 8, 6]} /></mesh>)}
      <mesh position={[0, 1.83, 0]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#d6453a")}><torusGeometry args={[0.36, 0.08, 8, 18]} /></mesh>
      <Cyl p={[0, 2.5, 0]} rt={0.26} rb={0.26} h={0.36} m="#20242c" />
      <Cyl p={[0, 2.33, 0]} rt={0.4} rb={0.4} h={0.04} m="#20242c" />
      {[-1, 1].map((sx) => <Rod key={sx} a={[sx * 0.45, 1.55, 0]} b={[sx * 1.05, 1.95, 0.1]} r={0.035} m="#5b3f27" />)}
    </group>
  );
}
function IglooHollow() {
  const g = GATES.snow;
  const [gx, gz] = g.position;
  const sled = [gx + 5.5, gz + 3];
  return (
    <group>
      <Snowman x={gx - 5.2} z={gz + 3.4} r={0.6} />
      <Snowman x={gx + 4.6} z={gz - 2.2} s={0.8} r={-0.4} />
      <group position={[sled[0], gY(sled[0], sled[1]), sled[1]]} rotation={[0, 0.7, 0]}>
        {[-0.3, 0.3].map((sx) => <Box key={sx} p={[sx, 0.05, 0]} s={[0.07, 0.07, 1.7]} m="#b9c2cc" />)}
        <Box p={[0, 0.17, -0.05]} s={[0.8, 0.09, 1.45]} m="#c0392b" />
      </group>
    </group>
  );
}
function AshFields() {
  const cols = useMemo(() => {
    const out = [];
    let s = 9;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 26; k++) {
      const a = r() * TAU, d = 3 + r() * 6;
      out.push({ x: 41 + Math.cos(a) * d, z: -15 + Math.sin(a) * d * 0.7, h: 0.6 + r() * 2.2, r: 0.35 + r() * 0.25, rot: r() });
    }
    return out;
  }, []);
  return (
    <group>
      {cols.map((c, i) => {
        const y = gY(c.x, c.z);
        return (
          <mesh key={i} position={[c.x, y + c.h / 2 - 0.1, c.z]} rotation={[0, c.rot, 0]} material={flatMat(i % 2 ? "#3b3330" : "#2c2624", { roughness: 0.9, flat: true })} castShadow>
            <cylinderGeometry args={[c.r, c.r * 1.05, c.h, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}
const VENTS = [[34, -30], [40, -26.5], [25, -28], [44, -20]];
function SteamVents() {
  const tex = getMagmaTextures().puff;
  const refs = useRef([]);
  const seeds = useMemo(() => VENTS.flatMap(([x, z], vi) => Array.from({ length: 4 }, (_, k) => ({ x, z, ph: k / 4 + vi * 0.13 }))), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const far = Math.hypot(playerState.x - 34, playerState.z + 26) > 90;
    seeds.forEach((s, i) => {
      const sp = refs.current[i];
      if (!sp) return;
      sp.visible = !far;
      const a = (t / 3.5 + s.ph) % 1;
      sp.position.set(s.x + a * 1.2, gY(s.x, s.z) + 0.3 + a * 4.5, s.z - a * 0.6);
      const sc = 0.8 + a * 3;
      sp.scale.set(sc, sc, 1);
      sp.material.opacity = Math.min(1, a * 5) * (1 - a) * 0.5;
    });
  });
  if (!tex) return null;
  return (
    <group>
      {VENTS.map(([x, z], i) => (
        <group key={i} position={[x, gY(x, z), z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.25, 0.75, 16]} />
            <meshStandardMaterial color="#2a201d" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
            <circleGeometry args={[0.25, 12]} />
            <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {seeds.map((s, i) => (
        <sprite key={i} ref={(el) => (refs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} color="#f4f0ec" />
        </sprite>
      ))}
    </group>
  );
}
function EmberTerrace() {
  const L = islandPadLevel("terrace");
  const [gx, gz] = GATES.magma.position;
  const hexes = useMemo(() => {
    const out = [];
    for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) {
      const x = gx + (q + r * 0.5) * 1.15, z = gz + r * 1.0 + 1.5;
      if (Math.hypot(x - gx, z - (gz + 1.5)) > 6.2) continue;
      out.push({ x, z, k: (q * 7 + r * 3) & 3 });
    }
    return out;
  }, [gx, gz]);
  return (
    <group>
      {hexes.map((h, i) => (
        <mesh key={i} position={[h.x, L + 0.03, h.z]} rotation={[0, Math.PI / 6, 0]} material={flatMat(["#3b3330", "#4a403b", "#332b28", "#423834"][h.k], { roughness: 0.9, flat: true })} receiveShadow>
          <cylinderGeometry args={[0.6, 0.62, 0.12, 6]} />
        </mesh>
      ))}
    </group>
  );
}
function JungleRuins() {
  const [gx, gz] = GATES.jungle.position;
  const stone = flatMat("#ffffff", { map: getIslandTextures().ashlarDark, roughness: 0.95 });
  const moss = flatMat("#4f8a2e", { roughness: 1 });
  const pieces = [
    { x: gx - 5.2, z: gz + 1.5, h: 3.4, r: 0.1 }, { x: gx + 5.0, z: gz + 2.2, h: 2.2, r: -0.3 }, { x: gx - 4.4, z: gz - 3.5, h: 1.6, r: 0.5 },
  ];
  return (
    <group>
      {pieces.map((p, i) => {
        const y = gY(p.x, p.z);
        return (
          <group key={i} position={[p.x, y, p.z]} rotation={[0.04 * i, p.r, 0.05]}>
            <Box p={[0, p.h / 2, 0]} s={[0.9, p.h, 0.9]} m={stone} tile={1.2} />
            <Box p={[0, p.h + 0.05, 0]} s={[0.95, 0.12, 0.95]} m={moss} />
          </group>
        );
      })}
      {[[gx + 3.4, gz - 3.4], [gx - 2.2, gz + 4.4], [gx + 6.4, gz - 0.8]].map(([x, z], i) => (
        <group key={`b${i}`} position={[x, gY(x, z), z]} rotation={[0.1, i * 1.3, 0.12]}>
          <Box p={[0, 0.35, 0]} s={[1.4, 0.7, 0.9]} m={stone} tile={1.2} />
          <Box p={[0, 0.72, 0]} s={[1.3, 0.06, 0.8]} m={moss} />
        </group>
      ))}
    </group>
  );
}
function SummitLookout() {
  const [sx, sz] = FROSTY_PEAK.summit;
  const y = islandPadLevel("summit");
  const flag = useRef();
  useFrame((state) => { if (flag.current) flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.4) * 0.25; });
  const rock = flatMat("#8a8274", { roughness: 0.95, flat: true });
  return (
    <group position={[sx, y, sz]}>
      {[[0, 0.5, 0, 1.1], [0.6, 1.3, 0.2, 0.8], [-0.4, 1.9, -0.1, 0.6], [0.1, 2.4, 0.1, 0.45]].map(([x, yy, z, r], i) => (
        <mesh key={i} position={[x - 2.6, yy, z - 1.4]} rotation={[i, i * 2, 0]} material={rock} castShadow><dodecahedronGeometry args={[r, 0]} /></mesh>
      ))}
      <Cyl p={[-2.6, 3.6, -1.4]} rt={0.04} rb={0.05} h={2.4} m="#5b3f27" />
      <group ref={flag} position={[-2.6, 4.5, -1.4]}>
        <mesh position={[0.5, 0, 0]}><planeGeometry args={[1.0, 0.6]} /><meshStandardMaterial color="#d6453a" side={THREE.DoubleSide} /></mesh>
      </group>
      {/* A telescope on a tripod, looking out over the island. */}
      <group position={[1.8, 0, 1.2]} rotation={[0, 2.4, 0]}>
        {[0, 1, 2].map((k) => <Rod key={k} a={[Math.cos(k * 2.1) * 0.45, 0, Math.sin(k * 2.1) * 0.45]} b={[0, 1.25, 0]} r={0.03} m="#3b2a1d" />)}
        <mesh position={[0, 1.38, 0.2]} rotation={[Math.PI / 2 - 0.15, 0, 0]} material={flatMat("#b8862a", { metalness: 0.7, roughness: 0.3 })} castShadow>
          <cylinderGeometry args={[0.07, 0.11, 1.1, 12]} />
        </mesh>
      </group>
    </group>
  );
}

export default function IslandLandmarks() {
  return (
    <group>
      <StaticBatch>
        <WelcomeArch />
        <MapBoard />
        <WelcomeSign />
        {ISLAND_SIGNPOSTS.map((s) => <Signpost key={s.id} s={s} />)}
        {LAMP_POSTS.map(([x, z], i) => <Lamp key={i} x={x} z={z} />)}
        <Landing />
      </StaticBatch>
      <Bunting />
      <Thermometer />
      <StaticBatch farDist={130}>
        <IglooHollow />
        <AshFields />
        <EmberTerrace />
        <JungleRuins />
        <SummitLookout />
      </StaticBatch>
      <SteamVents />
    </group>
  );
}

export { LIGHTHOUSE, SCHOOLHOUSE, EMERALD_BLUFF, FERN_ASH, FERN_SPOT };
