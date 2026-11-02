/* Data Analysis — MA4-DAT-C-02 — whole-topic quiz bank.
   Content statements: calculate and compare the mean, median, mode and range
   for simple datasets · interpret the effect individual data points have on
   measures of centre and range · analyse datasets presented in various ways
   and draw conclusions. */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const ST = (config, scale = 1.05, maxH = 330) => ({ engine: "statistics-engine", config, scale, maxH });
const sum = a => a.reduce((s, v) => s + v, 0);
const mean = a => sum(a) / a.length;
const sorted = a => a.slice().sort((x, y) => x - y);
const median = a => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const modes = a => { const f = {}; a.forEach(v => f[v] = (f[v] || 0) + 1); const m = Math.max(...Object.values(f)); return Object.keys(f).filter(k => f[k] === m).map(Number); };
const list = a => `<span class="dataList">${a.join(", ")}</span>`;
const CTX = [
  ["The numbers of minutes Leo spent reading each day", 5, 60], ["The points scored by a basketball team in each game", 30, 90], ["The numbers of emails Ruby received each day", 0, 40],
  ["The daily maximum temperatures (°C) for a week", 12, 34], ["The scores in a spelling test (out of 20)", 5, 20], ["The numbers of customers in a café each hour", 4, 30]
];
/* a list of n values whose mean is a whole number */
function wholeMeanData(n, lo, hi) { for (;;) { const a = Array.from({ length: n }, () => ri(lo, hi)); if (sum(a) % n === 0) return a; } }
function singleModeData(n, lo, hi) { for (;;) { const a = Array.from({ length: n - 2 }, () => ri(lo, hi)); const m = pick(a); a.push(m, m); const ms = modes(a); if (ms.length === 1) return shuffle(a); } }

/* ================================ BASIC ================================ */
add("basic", "b-mean", "Calculate the mean", () => {
  const [ctx, lo, hi] = pick(CTX), n = ri(4, 7), a = wholeMeanData(n, lo, hi);
  return { prompt: `${ctx} were:${list(a)}Calculate the <b>mean</b>.`, mode: "num", value: mean(a), why: `Add them (${sum(a)}) and divide by how many there are (${n}): ${sum(a)} ÷ ${n} = ${fmt(mean(a))}.` };
}, q => null);
add("basic", "b-median", "Find the median", () => {
  const [ctx, lo, hi] = pick(CTX), n = pick([5, 7, 9]), a = shuffle(Array.from({ length: n }, () => ri(lo, hi)));
  return { prompt: `${ctx} were:${list(a)}Find the <b>median</b>.`, mode: "num", value: median(a), why: `In order: ${sorted(a).join(", ")}. The middle value (number ${(n + 1) / 2}) is ${median(a)}.` };
});
add("basic", "b-mode", "Find the mode", () => {
  const [ctx, lo, hi] = pick(CTX), n = ri(7, 10), a = singleModeData(n, lo, hi);
  return { prompt: `${ctx} were:${list(a)}What is the <b>mode</b>?`, mode: "num", value: modes(a)[0], why: `${modes(a)[0]} appears most often (${a.filter(v => v === modes(a)[0]).length} times).` };
});
add("basic", "b-range", "Find the range", () => {
  const [ctx, lo, hi] = pick(CTX), n = ri(6, 9), a = shuffle(Array.from({ length: n }, () => ri(lo, hi)));
  const r = Math.max(...a) - Math.min(...a);
  return { prompt: `${ctx} were:${list(a)}Find the <b>range</b>.`, mode: "num", value: r, why: `Highest − lowest = ${Math.max(...a)} − ${Math.min(...a)} = ${r}.` };
});
const DOTCTX = [["Goals scored per game", 0, 6], ["Number of siblings", 0, 5], ["Number of people in a car", 1, 5], ["Books read last month", 0, 6]];
add("basic", "b-dot-stats", "Statistics from a dot plot", () => {
  const [x, mn, mx] = pick(DOTCTX);
  for (;;) {
    const n = pick([11, 13, 15]), peak = ri(mn + 1, mx - 1);
    const data = sorted(Array.from({ length: n }, () => Math.max(mn, Math.min(mx, peak + ri(-2, 2)))));
    const k = pick(["mode", "range", "median"]);
    const diagram = ST({ chartType: "dot-plot", data, min: mn, max: mx, xLabel: x });
    if (k === "mode") { const m = modes(data); if (m.length > 1) continue; return { prompt: `What is the <b>mode</b> of the data in the dot plot?`, diagram, mode: "num", value: m[0], why: `The tallest column of dots is at ${m[0]}.` }; }
    if (k === "range") return { prompt: `What is the <b>range</b> of the data in the dot plot?`, diagram, mode: "num", value: data[n - 1] - data[0], why: `${data[n - 1]} − ${data[0]} = ${data[n - 1] - data[0]}.` };
    return { prompt: `What is the <b>median</b> of the data in the dot plot?`, diagram, mode: "num", value: median(data), why: `There are ${n} dots, so the median is dot number ${(n + 1) / 2} counting from the left: ${median(data)}.` };
  }
});
add("basic", "b-mean-context", "Mean in context", () => {
  const n = ri(4, 6), a = wholeMeanData(n, 55, 98), name = pick(["Aisha", "Tom", "Zara", "Noah", "Ella"]);
  if (Math.random() < 0.5) return { prompt: `${name} scored ${a.slice(0, -1).join(", ")} and ${a[a.length - 1]} in ${n} maths tests. What was the mean score?`, mode: "num", value: mean(a), why: `${sum(a)} ÷ ${n} = ${mean(a)}.` };
  return { prompt: `${n} friends have a mean height of ${mean(a) + 90} cm. What is the total of their heights?`, mode: "num", value: (mean(a) + 90) * n, unit: "cm", why: `Total = mean × number = ${mean(a) + 90} × ${n} = ${(mean(a) + 90) * n} cm.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-median-even", "Median of an even number of values", () => {
  const [ctx, lo, hi] = pick(CTX), n = pick([6, 8, 10]), a = shuffle(Array.from({ length: n }, () => ri(lo, hi)));
  const s = sorted(a);
  return { prompt: `${ctx} were:${list(a)}Find the <b>median</b>.`, mode: "num", value: median(a), why: `In order: ${s.join(", ")}. The two middle values are ${s[n / 2 - 1]} and ${s[n / 2]}, so the median is (${s[n / 2 - 1]} + ${s[n / 2]}) ÷ 2 = ${fmt(median(a))}.` };
});
add("expected", "e-mean-dp", "Mean to 1 decimal place", () => {
  const [ctx, lo, hi] = pick(CTX);
  for (;;) { const n = ri(6, 9), a = Array.from({ length: n }, () => ri(lo, hi)); if (sum(a) % n === 0) continue; return { prompt: `${ctx} were:${list(a)}Calculate the <b>mean</b>, correct to 1 decimal place.`, mode: "num", value: mean(a), dp: 1, why: `${sum(a)} ÷ ${n} = ${fmt(mean(a), 3)}… ≈ ${round(mean(a), 1).toFixed(1)}.` }; }
});
add("expected", "e-freq-table", "Statistics from a frequency table", () => {
  const what = pick([["Number of siblings", "students"], ["Goals scored", "games"], ["Number of pets", "families"]]);
  for (;;) {
    const vals = [0, 1, 2, 3, 4, 5], f = vals.map(() => ri(0, 8));
    const N = sum(f); if (N < 10 || N > 30) continue;
    const data = vals.flatMap((v, i) => Array(f[i]).fill(v));
    const k = pick(["mean", "median", "mode"]);
    const tbl = `<table class="dtab"><tr><th>${what[0]}</th>${vals.map(v => `<td>${v}</td>`).join("")}</tr><tr><th>Frequency</th>${f.map(v => `<td>${v}</td>`).join("")}</tr></table>`;
    if (k === "mode") { const m = modes(data); if (m.length > 1) continue; return { prompt: `The table shows the ${what[0].toLowerCase()} for some ${what[1]}.${tbl}What is the <b>mode</b>?`, mode: "num", value: m[0], why: `The highest frequency is ${Math.max(...f)}, for ${m[0]}.` }; }
    if (k === "median") return { prompt: `The table shows the ${what[0].toLowerCase()} for some ${what[1]}.${tbl}What is the <b>median</b>?`, mode: "num", value: median(data), why: `There are ${N} values. The median is ${N % 2 ? `value number ${(N + 1) / 2}` : `halfway between values ${N / 2} and ${N / 2 + 1}`}: ${fmt(median(data))}.` };
    const tot = sum(vals.map((v, i) => v * f[i]));
    return { prompt: `The table shows the ${what[0].toLowerCase()} for some ${what[1]}.${tbl}Find the <b>mean</b>, correct to 1 decimal place.`, mode: "num", value: tot / N, dp: 1, why: `Total = ${vals.map((v, i) => `${v}×${f[i]}`).join(" + ")} = ${tot}. Mean = ${tot} ÷ ${N} ≈ ${round(tot / N, 1).toFixed(1)}.` };
  }
});
add("expected", "e-stem-stats", "Statistics from a stem-and-leaf plot", () => {
  const ctx = pick(["Ages of people at a gym class", "Test marks", "Minutes spent on homework"]);
  for (;;) {
    const lo = ri(1, 4), n = ri(10, 16);
    const data = sorted(Array.from({ length: n }, () => ri(lo * 10, (lo + 3) * 10 + 9)));
    const rows = []; for (let s = Math.floor(data[0] / 10); s <= Math.floor(data[n - 1] / 10); s++) rows.push({ stem: s, leaves: data.filter(d => Math.floor(d / 10) === s).map(d => d % 10) });
    const first = data[0];
    const diagram = ST({ chartType: "stem-leaf", rows, key: `${Math.floor(first / 10)} | ${first % 10} = ${first}` });
    const k = pick(["median", "mode", "range"]);
    if (k === "mode") { const m = modes(data); if (m.length > 1 || data.filter(v => v === m[0]).length < 2) continue; return { prompt: `${ctx} are shown in the stem-and-leaf plot. What is the <b>mode</b>?`, diagram, mode: "num", value: m[0], why: `${m[0]} appears ${data.filter(v => v === m[0]).length} times — more than any other value.` }; }
    if (k === "range") return { prompt: `${ctx} are shown in the stem-and-leaf plot. What is the <b>range</b>?`, diagram, mode: "num", value: data[n - 1] - data[0], why: `${data[n - 1]} − ${data[0]} = ${data[n - 1] - data[0]}.` };
    return { prompt: `${ctx} are shown in the stem-and-leaf plot. What is the <b>median</b>?`, diagram, mode: "num", value: median(data), why: `There are ${n} values. ${n % 2 ? `The middle one is number ${(n + 1) / 2}` : `The median is halfway between numbers ${n / 2} and ${n / 2 + 1}`}: ${fmt(median(data))}.` };
  }
});
add("expected", "e-missing", "Find a missing value from the mean", () => {
  const n = ri(4, 6), a = Array.from({ length: n }, () => ri(10, 40)), m = Math.ceil(mean(a)) + ri(0, 3);
  const miss = m * n - sum(a.slice(0, -1));
  if (miss <= 0 || miss > 99) return T.find(t => t.id === "e-missing").gen();
  return { prompt: `The mean of ${n} numbers is ${m}. ${n - 1} of the numbers are ${a.slice(0, -1).join(", ")}. What is the other number?`, mode: "num", value: miss, why: `The total must be ${m} × ${n} = ${m * n}. The others add to ${sum(a.slice(0, -1))}, so the missing number is ${m * n} − ${sum(a.slice(0, -1))} = ${miss}.` };
});
add("expected", "e-outlier", "Outliers and their effect", () => {
  const base = shuffle(Array.from({ length: ri(5, 7) }, () => ri(20, 40)));
  const out = pick([ri(85, 120), ri(1, 4)]); const data = shuffle(base.concat(out));
  const k = pick(["which", "affect", "newmean"]);
  if (k === "which") { const opts = shuffle([out, ...shuffle(base).slice(0, 3)].map(String)); if (new Set(opts).size < 4) return T.find(t => t.id === "e-outlier").gen(); return { prompt: `Which value is an <b>outlier</b> in this data?${list(data)}`, mode: "mc", options: opts, correct: opts.indexOf(String(out)), why: `${out} is far away from all the other values.` }; }
  if (k === "affect") { const opts = ["The mean", "The median", "Neither"]; return { prompt: `${list(data)}The outlier ${out} is removed. Which measure changes more?`, mode: "mc", options: opts, correct: 0, keepOrder: true, why: `Mean: ${fmt(mean(data), 1)} → ${fmt(mean(base), 1)}. Median: ${fmt(median(data))} → ${fmt(median(base))}. One extreme value pulls the mean much more than the median.` }; }
  return { prompt: `${list(data)}Find the mean <b>without</b> the outlier, correct to 1 decimal place.`, mode: "num", value: mean(base), dp: 1, why: `Remove ${out}: ${sum(base)} ÷ ${base.length} ≈ ${round(mean(base), 1).toFixed(1)}.` };
});
add("expected", "e-effect", "The effect of changing the data", () => {
  const n = ri(4, 6), a = wholeMeanData(n, 5, 30), m = mean(a), k = pick(["add", "mult", "remove", "range"]);
  if (k === "add") { const c = ri(2, 10); return { prompt: `The mean of${list(a)}is ${m}. Every value is increased by ${c}. What is the new mean?`, mode: "num", value: m + c, why: `Adding ${c} to every value adds ${c} to the mean: ${m} + ${c} = ${m + c}.` }; }
  if (k === "mult") { const c = pick([2, 3, 10]); return { prompt: `The mean of${list(a)}is ${m}. Every value is multiplied by ${c}. What is the new mean?`, mode: "num", value: m * c, why: `Multiplying every value by ${c} multiplies the mean by ${c}: ${m * c}.` }; }
  if (k === "range") { const c = ri(2, 10); const r = Math.max(...a) - Math.min(...a); return { prompt: `The range of${list(a)}is ${r}. Every value is increased by ${c}. What is the new range?`, mode: "num", value: r, why: `Adding the same amount to every value moves them all together, so the range stays ${r}.` }; }
  const i = ri(0, n - 1), b = a.filter((_, j) => j !== i);
  return { prompt: `The mean of${list(a)}is ${m}. The value ${a[i]} is removed. What is the new mean, correct to 1 decimal place?`, mode: "num", value: mean(b), dp: 1, why: `New total ${sum(b)}, ${b.length} values: ${sum(b)} ÷ ${b.length} ≈ ${round(mean(b), 1).toFixed(1)}.` };
});
add("expected", "e-shape", "Describe the shape of a distribution", () => {
  const shapes = { Symmetric: [1, 2, 4, 6, 4, 2, 1], "Positively skewed": [3, 7, 6, 4, 2, 1, 1], "Negatively skewed": [1, 1, 2, 4, 6, 7, 3] };
  const name = pick(Object.keys(shapes)); const f = shapes[name].map(v => Math.max(0, v + pick([0, 0, 0, 1, -1]) * (v > 2 ? 1 : 0)));
  const data = f.flatMap((c, i) => Array(c).fill(i));
  const opts = ["Symmetric", "Positively skewed", "Negatively skewed"];
  return { prompt: `Describe the shape of the distribution in the dot plot.`, diagram: ST({ chartType: "dot-plot", data, min: 0, max: 6, xLabel: "Score" }), mode: "mc", options: opts, correct: opts.indexOf(name), keepOrder: true,
    why: name === "Symmetric" ? "The two sides are a mirror image of each other about the middle." : name === "Positively skewed" ? "The data bunch up on the left and the tail stretches out to the right (towards the larger values)." : "The data bunch up on the right and the tail stretches out to the left." };
});
add("expected", "e-compare", "Compare two sets of data", () => {
  const n = 5, A = wholeMeanData(n, 10, 30), B = wholeMeanData(n, 12, 34);
  if (mean(A) === mean(B)) return T.find(t => t.id === "e-compare").gen();
  const [a, b] = pick([["Class A", "Class B"], ["Team Red", "Team Blue"]]);
  return { prompt: `Scores for two groups:<br><b>${a}:</b>${list(A)}<b>${b}:</b>${list(B)}How much higher is the mean of the group with the higher mean?`, mode: "num", value: Math.abs(mean(A) - mean(B)), why: `${a}: ${sum(A)} ÷ 5 = ${mean(A)}. ${b}: ${sum(B)} ÷ 5 = ${mean(B)}. Difference = ${Math.abs(mean(A) - mean(B))}.` };
});
add("expected", "e-choose-measure", "Choose a measure of centre", () => {
  const items = [
    ["house prices in a street where one mansion costs far more than the others", "Median", "An outlier pulls the mean, but not the median."],
    ["the most popular shoe size sold in a shop", "Mode", "A shop wants the size that is sold most often."],
    ["the typical test mark of a class where the marks are spread evenly with no outliers", "Mean", "With no outliers, the mean uses every value."],
    ["the favourite colour of students in a class", "Mode", "Colour is categorical, so only the mode makes sense."],
    ["the typical income in a town where a few people earn a great deal", "Median", "A few very high incomes would pull the mean up."],
    ["the most common number of people living in a house, from a survey of a street", "Mode", "The question asks for the most common value."],
    ["the average number of points a basketball player scores per game, with no unusual games", "Mean", "The scores are similar with no outliers, so the mean uses all of them."],
    ["the typical time to finish a fun run, when one walker took four times as long as everyone else", "Median", "The one very slow time is an outlier; the median is not affected by it."]
  ];
  const [s, a, why] = pick(items);
  const opts = ["Mean", "Median", "Mode"];
  return { prompt: `Which measure of centre is most suitable for ${s}?`, mode: "mc", options: opts, correct: opts.indexOf(a), keepOrder: true, why, key: s };
});

MMTQ.run({
  id: "data-analysis", title: "Data Analysis", outcome: "MA4-DAT-C-02",
  toolId: "data-analysis-quiz", tool: "data-analysis-student-quiz", mastery: "data-analysis",
  levels: {
    basic: { sub: "Mean, median, mode and range of a small data set, from a list or a dot plot, and the mean in context." },
    expected: { sub: "Frequency tables, stem-and-leaf plots, missing values, outliers, the effect of changes, the shape of a distribution and comparing data." }
  },
  related: [],
  types: T
});
