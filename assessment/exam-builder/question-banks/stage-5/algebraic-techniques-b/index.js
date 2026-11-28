/*
  Mills Maths Tools — Stage 5 Question Bank: Algebraic Techniques B
  ------------------------------------------------------------------
  question-banks/stage-5/algebraic-techniques-b/index.js

  NSW Mathematics K–10 (2022), Stage 5, MA5-ALG-P-01 (Path):
    "simplifies algebraic fractions involving indices, and expands and
     factorises algebraic expressions"

  Content:
    - the four operations with algebraic fractions that have pronumerals
      (and indices) in the denominator
    - factorising by taking out a common factor — numerical, algebraic,
      negative, and a common BINOMIAL factor
    - expanding binomial products
    - factorising monic quadratic trinomials x² + bx + c, including with an
      area model

  Algebraic techniques A (MA5-ALG-C-01) already covers numerical-denominator
  fractions and single-bracket expansion; special products, grouping and
  non-monic quadratics are Algebraic techniques C.

  Every factorised answer is re-expanded by tools/stage5-algebra.mjs.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, gcd
} from "../../_shared/bank-helpers.js";
import { sup, mono, num, afrac, MINUS, joinTerms, poly, lin, bin } from "../../_shared/algebra-helpers.js";

const TOPIC = "Algebraic Techniques B";

const TYPE_LIST = [
  { id: "add-fractions-pronumeral", label: "Add and subtract algebraic fractions (pronumeral denominators)" },
  { id: "multiply-algebraic-fractions", label: "Multiply algebraic fractions with indices" },
  { id: "divide-algebraic-fractions", label: "Divide algebraic fractions with indices" },
  { id: "factorise-hcf", label: "Factorise: highest common factor" },
  { id: "factorise-negative-hcf", label: "Factorise with a negative common factor" },
  { id: "factorise-binomial-factor", label: "Factorise: a common binomial factor" },
  { id: "expand-binomial", label: "Expand binomial products" },
  { id: "factorise-monic", label: "Factorise monic quadratics" },
  { id: "factorise-area-model", label: "Factorise using an area model" },
  { id: "expand-and-simplify", label: "Expand and simplify" },
  { id: "factorise-check", label: "Check a factorisation" },
  { id: "multi-part-algebra-b", label: "Multi-part expand and factorise problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage5", "algebra", ...(spec.tags || [])] });
const V = ["x", "a", "m", "n", "p", "y", "k"];
const algebra = config => ({ engine: "algebra-engine", config });
const nz = (lo, hi) => { let v; do { v = randInt(lo, hi); } while (v === 0); return v; };

/* ── algebraic fractions ─────────────────────────────────── */

function addFractionsPronumeralQuestion() {
  const x = choice(V);
  const v = choice(["same", "multiple", "different-vars", "power"]);
  const a = randInt(1, 9); const b = randInt(1, 9); const sub = Math.random() < 0.4;
  if (v === "same") {
    const r = sub ? a - b : a + b;
    if (r === 0) return addFractionsPronumeralQuestion();
    return q({ type: "add-fractions-pronumeral", marks: 1, prompt: `Simplify ${afrac(String(a), x)} ${sub ? MINUS : "+"} ${afrac(String(b), x)}.`, answer: r < 0 ? `${MINUS}${afrac(String(-r), x)}` : afrac(String(r), x), working: [`Same denominator: ${a} ${sub ? MINUS : "+"} ${b} = ${num(r)}`], space: SPACE_SIZES.SMALL, mcDistractors: [afrac(String(sub ? a - b : a + b), `2${x}`), afrac(String(sub ? a - b : a + b), `${x}²`)], tags: ["algebraic fractions"] });
  }
  if (v === "multiple") {
    const d1 = randInt(2, 3); const d2 = d1 * randInt(2, 3);
    const top = a * (d2 / d1) + (sub ? -b : b);
    const g = gcd(Math.abs(top), d2);
    if (top === 0) return addFractionsPronumeralQuestion();
    const ans = d2 / g === 1 ? afrac(String(top / g), x) : afrac(String(Math.abs(top / g)), `${d2 / g}${x}`);
    return q({ type: "add-fractions-pronumeral", marks: 2, prompt: `Simplify ${afrac(String(a), `${d1}${x}`)} ${sub ? MINUS : "+"} ${afrac(String(b), `${d2}${x}`)}.`, answer: top < 0 ? `${MINUS}${ans}` : ans, working: [`Common denominator ${d2}${x}: ${afrac(String(a * (d2 / d1)), `${d2}${x}`)} ${sub ? MINUS : "+"} ${afrac(String(b), `${d2}${x}`)}`, `= ${top}/${d2}${x}${g > 1 ? " and simplify" : ""}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [afrac(String(a + b), `${d1 + d2}${x}`), afrac(String(a + b), `${d1 * d2}${x}`)], tags: ["algebraic fractions"] });
  }
  if (v === "different-vars") {
    const [p, r] = sample(V, 2).sort();
    return q({ type: "add-fractions-pronumeral", marks: 2, prompt: `Simplify ${afrac(String(a), p)} ${sub ? MINUS : "+"} ${afrac(String(b), r)}.`, answer: afrac(joinTerms([mono(a, { [r]: 1 }), mono(sub ? -b : b, { [p]: 1 })]), `${p}${r}`), working: [`Common denominator ${p}${r}`, `${afrac(mono(a, { [r]: 1 }), `${p}${r}`)} ${sub ? MINUS : "+"} ${afrac(mono(b, { [p]: 1 }), `${p}${r}`)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [afrac(String(sub ? a - b : a + b), `${p} + ${r}`), afrac(String(sub ? a - b : a + b), `${p}${r}`)], tags: ["algebraic fractions"] });
  }
  // a/x + b/x²
  return q({ type: "add-fractions-pronumeral", marks: 2, prompt: `Simplify ${afrac(String(a), x)} ${sub ? MINUS : "+"} ${afrac(String(b), `${x}²`)}.`, answer: afrac(joinTerms([mono(a, { [x]: 1 }), num(sub ? -b : b)]), `${x}²`), working: [`Common denominator ${x}²: ${afrac(mono(a, { [x]: 1 }), `${x}²`)} ${sub ? MINUS : "+"} ${afrac(String(b), `${x}²`)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [afrac(String(sub ? a - b : a + b), `${x}³`), afrac(String(sub ? a - b : a + b), `${x}²`)], tags: ["algebraic fractions", "indices"] });
}

/* Product/quotient of monomials as a single simplified fraction. */
function fracOf(cn, cd, vars) {
  const g = gcd(cn, cd);
  const n = cn / g; const d = cd / g;
  const top = {}; const bot = {};
  Object.entries(vars).forEach(([v, e]) => { if (e > 0) top[v] = e; if (e < 0) bot[v] = -e; });
  const T = mono(Math.abs(n), top);
  const B = Object.keys(bot).length ? mono(d, bot) : d === 1 ? "" : String(d);
  const sign = n < 0 ? MINUS : "";
  return B ? `${sign}${afrac(T, B)}` : `${sign}${T}`;
}

function multiplyAlgebraicFractionsQuestion() {
  const [x, y] = sample(V, 2).sort();
  const a = randInt(1, 4); const b = randInt(1, 4); let c = randInt(1, 4); let d = randInt(1, 4);
  if (d === a) d = a + 1;
  if (c === b) c = b + 1;
  const k1 = randInt(2, 9); const k2 = randInt(2, 9); const k3 = randInt(2, 9); const k4 = randInt(2, 9);
  const ex = a - d + 0; const ey = c - b;
  // (k1 x^a / k2 y^b) × (k3 y^c / k4 x^d)
  return q({
    type: "multiply-algebraic-fractions", marks: 2,
    prompt: `Simplify ${afrac(mono(k1, { [x]: a }), mono(k2, { [y]: b }))} × ${afrac(mono(k3, { [y]: c }), mono(k4, { [x]: d }))}.`,
    answer: fracOf(k1 * k3, k2 * k4, { [x]: ex, [y]: ey }),
    working: [`Multiply numerators and denominators: ${mono(k1 * k3, { [x]: a, [y]: c })} over ${mono(k2 * k4, { [x]: d, [y]: b })}`, `Cancel: ${k1 * k3}/${k2 * k4}, ${x}${sup(a)}/${x}${sup(d)}, ${y}${sup(c)}/${y}${sup(b)}`],
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [fracOf(k1 * k3, k2 * k4, { [x]: a + d, [y]: b + c }), fracOf(k1 * k4, k2 * k3, { [x]: ex, [y]: ey })],
    tags: ["algebraic fractions", "multiply"]
  });
}

function divideAlgebraicFractionsQuestion() {
  const [x, y] = sample(V, 2).sort();
  const a = randInt(1, 4); const b = randInt(1, 3); const c = randInt(1, 4); const d = randInt(1, 3);
  const k1 = randInt(2, 9); const k2 = randInt(2, 6); const k3 = randInt(2, 9); const k4 = randInt(2, 6);
  // (k1 x^a / k2 y^b) ÷ (k3 x^c / k4 y^d) = k1 k4 x^(a−c) y^(d−b) / (k2 k3)
  return q({
    type: "divide-algebraic-fractions", marks: 2,
    prompt: `Simplify ${afrac(mono(k1, { [x]: a }), mono(k2, { [y]: b }))} ÷ ${afrac(mono(k3, { [x]: c }), mono(k4, { [y]: d }))}.`,
    answer: fracOf(k1 * k4, k2 * k3, { [x]: a - c, [y]: d - b }),
    working: ["Multiply by the reciprocal of the second fraction.", `${afrac(mono(k1, { [x]: a }), mono(k2, { [y]: b }))} × ${afrac(mono(k4, { [y]: d }), mono(k3, { [x]: c }))}`, "Then cancel."],
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [fracOf(k1 * k3, k2 * k4, { [x]: a + c, [y]: -b - d }), fracOf(k1 * k3, k2 * k4, { [x]: a - c, [y]: d - b })],
    tags: ["algebraic fractions", "divide"]
  });
}

/* ── factorising ─────────────────────────────────────────── */

function factoriseHcfQuestion() {
  const x = choice(V);
  const v = choice(["number", "pronumeral", "both", "three-terms", "two-vars"]);
  const g = randInt(2, 9);
  if (v === "number") {
    let p; let r; do { p = randInt(1, 9); r = randInt(1, 9); } while (gcd(p, r) !== 1);
    const sub = Math.random() < 0.4;
    return q({ type: "factorise-hcf", marks: 1, prompt: `Factorise ${joinTerms([mono(g * p, { [x]: 1 }), num(sub ? -g * r : g * r)])}.`, answer: `${g}(${lin(p, sub ? -r : r, x)})`, working: [`HCF of ${g * p} and ${g * r} is ${g}.`, `${g}(${lin(p, sub ? -r : r, x)})`], space: SPACE_SIZES.SMALL, mcDistractors: [`${g * p}(${x} ${sub ? MINUS : "+"} ${r})`, `${g}(${lin(p, sub ? -g * r : g * r, x)})`, `${g}${x}(${p} ${sub ? MINUS : "+"} ${r})`], tags: ["factorise", "HCF"] });
  }
  if (v === "pronumeral") {
    // p and r share no factor, or x(6x − 3) would not be the full factorisation
    let p; let r; do { p = randInt(2, 9); r = randInt(1, 9); } while (gcd(p, r) !== 1);
    return q({ type: "factorise-hcf", marks: 1, prompt: `Factorise ${joinTerms([mono(p, { [x]: 2 }), mono(-r, { [x]: 1 })])}.`, answer: `${x}(${lin(p, -r, x)})`, working: [`Both terms contain ${x}.`], space: SPACE_SIZES.SMALL, mcDistractors: [`${x}²(${p} ${MINUS} ${r})`, `${x}(${p}${x} ${MINUS} ${r}${x})`, `${p}${x}(${x} ${MINUS} ${r})`], tags: ["factorise", "HCF"] });
  }
  if (v === "both") {
    let p; let r; do { p = randInt(1, 6); r = randInt(1, 7); } while (gcd(p, r) !== 1);
    const e = randInt(2, 3);
    return q({ type: "factorise-hcf", marks: 2, prompt: `Factorise ${joinTerms([mono(g * p, { [x]: e }), mono(g * r, { [x]: e - 1 })])} fully.`, answer: `${mono(g, { [x]: e - 1 })}(${lin(p, r, x)})`, working: [`HCF of the coefficients: ${g}; lowest power of ${x}: ${x}${sup(e - 1)}`, `${mono(g, { [x]: e - 1 })}(${lin(p, r, x)})`], space: SPACE_SIZES.SMALL, mcDistractors: [`${g}(${joinTerms([mono(p, { [x]: e }), mono(r, { [x]: e - 1 })])})`, `${mono(g, { [x]: e })}(${p} + ${r})`], tags: ["factorise", "HCF"] });
  }
  if (v === "three-terms") {
    const t = [randInt(1, 5), nz(-6, 6), nz(-7, 7)];
    if (gcd(gcd(t[0], Math.abs(t[1])), Math.abs(t[2])) !== 1) return factoriseHcfQuestion();
    return q({ type: "factorise-hcf", marks: 2, prompt: `Factorise ${joinTerms([mono(g * t[0], { [x]: 3 }), mono(g * t[1], { [x]: 2 }), mono(g * t[2], { [x]: 1 })])} fully.`, answer: `${mono(g, { [x]: 1 })}(${poly([t[0], t[1], t[2]], x)})`, working: [`HCF: ${g}${x}`, `Divide each term by ${g}${x}.`], space: SPACE_SIZES.SMALL, mcDistractors: [`${g}(${poly([t[0], t[1], t[2], 0], x)})`, `${mono(g, { [x]: 2 })}(${poly([t[0], t[1], t[2]], x)})`], tags: ["factorise", "HCF"] });
  }
  const [a, b] = sample(V, 2).sort();
  let p; let r; do { p = randInt(1, 5); r = randInt(2, 5); } while (gcd(p, r) !== 1);
  return q({ type: "factorise-hcf", marks: 2, prompt: `Factorise ${joinTerms([mono(g * p, { [a]: 1, [b]: 1 }), mono(g * r, { [a]: 2, [b]: 1 })])} fully.`, answer: `${mono(g, { [a]: 1, [b]: 1 })}(${joinTerms([String(p), mono(r, { [a]: 1 })])})`, working: [`HCF: ${mono(g, { [a]: 1, [b]: 1 })}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${mono(g, { [a]: 1 })}(${joinTerms([mono(p, { [b]: 1 }), mono(r, { [a]: 1, [b]: 1 })])})`, `${g}(${joinTerms([mono(p, { [a]: 1, [b]: 1 }), mono(r, { [a]: 2, [b]: 1 })])})`], tags: ["factorise", "HCF"] });
}

function factoriseNegativeHcfQuestion() {
  const x = choice(V);
  const g = randInt(2, 8); let p; let r;
  do { p = randInt(1, 7); r = randInt(1, 9); } while (gcd(p, r) !== 1);
  const v = choice(["both-neg", "neg-pos"]);
  if (v === "both-neg") {
    return q({ type: "factorise-negative-hcf", marks: 1, prompt: `Factorise ${joinTerms([mono(-g * p, { [x]: 1 }), num(-g * r)])} by taking out a negative common factor.`, answer: `${MINUS}${g}(${lin(p, r, x)})`, working: [`Take out ${MINUS}${g}: the signs inside change.`, `${MINUS}${g}(${lin(p, r, x)})`], space: SPACE_SIZES.SMALL, mcDistractors: [`${MINUS}${g}(${lin(p, -r, x)})`, `${g}(${lin(-p, -r, x)})`.replace(`(${MINUS}`, `(${MINUS}`), `${MINUS}${g}(${lin(-p, r, x)})`], tags: ["factorise", "negative"] });
  }
  return q({ type: "factorise-negative-hcf", marks: 2, prompt: `Factorise ${joinTerms([mono(-g * p, { [x]: 2 }), mono(g * r, { [x]: 1 })])} by taking out a negative common factor.`, answer: `${mono(-g, { [x]: 1 })}(${lin(p, -r, x)})`, working: [`Take out ${mono(-g, { [x]: 1 })}.`, `${mono(-g * p, { [x]: 2 })} ÷ (${mono(-g, { [x]: 1 })}) = ${mono(p, { [x]: 1 })}; ${mono(g * r, { [x]: 1 })} ÷ (${mono(-g, { [x]: 1 })}) = ${num(-r)}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${mono(-g, { [x]: 1 })}(${lin(p, r, x)})`, `${mono(-g, { [x]: 1 })}(${lin(-p, r, x)})`], tags: ["factorise", "negative"] });
}

function factoriseBinomialFactorQuestion() {
  const [x, y] = sample(["x", "a", "m", "y", "b", "p"], 2).sort();
  const k = nz(-7, 7); const c = randInt(2, 9);
  const b = `(${lin(1, k, y)})`;
  const sub = Math.random() < 0.5;
  return q({
    type: "factorise-binomial-factor", marks: 2,
    prompt: `Factorise ${x}${b} ${sub ? MINUS : "+"} ${c}${b}.`,
    answer: `${b}(${lin(1, sub ? -c : c, x)})`,
    working: [`The common factor is the whole bracket ${b}.`, `${b}(${x} ${sub ? MINUS : "+"} ${c})`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${b}(${lin(1, sub ? c : -c, x)})`, `${c}${x}${b}`, `(${lin(1, sub ? -c : c, x)})(${lin(1, -k, y)})`],
    tags: ["factorise", "binomial factor"]
  });
}

/* ── binomial products and monic quadratics ──────────────── */

function expandBinomialQuestion() {
  const x = choice(V);
  const v = choice(["monic", "monic", "leading", "both"]);
  const a = nz(-9, 9); const b = nz(-9, 9);
  if (v === "monic") {
    return q({ type: "expand-binomial", marks: 2, prompt: `Expand and simplify ${bin(1, a, x)}${bin(1, b, x)}.`, answer: poly([1, a + b, a * b], x), working: [`${x} × ${x} + ${x} × (${num(b)}) + (${num(a)}) × ${x} + (${num(a)}) × (${num(b)})`, `= ${poly([1, b, 0], x)} ${a >= 0 ? "+" : MINUS} ${mono(Math.abs(a), { [x]: 1 })} ${a * b >= 0 ? "+" : MINUS} ${Math.abs(a * b)}`, `= ${poly([1, a + b, a * b], x)}`], space: SPACE_SIZES.SMALL, mcDistractors: [poly([1, 0, a * b], x), poly([1, a * b, a + b], x), poly([1, a + b, -(a * b)], x)], tags: ["expand", "binomial"] });
  }
  const p = randInt(2, 5); const r = v === "both" ? randInt(2, 4) : 1;
  const coeffs = [p * r, p * b + a * r, a * b];
  return q({ type: "expand-binomial", marks: 2, prompt: `Expand and simplify ${bin(p, a, x)}${bin(r, b, x)}.`, answer: poly(coeffs, x), working: [`First: ${mono(p * r, { [x]: 2 })}; outer + inner: ${mono(p * b, { [x]: 1 })} + ${mono(a * r, { [x]: 1 })} = ${mono(p * b + a * r, { [x]: 1 })}; last: ${num(a * b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [poly([p * r, 0, a * b], x), poly([p * r, a + b, a * b], x), poly([p + r, p * b + a * r, a * b], x)], tags: ["expand", "binomial"] });
}

function monicPair() {
  let a; let b;
  do { a = nz(-9, 9); b = nz(-9, 9); } while (a + b === 0 && Math.random() < 0.7);
  return [a, b];
}

function factoriseMonicQuestion() {
  const x = choice(V);
  const [a, b] = monicPair();
  const coeffs = [1, a + b, a * b];
  const [lo, hi] = [a, b].sort((m, n) => m - n);
  return q({
    type: "factorise-monic", marks: 2,
    prompt: `Factorise ${poly(coeffs, x)}.`,
    answer: lo === hi ? `${bin(1, lo, x)}²` : `${bin(1, lo, x)}${bin(1, hi, x)}`,
    working: [`Find two numbers that multiply to ${num(a * b)} and add to ${num(a + b)}: ${num(a)} and ${num(b)}.`, lo === hi ? `${bin(1, lo, x)}${bin(1, hi, x)} = ${bin(1, lo, x)}²` : `${bin(1, lo, x)}${bin(1, hi, x)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${bin(1, -lo, x)}${bin(1, -hi, x)}`, `${bin(1, a + b, x)}${bin(1, 1, x)}`, `${bin(1, lo, x)}${bin(1, -hi, x)}`],
    tags: ["factorise", "monic quadratic"]
  });
}

function factoriseAreaModelQuestion() {
  const x = choice(["x", "a", "m"]);
  const a = randInt(1, 8); let b = randInt(1, 8);
  if (b === a) b = a + 1;
  const mode = choice(["complete", "dimensions"]);
  const coeffs = [1, a + b, a * b];
  if (mode === "complete") {
    return q({
      type: "factorise-area-model", marks: 2,
      prompt: `The area model shows ${poly(coeffs, x)} split into four parts. Fill in the missing lengths, and write ${poly(coeffs, x)} in factorised form.`,
      diagram: algebra({ diagramType: "area-grid", cols: [x, null], rows: [x, null], cells: [[`${x}²`, `${a}${x}`], [`${b}${x}`, String(a * b)]] }),
      answer: `Missing lengths ${a} and ${b}; ${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`,
      working: [`${a}${x} ÷ ${x} = ${a}; ${b}${x} ÷ ${x} = ${b}`, `Check: ${a} × ${b} = ${a * b}`, `${poly(coeffs, x)} = ${bin(1, a, x)}${bin(1, b, x)}`],
      space: SPACE_SIZES.SMALL,
      mcEligible: false,
      tags: ["factorise", "area model"]
    });
  }
  return q({
    type: "factorise-area-model", marks: 2,
    prompt: `Complete the area model for ${poly(coeffs, x)} (the ${x}${sup(2)} and ${a * b} parts are shown), then factorise.`,
    diagram: algebra({ diagramType: "area-grid", cols: [x, null], rows: [x, null], cells: [[`${x}²`, null], [null, String(a * b)]] }),
    answer: `${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)} (the missing parts are ${a}${x} and ${b}${x}, lengths ${a} and ${b})`,
    working: [`Two numbers that multiply to ${a * b} and add to ${a + b}: ${a} and ${b}.`, `The other two parts are ${a}${x} and ${b}${x}.`],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["factorise", "area model"]
  });
}

function expandAndSimplifyQuestion() {
  const x = choice(V);
  const a = nz(-6, 6); const b = nz(-6, 6); const c = randInt(2, 5); const d = nz(-6, 6);
  const v = choice(["binomial-minus", "binomial-plus-bracket"]);
  // (x + a)(x + b) − c(x + d)
  if (v === "binomial-minus") {
    const coeffs = [1, a + b - c, a * b - c * d];
    return q({ type: "expand-and-simplify", marks: 2, prompt: `Expand and simplify ${bin(1, a, x)}${bin(1, b, x)} ${MINUS} ${c}${bin(1, d, x)}.`, answer: poly(coeffs, x), working: [`${bin(1, a, x)}${bin(1, b, x)} = ${poly([1, a + b, a * b], x)}`, `${MINUS}${c}${bin(1, d, x)} = ${joinTerms([mono(-c, { [x]: 1 }), num(-c * d)])}`, `Collect: ${poly(coeffs, x)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [poly([1, a + b - c, a * b - d], x), poly([1, a + b + c, a * b + c * d], x), poly([1, a + b - c, a * b + c * d], x)], tags: ["expand", "simplify"] });
  }
  const e = nz(-5, 5);
  const coeffs = [2, a + b + e, a * b + e * d + 0];
  // (x+a)(x+b) + (x+e)(x+d) → 2x² + (a+b+e+d)x + (ab+ed)
  const cf = [2, a + b + e + d, a * b + e * d];
  return q({ type: "expand-and-simplify", marks: 3, prompt: `Expand and simplify ${bin(1, a, x)}${bin(1, b, x)} + ${bin(1, e, x)}${bin(1, d, x)}.`, answer: poly(cf, x), working: [`${poly([1, a + b, a * b], x)} + ${poly([1, e + d, e * d], x)}`, `= ${poly(cf, x)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [poly([1, a + b + e + d, a * b + e * d], x), poly(coeffs, x)], tags: ["expand", "simplify"] });
}

function factoriseCheckQuestion() {
  const x = choice(V);
  const [a, b] = monicPair();
  const coeffs = [1, a + b, a * b];
  const wrong = Math.random() < 0.6;
  const shown = wrong ? `${bin(1, -a, x)}${bin(1, -b, x)}` : `${bin(1, a, x)}${bin(1, b, x)}`;
  const shownCoeffs = wrong ? [1, -(a + b), a * b] : coeffs;
  return q({
    type: "factorise-check", marks: 2,
    prompt: `Sam factorised ${poly(coeffs, x)} as ${shown}. Expand Sam's answer to check it. Is it correct?`,
    answer: wrong ? `No: ${shown} expands to ${poly(shownCoeffs, x)}. The correct factorisation is ${bin(1, a, x)}${bin(1, b, x)}.` : `Yes: ${shown} expands to ${poly(coeffs, x)}.`,
    working: [`${shown} = ${poly(shownCoeffs, x)}`, wrong ? "The middle term has the wrong sign." : "It matches."],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["factorise", "check"]
  });
}

function multiPartAlgebraBQuestion() {
  const x = choice(V);
  const [a, b] = monicPair(); const g = randInt(2, 6); const p = randInt(1, 5); let r = randInt(1, 7);
  while (gcd(p, r) !== 1) r += 1;
  return q({
    type: "multi-part-algebra-b", marks: 4,
    prompt: "Expand or factorise as indicated.",
    subparts: [
      { label: "(a)", prompt: `Expand ${bin(1, a, x)}${bin(1, b, x)}.`, marks: 1, answer: poly([1, a + b, a * b], x), working: ["FOIL"] },
      { label: "(b)", prompt: `Factorise ${poly([1, a + b, a * b], x)}.`, marks: 1, answer: a === b ? `${bin(1, a, x)}²` : `${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`, working: ["Reverse of (a)."] },
      { label: "(c)", prompt: `Factorise ${joinTerms([mono(g * p, { [x]: 2 }), mono(g * r, { [x]: 1 })])}.`, marks: 1, answer: `${mono(g, { [x]: 1 })}(${lin(p, r, x)})`, working: [`HCF ${g}${x}`] },
      { label: "(d)", prompt: `Simplify ${afrac("3", x)} + ${afrac("2", `${x}²`)}.`, marks: 1, answer: afrac(lin(3, 2, x), `${x}²`), working: [`Common denominator ${x}²`] }
    ],
    answer: `(a) ${poly([1, a + b, a * b], x)}; (b) ${a === b ? `${bin(1, a, x)}²` : `${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`}; (c) ${mono(g, { [x]: 1 })}(${lin(p, r, x)}); (d) ${afrac(lin(3, 2, x), `${x}²`)}`,
    working: [],
    space: SPACE_SIZES.SMALL,
    tags: ["multi-part"]
  });
}

const GENERATORS = {
  "add-fractions-pronumeral": addFractionsPronumeralQuestion,
  "multiply-algebraic-fractions": multiplyAlgebraicFractionsQuestion,
  "divide-algebraic-fractions": divideAlgebraicFractionsQuestion,
  "factorise-hcf": factoriseHcfQuestion,
  "factorise-negative-hcf": factoriseNegativeHcfQuestion,
  "factorise-binomial-factor": factoriseBinomialFactorQuestion,
  "expand-binomial": expandBinomialQuestion,
  "factorise-monic": factoriseMonicQuestion,
  "factorise-area-model": factoriseAreaModelQuestion,
  "expand-and-simplify": expandAndSimplifyQuestion,
  "factorise-check": factoriseCheckQuestion,
  "multi-part-algebra-b": multiPartAlgebraBQuestion
};

export function getAlgebraicTechniquesBQuestionTypes() { return TYPE_LIST; }
export function generateAlgebraicTechniquesBQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
