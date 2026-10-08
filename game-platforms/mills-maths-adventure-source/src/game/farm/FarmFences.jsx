import React, { useMemo } from "react";
import * as THREE from "three";

import {
  BOUNDARY_FENCE, FARM_PADDOCKS, FARM_FENCE_LINES, ROUNDUP_PEN, FARM_FENCE_RAIL_TOP,
} from "../../data/farm/farmLayout.js";
import { terrainHeight } from "../../data/farm/farmTerrain.js";
import { paddockGate } from "../../data/farm/farmColliders.js";
import { buildFencePost, buildRail, buildPicket, buildStoneWall } from "./farmGeometry.js";
import { makeFoliageMaterial } from "../jungle/jungleMaterials.js";
import { getFarmTextures, flatMat } from "./farmMaterials.js";
import InstancedChunks from "../jungle/InstancedChunks.jsx";
import StaticBatch from "../jungle/StaticBatch.jsx";

/**
 * FARM FENCES — every fence follows the rolling ground: the white PICKET
 * boundary round the whole property, the post-and-rail paddocks (pig pen,
 * veggie garden, cattle + dairy paddocks, the sorting pen, the race, the
 * sheep yards), the chook run's wire, and the Sheep Downs' dry-stone walls.
 * Posts stand at the terrain; rails run post-top to post-top (tilting with
 * the slope). Open gates swing back at every gate gap. All instanced.
 */
const RAIL_HEIGHTS = [0.42, FARM_FENCE_RAIL_TOP - 0.08];
const yawOf = (dx, dz) => Math.atan2(-dz, dx);
const tint = (it, c) => c.setRGB(0.9 + 0.15 * it.tint, 0.9 + 0.13 * it.tint, 0.9 + 0.1 * it.tint);

/** Split segment a→b into the solid stretches between its gaps. */
function solidSpans(a, b, gaps) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  const cuts = [];
  for (const g of gaps) {
    const t = (g.x - a[0]) * ux + (g.z - a[1]) * uz;
    const off = Math.abs(-(g.x - a[0]) * uz + (g.z - a[1]) * ux);
    if (off < 0.5 && t > -g.halfWidth && t < L + g.halfWidth) cuts.push([t - g.halfWidth + 0.4, t + g.halfWidth - 0.4]);
  }
  cuts.sort((p, q) => p[0] - q[0]);
  const spans = [];
  let s = 0;
  for (const [c0, c1] of cuts) {
    if (c0 > s + 0.3) spans.push([s, Math.min(L, c0)]);
    s = Math.max(s, c1);
  }
  if (s < L - 0.3) spans.push([s, L]);
  return { spans, L, ux, uz };
}

function buildFenceData() {
  const posts = [], rails = [], pickets = [], wposts = [], wires = [], walls = [], gates = [];
  const R = (seed) => { const v = Math.sin(seed * 91.7 + 13.1) * 43758.5; return v - Math.floor(v); };
  let n = 0;
  const addRailRun = (a, b, gaps = [], style = "rail") => {
    const { spans, ux, uz } = solidSpans(a, b, gaps);
    const yaw = yawOf(ux, uz);
    for (const [s0, s1] of spans) {
      const len = s1 - s0;
      const k = Math.max(1, Math.ceil(len / (style === "wire" ? 2.2 : 2.5)));
      let prev = null;
      for (let i = 0; i <= k; i++) {
        const s = s0 + (len * i) / k;
        const x = a[0] + ux * s, z = a[1] + uz * s;
        const y = terrainHeight(x, z);
        const p = { x, y: y - 0.08, z, s: 1, rot: yaw + (R(n++) - 0.5) * 0.08, tint: R(n++) };
        (style === "wire" ? wposts : posts).push(p);
        if (prev) {
          const heights = style === "wire" ? [0.12, 0.45, 0.78] : RAIL_HEIGHTS;
          for (const hh of heights) {
            const y0 = prev.y + 0.08 + hh, y1 = y + hh;
            const dl = Math.hypot(x - prev.x, z - prev.z);
            (style === "wire" ? wires : rails).push({
              x: (x + prev.x) / 2, y: (y0 + y1) / 2, z: (z + prev.z) / 2, s: 1,
              sx: Math.hypot(dl, y1 - y0) + (style === "wire" ? 0 : 0.12), sy: style === "wire" ? 0.12 : 1, sz: style === "wire" ? 0.25 : 1,
              rot: yaw, rz: Math.atan2(y1 - y0, dl), tint: R(n++),
            });
          }
        }
        prev = { x, y: y - 0.08, z };
      }
    }
  };
  // Paddocks + the sorting pen (gates open).
  for (const p of [...FARM_PADDOCKS, ROUNDUP_PEN]) {
    const hw = p.w / 2, hd = p.d / 2;
    const corners = [[p.x - hw, p.z - hd], [p.x + hw, p.z - hd], [p.x + hw, p.z + hd], [p.x - hw, p.z + hd]];
    const gs = [paddockGate(p, p.gate), paddockGate(p, p.gate2)].filter(Boolean);
    for (let i = 0; i < 4; i++) addRailRun(corners[i], corners[(i + 1) % 4], gs, p.style || "rail");
    if (p.style !== "wire") {
      for (const g of gs) {
        // The gate leaf: hinged at one side of the gap, swung back ~100°.
        const horiz = g.side === "north" || g.side === "south";
        const w = g.halfWidth * 2 - 0.8;
        const hx = horiz ? g.x - w / 2 : g.x, hz = horiz ? g.z : g.z - w / 2;
        const open = (g.side === "south" || g.side === "west" ? 1 : -1) * 1.75;
        gates.push({ x: hx, z: hz, y: terrainHeight(hx, hz), w, yaw: (horiz ? 0 : -Math.PI / 2) + open });
      }
    }
  }
  // Open fence lines.
  for (const l of FARM_FENCE_LINES) {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1];
      if (l.style === "stone") {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const k = Math.max(1, Math.round(L));
        const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
        for (let j = 0; j < k; j++) {
          const s0 = (L * j) / k, s1 = (L * (j + 1)) / k;
          const x0 = a[0] + ux * s0, z0 = a[1] + uz * s0, x1 = a[0] + ux * s1, z1 = a[1] + uz * s1;
          const y0 = terrainHeight(x0, z0), y1 = terrainHeight(x1, z1);
          walls.push({ x: (x0 + x1) / 2, y: Math.min(y0, y1) + Math.abs(y1 - y0) / 2 - 0.08, z: (z0 + z1) / 2, s: 1, sx: (s1 - s0) * 1.04, rot: yawOf(ux, uz), rz: Math.atan2(y1 - y0, s1 - s0), tint: R(n++) });
        }
      } else if (l.style === "picket") {
        addPickets(a, b, pickets, posts, rails, R, () => n++);
      } else {
        addRailRun(a, b, [], l.style);
      }
    }
  }
  // The property boundary: white pickets all the way round.
  const { halfW: W, halfD: D } = BOUNDARY_FENCE;
  const ring = [[-W, -D], [W, -D], [W, D], [-W, D]];
  const bposts = [], brails = [];
  for (let i = 0; i < 4; i++) addPickets(ring[i], ring[(i + 1) % 4], pickets, bposts, brails, R, () => n++);
  return { posts: [...posts], rails, pickets, wposts, wires, walls, gates, bposts, brails };
}

function addPickets(a, b, pickets, posts, rails, R, inc) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  const yaw = yawOf(ux, uz);
  const np = Math.round(L / 0.2);
  for (let i = 0; i <= np; i++) {
    const s = (L * i) / np;
    const x = a[0] + ux * s, z = a[1] + uz * s;
    pickets.push({ x, y: terrainHeight(x, z) - 0.06, z, s: 1, sy: 0.96 + R(inc()) * 0.08, rot: yaw, tint: R(inc()) });
  }
  const k = Math.max(1, Math.ceil(L / 2.4));
  let prev = null;
  for (let i = 0; i <= k; i++) {
    const s = (L * i) / k;
    const x = a[0] + ux * s, z = a[1] + uz * s;
    const y = terrainHeight(x, z);
    posts.push({ x, y: y - 0.1, z, s: 1, sy: 0.95, rot: yaw, tint: R(inc()), white: true });
    if (prev) {
      for (const hh of [0.26, 0.68]) {
        const y0 = prev.y + hh, y1 = y + hh;
        const dl = Math.hypot(x - prev.x, z - prev.z);
        rails.push({ x: (x + prev.x) / 2, y: (y0 + y1) / 2, z: (z + prev.z) / 2 - uz * 0, s: 1, sx: Math.hypot(dl, y1 - y0), sy: 0.8, sz: 1, rot: yaw, rz: Math.atan2(y1 - y0, dl), tint: R(inc()) });
      }
    }
    prev = { x, y, z };
  }
}

/** A five-bar timber farm gate, hinged at its local origin, opening along +x. */
function FarmGate({ g }) {
  const wood = flatMat("#8f7a62", { roughness: 0.9 });
  const bars = [0.25, 0.48, 0.71, 0.94, 1.12];
  return (
    <group position={[g.x, g.y, g.z]} rotation={[0, g.yaw, 0]}>
      <mesh position={[0, 0.6, 0]} material={flatMat("#6b5a46")} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
      </mesh>
      {bars.map((y) => (
        <mesh key={y} position={[g.w / 2, y, 0]} material={wood} castShadow>
          <boxGeometry args={[g.w, 0.09, 0.05]} />
        </mesh>
      ))}
      <mesh position={[g.w / 2, 0.68, 0]} rotation={[0, 0, Math.atan2(0.85, g.w)]} material={wood}>
        <boxGeometry args={[Math.hypot(g.w, 0.85), 0.08, 0.05]} />
      </mesh>
      <mesh position={[g.w - 0.05, 0.68, 0]} material={wood}>
        <boxGeometry args={[0.1, 1.0, 0.06]} />
      </mesh>
    </group>
  );
}

export default function FarmFences({ highGfx }) {
  const F = useMemo(buildFenceData, []);
  const tex = getFarmTextures();
  const mats = useMemo(() => ({
    wood: makeFoliageMaterial({ sway: 0, key: "farm-fence", roughness: 0.92 }),
    white: makeFoliageMaterial({ sway: 0, key: "farm-picket", roughness: 0.6, side: THREE.DoubleSide }),
    wire: new THREE.MeshStandardMaterial({ color: "#c8ccd0", metalness: 0.5, roughness: 0.5, alphaMap: tex.wire, alphaTest: 0.4, side: THREE.DoubleSide, transparent: false }),
    stone: new THREE.MeshStandardMaterial({ vertexColors: true, map: tex.drystone, roughness: 0.95 }),
  }), [tex]);
  const geos = useMemo(() => {
    const wireG = new THREE.PlaneGeometry(1, 1);
    // The mesh panel spans the bay (its sx is the bay length) and 0.9 m tall.
    wireG.scale(1, 7.5, 1);
    wireG.translate(0, 0, 0);
    return { post: buildFencePost(), rail: buildRail(), picket: buildPicket(), wall: buildStoneWall(3), wire: wireG };
  }, []);
  const whitePosts = useMemo(() => F.bposts.concat(F.posts.filter((p) => p.white)), [F]);
  const woodPosts = useMemo(() => F.posts.filter((p) => !p.white), [F]);
  const whiteRails = useMemo(() => F.brails.concat(F.rails.filter((r) => r.sy === 0.8)), [F]);
  const woodRails = useMemo(() => F.rails.filter((r) => r.sy !== 0.8), [F]);
  const whiteTint = (it, c) => c.setRGB(1.35, 1.35, 1.32);
  const near = highGfx ? 130 : 90;
  return (
    <group>
      <InstancedChunks items={woodPosts} geometry={geos.post} material={mats.wood} tile={64} maxDist={near + 40} tintFn={tint} castShadow={highGfx} />
      <InstancedChunks items={woodRails} geometry={geos.rail} material={mats.wood} tile={64} maxDist={near + 40} tintFn={tint} castShadow={highGfx} />
      <InstancedChunks items={F.wposts} geometry={geos.post} material={mats.wood} tile={64} maxDist={near} tintFn={tint} />
      <InstancedChunks items={F.wires.filter((w, i) => i % 3 === 1).map((w) => ({ ...w, y: w.y - 0.02, sy: 0.12, sz: 1 }))} geometry={geos.wire} material={mats.wire} tile={64} maxDist={near - 30} />
      <InstancedChunks items={F.pickets} geometry={geos.picket} material={mats.white} tile={48} maxDist={near} tintFn={whiteTint} />
      <InstancedChunks items={whitePosts} geometry={geos.post} material={mats.white} tile={64} maxDist={near + 60} tintFn={whiteTint} />
      <InstancedChunks items={whiteRails} geometry={geos.rail} material={mats.white} tile={64} maxDist={near + 60} tintFn={whiteTint} />
      <InstancedChunks items={F.walls} geometry={geos.wall} material={mats.stone} tile={64} castShadow={highGfx} />
      <StaticBatch>
        {F.gates.map((g, i) => <FarmGate key={i} g={g} />)}
      </StaticBatch>
    </group>
  );
}
