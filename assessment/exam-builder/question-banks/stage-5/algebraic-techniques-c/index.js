/*
  Mills Maths Tools — Stage 5 Question Bank: Algebraic Techniques C
  ------------------------------------------------------------------
  question-banks/stage-5/algebraic-techniques-c/index.js

  NSW Mathematics K–10 (2022), Stage 5, MA5-ALG-P-02 (Path):
    "selects and applies appropriate algebraic techniques to operate with
     algebraic fractions, and expands, factorises and simplifies algebraic
     expressions"

  Content:
    - algebraic fractions with binomial numerators and numerical
      denominators (+, −)
    - special products: perfect squares (a ± b)² and the difference of two
      squares (a + b)(a − b), both ways
    - factorising by grouping in pairs
    - factorising non-monic quadratic trinomials ax² + bx + c
    - factorising completely (common factor first)
    - simplifying algebraic fractions by factorising, including × and ÷
    - completing the square
    - choosing the technique for a mixed set

  Every factorisation is generated from its factors, so tools/stage5-algebra.mjs
  can re-expand and compare coefficient by coefficient.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, gcd, spaced
} from "../../_shared/bank-helpers.js";
import { sup, mono, num, afrac, MINUS, joinTerms, poly, lin, bin, rat } from "../../_shared/algebra-helpers.js";

const TOPIC = "Algebraic Techniques C";

const TYPE_LIST = [
  { id: "binomial-numerator-fractions", label: "Algebraic fractions with binomial numerators" },
  { id: "expand-perfect-square", label: "Expand perfect squares" },
  { id: "expand-difference-squares", label: "Expand the difference of two squares" },
  { id: "factorise-difference-squares", label: "Factorise the difference of two squares" },
  { id: "factorise-perfect-square", label: "Factorise perfect squares" },
  { id: "factorise-grouping", label: "Factorise by grouping in pairs" },
  { id: "factorise-non-monic", label: "Factorise non-monic quadratics" },
  { id: "factorise-completely", label: "Factorise completely (common factor first)" },
  { id: "simplify-by-factorising", label: "Simplify algebraic fractions by factorising" },
  { id: "multiply-divide-factorising", label: "Multiply and divide algebraic fractions by factorising" },
  { id: "complete-the-square", label: "Complete the square" },
  { id: "special-products-mental", label: "Special products for mental arithmetic" },
  { id: "choose-technique", label: "Factorise: choose the technique" },
  { id: "multi-part-algebra-c", label: "Multi-part algebra problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage5", "algebra", ...(spec.tags || [])] });
const V = ["x", "a", "m", "n", "p", "y", "k"];
const nz = (lo, hi) => { let v; do { v = randInt(lo, hi); } while (v === 0); return v; };
const algebra = config => ({ engine: "algebra-engine", config });

/* (px + a)(rx + b) → coefficients */
const prod = (p, a, r, b) => [p * r, p * b + a * r, a * b];

function binomialNumeratorFractionsQuestion() {
  const x = choice(V);
  const d1 = choice([2, 3, 4, 5]); let d2 = choice([2, 3, 4, 5, 6]);
  if (d2 === d1) d2 = d1 === 6 ? 5 : d1 + 1;
  const L = (d1 * d2) / gcd(d1, d2);
  const a = nz(-6, 6); const b = nz(-6, 6);
  const sub = Math.random() < 0.5;
  // (x + a)/d1 ± (x + b)/d2 = [m1(x + a) ± m2(x + b)]/L
  const m1 = L / d1; const m2 = L / d2;
  const cx = m1 + (sub ? -m2 : m2);
  const cc = m1 * a + (sub ? -m2 * b : m2 * b);
  const g = gcd(gcd(Math.abs(cx), Math.abs(cc)), L);
  const top = cx < 0 ? joinTerms([num(cc / g), mono(cx / g, { [x]: 1 })]) : lin(cx / g, cc / g, x); const bot = L / g;
  const ans = bot === 1 ? top : afrac(top, String(bot));
  return q({
    type: "binomial-numerator-fractions", marks: 3,
    prompt: `Simplify ${afrac(lin(1, a, x), String(d1))} ${sub ? MINUS : "+"} ${afrac(lin(1, b, x), String(d2))}.`,
    answer: ans,
    working: [`Common denominator ${L}: numerator ${m1}(${lin(1, a, x)}) ${sub ? MINUS : "+"} ${m2}(${lin(1, b, x)})`, `= ${lin(m1, m1 * a, x)} ${sub ? MINUS : "+"} (${lin(m2, m2 * b, x)}) = ${lin(cx, cc, x)}`, `So the result is (${lin(cx, cc, x)})/${L}${g > 1 ? ", which simplifies" : ""}`],
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [afrac(lin(cx, m1 * a + (sub ? m2 * b : m2 * b), x), String(L)), afrac(lin(2, a + (sub ? -b : b), x), String(d1 + d2)), afrac(lin(cx, a + (sub ? -b : b), x), String(L))],
    tags: ["algebraic fractions", "binomial numerator"]
  });
}

function expandPerfectSquareQuestion() {
  const x = choice(V);
  const p = choice([1, 1, 2, 3]); const a = nz(-9, 9);
  const coeffs = [p * p, 2 * p * a, a * a];
  return q({
    type: "expand-perfect-square", marks: 1,
    prompt: `Expand ${bin(p, a, x)}².`,
    answer: poly(coeffs, x),
    working: ["(A + B)² = A² + 2AB + B²", `${mono(p * p, { [x]: 2 })} + 2 × ${mono(p, { [x]: 1 })} × (${num(a)}) + ${a * a} = ${poly(coeffs, x)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [poly([p * p, 0, a * a], x), poly([p * p, p * a, a * a], x), poly([p * p, 2 * p * a, -a * a], x)],
    tags: ["special products", "perfect square"]
  });
}

function expandDifferenceSquaresQuestion() {
  const [x, y] = sample(V, 2).sort();
  const v = choice(["number", "two-var"]);
  if (v === "number") {
    const p = choice([1, 1, 2, 3, 4]); const a = randInt(1, 9);
    return q({ type: "expand-difference-squares", marks: 1, prompt: `Expand ${bin(p, a, x)}${bin(p, -a, x)}.`, answer: poly([p * p, 0, -a * a], x), working: ["(A + B)(A − B) = A² − B²", `${mono(p * p, { [x]: 2 })} ${MINUS} ${a * a}`], space: SPACE_SIZES.SMALL, mcDistractors: [poly([p * p, 0, a * a], x), poly([p * p, -2 * p * a, -a * a], x), poly([p * p, 2 * p * a, a * a], x)], tags: ["special products", "difference of squares"] });
  }
  let p = randInt(1, 5); const r = randInt(1, 5);
  while (gcd(p, r) !== 1) p += 1;
  return q({ type: "expand-difference-squares", marks: 1, prompt: `Expand (${joinTerms([mono(p, { [x]: 1 }), mono(r, { [y]: 1 })])})(${joinTerms([mono(p, { [x]: 1 }), mono(-r, { [y]: 1 })])}).`, answer: joinTerms([mono(p * p, { [x]: 2 }), mono(-r * r, { [y]: 2 })]), working: ["(A + B)(A − B) = A² − B²"], space: SPACE_SIZES.SMALL, mcDistractors: [joinTerms([mono(p * p, { [x]: 2 }), mono(r * r, { [y]: 2 })]), joinTerms([mono(p, { [x]: 2 }), mono(-r, { [y]: 2 })])], tags: ["special products", "difference of squares"] });
}

function factoriseDifferenceSquaresQuestion() {
  const [x, y] = sample(V, 2).sort();
  const v = choice(["number", "coef", "two-var", "common"]);
  if (v === "number") {
    const a = randInt(1, 12);
    return q({ type: "factorise-difference-squares", marks: 1, prompt: `Factorise ${x}² ${MINUS} ${a * a}.`, answer: `${bin(1, a, x)}${bin(1, -a, x)}`, working: [`${x}² ${MINUS} ${a}² = ${bin(1, a, x)}${bin(1, -a, x)}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${bin(1, -a, x)}²`, `${bin(1, a, x)}²`, `${bin(1, a * a, x)}${bin(1, -1, x)}`], tags: ["factorise", "difference of squares"] });
  }
  if (v === "coef") {
    const p = randInt(2, 7); const a = randInt(1, 9);
    if (gcd(p, a) !== 1) return factoriseDifferenceSquaresQuestion();
    return q({ type: "factorise-difference-squares", marks: 1, prompt: `Factorise ${mono(p * p, { [x]: 2 })} ${MINUS} ${a * a}.`, answer: `${bin(p, a, x)}${bin(p, -a, x)}`, working: [`${mono(p * p, { [x]: 2 })} = (${mono(p, { [x]: 1 })})², ${a * a} = ${a}²`], space: SPACE_SIZES.SMALL, mcDistractors: [`${bin(p * p, a, x)}${bin(1, -a, x)}`, `${bin(p, -a, x)}²`], tags: ["factorise", "difference of squares"] });
  }
  if (v === "two-var") {
    // 4k² − 16n² must not share a factor first ((2k + 4n)(2k − 4n) is not complete)
    let p; let r; do { p = randInt(1, 5); r = randInt(1, 5); } while (gcd(p, r) !== 1);
    return q({ type: "factorise-difference-squares", marks: 1, prompt: `Factorise ${joinTerms([mono(p * p, { [x]: 2 }), mono(-r * r, { [y]: 2 })])}.`, answer: `(${joinTerms([mono(p, { [x]: 1 }), mono(r, { [y]: 1 })])})(${joinTerms([mono(p, { [x]: 1 }), mono(-r, { [y]: 1 })])})`, working: ["A² − B² = (A + B)(A − B)"], space: SPACE_SIZES.SMALL, mcEligible: false, tags: ["factorise", "difference of squares"] });
  }
  const g = choice([2, 3, 5]); const a = randInt(1, 6);
  return q({ type: "factorise-difference-squares", marks: 2, prompt: `Factorise ${mono(g, { [x]: 2 })} ${MINUS} ${g * a * a} completely.`, answer: `${g}${bin(1, a, x)}${bin(1, -a, x)}`, working: [`Common factor ${g}: ${g}(${x}² ${MINUS} ${a * a})`, `= ${g}${bin(1, a, x)}${bin(1, -a, x)}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${g}(${x}² ${MINUS} ${a * a})`, `${bin(g, a, x)}${bin(g, -a, x)}`], tags: ["factorise", "difference of squares", "common factor"] });
}

function factorisePerfectSquareQuestion() {
  const x = choice(V);
  const p = choice([1, 1, 1, 2, 3]); const a = nz(-9, 9);
  if (gcd(p, Math.abs(a)) !== 1) return factorisePerfectSquareQuestion();
  const coeffs = [p * p, 2 * p * a, a * a];
  return q({
    type: "factorise-perfect-square", marks: 1,
    prompt: `Factorise ${poly(coeffs, x)}.`,
    answer: `${bin(p, a, x)}²`,
    working: [`First and last terms are squares: (${mono(p, { [x]: 1 })})² and ${Math.abs(a)}²; the middle term is 2 × ${mono(p, { [x]: 1 })} × ${num(a)}.`, `${bin(p, a, x)}²`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${bin(p, -a, x)}²`, `${bin(p, a, x)}${bin(p, -a, x)}`, `${bin(p, 2 * a, x)}²`],
    tags: ["factorise", "perfect square"]
  });
}

function factoriseGroupingQuestion() {
  const [x, y] = sample(["x", "a", "m", "p"], 2).sort();
  const v = choice(["four-letters", "numbers", "cubic"]);
  if (v === "four-letters") {
    const [a, b] = sample(["b", "c", "k", "n"].filter(t => t !== x && t !== y), 2).sort();
    return q({ type: "factorise-grouping", marks: 2, prompt: `Factorise ${x}${a} + ${x}${b} + ${y}${a} + ${y}${b}.`, answer: `(${a} + ${b})(${x} + ${y})`, working: [`Group: ${x}(${a} + ${b}) + ${y}(${a} + ${b})`, `= (${a} + ${b})(${x} + ${y})`], space: SPACE_SIZES.SMALL, mcDistractors: [`(${x} + ${a})(${y} + ${b})`, `${x}${y}(${a} + ${b})`], tags: ["factorise", "grouping"] });
  }
  if (v === "numbers") {
    const c = randInt(2, 7); const d = nz(-7, 7);
    // x·y + c·x + d·y + c·d = (x + d)(y + c)
    return q({ type: "factorise-grouping", marks: 2, prompt: `Factorise ${joinTerms([`${x}${y}`, mono(c, { [x]: 1 }), mono(d, { [y]: 1 }), num(c * d)])}.`, answer: `${bin(1, d, x)}${bin(1, c, y)}`, working: [`Group: ${x}(${lin(1, c, y)}) ${d < 0 ? MINUS : "+"} ${Math.abs(d)}(${lin(1, c, y)})`, `= ${bin(1, c, y)}${bin(1, d, x)}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${bin(1, c, x)}${bin(1, d, y)}`, `${bin(1, -d, x)}${bin(1, c, y)}`], tags: ["factorise", "grouping"] });
  }
  const a = nz(-5, 5); const k = randInt(1, 9);
  // x³ + a x² − k x − a k = x²(x + a) − k(x + a) = (x + a)(x² − k)
  return q({ type: "factorise-grouping", marks: 2, prompt: `Factorise ${poly([1, a, -k, -a * k], x)}.`, answer: `${bin(1, a, x)}(${x}² ${MINUS} ${k})`, working: [`${x}²${bin(1, a, x)} ${MINUS} ${k}${bin(1, a, x)}`, `= ${bin(1, a, x)}(${x}² ${MINUS} ${k})`], space: SPACE_SIZES.SMALL, mcDistractors: [`${bin(1, a, x)}(${x}² + ${k})`, `${x}²${bin(1, a, x)}`], tags: ["factorise", "grouping"] });
}

/* A non-monic quadratic built from factors (px + a)(rx + b), p ≥ 2, primitive. */
function nonMonic() {
  for (;;) {
    const p = randInt(2, 5); const r = randInt(1, 3); const a = nz(-7, 7); const b = nz(-7, 7);
    if (gcd(p, Math.abs(a)) !== 1 || gcd(r, Math.abs(b)) !== 1) continue;
    const c = prod(p, a, r, b);
    if (gcd(gcd(Math.abs(c[0]), Math.abs(c[1])), Math.abs(c[2])) !== 1) continue;
    if (c[1] === 0) continue;
    return { p, a, r, b, c };
  }
}

function factoriseNonMonicQuestion() {
  const x = choice(V);
  const { p, a, r, b, c } = nonMonic();
  return q({
    type: "factorise-non-monic", marks: 2,
    prompt: `Factorise ${poly(c, x)}.`,
    answer: `${bin(p, a, x)}${bin(r, b, x)}`,
    working: [`Multiply first and last coefficients: ${c[0]} × ${num(c[2])} = ${num(c[0] * c[2])}`, `Two numbers multiplying to ${num(c[0] * c[2])} and adding to ${num(c[1])}: ${num(p * b)} and ${num(a * r)}`, `Split the middle term and group: ${bin(p, a, x)}${bin(r, b, x)}`],
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [`${bin(p, b, x)}${bin(r, a, x)}`, `${bin(p, -a, x)}${bin(r, -b, x)}`, `${bin(1, a, x)}${bin(p * r, b, x)}`],
    tags: ["factorise", "non-monic"]
  });
}

function factoriseCompletelyQuestion() {
  const x = choice(V);
  const g = randInt(2, 5);
  const v = choice(["monic", "dots", "x-common"]);
  if (v === "monic") {
    const a = nz(-7, 7); let b = nz(-7, 7); if (b === a) b = -a || 3;
    return q({ type: "factorise-completely", marks: 2, prompt: `Factorise ${poly([g, g * (a + b), g * a * b], x)} completely.`, answer: `${g}${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`, working: [`Common factor ${g}: ${g}(${poly([1, a + b, a * b], x)})`, `= ${g}${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${g}(${poly([1, a + b, a * b], x)})`, `${bin(g, a, x)}${bin(1, b, x)}`], tags: ["factorise completely"] });
  }
  if (v === "dots") {
    const a = randInt(1, 6);
    return q({ type: "factorise-completely", marks: 2, prompt: `Factorise ${poly([g, 0, -g * a * a, 0], x)} completely.`, answer: `${g}${x}${bin(1, a, x)}${bin(1, -a, x)}`, working: [`Common factor ${g}${x}: ${g}${x}(${x}² ${MINUS} ${a * a})`, `Difference of two squares: ${g}${x}${bin(1, a, x)}${bin(1, -a, x)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${g}${x}(${x}² ${MINUS} ${a * a})`, `${g}${bin(1, a, x)}${bin(1, -a, x)}`], tags: ["factorise completely", "difference of squares"] });
  }
  const a = nz(-6, 6); let b = nz(-6, 6); if (b === a) b = a + 1 || 2;
  return q({ type: "factorise-completely", marks: 2, prompt: `Factorise ${poly([1, a + b, a * b, 0], x)} completely.`, answer: `${x}${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`, working: [`Common factor ${x}: ${x}(${poly([1, a + b, a * b], x)})`, `= ${x}${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${x}(${poly([1, a + b, a * b], x)})`, `${x}²${bin(1, a + b, x)}`], tags: ["factorise completely"] });
}

function simplifyByFactorisingQuestion() {
  const x = choice(V);
  const v = choice(["dots-over-linear", "trinomial-over-dots", "common-factor", "negative"]);
  const a = nz(-7, 7);
  if (v === "dots-over-linear") {
    const A = Math.abs(a);
    return q({ type: "simplify-by-factorising", marks: 2, prompt: `Simplify ${afrac(`${x}² ${MINUS} ${A * A}`, lin(1, A, x))}.`, answer: lin(1, -A, x), working: [`${x}² ${MINUS} ${A * A} = ${bin(1, A, x)}${bin(1, -A, x)}`, `Cancel ${bin(1, A, x)}: ${lin(1, -A, x)}`], space: SPACE_SIZES.SMALL, mcDistractors: [lin(1, A, x), lin(1, -A * A, x), `${x} ${MINUS} ${A}²`], tags: ["algebraic fractions", "factorise"] });
  }
  if (v === "trinomial-over-dots") {
    let b = nz(-7, 7); const c = Math.abs(a);
    // (x + c)(x + b) / (x + c)(x − c) = (x + b)/(x − c)
    if (b === c || b === -c) b = c + 1;
    return q({ type: "simplify-by-factorising", marks: 3, prompt: `Simplify ${afrac(poly([1, c + b, c * b], x), `${x}² ${MINUS} ${c * c}`)}.`, answer: afrac(lin(1, b, x), lin(1, -c, x)), working: [`Numerator: ${bin(1, c, x)}${bin(1, b, x)}`, `Denominator: ${bin(1, c, x)}${bin(1, -c, x)}`, `Cancel ${bin(1, c, x)}.`], space: SPACE_SIZES.MEDIUM, mcDistractors: [afrac(lin(1, b, x), lin(1, c, x)), afrac(lin(1, c + b, x), `${x} ${MINUS} ${c * c}`)], tags: ["algebraic fractions", "factorise"] });
  }
  if (v === "common-factor") {
    const g = randInt(2, 6); const k = randInt(2, 4);
    // (g x + g a)/(k g) = (x + a)/k
    return q({ type: "simplify-by-factorising", marks: 2, prompt: `Simplify ${afrac(lin(g, g * a, x), String(k * g))}.`, answer: afrac(lin(1, a, x), String(k)), working: [`${lin(g, g * a, x)} = ${g}${bin(1, a, x)}`, `Cancel ${g}: ${afrac(lin(1, a, x), String(k))}`], space: SPACE_SIZES.SMALL, mcDistractors: [afrac(lin(g, a, x), String(k)), afrac(lin(1, g * a, x), String(k))], tags: ["algebraic fractions", "factorise"] });
  }
  const b = randInt(1, 9);
  // (b − x)/(x − b) = −1
  return q({ type: "simplify-by-factorising", marks: 1, prompt: `Simplify ${afrac(`${b} ${MINUS} ${x}`, `${x} ${MINUS} ${b}`)}.`, answer: `${MINUS}1`, working: [`${b} ${MINUS} ${x} = ${MINUS}(${x} ${MINUS} ${b})`, `So the fraction is ${MINUS}1.`], space: SPACE_SIZES.SMALL, mcDistractors: ["1", "0", `${x} ${MINUS} ${b}`], tags: ["algebraic fractions", "negative factor"] });
}

function multiplyDivideFactorisingQuestion() {
  const x = choice(V);
  const a = randInt(1, 6); let b = nz(-6, 6); if (b === a || b === -a) b = a + 1;
  const k = randInt(2, 6);
  const div = Math.random() < 0.5;
  // (x² − a²)/k × k²/(x + a) = k(x − a); ÷ version: (x² − a²)/k ÷ (x + a)/k² = k(x − a)
  const left = afrac(`${x}² ${MINUS} ${a * a}`, String(k));
  const right = div ? afrac(lin(1, a, x), String(k * k)) : afrac(String(k * k), lin(1, a, x));
  return q({
    type: "multiply-divide-factorising", marks: 3,
    prompt: `Simplify ${left} ${div ? "÷" : "×"} ${right}.`,
    answer: `${k}${bin(1, -a, x)}`,
    working: [div ? `Multiply by the reciprocal: × ${afrac(String(k * k), lin(1, a, x))}` : "", `${x}² ${MINUS} ${a * a} = ${bin(1, a, x)}${bin(1, -a, x)}`, `Cancel ${bin(1, a, x)} and ${k}: ${k}${bin(1, -a, x)}`].filter(Boolean),
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [`${k}${bin(1, a, x)}`, `${k * k}${bin(1, -a, x)}`, afrac(lin(1, -a, x), String(k))],
    tags: ["algebraic fractions", "factorise", div ? "divide" : "multiply"]
  });
}

function completeTheSquareQuestion() {
  const x = choice(V);
  const h = nz(-8, 8);
  const v = choice(["fill", "vertex-form", "area-model"]);
  if (v === "fill") {
    return q({ type: "complete-the-square", marks: 1, prompt: `Complete the square: ${poly([1, 2 * h, 0], x).replace(/ \+ 0$/, "")} + ___ = (${x} ${h < 0 ? MINUS : "+"} ___)²`, answer: `${h * h}; ${Math.abs(h)}`, working: [`Halve the coefficient of ${x}: ${num(2 * h)} ÷ 2 = ${num(h)}; square it: ${h * h}`], space: "none", mcEligible: false, tags: ["complete the square"] });
  }
  if (v === "area-model") {
    return q({
      type: "complete-the-square", marks: 2,
      prompt: `The area model shows ${x}² + ${2 * Math.abs(h)}${x} split into a square and two equal strips. What must be added to complete the square? Write ${x}² + ${2 * Math.abs(h)}${x} + ___ as a perfect square.`,
      diagram: algebra({ diagramType: "area-grid", cols: [x, String(Math.abs(h))], rows: [x, String(Math.abs(h))], cells: [[`${x}²`, `${Math.abs(h)}${x}`], [`${Math.abs(h)}${x}`, null]] }),
      answer: `${h * h}; ${x}² + ${2 * Math.abs(h)}${x} + ${h * h} = ${bin(1, Math.abs(h), x)}²`,
      working: [`The missing corner is ${Math.abs(h)} × ${Math.abs(h)} = ${h * h}.`],
      space: SPACE_SIZES.SMALL,
      mcEligible: false,
      tags: ["complete the square", "area model"]
    });
  }
  const c = nz(-12, 12);
  const k = c - h * h;
  return q({ type: "complete-the-square", marks: 2, prompt: `Write ${poly([1, 2 * h, c], x)} in the form (${x} + a)² + b.`, answer: `${bin(1, h, x)}² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}`.replace(/ [+−] 0$/, ""), working: [`Half of ${num(2 * h)} is ${num(h)}: ${bin(1, h, x)}² = ${poly([1, 2 * h, h * h], x)}`, `${poly([1, 2 * h, c], x)} = ${bin(1, h, x)}² ${MINUS} ${h * h} ${c < 0 ? MINUS : "+"} ${Math.abs(c)} = ${bin(1, h, x)}² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${bin(1, h, x)}² ${c < 0 ? MINUS : "+"} ${Math.abs(c)}`, `${bin(1, 2 * h, x)}² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}`, `${bin(1, -h, x)}² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}`], tags: ["complete the square"] });
}

function specialProductsMentalQuestion() {
  const v = choice(["dots", "square"]);
  if (v === "dots") {
    const base = choice([20, 30, 40, 50, 60, 100]); const d = randInt(1, 4);
    return q({ type: "special-products-mental", marks: 2, prompt: `Use the difference of two squares to evaluate ${base + d} × ${base - d} without a calculator.`, answer: spaced(base * base - d * d), working: [`(${base} + ${d})(${base} ${MINUS} ${d}) = ${base}² ${MINUS} ${d}²`, `= ${spaced(base * base)} ${MINUS} ${d * d} = ${spaced(base * base - d * d)}`], space: SPACE_SIZES.SMALL, mcDistractors: [spaced(base * base + d * d), spaced(base * base - 2 * d), spaced(base * base)], tags: ["special products", "mental"] });
  }
  const base = choice([20, 30, 40, 50, 100]); const d = randInt(1, 3); const sub = Math.random() < 0.5;
  const n = sub ? base - d : base + d;
  return q({ type: "special-products-mental", marks: 2, prompt: `Use a perfect square expansion to evaluate ${n}² without a calculator.`, answer: spaced(n * n), working: [`(${base} ${sub ? MINUS : "+"} ${d})² = ${base}² ${sub ? MINUS : "+"} 2 × ${base} × ${d} + ${d}²`, `= ${spaced(base * base)} ${sub ? MINUS : "+"} ${2 * base * d} + ${d * d} = ${spaced(n * n)}`], space: SPACE_SIZES.SMALL, mcDistractors: [spaced(base * base + d * d), spaced(n * n + 2 * d), spaced(base * base - d * d)], tags: ["special products", "mental"] });
}

function chooseTechniqueQuestion() {
  const x = choice(V);
  const kinds = ["hcf", "dots", "perfect", "monic", "non-monic", "grouping"];
  const k = choice(kinds);
  let expr; let ans; let method;
  if (k === "hcf") { const g = randInt(2, 7); const p = randInt(1, 5); const r = randInt(1, 7); expr = joinTerms([mono(g * p, { [x]: 2 }), mono(g * r, { [x]: 1 })]); ans = `${mono(g, { [x]: 1 })}(${lin(p, r, x)})`; method = "highest common factor"; if (gcd(p, r) !== 1) return chooseTechniqueQuestion(); }
  else if (k === "dots") { const a = randInt(2, 9); expr = `${x}² ${MINUS} ${a * a}`; ans = `${bin(1, a, x)}${bin(1, -a, x)}`; method = "difference of two squares"; }
  else if (k === "perfect") { const a = nz(-8, 8); expr = poly([1, 2 * a, a * a], x); ans = `${bin(1, a, x)}²`; method = "perfect square"; }
  else if (k === "monic") { const a = nz(-7, 7); let b = nz(-7, 7); if (b === a) b = -a + 1 || 2; if (a + b === 0) b += 1; if (b === 0) b = 3; expr = poly([1, a + b, a * b], x); ans = `${bin(1, Math.min(a, b), x)}${bin(1, Math.max(a, b), x)}`; method = "monic quadratic trinomial"; }
  else if (k === "non-monic") { const n = nonMonic(); expr = poly(n.c, x); ans = `${bin(n.p, n.a, x)}${bin(n.r, n.b, x)}`; method = "non-monic quadratic trinomial"; }
  else { const c = randInt(2, 7); const d = nz(-7, 7); expr = joinTerms([`${x}y`, mono(c, { [x]: 1 }), mono(d, { y: 1 }), num(c * d)]); ans = `${bin(1, d, x)}${bin(1, c, "y")}`; method = "grouping in pairs"; }
  return q({
    type: "choose-technique", marks: 2,
    prompt: `Name the factorising technique you would use for ${expr}, then factorise it.`,
    answer: `${method[0].toUpperCase() + method.slice(1)}: ${ans}`,
    working: [`Recognise the form: ${method}.`, ans],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["factorise", "mixed"]
  });
}

function multiPartAlgebraCQuestion() {
  const x = choice(V);
  const a = randInt(2, 7); const n = nonMonic();
  return q({
    type: "multi-part-algebra-c", marks: 4,
    prompt: "Factorise fully.",
    subparts: [
      { label: "(a)", prompt: `${x}² ${MINUS} ${a * a}`, marks: 1, answer: `${bin(1, a, x)}${bin(1, -a, x)}`, working: ["Difference of two squares."] },
      { label: "(b)", prompt: poly([1, 2 * a, a * a], x), marks: 1, answer: `${bin(1, a, x)}²`, working: ["Perfect square."] },
      { label: "(c)", prompt: poly(n.c, x), marks: 2, answer: `${bin(n.p, n.a, x)}${bin(n.r, n.b, x)}`, working: ["Non-monic: split the middle term."] }
    ],
    answer: `(a) ${bin(1, a, x)}${bin(1, -a, x)}; (b) ${bin(1, a, x)}²; (c) ${bin(n.p, n.a, x)}${bin(n.r, n.b, x)}`,
    working: [],
    space: SPACE_SIZES.MEDIUM,
    tags: ["multi-part"]
  });
}

const GENERATORS = {
  "binomial-numerator-fractions": binomialNumeratorFractionsQuestion,
  "expand-perfect-square": expandPerfectSquareQuestion,
  "expand-difference-squares": expandDifferenceSquaresQuestion,
  "factorise-difference-squares": factoriseDifferenceSquaresQuestion,
  "factorise-perfect-square": factorisePerfectSquareQuestion,
  "factorise-grouping": factoriseGroupingQuestion,
  "factorise-non-monic": factoriseNonMonicQuestion,
  "factorise-completely": factoriseCompletelyQuestion,
  "simplify-by-factorising": simplifyByFactorisingQuestion,
  "multiply-divide-factorising": multiplyDivideFactorisingQuestion,
  "complete-the-square": completeTheSquareQuestion,
  "special-products-mental": specialProductsMentalQuestion,
  "choose-technique": chooseTechniqueQuestion,
  "multi-part-algebra-c": multiPartAlgebraCQuestion
};

export function getAlgebraicTechniquesCQuestionTypes() { return TYPE_LIST; }
export function generateAlgebraicTechniquesCQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
