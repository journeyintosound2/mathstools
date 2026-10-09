/**
 * ACHIEVEMENTS WALL — its geometry + the first-person LOOK camera. Pure (no
 * React / three) so the renderer, Player.jsx, the prompt UI and the checks
 * all agree on where the boards are and where you stand to read them.
 *
 * Wall-local frame: +x along the wall (west → east as you face it), +z out
 * of its FRONT face (toward the arrivals), y up from the ground at its centre.
 */
import { ACHIEVEMENT_WALL } from "./islandLayout.js";
import { terrainHeight } from "./islandTerrain.js";

export const WALL_BOARDS = 6;
export const WALL_GEOM = {
  plinthH: 0.7,
  boardW: 2.2,
  boardH: 2.2 * (4 / 3),
  gap: 0.26,
  boardFace: 0.42, // the boards' faces stand this far in front of the wall's centre line
  headerW: 12.6,
  headerH: 1.26,
};
WALL_GEOM.boardY = WALL_GEOM.plinthH + 0.28 + WALL_GEOM.boardH / 2; // board centres (above the wall's ground)
WALL_GEOM.headerY = WALL_GEOM.boardY + WALL_GEOM.boardH / 2 + 0.25 + WALL_GEOM.headerH / 2;
WALL_GEOM.boardsW = WALL_BOARDS * WALL_GEOM.boardW + (WALL_BOARDS - 1) * WALL_GEOM.gap;

/** The ground height the wall stands on (its centre). */
export function wallBaseY() {
  return terrainHeight(ACHIEVEMENT_WALL.position[0], ACHIEVEMENT_WALL.position[1]);
}

/** Board i's centre in wall-local x. */
export function boardLocalX(i) {
  const { boardW, gap, boardsW } = WALL_GEOM;
  return -boardsW / 2 + boardW / 2 + i * (boardW + gap);
}

/** Wall-local (lx, lz) → world (x, z). */
export function wallToWorld(lx, lz) {
  const a = ACHIEVEMENT_WALL.rotationY;
  const [cx, cz] = ACHIEVEMENT_WALL.position;
  return [cx + lx * Math.cos(a) + lz * Math.sin(a), cz - lx * Math.sin(a) + lz * Math.cos(a)];
}
/** World (x, z) → wall-local (lx, lz). */
export function worldToWall(x, z) {
  const a = ACHIEVEMENT_WALL.rotationY;
  const dx = x - ACHIEVEMENT_WALL.position[0], dz = z - ACHIEVEMENT_WALL.position[1];
  return [dx * Math.cos(a) - dz * Math.sin(a), dx * Math.sin(a) + dz * Math.cos(a)];
}

/** Is a player at (x, z) standing in front of the wall, close enough to look? */
export function inWallPromptZone(x, z) {
  const [lx, lz] = worldToWall(x, z);
  const [d0, d1] = ACHIEVEMENT_WALL.promptDepth;
  return lz > d0 && lz < d1 && Math.abs(lx) < ACHIEVEMENT_WALL.length / 2 + 1;
}

/** The board nearest a wall-local x (for "zoom in" from the whole-wall view). */
export function nearestBoard(lx) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < WALL_BOARDS; i++) {
    const d = Math.abs(boardLocalX(i) - lx);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

/**
 * The LOOK camera: `panel` −1 = the whole wall, 0…5 = one board up close.
 * Distances come from the live fov / aspect so the wall (or the board) fills
 * the screen at any shape — clamped so a portrait phone doesn't walk off the
 * green. Returns world { pos: [x,y,z], look: [x,y,z], dist }.
 */
export function wallViewCamera(panel, fovDeg = 50, aspect = 16 / 9) {
  const G = WALL_GEOM;
  const y0 = wallBaseY();
  const halfV = Math.tan((fovDeg * Math.PI) / 360);
  const halfH = halfV * aspect;
  // The framed subject fills this band of the screen (NDC, −1 bottom … +1
  // top): the bottom ~22 % is left clear for the viewer's caption bar, so a
  // board's last row never hides behind it.
  const FRAME_TOP = 0.86, FRAME_BOTTOM = -0.56;
  let lx, top, bottom, halfWidth, maxDist;
  if (panel < 0) {
    lx = 0;
    top = G.headerY + G.headerH / 2 + 0.15;
    bottom = G.boardY - G.boardH / 2 - 0.12;
    halfWidth = G.boardsW / 2 + 0.5;
    maxDist = 13;
  } else {
    lx = boardLocalX(panel);
    top = G.boardY + G.boardH / 2 + 0.14;
    bottom = G.boardY - G.boardH / 2 - 0.12;
    halfWidth = G.boardW / 2 + 0.28;
    maxDist = 7.5;
  }
  const distV = (top - bottom) / (FRAME_TOP - FRAME_BOTTOM) / halfV;
  const distW = halfWidth / halfH;
  const dist = Math.min(maxDist, Math.max(distV, distW));
  // Aim a little BELOW the subject's centre so it rides up into the band.
  const ly = (top + bottom) / 2 - ((FRAME_TOP + FRAME_BOTTOM) / 2) * dist * halfV;
  const faceZ = G.boardFace;
  const [px, pz] = wallToWorld(lx, faceZ + dist);
  const [tx, tz] = wallToWorld(lx, faceZ);
  // Eye a touch below the look point (you look slightly UP at a wall).
  const eye = Math.max(1.55, ly - 0.25);
  return { pos: [px, y0 + eye, pz], look: [tx, y0 + ly, tz], dist };
}
