import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useProgress } from "../../progress/store.js";
import { toWorld, rectCorners } from "../../data/schoolyard/schoolyardGeom.js";
import { schoolGroundHeight, terrainHeight } from "../../data/schoolyard/schoolyardTerrain.js";
import {
  SCHOOL_SIGN, SCHOOL_MAP_BOARD, SCHOOL_SIGNPOSTS, SCHOOL_PLATFORMS, SCHOOL_BUILDINGS, SCHOOL_AREAS, OVAL, COURTS, COLA,
  HALL, SCHOOLYARD_GATE, SCHOOL_NAME, SCHOOL_PATH_CTRL, SCHOOL_FLIGHTS, SKY_PIER, LV, SCHOOLYARD_CHARACTERS,
} from "../../data/schoolyard/schoolyardLayout.js";
import { SCHOOLYARD_KEY_IDS, SCHOOLYARD_KEY_COUNT, hasKey, isBossUnlocked } from "../../data/schoolyard/schoolyardProgress.js";

/**
 * PLAYGROUND LANDMARKS — the school's name sign out the front (brick wall,
 * crest, motto), the painted CAMPUS MAP board by the plaza (drawn from the
 * same layout the game uses, "You are here" marked), the timber SIGNPOSTS
 * at the junctions (each arrow aims at its target), and the Head Teacher's
 * HALL DOORS: chained shut with EIGHT padlocks — one springs open for each
 * staff key you earn — swinging wide when all eight are in.
 */
function canvas(w, h, draw) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const FONT = "'MMA Display', 'Trebuchet MS', sans-serif";
const FONT2 = "'MMA Rounded', 'Trebuchet MS', sans-serif";

// ---------------------------------------------------------------------------
// THE SCHOOL SIGN
// ---------------------------------------------------------------------------
function signTexture() {
  return canvas(1024, 384, (g, w, h) => {
    g.fillStyle = "#14325f"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e8c547"; g.lineWidth = 12; g.strokeRect(14, 14, w - 28, h - 28);
    // The crest: a shield with a wave + a Norfolk pine.
    g.save(); g.translate(150, h / 2);
    g.fillStyle = "#e8c547";
    g.beginPath(); g.moveTo(-80, -110); g.lineTo(80, -110); g.lineTo(80, 10); g.quadraticCurveTo(80, 90, 0, 120); g.quadraticCurveTo(-80, 90, -80, 10); g.closePath(); g.fill();
    g.fillStyle = "#14325f";
    g.beginPath(); g.moveTo(-66, -96); g.lineTo(66, -96); g.lineTo(66, 8); g.quadraticCurveTo(66, 78, 0, 104); g.quadraticCurveTo(-66, 78, -66, 8); g.closePath(); g.fill();
    g.fillStyle = "#3aa0d8";
    g.beginPath(); g.moveTo(-66, 30); for (let x = -66; x <= 66; x += 8) g.lineTo(x, 30 + Math.sin(x / 9) * 7); g.lineTo(66, 60); g.quadraticCurveTo(40, 90, 0, 104); g.quadraticCurveTo(-40, 90, -66, 60); g.closePath(); g.fill();
    g.fillStyle = "#4fa65a";
    for (let k = 0; k < 5; k++) { const y = -76 + k * 20, wd = 12 + k * 9; g.fillRect(-wd, y, wd * 2, 6); }
    g.fillStyle = "#6e5340"; g.fillRect(-3, -84, 6, 112);
    g.restore();
    g.fillStyle = "#ffffff"; g.textBaseline = "middle";
    g.font = `900 70px ${FONT}`; g.fillText("COFFS HARBOUR", 270, 122, w - 300);
    g.font = `900 70px ${FONT}`; g.fillText("HIGH SCHOOL", 270, 200, w - 300);
    g.fillStyle = "#e8c547"; g.font = `700 34px ${FONT2}`; g.fillText("Learning by the sea · Est. 1957", 272, 276, w - 300);
    g.fillStyle = "#bcd2ef"; g.font = `700 26px ${FONT2}`; g.fillText("Retrieval Practice Playground", 272, 322, w - 300);
  });
}
function SchoolSign() {
  const tex = useMemo(signTexture, []);
  const [x, z] = SCHOOL_SIGN.position;
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, SCHOOL_SIGN.rotationY, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 2.3, 0.6]} />
        <meshStandardMaterial color="#a85538" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.38, 0]} castShadow><boxGeometry args={[6.0, 0.16, 0.75]} /><meshStandardMaterial color="#d9d4c6" roughness={0.9} /></mesh>
      <mesh position={[0, 1.25, 0.31]}><planeGeometry args={[5.2, 1.95]} /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>
      <mesh position={[0, 1.25, -0.31]} rotation={[0, Math.PI, 0]}><planeGeometry args={[5.2, 1.95]} /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>
      {/* The garden bed in front. */}
      <mesh position={[0, 0.12, 1.4]} receiveShadow><boxGeometry args={[6.2, 0.24, 1.8]} /><meshStandardMaterial color="#5d4029" roughness={1} /></mesh>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((dx, i) => (
        <mesh key={i} position={[dx, 0.45, 1.4 + (i % 2) * 0.3]} castShadow><sphereGeometry args={[0.42, 10, 8]} /><meshStandardMaterial color={i % 2 ? "#b83a52" : "#e8c547"} roughness={0.8} /></mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE CAMPUS MAP BOARD
// ---------------------------------------------------------------------------
function mapTexture() {
  const X0 = -146, X1 = 146, Z0 = -136, Z1 = 131;
  return canvas(1024, 940, (g, w, h) => {
    const top = 120;
    const mw = w - 40, mh = h - top - 20;
    const sx = mw / (X1 - X0), sz = mh / (Z1 - Z0);
    const P = (x, z) => [20 + (x - X0) * sx, top + (z - Z0) * sz];
    g.fillStyle = "#1d3f78"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff"; g.font = `900 52px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("CAMPUS MAP", w / 2, 50);
    g.font = `700 26px ${FONT2}`; g.fillStyle = "#e8c547"; g.fillText(SCHOOL_NAME, w / 2, 94);
    // Lawns.
    g.fillStyle = "#86c06a"; g.fillRect(20, top, mw, mh);
    // The bush hill.
    g.fillStyle = "#4f8a46"; { const [a, b] = P(X0, Z0), [c, d] = P(X1, -100); g.fillRect(a, b, c - a, d - b); }
    // The oval.
    g.fillStyle = "#6fb24f"; g.strokeStyle = "#ffffff"; g.lineWidth = 3;
    { const [cx, cz] = P(OVAL.c[0], OVAL.c[1]); g.beginPath(); g.ellipse(cx, cz, OVAL.rx * sx, OVAL.rz * sz, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    // Terraces.
    const fills = { asphalt: "#7c8086", pavers: "#cbb9a4", grass: "#9ccf7a" };
    for (const p of SCHOOL_PLATFORMS) {
      g.fillStyle = fills[p.surface] || "#aaa";
      g.beginPath(); p.pts.forEach(([x, z], i) => { const [a, b] = P(x, z); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath(); g.fill();
      g.strokeStyle = "#8a4a32"; g.lineWidth = 3; g.stroke();
    }
    // Courts + COLA.
    g.fillStyle = "#2f6d5c";
    for (const c of COURTS) { const [a, b] = P(c.c[0] - c.hx, c.c[1] - c.hz); g.fillRect(a, b, c.hx * 2 * sx, c.hz * 2 * sz); }
    g.strokeStyle = "#ffffff"; g.setLineDash([8, 6]); { const [a, b] = P(COLA.c[0] - COLA.hx, COLA.c[1] - COLA.hz); g.strokeRect(a, b, COLA.hx * 2 * sx, COLA.hz * 2 * sz); } g.setLineDash([]);
    // Paths.
    g.strokeStyle = "#c9a878"; g.lineWidth = 5; g.lineCap = "round";
    for (const p of SCHOOL_PATH_CTRL) { g.beginPath(); p.ctrl.forEach(([x, z], i) => { const [a, b] = P(x, z); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.stroke(); }
    // Stairs.
    g.fillStyle = "#f2c21b";
    for (const f of SCHOOL_FLIGHTS) { const [a, b] = P(f.a[0], f.a[1]); g.beginPath(); g.arc(a, b, 5, 0, Math.PI * 2); g.fill(); }
    // Buildings (red roofs; the hall darker).
    for (const b of SCHOOL_BUILDINGS) {
      const cs = rectCorners(b);
      g.fillStyle = b.hall ? "#9a2a22" : b.roof.mat === "tiles" ? "#c0603e" : "#9aa0a4";
      g.beginPath(); cs.forEach(([x, z], i) => { const [a, c] = P(x, z); if (i) g.lineTo(a, c); else g.moveTo(a, c); }); g.closePath(); g.fill();
      g.strokeStyle = "#5a2a1c"; g.lineWidth = 2; g.stroke();
    }
    // The Sky Pier.
    g.strokeStyle = "#5a5a64"; g.lineWidth = 8;
    { const [a, b] = P(...SKY_PIER.from), [c, d] = P(...SKY_PIER.to); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    // Labels.
    g.font = `800 19px ${FONT2}`;
    for (const a of SCHOOL_AREAS) {
      const [x, y] = P(a.c[0], a.c[1]);
      const text = a.name.replace(" (top floor)", "");
      const tw = g.measureText(text).width + 12;
      g.fillStyle = "rgba(255,255,255,0.88)"; g.fillRect(x - tw / 2, y - 12, tw, 24);
      g.fillStyle = "#14325f"; g.fillText(text, x, y + 1);
    }
    // The staff (a key each) + the Head Teacher.
    for (const c of SCHOOLYARD_CHARACTERS) {
      const [x, y] = P(c.position[0], c.position[1] + 6);
      g.fillStyle = c.boss ? "#c8102e" : "#e8c547";
      g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#14325f"; g.font = `900 13px ${FONT2}`; g.fillText(c.boss ? "★" : "🔑", x, y + 1);
    }
    // You are here.
    const [hx, hy] = P(SCHOOL_MAP_BOARD.position[0], SCHOOL_MAP_BOARD.position[1]);
    g.fillStyle = "#e63946"; g.beginPath(); g.arc(hx, hy, 12, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#ffffff"; g.lineWidth = 4; g.stroke();
    g.font = `900 22px ${FONT2}`; g.fillStyle = "#e63946";
    g.fillStyle = "#ffffff"; g.fillRect(hx - 76, hy + 16, 152, 28); g.fillStyle = "#e63946"; g.fillText("YOU ARE HERE", hx, hy + 31);
    // Compass (north is up the hill).
    g.fillStyle = "#ffffff"; g.font = `900 28px ${FONT}`; g.fillText("N ▲", w - 70, top + 30);
  });
}
function MapBoard() {
  const tex = useMemo(mapTexture, []);
  const [x, z] = SCHOOL_MAP_BOARD.position;
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, SCHOOL_MAP_BOARD.rotationY, 0]}>
      {[-1.9, 1.9].map((dx) => (
        <mesh key={dx} position={[dx, 1.3, 0]} castShadow><boxGeometry args={[0.18, 2.6, 0.18]} /><meshStandardMaterial color="#3a3f44" roughness={0.5} metalness={0.4} /></mesh>
      ))}
      <mesh position={[0, 2.1, -0.02]} castShadow><boxGeometry args={[4.1, 3.7, 0.12]} /><meshStandardMaterial color="#3a3f44" roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[0, 2.1, 0.05]}><planeGeometry args={[3.9, 3.58]} /><meshStandardMaterial map={tex} roughness={0.55} /></mesh>
      <mesh position={[0, 4.05, 0.1]} rotation={[0.35, 0, 0]} castShadow><boxGeometry args={[4.3, 0.08, 0.6]} /><meshStandardMaterial color="#3a3f44" roughness={0.5} metalness={0.4} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNPOSTS
// ---------------------------------------------------------------------------
function arrowTexture(label) {
  return canvas(512, 96, (g, w, h) => {
    g.fillStyle = "#1d5e3a";
    g.beginPath(); g.moveTo(6, 8); g.lineTo(w - 50, 8); g.lineTo(w - 6, h / 2); g.lineTo(w - 50, h - 8); g.lineTo(6, h - 8); g.closePath(); g.fill();
    g.strokeStyle = "#ffffff"; g.lineWidth = 5; g.stroke();
    g.fillStyle = "#ffffff"; g.font = `800 40px ${FONT2}`; g.textBaseline = "middle"; g.fillText(label, 24, h / 2 + 2, w - 90);
  });
}
function Signpost({ s }) {
  const [x, z] = s.p;
  const y = schoolGroundHeight(x, z);
  const arrows = useMemo(() => s.arrows.map(([label, t]) => ({ label, tex: arrowTexture(label), yaw: Math.atan2(-(t[1] - z), t[0] - x) })), [s, x, z]);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.09, 0.11, 3.2, 8]} /><meshStandardMaterial color="#6e5340" roughness={0.9} /></mesh>
      {arrows.map((a, i) => (
        <group key={a.label} position={[0, 2.75 - i * 0.48, 0]} rotation={[0, a.yaw, 0]}>
          <mesh position={[0.95, 0, 0]} castShadow>
            <boxGeometry args={[1.8, 0.36, 0.05]} />
            <meshStandardMaterial color="#1d5e3a" roughness={0.7} />
          </mesh>
          <mesh position={[0.95, 0, 0.028]}><planeGeometry args={[1.8, 0.34]} /><meshStandardMaterial map={a.tex} transparent alphaTest={0.3} roughness={0.6} /></mesh>
          <mesh position={[0.95, 0, -0.028]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}><planeGeometry args={[1.8, 0.34]} /><meshStandardMaterial map={a.tex} transparent alphaTest={0.3} roughness={0.6} side={THREE.BackSide} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE HALL DOORS + EIGHT PADLOCKS
// ---------------------------------------------------------------------------
function doorSignTexture(n) {
  return canvas(512, 256, (g, w, h) => {
    g.fillStyle = n >= SCHOOLYARD_KEY_COUNT ? "#1d6e3a" : "#7d1e1e"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e8c547"; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `900 44px ${FONT}`; g.fillText(n >= SCHOOLYARD_KEY_COUNT ? "THE HALL IS OPEN!" : "HEAD TEACHER", w / 2, 70, w - 40);
    g.font = `800 36px ${FONT2}`; g.fillText(n >= SCHOOLYARD_KEY_COUNT ? "Mrs. Kellahan awaits" : "Staff only — 8 keys needed", w / 2, 132, w - 40);
    g.fillStyle = "#e8c547"; g.font = `900 46px ${FONT}`; g.fillText(`🔑 ${n} / ${SCHOOLYARD_KEY_COUNT}`, w / 2, 198);
  });
}
function Padlock({ x, y, z, open }) {
  const ref = useRef();
  const t = useRef(open ? 1 : 0);
  useFrame((_, dt) => {
    t.current += ((open ? 1 : 0) - t.current) * Math.min(1, dt * 3);
    const g = ref.current;
    if (!g) return;
    g.children[1].position.y = 0.16 + t.current * 0.12;
    g.children[1].rotation.y = t.current * 1.2;
    g.rotation.z = t.current * 0.5;
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh castShadow><boxGeometry args={[0.24, 0.22, 0.1]} /><meshStandardMaterial color={open ? "#7fb069" : "#d4a72c"} metalness={0.7} roughness={0.3} emissive={open ? "#2a6a2a" : "#000000"} emissiveIntensity={open ? 0.6 : 0} /></mesh>
      <mesh position={[0, 0.16, 0]}><torusGeometry args={[0.08, 0.022, 6, 12, Math.PI]} /><meshStandardMaterial color="#c9ccce" metalness={0.8} roughness={0.25} /></mesh>
    </group>
  );
}
function HallDoors() {
  const cm = useProgress((s) => s.completedMissions);
  const n = SCHOOLYARD_KEY_IDS.reduce((k, id) => k + (hasKey(id, cm) ? 1 : 0), 0);
  const open = isBossUnlocked(cm);
  const tex = useMemo(() => doorSignTexture(n), [n]);
  useEffect(() => () => tex && tex.dispose(), [tex]);
  const left = useRef(), right = useRef();
  const swing = useRef(open ? 1 : 0);
  useFrame((_, dt) => {
    swing.current += ((open ? 1 : 0) - swing.current) * Math.min(1, dt * 1.2);
    const a = swing.current * 1.75;
    if (left.current) left.current.rotation.y = a;
    if (right.current) right.current.rotation.y = -a;
  });
  const [x0, x1] = HALL.doorX;
  const y = LV.L1;
  const z = HALL.doorZ - HALL.wallT / 2;
  const w = (x1 - x0) / 2;
  const leaf = (
    <>
      <mesh position={[w / 2, 1.75, 0]} castShadow receiveShadow><boxGeometry args={[w - 0.04, 3.5, 0.12]} /><meshStandardMaterial color="#5a2a22" roughness={0.6} /></mesh>
      <mesh position={[w / 2, 2.6, 0.07]}><planeGeometry args={[w - 0.8, 1.1]} /><meshStandardMaterial color="#3a4650" roughness={0.15} metalness={0.3} /></mesh>
    </>
  );
  return (
    <group>
      <group ref={left} position={[x0, y, z]}>{leaf}</group>
      <group ref={right} position={[x1, y, z]} scale={[-1, 1, 1]}>{leaf}</group>
      {/* The chain + eight padlocks (one opens per key earned). */}
      {!open && (
        <group>
          <mesh position={[(x0 + x1) / 2, y + 1.35, z + 0.14]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, x1 - x0 - 0.4, 6]} />
            <meshStandardMaterial color="#9aa0a4" metalness={0.8} roughness={0.3} />
          </mesh>
          {SCHOOLYARD_KEY_IDS.map((id, i) => (
            <Padlock key={id} x={x0 + 0.7 + (i * (x1 - x0 - 1.4)) / 7} y={y + 1.12} z={z + 0.2} open={hasKey(id, cm)} />
          ))}
        </group>
      )}
      {/* The key-count sign on a stand beside the doors. */}
      <group position={[x1 + 2.6, y, HALL.doorZ + 1.6]} rotation={[0, -0.25, 0]}>
        {[-0.85, 0.85].map((dx) => (
          <mesh key={dx} position={[dx, 0.8, 0]} castShadow><boxGeometry args={[0.08, 1.6, 0.08]} /><meshStandardMaterial color="#3a3f44" metalness={0.4} roughness={0.5} /></mesh>
        ))}
        <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[2.0, 1.02, 0.06]} /><meshStandardMaterial color="#3a3f44" metalness={0.4} roughness={0.5} /></mesh>
        <mesh position={[0, 1.5, 0.035]}><planeGeometry args={[1.92, 0.96]} /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>
      </group>
    </group>
  );
}

export default function SchoolLandmarks() {
  return (
    <group>
      <SchoolSign />
      <MapBoard />
      {SCHOOL_SIGNPOSTS.map((s) => <Signpost key={s.id} s={s} />)}
      <HallDoors />
    </group>
  );
}

export { SCHOOLYARD_GATE, toWorld };
