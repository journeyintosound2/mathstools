/*
  Mills Maths Tools — Stage 5 Question Bank: Indices A
  -----------------------------------------------------
  question-banks/stage-5/indices-a/index.js

  NSW Mathematics K–10 (2022), Stage 5, MA5-IND-C-01 (Core):
    "simplifies algebraic expressions involving positive-integer and zero
     indices, and establishes the meaning of negative indices for numerical
     bases"

  Content (docs/stage-5-syllabus-reference.md):
    - the index laws extended to pronumerals (product, quotient, power of a
      power, power of a product and of a quotient), with coefficients
    - the zero index
    - simplifying algebraic products and quotients
    - negative indices for NUMERICAL bases: the pattern that establishes
      them, their meaning, and the laws applied to numerical expressions

  Stage boundary: negative indices on PRONUMERALS are Indices B
  (MA5-IND-P-01); surds and fractional indices are Indices C.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, spaced
} from "../../_shared/bank-helpers.js";
import { sup, mono, num, afrac, MINUS, rat } from "../../_shared/algebra-helpers.js";

const TOPIC = "Indices A";

const TYPE_LIST = [
  { id: "product-law", label: "Product law: multiply powers" },
  { id: "quotient-law", label: "Quotient law: divide powers" },
  { id: "power-of-power", label: "Power of a power and of a product" },
  { id: "power-of-quotient", label: "Power of a quotient" },
  { id: "zero-index", label: "The zero index" },
  { id: "several-laws", label: "Simplify using several index laws" },
  { id: "algebraic-fractions-indices", label: "Simplify fractions with indices" },
  { id: "negative-index-pattern", label: "The pattern behind negative indices" },
  { id: "negative-index-meaning", label: "Negative indices as fractions" },
  { id: "write-negative-index", label: "Write with a negative index" },
  { id: "numerical-laws-negative", label: "Index laws with negative numerical indices" },
  { id: "evaluate-numerical", label: "Evaluate numerical expressions with indices" },
  { id: "substitute-indices", label: "Substitute into expressions with indices" },
  { id: "check-the-working", label: "Is the simplification correct?" },
  { id: "multi-part-indices-a", label: "Multi-part index laws problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage5", "indices", ...(spec.tags || [])] });
const V = ["a", "b", "m", "n", "p", "x", "y", "k"];

/* ── product and quotient laws ───────────────────────────── */

function productLawQuestion() {
  const v = choice(["single", "coef", "two-var", "three-factor"]);
  const x = choice(V);
  if (v === "single") {
    const a = randInt(2, 9); const b = randInt(2, 9);
    return q({
      type: "product-law", marks: 1,
      prompt: `Simplify ${x}${sup(a)} × ${x}${sup(b)}.`,
      answer: mono(1, { [x]: a + b }),
      working: ["Same base: add the indices.", `${x}${sup(a)} × ${x}${sup(b)} = ${x}${sup(`${a}+${b}`)} = ${x}${sup(a + b)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(1, { [x]: a * b }), mono(2, { [x]: a + b }), mono(1, { [x]: Math.abs(a - b) || 1 }), mono(2, { [x]: a * b })],
      tags: ["product law"]
    });
  }
  if (v === "coef") {
    const c1 = randInt(2, 9); const c2 = randInt(2, 8); const a = randInt(2, 8); const b = randInt(1, 8);
    return q({
      type: "product-law", marks: 1,
      prompt: `Simplify ${mono(c1, { [x]: a })} × ${mono(c2, { [x]: b })}.`,
      answer: mono(c1 * c2, { [x]: a + b }),
      working: ["Multiply the coefficients, add the indices.", `${c1} × ${c2} = ${c1 * c2}; ${a} + ${b} = ${a + b}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(c1 + c2, { [x]: a + b }), mono(c1 * c2, { [x]: a * b }), mono(c1 + c2, { [x]: a * b })],
      tags: ["product law", "coefficients"]
    });
  }
  const [x1, y1] = sample(V, 2).sort();
  if (v === "two-var") {
    const c1 = randInt(2, 6); const c2 = randInt(2, 6);
    const a1 = randInt(1, 6); const b1 = randInt(1, 5); const a2 = randInt(1, 6); const b2 = randInt(1, 5);
    return q({
      type: "product-law", marks: 2,
      prompt: `Simplify ${mono(c1, { [x1]: a1, [y1]: b1 })} × (${mono(-c2, { [x1]: a2, [y1]: b2 })}).`,
      answer: mono(-c1 * c2, { [x1]: a1 + a2, [y1]: b1 + b2 }),
      working: [`Coefficients: ${c1} × (${num(-c2)}) = ${num(-c1 * c2)}`, `${x1}: ${a1} + ${a2} = ${a1 + a2}; ${y1}: ${b1} + ${b2} = ${b1 + b2}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(c1 * c2, { [x1]: a1 + a2, [y1]: b1 + b2 }), mono(-c1 * c2, { [x1]: a1 * a2, [y1]: b1 * b2 }), mono(-c1 - c2, { [x1]: a1 + a2, [y1]: b1 + b2 })],
      tags: ["product law", "two pronumerals"]
    });
  }
  const e = [randInt(1, 5), randInt(2, 5), randInt(1, 4)];
  const c = [randInt(1, 4), randInt(2, 3), randInt(2, 5)];
  const tot = e.reduce((s, k) => s + k, 0);
  return q({
    type: "product-law", marks: 1,
    prompt: `Simplify ${c.map((k, i) => mono(k, { [x1]: e[i] })).join(" × ")}.`,
    answer: mono(c[0] * c[1] * c[2], { [x1]: tot }),
    working: [`${c.join(" × ")} = ${c[0] * c[1] * c[2]}`, `${e.join(" + ")} = ${tot}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [mono(c[0] + c[1] + c[2], { [x1]: tot }), mono(c[0] * c[1] * c[2], { [x1]: e[0] * e[1] * e[2] })],
    tags: ["product law"]
  });
}

function quotientLawQuestion() {
  const v = choice(["single", "coef", "fraction", "two-var"]);
  const x = choice(V);
  if (v === "single") {
    const b = randInt(2, 7); const a = b + randInt(1, 8);
    return q({
      type: "quotient-law", marks: 1,
      prompt: `Simplify ${x}${sup(a)} ÷ ${x}${sup(b)}.`,
      answer: mono(1, { [x]: a - b }),
      working: ["Same base: subtract the indices.", `${a} − ${b} = ${a - b}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(1, { [x]: a + b }), a % b === 0 ? mono(1, { [x]: a / b + 7 }) : mono(1, { [x]: a * b }), "1", mono(1, { [x]: a - b + 1 })],
      tags: ["quotient law"]
    });
  }
  const c2 = randInt(2, 6); const k = randInt(2, 6); const c1 = c2 * k;
  const b = randInt(1, 6); const a = b + randInt(1, 7);
  if (v === "coef") {
    return q({
      type: "quotient-law", marks: 1,
      prompt: `Simplify ${mono(c1, { [x]: a })} ÷ ${mono(c2, { [x]: b })}.`,
      answer: mono(k, { [x]: a - b }),
      working: ["Divide the coefficients, subtract the indices.", `${c1} ÷ ${c2} = ${k}; ${a} − ${b} = ${a - b}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(c1 - c2, { [x]: a - b }), mono(k, { [x]: a + b }), mono(k, { [x]: Math.max(1, Math.round(a / b)) })],
      tags: ["quotient law", "coefficients"]
    });
  }
  if (v === "fraction") {
    return q({
      type: "quotient-law", marks: 1,
      prompt: `Simplify ${afrac(mono(c1, { [x]: a }), mono(c2, { [x]: b }))}.`,
      answer: mono(k, { [x]: a - b }),
      working: ["A fraction bar means divide.", `${c1} ÷ ${c2} = ${k}; ${x}${sup(a)} ÷ ${x}${sup(b)} = ${x}${sup(a - b)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(k, { [x]: a + b }), mono(c1 - c2, { [x]: a - b })],
      tags: ["quotient law", "fraction"]
    });
  }
  const [x1, y1] = sample(V, 2).sort();
  const b1 = randInt(1, 4); const a1 = b1 + randInt(1, 5); const b2 = randInt(1, 4); const a2 = b2 + randInt(0, 4);
  return q({
    type: "quotient-law", marks: 2,
    prompt: `Simplify ${mono(c1, { [x1]: a1, [y1]: a2 })} ÷ (${mono(-c2, { [x1]: b1, [y1]: b2 })}).`,
    answer: mono(-k, { [x1]: a1 - b1, [y1]: a2 - b2 }),
    working: [`${c1} ÷ (${num(-c2)}) = ${num(-k)}`, `${x1}: ${a1} − ${b1} = ${a1 - b1}; ${y1}: ${a2} − ${b2} = ${a2 - b2}${a2 === b2 ? ` (${y1}⁰ = 1)` : ""}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [mono(k, { [x1]: a1 - b1, [y1]: a2 - b2 }), mono(-k, { [x1]: a1 + b1, [y1]: a2 + b2 })],
    tags: ["quotient law", "two pronumerals"]
  });
}

/* ── powers ──────────────────────────────────────────────── */

function powerOfPowerQuestion() {
  const v = choice(["simple", "coef", "product", "negative"]);
  const x = choice(V);
  const a = randInt(2, 6); const n = randInt(2, 5);
  if (v === "simple") {
    return q({
      type: "power-of-power", marks: 1,
      prompt: `Simplify (${x}${sup(a)})${sup(n)}.`,
      answer: mono(1, { [x]: a * n }),
      working: ["Power of a power: multiply the indices.", `${a} × ${n} = ${a * n}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(1, { [x]: a + n }), mono(n, { [x]: a }), mono(1, { [x]: a ** n })],
      tags: ["power of a power"]
    });
  }
  const c = randInt(2, 4); const m = randInt(2, 3);
  if (v === "coef") {
    return q({
      type: "power-of-power", marks: 1,
      prompt: `Simplify (${mono(c, { [x]: a })})${sup(m)}.`,
      answer: mono(c ** m, { [x]: a * m }),
      working: ["Raise EVERY factor inside the bracket to the power.", `${c}${sup(m)} = ${c ** m}; ${x}${sup(a * m)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(c, { [x]: a * m }), mono(c * m, { [x]: a * m }), mono(c ** m, { [x]: a + m })],
      tags: ["power of a product"]
    });
  }
  const [x1, y1] = sample(V, 2).sort();
  const b = randInt(1, 4);
  if (v === "product") {
    return q({
      type: "power-of-power", marks: 2,
      prompt: `Simplify (${mono(c, { [x1]: a, [y1]: b })})${sup(m)}.`,
      answer: mono(c ** m, { [x1]: a * m, [y1]: b * m }),
      working: [`${c}${sup(m)} = ${c ** m}`, `(${x1}${sup(a)})${sup(m)} = ${x1}${sup(a * m)}; (${y1}${sup(b)})${sup(m)} = ${y1}${sup(b * m)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [mono(c * m, { [x1]: a * m, [y1]: b * m }), mono(c ** m, { [x1]: a + m, [y1]: b + m }), mono(c, { [x1]: a * m, [y1]: b * m })],
      tags: ["power of a product"]
    });
  }
  const mm = choice([2, 3]);
  return q({
    type: "power-of-power", marks: 1,
    prompt: `Simplify (${mono(-c, { [x]: a })})${sup(mm)}.`,
    answer: mono((-c) ** mm, { [x]: a * mm }),
    working: [`(${num(-c)})${sup(mm)} = ${num((-c) ** mm)} — ${mm === 2 ? "an even power is positive" : "an odd power keeps the negative sign"}`, `${x}${sup(a * mm)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [mono(-((-c) ** mm), { [x]: a * mm }), mono((-c) ** mm, { [x]: a + mm }), mono(-c * mm, { [x]: a * mm })],
    tags: ["power of a product", "negative base"]
  });
}

function powerOfQuotientQuestion() {
  const x = choice(["x", "a", "m"]);
  const y = choice(["y", "b", "n"]);
  const a = randInt(1, 4); const b = randInt(1, 4); const n = randInt(2, 4);
  const c = randInt(2, 3);
  const withCoef = Math.random() < 0.5;
  return q({
    type: "power-of-quotient", marks: 1,
    prompt: `Simplify (${afrac(mono(withCoef ? c : 1, { [x]: a }), mono(1, { [y]: b }))})${sup(n)}.`,
    answer: afrac(mono(withCoef ? c ** n : 1, { [x]: a * n }), mono(1, { [y]: b * n })),
    working: ["Raise the numerator and the denominator to the power.", `${withCoef ? `${c}${sup(n)} = ${c ** n}; ` : ""}${x}${sup(a * n)} over ${y}${sup(b * n)}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [afrac(mono(withCoef ? c : 1, { [x]: a * n }), mono(1, { [y]: b * n })), afrac(mono(withCoef ? c ** n : 1, { [x]: a + n }), mono(1, { [y]: b + n })), afrac(mono(withCoef ? c ** n : 1, { [x]: a * n }), mono(1, { [y]: b }))],
    tags: ["power of a quotient"]
  });
}

function zeroIndexQuestion() {
  const v = choice(["plain", "coef", "bracket", "expression", "law"]);
  const x = choice(V);
  const c = randInt(2, 9);
  if (v === "plain") {
    const base = choice([`${x}`, String(randInt(2, 50)), `(${randInt(2, 9)}${x})`, `(${x}y)`]);
    return q({ type: "zero-index", marks: 1, prompt: `Evaluate ${base}⁰.`, answer: "1", working: ["Any non-zero base to the power 0 equals 1."], space: SPACE_SIZES.SMALL, mcDistractors: ["0", base.replace(/[()]/g, ""), "undefined"], tags: ["zero index"] });
  }
  if (v === "coef") {
    return q({ type: "zero-index", marks: 1, prompt: `Simplify ${c}${x}⁰.`, answer: String(c), working: [`Only ${x} is raised to the power 0: ${c} × 1 = ${c}`], space: SPACE_SIZES.SMALL, mcDistractors: ["1", "0", `${c}${x}`], tags: ["zero index"] });
  }
  if (v === "bracket") {
    return q({ type: "zero-index", marks: 1, prompt: `Simplify (${c}${x})⁰.`, answer: "1", working: ["The whole bracket is raised to the power 0, so it equals 1."], space: SPACE_SIZES.SMALL, mcDistractors: [String(c), "0", `${c}${x}`], tags: ["zero index"] });
  }
  if (v === "expression") {
    const d = randInt(1, 9);
    return q({ type: "zero-index", marks: 1, prompt: `Evaluate ${c}${x}⁰ + (${d}${x})⁰.`, answer: String(c + 1), working: [`${c}${x}⁰ = ${c} × 1 = ${c}`, `(${d}${x})⁰ = 1`, `${c} + 1 = ${c + 1}`], space: SPACE_SIZES.SMALL, mcDistractors: ["2", String(c + d), String(c)], tags: ["zero index"] });
  }
  const a = randInt(2, 9);
  return q({
    type: "zero-index", marks: 2,
    prompt: `Simplify ${x}${sup(a)} ÷ ${x}${sup(a)} in two ways, and explain what this shows about ${x}⁰.`,
    answer: `Dividing a number by itself gives 1; the quotient law gives ${x}${sup(a)} ÷ ${x}${sup(a)} = ${x}⁰. So ${x}⁰ = 1.`,
    working: [`${x}${sup(a)} ÷ ${x}${sup(a)} = 1 (anything non-zero divided by itself)`, `${x}${sup(a)} ÷ ${x}${sup(a)} = ${x}${sup(`${a}−${a}`)} = ${x}⁰`, `So ${x}⁰ = 1.`],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["zero index", "reasoning"]
  });
}

function severalLawsQuestion() {
  const x = choice(V);
  const v = choice(["pow-times-div", "product-over", "bracket-product"]);
  if (v === "pow-times-div") {
    const c = randInt(2, 3); const a = randInt(2, 4); const m = 2; const d = randInt(2, 5); const e = randInt(1, 5);
    const coef = c ** m * d;
    const div = choice([2, 3, 4, 6].filter(k => coef % k === 0));
    const top = a * m + e;
    const f = randInt(1, top - 1);
    return q({
      type: "several-laws", marks: 2,
      prompt: `Simplify (${mono(c, { [x]: a })})${sup(m)} × ${mono(d, { [x]: e })} ÷ ${mono(div, { [x]: f })}.`,
      answer: mono(coef / div, { [x]: top - f }),
      working: [`(${mono(c, { [x]: a })})${sup(m)} = ${mono(c ** m, { [x]: a * m })}`, `× ${mono(d, { [x]: e })} = ${mono(coef, { [x]: top })}`, `÷ ${mono(div, { [x]: f })} = ${mono(coef / div, { [x]: top - f })}`],
      space: SPACE_SIZES.MEDIUM,
      mcDistractors: [mono(coef / div, { [x]: a + m + e - f }), mono(c * m * d / div, { [x]: top - f }), mono(coef / div, { [x]: top + f })],
      tags: ["mixed laws"]
    });
  }
  if (v === "product-over") {
    const a = randInt(2, 6); const b = randInt(2, 6); const c = randInt(1, a + b - 1);
    const k1 = randInt(2, 6); const k2 = randInt(2, 6); const k3Opts = [2, 3, 4].filter(k => (k1 * k2) % k === 0);
    const k3 = k3Opts.length ? choice(k3Opts) : 1;
    return q({
      type: "several-laws", marks: 2,
      prompt: `Simplify ${afrac(`${mono(k1, { [x]: a })} × ${mono(k2, { [x]: b })}`, mono(k3, { [x]: c }))}.`,
      answer: mono(k1 * k2 / k3, { [x]: a + b - c }),
      working: [`Numerator: ${mono(k1 * k2, { [x]: a + b })}`, `Divide: ${k1 * k2} ÷ ${k3} = ${k1 * k2 / k3}; ${a + b} − ${c} = ${a + b - c}`],
      space: SPACE_SIZES.MEDIUM,
      mcDistractors: [mono(k1 * k2 / k3, { [x]: a * b - c }), mono(k1 + k2 - k3, { [x]: a + b - c })],
      tags: ["mixed laws"]
    });
  }
  const [x1, y1] = sample(V, 2).sort();
  const a = randInt(1, 3); const b = randInt(1, 3); const n = 2; const c = randInt(2, 3);
  const d = randInt(1, 4); const e = randInt(1, 4);
  return q({
    type: "several-laws", marks: 2,
    prompt: `Simplify (${mono(c, { [x1]: a, [y1]: b })})${sup(n)} × ${mono(1, { [x1]: d, [y1]: e })}.`,
    answer: mono(c ** n, { [x1]: a * n + d, [y1]: b * n + e }),
    working: [`(${mono(c, { [x1]: a, [y1]: b })})² = ${mono(c ** n, { [x1]: a * n, [y1]: b * n })}`, `× ${mono(1, { [x1]: d, [y1]: e })} = ${mono(c ** n, { [x1]: a * n + d, [y1]: b * n + e })}`],
    space: SPACE_SIZES.MEDIUM,
    mcDistractors: [mono(c * n, { [x1]: a * n + d, [y1]: b * n + e }), mono(c ** n, { [x1]: (a + n) + d, [y1]: (b + n) + e })],
    tags: ["mixed laws"]
  });
}

function algebraicFractionsIndicesQuestion() {
  const [x, y] = sample(V, 2).sort();
  const a = randInt(3, 8); const b = randInt(1, a - 1); const c = randInt(1, 4); const d = randInt(c + 1, c + 4);
  const k1 = randInt(2, 5) * 3; const k2 = choice([3, 6, 9].filter(k => k !== k1)) || 3;
  const g = (p, q2) => { while (q2) [p, q2] = [q2, p % q2]; return p; };
  const G = g(k1, k2);
  const top = mono(k1 / G, { [x]: a - b });
  const bot = mono(k2 / G, { [y]: d - c });
  return q({
    type: "algebraic-fractions-indices", marks: 2,
    prompt: `Simplify ${afrac(mono(k1, { [x]: a, [y]: c }), mono(k2, { [x]: b, [y]: d }))}.`,
    answer: k2 / G === 1 && d - c === 0 ? top : afrac(top, bot),
    working: [`Coefficients: ${k1}/${k2} = ${k1 / G}/${k2 / G}`, `${x}: ${a} − ${b} = ${a - b} (stays on top)`, `${y}: more on the bottom — ${d} − ${c} = ${d - c} (stays on the bottom)`],
    space: SPACE_SIZES.SMALL,
    mcEligible: false,
    tags: ["algebraic fractions"]
  });
}

/* ── negative indices, numerical bases ───────────────────── */

function negativeIndexPatternQuestion() {
  const base = choice([2, 3, 5, 10]);
  const rows = [3, 2, 1, 0, -1, -2, -3];
  const value = e => (e >= 0 ? String(base ** e) : rat(1, base ** -e));
  const blanks = new Set(sample([0, -1, -2, -3, 1], 3));
  return q({
    type: "negative-index-pattern", marks: 3,
    prompt: `Each time the index goes down by 1, the value is divided by ${base}. Use this pattern to complete the table.`,
    table: { headerRow: true, rows: [["Power", ...rows.map(e => `${base}${sup(e)}`)], ["Value", ...rows.map(e => (blanks.has(e) ? "" : value(e)))]] },
    answer: [...blanks].sort((p, r) => r - p).map(e => `${base}${sup(e)} = ${value(e)}`).join("; "),
    working: [`Divide by ${base} each step: ${rows.map(value).join(", ")}`, `So ${base}⁰ = 1 and ${base}⁻¹ = ${value(-1)}.`],
    space: "none",
    mcEligible: false,
    tags: ["negative index", "pattern"]
  });
}

function negativeIndexMeaningQuestion() {
  const base = choice([2, 3, 4, 5, 6, 10]);
  const e = base === 10 ? randInt(1, 4) : randInt(1, base <= 3 ? 4 : 3);
  const asDecimal = base === 10 && Math.random() < 0.5;
  return q({
    type: "negative-index-meaning", marks: 1,
    prompt: `Write ${base}${sup(-e)} as ${asDecimal ? "a decimal" : "a fraction"}.`,
    answer: asDecimal ? (1 / 10 ** e).toFixed(e) : rat(1, base ** e),
    working: [`${base}${sup(-e)} = 1/${base}${sup(e)} = 1/${spaced(base ** e)}${asDecimal ? ` = ${(1 / 10 ** e).toFixed(e)}` : ""}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: asDecimal ? [`${MINUS}${spaced(10 ** e)}`, (1 / 10 ** (e + 1)).toFixed(e + 1), `${MINUS}${e * 10}`] : [`${MINUS}${spaced(base ** e)}`, `${MINUS}${base * e}`, rat(1, base * e), rat(-1, base ** e)],
    tags: ["negative index"]
  });
}

function writeNegativeIndexQuestion() {
  const base = choice([2, 3, 5, 7, 10]);
  const e = randInt(2, base <= 3 ? 5 : 3);
  const form = choice(["power", "number"]);
  return q({
    type: "write-negative-index", marks: 1,
    prompt: form === "power" ? `Write ${afrac("1", `${base}${sup(e)}`)} using a negative index.` : `Write ${rat(1, base ** e)} as a power of ${base} with a negative index.`,
    answer: `${base}${sup(-e)}`,
    working: [form === "number" ? `${spaced(base ** e)} = ${base}${sup(e)}` : "", `1/${base}${sup(e)} = ${base}${sup(-e)}`].filter(Boolean),
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${base}${sup(e)}`, `${MINUS}${base}${sup(e)}`, `${e}${sup(-base)}`],
    tags: ["negative index"]
  });
}

function numericalLawsNegativeQuestion() {
  const base = choice([2, 3, 5, 10]);
  const v = choice(["product", "quotient", "power"]);
  let a; let b; let res; let prompt; let work;
  if (v === "product") {
    a = randInt(2, 7); b = -randInt(1, a + 2); res = a + b;
    prompt = `Simplify ${base}${sup(a)} × ${base}${sup(b)}, giving your answer as a power of ${base}.`;
    work = [`${a} + (${num(b)}) = ${num(res)}`];
  } else if (v === "quotient") {
    a = randInt(1, 5); b = randInt(a + 1, a + 5); res = a - b;
    prompt = `Simplify ${base}${sup(a)} ÷ ${base}${sup(b)}, giving your answer as a power of ${base}.`;
    work = [`${a} − ${b} = ${num(res)}`];
  } else {
    a = -randInt(1, 3); b = randInt(2, 3); res = a * b;
    prompt = `Simplify (${base}${sup(a)})${sup(b)}, giving your answer as a power of ${base}.`;
    work = [`${num(a)} × ${b} = ${num(res)}`];
  }
  return q({
    type: "numerical-laws-negative", marks: 1,
    prompt,
    answer: `${base}${sup(res)}`,
    working: work,
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${base}${sup(v === "product" ? a * b : v === "quotient" ? a + b : a + b)}`, `${base}${sup(-res || 1)}`, `${base * base}${sup(res)}`],
    tags: ["negative index", "index laws"]
  });
}

function evaluateNumericalQuestion() {
  const base = choice([2, 3, 5]);
  const v = choice(["pos", "neg", "fraction"]);
  if (v === "pos") {
    const a = randInt(3, 6); const b = randInt(2, 3); const c = randInt(2, a + b - 1);
    const e = a + b - c;
    if (base ** e > 1000 || e > 5) return evaluateNumericalQuestion();
    return q({
      type: "evaluate-numerical", marks: 2,
      prompt: `Evaluate ${base}${sup(a)} × ${base}${sup(b)} ÷ ${base}${sup(c)} without a calculator.`,
      answer: spaced(base ** e),
      working: [`= ${base}${sup(`${a}+${b}−${c}`)} = ${base}${sup(e)}`, `= ${spaced(base ** e)}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [spaced(base ** (e + 1)), spaced(base * e), spaced(e)],
      tags: ["evaluate"]
    });
  }
  if (v === "neg") {
    const a = randInt(1, 3); const b = randInt(a + 1, a + 3);
    const e = a - b;
    return q({
      type: "evaluate-numerical", marks: 2,
      prompt: `Evaluate ${base}${sup(a)} ÷ ${base}${sup(b)} without a calculator. Give the answer as a fraction.`,
      answer: rat(1, base ** -e),
      working: [`= ${base}${sup(e)} = 1/${base}${sup(-e)} = ${rat(1, base ** -e).replace(/\[\[frac:(\d+):(\d+)\]\]/, "$1/$2")}`],
      space: SPACE_SIZES.SMALL,
      mcDistractors: [`${MINUS}${base ** -e}`, rat(1, base * -e), `${base ** -e}`],
      tags: ["evaluate", "negative index"]
    });
  }
  const a = randInt(2, 3); const e = randInt(1, 2);
  const top = base ** a;
  return q({
    type: "evaluate-numerical", marks: 2,
    prompt: `Evaluate ${base}${sup(a)} × ${base}${sup(-a - e)}. Give your answer as a fraction.`,
    answer: rat(1, base ** e),
    working: [`${a} + (${num(-a - e)}) = ${num(-e)}`, `${base}${sup(-e)} = ${rat(1, base ** e).replace(/\[\[frac:(\d+):(\d+)\]\]/, "$1/$2")}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`${MINUS}${base ** e}`, rat(1, top), `${base ** e}`],
    tags: ["evaluate", "negative index"]
  });
}

function substituteIndicesQuestion() {
  const x = choice(["x", "a", "n"]);
  const val = choice([2, 3, -2, -1, 5]);
  const c = randInt(2, 5); const e = randInt(2, val === 5 ? 2 : 4);
  const k = randInt(1, 9);
  const v = choice(["cx^e", "(cx)^e", "x^e - k"]);
  let prompt; let ans; let work;
  if (v === "cx^e") { ans = c * val ** e; prompt = `Evaluate ${mono(c, { [x]: e })} when ${x} = ${num(val)}.`; work = [`${c} × (${num(val)})${sup(e)} = ${c} × ${num(val ** e)} = ${num(ans)}`]; }
  else if (v === "(cx)^e") { ans = (c * val) ** e; prompt = `Evaluate (${c}${x})${sup(e)} when ${x} = ${num(val)}.`; work = [`(${c} × ${num(val)})${sup(e)} = (${num(c * val)})${sup(e)} = ${num(ans)}`]; }
  else { ans = val ** e - k; prompt = `Evaluate ${x}${sup(e)} − ${k} when ${x} = ${num(val)}.`; work = [`(${num(val)})${sup(e)} − ${k} = ${num(val ** e)} − ${k} = ${num(ans)}`]; }
  if (Math.abs(ans) > 5000) return substituteIndicesQuestion();
  return q({
    type: "substitute-indices", marks: 1,
    prompt, answer: num(ans), working: work,
    space: SPACE_SIZES.SMALL,
    mcDistractors: [num(-ans), num(c * val * e), num(ans + k * 2)],
    tags: ["substitution"]
  });
}

function checkTheWorkingQuestion() {
  const x = choice(V);
  // a = b = 2 would make the "mistake" true: 2 + 2 = 2 × 2
  let a = randInt(2, 5); const b = randInt(2, 5); if (a === 2 && b === 2) a = 3;
  const cases = [
    { shown: `${x}${sup(a)} × ${x}${sup(b)} = ${x}${sup(a * b)}`, ok: false, right: `${x}${sup(a + b)}`, why: "The indices should be ADDED when multiplying powers of the same base, not multiplied." },
    { shown: `(${x}${sup(a)})${sup(b)} = ${x}${sup(a + b)}`, ok: false, right: `${x}${sup(a * b)}`, why: "For a power of a power the indices are MULTIPLIED." },
    { shown: `(3${x})${sup(2)} = 3${x}²`, ok: false, right: `9${x}²`, why: "Both factors inside the bracket are squared: 3² = 9." },
    { shown: `5${x}⁰ = 1`, ok: false, right: "5", why: `Only the ${x} is raised to the power 0; 5 × 1 = 5.` },
    { shown: `${x}${sup(a + b)} ÷ ${x}${sup(b)} = ${x}${sup(a)}`, ok: true, right: `${x}${sup(a)}`, why: "Correct: subtract the indices." },
    { shown: `2${sup(-3)} = ${MINUS}8`, ok: false, right: "1/8", why: "A negative index means a reciprocal, not a negative number." }
  ];
  const cse = choice(cases);
  return q({
    type: "check-the-working", marks: 2,
    prompt: `Is this simplification correct? ${cse.shown}. If not, give the correct answer and explain.`,
    answer: cse.ok ? `Yes. ${cse.why}` : `No — it should be ${cse.right}. ${cse.why}`,
    working: [cse.why],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["reasoning", "error analysis"]
  });
}

function multiPartIndicesAQuestion() {
  const x = choice(V);
  const a = randInt(2, 5); const b = randInt(2, 5); const c = randInt(2, 3); const base = choice([2, 3, 5]); const e = randInt(1, 3);
  return q({
    type: "multi-part-indices-a", marks: 4,
    prompt: "Simplify, or evaluate where there are no pronumerals.",
    subparts: [
      { label: "(a)", prompt: `${x}${sup(a)} × ${x}${sup(b)}`, marks: 1, answer: mono(1, { [x]: a + b }), working: [`${a} + ${b} = ${a + b}`] },
      { label: "(b)", prompt: `(${mono(c, { [x]: a })})²`, marks: 1, answer: mono(c * c, { [x]: 2 * a }), working: [`${c}² = ${c * c}; ${a} × 2 = ${2 * a}`] },
      { label: "(c)", prompt: `${mono(7, { [x]: 0 })} + ${x}⁰`, marks: 1, answer: "8", working: ["7 × 1 + 1 = 8"] },
      { label: "(d)", prompt: `${base}${sup(-e)}`, marks: 1, answer: rat(1, base ** e), working: [`1/${base}${sup(e)}`] }
    ],
    answer: `(a) ${mono(1, { [x]: a + b })}; (b) ${mono(c * c, { [x]: 2 * a })}; (c) 8; (d) ${rat(1, base ** e)}`,
    working: [],
    space: SPACE_SIZES.SMALL,
    tags: ["multi-part"]
  });
}

const GENERATORS = {
  "product-law": productLawQuestion,
  "quotient-law": quotientLawQuestion,
  "power-of-power": powerOfPowerQuestion,
  "power-of-quotient": powerOfQuotientQuestion,
  "zero-index": zeroIndexQuestion,
  "several-laws": severalLawsQuestion,
  "algebraic-fractions-indices": algebraicFractionsIndicesQuestion,
  "negative-index-pattern": negativeIndexPatternQuestion,
  "negative-index-meaning": negativeIndexMeaningQuestion,
  "write-negative-index": writeNegativeIndexQuestion,
  "numerical-laws-negative": numericalLawsNegativeQuestion,
  "evaluate-numerical": evaluateNumericalQuestion,
  "substitute-indices": substituteIndicesQuestion,
  "check-the-working": checkTheWorkingQuestion,
  "multi-part-indices-a": multiPartIndicesAQuestion
};

export function getIndicesAQuestionTypes() { return TYPE_LIST; }
export function generateIndicesAQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
