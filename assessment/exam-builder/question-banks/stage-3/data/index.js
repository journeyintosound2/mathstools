/*
  Mills Maths Tools — Stage 3 Question Bank: Data
  -------------------------------------------------
  question-banks/stage-3/data/index.js

  NSW Mathematics K–10 (2022), Stage 3, focus areas "Data A" and "Data B",
  merged into one topic. Outcomes:

    MA3-DATA-01  constructs graphs using many-to-one scales
    MA3-DATA-02  interprets data displays, including timelines and line graphs

  Content (docs/stage-3-syllabus-reference.md):
    A  collect categorical and discrete numerical data by observation or
       survey; choose and use appropriate tables and graphs (column graphs
       and pictograms with many-to-one scales, dot plots, side-by-side column
       graphs, line graphs); describe and interpret datasets in context
    B  interpret and compare a range of data displays, including two-way
       tables and timelines; interpret data presented in digital media and
       elsewhere (including misleading displays)

  Every question but the vocabulary ones reads or builds a display, drawn by
  engines/statistics/statistics-engine.js (column, grouped-column, dot-plot,
  line, pictogram) or engines/measure/measure-engine.js (time lines). The
  display is drawn from the same numbers the answer uses.

  Stage boundary: no mean/median/range calculations, no stem-and-leaf plots,
  histograms or sector graphs (Stage 4). "Most common" and "how many more"
  are the Stage 3 summaries.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, fmt, spaced, plural
} from "../../_shared/bank-helpers.js";
import { CATEGORICAL_CONTEXTS, DISCRETE_CONTEXTS, discreteData, frequencyFromData, listText } from "../../_shared/data-helpers.js";

const TOPIC = "Data";

const TYPE_LIST = [
  { id: "data-types", label: "Categorical or numerical data" },
  { id: "survey-questions", label: "Good survey questions" },
  { id: "choose-display", label: "Choose a suitable display" },
  { id: "many-to-one-scale", label: "Read a column graph with a many-to-one scale" },
  { id: "pictogram-key", label: "Pictograms with a key" },
  { id: "choose-scale", label: "Choose a scale for a graph" },
  { id: "construct-column", label: "Construct a column graph" },
  { id: "dot-plot-read", label: "Read a dot plot" },
  { id: "construct-dot-plot", label: "Construct a dot plot" },
  { id: "side-by-side", label: "Side-by-side column graphs" },
  { id: "line-graph-read", label: "Read a line graph" },
  { id: "line-graph-trend", label: "Describe change on a line graph" },
  { id: "two-way-table", label: "Two-way tables" },
  { id: "timeline-read", label: "Read a time line" },
  { id: "misleading-graph", label: "Misleading graphs in the media" },
  { id: "multi-part-data", label: "Multi-part data problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage3", ...(spec.tags || [])] });
const stats = config => ({ engine: "statistics-engine", config });

/* Category counts with a scale step, all distinct, many on half-steps so a
   many-to-one scale has to be read between gridlines. */
function scaledCategorical(stepChoices = [2, 5, 10]) {
  const ctx = choice(CATEGORICAL_CONTEXTS);
  const step = choice(stepChoices);
  const k = Math.min(ctx.cats.length, choice([4, 5]));
  const cats = ctx.cats.slice(0, k);
  // step 2: any whole number (odd values sit halfway between gridlines);
  // step 10: multiples of 5 (halfway again); step 5: multiples of 5.
  const unit = step === 2 ? 1 : 5;
  let values;
  do {
    values = cats.map(() => randInt(1, (step * 10) / unit) * unit);
  } while (new Set(values).size < values.length || Math.max(...values) < step * 4);
  return { ...ctx, cats, values, step };
}

/* ── vocabulary ──────────────────────────────────────────── */

const DATA_ITEMS = [
  { t: "favourite colour", c: "Categorical" }, { t: "number of siblings", c: "Numerical" },
  { t: "type of pet", c: "Categorical" }, { t: "number of goals scored in a game", c: "Numerical" },
  { t: "usual way of getting to school", c: "Categorical" }, { t: "number of books read in a term", c: "Numerical" },
  { t: "favourite sport", c: "Categorical" }, { t: "number of letters in a student's first name", c: "Numerical" },
  { t: "month of birth", c: "Categorical" }, { t: "number of cars in a family", c: "Numerical" },
  { t: "eye colour", c: "Categorical" }, { t: "number of people at a birthday party", c: "Numerical" }
];

function dataTypesQuestion() {
  const it = choice(DATA_ITEMS);
  return q({
    type: "data-types", marks: 1,
    prompt: `A class collects data about each student's ${it.t}. Is this categorical data or numerical data?`,
    answer: it.c,
    working: [it.c === "Categorical" ? "The answers are names of groups (categories), not numbers." : "The answers are numbers found by counting."],
    space: SPACE_SIZES.SMALL,
    mcEligible: false,
    tags: ["data", "types of data"]
  });
}

const SURVEY = [
  { goal: "find out the favourite fruit of students in the class",
    good: "Which fruit do you like best: apple, banana, orange, grape or other?",
    bad: ["Do you like fruit?", "Don't you agree that apples are the best fruit?", "What do you eat?"] },
  { goal: "find out how students travel to school",
    good: "How do you usually travel to school: walk, bike, bus, car or other?",
    bad: ["Do you like school?", "You come by car, don't you?", "How far is school?"] },
  { goal: "find out how many pets each student has",
    good: "How many pets live at your home?",
    bad: ["Do you like pets?", "Isn't a dog the best pet?", "What colour is your pet?"] },
  { goal: "find out which sport students would most like to play at sport time",
    good: "Which sport would you most like to play at sport time: soccer, netball, cricket or basketball?",
    bad: ["Is sport fun?", "Everyone loves soccer, don't they?", "How tall are you?"] }
];

function surveyQuestionsQuestion() {
  const s = choice(SURVEY);
  if (Math.random() < 0.6) {
    return q({
      type: "survey-questions", marks: 1,
      prompt: `Mia wants to ${s.goal}. Which survey question should she ask?`,
      answer: s.good,
      working: ["A good survey question gives everyone the same clear choices and does not push them towards an answer."],
      space: SPACE_SIZES.SMALL,
      mcDistractors: s.bad,
      tags: ["data", "surveys"]
    });
  }
  const bad = s.bad[1];
  return q({
    type: "survey-questions", marks: 2,
    prompt: `To ${s.goal}, Tom asks: "${bad}" Explain why this is not a good survey question, and write a better one.`,
    answer: `It pushes people towards one answer (it is biased). A better question: "${s.good}"`,
    working: ["The question suggests the answer Tom wants.", `Better: "${s.good}"`],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["data", "surveys"]
  });
}

const DISPLAY_CHOICES = [
  { situation: "the temperature in a classroom every hour during a school day", best: "Line graph", why: "It shows how one quantity changes over time." },
  { situation: "the favourite ice-cream flavours of a class", best: "Column graph", why: "The data are categories, each with a count." },
  { situation: "the number of siblings of each student in a class of 25", best: "Dot plot", why: "It is a small set of numerical data; one dot per student." },
  { situation: "the height of a sunflower measured each week", best: "Line graph", why: "It shows change over time." },
  { situation: "the favourite sport of Year 5 compared with Year 6", best: "Side-by-side column graph", why: "It compares the same categories for two groups." },
  { situation: "the number of goals scored in each of 20 games", best: "Dot plot", why: "Small numerical data set: a dot for each game." },
  { situation: "the number of cars, buses and bikes passing the school", best: "Column graph", why: "Categories with counts." }
];

function chooseDisplayQuestion() {
  const d = choice(DISPLAY_CHOICES);
  return q({
    type: "choose-display", marks: 1,
    prompt: `Which type of graph is best for showing ${d.situation}?`,
    answer: d.best,
    working: [d.why],
    space: SPACE_SIZES.SMALL,
    mcDistractors: ["Line graph", "Column graph", "Dot plot", "Side-by-side column graph", "Pictogram"].filter(x => x !== d.best),
    tags: ["data", "choosing displays"]
  });
}

/* ── column graphs and pictograms ───────────────────────── */

function manyToOneScaleQuestion() {
  const d = scaledCategorical([2, 5, 10]);
  const v = choice(["read", "more", "total"]);
  const i = randInt(0, d.cats.length - 1);
  let j = randInt(0, d.cats.length - 1);
  while (j === i) j = randInt(0, d.cats.length - 1);
  const diagram = stats({ chartType: "column", categories: d.cats, values: d.values, yStep: d.step, yLabel: `Number of ${d.unit}`, xLabel: d.xLabel, title: d.title });
  const oneStep = `Each gridline is ${d.step} ${d.unit}${d.step > 2 ? `, so a column halfway between gridlines is ${d.step / 2} more` : ""}.`;
  if (v === "read") {
    return q({
      type: "many-to-one-scale", marks: 1,
      prompt: `How many ${d.unit} chose ${d.cats[i].toLowerCase()}?`,
      diagram,
      answer: `${d.values[i]}`,
      working: [oneStep, `The ${d.cats[i]} column reaches ${d.values[i]}.`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.values[i] + d.step, d.values[i] - d.step / (d.step === 2 ? 1 : 2), d.values[i] / d.step, d.values[i] + d.step / 2].map(x => String(x)),
      tags: ["data", "column graph", "scale"]
    });
  }
  if (v === "more") {
    const [a, b] = d.values[i] > d.values[j] ? [i, j] : [j, i];
    return q({
      type: "many-to-one-scale", marks: 2,
      prompt: `How many more ${d.unit} chose ${d.cats[a].toLowerCase()} than ${d.cats[b].toLowerCase()}?`,
      diagram,
      answer: `${d.values[a] - d.values[b]}`,
      working: [oneStep, `${d.cats[a]}: ${d.values[a]}; ${d.cats[b]}: ${d.values[b]}`, `${d.values[a]} − ${d.values[b]} = ${d.values[a] - d.values[b]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.values[a] + d.values[b], (d.values[a] - d.values[b]) / d.step, d.values[a] - d.values[b] + d.step].map(String),
      tags: ["data", "column graph", "scale"]
    });
  }
  const total = d.values.reduce((s, x) => s + x, 0);
  return q({
    type: "many-to-one-scale", marks: 2,
    prompt: `How many ${d.unit} were surveyed altogether?`,
    diagram,
    answer: `${total}`,
    working: [oneStep, `${d.values.join(" + ")} = ${total}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [total / d.step, total + d.step, total - d.step, d.values.length * d.step * 2].map(String),
    tags: ["data", "column graph", "scale"]
  });
}

function pictogramKeyQuestion() {
  const ctx = choice(CATEGORICAL_CONTEXTS);
  const per = choice([2, 4, 5, 10]);
  const k = Math.min(4, ctx.cats.length);
  const cats = ctx.cats.slice(0, k);
  let values;
  do {
    values = cats.map(() => randInt(1, 7) * per + (per % 2 === 0 && Math.random() < 0.4 ? per / 2 : 0));
  } while (new Set(values).size < values.length);
  const i = randInt(0, k - 1);
  const v = choice(["read", "symbols"]);
  const diagram = stats({ chartType: "pictogram", categories: cats, values, perSymbol: per, unit: ctx.unit, title: ctx.title });
  if (v === "read" || per % 2 !== 0) {
    return q({
      type: "pictogram-key", marks: 1,
      prompt: `Use the key. How many ${ctx.unit} are shown for ${cats[i].toLowerCase()}?`,
      diagram,
      answer: `${values[i]}`,
      working: [`Each whole symbol = ${per} ${ctx.unit}${per % 2 === 0 ? `, half a symbol = ${per / 2}` : ""}.`, `${cats[i]}: ${Math.floor(values[i] / per)} whole${values[i] % per ? " and a half" : ""} → ${values[i]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [Math.ceil(values[i] / per), values[i] + per, values[i] - per / 2, Math.floor(values[i] / per) * per + 1].map(String),
      tags: ["data", "pictogram"]
    });
  }
  const n = randInt(2, 9) * per + per / 2;
  return q({
    type: "pictogram-key", marks: 1,
    prompt: `In this pictogram each whole symbol stands for ${per} ${ctx.unit}. How many symbols would be drawn to show ${n} ${ctx.unit}?`,
    diagram,
    answer: `${Math.floor(n / per)}½ symbols`,
    working: [`${n} ÷ ${per} = ${Math.floor(n / per)} remainder ${per / 2}`, `${Math.floor(n / per)} whole symbols and half a symbol`],
    space: SPACE_SIZES.SMALL,
    mcEligible: false,
    tags: ["data", "pictogram"]
  });
}

function chooseScaleQuestion() {
  const ideal = choice([2, 5, 10, 20, 50]);
  const ctx = choice(CATEGORICAL_CONTEXTS);
  const cats = ctx.cats.slice(0, 4);
  let values;
  do { values = cats.map(() => randInt(2, 10 * ideal)); } while (new Set(values).size < 4 || Math.max(...values) <= 5 * ideal);
  const max = Math.max(...values);
  const lines = Math.ceil(max / ideal);
  return q({
    type: "choose-scale", marks: 1,
    prompt: `A column graph of this data needs a scale on the vertical axis with about 5 to 10 gridlines. Which scale is best?`,
    table: { headerRow: true, caption: ctx.title, rows: [[ctx.xLabel, ...cats], [`Number of ${ctx.unit}`, ...values.map(String)]] },
    answer: `Going up in ${ideal}s`,
    working: [`The largest value is ${max}.`, `Going up in ${ideal}s needs ${lines} gridlines to reach ${lines * ideal}: that fits.`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [...new Set([ideal === 2 ? "Going up in 100s" : "Going up in 1s", `Going up in ${ideal * 10}s`, `Going up in ${ideal * 100}s`, ideal >= 10 ? `Going up in ${ideal / 10}s` : "Going up in 1 000s"])],
    tags: ["data", "scale"]
  });
}

function constructColumnQuestion() {
  const d = scaledCategorical([2, 5, 10]);
  return q({
    type: "construct-column", marks: 3,
    prompt: `Draw a column graph of the data on the axes below. The scale goes up in ${d.step}s.`,
    table: { headerRow: true, caption: d.title, rows: [[d.xLabel, ...d.cats], [`Number of ${d.unit}`, ...d.values.map(String)]] },
    diagram: stats({ chartType: "column", categories: d.cats, values: d.values, yStep: d.step, yMax: Math.ceil(Math.max(...d.values) / d.step) * d.step, blank: true, yLabel: `Number of ${d.unit}`, xLabel: d.xLabel, title: d.title }),
    answer: `Columns of heights ${d.cats.map((c, i) => `${c} ${d.values[i]}`).join(", ")}`,
    working: [`Each gridline is ${d.step}; values ending in ${d.step / 2 === 1 ? "odd numbers" : d.step / 2} sit halfway between gridlines.`, "Columns should be the same width with equal gaps."],
    space: "none",
    mcEligible: false,
    tags: ["data", "column graph", "construct"]
  });
}

/* ── dot plots ───────────────────────────────────────────── */

function dotPlotReadQuestion() {
  const { ctx, data } = discreteData({ n: randInt(12, 20), ctx: choice(DISCRETE_CONTEXTS) });
  const freq = frequencyFromData(data, ctx.lo, ctx.hi);
  const top = Math.max(...freq.map(r => r.freq));
  const modesList = freq.filter(r => r.freq === top).map(r => r.value);
  const v = choice(modesList.length === 1 ? ["most", "count", "more-than", "fewest"] : ["count", "more-than"]);
  const diagram = stats({ chartType: "dot-plot", data, min: ctx.lo, max: ctx.hi, xLabel: ctx.name[0].toUpperCase() + ctx.name.slice(1) });
  if (v === "most") {
    return q({
      type: "dot-plot-read", marks: 1,
      prompt: `The dot plot shows the ${ctx.name} for some ${ctx.unit}. Which value is the most common?`,
      diagram, answer: String(modesList[0]),
      working: [`The tallest column of dots is at ${modesList[0]} (${top} dots).`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: freq.filter(r => r.value !== modesList[0]).map(r => String(r.value)).concat([String(top)]),
      tags: ["data", "dot plot"]
    });
  }
  if (v === "fewest") {
    const low = freq.filter(r => r.freq > 0).sort((a, b) => a.freq - b.freq)[0];
    const count = data.length;
    return q({
      type: "dot-plot-read", marks: 1,
      prompt: `The dot plot shows the ${ctx.name} for some ${ctx.unit}. How many ${ctx.unit} are shown altogether?`,
      diagram, answer: String(count),
      working: ["Count every dot.", `${freq.filter(r => r.freq).map(r => r.freq).join(" + ")} = ${count}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [count + 1, count - 1, ctx.hi - ctx.lo + 1, low.freq + count].map(String),
      tags: ["data", "dot plot"]
    });
  }
  if (v === "count") {
    const val = choice(freq.filter(r => r.freq > 0)).value;
    const f = freq.find(r => r.value === val).freq;
    return q({
      type: "dot-plot-read", marks: 1,
      prompt: `The dot plot shows the ${ctx.name} for some ${ctx.unit}. How many ${ctx.unit} had a value of ${val}?`,
      diagram, answer: String(f),
      working: [`Count the dots above ${val}: ${f}.`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [f + 1, Math.max(0, f - 1), val, f + 2].map(String),
      tags: ["data", "dot plot"]
    });
  }
  const cut = randInt(ctx.lo + 1, ctx.hi - 1);
  const n = data.filter(x => x > cut).length;
  return q({
    type: "dot-plot-read", marks: 1,
    prompt: `The dot plot shows the ${ctx.name} for some ${ctx.unit}. How many ${ctx.unit} had a value greater than ${cut}?`,
    diagram, answer: String(n),
    working: [`Count the dots to the right of ${cut} (not including ${cut}).`, `${freq.filter(r => r.value > cut).map(r => r.freq).join(" + ")} = ${n}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [data.filter(x => x >= cut).length, data.filter(x => x < cut).length, n + 1].map(String),
    tags: ["data", "dot plot"]
  });
}

function constructDotPlotQuestion() {
  const { ctx, data } = discreteData({ n: randInt(10, 15), ctx: choice(DISCRETE_CONTEXTS) });
  const freq = frequencyFromData(data, ctx.lo, ctx.hi);
  return q({
    type: "construct-dot-plot", marks: 2,
    prompt: `Draw a dot plot of the ${ctx.name} for these ${data.length} ${ctx.unit}: ${listText(shuffle(data))}`,
    diagram: stats({ chartType: "dot-plot", data, min: ctx.lo, max: ctx.hi, blank: true, xLabel: ctx.name[0].toUpperCase() + ctx.name.slice(1) }),
    answer: `Dots: ${freq.map(r => `${r.value} → ${r.freq}`).join(", ")}`,
    working: ["Put one dot above the number line for each value.", ...freq.map(r => `${r.value}: ${r.freq} ${plural(r.freq, "dot")}`)],
    space: "none",
    mcEligible: false,
    tags: ["data", "dot plot", "construct"]
  });
}

/* ── side-by-side column graphs ──────────────────────────── */

function sideBySideQuestion() {
  const ctx = choice(CATEGORICAL_CONTEXTS.filter(c => /^Favourite/.test(c.title)));
  const cats = ctx.cats.slice(0, 4);
  const groups = choice([["Year 5", "Year 6"], ["Boys", "Girls"], ["Term 1", "Term 3"], ["Class 5K", "Class 5M"]]);
  let a; let b;
  do {
    a = cats.map(() => randInt(1, 12));
    b = cats.map(() => randInt(1, 12));
  } while (new Set(a).size < 4 || new Set(b).size < 4 || a.some((x, i) => x === b[i]));
  const diagram = stats({ chartType: "grouped-column", categories: cats, series: [{ name: groups[0], values: a }, { name: groups[1], values: b }], yStep: 2, yLabel: `Number of ${ctx.unit}`, xLabel: ctx.xLabel, title: ctx.title });
  const v = choice(["read", "compare", "diff", "total"]);
  const i = randInt(0, 3);
  if (v === "read") {
    return q({
      type: "side-by-side", marks: 1,
      prompt: `How many ${groups[1]} ${ctx.unit === "students" ? "students" : ctx.unit} chose ${cats[i].toLowerCase()}?`.replace("Boys students", "boys").replace("Girls students", "girls"),
      diagram, answer: String(b[i]),
      working: [`Use the key: ${groups[1]} is the second column in each pair.`, `${cats[i]}: ${b[i]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [a[i], b[i] + 1, a[i] + b[i]].map(String),
      tags: ["data", "side-by-side column graph"]
    });
  }
  if (v === "compare") {
    const more = cats.filter((_, k) => a[k] > b[k]);
    return q({
      type: "side-by-side", marks: 2,
      prompt: `Which ${ctx.xLabel.toLowerCase()}s were chosen by more ${groups[0]} students than ${groups[1]} students?`.replace(/(Boys|Girls) students/g, m => m.split(" ")[0].toLowerCase()),
      diagram, answer: more.length ? more.join(", ") : "None",
      working: cats.map((c, k) => `${c}: ${groups[0]} ${a[k]}, ${groups[1]} ${b[k]}${a[k] > b[k] ? " ✓" : ""}`),
      space: SPACE_SIZES.SMALL,
      mcEligible: false,
      tags: ["data", "side-by-side column graph"]
    });
  }
  if (v === "diff") {
    const d = Math.abs(a[i] - b[i]);
    const [hi, lo] = a[i] > b[i] ? groups : [groups[1], groups[0]];
    return q({
      type: "side-by-side", marks: 1,
      prompt: `How many more ${hi} students than ${lo} students chose ${cats[i].toLowerCase()}?`.replace(/(Boys|Girls) students/g, m => m.split(" ")[0].toLowerCase()),
      diagram, answer: String(d),
      working: [`${hi}: ${Math.max(a[i], b[i])}; ${lo}: ${Math.min(a[i], b[i])}`, `${Math.max(a[i], b[i])} − ${Math.min(a[i], b[i])} = ${d}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [a[i] + b[i], d + 1, Math.max(a[i], b[i])].map(String),
      tags: ["data", "side-by-side column graph"]
    });
  }
  const g = choice([0, 1]);
  const vals = g === 0 ? a : b;
  const t = vals.reduce((s, x) => s + x, 0);
  return q({
    type: "side-by-side", marks: 2,
    prompt: `How many ${groups[g]} ${ctx.unit} were surveyed altogether?`.replace(/Boys students|Girls students/g, m => m.split(" ")[0].toLowerCase()),
    diagram, answer: String(t),
    working: [`${groups[g]}: ${vals.join(" + ")} = ${t}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [(g === 0 ? b : a).reduce((s, x) => s + x, 0), t + a.reduce((s, x) => s + x, 0) * (g === 1 ? 1 : 0) + b.reduce((s, x) => s + x, 0) * (g === 0 ? 1 : 0), t - 2].map(String),
    tags: ["data", "side-by-side column graph"]
  });
}

/* ── line graphs ─────────────────────────────────────────── */

const LINE_CONTEXTS = [
  { title: "Temperature in the playground", cats: ["9 am", "10 am", "11 am", "12 pm", "1 pm", "2 pm", "3 pm"], yLabel: "Temperature (°C)", unit: "°C", lo: 12, step: 2, shape: "hump" },
  { title: "Height of a bean plant", cats: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"], yLabel: "Height (cm)", unit: "cm", lo: 0, step: 5, shape: "up" },
  { title: "Water in a tank", cats: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], yLabel: "Water (L)", unit: "L", lo: 0, step: 50, shape: "down" },
  { title: "Visitors to a park", cats: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], yLabel: "Visitors", unit: "visitors", lo: 0, step: 100, shape: "down" }
];

function lineData() {
  const c = choice(LINE_CONTEXTS);
  const n = c.cats.length;
  for (;;) {
    let v;
    if (c.shape === "hump") { const peak = randInt(2, n - 2); v = c.cats.map((_, i) => c.lo + c.step * (6 - Math.abs(i - peak) * randInt(1, 2))); }
    else if (c.shape === "up") { let x = randInt(1, 2); v = c.cats.map(() => { x += randInt(0, 3); return c.lo + c.step * x; }); }
    else { let x = randInt(8, 10); v = c.cats.map(() => { x -= randInt(0, 2); return c.lo + c.step * Math.max(1, x); }); }
    if (new Set(v).size >= 4 && v.every(x => x >= 0)) return { ...c, values: v };
  }
}

function lineGraphReadQuestion() {
  const d = lineData();
  const diagram = stats({ chartType: "line", categories: d.cats, values: d.values, yStep: d.step, yLabel: d.yLabel, title: d.title, yMin: d.lo > 0 ? d.lo - 2 * d.step : undefined });
  const v = choice(["value", "highest", "change"]);
  const i = randInt(0, d.cats.length - 1);
  if (v === "value") {
    return q({
      type: "line-graph-read", marks: 1,
      prompt: `What was the reading at ${d.cats[i]}?`,
      diagram, answer: `${fmt(d.values[i])} ${d.unit}`,
      working: [`Go up from ${d.cats[i]} to the line, then across to the scale: ${d.values[i]} ${d.unit}.`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.values[i] + d.step, d.values[i] - d.step, d.values[(i + 1) % d.values.length]].map(x => `${x} ${d.unit}`),
      tags: ["data", "line graph"]
    });
  }
  if (v === "highest") {
    const max = Math.max(...d.values);
    const at = d.cats.filter((_, k) => d.values[k] === max);
    return q({
      type: "line-graph-read", marks: 1,
      prompt: "When was the reading highest?",
      diagram, answer: at.join(" and "),
      working: [`The highest point is ${max} ${d.unit}, at ${at.join(" and ")}.`],
      space: SPACE_SIZES.SMALL,
      mcEligible: at.length === 1,
      mcDistractors: d.cats.filter(c => !at.includes(c)),
      tags: ["data", "line graph"]
    });
  }
  let a = randInt(0, d.cats.length - 2);
  let b = randInt(a + 1, d.cats.length - 1);
  if (d.values[a] === d.values[b]) { a = 0; b = d.cats.length - 1; }
  if (d.values[a] === d.values[b]) return lineGraphReadQuestion();
  const ch = d.values[b] - d.values[a];
  return q({
    type: "line-graph-read", marks: 2,
    prompt: `By how much did the reading ${ch > 0 ? "increase" : "decrease"} from ${d.cats[a]} to ${d.cats[b]}?`,
    diagram, answer: `${Math.abs(ch)} ${d.unit}`,
    working: [`${d.cats[a]}: ${d.values[a]}; ${d.cats[b]}: ${d.values[b]}`, `${Math.max(d.values[a], d.values[b])} − ${Math.min(d.values[a], d.values[b])} = ${Math.abs(ch)} ${d.unit}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [Math.abs(ch) + d.step, d.values[b], d.values[a] + d.values[b]].map(x => `${x} ${d.unit}`),
    tags: ["data", "line graph"]
  });
}

function lineGraphTrendQuestion() {
  const d = lineData();
  const diagram = stats({ chartType: "line", categories: d.cats, values: d.values, yStep: d.step, yLabel: d.yLabel, title: d.title, yMin: d.lo > 0 ? d.lo - 2 * d.step : undefined });
  const diffs = d.values.slice(1).map((x, k) => x - d.values[k]);
  const v = choice(["biggest-rise", "describe"]);
  if (v === "biggest-rise" && diffs.some(x => x > 0)) {
    const best = Math.max(...diffs);
    const idx = diffs.map((x, k) => (x === best ? k : -1)).filter(k => k >= 0);
    if (idx.length > 1) return lineGraphTrendQuestion();
    const k = idx[0];
    return q({
      type: "line-graph-trend", marks: 1,
      prompt: "Between which two readings was the biggest increase?",
      diagram, answer: `${d.cats[k]} and ${d.cats[k + 1]}`,
      working: ["The steepest upward part of the line shows the biggest increase.", `${d.cats[k]} to ${d.cats[k + 1]}: up ${best} ${d.unit}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: diffs.map((_, j) => `${d.cats[j]} and ${d.cats[j + 1]}`).filter((_, j) => j !== k),
      tags: ["data", "line graph", "change"]
    });
  }
  const first = d.values[0]; const last = d.values[d.values.length - 1];
  const overall = last > first ? "increased" : last < first ? "decreased" : "ended where it started";
  const shape = d.shape === "hump" ? `It rose to a highest point of ${Math.max(...d.values)} ${d.unit} at ${d.cats[d.values.indexOf(Math.max(...d.values))]}, then fell.` : d.shape === "up" ? "It rose over the whole period (sometimes staying level)." : "It fell over the whole period (sometimes staying level).";
  return q({
    type: "line-graph-trend", marks: 2,
    prompt: "Describe how the reading changed over the time shown on the graph.",
    diagram,
    answer: `${shape} Overall it ${overall}, from ${first} ${d.unit} to ${last} ${d.unit}.`,
    working: [shape, `Start: ${first} ${d.unit}; end: ${last} ${d.unit}.`],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["data", "line graph", "change"]
  });
}

/* ── two-way tables ──────────────────────────────────────── */

const TWO_WAY = [
  { rows: ["Year 5", "Year 6"], cols: ["Walk", "Bus", "Car"], what: "how students travel to school" },
  { rows: ["Boys", "Girls"], cols: ["Dog", "Cat", "No pet"], what: "pet ownership" },
  { rows: ["Juniors", "Seniors"], cols: ["Soccer", "Netball", "Tennis"], what: "sport chosen" },
  { rows: ["Class 5A", "Class 5B"], cols: ["Left-handed", "Right-handed"], what: "writing hand" }
];

export function twoWayData() {
  const t = choice(TWO_WAY);
  const cells = t.rows.map(() => t.cols.map(() => randInt(2, 15)));
  const rowT = cells.map(r => r.reduce((s, x) => s + x, 0));
  const colT = t.cols.map((_, j) => cells.reduce((s, r) => s + r[j], 0));
  const grand = rowT.reduce((s, x) => s + x, 0);
  return { ...t, cells, rowT, colT, grand };
}

function twoWayTableQuestion() {
  const d = twoWayData();
  const v = choice(["read", "total", "missing", "complete"]);
  const full = [["", ...d.cols, "Total"], ...d.rows.map((r, i) => [r, ...d.cells[i].map(String), String(d.rowT[i])]), ["Total", ...d.colT.map(String), String(d.grand)]];
  const i = randInt(0, d.rows.length - 1);
  const j = randInt(0, d.cols.length - 1);
  if (v === "read") {
    return q({
      type: "two-way-table", marks: 1,
      prompt: `The two-way table shows ${d.what}. How many ${d.rows[i]} chose ${d.cols[j].toLowerCase()}?`,
      table: { headerRow: true, rows: full },
      answer: String(d.cells[i][j]),
      working: [`Row ${d.rows[i]}, column ${d.cols[j]}: ${d.cells[i][j]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.colT[j], d.rowT[i], d.cells[1 - i][j]].map(String),
      tags: ["data", "two-way table"]
    });
  }
  if (v === "total") {
    return q({
      type: "two-way-table", marks: 1,
      prompt: `The two-way table shows ${d.what}. Altogether, how many chose ${d.cols[j].toLowerCase()}?`,
      table: { headerRow: true, rows: full },
      answer: String(d.colT[j]),
      working: [`The Total row, ${d.cols[j]} column: ${d.cells.map(r => r[j]).join(" + ")} = ${d.colT[j]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.cells[0][j], d.cells[1][j], d.grand].map(String),
      tags: ["data", "two-way table"]
    });
  }
  if (v === "missing") {
    const shown = full.map(r => r.slice());
    shown[i + 1][j + 1] = "?";
    return q({
      type: "two-way-table", marks: 2,
      prompt: `The two-way table shows ${d.what}. Find the missing number.`,
      table: { headerRow: true, rows: shown },
      answer: String(d.cells[i][j]),
      working: [`The ${d.rows[i]} row adds to ${d.rowT[i]}.`, `${d.rowT[i]} − (${d.cells[i].filter((_, k) => k !== j).join(" + ")}) = ${d.cells[i][j]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [d.rowT[i], d.colT[j] - d.cells[i][j] + 1, d.cells[i][j] + 2].map(String),
      tags: ["data", "two-way table"]
    });
  }
  const blanked = full.map((r, ri) => r.map((c, ci) => (ri === 0 || ci === 0 ? c : ri === full.length - 1 || ci === r.length - 1 ? "" : c)));
  return q({
    type: "two-way-table", marks: 2,
    prompt: `Complete the totals in the two-way table about ${d.what}.`,
    table: { headerRow: true, rows: blanked },
    answer: `Row totals ${d.rowT.join(", ")}; column totals ${d.colT.join(", ")}; overall ${d.grand}`,
    working: [...d.rows.map((r, k) => `${r}: ${d.cells[k].join(" + ")} = ${d.rowT[k]}`), ...d.cols.map((c, k) => `${c}: ${d.cells.map(r => r[k]).join(" + ")} = ${d.colT[k]}`), `Overall: ${d.grand}`],
    space: "none",
    mcEligible: false,
    tags: ["data", "two-way table"]
  });
}

/* ── time lines ──────────────────────────────────────────── */

const TIMELINES = [
  [["School opens", 1965], ["New library", 1978], ["Hall built", 1992], ["Pool opens", 2004], ["Solar panels", 2019]],
  [["Town founded", 1850], ["Railway", 1878], ["Post office", 1901], ["Hospital", 1934], ["Bridge", 1962]],
  [["Born", 2014], ["Started school", 2019], ["Learnt to swim", 2021], ["Joined team", 2023], ["Year 6", 2026]],
  [["First flight", 1903], ["Jet engine", 1939], ["Moon landing", 1969], ["Space shuttle", 1981], ["Space station", 1998]]
];

function timelineReadQuestion() {
  const tl = choice(TIMELINES);
  const measureDiag = { engine: "measure-engine", config: { diagramType: "timeline", points: tl.map(([note, yr]) => ({ at: yr, label: String(yr), note })), jumps: [] } };
  const v = choice(["between", "since", "order", "which"]);
  const i = randInt(0, tl.length - 2);
  const j = randInt(i + 1, tl.length - 1);
  if (v === "between") {
    const d = tl[j][1] - tl[i][1];
    return q({
      type: "timeline-read", marks: 1,
      prompt: `How many years passed between "${tl[i][0]}" and "${tl[j][0]}"?`,
      diagram: measureDiag, answer: `${d} years`,
      working: [`${tl[j][1]} − ${tl[i][1]} = ${d}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${d + 10} years`, `${d - 1} years`, `${d + 1} years`, `${tl[j][1] + tl[i][1]} years`],
      tags: ["data", "time line"]
    });
  }
  if (v === "since") {
    const now = 2026;
    const d = now - tl[i][1];
    return q({
      type: "timeline-read", marks: 1,
      prompt: `How many years before 2026 was "${tl[i][0]}"?`,
      diagram: measureDiag, answer: `${d} years`,
      working: [`2026 − ${tl[i][1]} = ${d}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${d + 10} years`, `${d - 10} years`, `${d + 1} years`],
      tags: ["data", "time line"]
    });
  }
  if (v === "which") {
    const k = randInt(1, tl.length - 1);
    return q({
      type: "timeline-read", marks: 1,
      prompt: `Which event happened ${tl[k][1] - tl[k - 1][1]} years after "${tl[k - 1][0]}"?`,
      diagram: measureDiag, answer: tl[k][0],
      working: [`${tl[k - 1][1]} + ${tl[k][1] - tl[k - 1][1]} = ${tl[k][1]}: ${tl[k][0]}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: tl.filter((_, m) => m !== k).map(e => e[0]),
      tags: ["data", "time line"]
    });
  }
  const mid = tl[i][1] + Math.max(1, Math.floor((tl[j][1] - tl[i][1]) / 2));
  const before = tl.filter(e => e[1] < mid).length;
  return q({
    type: "timeline-read", marks: 1,
    prompt: `How many of the events on the time line happened before ${mid}?`,
    diagram: measureDiag, answer: String(before),
    working: tl.map(e => `${e[1]} ${e[0]}${e[1] < mid ? " ✓" : ""}`),
    space: SPACE_SIZES.SMALL,
    mcDistractors: [before + 1, before - 1, tl.length - before].filter(x => x >= 0).map(String),
    tags: ["data", "time line"]
  });
}

/* ── misleading displays ─────────────────────────────────── */

function misleadingGraphQuestion() {
  const brand = choice([["Zoomies", "Crunchos"], ["Fizz Up", "Cola Co"], ["Sparkle", "Bright"], ["QuickNet", "SpeedLink"]]);
  const base = randInt(40, 60) * 10;
  const vals = [base + randInt(2, 5) * 10, base];
  const v = choice(["axis", "claim"]);
  if (v === "axis") {
    return q({
      type: "misleading-graph", marks: 2,
      prompt: `An advertisement uses this graph to show that ${brand[0]} sells "far more" than ${brand[1]}. Explain why the graph is misleading.`,
      diagram: stats({ chartType: "column", categories: brand, values: vals, yMin: base - 20, yStep: 10, yLabel: "Sales per week", title: "Weekly sales" }),
      answer: `The vertical axis starts at ${base - 20}, not 0, so the difference looks much bigger than it is. ${brand[0]} sold ${vals[0]} and ${brand[1]} sold ${vals[1]}: only ${vals[0] - vals[1]} more.`,
      working: [`The scale starts at ${base - 20}.`, `The real difference is ${vals[0]} − ${vals[1]} = ${vals[0] - vals[1]}, which is small compared with ${vals[1]}.`],
      space: SPACE_SIZES.MEDIUM,
      mcEligible: false,
      tags: ["data", "misleading graphs"]
    });
  }
  const n = choice([5, 8, 10]);
  const yes = randInt(3, n - 1);
  return q({
    type: "misleading-graph", marks: 2,
    prompt: `A website claims: "${Math.round((yes / n) * 100)}% of kids prefer ${brand[0]}!" The survey asked only ${n} children, all at a ${brand[0]} party. Give two reasons the claim may not be true for all kids.`,
    answer: `The sample is very small (only ${n} children), and it is biased — children at a ${brand[0]} party are likely to prefer ${brand[0]}.`,
    working: ["Too few people were asked.", "The people asked were not a fair mix."],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["data", "media", "misleading"]
  });
}

function multiPartDataQuestion() {
  const d = scaledCategorical([2, 5]);
  const max = Math.max(...d.values);
  const min = Math.min(...d.values);
  const total = d.values.reduce((s, x) => s + x, 0);
  return q({
    type: "multi-part-data", marks: 4,
    prompt: `The column graph shows the results of a survey: ${d.title.toLowerCase()}.`,
    diagram: stats({ chartType: "column", categories: d.cats, values: d.values, yStep: d.step, yLabel: `Number of ${d.unit}`, xLabel: d.xLabel, title: d.title }),
    subparts: [
      { label: "(a)", prompt: "What does each gridline on the vertical axis represent?", marks: 1, answer: `${d.step} ${d.unit}`, working: [`The scale goes up in ${d.step}s.`] },
      { label: "(b)", prompt: "Which was the most popular choice?", marks: 1, answer: d.cats[d.values.indexOf(max)], working: [`Tallest column: ${max}`] },
      { label: "(c)", prompt: "How many more chose the most popular than the least popular?", marks: 1, answer: String(max - min), working: [`${max} − ${min} = ${max - min}`] },
      { label: "(d)", prompt: "How many were surveyed?", marks: 1, answer: String(total), working: [`${d.values.join(" + ")} = ${total}`] }
    ],
    answer: `(a) ${d.step} ${d.unit}; (b) ${d.cats[d.values.indexOf(max)]}; (c) ${max - min}; (d) ${total}`,
    working: [],
    space: SPACE_SIZES.SMALL,
    tags: ["data", "multi-part"]
  });
}

const GENERATORS = {
  "data-types": dataTypesQuestion,
  "survey-questions": surveyQuestionsQuestion,
  "choose-display": chooseDisplayQuestion,
  "many-to-one-scale": manyToOneScaleQuestion,
  "pictogram-key": pictogramKeyQuestion,
  "choose-scale": chooseScaleQuestion,
  "construct-column": constructColumnQuestion,
  "dot-plot-read": dotPlotReadQuestion,
  "construct-dot-plot": constructDotPlotQuestion,
  "side-by-side": sideBySideQuestion,
  "line-graph-read": lineGraphReadQuestion,
  "line-graph-trend": lineGraphTrendQuestion,
  "two-way-table": twoWayTableQuestion,
  "timeline-read": timelineReadQuestion,
  "misleading-graph": misleadingGraphQuestion,
  "multi-part-data": multiPartDataQuestion
};

export function getStage3DataQuestionTypes() {
  return TYPE_LIST;
}

export function generateStage3DataQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
