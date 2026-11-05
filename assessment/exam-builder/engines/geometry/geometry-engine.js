/*
  Mills Maths Tools — Geometry Figure Engine
  -------------------------------------------
  engines/geometry/geometry-engine.js

  Exposes: window.MMT_GEOMETRY_ENGINE.render(target, config)

  Built for Stage 4 "Properties of Geometrical Figures" (MA4-GEO-C-01) and the
  language half of "Angle Relationships" (MA4-ANG-C-01). Both topics are about
  reading the CONVENTIONS on a figure — vertex letters, equal-side ticks,
  parallel arrows, angle arcs, the right-angle square — so the engine draws
  exactly those, from coordinates the bank computes.

  The bank does the geometry, the engine only draws
  --------------------------------------------------
  Every figure is described by named points in a y-down user space, plus the
  primitives that sit on them. The bank chooses the coordinates, which means a
  triangle labelled 40°, 60°, 80° can actually BE that triangle, and a harness
  can re-measure the angle at a vertex from the config and check it against
  the answer. An engine that invented its own shapes could never be checked
  that way.

  Config
  ------
    points     { A: [x, y], ... }            named points (y grows downward)
    polygons   [{ pts: ["A","B","C"], fill }] closed outlines
    segments   [{ from, to, dashed, arrows }] intervals; arrows: "end" | "both"
    lines      [{ from, to, extend }]         lines through two points, drawn
                                              `extend` units past each end
    ticks      [{ from, to, count }]          equal-length marks on a side
    parallel   [{ from, to, count }]          parallel-arrow marks on a side
    angles     [{ at, from, to, label, right, arcs, radius, reflex }]
    sideLabels [{ from, to, text, flip }]     a label beside a side
    vertexLabels   true (default) | false | { A: false, ... }
    localLabels    true → vertex and side labels push away from their own
                   polygon's centre (for side-by-side similar figures)
    labelOffsets   { A: [dx, dy] }            nudge a vertex letter by hand
    dots       ["A", ...]                     points drawn as solid dots
    texts      [{ x, y, text, size, anchor }] free text
    circles    [{ centre: "O", through: "A", fill }] a circle through a named
               point (scale-free, so it survives fitPoints); drawn under the
               polygons, and included in the viewBox

  An angle label given as `null` draws an empty box, the convention the other
  newer engines use for "fill this in".
*/

window.MMT_GEOMETRY_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TEXT = 18;
  const INK = "#111827";
  const ACCENT = "#1d4ed8";
  const ARC = "#b91c1c";
  const FILL = "#eef4fc";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    return node;
  }

  function txt(parent, value, x, y, extra = {}) {
    const node = el("text", {
      x: round(x),
      y: round(y),
      "font-family": "'Cambria Math','Times New Roman',serif",
      "font-size": extra.size || TEXT,
      "text-anchor": extra.anchor || "middle",
      "dominant-baseline": "middle",
      fill: extra.fill || INK,
      "font-weight": extra.weight || 400,
      "font-style": extra.italic ? "italic" : "normal"
    });
    node.textContent = String(value);
    parent.appendChild(node);
    return node;
  }

  function round(v) {
    return Math.round(v * 10) / 10;
  }

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function len(a) { return Math.hypot(a[0], a[1]); }
  function unit(a) { const l = len(a) || 1; return [a[0] / l, a[1] / l]; }
  function perp(a) { return [-a[1], a[0]]; }

  function line(parent, p, q, extra = {}) {
    parent.appendChild(el("line", {
      x1: round(p[0]), y1: round(p[1]), x2: round(q[0]), y2: round(q[1]),
      stroke: extra.stroke || INK,
      "stroke-width": extra.width || 2.4,
      "stroke-linecap": "round",
      "stroke-dasharray": extra.dashed ? "7 6" : null
    }));
  }

  function arrowHead(parent, tip, dir, size = 11, color = INK) {
    const d = unit(dir);
    const n = perp(d);
    const back = sub(tip, mul(d, size));
    const a = add(back, mul(n, size * 0.45));
    const b = sub(back, mul(n, size * 0.45));
    parent.appendChild(el("polygon", {
      points: [tip, a, b].map(p => `${round(p[0])},${round(p[1])}`).join(" "),
      fill: color
    }));
  }

  /* Short strokes across the middle of a side: 1, 2 or 3 marks = equal sides. */
  function drawTicks(parent, p, q, count = 1) {
    const mid = mul(add(p, q), 0.5);
    const d = unit(sub(q, p));
    const n = perp(d);
    const gap = 6;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * gap;
      const c = add(mid, mul(d, offset));
      line(parent, add(c, mul(n, 8)), sub(c, mul(n, 8)), { width: 2 });
    }
  }

  /* Open chevrons pointing the same way along a side: marks parallel sides. */
  function drawParallelMarks(parent, p, q, count = 1, at = 0.5) {
    const mid = add(p, mul(sub(q, p), at));
    const d = unit(sub(q, p));
    const n = perp(d);
    const gap = 8;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * gap;
      const tip = add(mid, mul(d, offset + 5));
      const back = sub(tip, mul(d, 9));
      line(parent, add(back, mul(n, 7)), tip, { width: 2.2, stroke: ACCENT });
      line(parent, sub(back, mul(n, 7)), tip, { width: 2.2, stroke: ACCENT });
    }
  }

  function angleOf(v) {
    return Math.atan2(v[1], v[0]);
  }

  function normalise(a) {
    let x = a;
    while (x < 0) x += Math.PI * 2;
    while (x >= Math.PI * 2) x -= Math.PI * 2;
    return x;
  }

  /*
    Arc from ray at→from to ray at→to. By default the SMALLER of the two
    angles is marked; `reflex: true` marks the larger. Returns the direction
    of the bisector so the label can sit inside the arc.
  */
  function drawAngle(parent, P, spec) {
    const at = P[spec.at];
    const f = P[spec.from];
    const t = P[spec.to];
    if (!at || !f || !t) return;

    const a1 = normalise(angleOf(sub(f, at)));
    const a2 = normalise(angleOf(sub(t, at)));
    let sweep = normalise(a2 - a1);          // clockwise-on-screen sweep from a1 to a2
    let start = a1;
    if ((sweep > Math.PI) !== Boolean(spec.reflex)) {
      start = a2;
      sweep = Math.PI * 2 - sweep;
    }
    const mid = start + sweep / 2;
    const bis = [Math.cos(mid), Math.sin(mid)];

    if (spec.right) {
      const s = spec.radius || 16;
      const u1 = unit(sub(f, at));
      const u2 = unit(sub(t, at));
      const p1 = add(at, mul(u1, s));
      const p2 = add(at, mul(u2, s));
      const p3 = add(p1, mul(u2, s));
      parent.appendChild(el("polyline", {
        points: [p1, p3, p2].map(p => `${round(p[0])},${round(p[1])}`).join(" "),
        fill: "none", stroke: ARC, "stroke-width": 2
      }));
    } else {
      const arcs = Math.max(1, spec.arcs || 1);
      const base = spec.radius || (sweep < 0.6 ? 40 : sweep < 1.1 ? 30 : 24);
      for (let i = 0; i < arcs; i++) {
        const r = base + i * 5;
        const s = [at[0] + r * Math.cos(start), at[1] + r * Math.sin(start)];
        const e = [at[0] + r * Math.cos(start + sweep), at[1] + r * Math.sin(start + sweep)];
        const large = sweep > Math.PI ? 1 : 0;
        parent.appendChild(el("path", {
          d: `M ${round(s[0])} ${round(s[1])} A ${r} ${r} 0 ${large} 1 ${round(e[0])} ${round(e[1])}`,
          fill: "none", stroke: ARC, "stroke-width": 2
        }));
      }
    }

    if (spec.label === undefined || spec.label === false) return;
    const baseR = spec.right ? 16 : (spec.radius || (sweep < 0.6 ? 40 : sweep < 1.1 ? 30 : 24));
    let labelR = baseR + (spec.labelGap || (sweep < 0.6 ? 24 : 20)) + ((spec.arcs || 1) - 1) * 5;
    // A narrow angle needs its label further out, where the arms are far
    // enough apart to hold the text between them.
    // A long label such as (2x + 3)° needs more room again, in proportion to its width.
    const halfW = Math.max(17, String(spec.label ?? "").length * (TEXT - 1) * 0.27 + 4);
    if (!spec.right && sweep < 1.2) labelR = Math.min(110, Math.max(labelR, 17 / Math.sin(sweep / 2)));
    if (!spec.right && halfW > 17 && sweep < 2.2) labelR = Math.min(150, Math.max(labelR, halfW / Math.sin(sweep / 2)));
    const pos = add(at, mul(bis, labelR));
    if (spec.label === null || spec.label === "") {
      parent.appendChild(el("rect", {
        x: round(pos[0] - 22), y: round(pos[1] - 14), width: 44, height: 28, rx: 3,
        fill: "#ffffff", stroke: INK, "stroke-width": 1.8
      }));
      return;
    }
    txt(parent, spec.label, pos[0], pos[1], { fill: ARC, weight: 700, size: TEXT - 1 });
  }

  function centroidOf(points) {
    const vals = Object.values(points);
    if (!vals.length) return [0, 0];
    const s = vals.reduce((acc, p) => add(acc, p), [0, 0]);
    return mul(s, 1 / vals.length);
  }

  function render(target, config = {}) {
    const P = {};
    Object.entries(config.points || {}).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length === 2) P[k] = [Number(v[0]), Number(v[1])];
    });

    const g = el("g");

    // Circles (circle geometry) sit under everything.
    const circleBounds = [];
    (config.circles || []).forEach(spec => {
      const c = P[spec.centre];
      const t = P[spec.through];
      if (!c || !t) return;
      const r = Math.hypot(t[0] - c[0], t[1] - c[1]);
      g.appendChild(el("circle", { cx: round(c[0]), cy: round(c[1]), r: round(r), fill: spec.fill || "none", stroke: INK, "stroke-width": 2.6 }));
      circleBounds.push([c[0] - r, c[1] - r], [c[0] + r, c[1] + r]);
    });

    // Fills first so every outline sits on top of every fill.
    (config.polygons || []).forEach(poly => {
      const pts = (poly.pts || []).map(k => P[k]).filter(Boolean);
      if (pts.length < 3) return;
      g.appendChild(el("polygon", {
        points: pts.map(p => `${round(p[0])},${round(p[1])}`).join(" "),
        fill: poly.fill === false ? "none" : (poly.fill || FILL),
        stroke: INK,
        "stroke-width": 2.6,
        "stroke-linejoin": "round"
      }));
    });

    (config.lines || []).forEach(spec => {
      const p = P[spec.from];
      const q = P[spec.to];
      if (!p || !q) return;
      const d = unit(sub(q, p));
      const ext = spec.extend ?? 30;
      const a = sub(p, mul(d, ext));
      const b = add(q, mul(d, ext));
      line(g, a, b, { dashed: spec.dashed });
      if (spec.arrows !== false) {
        arrowHead(g, a, mul(d, -1));
        arrowHead(g, b, d);
      }
    });

    (config.segments || []).forEach(spec => {
      const p = P[spec.from];
      const q = P[spec.to];
      if (!p || !q) return;
      line(g, p, q, { dashed: spec.dashed, width: spec.width });
      if (spec.arrows === "end" || spec.arrows === "both") arrowHead(g, q, sub(q, p));
      if (spec.arrows === "both") arrowHead(g, p, sub(p, q));
    });

    (config.ticks || []).forEach(spec => {
      if (P[spec.from] && P[spec.to]) drawTicks(g, P[spec.from], P[spec.to], spec.count || 1);
    });

    (config.parallel || []).forEach(spec => {
      if (P[spec.from] && P[spec.to]) drawParallelMarks(g, P[spec.from], P[spec.to], spec.count || 1, spec.at ?? 0.5);
    });

    (config.angles || []).forEach(spec => drawAngle(g, P, spec));

    const centre = config.centre ? P[config.centre] || config.centre : centroidOf(P);
    // With several separate polygons (similar-figure pairs), each label
    // pushes away from ITS OWN polygon's centre, not the whole figure's.
    const polyCentres = config.centre ? [] : (config.polygons || []).filter(pg => config.localLabels).map(pg => {
      const pts = (pg.pts || []).map(k => P[k]).filter(Boolean);
      return { keys: pg.pts || [], c: pts.length ? mul(pts.reduce((a, b) => add(a, b), [0, 0]), 1 / pts.length) : centre };
    });
    const centreFor = (...keys) => { const hit = polyCentres.find(pc => keys.every(k => pc.keys.includes(k))); return hit ? hit.c : centre; };

    (config.sideLabels || []).forEach(spec => {
      const p = P[spec.from];
      const q = P[spec.to];
      if (!p || !q) return;
      const mid = mul(add(p, q), 0.5);
      let n = unit(perp(sub(q, p)));
      const cc = centreFor(spec.from, spec.to);
      // Push the label AWAY from the figure's centre, unless told otherwise.
      if ((n[0] * (mid[0] - cc[0]) + n[1] * (mid[1] - cc[1]) < 0) !== Boolean(spec.flip)) n = mul(n, -1);
      const pos = add(mid, mul(n, spec.offset || 22));
      txt(g, spec.text, pos[0], pos[1], { weight: 700, fill: ACCENT });
    });

    (config.dots || []).forEach(k => {
      if (!P[k]) return;
      g.appendChild(el("circle", { cx: round(P[k][0]), cy: round(P[k][1]), r: 4.2, fill: INK }));
    });

    const showVertex = config.vertexLabels !== false;
    if (showVertex) {
      Object.entries(P).forEach(([name, p]) => {
        if (typeof config.vertexLabels === "object" && config.vertexLabels[name] === false) return;
        if (/^_/.test(name)) return;                 // helper points start with "_"
        const manual = config.labelOffsets?.[name];
        let off;
        if (manual) off = manual;
        else {
          const away = sub(p, centreFor(name));
          off = len(away) < 1 ? [0, -20] : mul(unit(away), 20);
        }
        txt(g, name, p[0] + off[0], p[1] + off[1], { weight: 700, italic: false });
      });
    }

    (config.texts || []).forEach(t => {
      txt(g, t.text, t.x, t.y, { size: t.size || TEXT, anchor: t.anchor, weight: t.weight, fill: t.fill });
    });

    // viewBox from everything placed, with room for labels.
    const xs = [];
    const ys = [];
    Object.values(P).forEach(p => { xs.push(p[0]); ys.push(p[1]); });
    circleBounds.forEach(p => { xs.push(p[0]); ys.push(p[1]); });
    (config.texts || []).forEach(t => { xs.push(t.x); ys.push(t.y); });
    const extendPad = Math.max(0, ...(config.lines || []).map(l => (l.extend ?? 30)));
    const pad = 44 + extendPad;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2;
    const h = Math.max(...ys) - Math.min(...ys) + pad * 2;

    const svg = el("svg", {
      viewBox: `${round(minX)} ${round(minY)} ${round(w)} ${round(h)}`,
      width: "100%",
      role: "img",
      "aria-label": config.ariaLabel || "geometry figure"
    });
    svg.appendChild(g);

    if (target) {
      target.innerHTML = "";
      target.appendChild(svg);
    }
    return svg;
  }

  return { render };
})();
