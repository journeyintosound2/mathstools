import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  MAGMA_BRIDGES, MAGMA_PLATFORMS, COLUMN_STAIR, LAKE_CAUSEWAY, LAVA_BED,
} from "../../data/magma/magmaLayout.js";
import { getMagmaTextures } from "./magmaMaterials.js";

/**
 * MAGMA BRIDGES + PLATFORMS — every walkable thing over the lava. Deck
 * heights come from the same arch formula as `bridgeDeckAt` (apex·sin πt),
 * and every stone/column/tile from MAGMA_PLATFORMS, so the visuals match
 * what the Player stands on exactly. Five bridge styles: the grand moat
 * bridge, a stone arch, wooden planks on rope, an iron grate on chains and
 * a hexagonal basalt causeway.
 */

function frameOf(b) {
  const ax = b.from[0], az = b.from[1];
  const dx = b.to[0] - ax, dz = b.to[1] - az;
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  return { ax, az, dx, dz, len, ux, uz, nx: -uz, nz: ux };
}
const deckY = (b, t) => b.apex * Math.sin(Math.PI * t);

/** An arched slab following the deck: top (uv'd) + sides + underside. */
function slabGeometry(b, { hw, offset = 0, top = 0.02, thick = 0.45, segs = 28, vScale = 1 }) {
  const f = frameOf(b);
  const pos = [], uv = [], idx = [];
  // 4 corners per sample: top-left, top-right, bottom-right, bottom-left.
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const cx = f.ax + f.dx * t + f.nx * offset, cz = f.az + f.dz * t + f.nz * offset;
    const y = deckY(b, t) + top;
    const L = [cx + f.nx * hw, cz + f.nz * hw], R = [cx - f.nx * hw, cz - f.nz * hw];
    const v = (t * f.len) / (2 * hw) * vScale;
    pos.push(L[0], y, L[1], R[0], y, R[1], R[0], y - thick, R[1], L[0], y - thick, L[1]);
    uv.push(0, v, 1, v, 1, v, 0, v);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 4, c = a + 4;
    // top (TL,TR) — wind so normals face up
    idx.push(a, c, a + 1, a + 1, c, c + 1);
    // right side (TR,BR)
    idx.push(a + 1, c + 1, a + 2, a + 2, c + 1, c + 2);
    // bottom (BR,BL)
    idx.push(a + 2, c + 2, a + 3, a + 3, c + 2, c + 3);
    // left side (BL,TL)
    idx.push(a + 3, c + 3, a, a, c + 3, c);
  }
  // End caps.
  const last = segs * 4;
  idx.push(0, 1, 2, 0, 2, 3, last, last + 2, last + 1, last, last + 3, last + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function along(b, t, side, extraUp = 0) {
  const f = frameOf(b);
  return [f.ax + f.dx * t + f.nx * side, deckY(b, t) + extraUp, f.az + f.dz * t + f.nz * side];
}

/** A rope / chain sagging between post tops. */
function ropeGeometry(b, side, postTs, height, sag, radius) {
  const pts = [];
  for (let i = 0; i < postTs.length - 1; i++) {
    const t0 = postTs[i], t1 = postTs[i + 1];
    for (let k = 0; k < 6; k++) {
      const s = k / 6;
      const t = t0 + (t1 - t0) * s;
      const p = along(b, t, side, height - Math.sin(Math.PI * s) * sag);
      pts.push(new THREE.Vector3(...p));
    }
  }
  pts.push(new THREE.Vector3(...along(b, postTs[postTs.length - 1], side, height)));
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, pts.length * 2, radius, 5, false);
}

function Piers({ b, hw, color = "#2f2523" }) {
  const f = frameOf(b);
  const ts = f.len > 11.5 ? [0.33, 0.67] : [0.5];
  const yaw = Math.atan2(f.ux, f.uz);
  return ts.map((t) => {
    const top = deckY(b, t) - 0.35;
    const h = top - LAVA_BED;
    const p = along(b, t, 0);
    return (
      <mesh key={t} position={[p[0], LAVA_BED + h / 2, p[2]]} rotation={[0, yaw, 0]} castShadow>
        <boxGeometry args={[hw * 2 - 0.2, h, 1.1]} />
        <meshStandardMaterial color={color} flatShading roughness={1} />
      </mesh>
    );
  });
}

export function Brazier({ position, scale = 1, y = 0 }) {
  const flame = useRef();
  useFrame((state) => {
    if (!flame.current) return;
    const t = state.clock.elapsedTime * 1.3 + position[0] * 0.37;
    flame.current.scale.y = 1 + Math.sin(t * 9) * 0.13 + Math.sin(t * 5.7) * 0.08;
    flame.current.rotation.y = t * 0.6;
  });
  return (
    <group position={[position[0], y, position[1]]} scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 1.1, 7]} />
        <meshStandardMaterial color="#2a201e" flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.46, 0.28, 0.3, 8]} />
        <meshStandardMaterial color="#4b3a33" flatShading metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 8]} />
        <meshBasicMaterial color="#ff5a14" toneMapped={false} />
      </mesh>
      <group ref={flame} position={[0, 1.32, 0]}>
        <mesh position={[0, 0.36, 0]}>
          <coneGeometry args={[0.32, 0.85, 7]} />
          <meshBasicMaterial color="#ff6f1a" toneMapped={false} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.18, 0.55, 7]} />
          <meshBasicMaterial color="#ffe08a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Bridge({ b }) {
  const tex = getMagmaTextures();
  const f = frameOf(b);
  const geo = useMemo(() => {
    const hw = b.halfWidth + 0.15;
    const deck = slabGeometry(b, { hw, thick: b.style === "wood" || b.style === "grate" ? 0.22 : 0.55 });
    const walls = (b.style === "grand" || b.style === "stone")
      ? [1, -1].map((s) => slabGeometry(b, { hw: 0.22, offset: s * (b.halfWidth + 0.3), top: b.style === "grand" ? 0.95 : 0.7, thick: b.style === "grand" ? 1.2 : 0.95, vScale: 4 }))
      : [];
    const postTs = [];
    const nPost = Math.max(3, Math.round(f.len / 1.7));
    for (let i = 0; i <= nPost; i++) postTs.push(i / nPost);
    const ropes = (b.style === "wood" || b.style === "grate")
      ? [1, -1].flatMap((s) => [
        ropeGeometry(b, s * (b.halfWidth + 0.25), postTs, 1.05, 0.18, b.style === "grate" ? 0.05 : 0.045),
        ropeGeometry(b, s * (b.halfWidth + 0.25), postTs, 0.6, 0.12, b.style === "grate" ? 0.05 : 0.04),
      ])
      : [];
    return { deck, walls, postTs, ropes };
  }, [b]);
  const deckMap = useMemo(() => {
    const src = b.style === "wood" ? tex.planks : b.style === "grate" ? tex.grate : b.style === "basalt" ? tex.hex : tex.path;
    if (!src) return null;
    const c = src.clone();
    c.needsUpdate = true;
    return c;
  }, [b, tex]);
  const yaw = Math.atan2(f.ux, f.uz);
  const wallColor = b.style === "grand" ? "#4a3b35" : "#5a4a40";
  return (
    <group>
      <mesh geometry={geo.deck} castShadow receiveShadow>
        <meshStandardMaterial map={deckMap} color={b.style === "grate" ? "#9a9590" : "#ffffff"} roughness={b.style === "grate" ? 0.5 : 0.92} metalness={b.style === "grate" ? 0.5 : 0} />
      </mesh>
      {geo.walls.map((w, i) => (
        <mesh key={i} geometry={w} castShadow receiveShadow>
          <meshStandardMaterial color={wallColor} flatShading roughness={0.95} />
        </mesh>
      ))}
      {/* Posts (wood / grate / basalt styles). */}
      {b.style !== "grand" && b.style !== "stone" && [1, -1].flatMap((s) =>
        geo.postTs.map((t) => {
          const p = along(b, t, s * (b.halfWidth + 0.25));
          const basalt = b.style === "basalt";
          return (
            <mesh key={`${s}-${t}`} position={[p[0], p[1] + (basalt ? 0.3 : 0.55), p[2]]} rotation={[0, yaw, 0]} castShadow>
              {basalt
                ? <cylinderGeometry args={[0.32, 0.36, 0.75, 6]} />
                : b.style === "grate"
                  ? <cylinderGeometry args={[0.07, 0.09, 1.2, 6]} />
                  : <boxGeometry args={[0.16, 1.2, 0.16]} />}
              <meshStandardMaterial
                color={basalt ? "#3c3432" : b.style === "grate" ? "#4a4644" : "#6b4428"}
                metalness={b.style === "grate" ? 0.6 : 0}
                roughness={b.style === "grate" ? 0.45 : 0.9}
                flatShading
              />
            </mesh>
          );
        })
      )}
      {geo.ropes.map((r, i) => (
        <mesh key={`r${i}`} geometry={r}>
          <meshStandardMaterial color={b.style === "grate" ? "#5d5856" : "#c8a46a"} metalness={b.style === "grate" ? 0.7 : 0} roughness={0.6} />
        </mesh>
      ))}
      {/* Glowing basalt seams on the hex causeway. */}
      {b.style === "basalt" && [1, -1].map((s) => {
        const p0 = along(b, 0.5, s * (b.halfWidth + 0.02), 0.04);
        return (
          <mesh key={`g${s}`} position={p0} rotation={[0, yaw, 0]}>
            <boxGeometry args={[0.06, 0.03, f.len * 0.9]} />
            <meshBasicMaterial color="#ff6a20" toneMapped={false} />
          </mesh>
        );
      })}
      <Piers b={b} hw={b.halfWidth} color={b.style === "wood" ? "#3a2618" : b.style === "grate" ? "#2b2726" : "#2f2523"} />
    </group>
  );
}

export function MagmaBridges() {
  return (
    <group>
      {MAGMA_BRIDGES.map((b) => <Bridge key={b.id} b={b} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Platforms: hop-stones, the climbable column stair and the lake causeway.
// ---------------------------------------------------------------------------
export function MagmaPlatforms() {
  const tex = getMagmaTextures();
  const stairIds = new Set(COLUMN_STAIR.map((c) => c.id));
  const stones = MAGMA_PLATFORMS.filter((p) => !stairIds.has(p.id));
  const C = LAKE_CAUSEWAY;
  const tiles = [];
  const nT = 5;
  const tl = (C.x1 - C.x2) / nT;
  for (let i = 0; i < nT; i++) tiles.push({ x: C.x1 - tl * (i + 0.5), dark: i % 2 === 1 });
  return (
    <group>
      {stones.map((p) => {
        const h = p.top - LAVA_BED;
        return (
          <group key={p.id} position={[p.c[0], 0, p.c[1]]}>
            <mesh position={[0, LAVA_BED + h / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[p.r * 1.06, p.r * 1.2, h, 6]} />
              <meshStandardMaterial color="#3d3533" flatShading roughness={0.95} />
            </mesh>
            <mesh position={[0, p.top + 0.012, 0]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
              <cylinderGeometry args={[p.r * 1.0, p.r * 1.0, 0.02, 6]} />
              <meshStandardMaterial color="#5c524e" flatShading roughness={0.9} />
            </mesh>
            {/* Lava glow ring where the stone meets the melt. */}
            <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[p.r * 1.12, p.r * 1.5, 6]} />
              <meshBasicMaterial color="#ffb347" toneMapped={false} transparent opacity={0.35} />
            </mesh>
          </group>
        );
      })}
      {COLUMN_STAIR.map((p, i) => (
        <group key={p.id} position={[p.c[0], 0, p.c[1]]}>
          <mesh position={[0, p.top / 2 - 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[p.r * 1.04, p.r * 1.1, p.top + 0.2, 6]} />
            <meshStandardMaterial color={i % 2 ? "#3a3331" : "#443b38"} flatShading roughness={0.95} />
          </mesh>
          <mesh position={[0, p.top + 0.01, 0]}>
            <cylinderGeometry args={[p.r * 0.96, p.r * 0.96, 0.02, 6]} />
            <meshStandardMaterial color="#6a5e58" flatShading roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Lake causeway: checkerboard tiles on dark piers. */}
      {tiles.map((t, i) => (
        <group key={`ct${i}`} position={[t.x, 0, C.z]}>
          <mesh position={[0, C.top - 0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[tl - 0.06, 0.18, C.halfW * 2]} />
            <meshStandardMaterial color={t.dark ? "#7a2a22" : "#e9dcc4"} roughness={0.7} />
          </mesh>
          <mesh position={[0, (C.top - 0.18 + LAVA_BED) / 2, 0]}>
            <boxGeometry args={[tl * 0.55, C.top - 0.18 - LAVA_BED, C.halfW * 1.5]} />
            <meshStandardMaterial color="#2a2120" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
