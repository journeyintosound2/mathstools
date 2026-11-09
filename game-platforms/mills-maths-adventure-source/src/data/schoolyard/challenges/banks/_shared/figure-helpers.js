/*
  Mills Maths Tools — figure construction for the geometry engine
  ----------------------------------------------------------------
  question-banks/_shared/figure-helpers.js

  The geometry engine draws whatever coordinates it is given. This file makes
  those coordinates honest: a triangle asked about as "40°, 65°, x" is built
  with those angles, so the picture agrees with the numbers and a harness can
  re-measure the figure to check the answer.

  All construction happens in a y-UP maths frame (turning left is
  anticlockwise) and is flipped to the engine's y-DOWN screen frame at the
  end, so the angle arithmetic reads like a textbook.
*/

const RAD = Math.PI / 180;

function dir(deg) {
  return [Math.cos(deg * RAD), Math.sin(deg * RAD)];
}

function rotate(p, deg) {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

/*
  Fit a set of y-up points into a box `size` units across (the longer side),
  flip to y-down, and round. Returns { NAME: [x, y] }.
*/
export function fitPoints(named, { size = 300, maxH = 200, rotateBy = 0 } = {}) {
  const entries = Object.entries(named).map(([k, p]) => [k, rotate(p, rotateBy)]);
  const xs = entries.map(([, p]) => p[0]);
  const ys = entries.map(([, p]) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs) || 1;
  const h = Math.max(...ys) - Math.min(...ys) || 1;
  // Fit inside size × maxH. Printed diagrams are capped at about 50 mm tall,
  // so a tall figure is limited by its height, not its width — otherwise the
  // template's max-height would shrink it and its labels with it.
  const k = Math.min(size / w, maxH / h);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const out = {};
  entries.forEach(([name, p]) => {
    out[name] = [Math.round((p[0] - minX) * k * 10) / 10, Math.round((maxY - p[1]) * k * 10) / 10];
  });
  return out;
}

/*
  A polygon with the given interior angles (degrees, in order around the
  figure) and the first n−2 side lengths; the last two sides are solved so it
  closes. Returns y-up points, or null if the angles cannot close with
  positive sides (caller retries).
*/
export function polygonFromAngles(angles, firstSides) {
  const n = angles.length;
  const pts = [[0, 0]];
  let heading = 0;
  for (let i = 0; i < n - 2; i++) {
    const p = pts[pts.length - 1];
    const d = dir(heading);
    pts.push([p[0] + d[0] * firstSides[i], p[1] + d[1] * firstSides[i]]);
    heading += 180 - angles[i + 1];
  }
  // Now at vertex n−1 (index n−2), heading along the side to vertex n−1.
  const C = pts[pts.length - 1];
  const d3 = dir(heading);
  const d4 = dir(heading + 180 - angles[n - 1]);
  // C + t·d3 + s·d4 = origin
  const det = d3[0] * d4[1] - d3[1] * d4[0];
  if (Math.abs(det) < 1e-9) return null;
  const rx = -C[0];
  const ry = -C[1];
  const t = (rx * d4[1] - ry * d4[0]) / det;
  const s = (d3[0] * ry - d3[1] * rx) / det;
  if (!(t > 0) || !(s > 0)) return null;
  pts.push([C[0] + d3[0] * t, C[1] + d3[1] * t]);
  return pts;
}

/* Triangle with angles a at the first vertex and b at the second. */
export function triangleFromAngles(a, b, base = 10) {
  return polygonFromAngles([a, b, 180 - a - b], [base]);
}

/* Interior angle at P between rays P→Q and P→R, in degrees (screen or maths frame). */
export function measureAngle(P, Q, R) {
  const v1 = [Q[0] - P[0], Q[1] - P[1]];
  const v2 = [R[0] - P[0], R[1] - P[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const m = Math.hypot(...v1) * Math.hypot(...v2);
  return Math.acos(Math.max(-1, Math.min(1, dot / m))) / RAD;
}

export function distance(P, Q) {
  return Math.hypot(P[0] - Q[0], P[1] - Q[1]);
}

/* Point along P→Q extended by `k` times its length beyond Q. */
export function extendBeyond(P, Q, k = 0.55) {
  return [Q[0] + (Q[0] - P[0]) * k, Q[1] + (Q[1] - P[1]) * k];
}

export function nameVertices(pointsArray, letters) {
  const out = {};
  pointsArray.forEach((p, i) => { out[letters[i]] = p; });
  return out;
}

export const TRIANGLE_LETTERS = [["A", "B", "C"], ["P", "Q", "R"], ["X", "Y", "Z"], ["L", "M", "N"], ["D", "E", "F"], ["K", "L", "M"]];
export const QUAD_LETTERS = [["A", "B", "C", "D"], ["P", "Q", "R", "S"], ["W", "X", "Y", "Z"], ["K", "L", "M", "N"], ["E", "F", "G", "H"]];
export const PRONUMERALS = ["x", "y", "a", "b", "m", "p", "t", "k"];
