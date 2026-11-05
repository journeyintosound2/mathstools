/*
  CHHS Exam Builder — Area Diagram Engine
  ---------------------------------------
  Save as:

  engines/area/area-engine.js

  Exposes:
  window.MMT_AREA_ENGINE.render(target, config)

  Supported diagramType values:
  - rectangle
  - triangle
  - parallelogram
  - composite-straight
  - circle
  - sector
  - partial-circle
  - curved-composite
  - trapezium
  - rhombus
  - kite
  - advanced-composite
*/

window.MMT_AREA_ENGINE = (() => {
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

  function makeSvg(width = 720, height = 430, label = "area diagram") {
    const svg = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: "100%",
      height: "100%",
      role: "img",
      "aria-label": label,
      class: "area-svg"
    });

    const style = el("style");
    style.textContent = `
      .area-svg{overflow:visible}
      .area-fill{fill:#f3f8ff}
      .area-highlight-fill{fill:rgba(29,78,216,.12)}
      .area-removed-fill{fill:#fff}
      .area-line{stroke:#111827;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}
      .area-dash{stroke:#111827;stroke-width:1.8;stroke-dasharray:7 6;stroke-linecap:round}
      .area-feature{stroke:#2563eb;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .area-feature-green{stroke:#047857;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
      .area-diagonal{stroke:#9f174a;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      .area-label{font-family:"Cambria Math","Times New Roman",serif;font-size:20px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .area-small-label{font-family:"Cambria Math","Times New Roman",serif;font-size:16px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .area-point{fill:#111827}
      .right-angle{fill:none;stroke:#111827;stroke-width:1.8}
      .equal-mark{stroke:#111827;stroke-width:2;stroke-linecap:round}
      .area-dimension{stroke:#111827;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
    `;
    svg.appendChild(style);

    const defs = el("defs");
    defs.innerHTML = `
      <marker id="area-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 8 4 L 0 8 z" fill="#111827"></path>
      </marker>
      <marker id="area-arrow-start" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M 8 0 L 0 4 L 8 8 z" fill="#111827"></path>
      </marker>`;
    svg.appendChild(defs);

    return svg;
  }

  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function label(svg, text, x, y, cls = "area-label", rotate = 0) {
    if (!text) return;
    const t = el("text", { x, y, class: cls });
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

  function sideLabel(svg, text, a, b, dx = 0, dy = 0, cls = "area-label") {
    const m = midpoint(a, b);
    label(svg, text, m.x + dx, m.y + dy, cls);
  }

  function dimensionArrow(svg, from, to, text = "", offset = 0, vertical = false) {
    const a = { x: number(from?.x, 0), y: number(from?.y, 0) };
    const b = { x: number(to?.x, 0), y: number(to?.y, 0) };
    svg.appendChild(el("line", {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      class: "area-dimension",
      "marker-start": "url(#area-arrow-start)",
      "marker-end": "url(#area-arrow)"
    }));
    if (text) {
      const m = midpoint(a, b);
      label(svg, text, m.x + (vertical ? offset : 0), m.y + (vertical ? 0 : offset), "area-small-label");
      // A vertical arrow's label is anchored at its edge, clear of the line, not centred on it.
      if (vertical) {
        const t = svg.lastChild;
        t.setAttribute("x", m.x + (offset < 0 ? -8 : 8));
        t.setAttribute("style", "text-anchor:" + (offset < 0 ? "end" : "start"));
      }
    }
  }

  function heightBeside(svg, x, y1, y2, text) {
    // The height is labelled beside its own dashed line, inside the shape, on a white halo,
    // so nothing crosses a sloping side.
    if (!text) return;
    label(svg, text, x - 10, (y1 + y2) / 2, "area-small-label");
    const t = svg.lastChild;
    t.setAttribute("style", "text-anchor:end;paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round");
  }

  function rightAngle(svg, x, y, orientation = "bottom-right", size = 24) {
    let d;
    if (orientation === "bottom-right") d = `M ${x} ${y - size} L ${x + size} ${y - size} L ${x + size} ${y}`;
    else if (orientation === "bottom-left") d = `M ${x} ${y - size} L ${x - size} ${y - size} L ${x - size} ${y}`;
    else if (orientation === "top-right") d = `M ${x} ${y + size} L ${x + size} ${y + size} L ${x + size} ${y}`;
    else d = `M ${x} ${y + size} L ${x - size} ${y + size} L ${x - size} ${y}`;
    svg.appendChild(el("path", { d, class: "right-angle" }));
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
        class: "equal-mark"
      }));
    });
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

  function renderRectangle(target, config = {}) {
    const square = config.shape === "square";
    const svg = makeSvg(720, 420, square ? "square area diagram" : "rectangle area diagram");
    const w = square ? 240 : 330;
    const h = square ? 240 : 190;
    const x = (720 - w) / 2;
    const y = square ? 95 : 115;

    svg.appendChild(el("rect", {
      x,
      y,
      width: w,
      height: h,
      class: "area-fill area-line"
    }));

    rightAngle(svg, x, y, "top-right", 18);
    rightAngle(svg, x + w, y, "top-left", 18);
    rightAngle(svg, x + w, y + h, "bottom-left", 18);
    rightAngle(svg, x, y + h, "bottom-right", 18);

    if (square) {
      drawTickMark(svg, { x, y }, { x: x + w, y }, 1);
      drawTickMark(svg, { x: x + w, y }, { x: x + w, y: y + h }, 1);
      drawTickMark(svg, { x: x + w, y: y + h }, { x, y: y + h }, 1);
      drawTickMark(svg, { x, y: y + h }, { x, y }, 1);
    }

    if (config.lengthLabel) {
      dimensionArrow(svg, { x, y: y + h + 30 }, { x: x + w, y: y + h + 30 }, config.lengthLabel, 14);
    }
    if (config.widthLabel) {
      dimensionArrow(svg, { x: x - 38, y }, { x: x - 38, y: y + h }, config.widthLabel, -14, true);
    }
    if (square) label(svg, "square", x + w / 2, y - 32, "area-small-label");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderTriangle(target, config = {}) {
    const svg = makeSvg(720, 430, "triangle area diagram");

    const a = { x: 165, y: 320 };
    const b = { x: 565, y: 320 };
    const c = config.oblique
      ? { x: 430, y: 95 }
      : { x: 365, y: 95 };

    svg.appendChild(el("path", {
      d: pathFromPoints([a, b, c]),
      class: "area-fill area-line"
    }));

    const foot = { x: c.x, y: a.y };
    svg.appendChild(el("line", {
      x1: c.x,
      y1: c.y,
      x2: foot.x,
      y2: foot.y,
      class: "area-dash"
    }));
    rightAngle(svg, foot.x, foot.y, c.x >= 365 ? "bottom-left" : "bottom-right");

    sideLabel(svg, config.baseLabel || "", a, b, 0, 36);
    if (config.heightLabel) {
      heightBeside(svg, foot.x, c.y, foot.y, config.heightLabel);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderParallelogram(target, config = {}) {
    const svg = makeSvg(720, 430, "parallelogram area diagram");
    const a = { x: 170, y: 310 };
    const b = { x: 550, y: 310 };
    const c = { x: 465, y: 115 };
    const d = { x: 85, y: 115 };

    svg.appendChild(el("path", {
      d: pathFromPoints([a, b, c, d]),
      class: "area-fill area-line"
    }));

    const foot = { x: c.x, y: b.y };
    svg.appendChild(el("line", {
      x1: c.x,
      y1: c.y,
      x2: foot.x,
      y2: foot.y,
      class: "area-dash"
    }));
    rightAngle(svg, foot.x, foot.y, "bottom-left");

    sideLabel(svg, config.baseLabel || "", a, b, 0, 38);
    if (config.heightLabel) {
      heightBeside(svg, foot.x, c.y, foot.y, config.heightLabel);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCompositeStraight(target, config = {}) {
    const svg = makeSvg(720, 430, "straight-sided composite area diagram");

    if (Array.isArray(config.points) && config.points.length >= 3) {
      const pts = config.points.map(point => ({
        x: number(point.x, 0),
        y: number(point.y, 0)
      }));

      if (config.bowtie) {
        svg.appendChild(el("path", { d: pathFromPoints(pts.slice(0, 3)), class: "area-fill area-line" }));
        svg.appendChild(el("path", { d: pathFromPoints(pts.slice(3, 6)), class: "area-fill area-line" }));
      } else {
        svg.appendChild(el("path", {
          d: pathFromPoints(pts),
          class: "area-fill area-line"
        }));
      }

      const holes = Array.isArray(config.holes) ? config.holes : [];
      holes.forEach(hole => {
        if (!Array.isArray(hole) || hole.length < 3) return;
        const holePts = hole.map(point => ({ x: number(point.x, 0), y: number(point.y, 0) }));
        svg.appendChild(el("path", {
          d: pathFromPoints(holePts),
          class: "area-removed-fill area-line"
        }));
      });


      const internalLines = Array.isArray(config.internalLines) ? config.internalLines : [];
      internalLines.forEach(line => {
        const a = line.from || {};
        const b = line.to || {};
        svg.appendChild(el("line", {
          x1: number(a.x, 0),
          y1: number(a.y, 0),
          x2: number(b.x, 0),
          y2: number(b.y, 0),
          class: line.className || "area-dash"
        }));
      });

      const rightAngles = Array.isArray(config.rightAngles) ? config.rightAngles : [];
      rightAngles.forEach(item => {
        rightAngle(svg, number(item.x, 0), number(item.y, 0), item.orientation || "bottom-right", number(item.size, 18));
      });

      const edgeLabels = Array.isArray(config.edgeLabels) ? config.edgeLabels : [];
      edgeLabels.forEach(item => {
        const edge = item.edge || [];
        const a = pts[edge[0]];
        const b = pts[edge[1]];
        if (!a || !b || !item.text) return;
        sideLabel(
          svg,
          item.text,
          a,
          b,
          number(item.dx, 0),
          number(item.dy, 0),
          item.className || "area-small-label"
        );
      });

      const dimensionArrows = Array.isArray(config.dimensionArrows) ? config.dimensionArrows : [];
      dimensionArrows.forEach(item => {
        dimensionArrow(svg, item.from || {}, item.to || {}, item.text || "", number(item.offset, 0), item.vertical === true);
      });

      const pointLabels = Array.isArray(config.pointLabels) ? config.pointLabels : [];
      pointLabels.forEach(item => label(svg, item.text || "", number(item.x, 0), number(item.y, 0), item.className || "area-small-label"));

      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (config.shape === "rectangle-triangle") {
      const pts = [
        { x: 170, y: 315 },
        { x: 550, y: 315 },
        { x: 550, y: 160 },
        { x: 360, y: 80 },
        { x: 170, y: 160 }
      ];

      svg.appendChild(el("path", {
        d: pathFromPoints(pts),
        class: "area-fill area-line"
      }));

      svg.appendChild(el("line", { x1: 170, y1: 160, x2: 550, y2: 160, class: "area-dash" }));
      label(svg, config.baseLabel || "", 360, 347);
      label(svg, config.heightLabel || "", 125, 236);
      label(svg, config.triangleHeightLabel || "", 365, 118, "area-small-label");

      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    const pts = [
      { x: 165, y: 105 },
      { x: 555, y: 105 },
      { x: 555, y: 245 },
      { x: 400, y: 245 },
      { x: 400, y: 325 },
      { x: 165, y: 325 }
    ];

    svg.appendChild(el("path", {
      d: pathFromPoints(pts),
      class: "area-fill area-line"
    }));

    svg.appendChild(el("line", { x1: 400, y1: 105, x2: 400, y2: 325, class: "area-dash" }));
    label(svg, config.topLabel || "", 360, 68);
    label(svg, config.leftHeightLabel || "", 112, 215);
    label(svg, config.rightHeightLabel || "", 592, 175);
    label(svg, config.notchWidthLabel || "", 480, 278);
    label(svg, config.bottomLabel || "", 285, 365);

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCircle(target, config = {}) {
    const svg = makeSvg(720, 420, "circle area diagram");
    const cx = 360;
    const cy = 210;
    const r = 125;

    svg.appendChild(el("circle", {
      cx,
      cy,
      r,
      class: "area-fill area-line"
    }));
    svg.appendChild(el("circle", { cx, cy, r: 4.5, class: "area-point" }));

    if (config.given === "diameter") {
      svg.appendChild(el("line", { x1: cx - r, y1: cy, x2: cx + r, y2: cy, class: "area-feature" }));
      label(svg, config.diameterLabel || "", cx, cy - 30);
    } else {
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, class: "area-feature" }));
      label(svg, config.radiusLabel || "", cx + r / 2, cy - 28);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderSector(target, config = {}) {
    const svg = makeSvg(720, 430, "sector area diagram");
    const cx = 360;
    const cy = 230;
    const r = 130;
    const angle = number(config.angle, 90);
    const startAngle = -angle / 2;
    const endAngle = angle / 2;
    const a = polar(cx, cy, r, startAngle);
    const b = polar(cx, cy, r, endAngle);
    const largeArc = angle > 180 ? 1 : 0;

    svg.appendChild(el("path", {
      d: `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y} Z`,
      class: "area-fill area-line"
    }));

    svg.appendChild(el("path", { d: arcPath(cx, cy, 38, startAngle, endAngle), class: "area-feature-green" }));
    // A narrow wedge has no room for its angle inside, so the label goes just below the vertex.
    if (angle < 75) label(svg, `${angle}°`, cx, cy + 26, "area-small-label");
    else label(svg, `${angle}°`, cx, cy - 58, "area-small-label");
    // Radius label: halfway along the first radius, stepped off it on the side away from the sector.
    {
      const phi = (startAngle - 90) * Math.PI / 180, ox = Math.sin(phi), oy = -Math.cos(phi);
      const mx = (cx + a.x) / 2 + ox * 22, my = (cy + a.y) / 2 + oy * 22;
      label(svg, config.radiusLabel || "", mx, my);
      if (config.radiusLabel && Math.abs(ox) > 0.35) svg.lastChild.setAttribute("style", "text-anchor:" + (ox > 0 ? "start" : "end"));
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderPartialCircle(target, config = {}) {
    const svg = makeSvg(720, 420, "partial circle area diagram");
    const shape = config.shape || "semicircle";
    const cx = 360;
    const cy = shape === "quadrant" ? 260 : 245;
    const r = 135;

    if (shape === "quadrant") {
      const start = { x: cx, y: cy - r };
      const end = { x: cx + r, y: cy };

      svg.appendChild(el("path", {
        d: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y} Z`,
        class: "area-fill area-line"
      }));

      label(svg, config.radiusLabel || "", cx - 34, cy - r / 2);
      label(svg, config.radiusLabel || "", cx + r / 2, cy + 32);
      rightAngle(svg, cx, cy, "bottom-right", 30);
    } else {
      svg.appendChild(el("path", {
        d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx - r} ${cy} Z`,
        class: "area-fill area-line"
      }));

      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + r, y2: cy, class: "area-feature" }));
      label(svg, config.radiusLabel || "", cx + r / 2, cy + 32);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderCurvedComposite(target, config = {}) {
    const svg = makeSvg(720, 430, "curved composite area diagram");
    const shape = config.shape || "rectangle-semicircle";

    if (shape === "annulus") {
      const cx = 360;
      const cy = 215;
      const outer = 135;
      const inner = 62;
      svg.appendChild(el("circle", { cx, cy, r: outer, class: "area-fill area-line" }));
      svg.appendChild(el("circle", { cx, cy, r: inner, class: "area-removed-fill area-line" }));
      svg.appendChild(el("circle", { cx, cy, r: 4, class: "area-point" }));
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + outer, y2: cy + 42, class: "area-dimension" }));
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + inner, y2: cy - 30, class: "area-dimension" }));
      label(svg, config.outerLabel || "", cx + outer * 0.55, cy + 46, "area-small-label");
      label(svg, config.innerLabel || "", cx + inner * 0.55, cy - 34, "area-small-label");
      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (shape === "semicircle") {
      const cx = 360;
      const cy = 255;
      const r = 150;
      svg.appendChild(el("path", { d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx - r} ${cy} Z`, class: "area-fill area-line" }));
      svg.appendChild(el("circle", { cx, cy, r: 4, class: "area-point" }));
      svg.appendChild(el("line", { x1: cx - r, y1: cy, x2: cx + r, y2: cy, class: "area-dimension" }));
      label(svg, config.diameterLabel || "", cx, cy + 32, "area-small-label");
      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (shape === "stadium") {
      const x = 185;
      const y = 145;
      const w = 300;
      const h = 150;
      const r = h / 2;
      const d = `M ${x} ${y} H ${x + w} A ${r} ${r} 0 0 1 ${x + w} ${y + h} H ${x} A ${r} ${r} 0 0 1 ${x} ${y} Z`;
      svg.appendChild(el("path", { d, class: "area-fill area-line" }));
      svg.appendChild(el("line", { x1: x, y1: y + h / 2, x2: x + w, y2: y + h / 2, class: "area-dash" }));
      dimensionArrow(svg, { x, y: y + h + 34 }, { x: x + w, y: y + h + 34 }, config.lengthLabel || "", 16);
      dimensionArrow(svg, { x: x - 38, y }, { x: x - 38, y: y + h }, config.diameterLabel || "", -12, true);
      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (shape === "rectangle-semicircle") {
      const x = 170;
      const y = 130;
      const w = 310;
      const h = 170;
      const r = h / 2;
      const d = `M ${x} ${y} H ${x + w} A ${r} ${r} 0 0 1 ${x + w} ${y + h} H ${x} Z`;
      svg.appendChild(el("path", { d, class: "area-fill area-line" }));
      svg.appendChild(el("line", { x1: x + w, y1: y, x2: x + w, y2: y + h, class: "area-dash" }));
      label(svg, config.widthLabel || "", x + w / 2, y - 30, "area-small-label");
      label(svg, config.heightLabel || "", x - 44, y + h / 2, "area-small-label");
      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (shape === "rectangle-semicircle-cutout") {
      const x = 155;
      const y = 125;
      const w = 390;
      const h = 180;
      const r = h / 4;
      svg.appendChild(el("rect", { x, y, width: w, height: h, class: "area-fill area-line" }));
      const cy = y + h / 2;
      [x, x + w].forEach((cx, i) => {
        const sweep = i === 0 ? 1 : 0;
        const startX = cx;
        const endX = cx;
        svg.appendChild(el("path", { d: `M ${startX} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${endX} ${cy + r}`, class: "area-removed-fill area-line" }));
      });
      label(svg, config.widthLabel || "", x + w / 2, y + h + 32, "area-small-label");
      label(svg, config.heightLabel || "", x - 40, y + h / 2, "area-small-label");
      label(svg, config.notchLabel || "", x + w + 40, y + h / 2, "area-small-label");
      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    if (shape === "square-minus-quadrant") {
      const x = 210;
      const y = 95;
      const size = 250;
      const cx = x;
      const cy = y + size;

      svg.appendChild(el("rect", { x, y, width: size, height: size, class: "area-fill area-line" }));
      svg.appendChild(el("path", {
        d: `M ${cx} ${cy} L ${cx} ${cy - size} A ${size} ${size} 0 0 1 ${cx + size} ${cy} Z`,
        class: "area-removed-fill"
      }));
      svg.appendChild(el("path", {
        d: `M ${cx} ${cy - size} A ${size} ${size} 0 0 1 ${cx + size} ${cy}`,
        class: "area-feature"
      }));
      label(svg, config.sideLabel || "", x + size / 2, y + size + 34, "area-small-label");
      label(svg, config.sideLabel || "", x - 38, y + size / 2, "area-small-label");

      target.innerHTML = "";
      target.appendChild(svg);
      return;
    }

    // default: rectangle with a semicircle attached
    const x = 170;
    const y = 130;
    const w = 310;
    const h = 170;
    const r = h / 2;
    const d = `M ${x} ${y} H ${x + w} A ${r} ${r} 0 0 1 ${x + w} ${y + h} H ${x} Z`;
    svg.appendChild(el("path", { d, class: "area-fill area-line" }));
    label(svg, config.widthLabel || "", x + w / 2, y - 30, "area-small-label");
    label(svg, config.heightLabel || "", x - 44, y + h / 2, "area-small-label");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderTrapezium(target, config = {}) {
    const svg = makeSvg(720, 430, "trapezium area diagram");
    const pts = [
      { x: 150, y: 310 },
      { x: 570, y: 310 },
      { x: 480, y: 110 },
      { x: 250, y: 110 }
    ];

    svg.appendChild(el("path", { d: pathFromPoints(pts), class: "area-fill area-line" }));
    svg.appendChild(el("line", { x1: 480, y1: 110, x2: 480, y2: 310, class: "area-dash" }));
    rightAngle(svg, 480, 310, "bottom-left");

    sideLabel(svg, config.bottomLabel || "", pts[0], pts[1], 0, 38);
    sideLabel(svg, config.topLabel || "", pts[2], pts[3], 0, -34);
    if (config.heightLabel) {
      dimensionArrow(svg, { x: 600, y: 110 }, { x: 600, y: 310 }, config.heightLabel, 16, true);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderRhombus(target, config = {}) {
    const svg = makeSvg(720, 430, "rhombus area diagram");
    const top = { x: 360, y: 75 };
    const right = { x: 555, y: 215 };
    const bottom = { x: 360, y: 355 };
    const left = { x: 165, y: 215 };

    svg.appendChild(el("path", { d: pathFromPoints([top, right, bottom, left]), class: "area-fill area-line" }));
    svg.appendChild(el("line", { x1: left.x, y1: left.y, x2: right.x, y2: right.y, class: "area-diagonal" }));
    svg.appendChild(el("line", { x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y, class: "area-diagonal" }));
    rightAngle(svg, 360, 215, "bottom-right", 24);

    // Each diagonal's length sits on that diagonal: the horizontal one above its left half,
    // the vertical one beside its lower half.
    label(svg, config.diagonalXLabel || "", (165 + 360) / 2, 215 - 16, "area-small-label");
    label(svg, config.diagonalYLabel || "", 372, (215 + 355) / 2, "area-small-label");
    if (config.diagonalYLabel) svg.lastChild.setAttribute("style", "text-anchor:start");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderKite(target, config = {}) {
    const svg = makeSvg(720, 430, "kite area diagram");
    const top = { x: 360, y: 65 };
    const right = { x: 540, y: 190 };
    const bottom = { x: 360, y: 365 };
    const left = { x: 180, y: 190 };

    svg.appendChild(el("path", { d: pathFromPoints([top, right, bottom, left]), class: "area-fill area-line" }));
    svg.appendChild(el("line", { x1: left.x, y1: left.y, x2: right.x, y2: right.y, class: "area-diagonal" }));
    svg.appendChild(el("line", { x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y, class: "area-diagonal" }));
    rightAngle(svg, 360, 190, "bottom-right", 24);
    drawTickMark(svg, top, right, 1);
    drawTickMark(svg, left, top, 1);
    drawTickMark(svg, right, bottom, 2);
    drawTickMark(svg, bottom, left, 2);

    // Each diagonal's length sits on that diagonal: the horizontal one above its left half,
    // the vertical one beside its lower half.
    label(svg, config.diagonalXLabel || "", (180 + 360) / 2, 190 - 16, "area-small-label");
    label(svg, config.diagonalYLabel || "", 372, (190 + 365) / 2, "area-small-label");
    if (config.diagonalYLabel) svg.lastChild.setAttribute("style", "text-anchor:start");

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderAdvancedComposite(target, config = {}) {
    const svg = makeSvg(720, 430, "advanced composite area diagram");

    const pts = [
      { x: 155, y: 330 },
      { x: 565, y: 330 },
      { x: 505, y: 185 },
      { x: 360, y: 85 },
      { x: 215, y: 185 }
    ];

    svg.appendChild(el("path", { d: pathFromPoints(pts), class: "area-fill area-line" }));
    svg.appendChild(el("line", { x1: 215, y1: 185, x2: 505, y2: 185, class: "area-dash" }));
    svg.appendChild(el("line", { x1: 360, y1: 85, x2: 360, y2: 330, class: "area-dash" }));
    rightAngle(svg, 360, 185, "bottom-right", 18);

    sideLabel(svg, config.trapeziumBottomLabel || "", pts[0], pts[1], 0, 36, "area-small-label");
    dimensionArrow(svg, { x: 225, y: 165 }, { x: 495, y: 165 }, config.trapeziumTopLabel || "", -18);
    dimensionArrow(svg, { x: 125, y: 185 }, { x: 125, y: 330 }, config.trapeziumHeightLabel || "", -12, true);
    dimensionArrow(svg, { x: 395, y: 85 }, { x: 395, y: 185 }, config.triangleHeightLabel || "", 16, true);

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderGridCount(target, config = {}) {
    const cols = Math.max(1, Math.min(14, number(config.cols, 5)));
    const rows = Math.max(1, Math.min(10, number(config.rows, 3)));
    const svg = makeSvg(720, 460, "rectangle on a unit grid");

    const cell = Math.min(56, Math.floor(560 / cols), Math.floor(320 / rows));
    const w = cols * cell, h = rows * cell;
    const x0 = (720 - w) / 2, y0 = (440 - h) / 2;

    // Shaded rectangle.
    svg.appendChild(el("rect", { x: x0, y: y0, width: w, height: h, class: "area-highlight-fill" }));
    // Grid lines.
    for (let c = 0; c <= cols; c++) {
      svg.appendChild(el("line", { x1: x0 + c * cell, y1: y0, x2: x0 + c * cell, y2: y0 + h, class: c === 0 || c === cols ? "area-line" : "area-dimension" }));
    }
    for (let r = 0; r <= rows; r++) {
      svg.appendChild(el("line", { x1: x0, y1: y0 + r * cell, x2: x0 + w, y2: y0 + r * cell, class: r === 0 || r === rows ? "area-line" : "area-dimension" }));
    }
    label(svg, "Each square is 1 cm²", 360, y0 + h + 34, "area-small-label");
    return target.innerHTML = "", target.appendChild(svg);
  }

  function render(target, config = {}) {
    const type = config.diagramType || "rectangle";

    if (type === "grid-count") return renderGridCount(target, config);
    if (type === "rectangle") return renderRectangle(target, config);
    if (type === "triangle") return renderTriangle(target, config);
    if (type === "parallelogram") return renderParallelogram(target, config);
    if (type === "composite-straight") return renderCompositeStraight(target, config);
    if (type === "circle") return renderCircle(target, config);
    if (type === "sector") return renderSector(target, config);
    if (type === "partial-circle") return renderPartialCircle(target, config);
    if (type === "curved-composite") return renderCurvedComposite(target, config);
    if (type === "trapezium") return renderTrapezium(target, config);
    if (type === "rhombus") return renderRhombus(target, config);
    if (type === "kite") return renderKite(target, config);
    if (type === "advanced-composite") return renderAdvancedComposite(target, config);

    target.innerHTML = `<div class="diagram-placeholder">Unknown area diagram: ${type}</div>`;
  }

  return { render };
})();
