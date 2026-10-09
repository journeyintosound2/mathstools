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
  SCHOOLYARD_WELCOME, SCHOOL_MAP_BOARD, SCHOOL_SIGN, QUAD_FIGS, COURT_BEDS, COURT_POND, PICNIC_TABLES, COURTS, COLA, AG_PLOT,
  GREENHOUSE, CHOOK_PEN, STAFF_CARPARK, FRONT_CARPARK, BUS_BAY, OVAL, OVAL_POSTS, SCHOOL_SIGNPOSTS, SCHOOL_SURFACES,
  SKY_PIER, SCHOOL_CHEST_SPOTS, TELESCOPE, HALL,
} from "./schoolyardLayout.js";
import {
  terrainHeight, schoolGroundHeight, schoolSolidTopAt, nearestSchoolPath, slopeAt, getSchoolStructures, inSchoolBuilding,
} from "./schoolyardTerrain.js";

/**
 * The Sky Pier's VIEW to the harbour: a wedge from the pier's end toward the
 * jetty + Muttonbird Island. Tall trees on the front lawns inside it would
 * hide the sea from the lookout, so the scatter leaves it open.
 */
const VIEW_FROM = [SKY_PIER.to[0], SKY_PIER.to[1]];
const VIEW_AT = Math.atan2(160, 517); // bearing (x over z) from the pier to the harbour mouth
export function inPierView(x, z, half = 0.32) {
  const dx = x - VIEW_FROM[0], dz = z - VIEW_FROM[1];
  if (dz < 120) return false;
  const a = Math.atan2(dx, dz);
  return Math.abs(a - VIEW_AT) < half;
}
const onPlatform = (x, z, pad = 0) => SCHOOL_PLATFORMS.some((p) => polySD(p.pts, x, z) < pad);
const onSurface = (x, z, pad = 0) => SCHOOL_SURFACES.some((s) => polySD(s.pts, x, z) < pad);
const NPC_SPOTS = [
  ...SCHOOLYARD_CHARACTERS.map((c) => c.position),
  SCHOOLYARD_WELCOME.position, [SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z], SCHOOLYARD_RETURN_PORTAL,
  SCHOOL_MAP_BOARD.position, SCHOOL_SIGN.position, ...SCHOOL_CHEST_SPOTS,
];
function nearStructure(x, z, pad) {
  for (const s of getSchoolStructures().list) {
    if (s.kind === "platform" || !s.r) continue;
    if (rectSD(s.r, x, z) < pad) return true;
  }
  return false;
}
/** May a tree / shrub stand here (on the TERRAIN, not on paving)? */
export function schoolClearAt(x, z, pad = 1.5) {
  if (x < SCHOOL_FENCE.xMin + 1.5 || x > SCHOOL_FENCE.xMax - 1.5 || z < SCHOOL_FENCE.zMin + 1.5 || z > SCHOOL_FENCE.zMax - 1.5) return false;
  if (onPlatform(x, z, pad + 0.5) || onSurface(x, z, pad)) return false;
  if (inSchoolBuilding(x, z, pad + 1.5)) return false;
  const np = nearestSchoolPath(x, z);
  if (np && np.e < pad) return false;
  if (nearStructure(x, z, pad)) return false;
  for (const [px, pz] of NPC_SPOTS) if (Math.hypot(x - px, z - pz) < pad + 4) return false;
  // The oval's playing field stays open.
  if (Math.hypot((x - OVAL.c[0]) / (OVAL.rx + 2), (z - OVAL.c[1]) / (OVAL.rz + 2)) < 1) return false;
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
  // The three big figs on the quad (in their brick planters).
  for (const f of QUAD_FIGS) add("fig", f.c[0], f.c[1], f.h / 18, { y: LV.L1 + 0.55, r: f.r, trunk: 1.0, planted: true });
  // A big fig on the front lawn by the office + one by the oval.
  add("fig", -34, 98, 1.0, { r: 6, trunk: 1.0 });
  add("fig", -60, 66, 0.9, { r: 5.6, trunk: 0.9 });
  // Norfolk Island pines: along the front fence, round the oval, on the hill.
  // (kept off the middle of the front so the harbour shows from the plaza)
  const norfolks = [[-48, 106], [64, 108], [138 - 4, 124 - 4], [-134, 112], [-134, 64], [-70, 118],
    [-136, 96], [-52, 84], [-104, 120], [76, 82], [136, 58], [-136, 20], [-120, -40], [-92, -122], [40, -124], [100, -116], [128, -122], [-130, -112]];
  for (const [x, z] of norfolks) if (schoolClearAt(x, z, 1.2) && !inPierView(x, z)) add("norfolk", x, z, 0.85 + R() * 0.35, { r: 3.4, trunk: 0.55 });
  // Jacarandas in October bloom (front lawn + the west lawn).
  for (const [x, z] of [[-24, 102], [60, 98], [-120, -6], [-100, 30], [128, 70]]) if (schoolClearAt(x, z, 1.5) && !inPierView(x, z)) add("jacaranda", x, z, 0.9 + R() * 0.25, { r: 4.6, trunk: 0.45 });
  // Bangalow palms by the office + the art block.
  for (const [x, z] of [[34, 64], [36, 76], [76, 76], [74, 66], [-12, 66], [28, 66]]) if (schoolClearAt(x, z, 0.9) && !inPierView(x, z)) add("bangalow", x, z, 0.85 + R() * 0.3, { r: 2.2, trunk: 0.3 });
  // The bush hill: spotted gums, a few more Norfolks, tree ferns in the gully.
  for (let k = 0; k < 900 && out.length < 230; k++) {
    const x = -136 + R() * 272, z = -128 + R() * 27;
    if (!schoolClearAt(x, z, 2.2) || !farEnough(x, z, 6.5)) continue;
    if (Math.abs(x - SKY_PIER.from[0]) < 7 && z < SKY_PIER.to[1] + 5) continue;
    // Keep the Sky Pier's view to the sea open (no tall trees below its end).
    if (Math.abs(x - SKY_PIER.from[0]) < 32 && z > SKY_PIER.from[1] + 2) continue;
    const u = R();
    add(u < 0.58 ? "gum" : u < 0.72 ? "norfolk" : u < 0.86 ? "treefern" : "paperbark", x, z, 0.75 + R() * 0.45, { r: u < 0.58 ? 4 : 2.6, trunk: 0.45 });
  }
  // The west lawn: a bush garden of gums, paperbarks + tree ferns.
  for (let k = 0; k < 900 && out.length < 330; k++) {
    const x = -138 + R() * 60, z = -84 + R() * 128;
    if (!schoolClearAt(x, z, 2.0) || !farEnough(x, z, 6.0)) continue;
    const u = R();
    add(u < 0.5 ? "gum" : u < 0.72 ? "paperbark" : u < 0.9 ? "treefern" : "frangipani", x, z, 0.75 + R() * 0.4, { r: 3.4, trunk: 0.4 });
  }
  // Round the oval + the front lawns (a scatter, kept off the paving).
  for (let k = 0; k < 900 && out.length < 400; k++) {
    const x = -138 + R() * 276, z = 40 + R() * 84;
    if (!schoolClearAt(x, z, 2.4) || !farEnough(x, z, 8) || inPierView(x, z)) continue;
    const u = R();
    add(u < 0.45 ? "gum" : u < 0.62 ? "paperbark" : u < 0.8 ? "frangipani" : "norfolk", x, z, 0.75 + R() * 0.4, { r: 3.6, trunk: 0.45 });
  }
  // The garden courtyard (in its raised beds): Bangalow palms, tree ferns, a frangipani.
  for (const [i, bd] of COURT_BEDS.entries()) {
    add(i % 2 ? "treefern" : "bangalow", bd.c[0] - bd.hx * 0.45, bd.c[1], 0.9, { y: LV.L2 + 0.55, r: 2.2, trunk: 0.3, planted: true });
    add(i % 2 ? "frangipani" : "treefern", bd.c[0] + bd.hx * 0.45, bd.c[1], 0.85, { y: LV.L2 + 0.55, r: 2.4, trunk: 0.3, planted: true });
  }
  // The ag plot's banana grove (Mr. Morgan's pride).
  for (let i = 0; i < 9; i++) {
    const x = AG_PLOT.c[0] - AG_PLOT.hx + 3 + i * 4.1, z = AG_PLOT.c[1] - AG_PLOT.hz + 1.6 + (i % 2) * 1.2;
    if (Math.abs(x - 62) < 2.5) continue; // the path through the middle
    add("banana", x, z, 0.9 + R() * 0.3, { y: LV.L3, r: 1.8, trunk: 0.3, planted: true });
  }
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
  // Raised beds: the quad fig planters (cordylines, lomandra round the trunk).
  for (const f of QUAD_FIGS) {
    const { hx, hz, yaw } = f.planter;
    for (let k = 0; k < 14; k++) {
      const lx = (R() * 2 - 1) * (hx - 0.6), lz = (R() * 2 - 1) * (hz - 0.6);
      if (Math.hypot(lx, lz) < 1.6) continue;
      const co = Math.cos(yaw), si = Math.sin(yaw);
      add(R() < 0.45 ? "cordyline" : "lomandra", f.c[0] + lx * co + lz * si, f.c[1] - lx * si + lz * co, 0.7 + R() * 0.5, LV.L1 + 0.55);
    }
  }
  // The courtyard beds.
  for (const bd of COURT_BEDS) {
    for (let k = 0; k < 10; k++) {
      const lx = (R() * 2 - 1) * (bd.hx - 0.5), lz = (R() * 2 - 1) * (bd.hz - 0.5);
      const co = Math.cos(bd.yaw), si = Math.sin(bd.yaw);
      add(R() < 0.4 ? "cordyline" : R() < 0.6 ? "agapanthus" : "lomandra", bd.c[0] + lx * co + lz * si, bd.c[1] - lx * si + lz * co, 0.7 + R() * 0.5, LV.L2 + 0.55);
    }
  }
  // Lawns, banks + bush: a scatter of bushes, lomandra and agapanthus.
  for (let k = 0; k < 6000 && out.length < 900; k++) {
    const x = -138 + R() * 276, z = -128 + R() * 252;
    if (!schoolClearAt(x, z, 0.8)) continue;
    const hill = z < -100, west = x < -78 && z < 44;
    if (!hill && !west && R() < 0.55) continue;
    const u = R();
    add(u < 0.4 ? "bush" : u < 0.7 ? "lomandra" : u < 0.85 ? "agapanthus" : "cordyline", x, z, 0.6 + R() * 0.7);
  }
  // A clipped hedge along the front of the office.
  for (let x = 41; x <= 71; x += 1.6) add("hedge", x, 79.4, 1, LV.L0);
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
  // Picnic sets (aluminium).
  for (const [x, z, r] of PICNIC_TABLES) add("picnic", x, z, r);
  // Benches round the fig planters (photo: aluminium seats along the brick).
  for (const f of QUAD_FIGS) {
    const { hx, hz, yaw } = f.planter;
    const co = Math.cos(yaw), si = Math.sin(yaw);
    for (const [lx, lz, rr] of [[0, hz + 0.75, 0], [0, -hz - 0.75, Math.PI], [hx + 0.75, 0, Math.PI / 2]]) {
      add("bench", f.c[0] + lx * co + lz * si, f.c[1] - lx * si + lz * co, yaw + rr, { y: LV.L1 });
    }
  }
  // Courtyard benches + the bubbler.
  for (const [x, z, r] of [[-30, -30, 0.3], [0, -46, -0.2], [20, -30, 1.4], [-48, -36, 1.6], [-8, -12, 0], [10, -60, 0]]) add("bench", x, z, r);
  add("bubbler", -26, -20, 0);
  add("bubbler", 26, 40, 0);
  add("bubbler", 90, 0, 0);
  // Bins (galvanised, slotted) — round the quad, the courtyard, the courts, the plaza.
  for (const [x, z] of [[-24, 10], [6, 22], [30, 18], [34, 40], [-40, -2], [-18, -24], [12, -48], [-44, -58], [86, 2], [86, 40],
    [40, -4], [74, -2], [-4, 92], [36, 96], [-70, 54], [-102, 50], [48, -78], [-30, -84], [18, 80]]) add("bin", x, z, 0);
  // Wheelie bins + the white school van behind the canteen (photo).
  for (let i = 0; i < 4; i++) add("wheelie", 66.2 + i * 0.85, 20.5, 0, { lid: i % 2 ? "#e9c227" : "#d23b2a" });
  add("van", 72, 30, Math.PI / 2);
  // The blue skip with the red lid by the mural (photo).
  add("skip", 23, 70.5, 0.15);
  // Light poles (photo: tall galvanised poles with a disc lamp).
  for (const [x, z] of [[-30, 2], [4, 44], [36, 10], [66, 4], [-40, 30], [-50, -30], [16, -30], [-20, -62], [100, 2], [132, 0],
    [8, 90], [36, 110], [-6, 118], [90, 66], [126, 66], [90, 112], [-60, -96], [10, -96], [110, -78], [-80, 48], [-110, 74]]) {
    if (!inSchoolBuilding(x, z, 1)) add("lamp", x, z, 0);
  }
  // Bike racks by the front walk + bollards at the plaza edge.
  add("bikerack", 44, 84, Math.PI / 2);
  add("bikerack", 44, 88, Math.PI / 2);
  for (let x = -6; x <= 38; x += 4) add("bollard", x, 87.6, 0);
  // Flagpoles beside the school sign.
  for (const dx of [-3, 0, 3]) add("flagpole", SCHOOL_SIGN.position[0] + dx - 8, SCHOOL_SIGN.position[1] - 6, 0, { flag: dx });
  // The school bus at the bus bay + a shelter.
  add("bus", BUS_BAY.c[0] + 8, BUS_BAY.c[1] - 0.2, 0);
  add("shelter", BUS_BAY.c[0] - 22, BUS_BAY.c[1] - 5.2, 0);
  // Cars in the front car park + the staff car park (bays, a few empty).
  const carCols = ["#e8e8ea", "#1f2a44", "#b31b1b", "#c9c9cf", "#2e6b3a", "#e2a33a", "#3a64b8", "#5a5a60", "#f2f2f2", "#8a1e3c"];
  const bays = (c, hx, hz, rows, every, rot) => {
    for (const rz of rows) {
      for (let x = c[0] - hx + 2; x <= c[0] + hx - 2; x += every) {
        if (R() < 0.3) continue;
        add("car", x, c[1] + rz, rot + (R() < 0.5 ? 0 : Math.PI), { color: carCols[Math.floor(R() * carCols.length)] });
      }
    }
  };
  bays(FRONT_CARPARK.c, FRONT_CARPARK.hx, FRONT_CARPARK.hz, [-20, -9, 9, 20], 2.9, Math.PI / 2);
  bays(STAFF_CARPARK.c, STAFF_CARPARK.hx, STAFF_CARPARK.hz, [-3.2], 2.9, Math.PI / 2);
  // Basketball hoops (two per court).
  for (const c of COURTS) for (const s of [-1, 1]) add("hoop", c.c[0], c.c[1] + s * (c.hz + 0.6), s > 0 ? Math.PI : 0);
  // COLA benches.
  for (const [x, z, r] of [[92, -20, 0], [126, -20, 0], [92, -48, Math.PI], [126, -48, Math.PI]]) add("bench", x, z, r);
  // The oval: rugby league posts, a scoreboard, the cricket pitch, benches.
  for (const [x, z] of OVAL_POSTS) add("goalpost", x, z, Math.PI / 2);
  add("scoreboard", -112, 44, 0.2);
  add("pitch", OVAL.c[0], OVAL.c[1], Math.PI / 2);
  for (const [x, z, r] of [[-70, 58, -0.6], [-62, 106, -0.9], [-122, 106, 0.9], [-92, 117.5, Math.PI]]) add("bench", x, z, r);
  // The ag plot: raised garden beds, a compost bay, the chook pen + greenhouse.
  for (let i = 0; i < 6; i++) {
    const x = AG_PLOT.c[0] - AG_PLOT.hx + 4 + i * 6.6;
    if (Math.abs(x - 62) < 3) continue;
    add("gardenbed", x, AG_PLOT.c[1] + 2.4, 0, { y: LV.L3 });
  }
  add("chookpen", CHOOK_PEN.c[0], CHOOK_PEN.c[1], 0, { y: LV.L3, hx: CHOOK_PEN.hx, hz: CHOOK_PEN.hz });
  add("greenhouse", GREENHOUSE.c[0], GREENHOUSE.c[1], 0, { y: LV.L3, hx: GREENHOUSE.hx, hz: GREENHOUSE.hz });
  // Ewings' telescope, on the science block's top corridor.
  add("telescope", TELESCOPE.position[0], TELESCOPE.position[1], Math.atan2(TELESCOPE.aim[0] - TELESCOPE.position[0], TELESCOPE.aim[1] - TELESCOPE.position[1]), { y: TELESCOPE.y });
  // Hall: rows of stacked chairs down the sides + a lectern on the stage.
  for (let k = 0; k < 6; k++) {
    add("chairs", HALL.stage.x[0] + 1.2, -44 + k * 4.6, Math.PI / 2, { y: LV.L1 });
    add("chairs", HALL.stage.x[1] - 1.2, -44 + k * 4.6, -Math.PI / 2, { y: LV.L1 });
  }
  add("lectern", 61.5, -51.5, 0, { y: LV.L1 + HALL.stage.h });
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
      case "chairs": box(f, 0.5, 1.6); break;
      case "lectern": circ(f, 0.35); break;
      default: break;
    }
  }
  return out;
}
export { inRect, inPoly };
