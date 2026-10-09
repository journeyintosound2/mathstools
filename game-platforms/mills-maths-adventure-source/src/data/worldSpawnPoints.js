/**
 * WORLD SPAWN POINTS (Phase 2H) — where the player starts and the teleport
 * targets used for testing the larger map. Pure data.
 */
import { WORLD_ZONES } from "./worldZones.js";
import { ISLAND_SPAWN, PLAZA } from "./island/islandLayout.js";

// The student arrives on Harbour Green (just off the jetty), looking north
// through the NUMBER ISLAND arch up Main Street to the Mission Plaza.
export const SPAWN_POINT = { x: ISLAND_SPAWN.x, z: ISLAND_SPAWN.z };

// "Return to Hub" lands the player on top of the plaza, in front of the fountain.
export const HUB_POINT = { x: PLAZA.center[0], z: PLAZA.center[1] + 6.5 };

// Teleport targets: the hub plus each zone centre (for DevPanel testing and a
// "Return to Hub" option). Built from the zones so it stays in sync.
export const ZONE_TELEPORTS = WORLD_ZONES.map((z) => ({
  id: z.id,
  name: z.name,
  // Stand a little in front of the zone centre so we don't spawn inside a prop.
  x: z.center[0],
  z: z.center[1] + 4,
}));

export function getSpawnPoint() {
  return { ...SPAWN_POINT };
}
