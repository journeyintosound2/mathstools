/**
 * RETRIEVAL PRACTICE PLAYGROUND — GUARD RAILS (pure). Worked out from the
 * structures themselves rather than placed by hand: every edge of every
 * terrace, deck, landing, flight and ramp is walked in 0.5 m steps, and
 * wherever the ground just beyond it is a real DROP (and isn't the building
 * wall, the next flight or a deck at the same level) it gets a rail. So
 * stairs and corridors always meet with an opening, and nothing you can
 * walk along ever ends in a sheer fall. The colliders (schoolyardColliders)
 * and the renderer (game/schoolyard) both read `getSchoolRails()`.
 *
 * A rail: { id, kind, style, a:[x,z], b:[x,z], ya, yb (walking height at
 * each end), n:[nx,nz] (outward) }.
 *   style  "wall"     a brick parapet (terrace edges)
 *          "parapet"  the concrete corridor upstand + galvanised top rail
 *          "pipe"     galvanised pipe rails (stairs, ramps, landings, pier)
 */
import { inPoly, toWorld, rectCorners, inRect } from "./schoolyardGeom.js";
import { getSchoolStructures, schoolGroundHeight, inSchoolBuilding } from "./schoolyardTerrain.js";

const STEP = 0.5;
const DROP = { platform: 1.0, deck: 0.9, landing: 0.9, flight: 0.85, ramp: 0.85, stage: 9, planter: 9 };
const STYLE = { platform: "wall", deck: "parapet", landing: "pipe", flight: "pipe", ramp: "pipe" };

function edgesOf(s) {
  if (s.kind === "platform") {
    const pts = s.platform.pts;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const L = Math.hypot(dx, dz) || 1;
      let n = [dz / L, -dx / L];
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (inPoly(pts, mx + n[0] * 0.3, mz + n[1] * 0.3)) n = [-n[0], -n[1]];
      out.push({ a, b, n });
    }
    return out;
  }
  if (!s.r) return [];
  const c = rectCorners(s.r); // (−x−z, +x−z, +x+z, −x+z)
  const ex = [Math.cos(s.r.yaw), -Math.sin(s.r.yaw)], ez = [Math.sin(s.r.yaw), Math.cos(s.r.yaw)];
  return [
    { a: c[0], b: c[1], n: [-ez[0], -ez[1]] },
    { a: c[1], b: c[2], n: ex },
    { a: c[2], b: c[3], n: ez },
    { a: c[3], b: c[0], n: [-ex[0], -ex[1]] },
  ];
}

let _rails = null;
export function getSchoolRails() {
  if (_rails) return _rails;
  const rails = [];
  for (const s of getSchoolStructures().list) {
    const kind = s.kind;
    if (!(kind in STYLE)) continue;
    if (s.id === "sky-pier") continue; // the pier gets its own rails (renderer + colliders)
    const drop = DROP[kind];
    for (const [ei, e] of edgesOf(s).entries()) {
      const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1];
      const L = Math.hypot(dx, dz);
      const n = Math.max(1, Math.round(L / STEP));
      let run = null;
      const flush = () => {
        if (!run) return;
        if (run.len >= 0.4) rails.push(run);
        run = null;
      };
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, tm = (t0 + t1) / 2;
        const px = e.a[0] + dx * tm, pz = e.a[1] + dz * tm;
        const ix = px - e.n[0] * 0.25, iz = pz - e.n[1] * 0.25;
        const top = s.top(ix, iz);
        let need = false;
        if (top !== null) {
          // Just past the edge (inside the first tread of any flight there).
          const ox = px + e.n[0] * 0.28, oz = pz + e.n[1] * 0.28;
          if (!inSchoolBuilding(ox, oz, 0.05)) {
            const g = schoolGroundHeight(ox, oz, top + 0.1);
            need = top - g > drop;
          }
        }
        if (need) {
          const a = [e.a[0] + dx * t0, e.a[1] + dz * t0], b = [e.a[0] + dx * t1, e.a[1] + dz * t1];
          const ya = s.top(a[0] - e.n[0] * 0.25, a[1] - e.n[1] * 0.25) ?? top;
          const yb = s.top(b[0] - e.n[0] * 0.25, b[1] - e.n[1] * 0.25) ?? top;
          const sloped = kind === "flight" || kind === "ramp";
          if (run && (!sloped || run.len < 2.5) && Math.abs(run.yb - ya) < 0.35) {
            run.b = b; run.yb = yb; run.len += L / n;
          } else {
            flush();
            run = { id: `${s.id}-${ei}-${k}`, kind, style: STYLE[kind], a, b, ya, yb, n: e.n, len: L / n, struct: s.id };
          }
        } else flush();
      }
      flush();
    }
  }
  // The Sky Pier: rails down both sides + across the seaward end.
  const pier = getSchoolStructures().list.find((s) => s.id === "sky-pier");
  if (pier) {
    const [c0, c1, c2, c3] = rectCorners(pier.r);
    const y = pier.y;
    const ex = [Math.cos(pier.r.yaw), -Math.sin(pier.r.yaw)], ez = [Math.sin(pier.r.yaw), Math.cos(pier.r.yaw)];
    rails.push({ id: "pier-l", kind: "deck", style: "pipe", a: c0, b: c1, ya: y, yb: y, n: [-ez[0], -ez[1]], len: pier.r.hx * 2 });
    rails.push({ id: "pier-r", kind: "deck", style: "pipe", a: c2, b: c3, ya: y, yb: y, n: ez, len: pier.r.hx * 2 });
    // The seaward end is whichever end is further from the hill (the pier runs from → to).
    rails.push({ id: "pier-end", kind: "deck", style: "pipe", a: c1, b: c2, ya: y, yb: y, n: ex, len: pier.r.hz * 2 });
  }
  _rails = rails;
  return rails;
}

/** Is (x, z) within `pad` of a rail line (for scatter / furniture placement)? */
export function nearSchoolRail(x, z, pad = 0.8) {
  for (const r of getSchoolRails()) {
    const dx = r.b[0] - r.a[0], dz = r.b[1] - r.a[1];
    const L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - r.a[0]) * dx + (z - r.a[1]) * dz) / L2));
    if (Math.hypot(x - (r.a[0] + dx * t), z - (r.a[1] + dz * t)) < pad) return true;
  }
  return false;
}
export { toWorld, inRect };
