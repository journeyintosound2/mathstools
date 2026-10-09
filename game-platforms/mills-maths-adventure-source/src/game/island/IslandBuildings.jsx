import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Box, Cyl, Rod, GableRoof, RoofTrim, Window, prismGeometry } from "../farm/farmKit.jsx";
import { flatMat, getFarmTextures } from "../farm/farmMaterials.js";
import { getIslandTextures, islandSignTexture } from "./islandMaterials.js";
import { useFontsReady } from "./useFontsReady.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { playerState } from "../sessionStore.js";
import {
  PLAZA, PLAZA_FOUNTAIN, MISSION_BOARD_POS, TROPHY_STAND_POS, PLAZA_BENCHES, COTTAGES, SCHOOLHOUSE, SCHOOL_FENCE,
  LIGHTHOUSE, ROPE_BRIDGE, ISLAND_JETTY, COVE_PIER, ISLAND_SAILBOAT, ROWBOATS, BEACH_HUTS, FARM_BARN, FARM_WINDMILL,
  ISLAND_FIELDS, SEA_Y,
} from "../../data/island/islandLayout.js";
import {
  terrainHeight, PLAZA_DECK_Y, PLAZA_BASE_Y, PLAZA_FLIGHTS, getIslandDecks,
} from "../../data/island/islandTerrain.js";

/**
 * ISLAND BUILDINGS — the hand-built set-pieces: the raised MISSION PLAZA
 * (octagonal paved deck, ashlar retaining wall, four stair flights with
 * cheek walls, planters, benches, the Number Fountain, the Mission Board +
 * the Trophy plinth), the village COTTAGES along Main Street, the island
 * SCHOOLHOUSE with its bell tower + playground + picket fence, ALBY'S
 * LIGHTHOUSE + the rope bridge, the HARBOUR (the jetty you arrived on + the
 * moored sailboat), SUNNY COVE (pier, beach huts, umbrellas, rowboats) and
 * the little FARM (barn, windmill, field fences). Static parts are merged by
 * StaticBatch (with a far LOD); animated bits (fountain jets, flags, the
 * windmill's sails, the lighthouse beam, the bobbing boat) stay outside.
 */
const TAU = Math.PI * 2;
const T = () => getIslandTextures();

// ---------------------------------------------------------------------------
// THE MISSION PLAZA
// ---------------------------------------------------------------------------
function octagonShape(apothem) {
  const R = apothem / Math.cos(Math.PI / 8);
  const s = new THREE.Shape();
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + (k / 8) * TAU;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (k === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
/** An octagonal slab: top at y = 0, `depth` deep, world-scale UVs on top. */
function octSlabGeometry(apothem, depth, uvScale = 6) {
  const g = new THREE.ExtrudeGeometry(octagonShape(apothem), { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(Math.PI / 2); // extrude down from y = 0
  const p = g.attributes.position, uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, p.getX(i) / uvScale, p.getZ(i) / uvScale);
    else uv.setXY(i, (p.getX(i) + p.getZ(i)) / 2.2, p.getY(i) / 2.2);
  }
  return g;
}

function PlazaStructure() {
  const tex = T();
  const [cx, cz] = PLAZA.center;
  const A = PLAZA.apothem;
  const wallDepth = PLAZA.rise + 0.6;
  const geos = useMemo(() => ({
    deck: octSlabGeometry(A, 0.3, 7),
    wall: octSlabGeometry(A, wallDepth, 2.2),
    coping: octSlabGeometry(A + 0.28, 0.2, 2),
    inlay: new THREE.RingGeometry(5.8, 6.4, 64),
    inlay2: new THREE.RingGeometry(9.6, 10.0, 64),
  }), [A, wallDepth]);
  const paving = useMemo(() => flatMat("#ffffff", { map: tex.paving, roughness: 0.8 }), [tex]);
  const ashlar = useMemo(() => flatMat("#ffffff", { map: tex.ashlar, roughness: 0.9 }), [tex]);
  const coping = useMemo(() => flatMat("#e8dcc4", { map: tex.ashlar, roughness: 0.85 }), [tex]);
  const flights = PLAZA_FLIGHTS;
  return (
    <group>
      {/* Wall (ashlar) + coping + paved deck. */}
      <mesh geometry={geos.wall} material={ashlar} position={[cx, PLAZA_DECK_Y - 0.02, cz]} castShadow receiveShadow />
      <mesh geometry={geos.coping} material={coping} position={[cx, PLAZA_DECK_Y + 0.02, cz]} castShadow receiveShadow />
      <mesh geometry={geos.deck} material={paving} position={[cx, PLAZA_DECK_Y + 0.04, cz]} receiveShadow />
      {/* Inlaid rings round the fountain (darker stone). */}
      <mesh geometry={geos.inlay} position={[PLAZA_FOUNTAIN.position[0], PLAZA_DECK_Y + 0.05, PLAZA_FOUNTAIN.position[1]]} rotation={[-Math.PI / 2, 0, 0]} material={flatMat("#a8957a", { roughness: 0.85 })} receiveShadow />
      <mesh geometry={geos.inlay2} position={[cx, PLAZA_DECK_Y + 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]} material={flatMat("#b8a487", { roughness: 0.85 })} receiveShadow />
      {/* Four stair flights + their stepped cheek walls. */}
      {flights.map((f) => {
        const yaw = Math.atan2(f.nx, f.nz);
        return (
          <group key={f.id} position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
            {Array.from({ length: f.steps }).map((_, k) => {
              const top = PLAZA_BASE_Y + (f.steps - k) * f.rise;
              const a0 = A + k * f.depth;
              const h = top - (PLAZA_BASE_Y - 0.35);
              return (
                <group key={k}>
                  <Box p={[0, top - h / 2, a0 + f.depth / 2]} s={[f.width, h, f.depth + 0.02]} m={ashlar} tile={1.6} />
                  {[-1, 1].map((s) => (
                    <Box key={s} p={[s * (f.width / 2 + 0.25), top + 0.25 - h / 2 + 0.22, a0 + f.depth / 2]} s={[0.5, h + 0.5, f.depth + 0.02]} m={coping} tile={1.6} />
                  ))}
                </group>
              );
            })}
            {/* Newel posts at the top of each flight. */}
            {[-1, 1].map((s) => (
              <group key={s} position={[s * (f.width / 2 + 0.25), PLAZA_DECK_Y, A + 0.3]}>
                <Box p={[0, 0.45, 0]} s={[0.62, 0.9, 0.62]} m={coping} tile={1} />
                <mesh position={[0, 1.0, 0]} castShadow material={flatMat("#d9cbb0", { roughness: 0.8 })}>
                  <sphereGeometry args={[0.28, 12, 8]} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
      {/* Planters on the four diagonal faces, overflowing with flowers. */}
      {[0, 1, 2, 3].map((k) => {
        const a = Math.PI / 4 + (k * Math.PI) / 2;
        const r = A - 1.1;
        const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
        return (
          <group key={k} position={[x, PLAZA_DECK_Y, z]} rotation={[0, a, 0]}>
            <Box p={[0, 0.3, 0]} s={[5.2, 0.6, 1.0]} m={coping} tile={1.2} />
            <Box p={[0, 0.58, 0]} s={[4.9, 0.08, 0.75]} m="#5b3f27" />
            {Array.from({ length: 11 }).map((_, i) => (
              <mesh key={i} position={[-2.2 + i * 0.44, 0.78 + (i % 2) * 0.06, (i % 3 - 1) * 0.16]} castShadow material={flatMat(["#ff6b8a", "#ffd23f", "#ffffff", "#b07cff", "#ff8a3d"][i % 5], { roughness: 0.7 })}>
                <icosahedronGeometry args={[0.2 + (i % 2) * 0.05, 0]} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`g${i}`} position={[-2 + i * 0.8, 0.7, 0]} castShadow material={flatMat("#4f9a3a", { roughness: 0.85 })}>
                <icosahedronGeometry args={[0.3, 0]} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Benches. */}
      {PLAZA_BENCHES.map(([x, z, r], i) => (
        <group key={i} position={[x, PLAZA_DECK_Y, z]} rotation={[0, r, 0]}>
          {[-0.8, 0.8].map((s) => <Box key={s} p={[s, 0.25, 0]} s={[0.12, 0.5, 0.5]} m="#2f4a3a" />)}
          <Box p={[0, 0.5, 0]} s={[2.0, 0.08, 0.5]} m="#a97a4a" />
          <Box p={[0, 0.85, -0.24]} s={[2.0, 0.4, 0.06]} m="#a97a4a" />
        </group>
      ))}
    </group>
  );
}

/** The Mission Board: a timber noticeboard under a little shingle roof. */
function MissionBoardPiece() {
  const ready = useFontsReady();
  const sign = useMemo(() => islandSignTexture("MISSION BOARD", { w: 512, h: 112, bg: "#1e6f6a", border: "#0f3f3c", font: "900 62px 'MMA Display', 'Trebuchet MS', sans-serif" }), [ready]);
  const notes = useMemo(() => {
    if (typeof document === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 340;
    const g = cv.getContext("2d");
    g.fillStyle = "#c79b62"; g.fillRect(0, 0, 512, 340);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,60,30,${Math.random() * 0.15})`; g.fillRect(Math.random() * 512, Math.random() * 340, 3, 3); }
    const cols = ["#fff6d6", "#d6f0ff", "#ffe0e6", "#e4ffd6", "#fff1c2"];
    const glyph = ["+ −", "½ ¾", "x = ?", "× ÷", "%", "−3 … 3"];
    for (let i = 0; i < 6; i++) {
      const x = 22 + (i % 3) * 162, y = 22 + Math.floor(i / 3) * 160;
      g.save(); g.translate(x + 70, y + 65); g.rotate((Math.random() - 0.5) * 0.18);
      g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(-64, -58, 136, 128);
      g.fillStyle = cols[i % cols.length]; g.fillRect(-68, -62, 136, 128);
      g.fillStyle = "#e23d3d"; g.beginPath(); g.arc(0, -52, 7, 0, TAU); g.fill();
      g.fillStyle = "#2b3a4a"; g.font = "700 30px 'MMA Rounded', 'Trebuchet MS', sans-serif"; g.textAlign = "center";
      g.fillText(glyph[i], 0, 6);
      g.fillStyle = "rgba(43,58,74,0.35)";
      for (let l = 0; l < 3; l++) g.fillRect(-46, 22 + l * 12, 92 - l * 18, 4);
      g.restore();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  const [x, z] = MISSION_BOARD_POS;
  const shingle = getFarmTextures().shingles;
  return (
    <group position={[x, PLAZA_DECK_Y, z]} rotation={[0, Math.PI / 2, 0]}>
      {[-1.25, 1.25].map((s) => <Box key={s} p={[s, 1.3, 0]} s={[0.22, 2.6, 0.22]} m="#7a5232" />)}
      <Box p={[0, 1.55, -0.04]} s={[2.75, 1.85, 0.12]} m="#6b4528" />
      <mesh position={[0, 1.5, 0.035]}><planeGeometry args={[2.45, 1.6]} /><meshStandardMaterial map={notes} roughness={0.85} /></mesh>
      <mesh position={[0, 2.68, 0.08]}><planeGeometry args={[2.3, 0.5]} /><meshStandardMaterial map={sign} roughness={0.7} /></mesh>
      <group position={[0, 2.95, 0]}>
        <GableRoof w={3.1} d={0.9} rise={0.45} oh={0.18} roof={flatMat("#ffffff", { map: shingle })} wall="#6b4528" tile={1.5} />
      </group>
    </group>
  );
}

/** The trophy plinth: a stone pedestal + a big golden cup + a star. */
function TrophyPiece() {
  const [x, z] = TROPHY_STAND_POS;
  const gold = flatMat("#ffcf4a", { roughness: 0.25, metalness: 0.75, emissive: "#a8700a" });
  const cup = useMemo(() => {
    const pts = [];
    const prof = [[0, 0], [0.45, 0], [0.45, 0.1], [0.16, 0.18], [0.12, 0.55], [0.2, 0.65], [0.62, 0.9], [0.68, 1.45], [0.62, 1.5], [0.5, 1.0], [0, 0.95]];
    prof.forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
    return new THREE.LatheGeometry(pts, 28);
  }, []);
  return (
    <group position={[x, PLAZA_DECK_Y, z]} rotation={[0, -Math.PI / 2, 0]}>
      <Box p={[0, 0.5, 0]} s={[1.4, 1.0, 1.4]} m={flatMat("#ffffff", { map: T().ashlar })} tile={1} />
      <Box p={[0, 1.06, 0]} s={[1.6, 0.12, 1.6]} m="#d9cbb0" />
      <Box p={[0, 1.2, 0]} s={[0.9, 0.18, 0.9]} m="#3b2a1d" />
      <mesh geometry={cup} material={gold} position={[0, 1.29, 0]} scale={1.05} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.74, 2.45, 0]} rotation={[0, 0, s * 0.2]} material={gold} castShadow>
          <torusGeometry args={[0.24, 0.06, 8, 18, Math.PI * 1.2]} />
        </mesh>
      ))}
      <mesh position={[0, 3.0, 0]} material={gold}>
        <octahedronGeometry args={[0.22, 0]} />
      </mesh>
    </group>
  );
}

/** The Number Fountain: a stone basin, a tiered pedestal, a turning golden
 *  armillary globe, four arcing jets and rippling water. (Animated — not batched.) */
function NumberFountain() {
  const [fx, fz] = PLAZA_FOUNTAIN.position;
  const R = PLAZA_FOUNTAIN.radius;
  const globe = useRef();
  const jets = useRef();
  const rip = useRef([]);
  const N = 4 * 14;
  const jetGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, [N]);
  const tex = typeof document !== "undefined" ? getIslandTextures() : {};
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (globe.current) { globe.current.rotation.y = t * 0.4; globe.current.children[1].rotation.x = t * 0.3; }
    const far = Math.hypot(playerState.x - fx, playerState.z - fz) > 70;
    if (jets.current) jets.current.visible = !far;
    if (!far) {
      const a = jetGeo.attributes.position.array;
      for (let j = 0; j < 4; j++) {
        const ang = (j / 4) * TAU + Math.PI / 4;
        for (let k = 0; k < 14; k++) {
          const u = ((t * 0.9 + k / 14) % 1);
          const i = (j * 14 + k) * 3;
          const d = 0.6 + u * 2.0;
          a[i] = fx + Math.cos(ang) * d;
          a[i + 1] = PLAZA_DECK_Y + 2.1 + u * 1.6 - u * u * 3.2;
          a[i + 2] = fz + Math.sin(ang) * d;
        }
      }
      jetGeo.attributes.position.needsUpdate = true;
    }
    rip.current.forEach((m, i) => {
      if (!m) return;
      const a = (t * 0.5 + i / 3) % 1;
      m.scale.setScalar(0.8 + a * 2.2);
      m.material.opacity = (1 - a) * 0.4;
    });
  });
  const stone = flatMat("#ffffff", { map: tex.ashlar, roughness: 0.85 });
  const gold = flatMat("#ffcf4a", { roughness: 0.25, metalness: 0.75, emissive: "#a8700a" });
  return (
    <group>
      <group position={[fx, PLAZA_DECK_Y, fz]}>
        <Cyl p={[0, 0.32, 0]} rt={R} rb={R + 0.1} h={0.64} seg={32} m={stone} />
        <Cyl p={[0, 0.66, 0]} rt={R + 0.12} rb={R + 0.12} h={0.1} seg={32} m="#e2d5bb" />
        {/* Water surface. */}
        <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <circleGeometry args={[R - 0.15, 40]} />
          <meshStandardMaterial color="#48c4d6" roughness={0.1} metalness={0.1} transparent opacity={0.85} emissive="#0e5a6a" emissiveIntensity={0.35} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => (rip.current[i] = el)} position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
            <ringGeometry args={[0.9, 1, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
        {/* Tiered pedestal + bowl. */}
        <Cyl p={[0, 0.9, 0]} rt={0.5} rb={0.75} h={1.0} seg={16} m={stone} />
        <Cyl p={[0, 1.5, 0]} rt={1.15} rb={0.4} h={0.35} seg={20} m="#e2d5bb" />
        <mesh position={[0, 1.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.05, 24]} />
          <meshStandardMaterial color="#5fd0e0" roughness={0.1} emissive="#0e5a6a" emissiveIntensity={0.35} />
        </mesh>
        <Cyl p={[0, 2.1, 0]} rt={0.18} rb={0.28} h={0.9} seg={12} m={stone} />
        {/* The armillary globe. */}
        <group ref={globe} position={[0, 3.25, 0]}>
          <mesh material={gold} castShadow><torusGeometry args={[0.72, 0.05, 8, 40]} /></mesh>
          <group>
            <mesh material={gold} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.72, 0.05, 8, 40]} /></mesh>
            <mesh material={gold} rotation={[0, Math.PI / 2, 0.4]}><torusGeometry args={[0.66, 0.04, 8, 40]} /></mesh>
          </group>
          <mesh>
            <sphereGeometry args={[0.36, 20, 14]} />
            <meshStandardMaterial color="#3fa9e0" roughness={0.3} emissive="#1b5f8a" emissiveIntensity={0.4} />
          </mesh>
        </group>
      </group>
      <points ref={jets} geometry={jetGeo} frustumCulled={false}>
        <pointsMaterial color="#d8f6ff" size={0.22} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
      </points>
    </group>
  );
}

/** Two tall flagpoles at the plaza's south stairs with waving banners. */
function PlazaFlags() {
  const flags = useRef([]);
  const geo = useMemo(() => new THREE.PlaneGeometry(1.6, 1.0, 12, 4), []);
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo]);
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 160;
    const g = cv.getContext("2d");
    g.fillStyle = "#2f7dd1"; g.fillRect(0, 0, 256, 160);
    g.fillStyle = "#ffd23f"; g.fillRect(0, 124, 256, 36);
    g.fillStyle = "#ffffff";
    g.font = "900 78px 'MMA Display', 'Trebuchet MS', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("π", 128, 66);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const u = (x + 0.8) / 1.6;
      p.setZ(i, Math.sin(t * 3.2 - u * 5 + y) * 0.12 * u);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
  const [cx, cz] = PLAZA.center;
  const z = cz + PLAZA.apothem - 0.8;
  return (
    <group>
      {[-1, 1].map((s, i) => (
        <group key={s} position={[cx + s * 6.6, PLAZA_DECK_Y, z]}>
          <Cyl p={[0, 0.2, 0]} rt={0.35} rb={0.45} h={0.4} m="#d9cbb0" />
          <Cyl p={[0, 3.6, 0]} rt={0.06} rb={0.08} h={7.2} m="#e8eef2" />
          <mesh position={[0, 7.25, 0]} material={flatMat("#ffcf4a", { metalness: 0.6, roughness: 0.3 })}><sphereGeometry args={[0.13, 10, 8]} /></mesh>
          <mesh ref={(el) => (flags.current[i] = el)} geometry={geo} position={[0.86 * s, 6.4, 0]} scale={[s, 1, 1]}>
            <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// VILLAGE COTTAGES (front faces local +z)
// ---------------------------------------------------------------------------
function Cottage({ c }) {
  const tex = T();
  const y = terrainHeight(c.x, c.z);
  const H = 3.2, rise = 2.1;
  const wall = flatMat(c.wall, { map: tex.plaster, roughness: 0.9 });
  const roof = flatMat(c.roof, { map: tex.roof, roughness: 0.8 });
  return (
    <group position={[c.x, y, c.z]} rotation={[0, c.rotationY, 0]}>
      <Box p={[0, -0.3, 0]} s={[c.w + 0.4, 0.8, c.d + 0.4]} m={flatMat("#ffffff", { map: tex.ashlarDark })} tile={1.4} />
      <Box p={[0, H / 2 + 0.1, 0]} s={[c.w, H, c.d]} m={wall} tile={2} />
      <group position={[0, H + 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof w={c.d} d={c.w} rise={rise} oh={0.45} roof={roof} wall={wall} tile={1.6} />
        <RoofTrim w={c.d} d={c.w} rise={rise} oh={0.45} color="#fff8ec" />
      </group>
      {/* Door + step + a little porch light. */}
      <Box p={[0, 1.15, c.d / 2 + 0.03]} s={[1.05, 2.1, 0.08]} m={c.door} />
      <mesh position={[0.36, 1.15, c.d / 2 + 0.09]} material={flatMat("#ffd66b", { metalness: 0.6, roughness: 0.3 })}><sphereGeometry args={[0.05, 8, 6]} /></mesh>
      <Box p={[0, 0.12, c.d / 2 + 0.45]} s={[1.6, 0.24, 0.8]} m="#cfc2a8" />
      <mesh position={[0.9, 2.45, c.d / 2 + 0.15]} material={flatMat("#fff1c4", { emissive: "#ffcf6a", emissiveIntensity: 0.6 })}><sphereGeometry args={[0.12, 10, 8]} /></mesh>
      {/* Windows with shutters + flower boxes. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Window p={[s * (c.w / 2 - 1.25), 1.75, c.d / 2]} w={0.95} h={1.05} shutters={c.door} />
          <Box p={[s * (c.w / 2 - 1.25), 1.05, c.d / 2 + 0.22]} s={[1.2, 0.22, 0.3]} m="#7a5232" />
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[s * (c.w / 2 - 1.25) - 0.35 + k * 0.35, 1.25, c.d / 2 + 0.24]} material={flatMat(["#ff6b8a", "#ffd23f", "#ffffff"][k], { roughness: 0.7 })}>
              <icosahedronGeometry args={[0.14, 0]} />
            </mesh>
          ))}
          <Window p={[s * (c.w / 2 + 0.01), 1.75, 0]} r={[0, s * Math.PI / 2, 0]} w={0.9} h={1.0} />
        </group>
      ))}
      <Window p={[0, 1.75, -c.d / 2 - 0.01]} r={[0, Math.PI, 0]} w={0.9} h={1.0} />
      {/* Chimney. */}
      <Box p={[c.w / 2 - 1.1, H + rise + 0.2, -c.d / 4]} s={[0.7, 1.9, 0.7]} m={flatMat("#ffffff", { map: tex.ashlarDark })} tile={1} />
      <Box p={[c.w / 2 - 1.1, H + rise + 1.18, -c.d / 4]} s={[0.84, 0.14, 0.84]} m="#8a7d6a" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SCHOOLHOUSE (front faces +z — the yard + the Playground gate)
// ---------------------------------------------------------------------------
function Schoolhouse() {
  const ready = useFontsReady();
  const S = SCHOOLHOUSE;
  const y = terrainHeight(S.x, S.z);
  const ftex = getFarmTextures();
  const tex = T();
  const wall = flatMat("#f3e6c8", { map: tex.weatherboard, roughness: 0.85 });
  const roof = flatMat("#ffffff", { map: ftex.redIron, roughness: 0.6, metalness: 0.2 });
  const trim = "#ffffff";
  const H = 3.6, rise = 2.6;
  const sign = useMemo(() => islandSignTexture(["NUMBER ISLAND SCHOOL", "est. 2026"], { w: 768, h: 170, bg: "#24476e", border: "#152b44", font: "900 64px 'MMA Display', 'Trebuchet MS', sans-serif", sub: "700 36px 'MMA Rounded', 'Trebuchet MS', sans-serif" }), [ready]);
  return (
    <group position={[S.x, y, S.z]} rotation={[0, S.rotationY, 0]}>
      {/* Stumps + floor + walls. */}
      <Box p={[0, 0.25, 0]} s={[S.w + 0.2, 0.7, S.d + 0.2]} m="#8a7d6a" />
      <Box p={[0, 0.65 + H / 2, 0]} s={[S.w, H, S.d]} m={wall} tile={2.2} />
      <group position={[0, 0.65 + H, 0]}>
        <GableRoof w={S.w} d={S.d} rise={rise} oh={0.55} roof={roof} wall={wall} tile={1.8} />
        <RoofTrim w={S.w} d={S.d} rise={rise} oh={0.55} color={trim} />
      </group>
      {/* Verandah across the front: deck, posts, a skillion roof. */}
      <Box p={[0, 0.55, S.d / 2 + 1.3]} s={[S.w + 0.4, 0.2, 2.6]} m="#b48a5c" />
      {[-1, -0.33, 0.33, 1].map((u) => <Box key={u} p={[u * (S.w / 2), 0.65 + 1.55, S.d / 2 + 2.45]} s={[0.16, 3.1, 0.16]} m={trim} />)}
      <Box p={[0, 0.65 + 3.2, S.d / 2 + 1.35]} r={[0.18, 0, 0]} s={[S.w + 1, 0.1, 2.9]} m={roof} tile={1.6} />
      {[0, 1, 2].map((k) => <Box key={k} p={[0, 0.12 + k * 0.15, S.d / 2 + 2.75 + (2 - k) * 0.3]} s={[2.6, 0.24 + k * 0.15, 0.32]} m="#cfc2a8" />)}
      {/* Doors, windows, the sign. */}
      <Box p={[0, 0.65 + 1.15, S.d / 2 + 0.04]} s={[1.6, 2.3, 0.08]} m="#2f6d5a" />
      <Box p={[0, 0.65 + 1.15, S.d / 2 + 0.09]} s={[0.05, 2.3, 0.03]} m="#22503f" />
      {[-1, 1].flatMap((s) => [1.9, 4.3].map((dx) => (
        <Window key={`${s}${dx}`} p={[s * dx, 0.65 + 1.9, S.d / 2]} w={1.3} h={1.5} frame={trim} glass="#7fa9c4" />
      )))}
      {[-1, 1].map((s) => <Window key={`side${s}`} p={[s * (S.w / 2 + 0.01), 0.65 + 1.9, 0]} r={[0, s * Math.PI / 2, 0]} w={1.3} h={1.5} frame={trim} />)}
      <mesh position={[0, 0.65 + 4.25, S.d / 2 + 0.62]}>
        <planeGeometry args={[4.6, 1.02]} />
        <meshStandardMaterial map={sign} roughness={0.7} />
      </mesh>
      {/* Bell tower on the ridge. */}
      <group position={[0, 0.65 + H + rise, 0]}>
        <Box p={[0, 0.5, 0]} s={[1.8, 1.0, 1.8]} m={wall} tile={1.4} />
        {[[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].map(([px, pz], i) => <Box key={i} p={[px, 1.6, pz]} s={[0.16, 1.4, 0.16]} m={trim} />)}
        <mesh position={[0, 2.75, 0]} rotation={[0, Math.PI / 4, 0]} material={roof} castShadow><coneGeometry args={[1.55, 1.3, 4]} /></mesh>
        <mesh position={[0, 3.5, 0]} material={flatMat("#ffcf4a", { metalness: 0.6, roughness: 0.3 })}><sphereGeometry args={[0.14, 10, 8]} /></mesh>
        <mesh position={[0, 1.55, 0]} material={flatMat("#c9962d", { metalness: 0.7, roughness: 0.3 })} castShadow>
          <cylinderGeometry args={[0.18, 0.42, 0.6, 14, 1, true]} />
        </mesh>
      </group>
    </group>
  );
}
function SchoolYard() {
  const F = SCHOOL_FENCE;
  const y = (x, z) => terrainHeight(x, z);
  const picket = flatMat("#fbfaf4", { roughness: 0.8 });
  const pickets = [];
  for (let x = F.x0; x <= F.x1 + 1e-6; x += 0.45) {
    if (Math.abs(x) < F.gateHalf) continue;
    pickets.push(x);
  }
  const sides = [];
  for (let k = 0; k <= 20; k++) sides.push(F.z - k * 0.45);
  return (
    <group>
      {pickets.map((x) => (
        <group key={x} position={[x, y(x, F.z), F.z]}>
          <Box p={[0, 0.55, 0]} s={[0.12, 1.1, 0.05]} m={picket} cast={false} />
          <mesh position={[0, 1.14, 0]} rotation={[0, Math.PI / 4, 0]} material={picket}><coneGeometry args={[0.09, 0.14, 4]} /></mesh>
        </group>
      ))}
      {[F.x0, F.x1].map((sx) => sides.map((z) => (
        <group key={`${sx}${z}`} position={[sx, y(sx, z), z]}>
          <Box p={[0, 0.55, 0]} s={[0.05, 1.1, 0.12]} m={picket} cast={false} />
        </group>
      )))}
      {/* Rails (front, both halves) + gate posts. */}
      {[[F.x0, -F.gateHalf], [F.gateHalf, F.x1]].map(([a, b], i) => [0.35, 0.85].map((ry) => {
        const mx = (a + b) / 2;
        return <Box key={`${i}${ry}`} p={[mx, y(mx, F.z) + ry, F.z - 0.05]} s={[b - a, 0.07, 0.04]} m={picket} cast={false} />;
      }))}
      {[-F.gateHalf, F.gateHalf].map((x) => (
        <group key={x} position={[x, y(x, F.z), F.z]}>
          <Box p={[0, 0.85, 0]} s={[0.3, 1.7, 0.3]} m="#e9e2d0" />
          <mesh position={[0, 1.8, 0]} material={flatMat("#e9e2d0")}><sphereGeometry args={[0.2, 10, 8]} /></mesh>
        </group>
      ))}
      {/* A swing set + a slide in the yard. */}
      <group position={[-8, y(-8, -55), -55]}>
        {[-1.2, 1.2].map((s) => [-0.6, 0.6].map((d) => <Rod key={`${s}${d}`} a={[s, 0, d]} b={[s, 2.6, 0]} r={0.06} m="#d64545" />))}
        <Rod a={[-1.25, 2.6, 0]} b={[1.25, 2.6, 0]} r={0.07} m="#d64545" />
        {[-0.55, 0.55].map((s) => (
          <group key={s}>
            <Rod a={[s - 0.2, 2.6, 0]} b={[s - 0.2, 0.55, 0]} r={0.015} m="#555555" />
            <Rod a={[s + 0.2, 2.6, 0]} b={[s + 0.2, 0.55, 0]} r={0.015} m="#555555" />
            <Box p={[s, 0.52, 0]} s={[0.55, 0.06, 0.25]} m="#2f7dd1" />
          </group>
        ))}
      </group>
      <group position={[8, y(8, -55), -55]} rotation={[0, -0.3, 0]}>
        <Box p={[0, 1.0, -1.2]} s={[0.9, 0.08, 0.9]} m="#ffd23f" />
        {[-0.4, 0.4].map((s) => <Rod key={s} a={[s, 0, -1.6]} b={[s, 1.0, -1.6]} r={0.05} m="#2f7dd1" />)}
        {[-0.4, 0.4].map((s) => <Rod key={`l${s}`} a={[s, 0, -0.8]} b={[s, 1.0, -0.8]} r={0.05} m="#2f7dd1" />)}
        <Box p={[0, 0.55, 0.15]} r={[-0.62, 0, 0]} s={[0.75, 0.06, 2.6]} m="#ff6b3d" />
      </group>
      {/* A flagpole by the gate. */}
      <group position={[5.5, y(5.5, -52.5), -52.5]}>
        <Cyl p={[0, 4, 0]} rt={0.05} rb={0.07} h={8} m="#e8eef2" />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// ALBY'S LIGHTHOUSE + the rope bridge
// ---------------------------------------------------------------------------
function Lighthouse() {
  const L = LIGHTHOUSE;
  const y = terrainHeight(L.position[0], L.position[1]);
  const H = L.height;
  const bands = 5;
  return (
    <group position={[L.position[0], y, L.position[1]]}>
      <Cyl p={[0, 0.4, 0]} rt={L.radius + 0.6} rb={L.radius + 0.8} h={0.8} seg={20} m={flatMat("#ffffff", { map: T().ashlarDark })} />
      {Array.from({ length: bands }).map((_, k) => {
        const h = H / bands;
        const r0 = L.radius - (L.radius - 1.7) * (k / bands), r1 = L.radius - (L.radius - 1.7) * ((k + 1) / bands);
        return <Cyl key={k} p={[0, 0.8 + h * k + h / 2, 0]} rt={r1} rb={r0} h={h} seg={20} m={k % 2 ? "#d93a3a" : "#f7f4ee"} />;
      })}
      {/* Door + little windows. */}
      <Box p={[0, 1.8, L.radius - 0.05]} s={[1.0, 1.9, 0.2]} m="#2b4a6b" />
      {[5, 9].map((wy) => <Box key={wy} p={[0, wy, L.radius - 0.25 - (wy / H) * 0.85]} s={[0.55, 0.8, 0.2]} m="#9fd0ea" />)}
      {/* Gallery + railing + lantern room + dome. */}
      <Cyl p={[0, H + 0.95, 0]} rt={2.45} rb={2.2} h={0.3} seg={24} m="#2f3a46" />
      {Array.from({ length: 18 }).map((_, k) => {
        const a = (k / 18) * TAU;
        return <Rod key={k} a={[Math.cos(a) * 2.3, H + 1.1, Math.sin(a) * 2.3]} b={[Math.cos(a) * 2.3, H + 1.95, Math.sin(a) * 2.3]} r={0.035} m="#2f3a46" />;
      })}
      <mesh position={[0, H + 1.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#2f3a46")}><torusGeometry args={[2.3, 0.05, 6, 36]} /></mesh>
      <Cyl p={[0, H + 1.6, 0]} rt={1.5} rb={1.5} h={0.9} seg={18} m="#2f3a46" />
      <mesh position={[0, H + 2.75, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 1.4, 18, 1, true]} />
        <meshStandardMaterial color="#fff8d0" emissive="#ffd86b" emissiveIntensity={0.9} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H + 3.85, 0]} material={flatMat("#d93a3a", { roughness: 0.5 })} castShadow><sphereGeometry args={[1.5, 18, 10, 0, TAU, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, H + 5.45, 0]} material={flatMat("#2f3a46")}><coneGeometry args={[0.12, 0.5, 8]} /></mesh>
      {/* Keeper's hut. */}
      <group position={[-3.6, 0, -2.8]} rotation={[0, 0.4, 0]}>
        <Box p={[0, 1.1, 0]} s={[3, 2.2, 2.4]} m={flatMat("#f7f4ee", { map: T().plaster })} />
        <group position={[0, 2.2, 0]}>
          <GableRoof w={3} d={2.4} rise={1.1} oh={0.25} roof={flatMat("#d93a3a", { roughness: 0.6 })} wall={flatMat("#f7f4ee", { map: T().plaster })} />
        </group>
        <Box p={[0.6, 0.9, 1.22]} s={[0.8, 1.6, 0.06]} m="#2b4a6b" />
      </group>
    </group>
  );
}
/** The lantern's turning beams (animated). */
function LighthouseBeam() {
  const L = LIGHTHOUSE;
  const ref = useRef();
  const y = terrainHeight(L.position[0], L.position[1]) + L.height + 2.75;
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.7; });
  return (
    <group ref={ref} position={[L.position[0], y, L.position[1]]}>
      {[0, Math.PI].map((r) => (
        <mesh key={r} rotation={[0, r, Math.PI / 2]} position={[Math.cos(r) * 7, 0, -Math.sin(r) * 7]}>
          <coneGeometry args={[2.2, 14, 16, 1, true]} />
          <meshBasicMaterial color="#fff2b8" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color="#ffe08a" intensity={14} distance={22} decay={1.5} />
    </group>
  );
}
function RopeBridge() {
  const deck = useMemo(() => getIslandDecks().find((d) => d.id === "rope-bridge"), []);
  const B = ROPE_BRIDGE;
  const dx = B.to[0] - B.from[0], dz = B.to[1] - B.from[1];
  const L = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const n = Math.round(L / 0.42);
  const planks = useMemo(() => Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    return { x: B.from[0] + dx * t, z: B.from[1] + dz * t, y: deck.yAt(t) - 0.06, rz: ((i * 7) % 5 - 2) * 0.012 };
  }), [n, deck, B, dx, dz]);
  const rope = useMemo(() => [-1, 1].map((s) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      pts.push(new THREE.Vector3(B.from[0] + dx * t + nx * (B.halfWidth + 0.15) * s, deck.yAt(t) + 1.05 + 0.1 * Math.sin(Math.PI * t), B.from[1] + dz * t + nz * (B.halfWidth + 0.15) * s));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 6, false);
  }), [deck, B, dx, dz, nx, nz]);
  const ropeMat = flatMat("#c9a66b", { roughness: 0.9 });
  const plankMat = flatMat("#ffffff", { map: T().planks, roughness: 0.85 });
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, yaw, p.rz]} material={plankMat} castShadow receiveShadow>
          <boxGeometry args={[B.halfWidth * 2 + 0.3, 0.09, 0.36]} />
        </mesh>
      ))}
      {rope.map((g, i) => <mesh key={i} geometry={g} material={ropeMat} castShadow />)}
      {[0, 1].map((e) => [-1, 1].map((s) => {
        const t = e;
        const x = B.from[0] + dx * t + nx * (B.halfWidth + 0.15) * s - ux * (e ? -0.2 : 0.2), z = B.from[1] + dz * t + nz * (B.halfWidth + 0.15) * s - uz * (e ? -0.2 : 0.2);
        const y = deck.yAt(t);
        return <Cyl key={`${e}${s}`} p={[x, y + 0.6, z]} rt={0.16} rb={0.2} h={2.0} m="#7a5232" />;
      }))}
      {/* Hanger ropes down to the deck every metre. */}
      {Array.from({ length: Math.floor(L) }).map((_, i) => {
        const t = (i + 0.5) / Math.floor(L);
        return [-1, 1].map((s) => {
          const x = B.from[0] + dx * t + nx * (B.halfWidth + 0.15) * s, z = B.from[1] + dz * t + nz * (B.halfWidth + 0.15) * s;
          const y = deck.yAt(t);
          return <Rod key={`${i}${s}`} a={[x, y, z]} b={[x, y + 1.05 + 0.1 * Math.sin(Math.PI * t), z]} r={0.02} m="#c9a66b" cast={false} />;
        });
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// HARBOUR + SUNNY COVE
// ---------------------------------------------------------------------------
function Boardwalk({ deckId, spec }) {
  const deck = useMemo(() => getIslandDecks().find((d) => d.id === deckId), [deckId]);
  const dx = spec.to[0] - spec.from[0], dz = spec.to[1] - spec.from[1];
  const L = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const n = Math.round(L / 0.5);
  const plankMat = flatMat("#ffffff", { map: T().planks, roughness: 0.85 });
  const post = flatMat("#6b4a30", { roughness: 0.9 });
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const t = (i + 0.5) / n;
        const y = deck.yAt(t);
        return (
          <mesh key={i} position={[spec.from[0] + dx * t, y - 0.06, spec.from[1] + dz * t]} rotation={[0, yaw, 0]} material={plankMat} castShadow receiveShadow>
            <boxGeometry args={[spec.halfWidth * 2 + 0.2, 0.1, 0.46]} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.floor(L / 3) + 1 }).map((_, i) => {
        const t = Math.min(1, (i * 3) / L);
        if (t < 0.22) return null;
        const y = deck.yAt(t);
        return [-1, 1].map((s) => (
          <group key={`${i}${s}`} position={[spec.from[0] + dx * t + nx * (spec.halfWidth + 0.2) * s, 0, spec.from[1] + dz * t + nz * (spec.halfWidth + 0.2) * s]}>
            <mesh position={[0, (y + 1.0 - 2.5) / 2, 0]} material={post} castShadow><cylinderGeometry args={[0.13, 0.15, y + 1.0 + 2.5, 8]} /></mesh>
          </group>
        ));
      })}
      {/* Rope railings. */}
      {[-1, 1].map((s) => {
        const pts = [];
        for (let k = 0; k <= 20; k++) {
          const t = 0.22 + (k / 20) * 0.78;
          pts.push(new THREE.Vector3(spec.from[0] + dx * t + nx * (spec.halfWidth + 0.2) * s, deck.yAt(t) + 0.9 - 0.08 * Math.abs(Math.sin(k * 1.57)), spec.from[1] + dz * t + nz * (spec.halfWidth + 0.2) * s));
        }
        return <mesh key={s} castShadow><tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 40, 0.035, 5, false]} /><meshStandardMaterial color="#d9c08f" roughness={0.9} /></mesh>;
      })}
      {/* Bollards + a lamp at the end. */}
      <group position={[spec.to[0] - ux * 0.4, deck.yAt(1), spec.to[1] - uz * 0.4]}>
        <Cyl p={[0, 1.6, 0]} rt={0.07} rb={0.09} h={3.2} m="#2f3a46" />
        <mesh position={[0, 3.3, 0]}>
          <boxGeometry args={[0.36, 0.42, 0.36]} />
          <meshStandardMaterial color="#fff1c4" emissive="#ffcf6a" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}
/** A rowboat (static, on the sand) or the hull for the sailboat. */
function hullGeometry(len, beam, depth) {
  const s = new THREE.Shape();
  s.moveTo(0, -len / 2);
  s.bezierCurveTo(beam * 0.55, -len / 2 + 0.2, beam / 2, -len * 0.1, beam / 2, len * 0.15);
  s.bezierCurveTo(beam / 2, len * 0.38, beam * 0.3, len / 2, 0, len / 2);
  s.bezierCurveTo(-beam * 0.3, len / 2, -beam / 2, len * 0.38, -beam / 2, len * 0.15);
  s.bezierCurveTo(-beam / 2, -len * 0.1, -beam * 0.55, -len / 2 + 0.2, 0, -len / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
  g.rotateX(Math.PI / 2);
  g.translate(0, depth, 0);
  // Taper the keel: pull the bottom vertices in.
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 0.55 + 0.45 * Math.min(1, Math.max(0, y / depth));
    p.setX(i, p.getX(i) * k);
  }
  g.computeVertexNormals();
  return g;
}
function Rowboat({ x, z, r, color }) {
  const g = useMemo(() => hullGeometry(3.2, 1.3, 0.55), []);
  const y = Math.max(terrainHeight(x, z), SEA_Y);
  return (
    <group position={[x, y + 0.05, z]} rotation={[0.04, r, 0.1]}>
      <mesh geometry={g} material={flatMat(color, { roughness: 0.6 })} castShadow />
      <Box p={[0, 0.55, 0]} s={[1.0, 0.06, 0.32]} m="#b48a5c" />
      <Box p={[0, 0.55, 0.8]} s={[0.8, 0.06, 0.3]} m="#b48a5c" />
      <Rod a={[-0.5, 0.6, -0.4]} b={[0.9, 0.3, 0.9]} r={0.04} m="#b48a5c" />
    </group>
  );
}
function Sailboat() {
  const ref = useRef();
  const S = ISLAND_SAILBOAT;
  const hull = useMemo(() => hullGeometry(7.2, 2.6, 1.1), []);
  const sail = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(0, 6.4); s.quadraticCurveTo(1.6, 3.2, 3.0, 0.2); s.closePath();
    return new THREE.ShapeGeometry(s, 12);
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.position.y = SEA_Y - 0.45 + Math.sin(t * 0.9) * 0.1;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.035;
    ref.current.rotation.x = Math.sin(t * 0.55 + 1) * 0.02;
  });
  return (
    <group ref={ref} position={[S.position[0], SEA_Y - 0.45, S.position[1]]} rotation={[0, S.rotationY, 0]}>
      <mesh geometry={hull} material={flatMat("#f7f4ee", { roughness: 0.5 })} castShadow />
      <Box p={[0, 1.18, 0]} s={[2.0, 0.08, 5.4]} m="#c49a64" />
      <Box p={[0, 1.18, 0]} s={[2.3, 0.18, 6.2]} m="#2f6fb5" />
      <Cyl p={[0, 4.6, -0.6]} rt={0.07} rb={0.1} h={7.2} m="#c49a64" />
      <Rod a={[0, 1.9, -0.6]} b={[0, 1.9, 2.6]} r={0.06} m="#c49a64" />
      <mesh geometry={sail} position={[0.02, 1.9, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <meshStandardMaterial color="#fffaf0" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[0, 8.3, -0.6]} material={flatMat("#d93a3a")}><boxGeometry args={[0.04, 0.4, 0.7]} /></mesh>
    </group>
  );
}
function BeachHut({ x, z, r, i }) {
  const y = terrainHeight(x, z);
  const col = ["#ff7a8a", "#4fb3e8", "#ffd23f"][i % 3];
  return (
    <group position={[x, y, z]} rotation={[0, r, 0]}>
      <Box p={[0, 0.15, 0]} s={[3.2, 0.3, 2.8]} m="#c9a66b" />
      {Array.from({ length: 7 }).map((_, k) => (
        <Box key={k} p={[-1.35 + k * 0.45, 1.45, 0]} s={[0.45, 2.3, 2.4]} m={k % 2 ? "#ffffff" : col} />
      ))}
      <group position={[0, 2.6, 0]}>
        <GableRoof w={3.1} d={2.6} rise={1.0} oh={0.25} roof={flatMat(col, { roughness: 0.6 })} wall="#ffffff" />
      </group>
      <Box p={[0, 1.15, 1.22]} s={[0.9, 1.7, 0.06]} m="#2f3a46" />
    </group>
  );
}
function Umbrella({ x, z, col }) {
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0.08, x, 0.05]}>
      <Rod a={[0, 0, 0]} b={[0, 2.4, 0]} r={0.04} m="#e8eef2" />
      {Array.from({ length: 8 }).map((_, k) => (
        <mesh key={k} position={[0, 2.25, 0]} rotation={[0, (k / 8) * TAU, 0]}>
          <coneGeometry args={[1.5, 0.6, 2, 1, true, 0, TAU / 8]} />
          <meshStandardMaterial color={k % 2 ? "#ffffff" : col} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      ))}
      <Box p={[0.6, 0.03, 1.0]} r={[0, 0.3, 0]} s={[0.8, 0.03, 1.8]} m={col} cast={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE LITTLE FARM — barn, windmill (sails animated), field fences.
// ---------------------------------------------------------------------------
function Barn() {
  const B = FARM_BARN;
  const y = terrainHeight(B.x, B.z);
  const ftex = getFarmTextures();
  const wall = flatMat("#ffffff", { map: ftex.barn, roughness: 0.85 });
  const roof = flatMat("#ffffff", { map: ftex.iron, roughness: 0.6, metalness: 0.2 });
  return (
    <group position={[B.x, y, B.z]} rotation={[0, B.rotationY, 0]}>
      <Box p={[0, 2.2, 0]} s={[B.w, 4.4, B.d]} m={wall} tile={2.4} />
      <group position={[0, 4.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof w={B.d} d={B.w} rise={2.8} oh={0.4} roof={roof} wall={wall} tile={1.6} />
        <RoofTrim w={B.d} d={B.w} rise={2.8} oh={0.4} color="#fff8ec" />
      </group>
      {/* Big doors with the white X braces. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.25, 1.75, B.d / 2 + 0.04]}>
          <Box p={[0, 0, 0]} s={[2.4, 3.4, 0.1]} m="#9a2f22" />
          <Box p={[0, 0, 0.06]} r={[0, 0, 0.95]} s={[0.16, 4.0, 0.04]} m="#fff8ec" />
          <Box p={[0, 0, 0.06]} r={[0, 0, -0.95]} s={[0.16, 4.0, 0.04]} m="#fff8ec" />
          <Box p={[0, 0, 0.07]} s={[2.4, 0.16, 0.04]} m="#fff8ec" />
        </group>
      ))}
      <Box p={[0, 5.6, B.d / 2 + 0.04]} s={[1.3, 1.1, 0.08]} m="#2b2b2b" />
    </group>
  );
}
function WindmillSails() {
  const ref = useRef();
  const W = FARM_WINDMILL;
  const y = terrainHeight(W.position[0], W.position[1]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z += dt * 0.7; });
  return (
    <group position={[W.position[0], y + W.height + 0.3, W.position[1] + 2.1]} rotation={[0, 0.5, 0]}>
      <group ref={ref}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI) / 2]}>
            <Box p={[0, 3.0, 0]} s={[0.16, 5.8, 0.12]} m="#6b4a30" />
            <Box p={[0.45, 3.4, 0.03]} s={[0.85, 4.4, 0.04]} m="#f2ead8" />
            {[1.6, 2.6, 3.6, 4.6].map((yy) => <Box key={yy} p={[0.45, yy, 0.06]} s={[0.95, 0.05, 0.04]} m="#6b4a30" />)}
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={flatMat("#3b2a1d")}><cylinderGeometry args={[0.35, 0.35, 0.5, 12]} /></mesh>
      </group>
    </group>
  );
}
function WindmillTower() {
  const W = FARM_WINDMILL;
  const y = terrainHeight(W.position[0], W.position[1]);
  const shingle = getFarmTextures().shingles;
  return (
    <group position={[W.position[0], y, W.position[1]]} rotation={[0, 0.5, 0]}>
      <Cyl p={[0, W.height / 2, 0]} rt={1.6} rb={2.4} h={W.height} seg={8} m={flatMat("#ffffff", { map: T().ashlar })} uvTile={2} />
      <mesh position={[0, W.height + 1.0, 0]} rotation={[0, Math.PI / 8, 0]} material={flatMat("#ffffff", { map: shingle })} castShadow><coneGeometry args={[2.0, 2.4, 8]} /></mesh>
      <Box p={[0, 1.1, 2.25]} s={[1.0, 2.0, 0.2]} m="#5b3f27" />
      <Window p={[0, 4.5, 1.98]} r={[-0.05, 0, 0]} w={0.6} h={0.8} />
    </group>
  );
}
function FieldFences() {
  const posts = [];
  for (const f of ISLAND_FIELDS) {
    const n = Math.round((Math.PI * 2 * Math.max(f.rx, f.rz) + 4) / 2.2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      if (Math.abs(Math.sin(a - 0.3)) < 0.1 && Math.cos(a) > 0) continue; // a gap on the east side
      posts.push({ x: f.c[0] + Math.cos(a) * (f.rx + 1.3), z: f.c[1] + Math.sin(a) * (f.rz + 1.3), a });
    }
  }
  return (
    <group>
      {posts.map((p, i) => {
        const y = terrainHeight(p.x, p.z);
        return <Box key={i} p={[p.x, y + 0.55, p.z]} s={[0.14, 1.1, 0.14]} m="#7a5232" cast={false} />;
      })}
      {posts.map((p, i) => {
        const q = posts[(i + 1) % posts.length];
        if (Math.hypot(q.x - p.x, q.z - p.z) > 3.2) return null;
        const ya = terrainHeight(p.x, p.z), yb = terrainHeight(q.x, q.z);
        return [0.45, 0.9].map((h) => <Rod key={`${i}${h}`} a={[p.x, ya + h, p.z]} b={[q.x, yb + h, q.z]} r={0.04} m="#9a6a40" cast={false} />);
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
export default function IslandBuildings({ highGfx }) {
  return (
    <group>
      <StaticBatch>
        <PlazaStructure />
        <MissionBoardPiece />
        <TrophyPiece />
      </StaticBatch>
      <NumberFountain />
      <PlazaFlags />
      <StaticBatch farDist={140}>
        {COTTAGES.map((c) => <Cottage key={c.id} c={c} />)}
      </StaticBatch>
      <StaticBatch farDist={150}>
        <Schoolhouse />
        <SchoolYard />
      </StaticBatch>
      <StaticBatch farDist={160}>
        <Lighthouse />
        <RopeBridge />
      </StaticBatch>
      <LighthouseBeam />
      <StaticBatch farDist={150}>
        <Boardwalk deckId="jetty" spec={ISLAND_JETTY} />
        <Boardwalk deckId="cove-pier" spec={COVE_PIER} />
        {ROWBOATS.map(([x, z, r], i) => <Rowboat key={i} x={x} z={z} r={r} color={["#2f7dd1", "#ff7a3d", "#3aa76d"][i % 3]} />)}
        {BEACH_HUTS.map(([x, z, r], i) => <BeachHut key={i} x={x} z={z} r={r} i={i} />)}
        <Umbrella x={47} z={73} col="#ff5a6a" />
        <Umbrella x={54} z={75.5} col="#2f8ad8" />
        <Umbrella x={-7} z={95} col="#ffb02e" />
      </StaticBatch>
      <Sailboat />
      <StaticBatch farDist={150}>
        <Barn />
        <WindmillTower />
        <FieldFences />
      </StaticBatch>
      <WindmillSails />
    </group>
  );
}
