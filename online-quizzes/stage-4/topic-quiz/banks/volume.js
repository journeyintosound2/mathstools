/* Volume — MA4-VOL-C-01 — whole-topic quiz bank.
   Content statements: describe the views of prisms and solids formed from
   prisms · develop and apply V = Ah for prisms · the volume of a cylinder ·
   choose units of volume and capacity and convert between them. */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = s => `<span class="m">${s}</span>`;
const UNITS = ["cm", "m"];
const cu = u => `${u}³`;
const PI_ALTS = (f, dp) => [round(f(3.14), dp), round(f(22 / 7), dp)];
const V = (config, scale = 1.0, maxH = 330) => ({ engine: "volume-engine", config, scale, maxH });
const S = (config, scale = 1.0, maxH = 340) => ({ engine: "solids-engine", config, scale, maxH });

/* ---------- views of a stack of cubes (from the Stage 3 bank's rules) ---------- */
function viewsOf(heights) {
  const rows = heights.length, cols = Math.max(...heights.map(r => r.length));
  const front = [], side = [], top = [];
  for (let c = 0; c < cols; c++) { const h = Math.max(...heights.map(r => r[c] || 0)); for (let z = 0; z < h; z++) front.push([c, z]); }
  for (let r = 0; r < rows; r++) { const h = Math.max(...heights[r]); for (let z = 0; z < h; z++) side.push([r, z]); }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((heights[r][c] || 0) > 0) top.push([c, r]);
  return { front, side, top };
}
const ck = cells => cells.map(c => c.join(",")).sort().join(";");
function randomStack() {
  for (;;) {
    const rows = pick([2, 2, 3]), cols = pick([2, 3, 3]);
    const heights = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, () => (r === 0 ? ri(1, 3) : ri(0, 3))));
    const v = viewsOf(heights);
    if (new Set([ck(v.front), ck(v.side), ck(v.top)]).size < 3) continue;
    let ok = true;
    for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) { if (heights[r][c] > 0 && heights[r][c] < heights[r - 1][c]) ok = false; if (heights[r][c] === 0 && heights[r - 1][c] === 0) ok = false; }
    if (ok && Math.max(...heights.flat()) >= 2) return heights;
  }
}

/* ================================ BASIC ================================ */
add("basic", "b-cubes", "Volume by counting cubes", () => {
  const l = ri(2, 5), w = ri(2, 4), h = ri(1, 4);
  const heights = Array.from({ length: w }, () => Array(l).fill(h));
  return { prompt: `The rectangular prism is made from 1 cm cubes. What is its volume?`, diagram: V({ diagramType: "cube-array", heights }, 0.9), mode: "num", value: l * w * h, unit: "cm³", why: `${l} × ${w} = ${l * w} cubes in each layer, and ${h} layer${h > 1 ? "s" : ""}: ${l * w * h} cm³.` };
});
add("basic", "b-rect-prism", "Volume of a rectangular prism", () => {
  const u = pick(UNITS), cube = Math.random() < 0.2, l = ri(2, 15), w = cube ? l : ri(2, 12), h = cube ? l : ri(2, 12);
  return { prompt: `Find the volume of this ${cube ? "cube" : "rectangular prism"}.`, diagram: V({ diagramType: "rectangular-prism", length: String(l), width: w, height: h, unit: u, label: "", isCube: cube }), mode: "num", value: l * w * h, unit: cu(u), why: `V = l × w × h = ${l} × ${w} × ${h} = ${fmt(l * w * h)} ${cu(u)}.` };
});
add("basic", "b-v-ah", "Volume from the area of the cross-section", () => {
  const u = pick(UNITS), A = ri(4, 40) + pick([0, 0, 0.5]), h = ri(2, 12);
  return { prompt: `The shaded cross-section of this prism has an area of ${fmt(A)} ${u}². Find the volume of the prism.`, diagram: V({ diagramType: "uniform-cross-section", shape: pick(["triangle", "trapezium", "pentagon", "rectangle"]), crossArea: fmt(A), length: h, unit: u }), mode: "num", value: A * h, unit: cu(u), why: `V = Ah = ${fmt(A)} × ${h} = ${fmt(A * h)} ${cu(u)}.` };
});
add("basic", "b-capacity-units", "Units of capacity", () => {
  const items = [
    () => { const v = pick([2, 1.5, 0.75, 3.2, 0.25]); return [`${fmt(v)} L`, "mL", v * 1000, "1 L = 1000 mL"]; },
    () => { const v = pick([500, 1250, 250, 4000, 75]); return [`${fmt(v)} mL`, "L", v / 1000, "1000 mL = 1 L"]; },
    () => { const v = pick([3, 1.5, 0.6, 12]); return [`${fmt(v)} kL`, "L", v * 1000, "1 kL = 1000 L"]; },
    () => { const v = pick([2500, 800, 15000]); return [`${fmt(v)} L`, "kL", v / 1000, "1000 L = 1 kL"]; },
    () => { const v = pick([2, 0.5, 4.5]); return [`${fmt(v)} ML`, "kL", v * 1000, "1 ML = 1000 kL"]; }
  ];
  const [from, to, val, rule] = pick(items)();
  return { prompt: `Convert ${M(from)} to ${to}.`, mode: "num", value: round(val, 6), unit: to, why: `${rule}, so ${fmt(round(val, 6))} ${to}.` };
});
add("basic", "b-vol-cap", "Volume and capacity", () => {
  const k = pick([0, 1, 2, 3]);
  if (k === 0) { const v = ri(20, 900); return { prompt: `A container has a volume of ${v} cm³. What is its capacity in millilitres?`, mode: "num", value: v, unit: "mL", why: `1 cm³ holds 1 mL, so ${v} cm³ = ${v} mL.` }; }
  if (k === 1) { const v = pick([2000, 1500, 3500, 750, 12000]); return { prompt: `A box has a volume of ${fmt(v)} cm³. How many litres does it hold?`, mode: "num", value: v / 1000, unit: "L", why: `${fmt(v)} cm³ = ${fmt(v)} mL = ${fmt(v / 1000)} L.` }; }
  if (k === 2) { const v = pick([2, 5, 0.5, 1.2, 12]); return { prompt: `A tank has a volume of ${fmt(v)} m³. What is its capacity in kilolitres?`, mode: "num", value: v, unit: "kL", why: `1 m³ holds 1 kL (1000 L), so ${fmt(v)} m³ = ${fmt(v)} kL.` }; }
  const v = pick([2, 5, 0.5, 1.2]); return { prompt: `A tank has a volume of ${fmt(v)} m³. How many litres does it hold?`, mode: "num", value: v * 1000, unit: "L", why: `1 m³ = 1 kL = 1000 L, so ${fmt(v)} m³ = ${fmt(v * 1000)} L.` };
});
add("basic", "b-views", "Views of solids", () => {
  const heights = randomStack(), v = viewsOf(heights);
  const which = pick(["top", "front", "side"]), correct = v[which];
  const mirror = cells => { const m = Math.max(...cells.map(c => c[0])); return cells.map(([x, y]) => [m - x, y]); };
  const flipUp = cells => { const m = Math.max(...cells.map(c => c[1])); return cells.map(([x, y]) => [x, m - y]); };
  const opts = [correct];
  for (const p of shuffle([v.front, v.side, v.top, mirror(correct), flipUp(correct), mirror(v.side), mirror(v.front)])) { if (opts.length === 4) break; if (!opts.some(o => ck(o) === ck(p))) opts.push(p); }
  if (opts.length < 4) return T.find(t => t.id === "b-views").gen();
  const order = shuffle(opts), L = ["A", "B", "C", "D"];
  const words = { top: "from the top", front: "from the front", side: "from the right-hand side" };
  return { prompt: `This solid is made from cubes. Which drawing shows its view <b>${words[which]}</b>?`, diagram: S({ diagramType: "stack-views", heights, options: order.map((o, i) => ({ label: L[i], cells: o })) }, 1.0, 360), mode: "mc", options: L, correct: order.findIndex(o => ck(o) === ck(correct)), keepOrder: true,
    why: which === "top" ? "From above you see one square for every column of cubes, however tall it is." : which === "front" ? "From the front, each column shows its tallest stack." : "From the right, the front row is on your left, and each row shows its tallest stack.", key: JSON.stringify(heights) + which };
});
add("basic", "b-prism", "Is it a prism?", () => {
  const kinds = [
    [{ kind: "prism", sides: 3 }, true, "a triangular prism", "Its cross-section is the same triangle all the way along."],
    [{ kind: "prism", sides: 4, base: "rectangle" }, true, "a rectangular prism", "Its cross-section is the same rectangle all the way along."],
    [{ kind: "prism", sides: 6 }, true, "a hexagonal prism", "Its cross-section is the same hexagon all the way along."],
    [{ kind: "prism", sides: 5 }, true, "a pentagonal prism", "Its cross-section is the same pentagon all the way along."],
    [{ kind: "pyramid", sides: 4 }, false, "a square pyramid", "Slices parallel to the base get smaller towards the top, so it has no uniform cross-section."],
    [{ kind: "pyramid", sides: 3 }, false, "a triangular pyramid", "The cross-section shrinks to a point, so it is not a prism."],
    [{ kind: "cone" }, false, "a cone", "A cone narrows to a point, and a circle is not a polygon."],
    [{ kind: "sphere" }, false, "a sphere", "A sphere has no flat faces and no uniform cross-section."]
  ];
  const [cfg, isPrism, name, why] = pick(kinds);
  return { prompt: `True or false? This solid is a <b>prism</b>.`, diagram: S(Object.assign({ diagramType: "solid" }, cfg), 1.0, 300), mode: "tf", truth: isPrism, why: `It is ${name}. ${why}`, key: name };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-tri-prism", "Volume of a triangular prism", () => {
  const u = pick(UNITS), b = ri(3, 14), h = ri(3, 12), l = ri(4, 20);
  return { prompt: `Find the volume of this triangular prism.`, diagram: V({ diagramType: "triangular-prism", base: b, height: h, length: l, unit: u }), mode: "num", value: b * h / 2 * l, unit: cu(u), why: `A = ½ × ${b} × ${h} = ${fmt(b * h / 2)} ${u}². V = Ah = ${fmt(b * h / 2)} × ${l} = ${fmt(b * h / 2 * l)} ${cu(u)}.` };
});
add("expected", "e-trap-prism", "Volume of a trapezium prism", () => {
  const u = pick(UNITS), bot = ri(6, 14), top = ri(2, bot - 2), h = ri(3, 10), l = ri(4, 16);
  const A = (top + bot) * h / 2;
  return { prompt: `The cross-section of this prism is a trapezium. Find the volume of the prism.`, diagram: V({ diagramType: "quadrilateral-prism", kind: "trapezium", top, bottom: bot, height: h, length: l, unit: u }), mode: "num", value: A * l, unit: cu(u), why: `A = ½ × (${top} + ${bot}) × ${h} = ${fmt(A)} ${u}². V = Ah = ${fmt(A)} × ${l} = ${fmt(A * l)} ${cu(u)}.` };
});
add("expected", "e-composite", "Volume of a composite prism", () => {
  const u = pick(UNITS), L = ri(8, 16), up = ri(3, L - 3), lh = ri(2, 6), uh = ri(2, 6), d = ri(3, 10);
  const A = L * lh + up * uh;
  return { prompt: `Find the volume of this solid.`, diagram: V({ diagramType: "composite-prism", kind: "stepped-block", depth: d, lowerLength: L, upperLength: up, lowerHeight: lh, upperHeight: uh, unit: u }), mode: "num", value: A * d, unit: cu(u), why: `Split it into two rectangular prisms: ${L} × ${lh} × ${d} + ${up} × ${uh} × ${d} = ${L * lh * d} + ${up * uh * d} = ${A * d} ${cu(u)}.` };
});
add("expected", "e-cylinder", "Volume of a cylinder", () => {
  const u = pick(["cm", "m", "mm"]), byD = Math.random() < 0.4, r = ri(2, 12), h = ri(3, 20);
  const f = p => p * r * r * h;
  return { prompt: `Find the volume of the cylinder, correct to 1 decimal place.`, diagram: V({ diagramType: "cylinder", radius: byD ? null : r, diameter: byD ? 2 * r : null, height: h, unit: u, orientation: pick(["vertical", "horizontal"]) }), mode: "num", value: f(Math.PI), dp: 1, alts: PI_ALTS(f, 1), unit: cu(u), why: `${byD ? `r = ${2 * r} ÷ 2 = ${r}. ` : ""}V = πr²h = π × ${r}² × ${h} ≈ ${round(f(Math.PI), 1).toFixed(1)} ${cu(u)}.` };
});
add("expected", "e-missing", "Find a missing dimension", () => {
  const u = pick(UNITS), k = pick([0, 1, 2]);
  if (k === 0) { const l = ri(3, 12), w = ri(2, 10), h = ri(2, 12); return { prompt: `A rectangular prism has a volume of ${l * w * h} ${cu(u)}. Its length is ${l} ${u} and its width is ${w} ${u}. Find its height.`, mode: "num", value: h, unit: u, why: `h = V ÷ (l × w) = ${l * w * h} ÷ ${l * w} = ${h} ${u}.` }; }
  if (k === 1) { const s = ri(2, 10); return { prompt: `A cube has a volume of ${s ** 3} ${cu(u)}. How long is each edge?`, mode: "num", value: s, unit: u, why: `∛${s ** 3} = ${s} ${u}.` }; }
  const r = ri(2, 8), h = ri(3, 15), Vv = round(Math.PI * r * r * h, 1);
  return { prompt: `A cylinder has a radius of ${r} ${u} and a volume of ${Vv.toFixed(1)} ${cu(u)}. Find its height, correct to the nearest whole number.`, mode: "num", value: h, dp: 0, unit: u, why: `h = V ÷ (πr²) = ${Vv.toFixed(1)} ÷ (π × ${r}²) ≈ ${fmt(Vv / (Math.PI * r * r), 2)} → ${h} ${u}.` };
});
add("expected", "e-capacity", "Capacity of containers", () => {
  if (Math.random() < 0.5) {
    const l = pick([40, 50, 60, 80, 100, 120]), w = pick([20, 25, 30, 40]), h = pick([20, 25, 30, 40, 50]);
    return { prompt: `An aquarium is a rectangular prism ${l} cm long, ${w} cm wide and ${h} cm high. How many litres of water does it hold when full?`, diagram: V({ diagramType: "capacity-tank", length: l, width: w, height: h, unit: "cm", context: "aquarium" }), mode: "num", value: l * w * h / 1000, unit: "L", why: `V = ${l} × ${w} × ${h} = ${fmt(l * w * h)} cm³ = ${fmt(l * w * h)} mL = ${fmt(l * w * h / 1000)} L.` };
  }
  const l = pick([2, 3, 4, 5, 6]), w = pick([1, 1.5, 2, 2.5, 3]), h = pick([0.5, 1, 1.5, 2]);
  return { prompt: `A water tank is a rectangular prism ${fmt(l)} m long, ${fmt(w)} m wide and ${fmt(h)} m high. How many kilolitres does it hold when full?`, diagram: V({ diagramType: "capacity-tank", length: l, width: w, height: h, unit: "m", context: "tank" }), mode: "num", value: round(l * w * h, 6), unit: "kL", why: `V = ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = ${fmt(l * w * h)} m³, and 1 m³ = 1 kL: ${fmt(l * w * h)} kL.` };
});
add("expected", "e-units", "Convert units of volume", () => {
  const items = [
    () => { const v = pick([2, 3.5, 0.4, 12]); return [`${fmt(v)} cm³`, "mm³", v * 1000, "1 cm³ = 10 × 10 × 10 = 1000 mm³"]; },
    () => { const v = pick([4500, 800, 25000]); return [`${fmt(v)} mm³`, "cm³", v / 1000, "1000 mm³ = 1 cm³"]; },
    () => { const v = pick([2, 0.5, 1.5, 0.08]); return [`${fmt(v)} m³`, "cm³", v * 1000000, "1 m³ = 100 × 100 × 100 = 1 000 000 cm³"]; },
    () => { const v = pick([250000, 3000000, 750000]); return [`${fmt(v)} cm³`, "m³", v / 1000000, "1 000 000 cm³ = 1 m³"]; }
  ];
  const [from, to, val, rule] = pick(items)();
  return { prompt: `Convert ${M(from)} to ${to}.`, mode: "num", value: round(val, 6), unit: to, why: `${rule}, so ${fmt(round(val, 6))} ${to}.` };
});

MMTQ.run({
  id: "volume", title: "Volume", outcome: "MA4-VOL-C-01",
  toolId: "volume-quiz", tool: "volume-student-quiz", mastery: "volume",
  levels: {
    basic: { sub: "Counting cubes, rectangular prisms, V = Ah, units of capacity, volume and capacity, views of solids and spotting prisms." },
    expected: { sub: "Triangular, trapezium and composite prisms, cylinders, missing dimensions, capacity of containers and converting units of volume." }
  },
  related: [],
  types: T
});
