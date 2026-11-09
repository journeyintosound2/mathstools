// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/plane/plane-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Cartesian Plane Engine (Stage 5)
  -----------------------------------------------------
  engines/plane/plane-engine.js

  Exposes: window.MMT_PLANE_ENGINE.render(target, config)

  One number plane for every Stage 5 graph, so a parabola, a hyperbola and a
  line of best fit all print in the same visual language. The curve and the
  answer come from the SAME parameters — nothing is approximated for drawing.

  diagramType
  -----------
    plane     (default) one set of axes
    options   several small labelled planes (A, B, C, D) side by side, for
              "which graph shows…" questions: `panels: [{ label, ...plane }]`,
              `columns` (default all in one row; 2 gives a 2 × 2 grid)

  Plane config
  ------------
    xMin, xMax, yMin, yMax        the window
    xStep, yStep                  tick/label spacing (default 1)
    xLabelEvery, yLabelEvery      label every n-th tick (default 1)
    grid                          true (default) | false
    degrees                       true → x labels carry °
    equal                         true forces 1:1 units (circles do this
                                  automatically); false never; default auto
    axisNames                     ["x", "y"] (default)
    numbers                       false hides the tick numbers (option cards)
    curves  [{ kind, …params, label, dashed, domain: [a, b], colour }]
      line        { m, c } | { x } (vertical) | { a, b, c } (ax + by + c = 0)
      quadratic   { a, b, c } | { a, h, k } (vertex form)
      poly        { coeffs: [aₙ … a₀] } | { a, roots: [...] }
      exp         y = a·baseˣ⁻ʰ + k           { a, base, h, k }  (asymptote y = k)
      log         y = a·log_base(x − h) + k   { a, base, h, k }  (asymptote x = h)
      hyperbola   y = k/(x − h) + v           { k, h, v }        (asymptotes)
      circle      (x − h)² + (y − k)² = r²     { h, k, r }
      sin|cos|tan y = a·f(b·x) + c, x in degrees { a, b, c }
      asymptotes are drawn dashed automatically; `asymptotes: false` hides them
    points    [{ x, y, label, hollow, labelPos: "ne"|"nw"|"se"|"sw"|"n"|"s"|"e"|"w" }]
    segments  [{ from: [x, y], to: [x, y], dashed, label }]
    regions   [{ a, b, c, op }]  — shades where a·x + b·y + c op 0 for ALL of
              them (op one of < <= > >=); strict boundaries dashed, inclusive
              solid. Vertical boundary: b = 0.
    polylines [{ pts: [[x, y], …], dashed, colour, label }] piecewise graphs
    texts     [{ x, y, text }] in plane coordinates
*/

window.MMT_PLANE_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const TEXT = 16;
  const INK = "#111827";
  const GRID = "#dbe3ec";
  const AXIS = "#111827";
  const COLOURS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#c2410c"];
  const SHADE = "rgba(37, 99, 235, 0.16)";
  const FONT = "'Cambria Math','Times New Roman',serif";
  const r2 = v => Math.round(v * 100) / 100;
  let uid = 0;

  function el(n, a = {}) {
    const e = document.createElementNS(NS, n);
    Object.entries(a).forEach(([k, v]) => { if (v !== undefined && v !== null) e.setAttribute(k, String(v)); });
    return e;
  }
  function text(g, v, x, y, o = {}) {
    const t = el("text", { x: r2(x), y: r2(y), "font-family": FONT, "font-size": o.size || TEXT, "text-anchor": o.anchor || "middle", "dominant-baseline": o.baseline || "middle", "font-weight": o.weight || 400, "font-style": o.italic ? "italic" : null, fill: o.fill || INK });
    t.textContent = String(v);
    g.appendChild(t);
    return t;
  }
  const minus = v => (v < 0 ? `−${Math.abs(v)}` : String(v));
  const tickText = (v, deg) => {
    const s = String(Math.round(v * 1000) / 1000);
    return minus(Number(s)) + (deg ? "°" : "");
  };

  /* ── evaluation ─────────────────────────────────────────── */
  const RAD = Math.PI / 180;
  function evalCurve(c, x) {
    switch (c.kind) {
      case "line":
        if (Number.isFinite(c.x)) return NaN;
        if (Number.isFinite(c.m)) return c.m * x + (c.c || 0);
        return c.b ? -(c.a * x + (c.c || 0)) / c.b : NaN;
      case "quadratic":
        if (Number.isFinite(c.h)) return c.a * (x - c.h) ** 2 + (c.k || 0);
        return c.a * x * x + (c.b || 0) * x + (c.c || 0);
      case "poly":
        if (Array.isArray(c.roots)) return (c.a ?? 1) * c.roots.reduce((p, r) => p * (x - r), 1);
        return (c.coeffs || []).reduce((acc, k) => acc * x + k, 0);
      case "exp": return (c.a ?? 1) * (c.base ?? 2) ** (x - (c.h || 0)) + (c.k || 0);
      case "log": {
        const u = x - (c.h || 0);
        return u > 0 ? (c.a ?? 1) * Math.log(u) / Math.log(c.base ?? 10) + (c.k || 0) : NaN;
      }
      case "hyperbola": {
        const u = x - (c.h || 0);
        return Math.abs(u) < 1e-12 ? NaN : c.k / u + (c.v || 0);
      }
      case "sin": return (c.a ?? 1) * Math.sin((c.b ?? 1) * x * RAD) + (c.c || 0);
      case "cos": return (c.a ?? 1) * Math.cos((c.b ?? 1) * x * RAD) + (c.c || 0);
      case "tan": {
        const t = ((c.b ?? 1) * x) % 180;
        if (Math.abs(Math.abs(t) - 90) < 1e-9) return NaN;
        return (c.a ?? 1) * Math.tan((c.b ?? 1) * x * RAD) + (c.c || 0);
      }
      default: return NaN;
    }
  }

  function asymptotesOf(c, win) {
    if (c.asymptotes === false) return [];
    if (c.kind === "exp") return [{ y: c.k || 0 }];
    if (c.kind === "log") return [{ x: c.h || 0 }];
    if (c.kind === "hyperbola") return [{ x: c.h || 0 }, { y: c.v || 0 }];
    if (c.kind === "tan") {
      const out = [];
      const b = c.b ?? 1;
      for (let x = 90 / b; x <= win.xMax; x += 180 / b) if (x >= win.xMin) out.push({ x });
      for (let x = -90 / b; x >= win.xMin; x -= 180 / b) if (x <= win.xMax) out.push({ x });
      return out;
    }
    return [];
  }

  /* Clip a convex polygon by the half-plane a·x + b·y + c ≥ 0 (or ≤). */
  function clipHalf(poly, a, b, c, keepPositive) {
    const f = p => (a * p[0] + b * p[1] + c) * (keepPositive ? 1 : -1);
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i];
      const Q = poly[(i + 1) % poly.length];
      const fp = f(P);
      const fq = f(Q);
      if (fp >= 0) out.push(P);
      if ((fp >= 0) !== (fq >= 0)) {
        const t = fp / (fp - fq);
        out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
      }
    }
    return out;
  }

  /* ── one plane, drawn into group g inside box {x, y, w, h} ─ */
  function drawPlane(g, cfg, box, small = false) {
    const win = {
      xMin: cfg.xMin ?? -5, xMax: cfg.xMax ?? 5,
      yMin: cfg.yMin ?? -5, yMax: cfg.yMax ?? 5
    };
    const xr = win.xMax - win.xMin;
    const yr = win.yMax - win.yMin;
    let ux = box.w / xr;
    let uy = box.h / yr;
    const wantEqual = cfg.equal === true || (cfg.equal !== false && ((cfg.curves || []).some(c => c.kind === "circle") || Math.max(ux, uy) / Math.min(ux, uy) < 1.7));
    if (wantEqual) { ux = uy = Math.min(ux, uy); }
    const W = ux * xr;
    const H = uy * yr;
    const ox = box.x + (box.w - W) / 2;
    const oy = box.y;
    const X = x => ox + (x - win.xMin) * ux;
    const Y = y => oy + (win.yMax - y) * uy;
    const xStep = cfg.xStep || 1;
    const yStep = cfg.yStep || 1;
    // Label every second tick on busy axes so the numbers stay legible.
    const xEvery = cfg.xLabelEvery || (xr / xStep > 10 ? 2 : 1);
    const yEvery = cfg.yLabelEvery || (yr / yStep > 10 ? 2 : 1);
    const clipId = `mmtpl${++uid}`;
    const defs = el("defs");
    const cp = el("clipPath", { id: clipId });
    cp.appendChild(el("rect", { x: r2(X(win.xMin)), y: r2(Y(win.yMax)), width: r2(W), height: r2(H) }));
    defs.appendChild(cp);
    g.appendChild(defs);

    // grid
    if (cfg.grid !== false) {
      for (let x = Math.ceil(win.xMin / xStep) * xStep; x <= win.xMax + 1e-9; x += xStep) g.appendChild(el("line", { x1: r2(X(x)), y1: r2(Y(win.yMin)), x2: r2(X(x)), y2: r2(Y(win.yMax)), stroke: GRID, "stroke-width": 1 }));
      for (let y = Math.ceil(win.yMin / yStep) * yStep; y <= win.yMax + 1e-9; y += yStep) g.appendChild(el("line", { x1: r2(X(win.xMin)), y1: r2(Y(y)), x2: r2(X(win.xMax)), y2: r2(Y(y)), stroke: GRID, "stroke-width": 1 }));
    }

    // regions (under everything else)
    if (Array.isArray(cfg.regions) && cfg.regions.length) {
      let poly = [[win.xMin, win.yMin], [win.xMax, win.yMin], [win.xMax, win.yMax], [win.xMin, win.yMax]];
      cfg.regions.forEach(rg => { poly = clipHalf(poly, rg.a, rg.b, rg.c, rg.op === ">" || rg.op === ">="); });
      if (poly.length >= 3) g.appendChild(el("polygon", { points: poly.map(p => `${r2(X(p[0]))},${r2(Y(p[1]))}`).join(" "), fill: SHADE, stroke: "none" }));
      cfg.regions.forEach(rg => {
        const strict = rg.op === "<" || rg.op === ">";
        const line = rg.b === 0 ? { kind: "line", x: -rg.c / rg.a } : { kind: "line", a: rg.a, b: rg.b, c: rg.c };
        drawCurve(g, { ...line, dashed: strict, colour: INK }, win, X, Y, clipId, 0);
      });
    }

    // axes
    const x0 = Math.min(Math.max(0, win.xMin), win.xMax);
    const y0 = Math.min(Math.max(0, win.yMin), win.yMax);
    g.appendChild(el("line", { x1: r2(X(win.xMin)), y1: r2(Y(y0)), x2: r2(X(win.xMax) + 12), y2: r2(Y(y0)), stroke: AXIS, "stroke-width": 2 }));
    g.appendChild(el("line", { x1: r2(X(x0)), y1: r2(Y(win.yMin)), x2: r2(X(x0)), y2: r2(Y(win.yMax) - 12), stroke: AXIS, "stroke-width": 2 }));
    g.appendChild(el("polygon", { points: `${r2(X(win.xMax) + 18)},${r2(Y(y0))} ${r2(X(win.xMax) + 8)},${r2(Y(y0) - 5)} ${r2(X(win.xMax) + 8)},${r2(Y(y0) + 5)}`, fill: AXIS }));
    g.appendChild(el("polygon", { points: `${r2(X(x0))},${r2(Y(win.yMax) - 18)} ${r2(X(x0) - 5)},${r2(Y(win.yMax) - 8)} ${r2(X(x0) + 5)},${r2(Y(win.yMax) - 8)}`, fill: AXIS }));
    const [nx, ny] = cfg.axisNames || ["x", "y"];
    text(g, nx, X(win.xMax) + 22, Y(y0) + 14, { italic: true, anchor: "start", size: TEXT + 1 });
    text(g, ny, X(x0) + 12, Y(win.yMax) - 16, { italic: true, anchor: "start", size: TEXT + 1 });

    // ticks and numbers
    const fs = small ? TEXT - 3 : TEXT - 2;
    if (cfg.numbers !== false) {
      let i = 0;
      for (let x = Math.ceil(win.xMin / xStep) * xStep; x <= win.xMax + 1e-9; x += xStep, i++) {
        if (Math.abs(x) < 1e-9) continue;
        g.appendChild(el("line", { x1: r2(X(x)), y1: r2(Y(y0) - 4), x2: r2(X(x)), y2: r2(Y(y0) + 4), stroke: AXIS, "stroke-width": 1.5 }));
        if (Math.round(x / xStep) % xEvery === 0) text(g, tickText(x, cfg.degrees), X(x), Y(y0) + 15, { size: fs });
      }
      for (let y = Math.ceil(win.yMin / yStep) * yStep; y <= win.yMax + 1e-9; y += yStep) {
        if (Math.abs(y) < 1e-9) continue;
        g.appendChild(el("line", { x1: r2(X(x0) - 4), y1: r2(Y(y)), x2: r2(X(x0) + 4), y2: r2(Y(y)), stroke: AXIS, "stroke-width": 1.5 }));
        if (Math.round(y / yStep) % yEvery === 0) text(g, tickText(y), X(x0) - 8, Y(y), { size: fs, anchor: "end" });
      }
      if (win.xMin <= 0 && win.xMax >= 0 && win.yMin <= 0 && win.yMax >= 0) text(g, "0", X(0) - 8, Y(0) + 14, { size: fs, anchor: "end" });
    }

    // asymptotes then curves
    (cfg.curves || []).forEach(c => asymptotesOf(c, win).forEach(a => {
      if (Number.isFinite(a.x)) { if (a.x >= win.xMin && a.x <= win.xMax) g.appendChild(el("line", { x1: r2(X(a.x)), y1: r2(Y(win.yMin)), x2: r2(X(a.x)), y2: r2(Y(win.yMax)), stroke: "#6b7280", "stroke-width": 1.6, "stroke-dasharray": "6 5" })); }
      else if (a.y >= win.yMin && a.y <= win.yMax) g.appendChild(el("line", { x1: r2(X(win.xMin)), y1: r2(Y(a.y)), x2: r2(X(win.xMax)), y2: r2(Y(a.y)), stroke: "#6b7280", "stroke-width": 1.6, "stroke-dasharray": "6 5" }));
    }));
    (cfg.curves || []).forEach((c, i) => drawCurve(g, c, win, X, Y, clipId, i));

    // segments
    (cfg.segments || []).forEach(s => {
      g.appendChild(el("line", { x1: r2(X(s.from[0])), y1: r2(Y(s.from[1])), x2: r2(X(s.to[0])), y2: r2(Y(s.to[1])), stroke: s.colour || COLOURS[0], "stroke-width": 2.6, "stroke-dasharray": s.dashed ? "7 5" : null, "clip-path": `url(#${clipId})` }));
      if (s.label) text(g, s.label, (X(s.from[0]) + X(s.to[0])) / 2 + 12, (Y(s.from[1]) + Y(s.to[1])) / 2 - 12, { weight: 700, fill: s.colour || COLOURS[0] });
    });

    // polylines (piecewise graphs: travel graphs, filling containers)
    (cfg.polylines || []).forEach(pl => {
      g.appendChild(el("polyline", { points: pl.pts.map(p => `${r2(X(p[0]))},${r2(Y(p[1]))}`).join(" "), fill: "none", stroke: pl.colour || COLOURS[0], "stroke-width": 2.6, "stroke-linejoin": "round", "stroke-dasharray": pl.dashed ? "7 5" : null, "clip-path": `url(#${clipId})` }));
      if (pl.label) { const e = pl.pts[pl.pts.length - 1]; text(g, pl.label, X(e[0]) + 8, Y(e[1]) - 10, { anchor: "start", weight: 700, fill: pl.colour || COLOURS[0] }); }
    });

    // points
    const OFF = { ne: [8, -12, "start"], nw: [-8, -12, "end"], se: [8, 14, "start"], sw: [-8, 14, "end"], n: [0, -16, "middle"], s: [0, 18, "middle"], e: [10, 0, "start"], w: [-10, 0, "end"] };
    (cfg.points || []).forEach(p => {
      g.appendChild(el("circle", { cx: r2(X(p.x)), cy: r2(Y(p.y)), r: 4.5, fill: p.hollow ? "#fff" : INK, stroke: INK, "stroke-width": 1.8 }));
      if (p.label) {
        const [dx, dy, anchor] = OFF[p.labelPos || "ne"];
        text(g, p.label, X(p.x) + dx, Y(p.y) + dy, { anchor, weight: 700, size: TEXT - 1 });
      }
    });

    (cfg.texts || []).forEach(t => text(g, t.text, X(t.x), Y(t.y), { weight: 700, fill: t.colour || INK, size: t.size || TEXT }));
    return { w: W, h: H, ox, oy };
  }

  function drawCurve(g, c, win, X, Y, clipId, i) {
    const colour = c.colour || COLOURS[i % COLOURS.length];
    const style = { fill: "none", stroke: colour, "stroke-width": 2.6, "stroke-dasharray": c.dashed ? "8 6" : null, "stroke-linejoin": "round", "clip-path": `url(#${clipId})` };
    let labelAt = null;
    if (c.kind === "circle") {
      g.appendChild(el("ellipse", { ...style, cx: r2(X(c.h || 0)), cy: r2(Y(c.k || 0)), rx: r2(X((c.h || 0) + c.r) - X(c.h || 0)), ry: r2(Y(c.k || 0) - Y((c.k || 0) + c.r)) }));
      labelAt = [X((c.h || 0) + c.r * 0.72), Y((c.k || 0) + c.r * 0.72)];
    } else if (c.kind === "line" && Number.isFinite(c.x)) {
      g.appendChild(el("line", { ...style, x1: r2(X(c.x)), y1: r2(Y(win.yMin)), x2: r2(X(c.x)), y2: r2(Y(win.yMax)) }));
      labelAt = [X(c.x) + 8, Y(win.yMax) + 14];
    } else {
      const [a, b] = c.domain || [win.xMin, win.xMax];
      const n = 600;
      const pad = (win.yMax - win.yMin) * 2;
      let d = "";
      let pen = false;
      let prev = null;
      const cands = [];
      for (let k = 0; k <= n; k++) {
        const x = a + (b - a) * k / n;
        const y = evalCurve(c, x);
        const ok = Number.isFinite(y) && y > win.yMin - pad && y < win.yMax + pad;
        const jump = prev !== null && ok && Math.abs(y - prev) > (win.yMax - win.yMin) * 1.5;
        if (!ok || jump) { pen = false; prev = ok ? y : null; if (!ok) continue; }
        d += `${pen ? "L" : "M"}${r2(X(x))} ${r2(Y(y))} `;
        pen = true;
        prev = y;
        if (y <= win.yMax && y >= win.yMin && k % 6 === 0) cands.push([x, y]);
      }
      if (d) g.appendChild(el("path", { ...style, d }));
      // Label where the curve is furthest from both axes and the frame (so it
      // never sits on the axis numbers), preferring the right-hand side and
      // spreading successive curves apart by index.
      const x0 = Math.min(Math.max(0, win.xMin), win.xMax);
      const y0 = Math.min(Math.max(0, win.yMin), win.yMax);
      let best = -Infinity;
      cands.forEach(([x, y]) => {
        const px = X(x); const py = Y(y);
        const dAxis = Math.min(Math.abs(px - X(x0)), Math.abs(py - Y(y0)));
        const dFrame = Math.min(px - X(win.xMin), X(win.xMax) - px, py - Y(win.yMax), Y(win.yMin) - py);
        const score = Math.min(dAxis, 70) + Math.min(dFrame, 40) + (i % 2 === 0 ? 0.08 : -0.08) * (px - X(win.xMin));
        if (score > best) { best = score; labelAt = [px, py]; }
      });
    }
    if (c.label && labelAt) {
      // Write the label on the far side of the point from the y-axis, unless
      // that would run off the right-hand edge.
      const axisX = X(Math.min(Math.max(0, win.xMin), win.xMax));
      const nearRight = labelAt[0] > X(win.xMax) - 110 || (labelAt[0] < axisX && labelAt[0] > X(win.xMin) + 110);
      const t = text(g, c.label, labelAt[0] + (c.labelDx ?? (nearRight ? -8 : 10)), labelAt[1] + (c.labelDy ?? (nearRight ? -14 : 4)), { anchor: nearRight ? "end" : "start", weight: 700, fill: colour, size: TEXT - 1 });
      t.setAttribute("stroke", "#fff"); t.setAttribute("stroke-width", "4"); t.setAttribute("paint-order", "stroke");
    }
  }

  function finish(target, g, w, h, label) {
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, width: "100%", role: "img", "aria-label": label });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }

  function plane(target, cfg) {
    const g = el("g");
    const bw = cfg.width || 420;
    const bh = cfg.height || 300;
    const box = { x: 46, y: 28, w: bw, h: bh };
    const res = drawPlane(g, cfg, box);
    return finish(target, g, res.ox + res.w + 50, res.oy + res.h + 36, "graph");
  }

  function options(target, cfg) {
    const g = el("g");
    const panels = cfg.panels || [];
    const cols = cfg.columns || panels.length;
    const pw = cfg.panelWidth || (cols <= 2 ? 230 : 190);
    const ph = cfg.panelHeight || (cols <= 2 ? 190 : 150);
    const cw = pw + 44; const rh = ph + 50;
    panels.forEach((p, i) => {
      const cx = 10 + (i % cols) * cw; const cy = Math.floor(i / cols) * rh;
      const sub = el("g");
      text(sub, p.label, cx + 2, cy + 16, { weight: 700, size: TEXT + 4, anchor: "start" });
      drawPlane(sub, { numbers: false, grid: false, ...p }, { x: cx + 22, y: cy + 26, w: pw, h: ph }, true);
      g.appendChild(sub);
    });
    const rows = Math.ceil(panels.length / cols);
    return finish(target, g, 10 + cols * cw, rows * rh + 10, "graph options");
  }

  function render(target, config = {}) {
    if (config.diagramType === "options") return options(target, config);
    return plane(target, config);
  }

  return { render, evalCurve };
})();
