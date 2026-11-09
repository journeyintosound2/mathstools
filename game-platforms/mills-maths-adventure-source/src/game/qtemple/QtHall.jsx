import React, { useMemo } from "react";
import * as THREE from "three";

import StaticBatch from "../jungle/StaticBatch.jsx";
import {
  CELL, PILLARS, GALLERY, GALLERY_COLUMNS, DAIS, QT_HALL, COLOSSI,
} from "../../data/qtemple/qtempleWorld.js";
import { getQtTextures, qtMat } from "./qtMaterials.js";
import { QBox, QCyl, QLathe, mat } from "./qtKit.jsx";
import { SeatedColossus, StandingColossus, WingedSun } from "./QtFigures.jsx";

/**
 * THE GREAT HALL (the Temple of Time in Jeff's pictures): a 30 m nave of
 * fluted columns under a gold-ribbed vault, a marble checker floor with the
 * QUOTIENT SEAL set in its middle, tall glowing windows along both sides
 * throwing shafts of light down through the dust, raised galleries behind
 * the columns, banners, and at the far end the three-step dais up to the
 * SEALED SANCTUM's great ÷ door (its challenge comes later).
 */
const HALL = CELL.hall;
const NAVE_R = 19; // half-width of the nave (the column lines)
const RISE = 9.5; // how high the vault climbs above the 12 m springing
const SPRING = HALL.ceil; // 12

/** A half-elliptical barrel vault, seen from inside (metre UVs). */
function vaultGeometry(z0, z1, segA = 40, segZ = 8, tile = 5) {
  const P = [], UV = [], I = [];
  for (let j = 0; j <= segZ; j++) {
    const z = z0 + ((z1 - z0) * j) / segZ;
    let arc = 0, px = NAVE_R, py = SPRING;
    for (let i = 0; i <= segA; i++) {
      const a = (Math.PI * i) / segA;
      const x = NAVE_R * Math.cos(a), y = SPRING + RISE * Math.sin(a);
      arc += Math.hypot(x - px, y - py); px = x; py = y;
      P.push(x, y, z);
      UV.push(arc / tile, (z - z0) / tile);
    }
  }
  const row = segA + 1;
  for (let j = 0; j < segZ; j++) for (let i = 0; i < segA; i++) {
    const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
    I.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
/** The half-ellipse that closes one end of the vault, with a round window hole. */
function lunetteGeometry(holeR = 4.2, holeY = SPRING + 4.6) {
  const s = new THREE.Shape();
  s.moveTo(-NAVE_R - 0.5, SPRING - 0.5);
  s.lineTo(NAVE_R + 0.5, SPRING - 0.5);
  for (let i = 0; i <= 40; i++) {
    const a = (Math.PI * i) / 40;
    s.lineTo((NAVE_R + 0.5) * Math.cos(a), SPRING + (RISE + 0.5) * Math.sin(a));
  }
  const h = new THREE.Path();
  h.absarc(0, holeY, holeR, 0, Math.PI * 2, true);
  s.holes.push(h);
  const g = new THREE.ShapeGeometry(s, 24);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 3, pos.getY(i) / 3);
  return g;
}
/** An elliptical arc (a vault rib) as a tube. */
function ribGeometry(z, r = 0.32) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const a = (Math.PI * i) / 48;
    pts.push(new THREE.Vector3((NAVE_R - 0.2) * Math.cos(a), SPRING + (RISE - 0.2) * Math.sin(a), z));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 6, false);
}
function longRibGeometry(a, z0, z1, r = 0.26) {
  const x = (NAVE_R - 0.2) * Math.cos(a), y = SPRING + (RISE - 0.2) * Math.sin(a);
  return new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x, y, z0), new THREE.Vector3(x, y, z1)), 1, r, 6, false);
}

/** A rose window: rings + petals of glowing glass (canvas). */
let _rose = null;
function roseTexture() {
  if (_rose || typeof document === "undefined") return _rose;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  const c = 128;
  g.fillStyle = "#3a2a14"; g.fillRect(0, 0, 256, 256);
  const cols = ["#ffd98a", "#ffb84a", "#9fd3ff", "#ffe9b8", "#f39a5a"];
  for (let ring = 0; ring < 3; ring++) {
    const n = 8 + ring * 4, r0 = 18 + ring * 36, r1 = r0 + 32;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.86) / n) * Math.PI * 2;
      g.fillStyle = cols[(i + ring) % cols.length];
      g.beginPath(); g.arc(c, c, r1, a0, a1); g.arc(c, c, r0, a1, a0, true); g.closePath(); g.fill();
    }
  }
  g.fillStyle = "#fff4cf"; g.beginPath(); g.arc(c, c, 16, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#3a2a14"; g.lineWidth = 6; g.beginPath(); g.arc(c, c, 124, 0, Math.PI * 2); g.stroke();
  _rose = new THREE.CanvasTexture(cv);
  _rose.colorSpace = THREE.SRGBColorSpace;
  return _rose;
}
/** A tall arched window's glass (glowing). */
let _win = null;
function windowTexture() {
  if (_win || typeof document === "undefined") return _win;
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 384;
  const g = cv.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 384);
  grd.addColorStop(0, "#fff6d8"); grd.addColorStop(1, "#ffd78a");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 384);
  g.strokeStyle = "#5a4020"; g.lineWidth = 5;
  for (let y = 40; y < 384; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 384); g.stroke();
  _win = new THREE.CanvasTexture(cv);
  _win.colorSpace = THREE.SRGBColorSpace;
  return _win;
}
/** Vertical flutes for the columns. */
let _flute = null;
function fluteTexture() {
  if (_flute || typeof document === "undefined") return _flute;
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 64;
  const g = cv.getContext("2d");
  g.fillStyle = "#e6dcc6"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 16; i++) {
    const x = (i * 256) / 16;
    const grd = g.createLinearGradient(x, 0, x + 16, 0);
    grd.addColorStop(0, "#b8ab90"); grd.addColorStop(0.5, "#f4ecda"); grd.addColorStop(1, "#b8ab90");
    g.fillStyle = grd; g.fillRect(x + 2, 0, 12, 64);
  }
  _flute = new THREE.CanvasTexture(cv);
  _flute.colorSpace = THREE.SRGBColorSpace;
  _flute.wrapS = _flute.wrapT = THREE.RepeatWrapping;
  _flute.repeat.set(1, 6);
  return _flute;
}

/** A great fluted column (base, shaft, gold bands, capital). */
function HallColumn({ x, z, r }) {
  const fl = useMemo(() => qtMat("#ffffff", { map: fluteTexture(), rough: 0.55 }), []);
  const y0 = QT_HALL, top = SPRING - 0.6;
  const h = top - y0 - 2.6;
  return (
    <group position={[x, 0, z]}>
      <QBox p={[0, y0 + 0.5, 0]} s={[r * 2.7, 1, r * 2.7]} m="marblePale" />
      <QLathe p={[0, y0 + 1, 0]} pts={[[r * 1.25, 0], [r * 1.3, 0.25], [r * 1.12, 0.5], [r * 1.06, 0.9], [r, 1.1]]} m="gold" seg={24} />
      <mesh position={[0, y0 + 2.1 + h / 2, 0]} material={fl}>
        <cylinderGeometry args={[r * 0.94, r, h, 24, 1, true]} />
      </mesh>
      {[0.33, 0.66].map((f) => (
        <mesh key={f} position={[0, y0 + 2.1 + h * f, 0]} material={mat("gold")}>
          <torusGeometry args={[r * 0.99, 0.12, 6, 24]} />
        </mesh>
      ))}
      <QLathe p={[0, top - 0.6 - 1.4, 0]} pts={[[r * 0.94, 0], [r * 1.05, 0.4], [r * 1.35, 1.1], [r * 1.6, 1.4]]} m="gold" seg={24} />
      <QBox p={[0, top - 0.3, 0]} s={[r * 3.4, 0.6, r * 3.4]} m="marblePale" />
    </group>
  );
}

/** The gallery's short columns + their round arches (on the galleries, −12). */
function GalleryArcade({ side }) {
  const x = 23.6 * side;
  const cols = GALLERY_COLUMNS.filter(([cx]) => Math.sign(cx) === side);
  const y0 = GALLERY.top, colH = 6;
  return (
    <group>
      {cols.map(([cx, cz]) => (
        <group key={cz}>
          <QBox p={[cx, y0 + 0.25, cz]} s={[1.1, 0.5, 1.1]} m="marblePale" />
          <QCyl p={[cx, y0 + 0.5 + colH / 2, cz]} rt={0.36} rb={0.42} h={colH} m="marblePale" seg={14} />
          <QBox p={[cx, y0 + colH + 0.75, cz]} s={[1.1, 0.5, 1.1]} m="gold" />
        </group>
      ))}
      {/* Round arches between the columns + an architrave over them. */}
      {cols.slice(0, -1).map(([, z0], i) => {
        const z1 = cols[i + 1][1];
        return (
          <mesh key={i} position={[x, y0 + colH + 1, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={mat("marblePale")}>
            <torusGeometry args={[(z1 - z0) / 2 - 0.45, 0.32, 6, 18, Math.PI]} />
          </mesh>
        );
      })}
      <QBox p={[x, y0 + colH + 3.9, (cols[0][1] + cols[cols.length - 1][1]) / 2]} s={[0.9, 0.7, cols[cols.length - 1][1] - cols[0][1] + 1.1]} m="marblePale" />
      <QBox p={[x, y0 + colH + 4.35, (cols[0][1] + cols[cols.length - 1][1]) / 2]} s={[1.0, 0.2, cols[cols.length - 1][1] - cols[0][1] + 1.2]} m="gold" />
      {/* Glyph panels along the gallery front (the face you see from the floor). */}
      {[-22, -15, -8].map((z) => (
        <mesh key={z} position={[23 * side + 0.02 * side, QT_HALL + 3.2, z]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]} material={mat("glyphs")}>
          <planeGeometry args={[4.6, 4.2]} />
        </mesh>
      ))}
      <QBox p={[23 * side + 0.08 * side, GALLERY.top - 0.5, (GALLERY.z0 + GALLERY.z1) / 2]} s={[0.25, 0.4, GALLERY.z1 - GALLERY.z0]} m="gold" />
    </group>
  );
}

/** Tall glowing arched windows high on the side walls. */
function SideWindows() {
  const wm = useMemo(() => qtMat("#ffffff", { map: windowTexture(), emissive: "#ffffff", emissiveMap: windowTexture(), ei: 1.1, rough: 1, toneMapped: false }), []);
  const zs = [-26, -18, -10, -2, 6, 28];
  const out = [];
  for (const side of [-1, 1]) for (const z of zs) {
    const x = 29.95 * side;
    const rot = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    out.push(
      <group key={`${side}${z}`} position={[x, 0, z]} rotation={[0, rot, 0]}>
        <mesh position={[0, 3, 0.02]} material={wm}><planeGeometry args={[2.4, 9]} /></mesh>
        <mesh position={[0, 7.5, 0.02]} material={wm}><circleGeometry args={[1.2, 16, 0, Math.PI]} /></mesh>
        {/* Frame */}
        <QBox p={[-1.45, 3, 0.15]} s={[0.5, 9.4, 0.3]} m="marblePale" />
        <QBox p={[1.45, 3, 0.15]} s={[0.5, 9.4, 0.3]} m="marblePale" />
        <QBox p={[0, -1.7, 0.2]} s={[3.4, 0.4, 0.4]} m="marblePale" />
        <mesh position={[0, 7.5, 0.15]} material={mat("gold")}><torusGeometry args={[1.45, 0.18, 6, 16, Math.PI]} /></mesh>
      </group>,
    );
  }
  return <>{out}</>;
}

/** Shafts of window light slanting down through the dusty air (additive). */
function LightShafts() {
  const m = useMemo(() => new THREE.MeshBasicMaterial({
    map: getQtTextures().shaft, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: "#ffe2a8", toneMapped: false, fog: false,
  }), []);
  const shafts = useMemo(() => {
    const out = [];
    for (const side of [-1, 1]) for (const z of [-18, -2]) {
      // From the window (x ±30, y ~3) down to the floor near the nave's middle.
      const a = new THREE.Vector3(29 * side, 4, z), b = new THREE.Vector3(7 * side, QT_HALL, z - 2);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      out.push({ mid, len, q, k: `${side}${z}` });
    }
    // The rose windows' shafts down the nave.
    for (const [z, tz] of [[-29.5, -16], [33, 22]]) {
      const a = new THREE.Vector3(0, SPRING + 4.6, z), b = new THREE.Vector3(0, QT_HALL, tz);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a).normalize();
      out.push({ mid, len: a.distanceTo(b), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir), k: `rose${z}`, wide: true });
    }
    return out;
  }, []);
  return (
    <group>
      {shafts.map((s) => (
        <group key={s.k} position={s.mid} quaternion={s.q}>
          {[0, Math.PI / 2].map((r) => (
            <mesh key={r} rotation={[0, r, 0]} material={m} renderOrder={5}>
              <planeGeometry args={[s.wide ? 7 : 3.2, s.len]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Hanging banners between the columns (red with ÷, blue with ×). */
let _banner = {};
function bannerTex(sym, col) {
  const k = sym + col;
  if (_banner[k] || typeof document === "undefined") return _banner[k];
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 384;
  const g = cv.getContext("2d");
  g.fillStyle = col; g.fillRect(0, 0, 128, 384);
  g.fillStyle = "#e0aa2e";
  g.fillRect(0, 0, 128, 14); g.fillRect(8, 0, 6, 384); g.fillRect(114, 0, 6, 384);
  g.beginPath(); g.moveTo(0, 340); g.lineTo(64, 384); g.lineTo(128, 340); g.lineTo(128, 384); g.lineTo(0, 384); g.fill();
  g.beginPath(); g.arc(64, 150, 44, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = "#e0aa2e"; g.stroke();
  g.fillStyle = "#ffd75e"; g.font = "bold 76px serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(sym, 64, 152);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  _banner[k] = t;
  return t;
}
function Banners() {
  const mR = useMemo(() => qtMat("#ffffff", { map: bannerTex("÷", "#8e1f22"), rough: 0.95, side: THREE.DoubleSide, alphaTest: 0.5 }), []);
  const mB = useMemo(() => qtMat("#ffffff", { map: bannerTex("×", "#1f3a7a"), rough: 0.95, side: THREE.DoubleSide, alphaTest: 0.5 }), []);
  const out = [];
  [-18, -10, -2, 6, 14, 22].forEach((z, i) => {
    for (const side of [-1, 1]) {
      out.push(
        <mesh key={`${z}${side}`} position={[17.2 * side, SPRING - 6.5, z]} rotation={[0, Math.PI / 2, 0]} material={(i + (side > 0 ? 1 : 0)) % 2 ? mB : mR}>
          <planeGeometry args={[2.4, 7.2]} />
        </mesh>,
      );
    }
  });
  return <>{out}</>;
}

/** The QUOTIENT SEAL — the gold medallion in the floor at the hall's heart. */
function FloorSeal() {
  const m = useMemo(() => {
    const t = getQtTextures().seal;
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.35, metalness: 0.25, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, emissive: "#ffcf6a", emissiveMap: t, emissiveIntensity: 0.16 });
  }, []);
  // Little gold roundels marching down the nave (Temple of Time floor inlays).
  const roundels = [-20, -12, 20, 28];
  const rm = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9a521", metalness: 0.7, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), []);
  return (
    <group>
      <mesh position={[0, QT_HALL + 0.012, 4]} rotation={[-Math.PI / 2, 0, 0]} material={m} renderOrder={1}>
        <circleGeometry args={[9, 64]} />
      </mesh>
      {roundels.map((z) => (
        <mesh key={z} position={[0, QT_HALL + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} material={rm}>
          <ringGeometry args={[1.2, 1.6, 32]} />
        </mesh>
      ))}
    </group>
  );
}

/** The SEALED SANCTUM door at the top of the dais (opens in a later update). */
function SanctumDoor() {
  const zWall = HALL.z0; // −30
  const y0 = DAIS.steps[DAIS.steps.length - 1];
  const sealM = useMemo(() => {
    const t = getQtTextures().seal;
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, metalness: 0.4, roughness: 0.35, emissive: "#ffcf6a", emissiveMap: t, emissiveIntensity: 0.55 });
  }, []);
  return (
    <group>
      {/* Jambs + a stepped lintel. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <QBox p={[6.2 * s, y0 + 5.5, zWall + 0.8]} s={[2, 11, 1.6]} m="marbleWall" tile={3} />
          <QBox p={[6.2 * s, y0 + 0.4, zWall + 0.9]} s={[2.4, 0.8, 1.8]} m="gold" />
          <QBox p={[6.2 * s, y0 + 11.2, zWall + 0.9]} s={[2.4, 0.5, 1.8]} m="gold" />
        </group>
      ))}
      <QBox p={[0, y0 + 12.2, zWall + 0.9]} s={[15, 1.6, 1.8]} m="marbleWall" tile={3} />
      <QBox p={[0, y0 + 13.25, zWall + 1.05]} s={[16, 0.5, 2.1]} m="gold" />
      {/* The two bronze leaves + their studs. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <QBox p={[2.6 * s, y0 + 5.3, zWall + 0.25]} s={[5.1, 10.6, 0.4]} m="bronze" />
          {[2, 5, 8.6].map((yy) => [-1.6, 0, 1.6].map((xx) => (
            <QCyl key={`${yy}${xx}`} p={[2.6 * s + xx, y0 + yy, zWall + 0.5]} rt={0.14} h={0.16} m="gold" seg={8} rot={[Math.PI / 2, 0, 0]} />
          )))}
        </group>
      ))}
      {/* The great ÷ seal across both leaves. */}
      <mesh position={[0, y0 + 6.2, zWall + 0.56]} material={sealM}>
        <circleGeometry args={[3.3, 48]} />
      </mesh>
      <mesh position={[0, y0 + 6.2, zWall + 0.5]} material={mat("gold")}>
        <torusGeometry args={[3.35, 0.2, 8, 48]} />
      </mesh>
    </group>
  );
}

export default function QtHall() {
  const vault = useMemo(() => vaultGeometry(HALL.z0, HALL.z1), []);
  const lunette = useMemo(() => lunetteGeometry(), []);
  const ribs = useMemo(() => [-30, -22, -14, -6, 2, 10, 18, 26, 33.5].map((z) => ribGeometry(z)), []);
  const longRibs = useMemo(() => [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((a) => longRibGeometry(a, HALL.z0, HALL.z1)), []);
  const vaultM = useMemo(() => qtMat("#ffffff", { map: getQtTextures().stars, rough: 0.9, side: THREE.DoubleSide, emissive: "#ffffff", emissiveMap: getQtTextures().stars, ei: 0.22 }), []);
  const lunM = useMemo(() => qtMat("#cdbb98", { map: getQtTextures().sandstone, rough: 0.9, side: THREE.DoubleSide }), []);
  const roseM = useMemo(() => qtMat("#ffffff", { map: roseTexture(), emissive: "#ffffff", emissiveMap: roseTexture(), ei: 1.2, toneMapped: false }), []);
  const hallCols = PILLARS.filter((p) => p[3] === "hall");
  return (
    <group>
      <StaticBatch>
        <mesh geometry={vault} material={vaultM} />
        {[HALL.z0 + 0.02, HALL.z1 - 0.02].map((z) => (
          <mesh key={z} geometry={lunette} material={lunM} position={[0, 0, z]} />
        ))}
        {ribs.map((g, i) => <mesh key={i} geometry={g} material={mat("gold")} />)}
        {longRibs.map((g, i) => <mesh key={`l${i}`} geometry={g} material={mat("goldDark")} />)}
        {/* The entablature along each column line. */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <QBox p={[NAVE_R * s, SPRING - 0.3, (HALL.z0 + HALL.z1) / 2]} s={[3.6, 1.2, HALL.z1 - HALL.z0]} m="marblePale" />
            <QBox p={[NAVE_R * s, SPRING + 0.45, (HALL.z0 + HALL.z1) / 2]} s={[4, 0.3, HALL.z1 - HALL.z0]} m="gold" />
          </group>
        ))}
        {hallCols.map(([x, z, r]) => <HallColumn key={`${x}${z}`} x={x} z={z} r={r} />)}
        <GalleryArcade side={-1} />
        <GalleryArcade side={1} />
        <SideWindows />
        <SanctumDoor />
        <Banners />
        {COLOSSI.map((c) => (
          <group key={c.id} position={[c.p[0], QT_HALL, c.p[1]]} rotation={[0, c.yaw, 0]} scale={c.s}>
            {c.kind === "seated" ? <SeatedColossus /> : <StandingColossus />}
          </group>
        ))}
        {/* Over the Descent's arch: a winged sun + glyph panels on the great lintel. */}
        <group position={[0, -1.6, 36.3]} rotation={[0, Math.PI, 0]}><WingedSun s={1.45} /></group>
        {[-1, 1].map((k) => (
          <group key={k} position={[7.2 * k, 3.6, 36.32]} rotation={[0, Math.PI, 0]}>
            <QBox p={[0, 0, -0.06]} s={[4.6, 7.4, 0.12]} m="gold" />
            <mesh position={[0, 0, 0.01]} material={mat("glyphs")}><planeGeometry args={[4.2, 7]} /></mesh>
          </group>
        ))}
        <QBox p={[0, 9.4, 36.25]} s={[18, 0.5, 0.3]} m="gold" />
        {/* Over the Sanctum: a great winged sun. */}
        <group position={[0, DAIS.steps[2] + 17.4, HALL.z0 + 0.35]}><WingedSun s={1.7} /></group>
      </StaticBatch>
      {/* Rose windows at both ends of the vault. */}
      <mesh position={[0, SPRING + 4.6, HALL.z0 + 0.01]} material={roseM}><circleGeometry args={[4.2, 40]} /></mesh>
      <mesh position={[0, SPRING + 4.6, HALL.z1 - 0.01]} rotation={[0, Math.PI, 0]} material={roseM}><circleGeometry args={[4.2, 40]} /></mesh>
      <FloorSeal />
      <LightShafts />
    </group>
  );
}
