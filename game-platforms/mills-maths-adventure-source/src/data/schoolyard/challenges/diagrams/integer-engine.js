/*
  Exam Builder — Integer Diagram Engine
  -------------------------------------
  Save as:

  engines/integers/integer-engine.js

  Exposes:
  window.MMT_INTEGER_ENGINE.render(target, config)

  Diagram types:
  - number-line          A scaled number line; can mark/place a value.
  - number-line-jumps    A number line that models addition/subtraction with
                         curved jump arrows (e.g. start at −3, jump +5).
  - thermometer          A vertical temperature scale with a mercury fill;
                         supports an optional second (target) marker.
*/

window.MMT_INTEGER_ENGINE = (() => {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    return node;
  }

  function fmt(n) {
    return n < 0 ? `−${Math.abs(n)}` : String(n);
  }

  function baseStyle() {
    const style = el("style");
    style.textContent = `
      .integer-svg{overflow:visible}
      .int-baseline{stroke:#111827;stroke-width:5;stroke-linecap:round}
      .int-tick{stroke:#111827;stroke-width:3;stroke-linecap:round}
      .int-tick-minor{stroke:rgba(17,24,39,.45);stroke-width:2;stroke-linecap:round}
      .int-dot{fill:#111827}
      .int-answer-dot{fill:#16a34a}
      .int-jump{fill:none;stroke:#2563eb;stroke-width:3}
      .int-jump-neg{stroke:#dc2626}
      .int-jump-label{font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;fill:#2563eb;text-anchor:middle}
      .int-jump-label-neg{fill:#dc2626}
      .int-label{font-family:"Cambria Math","Times New Roman",serif;font-size:24px;font-weight:700;fill:#111827;text-anchor:middle;dominant-baseline:middle}
      .int-answer-label{fill:#16a34a}
      .therm-glass{fill:#ffffff;stroke:#111827;stroke-width:3}
      .therm-merc{fill:#dc2626}
      .therm-merc-cold{fill:#2563eb}
      .therm-tick{stroke:#111827;stroke-width:2;stroke-linecap:round}
      .therm-zero{stroke:#111827;stroke-width:3}
      .therm-label{font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;fill:#111827;text-anchor:end;dominant-baseline:middle}
      .therm-value{font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;fill:#111827;text-anchor:start;dominant-baseline:middle}
    `;
    return style;
  }

  function makeSvg(viewBox = "0 0 1000 200", label = "number line") {
    const svg = el("svg", {
      viewBox,
      width: "100%",
      height: "100%",
      role: "img",
      "aria-label": label,
      class: "integer-svg"
    });
    svg.appendChild(baseStyle());
    return svg;
  }

  /*
    Decide which axis labels can be drawn without colliding.

    Requested labels are just values, so two of them can land a few units apart
    on the axis and print on top of each other — "27" and "30" overlapped into
    an unreadable smudge on a −30..30 line. Rather than shrink every label, the
    crowded one is dropped.

    Priority matters: zero and the two end values are what a student reads the
    scale from, so they are placed first and never dropped in favour of an
    interior label.
  */
  function resolveAxisLabels(values, x, min, max) {
    // .int-label is 24 user units. Both constants are expressed against that so
    // they stay right if the label size changes.
    const LABEL_FONT_UNITS = 24;
    const LABEL_CHAR_UNITS = LABEL_FONT_UNITS * 0.58;   // digit advance width
    // Labels that merely fail to overlap still read as one number: "27" and
    // "30" ended up about 1mm apart on the printed page. Require a clear gap of
    // most of a character height between them.
    const MIN_GAP_UNITS = LABEL_FONT_UNITS * 0.85;

    const halfWidth = v => (fmt(v).length * LABEL_CHAR_UNITS) / 2;
    const unique = [...new Set(values.map(Number))].filter(Number.isFinite);

    const byPriority = [
      ...unique.filter(v => v === 0),
      ...unique.filter(v => v === min || v === max),
      ...unique.filter(v => v !== 0 && v !== min && v !== max)
    ];

    const kept = [];

    byPriority.forEach(v => {
      const collides = kept.some(other =>
        Math.abs(x(v) - x(other)) < halfWidth(v) + halfWidth(other) + MIN_GAP_UNITS
      );
      if (!collides) kept.push(v);
    });

    return new Set(kept);
  }

  function drawAxis(svg, { min, max, step, labels, left, right, y, labelY }) {
    const x = value => left + ((value - min) / (max - min)) * (right - left);
    const labelSet = resolveAxisLabels(labels, x, min, max);

    svg.appendChild(el("line", { x1: left, y1: y, x2: right, y2: y, class: "int-baseline" }));

    for (let v = min; v <= max + 1e-9; v += step) {
      const xi = x(v);
      const isLabelled = labelSet.has(v);
      svg.appendChild(el("line", {
        x1: xi, y1: y - (isLabelled ? 22 : 12),
        x2: xi, y2: y + (isLabelled ? 22 : 12),
        class: isLabelled ? "int-tick" : "int-tick-minor"
      }));
      if (isLabelled) {
        const t = el("text", { x: xi, y: labelY, class: "int-label" });
        t.textContent = fmt(v);
        svg.appendChild(t);
      }
    }
    return x;
  }

  function renderNumberLine(target, config = {}) {
    const svg = makeSvg("0 0 1000 200");

    const min = Number.isFinite(config.min) ? config.min : -10;
    const max = Number.isFinite(config.max) ? config.max : 10;
    const step = Number.isFinite(config.step) ? config.step : 1;
    const labels = Array.isArray(config.labels) ? config.labels : [min, 0, max];
    const answer = config.answer;
    const showAnswer = !!config.showAnswer;

    const left = 85, right = 915, y = 86, labelY = 168;
    const x = drawAxis(svg, { min, max, step, labels, left, right, y, labelY });

    const labelSet = new Set(labels.map(Number));
    labels.forEach(v => {
      if (Number.isFinite(Number(v))) {
        svg.appendChild(el("circle", { cx: x(Number(v)), cy: y, r: 8, class: "int-dot" }));
      }
    });

    if (showAnswer && Number.isFinite(answer)) {
      const xi = x(answer);
      svg.appendChild(el("circle", { cx: xi, cy: y, r: 9, class: "int-answer-dot" }));
      // hideAnswerLabel (game addition): mark the dot but do not print its value.
      if (!labelSet.has(answer) && !config.hideAnswerLabel) {
        const t = el("text", { x: xi, y: labelY, class: "int-label int-answer-label" });
        t.textContent = fmt(answer);
        svg.appendChild(t);
      }
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderNumberLineJumps(target, config = {}) {
    const svg = makeSvg("0 0 1000 230", "number line with jumps");

    const min = Number.isFinite(config.min) ? config.min : -10;
    const max = Number.isFinite(config.max) ? config.max : 10;
    const step = Number.isFinite(config.step) ? config.step : 1;
    const start = Number.isFinite(config.start) ? config.start : 0;
    const jumps = Array.isArray(config.jumps) ? config.jumps : [];
    const labels = Array.isArray(config.labels) ? config.labels : [min, 0, max];
    const showEnd = config.showEnd === true;

    const left = 85, right = 915, y = 150, labelY = 200;
    const x = drawAxis(svg, { min, max, step, labels, left, right, y, labelY });

    // Start marker.
    svg.appendChild(el("circle", { cx: x(start), cy: y, r: 8, class: "int-dot" }));

    let current = start;
    jumps.forEach(j => {
      const by = Number(j.by) || 0;
      const next = current + by;
      const x1 = x(current), x2 = x(next);
      const mx = (x1 + x2) / 2;
      const span = Math.abs(x2 - x1);
      const lift = Math.min(70, 24 + span * 0.18);
      const neg = by < 0;
      // Curved arc above the line.
      svg.appendChild(el("path", {
        d: `M ${x1} ${y - 6} Q ${mx} ${y - 6 - lift} ${x2} ${y - 6}`,
        class: `int-jump${neg ? " int-jump-neg" : ""}`
      }));
      // Arrowhead at the destination.
      const dir = x2 >= x1 ? 1 : -1;
      svg.appendChild(el("path", {
        d: `M ${x2} ${y - 6} l ${-dir * 11} ${-9} l 0 18 z`,
        class: `int-jump${neg ? " int-jump-neg" : ""}`,
        fill: neg ? "#dc2626" : "#2563eb",
        stroke: "none"
      }));
      const lab = el("text", { x: mx, y: y - 14 - lift, class: `int-jump-label${neg ? " int-jump-label-neg" : ""}` });
      lab.textContent = `${by >= 0 ? "+" : "−"}${Math.abs(by)}`;
      svg.appendChild(lab);
      current = next;
    });

    if (showEnd) {
      svg.appendChild(el("circle", { cx: x(current), cy: y, r: 9, class: "int-answer-dot" }));
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderThermometer(target, config = {}) {
    const min = Number.isFinite(config.min) ? config.min : -20;
    const max = Number.isFinite(config.max) ? config.max : 40;
    const step = Number.isFinite(config.step) ? config.step : 10;
    const value = Number.isFinite(config.value) ? Math.max(min, Math.min(max, config.value)) : null;
    const value2 = Number.isFinite(config.value2) ? Math.max(min, Math.min(max, config.value2)) : null;
    const unit = config.unit || "°C";
    const showValue = config.showValue !== false;

    // viewBox trimmed to what is actually drawn. The scale labels end at
    // x=120 (anchored end, ~35px wide) and the value text runs to about x=262,
    // so a 0..300 box carried roughly 100px of empty margin — about a third of
    // the width. Trimming it also moves the thermometer from the "square"
    // aspect band into "tall", which is what it really is, so it stops being
    // given a square diagram's width budget on the page.
    const svg = makeSvg("78 12 196 446", "thermometer");

    const top = 30, bottom = 380, cx = 150;
    const tubeW = 40, bulbR = 34;
    const y = v => bottom - ((v - min) / (max - min)) * (bottom - top);

    // Glass tube + bulb.
    svg.appendChild(el("rect", {
      x: cx - tubeW / 2, y: top, width: tubeW, height: bottom - top + 6,
      rx: tubeW / 2, ry: tubeW / 2, class: "therm-glass"
    }));
    svg.appendChild(el("circle", { cx, cy: bottom + bulbR - 4, r: bulbR, class: "therm-glass" }));

    // Mercury fill from bulb up to value.
    if (value !== null) {
      const cold = value < 0;
      svg.appendChild(el("circle", {
        cx, cy: bottom + bulbR - 4, r: bulbR - 7,
        class: cold ? "therm-merc-cold" : "therm-merc"
      }));
      const fillTop = y(value);
      svg.appendChild(el("rect", {
        x: cx - (tubeW - 14) / 2, y: fillTop, width: tubeW - 14, height: (bottom + 4) - fillTop,
        class: cold ? "therm-merc-cold" : "therm-merc"
      }));
    }

    // Scale ticks + labels (right side of tube).
    for (let v = min; v <= max + 1e-9; v += step) {
      const yi = y(v);
      const isZero = v === 0;
      svg.appendChild(el("line", {
        x1: cx + tubeW / 2, y1: yi, x2: cx + tubeW / 2 + (isZero ? 22 : 14), y2: yi,
        class: isZero ? "therm-zero" : "therm-tick"
      }));
      const t = el("text", { x: cx - tubeW / 2 - 10, y: yi, class: "therm-label" });
      t.textContent = fmt(v);
      svg.appendChild(t);
    }

    // Target/second marker as a small triangle.
    if (value2 !== null) {
      const yi = y(value2);
      svg.appendChild(el("path", {
        d: `M ${cx + tubeW / 2 + 26} ${yi} l 16 -9 l 0 18 z`,
        fill: "#16a34a", stroke: "#111827", "stroke-width": 1.5
      }));
    }

    if (showValue && value !== null) {
      const t = el("text", { x: cx + tubeW / 2 + 30, y: y(value), class: "therm-value" });
      t.textContent = `${fmt(value)}${unit}`;
      svg.appendChild(t);
    }

    target.innerHTML = "";
    target.appendChild(svg);
  }

  function render(target, config = {}) {
    if (!target) return;
    const type = config.diagramType || "number-line";

    if (type === "number-line") return renderNumberLine(target, config);
    if (type === "number-line-jumps") return renderNumberLineJumps(target, config);
    if (type === "thermometer") return renderThermometer(target, config);

    target.innerHTML = "<div class='diagram-placeholder'>Unknown integer diagram</div>";
  }

  return { render };
})();
