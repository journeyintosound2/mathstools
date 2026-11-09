/**
 * Playground question bank — Fractions, Decimals and Percentages (MA4-FRC-C-01).
 * "Represents and operates with fractions, decimals and percentages to solve
 * problems."
 *
 * Written for the game in the shared-bank format. Covers the content of the
 * site's FDP quiz: equivalent fractions, compare and order, the four
 * operations with fractions and decimals, terminating and recurring
 * decimals, conversions, percentages of quantities, one quantity as a
 * fraction or percentage of another, percentage change, and money problems
 * (discount, GST, profit and loss). Diagrams use the fdp-engine.
 *
 * Fraction answers use mode "frac": any equivalent VALUE in the asked form is
 * marked right, and an unsimplified fraction is a nudge, never a lost mark.
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
import "../exprCheck.js";

const { ri, pick, shuffle, sample, fmt, gcd, lcm, frac, round } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const M = (s) => `<span class="m">${s}</span>`;
const F = (n, d) => frac(n, d);
/* a fraction drawn exactly as given (no simplifying; "?" allowed) */
const FR = (t, b) => `<span class="fr"><span class="frn">${t}</span><span class="frd">${b}</span></span>`;
const FDP = (config, scale = 0.95) => ({ engine: "fdp-engine", config, scale, maxH: 220 });
const simp = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
const fracQ = (n, d, extra = {}) => { const [a, b] = simp(n, d); return { mode: "frac", n: a, d: b, form: "fraction", answerHTML: mixedHTML(a, b), ...extra }; };
function mixedHTML(n, d) {
  if (d === 1) return fmt(n);
  if (Math.abs(n) < d) return F(n, d);
  const w = Math.trunc(n / d), r = Math.abs(n % d);
  return `${F(n, d)} = ${fmt(w)}${F(r, d)}`;
}
const money = (v) => "$" + v.toFixed(2);
const dot = (s) => `<span class="rdot">${s}</span>`; // recurring digit
const num = (v, dp = 4) => fmt(round(v, dp));

/* "Nice" fractions with known decimals and percentages */
const FRIENDLY = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [1, 25], [4, 25], [12, 25], [1, 50], [9, 50], [3, 2], [5, 4]];

/* ================================ BASIC ================================ */
add("basic", "b-shaded", "Fraction of a shape", () => {
  const d = pick([4, 5, 6, 8, 10, 12]), n = ri(1, d - 1);
  const kind = pick(["fraction-bar", "fraction-circle"]);
  const [a, b] = simp(n, d);
  const shape = kind === "fraction-bar" ? "bar" : "circle";
  return {
    prompt: `What fraction of the ${shape} is shaded? Give your answer in simplest form.`,
    diagram: FDP({ diagramType: kind, numerator: n, denominator: d, showLabel: false }, kind === "fraction-bar" ? 0.95 : 0.75),
    ...fracQ(n, d),
    why: `${n} of the ${d} equal parts are shaded: ${F(n, d)}${a !== n ? ` = ${F(a, b)} (divide top and bottom by ${n / a})` : ""}.`,
    key: `${kind}${n}/${d}`,
  };
});

add("basic", "b-equivalent", "Equivalent fractions and simplifying", () => {
  if (Math.random() < 0.5) {
    const b = ri(3, 12), a = ri(1, b - 1), k = ri(2, 9);
    const [s1, s2] = simp(a, b);
    return { prompt: `Write ${FR(a * k, b * k)} in simplest form.`, ...fracQ(a * k, b * k), why: `The highest common factor of ${a * k} and ${b * k} is ${gcd(a * k, b * k)}. Divide both by it: ${F(s1, s2)}.` };
  }
  const [a, b] = pick(FRIENDLY.filter(([x, y]) => y <= 10 && x < y)), k = ri(2, 8);
  const top = Math.random() < 0.5;
  return top
    ? { prompt: `Find the missing number.<span class="big">${F(a, b)} = ${FR("?", b * k)}</span>`, mode: "num", value: a * k, why: `${b} × ${k} = ${b * k}, so multiply the numerator by ${k} too: ${a} × ${k} = ${a * k}.` }
    : { prompt: `Find the missing number.<span class="big">${F(a, b)} = ${FR(a * k, "?")}</span>`, mode: "num", value: b * k, why: `${a} × ${k} = ${a * k}, so multiply the denominator by ${k} too: ${b} × ${k} = ${b * k}.` };
});

add("basic", "b-convert", "Convert between fractions, decimals and percentages", () => {
  const [a, b] = pick(FRIENDLY);
  const dec = a / b, pct = round(dec * 100, 4);
  const k = ri(0, 5);
  const pairs = [
    [`Write ${F(a, b)} as a decimal.`, "decimal", `${a} ÷ ${b} = ${num(dec)}.`],
    [`Write ${F(a, b)} as a percentage.`, "percent", `${F(a, b)} × 100% = ${num(pct)}%.`],
    [`Write ${M(num(dec))} as a fraction in simplest form.`, "fraction", `${M(num(dec))} = ${FR(Math.round(dec * 1000), 1000)} = ${F(a, b)}.`],
    [`Write ${M(num(pct) + "%")} as a fraction in simplest form.`, "fraction", `${num(pct)}% = ${FR(num(pct), 100)} = ${F(a, b)}.`],
    [`Write ${M(num(dec))} as a percentage.`, "percent", `Multiply by 100: ${num(dec)} × 100 = ${num(pct)}%.`],
    [`Write ${M(num(pct) + "%")} as a decimal.`, "decimal", `Divide by 100: ${num(pct)} ÷ 100 = ${num(dec)}.`],
  ];
  const [prompt, form, why] = pairs[k];
  const [sa, sb] = simp(a, b);
  const answerHTML = form === "decimal" ? num(dec) : form === "percent" ? num(pct) + "%" : mixedHTML(sa, sb);
  return { prompt, mode: "frac", n: sa, d: sb, form, answerHTML, why, placeholder: form === "percent" ? "e.g. 35%" : form === "decimal" ? "e.g. 0.35" : "e.g. 7/20" };
});

add("basic", "b-compare", "Compare fractions, decimals and percentages", () => {
  for (;;) {
    const picks = sample(FRIENDLY.filter(([x, y]) => x < y), 4);
    const vals = picks.map(([x, y]) => x / y);
    if (new Set(vals.map((v) => v.toFixed(6))).size < 4) continue;
    const forms = shuffle(["frac", "dec", "pct", pick(["frac", "dec", "pct"])]);
    const shown = picks.map(([x, y], i) => forms[i] === "frac" ? F(x, y) : forms[i] === "dec" ? M(num(x / y)) : M(num(x / y * 100) + "%"));
    const askMax = Math.random() < 0.6;
    const target = askMax ? Math.max(...vals) : Math.min(...vals);
    const correct = vals.indexOf(target);
    return {
      prompt: `Which of these is the <b>${askMax ? "largest" : "smallest"}</b>?`,
      mode: "mc", options: shown, correct,
      why: `As decimals: ${vals.map((v) => num(v)).join(", ")}. The ${askMax ? "largest" : "smallest"} is ${num(target)}.`,
    };
  }
});

add("basic", "b-addsub", "Add and subtract fractions", () => {
  for (;;) {
    const d1 = pick([2, 3, 4, 5, 6]), d2 = d1 * pick([2, 3]);
    let n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
    const op = pick(["+", "−"]);
    let A = [n1, d1], B = [n2, d2];
    if (Math.random() < 0.5) [A, B] = [B, A];
    if (op === "−" && A[0] / A[1] <= B[0] / B[1]) [A, B] = [B, A];
    const L = lcm(A[1], B[1]);
    const top = A[0] * (L / A[1]) + (op === "+" ? 1 : -1) * B[0] * (L / B[1]);
    if (top === 0) continue;
    return {
      prompt: `Evaluate. Give your answer in simplest form.<span class="big">${F(A[0], A[1])} ${op} ${F(B[0], B[1])}</span>`,
      ...fracQ(top, L),
      why: `Common denominator ${L}: ${F(A[0] * (L / A[1]), L)} ${op} ${F(B[0] * (L / B[1]), L)} = ${F(top, L)}${gcd(top, L) > 1 ? ` = ${F(...simp(top, L))}` : ""}.`,
    };
  }
});

add("basic", "b-percent-of", "Percentage of a quantity", () => {
  for (;;) {
    const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 12.5, 35]);
    const q = pick([20, 40, 60, 80, 120, 160, 200, 240, 300, 360, 400, 480, 640]);
    const v = (p * q) / 100;
    if (!Number.isInteger(v * 100)) continue;
    const ctx = pick([["", ""], ["kg", " of potatoes"], ["students", " in Year 7"], ["$", ""], ["km", " walking track"]]);
    const unitText = ctx[0] === "$" ? `$${q}` : ctx[0] ? `${q} ${ctx[0]}${ctx[1]}` : `${q}`;
    return {
      prompt: `Find ${M(fmt(p) + "%")} of ${unitText}.`,
      mode: "num", value: v, pre: ctx[0] === "$" ? "$" : "", unit: ctx[0] && ctx[0] !== "$" ? ctx[0] : "",
      why: `${fmt(p)}% = ${F(Math.round(p * 10), 1000)}, so ${fmt(p)}% of ${q} = ${fmt(p)} ÷ 100 × ${q} = ${num(v)}.`,
    };
  }
});

add("basic", "b-decimal-ops", "Decimal calculations", () => {
  const k = ri(0, 2);
  if (k === 0) {
    const v = ri(12, 9999) / pick([10, 100, 1000]), pw = pick([10, 100, 1000]), op = pick(["×", "÷"]);
    const ans = op === "×" ? v * pw : v / pw;
    return { prompt: `Evaluate.<span class="big">${num(v)} ${op} ${pw}</span>`, mode: "num", value: round(ans, 6), why: `${op === "×" ? "Multiplying" : "Dividing"} by ${pw} moves every digit ${Math.log10(pw)} place${pw === 10 ? "" : "s"} to the ${op === "×" ? "left (into bigger place values)" : "right (into smaller place values)"}: ${num(ans, 6)}.` };
  }
  const a = ri(105, 9990) / pick([10, 100]), b = ri(12, 990) / pick([10, 100]);
  const op = pick(["+", "−"]);
  let [x, y] = op === "−" && b > a ? [b, a] : [a, b];
  const ans = op === "+" ? x + y : x - y;
  return { prompt: `Evaluate.<span class="big">${num(x)} ${op} ${num(y)}</span>`, mode: "num", value: round(ans, 4), why: `Line up the decimal points: ${num(x)} ${op} ${num(y)} = ${num(ans)}.` };
});

add("basic", "b-round", "Round decimals", () => {
  const v = ri(10001, 999999) / 10000;
  const dp = pick([0, 1, 2, 3]);
  const r = round(v, dp);
  const place = ["the nearest whole number", "1 decimal place", "2 decimal places", "3 decimal places"][dp];
  return {
    prompt: `Round ${M(v.toFixed(4))} to ${place}.`,
    mode: "num", value: r, tol: 1e-9, answerHTML: r.toFixed(dp),
    why: `Look at the next digit after the ${dp === 0 ? "units" : `${["", "1st", "2nd", "3rd"][dp]} decimal place`}: ${v.toFixed(4)[v.toFixed(4).indexOf(".") + dp + 1]}. ${Number(v.toFixed(4)[v.toFixed(4).indexOf(".") + dp + 1]) >= 5 ? "It is 5 or more, so round up" : "It is less than 5, so round down"}: ${r.toFixed(dp)}.`,
  };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-mixed", "Add and subtract mixed numbers", () => {
  for (;;) {
    const d1 = pick([3, 4, 5, 6, 8, 10]), d2 = pick([3, 4, 5, 6, 8, 9, 10, 12]);
    if (d1 === d2 || lcm(d1, d2) > 40) continue;
    const w1 = ri(1, 5), w2 = ri(1, 4), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
    const op = pick(["+", "−"]);
    let A = [w1 * d1 + n1, d1, w1, n1], B = [w2 * d2 + n2, d2, w2, n2];
    if (op === "−" && A[0] / A[1] <= B[0] / B[1]) [A, B] = [B, A];
    const L = lcm(A[1], B[1]);
    const top = A[0] * (L / A[1]) + (op === "+" ? 1 : -1) * B[0] * (L / B[1]);
    if (top <= 0) continue;
    const mx = (w, n2_, d) => `${w}${F(n2_, d)}`;
    return {
      prompt: `Evaluate. Give your answer as a mixed number in simplest form.<span class="big">${M(mx(A[2], A[3], A[1]))} ${op} ${M(mx(B[2], B[3], B[1]))}</span>`,
      ...fracQ(top, L), placeholder: "e.g. 2 3/4",
      why: `As improper fractions: ${F(A[0], A[1])} ${op} ${F(B[0], B[1])} = ${F(A[0] * (L / A[1]), L)} ${op} ${F(B[0] * (L / B[1]), L)} = ${F(top, L)}${(() => { const [p, q] = simp(top, L); const w = Math.floor(p / q); return q === 1 ? ` = ${p}` : w ? ` = ${w}${F(p % q, q)}` : (p !== top ? ` = ${F(p, q)}` : ""); })()}.`,
    };
  }
});

add("expected", "e-multdiv", "Multiply and divide fractions", () => {
  for (;;) {
    const op = pick(["×", "÷"]);
    const mixedA = Math.random() < 0.35;
    const d1 = ri(2, 9), n1 = ri(1, d1 - 1), w1 = mixedA ? ri(1, 3) : 0;
    const d2 = ri(2, 9), n2 = ri(1, d2 - 1);
    const A = [w1 * d1 + n1, d1];
    const [tn, td] = op === "×" ? [A[0] * n2, A[1] * d2] : [A[0] * d2, A[1] * n2];
    const [sn, sd] = simp(tn, td);
    if (sd === 1 && Math.random() < 0.6) continue;
    const shownA = mixedA ? M(`${w1}${F(n1, d1)}`) : F(n1, d1);
    return {
      prompt: `Evaluate. Give your answer in simplest form.<span class="big">${shownA} ${op} ${F(n2, d2)}</span>`,
      ...fracQ(tn, td),
      why: `${mixedA ? `${w1}${F(n1, d1)} = ${F(A[0], A[1])}. ` : ""}${op === "÷" ? `Dividing by ${F(n2, d2)} is multiplying by ${F(d2, n2)}. ` : ""}${F(A[0], A[1])} × ${op === "×" ? F(n2, d2) : F(d2, n2)} = ${F(tn, td)}${gcd(tn, td) > 1 ? ` = ${F(sn, sd)}` : ""}.`,
    };
  }
});

add("expected", "e-decimal-multdiv", "Multiply and divide decimals", () => {
  if (Math.random() < 0.5) {
    const a = ri(12, 95) / 10, b = ri(2, 9) / pick([10, 100]);
    const v = round(a * b, 6);
    return { prompt: `Evaluate.<span class="big">${num(a)} × ${num(b)}</span>`, mode: "num", value: v, why: `${Math.round(a * 10)} × ${Math.round(b * (b < 0.1 ? 100 : 10))} = ${Math.round(a * 10) * Math.round(b * (b < 0.1 ? 100 : 10))}. There are ${b < 0.1 ? 3 : 2} decimal places in the question, so ${num(v, 6)}.` };
  }
  const b = ri(2, 9) / pick([10, 10, 100]), q = ri(2, 15), a = round(b * q, 6);
  return { prompt: `Evaluate.<span class="big">${num(a, 6)} ÷ ${num(b)}</span>`, mode: "num", value: q, why: `Multiply both numbers by ${b < 0.1 ? 100 : 10} so you divide by a whole number: ${num(a * (b < 0.1 ? 100 : 10), 6)} ÷ ${num(b * (b < 0.1 ? 100 : 10))} = ${q}.` };
});

add("expected", "e-recurring", "Terminating and recurring decimals", () => {
  const items = [
    { f: [1, 3], txt: `0.${dot(3)}`, wrong: ["0.3", "0.33", `0.3${dot(3)}`] },
    { f: [2, 3], txt: `0.${dot(6)}`, wrong: ["0.6", "0.67", `0.${dot(6)}7`] },
    { f: [1, 6], txt: `0.1${dot(6)}`, wrong: [`0.${dot(1)}${dot(6)}`, "0.16", `0.${dot(1)}6`] },
    { f: [5, 6], txt: `0.8${dot(3)}`, wrong: [`0.${dot(8)}${dot(3)}`, "0.83", `0.${dot(8)}`] },
    { f: [1, 9], txt: `0.${dot(1)}`, wrong: ["0.1", "0.11", "0.19"] },
    { f: [4, 9], txt: `0.${dot(4)}`, wrong: ["0.4", "0.49", "0.44"] },
    { f: [1, 11], txt: `0.${dot(0)}${dot(9)}`, wrong: [`0.${dot(9)}`, "0.09", `0.0${dot(9)}`] },
    { f: [3, 11], txt: `0.${dot(2)}${dot(7)}`, wrong: [`0.${dot(2)}7`, "0.27", `0.2${dot(7)}`] },
    { f: [7, 12], txt: `0.58${dot(3)}`, wrong: [`0.5${dot(8)}${dot(3)}`, "0.583", `0.${dot(5)}8${dot(3)}`] },
    { f: [2, 15], txt: `0.1${dot(3)}`, wrong: [`0.${dot(1)}${dot(3)}`, "0.13", `0.${dot(1)}3`] },
  ];
  const TERM = [[3, 8], [7, 20], [9, 40], [11, 25], [5, 16], [3, 4], [13, 50], [7, 8]];
  if (Math.random() < 0.4) {
    const askTerm = Math.random() < 0.5;
    const right = askTerm ? pick(TERM) : pick(items).f;
    const others = askTerm ? sample(items, 3).map((i) => i.f) : sample(TERM, 3);
    const opts = shuffle([right, ...others]);
    const recTxt = !askTerm ? items.find((i) => i.f === right).txt : null;
    return {
      prompt: `Which fraction gives a <b>${askTerm ? "terminating" : "recurring"}</b> decimal?`,
      mode: "mc", options: opts.map(([a, b]) => F(a, b)), correct: opts.indexOf(right),
      why: `A fraction in simplest form terminates only when its denominator has no prime factors other than 2 and 5. ${F(right[0], right[1])} = ${askTerm ? num(right[0] / right[1]) : recTxt}.`,
    };
  }
  const it = pick(items);
  const opts = shuffle([it.txt, ...it.wrong]);
  return {
    prompt: `Write ${F(it.f[0], it.f[1])} as a decimal, using dot notation for the recurring part.`,
    mode: "mc", options: opts.map((o) => M(o)), correct: opts.indexOf(it.txt),
    why: `${it.f[0]} ÷ ${it.f[1]} = ${(it.f[0] / it.f[1]).toFixed(6)}…, so ${F(it.f[0], it.f[1])} = ${it.txt}. A dot goes over the first and last digit of the repeating block.`,
  };
});

add("expected", "e-quantity-as", "One quantity as a percentage of another", () => {
  const items = [
    () => { const t = pick([24, 25, 30, 40, 50]), s = ri(1, t - 1); return [`Ava scored ${s} out of ${t} on a test. What percentage is this?`, s, t, "percent"]; },
    () => { const m = pick([15, 20, 30, 36, 45, 48]); return [`What percentage of 2 hours is ${m} minutes?`, m, 120, "percent"]; },
    () => { const c = pick([25, 40, 50, 60, 75, 80]); return [`What percentage of $2 is ${c} cents?`, c, 200, "percent"]; },
    () => { const g = pick([150, 200, 250, 400, 600, 750]); return [`What fraction of 1 kg is ${g} g? Give your answer in simplest form.`, g, 1000, "fraction"]; },
    () => { const cm = pick([30, 45, 60, 75, 80, 90]); return [`Write ${cm} cm as a fraction of 2 m, in simplest form.`, cm, 200, "fraction"]; },
    () => { const t = pick([28, 30, 32]), g = ri(8, t - 6); return [`A class has ${t} students and ${g} of them catch the bus. What percentage catch the bus? (Give your answer to 1 decimal place if needed.)`, g, t, "percentdp"]; },
  ];
  const [prompt, a, b, form] = pick(items)();
  const [sa, sb] = simp(a, b);
  const pct = (a / b) * 100;
  if (form === "percentdp") {
    return { prompt, mode: "num", value: round(pct, 1), tol: 0.051, unit: "%", answerHTML: `${num(pct, 1)}%`, why: `${a} ÷ ${b} × 100 = ${num(pct, 3)}… ≈ ${num(pct, 1)}%.` };
  }
  if (form === "percent" && !Number.isInteger(pct * 100)) return T.find((t) => t.id === "e-quantity-as").gen();
  return {
    prompt, mode: "frac", n: sa, d: sb, form, placeholder: form === "percent" ? "e.g. 35%" : "e.g. 3/8",
    answerHTML: form === "percent" ? `${num(pct)}%` : F(sa, sb),
    why: `Use the same units: ${F(a, b)}${gcd(a, b) > 1 ? ` = ${F(sa, sb)}` : ""}${form === "percent" ? `, and ${F(sa, sb)} × 100% = ${num(pct)}%` : ""}.`,
  };
});

add("expected", "e-pct-change", "Percentage increase and decrease", () => {
  const k = ri(0, 2);
  if (k < 2) {
    const amt = pick([40, 60, 80, 120, 150, 200, 240, 360, 450, 500]), p = pick([5, 10, 12, 15, 20, 25, 30, 35, 40]);
    const up = k === 0, v = amt * (1 + (up ? p : -p) / 100);
    const ctx = up ? pick([`A gym membership costs $${amt}. The price rises by ${p}%. What is the new price?`, `Increase $${amt} by ${p}%.`]) : pick([`A school's water use was ${amt} kL. It cut its use by ${p}%. How much water does it use now?`, `Decrease ${amt} by ${p}%.`]);
    const isMoney = ctx.includes("$");
    return { prompt: ctx, mode: "num", value: round(v, 2), pre: isMoney ? "$" : "", unit: ctx.includes("kL") ? "kL" : "", why: `${up ? "Increase" : "Decrease"} by ${p}% means find ${up ? 100 + p : 100 - p}%: ${amt} × ${num((up ? 100 + p : 100 - p) / 100)} = ${num(v, 2)}.` };
  }
  const old = pick([20, 40, 50, 80, 120, 160, 200, 250]), p = pick([10, 15, 20, 25, 30, 40, 50, 60]), up = Math.random() < 0.5;
  const nw = old * (1 + (up ? p : -p) / 100);
  if (!Number.isInteger(nw)) return T.find((t) => t.id === "e-pct-change").gen();
  return { prompt: `The number of students in a lunchtime club ${up ? "grew" : "fell"} from ${old} to ${nw}. Find the percentage ${up ? "increase" : "decrease"}.`, mode: "num", value: p, unit: "%", why: `Change = ${Math.abs(nw - old)}. Percentage change = ${Math.abs(nw - old)} ÷ ${old} × 100 = ${p}%. (Always divide by the ORIGINAL amount.)` };
});

add("expected", "e-money", "Discounts, GST, profit and loss", () => {
  const items = ["jacket", "pair of runners", "calculator", "school bag", "bike helmet", "skateboard", "phone case"];
  const k = ri(0, 3);
  if (k === 0) {
    const price = pick([40, 60, 80, 90, 120, 150, 180, 240]), p = pick([10, 15, 20, 25, 30, 35, 40]), v = price * (1 - p / 100);
    return { prompt: `A ${pick(items)} is marked at $${price}. It is on sale with a ${p}% discount. What is the sale price?`, mode: "num", value: round(v, 2), pre: "$", answerHTML: money(v), why: `Discount = ${p}% of $${price} = $${num(price * p / 100, 2)}. Sale price = $${price} − $${num(price * p / 100, 2)} = ${money(v)}.` };
  }
  if (k === 1) {
    const pre = pick([20, 35, 45, 60, 80, 120, 150, 240]), v = pre * 1.1;
    return { prompt: `A ${pick(items)} costs $${pre} before GST. GST of 10% is added. What is the price including GST?`, mode: "num", value: round(v, 2), pre: "$", answerHTML: money(v), why: `GST = 10% of $${pre} = $${num(pre / 10, 2)}. Total = $${pre} + $${num(pre / 10, 2)} = ${money(v)} (or $${pre} × 1.1).` };
  }
  if (k === 2) {
    const pre = pick([20, 40, 50, 80, 100, 150, 200]), inc = pre * 1.1;
    return { prompt: `A receipt shows a total of ${money(inc)}, including 10% GST. How much of this is GST?`, mode: "num", value: round(pre / 10, 2), pre: "$", answerHTML: money(pre / 10), why: `The GST-inclusive price is 110% of the original, so GST = ${money(inc)} ÷ 11 = ${money(pre / 10)}.` };
  }
  const cost = pick([20, 40, 50, 80, 120, 160, 200]), p = pick([-25, -20, -10, 10, 15, 20, 25, 40, 50]), sell = cost * (1 + p / 100);
  return { prompt: `A shop buys a ${pick(items)} for $${cost} and sells it for ${money(sell)}. Find the ${p > 0 ? "profit" : "loss"} as a percentage of the cost price.`, mode: "num", value: Math.abs(p), unit: "%", why: `${p > 0 ? "Profit" : "Loss"} = ${money(Math.abs(sell - cost))}. As a percentage of cost: ${num(Math.abs(sell - cost), 2)} ÷ ${cost} × 100 = ${Math.abs(p)}%.` };
});

add("expected", "e-order", "Order fractions, decimals and percentages", () => {
  for (;;) {
    const pool = [[1.25, F(5, 4)], [1.2, M("1.2")], [4 / 3, M(`1${F(1, 3)}`)], [-0.4, M("−0.4")], [-0.5, F(-1, 2)], [0.75, M("75%")], [0.875, F(7, 8)], [2 / 3, M(`0.${dot(6)}`)], [0.65, M("65%")], [0.7, M("0.7")], [0.62, M("62%")], [0.6, F(3, 5)], [0.08, M("8%")], [0.125, M("0.125")]];
    const items = sample(pool, 4).map(([v, h]) => ({ v, h }));
    if (new Set(items.map((i) => i.v.toFixed(6))).size < 4) continue;
    const asc = items.slice().sort((x, y) => x.v - y.v);
    const list = (arr) => arr.map((i) => i.h).join(", &nbsp;");
    const wrongs = [];
    const tries = [asc.slice().reverse(), [asc[1], asc[0], asc[2], asc[3]], [asc[0], asc[2], asc[1], asc[3]], [asc[0], asc[1], asc[3], asc[2]]];
    for (const t of tries) if (wrongs.length < 3) wrongs.push(t);
    const opts = shuffle([asc, ...wrongs]);
    return {
      prompt: `Which list is in order from <b>smallest to largest</b>?`,
      mode: "mc", options: opts.map(list), correct: opts.indexOf(asc), mcLong: true,
      why: `As decimals: ${asc.map((i) => num(i.v, 3)).join(" < ")}.`,
    };
  }
});

defineBank({
  id: "fdp", title: "Fractions, Decimals and Percentages", outcome: "MA4-FRC-C-01",
  levels: {
    basic: { sub: "Equivalent fractions, conversions, comparing, adding and subtracting fractions, percentages of quantities, decimals." },
    expected: { sub: "Mixed numbers, multiplying and dividing fractions and decimals, recurring decimals, percentage change and money problems." },
  },
  types: T,
}, T);
export default T;
