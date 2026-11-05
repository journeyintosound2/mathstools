/* Indices — MA4-IND-C-01 — whole-topic quiz bank.
   Content statements: apply index notation to represent whole numbers as
   products of powers of prime numbers · examine cube roots and square roots ·
   use index notation to establish the index laws with positive-integer
   indices and the zero index.
   The letter x is never a pronumeral here: in a typed answer an x between
   factors is read as a times sign (2 x 3^2). */
const C = window.MMTQCore;
const { ri, pick, shuffle, fmt, sup } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const L = ["a", "b", "m", "n", "p", "k", "y", "w", "t"];
const M = s => `<span class="m">${s}</span>`;
const pw = (b, e) => e === 1 ? `${b}` : `${b}${sup(e)}`;
const term = (coef, f) => (coef === 1 ? "" : String(coef)) + Object.entries(f).map(([b, e]) => pw(b, e)).join("");
const KEYS = ["^", "×"];
const PRIMES = [2, 3, 5, 7, 11, 13];
function factorise(n) { const f = {}; let d = 2; while (n > 1) { while (n % d === 0) { f[d] = (f[d] || 0) + 1; n /= d; } d++; } return f; }
const fstr = f => Object.entries(f).map(([b, e]) => pw(b, e)).join(" × ");
const val = f => Object.entries(f).reduce((v, [b, e]) => v * Math.pow(+b, e), 1);

/* ================================ BASIC ================================ */
add("basic", "b-notation", "Write in index notation", () => {
  if (Math.random() < 0.6) {
    const b = ri(2, 9), e = ri(3, 6);
    return { prompt: `Write in index notation:${`<span class="big">${Array(e).fill(b).join(" × ")}</span>`}`, mode: "mono", kind: "power", factors: { [b]: e }, answerHTML: M(pw(b, e)), keys: KEYS, why: `${b} is multiplied by itself ${e} times, so the base is ${b} and the index is ${e}.` };
  }
  const l = pick(L), e = ri(3, 7);
  return { prompt: `Write in index notation:<span class="big">${Array(e).fill(l).join(" × ")}</span>`, mode: "mono", kind: "alg", factors: { [l]: e }, answerHTML: M(pw(l, e)), keys: KEYS, why: `${e} factors of ${l}: ${pw(l, e)}.` };
});
add("basic", "b-evaluate", "Evaluate a power", () => {
  let b, e; do { b = ri(2, 10); e = ri(2, 5); } while (Math.pow(b, e) > 10000 || (b === 10 && e > 4));
  return { prompt: `Evaluate ${M(pw(b, e))}.`, mode: "num", value: Math.pow(b, e), why: `${Array(e).fill(b).join(" × ")} = ${fmt(Math.pow(b, e))}` };
}, q => { const m = /(\d+)<sup>(\d+)/.exec(q.prompt); return Math.pow(+m[1], +m[2]) === q.value ? null : "power value"; });
add("basic", "b-roots", "Squares, square roots and cube roots", () => {
  const k = pick(["sq", "sq", "cube", "cube", "sqr"]);
  if (k === "sq") { const r = ri(2, 15); return { prompt: `Evaluate ${M(`√${r * r}`)}.`, mode: "num", value: r, why: `${r} × ${r} = ${r * r}, so √${r * r} = ${r}.` }; }
  if (k === "cube") { const r = ri(2, 10); return { prompt: `Evaluate ${M(`∛${fmt(r * r * r)}`)}.`, mode: "num", value: r, why: `${r} × ${r} × ${r} = ${r * r * r}, so ∛${r * r * r} = ${r}.` }; }
  const r = ri(11, 20); return { prompt: `Evaluate ${M(pw(r, 2))}.`, mode: "num", value: r * r, why: `${r} × ${r} = ${r * r}` };
}, q => { const m = /√(\d+)|∛([\d ]+)|(\d+)<sup>2/.exec(q.prompt); if (!m) return "parse"; if (m[1]) return Math.sqrt(+m[1]) === q.value ? null : "sqrt"; if (m[2]) return Math.round(Math.cbrt(+m[2].replace(/ /g, ""))) === q.value ? null : "cbrt"; return (+m[3]) ** 2 === q.value ? null : "sq"; });
add("basic", "b-prime-factors", "Prime factors", () => {
  let n, f; do { n = ri(12, 150); f = factorise(n); } while (Object.keys(f).length < 2 || Object.values(f).reduce((a, b) => a + b) < 3 || Object.keys(f).some(p => p > 13));
  return { prompt: `Write ${n} as a product of its prime factors.<span class="sub">Example: 12 = 2 × 2 × 3 (you can use index notation too).</span>`, mode: "mono", kind: "prime", factors: f, indexForm: false, keys: KEYS, answerHTML: M(fstr(f)), why: `Keep dividing by primes: ${n} = ${Object.entries(f).flatMap(([b, e]) => Array(e).fill(b)).join(" × ")}.` };
}, q => val(q.factors) === +/^Write (\d+)/.exec(q.prompt)[1] && Object.keys(q.factors).every(p => C.isPrime(+p)) ? null : "factors wrong");
add("basic", "b-multiply", "Index law: multiplying powers", () => {
  const b = ri(2, 9), m = ri(2, 8), n = ri(2, 8);
  return { prompt: `Simplify, leaving your answer in index form:<span class="big">${pw(b, m)} × ${pw(b, n)}</span>`, mode: "mono", kind: "power", factors: { [b]: m + n }, keys: KEYS, answerHTML: M(pw(b, m + n)), why: `Same base, multiplying: add the indices. ${m} + ${n} = ${m + n}.` };
});
add("basic", "b-divide", "Index law: dividing powers", () => {
  const b = ri(2, 9), n = ri(2, 6), m = n + ri(1, 7);
  return { prompt: `Simplify, leaving your answer in index form:<span class="big">${pw(b, m)} ÷ ${pw(b, n)}</span>`, mode: "mono", kind: "power", factors: { [b]: m - n }, keys: KEYS, answerHTML: M(pw(b, m - n)), why: `Same base, dividing: subtract the indices. ${m} − ${n} = ${m - n}.` };
});
add("basic", "b-zero", "The zero index", () => {
  const k = pick([0, 1, 2]);
  if (k === 0) { const b = pick([ri(2, 99), pick(L)]); return { prompt: `Evaluate ${M(pw(b, 0))}${typeof b === "string" ? ` (where ${M(b + " ≠ 0")})` : ""}.`, mode: "num", value: 1, why: `Any non-zero number to the power of 0 is 1.` }; }
  if (k === 1) { const b = ri(2, 20), c = ri(2, 12); return { prompt: `Evaluate ${M(`${pw(b, 0)} + ${c}`)}.`, mode: "num", value: 1 + c, why: `${pw(b, 0)} = 1, so 1 + ${c} = ${1 + c}.` }; }
  const b = ri(2, 9), c = ri(2, 12); return { prompt: `Evaluate ${M(`${c} × ${pw(b, 0)}`)}.`, mode: "num", value: c, why: `${pw(b, 0)} = 1, so ${c} × 1 = ${c}.` };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-prime-index", "Prime factorisation in index form", () => {
  let f, n;
  do {
    f = {}; const ps = shuffle(PRIMES.slice(0, 4)).slice(0, ri(2, 3));
    ps.forEach(p => f[p] = ri(1, p === 2 ? 5 : p === 3 ? 3 : 2));
    n = val(f);
  } while (n < 60 || n > 3000 || Object.values(f).every(e => e === 1));
  const sorted = Object.fromEntries(Object.entries(f).sort((a, b) => a[0] - b[0]));
  return { prompt: `Write ${fmt(n)} as a product of prime factors <b>in index notation</b>.`, mode: "mono", kind: "prime", factors: sorted, indexForm: true, keys: KEYS, answerHTML: M(`${fmt(n)} = ${fstr(sorted)}`), why: `A factor tree for ${fmt(n)} ends in the primes ${Object.entries(sorted).flatMap(([b, e]) => Array(e).fill(b)).join(", ")}. Group the repeats with indices.` };
}, q => val(q.factors) === +q.prompt.match(/Write ([\d ]+)/)[1].replace(/ /g, "") ? null : "value");
add("expected", "e-hcf-lcm", "HCF and LCM from prime factors", () => {
  let fa, fb, a, b;
  do {
    fa = {}; fb = {};
    [2, 3, 5, 7].forEach(p => { if (Math.random() < 0.7) fa[p] = ri(1, p === 2 ? 4 : 2); if (Math.random() < 0.7) fb[p] = ri(1, p === 2 ? 4 : 2); });
    a = val(fa); b = val(fb);
  } while (a === b || a < 12 || b < 12 || a > 600 || b > 600 || C.gcd(a, b) === 1 || C.gcd(a, b) === Math.min(a, b));
  const hcf = C.gcd(a, b), lcm = C.lcm(a, b);
  const askH = Math.random() < 0.5;
  return { prompt: `<span class="big" style="font-size:1.15em">${a} = ${fstr(fa)}<br>${b} = ${fstr(fb)}</span>Use the prime factors to find the <b>${askH ? "highest common factor (HCF)" : "lowest common multiple (LCM)"}</b> of ${a} and ${b}.`,
    mode: "num", value: askH ? hcf : lcm, why: askH ? `Take each prime they share, with the smaller index: HCF = ${hcf}.` : `Take every prime that appears, with the larger index: LCM = ${fmt(lcm)}.` };
}, q => { const [a, b] = [...q.prompt.matchAll(/(\d+) =/g)].map(m => +m[1]); return (q.why.startsWith("Take each") ? C.gcd(a, b) : C.lcm(a, b)) === q.value ? null : "hcf/lcm"; });
add("expected", "e-estimate-root", "Estimate a square or cube root", () => {
  const cube = Math.random() < 0.35;
  let n, lo;
  if (cube) { lo = ri(2, 9); n = ri(lo ** 3 + 1, (lo + 1) ** 3 - 1); }
  else { lo = ri(3, 14); n = ri(lo * lo + 1, (lo + 1) * (lo + 1) - 1); }
  const opts = shuffle([lo - 1, lo, lo + 1, lo + 2].filter(v => v >= 1).slice(0, 4));
  const options = opts.map(v => `between ${v} and ${v + 1}`);
  return { prompt: `${M(`${cube ? "∛" : "√"}${n}`)} lies between which two consecutive whole numbers?`, mode: "mc", options, correct: opts.indexOf(lo),
    why: cube ? `${lo}³ = ${lo ** 3} and ${lo + 1}³ = ${(lo + 1) ** 3}, and ${n} is between them.` : `${lo}² = ${lo * lo} and ${lo + 1}² = ${(lo + 1) ** 2}, and ${n} is between them.` };
});
add("expected", "e-order-ops", "Order of operations with indices and roots", () => {
  const k = pick([0, 1, 2, 3, 4]);
  if (k === 0) { const a = ri(2, 5), b = ri(2, 9), c = ri(2, 6); return { prompt: `Evaluate ${M(`${pw(a, 3)} + ${b} × ${pw(c, 2)}`)}.`, mode: "num", value: a ** 3 + b * c * c, why: `Indices first: ${a ** 3} + ${b} × ${c * c} = ${a ** 3} + ${b * c * c} = ${a ** 3 + b * c * c}.` }; }
  if (k === 1) { const r = ri(4, 12), a = ri(2, 4), b = ri(2, 3); return { prompt: `Evaluate ${M(`√${r * r} − ${pw(a, 2)} × ${b}`)}.`, mode: "num", value: r - a * a * b, why: `√${r * r} = ${r} and ${a}² = ${a * a}. Then ${r} − ${a * a} × ${b} = ${r} − ${a * a * b} = ${fmt(r - a * a * b)}.` }; }
  if (k === 2) { const a = ri(2, 6), b = ri(1, 5), r = ri(2, 5); return { prompt: `Evaluate ${M(`(${a} + ${b})${sup(2)} − ∛${r ** 3}`)}.`, mode: "num", value: (a + b) ** 2 - r, why: `Brackets first: ${a + b}² = ${(a + b) ** 2}. ∛${r ** 3} = ${r}. So ${(a + b) ** 2} − ${r} = ${(a + b) ** 2 - r}.` }; }
  if (k === 3) { const a = ri(2, 5), r = ri(2, 10); return { prompt: `Evaluate ${M(`${pw(a, 2)} × √${r * r} + ${pw(2, 3)}`)}.`, mode: "num", value: a * a * r + 8, why: `${a * a} × ${r} + 8 = ${a * a * r} + 8 = ${a * a * r + 8}.` }; }
  const b = ri(2, 5), n = ri(2, 4), d = ri(2, 4); return { prompt: `Evaluate ${M(`${pw(b, n + d)} ÷ ${pw(b, d)} + ${pw(b, 0)}`)}.`, mode: "num", value: b ** n + 1, why: `${pw(b, n + d)} ÷ ${pw(b, d)} = ${pw(b, n)} = ${b ** n}, and ${pw(b, 0)} = 1. So ${b ** n} + 1 = ${b ** n + 1}.` };
});
add("expected", "e-power-power", "Index law: power of a power", () => {
  const m = ri(2, 6), n = ri(2, 5);
  if (Math.random() < 0.5) { const l = pick(L); return { prompt: `Simplify:<span class="big">(${pw(l, m)})${sup(n)}</span>`, mode: "mono", kind: "alg", factors: { [l]: m * n }, keys: KEYS, answerHTML: M(pw(l, m * n)), why: `Power of a power: multiply the indices. ${m} × ${n} = ${m * n}.` }; }
  const b = ri(2, 9);
  return { prompt: `Simplify, leaving your answer in index form:<span class="big">(${pw(b, m)})${sup(n)}</span>`, mode: "mono", kind: "power", factors: { [b]: m * n }, keys: KEYS, answerHTML: M(pw(b, m * n)), why: `Power of a power: multiply the indices. ${m} × ${n} = ${m * n}.` };
});
add("expected", "e-alg-multiply", "Multiply algebraic terms with indices", () => {
  const [l1, l2] = shuffle(L).slice(0, 2).sort();
  const c1 = ri(2, 7), c2 = ri(2, 6);
  if (Math.random() < 0.55) { const a = ri(2, 7), b = ri(1, 6); return { prompt: `Simplify:<span class="big">${term(c1, { [l1]: a })} × ${term(c2, { [l1]: b })}</span>`, mode: "mono", kind: "alg", coef: c1 * c2, factors: { [l1]: a + b }, keys: KEYS, answerHTML: M(term(c1 * c2, { [l1]: a + b })), why: `Multiply the numbers (${c1} × ${c2} = ${c1 * c2}) and add the indices of ${l1} (${a} + ${b} = ${a + b}).` }; }
  const a = ri(1, 5), b = ri(1, 5), c = ri(1, 5), d = ri(1, 5);
  return { prompt: `Simplify:<span class="big">${term(c1, { [l1]: a, [l2]: b })} × ${term(c2, { [l1]: c, [l2]: d })}</span>`, mode: "mono", kind: "alg", coef: c1 * c2, factors: { [l1]: a + c, [l2]: b + d }, keys: KEYS, answerHTML: M(term(c1 * c2, { [l1]: a + c, [l2]: b + d })), why: `${c1} × ${c2} = ${c1 * c2}; ${l1}: ${a} + ${c} = ${a + c}; ${l2}: ${b} + ${d} = ${b + d}.` };
});
add("expected", "e-alg-divide", "Divide algebraic terms with indices", () => {
  const l = pick(L), q = ri(2, 6), c2 = ri(2, 6), b = ri(1, 5), a = b + ri(1, 6);
  return { prompt: `Simplify:<span class="big">${term(q * c2, { [l]: a })} ÷ ${term(c2, { [l]: b })}</span>`, mode: "mono", kind: "alg", coef: q, factors: { [l]: a - b }, keys: KEYS, answerHTML: M(term(q, { [l]: a - b })), why: `${q * c2} ÷ ${c2} = ${q}, and subtract the indices: ${a} − ${b} = ${a - b}.` };
});
add("expected", "e-mixed-laws", "Use several index laws", () => {
  const l = pick(L), k = pick([0, 1, 2]);
  if (k === 0) { const a = ri(2, 7), b = ri(2, 7), c = ri(1, a + b - 1); return { prompt: `Simplify:<span class="big">${pw(l, a)} × ${pw(l, b)} ÷ ${pw(l, c)}</span>`, mode: "mono", kind: "alg", factors: { [l]: a + b - c }, keys: KEYS, answerHTML: M(pw(l, a + b - c)), why: `${a} + ${b} − ${c} = ${a + b - c}` }; }
  if (k === 1) { const a = ri(2, 4), n = ri(2, 3), b = ri(1, 5); return { prompt: `Simplify:<span class="big">(${pw(l, a)})${sup(n)} × ${pw(l, b)}</span>`, mode: "mono", kind: "alg", factors: { [l]: a * n + b }, keys: KEYS, answerHTML: M(pw(l, a * n + b)), why: `(${pw(l, a)})${sup(n)} = ${pw(l, a * n)}, then ${a * n} + ${b} = ${a * n + b}.` }; }
  const a = ri(2, 5), n = ri(2, 3), c = ri(1, a * n - 1), co = ri(2, 4);
  return { prompt: `Simplify:<span class="big">${co}(${pw(l, a)})${sup(n)} ÷ ${pw(l, c)}</span>`, mode: "mono", kind: "alg", coef: co, factors: { [l]: a * n - c }, keys: KEYS, answerHTML: M(term(co, { [l]: a * n - c })), why: `(${pw(l, a)})${sup(n)} = ${pw(l, a * n)}; ${a * n} − ${c} = ${a * n - c}; the ${co} stays.` };
});
add("expected", "e-zero-alg", "The zero index with pronumerals", () => {
  const l = pick(L), k = pick([0, 1, 2]);
  if (k === 0) { const c = ri(2, 12); return { prompt: `Simplify ${M(`${c}${pw(l, 0)}`)}.`, mode: "num", value: c, why: `Only ${l} is raised to the power 0: ${c} × 1 = ${c}.` }; }
  if (k === 1) { const c = ri(2, 9), d = ri(2, 9); return { prompt: `Simplify ${M(`(${c}${l})${sup(0)} + ${d}`)}.`, mode: "num", value: 1 + d, why: `The whole bracket is raised to 0, so it equals 1. 1 + ${d} = ${1 + d}.` }; }
  const c = ri(2, 9), a = ri(2, 6); return { prompt: `Simplify ${M(`${c * 3}${pw(l, a)} ÷ 3${pw(l, a)}`)}.`, mode: "num", value: c, why: `${c * 3} ÷ 3 = ${c}, and ${pw(l, a)} ÷ ${pw(l, a)} = ${pw(l, 0)} = 1.` };
});
add("expected", "e-true-false", "Index laws: true or false?", () => {
  const l = pick(L), a = ri(2, 5), b = ri(2, 5);
  const items = [
    [`${pw(l, a)} × ${pw(l, b)} = ${pw(l, a * b)}`, a * b === a + b, `Multiplying powers of the same base: ADD the indices, so ${pw(l, a + b)}.`],
    [`${pw(l, a)} × ${pw(l, b)} = ${pw(l, a + b)}`, true, `Add the indices when multiplying: ${a} + ${b} = ${a + b}.`],
    [`(${pw(l, a)})${sup(b)} = ${pw(l, a + b)}`, a + b === a * b, `Power of a power: MULTIPLY the indices, so ${pw(l, a * b)}.`],
    [`${pw(l, a + b)} ÷ ${pw(l, b)} = ${pw(l, a)}`, true, `Subtract the indices: ${a + b} − ${b} = ${a}.`],
    [`${pw(7, 0)} = 0`, false, `Any non-zero number to the power 0 is 1, not 0.`],
    [`${pw(2, 3)} × ${pw(3, 2)} = ${pw(6, 5)}`, false, `The bases are different, so the index laws do not apply: 8 × 9 = 72, not 6⁵.`],
    [`${pw(2, 3)} = 6`, false, `2³ = 2 × 2 × 2 = 8. The index is not a multiplier.`],
    [`√${a * a} + √${b * b} = √${a * a + b * b}`, false, `√${a * a} + √${b * b} = ${a} + ${b} = ${a + b}, but √${a * a + b * b} is not ${a + b}.`]
  ];
  const [s, t, why] = pick(items);
  return { prompt: `True or false?<span class="big">${s}</span>`, mode: "tf", truth: t, why };
});

MMTQ.run({
  id: "indices", title: "Indices", outcome: "MA4-IND-C-01",
  toolId: "indices-quiz", tool: "indices-student-quiz", mastery: "indices",
  levels: {
    basic: { sub: "Index notation, powers, square and cube roots, prime factors, multiplying and dividing powers, the zero index." },
    expected: { sub: "Prime factors in index form, HCF and LCM, estimating roots, order of operations and the index laws with pronumerals." }
  },
  related: [
    { href: "/online-quizzes/stage-4/number/factor-circles.html", label: "Factor Circles", small: "Focused quiz" }
  ],
  types: T
});
