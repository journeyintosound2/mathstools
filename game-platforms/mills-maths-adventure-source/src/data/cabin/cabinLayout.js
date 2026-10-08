/**
 * THE LODGE INTERIOR (CB) — the single source of truth for the FIFTH region:
 * the warm inside of the ski lodge, entered through the AJAR DOOR on the
 * lodge's front in Snowball Sums (door-to-door travel — you walk in through
 * one door and out through its twin). Scenery, colliders and the region
 * definition all read this file so they can never drift apart.
 *
 * Coordinate space is the region's own: x ∈ [-30, 30], z ∈ [-22, 22] —
 * a fairly large single great-room. The player arrives just inside the
 * SOUTH door looking north at the fireplace; the log walls run all around
 * (no ceiling — the third-person camera looks in from above, dollhouse
 * style, and the dark warm sky reads as rafters lost in shadow).
 *
 * Layout: the great room holds the stone WOODFIRE on the north wall, a long
 * dining table with benches mid-west, two round side tables east, and
 * bookshelves along the west wall. A separate BEDROOM fills the south-east
 * corner behind plank interior walls with its own doorway. Pip hosts
 * fireside addition by the hearth. 1 unit = 1 metre.
 */

import { SNOW_LODGE } from "../snow/snowLayout.js";

export const CABIN_BOUNDS = { shape: "rect", width: 60, height: 44, center: [0, 0] };

// Arrive just inside the south door, facing the fire.
export const CABIN_SPAWN = { x: 0, z: 17.5 };

// The south DOOR back out to Snowball Sums (the return portal sits in the
// doorway; the door visual swings open as you approach).
export const CABIN_DOOR = { position: [0, 20.6], radius: 1.4 };

// Where the matching doors stand in EACH world (door-to-door travel):
// the lodge's front door in the snow world, and the arrive points that put
// the traveller just inside/outside the right doorway (not at region spawn).
// (The snow world was rebuilt 2026-10-08: these follow SNOW_LODGE wherever
// it stands — its front face is SNOW_LODGE.z + d/2.)
const LODGE_FACE_Z = SNOW_LODGE.z + SNOW_LODGE.d / 2;
export const LODGE_DOOR_SNOW = { position: [SNOW_LODGE.x, LODGE_FACE_Z + 1.1], radius: 1.4 };
export const CABIN_ARRIVE_FROM_SNOW = [0, 17.5]; // == CABIN_SPAWN (inside the door)
export const SNOW_ARRIVE_FROM_CABIN = [SNOW_LODGE.x, LODGE_FACE_Z + 2.8]; // just outside the lodge door

// Wall geometry (the log courses + colliders both read these).
export const CABIN_WALL = { halfW: 29, halfD: 21, height: 4.2 };
// The south wall's doorway gap (world x range kept clear of wall colliders).
export const CABIN_DOOR_GAP = { xMin: -1.9, xMax: 1.9 };

// The stone fireplace on the north wall — the room's heart.
export const CABIN_FIRE = { position: [0, -19.6], width: 5.2 };
export const CABIN_HEARTH_RUG = { position: [0, -14.5], radius: 3.4 };

// The long dining table (axis-aligned, benches either side).
export const CABIN_LONG_TABLE = { x: -12, z: -3, w: 7.5, d: 2.2 };
// Round side tables with stools.
export const CABIN_ROUND_TABLES = [
  { x: 12, z: 1, r: 1.3 },
  { x: 18, z: -11, r: 1.3 },
];

// Bookshelves along the west wall. [x, z]
export const CABIN_BOOKSHELVES = [
  [-27.8, -8], [-27.8, -1], [-27.8, 6],
];

// The BEDROOM — the south-east corner behind plank interior walls.
//   wallZ runs east from wallX; wallX runs south from wallZ; the doorway is
//   the gap in the z-wall (walk in from the great room).
export const CABIN_BEDROOM = {
  wallX: 12, // interior wall along x = 12, from z = wallZ … the south wall
  wallZ: 8, // interior wall along z = 8, from x = wallX … the east wall
  doorXMin: 14, doorXMax: 17, // the doorway gap in the z-wall
};
export const CABIN_BED = { position: [24, 16.5], rotationY: Math.PI / 2 };
export const CABIN_WARDROBE = { position: [27.8, 10.8] };
export const CABIN_BEDSIDE = { position: [19.5, 19.2] };
export const CABIN_BEDROOM_RUG = { position: [19, 13.5], radius: 2.2 };

// Windows (visual): [x, z, rotY] on the outer walls — icy twilight panes.
export const CABIN_WINDOWS = [
  [-29, -14, Math.PI / 2], [-29, 12, Math.PI / 2],
  [29, -14, -Math.PI / 2], [29, 2, -Math.PI / 2],
  [-14, -21, 0], [14, -21, 0],
  [-12, 21, Math.PI], // south wall, west of the door
];

// Candle spots (visual): on the tables.
export const CABIN_CANDLES = [
  [-13.8, -3], [-10.2, -3], [12, 1], [18, -11], [19.5, 19.2],
];

// Pip hosts FIRESIDE ADDITION from beside the hearth.
export const CABIN_PIP = { position: [-4.5, -15.5] };
