// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/grid/grid-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Square Grid Engine
  ---------------------------------------
  engines/grid/grid-engine.js

  Exposes: window.MMT_GRID_ENGINE.render(target, config)

  One square grid, three Stage 3 jobs:

    - TRANSFORMATIONS (MA3-2DS-02): a shape and its image, so the student
      NAMES the move (slide, flip, turn) or DESCRIBES a translation in grid
      squares — or an empty grid with the shape alone, to draw the image.
    - SYMMETRY: half a shape against a dashed mirror line, to complete; or a
      whole shape with a dashed line, to judge.
    - GRID MAPS (MA3-GM-01): letters across the top and numbers down the side
      label the SPACES, which is the syllabus's point about grid references
      naming an area, not a point. (The number plane, which labels LINES, is
      drawn by the linear engine; the contrast is deliberate.)

  Config (all positions in grid units, y DOWN, (0,0) = top-left corner)
  ------
    cols, rows          grid size
    cell                pixels per square (default 30)
    shapes   [{ pts: [[x,y],…], style: "solid"|"image"|"ghost", label }]
    mirror   { x1, y1, x2, y2 }       dashed red line
    dots     [{ x, y, label }]        centre of rotation etc.
    map      true → letters/numbers label the spaces; `icons`
    icons    [{ col, row, kind, label }]   kind: house tree school shop
             park pool star flag tent  (col/row are 0-based cells)
    north    true → a north arrow to the right of the grid (Stage 2 maps)
    countable  true → grid lines are redrawn over the shapes so the squares
             inside can be counted (area by counting)
    shapes[].labelAt [x,y] places a shape's label (default: vertex average)
    path     [[x,y],…] a route drawn as a thick arrowed line (grid units)
*/

window.MMT_GRID_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const TEXT = 16;
  const INK = "#111827";
  const GRID = "#c9d3df";
  const FILL = "#bcd3ee";
  const IMAGE = "#f6c9a8";
  const RED = "#b91c1c";
  const FONT = "'Cambria Math','Times New Roman',serif";
  const r1 = v => Math.round(v * 10) / 10;

  function el(n, a = {}) {
    const e = document.createElementNS(NS, n);
    Object.entries(a).forEach(([k, v]) => { if (v !== undefined && v !== null) e.setAttribute(k, String(v)); });
    return e;
  }
  function text(g, v, x, y, o = {}) {
    const t = el("text", { x: r1(x), y: r1(y), "font-family": FONT, "font-size": o.size || TEXT, "text-anchor": o.anchor || "middle", "dominant-baseline": "middle", "font-weight": o.weight || 400, fill: o.fill || INK });
    t.textContent = String(v);
    g.appendChild(t);
  }

  function icon(g, kind, x, y, s) {
    const k = s / 30;
    const P = (d, f) => g.appendChild(el("path", { d, fill: f, stroke: INK, "stroke-width": 1.2 * k, transform: `translate(${r1(x)} ${r1(y)}) scale(${k})` }));
    if (kind === "tree") { P("M-2 6 h4 v7 h-4 z", "#92400e"); P("M0 -12 L9 6 L-9 6 Z", "#4ade80"); }
    else if (kind === "house") { P("M-9 -1 L0 -10 L9 -1 Z", "#f87171"); P("M-7 -1 h14 v11 h-14 z", "#fde68a"); }
    else if (kind === "school") { P("M-11 -3 h22 v13 h-22 z", "#fde68a"); P("M-12 -3 L0 -11 L12 -3 Z", "#60a5fa"); P("M-2 3 h4 v7 h-4 z", "#fff"); }
    else if (kind === "shop") { P("M-10 -4 h20 v14 h-20 z", "#fff"); P("M-11 -9 h22 v5 h-22 z", "#f472b6"); }
    else if (kind === "park") { P("M-10 8 h20 v2 h-20 z", "#4ade80"); P("M-6 8 v-8 M6 8 v-8 M-8 0 h16", "none"); }
    else if (kind === "pool") { P("M-11 -7 h22 v14 h-22 z", "#93c5fd"); }
    else if (kind === "star") { P("M0 -11 L3 -3 L11 -3 L5 2 L7 10 L0 5 L-7 10 L-5 2 L-11 -3 L-3 -3 Z", "#facc15"); }
    else if (kind === "flag") { P("M-6 11 V-11", "none"); P("M-6 -11 L9 -6 L-6 -1 Z", "#f87171"); }
    else if (kind === "tent") { P("M-11 9 L0 -10 L11 9 Z", "#fb923c"); P("M0 -10 L0 9", "none"); }
    else P("M-6 -6 h12 v12 h-12 z", "#e5e7eb");
  }

  function render(target, c = {}) {
    const cols = c.cols || 10;
    const rows = c.rows || 8;
    const s = c.cell || (c.map ? 44 : 30);
    const map = Boolean(c.map);
    const ox = map ? 30 : 10;
    const oy = map ? 30 : 10;
    const X = v => ox + v * s;
    const Y = v => oy + v * s;
    const g = el("g");

    g.appendChild(el("rect", { x: ox, y: oy, width: cols * s, height: rows * s, fill: "#fff", stroke: "none" }));
    for (let i = 0; i <= cols; i++) g.appendChild(el("line", { x1: X(i), y1: Y(0), x2: X(i), y2: Y(rows), stroke: map ? "#94a3b8" : GRID, "stroke-width": map ? 1.4 : 1 }));
    for (let j = 0; j <= rows; j++) g.appendChild(el("line", { x1: X(0), y1: Y(j), x2: X(cols), y2: Y(j), stroke: map ? "#94a3b8" : GRID, "stroke-width": map ? 1.4 : 1 }));
    g.appendChild(el("rect", { x: ox, y: oy, width: cols * s, height: rows * s, fill: "none", stroke: INK, "stroke-width": 2 }));

    if (map) {
      for (let i = 0; i < cols; i++) text(g, String.fromCharCode(65 + i), X(i + 0.5), oy - 14, { weight: 700 });
      for (let j = 0; j < rows; j++) text(g, j + 1, ox - 14, Y(j + 0.5), { weight: 700 });
      (c.icons || []).forEach(ic => {
        icon(g, ic.kind, X(ic.col + 0.5), Y(ic.row + 0.5) - (ic.label ? 4 : 0), s * 0.62);
        if (ic.label) text(g, ic.label, X(ic.col + 0.5), Y(ic.row + 0.92), { size: 11, weight: 700 });
      });
    }

    (c.shapes || []).forEach(sh => {
      const pts = (sh.pts || []).map(p => `${r1(X(p[0]))},${r1(Y(p[1]))}`).join(" ");
      const style = sh.style || "solid";
      g.appendChild(el("polygon", {
        points: pts,
        fill: style === "image" ? IMAGE : style === "ghost" ? "none" : FILL,
        stroke: INK,
        "stroke-width": 2.4,
        "stroke-dasharray": style === "ghost" ? "6 5" : null,
        "stroke-linejoin": "round"
      }));
      if (sh.label) {
        const cx = sh.labelAt ? sh.labelAt[0] : sh.pts.reduce((a, p) => a + p[0], 0) / sh.pts.length;
        const cy = sh.labelAt ? sh.labelAt[1] : sh.pts.reduce((a, p) => a + p[1], 0) / sh.pts.length;
        text(g, sh.label, X(cx), Y(cy), { size: 18, weight: 700 });
      }
    });

    if (c.countable) {
      const over = el("g", { opacity: 0.55 });
      for (let i = 1; i < cols; i++) over.appendChild(el("line", { x1: X(i), y1: Y(0), x2: X(i), y2: Y(rows), stroke: "#64748b", "stroke-width": 1 }));
      for (let j = 1; j < rows; j++) over.appendChild(el("line", { x1: X(0), y1: Y(j), x2: X(cols), y2: Y(j), stroke: "#64748b", "stroke-width": 1 }));
      g.appendChild(over);
      (c.shapes || []).forEach(sh => g.appendChild(el("polygon", { points: (sh.pts || []).map(p => `${r1(X(p[0]))},${r1(Y(p[1]))}`).join(" "), fill: "none", stroke: INK, "stroke-width": 2.4, "stroke-linejoin": "round" })));
    }

    if (c.mirror) {
      const m = c.mirror;
      g.appendChild(el("line", { x1: X(m.x1), y1: Y(m.y1), x2: X(m.x2), y2: Y(m.y2), stroke: RED, "stroke-width": 3, "stroke-dasharray": "10 6" }));
    }
    (c.dots || []).forEach(d => {
      g.appendChild(el("circle", { cx: X(d.x), cy: Y(d.y), r: 5, fill: RED }));
      if (d.label) text(g, d.label, X(d.x) + 12, Y(d.y) - 12, { weight: 700, fill: RED });
    });

    if (c.path && c.path.length > 1) {
      const pp = c.path.map(p => `${r1(X(p[0]))},${r1(Y(p[1]))}`).join(" ");
      g.appendChild(el("polyline", { points: pp, fill: "none", stroke: RED, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      const [a, b] = c.path.slice(-2); const ang = Math.atan2(Y(b[1]) - Y(a[1]), X(b[0]) - X(a[0]));
      const tx = X(b[0]); const ty = Y(b[1]); const L = 14;
      g.appendChild(el("polygon", { points: `${r1(tx)},${r1(ty)} ${r1(tx - L * Math.cos(ang - 0.45))},${r1(ty - L * Math.sin(ang - 0.45))} ${r1(tx - L * Math.cos(ang + 0.45))},${r1(ty - L * Math.sin(ang + 0.45))}`, fill: RED }));
    }
    let extra = 0;
    if (c.north) {
      const nx = ox + cols * s + 36; const ny = oy + 20;
      g.appendChild(el("polygon", { points: `${nx},${ny} ${nx - 11},${ny + 40} ${nx},${ny + 30} ${nx + 11},${ny + 40}`, fill: INK }));
      text(g, "N", nx, ny - 12, { size: 20, weight: 700 });
      extra = 56;
    }
    const W = ox + cols * s + 10 + extra;
    const H = oy + rows * s + 10;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": map ? "grid map" : "square grid" });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }

  return { render };
})();
