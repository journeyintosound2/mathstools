// Copied verbatim from the Mills Maths Tools website: assessment/exam-builder/engines/volume/volume-engine.js
// A plain side-effect script — the IIFE puts the engine on window.MMT_<NAME>_ENGINE.
/*
  MMT Exam Builder — Volume Engine
  --------------------------------
  Save as:

  engines/volume/volume-engine.js

  Browser global:
    window.MMT_VOLUME_ENGINE.render(node, config)
*/

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const INK = "#111827";
  const RED = "#a7253f";
  const BLUE_FILL = "#eef4fb";
  const BLUE_SIDE = "#e8f0fa";
  const BLUE_TOP = "#f7fbff";
  const CYL_FILL = "#f9e4df";
  const CYL_SIDE = "#f5cfc7";
  const ORANGE_FILL = "#fde3ce";
  const ORANGE_SIDE = "#fee8d6";
  const SOFT = "#f8fafc";

  function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") el.setAttribute(key, String(value));
    });
    return el;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function makeSvg(width = 720, height = 420, label = "Volume diagram") {
    const svg = svgEl("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": label
    });
    svg.appendChild(svgEl("rect", {
      x: 8,
      y: 8,
      width: width - 16,
      height: height - 16,
      rx: 16,
      fill: SOFT,
      stroke: "none"
    }));
    return svg;
  }

  function addPath(svg, d, attrs = {}) {
    const el = svgEl("path", {
      d,
      fill: attrs.fill ?? "none",
      stroke: attrs.stroke || INK,
      "stroke-width": attrs.width || 3,
      "stroke-linejoin": attrs.join || "round",
      "stroke-linecap": attrs.cap || "round",
      "stroke-dasharray": attrs.dash || ""
    });
    svg.appendChild(el);
    return el;
  }

  function addLine(svg, x1, y1, x2, y2, attrs = {}) {
    const el = svgEl("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: attrs.stroke || INK,
      "stroke-width": attrs.width || 3,
      "stroke-linecap": attrs.cap || "round",
      "stroke-dasharray": attrs.dash || ""
    });
    svg.appendChild(el);
    return el;
  }

  function addPoly(svg, points, attrs = {}) {
    const el = svgEl("polygon", {
      points: points.map(p => p.join(",")).join(" "),
      fill: attrs.fill ?? BLUE_FILL,
      stroke: attrs.stroke || INK,
      "stroke-width": attrs.width || 3,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      "stroke-dasharray": attrs.dash || ""
    });
    svg.appendChild(el);
    return el;
  }

  function addEllipse(svg, cx, cy, rx, ry, attrs = {}) {
    const el = svgEl("ellipse", {
      cx,
      cy,
      rx,
      ry,
      fill: attrs.fill ?? "none",
      stroke: attrs.stroke || INK,
      "stroke-width": attrs.width || 3,
      "stroke-dasharray": attrs.dash || ""
    });
    svg.appendChild(el);
    return el;
  }

  function addText(svg, text, x, y, attrs = {}) {
    const el = svgEl("text", {
      x,
      y,
      "font-family": attrs.family || "Cambria Math, STIX Two Math, Times New Roman, serif",
      "font-size": attrs.size || 22,
      "font-weight": attrs.weight || 700,
      "text-anchor": attrs.anchor || "middle",
      "dominant-baseline": attrs.baseline || "middle",
      fill: attrs.fill || INK
    });
    el.textContent = String(text ?? "");
    svg.appendChild(el);
    return el;
  }

  function addTextBox(svg, text, x, y, attrs = {}) {
    const size = attrs.size || 20;
    const value = String(text ?? "");
    const paddingX = attrs.paddingX ?? 8;
    const paddingY = attrs.paddingY ?? 4;
    // Approximate text width so dimension lines visually break behind labels.
    // This avoids using getBBox(), which can be unreliable before print layout.
    const width = attrs.boxWidth || Math.max(34, value.length * size * 0.56 + paddingX * 2);
    const height = attrs.boxHeight || size * 1.15 + paddingY * 2;
    const background = attrs.background || SOFT;

    if (attrs.background !== false) {
      svg.appendChild(svgEl("rect", {
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        rx: 5,
        fill: background,
        stroke: "none"
      }));
    }

    return addText(svg, value, x, y, attrs);
  }

  function addDim(svg, x1, y1, x2, y2, label, attrs = {}) {
    const stroke = attrs.stroke || INK;
    const offset = attrs.offset || 0;
    const labelOffset = attrs.labelOffset || 0;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ax1 = x1 + nx * offset;
    const ay1 = y1 + ny * offset;
    const ax2 = x2 + nx * offset;
    const ay2 = y2 + ny * offset;

    addLine(svg, ax1, ay1, ax2, ay2, { stroke, width: attrs.width || 2, dash: attrs.dash || "" });
    addLine(svg, ax1 - nx * 7, ay1 - ny * 7, ax1 + nx * 7, ay1 + ny * 7, { stroke, width: 2 });
    addLine(svg, ax2 - nx * 7, ay2 - ny * 7, ax2 + nx * 7, ay2 + ny * 7, { stroke, width: 2 });
    addTextBox(svg, label, (ax1 + ax2) / 2 + nx * labelOffset, (ay1 + ay2) / 2 + ny * labelOffset, {
      size: attrs.size || 20,
      fill: attrs.fill || INK,
      anchor: attrs.anchor || "middle",
      background: attrs.labelBackground ?? SOFT
    });
  }



  function addArrowHead(svg, tipX, tipY, tailX, tailY, attrs = {}) {
    const stroke = attrs.stroke || INK;
    const size = attrs.size || 9;
    const angle = Math.atan2(tipY - tailY, tipX - tailX);
    const spread = Math.PI / 7;
    const p1 = [tipX, tipY];
    const p2 = [tipX - size * Math.cos(angle - spread), tipY - size * Math.sin(angle - spread)];
    const p3 = [tipX - size * Math.cos(angle + spread), tipY - size * Math.sin(angle + spread)];
    addPoly(svg, [p1, p2, p3], { fill: stroke, stroke, width: 1 });
  }

  function addArrowDim(svg, x1, y1, x2, y2, label, attrs = {}) {
    const stroke = attrs.stroke || INK;
    const offset = attrs.offset || 0;
    const labelOffset = attrs.labelOffset || 0;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ax1 = x1 + nx * offset;
    const ay1 = y1 + ny * offset;
    const ax2 = x2 + nx * offset;
    const ay2 = y2 + ny * offset;

    addLine(svg, ax1, ay1, ax2, ay2, { stroke, width: attrs.width || 2, dash: attrs.dash || "" });
    addArrowHead(svg, ax1, ay1, ax2, ay2, { stroke, size: attrs.arrowSize || 9 });
    addArrowHead(svg, ax2, ay2, ax1, ay1, { stroke, size: attrs.arrowSize || 9 });
    addTextBox(svg, label, (ax1 + ax2) / 2 + nx * labelOffset + (attrs.labelDx || 0), (ay1 + ay2) / 2 + ny * labelOffset + (attrs.labelDy || 0), {
      size: attrs.size || 20,
      fill: attrs.fill || INK,
      anchor: attrs.anchor || "middle",
      weight: attrs.weight || 700,
      background: attrs.labelBackground ?? SOFT
    });
  }

  function fmtUnit(value, unit) {
    return `${value} ${unit}`;
  }

  function shiftPoint(p, dx, dy) {
    return [p[0] + dx, p[1] + dy];
  }

  function drawCuboid(svg, x, y, w, h, d, labels = {}, opts = {}) {
    const dx = d;
    const dy = opts.dy ?? -d * 0.5;
    const front = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const back = front.map(p => shiftPoint(p, dx, dy));

    addPoly(svg, [[x, y], [x + dx, y + dy], [x + w + dx, y + dy], [x + w, y]], { fill: opts.topFill || BLUE_TOP, stroke: INK, width: opts.width || 3 });
    addPoly(svg, [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]], { fill: opts.sideFill || BLUE_SIDE, stroke: INK, width: opts.width || 3 });
    addPoly(svg, front, { fill: opts.fill || BLUE_FILL, stroke: INK, width: opts.width || 3 });

    // Back/hidden reference edges: useful for 3D interpretation, but kept light.
    addLine(svg, back[0][0], back[0][1], back[3][0], back[3][1], { dash: "8 8", stroke: opts.dashStroke || RED, width: 2 });
    addLine(svg, back[3][0], back[3][1], back[2][0], back[2][1], { dash: "8 8", stroke: opts.dashStroke || RED, width: 2 });
    // Hidden bottom depth edge from the front lower corner to the rear lower corner.
    // This makes rectangular prisms read as 3D solids without overloading the visible faces.
    addLine(svg, front[3][0], front[3][1], back[3][0], back[3][1], { dash: "8 8", stroke: opts.dashStroke || RED, width: 2 });

    if (labels.length) addText(svg, labels.length, x + w / 2, y + h + 38, { size: 20 });
    if (labels.height) addText(svg, labels.height, x - 36, y + h / 2, { size: 20 });
    if (labels.width) addText(svg, labels.width, x + w + dx + 30, y + h + dy / 2, { size: 20 });
    // No generic shape title is drawn; the question prompt gives the context.

    return { front, back, dx, dy };
  }

  function drawExtrudedPolygon(svg, pts, dx, dy, opts = {}) {
    const back = pts.map(p => shiftPoint(p, dx, dy));
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const c = back[(i + 1) % back.length];
      const d = back[i];
      addPoly(svg, [a, b, c, d], { fill: i % 2 ? (opts.sideFill || BLUE_SIDE) : (opts.topFill || BLUE_TOP), stroke: opts.stroke || INK, width: opts.width || 3 });
    }
    addPoly(svg, pts, { fill: opts.fill || BLUE_FILL, stroke: opts.stroke || INK, width: opts.width || 3 });
    addPoly(svg, back, { fill: "none", stroke: opts.stroke || INK, width: opts.width || 3 });
    pts.forEach((p, i) => {
      addLine(svg, p[0], p[1], back[i][0], back[i][1], { stroke: opts.stroke || INK, width: opts.width || 3, dash: opts.hiddenIndex === i ? "8 8" : "" });
    });
    return { back };
  }


  function edgeKey(i, n) {
    return `${i}-${(i + 1) % n}`;
  }

  function findBottomLeftIndex(points) {
    return points.reduce((best, point, index) => {
      const b = points[best];
      if (point[1] > b[1] + 0.1) return index;
      if (Math.abs(point[1] - b[1]) < 0.1 && point[0] < b[0]) return index;
      return best;
    }, 0);
  }

  function addEdge(svg, a, b, attrs = {}) {
    addLine(svg, a[0], a[1], b[0], b[1], attrs);
  }

  function drawExtrudedPolygonClean(svg, pts, dx, dy, opts = {}) {
    const back = pts.map(p => shiftPoint(p, dx, dy));
    const n = pts.length;
    const hiddenVertex = opts.hiddenVertex ?? findBottomLeftIndex(pts);
    const hiddenConnectors = new Set(opts.hiddenConnectors || [hiddenVertex]);
    const hiddenBackEdges = new Set(opts.hiddenBackEdges || [
      edgeKey(hiddenVertex, n),
      edgeKey((hiddenVertex - 1 + n) % n, n)
    ]);
    const stroke = opts.stroke || INK;
    const width = opts.width || 3;
    const hiddenStroke = opts.hiddenStroke || INK;
    const hiddenWidth = opts.hiddenWidth || 2;
    const hiddenDash = opts.hiddenDash || "8 8";

    // Fill side faces first without outlines so hidden edges can be controlled
    // explicitly rather than being accidentally drawn as solid edges.
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const c = back[(i + 1) % n];
      const d = back[i];
      addPoly(svg, [a, b, c, d], {
        fill: i % 2 ? (opts.sideFill || BLUE_SIDE) : (opts.topFill || BLUE_TOP),
        stroke: "none",
        width: 0
      });
    }

    // Back face edges, with only genuinely hidden rear edges dashed.
    for (let i = 0; i < n; i += 1) {
      const attrs = hiddenBackEdges.has(edgeKey(i, n))
        ? { stroke: hiddenStroke, width: hiddenWidth, dash: hiddenDash }
        : { stroke, width };
      addEdge(svg, back[i], back[(i + 1) % n], attrs);
    }

    // Extrusion edges.
    for (let i = 0; i < n; i += 1) {
      const attrs = hiddenConnectors.has(i)
        ? { stroke: hiddenStroke, width: hiddenWidth, dash: hiddenDash }
        : { stroke, width };
      addEdge(svg, pts[i], back[i], attrs);
    }

    // Front face last so the given cross-section/visible face stays dominant.
    addPoly(svg, pts, { fill: opts.fill || BLUE_FILL, stroke, width });
    return { back };
  }

  function cylinderBodyPath(cx, topY, bottomY, rx, ry) {
    return `M${cx - rx} ${topY} L${cx - rx} ${bottomY} A${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY} L${cx + rx} ${topY} A${rx} ${ry} 0 0 0 ${cx - rx} ${topY} Z`;
  }

  function drawVerticalCylinder(svg, cx, topY, bottomY, rx, ry, opts = {}) {
    const stroke = opts.stroke || RED;
    addPath(svg, cylinderBodyPath(cx, topY, bottomY, rx, ry), { fill: opts.fill || CYL_FILL, stroke: "none" });
    addLine(svg, cx - rx, topY, cx - rx, bottomY, { stroke, width: opts.width || 3 });
    addLine(svg, cx + rx, topY, cx + rx, bottomY, { stroke, width: opts.width || 3 });
    addEllipse(svg, cx, topY, rx, ry, { fill: opts.topFill || CYL_FILL, stroke, width: opts.width || 3 });
    addPath(svg, `M${cx - rx} ${bottomY} A${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY}`, { stroke, width: opts.width || 3 });
    if (opts.showBackBottom !== false) {
      addPath(svg, `M${cx - rx} ${bottomY} A${rx} ${ry} 0 0 1 ${cx + rx} ${bottomY}`, { stroke, width: 2, dash: "8 8" });
    }
  }

  function drawHorizontalCylinder(svg, x, cy, length, rx, ry, opts = {}) {
    const stroke = opts.stroke || RED;
    const slant = opts.slant || 0;
    const rightX = x + length;
    const rightY = cy + slant;

    addPath(svg, `M${x} ${cy - ry} L${rightX} ${rightY - ry} A${rx} ${ry} 0 0 1 ${rightX} ${rightY + ry} L${x} ${cy + ry} A${rx} ${ry} 0 0 0 ${x} ${cy - ry} Z`, { fill: opts.fill || CYL_FILL, stroke: "none" });
    addPath(svg, `M${x} ${cy + ry} C${x - rx} ${cy + ry * 0.62} ${x - rx} ${cy - ry * 0.62} ${x} ${cy - ry}`, { stroke, width: opts.width || 3 });
    addLine(svg, x, cy - ry, rightX, rightY - ry, { stroke, width: opts.width || 3 });
    addLine(svg, x, cy + ry, rightX, rightY + ry, { stroke, width: opts.width || 3 });
    addEllipse(svg, rightX, rightY, rx, ry, { fill: opts.endFill || CYL_FILL, stroke, width: opts.width || 3 });
    addPath(svg, `M${x} ${cy + ry} C${x + rx} ${cy + ry * 0.62} ${x + rx} ${cy - ry * 0.62} ${x} ${cy - ry}`, { stroke, width: 2, dash: "8 8" });
  }

  function drawRadius(svg, cx, cy, x2, y2, label, attrs = {}) {
    addLine(svg, cx, cy, x2, y2, { stroke: attrs.stroke || INK, width: attrs.width || 2, dash: attrs.dash || "7 7" });
    addEllipse(svg, cx, cy, 3.5, 3.5, { fill: attrs.stroke || INK, stroke: attrs.stroke || INK, width: 1 });
    addText(svg, label, (cx + x2) / 2 + (attrs.labelDx || 0), (cy + y2) / 2 + (attrs.labelDy || 0), { size: attrs.size || 18 });
  }

  function polar(cx, cy, r, deg) {
    const rad = deg * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(cx, cy, r, startDeg, endDeg) {
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = endDeg > startDeg ? 1 : 0;
    return `M${start[0]} ${start[1]} A${r} ${r} 0 ${large} ${sweep} ${end[0]} ${end[1]}`;
  }

  function sectorPath(cx, cy, r, startDeg, endDeg) {
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = endDeg > startDeg ? 1 : 0;
    return `M${cx} ${cy} L${start[0]} ${start[1]} A${r} ${r} 0 ${large} ${sweep} ${end[0]} ${end[1]} Z`;
  }

  function renderRectangularPrism(node, config) {
    const svg = makeSvg();
    const { length = 8, width = 4, height = 5, unit = "cm", isCube = false, label = "rectangular prism" } = config;
    const w = isCube ? 175 : 245;
    const h = isCube ? 155 : 135;
    const d = isCube ? 72 : 85;
    drawCuboid(svg, 220, 150, w, h, d, {
      length: fmtUnit(length, unit),
      width: fmtUnit(width, unit),
      height: fmtUnit(height, unit),
      title: label
    });
    node.appendChild(svg);
  }

  function renderUniformCrossSection(node, config) {
    const svg = makeSvg();
    const { shape = "rectangle", crossArea = 24, length = 10, unit = "cm", showArea = true } = config;
    const x = 155, y = 118, dx = 195, dy = -50;
    let pts;
    if (shape === "triangle") pts = [[x, y + 175], [x + 180, y + 175], [x + 88, y + 45]];
    else if (shape === "trapezium") pts = [[x, y + 175], [x + 230, y + 175], [x + 176, y + 55], [x + 58, y + 55]];
    else if (shape === "pentagon") pts = [[x + 15, y + 168], [x + 165, y + 168], [x + 198, y + 82], [x + 94, y + 28], [x, y + 88]];
    else pts = [[x, y + 60], [x + 225, y + 60], [x + 225, y + 175], [x, y + 175]];

    const hiddenVertex = findBottomLeftIndex(pts);
    const { back } = drawExtrudedPolygonClean(svg, pts, dx, dy, {
      hiddenVertex,
      hiddenConnectors: [hiddenVertex],
      hiddenBackEdges: [
        edgeKey(hiddenVertex, pts.length),
        edgeKey((hiddenVertex - 1 + pts.length) % pts.length, pts.length)
      ],
      fill: BLUE_FILL,
      sideFill: "#f8fbff",
      topFill: "#ffffff",
      hiddenStroke: INK,
      hiddenDash: "8 8"
    });

    const minX = Math.min(...pts.map(p => p[0]));
    const maxX = Math.max(...pts.map(p => p[0]));
    const minY = Math.min(...pts.map(p => p[1]));
    const maxY = Math.max(...pts.map(p => p[1]));

    if (showArea) {
      addText(svg, `${crossArea} ${unit}²`, minX + (maxX - minX) * 0.45, minY + (maxY - minY) * 0.57, { size: 22 });
      addText(svg, "front area", minX + (maxX - minX) * 0.5, maxY + 36, { size: 16, weight: 700, fill: "#475569" });
    }

    // Keep the prism length outside the visible lower-right depth edge.
    if (showArea === false && config.hideLength) { node.appendChild(svg); return; }
    const visibleDepthIndex = pts.reduce((best, point, index) => {
      const b = pts[best];
      if (point[0] > b[0] + 0.1) return index;
      if (Math.abs(point[0] - b[0]) < 0.1 && point[1] > b[1]) return index;
      return best;
    }, 0);
    addArrowDim(svg, pts[visibleDepthIndex][0], pts[visibleDepthIndex][1] + 12, back[visibleDepthIndex][0], back[visibleDepthIndex][1] + 12, `${length} ${unit}`, {
      offset: 40,
      labelOffset: 10,
      size: 20,
      arrowSize: 8,
      width: 2
    });
    node.appendChild(svg);
  }

  function renderTriangularPrism(node, config) {
    const svg = makeSvg();
    const { base = 8, height = 5, length = 12, unit = "cm" } = config;

    const A = [150, 300];      // front-left/base vertex
    const B = [340, 300];      // front-right/base vertex
    const C = [210, 125];      // front apex
    const dx = 215;
    const dy = -62;
    const A2 = shiftPoint(A, dx, dy);
    const B2 = shiftPoint(B, dx, dy);
    const C2 = shiftPoint(C, dx, dy);

    // Fill visible faces first without outlines. Edges are then drawn explicitly
    // so only the triangular-prism hidden/rear edges are dotted.
    addPoly(svg, [A, B, B2, A2], { fill: BLUE_SIDE, stroke: "none", width: 0 });
    addPoly(svg, [B, C, C2, B2], { fill: BLUE_TOP, stroke: "none", width: 0 });
    addPoly(svg, [A, B, C], { fill: BLUE_FILL, stroke: "none", width: 0 });
    addPoly(svg, [A2, B2, C2], { fill: "none", stroke: "none", width: 0 });

    // Hidden/rear edges for the triangular prism, matching the annotated model.
    // These are the only solid-specific changes in this update.
    const hidden = { stroke: INK, width: 2, dash: "8 8" };
    addLine(svg, A[0], A[1], A2[0], A2[1], hidden);     // lower rear connector
    addLine(svg, A2[0], A2[1], B2[0], B2[1], hidden);   // rear base edge
    addLine(svg, A2[0], A2[1], C2[0], C2[1], hidden);   // rear triangular edge

    // Visible outside edges.
    addLine(svg, A[0], A[1], B[0], B[1]);
    addLine(svg, B[0], B[1], C[0], C[1]);
    addLine(svg, C[0], C[1], A[0], A[1]);
    addLine(svg, B[0], B[1], B2[0], B2[1]);
    addLine(svg, C[0], C[1], C2[0], C2[1]);
    addLine(svg, C2[0], C2[1], B2[0], B2[1]);
    addLine(svg, B2[0], B2[1], B[0], B[1]);

    // Perpendicular height marker on the front triangle.
    addLine(svg, C[0], C[1], C[0], A[1], { dash: "8 8", width: 2 });

    addText(svg, `${base} ${unit}`, (A[0] + B[0]) / 2, A[1] + 35, { size: 22 });
    // Height label: left of the sloping edge at half height, right-aligned, so it never straddles a line.
    addText(svg, `${height} ${unit}`, Math.min(C[0], (A[0] + C[0]) / 2) - 10, (C[1] + A[1]) / 2, { size: 22, anchor: "end" });
    addText(svg, `${length} ${unit}`, 465, 172, { size: 22 });
    node.appendChild(svg);
  }

  function renderQuadrilateralPrism(node, config) {
    const svg = makeSvg();
    const { kind = "trapezium", unit = "cm", length = 10 } = config;

    if (kind === "trapezium") {
      // Draw the front trapezium as the key cross-section, then extrude it
      // backwards. The perpendicular height is shown inside with arrows and
      // the prism length/depth is kept outside the solid so it cannot be
      // confused with a sloping edge.
      const x = 130;
      const y = 118;
      const dx = 205;
      const dy = -48;
      const bottom = [[x, y + 190], [x + 260, y + 190]];
      const top = [[x + 70, y + 55], [x + 195, y + 55]];
      const pts = [bottom[0], bottom[1], top[1], top[0]];
      const back = pts.map(pt => shiftPoint(pt, dx, dy));

      addPoly(svg, [pts[1], back[1], back[2], pts[2]], { fill: BLUE_SIDE });
      addPoly(svg, [pts[2], back[2], back[3], pts[3]], { fill: BLUE_TOP });
      addPoly(svg, pts, { fill: BLUE_FILL });
      addLine(svg, pts[0][0], pts[0][1], back[0][0], back[0][1], { stroke: RED, width: 2, dash: "8 8" });
      addLine(svg, back[0][0], back[0][1], back[1][0], back[1][1], { stroke: RED, width: 2, dash: "8 8" });
      addLine(svg, back[0][0], back[0][1], back[3][0], back[3][1], { stroke: RED, width: 2, dash: "8 8" });
      addLine(svg, pts[3][0], pts[3][1], back[3][0], back[3][1]);
      addLine(svg, pts[2][0], pts[2][1], back[2][0], back[2][1]);
      addLine(svg, pts[1][0], pts[1][1], back[1][0], back[1][1]);

      addText(svg, `${config.top} ${unit}`, x + 132, y + 28, { size: 20 });
      addText(svg, `${config.bottom} ${unit}`, x + 130, y + 225, { size: 20 });

      const heightX = x + 154;
      addLine(svg, heightX, y + 55, heightX, y + 190, { stroke: INK, width: 2, dash: "7 7" });
      addArrowDim(svg, heightX + 28, y + 60, heightX + 28, y + 185, `${config.height} ${unit}`, {
        labelOffset: 18,
        size: 19,
        width: 2,
        arrowSize: 8
      });
      addLine(svg, heightX, y + 190, heightX + 22, y + 190, { stroke: INK, width: 2, dash: "7 7" });
      addLine(svg, heightX, y + 55, heightX + 22, y + 55, { stroke: INK, width: 2, dash: "7 7" });

      addArrowDim(svg, pts[1][0], pts[1][1] + 14, back[1][0], back[1][1] + 14, `${length} ${unit}`, {
        offset: 44,
        labelOffset: 12,
        size: 20,
        width: 2,
        arrowSize: 8
      });
      node.appendChild(svg);
      return;
    }

    const x = 145, y = 112, dx = 225, dy = -52;
    let pts;
    if (kind === "parallelogram") pts = [[x, y + 165], [x + 180, y + 165], [x + 230, y + 55], [x + 50, y + 55]];
    else pts = [[x + 105, y + 15], [x + 200, y + 110], [x + 105, y + 205], [x + 10, y + 110]];

    // Use the cleaned edge renderer so rear/lower edges that are not visible
    // are dotted. This avoids the old diagram reading as a wireframe with too
    // many solid internal edges.
    const hiddenConnectors = kind === "parallelogram" ? [0] : [3];
    const hiddenBackEdges = kind === "parallelogram"
      ? [edgeKey(0, 4), edgeKey(3, 4)]
      // For rhombus/kite-style prisms, the rear lower-left edge is hidden
      // behind the solid and should be dotted. Keep other visible outside
      // edges solid.
      : [edgeKey(3, 4), edgeKey(2, 4)];
    const { back } = drawExtrudedPolygonClean(svg, pts, dx, dy, {
      hiddenConnectors,
      hiddenBackEdges,
      fill: BLUE_FILL,
      sideFill: BLUE_SIDE,
      topFill: BLUE_TOP,
      hiddenStroke: INK,
      hiddenDash: "8 8"
    });

    if (kind === "parallelogram") {
      addText(svg, `${config.base} ${unit}`, x + 90, y + 200, { size: 20 });
      addArrowDim(svg, x + 132, y + 165, x + 132, y + 55, `${config.height} ${unit}`, { labelOffset: 22, size: 19 });
    } else {
      addLine(svg, x + 105, y + 15, x + 105, y + 205, { dash: "8 8", width: 2 });
      addLine(svg, x + 10, y + 110, x + 200, y + 110, { dash: "8 8", width: 2 });
      addText(svg, `${config.d1} ${unit}`, x + 105, y + 230, { size: 20 });
      addText(svg, `${config.d2} ${unit}`, x - 28, y + 110, { size: 20 });
    }
    // Keep the extrusion length outside the solid. For rhombus/kite prisms,
    // use the lower extrusion edge so the label does not collide with the body.
    const lenStart = kind === "parallelogram" ? pts[1] : pts[2];
    const lenEnd = kind === "parallelogram" ? back[1] : back[2];
    addArrowDim(svg, lenStart[0], lenStart[1] + 12, lenEnd[0], lenEnd[1] + 12, `${length} ${unit}`, {
      offset: kind === "parallelogram" ? 58 : 76,
      labelOffset: kind === "parallelogram" ? 16 : 28,
      labelDy: kind === "parallelogram" ? 0 : 6,
      size: 20,
      arrowSize: 8
    });
    node.appendChild(svg);
  }


  function renderCompositePrism(node, config) {
    const svg = makeSvg();
    const { kind = "l-block", unit = "cm" } = config;

    if (kind === "l-block" || kind === "stepped-block") {
      // Draw an extruded L/step cross-section with dimensions that make the
      // decomposition solvable. Earlier versions gave the overall prism but
      // did not clearly show the upper length/step height.
      const x = 120;
      const y = 88;
      const dx = 118;
      const dy = -54;
      const frontW = 340;
      const totalHPx = 218;
      let upperW;
      let lowerTopY;
      let pts;

      if (kind === "l-block") {
        upperW = Math.max(90, Math.min(250, frontW * (config.split / config.length)));
        lowerTopY = y + totalHPx * (1 - config.heightA / config.heightB);
        pts = [
          [x, y + totalHPx],
          [x + frontW, y + totalHPx],
          [x + frontW, lowerTopY],
          [x + upperW, lowerTopY],
          [x + upperW, y],
          [x, y]
        ];
      } else {
        upperW = Math.max(90, Math.min(260, frontW * (config.upperLength / config.lowerLength)));
        const lowerHPx = Math.max(84, Math.min(130, totalHPx * (config.lowerHeight / (config.lowerHeight + config.upperHeight))));
        lowerTopY = y + totalHPx - lowerHPx;
        pts = [
          [x, y + totalHPx],
          [x + frontW, y + totalHPx],
          [x + frontW, lowerTopY],
          [x + upperW, lowerTopY],
          [x + upperW, y],
          [x, y]
        ];
      }

      const { back } = drawExtrudedPolygonClean(svg, pts, dx, dy, {
        hiddenVertex: 0,
        // Only the genuinely hidden rear-lower connector remains dotted.
        // The upper/recess edges are visible edges of the stepped solid, so
        // they need to be solid to match the intended 3D reading.
        hiddenConnectors: [0],
        hiddenBackEdges: [edgeKey(0, pts.length), edgeKey(5, pts.length)],
        hiddenStroke: INK,
        hiddenDash: "8 8"
      });

      // Visible step/recess edges. These used to be re-drawn as dotted
      // construction lines, which made the outer step appear hidden.
      addLine(svg, pts[3][0], pts[3][1], back[3][0], back[3][1], { stroke: INK, width: 3 });
      addLine(svg, back[3][0], back[3][1], back[2][0], back[2][1], { stroke: INK, width: 3 });

      const bottomY = y + totalHPx;
      const lowerHeightLabel = kind === "l-block" ? config.heightA : config.lowerHeight;
      const totalHeightLabel = kind === "l-block" ? config.heightB : config.lowerHeight + config.upperHeight;
      const fullLengthLabel = kind === "l-block" ? config.length : config.lowerLength;
      const upperLengthLabel = kind === "l-block" ? config.split : config.upperLength;

      addArrowDim(svg, x, bottomY + 18, x + frontW, bottomY + 18, `${fullLengthLabel} ${unit}`, {
        offset: 18,
        labelOffset: 10,
        size: 19,
        arrowSize: 8
      });
      addArrowDim(svg, x - 24, y, x - 24, bottomY, `${totalHeightLabel} ${unit}`, {
        labelOffset: -24,
        size: 19,
        arrowSize: 8
      });
      addArrowDim(svg, x + frontW + 22, lowerTopY, x + frontW + 22, bottomY, `${lowerHeightLabel} ${unit}`, {
        labelOffset: 22,
        size: 19,
        arrowSize: 8
      });
      addArrowDim(svg, x, y - 18, x + upperW, y - 18, `${upperLengthLabel} ${unit}`, {
        offset: -10,
        labelOffset: -8,
        size: 18,
        arrowSize: 7
      });
      if (kind === "stepped-block") {
        addArrowDim(svg, x + upperW + 24, y, x + upperW + 24, lowerTopY, `${config.upperHeight} ${unit}`, {
          labelOffset: 22,
          size: 18,
          arrowSize: 7
        });
      }
      addArrowDim(svg, pts[1][0], pts[1][1] + 14, back[1][0], back[1][1] + 14, `${config.width || config.depth} ${unit}`, {
        offset: 54,
        labelOffset: 18,
        size: 18,
        arrowSize: 8,
        width: 2
      });
    } else if (kind === "t-block") {
      // T-shaped composite prism. Draw only the visible outside edges for this
      // solid. Earlier versions used generic hidden-edge logic that left dotted
      // construction lines across the top/right faces, making the solid look
      // broken. This version keeps the exterior right/back edges solid and
      // removes the stray dotted internal lines for this T-block only.
      const x = 130;
      const y = 105;
      const dx = 118;
      const dy = -54;
      const topW = 350;
      const topH = 68;
      const stemW = 112;
      const stemH = 132;
      const stemX = x + (topW - stemW) / 2;
      const pts = [
        [x, y + topH],
        [stemX, y + topH],
        [stemX, y + topH + stemH],
        [stemX + stemW, y + topH + stemH],
        [stemX + stemW, y + topH],
        [x + topW, y + topH],
        [x + topW, y],
        [x, y]
      ];
      const back = pts.map(p => shiftPoint(p, dx, dy));
      const n = pts.length;

      // Fill faces first without outlines, then deliberately draw the edges.
      for (let i = 0; i < n; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const c = back[(i + 1) % n];
        const d = back[i];
        addPoly(svg, [a, b, c, d], {
          fill: i % 2 ? BLUE_SIDE : BLUE_TOP,
          stroke: "none",
          width: 0
        });
      }

      // Visible back/right edges only.  No dotted construction lines are drawn
      // for this T-block, matching the cleaner reference layout.
      addLine(svg, back[7][0], back[7][1], back[6][0], back[6][1], { stroke: INK, width: 3 });
      addLine(svg, pts[7][0], pts[7][1], back[7][0], back[7][1], { stroke: INK, width: 3 });
      addLine(svg, pts[6][0], pts[6][1], back[6][0], back[6][1], { stroke: INK, width: 3 });
      addLine(svg, back[6][0], back[6][1], back[5][0], back[5][1], { stroke: INK, width: 3 });
      addLine(svg, pts[5][0], pts[5][1], back[5][0], back[5][1], { stroke: INK, width: 3 });
      addLine(svg, pts[4][0], pts[4][1], back[4][0], back[4][1], { stroke: INK, width: 3 });
      addLine(svg, back[4][0], back[4][1], back[3][0], back[3][1], { stroke: INK, width: 3 });
      addLine(svg, pts[3][0], pts[3][1], back[3][0], back[3][1], { stroke: INK, width: 3 });

      // Front T cross-section last so its boundary stays dominant.
      addPoly(svg, pts, { fill: BLUE_FILL, stroke: INK, width: 3 });

      addText(svg, `${config.topLength} ${unit}`, x + topW / 2, y - 30, { size: 20 });
      addText(svg, `${config.topWidth} ${unit}`, x - 34, y + topH / 2, { size: 20 });
      addText(svg, `${config.stemWidth} ${unit}`, stemX + stemW / 2, y + topH + stemH + 38, { size: 20 });
      addText(svg, `${config.stemLength} ${unit}`, stemX - 36, y + topH + stemH / 2, { size: 20 });
      addArrowDim(svg, pts[5][0], pts[5][1] + 14, back[5][0], back[5][1] + 14, `${config.depth} ${unit}`, {
        offset: 50,
        labelOffset: 18,
        size: 18,
        arrowSize: 8,
        width: 2
      });
    } else {
      // Notched rectangular prism. Draw the actual remaining solid rather than
      // a full cuboid with a floating dashed box. The cut-out is a rectangular
      // prism removed from the top-right of the front cross-section and runs
      // through the full depth.
      const x = 150;
      const y = 110;
      const w = 330;
      const h = 180;
      const dx = 96;
      const dy = -46;
      const cutW = Math.max(70, Math.min(140, w * (config.cutLength / config.length)));
      const cutH = Math.max(46, Math.min(92, h * (config.cutHeight / config.height)));
      const pts = [
        [x, y + h],
        [x + w, y + h],
        [x + w, y + cutH],
        [x + w - cutW, y + cutH],
        [x + w - cutW, y],
        [x, y]
      ];
      const { back } = drawExtrudedPolygonClean(svg, pts, dx, dy, {
        hiddenVertex: 0,
        hiddenConnectors: [0],
        hiddenBackEdges: [edgeKey(0, pts.length), edgeKey(5, pts.length)],
        hiddenStroke: INK,
        hiddenDash: "8 8"
      });

      // Do not draw a red construction box or "cut-out" label.  The notch shape
      // and the two given cut dimensions are enough for students to infer the
      // removed prism without cluttering the diagram.

      addText(svg, `${config.length} ${unit}`, x + w / 2, y + h + 42, { size: 20 });
      addText(svg, `${config.height} ${unit}`, x - 38, y + h / 2, { size: 20 });
      addArrowDim(svg, pts[1][0], pts[1][1] + 14, back[1][0], back[1][1] + 14, `${config.width} ${unit}`, {
        offset: 42,
        labelOffset: 18,
        size: 18,
        arrowSize: 8
      });
      // Cut-out dimensions are attached to the front notch itself, not floating on
      // the outer body. This keeps the teacher-facing diagram readable and makes
      // clear that these dimensions describe the removed prism.
      addArrowDim(svg, x + w - cutW + 6, y + cutH - 18, x + w - 6, y + cutH - 18, `${config.cutLength} ${unit}`, {
        size: 17,
        arrowSize: 7,
        width: 2,
        labelBackground: SOFT
      });
      addArrowDim(svg, x + w - cutW - 24, y + 6, x + w - cutW - 24, y + cutH - 6, `${config.cutHeight} ${unit}`, {
        labelOffset: -22,
        size: 17,
        arrowSize: 7,
        width: 2,
        labelBackground: SOFT
      });
    }
    node.appendChild(svg);
  }

  function renderCylinder(node, config) {
    const svg = makeSvg();
    const { radius = 4, diameter = null, height = 12, unit = "cm", orientation = "vertical" } = config;
    if (orientation === "horizontal" || orientation === "slanted") {
      drawHorizontalCylinder(svg, 165, 210, 315, 45, 78, { slant: orientation === "slanted" ? -35 : 0 });
      addText(svg, `${height} ${unit}`, 323, orientation === "slanted" ? 75 : 95, { size: 22 });
      addText(svg, diameter ? `d = ${diameter} ${unit}` : `r = ${radius} ${unit}`, 322, orientation === "slanted" ? 338 : 345, { size: 22 });
    } else {
      drawVerticalCylinder(svg, 360, 100, 300, 96, 28);
      addText(svg, `${height} ${unit}`, 515, 200, { size: 22 });
      addText(svg, diameter ? `d = ${diameter} ${unit}` : `r = ${radius} ${unit}`, 360, 360, { size: 22 });
    }
    node.appendChild(svg);
  }


  function renderPartCirclePrism(node, config) {
    const svg = makeSvg();
    const { kind = "semicircle", radius = 6, angle = 180, length = 10, unit = "cm" } = config;
    const dx = 230, dy = -54;

    if (kind === "semicircle") {
      // Half-cylinder prism. The front face is a true semicircle. The curved
      // rectangular surface is filled, while only the genuinely hidden rear
      // details are dotted. This matches the intended textbook view:
      // - front semicircle solid,
      // - rear/right outside curve solid where visible,
      // - rear/left curve dotted where it sits behind the curved surface,
      // - curved surface clearly shaded.
      const cx = 225;
      const cy = 286;
      const r = 98;
      const L = [cx - r, cy];
      const R = [cx + r, cy];
      const T = [cx, cy - r];
      const C = [cx, cy];
      const L2 = shiftPoint(L, dx, dy);
      const R2 = shiftPoint(R, dx, dy);
      const T2 = shiftPoint(T, dx, dy);
      const C2 = shiftPoint(C, dx, dy);

      // Rear semi-circular end and flat diameter/base surface fills.
      addPath(svg, `M${L2[0]} ${L2[1]} A${r} ${r} 0 0 1 ${R2[0]} ${R2[1]} L${L2[0]} ${L2[1]} Z`, {
        fill: ORANGE_SIDE,
        stroke: "none",
        width: 0
      });
      addPoly(svg, [L, R, R2, L2], { fill: ORANGE_SIDE, stroke: "none", width: 0 });

      // Curved surface between the two semicircular cross-sections. Draw this
      // after the flat base so the roof is visibly shaded, not just outlined.
      // It is split into left/right halves so the SVG arc fill cannot self-cancel
      // and leave a white notch near the front curve.
      addPath(svg, `M${L[0]} ${L[1]} A${r} ${r} 0 0 1 ${T[0]} ${T[1]} L${T2[0]} ${T2[1]} A${r} ${r} 0 0 0 ${L2[0]} ${L2[1]} Z`, {
        fill: "#fde0c7",
        stroke: "none",
        width: 0
      });
      addPath(svg, `M${T[0]} ${T[1]} A${r} ${r} 0 0 1 ${R[0]} ${R[1]} L${R2[0]} ${R2[1]} A${r} ${r} 0 0 0 ${T2[0]} ${T2[1]} Z`, {
        fill: "#fde0c7",
        stroke: "none",
        width: 0
      });

      // Hidden/rear information. The left half of the rear curved edge is behind
      // the curved surface, so it is dashed. The right half is visible and is
      // drawn solid later. This fixes the recurring "wrong edge dotted" issue.
      addLine(svg, L[0], L[1], L2[0], L2[1], { stroke: RED, width: 2, dash: "7 7" });
      addLine(svg, L2[0], L2[1], R2[0], R2[1], { stroke: RED, width: 2, dash: "7 7" });
      addLine(svg, T2[0], T2[1], C2[0], C2[1], { stroke: RED, width: 2, dash: "7 7" });
      addPath(svg, `M${L2[0]} ${L2[1]} A${r} ${r} 0 0 1 ${T2[0]} ${T2[1]}`, { stroke: RED, width: 2, dash: "7 7" });

      // Visible outside silhouette and longitudinal edges.
      addPath(svg, `M${T2[0]} ${T2[1]} A${r} ${r} 0 0 1 ${R2[0]} ${R2[1]}`, { stroke: RED, width: 3 });
      addLine(svg, R[0], R[1], R2[0], R2[1], { stroke: RED, width: 3 });
      addLine(svg, T[0], T[1], T2[0], T2[1], { stroke: RED, width: 3 });

      // Front face last: full shaded semicircle with a clear diameter.
      addPath(svg, `M${L[0]} ${L[1]} A${r} ${r} 0 0 1 ${R[0]} ${R[1]} L${L[0]} ${L[1]} Z`, {
        fill: "#fde7d3",
        stroke: RED,
        width: 3
      });
      addLine(svg, L[0], L[1], R[0], R[1], { stroke: RED, width: 3 });

      // Radius belongs inside the front semicircle, not floating outside.
      addArrowDim(svg, C[0], C[1] - 2, T[0], T[1] + 8, `r = ${radius} ${unit}`, {
        labelOffset: -28,
        labelDx: -2,
        size: 18,
        arrowSize: 7,
        width: 2,
        labelBackground: "#fde7d3"
      });
      addArrowDim(svg, R[0], R[1] + 18, R2[0], R2[1] + 18, `${length} ${unit}`, {
        offset: 34,
        labelOffset: 18,
        size: 20,
        arrowSize: 8
      });
    } else if (kind === "quadrant") {
      // Quarter-cylinder / quadrant prism.  This is drawn manually rather than
      // using a generic sector because the visible/hidden edges are easy to
      // misread.  The outside curved edge is solid; only the rear internal
      // radius edges are dotted.  Both right-angle markers are shown so it is
      // clear that the cross-section is one quarter of a cylinder.
      const cx = 170, cy = 318, r = 128;
      const A = [cx, cy];          // front centre / right-angle corner
      const B = [cx, cy - r];      // front vertical radius end
      const C = [cx + r, cy];      // front horizontal radius end
      const A2 = shiftPoint(A, dx, dy);
      const B2 = shiftPoint(B, dx, dy);
      const C2 = shiftPoint(C, dx, dy);

      // Filled faces first.
      addPath(svg, `M${A2[0]} ${A2[1]} L${B2[0]} ${B2[1]} A${r} ${r} 0 0 1 ${C2[0]} ${C2[1]} Z`, {
        fill: ORANGE_SIDE,
        stroke: "none",
        width: 0
      });
      addPath(svg, `M${B[0]} ${B[1]} A${r} ${r} 0 0 1 ${C[0]} ${C[1]} L${C2[0]} ${C2[1]} A${r} ${r} 0 0 0 ${B2[0]} ${B2[1]} Z`, {
        fill: ORANGE_FILL,
        stroke: "none",
        width: 0
      });
      addPoly(svg, [A, B, B2, A2], { fill: ORANGE_SIDE, stroke: "none", width: 0 });
      addPoly(svg, [A, C, C2, A2], { fill: ORANGE_SIDE, stroke: "none", width: 0 });

      // Hidden rear/internal radius edges.  Do not draw a dashed rear curved
      // arc; that was the stray curve that made the old diagram confusing.
      addLine(svg, A2[0], A2[1], B2[0], B2[1], { stroke: RED, width: 2, dash: "7 7" });
      addLine(svg, A2[0], A2[1], C2[0], C2[1], { stroke: RED, width: 2, dash: "7 7" });
      // The inside corner travels along the length of the prism, but is hidden
      // by the shaded curved surface. Keep this as the single missing hidden
      // longitudinal edge rather than adding any extra rear curved arcs.
      addLine(svg, A[0], A[1], A2[0], A2[1], { stroke: RED, width: 2, dash: "7 7" });

      // Visible outside silhouette and longitudinal edges.
      addLine(svg, A[0], A[1], B[0], B[1], { stroke: RED, width: 3 });
      addLine(svg, A[0], A[1], C[0], C[1], { stroke: RED, width: 3 });
      addPath(svg, `M${B[0]} ${B[1]} A${r} ${r} 0 0 1 ${C[0]} ${C[1]}`, { stroke: RED, width: 3 });
      addLine(svg, B[0], B[1], B2[0], B2[1], { stroke: RED, width: 3 });
      addLine(svg, C[0], C[1], C2[0], C2[1], { stroke: RED, width: 3 });
      addPath(svg, `M${B2[0]} ${B2[1]} A${r} ${r} 0 0 1 ${C2[0]} ${C2[1]}`, { stroke: RED, width: 3 });

      // Small right-angle markers at the front and rear cross-sections.
      const q = 18;
      addPath(svg, `M${A[0]} ${A[1] - q} L${A[0] + q} ${A[1] - q} L${A[0] + q} ${A[1]}`, { stroke: RED, width: 3 });
      addPath(svg, `M${A2[0]} ${A2[1] - q} L${A2[0] + q} ${A2[1] - q} L${A2[0] + q} ${A2[1]}`, { stroke: RED, width: 2, dash: "7 7" });

      addArrowDim(svg, A[0], A[1] + 14, C[0], C[1] + 14, `r = ${radius} ${unit}`, {
        offset: 18,
        labelOffset: 16,
        size: 18,
        arrowSize: 7,
        labelBackground: "#fde7d3"
      });
      addArrowDim(svg, C[0], C[1] + 10, C2[0], C2[1] + 10, `${length} ${unit}`, {
        offset: 30,
        labelOffset: 16,
        size: 20,
        arrowSize: 8
      });
    } else {
      const cx = 190, cy = 250, r = 118;
      const start = -90;
      const end = start + Number(angle || 90);
      const p1 = polar(cx, cy, r, start);
      const p2 = polar(cx, cy, r, end);
      const c2 = [cx + dx, cy + dy];
      const p12 = shiftPoint(p1, dx, dy);
      const p22 = shiftPoint(p2, dx, dy);

      // Full shaded sector solid. Back edges are dashed; no internal dotted
      // radius is used unless it is an actual hidden rear edge.
      addPath(svg, `M${p1[0]} ${p1[1]} A${r} ${r} 0 ${Math.abs(end - start) > 180 ? 1 : 0} 1 ${p2[0]} ${p2[1]} L${p22[0]} ${p22[1]} A${r} ${r} 0 ${Math.abs(end - start) > 180 ? 1 : 0} 0 ${p12[0]} ${p12[1]} Z`, {
        fill: ORANGE_FILL,
        stroke: RED,
        width: 3
      });
      addPath(svg, `M${cx} ${cy} L${p1[0]} ${p1[1]} L${p12[0]} ${p12[1]} L${c2[0]} ${c2[1]} Z`, { fill: ORANGE_SIDE, stroke: RED, width: 3 });
      addPath(svg, `M${cx} ${cy} L${p2[0]} ${p2[1]} L${p22[0]} ${p22[1]} L${c2[0]} ${c2[1]} Z`, { fill: ORANGE_SIDE, stroke: RED, width: 3 });
      // Back sector as hidden reference.
      addPath(svg, sectorPath(c2[0], c2[1], r, start, end), { fill: "none", stroke: RED, width: 2, dash: "7 7" });
      // Front face.
      addPath(svg, sectorPath(cx, cy, r, start, end), { fill: "#fde7d3", stroke: RED, width: 3 });
      // Visible top edge along the extrusion at the first radius, which was
      // missing in some sector renders.
      addLine(svg, p1[0], p1[1], p12[0], p12[1], { stroke: RED, width: 3 });
      addLine(svg, p2[0], p2[1], p22[0], p22[1], { stroke: RED, width: 3 });

      addTextBox(svg, `r = ${radius} ${unit}`, cx - 40, cy - 28, { size: 20, background: "#fde7d3" });
      addPath(svg, arcPath(cx, cy, 48, start, end), { stroke: INK, width: 2 });
      addTextBox(svg, `${angle}°`, cx + 54, cy - 58, { size: 20, background: "#fde7d3" });
      addArrowDim(svg, p2[0], p2[1] + 8, p22[0], p22[1] + 8, `${length} ${unit}`, { offset: 18, labelOffset: 12, size: 20, arrowSize: 8 });
    }
    node.appendChild(svg);
  }

  function renderCompositeCylinder(node, config) {
    const svg = makeSvg();
    const { kind = "stacked", r1 = 5, h1 = 10, r2 = 3, h2 = 8, unit = "cm" } = config;
    if (kind === "stacked") {
      const cx = 350;
      const lowerTop = 232;
      const lowerBottom = 312;
      const upperTop = 104;
      const upperBottom = lowerTop;
      const lowerRx = 122;
      const lowerRy = 30;
      const upperRx = 72;
      const upperRy = 22;

      drawVerticalCylinder(svg, cx, lowerTop, lowerBottom, lowerRx, lowerRy, { fill: CYL_FILL, topFill: CYL_FILL });
      drawVerticalCylinder(svg, cx, upperTop, upperBottom, upperRx, upperRy, { fill: "#fff7f3", topFill: CYL_FILL, showBackBottom: false });
      addPath(svg, `M${cx - upperRx} ${upperBottom} A${upperRx} ${upperRy} 0 0 0 ${cx + upperRx} ${upperBottom}`, { stroke: RED, width: 3 });

      addArrowDim(svg, cx - upperRx, upperTop - 24, cx + upperRx, upperTop - 24, `${2 * r2} ${unit}`, { size: 18, arrowSize: 8 });
      addArrowDim(svg, cx + upperRx + 42, upperTop, cx + upperRx + 42, upperBottom, `${h2} ${unit}`, { labelOffset: 22, size: 18, arrowSize: 8 });
      addArrowDim(svg, cx - lowerRx, lowerBottom + 35, cx + lowerRx, lowerBottom + 35, `${2 * r1} ${unit}`, { size: 18, arrowSize: 8 });
      addArrowDim(svg, cx + lowerRx + 46, lowerTop, cx + lowerRx + 46, lowerBottom, `${h1} ${unit}`, { labelOffset: 24, size: 18, arrowSize: 8 });
    } else if (kind === "coaxial") {
      // Coaxial cylinders.  Layering is important here: draw the large-cylinder
      // join ring first, then draw the smaller cylinder over the middle of it.
      // That leaves the large outside curve solid, while the part hidden behind
      // the smaller cylinder is no longer incorrectly visible.
      const cy = 220;
      const largeX = 125;
      const largeLength = 255;
      const joinX = largeX + largeLength;
      const largeRx = 58;
      const largeRy = 108;
      const smallRx = 36;
      const smallRy = 58;
      const smallX = joinX - 2;
      const smallLength = 218;
      const smallRight = smallX + smallLength;

      // Fills.
      addPath(svg,
        `M${largeX} ${cy - largeRy} L${joinX} ${cy - largeRy} A${largeRx} ${largeRy} 0 0 1 ${joinX} ${cy + largeRy} L${largeX} ${cy + largeRy} A${largeRx} ${largeRy} 0 0 0 ${largeX} ${cy - largeRy} Z`,
        { fill: CYL_FILL, stroke: "none", width: 0 }
      );
      addEllipse(svg, joinX, cy, largeRx, largeRy, { fill: CYL_SIDE, stroke: "none", width: 0 });

      // Large cylinder visible and hidden edges.  The right/outside edge of the
      // large cylinder is solid; the left/back half of the join is dotted.
      addPath(svg, `M${largeX} ${cy + largeRy} C${largeX - largeRx} ${cy + largeRy * 0.62} ${largeX - largeRx} ${cy - largeRy * 0.62} ${largeX} ${cy - largeRy}`, { stroke: RED, width: 3 });
      addPath(svg, `M${largeX} ${cy + largeRy} C${largeX + largeRx} ${cy + largeRy * 0.62} ${largeX + largeRx} ${cy - largeRy * 0.62} ${largeX} ${cy - largeRy}`, { stroke: RED, width: 2, dash: "8 8" });
      addLine(svg, largeX, cy - largeRy, joinX, cy - largeRy, { stroke: RED, width: 3 });
      addLine(svg, largeX, cy + largeRy, joinX, cy + largeRy, { stroke: RED, width: 3 });
      addPath(svg, `M${joinX} ${cy - largeRy} C${joinX + largeRx} ${cy - largeRy * 0.62} ${joinX + largeRx} ${cy + largeRy * 0.62} ${joinX} ${cy + largeRy}`, { stroke: RED, width: 3 });
      // The visible outside edge of the large cylinder's join face is solid.
      // Only the smaller cylinder entry curve carries the hidden/dotted cue.
      addPath(svg, `M${joinX} ${cy - largeRy} C${joinX - largeRx} ${cy - largeRy * 0.62} ${joinX - largeRx} ${cy + largeRy * 0.62} ${joinX} ${cy + largeRy}`, { stroke: RED, width: 3 });

      // Smaller cylinder fill overlays the middle of the large-cylinder join,
      // so the join behaves like the hand-corrected reference image.
      addPath(svg,
        `M${smallX} ${cy - smallRy} L${smallRight} ${cy - smallRy} A${smallRx} ${smallRy} 0 0 1 ${smallRight} ${cy + smallRy} L${smallX} ${cy + smallRy} Z`,
        { fill: "#fff0eb", stroke: "none", width: 0 }
      );

      // Smaller cylinder edges. The small cylinder's entry face is split:
      // the near/front half is solid, while the rear half is dotted because it
      // sits behind the cylinder body. This fixes the recurring coaxial diagram
      // issue without changing the standalone cylinder renderer.
      addLine(svg, smallX, cy - smallRy, smallRight, cy - smallRy, { stroke: RED, width: 3 });
      addLine(svg, smallX, cy + smallRy, smallRight, cy + smallRy, { stroke: RED, width: 3 });
      addPath(svg, `M${smallX} ${cy - smallRy} C${smallX - smallRx * 0.55} ${cy - smallRy * 0.38} ${smallX - smallRx * 0.55} ${cy + smallRy * 0.38} ${smallX} ${cy + smallRy}`, { stroke: RED, width: 3 });
      addPath(svg, `M${smallX} ${cy - smallRy} C${smallX + smallRx * 0.55} ${cy - smallRy * 0.38} ${smallX + smallRx * 0.55} ${cy + smallRy * 0.38} ${smallX} ${cy + smallRy}`, { stroke: RED, width: 2, dash: "8 8" });
      addEllipse(svg, smallRight, cy, smallRx, smallRy, { fill: CYL_FILL, stroke: RED, width: 3 });

      addArrowDim(svg, largeX - largeRx - 22, cy - largeRy, largeX - largeRx - 22, cy + largeRy, `${2 * r1} ${unit}`, { labelOffset: -28, size: 18, arrowSize: 8 });
      addArrowDim(svg, largeX, cy + largeRy + 16, joinX, cy + largeRy + 16, `${h1} ${unit}`, { size: 18, arrowSize: 8 });
      addArrowDim(svg, smallRight + smallRx + 22, cy - smallRy, smallRight + smallRx + 22, cy + smallRy, `${2 * r2} ${unit}`, { labelOffset: 30, size: 18, arrowSize: 8 });
      addArrowDim(svg, smallX, cy - smallRy - 30, smallRight, cy - smallRy - 30, `${h2} ${unit}`, { size: 18, arrowSize: 8 });
    } else {
      const cy = 220;
      const largeX = 145;
      const largeLength = 220;
      const joinX = largeX + largeLength + 22;
      drawHorizontalCylinder(svg, largeX, cy, largeLength, 50, 90, { fill: CYL_FILL, endFill: CYL_SIDE });
      drawHorizontalCylinder(svg, joinX - 8, cy, 185, 42, 72, { fill: "#fff0eb", endFill: CYL_FILL });
      addLine(svg, largeX + largeLength, cy - 90, joinX, cy - 72, { stroke: RED, width: 3 });
      addLine(svg, largeX + largeLength, cy + 90, joinX, cy + 72, { stroke: RED, width: 3 });
      addArrowDim(svg, largeX - 45, cy - 90, largeX - 45, cy + 90, `${2 * r1} ${unit}`, { labelOffset: -26, size: 18, arrowSize: 8 });
      addArrowDim(svg, largeX, cy + 113, largeX + largeLength, cy + 113, `${h1} ${unit}`, { size: 18, arrowSize: 8 });
      addArrowDim(svg, joinX + 185 + 45, cy - 72, joinX + 185 + 45, cy + 72, `${2 * r2} ${unit}`, { labelOffset: 28, size: 18, arrowSize: 8 });
      addArrowDim(svg, joinX, cy - 104, joinX + 185, cy - 104, `${h2} ${unit}`, { size: 18, arrowSize: 8 });
    }
    node.appendChild(svg);
  }


  function renderPrismCylinderComposite(node, config) {
    const svg = makeSvg();
    const { kind = "cylinder-on-box", unit = "cm" } = config;
    if (kind === "half-cylinder-on-prism") {
      // Composite made from a rectangular prism plus a half-cylinder. The front
      // cross-section is drawn as a rectangle with a true semicircle on top.
      // The roof is shaded as a continuous curved surface, and the rear curve is
      // split into visible/dotted parts so the solid reads correctly in print.
      const x = 168;
      const yTop = 218;
      const yBot = 306;
      const faceW = 210;
      const r = faceW / 2;
      const arcH = 105;
      const dx = 210;
      const dy = -52;
      const L = [x, yTop];
      const R = [x + faceW, yTop];
      const BL = [x, yBot];
      const BR = [x + faceW, yBot];
      const T = [x + r, yTop - arcH];
      const C = [x + r, yTop];
      const L2 = shiftPoint(L, dx, dy);
      const R2 = shiftPoint(R, dx, dy);
      const BL2 = shiftPoint(BL, dx, dy);
      const BR2 = shiftPoint(BR, dx, dy);
      const T2 = shiftPoint(T, dx, dy);
      const C2 = shiftPoint(C, dx, dy);

      // Base prism fills without automatic outlines so we can control which
      // edges are visible and which are hidden.
      addPoly(svg, [BL, BR, BR2, BL2], { fill: BLUE_SIDE, stroke: "none", width: 0 });
      addPoly(svg, [R, R2, BR2, BR], { fill: BLUE_SIDE, stroke: "none", width: 0 });
      addPoly(svg, [L, R, BR, BL], { fill: BLUE_FILL, stroke: "none", width: 0 });

      // Rear half-cylinder end fill and curved roof fill. The roof is split into
      // two arc strips, matching the standalone half-cylinder renderer and
      // preventing the recurring unshaded white wedge.
      addPath(svg, `M${L2[0]} ${L2[1]} A${r} ${arcH} 0 0 1 ${R2[0]} ${R2[1]} L${R2[0]} ${R2[1]} L${L2[0]} ${L2[1]} Z`, {
        fill: ORANGE_SIDE,
        stroke: "none",
        width: 0
      });
      addPath(svg, `M${L[0]} ${L[1]} A${r} ${arcH} 0 0 1 ${T[0]} ${T[1]} L${T2[0]} ${T2[1]} A${r} ${arcH} 0 0 0 ${L2[0]} ${L2[1]} Z`, {
        fill: ORANGE_FILL,
        stroke: "none",
        width: 0
      });
      addPath(svg, `M${T[0]} ${T[1]} A${r} ${arcH} 0 0 1 ${R[0]} ${R[1]} L${R2[0]} ${R2[1]} A${r} ${arcH} 0 0 0 ${T2[0]} ${T2[1]} Z`, {
        fill: ORANGE_FILL,
        stroke: "none",
        width: 0
      });

      // Hidden base/rear edges of the rectangular prism.
      addLine(svg, BL[0], BL[1], BL2[0], BL2[1], { stroke: INK, width: 2, dash: "8 8" });
      addLine(svg, BL2[0], BL2[1], BR2[0], BR2[1], { stroke: INK, width: 2, dash: "8 8" });
      addLine(svg, L2[0], L2[1], BL2[0], BL2[1], { stroke: INK, width: 2, dash: "8 8" });

      // Rear half-cylinder details: the left/back curve and rear diameter are
      // hidden; the outside/top-right curve is visible.
      addLine(svg, L2[0], L2[1], R2[0], R2[1], { stroke: RED, width: 2, dash: "7 7" });
      addLine(svg, T2[0], T2[1], C2[0], C2[1], { stroke: RED, width: 2, dash: "7 7" });
      addPath(svg, `M${L2[0]} ${L2[1]} A${r} ${arcH} 0 0 1 ${T2[0]} ${T2[1]}`, { stroke: RED, width: 2, dash: "7 7" });
      addPath(svg, `M${T2[0]} ${T2[1]} A${r} ${arcH} 0 0 1 ${R2[0]} ${R2[1]}`, { stroke: RED, width: 3 });

      // Visible base edges.
      addLine(svg, R[0], R[1], R2[0], R2[1], { stroke: INK, width: 3 });
      addLine(svg, R2[0], R2[1], BR2[0], BR2[1], { stroke: INK, width: 3 });
      addLine(svg, BR[0], BR[1], BR2[0], BR2[1], { stroke: INK, width: 3 });
      addLine(svg, BL[0], BL[1], BR[0], BR[1], { stroke: INK, width: 3 });
      addLine(svg, R[0], R[1], BR[0], BR[1], { stroke: INK, width: 3 });

      // Visible longitudinal roof edges.
      addLine(svg, R[0], R[1], R2[0], R2[1], { stroke: RED, width: 3 });
      addLine(svg, T[0], T[1], T2[0], T2[1], { stroke: RED, width: 3 });
      // Left roof edge is largely behind the curved surface, so keep it hidden.
      addLine(svg, L[0], L[1], L2[0], L2[1], { stroke: RED, width: 2, dash: "7 7" });

      // Front face last: rectangle plus true semicircle, all shaded.
      addPath(svg, `M${L[0]} ${L[1]} A${r} ${arcH} 0 0 1 ${R[0]} ${R[1]} L${BR[0]} ${BR[1]} L${BL[0]} ${BL[1]} Z`, {
        fill: "#fff0e4",
        stroke: RED,
        width: 3
      });
      addLine(svg, L[0], L[1], R[0], R[1], { stroke: RED, width: 3 });
      addLine(svg, L[0], L[1], BL[0], BL[1], { stroke: RED, width: 3 });
      addLine(svg, BL[0], BL[1], BR[0], BR[1], { stroke: RED, width: 3 });
      addLine(svg, R[0], R[1], BR[0], BR[1], { stroke: RED, width: 3 });

      // Dimensions: width/diameter on the front edge, length/depth outside, and
      // an internal radius indicator inside the semicircle.
      addText(svg, `${config.height} ${unit}`, x - 42, (yTop + yBot) / 2, { size: 20 });
      addArrowDim(svg, BL[0], BL[1] + 16, BR[0], BR[1] + 16, `${config.width || 2 * config.radius} ${unit}`, {
        offset: 18,
        labelOffset: 10,
        size: 18,
        arrowSize: 7,
        width: 2
      });
      addArrowDim(svg, BR[0] + 18, BR[1] + 12, BR2[0] + 18, BR2[1] + 12, `${config.length} ${unit}`, {
        offset: 34,
        labelOffset: 18,
        size: 18,
        arrowSize: 8,
        width: 2
      });
      addArrowDim(svg, x + r, yTop - 4, x + r, yTop - arcH + 6, `r = ${config.radius} ${unit}`, {
        labelOffset: -34,
        labelDx: -4,
        size: 17,
        arrowSize: 7,
        width: 2,
        labelBackground: "#fff0e4"
      });
    } else if (kind === "tank-on-stand") {
      drawCuboid(svg, 180, 235, 270, 78, 74, {
        length: `${config.length} ${unit}`,
        width: `${config.width} ${unit}`,
        height: `${config.height} ${unit}`
      }, { dy: -42 });
      const cx = 315;
      // Place the cylinder base on the visible top face of the prism rather than
      // above the back edge. This makes the solid read as one joined object.
      const baseY = 208;
      drawVerticalCylinder(svg, cx, 98, baseY, 70, 22, { fill: "#fff4ef", topFill: CYL_FILL, showBackBottom: false });
      addEllipse(svg, cx, baseY, 70, 22, { fill: "none", stroke: RED, width: 2, dash: "7 7" });
      addTextBox(svg, `r = ${config.radius} ${unit}`, cx, 62, { size: 18, background: SOFT });
      addArrowDim(svg, cx + 100, 98, cx + 100, baseY, `${config.cylLength} ${unit}`, { labelOffset: 24, size: 18, arrowSize: 8 });
    } else {
      drawCuboid(svg, 155, 238, 315, 75, 84, {
        length: `${config.length} ${unit}`,
        width: `${config.width} ${unit}`,
        height: `${config.height} ${unit}`
      }, { dy: -44 });
      const cx = 315;
      const baseY = 212;
      // The cylinder footprint now sits on the top plane of the prism.
      drawVerticalCylinder(svg, cx, 96, baseY, 72, 22, { fill: "#fff4ef", topFill: CYL_FILL, showBackBottom: false });
      addEllipse(svg, cx, baseY, 72, 22, { fill: "none", stroke: RED, width: 2, dash: "7 7" });
      addTextBox(svg, `r = ${config.radius} ${unit}`, cx, 62, { size: 18, background: SOFT });
      addArrowDim(svg, cx + 102, 96, cx + 102, baseY, `${config.cylLength} ${unit}`, { labelOffset: 24, size: 18, arrowSize: 8 });
    }
    node.appendChild(svg);
  }

  function renderCapacityTank(node, config) {
    const svg = makeSvg();
    const { length = 8, width = 4, height = 5, unit = "m", context = "container" } = config;
    const x = 175, y = 140, w = 305, h = 130, d = 88, dx = d, dy = -46;
    // Open-top tank/container with a full set of hidden inside edges, so
    // capacity questions clearly communicate length, width and height.
    addPoly(svg, [[x, y], [x + w, y], [x + w + dx, y + dy], [x + dx, y + dy]], { fill: "#f8fbff", stroke: INK, width: 3 });
    addPoly(svg, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { fill: BLUE_FILL, stroke: INK, width: 3 });
    addPoly(svg, [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]], { fill: BLUE_SIDE, stroke: INK, width: 3 });

    // Hidden/dotted inside dimensions and rear edges.
    addLine(svg, x + dx, y + dy, x + dx, y + h + dy, { stroke: RED, dash: "8 8", width: 2 });
    addLine(svg, x + dx, y + h + dy, x + w + dx, y + h + dy, { stroke: RED, dash: "8 8", width: 2 });
    addLine(svg, x + w + dx, y + dy, x + w + dx, y + h + dy, { stroke: RED, dash: "8 8", width: 2 });
    addLine(svg, x, y + h, x + dx, y + h + dy, { stroke: RED, dash: "8 8", width: 2 });
    addLine(svg, x + w, y + h, x + w + dx, y + h + dy, { stroke: RED, dash: "8 8", width: 2 });

    addText(svg, `${length} ${unit}`, x + w / 2, y + h + 40, { size: 20 });
    addText(svg, `${width} ${unit}`, x + w + dx + 34, y + h + dy / 2, { size: 20 });
    addText(svg, `${height} ${unit}`, x - 42, y + h / 2, { size: 20 });
    // No generic context label is drawn inside the diagram.
    node.appendChild(svg);
  }

  function renderPoolPath(node, config) {
    const svg = makeSvg();
    const { outerL, outerW, innerL, innerW, depth, unit = "m" } = config;
    addPath(svg, "M180 105 H535 V310 H180 Z", { fill: BLUE_FILL, stroke: INK, width: 3 });
    addPath(svg, "M250 155 H465 V260 H250 Z", { fill: "#ffffff", stroke: RED, width: 3 });
    addText(svg, `${outerL} ${unit}`, 360, 75, { size: 20 });
    addText(svg, `${outerW} ${unit}`, 555, 207, { size: 20 });
    addText(svg, `${innerL} ${unit}`, 360, 135, { size: 18 });
    addText(svg, `${innerW} ${unit}`, 232, 207, { size: 18 });
    addText(svg, `depth ${depth} ${unit}`, 360, 340, { size: 20 });
    node.appendChild(svg);
  }

  /*
    Unit cubes stacked on a grid (Stage 4 "volume by counting cubes").
    `heights` is rows front-to-back of columns left-to-right; each entry is the
    number of cubes in that stack. Oblique projection to the upper right, drawn
    back row first, left to right, bottom up, so nearer cubes cover farther.
  */
  function renderCubeArray(node, config) {
    const heights = Array.isArray(config.heights) && config.heights.length
      ? config.heights
      : [[2, 2, 2], [2, 2, 2]];
    const rows = heights.length;
    const cols = Math.max(...heights.map(r => r.length));
    const maxH = Math.max(...heights.flat());
    const s = Math.min(56, 300 / Math.max(cols + rows * 0.5, maxH + rows * 0.4));
    const ox = s * 0.5;
    const oy = -s * 0.36;
    const W = Math.round(cols * s + rows * ox + 60);
    const H = Math.round(maxH * s + rows * -oy + 60);
    const svg = makeSvg(W, H, "Unit cube stack");
    const baseX = 30;
    const baseY = H - 30;
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = 0; c < cols; c++) {
        const h = heights[r][c] || 0;
        for (let z = 0; z < h; z++) {
          const x = baseX + c * s + r * ox;
          const y = baseY - z * s + r * oy;
          // front face, top face, right face
          addPoly(svg, [[x, y], [x + s, y], [x + s, y - s], [x, y - s]], { fill: BLUE_FILL, stroke: INK, width: 2 });
          addPoly(svg, [[x, y - s], [x + s, y - s], [x + s + ox, y - s + oy], [x + ox, y - s + oy]], { fill: BLUE_TOP, stroke: INK, width: 2 });
          addPoly(svg, [[x + s, y], [x + s + ox, y + oy], [x + s + ox, y - s + oy], [x + s, y - s]], { fill: BLUE_SIDE, stroke: INK, width: 2 });
        }
      }
    }
    node.appendChild(svg);
  }

  function render(node, config = {}) {
    clear(node);
    const type = config.diagramType || "rectangular-prism";

    if (type === "rectangular-prism") return renderRectangularPrism(node, config);
    if (type === "uniform-cross-section") return renderUniformCrossSection(node, config);
    if (type === "triangular-prism") return renderTriangularPrism(node, config);
    if (type === "quadrilateral-prism") return renderQuadrilateralPrism(node, config);
    if (type === "composite-prism") return renderCompositePrism(node, config);
    if (type === "cylinder") return renderCylinder(node, config);
    if (type === "part-circle-prism") return renderPartCirclePrism(node, config);
    if (type === "composite-cylinder") return renderCompositeCylinder(node, config);
    if (type === "prism-cylinder-composite") return renderPrismCylinderComposite(node, config);
    if (type === "capacity-tank") return renderCapacityTank(node, config);
    if (type === "pool-path") return renderPoolPath(node, config);
    if (type === "cube-array") return renderCubeArray(node, config);

    node.innerHTML = `<div class="diagram-placeholder">Volume diagram unavailable</div>`;
  }

  window.MMT_VOLUME_ENGINE = { render };
})();
