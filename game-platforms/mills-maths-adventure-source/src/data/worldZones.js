/**
 * WORLD ZONES — data-driven topic areas on the (now larger) island (Phase 2H).
 *
 * The map is a central hub surrounded by four topic zones, with a locked
 * Champion's Grove beyond them. Each zone renders a coloured ground patch + a
 * sign; its NPC/marker lives at the zone centre. Pure data — no React/stores.
 *
 *   id        unique zone id
 *   name      sign label
 *   topicId   curriculum topic (null for hub / grove)
 *   theme     visual theme key (used by landmarks/colours)
 *   color     accent colour for the patch / sign
 *   center    [x, z] ground position
 *   radius    patch radius (also the rough "bounds")
 *   sign      [x, z] position of the sign post
 *   npcIds    interactable ids that belong to this zone
 *   unlockId  (optional) id in worldUnlocks that gates entry
 */
// Rebuilt 2026-10-09 with the island (data/island/islandLayout.js): the hub
// is the raised Mission Plaza, Pip keeps his thermometer number line under
// Frosty Peak, Fern the ash fields under Ember Peak, Alby the lighthouse
// islet, and the grove is the Retrieval Practice Playground's school gate.
// (The zone patches + signs are drawn by IslandScenery now, not WorldZones.)
import { PLAZA, PIP_SPOT, FERN_SPOT, ALBY_SPOT, GATES, ISLAND_BOUNDS } from "./island/islandLayout.js";

export const WORLD_ZONES = [
  {
    id: "zone-hub",
    name: "Mission Plaza",
    topicId: null,
    theme: "hub",
    color: "#2a9d8f",
    center: PLAZA.center,
    radius: PLAZA.apothem,
    sign: [0, PLAZA.center[1] + PLAZA.apothem + 4], // at the foot of the plaza's south stairs
    npcIds: ["mission-board", "trophy-stand", "sage"],
  },
  {
    id: "zone-integers",
    name: "Pip's Number Line",
    topicId: "integers",
    theme: "desert",
    color: "#e9c46a",
    center: PIP_SPOT.position,
    radius: 8,
    sign: [PIP_SPOT.position[0] + 3.5, PIP_SPOT.position[1] + 6.5],
    npcIds: ["pip"],
  },
  {
    id: "zone-fdp",
    name: "Fern's Ash Fields",
    topicId: "fdp",
    theme: "volcano",
    color: "#e76f51",
    center: FERN_SPOT.position,
    radius: 8,
    sign: [FERN_SPOT.position[0] - 3.5, FERN_SPOT.position[1] + 6.5],
    npcIds: ["fern"],
  },
  {
    id: "zone-algebra",
    name: "Alby's Lighthouse",
    topicId: "algebra",
    theme: "coast",
    color: "#4cc9f0",
    center: ALBY_SPOT.position,
    radius: 7,
    sign: [ALBY_SPOT.position[0] - 4, ALBY_SPOT.position[1] - 3],
    npcIds: ["alby"],
  },
  {
    id: "zone-grove",
    name: "Retrieval Practice Playground",
    topicId: null,
    theme: "grove",
    color: "#ffd166",
    center: GATES.playground.position,
    radius: 6,
    sign: [GATES.playground.position[0] + 5, GATES.playground.position[1] + 4],
    npcIds: [], // the grove is now the SchoolYard portal entrance (W6-B)
    unlockId: "reward-grove", // locked until the grove gate opens
  },
];

// Map extent (used by the renderer + the player clamp). The walkable island is
// a circle of WALKABLE_RADIUS; the coastline drawn around it is IRREGULAR (see
// World.jsx) but the walkable area stays a clean circle so collision is simple.
// Enlarged in W6-D so the zones sit further apart and the map feels less cramped.
// (2026-10-09) The island is now ~200 m across with an irregular coast; these
// are its outer radii (the deep sea bounces you back well inside the clamp).
export const ISLAND_RADIUS = 112;
export const WALKABLE_RADIUS = ISLAND_BOUNDS.radius;
export const OCEAN_RADIUS = 700;

// Integer Dunes SNOW region (W5-F+): the SW corner around Pip is snow rather than
// grass — roughly 1/5 of the map. Grass isn't drawn here, and the player leaves
// fading footprints while walking on it. Centred on the Integer Dunes zone.
export const SAND_PATCH = { center: PIP_SPOT.position, radius: 18 };

// Fraction Volcano ASH region: the ground around Fern is ashy grey with pebbles,
// extending SLIGHTLY beyond the rock wall (bnd-fdp radius). Footprints show here
// too. Centred on the Fraction Volcano zone.
export const ASH_PATCH = { center: FERN_SPOT.position, radius: 16 };

export function getZone(id) {
  return WORLD_ZONES.find((z) => z.id === id) || null;
}

export function getZoneForTopic(topicId) {
  return WORLD_ZONES.find((z) => z.topicId === topicId) || null;
}

// Which zone a given interactable id belongs to (or null).
export function getZoneForNpc(npcId) {
  return WORLD_ZONES.find((z) => (z.npcIds || []).includes(npcId)) || null;
}
