// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/measure/measure-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Measurement Instruments Engine
  ---------------------------------------------------
  engines/measure/measure-engine.js

  Exposes: window.MMT_MEASURE_ENGINE.render(target, config)

  Stage 3 "Mass and Time" (MA3-NSM-01/02) and the capacity half of "3D Space
  and Volume" (MA3-3DS-02) are about READING INSTRUMENTS: a clock face, a
  kitchen scale, a measuring jug. A question that states the reading in words
  has skipped the skill, so this engine draws the instrument and the student
  reads it.

  diagramType
  -----------
    clock      analogue clock face; `hours`, `minutes`; `hands: false` draws
               an empty face for "draw the hands"
    digital    a digital display: `text` ("14:35"), optional `suffix` ("pm")
    scale      a dial scale with a needle: `max`, `major`, `minor`, `value`,
               `unit`
    jug        a measuring jug: `capacity`, `major`, `minor`, `level`, `unit`
    jugs       two jugs side by side (before / after) for displacement:
               `before`, `after`, plus the jug fields; a stone sits in the
               second
    timeline   a time line for durations: `points` [{ at, label }] placed in
               proportion to the minutes (with a minimum gap, so short jumps
               stay legible). A point's `note` is written above its mark,
               for event time lines., `jumps` [{ from, to, label }] drawn as arcs; a label
               of null draws an empty box

  Every reading the bank asks about is exactly on a drawn mark or a stated
  fraction of the way between two, so the picture is unambiguous.
*/

window.MMT_MEASURE_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const TEXT = 18;
  const INK = "#111827";
  const ACCENT = "#1d4ed8";
  const RED = "#b91c1c";
  const WATER = "#bfdbfe";
  const FONT = "'Cambria Math','Times New Roman',serif";
  const r1 = v => Math.round(v * 10) / 10;

  function el(n, a = {}) {
    const e = document.createElementNS(NS, n);
    Object.entries(a).forEach(([k, v]) => { if (v !== undefined && v !== null) e.setAttribute(k, String(v)); });
    return e;
  }
  function text(g, v, x, y, o = {}) {
    const t = el("text", { x: r1(x), y: r1(y), "font-family": o.font || FONT, "font-size": o.size || TEXT, "text-anchor": o.anchor || "middle", "dominant-baseline": "middle", "font-weight": o.weight || 400, fill: o.fill || INK, ...(o.halo ? { stroke: "#fff", "stroke-width": 5, "paint-order": "stroke", "stroke-linejoin": "round" } : {}) });
    t.textContent = String(v);
    g.appendChild(t);
  }
  function line(g, x1, y1, x2, y2, o = {}) {
    g.appendChild(el("line", { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), stroke: o.stroke || INK, "stroke-width": o.width || 2, "stroke-linecap": "round" }));
  }
  function box(g, x, y, w = 56, h = 30) {
    g.appendChild(el("rect", { x: r1(x - w / 2), y: r1(y - h / 2), width: w, height: h, rx: 3, fill: "#fff", stroke: INK, "stroke-width": 1.8 }));
  }
  function finish(target, g, w, h, label) {
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, width: "100%", role: "img", "aria-label": label });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }
  const fmt = v => String(Math.round(v * 1000) / 1000).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  /* ── clock ─────────────────────────────────────────────── */
  function clock(target, c) {
    const R = 110;
    const cx = 130;
    const cy = 130;
    const g = el("g");
    g.appendChild(el("circle", { cx, cy, r: R, fill: "#fff", stroke: INK, "stroke-width": 4 }));
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      if (!major && c.minuteTicks === false) continue;
      const r0 = major ? R - 14 : R - 7;
      line(g, cx + r0 * Math.sin(a), cy - r0 * Math.cos(a), cx + (R - 2) * Math.sin(a), cy - (R - 2) * Math.cos(a), { width: major ? 3 : 1.4 });
    }
    if (c.hands !== false) {
      const m = Number(c.minutes) || 0;
      const h = (Number(c.hours) || 0) % 12;
      const ha = ((h + m / 60) / 12) * Math.PI * 2;
      const ma = (m / 60) * Math.PI * 2;
      g.appendChild(el("line", { x1: cx, y1: cy, x2: r1(cx + 58 * Math.sin(ha)), y2: r1(cy - 58 * Math.cos(ha)), stroke: INK, "stroke-width": 8, "stroke-linecap": "round" }));
      g.appendChild(el("line", { x1: cx, y1: cy, x2: r1(cx + 90 * Math.sin(ma)), y2: r1(cy - 90 * Math.cos(ma)), stroke: ACCENT, "stroke-width": 5, "stroke-linecap": "round" }));
    }
    if (c.numbers !== false) {
      for (let h = 1; h <= 12; h++) {
        const a = (h / 12) * Math.PI * 2;
        text(g, c.roman ? ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][h - 1] : h, cx + (R - 34) * Math.sin(a), cy - (R - 34) * Math.cos(a) + 1, { size: 20, weight: 700, halo: true });
      }
    }
    g.appendChild(el("circle", { cx, cy, r: 7, fill: INK }));
    let H = 260;
    if (c.caption) { text(g, c.caption, cx, 262, { size: 17, weight: 700 }); H = 280; }
    return finish(target, g, 260, H, "clock");
  }

  /* ── digital ───────────────────────────────────────────── */
  function digital(target, c) {
    const g = el("g");
    const t = String(c.text || "12:00");
    const w = 40 + t.length * 30 + (c.suffix ? 50 : 0);
    g.appendChild(el("rect", { x: 4, y: 4, width: w, height: 76, rx: 12, fill: "#0f172a", stroke: INK, "stroke-width": 3 }));
    text(g, t, 24 + t.length * 15, 44, { size: 46, weight: 700, fill: "#86efac", font: "'Courier New',monospace" });
    if (c.suffix) text(g, c.suffix, w - 26, 56, { size: 20, weight: 700, fill: "#86efac", font: "'Courier New',monospace" });
    return finish(target, g, w + 8, 84, "digital clock");
  }

  /* ── dial scale ────────────────────────────────────────── */
  function scale(target, c) {
    const max = Number(c.max) || 1000;
    const major = Number(c.major) || max / 10;
    const minor = Number(c.minor) || major / 5;
    const unit = c.unit || "g";
    const R = 120;
    const cx = 160;
    const cy = 160;
    // The dial runs 270° clockwise from bottom-left, like a kitchen scale.
    const A0 = -225 * Math.PI / 180;
    const span = 270 * Math.PI / 180;
    const ang = v => A0 + (v / max) * span;
    const g = el("g");
    g.appendChild(el("rect", { x: 20, y: 18, width: 280, height: 290, rx: 30, fill: "#f1f5f9", stroke: INK, "stroke-width": 3 }));
    g.appendChild(el("circle", { cx, cy, r: R + 10, fill: "#fff", stroke: INK, "stroke-width": 3 }));
    const steps = Math.round(max / minor);
    const labels = [];
    for (let i = 0; i <= steps; i++) {
      const v = i * minor;
      const a = ang(v);
      const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
      const half = !isMajor && Math.abs((v * 2) / major - Math.round((v * 2) / major)) < 1e-9 && major / minor >= 4;
      const r0 = isMajor ? R - 18 : half ? R - 12 : R - 7;
      line(g, cx + r0 * Math.cos(a), cy + r0 * Math.sin(a), cx + R * Math.cos(a), cy + R * Math.sin(a), { width: isMajor ? 2.8 : 1.3 });
      if (isMajor) labels.push([fmt(v), cx + (R - (c.labelSize ? 30 + c.labelSize / 2 : 36)) * Math.cos(a), cy + (R - (c.labelSize ? 30 + c.labelSize / 2 : 36)) * Math.sin(a)]);
    }
    text(g, unit, cx, cy + 58, { size: 20, weight: 700, fill: "#475569" });
    if (Number.isFinite(c.value)) {
      const a = ang(c.value);
      g.appendChild(el("line", { x1: cx, y1: cy, x2: r1(cx + (R - 4) * Math.cos(a)), y2: r1(cy + (R - 4) * Math.sin(a)), stroke: RED, "stroke-width": 4, "stroke-linecap": "round" }));
    }
    labels.forEach(([v, x, y]) => text(g, v, x, y, { size: c.labelSize || 18, weight: 700, halo: true }));
    g.appendChild(el("circle", { cx, cy, r: 8, fill: RED }));
    return finish(target, g, 320, 320, "scale");
  }

  /* ── measuring jug ─────────────────────────────────────── */
  function jugAt(g, x, c, level, caption, stone) {
    const cap = Number(c.capacity) || 1000;
    const major = Number(c.major) || cap / 4;
    const minor = Number(c.minor) || major / 5;
    const unit = c.unit || "mL";
    const top = 40;
    const bottom = 300;
    const w = 120;
    const Y = v => bottom - (v / cap) * (bottom - top - 20);
    // water
    if (level > 0) g.appendChild(el("rect", { x: x + 2, y: r1(Y(level)), width: w - 4, height: r1(bottom - Y(level)), fill: WATER }));
    if (stone) g.appendChild(el("ellipse", { cx: x + w / 2, cy: bottom - 20, rx: 30, ry: 18, fill: "#9ca3af", stroke: INK, "stroke-width": 2 }));
    // jug outline and spout
    g.appendChild(el("path", { d: `M ${x} ${top} L ${x} ${bottom} L ${x + w} ${bottom} L ${x + w} ${top}`, fill: "none", stroke: INK, "stroke-width": 3 }));
    g.appendChild(el("path", { d: `M ${x} ${top} l -12 -10`, stroke: INK, "stroke-width": 3 }));
    g.appendChild(el("path", { d: `M ${x + w} ${top + 30} q 36 10 30 60 q -4 50 -30 60`, fill: "none", stroke: INK, "stroke-width": 3 }));
    const steps = Math.round(cap / minor);
    for (let i = 1; i <= steps; i++) {
      const v = i * minor;
      const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
      line(g, x, Y(v), x + (isMajor ? 26 : 14), Y(v), { width: isMajor ? 2.4 : 1.2 });
      if (isMajor) text(g, fmt(v), x + 32, Y(v), { size: 16, anchor: "start", weight: 700 });
    }
    text(g, unit, x + w / 2, top - 18, { size: 16, weight: 700, fill: "#475569" });
    if (caption) text(g, caption, x + w / 2, bottom + 24, { size: 17, weight: 700 });
  }

  function jug(target, c) {
    const g = el("g");
    jugAt(g, 40, c, Number(c.level) || 0, c.caption, false);
    return finish(target, g, 220, c.caption ? 336 : 318, "measuring jug");
  }

  function jugs(target, c) {
    const g = el("g");
    jugAt(g, 40, c, Number(c.before) || 0, c.captions?.[0] || "Before", false);
    jugAt(g, 250, c, Number(c.after) || 0, c.captions?.[1] || "After", true);
    return finish(target, g, 430, 336, "measuring jugs");
  }

  /* ── time line ─────────────────────────────────────────── */
  function timeline(target, c) {
    const pts = c.points || [];
    const W = 470;
    const x0 = 50;
    // Proportional spacing, but no two marks closer than MIN, so a 5-minute
    // jump still has room for its box and its time labels.
    const MIN = 96;
    const ats = [...new Set(pts.map(p => p.at))].sort((a, b) => a - b);
    const span = Math.max(1, ats[ats.length - 1] - ats[0]);
    const gaps = ats.slice(1).map((a, i) => (a - ats[i]) / span * W);
    const short = gaps.filter(g => g < MIN).length;
    const longTotal = gaps.filter(g => g >= MIN).reduce((s2, g) => s2 + g, 0);
    const scale = longTotal > 0 ? Math.max(0, W - short * MIN) / longTotal : 0;
    const pos = new Map([[ats[0], x0]]);
    let acc = x0;
    gaps.forEach((g, i) => { acc += g < MIN ? MIN : Math.max(MIN, g * scale); pos.set(ats[i + 1], acc); });
    const X = t => pos.has(t) ? pos.get(t) : x0;
    const y = 120;
    const g = el("g");
    const xEnd = Math.max(...pos.values());
    line(g, x0 - 20, y, xEnd + 20, y, { width: 2.6 });
    pts.forEach((p, i) => {
      line(g, X(p.at), y - 10, X(p.at), y + 10, { width: 2.4 });
      // an event name above the mark (history-style time lines); staggered
      // so neighbouring names never collide
      if (p.note) text(g, p.note, X(p.at), y - 28 - (i % 2) * 26, { size: 15, weight: 700, fill: ACCENT });
      if (p.label === null) box(g, X(p.at), y + 34, 84);
      else text(g, p.label, X(p.at), y + 34, { size: 16, weight: 700 });
    });
    (c.jumps || []).forEach(j => {
      const a = X(j.from);
      const b = X(j.to);
      const h = Math.min(70, Math.max(28, (b - a) * 0.35));
      g.appendChild(el("path", { d: `M ${r1(a)} ${y - 4} Q ${r1((a + b) / 2)} ${r1(y - h * 2)} ${r1(b)} ${y - 4}`, fill: "none", stroke: ACCENT, "stroke-width": 2.4 }));
      g.appendChild(el("polygon", { points: `${r1(b)},${y - 4} ${r1(b - 9)},${y - 14} ${r1(b - 1)},${y - 17}`, fill: ACCENT }));
      if (j.label === null) box(g, (a + b) / 2, y - h - 14, 70, 28);
      else text(g, j.label, (a + b) / 2, y - h - 14, { size: 16, weight: 700, fill: ACCENT });
    });
    return finish(target, g, xEnd + 70, 180, "time line");
  }

  function render(target, config = {}) {
    const t = config.diagramType || "clock";
    if (t === "clock") return clock(target, config);
    if (t === "digital") return digital(target, config);
    if (t === "scale") return scale(target, config);
    if (t === "jug") return jug(target, config);
    if (t === "jugs") return jugs(target, config);
    if (t === "timeline") return timeline(target, config);
    if (target) target.innerHTML = `<div class="diagram-placeholder">Unknown measurement diagram</div>`;
    return null;
  }

  return { render };
})();
