/**
 * Playground question bank — pythagoras.
 * Ported from the website's `online-quizzes/stage-4/topic-quiz/banks/pythagoras.js`.
 * Generators + question shapes UNCHANGED — if you fix a question here, port it
 * to the website bank too (and vice versa).
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";

/* Right-Angled Triangles (Pythagoras' Theorem) — MA4-PYT-C-01 — whole-topic quiz bank.
   Content statements: identify and define Pythagoras' theorem · examine
   problems involving Pythagoras' theorem.
   Triangles are drawn by the geometry engine to the true proportions of their
   sides and turned to a random angle, so the hypotenuse is not always the
   sloping side at the top — students find it as the side opposite the right
   angle. */
const { ri, pick, shuffle, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = s => `<span class="m">${s}</span>`;
const UNITS = ["cm", "m", "mm"];
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
const triple = (maxC = 60) => { for (;;) { const [a, b, c] = pick(TRIPLES), k = ri(1, 6); if (c * k <= maxC) return shuffle([a * k, b * k]).concat(c * k); } };
const sq = v => `${fmt(v)}<sup>2</sup>`;

/* A right triangle with legs a, b drawn to scale, turned by a random angle.
   Vertex R is the right angle. labels: { a, b, c } text for leg a (R→P),
   leg b (R→Q) and the hypotenuse (P→Q); letters: vertex names. */
function rightTri(a, b, labels, { letters = null, turn = null } = {}) {
  const th = (turn == null ? pick([0, 0, 15, 90, 160, 200, 250, 290, 330]) : turn) * Math.PI / 180;
  const raw = { R: [0, 0], P: [a, 0], Q: [0, b] };
  const rot = p => [p[0] * Math.cos(th) - p[1] * Math.sin(th), p[0] * Math.sin(th) + p[1] * Math.cos(th)];
  const r = Object.fromEntries(Object.entries(raw).map(([k, p]) => [k, rot(p)]));
  const xs = Object.values(r).map(p => p[0]), ys = Object.values(r).map(p => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const k = Math.min(300 / w, 210 / h);
  const pts = {};
  Object.entries(r).forEach(([n, p]) => pts[n] = [Math.round((p[0] - Math.min(...xs)) * k), Math.round((Math.max(...ys) - p[1]) * k)]);
  const name = letters ? { R: letters[0], P: letters[1], Q: letters[2] } : { R: "R", P: "P", Q: "Q" };
  const points = {}; Object.entries(pts).forEach(([n, p]) => points[name[n]] = p);
  const sl = [];
  const side = (f, t, text) => { if (text) sl.push({ from: name[f], to: name[t], text, offset: C.labelOffset(pts[f], pts[t], text) }); };
  side("R", "P", labels.a); side("R", "Q", labels.b); side("P", "Q", labels.c);
  return { engine: "geometry-engine", scale: 1.05, config: { points, polygons: [{ pts: [name.R, name.P, name.Q] }], angles: [{ at: name.R, from: name.P, to: name.Q, right: true }], sideLabels: sl, vertexLabels: !!letters } };
}

/* ================================ BASIC ================================ */
add("basic", "b-hypotenuse", "Identify the hypotenuse", () => {
  const L = shuffle(["A", "B", "C", "D", "E", "F", "K", "L", "M", "P", "Q", "R"]).slice(0, 3);
  const [a, b] = shuffle([ri(3, 8), ri(3, 8)]);
  const d = rightTri(a, b, {}, { letters: L });
  const sides = [L[0] + L[1], L[0] + L[2], L[1] + L[2]];
  const opts = shuffle(sides);
  return { prompt: `Which side is the <b>hypotenuse</b> of this right-angled triangle?`, diagram: d, mode: "mc", options: opts, correct: opts.indexOf(L[1] + L[2]), why: `The hypotenuse is the longest side, opposite the right angle at ${L[0]}: ${L[1] + L[2]}.` };
});
add("basic", "b-statement", "Write Pythagoras' theorem for a triangle", () => {
  const [p, q, r] = shuffle(["a", "b", "c", "p", "q", "r", "m", "n", "k"]).slice(0, 3);
  const [a, b] = [ri(3, 8), ri(3, 8)];
  const d = rightTri(a, b, { a: p, b: q, c: r });
  const opts = shuffle([
    `${r}² = ${p}² + ${q}²`, `${p}² = ${q}² + ${r}²`, `${q}² = ${p}² + ${r}²`, `${r} = ${p} + ${q}`
  ]);
  return { prompt: `Which equation is true for this right-angled triangle?`, diagram: d, mode: "mc", options: opts.map(o => M(o)), correct: opts.indexOf(`${r}² = ${p}² + ${q}²`), why: `The square on the hypotenuse (${r}, opposite the right angle) equals the sum of the squares on the other two sides.` };
});
add("basic", "b-squares", "Squares and square roots", () => {
  const k = pick([0, 1, 2]);
  const [a, b, c] = triple(30);
  if (k === 0) return { prompt: `Evaluate ${M(`${sq(a)} + ${sq(b)}`)}.`, mode: "num", value: a * a + b * b, why: `${a * a} + ${b * b} = ${a * a + b * b}` };
  if (k === 1) return { prompt: `Evaluate ${M(`${sq(c)} − ${sq(a)}`)}.`, mode: "num", value: c * c - a * a, why: `${c * c} − ${a * a} = ${c * c - a * a}` };
  return { prompt: `Evaluate ${M(`√(${sq(a)} + ${sq(b)})`)}.`, mode: "num", value: c, why: `${a * a} + ${b * b} = ${c * c}, and √${c * c} = ${c}.` };
});
add("basic", "b-hyp-whole", "Find the hypotenuse", () => {
  const [a, b, c] = triple(60), u = pick(UNITS);
  return { prompt: `Find the length of the hypotenuse, <i>h</i>.`, diagram: rightTri(a, b, { a: `${a} ${u}`, b: `${b} ${u}`, c: "h" }), mode: "num", value: c, unit: u, why: `h² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so h = √${c * c} = ${c} ${u}.` };
}, q => null);
add("basic", "b-is-right", "Is the triangle right-angled?", () => {
  const [a, b, c] = triple(50);
  const yes = Math.random() < 0.5;
  const cc = yes ? c : c + pick([-1, 1, 2]);
  const s = shuffle([a, b, cc]);
  return { prompt: `A triangle has sides of ${s[0]} cm, ${s[1]} cm and ${s[2]} cm. True or false: it is a right-angled triangle.`, mode: "tf", truth: yes,
    why: `${a}² + ${b}² = ${a * a + b * b}, and ${cc}² = ${cc * cc}. ${yes ? "They are equal, so it is right-angled." : "They are not equal, so it is not right-angled."}` };
}, q => { const n = q.prompt.match(/(\d+) cm/g).map(s => parseInt(s)).sort((x, y) => x - y); return (n[0] ** 2 + n[1] ** 2 === n[2] ** 2) === q.truth ? null : "converse wrong"; });

/* =============================== EXPECTED ============================== */
add("expected", "e-hyp-dp", "Find the hypotenuse (1 decimal place)", () => {
  let a, b; do { a = ri(3, 20) + pick([0, 0, 0.5]); b = ri(3, 20); } while (Number.isInteger(Math.hypot(a, b)));
  const u = pick(UNITS), c = Math.hypot(a, b);
  return { prompt: `Find the value of <i>x</i>, correct to 1 decimal place.`, diagram: rightTri(a, b, { a: `${fmt(a)} ${u}`, b: `${fmt(b)} ${u}`, c: "x" }), mode: "num", value: c, dp: 1, unit: u, why: `x² = ${fmt(a)}² + ${fmt(b)}² = ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(a * a + b * b)}, so x = √${fmt(a * a + b * b)} ≈ ${round(c, 1).toFixed(1)} ${u}.` };
}, q => null);
add("expected", "e-shorter", "Find a shorter side", () => {
  const u = pick(UNITS);
  if (Math.random() < 0.5) {
    const [a, b, c] = triple(60);
    return { prompt: `Find the value of <i>x</i>.`, diagram: rightTri(a, b, { a: "x", b: `${b} ${u}`, c: `${c} ${u}` }), mode: "num", value: a, unit: u, why: `x² = ${c}² − ${b}² = ${c * c} − ${b * b} = ${a * a}, so x = ${a} ${u}.` };
  }
  let b, c; do { b = ri(4, 20); c = b + ri(2, 12); } while (Number.isInteger(Math.sqrt(c * c - b * b)));
  const a = Math.sqrt(c * c - b * b);
  return { prompt: `Find the value of <i>x</i>, correct to 1 decimal place.`, diagram: rightTri(a, b, { a: "x", b: `${b} ${u}`, c: `${c} ${u}` }), mode: "num", value: a, dp: 1, unit: u, why: `x² = ${c}² − ${b}² = ${c * c} − ${b * b} = ${c * c - b * b}, so x = √${c * c - b * b} ≈ ${round(a, 1).toFixed(1)} ${u}.` };
});
add("expected", "e-triad", "Pythagorean triads", () => {
  const [a, b, c] = triple(45).sort((x, y) => x - y);
  const wrong = new Set();
  while (wrong.size < 3) {
    const t = triple(45).sort((x, y) => x - y);
    const i = ri(0, 2), d = pick([-1, 1, 2]);
    const w = t.slice(); w[i] += d; w.sort((x, y) => x - y);
    if (w[0] > 0 && w[0] ** 2 + w[1] ** 2 !== w[2] ** 2) wrong.add(w.join(", "));
  }
  const good = [a, b, c].join(", ");
  const opts = shuffle([good, ...[...wrong].filter(w => w !== good).slice(0, 3)]);
  return { prompt: `Which set of numbers is a <b>Pythagorean triad</b>?`, mode: "mc", options: opts.map(o => `{${o}}`), correct: opts.indexOf(good), why: `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} = ${c}².` };
}, q => { const nums = q.options.map(o => o.replace(/[{}]/g, "").split(", ").map(Number)); const ok = nums.map(n => n[0] ** 2 + n[1] ** 2 === n[2] ** 2); return ok.filter(Boolean).length === 1 && ok[q.correct] ? null : "triad options"; });
add("expected", "e-units", "Pythagoras with mixed units", () => {
  const [a, b, c] = triple(60);
  const cmFirst = Math.random() < 0.5;
  // one leg in cm, the other in m; answer in cm
  const A = `${a * 10} cm`, B = `${fmt(b / 10)} m`;
  return { prompt: `A right-angled triangle has shorter sides of ${A} and ${B}. Find the length of the hypotenuse in <b>${cmFirst ? "centimetres" : "metres"}</b>.`, mode: "num", value: cmFirst ? c * 10 : c / 10, unit: cmFirst ? "cm" : "m",
    why: `Use the same unit: ${B} = ${b * 10} cm. h² = ${a * 10}² + ${b * 10}² = ${(c * 10) ** 2}, so h = ${c * 10} cm${cmFirst ? "" : ` = ${fmt(c / 10)} m`}.` };
});
add("expected", "e-isosceles", "Height of an isosceles triangle", () => {
  const u = pick(UNITS);
  if (Math.random() < 0.5) {
    const [a, b, c] = triple(50);
    return { prompt: `Find the perpendicular height, <i>h</i>, of this isosceles triangle.`, diagram: { engine: "pythagoras-engine", config: { diagramType: "isosceles", baseLabel: `${2 * a} ${u}`, slantLabel: `${c} ${u}`, heightLabel: "h" }, scale: 1.6, maxH: 320 }, mode: "num", value: b, unit: u, why: `The height cuts the base in half: ${a} ${u}. h² = ${c}² − ${a}² = ${c * c - a * a}, so h = ${b} ${u}.` };
  }
  let half, s; do { half = ri(3, 12); s = half + ri(2, 10); } while (Number.isInteger(Math.sqrt(s * s - half * half)));
  const h = Math.sqrt(s * s - half * half);
  return { prompt: `Find the perpendicular height, <i>h</i>, of this isosceles triangle, correct to 1 decimal place.`, diagram: { engine: "pythagoras-engine", config: { diagramType: "isosceles", baseLabel: `${2 * half} ${u}`, slantLabel: `${s} ${u}`, heightLabel: "h" }, scale: 1.6, maxH: 320 }, mode: "num", value: h, dp: 1, unit: u, why: `Half the base is ${half} ${u}. h² = ${s}² − ${half}² = ${s * s - half * half}, so h ≈ ${round(h, 1).toFixed(1)} ${u}.` };
});
add("expected", "e-problems", "Pythagoras in context", () => {
  const k = pick([0, 1, 2, 3]);
  if (k === 0) {
    const L = ri(4, 9) + pick([0, 0.5]), foot = round(L * pick([0.25, 0.3, 0.35]), 1), h = Math.sqrt(L * L - foot * foot);
    return { prompt: `A ${fmt(L)} m ladder leans against a wall. Its foot is ${fmt(foot)} m from the wall. How high up the wall does it reach, correct to 1 decimal place?`, diagram: { engine: "pythagoras-engine", config: { diagramType: "ladder-wall", heightLabel: "h", baseLabel: `${fmt(foot)} m`, ladderLabel: `${fmt(L)} m`, footRatio: foot / h }, scale: 1.5, maxH: 320 }, mode: "num", value: h, dp: 1, unit: "m", why: `h² = ${fmt(L)}² − ${fmt(foot)}² = ${fmt(L * L - foot * foot, 3)}, so h ≈ ${round(h, 1).toFixed(1)} m.` };
  }
  if (k === 1) {
    const w = ri(3, 6), h = ri(1, w - 1), d = Math.hypot(w, h); // a real gate: a few metres wide, lower than it is wide
    return { prompt: `A rectangular gate is ${w} m wide and ${h} m high. A diagonal brace runs from one corner to the opposite corner. How long is the brace, correct to 1 decimal place?`, diagram: { engine: "pythagoras-engine", config: { diagramType: "rectangle-diagonal", widthLabel: `${w} m`, heightLabel: `${h} m`, diagonalLabel: "x" }, scale: 1.4, maxH: 320 }, mode: "num", value: d, dp: 1, unit: "m", why: `x² = ${w}² + ${h}² = ${w * w + h * h}, so x ≈ ${round(d, 1).toFixed(1)} m.` };
  }
  if (k === 2) {
    const n = ri(2, 12), e = ri(2, 12), d = Math.hypot(n, e);
    return { prompt: `Ava walks ${n} km north, then ${e} km east. How far is she from where she started, in a straight line? Give your answer to 1 decimal place.`, mode: "num", value: d, dp: 1, unit: "km", why: `North and east are at right angles: d² = ${n}² + ${e}² = ${n * n + e * e}, so d ≈ ${round(d, 1).toFixed(1)} km.` };
  }
  const s = ri(10, 60), d = Math.SQRT2 * s;
  return { prompt: `A square field has sides of ${s} m. How long is its diagonal, correct to 1 decimal place?`, mode: "num", value: d, dp: 1, unit: "m", why: `d² = ${s}² + ${s}² = ${2 * s * s}, so d ≈ ${round(d, 1).toFixed(1)} m.` };
});
defineBank({
  id: "pythagoras", title: "Right-Angled Triangles (Pythagoras)", outcome: "MA4-PYT-C-01",
  toolId: "pythagoras-quiz", tool: "pythagoras-student-quiz", mastery: "pythagoras",
  levels: {
    basic: { sub: "Find the hypotenuse, write Pythagoras' theorem for a triangle, squares and square roots, test for a right angle." },
    expected: { sub: "Hypotenuse and shorter sides to 1 decimal place, Pythagorean triads, mixed units and real-life problems." }
  },
  related: [],
  types: T
}, T);
export default T;
