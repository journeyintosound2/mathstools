/**
 * REGIONS (Workstream 2, W2-A) — the world is now REGION-AWARE.
 *
 * Each region is a self-contained place the player can be in: its own spawn,
 * walkable bounds, and ground/ocean geometry. The renderer (World.jsx) and the
 * Player read the ACTIVE region (session store `currentRegionId`), so adding a
 * second region (the Schoolyard) is additive — island-1 is wrapped here UNCHANGED
 * so nothing visible differs until a second region ships.
 *
 * Pure data + a pure clamp helper. Imports only other data modules.
 *
 *   id          unique region id
 *   name        display name
 *   spawn       { x, z } where the player arrives
 *   bounds      walkable limit — { shape:"circle", radius, center? }
 *                                | { shape:"rect", width, height, center? }
 *   geometry    ground/ocean sizes + colours for the renderer
 */
import { OCEAN_RADIUS } from "./worldZones.js";
import { SPAWN_POINT } from "./worldSpawnPoints.js";
import { ISLAND_BOUNDS, GATES as ISLAND_GATES } from "./island/islandLayout.js";
import {
  islandGroundHeight, islandSlideAt, islandSpeedAt, islandHazardAt, islandHazardInfo, islandIsSafe, SEA_HINT,
} from "./island/islandTerrain.js";
import { SCHOOLYARD_BOUNDS, SCHOOLYARD_SPAWN } from "./schoolyard/schoolyardLayout.js";
import { schoolyardGroundHeight } from "./schoolyard/schoolyardTerrain.js";
import { FARM_BOUNDS, FARM_SPAWN, FARM_RETURN_PORTAL, FARM_RETURN_PORTAL_YAW } from "./farm/farmLayout.js";
import { farmGroundHeight, farmSlideAt, farmSpeedAt, farmIsSafe } from "./farm/farmTerrain.js";
import { SNOW_BOUNDS, SNOW_SPAWN, SNOW_RETURN_PORTAL, SNOW_RETURN_PORTAL_YAW } from "./snow/snowLayout.js";
import {
  snowGroundHeight, snowSlideAt, snowIceAt, snowHazardAt, snowIsSafe, snowChuteAt, chuteFrame,
  liftBoardAt, liftSeatAt, LIFT, LIFT_DISMOUNT,
} from "./snow/snowTerrain.js";
import {
  MAGMA_REGION_ID, MAGMA_NAME, MAGMA_BOUNDS, MAGMA_SPAWN, MAGMA_RETURN_PORTAL, MAGMA_RETURN_PORTAL_YAW,
  magmaGroundHeight, magmaIsLava, magmaIsSafe, magmaSlideAt,
} from "./magma/magmaLayout.js";
import {
  JUNGLE_REGION_ID, JUNGLE_NAME, JUNGLE_BOUNDS, JUNGLE_SPAWN, JUNGLE_RETURN_PORTAL, JUNGLE_RETURN_PORTAL_YAW,
  jungleGroundHeight, jungleSlideAt, jungleClimbAt, jungleBounceAt, jungleSpeedAt, jungleIsSafe,
} from "./jungle/jungleLayout.js";
import {
  CABIN_BOUNDS, CABIN_SPAWN, CABIN_DOOR, LODGE_DOOR_SNOW,
  CABIN_ARRIVE_FROM_SNOW, SNOW_ARRIVE_FROM_CABIN,
} from "./cabin/cabinLayout.js";

export const DEFAULT_REGION_ID = "island-1";

export const REGIONS = {
  // NUMBER ISLAND (rebuilt 2026-10-09) — the hub: a big, sunny island
  // (~2.5× across the old one) in a turquoise sea. Everything lives in
  // data/island/ + game/IslandScenery.jsx. Hooks (the snow/jungle set):
  // LAYERED ground (the raised plaza + its stairs, the jetty, the pier, the
  // rope bridge), cliffs + Ember Peak's upper cone slide, the shallows are
  // slow, and deep water / lava bounce you back to the last dry spot.
  // Every world gate stands in a landscape that foreshadows its world; you
  // come BACK through a gate to land right in front of it (`arrive`).
  "island-1": {
    id: "island-1",
    name: "Number Island",
    spawn: { x: SPAWN_POINT.x, z: SPAWN_POINT.z },
    bounds: ISLAND_BOUNDS,
    groundHeight: islandGroundHeight,
    slideAt: islandSlideAt,
    speedAt: islandSpeedAt,
    isLava: islandHazardAt,
    hazardInfo: islandHazardInfo,
    hazardHint: SEA_HINT,
    hazardSound: "splash",
    isSafe: islandIsSafe,
    cameraTerrainClamp: true,
    maxFrameDelta: 1 / 15,
    arriveYaw: 0, // arrive looking north, through the arch up Main Street
    badgeRange: 60,
    drawRange: 180,
    geometry: {
      walkableRadius: ISLAND_BOUNDS.radius,
      oceanRadius: OCEAN_RADIUS,
      grassColor: "#7cc35a",
      beachColor: "#f3e1a6",
      oceanColor: "#2fb4c8",
      // A bright tropical morning: a pale aqua horizon (the fog — the far
      // sea + distant islands haze into it) and a deep blue overhead.
      skyColor: "#cfeefa",
      skyTop: "#3f8fe0",
      fogNear: 95,
      fogFar: 430,
    },
    // The five world gates (positions + facings from islandLayout GATES).
    portals: [
      { id: "island-to-schoolyard", position: ISLAND_GATES.playground.position, radius: 2.0, rotationY: ISLAND_GATES.playground.yaw, target: "schoolyard", label: "Retrieval Practice Playground", lock: "playground" },
      { id: "island-to-farm", position: ISLAND_GATES.farm.position, radius: 2.0, rotationY: ISLAND_GATES.farm.yaw, target: "farm-parts-whole", label: "Fraction Farm", variant: "haybale" },
      { id: "island-to-snow", position: ISLAND_GATES.snow.position, radius: 2.0, rotationY: ISLAND_GATES.snow.yaw, target: "snow-sums", label: "Snowball Sums", variant: "igloo" },
      { id: "island-to-magma", position: ISLAND_GATES.magma.position, radius: 2.0, rotationY: ISLAND_GATES.magma.yaw, target: MAGMA_REGION_ID, label: MAGMA_NAME, variant: "volcano" },
      { id: "island-to-jungle", position: ISLAND_GATES.jungle.position, radius: 2.0, rotationY: ISLAND_GATES.jungle.yaw, target: JUNGLE_REGION_ID, label: JUNGLE_NAME, variant: "jungle" },
    ],
  },

  // The Schoolyard (W2) — a flat, rectangular second region rendered by
  // SchoolyardScenery.jsx. `flatGround` tells the Player to use height 0 here
  // (island-1's plateau/stairs don't apply). Reached via the Teleport Gate (W2-C).
  "schoolyard": {
    id: "schoolyard",
    name: "Retrieval Practice Playground",
    spawn: { x: SCHOOLYARD_SPAWN.x, z: SCHOOLYARD_SPAWN.z },
    bounds: SCHOOLYARD_BOUNDS,
    // Terraced ground (three tiers + central stairs). Player/Interactables read
    // this instead of island-1's plateau/stairs.
    groundHeight: schoolyardGroundHeight,
    geometry: {
      // Ground is drawn by SchoolyardScenery; only skyColor is used by World.
      skyColor: "#cfe8ff",
      grassColor: "#717a85",
      beachColor: "#717a85",
      oceanColor: "#717a85",
      walkableRadius: 30,
      oceanRadius: 40,
    },
    // Return Teleport Gate → back to the island. On the front tier's east edge,
    // clear of the trees/NPCs/planters (moved anticlockwise off the corner tree).
    portals: [
      { id: "schoolyard-to-island", position: [34, 12], radius: 2.0, rotationY: -Math.PI / 2, target: "island-1", label: "Number Island", arrive: ISLAND_GATES.playground.arrive, arriveYaw: ISLAND_GATES.playground.arriveYaw },
    ],
  },

  // FRACTION FARM (rebuilt 2026-10-07) — a big, ROLLING farm about the
  // Emerald Jungle's size: rolling hills separate themed areas (the
  // homestead, the orchard + packing shed, the carrot patch, the old sawmill
  // on the creek, the dairy, the cattle run, the long paddock, the grain
  // silos, the glasshouse gardens, the market green), each home to one of
  // the ten fraction challenges, found by exploring the farm tracks.
  // Everything lives in data/farm/ + game/FarmScenery.jsx. Hooks (as the
  // jungle's): LAYERED ground (bridge decks), the steep outer hills slide,
  // wading the knee-deep creek + duck pond is slower.
  "farm-parts-whole": {
    id: "farm-parts-whole",
    name: "Fraction Farm",
    spawn: { x: FARM_SPAWN.x, z: FARM_SPAWN.z },
    bounds: FARM_BOUNDS,
    groundHeight: farmGroundHeight,
    slideAt: farmSlideAt,
    speedAt: farmSpeedAt,
    isSafe: farmIsSafe,
    cameraTerrainClamp: true,
    maxFrameDelta: 1 / 15,
    arriveYaw: 0, // arrive looking north, up the drive through the farm gate
    // The farm is big + hilly: host badges show within 55 m (they'd float
    // over the hills otherwise) and characters draw within 170 m.
    badgeRange: 55,
    drawRange: 170,
    geometry: {
      // Ground is drawn by FarmScenery; skyColor = the warm peach horizon of
      // the farm's LATE-AFTERNOON light (fog matches, so the rolling hills
      // haze into a golden distance).
      skyColor: "#f4dcae",
      skyTop: "#5aa6e0",
      fogNear: 80,
      fogFar: 380,
      grassColor: "#8ecf6a",
      beachColor: "#8ecf6a",
      oceanColor: "#8ecf6a",
      walkableRadius: 160,
      oceanRadius: 170,
    },
    portals: [
      { id: "farm-to-island", position: FARM_RETURN_PORTAL, radius: 2.0, rotationY: FARM_RETURN_PORTAL_YAW, target: "island-1", label: "Number Island", variant: "haybale", arrive: ISLAND_GATES.farm.arrive, arriveYaw: ISLAND_GATES.farm.arriveYaw },
    ],
  },

  // Snowball Sums (S1) — a LARGE, flat TWILIGHT snow world (same dimensions
  // as Fraction Farm) rendered by SnowScenery.jsx: aurora overhead, snowmen,
  // Christmas trees, waddling penguins, an ice rink with real slide physics,
  // and TEN reserved in-world challenge areas. Reached via the igloo gate
  // east of Integer Dunes.
  "snow-sums": {
    id: "snow-sums",
    name: "Snowball Sums",
    spawn: { x: SNOW_SPAWN.x, z: SNOW_SPAWN.z },
    bounds: SNOW_BOUNDS,
    // Rebuilt 2026-10-08: a big alpine valley (data/snow/). LAYERED ground
    // (bridge decks + ice floes); the rim + cliffs slide you back; the pond,
    // frozen river, puddles + runouts are slippery ice (sloping ice pulls
    // you downhill); the glacier lake is too cold to stand in (you hop back
    // out, like Magma's lava); the toboggan CHUTES ride you down on a sled;
    // the CHAIRLIFT carries you up Big Sled Hill.
    groundHeight: snowGroundHeight,
    slideAt: snowSlideAt,
    iceAt: snowIceAt,
    isLava: snowHazardAt,
    hazardHint: "Brrr — that water's freezing! 🥶 Use the bridges (or hop the ice floes).",
    hazardSound: "splash",
    isSafe: snowIsSafe,
    chuteAt: snowChuteAt,
    chuteFrame,
    liftBoardAt,
    liftSeatAt,
    liftDismount: LIFT_DISMOUNT,
    liftSpeed: LIFT.speed,
    liftLength: LIFT.len,
    cameraTerrainClamp: true,
    maxFrameDelta: 1 / 15,
    arriveYaw: 0, // arrive looking north up the valley
    badgeRange: 55,
    drawRange: 170,
    geometry: {
      // A crisp WINTER AFTERNOON turning to dusk: a pale lilac-white horizon
      // (the fog — distant peaks haze into it), deep blue overhead, the low
      // sun warm on the snow, cabin windows already glowing.
      skyColor: "#e3e3ef",
      skyTop: "#3f6fc0",
      fogNear: 85,
      fogFar: 400,
      grassColor: "#eef3fa",
      beachColor: "#eef3fa",
      oceanColor: "#eef3fa",
      walkableRadius: 140,
      oceanRadius: 150,
    },
    portals: [
      { id: "snow-to-island", position: SNOW_RETURN_PORTAL, radius: 2.0, rotationY: SNOW_RETURN_PORTAL_YAW, target: "island-1", label: "Number Island", variant: "igloo", arrive: ISLAND_GATES.snow.arrive, arriveYaw: ISLAND_GATES.snow.arriveYaw },
      // The lodge's AJAR front door → the Lodge Interior (CB). The door
      // visual lives on the lodge (SnowScenery LodgeDoor) — variant
      // "cabindoor" renders NO portal swirl. Door-to-door travel: `arrive`
      // puts the traveller just inside the matching doorway.
      {
        id: "snow-to-cabin", position: LODGE_DOOR_SNOW.position, radius: LODGE_DOOR_SNOW.radius,
        rotationY: 0, target: "cabin", label: "The Lodge", variant: "cabindoor",
        arrive: CABIN_ARRIVE_FROM_SNOW,
      },
    ],
  },

  // --- MAGMA MULTIPLES — the SIXTH region: a volcano / lava world about
  // three times Fraction Farm's area. A 32 m volcano in the middle with a
  // spiral summit trail (the crater is sealed for now), a lava moat, four
  // lava rivers, a lava lake and eight reserved clearings joined by a ring
  // road + bridges. Land only (no characters / maths yet). Everything lives
  // in data/magma/ + game/MagmaScenery.jsx. The extra hooks below are read
  // by Player.jsx and are only defined for this region:
  //   isLava(x,z)   → touching lava pops you back to the last safe spot
  //   isSafe(x,z)   → solid ground worth remembering as "safe"
  //   slideAt(x,z)  → the volcano's steep flank: slide down, can't walk up
  //   cameraTerrainClamp → keep the follow camera above the mountain
  [MAGMA_REGION_ID]: {
    id: MAGMA_REGION_ID,
    name: MAGMA_NAME,
    spawn: { x: MAGMA_SPAWN.x, z: MAGMA_SPAWN.z },
    bounds: MAGMA_BOUNDS,
    groundHeight: magmaGroundHeight,
    isLava: magmaIsLava,
    isSafe: magmaIsSafe,
    slideAt: magmaSlideAt,
    cameraTerrainClamp: true,
    maxFrameDelta: 1 / 15,
    arriveYaw: 0, // arrive looking north, straight up the avenue at the volcano
    geometry: {
      // Ground is drawn by MagmaScenery; skyColor = the hazy sunset horizon
      // (fog matches). The world is big, so the fog sits much further out
      // than the other regions' 55–98 — the volcano reads from the spawn.
      skyColor: "#e0834f",
      skyTop: "#4a1631",
      fogNear: 85,
      fogFar: 290,
      grassColor: "#3e302c",
      beachColor: "#3e302c",
      oceanColor: "#3e302c",
      walkableRadius: 100,
      oceanRadius: 110,
    },
    portals: [
      { id: "magma-to-island", position: MAGMA_RETURN_PORTAL, radius: 2.0, rotationY: MAGMA_RETURN_PORTAL_YAW, target: "island-1", label: "Number Island", variant: "volcano", arrive: ISLAND_GATES.magma.arrive, arriveYaw: ISLAND_GATES.magma.arriveYaw },
    ],
  },

  // --- EMERALD JUNGLE — the SEVENTH region: a lush jungle valley about
  // twice Magma Multiples' land. A river runs the length of the valley from a
  // waterfall off the northern plateau to the Lily Lagoon; tree-covered hills
  // (Canopy Hill, Mossback Ridge), the Temple Ruins, Redwood Hollow, the
  // Great Tree and ten reserved clearings. Land only (no maths yet).
  // Everything lives in data/jungle/ + game/JungleScenery.jsx. Hooks read by
  // Player.jsx (only defined here):
  //   groundHeight(x,z,y) → LAYERED ground (bridges/decks/stairs you can be under)
  //   slideAt(x,z,y)      → cliffs + the rim: slide down, can't walk up
  //   climbAt(x,z,y)      → vine walls: push into them to climb
  //   bounceAt(x,z,y)     → bouncy mushroom caps launch you on landing
  //   speedAt(x,z,y)      → wading through the knee-deep water is slower
  [JUNGLE_REGION_ID]: {
    id: JUNGLE_REGION_ID,
    name: JUNGLE_NAME,
    spawn: { x: JUNGLE_SPAWN.x, z: JUNGLE_SPAWN.z },
    bounds: JUNGLE_BOUNDS,
    groundHeight: jungleGroundHeight,
    slideAt: jungleSlideAt,
    climbAt: jungleClimbAt,
    bounceAt: jungleBounceAt,
    speedAt: jungleSpeedAt,
    isSafe: jungleIsSafe,
    cameraTerrainClamp: true,
    maxFrameDelta: 1 / 15,
    arriveYaw: 0, // arrive looking north, up the river valley toward the falls
    geometry: {
      // Ground is drawn by JungleScenery; skyColor = the soft blue-green haze
      // on the horizon (fog matches — Wooded-Kingdom-style misty distance).
      skyColor: "#bcdcd3",
      skyTop: "#3f93dc",
      fogNear: 70,
      fogFar: 360,
      grassColor: "#5a9838",
      beachColor: "#5a9838",
      oceanColor: "#5a9838",
      walkableRadius: 160,
      oceanRadius: 170,
    },
    portals: [
      { id: "jungle-to-island", position: JUNGLE_RETURN_PORTAL, radius: 2.0, rotationY: JUNGLE_RETURN_PORTAL_YAW, target: "island-1", label: "Number Island", variant: "jungle", arrive: ISLAND_GATES.jungle.arrive, arriveYaw: ISLAND_GATES.jungle.arriveYaw },
    ],
  },

  // --- THE LODGE INTERIOR (CB) — the FIFTH region: the warm inside of the
  // ski lodge, entered through the lodge's ajar front door in Snowball Sums.
  // A large log-cabin great room (fireplace, tables, bookshelves, windows)
  // with a separate bedroom, rendered by CabinScenery.jsx. Pip hosts
  // fireside addition by the hearth.
  "cabin": {
    id: "cabin",
    name: "The Lodge",
    spawn: { x: CABIN_SPAWN.x, z: CABIN_SPAWN.z },
    bounds: CABIN_BOUNDS,
    groundHeight: () => 0, // plank floor
    geometry: {
      // Interior: a deep warm brown "sky" — the rafters lost in shadow
      // above the open-top dollhouse view (fog matches, so the room's
      // corners fall away into warm darkness).
      skyColor: "#241a12",
      grassColor: "#5a4630",
      beachColor: "#5a4630",
      oceanColor: "#5a4630",
      walkableRadius: 40,
      oceanRadius: 50,
    },
    portals: [
      // The south door back out to the snow (its twin ajar door).
      {
        id: "cabin-to-snow", position: CABIN_DOOR.position, radius: CABIN_DOOR.radius,
        rotationY: Math.PI, target: "snow-sums", label: "Snowball Sums", variant: "cabindoor",
        arrive: SNOW_ARRIVE_FROM_CABIN,
      },
    ],
  },
};

export function getRegion(id) {
  return REGIONS[id] || REGIONS[DEFAULT_REGION_ID];
}

export function getAllRegions() {
  return Object.values(REGIONS);
}

/**
 * Clamp a point (x, z) to a region's walkable bounds. Supports a centred circle
 * (island-1) or an axis-aligned rectangle (the Schoolyard). Pure — returns a new
 * { x, z }. Falls back to a generous circle if bounds are missing/unknown.
 */
export function clampToBounds(x, z, bounds) {
  if (!bounds) return { x, z };
  const cx = (bounds.center && bounds.center[0]) || 0;
  const cz = (bounds.center && bounds.center[1]) || 0;

  if (bounds.shape === "rect") {
    const hw = (bounds.width || 0) / 2;
    const hh = (bounds.height || 0) / 2;
    return {
      x: Math.max(cx - hw, Math.min(cx + hw, x)),
      z: Math.max(cz - hh, Math.min(cz + hh, z)),
    };
  }

  // Default: circle.
  const r = bounds.radius || ISLAND_BOUNDS.radius;
  const dx = x - cx;
  const dz = z - cz;
  const dist = Math.hypot(dx, dz);
  if (dist > r) return { x: cx + (dx / dist) * r, z: cz + (dz / dist) * r };
  return { x, z };
}
