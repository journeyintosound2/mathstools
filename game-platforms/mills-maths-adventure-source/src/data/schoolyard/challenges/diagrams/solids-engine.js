// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/solids/solids-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — 3D Solids and Nets Engine
  ----------------------------------------------
  engines/solids/solids-engine.js

  Exposes: window.MMT_SOLIDS_ENGINE.render(target, config)

  Stage 3 "3D Space" (MA3-3DS-01) is about telling prisms from pyramids,
  counting faces, edges and vertices, and connecting a solid to its net and to
  its views. Every one of those needs a picture.

  diagramType
  -----------
    solid     kind: "prism" | "pyramid" (with `sides` 3–8 and optional
              `base: "rectangle"` for a non-square box), or "cylinder",
              "cone", "sphere". `height` is in units of the base's
              circumradius (default prism 1.5, pyramid 1.8, `cube: true` → √2). Drawn standing on its base, seen from a
              little above; hidden edges dashed. Visibility is COMPUTED from
              face orientation, not hand-listed, so every n draws correctly.
    net       `faces` [{ pts: [[x,y],…] }] in net units (y down) — squares,
              rectangles and triangles laid out flat, each with an optional
              `label`; or `nets: [{ label, faces }]` for several side by side.
    stack-views  a stack of unit cubes (`heights[row][col]`, row 0 at the
              front) beside lettered view options, with a FRONT arrow
    measured  Stage 5 solids with labelled dimensions: `kind` pyramid (base
              square|rectangle), cone, cylinder, sphere, hemisphere,
              cone-cylinder, hemisphere-cylinder, cone-hemisphere,
              pyramid-prism; `dims` (numbers, for proportions) and `labels`
              (strings; null draws an empty box): h, r, l, slant, a, b, ch, ph, d
    views     `options` [{ label, cells: [[col,row],…] }] — small grids
              lettered A, B, C … for "which is the top/front/side view?"

  Nets are laid out by the bank from unit squares or polygons, so the bank's
  folding check and the drawing use the same coordinates.
*/

window.MMT_SOLIDS_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const TEXT = 18;
  const INK = "#111827";
  const FACE = "#dbeafe";
  const TOPF = "#eff6ff";
  const SIDE = "#bfdbfe";
  const FONT = "'Cambria Math','Times New Roman',serif";
  const r1 = v => Math.round(v * 10) / 10;

  function el(n, a = {}) {
    const e = document.createElementNS(NS, n);
    Object.entries(a).forEach(([k, v]) => { if (v !== undefined && v !== null) e.setAttribute(k, String(v)); });
    return e;
  }
  function text(g, v, x, y, o = {}) {
    const t = el("text", { x: r1(x), y: r1(y), "font-family": FONT, "font-size": o.size || TEXT, "text-anchor": "middle", "dominant-baseline": "middle", "font-weight": o.weight || 700, fill: o.fill || INK });
    t.textContent = String(v);
    g.appendChild(t);
  }
  const P = pts => pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(" ");
  function seg(g, a, b, hidden) {
    g.appendChild(el("line", { x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]), stroke: INK, "stroke-width": hidden ? 1.6 : 2.6, "stroke-dasharray": hidden ? "7 6" : null, "stroke-linecap": "round" }));
  }

  /* Real 3D: build the solid, project it orthographically from a camera a
     little above and to the side, and decide visibility from each face's
     outward normal. An edge is hidden only when BOTH its faces face away. */
  const AZ = 0.42;     // camera turn about the vertical axis (radians)
  const EL = 0.36;     // camera elevation above the horizontal
  function project([x, y, z]) {
    const xr = x * Math.cos(AZ) - z * Math.sin(AZ);
    const zr = x * Math.sin(AZ) + z * Math.cos(AZ);
    // screen: sx right, sy down; depth toward the viewer = -zr·cos(EL) + y·sin(EL)
    return [xr, -(y * Math.cos(EL) + zr * Math.sin(EL))];
  }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  function baseRing(n, rect) {
    // regular n-gon of circumradius 1 in the x–z plane; a 4-gon sits square to
    // the axes so a box looks like a box. `rect` stretches it along x.
    const start = n === 4 ? Math.PI / 4 : -Math.PI / 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = start + (i * 2 * Math.PI) / n;
      out.push([Math.cos(t) * (rect ? 1.5 : 1), 0, Math.sin(t)]);
    }
    return out;
  }

  function drawPoly3D(g, verts, faces) {
    // camera direction: the world vector that projects to a single screen
    // point (so it runs along the line of sight) and points toward the viewer.
    const cam = [-Math.sin(AZ) * Math.cos(EL), Math.sin(EL), -Math.cos(AZ) * Math.cos(EL)];
    const centre = verts.reduce((s, v) => [s[0] + v[0] / verts.length, s[1] + v[1] / verts.length, s[2] + v[2] / verts.length], [0, 0, 0]);
    const vis = faces.map(f => {
      let nrm = cross(sub(verts[f[1]], verts[f[0]]), sub(verts[f[2]], verts[f[0]]));
      const fc = f.reduce((s, i) => [s[0] + verts[i][0] / f.length, s[1] + verts[i][1] / f.length, s[2] + verts[i][2] / f.length], [0, 0, 0]);
      if (dot(nrm, sub(fc, centre)) < 0) nrm = nrm.map(v => -v);     // make it outward
      return dot(nrm, cam) > 1e-9;
    });
    // fit to the frame
    const pr = verts.map(project);
    const xs = pr.map(p => p[0]);
    const ys = pr.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const k = Math.min(280 / w, 260 / h);
    const ox = 170 - ((Math.max(...xs) + Math.min(...xs)) / 2) * k;
    const oy = 158 - ((Math.max(...ys) + Math.min(...ys)) / 2) * k;
    const S = pr.map(p => [ox + p[0] * k, oy + p[1] * k]);
    faces.forEach((f, i) => {
      if (!vis[i]) return;
      const top = f.every(j => verts[j][1] > 1e-9) && f.length > 2 && f.every(j => Math.abs(verts[j][1] - verts[f[0]][1]) < 1e-9);
      g.appendChild(el("polygon", { points: P(f.map(j => S[j])), fill: top ? TOPF : SIDE, stroke: "none" }));
    });
    const edges = new Map();
    faces.forEach((f, fi) => f.forEach((a, t) => {
      const b = f[(t + 1) % f.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edges.has(key)) edges.set(key, { a, b, faces: [] });
      edges.get(key).faces.push(fi);
    }));
    const list = [...edges.values()];
    list.filter(e => !e.faces.some(fi => vis[fi])).forEach(e => seg(g, S[e.a], S[e.b], true));
    list.filter(e => e.faces.some(fi => vis[fi])).forEach(e => seg(g, S[e.a], S[e.b], false));
    return v3 => { const p = project(v3); return [ox + p[0] * k, oy + p[1] * k]; };
  }

  function prism(g, n, rect, tall) {
    const ring = baseRing(n, rect);
    const H = tall;
    const verts = [...ring, ...ring.map(p => [p[0], H, p[2]])];
    const faces = [ring.map((_, i) => i), ring.map((_, i) => n + i)];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push([i, j, n + j, n + i]); }
    drawPoly3D(g, verts, faces);
  }

  function pyramid(g, n, rect, tall) {
    const ring = baseRing(n, rect);
    const verts = [...ring, [0, tall, 0]];
    const faces = [ring.map((_, i) => i)];
    for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n]);
    drawPoly3D(g, verts, faces);
  }

  function roundSolid(g, kind) {
    const cx = 170;
    const rx = 100;
    const ry = 34;
    if (kind === "sphere") {
      g.appendChild(el("circle", { cx, cy: 160, r: 110, fill: FACE, stroke: INK, "stroke-width": 2.6 }));
      g.appendChild(el("path", { d: `M ${cx - 110} 160 A 110 36 0 0 0 ${cx + 110} 160`, fill: "none", stroke: INK, "stroke-width": 1.8 }));
      g.appendChild(el("path", { d: `M ${cx - 110} 160 A 110 36 0 0 1 ${cx + 110} 160`, fill: "none", stroke: INK, "stroke-width": 1.4, "stroke-dasharray": "7 6" }));
      return;
    }
    const yb = 262;
    const yt = 60;
    if (kind === "cylinder") {
      g.appendChild(el("path", { d: `M ${cx - rx} ${yt} L ${cx - rx} ${yb} A ${rx} ${ry} 0 0 0 ${cx + rx} ${yb} L ${cx + rx} ${yt}`, fill: SIDE, stroke: INK, "stroke-width": 2.6 }));
      g.appendChild(el("ellipse", { cx, cy: yt, rx, ry, fill: TOPF, stroke: INK, "stroke-width": 2.6 }));
      g.appendChild(el("path", { d: `M ${cx - rx} ${yb} A ${rx} ${ry} 0 0 1 ${cx + rx} ${yb}`, fill: "none", stroke: INK, "stroke-width": 1.5, "stroke-dasharray": "7 6" }));
      return;
    }
    // cone
    g.appendChild(el("path", { d: `M ${cx - rx} ${yb} L ${cx} ${yt - 10} L ${cx + rx} ${yb} A ${rx} ${ry} 0 0 1 ${cx - rx} ${yb}`, fill: SIDE, stroke: INK, "stroke-width": 2.6 }));
    g.appendChild(el("path", { d: `M ${cx - rx} ${yb} A ${rx} ${ry} 0 0 1 ${cx + rx} ${yb}`, fill: "none", stroke: INK, "stroke-width": 1.5, "stroke-dasharray": "7 6" }));
  }

  function solid(target, c) {
    const g = el("g");
    const kind = c.kind || "prism";
    const n = Math.max(3, Math.min(8, Number(c.sides) || 4));
    const rect = c.base === "rectangle";
    if (kind === "prism") prism(g, n, rect, c.height || (c.cube ? Math.SQRT2 : 1.5));
    else if (kind === "pyramid") pyramid(g, n, rect, c.height || 1.8);
    else roundSolid(g, kind);
    return finish(target, g, 340, 310, "3D solid", c);
  }

  /* One net, or several side by side (`nets: [{ label, faces }]`) for
     "which of these nets folds into a cube?". */
  function drawNet(g, faces, u, dx, dy) {
    const all = faces.flatMap(f => f.pts);
    const minX = Math.min(...all.map(p => p[0]));
    const minY = Math.min(...all.map(p => p[1]));
    faces.forEach((f, i) => {
      const pts = f.pts.map(p => [(p[0] - minX) * u + dx, (p[1] - minY) * u + dy]);
      g.appendChild(el("polygon", { points: P(pts), fill: f.fill || (i % 2 ? FACE : TOPF), stroke: INK, "stroke-width": 2.4, "stroke-linejoin": "round" }));
      if (f.label) {
        const cx = pts.reduce((s2, p) => s2 + p[0], 0) / pts.length;
        const cy = pts.reduce((s2, p) => s2 + p[1], 0) / pts.length;
        text(g, f.label, cx, cy, { size: 20 });
      }
    });
    return {
      w: (Math.max(...all.map(p => p[0])) - minX) * u,
      h: (Math.max(...all.map(p => p[1])) - minY) * u
    };
  }

  function net(target, c) {
    const g = el("g");
    if (Array.isArray(c.nets)) {
      const u = c.unit || 30;
      let x = 12;
      let H = 0;
      c.nets.forEach(nt => {
        const all = nt.faces.flatMap(f => f.pts);
        const w = (Math.max(...all.map(p => p[0])) - Math.min(...all.map(p => p[0]))) * u;
        text(g, nt.label, x + w / 2, 14, { size: 22 });
        const box = drawNet(g, nt.faces, u, x, 34);
        H = Math.max(H, box.h);
        x += box.w + 36;
      });
      return finish(target, g, x - 24, H + 46, "nets", {});
    }
    const box = drawNet(g, c.faces || [], c.unit || 44, 14, 14);
    return finish(target, g, box.w + 28, box.h + 28, "net", {});
  }

  /* An isometric stack of unit cubes; heights[row][col], row 0 at the front. */
  function drawStack(g, heights, s, baseX, baseY) {
    const rows = heights.length;
    const cols = Math.max(...heights.map(r => r.length));
    const ox = s * 0.5;
    const oy = -s * 0.36;
    for (let r = rows - 1; r >= 0; r--) {
      for (let cc = 0; cc < cols; cc++) {
        const h = heights[r][cc] || 0;
        for (let z = 0; z < h; z++) {
          const x = baseX + cc * s + r * ox;
          const y = baseY - z * s + r * oy;
          g.appendChild(el("polygon", { points: P([[x, y], [x + s, y], [x + s, y - s], [x, y - s]]), fill: SIDE, stroke: INK, "stroke-width": 2 }));
          g.appendChild(el("polygon", { points: P([[x, y - s], [x + s, y - s], [x + s + ox, y - s + oy], [x + ox, y - s + oy]]), fill: TOPF, stroke: INK, "stroke-width": 2 }));
          g.appendChild(el("polygon", { points: P([[x + s, y], [x + s + ox, y + oy], [x + s + ox, y - s + oy], [x + s, y - s]]), fill: FACE, stroke: INK, "stroke-width": 2 }));
        }
      }
    }
    const maxH = Math.max(...heights.flat());
    return { w: cols * s + rows * ox, h: maxH * s + rows * -oy };
  }

  /* The stack on the left, the lettered view options on the right, plus a
     "FRONT" arrow so "front view" has one meaning. */
  function stackViews(target, c) {
    const g = el("g");
    const heights = c.heights || [[1]];
    const rows = heights.length;
    const cols = Math.max(...heights.map(r => r.length));
    const maxH = Math.max(...heights.flat());
    const s = Math.min(40, 170 / (maxH + rows * 0.36), 220 / (cols + rows * 0.5));
    const baseY = 20 + maxH * s + rows * s * 0.36;
    const box = drawStack(g, heights, s, 20, baseY);
    // front arrow under the front row
    const fx = 20 + (cols * s) / 2;
    g.appendChild(el("line", { x1: r1(fx), y1: r1(baseY + 38), x2: r1(fx), y2: r1(baseY + 12), stroke: "#b91c1c", "stroke-width": 2.6 }));
    g.appendChild(el("polygon", { points: P([[fx, baseY + 6], [fx - 6, baseY + 16], [fx + 6, baseY + 16]]), fill: "#b91c1c" }));
    text(g, "FRONT", fx, baseY + 52, { size: 15, fill: "#b91c1c" });
    let H = baseY + 60;
    // options
    const cell = 26;
    let x = 20 + box.w + 50;
    const maxRows = Math.max(1, ...(c.options || []).map(o => Math.max(...o.cells.map(p => p[1])) + 1));
    (c.options || []).forEach(o => {
      const oc = Math.max(...o.cells.map(p => p[0])) + 1;
      const w = Math.max(2, oc) * cell;
      text(g, o.label, x + w / 2, 16, { size: 22 });
      o.cells.forEach(([cc, rr]) => {
        g.appendChild(el("rect", { x: x + cc * cell, y: 34 + (maxRows - 1 - rr) * cell, width: cell, height: cell, fill: FACE, stroke: INK, "stroke-width": 2 }));
      });
      x += w + 30;
    });
    H = Math.max(H, 34 + maxRows * cell + 10);
    return finish(target, g, x - 10, H, "cube stack and views", {});
  }

  function views(target, c) {
    const opts = c.options || [];
    const cell = 34;
    const g = el("g");
    let x = 10;
    opts.forEach(o => {
      const cols = Math.max(...o.cells.map(p => p[0])) + 1;
      const rows = Math.max(...o.cells.map(p => p[1])) + 1;
      const w = Math.max(3, cols) * cell;
      text(g, o.label, x + w / 2, 16, { size: 22 });
      o.cells.forEach(([cc, rr]) => {
        g.appendChild(el("rect", { x: x + cc * cell, y: 34 + (rows - 1 - rr) * cell + (4 - rows) * cell, width: cell, height: cell, fill: FACE, stroke: INK, "stroke-width": 2 }));
      });
      x += w + 34;
    });
    return finish(target, g, x, 34 + 4 * cell + 10, "view options", {});
  }

  function finish(target, g, w, h, label, c) {
    if (c && c.caption) text(g, c.caption, w / 2, h - 6, { size: 17 });
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h + (c && c.caption ? 14 : 0))}`, width: "100%", role: "img", "aria-label": label });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }

  /* ── measured solids (Stage 5 surface area and volume) ───────────────── */
  const DIM = "#1d4ed8";
  function dimLabel(g, v, x, y, o = {}) {
    if (v === undefined) return;
    if (v === null) {
      g.appendChild(el("rect", { x: r1(x - 26), y: r1(y - 14), width: 52, height: 28, rx: 3, fill: "#fff", stroke: INK, "stroke-width": 1.6 }));
      return;
    }
    const t = el("text", { x: r1(x), y: r1(y), "font-family": FONT, "font-size": o.size || TEXT, "text-anchor": o.anchor || "middle", "dominant-baseline": "middle", "font-weight": 700, fill: DIM, stroke: "#fff", "stroke-width": 4, "paint-order": "stroke" });
    t.textContent = String(v);
    g.appendChild(t);
  }
  function dash(g, a, b, colour = DIM) {
    g.appendChild(el("line", { x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]), stroke: colour, "stroke-width": 1.8, "stroke-dasharray": "6 5" }));
  }
  function rightMark(g, at, u, v, s = 10) {
    const p1 = [at[0] + u[0] * s, at[1] + u[1] * s];
    const p2 = [p1[0] + v[0] * s, p1[1] + v[1] * s];
    const p3 = [at[0] + v[0] * s, at[1] + v[1] * s];
    g.appendChild(el("polyline", { points: P([p1, p2, p3]), fill: "none", stroke: DIM, "stroke-width": 1.5 }));
  }
  const clampR = (x, a, b) => Math.max(a, Math.min(b, x));

  /* Cone / cylinder / sphere pieces drawn in 2D with an elliptical base.
     All positions returned so composites can stack them. */
  function coneAt(g, cx, baseY, R, Hh, lab) {
    const ry = R * 0.3;
    g.appendChild(el("path", { d: `M ${cx - R} ${baseY} L ${cx} ${baseY - Hh} L ${cx + R} ${baseY} A ${R} ${ry} 0 0 1 ${cx - R} ${baseY}`, fill: SIDE, stroke: INK, "stroke-width": 2.4 }));
    g.appendChild(el("path", { d: `M ${cx - R} ${baseY} A ${R} ${ry} 0 0 1 ${cx + R} ${baseY}`, fill: "none", stroke: INK, "stroke-width": 1.4, "stroke-dasharray": "6 5" }));
    if (lab.h !== undefined) { dash(g, [cx, baseY], [cx, baseY - Hh]); rightMark(g, [cx, baseY], [1, 0], [0, -1]); dimLabel(g, lab.h, cx - 18, baseY - Hh * 0.45, { anchor: "end" }); }
    if (lab.r !== undefined) { dash(g, [cx, baseY], [cx + R, baseY]); dimLabel(g, lab.r, cx + R / 2, baseY + 18); }
    if (lab.l !== undefined) dimLabel(g, lab.l, cx + R / 2 + 16, baseY - Hh / 2 - 6, { anchor: "start" });
  }
  function cylinderAt(g, cx, baseY, R, Hh, lab, topOpen = false) {
    const ry = R * 0.3;
    const topY = baseY - Hh;
    g.appendChild(el("path", { d: `M ${cx - R} ${topY} L ${cx - R} ${baseY} A ${R} ${ry} 0 0 0 ${cx + R} ${baseY} L ${cx + R} ${topY}`, fill: SIDE, stroke: INK, "stroke-width": 2.4 }));
    g.appendChild(el("path", { d: `M ${cx - R} ${baseY} A ${R} ${ry} 0 0 1 ${cx + R} ${baseY}`, fill: "none", stroke: INK, "stroke-width": 1.4, "stroke-dasharray": "6 5" }));
    if (!topOpen) g.appendChild(el("ellipse", { cx, cy: topY, rx: R, ry, fill: TOPF, stroke: INK, "stroke-width": 2.4 }));
    else g.appendChild(el("path", { d: `M ${cx - R} ${topY} A ${R} ${ry} 0 0 0 ${cx + R} ${topY}`, fill: "none", stroke: INK, "stroke-width": 2.4 }));
    if (lab.ch !== undefined) dimLabel(g, lab.ch, cx + R + 12, baseY - Hh / 2, { anchor: "start" });
    if (lab.cr !== undefined) { dash(g, [cx, baseY], [cx + R, baseY]); dimLabel(g, lab.cr, cx + R / 2, baseY + 18); }
  }
  function hemiAt(g, cx, baseY, R, lab, up = true) {
    const ry = R * 0.3;
    const sweep = up ? 1 : 0;
    g.appendChild(el("path", { d: `M ${cx - R} ${baseY} A ${R} ${R} 0 0 ${sweep} ${cx + R} ${baseY} A ${R} ${ry} 0 0 ${sweep ? 1 : 0} ${cx - R} ${baseY}`, fill: SIDE, stroke: INK, "stroke-width": 2.4 }));
    g.appendChild(el("ellipse", { cx, cy: baseY, rx: R, ry, fill: up ? TOPF : "none", stroke: INK, "stroke-width": up ? 2.4 : 1.4, "stroke-dasharray": up ? null : "6 5" }));
    if (lab.r !== undefined) { dash(g, [cx, baseY], [cx + R, baseY]); dimLabel(g, lab.r, cx + R / 2, baseY - 14); }
  }

  function measured(target, c) {
    const g = el("g");
    const lab = c.labels || {};
    const d = c.dims || {};
    const kind = c.kind || "cone";
    let W = 340; let H = 320;
    if (kind === "cone") {
      const R = 90; const Hh = clampR((d.h || 2) / (d.r || 1), 0.8, 2.4) * R;
      coneAt(g, 170, 40 + Hh, R, Hh, lab);
      H = 40 + Hh + 50;
    } else if (kind === "cylinder") {
      const R = 80; const Hh = clampR((d.h || 2) / (d.r || 1), 0.6, 2.6) * R * 0.8;
      cylinderAt(g, 160, 40 + Hh, R, Hh, { ch: lab.h, cr: lab.r });
      H = 40 + Hh + 50;
    } else if (kind === "sphere") {
      const R = 110;
      g.appendChild(el("circle", { cx: 170, cy: 150, r: R, fill: FACE, stroke: INK, "stroke-width": 2.6 }));
      g.appendChild(el("path", { d: `M 60 150 A ${R} 32 0 0 0 280 150`, fill: "none", stroke: INK, "stroke-width": 1.6 }));
      g.appendChild(el("path", { d: `M 60 150 A ${R} 32 0 0 1 280 150`, fill: "none", stroke: INK, "stroke-width": 1.2, "stroke-dasharray": "6 5" }));
      g.appendChild(el("circle", { cx: 170, cy: 150, r: 3.5, fill: INK }));
      if (lab.r !== undefined) { dash(g, [170, 150], [280, 150]); dimLabel(g, lab.r, 225, 130); }
      if (lab.d !== undefined) { dash(g, [60, 150], [280, 150]); dimLabel(g, lab.d, 170, 130); }
      H = 280;
    } else if (kind === "hemisphere") {
      hemiAt(g, 170, 170, 120, lab);
      H = 230;
    } else if (kind === "pyramid") {
      const rect = c.base === "rectangle";
      const hh = clampR((d.h || 1.5) / ((d.a || 1) / 2), 0.9, 3.2);
      const ring = [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]].map(p => [p[0] * (rect ? 1.5 : 1), 0, p[2]]);
      const verts = [...ring, [0, hh, 0]];
      const faces = [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]];
      const pj = drawPoly3D(g, verts, faces);
      const apex = pj([0, hh, 0]);
      const foot = pj([0, 0, 0]);
      // front edge = the base edge nearest the viewer: z = −1
      const fm = pj([0, 0, -1]);
      if (lab.h !== undefined) { dash(g, apex, foot); g.appendChild(el("circle", { cx: r1(foot[0]), cy: r1(foot[1]), r: 2.5, fill: DIM })); dimLabel(g, lab.h, foot[0] - 14, (apex[1] + foot[1]) / 2 + 20, { anchor: "end" }); }
      if (lab.slant !== undefined) { dash(g, apex, fm, "#b91c1c"); dimLabel(g, lab.slant, (apex[0] + fm[0]) / 2 + 14, (apex[1] + fm[1]) / 2, { anchor: "start" }); }
      if (lab.a !== undefined) { const p = pj([0, 0, -1]); const q = pj([rect ? 1.5 : 1, 0, 0]); dimLabel(g, lab.a, p[0], p[1] + 22); if (lab.b !== undefined) dimLabel(g, lab.b, q[0] + 30, q[1] + 10); }
      if (lab.edge !== undefined) { const p = pj([1.5 * (rect ? 1 : 0.667), hh / 2, -0.5]); dimLabel(g, lab.edge, p[0] + 16, p[1], { anchor: "start" }); }
      H = 320;
    } else if (kind === "cone-cylinder" || kind === "hemisphere-cylinder") {
      const R = 70;
      const ch = clampR((d.ch || 2) / (d.r || 1), 0.6, 2.2) * R;
      const baseY = kind === "cone-cylinder" ? 40 + clampR((d.h || 1.5) / (d.r || 1), 0.8, 2) * R + ch : 40 + R + ch;
      cylinderAt(g, 170, baseY, R, ch, { ch: lab.ch, cr: lab.r }, true);
      if (kind === "cone-cylinder") coneAt(g, 170, baseY - ch, R, baseY - ch - 40, { h: lab.h, l: lab.l });
      else hemiAt(g, 170, baseY - ch, R, {});
      H = baseY + 46;
    } else if (kind === "cone-hemisphere") {
      // an ice-cream cone: hemisphere on top of an inverted cone
      const R = 80;
      const Hh = clampR((d.h || 2) / (d.r || 1), 1, 3) * R;
      const topY = 30 + R;
      hemiAt(g, 170, topY, R, { r: lab.r });
      g.appendChild(el("path", { d: `M ${170 - R} ${topY} L 170 ${topY + Hh} L ${170 + R} ${topY}`, fill: SIDE, stroke: INK, "stroke-width": 2.4 }));
      if (lab.h !== undefined) { dash(g, [170, topY], [170, topY + Hh]); dimLabel(g, lab.h, 158, topY + Hh * 0.55, { anchor: "end" }); }
      H = topY + Hh + 30;
    } else if (kind === "pyramid-prism") {
      const hh = clampR((d.h || 1) / ((d.a || 1) / 2), 0.7, 2.2);
      const ph = clampR((d.ph || 1) / ((d.a || 1) / 2), 0.6, 2.2);
      const ring = [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]];
      const top = ring.map(p => [p[0], ph, p[2]]);
      const verts = [...ring, ...top, [0, ph + hh, 0]];
      const faces = [[0, 1, 2, 3], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 8], [5, 6, 8], [6, 7, 8], [7, 4, 8]];
      const pj = drawPoly3D(g, verts, faces);
      const apex = pj([0, ph + hh, 0]); const foot = pj([0, ph, 0]);
      if (lab.h !== undefined) { dash(g, apex, foot); dimLabel(g, lab.h, foot[0] - 12, (apex[1] + foot[1]) / 2 + 10, { anchor: "end" }); }
      if (lab.a !== undefined) { const p = pj([0, 0, -1]); dimLabel(g, lab.a, p[0], p[1] + 22); }
      if (lab.ph !== undefined) { const p = pj([1, ph / 2, -1]); dimLabel(g, lab.ph, p[0] + 14, p[1], { anchor: "start" }); }
      H = 320;
    }
    return finish(target, g, W, H, "solid with measurements", {});
  }

  function render(target, config = {}) {
    const t = config.diagramType || "solid";
    if (t === "solid") return solid(target, config);
    if (t === "net") return net(target, config);
    if (t === "views") return views(target, config);
    if (t === "stack-views") return stackViews(target, config);
    if (t === "measured") return measured(target, config);
    if (target) target.innerHTML = `<div class="diagram-placeholder">Unknown solid diagram</div>`;
    return null;
  }

  return { render };
})();
