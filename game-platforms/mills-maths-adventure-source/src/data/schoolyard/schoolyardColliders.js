/**
 * RETRIEVAL PRACTICE PLAYGROUND — COLLIDERS (rebuilt 2026-10-09). Derived
 * from the layout so the scenery and the collision can never drift apart:
 *
 *   building bodies   oriented-rectangle (`box`) colliders, every height
 *   the hall's walls  thin boxes with the doorway left open
 *   guard rails       from schoolyardRails (height-BANDED: a rail only
 *                     blocks feet at its own level, so the corridor rail
 *                     12 m up never stops you on the ground below)
 *   deck columns      banded to the floor beneath each corridor
 *   the staff         banded to the level each one stands on
 *   props             trees, benches (hop-able), tables, bins, cars…
 *   the hall doors    the Head Teacher's padlocked doors — present ONLY while
 *                     the 8 keys aren't all earned (ids `sy-gate-*`)
 */
import { boxCollider } from "../../systems/collisionEngine.js";
import { toWorld } from "./schoolyardGeom.js";
import {
  STOREY, CORRIDOR_W, SCHOOL_BUILDINGS, HALL, SCHOOLYARD_CHARACTERS, SCHOOLYARD_GATE, SCHOOLYARD_WELCOME,
  SCHOOL_MAP_BOARD, SCHOOL_SIGN, SCHOOL_SIGNPOSTS, COLA, COURT_POND, LV,
} from "./schoolyardLayout.js";
import {
  schoolGroundHeight, schoolSolidTopAt, terrainHeight, corridorRect, localX, localZ, towerFootprint, TOWER_LAND, TOWER_STEPS, TOWER_TREAD,
} from "./schoolyardTerrain.js";
import { getSchoolRails } from "./schoolyardRails.js";
import { schoolPropFootprints } from "./schoolyardProps.js";
import { isBossUnlocked } from "./schoolyardProgress.js";

/** The spacing of the columns under each corridor deck. */
export const COLUMN_SPACING = 4.5;
/** Column positions for a building's corridor deck on floor f (outer edge). */
export function deckColumns(b) {
  const c = b.corridor;
  const out = [];
  const n = Math.max(1, Math.round((c.x1 - c.x0) / COLUMN_SPACING));
  for (let k = 0; k <= n; k++) {
    const lx = c.x0 + 0.35 + ((c.x1 - c.x0 - 0.7) * k) / n;
    out.push(toWorld(b, lx, b.hz + CORRIDOR_W - 0.28));
  }
  return out;
}

/**
 * Every column holding up a corridor deck / balcony / bay and the roof over
 * it: { id, x, z, y0 (the ground it stands on), y1 (the eave), r }. The
 * renderer draws them, and each blocks you at every height it spans.
 */
let _cols = null;
export function schoolColumns() {
  if (_cols) return _cols;
  const out = [];
  const base = (x, z) => {
    const s = schoolSolidTopAt(x, z);
    const t = terrainHeight(x, z);
    return s !== null && s > t ? s : t;
  };
  for (const b of SCHOOL_BUILDINGS) {
    const eave = b.y0 + (b.wallH || b.floors * STOREY);
    if (b.corridor) {
      for (const [x, z] of deckColumns(b)) out.push({ id: `${b.id}-c-${Math.round(x * 10)}-${Math.round(z * 10)}`, x, z, y0: Math.min(b.y0, base(x, z)), y1: eave, r: 0.2 });
    }
    for (const e of b.ends || []) {
      const lx = e.side * (b.hx + CORRIDOR_W - 0.28);
      const z0 = -b.hz + 0.28, z1 = b.hz + CORRIDOR_W - 0.28;
      const n = Math.max(1, Math.ceil((z1 - z0) / 5.5));
      for (let k = 0; k <= n; k++) {
        const [x, z] = toWorld(b, lx, z0 + ((z1 - z0) * k) / n);
        out.push({ id: `${b.id}-e-${k}`, x, z, y0: base(x, z), y1: eave, r: 0.2 });
      }
    }
    // Stair-tower posts: the tower's outer corners + its far inner corner.
    for (const t of b.towers || []) {
      const fp = towerFootprint(b, t);
      const near = t.x - t.dir * TOWER_LAND, far = t.x + t.dir * (TOWER_STEPS * TOWER_TREAD + TOWER_LAND);
      const pin = (v, a, b2) => Math.min(Math.max(v, Math.min(a, b2)), Math.max(a, b2));
      for (const [lx, lz] of [[pin(near + t.dir * 0.14, near, far), fp.lz1 - 0.14], [pin(far - t.dir * 0.14, near, far), fp.lz1 - 0.14], [pin(far - t.dir * 0.14, near, far), fp.lz0 + 0.14]]) {
        const [x, z] = toWorld(b, lx, lz);
        out.push({ id: `${b.id}-t-${Math.round(lx * 10)}-${Math.round(lz * 10)}`, x, z, y0: base(x, z), y1: eave, r: 0.12, post: true });
      }
    }
    for (const [bi, bay] of (b.bays || []).entries()) {
      const lz = b.hz + CORRIDOR_W + bay.depth - 0.28;
      for (const lx of [bay.x0 + 0.28, bay.x1 - 0.28]) {
        const [x, z] = toWorld(b, lx, lz);
        out.push({ id: `${b.id}-bay-${bi}-${Math.round(lx)}`, x, z, y0: base(x, z), y1: eave, r: 0.2 });
      }
    }
  }
  _cols = out;
  return out;
}

let _static = null;
function buildStatic() {
  if (_static) return _static;
  const out = [];
  // Building bodies (the hall's walls separately, so its doorway stays open).
  for (const b of SCHOOL_BUILDINGS) {
    if (b.hall) {
      const t = HALL.wallT;
      const x0 = b.c[0] - b.hx, x1 = b.c[0] + b.hx, z0 = b.c[1] - b.hz, z1 = b.c[1] + b.hz;
      out.push(boxCollider("sy-hall-wall-n", b.c[0], z0 + t / 2, b.hx, t / 2));
      out.push(boxCollider("sy-hall-wall-w", x0 + t / 2, b.c[1], t / 2, b.hz));
      out.push(boxCollider("sy-hall-wall-e", x1 - t / 2, b.c[1], t / 2, b.hz));
      out.push(boxCollider("sy-hall-wall-sw", (x0 + HALL.doorX[0]) / 2, z1 - t / 2, (HALL.doorX[0] - x0) / 2, t / 2));
      out.push(boxCollider("sy-hall-wall-se", (HALL.doorX[1] + x1) / 2, z1 - t / 2, (x1 - HALL.doorX[1]) / 2, t / 2));
      // The porch posts.
      const p = HALL.porch;
      for (const x of [p.x[0] + 0.3, p.x[1] - 0.3]) out.push({ id: `sy-porch-${x}`, x, z: p.z[1] - 0.3, radius: 0.28 });
      continue;
    }
    out.push(boxCollider(`sy-body-${b.id}`, b.c[0], b.c[1], b.hx, b.hz, b.yaw));
  }
  // Guard rails (banded to their own level).
  for (const r of getSchoolRails()) {
    const dx = r.b[0] - r.a[0], dz = r.b[1] - r.a[1];
    const L = Math.hypot(dx, dz);
    if (L < 0.2) continue;
    const cx = (r.a[0] + r.b[0]) / 2 - r.n[0] * 0.08, cz = (r.a[1] + r.b[1]) / 2 - r.n[1] * 0.08;
    out.push(boxCollider(`sy-rail-${r.id}`, cx, cz, L / 2, 0.08, Math.atan2(-dz, dx), {
      yMin: Math.min(r.ya, r.yb) - 0.35, yMax: Math.max(r.ya, r.yb) + 2.4,
    }));
  }
  // The columns under the corridor decks, balconies + bays (floor to roof).
  for (const c of schoolColumns()) {
    out.push({ id: `sy-col-${c.id}`, x: c.x, z: c.z, radius: c.r + 0.04, yMin: c.y0 - 0.4, yMax: c.y1 });
  }
  // COLA posts.
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
    out.push({ id: `sy-cola-${sx}-${sz}`, x: COLA.c[0] + sx * (COLA.hx - 0.4), z: COLA.c[1] + sz * (COLA.hz - 0.4), radius: 0.22 });
  }
  // The staff + Mills (banded to the level they stand on — Ms. Mahoney is
  // up on the library corridor, not in the courtyard beneath her).
  for (const c of SCHOOLYARD_CHARACTERS) {
    const y = schoolGroundHeight(c.position[0], c.position[1]);
    out.push({ id: `sy-${c.id}`, kind: "interactable", x: c.position[0], z: c.position[1], radius: c.boss ? 1.3 : 0.8, yMin: y - 0.6, yMax: y + 2.4 });
  }
  const wy = schoolGroundHeight(SCHOOLYARD_WELCOME.position[0], SCHOOLYARD_WELCOME.position[1]);
  out.push({ id: "schoolyard-sign", kind: "interactable", x: SCHOOLYARD_WELCOME.position[0], z: SCHOOLYARD_WELCOME.position[1], radius: 0.7, yMin: wy - 0.6, yMax: wy + 2.4 });
  // The courtyard pond, the hall's key-count sign, the stage's proscenium jambs.
  out.push({ id: "sy-pond", x: COURT_POND.c[0], z: COURT_POND.c[1], radius: COURT_POND.r + 0.15, yMin: LV.L2 - 0.6, yMax: LV.L2 + 2 });
  out.push(boxCollider("sy-keysign", HALL.doorX[1] + 2.6, HALL.doorZ + 1.6, 1.05, 0.12, -0.25, { yMin: LV.L1 - 0.6, yMax: LV.L1 + 2.4 }));
  for (const x of [HALL.stage.x[0] + 0.6, HALL.stage.x[1] - 0.6]) {
    out.push(boxCollider(`sy-proscenium-${x}`, x, HALL.stage.z[1] - 0.6, 0.6, 0.3, 0, { yMin: LV.L1 + HALL.stage.h - 0.4, yMax: LV.L1 + 9 }));
  }
  out.push(boxCollider("sy-mapboard", SCHOOL_MAP_BOARD.position[0], SCHOOL_MAP_BOARD.position[1], 2.2, 0.35, SCHOOL_MAP_BOARD.rotationY));
  out.push(boxCollider("sy-schoolsign", SCHOOL_SIGN.position[0], SCHOOL_SIGN.position[1], 2.8, 0.45, SCHOOL_SIGN.rotationY));
  for (const s of SCHOOL_SIGNPOSTS) {
    const y = schoolGroundHeight(s.p[0], s.p[1]);
    out.push({ id: `sy-signpost-${s.id}`, x: s.p[0], z: s.p[1], radius: 0.22, yMin: y - 0.5, yMax: y + 3 });
  }
  // Trees + furniture (banded to their ground so a tree on the lawn never
  // blocks the deck above… and benches are hop-able).
  for (const f of schoolPropFootprints()) {
    const band = { yMin: f.y - 0.6, yMax: f.y + 3.2 };
    if (f.circle) out.push({ id: f.id, kind: f.kind || "prop", x: f.x, z: f.z, radius: f.r, ...band, ...(f.jumpable ? { jumpable: true } : {}) });
    else out.push(boxCollider(f.id, f.x, f.z, f.hx, f.hz, f.yaw || 0, { ...band, ...(f.jumpable ? { jumpable: true } : {}) }));
  }
  _static = out;
  return out;
}

/** The Head Teacher's padlocked hall doors (while the keys aren't all in). */
function gateColliders() {
  const cols = [];
  const [x0, x1] = SCHOOLYARD_GATE.x;
  for (let x = x0 + 0.6; x <= x1 - 0.5; x += 1.15) {
    cols.push({
      id: `sy-gate-${Math.round(x * 10)}`, kind: "gate", x, z: SCHOOLYARD_GATE.z, radius: 0.75,
      yMin: SCHOOLYARD_GATE.y - 0.6, yMax: SCHOOLYARD_GATE.y + 3,
      hint: "The Head Teacher's hall is padlocked — earn all 8 keys from the staff to open it.",
    });
  }
  return cols;
}

/** Schoolyard colliders for the current progress snapshot (adds the hall
 *  doors while the Head Teacher is still locked away). */
export function getSchoolyardColliders(snapshot = {}) {
  const cm = snapshot.completedMissions || [];
  const base = buildStatic();
  return isBossUnlocked(cm) ? base : [...base, ...gateColliders()];
}

// Back-compat static export (locked state) for any direct importers.
export const SCHOOLYARD_COLLIDERS_LAZY = () => getSchoolyardColliders({});
export { localX, localZ, corridorRect };
