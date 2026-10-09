import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { toWorld } from "../../data/schoolyard/schoolyardGeom.js";
import { SCHOOL_FURNITURE } from "../../data/schoolyard/schoolyardProps.js";
import { terrainHeight } from "../../data/schoolyard/schoolyardTerrain.js";
import { Kit, drapePolygon } from "./schoolKit.js";
import { kitMat, NO_SHADOW_KEYS, schoolMat } from "./schoolMaterials.js";

/**
 * PLAYGROUND FURNITURE — everything from the photos: aluminium benches +
 * picnic sets, galvanised slotted bins, the green wheelie bins with red +
 * yellow lids, the white school van, the blue skip with its red lid, the
 * tall light poles with disc lamps, bubblers, bike racks, bollards, the
 * flagpoles (flags flutter), the school bus + shelter, cars in the car
 * parks, basketball hoops, the rugby league posts, the scoreboard + cricket
 * pitch, the ag plot's raised beds, chook pen + greenhouse, Ms. Ewings'
 * telescope, the hall's stacked chairs + the lectern. Merged per material.
 */
const ALU = "#c9ccce", GALV = "#b2b7bb", DARKG = "#3a3f44";

function furnish(kit, f) {
  const F = { c: [f.x, f.z], yaw: f.rot || 0 };
  const y = f.y;
  const W = (lx, lz) => toWorld(F, lx, lz);
  const box = (key, lx, lz, hx, hz, y0, y1, opts = {}) => {
    const [x, z] = W(lx, lz);
    kit.boxY(key, x, z, hx, hz, y + y0, y + y1, F.yaw + (opts.dyaw || 0), opts);
  };
  const post = (key, lx, lz, y0, y1, r, opts = {}) => {
    const [x, z] = W(lx, lz);
    kit.post(key, x, z, y + y0, y + y1, r, opts.seg || 8, opts);
  };
  const tube = (key, a, b, r, opts = {}) => {
    const [ax, az] = W(a[0], a[2]), [bx, bz] = W(b[0], b[2]);
    kit.tube(key, [ax, y + a[1], az], [bx, y + b[1], bz], r, opts.seg || 8, opts);
  };
  switch (f.kind) {
    case "picnic": {
      box("metal", 0, 0, 0.95, 0.42, 0.72, 0.77, { color: ALU, faces: { bottom: true } });
      for (const s of [-1, 1]) box("metal", 0, s * 0.72, 0.95, 0.15, 0.42, 0.46, { color: ALU, faces: { bottom: true } });
      for (const sx of [-0.75, 0.75]) {
        tube("metal", [sx, 0, -0.85], [sx, 0.74, 0], 0.03, { color: GALV });
        tube("metal", [sx, 0, 0.85], [sx, 0.74, 0], 0.03, { color: GALV });
        tube("metal", [sx, 0.44, -0.85], [sx, 0.44, 0.85], 0.025, { color: GALV });
      }
      break;
    }
    case "bench": {
      for (let k = 0; k < 3; k++) box("metal", 0, -0.14 + k * 0.14, 1.2, 0.055, 0.42, 0.46, { color: ALU, faces: { bottom: true } });
      for (const sx of [-0.95, 0.95]) box("paint", sx, 0, 0.04, 0.2, 0, 0.42, { color: DARKG });
      break;
    }
    case "bubbler": {
      post("metal", 0, 0, 0, 0.85, 0.12, { color: "#d9dde0" });
      box("metal", 0, 0, 0.26, 0.2, 0.85, 0.95, { color: "#e7eaec", faces: { bottom: true } });
      break;
    }
    case "bin": {
      post("metal", 0, 0, 0, 0.92, 0.3, { color: GALV, seg: 12 });
      for (const h of [0.15, 0.5, 0.85]) post("paint", 0, 0, h, h + 0.05, 0.31, { color: "#7f868b", seg: 12, cap: false });
      post("dark", 0, 0, 0.9, 0.93, 0.26, { seg: 12 });
      break;
    }
    case "wheelie": {
      box("paint", 0, 0, 0.3, 0.36, 0.08, 1.0, { color: "#2f6b3a" });
      box("paint", 0, 0.02, 0.32, 0.4, 1.0, 1.07, { color: f.lid || "#d23b2a", faces: { bottom: true } });
      for (const s of [-1, 1]) {
        const [x, z] = W(s * 0.24, -0.36);
        kit.tube("dark", [x - 0.04, y + 0.1, z], [x + 0.04, y + 0.1, z], 0.1, 10, { caps: true });
      }
      break;
    }
    case "van": {
      box("paint", 0, 0, 2.5, 0.95, 0.35, 2.05, { color: "#f1f2f0" });
      box("dark", 1.9, 0, 0.5, 0.96, 1.15, 1.85, { color: "#1f2830" });
      box("dark", -0.4, 0, 1.7, 0.96, 1.25, 1.8, { color: "#26313a" });
      box("paint", 0, 0, 2.52, 0.97, 0.35, 0.6, { color: "#8a8f94" });
      for (const sx of [-1.7, 1.6]) for (const sz of [-0.92, 0.92]) {
        const [x, z] = W(sx, sz);
        const [x2, z2] = W(sx, sz + Math.sign(sz) * 0.1);
        kit.tube("dark", [x, y + 0.36, z], [x2, y + 0.36, z2], 0.35, 12, { caps: true });
      }
      break;
    }
    case "skip": {
      // The blue skip with the red lid (photo).
      const pts = (h) => [[-1.0 + h * 0.18, -0.7], [1.0 - h * 0.18, -0.7], [1.0 - h * 0.18, 0.7], [-1.0 + h * 0.18, 0.7]];
      box("paint", 0, 0, 1.0, 0.72, 0.15, 1.15, { color: "#2f6fb8" });
      box("paint", 0, 0, 1.06, 0.76, 1.15, 1.28, { color: "#c8302a", faces: { bottom: true } });
      void pts;
      break;
    }
    case "lamp": {
      post("metal", 0, 0, 0, 7.4, 0.09, { color: GALV });
      post("metal", 0, 0, 0, 1.2, 0.14, { color: GALV });
      const [x, z] = W(0, 0);
      kit.disc("metal", [x, y + 7.55, z], [0, 1, 0], 0.5, 16, { color: GALV });
      kit.tube("metal", [x, y + 7.38, z], [x, y + 7.55, z], 0.5, 16, { color: GALV });
      kit.disc("glow", [x, y + 7.37, z], [0, -1, 0], 0.42, 16, { color: "#fff6dc" });
      break;
    }
    case "bikerack": {
      for (let k = -2; k <= 2; k++) {
        tube("metal", [k * 0.55, 0, -0.3], [k * 0.55, 0.75, -0.3], 0.025, { color: GALV });
        tube("metal", [k * 0.55, 0, 0.3], [k * 0.55, 0.75, 0.3], 0.025, { color: GALV });
        tube("metal", [k * 0.55, 0.75, -0.3], [k * 0.55, 0.75, 0.3], 0.025, { color: GALV });
      }
      break;
    }
    case "bollard": post("paint", 0, 0, 0, 0.9, 0.11, { color: "#f2c21b" }); break;
    case "flagpole": post("paint", 0, 0, 0, 9, 0.07, { color: "#f4f4ef" }); break;
    case "bus": {
      box("paint", 0, 0, 5.8, 1.25, 0.45, 3.0, { color: "#f6d23c" });
      box("paint", 0, 0, 5.82, 1.27, 0.45, 0.9, { color: "#1f2a44" });
      box("dark", 0, 0, 5.0, 1.27, 1.75, 2.55, { color: "#25303a" });
      box("dark", 5.82, 0, 0.02, 1.0, 1.4, 2.6, { color: "#25303a" });
      for (const sx of [-3.9, 3.6]) for (const sz of [-1.2, 1.2]) {
        const [a, b] = W(sx, sz), [c2, d] = W(sx, sz + Math.sign(sz) * 0.12);
        kit.tube("dark", [a, y + 0.5, b], [c2, y + 0.5, d], 0.5, 12, { caps: true });
      }
      break;
    }
    case "shelter": {
      box("paint", 0, -0.75, 2.2, 0.05, 0.1, 2.4, { color: "#9fc6e0" });
      box("greySteel", 0, 0, 2.4, 0.95, 2.4, 2.55, { faces: { bottom: true } });
      for (const sx of [-2.1, 2.1]) post("metal", sx, -0.75, 0, 2.4, 0.06, { color: DARKG });
      box("metal", 0, -0.45, 1.8, 0.2, 0.42, 0.47, { color: ALU, faces: { bottom: true } });
      break;
    }
    case "car": {
      const col = f.color || "#cccccc";
      box("gloss", 0, 0, 2.15, 0.88, 0.32, 0.98, { color: col });
      box("gloss", -0.2, 0, 1.25, 0.8, 0.98, 1.48, { color: col });
      box("dark", -0.2, 0, 1.2, 0.81, 1.02, 1.42, { color: "#1e262d", faces: { top: false } });
      for (const sx of [-1.35, 1.35]) for (const sz of [-0.84, 0.84]) {
        const [a, b] = W(sx, sz), [c2, d] = W(sx, sz + Math.sign(sz) * 0.08);
        kit.tube("dark", [a, y + 0.32, b], [c2, y + 0.32, d], 0.32, 10, { caps: true });
      }
      break;
    }
    case "hoop": {
      post("metal", 0, -0.3, 0, 3.4, 0.08, { color: DARKG });
      tube("metal", [0, 3.3, -0.3], [0, 3.3, 0.35], 0.06, { color: DARKG });
      box("paint", 0, 0.4, 0.9, 0.03, 2.75, 3.8, { color: "#f4f4ef" });
      const [x, z] = W(0, 0.72);
      for (let k = 0; k < 10; k++) {
        const a0 = (k / 10) * Math.PI * 2, a1 = ((k + 1) / 10) * Math.PI * 2;
        kit.tube("paint", [x + Math.cos(a0) * 0.23, y + 3.05, z + Math.sin(a0) * 0.23], [x + Math.cos(a1) * 0.23, y + 3.05, z + Math.sin(a1) * 0.23], 0.015, 5, { color: "#e8562a" });
      }
      break;
    }
    case "goalpost": {
      for (const s of [-2.8, 2.8]) post("paint", s, 0, 0, 8, 0.1, { color: "#f6f6f2" });
      tube("paint", [-2.8, 3, 0], [2.8, 3, 0], 0.08, { color: "#f6f6f2" });
      for (const s of [-2.8, 2.8]) post("paint", s, 0, 0, 1.8, 0.24, { color: "#2f5fb0", cap: false });
      break;
    }
    case "scoreboard": {
      for (const s of [-2, 2]) post("metal", s, 0, 0, 2.2, 0.08, { color: DARKG });
      box("paint", 0, 0, 2.6, 0.12, 2.2, 4.0, { color: "#1f4a2a" });
      box("paint", 0, 0.13, 2.3, 0.01, 2.5, 3.7, { color: "#f2f2e6", faces: { bottom: true } });
      break;
    }
    case "pitch": {
      const r = { c: [f.x, f.z], yaw: F.yaw, hx: 10, hz: 1.4 };
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => toWorld(r, sx * r.hx, sz * r.hz));
      drapePolygon(kit, "paint", pts, (x, z) => terrainHeight(x, z), { lift: 0.04, maxEdge: 2.5, color: "#b4a37a" });
      break;
    }
    case "gardenbed": {
      box("timber", 0, 0, 2.4, 1.0, -0.05, 0.5, { color: "#a87c52" });
      box("soil", 0, 0, 2.28, 0.88, 0.3, 0.52, { faces: { px: false, nx: false, pz: false, nz: false } });
      for (let k = -3; k <= 3; k++) for (const s of [-0.45, 0.45]) {
        const [x, z] = W(k * 0.6, s);
        kit.post("paint", x, z, y + 0.5, y + 0.78, 0.13, 6, { color: k % 2 ? "#4f9a3a" : "#7cbf4a" });
      }
      break;
    }
    case "chookpen": {
      const hx = f.hx, hz = f.hz;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) post("timber", sx * hx, sz * hz, 0, 2.1, 0.07, { color: "#9a7550" });
      for (const [a, b] of [[[-hx, -hz], [hx, -hz]], [[hx, -hz], [hx, hz]], [[hx, hz], [-hx, hz]], [[-hx, hz], [-hx, -hz]]]) {
        const A = W(...a), B = W(...b);
        kit.quad("wire", [A[0], y, A[1]], [B[0], y, B[1]], [B[0], y + 2.0, B[1]], [A[0], y + 2.0, A[1]], { double: true });
        kit.tube("timber", [A[0], y + 2.05, A[1]], [B[0], y + 2.05, B[1]], 0.05, 6, { color: "#9a7550" });
      }
      // The coop (a little red hut) inside.
      box("paint", 0, -hz + 1.4, 1.4, 1.1, 0, 1.5, { color: "#b0362b" });
      box("greySteel", 0, -hz + 1.4, 1.55, 1.25, 1.5, 1.6, { faces: { bottom: true } });
      break;
    }
    case "greenhouse": {
      const hx = f.hx, hz = f.hz;
      box("greenGlass", 0, 0, hx, hz, 0, 2.4, {});
      const [x0, z0] = W(0, -hz), [x1, z1] = W(0, hz);
      const [ax, az] = W(-hx, 0), [bx, bz] = W(hx, 0);
      void ax; void az; void bx; void bz;
      // A pitched glass roof + a white frame.
      const P = (lx, yy, lz) => { const [xx, zz] = W(lx, lz); return [xx, y + yy, zz]; };
      kit.poly("greenGlass", [P(-hx, 2.4, -hz), P(-hx, 2.4, hz), P(0, 3.3, hz), P(0, 3.3, -hz)], { out: [0, 1, 0], double: true });
      kit.poly("greenGlass", [P(hx, 2.4, hz), P(hx, 2.4, -hz), P(0, 3.3, -hz), P(0, 3.3, hz)], { out: [0, 1, 0], double: true });
      kit.tube("paint", [x0, y + 3.3, z0], [x1, y + 3.3, z1], 0.05, 6, { color: "#f2f2ee" });
      for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) post("paint", sx * hx, sz * hz, 0, 2.4, 0.05, { color: "#f2f2ee", cap: false });
      for (let k = -2; k <= 2; k++) box("paint", 0, k * 0.9, hx * 0.7, 0.3, 0, 0.8, { color: "#7b5a3a" });
      break;
    }
    case "telescope": {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        tube("metal", [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45], [0, 1.25, 0], 0.025, { color: DARKG });
      }
      tube("paint", [0, 1.15, -0.55], [0, 1.6, 0.75], 0.11, { color: "#f4f4ef", caps: true, seg: 12 });
      tube("dark", [0, 1.58, 0.72], [0, 1.62, 0.8], 0.12, { seg: 12 });
      break;
    }
    case "chairs": {
      for (let k = -2; k <= 2; k++) box("paint", 0, k * 0.6, 0.24, 0.24, 0, 1.4, { color: "#2f5fb0" });
      break;
    }
    case "lectern": {
      box("timber", 0, 0, 0.35, 0.3, 0, 1.1, { color: "#a87c52" });
      box("timber", 0, -0.05, 0.42, 0.36, 1.1, 1.18, { color: "#a87c52", faces: { bottom: true } });
      break;
    }
    default: break;
  }
}

function buildFurniture() {
  const kit = new Kit();
  for (const f of SCHOOL_FURNITURE) furnish(kit, f);
  return kit.build();
}

const extraMat = (key) => {
  if (key === "wire") return schoolMat("wire", { color: "#a9b0b4", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6, metalness: 0.4 });
  if (key === "greenGlass") return schoolMat("greenGlass", { color: "#d8efe6", transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, roughness: 0.1, metalness: 0.1 });
  return kitMat(key);
};

export function SchoolFurniture() {
  const built = useMemo(buildFurniture, []);
  return (
    <group>
      {built.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={extraMat(key)} castShadow={!NO_SHADOW_KEYS.has(key) && key !== "wire" && key !== "greenGlass"} receiveShadow />
      ))}
      <Flags />
    </group>
  );
}

// ---------------------------------------------------------------------------
// FLAGS — the Australian, Aboriginal + Torres Strait Islander flags on the
// three poles by the school sign, fluttering (vertex wave).
// ---------------------------------------------------------------------------
function flagTexture(kind) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const g = c.getContext("2d");
  if (kind === 0) {
    // Australian flag (simplified): blue field, Union Jack corner, stars.
    g.fillStyle = "#012169"; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = "#fff"; g.lineWidth = 14;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 64); g.moveTo(128, 0); g.lineTo(0, 64); g.stroke();
    g.strokeStyle = "#c8102e"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 64); g.moveTo(128, 0); g.lineTo(0, 64); g.stroke();
    g.fillStyle = "#fff"; g.fillRect(54, 0, 20, 64); g.fillRect(0, 22, 128, 20);
    g.fillStyle = "#c8102e"; g.fillRect(58, 0, 12, 64); g.fillRect(0, 26, 128, 12);
    const star = (x, y, r) => {
      g.beginPath();
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 - Math.PI / 2; const rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    };
    g.fillStyle = "#fff";
    star(64, 96, 16); star(192, 104, 8); star(160, 64, 8); star(192, 22, 8); star(222, 54, 8); star(206, 74, 4);
  } else if (kind === 1) {
    g.fillStyle = "#000"; g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#cc0000"; g.fillRect(0, 64, 256, 64);
    g.fillStyle = "#ffcc00"; g.beginPath(); g.arc(128, 64, 30, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = "#00843d"; g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#0033a0"; g.fillRect(0, 24, 256, 80);
    g.fillStyle = "#000"; g.fillRect(0, 20, 256, 4); g.fillRect(0, 104, 256, 4);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(128, 64, 22, Math.PI, 0); g.lineTo(150, 80); g.lineTo(106, 80); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function Flags() {
  const poles = useMemo(() => SCHOOL_FURNITURE.filter((f) => f.kind === "flagpole"), []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.8, 0.9, 12, 4);
    g.translate(0.9, 0, 0);
    g.userData.base = Float32Array.from(g.attributes.position.array);
    return g;
  }, []);
  const geos = useMemo(() => poles.map(() => {
    const g = geo.clone();
    g.userData.base = Float32Array.from(geo.attributes.position.array);
    return g;
  }), [poles, geo]);
  const mats = useMemo(() => poles.map((_, i) => new THREE.MeshStandardMaterial({ map: flagTexture(i % 3), side: THREE.DoubleSide, roughness: 0.8 })), [poles]);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    geos.forEach((g, gi) => {
      const p = g.attributes.position, b = g.userData.base;
      for (let i = 0; i < p.count; i++) {
        const x = b[i * 3];
        p.setZ(i, Math.sin(x * 3.2 - t.current * 5.5 + gi) * 0.12 * (x / 1.8));
      }
      p.needsUpdate = true;
    });
  });
  return (
    <group>
      {poles.map((f, i) => (
        <mesh key={i} geometry={geos[i]} material={mats[i]} position={[f.x + 0.07, f.y + 8.4, f.z]} rotation={[0, 0.6, 0]} castShadow />
      ))}
    </group>
  );
}
