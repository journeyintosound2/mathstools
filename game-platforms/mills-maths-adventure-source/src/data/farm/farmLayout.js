/**
 * FRACTION FARM — LAYOUT (rebuilt 2026-10-07 as a big, rolling, explorable
 * farm). The single source of truth for WHERE everything is: the property
 * boundary, the arrival, every themed area and its challenge station, the
 * homestead, the farm tracks, the creek + duck pond, the hills, the fields.
 * Pure constants + tiny helpers — the terrain (farmTerrain.js), the scatter
 * (farmProps.js), the colliders, the renderer and the checks all read these
 * numbers, so they can never drift apart.
 *
 * THE WORLD (≈ the Emerald Jungle's size): a 284 × 252 m property inside a
 * white picket fence, ringed by rolling outer hills. Big ROLLING HILLS
 * separate THEMED AREAS, each home to one of the ten fraction challenges:
 *
 *   Arrival + farm gate (S) ─ the drive ─ THE HOMESTEAD (centre): barn,
 *     farmhouse, chooks, pig pen … and the FARM SHOP at its front gate
 *   West: Orchard Hill + the PACKING SHED (Crate Packing) · the CARROT PATCH
 *     (Order the Parts) · the OLD SAWMILL on the creek (Plank the Gap)
 *   North: WINDMILL HILL (a big sail windmill on top) · the DAIRY (Milk
 *     Splitter) · the CATTLE RUN stockyards (The Round-Up) · the LONG
 *     PADDOCK hay meadow (Fence Challenge)
 *   East: the GRAIN SILOS + weighbridge (Weigh Station) · Sheep Downs · the
 *     GLASSHOUSE GARDENS (Veggie Plot) · the MARKET GREEN (Trading Post)
 *
 * Every challenge STAGE is unchanged inside — its constants below are its old
 * arrangement translated to the new spot, and each stands on a level PAD
 * (FARM_PADS) whose height the renderer + camera add (farmPadLevel). Every
 * challenge camera films from the SOUTH, so each area opens to the south.
 *
 * Coordinates: x = east, z = SOUTH (three.js), so north is −z. 1 unit = 1 m.
 */

export const FARM_REGION_ID = "farm-parts-whole";

// The property: a white-picket boundary fence (non-jumpable) at ±142 / ±126;
// the clamp bounds sit just outside it.
export const BOUNDARY_FENCE = { halfW: 142, halfD: 126 };
export const FARM_BOUNDS = { shape: "rect", width: 290, height: 258, center: [0, 0] };

// ---------------------------------------------------------------------------
// ARRIVAL — you step out of the haybale gate on a gentle rise just inside the
// south fence, looking NORTH up the drive through the timber farm-gate arch.
// ---------------------------------------------------------------------------
export const FARM_SPAWN = { x: 0, z: 106 };
// The haybale gate home stands just behind-right of the arrival spot (clear
// of the follow camera, which sits behind the player), facing the arrivals.
export const FARM_RETURN_PORTAL = [8.5, 114.5];
export const FARM_RETURN_PORTAL_YAW = -2.4;
export const FARM_ENTRY_ARCH = { position: [0, 95.5], width: 9.5, height: 6.2, text: "FRACTION FARM" };
// Mills greets arrivals just inside the arch (the interactable keeps this name).
export const FARM_WELCOME_SIGN = { position: [-6.5, 100.5], rotationY: 0.5, text: "Welcome to Fraction Farm!" };
// The trophy cabinet stands on the arrival green, west of the gate, facing
// east toward the arrivals (rotationY π/2 → front west; −π/2 → front east).
export const FARM_RECORDS_STAND = { id: "farm-records", position: [-12, 110.5], rotationY: -Math.PI / 2 + 0.25 };
// A painted map of the farm on a big board by the drive, so students can
// plan where to explore.
export const FARM_MAP_BOARD = { position: [7.5, 99], rotationY: -0.35 };

// ---------------------------------------------------------------------------
// THE HOMESTEAD (centre) — barn, farmhouse, feed silo, chook pen, the barn
// yard, an Aussie water windmill + tank, and the pig pen next door.
// ---------------------------------------------------------------------------
export const FARM_YARD = { center: [0, 34], radius: 13 };
export const FARM_BARN = { x: 0, z: 14, w: 16, d: 12, wall: "#c0442f", roof: "#7e2e22", trim: "#f3e9d6" };
export const FARM_HOUSE = { x: -25, z: 36, w: 12, d: 9, rotationY: Math.PI / 2 }; // front faces east (the yard)
export const FARM_SILO = { x: 15, z: 12, radius: 2.4, height: 9.5 };
export const FARM_COOP = { x: 22, z: 30, w: 6, d: 4 };
export const FARM_TRACTOR = { position: [-11, 22], rotationY: 0.6 };

// ---------------------------------------------------------------------------
// THE FARM SHOP (F13) — PERCENTAGES CAPSTONE: the farm-gate stall at the
// homestead's front, JUST IN FRONT of the water windmill (behind it to the
// north). The stall faces south, toward the drive.
// ---------------------------------------------------------------------------
export const SHOP_AREA = { x: 14, z: 58 };
export const SHOP_VIEW_SPOT = [14, 66];
export const SHOP_SIGN = { id: "farm-shop-sign", position: [14, 63] };
export const FARM_WINDMILL = { x: SHOP_AREA.x, z: SHOP_AREA.z - 8, height: 9 };
export const FARM_TANK = { x: SHOP_AREA.x + 5.5, z: SHOP_AREA.z - 9, radius: 2.3, height: 3.2 };

// Fenced paddocks — { x, z, w, d } rects with a GATE GAP (`gate`: side,
// offset, width). Same shape as before so the fence renderer, colliders and
// checks work unchanged.
// `gate2` (optional) is a second gate. `style`: "rail" (post-and-rail,
// default), "wire" (the low chook-run mesh). Every paddock fence is JUMPABLE.
export const FARM_PADDOCKS = [
  { id: "pig-pen", x: 41, z: 34, w: 20, d: 15, gate: { side: "west", offset: 0, width: 4 }, label: "Pig Pen" },
  {
    id: "veggie-garden", x: 92, z: 26, w: 26, d: 21, gate: { side: "south", offset: 7, width: 4 },
    gate2: { side: "north", offset: -2, width: 4 }, label: "Veggie Plot",
  },
  // The cattle paddock (west of the stockyards) — its gate opens onto the race.
  { id: "cattle-paddock", x: -67, z: -108, w: 26, d: 20, gate: { side: "east", offset: 5, width: 4 }, label: "Cattle Paddock" },
  // The dairy herd's paddock, across the creek from the dairy.
  { id: "dairy-paddock", x: -130, z: -52, w: 16, d: 20, gate: { side: "east", offset: -4, width: 4 }, label: "Dairy Paddock" },
  // The chook run beside the coop (a low wire fence).
  { id: "chook-run", x: 22, z: 34, w: 14, d: 12, gate: { side: "west", offset: 2, width: 3 }, label: "Chook Run", style: "wire" },
];
// Mud wallow inside the pig pen + where the pigs may wander (2 m off the rails).
export const FARM_MUD = { center: [43, 35], radius: 4.6 };
export const PIG_WANDER = { minX: 33, maxX: 49, minZ: 28.5, maxZ: 39.5 };

// ---------------------------------------------------------------------------
// THE CREEK + DUCK POND — a knee-deep creek winds from the north-west hills
// past the dairy and the old sawmill's water wheel, down between the orchard
// and the homestead, and spills into the duck pond south-west of the arrival.
// Wade it anywhere (slowly); the farm tracks cross on wooden bridges.
// ---------------------------------------------------------------------------
export const FARM_CREEK_CTRL = [
  [-158, -100], [-138, -90], [-124, -76], [-118, -58], [-112, -44], [-96, -34], [-80, -30],
  [-68, -26], [-62.5, -14], [-60, 0], [-52, 14], [-44, 26], [-41, 42], [-41, 58], [-38, 72], [-33, 84],
];
export const FARM_POND = { center: [-29, 95], radius: 10 };

// ---------------------------------------------------------------------------
// THE CHALLENGE STATIONS (each one's old arrangement, moved to its area)
// ---------------------------------------------------------------------------

// THE CHALLENGE FENCE (F2) — the LONG PADDOCK: a 40 m post-and-rail fence
// across the hay meadow in the north-east, RED post west, BLUE post east.
export const CHALLENGE_FENCE = {
  x1: 44,
  x2: 84,
  z: -98,
  redPost: { color: "#e63946", label: "Red post" },
  bluePost: { color: "#3a7bd5", label: "Blue post" },
};
export const CHALLENGE_FENCE_LENGTH = CHALLENGE_FENCE.x2 - CHALLENGE_FENCE.x1; // 40 m
export const CHALLENGE_SIGN = { id: "farm-fence-sign", position: [CHALLENGE_FENCE.x2 + 3, CHALLENGE_FENCE.z + 2] };

// THE ROUND-UP (F3) — the CATTLE RUN stockyards (north, west of Windmill
// Hill): a gated sorting pen with the herd field in front (south) of it.
export const ROUNDUP_PEN = {
  id: "roundup-pen", x: -36, z: -102, w: 10, d: 7,
  gate: { side: "south", offset: 0, width: 4 }, label: "Sorting Pen",
};
export const ROUNDUP_FIELD = { x1: ROUNDUP_PEN.x - 4.5, z1: ROUNDUP_PEN.z + 6, x2: ROUNDUP_PEN.x + 8, z2: ROUNDUP_PEN.z + 14.5 };
export const ROUNDUP_GATE_OUT = [ROUNDUP_PEN.x, ROUNDUP_PEN.z + 5.6];
export const ROUNDUP_GATE_IN = [ROUNDUP_PEN.x, ROUNDUP_PEN.z + 2.2];
export const ROUNDUP_SIGN = { id: "farm-roundup-sign", position: [ROUNDUP_PEN.x + 6.5, ROUNDUP_PEN.z + 1] };
export const ROUNDUP_IDLE_HERD = 12;

// ORDER THE PARTS (F4) — the CARROT PATCH (south-west): five carrots in a row.
export const ORDER_GARDEN = {
  x: -64, z: 84,
  count: 5, spacing: 2.3,
  bedW: 13, bedD: 5,
};
export const ORDER_VIEW_SPOT = [ORDER_GARDEN.x, ORDER_GARDEN.z + 5];
export const ORDER_SIGN = { id: "farm-order-sign", position: [ORDER_GARDEN.x - 7, ORDER_GARDEN.z + 4.5] };
export function orderSlotX(i) {
  return ORDER_GARDEN.x + (i - (ORDER_GARDEN.count - 1) / 2) * ORDER_GARDEN.spacing;
}

// CRATE PACKING (F6) — the ORCHARD PACKING SHED (west, at the foot of
// Orchard Hill): apples + pears in piles, a row of crate sizes in front.
export const CRATE_AREA = { x: -60, z: 40 };
export const CRATE_PILES = [[CRATE_AREA.x - 3, CRATE_AREA.z - 0.2], [CRATE_AREA.x + 3, CRATE_AREA.z - 0.2]];
export const CRATE_ROW = { z: CRATE_AREA.z + 4, spacing: 1.6 };
export const CRATE_VIEW_SPOT = [CRATE_AREA.x - 8.5, CRATE_AREA.z + 2.5];
export const CRATE_SIZES = [1, 2, 3, 4, 5, 6, 8, 12];
export function crateSlotX(i) {
  return CRATE_AREA.x + (i - (CRATE_SIZES.length - 1) / 2) * CRATE_ROW.spacing;
}
export const CRATE_SIGN = { id: "farm-crate-sign", position: [CRATE_AREA.x - 7, CRATE_AREA.z + 6] };

// THE MILK SPLITTER (F8) — the DAIRY (north-west): the machine, its two
// chutes and the milk tanker, the milking shed behind.
export const MILK_AREA = { x: -94, z: -64 };
export const MILK_CHUTE_STOPS = [MILK_AREA.x - 4.5, MILK_AREA.z + 2.5];
export const MILK_CHUTE_REPEATS = [MILK_AREA.x + 4.5, MILK_AREA.z + 2.5];
export const MILK_TRUCK = { position: [MILK_AREA.x - 8.5, MILK_AREA.z - 5], rotationY: 0.9 };
export const MILK_SIGN = { id: "farm-milk-sign", position: [MILK_AREA.x + 7, MILK_AREA.z + 5.5] };
export const MILK_VIEW_SPOT = [MILK_AREA.x + 6, MILK_AREA.z + 8.5];

// THE WEIGH STATION (F9) — the GRAIN SILOS + weighbridge (east).
export const WEIGH_AREA = { x: 62, z: -30 };
export const WEIGH_SIGN = { id: "farm-weigh-sign", position: [WEIGH_AREA.x - 5.5, WEIGH_AREA.z + 4.5] };
export const WEIGH_VIEW_SPOT = [WEIGH_AREA.x - 6, WEIGH_AREA.z + 7];

// THE TRADING POST (F10) — the MARKET GREEN (south-east): three stalls.
export const TRADE_AREA = { x: 62, z: 84 };
export const TRADE_STALL_OFFSETS = {
  fraction: [-3.6, -1.0],
  decimal: [0, -2.2],
  percent: [3.6, -1.0],
};
export const TRADE_TABLE_OFFSET = [0, 1.6];
export const TRADE_SIGN = { id: "farm-trade-sign", position: [TRADE_AREA.x - 6, TRADE_AREA.z + 4.5] };
export const TRADE_VIEW_SPOT = [TRADE_AREA.x - 6.5, TRADE_AREA.z + 6.5];

// THE VEGGIE PLOT (F11) — the GLASSHOUSE GARDENS (east): the unit-square bed
// in the middle of the walled veggie garden (FARM_PADDOCKS "veggie-garden").
export const VEGGIE_AREA = { x: 92, z: 24 };
export const VEGGIE_BED = 6;
export const VEGGIE_VIEW_SPOT = [VEGGIE_AREA.x, VEGGIE_AREA.z + 7];
export const VEGGIE_SIGN = { id: "farm-veggie-sign", position: [VEGGIE_AREA.x - 7, VEGGIE_AREA.z + 9] };

// PLANK THE GAP (F12) — the OLD SAWMILL on the creek (west): the fence gap +
// the plank pile, with the mill + its water wheel just west.
export const PLANK_AREA = { x: -46, z: -16 };
export const PLANK_VIEW_SPOT = [PLANK_AREA.x, PLANK_AREA.z + 8];
export const PLANK_SIGN = { id: "farm-plank-sign", position: [PLANK_AREA.x + 9, PLANK_AREA.z + 3] };

// ---------------------------------------------------------------------------
// LEVEL PADS — every station (and the homestead + arrival) stands on flat
// ground. q = ((|dx|/rx)^p + (|dz|/rz)^p)^(1/p) ≤ 1 is level (p = 2 → an
// ellipse, larger p → squarer). `stage` names the challenge filmed there.
// ---------------------------------------------------------------------------
export const FARM_PADS = [
  { id: "arrival", c: [-1, 105], rx: 16, rz: 11.5, p: 2.4 },
  { id: "homestead", c: [1, 38], rx: 31, rz: 31, p: 3, stage: "shop" },
  { id: "crate", c: [-61, 41], rx: 15, rz: 11.5, p: 2.6, stage: "crate" },
  { id: "order", c: [-65, 86], rx: 14, rz: 9, p: 2.6, stage: "order" },
  { id: "milk", c: [-94, -68], rx: 17, rz: 16, p: 3, stage: "milk" }, // + the milking shed behind
  { id: "roundup", c: [-34.5, -96], rx: 15.5, rz: 13, p: 3, stage: "roundup" },
  { id: "plank", c: [-46, -13], rx: 13, rz: 11, p: 2.6, stage: "plank" },
  { id: "fence", c: [65, -97], rx: 27, rz: 6.5, p: 6, stage: "fence" },
  { id: "weigh", c: [60, -27], rx: 13.5, rz: 10.5, p: 2.6, stage: "weigh" },
  { id: "veggie", c: [91.5, 26], rx: 17, rz: 13.5, p: 4, stage: "veggie" },
  { id: "trade", c: [60, 86], rx: 14.5, rz: 9.5, p: 2.6, stage: "trade" },
  { id: "summit", c: [8, -55], rx: 11, rz: 11, p: 2 },
  // Building terraces (`levelOf` → share that pad's level: one flat yard).
  { id: "packing", c: [-61, 28.5], rx: 9, rz: 5.5, p: 4, levelOf: "crate" },
  { id: "sawmill", c: [-57.5, -27], rx: 6.5, rz: 5.5, p: 4, levelOf: "plank" },
  { id: "glasshouses", c: [90, 9], rx: 14.5, rz: 5, p: 5, levelOf: "veggie" },
  { id: "shearing", c: [121.5, -42], rx: 8, rz: 5.5, p: 4 },
];
/** Which pad each challenge stands on. */
export const CHALLENGE_PAD = {
  fence: "fence", roundup: "roundup", order: "order", crate: "crate", milk: "milk",
  weigh: "weigh", trade: "trade", veggie: "veggie", plank: "plank", shop: "homestead",
};

// ---------------------------------------------------------------------------
// THE THEMED AREAS (names + where their label floats) — for the map board,
// the near-labels and the signposts.
// ---------------------------------------------------------------------------
export const FARM_AREAS = [
  { id: "homestead", name: "The Homestead", icon: "🏡", c: [0, 30] },
  { id: "shop", name: "Farm Gate Shop", icon: "🛒", c: [SHOP_AREA.x, SHOP_AREA.z], challenge: "shop" },
  { id: "orchard", name: "Orchard & Packing Shed", icon: "🍎", c: [CRATE_AREA.x, CRATE_AREA.z - 4], challenge: "crate" },
  { id: "carrots", name: "Carrot Patch", icon: "🥕", c: [ORDER_GARDEN.x, ORDER_GARDEN.z], challenge: "order" },
  { id: "dairy", name: "The Dairy", icon: "🥛", c: [MILK_AREA.x, MILK_AREA.z], challenge: "milk" },
  { id: "cattle", name: "Cattle Run", icon: "🐄", c: [ROUNDUP_PEN.x, ROUNDUP_PEN.z + 6], challenge: "roundup" },
  { id: "sawmill", name: "The Old Sawmill", icon: "🪵", c: [PLANK_AREA.x, PLANK_AREA.z], challenge: "plank" },
  { id: "meadow", name: "The Long Paddock", icon: "🌾", c: [(CHALLENGE_FENCE.x1 + CHALLENGE_FENCE.x2) / 2, CHALLENGE_FENCE.z], challenge: "fence" },
  { id: "silos", name: "Grain Silos", icon: "⚖️", c: [WEIGH_AREA.x, WEIGH_AREA.z], challenge: "weigh" },
  { id: "gardens", name: "Glasshouse Gardens", icon: "🥬", c: [VEGGIE_AREA.x, VEGGIE_AREA.z], challenge: "veggie" },
  { id: "market", name: "Market Green", icon: "🏪", c: [TRADE_AREA.x, TRADE_AREA.z], challenge: "trade" },
  { id: "windmill", name: "Windmill Hill", icon: "🌬️", c: [8, -55] },
  { id: "sheep", name: "Sheep Downs", icon: "🐑", c: [118, -22] },
  { id: "pond", name: "Duck Pond", icon: "🦆", c: FARM_POND.center },
];

// ---------------------------------------------------------------------------
// FARM TRACKS — smoothed dirt tracks between the areas. hw = half width.
// ---------------------------------------------------------------------------
export const FARM_PATH_CTRL = [
  // The drive: arrival → through the arch → the homestead's front gate.
  { id: "drive", hw: 2.3, ctrl: [[0, 106], [0, 94], [1, 84], [3, 74], [3.5, 62], [2.5, 52], [1, 45]] },
  // Homestead → west over the creek → the packing shed.
  { id: "west-road", hw: 2.0, ctrl: [[-11, 45.5], [-20, 48], [-28, 49], [-37, 47.5], [-44, 46], [-48, 45]] },
  // Arrival → west past the duck pond → over the creek → the carrot patch.
  { id: "carrot-road", hw: 1.9, ctrl: [[-9, 103], [-16, 92], [-26, 82], [-38, 78], [-48, 80], [-52, 83]] },
  // Carrot patch ↔ packing shed (up the orchard lane).
  { id: "orchard-lane", hw: 1.8, ctrl: [[-66, 77], [-68, 66], [-66, 58], [-63, 52.5]] },
  // Packing shed → north (over the creek) → the sawmill.
  { id: "mill-road", hw: 1.9, ctrl: [[-52, 36], [-50.5, 26], [-57, 16], [-62, 8], [-56, 2], [-48, -3]] },
  // Sawmill → north round the creek's bend → the dairy.
  { id: "dairy-road", hw: 1.9, ctrl: [[-46, -24.5], [-48, -36], [-62, -46], [-77, -50], [-85.5, -52.5]] },
  // Dairy → the cattle run.
  { id: "north-road", hw: 1.9, ctrl: [[-80, -70], [-66, -82], [-52, -92], [-49.5, -96]] },
  // Cattle run → along the north → the long paddock.
  { id: "top-road", hw: 1.9, ctrl: [[-19, -96], [-4, -98], [12, -98], [26, -99], [38, -99]] },
  // Homestead north gate → up Windmill Hill (switchbacks) → the summit.
  { id: "hill-trail", hw: 1.6, ctrl: [[-3, 4], [-6, -6], [22, -16], [-16, -24], [20, -33], [2, -44], [6, -47]] },
  // Summit → down the north side to the top road.
  { id: "hill-north", hw: 1.6, ctrl: [[8, -63], [-14, -70], [22, -78], [-12, -87], [6, -97.5]] },
  // Homestead east → past Golden Hill → the grain silos.
  { id: "east-road", hw: 2.0, ctrl: [[12.5, 25], [22, 21.5], [30, 17], [38, 8], [46, -4], [52, -14], [55, -17]] },
  // Silos → north → the long paddock.
  { id: "silo-north", hw: 1.9, ctrl: [[66, -38], [70, -52], [70, -70], [68, -86], [66, -90.5]] },
  // Silos → south-east → the glasshouse gardens.
  { id: "garden-road", hw: 1.9, ctrl: [[72, -24], [82, -12], [88, 0], [90, 12.5]] },
  // Gardens → south → the market green.
  { id: "market-road", hw: 1.9, ctrl: [[88, 39.5], [84, 54], [76, 68], [68, 78]] },
  // Market → west → back to the arrival.
  { id: "south-road", hw: 1.9, ctrl: [[47, 88], [34, 94], [20, 100], [11, 104]] },
  // Homestead south-east → the market (a shortcut past the wheat).
  { id: "homestead-market", hw: 1.7, ctrl: [[26, 58], [38, 64], [47, 70], [52, 79]] },
  // Up onto the Sheep Downs to the shearing shed on the crest.
  { id: "downs-track", hw: 1.6, ctrl: [[77, -15], [90, -15], [97, -3.5], [108, -22], [110.5, -32.5]] },
];

// ---------------------------------------------------------------------------
// HILLS — big ROLLING hills separate the areas. Each: centre (or a capsule
// a→b with west/east radii), radii, height, flat-top fraction; a cosine bell,
// domain-warped. Every grade inside the fence stays walkable (≲ 0.7).
// ---------------------------------------------------------------------------
export const FARM_HILLS = [
  // The big one: Windmill Hill, crowned by the sail windmill.
  { id: "windmill", name: "Windmill Hill", c: [8, -54], rx: 56, rz: 52, h: 14, flat: 0.12, warp: 0.07 },
  // The west ridge: Orchard Hill (apple + pear rows on its eastern slope).
  { id: "orchard", name: "Orchard Hill", a: [-112, -8], b: [-106, 56], rw: 34, re: 36, h: 11, flat: 0.05, warp: 0.12 },
  // The east ridge: Sheep Downs (a long, gentle west flank).
  { id: "sheep", name: "Sheep Downs", a: [124, -86], b: [120, 38], rw: 42, re: 30, h: 12, flat: 0.05, warp: 0.1 },
  // Golden Hill — the wheat field, between the homestead and the silos.
  { id: "golden", name: "Golden Hill", c: [30, -6], rx: 24, rz: 22, h: 6.5, flat: 0.15, warp: 0.08 },
  // Between the silos and the glasshouse gardens.
  { id: "east-mid", c: [66, 4], rx: 20, rz: 16, h: 5, flat: 0.08, warp: 0.1 },
  // The Market Rise: between the gardens and the market green.
  { id: "market-rise", a: [62, 58], b: [94, 52], rw: 15, re: 15, h: 5, flat: 0.05, warp: 0.12 },
  // Lookout Knoll (south-east corner).
  { id: "lookout", name: "Lookout Knoll", c: [112, 78], rx: 28, rz: 26, h: 10, flat: 0.08, warp: 0.08 },
  // Sunrise Ridge — east of the drive, between the arrival and the homestead.
  { id: "sunrise", a: [20, 80], b: [36, 74], rw: 15, re: 15, h: 4.5, flat: 0.05, warp: 0.12 },
  // The south-west knoll (behind the carrot patch).
  { id: "sw-knoll", c: [-112, 98], rx: 30, rz: 26, h: 8, flat: 0.05, warp: 0.1 },
  // The arrival's gentle rise.
  { id: "arrival", c: [0, 118], rx: 30, rz: 13, h: 2.6, flat: 0.45, warp: 0.04 },
  // North rises behind the cattle run / dairy and the long paddock.
  { id: "nw-rise", c: [-74, -120], rx: 34, rz: 18, h: 7, flat: 0.05, warp: 0.1 },
  { id: "ne-rise", c: [110, -118], rx: 30, rz: 18, h: 7, flat: 0.05, warp: 0.1 },
  // Mill Knoll (between the sawmill and the homestead) + Dairy Hill (between
  // the dairy, the cattle run and the sawmill) + the carrot patch's north knoll.
  { id: "mill-knoll", c: [-22, -6], rx: 16, rz: 14, h: 4.5, flat: 0.05, warp: 0.12 },
  { id: "dairy-hill", c: [-64, -58], rx: 19, rz: 16, h: 6, flat: 0.05, warp: 0.1 },
  { id: "carrot-north", c: [-86, 66], rx: 16, rz: 13, h: 4, flat: 0.05, warp: 0.12 },
];

// ---------------------------------------------------------------------------
// FIELDS + set-dressing anchors (the renderer + scatter read these).
// ---------------------------------------------------------------------------
export const FARM_FIELDS = [
  { id: "wheat", kind: "wheat", c: [30, -6], rx: 17, rz: 13 }, // on Golden Hill
  { id: "sunflowers", kind: "sunflower", c: [-17.5, 69], rx: 11, rz: 8.5 },
  { id: "corn", kind: "corn", c: [-92, -2], rx: 13, rz: 11 },
  { id: "pumpkins", kind: "pumpkin", c: [-84, 92], rx: 8, rz: 6 },
  { id: "lavender", kind: "lavender", c: [26, 82], rx: 9, rz: 6 },
];
// The big four-sail windmill crowning Windmill Hill (a landmark you can see
// from everywhere; its sails turn).
export const FARM_BIG_WINDMILL = { position: [8, -56], rotationY: 0.25, height: 12 };
// The packing shed (open-sided) behind the crate station; the sawmill + its
// water wheel on the creek; the milking shed behind the dairy; the grain
// silos + weighbridge; the glasshouses; the market bunting.
export const FARM_PACKING_SHED = { x: -61, z: 29, w: 14, d: 7 };
export const FARM_SAWMILL = { x: -58, z: -27, w: 10, d: 8, wheel: [-63.4, -21.5] };
export const FARM_MILKING_SHED = { x: -95, z: -79, w: 18, d: 8 };
export const FARM_GRAIN_SILOS = [[80, -24, 3.6, 15], [88.5, -26, 3.6, 15], [84, -36.5, 3.2, 13]];
export const FARM_GLASSHOUSES = [{ x: 81.5, z: 9, w: 10, d: 6 }, { x: 99, z: 10, w: 9, d: 6 }];
export const FARM_HAY_MEADOW = { c: [66, -112], rx: 30, rz: 9 }; // round bales north of the long paddock

// Hay bales — [x, z, rotY] (round bales): homestead + meadow.
export const FARM_HAY_BALES = [
  [-12, 6, 0.4], [-14.5, 8.5, 1.2], [26, 6, 2.2], [92, -110, 0.9], [100, -106, 1.7],
  [40, -112, 0.3], [56, -116, 1.1], [80, -116, 2.4], [104, -98, 0.7],
];

// THE big liquid amber — the Market Green's shade tree, over a carpet of
// fallen leaves that flutter up as you walk through.
export const BIG_AMBER = { position: [46, 96], leafRadius: 4.2, leafCount: 44 };

// Where the ambient animals roam (the Round-Up's own herd is separate).
export const COW_WANDER = { minX: -77, maxX: -57, minZ: -115, maxZ: -101 };
export const DAIRY_COW_WANDER = { minX: -135, maxX: -125, minZ: -59, maxZ: -45 };
export const SHEEP_WANDER = { minX: 104, maxX: 132, minZ: -70, maxZ: 20 };
export const CHOOK_WANDER = { minX: 16, maxX: 28, minZ: 32, maxZ: 40 };
export const RABBIT_WANDER = { minX: -82, maxX: -50, minZ: 70, maxZ: 80 };

// Kept for compatibility with older code paths (the farm is now hilly — see
// farmTerrain.js); empty lists so nothing renders twice.
export const FARM_LANES = [];
export const FARM_CROPS = { x: -14, z: 70, rows: 0, rowLength: 0, rowGap: 2.2 };
export const FARM_SCARECROW = { x: -56, z: 75 };
export const FARM_TREES = [];
export const AUTUMN_TREES = [];
export const DISTANT_TREES = [];
export const HORIZON_HILLS = [];

// ---------------------------------------------------------------------------
// MORE SET-PIECES — the shearing shed on the Sheep Downs' crest, the farm ute,
// the hay-rake tractor in the Long Paddock.
// ---------------------------------------------------------------------------
export const FARM_SHEARING_SHED = { x: 121.5, z: -42, w: 12, d: 8, rotationY: 0 };
export const FARM_UTE = { position: [-11, 51.5], rotationY: 0.35 };
export const FARM_HAY_TRACTOR = { position: [100, -110], rotationY: -0.5 };
export const FARM_PICNIC = { position: [14, -50], rotationY: 0.3 }; // a picnic table on Windmill Hill

// ---------------------------------------------------------------------------
// FENCE LINES (open runs — paddocks are closed rects above). style: "rail"
// post-and-rail, "picket" white pickets, "stone" a dry-stone wall. All are
// JUMPABLE (only the property boundary isn't).
// ---------------------------------------------------------------------------
/** Top rail height of every paddock / pen / fence-line fence (vaultable). */
export const FARM_FENCE_RAIL_TOP = 1.05;
export const FARM_FENCE_LINES = [
  // The farmhouse's front garden (a white picket U with a gate to the yard).
  { id: "house-garden-s", style: "picket", pts: [[-20.4, 28.2], [-13.5, 28.2], [-13.5, 34]] },
  { id: "house-garden-n", style: "picket", pts: [[-13.5, 38], [-13.5, 43.8], [-20.4, 43.8]] },
  // The race: cattle paddock gate → the sorting pen's west side.
  { id: "stock-race-n", style: "rail", pts: [[-53.6, -104.6], [-41.4, -104.6]] },
  { id: "stock-race-s", style: "rail", pts: [[-53.6, -101.4], [-41.4, -101.4]] },
  // Dry-stone walls bounding the sheep's downs (north + south).
  { id: "downs-wall-n", style: "stone", pts: [[96, -78], [108, -74], [122, -77], [138, -74]] },
  { id: "downs-wall-s", style: "stone", pts: [[110, 30], [122, 27], [138, 31]] },
  // Sheep yards beside the shearing shed (west side, open to the downs).
  { id: "sheep-yard", style: "rail", pts: [[115.1, -46], [108.5, -46], [108.5, -38.5], [113, -38.5]] },
];

// ---------------------------------------------------------------------------
// SIGNPOSTS — wooden finger-posts at the track junctions. Each arrow names an
// area and points at a spot a little way down the track that leads there.
// ---------------------------------------------------------------------------
export const FARM_SIGNPOSTS = [
  { id: "arrival", at: [-4.6, 91], arrows: [["The Homestead", [0, 80]], ["Duck Pond", [-16, 92]], ["Market Green", [18, 101]]] },
  { id: "homestead-w", at: [-30, 53.5], arrows: [["Packing Shed", [-44, 46]], ["The Homestead", [-20, 44]]] },
  { id: "packing", at: [-51, 51.5], arrows: [["Carrot Patch", [-66, 62]], ["Old Sawmill", [-55, 20]], ["The Homestead", [-38, 46]]] },
  { id: "sawmill", at: [-38.5, -4], arrows: [["The Dairy", [-46, -30]], ["Packing Shed", [-52, 4]]] },
  { id: "dairy", at: [-79, -61], arrows: [["Cattle Run", [-70, -78]], ["Old Sawmill", [-70, -48]]] },
  { id: "top-road", at: [1.5, -92], arrows: [["Windmill Hill", [9, -86]], ["Cattle Run", [-12, -97.5]], ["Long Paddock", [22, -98.5]]] },
  { id: "barn-n", at: [4, 4], arrows: [["Windmill Hill", [-5, -4]], ["Grain Silos", [36, 10]]] },
  { id: "silos", at: [57.5, -9], arrows: [["Long Paddock", [68, -48]], ["Glasshouses", [80, -14]], ["The Homestead", [40, 4]]] },
  { id: "downs", at: [78, -10], arrows: [["Sheep Downs", [92, -19]], ["Glasshouses", [86, -4]]] },
  { id: "market", at: [43, 83], arrows: [["Arrival", [32, 95]], ["Glasshouses", [74, 70]], ["The Homestead", [40, 68]]] },
];

// Open grassy spots for the random treasure chest (clear of every station,
// track, building and fence — checked by FW).
export const FARM_CHEST_SPOTS = [[-24, 62], [38, 52], [-30, -40], [98, 52], [-88, 30], [30, -60]];
