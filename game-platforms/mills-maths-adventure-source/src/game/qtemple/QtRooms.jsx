import React, { useMemo } from "react";
import * as THREE from "three";

import StaticBatch from "../jungle/StaticBatch.jsx";
import {
  CELL, PILLARS, STATUES, GUARDIANS, HEADS_X, RAILS, SHELVES, TABLES, COIN_PILES, IDOL, CHEST_SPOT, LAMPS,
  DESCENT, descentY, isCarved, QT_HALL, QT_PIT_FLOOR, THRONE, COURT, READING, PIT, GALLERY, TORCHES, BRAZIERS,
} from "../../data/qtemple/qtempleWorld.js";
import { descentSteps } from "./qtGeometry.js";
import { getQtTextures, qtMat } from "./qtMaterials.js";
import { QBox, QCyl, QBeam, QLathe, mat } from "./qtKit.jsx";
import {
  GoldenHead, GuardianHead, OwlStatue, CobraStatue, CobraPillar, Urn, Chest, CoinPile, Idol, Bookcase, ReadingTable, Lectern,
} from "./QtFigures.jsx";

/**
 * THE ROOMS' DRESSING — everything that isn't floor, wall or the Great
 * Hall: the doorway arches (Mario RPG), the Grand Descent's carpet + rails +
 * owls, the Hall of Heads' golden faces, the library, the Sunken Pit's
 * tablets, the Cobra Throne, the Treasury, the Guardians' Court, every
 * balustrade, the torch sconces + brazier bowls (their flames are in
 * QtAtmosphere, they flicker) and the vestibule's doors back to the desert.
 * Static → merged with StaticBatch.
 */

// ---------------------------------------------------------------------------
// Doorway arches: a solid elliptical spandrel in the opening's plane.
// ---------------------------------------------------------------------------
const OPENINGS = [
  { axis: "x", at: -30, a: 12, b: 22, y0: QT_HALL, top: -6 },
  { axis: "x", at: 30, a: 12, b: 22, y0: QT_HALL, top: -8 },
  { axis: "x", at: 40, a: 12, b: 22, y0: QT_HALL, top: -8 },
  { axis: "z", at: 22, a: -56, b: -46, y0: QT_HALL, top: -10 },
  { axis: "z", at: 27, a: -56, b: -46, y0: QT_HALL, top: -10 },
  { axis: "z", at: 12, a: -100, b: -92, y0: QT_HALL, top: -6 },
  { axis: "z", at: -6, a: -104, b: -92, y0: QT_HALL, top: -6 },
  { axis: "z", at: 46, a: 52, b: 62, y0: QT_HALL, top: -10 },
  { axis: "z", at: 50, a: 52, b: 62, y0: QT_HALL, top: -10 },
  { axis: "z", at: -14, a: 56, b: 68, y0: QT_HALL, top: -8 },
  { axis: "z", at: -30, a: 56, b: 68, y0: QT_HALL, top: -8 },
  { axis: "z", at: 37, a: -9, b: 9, y0: -16, top: -5 },
  { axis: "z", at: 73.5, a: -8, b: 8, y0: 0, top: 9 },
];
function archGeometry(W, H) {
  const r = Math.min(W / 2, Math.max(1.4, (H - 2.6) * 0.55));
  const c = H - 0.35 - r;
  const s = new THREE.Shape();
  s.moveTo(-W / 2, H);
  s.lineTo(W / 2, H);
  s.lineTo(W / 2, c);
  s.absellipse(0, c, W / 2, r, 0, Math.PI, false);
  s.lineTo(-W / 2, H);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -0.45);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  const pts = [];
  for (let i = 0; i <= 32; i++) { const a = (Math.PI * i) / 32; pts.push(new THREE.Vector3((W / 2 - 0.05) * Math.cos(a), c + (r - 0.05) * Math.sin(a), 0)); }
  const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.2, 6, false);
  return { g, rim, keyY: c + r };
}
function ArchFrame({ o }) {
  const W = o.b - o.a, H = o.top - o.y0;
  const { g, rim, keyY } = useMemo(() => archGeometry(W, H), [W, H]);
  const mid = (o.a + o.b) / 2;
  const pos = o.axis === "x" ? [o.at, o.y0, mid] : [mid, o.y0, o.at];
  const rot = o.axis === "x" ? [0, Math.PI / 2, 0] : [0, 0, 0];
  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={g} material={mat("sandstone")} />
      {[-0.47, 0.47].map((z) => <mesh key={z} geometry={rim} position={[0, 0, z]} material={mat("gold")} />)}
      <QBox p={[0, keyY + 0.1, 0]} s={[0.9, 1.1, 1.1]} m="gold" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Balustrades.
// ---------------------------------------------------------------------------
const RAIL_LOOK = (r) => (r.id.startsWith("bridge") ? "iron" : r.id.startsWith("gal") ? "marblePale" : r.id.startsWith("court") ? "sandstone" : "bricks");
function Balustrade({ r }) {
  const look = RAIL_LOOK(r);
  const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
  const n = Math.max(1, Math.round(L / (look === "iron" ? 1.5 : 0.6)));
  const items = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = r.a[0] + (r.b[0] - r.a[0]) * t, z = r.a[1] + (r.b[1] - r.a[1]) * t;
    const post = i % 6 === 0 || i === n;
    if (look === "iron") items.push(<QCyl key={i} p={[x, r.y + 0.55, z]} rt={0.05} h={1.1} m="iron" seg={6} />);
    else if (post) items.push(<QBox key={i} p={[x, r.y + 0.55, z]} s={[0.36, 1.1, 0.36]} m={look === "marblePale" ? "marblePale" : look} />);
    else items.push(<QLathe key={i} p={[x, r.y, z]} pts={[[0.12, 0], [0.12, 0.12], [0.07, 0.25], [0.13, 0.55], [0.06, 0.85], [0.09, 0.95]]} m={look === "bricks" ? "stone" : look === "sandstone" ? "stone" : "marblePale"} seg={8} />);
  }
  const top = look === "iron" ? 1.1 : 1.0;
  return (
    <group>
      {items}
      <QBeam a={[r.a[0], r.y + top, r.a[1]]} b={[r.b[0], r.y + top, r.b[1]]} w={look === "iron" ? 0.08 : 0.32} t={look === "iron" ? 0.08 : 0.16} m={look === "iron" ? "iron" : look === "marblePale" ? "gold" : "stone"} />
      {look === "iron" && <QBeam a={[r.a[0], r.y + 0.55, r.a[1]]} b={[r.b[0], r.y + 0.55, r.b[1]]} w={0.05} t={0.05} m="iron" />}
      {look !== "iron" && <QBeam a={[r.a[0], r.y + 0.06, r.a[1]]} b={[r.b[0], r.y + 0.06, r.b[1]]} w={0.3} t={0.12} m="stone" />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Torch sconces + brazier bowls (the flames live in QtAtmosphere).
// ---------------------------------------------------------------------------
function Sconce({ t }) {
  const [x, z, y, yaw] = t;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <QBox p={[0, -0.1, -0.12]} s={[0.36, 0.7, 0.12]} m="goldDark" />
      <QBeam a={[0, -0.35, -0.08]} b={[0, -0.05, 0.3]} w={0.09} t={0.09} m="iron" />
      <QLathe p={[0, -0.12, 0.32]} pts={[[0.04, 0], [0.16, 0.12], [0.2, 0.26]]} m="iron" seg={10} />
    </group>
  );
}
function Brazier({ b }) {
  return (
    <group position={[b.p[0], b.y, b.p[1]]}>
      <QLathe p={[0, 0, 0]} pts={[[0.5, 0], [0.42, 0.1], [0.14, 0.3], [0.12, 1.2], [0.22, 1.35], [0.62, 1.55], [0.7, 1.8], [0.66, 1.84]]} m="goldDark" seg={14} />
      {[0, 1, 2].map((i) => <QBeam key={i} a={[0, 0.2, 0]} b={[0.55 * Math.cos((i * Math.PI * 2) / 3), 0.02, 0.55 * Math.sin((i * Math.PI * 2) / 3)]} w={0.1} t={0.1} m="iron" />)}
      <QCyl p={[0, 1.72, 0]} rt={0.56} h={0.14} m="ember" seg={14} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// A glyph tablet / panel on a wall (faces the room).
// ---------------------------------------------------------------------------
function Panel({ p, yaw, w = 3, h = 4, green = false, frame = "gold" }) {
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <QBox p={[0, 0, 0.06]} s={[w + 0.4, h + 0.4, 0.12]} m={frame} />
      <mesh position={[0, 0, 0.13]} material={mat(green ? "glyphsGreen" : "glyphs")}><planeGeometry args={[w, h]} /></mesh>
    </group>
  );
}
/** A name plate (canvas text) hung in the vestibule. */
let _plate = null;
function plateTexture() {
  if (_plate || typeof document === "undefined") return _plate;
  const cv = document.createElement("canvas");
  cv.width = 1024; cv.height = 192;
  const g = cv.getContext("2d");
  g.fillStyle = "#3a2a16"; g.fillRect(0, 0, 1024, 192);
  g.strokeStyle = "#e0aa2e"; g.lineWidth = 10; g.strokeRect(10, 10, 1004, 172);
  g.fillStyle = "#f4d27a"; g.font = "bold 92px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("÷  QUOTIENT TEMPLE  ÷", 512, 100);
  _plate = new THREE.CanvasTexture(cv);
  _plate.colorSpace = THREE.SRGBColorSpace;
  return _plate;
}

// ---------------------------------------------------------------------------
// The rooms.
// ---------------------------------------------------------------------------
function Vestibule() {
  const plate = useMemo(() => qtMat("#ffffff", { map: plateTexture(), emissive: "#ffffff", emissiveMap: plateTexture(), ei: 0.25 }), []);
  const glowM = useMemo(() => qtMat("#fff3d0", { emissive: "#ffe6a8", ei: 2.4, toneMapped: false }), []);
  const z = CELL.vestibule.z1; // 86 — the doors back out
  return (
    <group>
      {/* The great doors (ajar — daylight glows through the gap). */}
      <QBox p={[0, 3.4, z - 0.25]} s={[7.6, 6.8, 0.5]} m="sandstone" tile={3} />
      <mesh position={[0, 3.2, z - 0.52]} material={glowM}><planeGeometry args={[0.5, 6.2]} /></mesh>
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[1.6 * k, 3.2, z - 0.7]} s={[2.9, 6.3, 0.3]} rot={[0, 0.12 * k, 0]} m="bronze" />
          <QCyl p={[0.6 * k, 3.2, z - 0.95]} rt={0.12} h={0.2} m="gold" seg={10} rot={[Math.PI / 2, 0, 0]} />
          <QBox p={[4.1 * k, 3.6, z - 0.5]} s={[0.9, 7.2, 1]} m="marbleWall" tile={3} />
          {/* Seated jackal-headed guardians either side of the doors */}
          <group position={[6.2 * k, 0, z - 2.6]} rotation={[0, Math.PI, 0]}>
            <GuardianHead s={0.55} eyes={false} />
          </group>
        </group>
      ))}
      <QBox p={[0, 7.3, z - 0.55]} s={[9.2, 0.9, 1.1]} m="gold" />
      {/* Name plate over the top of the Descent. */}
      <mesh position={[0, 7.6, 74.2]} rotation={[0, Math.PI, 0]} material={plate}><planeGeometry args={[7.2, 1.35]} /></mesh>
      <mesh position={[0, 7.6, 74.22]} material={plate}><planeGeometry args={[7.2, 1.35]} /></mesh>
      {[-3.4, 3.4].map((x) => <QBeam key={x} a={[x, 8.3, 74.2]} b={[x, 9, 74.2]} w={0.05} t={0.05} m="iron" />)}
      {/* Newel posts with gold finials at the top of the stairs. */}
      {[-7.6, 7.6].map((x) => (
        <group key={x}>
          <QBox p={[x, 0.7, 74.1]} s={[0.8, 1.4, 0.8]} m="marblePale" />
          <QLathe p={[x, 1.4, 74.1]} pts={[[0.3, 0], [0.34, 0.1], [0.12, 0.3], [0.22, 0.55], [0.02, 0.8]]} m="gold" seg={12} />
        </group>
      ))}
      <Panel p={[-7.99, 4.2, 79.2]} yaw={Math.PI / 2} w={2.6} h={3.2} />
      <Panel p={[7.99, 4.2, 79.2]} yaw={-Math.PI / 2} w={2.6} h={3.2} />
    </group>
  );
}

function Descent() {
  const steps = useMemo(() => descentSteps(), []);
  const handrails = DESCENT.flights.map((f, i) => ({ k: i, a: [f.from, f.y0 + 1.0], b: [f.to, f.y1 + 1.0] }));
  const pilasterZ = [60, 55, 41, 37, 66.75, 48];
  return (
    <group>
      {/* The red carpet runner down the middle, with gold edges. */}
      {steps.map((r, i) => (
        <group key={i}>
          <QBox p={[0, r.v - 0.18, (r.a - 0.03 + r.b) / 2]} s={[4.2, 0.42, r.b - r.a + 0.03]} m="carpet" />
          {[-2.15, 2.15].map((x) => <QBox key={x} p={[x, r.v - 0.18, (r.a - 0.03 + r.b) / 2]} s={[0.14, 0.43, r.b - r.a + 0.04]} m="gold" />)}
        </group>
      ))}
      {/* Each tread's nosing + a darker riser (so the flights read as steps). */}
      {steps.slice(0, -1).map((r, i) => {
        const w = r.a < 37 ? 26 : 18;
        return (
          <group key={`n${i}`}>
            <QBox p={[0, r.v - 0.05, r.a + 0.08]} s={[w, 0.1, 0.2]} m="marblePale" />
            <QBox p={[0, r.v - 0.25, r.a - 0.005]} s={[w, 0.3, 0.02]} m="stoneDark" />
          </group>
        );
      })}
      {/* Gold handrails along both walls. */}
      {handrails.map((h) => [-8.82, 8.82].map((x) => (
        <QBeam key={`${h.k}${x}`} a={[x, h.a[1], h.a[0]]} b={[x, h.b[1], h.b[0]]} w={0.14} t={0.14} m="gold" />
      )))}
      {/* Pilasters + ceiling beams marking the landings. */}
      {pilasterZ.map((z) => {
        const y = descentY(z), c = y + 11;
        return (
          <group key={z}>
            {[-1, 1].map((k) => <QBox key={k} p={[8.75 * k, y + 5.4, z]} s={[0.5, 11.2, 1.2]} m="marbleWall" tile={3} />)}
            <QBox p={[0, c - 0.25, z]} s={[18, 0.5, 1.2]} m="goldDark" />
          </group>
        );
      })}
      {/* Glyph panels along the walls. */}
      {[70, 64, 51, 45].map((z) => [-1, 1].map((k) => (
        <Panel key={`${z}${k}`} p={[8.99 * k, descentY(z) + 4.2, z]} yaw={k > 0 ? -Math.PI / 2 : Math.PI / 2} w={3} h={3.8} />
      )))}
      {STATUES.map((s) => (
        <group key={s.id} position={[s.p[0], s.y, s.p[1]]} rotation={[0, s.yaw, 0]}><OwlStatue /></group>
      ))}
    </group>
  );
}

function HallOfHeads() {
  const c = CELL.heads;
  const heads = [];
  for (const x of HEADS_X) {
    if (!isCarved(x, c.z0 - 0.3) && !isCarved(x - 1.4, c.z0 - 0.3) && !isCarved(x + 1.4, c.z0 - 0.3)) heads.push({ x, z: c.z0, yaw: 0 });
    if (!isCarved(x, c.z1 + 0.3) && !isCarved(x - 1.4, c.z1 + 0.3) && !isCarved(x + 1.4, c.z1 + 0.3)) heads.push({ x, z: c.z1, yaw: Math.PI });
  }
  const piers = PILLARS.filter((p) => p[3] === "heads");
  return (
    <group>
      {heads.map((h) => (
        <group key={`${h.x}${h.z}`} position={[h.x, QT_HALL + 5.3, h.z]} rotation={[0, h.yaw, 0]}><GoldenHead s={1.15} /></group>
      ))}
      {piers.map(([x, z, r]) => (
        <group key={`${x}${z}`}>
          <QBox p={[x, QT_HALL + 0.3, z]} s={[r * 2.6, 0.6, r * 2.6]} m="goldDark" />
          <QBox p={[x, (QT_HALL + c.ceil) / 2, z]} s={[r * 2, c.ceil - QT_HALL, r * 2]} m="sandstone" tile={2} />
          <QBox p={[x, c.ceil - 0.7, z]} s={[r * 2.8, 0.7, r * 2.8]} m="gold" />
          <QBox p={[x, QT_HALL + 4.0, z]} s={[r * 2.12, 0.4, r * 2.12]} m="gold" />
        </group>
      ))}
      {/* Urns round the sunken floor. */}
      {[[-74.4, 13.3], [-55.6, 13.3], [-74.4, 20.7], [-55.6, 20.7]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, QT_HALL, z]}><Urn s={1.25} /></group>
      ))}
    </group>
  );
}

function Library() {
  const rugM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a1f22", roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), []);
  const rugB = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c99a3e", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), []);
  return (
    <group>
      {SHELVES.map((s) => {
        const yaw = s.yaw === 0 ? Math.PI : s.x < -53 ? Math.PI / 2 : -Math.PI / 2;
        return <group key={`${s.x}${s.z}`} position={[s.x, QT_HALL, s.z]} rotation={[0, yaw, 0]}><Bookcase w={s.w} d={s.d} /></group>;
      })}
      {TABLES.map(([x, z, yaw]) => <group key={`${x}${z}`} position={[x, QT_HALL, z]} rotation={[0, yaw, 0]}><ReadingTable /></group>)}
      <group position={[-53, READING.steps[1], 49.5]} rotation={[0, Math.PI, 0]}><Lectern /></group>
      <mesh position={[-54, QT_HALL + 0.01, 36]} rotation={[-Math.PI / 2, 0, 0]} material={rugB}><planeGeometry args={[15, 10]} /></mesh>
      <mesh position={[-54, QT_HALL + 0.012, 36]} rotation={[-Math.PI / 2, 0, 0]} material={rugM}><planeGeometry args={[14, 9]} /></mesh>
      {/* Lamp chains (the glowing lanterns are in QtAtmosphere). */}
      {LAMPS.map(([x, z, y]) => <QBeam key={`${x}${z}`} a={[x, y + 0.4, z]} b={[x, CELL.library.ceil, z]} w={0.05} t={0.05} m="iron" />)}
      {/* Scroll cubbies along the east + west walls between the shelves. */}
      {[[-71.4, 45, Math.PI / 2], [-34.6, 45, -Math.PI / 2], [-34.6, 29.5, -Math.PI / 2], [-71.4, 29.5, Math.PI / 2]].map(([x, z, yaw]) => (
        <group key={`${x}${z}`} position={[x, QT_HALL, z]} rotation={[0, yaw, 0]}>
          <QBox p={[0, 1.6, 0]} s={[3, 3.2, 0.9]} m="woodSide" />
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[-1.1 + (i % 4) * 0.73, 0.6 + Math.floor(i / 4) * 0.95, 0.46]} rotation={[Math.PI / 2, 0, 0]} material={mat("#e9dcb8")}>
              <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      <Panel p={[-53, QT_HALL + 6.2, 53.98]} yaw={Math.PI} w={6} h={2.6} frame="woodSide" />
    </group>
  );
}

function SunkenPit() {
  const tabs = [
    [[-111.98, QT_PIT_FLOOR + 3.5, -46], Math.PI / 2], [[-111.98, QT_PIT_FLOOR + 3.5, -24], Math.PI / 2],
    [[-62.02, QT_PIT_FLOOR + 3.5, -20], -Math.PI / 2], [[-90, QT_PIT_FLOOR + 3.5, -59.98], 0], [[-100, QT_PIT_FLOOR + 9, -59.98], 0],
    [[-84, QT_HALL + 3.5, -59.98], 0], [[-111.98, QT_HALL + 3.5, -38], Math.PI / 2], [[-62.02, QT_HALL + 3.5, -40], -Math.PI / 2],
  ];
  return (
    <group>
      {tabs.map(([p, yaw], i) => <Panel key={i} p={p} yaw={yaw} w={3.2} h={4.2} frame="darkBricks" green={i % 3 === 1} />)}
      {/* A fallen column on the pit floor + a few urns. */}
      <QCyl p={[-96, QT_PIT_FLOOR + 0.8, -46]} rt={0.8} h={9} m="statue" seg={14} rot={[0, 0, Math.PI / 2 - 0.12]} />
      <QBox p={[-101.6, QT_PIT_FLOOR + 0.6, -46.5]} s={[2.2, 1.2, 2.2]} m="marbleWall" />
      {[[-108, -40], [-106, -36], [-74, -20], [-75.5, -18]].map(([x, z]) => <group key={`${x}${z}`} position={[x, QT_PIT_FLOOR, z]}><Urn s={1.1} /></group>)}
      {/* Brick buttresses down the pit walls under the ledges. */}
      {[-104, -92, -80].map((x) => <QBox key={x} p={[x, (QT_PIT_FLOOR + QT_HALL) / 2, PIT.z0 + PIT.ledge + 0.3]} s={[1.2, QT_HALL - QT_PIT_FLOOR, 0.6]} m="darkBricks" tile={2} />)}
    </group>
  );
}

function CobraThrone() {
  const c = CELL.throne;
  const ringM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1d14", roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), []);
  const ringG = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9a521", metalness: 0.7, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), []);
  const cols = PILLARS.filter((p) => p[3] === "cobra");
  const top = THRONE.tiers[THRONE.tiers.length - 1].top;
  const beams = [];
  for (let x = 46; x <= 90; x += 8) for (let z = -8; z <= 40; z += 8) beams.push([x, z]);
  return (
    <group>
      {cols.map(([x, z, r]) => (
        <group key={`${x}${z}`} position={[x, QT_HALL, z]} rotation={[0, z > 16 ? Math.PI : 0, 0]}><CobraPillar h={c.ceil - QT_HALL} r={r} /></group>
      ))}
      <group position={[93.2, top, 16]} scale={0.9}><CobraStatue /></group>
      {/* The recessed ring in the floor before the dais. */}
      <mesh position={[64, QT_HALL + 0.012, 16]} rotation={[-Math.PI / 2, 0, 0]} material={ringM}><ringGeometry args={[5.2, 7.4, 48]} /></mesh>
      <mesh position={[64, QT_HALL + 0.014, 16]} rotation={[-Math.PI / 2, 0, 0]} material={ringG}><ringGeometry args={[7.4, 7.8, 48]} /></mesh>
      <mesh position={[64, QT_HALL + 0.014, 16]} rotation={[-Math.PI / 2, 0, 0]} material={ringG}><ringGeometry args={[4.8, 5.2, 48]} /></mesh>
      {/* A runner from the doorway to the dais. */}
      <QBox p={[60, QT_HALL + 0.02, 16]} s={[40, 0.04, 3.2]} m="carpet" />
      {/* Glowing green glyph walls. */}
      {[46, 76, 86].map((x) => (
        <group key={x}>
          <Panel p={[x, QT_HALL + 5.5, c.z0 + 0.02]} yaw={0} w={6} h={7} green />
          <Panel p={[x, QT_HALL + 5.5, c.z1 - 0.02]} yaw={Math.PI} w={6} h={7} green />
        </group>
      ))}
      <Panel p={[c.x1 - 0.02, QT_HALL + 7.4, 6]} yaw={-Math.PI / 2} w={5} h={6} green />
      <Panel p={[c.x1 - 0.02, QT_HALL + 7.4, 26]} yaw={-Math.PI / 2} w={5} h={6} green />
      {/* The ceiling's hanging blocks. */}
      {beams.map(([x, z]) => <QBox key={`${x}${z}`} p={[x, c.ceil - 0.22, z]} s={[3.4, 0.44, 3.4]} m="darkStone" />)}
      {/* Gold steps edging on the dais tiers. */}
      {THRONE.tiers.map((t, i) => <QBox key={i} p={[t.x0 + 0.05, t.top - 0.03, (t.z0 + t.z1) / 2]} s={[0.14, 0.08, t.z1 - t.z0]} m="gold" />)}
    </group>
  );
}

function Treasury() {
  return (
    <group>
      {COIN_PILES.map(([x, z, r], i) => <group key={i} position={[x, QT_HALL, z]}><CoinPile r={r} seed={i + 1} /></group>)}
      <group position={[IDOL.p[0], QT_HALL, IDOL.p[1]]} rotation={[0, Math.PI, 0]}><Idol /></group>
      {[[43.5, 60], [43.5, 64], [74.5, 60], [74.5, 64], [50, 73], [68, 73]].map(([x, z], i) => (
        <group key={i} position={[x, QT_HALL, z]}><Urn s={i % 2 ? 1.4 : 1.1} m={i % 3 === 0 ? "gold" : "#a8643a"} /></group>
      ))}
      {[[53, 72.6, 0], [65, 72.6, 0], [74.6, 54, -Math.PI / 2]].map(([x, z, yaw], i) => (
        <group key={i} position={[x, QT_HALL, z]} rotation={[0, yaw + Math.PI, 0]}><Chest open={i === 1} s={1.1} /></group>
      ))}
      <Panel p={[59, QT_HALL + 5, 73.98]} yaw={Math.PI} w={7} h={3} />
      {/* Stacks of gold bars. */}
      {[[50, 66, 0.3], [68, 66, -0.4], [56, 54, 0.1], [62.5, 70.5, 0.8]].map(([x, z, yaw], i) => (
        <group key={`bars${i}`} position={[x, QT_HALL, z]} rotation={[0, yaw, 0]}>
          {[0, 1, 2].map((row) => [0, 1, 2, 3].slice(0, 4 - row).map((c) => (
            <QBox key={`${row}${c}`} p={[(c - (3 - row) / 2) * 0.55, 0.14 + row * 0.27, 0]} s={[0.48, 0.26, 1.0]} m="gold" />
          )))}
        </group>
      ))}
      {/* Four gold-banded columns round the idol. */}
      {[[54, 57], [64, 57], [54, 67], [64, 67]].map(([x, z]) => (
        <group key={`tc${x}${z}`}>
          <QCyl p={[x, (QT_HALL + CELL.treasury.ceil) / 2, z]} rt={0.55} h={CELL.treasury.ceil - QT_HALL} m="sandstone" seg={14} />
          {[1.2, 4.5, 7.8].map((y) => <QCyl key={y} p={[x, QT_HALL + y, z]} rt={0.6} h={0.35} m="gold" seg={14} />)}
        </group>
      ))}
    </group>
  );
}

function GuardiansCourt() {
  const c = CELL.court;
  // Little sand drifts against the walls.
  const drifts = [[32, -34, 3], [98, -34, 3], [33, -58, 2.4], [97, -58, 2.4], [40, -78, 2.8], [90, -78, 2.8]];
  const sandM = useMemo(() => qtMat("#ffffff", { map: getQtTextures().sand, rough: 1 }), []);
  return (
    <group>
      {GUARDIANS.map((g) => (
        <group key={g.id} position={[g.p[0], g.y, g.p[1]]} rotation={[0, g.yaw, 0]}><GuardianHead s={g.s} /></group>
      ))}
      {drifts.map(([x, z, r], i) => {
        const y = z < COURT.tier3.z1 ? COURT.tier3.top : z < COURT.tier2.z1 ? COURT.tier2.top : QT_HALL;
        return <mesh key={i} position={[x, y, z]} scale={[1, 0.3, 1]} material={sandM}><sphereGeometry args={[r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>;
      })}
      {/* Broken columns about the court. */}
      {[[40, -64, 4], [88, -64, 6], [50, -52, 2.5], [78, -52, 3.5]].map(([x, z, h]) => {
        const y = z < COURT.tier3.z1 ? COURT.tier3.top : COURT.tier2.top;
        return (
          <group key={`${x}${z}`}>
            <QBox p={[x, y + 0.4, z]} s={[2, 0.8, 2]} m="sandstone" />
            <QCyl p={[x, y + 0.8 + h / 2, z]} rt={0.62} rb={0.7} h={h} m="stone" seg={14} />
          </group>
        );
      })}
      {/* The light well's rim in the ceiling. */}
      <mesh position={[64, c.ceil - 0.05, -56]} rotation={[Math.PI / 2, 0, 0]} material={mat("goldDark")}><torusGeometry args={[4.4, 0.35, 8, 32]} /></mesh>
      <Panel p={[64, COURT.tier3.top + 4.5, c.z0 + 0.02]} yaw={0} w={9} h={4.5} />
    </group>
  );
}

export default function QtRooms() {
  return (
    <StaticBatch>
      {OPENINGS.map((o, i) => <ArchFrame key={i} o={o} />)}
      {RAILS.map((r) => <Balustrade key={r.id} r={r} />)}
      {TORCHES.map((t, i) => <Sconce key={i} t={t} />)}
      {BRAZIERS.map((b) => <Brazier key={b.id} b={b} />)}
      <Vestibule />
      <Descent />
      <HallOfHeads />
      <Library />
      <SunkenPit />
      <CobraThrone />
      <Treasury />
      <GuardiansCourt />
    </StaticBatch>
  );
}

export { GALLERY };
