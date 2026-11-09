// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/manipulatives/manipulatives-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Manipulatives Engine (Stage 2)
  ---------------------------------------------------
  engines/manipulatives/manipulatives-engine.js

  Exposes: window.MMT_MANIPULATIVES_ENGINE.render(target, config)

  Stage 2 learners build number sense with things they can see and count:
  base-ten blocks, place-value charts, number lines, arrays and equal groups,
  fraction strips, shape cards, a compass rose. A Stage 2 question should
  carry most of its meaning in the picture, so the reading load stays low.
  Every drawing here is built from the SAME numbers the bank uses for its
  answer — the blocks are the number, the shading is the fraction.

  Style: big, uncluttered, soft fills, a plain sans-serif font (easier for
  young readers than a serif), and one convention shared with the other
  engines — a label given as null draws an empty box to write in.

  diagramType
  -----------
    base10        { thousands, hundreds, tens, ones } blocks; `decimal: true`
                  relabels flat = 1, long = 0.1, small cube = 0.01 in a key
    pv-chart      { columns: ["Th","H","T","O"] (or with "." for decimals),
                    digits: [...] (null → empty box), counters: [...] draws
                    dots instead of digits }
    number-line   { min, max, step, labels: "all" | "ends" | [values] |
                    "none", den (label ticks as fractions over den),
                    points: [{ value, label }], hops: [{ from, to, label }] }
    grid10        { size: 10 | 100, shaded } a tenths strip or hundredths square
    groups        { groups, each, item: "dot"|"star" } equal groups in circles;
                  `sizes: [..]` for unequal groups
    array         { rows, cols, split, count } dots in rows; `split` draws a
                  dashed line after that many columns (distributive property);
                  `count` stops after that many dots (a loose collection)
    shapes        { items: [{ shape, label, fill, rotate, marks }] } shape cards
    compass       { labels: { N, E, S, W, NE, SE, SW, NW } (null → box),
                    eight: true } a compass rose
    angles        { items: [{ deg, label, tester }] } angle cards; `tester`
                    overlays a dashed right-angle corner to compare against
    tally         { count } tally marks in groups of five; or a tally chart
                  { rows: [{ label, count, total }], heads } (total null → box)
    fraction-strip  { strips: [{ den, shaded, label }] } a fraction wall;
                  `unequal: true` on a strip splits it unevenly (not equal parts)
    fraction-shape  { shape: "circle"|"rect"|"square", den, shaded,
                  unequal } one shape cut into parts
    balance       { left, right, tilt: "left"|"right"|"level" } a pan balance
    cards         { items: ["4 052", …], size } number or digit cards sized to fit
    ruler         { cm: 10, from, to, mm: true, object: "pencil"|"ribbon"|
                  "crayon"|"key", noNumbers } an object lying along a cm ruler;
                  `from` need not be 0 (the "broken ruler" idea)
    column-sum    { a, b, op: "+"|"−", columns: ["H","T","O"], answer: digits
                  or null (boxes), trades: true } a place-value grid for the
                  written method, with small trade boxes above each column
    base10 legend: true draws one of each block with its name and value

  Stage 1 models:
    objects       { count, item, perRow, crossed, circle, items, labels, rowLabels } picture
                  collections (icons: apple star ball fish car cup flower heart
                  block leaf bird pencil); `crossed` crosses out the last n
    ten-frame     { count, count2, frames } counters in one or two ten-frames
    dice          { values, labels } dot patterns 1–6
    hundred-chart { from, to, cols, blanks, shade } number chart (blank cells)
    unit-length   { rows: [{ object, units, label, unit }], unit: cube|paperclip|
                  hand|rod } (a rod is 2 cubes long; `unit` may be set per row)
    calendar      { month, startDay (0 = Mon), days, highlight, circle, blanks }
*/

window.MMT_MANIPULATIVES_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const TEXT = 20;
  const INK = "#1f2937";
  const FONT = "'Arial','Helvetica Neue',Helvetica,sans-serif";
  const C = {
    unit: "#fde68a", long: "#bbf7d0", flat: "#bfdbfe", cube: "#fbcfe8",
    shade: "#93c5fd", shade2: "#fca5a5", pale: "#eff6ff", box: "#ffffff",
    accent: "#1d4ed8", red: "#b91c1c", grey: "#9ca3af"
  };
  const r1 = v => Math.round(v * 10) / 10;

  function el(n, a = {}) {
    const e = document.createElementNS(NS, n);
    Object.entries(a).forEach(([k, v]) => { if (v !== undefined && v !== null) e.setAttribute(k, String(v)); });
    return e;
  }
  function text(g, v, x, y, o = {}) {
    const t = el("text", { x: r1(x), y: r1(y), "font-family": FONT, "font-size": o.size || TEXT, "text-anchor": o.anchor || "middle", "dominant-baseline": "middle", "font-weight": o.weight || 600, fill: o.fill || INK });
    t.textContent = String(v);
    g.appendChild(t);
    return t;
  }
  function rect(g, x, y, w, h, o = {}) {
    g.appendChild(el("rect", { x: r1(x), y: r1(y), width: r1(w), height: r1(h), rx: o.rx || 0, fill: o.fill || "none", stroke: o.stroke || INK, "stroke-width": o.width || 1.6, "stroke-dasharray": o.dash || null }));
  }
  function line(g, x1, y1, x2, y2, o = {}) {
    g.appendChild(el("line", { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), stroke: o.stroke || INK, "stroke-width": o.width || 2, "stroke-dasharray": o.dash || null, "stroke-linecap": "round" }));
  }
  function box(g, x, y, w = 46, h = 34) { rect(g, x - w / 2, y - h / 2, w, h, { fill: C.box, width: 2, rx: 4 }); }
  function labelOrBox(g, v, x, y, o = {}) {
    if (v === null) { box(g, x, y, o.bw, o.bh); return; }
    if (v === undefined || v === "") return;
    fracText(g, v, x, y, o);
  }
  /* "3/4" draws a stacked fraction; anything else is plain text. */
  function fracText(g, v, x, y, o = {}) {
    const m = String(v).match(/^(\d+)\/(\d+)$/);
    if (!m) return text(g, v, x, y, o);
    const s = (o.size || TEXT) * 0.85;
    text(g, m[1], x, y - s * 0.62, { ...o, size: s });
    line(g, x - s * 0.55, y, x + s * 0.55, y, { width: 1.8, stroke: o.fill || INK });
    text(g, m[2], x, y + s * 0.66, { ...o, size: s });
  }
  function finish(target, g, w, h, label) {
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, width: "100%", role: "img", "aria-label": label });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }

  /* ── base-ten blocks ─────────────────────────────────── */
  function base10(target, c) {
    if (c.legend) return base10Legend(target, c);
    const g = el("g");
    const u = 11; // one small cube
    const th = c.thousands || 0; const hu = c.hundreds || 0; const te = c.tens || 0; const on = c.ones || 0;
    // Big blocks (thousands, hundreds) on the top row, tens and ones below,
    // so a large number stays compact and prints big.
    const twoRows = (th + hu) > 0 && (te + on) > 0 && (th * 1.4 + hu) + (te * 0.15 + on * 0.05) > 3.5;
    const row1Y = 10 + 10 * u + (th ? 10 * u * 0.9 * 0.35 : 0); // baseline of the top row
    let x = 10; let W = 0;
    const drawThousand = (x0, base) => {
      const sz = 10 * u * 0.9; const d = sz * 0.35; const y0 = base - sz;
      g.appendChild(el("polygon", { points: `${x0},${y0} ${x0 + sz},${y0} ${x0 + sz + d},${y0 - d} ${x0 + d},${y0 - d}`, fill: "#fde2f0", stroke: INK, "stroke-width": 1.6 }));
      g.appendChild(el("polygon", { points: `${x0 + sz},${y0} ${x0 + sz + d},${y0 - d} ${x0 + sz + d},${y0 - d + sz} ${x0 + sz},${y0 + sz}`, fill: "#f9a8d4", stroke: INK, "stroke-width": 1.6 }));
      rect(g, x0, y0, sz, sz, { fill: C.cube, width: 1.6 });
      for (let k = 1; k < 10; k++) { line(g, x0 + k * sz / 10, y0, x0 + k * sz / 10, y0 + sz, { width: 0.6, stroke: "#9d174d" }); line(g, x0, y0 + k * sz / 10, x0 + sz, y0 + k * sz / 10, { width: 0.6, stroke: "#9d174d" }); }
      return sz + d;
    };
    const drawFlat = (x0, base) => {
      const sz = 10 * u; const y0 = base - sz;
      rect(g, x0, y0, sz, sz, { fill: C.flat, width: 1.6 });
      for (let k = 1; k < 10; k++) { line(g, x0 + k * u, y0, x0 + k * u, y0 + sz, { width: 0.6, stroke: "#1e40af" }); line(g, x0, y0 + k * u, x0 + sz, y0 + k * u, { width: 0.6, stroke: "#1e40af" }); }
      return sz;
    };
    const drawLong = (x0, base) => {
      const sz = 10 * u; const y0 = base - sz;
      rect(g, x0, y0, u, sz, { fill: C.long, width: 1.6 });
      for (let k = 1; k < 10; k++) line(g, x0, y0 + k * u, x0 + u, y0 + k * u, { width: 0.6, stroke: "#166534" });
      return u;
    };
    // Rows: thousands and flats share a row only when there are few of them;
    // otherwise thousands get their own row. Tens and ones sit underneath.
    let base = row1Y;
    const shareRow = th * 1.3 + hu <= 4;
    for (let i = 0; i < th; i++) x += drawThousand(x, base) + 12;
    if (th && hu && !shareRow) { W = Math.max(W, x); x = 10; base += 10 * u + 16; }
    else if (th && hu) x += 8;
    const flatStart = x;
    for (let i = 0; i < hu; i++) {
      if (i > 0 && i % 4 === 0) { W = Math.max(W, x); x = flatStart; base += 10 * u + 12; }
      x += drawFlat(x, base) + 10;
    }
    W = Math.max(W, x);
    let base2 = base;
    if (twoRows) { base2 = base + 10 * u + 22; x = 10; } else if (th + hu) x += 10;
    for (let i = 0; i < te; i++) x += drawLong(x, base2) + 7;
    if (te) x += 12;
    for (let i = 0; i < on; i++) { const col = Math.floor(i / 5); const row = i % 5; rect(g, x + col * (u + 5), base2 - (row + 1) * (u + 4), u, u, { fill: C.unit, width: 1.4 }); }
    if (on) x += Math.ceil(on / 5) * (u + 5);
    W = Math.max(W, x);
    let H = base2 + 10;
    if (c.decimal) { text(g, "Key: flat = 1, long = 0.1,", 10, H + 18, { anchor: "start", size: 18, weight: 600 }); text(g, "small cube = 0.01", 10, H + 42, { anchor: "start", size: 18, weight: 600 }); H += 58; W = Math.max(W, 250); }
    else if (c.key) {
      text(g, th ? "Key: big cube = 1000, flat = 100," : "Key: flat = 100, long = 10, small cube = 1", 10, H + 18, { anchor: "start", size: 18, weight: 600 });
      H += 34;
      if (th) { text(g, "long = 10, small cube = 1", 10, H + 10, { anchor: "start", size: 18, weight: 600 }); H += 28; }
      W = Math.max(W, 320);
    }
    return finish(target, g, Math.max(W + 10, 120), H, "base-ten blocks");
  }

  /* One of each block with its name and value underneath. */
  function base10Legend(target, c) {
    const g = el("g");
    const parts = [
      { k: "thousands", name: "big cube", v: "1 000", cfg: { thousands: 1 } },
      { k: "hundreds", name: "flat", v: "100", cfg: { hundreds: 1 } },
      { k: "tens", name: "long", v: "10", cfg: { tens: 1 } },
      { k: "ones", name: "small cube", v: "1", cfg: { ones: 1 } }
    ].filter(p => !c.only || c.only.includes(p.k));
    let x = 10; const u = 11; const baseY = 150;
    parts.forEach(p => {
      let w;
      if (p.k === "thousands") { const s = 10 * u * 0.9; const d = s * 0.35; const x0 = x; const y0 = baseY - s;
        g.appendChild(el("polygon", { points: `${x0},${y0} ${x0 + s},${y0} ${x0 + s + d},${y0 - d} ${x0 + d},${y0 - d}`, fill: "#fde2f0", stroke: INK, "stroke-width": 1.6 }));
        g.appendChild(el("polygon", { points: `${x0 + s},${y0} ${x0 + s + d},${y0 - d} ${x0 + s + d},${y0 - d + s} ${x0 + s},${y0 + s}`, fill: "#f9a8d4", stroke: INK, "stroke-width": 1.6 }));
        rect(g, x0, y0, s, s, { fill: C.cube, width: 1.6 }); w = s + d; }
      else if (p.k === "hundreds") { const s = 10 * u; rect(g, x, baseY - s, s, s, { fill: C.flat, width: 1.6 }); for (let k = 1; k < 10; k++) { line(g, x + k * u, baseY - s, x + k * u, baseY, { width: 0.6, stroke: "#1e40af" }); line(g, x, baseY - s + k * u, x + s, baseY - s + k * u, { width: 0.6, stroke: "#1e40af" }); } w = s; }
      else if (p.k === "tens") { rect(g, x + 40, baseY - 10 * u, u, 10 * u, { fill: C.long, width: 1.6 }); for (let k = 1; k < 10; k++) line(g, x + 40, baseY - 10 * u + k * u, x + 40 + u, baseY - 10 * u + k * u, { width: 0.6, stroke: "#166534" }); w = u + 80; }
      else { rect(g, x + 40, baseY - u, u, u, { fill: C.unit, width: 1.4 }); w = u + 80; }
      text(g, p.name, x + w / 2, baseY + 22, { size: 18 });
      text(g, `= ${p.v}`, x + w / 2, baseY + 46, { size: 18, weight: 700 });
      x += w + 26;
    });
    return finish(target, g, x, baseY + 60, "base-ten block key");
  }

  /* ── number / digit cards ───────────────────────────── */
  function cards(target, c) {
    const g = el("g");
    const items = c.items || [];
    const size = c.size || 26;
    let x = 10;
    items.forEach(it => {
      const w = Math.max(48, String(it).length * size * 0.62 + 24); const h = size * 2.1;
      rect(g, x, 10, w, h, { fill: c.fill || "#fff", width: 2.2, rx: 8 });
      text(g, it, x + w / 2, 10 + h / 2, { size, weight: 700 });
      x += w + 12;
    });
    return finish(target, g, x, 20 + size * 2.1, "cards");
  }

  /* ── place-value chart ───────────────────────────────── */
  function pvChart(target, c) {
    const g = el("g");
    const cols = c.columns || ["Th", "H", "T", "O"];
    const cw = 70; const x0 = 10; const y0 = 10; const hh = 40; const bh = c.counters ? 90 : 60;
    let x = x0;
    cols.forEach((name, i) => {
      const dot = name === ".";
      const w = dot ? 22 : cw;
      if (!dot) {
        rect(g, x, y0, w, hh, { fill: "#dbeafe", width: 2 });
        text(g, name, x + w / 2, y0 + hh / 2, { size: 19 });
        rect(g, x, y0 + hh, w, bh, { fill: "#fff", width: 2 });
        if (c.counters) {
          const n = c.counters[i] || 0;
          for (let k = 0; k < n; k++) g.appendChild(el("circle", { cx: r1(x + 14 + (k % 3) * 21), cy: r1(y0 + hh + 16 + Math.floor(k / 3) * 21), r: 8, fill: C.shade, stroke: INK, "stroke-width": 1.4 }));
        } else if (c.digits) {
          const d = c.digits[i];
          if (d === null) box(g, x + w / 2, y0 + hh + bh / 2, 40, 38);
          else if (d !== undefined && d !== "") text(g, d, x + w / 2, y0 + hh + bh / 2, { size: 30, weight: 700 });
        }
      } else {
        g.appendChild(el("circle", { cx: x + w / 2, cy: y0 + hh + bh - 12, r: 5, fill: INK }));
      }
      x += w;
    });
    return finish(target, g, x + 10, y0 + hh + bh + 10, "place value chart");
  }



  /* ── ruler with an object lying along it ─────────────── */
  function ruler(target, c) {
    const g = el("g");
    const cm = Math.max(4, Math.min(16, Number(c.cm) || 10));
    const u = 42; const x0 = 24; const top = 70; const H = 58;
    const X = v => x0 + v * u;
    const from = Number(c.from) || 0; const to = Number(c.to ?? cm - 1);
    // object
    const ob = c.object || "pencil"; const oy = 22; const oh = 30;
    if (ob === "pencil" || ob === "crayon") {
      const tip = ob === "pencil" ? 0.9 : 0.6; const body = ob === "pencil" ? "#fcd34d" : "#f87171";
      g.appendChild(el("polygon", { points: `${X(from)},${oy} ${X(to - tip)},${oy} ${X(to)},${oy + oh / 2} ${X(to - tip)},${oy + oh} ${X(from)},${oy + oh}`, fill: body, stroke: INK, "stroke-width": 2 }));
      if (ob === "pencil") { g.appendChild(el("polygon", { points: `${X(to - tip)},${oy} ${X(to)},${oy + oh / 2} ${X(to - tip)},${oy + oh}`, fill: "#f5deb3", stroke: INK, "stroke-width": 2 })); g.appendChild(el("polygon", { points: `${X(to - 0.25)},${oy + oh / 2 - 4} ${X(to)},${oy + oh / 2} ${X(to - 0.25)},${oy + oh / 2 + 4}`, fill: INK })); rect(g, X(from), oy, 0.5 * u, oh, { fill: "#f9a8d4", width: 2 }); }
    } else if (ob === "key") {
      g.appendChild(el("circle", { cx: X(from) + oh / 2 + 1, cy: oy + oh / 2, r: oh / 2, fill: "#fde68a", stroke: INK, "stroke-width": 2 }));
      rect(g, X(from) + oh, oy + oh / 2 - 5, X(to) - X(from) - oh, 10, { fill: "#fde68a", width: 2 });
      rect(g, X(to) - 18, oy + oh / 2 + 5, 7, 9, { fill: "#fde68a", width: 1.6 }); rect(g, X(to) - 34, oy + oh / 2 + 5, 7, 12, { fill: "#fde68a", width: 1.6 });
    } else {
      rect(g, X(from), oy + 4, X(to) - X(from), oh - 8, { fill: "#93c5fd", width: 2, rx: 4 });
    }
    // alignment guides
    line(g, X(from), oy + oh + 2, X(from), top, { dash: "3 3", width: 1.2, stroke: C.grey });
    line(g, X(to), oy + oh + 2, X(to), top, { dash: "3 3", width: 1.2, stroke: C.grey });
    // ruler body
    rect(g, x0 - 14, top, cm * u + 28, H, { fill: "#fef9c3", width: 2, rx: 3 });
    for (let i = 0; i <= cm * 10; i++) {
      const whole = i % 10 === 0; const half = i % 5 === 0;
      if (!whole && !half && !c.mm) continue;
      line(g, X(i / 10), top, X(i / 10), top + (whole ? 22 : half ? 15 : 9), { width: whole ? 2 : 1.1 });
      if (whole && c.noNumbers !== true) text(g, i / 10, X(i / 10), top + 38, { size: 18 });
    }
    text(g, "cm", X(cm) + 2, top + H - 8, { size: 12, anchor: "end" });
    return finish(target, g, cm * u + x0 + 20, top + H + 6, "ruler");
  }

  /* ── written method on a place-value grid ─────────────── */
  function columnSum(target, c) {
    const g = el("g");
    const cols = c.columns || ["H", "T", "O"];
    const n = cols.length; const cw = 64; const x0 = 44; const hh = 36; const rh = 50; const th = c.trades ? 34 : 0;
    const pad = v => String(v).padStart(n, " ").split("");
    const A = pad(c.a); const B = pad(c.b);
    let y = 8;
    cols.forEach((name, i) => { rect(g, x0 + i * cw, y, cw, hh, { fill: "#dbeafe", width: 2 }); text(g, name, x0 + i * cw + cw / 2, y + hh / 2, { size: 19 }); });
    y += hh;
    if (c.trades) { cols.forEach((_, i) => { if ((c.op === "−" || c.op === "-") ? i > 0 : i < n - 1) rect(g, x0 + i * cw + cw / 2 - 13, y + 5, 26, 24, { fill: "#fff", width: 1.4, dash: "4 3", rx: 3 }); }); y += th; }
    const row = (digits, yy) => digits.forEach((d, i) => { if (d.trim()) text(g, d, x0 + i * cw + cw / 2, yy + rh / 2, { size: 30, weight: 700 }); });
    row(A, y); y += rh;
    text(g, c.op || "+", x0 - 22, y + rh / 2, { size: 30, weight: 700 });
    row(B, y); y += rh;
    line(g, x0 - 34, y + 4, x0 + n * cw, y + 4, { width: 3 });
    y += 10;
    const ans = c.answer === undefined || c.answer === null ? null : pad(c.answer);
    cols.forEach((_, i) => { if (ans) { if (ans[i].trim()) text(g, ans[i], x0 + i * cw + cw / 2, y + rh / 2, { size: 30, weight: 700, fill: C.red }); } else box(g, x0 + i * cw + cw / 2, y + rh / 2, 40, 40); });
    y += rh;
    for (let i = 1; i < n; i++) line(g, x0 + i * cw, 8 + hh, x0 + i * cw, y - rh - 10, { width: 1, stroke: "#9ca3af", dash: "3 4" });
    return finish(target, g, x0 + n * cw + 10, y + 8, "column method");
  }

  /* ── scaled number line ──────────────────────────────── */
  function numberLine(target, c) {
    const g = el("g");
    const min = c.min ?? 0; const max = c.max ?? 10; const step = c.step || 1;
    const W = c.width || 480; const x0 = 30; const y = c.hops ? 110 : 60;
    const X = v => x0 + ((v - min) / (max - min)) * W;
    line(g, x0 - 16, y, x0 + W + 16, y, { width: 3 });
    g.appendChild(el("polygon", { points: `${x0 + W + 24},${y} ${x0 + W + 12},${y - 7} ${x0 + W + 12},${y + 7}`, fill: INK }));
    g.appendChild(el("polygon", { points: `${x0 - 24},${y} ${x0 - 12},${y - 7} ${x0 - 12},${y + 7}`, fill: INK }));
    const n = Math.round((max - min) / step);
    const labelSet = c.labels === "all" || c.labels === undefined ? null : c.labels === "ends" ? [min, max] : c.labels === "none" ? [] : c.labels;
    const minorEvery = c.majorEvery || 1;
    for (let i = 0; i <= n; i++) {
      const v = min + i * step; const vv = Math.round(v * 1e6) / 1e6;
      const major = i % minorEvery === 0;
      line(g, X(vv), y - (major ? 12 : 7), X(vv), y + (major ? 12 : 7), { width: major ? 2.4 : 1.4 });
      const show = labelSet === null ? major : labelSet.some(l => Math.abs(l - vv) < 1e-9);
      if (show) {
        if (c.den) {
          const num = Math.round(vv * c.den);
          const lab = num % c.den === 0 ? String(num / c.den) : `${num}/${c.den}`;
          fracText(g, lab, X(vv), y + 40, { size: 22 });
        } else text(g, c.fmt === "dec" ? String(vv) : String(vv).replace(/\B(?=(\d{3})+(?!\d))/g, " "), X(vv), y + 32, { size: 21, weight: 600 });
      }
    }
    (c.hops || []).forEach(h => {
      const a = X(h.from); const b = X(h.to); const mid = (a + b) / 2; const hgt = Math.min(60, Math.abs(b - a) * 0.45 + 18);
      g.appendChild(el("path", { d: `M ${r1(a)} ${y - 4} Q ${r1(mid)} ${r1(y - hgt * 2)} ${r1(b)} ${y - 4}`, fill: "none", stroke: C.accent, "stroke-width": 2.4 }));
      const dir = b > a ? 1 : -1;
      g.appendChild(el("polygon", { points: `${r1(b)},${y - 4} ${r1(b - dir * 10)},${y - 14} ${r1(b - dir * 2)},${y - 16}`, fill: C.accent }));
      labelOrBox(g, h.label, mid, y - hgt - 14, { fill: C.accent, size: 18, bw: 50, bh: 30 });
    });
    (c.points || []).forEach(p => {
      g.appendChild(el("circle", { cx: r1(X(p.value)), cy: y, r: 7, fill: C.red, stroke: "#fff", "stroke-width": 1.5 }));
      if (p.label !== undefined) {
        if (p.label === null) box(g, X(p.value), y - 36, 50, 30);
        else text(g, p.label, X(p.value), y - 30, { fill: C.red, size: 20, weight: 700 });
      }
    });
    return finish(target, g, x0 + W + 40, y + (c.den ? 70 : 52), "number line");
  }

  /* ── tenths strip / hundredths grid ──────────────────── */
  function grid10(target, c) {
    const g = el("g");
    const n = c.shaded || 0;
    if ((c.size || 100) === 10) {
      const w = 44;
      for (let i = 0; i < 10; i++) rect(g, 10 + i * w, 10, w, 70, { fill: i < n ? C.shade : "#fff", width: 2 });
      return finish(target, g, 10 + 10 * w + 10, 90, "tenths strip");
    }
    const s = 26;
    for (let i = 0; i < 100; i++) { const col = Math.floor(i / 10); const row = i % 10; rect(g, 10 + col * s, 10 + row * s, s, s, { fill: i < n ? C.shade : "#fff", width: 1.2 }); }
    rect(g, 10, 10, 10 * s, 10 * s, { width: 2.6 });
    return finish(target, g, 20 + 10 * s, 20 + 10 * s, "hundredths grid");
  }

  /* ── equal groups ────────────────────────────────────── */
  function groups(target, c) {
    const g = el("g");
    const sizes = c.sizes || Array.from({ length: c.groups || 3 }, () => c.each || 4);
    const R = 52; let x = 10 + R;
    sizes.forEach(k => {
      g.appendChild(el("circle", { cx: x, cy: 10 + R, r: R, fill: C.pale, stroke: INK, "stroke-width": 2 }));
      const cols = k <= 4 ? 2 : 3; const rows = Math.ceil(k / cols); const gap = 22;
      for (let i = 0; i < k; i++) {
        const cx = x + ((i % cols) - (cols - 1) / 2) * gap; const cy = 10 + R + (Math.floor(i / cols) - (rows - 1) / 2) * gap;
        if (c.item === "star") g.appendChild(el("polygon", { points: star(cx, cy, 9, 4), fill: "#fbbf24", stroke: INK, "stroke-width": 1 }));
        else g.appendChild(el("circle", { cx: r1(cx), cy: r1(cy), r: 8, fill: C.shade2, stroke: INK, "stroke-width": 1.2 }));
      }
      x += 2 * R + 14;
    });
    return finish(target, g, x - R, 20 + 2 * R, "equal groups");
  }
  function star(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r : R; pts.push(`${r1(cx + rr * Math.cos(a))},${r1(cy + rr * Math.sin(a))}`); }
    return pts.join(" ");
  }

  /* ── dot array ───────────────────────────────────────── */
  function array(target, c) {
    const g = el("g");
    const rows = c.rows || 3; const cols = c.cols || 4; const s = c.gap || 30;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      if (c.count !== undefined && r * cols + q >= c.count) continue;
      const fill = c.split && q >= c.split ? C.shade2 : C.shade;
      g.appendChild(el("circle", { cx: 24 + q * s, cy: 24 + r * s, r: Math.min(10, s * 0.36), fill, stroke: INK, "stroke-width": 1.3 }));
    }
    if (c.split) line(g, 24 + (c.split - 0.5) * s, 6, 24 + (c.split - 0.5) * s, 24 + (rows - 1) * s + 18, { dash: "6 5", stroke: C.red, width: 2.4 });
    let W = 24 + (cols - 1) * s + 24; let H = 24 + (rows - 1) * s + 24;
    if (c.showDims) { text(g, `${cols}`, 24 + (cols - 1) * s / 2, H + 8, { size: 18 }); text(g, `${rows}`, W + 12, 24 + (rows - 1) * s / 2, { size: 18 }); W += 30; H += 24; }
    return finish(target, g, W, H, "array");
  }

  /* ── shape cards ─────────────────────────────────────── */
  const SHAPES = {
    triangle: [[0.5, 0.06], [0.96, 0.9], [0.04, 0.9]],
    "right-triangle": [[0.12, 0.1], [0.12, 0.9], [0.9, 0.9]],
    "scalene-triangle": [[0.3, 0.12], [0.95, 0.9], [0.05, 0.75]],
    "isosceles-triangle": [[0.5, 0.05], [0.8, 0.92], [0.2, 0.92]],
    square: [[0.12, 0.12], [0.88, 0.12], [0.88, 0.88], [0.12, 0.88]],
    rectangle: [[0.03, 0.25], [0.97, 0.25], [0.97, 0.78], [0.03, 0.78]],
    rhombus: [[0.5, 0.04], [0.9, 0.5], [0.5, 0.96], [0.1, 0.5]],
    parallelogram: [[0.25, 0.25], [0.97, 0.25], [0.75, 0.78], [0.03, 0.78]],
    trapezium: [[0.28, 0.22], [0.72, 0.22], [0.97, 0.8], [0.03, 0.8]],
    kite: [[0.5, 0.04], [0.85, 0.36], [0.5, 0.96], [0.15, 0.36]],
    pentagon: poly(5), hexagon: poly(6), heptagon: poly(7), octagon: poly(8),
    "irregular-pentagon": [[0.1, 0.3], [0.55, 0.08], [0.95, 0.4], [0.75, 0.92], [0.2, 0.85]],
    "irregular-hexagon": [[0.08, 0.35], [0.4, 0.08], [0.85, 0.2], [0.95, 0.6], [0.6, 0.92], [0.18, 0.8]],
    "irregular-quadrilateral": [[0.1, 0.2], [0.8, 0.08], [0.95, 0.85], [0.25, 0.7]],
    arrow: [[0.05, 0.38], [0.55, 0.38], [0.55, 0.12], [0.95, 0.5], [0.55, 0.88], [0.55, 0.62], [0.05, 0.62]],
    "l-shape": [[0.1, 0.08], [0.45, 0.08], [0.45, 0.6], [0.92, 0.6], [0.92, 0.92], [0.1, 0.92]]
  };
  function poly(n) { return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n % 2 ? 0 : Math.PI / n); return [0.5 + 0.46 * Math.cos(a), 0.52 + 0.46 * Math.sin(a)]; }); }
  function shapes(target, c) {
    const g = el("g");
    const items = c.items || [];
    const S = c.size || 120; const gap = 26;
    items.forEach((it, i) => {
      const x0 = 10 + i * (S + gap); const y0 = 10;
      const fill = it.fill || ["#bfdbfe", "#fde68a", "#bbf7d0", "#fbcfe8", "#ddd6fe", "#fed7aa"][i % 6];
      if (it.shape === "circle" || it.shape === "oval" || it.shape === "semicircle") {
        if (it.shape === "semicircle") g.appendChild(el("path", { d: `M ${x0 + 6} ${y0 + S * 0.7} A ${S / 2 - 6} ${S / 2 - 6} 0 0 1 ${x0 + S - 6} ${y0 + S * 0.7} Z`, fill, stroke: INK, "stroke-width": 2.4 }));
        else g.appendChild(el("ellipse", { cx: x0 + S / 2, cy: y0 + S / 2, rx: S / 2 - 6, ry: it.shape === "oval" ? S / 3 : S / 2 - 6, fill, stroke: INK, "stroke-width": 2.4 }));
      } else {
        let pts = SHAPES[it.shape] || SHAPES.square;
        if (it.rotate) { const a = it.rotate * Math.PI / 180; pts = pts.map(([x, y]) => [0.5 + (x - 0.5) * Math.cos(a) - (y - 0.5) * Math.sin(a), 0.5 + (x - 0.5) * Math.sin(a) + (y - 0.5) * Math.cos(a)]); }
        const P = pts.map(([x, y]) => [x0 + x * S, y0 + y * S]);
        g.appendChild(el("polygon", { points: P.map(p => `${r1(p[0])},${r1(p[1])}`).join(" "), fill, stroke: INK, "stroke-width": 2.4, "stroke-linejoin": "round" }));
        if (it.marks === "right") P.forEach((p, k) => { const a = P[(k + P.length - 1) % P.length]; const b = P[(k + 1) % P.length]; const u = unit([a[0] - p[0], a[1] - p[1]]); const v = unit([b[0] - p[0], b[1] - p[1]]); if (Math.abs(u[0] * v[0] + u[1] * v[1]) < 0.05) { const s = 10; g.appendChild(el("polyline", { points: `${r1(p[0] + u[0] * s)},${r1(p[1] + u[1] * s)} ${r1(p[0] + (u[0] + v[0]) * s)},${r1(p[1] + (u[1] + v[1]) * s)} ${r1(p[0] + v[0] * s)},${r1(p[1] + v[1] * s)}`, fill: "none", stroke: C.red, "stroke-width": 1.8 })); } });
        if (it.dots) P.forEach(p => g.appendChild(el("circle", { cx: r1(p[0]), cy: r1(p[1]), r: 5, fill: C.red })));
      }
      if (it.label !== undefined) labelOrBox(g, it.label, x0 + S / 2, y0 + S + 24, { size: 24, weight: 700, bw: 90, bh: 32 });
    });
    const anyLabel = items.some(it => it.label !== undefined);
    return finish(target, g, 10 + items.length * (S + gap) - gap + 10, 10 + S + (anyLabel ? 44 : 10), "shapes");
  }
  function unit(v) { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  /* ── compass rose ────────────────────────────────────── */
  function compass(target, c) {
    const g = el("g");
    const cx = 150; const cy = 150; const R = 100;
    const dirs = c.eight ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] : ["N", "E", "S", "W"];
    dirs.forEach((d, i) => {
      const a = (i * 2 * Math.PI) / dirs.length - Math.PI / 2; const main = d.length === 1;
      const L = main ? R : R * 0.68;
      const tip = [cx + L * Math.cos(a), cy + L * Math.sin(a)];
      const side = main ? 16 : 10;
      const l = [cx + side * Math.cos(a - Math.PI / 2), cy + side * Math.sin(a - Math.PI / 2)]; const r = [cx + side * Math.cos(a + Math.PI / 2), cy + side * Math.sin(a + Math.PI / 2)];
      g.appendChild(el("polygon", { points: `${r1(tip[0])},${r1(tip[1])} ${r1(l[0])},${r1(l[1])} ${cx},${cy}`, fill: main ? "#1e3a8a" : "#93c5fd", stroke: INK, "stroke-width": 1 }));
      g.appendChild(el("polygon", { points: `${r1(tip[0])},${r1(tip[1])} ${r1(r[0])},${r1(r[1])} ${cx},${cy}`, fill: main ? "#93c5fd" : "#dbeafe", stroke: INK, "stroke-width": 1 }));
      const lab = c.labels && Object.prototype.hasOwnProperty.call(c.labels, d) ? c.labels[d] : d;
      const lr = L + (main ? 28 : 26);
      labelOrBox(g, lab, cx + lr * Math.cos(a), cy + lr * Math.sin(a), { size: main ? 24 : 18, weight: 700, bw: main ? 40 : 46, bh: 30 });
    });
    return finish(target, g, 300, 300, "compass rose");
  }

  /* ── angle cards ─────────────────────────────────────── */
  function angles(target, c) {
    const g = el("g");
    const items = c.items || [];
    const S = 200; const gap = 22;
    const perRow = c.perRow || Math.min(4, items.length);
    const hasLabel = items.some(i => i.label !== undefined);
    const rowH = S + (hasLabel ? 46 : 16);
    items.forEach((it, i) => {
      const x0 = 10 + (i % perRow) * (S + gap); const y0 = 10 + Math.floor(i / perRow) * rowH;
      const deg = it.deg; const big = deg > 180;
      const rot = it.rotate || 0;
      const L = big ? 78 : 104;
      // place the vertex so both arms stay inside the card
      const a1 = -rot * Math.PI / 180; const a2 = -(rot + deg) * Math.PI / 180;
      const ends = [[0, 0], [L * Math.cos(a1), L * Math.sin(a1)], [L * Math.cos(a2), L * Math.sin(a2)]];
      if (it.tester) ends.push([76 * Math.cos(a1 - Math.PI / 2), 76 * Math.sin(a1 - Math.PI / 2)]);
      if (big) ends.push([-26, -26], [26, 26]);
      const minX = Math.min(...ends.map(e => e[0])); const maxX = Math.max(...ends.map(e => e[0]));
      const minY = Math.min(...ends.map(e => e[1])); const maxY = Math.max(...ends.map(e => e[1]));
      const vx = x0 + S / 2 - (minX + maxX) / 2; const vy = y0 + S / 2 - (minY + maxY) / 2;
      const p1 = [vx + ends[1][0], vy + ends[1][1]]; const p2 = [vx + ends[2][0], vy + ends[2][1]];
      rect(g, x0, y0, S, S, { fill: "#f8fafc", stroke: "#cbd5e1", width: 1.4, rx: 10 });
      if (it.tester) { const t = 76; g.appendChild(el("polyline", { points: `${r1(vx + t * Math.cos(a1))},${r1(vy + t * Math.sin(a1))} ${r1(vx)},${r1(vy)} ${r1(vx + t * Math.cos(a1 - Math.PI / 2))},${r1(vy + t * Math.sin(a1 - Math.PI / 2))}`, fill: "rgba(252,165,165,0.25)", stroke: C.red, "stroke-width": 2.4, "stroke-dasharray": "7 5" })); }
      line(g, vx, vy, p1[0], p1[1], { width: 4 }); line(g, vx, vy, p2[0], p2[1], { width: 4 });
      g.appendChild(el("circle", { cx: r1(vx), cy: r1(vy), r: 4.5, fill: INK }));
      if (deg === 90 && !it.plain) { const s = 18; g.appendChild(el("polyline", { points: `${r1(vx + s * Math.cos(a1))},${r1(vy + s * Math.sin(a1))} ${r1(vx + s * Math.cos(a1) + s * Math.cos(a2))},${r1(vy + s * Math.sin(a1) + s * Math.sin(a2))} ${r1(vx + s * Math.cos(a2))},${r1(vy + s * Math.sin(a2))}`, fill: "none", stroke: C.accent, "stroke-width": 2.6 })); }
      else if (deg < 360) { const r = 28; const large = deg > 180 ? 1 : 0; g.appendChild(el("path", { d: `M ${r1(vx + r * Math.cos(a1))} ${r1(vy + r * Math.sin(a1))} A ${r} ${r} 0 ${large} 0 ${r1(vx + r * Math.cos(a2))} ${r1(vy + r * Math.sin(a2))}`, fill: "none", stroke: C.accent, "stroke-width": 2.6 })); }
      if (it.label !== undefined) labelOrBox(g, it.label, x0 + S / 2, y0 + S + 24, { size: 24, weight: 700, bw: 90, bh: 32 });
    });
    const rows = Math.ceil(items.length / perRow);
    return finish(target, g, 10 + Math.min(perRow, items.length) * (S + gap) - gap + 10, 10 + rows * rowH, "angles");
  }

  /* ── tally marks ─────────────────────────────────────── */
  function tallyMarks(g, n, x, y) {
    for (let i = 0; i < n; i++) {
      const inGroup = i % 5;
      if (inGroup === 4) { line(g, x - 4 * 14 - 4, y + 32, x - 2, y + 2, { width: 3 }); x += 16; continue; }
      line(g, x, y, x, y + 34, { width: 3 }); x += 14;
    }
    return x;
  }
  function tally(target, c) {
    const g = el("g");
    if (c.rows) {
      // a tally chart: { rows: [{ label, count, total }], heads: [..] }
      const lw = Math.max(90, ...c.rows.map(r => String(r.label).length * 12 + 20));
      const maxN = Math.max(5, ...c.rows.map(r => r.count || 0));
      const tw = Math.max(130, Math.ceil(maxN / 5) * 86 + 20);
      const showTotal = c.rows.some(r => r.total !== undefined);
      const W = lw + tw + (showTotal ? 90 : 0); const rh = 50; const hh = 40;
      const heads = c.heads || ["", "Tally", "Total"];
      rect(g, 4, 4, W, hh, { fill: "#dbeafe", width: 2 });
      text(g, heads[0], 4 + lw / 2, 4 + hh / 2, { size: 19 }); text(g, heads[1], 4 + lw + tw / 2, 4 + hh / 2, { size: 19 });
      if (showTotal) text(g, heads[2], 4 + lw + tw + 45, 4 + hh / 2, { size: 19 });
      c.rows.forEach((r, i) => {
        const y = 4 + hh + i * rh;
        rect(g, 4, y, W, rh, { fill: "#fff", width: 1.6 });
        text(g, r.label, 4 + lw / 2, y + rh / 2, { size: 19 });
        tallyMarks(g, r.count || 0, 4 + lw + 16, y + 8);
        if (showTotal) { if (r.total === null) box(g, 4 + lw + tw + 45, y + rh / 2, 50, 32); else if (r.total !== undefined) text(g, r.total, 4 + lw + tw + 45, y + rh / 2, { size: 20, weight: 700 }); }
      });
      line(g, 4 + lw, 4, 4 + lw, 4 + hh + c.rows.length * rh, { width: 1.6 });
      if (showTotal) line(g, 4 + lw + tw, 4, 4 + lw + tw, 4 + hh + c.rows.length * rh, { width: 1.6 });
      return finish(target, g, W + 8, hh + c.rows.length * rh + 8, "tally chart");
    }
    const x = tallyMarks(g, c.count || 0, 14, 12);
    return finish(target, g, Math.max(40, x + 10), 58, "tally marks");
  }

  /* ── fraction strips (a fraction wall) ───────────────── */
  function fractionStrip(target, c) {
    const g = el("g");
    const strips = c.strips || [{ den: c.den || 4, shaded: c.shaded || 1 }];
    const W = c.width || 440; const h = 56; const labelW = strips.some(s => s.label !== undefined) ? 70 : 0;
    strips.forEach((s, k) => {
      const y = 10 + k * (h + 10); const x0 = 10 + labelW;
      let cuts;
      if (s.unequal) { const raw = Array.from({ length: s.den }, (_, i) => 1 + ((i * 37) % 5) * 0.35); const tot = raw.reduce((a, b) => a + b, 0); let acc = 0; cuts = raw.map(r => { const c0 = acc; acc += (r / tot) * W; return [c0, acc]; }); }
      else cuts = Array.from({ length: s.den }, (_, i) => [(i * W) / s.den, ((i + 1) * W) / s.den]);
      cuts.forEach(([a, b], i) => {
        rect(g, x0 + a, y, b - a, h, { fill: i < (s.shaded || 0) ? (s.colour || C.shade) : "#fff", width: 2 });
        if (s.partLabels) fracText(g, s.den === 1 ? "1" : `1/${s.den}`, x0 + (a + b) / 2, y + h / 2, { size: 22 });
      });
      if (s.label !== undefined) labelOrBox(g, s.label, 10 + labelW / 2 - 4, y + h / 2, { size: 22, bw: 52, bh: 44 });
    });
    return finish(target, g, 20 + labelW + W, 10 + strips.length * (h + 10), "fraction strips");
  }

  /* ── one shape cut into parts ─────────────────────────── */
  function fractionShape(target, c) {
    const g = el("g");
    const n = c.den || 4; const k = c.shaded || 0; const shape = c.shape || "rect";
    if (shape === "circle") {
      const cx = 110; const cy = 110; const R = 100;
      let angles = Array.from({ length: n + 1 }, (_, i) => (i * 2 * Math.PI) / n);
      if (c.unequal) { const raw = Array.from({ length: n }, (_, i) => 1 + (i % 3) * 0.7); const tot = raw.reduce((a, b) => a + b, 0); let acc = 0; angles = [0, ...raw.map(r => (acc += (r / tot) * 2 * Math.PI))]; }
      for (let i = 0; i < n; i++) {
        const a = angles[i] - Math.PI / 2; const b = angles[i + 1] - Math.PI / 2; const large = b - a > Math.PI ? 1 : 0;
        g.appendChild(el("path", { d: `M ${cx} ${cy} L ${r1(cx + R * Math.cos(a))} ${r1(cy + R * Math.sin(a))} A ${R} ${R} 0 ${large} 1 ${r1(cx + R * Math.cos(b))} ${r1(cy + R * Math.sin(b))} Z`, fill: i < k ? C.shade : "#fff", stroke: INK, "stroke-width": 2.2 }));
      }
      return finish(target, g, 220, 220, "fraction circle");
    }
    const W = shape === "square" ? 200 : 300; const H = shape === "square" ? 200 : 140;
    // split into a grid where possible (e.g. 8 = 4×2), else strips
    const cols = c.grid && n % 2 === 0 && n > 4 ? n / 2 : n; const rows = n / cols;
    let parts = [];
    if (c.unequal) { const xs = [0, 0.18, 0.5, 0.62, 1].slice(0, n + 1); if (xs.length < n + 1) for (let i = xs.length; i <= n; i++) xs.push(i / n); parts = Array.from({ length: n }, (_, i) => [xs[i] * W, 0, (xs[i + 1] - xs[i]) * W, H]); }
    else for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) parts.push([q * W / cols, r * H / rows, W / cols, H / rows]);
    parts.forEach(([x, y, w, h], i) => rect(g, 10 + x, 10 + y, w, h, { fill: i < k ? C.shade : "#fff", width: 2.2 }));
    return finish(target, g, W + 20, H + 20, "fraction shape");
  }

  /* ── pan balance ─────────────────────────────────────── */
  function balance(target, c) {
    const g = el("g");
    const tilt = c.tilt === "left" ? 1 : c.tilt === "right" ? -1 : 0;
    const cx = 240; const top = 30; const arm = 160; const dy = tilt * 22; const drop = 96;
    g.appendChild(el("polygon", { points: `${cx - 40},${top + drop + 70} ${cx + 40},${top + drop + 70} ${cx},${top + 6}`, fill: "#e5e7eb", stroke: INK, "stroke-width": 2 }));
    line(g, cx - arm, top + dy, cx + arm, top - dy, { width: 5 });
    [[-1, c.left, dy], [1, c.right, -dy]].forEach(([s, lab, d]) => {
      const x = cx + s * arm; const y = top + d; const py = y + drop;
      line(g, x, y, x - 72, py, { width: 1.4, stroke: "#6b7280" }); line(g, x, y, x + 72, py, { width: 1.4, stroke: "#6b7280" });
      g.appendChild(el("path", { d: `M ${x - 78} ${py} Q ${x} ${py + 30} ${x + 78} ${py} Z`, fill: "#cbd5e1", stroke: INK, "stroke-width": 2 }));
      if (lab === null) { box(g, x, py - 22, 70, 36); return; }
      if (lab === undefined || lab === "") return;
      const str = String(lab); const w = Math.max(56, str.length * 13 + 22);
      rect(g, x - w / 2, py - 42, w, 40, { fill: "#fef3c7", width: 2, rx: 6 });
      text(g, str, x, py - 21, { size: 22, weight: 700 });
    });
    return finish(target, g, 480, top + drop + 76, "pan balance");
  }


  /* ══ STAGE 1 MODELS ════════════════════════════════════ */

  /* Small picture icons for counting collections. Each is drawn centred on
     (x, y) inside a box about s wide. Simple, bold and printable. */
  const ICONS = ["apple", "star", "ball", "fish", "car", "cup", "flower", "heart", "block", "leaf", "bird", "pencil"];
  function icon(g, kind, x, y, s = 36) {
    if (!kind) return; // an empty slot keeps rows lined up
    const k = s / 36;
    const P = (d, fill, extra = {}) => g.appendChild(el("path", { d, fill, stroke: INK, "stroke-width": 1.6 / k, "stroke-linejoin": "round", transform: `translate(${r1(x)} ${r1(y)}) scale(${r1(k * 100) / 100})`, ...extra }));
    if (kind === "apple") { P("M0 -9 C-10 -16 -18 -4 -15 6 C-12 16 -4 17 0 14 C4 17 12 16 15 6 C18 -4 10 -16 0 -9 Z", "#f87171"); P("M0 -9 C0 -13 2 -16 4 -17", "none"); P("M1 -12 C6 -17 11 -15 12 -13 C8 -10 4 -10 1 -12 Z", "#4ade80"); }
    else if (kind === "star") P("M0 -16 L4.7 -5.5 L15.5 -5 L7 2 L9.8 13 L0 7 L-9.8 13 L-7 2 L-15.5 -5 L-4.7 -5.5 Z", "#facc15");
    else if (kind === "ball") { P("M0 -15 A15 15 0 1 0 0.01 -15 Z", "#60a5fa"); P("M-15 0 Q0 -8 15 0 M-10 -11 Q0 0 -10 11", "none"); }
    else if (kind === "fish") { P("M-15 0 C-8 -11 8 -11 12 0 C8 11 -8 11 -15 0 Z", "#fb923c"); P("M12 0 L19 -7 L19 7 Z", "#fb923c"); P("M-7 -2 A1.6 1.6 0 1 0 -6.9 -2", "#111"); }
    else if (kind === "car") { P("M-17 4 L-17 -3 L-10 -4 L-6 -11 L7 -11 L11 -4 L17 -2 L17 4 Z", "#f87171"); P("M-9 4 A4 4 0 1 0 -8.9 4", "#374151"); P("M9 4 A4 4 0 1 0 9.1 4", "#374151"); }
    else if (kind === "cup") { P("M-11 -12 L11 -12 L8 13 L-8 13 Z", "#c4b5fd"); P("M11 -6 C18 -6 18 5 9 5", "none"); }
    else if (kind === "flower") { for (let i = 0; i < 5; i++) { const a = (i * 72 * Math.PI) / 180; P(`M${r1(Math.cos(a) * 8)} ${r1(Math.sin(a) * 8 - 3)} m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0`, "#f9a8d4"); } P("M0 -3 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0", "#facc15"); P("M0 5 L0 16", "none"); }
    else if (kind === "heart") P("M0 14 C-18 2 -16 -14 -6 -13 C-2 -13 0 -9 0 -7 C0 -9 2 -13 6 -13 C16 -14 18 2 0 14 Z", "#f472b6");
    else if (kind === "block") { P("M-11 -7 L-4 -13 L13 -13 L6 -7 Z", "#fde68a"); P("M6 -7 L13 -13 L13 6 L6 12 Z", "#fcd34d"); P("M-11 -7 L6 -7 L6 12 L-11 12 Z", "#fef08a"); }
    else if (kind === "leaf") { P("M-14 12 C-14 -6 0 -15 14 -14 C14 2 4 14 -14 12 Z", "#86efac"); P("M-14 12 L8 -8", "none"); }
    else if (kind === "bird") { P("M-13 2 C-13 -9 3 -11 7 -3 L15 -5 L9 2 C9 10 -5 13 -13 2 Z", "#93c5fd"); P("M2 -4 A1.5 1.5 0 1 0 2.1 -4", "#111"); }
    else if (kind === "pencil") { P("M-16 -4 L10 -4 L17 0 L10 4 L-16 4 Z", "#fcd34d"); P("M10 -4 L17 0 L10 4 Z", "#f5deb3"); }
    else P("M-12 -12 h24 v24 h-24 z", "#e5e7eb");
  }

  /* objects: a collection of pictures. { count, item, perRow (5), crossed:
     n (the last n get a cross — "take away"), circled: n, items: [..] for a
     mixed row (then `labels` names each position) } */
  function objects(target, c) {
    const g = el("g");
    const list = c.items || Array.from({ length: c.count || 0 }, () => c.item || "apple");
    const n = list.length; const per = c.perRow || (c.items ? n : Math.min(5, n)) || 1; const S = 44; const gapExtra = c.items ? 18 : 0;
    const labels = c.labels || null;
    const rl = c.rowLabels || null; const off = rl ? 50 : 0; // row labels (A, B …) at the left
    if (rl) rl.forEach((t, r) => text(g, t, 22, 30 + r * (S + (labels ? 30 : 6)), { size: 24, weight: 700 }));
    list.forEach((it, i) => {
      const col = i % per; const row = Math.floor(i / per);
      const x = off + 30 + col * (S + gapExtra) + (per === 10 && col >= 5 ? 14 : 0); const y = 30 + row * (S + (labels ? 30 : 6));
      icon(g, it, x, y, 36);
      if (c.crossed && i >= n - c.crossed) { line(g, x - 16, y - 16, x + 16, y + 16, { width: 3.5, stroke: C.red }); line(g, x + 16, y - 16, x - 16, y + 16, { width: 3.5, stroke: C.red }); }
      if (labels) labelOrBox(g, labels[i], x, y + 32, { size: 18, bw: 34, bh: 26 });
    });
    if (c.circle) c.circle.forEach(([from, to]) => { // [start index, end index] on one row
      const x0 = 30 + (from % per) * (S + gapExtra) - 22; const x1 = 30 + (to % per) * (S + gapExtra) + 22; const y = 30 + Math.floor(from / per) * (S + 6);
      rect(g, x0, y - 24, x1 - x0, 48, { rx: 22, stroke: C.accent, width: 2.4, dash: "6 4" });
    });
    const cols = Math.min(per, n); const rows = Math.ceil(n / per);
    return finish(target, g, off + 30 + (cols - 1) * (S + gapExtra) + 30 + (per === 10 ? 14 : 0), 30 + (rows - 1) * (S + (labels ? 30 : 6)) + (labels ? 60 : 30), "pictures");
  }

  /* ten-frame: { count, count2 (a second colour, drawn after), frames } */
  function tenFrame(target, c) {
    const g = el("g");
    const a = c.count || 0; const b = c.count2 || 0; const tot = a + b;
    const frames = c.frames || Math.max(1, Math.ceil(tot / 10));
    const S = 44; const fw = 5 * S; const gap = 26;
    for (let f = 0; f < frames; f++) {
      const x0 = 10 + f * (fw + gap); const y0 = 10;
      rect(g, x0, y0, fw, 2 * S, { fill: "#fff", width: 3 });
      for (let i = 1; i < 5; i++) line(g, x0 + i * S, y0, x0 + i * S, y0 + 2 * S, { width: 1.6 });
      line(g, x0, y0 + S, x0 + fw, y0 + S, { width: 1.6 });
      for (let k = 0; k < 10; k++) {
        const idx = f * 10 + k; if (idx >= tot) break;
        const cx = x0 + (k % 5) * S + S / 2; const cy = y0 + Math.floor(k / 5) * S + S / 2;
        g.appendChild(el("circle", { cx: r1(cx), cy: r1(cy), r: 15, fill: idx < a ? "#f87171" : "#fde047", stroke: INK, "stroke-width": 1.6 }));
      }
    }
    return finish(target, g, 20 + frames * fw + (frames - 1) * gap, 2 * S + 20, "ten-frame");
  }

  /* dice: { values: [3, 5, …], labels } standard dot patterns 1–6 */
  const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
  function dice(target, c) {
    const g = el("g"); const vals = c.values || [1]; const S = 76; const gap = 24;
    vals.forEach((v, i) => {
      const x0 = 10 + i * (S + gap); const y0 = 10;
      rect(g, x0, y0, S, S, { fill: "#fff", width: 3, rx: 12 });
      (PIPS[v] || []).forEach(([cx, cy]) => g.appendChild(el("circle", { cx: r1(x0 + 16 + cx * 22), cy: r1(y0 + 16 + cy * 22), r: 7, fill: INK })));
      if (c.labels) labelOrBox(g, c.labels[i], x0 + S / 2, y0 + S + 22, { size: 20, bw: 40, bh: 28 });
    });
    return finish(target, g, 20 + vals.length * S + (vals.length - 1) * gap, S + (c.labels ? 56 : 20), "dice");
  }

  /* hundred-chart: { from, to, cols (10), blanks: [n…] (empty box),
     shade: [n…], rows: [firstRow, lastRow] to show part of the chart } */
  function hundredChart(target, c) {
    const g = el("g");
    const from = c.from || 1; const to = c.to || 100; const cols = c.cols || 10; const S = 44;
    const blanks = new Set(c.blanks || []); const shade = new Set(c.shade || []);
    const n = to - from + 1; const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const v = from + i; const x = 10 + (i % cols) * S; const y = 10 + Math.floor(i / cols) * S;
      rect(g, x, y, S, S, { fill: shade.has(v) ? "#bfdbfe" : blanks.has(v) ? "#fef9c3" : "#fff", width: 1.4 });
      if (!blanks.has(v)) text(g, v, x + S / 2, y + S / 2 + 1, { size: v >= 100 ? 15 : 18, weight: 600 });
    }
    return finish(target, g, 20 + cols * S, 20 + rows * S, "number chart");
  }

  /* unit-length: an object measured with informal units laid end to end.
     { rows: [{ object, units, label }], unit: "cube"|"paperclip"|"hand",
       showUnits: true } — `units` may be fractional only in steps of 0.5 */
  function unitLength(target, c) {
    const g = el("g");
    const rows = c.rows || [{ object: c.object || "pencil", units: c.units || 5 }];
    const UW = { hand: 56, paperclip: 50, cube: 40, rod: 80 };
    const unitOf = r => r.unit || c.unit || "cube";
    const x0 = c.rows && rows.some(r => r.label) ? 60 : 16;
    let y = 10;
    rows.forEach(r => {
      const U = UW[unitOf(r)] || 40; const unit = unitOf(r);
      const L = r.units * U;
      if (r.label) text(g, r.label, 28, y + 16, { size: 22, weight: 700 });
      // object
      const ob = r.object || "pencil"; const oh = 26;
      if (ob === "pencil" || ob === "crayon") {
        const body = ob === "pencil" ? "#fcd34d" : "#c4b5fd";
        g.appendChild(el("polygon", { points: `${x0},${y + 3} ${x0 + L - 22},${y + 3} ${x0 + L},${y + 3 + oh / 2} ${x0 + L - 22},${y + 3 + oh} ${x0},${y + 3 + oh}`, fill: body, stroke: INK, "stroke-width": 2 }));
      } else if (ob === "snake") {
        rect(g, x0, y + 6, L, 20, { fill: "#86efac", width: 2, rx: 10 });
        g.appendChild(el("circle", { cx: x0 + L - 8, cy: y + 13, r: 2.2, fill: INK }));
      } else if (ob === "ribbon") rect(g, x0, y + 8, L, 16, { fill: "#f9a8d4", width: 2 });
      else rect(g, x0, y + 4, L, 24, { fill: "#93c5fd", width: 2, rx: 4 });
      line(g, x0, y + 34, x0, y + 36 + (c.showUnits === false ? 0 : 30), { dash: "3 3", width: 1.2, stroke: C.grey });
      line(g, x0 + L, y + 34, x0 + L, y + 36 + (c.showUnits === false ? 0 : 30), { dash: "3 3", width: 1.2, stroke: C.grey });
      y += 38;
      if (c.showUnits !== false) {
        const whole = Math.floor(r.units); const part = r.units - whole;
        for (let i = 0; i < Math.ceil(r.units); i++) {
          const x = x0 + i * U; const w = i < whole ? U : part * U;
          if (unit === "paperclip") { rect(g, x + 2, y + 6, U - 4, 16, { fill: "none", stroke: "#475569", width: 2.2, rx: 8 }); rect(g, x + 8, y + 10, U - 16, 8, { fill: "none", stroke: "#475569", width: 1.6, rx: 4 }); }
          else if (unit === "hand") { rect(g, x + 1, y, U - 2, 30, { fill: "#fed7aa", width: 1.6, rx: 12 }); }
          else rect(g, x, y, w, 28, { fill: i % 2 ? "#a7f3d0" : "#fde68a", width: 1.6 });
        }
        y += 40;
      }
      y += 10;
    });
    const maxL = Math.max(...rows.map(r => r.units * (UW[unitOf(r)] || 40)));
    return finish(target, g, x0 + maxL + 16, y, "measuring with units");
  }

  /* calendar: { month, startDay (0 = Monday), days, highlight: [d…],
     circle: [d…], blanks: [d…] } */
  function calendar(target, c) {
    const g = el("g"); const S = 50; const H = 36; const heads = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const start = c.startDay || 0; const days = c.days || 30; const hi = new Set(c.highlight || []); const circ = new Set(c.circle || []); const blanks = new Set(c.blanks || []);
    rect(g, 10, 10, 7 * S, 40, { fill: "#1d4ed8", stroke: "#1d4ed8" });
    text(g, c.month || "Month", 10 + 3.5 * S, 30, { size: 22, weight: 700, fill: "#fff" });
    heads.forEach((h, i) => { rect(g, 10 + i * S, 50, S, H, { fill: "#dbeafe", width: 1.2 }); text(g, h, 10 + i * S + S / 2, 50 + H / 2, { size: 15 }); });
    const rows = Math.ceil((start + days) / 7);
    for (let k = 0; k < rows * 7; k++) {
      const x = 10 + (k % 7) * S; const y = 50 + H + Math.floor(k / 7) * S; const d = k - start + 1;
      rect(g, x, y, S, S, { fill: d >= 1 && d <= days && hi.has(d) ? "#fef08a" : "#fff", width: 1.2 });
      if (d >= 1 && d <= days && !blanks.has(d)) text(g, d, x + S / 2, y + S / 2, { size: 18 });
      if (circ.has(d)) g.appendChild(el("circle", { cx: x + S / 2, cy: y + S / 2, r: 18, fill: "none", stroke: C.red, "stroke-width": 2.6 }));
    }
    return finish(target, g, 20 + 7 * S, 60 + H + rows * S, "calendar");
  }

  function render(target, config = {}) {
    const t = config.diagramType || "base10";
    const map = { base10, cards, "pv-chart": pvChart, "number-line": numberLine, grid10, groups, array, shapes, compass, angles, tally, "fraction-strip": fractionStrip, "fraction-shape": fractionShape, balance, "column-sum": columnSum, ruler, objects, "ten-frame": tenFrame, dice, "hundred-chart": hundredChart, "unit-length": unitLength, calendar };
    const fn = map[t];
    if (!fn) { if (target) target.innerHTML = `<div class="diagram-placeholder">Unknown manipulative</div>`; return null; }
    return fn(target, config);
  }

  return { render };
})();
