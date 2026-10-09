/**
 * WORLD BRIDGES (W5-E polish) — raised, arched walkways the player physically
 * climbs UP and over. A bridge is a straight strip between two ground points;
 * its deck height follows a smooth arch (0 at each end → `apex` in the middle),
 * so `groundHeightAt` lifts the player as they cross. Side "rail" colliders run
 * the full length so you can't step off into the water (and can't bypass the
 * bridge through the moat gap).
 *
 * Pure data + pure helpers (no imports) so the collision engine can use it
 * without a cycle.
 *
 *   id        unique id
 *   from,to   [x,z] endpoints on flat (height-0) ground
 *   halfWidth half the walkable deck width
 *   apex      peak height at the middle of the span
 */
// (2026-10-09) The rebuilt island's bridge (Alby's rope bridge) + the jetty
// and the cove pier live in data/island/islandTerrain.js (getIslandDecks) —
// thin, layered decks. This old flat-island list is kept empty.
export const WORLD_BRIDGES = [];

// Midpoint (apex) of a bridge — where a gate/landmark can sit at the top.
export function bridgeApex(id) {
  const b = WORLD_BRIDGES.find((x) => x.id === id);
  if (!b) return null;
  return { x: (b.from[0] + b.to[0]) / 2, z: (b.from[1] + b.to[1]) / 2, height: b.apex };
}

// Height of the raised deck at (x, z), or 0 if the point isn't on any bridge.
export function bridgeHeightAt(x, z) {
  let h = 0;
  for (const b of WORLD_BRIDGES) {
    const ax = b.from[0], az = b.from[1];
    const dx = b.to[0] - ax, dz = b.to[1] - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = ((x - ax) * dx + (z - az) * dz) / len2;
    if (t <= 0 || t >= 1) continue; // past the ends → back on flat ground
    const cx = ax + dx * t, cz = az + dz * t;
    const perp = Math.hypot(x - cx, z - cz);
    if (perp > b.halfWidth) continue; // off the side of the deck
    const hh = b.apex * Math.sin(Math.PI * t); // smooth arch, 0 at ends
    if (hh > h) h = hh;
  }
  return h;
}

// Rail colliders down both sides of every bridge (keep the player on the deck
// and force the moat crossing to use the bridge). Returned as boundary colliders.
export function bridgeRailColliders() {
  const out = [];
  for (const b of WORLD_BRIDGES) {
    const ax = b.from[0], az = b.from[1];
    const dx = b.to[0] - ax, dz = b.to[1] - az;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len; // along
    const nx = -uz, nz = ux; // perpendicular
    const n = Math.max(2, Math.round(len / 1.15));
    const off = b.halfWidth + 0.35;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const cx = ax + dx * t, cz = az + dz * t;
      for (const s of [1, -1]) {
        out.push({
          id: `bridge-${b.id}-${i}-${s}`, kind: "boundary", boundaryType: "rail",
          x: cx + nx * off * s, z: cz + nz * off * s, radius: 0.5,
        });
      }
    }
  }
  return out;
}
