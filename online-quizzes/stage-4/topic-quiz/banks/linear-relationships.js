/* Linear Relationships — MA4-LIN-C-01 — whole-topic quiz bank.
   Content statements: plot and identify points on the Cartesian plane ·
   plot linear relationships on the Cartesian plane · solve linear equations
   using graphical techniques.
   Graphs are MMTQ.grid (the engine's own plane), so a student can CLICK to
   plot a point and every point and line sits on the lattice. */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, MINUS } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = s => `<span class="m">${s}</span>`;
const n = v => fmt(v);
const pt = (x, y) => `(${n(x)}, ${n(y)})`;
/* y = mx + b written the way a textbook writes it */
function rule(m, b, y = "y", x = "x") {
  const mx = m === 0 ? "" : m === 1 ? x : m === -1 ? `${MINUS}${x}` : `${n(m)}${x}`;
  if (!mx) return `${y} = ${n(b)}`;
  const c = b === 0 ? "" : b > 0 ? ` + ${b}` : ` ${MINUS} ${-b}`;
  return `${y} = ${mx}${c}`;
}
const R = (m, b, y, x) => M(rule(m, b, y, x).replace(/([a-zA-Z])/g, "<i>$1</i>"));
function table(xs, ys, blank = -1, xl = "x", yl = "y") {
  return `<table class="dtab"><tr><th><i>${xl}</i></th>${xs.map(v => `<td>${n(v)}</td>`).join("")}</tr><tr><th><i>${yl}</i></th>${ys.map((v, i) => `<td${i === blank ? ' class="q"' : ""}>${i === blank ? "?" : n(v)}</td>`).join("")}</tr></table>`;
}
const G = 6;
/* "3 × (−1) + 2" — the substitution written out, negatives bracketed */
const br = v => v < 0 ? `(${n(v)})` : n(v);
const subst = (m, x, b) => `${m === 1 ? br(x) : m === -1 ? (x === 0 ? "0" : `${MINUS}${br(x)}`) : `${n(m)} × ${br(x)}`}${b === 0 ? "" : b < 0 ? ` ${MINUS} ${-b}` : ` + ${b}`}`;
const mOK = () => pick([-3, -2, -1, 1, 2, 3, 4]);
const QUAD = ["first quadrant", "second quadrant", "third quadrant", "fourth quadrant"];
const quadOf = (x, y) => x > 0 && y > 0 ? 0 : x < 0 && y > 0 ? 1 : x < 0 && y < 0 ? 2 : 3;
const nz = () => pick([-1, 1]) * ri(1, G - 1);
/* a line with two lattice points inside the grid (for drawing and reading) */
function lineOnGrid(mList = [-3, -2, -1, 1, 2, 3], bRange = [-4, 4]) {
  for (;;) {
    const m = pick(mList), b = ri(bRange[0], bRange[1]);
    const xs = []; for (let x = -G; x <= G; x++) { const y = m * x + b; if (Math.abs(y) <= G - 1) xs.push(x); }
    if (xs.length >= 3) return { m, b, xs };
  }
}

/* ================================ BASIC ================================ */
add("basic", "b-read-point", "Read the coordinates of a point", () => {
  const used = new Set(); const pts = [];
  const names = shuffle(["A", "B", "C", "D", "P", "Q"]).slice(0, 3);
  names.forEach((lab, i) => {
    let x, y; do { x = ri(-G + 1, G - 1); y = ri(-G + 1, G - 1); if (i === 0 && Math.random() < 0.2) (Math.random() < 0.5 ? x = 0 : y = 0); } while (used.has(x + "," + y) || (x === 0 && y === 0));
    used.add(x + "," + y); pts.push({ x, y, label: lab });
  });
  const t = pick(pts);
  return { prompt: `Write the coordinates of point <b>${t.label}</b>.`, diagram: { grid: { xMin: -G, xMax: G, yMin: -G, yMax: G, points: pts } }, mode: "coord", x: t.x, y: t.y, answerHTML: M(pt(t.x, t.y)), why: `Across first (${n(t.x)} on the x-axis), then up or down (${n(t.y)} on the y-axis): ${pt(t.x, t.y)}.` };
});
add("basic", "b-plot-point", "Plot a point", () => {
  let x, y; do { x = ri(-G + 1, G - 1); y = ri(-G + 1, G - 1); } while (x === 0 && y === 0 || (x === y));
  return { prompt: `Click the grid to plot the point ${M(pt(x, y))}.`, mode: "plot", grid: { xMin: -G, xMax: G, yMin: -G, yMax: G }, x, y, why: `Start at the origin. Move ${Math.abs(x)} ${x < 0 ? "left" : "right"}, then ${Math.abs(y)} ${y < 0 ? "down" : "up"}.` };
});
add("basic", "b-quadrant", "Name the quadrant", () => {
  let x, y; do { x = nz(); y = nz(); } while (false);
  return { prompt: `In which quadrant does the point ${M(pt(x, y))} lie?`, mode: "mc", options: QUAD.slice(), correct: quadOf(x, y), keepOrder: true,
    why: `x is ${x > 0 ? "positive (right)" : "negative (left)"} and y is ${y > 0 ? "positive (up)" : "negative (down)"}, so it is in the ${QUAD[quadOf(x, y)]}. The quadrants are numbered anticlockwise from the top right.` };
});
add("basic", "b-table", "Complete a table of values", () => {
  const m = pick([1, 2, 3, -1, -2]), b = ri(-3, 5), xs = [-1, 0, 1, 2, 3], ys = xs.map(x => m * x + b), i = ri(0, 4);
  return { prompt: `Complete the table of values for ${R(m, b)}.${table(xs, ys, i)}What number goes in the shaded box?`, mode: "num", value: ys[i], why: `Substitute x = ${n(xs[i])}: y = ${subst(m, xs[i], b)} = ${n(ys[i])}.` };
}, q => null);
add("basic", "b-rule-match", "Match a rule to a table", () => {
  for (;;) {
    const m = pick([1, 2, 3, 4, -1, -2]), b = ri(-3, 6);
    const xs = [0, 1, 2, 3, 4], ys = xs.map(x => m * x + b);
    const cands = [[m, b], [b, m], [m, 0], [m + 1, b - 1], [1, b], [m, b + m], [-m, b]].filter(([p, q]) => p !== 0);
    const uniq = []; cands.forEach(c => { if (!uniq.some(u => xs.every(x => u[0] * x + u[1] === c[0] * x + c[1]))) uniq.push(c); });
    if (uniq.length < 4) continue;
    const opts = [uniq[0], ...shuffle(uniq.slice(1)).slice(0, 3)];
    const sh = shuffle(opts.map((o, k) => ({ o, k })));
    return { prompt: `Which rule matches this table of values?${table(xs, ys)}`, mode: "mc", options: sh.map(s => R(s.o[0], s.o[1])), correct: sh.findIndex(s => s.k === 0), why: `When x = 0, y = ${n(b)}, and each time x goes up by 1, y ${m > 0 ? "goes up" : "goes down"} by ${Math.abs(m)}: ${rule(m, b)}.` };
  }
});
add("basic", "b-on-line", "Does a point lie on a line?", () => {
  const m = pick([1, 2, 3, -1, -2]), b = ri(-4, 6), x = ri(-3, 4);
  const onIt = Math.random() < 0.5; const y = m * x + b + (onIt ? 0 : pick([-2, -1, 1, 2]));
  return { prompt: `True or false? The point ${M(pt(x, y))} lies on the line ${R(m, b)}.`, mode: "tf", truth: onIt, why: `Substitute x = ${n(x)}: y = ${subst(m, x, b)} = ${n(m * x + b)}. ${onIt ? "That matches" : `That is not ${n(y)}`}, so it is ${onIt ? "on" : "not on"} the line.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-plot-on-line", "Plot a point on a line", () => {
  const L = lineOnGrid([-3, -2, -1, 1, 2, 3], [-4, 4]);
  const x = pick(L.xs.filter(v => v !== 0) .length ? L.xs.filter(v => v !== 0) : L.xs), y = L.m * x + L.b;
  return { prompt: `Click the grid to plot the point on the line ${R(L.m, L.b)} where ${M("<i>x</i> = " + n(x))}.`, mode: "plot", grid: { xMin: -G, xMax: G, yMin: -G, yMax: G }, x, y, why: `y = ${subst(L.m, x, L.b)} = ${n(y)}, so the point is ${pt(x, y)}.` };
});
add("expected", "e-rule-from-table", "Write the rule from a table", () => {
  const m = pick([-3, -2, -1, 2, 3, 4, 5]), b = ri(-6, 8), xs = Math.random() < 0.5 ? [0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2];
  return { prompt: `Write the rule linking <i>x</i> and <i>y</i> in this table.${table(xs, xs.map(x => m * x + b))}`, mode: "linear", m, b, answerHTML: R(m, b), why: `y changes by ${n(m)} each time x goes up by 1, and y = ${n(b)} when x = 0. So ${rule(m, b)}.` };
});
add("expected", "e-rule-from-graph", "Write the rule from a graph", () => {
  const L = lineOnGrid([-3, -2, -1, 1, 2, 3], [-4, 4]);
  const shown = shuffle(L.xs).slice(0, 2).map(x => ({ x, y: L.m * x + L.b }));
  return { prompt: `The line passes through the two marked points. Write its rule.`, diagram: { grid: { xMin: -G, xMax: G, yMin: -G, yMax: G, lines: [{ m: L.m, b: L.b }], points: shown } }, mode: "linear", m: L.m, b: L.b, answerHTML: R(L.m, L.b),
    why: `It crosses the y-axis at ${n(L.b)}, and y ${L.m > 0 ? "rises" : "falls"} ${Math.abs(L.m)} for every 1 across. So ${rule(L.m, L.b)}.` };
});
add("expected", "e-solve-graph", "Solve an equation using a graph", () => {
  const L = lineOnGrid([-2, -1, 1, 2, 3], [-3, 3]);
  const x = pick(L.xs.filter(v => L.m * v + L.b !== L.b) .length ? L.xs.filter(v => L.m * v + L.b !== L.b) : L.xs), c = L.m * x + L.b;
  const lhs = rule(L.m, L.b).replace(/^y = /, "");
  return { prompt: `The graph of ${R(L.m, L.b)} is drawn. Use it to solve ${M(lhs.replace(/x/g, "<i>x</i>") + " = " + n(c))}.`, diagram: { grid: { xMin: -G, xMax: G, yMin: -G, yMax: G, lines: [{ m: L.m, b: L.b, label: rule(L.m, L.b) }] } }, mode: "num", value: x, placeholder: "x = ", why: `Find ${n(c)} on the y-axis, go across to the line, then down/up to the x-axis: x = ${n(x)}.` };
});
add("expected", "e-intersect", "Point of intersection", () => {
  for (;;) {
    const x0 = ri(-3, 3), y0 = ri(-3, 3);
    const m1 = pick([1, 2, 3, -1]), m2 = pick([-1, -2, -3, 1, 2]); if (m1 === m2) continue;
    const b1 = y0 - m1 * x0, b2 = y0 - m2 * x0; if (Math.abs(b1) > 6 || Math.abs(b2) > 6) continue;
    return { prompt: `Two lines are graphed. What is their point of intersection?`, diagram: { grid: { xMin: -G, xMax: G, yMin: -G, yMax: G, lines: [{ m: m1, b: b1, label: rule(m1, b1), color: "#be123c" }, { m: m2, b: b2, label: rule(m2, b2), color: "#1d4ed8" }] } }, mode: "coord", x: x0, y: y0, answerHTML: M(pt(x0, y0)),
      why: `The lines cross at ${pt(x0, y0)}. Check: ${subst(m1, x0, b1)} = ${n(y0)} and ${subst(m2, x0, b2)} = ${n(y0)}.` };
  }
});
const CTX = [
  { s: (f, r) => `A taxi charges a $${f} flag fall plus $${r} per kilometre.`, dep: "C", ind: "k", rule: "Write a rule for the cost, <i>C</i> dollars, of a trip of <i>k</i> kilometres.", ask: v => `How much does a ${v} km trip cost?`, pre: "$", f: [3, 6], r: [2, 3] },
  { s: (f, r) => `A plumber charges a $${f} call-out fee plus $${r} per hour.`, dep: "C", ind: "h", rule: "Write a rule for the cost, <i>C</i> dollars, of a job that takes <i>h</i> hours.", ask: v => `How much does a ${v}-hour job cost?`, pre: "$", f: [40, 90], r: [50, 80] },
  { s: (f, r) => `A candle is ${f} cm tall and burns down ${r} cm every hour.`, dep: "H", ind: "t", rule: "Write a rule for the height, <i>H</i> cm, of the candle after <i>t</i> hours.", ask: v => `How tall is the candle after ${v} hours?`, unit: "cm", f: [20, 30], r: [1, 3], neg: true },
  { s: (f, r) => `A phone plan costs $${f} per month plus $${r} for each gigabyte (GB) of data used.`, dep: "C", ind: "g", rule: "Write a rule for the monthly cost, <i>C</i> dollars, when <i>g</i> GB are used.", ask: v => `What is the cost in a month when ${v} GB are used?`, pre: "$", f: [15, 35], r: [2, 5] }
];
add("expected", "e-real-life", "Linear relationships in context", () => {
  // Keep the start value, the rate and the input different numbers, so a student can tell them apart.
  let c, f, r; do { c = pick(CTX); f = ri(c.f[0], c.f[1]); r = ri(c.r[0], c.r[1]); } while (f === r);
  const m = c.neg ? -r : r;
  if (Math.random() < 0.5) return { prompt: `${c.s(f, r)} ${c.rule}`, mode: "linear", m, b: f, dep: c.dep, ind: c.ind, keys: ["=", "+", "−", c.ind], answerHTML: R(m, f, c.dep, c.ind), why: `It starts at ${f} and changes by ${n(m)} for each one: ${rule(m, f, c.dep, c.ind)}.` };
  let v, tries = 0; do { v = c.neg ? ri(2, Math.floor((f - 1) / r)) : ri(3, 12); } while ((v === f || v === r) && ++tries < 20);
  return { prompt: `${c.s(f, r)} ${c.ask(v)}`, mode: "num", value: m * v + f, pre: c.pre || "", unit: c.unit || "", why: `${rule(m, f, c.dep, c.ind)}, so ${c.dep} = ${subst(m, v, f)} = ${n(m * v + f)}.` };
});
add("expected", "e-pattern", "Linear patterns", () => {
  const m = ri(2, 5), b = ri(0, 4);
  const figs = [1, 2, 3].map(k => ({ n: k, count: m * k + b }));
  const diagram = { engine: "linear-engine", config: { diagramType: "tile-pattern", figures: figs, showCounts: true }, scale: 1.25 };
  if (Math.random() < 0.5) { const F = ri(8, 20); return { prompt: `The tile pattern continues in the same way. How many tiles are in Figure ${F}?`, diagram, mode: "num", value: m * F + b, unit: "tiles", why: b ? `Each figure adds ${m} tiles, and Figure 0 would have ${b}. Tiles = ${m} × ${F} + ${b} = ${m * F + b}.` : `Each figure adds ${m} tiles, and Figure 0 would have none. Tiles = ${m} × ${F} = ${m * F}.` }; }
  return { prompt: `The tile pattern continues in the same way. Write a rule for the number of tiles, <i>T</i>, in Figure <i>n</i>.`, diagram, mode: "linear", m, b, dep: "T", ind: "n", keys: ["=", "+", "n"], answerHTML: R(m, b, "T", "n"), why: `${m} more tiles each time, and ${m} × 1 + ${b} = ${m + b} for Figure 1: ${rule(m, b, "T", "n")}.` };
});

MMTQ.run({
  id: "linear-relationships", title: "Linear Relationships", outcome: "MA4-LIN-C-01",
  toolId: "linear-relationships-quiz", tool: "linear-relationships-student-quiz", mastery: "linear-relationships",
  levels: {
    basic: { sub: "Read and plot points in all four quadrants, tables of values, and checking a point against a rule." },
    expected: { sub: "Rules from tables, graphs and patterns, plotting points on a line, intersections, solving equations with a graph, real-life rules." }
  },
  related: [
    { href: "/interactive-tools/stage-4/algebra/counting-strategies-linear/", label: "Counting Strategies for Linear Relationships", small: "Teaching tool" },
    { href: "/interactive-tools/stage-4/algebra/visual-patterns/", label: "Visual Patterns", small: "Teaching tool" }
  ],
  types: T
});
