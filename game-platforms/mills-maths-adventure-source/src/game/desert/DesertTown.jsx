import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  CARAVAN_GATE, BAZAAR_BUILDINGS, ZIGGURAT, MARKET_STALLS, TOWN_WELL, DESERT_WELCOME_SIGN, DESERT_SIGNPOSTS, QS_SIGNS,
  DESERT_NAME,
} from "../../data/desert/desertLayout.js";
import {
  TOWN_LEVEL, TOWER_FLIGHT, TOWER_LANDING_BOX, ROOF_PLANK, ZIGGURAT_TIERS, ZIGGURAT_FLIGHT, terrainHeight,
} from "../../data/desert/desertTerrain.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { desertMat, getDesertTextures, signTexture } from "./desertMaterials.js";
import { Box, Cyl, Flight, tiledBox } from "./desertKit.jsx";

/**
 * THE BAZAAR + THE CARAVAN GATE — the smooth plaster gate wall with its round
 * arch, towers + waving banners (BotW's Gerudo Town); the pastel town of
 * Tostarena: plaster houses with domes, awnings, doors + windows, the tower
 * with its outside stair and the roof bridge, the stepped ziggurat with a
 * little shrine on top, market stalls round Bazaar Square and the well;
 * plus every welcome sign, signpost and quicksand warning in the desert.
 */
const GOLD = "#e8b23a";
function useMats() {
  return useMemo(() => {
    const t = getDesertTextures();
    return {
      plaster: (c) => desertMat(c, { map: t.plaster, rough: 0.92 }),
      flat: (c, o) => desertMat(c, o),
      stripes: (c) => desertMat(c, { map: t.stripes, side: THREE.DoubleSide, rough: 0.85 }),
      brick: desertMat("#ffffff", { map: t.bricks }),
      pale: desertMat("#ffffff", { map: t.bricksPale }),
      red: desertMat("#ffffff", { map: t.bricksRed }),
      wood: desertMat("#ffffff", { map: t.planks }),
      woodDark: desertMat("#5e3e22"),
      dark: desertMat("#3a2616", { rough: 1 }),
      glass: desertMat("#26313a", { rough: 0.3, metal: 0.2 }),
      gold: desertMat(GOLD, { metal: 0.7, rough: 0.3 }),
      gateWall: desertMat("#f2e2c2", { map: t.plaster }),
    };
  }, []);
}

// ---------------------------------------------------------------------------
// THE CARAVAN GATE
// ---------------------------------------------------------------------------
function CaravanGate({ M }) {
  const G = CARAVAN_GATE;
  const y = TOWN_LEVEL;
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    const springY = G.archTop - G.openHalf;
    sh.moveTo(-G.halfSpan, -1);
    sh.lineTo(-G.openHalf, -1);
    sh.lineTo(-G.openHalf, springY);
    sh.absarc(0, springY, G.openHalf, Math.PI, 0, true);
    sh.lineTo(G.openHalf, -1);
    sh.lineTo(G.halfSpan, -1);
    sh.lineTo(G.halfSpan, G.height - 0.6);
    sh.quadraticCurveTo(G.halfSpan, G.height, G.halfSpan - 0.6, G.height);
    sh.lineTo(-G.halfSpan + 0.6, G.height);
    sh.quadraticCurveTo(-G.halfSpan, G.height, -G.halfSpan, G.height - 0.6);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: G.thick, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2, curveSegments: 20 });
    g.translate(0, 0, -G.thick / 2);
    // UVs in metres / 4 (the plaster tiles every 4 m).
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    return g;
  }, [G]);
  const archRing = useMemo(() => {
    const g = new THREE.TorusGeometry(G.openHalf + 0.25, 0.28, 8, 32, Math.PI);
    return g;
  }, [G]);
  return (
    <group position={[0, y, G.z]}>
      <mesh geometry={geo} material={M.gateWall} castShadow receiveShadow />
      {/* A painted band + the gold trim round the arch. */}
      <Box p={[0, G.height - 1.0, G.thick / 2 + 0.14]} s={[G.halfSpan * 2 - 1.2, 0.45, 0.06]} m={M.flat("#c4553c")} cast={false} />
      <Box p={[0, G.height - 1.0, -G.thick / 2 - 0.14]} s={[G.halfSpan * 2 - 1.2, 0.45, 0.06]} m={M.flat("#c4553c")} cast={false} />
      {[1, -1].map((s) => <mesh key={s} geometry={archRing} position={[0, G.archTop - G.openHalf, s * (G.thick / 2 + 0.05)]} material={M.gold} />)}
      {/* A sun emblem over the arch (both faces). */}
      {[1, -1].map((s) => (
        <mesh key={`e${s}`} position={[0, G.archTop + 0.85, s * (G.thick / 2 + 0.16)]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={M.gold}>
          <circleGeometry args={[0.6, 24]} />
        </mesh>
      ))}
      {/* The round towers at each end. */}
      {[-1, 1].map((s) => (
        <group key={`t${s}`} position={[s * (G.halfSpan + 1.2), 0, 0]}>
          <Cyl p={[0, 4.4, 0]} rt={2.0} rb={2.2} h={10} m={M.gateWall} seg={24} />
          <Cyl p={[0, 9.55, 0]} rt={2.3} rb={2.3} h={0.5} m={M.flat("#c4553c")} seg={24} />
          <mesh position={[0, 9.8, 0]} material={M.flat("#e8a34a", { rough: 0.6 })} castShadow>
            <sphereGeometry args={[2.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 12.1, 0]} material={M.gold} castShadow><coneGeometry args={[0.25, 0.9, 8]} /></mesh>
          {[0.6, 2.2, 3.8].map((a) => (
            <Box key={a} p={[Math.cos(a) * 2.05, 6.5, Math.sin(a) * 2.05]} rot={[0, -a + Math.PI / 2, 0]} s={[0.6, 1.1, 0.1]} m={M.glass} cast={false} />
          ))}
        </group>
      ))}
    </group>
  );
}
/** Banners hanging from the gate wall, swaying in the hot wind. */
function Banners() {
  const G = CARAVAN_GATE;
  const refs = useRef([]);
  const spots = [[-7.5, "#c4553c"], [7.5, "#2f9c8f"], [-12.5, "#2f9c8f"], [12.5, "#c4553c"]];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => { if (g) g.rotation.x = 0.06 + Math.sin(t * 1.7 + i * 1.3) * 0.08; });
  });
  return (
    <group position={[0, TOWN_LEVEL, G.z + G.thick / 2 + 0.2]}>
      {spots.map(([x, c], i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[x, G.height - 0.4, 0]}>
          <mesh position={[0, -1.9, 0.02]}><planeGeometry args={[1.5, 3.6]} /><meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={0.9} /></mesh>
          <mesh position={[0, -1.4, 0.04]}><circleGeometry args={[0.45, 20]} /><meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.4} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 1.8, 6]} /><meshStandardMaterial color="#5e3e22" /></mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE TOWN
// ---------------------------------------------------------------------------
function Building({ b, M }) {
  const y = TOWN_LEVEL;
  const face = b.x > 0 ? -1 : 1; // the street-facing side (±x)
  const wallM = M.plaster(b.wall);
  const trimM = M.flat(b.trim);
  const doorX = face * (b.w / 2 + 0.03);
  return (
    <group position={[b.x, y, b.z]}>
      <Box p={[0, b.h / 2 - 0.3, 0]} s={[b.w, b.h + 0.6, b.d]} m={wallM} tile={3} />
      <Box p={[0, b.h - 0.18, 0]} s={[b.w + 0.24, 0.36, b.d + 0.24]} m={trimM} />
      <Box p={[0, 0.2, 0]} s={[b.w + 0.16, 0.4, b.d + 0.16]} m={trimM} />
      {/* The door + its step, on the street side. */}
      <Box p={[doorX, 1.2, 0]} s={[0.12, 2.4, 1.4]} m={M.woodDark} />
      <Box p={[doorX + face * 0.04, 2.55, 0]} s={[0.1, 0.3, 1.8]} m={trimM} />
      {/* Windows: two on the street side + one on each end. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box p={[face * (b.w / 2 + 0.02), b.h * 0.62, s * b.d * 0.3]} s={[0.1, 1.0, 0.8]} m={M.glass} cast={false} />
          <Box p={[face * (b.w / 2 + 0.05), b.h * 0.62 + 0.62, s * b.d * 0.3]} s={[0.1, 0.18, 1.1]} m={trimM} cast={false} />
          <Box p={[0, b.h * 0.6, s * (b.d / 2 + 0.02)]} s={[0.9, 0.9, 0.1]} m={M.glass} cast={false} />
        </group>
      ))}
      {/* An awning over the door. */}
      {b.awning && (
        <mesh position={[face * (b.w / 2 + 0.75), 2.95, 0]} rotation={[0, 0, face * 0.35]} material={M.stripes(b.awning)} castShadow>
          <boxGeometry args={[1.6, 0.06, 2.6]} />
        </mesh>
      )}
      {/* A dome (on a short drum) with a gold finial. */}
      {b.dome && (
        <group position={[0, b.h, 0]}>
          <Cyl p={[0, 0.3, 0]} rt={Math.min(b.w, b.d) * 0.32} rb={Math.min(b.w, b.d) * 0.32} h={0.6} m={wallM} seg={24} />
          <mesh position={[0, 0.6, 0]} material={M.flat(b.dome, { rough: 0.55 })} castShadow>
            <sphereGeometry args={[Math.min(b.w, b.d) * 0.32, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.6 + Math.min(b.w, b.d) * 0.32 + 0.3, 0]} material={M.gold}><coneGeometry args={[0.14, 0.6, 8]} /></mesh>
        </group>
      )}
      {/* Unreachable roofs get little crenellations; terraces get rugs + a sunshade. */}
      {!b.terrace && !b.dome && [-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Box key={`${sx}${sz}`} p={[sx * (b.w / 2 - 0.3), b.h + 0.25, sz * (b.d / 2 - 0.3)]} s={[0.6, 0.5, 0.6]} m={trimM} />
      )))}
      {b.terrace && (
        <group position={[0, b.h + 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.01, 0]}><planeGeometry args={[3, 2]} /><meshStandardMaterial color="#b4382a" roughness={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.02, 0]}><planeGeometry args={[2.4, 1.4]} /><meshStandardMaterial color="#e8b23a" roughness={1} /></mesh>
        </group>
      )}
    </group>
  );
}
function TowerWorks({ M }) {
  const L = TOWER_LANDING_BOX;
  const R = ROOF_PLANK;
  return (
    <group>
      <Flight f={TOWER_FLIGHT} stepMat={M.pale} wallMat={M.plaster("#f6d77a")} walls="left" wallH={0.8} wallT={0.3} finial={GOLD} deep={0.6} />
      <Box p={[L.c[0], (TOWN_LEVEL + L.top) / 2, L.c[1]]} s={[L.hx * 2, L.top - TOWN_LEVEL, L.hz * 2]} m={M.plaster("#f6d77a")} tile={3} />
      {/* The plank bridge to the twin roof + its rope rails. */}
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i + 0.5) / 9;
        return <mesh key={i} position={[R.from[0] + R.ux * R.L * t, R.deckAt(t) - 0.05, R.from[1] + R.uz * R.L * t]} geometry={tiledBox(0.38, 0.08, R.hw * 2 + 0.2, 1)} material={M.wood} castShadow receiveShadow />;
      })}
      {[1, -1].map((s) => (
        <mesh key={s} position={[(R.from[0] + R.to[0]) / 2, R.deckAt(0.5) + 0.9, R.from[1] + s * (R.hw + 0.1)]} rotation={[0, 0, Math.PI / 2]} material={M.flat("#b89664")}>
          <cylinderGeometry args={[0.04, 0.04, R.L + 0.6, 6]} />
        </mesh>
      ))}
    </group>
  );
}
function Ziggurat({ M }) {
  const top = ZIGGURAT_TIERS[ZIGGURAT_TIERS.length - 1];
  return (
    <group>
      {ZIGGURAT_TIERS.map((t) => {
        const y0 = t.k === 0 ? TOWN_LEVEL - 1 : ZIGGURAT_TIERS[t.k - 1].top;
        return (
          <group key={t.k}>
            <Box p={[ZIGGURAT.c[0], (y0 + t.top) / 2, ZIGGURAT.c[1]]} s={[t.half * 2, t.top - y0, t.half * 2]} m={t.k % 2 ? M.pale : M.red} tile={1.6} />
            <Box p={[ZIGGURAT.c[0], t.top - 0.1, ZIGGURAT.c[1]]} s={[t.half * 2 + 0.14, 0.22, t.half * 2 + 0.14]} m={M.pale} />
          </group>
        );
      })}
      <Flight f={ZIGGURAT_FLIGHT} stepMat={M.pale} wallMat={M.red} wallH={0.6} wallT={0.35} deep={0.8} />
      {/* A little shrine on top: four posts, a dome, a gold finial. */}
      <group position={[ZIGGURAT.c[0], top.top, ZIGGURAT.c[1]]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <Cyl key={i} p={[sx * 1.7, 1.2, sz * 1.7]} rt={0.16} rb={0.2} h={2.4} m={M.pale} seg={8} />)}
        <Box p={[0, 2.5, 0]} s={[4, 0.3, 4]} m={M.pale} />
        <mesh position={[0, 2.65, 0]} material={M.flat("#3f86d0", { rough: 0.5 })} castShadow><sphereGeometry args={[1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, 4.3, 0]} material={M.gold}><coneGeometry args={[0.18, 0.8, 8]} /></mesh>
      </group>
    </group>
  );
}
function MarketStall({ x, z, yaw, colour, M, k }) {
  const y = terrainHeight(x, z);
  const goods = ["#e8752a", "#f2c84a", "#c43a52", "#6aa83a", "#8a4ab4"];
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <Box p={[0, 0.5, 0]} s={[2.8, 0.9, 1.4]} m={M.wood} />
      {[[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]].map(([px, pz], i) => <Cyl key={i} p={[px, 1.4, pz]} rt={0.06} rb={0.07} h={2.8} m={M.woodDark} seg={6} />)}
      <mesh position={[0, 2.75, 0.15]} rotation={[0.28, 0, 0]} material={M.stripes(colour)} castShadow><boxGeometry args={[3.2, 0.06, 2.0]} /></mesh>
      {/* Goods: fruit in baskets, rolled rugs, pots. */}
      {[-0.9, -0.3, 0.3, 0.9].map((gx, i) => (
        <mesh key={i} position={[gx, 1.08, -0.1]} material={M.flat(goods[(i + k) % goods.length], { rough: 0.6 })} castShadow>
          <sphereGeometry args={[0.2, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 1.02, 0.42]} rotation={[0, 0, Math.PI / 2]} material={M.flat(goods[(k + 2) % goods.length])}><cylinderGeometry args={[0.13, 0.13, 2.4, 10]} /></mesh>
      <mesh position={[0, 0.06, 1.1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 1.2]} /><meshStandardMaterial color={goods[(k + 3) % goods.length]} roughness={1} /></mesh>
    </group>
  );
}
function Well({ M }) {
  const [x, z] = TOWN_WELL;
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 0.45, 0]} rt={1.1} rb={1.15} h={0.9} m={M.pale} seg={20} />
      <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.85, 20]} /><meshStandardMaterial color="#1e4a54" roughness={0.2} /></mesh>
      {[-1, 1].map((s) => <Box key={s} p={[s * 0.95, 1.6, 0]} s={[0.18, 2.2, 0.18]} m={M.woodDark} />)}
      <Box p={[0, 2.75, 0]} s={[2.4, 0.15, 1.5]} m={M.flat("#c4553c")} />
      <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]} material={M.woodDark}><cylinderGeometry args={[0.08, 0.08, 2.0, 8]} /></mesh>
      <Cyl p={[0.3, 1.45, 0]} rt={0.18} rb={0.14} h={0.3} m={M.wood} seg={10} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SIGNS — welcome board, signposts (arrows with names), quicksand warnings.
// ---------------------------------------------------------------------------
const _arrowTex = new Map();
function arrowTexture(label) {
  if (_arrowTex.has(label)) return _arrowTex.get(label);
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = 512; cv.height = 96;
  const g = cv.getContext("2d");
  g.fillStyle = "#e9c88a"; g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#c79a5c"; for (let i = 0; i < 5; i++) g.fillRect(0, i * 19 + 8, 512, 2);
  g.fillStyle = "#4a2a10"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = 'bold 50px "MMA Rounded", "Trebuchet MS", sans-serif';
  g.fillText(label, 256, 50, 470);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  _arrowTex.set(label, t);
  return t;
}
function Signpost({ s, M }) {
  const [x, z] = s.p;
  const y = terrainHeight(x, z);
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 1.4, 0]} rt={0.09} rb={0.11} h={2.8} m={M.woodDark} seg={6} />
      {s.arrows.map(([label, to], i) => {
        const yaw = Math.atan2(to[0] - x, to[1] - z) - Math.PI / 2;
        const tex = arrowTexture(label);
        return (
          <group key={i} position={[0, 2.45 - i * 0.48, 0]} rotation={[0, yaw, 0]}>
            <mesh position={[0.95, 0, 0]} material={M.woodDark} castShadow><boxGeometry args={[1.9, 0.4, 0.08]} /></mesh>
            <mesh position={[2.0, 0, 0]} rotation={[0, 0, -Math.PI / 4]} material={M.woodDark}><boxGeometry args={[0.28, 0.28, 0.08]} /></mesh>
            {[1, -1].map((f) => (
              <mesh key={f} position={[0.95, 0, f * 0.045]} rotation={[0, f > 0 ? 0 : Math.PI, 0]}>
                <planeGeometry args={[1.82, 0.34]} />
                <meshStandardMaterial map={tex} roughness={0.9} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
function WarningSign({ x, z, yaw }) {
  const y = terrainHeight(x, z);
  const tex = getDesertTextures().warn;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {[-0.55, 0.55].map((o) => <mesh key={o} position={[o, 0.75, 0]} material={desertMat("#6e4a2a")}><boxGeometry args={[0.1, 1.5, 0.1]} /></mesh>)}
      <mesh position={[0, 1.45, 0.06]} castShadow><boxGeometry args={[1.5, 0.95, 0.06]} /><meshStandardMaterial color="#6e4a2a" /></mesh>
      {[1, -1].map((f) => (
        <mesh key={f} position={[0, 1.45, f * 0.1]} rotation={[0, f > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[1.42, 0.88]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
function WelcomeSign({ M }) {
  const [x, z] = DESERT_WELCOME_SIGN.position;
  const y = terrainHeight(x, z);
  const tex = signTexture(DESERT_NAME, "Explore · Climb · Mind the quicksand!", { bg: "#f2d27a", fg: "#5a2e0e", border: "#b4542a", icon: "☀ " });
  return (
    <group position={[x, y, z]} rotation={[0, DESERT_WELCOME_SIGN.rotationY, 0]}>
      {[-1.15, 1.15].map((o) => <Cyl key={o} p={[o, 1.2, 0]} rt={0.1} rb={0.12} h={2.4} m={M.woodDark} seg={6} />)}
      <mesh position={[0, 1.9, 0]} castShadow><boxGeometry args={[2.6, 1.3, 0.1]} /><meshStandardMaterial color="#6e4a2a" /></mesh>
      <mesh position={[0, 1.9, 0.06]}><planeGeometry args={[2.46, 1.18]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>
      <mesh position={[0, 2.7, 0]} material={desertMat("#e8b23a", { metal: 0.6, rough: 0.3 })}><circleGeometry args={[0.32, 20]} /></mesh>
    </group>
  );
}

export default function DesertTown() {
  const M = useMats();
  return (
    <group>
      <StaticBatch>
        <CaravanGate M={M} />
        {BAZAAR_BUILDINGS.map((b) => <Building key={b.id} b={b} M={M} />)}
        <TowerWorks M={M} />
        <Ziggurat M={M} />
        {MARKET_STALLS.map(([x, z, yaw, c], i) => <MarketStall key={i} x={x} z={z} yaw={yaw} colour={c} M={M} k={i} />)}
        <Well M={M} />
        <WelcomeSign M={M} />
      </StaticBatch>
      <StaticBatch farDist={120}>
        {DESERT_SIGNPOSTS.map((s) => <Signpost key={s.id} s={s} M={M} />)}
        {QS_SIGNS.map(([x, z, yaw], i) => <WarningSign key={i} x={x} z={z} yaw={yaw} />)}
      </StaticBatch>
      <Banners />
    </group>
  );
}
