// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/probability/probability-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  Mills Maths Tools — Probability Engine
  ---------------------------------------
  engines/probability/probability-engine.js

  Exposes: window.MMT_PROBABILITY_ENGINE.render(target, config)

  Stage 4 "Probability" (MA4-PRO-C-01) is about simple chance experiments,
  so the engine draws the four objects those experiments are made of.

  diagramType
  -----------
    spinner   sectors (equal, or sized by `weights`) each carrying a label,
              with a pointer; labels double as colour names so the question
              still works printed in black and white
    bag       counters in a bag, each marked with a letter (R, B, G…) and
              a key, for the same black-and-white reason
    scale     (Stage 2: `numbers: false` hides 0, ½, 1 and `wordList`
              [[word, position], …] replaces the chance words)
              a 0 to 1 probability scale with the chance words beneath and
              lettered arrows (A, B, C…) at given positions
    cards     a row of cards or letter tiles
    tree      a probability tree drawn left to right: `branches` is a nested
              list [{ label, p, children: [...] }]; `p` is a string such as
              "3/7" (drawn as a stacked fraction), "0.4", or null for an empty
              box; `outcomes: true` lists each path's outcome at its leaf
    venn      2 or 3 sets in a universal set: `sets` names, `counts` keyed by
              region ("A", "B", "AB", "none"; with 3 sets also "C", "AC",
              "BC", "ABC"), a count of null draws an empty box; `shade` lists
              regions to shade

  Everything is drawn from the counts the bank uses for its answer.
*/

window.MMT_PROBABILITY_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const TEXT = 18;
  const INK = "#111827";
  const FONT = "'Cambria Math','Times New Roman',serif";
  const COLOURS = {
    red: "#f4b4b4", blue: "#b9d1f2", green: "#bfe3bf", yellow: "#f6e3a1",
    purple: "#d9c6ee", orange: "#f8cfa4", white: "#ffffff", black: "#6b7280", pink: "#f6c6da"
  };
  const FALLBACK = ["#b9d1f2", "#f4b4b4", "#bfe3bf", "#f6e3a1", "#d9c6ee", "#f8cfa4", "#f6c6da", "#e5e7eb"];

  function el(name, attrs = {}) {
    const n = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => { if (v !== undefined && v !== null) n.setAttribute(k, String(v)); });
    return n;
  }
  const r1 = v => Math.round(v * 10) / 10;
  function text(g, value, x, y, o = {}) {
    const n = el("text", {
      x: r1(x), y: r1(y), "font-family": FONT, "font-size": o.size || TEXT,
      "text-anchor": o.anchor || "middle", "dominant-baseline": "middle",
      "font-weight": o.weight || 400, fill: o.fill || INK
    });
    n.textContent = String(value);
    g.appendChild(n);
  }
  function finish(target, g, w, h, label) {
    const svg = el("svg", { viewBox: `0 0 ${Math.round(w)} ${Math.round(h)}`, width: "100%", role: "img", "aria-label": label });
    svg.appendChild(g);
    if (target) { target.innerHTML = ""; target.appendChild(svg); }
    return svg;
  }
  function fillFor(label, i) {
    const key = String(label).toLowerCase();
    return COLOURS[key] || FALLBACK[i % FALLBACK.length];
  }

  function spinner(target, c) {
    const labels = c.labels || ["1", "2", "3", "4"];
    const weights = c.weights || labels.map(() => 1);
    const total = weights.reduce((s, v) => s + v, 0);
    const R = 105;
    const cx = 130;
    // Narrow sectors cannot hold a word: use the initial letter and a key.
    const useKey = labels.length >= 6 && labels.some(l => String(l).length > 2);
    const shown = useKey ? labels.map(l => String(l)[0].toUpperCase()) : labels;
    const cy = 148;
    const g = el("g");
    let a = -Math.PI / 2 + (c.offset ?? 0.35);
    labels.forEach((lab, i) => {
      const sweep = weights[i] / total * Math.PI * 2;
      const a2 = a + sweep;
      const p1 = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
      const p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
      g.appendChild(el("path", {
        d: labels.length === 1 ? `M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} Z`
          : `M ${cx} ${cy} L ${r1(p1[0])} ${r1(p1[1])} A ${R} ${R} 0 ${sweep > Math.PI ? 1 : 0} 1 ${r1(p2[0])} ${r1(p2[1])} Z`,
        fill: c.colour === false ? "#fff" : fillFor(lab, i), stroke: INK, "stroke-width": 2
      }));
      const mid = a + sweep / 2;
      const lr = R * (sweep < 0.7 ? 0.74 : 0.62);
      text(g, shown[i], cx + lr * Math.cos(mid), cy + lr * Math.sin(mid), { size: String(shown[i]).length > 5 ? TEXT - 4 : TEXT - 1, weight: 700 });
      a = a2;
    });
    // Pointer: a fixed arrow ABOVE the spinner pointing in, so it never
    // covers a sector label.
    g.appendChild(el("circle", { cx, cy, r: 5, fill: INK }));
    g.appendChild(el("polygon", { points: `${cx - 11},${cy - R - 20} ${cx + 11},${cy - R - 20} ${cx},${cy - R + 4}`, fill: INK }));
    if (useKey) {
      const names = [...new Set(labels.map(String))];
      names.forEach((nm, k) => text(g, `${nm[0].toUpperCase()} = ${nm}`, cx + R + 30, cy - (names.length - 1) * 13 + k * 26, { anchor: "start", size: TEXT - 3 }));
      return finish(target, g, 360, 272, "spinner");
    }
    return finish(target, g, 260, 272, "spinner");
  }

  function bag(target, c) {
    const counts = c.counts || { red: 3, blue: 2 };
    const items = [];
    Object.entries(counts).forEach(([colour, n]) => { for (let i = 0; i < n; i++) items.push(colour); });
    // Deterministic shuffle so the printed bag looks mixed but is stable.
    let seed = items.length * 7 + 3;
    for (let i = items.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor(seed / 233280 * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(items.length * 1.8))));
    const rows = Math.ceil(items.length / cols);
    const d = 34;
    const w = cols * d + 60;
    const h = rows * d + 70;
    const g = el("g");
    g.appendChild(el("path", {
      d: `M 20 40 Q 16 ${h - 6} ${w / 2} ${h - 4} Q ${w - 16} ${h - 6} ${w - 20} 40 Z`,
      fill: "#f8fafc", stroke: INK, "stroke-width": 2.4
    }));
    g.appendChild(el("path", { d: `M 12 40 L ${w - 12} 40`, stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }));
    items.forEach((colour, i) => {
      const r = Math.floor(i / cols);
      const k = i % cols;
      const rowCount = r === rows - 1 ? items.length - r * cols : cols;
      const x = w / 2 - (rowCount * d) / 2 + k * d + d / 2;
      const y = 62 + r * d;
      g.appendChild(el("circle", { cx: r1(x), cy: r1(y), r: 14, fill: fillFor(colour, 0), stroke: INK, "stroke-width": 1.8 }));
      text(g, String(colour)[0].toUpperCase(), x, y + 1, { size: TEXT - 4, weight: 700 });
    });
    // key
    const keys = Object.keys(counts);
    let kx = 10;
    const ky = h + 22;
    keys.forEach(colour => {
      g.appendChild(el("circle", { cx: kx + 10, cy: ky, r: 9, fill: fillFor(colour, 0), stroke: INK, "stroke-width": 1.4 }));
      text(g, `${String(colour)[0].toUpperCase()} = ${colour}`, kx + 24, ky, { anchor: "start", size: TEXT - 4 });
      kx += 30 + (String(colour).length + 4) * 8;
    });
    return finish(target, g, Math.max(w, kx), h + 40, "bag of counters");
  }

  function scale(target, c) {
    const x0 = c.wordList ? 90 : 40; // room for long end words
    const W = 480;
    const y = 90;
    const g = el("g");
    g.appendChild(el("line", { x1: x0, y1: y, x2: x0 + W, y2: y, stroke: INK, "stroke-width": 2.6 }));
    const ticks = c.ticks || [0, 0.25, 0.5, 0.75, 1];
    ticks.forEach(t => {
      const x = x0 + t * W;
      g.appendChild(el("line", { x1: r1(x), y1: y - 8, x2: r1(x), y2: y + 8, stroke: INK, "stroke-width": 2 }));
      if (c.numbers !== false) text(g, t === 0 ? "0" : t === 1 ? "1" : t === 0.5 ? "½" : String(t), x, y + 24, { size: TEXT - 2 });
    });
    if (c.words !== false) {
      const wy = c.numbers === false ? y + 28 : y + 48;
      (c.wordList || [["Impossible", 0], ["Even chance", 0.5], ["Certain", 1]]).forEach(([wd, t]) => text(g, wd, x0 + t * W, wy, { size: c.wordSize || TEXT - 4, fill: "#374151" }));
    }
    (c.markers || []).forEach(m => {
      const x = x0 + m.value * W;
      g.appendChild(el("line", { x1: r1(x), y1: y - 44, x2: r1(x), y2: y - 12, stroke: "#1d4ed8", "stroke-width": 2.4 }));
      g.appendChild(el("polygon", { points: `${r1(x)},${y - 6} ${r1(x - 6)},${y - 16} ${r1(x + 6)},${y - 16}`, fill: "#1d4ed8" }));
      text(g, m.label, x, y - 56, { weight: 700, fill: "#1d4ed8" });
    });
    return finish(target, g, W + 2 * x0, y + (c.numbers === false ? 46 : 66), "probability scale");
  }

  function cards(target, c) {
    const items = c.items || ["A", "B", "C"];
    const cw = c.tiles ? 36 : 44;
    const ch = c.tiles ? 40 : 60;
    const gap = 8;
    const perRow = Math.min(items.length, 10);
    const rows = Math.ceil(items.length / perRow);
    const g = el("g");
    items.forEach((it, i) => {
      const r = Math.floor(i / perRow);
      const k = i % perRow;
      const x = 12 + k * (cw + gap);
      const y = 12 + r * (ch + gap);
      g.appendChild(el("rect", { x, y, width: cw, height: ch, rx: 5, fill: "#fff", stroke: INK, "stroke-width": 2 }));
      text(g, it, x + cw / 2, y + ch / 2, { weight: 700, size: TEXT + (c.tiles ? 0 : 2) });
    });
    return finish(target, g, 24 + perRow * (cw + gap), 24 + rows * (ch + gap), "cards");
  }

  /* A value that may be a fraction "a/b": drawn stacked. */
  function probText(g, v, x, y, o = {}) {
    if (v === null || v === undefined) {
      g.appendChild(el("rect", { x: r1(x - 20), y: r1(y - 13), width: 40, height: 26, rx: 3, fill: "#fff", stroke: INK, "stroke-width": 1.6 }));
      return;
    }
    const m = String(v).match(/^(\d+)\/(\d+)$/);
    if (!m) { text(g, v, x, y, { size: o.size || TEXT - 2, weight: 700, fill: o.fill }); return; }
    const w = Math.max(m[1].length, m[2].length) * 9 + 6;
    g.appendChild(el("rect", { x: r1(x - w / 2 - 2), y: r1(y - 20), width: w + 4, height: 40, fill: "#fff", stroke: "none" }));
    text(g, m[1], x, y - 10, { size: TEXT - 3, weight: 700, fill: o.fill });
    g.appendChild(el("line", { x1: r1(x - w / 2), y1: r1(y), x2: r1(x + w / 2), y2: r1(y), stroke: o.fill || INK, "stroke-width": 1.4 }));
    text(g, m[2], x, y + 11, { size: TEXT - 3, weight: 700, fill: o.fill });
  }

  function tree(target, c) {
    const branches = c.branches || [];
    const depth = (list) => list.length ? 1 + Math.max(...list.map(b => depth(b.children || []))) : 0;
    const D = depth(branches);
    const leaves = [];
    const walk = (list, path) => list.forEach(b => { if (b.children && b.children.length) walk(b.children, [...path, b]); else leaves.push([...path, b]); });
    walk(branches, []);
    // Stacked fractions need room; with many leaves the probabilities are
    // written inline ("1/3") instead so the tree stays within print height.
    const hasFrac = JSON.stringify(branches).includes("/");
    const stacked = hasFrac && leaves.length <= 4;
    const gap = c.leafGap || (stacked ? 56 : leaves.length > 6 ? 30 : 38);
    const colW = 150;
    const x0 = 24;
    const top = 26;
    const g = el("g");
    let leafIndex = 0;
    const PURPLE = "#1d4ed8";
    // lay out recursively: returns y of the node
    function place(list, level, fromX, fromY) {
      const ys = list.map(b => {
        let y;
        if (b.children && b.children.length) {
          const childYs = place(b.children, level + 1, x0 + (level + 1) * colW, null);
          y = (Math.min(...childYs) + Math.max(...childYs)) / 2;
          b._childYs = childYs;
        } else {
          y = top + leafIndex * gap;
          leafIndex += 1;
        }
        b._y = y;
        return y;
      });
      return ys;
    }
    place(branches, 0, x0, null);
    function draw(list, level, fromX, fromY, path) {
      list.forEach(b => {
        const nx = x0 + (level + 1) * colW;
        g.appendChild(el("line", { x1: r1(fromX + 8), y1: r1(fromY), x2: r1(nx - 22), y2: r1(b._y), stroke: INK, "stroke-width": 1.8 }));
        const mx = fromX + (nx - fromX) * (stacked ? 0.5 : 0.6) - 6;
        const off = stacked ? 18 : 12;
        const tt = stacked ? 0.5 : 0.6;
        const my = fromY + (b._y - fromY) * tt - (b._y < fromY ? off : b._y > fromY ? -off : off);
        const flat = Math.abs(b._y - fromY) < 1;
        if (stacked || b.p === null || b.p === undefined) probText(g, b.p, mx, flat && !stacked ? fromY : my, { fill: PURPLE });
        else {
          // a flat (middle) branch carries its label ON the line, over a white patch
          const yy = flat ? fromY : my;
          if (flat) g.appendChild(el("rect", { x: r1(mx - String(b.p).length * 4.5 - 3), y: r1(yy - 9), width: String(b.p).length * 9 + 6, height: 18, fill: "#fff" }));
          text(g, b.p, mx, yy, { size: TEXT - 3, weight: 700, fill: PURPLE });
        }
        text(g, b.label, nx - 8, b._y, { weight: 700, size: TEXT - 1 });
        const p2 = [...path, b];
        if (b.children && b.children.length) draw(b.children, level + 1, nx + 10, b._y, p2);
        else if (c.outcomes) text(g, p2.map(n => n.short || n.label).join(""), x0 + (D + 1) * colW - 40, b._y, { size: TEXT - 2, anchor: "start", fill: "#374151" });
      });
    }
    const rootY = (Math.min(...branches.map(b => b._y)) + Math.max(...branches.map(b => b._y))) / 2;
    g.appendChild(el("circle", { cx: x0, cy: r1(rootY), r: 3.5, fill: INK }));
    draw(branches, 0, x0, rootY, []);
    if (Array.isArray(c.stageNames)) c.stageNames.forEach((nm, i) => text(g, nm, x0 + (i + 1) * colW - 8, 8, { size: TEXT - 3, fill: "#475569", weight: 700 }));
    const W = x0 + (D + 1) * colW + (c.outcomes ? 60 : 10);
    const H = top + (leaves.length - 1) * gap + 26;
    return finish(target, g, W, H, "tree diagram");
  }

  function venn(target, c) {
    const sets = c.sets || ["A", "B"];
    const three = sets.length === 3;
    const counts = c.counts || {};
    const shade = new Set(c.shade || []);
    const W = three ? 400 : 420;
    const H = three ? 300 : 230;
    const g = el("g");
    const R = three ? 78 : 84;
    const centres = three
      ? [[W / 2 - 50, 118], [W / 2 + 50, 118], [W / 2, 196]]
      : [[W / 2 - 55, H / 2 + 8], [W / 2 + 55, H / 2 + 8]];
    const clipBase = `mmtvenn${Math.floor(Math.random() * 1e9)}`;
    const defs = el("defs");
    centres.forEach((cc, i) => {
      const cp = el("clipPath", { id: `${clipBase}${i}` });
      cp.appendChild(el("circle", { cx: cc[0], cy: cc[1], r: R }));
      defs.appendChild(cp);
    });
    g.appendChild(defs);
    g.appendChild(el("rect", { x: 10, y: 20, width: W - 20, height: H - 30, fill: "#fff", stroke: INK, "stroke-width": 2 }));
    text(g, c.universe || "ξ", 26, 36, { weight: 700 });
    const keys = three ? ["A", "B", "C", "AB", "AC", "BC", "ABC"] : ["A", "B", "AB"];
    // Shading: one mask per region — white inside the region's sets (nested
    // clips give the intersection), black over every other set.
    keys.concat(["none"]).filter(k => shade.has(k)).forEach((k, n) => {
      const mask = el("mask", { id: `${clipBase}m${n}` });
      if (k === "none") {
        mask.appendChild(el("rect", { x: 10, y: 20, width: W - 20, height: H - 30, fill: "white" }));
        centres.forEach(cc => mask.appendChild(el("circle", { cx: cc[0], cy: cc[1], r: R, fill: "black" })));
      } else {
        const inside = k.split("").map(ch => "ABC".indexOf(ch));
        const outside = centres.map((_, i) => i).filter(i => !inside.includes(i));
        let node = el("rect", { x: 0, y: 0, width: W, height: H, fill: "white" });
        inside.forEach(i => { const w = el("g", { "clip-path": `url(#${clipBase}${i})` }); w.appendChild(node); node = w; });
        mask.appendChild(node);
        outside.forEach(i => mask.appendChild(el("circle", { cx: centres[i][0], cy: centres[i][1], r: R, fill: "black" })));
      }
      defs.appendChild(mask);
      g.appendChild(el("rect", { x: 10, y: 20, width: W - 20, height: H - 30, fill: "#93c5fd", mask: `url(#${clipBase}m${n})` }));
    });
    centres.forEach((cc, i) => g.appendChild(el("circle", { cx: cc[0], cy: cc[1], r: R, fill: "none", stroke: INK, "stroke-width": 2.2 })));
    g.appendChild(el("rect", { x: 10, y: 20, width: W - 20, height: H - 30, fill: "none", stroke: INK, "stroke-width": 2 }));
    // set names
    if (three) {
      text(g, sets[0], centres[0][0] - R + 6, centres[0][1] - R + 10, { weight: 700 });
      text(g, sets[1], centres[1][0] + R - 6, centres[1][1] - R + 10, { weight: 700 });
      text(g, sets[2], centres[2][0] + R + 10, centres[2][1] + R - 12, { weight: 700, anchor: "start" });
    } else {
      text(g, sets[0], centres[0][0] - R + 8, centres[0][1] - R + 6, { weight: 700 });
      text(g, sets[1], centres[1][0] + R - 8, centres[1][1] - R + 6, { weight: 700 });
    }
    const pos = three
      ? { A: [W / 2 - 88, 100], B: [W / 2 + 88, 100], C: [W / 2, 232], AB: [W / 2, 88], AC: [W / 2 - 50, 176], BC: [W / 2 + 50, 176], ABC: [W / 2, 145] }
      : { A: [W / 2 - 92, H / 2 + 8], B: [W / 2 + 92, H / 2 + 8], AB: [W / 2, H / 2 + 8] };
    const show = k => {
      if (!(k in counts)) return;
      const [x, y] = k === "none" ? (three ? [46, H - 30] : [W - 46, H - 26]) : pos[k];
      probText(g, counts[k], x, y, { size: TEXT });
    };
    [...keys, "none"].forEach(show);
    return finish(target, g, W, H, "Venn diagram");
  }

  function render(target, config = {}) {
    if (config.diagramType === "tree") return tree(target, config);
    if (config.diagramType === "venn") return venn(target, config);
    const t = config.diagramType || "spinner";
    if (t === "spinner") return spinner(target, config);
    if (t === "bag") return bag(target, config);
    if (t === "scale") return scale(target, config);
    if (t === "cards") return cards(target, config);
    if (target) target.innerHTML = `<div class="diagram-placeholder">Unknown probability diagram</div>`;
    return null;
  }

  return { render };
})();
