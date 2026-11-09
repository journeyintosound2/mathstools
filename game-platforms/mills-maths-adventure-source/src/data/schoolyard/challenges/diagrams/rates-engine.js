// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/rates/rates-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  CHHS Exam Builder — Ratios and Rates Diagram Engine
  Save as: engines/rates/rates-engine.js
*/

window.MMT_RATES_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function fmt(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return Number(n.toFixed(1)).toString();
  }

  function makeSvg(width = 720, height = 430) {
    const svg = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: "100%",
      height: "100%",
      role: "img",
      "aria-label": "distance-time graph",
      class: "rates-svg"
    });

    const style = el("style");
    style.textContent = `
      .rates-svg{overflow:visible}
      .rates-axis{stroke:#111827;stroke-width:2.6;stroke-linecap:round}
      .rates-grid-major{stroke:rgba(17,24,39,.28);stroke-width:1.4}
      .rates-grid-minor{stroke:rgba(17,24,39,.10);stroke-width:1}
      .rates-line{stroke:#9f174a;stroke-width:4;fill:none;stroke-linejoin:round;stroke-linecap:round}
      .rates-point{fill:#9f174a}
      .rates-label{font-family:"Cambria Math","Times New Roman",serif;font-size:17px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .rates-axis-title{font-family:"Cambria Math","Times New Roman",serif;font-size:18px;font-weight:800;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .rates-border{stroke:#111827;stroke-width:2;fill:#fff}
    `;
    svg.appendChild(style);
    return svg;
  }

  function renderDistanceTime(target, config = {}) {
    const width = 720;
    const height = 430;
    const svg = makeSvg(width, height);

    const margin = { left: 76, right: 34, top: 34, bottom: 72 };
    const plot = {
      x: margin.left,
      y: margin.top,
      w: width - margin.left - margin.right,
      h: height - margin.top - margin.bottom
    };

    const xMax = Number.isFinite(Number(config.xMax)) ? Number(config.xMax) : 60;
    const yMax = Number.isFinite(Number(config.yMax)) ? Number(config.yMax) : 400;
    const xStep = Number.isFinite(Number(config.xStep)) ? Number(config.xStep) : 10;
    const yStep = Number.isFinite(Number(config.yStep)) ? Number(config.yStep) : 100;
    const xMinorStep = Number(config.xMinorStep || xStep / 2);
    const yMinorStep = Number(config.yMinorStep || yStep / 2);

    const xScale = value => plot.x + (value / xMax) * plot.w;
    const yScale = value => plot.y + plot.h - (value / yMax) * plot.h;

    svg.appendChild(el("rect", { x: plot.x, y: plot.y, width: plot.w, height: plot.h, class: "rates-border" }));

    drawGrid(svg, { plot, xMax, yMax, xStep, yStep, xMinorStep, yMinorStep, xScale, yScale });
    drawAxes(svg, { plot, xMax, yMax, xStep, yStep, xScale, yScale, config });

    const mode = config.mode || "completed";
    const points = Array.isArray(config.points) ? config.points : [];

    if (mode !== "blank" && points.length >= 2) {
      const path = points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(Number(point.x))} ${yScale(Number(point.y))}`)
        .join(" ");

      svg.appendChild(el("path", { d: path, class: "rates-line" }));

      points.forEach(point => {
        svg.appendChild(el("circle", {
          cx: xScale(Number(point.x)),
          cy: yScale(Number(point.y)),
          r: 4,
          class: "rates-point"
        }));
      });
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function drawGrid(svg, { plot, xMax, yMax, xStep, yStep, xMinorStep, yMinorStep, xScale, yScale }) {
    if (xMinorStep > 0) {
      for (let x = 0; x <= xMax + 1e-9; x += xMinorStep) {
        const isMajor = Math.abs(x / xStep - Math.round(x / xStep)) < 1e-9;
        svg.appendChild(el("line", {
          x1: xScale(x),
          y1: plot.y,
          x2: xScale(x),
          y2: plot.y + plot.h,
          class: isMajor ? "rates-grid-major" : "rates-grid-minor"
        }));
      }
    }

    if (yMinorStep > 0) {
      for (let y = 0; y <= yMax + 1e-9; y += yMinorStep) {
        const isMajor = Math.abs(y / yStep - Math.round(y / yStep)) < 1e-9;
        svg.appendChild(el("line", {
          x1: plot.x,
          y1: yScale(y),
          x2: plot.x + plot.w,
          y2: yScale(y),
          class: isMajor ? "rates-grid-major" : "rates-grid-minor"
        }));
      }
    }
  }

  function drawAxes(svg, { plot, xMax, yMax, xStep, yStep, xScale, yScale, config }) {
    svg.appendChild(el("line", { x1: plot.x, y1: plot.y + plot.h, x2: plot.x + plot.w, y2: plot.y + plot.h, class: "rates-axis" }));
    svg.appendChild(el("line", { x1: plot.x, y1: plot.y, x2: plot.x, y2: plot.y + plot.h, class: "rates-axis" }));

    for (let x = 0; x <= xMax + 1e-9; x += xStep) {
      const t = el("text", { x: xScale(x), y: plot.y + plot.h + 24, class: "rates-label" });
      t.textContent = fmt(x);
      svg.appendChild(t);
    }

    for (let y = 0; y <= yMax + 1e-9; y += yStep) {
      const t = el("text", { x: plot.x - 28, y: yScale(y), class: "rates-label" });
      t.textContent = fmt(y);
      svg.appendChild(t);
    }

    const xTitle = el("text", { x: plot.x + plot.w / 2, y: plot.y + plot.h + 54, class: "rates-axis-title" });
    xTitle.textContent = config.xLabel || "Time";
    svg.appendChild(xTitle);

    const yTitle = el("text", {
      x: 20,
      y: plot.y + plot.h / 2,
      class: "rates-axis-title",
      transform: `rotate(-90 20 ${plot.y + plot.h / 2})`
    });
    yTitle.textContent = config.yLabel || "Distance";
    svg.appendChild(yTitle);
  }

  function text(svg, value, x, y, cls = "rates-label", extra = {}) {
    const t = el("text", { x, y, class: cls, ...extra });
    t.textContent = value;
    svg.appendChild(t);
    return t;
  }

  // Tape/bar model for ratios: one bar split into coloured parts.
  function renderRatioBar(target, config = {}) {
    const parts = Array.isArray(config.parts) && config.parts.length
      ? config.parts
      : [{ label: "A", units: 2 }, { label: "B", units: 3 }];
    const totalUnits = parts.reduce((s, p) => s + (Number(p.units) || 1), 0);
    const palette = ["#bfdbfe", "#fde68a", "#bbf7d0", "#fbcfe8"];

    const svg = makeSvg(640, 200);
    const x0 = 40, y0 = 70, fullW = 560, h = 60;
    const unitW = fullW / totalUnits;

    let x = x0;
    parts.forEach((p, idx) => {
      const u = Number(p.units) || 1;
      const w = u * unitW;
      // draw each unit cell for a "tape" look
      for (let i = 0; i < u; i++) {
        svg.appendChild(el("rect", { x: x + i * unitW, y: y0, width: unitW, height: h, fill: palette[idx % palette.length], stroke: "#111827", "stroke-width": 1.4 }));
      }
      svg.appendChild(el("rect", { x, y: y0, width: w, height: h, fill: "none", stroke: "#111827", "stroke-width": 2.4 }));
      text(svg, p.label, x + w / 2, y0 - 16, "rates-label");
      if (config.showUnitValues && config.unitValue != null) {
        text(svg, `${p.label === parts[0].label ? "" : ""}`, x + w / 2, y0 + h + 20, "rates-label");
      }
      x += w;
    });

    if (config.totalLabel != null) {
      svg.appendChild(el("path", { d: `M ${x0} ${y0 + h + 14} L ${x0} ${y0 + h + 22} L ${x0 + fullW} ${y0 + h + 22} L ${x0 + fullW} ${y0 + h + 14}`, fill: "none", stroke: "#111827", "stroke-width": 1.6 }));
      text(svg, String(config.totalLabel), x0 + fullW / 2, y0 + h + 38, "rates-label");
    }
    target.innerHTML = "";
    target.appendChild(svg);
  }

  // Double number line for rates / proportion.
  function renderDoubleNumberLine(target, config = {}) {
    const topLabel = config.topLabel ?? "quantity";
    const bottomLabel = config.bottomLabel ?? "cost ($)";
    const topMax = Number.isFinite(Number(config.topMax)) ? Number(config.topMax) : 5;
    const bottomMax = Number.isFinite(Number(config.bottomMax)) ? Number(config.bottomMax) : 10;
    const ticks = Math.max(2, Math.min(10, Number(config.ticks) || 5));

    const svg = makeSvg(640, 210);
    const left = 90, right = 580, yTop = 80, yBot = 150;
    const x = f => left + f * (right - left);

    svg.appendChild(el("line", { x1: left, y1: yTop, x2: right, y2: yTop, class: "rates-axis" }));
    svg.appendChild(el("line", { x1: left, y1: yBot, x2: right, y2: yBot, class: "rates-axis" }));

    for (let i = 0; i <= ticks; i++) {
      const f = i / ticks;
      svg.appendChild(el("line", { x1: x(f), y1: yTop - 8, x2: x(f), y2: yTop + 8, class: "rates-grid-major" }));
      svg.appendChild(el("line", { x1: x(f), y1: yBot - 8, x2: x(f), y2: yBot + 8, class: "rates-grid-major" }));
      text(svg, fmt(topMax * f), x(f), yTop - 20, "rates-label");
      text(svg, fmt(bottomMax * f), x(f), yBot + 24, "rates-label");
    }
    text(svg, String(topLabel), 44, yTop, "rates-label");
    text(svg, String(bottomLabel), 44, yBot, "rates-label");
    target.innerHTML = "";
    target.appendChild(svg);
  }

  // Scale drawing: a labelled scaled rectangle (e.g. a room plan) + the scale.
  function renderScaleDrawing(target, config = {}) {
    const svg = makeSvg(560, 320);
    const x = 120, y = 90, w = 300, h = 150;
    svg.appendChild(el("rect", { x, y, width: w, height: h, fill: "#eef2ff", stroke: "#111827", "stroke-width": 2.4 }));
    // dimension arrows
    svg.appendChild(el("line", { x1: x, y1: y + h + 26, x2: x + w, y2: y + h + 26, class: "rates-axis" }));
    text(svg, config.lengthLabel || "", x + w / 2, y + h + 44, "rates-label");
    svg.appendChild(el("line", { x1: x - 26, y1: y, x2: x - 26, y2: y + h, class: "rates-axis" }));
    text(svg, config.widthLabel || "", x - 46, y + h / 2, "rates-label");
    if (config.title) text(svg, config.title, x + w / 2, y - 22, "rates-axis-title");
    if (config.scale) text(svg, `Scale  ${config.scale}`, x + w / 2, y + h + 70, "rates-label");
    target.innerHTML = "";
    target.appendChild(svg);
  }

  function render(target, config = {}) {
    const type = config.diagramType || "distance-time";

    if (type === "distance-time") return renderDistanceTime(target, config);
    if (type === "ratio-bar") return renderRatioBar(target, config);
    if (type === "double-number-line") return renderDoubleNumberLine(target, config);
    if (type === "scale-drawing") return renderScaleDrawing(target, config);

    target.innerHTML = `<div class="diagram-placeholder">Unknown rates diagram: ${type}</div>`;
  }

  return { render };
})();
