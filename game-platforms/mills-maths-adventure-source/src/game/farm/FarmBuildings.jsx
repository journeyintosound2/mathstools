import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  FARM_BARN, FARM_HOUSE, FARM_SILO, FARM_COOP, FARM_TRACTOR, FARM_WINDMILL, FARM_TANK, FARM_PACKING_SHED,
  FARM_SAWMILL, FARM_MILKING_SHED, FARM_GRAIN_SILOS, FARM_GLASSHOUSES, FARM_SHEARING_SHED, FARM_UTE,
  FARM_HAY_TRACTOR, FARM_PADDOCKS,
} from "../../data/farm/farmLayout.js";
import { terrainHeight } from "../../data/farm/farmTerrain.js";
import { getFarmTextures, flatMat, signTexture } from "./farmMaterials.js";
import { Box, Cyl, Rod, GableRoof, RoofTrim, Window, Ladder, extrudeGeometry } from "./farmKit.jsx";
import StaticBatch from "../jungle/StaticBatch.jsx";

/**
 * FARM BUILDINGS — the homestead (red gambrel barn, the weatherboard
 * farmhouse with its veranda, feed silo, chook coop, water windmill + tank,
 * the old red tractor, the ute), the packing shed, the OLD SAWMILL with its
 * turning water wheel, the milking shed, the grain silos + weighbridge, the
 * glasshouses, the shearing shed on the downs and the hay tractor. Static
 * parts are merged per area (StaticBatch); the turning wheels stay live.
 */
const Y = (x, z) => terrainHeight(x, z);
function useMats() {
  const t = getFarmTextures();
  return useMemo(() => ({
    barn: flatMat("#ffffff", { map: t.barn, roughness: 0.85 }),
    trim: flatMat("#f3ead8", { roughness: 0.7 }),
    redIron: flatMat("#ffffff", { map: t.redIron, roughness: 0.55, metalness: 0.25 }),
    iron: flatMat("#ffffff", { map: t.iron, roughness: 0.45, metalness: 0.45 }),
    rusty: flatMat("#ffffff", { map: t.rustyIron, roughness: 0.75, metalness: 0.2 }),
    greenIron: flatMat("#ffffff", { map: t.greenIron, roughness: 0.55, metalness: 0.25 }),
    cream: flatMat("#ffffff", { map: t.creamboard, roughness: 0.8 }),
    white: flatMat("#ffffff", { map: t.weatherboard, roughness: 0.8 }),
    boards: flatMat("#ffffff", { map: t.boards, roughness: 0.9 }),
    grey: flatMat("#ffffff", { map: t.greyBoards, roughness: 0.92 }),
    straw: flatMat("#ffffff", { map: t.straw, roughness: 1 }),
    wood: flatMat("#7a5a3e", { roughness: 0.9 }),
    darkWood: flatMat("#4f3a29", { roughness: 0.9 }),
    steel: flatMat("#9aa3a8", { roughness: 0.4, metalness: 0.6 }),
    concrete: flatMat("#b9b5aa", { roughness: 0.95 }),
    glass: flatMat("#cfe8ee", { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32, side: THREE.DoubleSide }),
    tank: flatMat("#ffffff", { map: t.iron, roughness: 0.4, metalness: 0.5 }),
  }), [t]);
}

// ---------------------------------------------------------------------------
// THE BARN — big red gambrel barn, doors to the south (the yard).
// ---------------------------------------------------------------------------
function Barn({ M }) {
  const B = FARM_BARN;
  const W = B.w, D = B.d, H = 5.2;
  // Gambrel profile across x (ridge along z), eaves at y = H.
  const prof = [[-W / 2, 0], [W / 2, 0], [W / 2 * 0.62, 3.1], [0, 4.4], [-W / 2 * 0.62, 3.1]];
  const gableGeo = useMemo(() => extrudeGeometry(prof.map(([x, y]) => [x, y]), D, "barn-gable"), []);
  const roofSlabs = useMemo(() => {
    const pts = [[-W / 2 - 0.55, -0.35], [-W / 2 * 0.62, 3.1], [0, 4.4], [W / 2 * 0.62, 3.1], [W / 2 + 0.55, -0.35]];
    const out = [];
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      out.push({ p: [(x0 + x1) / 2, (y0 + y1) / 2 + 0.08, 0], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)], s: [len + 0.12, 0.16, D + 1.0] });
    }
    return out;
  }, []);
  const y = Y(B.x, B.z);
  return (
    <group position={[B.x, y, B.z]}>
      <Box p={[0, -0.2, 0]} s={[W + 0.4, 0.5, D + 0.4]} m={M.concrete} />
      <Box p={[0, H / 2, 0]} s={[W, H, D]} m={M.barn} tile={3} />
      <mesh geometry={gableGeo} position={[0, H, 0]} material={M.barn} castShadow receiveShadow />
      <group position={[0, H, 0]}>
        {roofSlabs.map((s, i) => <Box key={i} p={s.p} r={s.r} s={s.s} m={M.redIron} tile={2.5} />)}
        <Box p={[0, 4.55, 0]} s={[0.5, 0.14, D + 1.05]} m={M.trim} />
      </group>
      {/* White corner trim + eave line. */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} p={[sx * (W / 2 + 0.02), H / 2, sz * (D / 2 + 0.02)]} s={[0.22, H, 0.22]} m={M.trim} />)}
      {/* South face: the big double doors (white X-braced) + the hay loft. */}
      <group position={[0, 0, D / 2 + 0.04]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.85, 2.0, 0]}>
            <Box s={[3.6, 4.0, 0.12]} m={M.barn} tile={3} />
            <Box p={[0, 0, 0.08]} s={[3.7, 0.18, 0.06]} m={M.trim} />
            <Box p={[0, 1.95, 0.08]} s={[3.7, 0.18, 0.06]} m={M.trim} />
            <Box p={[0, -1.95, 0.08]} s={[3.7, 0.18, 0.06]} m={M.trim} />
            <Box p={[s * 1.78, 0, 0.08]} s={[0.18, 4.0, 0.06]} m={M.trim} />
            <Box p={[0, 0, 0.09]} r={[0, 0, Math.atan2(3.8, 3.4)]} s={[5.0, 0.16, 0.05]} m={M.trim} />
            <Box p={[0, 0, 0.09]} r={[0, 0, -Math.atan2(3.8, 3.4)]} s={[5.0, 0.16, 0.05]} m={M.trim} />
          </group>
        ))}
        <Box p={[0, 4.12, 0.06]} s={[7.8, 0.22, 0.2]} m={M.steel} />
        <group position={[0, H + 1.6, 0]}>
          <Box s={[2.2, 2.0, 0.1]} m={M.darkWood} />
          <Box p={[0, 0, 0.06]} s={[2.4, 0.14, 0.06]} m={M.trim} />
          <Box p={[0, 1.05, 0.06]} s={[2.4, 0.14, 0.06]} m={M.trim} />
          <Box p={[0, -1.05, 0.06]} s={[2.4, 0.14, 0.06]} m={M.trim} />
          {/* A bale peeking out of the loft + the hoist beam. */}
          <Box p={[0, -0.65, 0.35]} s={[1.1, 0.5, 0.5]} m={M.straw} tile={1} />
          <Box p={[0, 1.45, 0.9]} s={[0.16, 0.16, 1.9]} m={M.darkWood} />
        </group>
      </group>
      {/* Windows down the long sides. */}
      {[-1, 1].map((s) => [-3.5, 0, 3.5].map((z) => (
        <Window key={`${s}${z}`} p={[s * (W / 2 + 0.02), 2.6, z]} r={[0, (s * Math.PI) / 2, 0]} w={1.0} h={1.1} frame="#f3ead8" glass="#3b4a52" />
      )))}
      {/* The cupola + weathervane on the ridge. */}
      <group position={[0, H + 4.5, 0]}>
        <Box p={[0, 0.55, 0]} s={[1.4, 1.1, 1.4]} m={M.barn} tile={1.5} />
        <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]} material={M.redIron} castShadow>
          <coneGeometry args={[1.25, 0.9, 4]} />
        </mesh>
        <Rod a={[0, 1.8, 0]} b={[0, 3.0, 0]} r={0.03} m="#3a3a3a" />
        <Box p={[0, 2.75, 0]} s={[1.1, 0.03, 0.03]} m="#3a3a3a" />
        <Box p={[0, 2.75, 0]} s={[0.03, 0.03, 1.1]} m="#3a3a3a" />
        <mesh position={[0.05, 3.15, 0]} castShadow>
          <boxGeometry args={[0.7, 0.32, 0.03]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* A lean-to on the east side with a tool rack + firewood. */}
      <group position={[W / 2 + 2.2, 0, 1]}>
        {[[-1.9, -3.4], [1.9, -3.4], [1.9, 3.4], [-1.9, 3.4]].map(([px, pz], i) => i % 3 !== 0 && <Box key={i} p={[px, 1.35, pz]} s={[0.16, 2.7, 0.16]} m={M.wood} />)}
        <Box p={[0, 2.9, 0]} r={[0, 0, -0.18]} s={[4.6, 0.12, 7.4]} m={M.rusty} />
        {[0, 1, 2].map((r) => <Box key={r} p={[0.6, 0.25 + r * 0.32, 0]} s={[1.6, 0.3, 5.5]} m={M.darkWood} tile={0.6} />)}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE FARMHOUSE — a cream weatherboard Queenslander with a red iron hip
// roof, a wraparound veranda, chimney, rainwater tank + a clothesline.
// Built facing +z, turned by rotationY (front → the yard, east).
// ---------------------------------------------------------------------------
function Farmhouse({ M }) {
  const H = FARM_HOUSE;
  const W = H.w, D = H.d, WH = 3.1, ST = 0.7; // stumps: the floor is raised
  const y = Y(H.x, H.z);
  const hip = useMemo(() => {
    // A hip roof: a four-sided pyramid-ish (ridge along x).
    const oh = 2.0; // the veranda roof continues the eaves
    const w = W + oh * 2, d = D + oh * 2, h = 2.6, ridge = Math.max(0.5, w - d);
    const v = [
      [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2],
      [-ridge / 2, h, 0], [ridge / 2, h, 0],
    ];
    const tri = [[0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4], [3, 4, 0]];
    const pos = [], uv = [];
    for (const [a, b, c] of tri) for (const i of [a, b, c]) { pos.push(...v[i]); uv.push(v[i][0] / 2.2 + v[i][2] / 2.2, v[i][1] / 1.2 + Math.abs(v[i][2]) / 2.2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }, []);
  const posts = [];
  for (let x = -W / 2 - 1.8; x <= W / 2 + 1.81; x += (W + 3.6) / 6) { posts.push([x, D / 2 + 1.8]); posts.push([x, -D / 2 - 1.8]); }
  for (let z = -D / 2 - 1.8 + (D + 3.6) / 4; z < D / 2 + 1.8; z += (D + 3.6) / 4) { posts.push([-W / 2 - 1.8, z]); posts.push([W / 2 + 1.8, z]); }
  return (
    <group position={[H.x, y, H.z]} rotation={[0, H.rotationY, 0]}>
      {/* Stumps + the raised floor + the veranda deck. */}
      <Box p={[0, ST / 2, 0]} s={[W + 4, ST, D + 4]} m={M.grey} tile={1.2} />
      <Box p={[0, ST / 2 - 0.05, 0]} s={[W + 3.9, ST - 0.1, D + 3.9]} m={M.darkWood} />
      <Box p={[0, ST + WH / 2, 0]} s={[W, WH, D]} m={M.cream} tile={2.4} />
      <mesh geometry={hip} position={[0, ST + WH + 0.05, 0]} material={M.redIron} castShadow receiveShadow />
      {/* Veranda posts + rail + lattice skirt. */}
      {posts.map(([x, z], i) => <Box key={i} p={[x, ST + WH / 2 + 0.05, z]} s={[0.14, WH + 0.1, 0.14]} m={M.trim} />)}
      {[[0, D / 2 + 1.85, W + 3.7, 0], [0, -D / 2 - 1.85, W + 3.7, 0], [-W / 2 - 1.85, 0, D + 3.7, 1], [W / 2 + 1.85, 0, D + 3.7, 1]].map(([x, z, L, rot], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, rot ? Math.PI / 2 : 0, 0]}>
          {i === 0 ? (
            <>
              <Box p={[-(L / 4 + 0.6), ST + 0.95, 0]} s={[L / 2 - 1.2, 0.08, 0.08]} m={M.trim} />
              <Box p={[L / 4 + 0.6, ST + 0.95, 0]} s={[L / 2 - 1.2, 0.08, 0.08]} m={M.trim} />
            </>
          ) : <Box p={[0, ST + 0.95, 0]} s={[L, 0.08, 0.08]} m={M.trim} />}
          <Box p={[0, ST + 0.25, 0]} s={[L, 0.05, 0.05]} m={M.trim} />
          {Array.from({ length: Math.floor(L / 0.25) }).map((_, k) => {
            const xx = -L / 2 + 0.125 + k * 0.25;
            if (i === 0 && Math.abs(xx) < 1.2) return null;
            return <Box key={k} p={[xx, ST + 0.6, 0]} s={[0.04, 0.7, 0.04]} m={M.trim} cast={false} />;
          })}
        </group>
      ))}
      {/* Front steps (centre, +z) + the front door + windows. */}
      {[0, 1, 2, 3].map((k) => <Box key={k} p={[0, ST - 0.12 - k * 0.17, D / 2 + 2.1 + k * 0.3]} s={[2.0, 0.12, 0.34]} m={M.grey} tile={1} />)}
      <Box p={[0, ST + 1.05, D / 2 + 0.03]} s={[1.0, 2.1, 0.08]} m="#3f6b4a" />
      <Box p={[0.32, ST + 1.0, D / 2 + 0.09]} s={[0.08, 0.08, 0.06]} m="#d9b44a" />
      {[-3.6, -1.9, 1.9, 3.6].map((x) => <Window key={x} p={[x, ST + 1.6, D / 2 + 0.02]} w={1.1} h={1.35} shutters="#3f6b4a" />)}
      {[-3, 0, 3].map((x) => <Window key={`b${x}`} p={[x, ST + 1.6, -D / 2 - 0.02]} r={[0, Math.PI, 0]} w={1.1} h={1.35} shutters="#3f6b4a" />)}
      {[-2, 2].map((z) => [1, -1].map((s) => <Window key={`s${z}${s}`} p={[s * (W / 2 + 0.02), ST + 1.6, z]} r={[0, (s * Math.PI) / 2, 0]} w={1.1} h={1.35} shutters="#3f6b4a" />))}
      {/* The chimney. */}
      <Box p={[-W / 2 + 1.6, ST + WH + 1.8, -1.6]} s={[0.9, 3.4, 0.9]} m="#9a5a44" />
      <Box p={[-W / 2 + 1.6, ST + WH + 3.55, -1.6]} s={[1.05, 0.15, 1.05]} m="#7a4634" />
      {/* Rainwater tank at the back corner (corrugated, on a stand). */}
      <group position={[W / 2 - 1.2, 0, -D / 2 - 2.9]}>
        <Box p={[0, 0.35, 0]} s={[2.6, 0.7, 2.6]} m={M.grey} tile={1} />
        <Cyl p={[0, 1.95, 0]} rt={1.2} rb={1.2} h={2.5} seg={20} m={M.tank} uvTile={1.4} />
        <mesh position={[0, 3.32, 0]} material={M.steel} castShadow>
          <coneGeometry args={[1.25, 0.35, 20]} />
        </mesh>
      </group>
      {/* The Hills Hoist in the back garden. */}
      <group position={[-1.5, 0, -D / 2 - 6]}>
        <Rod a={[0, 0, 0]} b={[0, 2.1, 0]} r={0.05} m={M.steel} />
        {[0, 1, 2, 3].map((k) => {
          const a = (k / 4) * Math.PI * 2 + 0.3;
          return <Rod key={k} a={[0, 2.0, 0]} b={[Math.cos(a) * 1.7, 2.15, Math.sin(a) * 1.7]} r={0.025} m={M.steel} />;
        })}
        {[[0.6, "#e85d75"], [-0.5, "#4f8fd8"], [1.1, "#f4d35e"]].map(([o, c], k) => (
          <mesh key={k} position={[o, 1.8, (k - 1) * 0.6]} rotation={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.55, 0.02]} />
            <meshStandardMaterial color={c} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** The galvanised feed silo: a cone-bottomed bin on legs with a ladder. */
function FeedSilo({ M }) {
  const S = FARM_SILO;
  const y = Y(S.x, S.z);
  const r = S.radius;
  return (
    <group position={[S.x, y, S.z]}>
      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        return <Rod key={k} a={[Math.cos(a) * r * 0.85, 0, Math.sin(a) * r * 0.85]} b={[Math.cos(a) * r * 0.95, 3.0, Math.sin(a) * r * 0.95]} r={0.09} m={M.steel} />;
      })}
      <mesh position={[0, 2.4, 0]} rotation={[Math.PI, 0, 0]} material={M.tank} castShadow>
        <coneGeometry args={[r, 1.6, 20, 1, true]} />
      </mesh>
      <Cyl p={[0, 3.2 + 2.6, 0]} rt={r} rb={r} h={5.2} seg={22} m={M.tank} uvTile={1.4} />
      <mesh position={[0, 8.4 + 0.6, 0]} material={M.steel} castShadow>
        <coneGeometry args={[r + 0.1, 1.2, 22]} />
      </mesh>
      <Cyl p={[0, 9.7, 0]} rt={0.25} rb={0.35} h={0.4} m={M.steel} />
      <group position={[0, 3.2, r + 0.12]}>
        <Ladder p={[0, 0, 0]} h={6.1} w={0.45} m="#7d8589" />
      </group>
    </group>
  );
}

/** The chook coop: a little red shed on stilts with a ramp + nest boxes. */
function ChookCoop({ M }) {
  const C = FARM_COOP;
  const y = Y(C.x, C.z);
  return (
    <group position={[C.x, y, C.z]}>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => <Box key={i} p={[sx * (C.w / 2 - 0.3), 0.4, sz * (C.d / 2 - 0.3)]} s={[0.14, 0.8, 0.14]} m={M.wood} />)}
      <Box p={[0, 1.65, 0]} s={[C.w, 1.7, C.d]} m={M.barn} tile={2} />
      <group position={[0, 2.5, 0]}>
        <GableRoof w={C.w} d={C.d} rise={1.0} oh={0.3} roof={M.iron} wall={M.barn} tile={1.5} />
      </group>
      <Box p={[0.8, 1.35, C.d / 2 + 0.03]} s={[0.6, 0.7, 0.06]} m={M.darkWood} />
      {/* Ramp down to the run. */}
      <Box p={[0.8, 0.45, C.d / 2 + 1.0]} r={[0.6, 0, 0]} s={[0.55, 0.05, 2.1]} m={M.wood} />
      {/* Nest boxes on the west end. */}
      <Box p={[-C.w / 2 - 0.35, 1.3, 0]} s={[0.7, 0.7, C.d - 0.8]} m={M.boards} tile={1} />
      <Box p={[-C.w / 2 - 0.35, 1.72, 0]} r={[0, 0, 0.35]} s={[0.85, 0.06, C.d - 0.6]} m={M.iron} />
    </group>
  );
}

/** A classic old red tractor (big rear wheels), facing +z. */
function Tractor({ position, rotationY = 0, color = "#c4382a", tilt = true }) {
  const [x, z] = position;
  const y = Y(x, z);
  const n = useMemo(() => {
    const e = 1.2;
    const gx = Y(x + e, z) - Y(x - e, z), gz = Y(x, z + e) - Y(x, z - e);
    return new THREE.Euler(tilt ? Math.atan2(-gz, 2 * e) : 0, rotationY, tilt ? Math.atan2(gx, 2 * e) : 0, "YXZ");
  }, [x, z, rotationY, tilt]);
  const body = flatMat(color, { roughness: 0.45, metalness: 0.2 });
  const tyre = flatMat("#262626", { roughness: 0.9 });
  const rim = flatMat("#d9c24a", { roughness: 0.5, metalness: 0.3 });
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <group rotation={[n.x, 0, n.z]}>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.85, 0.75, -0.7]} rotation={[0, 0, Math.PI / 2]} material={tyre} castShadow>
              <cylinderGeometry args={[0.75, 0.75, 0.42, 18]} />
            </mesh>
            <mesh position={[s * 0.98, 0.75, -0.7]} rotation={[0, 0, Math.PI / 2]} material={rim}>
              <cylinderGeometry args={[0.38, 0.38, 0.2, 12]} />
            </mesh>
            <mesh position={[s * 0.62, 0.42, 1.25]} rotation={[0, 0, Math.PI / 2]} material={tyre} castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.26, 14]} />
            </mesh>
            <mesh position={[s * 0.7, 0.42, 1.25]} rotation={[0, 0, Math.PI / 2]} material={rim}>
              <cylinderGeometry args={[0.2, 0.2, 0.14, 10]} />
            </mesh>
            {/* Mudguards. */}
            <Box p={[s * 0.85, 1.48, -0.7]} s={[0.5, 0.08, 1.3]} m={body} />
          </group>
        ))}
        <Box p={[0, 0.95, 0.55]} s={[0.8, 0.75, 1.9]} m={body} />
        <Box p={[0, 1.38, 0.75]} s={[0.72, 0.18, 1.5]} m={body} />
        <Box p={[0, 0.95, 1.55]} s={[0.84, 0.64, 0.12]} m="#3a3a3a" />
        <Box p={[0, 0.9, -0.55]} s={[0.9, 0.7, 0.9]} m="#4a4a4a" />
        <Box p={[0, 1.4, -0.75]} s={[0.6, 0.12, 0.5]} m="#2e2e2e" />
        <Box p={[0, 1.7, -0.98]} s={[0.6, 0.55, 0.1]} m="#2e2e2e" />
        <Rod a={[0, 1.4, -0.25]} b={[0, 1.85, 0.05]} r={0.03} m="#2e2e2e" />
        <mesh position={[0, 1.88, 0.07]} rotation={[-0.9, 0, 0]} material={flatMat("#2e2e2e")}>
          <torusGeometry args={[0.2, 0.03, 6, 14]} />
        </mesh>
        <Rod a={[0.25, 1.4, 1.1]} b={[0.25, 2.3, 1.1]} r={0.055} m="#3a3a3a" />
      </group>
    </group>
  );
}

/** The farm ute (a pickup), parked by the house. */
function Ute({ M }) {
  const U = FARM_UTE;
  const [x, z] = U.position;
  const y = Y(x, z);
  const paint = flatMat("#e9e4d8", { roughness: 0.35, metalness: 0.35 });
  const tyre = flatMat("#222222", { roughness: 0.9 });
  return (
    <group position={[x, y, z]} rotation={[0, U.rotationY, 0]}>
      {[[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.38, wz]} rotation={[0, 0, Math.PI / 2]} material={tyre} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.28, 14]} />
        </mesh>
      ))}
      <Box p={[0, 0.75, 0]} s={[1.8, 0.55, 4.6]} m={paint} />
      <Box p={[0, 1.35, 0.95]} s={[1.7, 0.7, 1.6]} m={paint} />
      <Box p={[0, 1.38, 1.76]} r={[-0.35, 0, 0]} s={[1.55, 0.6, 0.05]} m={M.glass} cast={false} />
      <Box p={[0, 1.38, 0.95]} s={[1.72, 0.45, 1.3]} m={flatMat("#2b3a44", { roughness: 0.1, metalness: 0.4 })} cast={false} />
      {/* Tray with a dog-box + a couple of feed bags. */}
      <Box p={[0, 1.1, -1.25]} s={[1.8, 0.08, 2.1]} m={M.steel} />
      {[-1, 1].map((s) => <Box key={s} p={[s * 0.88, 1.3, -1.25]} s={[0.06, 0.35, 2.1]} m={M.steel} />)}
      <Box p={[-0.35, 1.38, -1.0]} s={[0.55, 0.5, 0.4]} m="#d8c79a" />
      <Box p={[0.35, 1.34, -1.5]} s={[0.55, 0.42, 0.4]} m="#c9b484" />
      <Box p={[0, 0.82, 2.33]} s={[1.6, 0.25, 0.08]} m="#555555" />
    </group>
  );
}

// ---------------------------------------------------------------------------
// The WATER WINDMILL (Southern-Cross style): a steel lattice tower, a turning
// fan of blades + a tail vane, pumping into the corrugated tank.
// ---------------------------------------------------------------------------
function WaterWindmill({ M }) {
  const W = FARM_WINDMILL;
  const y = Y(W.x, W.z);
  const H = W.height;
  const fan = useRef();
  useFrame((_, dt) => { if (fan.current) fan.current.rotation.z += dt * 1.6; });
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return (
    <group position={[W.x, y, W.z]}>
      <StaticBatch>
        {legs.map(([sx, sz], i) => <Rod key={i} a={[sx * 1.6, 0, sz * 1.6]} b={[sx * 0.28, H, sz * 0.28]} r={0.07} m={M.steel} cast />)}
        {[1.5, 3.2, 4.9, 6.6].map((h) => {
          const k = 1.6 - (1.32 * h) / H;
          return legs.map(([sx, sz], i) => {
            const [nx, nz] = legs[(i + 1) % 4];
            return <Rod key={`${h}${i}`} a={[sx * k, h, sz * k]} b={[nx * k, h, nz * k]} r={0.04} m={M.steel} cast={false} />;
          });
        })}
        <Box p={[0, H + 0.2, 0]} s={[0.9, 0.3, 0.9]} m={M.steel} />
        <Box p={[0, H + 0.55, -0.9]} s={[0.08, 0.08, 2.4]} m={M.steel} />
        <Box p={[0, H + 0.75, -2.2]} s={[0.05, 1.2, 1.6]} m={flatMat("#c9cfd2", { metalness: 0.5, roughness: 0.4 })} />
        <Rod a={[0, 0, 0]} b={[0, H, 0]} r={0.03} m={M.steel} cast={false} />
      </StaticBatch>
      <group ref={fan} position={[0, H + 0.55, 0.55]}>
        <mesh material={M.steel}><cylinderGeometry args={[0.18, 0.18, 0.3, 10]} /></mesh>
        {Array.from({ length: 18 }).map((_, k) => {
          const a = (k / 18) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0]} rotation={[0.35, 0, a]} castShadow>
              <boxGeometry args={[1.5, 0.3, 0.02]} />
              <meshStandardMaterial color="#d8dde0" metalness={0.5} roughness={0.35} />
            </mesh>
          );
        })}
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.75, 0.03, 4, 30]} /><meshStandardMaterial color="#9aa3a8" metalness={0.6} roughness={0.4} /></mesh>
      </group>
    </group>
  );
}
function Tank({ M }) {
  const T = FARM_TANK;
  const y = Y(T.x, T.z);
  return (
    <group position={[T.x, y, T.z]}>
      <Cyl p={[0, 0.25, 0]} rt={T.radius + 0.15} rb={T.radius + 0.25} h={0.5} seg={22} m={M.concrete} />
      <Cyl p={[0, 0.5 + T.height / 2, 0]} rt={T.radius} rb={T.radius} h={T.height} seg={24} m={M.tank} uvTile={1.4} />
      <mesh position={[0, 0.5 + T.height + 0.22, 0]} material={M.steel} castShadow>
        <coneGeometry args={[T.radius + 0.05, 0.45, 24]} />
      </mesh>
      <Rod a={[-1.5, 2.6, 0.2]} b={[-T.radius - 3.6, 9, 0.0]} r={0.04} m={M.steel} cast={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE PACKING SHED — open-fronted steel shed at the orchard: apple bins,
// a grading table, a ladder, crates stacked high.
// ---------------------------------------------------------------------------
function PackingShed({ M }) {
  const S = FARM_PACKING_SHED;
  const y = Y(S.x, S.z);
  const H = 3.6;
  const bins = [];
  for (let i = 0; i < 6; i++) bins.push([-5.2 + i * 1.6, -1.6, i % 3 === 0 ? "#c8352b" : i % 3 === 1 ? "#d9c44a" : "#7cb342"]);
  return (
    <group position={[S.x, y, S.z]}>
      <Box p={[0, 0.05, 0]} s={[S.w + 0.6, 0.12, S.d + 0.6]} m={M.concrete} />
      {[-S.w / 2, -S.w / 6, S.w / 6, S.w / 2].map((x) => [-S.d / 2, S.d / 2].map((z) => (
        <Box key={`${x}${z}`} p={[x, H / 2, z]} s={[0.18, H + (z < 0 ? 0.7 : 0), 0.18]} m={M.steel} />
      )))}
      {/* Back wall (north) in iron, skillion roof falling to the front. */}
      <Box p={[0, (H + 0.7) / 2, -S.d / 2 - 0.05]} s={[S.w, H + 0.7, 0.1]} m={M.iron} tile={2} />
      {[-1, 1].map((s) => <Box key={s} p={[s * S.w / 2, H / 2, -S.d / 4]} s={[0.1, H, S.d / 2]} m={M.iron} tile={2} />)}
      <Box p={[0, H + 0.42, 0]} r={[-0.1, 0, 0]} s={[S.w + 1.0, 0.12, S.d + 1.3]} m={M.iron} tile={2.4} />
      {/* The grading table + crates of fruit inside. */}
      <Box p={[0, 0.9, -0.8]} s={[6, 0.12, 1.4]} m={M.wood} />
      {[-2.6, 0, 2.6].map((x) => <Box key={x} p={[x, 0.45, -0.8]} s={[0.12, 0.9, 1.2]} m={M.darkWood} />)}
      {bins.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, 0.45, 0]} s={[1.3, 0.9, 1.3]} m={M.boards} tile={0.8} />
          <mesh position={[0, 0.88, 0]} material={flatMat(c, { roughness: 0.5 })}>
            <sphereGeometry args={[0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((r) => [0, 1].map((c) => <Box key={`${r}${c}`} p={[5.4 - c * 0.7, 0.25 + r * 0.42, 1.8]} s={[0.62, 0.38, 0.45]} m={M.boards} tile={0.5} />))}
      <Ladder p={[-6.6, 0, 2.6]} h={3.4} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE OLD SAWMILL — weathered timber mill with a rusty roof, the saw bench
// under a lean-to, a chimney, and the WATER WHEEL turning in the creek.
// ---------------------------------------------------------------------------
function Sawmill({ M }) {
  const S = FARM_SAWMILL;
  const y = Y(S.x, S.z);
  const H = 4.4;
  return (
    <group position={[S.x, y, S.z]}>
      <Box p={[0, 0.15, 0]} s={[S.w + 0.4, 0.3, S.d + 0.4]} m="#7d7462" />
      <Box p={[0, H / 2, 0]} s={[S.w, H, S.d]} m={M.grey} tile={2.2} />
      <group position={[0, H, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof w={S.d} d={S.w} rise={2.4} oh={0.5} roof={M.rusty} wall={M.grey} tile={2} />
        <RoofTrim w={S.d} d={S.w} rise={2.4} oh={0.5} color="#5f4a36" />
      </group>
      {/* Big sliding door + a window, the mill's name board. */}
      <Box p={[1.6, 1.6, S.d / 2 + 0.04]} s={[3.0, 3.2, 0.1]} m={M.boards} tile={1.6} />
      <Window p={[-2.6, 2.4, S.d / 2 + 0.02]} w={1.2} h={1.0} frame="#5f4a36" glass="#2f3a3e" />
      <SignBoard p={[0, H + 0.95, S.d / 2 + 0.6]} lines={["OLD SAWMILL", "est. 1898"]} w={3.6} h={1.1} />
      {/* The saw bench under a lean-to on the east side: a log on the carriage + the blade. */}
      <group position={[S.w / 2 + 2.6, 0, 0.4]}>
        {[[-2, -3], [2, -3], [2, 3], [-2, 3]].map(([px, pz], i) => i > 0 && i < 3 && <Box key={i} p={[px, 1.6, pz]} s={[0.18, 3.2, 0.18]} m={M.darkWood} />)}
        <Box p={[0, 3.25, 0]} r={[0, 0, -0.2]} s={[4.8, 0.1, 6.8]} m={M.rusty} />
        <Box p={[0, 0.7, 0]} s={[1.2, 0.12, 5.6]} m={M.steel} />
        {[-2.4, 2.4].map((z) => <Box key={z} p={[0, 0.35, z]} s={[1.0, 0.7, 0.2]} m={M.darkWood} />)}
        <mesh position={[0, 1.15, 1.6]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#8a6a48")} castShadow>
          <cylinderGeometry args={[0.4, 0.42, 3.6, 12]} />
        </mesh>
        <mesh position={[0.55, 1.05, -0.4]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0.65, 0.65, 0.03, 24]} />
          <meshStandardMaterial color="#cfd6da" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      {/* Chimney on the back. */}
      <Cyl p={[-S.w / 2 + 1.4, H + 2.4, -S.d / 2 + 1.2]} rt={0.3} rb={0.35} h={4.8} seg={10} m="#5a5450" />
      {/* Stacked sawn planks + sawdust heap. */}
      {[0, 1, 2, 3].map((r) => <Box key={r} p={[-1.5, 0.12 + r * 0.14, S.d / 2 + 3.2]} s={[3.6, 0.1, 1.2]} m={M.wood} tile={1} />)}
      <mesh position={[3.6, 0, S.d / 2 + 2.4]} material={flatMat("#d6b47a", { roughness: 1 })} castShadow>
        <coneGeometry args={[1.3, 0.9, 12]} />
      </mesh>
    </group>
  );
}
function WaterWheel({ M }) {
  const [wx, wz] = FARM_SAWMILL.wheel;
  const y = Y(FARM_SAWMILL.x, FARM_SAWMILL.z);
  const wheel = useRef();
  useFrame((_, dt) => { if (wheel.current) wheel.current.rotation.x -= dt * 0.7; });
  const R = 2.5;
  return (
    <group position={[wx, y + 1.2, wz]} rotation={[0, Math.atan2(FARM_SAWMILL.z - wz, FARM_SAWMILL.x - wx) - Math.PI / 2, 0]}>
      <group ref={wheel}>
        {[-0.45, 0.45].map((o) => (
          <mesh key={o} position={[o, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={M.darkWood} castShadow>
            <torusGeometry args={[R, 0.09, 6, 28]} />
          </mesh>
        ))}
        {Array.from({ length: 12 }).map((_, k) => {
          const a = (k / 12) * Math.PI * 2;
          return (
            <group key={k} rotation={[a, 0, 0]}>
              <Box p={[0, R - 0.05, 0]} s={[1.0, 0.08, 0.5]} m={M.wood} />
              <Box p={[0, R / 2, 0]} s={[0.07, R, 0.07]} m={M.darkWood} cast={false} />
            </group>
          );
        })}
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.steel}><cylinderGeometry args={[0.18, 0.18, 1.4, 10]} /></mesh>
      </group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[1.6, 0, 0]} material={M.darkWood}><cylinderGeometry args={[0.12, 0.12, 2.4, 8]} /></mesh>
    </group>
  );
}

/** A painted sign board on two posts (or wall-mounted when posts={false}). */
export function SignBoard({ p, lines, w = 3, h = 1, r = [0, 0, 0], posts = false, bg = "#7a4f2c", fg = "#fff4dc" }) {
  const tex = useMemo(() => signTexture(lines, { w: 512, h: Math.round((512 * h) / w), bg, fg, font: `bold ${Math.round(70 * Math.min(1, (h / w) * 3.4))}px Georgia, serif`, sub: `bold ${Math.round(40 * Math.min(1, (h / w) * 3.4))}px Georgia, serif` }), [lines, w, h, bg, fg]);
  return (
    <group position={p} rotation={r}>
      <Box s={[w + 0.12, h + 0.12, 0.08]} m="#4f321b" />
      {tex && [0.045, -0.045].map((o, k) => (
        <mesh key={k} position={[0, 0, o]} rotation={[0, k ? Math.PI : 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      ))}
      {posts && [-1, 1].map((s) => <Box key={s} p={[s * (w / 2 - 0.2), -h / 2 - 0.6, -0.08]} s={[0.12, 1.4 + h, 0.12]} m="#5a3e28" />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE MILKING SHED — white block walls, a green iron roof, the herringbone
// bails' rails, the stainless milk vat, the yard rails.
// ---------------------------------------------------------------------------
function MilkingShed({ M }) {
  const S = FARM_MILKING_SHED;
  const y = Y(S.x, S.z);
  const H = 3.2;
  return (
    <group position={[S.x, y, S.z]}>
      <Box p={[0, 0.06, 0]} s={[S.w + 1, 0.14, S.d + 1]} m={M.concrete} />
      <Box p={[0, H / 2, -S.d / 2 + 0.15]} s={[S.w, H, 0.3]} m="#eeeae0" />
      {[-1, 1].map((s) => <Box key={s} p={[s * (S.w / 2 - 0.15), H / 2, 0]} s={[0.3, H, S.d]} m="#eeeae0" />)}
      {/* The open front: posts + the bails' pipe rails. */}
      {[-S.w / 2 + 3, -S.w / 6, S.w / 6, S.w / 2 - 3].map((x) => <Box key={x} p={[x, H / 2, S.d / 2 - 0.2]} s={[0.25, H, 0.25]} m="#eeeae0" />)}
      {[0.9, 1.4].map((h) => <Rod key={h} a={[-S.w / 2 + 0.5, h, 0.6]} b={[S.w / 2 - 0.5, h, 0.6]} r={0.045} m={M.steel} cast={false} />)}
      <group position={[0, H, 0]}>
        <GableRoof w={S.w} d={S.d} rise={1.6} oh={0.7} roof={M.greenIron} wall="#eeeae0" tile={2.4} />
      </group>
      <SignBoard p={[0, H + 0.85, S.d / 2 + 0.75]} lines={["THE DAIRY"]} w={3.2} h={0.8} bg="#2f5f3e" />
      {/* The milk vat + a hose reel by the west wall. */}
      <group position={[-S.w / 2 - 1.8, 0, 1.2]}>
        <Cyl p={[0, 1.15, 0]} r={[0, 0, Math.PI / 2]} rt={0.85} rb={0.85} h={2.6} seg={18} m={flatMat("#dfe5e8", { metalness: 0.85, roughness: 0.2 })} />
        {[-0.9, 0.9].map((o) => <Box key={o} p={[o, 0.3, 0]} s={[0.12, 0.6, 1.2]} m={M.steel} />)}
      </group>
      {/* Milk cans by the door. */}
      {[0, 1, 2].map((k) => (
        <group key={k} position={[S.w / 2 + 0.8 + k * 0.55, 0, S.d / 2 - 0.2 + (k % 2) * 0.3]}>
          <Cyl p={[0, 0.32, 0]} rt={0.2} rb={0.22} h={0.64} seg={12} m={flatMat("#cfd6da", { metalness: 0.8, roughness: 0.25 })} />
          <Cyl p={[0, 0.72, 0]} rt={0.11} rb={0.2} h={0.16} seg={12} m={flatMat("#cfd6da", { metalness: 0.8, roughness: 0.25 })} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// GRAIN SILOS + the WEIGHBRIDGE — three tall corrugated silos with conical
// tops, ladder cages, a catwalk, an auger; a truck scale + its little office.
// ---------------------------------------------------------------------------
function GrainSilos({ M }) {
  const silos = FARM_GRAIN_SILOS;
  return (
    <group>
      {silos.map(([x, z, r, h], i) => {
        const y = Y(x, z);
        let lo = y;
        for (let a = 0; a < 8; a++) lo = Math.min(lo, Y(x + Math.cos(a) * (r + 0.6), z + Math.sin(a) * (r + 0.6)));
        const base = y - lo + 0.4;
        return (
          <group key={i} position={[x, lo, z]}>
            <Cyl p={[0, base / 2, 0]} rt={r + 0.5} rb={r + 0.7} h={base} seg={24} m={M.concrete} />
            <Cyl p={[0, base + h / 2, 0]} rt={r} rb={r} h={h} seg={28} m={M.tank} uvTile={1.6} />
            {[0.25, 0.5, 0.75].map((f) => (
              <mesh key={f} position={[0, base + h * f, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <torusGeometry args={[r + 0.02, 0.05, 4, 32]} />
              </mesh>
            ))}
            <mesh position={[0, base + h + 1.0, 0]} material={M.tank} castShadow>
              <coneGeometry args={[r + 0.15, 2.0, 28]} />
            </mesh>
            <Cyl p={[0, base + h + 2.15, 0]} rt={0.4} rb={0.55} h={0.4} seg={12} m={M.steel} />
            <group position={[0, base, r + 0.15]}>
              <Ladder p={[0, 0, 0]} h={h + 0.6} w={0.5} m="#8a9296" />
              {Array.from({ length: Math.floor(h / 1.2) }).map((_, k) => k > 1 && (
                <mesh key={k} position={[0, 0.4 + k * 1.2, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                  <torusGeometry args={[0.42, 0.025, 4, 12, Math.PI]} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
      {/* A catwalk between the two front silos + the auger up to them. */}
      {(() => {
        const [a, b] = silos;
        const ya = Y(a[0], a[1]) + a[3] + 0.6, yb = Y(b[0], b[1]) + b[3] + 0.6;
        return (
          <group>
            <Rod a={[a[0] + a[2], ya, a[1]]} b={[b[0] - b[2], yb, b[1]]} r={0.06} m={M.steel} />
            <Rod a={[a[0] + a[2], ya + 0.9, a[1]]} b={[b[0] - b[2], yb + 0.9, b[1]]} r={0.04} m={M.steel} cast={false} />
            <Rod a={[a[0] + 3.4, Y(a[0] + 9, a[1] + 6) + 0.6, a[1] + 7]} b={[a[0] + 1.2, ya + 0.3, a[1] + 1.5]} r={0.22} m="#c9b23a" />
          </group>
        );
      })()}
      {/* The weighbridge (a steel deck set in concrete) + its office. */}
      {(() => {
        const x = 74, z = -36, y = Y(x, z);
        return (
          <group position={[x, y, z]}>
            <Box p={[0, 0.06, 0]} s={[3.6, 0.14, 9.4]} m={flatMat("#6f7478", { metalness: 0.5, roughness: 0.6 })} />
            {[-1, 1].map((s) => <Box key={s} p={[s * 1.85, 0.12, 0]} s={[0.12, 0.2, 9.4]} m="#e8c330" />)}
          </group>
        );
      })()}
      {(() => {
        const x = 78.8, z = -42.5, y = Y(x, z);
        return (
          <group position={[x, y, z]}>
            <Box p={[0, 1.3, 0]} s={[3.2, 2.6, 2.6]} m={M.cream} tile={2} />
            <group position={[0, 2.6, 0]}><GableRoof w={3.2} d={2.6} rise={0.7} oh={0.3} roof={M.redIron} wall={M.cream} /></group>
            <Window p={[-1.62, 1.5, 0]} r={[0, -Math.PI / 2, 0]} w={1.2} h={0.8} />
            <Box p={[0.6, 1.0, 1.32]} s={[0.8, 2.0, 0.06]} m="#3f6b4a" />
            <SignBoard p={[0, 3.6, 1.0]} lines={["WEIGHBRIDGE"]} w={2.4} h={0.5} bg="#2e4a6b" />
          </group>
        );
      })()}
    </group>
  );
}

// ---------------------------------------------------------------------------
// GLASSHOUSES — timber-framed glass houses with tomato rows inside.
// ---------------------------------------------------------------------------
function Glasshouses({ M }) {
  return (
    <group>
      {FARM_GLASSHOUSES.map((g, i) => {
        const y = Y(g.x, g.z);
        const H = 2.4;
        const frames = [];
        for (let x = -g.w / 2; x <= g.w / 2 + 0.01; x += g.w / 5) frames.push(x);
        return (
          <group key={i} position={[g.x, y, g.z]}>
            <Box p={[0, 0.2, 0]} s={[g.w + 0.2, 0.4, g.d + 0.2]} m="#a65a3e" tile={0.8} />
            {/* Glass walls + roof. */}
            <Box p={[0, 0.4 + H / 2, 0]} s={[g.w, H, g.d]} m={M.glass} cast={false} />
            <group position={[0, 0.4 + H, 0]}><GableRoof w={g.w} d={g.d} rise={1.4} oh={0.05} roof={M.glass} wall={M.glass} thick={0.04} /></group>
            {/* The white frame. */}
            {frames.map((x) => [-1, 1].map((s) => <Box key={`${x}${s}`} p={[x, 0.4 + H / 2, (s * g.d) / 2]} s={[0.07, H, 0.07]} m="#f4f2ec" cast={false} />))}
            {[-1, 1].map((s) => <Box key={s} p={[0, 0.4 + H, (s * g.d) / 2]} s={[g.w, 0.08, 0.08]} m="#f4f2ec" cast={false} />)}
            <Box p={[0, 0.4 + H + 1.42, 0]} s={[g.w + 0.1, 0.08, 0.1]} m="#f4f2ec" cast={false} />
            {/* Tomato rows inside (green with red dots). */}
            {[-1.6, 0, 1.6].map((z) => (
              <group key={z}>
                <Box p={[0, 0.65, z]} s={[g.w - 1.0, 0.5, 0.6]} m="#6a4a2e" tile={1} />
                {Array.from({ length: Math.floor(g.w - 1.5) }).map((_, k) => (
                  <mesh key={k} position={[-g.w / 2 + 1.2 + k, 1.4, z]} material={flatMat("#4f8a32", { roughness: 0.8 })}>
                    <icosahedronGeometry args={[0.38, 0]} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SHEARING SHED — raised timber shed on the Downs' crest, rusty roof,
// a ramp for the sheep, wool bales stacked at the door.
// ---------------------------------------------------------------------------
function ShearingShed({ M }) {
  const S = FARM_SHEARING_SHED;
  const y = Y(S.x, S.z);
  const H = 3.4, F = 0.9;
  return (
    <group position={[S.x, y, S.z]} rotation={[0, S.rotationY, 0]}>
      {[-1, 0, 1].map((ix) => [-1, 1].map((iz) => <Box key={`${ix}${iz}`} p={[ix * (S.w / 2 - 0.4), F / 2, iz * (S.d / 2 - 0.4)]} s={[0.25, F, 0.25]} m={M.darkWood} />))}
      <Box p={[0, F + H / 2, 0]} s={[S.w, H, S.d]} m={M.grey} tile={2.2} />
      <group position={[0, F + H, 0]}>
        <GableRoof w={S.w} d={S.d} rise={2.2} oh={0.6} roof={M.rusty} wall={M.grey} tile={2.2} />
        <RoofTrim w={S.w} d={S.d} rise={2.2} oh={0.6} color="#5f4a36" />
      </group>
      {/* The sheep ramp down to the yards (west). */}
      <Box p={[-S.w / 2 - 1.6, F / 2, -1.5]} r={[0, 0, 0.28]} s={[3.4, 0.1, 1.4]} m={M.wood} />
      {[-1, 1].map((s) => <Box key={s} p={[-S.w / 2 - 1.6, F / 2 + 0.55, -1.5 + s * 0.72]} r={[0, 0, 0.28]} s={[3.4, 0.6, 0.06]} m={M.wood} />)}
      <Box p={[-S.w / 2 + 0.03, F + 1.0, -1.5]} s={[0.08, 2.0, 1.4]} m={M.darkWood} />
      {/* Big door + wool bales on the south side. */}
      <Box p={[1.5, F + 1.3, S.d / 2 + 0.04]} s={[2.6, 2.6, 0.1]} m={M.boards} tile={1.4} />
      {[0, 1, 2].map((k) => (
        <Box key={k} p={[3.6 + (k % 2) * 0.1, 0.55 + (k === 2 ? 1.1 : 0), S.d / 2 + 1.2 + (k === 1 ? 1.15 : 0)]} s={[1.1, 1.1, 1.1]} m="#efe9da" />
      ))}
      <SignBoard p={[0, F + H + 0.9, S.d / 2 + 0.7]} lines={["SHEARING SHED"]} w={3.2} h={0.7} />
    </group>
  );
}

/** Water troughs (paddocks) — round concrete troughs with a float valve. */
function Troughs({ M }) {
  const spots = useMemo(() => {
    const out = [];
    for (const p of FARM_PADDOCKS) {
      if (p.id === "chook-run" || p.id === "veggie-garden") continue;
      const x = p.x + p.w / 2 - 2.2, z = p.z - p.d / 2 + 2.2;
      out.push([x, z]);
    }
    out.push([118, -10], [110, -60], [104, 18]); // on the downs
    return out;
  }, []);
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, Y(x, z), z]}>
          <Cyl p={[0, 0.3, 0]} rt={0.95} rb={0.85} h={0.6} seg={16} m={M.concrete} />
          <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.85, 16]} />
            <meshStandardMaterial color="#5a8a96" roughness={0.1} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Beyond this (camera → the area's edge) an area draws as one far-LOD mesh. */
const FAR = 125;

export default function FarmBuildings() {
  const M = useMats();
  return (
    <group>
      <StaticBatch farDist={FAR}>
        <Barn M={M} />
        <Farmhouse M={M} />
        <FeedSilo M={M} />
        <ChookCoop M={M} />
        <Tank M={M} />
        <Tractor position={FARM_TRACTOR.position} rotationY={FARM_TRACTOR.rotationY} />
        <Ute M={M} />
      </StaticBatch>
      <WaterWindmill M={M} />
      <StaticBatch farDist={FAR}>
        <PackingShed M={M} />
      </StaticBatch>
      <StaticBatch farDist={FAR}>
        <Sawmill M={M} />
      </StaticBatch>
      <WaterWheel M={M} />
      <StaticBatch farDist={FAR}>
        <MilkingShed M={M} />
      </StaticBatch>
      <StaticBatch farDist={FAR}>
        <GrainSilos M={M} />
      </StaticBatch>
      <StaticBatch farDist={FAR}>
        <Glasshouses M={M} />
      </StaticBatch>
      <StaticBatch farDist={FAR}>
        <ShearingShed M={M} />
        <Tractor position={FARM_HAY_TRACTOR.position} rotationY={FARM_HAY_TRACTOR.rotationY} color="#2f7a3a" />
      </StaticBatch>
      <StaticBatch farDist={FAR}>
        <Troughs M={M} />
      </StaticBatch>
      {/* (The milk tanker + the trophy stand live in FarmScenery: GLB models.) */}
    </group>
  );
}
