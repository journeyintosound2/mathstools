/**
 * RETRIEVAL PRACTICE PLAYGROUND — PROPS (pure, deterministic). The trees
 * (the quad's three big figs, Norfolk Island pines, spotted gums, Bangalow
 * palms, tree ferns, frangipani, paperbarks, jacarandas in October bloom,
 * the ag plot's bananas), the shrubs (red cordylines, lomandra, agapanthus,
 * hedges) and the school FURNITURE (aluminium benches + picnic sets,
 * galvanised slotted bins, wheelie bins, light poles, bubblers, bike racks,
 * the white school van, cars, the bus, hoops, goal posts…). Everything sits
 * on the ground it stands on and keeps clear of paths, stairs, decks and the
 * staff. The colliders + the renderer read these lists.
 */
import { rng, inRect, inPoly, rectSD, polySD } from "./schoolyardGeom.js";
import {
  LV, SCHOOL_FENCE, SCHOOL_PLATFORMS, SCHOOL_BUILDINGS, SCHOOLYARD_CHARACTERS, SCHOOLYARD_SPAWN, SCHOOLYARD_RETURN_PORTAL,
  SCHOOLYARD_WELCOME, SCHOOL_MAP_BOARD, SCHOOL_SIGN, QUAD_FIGS, COURT_BEDS, COURT_TREE, PICNIC_TABLES, COURTS, COLA,
  FRONT_CARPARK, BUS_BAY, SCHOOL_SIGNPOSTS, SCHOOL_SURFACES, SCHOOL_CHEST_SPOTS, TELESCOPE, HALL, PLANTER_BOXES,
  BALCONY_DESKS,
} from "./schoolyardLayout.js";
import {
  terrainHeight, schoolGroundHeight, schoolSolidTopAt, nearestSchoolPath, slopeAt, getSchoolStructures, inSchoolBuilding,
  verandahRect,
} from "./schoolyardTerrain.js";

/** (Kept for the old callers: the harbour view no longer needs a clear wedge.) */
export function inPierView() {
  return false;
}
// Trees may stand on lawn (terrain, or a grass terrace) — never on paving.
const onPaved = (x, z, pad = 0) => SCHOOL_PLATFORMS.some((p) => p.surface !== "grass" && polySD(p.pts, x, z) < pad);
const onSurface = (x, z, pad = 0) => SCHOOL_SURFACES.some((s) => polySD(s.pts, x, z) < pad);
const NPC_SPOTS = [
  ...SCHOOLYARD_CHARACTERS.map((c) => c.position),
  SCHOOLYARD_WELCOME.position, [SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z], SCHOOLYARD_RETURN_PORTAL,
  SCHOOL_MAP_BOARD.position, SCHOOL_SIGN.position, ...SCHOOL_CHEST_SPOTS, ...SCHOOL_SIGNPOSTS.map((s) => s.p),
];
function nearStructure(x, z, pad) {
  for (const s of getSchoolStructures().list) {
    if (s.kind === "platform" || !s.r) continue;
    if (rectSD(s.r, x, z) < pad) return true;
  }
  return false;
}
function nearVerandah(x, z, pad) {
  for (const b of SCHOOL_BUILDINGS) for (const v of b.verandahs || []) if (rectSD(verandahRect(b, v), x, z) < pad) return true;
  return false;
}
/** A platform edge with a drop (keep trees off the top of retaining walls). */
const nearEdge = (x, z, pad) => SCHOOL_PLATFORMS.some((p) => Math.abs(polySD(p.pts, x, z)) < pad);
/** May a tree / shrub stand here (on lawn, not on paving)? */
export function schoolClearAt(x, z, pad = 1.5) {
  if (x < SCHOOL_FENCE.xMin + 1.5 || x > SCHOOL_FENCE.xMax - 1.5 || z < SCHOOL_FENCE.zMin + 1.5 || z > SCHOOL_FENCE.zMax - 1.5) return false;
  if (onPaved(x, z, pad + 0.5) || onSurface(x, z, pad)) return false;
  if (nearEdge(x, z, pad + 0.6)) return false;
  if (inSchoolBuilding(x, z, pad + 1.5)) return false;
  if (nearVerandah(x, z, pad + 0.5)) return false;
  const np = nearestSchoolPath(x, z);
  if (np && np.e < pad) return false;
  if (nearStructure(x, z, pad)) return false;
  for (const [px, pz] of NPC_SPOTS) if (Math.hypot(x - px, z - pz) < pad + 4) return false;
  return slopeAt(x, z) < 0.9;
}

// ---------------------------------------------------------------------------
// TREES
// ---------------------------------------------------------------------------
function buildTrees() {
  const R = rng(4127);
  const out = [];
  const add = (kind, x, z, s, extra = {}) => {
    out.push({ kind, x, z, y: extra.y ?? schoolGroundHeight(x, z, 0), s, rot: R() * Math.PI * 2, ...extra });
  };
  const farEnough = (x, z, d) => out.every((t) => Math.hypot(t.x - x, t.z - z) > d);
  // The big figs in their brick planters (the quad + the Big Yard — videos 1, 9).
  for (const f of QUAD_FIGS) add("fig", f.c[0], f.c[1], f.h / 18, { y: LV.L1 + 0.55, r: f.r, trunk: 1.0, planted: true });
  // Banksia Court's leafy tree (the balconies look out over it).
  add("jacaranda", COURT_TREE.c[0], COURT_TREE.c[1], COURT_TREE.h / 12, { y: LV.L1, r: COURT_TREE.r, trunk: 0.5, planted: true });
  // Norfolk Island pines along the street fronts + round the edges.
  const norfolks = [[-60, 122], [52, 108], [96, 122], [-132, 112], [-132, 64], [-134, 0], [-132, -60], [-130, -120],
    [-80, -124], [-20, -125], [40, -124], [96, -124], [134, 70], [-112, 92]];
  for (const [x, z] of norfolks) if (schoolClearAt(x, z, 1.2)) add("norfolk", x, z, 0.85 + R() * 0.35, { r: 3.4, trunk: 0.55 });
  // Jacarandas in bloom (the lawn north of the hall, the front lawns).
  for (const [x, z] of [[2, -14], [28, 4], [-8, 0], [-126, 84], [-30, 100], [94, 80]]) if (schoolClearAt(x, z, 1.5)) add("jacaranda", x, z, 0.9 + R() * 0.25, { r: 4.6, trunk: 0.45 });
  // Bangalow palms by the office + the front stairs.
  for (const [x, z] of [[58, 92], [60, 102], [-4, 88], [34, 90], [100, 92]]) if (schoolClearAt(x, z, 0.9)) add("bangalow", x, z, 0.85 + R() * 0.3, { r: 2.2, trunk: 0.3 });
  // The lawns round the edge: gums, paperbarks, tree ferns, frangipani.
  const lawn = (n, x0, x1, z0, z1, gap, pad) => {
    for (let k = 0; k < n * 40 && n > 0; k++) {
      const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
      if (!schoolClearAt(x, z, pad) || !farEnough(x, z, gap)) continue;
      const u = R();
      add(u < 0.5 ? "gum" : u < 0.7 ? "paperbark" : u < 0.86 ? "frangipani" : "treefern", x, z, 0.75 + R() * 0.4, { r: u < 0.5 ? 4 : 2.8, trunk: 0.45 });
      n--;
    }
  };
  lawn(26, -138, -105, -128, 110, 7, 2.0); // the west lawn
  lawn(18, -104, 104, -129, -113, 8, 2.0); // the north lawn (behind W Block)
  lawn(12, 40, 103, -111, -42, 8, 2.2); // the north-east lawn (by the quad)
  lawn(6, -13, 39, -29, 19, 7, 2.4); // the lawn between the library + the hall
  lawn(16, -138, 140, 84, 124, 9, 2.6); // the front lawns
  return out;
}
export const SCHOOL_TREES = buildTrees();

// ---------------------------------------------------------------------------
// SHRUBS + GROUND COVER
// ---------------------------------------------------------------------------
function buildShrubs() {
  const R = rng(9311);
  const out = [];
  const add = (kind, x, z, s, y) => out.push({ kind, x, z, y: y ?? schoolGroundHeight(x, z, 0), s, rot: R() * Math.PI * 2 });
  // The fig planters (cordylines, lomandra round the trunk).
  for (const f of QUAD_FIGS) {
    const { hx, hz, yaw } = f.planter;
    for (let k = 0; k < 14; k++) {
      const lx = (R() * 2 - 1) * (hx - 0.6), lz = (R() * 2 - 1) * (hz - 0.6);
      if (Math.hypot(lx, lz) < 1.6) continue;
      const co = Math.cos(yaw), si = Math.sin(yaw);
      add(R() < 0.45 ? "cordyline" : "lomandra", f.c[0] + lx * co + lz * si, f.c[1] - lx * si + lz * co, 0.7 + R() * 0.5, LV.L1 + 0.55);
    }
  }
  // The raised beds (Banksia Court's kitchen garden, the canteen planter).
  for (const bd of COURT_BEDS) {
    const n = Math.round(bd.hx * bd.hz * 1.6);
    for (let k = 0; k < n; k++) {
      const lx = (R() * 2 - 1) * (bd.hx - 0.4), lz = (R() * 2 - 1) * (bd.hz - 0.4);
      const co = Math.cos(bd.yaw), si = Math.sin(bd.yaw);
      add(R() < 0.4 ? "lomandra" : R() < 0.6 ? "agapanthus" : "bush", bd.c[0] + lx * co + lz * si, bd.c[1] - lx * si + lz * co, 0.6 + R() * 0.4, (bd.y ?? LV.L1) + 0.55);
    }
  }
  // Grasses round Banksia Court's tree (video 4).
  for (let k = 0; k < 10; k++) {
    const a = R() * Math.PI * 2, r = 1.6 + R() * 1.4;
    add("lomandra", COURT_TREE.c[0] + Math.cos(a) * r, COURT_TREE.c[1] + Math.sin(a) * r, 0.8 + R() * 0.4, LV.L1);
  }
  // Lawns: a scatter of bushes, lomandra and agapanthus.
  for (let k = 0; k < 7000 && out.length < 820; k++) {
    const x = -138 + R() * 276, z = -128 + R() * 252;
    if (!schoolClearAt(x, z, 0.8)) continue;
    const u = R();
    add(u < 0.4 ? "bush" : u < 0.7 ? "lomandra" : u < 0.85 ? "agapanthus" : "cordyline", x, z, 0.6 + R() * 0.7);
  }
  // A clipped hedge along the front of the office.
  for (let x = 67; x <= 93; x += 1.6) add("hedge", x, 105.6, 1, LV.L0);
  return out;
}
export const SCHOOL_SHRUBS = buildShrubs();

// ---------------------------------------------------------------------------
// FURNITURE
// ---------------------------------------------------------------------------
function buildFurniture() {
  const out = [];
  const R = rng(5813);
  const at = (x, z) => schoolGroundHeight(x, z);
  const add = (kind, x, z, rot = 0, extra = {}) => out.push({ kind, x, z, y: extra.y ?? at(x, z), rot, ...extra });
  // Picnic sets (aluminium) — the quad, the canteen deck, the yard.
  for (const [x, z, r] of PICNIC_TABLES) add("picnic", x, z, r);
  // Benches round the fig planters (video 1 + 9: aluminium seats along the brick).
  for (const f of QUAD_FIGS) {
    const { hx, hz, yaw } = f.planter;
    const co = Math.cos(yaw), si = Math.sin(yaw);
    for (const [lx, lz, rr] of [[0, hz + 0.75, 0], [0, -hz - 0.75, Math.PI], [hx + 0.75, 0, Math.PI / 2]]) {
      add("bench", f.c[0] + lx * co + lz * si, f.c[1] - lx * si + lz * co, yaw + rr, { y: LV.L1 });
    }
  }
  // Benches: the quad's edge, the mural lane, A Block courtyard, Banksia Court,
  // the canteen planter (video 2), under the undercroft.
  for (const [x, z, r] of [[96, -30, Math.PI / 2], [96, 40, Math.PI / 2], [-80, -79.2, 0], [-66, -79.2, 0],
    [-84.6, -26, Math.PI / 2], [-84.6, 20, Math.PI / 2], [-82.8, 74, Math.PI / 2], [-30, 12.9, 0], [-62, 33, 0], [-79, 33, 0]]) add("bench", x, z, r);
  // The top balcony (video 6): desks + chairs along the balustrade, benches by the wall.
  for (const [x, z, r] of BALCONY_DESKS) add("desk", x, z, r, { y: LV.L3 });
  for (const [x, z] of [[-51.95, 43], [-51.95, 57]]) add("bench", x, z, Math.PI / 2, { y: LV.L3 });
  // A Block courtyard (video 8): timber planter boxes.
  for (const pb of PLANTER_BOXES) add("planterbox", pb.c[0], pb.c[1], pb.yaw, { hx: pb.hx, hz: pb.hz });
  add("bubbler", -64, 2, 0);
  add("bubbler", 44, 20, 0);
  add("bubbler", -60, 50, 0);
  // Bins (galvanised, slotted) — round the quad, the yard, the courtyards, the plaza.
  for (const [x, z] of [[48, -36], [74, 18], [100, -4], [-24, -36], [10, -84], [-60, -84], [-66, -26], [-66, 26], [-58, 60],
    [-82, 86], [-18, 66], [40, 70], [-4, 96], [36, 108], [-60, 112], [112, 30], [-16, 44]]) add("bin", x, z, 0);
  // The canteen's wheelie bins + the recycling station (video 2).
  for (let i = 0; i < 4; i++) add("wheelie", -35 + i * 0.85, 12.6, 0, { lid: i % 2 ? "#e9c227" : "#d23b2a" });
  // Light poles (tall galvanised poles with a disc lamp).
  for (const [x, z] of [[46, -30], [46, 50], [96, 10], [-26, -46], [24, -60], [-56, -80], [-30, 70], [60, 70],
    [-70, 112], [-46, 108], [8, 94], [36, 112], [-6, 120], [118, -66], [118, 50], [100, 112], [-120, 60], [-120, -90]]) {
    if (!inSchoolBuilding(x, z, 1)) add("lamp", x, z, 0);
  }
  // Bike racks on the lower terrace, under the Maths balconies' railings (video 10).
  for (const x of [-100, -96, -92, -50, -46]) add("bikerack", x, 112, 0);
  // Bollards at the plaza edge + by the bus bay.
  for (let x = -12; x <= 38; x += 5) add("bollard", x, 86.6, 0);
  // Flagpoles beside the school sign.
  for (const dx of [-3, 0, 3]) add("flagpole", SCHOOL_SIGN.position[0] + dx - 6, SCHOOL_SIGN.position[1] - 6, 0, { flag: dx });
  // The school bus at the bus bay + a shelter.
  add("bus", BUS_BAY.c[0] + 6, BUS_BAY.c[1] - 0.2, 0);
  add("shelter", BUS_BAY.c[0] - 16, BUS_BAY.c[1] - 5.2, 0);
  // Cars in the front car park (bays, a few empty) + the white school van.
  const carCols = ["#e8e8ea", "#1f2a44", "#b31b1b", "#c9c9cf", "#2e6b3a", "#e2a33a", "#3a64b8", "#5a5a60", "#f2f2f2", "#8a1e3c"];
  const { c, hx } = FRONT_CARPARK;
  for (const rz of [-11, 0, 11]) {
    for (let x = c[0] - hx + 2; x <= c[0] + hx - 2; x += 2.9) {
      if (R() < 0.3) continue;
      add("car", x, c[1] + rz, Math.PI / 2 + (R() < 0.5 ? 0 : Math.PI), { color: carCols[Math.floor(R() * carCols.length)] });
    }
  }
  add("van", 68, 110, 0);
  // Basketball hoops (two per court) + benches under the COLA.
  for (const ct of COURTS) for (const sgn of [-1, 1]) add("hoop", ct.c[0], ct.c[1] + sgn * (ct.hz + 0.6), sgn > 0 ? Math.PI : 0);
  for (const [x, z, r] of [[111.5, -54, Math.PI / 2], [111.5, -26, Math.PI / 2], [134.5, -54, -Math.PI / 2], [134.5, -26, -Math.PI / 2]]) add("bench", x, z, r);
  // Ewings' telescope, on C Block's top corridor, aimed at Muttonbird Island.
  add("telescope", TELESCOPE.position[0], TELESCOPE.position[1], Math.atan2(TELESCOPE.aim[0] - TELESCOPE.position[0], TELESCOPE.aim[1] - TELESCOPE.position[1]), { y: TELESCOPE.y });
  // Hall: rows of stacked chairs down the sides + a lectern on the stage.
  for (let k = 0; k < 6; k++) {
    add("chairs", HALL.stage.x[0] + 1.6, 34 + k * 4.6, Math.PI / 2, { y: LV.L1 });
    add("chairs", HALL.stage.x[1] - 1.6, 34 + k * 4.6, -Math.PI / 2, { y: LV.L1 });
  }
  add("lectern", 17.5, 24, 0, { y: LV.L1 + HALL.stage.h });
  return out;
}
export const SCHOOL_FURNITURE = buildFurniture();

/** Collider footprints for the props (circles + boxes; benches are hop-able). */
export function schoolPropFootprints() {
  const out = [];
  for (const t of SCHOOL_TREES) {
    if (t.kind === "banana" || t.kind === "treefern" && t.planted) continue;
    out.push({ id: `sy-tree-${out.length}`, circle: true, x: t.x, z: t.z, r: (t.trunk || 0.4) * Math.max(0.8, t.s), y: t.y, kind: "tree" });
  }
  const box = (f, hx, hz, extra = {}) => out.push({ id: `sy-${f.kind}-${out.length}`, x: f.x, z: f.z, hx, hz, yaw: f.rot, y: f.y, ...extra });
  const circ = (f, r, extra = {}) => out.push({ id: `sy-${f.kind}-${out.length}`, circle: true, x: f.x, z: f.z, r, y: f.y, ...extra });
  for (const f of SCHOOL_FURNITURE) {
    switch (f.kind) {
      case "picnic": box(f, 1.0, 0.95); break;
      case "bench": box(f, 1.25, 0.28, { jumpable: true }); break;
      case "bin": case "bubbler": circ(f, 0.32); break;
      case "wheelie": box(f, 0.38, 0.4); break;
      case "van": box(f, 2.7, 1.05); break;
      case "skip": box(f, 1.0, 0.75); break;
      case "lamp": case "flagpole": case "bollard": circ(f, 0.18); break;
      case "bikerack": box(f, 1.4, 0.3, { jumpable: true }); break;
      case "bus": box(f, 5.8, 1.35); break;
      case "shelter": box(f, 2.2, 0.9); break;
      case "car": box(f, 2.15, 0.95); break;
      case "hoop": circ(f, 0.3); break;
      case "goalpost": {
        const dx = Math.cos(f.rot) * 2.8, dz = -Math.sin(f.rot) * 2.8;
        circ({ ...f, x: f.x - dx, z: f.z - dz }, 0.2); circ({ ...f, x: f.x + dx, z: f.z + dz }, 0.2);
        break;
      }
      case "scoreboard": box(f, 2.6, 0.4); break;
      case "gardenbed": box(f, 2.4, 1.0, { jumpable: true }); break;
      case "chookpen": box(f, f.hx, f.hz); break;
      case "greenhouse": box(f, f.hx, f.hz); break;
      case "telescope": circ(f, 0.35); break;
      case "desk": box(f, 0.6, 0.4); break;
      case "planterbox": box(f, f.hx, f.hz); break;
      case "chairs": box(f, 0.5, 1.6); break;
      case "lectern": circ(f, 0.35); break;
      default: break;
    }
  }
  return out;
}
export { inRect, inPoly, terrainHeight, schoolSolidTopAt };
