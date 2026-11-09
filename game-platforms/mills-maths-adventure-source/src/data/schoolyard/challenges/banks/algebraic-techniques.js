/**
 * Playground question bank — Algebraic Techniques (MA4-ALG-C-01).
 * "Generalises number properties to operate with algebraic expressions
 * including expansion and factorisation."
 *
 * Written for the game in the shared-bank format, covering the content of
 * the site's Algebraic Techniques quiz: the language of algebra, notation,
 * words → expressions, substitution, collecting like terms, multiplying and
 * dividing terms, expanding, factorising, algebraic fractions and patterns.
 *
 * Expression answers use mode "expr" (exprCheck.js): any EQUIVALENT answer
 * is right; a right value in the wrong form (not expanded, not fully
 * factorised, like terms not collected) is a nudge that does not cost the
 * attempt.
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
import "../exprCheck.js";
import { T as t, expr, collect, MX, vh, br } from "./_alg.js";

const { ri, pick, shuffle, fmt, gcd, MINUS } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const nz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
const VARS = ["a", "b", "m", "n", "p", "x", "y", "k", "t"];
const two = () => { const s = shuffle(VARS); return [s[0], s[1]].sort(); };
const E = (terms, form, extra = {}) => { const e = Array.isArray(terms) ? expr(terms) : terms; return { mode: "expr", expr: e.txt, form, answerHTML: MX(e.html), ...extra }; };
/* coefficient as written in front of a pronumeral: 1 and −1 are not written */
const cf = (a) => (a === 1 ? "" : a === -1 ? MINUS : fmt(a));
const FRV = (top, d) => `<span class="fr"><span class="frn">${top}</span><span class="frd">${d}</span></span>`;
const ALG = (config, scale = 1.5) => ({ engine: "algebra-engine", config, scale, maxH: 320 });

/* ================================ BASIC ================================ */
add("basic", "b-parts", "Terms, coefficients and constants", () => {
  const [u, v] = two();
  const a = nz(-9, 9), b = nz(-9, 9), c = nz(-12, 12);
  const e = expr([t(a, u), t(b, v), t(c, "")]);
  const k = ri(0, 2);
  if (k === 0) return { prompt: `What is the <b>coefficient</b> of <i>${v}</i> in ${MX(e.html)}?`, mode: "num", value: b, signed: true, why: `The coefficient is the number multiplying the pronumeral, sign included: ${fmt(b)}.` };
  if (k === 1) return { prompt: `What is the <b>constant term</b> in ${MX(e.html)}?`, mode: "num", value: c, signed: true, why: `The constant is the term with no pronumeral, sign included: ${fmt(c)}.` };
  return { prompt: `What is the <b>coefficient</b> of <i>${u}</i> in ${MX(e.html)}?`, mode: "num", value: a, signed: true, why: `The coefficient of ${u} is the number in front of it, sign included: ${fmt(a)}.` };
});

add("basic", "b-notation", "Algebraic notation", () => {
  const [u, v] = two();
  const items = [
    () => { const k = ri(2, 9); return [`${k} × ${u} × ${v}`, [t(k, u + v)], `Write the number first, then the pronumerals in alphabetical order, with no × signs: ${k}${u}${v}.`]; },
    () => { const k = ri(2, 9); return [`${u} × ${u} × ${k}`, [t(k, u + "^2")], `${u} × ${u} = ${u}², so the term is ${k}${u}².`]; },
    () => { const k = ri(2, 9); return [`${v} × ${k} × ${u} × ${u}`, [t(k, u + "^2" + v)], `Number first, then ${u}² (two lots of ${u}) and ${v}: ${k}${u}²${v}.`]; },
    () => { const k = ri(2, 9); return [`${u} ÷ ${k}`, { txt: `${u}/${k}`, html: FRV(vh(u), k) }, `Division is written as a fraction: ${u} over ${k}.`]; },
    () => { return [`${u} × 1 × ${v} × ${u}`, [t(1, u + "^2" + v)], `A coefficient of 1 is not written: ${u}²${v}.`]; },
  ];
  const [shown, terms, why] = pick(items)();
  const q = E(terms, "simplified", { why });
  return { prompt: `Write using correct algebraic notation.<span class="big">${shown.replace(/([a-z])/g, "<i>$1</i>")}</span>`, ...q, placeholder: "e.g. 3ab" };
});

add("basic", "b-words", "Words to algebraic expressions", () => {
  const n = pick(["n", "x", "p", "m"]), k = ri(2, 12), j = ri(2, 9);
  const items = [
    [`${k} more than <i>${n}</i>`, [t(1, n), t(k, "")]],
    [`${k} less than <i>${n}</i>`, [t(1, n), t(-k, "")]],
    [`the product of ${j} and <i>${n}</i>`, [t(j, n)]],
    [`<i>${n}</i> decreased by ${k}`, [t(1, n), t(-k, "")]],
    [`${k} subtracted from ${j} times <i>${n}</i>`, [t(j, n), t(-k, "")]],
    [`the sum of <i>${n}</i> and ${k}, then multiplied by ${j}`, [t(j, n), t(j * k, "")]],
    [`<i>${n}</i> divided by ${j}, plus ${k}`, { txt: `${n}/${j} + ${k}`, html: `${FRV(vh(n), j)} + ${k}` }],
    [`the square of <i>${n}</i>, minus ${k}`, [t(1, n + "^2"), t(-k, "")]],
  ];
  const [words, terms] = pick(items);
  const e = Array.isArray(terms) ? expr(terms) : terms;
  const show = words.includes("multiplied by") ? `${j}(<i>${n}</i> + ${k})` : e.html;
  return { prompt: `Write an algebraic expression for:<span class="say">${words}</span>`, mode: "expr", expr: e.txt, answerHTML: MX(show), placeholder: `e.g. 3${n} + 2`, why: `Translate each part in order: ${MX(show)}.` };
});

add("basic", "b-substitute", "Substitution", () => {
  const v = pick(["a", "m", "x", "p"]);
  const val = nz(-6, 9), a = ri(2, 9), b = nz(-12, 12);
  const k = ri(0, 2);
  if (k === 0) { const r = a * val + b; return { prompt: `Find the value of ${MX(expr([t(a, v), t(b, "")]).html)} when <i>${v}</i> = ${fmt(val)}.`, mode: "num", value: r, signed: true, why: `${a} × ${br(val)} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${fmt(a * val)} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${fmt(r)}.` }; }
  if (k === 1) { const r = b - a * val; return { prompt: `Find the value of ${MX(`${fmt(b)} ${MINUS} ${a}${vh(v)}`)} when <i>${v}</i> = ${fmt(val)}.`, mode: "num", value: r, signed: true, why: `${fmt(b)} − ${a} × ${br(val)} = ${fmt(b)} − ${br(a * val)} = ${fmt(r)}.` }; }
  const d = pick([2, 3, 4, 5]), w = d * ri(1, 8) * (Math.random() < 0.3 ? -1 : 1), r = w / d + b;
  return { prompt: `Find the value of ${MX(`<span class="fr"><span class="frn">${vh(v)}</span><span class="frd">${d}</span></span> ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`)} when <i>${v}</i> = ${fmt(w)}.`, mode: "num", value: r, signed: true, why: `${fmt(w)} ÷ ${d} = ${fmt(w / d)}, then ${fmt(w / d)} ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${fmt(r)}.` };
});

add("basic", "b-like-terms", "Collect like terms", () => {
  for (;;) {
    const [u, v] = two();
    const raw = shuffle([t(ri(2, 9), u), t(nz(-8, 8), v), t(nz(-7, 9), u), t(nz(-6, 6), v)]);
    const simp = collect(raw);
    if (simp.length < 1 || simp.length === raw.length) continue;
    const q = E(simp, "simplified");
    return { prompt: `Simplify by collecting like terms.<span class="big">${expr(raw).html}</span>`, ...q, why: `Collect the ${u} terms and the ${v} terms separately: ${q.answerHTML}.` };
  }
});

add("basic", "b-mult-terms", "Multiply terms", () => {
  const [u, v] = two();
  const a = nz(-6, 9), b = ri(2, 8);
  const k = ri(0, 2);
  if (k === 0) { const q = E([t(a * b, u + v)], "simplified"); return { prompt: `Simplify.<span class="big">${cf(a)}${vh(u)} × ${b}${vh(v)}</span>`, ...q, why: `Multiply the numbers (${fmt(a)} × ${b} = ${fmt(a * b)}) and the pronumerals (${u} × ${v} = ${u}${v}): ${q.answerHTML}.` }; }
  if (k === 1) { const q = E([t(a * b, u + "^2")], "simplified"); return { prompt: `Simplify.<span class="big">${cf(a)}${vh(u)} × ${b}${vh(u)}</span>`, ...q, why: `${fmt(a)} × ${b} = ${fmt(a * b)} and ${u} × ${u} = ${u}²: ${q.answerHTML}.` }; }
  const c = nz(-5, 5); const q = E([t(a * b * c, u + "^2" + v)], "simplified");
  return { prompt: `Simplify.<span class="big">${cf(a)}${vh(u)} × ${b}${vh(v)} × ${c < 0 ? `(${cf(c)}${vh(u)})` : `${cf(c)}${vh(u)}`}</span>`, ...q, why: `Numbers: ${fmt(a)} × ${b} × ${br(c)} = ${fmt(a * b * c)}. Pronumerals: ${u} × ${v} × ${u} = ${u}²${v}. Answer ${q.answerHTML}.` };
});

add("basic", "b-div-terms", "Divide terms", () => {
  const [u, v] = two();
  const q0 = ri(2, 9), d = ri(2, 6), s = Math.random() < 0.3 ? -1 : 1;
  const k = ri(0, 1);
  if (k === 0) { const q = E([t(s * q0, v)], "simplified"); return { prompt: `Simplify.<span class="big">${fmt(s * q0 * d)}${vh(u + v)} ÷ ${d}${vh(u)}</span>`, ...q, why: `${fmt(s * q0 * d)} ÷ ${d} = ${fmt(s * q0)} and ${u}${v} ÷ ${u} = ${v}: ${q.answerHTML}.` }; }
  const q = E([t(s * q0, u)], "simplified");
  return { prompt: `Simplify.<span class="big">${fmt(s * q0 * d)}${vh(u + "^2")} ÷ ${d}${vh(u)}</span>`, ...q, why: `${fmt(s * q0 * d)} ÷ ${d} = ${fmt(s * q0)} and ${u}² ÷ ${u} = ${u}: ${q.answerHTML}.` };
});

add("basic", "b-expand", "Expand brackets", () => {
  const v = pick(["x", "a", "m", "y"]), a = ri(2, 9), b = ri(1, 9), c = nz(-9, 9);
  const inner = expr([t(b, v), t(c, "")]);
  const q = E([t(a * b, v), t(a * c, "")], "expanded");
  return {
    prompt: `Expand.<span class="big">${a}(${inner.html})</span>`,
    diagram: ALG({ diagramType: "expand-area-model", multiplier: String(a), parts: [`${b === 1 ? "" : b}${v}`, `${c < 0 ? MINUS : ""}${Math.abs(c)}`], products: ["", ""], showProducts: false }),
    ...q, why: `Multiply each term inside by ${a}: ${a} × ${b === 1 ? "" : b}${v} = ${a * b}${v} and ${a} × ${br(c)} = ${fmt(a * c)}. So ${q.answerHTML}.`,
  };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-substitute", "Substitution with two pronumerals", () => {
  for (;;) {
    const [u, v] = two();
    const x = nz(-5, 5), y = nz(-5, 6), a = ri(2, 5), b = nz(-6, 6);
    const k = ri(0, 2);
    if (k === 0) { const r = a * x * x + b * y; return { prompt: `Find the value of ${MX(expr([t(a, u + "^2"), t(b, v)]).html)} when <i>${u}</i> = ${fmt(x)} and <i>${v}</i> = ${fmt(y)}.`, mode: "num", value: r, signed: true, why: `${a} × ${br(x)}² ${b < 0 ? MINUS : "+"} ${Math.abs(b)} × ${br(y)} = ${a} × ${x * x} ${b * y < 0 ? MINUS : "+"} ${Math.abs(b * y)} = ${fmt(r)}. (Square first: ${br(x)}² = ${x * x}.)` }; }
    if (k === 1) { const r = a * (x - y); if (x === y) continue; return { prompt: `Find the value of ${MX(`${a}(${vh(u)} ${MINUS} ${vh(v)})`)} when <i>${u}</i> = ${fmt(x)} and <i>${v}</i> = ${fmt(y)}.`, mode: "num", value: r, signed: true, why: `Brackets first: ${fmt(x)} − ${br(y)} = ${fmt(x - y)}. Then ${a} × ${br(x - y)} = ${fmt(r)}.` }; }
    const r = x * y - a; return { prompt: `Find the value of ${MX(`${vh(u + v)} ${MINUS} ${a}`)} when <i>${u}</i> = ${fmt(x)} and <i>${v}</i> = ${fmt(y)}.`, mode: "num", value: r, signed: true, why: `${br(x)} × ${br(y)} = ${fmt(x * y)}, then ${fmt(x * y)} − ${a} = ${fmt(r)}.` };
  }
});

add("expected", "e-simplify-mixed", "Simplify expressions with several kinds of terms", () => {
  for (;;) {
    const v = pick(["x", "a", "m"]);
    const raw = shuffle([t(ri(2, 7), v + "^2"), t(nz(-8, 8), v), t(nz(-6, 6), v + "^2"), t(nz(-9, 9), v), t(nz(-9, 9), "")]);
    const simp = collect(raw);
    if (simp.length < 2) continue;
    const order = { [v + "^2"]: 0, [v]: 1, "": 2 };
    simp.sort((p, q) => order[p.v] - order[q.v]);
    const q = E(simp, "simplified");
    return { prompt: `Simplify.<span class="big">${expr(raw).html}</span>`, ...q, why: `${v}² terms and ${v} terms are NOT like terms — collect each kind separately: ${q.answerHTML}.` };
  }
});

add("expected", "e-expand-simplify", "Expand and simplify", () => {
  for (;;) {
    const v = pick(["x", "a", "n", "y"]);
    const a = ri(2, 6), b = nz(-8, 8), c = nz(-5, 5), d = nz(-8, 8);
    if (c === 1) continue;
    const terms = collect([t(a, v), t(a * b, ""), t(c, v), t(c * d, "")]);
    if (!terms.length) continue;
    const q = E(terms, "expanded");
    const first = `${a}(${expr([t(1, v), t(b, "")]).html})`;
    const second = `${c < 0 ? ` ${MINUS} ${c === -1 ? "" : Math.abs(c)}` : ` + ${c}`}(${expr([t(1, v), t(d, "")]).html})`;
    return {
      prompt: `Expand and simplify.<span class="big">${first}${second}</span>`, ...q,
      why: `${a}(${v} ${b < 0 ? "−" : "+"} ${Math.abs(b)}) = ${a}${v} ${a * b < 0 ? "−" : "+"} ${Math.abs(a * b)}; ${br(c)}(${v} ${d < 0 ? "−" : "+"} ${Math.abs(d)}) = ${fmt(c)}${v} ${c * d < 0 ? "−" : "+"} ${Math.abs(c * d)}. Collect: ${q.answerHTML}.${c < 0 ? " Careful: the negative multiplies BOTH terms in the second bracket." : ""}`,
    };
  }
});

add("expected", "e-expand-negative", "Expand with negatives and pronumerals", () => {
  const v = pick(["x", "a", "m", "p"]);
  const k = ri(0, 1);
  if (k === 0) {
    const a = -ri(2, 8), b = ri(1, 6), c = nz(-9, 9);
    const q = E([t(a * b, v), t(a * c, "")], "expanded");
    return { prompt: `Expand.<span class="big">${fmt(a)}(${expr([t(b, v), t(c, "")]).html})</span>`, ...q, why: `${fmt(a)} × ${b === 1 ? "" : b}${v} = ${fmt(a * b)}${v} and ${fmt(a)} × ${br(c)} = ${fmt(a * c)}: ${q.answerHTML}.` };
  }
  const a = ri(1, 4), c = nz(-9, 9);
  const q = E([t(a, v + "^2"), t(a * c, v)], "expanded");
  return { prompt: `Expand.<span class="big">${a === 1 ? "" : a}${vh(v)}(${expr([t(1, v), t(c, "")]).html})</span>`, ...q, why: `${a === 1 ? "" : a}${v} × ${v} = ${a === 1 ? "" : a}${v}² and ${a === 1 ? "" : a}${v} × ${br(c)} = ${fmt(a * c)}${v}: ${q.answerHTML}.` };
});

add("expected", "e-factorise", "Factorise", () => {
  for (;;) {
    const v = pick(["x", "a", "m", "y", "k"]);
    const k = ri(0, 2);
    let outer, inner;
    if (k === 0) { const h = ri(2, 9), p = ri(1, 9), q = nz(-9, 9); if (gcd(p, Math.abs(q)) !== 1) continue; outer = [h, ""]; inner = [t(p, v), t(q, "")]; }
    else if (k === 1) { const h = ri(1, 6), p = ri(1, 7), q = nz(-9, 9); if (gcd(p, Math.abs(q)) !== 1) continue; outer = [h, v]; inner = [t(p, v), t(q, "")]; }
    else { const [u, w] = two(); const h = ri(2, 8), p = ri(1, 7), q = nz(-7, 7); if (gcd(p, Math.abs(q)) !== 1) continue; outer = [h, u]; inner = [t(p, w), t(q, "")]; }
    const [h, hv] = outer;
    const full = inner.map((x) => t(h * x.c, (hv + x.v).split("").sort().join("").replace(/([a-z])\1/, "$1^2")));
    const fe = expr(full);
    const ie = expr(inner);
    const outerHTML = `${h === 1 && hv ? "" : h}${vh(hv)}`;
    return {
      prompt: `Factorise fully.<span class="big">${fe.html}</span>`,
      mode: "expr", expr: fe.txt, form: "factorised", answerHTML: MX(`${outerHTML}(${ie.html})`),
      answerTxt: `${h === 1 && hv ? "" : h}${hv}(${ie.txt})`,
      placeholder: "e.g. 3(2x + 5)",
      why: `The highest common factor of ${fe.html} is ${MX(outerHTML)}. Divide each term by it: ${MX(`${outerHTML}(${ie.html})`)}. Check by expanding.`,
    };
  }
});

add("expected", "e-alg-fractions", "Simplify algebraic fractions", () => {
  const v = pick(["x", "a", "m", "y"]);
  const fr = (n, dd) => `<span class="fr"><span class="frn">${n === 1 ? "" : n}${vh(v)}</span><span class="frd">${dd}</span></span>`;
  /* the simplified answer n·v/d as checker text + HTML (d = 1 → just n·v) */
  const ans = (n, d) => (d === 1 ? { txt: `${n === 1 ? "" : n}${v}`, html: `${n === 1 ? "" : n}${vh(v)}` } : { txt: `${n === 1 ? "" : n}${v}/${d}`, html: fr(n, d) });
  if (Math.random() < 0.5) {
    for (;;) {
      const a = ri(1, 5), b = ri(2, 9), c = ri(1, 5), d = ri(2, 9);
      if (b === d || a >= b || c >= d) continue;
      const L = b * d / gcd(b, d), top = a * (L / b) + c * (L / d);
      const g = gcd(top, L), A = ans(top / g, L / g);
      return { prompt: `Simplify.<span class="big">${fr(a, b)} + ${fr(c, d)}</span>`, mode: "expr", expr: A.txt, form: "simplified", answerHTML: MX(A.html), placeholder: `e.g. 7${v}/12`, why: `Common denominator ${L}: ${MX(fr(a * L / b, L))} + ${MX(fr(c * L / d, L))} = ${MX(fr(top, L))}${g > 1 ? ` = ${MX(A.html)}` : ""}.` };
    }
  }
  for (;;) {
    const n = ri(2, 12), d = ri(2, 12), g = gcd(n, d);
    if (g === 1 || n % d === 0) continue;
    const A = ans(n / g, d / g);
    return { prompt: `Simplify.<span class="big">${fr(n * 2, d * 2)}</span>`, mode: "expr", expr: A.txt, form: "simplified", answerHTML: MX(A.html), placeholder: `e.g. 2${v}/3`, why: `Divide the numerator and denominator by their HCF, ${2 * g}: ${MX(A.html)}.` };
  }
});

add("expected", "e-pattern", "Patterns: find the rule", () => {
  const a = ri(2, 6), b = nz(-3, 8), n = pick(["n", "p", "x"]);
  const thing = pick(["matchsticks", "tiles", "dots", "squares"]);
  const ns = [1, 2, 3, 4, 5];
  const html = `<table class="dtab"><tr><th>Pattern number (<i>${n}</i>)</th>${ns.map((x) => `<td>${x}</td>`).join("")}</tr><tr><th>Number of ${thing}</th>${ns.map((x) => `<td>${a * x + b}</td>`).join("")}</tr></table>`;
  if (a * 1 + b <= 0) return T.find((q) => q.id === "e-pattern").gen();
  const e = expr([t(a, n), t(b, "")]);
  return { prompt: `Write an expression for the number of ${thing} in pattern <i>${n}</i>.${html}`, mode: "expr", expr: e.txt, answerHTML: MX(e.html), placeholder: `e.g. 3${n} + 1`, why: `The number goes up by ${a} each time, so the rule starts ${a}${n}. When ${n} = 1, ${a} × 1 = ${a}, and we need ${a + b}, so ${b < 0 ? "subtract" : "add"} ${Math.abs(b)}: ${MX(e.html)}.` };
});

add("expected", "e-perimeter", "Expressions for perimeter and area", () => {
  const v = pick(["x", "a", "m"]), k = ri(2, 9);
  if (Math.random() < 0.55) {
    const q = E([t(4, v), t(2 * k, "")], "simplified");
    return { prompt: `Write a simplified expression for the perimeter of this rectangle.`, diagram: ALG({ diagramType: "perimeter-figure", shape: "rectangle", width: v, length: `${v} + ${k}` }), ...q, why: `P = ${v} + (${v} + ${k}) + ${v} + (${v} + ${k}) = 4${v} + ${2 * k}.` };
  }
  const c = ri(3, 12);
  const q = E([t(3, v), t(k + c, "")], "simplified");
  return { prompt: `Write a simplified expression for the perimeter of this triangle.`, diagram: ALG({ diagramType: "perimeter-figure", shape: "triangle", sides: [v, `${v} + ${k}`, `${v} + ${c}`] }), ...q, why: `P = ${v} + (${v} + ${k}) + (${v} + ${c}) = 3${v} + ${k + c}.` };
});

add("expected", "e-words-rich", "Write expressions from worded problems", () => {
  const items = [
    () => { const p = ri(2, 6), r = ri(2, 9); return [`Pens cost $${p} each and rulers cost $${r} each. Write an expression for the cost, in dollars, of <i>a</i> pens and <i>b</i> rulers.`, [t(p, "a"), t(r, "b")]]; },
    () => { const k = ri(2, 5), m = ri(3, 15); return [`I think of a number <i>n</i>, multiply it by ${k}, then subtract ${m}. Write an expression for the result.`, [t(k, "n"), t(-m, "")]]; },
    () => { const f = ri(5, 40), r = ri(10, 25); return [`A taxi charges a flag fall of $${f} plus $${r} per kilometre. Write an expression for the cost, in dollars, of a trip of <i>d</i> km.`, [t(r, "d"), t(f, "")]]; },
    () => { const s = ri(5, 30); return [`Liam is <i>y</i> years old. His mother is ${s} years older than three times his age. Write an expression for his mother's age.`, [t(3, "y"), t(s, "")]]; },
    () => { const c = ri(20, 60), w = ri(3, 9); return [`A phone has ${c}% battery and uses ${w}% each hour. Write an expression for the battery left after <i>h</i> hours.`, [t(c, ""), t(-w, "h")]]; },
  ];
  const [p, terms] = pick(items)();
  const e = expr(terms);
  return { prompt: p, mode: "expr", expr: e.txt, answerHTML: MX(e.html), placeholder: "Type an expression", why: `${MX(e.html)} — each part of the sentence becomes one term.` };
});

defineBank({
  id: "algebraic-techniques", title: "Algebraic Techniques", outcome: "MA4-ALG-C-01",
  levels: {
    basic: { sub: "The language of algebra, notation, words to expressions, substitution, like terms, multiplying and dividing terms, expanding." },
    expected: { sub: "Substitution with two pronumerals, simplifying, expanding and simplifying, factorising, algebraic fractions, patterns and worded problems." },
  },
  types: T,
}, T);
export default T;
