import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  SNOW_LODGE, SNOW_CABINS, SNOW_IGLOOS, SNOW_SIGNPOSTS, SNOW_LAMPS, CANDY_CANES, RANGE_AREA, SLALOM_FLAGS,
} from "../../data/snow/snowLayout.js";
import {
  terrainHeight, SNOW_BRIDGES, ensureSnowStructures, LIFT, liftSeatAt, SNOW_CHUTE_PATHS, chuteFrame, LAKE_LEVEL,
} from "../../data/snow/snowTerrain.js";
import { FORT_WALLS, LIFT_TOWERS, LIFT_SIDE, LIFT_RETURN_OFFSET } from "../../data/snow/snowProps.js";
import { getSnowTextures } from "./snowMaterials.js";
import { flatMat, signTexture } from "../farm/farmMaterials.js";
import { Box, Cyl, GableRoof, RoofTrim, extrudeGeometry } from "../farm/farmKit.jsx";
import { finish, merge, vnoise3 } from "../jungle/jungleGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { playerState } from "../sessionStore.js";

/**
 * SNOW BUILDINGS — the alpine SKI LODGE (two log storeys, a steep snowy roof
 * with its gable to the square, a glowing gable window, a balcony and its
 * AJAR door into the Lodge Interior), the log CABINS with warm windows and
 * smoking chimneys, the igloos, FORT FROST's snow-block walls, the CHAIRLIFT
 * (stations, towers, cables and gondolas going round), the toboggan chutes'
 * start gates + slalom flags, the snowy plank BRIDGES, signposts, lamps and
 * candy canes. Static parts are merged by StaticBatch (with a far LOD).
 */
const Y = (x, z) => terrainHeight(x, z);
const FAR = 130;
const WOOD = "#6e4c30", WOOD_DARK = "#4a3322", SNOWC = "#f4f8fd", STONE = "#8b919c";
const GLOW = "#ffd27a";

let _m = null;
function mats() {
  if (_m) return _m;
  const t = getSnowTextures();
  _m = {
    logs: flatMat("#ffffff", { map: t.logs, roughness: 0.9 }),
    roof: flatMat("#ffffff", { map: t.roof, roughness: 0.95 }),
    planks: flatMat("#ffffff", { map: t.planks, roughness: 0.9 }),
    blocks: flatMat("#ffffff", { map: t.blocks, roughness: 0.9 }),
    snow: flatMat(SNOWC, { roughness: 0.95 }),
    stone: flatMat(STONE, { roughness: 0.95, flat: true }),
    wood: flatMat(WOOD), woodDark: flatMat(WOOD_DARK),
    glow: new THREE.MeshStandardMaterial({ color: "#ffe2a6", emissive: GLOW, emissiveIntensity: 1.35, roughness: 0.5 }),
    dark: flatMat("#141a26"),
    steel: flatMat("#7f8893", { roughness: 0.4, metalness: 0.6 }),
    red: flatMat("#c0392b"), blue: flatMat("#2f6fb5"),
  };
  return _m;
}

/** A glowing window: frame + warm glass + cross bars + a snowy sill. */
function GlowWindow({ p, w = 1.1, h = 1.2, r = [0, 0, 0] }) {
  const M = mats();
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, 0.03]} s={[w + 0.2, h + 0.2, 0.08]} m={M.woodDark} cast={false} />
      <mesh position={[0, 0, 0.075]} material={M.glow}><planeGeometry args={[w, h]} /></mesh>
      <Box p={[0, 0, 0.09]} s={[0.07, h, 0.04]} m={M.woodDark} cast={false} />
      <Box p={[0, 0, 0.09]} s={[w, 0.07, 0.04]} m={M.woodDark} cast={false} />
      <Box p={[0, -h / 2 - 0.12, 0.12]} s={[w + 0.36, 0.1, 0.24]} m={M.woodDark} cast={false} />
      <Box p={[0, -h / 2 - 0.04, 0.13]} s={[w + 0.3, 0.08, 0.22]} m={M.snow} cast={false} />
    </group>
  );
}

/** Icicles along an eave: n cones from a → b at height y (local). */
function icicleGeometry(a, b, y, n, seed = 1) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const L = 0.25 + vnoise3(i * 1.7 + seed, seed, 0.5) * 0.7;
    const g = new THREE.ConeGeometry(0.06 + L * 0.05, L, 5);
    g.rotateX(Math.PI);
    g.translate(a[0] + (b[0] - a[0]) * t, y - L / 2, a[1] + (b[1] - a[1]) * t);
    parts.push(finish(g, (x, yy) => new THREE.Color("#cfefff").lerp(new THREE.Color("#ffffff"), Math.min(1, (yy - y + L) / L)), 0));
  }
  return merge(parts);
}
const icicleMat = () => makeFoliageMaterial({ sway: 0, key: "snow-icicle", roughness: 0.15, emissive: "#14303d" });

// ---------------------------------------------------------------------------
// THE SKI LODGE
// ---------------------------------------------------------------------------
const LODGE_H = 6.1; // eaves
const LODGE_RISE = 4.8;
export const LODGE_CHIMNEY = [SNOW_LODGE.w / 2 - 1.7, -1.6];

function LodgeShell() {
  const M = mats();
  const { w, d } = SNOW_LODGE;
  const sign = useMemo(() => signTexture("ALPINE LODGE", { w: 512, h: 112, font: "bold 58px Georgia, serif", bg: "#6b3f22" }), []);
  const tri = useMemo(() => extrudeGeometry([[-3.4, 0.35], [3.4, 0.35], [0, 3.7]], 0.12, "lodge-gable-glass"), []);
  return (
    <group>
      {/* Stone plinth (runs a metre down into the ground). */}
      <Box p={[0, -0.25, 0]} s={[w + 0.5, 1.9, d + 0.5]} m={M.stone} tile={1.6} />
      {/* Two storeys of round logs. */}
      <Box p={[0, 0.7 + (LODGE_H - 0.7) / 2, 0]} s={[w, LODGE_H - 0.7, d]} m={M.logs} tile={3.2} />
      {/* Corner log ends. */}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <Cyl key={`${sx}${sz}`} p={[sx * (w / 2), 0.7 + (LODGE_H - 0.7) / 2, sz * (d / 2)]} rt={0.32} rb={0.32} h={LODGE_H - 0.7} seg={8} m={M.wood} />
      )))}
      {/* The steep snowy roof, gable to the south (the square). */}
      <group position={[0, LODGE_H, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof w={d} d={w} rise={LODGE_RISE} oh={1.15} roof={M.roof} wall={M.logs} tile={3} thick={0.34} />
        <RoofTrim w={d} d={w} rise={LODGE_RISE} oh={1.15} color={WOOD_DARK} thick={0.34} />
      </group>
      {/* The glowing gable window + its mullions. */}
      <mesh geometry={tri} position={[0, LODGE_H, d / 2 + 0.02]} material={M.glow} />
      {[-1.7, 0, 1.7].map((x) => <Box key={x} p={[x, LODGE_H + 1.6 - Math.abs(x) * 0.45, d / 2 + 0.12]} s={[0.12, 3 - Math.abs(x) * 0.9, 0.08]} m={M.woodDark} cast={false} />)}
      <Box p={[0, LODGE_H + 0.4, d / 2 + 0.12]} s={[6.9, 0.14, 0.1]} m={M.woodDark} cast={false} />
      {/* Ground-floor + upper windows, front and sides. */}
      {[-4.4, 4.4].map((x) => <GlowWindow key={x} p={[x, 1.9, d / 2]} w={1.5} h={1.4} />)}
      {[-3.6, 3.6].map((x) => <GlowWindow key={`u${x}`} p={[x, 4.75, d / 2]} w={1.2} h={1.1} />)}
      {[-1, 1].map((s) => [-3, 0, 3].map((z) => (
        <GlowWindow key={`${s}${z}`} p={[s * (w / 2 + 0.01), 2.0, z]} r={[0, (s * Math.PI) / 2, 0]} w={1.2} h={1.3} />
      )))}
      {[-1, 1].map((s) => [-2, 2].map((z) => (
        <GlowWindow key={`u${s}${z}`} p={[s * (w / 2 + 0.01), 4.7, z]} r={[0, (s * Math.PI) / 2, 0]} w={1.0} h={1.0} />
      )))}
      {/* The balcony across the front. */}
      <Box p={[0, 3.35, d / 2 + 0.95]} s={[w - 1.6, 0.2, 1.9]} m={M.planks} tile={2} />
      <Box p={[0, 3.47, d / 2 + 0.95]} s={[w - 1.7, 0.06, 1.8]} m={M.snow} cast={false} />
      {Array.from({ length: 13 }, (_, i) => -5.8 + i * (11.6 / 12)).map((x) => (
        <Box key={x} p={[x, 3.9, d / 2 + 1.82]} s={[0.1, 0.9, 0.1]} m={M.wood} cast={false} />
      ))}
      <Box p={[0, 4.38, d / 2 + 1.82]} s={[w - 1.5, 0.14, 0.16]} m={M.woodDark} />
      <Box p={[0, 4.48, d / 2 + 1.82]} s={[w - 1.5, 0.08, 0.2]} m={M.snow} cast={false} />
      {[-5.8, 5.8].map((x) => (
        <Box key={x} p={[x, 1.7, d / 2 + 1.75]} r={[0, 0, 0]} s={[0.24, 3.3, 0.24]} m={M.woodDark} />
      ))}
      {/* Door canopy, the sign, lanterns. */}
      <Box p={[0, 2.75, d / 2 + 0.3]} s={[2.6, 0.5, 0.18]} m={M.woodDark} cast={false} />
      {sign && (
        <mesh position={[0, 2.75, d / 2 + 0.4]}>
          <planeGeometry args={[2.4, 0.46]} />
          <meshStandardMaterial map={sign} roughness={0.85} />
        </mesh>
      )}
      {[-1.35, 1.35].map((x) => (
        <group key={x} position={[x, 2.05, d / 2 + 0.22]}>
          <Box p={[0, 0, 0]} s={[0.24, 0.34, 0.24]} m={M.glow} cast={false} />
          <Box p={[0, 0.22, 0]} s={[0.32, 0.08, 0.32]} m={M.woodDark} cast={false} />
        </group>
      ))}
      {/* The stone chimney (up through the east slope). */}
      <Box p={[LODGE_CHIMNEY[0], 7.6, LODGE_CHIMNEY[1]]} s={[1.3, 8, 1.3]} m={M.stone} tile={1.4} />
      <Box p={[LODGE_CHIMNEY[0], 11.7, LODGE_CHIMNEY[1]]} s={[1.55, 0.22, 1.55]} m={M.snow} />
      {/* Skis + poles leaning by the door, firewood stack on the west side. */}
      {[[-2.2, "#d0342c"], [-2.55, "#2f6fb5"]].map(([x, c], i) => (
        <group key={i} position={[x, 0.95, d / 2 + 0.28]} rotation={[-0.12, 0, 0.05 * (i ? 1 : -1)]}>
          <Box p={[0, 0, 0]} s={[0.1, 1.9, 0.04]} m={c} cast={false} />
          <Box p={[0.12, 0, 0]} s={[0.1, 1.9, 0.04]} m={c} cast={false} />
        </group>
      ))}
      <group position={[-w / 2 - 0.65, 0, 2.2]}>
        {[0, 1, 2, 3].map((row) => Array.from({ length: 6 - (row % 2) }, (_, i) => (
          <Cyl key={`${row}-${i}`} p={[0, 0.2 + row * 0.34, -1.1 + i * 0.4 + (row % 2) * 0.2]} r={[0, 0, Math.PI / 2]} rt={0.16} rb={0.16} h={1.0} seg={7} m={M.wood} cast={false} />
        )))}
        <Box p={[0, 1.6, 0]} s={[1.3, 0.12, 2.8]} m={M.snow} cast={false} />
      </group>
    </group>
  );
}

/** The lodge's AJAR front door — swings wide as the player nears (CB). */
function LodgeDoor({ faceZ }) {
  const doorRef = useRef();
  useFrame(() => {
    if (!doorRef.current) return;
    const near = Math.hypot(playerState.x - SNOW_LODGE.x, playerState.z - (SNOW_LODGE.z + faceZ)) < 4.5;
    const target = near ? -1.8 : -0.35; // ajar → wide open (inward)
    doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.08;
  });
  return (
    <group position={[0, 0.7, faceZ]}>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.95, 1.15, 0.04]}>
          <boxGeometry args={[0.2, 2.3, 0.2]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 0.0]}>
        <boxGeometry args={[1.6, 2.2, 0.04]} />
        <meshStandardMaterial color="#1c1108" />
      </mesh>
      <mesh position={[0, 1.05, 0.03]}>
        <boxGeometry args={[1.3, 2.0, 0.02]} />
        <meshStandardMaterial color="#ffb36b" emissive="#ff9a3c" emissiveIntensity={0.9} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 1.4, 0.9]} color="#ffb36b" intensity={0.8} distance={7} decay={2} />
      <group position={[-0.85, 0, 0.1]}>
        <group ref={doorRef} rotation={[0, -0.35, 0]}>
          <mesh castShadow position={[0.8, 1.1, 0]}>
            <boxGeometry args={[1.6, 2.2, 0.1]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
          {[0.35, 0.8, 1.25].map((px) => (
            <mesh key={px} position={[px, 1.1, 0.06]}>
              <boxGeometry args={[0.04, 2.1, 0.03]} />
              <meshStandardMaterial color="#3a2a18" />
            </mesh>
          ))}
          <mesh position={[1.42, 1.1, 0.08]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function LodgeIcicles() {
  const { w, d } = SNOW_LODGE;
  const geo = useMemo(() => {
    const ey = LODGE_H - 1.15 * (LODGE_RISE / (w / 2)) + 0.05;
    return merge([
      icicleGeometry([-(w / 2 + 1.1), -(d / 2 + 1.0)], [-(w / 2 + 1.1), d / 2 + 1.0], ey, 26, 3),
      icicleGeometry([w / 2 + 1.1, -(d / 2 + 1.0)], [w / 2 + 1.1, d / 2 + 1.0], ey, 26, 7),
      icicleGeometry([-6.4, d / 2 + 1.9], [6.4, d / 2 + 1.9], 3.25, 22, 11),
    ]);
  }, [w, d]);
  return <mesh geometry={geo} material={icicleMat()} />;
}

export function Lodge() {
  const y = Y(SNOW_LODGE.x, SNOW_LODGE.z);
  return (
    <group position={[SNOW_LODGE.x, y, SNOW_LODGE.z]}>
      <StaticBatch farDist={FAR}>
        <LodgeShell />
      </StaticBatch>
      <LodgeIcicles />
      <LodgeDoor faceZ={SNOW_LODGE.d / 2} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// LOG CABINS — warm windows, snowy roofs, chimneys, porches.
// ---------------------------------------------------------------------------
const CABIN_H = 3.0;
/** A cabin chimney's top above its floor (1 m in from the west eave). */
const chimneyTop = (w) => CABIN_H + (w * 0.42) * (2 / w) + 1.5;
function cabinFloor(x, z, rot, w, d) {
  let lo = Infinity, hi = -Infinity;
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, 0]]) {
    const h = Y(x + lx * c + lz * s, z - lx * s + lz * c);
    lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  // On a slope the cabin is dug in on the uphill side (snow banked against
  // its logs) instead of standing on a tall plinth downhill.
  return { lo, hi, fy: lo + (hi - lo) * 0.4 + 0.3 };
}
/** Chimney top of cabin i in world space (for the smoke). */
export function cabinChimneys() {
  return SNOW_CABINS.map(([x, z, rot, w, d]) => {
    const { fy } = cabinFloor(x, z, rot, w, d);
    const lx = -(w / 2 - 1.0), lz = -d / 4;
    const c = Math.cos(rot), s = Math.sin(rot);
    return [x + lx * c + lz * s, fy + chimneyTop(w) + 0.15, z - lx * s + lz * c];
  });
}
function Cabin({ x, z, rot, w, d, i }) {
  const M = mats();
  const { lo, fy } = cabinFloor(x, z, rot, w, d);
  const rise = w * 0.42;
  const chx = -(w / 2 - 1.0), chz = -d / 4;
  return (
    <group position={[x, fy, z]} rotation={[0, rot, 0]}>
      <Box p={[0, (lo - fy) / 2 - 0.05, 0]} s={[w + 0.3, fy - lo + 0.5, d + 0.3]} m={M.stone} tile={1.6} />
      <Box p={[0, CABIN_H / 2, 0]} s={[w, CABIN_H, d]} m={M.logs} tile={3.2} />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => (
        <Cyl key={`${sx}${sz}`} p={[sx * (w / 2), CABIN_H / 2, sz * (d / 2)]} rt={0.26} rb={0.26} h={CABIN_H + 0.2} seg={7} m={M.wood} />
      )))}
      <group position={[0, CABIN_H, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof w={d} d={w} rise={rise} oh={0.75} roof={M.roof} wall={M.logs} tile={3} thick={0.3} />
        <RoofTrim w={d} d={w} rise={rise} oh={0.75} color={WOOD_DARK} thick={0.3} />
      </group>
      {/* Door, porch light, front windows, a round gable window. */}
      <Box p={[0, 1.0, d / 2 + 0.03]} s={[1.05, 2.0, 0.08]} m={M.woodDark} />
      <Box p={[0, 2.12, d / 2 + 0.08]} s={[1.4, 0.14, 0.14]} m={M.wood} cast={false} />
      <Box p={[0.75, 1.75, d / 2 + 0.16]} s={[0.2, 0.28, 0.2]} m={M.glow} cast={false} />
      {[-1, 1].map((s) => <GlowWindow key={s} p={[s * (w / 2 - 1.25), 1.55, d / 2]} w={0.95} h={0.95} />)}
      <mesh position={[0, CABIN_H + rise * 0.42, d / 2 + 0.05]} material={M.glow}><circleGeometry args={[0.38, 14]} /></mesh>
      <mesh position={[0, CABIN_H + rise * 0.42, d / 2 + 0.03]} material={M.woodDark}><circleGeometry args={[0.5, 14]} /></mesh>
      {[-1, 1].map((s) => <GlowWindow key={`s${s}`} p={[s * (w / 2 + 0.01), 1.55, 0.4]} r={[0, (s * Math.PI) / 2, 0]} w={0.9} h={0.9} />)}
      {/* Porch step + snow piles. */}
      <Box p={[0, -0.05, d / 2 + 0.6]} s={[1.8, 0.3, 1.0]} m={M.planks} tile={1.5} />
      {/* Chimney through the roof. */}
      <Box p={[chx, (chimneyTop(w) + 1.0) / 2, chz]} s={[0.8, chimneyTop(w) - 1.0, 0.8]} m={M.stone} tile={1.2} />
      <Box p={[chx, chimneyTop(w) + 0.05, chz]} s={[0.98, 0.16, 0.98]} m={M.snow} />
      {/* A snowman friend or sled leaning by the door on alternate cabins. */}
      {i % 2 === 0 ? (
        <group position={[w / 2 - 0.4, 0.55, d / 2 + 0.35]} rotation={[0.25, 0, 0.1]}>
          <Box p={[0, 0, 0]} s={[0.55, 1.2, 0.08]} m={M.red} cast={false} />
          <Box p={[0, -0.62, 0.12]} s={[0.55, 0.06, 0.3]} m={M.steel} cast={false} />
        </group>
      ) : (
        <group position={[-w / 2 - 0.5, 0, 1.2]}>
          {[0, 1, 2].map((row) => Array.from({ length: 4 - (row % 2) }, (_, k) => (
            <Cyl key={`${row}-${k}`} p={[0, 0.17 + row * 0.3, -0.6 + k * 0.38 + (row % 2) * 0.19]} r={[0, 0, Math.PI / 2]} rt={0.14} rb={0.14} h={0.8} seg={7} m={M.wood} cast={false} />
          )))}
          <Box p={[0, 1.02, 0]} s={[0.9, 0.1, 1.6]} m={M.snow} cast={false} />
        </group>
      )}
    </group>
  );
}
function CabinIcicles() {
  const geo = useMemo(() => {
    const parts = [];
    SNOW_CABINS.forEach(([x, z, rot, w, d], i) => {
      const { fy } = cabinFloor(x, z, rot, w, d);
      const rise = w * 0.42;
      const ey = fy + CABIN_H - 0.75 * (rise / (w / 2)) + 0.05;
      for (const s of [-1, 1]) {
        const g = icicleGeometry([s * (w / 2 + 0.75), -(d / 2 + 0.75)], [s * (w / 2 + 0.75), d / 2 + 0.75], 0, 12, i * 5 + s);
        g.translate(0, ey, 0);
        g.rotateY(rot);
        g.translate(x, 0, z);
        parts.push(g);
      }
    });
    return merge(parts);
  }, []);
  return <mesh geometry={geo} material={icicleMat()} />;
}
export function Cabins() {
  return (
    <group>
      <StaticBatch farDist={FAR}>
        {SNOW_CABINS.map(([x, z, rot, w, d], i) => <Cabin key={i} i={i} x={x} z={z} rot={rot} w={w} d={d} />)}
      </StaticBatch>
      <CabinIcicles />
    </group>
  );
}

// ---------------------------------------------------------------------------
// IGLOOS
// ---------------------------------------------------------------------------
const iglooGeos = (() => {
  let g = null;
  return () => {
    if (g) return g;
    const dome = new THREE.SphereGeometry(2.0, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const uv = dome.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 1.75);
    const tunnel = new THREE.CylinderGeometry(0.9, 0.9, 1.5, 14, 1, true, -Math.PI / 2, Math.PI);
    tunnel.rotateX(-Math.PI / 2);
    tunnel.translate(0, 0, 2.05);
    const tuv = tunnel.attributes.uv;
    for (let i = 0; i < tuv.count; i++) tuv.setXY(i, tuv.getX(i) * 1.0, tuv.getY(i) * 0.9);
    const door = new THREE.CircleGeometry(0.72, 14, 0, Math.PI);
    door.translate(0, 0, 2.6);
    g = { dome, tunnel, door };
    return g;
  };
})();
function Igloo({ x, z, rot }) {
  const M = mats();
  const G = iglooGeos();
  return (
    <group position={[x, Y(x, z) - 0.05, z]} rotation={[0, rot, 0]}>
      <mesh geometry={G.dome} material={M.blocks} castShadow receiveShadow />
      <mesh geometry={G.tunnel} material={flatMat("#ffffff", { map: getSnowTextures().blocks, side: THREE.DoubleSide })} castShadow />
      <mesh geometry={G.door} material={M.dark} position={[0, 0, 0.0]} />
      <Box p={[0, 0.05, 0]} s={[4.2, 0.1, 4.2]} m={M.snow} cast={false} />
    </group>
  );
}
export function Igloos() {
  return (
    <StaticBatch farDist={FAR}>
      {SNOW_IGLOOS.map(([x, z, rot], i) => <Igloo key={i} x={x} z={z} rot={rot} />)}
    </StaticBatch>
  );
}

// ---------------------------------------------------------------------------
// FORT FROST — snow-block walls with crenellations, snowball piles, pennants.
// ---------------------------------------------------------------------------
function FortWall({ a, b }) {
  const M = mats();
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  const n = Math.max(2, Math.round(L / 1.6));
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const y = Y(x, z);
        return (
          <group key={i} position={[x, y, z]} rotation={[0, yaw, 0]}>
            <Box p={[0, 0.45, 0]} s={[L / n + 0.05, 1.5, 1.0]} m={M.blocks} tile={1.6} />
            {i % 2 === 0 && <Box p={[0, 1.45, 0]} s={[L / n * 0.6, 0.5, 0.9]} m={M.blocks} tile={1.6} />}
          </group>
        );
      })}
    </group>
  );
}
function snowballPile(cx, cy, cz, seed) {
  const parts = [];
  const layers = [[0, 6, 0.55], [0.42, 3, 0.32], [0.78, 1, 0]];
  layers.forEach(([y, n, r], li) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + li * 0.5 + seed;
      const g = new THREE.SphereGeometry(0.26, 9, 7);
      g.translate(cx + Math.cos(a) * r, cy + 0.24 + y, cz + Math.sin(a) * r);
      parts.push(finish(g, new THREE.Color("#f7fbff"), 0));
    }
  });
  return parts;
}
function FortExtras() {
  const geo = useMemo(() => {
    const parts = [];
    const spots = [[11, 4.5], [10.5, 0.5], [-10.8, -6.5], [10.6, -6.6], [-6, -7.2], [6.5, -7.4]];
    spots.forEach(([dx, dz], i) => {
      const x = RANGE_AREA.x + dx, z = RANGE_AREA.z + dz;
      parts.push(...snowballPile(x, Y(x, z), z, i));
    });
    return merge(parts);
  }, []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-balls", roughness: 0.9 }), []);
  const flags = [[-13, -9, "#d0342c"], [13, -9, "#2f6fb5"], [-13, -0.5, "#2f6fb5"], [13, 6, "#d0342c"]];
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      {flags.map(([dx, dz, c], i) => {
        const x = RANGE_AREA.x + dx, z = RANGE_AREA.z + dz;
        return <Pennant key={i} x={x} y={Y(x, z) + 1.3} z={z} color={c} h={3.2} phase={i} />;
      })}
    </group>
  );
}
/** A flagpole with a fluttering triangular pennant. */
function Pennant({ x, y, z, color, h = 3, phase = 0 }) {
  const flag = useRef();
  useFrame((state) => {
    if (flag.current) flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.2 + phase) * 0.35 + 0.2;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, h, 6]} />
        <meshStandardMaterial color="#6f7782" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={flag} position={[0, h - 0.35, 0]}>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.3, 1.0, 3]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
export function FortFrost() {
  return (
    <group>
      <StaticBatch farDist={FAR}>
        {FORT_WALLS.map((w, i) => <FortWall key={i} a={w.a} b={w.b} />)}
      </StaticBatch>
      <FortExtras />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE CHAIRLIFT — two stations, four towers, the up + return cables and the
// gondolas going round (the rider gets their own, drawn by Player.jsx).
// ---------------------------------------------------------------------------
const CABLE_UP = 3.42; // the cable above a rider's feet (Player.jsx RideProps)
const sideOff = (k) => [LIFT_SIDE[0] * k, LIFT_SIDE[1] * k];
function liftLineY(t, k = 0) {
  // The return line follows the same profile, kept clear of its own ground.
  const s = liftSeatAt(t);
  if (!k) return s.y;
  const [ox, oz] = sideOff(k);
  return Math.max(s.y, Y(s.x + ox, s.z + oz) + 3.0);
}
function gondolaGeometry() {
  const parts = [];
  const box = (w, h, d, x, y, z, col) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    parts.push(finish(g, new THREE.Color(col), 0));
  };
  box(1.5, 0.12, 1.5, 0, -0.08, 0, "#2f6fb5");
  box(1.5, 0.95, 0.06, 0, 0.55, 0.72, "#2f6fb5");
  box(1.5, 0.95, 0.06, 0, 0.55, -0.72, "#2f6fb5");
  box(0.06, 0.95, 1.5, 0.72, 0.55, 0, "#e9eef3");
  box(0.06, 0.95, 1.5, -0.72, 0.55, 0, "#e9eef3");
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) box(0.07, 2.5, 0.07, x, 1.25, z, "#9aa3ad");
  box(1.62, 0.12, 1.62, 0, 2.55, 0, "#c0392b");
  box(1.7, 0.1, 1.7, 0, 2.65, 0, "#f4f8fd");
  box(0.1, 0.85, 0.1, 0, 3.0, 0, "#9aa3ad");
  box(0.5, 0.2, 0.3, 0, 3.4, 0, "#5d6570");
  return merge(parts);
}
function LiftGondolas() {
  const N = 7;
  const ref = useRef();
  const geo = useMemo(gondolaGeometry, []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-gondola", roughness: 0.55 }), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const yawUp = Math.atan2(LIFT.dir[0], LIFT.dir[1]);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const time = state.clock.elapsedTime;
    const speed = (LIFT.speed / LIFT.len) * 0.9;
    // The player's own position along the line (to keep a gap round them).
    const pt = ((playerState.x - LIFT.from[0]) * LIFT.dir[0] + (playerState.z - LIFT.from[1]) * LIFT.dir[1]) / LIFT.len;
    const riding = Boolean(playerState.onLift);
    let i = 0;
    for (let line = 0; line < 2; line++) {
      for (let k = 0; k < N; k++) {
        const u = (time * speed + k / N + line * 0.5 / N) % 1;
        const t = line === 0 ? u : 1 - u;
        const s = liftSeatAt(t);
        const off = line === 0 ? 0 : LIFT_RETURN_OFFSET;
        const [ox, oz] = sideOff(off);
        const y = liftLineY(t, off);
        const hide = (line === 0 && riding && Math.abs(t - pt) < 0.09) || t < 0.035 || t > 0.965;
        tmp.position.set(s.x + ox, y, s.z + oz);
        tmp.rotation.set(Math.sin(time * 1.3 + k) * 0.03, line === 0 ? yawUp : yawUp + Math.PI, 0);
        tmp.scale.setScalar(hide ? 0.0001 : 1);
        tmp.updateMatrix();
        m.setMatrixAt(i++, tmp.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N * 2]} frustumCulled={false} castShadow />;
}
function cableGeometry(off) {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const s = liftSeatAt(t);
    const [ox, oz] = sideOff(off);
    pts.push(new THREE.Vector3(s.x + ox, liftLineY(t, off) + CABLE_UP, s.z + oz));
  }
  // Round the bull wheels at both ends (a loop between the two cables).
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.045, 5, false);
}
function LiftStation({ at, t, label }) {
  const M = mats();
  const [x, z] = at;
  const y = Y(x, z);
  const yaw = Math.atan2(LIFT.dir[0], LIFT.dir[1]);
  const cableY = liftLineY(t) + CABLE_UP - y;
  const sign = useMemo(() => signTexture(label, { w: 512, h: 112, font: "bold 52px Georgia, serif", bg: "#2f5f9a", border: "#1d3b63" }), [label]);
  const half = LIFT_RETURN_OFFSET / 2;
  // In the station's frame: +z = up the lift, +x = toward the return cable.
  const sx = LIFT_SIDE[0] * Math.cos(yaw) - LIFT_SIDE[1] * Math.sin(yaw) > 0 ? 1 : -1;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {/* The boarding mat + loading deck. */}
      <Box p={[0, 0.06, 0]} s={[2.6, 0.12, 2.6]} m={M.blue} cast={false} />
      <Box p={[0, 0.13, 0]} s={[2.2, 0.03, 2.2]} m={flatMat("#ffd166")} cast={false} />
      {/* Four steel legs + a snowy roof over the bull wheel. */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <Box key={i} p={[sx * half + a * (half + 1.6), (cableY + 1.4) / 2, b * 2.6]} s={[0.22, cableY + 1.4, 0.22]} m={M.steel} />
      ))}
      <Box p={[sx * half, cableY + 1.5, 0]} s={[LIFT_RETURN_OFFSET + 4.2, 0.3, 6.2]} m={M.red} />
      <Box p={[sx * half, cableY + 1.72, 0]} s={[LIFT_RETURN_OFFSET + 4.4, 0.18, 6.4]} m={M.snow} />
      {/* The bull wheel the cable wraps round. */}
      <Cyl p={[sx * half, cableY, 0]} rt={half + 0.05} rb={half + 0.05} h={0.28} seg={24} m={M.steel} />
      <Cyl p={[sx * half, cableY + 0.6, 0]} rt={0.35} rb={0.35} h={1.0} seg={10} m={flatMat("#4a525c")} />
      {sign && (
        <group position={[sx * half, cableY + 0.95, -3.25]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <planeGeometry args={[3.0, 0.66]} />
            <meshStandardMaterial map={sign} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
function LiftTower({ tw }) {
  const M = mats();
  const y = Y(tw.x, tw.z);
  const top = Math.max(liftLineY(tw.t), liftLineY(tw.t, LIFT_RETURN_OFFSET)) + CABLE_UP + 0.25;
  const yaw = Math.atan2(LIFT.dir[0], LIFT.dir[1]);
  const h = top - y;
  return (
    <group position={[tw.x, y, tw.z]} rotation={[0, yaw, 0]}>
      <Cyl p={[0, h / 2, 0]} rt={0.22} rb={0.32} h={h} seg={8} m={M.steel} />
      <Box p={[0, h + 0.05, 0]} s={[LIFT_RETURN_OFFSET + 1.2, 0.26, 0.4]} m={flatMat("#5d6570")} />
      <Box p={[0, h + 0.22, 0]} s={[LIFT_RETURN_OFFSET + 1.3, 0.1, 0.45]} m={M.snow} cast={false} />
      <Box p={[0, 0.3, 0]} s={[1.4, 0.6, 1.4]} m={M.stone} />
    </group>
  );
}
export function Chairlift() {
  const cables = useMemo(() => [cableGeometry(0), cableGeometry(LIFT_RETURN_OFFSET)], []);
  return (
    <group>
      <StaticBatch farDist={FAR}>
        <LiftStation at={LIFT.from} t={0} label="⬆ CHAIRLIFT" />
        <LiftStation at={LIFT.to} t={1} label="BIG SLED HILL" />
        {LIFT_TOWERS.map((tw, i) => <LiftTower key={i} tw={tw} />)}
      </StaticBatch>
      {cables.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#2f343b" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <LiftGondolas />
    </group>
  );
}

// ---------------------------------------------------------------------------
// TOBOGGAN CHUTES — the start gate (banner), a sled rack, slalom flags.
// ---------------------------------------------------------------------------
const CHUTE_NAMES = { "big-run": "BIG SLED RUN", "tumble-run": "TUMBLE RUN" };
function ChuteGate({ c }) {
  const M = mats();
  const f = chuteFrame(c, 1.2);
  const yaw = Math.atan2(f.tx, f.tz);
  const off = c.hw + 0.9;
  const sign = useMemo(() => signTexture(CHUTE_NAMES[c.id] || "SLED RUN", { w: 512, h: 112, font: "bold 54px Georgia, serif", bg: "#c0392b", border: "#7a1f16" }), [c.id]);
  const hl = Y(f.x - f.tz * off, f.z + f.tx * off), hr = Y(f.x + f.tz * off, f.z - f.tx * off);
  const top = Math.max(hl, hr) + 3.6;
  return (
    <group>
      {[[-1, hl], [1, hr]].map(([s, h]) => (
        <group key={s} position={[f.x - f.tz * off * s, h, f.z + f.tx * off * s]}>
          <Cyl p={[0, (top - h) / 2, 0]} rt={0.16} rb={0.2} h={top - h} seg={8} m={M.woodDark} />
          <Box p={[0, top - h + 0.1, 0]} s={[0.5, 0.18, 0.5]} m={M.snow} />
        </group>
      ))}
      <group position={[f.x, top - 0.35, f.z]} rotation={[0, yaw, 0]}>
        <Box p={[0, 0, 0]} s={[off * 2 + 0.4, 0.22, 0.24]} m={M.woodDark} />
        <Box p={[0, 0.16, 0]} s={[off * 2 + 0.5, 0.1, 0.3]} m={M.snow} cast={false} />
        {sign && [1, -1].map((s) => (
          <mesh key={s} position={[0, -0.55, s * 0.08]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[off * 1.6, 0.6]} />
            <meshStandardMaterial map={sign} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
function SledRack({ c }) {
  const M = mats();
  const f = chuteFrame(c, 0);
  const off = c.hw + 3.4;
  const x = f.x + f.tz * off, z = f.z - f.tx * off;
  const y = Y(x, z);
  const yaw = Math.atan2(f.tx, f.tz);
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <Box p={[0, 1.0, -0.35]} s={[2.6, 0.12, 0.12]} m={M.woodDark} />
      {[-1.25, 1.25].map((dx) => <Box key={dx} p={[dx, 0.55, -0.35]} s={[0.14, 1.1, 0.14]} m={M.woodDark} />)}
      {[-0.8, 0, 0.8].map((dx, i) => (
        <group key={dx} position={[dx, 0.62, 0]} rotation={[-0.35, 0, 0]}>
          <Box p={[0, 0, 0]} s={[0.62, 1.2, 0.08]} m={[M.red, M.blue, flatMat("#2e8b57")][i]} cast={false} />
          <Box p={[0, -0.6, 0.1]} s={[0.62, 0.05, 0.22]} m={M.steel} cast={false} />
        </group>
      ))}
    </group>
  );
}
function slalomGeometry() {
  const parts = [];
  for (const c of SNOW_CHUTE_PATHS) {
    if (c.id !== "big-run") continue;
    let side = 1;
    for (let s = 10; s < c.len - 12; s += 9) {
      const f = chuteFrame(c, s);
      const off = c.hw + 1.1;
      const x = f.x - f.tz * off * side, z = f.z + f.tx * off * side;
      const y = Y(x, z);
      const pole = new THREE.CylinderGeometry(0.035, 0.04, 1.7, 5);
      pole.translate(x, y + 0.85, z);
      parts.push(finish(pole, new THREE.Color("#e9eef3"), 0));
      const flag = new THREE.BoxGeometry(0.62, 0.48, 0.02);
      flag.rotateY(Math.atan2(f.tx, f.tz));
      flag.translate(x - f.tz * side * 0.32, y + 1.4, z + f.tx * side * 0.32);
      parts.push(finish(flag, new THREE.Color(side > 0 ? "#d0342c" : "#2f6fb5"), 0.5));
      side = -side;
    }
  }
  return merge(parts);
}
export function ChuteDressing() {
  const geo = useMemo(() => (SLALOM_FLAGS ? slalomGeometry() : null), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 1.2, key: "snow-slalom", side: THREE.DoubleSide }), []);
  return (
    <group>
      <StaticBatch farDist={FAR}>
        {SNOW_CHUTE_PATHS.map((c) => <ChuteGate key={c.id} c={c} />)}
        {SNOW_CHUTE_PATHS.map((c) => <SledRack key={`r${c.id}`} c={c} />)}
      </StaticBatch>
      {geo && <mesh geometry={geo} material={mat} castShadow />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// BRIDGES — snowy plank decks, rope rails on posts, piles into the lake.
// ---------------------------------------------------------------------------
function bridgeGeometry(b) {
  const parts = [];
  const C = (h) => new THREE.Color(h);
  const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
  const L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const yaw = Math.atan2(-uz, ux);
  const n = Math.ceil(L / 0.34);
  const hw = b.halfWidth + 0.1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const g = new THREE.BoxGeometry(0.3, 0.09, hw * 2 * (0.94 + 0.06 * vnoise3(i, 3, 1)));
    const t2 = Math.min(1, t + 0.01), t1 = Math.max(0, t - 0.01);
    g.rotateZ(Math.atan2(b.deckAt(t2) - b.deckAt(t1), (t2 - t1) * L));
    g.rotateY(yaw);
    g.translate(b.from[0] + dx * t, b.deckAt(t) - 0.045, b.from[1] + dz * t);
    const shade = 0.82 + ((i * 37) % 10) / 40;
    parts.push(finish(g, (x, y, z, nnx, ny) => {
      if (ny > 0.8 && vnoise3(x * 1.3, z * 1.3, i * 0.1) > 0.58) return C("#f2f6fc");
      return C("#8a6a46").multiplyScalar(shade);
    }, 0));
  }
  const water = b.id.startsWith("bridge");
  for (const s of [-1, 1]) {
    const off = hw + 0.15;
    const posts = Math.max(3, Math.round(L / 1.8));
    let prev = null;
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const px = b.from[0] + dx * t + nx * off * s, pz = b.from[1] + dz * t + nz * off * s;
      const y0 = b.deckAt(t);
      const post = new THREE.CylinderGeometry(0.09, 0.1, 1.25, 6);
      post.translate(px, y0 + 0.5, pz);
      parts.push(finish(post, C("#5a4030"), 0));
      const cap = new THREE.SphereGeometry(0.13, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      cap.scale(1, 0.7, 1);
      cap.translate(px, y0 + 1.12, pz);
      parts.push(finish(cap, C("#f4f8fd"), 0));
      // Piles down into the lake / river bed.
      const gy = water ? Math.min(terrainHeight(px, pz), LAKE_LEVEL - 1.6) : terrainHeight(px, pz);
      if (y0 - gy > 0.3) {
        const pile = new THREE.CylinderGeometry(0.11, 0.13, y0 - gy + 0.2, 6);
        pile.translate(px, (y0 + gy) / 2 - 0.1, pz);
        parts.push(finish(pile, C("#4a3626"), 0));
      }
      const top = [px, y0 + 1.0, pz];
      if (prev) {
        // A sagging rope between the post tops (two strands).
        for (const drop of [0, 0.42]) {
          const segs = 6;
          for (let k = 0; k < segs; k++) {
            const u0 = k / segs, u1 = (k + 1) / segs;
            const sag = (u) => 0.16 * Math.sin(Math.PI * u);
            const A = new THREE.Vector3(prev[0] + (top[0] - prev[0]) * u0, prev[1] + (top[1] - prev[1]) * u0 - sag(u0) - drop, prev[2] + (top[2] - prev[2]) * u0);
            const B = new THREE.Vector3(prev[0] + (top[0] - prev[0]) * u1, prev[1] + (top[1] - prev[1]) * u1 - sag(u1) - drop, prev[2] + (top[2] - prev[2]) * u1);
            const len = A.distanceTo(B);
            const r = new THREE.CylinderGeometry(0.035, 0.035, len, 4);
            r.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
            r.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            parts.push(finish(r, C("#c9b48a"), 0));
          }
        }
      }
      prev = top;
    }
  }
  return merge(parts);
}
export function SnowBridges() {
  ensureSnowStructures();
  const geos = useMemo(() => SNOW_BRIDGES.map(bridgeGeometry), []);
  const mat = useMemo(() => makeFoliageMaterial({ sway: 0, key: "snow-bridge", roughness: 0.9 }), []);
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} material={mat} castShadow receiveShadow />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNPOSTS, LAMPS, CANDY CANES.
// ---------------------------------------------------------------------------
function Signpost({ s }) {
  const M = mats();
  const [x, z] = s.p;
  const y = Y(x, z);
  const arrows = useMemo(() => s.arrows.map(([label, to]) => ({
    yaw: Math.atan2(-(to[1] - z), to[0] - x),
    tex: signTexture(label, { w: 512, h: 112, font: "bold 50px Georgia, serif", bg: "#7a4f2c" }),
  })), [s, x, z]);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 1.45, 0]} rt={0.09} rb={0.12} h={2.9} seg={7} m={M.woodDark} />
      <mesh position={[0, 2.98, 0]} material={M.snow}><sphereGeometry args={[0.16, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      {arrows.map((a, i) => (
        <group key={i} position={[0, 2.5 - i * 0.48, 0]} rotation={[0, a.yaw, 0]}>
          <Box p={[0.95, 0, 0]} s={[1.9, 0.38, 0.07]} m="#7a4f2c" />
          <Box p={[0.95, 0.21, 0]} s={[1.92, 0.06, 0.1]} m={M.snow} cast={false} />
          <mesh position={[1.98, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={flatMat("#7a4f2c")}><coneGeometry args={[0.24, 0.3, 3]} /></mesh>
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
function LampPost({ x, z }) {
  const M = mats();
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 1.5, 0]} rt={0.06} rb={0.1} h={3} seg={8} m="#2e3442" />
      <Cyl p={[0, 0.15, 0]} rt={0.16} rb={0.2} h={0.3} seg={8} m="#2e3442" />
      <Box p={[0, 3.2, 0]} s={[0.36, 0.44, 0.36]} m={M.glow} cast={false} />
      <mesh position={[0, 3.55, 0]} material={flatMat("#2e3442")}><coneGeometry args={[0.34, 0.3, 4]} /></mesh>
      <mesh position={[0, 3.66, 0]} material={M.snow}><coneGeometry args={[0.26, 0.16, 4]} /></mesh>
    </group>
  );
}
function CandyCane({ x, z }) {
  const y = Y(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 1.05, 0]} rt={0.09} rb={0.09} h={2.1} seg={10} m="#f6f6f2" />
      {[0.2, 0.6, 1.0, 1.4, 1.8].map((yy) => <Cyl key={yy} p={[0, yy, 0]} rt={0.096} rb={0.096} h={0.16} seg={10} m="#d64545" cast={false} />)}
      <mesh position={[0.22, 2.1, 0]} rotation={[0, 0, Math.PI]} material={flatMat("#d64545")}>
        <torusGeometry args={[0.22, 0.09, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
}
export function SnowStreetFurniture() {
  return (
    <StaticBatch farDist={FAR}>
      {SNOW_SIGNPOSTS.map((s) => <Signpost key={s.id} s={s} />)}
      {SNOW_LAMPS.map(([x, z], i) => <LampPost key={i} x={x} z={z} />)}
      {CANDY_CANES.map(([x, z], i) => <CandyCane key={i} x={x} z={z} />)}
    </StaticBatch>
  );
}
