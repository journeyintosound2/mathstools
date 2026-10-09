import React, { useMemo } from "react";
import * as THREE from "three";

import { smoothstep, fbm, vnoise, clamp } from "../../data/terrainKit.js";
import { inPoly, polySD, rectCorners } from "../../data/schoolyard/schoolyardGeom.js";
import {
  GRID, getSchoolGrid, terrainHeight, rawHeight, coastZ, slopeAt, nearestSchoolPath, SCHOOL_PATHS, schoolSolidTopAt,
  inSchoolBuilding,
} from "../../data/schoolyard/schoolyardTerrain.js";
import {
  LV, SEA_Y, SCHOOL_FENCE, SCHOOL_PLATFORMS, SCHOOL_SURFACES, OVAL, QUAD_FIGS, COURT_BEDS, COURT_POND, COLA, FRONT_CARPARK,
  STAFF_CARPARK, BUS_BAY, BACKDROP, SCHOOL_PADS,
} from "../../data/schoolyard/schoolyardLayout.js";
import { Kit, drapePolygon } from "./schoolKit.js";
import { M, makeSchoolTerrainMaterial, makeSchoolSeaMaterial, getSchoolTextures, schoolMat } from "./schoolMaterials.js";

/**
 * THE SCHOOL'S GROUND — the terrain (the same 1 m grid the Player reads),
 * the land beyond the fence out to the beach + Beacon Hill (a coarse ring),
 * the SEA, the three built TERRACES (asphalt quad, paved courtyard, the upper
 * lawn) with their brick retaining walls, every paved SURFACE + its line
 * markings (car parks, the bus bay, the courts, handball squares), the brick
 * planters, the courtyard pond and the track ribbons.
 */
const C = (h) => new THREE.Color(h);
const COL = {
  lawn: C("#5fa63f"), lawnLight: C("#7dbd52"), lush: C("#4a8e34"), dry: C("#a2b25f"), litter: C("#7d6b45"),
  bush: C("#5b7a3a"), earth: C("#8e7150"), sand: C("#ecd9a6"), sandWet: C("#c9b17c"), seabed: C("#d6c290"),
  seabedDeep: C("#6fa6a2"), garden: C("#4f8a3a"), verge: C("#86b35a"), forest: C("#3c6a30"), clay: C("#9a7550"),
};
const tmp = new THREE.Color();
const t2 = new THREE.Color();
const FRONT = SCHOOL_PADS.find((p) => p.id === "front");

/** What the ground looks like at (x, z): { col, mix:[sand, litter, mown, wet] }. */
export function schoolGroundColour(x, z, h) {
  const n1 = fbm(x / 32, z / 32, 2, 81);
  const n2 = vnoise(x / 5, z / 5, 82);
  let sand = 0, litter = 0, mown = 0, wet = 0;
  tmp.copy(COL.lush).lerp(COL.lawn, smoothstep(0.3, 0.62, n1));
  tmp.lerp(COL.dry, smoothstep(0.62, 0.85, n1) * 0.35);
  const inside = x > SCHOOL_FENCE.xMin - 2 && x < SCHOOL_FENCE.xMax + 2 && z > SCHOOL_FENCE.zMin - 2 && z < SCHOOL_FENCE.zMax + 2;
  if (inside) {
    // The oval: mown stripes, a touch worn at the cricket pitch end.
    const q = Math.hypot((x - OVAL.c[0]) / OVAL.rx, (z - OVAL.c[1]) / OVAL.rz);
    if (q < 1.06) {
      const stripe = 0.5 + 0.5 * Math.cos(((x - OVAL.c[0]) / 4.5) * Math.PI);
      t2.copy(COL.lawn).lerp(COL.lawnLight, stripe * 0.75);
      tmp.lerp(t2, 1 - smoothstep(0.98, 1.06, q));
      mown = 1 - smoothstep(0.98, 1.06, q);
      // The boundary rope line (a pale worn ring).
      tmp.lerp(COL.dry, (1 - smoothstep(0.004, 0.02, Math.abs(q - 1.0))) * 0.6);
    }
    // The front lawns: mown in wide stripes.
    const fq = Math.hypot((x - FRONT.c[0]) / FRONT.rx, (z - FRONT.c[1]) / FRONT.rz);
    if (fq < 1.05 && q >= 1.06) {
      const stripe = 0.5 + 0.5 * Math.cos(((z - 90) / 3.6) * Math.PI);
      t2.copy(COL.lawn).lerp(COL.lawnLight, stripe * 0.55);
      tmp.lerp(t2, 0.85);
      mown = Math.max(mown, 0.85);
    }
    // The bush hill behind the school: leaf litter + dry grass under gums.
    const hill = smoothstep(-96, -106, z);
    // The west lawn's bush garden.
    const west = smoothstep(-74, -84, x) * smoothstep(48, 38, z) * smoothstep(-90, -80, z);
    const lit = Math.max(hill, west * 0.75) * (0.7 + 0.3 * n2);
    if (lit > 0) {
      t2.copy(COL.bush).lerp(COL.litter, smoothstep(0.35, 0.7, n1));
      tmp.lerp(t2, lit);
      litter = lit * 0.9;
    }
    // Track verges: worn earth.
    const np = nearestSchoolPath(x, z);
    if (np && np.e < 1.2) tmp.lerp(COL.earth, (1 - smoothstep(-0.6, 1.2, np.e)) * 0.4);
  } else {
    // Outside the fence: nature strips + gardens down the hill to the beach,
    // the bush on Beacon Hill + the hinterland.
    tmp.lerp(COL.verge, 0.35 + 0.25 * n2);
    tmp.lerp(COL.garden, smoothstep(0.55, 0.8, vnoise(x / 9, z / 9, 83)) * 0.5);
    const forest = Math.max(smoothstep(-150, -175, z), smoothstep(-158, -190, x) * (1 - smoothstep(260, 300, z)));
    if (forest > 0) {
      tmp.lerp(COL.forest, forest * 0.85);
      litter = forest * 0.5;
    }
    // The beach: soft dry sand → wet sand at the waterline → the seabed.
    const off = z - coastZ(x);
    if (off > -24) {
      const k = smoothstep(-24, -14, off);
      t2.copy(COL.sand).lerp(COL.sandWet, smoothstep(-3, 2, off));
      tmp.lerp(t2, k);
      sand = k;
      wet = smoothstep(-4, 1, off) * k;
      if (h < SEA_Y) {
        t2.copy(COL.seabed).lerp(COL.seabedDeep, clamp((SEA_Y - h) / 6, 0, 1));
        tmp.lerp(t2, 0.9);
        sand = 1; wet = 0.5;
      }
    }
  }
  // Steep banks: the shader turns them to sandstone; tint their foot clay.
  const sl = slopeAt(x, z);
  if (sl > 0.55) tmp.lerp(COL.clay, smoothstep(0.55, 1.0, sl) * 0.3);
  return { col: tmp, mix: [sand, litter, mown, wet] };
}

// ---------------------------------------------------------------------------
// TERRAIN (the walkable grid) — tiled for culling.
// ---------------------------------------------------------------------------
const CHUNK = 64;
function buildChunks() {
  const { h } = getSchoolGrid();
  const { nx, nz } = GRID;
  const col = new Float32Array(nx * nz * 3);
  const mix = new Float32Array(nx * nz * 4);
  const nor = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      const c = schoolGroundColour(x, z, h[k]);
      col[k * 3] = c.col.r; col[k * 3 + 1] = c.col.g; col[k * 3 + 2] = c.col.b;
      mix.set(c.mix, k * 4);
      const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
      const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
      const L = Math.hypot(hx, 2 * GRID.step, hz);
      nor[k * 3] = -hx / L; nor[k * 3 + 1] = (2 * GRID.step) / L; nor[k * 3 + 2] = -hz / L;
    }
  }
  const chunks = [];
  for (let cj = 0; cj < nz - 1; cj += CHUNK) {
    for (let ci = 0; ci < nx - 1; ci += CHUNK) {
      const i1 = Math.min(nx - 1, ci + CHUNK), j1 = Math.min(nz - 1, cj + CHUNK);
      const w = i1 - ci + 1, d = j1 - cj + 1;
      const pos = new Float32Array(w * d * 3), c3 = new Float32Array(w * d * 3), n3 = new Float32Array(w * d * 3), m4 = new Float32Array(w * d * 4);
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
        const gi = ci + i, gj = cj + j, k = gj * nx + gi, o = (j * w + i) * 3, o4 = (j * w + i) * 4;
        pos[o] = GRID.xMin + gi * GRID.step; pos[o + 1] = h[k]; pos[o + 2] = GRID.zMin + gj * GRID.step;
        c3[o] = col[k * 3]; c3[o + 1] = col[k * 3 + 1]; c3[o + 2] = col[k * 3 + 2];
        n3[o] = nor[k * 3]; n3[o + 1] = nor[k * 3 + 1]; n3[o + 2] = nor[k * 3 + 2];
        m4[o4] = mix[k * 4]; m4[o4 + 1] = mix[k * 4 + 1]; m4[o4 + 2] = mix[k * 4 + 2]; m4[o4 + 3] = mix[k * 4 + 3];
      }
      const idx = [];
      for (let j = 0; j < d - 1; j++) for (let i = 0; i < w - 1; i++) {
        const a = j * w + i, b = a + 1, c = a + w, e = c + 1;
        idx.push(a, c, b, b, c, e); // the same split as terrainHeight()
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(n3, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(c3, 3));
      geo.setAttribute("aMix", new THREE.BufferAttribute(m4, 4));
      geo.setIndex(idx);
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      chunks.push(geo);
    }
  }
  return chunks;
}

let _terrainMat = null;
export function schoolTerrainMaterial() {
  if (!_terrainMat) _terrainMat = makeSchoolTerrainMaterial();
  return _terrainMat;
}

export function SchoolTerrain({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = schoolTerrainMaterial();
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// FAR LAND — the town on the slope down to Jetty Beach, Beacon Hill, the
// hinterland: a coarse grid ringing the walkable one (sunk a little where it
// tucks under the grid's edge so it never shows through).
// ---------------------------------------------------------------------------
const FAR = { xMin: -760, xMax: 760, zMin: -720, zMax: 900, step: 8 };
function buildFar() {
  const nx = Math.round((FAR.xMax - FAR.xMin) / FAR.step) + 1;
  const nz = Math.round((FAR.zMax - FAR.zMin) / FAR.step) + 1;
  const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), mix = new Float32Array(nx * nz * 4);
  const inGrid = (x, z, m) => x > GRID.xMin + m && x < GRID.xMax - m && z > GRID.zMin + m && z < GRID.zMax - m;
  for (let j = 0; j < nz; j++) {
    const z = FAR.zMin + j * FAR.step;
    for (let i = 0; i < nx; i++) {
      const x = FAR.xMin + i * FAR.step;
      const k = j * nx + i;
      let h = rawHeight(x, z);
      if (inGrid(x, z, -2)) h -= 0.45;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      // Deep water: nothing to see (the sea is opaque), skip the lookups.
      const c = h < SEA_Y - 8 ? { col: COL.seabedDeep, mix: [1, 0, 0, 0.5] } : schoolGroundColour(x, z, h);
      col[k * 3] = c.col.r; col[k * 3 + 1] = c.col.g; col[k * 3 + 2] = c.col.b;
      mix.set(c.mix, k * 4);
    }
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const x0 = FAR.xMin + i * FAR.step, z0 = FAR.zMin + j * FAR.step;
    // Skip quads wholly inside the walkable grid (kept 16 m in from its edge).
    if (inGrid(x0, z0, 16) && inGrid(x0 + FAR.step, z0 + FAR.step, 16)) continue;
    // Skip deep sea floor (never seen).
    const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1;
    if (Math.max(pos[a * 3 + 1], pos[b * 3 + 1], pos[c * 3 + 1], pos[e * 3 + 1]) < SEA_Y - 6) continue;
    idx.push(a, c, b, b, c, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aMix", new THREE.BufferAttribute(mix, 4));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
export function FarLand() {
  const geo = useMemo(buildFar, []);
  return <mesh geometry={geo} material={schoolTerrainMaterial()} receiveShadow />;
}

export function SchoolSea() {
  const mat = useMemo(() => makeSchoolSeaMaterial(SEA_Y, BACKDROP.beachZ), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, 820]} material={mat}>
      <planeGeometry args={[3200, 1400, 1, 1]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// THE TERRACES + SURFACES + PLANTERS (one Kit, merged per material)
// ---------------------------------------------------------------------------
function edgesOf(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz) || 1;
    let n = [dz / L, -dx / L];
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (inPoly(pts, mx + n[0] * 0.3, mz + n[1] * 0.3)) n = [-n[0], -n[1]];
    out.push({ a, b, n, L });
  }
  return out;
}
/** The ground just outside a terrace edge (terrain or any lower solid). */
function groundOut(x, z) {
  const t = terrainHeight(x, z);
  const s = schoolSolidTopAt(x, z);
  return s !== null && s > t ? s : t;
}

const SURF_KEY = { pavers: "pavers", asphalt: "asphalt", concrete: "slab", soil: "soil", court: "court" };

function buildTerraces() {
  const kit = new Kit();
  const grass = new Kit();
  // Terrace tops + their retaining walls.
  for (const p of SCHOOL_PLATFORMS) {
    if (p.surface === "grass") drapePolygon(grass, "grass", p.pts, () => p.y, { lift: 0, maxEdge: 3 });
    else drapePolygon(kit, p.surface === "pavers" ? "pavers" : "asphalt", p.pts, () => p.y, { lift: 0, maxEdge: 12 });
    for (const e of edgesOf(p.pts)) {
      const n = Math.max(1, Math.round(e.L / 2));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const A = [e.a[0] + (e.b[0] - e.a[0]) * t0, e.a[1] + (e.b[1] - e.a[1]) * t0];
        const B = [e.a[0] + (e.b[0] - e.a[0]) * t1, e.a[1] + (e.b[1] - e.a[1]) * t1];
        const mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2;
        if (inSchoolBuilding(mx + e.n[0] * 0.5, mz + e.n[1] * 0.5, 0.05)) continue;
        let g = Infinity;
        for (const [sx, sz] of [A, B, [mx, mz]]) g = Math.min(g, groundOut(sx + e.n[0] * 0.45, sz + e.n[1] * 0.45));
        const drop = p.y - g;
        const y0 = (drop > 0.1 ? g : p.y) - 0.6;
        kit.wall("brick", [A[0] - e.n[0] * 0.17, A[1] - e.n[1] * 0.17], [B[0] - e.n[0] * 0.17, B[1] - e.n[1] * 0.17], y0, p.y + 0.02, 0.34, {
          topKey: "slab", extend: 0.01,
        });
      }
    }
  }
  // Paved surfaces (on the lawns + the terraces).
  for (const s of SCHOOL_SURFACES) {
    const heightAt = s.y > 0 ? () => s.y : (x, z) => Math.max(terrainHeight(x, z), 0);
    if (s.kind === "court") {
      const [a, b, c, d] = s.pts;
      kit.quad("court", [d[0], s.y + 0.03, d[1]], [c[0], s.y + 0.03, c[1]], [b[0], s.y + 0.03, b[1]], [a[0], s.y + 0.03, a[1]], { uv: [[0, 1], [1, 1], [1, 0], [0, 0]] });
      continue;
    }
    drapePolygon(kit, SURF_KEY[s.kind] || "slab", s.pts, heightAt, { lift: 0.025, maxEdge: s.y > 0 ? 12 : 2.5 });
  }
  paintLines(kit);
  // Brick planters: the quad's three fig planters + the courtyard beds.
  const planter = (r, level) => {
    const top = level + 0.55;
    const cs = rectCorners(r);
    for (let i = 0; i < 4; i++) {
      const a = cs[i], b = cs[(i + 1) % 4];
      // Inset the kerb line by half its thickness.
      const mx = (a[0] + b[0]) / 2 - r.c[0], mz = (a[1] + b[1]) / 2 - r.c[1];
      const L = Math.hypot(mx, mz) || 1;
      const ix = (-mx / L) * 0.16, iz = (-mz / L) * 0.16;
      kit.wall("brick", [a[0] + ix, a[1] + iz], [b[0] + ix, b[1] + iz], level - 0.1, top, 0.32, { topKey: "slab", extend: 0.16 });
    }
    drapePolygon(kit, "mulch", rectCorners({ ...r, hx: r.hx - 0.3, hz: r.hz - 0.3 }), () => top - 0.04, { lift: 0, maxEdge: 20 });
  };
  for (const f of QUAD_FIGS) planter({ c: f.c, yaw: f.planter.yaw, hx: f.planter.hx, hz: f.planter.hz }, LV.L1);
  for (const bd of COURT_BEDS) planter(bd, LV.L2);
  // The courtyard pond: a sandstone rim round a little pool + bubbler.
  {
    const { c, r } = COURT_POND;
    const y = LV.L2;
    const seg = 28;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      kit.wall("boardConcrete", [c[0] + Math.cos(a0) * (r - 0.2), c[1] + Math.sin(a0) * (r - 0.2)], [c[0] + Math.cos(a1) * (r - 0.2), c[1] + Math.sin(a1) * (r - 0.2)], y - 0.1, y + 0.42, 0.42, { color: "#d9c79c", extend: 0.06 });
    }
    kit.post("boardConcrete", c[0], c[1], y, y + 0.9, 0.32, 10, { color: "#d9c79c" });
    kit.disc("water", [c[0], y + 0.3, c[1]], [0, 1, 0], r - 0.4, 28, { color: "#ffffff" });
    kit.disc("soil", [c[0], y + 0.02, c[1]], [0, 1, 0], r - 0.4, 28, { color: "#3a4a3a" });
  }
  const built = kit.build();
  const grassBuilt = grass.build().map(({ geometry }) => {
    const pos = geometry.attributes.position;
    const col = new Float32Array(pos.count * 3), mix = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const c = schoolGroundColour(x, z, pos.getY(i));
      col[i * 3] = c.col.r * 1.02; col[i * 3 + 1] = c.col.g * 1.04; col[i * 3 + 2] = c.col.b;
      mix[i * 4 + 2] = 0.6;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geometry.setAttribute("aMix", new THREE.BufferAttribute(mix, 4));
    return geometry;
  });
  return { built, grass: grassBuilt };
}

/** Line markings: car-park bays, the bus zone, handball squares on the COLA slab. */
function paintLines(kit) {
  const line = (key, x0, z0, x1, z1, y, w = 0.12) => {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1;
    const nx = (-dz / L) * w / 2, nz = (dx / L) * w / 2;
    kit.quad(key, [x0 - nx, y, z0 - nz], [x0 + nx, y, z0 + nz], [x1 + nx, y, z1 + nz], [x1 - nx, y, z1 - nz], { uv: "unit" });
  };
  const LY = 0.05;
  // Front car park: four rows of bays (cars park nose-in along z).
  {
    const { c, hx } = FRONT_CARPARK;
    for (const rz of [-20, -9, 9, 20]) {
      for (let x = c[0] - hx + 2 - 1.45; x <= c[0] + hx - 0.5; x += 2.9) line("yellowLine", x, c[1] + rz - 2.5, x, c[1] + rz + 2.5, LY);
    }
  }
  // Staff car park.
  {
    const { c, hx } = STAFF_CARPARK;
    for (let x = c[0] - hx + 2 - 1.45; x <= c[0] + hx - 0.5; x += 2.9) line("yellowLine", x, c[1] - 5.7, x, c[1] - 0.7, LV.L3 + LY);
  }
  // The forecourt: drop-off bays along both sides.
  for (let x = -6.5; x <= 24.5; x += 2.8) {
    line("whiteLine", x, 62.2, x, 67, LY);
    line("whiteLine", x, 83, x, 87.8, LY);
  }
  // The bus zone: a yellow box with BUS ZONE hatching.
  {
    const { c, hx, hz } = BUS_BAY;
    const x0 = c[0] - hx + 0.4, x1 = c[0] + hx - 0.4, z0 = c[1] - hz + 0.4, z1 = c[1] + hz - 0.4;
    line("yellowLine", x0, z0, x1, z0, LY, 0.18); line("yellowLine", x0, z1, x1, z1, LY, 0.18);
    line("yellowLine", x0, z0, x0, z1, LY, 0.18); line("yellowLine", x1, z0, x1, z1, LY, 0.18);
    for (let x = x0 + 1; x < x0 + 6; x += 1.2) line("yellowLine", x, z0, x + 2.2, z1, LY, 0.14);
  }
  // Handball squares on the COLA slab (2 × 2 courts, each four squares).
  {
    const y = LV.L1 + LY;
    for (const [cx, cz] of [[COLA.c[0] - 9, COLA.c[1] - 8], [COLA.c[0] + 9, COLA.c[1] - 8], [COLA.c[0] - 9, COLA.c[1] + 8], [COLA.c[0] + 9, COLA.c[1] + 8]]) {
      const s = 3.2;
      const key = (cx + cz) % 2 ? "yellowLine" : "whiteLine";
      line(key, cx - s, cz - s, cx + s, cz - s, y); line(key, cx - s, cz + s, cx + s, cz + s, y);
      line(key, cx - s, cz - s, cx - s, cz + s, y); line(key, cx + s, cz - s, cx + s, cz + s, y);
      line(key, cx, cz - s, cx, cz + s, y); line(key, cx - s, cz, cx + s, cz, y);
    }
  }
}

const KEY_MAT = () => {
  const m = M();
  return {
    brick: m.brick, slab: m.slab, asphalt: m.asphalt, pavers: m.pavers, soil: m.soil, mulch: m.mulch, boardConcrete: m.boardConcrete, water: m.water,
    court: schoolMat("courtUnit", { map: "court", roughness: 0.8 }),
    yellowLine: schoolMat("yellowLine", { color: "#f2c21b", roughness: 0.6, polygonOffset: 3 }),
    whiteLine: schoolMat("whiteLine", { color: "#f4f4ef", roughness: 0.6, polygonOffset: 3 }),
  };
};

export function SchoolTerraces() {
  const { built, grass } = useMemo(buildTerraces, []);
  const mats = useMemo(KEY_MAT, []);
  const tmat = schoolTerrainMaterial();
  return (
    <group>
      {built.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={mats[key] || M().paint} receiveShadow castShadow={key === "brick" || key === "boardConcrete"} />
      ))}
      {grass.map((g, i) => <mesh key={`g${i}`} geometry={g} material={tmat} receiveShadow />)}
    </group>
  );
}

// ---------------------------------------------------------------------------
// TRACK RIBBONS — the bush track (dirt), the west path + oval loop (gravel),
// the laneway (pavers), draped over the graded ground.
// ---------------------------------------------------------------------------
function resample(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function buildRibbons(kind) {
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  SCHOOL_PATHS.forEach((p, pi) => {
    if (p.kind !== kind) return;
    const lift = 0.04 + pi * 0.003;
    const pts = resample(p.pts, 0.8);
    const half = p.hw + (kind === "pavers" ? 0.05 : 0.4);
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
      const ok = ACROSS.every((s) => schoolSolidTopAt(x + nx * half * s, z + nz * half * s) === null);
      if (!ok) { base = -1; continue; }
      const vi = pos.length / 3;
      ACROSS.forEach((s) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        pos.push(px, terrainHeight(px, pz) + lift, pz);
        uv.push(s * half, v);
      });
      if (base >= 0) for (let k = 0; k < 4; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
      base = vi;
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
export function SchoolTracks() {
  const geos = useMemo(() => ({ dirt: buildRibbons("dirt"), gravel: buildRibbons("gravel"), pavers: buildRibbons("pavers") }), []);
  const tex = getSchoolTextures();
  const common = { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  return (
    <group>
      <mesh geometry={geos.dirt} receiveShadow>
        <meshStandardMaterial map={tex.dirt} roughness={1} {...common} />
      </mesh>
      <mesh geometry={geos.gravel} receiveShadow>
        <meshStandardMaterial map={tex.gravel} roughness={1} {...common} />
      </mesh>
      <mesh geometry={geos.pavers} receiveShadow>
        <meshStandardMaterial map={tex.redPavers} roughness={0.9} {...common} />
      </mesh>
    </group>
  );
}

export { polySD };

// ---------------------------------------------------------------------------
// PLAYGROUND MARKINGS — painted games on the quad's asphalt: a number-line
// hopscotch, a four-square court and a times-tables wheel (it IS the maths
// arena).
// ---------------------------------------------------------------------------
function paintTex(w, h, draw) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const PAINT_COLS = ["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#3a86ff", "#8338ec", "#ff6fae", "#52b788", "#f77f00", "#4cc9f0", "#ffd166"];
function hopscotchTex() {
  return paintTex(1024, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const n = 11, cw = w / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = PAINT_COLS[i];
      g.fillRect(i * cw + 4, 8, cw - 8, h - 16);
      g.fillStyle = "#ffffff";
      g.font = "900 64px 'MMA Display', 'Trebuchet MS', sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(i * 2), i * cw + cw / 2, h / 2 + 4);
    }
  });
}
function fourSquareTex() {
  return paintTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cols = ["#e63946", "#3a86ff", "#e9c46a", "#52b788"];
    for (let i = 0; i < 4; i++) {
      g.fillStyle = cols[i];
      g.globalAlpha = 0.85;
      g.fillRect((i % 2) * w / 2 + 6, Math.floor(i / 2) * h / 2 + 6, w / 2 - 12, h / 2 - 12);
    }
    g.globalAlpha = 1;
    g.fillStyle = "#ffffff"; g.font = "900 120px 'MMA Display', 'Trebuchet MS', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    ["A", "B", "C", "D"].forEach((l, i) => g.fillText(l, (i % 2) * w / 2 + w / 4, Math.floor(i / 2) * h / 2 + h / 4 + 8));
  });
}
function wheelTex() {
  return paintTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w / 2 - 8;
    for (let i = 0; i < 12; i++) {
      g.fillStyle = PAINT_COLS[i % PAINT_COLS.length];
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2); g.closePath(); g.fill();
    }
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx, cy, R * 0.32, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1d3f78"; g.font = "900 72px 'MMA Display', 'Trebuchet MS', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("×", cx, cy + 4);
    g.fillStyle = "#ffffff"; g.font = "900 46px 'MMA Display', 'Trebuchet MS', sans-serif";
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * Math.PI * 2;
      g.fillText(String(i + 1), cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7 + 4);
    }
  });
}
const MARKINGS = [
  { tex: hopscotchTex, c: [-12, 7], w: 17.6, d: 1.6, yaw: 0 },
  { tex: fourSquareTex, c: [78, 14], w: 6, d: 6, yaw: 0 },
  { tex: wheelTex, c: [78, 30], w: 6.4, d: 6.4, yaw: 0.3 },
];
export function PlaygroundMarkings() {
  const texs = useMemo(() => MARKINGS.map((m) => m.tex()), []);
  return (
    <group>
      {MARKINGS.map((m, i) => (
        <mesh key={i} position={[m.c[0], LV.L1 + 0.035, m.c[1]]} rotation={[-Math.PI / 2, 0, m.yaw]} receiveShadow>
          <planeGeometry args={[m.w, m.d]} />
          <meshStandardMaterial map={texs[i]} transparent alphaTest={0.05} roughness={0.75} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
        </mesh>
      ))}
    </group>
  );
}
