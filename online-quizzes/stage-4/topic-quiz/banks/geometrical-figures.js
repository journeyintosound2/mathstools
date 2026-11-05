/* Properties of Geometrical Figures — MA4-GEO-C-01 — whole-topic quiz bank.
   Content statements: classify triangles according to their side and angle
   properties · classify quadrilaterals and describe their properties ·
   apply the properties of triangles and quadrilaterals.
   Figures are BUILT FROM THEIR ANGLES (figure-helpers.js, shared with the
   Revision Generator), so a triangle labelled 40° and 65° really has those
   angles; the harness re-measures every labelled angle. */
import { fitPoints, polygonFromAngles, triangleFromAngles, extendBeyond, nameVertices, measureAngle, TRIANGLE_LETTERS, QUAD_LETTERS } from "../../../../assessment/exam-builder/question-banks/_shared/figure-helpers.js";
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const PRO = ["x", "y", "a", "b", "m", "p", "t", "k"];
const deg = v => `${v}°`;
const G = (config, scale = 1.05) => ({ engine: "geometry-engine", config, scale, maxH: 330 });

/* every numeric angle label in the figure must match the drawing */
function figureCheck(q) {
  const cfg = q.diagram && q.diagram.config; if (!cfg) return null;
  for (const a of cfg.angles || []) {
    const P = cfg.points[a.at], Q = cfg.points[a.from], R = cfg.points[a.to];
    let m = measureAngle(P, Q, R); if (a.reflex) m = 360 - m;
    if (a.right && Math.abs(m - 90) > 1.2) return `right-angle mark at ${a.at} measures ${m.toFixed(1)}`;
    if (typeof a.label === "string" && /^\d+°$/.test(a.label) && Math.abs(m - parseInt(a.label)) > 1.2) return `angle ${a.at} labelled ${a.label} measures ${m.toFixed(1)}`;
  }
  if (q.meta && q.meta.at) {
    const { at, from, to } = q.meta; const m = measureAngle(cfg.points[at], cfg.points[from], cfg.points[to]);
    if (Math.abs(m - q.meta.value) > 1.2) return `unknown at ${at} measures ${m.toFixed(1)}, answer ${q.meta.value}`;
  }
  return null;
}
const interior = (ring, v, label, extra = {}) => { const i = ring.indexOf(v); return Object.assign({ at: v, from: ring[(i - 1 + ring.length) % ring.length], to: ring[(i + 1) % ring.length], label }, extra); };

function triangleAngles(min = 30, max = 120, step = 5) {
  for (;;) { const a = ri(min / step, max / step) * step, b = ri(min / step, max / step) * step, c = 180 - a - b; if (c >= min && c <= max) return [a, b, c]; }
}
function tri(angles, letters, rotateBy = pick([0, 0, 0, 12, -12, 180])) {
  const raw = triangleFromAngles(angles[0], angles[1], 10);
  return fitPoints(nameVertices(raw, letters), { size: 300, maxH: 210, rotateBy });
}

/* quadrilaterals with their markings (after the Revision Generator's quadShape) */
function quadShape(kind) {
  if (kind === "Square") return { raw: [[0, 0], [10, 0], [10, 10], [0, 10]], ticks: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]], right: [0, 1, 2, 3] };
  if (kind === "Rectangle") { const h = pick([5, 6, 7]); return { raw: [[0, 0], [12, 0], [12, h], [0, h]], ticks: [[0, 1, 1], [2, 3, 1], [1, 2, 2], [3, 0, 2]], right: [0, 1, 2, 3] }; }
  if (kind === "Rhombus") { const t = pick([55, 60, 65, 70, 115, 120]) * Math.PI / 180, s = 10; return { raw: [[0, 0], [s, 0], [s + s * Math.cos(t), s * Math.sin(t)], [s * Math.cos(t), s * Math.sin(t)]], ticks: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1]], right: [] }; }
  if (kind === "Parallelogram") { const k = pick([3, 4, -3]), h = pick([5, 6]); return { raw: [[0, 0], [12, 0], [12 + k, h], [k, h]], ticks: [[0, 1, 1], [2, 3, 1], [1, 2, 2], [3, 0, 2]], parallel: [[0, 1, 1], [3, 2, 1], [0, 3, 2], [1, 2, 2]], right: [] }; }
  if (kind === "Trapezium") { const k1 = pick([2, 3, 0]), k2 = pick([3, 4, 5]); return { raw: [[0, 0], [14, 0], [14 - k2, 6], [k1, 6]], parallel: [[0, 1, 1], [3, 2, 1]], right: k1 === 0 ? [0, 3] : [] }; }
  const top = pick([4, 5]), bottom = pick([9, 10]), half = pick([5, 6]);
  return { raw: [[0, top], [half, 0], [0, -bottom], [-half, 0]], ticks: [[0, 1, 1], [3, 0, 1], [1, 2, 2], [2, 3, 2]], right: [] };
}
function quadFigure(kind, letters, rotateBy = pick([0, 0, 10, -10, 25, 90])) {
  const s = quadShape(kind);
  const points = fitPoints(nameVertices(s.raw, letters), { size: 280, maxH: 220, rotateBy });
  const L = i => letters[i];
  return {
    points, polygons: [{ pts: letters.slice() }],
    ticks: (s.ticks || []).map(([i, j, c]) => ({ from: L(i), to: L(j), count: c })),
    parallel: (s.parallel || []).map(([i, j, c]) => ({ from: L(i), to: L(j), count: c })),
    angles: (s.right || []).map(i => interior(letters, L(i), false, { right: true }))
  };
}
const QUADS = ["Square", "Rectangle", "Rhombus", "Parallelogram", "Trapezium", "Kite"];
const QUAD_WHY = { Square: "four equal sides and four right angles", Rectangle: "opposite sides equal and four right angles", Rhombus: "four equal sides but no right angles", Parallelogram: "both pairs of opposite sides parallel and equal", Trapezium: "one pair of parallel sides", Kite: "two pairs of equal adjacent sides" };
const QUAD_PROPS = [
  ["all four sides equal", ["Square", "Rhombus"]],
  ["all four angles equal to 90°", ["Square", "Rectangle"]],
  ["both pairs of opposite sides parallel", ["Square", "Rectangle", "Rhombus", "Parallelogram"]],
  ["opposite angles equal", ["Square", "Rectangle", "Rhombus", "Parallelogram"]],
  ["diagonals that are equal in length", ["Square", "Rectangle"]],
  ["diagonals that bisect each other", ["Square", "Rectangle", "Rhombus", "Parallelogram"]],
  ["diagonals that meet at right angles", ["Square", "Rhombus", "Kite"]]
];

/* ================================ BASIC ================================ */
add("basic", "b-tri-sides", "Classify triangles by their sides", () => {
  const kind = pick(["Equilateral", "Isosceles", "Scalene"]), letters = pick(TRIANGLE_LETTERS), [A, B, Cc] = letters;
  let angles;
  if (kind === "Equilateral") angles = [60, 60, 60];
  else if (kind === "Isosceles") { const b = pick([35, 40, 45, 50, 65, 70, 75]); angles = [b, b, 180 - 2 * b]; }
  else { do { angles = triangleAngles(35, 100); } while (new Set(angles).size < 3 || angles.includes(60) || angles.includes(90) || Math.max(...angles) - Math.min(...angles) < 20); }
  const cfg = { points: tri(angles, letters), polygons: [{ pts: letters }] };
  if (kind === "Equilateral") cfg.ticks = [{ from: A, to: B }, { from: B, to: Cc }, { from: Cc, to: A }];
  if (kind === "Isosceles") cfg.ticks = [{ from: A, to: Cc }, { from: B, to: Cc }];
  if (kind === "Scalene") cfg.ticks = [{ from: A, to: B, count: 1 }, { from: B, to: Cc, count: 2 }, { from: Cc, to: A, count: 3 }];
  const opts = ["Equilateral", "Isosceles", "Scalene"];
  return { prompt: `Use the markings to classify ${M3(letters)} by its sides.`, diagram: G(cfg), mode: "mc", options: opts, correct: opts.indexOf(kind), keepOrder: true, why: kind === "Equilateral" ? "All three sides have the same mark: equilateral." : kind === "Isosceles" ? "Exactly two sides have the same mark: isosceles." : "The three sides all have different marks, so no two sides are equal: scalene." };
}, figureCheck);
function M3(l) { return `<span class="m">△${l.join("")}</span>`; }
add("basic", "b-tri-angles", "Classify triangles by their angles", () => {
  const kind = pick(["Acute-angled", "Right-angled", "Obtuse-angled"]), letters = pick(TRIANGLE_LETTERS);
  let angles;
  if (kind === "Right-angled") { const a = ri(7, 11) * 5; angles = shuffle([90, a, 90 - a]); }
  else if (kind === "Obtuse-angled") { const o = ri(20, 27) * 5, a = ri(5, (180 - o) / 5 - 5) * 5; angles = shuffle([o, a, 180 - o - a]); }
  else { do { angles = triangleAngles(40, 85); } while (angles.includes(90)); }
  const cfg = { points: tri(angles, letters), polygons: [{ pts: letters }], angles: [] };
  // show two angles; the student finds the third if they need it
  const hide = angles.indexOf(Math.min(...angles));
  letters.forEach((v, i) => { if (i === hide) return; cfg.angles.push(angles[i] === 90 ? interior(letters, v, false, { right: true }) : interior(letters, v, deg(angles[i]))); });
  const opts = ["Acute-angled", "Right-angled", "Obtuse-angled"];
  return { prompt: `Classify ${M3(letters)} by its angles.`, diagram: G(cfg), mode: "mc", options: opts, correct: opts.indexOf(kind), keepOrder: true, why: `The angles are ${angles.join("°, ")}°. ${kind === "Right-angled" ? "One angle is 90°." : kind === "Obtuse-angled" ? `One angle (${Math.max(...angles)}°) is more than 90°.` : "All three angles are less than 90°."}` };
}, figureCheck);
add("basic", "b-tri-sum", "Angle sum of a triangle", () => {
  const angles = triangleAngles(25, 120), letters = pick(TRIANGLE_LETTERS), p = pick(PRO), u = ri(0, 2);
  const cfg = { points: tri(angles, letters), polygons: [{ pts: letters }], angles: letters.map((v, i) => interior(letters, v, i === u ? p : deg(angles[i]))) };
  const others = angles.filter((_, i) => i !== u);
  return { prompt: `Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: angles[u], unit: "°", why: `Angles in a triangle add to 180°: ${p} = 180 − ${others[0]} − ${others[1]} = ${angles[u]}.`, meta: { ...pick3(letters, u), value: angles[u] } };
}, figureCheck);
function pick3(letters, i) { return { at: letters[i], from: letters[(i + 2) % 3], to: letters[(i + 1) % 3] }; }
add("basic", "b-quad-name", "Name a quadrilateral from its markings", () => {
  const kind = pick(QUADS), letters = pick(QUAD_LETTERS);
  const near = { Square: ["Rhombus", "Rectangle", "Kite"], Rectangle: ["Square", "Parallelogram", "Trapezium"], Rhombus: ["Square", "Parallelogram", "Kite"], Parallelogram: ["Rhombus", "Rectangle", "Trapezium"], Trapezium: ["Parallelogram", "Kite", "Rectangle"], Kite: ["Rhombus", "Trapezium", "Parallelogram"] }[kind];
  const opts = shuffle([kind, ...near]);
  return { prompt: `Use the markings to give the <b>most specific</b> name for quadrilateral ${letters.join("")}.`, diagram: G(quadFigure(kind, letters)), mode: "mc", options: opts, correct: opts.indexOf(kind), why: `It has ${QUAD_WHY[kind]}: a ${kind.toLowerCase()}.` };
}, figureCheck);
add("basic", "b-quad-sum", "Angle sum of a quadrilateral", () => {
  for (;;) {
    const a = [ri(12, 30) * 5, ri(12, 30) * 5, ri(12, 30) * 5]; const d = 360 - a[0] - a[1] - a[2];
    if (d < 60 || d > 150) continue;
    const angles = shuffle([...a, d]);
    const raw = polygonFromAngles(angles, [10, ri(7, 11)]); if (!raw) continue;
    const letters = pick(QUAD_LETTERS), u = ri(0, 3), p = pick(PRO);
    const pts = fitPoints(nameVertices(raw, letters), { size: 280, maxH: 220, rotateBy: pick([0, 0, 15, -15]) });
    const cfg = { points: pts, polygons: [{ pts: letters }], angles: letters.map((v, i) => interior(letters, v, i === u ? p : deg(angles[i]))) };
    const others = angles.filter((_, i) => i !== u);
    const i = u;
    return { prompt: `Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: angles[u], unit: "°", why: `Angles in a quadrilateral add to 360°: ${p} = 360 − ${others.join(" − ")} = ${angles[u]}.`, meta: { at: letters[i], from: letters[(i + 3) % 4], to: letters[(i + 1) % 4], value: angles[u] } };
  }
}, figureCheck);
add("basic", "b-props", "Properties of quadrilaterals", () => {
  const [prop, has] = pick(QUAD_PROPS), q = pick(QUADS.filter(x => x !== "Trapezium"));
  const t = has.includes(q);
  return { prompt: `True or false? Every <b>${q.toLowerCase()}</b> has ${prop}.`, mode: "tf", truth: t, why: t ? `True — a ${q.toLowerCase()} always has ${prop}.` : `False — ${has.length ? `only ${has.map(h => h.toLowerCase() + "s").join(", ").replace(/, ([^,]*)$/, " and $1")} always have ${prop}` : "not always"}.`, key: q + prop };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-isosceles", "Isosceles and equilateral triangles", () => {
  const letters = pick(TRIANGLE_LETTERS), [A, B, Cc] = letters, p = pick(PRO);
  const base = pick([25, 30, 35, 40, 50, 55, 65, 70, 75]), apex = 180 - 2 * base;
  const angles = [base, base, apex];
  const cfg = { points: tri(angles, letters, pick([0, 0, 180])), polygons: [{ pts: letters }], ticks: [{ from: A, to: Cc }, { from: B, to: Cc }], angles: [] };
  const givenApex = Math.random() < 0.5;
  if (givenApex) { cfg.angles.push(interior(letters, Cc, deg(apex)), interior(letters, A, p)); return { prompt: `The triangle is isosceles. Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: base, unit: "°", why: `The base angles are equal: ${p} = (180 − ${apex}) ÷ 2 = ${base}.`, meta: { ...pick3(letters, 0), value: base } }; }
  cfg.angles.push(interior(letters, A, deg(base)), interior(letters, Cc, p));
  return { prompt: `The triangle is isosceles. Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: apex, unit: "°", why: `The other base angle is also ${base}°, so ${p} = 180 − 2 × ${base} = ${apex}.`, meta: { ...pick3(letters, 2), value: apex } };
}, figureCheck);
add("expected", "e-exterior", "Exterior angle of a triangle", () => {
  const letters = pick(TRIANGLE_LETTERS), [A, B, Cc] = letters, p = pick(PRO);
  const angles = triangleAngles(30, 100);
  const pts = tri(angles, letters, 0);
  const D = ["D", "E", "G", "H", "T"].find(l => !letters.includes(l));
  pts[D] = extendBeyond(pts[A], pts[B], 0.5).map(v => Math.round(v * 10) / 10);
  const ext = 180 - angles[1];
  const cfg = { points: pts, polygons: [{ pts: letters }], segments: [{ from: B, to: D }], angles: [] };
  if (Math.random() < 0.5) {
    cfg.angles.push(interior(letters, A, deg(angles[0])), interior(letters, Cc, deg(angles[2])), { at: B, from: Cc, to: D, label: p });
    return { prompt: `${A}${B} is extended to ${D}. Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: ext, unit: "°", why: `The exterior angle equals the sum of the two interior opposite angles: ${p} = ${angles[0]} + ${angles[2]} = ${ext}.`, meta: { at: B, from: Cc, to: D, value: ext } };
  }
  cfg.angles.push(interior(letters, A, p), interior(letters, Cc, deg(angles[2])), { at: B, from: Cc, to: D, label: deg(ext) });
  return { prompt: `${A}${B} is extended to ${D}. Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: angles[0], unit: "°", why: `The exterior angle ${ext}° = ${p} + ${angles[2]}°, so ${p} = ${ext} − ${angles[2]} = ${angles[0]}.`, meta: { ...pick3(letters, 0), value: angles[0] } };
}, figureCheck);
function specialQuad(kind) {
  const letters = pick(QUAD_LETTERS);
  let raw, angles, marks = {};
  if (kind === "parallelogram" || kind === "rhombus") {
    const t = ri(10, 16) * 5; angles = [t, 180 - t, t, 180 - t];
    raw = polygonFromAngles(angles, kind === "rhombus" ? [10, 10] : [12, 7]);
    marks = kind === "rhombus" ? { ticks: [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => ({ from: letters[i], to: letters[j] })), parallel: [] } : { parallel: [{ from: letters[0], to: letters[1] }, { from: letters[3], to: letters[2] }, { from: letters[0], to: letters[3], count: 2 }, { from: letters[1], to: letters[2], count: 2 }] };
  } else if (kind === "kite") {
    const a = ri(14, 22) * 5, g = ri(8, 14) * 5; // top and bottom angles
    const s1 = 6, w = s1 * Math.sin(a / 2 * Math.PI / 180), h1 = s1 * Math.cos(a / 2 * Math.PI / 180), h2 = w / Math.tan(g / 2 * Math.PI / 180);
    raw = [[0, 0], [w, -h1], [0, -h1 - h2], [-w, -h1]];
    const b = (360 - a - g) / 2; angles = [a, b, g, b];
    marks = { ticks: [{ from: letters[0], to: letters[1] }, { from: letters[3], to: letters[0] }, { from: letters[1], to: letters[2], count: 2 }, { from: letters[2], to: letters[3], count: 2 }] };
  } else {
    const t = ri(11, 15) * 5, h = 5, bw = 14, tw = bw - 2 * h / Math.tan(t * Math.PI / 180);
    raw = [[0, 0], [bw, 0], [bw - (bw - tw) / 2, h], [(bw - tw) / 2, h]]; angles = [t, t, 180 - t, 180 - t];
    marks = { parallel: [{ from: letters[0], to: letters[1] }, { from: letters[3], to: letters[2] }], ticks: [{ from: letters[0], to: letters[3] }, { from: letters[1], to: letters[2] }] };
  }
  const pts = fitPoints(nameVertices(raw, letters), { size: 280, maxH: 220, rotateBy: pick([0, 0, 180]) });
  return { letters, angles, cfg: Object.assign({ points: pts, polygons: [{ pts: letters }], angles: [] }, marks) };
}
add("expected", "e-special-quad", "Angles in special quadrilaterals", () => {
  const kind = pick(["parallelogram", "rhombus", "kite", "isosceles trapezium"]);
  const { letters, angles, cfg } = specialQuad(kind === "isosceles trapezium" ? "trap" : kind);
  const p = pick(PRO);
  let gi, ui, why;
  if (kind === "kite") { gi = 1; ui = 3; why = `In a kite the angles between the unequal sides are equal, so ${p} = ${angles[1]}.`; if (Math.random() < 0.5) { gi = 0; ui = 1; cfg.angles.push(interior(letters, letters[2], deg(angles[2]))); why = `The angles at ${letters[1]} and ${letters[3]} are equal, so ${p} = (360 − ${angles[0]} − ${angles[2]}) ÷ 2 = ${angles[1]}.`; } }
  else if (kind === "isosceles trapezium") { gi = 0; ui = pick([1, 3]); why = ui === 1 ? `The base angles of an isosceles trapezium are equal: ${p} = ${angles[0]}.` : `Co-interior angles between the parallel sides add to 180°: ${p} = 180 − ${angles[0]} = ${angles[3]}.`; }
  else { gi = 0; ui = pick([1, 2]); why = ui === 2 ? `Opposite angles of a ${kind} are equal: ${p} = ${angles[0]}.` : `Co-interior angles add to 180°: ${p} = 180 − ${angles[0]} = ${angles[1]}.`; }
  cfg.angles.push(interior(letters, letters[gi], deg(angles[gi])), interior(letters, letters[ui], p));
  return { prompt: `${letters.join("")} is a${kind === "isosceles trapezium" ? "n" : ""} <b>${kind}</b>. Find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: angles[ui], unit: "°", why, meta: { at: letters[ui], from: letters[(ui + 3) % 4], to: letters[(ui + 1) % 4], value: angles[ui] } };
}, figureCheck);
add("expected", "e-algebraic", "Angles with algebraic expressions", () => {
  const letters = pick(TRIANGLE_LETTERS), p = pick(["x", "a", "y", "m"]);
  for (;;) {
    const k = pick([0, 1]);
    let exprs, angles, x;
    if (k === 0) { const c = shuffle([1, 2, 3, 4]).slice(0, 3); const s = c.reduce((u, v) => u + v); if (180 % s) continue; x = 180 / s; angles = c.map(v => v * x); exprs = c.map(v => (v === 1 ? "" : v) + p + "°"); }
    else { x = ri(4, 12) * 5; const a = ri(1, 3), b = ri(-20, 30); const t = a * x + b; const rest = 180 - t; if (rest < 40) continue; const o = ri(25, rest - 25); angles = [t, o, 180 - t - o]; if (angles[2] < 20) continue; exprs = [`(${a === 1 ? "" : a}${p} ${b < 0 ? "−" : "+"} ${Math.abs(b)})°`, deg(o), deg(angles[2])]; if (b === 0) continue; }
    // No sliver triangles: below about 35° two corner labels end up on top of each other.
    if (angles.some(v => v < 35 || v > 140)) continue;
    const order = shuffle([0, 1, 2]); const A2 = order.map(i => angles[i]), E2 = order.map(i => exprs[i]);
    const co = k === 0 ? angles.reduce((u, v) => u + v) / x : (exprs[0].match(/^\((\d*)/)[1] || 1) * 1;
    const step = k === 0 ? `${co}${p} = 180, so ${p} = ${x}` : `${co === 1 ? "" : co}${p} + ${180 - co * x} = 180, so ${co === 1 ? "" : co}${p} = ${co * x}${co === 1 ? "" : `, so ${p} = ${x}`}`;
    const cfg = { points: tri(A2, letters), polygons: [{ pts: letters }], angles: letters.map((v, i) => interior(letters, v, E2[i])) };
    return { prompt: `Form an equation and solve it to find the value of <i>${p}</i>.`, diagram: G(cfg), mode: "num", value: x, why: `The angles add to 180°: ${E2.join(" + ").replace(/°/g, "")} = 180. Collect like terms: ${step}.` };
  }
}, figureCheck);
add("expected", "e-hierarchy", "Classifying quadrilaterals: true or false", () => {
  const items = [
    ["Every square is a rectangle.", true, "A square has four right angles and opposite sides equal, so it is a special rectangle."],
    ["Every square is a rhombus.", true, "A square has four equal sides, so it is a special rhombus."],
    ["Every rectangle is a parallelogram.", true, "A rectangle has both pairs of opposite sides parallel."],
    ["Every rhombus is a parallelogram.", true, "A rhombus has both pairs of opposite sides parallel."],
    ["Every rhombus is a kite.", true, "A rhombus has two pairs of equal adjacent sides (in fact all four are equal)."],
    ["Every rectangle is a square.", false, "A rectangle's sides do not have to be all equal."],
    ["Every rhombus is a square.", false, "A rhombus does not have to have right angles."],
    ["Every parallelogram is a rectangle.", false, "A parallelogram does not have to have right angles."],
    ["Every kite is a rhombus.", false, "A kite's two pairs of equal sides can be different lengths."],
    ["A triangle can have two obtuse angles.", false, "Two obtuse angles already add to more than 180°."],
    ["An equilateral triangle is also isosceles.", true, "It has (at least) two equal sides."],
    ["A right-angled triangle can also be isosceles.", true, "For example, a triangle with angles 90°, 45° and 45°."]
  ];
  const [s, t, why] = pick(items);
  return { prompt: `True or false?<span class="say">${s}</span>`, mode: "tf", truth: t, why, key: s };
});
add("expected", "e-both", "Classify triangles by sides and angles", () => {
  const combos = [["Right-angled", "Isosceles", [90, 45, 45]], ["Right-angled", "Scalene", null], ["Obtuse-angled", "Isosceles", null], ["Obtuse-angled", "Scalene", null], ["Acute-angled", "Isosceles", null], ["Acute-angled", "Equilateral", [60, 60, 60]], ["Acute-angled", "Scalene", null]];
  const [ak, sk, fixed] = pick(combos);
  let angles = fixed;
  if (!angles) {
    if (ak === "Right-angled") { const a = pick([30, 35, 40, 50, 55, 60]); angles = [90, a, 90 - a]; }
    else if (ak === "Obtuse-angled") { if (sk === "Isosceles") { const b = pick([20, 25, 30, 35]); angles = [180 - 2 * b, b, b]; } else { const o = ri(20, 26) * 5, a = ri(4, (180 - o) / 5 - 4) * 5; angles = [o, a, 180 - o - a]; if (a === 180 - o - a) angles = [o, a - 5, 180 - o - a + 5]; } }
    else if (sk === "Isosceles") { const b = pick([55, 65, 70, 75, 80]); angles = [180 - 2 * b, b, b]; }
    else { do { angles = triangleAngles(40, 85); } while (new Set(angles).size < 3 || angles.includes(60) || angles.includes(90)); }
  }
  const letters = pick(TRIANGLE_LETTERS); const ord = shuffle([0, 1, 2]); const A2 = ord.map(i => angles[i]);
  const cfg = { points: tri(A2, letters), polygons: [{ pts: letters }], angles: letters.map((v, i) => A2[i] === 90 ? interior(letters, v, false, { right: true }) : interior(letters, v, deg(A2[i]))) };
  const ans = `${ak} ${sk.toLowerCase()}`;
  const pool = ["Right-angled isosceles", "Right-angled scalene", "Obtuse-angled isosceles", "Obtuse-angled scalene", "Acute-angled isosceles", "Acute-angled scalene", "Acute-angled equilateral"].filter(o => o !== ans);
  const opts = shuffle([ans, ...shuffle(pool).slice(0, 3)]);
  return { prompt: `Classify ${M3(letters)} by both its angles and its sides.`, diagram: G(cfg), mode: "mc", options: opts, correct: opts.indexOf(ans), why: `${ak === "Right-angled" ? "It has a right angle" : ak === "Obtuse-angled" ? "It has an obtuse angle" : "All angles are acute"}, and ${sk === "Isosceles" ? "two angles are equal, so two sides are equal" : sk === "Equilateral" ? "all angles are 60°, so all sides are equal" : "the angles are all different, so the sides are all different"}.` };
}, figureCheck);
add("expected", "e-convex", "Convex and non-convex polygons", () => {
  const n = pick([5, 6]); const convex = Math.random() < 0.5;
  for (;;) {
    let angles;
    if (convex) { const s = (n - 2) * 180; angles = Array.from({ length: n }, () => ri(70, 165)); const tot = angles.reduce((a, b) => a + b); if (tot !== s) { const d = s - tot; angles[0] += d; if (angles[0] < 60 || angles[0] > 170) continue; } }
    else { const s = (n - 2) * 180; angles = Array.from({ length: n }, () => ri(50, 130)); angles[ri(0, n - 1)] = ri(200, 250); const tot = angles.reduce((a, b) => a + b); const i = angles.findIndex(v => v < 180); angles[i] += s - tot; if (angles[i] < 30 || angles[i] > 170) continue; }
    const sides = Array.from({ length: n - 2 }, () => ri(6, 11));
    const raw = polygonFromAngles(angles, sides); if (!raw) continue;
    // reject self-intersecting outlines
    const segs = raw.map((p, i) => [p, raw[(i + 1) % n]]);
    const cross = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
    let bad = false; for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (cross(...segs[i], ...segs[j])) bad = true; }
    if (bad) continue;
    const letters = ["A", "B", "C", "D", "E", "F"].slice(0, n);
    const pts = fitPoints(nameVertices(raw, letters), { size: 260, maxH: 210 });
    const opts = ["Convex", "Non-convex"];
    return { prompt: `Is this polygon convex or non-convex?`, diagram: G({ points: pts, polygons: [{ pts: letters }], vertexLabels: false }), mode: "mc", options: opts, correct: convex ? 0 : 1, keepOrder: true, why: convex ? "Every interior angle is less than 180°, so it is convex." : "One interior angle is a reflex angle (more than 180°) — it points inwards — so it is non-convex.", key: JSON.stringify(pts) };
  }
});
add("expected", "e-unknown-side", "Unknown sides using properties", () => {
  const kind = pick(["rhombus", "parallelogram", "kite", "isosceles triangle"]);
  const u = pick(["cm", "m"]); const x = ri(2, 9), a = ri(2, 5), b = ri(1, 9), side = a * x + b;
  const c2 = a + ri(1, 3), d2 = side - c2 * x;
  if (d2 === 0) return T.find(t => t.id === "e-unknown-side").gen();
  const e1 = `${a}x + ${b}`, e2 = d2 > 0 ? `${c2}x + ${d2}` : `${c2}x − ${-d2}`;
  const what = { rhombus: "two sides of a rhombus", parallelogram: "two opposite sides of a parallelogram", kite: "two equal adjacent sides of a kite", "isosceles triangle": "the two equal sides of an isosceles triangle" }[kind];
  return { prompt: `The lengths of ${what} are <span class="m">(${e1.replace("x", "<i>x</i>")}) ${u}</span> and <span class="m">(${e2.replace("x", "<i>x</i>")}) ${u}</span>. Find the value of <i>x</i>.`, mode: "num", value: x, why: `The sides are equal: ${e1} = ${e2}, so ${c2 - a === 1 ? "" : c2 - a}x = ${d2 > 0 ? `${b} − ${d2}` : `${b} + ${-d2}`}${c2 - a === 1 ? "" : ` = ${b - d2}, so x = ${x}`}. (Each side is ${side} ${u}.)` };
}, q => { const m = q.prompt.match(/\((\d+)<i>x<\/i> \+ (\d+)\).*?\((\d+)<i>x<\/i> ([+−]) (\d+)\)/); if (!m) return "parse"; const [a, b, c, s, d] = [+m[1], +m[2], +m[3], m[4], +m[5]]; const dd = s === "+" ? d : -d; return a * q.value + b === c * q.value + dd ? null : "sides not equal"; });

MMTQ.run({
  id: "geometrical-figures", title: "Properties of Geometrical Figures", outcome: "MA4-GEO-C-01",
  toolId: "geometrical-figures-quiz", tool: "geometrical-figures-student-quiz", mastery: "properties-of-geometrical-figures",
  levels: {
    basic: { sub: "Classify triangles and quadrilaterals, the angle sum of a triangle and a quadrilateral, properties of special quadrilaterals." },
    expected: { sub: "Isosceles triangles, exterior angles, angles in special quadrilaterals, angles as expressions, classifying by sides and angles, convex polygons." }
  },
  related: [
    { href: "/online-quizzes/stage-4/measurement-space/angle-relationships.html", label: "Angle Relationships", small: "Whole-topic quiz" }
  ],
  types: T
});
