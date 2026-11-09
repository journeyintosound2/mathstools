/*
  Exam Builder — Equations Diagram Engine
  ---------------------------------------
  Save as:

  engines/equations/equation-engine.js

  Exposes:
  window.MMT_EQUATION_ENGINE.render(target, config)

  Diagram types:
  - balance-scale          A pan balance modelling ax + b = c (and similar).
  - inequality-number-line A solution to an inequality (open/closed circle + ray).
  - bar-model              A tape/bar model for forming an equation from a context.
*/

window.MMT_EQUATION_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) node.setAttribute(k, String(v));
    });
    return node;
  }

  function text(svg, value, x, y, attrs = {}) {
    const t = el("text", {
      x, y,
      "font-family": attrs.family || "Cambria Math, STIX Two Math, Times New Roman, serif",
      "font-size": attrs.size || 20,
      "font-weight": attrs.weight || 700,
      "text-anchor": attrs.anchor || "middle",
      "dominant-baseline": attrs.baseline || "middle",
      fill: attrs.fill || "#111827"
    });
    t.textContent = value;
    svg.appendChild(t);
    return t;
  }

  function fmt(n) {
    return n < 0 ? `−${Math.abs(n)}` : String(n);
  }

  function makeSvg(vb, label) {
    const svg = el("svg", { viewBox: vb, width: "100%", height: "100%", role: "img", "aria-label": label || "equation diagram" });
    return svg;
  }

  // Draw the contents of one pan: x-boxes then unit circles.
  function drawPanContents(svg, cx, topY, xCount, oneCount) {
    const items = [];
    for (let i = 0; i < xCount; i++) items.push("x");
    for (let i = 0; i < oneCount; i++) items.push("1");
    const perRow = 5;
    const xBoxW = 34, xBoxH = 30, unitR = 12, gap = 8;
    // Lay items left to right, wrap rows upward.
    const rows = [];
    for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

    rows.forEach((row, r) => {
      const rowW = row.reduce((w, it) => w + (it === "x" ? xBoxW : unitR * 2) + gap, -gap);
      let x = cx - rowW / 2;
      const y = topY - r * (xBoxH + 8);
      row.forEach(it => {
        if (it === "x") {
          svg.appendChild(el("rect", { x, y: y - xBoxH, width: xBoxW, height: xBoxH, rx: 4, fill: "#dbeafe", stroke: "#111827", "stroke-width": 2 }));
          text(svg, "x", x + xBoxW / 2, y - xBoxH / 2, { size: 18 });
          x += xBoxW + gap;
        } else {
          svg.appendChild(el("circle", { cx: x + unitR, cy: y - xBoxH / 2, r: unitR, fill: "#fef9c3", stroke: "#111827", "stroke-width": 2 }));
          x += unitR * 2 + gap;
        }
      });
    });
  }

  function renderBalanceScale(config = {}) {
    const leftX = Math.max(0, Number(config.leftX || 0));
    const leftConst = Math.max(0, Number(config.leftConst || 0));
    const rightX = Math.max(0, Number(config.rightX || 0));
    const rightConst = Math.max(0, Number(config.rightConst || 0));

    const svg = makeSvg("0 0 640 360", "balance scale");
    const cxL = 170, cxR = 470, beamY = 80, panY = 250;

    // Stand.
    svg.appendChild(el("polygon", { points: "320,90 300,300 340,300", fill: "#cbd5e1", stroke: "#111827", "stroke-width": 2 }));
    svg.appendChild(el("rect", { x: 250, y: 300, width: 140, height: 16, rx: 4, fill: "#94a3b8", stroke: "#111827", "stroke-width": 2 }));
    // Beam.
    svg.appendChild(el("line", { x1: cxL, y1: beamY, x2: cxR, y2: beamY, stroke: "#111827", "stroke-width": 6, "stroke-linecap": "round" }));
    svg.appendChild(el("circle", { cx: 320, cy: beamY, r: 8, fill: "#111827" }));
    // Hangers + pans.
    [cxL, cxR].forEach(cx => {
      svg.appendChild(el("line", { x1: cx, y1: beamY, x2: cx, y2: panY - 8, stroke: "#111827", "stroke-width": 2 }));
      svg.appendChild(el("path", { d: `M ${cx - 80} ${panY} q 80 50 160 0`, fill: "none", stroke: "#111827", "stroke-width": 4 }));
    });

    drawPanContents(svg, cxL, panY - 6, leftX, leftConst);
    drawPanContents(svg, cxR, panY - 6, rightX, rightConst);
    return svg;
  }

  function renderInequalityNumberLine(config = {}) {
    const min = Number.isFinite(config.min) ? config.min : -10;
    const max = Number.isFinite(config.max) ? config.max : 10;
    const step = Number.isFinite(config.step) ? config.step : 1;
    const value = Number.isFinite(config.value) ? config.value : 0;
    const dir = config.direction || ">"; // > < >= <=
    const closed = dir === ">=" || dir === "<=";
    const goRight = dir === ">" || dir === ">=";

    const svg = makeSvg("0 0 720 150", "inequality on a number line");
    const left = 50, right = 670, y = 70;
    const x = v => left + ((v - min) / (max - min)) * (right - left);

    svg.appendChild(el("line", { x1: left, y1: y, x2: right, y2: y, stroke: "#111827", "stroke-width": 4, "stroke-linecap": "round" }));
    // Arrow tips on the axis.
    svg.appendChild(el("path", { d: `M ${right} ${y} l -12 -7 l 0 14 z`, fill: "#111827" }));
    svg.appendChild(el("path", { d: `M ${left} ${y} l 12 -7 l 0 14 z`, fill: "#111827" }));

    for (let v = min; v <= max + 1e-9; v += step) {
      const xi = x(v);
      svg.appendChild(el("line", { x1: xi, y1: y - 9, x2: xi, y2: y + 9, stroke: "#111827", "stroke-width": 2 }));
      text(svg, fmt(v), xi, y + 30, { size: 16, family: "Arial, sans-serif" });
    }

    // A blank axis for the STUDENT to mark. "Solve and show the solution on a
    // number line" previously printed no line at all in templates that hide
    // answer spaces, which made the question impossible to answer as printed.
    if (config.blank === true) return svg;

    // Solution ray.
    const xv = x(value);
    const xEnd = goRight ? right - 4 : left + 4;
    svg.appendChild(el("line", { x1: xv, y1: y, x2: xEnd, y2: y, stroke: "#2563eb", "stroke-width": 6, "stroke-linecap": "round" }));
    svg.appendChild(el("path", {
      d: goRight ? `M ${xEnd} ${y} l -14 -8 l 0 16 z` : `M ${xEnd} ${y} l 14 -8 l 0 16 z`,
      fill: "#2563eb"
    }));
    // Endpoint circle.
    svg.appendChild(el("circle", {
      cx: xv, cy: y, r: 9,
      fill: closed ? "#2563eb" : "#ffffff",
      stroke: "#2563eb", "stroke-width": 3
    }));
    return svg;
  }

  function renderBarModel(config = {}) {
    const total = config.total;
    const totalLabel = config.totalLabel != null ? String(config.totalLabel) : (total != null ? String(total) : "?");
    const parts = Array.isArray(config.parts) && config.parts.length
      ? config.parts
      : [{ label: "x" }, { label: "x" }, { label: "5" }];

    const svg = makeSvg("0 0 640 200", "bar model");
    const x0 = 40, y0 = 70, fullW = 560, h = 60;
    const weights = parts.map(p => Number(p.weight) || 1);
    const wsum = weights.reduce((a, b) => a + b, 0);

    let x = x0;
    parts.forEach((p, i) => {
      const w = fullW * weights[i] / wsum;
      svg.appendChild(el("rect", { x, y: y0, width: w, height: h, fill: p.fill || (p.label && /^[a-z]/i.test(String(p.label)) ? "#dbeafe" : "#fef9c3"), stroke: "#111827", "stroke-width": 2 }));
      text(svg, String(p.label), x + w / 2, y0 + h / 2, { size: 20 });
      x += w;
    });

    // Total brace above.
    svg.appendChild(el("path", { d: `M ${x0} ${y0 - 12} q 0 -14 14 -14 L ${x0 + fullW - 14} ${y0 - 26} q 14 0 14 14`, fill: "none", stroke: "#111827", "stroke-width": 2 }));
    text(svg, totalLabel, x0 + fullW / 2, y0 - 40, { size: 20 });
    return svg;
  }

  function render(target, config = {}) {
    if (!target) return;
    target.innerHTML = "";
    const type = config.diagramType || "balance-scale";
    let node;

    if (type === "inequality-number-line") node = renderInequalityNumberLine(config);
    else if (type === "bar-model") node = renderBarModel(config);
    else if (type === "balance-scale") node = renderBalanceScale(config);
    else { target.innerHTML = "<div class='diagram-placeholder'>Unknown equation diagram</div>"; return; }

    target.appendChild(node);
  }

  return { render };
})();
