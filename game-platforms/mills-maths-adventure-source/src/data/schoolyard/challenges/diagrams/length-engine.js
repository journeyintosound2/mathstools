// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/length/length-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  CHHS Exam Builder — Length Diagram Engine
  -----------------------------------------
  Save as:

  engines/length/length-engine.js

  Exposes:
  window.MMT_LENGTH_ENGINE.render(target, config)

  Supported diagramType values:
  - polygon
  - composite-rectilinear
  - circle-features
  - circle-measure
  - sector
  - partial-circle
  - curved-composite
*/

window.MMT_LENGTH_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);

    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        node.setAttribute(key, String(value));
      }
    });

    return node;
  }

  function makeSvg(width = 720, height = 420, label = "length diagram") {
    const svg = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: "100%",
      height: "100%",
      role: "img",
      "aria-label": label,
      class: "length-svg"
    });

    const style = el("style");
    style.textContent = `
      .length-svg{overflow:visible}
      .shape-fill{fill:#eff6ff}
      .shape-line{stroke:#111827;stroke-width:2.8;stroke-linejoin:round;stroke-linecap:round}
      .shape-dash{stroke:#111827;stroke-width:2.2;stroke-dasharray:7 6;stroke-linecap:round}
      .shape-dim{stroke:#111827;stroke-width:1.9;stroke-linecap:round;fill:none}
      .shape-highlight{stroke:#9f174a;stroke-width:3.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .shape-feature{stroke:#1d4ed8;stroke-width:3.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .shape-feature-green{stroke:#047857;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .shape-feature-fill{fill:rgba(29,78,216,.12);stroke:#1d4ed8;stroke-width:3}
      .shape-label{font-family:"Cambria Math","Times New Roman",serif;font-size:20px;font-weight:800;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .shape-small-label{font-family:"Cambria Math","Times New Roman",serif;font-size:16px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .shape-point{fill:#111827}
      .right-angle{fill:none;stroke:#111827;stroke-width:2.5}
      .equality-mark{stroke:#111827;stroke-width:3;stroke-linecap:round}
      .missing-label{font-family:"Cambria Math","Times New Roman",serif;font-size:20px;font-weight:900;fill:#9f174a;text-anchor:middle;dominant-baseline:middle}
      .missing-edge{stroke:#9f174a;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
      .unshaded-cutout{fill:#fff;stroke:none}
    `;
    svg.appendChild(style);
    return svg;
  }

  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function label(svg, text, x, y, cls = "shape-label", rotate = 0) {
    const t = el("text", {
      x,
      y,
      class: cls
    });
    if (rotate) t.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
    t.textContent = text;
    svg.appendChild(t);
  }

  function pathFromPoints(points, close = true) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + (close ? " Z" : "");
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function sideLabel(svg, text, a, b, dx = 0, dy = 0, cls = "shape-label") {
    const m = midpoint(a, b);
    label(svg, text, m.x + dx, m.y + dy, cls);
  }

  function arrowHead(svg, tip, tail, cls = "shape-dim") {
    const dx = tip.x - tail.x;
    const dy = tip.y - tail.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const length = 9;
    const width = 6;
    const base = { x: tip.x - ux * length, y: tip.y - uy * length };

    svg.appendChild(el("polygon", {
      points: `${tip.x},${tip.y} ${base.x + px * width / 2},${base.y + py * width / 2} ${base.x - px * width / 2},${base.y - py * width / 2}`,
      class: cls,
      fill: "#111827",
      stroke: "none"
    }));
  }

  function dimensionArrow(svg, x1, y1, x2, y2, text, labelDx = 0, labelDy = -12) {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };

    svg.appendChild(el("line", {
      x1,
      y1,
      x2,
      y2,
      class: "shape-dim"
    }));

    arrowHead(svg, a, b);
    arrowHead(svg, b, a);

    const m = midpoint(a, b);
    label(svg, text, m.x + labelDx, m.y + labelDy, "shape-small-label");
  }

  function sideLabelAt(svg, text, a, b, t = 0.5, dx = 0, dy = 0, cls = "shape-label") {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    label(svg, text, x + dx, y + dy, cls);
  }

  function drawTickMark(svg, a, b, count = 1) {
    const m = midpoint(a, b);
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const length = Math.hypot(vx, vy) || 1;
    const ux = vx / length;
    const uy = vy / length;
    const px = -uy;
    const py = ux;
    const tickLength = 22;
    const spacing = 12;

    const offsets = count === 2 ? [-spacing / 2, spacing / 2] : [0];

    offsets.forEach(offset => {
      const cx = m.x + ux * offset;
      const cy = m.y + uy * offset;

      svg.appendChild(el("line", {
        x1: cx - px * tickLength / 2,
        y1: cy - py * tickLength / 2,
        x2: cx + px * tickLength / 2,
        y2: cy + py * tickLength / 2,
        class: "equality-mark"
      }));
    });
  }

  function regularPolygonPoints(cx, cy, radius, sides, rotationDeg = -90) {
    const points = [];

    for (let i = 0; i < sides; i++) {
      const angle = (rotationDeg + i * 360 / sides) * Math.PI / 180;
      points.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      });
    }

    return points;
  }

  function markAllSidesEqual(svg, points) {
    points.forEach((point, index) => {
      drawTickMark(svg, point, points[(index + 1) % points.length], 1);
    });
  }

  function renderPolygon(target, config = {}) {
    const svg = makeSvg(720, 420, "polygon perimeter diagram");
    const shape = config.shape || "quadrilateral";
    const labels = config.labels || {};
    let points;

    if (shape === "rectangle") {
      points = [
        { x: 160, y: 305 },
        { x: 560, y: 305 },
        { x: 560, y: 125 },
        { x: 160, y: 125 }
      ];
    } else if (shape === "square") {
      points = [
        { x: 245, y: 320 },
        { x: 475, y: 320 },
        { x: 475, y: 90 },
        { x: 245, y: 90 }
      ];
    } else if (shape === "triangle") {
      points = [
        { x: 150, y: 315 },
        { x: 555, y: 315 },
        { x: 450, y: 85 }
      ];
    } else if (shape === "equilateral-triangle") {
      points = [
        { x: 190, y: 315 },
        { x: 530, y: 315 },
        { x: 360, y: 90 }
      ];
    } else if (shape === "regular-pentagon") {
      points = regularPolygonPoints(360, 210, 145, 5, -90);
      points = points.slice(3).concat(points.slice(0, 3));
    } else if (shape === "regular-hexagon") {
      points = regularPolygonPoints(360, 210, 150, 6, 30);
      points = [points[2], points[1], points[0], points[5], points[4], points[3]];
    } else if (shape === "regular-octagon") {
      points = regularPolygonPoints(360, 210, 150, 8, 22.5);
      points = [points[3], points[2], points[1], points[0], points[7], points[6], points[5], points[4]];
    } else if (shape === "parallelogram") {
      points = [
        { x: 180, y: 290 },
        { x: 540, y: 290 },
        { x: 455, y: 125 },
        { x: 95, y: 125 }
      ];
    } else if (shape === "trapezium") {
      points = [
        { x: 145, y: 295 },
        { x: 575, y: 295 },
        { x: 475, y: 125 },
        { x: 245, y: 125 }
      ];
    } else if (shape === "rhombus") {
      points = [
        { x: 360, y: 80 },
        { x: 540, y: 210 },
        { x: 360, y: 340 },
        { x: 180, y: 210 }
      ];
    } else if (shape === "kite") {
      points = [
        { x: 360, y: 65 },
        { x: 520, y: 190 },
        { x: 360, y: 355 },
        { x: 200, y: 190 }
      ];
    } else {
      points = [
        { x: 150, y: 300 },
        { x: 560, y: 300 },
        { x: 530, y: 120 },
        { x: 170, y: 100 }
      ];
    }

    svg.appendChild(el("path", {
      d: pathFromPoints(points),
      class: "shape-fill shape-line"
    }));

    if (["square", "equilateral-triangle", "regular-pentagon", "regular-hexagon", "regular-octagon", "rhombus"].includes(shape)) {
      markAllSidesEqual(svg, points);
    }

    if (shape === "rectangle") {
      drawTickMark(svg, points[0], points[1], 1);
      drawTickMark(svg, points[2], points[3], 1);
      drawTickMark(svg, points[1], points[2], 2);
      drawTickMark(svg, points[3], points[0], 2);
    }

    if (shape === "parallelogram") {
      drawTickMark(svg, points[0], points[1], 1);
      drawTickMark(svg, points[2], points[3], 1);
      drawTickMark(svg, points[1], points[2], 2);
      drawTickMark(svg, points[3], points[0], 2);
    }

    if (shape === "kite") {
      drawTickMark(svg, points[0], points[1], 1);
      drawTickMark(svg, points[3], points[0], 1);
      drawTickMark(svg, points[1], points[2], 2);
      drawTickMark(svg, points[2], points[3], 2);
    }

    if (shape === "triangle" || shape === "equilateral-triangle") {
      sideLabel(svg, labels.bottom || "", points[0], points[1], 0, 34);
      sideLabel(svg, labels.right || "", points[1], points[2], 42, -8);
      sideLabel(svg, labels.left || "", points[2], points[0], -42, -8);
    } else {
      sideLabel(svg, labels.bottom || "", points[0], points[1], 0, 34);
      sideLabel(svg, labels.right || "", points[1], points[2], 40, 0);
      sideLabel(svg, labels.top || "", points[2], points[3], 0, -34);
      sideLabel(svg, labels.left || "", points[3], points[0], -42, 0);
    }

    if (labels.note) label(svg, labels.note, 360, 382, "shape-small-label");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCompositeRectilinear(target, config = {}) {
    const svg = makeSvg(720, 430, "composite rectilinear figure");

    if (Array.isArray(config.points) && config.points.length >= 4) {
      const pts = config.points.map(point => ({
        x: number(point.x, 0),
        y: number(point.y, 0)
      }));

      svg.appendChild(el("path", {
        d: pathFromPoints(pts),
        class: "shape-fill shape-line"
      }));

      const edgeLabels = Array.isArray(config.edgeLabels) ? config.edgeLabels : [];
      const labelOffsetScale = number(config.labelOffsetScale, 0.72);

      edgeLabels.forEach(item => {
        const edge = item.edge || [];
        const a = pts[edge[0]];
        const b = pts[edge[1]];

        if (!a || !b) return;

        if (item.highlight) {
          svg.appendChild(el("line", {
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            class: "missing-edge"
          }));
        }

        if (!item.text) return;

        sideLabel(
          svg,
          item.text,
          a,
          b,
          number(item.dx, 0) * labelOffsetScale,
          number(item.dy, 0) * labelOffsetScale,
          item.className || "shape-small-label"
        );
      });

      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    const labels = config.labels || {};

    const pts = [
      { x: 150, y: 110 },
      { x: 560, y: 110 },
      { x: 560, y: 250 },
      { x: 405, y: 250 },
      { x: 405, y: 330 },
      { x: 150, y: 330 }
    ];

    svg.appendChild(el("path", {
      d: pathFromPoints(pts),
      class: "shape-fill shape-line"
    }));

    sideLabel(svg, labels.top || "", pts[0], pts[1], 0, -36);
    sideLabel(svg, labels.right || "", pts[1], pts[2], 50, 0);
    sideLabel(svg, labels.notchWidth || "", pts[2], pts[3], 0, 40);
    sideLabel(svg, labels.notchHeight || "", pts[3], pts[4], 54, 0);
    sideLabel(svg, labels.bottom || "", pts[4], pts[5], 0, 38);
    sideLabel(svg, labels.left || "", pts[5], pts[0], -52, 0);

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCircleFeatures(target, config = {}) {
    const svg = makeSvg(720, 420, "circle features diagram");
    const feature = config.feature || "radius";
    const cx = 360;
    const cy = 210;
    const r = 125;

    svg.appendChild(el("circle", {
      cx,
      cy,
      r,
      class: "shape-fill shape-line"
    }));

    svg.appendChild(el("circle", { cx, cy, r: 4.5, class: "shape-point" }));

    if (feature === "radius") {
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, class: "shape-feature" }));
      label(svg, "?", cx + r / 2, cy - 22);
    } else if (feature === "diameter") {
      svg.appendChild(el("line", { x1: cx - r, y1: cy, x2: cx + r, y2: cy, class: "shape-feature" }));
      label(svg, "?", cx, cy - 28);
    } else if (feature === "chord") {
      svg.appendChild(el("line", { x1: cx - 88, y1: cy - 85, x2: cx + 100, y2: cy - 62, class: "shape-feature" }));
      label(svg, "?", cx + 5, cy - 100);
    } else if (feature === "arc") {
      svg.appendChild(el("path", {
        d: `M ${cx + 88} ${cy - 88} A ${r} ${r} 0 0 1 ${cx + 118} ${cy + 41}`,
        class: "shape-highlight"
      }));
      label(svg, "?", cx + 145, cy - 25);
    } else if (feature === "sector") {
      svg.appendChild(el("path", {
        d: `M ${cx} ${cy} L ${cx + 118} ${cy - 41} A ${r} ${r} 0 0 1 ${cx + 70} ${cy + 104} Z`,
        class: "shape-feature-fill"
      }));
      label(svg, "?", cx + 64, cy + 18);
    } else if (feature === "segment") {
      svg.appendChild(el("path", {
        d: `M ${cx - 93} ${cy + 83} A ${r} ${r} 0 0 0 ${cx + 100} ${cy + 75} L ${cx - 93} ${cy + 83} Z`,
        class: "shape-feature-fill"
      }));
      label(svg, "?", cx + 5, cy + 107);
    } else if (feature === "tangent") {
      svg.appendChild(el("line", {
        x1: cx + r,
        y1: cy - 145,
        x2: cx + r,
        y2: cy + 145,
        class: "shape-feature"
      }));
      svg.appendChild(el("circle", { cx: cx + r, cy, r: 4.5, class: "shape-point" }));
      label(svg, "?", cx + r + 38, cy);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCircleMeasure(target, config = {}) {
    const svg = makeSvg(720, 420, "circle measure diagram");
    const cx = 360;
    const cy = 210;
    const r = 120;
    const given = config.given || "radius";
    const value = config.value ?? config.radius ?? config.diameter ?? "";
    const unit = config.unit || "cm";

    svg.appendChild(el("circle", { cx, cy, r, class: "shape-fill shape-line" }));
    svg.appendChild(el("circle", { cx, cy, r: 4.5, class: "shape-point" }));

    if (given === "diameter") {
      svg.appendChild(el("line", { x1: cx - r, y1: cy, x2: cx + r, y2: cy, class: "shape-feature" }));
      label(svg, `${value} ${unit}`, cx, cy - 28);
    } else {
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, class: "shape-feature" }));
      label(svg, `${value} ${unit}`, cx + r / 2, cy - 26);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function polar(cx, cy, r, angleDeg) {
    const angle = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = polar(cx, cy, r, startAngle);
    const end = polar(cx, cy, r, endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  function renderSector(target, config = {}) {
    const svg = makeSvg(720, 420, "sector diagram");
    const angle = number(config.angle, 90);

    // Keep large sectors inside the viewBox so they do not spill down into the
    // next question when the class-test template puts the diagram beside an
    // answer box. Large reflex sectors need a smaller radius and a higher centre.
    const cx = 360;
    const cy = angle > 180 ? 238 : 260;
    const r = angle <= 45 ? 172 : angle > 180 ? 150 : 165;
    const radius = config.radius ?? "";
    const unit = config.unit || "cm";
    const startAngle = -angle / 2;
    const endAngle = angle / 2;
    const a = polar(cx, cy, r, startAngle);
    const b = polar(cx, cy, r, endAngle);
    const largeArc = angle > 180 ? 1 : 0;

    svg.appendChild(el("path", {
      d: `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y} Z`,
      class: "shape-fill shape-line"
    }));

    const innerArcRadius = angle <= 45 ? 54 : 48;
    svg.appendChild(el("path", {
      d: arcPath(cx, cy, innerArcRadius, startAngle, endAngle),
      class: "shape-feature-green"
    }));

    const midAngle = (startAngle + endAngle) / 2;
    const anglePoint = polar(cx, cy, innerArcRadius + 28, midAngle);
    label(svg, `${angle}°`, anglePoint.x, anglePoint.y, "shape-small-label");

    if (angle >= 170 && angle <= 190) {
      label(svg, `${radius} ${unit}`, cx + r / 2, cy + 30, "shape-small-label");
    } else {
      const sidePoint = {
        x: cx + (a.x - cx) * 0.56,
        y: cy + (a.y - cy) * 0.56
      };
      const labelDx = angle > 180 ? -28 : -42;
      const labelDy = angle > 180 ? 18 : 6;
      label(svg, `${radius} ${unit}`, sidePoint.x + labelDx, sidePoint.y + labelDy, "shape-small-label");
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderPartialCircle(target, config = {}) {
    const svg = makeSvg(720, 420, "partial circle diagram");
    const shape = config.shape || "semicircle";
    const unit = config.unit || "cm";
    const radius = config.radius ?? "";
    const cx = 360;
    const cy = shape === "quadrant" ? 260 : 240;
    const r = 135;

    if (shape === "quadrant") {
      const start = { x: cx, y: cy - r };
      const end = { x: cx + r, y: cy };

      svg.appendChild(el("path", {
        d: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y} Z`,
        class: "shape-fill shape-line"
      }));

      label(svg, `${radius} ${unit}`, cx - 28, cy - r / 2);
      label(svg, `${radius} ${unit}`, cx + r / 2, cy + 30);

      svg.appendChild(el("path", {
        d: `M ${cx} ${cy - 30} L ${cx + 30} ${cy - 30} L ${cx + 30} ${cy}`,
        class: "right-angle"
      }));
    } else {
      svg.appendChild(el("path", {
        d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx - r} ${cy} Z`,
        class: "shape-fill shape-line"
      }));

      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, class: "shape-feature" }));
      label(svg, `${radius} ${unit}`, cx + r / 2, cy + 28);
      label(svg, "semicircle", cx, cy - 62, "shape-small-label");
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCurvedComposite(target, config = {}) {
    const svg = makeSvg(720, 430, "curved composite perimeter diagram");
    const shape = config.shape || "rectangle-semicircle";
    const unit = config.unit || "cm";

    if (shape === "quadrant-sector") {
      const cx = 250;
      const cy = 315;
      const r = 225;
      const side = config.side ?? config.radius ?? "";

      svg.appendChild(el("path", {
        d: `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`,
        class: "shape-fill shape-line"
      }));
      svg.appendChild(el("path", {
        d: `M ${cx + 36} ${cy} L ${cx + 36} ${cy - 36} L ${cx} ${cy - 36}`,
        class: "right-angle"
      }));
      label(svg, `${side} ${unit}`, cx - 42, cy - r / 2, "shape-small-label");
      label(svg, `${side} ${unit}`, cx + r / 2, cy + 34, "shape-small-label");
    } else if (shape === "square-quadrant-cutout") {
      const x = 230;
      const y = 90;
      const size = 260;
      const side = config.side ?? config.radius ?? "";
      const arc = `M ${x + size} ${y} A ${size} ${size} 0 0 1 ${x} ${y + size}`;

      svg.appendChild(el("path", {
        d: `M ${x} ${y} H ${x + size} A ${size} ${size} 0 0 1 ${x} ${y + size} H ${x} Z`,
        class: "shape-fill shape-line"
      }));
      svg.appendChild(el("path", { d: arc, class: "shape-highlight" }));
      label(svg, `${side} ${unit}`, x + size / 2, y - 32, "shape-small-label");
      label(svg, `${side} ${unit}`, x - 42, y + size / 2, "shape-small-label");
    } else if (shape === "four-semicircle-square") {
      const x = 250;
      const y = 115;
      const side = 170;
      const measure = config.side ?? "";
      const r = side / 2;
      const path = [
        `M ${x} ${y}`,
        `A ${r} ${r} 0 0 1 ${x + side} ${y}`,
        `A ${r} ${r} 0 0 1 ${x + side} ${y + side}`,
        `A ${r} ${r} 0 0 1 ${x} ${y + side}`,
        `A ${r} ${r} 0 0 1 ${x} ${y}`,
        `Z`
      ].join(" ");

      svg.appendChild(el("path", { d: path, class: "shape-fill shape-line" }));
      svg.appendChild(el("rect", {
        x,
        y,
        width: side,
        height: side,
        class: "shape-dash",
        fill: "none"
      }));

      // Dimension arrows make it explicit that the given measurement is the
      // diameter of each semicircle, not an unrelated label floating inside.
      dimensionArrow(svg, x + 14, y + r, x + side - 14, y + r, `${measure} ${unit}`, 0, -14);
      dimensionArrow(svg, x + r, y + 14, x + r, y + side - 14, `${measure} ${unit}`, 48, 5);
    } else if (shape === "arch-rectangle") {
      const x = 190;
      const y = 165;
      const w = 340;
      const h = 150;
      const width = config.width ?? "";
      const height = config.height ?? "";

      svg.appendChild(el("path", {
        d: `M ${x} ${y} A ${w / 2} ${w / 2} 0 0 1 ${x + w} ${y} V ${y + h} H ${x} Z`,
        class: "shape-fill shape-line"
      }));

      svg.appendChild(el("line", {
        x1: x,
        y1: y,
        x2: x + w,
        y2: y,
        class: "shape-dash"
      }));

      label(svg, `${width} ${unit}`, x + w / 2, y + 28, "shape-small-label");
      label(svg, `${height} ${unit}`, x - 44, y + h / 2, "shape-small-label");
    } else if (shape === "stadium") {
      const x = 160;
      const y = 140;
      const w = 400;
      const h = 150;
      const length = config.length ?? "";
      const width = config.width ?? "";

      svg.appendChild(el("path", {
        d: `M ${x} ${y + h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x + h / 2} ${y} H ${x + w - h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x + w} ${y + h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x + w - h / 2} ${y + h} H ${x + h / 2} A ${h / 2} ${h / 2} 0 0 1 ${x} ${y + h / 2} Z`,
        class: "shape-fill shape-line"
      }));

      svg.appendChild(el("line", { x1: x + h / 2, y1: y, x2: x + w - h / 2, y2: y, class: "shape-dash" }));
      svg.appendChild(el("line", { x1: x + h / 2, y1: y + h, x2: x + w - h / 2, y2: y + h, class: "shape-dash" }));
      label(svg, `${length} ${unit}`, x + w / 2, y - 32, "shape-small-label");
      label(svg, `${width} ${unit}`, x - 48, y + h / 2, "shape-small-label");
    } else {
      const x = 170;
      const y = 130;
      const w = 300;
      const h = 170;
      const width = config.width ?? "";
      const height = config.height ?? "";

      svg.appendChild(el("path", {
        d: `M ${x} ${y} H ${x + w} A ${h / 2} ${h / 2} 0 0 1 ${x + w} ${y + h} H ${x} Z`,
        class: "shape-fill shape-line"
      }));

      svg.appendChild(el("path", {
        d: `M ${x + w} ${y} A ${h / 2} ${h / 2} 0 0 1 ${x + w} ${y + h}`,
        class: "shape-highlight"
      }));

      label(svg, `${width} ${unit}`, x + w / 2, y - 30, "shape-small-label");
      label(svg, `${height} ${unit}`, x - 44, y + h / 2, "shape-small-label");
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderRuler(target, config = {}) {
    const maxCm = Math.max(5, Math.min(20, number(config.maxCm, 10)));
    const start = Math.max(0, number(config.objectStart, 0));
    const end = Math.min(maxCm, number(config.objectEnd, maxCm - 1));
    const svg = makeSvg(760, 230, "object measured against a ruler");

    const left = 50, right = 710, yTop = 120, h = 70;
    const x = cm => left + (cm / maxCm) * (right - left);

    // Ruler body.
    svg.appendChild(el("rect", { x: left, y: yTop, width: right - left, height: h, class: "shape-line", fill: "#fef3c7" }));
    for (let cm = 0; cm <= maxCm; cm++) {
      const xi = x(cm);
      svg.appendChild(el("line", { x1: xi, y1: yTop, x2: xi, y2: yTop + (cm % 1 === 0 ? 22 : 12), class: "shape-dim" }));
      label(svg, String(cm), xi, yTop + 40, "shape-small-label");
      // half marks
      if (cm < maxCm) {
        const xh = x(cm + 0.5);
        svg.appendChild(el("line", { x1: xh, y1: yTop, x2: xh, y2: yTop + 12, class: "shape-dim" }));
      }
    }
    label(svg, "cm", right + 14, yTop + 20, "shape-small-label");

    // Object bar above the ruler.
    svg.appendChild(el("rect", { x: x(start), y: 54, width: x(end) - x(start), height: 40, class: "shape-feature-fill", rx: 6 }));
    return target.innerHTML = "", target.appendChild(svg);
  }

  function render(target, config = {}) {
    const type = config.diagramType || "polygon";

    if (type === "ruler") {
      renderRuler(target, config);
      return;
    }

    if (type === "polygon") {
      renderPolygon(target, config);
      return;
    }

    if (type === "composite-rectilinear") {
      renderCompositeRectilinear(target, config);
      return;
    }

    if (type === "circle-features") {
      renderCircleFeatures(target, config);
      return;
    }

    if (type === "circle-measure") {
      renderCircleMeasure(target, config);
      return;
    }

    if (type === "sector") {
      renderSector(target, config);
      return;
    }

    if (type === "partial-circle") {
      renderPartialCircle(target, config);
      return;
    }

    if (type === "curved-composite") {
      renderCurvedComposite(target, config);
      return;
    }

    target.innerHTML = `<div class="diagram-placeholder">Unknown length diagram: ${type}</div>`;
  }

  return { render };
})();
