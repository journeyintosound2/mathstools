// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/statistics/statistics-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Statistics Display Engine
  ----------------------------------------------
  engines/statistics/statistics-engine.js

  Exposes: window.MMT_STATISTICS_ENGINE.render(target, config)

  Built for Stage 4 "Data classification and visualisation" (MA4-DAT-C-01) and
  "Data analysis" (MA4-DAT-C-02). The syllabus names the displays students
  must read, construct and choose between, and this engine draws each of them
  from the SAME data the bank uses for the answer — the frequencies are never
  approximated for drawing, so a harness can recount the picture.

  chartType
  ---------
    column        vertical bars for categories (or discrete values)
    bar           horizontal bars
    histogram     adjacent bars over class intervals; `polygon: true` overlays
                  the frequency polygon, `polygonOnly: true` draws only it
    dot-plot      one dot per value above a number line
    stem-leaf     ordered stem-and-leaf plot, single or back-to-back
    line          a quantity over time
    sector        a pie chart with each sector labelled
    divided-bar   one bar divided into parts of a whole
    pictogram     rows of symbols with a key (half symbols allowed)
    grouped-column  side-by-side columns for two (or three) series per
                  category: `series: [{ name, values }]`, with a key
    box-plot      one or more horizontal box plots on a shared scale:
                  `plots: [{ label, min, q1, median, q3, max, outliers }]`,
                  `axisMin`, `axisMax`, `step`; `blank: true` draws the scale
                  only (for "draw the box plot")
    scatter       `points: [[x, y], …]` on a scaled plane (xMin, xMax, xStep,
                  yMin, yMax, yStep), optional `fit: { from: [x, y], to: [x, y] }`
                  drawn as a line of best fit

  `blank: true` draws the frame, scale and labels with no data, for "construct
  the graph" questions. `yMin` above zero draws a truncated axis — used ONLY by
  the "misleading graphs" questions, which is the point of them.
*/

window.MMT_STATISTICS_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TEXT = 16;
  const INK = "#111827";
  const GRID = "#d7dde6";
  const BAR = "#bcd3ee";
  const BAR_EDGE = "#1f4e89";
  const ACCENT = "#1d4ed8";
  const PALETTE = ["#bcd3ee", "#f6c9a8", "#c7e5c0", "#f1e0a0", "#d8c8ec", "#f3b9c4", "#bfe3e3"];
  const FONT = "'Cambria Math','Times New Roman',serif";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) node.setAttribute(k, String(v));
    });
    return node;
  }

  const r1 = v => Math.round(v * 10) / 10;

  function text(g, value, x, y, o = {}) {
    const n = el("text", {
      x: r1(x), y: r1(y),
      "font-family": FONT,
      "font-size": o.size || TEXT,
      "text-anchor": o.anchor || "middle",
      "dominant-baseline": o.baseline || "middle",
      "font-weight": o.weight || 400,
      fill: o.fill || INK,
      transform: o.rotate ? `rotate(${o.rotate} ${r1(x)} ${r1(y)})` : null
    });
    n.textContent = String(value);
    g.appendChild(n);
    return n;
  }

  function line(g, x1, y1, x2, y2, o = {}) {
    g.appendChild(el("line", {
      x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2),
      stroke: o.stroke || INK, "stroke-width": o.width || 1.8,
      "stroke-dasharray": o.dash || null, "stroke-linecap": "round"
    }));
  }

  function rect(g, x, y, w, h, o = {}) {
    g.appendChild(el("rect", {
      x: r1(x), y: r1(y), width: r1(Math.max(0, w)), height: r1(Math.max(0, h)),
      fill: o.fill || BAR, stroke: o.stroke || BAR_EDGE, "stroke-width": o.width || 1.8
    }));
  }

  function niceStep(max, target = 6) {
    const raw = Math.max(1, max) / target;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function fmtTick(v) {
    const s = String(Math.round(v * 1000) / 1000);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function finish(target, g, w, h, label) {
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, width: "100%", role: "img", "aria-label": label || "statistical graph" });
    svg.appendChild(g);
    if (target) {
      target.innerHTML = "";
      target.appendChild(svg);
    }
    return svg;
  }

  /*
    Axes with a numeric vertical scale. Returns the plot frame and a function
    mapping a value to a y coordinate.
  */
  function valueAxis(g, c, frame) {
    const values = c.values || [];
    const yMin = Number.isFinite(c.yMin) ? c.yMin : 0;
    const dataMax = Math.max(...values.filter(Number.isFinite), 1);
    const step = c.yStep || niceStep(dataMax - yMin);
    const yMax = c.yMax || Math.ceil(dataMax / step) * step + (Math.ceil(dataMax / step) * step === dataMax ? 0 : 0);
    const top = Math.max(yMax, yMin + step);
    const Y = v => frame.y + frame.h - ((v - yMin) / (top - yMin)) * frame.h;
    for (let v = yMin; v <= top + 1e-9; v += step) {
      const y = Y(v);
      if (c.grid !== false) line(g, frame.x, y, frame.x + frame.w, y, { stroke: GRID, width: 1 });
      line(g, frame.x - 6, y, frame.x, y);
      text(g, fmtTick(v), frame.x - 10, y, { anchor: "end", size: TEXT - 2 });
    }
    line(g, frame.x, frame.y - 8, frame.x, frame.y + frame.h, { width: 2.2 });
    line(g, frame.x, frame.y + frame.h, frame.x + frame.w + 8, frame.y + frame.h, { width: 2.2 });
    if (c.yLabel) text(g, c.yLabel, frame.x - 52, frame.y + frame.h / 2, { rotate: -90, weight: 700, size: TEXT - 1 });
    return Y;
  }

  function titleAndX(g, c, frame, W) {
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    if (c.xLabel) text(g, c.xLabel, frame.x + frame.w / 2, frame.y + frame.h + (c.rotateCategories ? 74 : 46), { weight: 700, size: TEXT - 1 });
  }

  function columnChart(target, c) {
    const cats = c.categories || [];
    const n = Math.max(1, cats.length);
    const slot = Math.max(46, Math.min(78, 420 / n));
    const frame = { x: 78, y: c.title ? 40 : 18, w: slot * n, h: 210 };
    const W = frame.x + frame.w + 30;
    const H = frame.y + frame.h + (c.xLabel ? 62 : 36) + (c.rotateCategories ? 28 : 0);
    const g = el("g");
    const Y = valueAxis(g, c, frame);
    cats.forEach((cat, i) => {
      const x = frame.x + i * slot;
      if (!c.blank && Number.isFinite(c.values?.[i])) {
        rect(g, x + slot * 0.18, Y(Math.max(c.values[i], c.yMin || 0)), slot * 0.64, frame.y + frame.h - Y(Math.max(c.values[i], c.yMin || 0)));
      }
      if (c.rotateCategories) text(g, cat, x + slot / 2, frame.y + frame.h + 12, { anchor: "end", rotate: -35, size: TEXT - 2 });
      else text(g, cat, x + slot / 2, frame.y + frame.h + 16, { size: TEXT - 2 });
    });
    titleAndX(g, c, frame, W);
    return finish(target, g, W, H, "column graph");
  }

  /* Side-by-side columns: one group per category, one column per series. */
  function groupedColumnChart(target, c) {
    const cats = c.categories || [];
    const series = c.series || [];
    const k = Math.max(1, series.length);
    const n = Math.max(1, cats.length);
    const slot = Math.max(70, Math.min(110, 480 / n));
    const frame = { x: 78, y: c.title ? 40 : 18, w: slot * n, h: 210 };
    const keyW = 150;
    const W = frame.x + frame.w + 30 + keyW;
    const H = frame.y + frame.h + (c.xLabel ? 62 : 36);
    const g = el("g");
    const all = series.flatMap(s => s.values || []);
    const Y = valueAxis(g, { ...c, values: all }, frame);
    const colW = (slot * 0.76) / k;
    cats.forEach((cat, i) => {
      const x0 = frame.x + i * slot + slot * 0.12;
      series.forEach((s, j) => {
        const v = s.values?.[i];
        if (!c.blank && Number.isFinite(v)) rect(g, x0 + j * colW, Y(v), colW, frame.y + frame.h - Y(v), { fill: PALETTE[j % PALETTE.length] });
      });
      text(g, cat, frame.x + i * slot + slot / 2, frame.y + frame.h + 16, { size: TEXT - 2 });
    });
    // key
    const kx = frame.x + frame.w + 40;
    series.forEach((s, j) => {
      const ky = frame.y + 20 + j * 30;
      rect(g, kx, ky - 9, 18, 18, { fill: PALETTE[j % PALETTE.length] });
      text(g, s.name, kx + 26, ky, { anchor: "start", size: TEXT - 1 });
    });
    titleAndX(g, c, frame, W - keyW);
    return finish(target, g, W, H, "side-by-side column graph");
  }

  /* Horizontal box plots on one shared scale (parallel box plots). */
  function boxPlot(target, c) {
    const plots = c.plots || [];
    const lo = c.axisMin ?? 0;
    const hi = c.axisMax ?? 100;
    const step = c.step || niceStep(hi - lo, 10);
    const labelW = plots.some(p => p.label) ? Math.max(60, ...plots.map(p => String(p.label || "").length * 8.5)) + 14 : 20;
    const x0 = labelW + 10;
    const W = 460;
    const X = v => x0 + ((v - lo) / (hi - lo)) * W;
    const rowH = 64;
    const top = c.title ? 44 : 14;
    const g = el("g");
    plots.forEach((p, i) => {
      const yc = top + i * rowH + rowH / 2;
      if (p.label) text(g, p.label, labelW, yc, { anchor: "end", weight: 700, size: TEXT - 1 });
      if (c.blank) {
        // faint guides up from each tick so there is room (and a scale) to draw on
        for (let v = lo; v <= hi + 1e-9; v += step) line(g, X(v), yc - rowH / 2 + 4, X(v), yc + rowH / 2, { stroke: GRID, width: 1 });
        return;
      }
      const bh = 30;
      // whiskers to the most extreme non-outlier values
      line(g, X(p.min), yc, X(p.q1), yc, { width: 2 });
      line(g, X(p.q3), yc, X(p.max), yc, { width: 2 });
      line(g, X(p.min), yc - 10, X(p.min), yc + 10, { width: 2 });
      line(g, X(p.max), yc - 10, X(p.max), yc + 10, { width: 2 });
      rect(g, X(p.q1), yc - bh / 2, X(p.q3) - X(p.q1), bh, { fill: PALETTE[i % PALETTE.length], stroke: INK, width: 2 });
      line(g, X(p.median), yc - bh / 2, X(p.median), yc + bh / 2, { width: 3 });
      (p.outliers || []).forEach(o => {
        g.appendChild(el("circle", { cx: r1(X(o)), cy: yc, r: 4.5, fill: "#fff", stroke: INK, "stroke-width": 1.8 }));
      });
    });
    const axisY = top + plots.length * rowH + 6;
    line(g, X(lo), axisY, X(hi), axisY, { width: 2 });
    for (let v = lo; v <= hi + 1e-9; v += step) {
      line(g, X(v), axisY, X(v), axisY + 6);
      text(g, fmtTick(v), X(v), axisY + 18, { size: TEXT - 2 });
    }
    let H = axisY + 30;
    if (c.xLabel) { text(g, c.xLabel, X((lo + hi) / 2), axisY + 42, { weight: 700, size: TEXT - 1 }); H += 20; }
    if (c.title) text(g, c.title, X((lo + hi) / 2), 20, { weight: 700 });
    return finish(target, g, x0 + W + 30, H, "box plot");
  }

  /* Scatter plot on a scaled plane, optional line of best fit. */
  function scatter(target, c) {
    const pts = c.points || [];
    const xMin = c.xMin ?? 0; const xMax = c.xMax ?? 10; const yMin = c.yMin ?? 0; const yMax = c.yMax ?? 10;
    const xStep = c.xStep || niceStep(xMax - xMin, 8);
    const yStep = c.yStep || niceStep(yMax - yMin, 7);
    const frame = { x: 78, y: c.title ? 40 : 18, w: 420, h: 260 };
    const X = v => frame.x + ((v - xMin) / (xMax - xMin)) * frame.w;
    const Y = v => frame.y + frame.h - ((v - yMin) / (yMax - yMin)) * frame.h;
    const g = el("g");
    for (let v = xMin; v <= xMax + 1e-9; v += xStep) {
      line(g, X(v), frame.y, X(v), frame.y + frame.h, { stroke: GRID, width: 1 });
      line(g, X(v), frame.y + frame.h, X(v), frame.y + frame.h + 6);
      text(g, fmtTick(v), X(v), frame.y + frame.h + 18, { size: TEXT - 2 });
    }
    for (let v = yMin; v <= yMax + 1e-9; v += yStep) {
      line(g, frame.x, Y(v), frame.x + frame.w, Y(v), { stroke: GRID, width: 1 });
      line(g, frame.x - 6, Y(v), frame.x, Y(v));
      text(g, fmtTick(v), frame.x - 10, Y(v), { anchor: "end", size: TEXT - 2 });
    }
    line(g, frame.x, frame.y - 6, frame.x, frame.y + frame.h, { width: 2.2 });
    line(g, frame.x, frame.y + frame.h, frame.x + frame.w + 6, frame.y + frame.h, { width: 2.2 });
    if (c.fit) {
      const [a, b] = [c.fit.from, c.fit.to];
      line(g, X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), { stroke: "#b91c1c", width: 2.4 });
    }
    if (!c.blank) pts.forEach(([x, y]) => {
      g.appendChild(el("circle", { cx: r1(X(x)), cy: r1(Y(y)), r: 4.2, fill: ACCENT, stroke: "#fff", "stroke-width": 1 }));
    });
    if (c.title) text(g, c.title, frame.x + frame.w / 2, 20, { weight: 700 });
    if (c.xLabel) text(g, c.xLabel, frame.x + frame.w / 2, frame.y + frame.h + 42, { weight: 700, size: TEXT - 1 });
    if (c.yLabel) text(g, c.yLabel, frame.x - 54, frame.y + frame.h / 2, { rotate: -90, weight: 700, size: TEXT - 1 });
    return finish(target, g, frame.x + frame.w + 30, frame.y + frame.h + (c.xLabel ? 58 : 34), "scatter plot");
  }

  function barChart(target, c) {
    const cats = c.categories || [];
    const n = Math.max(1, cats.length);
    const slot = 38;
    const labelW = Math.max(70, ...cats.map(s => String(s).length * 8.5)) + 16;
    const frame = { x: labelW, y: c.title ? 40 : 16, w: 360, h: slot * n };
    const dataMax = Math.max(...(c.values || [1]));
    const step = c.xStep || niceStep(dataMax);
    const top = c.xMax || Math.ceil(dataMax / step) * step;
    const X = v => frame.x + (v / top) * frame.w;
    const g = el("g");
    for (let v = 0; v <= top + 1e-9; v += step) {
      line(g, X(v), frame.y, X(v), frame.y + frame.h, { stroke: GRID, width: 1 });
      text(g, fmtTick(v), X(v), frame.y + frame.h + 16, { size: TEXT - 2 });
    }
    line(g, frame.x, frame.y, frame.x, frame.y + frame.h, { width: 2.2 });
    line(g, frame.x, frame.y + frame.h, frame.x + frame.w + 8, frame.y + frame.h, { width: 2.2 });
    cats.forEach((cat, i) => {
      const y = frame.y + i * slot;
      if (!c.blank) rect(g, frame.x, y + slot * 0.2, X(c.values[i]) - frame.x, slot * 0.6);
      text(g, cat, frame.x - 10, y + slot / 2, { anchor: "end", size: TEXT - 2 });
    });
    const W = frame.x + frame.w + 30;
    const H = frame.y + frame.h + (c.xLabel ? 58 : 34);
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    if (c.xLabel) text(g, c.xLabel, frame.x + frame.w / 2, frame.y + frame.h + 42, { weight: 700, size: TEXT - 1 });
    return finish(target, g, W, H, "bar graph");
  }

  /* bins: [{ lo, hi, count }] with equal widths */
  function histogram(target, c) {
    const bins = c.bins || [];
    const n = Math.max(1, bins.length);
    const bw = Math.max(44, Math.min(70, 400 / (n + 1)));
    const frame = { x: 78, y: c.title ? 40 : 18, w: bw * (n + 1), h: 210 };
    const g = el("g");
    const Y = valueAxis(g, { ...c, values: bins.map(b => b.count) }, frame);
    const x0 = frame.x + bw / 2;
    bins.forEach((b, i) => {
      const x = x0 + i * bw;
      if (!c.blank && !c.polygonOnly) rect(g, x, Y(b.count), bw, frame.y + frame.h - Y(b.count));
      const lab = c.labelMode === "midpoint" ? String(b.mid ?? (b.lo + b.hi) / 2) : null;
      if (lab !== null) text(g, lab, x + bw / 2, frame.y + frame.h + 16, { size: TEXT - 2 });
      else {
        line(g, x, frame.y + frame.h, x, frame.y + frame.h + 5);
        text(g, fmtTick(b.lo), x, frame.y + frame.h + 16, { size: TEXT - 2 });
        if (i === n - 1) {
          line(g, x + bw, frame.y + frame.h, x + bw, frame.y + frame.h + 5);
          text(g, fmtTick(b.hi), x + bw, frame.y + frame.h + 16, { size: TEXT - 2 });
        }
      }
    });
    if (!c.blank && (c.polygon || c.polygonOnly)) {
      const pts = [[x0 - bw / 2, Y(0)], ...bins.map((b, i) => [x0 + i * bw + bw / 2, Y(b.count)]), [x0 + n * bw + bw / 2, Y(0)]];
      g.appendChild(el("polyline", { points: pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(" "), fill: "none", stroke: "#b91c1c", "stroke-width": 2.4 }));
      pts.forEach(p => g.appendChild(el("circle", { cx: r1(p[0]), cy: r1(p[1]), r: 3.6, fill: "#b91c1c" })));
    }
    const W = frame.x + frame.w + 30;
    const H = frame.y + frame.h + (c.xLabel ? 62 : 36);
    titleAndX(g, c, frame, W);
    return finish(target, g, W, H, "histogram");
  }

  function dotPlot(target, c) {
    const vals = c.data || [];
    const lo = Number.isFinite(c.min) ? c.min : Math.min(...vals);
    const hi = Number.isFinite(c.max) ? c.max : Math.max(...vals);
    const step = c.step || 1;
    const count = Math.round((hi - lo) / step) + 1;
    const gap = Math.max(28, Math.min(46, 460 / count));
    const counts = {};
    vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const tallest = Math.max(1, ...Object.values(counts));
    const dot = Math.min(gap * 0.36, 9);
    const baseY = (c.title ? 40 : 16) + tallest * dot * 2.3 + 10;
    const x0 = 36;
    const g = el("g");
    line(g, x0 - 14, baseY, x0 + (count - 1) * gap + 14, baseY, { width: 2.2 });
    for (let i = 0; i < count; i++) {
      const v = Math.round((lo + i * step) * 1000) / 1000;
      const x = x0 + i * gap;
      line(g, x, baseY, x, baseY + 7);
      text(g, fmtTick(v), x, baseY + 20, { size: TEXT - 2 });
      if (!c.blank) {
        for (let k = 0; k < (counts[v] || 0); k++) {
          g.appendChild(el("circle", { cx: r1(x), cy: r1(baseY - dot * 1.25 - k * dot * 2.2), r: r1(dot), fill: c.hollow ? "#fff" : BAR_EDGE, stroke: BAR_EDGE, "stroke-width": 1.6 }));
        }
      }
    }
    const W = x0 + (count - 1) * gap + 40;
    const H = baseY + (c.xLabel ? 50 : 32);
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    if (c.xLabel) text(g, c.xLabel, W / 2, baseY + 42, { weight: 700, size: TEXT - 1 });
    return finish(target, g, W, H, "dot plot");
  }

  /* rows: [{ stem, leaves: [..], left: [..] }] ; backToBack uses left leaves */
  function stemLeaf(target, c) {
    const rows = c.rows || [];
    const b2b = Boolean(c.backToBack);
    const lh = 26;
    const leafW = 17;
    const maxRight = Math.max(1, ...rows.map(r => (r.leaves || []).length));
    const maxLeft = b2b ? Math.max(1, ...rows.map(r => (r.left || []).length)) : 0;
    const stemX = 20 + (b2b ? maxLeft * leafW + 24 : 0) + 22;
    const top = (c.title ? 44 : 14) + (c.headings ? 26 : 0);
    const g = el("g");
    const x1 = stemX + 22;
    const x0 = stemX - 22;
    if (c.headings) {
      if (b2b) text(g, c.headings[0], x0 - 10, top - 16, { anchor: "end", weight: 700, size: TEXT - 2 });
      text(g, b2b ? c.headings[1] : "Stem | Leaf", b2b ? x1 + 10 : stemX, top - 16, { anchor: b2b ? "start" : "middle", weight: 700, size: TEXT - 2 });
    }
    rows.forEach((r, i) => {
      const y = top + i * lh + lh / 2;
      text(g, r.stem, stemX, y, { weight: 700 });
      if (!c.blank) {
        (r.leaves || []).forEach((lf, k) => text(g, lf, x1 + 12 + k * leafW, y));
        if (b2b) (r.left || []).forEach((lf, k) => text(g, lf, x0 - 12 - k * leafW, y));
      }
    });
    line(g, x1, top, x1, top + rows.length * lh, { width: 2.2 });
    if (b2b) line(g, x0, top, x0, top + rows.length * lh, { width: 2.2 });
    // The key can be longer than the plot is wide (a back-to-back key reads
    // both ways), so the frame grows to hold it rather than clipping it.
    const keyText = c.key ? `Key: ${c.key}` : "";
    const W = Math.max(x1 + 20 + maxRight * leafW + 20, 24 + keyText.length * 7.4);
    let H = top + rows.length * lh + 12;
    if (keyText) { text(g, keyText, 12, H + 10, { size: TEXT - 2, fill: "#374151", anchor: "start" }); H += 26; }
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    return finish(target, g, Math.max(W, 200), H, "stem-and-leaf plot");
  }

  function lineGraph(target, c) {
    const cats = c.categories || [];
    const n = Math.max(2, cats.length);
    const slot = Math.max(46, Math.min(70, 420 / n));
    const frame = { x: 78, y: c.title ? 40 : 18, w: slot * (n - 1) + 40, h: 210 };
    const g = el("g");
    const Y = valueAxis(g, c, frame);
    const X = i => frame.x + 20 + i * slot;
    cats.forEach((cat, i) => {
      line(g, X(i), frame.y + frame.h, X(i), frame.y + frame.h + 5);
      text(g, cat, X(i), frame.y + frame.h + 16, { size: TEXT - 2 });
    });
    if (!c.blank) {
      const pts = (c.values || []).map((v, i) => [X(i), Y(v)]);
      g.appendChild(el("polyline", { points: pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(" "), fill: "none", stroke: ACCENT, "stroke-width": 2.6 }));
      pts.forEach(p => g.appendChild(el("circle", { cx: r1(p[0]), cy: r1(p[1]), r: 4, fill: ACCENT })));
    }
    const W = frame.x + frame.w + 30;
    const H = frame.y + frame.h + (c.xLabel ? 62 : 36);
    titleAndX(g, c, frame, W);
    return finish(target, g, W, H, "line graph");
  }

  function sector(target, c) {
    const vals = c.values || [];
    const cats = c.categories || [];
    const total = vals.reduce((s, v) => s + v, 0) || 1;
    const R = 110;
    const cx = 150;
    const cy = (c.title ? 44 : 20) + R;
    const g = el("g");
    let a = -Math.PI / 2;
    vals.forEach((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      const a2 = a + sweep;
      const p1 = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
      const p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
      const large = sweep > Math.PI ? 1 : 0;
      g.appendChild(el("path", {
        d: vals.length === 1
          ? `M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} Z`
          : `M ${cx} ${cy} L ${r1(p1[0])} ${r1(p1[1])} A ${R} ${R} 0 ${large} 1 ${r1(p2[0])} ${r1(p2[1])} Z`,
        fill: c.blank ? "#fff" : PALETTE[i % PALETTE.length], stroke: INK, "stroke-width": 1.8
      }));
      const mid = a + sweep / 2;
      if (c.sectorLabels !== false && !c.blank) {
        const lr = sweep < 0.5 ? R + 18 : R * 0.62;
        const lab = c.labelStyle === "angle" ? `${Math.round(v / total * 360)}°` : c.labelStyle === "percent" ? `${Math.round(v / total * 1000) / 10}%` : c.labelStyle === "none" ? "" : "";
        if (lab) text(g, lab, cx + lr * Math.cos(mid), cy + lr * Math.sin(mid), { size: TEXT - 2, weight: 700 });
      }
      a = a2;
    });
    // legend
    const lx = cx + R + 30;
    cats.forEach((cat, i) => {
      const y = cy - (cats.length * 26) / 2 + i * 26 + 13;
      if (!c.blank) rect(g, lx, y - 8, 16, 16, { fill: PALETTE[i % PALETTE.length], stroke: INK, width: 1.4 });
      text(g, cat, lx + 24, y, { anchor: "start", size: TEXT - 2 });
    });
    const W = lx + 24 + Math.max(60, ...cats.map(s => String(s).length * 8.5)) + 16;
    const H = cy + R + 20;
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    return finish(target, g, W, H, "sector graph");
  }

  function dividedBar(target, c) {
    const vals = c.values || [];
    const cats = c.categories || [];
    const total = vals.reduce((s, v) => s + v, 0) || 1;
    const x0 = 20;
    const w = c.width || 440;
    const y0 = c.title ? 44 : 20;
    const h = 46;
    const g = el("g");
    let x = x0;
    vals.forEach((v, i) => {
      const bw = (v / total) * w;
      rect(g, x, y0, bw, h, { fill: PALETTE[i % PALETTE.length], stroke: INK, width: 1.8 });
      if (c.showPercent !== false && bw > 34) text(g, c.labelStyle === "value" ? String(v) : `${Math.round(v / total * 100)}%`, x + bw / 2, y0 + h / 2, { size: TEXT - 2, weight: 700 });
      x += bw;
    });
    if (c.scale) {
      for (let p = 0; p <= 100; p += 10) {
        const sx = x0 + (p / 100) * w;
        line(g, sx, y0 + h, sx, y0 + h + 6);
        if (p % 20 === 0) text(g, `${p}%`, sx, y0 + h + 18, { size: TEXT - 4 });
      }
    }
    const ly = y0 + h + (c.scale ? 40 : 22);
    let lx = x0;
    let row = 0;
    cats.forEach((cat, i) => {
      const itemW = 30 + String(cat).length * 8.5 + 14;
      if (lx + itemW > x0 + w) { lx = x0; row++; }
      rect(g, lx, ly + row * 24 - 8, 16, 16, { fill: PALETTE[i % PALETTE.length], stroke: INK, width: 1.4 });
      text(g, cat, lx + 22, ly + row * 24, { anchor: "start", size: TEXT - 2 });
      lx += itemW;
    });
    const W = x0 + w + 20;
    const H = ly + row * 24 + 20;
    if (c.title) text(g, c.title, W / 2, 20, { weight: 700 });
    return finish(target, g, W, H, "divided bar graph");
  }

  /* One symbol: a filled circle; half symbols are half discs. */
  function pictogram(target, c) {
    const cats = c.categories || [];
    const vals = c.values || [];
    const per = c.perSymbol || 2;
    const labelW = Math.max(80, ...cats.map(s => String(s).length * 8.5)) + 18;
    const size = 26;
    const rowH = 36;
    const y0 = c.title ? 44 : 16;
    const g = el("g");
    let maxSyms = 1;
    cats.forEach((cat, i) => {
      const y = y0 + i * rowH + rowH / 2;
      text(g, cat, labelW - 12, y, { anchor: "end", size: TEXT - 2 });
      const whole = Math.floor(vals[i] / per);
      const half = vals[i] % per !== 0;
      maxSyms = Math.max(maxSyms, whole + (half ? 1 : 0));
      for (let k = 0; k < whole; k++) g.appendChild(el("circle", { cx: labelW + k * (size + 6) + size / 2, cy: y, r: size / 2 - 1, fill: "#f2b35b", stroke: INK, "stroke-width": 1.4 }));
      if (half) {
        const cx = labelW + whole * (size + 6) + size / 2;
        const r = size / 2 - 1;
        g.appendChild(el("path", { d: `M ${cx} ${y - r} A ${r} ${r} 0 0 0 ${cx} ${y + r} Z`, fill: "#f2b35b", stroke: INK, "stroke-width": 1.4 }));
      }
    });
    line(g, labelW - 4, y0, labelW - 4, y0 + cats.length * rowH, { width: 1.6 });
    const keyY = y0 + cats.length * rowH + 20;
    g.appendChild(el("circle", { cx: labelW + size / 2, cy: keyY, r: size / 2 - 1, fill: "#f2b35b", stroke: INK, "stroke-width": 1.4 }));
    text(g, `= ${per} ${c.unit || ""}`.trim(), labelW + size + 10, keyY, { anchor: "start", size: TEXT - 1, weight: 700 });
    const W = labelW + maxSyms * (size + 6) + 40;
    const H = keyY + 26;
    if (c.title) text(g, c.title, Math.max(W, 240) / 2, 20, { weight: 700 });
    return finish(target, g, Math.max(W, 240), H, "pictogram");
  }

  function render(target, config = {}) {
    const t = config.chartType || "column";
    if (t === "column") return columnChart(target, config);
    if (t === "bar") return barChart(target, config);
    if (t === "grouped-column") return groupedColumnChart(target, config);
    if (t === "box-plot") return boxPlot(target, config);
    if (t === "scatter") return scatter(target, config);
    if (t === "histogram") return histogram(target, config);
    if (t === "dot-plot") return dotPlot(target, config);
    if (t === "stem-leaf") return stemLeaf(target, config);
    if (t === "line") return lineGraph(target, config);
    if (t === "sector") return sector(target, config);
    if (t === "divided-bar") return dividedBar(target, config);
    if (t === "pictogram") return pictogram(target, config);
    if (target) target.innerHTML = `<div class="diagram-placeholder">Unknown chart type</div>`;
    return null;
  }

  return { render };
})();
