/*
  Mills Maths Tools — Stage 5 Question Bank: Indices C (surds and fractional indices)
  ------------------------------------------------------------------------------------
  question-banks/stage-5/indices-c/index.js

  NSW Mathematics K–10 (2022), Stage 5, MA5-IND-P-02 (Path):
    "describes and performs operations with surds and fractional indices"

  Content:
    - rational and irrational numbers; surds as irrational roots
    - simplifying surds, and writing a mixed surd as an entire surd
    - adding and subtracting like surds (after simplifying)
    - multiplying and dividing surds
    - expanding brackets with surds, including binomial products and the
      conjugate pair (a + √b)(a − √b)
    - rationalising denominators (monomial, and binomial via the conjugate)
    - fractional indices: a^(1/n) = ⁿ√a and a^(m/n); evaluating, converting
      between surd and index form, and the index laws with fractional indices
    - surds in measurement problems (exact answers from Pythagoras, perimeter
      and area)

  Every surd answer is in simplest form, found by pulling out the largest
  square factor; tools/stage5-number.mjs checks each by squaring back.
*/

import {
  SPACE_SIZES, randInt, choice, shuffle, sample, makeQuestion, generateFromRegistry, gcd
} from "../../_shared/bank-helpers.js";
import { sup, mono, num, afrac, rat, MINUS, surdParts, surdText, joinTerms, isqrt } from "../../_shared/algebra-helpers.js";

const TOPIC = "Indices C";

const TYPE_LIST = [
  { id: "rational-or-irrational", label: "Rational or irrational?" },
  { id: "simplify-surd", label: "Simplify a surd" },
  { id: "entire-surd", label: "Write as an entire surd" },
  { id: "add-subtract-surds", label: "Add and subtract surds" },
  { id: "multiply-surds", label: "Multiply surds" },
  { id: "divide-surds", label: "Divide surds" },
  { id: "expand-surds", label: "Expand brackets with surds" },
  { id: "binomial-surds", label: "Binomial products with surds" },
  { id: "rationalise-monomial", label: "Rationalise the denominator" },
  { id: "rationalise-binomial", label: "Rationalise a binomial denominator" },
  { id: "order-surds", label: "Compare and order surds" },
  { id: "fractional-index-evaluate", label: "Evaluate fractional indices" },
  { id: "surd-index-form", label: "Convert between surd and index form" },
  { id: "fractional-index-laws", label: "Index laws with fractional indices" },
  { id: "surd-measurement", label: "Exact answers with surds (measurement)" },
  { id: "multi-part-surds", label: "Multi-part surds problem" }
];

const q = spec => makeQuestion(TOPIC, { ...spec, tags: ["stage5", "surds", ...(spec.tags || [])] });
const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
const s2 = (a, b) => surdText(a, b);

function simplest(n) {
  const p = surdParts(n);
  return s2(p.out, p.in);
}

/* A surd a√b as a value, for checks and ordering. */
const val = (a, b) => a * Math.sqrt(b);

/* ── rational/irrational ─────────────────────────────────── */

function rationalOrIrrationalQuestion() {
  const pool = [
    { t: `√${choice([16, 25, 36, 49, 81, 100, 144])}`, r: true, why: "It is a perfect square root, a whole number." },
    { t: `√${choice([2, 3, 5, 7, 11, 12, 20])}`, r: false, why: "It is the root of a number that is not a perfect square, so its decimal never ends or repeats." },
    { t: "π", r: false, why: "π cannot be written as a fraction; its decimal never ends or repeats." },
    { t: `0.${randInt(1, 9)}${randInt(1, 9)} (recurring)`, r: true, why: "Every recurring decimal can be written as a fraction." },
    { t: rat(randInt(1, 9), choice([7, 11, 13])), r: true, why: "It is already a fraction of two integers." },
    { t: `∛${choice([8, 27, 64, 125])}`, r: true, why: "It is a perfect cube root, a whole number." },
    { t: `∛${choice([2, 4, 9, 10])}`, r: false, why: "It is the cube root of a number that is not a perfect cube." },
    { t: `√${choice([4, 9, 16])} + √${choice([2, 3])}`, r: false, why: "A rational number plus an irrational one is irrational." }
  ];
  const v = choice(["single", "list"]);
  if (v === "single") {
    const it = choice(pool);
    return q({ type: "rational-or-irrational", marks: 1, prompt: `Is ${it.t} rational or irrational? Give a reason.`, answer: `${it.r ? "Rational" : "Irrational"}: ${it.why}`, working: [it.why], space: SPACE_SIZES.MEDIUM, mcEligible: false, tags: ["rational", "irrational"] });
  }
  const items = sample(pool, 4);
  if (items.every(i => i.r) || items.every(i => !i.r)) return rationalOrIrrationalQuestion();
  return q({ type: "rational-or-irrational", marks: 2, prompt: `Which of these numbers are irrational? ${items.map(i => i.t).join(", ")}`, answer: items.filter(i => !i.r).map(i => i.t).join(", "), working: items.map(i => `${i.t}: ${i.r ? "rational" : "irrational"} — ${i.why}`), space: SPACE_SIZES.MEDIUM, mcEligible: false, tags: ["rational", "irrational"] });
}

/* ── simplifying ─────────────────────────────────────────── */

function simplifySurdQuestion() {
  const inside = choice(SQUAREFREE.slice(0, 7));
  const out = randInt(2, 7);
  const n = out * out * inside;
  const coef = Math.random() < 0.3 ? randInt(2, 4) : 1;
  const p = surdParts(n);
  return q({
    type: "simplify-surd", marks: 1,
    prompt: `Simplify ${coef === 1 ? "" : coef}√${n}.`,
    answer: s2(coef * p.out, p.in),
    working: [`Largest square factor of ${n}: ${p.out * p.out}`, `√${n} = √${p.out * p.out} × √${p.in} = ${s2(p.out, p.in)}`, coef > 1 ? `${coef} × ${s2(p.out, p.in)} = ${s2(coef * p.out, p.in)}` : ""].filter(Boolean),
    space: SPACE_SIZES.SMALL,
    mcDistractors: [s2(coef * p.in, p.out * p.out > 9 ? p.out : p.out + 1), s2(coef * (p.out * p.out) / 2 || 2, p.in), s2(coef * p.out, p.in * 2), s2(coef, n / 4 === Math.floor(n / 4) ? n / 4 : n)],
    tags: ["simplify"]
  });
}

function entireSurdQuestion() {
  const a = randInt(2, 8); const b = choice(SQUAREFREE.slice(0, 7));
  return q({
    type: "entire-surd", marks: 1,
    prompt: `Write ${s2(a, b)} as an entire surd.`,
    answer: `√${a * a * b}`,
    working: [`${a} = √${a * a}`, `√${a * a} × √${b} = √${a * a * b}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: [`√${a * b}`, `√${a + b}`, `√${2 * a * b}`, `√${a * a + b}`],
    tags: ["entire surd"]
  });
}

function addSubtractSurdsQuestion() {
  const b = choice(SQUAREFREE.slice(0, 6));
  const v = choice(["like", "simplify-first", "unlike"]);
  if (v === "like") {
    const a = randInt(2, 9); const c = randInt(1, 9); const sub = Math.random() < 0.4;
    const r = sub ? a - c : a + c;
    return q({ type: "add-subtract-surds", marks: 1, prompt: `Simplify ${s2(a, b)} ${sub ? MINUS : "+"} ${s2(c, b)}.`, answer: r === 0 ? "0" : s2(r, b), working: [`Like surds: ${a} ${sub ? MINUS : "+"} ${c} = ${num(r)}, so ${r === 0 ? "0" : s2(r, b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [s2(sub ? a - c : a + c, 2 * b), s2(sub ? a * c : a * c, b), `√${2 * b}`], tags: ["add surds"] });
  }
  if (v === "simplify-first") {
    const m1 = randInt(1, 4); const m2 = randInt(2, 5); const sub = Math.random() < 0.4;
    const n1 = m1 * m1 * b; const n2 = m2 * m2 * b;
    const r = sub ? m1 - m2 : m1 + m2;
    return q({ type: "add-subtract-surds", marks: 2, prompt: `Simplify √${n1} ${sub ? MINUS : "+"} √${n2}.`, answer: r === 0 ? "0" : s2(r, b), working: [`√${n1} = ${s2(m1, b)}; √${n2} = ${s2(m2, b)}`, `${m1} ${sub ? MINUS : "+"} ${m2} = ${num(r)}, so ${r === 0 ? "0" : s2(r, b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [`√${sub ? Math.abs(n1 - n2) : n1 + n2}`, s2(m1 * m2, b), s2(r, 2 * b)], tags: ["add surds", "simplify"] });
  }
  const b2 = choice(SQUAREFREE.slice(0, 6).filter(x => x !== b));
  const a = randInt(2, 6); const c = randInt(2, 6); const d = randInt(1, 5);
  return q({ type: "add-subtract-surds", marks: 2, prompt: `Simplify ${s2(a, b)} + ${s2(c, b2)} + ${s2(d, b)}.`, answer: joinTerms([s2(a + d, b), s2(c, b2)]), working: [`Collect the like surds: ${a}√${b} + ${d}√${b} = ${s2(a + d, b)}`, `${s2(c, b2)} is unlike; it stays separate.`], space: SPACE_SIZES.SMALL, mcDistractors: [s2(a + c + d, b + b2), s2(a + c + d, b), joinTerms([s2(a + d, b), s2(c, b)])], tags: ["add surds", "unlike"] });
}

function multiplySurdsQuestion() {
  const v = choice(["plain", "coef", "square"]);
  if (v === "plain") {
    const [x, y] = sample([2, 3, 5, 6, 7, 10, 12, 15], 2);
    const p = surdParts(x * y);
    return q({ type: "multiply-surds", marks: 1, prompt: `Simplify √${x} × √${y}.`, answer: s2(p.out, p.in), working: [`√${x} × √${y} = √${x * y}`, p.out > 1 ? `= ${s2(p.out, p.in)}` : "already simplest"], space: SPACE_SIZES.SMALL, mcDistractors: [`√${x + y}`, `${x * y}`, s2(p.in, p.out > 1 ? p.out : 2)], tags: ["multiply"] });
  }
  if (v === "coef") {
    const a = randInt(2, 6); const c = randInt(2, 6); const [x, y] = sample([2, 3, 5, 6, 10], 2);
    const p = surdParts(x * y);
    return q({ type: "multiply-surds", marks: 2, prompt: `Simplify ${s2(a, x)} × ${s2(c, y)}.`, answer: s2(a * c * p.out, p.in), working: [`${a} × ${c} = ${a * c}; √${x} × √${y} = √${x * y} = ${s2(p.out, p.in)}`, `= ${s2(a * c * p.out, p.in)}`], space: SPACE_SIZES.SMALL, mcDistractors: [s2(a * c, x * y), s2(a + c, x * y), s2(a * c * p.out, p.in + 1)], tags: ["multiply"] });
  }
  const a = randInt(2, 5); const b = choice([2, 3, 5, 7]);
  return q({ type: "multiply-surds", marks: 1, prompt: `Evaluate (${s2(a, b)})².`, answer: String(a * a * b), working: [`(${a}√${b})² = ${a}² × (√${b})² = ${a * a} × ${b} = ${a * a * b}`], space: SPACE_SIZES.SMALL, mcDistractors: [String(a * b), String(2 * a * b), s2(a * a, b)], tags: ["multiply", "square"] });
}

function divideSurdsQuestion() {
  const v = choice(["exact", "coef"]);
  if (v === "exact") {
    const y = choice([2, 3, 5, 6, 7]); const k = choice([4, 9, 16, 25, 2, 3, 5]);
    const x = y * k;
    return q({ type: "divide-surds", marks: 1, prompt: `Simplify √${x} ÷ √${y}.`, answer: simplest(k), working: [`√${x} ÷ √${y} = √(${x} ÷ ${y}) = √${k}${isqrt(k) ? ` = ${isqrt(k)}` : ""}`], space: SPACE_SIZES.SMALL, mcDistractors: [`√${x - y}`, String(k), s2(2, k)], tags: ["divide"] });
  }
  const c = randInt(2, 4); const k = randInt(2, 5); const b = choice([2, 3, 5]); const m = choice([2, 3, 5, 7].filter(x => x !== b));
  const x = b * m;
  return q({ type: "divide-surds", marks: 2, prompt: `Simplify ${afrac(s2(c * k, x), s2(c, b))}.`, answer: s2(k, m), working: [`${c * k} ÷ ${c} = ${k}`, `√${x} ÷ √${b} = √${m}`], space: SPACE_SIZES.SMALL, mcDistractors: [s2(k, x - b), s2(c * k * c, m), s2(k, x)], tags: ["divide"] });
}

/* ── expanding ───────────────────────────────────────────── */

function expandSurdsQuestion() {
  const b = choice([2, 3, 5, 7]);
  const v = choice(["number", "surd"]);
  if (v === "number") {
    const a = randInt(2, 6); const c = randInt(1, 9);
    return q({ type: "expand-surds", marks: 1, prompt: `Expand √${b}(√${b} + ${c}).`, answer: joinTerms([String(b), s2(c, b)]), working: [`√${b} × √${b} = ${b}`, `√${b} × ${c} = ${s2(c, b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [joinTerms([String(b * b), s2(c, b)]), s2(b + c, b), joinTerms([String(b), String(c)])], tags: ["expand"] });
  }
  const a = randInt(2, 4); const c = choice([2, 3, 5, 6].filter(x => x !== b)); const d = randInt(1, 5);
  const p = surdParts(b * c);
  return q({ type: "expand-surds", marks: 2, prompt: `Expand and simplify ${s2(a, b)}(√${c} ${MINUS} ${d}√${b}).`, answer: joinTerms([s2(a * p.out, p.in), num(-a * d * b)]), working: [`${s2(a, b)} × √${c} = ${s2(a, b * c)} = ${s2(a * p.out, p.in)}`, `${s2(a, b)} × ${MINUS}${d}√${b} = ${MINUS}${a * d} × ${b} = ${num(-a * d * b)}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [joinTerms([s2(a * p.out, p.in), num(-a * d)]), joinTerms([s2(a, b * c), s2(-a * d, b)])], tags: ["expand"] });
}

function binomialSurdsQuestion() {
  const b = choice([2, 3, 5, 6, 7]);
  const v = choice(["general", "conjugate", "square"]);
  const p = randInt(1, 5); const r = randInt(1, 5);
  if (v === "conjugate") {
    return q({ type: "binomial-surds", marks: 2, prompt: `Expand and simplify (${p} + √${b})(${p} ${MINUS} √${b}).`, answer: num(p * p - b), working: ["Difference of two squares: (a + b)(a − b) = a² − b²", `${p}² − (√${b})² = ${p * p} − ${b} = ${num(p * p - b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [num(p * p + b), joinTerms([String(p * p - b), s2(2 * p, b)]), num(p - b)], tags: ["binomial", "conjugate"] });
  }
  if (v === "square") {
    return q({ type: "binomial-surds", marks: 2, prompt: `Expand and simplify (√${b} + ${p})².`, answer: joinTerms([String(b + p * p), s2(2 * p, b)]), working: ["(a + b)² = a² + 2ab + b²", `${b} + 2 × ${p} × √${b} + ${p * p} = ${joinTerms([String(b + p * p), s2(2 * p, b)])}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [String(b + p * p), joinTerms([String(b + p * p), s2(p, b)]), joinTerms([String(b * b + p * p), s2(2 * p, b)])], tags: ["binomial", "perfect square"] });
  }
  // (√b + p)(√b − r) = b − r√b + p√b − pr
  const k = p - r;
  return q({ type: "binomial-surds", marks: 2, prompt: `Expand and simplify (√${b} + ${p})(√${b} ${MINUS} ${r}).`, answer: joinTerms([String(b - p * r), k === 0 ? "0" : s2(k, b)]), working: [`√${b} × √${b} = ${b}; √${b} × (${MINUS}${r}) = ${MINUS}${r}√${b}`, `${p} × √${b} = ${p}√${b}; ${p} × (${MINUS}${r}) = ${MINUS}${p * r}`, `Collect: ${joinTerms([String(b - p * r), k === 0 ? "0" : s2(k, b)])}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [joinTerms([String(b + p * r), s2(k || 1, b)]), num(b - p * r), joinTerms([String(b - p * r), s2(p + r, b)])], tags: ["binomial"] });
}

/* ── rationalising ───────────────────────────────────────── */

function rationaliseMonomialQuestion() {
  const b = choice([2, 3, 5, 6, 7]);
  const v = choice(["simple", "multiple", "coef"]);
  if (v === "simple") {
    const a = randInt(1, 9);
    const g = gcd(a, b);
    return q({ type: "rationalise-monomial", marks: 1, prompt: `Rationalise the denominator of ${afrac(String(a), `√${b}`)}.`, answer: b / g === 1 ? s2(a / g, b) : afrac(s2(a / g, b), String(b / g)), working: [`Multiply by √${b}/√${b}: ${a}√${b}/${b}`, g > 1 ? "Simplify the fraction." : ""].filter(Boolean), space: SPACE_SIZES.SMALL, mcDistractors: [afrac(`√${b}`, String(a)), afrac(s2(a, b), String(b * b)), s2(a, b)], tags: ["rationalise"] });
  }
  if (v === "multiple") {
    const k = randInt(2, 5);
    return q({ type: "rationalise-monomial", marks: 1, prompt: `Rationalise the denominator of ${afrac(String(k * b), `√${b}`)}.`, answer: s2(k, b), working: [`${k * b}√${b}/${b} = ${s2(k, b)}`], space: SPACE_SIZES.SMALL, mcDistractors: [s2(k * b, b), afrac(`√${b}`, String(k * b)), String(k)], tags: ["rationalise"] });
  }
  const a = randInt(1, 7); const c = randInt(2, 5);
  const g = gcd(a, c * b);
  const top = s2(a / g, b); const bottom = (c * b) / g;
  return q({ type: "rationalise-monomial", marks: 2, prompt: `Rationalise the denominator of ${afrac(String(a), s2(c, b))}.`, answer: bottom === 1 ? top : afrac(top, String(bottom)), working: [`Multiply by √${b}/√${b}: ${a}√${b}/(${c} × ${b}) = ${a}√${b}/${c * b}`, g > 1 ? "Simplify." : ""].filter(Boolean), space: SPACE_SIZES.SMALL, mcDistractors: [afrac(s2(a, b), String(c)), afrac(s2(a, b), String(c * b * b))], tags: ["rationalise"] });
}

function rationaliseBinomialQuestion() {
  const b = choice([2, 3, 5, 6, 7]); const p = randInt(1, 4);
  const d = p * p - b;
  if (d === 0) return rationaliseBinomialQuestion();
  const sgn = Math.random() < 0.5 ? 1 : -1;            // denominator p + sgn·√b
  const k = choice([1, 2, Math.abs(d)]);
  // k/(p + sgn√b) × (p − sgn√b)/(p − sgn√b) = (kp − sgn·k√b)/d
  let A = k * p; let B = -sgn * k; let D = d;
  if (D < 0) { A = -A; B = -B; D = -D; }
  const g = gcd(gcd(Math.abs(A), Math.abs(B)), D);
  A /= g; B /= g; D /= g;
  const top = joinTerms([num(A), s2(B, b)]);
  const answer = D === 1 ? top : afrac(top, String(D));
  return q({
    type: "rationalise-binomial", marks: 3,
    prompt: `Rationalise the denominator of ${afrac(String(k), `${p} ${sgn > 0 ? "+" : MINUS} √${b}`)}.`,
    answer,
    working: [`Multiply top and bottom by the conjugate ${p} ${sgn > 0 ? MINUS : "+"} √${b}.`, `Denominator: ${p}² − (√${b})² = ${p * p} − ${b} = ${num(d)}`, `Numerator: ${joinTerms([String(k * p), s2(-sgn * k, b)])}`, `Simplify: ${answer.replace(/\[\[algfrac:([^:]+):([^\]]+)\]\]/, "($1)/$2")}`],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["rationalise", "conjugate"]
  });
}

function orderSurdsQuestion() {
  const items = [];
  const used = new Set();
  while (items.length < 4) {
    const a = randInt(1, 5); const b = choice([2, 3, 5, 6, 7]);
    const n = a * a * b;
    if (used.has(n) || n > 120) continue;
    used.add(n);
    items.push({ t: s2(a, b), n });
  }
  // show one of them as an entire surd
  const e = randInt(0, 3);
  items[e].t = `√${items[e].n}`;
  if (new Set(items.map(i => i.n)).size < 4) return orderSurdsQuestion();
  const sorted = [...items].sort((x, y) => x.n - y.n);
  if (sorted.every((s, i) => s === items[i])) return orderSurdsQuestion();
  return q({
    type: "order-surds", marks: 2,
    prompt: `Write these in ascending order: ${items.map(i => i.t).join(", ")}`,
    answer: sorted.map(i => i.t).join(", "),
    working: ["Write each as an entire surd and compare:", ...items.map(i => `${i.t} = √${i.n}`)],
    space: SPACE_SIZES.MEDIUM,
    mcEligible: false,
    tags: ["order"]
  });
}

/* ── fractional indices ──────────────────────────────────── */

const ROOTS = [
  { base: 4, n: 2, r: 2 }, { base: 9, n: 2, r: 3 }, { base: 16, n: 2, r: 4 }, { base: 25, n: 2, r: 5 }, { base: 36, n: 2, r: 6 }, { base: 49, n: 2, r: 7 }, { base: 64, n: 2, r: 8 }, { base: 81, n: 2, r: 9 }, { base: 100, n: 2, r: 10 },
  { base: 8, n: 3, r: 2 }, { base: 27, n: 3, r: 3 }, { base: 64, n: 3, r: 4 }, { base: 125, n: 3, r: 5 }, { base: 1000, n: 3, r: 10 },
  { base: 16, n: 4, r: 2 }, { base: 81, n: 4, r: 3 }, { base: 32, n: 5, r: 2 }
];

function fractionalIndexEvaluateQuestion() {
  const R = choice(ROOTS);
  const v = choice(["unit", "power", "negative"]);
  if (v === "unit") {
    return q({ type: "fractional-index-evaluate", marks: 1, prompt: `Evaluate ${R.base}${sup(`1/${R.n}`)}.`, answer: String(R.r), working: [`${R.base}${sup(`1/${R.n}`)} = ${R.n === 2 ? "√" : R.n === 3 ? "∛" : `${R.n}th root of `}${R.base} = ${R.r}`], space: SPACE_SIZES.SMALL, mcDistractors: [String(R.base / R.n), String(R.base * R.n), rat(1, R.r)], tags: ["fractional index"] });
  }
  // the index must already be in simplest form: 2/2 or 2/4 is not a fractional index anyone writes
  const ms = [2, 3].filter(k => k !== R.n && (R.n % k !== 0 || k === 1) && !(R.n % 2 === 0 && k % 2 === 0));
  const m = choice(ms.length ? ms : [3]);
  if (R.r ** m > 1000) return fractionalIndexEvaluateQuestion();
  if (v === "power") {
    return q({ type: "fractional-index-evaluate", marks: 1, prompt: `Evaluate ${R.base}${sup(`${m}/${R.n}`)}.`, answer: String(R.r ** m), working: [`Root first: ${R.n === 2 ? "√" : R.n === 3 ? "∛" : `${R.n}th root of `}${R.base} = ${R.r}`, `Then the power: ${R.r}${sup(m)} = ${R.r ** m}`], space: SPACE_SIZES.SMALL, mcDistractors: [String(R.r * m), String(Math.round(R.base * m / R.n)), rat(1, R.r ** m)], tags: ["fractional index"] });
  }
  return q({ type: "fractional-index-evaluate", marks: 2, prompt: `Evaluate ${R.base}${sup(`−${m}/${R.n}`)}.`, answer: rat(1, R.r ** m), working: ["The negative index gives a reciprocal.", `${R.base}${sup(`${m}/${R.n}`)} = ${R.r}${sup(m)} = ${R.r ** m}`, `So the answer is 1/${R.r ** m}.`], space: SPACE_SIZES.SMALL, mcDistractors: [num(-(R.r ** m)), String(R.r ** m), rat(1, R.r * m)], tags: ["fractional index", "negative index"] });
}

function surdIndexFormQuestion() {
  const x = choice(["x", "a", "y"]);
  const forms = [
    { surd: `√${x}`, index: `${x}${sup("1/2")}` },
    { surd: `∛${x}`, index: `${x}${sup("1/3")}` },
    { surd: `√${x}³`, index: `${x}${sup("3/2")}` },
    { surd: `∛${x}²`, index: `${x}${sup("2/3")}` },
    { surd: `(∜${x})³`, index: `${x}${sup("3/4")}` },
    { surd: afrac("1", `√${x}`), index: `${x}${sup("−1/2")}` },
    { surd: `√${x}⁵`, index: `${x}${sup("5/2")}` }
  ];
  const f = choice(forms);
  const toIndex = Math.random() < 0.55;
  return q({
    type: "surd-index-form", marks: 1,
    prompt: toIndex ? `Write ${f.surd} in index form.` : `Write ${f.index} in surd (root) form.`,
    answer: toIndex ? f.index : f.surd,
    working: ["The denominator of the index is the root; the numerator is the power.", `${f.surd} = ${f.index}`],
    space: SPACE_SIZES.SMALL,
    mcDistractors: toIndex ? forms.filter(o => o !== f).map(o => o.index).slice(0, 3) : forms.filter(o => o !== f).map(o => o.surd).slice(0, 3),
    tags: ["fractional index", "surd form"]
  });
}

function fractionalIndexLawsQuestion() {
  const x = choice(["x", "a", "m"]);
  const v = choice(["product", "quotient", "power", "coef"]);
  if (v === "product") {
    const d = choice([2, 3, 4]); const a = randInt(1, 5); const b = randInt(1, 5);
    const n = a + b;
    const g = gcd(n, d);
    return q({ type: "fractional-index-laws", marks: 1, prompt: `Simplify ${x}${sup(`${a}/${d}`)} × ${x}${sup(`${b}/${d}`)}.`, answer: d / g === 1 ? mono(1, { [x]: n / g }) : `${x}${sup(`${n / g}/${d / g}`)}`, working: [`${a}/${d} + ${b}/${d} = ${n}/${d}${g > 1 ? ` = ${d / g === 1 ? n / g : `${n / g}/${d / g}`}` : ""}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${x}${sup(`${a * b}/${d * d}`)}`, `${x}${sup(`${n}/${2 * d}`)}`], tags: ["fractional index", "index laws"] });
  }
  if (v === "quotient") {
    const d = choice([2, 3]); const b = randInt(1, 4); const a = b + d * randInt(1, 2);
    const e = (a - b) / d;
    return q({ type: "fractional-index-laws", marks: 1, prompt: `Simplify ${x}${sup(`${a}/${d}`)} ÷ ${x}${sup(`${b}/${d}`)}.`, answer: mono(1, { [x]: e }), working: [`${a}/${d} − ${b}/${d} = ${a - b}/${d} = ${e}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${x}${sup(`${a + b}/${d}`)}`, mono(1, { [x]: e + 1 })], tags: ["fractional index", "index laws"] });
  }
  if (v === "power") {
    const d = choice([2, 3, 4]); const a = randInt(1, 3); const p = d * randInt(1, 3);
    const e = (a * p) / d;
    return q({ type: "fractional-index-laws", marks: 1, prompt: `Simplify (${x}${sup(`${a}/${d}`)})${sup(p)}.`, answer: mono(1, { [x]: e }), working: [`${a}/${d} × ${p} = ${e}`], space: SPACE_SIZES.SMALL, mcDistractors: [`${x}${sup(`${a + p}/${d}`)}`, mono(1, { [x]: a * p })], tags: ["fractional index", "index laws"] });
  }
  const R = choice([{ c: 8, n: 3, r: 2 }, { c: 27, n: 3, r: 3 }, { c: 16, n: 2, r: 4 }, { c: 25, n: 2, r: 5 }, { c: 9, n: 2, r: 3 }]);
  const k = randInt(1, 2);
  return q({ type: "fractional-index-laws", marks: 2, prompt: `Simplify (${R.c}${x}${sup(R.n * k)})${sup(`1/${R.n}`)}.`, answer: mono(R.r, { [x]: k }), working: [`${R.c}${sup(`1/${R.n}`)} = ${R.r}`, `(${x}${sup(R.n * k)})${sup(`1/${R.n}`)} = ${x}${sup(k)}`], space: SPACE_SIZES.SMALL, mcDistractors: [mono(Math.round(R.c / R.n), { [x]: k }), mono(R.r, { [x]: R.n * k })], tags: ["fractional index", "index laws"] });
}

function surdMeasurementQuestion() {
  const v = choice(["hypotenuse", "rectangle", "square-diagonal", "area"]);
  if (v === "hypotenuse") {
    let a; let b; let h2;
    do { a = randInt(1, 8); b = randInt(1, 8); h2 = a * a + b * b; } while (isqrt(h2));
    return q({
      type: "surd-measurement", marks: 2,
      prompt: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the exact length of the hypotenuse, in simplest surd form.`,
      diagram: { engine: "pythagoras-engine", config: { diagramType: "right-triangle", a: Math.min(a, b), b: Math.max(a, b), c: Math.sqrt(h2), labels: { a: `${Math.min(a, b)} cm`, b: `${Math.max(a, b)} cm`, c: "c" }, units: "cm" } },
      answer: `${simplest(h2)} cm`,
      working: [`c² = ${a}² + ${b}² = ${h2}`, `c = √${h2}${surdParts(h2).out > 1 ? ` = ${simplest(h2)}` : ""} cm`],
      space: SPACE_SIZES.MEDIUM,
      mcDistractors: [`${a + b} cm`, `√${a + b} cm`, `${h2} cm`],
      tags: ["measurement", "Pythagoras"]
    });
  }
  if (v === "rectangle") {
    const b = choice([2, 3, 5]); const a = randInt(2, 6); const c = randInt(1, 5);
    return q({ type: "surd-measurement", marks: 2, prompt: `A rectangle is ${s2(a, b)} m long and ${s2(c, b)} m wide. Find its exact perimeter and area.`, answer: `Perimeter ${s2(2 * (a + c), b)} m; area ${a * c * b} m²`, working: [`P = 2(${s2(a, b)} + ${s2(c, b)}) = ${s2(2 * (a + c), b)}`, `A = ${s2(a, b)} × ${s2(c, b)} = ${a * c} × ${b} = ${a * c * b}`], space: SPACE_SIZES.MEDIUM, mcEligible: false, tags: ["measurement"] });
  }
  if (v === "square-diagonal") {
    const s = randInt(2, 9);
    return q({ type: "surd-measurement", marks: 2, prompt: `Find the exact length of the diagonal of a square with side ${s} cm.`, answer: `${s2(s, 2)} cm`, working: [`d² = ${s}² + ${s}² = ${2 * s * s}`, `d = √${2 * s * s} = ${s2(s, 2)} cm`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${2 * s} cm`, `${s2(2, s)} cm`, `${s * s} cm`], tags: ["measurement"] });
  }
  const b = choice([2, 3, 5, 7]); const base = randInt(2, 6);
  return q({ type: "surd-measurement", marks: 2, prompt: `A triangle has base ${s2(base, b)} cm and perpendicular height √${b} cm. Find its exact area.`, answer: `${rat(base * b, 2)} cm²`.replace("[[frac", "[[frac"), working: [`A = ½ × ${s2(base, b)} × √${b} = ½ × ${base} × ${b} = ${rat(base * b, 2).replace(/\[\[frac:(\d+):(\d+)\]\]/, "$1/$2")}`], space: SPACE_SIZES.MEDIUM, mcDistractors: [`${base * b} cm²`, `${s2(base, b)} cm²`], tags: ["measurement"] });
}

function multiPartSurdsQuestion() {
  const b = choice([2, 3, 5]); const m = randInt(2, 5);
  return q({
    type: "multi-part-surds", marks: 4,
    prompt: "Simplify each expression.",
    subparts: [
      { label: "(a)", prompt: `√${m * m * b}`, marks: 1, answer: s2(m, b), working: [`√${m * m} × √${b}`] },
      { label: "(b)", prompt: `√${m * m * b} + √${b}`, marks: 1, answer: s2(m + 1, b), working: [`${s2(m, b)} + √${b}`] },
      { label: "(c)", prompt: `√${b} × √${m * m * b}`, marks: 1, answer: String(m * b), working: [`√${m * m * b * b} = ${m * b}`] },
      { label: "(d)", prompt: `${afrac(String(b), `√${b}`)}`, marks: 1, answer: `√${b}`, working: [`${b}√${b}/${b}`] }
    ],
    answer: `(a) ${s2(m, b)}; (b) ${s2(m + 1, b)}; (c) ${m * b}; (d) √${b}`,
    working: [],
    space: SPACE_SIZES.SMALL,
    tags: ["multi-part"]
  });
}

const GENERATORS = {
  "rational-or-irrational": rationalOrIrrationalQuestion,
  "simplify-surd": simplifySurdQuestion,
  "entire-surd": entireSurdQuestion,
  "add-subtract-surds": addSubtractSurdsQuestion,
  "multiply-surds": multiplySurdsQuestion,
  "divide-surds": divideSurdsQuestion,
  "expand-surds": expandSurdsQuestion,
  "binomial-surds": binomialSurdsQuestion,
  "rationalise-monomial": rationaliseMonomialQuestion,
  "rationalise-binomial": rationaliseBinomialQuestion,
  "order-surds": orderSurdsQuestion,
  "fractional-index-evaluate": fractionalIndexEvaluateQuestion,
  "surd-index-form": surdIndexFormQuestion,
  "fractional-index-laws": fractionalIndexLawsQuestion,
  "surd-measurement": surdMeasurementQuestion,
  "multi-part-surds": multiPartSurdsQuestion
};

export function getIndicesCQuestionTypes() { return TYPE_LIST; }
export function generateIndicesCQuestions({ count = 6, allowedTypes = null } = {}) {
  return generateFromRegistry({ typeList: TYPE_LIST, generators: GENERATORS, count, allowedTypes });
}
