/*
  MMT Exam Builder — Algebra Engine
  ---------------------------------
  Save as:

  engines/algebra/algebra-engine.js

  Browser global:
    window.MMT_ALGEBRA_ENGINE.render(node, config)
*/

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) el.setAttribute(key, String(value));
    });
    return el;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function addText(svg, text, x, y, attrs = {}) {
    const el = svgEl("text", {
      x,
      y,
      "font-family": "Cambria Math, STIX Two Math, Times New Roman, serif",
      "font-size": attrs.size || 20,
      "font-weight": attrs.weight || 700,
      "text-anchor": attrs.anchor || "middle",
      "dominant-baseline": attrs.baseline || "middle",
      fill: attrs.fill || "#111827"
    });
    el.textContent = text;
    svg.appendChild(el);
    return el;
  }

  function addLine(svg, x1, y1, x2, y2, attrs = {}) {
    const el = svgEl("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: attrs.stroke || "#111827",
      "stroke-width": attrs.width || 3,
      "stroke-linecap": attrs.cap || "round",
      "stroke-dasharray": attrs.dash || ""
    });
    svg.appendChild(el);
    return el;
  }

  function addRect(svg, x, y, width, height, attrs = {}) {
    const el = svgEl("rect", {
      x,
      y,
      width,
      height,
      fill: attrs.fill || "#eff6ff",
      stroke: attrs.stroke || "#111827",
      "stroke-width": attrs.width || 3,
      rx: attrs.rx || 0
    });
    svg.appendChild(el);
    return el;
  }

  function renderBinomialAreaModel(node, config = {}) {
    clear(node);

    const variable = String(config.variable || "x");
    const a = Number(config.a || 3);
    const b = Number(config.b || 4);
    const showProducts = Boolean(config.showProducts);

    const width = 720;
    const height = 420;
    const svg = svgEl("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": `Area model for (${variable} plus ${a})(${variable} plus ${b})`
    });

    addRect(svg, 10, 10, width - 20, height - 20, {
      fill: "#f8fafc",
      stroke: "none",
      rx: 18
    });

    const x0 = 150;
    const y0 = 86;
    const wX = 280;
    const wA = 150;
    const hX = 185;
    const hB = 105;

    addRect(svg, x0, y0, wX + wA, hX + hB, { fill: "#eaf2ff", width: 3 });
    addLine(svg, x0 + wX, y0, x0 + wX, y0 + hX + hB, { width: 3 });
    addLine(svg, x0, y0 + hX, x0 + wX + wA, y0 + hX, { width: 3 });

    // Subtle alternating fill to make the four parts visible without looking busy.
    addRect(svg, x0 + 2, y0 + 2, wX - 4, hX - 4, { fill: "#dbeafe", stroke: "none" });
    addRect(svg, x0 + wX + 2, y0 + 2, wA - 4, hX - 4, { fill: "#eff6ff", stroke: "none" });
    addRect(svg, x0 + 2, y0 + hX + 2, wX - 4, hB - 4, { fill: "#eff6ff", stroke: "none" });
    addRect(svg, x0 + wX + 2, y0 + hX + 2, wA - 4, hB - 4, { fill: "#dbeafe", stroke: "none" });

    // Redraw main lines after fills.
    addRect(svg, x0, y0, wX + wA, hX + hB, { fill: "none", width: 3 });
    addLine(svg, x0 + wX, y0, x0 + wX, y0 + hX + hB, { width: 3 });
    addLine(svg, x0, y0 + hX, x0 + wX + wA, y0 + hX, { width: 3 });

    addText(svg, variable, x0 + wX / 2, y0 - 28, { size: 24 });
    addText(svg, String(a), x0 + wX + wA / 2, y0 - 28, { size: 24 });
    addText(svg, variable, x0 - 35, y0 + hX / 2, { size: 24 });
    addText(svg, String(b), x0 - 35, y0 + hX + hB / 2, { size: 24 });

    if (showProducts) {
      addText(svg, `${variable}²`, x0 + wX / 2, y0 + hX / 2, { size: 26 });
      addText(svg, `${a}${variable}`, x0 + wX + wA / 2, y0 + hX / 2, { size: 22 });
      addText(svg, `${b}${variable}`, x0 + wX / 2, y0 + hX + hB / 2, { size: 22 });
      addText(svg, String(a * b), x0 + wX + wA / 2, y0 + hX + hB / 2, { size: 22 });
    } else {
      [
        [x0 + wX / 2, y0 + hX / 2, 116, 44],
        [x0 + wX + wA / 2, y0 + hX / 2, 92, 44],
        [x0 + wX / 2, y0 + hX + hB / 2, 116, 44],
        [x0 + wX + wA / 2, y0 + hX + hB / 2, 92, 44]
      ].forEach(([cx, cy, bw, bh]) => {
        addRect(svg, cx - bw / 2, cy - bh / 2, bw, bh, {
          fill: "#ffffff",
          stroke: "#64748b",
          width: 2,
          rx: 8
        });
      });
    }

    node.appendChild(svg);
  }

  function makeSvg(node, vbW, vbH, label) {
    clear(node);
    const svg = svgEl("svg", { viewBox: `0 0 ${vbW} ${vbH}`, role: "img", "aria-label": label || "algebra diagram" });
    addRect(svg, 6, 6, vbW - 12, vbH - 12, { fill: "#f8fafc", stroke: "none", rx: 14 });
    return svg;
  }

  // Algebra tiles: model an expression with x² / x / unit tiles.
  function renderAlgebraTiles(node, config = {}) {
    const variable = String(config.variable || "x");
    const x2 = Number(config.x2 || 0);
    const x = Number(config.x || 0);
    const ones = Number(config.ones || 0);

    const svg = makeSvg(node, 760, 240, "algebra tiles");
    const POS = "#dbeafe", NEG = "#fee2e2", STROKE = "#111827";
    let cx = 40;
    const cy = 70;

    function place(count, w, h, label) {
      const neg = count < 0;
      for (let i = 0; i < Math.abs(count); i++) {
        addRect(svg, cx, cy + (100 - h), w, h, { fill: neg ? NEG : POS, stroke: STROKE, width: 2, rx: 4 });
        addText(svg, (neg ? "−" : "") + label, cx + w / 2, cy + (100 - h) + h / 2, { size: h > 40 ? 22 : 16 });
        cx += w + 12;
      }
      if (count !== 0) cx += 16;
    }

    place(x2, 86, 86, `${variable}²`);
    place(x, 40, 86, variable);
    place(ones, 34, 34, "1");

    if (cx < 60) addText(svg, "0", 380, 120, { size: 24 });
    node.appendChild(svg);
  }

  // Single-bracket expansion area model: m(p + q + ...) as one row of parts.
  function renderExpandAreaModel(node, config = {}) {
    const multiplier = String(config.multiplier ?? "a");
    const parts = Array.isArray(config.parts) && config.parts.length ? config.parts : ["x", "3"];
    const products = Array.isArray(config.products) ? config.products : [];
    const showProducts = Boolean(config.showProducts);

    const svg = makeSvg(node, 760, 260, "expansion area model");
    const x0 = 120, y0 = 90, h = 110;
    const totalW = 540;
    const widths = parts.map(() => totalW / parts.length);

    let x = x0;
    parts.forEach((p, i) => {
      addRect(svg, x, y0, widths[i], h, { fill: i % 2 ? "#eff6ff" : "#dbeafe", stroke: "#111827", width: 3 });
      addText(svg, String(p), x + widths[i] / 2, y0 - 26, { size: 24 });
      if (showProducts && products[i] != null) {
        addText(svg, String(products[i]), x + widths[i] / 2, y0 + h / 2, { size: 24 });
      }
      x += widths[i];
    });
    // Outer rectangle + multiplier label on the left.
    addRect(svg, x0, y0, totalW, h, { fill: "none", stroke: "#111827", width: 3 });
    addText(svg, multiplier, x0 - 40, y0 + h / 2, { size: 26 });
    addText(svg, "×", x0 - 40, y0 - 26, { size: 20, fill: "#64748b" });
    node.appendChild(svg);
  }

  // A figure (rectangle or triangle) with algebraic side labels.
  function renderPerimeterFigure(node, config = {}) {
    const shape = config.shape || "rectangle";
    const svg = makeSvg(node, 620, 320, "figure with algebraic sides");

    if (shape === "triangle") {
      const a = config.sides || ["x", "x + 2", "5"];
      const pts = [[310, 50], [110, 250], [510, 250]];
      svg.appendChild(svgEl("polygon", { points: pts.map(p => p.join(",")).join(" "), fill: "#dbeafe", stroke: "#111827", "stroke-width": 3 }));
      addText(svg, String(a[0]), 185, 135, { size: 22 });
      addText(svg, String(a[1]), 435, 135, { size: 22 });
      addText(svg, String(a[2]), 310, 280, { size: 22 });
      node.appendChild(svg);
      return;
    }

    if (shape === "l-shape") {
      const lbl = config.labels || {};
      const pts = [[120, 60], [500, 60], [500, 170], [300, 170], [300, 260], [120, 260]];
      svg.appendChild(svgEl("polygon", { points: pts.map(p => p.join(",")).join(" "), fill: "#dbeafe", stroke: "#111827", "stroke-width": 3 }));
      addText(svg, String(lbl.top || "x"), 310, 42, { size: 20 });
      addText(svg, String(lbl.left || "y"), 100, 160, { size: 20, anchor: "end" });
      addText(svg, String(lbl.bottom || "x + 2"), 210, 282, { size: 20 });
      node.appendChild(svg);
      return;
    }

    // rectangle
    const w = String(config.width || "x");
    const l = String(config.length || "x + 3");
    addRect(svg, 130, 90, 360, 150, { fill: "#dbeafe", stroke: "#111827", width: 3 });
    addText(svg, l, 310, 66, { size: 24 });
    addText(svg, w, 96, 165, { size: 24, anchor: "end" });
    node.appendChild(svg);
  }

  // Function machine: input → [op] → [op] → output.
  function renderFunctionMachine(node, config = {}) {
    const input = String(config.input ?? "x");
    const output = String(config.output ?? "");
    const ops = Array.isArray(config.operations) ? config.operations : [{ text: "× 3" }, { text: "+ 2" }];

    const boxes = ops.length;
    const svg = makeSvg(node, 760, 200, "function machine");
    const y = 80, h = 64, boxW = 120, gap = 36;
    let x = 50;

    function chip(label, fill) {
      addRect(svg, x, y, boxW, h, { fill, stroke: "#111827", width: 3, rx: 12 });
      addText(svg, label, x + boxW / 2, y + h / 2, { size: 24 });
      x += boxW;
    }
    function arrow() {
      addLine(svg, x + 6, y + h / 2, x + gap - 6, y + h / 2, { width: 3 });
      svg.appendChild(svgEl("path", { d: `M ${x + gap - 6} ${y + h / 2} l -10 -6 l 0 12 z`, fill: "#111827" }));
      x += gap;
    }

    chip(input, "#dcfce7");
    for (let i = 0; i < boxes; i++) { arrow(); chip(String(ops[i].text || ops[i]), "#e0e7ff"); }
    arrow();
    chip(output || "?", "#fef9c3");
    node.appendChild(svg);
  }

  /*
    A general area model (Stage 5 factorising and expanding): column and row
    labels along the top and left, a product in each cell. Any label or cell
    given as null draws an empty box. Widths are equal — the model shows
    STRUCTURE, not size.
      cols: ["2x", "3"], rows: ["x", "−1"], cells: [["2x²", "3x"], ["−2x", "−3"]]
  */
  function renderAreaGrid(node, config = {}) {
    clear(node);
    const cols = config.cols || ["x", "a"];
    const rows = config.rows || ["x", "b"];
    const cells = config.cells || [];
    const cw = 140; const ch = 80;
    const x0 = 90; const y0 = 60;
    const W = x0 + cols.length * cw + 20;
    const H = y0 + rows.length * ch + 20;
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "area model" });
    const box = (cx, cy, w = 70, h = 36) => addRect(svg, cx - w / 2, cy - h / 2, w, h, { fill: "#fff", width: 2, rx: 4 });
    rows.forEach((r, i) => cols.forEach((c, j) => {
      addRect(svg, x0 + j * cw, y0 + i * ch, cw, ch, { fill: (i + j) % 2 ? "#eff6ff" : "#dbeafe", width: 3 });
      const v = cells[i] ? cells[i][j] : null;
      const cx = x0 + j * cw + cw / 2; const cy = y0 + i * ch + ch / 2;
      if (v === null || v === undefined) box(cx, cy); else addText(svg, v, cx, cy, { size: 24 });
    }));
    cols.forEach((c, j) => { const cx = x0 + j * cw + cw / 2; if (c === null) box(cx, y0 - 28, 64, 34); else addText(svg, c, cx, y0 - 28, { size: 24 }); });
    rows.forEach((r, i) => { const cy = y0 + i * ch + ch / 2; if (r === null) box(x0 - 42, cy, 64, 34); else addText(svg, r, x0 - 42, cy, { size: 24 }); });
    node.appendChild(svg);
  }

  function render(node, config = {}) {
    const type = config.diagramType;
    if (type === "binomial-area-model") return renderBinomialAreaModel(node, config);
    if (type === "area-grid") return renderAreaGrid(node, config);
    if (type === "algebra-tiles") return renderAlgebraTiles(node, config);
    if (type === "expand-area-model") return renderExpandAreaModel(node, config);
    if (type === "perimeter-figure") return renderPerimeterFigure(node, config);
    if (type === "function-machine") return renderFunctionMachine(node, config);

    clear(node);
    node.innerHTML = `<div class="diagram-placeholder">Algebra diagram unavailable</div>`;
  }

  window.MMT_ALGEBRA_ENGINE = { render };
})();
