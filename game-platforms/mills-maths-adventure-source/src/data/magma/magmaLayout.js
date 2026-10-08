/**
 * MAGMA MULTIPLES — the SIXTH region: a volcano / lava world (layout v1, land
 * only — no characters or maths yet). SINGLE SOURCE OF TRUTH for every
 * position, the terrain height-field, the lava mask and the volcano's spiral
 * summit trail. Pure data + pure helpers (no React / three / stores), so the
 * renderer (game/MagmaScenery.jsx), the colliders (magmaColliders.js), the
 * Player (via regions.js hooks) and the headless system checks all read the
 * SAME numbers and can never drift.
 *
 * WORLD (≈3× Fraction Farm's area): a round basalt landmass (shore radius
 * ~92–103) ringed by a LAVA SEA. In the middle stands THE VOLCANO — 32 m tall,
 * 88 m across at its foot — with a 5.5 m-wide SPIRAL TRAIL cut into its flank
 * that winds TWICE round the mountain from the foot to the summit rim. The
 * crater itself (a glowing lava lake) is sealed off by a ring of lip boulders
 * and a locked rune gate — "can't enter (yet)".
 *
 * Around the volcano: a LAVA MOAT (crossed by the main stone bridge in the
 * south, or by hopping basalt stepping stones in the north), FOUR LAVA RIVERS
 * running from the moat out to the sea (they split the land into N/E/S/W
 * quarters), a RING ROAD that crosses each river on a differently-styled
 * bridge, spokes + outer arcs to EIGHT reserved clearings (future challenge
 * areas), and a western LAVA LAKE with a checkerboard causeway to an islet
 * under a lava waterfall. Lava is the obstacle, not the floor: most of the
 * land is walkable rock, and the paths show the way.
 *
 * Coordinates: x = east, z = SOUTH (three.js), so north is −z. Angles used
 * here are polar angles θ with x = r·cosθ, z = r·sinθ (θ=90° is due SOUTH,
 * θ=270° due NORTH).
 *
 * Lava never hurts: touching it pops the player up in a little "hot-foot"
 * bounce back to the last safe spot (Player.jsx, region.isLava hook).
 */

// ---------------------------------------------------------------------------
// Identity + basics
// ---------------------------------------------------------------------------
export const MAGMA_REGION_ID = "magma-multiples";
export const MAGMA_NAME = "Magma Multiples";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
export function polar(r, deg) {
  return [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];
}
// WORLD SCALE for the lowland layout (radii below are written at a 98 m
// shore and scaled up so the land is ~3× Fraction Farm's area).
export const WS = 1.12;
const P = (r, deg) => polar(r * WS, deg);
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function smoothstep(a, b, v) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function mod(a, n) { return ((a % n) + n) % n; }

/** Distance from (x,z) to segment a→b. */
function segDist(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz || 1e-9;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}
function polyDist(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < best) best = d;
  }
  return best;
}

// Walkable clamp (a circle) — well past the shore; the lava sea is the real
// edge (stepping in bounces you back), the clamp just stops a launched player
// sailing off the map.
export const MAGMA_BOUNDS = { shape: "circle", radius: 116, center: [0, 0] };

// Lava surface + the (hidden) channel bed the terrain dips to under it.
export const LAVA_Y = -0.45;
export const LAVA_BED = -1.6;

// Arrival: a paved plaza in the far south, facing the volcano (north).
export const MAGMA_PLAZA = { center: [0, 91.8], radius: 7.5 };
export const MAGMA_SPAWN = { x: 0, z: 93.3 };
// Red return portal → Number Island, on the plaza's south-WEST edge — off to
// the side so it never stands between the follow camera and the volcano on
// arrival (you arrive looking straight up the avenue at the mountain).
export const MAGMA_RETURN_PORTAL = [-6.9, 97.0];
export const MAGMA_RETURN_PORTAL_YAW = Math.atan2(6.9, -5.2); // faces the plaza centre
// Welcome sign just north of the spawn, slightly off the avenue.
export const MAGMA_WELCOME_SIGN = { position: [4.2, 88.0], rotationY: -0.35, text: "Welcome to Magma Multiples" };

// ---------------------------------------------------------------------------
// Shore (lava sea) — an irregular coastline, radius ~103–116.
// ---------------------------------------------------------------------------
export function shoreRadius(theta) {
  return WS * (98 + 3 * Math.sin(3 * theta + 1.2) + 1.6 * Math.sin(5 * theta + 0.4) + 1.0 * Math.sin(9 * theta + 2.0));
}

// ---------------------------------------------------------------------------
// THE VOLCANO + its SPIRAL SUMMIT TRAIL
//
// The mountain is a cone (slope ≈1.19 — far too steep to climb). The trail is
// a flat shelf cut into the flank: at spiral angle φ (0 → 4π, two full turns)
// its centre sits at radius R(φ) and height H(φ), following the cone surface,
// so its INNER side is a ~3.3 m rock wall and its OUTER side drops ~3.3 m to
// the face below (guarded by a low stone kerb you can't walk over, only jump).
// The trail mouth opens onto the flat apron at the foot (φ = 0, θ = 80°, just
// east of where the main bridge lands) and arrives on the summit rim from the
// same side, two turns later.
// ---------------------------------------------------------------------------
export const VOLCANO = {
  rBase: 48,      // foot of the cone (the flat apron runs 48 → moat)
  rRim: 18,       // outer edge of the flat summit rim
  rCrater: 11,    // inner edge of the rim — the crater's lip
  height: 36,     // summit rim height
  pathW: 5.5,     // trail width (wall to kerb)
  curbW: 0.7,     // outer stone kerb width
  curbH: 0.6,     // kerb height (> STEP_UP 0.45, < jump 1.3)
  lipH: 0.9,      // crater-lip hump height
  turns: 2,
  theta0: 80 * DEG, // polar angle of the trail mouth
  landing: 0.35,  // extra flat run (radians) at the top before the rim
  // How far the trail is cut INTO the cone: its centre line sits this far
  // inside the surface it follows, so the inner rock wall is tall (~5 m) and
  // the outer edge only drops ~1.3 m to the flank below — the mountain keeps
  // a true cone silhouette with a spiral groove, not a stack of terraces.
  inset: 1.65,
};
export const V_SLOPE = VOLCANO.height / (VOLCANO.rBase - VOLCANO.rRim);
export const V_PITCH = (VOLCANO.rBase - VOLCANO.rRim) / VOLCANO.turns;
export const V_K = V_PITCH / TAU;
export const TRAIL_PHI = TAU * VOLCANO.turns; // φ at the summit
export const TRAIL_END = TRAIL_PHI + VOLCANO.landing;
// The crater's lava lake (a disc inside the bowl, well below the rim).
export const CRATER_LAVA_Y = VOLCANO.height - 8.6;
export const CRATER_LAVA_R = VOLCANO.rCrater - 3.1;

/** Trail centre radius at spiral angle φ. */
export function trailRadius(phi) { return VOLCANO.rBase - VOLCANO.inset - V_K * phi; }
/** Trail surface height at spiral angle φ (constant gentle grade). */
export function trailHeight(phi) { return clamp(V_SLOPE * V_K * phi, 0, VOLCANO.height); }
/** World [x, z] of the trail at spiral angle φ, offset `u` metres outward. */
export function trailPoint(phi, u = 0) {
  const r = trailRadius(phi) + u;
  const a = VOLCANO.theta0 + phi;
  return [r * Math.cos(a), r * Math.sin(a)];
}

/**
 * Map a radius + polar angle onto the spiral: φ (which winding) and u (radial
 * offset from that winding's centre line, +outward). Every point of the flank
 * belongs to exactly one winding band |u| ≤ pitch/2.
 */
function spiralAt(r, theta) {
  const base = mod(theta - VOLCANO.theta0, TAU);
  const phiStar = (VOLCANO.rBase - VOLCANO.inset - r) / V_K;
  const n = Math.round((phiStar - base) / TAU);
  const phi = base + TAU * n;
  return { phi, u: r - trailRadius(phi) };
}
export function spiralCoords(x, z) {
  const r = Math.hypot(x, z);
  return { r, ...spiralAt(r, Math.atan2(z, x)) };
}

function onTrailBand(phi, u) {
  return phi >= 0 && phi <= TRAIL_END && Math.abs(u) <= VOLCANO.pathW / 2;
}
/** Is (x, z) on the summit trail's band (wall to kerb)? */
export function isOnTrail(x, z) {
  const { phi, u } = spiralCoords(x, z);
  return onTrailBand(phi, u);
}

/** The kerb ramps in just after the mouth (so you can step on at the apron). */
function curbAmount(phi) {
  return smoothstep(0.35, 0.95, phi);
}

/**
 * EXACT visual height of the volcano at radius r / polar angle θ (also used,
 * max-filtered, for collision). Covers r ≤ rBase (+ the apron beyond = 0).
 */
export function volcanoSurface(r, theta, visual = false) {
  const V = VOLCANO;
  // Crater bowl + lip.
  if (r < V.rCrater) {
    if (r > V.rCrater - 1.7) return V.height - 0.8 - ((V.rCrater - r) / 1.7) * 4.2;
    if (r > V.rCrater - 3.7) return V.height - 5 - ((V.rCrater - 1.7 - r) / 2.0) * 4.5;
    return V.height - 9.5;
  }
  const { phi, u } = spiralAt(r, theta);
  const trail = onTrailBand(phi, u);
  if (r <= V.rRim) {
    // The trail's last stretch is cut into the rim itself (its inner half
    // dips inside rRim before the top) — the cut wins until it levels out.
    if (trail && phi < TRAIL_PHI) return trailHeight(phi);
    let h = V.height;
    if (r < V.rCrater + 0.9) h += V.lipH * Math.sin((Math.PI * (r - V.rCrater)) / 0.9);
    // A low kerb round the summit rim's outer edge — open where the trail
    // arrives (so you can walk on), closed everywhere else (so you can't
    // stroll off the summit by accident). Drawn as boulders, so collision only.
    if (!visual && r >= V.rRim - 0.7 && !trail) h += V.curbH;
    return h;
  }
  if (trail) {
    let h = trailHeight(phi);
    if (u >= V.pathW / 2 - V.curbW) h += V.curbH * curbAmount(phi);
    return h;
  }
  // End cap: a kerb across the outer half just past the summit landing.
  if (!visual && phi > TRAIL_END && phi <= TRAIL_END + 0.14 && u <= V.pathW / 2) {
    return V.height + V.curbH;
  }
  if (r >= V.rBase) return 0; // the flat apron
  return clamp(V_SLOPE * (V.rBase - r), 0, V.height);
}

// The trail's band pokes past the cone's foot near the mouth (r up to
// rBase + pathW/2), so the volcano owns the ground out to here.
export const VOLCANO_GROUND_R = VOLCANO.rBase + VOLCANO.pathW / 2 + 0.6;

/** Collision height on the volcano: walls inflated 0.35 m radially (so the
 * player's body, not just their centre, stops at the rock). */
const WALL_PAD = 0.35;
function volcanoCollision(x, z) {
  const r = Math.hypot(x, z);
  const th = Math.atan2(z, x);
  return Math.max(
    volcanoSurface(r, th),
    volcanoSurface(Math.max(0, r - WALL_PAD), th),
    volcanoSurface(r + WALL_PAD, th)
  );
}

/**
 * Steep-face test for the Player: on the bare cone flank (off the trail, off
 * the rim) returns the downhill direction (radially OUTWARD) — the player
 * slides down and can't walk up it. null everywhere else.
 */
export function magmaSlideAt(x, z) {
  const V = VOLCANO;
  const r = Math.hypot(x, z);
  if (r <= V.rRim + 0.05 || r >= V.rBase - 0.05) return null;
  const { phi, u } = spiralAt(r, Math.atan2(z, x));
  if (onTrailBand(phi, u)) return null;
  if (phi > TRAIL_END && phi <= TRAIL_END + 0.14 && u <= V.pathW / 2) return null;
  return { x: x / r, z: z / r };
}

// ---------------------------------------------------------------------------
// LAVA: the moat, four rivers, the western lake, small pools and the sea.
// ---------------------------------------------------------------------------
export function moatInner(theta) { return VOLCANO.rBase + 5.5 + 0.7 * Math.sin(5 * theta + 0.3); }
export function moatOuter(theta) { return VOLCANO.rBase + 12.2 + 1.0 * Math.sin(4 * theta + 1.1); }

// Rivers flow from the moat out to the sea on the four diagonals, gently
// meandering and widening toward the sea.
const RIVER_DEFS = [
  { id: "river-se", deg: 45, phase: 0.4 },
  { id: "river-sw", deg: 135, phase: 2.1 },
  { id: "river-nw", deg: 225, phase: 3.7 },
  { id: "river-ne", deg: 315, phase: 5.2 },
];
export const RIVERS = RIVER_DEFS.map((d) => {
  const pts = [];
  const hw = [];
  for (let r = 58; r <= 124; r += 1.5) {
    const a = d.deg * DEG + 0.072 * Math.sin((r - 60) / 10 + d.phase);
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
    hw.push(2.35 + (r - 58) * 0.011);
  }
  return { ...d, pts, hw };
});
function riverSD(x, z, rv, cap = Infinity) {
  // Signed distance (+ = outside the lava), per-segment half-width. Segments
  // whose box is already further than `cap` are skipped (fast grid build).
  let best = cap;
  const p = rv.pts;
  for (let i = 0; i < p.length - 1; i++) {
    const ex = Math.max(Math.abs(x - (p[i][0] + p[i + 1][0]) / 2), Math.abs(z - (p[i][1] + p[i + 1][1]) / 2)) - 1.2 - rv.hw[i + 1];
    if (ex > best) continue;
    const d = segDist(x, z, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]) - (rv.hw[i] + rv.hw[i + 1]) / 2;
    if (d < best) best = d;
  }
  return best;
}

// The western LAVA LAKE (an ellipse) with a land ISLET in the middle.
export const LAVA_LAKE = { center: [-91.8, 0], rx: 9.5, rz: 14 };
export const LAKE_ISLET = { center: [-93.4, 0], radius: 4.2 };
function lakeSD(x, z) {
  const L = LAVA_LAKE;
  const q = Math.hypot((x - L.center[0]) / L.rx, (z - L.center[1]) / L.rz);
  const dLake = (q - 1) * Math.min(L.rx, L.rz) * (q < 1 ? 1 : 1.3); // ≈ distance
  const dIslet = Math.hypot(x - LAKE_ISLET.center[0], z - LAKE_ISLET.center[1]) - LAKE_ISLET.radius;
  if (dIslet < 0) return -dIslet; // on the islet → land
  if (q < 1) return -Math.min(-dLake, dIslet); // in the lake
  return dLake;
}

// Small lava pools dotted round the land (purely scenic hazards).
export const LAVA_POOLS = [
  { id: "pool-s", center: P(88.5, 75), radius: 3.0 },
  { id: "pool-e-inner", center: P(60.8, 20), radius: 2.3 },
  { id: "pool-n", center: P(90, 270), radius: 3.2 },
  { id: "pool-w-inner", center: P(60.8, 200), radius: 2.3 },
  { id: "pool-e", center: P(88, 8), radius: 2.6 },
  { id: "pool-s-inner", center: P(60.8, 110), radius: 2.3 },
];

/**
 * LAND signed distance: + metres to the nearest lava (on land), − metres into
 * lava. Ignores bridges/platforms (those are layered on top). Volcano's crater
 * is handled separately.
 */
export function landSD(x, z) {
  const r = Math.hypot(x, z);
  const th = Math.atan2(z, x);
  let d = shoreRadius(th) - r; // the sea
  const mi = moatInner(th), mo = moatOuter(th);
  const dm = r < mi ? mi - r : r > mo ? r - mo : -Math.min(r - mi, mo - r);
  if (dm < d) d = dm;
  if (r > 50) {
    for (const rv of RIVERS) {
      const dr = riverSD(x, z, rv, d);
      if (dr < d) d = dr;
    }
  }
  if (x < -70) {
    const dl = lakeSD(x, z);
    if (dl < d) d = dl;
  }
  for (const p of LAVA_POOLS) {
    const dp = Math.hypot(x - p.center[0], z - p.center[1]) - p.radius;
    if (dp < d) d = dp;
  }
  return d;
}

// ---------------------------------------------------------------------------
// PATHS (lowland) — ring road, avenue, spokes and outer arcs.
// ---------------------------------------------------------------------------
function arc(r, d0, d1, step = 3) {
  const pts = [];
  const n = Math.max(2, Math.ceil(Math.abs(d1 - d0) / step));
  for (let i = 0; i <= n; i++) pts.push(polar(r, d0 + ((d1 - d0) * i) / n));
  return pts;
}
export const RING_ROAD_R = 76;

// The eight reserved CLEARINGS (future challenge areas). Flat paved circles,
// each with an in-world label + its own themed set-piece around the edge.
export const MAGMA_CHALLENGE_SPOTS = [
  { id: "columns", label: "Basalt Columns", center: P(80, -20), radius: 7.5 },
  { id: "obsidian", label: "Obsidian Grove", center: P(80, 20), radius: 7.5 },
  { id: "geysers", label: "Geyser Flats", center: P(80, 62), radius: 7.5 },
  { id: "forge", label: "Ember Forge", center: P(80, 118), radius: 7.5 },
  { id: "lake", label: "Lava Lake Islet", center: LAKE_ISLET.center, radius: LAKE_ISLET.radius },
  // Added with the ten challenges (2026-10-03): the south-west wilderness
  // gets its own clearing — terraces of stone steps, one per place value.
  { id: "terraces", label: "Tenfold Terraces", center: P(80, 155), radius: 7.5 },
  { id: "cinder", label: "Cinder Cones", center: P(80, 205), radius: 7.5 },
  { id: "bones", label: "Dragon Bones", center: P(80, 250), radius: 7.5 },
  { id: "garden", label: "Fire Flower Garden", center: P(80, 290), radius: 7.5 },
];
export const SUMMIT_SPOT = { id: "summit", label: "The Summit", center: trailPoint(TRAIL_PHI, -1.2) };
// The sealed rune gate on the crater lip (north side of the rim).
export const CRATER_GATE = { position: polar(VOLCANO.rCrater + 1.6, 270), rotationY: 0 };

// Lake causeway (checkerboard tiles, a nod to the classic lava levels):
// narrow + raised a little, from the ring road's lake shore to the islet.
export const LAKE_CAUSEWAY = { x1: -81.9, x2: -89.4, z: 0, halfW: 0.95, top: 0.22 };

export const MAGMA_PATHS = [
  { id: "ring", hw: 2.2, pts: arc(RING_ROAD_R, 0, 360, 3.75) },
  // Spawn plaza → ring → main moat bridge.
  { id: "avenue-s", hw: 2.4, pts: [[0, 84.3], [0, 63.4]] },
  // Outer arcs through the clearings of the south, east and north quarters.
  { id: "arc-s", hw: 2.0, pts: arc(80 * WS, 62, 118) },
  { id: "arc-e", hw: 2.0, pts: arc(80 * WS, -20, 20) },
  { id: "arc-n", hw: 2.0, pts: arc(80 * WS, 250, 290) },
  // Spokes from the ring road out to each clearing.
  ...[-20, 20, 62, 118, 155, 205, 250, 290].map((d) => ({ id: `spoke-${d}`, hw: 1.8, pts: [polar(RING_ROAD_R, d), P(74, d)] })),
  // North spoke: ring road → the hopping stones across the moat.
  { id: "spoke-n", hw: 1.8, pts: [polar(RING_ROAD_R, 270), polar(62.0, 270)] },
  // West: ring road → the lake causeway.
  { id: "lake-landing", hw: 1.8, pts: [[-RING_ROAD_R, 0], [-81.6, 0]] },
  // Lake north shore → Cinder Cones (after hopping off the islet).
  { id: "lake-north", hw: 1.6, pts: [[-91.6, -15.8], [-88.8, -23.5], [-84.6, -30.6]] },
];

// ---------------------------------------------------------------------------
// BRIDGES (decks you walk up and over) + PLATFORMS (stones, causeway, steps)
// ---------------------------------------------------------------------------
/** Where a river crosses the ring road, and the bridge across it. */
function riverBridge(rv, style) {
  // Find the river point nearest the ring radius.
  let best = 0, bd = Infinity;
  rv.pts.forEach((p, i) => {
    const d = Math.abs(Math.hypot(p[0], p[1]) - RING_ROAD_R);
    if (d < bd) { bd = d; best = i; }
  });
  const a = rv.pts[Math.max(0, best - 1)], b = rv.pts[Math.min(rv.pts.length - 1, best + 1)];
  const c = rv.pts[best];
  const tx = b[0] - a[0], tz = b[1] - a[1];
  const tl = Math.hypot(tx, tz) || 1;
  const nx = -tz / tl, nz = tx / tl; // across the river
  const half = rv.hw[best] + 3.0;
  return {
    id: `bridge-${rv.id}`, style,
    from: [c[0] - nx * half, c[1] - nz * half],
    to: [c[0] + nx * half, c[1] + nz * half],
    halfWidth: 2.1, apex: 1.1,
  };
}
export const MAGMA_BRIDGES = [
  // The grand stone bridge over the moat (spawn avenue → volcano apron).
  { id: "bridge-moat", style: "grand", from: [0, 63.6], to: [0, 50.6], halfWidth: 2.4, apex: 1.4 },
  riverBridge(RIVERS[0], "stone"),  // SE — stone arch
  riverBridge(RIVERS[1], "wood"),   // SW — wooden planks + rope
  riverBridge(RIVERS[2], "grate"),  // NW — iron grate on chains
  riverBridge(RIVERS[3], "basalt"), // NE — hexagonal basalt causeway
];

/** Deck height at (x, z) or null if not on any bridge deck. */
export function bridgeDeckAt(x, z) {
  let h = null;
  for (const b of MAGMA_BRIDGES) {
    const ax = b.from[0], az = b.from[1];
    const dx = b.to[0] - ax, dz = b.to[1] - az;
    const L2 = dx * dx + dz * dz || 1;
    const t = ((x - ax) * dx + (z - az) * dz) / L2;
    if (t < 0 || t > 1) continue;
    const perp = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (perp > b.halfWidth) continue;
    const hh = b.apex * Math.sin(Math.PI * t);
    if (h === null || hh > h) h = hh;
  }
  return h;
}

/**
 * PLATFORMS: discs ({c, r, top}) and rects ({x1,x2,z,halfW,top} along x).
 * Stepping stones need a hop (Space) — they're optional shortcuts.
 */
const stones = [];
// North moat crossing: three basalt stones (centres along θ = 270°).
[59.9, 56.7, 53.5].forEach((r, i) => stones.push({ id: `moat-stone-${i}`, c: polar(r, 270), r: 1.25, top: 0.3 }));
// Islet → lake north shore.
[[-92.8, -6.6], [-92.1, -9.8], [-92.5, -13.0]].forEach((c, i) => stones.push({ id: `lake-stone-${i}`, c, r: 1.25, top: 0.3 }));

// Basalt Columns: a climbable spiral STAIR of hex columns (0.4 m per step)
// up to a little lookout top, on the clearing's outer edge.
const STAIR_PIVOT = polar(80 * WS + 6.2, -20);
export const COLUMN_STAIR = [];
for (let i = 0; i < 9; i++) {
  const a = (-200 + i * 33) * DEG; // sweeps round the pivot
  const rr = 2.35;
  COLUMN_STAIR.push({
    id: `col-step-${i}`,
    c: [STAIR_PIVOT[0] + Math.cos(a) * rr, STAIR_PIVOT[1] + Math.sin(a) * rr],
    r: 0.95,
    top: 0.4 * (i + 1),
  });
}
// The lookout top: the central column, as high as the last step.
COLUMN_STAIR.push({ id: "col-top", c: STAIR_PIVOT, r: 1.25, top: 0.4 * 9 });
export const COLUMN_STAIR_PIVOT = STAIR_PIVOT;

export const MAGMA_PLATFORMS = [...stones, ...COLUMN_STAIR];

/** Top height of a platform under (x, z), or null. */
export function platformTopAt(x, z) {
  let h = null;
  for (const p of MAGMA_PLATFORMS) {
    if (Math.hypot(x - p.c[0], z - p.c[1]) <= p.r && (h === null || p.top > h)) h = p.top;
  }
  const C = LAKE_CAUSEWAY;
  if (x <= C.x1 && x >= C.x2 && Math.abs(z - C.z) <= C.halfW && (h === null || C.top > h)) h = C.top;
  return h;
}

// ---------------------------------------------------------------------------
// LAND HEIGHT (lowland) — gentle undulation + rocky knolls, flattened under
// the paths/clearings, dipping into the lava channels at the banks.
// ---------------------------------------------------------------------------
export const KNOLLS = [
  { c: P(91, 142), r: 6.5, h: 3.0 },
  { c: P(91, 0), r: 6, h: 2.6 },
  { c: P(90.5, 239), r: 5.5, h: 2.4 },
  { c: P(89, 305), r: 6, h: 2.6 },
  { c: P(91, 36), r: 5.5, h: 2.2 },
  { c: P(88, 168), r: 4.5, h: 1.8 },
  { c: P(61, 160), r: 3.2, h: 1.2 },
  { c: P(61, 335), r: 3.2, h: 1.2 },
];

// Per-segment boxes so the distance query can skip far-away segments.
const PATH_SEGS = [];
for (const p of MAGMA_PATHS) {
  for (let i = 0; i < p.pts.length - 1; i++) {
    const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1];
    PATH_SEGS.push({ ax, az, bx, bz, hw: p.hw, x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) });
  }
}

/** Distance to the nearest path/clearing/plaza EDGE (− = on it). */
export function pathEdgeDist(x, z) {
  let d = Infinity;
  for (const s of PATH_SEGS) {
    const bx = x < s.x0 ? s.x0 - x : x > s.x1 ? x - s.x1 : 0;
    const bz = z < s.z0 ? s.z0 - z : z > s.z1 ? z - s.z1 : 0;
    if (Math.max(bx, bz) - s.hw > d) continue;
    const dd = segDist(x, z, s.ax, s.az, s.bx, s.bz) - s.hw;
    if (dd < d) d = dd;
  }
  for (const s of MAGMA_CHALLENGE_SPOTS) {
    const dd = Math.hypot(x - s.center[0], z - s.center[1]) - s.radius;
    if (dd < d) d = dd;
  }
  const dp = Math.hypot(x - MAGMA_PLAZA.center[0], z - MAGMA_PLAZA.center[1]) - MAGMA_PLAZA.radius;
  if (dp < d) d = dp;
  return d;
}

function undulation(x, z) {
  return (
    0.45 * Math.sin(0.083 * x + 1.3) * Math.sin(0.071 * z + 0.4) +
    0.3 * Math.sin(0.19 * x - 0.15 * z + 2.1) +
    0.18 * Math.sin(0.37 * z + 0.21 * x)
  ) + 0.35;
}
function knollHeight(x, z) {
  let h = 0;
  for (const k of KNOLLS) {
    const d = Math.hypot(x - k.c[0], z - k.c[1]);
    if (d < k.r) {
      const t = 1 - d / k.r;
      h = Math.max(h, k.h * t * t * (3 - 2 * t));
    }
  }
  return h;
}

/** Exact (visual) lowland height. Lava interiors return the channel BED. */
export function landHeightRaw(x, z) {
  const r = Math.hypot(x, z);
  const sd = landSD(x, z);
  let h = 0;
  if (r > VOLCANO.rBase + 3) {
    const pe = pathEdgeDist(x, z);
    const mask = smoothstep(0.4, 4.5, pe) * smoothstep(VOLCANO.rBase + 4.5, VOLCANO.rBase + 8, r);
    h = (undulation(x, z) + knollHeight(x, z)) * mask;
  }
  if (sd < 0.6) h = LAVA_BED + (h - LAVA_BED) * smoothstep(-1.0, 0.6, sd);
  return h;
}

// Precomputed 1 m height grid (lazy) — the terrain mesh is built from the
// SAME grid, so what you see is what you stand on.
export const GRID = { min: -121, max: 121, step: 1 };
GRID.n = Math.round((GRID.max - GRID.min) / GRID.step) + 1;
let _grid = null;
export function getLandGrid() {
  if (_grid) return _grid;
  const n = GRID.n;
  const g = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    const z = GRID.min + j * GRID.step;
    for (let i = 0; i < n; i++) {
      const x = GRID.min + i * GRID.step;
      g[j * n + i] = Math.hypot(x, z) < VOLCANO.rBase - 1 ? 0 : landHeightRaw(x, z);
    }
  }
  _grid = g;
  return g;
}
function landGridAt(x, z) {
  const g = getLandGrid();
  const n = GRID.n;
  const fx = clamp((x - GRID.min) / GRID.step, 0, n - 1.0001);
  const fz = clamp((z - GRID.min) / GRID.step, 0, n - 1.0001);
  const i = Math.floor(fx), j = Math.floor(fz);
  const tx = fx - i, tz = fz - j;
  const a = g[j * n + i], b = g[j * n + i + 1], c = g[(j + 1) * n + i], d = g[(j + 1) * n + i + 1];
  // Match the mesh's triangle split (a-b-c / b-d-c).
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}

// ---------------------------------------------------------------------------
// The three region hooks the Player reads.
// ---------------------------------------------------------------------------
/** Is (x, z) molten lava (not covered by a bridge deck or platform)? */
export function magmaIsLava(x, z) {
  const r = Math.hypot(x, z);
  if (r < VOLCANO.rBase) return r < CRATER_LAVA_R; // only the (sealed) crater
  if (bridgeDeckAt(x, z) !== null) return false;
  if (platformTopAt(x, z) !== null) return false;
  return landSD(x, z) < 0;
}

/** Walkable ground height anywhere in Magma Multiples. */
export function magmaGroundHeight(x, z) {
  const r = Math.hypot(x, z);
  const deck = bridgeDeckAt(x, z);
  if (deck !== null) return deck;
  const plat = platformTopAt(x, z);
  if (plat !== null) return plat;
  if (r < VOLCANO_GROUND_R) return volcanoCollision(x, z);
  if (landSD(x, z) < 0) return LAVA_Y;
  return landGridAt(x, z);
}

/** Solid, comfortably-not-lava ground — a good spot to bounce back to. */
export function magmaIsSafe(x, z) {
  const P = 1.1;
  return (
    !magmaIsLava(x, z) && !magmaIsLava(x + P, z) && !magmaIsLava(x - P, z) &&
    !magmaIsLava(x, z + P) && !magmaIsLava(x, z - P) && !magmaSlideAt(x, z)
  );
}

/** Ash ground (for footprints): open land, not lava/bridge/platform/volcano. */
export function isOnAsh(x, z) {
  const r = Math.hypot(x, z);
  if (r < VOLCANO.rBase) return false;
  return bridgeDeckAt(x, z) === null && platformTopAt(x, z) === null && landSD(x, z) > 0.3;
}

// ---------------------------------------------------------------------------
// Deterministic PROP SCATTER (boulders, dead trees) on open land, clear of
// paths, clearings, lava and the set-pieces. Shared by renderer + colliders.
// ---------------------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Areas kept clear of scatter (set-pieces around the clearings, portal).
const KEEP_CLEAR = [
  { c: MAGMA_PLAZA.center, r: 13 },
  ...MAGMA_CHALLENGE_SPOTS.map((s) => ({ c: s.center, r: s.radius + 6.5 })),
  { c: LAVA_LAKE.center, r: 17 },
  { c: STAIR_PIVOT, r: 5 },
];
function scatter(seed, count, minR, maxR, clearPath, minGap) {
  const rand = rng(seed);
  const out = [];
  let tries = 0;
  while (out.length < count && tries < count * 60) {
    tries++;
    const a = rand() * TAU;
    const r = minR + rand() * (maxR - minR);
    const x = r * Math.cos(a), z = r * Math.sin(a);
    if (landSD(x, z) < 2.2) continue;
    if (pathEdgeDist(x, z) < clearPath) continue;
    if (KEEP_CLEAR.some((k) => Math.hypot(x - k.c[0], z - k.c[1]) < k.r)) continue;
    if (out.some((o) => Math.hypot(x - o[0], z - o[1]) < minGap)) continue;
    out.push([x, z, rand(), rand()]);
  }
  return out;
}
// [x, z, sizeRand, rotRand]
export const MAGMA_BOULDERS = scatter(7, 120, VOLCANO.rBase + 7, 112, 1.8, 3.2);
export const MAGMA_DEAD_TREES = scatter(21, 42, VOLCANO.rBase + 9, 110, 2.6, 6);
// Lanterns (lava-glass lamps) every ~14 m along the ring road, outer side.
export const MAGMA_LANTERNS = [];
for (let d = 7; d < 360; d += 12) {
  const p = polar(RING_ROAD_R + 2.9, d);
  if (landSD(p[0], p[1]) > 1.5 && bridgeDeckAt(p[0], p[1]) === null && pathEdgeDist(p[0], p[1]) > 0.2) MAGMA_LANTERNS.push(p);
}
// Torches on the trail's inner wall, every 40° of spiral.
export const TRAIL_TORCHES = [];
for (let phi = 0.7; phi < TRAIL_PHI; phi += 40 * DEG) TRAIL_TORCHES.push({ phi, pos: trailPoint(phi, -VOLCANO.pathW / 2 - 0.15), y: trailHeight(phi) });
