/**
 * Playground question bank — Integers (MA4-INT-C-01).
 * "Compares, orders and calculates with integers to solve problems."
 *
 * Written for the game in the shared-bank format (prompt / mode / answer
 * fields, as the website's topic-quiz banks), covering the content of the
 * site's Computation with Integers quiz: compare and order, the number line,
 * the four operations, order of operations (including powers of negatives)
 * and integers in context. Diagrams use the Revision Generator's
 * integer-engine (number line, jumps, thermometer).
 *
 * Every numeric answer here can be negative, so questions carry
 * `signed:true` — the game then offers a − key and a text keyboard.
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
import "../exprCheck.js";

const { ri, pick, shuffle, fmt, MINUS } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = (s) => `<span class="m">${s}</span>`;
const n = (v) => fmt(v);
const br = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v)); // bracket a negative operand
const nz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
const neg = (a, b) => -ri(a, b);
const sgnNum = (v, extra = {}) => ({ mode: "num", value: v, signed: true, ...extra });
const INT = (config, scale = 0.95) => ({ engine: "integer-engine", config, scale, maxH: 320 });

/* ================================ BASIC ================================ */
add("basic", "b-compare", "Compare integers", () => {
  let a, b;
  const k = ri(0, 2);
  if (k === 0) { a = neg(1, 15); b = neg(1, 15); while (b === a) b = neg(1, 15); }
  else if (k === 1) { a = neg(1, 12); b = ri(0, 12); if (Math.random() < 0.5) [a, b] = [b, a]; }
  else { a = neg(2, 20); b = -a; if (Math.random() < 0.5) [a, b] = [b, a]; }
  const opts = ["<", ">"];
  const correct = a < b ? 0 : 1;
  return {
    prompt: `Which symbol makes this statement true?<span class="big">${n(a)} &nbsp;☐&nbsp; ${n(b)}</span>`,
    mode: "mc", options: opts, correct, keepOrder: true,
    why: `On a number line ${n(a)} is to the ${a < b ? "left" : "right"} of ${n(b)}, so ${n(a)} ${a < b ? "<" : ">"} ${n(b)}.${a < 0 && b < 0 ? " With negatives, the one further from zero is smaller." : ""}`,
  };
});

add("basic", "b-order", "Order integers", () => {
  const set = new Set();
  while (set.size < 5) set.add(ri(-20, 15));
  let vals = [...set];
  if (vals.filter((v) => v < 0).length < 2) vals[0] = -Math.abs(vals[0]) - 1;
  vals = [...new Set(vals)];
  while (vals.length < 5) { const v = ri(-20, 15); if (!vals.includes(v)) vals.push(v); }
  const desc = Math.random() < 0.35;
  const sorted = vals.slice().sort((x, y) => (desc ? y - x : x - y));
  return {
    prompt: `Write these integers in order from <b>${desc ? "largest to smallest" : "smallest to largest"}</b>:<span class="big">${shuffle(vals).map(n).join(", &nbsp;")}</span>`,
    mode: "nums", values: sorted, ordered: true, signed: true, placeholder: "e.g. −5, −2, 0, 3",
    answerHTML: sorted.map(n).join(", "),
    why: `Negatives are less than zero, and the further a negative is from zero the smaller it is: ${sorted.map(n).join(", ")}.`,
  };
});

add("basic", "b-numberline", "Read and use the number line", () => {
  const k = ri(0, 1);
  if (k === 0) {
    // jumps on a number line
    const start = ri(-8, 6), j1 = nz(-9, 9), j2 = nz(-7, 7);
    const end = start + j1 + j2;
    if (Math.abs(start + j1) > 10 || Math.abs(end) > 10) return T.find((t) => t.id === "b-numberline").gen();
    return {
      prompt: `Start at ${n(start)} on the number line and make the two jumps shown. Where do you finish?`,
      diagram: INT({ diagramType: "number-line-jumps", min: -10, max: 10, step: 1, start, jumps: [{ by: j1 }, { by: j2 }], labels: [-10, -5, 0, 5, 10] }, 1.0),
      ...sgnNum(end), why: `${n(start)} ${j1 < 0 ? MINUS : "+"} ${Math.abs(j1)} = ${n(start + j1)}, then ${n(start + j1)} ${j2 < 0 ? MINUS : "+"} ${Math.abs(j2)} = ${n(end)}.`,
    };
  }
  // a marked point on the number line
  const step = pick([1, 2, 5]);
  const lo = step === 1 ? -10 : step === 2 ? -20 : -50, hi = -lo;
  const v = ri(lo / step, hi / step) * step;
  if (v === 0 || v === lo || v === hi || [lo / 2, hi / 2].includes(v)) return T.find((t) => t.id === "b-numberline").gen();
  return {
    prompt: `What integer is marked by the dot? (The scale goes up in ${step}s.)`,
    diagram: INT({ diagramType: "number-line", min: lo, max: hi, step, labels: [lo, 0, hi], answer: v, showAnswer: true, hideAnswerLabel: true }, 1.0),
    ...sgnNum(v), why: `Count ${Math.abs(v / step)} step${Math.abs(v / step) === 1 ? "" : "s"} of ${step} ${v < 0 ? "left" : "right"} of zero: ${n(v)}.`,
    key: `nl${v}|${step}`,
  };
});

add("basic", "b-add", "Adding integers", () => {
  const k = ri(0, 2);
  let a, b;
  if (k === 0) { a = neg(2, 15); b = ri(2, 15); }
  else if (k === 1) { a = ri(2, 15); b = neg(2, 20); }
  else { a = neg(2, 15); b = neg(2, 15); }
  const v = a + b;
  return {
    prompt: `Evaluate.<span class="big">${n(a)} + ${br(b)}</span>`,
    ...sgnNum(v),
    why: b < 0 ? `Adding a negative is the same as subtracting: ${n(a)} − ${Math.abs(b)} = ${n(v)}.` : `Start at ${n(a)} and move ${b} to the right: ${n(v)}.`,
  };
});

add("basic", "b-sub", "Subtracting integers", () => {
  const k = ri(0, 2);
  let a, b;
  if (k === 0) { a = ri(-12, 8); b = neg(2, 12); }           // subtract a negative
  else if (k === 1) { a = neg(2, 12); b = ri(2, 12); }       // negative minus positive
  else { a = ri(2, 10); b = ri(a + 2, 20); }                 // small minus big
  const v = a - b;
  return {
    prompt: `Evaluate.<span class="big">${n(a)} − ${br(b)}</span>`,
    ...sgnNum(v),
    why: b < 0 ? `Subtracting a negative is the same as adding: ${n(a)} − (${n(b)}) = ${n(a)} + ${-b} = ${n(v)}.` : `Start at ${n(a)} and move ${b} to the left: ${n(v)}.`,
  };
});

add("basic", "b-mult", "Multiplying integers", () => {
  const a = nz(-12, 12), b = nz(-12, 12);
  if (a > 0 && b > 0) return T.find((t) => t.id === "b-mult").gen();
  const v = a * b;
  return {
    prompt: `Evaluate.<span class="big">${br(a)} × ${br(b)}</span>`,
    ...sgnNum(v),
    why: `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(v)}. ${(a < 0) === (b < 0) ? "Same signs give a positive." : "Different signs give a negative."}`,
  };
});

add("basic", "b-div", "Dividing integers", () => {
  const q = nz(-12, 12), d = nz(-9, 9);
  if (Math.abs(d) === 1 || (q > 0 && d > 0)) return T.find((t) => t.id === "b-div").gen();
  const a = q * d;
  return {
    prompt: `Evaluate.<span class="big">${n(a)} ÷ ${br(d)}</span>`,
    ...sgnNum(q),
    why: `${Math.abs(a)} ÷ ${Math.abs(d)} = ${Math.abs(q)}. ${(a < 0) === (d < 0) ? "Same signs give a positive." : "Different signs give a negative."}`,
  };
});

add("basic", "b-temperature", "Temperature changes", () => {
  const start = ri(-12, 8), ch = nz(-14, 14), end = start + ch;
  if (Math.abs(ch) < 3) return T.find((t) => t.id === "b-temperature").gen();
  const town = pick(["Thredbo", "Perisher", "Cooma", "Orange", "Oberon", "Hobart", "Canberra"]);
  return {
    prompt: `At 6 am the temperature in ${town} was ${n(start)}°C. By midday it had ${ch > 0 ? "risen" : "fallen"} by ${Math.abs(ch)}°C. What was the temperature at midday?`,
    diagram: INT({ diagramType: "thermometer", min: -20, max: 30, step: 10, value: start, unit: "°C", showValue: true }, 1.25),
    ...sgnNum(end, { unit: "°C" }),
    why: `${n(start)} ${ch > 0 ? "+" : "−"} ${Math.abs(ch)} = ${n(end)}°C.`,
  };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-order-ops", "Order of operations with integers", () => {
  const forms = [
    () => { const a = ri(-10, 10), b = nz(-6, 6), c = nz(-6, 6); return [`${n(a)} + ${br(b)} × ${br(c)}`, a + b * c, `Multiply first: ${br(b)} × ${br(c)} = ${n(b * c)}. Then ${n(a)} + ${br(b * c)} = ${n(a + b * c)}.`]; },
    () => { const a = nz(-9, 9), b = nz(-9, 9), c = nz(-5, 5); if (a === b) return null; return [`(${n(a)} − ${br(b)}) × ${br(c)}`, (a - b) * c, `Brackets first: ${n(a)} − ${br(b)} = ${n(a - b)}. Then ${br(a - b)} × ${br(c)} = ${n((a - b) * c)}.`]; },
    () => { const d = nz(-6, 6), q = nz(-8, 8), a = ri(-12, 12); if (Math.abs(d) === 1) return null; return [`${n(a)} − ${n(q * d)} ÷ ${br(d)}`, a - q, `Divide first: ${n(q * d)} ÷ ${br(d)} = ${n(q)}. Then ${n(a)} − ${br(q)} = ${n(a - q)}.`]; },
    () => { const a = nz(-8, 8), b = nz(-8, 8), c = nz(-6, 6), d = nz(-6, 6); return [`${br(a)} × ${br(b)} − ${br(c)} × ${br(d)}`, a * b - c * d, `${br(a)} × ${br(b)} = ${n(a * b)} and ${br(c)} × ${br(d)} = ${n(c * d)}. Then ${n(a * b)} − ${br(c * d)} = ${n(a * b - c * d)}.`]; },
  ];
  let r = null; while (!r) r = pick(forms)();
  const [expr, v, why] = r;
  return { prompt: `Evaluate, using the order of operations.<span class="big">${expr}</span>`, ...sgnNum(v), why };
});

add("expected", "e-powers", "Powers of negative numbers", () => {
  const k = ri(0, 3);
  if (k === 0) { const a = ri(2, 9); return { prompt: `Evaluate.<span class="big">(${MINUS}${a})²</span>`, ...sgnNum(a * a), why: `(${MINUS}${a})² = (${MINUS}${a}) × (${MINUS}${a}) = ${a * a}. A negative times a negative is positive.` }; }
  if (k === 1) { const a = ri(2, 9); return { prompt: `Evaluate.<span class="big">${MINUS}${a}²</span>`, ...sgnNum(-a * a), why: `Only the ${a} is squared: ${MINUS}${a}² = ${MINUS}(${a} × ${a}) = ${n(-a * a)}. (Compare (${MINUS}${a})² = ${a * a}.)` }; }
  if (k === 2) { const a = ri(2, 5); return { prompt: `Evaluate.<span class="big">(${MINUS}${a})³</span>`, ...sgnNum(-(a ** 3)), why: `(${MINUS}${a}) × (${MINUS}${a}) × (${MINUS}${a}) = ${a * a} × (${MINUS}${a}) = ${n(-(a ** 3))}. An odd number of negatives gives a negative.` }; }
  const a = ri(2, 6), b = ri(-10, 10), c = pick([-4, -3, -2, 2, 3, 4]);
  const v = b - a * a * c;
  return { prompt: `Evaluate.<span class="big">${n(b)} − (${MINUS}${a})² × ${br(c)}</span>`, ...sgnNum(v), why: `Powers first: (${MINUS}${a})² = ${a * a}. Then ${a * a} × ${br(c)} = ${n(a * a * c)}. Finally ${n(b)} − ${br(a * a * c)} = ${n(v)}.` };
});

add("expected", "e-multi-step", "Multi-step calculations", () => {
  for (;;) {
    const a = nz(-15, 15), b = nz(-15, 15), d = pick([-4, -3, -2, 2, 3, 4]), m = nz(-5, 5);
    const top = a + b;
    if (top === 0 || top % d) continue;
    const v = (top / d) * m;
    if (Math.abs(v) > 60) continue;
    return {
      prompt: `Evaluate.<span class="big">(${n(a)} + ${br(b)}) ÷ ${br(d)} × ${br(m)}</span>`,
      ...sgnNum(v),
      why: `Brackets: ${n(a)} + ${br(b)} = ${n(top)}. Then work left to right: ${n(top)} ÷ ${br(d)} = ${n(top / d)}, and ${br(top / d)} × ${br(m)} = ${n(v)}.`,
    };
  }
});

add("expected", "e-missing", "Find the missing integer", () => {
  const k = ri(0, 3);
  if (k === 0) { const x = nz(-12, 12), b = neg(2, 12), r = x - b; return { prompt: `What number goes in the box?<span class="big">☐ − (${n(b)}) = ${n(r)}</span>`, ...sgnNum(x), why: `☐ − (${n(b)}) is ☐ + ${-b}. So ☐ = ${n(r)} − ${-b} = ${n(x)}.` }; }
  if (k === 1) { const a = nz(-9, 9), x = nz(-9, 9); if (Math.abs(a) === 1) return T.find((t) => t.id === "e-missing").gen(); return { prompt: `What number goes in the box?<span class="big">${br(a)} × ☐ = ${n(a * x)}</span>`, ...sgnNum(x), why: `☐ = ${n(a * x)} ÷ ${br(a)} = ${n(x)}.` }; }
  if (k === 2) { const x = nz(-9, 9), d = pick([-6, -5, -4, -3, -2, 2, 3]); return { prompt: `What number goes in the box?<span class="big">☐ ÷ ${br(d)} = ${n(x)}</span>`, ...sgnNum(x * d), why: `☐ = ${n(x)} × ${br(d)} = ${n(x * d)}.` }; }
  const a = ri(-12, 12), x = nz(-12, 12);
  return { prompt: `What number goes in the box?<span class="big">${n(a)} + ☐ = ${n(a + x)}</span>`, ...sgnNum(x), why: `☐ = ${n(a + x)} − ${br(a)} = ${n(x)}.` };
});

add("expected", "e-context", "Integers in context", () => {
  const k = ri(0, 4);
  if (k === 0) {
    const bal = ri(20, 120), spend = ri(bal + 15, bal + 140), dep = ri(20, 80);
    const v = bal - spend + dep;
    return { prompt: `Maya's bank balance is $${bal}. She spends $${spend} on a new phone case and headphones, then deposits $${dep}. What is her balance now? (Use a negative number if she is overdrawn.)`, ...sgnNum(v, { pre: "$" }), why: `${bal} − ${spend} + ${dep} = ${n(v)}. Her balance is ${v < 0 ? `−$${-v} (overdrawn)` : `$${v}`}.` };
  }
  if (k === 1) {
    const dive = ri(12, 45), climb = ri(5, dive + 20), v = -dive + climb;
    return { prompt: `A diver is ${dive} m below sea level. She rises ${climb} m. What is her new position relative to sea level? (Below sea level is negative.)`, ...sgnNum(v, { unit: "m" }), why: `${MINUS}${dive} + ${climb} = ${n(v)} m.` };
  }
  if (k === 2) {
    const hi = ri(-2, 18), lo = ri(-20, -3);
    const place = pick(["Thredbo", "Perisher Valley", "Charlotte Pass", "Canberra"]);
    return { prompt: `In ${place} one winter's day, the temperature was ${n(lo)}°C at the coldest time and ${n(hi)}°C at the warmest time. What is the difference between these two temperatures?`, mode: "num", value: hi - lo, unit: "°C", why: `Difference = highest − lowest = ${n(hi)} − (${n(lo)}) = ${n(hi)} + ${-lo} = ${hi - lo}°C.` };
  }
  if (k === 3) {
    const floor = ri(-3, 4), up = ri(3, 9), down = ri(up + 1, up + 8), v = floor + up - down;
    return { prompt: `A lift starts on floor ${n(floor)} (floor 0 is the ground floor and basement levels are negative). It goes up ${up} floors, then down ${down} floors. Which floor is it on now?`, ...sgnNum(v), why: `${n(floor)} + ${up} − ${down} = ${n(v)}.` };
  }
  const per = ri(2, 6), rounds = ri(3, 8), start = ri(0, 10), v = start - per * rounds;
  return { prompt: `In a quiz you start with ${start} points and lose ${per} points for every wrong answer. You get ${rounds} answers wrong and none right. What is your score?`, ...sgnNum(v), why: `${start} + ${rounds} × (${MINUS}${per}) = ${start} − ${per * rounds} = ${n(v)}.` };
});

add("expected", "e-mean", "Average of integers", () => {
  for (;;) {
    const cnt = pick([4, 5, 6]);
    const vals = Array.from({ length: cnt }, () => ri(-12, 9));
    const sum = vals.reduce((a, b) => a + b, 0);
    if (sum % cnt || !vals.some((v) => v < 0)) continue;
    const mean = sum / cnt;
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].slice(0, cnt);
    const html = `<table class="dtab"><tr><th>Day</th>${day.map((d) => `<th>${d}</th>`).join("")}</tr><tr><th>°C</th>${vals.map((v) => `<td>${n(v)}</td>`).join("")}</tr></table>`;
    return {
      prompt: `The table shows the minimum temperature each morning at Mt Kosciuszko. Find the mean (average) minimum temperature.${html}`,
      ...sgnNum(mean, { unit: "°C" }),
      why: `Sum = ${vals.map(br).join(" + ")} = ${n(sum)}. Mean = ${n(sum)} ÷ ${cnt} = ${n(mean)}°C.`,
    };
  }
});

add("expected", "e-truefalse", "Integer rules: true or false", () => {
  const items = [
    ["The product of two negative integers is negative.", false, "A negative × a negative is positive, e.g. (−3) × (−4) = 12."],
    ["The product of three negative integers is negative.", true, "Two of them give a positive; times the third negative gives a negative."],
    ["Subtracting a negative number gives the same result as adding its opposite.", true, "For example 5 − (−2) = 5 + 2 = 7."],
    ["−8 is greater than −3.", false, "−8 is further left on the number line, so −8 < −3."],
    ["(−5)² and −5² have the same value.", false, "(−5)² = 25 but −5² = −25 — only the 5 is squared."],
    ["The sum of two negative integers is always negative.", true, "Moving left from a negative number keeps you below zero."],
    ["A negative number divided by a negative number is positive.", true, "Same signs give a positive, e.g. −12 ÷ (−3) = 4."],
    ["The difference between 4°C and −6°C is 2 degrees.", false, "4 − (−6) = 10, so the difference is 10 degrees."],
    ["0 is greater than every negative integer.", true, "Every negative integer is to the left of 0."],
    ["(−1) multiplied by itself 7 times is −1.", true, "An odd number of negative factors gives a negative: (−1)⁷ = −1."],
  ];
  const [s, t, why] = pick(items);
  return { prompt: `True or false?<span class="say">${s}</span>`, mode: "tf", truth: t, why, key: s };
});

defineBank({
  id: "integers", title: "Integers", outcome: "MA4-INT-C-01",
  levels: {
    basic: { sub: "Compare and order integers, the number line, and the four operations with integers." },
    expected: { sub: "Order of operations, powers of negatives, missing numbers, means and integers in context." },
  },
  types: T,
}, T);
export default T;
