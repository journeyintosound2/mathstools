/*
  MMT Exam Builder — Stage 5 Algebraic Techniques A Question Bank
  ----------------------------------------------------------------
  Save as:

  question-banks/stage-5/algebraic-techniques-a/index.js

  Optional visual helper:
  - engines/algebra/algebra-engine.js
*/

import {
  createQuestion,
  SPACE_SIZES
} from "../../../schemas/question.schema.js";
import { EXTRA_ALG_A_TYPES, EXTRA_ALG_A_GENERATORS } from "./extra-types.js";

const TOPIC = "Algebraic Techniques A";

const TYPE_LIST = [
  { id: "simplify-algebraic-fractions", label: "Simplify algebraic fractions with numerical denominators" },
  { id: "add-subtract-algebraic-fractions", label: "Add and subtract algebraic fractions" },
  { id: "multiply-algebraic-fractions", label: "Multiply algebraic fractions" },
  { id: "divide-algebraic-fractions", label: "Divide algebraic fractions" },
  { id: "mixed-algebraic-fractions", label: "Mixed algebraic fraction operations" },
  { id: "expand-single-brackets", label: "Expand single brackets" },
  { id: "expand-negative-coefficients", label: "Expand brackets with negative coefficients" },
  { id: "expand-collect-like-terms", label: "Expand and collect like terms" },
  { id: "expand-two-brackets", label: "Expand two separate brackets and simplify" },
  { id: "expand-binomial-products", label: "Expand binomial products" },
  { id: "expand-binomial-area-model", label: "Expand binomial products using an area model" },
  { id: "mixed-expansion-simplification", label: "Mixed expansion and simplification" }
];
TYPE_LIST.push(...EXTRA_ALG_A_TYPES);

const VARIABLES = ["x", "a", "b", "m", "n", "p", "q", "r", "t", "w", "y", "z"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(items) {
  return items[randInt(0, items.length - 1)];
}

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomId(prefix = "algebraic-techniques-a") {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function gcd(a, b) {
  let x = Math.abs(Number(a));
  let y = Math.abs(Number(b));
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function frac(n, d = 1) {
  if (d === 0) throw new Error("Zero denominator");
  let numerator = Number(n);
  let denominator = Number(d);
  if (denominator < 0) {
    numerator *= -1;
    denominator *= -1;
  }
  const g = gcd(numerator, denominator);
  return { n: numerator / g, d: denominator / g };
}

function addFrac(a, b) {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subFrac(a, b) {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

function mulFrac(a, b) {
  return frac(a.n * b.n, a.d * b.d);
}

function divFrac(a, b) {
  return frac(a.n * b.d, a.d * b.n);
}

function formatMathFraction(numerator, denominator) {
  return `[[algfrac:${numerator}:${denominator}]]`;
}

function formatMonomialNumerator(coef, variable) {
  const absCoef = Math.abs(Number(coef));
  if (absCoef === 0) return "0";
  if (absCoef === 1) return variable;
  return `${absCoef}${variable}`;
}

function formatFractionTerm(coef, variable) {
  const f = frac(coef.n, coef.d);
  if (f.n === 0) return "0";

  const sign = f.n < 0 ? "−" : "";
  const absN = Math.abs(f.n);

  if (f.d === 1) {
    if (absN === 1) return `${sign}${variable}`;
    return `${sign}${absN}${variable}`;
  }

  return `${sign}${formatMathFraction(formatMonomialNumerator(absN, variable), f.d)}`;
}

function formatNumeratorOverDen(coef, variable, denominator) {
  const sign = coef < 0 ? "−" : "";
  return `${sign}${formatMathFraction(formatMonomialNumerator(coef, variable), denominator)}`;
}

function formatLinearNumerator(coef, constant, variable) {
  return formatLinear(coef, constant, variable);
}

function simplifyLinearFraction(coef, constant, denominator, variable) {
  let c = Number(coef);
  let k = Number(constant);
  let d = Number(denominator);

  if (d < 0) {
    c *= -1;
    k *= -1;
    d *= -1;
  }

  const g = gcd(gcd(Math.abs(c), Math.abs(k)), d);
  c /= g;
  k /= g;
  d /= g;

  if (d === 1) return formatLinear(c, k, variable);
  return formatMathFraction(formatLinearNumerator(c, k, variable), d);
}

function formatLinearFractionTerm(coef, constant, denominator, variable) {
  return formatMathFraction(formatLinearNumerator(coef, constant, variable), denominator);
}

function signJoin(value, isFirst = false) {
  if (value === 0) return "";
  const sign = value < 0 ? "−" : "+";
  const abs = Math.abs(value);
  return isFirst
    ? `${value < 0 ? "−" : ""}${abs}`
    : ` ${sign} ${abs}`;
}

function formatVariableTerm(coef, variable, isFirst = false) {
  if (coef === 0) return "";
  const sign = coef < 0 ? "−" : "+";
  const abs = Math.abs(coef);
  const body = abs === 1 ? variable : `${abs}${variable}`;
  return isFirst
    ? `${coef < 0 ? "−" : ""}${body}`
    : ` ${sign} ${body}`;
}

function formatLinear(coef, constant, variable) {
  let out = "";
  if (coef !== 0) out += formatVariableTerm(coef, variable, true);
  if (constant !== 0 || out === "") out += signJoin(constant, out === "");
  return out.trim();
}

function formatQuadratic(x2, x, constant, variable) {
  const parts = [];
  if (x2 !== 0) {
    const body = Math.abs(x2) === 1 ? `${variable}²` : `${Math.abs(x2)}${variable}²`;
    parts.push({ sign: x2 < 0 ? "−" : "+", body });
  }
  if (x !== 0) {
    const body = Math.abs(x) === 1 ? variable : `${Math.abs(x)}${variable}`;
    parts.push({ sign: x < 0 ? "−" : "+", body });
  }
  if (constant !== 0 || !parts.length) {
    parts.push({ sign: constant < 0 ? "−" : "+", body: String(Math.abs(constant)) });
  }
  return parts.map((part, index) => {
    if (index === 0) return `${part.sign === "−" ? "−" : ""}${part.body}`;
    return ` ${part.sign} ${part.body}`;
  }).join("");
}

function formatSignedConstant(value) {
  return value < 0 ? `− ${Math.abs(value)}` : `+ ${value}`;
}

function factor(variable, constant) {
  return `(${variable} ${formatSignedConstant(constant)})`;
}

function algebraQuestion({ type, marks = 1, prompt, answer, working = [], diagram = null, space = SPACE_SIZES.MEDIUM, tags = [] }) {
  return createQuestion({
    id: randomId(),
    topic: TOPIC,
    level: "mixed",
    type,
    marks,
    prompt,
    diagram,
    answer,
    working,
    space,
    tags: ["stage-5", "algebraic-techniques-a", type, ...tags]
  });
}

function algebraDiagram(config = {}) {
  return {
    engine: "algebra-engine",
    config
  };
}

function makeBalancedPlan(typeIds, count) {
  const ids = typeIds.length ? typeIds.slice() : TYPE_LIST.map(type => type.id);
  const out = [];
  let i = 0;
  while (out.length < count) {
    out.push(ids[i % ids.length]);
    i += 1;
  }
  return shuffle(out);
}

function simplifyAlgebraicFractionQuestion() {
  const variable = choice(VARIABLES);
  const denominator = choice([2, 3, 4, 5, 6, 8, 10, 12]);
  const simplifiedCoeff = randInt(2, 9);
  const numeratorCoeff = denominator * simplifiedCoeff;
  const fraction = formatNumeratorOverDen(numeratorCoeff, variable, denominator);
  const answer = `${simplifiedCoeff}${variable}`;

  return algebraQuestion({
    type: "simplify-algebraic-fractions",
    marks: 1,
    prompt: `Simplify: ${fraction}`,
    answer,
    working: [
      `${fraction} = (${numeratorCoeff} ÷ ${denominator})${variable}`,
      `= ${answer}`
    ],
    space: SPACE_SIZES.SMALL
  });
}

function addSubtractAlgebraicFractionsQuestion() {
  const variable = choice(VARIABLES);
  const termCount = Math.random() < 0.35 ? 3 : 2;
  const denominators = shuffle([2, 3, 4, 5, 6, 8, 10]).slice(0, termCount);
  const operations = Array.from({ length: termCount - 1 }, () => choice([1, 1, -1]));
  const includeLinearNumerators = Math.random() < 0.75;
  const terms = denominators.map((denominator, index) => {
    const coef = randInt(1, 7);
    const constant = includeLinearNumerators && Math.random() < 0.65
      ? choice([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
      : 0;

    // Avoid every term looking identical when constants are omitted.
    const adjustedCoef = index === 0 ? coef : choice([coef, randInt(1, 7)]);
    return { coef: adjustedCoef, constant, denominator };
  });

  const commonDenominator = terms.reduce((acc, term) => acc * term.denominator / gcd(acc, term.denominator), 1);
  let resultCoef = 0;
  let resultConst = 0;

  terms.forEach((term, index) => {
    const sign = index === 0 ? 1 : operations[index - 1];
    const scale = commonDenominator / term.denominator;
    resultCoef += sign * term.coef * scale;
    resultConst += sign * term.constant * scale;
  });

  if (resultCoef === 0 && resultConst === 0) return addSubtractAlgebraicFractionsQuestion();

  const renderedTerms = terms.map(term => formatLinearFractionTerm(term.coef, term.constant, term.denominator, variable));
  let expression = renderedTerms[0];
  operations.forEach((operation, index) => {
    expression += ` ${operation > 0 ? "+" : "−"} ${renderedTerms[index + 1]}`;
  });

  const answer = simplifyLinearFraction(resultCoef, resultConst, commonDenominator, variable);
  const commonNumerator = formatLinear(resultCoef, resultConst, variable);
  const promptStem = Math.random() < 0.45 ? "Write as a single fraction" : "Simplify";

  return algebraQuestion({
    type: "add-subtract-algebraic-fractions",
    marks: 2,
    prompt: `${promptStem}: ${expression}`,
    answer,
    working: [
      `Use a common denominator of ${commonDenominator}.`,
      `${expression} = ${formatMathFraction(commonNumerator, commonDenominator)}`,
      `= ${answer}`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

function multiplyAlgebraicFractionsQuestion() {
  const variable = choice(VARIABLES);
  const d1 = choice([2, 3, 4, 5, 6, 8]);
  const d2 = choice([2, 3, 4, 5, 6, 10]);
  const c1 = randInt(2, 9);
  const c2 = randInt(2, 9);
  const result = mulFrac(frac(c1, d1), frac(c2, d2));
  const left = formatNumeratorOverDen(c1, variable, d1);
  const right = formatMathFraction(c2, d2);
  const answer = formatFractionTerm(result, variable);

  return algebraQuestion({
    type: "multiply-algebraic-fractions",
    marks: 1,
    prompt: `Simplify: ${left} × ${right}`,
    answer,
    working: [
      `Multiply the numerators and multiply the denominators.`,
      `${left} × ${right} = ${answer}`
    ],
    space: SPACE_SIZES.SMALL
  });
}

function divideAlgebraicFractionsQuestion() {
  const variable = choice(VARIABLES);
  const d1 = choice([2, 3, 4, 5, 6, 8]);
  const d2 = choice([2, 3, 4, 5, 6]);
  const c1 = randInt(2, 9);
  const c2 = randInt(2, 9);
  const result = divFrac(frac(c1, d1), frac(c2, d2));
  const left = formatNumeratorOverDen(c1, variable, d1);
  const right = formatMathFraction(c2, d2);
  const answer = formatFractionTerm(result, variable);

  return algebraQuestion({
    type: "divide-algebraic-fractions",
    marks: 1,
    prompt: `Simplify: ${left} ÷ ${right}`,
    answer,
    working: [
      `Dividing by ${right} is the same as multiplying by its reciprocal.`,
      `${left} ÷ ${right} = ${answer}`
    ],
    space: SPACE_SIZES.SMALL
  });
}

function mixedAlgebraicFractionsQuestion() {
  const variable = choice(VARIABLES);

  // A controlled mix of the textbook-style items: several algebraic fractions
  // with numerical denominators, some with linear numerators.
  const denominators = shuffle([2, 3, 4, 5, 6, 8, 10, 12]).slice(0, 3);
  const operations = [choice([1, 1, -1]), choice([1, -1])];
  const terms = denominators.map((denominator, index) => ({
    coef: randInt(1, 7),
    constant: index === 0 || Math.random() < 0.7
      ? choice([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
      : 0,
    denominator
  }));

  const commonDenominator = terms.reduce((acc, term) => acc * term.denominator / gcd(acc, term.denominator), 1);
  let resultCoef = 0;
  let resultConst = 0;

  terms.forEach((term, index) => {
    const sign = index === 0 ? 1 : operations[index - 1];
    const scale = commonDenominator / term.denominator;
    resultCoef += sign * term.coef * scale;
    resultConst += sign * term.constant * scale;
  });

  if (resultCoef === 0 && resultConst === 0) return mixedAlgebraicFractionsQuestion();

  const renderedTerms = terms.map(term => formatLinearFractionTerm(term.coef, term.constant, term.denominator, variable));
  let expression = renderedTerms[0];
  operations.forEach((operation, index) => {
    expression += ` ${operation > 0 ? "+" : "−"} ${renderedTerms[index + 1]}`;
  });

  const answer = simplifyLinearFraction(resultCoef, resultConst, commonDenominator, variable);
  const commonNumerator = formatLinear(resultCoef, resultConst, variable);

  return algebraQuestion({
    type: "mixed-algebraic-fractions",
    marks: 2,
    prompt: `Write as a single fraction: ${expression}`,
    answer,
    working: [
      `Use a common denominator of ${commonDenominator}.`,
      `${expression} = ${formatMathFraction(commonNumerator, commonDenominator)}`,
      `= ${answer}`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

function expandSingleBracketsQuestion() {
  const variable = choice(VARIABLES);
  const coefficient = randInt(2, 8);
  const constant = choice([2, 3, 4, 5, 6, 7, 8, -2, -3, -4, -5]);
  const answer = formatLinear(coefficient, coefficient * constant, variable);

  return algebraQuestion({
    type: "expand-single-brackets",
    marks: 1,
    prompt: `Expand: ${coefficient}${factor(variable, constant)}`,
    answer,
    working: [
      `${coefficient}${factor(variable, constant)} = ${coefficient} × ${variable} ${constant < 0 ? "−" : "+"} ${coefficient} × ${Math.abs(constant)}`,
      `= ${answer}`
    ],
    space: SPACE_SIZES.SMALL
  });
}

function expandNegativeCoefficientsQuestion() {
  const variable = choice(VARIABLES);
  const coefficient = -randInt(2, 6);
  const constant = choice([2, 3, 4, 5, -2, -3, -4, -5]);
  const answer = formatLinear(coefficient, coefficient * constant, variable);

  return algebraQuestion({
    type: "expand-negative-coefficients",
    marks: 1,
    prompt: `Expand: −${Math.abs(coefficient)}${factor(variable, constant)}`,
    answer,
    working: [
      `Multiply each term inside the bracket by −${Math.abs(coefficient)}.`,
      `= ${answer}`
    ],
    space: SPACE_SIZES.SMALL
  });
}

function expandCollectLikeTermsQuestion() {
  const variable = choice(VARIABLES);
  const coefficient = randInt(2, 7);
  const constant = choice([2, 3, 4, 5, -2, -3, -4]);
  const extra = choice([2, 3, 4, 5, -2, -3]);
  const answer = formatLinear(coefficient + extra, coefficient * constant, variable);

  return algebraQuestion({
    type: "expand-collect-like-terms",
    marks: 2,
    prompt: `Expand and simplify: ${coefficient}${factor(variable, constant)} ${extra < 0 ? "−" : "+"} ${Math.abs(extra)}${variable}`,
    answer,
    working: [
      `${coefficient}${factor(variable, constant)} = ${formatLinear(coefficient, coefficient * constant, variable)}`,
      `Collect like terms to get ${answer}.`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

function expandTwoBracketsQuestion() {
  const variable = choice(VARIABLES);
  const c1 = randInt(2, 6);
  const c2 = choice([2, 3, 4, -2, -3]);
  const a = choice([2, 3, 4, -2, -3]);
  const b = choice([2, 3, 4, 5, -2, -3]);
  // 2(q − 3) − 2(q − 3) simplifies to nothing at all: not a question
  if (c1 + c2 === 0 || c1 * a + c2 * b === 0) return expandTwoBracketsQuestion();
  const answer = formatLinear(c1 + c2, c1 * a + c2 * b, variable);
  const op = c2 < 0 ? "−" : "+";

  return algebraQuestion({
    type: "expand-two-brackets",
    marks: 2,
    prompt: `Expand and simplify: ${c1}${factor(variable, a)} ${op} ${Math.abs(c2)}${factor(variable, b)}`,
    answer,
    working: [
      `${c1}${factor(variable, a)} = ${formatLinear(c1, c1 * a, variable)}`,
      `${c2 < 0 ? "−" : ""}${Math.abs(c2)}${factor(variable, b)} = ${formatLinear(c2, c2 * b, variable)}`,
      `Collect like terms to get ${answer}.`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

function expandBinomialProductsQuestion() {
  const variable = choice(VARIABLES);
  const a = choice([2, 3, 4, 5, -2, -3, -4]);
  const b = choice([2, 3, 4, 5, 6, -2, -3]);
  const answer = formatQuadratic(1, a + b, a * b, variable);

  return algebraQuestion({
    type: "expand-binomial-products",
    marks: 2,
    prompt: `Expand: ${factor(variable, a)}${factor(variable, b)}`,
    answer,
    working: [
      `${factor(variable, a)}${factor(variable, b)} = ${variable}² ${formatVariableTerm(b, variable)} ${formatVariableTerm(a, variable)} ${signJoin(a * b)}`,
      `Collect like terms to get ${answer}.`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

function expandBinomialAreaModelQuestion() {
  const variable = choice(VARIABLES);
  const a = randInt(2, 7);
  const b = randInt(2, 7);
  const answer = formatQuadratic(1, a + b, a * b, variable);
  const expression = `${factor(variable, a)}${factor(variable, b)}`;

  return algebraQuestion({
    type: "expand-binomial-area-model",
    marks: 2,
    prompt: `Complete the area model below and simplify the expansion: ${expression}`,
    answer,
    working: [
      `The four parts are ${variable}², ${a}${variable}, ${b}${variable} and ${a * b}.`,
      `Collect like terms: ${answer}.`
    ],
    diagram: algebraDiagram({
      diagramType: "binomial-area-model",
      variable,
      a,
      b,
      showProducts: false
    }),
    space: SPACE_SIZES.MEDIUM
  });
}

function mixedExpansionSimplificationQuestion() {
  const variable = choice(VARIABLES);
  const c1 = randInt(2, 6);
  const c2 = randInt(2, 5);
  const a = choice([2, 3, 4, -2, -3]);
  const b = choice([2, 3, 4, -2, -3]);
  const extraConstant = choice([2, 3, 4, -2, -3]);
  // 3(r + 3) − 3(r + 2) − 3 is 0: nothing to write
  if (c1 === c2 && c1 * a - c2 * b + extraConstant === 0) return mixedExpansionSimplificationQuestion();
  const answer = formatLinear(c1 - c2, c1 * a - c2 * b + extraConstant, variable);

  return algebraQuestion({
    type: "mixed-expansion-simplification",
    marks: 2,
    prompt: `Expand and simplify: ${c1}${factor(variable, a)} − ${c2}${factor(variable, b)} ${extraConstant < 0 ? "−" : "+"} ${Math.abs(extraConstant)}`,
    answer,
    working: [
      `Expand each bracket, remembering the subtraction before the second bracket.`,
      `Collect like terms to get ${answer}.`
    ],
    space: SPACE_SIZES.MEDIUM
  });
}

const GENERATORS = {
  "simplify-algebraic-fractions": simplifyAlgebraicFractionQuestion,
  "add-subtract-algebraic-fractions": addSubtractAlgebraicFractionsQuestion,
  "multiply-algebraic-fractions": multiplyAlgebraicFractionsQuestion,
  "divide-algebraic-fractions": divideAlgebraicFractionsQuestion,
  "mixed-algebraic-fractions": mixedAlgebraicFractionsQuestion,
  "expand-single-brackets": expandSingleBracketsQuestion,
  "expand-negative-coefficients": expandNegativeCoefficientsQuestion,
  "expand-collect-like-terms": expandCollectLikeTermsQuestion,
  "expand-two-brackets": expandTwoBracketsQuestion,
  "expand-binomial-products": expandBinomialProductsQuestion,
  "expand-binomial-area-model": expandBinomialAreaModelQuestion,
  "mixed-expansion-simplification": mixedExpansionSimplificationQuestion
};
Object.assign(GENERATORS, EXTRA_ALG_A_GENERATORS);

export function getAlgebraicTechniquesAQuestionTypes() {
  return TYPE_LIST.map(type => ({ ...type }));
}

export function generateAlgebraicTechniquesAQuestions({
  count = 6,
  allowedTypes = []
} = {}) {
  const safeTypes = (allowedTypes || []).filter(type => GENERATORS[type]);
  const plan = makeBalancedPlan(safeTypes, count);

  return plan.map(type => (GENERATORS[type] || GENERATORS["expand-single-brackets"])());
}
