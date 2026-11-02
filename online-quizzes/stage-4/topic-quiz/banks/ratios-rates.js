/* Ratios and Rates — MA4-RAT-C-01 — whole-topic quiz bank.
   Content statements: recognise and simplify ratios · solve problems
   involving ratios · recognise and simplify rates · solve problems involving
   rates · interpret and construct distance–time graphs. */
const C = window.MMTQCore;
const { ri, pick, shuffle, gcd, fmt, money, frac } = C;
const T = [];
const add = (level, id, label, gen) => T.push({ level, id, label, gen });
const NAMES = ["Mia", "Noah", "Aisha", "Leo", "Zara", "Jack", "Priya", "Tom", "Ella", "Sam", "Ruby", "Omar"];
const two = () => { const a = pick(NAMES); let b; do { b = pick(NAMES); } while (b === a); return [a, b]; };
const coprime = (lo, hi) => { let a, b; do { a = ri(lo, hi); b = ri(lo, hi); } while (a === b || gcd(a, b) !== 1); return [a, b]; };
const R = (...p) => p.map(x => fmt(x)).join(" : ");
const bar = (parts, total) => ({ engine: "rates-engine", config: { diagramType: "ratio-bar", parts, totalLabel: total }, scale: 1.1 });

/* ---------- distance–time journeys on a readable grid ----------
   Time in 5-minute steps, distance in 25 m steps, so every corner of the
   graph sits on a grid line and can be read exactly. */
function journey() {
  for (let tries = 0; tries < 200; tries++) {
    const pts = [{ x: 0, y: 0 }];
    let t = 0, d = 0;
    const legs = [];
    const go = (dir) => {
      const dt = pick([5, 10, 15, 20]), s = pick([5, 10, 15, 20]);
      const nd = d + dir * s * dt;
      if (nd <= 0 || nd > 400) return false;
      legs.push({ from: { x: t, y: d }, to: { x: t + dt, y: nd }, kind: dir > 0 ? "away" : "back", speed: s });
      t += dt; d = nd; pts.push({ x: t, y: d }); return true;
    };
    const stop = () => { const dt = pick([5, 10]); legs.push({ from: { x: t, y: d }, to: { x: t + dt, y: d }, kind: "stop", speed: 0 }); t += dt; pts.push({ x: t, y: d }); };
    if (!go(1)) continue;
    stop();
    if (!go(pick([1, 1, -1]))) continue;
    if (Math.random() < 0.6) stop();
    // home again
    const s = pick([10, 15, 20]);
    if (d % (s * 5)) continue;
    const dt = d / s; if (dt > 25 || dt % 5) continue;
    legs.push({ from: { x: t, y: d }, to: { x: t + dt, y: 0 }, kind: "back", speed: s }); t += dt; pts.push({ x: t, y: 0 });
    if (t > 80) continue;
    const speeds = legs.filter(l => l.speed).map(l => l.speed);
    const fastest = Math.max(...speeds);
    if (speeds.filter(s2 => s2 === fastest).length > 1) continue;   // one clear fastest leg
    const maxY = Math.max(...pts.map(p => p.y));
    return { pts, legs, xMax: Math.ceil(t / 10) * 10, yMax: Math.max(150, Math.ceil(maxY / 50) * 50) };
  }
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 100 }, { x: 20, y: 100 }, { x: 30, y: 250 }, { x: 40, y: 0 }];
  const legs = [{ from: pts[0], to: pts[1], kind: "away", speed: 10 }, { from: pts[1], to: pts[2], kind: "stop", speed: 0 }, { from: pts[2], to: pts[3], kind: "away", speed: 15 }, { from: pts[3], to: pts[4], kind: "back", speed: 25 }];
  return { pts, legs, xMax: 50, yMax: 250 };
}
function dtDiagram(j) {
  return { engine: "rates-engine", scale: 0.95, config: { diagramType: "distance-time", mode: "completed", xLabel: "Time (minutes)", yLabel: "Distance from home (m)", xMax: j.xMax, yMax: j.yMax, xStep: 10, yStep: 50, xMinorStep: 5, yMinorStep: 25, points: j.pts, answerPoints: j.pts } };
}

/* ================================ BASIC ================================ */
add("basic", "b-simplify", "Simplify a ratio", () => {
  const [a, b] = coprime(1, 9), k = ri(2, 12);
  if (Math.random() < 0.5) {
    const ctx = pick([["boys", "girls", "in a class"], ["cats", "dogs", "at a shelter"], ["red pens", "blue pens", "in a box"], ["apples", "oranges", "in a bowl"]]);
    return { prompt: `There are ${a * k} ${ctx[0]} and ${b * k} ${ctx[1]} ${ctx[2]}. Write the ratio of ${ctx[0]} to ${ctx[1]} in simplest form.`, mode: "ratio", parts: [a, b], answerHTML: R(a, b), why: `Both numbers divide by ${k}: ${a * k} ÷ ${k} : ${b * k} ÷ ${k} = ${R(a, b)}.` };
  }
  return { prompt: `Simplify the ratio <span class="m">${R(a * k, b * k)}</span>.`, mode: "ratio", parts: [a, b], answerHTML: R(a, b), why: `The highest common factor is ${k}. Divide both parts by ${k}.` };
});
add("basic", "b-equivalent", "Equivalent ratios", () => {
  const [a, b] = coprime(1, 9), k = ri(2, 9);
  const left = Math.random() < 0.5;
  return left
    ? { prompt: `Find the missing number.<span class="big">${R(a, b)} = ${fmt(a * k)} : ?</span>`, mode: "num", value: b * k, why: `${a} × ${k} = ${a * k}, so multiply ${b} by ${k} too: ${b * k}.` }
    : { prompt: `Find the missing number.<span class="big">${R(a, b)} = ? : ${fmt(b * k)}</span>`, mode: "num", value: a * k, why: `${b} × ${k} = ${b * k}, so multiply ${a} by ${k} too: ${a * k}.` };
});
add("basic", "b-fraction", "A ratio as a fraction of the whole", () => {
  const [a, b] = coprime(1, 8);
  const ctx = pick([["red", "blue", "marbles in a bag"], ["fiction", "non-fiction", "books on a shelf"], ["sunny", "rainy", "days last month"], ["girls", "boys", "students in a team"]]);
  const first = Math.random() < 0.5;
  const n = first ? a : b;
  return { prompt: `The ratio of ${ctx[0]} to ${ctx[1]} ${ctx[2]} is <span class="m">${R(a, b)}</span>. What fraction of them are ${first ? ctx[0] : ctx[1]}?`, mode: "frac", n, d: a + b, form: "fraction", answerHTML: frac(n, a + b), why: `There are ${a} + ${b} = ${a + b} parts altogether, and ${n} of them are ${first ? ctx[0] : ctx[1]}.` };
});
add("basic", "b-share", "Share an amount in a ratio", () => {
  const [p, q] = two();
  const [a, b] = coprime(1, 6), unit = ri(2, 15) * pick([1, 2, 5]);
  const total = (a + b) * unit;
  const askFirst = Math.random() < 0.5;
  return { prompt: `${p} and ${q} share ${money(total)} in the ratio <span class="m">${R(a, b)}</span>. How much does ${askFirst ? p : q} get?`, diagram: bar([{ label: p, units: a }, { label: q, units: b }], money(total)), mode: "num", value: (askFirst ? a : b) * unit, pre: "$", why: `${a} + ${b} = ${a + b} parts. One part = ${money(total)} ÷ ${a + b} = ${money(unit)}. ${askFirst ? p : q} gets ${askFirst ? a : b} × ${money(unit)} = ${money((askFirst ? a : b) * unit)}.` };
});
const RATE_CTX = [
  { s: (q, t) => `A car travels ${q} km in ${t} hours.`, ask: "What is its average speed?", u: "km/h", q: [40, 110], t: [2, 5] },
  { s: (q, t) => `A tap fills a ${q} L tub in ${t} minutes.`, ask: "How many litres flow per minute?", u: "L/min", q: [4, 20], t: [3, 9] },
  { s: (q, t) => `Sam types ${q} words in ${t} minutes.`, ask: "How many words does Sam type per minute?", u: "words/min", q: [30, 70], t: [2, 8] },
  { s: (q, t) => `A worker earns $${q} for ${t} hours of work.`, ask: "What is the hourly rate of pay?", u: "per hour", pre: "$", q: [18, 40], t: [3, 8] },
  { s: (q, t) => `${t} kg of apples cost $${q}.`, ask: "What is the cost per kilogram?", u: "per kg", pre: "$", q: [3, 9], t: [2, 6] }
];
add("basic", "b-unit-rate", "Write a rate per one unit", () => {
  const c = pick(RATE_CTX), r = ri(c.q[0], c.q[1]), t = ri(c.t[0], c.t[1]);
  const pre = c.pre || "";
  return { prompt: `${c.s(r * t, t)} ${c.ask}`, mode: "num", value: r, pre, unit: c.u, why: `Divide by ${t}: ${pre}${r * t} ÷ ${t} = ${pre}${r} ${c.u}.` };
});
add("basic", "b-use-rate", "Use a rate", () => {
  const k = pick([0, 1, 2, 3]);
  if (k === 0) { const r = ri(18, 32), h = ri(3, 9); return { prompt: `Lena earns $${r} per hour. How much does she earn for ${h} hours?`, mode: "num", value: r * h, pre: "$", why: `${h} × $${r} = $${r * h}` }; }
  if (k === 1) { const r = ri(4, 12) * 5, m = ri(3, 9); return { prompt: `A printer prints ${r} pages per minute. How many pages does it print in ${m} minutes?`, mode: "num", value: r * m, unit: "pages", why: `${m} × ${r} = ${r * m} pages` }; }
  if (k === 2) { const r = ri(6, 15) * 10, t = ri(2, 6); return { prompt: `A water tank fills at ${r} L per hour. How long does it take to put ${r * t} L in the tank?`, mode: "num", value: t, unit: "hours", why: `${r * t} ÷ ${r} = ${t} hours` }; }
  const sp = ri(5, 11) * 10, h = ri(2, 5); return { prompt: `A bus travels at ${sp} km/h. How far does it travel in ${h} hours?`, mode: "num", value: sp * h, unit: "km", why: `distance = speed × time = ${sp} × ${h} = ${sp * h} km` };
});
add("basic", "b-dt-read", "Read a distance–time graph", () => {
  const j = journey();
  const cand = [];
  for (let x = 5; x < j.pts[j.pts.length - 1].x; x += 5) {
    const L = j.legs.find(l => x >= l.from.x && x <= l.to.x);
    const y = L.from.y + (L.to.y - L.from.y) * (x - L.from.x) / (L.to.x - L.from.x);
    if (y % 25 === 0 && y > 0) cand.push({ x, y });
  }
  const p = pick(cand);
  return { prompt: `The graph shows a walk from home and back. How far from home was the walker after <b>${p.x} minutes</b>?`, diagram: dtDiagram(j), mode: "num", value: p.y, unit: "m", why: `Go up from ${p.x} on the time axis to the graph, then across to the distance axis: ${p.y} m.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-simplify-units", "Simplify ratios with units or decimals", () => {
  const k = pick([0, 1, 2, 3]);
  if (k === 0) { const m = pick([15, 20, 30, 40, 45, 50]), h = ri(1, 3); const g = gcd(m, h * 60); return { prompt: `Simplify the ratio <span class="m">${m} minutes : ${h} hour${h > 1 ? "s" : ""}</span>.`, mode: "ratio", parts: [m / g, h * 60 / g], answerHTML: R(m / g, h * 60 / g), why: `Use the same unit: ${m} min : ${h * 60} min, then divide by ${g}.` }; }
  if (k === 1) { const cm = pick([20, 40, 50, 60, 75, 80]), m = pick([1, 2, 3]); const g = gcd(cm, m * 100); return { prompt: `Simplify the ratio <span class="m">${cm} cm : ${m} m</span>.`, mode: "ratio", parts: [cm / g, m * 100 / g], answerHTML: R(cm / g, m * 100 / g), why: `${m} m = ${m * 100} cm, so the ratio is ${cm} : ${m * 100}. Divide by ${g}.` }; }
  if (k === 2) { const g1 = pick([200, 250, 400, 500, 750]), kg = pick([1, 2, 3]); const g = gcd(g1, kg * 1000); return { prompt: `Simplify the ratio <span class="m">${g1} g : ${kg} kg</span>.`, mode: "ratio", parts: [g1 / g, kg * 1000 / g], answerHTML: R(g1 / g, kg * 1000 / g), why: `${kg} kg = ${kg * 1000} g. Then divide ${g1} : ${kg * 1000} by ${g}.` }; }
  const [a, b] = coprime(2, 9), s = pick([0.5, 1.5, 2.5, 0.2]);
  const A = fmt(a * s), B = fmt(b * s);
  if (A === String(a) || /\.\d{2}/.test(A + B)) return { prompt: `Simplify the ratio <span class="m">${fmt(a * 0.5)} : ${fmt(b * 0.5)}</span>.`, mode: "ratio", parts: [a, b], answerHTML: R(a, b), why: `Multiply both parts by 2 to clear the decimals: ${a} : ${b}.` };
  const tens = Math.round(a * s * 10), tb = Math.round(b * s * 10), gg = gcd(tens, tb);
  return { prompt: `Simplify the ratio <span class="m">${A} : ${B}</span>.`, mode: "ratio", parts: [tens / gg, tb / gg], answerHTML: R(tens / gg, tb / gg), why: `Multiply by 10 to clear the decimals (${tens} : ${tb}), then divide by ${gg}.` };
});
add("expected", "e-share3", "Share in a three-part ratio", () => {
  const names = shuffle(NAMES).slice(0, 3);
  let a, b, c; do { a = ri(1, 6); b = ri(1, 6); c = ri(1, 6); } while (gcd(gcd(a, b), c) !== 1 || (a === b && b === c));
  const unit = ri(3, 20) * pick([1, 5]), total = (a + b + c) * unit;
  const i = ri(0, 2), part = [a, b, c][i];
  return { prompt: `${names[0]}, ${names[1]} and ${names[2]} share ${money(total)} in the ratio <span class="m">${R(a, b, c)}</span>. How much does ${names[i]} receive?`, diagram: bar([{ label: names[0], units: a }, { label: names[1], units: b }, { label: names[2], units: c }], money(total)), mode: "num", value: part * unit, pre: "$", why: `${a + b + c} parts. One part = ${money(total)} ÷ ${a + b + c} = ${money(unit)}. ${names[i]}: ${part} × ${money(unit)} = ${money(part * unit)}.` };
});
add("expected", "e-known-part", "Find a quantity from one part of a ratio", () => {
  const ctx = pick([
    { a: "boys", b: "girls", where: "at a school camp", have: (n, w) => `There are ${n} ${w}.`, ask: w => `How many ${w} are there?`, u: "" },
    { a: "flour", b: "sugar", where: "in a recipe", have: (n, w) => `The recipe uses ${n} cups of ${w}.`, ask: w => `How many cups of ${w} does it use?`, u: "cups" },
    { a: "cordial", b: "water", where: "in a drink", have: (n, w) => `A jug has ${n} mL of ${w}.`, ask: w => `How many millilitres of ${w} does it need?`, u: "mL" },
    { a: "sand", b: "cement", where: "in a concrete mix", have: (n, w) => `A builder uses ${n} kg of ${w}.`, ask: w => `How many kilograms of ${w} are needed?`, u: "kg" }
  ]);
  const [a, b] = coprime(1, 9), k = ri(3, 12);
  const pl = n => n === 1 ? "part" : "parts";
  const giveFirst = Math.random() < 0.5;
  const [gp, gw, ap, aw] = giveFirst ? [a, ctx.a, b, ctx.b] : [b, ctx.b, a, ctx.a];
  return { prompt: `The ratio of ${ctx.a} to ${ctx.b} ${ctx.where} is <span class="m">${R(a, b)}</span>. ${ctx.have(gp * k, gw)} ${ctx.ask(aw)}`, mode: "num", value: ap * k, unit: ctx.u, why: `${gp} ${pl(gp)} = ${gp * k}, so 1 part = ${k}. ${aw[0].toUpperCase() + aw.slice(1)}: ${ap} × ${k} = ${ap * k}.` };
});
add("expected", "e-difference", "Ratio problems from a difference", () => {
  const [p, q] = two();
  let a, b; do { [a, b] = coprime(1, 9); } while (a >= b);
  const unit = ri(2, 15) * pick([1, 5]);
  return { prompt: `${p} and ${q} share some money in the ratio <span class="m">${R(a, b)}</span>. ${q} gets ${money((b - a) * unit)} more than ${p}. How much does ${p} get?`, diagram: bar([{ label: p, units: a }, { label: q, units: b }], ""), mode: "num", value: a * unit, pre: "$", why: `The difference is ${b} − ${a} = ${b - a} part${b - a === 1 ? "" : "s"} = ${money((b - a) * unit)}, so 1 part = ${money(unit)}. ${p}: ${a} × ${money(unit)} = ${money(a * unit)}.` };
});
add("expected", "e-scale", "Scale drawings and maps", () => {
  if (Math.random() < 0.5) {
    const sc = pick([10000, 20000, 25000, 50000, 100000]), cm = pick([2, 3, 4, 5, 6, 8, 2.5, 3.5, 4.5]);
    const km = cm * sc / 100000;
    return { prompt: `A map has a scale of <span class="m">1 : ${fmt(sc)}</span>. Two towns are ${fmt(cm)} cm apart on the map. How far apart are they in real life, in kilometres?`, mode: "num", value: km, unit: "km", why: `Real distance = ${fmt(cm)} × ${fmt(sc)} = ${fmt(cm * sc)} cm = ${fmt(km)} km (100 000 cm = 1 km).` };
  }
  const sc = pick([50, 100, 200, 250]), m = pick([4, 5, 6, 8, 10, 12]);
  return { prompt: `A house plan is drawn to a scale of <span class="m">1 : ${sc}</span>. A room is ${m} m long. How long is it on the plan, in centimetres?`, mode: "num", value: m * 100 / sc, unit: "cm", why: `${m} m = ${m * 100} cm. Plan length = ${m * 100} ÷ ${sc} = ${fmt(m * 100 / sc)} cm.` };
});
add("expected", "e-convert-rate", "Convert rates between units", () => {
  const k = pick([0, 1, 2, 3]);
  if (k === 0) { const v = pick([18, 36, 54, 72, 90, 108]); return { prompt: `Convert <span class="m">${v} km/h</span> to metres per second.`, mode: "num", value: v / 3.6, unit: "m/s", why: `${v} km/h = ${v * 1000} m per 3600 s = ${fmt(v / 3.6)} m/s.` }; }
  if (k === 1) { const v = pick([5, 10, 15, 20, 25, 30]); return { prompt: `Convert <span class="m">${v} m/s</span> to kilometres per hour.`, mode: "num", value: v * 3.6, unit: "km/h", why: `${v} m/s = ${v * 3600} m per hour = ${fmt(v * 3.6)} km/h.` }; }
  if (k === 2) { const v = pick([2, 3, 4, 5, 6, 8, 12]); return { prompt: `Water leaks from a tank at <span class="m">${v} L/min</span>. Write this rate in litres per hour.`, mode: "num", value: v * 60, unit: "L/h", why: `There are 60 minutes in an hour: ${v} × 60 = ${v * 60} L/h.` }; }
  const d = pick([1.5, 2.4, 3.6, 4.8, 6]); return { prompt: `Grapes cost <span class="m">$${d.toFixed(2)} per kilogram</span>. What is this in cents per gram?`, mode: "num", value: d * 100 / 1000, unit: "c/g", why: `$${d.toFixed(2)} = ${fmt(d * 100)} cents for 1000 g, so ${fmt(d * 100)} ÷ 1000 = ${fmt(d / 10)} c/g.` };
});
add("expected", "e-best-buy", "Best buys", () => {
  const item = pick([["juice", "mL", "bottle"], ["rice", "g", "bag"], ["shampoo", "mL", "bottle"], ["cereal", "g", "box"]]);
  for (let t = 0; t < 100; t++) {
    const s1 = pick([250, 500, 600, 750, 1000]), s2 = pick([1250, 1500, 2000, 2500, 3000]);
    const u1 = pick([0.4, 0.45, 0.5, 0.55, 0.6, 0.7]), u2 = pick([0.4, 0.45, 0.5, 0.55, 0.6, 0.7]);
    if (u1 === u2) continue;
    const p1 = Math.round(s1 * u1) / 100, p2 = Math.round(s2 * u2) / 100;
    const r1 = p1 / s1, r2 = p2 / s2; if (Math.abs(r1 - r2) / Math.min(r1, r2) < 0.06) continue;
    const better = r1 < r2 ? 0 : 1;
    const opts = [`A: ${s1} ${item[1]} for $${p1.toFixed(2)}`, `B: ${s2} ${item[1]} for $${p2.toFixed(2)}`];
    return { prompt: `Which ${item[2]} of ${item[0]} is the better buy?`, mode: "mc", options: [opts[0], opts[1]], correct: better, keepOrder: true,
      why: `Cost per 100 ${item[1]}: A = $${(r1 * 100).toFixed(3).replace(/0$/, "")}, B = $${(r2 * 100).toFixed(3).replace(/0$/, "")}. ${better ? "B" : "A"} is cheaper per ${item[1]}.` };
  }
});
add("expected", "e-sdt", "Speed, distance and time", () => {
  const k = pick([0, 1, 2]);
  if (k === 0) { const s = pick([12, 16, 18, 20, 24, 30]), h = pick([1.5, 2.5, 0.5, 1.25, 0.75]); const min = h * 60; const hh = Math.floor(h), mm = min - hh * 60; return { prompt: `A cyclist rides ${fmt(s * h)} km in ${hh ? hh + " h " : ""}${mm} min. What is her average speed?`, mode: "num", value: s, unit: "km/h", why: `${hh ? hh + " h " : ""}${mm} min = ${fmt(h)} h. Speed = ${fmt(s * h)} ÷ ${fmt(h)} = ${s} km/h.` }; }
  if (k === 1) { const s = pick([60, 72, 80, 90, 100]), min = pick([15, 30, 45, 90, 120]); return { prompt: `A train travels at ${s} km/h for ${min} minutes. How far does it travel?`, mode: "num", value: s * min / 60, unit: "km", why: `${min} min = ${fmt(min / 60)} h. Distance = ${s} × ${fmt(min / 60)} = ${fmt(s * min / 60)} km.` }; }
  const s = pick([40, 50, 60, 80]), min = pick([30, 45, 90, 150]); return { prompt: `How many minutes does it take to drive ${fmt(s * min / 60)} km at an average speed of ${s} km/h?`, mode: "num", value: min, unit: "min", why: `Time = ${fmt(s * min / 60)} ÷ ${s} = ${fmt(min / 60)} h = ${min} minutes.` };
});
add("expected", "e-dt-speed", "Speed from a distance–time graph", () => {
  const j = journey();
  const L = pick(j.legs.filter(l => l.speed));
  return { prompt: `The graph shows a walk. What was the walker's speed between <b>${L.from.x}</b> and <b>${L.to.x}</b> minutes, in metres per minute?`, diagram: dtDiagram(j), mode: "num", value: L.speed, unit: "m/min", why: `Distance covered = ${Math.abs(L.to.y - L.from.y)} m in ${L.to.x - L.from.x} min. Speed = ${Math.abs(L.to.y - L.from.y)} ÷ ${L.to.x - L.from.x} = ${L.speed} m/min.` };
});
add("expected", "e-dt-interpret", "Interpret a distance–time graph", () => {
  const j = journey();
  const legs = j.legs;
  const lab = l => `${l.from.x} to ${l.to.x} minutes`;
  const kind = pick(["stop", "fast", "far"]);
  if (kind === "stop") {
    const stop = pick(legs.filter(l => l.kind === "stop"));
    const others = shuffle(legs.filter(l => l !== stop)).slice(0, 3);
    const opts = shuffle([stop, ...others]);
    return { prompt: `During which time interval was the walker <b>stopped</b>?`, diagram: dtDiagram(j), mode: "mc", options: opts.map(lab), correct: opts.indexOf(stop), why: `A stop is a flat (horizontal) section: the time increases but the distance from home does not change.` };
  }
  if (kind === "fast") {
    const moving = legs.filter(l => l.speed);
    const f = moving.reduce((a, b) => (b.speed > a.speed ? b : a));
    const opts = shuffle([f, ...shuffle(legs.filter(l => l !== f)).slice(0, 3)]);
    return { prompt: `During which time interval was the walker moving <b>fastest</b>?`, diagram: dtDiagram(j), mode: "mc", options: opts.map(lab), correct: opts.indexOf(f), why: `The steepest section is the fastest: ${f.speed} m/min from ${lab(f)}.` };
  }
  const maxY = Math.max(...j.pts.map(p => p.y));
  return { prompt: `What is the greatest distance the walker was from home?`, diagram: dtDiagram(j), mode: "num", value: maxY, unit: "m", why: `The highest point of the graph is at ${maxY} m.` };
});

MMTQ.run({
  id: "ratios-rates", title: "Ratios and Rates", outcome: "MA4-RAT-C-01",
  toolId: "ratios-rates-quiz", tool: "ratios-rates-student-quiz", mastery: "ratios-and-rates",
  levels: {
    basic: { sub: "Simplify ratios, share an amount, write and use simple rates, read a distance–time graph." },
    expected: { sub: "Ratios with units and three parts, scale, converting rates, best buys, speed and distance–time graphs." }
  },
  related: [
    { href: "/interactive-tools/stage-4/ratios-rates/stacked-bar-ratio/", label: "Stacked Bar Model — Ratio", small: "Teaching tool" },
    { href: "/online-quizzes/stage-4/ratios-rates/stacked-bar-ratio.html", label: "Stacked Bar Model — Student Quiz", small: "Focused quiz" }
  ],
  types: T
});
