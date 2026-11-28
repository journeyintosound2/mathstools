/*
  Mills Maths Tools — Stage 3 Question Bank: Mass and Time
  ----------------------------------------------------------
  question-banks/stage-3/mass-time/index.js

  NSW Mathematics K–10 (2022), Stage 3, focus areas "Non-spatial measure A"
  and "B", merged into one topic. Outcomes:

    MA3-NSM-01  selects and uses the appropriate unit and device to measure
                the masses of objects
    MA3-NSM-02  measures and compares duration, using 12- and 24-hour time
                and am and pm notation

  Content (docs/stage-3-syllabus-reference.md):
    A  appropriate units for mass (g, kg, t); decimals and the metric system;
       compare 12- and 24-hour systems and convert between them
    B  convert between common metric units of mass; problems involving
       duration using 12- and 24-hour time

  Pictures do the work here: kitchen and bathroom scales are READ, analogue
  clocks are READ and DRAWN ON, digital displays are converted, and
  durations are worked on a time line with empty boxes for the jumps.

  Conventions:
    - 12-hour times always carry am/pm ("4:35 pm"); 24-hour times use four
      digits with a colon ("16:35", "07:05"); midnight is 00:00, midday is
      12:00 pm = 12:00.
    - Scale readings sit exactly on a drawn mark.
    - Durations stay within a day (no crossing midnight) — the syllabus
      problems are timetables and events, and the midnight wrap is a
      separate idea the bank does not assess.

  Diagrams come from engines/measure/measure-engine.js (clock, digital, scale,
  timeline). tools/stage3-mass-time.mjs re-derives every answer from the
  diagram config.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, fmt, spaced, plural
} from "../../_shared/bank-helpers.js";

const TOPIC = "Mass and Time";

const TYPE_LIST = [
  { id: "mass-units", label: "Choose units of mass" },
  { id: "read-scale", label: "Read a scale" },
  { id: "convert-mass", label: "Convert g, kg and t" },
  { id: "mass-decimals", label: "Mass as a decimal (kg and g)" },
  { id: "order-masses", label: "Compare and order masses" },
  { id: "mass-problems", label: "Mass word problems" },
  { id: "read-clock", label: "Read an analogue clock" },
  { id: "draw-hands", label: "Draw the hands on a clock" },
  { id: "to-24-hour", label: "Convert 12-hour time to 24-hour time" },
  { id: "to-12-hour", label: "Convert 24-hour time to 12-hour time" },
  { id: "clock-to-24", label: "From a clock face to 24-hour time" },
  { id: "time-units", label: "Convert units of time" },
  { id: "duration", label: "Find a duration (time line)" },
  { id: "finish-time", label: "Find a finishing time" },
  { id: "start-time", label: "Find a starting time" },
  { id: "timetable", label: "Read a timetable" },
  { id: "multi-part-time", label: "Multi-part time problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage3", ...(spec.tags || [])] });
const measure = config => ({ engine: "measure-engine", config });

/* ── mass ────────────────────────────────────────────────── */

const MASS_ITEMS = [
  { item: "a paper clip", unit: "g" }, { item: "a bag of potatoes", unit: "kg" }, { item: "a loaded truck", unit: "t" },
  { item: "a slice of bread", unit: "g" }, { item: "a Year 6 student", unit: "kg" }, { item: "a blue whale", unit: "t" },
  { item: "a pencil", unit: "g" }, { item: "a bag of cement", unit: "kg" }, { item: "an elephant", unit: "t" },
  { item: "a letter in an envelope", unit: "g" }, { item: "a dog", unit: "kg" }, { item: "a bus", unit: "t" }
];
const UNIT_WORD = { g: "Grams (g)", kg: "Kilograms (kg)", t: "Tonnes (t)" };

const MASS_ESTIMATES = [
  { item: "an apple", good: "150 g", bad: ["150 kg", "15 kg", "1 500 g"] },
  { item: "a car", good: "1.5 t", bad: ["1.5 kg", "150 g", "15 t"] },
  { item: "a school bag full of books", good: "5 kg", bad: ["5 g", "50 kg", "500 kg"] },
  { item: "a 20 cent coin", good: "11 g", bad: ["11 kg", "110 g", "1 kg"] },
  { item: "a newborn baby", good: "3.5 kg", bad: ["35 kg", "350 g", "3.5 t"] },
  { item: "a laptop computer", good: "1.8 kg", bad: ["18 kg", "18 g", "180 kg"] }
];

function massUnitsQuestion() {
  if (Math.random() < 0.5) {
    const it = choice(MASS_ITEMS);
    return q({
      type: "mass-units", marks: 1,
      prompt: `Which unit would you use to measure the mass of ${it.item}: grams, kilograms or tonnes?`,
      answer: UNIT_WORD[it.unit],
      working: [{ g: "It is very light, so grams.", kg: "It is too heavy for grams but far lighter than a car: kilograms.", t: "It is extremely heavy, so tonnes." }[it.unit]],
      space: SPACE_SIZES.SMALL,
      mcEligible: false,
      tags: ["mass", "units"]
    });
  }
  const e = choice(MASS_ESTIMATES);
  return q({
    type: "mass-units", marks: 1,
    prompt: `Which is the best estimate of the mass of ${e.item}?`,
    answer: e.good,
    working: [`${e.good} is a sensible mass for ${e.item}.`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: e.bad,
    tags: ["mass", "estimation"]
  });
}

const SCALES = [
  { max: 5, major: 1, minor: 0.2, unit: "kg" },
  { max: 5, major: 1, minor: 0.5, unit: "kg" },
  { max: 1000, major: 200, minor: 50, unit: "g" },
  { max: 1000, major: 100, minor: 20, unit: "g" },
  { max: 2, major: 0.5, minor: 0.1, unit: "kg" },
  { max: 10, major: 2, minor: 0.5, unit: "kg" },
  { max: 500, major: 100, minor: 25, unit: "g" }
];

function readScaleQuestion() {
  const s = choice(SCALES);
  const steps = Math.round(s.max / s.minor);
  let k = randInt(2, steps - 2);
  if (Math.abs((k * s.minor) / s.major - Math.round((k * s.minor) / s.major)) < 1e-9) k += 1;
  const value = Math.round(k * s.minor * 1000) / 1000;
  const inGrams = s.unit === "kg" && Math.random() < 0.3;
  const ans = inGrams ? `${spaced(Math.round(value * 1000))} g` : `${fmt(value, 3)} ${s.unit}`;
  return q({
    type: "read-scale", marks: 1,
    prompt: inGrams ? "What mass does the scale show? Give your answer in grams." : "What mass does the scale show?",
    diagram: measure({ diagramType: "scale", ...s, value }),
    answer: ans,
    working: [
      `Between labelled marks (${fmt(s.major, 3)} ${s.unit} apart) there are ${Math.round(s.major / s.minor)} spaces, so each small mark is ${fmt(s.minor, 3)} ${s.unit}.`,
      `The needle points to ${fmt(value, 3)} ${s.unit}${inGrams ? ` = ${spaced(Math.round(value * 1000))} g` : ""}.`
    ],
    space: SPACE_SIZES.SMALL,
    mcDistractors: inGrams
      ? [`${spaced(Math.round((value + s.minor) * 1000))} g`, `${spaced(Math.round((value - s.minor) * 1000))} g`, `${fmt(value * 100, 1)} g`, `${fmt(value, 3)} g`]
      : [`${fmt(value + s.minor, 3)} ${s.unit}`, `${fmt(value - s.minor, 3)} ${s.unit}`, `${fmt(Math.floor(value / s.major) * s.major + (k % Math.round(s.major / s.minor)) * (s.major / 10), 3)} ${s.unit}`, `${fmt(value + s.major, 3)} ${s.unit}`],
    tags: ["mass", "reading scales"]
  });
}

function convertMassQuestion() {
  const dir = choice(["kg-g", "g-kg", "t-kg", "kg-t"]);
  const spec = {
    "kg-g": { vals: [3, 2.5, 1.75, 0.8, 0.125, 4.05, 0.45, 12.6], from: "kg", to: "g", k: 1000 },
    "g-kg": { vals: [3500, 750, 1250, 60, 4005, 2300, 875, 10500], from: "g", to: "kg", k: 1 / 1000 },
    "t-kg": { vals: [2, 1.5, 3.25, 0.6, 4.8, 0.075], from: "t", to: "kg", k: 1000 },
    "kg-t": { vals: [2000, 4500, 750, 1250, 12000, 380], from: "kg", to: "t", k: 1 / 1000 }
  }[dir];
  const v = choice(spec.vals);
  const out = Math.round(v * spec.k * 1000) / 1000;
  const show = x => (x >= 1000 && Number.isInteger(x) ? spaced(x) : fmt(x, 3));
  return q({
    type: "convert-mass", marks: 1,
    prompt: `Convert ${show(v)} ${spec.from} to ${spec.to === "g" ? "grams" : spec.to === "kg" ? "kilograms" : "tonnes"}.`,
    answer: `${show(out)} ${spec.to}`,
    working: [spec.k > 1 ? `1 ${spec.from} = 1 000 ${spec.to}, so multiply by 1 000.` : `1 000 ${spec.from} = 1 ${spec.to}, so divide by 1 000.`, `${show(v)} ${spec.k > 1 ? "×" : "÷"} 1 000 = ${show(out)} ${spec.to}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: spec.k > 1
      ? [`${show(v * 100)} ${spec.to}`, `${show(v * 10)} ${spec.to}`, `${show(v * 10000)} ${spec.to}`, `${fmt(v / 1000, 6)} ${spec.to}`]
      : [`${fmt(v / 100, 3)} ${spec.to}`, `${fmt(v / 10, 2)} ${spec.to}`, `${show(v * 1000)} ${spec.to}`, `${fmt(v / 10000, 4)} ${spec.to}`],
    tags: ["mass", "conversion"]
  });
}

function massDecimalsQuestion() {
  const v = choice(["to-decimal", "from-decimal", "place"]);
  const kg = randInt(1, 9);
  const g = choice([250, 500, 750, 45, 80, 5, 125, 600, 905]);
  const dec = fmt(kg + g / 1000, 3);
  if (v === "to-decimal") {
    return q({
      type: "mass-decimals", marks: 1,
      prompt: `Write ${kg} kg ${g} g in kilograms, as a decimal.`,
      answer: `${dec} kg`,
      working: [`${g} g = ${fmt(g / 1000, 3)} kg`, `${kg} + ${fmt(g / 1000, 3)} = ${dec} kg`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${kg}.${g} kg`, `${fmt(kg + g / 100, 2)} kg`, `${spaced(kg * 1000 + g)} kg`, `${fmt(kg + g / 10000, 4)} kg`].filter(x => x !== `${dec} kg`),
      tags: ["mass", "decimals"]
    });
  }
  if (v === "from-decimal") {
    return q({
      type: "mass-decimals", marks: 1,
      prompt: `Write ${dec} kg in kilograms and grams.`,
      answer: `${kg} kg ${g} g`,
      working: [`The whole number is the kilograms: ${kg} kg.`, `0${fmt(g / 1000, 3).slice(1)} kg = ${g} g`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${kg} kg ${Number(String(g).replace(/0+$/, ""))} g`, `${kg} kg ${g * 10 < 10000 ? g * 10 : g + 100} g`, `${kg + 1} kg ${g} g`, `${spaced(kg * 1000 + g)} kg`],
      tags: ["mass", "decimals"]
    });
  }
  const m = fmt(kg + g / 1000, 3);
  const digits = m.split(".")[1] || "";
  if (digits.length < 3) return massDecimalsQuestion();
  const place = randInt(0, 2);
  const val = Number(digits[place]) * [100, 10, 1][place];
  if (!Number(digits[place])) return massDecimalsQuestion();
  return q({
    type: "mass-decimals", marks: 1,
    prompt: `A parcel has a mass of ${m} kg. How many grams does the digit ${digits[place]} represent?`,
    answer: `${val} g`,
    working: [`The ${["tenths", "hundredths", "thousandths"][place]} digit of a kilogram mass is worth ${["100 g", "10 g", "1 g"][place]} each.`, `${digits[place]} × ${[100, 10, 1][place]} = ${val} g`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [100, 10, 1, 1000].map(k => `${Number(digits[place]) * k} g`),
    tags: ["mass", "place value"]
  });
}

function orderMassesQuestion() {
  const base = randInt(1, 4);
  const items = shuffle([
    { t: `${fmt(base + 0.5, 3)} kg`, g: (base + 0.5) * 1000 },
    { t: `${spaced((base + 0.05) * 1000)} g`, g: (base + 0.05) * 1000 },
    { t: `${base} kg ${choice([250, 300, 400])} g`, g: null },
    { t: `${fmt(base + 0.45, 3)} kg`, g: (base + 0.45) * 1000 }
  ]);
  items.forEach(it => { if (it.g === null) { const gg = Number(it.t.split(" ")[2]); it.g = base * 1000 + gg; } });
  if (new Set(items.map(i => i.g)).size < 4) return orderMassesQuestion();
  const asc = Math.random() < 0.5;
  const sorted = [...items].sort((a, b) => (asc ? a.g - b.g : b.g - a.g));
  if (sorted.every((s, i) => s === items[i])) return orderMassesQuestion();
  return q({
    type: "order-masses", marks: 2,
    prompt: `Write these masses in order from ${asc ? "lightest to heaviest" : "heaviest to lightest"}: ${items.map(i => i.t).join(", ")}`,
    answer: sorted.map(s => s.t).join(", "),
    working: ["Write each mass in grams:", ...items.map(i => `${i.t} = ${spaced(Math.round(i.g))} g`)],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["mass", "ordering"]
  });
}

function massProblemsQuestion() {
  const v = choice(["total", "packets", "container", "share"]);
  if (v === "total") {
    const a = randInt(2, 9) * 50 + 250; const b = randInt(1, 4); const c = randInt(2, 8) * 25;
    const total = a + b * 1000 + c;
    return q({
      type: "mass-problems", marks: 2,
      prompt: `Ali buys ${spaced(a)} g of cheese, a ${b} kg bag of rice and ${c} g of butter. What is the total mass in kilograms?`,
      answer: `${fmt(total / 1000, 3)} kg`,
      working: [`${spaced(a)} + ${spaced(b * 1000)} + ${c} = ${spaced(total)} g`, `${spaced(total)} g = ${fmt(total / 1000, 3)} kg`],
      space: SPACE_SIZES.MEDIUM,
      mcDistractors: [`${spaced(total)} kg`, `${fmt((a + c) / 1000 + b / 10, 3)} kg`, `${fmt(total / 100, 2)} kg`, `${fmt((total + 1000) / 1000, 3)} kg`],
      tags: ["mass", "problems"]
    });
  }
  if (v === "packets") {
    const pack = choice([125, 250, 200, 500]);
    const n = randInt(4, 12);
    return q({
      type: "mass-problems", marks: 2,
      prompt: `A ${fmt(pack * n / 1000, 3)} kg bag of flour is split into ${pack} g packets. How many packets are there?`,
      answer: `${n} packets`,
      working: [`${fmt(pack * n / 1000, 3)} kg = ${spaced(pack * n)} g`, `${spaced(pack * n)} ÷ ${pack} = ${n}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${n * 10} packets`, `${n + 2} packets`, `${n - 1} packets`],
      tags: ["mass", "problems"]
    });
  }
  if (v === "container") {
    const box = randInt(3, 9) * 50;
    const content = randInt(4, 16) * 125;
    const total = box + content;
    return q({
      type: "mass-problems", marks: 2,
      prompt: `A box of apples has a total mass of ${fmt(total / 1000, 3)} kg. The empty box has a mass of ${box} g. What is the mass of the apples?`,
      answer: `${fmt(content / 1000, 3)} kg`,
      working: [`${fmt(total / 1000, 3)} kg = ${spaced(total)} g`, `${spaced(total)} − ${box} = ${spaced(content)} g = ${fmt(content / 1000, 3)} kg`],
      space: SPACE_SIZES.MEDIUM,
      mcDistractors: [`${fmt(total / 1000 - box / 100, 3)} kg`, `${fmt((total + box) / 1000, 3)} kg`, `${spaced(content)} kg`],
      tags: ["mass", "problems"]
    });
  }
  const t = choice([2, 3, 6, 7]);
  const people = choice([4, 5, 8, 10]);
  return q({
    type: "mass-problems", marks: 2,
    prompt: `${t} kg of sand is shared equally between ${people} buckets. What mass of sand goes in each bucket, in grams?`,
    answer: `${spaced((t * 1000) / people)} g`,
    working: [`${t} kg = ${spaced(t * 1000)} g`, `${spaced(t * 1000)} ÷ ${people} = ${spaced((t * 1000) / people)} g`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${fmt(t / people, 3)} g`, `${spaced((t * 1000) / people * 10)} g`, `${spaced(t * people * 1000)} g`],
    tags: ["mass", "problems"]
  });
}

/* ── time helpers ────────────────────────────────────────── */

const pad = n => String(n).padStart(2, "0");
/* minutes after midnight → "4:35 pm" */
export function to12(mins) {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${pad(m)} ${h24 < 12 ? "am" : "pm"}`;
}
/* minutes after midnight → "16:35" */
export function to24(mins) {
  return `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
}
export function durationText(d) {
  const h = Math.floor(d / 60);
  const m = d % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${m} min`;
}

const PARTS_OF_DAY = [
  { from: 6 * 60, to: 11 * 60 + 55, words: ["in the morning", "before school", "at breakfast time"] },
  { from: 12 * 60 + 5, to: 17 * 60 + 55, words: ["in the afternoon", "after lunch", "after school"] },
  { from: 18 * 60, to: 22 * 60 + 55, words: ["in the evening", "at night", "after dinner"] }
];

function randomTime({ step = 5, from = 0, to = 24 * 60 - step } = {}) {
  const lo = Math.ceil(from / step);
  const hi = Math.floor(to / step);
  return randInt(lo, hi) * step;
}

/* ── clocks ──────────────────────────────────────────────── */

function readClockQuestion() {
  const step = choice([5, 5, 1]);
  const mins = randomTime({ step, from: 60, to: 12 * 60 + 59 });
  const h = Math.floor(mins / 60) % 12 || 12;
  const m = mins % 60;
  const text = `${h}:${pad(m)}`;
  const swapped = m % 5 === 0 && m / 5 !== h && m / 5 >= 1 ? `${m / 5}:${pad(h * 5 % 60)}` : `${h}:${pad((m + 30) % 60)}`;
  return q({
    type: "read-clock", marks: 1,
    prompt: "What time does the clock show? Write it in digital form.",
    diagram: measure({ diagramType: "clock", hours: h, minutes: m }),
    answer: text,
    working: [`The short (hour) hand is ${m === 0 ? "on" : "just past"} the ${h}.`, `The long (minute) hand shows ${m} minutes past.`, `Time: ${text}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [swapped, `${h === 12 ? 1 : h + 1}:${pad(m)}`, `${h}:${pad((60 - m) % 60)}`, `${h === 1 ? 12 : h - 1}:${pad(m)}`],
    tags: ["time", "analogue clock"]
  });
}

function drawHandsQuestion() {
  const mins = randomTime({ step: 5, from: 60, to: 12 * 60 + 55 });
  const h = Math.floor(mins / 60) % 12 || 12;
  const m = mins % 60;
  const in24 = Math.random() < 0.4;
  const pm = Math.random() < 0.5;
  const shown = in24 ? to24(((h % 12) + (pm ? 12 : 0)) * 60 + m) : `${h}:${pad(m)}`;
  return q({
    type: "draw-hands", marks: 1,
    prompt: `Draw the hands on the clock to show ${shown}.`,
    diagram: measure({ diagramType: "clock", hands: false }),
    answer: `Minute hand pointing to the ${m === 0 ? 12 : m / 5}${m === 0 ? "" : ` (${m} minutes)`}; hour hand ${m === 0 ? "on" : "between"} the ${h}${m === 0 ? "" : ` and the ${h === 12 ? 1 : h + 1}`}`,
    working: [in24 ? `${shown} is ${h}:${pad(m)} ${pm ? "pm" : "am"}.` : `${shown}`, `Minute hand: ${m} minutes → points to the ${m === 0 ? 12 : m / 5}.`, `Hour hand: ${m === 0 ? `on the ${h}` : `past the ${h}, ${m >= 30 ? "more than" : "less than"} halfway to the ${h === 12 ? 1 : h + 1}`}.`],
    space: "none",
    mcEligible: false,
    tags: ["time", "analogue clock"]
  });
}

function to24HourQuestion() {
  const part = choice(PARTS_OF_DAY.concat([{ from: 0, to: 5 * 60 + 55, words: ["in the early morning"] }]));
  const mins = randomTime({ step: choice([5, 1]), from: part.from, to: part.to });
  const t12 = to12(mins);
  const t24 = to24(mins);
  const h = Math.floor(mins / 60);
  return q({
    type: "to-24-hour", marks: 1,
    prompt: `Write ${t12} in 24-hour time.`,
    answer: t24,
    working: h >= 12
      ? [h === 12 ? "12 pm is midday: the hour stays 12." : `pm times after 12:59 pm: add 12 to the hour.`, `${t12} → ${t24}`]
      : [h === 0 ? "12 am is midnight: the hour is 00." : "am times keep the hour, written with two digits.", `${t12} → ${t24}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [to24((mins + 12 * 60) % (24 * 60)), `${Math.floor(mins / 60) % 12 || 12}:${pad(mins % 60)}`, to24((mins + 10 * 60) % (24 * 60)), `${pad((h + 2) % 24)}:${pad(mins % 60)}`],
    tags: ["time", "24-hour"]
  });
}

function to12HourQuestion() {
  const mins = randomTime({ step: choice([5, 1]), from: 0, to: 23 * 60 + 59 });
  const t12 = to12(mins);
  const t24 = to24(mins);
  const digital = Math.random() < 0.5;
  const h = Math.floor(mins / 60);
  return q({
    type: "to-12-hour", marks: 1,
    prompt: digital ? "This clock shows 24-hour time. Write the time in 12-hour time, using am or pm." : `Write ${t24} in 12-hour time, using am or pm.`,
    diagram: digital ? measure({ diagramType: "digital", text: t24 }) : null,
    answer: t12,
    working: h >= 13
      ? [`The hour ${h} is after 12, so subtract 12 and use pm.`, `${t24} → ${t12}`]
      : h === 12 ? ["Hour 12 is midday: pm.", `${t24} → ${t12}`]
        : h === 0 ? ["Hour 00 is midnight: 12 am.", `${t24} → ${t12}`]
          : ["Hours 01 to 11 are am.", `${t24} → ${t12}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [
      t12.endsWith("am") ? t12.replace("am", "pm") : t12.replace("pm", "am"),
      `${(h % 12 || 12) + 2}:${pad(mins % 60)} ${t12.slice(-2)}`,
      `${h}:${pad(mins % 60)} ${h >= 12 ? "pm" : "am"}`,
      `${(h % 12 || 12) === 12 ? 1 : (h % 12 || 12) + 1}:${pad(mins % 60)} ${t12.slice(-2)}`
    ],
    tags: ["time", "24-hour"]
  });
}

function clockTo24Question() {
  const part = choice(PARTS_OF_DAY);
  const mins = randomTime({ step: 5, from: part.from, to: part.to });
  const h = Math.floor(mins / 60) % 12 || 12;
  const m = mins % 60;
  const words = choice(part.words);
  return q({
    type: "clock-to-24", marks: 1,
    prompt: `The clock shows the time Jo left home ${words}. Write the time in 24-hour time.`,
    diagram: measure({ diagramType: "clock", hours: h, minutes: m }),
    answer: to24(mins),
    working: [`The clock shows ${h}:${pad(m)}.`, `${words[0].toUpperCase() + words.slice(1)} means ${to12(mins).slice(-2)}: ${to12(mins)}.`, `24-hour time: ${to24(mins)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [to24((mins + 12 * 60) % (24 * 60)), `${h}:${pad(m)}`, to24(mins + 60 < 24 * 60 ? mins + 60 : mins - 60)],
    tags: ["time", "24-hour", "analogue clock"]
  });
}

function timeUnitsQuestion() {
  const v = choice(["h-min", "min-h", "decimal-h", "min-s", "days", "fraction-h"]);
  const make = (prompt, answer, working, distract) => q({ type: "time-units", marks: 1, prompt, answer, working, space: SPACE_SIZES.SMALL, mcDistractors: distract, tags: ["time", "units"] });
  if (v === "h-min") {
    const h = randInt(2, 5); const m = randInt(1, 11) * 5;
    return make(`How many minutes are in ${h} h ${m} min?`, `${h * 60 + m} min`, [`${h} × 60 = ${h * 60}`, `${h * 60} + ${m} = ${h * 60 + m} min`], [`${h * 100 + m} min`, `${h + m} min`, `${(h * 60 + m) + 60} min`]);
  }
  if (v === "min-h") {
    const total = randInt(70, 300);
    if (total % 60 === 0) return timeUnitsQuestion();
    return make(`Write ${total} minutes in hours and minutes.`, durationText(total), [`${total} ÷ 60 = ${Math.floor(total / 60)} remainder ${total % 60}`, durationText(total)], [`${Math.floor(total / 100)} h ${total % 100} min`, durationText(total + 10), durationText(total - 60)]);
  }
  if (v === "decimal-h") {
    const h = choice([1.5, 2.5, 0.5, 3.5, 1.25, 0.75, 2.25]);
    return make(`How many minutes are in ${fmt(h)} hours?`, `${h * 60} min`, [`${fmt(h)} × 60 = ${h * 60} min`], [`${h * 100} min`, `${Math.floor(h) * 60 + Math.round((h % 1) * 10)} min`, `${h * 60 + 30} min`]);
  }
  if (v === "min-s") {
    const m = randInt(2, 9); const s = randInt(1, 11) * 5;
    return make(`How many seconds are in ${m} min ${s} s?`, `${m * 60 + s} s`, [`${m} × 60 = ${m * 60}`, `${m * 60} + ${s} = ${m * 60 + s} s`], [`${m * 100 + s} s`, `${m + s} s`, `${m * 60} s`]);
  }
  if (v === "days") {
    const w = randInt(2, 6); const d = randInt(1, 6);
    return make(`How many days are in ${w} weeks and ${plural(d, "day")}?`, `${w * 7 + d} days`, [`${w} × 7 = ${w * 7}`, `${w * 7} + ${d} = ${w * 7 + d} days`], [`${w * 10 + d} days`, `${w * 5 + d} days`, `${w + d} days`]);
  }
  const f = choice([["a quarter of an hour", 15], ["three-quarters of an hour", 45], ["half an hour", 30], ["one-third of an hour", 20]]);
  return make(`How many minutes are in ${f[0]}?`, `${f[1]} min`, [`${f[0]} of 60 minutes = ${f[1]} min`], [`${f[1] === 15 ? 25 : 15} min`, `${f[1] + 10} min`, `${100 * f[1] / 60} min`]);
}

/* ── durations ───────────────────────────────────────────── */

const EVENTS = ["a movie", "a football match", "a school excursion", "a bike ride", "a train trip", "a concert", "a swimming carnival", "a bus trip"];

function pickInterval() {
  const start = randomTime({ step: 5, from: 7 * 60, to: 18 * 60 });
  const d = randInt(4, 40) * 5;
  const end = start + d;
  if (end > 22 * 60) return pickInterval();
  return { start, end, d };
}

/* Time line: start, the next o'clock (if it helps), end. Jumps are left
   blank for the student. */
function timelineFor(start, end, { fillJumps = false, fillEnd = true, fillStart = true, fmtT = to12 } = {}) {
  const next = Math.ceil(start / 60) * 60;
  const pts = [{ at: 0, label: fillStart ? fmtT(start) : null }];
  const jumps = [];
  if (next > start && next < end) {
    pts.push({ at: next - start, label: fmtT(next) });
    jumps.push({ from: 0, to: next - start, label: fillJumps ? durationText(next - start) : null });
    jumps.push({ from: next - start, to: end - start, label: fillJumps ? durationText(end - next) : null });
  } else {
    jumps.push({ from: 0, to: end - start, label: fillJumps ? durationText(end - start) : null });
  }
  pts.push({ at: end - start, label: fillEnd ? fmtT(end) : null });
  return { diagramType: "timeline", points: pts, jumps };
}

function durationQuestion() {
  const { start, end, d } = pickInterval();
  const use24 = Math.random() < 0.5;
  const f = use24 ? to24 : to12;
  const ev = choice(EVENTS);
  const next = Math.ceil(start / 60) * 60;
  return q({
    type: "duration", marks: 2,
    prompt: `${ev[0].toUpperCase() + ev.slice(1)} started at ${f(start)} and finished at ${f(end)}. How long did it last? Use the time line to help.`,
    diagram: measure(timelineFor(start, end, { fmtT: f })),
    answer: durationText(d),
    working: next > start && next < end
      ? [`${f(start)} to ${f(next)} is ${durationText(next - start)}.`, `${f(next)} to ${f(end)} is ${durationText(end - next)}.`, `Total: ${durationText(d)}`]
      : [`${f(start)} to ${f(end)} is ${durationText(d)}.`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [durationText(d + 40), durationText(Math.abs(d - 40) || 5), durationText(d + 60), durationText(d + 10)],
    tags: ["time", "duration"]
  });
}

function finishTimeQuestion() {
  const { start, end, d } = pickInterval();
  const use24 = Math.random() < 0.5;
  const f = use24 ? to24 : to12;
  const ev = choice(EVENTS);
  return q({
    type: "finish-time", marks: 2,
    prompt: `${ev[0].toUpperCase() + ev.slice(1)} starts at ${f(start)} and lasts ${durationText(d)}. At what time does it finish? Give your answer in ${use24 ? "24-hour" : "12-hour"} time.`,
    diagram: Math.random() < 0.5 ? measure(timelineFor(start, end, { fmtT: f, fillEnd: false, fillJumps: false })) : null,
    answer: f(end),
    working: [`${f(start)} + ${durationText(d)}`, `= ${f(end)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [f(end + 40), f(end - 40), f(end + 60), f(end + 10)],
    tags: ["time", "duration"]
  });
}

function startTimeQuestion() {
  const { start, end, d } = pickInterval();
  const use24 = Math.random() < 0.5;
  const f = use24 ? to24 : to12;
  const ev = choice(EVENTS);
  return q({
    type: "start-time", marks: 2,
    prompt: `${ev[0].toUpperCase() + ev.slice(1)} finished at ${f(end)}. It lasted ${durationText(d)}. At what time did it start?`,
    answer: f(start),
    working: [`${f(end)} − ${durationText(d)}`, `= ${f(start)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [f(start + 40), f(start - 40), f(end + d), f(start + 60)],
    tags: ["time", "duration"]
  });
}

/* ── timetables ──────────────────────────────────────────── */

const STOPS = [
  ["Central", "Redfern", "Strathfield", "Parramatta", "Blacktown"],
  ["Beach Rd", "Library", "Hospital", "Town Centre", "Station"],
  ["Wharf", "Museum", "Park St", "School", "Shops"]
];

export function makeTimetable() {
  const stops = choice(STOPS);
  const gaps = stops.slice(1).map(() => randInt(2, 9) * 2);
  const firsts = [randomTime({ step: 5, from: 6 * 60, to: 8 * 60 })];
  const every = choice([20, 25, 30, 40, 45]);
  firsts.push(firsts[0] + every, firsts[0] + 2 * every);
  const rows = stops.map((s, i) => [s, ...firsts.map(f => to24(f + gaps.slice(0, i).reduce((a, b) => a + b, 0)))]);
  return { stops, gaps, firsts, rows, every };
}

function timetableQuestion() {
  const tt = makeTimetable();
  const { stops, gaps, firsts, rows } = tt;
  const cum = i => gaps.slice(0, i).reduce((a, b) => a + b, 0);
  const v = choice(["arrive", "journey", "catch", "twelve"]);
  const table = { headerRow: true, caption: "Bus timetable (24-hour time)", rows: [["Stop", "Bus 1", "Bus 2", "Bus 3"], ...rows] };
  const b = randInt(0, 2);
  if (v === "arrive") {
    const i = randInt(1, stops.length - 1);
    return q({
      type: "timetable", marks: 1,
      prompt: `Use the timetable. Bus ${b + 1} leaves ${stops[0]} at ${to24(firsts[b])}. At what time does it reach ${stops[i]}?`,
      table,
      answer: to24(firsts[b] + cum(i)),
      working: [`Read down the Bus ${b + 1} column to the ${stops[i]} row: ${to24(firsts[b] + cum(i))}.`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [0, 1, 2].filter(x => x !== b).map(x => to24(firsts[x] + cum(i))).concat([to24(firsts[b] + cum(Math.max(0, i - 1)))]),
      tags: ["time", "timetable"]
    });
  }
  if (v === "journey") {
    const i = randInt(0, stops.length - 3);
    const j = randInt(i + 2, stops.length - 1);
    const d = cum(j) - cum(i);
    return q({
      type: "timetable", marks: 2,
      prompt: `How long does Bus ${b + 1} take to travel from ${stops[i]} to ${stops[j]}?`,
      table,
      answer: durationText(d),
      working: [`Leaves ${stops[i]} at ${to24(firsts[b] + cum(i))}; reaches ${stops[j]} at ${to24(firsts[b] + cum(j))}.`, `Difference: ${durationText(d)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [durationText(d + 10), durationText(d + 40), durationText(Math.max(2, d - 4)), durationText(d + 60)],
      tags: ["time", "timetable", "duration"]
    });
  }
  if (v === "catch") {
    const j = stops.length - 1;
    const bus = randInt(1, 2);
    const need = firsts[bus] + cum(j) - randInt(1, 3) * 5;   // must arrive by this time: only earlier buses work
    const arriveBy = need;
    const ok = [0, 1, 2].filter(x => firsts[x] + cum(j) <= arriveBy);
    const best = ok[ok.length - 1];
    return q({
      type: "timetable", marks: 2,
      prompt: `Kai must be at ${stops[j]} by ${to24(arriveBy)}. What is the latest bus he can catch from ${stops[0]}, and when does it leave?`,
      table,
      answer: `Bus ${best + 1}, leaving at ${to24(firsts[best])}`,
      working: [0, 1, 2].map(x => `Bus ${x + 1} reaches ${stops[j]} at ${to24(firsts[x] + cum(j))}${firsts[x] + cum(j) <= arriveBy ? " ✓" : " — too late"}`),
      space: SPACE_SIZES.SMALL,
      mcEligible: false,
      tags: ["time", "timetable"]
    });
  }
  const i = randInt(0, stops.length - 1);
  const t = firsts[b] + cum(i);
  return q({
    type: "timetable", marks: 1,
    prompt: `Bus ${b + 1} stops at ${stops[i]}. Write that time in 12-hour time.`,
    table,
    answer: to12(t),
    working: [`Timetable: ${to24(t)}`, `${to24(t)} = ${to12(t)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [to12(t).endsWith("am") ? to12(t).replace("am", "pm") : to12(t).replace("pm", "am"), to12(t + 60), to12(t - 60)],
    tags: ["time", "timetable", "24-hour"]
  });
}

function multiPartTimeQuestion() {
  const start = randomTime({ step: 5, from: 13 * 60, to: 16 * 60 });
  const d = randInt(9, 30) * 5;
  const end = start + d;
  const h = Math.floor(start / 60) % 12 || 12;
  const m = start % 60;
  return q({
    type: "multi-part-time", marks: 4,
    prompt: "The clock shows the time a school sports afternoon started. It was after lunch.",
    diagram: measure({ diagramType: "clock", hours: h, minutes: m }),
    subparts: [
      { label: "(a)", prompt: "Write the starting time in 12-hour time, using am or pm.", marks: 1, answer: to12(start), working: [`${h}:${pad(m)} after lunch → ${to12(start)}`] },
      { label: "(b)", prompt: "Write the starting time in 24-hour time.", marks: 1, answer: to24(start), working: [`${to12(start)} → ${to24(start)}`] },
      { label: "(c)", prompt: `It lasted ${durationText(d)}. When did it finish? Give the time in 24-hour time.`, marks: 2, answer: to24(end), working: [`${to24(start)} + ${durationText(d)} = ${to24(end)}`] }
    ],
    answer: `(a) ${to12(start)}; (b) ${to24(start)}; (c) ${to24(end)}`,
    working: [],
    space: SPACE_SIZES.SMALL,
    tags: ["time", "multi-part"]
  });
}

const GENERATORS = {
  "mass-units": massUnitsQuestion,
  "read-scale": readScaleQuestion,
  "convert-mass": convertMassQuestion,
  "mass-decimals": massDecimalsQuestion,
  "order-masses": orderMassesQuestion,
  "mass-problems": massProblemsQuestion,
  "read-clock": readClockQuestion,
  "draw-hands": drawHandsQuestion,
  "to-24-hour": to24HourQuestion,
  "to-12-hour": to12HourQuestion,
  "clock-to-24": clockTo24Question,
  "time-units": timeUnitsQuestion,
  "duration": durationQuestion,
  "finish-time": finishTimeQuestion,
  "start-time": startTimeQuestion,
  "timetable": timetableQuestion,
  "multi-part-time": multiPartTimeQuestion
};

export function getStage3MassTimeQuestionTypes() {
  return TYPE_LIST;
}

export function generateStage3MassTimeQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
