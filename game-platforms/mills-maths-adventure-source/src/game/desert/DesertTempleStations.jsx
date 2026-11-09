import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { TEMPLE_STONES, TEMPLE_WALL, TEMPLE_DASH, SUN_TEMPLE } from "../../data/desert/desertLayout.js";
import { desertGroundHeight, desertPadLevel } from "../../data/desert/desertTerrain.js";
import {
  stationOf, stationIndex, FAMILY, medalFor, allBests, stationOpen, nextStation, readFactStats, factState, factKey,
  squareSummary, dayNumber, STATIONS, quotientDoorOpen,
} from "../../data/temple/templeTables.js";
import { useTempleUI } from "../temple/templeStore.js";
import { isAdminMode } from "../../data/adminMode.js";
import { desertMat, getDesertTextures } from "./desertMaterials.js";
import { Box, Cyl } from "./desertKit.jsx";
import { Camel } from "./DesertWonders.jsx";

/**
 * TIMESTABLE TEMPLE — the fifteen carved station stones, the Times-Table Wall
 * (the 12 × 12 square, repainted as facts become fluent) and Dash the camel.
 * Each stone's crown gem shows its state: dark (locked), turquoise (open),
 * 🥉 / 🥈 / 🥇 (its best medal); the NEXT station's gem floats + spins under
 * a slow golden ring so it can be spotted from a distance.
 */

const FONT = '"MMA Rounded", "Baloo 2", system-ui, sans-serif';
const GEM = { locked: "#a08a6a", open: "#3fd0c0", bronze: "#cd7f32", silver: "#dfe6ee", gold: "#ffcc33" };

function canvas(w, h, draw) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { cv, tex: t };
}

/** Text that looks carved: a dark cut with a light lower lip. */
function carve(g, text, x, y, size, { color = "#5a2e0e", weight = 900 } = {}) {
  g.font = `${weight} ${size}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(255, 244, 214, 0.75)";
  g.fillText(text, x + 2, y + 3);
  g.fillStyle = color;
  g.fillText(text, x, y);
}

const faces = new Map();
/** A stone's face: "×7", the name, the station number, a carved border. */
function stoneFace(key) {
  if (faces.has(key)) return faces.get(key);
  const st = stationOf(key);
  const fam = FAMILY[st.family];
  const n = stationIndex(key) + 1;
  const tall = st.kind !== "table";
  const out = canvas(256, tall ? 448 : 384, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, st.kind === "grand" ? "#ffe9a8" : "#f3dcae");
    grd.addColorStop(1, st.kind === "grand" ? "#e3b552" : "#d8b47a");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    // speckle
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${90 + (i % 7) * 10}, ${60 + (i % 5) * 8}, 30, ${0.05 + (i % 3) * 0.03})`;
      g.fillRect((i * 97) % w, (i * 57 + (i % 11) * 13) % h, 2, 2);
    }
    // carved border in the family colour
    g.strokeStyle = fam.color;
    g.lineWidth = 10;
    g.strokeRect(14, 14, w - 28, h - 28);
    g.strokeStyle = "rgba(90, 46, 14, 0.45)";
    g.lineWidth = 3;
    g.strokeRect(26, 26, w - 52, h - 52);
    carve(g, `${n}`, w / 2, 58, 34, { color: fam.color });
    if (st.kind === "table") {
      carve(g, `×${st.table}`, w / 2, h * 0.47, st.table >= 10 ? 104 : 126);
      carve(g, st.name.toUpperCase(), w / 2, h * 0.8, 34, { weight: 800 });
    } else {
      carve(g, fam.icon, w / 2, h * 0.34, 70);
      carve(g, st.kind === "grand" ? "GRAND" : "MIX", w / 2, h * 0.55, 68);
      const tables = st.kind === "grand" ? "ALL TABLES" : st.newTables.join(" · ");
      carve(g, tables, w / 2, h * 0.74, st.kind === "grand" ? 30 : 38, { weight: 800 });
    }
  });
  faces.set(key, out);
  return out;
}

function useTempleState() {
  const version = useTempleUI((s) => s.version);
  return useMemo(() => {
    const bests = allBests();
    const admin = isAdminMode();
    const nxt = nextStation(bests);
    const out = {};
    for (const t of TEMPLE_STONES) {
      const st = stationOf(t.key);
      const m = medalFor(st, bests[t.key] || 0);
      const open = stationOpen(t.key, bests, admin);
      out[t.key] = { gem: m ? m.id : open ? "open" : "locked", next: Boolean(nxt && nxt.key === t.key), open };
    }
    return out;
  }, [version]);
}

function Stone({ stone, state, M }) {
  const st = stationOf(stone.key);
  const tall = Boolean(stone.tall);
  const [x, z] = stone.position;
  const y = desertGroundHeight(x, z, 200);
  const face = stoneFace(stone.key);
  const gem = useRef();
  const ring = useRef();
  const W = tall ? 1.9 : 1.5, H = tall ? 3.3 : 2.4, D = tall ? 0.6 : 0.45, P = tall ? 0.5 : 0.4;
  const topY = P + H;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (gem.current) {
      const lift = state.next ? 0.35 + Math.sin(t * 2.2) * 0.12 : state.gem === "locked" ? -0.35 : 0;
      gem.current.position.y = topY + (tall ? 1.15 : 0.95) + lift;
      gem.current.scale.setScalar(state.gem === "locked" ? 0.6 : 1);
      gem.current.rotation.y = t * (state.next ? 1.6 : 0.4);
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.8;
      ring.current.position.y = topY + (tall ? 1.95 : 1.75) + Math.sin(t * 2.2) * 0.12;
    }
  });
  const gemMat = useMemo(() => {
    const c = GEM[state.gem] || GEM.open;
    const glow = state.gem !== "locked";
    return new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: glow ? 0.55 : 0.05, roughness: 0.25, metalness: state.gem === "gold" || state.gem === "silver" || state.gem === "bronze" ? 0.6 : 0.1, flatShading: true });
  }, [state.gem]);
  const faceMat = useMemo(() => (face ? new THREE.MeshStandardMaterial({ map: face.tex, roughness: 0.92, color: state.open ? "#ffffff" : "#c9b8a0" }) : null), [face, state.open]);
  return (
    <group position={[x, y, z]} rotation={[0, stone.rotationY, 0]}>
      {/* plinth, slab, round crown */}
      <Box p={[0, P / 2 - 0.15, 0]} s={[W + 0.55, P + 0.3, D + 0.5]} m={M.pale} tile={1.2} />
      <Box p={[0, P + H / 2, 0]} s={[W, H, D]} m={st.kind === "grand" ? M.goldStone : M.stone} />
      {tall ? (
        <mesh position={[0, topY + 0.45, 0]} rotation={[0, Math.PI / 4, 0]} material={st.kind === "grand" ? M.gold : M.stone} castShadow>
          <coneGeometry args={[W * 0.74, 0.9, 4]} />
        </mesh>
      ) : (
        <mesh position={[0, topY, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.stone} castShadow>
          <cylinderGeometry args={[W / 2, W / 2, D, 20, 1, false, 0, Math.PI]} />
        </mesh>
      )}
      {/* the carved faces (front + back) */}
      {faceMat && [1, -1].map((s) => (
        <mesh key={s} position={[0, P + H / 2, s * (D / 2 + 0.006)]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={faceMat}>
          <planeGeometry args={[W * 0.9, H * 0.92]} />
        </mesh>
      ))}
      {/* the crown gem (+ the next station's ring) */}
      <mesh ref={gem} position={[0, topY + 0.95, 0]} material={gemMat} castShadow>
        <octahedronGeometry args={[tall ? 0.42 : 0.34, 0]} />
      </mesh>
      {state.next && (
        <mesh ref={ring} position={[0, topY + 1.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.ring}>
          <torusGeometry args={[0.62, 0.06, 8, 32]} />
        </mesh>
      )}
      {/* a padlock hung on a locked stone */}
      {!state.open && (
        <group position={[0, P + 0.42, D / 2 + 0.14]}>
          <Box p={[0, 0, 0]} s={[0.36, 0.3, 0.14]} m={M.chain} cast={false} />
          <mesh position={[0, 0.2, 0]} material={M.chain}><torusGeometry args={[0.11, 0.035, 6, 14, Math.PI]} /></mesh>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The Times-Table Wall: the 12 × 12 square painted from the fact records.
// ---------------------------------------------------------------------------
const CELL = { fluent: "#ffcc33", learning: "#f3dfb2", missed: "#f29a84", unseen: "#7a5a3c" };
function paintSquare(g, w, h) {
  const stats = readFactStats();
  const today = dayNumber();
  const sum = squareSummary(stats, today);
  g.fillStyle = "#4a2810";
  g.fillRect(0, 0, w, h);
  const pad = 26, top = 92;
  g.font = `900 46px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#ffd98a";
  g.fillText("TIMES-TABLE WALL", w / 2, 40);
  g.font = `800 24px ${FONT}`;
  g.fillStyle = "#f3dfb2";
  g.fillText(`${sum.fluent} of ${sum.total} facts fluent`, w / 2, 74);
  const n = 13;
  const cs = Math.min((w - pad * 2) / n, (h - top - pad) / n);
  const x0 = (w - cs * n) / 2;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = x0 + c * cs, y = top + r * cs;
      let fill, text = "", col = "#4a2810";
      if (r === 0 && c === 0) { fill = "#c99a1a"; text = "×"; col = "#3b1f0a"; }
      else if (r === 0 || c === 0) { fill = "#2e1808"; text = String(r === 0 ? c : r); col = "#ffd98a"; }
      else {
        const fs = factState(stats[factKey(r, c)], today);
        fill = CELL[fs.state];
        if (fs.state !== "unseen") text = String(r * c);
        col = fs.state === "fluent" ? "#4a2d00" : "#4a2810";
      }
      g.fillStyle = fill;
      g.fillRect(x + 1.5, y + 1.5, cs - 3, cs - 3);
      if (text) {
        g.font = `800 ${Math.round(cs * 0.42)}px ${FONT}`;
        g.fillStyle = col;
        g.fillText(text, x + cs / 2, y + cs / 2 + 1);
      }
    }
  }
}

function FactWall({ M }) {
  const version = useTempleUI((s) => s.version);
  const W = TEMPLE_WALL;
  const [x, z] = W.position;
  const y = desertGroundHeight(x, z, 200);
  const sq = useMemo(() => canvas(640, 720, paintSquare), []);
  useEffect(() => {
    if (!sq) return;
    paintSquare(sq.cv.getContext("2d"), sq.cv.width, sq.cv.height);
    sq.tex.needsUpdate = true;
  }, [version, sq]);
  const panelMat = useMemo(() => (sq ? new THREE.MeshStandardMaterial({ map: sq.tex, emissive: new THREE.Color("#ffffff"), emissiveMap: sq.tex, emissiveIntensity: 0.28, roughness: 0.8 }) : null), [sq]);
  const ph = W.height - 0.5;
  const pw = ph * (640 / 720);
  return (
    <group position={[x, y, z]} rotation={[0, W.rotationY, 0]}>
      <Box p={[0, 0.1, 0]} s={[W.width + 0.8, 0.6, W.thick + 0.8]} m={M.pale} tile={1.2} />
      <Box p={[0, W.height / 2 + 0.3, 0]} s={[W.width, W.height, W.thick]} m={M.plaster} tile={1.5} />
      <Box p={[0, W.height + 0.42, 0]} s={[W.width + 0.4, 0.3, W.thick + 0.3]} m={M.gold} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl p={[s * (W.width / 2 + 0.05), W.height / 2 + 0.3, W.thick / 2 + 0.1]} rt={0.22} rb={0.26} h={W.height} m={M.stone} seg={12} />
          <mesh position={[s * (W.width / 2 + 0.05), W.height + 0.8, W.thick / 2 + 0.1]} material={M.gold}><sphereGeometry args={[0.26, 14, 10]} /></mesh>
        </group>
      ))}
      {panelMat && (
        <mesh position={[0, 0.3 + W.height / 2, W.thick / 2 + 0.02]} material={panelMat}>
          <planeGeometry args={[pw, ph]} />
        </mesh>
      )}
    </group>
  );
}

function Dash() {
  const [x, z] = TEMPLE_DASH.position;
  const y = desertGroundHeight(x, z, 200);
  return (
    <group>
      <Camel x={x} z={z} yaw={TEMPLE_DASH.rotationY} k={2} />
      {/* a fez + tassel (Dash is the temple's guide) */}
      <group position={[x, y, z]} rotation={[0, TEMPLE_DASH.rotationY, 0]}>
        <Cyl p={[0, 2.92, 1.88]} rt={0.17} rb={0.21} h={0.3} m="#c4302b" seg={14} />
        <mesh position={[0.14, 2.98, 1.86]}><sphereGeometry args={[0.05, 8, 6]} /><meshStandardMaterial color="#1d1d1d" /></mesh>
      </group>
    </group>
  );
}

/**
 * THE QUOTIENT TEMPLE's DOOR (2026-11-09) — set in the old Sun Temple's
 * doorway: two bronze leaves sealed with a golden ÷, fifteen sockets in an
 * arch round the doorway (one per station, lit in its medal's colour), and
 * the name over the lintel. With a 🥉 on every station the leaves swing out
 * and torchlight spills from the stair inside.
 */
let _qPlate = null;
function quotientPlate() {
  if (_qPlate || typeof document === "undefined") return _qPlate;
  _qPlate = canvas(1024, 160, (g, w, h) => {
    g.fillStyle = "#3a2410"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e8b23a"; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#ffd66b"; g.font = `900 84px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("÷  QUOTIENT TEMPLE  ÷", w / 2, h / 2 + 4);
  });
  return _qPlate;
}
function QuotientDoor({ state, M }) {
  const T = SUN_TEMPLE;
  const top = desertPadLevel("temple") + T.h;
  const z = T.zBack;
  const open = quotientDoorOpen(undefined, isAdminMode());
  const plate = useMemo(() => desertMat("#ffffff", { map: quotientPlate()?.tex || null, emissive: "#ffcf6a", ei: 0.15 }), []);
  const bronze = useMemo(() => desertMat("#8a5a2a", { metal: 0.6, rough: 0.4 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffb45a", toneMapped: false }), []);
  const sockets = STATIONS.map((s, i) => {
    const a = Math.PI * (0.94 - (0.88 * i) / (STATIONS.length - 1));
    const st = state[s.key];
    const col = st && ["gold", "silver", "bronze"].includes(st.gem) ? GEM[st.gem] : "#4a3820";
    return { k: s.key, x: Math.cos(a) * 4.2, y: top + 3.2 + Math.sin(a) * 4.2, col, lit: col !== "#4a3820" };
  });
  return (
    <group>
      {/* Torchlight from the stair inside (only seen with the door open). */}
      {open && <mesh position={[0, top + 3.2, z + 0.27]} material={glow}><planeGeometry args={[4.2, 6.2]} /></mesh>}
      {[-1, 1].map((k) => (
        <group key={k} position={[2.2 * k, top + 3.15, z + 0.36]} rotation={[0, open ? 1.35 * k : 0, 0]}>
          <Box p={[-1.1 * k, 0, 0]} s={[2.18, 6.2, 0.16]} m={bronze} />
          {[1.9, 0, -1.9].map((y) => [-0.6, 0.6].map((x) => <Cyl key={`${y}${x}`} p={[-1.1 * k + x, y, 0.1]} rt={0.09} rb={0.09} h={0.1} m={M.gold} rot={[Math.PI / 2, 0, 0]} />))}
          {/* Half of the ÷ seal on each leaf */}
          <mesh position={[-0.02 * k, 0.4, 0.09]} rotation={[0, 0, k > 0 ? Math.PI / 2 : -Math.PI / 2]} material={M.gold}><circleGeometry args={[1.0, 24, 0, Math.PI]} /></mesh>
          <Box p={[-0.36 * k, 0.4, 0.12]} s={[0.6, 0.14, 0.04]} m="#3a2410" />
          {k < 0 && <Cyl p={[-0.0, 0.85, 0.12]} rt={0.11} rb={0.11} h={0.04} m="#3a2410" rot={[Math.PI / 2, 0, 0]} />}
          {k < 0 && <Cyl p={[-0.0, -0.05, 0.12]} rt={0.11} rb={0.11} h={0.04} m="#3a2410" rot={[Math.PI / 2, 0, 0]} />}
        </group>
      ))}
      {/* The fifteen sockets round the doorway. */}
      {sockets.map((s) => (
        <group key={s.k} position={[s.x, s.y, z + 0.78]}>
          <Cyl p={[0, 0, -0.08]} rt={0.3} rb={0.3} h={0.16} m={M.goldStone} rot={[Math.PI / 2, 0, 0]} />
          <mesh position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.2, 14, 10]} />
            <meshStandardMaterial color={s.col} metalness={0.5} roughness={0.3} emissive={s.lit ? s.col : "#000000"} emissiveIntensity={s.lit ? 0.55 : 0} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, top + 6.7, z + 0.66]} material={plate}><planeGeometry args={[5.4, 0.78]} /></mesh>
    </group>
  );
}

export default function DesertTempleStations() {
  const state = useTempleState();
  const M = useMemo(() => {
    const t = getDesertTextures();
    return {
      pale: desertMat("#ffffff", { map: t.bricksPale }),
      plaster: desertMat("#f6e6c8", { map: t.plaster }),
      stone: desertMat("#e8cf9c", { rough: 0.95 }),
      goldStone: desertMat("#f1cd6a", { rough: 0.5, metal: 0.25 }),
      gold: desertMat("#e8b23a", { metal: 0.7, rough: 0.3, emissive: "#8a5a10", ei: 0.25 }),
      ring: desertMat("#ffd166", { metal: 0.6, rough: 0.25, emissive: "#ffb000", ei: 0.8 }),
      chain: desertMat("#3a3330", { metal: 0.5, rough: 0.6 }),
    };
  }, []);
  return (
    <group>
      {TEMPLE_STONES.map((s) => <Stone key={s.key} stone={s} state={state[s.key]} M={M} />)}
      <FactWall M={M} />
      <Dash />
      <QuotientDoor state={state} M={M} />
    </group>
  );
}
