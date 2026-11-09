/**
 * Playground question bank — data-visualisation.
 * Ported from the website's `online-quizzes/stage-4/topic-quiz/banks/data-visualisation.js`.
 * Generators + question shapes UNCHANGED — if you fix a question here, port it
 * to the website bank too (and vice versa).
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
/* Data Classification and Visualisation — MA4-DAT-C-01 — whole-topic quiz bank.
   Content statements: classify data as numerical (discrete or continuous) or
   categorical (nominal or ordinal) · display data using graphical
   representations relevant to the purpose of the data · interpret data in
   graphical representations.
   Every chart is drawn from the same numbers the answer is worked from. */
const { ri, pick, shuffle, sample, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const ST = (config, scale = 1.05, maxH = 340) => ({ engine: "statistics-engine", config, scale, maxH });
const sum = a => a.reduce((s, v) => s + v, 0);

const VARS = [
  ["the number of pets in each household", "Numerical — discrete", "It is counted in whole numbers."],
  ["the number of goals scored in a game", "Numerical — discrete", "It is counted in whole numbers."],
  ["the number of students on each bus", "Numerical — discrete", "It is counted."],
  ["the height of each student", "Numerical — continuous", "It is measured, and can take any value in a range."],
  ["the time taken to run 100 m", "Numerical — continuous", "It is measured, so it can be any value (12.38 s, …)."],
  ["the mass of each apple in a box", "Numerical — continuous", "It is measured."],
  ["the temperature at noon each day", "Numerical — continuous", "It is measured."],
  ["favourite sport", "Categorical — nominal", "It is a category with no natural order."],
  ["eye colour", "Categorical — nominal", "It is a category with no natural order."],
  ["the way students travel to school", "Categorical — nominal", "Bus, car, walk… are categories with no order."],
  ["the state a person was born in", "Categorical — nominal", "States are categories with no order."],
  ["T-shirt size (S, M, L, XL)", "Categorical — ordinal", "Sizes are categories that have a natural order."],
  ["a rating of a movie (poor, fair, good, excellent)", "Categorical — ordinal", "Ratings are categories with a natural order."],
  ["year group at school (Year 7, Year 8, …)", "Categorical — ordinal", "Year groups are categories with an order."],
  ["level of spiciness (mild, medium, hot)", "Categorical — ordinal", "The categories have a natural order."]
];
const CATS = [
  { t: "Favourite sport", x: "Sport", y: "Number of students", c: ["Soccer", "Netball", "Cricket", "Basketball", "Swimming"] },
  { t: "Favourite fruit", x: "Fruit", y: "Number of students", c: ["Apple", "Banana", "Orange", "Grapes", "Mango"] },
  { t: "How students travel to school", x: "Method", y: "Number of students", c: ["Walk", "Bus", "Car", "Bike", "Train"] },
  { t: "Pets owned", x: "Pet", y: "Number of families", c: ["Dog", "Cat", "Fish", "Bird", "Rabbit"] }
];
const DISCRETE = [
  { x: "Goals scored per game", what: "games", noun: "goals", min: 0, max: 6 },
  { x: "Number of siblings", what: "students", noun: "siblings", min: 0, max: 5 },
  { x: "Books read last month", what: "students", noun: "books", min: 0, max: 6 },
  { x: "Number of people in a car", what: "cars", noun: "people", min: 1, max: 5 }
];
function discreteData(ctx, n = ri(14, 22)) { const peak = ri(ctx.min + 1, ctx.max - 1); return Array.from({ length: n }, () => Math.max(ctx.min, Math.min(ctx.max, peak + ri(-2, 2) + (Math.random() < 0.15 ? ri(-2, 2) : 0)))).sort((a, b) => a - b); }
const count = (data, v) => data.filter(d => d === v).length;

/* ================================ BASIC ================================ */
add("basic", "b-cat-num", "Categorical or numerical?", () => {
  const [v, kind] = pick(VARS);
  const opts = ["Categorical", "Numerical"];
  return { prompt: `Is this data <b>categorical</b> or <b>numerical</b>?<span class="say">${v[0].toUpperCase() + v.slice(1)}</span>`, mode: "mc", options: opts, correct: kind.startsWith("Cat") ? 0 : 1, keepOrder: true, why: kind.startsWith("Cat") ? "The data are words or labels (categories)." : "The data are numbers that are counted or measured.", key: v };
});
add("basic", "b-freq", "Frequency tables", () => {
  const ctx = pick(DISCRETE), data = shuffle(discreteData(ctx));
  const v = pick([...new Set(data)]), f = count(data, v);
  const askTotal = Math.random() < 0.25;
  return { prompt: `Data were recorded for some ${ctx.what} (${ctx.x.toLowerCase()}):<span class="dataList">${data.join(", ")}</span>${askTotal ? `How many ${ctx.what} are in the data?` : `What is the <b>frequency</b> of ${v}?`}`, mode: "num", value: askTotal ? data.length : f, why: askTotal ? `Count every value: ${data.length}.` : `${v} appears ${f} time${f === 1 ? "" : "s"} in the list. A tally helps you not miss any.` };
});
add("basic", "b-column", "Read a column graph", () => {
  const ctx = pick(CATS), cats = ctx.c.slice(0, ri(4, 5)), vals = cats.map(() => ri(2, 16));
  const k = pick(["one", "total", "diff", "most"]);
  const diagram = ST({ chartType: "column", title: ctx.t, xLabel: ctx.x, yLabel: ctx.y, categories: cats, values: vals, yStep: 2 });
  if (k === "one") { const i = ri(0, cats.length - 1); return { prompt: `How many chose <b>${cats[i]}</b>?`, diagram, mode: "num", value: vals[i], why: `Read across from the top of the ${cats[i]} column: ${vals[i]}.` }; }
  if (k === "total") return { prompt: `How many ${ctx.y.replace(/^Number of /, "")} were surveyed altogether?`, diagram, mode: "num", value: sum(vals), why: `Add the columns: ${vals.join(" + ")} = ${sum(vals)}.` };
  if (k === "diff") { const [i, j] = sample([...cats.keys()], 2); if (vals[i] === vals[j]) vals[j]++; const a = Math.max(i, j) === i ? i : j; return { prompt: `How many more chose <b>${cats[vals[i] > vals[j] ? i : j]}</b> than <b>${cats[vals[i] > vals[j] ? j : i]}</b>?`, diagram, mode: "num", value: Math.abs(vals[i] - vals[j]), why: `${Math.max(vals[i], vals[j])} − ${Math.min(vals[i], vals[j])} = ${Math.abs(vals[i] - vals[j])}.` }; }
  const m = Math.max(...vals); if (vals.filter(v => v === m).length > 1) { vals[vals.indexOf(m)]++; }
  const mi = vals.indexOf(Math.max(...vals));
  return { prompt: `Which was the most popular?`, diagram, mode: "mc", options: cats, correct: mi, keepOrder: true, why: `${cats[mi]} has the tallest column (${vals[mi]}).` };
});
add("basic", "b-dot-plot", "Read a dot plot", () => {
  const ctx = pick(DISCRETE), data = discreteData(ctx);
  const diagram = ST({ chartType: "dot-plot", data, min: ctx.min, max: ctx.max, xLabel: ctx.x });
  const k = pick(["eq", "ge", "n"]);
  if (k === "n") return { prompt: `How many ${ctx.what} are shown in the dot plot?`, diagram, mode: "num", value: data.length, why: `Each dot is one of the ${ctx.what}: ${data.length} dots.` };
  const v = ri(ctx.min + 1, ctx.max - 1);
  if (k === "eq") return { prompt: `How many ${ctx.what} had exactly ${v} ${ctx.noun}?`, diagram, mode: "num", value: count(data, v), why: `Count the dots above ${v}: ${count(data, v)}.` };
  const n = data.filter(d => d >= v).length;
  return { prompt: `How many ${ctx.what} had <b>${v} or more</b> ${ctx.noun}?`, diagram, mode: "num", value: n, why: `Count the dots above ${v} and everything to its right: ${n}.` };
});
add("basic", "b-pictogram", "Read a pictogram", () => {
  const ctx = pick(CATS), cats = ctx.c.slice(0, 4), per = pick([2, 4, 10]);
  const vals = cats.map(() => (ri(1, 7) + (Math.random() < 0.4 ? 0.5 : 0)) * per);
  const i = ri(0, 3), unit = ctx.y.replace("Number of ", "");
  const tot = Math.random() < 0.3;
  return { prompt: tot ? `How many ${unit} are shown altogether?` : `How many ${unit} chose <b>${cats[i]}</b>?`, diagram: ST({ chartType: "pictogram", categories: cats, values: vals, perSymbol: per, unit }), mode: "num", value: tot ? sum(vals) : vals[i],
    why: tot ? `Each symbol is ${per} (half a symbol is ${per / 2}). Total = ${vals.join(" + ")} = ${sum(vals)}.` : (() => { const w = Math.floor(vals[i] / per), h = vals[i] % per ? 1 : 0; return `Each symbol is ${per}. ${cats[i]} has ${w} whole symbol${w === 1 ? "" : "s"}${h ? ` and a half (${per / 2})` : ""}: ${w} × ${per}${h ? ` + ${per / 2}` : ""} = ${vals[i]}.`; })() };
});
add("basic", "b-line", "Read a line graph", () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const ctx = pick([{ y: "Rainfall (mm)", n: "the rainfall", s: 20, b: [40, 120] }, { y: "Temperature (°C)", n: "the temperature", s: 5, b: [10, 30] }, { y: "Water in tank (kL)", n: "the water in the tank", s: 5, b: [10, 40] }]);
  const vals = months.map(() => Math.round(ri(ctx.b[0], ctx.b[1]) / ctx.s) * ctx.s);
  const yMax = Math.ceil(Math.max(...vals) / ctx.s) * ctx.s + ctx.s;
  const diagram = ST({ chartType: "line", categories: months, values: vals, yLabel: ctx.y, yStep: ctx.s, yMax, yMin: 0 });
  if (Math.random() < 0.6) { const i = ri(0, 6); return { prompt: `What was ${ctx.n} in <b>${months[i]}</b>?`, diagram, mode: "num", value: vals[i], why: `Go up from ${months[i]} to the dot, then across: ${vals[i]}.` }; }
  let i; do { i = ri(0, 5); } while (vals[i + 1] === vals[i]);
  const opts = ["It increased", "It decreased", "It stayed the same"];
  return { prompt: `What happened to ${ctx.n} from <b>${months[i]}</b> to <b>${months[i + 1]}</b>?`, diagram, mode: "mc", options: opts, correct: vals[i + 1] > vals[i] ? 0 : 1, keepOrder: true, why: `It went from ${vals[i]} to ${vals[i + 1]}: the line goes ${vals[i + 1] > vals[i] ? "up" : "down"}.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-classify", "Classify a variable fully", () => {
  const [v, kind, why] = pick(VARS);
  const opts = ["Numerical — discrete", "Numerical — continuous", "Categorical — nominal", "Categorical — ordinal"];
  return { prompt: `Classify this variable.<span class="say">${v[0].toUpperCase() + v.slice(1)}</span>`, mode: "mc", options: opts, correct: opts.indexOf(kind), keepOrder: true, why: `${kind}. ${why}`, key: v };
});
add("expected", "e-census-sample", "Census, sample and bias", () => {
  const items = [
    ["A school wants to know the favourite canteen food of its 900 students. It asks the first 20 students in the canteen line.", "This sample could be biased", ["This is a census", "This is a fair random sample", "This sample could be biased", "This is secondary data"], "Students already in the canteen line are more likely to like the canteen food, so the sample is not representative."],
    ["A teacher records the height of every student in her class.", "This is a census", ["This is a census", "This is a sample", "This is secondary data", "This sample could be biased"], "Every member of the group (the class) is measured: that is a census."],
    ["A light-globe factory tests how long globes last by running them until they burn out.", "A sample should be used", ["A census should be used", "A sample should be used", "Either is just as good", "No data is needed"], "Testing destroys the globe, so testing every globe would leave none to sell."],
    ["A council chooses 200 residents at random from the electoral roll to ask about a new park.", "This is a random sample", ["This is a census", "This is a random sample", "This sample could be biased", "This is primary data from a census"], "200 people chosen at random from the whole population is a random sample."],
    ["Sam uses rainfall data from the Bureau of Meteorology website for a school project.", "This is secondary data", ["This is primary data", "This is secondary data", "This is a census", "This is a biased sample"], "Sam did not collect it himself: it is secondary data."],
    ["Mia surveys the students in her class by asking them questions herself.", "This is primary data", ["This is primary data", "This is secondary data", "This sample could be biased", "This is not data"], "Mia collected it herself: primary data."],
    ["To find the most popular sport in Australia, a survey is given only to people leaving a football match.", "This sample could be biased", ["This is a census", "This is a fair random sample", "This sample could be biased", "This is secondary data"], "People at a football match are more likely to choose football."]
  ];
  const [s, ans, opts, why] = pick(items);
  const o = shuffle(opts);
  return { prompt: `${s}<br>Which statement is correct?`, mode: "mc", options: o, correct: o.indexOf(ans), why, key: s };
});
add("expected", "e-stem-leaf", "Read a stem-and-leaf plot", () => {
  const ctx = pick([["Ages of people at a gym class", "people", "years"], ["Test marks", "students", "marks"], ["Push-ups completed", "students", "push-ups"], ["Minutes spent on homework", "students", "minutes"]]);
  const lo = ri(1, 3), n = ri(12, 18);
  const data = Array.from({ length: n }, () => ri(lo * 10, (lo + 3) * 10 + 9)).sort((a, b) => a - b);
  const rows = []; for (let s = Math.floor(data[0] / 10); s <= Math.floor(data[n - 1] / 10); s++) rows.push({ stem: s, leaves: data.filter(d => Math.floor(d / 10) === s).map(d => d % 10) });
  const key = `${rows[0].stem} | ${rows[0].leaves[0] ?? 3} = ${rows[0].stem}${rows[0].leaves[0] ?? 3}`;
  const diagram = ST({ chartType: "stem-leaf", rows, key });
  const k = pick(["min", "max", "n", "ge", "range"]);
  if (k === "min") return { prompt: `${ctx[0]} are shown. What is the <b>smallest</b> value?`, diagram, mode: "num", value: data[0], why: `First stem, first leaf: ${data[0]}.` };
  if (k === "max") return { prompt: `${ctx[0]} are shown. What is the <b>largest</b> value?`, diagram, mode: "num", value: data[n - 1], why: `Last stem, last leaf: ${data[n - 1]}.` };
  if (k === "n") return { prompt: `${ctx[0]} are shown. How many ${ctx[1]} are there?`, diagram, mode: "num", value: n, why: `Each leaf is one value: ${n} leaves.` };
  if (k === "range") return { prompt: `${ctx[0]} are shown. What is the <b>range</b>?`, diagram, mode: "num", value: data[n - 1] - data[0], why: `${data[n - 1]} − ${data[0]} = ${data[n - 1] - data[0]}.` };
  const v = (lo + ri(1, 2)) * 10; const c = data.filter(d => d >= v).length;
  return { prompt: `${ctx[0]} are shown. How many values are <b>${v} or more</b>?`, diagram, mode: "num", value: c, why: `Count every leaf from the ${v / 10} stem down: ${c}.` };
});
add("expected", "e-histogram", "Read a histogram", () => {
  const ctx = pick([["Long jump distance (cm)", 250, 25], ["Height (cm)", 140, 10], ["Time (seconds)", 10, 5], ["Mass (kg)", 40, 5]]);
  const nb = ri(4, 6), bins = Array.from({ length: nb }, (_, i) => ({ lo: ctx[1] + i * ctx[2], hi: ctx[1] + (i + 1) * ctx[2], count: ri(1, 10) }));
  const diagram = ST({ chartType: "histogram", bins, xLabel: ctx[0], yLabel: "Frequency", polygon: Math.random() < 0.3 });
  const k = pick(["total", "bin", "modal"]);
  if (k === "total") return { prompt: `How many results are shown in the histogram altogether?`, diagram, mode: "num", value: sum(bins.map(b => b.count)), why: `Add the column heights: ${bins.map(b => b.count).join(" + ")} = ${sum(bins.map(b => b.count))}.` };
  if (k === "bin") { const b = pick(bins); return { prompt: `How many results were from <b>${b.lo}</b> to less than <b>${b.hi}</b>?`, diagram, mode: "num", value: b.count, why: `The column for ${b.lo}–${b.hi} reaches ${b.count}.` }; }
  const m = Math.max(...bins.map(b => b.count)); if (bins.filter(b => b.count === m).length > 1) bins[bins.findIndex(b => b.count === m)].count++;
  const mi = bins.findIndex(b => b.count === Math.max(...bins.map(x => x.count)));
  const opts = bins.map(b => `${b.lo} – ${b.hi}`);
  return { prompt: `Which class interval has the highest frequency (the modal class)?`, diagram: ST({ chartType: "histogram", bins, xLabel: ctx[0], yLabel: "Frequency" }), mode: "mc", options: opts, correct: mi, keepOrder: true, why: `The tallest column is ${opts[mi]}.` };
});
add("expected", "e-sector", "Sector graphs", () => {
  const ctx = pick(CATS), cats = ctx.c.slice(0, ri(3, 4));
  const total = pick([20, 30, 36, 40, 60, 72, 90, 120]);
  let vals; do { const cuts = Array.from({ length: cats.length - 1 }, () => ri(1, total - 1)).sort((a, b) => a - b); vals = cuts.map((c, i) => c - (i ? cuts[i - 1] : 0)).concat(total - cuts[cuts.length - 1]); } while (vals.some(v => v < 2));
  const i = ri(0, cats.length - 1);
  if (Math.random() < 0.5) {
    return { prompt: `${total} students were surveyed: ${cats.map((c, j) => `${c} ${vals[j]}`).join(", ")}. What is the <b>sector angle</b> for ${cats[i]} in a sector graph?`, mode: "num", value: vals[i] / total * 360, unit: "°", why: `${vals[i]} out of ${total} of 360°: ${vals[i]}/${total} × 360 = ${fmt(vals[i] / total * 360)}°.` };
  }
  const N = total * pick([5, 10, 20]);
  return { prompt: `The sector graph shows the results of a survey of <b>${N}</b> people. How many chose <b>${cats[i]}</b>?`, diagram: ST({ chartType: "sector", categories: cats, values: vals, labelStyle: "angle" }, 1.0), mode: "num", value: N * vals[i] / total,
    why: `The ${cats[i]} sector is ${fmt(vals[i] / total * 360)}°, which is ${fmt(vals[i] / total * 360)}/360 of the circle. ${fmt(vals[i] / total * 360)}/360 × ${N} = ${fmt(N * vals[i] / total)}.` };
});
add("expected", "e-divided-bar", "Divided bar graphs", () => {
  const ctx = pick(CATS), cats = ctx.c.slice(0, 4);
  let p; do { p = [ri(1, 9), ri(1, 9), ri(1, 9)].map(v => v * 5); } while (sum(p) >= 95);
  p.push(100 - sum(p));
  const N = pick([200, 300, 400, 500, 600, 800, 1000]);
  const i = ri(0, 3);
  return { prompt: `The divided bar graph shows a survey of <b>${N}</b> people. How many chose <b>${cats[i]}</b>?`, diagram: ST({ chartType: "divided-bar", categories: cats, values: p, scale: true }, 1.0), mode: "num", value: N * p[i] / 100, why: `${cats[i]} is ${p[i]}% of the bar: ${p[i]}% of ${N} = ${fmt(N * p[i] / 100)}.` };
});
add("expected", "e-choose", "Choose an appropriate display", () => {
  const items = [
    ["the daily maximum temperature in Sydney over two weeks", "Line graph"], ["the way 30 students travel to school", "Column graph"],
    ["how a family's monthly budget is split between rent, food, transport and savings", "Sector graph"], ["the heights (in cm) of 60 Year 7 students", "Histogram"],
    ["the number of goals scored in each of 20 games", "Dot plot"], ["the test marks of a class, keeping every mark visible", "Stem-and-leaf plot"]
  ];
  const [s, a] = pick(items);
  const opts = shuffle([a, ...shuffle(["Line graph", "Column graph", "Sector graph", "Histogram", "Dot plot", "Stem-and-leaf plot"].filter(o => o !== a)).slice(0, 3)]);
  const why = { "Line graph": "A line graph shows how a quantity changes over time.", "Column graph": "Categories are best compared with a column graph.", "Sector graph": "A sector graph shows parts of a whole.", Histogram: "Continuous measurements are grouped into class intervals: a histogram.", "Dot plot": "A small set of whole-number values suits a dot plot.", "Stem-and-leaf plot": "A stem-and-leaf plot groups the data but keeps every value." }[a];
  return { prompt: `Which display is most appropriate for ${s}?`, mode: "mc", options: opts, correct: opts.indexOf(a), why, key: s };
});
add("expected", "e-misleading", "Misleading graphs", () => {
  const cats = pick([["Brand A", "Brand B", "Brand C"], ["2023", "2024", "2025"], ["Shop 1", "Shop 2", "Shop 3"]]);
  const base = ri(40, 80), vals = cats.map(() => base + ri(0, 6));
  if (new Set(vals).size < 2) vals[0] += 3;
  const yMin = Math.floor((base - 2) / 2) * 2;
  const opts = shuffle(["The vertical axis does not start at zero", "The columns are different colours", "There is no title on the graph", "The categories are in alphabetical order"]);
  return { prompt: `Why is this column graph <b>misleading</b>?`, diagram: ST({ chartType: "column", title: "Sales", xLabel: "", yLabel: "Sales", categories: cats, values: vals, yMin, yStep: 2, yMax: Math.max(...vals) + 2 }), mode: "mc", options: opts, correct: opts.indexOf("The vertical axis does not start at zero"), why: `The axis starts at ${yMin}, so small differences (${Math.min(...vals)} to ${Math.max(...vals)}) look huge.` };
});

defineBank({
  id: "data-visualisation", title: "Data Classification and Visualisation", outcome: "MA4-DAT-C-01",
  toolId: "data-visualisation-quiz", tool: "data-visualisation-student-quiz", mastery: "data-classification-visualisation",
  levels: {
    basic: { sub: "Categorical or numerical data, frequency tables, column graphs, dot plots, pictograms and line graphs." },
    expected: { sub: "Classify variables fully, census and samples, stem-and-leaf plots, histograms, sector and divided bar graphs, choosing displays, misleading graphs." }
  },
  related: [],
  types: T
}, T);
export default T;
