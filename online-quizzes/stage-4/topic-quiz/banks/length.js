/* Length — MA4-LEN-C-01 — whole-topic quiz bank.
   Content statements: solve problems involving the perimeter of various
   quadrilaterals and simple composite figures · describe the relationships
   between the features of circles (radius, diameter, circumference, arcs,
   sectors) and use them to find circumferences and perimeters.
   Polygons are drawn by the geometry engine with their equal-side marks, so
   a student has to USE the properties (opposite sides of a parallelogram,
   the two pairs of a kite) rather than add whatever numbers they see. */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = s => `<span class="m">${s}</span>`;
const UNITS = ["cm", "m", "mm"];
const PI_ALTS = (f, dp) => [round(f(3.14), dp), round(f(22 / 7), dp)];

/* ---------- figures ---------- */
const geo = (cfg, scale = 1.05) => ({ engine: "geometry-engine", config: Object.assign({ vertexLabels: false }, cfg), scale });
function polyFig(kind, s) {
  // y-down coordinates, about 300 wide
  const P = {
    square: { A: [0, 220], B: [220, 220], C: [220, 0], D: [0, 0] },
    rectangle: { A: [0, 170], B: [320, 170], C: [320, 0], D: [0, 0] },
    parallelogram: { A: [0, 160], B: [260, 160], C: [330, 0], D: [70, 0] },
    rhombus: { A: [0, 150], B: [200, 150], C: [300, 0], D: [100, 0] },
    kite: { A: [150, 0], B: [260, 90], C: [150, 300], D: [40, 90] },
    trapezium: { A: [0, 170], B: [340, 170], C: [250, 0], D: [70, 0] },
    isosceles: { A: [0, 220], B: [260, 220], C: [130, 0] }
  }[kind];
  const ring = Object.keys(P);
  const cfg = { points: P, polygons: [{ pts: ring }], ticks: [], parallel: [], angles: [], sideLabels: [] };
  return { cfg, ring };
}

/* Rectilinear composite (L or U), in units, drawn by the length engine. */
function rectilinear(kind) {
  let pts, sides, perim;
  if (kind === "L") {
    const W = ri(8, 20), H = ri(6, 16), cw = ri(2, W - 3), ch = ri(2, H - 3);
    pts = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]];
    perim = 2 * (W + H);
    sides = [W - cw, ch, cw, H - ch, W, H];
  } else {
    const W = ri(14, 24), H = ri(8, 16), a = ri(3, 6), nw = ri(5, W - a - 4), nd = ri(2, H - 4);
    pts = [[0, 0], [a, 0], [a, nd], [a + nw, nd], [a + nw, 0], [W, 0], [W, H], [0, H]];
    perim = 2 * (W + H) + 2 * nd;
    sides = [a, nd, nw, nd, W - a - nw, H, W, H];
  }
  return { pts, sides, perim, kind };
}
function rectDiagram(r, unit, show) {
  const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]);
  const W = Math.max(...xs), H = Math.max(...ys), k = Math.min(420 / W, 300 / H);
  const ox = 360 - W * k / 2, oy = 215 - H * k / 2;
  const points = r.pts.map(([x, y]) => ({ x: Math.round(ox + x * k), y: Math.round(oy + y * k) }));
  const n = points.length;
  const edgeLabels = [];
  for (let i = 0; i < n; i++) {
    if (!show[i]) continue;
    const a = r.pts[i], b = r.pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    // clockwise in y-down: outward normal is (dy, -dx)
    const nx = dy / len, ny = -dx / len;
    // inner edges of a notch (outward normal pointing back over the shape) sit closer
    const inner = r.kind === "U" && (i === 1 || i === 3);
    edgeLabels.push({ edge: [i, (i + 1) % n], text: `${r.sides[i]} ${unit}`, dx: nx * (Math.abs(nx) > 0.5 ? (inner ? 46 : 62) : 0), dy: ny * (Math.abs(ny) > 0.5 ? 40 : 0), className: "shape-label" });
  }
  return { engine: "length-engine", config: { diagramType: "composite-rectilinear", points, edgeLabels, labelOffsetScale: 0.72 }, scale: 1.0, maxH: 330 };
}

/* ================================ BASIC ================================ */
add("basic", "b-perim-shape", "Perimeter of quadrilaterals and triangles", () => {
  const kind = pick(["square", "rectangle", "parallelogram", "rhombus", "kite", "trapezium", "isosceles"]);
  const u = pick(UNITS);
  const { cfg } = polyFig(kind);
  const L = (from, to, v) => cfg.sideLabels.push({ from, to, text: `${v} ${u}`, offset: C.labelOffset(cfg.points[from], cfg.points[to], `${v} ${u}`) });
  const tk = (from, to, count) => cfg.ticks.push({ from, to, count });
  let P, why, name = kind === "isosceles" ? "isosceles triangle" : kind;
  if (kind === "square") { const s = ri(3, 25); ["AB", "BC", "CD", "DA"].forEach(e => tk(e[0], e[1], 1)); L("A", "B", s); cfg.angles.push({ at: "A", from: "D", to: "B", right: true }); P = 4 * s; why = `All four sides are ${s} ${u}: 4 × ${s} = ${P} ${u}.`; }
  if (kind === "rectangle") { const l = ri(6, 30), w = ri(2, l - 1); tk("A", "B", 1); tk("C", "D", 1); tk("B", "C", 2); tk("D", "A", 2); L("A", "B", l); L("B", "C", w); ["A", "B", "C", "D"].forEach((v, i, a) => cfg.angles.push({ at: v, from: a[(i + 3) % 4], to: a[(i + 1) % 4], right: true })); P = 2 * (l + w); why = `Opposite sides are equal: 2 × (${l} + ${w}) = ${P} ${u}.`; }
  if (kind === "parallelogram") { const l = ri(6, 25), w = ri(3, 15); tk("A", "B", 1); tk("C", "D", 1); tk("B", "C", 2); tk("D", "A", 2); L("A", "B", l); L("B", "C", w); P = 2 * (l + w); why = `Opposite sides of a parallelogram are equal: 2 × (${l} + ${w}) = ${P} ${u}.`; }
  if (kind === "rhombus") { const s = ri(3, 25); ["AB", "BC", "CD", "DA"].forEach(e => tk(e[0], e[1], 1)); L("A", "B", s); P = 4 * s; why = `A rhombus has four equal sides: 4 × ${s} = ${P} ${u}.`; }
  if (kind === "kite") { const a = ri(4, 15), b = a + ri(3, 12); tk("A", "B", 1); tk("D", "A", 1); tk("B", "C", 2); tk("C", "D", 2); L("A", "B", a); L("B", "C", b); P = 2 * (a + b); why = `A kite has two pairs of equal adjacent sides: 2 × (${a} + ${b}) = ${P} ${u}.`; }
  if (kind === "trapezium") { const bot = ri(14, 30), top = ri(5, bot - 6), l = ri(5, 14), r = ri(5, 14); L("A", "B", bot); L("C", "D", top); L("D", "A", l); L("B", "C", r); cfg.parallel.push({ from: "A", to: "B" }, { from: "D", to: "C" }); P = bot + top + l + r; why = `Add all four sides: ${bot} + ${r} + ${top} + ${l} = ${P} ${u}.`; }
  if (kind === "isosceles") { const s = ri(6, 20); let b; do { b = ri(4, 2 * s - 2); } while (b === s); /* a base equal to the legs would be equilateral */ tk("B", "C", 1); tk("C", "A", 1); L("A", "B", b); L("C", "A", s); P = 2 * s + b; why = `Two sides are ${s} ${u} (they are marked equal): ${s} + ${s} + ${b} = ${P} ${u}.`; }
  return { prompt: `Find the perimeter of this ${name}.`, diagram: geo(cfg), mode: "num", value: P, unit: u, why };
});
add("basic", "b-composite", "Perimeter of a composite figure", () => {
  const r = rectilinear(pick(["L", "L", "U"])), u = pick(UNITS);
  return { prompt: `Find the perimeter of this shape. All corners are right angles.`, diagram: rectDiagram(r, u, r.sides.map(() => true)), mode: "num", value: r.perim, unit: u, why: `Add every side: ${r.sides.join(" + ")} = ${r.perim} ${u}.` };
}, q => null);
const FEATURES = ["radius", "diameter", "chord", "arc", "sector", "segment", "tangent"];
add("basic", "b-circle-parts", "Parts of a circle", () => {
  const f = pick(FEATURES);
  const opts = shuffle([f, ...shuffle(FEATURES.filter(x => x !== f)).slice(0, 3)]);
  const what = { radius: "an interval from the centre to the circle", diameter: "an interval through the centre with both ends on the circle", chord: "an interval joining two points on the circle", arc: "part of the circumference", sector: "a region bounded by two radii and an arc", segment: "a region between a chord and an arc", tangent: "a line that touches the circle at one point only" };
  return { prompt: `What is the name of the part of the circle marked with a question mark (?)`, diagram: { engine: "length-engine", config: { diagramType: "circle-features", feature: f }, scale: 1.0 }, mode: "mc", options: opts.map(o => o[0].toUpperCase() + o.slice(1)), correct: opts.indexOf(f), why: `A ${f} is ${what[f]}.` };
});
add("basic", "b-radius-diameter", "Radius and diameter", () => {
  const u = pick(UNITS);
  if (Math.random() < 0.5) { const r = ri(2, 40) + pick([0, 0, 0.5]); return { prompt: `A circle has a radius of ${fmt(r)} ${u}. What is its diameter?`, mode: "num", value: 2 * r, unit: u, why: `The diameter is twice the radius: 2 × ${fmt(r)} = ${fmt(2 * r)} ${u}.` }; }
  const d = ri(3, 60); return { prompt: `A circle has a diameter of ${d} ${u}. What is its radius?`, mode: "num", value: d / 2, unit: u, why: `The radius is half the diameter: ${d} ÷ 2 = ${fmt(d / 2)} ${u}.` };
});
add("basic", "b-circumference-pi", "Circumference in terms of π", () => {
  const u = pick(UNITS), byD = Math.random() < 0.5, v = ri(2, 30);
  const k = byD ? v : 2 * v;
  return { prompt: `Find the circumference of the circle. Give your answer in terms of π.`, diagram: { engine: "length-engine", config: { diagramType: "circle-measure", given: byD ? "diameter" : "radius", value: v, unit: u, [byD ? "diameter" : "radius"]: v }, scale: 0.95 }, mode: "pi", k, unit: u, answerHTML: M(`${k}π ${u}`), why: byD ? `C = πd = π × ${v} = ${k}π ${u}.` : `C = 2πr = 2 × π × ${v} = ${k}π ${u}.` };
});
add("basic", "b-convert", "Convert units of length", () => {
  const items = [
    () => { const v = pick([1.5, 2, 3.5, 4.2, 0.8, 6, 0.25]); return [`${fmt(v)} m`, "cm", v * 100, `1 m = 100 cm, so × 100`]; },
    () => { const v = pick([250, 400, 75, 1200, 35, 600]); return [`${fmt(v)} cm`, "m", v / 100, `100 cm = 1 m, so ÷ 100`]; },
    () => { const v = pick([45, 120, 8, 350, 62]); return [`${fmt(v)} mm`, "cm", v / 10, `10 mm = 1 cm, so ÷ 10`]; },
    () => { const v = pick([3.5, 12, 0.7, 25, 4.8]); return [`${fmt(v)} cm`, "mm", v * 10, `1 cm = 10 mm, so × 10`]; },
    () => { const v = pick([2.5, 0.6, 7, 1.25, 0.04]); return [`${fmt(v)} km`, "m", v * 1000, `1 km = 1000 m, so × 1000`]; },
    () => { const v = pick([4500, 800, 12000, 350, 2750]); return [`${fmt(v)} m`, "km", v / 1000, `1000 m = 1 km, so ÷ 1000`]; }
  ];
  const [from, to, val, rule] = pick(items)();
  return { prompt: `Convert ${M(from)} to ${to}.`, mode: "num", value: round(val, 6), unit: to, why: `${rule}: ${fmt(round(val, 6))} ${to}.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-composite-missing", "Composite figures with missing sides", () => {
  const r = rectilinear(pick(["L", "U"])), u = pick(UNITS);
  const show = r.sides.map(() => true);
  if (r.kind === "L") { show[1] = false; show[2] = false; }   // the inner step: found from the outer sides
  else { show[4] = false; show[5] = false; }                     // a top piece and the right side
  return { prompt: `Find the perimeter of this shape. All corners are right angles.`, diagram: rectDiagram(r, u, show), mode: "num", value: r.perim, unit: u,
    why: r.kind === "L" ? `Find the two unlabelled sides from the others first. The perimeter is the same as the surrounding rectangle: 2 × (${r.sides[4]} + ${r.sides[5]}) = ${r.perim} ${u}.` : `Missing sides: right side = ${r.sides[5]}, top right = ${r.sides[6]} − ${r.sides[0]} − ${r.sides[2]} = ${r.sides[4]}. Add all eight sides: ${r.perim} ${u}.` };
});
add("expected", "e-missing-side", "Work backwards from a perimeter", () => {
  const u = pick(UNITS), k = pick([0, 1, 2, 3]);
  if (k === 0) { const l = ri(8, 30), w = ri(3, l - 1); return { prompt: `A rectangle has a perimeter of ${2 * (l + w)} ${u} and a length of ${l} ${u}. Find its width.`, mode: "num", value: w, unit: u, why: `Length + width = ${2 * (l + w)} ÷ 2 = ${l + w}. Width = ${l + w} − ${l} = ${w} ${u}.` }; }
  if (k === 1) { const s = ri(3, 30) + pick([0, 0.5]); return { prompt: `A square has a perimeter of ${fmt(4 * s)} ${u}. How long is each side?`, mode: "num", value: s, unit: u, why: `${fmt(4 * s)} ÷ 4 = ${fmt(s)} ${u}.` }; }
  if (k === 2) { const s = ri(5, 20), b = ri(4, 2 * s - 2); return { prompt: `An isosceles triangle has a perimeter of ${2 * s + b} ${u}. Its base is ${b} ${u}. How long is each of the equal sides?`, mode: "num", value: s, unit: u, why: `${2 * s + b} − ${b} = ${2 * s}, shared between two equal sides: ${s} ${u}.` }; }
  const a = ri(4, 12), b = a + ri(2, 10); return { prompt: `A kite has a perimeter of ${2 * (a + b)} ${u}. Its two shorter sides are each ${a} ${u}. How long is each longer side?`, mode: "num", value: b, unit: u, why: `${2 * (a + b)} − 2 × ${a} = ${2 * b}, so each longer side is ${b} ${u}.` };
});
add("expected", "e-circumference", "Circumference to 1 decimal place", () => {
  const u = pick(UNITS), byD = Math.random() < 0.5, v = ri(3, 40) + pick([0, 0, 0.5]);
  const f = p => byD ? p * v : 2 * p * v;
  return { prompt: `Find the circumference of the circle, correct to 1 decimal place.`, diagram: { engine: "length-engine", config: { diagramType: "circle-measure", given: byD ? "diameter" : "radius", value: fmt(v), unit: u, [byD ? "diameter" : "radius"]: v }, scale: 0.95 }, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: u, why: byD ? `C = πd = π × ${fmt(v)} = ${fmt(f(Math.PI), 3)}… ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` : `C = 2πr = 2 × π × ${fmt(v)} = ${fmt(f(Math.PI), 3)}… ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` };
});
add("expected", "e-from-circumference", "Find the radius or diameter from the circumference", () => {
  const u = pick(UNITS), d = 2 * ri(2, 25), askR = Math.random() < 0.5;
  if (Math.random() < 0.5) return { prompt: `A circle has a circumference of ${M(`${d}π ${u}`)}. Find its ${askR ? "radius" : "diameter"}.`, mode: "num", value: askR ? d / 2 : d, unit: u, why: `C = πd, so d = ${d}π ÷ π = ${d} ${u}${askR ? `, and r = ${d / 2} ${u}` : ""}.` };
  const C0 = round(Math.PI * d, 1);
  return { prompt: `A circle has a circumference of ${C0.toFixed(1)} ${u}. Find its ${askR ? "radius" : "diameter"}, correct to the nearest whole number.`, mode: "num", value: askR ? d / 2 : d, dp: 0, unit: u, why: `d = C ÷ π = ${C0.toFixed(1)} ÷ π ≈ ${fmt(C0 / Math.PI, 2)}${askR ? `, so r ≈ ${fmt(C0 / Math.PI / 2, 2)}` : ""} → ${askR ? d / 2 : d} ${u}.` };
});
add("expected", "e-arc", "Arc length", () => {
  const u = pick(UNITS), ang = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300]), r = pick([4, 6, 8, 9, 10, 12, 15, 18, 20, 24]);
  const frac = ang / 360, k = round(2 * r * frac, 6);
  const diagram = { engine: "length-engine", config: { diagramType: "sector", radius: r, angle: ang, unit: u }, scale: 0.95 };
  if (Number.isInteger(k * 2) && Math.random() < 0.5) return { prompt: `Find the length of the arc. Give your answer in terms of π.`, diagram, mode: "pi", k, unit: u, answerHTML: M(`${fmt(k)}π ${u}`), why: `Arc = ${ang}/360 × 2π × ${r} = ${fmt(k)}π ${u}.` };
  const f = p => frac * 2 * p * r;
  return { prompt: `Find the length of the arc, correct to 1 decimal place.`, diagram, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: u, why: `Arc = ${ang}/360 × 2π × ${r} ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` };
});
add("expected", "e-semi-quad", "Perimeter of semicircles and quadrants", () => {
  const u = pick(UNITS), shape = pick(["semicircle", "quadrant"]), r = ri(3, 20);
  const f = p => shape === "semicircle" ? p * r + 2 * r : p * r / 2 + 2 * r;
  return { prompt: `Find the perimeter of the ${shape}, correct to 1 decimal place.`, diagram: { engine: "length-engine", config: { diagramType: "partial-circle", shape, radius: r, unit: u }, scale: 0.95 }, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: u,
    why: shape === "semicircle" ? `Curved part = ½ × 2π × ${r} = ${fmt(Math.PI * r, 3)}…; plus the diameter ${2 * r}. Total ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` : `Curved part = ¼ × 2π × ${r} = ${fmt(Math.PI * r / 2, 3)}…; plus two radii, 2 × ${r}. Total ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` };
});
add("expected", "e-sector-perimeter", "Perimeter of a sector", () => {
  const u = pick(UNITS), ang = pick([40, 60, 72, 100, 120, 150, 200, 240]), r = ri(4, 18);
  const f = p => ang / 360 * 2 * p * r + 2 * r;
  return { prompt: `Find the perimeter of the sector, correct to 1 decimal place.`, diagram: { engine: "length-engine", config: { diagramType: "sector", radius: r, angle: ang, unit: u }, scale: 0.95 }, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: u, why: `Arc = ${ang}/360 × 2π × ${r} ≈ ${fmt(f(Math.PI) - 2 * r, 2)}. Add the two radii: + ${2 * r}. Perimeter ≈ ${round(f(Math.PI), 1).toFixed(1)} ${u}.` };
});
add("expected", "e-wheel", "Circumference problems", () => {
  if (Math.random() < 0.5) {
    const d = pick([50, 56, 60, 65, 70, 72]), n = pick([10, 20, 50, 100, 250]);
    const f = p => p * d * n / 100;
    return { prompt: `A bicycle wheel has a diameter of ${d} cm. How far does the bike travel, in metres, when the wheel turns ${n} times? Give your answer to 1 decimal place.`, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: "m", why: `One turn = π × ${d} ≈ ${fmt(Math.PI * d, 2)} cm. ${n} turns ≈ ${fmt(Math.PI * d * n, 1)} cm = ${round(f(Math.PI), 1).toFixed(1)} m.` };
  }
  const r = pick([10, 12, 15, 20, 25, 30]);
  const f = p => 2 * p * r;
  return { prompt: `A circular garden bed has a radius of ${r} m. Edging is placed all the way around it. How many metres of edging are needed, to 1 decimal place?`, mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: "m", why: `C = 2πr = 2 × π × ${r} ≈ ${round(f(Math.PI), 1).toFixed(1)} m.` };
});

MMTQ.run({
  id: "length", title: "Length", outcome: "MA4-LEN-C-01",
  toolId: "length-quiz", tool: "length-student-quiz", mastery: "length",
  levels: {
    basic: { sub: "Perimeter of quadrilaterals, triangles and simple composite shapes, parts of a circle, radius and diameter, circumference in terms of π, units." },
    expected: { sub: "Composite figures with missing sides, working backwards, circumference and arc length, perimeters of sectors, semicircles and quadrants." }
  },
  related: [
    { href: "/interactive-tools/stage-4/measurement-space/perimeter-plane-shapes/", label: "Perimeter of Plane Shapes", small: "Teaching tool" },
    { href: "/interactive-tools/stage-4/measurement-space/circumference-of-a-circle/", label: "Circumference of a Circle", small: "Teaching tool" },
    { href: "/online-quizzes/stage-4/measurement-space/perimeter-plane-shapes.html", label: "Perimeter of Plane Shapes", small: "Focused quiz" }
  ],
  types: T
});
