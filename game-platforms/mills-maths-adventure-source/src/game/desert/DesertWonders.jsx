import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { DUNE_SHIP, SAND_SPHINX, CRYSTALS, FOSSIL, CAMELS, STEPPING_STONES } from "../../data/desert/desertLayout.js";
import { getLateStructures, getQuicksandPits, terrainHeight } from "../../data/desert/desertTerrain.js";
import StaticBatch from "../jungle/StaticBatch.jsx";
import { desertMat, getDesertTextures, makeCrystalMaterial } from "./desertMaterials.js";
import { Box, Cyl, Beam, tiledBox } from "./desertKit.jsx";

/**
 * DESERT WONDERS — the half-buried DUNE SHIP (Odyssey's wreck in the sand),
 * the giant SAND SPHINX head poking out of a dune, the glassy CRYSTAL spires
 * of Crystal Hollow (glowing faintly, with drifting sparkles), the FOSSIL
 * skeleton at the dig with its camp, the CAMELS (they chew + flick their
 * tails), and the BOARDWALK + STEPPING STONES over the quicksand moat.
 */
const BONE = "#efe4cc";
function useMats() {
  return useMemo(() => {
    const t = getDesertTextures();
    return {
      wood: desertMat("#ffffff", { map: t.planks }),
      hull: desertMat("#7a5232", { rough: 0.85 }),
      hullDark: desertMat("#4f331d"),
      sail: desertMat("#efe2c4", { side: THREE.DoubleSide, rough: 1 }),
      rope: desertMat("#b89664"),
      stone: desertMat("#ffffff", { map: t.bricksPale }),
      face: desertMat("#e2c08a", { rough: 0.9 }),
      blue: desertMat("#2f6fb0", { rough: 0.6 }),
      gold: desertMat("#e8b23a", { metal: 0.65, rough: 0.35 }),
      bone: desertMat(BONE, { rough: 0.8 }),
      tent: desertMat("#d8c49a", { side: THREE.DoubleSide, rough: 1 }),
      sandstone: desertMat("#c99a62", { flat: true }),
      dark: desertMat("#2a1a10"),
    };
  }, []);
}

// ---------------------------------------------------------------------------
// THE DUNE SHIP — a sand-sailing ship wrecked + half-buried, tipped over.
// ---------------------------------------------------------------------------
function DuneShip({ M }) {
  const S = DUNE_SHIP;
  const [x, z] = S.position;
  // Tipped on its side + sunk: the keel + the low side are in the sand.
  const y = terrainHeight(x, z) + 1.4;
  const hull = useMemo(() => {
    // A hull shell: the lower half of a stretched sphere, pinched to a bow,
    // with its rim (the gunwale) 0.9 m above the deck.
    const g = new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.scale(3.0, 2.6, S.length / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const zz = p.getZ(i) / (S.length / 2);
      const k = zz > 0 ? 1 - Math.pow(zz, 2) * 0.9 : 1 - zz * zz * 0.3; // the bow tapers to a point
      p.setX(i, p.getX(i) * k);
      // The bow sweeps up a little.
      p.setY(i, p.getY(i) + Math.max(0, zz) ** 3 * 1.2 + 0.9);
    }
    g.computeVertexNormals();
    return g;
  }, [S]);
  // The inside of the hull (seen over the gunwale): the same shell, flipped.
  const inner = useMemo(() => {
    const g = hull.clone();
    g.scale(0.92, 0.95, 0.96);
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; }
    g.computeVertexNormals();
    return g;
  }, [hull]);
  return (
    <group position={[x, y, z]} rotation={[0, S.rotationY, S.tilt]}>
      <mesh geometry={hull} material={M.hull} castShadow receiveShadow />
      <mesh geometry={inner} material={M.hullDark} />
      {/* The deck, a cabin with portholes, the broken mast + a torn sail. */}
      <Box p={[0, 0.0, -0.8]} s={[4.9, 0.2, S.length * 0.78]} m={M.wood} tile={1.5} />
      <Box p={[0, 1.15, -6]} s={[3.4, 2.1, 3.8]} m={M.hull} />
      <Box p={[0, 2.3, -6]} s={[3.9, 0.3, 4.3]} m={M.hullDark} />
      {[-1, 1].map((s) => <mesh key={s} position={[s * 1.72, 1.3, -6]} rotation={[0, s * Math.PI / 2, 0]} material={M.gold}><ringGeometry args={[0.22, 0.32, 16]} /></mesh>)}
      <Cyl p={[0, 4.4, 1.5]} rt={0.22} rb={0.3} h={8.6} m={M.hullDark} seg={10} />
      <Cyl p={[0, 7.4, 1.5]} rt={0.12} rb={0.12} h={6.4} m={M.hullDark} rot={[0, 0, Math.PI / 2]} seg={8} />
      <mesh position={[0, 4.9, 1.6]} rotation={[0, 0, 0.04]} material={M.sail}>
        <planeGeometry args={[5.6, 4.6, 6, 6]} />
      </mesh>
      <Cyl p={[0, 8.5, 1.5]} rt={0.75} rb={0.6} h={0.7} m={M.hull} seg={12} />
      {/* The bowsprit + a few ropes. */}
      <Beam a={[0, 1.6, S.length / 2 - 1.5]} b={[0, 3.2, S.length / 2 + 2.6]} w={0.22} t={0.22} m={M.hullDark} />
      <Beam a={[0, 8.6, 1.5]} b={[0, 3.2, S.length / 2 + 2.6]} w={0.05} t={0.05} m={M.rope} cast={false} />
      <Beam a={[0, 8.6, 1.5]} b={[0, 1.0, -S.length / 2 + 1]} w={0.05} t={0.05} m={M.rope} cast={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE SAND SPHINX — a giant stone head half-buried in a dune.
// ---------------------------------------------------------------------------
function SandSphinx({ M }) {
  const S = SAND_SPHINX;
  const [x, z] = S.position;
  const y = terrainHeight(x, z) - 1.8;
  const stripes = [-1.6, -0.8, 0, 0.8, 1.6];
  return (
    <group position={[x, y, z]} rotation={[0.1, S.rotationY, -0.08]} scale={S.size}>
      {/* The headdress: a striped dome with lappets flaring down both sides. */}
      <mesh position={[0, 4.4, -0.6]} scale={[3.7, 3.9, 3.4]} material={M.blue} castShadow>
        <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>
      {stripes.map((xx) => (
        <mesh key={xx} position={[xx, 4.4, -0.6]} scale={[0.32, 3.92, 3.42]} material={M.gold}>
          <sphereGeometry args={[1, 10, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.0, 2.2, 0.9]} rotation={[0.08, 0, s * 0.16]}>
          <Box p={[0, 0, 0]} s={[0.8, 4.6, 2.4]} m={M.blue} />
          {[-1.4, -0.4, 0.6, 1.6].map((yy) => <Box key={yy} p={[s * 0.02, yy, 0]} s={[0.84, 0.3, 2.44]} m={M.gold} cast={false} />)}
        </group>
      ))}
      <Box p={[0, 5.15, 2.25]} s={[5.4, 0.55, 0.6]} m={M.gold} />
      {/* The face: rounded cheeks, a strong nose, painted eyes + brows, a calm mouth. */}
      <mesh position={[0, 2.9, 1.9]} scale={[2.4, 2.6, 1.5]} material={M.face} castShadow>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <mesh position={[0, 2.95, 3.3]} rotation={[-0.15, 0, 0]} scale={[0.5, 1.0, 0.55]} material={M.face} castShadow>
        <coneGeometry args={[1, 1.6, 4]} />
      </mesh>
      {[-0.95, 0.95].map((xx) => (
        <group key={xx}>
          <mesh position={[xx, 3.75, 3.1]} scale={[0.62, 0.26, 0.2]} material={desertMat("#f6efe0")}><sphereGeometry args={[1, 12, 8]} /></mesh>
          <mesh position={[xx, 3.75, 3.27]} scale={[0.22, 0.22, 0.1]} material={desertMat("#2a1a10")}><sphereGeometry args={[1, 10, 8]} /></mesh>
          <Box p={[xx * 1.05, 4.25, 3.05]} s={[1.4, 0.2, 0.25]} m="#2f6fb0" cast={false} />
          <Box p={[xx * 1.55, 3.6, 3.0]} s={[0.7, 0.12, 0.2]} m="#2f6fb0" cast={false} />
        </group>
      ))}
      <Box p={[0, 1.8, 3.25]} s={[1.3, 0.22, 0.3]} m="#9a5a3a" cast={false} />
      {/* The cobra on the brow + a chunk broken off the headdress lying nearby. */}
      <Cyl p={[0, 5.9, 2.4]} rt={0.18} rb={0.3} h={1.1} m={M.gold} seg={8} />
      <mesh position={[0, 6.55, 2.5]} material={M.gold}><sphereGeometry args={[0.32, 10, 8]} /></mesh>
      <group position={[5.6, 0.9, 3.4]} rotation={[0.4, 0.6, 0.3]}>
        <Box p={[0, 0, 0]} s={[1.6, 1.0, 1.2]} m={M.blue} />
        <Box p={[0, 0, 0]} s={[0.3, 1.04, 1.24]} m={M.gold} cast={false} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// CRYSTAL HOLLOW — glassy hexagonal spires, tinted aqua → rose.
// ---------------------------------------------------------------------------
const crystalColour = (hue) => new THREE.Color().setHSL(0.5 - hue * 0.55 + (hue > 0.6 ? 1 : 0), 0.62, 0.66);
function Crystals() {
  const mats = useMemo(() => CRYSTALS.map(([, , , , , , hue]) => makeCrystalMaterial(crystalColour(hue))), []);
  const prism = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
    g.translate(0, 0.5, 0);
    const tip = new THREE.ConeGeometry(1, 0.7, 6, 1);
    tip.translate(0, 1.35, 0);
    const parts = [g, tip];
    const m = new THREE.BufferGeometry();
    // (Two meshes per crystal: the prism + its tip share the material.)
    void m;
    return parts;
  }, []);
  return (
    <group>
      {CRYSTALS.map(([x, z, h, r, tilt, yaw], i) => {
        const y = terrainHeight(x, z) - 0.6;
        return (
          <group key={i} position={[x, y, z]} rotation={[tilt, yaw, tilt * 0.5]}>
            <mesh geometry={prism[0]} material={mats[i]} scale={[r, h, r]} castShadow />
            <mesh geometry={prism[1]} material={mats[i]} scale={[r, h * 0.35, r]} position={[0, h - h * 0.35, 0]} castShadow />
            {/* Little shards round its foot. */}
            {[0, 2.1, 4.2].map((a, k) => (
              <mesh key={k} geometry={prism[0]} material={mats[i]} position={[Math.cos(a + i) * r * 1.4, 0.2, Math.sin(a + i) * r * 1.4]} rotation={[0.5, a, 0.3]} scale={[r * 0.3, h * 0.18, r * 0.3]} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
function CrystalSparkles({ count = 90 }) {
  const tex = getDesertTextures().glow;
  const pts = useRef();
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => {
    const c = CRYSTALS[i % CRYSTALS.length];
    return { x: c[0], z: c[1], h: c[2], ph: Math.random() * 6.28, r: 0.6 + Math.random() * 2.4, sp: 0.2 + Math.random() * 0.4 };
  }), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = geo.attributes.position;
    seeds.forEach((s, i) => {
      const k = t * s.sp + s.ph;
      a.setXYZ(i, s.x + Math.cos(k) * s.r, terrainHeight(s.x, s.z) + ((k * 0.6) % 1) * s.h, s.z + Math.sin(k) * s.r);
    });
    a.needsUpdate = true;
  });
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.5} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#e8f6ff" />
    </points>
  );
}

// ---------------------------------------------------------------------------
// THE FOSSIL DIG — a giant skeleton half out of the sand + the dig camp.
// ---------------------------------------------------------------------------
function Fossil({ M }) {
  const F = FOSSIL;
  const y = terrainHeight(F.c[0], F.c[1]) - 0.3;
  const ribGeo = useMemo(() => new THREE.TorusGeometry(4.2, 0.26, 7, 20, Math.PI), []);
  return (
    <group position={[F.c[0], y, F.c[1]]} rotation={[0, F.yaw, 0]}>
      {/* The spine (vertebrae along the length). */}
      {Array.from({ length: 22 }).map((_, i) => {
        const t = i / 21;
        const xx = -F.length / 2 + t * F.length;
        const yy = 4.6 * Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95));
        return <mesh key={i} position={[xx, Math.max(0.4, yy), 0]} material={M.bone} castShadow><sphereGeometry args={[0.5 - t * 0.14, 9, 7]} /></mesh>;
      })}
      {/* Ribs arching over the spine (walk between them). */}
      {Array.from({ length: 11 }).map((_, k) => {
        const xx = ((k - 5) / 5) * (F.length / 2) * 0.72;
        const s = 1.05 - Math.abs(k - 5) / 10;
        return <mesh key={k} geometry={ribGeo} material={M.bone} position={[xx, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[s, s * 1.05, 1]} castShadow />;
      })}
      {/* The skull + jaw at the front end. */}
      <group position={[F.length / 2 + 2.2, 2.2, 0]} scale={1.5}>
        <mesh material={M.bone} scale={[2.2, 1.2, 1.3]} castShadow><sphereGeometry args={[1, 14, 10]} /></mesh>
        <mesh material={M.bone} position={[1.2, -0.7, 0]} scale={[1.6, 0.35, 0.9]} rotation={[0, 0, -0.25]} castShadow><sphereGeometry args={[1, 12, 8]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[0.4, 0.3, s * 0.85]} material={M.dark}><sphereGeometry args={[0.32, 10, 8]} /></mesh>)}
        {Array.from({ length: 6 }).map((_, i) => <mesh key={`t${i}`} position={[1.4 + i * 0.22, -0.45, (i % 2 ? 0.4 : -0.4)]} rotation={[Math.PI, 0, 0]} material={M.bone}><coneGeometry args={[0.07, 0.3, 5]} /></mesh>)}
      </group>
      {/* The tail. */}
      {Array.from({ length: 9 }).map((_, i) => <mesh key={`tl${i}`} position={[-F.length / 2 - 1 - i * 0.9, 0.4 - i * 0.04, Math.sin(i * 0.5) * 0.8]} material={M.bone}><sphereGeometry args={[0.28 - i * 0.022, 8, 6]} /></mesh>)}
    </group>
  );
}
/** A ridge tent: a triangular prism of canvas (3.6 m long, 2.3 m high). */
const TENT = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(-1.6, 0); sh.lineTo(1.6, 0); sh.lineTo(0, 2.3); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 3.6, bevelEnabled: false });
  g.translate(0, 0, -1.8);
  return g;
})();
function DigCamp({ M }) {
  const [cx, cz] = FOSSIL.c;
  const tents = [[cx + 12.5, cz - 10, 0.4], [cx - 2, cz - 14.5, -0.3]];
  return (
    <group>
      {tents.map(([x, z, yaw], i) => {
        const y = terrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]} rotation={[0, yaw, 0]}>
            <mesh geometry={TENT} material={M.tent} castShadow receiveShadow />
            <mesh position={[0, 0.85, 1.76]}><circleGeometry args={[0.55, 3, Math.PI / 2]} /><meshStandardMaterial color="#5a3a1c" /></mesh>
            <Cyl p={[0, 1.15, 1.85]} rt={0.05} rb={0.05} h={2.3} m="#5e3e22" seg={6} />
            <Cyl p={[0, 1.15, -1.85]} rt={0.05} rb={0.05} h={2.3} m="#5e3e22" seg={6} />
          </group>
        );
      })}
      {/* Crates, a sieve table, a pick + spade, a string grid over a dig square. */}
      {[[cx + 9, cz - 6], [cx + 9.8, cz - 5], [cx + 1.5, cz - 12]].map(([x, z], i) => <Box key={i} p={[x, terrainHeight(x, z) + 0.4, z]} s={[0.8, 0.8, 0.8]} m={M.wood} rot={[0, i, 0]} />)}
      {[[cx + 14, cz - 4], [cx + 18, cz - 4], [cx + 18, cz]].map(([x, z], i) => <Cyl key={`p${i}`} p={[x, terrainHeight(x, z) + 0.4, z]} rt={0.04} rb={0.05} h={0.8} m="#5e3e22" seg={5} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CAMELS — resting by the caravan stop + the oasis; they chew + flick their tails.
// ---------------------------------------------------------------------------
export function Camel({ x, z, yaw, k }) {
  const head = useRef();
  const tail = useRef();
  const y = terrainHeight(x, z);
  useFrame((state) => {
    const t = state.clock.elapsedTime + k * 3.1;
    if (head.current) { head.current.rotation.x = Math.sin(t * 0.7) * 0.12; head.current.position.y = 2.55 + Math.sin(t * 6) * 0.02; }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.6) * 0.35;
  });
  const fur = desertMat("#c9965c", { rough: 1 });
  const furDark = desertMat("#9c6a3a", { rough: 1 });
  const blanket = desertMat(["#c4553c", "#2f9c8f", "#7a52a8", "#e8a34a"][k % 4], { rough: 1 });
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.55, 0]} scale={[0.75, 0.7, 1.35]} material={fur} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh position={[0, 2.2, -0.1]} scale={[0.6, 0.55, 0.6]} material={fur} castShadow><sphereGeometry args={[1, 14, 10]} /></mesh>
      <mesh position={[0, 1.95, 0.25]} scale={[0.85, 0.5, 0.9]} material={blanket}><sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      {[[-0.4, -0.85], [0.4, -0.85], [-0.4, 0.85], [0.4, 0.85]].map(([lx, lz], i) => (
        <Cyl key={i} p={[lx, 0.62, lz]} rt={0.11} rb={0.08} h={1.25} m={furDark} seg={6} />
      ))}
      <mesh position={[0, 1.95, 1.45]} rotation={[-0.75, 0, 0]} material={fur} castShadow><cylinderGeometry args={[0.18, 0.26, 1.3, 8]} /></mesh>
      <group ref={head} position={[0, 2.55, 1.95]}>
        <mesh scale={[0.3, 0.3, 0.55]} material={fur} castShadow><sphereGeometry args={[1, 12, 8]} /></mesh>
        {[-0.18, 0.18].map((s) => <mesh key={s} position={[s, 0.25, -0.15]} material={furDark}><coneGeometry args={[0.06, 0.18, 5]} /></mesh>)}
        {[-0.2, 0.2].map((s) => <mesh key={`e${s}`} position={[s, 0.1, 0.15]} material={desertMat("#2a1a10")}><sphereGeometry args={[0.05, 6, 4]} /></mesh>)}
      </group>
      <group ref={tail} position={[0, 1.7, -1.32]}>
        <mesh position={[0, -0.35, 0]} material={furDark}><cylinderGeometry args={[0.03, 0.05, 0.7, 5]} /></mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE BOARDWALK + THE STEPPING STONES over the quicksand moat.
// ---------------------------------------------------------------------------
function Boardwalk({ M }) {
  const d = getLateStructures().decks.find((q) => q.boardwalk);
  if (!d) return null;
  const n = Math.round(d.L / 0.38);
  const yaw = Math.atan2(d.ux, d.uz);
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const t = (i + 0.5) / n;
        return <mesh key={i} position={[d.from[0] + d.ux * d.L * t, d.deckAt(t) - 0.05, d.from[1] + d.uz * d.L * t]} rotation={[0, yaw, 0]} geometry={tiledBox(d.hw * 2 + 0.2, 0.09, 0.34, 1)} material={M.wood} castShadow receiveShadow />;
      })}
      {Array.from({ length: 6 }).map((_, i) => {
        const t = i / 5;
        return [1, -1].map((s) => {
          const x = d.from[0] + d.ux * d.L * t - d.uz * (d.hw + 0.12) * s, z = d.from[1] + d.uz * d.L * t + d.ux * (d.hw + 0.12) * s;
          return <Cyl key={`${i}${s}`} p={[x, d.deckAt(t) + 0.15, z]} rt={0.08} rb={0.1} h={1.9} m="#5e3e22" seg={6} />;
        });
      })}
      {[1, -1].map((s) => (
        <Beam key={`r${s}`} a={[d.from[0] - d.uz * (d.hw + 0.12) * s, d.deckAt(0) + 0.95, d.from[1] + d.ux * (d.hw + 0.12) * s]} b={[d.to[0] - d.uz * (d.hw + 0.12) * s, d.deckAt(1) + 0.95, d.to[1] + d.ux * (d.hw + 0.12) * s]} w={0.06} t={0.06} m={M.rope} cast={false} />
      ))}
    </group>
  );
}
function SteppingStones({ M }) {
  const moat = getQuicksandPits().find((p) => p.id === "moat");
  return (
    <group>
      {STEPPING_STONES.map(([x, z], i) => (
        <mesh key={i} position={[x, moat.level + 0.3 - 0.45, z]} material={M.sandstone} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.95, 0.9, 9]} />
        </mesh>
      ))}
    </group>
  );
}

export default function DesertWonders({ highGfx }) {
  const M = useMats();
  return (
    <group>
      <StaticBatch farDist={160}>
        <DuneShip M={M} />
        <SandSphinx M={M} />
        <Fossil M={M} />
        <DigCamp M={M} />
        <Boardwalk M={M} />
        <SteppingStones M={M} />
      </StaticBatch>
      <Crystals />
      {highGfx && <CrystalSparkles />}
      {CAMELS.map(([x, z, yaw], i) => <Camel key={i} x={x} z={z} yaw={yaw} k={i} />)}
    </group>
  );
}
