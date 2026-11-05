/*
  CHHS Exam Builder — Pythagoras Diagram Engine
  ---------------------------------------------
  Save as:

  engines/pythagoras/pythagoras-engine.js

  Exposes:
  window.MMT_PYTHAGORAS_ENGINE.render(target, config)
*/

window.MMT_PYTHAGORAS_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW = { w: 340, h: 230 };

  const ROTATIONS = [0, 90, 180, 270, 18, -18, 162, -162];

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function choice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function fmt(n) {
    if (typeof n === "string") return n;
    return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : Number(n).toFixed(1);
  }

  function rotatePoint(p, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: p.x * cos - p.y * sin,
      y: p.x * sin + p.y * cos
    };
  }

  function transformTriangle(a, b, options = {}) {
    let points = [
      { name: "A", x: 0, y: 0 },
      { name: "B", x: b, y: 0 },
      { name: "C", x: 0, y: -a }
    ];

    if (Math.random() < 0.5) {
      points = points.map(p => ({ ...p, x: -p.x }));
    }

    const angle = choice(ROTATIONS) * Math.PI / 180;
    points = points.map(p => ({ ...p, ...rotatePoint(p, angle) }));

    const padding = Number.isFinite(Number(options.padding)) ? Number(options.padding) : 66;
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const rawW = maxX - minX || 1;
    const rawH = maxY - minY || 1;

    const scale = Math.min(
      (VIEW.w - 2 * padding) / rawW,
      (VIEW.h - 2 * padding) / rawH
    );

    points = points.map(p => ({
      ...p,
      x: (p.x - minX) * scale + (VIEW.w - rawW * scale) / 2,
      y: (p.y - minY) * scale + (VIEW.h - rawH * scale) / 2
    }));

    return Object.fromEntries(points.map(p => [p.name, p]));
  }

  function unitVector(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function rightAngleMarker(A, B, C) {
    const size = 13;
    const v1 = unitVector(A, B);
    const v2 = unitVector(A, C);

    const p1 = { x: A.x + v1.x * size, y: A.y + v1.y * size };
    const p2 = { x: p1.x + v2.x * size, y: p1.y + v2.y * size };
    const p3 = { x: A.x + v2.x * size, y: A.y + v2.y * size };

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
  }

  function rectIntersectsSegment(rect, p1, p2) {
    function pointInside(p) {
      return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
    }

    function ccw(A, B, C) {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }

    function segmentsIntersect(A, B, C, D) {
      return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
    }

    const corners = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.w, y: rect.y },
      { x: rect.x + rect.w, y: rect.y + rect.h },
      { x: rect.x, y: rect.y + rect.h }
    ];

    if (pointInside(p1) || pointInside(p2)) return true;

    for (let i = 0; i < 4; i++) {
      if (segmentsIntersect(p1, p2, corners[i], corners[(i + 1) % 4])) return true;
    }

    return false;
  }

  function rectsOverlap(r1, r2) {
    return !(
      r1.x + r1.w < r2.x ||
      r2.x + r2.w < r1.x ||
      r1.y + r1.h < r2.y ||
      r2.y + r2.h < r1.y
    );
  }

  function pointInTriangle(p, A, B, C) {
    const area = (P, Q, R) =>
      Math.abs((P.x * (Q.y - R.y) + Q.x * (R.y - P.y) + R.x * (P.y - Q.y)) / 2);

    const main = area(A, B, C);
    const a1 = area(p, B, C);
    const a2 = area(A, p, C);
    const a3 = area(A, B, p);

    return Math.abs(main - (a1 + a2 + a3)) < 0.6;
  }

  function makeLabelCandidate(p1, p2, text, centroid, t, off) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;

    let nx = -dy / len;
    let ny = dx / len;

    const mid = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };

    const toMid = {
      x: mid.x - centroid.x,
      y: mid.y - centroid.y
    };

    if (nx * toMid.x + ny * toMid.y < 0) {
      nx *= -1;
      ny *= -1;
    }

    const x = p1.x + dx * t + nx * off;
    const y = p1.y + dy * t + ny * off;
    const w = Math.max(30, String(text).length * 7.8 + 10);
    const h = 20;

    return {
      x,
      y,
      rect: {
        x: x - w / 2,
        y: y - h / 2,
        w,
        h
      },
      t,
      off
    };
  }

  function scoreLabelCandidate(candidate, allEdges, trianglePoints, placedRects) {
    const margin = 3;
    const safeRect = {
      x: candidate.rect.x - margin,
      y: candidate.rect.y - margin,
      w: candidate.rect.w + margin * 2,
      h: candidate.rect.h + margin * 2
    };

    const rectPoints = [
      { x: safeRect.x, y: safeRect.y },
      { x: safeRect.x + safeRect.w, y: safeRect.y },
      { x: safeRect.x + safeRect.w, y: safeRect.y + safeRect.h },
      { x: safeRect.x, y: safeRect.y + safeRect.h },
      { x: candidate.x, y: candidate.y }
    ];

    const insideHits = rectPoints.filter(pt => pointInTriangle(pt, trianglePoints[0], trianglePoints[1], trianglePoints[2])).length;
    const edgeHits = allEdges.filter(edge => rectIntersectsSegment(safeRect, edge[0], edge[1])).length;
    const labelHits = placedRects.filter(r => rectsOverlap(safeRect, r)).length;

    const outOfBounds =
      Math.max(0, 8 - candidate.rect.x) +
      Math.max(0, candidate.rect.x + candidate.rect.w - (VIEW.w - 8)) +
      Math.max(0, 8 - candidate.rect.y) +
      Math.max(0, candidate.rect.y + candidate.rect.h - (VIEW.h - 8));

    return (
      insideHits * 2500 +
      edgeHits * 1400 +
      labelHits * 2200 +
      outOfBounds * 10 +
      candidate.off * 2 +
      Math.abs(candidate.t - 0.5) * 45
    );
  }

  function labelForSide(p1, p2, text, centroid, allEdges, trianglePoints, placedRects) {
    const candidates = [];
    const alongPositions = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
    const offsets = [18, 23, 28, 33, 38, 44];

    for (const off of offsets) {
      for (const t of alongPositions) {
        candidates.push(makeLabelCandidate(p1, p2, text, centroid, t, off));
      }
    }

    let best = candidates[0];
    let bestScore = Infinity;

    for (const candidate of candidates) {
      const score = scoreLabelCandidate(candidate, allEdges, trianglePoints, placedRects);

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }

      if (score === candidate.off * 2 + Math.abs(candidate.t - 0.5) * 45 && candidate.off <= 34) break;
    }

    placedRects.push({
      x: best.rect.x - 4,
      y: best.rect.y - 4,
      w: best.rect.w + 8,
      h: best.rect.h + 8
    });

    return {
      text,
      x: best.x,
      y: best.y + 1
    };
  }

  function makeSvg() {
    const svg = el("svg", {
      viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
      width: "100%",
      height: "100%",
      class: "pythagoras-svg",
      role: "img",
      "aria-label": "right triangle diagram"
    });

    const style = el("style");
    style.textContent = `
      .pythagoras-svg{overflow:visible;background:#fff}
      .py-triangle,.py-line{stroke:#111827;stroke-width:2.25;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .py-right{stroke:#111827;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .py-construction{stroke:#111827;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:4 5}
      .py-highlight{stroke:#9f174a;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .py-wall-brick{fill:#ffffff;stroke:#111827;stroke-width:1.15}
      .py-label{font-family:"Cambria Math","Times New Roman",serif;font-size:14px;font-weight:600;dominant-baseline:middle;text-anchor:middle;fill:#111827;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
      .py-label.large{font-size:15.5px;font-weight:650}
      .py-label.small{font-size:12.5px;font-weight:500;stroke-width:2.4px}
      .py-label.italic{font-style:italic}
      .py-draw-box{fill:#fff;stroke:#111827;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
      .py-draw-guide{stroke:#cbd5e1;stroke-width:1;fill:none;stroke-dasharray:5 6}
      .py-draw-label{font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;fill:#64748b}
    `;
    svg.appendChild(style);
    return svg;
  }


  function addLine(svg, x1, y1, x2, y2, cls = "py-line") {
    svg.appendChild(el("line", { x1, y1, x2, y2, class: cls }));
  }

  function addPath(svg, d, cls = "py-line") {
    svg.appendChild(el("path", { d, class: cls }));
  }

  function addText(svg, text, x, y, cls = "py-label") {
    const node = el("text", { x, y, class: cls });
    node.textContent = text;
    svg.appendChild(node);
    return node;
  }

  function addRightMarker(svg, vertex, along1, along2, size = 14) {
    const v1 = unitVector(vertex, along1);
    const v2 = unitVector(vertex, along2);
    const p1 = { x: vertex.x + v1.x * size, y: vertex.y + v1.y * size };
    const p2 = { x: p1.x + v2.x * size, y: p1.y + v2.y * size };
    const p3 = { x: vertex.x + v2.x * size, y: vertex.y + v2.y * size };
    addPath(svg, `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`, "py-right");
  }

  function renderStudentDiagramSpace(target, config = {}) {
    const svg = makeSvg();
    const x = 8;
    const y = 12;
    const w = 324;
    const h = 204;

    svg.appendChild(el("rect", {
      x,
      y,
      width: w,
      height: h,
      rx: 6,
      ry: 6,
      class: "py-draw-box"
    }));

    if (config.showGuides) {
      addLine(svg, x + w / 2, y + 14, x + w / 2, y + h - 14, "py-draw-guide");
      addLine(svg, x + 14, y + h / 2, x + w - 14, y + h / 2, "py-draw-guide");
    }

    const label = config.label === false ? "" : (config.label || "Draw a diagram");
    if (label) addText(svg, label, x + 12, y + 18, "py-draw-label");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderLadderWall(target, config = {}) {
    const svg = makeSvg();
    const wallX = 105;
    const baseY = 178;
    // Optional footRatio (foot ÷ height) draws the ladder in proportion; without it, the original picture.
    const ratio = Number(config.footRatio);
    const topY = ratio > 0 ? 34 : 62;
    const footX = ratio > 0 ? wallX + Math.max(44, Math.min(200, ratio * (baseY - topY))) : 250;
    const top = { x: wallX, y: topY };
    const wallBase = { x: wallX, y: baseY };
    const foot = { x: footX, y: baseY };

    addLine(svg, wallX, topY - 18, wallX, baseY + 18);
    addLine(svg, wallX - 18, baseY, footX + 24, baseY);
    addLine(svg, wallX, topY, footX, baseY);
    addRightMarker(svg, wallBase, { x: wallX, y: baseY - 35 }, { x: wallX + 35, y: baseY });

    addText(svg, config.heightLabel || "x", wallX - 35, (topY + baseY) / 2, "py-label large");
    addText(svg, config.baseLabel || "", (wallX + footX) / 2, baseY + 20, "py-label");
    addText(svg, config.ladderLabel || "", (wallX + footX) / 2 + 28, (topY + baseY) / 2 - 18, "py-label");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderRamp(target, config = {}) {
    const svg = makeSvg();
    const A = { x: 56, y: 178 };
    const B = { x: 250, y: 178 };
    const C = { x: 250, y: 92 };

    addLine(svg, A.x, A.y, B.x, B.y);
    addLine(svg, B.x, B.y, C.x, C.y);
    addLine(svg, A.x, A.y, C.x, C.y);
    addRightMarker(svg, B, A, C);

    addText(svg, config.baseLabel || "", (A.x + B.x) / 2, B.y + 20, "py-label");
    addText(svg, config.heightLabel || "", C.x + 28, (B.y + C.y) / 2, "py-label");
    addText(svg, config.rampLabel || "x", (A.x + C.x) / 2 - 6, (A.y + C.y) / 2 - 18, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderRectangleDiagonal(target, config = {}) {
    const svg = makeSvg();
    const x = 76, y = 62, w = 178, h = 104;
    const A = { x, y };
    const B = { x: x + w, y };
    const C = { x: x + w, y: y + h };
    const D = { x, y: y + h };

    addPath(svg, `M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} L ${D.x} ${D.y} Z`);
    addLine(svg, A.x, A.y, C.x, C.y);
    addRightMarker(svg, D, A, C, 12);
    addText(svg, config.widthLabel || "", x + w / 2, y + h + 20, "py-label");
    addText(svg, config.heightLabel || "", x - 30, y + h / 2, "py-label");
    addText(svg, config.diagonalLabel || "x", x + w / 2 + 18, y + h / 2 - 10, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCompassPath(target, config = {}) {
    const svg = makeSvg();
    const O = { x: 170, y: 130 };
    const A = { x: 170, y: 55 };
    const B = { x: 82, y: 130 };

    addLine(svg, O.x, 35, O.x, 190);
    addLine(svg, 58, O.y, 278, O.y);
    addLine(svg, A.x, A.y, B.x, B.y, "py-construction");
    addRightMarker(svg, O, A, B, 12);

    addText(svg, "N", O.x, 24, "py-label small");
    addText(svg, "S", O.x, 205, "py-label small");
    addText(svg, "W", 43, O.y, "py-label small");
    addText(svg, "E", 293, O.y, "py-label small");
    addText(svg, "A", A.x + 18, A.y, "py-label");
    addText(svg, "B", B.x - 18, B.y + 2, "py-label");
    addText(svg, "X", O.x + 17, O.y + 16, "py-label");
    addText(svg, config.northLabel || "", O.x + 30, (O.y + A.y) / 2, "py-label");
    addText(svg, config.westLabel || "", (O.x + B.x) / 2, O.y + 17, "py-label");
    addText(svg, config.diagonalLabel || "x", (A.x + B.x) / 2 - 8, (A.y + B.y) / 2 - 13, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderGateBrace(target, config = {}) {
    const svg = makeSvg();
    const x = 78, y = 66, w = 174, h = 104;

    addPath(svg, `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
    for (let i = 1; i < 6; i++) addLine(svg, x + i * w / 6, y, x + i * w / 6, y + h, "py-line");
    addLine(svg, x, y, x + w, y + h);
    addRightMarker(svg, { x, y: y + h }, { x, y }, { x: x + w, y: y + h }, 12);
    addText(svg, config.heightLabel || "", x - 28, y + h / 2, "py-label");
    addText(svg, config.widthLabel || "", x + w / 2, y + h + 18, "py-label");
    addText(svg, config.braceLabel || "x", x + w / 2 + 8, y + h / 2 - 10, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderGuyWire(target, config = {}) {
    const svg = makeSvg();
    const base = { x: 170, y: 178 };
    const top = { x: 170, y: 58 };
    const left = { x: 74, y: 178 };
    const right = { x: 266, y: 178 };

    addLine(svg, base.x, base.y, top.x, top.y);
    addLine(svg, left.x - 16, left.y, right.x + 16, right.y);
    addLine(svg, top.x, top.y, left.x, left.y);
    addLine(svg, top.x, top.y, right.x, right.y);
    addRightMarker(svg, base, top, right, 12);
    addText(svg, config.heightLabel || "", base.x + 28, (base.y + top.y) / 2, "py-label");
    addText(svg, config.baseLabel || "", (base.x + right.x) / 2, base.y + 18, "py-label");
    addText(svg, config.wireLabel || "x", (top.x + right.x) / 2 + 18, (top.y + right.y) / 2 - 10, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderTriangle(target, config = {}) {
    const a = Number(config.a || 3);
    const b = Number(config.b || 4);
    const c = Number(config.c || Math.sqrt(a * a + b * b));

    const labels = config.labels || {
      a: `${fmt(a)}${config.units ? " " + config.units : ""}`,
      b: `${fmt(b)}${config.units ? " " + config.units : ""}`,
      c: `${fmt(c)}${config.units ? " " + config.units : ""}`
    };

    const P = transformTriangle(a, b, { padding: Number(config.padding || 66) });
    const A = P.A;
    const B = P.B;
    const C = P.C;

    const centroid = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3
    };

    const edges = [[A, B], [A, C], [B, C]];
    const trianglePoints = [A, B, C];
    const placedRects = [];

    const labelA = labelForSide(A, C, labels.a, centroid, edges, trianglePoints, placedRects);
    const labelB = labelForSide(A, B, labels.b, centroid, edges, trianglePoints, placedRects);
    const labelC = labelForSide(B, C, labels.c, centroid, edges, trianglePoints, placedRects);

    const svg = makeSvg();

    svg.appendChild(el("polygon", {
      points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`,
      class: "py-triangle"
    }));

    svg.appendChild(el("path", {
      d: rightAngleMarker(A, B, C),
      class: "py-right"
    }));

    [labelA, labelB, labelC].forEach(item => {
      const text = el("text", {
        x: item.x,
        y: item.y,
        class: "py-label"
      });
      text.textContent = item.text;
      svg.appendChild(text);
    });

    target.innerHTML = "";
    target.appendChild(svg);
  }

  // 3-D rectangular box with base diagonal + space diagonal highlighted.
  function renderBox3d(target, config = {}) {
    const svg = makeSvg();
    // Box front face + offset for depth.
    const x = 70, y = 70, w = 150, h = 95, dx = 55, dy = -38;
    const F = [
      { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }
    ];
    const B = F.map(p => ({ x: p.x + dx, y: p.y + dy }));

    // Back edges (dashed).
    addLine(svg, B[0].x, B[0].y, B[1].x, B[1].y, "py-construction");
    addLine(svg, B[1].x, B[1].y, B[2].x, B[2].y, "py-construction");
    addLine(svg, B[0].x, B[0].y, B[3].x, B[3].y, "py-construction");
    addLine(svg, B[3].x, B[3].y, B[2].x, B[2].y, "py-construction");
    // Connecting edges.
    [0, 1, 2, 3].forEach(i => addLine(svg, F[i].x, F[i].y, B[i].x, B[i].y, i === 0 ? "py-construction" : "py-line"));
    // Front face.
    addPath(svg, `M ${F[0].x} ${F[0].y} L ${F[1].x} ${F[1].y} L ${F[2].x} ${F[2].y} L ${F[3].x} ${F[3].y} Z`, "py-line");

    // Base diagonal (front-bottom-left to back-bottom-right) and space diagonal.
    const baseStart = F[3];                 // front bottom-left
    const baseEnd = B[2];                   // back bottom-right
    const spaceTop = B[1];                  // back top-right
    addLine(svg, baseStart.x, baseStart.y, baseEnd.x, baseEnd.y, "py-construction");
    addPath(svg, `M ${baseStart.x} ${baseStart.y} L ${spaceTop.x} ${spaceTop.y}`, "py-highlight");

    addText(svg, config.lengthLabel || "", (F[3].x + F[2].x) / 2, F[3].y + 16, "py-label small");
    addText(svg, config.heightLabel || "", F[1].x + 14, (F[1].y + F[2].y) / 2, "py-label small");
    addText(svg, config.depthLabel || "", (F[2].x + B[2].x) / 2 + 8, (F[2].y + B[2].y) / 2 + 6, "py-label small");
    addText(svg, config.diagonalLabel || "x", (baseStart.x + spaceTop.x) / 2 - 6, (baseStart.y + spaceTop.y) / 2 - 8, "py-label large italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  // Isosceles triangle with a vertical height (for composite-shape questions).
  function renderIsosceles(target, config = {}) {
    const svg = makeSvg();
    const apex = { x: 170, y: 45 };
    const left = { x: 70, y: 185 };
    const right = { x: 270, y: 185 };
    const mid = { x: 170, y: 185 };

    addPath(svg, `M ${apex.x} ${apex.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`, "py-line");
    if (config.showHeight !== false) {
      addLine(svg, apex.x, apex.y, mid.x, mid.y, "py-construction");
      addRightMarker(svg, mid, apex, right, 12);
    }
    // Slant labels sit outside their sides, anchored away from the line so they never cross it.
    addText(svg, config.slantLabel || "", (apex.x + left.x) / 2 - 10, (apex.y + left.y) / 2, "py-label");
    if (svg.lastChild && svg.lastChild.tagName === "text") svg.lastChild.style.textAnchor = "end";
    addText(svg, config.slantLabel || "", (apex.x + right.x) / 2 + 10, (apex.y + right.y) / 2, "py-label");
    if (svg.lastChild && svg.lastChild.tagName === "text") svg.lastChild.style.textAnchor = "start";
    addText(svg, config.baseLabel || "", mid.x, right.y + 18, "py-label");
    addText(svg, config.heightLabel || "h", mid.x + 14, (apex.y + mid.y) / 2, "py-label italic");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function render(target, config = {}) {
    if (!target) return;

    const type = config.diagramType || "right-triangle";

    if (type === "student-diagram-space") {
      renderStudentDiagramSpace(target, config);
      return;
    }

    if (type === "right-triangle") {
      renderTriangle(target, config);
      return;
    }

    if (type === "ladder-wall") {
      renderLadderWall(target, config);
      return;
    }

    if (type === "ramp") {
      renderRamp(target, config);
      return;
    }

    if (type === "rectangle-diagonal") {
      renderRectangleDiagonal(target, config);
      return;
    }

    if (type === "compass-path") {
      renderCompassPath(target, config);
      return;
    }

    if (type === "gate-brace") {
      renderGateBrace(target, config);
      return;
    }

    if (type === "guy-wire") {
      renderGuyWire(target, config);
      return;
    }

    if (type === "box-3d") {
      renderBox3d(target, config);
      return;
    }

    if (type === "isosceles") {
      renderIsosceles(target, config);
      return;
    }

    target.innerHTML = "<div class='diagram-placeholder'>Unknown Pythagoras diagram</div>";
  }

  return { render };
})();
