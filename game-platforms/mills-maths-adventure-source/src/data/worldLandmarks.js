/**
 * WORLD LANDMARKS (Phase 2H) — simple, themed low-poly props that give each
 * zone its identity. Pure data; the renderer (WorldScenery) maps `type` to a
 * small set of meshes. Keep the count modest for performance.
 *
 *   id, zoneId, type, position [x,z], color?, scale?
 *
 * Supported types: "fountain" (hub), "dune" (desert), "signpostPM" (±),
 * "volcano" (fdp), "crate" (algebra), "plot" (area meadow), "trophy" (grove),
 * "palm" (coast).
 */
// (2026-10-09) The rebuilt island draws its own set-pieces (IslandScenery +
// game/island/); its colliders come from data/island/islandColliders.js.
// Kept as an (empty) list so older imports keep working.
export const WORLD_LANDMARKS = [];

export function getLandmarksForZone(zoneId) {
  return WORLD_LANDMARKS.filter((l) => l.zoneId === zoneId);
}
