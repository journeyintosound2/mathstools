import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  PYRAMID, SUNSTONE, OBELISKS, SUN_TEMPLE, SKY_PYRAMID, HIERO_WALL, MESA_STAIR, MINE_RAILS, MINE_MOUTH, SUN_ARCH,
  SUNDIAL_RISE,
} from "../../data/desert/desertLayout.js";
import {
  PYR_BASE, PYRAMID_TIERS, PYRAMID_STAIR, TEMPLE_PORTICO, TEMPLE_STEPS, SUNDIAL, getLateStructures, getLadders,
  terrainHeight, desertPadLevel, SUNSTONE_TOP,
} from "../../data/desert/desertTerrain.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { desertMat, getDesertTextures, makeStrataMaterial } from "./desertMaterials.js";
import { Box, Cyl, Beam, Flight, tiledBox } from "./desertKit.jsx";

/**
 * DESERT LANDMARKS — the Great Pyramid (six brick tiers, the grand stair with
 * its balustrades, a dark doorway, the golden SUNSTONE glowing on the summit
 * under a turning sun-disc), the obelisks, the Sun Temple (columned portico,
 * the carved facade + sun emblem, sphinxes, braziers), the SKY PYRAMID
 * floating upside-down over the avenue, the oasis's grand stairs + hieroglyph
 * wall, the Red Mesa's monumental stair, the ladders, the rope bridge, the
 * mine-cart rails + the mine mouth, the natural Sun Arch and Sundial Rise.
 * Static stone is merged (StaticBatch); flames, the Sunstone, the Sky
 * Pyramid + the dial's shadow-caster stay separate.
 */
const GOLD = "#e8b23a";

function useMats() {
  return useMemo(() => {
    const t = getDesertTextures();
    return {
      brick: desertMat("#ffffff", { map: t.bricks }),
      pale: desertMat("#ffffff", { map: t.bricksPale }),
      red: desertMat("#ffffff", { map: t.bricksRed }),
      plaster: desertMat("#f6e6c8", { map: t.plaster }),
      glyph: desertMat("#ffffff", { map: t.glyphs, rough: 0.95 }),
      wood: desertMat("#ffffff", { map: t.planks }),
      woodDark: desertMat("#5e3e22"),
      gold: desertMat(GOLD, { metal: 0.7, rough: 0.3, emissive: "#8a5a10", ei: 0.25 }),
      dark: desertMat("#2a1a10", { rough: 1 }),
      iron: desertMat("#4a4440", { metal: 0.6, rough: 0.5 }),
      rope: desertMat("#b89664"),
      strata: makeStrataMaterial({ tint: "#ffffff", key: "landmark" }),
      blue: desertMat("#2f6fb0", { rough: 0.6 }),
    };
  }, []);
}

// ---------------------------------------------------------------------------
// THE GREAT PYRAMID
// ---------------------------------------------------------------------------
function Pyramid({ M }) {
  const [cx, cz] = PYRAMID.c;
  const S = PYRAMID_STAIR;
  return (
    <group>
      {PYRAMID_TIERS.map((t) => {
        const y0 = PYR_BASE + PYRAMID.rise * t.k - (t.k === 0 ? 1.2 : 0);
        const h = t.top - y0;
        return (
          <group key={t.k}>
            <Box p={[cx, y0 + h / 2, cz]} s={[t.half * 2, h, t.half * 2]} m={M.brick} tile={1.8} />
            {/* A paler capping course round each terrace. */}
            <Box p={[cx, t.top - 0.12, cz]} s={[t.half * 2 + 0.16, 0.26, t.half * 2 + 0.16]} m={M.pale} tile={1.2} />
          </group>
        );
      })}
      {/* The grand stair + its balustrades. */}
      <Flight f={S} stepMat={M.pale} wallMat={M.brick} wallH={0.7} wallT={0.55} />
      {/* A dark doorway on the east face, under a stone lintel. */}
      <group position={[cx + PYRAMID.half + 0.02, PYR_BASE, cz + 4]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 1.6, 0.05]} s={[2.6, 3.2, 0.12]} m={M.dark} cast={false} />
        <Box p={[0, 3.5, 0.25]} s={[3.6, 0.6, 0.5]} m={M.pale} />
        <Box p={[-1.55, 1.6, 0.2]} s={[0.5, 3.2, 0.4]} m={M.pale} />
        <Box p={[1.55, 1.6, 0.2]} s={[0.5, 3.2, 0.4]} m={M.pale} />
      </group>
      {/* The Sunstone's pedestal on the summit. */}
      <Box p={[SUNSTONE.position[0], SUNSTONE_TOP + SUNSTONE.pedestal / 2, SUNSTONE.position[1]]} s={[SUNSTONE.base * 1.5, SUNSTONE.pedestal, SUNSTONE.base * 1.5]} m={M.pale} tile={1} />
      {/* Four golden lamps on the summit's corners. */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <group key={i} position={[cx + sx * (PYRAMID.topHalf - 0.8), SUNSTONE_TOP, cz + sz * (PYRAMID.topHalf - 0.8)]}>
          <Box p={[0, 0.5, 0]} s={[0.6, 1, 0.6]} m={M.pale} />
          <mesh position={[0, 1.15, 0]} material={M.gold} castShadow><sphereGeometry args={[0.28, 12, 8]} /></mesh>
        </group>
      ))}
    </group>
  );
}
/** The golden capstone: glowing, a sun disc turning above it, sparkles. */
function Sunstone() {
  const disc = useRef();
  const glow = useRef();
  const stone = useRef();
  const tex = getDesertTextures().glow;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (disc.current) { disc.current.rotation.y = t * 0.6; disc.current.position.y = SUNSTONE.height + 1.9 + Math.sin(t * 1.4) * 0.18; }
    if (glow.current) glow.current.material.opacity = 0.55 + 0.2 * Math.sin(t * 2.2);
    if (stone.current) stone.current.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 2.2);
  });
  const y = SUNSTONE_TOP + SUNSTONE.pedestal;
  return (
    <group position={[SUNSTONE.position[0], y, SUNSTONE.position[1]]}>
      <mesh ref={stone} position={[0, SUNSTONE.height / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[SUNSTONE.base * 0.82, SUNSTONE.height, 4]} />
        <meshStandardMaterial color="#ffd257" emissive="#ffae1a" emissiveIntensity={0.6} metalness={0.75} roughness={0.25} flatShading />
      </mesh>
      <group ref={disc}>
        <mesh>
          <torusGeometry args={[0.85, 0.12, 8, 28]} />
          <meshStandardMaterial color="#fff0a8" emissive="#ffc23a" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]} position={[Math.cos((i / 12) * Math.PI * 2) * 1.25, Math.sin((i / 12) * Math.PI * 2) * 1.25, 0]}>
            <boxGeometry args={[0.42, 0.09, 0.06]} />
            <meshBasicMaterial color="#ffe27a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <sprite ref={glow} position={[0, SUNSTONE.height * 0.7, 0]} scale={[7, 7, 1]}>
        <spriteMaterial map={tex} color="#ffd68a" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}
function Obelisks({ M }) {
  return (
    <group>
      {OBELISKS.map(([x, z], i) => {
        const y = terrainHeight(x, z);
        const H = i < 4 ? 9.5 : 7.5;
        return (
          <group key={i} position={[x, y, z]}>
            <Box p={[0, 0.45, 0]} s={[1.9, 0.9, 1.9]} m={M.pale} />
            <mesh position={[0, 0.9 + H / 2, 0]} rotation={[0, Math.PI / 4, 0]} material={M.brick} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.72, H, 4]} />
            </mesh>
            <mesh position={[0, 0.9 + H + 0.42, 0]} rotation={[0, Math.PI / 4, 0]} material={M.gold} castShadow>
              <coneGeometry args={[0.44, 0.85, 4]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SUN TEMPLE
// ---------------------------------------------------------------------------
function SunTemple({ M }) {
  const T = SUN_TEMPLE;
  const L = desertPadLevel("temple");
  const top = L + T.h;
  const cols = [-11, -6.6, -2.2, 2.2, 6.6, 11];
  const zc = T.zFront - 1.4;
  const colH = 7.2;
  return (
    <group>
      {/* The portico platform + its steps. */}
      <Box p={[TEMPLE_PORTICO.c[0], L + T.h / 2 - 0.6, TEMPLE_PORTICO.c[1]]} s={[TEMPLE_PORTICO.hx * 2, T.h + 1.2, TEMPLE_PORTICO.hz * 2]} m={M.pale} tile={1.4} />
      <Flight f={TEMPLE_STEPS} stepMat={M.pale} wallMat={M.brick} walls="none" />
      {/* The columns (lotus capitals) + the beam across them. */}
      {cols.map((x) => (
        <group key={x} position={[x, top, zc]}>
          <Cyl p={[0, 0.2, 0]} rt={0.9} rb={0.95} h={0.4} m={M.pale} />
          <Cyl p={[0, colH / 2, 0]} rt={0.58} rb={0.68} h={colH} m={M.pale} seg={14} />
          <Cyl p={[0, colH + 0.45, 0]} rt={1.0} rb={0.6} h={0.9} m={M.brick} seg={12} />
          {[1.6, 3.6, 5.6].map((y) => <Cyl key={y} p={[0, y, 0]} rt={0.7} rb={0.7} h={0.14} m="#3f7fc4" seg={14} />)}
        </group>
      ))}
      <Box p={[0, top + colH + 1.45, zc]} s={[25.5, 1.2, 2.4]} m={M.brick} tile={1.6} />
      <Box p={[0, top + colH + 2.25, zc - 0.2]} s={[26.5, 0.4, 2.8]} m={M.pale} tile={1.2} />
      {/* The facade carved into the cliff: a wall, the glyph frieze, the doorway, the sun emblem. */}
      <Box p={[0, top + 6.5, T.zBack - 0.4]} s={[30, 13, 1.2]} m={M.pale} tile={1.6} />
      <mesh position={[-8.6, top + 5.4, T.zBack + 0.22]} material={M.glyph}><planeGeometry args={[8, 6]} /></mesh>
      <mesh position={[8.6, top + 5.4, T.zBack + 0.22]} material={M.glyph}><planeGeometry args={[8, 6]} /></mesh>
      <Box p={[0, top + 3.2, T.zBack + 0.05]} s={[4.4, 6.4, 0.3]} m={M.dark} cast={false} />
      <Box p={[0, top + 6.7, T.zBack + 0.3]} s={[6, 0.8, 0.7]} m={M.brick} />
      <Box p={[-2.6, top + 3.2, T.zBack + 0.3]} s={[0.8, 6.4, 0.7]} m={M.brick} />
      <Box p={[2.6, top + 3.2, T.zBack + 0.3]} s={[0.8, 6.4, 0.7]} m={M.brick} />
      <group position={[0, top + 10.4, T.zBack + 0.35]}>
        <mesh material={M.gold}><circleGeometry args={[1.6, 32]} /></mesh>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.25, Math.sin(a) * 2.25, -0.02]} rotation={[0, 0, a]} material={M.gold}>
              <planeGeometry args={[1.0, 0.24]} />
            </mesh>
          );
        })}
      </group>
      {/* Two sphinxes guard the forecourt. */}
      {T.sphinxes.map(([x, z], i) => <Sphinx key={i} x={x} z={z} M={M} />)}
    </group>
  );
}
function Sphinx({ x, z, M }) {
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
      <Box p={[0, 0.5, 0]} s={[2.2, 1, 5]} m={M.pale} tile={1.2} />
      {/* The lion body + paws. */}
      <Box p={[0, 1.55, 0.6]} s={[1.6, 1.1, 3.4]} m={M.pale} />
      <Box p={[-0.5, 1.2, -1.55]} s={[0.45, 0.4, 1.4]} m={M.pale} />
      <Box p={[0.5, 1.2, -1.55]} s={[0.45, 0.4, 1.4]} m={M.pale} />
      {/* The head + its striped headdress. */}
      <Box p={[0, 2.75, -0.7]} s={[1.1, 1.3, 1.1]} m={M.pale} />
      <Box p={[0, 3.45, -0.6]} s={[1.5, 0.45, 1.3]} m="#3f7fc4" />
      <Box p={[-0.68, 2.6, -0.5]} s={[0.25, 1.3, 1.0]} m={M.gold} />
      <Box p={[0.68, 2.6, -0.5]} s={[0.25, 1.3, 1.0]} m={M.gold} />
      <Box p={[0, 2.55, -1.3]} s={[0.25, 0.4, 0.2]} m={M.brick} />
    </group>
  );
}
/** Braziers with live flames either side of the temple steps. */
function Braziers() {
  const flames = useRef([]);
  const L = desertPadLevel("temple");
  const spots = [[-8, -107.5], [8, -107.5]];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const k = 1 + 0.15 * Math.sin(t * 9 + i * 2) + 0.08 * Math.sin(t * 17 + i);
      f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
    });
  });
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, L, z]}>
          <Cyl p={[0, 0.6, 0]} rt={0.18} rb={0.3} h={1.2} m="#5a3a1c" seg={8} />
          <Cyl p={[0, 1.35, 0]} rt={0.6} rb={0.3} h={0.4} m={desertMat(GOLD, { metal: 0.6, rough: 0.35 })} seg={12} />
          <mesh ref={(el) => (flames.current[i] = el)} position={[0, 1.95, 0]}>
            <coneGeometry args={[0.38, 1.2, 10]} />
            <meshBasicMaterial color="#ffb13b" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 2.4, 0]} color="#ffb04a" intensity={6} distance={9} decay={2} />
        </group>
      ))}
    </group>
  );
}
/** The SKY PYRAMID — an upside-down pyramid turning slowly high over the avenue. */
function SkyPyramid() {
  const g = useRef();
  const rocks = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2, r: 9 + (i % 3) * 2.2, y: -7 - (i % 2) * 3, s: 0.8 + (i % 3) * 0.5 })), []);
  const mat = useMemo(() => makeStrataMaterial({ tint: "#fff3dc", key: "sky" }), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (g.current) { g.current.rotation.y = t * 0.05; g.current.position.y = SKY_PYRAMID.position[1] + Math.sin(t * 0.4) * 1.2; }
  });
  const S = SKY_PYRAMID.size;
  return (
    <group ref={g} position={SKY_PYRAMID.position}>
      <mesh rotation={[Math.PI, Math.PI / 4, 0]} material={mat}>
        <coneGeometry args={[S * 0.75, S, 4]} />
      </mesh>
      {/* A garden of palms on its flat top (seen from afar as a green crown). */}
      <mesh position={[0, S / 2 + 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[S * 0.72, S * 0.74, 0.4, 4]} />
        <meshStandardMaterial color="#7ea84a" />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={[Math.cos(r.a) * r.r, r.y, Math.sin(r.a) * r.r]} scale={r.s} material={mat}>
          <dodecahedronGeometry args={[1.4, 0]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE OASIS — grand stairs + the hieroglyph wall
// ---------------------------------------------------------------------------
function Oasis({ M }) {
  const late = getLateStructures();
  const flights = late.flights.filter((f) => f.id.startsWith("oasis"));
  const H = HIERO_WALL;
  const fl = desertPadLevel("oasis");
  return (
    <group>
      {flights.map((f) => <Flight key={f.id} f={f} stepMat={M.pale} wallMat={M.brick} wallH={0.8} deep={2} />)}
      <group position={[H.position[0], fl, H.position[1]]} rotation={[0, H.rotationY, 0]}>
        <Box p={[0, H.height / 2, -0.6]} s={[H.width + 1.4, H.height + 0.8, 1.4]} m={M.brick} tile={1.6} />
        <mesh position={[0, H.height / 2 + 0.2, 0.12]} material={M.glyph}><planeGeometry args={[H.width, H.height - 0.6]} /></mesh>
        <Box p={[0, H.height + 0.55, -0.4]} s={[H.width + 2, 0.5, 1.9]} m={M.pale} />
        {/* Two lion-head spouts above the pool. */}
        {[-3.6, 3.6].map((x) => (
          <group key={x} position={[x, 2.4, 0.35]}>
            <Box p={[0, 0, 0]} s={[1, 1, 0.5]} m={M.gold} />
            <Box p={[0, -0.2, 0.4]} s={[0.25, 0.2, 0.6]} m={M.pale} />
          </group>
        ))}
      </group>
    </group>
  );
}
/** Water arcing from the hieroglyph wall's spouts into the pool. */
function Spouts() {
  const H = HIERO_WALL;
  const fl = desertPadLevel("oasis");
  const refs = useRef([]);
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(0, -t * t * 2.3, t * 2.4)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.09, 6, false);
  }, []);
  useFrame((state) => {
    refs.current.forEach((m, i) => { if (m) m.material.opacity = 0.6 + 0.15 * Math.sin(state.clock.elapsedTime * 12 + i); });
  });
  return (
    <group position={[H.position[0], fl, H.position[1]]} rotation={[0, H.rotationY, 0]}>
      {[-3.6, 3.6].map((x, i) => (
        <mesh key={x} ref={(el) => (refs.current[i] = el)} geometry={geo} position={[x, 2.2, 0.7]}>
          <meshStandardMaterial color="#bff2f4" transparent opacity={0.7} roughness={0.1} emissive="#5fc8d0" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE MESA LANDS — the stair, the ladders, the rope bridge, the mine
// ---------------------------------------------------------------------------
function MesaWorks({ M }) {
  const late = getLateStructures();
  const flights = late.flights.filter((f) => f.id.startsWith("mesa"));
  const landing = late.boxes.find((b) => b.id === "mesa-landing");
  const bridge = late.decks.find((d) => d.id === "mesa-bridge");
  const ladders = getLadders();
  return (
    <group>
      {flights.map((f) => <Flight key={f.id} f={f} stepMat={M.red} wallMat={M.red} wallH={0.75} finial={null} deep={3} />)}
      {landing && <Box p={[landing.c[0], landing.top - 2, landing.c[1]]} s={[landing.hx * 2 + 0.6, 4, landing.hz * 2]} m={M.red} tile={1.4} />}
      {ladders.map((L) => <Ladder key={L.id} L={L} M={M} />)}
      {bridge && <RopeBridge d={bridge} M={M} />}
      <MineRails M={M} />
    </group>
  );
}
function Ladder({ L, M }) {
  // From its foot (on the ground, just out from the cliff) leaning up to the lip.
  const mid = [L.a[0] + L.tx * L.len / 2, L.a[1] + L.tz * L.len / 2];
  const bot = [mid[0] + L.nx * 0.3, L.base - 0.2, mid[1] + L.nz * 0.3];
  const top = [mid[0] - L.nx * (L.cliffW - 0.15), L.top + 0.9, mid[1] - L.nz * (L.cliffW - 0.15)];
  const rails = [-0.45, 0.45].map((o) => ({
    a: [bot[0] + L.tx * o, bot[1], bot[2] + L.tz * o],
    b: [top[0] + L.tx * o, top[1], top[2] + L.tz * o],
  }));
  const n = Math.round((L.top - L.base) / 0.42);
  const rungs = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    rungs.push(rails.map((r) => r.a.map((v, k) => v + (r.b[k] - v) * t)));
  }
  return (
    <group>
      {rails.map((r, i) => <Beam key={i} a={r.a} b={r.b} w={0.12} t={0.16} m={M.woodDark} />)}
      {rungs.map((p, i) => <Beam key={`r${i}`} a={p[0]} b={p[1]} w={0.07} t={0.07} m={M.wood} cast={false} />)}
    </group>
  );
}
function RopeBridge({ d, M }) {
  const planks = [];
  const n = Math.round(d.L / 0.42);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    planks.push({ x: d.from[0] + d.ux * d.L * t, z: d.from[1] + d.uz * d.L * t, y: d.deckAt(t) - 0.06, yaw: Math.atan2(d.ux, d.uz) });
  }
  const rope = (side, h) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push(new THREE.Vector3(d.from[0] + d.ux * d.L * t - d.uz * (d.hw + 0.15) * side, d.deckAt(t) + h, d.from[1] + d.uz * d.L * t + d.ux * (d.hw + 0.15) * side));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 5, false);
  };
  const ropes = [rope(1, 1.0), rope(-1, 1.0), rope(1, 0.05), rope(-1, 0.05)];
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} geometry={tiledBox(d.hw * 2 + 0.2, 0.08, 0.34, 1)} material={M.wood} castShadow receiveShadow />
      ))}
      {ropes.map((g, i) => <mesh key={`r${i}`} geometry={g} material={M.rope} />)}
      {[0, 1].flatMap((t) => [1, -1].map((s) => {
        const x = d.from[0] + d.ux * d.L * t - d.uz * (d.hw + 0.15) * s, z = d.from[1] + d.uz * d.L * t + d.ux * (d.hw + 0.15) * s;
        return <Cyl key={`${t}${s}`} p={[x, d.deckAt(t) + 0.55, z]} rt={0.11} rb={0.13} h={1.4} m={M.woodDark} seg={6} />;
      }))}
    </group>
  );
}
function MineRails({ M }) {
  const sleepers = [];
  const rails = [];
  for (let i = 0; i < MINE_RAILS.length - 1; i++) {
    const [ax, az] = MINE_RAILS[i], [bx, bz] = MINE_RAILS[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let s = 0; s < L; s += 0.9) {
      const x = ax + ux * s, z = az + uz * s;
      sleepers.push({ x, z, y: terrainHeight(x, z) + 0.04, yaw: Math.atan2(ux, uz) });
    }
    for (const o of [-0.55, 0.55]) {
      const a = [ax - uz * o, terrainHeight(ax, az) + 0.14, az + ux * o], b = [bx - uz * o, terrainHeight(bx, bz) + 0.14, bz + ux * o];
      rails.push({ a, b });
    }
  }
  const [mx, mz] = MINE_MOUTH.position;
  const my = terrainHeight(mx, mz + 3);
  return (
    <group>
      {sleepers.map((s, i) => <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.yaw, 0]} geometry={tiledBox(1.7, 0.12, 0.28, 1)} material={M.woodDark} receiveShadow />)}
      {rails.map((r, i) => <Beam key={`r${i}`} a={r.a} b={r.b} w={0.1} t={0.1} m={M.iron} cast={false} />)}
      {/* The mine's timber mouth in the cliff. */}
      <group position={[mx, my, mz + 1.2]}>
        <Box p={[0, MINE_MOUTH.height / 2, -0.4]} s={[MINE_MOUTH.width, MINE_MOUTH.height, 0.3]} m={M.dark} cast={false} />
        <Box p={[-MINE_MOUTH.width / 2, MINE_MOUTH.height / 2, 0]} s={[0.45, MINE_MOUTH.height + 0.2, 0.45]} m={M.woodDark} />
        <Box p={[MINE_MOUTH.width / 2, MINE_MOUTH.height / 2, 0]} s={[0.45, MINE_MOUTH.height + 0.2, 0.45]} m={M.woodDark} />
        <Box p={[0, MINE_MOUTH.height + 0.2, 0]} s={[MINE_MOUTH.width + 1, 0.5, 0.55]} m={M.woodDark} />
        <Box p={[0, MINE_MOUTH.height + 0.75, 0.1]} s={[2.6, 0.7, 0.12]} m={M.wood} />
      </group>
    </group>
  );
}
/** The mine cart at the end of the line (with a load of glittering ore). */
function MineCart({ M }) {
  const [x, z] = MINE_RAILS[MINE_RAILS.length - 2];
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y + 0.2, z]} rotation={[0, 0.15, 0]}>
      <Box p={[0, 0.7, 0]} s={[1.3, 0.9, 1.8]} m={M.woodDark} />
      <Box p={[0, 1.18, 0]} s={[1.38, 0.1, 1.88]} m={M.iron} />
      {[[-0.55, -0.6], [0.55, -0.6], [-0.55, 0.6], [0.55, 0.6]].map(([wx, wz], i) => (
        <Cyl key={i} p={[wx, 0.22, wz]} rt={0.24} rb={0.24} h={0.12} m={M.iron} rot={[0, 0, Math.PI / 2]} seg={10} />
      ))}
      {[[0, 1.3, 0.3], [0.3, 1.25, -0.3], [-0.3, 1.28, -0.1]].map((p, i) => (
        <mesh key={i} position={p}><dodecahedronGeometry args={[0.32, 0]} /><meshStandardMaterial color="#e8b23a" metalness={0.7} roughness={0.3} emissive="#7a4a10" emissiveIntensity={0.3} flatShading /></mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SUN ARCH (a natural arch) + SUNDIAL RISE
// ---------------------------------------------------------------------------
function SunArch({ M }) {
  const A = SUN_ARCH;
  const geo = useMemo(() => {
    const pts = [];
    const h = A.span / 2;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = -h + t * A.span;
      const y = A.height * Math.sin(Math.PI * t) * 0.92 + 0.6 * Math.sin(t * 9);
      pts.push(new THREE.Vector3(x, y, 0.4 * Math.sin(t * 4)));
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, A.thick / 2, 9, false);
    const p = tube.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // Thicker at the feet, lumpier everywhere.
      const k = 1 + 0.5 * Math.max(0, 1 - y / 4) + 0.15 * Math.sin(x * 1.3 + y * 0.7) + 0.08 * Math.sin(z * 4 + x * 3);
      p.setXYZ(i, x, y, z * k);
    }
    tube.computeVertexNormals();
    return tube;
  }, [A]);
  const y = terrainHeight(A.c[0], A.c[1]) - 1.2;
  return (
    <group position={[A.c[0], y, A.c[1]]} rotation={[0, A.yaw, 0]}>
      <mesh geometry={geo} material={M.strata} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * A.span / 2, 2.2, 0]} material={M.strata} castShadow receiveShadow>
          <cylinderGeometry args={[1.9, 2.8, 5.4, 9]} />
        </mesh>
      ))}
    </group>
  );
}
function SundialRise({ M }) {
  const S = SUNDIAL_RISE;
  const { drum, ramp, top, level } = SUNDIAL;
  const rampGeo = useMemo(() => {
    // The ramp's top surface + its outer face, as one strip mesh.
    const pos = [], uv = [], idx = [];
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const a = S.a0 + f * S.turn;
      const h = ramp.base + 0.04 + S.h * f;
      const ca = Math.cos(a), sa = Math.sin(a);
      const r0 = S.r - 0.02, r1 = S.r + S.rampW;
      pos.push(S.c[0] + ca * r0, h, S.c[1] + sa * r0, S.c[0] + ca * r1, h, S.c[1] + sa * r1, S.c[0] + ca * r1, level - 0.6, S.c[1] + sa * r1);
      const v = (f * S.turn * (S.r + S.rampW)) / 2;
      uv.push(0, v, S.rampW / 2, v, S.rampW / 2 + (h - level + 0.6) / 2, v);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 3, b = (i + 1) * 3;
      idx.push(a, b, a + 1, a + 1, b, b + 1); // the walkway
      idx.push(a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); // the outer face
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [S, ramp, level]);
  // Parapet blocks along the outer edge.
  const parapet = useMemo(() => {
    const out = [];
    const n = 44;
    for (let i = 2; i <= n; i++) {
      const f = i / n;
      const a = S.a0 + f * S.turn;
      const r = S.r + S.rampW - 0.2;
      out.push({ x: S.c[0] + Math.cos(a) * r, z: S.c[1] + Math.sin(a) * r, y: ramp.base + S.h * f, yaw: -a });
    }
    return out;
  }, [S, ramp]);
  // The dial: hour stones round a half-circle + the gnomon (casts a real shadow).
  const gn = [S.c[0], S.c[1] - 7.6];
  return (
    <group>
      <mesh position={[drum.c[0], (level - 0.8 + top) / 2, drum.c[1]]} material={M.strata} castShadow receiveShadow>
        <cylinderGeometry args={[drum.r, drum.r + 0.1, top - level + 0.8, 48]} />
      </mesh>
      <mesh position={[drum.c[0], top + 0.03, drum.c[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[drum.r - 0.15, 48]} />
        <meshStandardMaterial color="#efdcb4" roughness={0.9} />
      </mesh>
      <mesh position={[drum.c[0], top + 0.05, drum.c[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[drum.r - 1.1, drum.r - 0.6, 64]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh geometry={rampGeo} material={M.pale} castShadow receiveShadow />
      {parapet.map((p, i) => <mesh key={i} position={[p.x, p.y + 0.35, p.z]} rotation={[0, p.yaw, 0]} geometry={tiledBox(0.35, 0.7, 1.2, 1)} material={M.brick} castShadow />)}
      {Array.from({ length: 13 }).map((_, i) => {
        const a = Math.PI * (i / 12);
        const r = 8.4;
        return <Box key={i} p={[gn[0] + Math.cos(a) * r * 0.98, top + 0.12, gn[1] + Math.sin(a) * r]} s={[0.5, 0.24, 0.5]} m={i % 3 === 0 ? M.gold : M.brick} />;
      })}
      <group position={[gn[0], top, gn[1]]}>
        <Box p={[0, 0.2, 0]} s={[1.2, 0.4, 2.2]} m={M.brick} />
        <GnomonBlade M={M} />
      </group>
    </group>
  );
}
function GnomonBlade({ M }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(3.2, 0); sh.lineTo(0, 3.4); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false });
    g.translate(0, 0, -0.08);
    g.rotateY(-Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} position={[0, 0.4, -1]} material={M.gold} castShadow />;
}

export default function DesertLandmarks() {
  const M = useMats();
  return (
    <group>
      <StaticBatch>
        <Pyramid M={M} />
        <Obelisks M={M} />
        <SunTemple M={M} />
        <Oasis M={M} />
      </StaticBatch>
      <StaticBatch farDist={150}>
        <MesaWorks M={M} />
        <MineCart M={M} />
        <SunArch M={M} />
        <SundialRise M={M} />
      </StaticBatch>
      <Sunstone />
      <Braziers />
      <SkyPyramid />
      <Spouts />
    </group>
  );
}
export { getLateStructures };
