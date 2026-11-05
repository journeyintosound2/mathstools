/* Area — MA4-ARE-C-01 — whole-topic quiz bank.
   Content statements: develop and use formulas for the area of rectangles,
   triangles and parallelograms · the area of circles and sectors · the area
   of trapeziums, rhombuses and kites · choose appropriate units of area and
   convert between them. */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = s => `<span class="m">${s}</span>`;
const UNITS = ["cm", "m", "mm"];
const sqU = u => `${u}²`;
const PI_ALTS = (f, dp) => [round(f(3.14), dp), round(f(22 / 7), dp)];
const A = (config, scale = 1.05, maxH = 320) => ({ engine: "area-engine", config, scale, maxH });
const half = v => v / 2;

/* ================================ BASIC ================================ */
add("basic", "b-rectangle", "Area of rectangles and squares", () => {
  const u = pick(UNITS), a = ri(3, 25), c = Math.random() < 0.2 ? a : ri(2, 20);
  const l = Math.max(a, c), w = Math.min(a, c); // the drawing is landscape, so the longer side runs along it
  return { prompt: `Find the area of this ${l === w ? "square" : "rectangle"}.`, diagram: A({ diagramType: "rectangle", lengthLabel: `${l} ${u}`, widthLabel: `${w} ${u}` }), mode: "num", value: l * w, unit: sqU(u), why: `A = l × w = ${l} × ${w} = ${l * w} ${sqU(u)}.` };
});
add("basic", "b-triangle", "Area of triangles", () => {
  // The picture is drawn wider than tall, so the numbers are too (height 30%–100% of the base).
  const u = pick(UNITS), b = ri(4, 24), h = ri(Math.max(2, Math.ceil(b * 0.3)), b);
  return { prompt: `Find the area of this triangle.`, diagram: A({ diagramType: "triangle", baseLabel: `${b} ${u}`, heightLabel: `${h} ${u}`, oblique: Math.random() < 0.5 }), mode: "num", value: b * h / 2, unit: sqU(u), why: `A = ½ × b × h = ½ × ${b} × ${h} = ${fmt(b * h / 2)} ${sqU(u)}.` };
});
add("basic", "b-parallelogram", "Area of parallelograms", () => {
  const u = pick(UNITS), b = ri(4, 24), h = ri(Math.max(2, Math.ceil(b * 0.3)), Math.min(b, 16));
  return { prompt: `Find the area of this parallelogram.`, diagram: A({ diagramType: "parallelogram", baseLabel: `${b} ${u}`, heightLabel: `${h} ${u}` }), mode: "num", value: b * h, unit: sqU(u), why: `A = b × h (the perpendicular height) = ${b} × ${h} = ${b * h} ${sqU(u)}.` };
});
add("basic", "b-circle-pi", "Area of a circle in terms of π", () => {
  const u = pick(UNITS), byD = Math.random() < 0.4, r = ri(2, 15);
  const cfg = byD ? { diagramType: "circle", given: "diameter", diameter: 2 * r, diameterLabel: `${2 * r} ${u}`, unit: u } : { diagramType: "circle", given: "radius", radius: r, radiusLabel: `${r} ${u}`, unit: u };
  return { prompt: `Find the area of the circle. Give your answer in terms of π.`, diagram: A(cfg, 0.95), mode: "pi", k: r * r, unit: sqU(u), answerHTML: M(`${r * r}π ${sqU(u)}`), why: `${byD ? `r = ${2 * r} ÷ 2 = ${r}. ` : ""}A = πr² = π × ${r}² = ${r * r}π ${sqU(u)}.` };
});
add("basic", "b-units", "Choose a unit of area", () => {
  const items = [
    ["a postage stamp", "cm²"], ["a fingernail", "mm²"], ["a classroom floor", "m²"], ["a mobile phone screen", "cm²"], ["a farm", "ha"],
    ["the state of New South Wales", "km²"], ["a netball court", "m²"], ["a sheet of A4 paper", "cm²"], ["a grain of sand", "mm²"], ["a national park", "km²"], ["a backyard", "m²"]
  ];
  const [thing, unit] = pick(items);
  const opts = ["mm²", "cm²", "m²", "ha", "km²"];
  return { prompt: `Which unit is most appropriate for measuring the area of <b>${thing}</b>?`, mode: "mc", options: opts, correct: opts.indexOf(unit), keepOrder: true, why: `${unit} suits ${thing}. (1 ha = 10 000 m², the area of a 100 m × 100 m square.)` };
});
add("basic", "b-missing", "Find a missing length from the area", () => {
  const u = pick(UNITS), k = pick([0, 1]);
  if (k === 0) { const l = ri(4, 15), w = ri(2, 12); return { prompt: `A rectangle has an area of ${l * w} ${sqU(u)} and a length of ${l} ${u}. Find its width.`, mode: "num", value: w, unit: u, why: `w = A ÷ l = ${l * w} ÷ ${l} = ${w} ${u}.` }; }
  const b = ri(3, 14), h = ri(2, 12); return { prompt: `A parallelogram has an area of ${b * h} ${sqU(u)} and a base of ${b} ${u}. Find its perpendicular height.`, mode: "num", value: h, unit: u, why: `h = A ÷ b = ${b * h} ÷ ${b} = ${h} ${u}.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-trapezium", "Area of trapeziums", () => {
  const u = pick(UNITS), b = ri(8, 24), a = ri(3, b - 2), h = ri(Math.max(3, Math.ceil(b * 0.3)), Math.max(4, Math.round(b * 0.7))); // drawn about half as tall as wide
  return { prompt: `Find the area of this trapezium.`, diagram: A({ diagramType: "trapezium", topLabel: `${a} ${u}`, bottomLabel: `${b} ${u}`, heightLabel: `${h} ${u}` }), mode: "num", value: (a + b) * h / 2, unit: sqU(u), why: `A = ½ × (a + b) × h = ½ × (${a} + ${b}) × ${h} = ${fmt((a + b) * h / 2)} ${sqU(u)}.` };
});
add("expected", "e-rhombus-kite", "Area of rhombuses and kites", () => {
  const u = pick(UNITS), kind = pick(["rhombus", "kite"]), x = ri(4, 24), y = ri(4, 20);
  return { prompt: `The diagonals of this ${kind} are ${x} ${u} and ${y} ${u} long. Find its area.`, diagram: A({ diagramType: kind, diagonalXLabel: `${x} ${u}`, diagonalYLabel: `${y} ${u}` }), mode: "num", value: x * y / 2, unit: sqU(u), why: `A = ½ × x × y (half the product of the diagonals) = ½ × ${x} × ${y} = ${fmt(x * y / 2)} ${sqU(u)}.` };
});
add("expected", "e-circle-dp", "Area of a circle (1 decimal place)", () => {
  const u = pick(UNITS), byD = Math.random() < 0.5, r = ri(2, 20) + (byD ? 0 : pick([0, 0, 0.5]));
  const f = p => p * r * r;
  const cfg = byD ? { diagramType: "circle", given: "diameter", diameter: 2 * r, diameterLabel: `${fmt(2 * r)} ${u}`, unit: u } : { diagramType: "circle", given: "radius", radius: r, radiusLabel: `${fmt(r)} ${u}`, unit: u };
  return { prompt: `Find the area of the circle, correct to 1 decimal place.`, diagram: A(cfg, 0.95), mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: sqU(u), why: `${byD ? `r = ${fmt(2 * r)} ÷ 2 = ${fmt(r)}. ` : ""}A = πr² = π × ${fmt(r)}² ≈ ${round(f(Math.PI), 1).toFixed(1)} ${sqU(u)}.` };
});
add("expected", "e-sector", "Area of sectors", () => {
  const u = pick(UNITS), ang = pick([30, 45, 60, 90, 120, 135, 150, 240, 270, 300]), r = pick([2, 3, 4, 6, 8, 9, 10, 12]);
  const fr = ang / 360, k = round(fr * r * r, 6);
  const diagram = A({ diagramType: "sector", angle: ang, radius: r, radiusLabel: `${r} ${u}`, unit: u }, 0.95);
  if (Number.isInteger(k * 4) && Math.random() < 0.5) return { prompt: `Find the area of the sector. Give your answer in terms of π.`, diagram, mode: "pi", k, unit: sqU(u), answerHTML: M(`${fmt(k)}π ${sqU(u)}`), why: `A = ${ang}/360 × π × ${r}² = ${fmt(k)}π ${sqU(u)}.` };
  const f = p => fr * p * r * r;
  return { prompt: `Find the area of the sector, correct to 1 decimal place.`, diagram, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: sqU(u), why: `A = ${ang}/360 × π × ${r}² ≈ ${round(f(Math.PI), 1).toFixed(1)} ${sqU(u)}.` };
});
add("expected", "e-semi-quad", "Area of semicircles and quadrants", () => {
  const u = pick(UNITS), shape = pick(["semicircle", "quadrant"]), r = ri(2, 18);
  const f = p => (shape === "semicircle" ? 0.5 : 0.25) * p * r * r;
  return { prompt: `Find the area of the ${shape}, correct to 1 decimal place.`, diagram: A({ diagramType: "partial-circle", shape, radius: r, radiusLabel: `${r} ${u}`, unit: u }, 0.95), mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: sqU(u), why: `A = ${shape === "semicircle" ? "½" : "¼"} × π × ${r}² ≈ ${round(f(Math.PI), 1).toFixed(1)} ${sqU(u)}.` };
});
/* L-shaped composite: drawn by the length engine with just the sides needed */
function lShape(u) {
  const W = ri(8, 20), H = ri(6, 16), cw = ri(2, W - 3), ch = ri(2, H - 3);
  const pts = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]];
  const sides = [W - cw, ch, cw, H - ch, W, H];
  const show = [true, true, false, true, true, true];
  const k = Math.min(420 / W, 300 / H), ox = 360 - W * k / 2, oy = 215 - H * k / 2;
  const points = pts.map(([x, y]) => ({ x: Math.round(ox + x * k), y: Math.round(oy + y * k) }));
  const edgeLabels = [];
  pts.forEach((a, i) => {
    if (!show[i]) return; const b = pts[(i + 1) % 6];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = dy / len, ny = -dx / len;
    edgeLabels.push({ edge: [i, (i + 1) % 6], text: `${sides[i]} ${u}`, dx: nx * 62, dy: ny * 40, className: "shape-label" });
  });
  return { area: W * H - cw * ch, W, H, cw, ch, diagram: { engine: "length-engine", config: { diagramType: "composite-rectilinear", points, edgeLabels, labelOffsetScale: 0.72 }, scale: 1, maxH: 320 } };
}
add("expected", "e-composite", "Area of composite shapes", () => {
  const u = pick(UNITS), k = pick(["L", "L", "rs", "ring"]);
  if (k === "L") { const L = lShape(u); return { prompt: `Find the area of this shape. All corners are right angles.`, diagram: L.diagram, mode: "num", value: L.area, unit: sqU(u), why: `Take the cut-out corner from the big rectangle: ${L.W} × ${L.H} − ${L.cw} × ${L.ch} = ${L.W * L.H} − ${L.cw * L.ch} = ${L.area} ${sqU(u)}.` }; }
  if (k === "rs") {
    const h = 2 * ri(2, 6), w = h + 2 * ri(1, 6);
    const f = p => w * h + 0.5 * p * (h / 2) ** 2;
    return { prompt: `The shape is a rectangle with a semicircle on one end. Find its area, correct to 1 decimal place.`, diagram: A({ diagramType: "curved-composite", shape: "rectangle-semicircle", width: w, height: h, widthLabel: `${w} ${u}`, heightLabel: `${h} ${u}`, unit: u }, 1.0), mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: sqU(u),
      why: `Rectangle ${w} × ${h} = ${w * h}. Semicircle radius ${h / 2}: ½ × π × ${h / 2}² ≈ ${fmt(0.5 * Math.PI * (h / 2) ** 2, 2)}. Total ≈ ${round(f(Math.PI), 1).toFixed(1)} ${sqU(u)}.` };
  }
  const R = ri(4, 12), r = ri(2, R - 2);
  return { prompt: `Find the area of the shaded ring. Give your answer in terms of π.`, diagram: A({ diagramType: "curved-composite", shape: "annulus", outerLabel: `${R} ${u}`, innerLabel: `${r} ${u}` }, 1.0), mode: "pi", k: R * R - r * r, unit: sqU(u), answerHTML: M(`${R * R - r * r}π ${sqU(u)}`), why: `Big circle − small circle = π × ${R}² − π × ${r}² = ${R * R}π − ${r * r}π = ${R * R - r * r}π ${sqU(u)}.` };
});
add("expected", "e-convert", "Convert units of area", () => {
  const items = [
    () => { const v = pick([3, 4.5, 0.6, 12, 2.25]); return [`${fmt(v)} cm²`, "mm²", v * 100, "1 cm² = 10 × 10 = 100 mm²"]; },
    () => { const v = pick([450, 1200, 85, 3000]); return [`${fmt(v)} mm²`, "cm²", v / 100, "100 mm² = 1 cm²"]; },
    () => { const v = pick([2, 0.5, 3.6, 1.25]); return [`${fmt(v)} m²`, "cm²", v * 10000, "1 m² = 100 × 100 = 10 000 cm²"]; },
    () => { const v = pick([25000, 8000, 150000, 4500]); return [`${fmt(v)} cm²`, "m²", v / 10000, "10 000 cm² = 1 m²"]; },
    () => { const v = pick([3, 0.8, 12.5, 2.4]); return [`${fmt(v)} ha`, "m²", v * 10000, "1 ha = 10 000 m²"]; },
    () => { const v = pick([45000, 120000, 6500, 250000]); return [`${fmt(v)} m²`, "ha", v / 10000, "10 000 m² = 1 ha"]; },
    () => { const v = pick([2, 7.5, 0.3, 15]); return [`${fmt(v)} km²`, "ha", v * 100, "1 km² = 100 ha"]; }
  ];
  const [from, to, val, rule] = pick(items)();
  return { prompt: `Convert ${M(from)} to ${to}.`, mode: "num", value: round(val, 6), unit: to, why: `${rule}, so ${fmt(round(val, 6))} ${to}.` };
});
add("expected", "e-missing", "Work backwards from an area", () => {
  const u = pick(UNITS), k = pick([0, 1, 2]);
  if (k === 0) { const b = ri(4, 20), h = ri(3, 16); return { prompt: `A triangle has an area of ${fmt(b * h / 2)} ${sqU(u)} and a base of ${b} ${u}. Find its perpendicular height.`, mode: "num", value: h, unit: u, why: `½ × ${b} × h = ${fmt(b * h / 2)}, so h = 2 × ${fmt(b * h / 2)} ÷ ${b} = ${h} ${u}.` }; }
  if (k === 1) { const s = ri(3, 20); return { prompt: `A square has an area of ${s * s} ${sqU(u)}. How long is each side?`, mode: "num", value: s, unit: u, why: `s = √${s * s} = ${s} ${u}.` }; }
  const a = ri(3, 10), b = a + ri(2, 10), h = 2 * ri(2, 8);
  return { prompt: `A trapezium has parallel sides of ${a} ${u} and ${b} ${u}, and an area of ${(a + b) * h / 2} ${sqU(u)}. Find its perpendicular height.`, mode: "num", value: h, unit: u, why: `½ × (${a} + ${b}) × h = ${(a + b) * h / 2}, so ${(a + b) / 2} × h = ${(a + b) * h / 2} and h = ${h} ${u}.` };
});

MMTQ.run({
  id: "area", title: "Area", outcome: "MA4-ARE-C-01",
  toolId: "area-quiz", tool: "area-student-quiz", mastery: "area",
  levels: {
    basic: { sub: "Rectangles, triangles and parallelograms, the area of a circle in terms of π, choosing units, finding a missing side." },
    expected: { sub: "Trapeziums, rhombuses and kites, circles and sectors to 1 decimal place, composite shapes, converting units, working backwards." }
  },
  related: [
    { href: "/interactive-tools/stage-4/measurement-space/area-of-a-triangle/", label: "Area of a Triangle", small: "Teaching tool" },
    { href: "/interactive-tools/stage-4/measurement-space/area-of-a-parallelogram/", label: "Area of a Parallelogram & Rhombus", small: "Teaching tool" },
    { href: "/online-quizzes/stage-4/measurement-space/area-of-a-triangle.html", label: "Area of a Triangle", small: "Focused quiz" }
  ],
  types: T
});
