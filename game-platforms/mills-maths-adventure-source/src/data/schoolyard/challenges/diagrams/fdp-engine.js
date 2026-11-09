/*
  CHHS Exam Builder — FDP Diagram Engine
  --------------------------------------
  Save as:

  engines/fdp/fdp-engine.js

  Exposes:
  window.MMT_FDP_ENGINE.render(target, config)

  Diagram types:
  - fraction-bar
  - percentage-grid
  - decimal-number-line
  - conversion-strip
  - best-buy-bars
*/

window.MMT_FDP_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function svg(viewBox = "0 0 520 180") {
    const s = el("svg", {
      viewBox,
      width: "100%",
      height: "100%",
      role: "img",
      class: "fdp-svg"
    });

    const style = el("style");
    style.textContent = `
      .fdp-svg{overflow:visible}
      .fdp-line{stroke:#111827;stroke-width:3;stroke-linecap:round;fill:none}
      .fdp-thin{stroke:#111827;stroke-width:1.5;stroke-linecap:round;fill:none}
      .fdp-soft{fill:#eef2ff;stroke:#111827;stroke-width:2}
      .fdp-fill{fill:#bfdbfe;stroke:#111827;stroke-width:1.2}
      .fdp-empty{fill:#ffffff;stroke:#111827;stroke-width:1.2}
      .fdp-accent{fill:#d1fae5;stroke:#111827;stroke-width:1.2}
      /* Area model: the caption promises the overlap is DARKER, so it has to
         actually be darker than either single-shaded direction — the old pale
         blue and pale green read as the same weight in print. */
      .fdp-col{fill:#dbeafe;stroke:#111827;stroke-width:1.2}
      .fdp-row{fill:#dcfce7;stroke:#111827;stroke-width:1.2}
      .fdp-product{fill:#4f95d4;stroke:#111827;stroke-width:1.2}
      .fdp-muted{fill:#f3f4f6;stroke:#111827;stroke-width:1.2}
      .fdp-text{font-family:"Cambria Math","Times New Roman",serif;font-size:20px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .fdp-small{font-size:15px;font-weight:700}
      .fdp-label{font-size:17px;font-weight:700}
      .fdp-title{font-size:18px;font-weight:900}
    `;
    s.appendChild(style);
    return s;
  }

  function text(s, value, x, y, cls = "fdp-text") {
    const t = el("text", { x, y, class: cls });
    t.textContent = value;
    s.appendChild(t);
    return t;
  }

  function rect(s, x, y, w, h, cls = "fdp-empty", extra = {}) {
    const r = el("rect", { x, y, width: w, height: h, class: cls, ...extra });
    s.appendChild(r);
    return r;
  }

  function line(s, x1, y1, x2, y2, cls = "fdp-line") {
    s.appendChild(el("line", { x1, y1, x2, y2, class: cls }));
  }

  function fmtNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value ?? "");
    return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : String(Number(n.toFixed(3)));
  }

  function renderFractionBar(config = {}) {
    const denominator = Math.max(1, Math.min(24, Number(config.denominator) || 4));
    const rawNumerator = Number(config.numerator);
    const numerator = Number.isFinite(rawNumerator)
      ? Math.max(0, Math.min(denominator, rawNumerator))
      : 1;

    // For exam questions, fraction bars should not reveal the answer by default.
    // A label is shown only when a question explicitly sets showLabel: true.
    const showLabel = config.showLabel === true;
    const label = config.label ?? `${numerator}/${denominator}`;

    const s = svg("0 0 520 150");
    const x = 50;
    const y = 45;
    const w = 420;
    const h = 44;
    const cell = w / denominator;

    for (let i = 0; i < denominator; i++) {
      rect(s, x + i * cell, y, cell, h, i < numerator ? "fdp-fill" : "fdp-empty");
    }

    rect(s, x, y, w, h, "fdp-thin", { fill: "none" });
    if (showLabel) text(s, label, 260, 118, "fdp-text fdp-label");
    return s;
  }

  function renderPercentageGrid(config = {}) {
    const percent = Math.max(0, Math.min(100, Number(config.percent) || 0));
    const filled = Math.round(percent);
    const label = config.label ?? `${percent}%`;
    const s = svg("0 0 420 230");
    const size = 15;
    const gap = 2;
    const x0 = 82;
    const y0 = 28;

    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      rect(
        s,
        x0 + col * (size + gap),
        y0 + row * (size + gap),
        size,
        size,
        i < filled ? "fdp-fill" : "fdp-empty"
      );
    }

    text(s, label, 210, 208, "fdp-text fdp-label");
    return s;
  }

  function renderDecimalNumberLine(config = {}) {
    const min = Number.isFinite(config.min) ? config.min : 0;
    const max = Number.isFinite(config.max) ? config.max : 1;
    const value = Number.isFinite(config.value) ? config.value : (min + max) / 2;
    const label = config.label ?? fmtNumber(value);
    const tickCount = Math.max(2, Math.min(20, Number(config.tickCount) || 10));
    const showPoint = config.showPoint !== false;

    const s = svg("0 0 560 160");
    const left = 65;
    const right = 495;
    const y = 75;
    const x = n => left + ((n - min) / (max - min)) * (right - left);

    line(s, left, y, right, y);

    for (let i = 0; i <= tickCount; i++) {
      const xi = left + (i / tickCount) * (right - left);
      const isEnd = i === 0 || i === tickCount;
      line(s, xi, y - (isEnd ? 16 : 9), xi, y + (isEnd ? 16 : 9), isEnd ? "fdp-line" : "fdp-thin");
      if (isEnd || i === Math.floor(tickCount / 2)) {
        const n = min + (i / tickCount) * (max - min);
        text(s, fmtNumber(n), xi, 122, "fdp-text fdp-small");
      }
    }

    if (showPoint) {
      const xi = x(value);
      s.appendChild(el("circle", { cx: xi, cy: y, r: 8, class: "fdp-fill" }));
      text(s, label, xi, 38, "fdp-text fdp-label");
    }

    return s;
  }

  function renderConversionStrip(config = {}) {
    const fraction = config.fraction ?? "?";
    const decimal = config.decimal ?? "?";
    const percent = config.percent ?? "?";
    const s = svg("0 0 560 160");

    const boxes = [
      { title: "Fraction", value: fraction, x: 35 },
      { title: "Decimal", value: decimal, x: 205 },
      { title: "Percentage", value: percent, x: 375 }
    ];

    boxes.forEach((b, i) => {
      rect(s, b.x, 34, 140, 78, i === 1 ? "fdp-accent" : "fdp-soft", { rx: 8, ry: 8 });
      text(s, b.title, b.x + 70, 55, "fdp-text fdp-small");
      text(s, b.value, b.x + 70, 88, "fdp-text fdp-title");
    });

    line(s, 178, 73, 202, 73, "fdp-thin");
    line(s, 348, 73, 372, 73, "fdp-thin");
    return s;
  }

  function renderBestBuyBars(config = {}) {
    const optionA = config.optionA ?? { label: "A", units: 6, price: 9 };
    const optionB = config.optionB ?? { label: "B", units: 10, price: 14 };
    const maxUnits = Math.max(1, Number(optionA.units) || 1, Number(optionB.units) || 1);
    const s = svg("0 0 560 170");

    function bar(opt, y) {
      const units = Math.max(1, Number(opt.units) || 1);
      const w = 330 * units / maxUnits;
      text(s, opt.label, 54, y + 20, "fdp-text fdp-label");
      rect(s, 95, y, w, 38, "fdp-fill", { rx: 5, ry: 5 });
      rect(s, 95, y, 330, 38, "fdp-thin", { fill: "none", rx: 5, ry: 5 });
      text(s, `${units} for $${fmtNumber(opt.price)}`, 470, y + 20, "fdp-text fdp-small");
    }

    bar(optionA, 38);
    bar(optionB, 98);
    return s;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function sectorPath(cx, cy, r, startDeg, endDeg) {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  function renderFractionCircle(config = {}) {
    const denominator = Math.max(1, Math.min(16, Number(config.denominator) || 4));
    const rawNum = Number(config.numerator);
    const numerator = Number.isFinite(rawNum) ? Math.max(0, Math.min(denominator, rawNum)) : 1;
    const showLabel = config.showLabel === true;

    // The circle spans x 40..240 and y 30..230; the optional label sits at
    // y=262. Size the box to whichever of those is actually present rather
    // than always reserving room for the label.
    const s = svg(showLabel ? "26 22 228 258" : "26 22 228 216");
    const cx = 140, cy = 130, r = 100;
    const sweep = 360 / denominator;

    for (let i = 0; i < denominator; i++) {
      const p = el("path", {
        d: sectorPath(cx, cy, r, i * sweep, (i + 1) * sweep),
        class: i < numerator ? "fdp-fill" : "fdp-empty"
      });
      s.appendChild(p);
    }
    s.appendChild(el("circle", { cx, cy, r, fill: "none", stroke: "#111827", "stroke-width": 2 }));
    if (showLabel) text(s, `${numerator}/${denominator}`, cx, 262, "fdp-text fdp-label");
    return s;
  }

  function renderFractionOfSet(config = {}) {
    const total = Math.max(1, Math.min(40, Number(config.total) || 12));
    const shaded = Math.max(0, Math.min(total, Number(config.shaded) || 0));
    const cols = Math.max(1, Math.min(10, Number(config.cols) || Math.min(total, 6)));
    const rows = Math.ceil(total / cols);
    const showLabel = config.showLabel === true;

    const cell = 44, rad = 15, pad = 24;
    const w = pad * 2 + cols * cell;
    const h = pad * 2 + rows * cell + (showLabel ? 30 : 0);
    const s = svg(`0 0 ${w} ${h}`);

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      s.appendChild(el("circle", {
        cx: pad + col * cell + cell / 2,
        cy: pad + row * cell + cell / 2,
        r: rad,
        class: i < shaded ? "fdp-fill" : "fdp-empty"
      }));
    }
    if (showLabel) text(s, `${shaded} of ${total}`, w / 2, h - 12, "fdp-text fdp-small");
    return s;
  }

  function renderNumberLineFraction(config = {}) {
    const denominator = Math.max(2, Math.min(16, Number(config.denominator) || 4));
    const wholes = Math.max(1, Math.min(4, Number(config.wholes) || 1));
    const totalTicks = denominator * wholes;
    const mark = Number.isFinite(config.markNumerator) ? config.markNumerator : null;
    const showMark = config.showMark === true;

    // Line sits at y=70 with ticks to y±18 and labels centred on y=112, so the
    // drawing lives in y 45..125 — the top third of the old box was empty.
    const s = svg("34 38 580 96");
    const left = 50, right = 590, y = 70;
    const x = i => left + (i / totalTicks) * (right - left);

    line(s, left, y, right, y);
    for (let i = 0; i <= totalTicks; i++) {
      const isWhole = i % denominator === 0;
      line(s, x(i), y - (isWhole ? 18 : 10), x(i), y + (isWhole ? 18 : 10), isWhole ? "fdp-line" : "fdp-thin");
      if (isWhole) text(s, String(i / denominator), x(i), 112, "fdp-text fdp-small");
    }
    if (showMark && mark !== null) {
      s.appendChild(el("circle", { cx: x(mark), cy: y, r: 8, class: "fdp-fill" }));
    }
    return s;
  }

  function renderEquivalentBars(config = {}) {
    const fracs = Array.isArray(config.fracs) && config.fracs.length
      ? config.fracs.slice(0, 4)
      : [{ n: 1, d: 2 }, { n: 2, d: 4 }];

    // Bars run x 60..480; the optional label extends to about x=530. Height is
    // the last bar's bottom edge plus a small margin, instead of a fixed pad
    // that left a blank strip under the final bar.
    const x = 60, w = 420, h = 46;
    const barsBottom = 30 + (fracs.length - 1) * 70 + h;
    const s = svg(`40 14 ${config.showLabel === true ? 500 : 455} ${barsBottom}`);

    fracs.forEach((f, idx) => {
      const d = Math.max(1, Math.min(24, Number(f.d) || 2));
      const n = Math.max(0, Math.min(d, Number(f.n) || 0));
      const y = 30 + idx * 70;
      const cell = w / d;
      for (let i = 0; i < d; i++) {
        rect(s, x + i * cell, y, cell, h, i < n ? "fdp-fill" : "fdp-empty");
      }
      rect(s, x, y, w, h, "fdp-thin", { fill: "none" });
      if (config.showLabel === true) text(s, `${n}/${d}`, x + w + 35, y + h / 2, "fdp-text fdp-small");
    });
    return s;
  }

  function renderFractionMultiplyArea(config = {}) {
    const d1 = Math.max(2, Math.min(8, Number(config.d1) || 3));
    const n1 = Math.max(1, Math.min(d1, Number(config.n1) || 1));
    const d2 = Math.max(2, Math.min(8, Number(config.d2) || 4));
    const n2 = Math.max(1, Math.min(d2, Number(config.n2) || 1));

    const s = svg("0 0 360 360");
    const x0 = 40, y0 = 30, side = 280;
    const cw = side / d1, ch = side / d2;

    // Base grid cells. Each of the three states gets its own weight so the
    // product region is unmistakable: the two factors are pale, their overlap
    // is solid.
    for (let c = 0; c < d1; c++) {
      for (let r = 0; r < d2; r++) {
        const inCol = c < n1, inRow = r < n2;
        const cls = inCol && inRow ? "fdp-product"
          : inCol ? "fdp-col"
          : inRow ? "fdp-row"
          : "fdp-empty";
        rect(s, x0 + c * cw, y0 + r * ch, cw, ch, cls);
      }
    }
    // Grid lines.
    for (let c = 0; c <= d1; c++) line(s, x0 + c * cw, y0, x0 + c * cw, y0 + side, "fdp-thin");
    for (let r = 0; r <= d2; r++) line(s, x0, y0 + r * ch, x0 + side, y0 + r * ch, "fdp-thin");

    // Edge labels at full label size, not the small tick size — they name the
    // two fractions being multiplied and are part of reading the model.
    text(s, `${n1}/${d1}`, x0 + (n1 * cw) / 2, y0 - 16, "fdp-text fdp-label");
    text(s, `${n2}/${d2}`, x0 - 24, y0 + (n2 * ch) / 2, "fdp-text fdp-label");
    return s;
  }

  function renderDoubleNumberLine(config = {}) {
    const topLabel = config.topLabel ?? "%";
    const bottomLabel = config.bottomLabel ?? "amount";
    const topMax = Number.isFinite(config.topMax) ? config.topMax : 100;
    const bottomMax = Number.isFinite(config.bottomMax) ? config.bottomMax : 100;
    const ticks = Math.max(2, Math.min(10, Number(config.ticks) || 4));
    const markTop = config.markTop;
    const markBottom = config.markBottom;

    // Drawing occupies y 42..174 and x 2..576. The old 0 0 620 200 box carried
    // a dead band above the top scale and to the right of the last label, which
    // on the page became wasted column height on the diagram teachers most
    // often want wide and legible.
    const s = svg("0 34 590 150");
    const left = 70, right = 560, yTop = 70, yBot = 140;
    const x = frac => left + frac * (right - left);

    line(s, left, yTop, right, yTop);
    line(s, left, yBot, right, yBot);

    for (let i = 0; i <= ticks; i++) {
      const f = i / ticks;
      line(s, x(f), yTop - 9, x(f), yTop + 9, "fdp-thin");
      line(s, x(f), yBot - 9, x(f), yBot + 9, "fdp-thin");
      text(s, fmtNumber(topMax * f), x(f), yTop - 20, "fdp-text fdp-small");
      text(s, fmtNumber(bottomMax * f), x(f), yBot + 26, "fdp-text fdp-small");
    }
    text(s, String(topLabel), 30, yTop, "fdp-text fdp-small");
    text(s, String(bottomLabel), 30, yBot, "fdp-text fdp-small");

    if (Number.isFinite(markTop)) {
      const f = markTop / topMax;
      s.appendChild(el("circle", { cx: x(f), cy: yTop, r: 7, class: "fdp-fill" }));
    }
    if (Number.isFinite(markBottom)) {
      const f = markBottom / bottomMax;
      s.appendChild(el("circle", { cx: x(f), cy: yBot, r: 7, class: "fdp-fill" }));
    }
    return s;
  }

  function render(target, config = {}) {
    target.innerHTML = "";
    const type = config.diagramType || "fraction-bar";
    let node;

    if (type === "percentage-grid") node = renderPercentageGrid(config);
    else if (type === "decimal-number-line") node = renderDecimalNumberLine(config);
    else if (type === "conversion-strip") node = renderConversionStrip(config);
    else if (type === "best-buy-bars") node = renderBestBuyBars(config);
    else if (type === "fraction-circle") node = renderFractionCircle(config);
    else if (type === "fraction-of-set") node = renderFractionOfSet(config);
    else if (type === "number-line-fraction") node = renderNumberLineFraction(config);
    else if (type === "equivalent-bars") node = renderEquivalentBars(config);
    else if (type === "fraction-multiply-area") node = renderFractionMultiplyArea(config);
    else if (type === "double-number-line") node = renderDoubleNumberLine(config);
    else node = renderFractionBar(config);

    target.appendChild(node);
  }

  return { render };
})();
