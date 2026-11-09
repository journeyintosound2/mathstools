/**
 * Playground question bank — Equations (MA4-EQU-C-01).
 * "Solves linear equations of up to 2 steps and quadratic equations of the
 * form ax² = c."
 *
 * Written for the game in the shared-bank format, covering the content of the
 * site's Equations quiz: one-step and two-step equations, fractions,
 * brackets, pronumerals on both sides, collecting like terms first, checking
 * a solution by substitution, forming equations from words and models, and
 * x² = c / ax² = c (both solutions). Diagrams use the equation-engine
 * (balance scale, bar model).
 *
 * Every solution is a whole number so the focus stays on the method.
 */
import C from "../questionCore.js";
import { defineBank } from "./_adapt.js";
import "../exprCheck.js";
import { T as t, expr, MX, vh, br } from "./_alg.js";

const { ri, pick, shuffle, fmt, MINUS } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const nz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
const L = () => pick(["x", "x", "a", "m", "n", "p", "y", "k"]);
const EQ = (lhs, rhs) => `<span class="big">${lhs} = ${rhs}</span>`;
const sol = (v, x, extra = {}) => ({ mode: "num", value: x, signed: true, placeholder: `${v} = …`, answerHTML: MX(`${vh(v)} = ${fmt(x)}`), ...extra });
const FRV = (top, d) => `<span class="fr"><span class="frn">${top}</span><span class="frd">${d}</span></span>`;
const pm = (b) => (b < 0 ? ` ${MINUS} ${Math.abs(b)}` : ` + ${b}`);
const EQN = (config, scale = 0.9) => ({ engine: "equation-engine", config, scale, maxH: 230 });

/* ================================ BASIC ================================ */
add("basic", "b-one-addsub", "One-step equations (+ and −)", () => {
  const v = L(), x = nz(-12, 20), b = ri(2, 25);
  if (Math.random() < 0.5) return { prompt: `Solve.${EQ(`${vh(v)} + ${b}`, fmt(x + b))}`, ...sol(v, x), why: `Subtract ${b} from both sides: ${v} = ${fmt(x + b)} − ${b} = ${fmt(x)}.` };
  return { prompt: `Solve.${EQ(`${vh(v)} ${MINUS} ${b}`, fmt(x - b))}`, ...sol(v, x), why: `Add ${b} to both sides: ${v} = ${fmt(x - b)} + ${b} = ${fmt(x)}.` };
});

add("basic", "b-one-muldiv", "One-step equations (× and ÷)", () => {
  const v = L(), a = ri(2, 12);
  let x = 0; while (Math.abs(x) < 2) x = ri(-12, 15);
  if (Math.random() < 0.55) return { prompt: `Solve.${EQ(`${a}${vh(v)}`, fmt(a * x))}`, ...sol(v, x), why: `Divide both sides by ${a}: ${v} = ${fmt(a * x)} ÷ ${a} = ${fmt(x)}.` };
  return { prompt: `Solve.${EQ(FRV(vh(v), a), fmt(x))}`, ...sol(v, x * a), why: `Multiply both sides by ${a}: ${v} = ${fmt(x)} × ${a} = ${fmt(x * a)}.` };
});

add("basic", "b-two-step", "Two-step equations", () => {
  const v = L(), x = nz(-10, 12), a = ri(2, 9), b = nz(-20, 20);
  const r = a * x + b;
  return { prompt: `Solve.${EQ(MX(expr([t(a, v), t(b, "")]).html), fmt(r))}`, ...sol(v, x), why: `${b > 0 ? `Subtract ${b}` : `Add ${-b}`} on both sides: ${a}${v} = ${fmt(r - b)}. Then divide by ${a}: ${v} = ${fmt(x)}.` };
});

add("basic", "b-check", "Is it a solution?", () => {
  const v = L(), x = nz(-8, 10), a = ri(2, 7), b = nz(-15, 15), r = a * x + b;
  const tryX = Math.random() < 0.5 ? x : x + pick([-2, -1, 1, 2]);
  const val = a * tryX + b;
  return {
    prompt: `True or false? <i>${v}</i> = ${fmt(tryX)} is a solution of ${MX(`${expr([t(a, v), t(b, "")]).html} = ${fmt(r)}`)}.`,
    mode: "tf", truth: tryX === x,
    why: `Substitute: ${a} × ${br(tryX)}${pm(b)} = ${fmt(val)}${val === r ? `, which equals ${fmt(r)} — so it IS a solution.` : `, not ${fmt(r)} — so it is NOT a solution.`}`,
  };
});

add("basic", "b-represent", "Which equation matches?", () => {
  const n = ri(3, 15), a = ri(2, 5), b = ri(6, 12), r = a * n + b;
  const story = pick([
    `I think of a number, multiply it by ${a} and add ${b}. The answer is ${r}.`,
    `${a} identical boxes of pencils and ${b} loose pencils make ${r} pencils altogether.`,
    `A gym charges $${b} to join plus $${a} per visit. Jo paid $${r} in total.`,
  ]);
  const v = "x";
  const right = `${a}${vh(v)} + ${b} = ${r}`;
  const wrong = shuffle([`${a}(${vh(v)} + ${b}) = ${r}`, `${b}${vh(v)} + ${a} = ${r}`, `${a}${vh(v)} = ${r} + ${b}`, `${vh(v)} + ${a} + ${b} = ${r}`]).slice(0, 3);
  const opts = shuffle([right, ...wrong]);
  return {
    prompt: `Which equation matches this situation? (Let <i>x</i> be the unknown.)<span class="say">${story}</span>`,
    mode: "mc", options: opts.map((o) => MX(o)), correct: opts.indexOf(right),
    why: `${a} lots of x is ${a}x; adding ${b} gives ${a}x + ${b}, and that equals ${r}. (Solving: x = ${n}.)`,
  };
});

add("basic", "b-balance", "Balance-scale equations", () => {
  const a = ri(2, 3), x = ri(2, 5), b = ri(1, 4), c = a * x + b;
  return {
    prompt: `The scales balance. Each box has the same mass, <i>x</i> kg, and each circle is 1 kg. Find <i>x</i>.`,
    diagram: EQN({ diagramType: "balance-scale", leftX: a, leftConst: b, rightConst: c }),
    ...sol("x", x),
    why: `The equation is ${a}x + ${b} = ${c}. Take ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${x}.`,
  };
});

/* =============================== EXPECTED ============================== */
add("expected", "e-frac-var", "Equations with fractions: x/a + b = c", () => {
  const v = L(), a = ri(2, 6), q = nz(-6, 8), b = nz(-9, 9), x = a * q, c = q + b;
  return { prompt: `Solve.${EQ(`${FRV(vh(v), a)}${pm(b)}`, fmt(c))}`, ...sol(v, x), why: `${b > 0 ? `Subtract ${b}` : `Add ${-b}`}: ${v}/${a} = ${fmt(q)}. Multiply by ${a}: ${v} = ${fmt(x)}.` };
});

add("expected", "e-frac-whole", "Equations with fractions: (x + a)/b = c", () => {
  const v = L(), d = ri(2, 6), c = nz(-6, 9), b = nz(-9, 9), x = d * c - b;
  return { prompt: `Solve.${EQ(FRV(`${vh(v)}${pm(b)}`, d), fmt(c))}`, ...sol(v, x), why: `Multiply both sides by ${d}: ${v}${pm(b)} = ${fmt(d * c)}. Then ${b > 0 ? `subtract ${b}` : `add ${-b}`}: ${v} = ${fmt(x)}.` };
});

add("expected", "e-brackets", "Equations with brackets", () => {
  const v = L(), a = ri(2, 7), b = nz(-9, 9), x = nz(-8, 10), r = a * (x + b);
  return { prompt: `Solve.${EQ(`${a}(${vh(v)}${pm(b)})`, fmt(r))}`, ...sol(v, x), why: `Divide both sides by ${a}: ${v}${pm(b)} = ${fmt(x + b)}. Then ${b > 0 ? `subtract ${b}` : `add ${-b}`}: ${v} = ${fmt(x)}. (Or expand first: ${a}${v}${pm(a * b)} = ${fmt(r)}.)` };
});

add("expected", "e-both-sides", "Pronumerals on both sides", () => {
  for (;;) {
    const v = L(), x = nz(-8, 10), a = ri(3, 9), c = ri(1, a - 1);
    const b = nz(-15, 15), d = (a - c) * x + b;
    if (d === 0) continue;
    return {
      prompt: `Solve.${EQ(MX(expr([t(a, v), t(b, "")]).html), MX(expr([t(c, v), t(d, "")]).html))}`, ...sol(v, x),
      why: `Subtract ${c === 1 ? "" : c}${v} from both sides: ${a - c === 1 ? "" : a - c}${v}${pm(b)} = ${fmt(d)}. Then ${b > 0 ? `subtract ${b}` : `add ${-b}`}: ${a - c === 1 ? "" : a - c}${v} = ${fmt(d - b)}${a - c === 1 ? "" : `, so ${v} = ${fmt(x)}`}.`,
    };
  }
});

add("expected", "e-collect", "Collect like terms first", () => {
  for (;;) {
    const v = L(), p = ri(2, 6), q = nz(-4, 5), b = nz(-12, 12), x = nz(-6, 9);
    if (p + q <= 0) continue;
    const r = (p + q) * x + b;
    return { prompt: `Solve.${EQ(MX(expr([t(p, v), t(b, ""), t(q, v)]).html), fmt(r))}`, ...sol(v, x), why: `Collect like terms: ${p + q === 1 ? "" : p + q}${v}${pm(b)} = ${fmt(r)}. Then ${b > 0 ? `subtract ${b}` : `add ${-b}`}: ${p + q === 1 ? "" : p + q}${v} = ${fmt(r - b)}${p + q === 1 ? "" : `, so ${v} = ${fmt(x)}`}.` };
  }
});

add("expected", "e-word", "Form and solve an equation", () => {
  const k = ri(0, 4);
  if (k === 0) { const n = ri(5, 40); return { prompt: `The sum of three consecutive whole numbers is ${3 * n + 3}. Form an equation and find the <b>smallest</b> number.`, mode: "num", value: n, why: `Let the numbers be n, n + 1, n + 2. Then 3n + 3 = ${3 * n + 3}, so 3n = ${3 * n} and n = ${n}.` }; }
  if (k === 1) { const w = ri(3, 15), d = ri(2, 9), P = 2 * (w + w + d); return { prompt: `A rectangle is ${d} cm longer than it is wide. Its perimeter is ${P} cm. Find its width.`, mode: "num", value: w, unit: "cm", why: `Width w, length w + ${d}. Perimeter: 2w + 2(w + ${d}) = 4w + ${2 * d} = ${P}. So 4w = ${P - 2 * d} and w = ${w} cm.` }; }
  if (k === 2) { const age = ri(8, 15), diff = ri(20, 32); return { prompt: `Mia's mother is ${diff} years older than Mia. Together their ages add to ${2 * age + diff}. How old is Mia?`, mode: "num", value: age, unit: "years", why: `Let Mia be m. Then m + (m + ${diff}) = ${2 * age + diff}, so 2m = ${2 * age} and m = ${age}.` }; }
  if (k === 3) { const f = pick([3, 4, 5]), r = pick([2, 3, 4]), km = ri(4, 18), tot = f + r * km; return { prompt: `A taxi charges $${f} plus $${r} per kilometre. A trip cost $${tot}. How many kilometres was the trip?`, mode: "num", value: km, unit: "km", why: `${f} + ${r}d = ${tot}, so ${r}d = ${tot - f} and d = ${km} km.` }; }
  const x = ri(4, 20), parts = [{ label: "x" }, { label: "x" }, { label: "x" }, { label: String(ri(3, 9)), weight: 0.7 }];
  const k2 = Number(parts[3].label), total = 3 * x + k2;
  return { prompt: `The bar model shows a total of ${total}. Find <i>x</i>.`, diagram: EQN({ diagramType: "bar-model", total, totalLabel: String(total), parts }), ...sol("x", x), why: `3x + ${k2} = ${total}, so 3x = ${total - k2} and x = ${x}.` };
});

add("expected", "e-quadratic", "Solve x² = c and ax² = c", () => {
  const v = pick(["x", "a", "m", "y"]), r = ri(2, 12);
  if (Math.random() < 0.5) {
    return { prompt: `Solve. Give <b>both</b> solutions.${EQ(`${vh(v)}<sup>2</sup>`, r * r)}`, mode: "nums", values: [r, -r], placeholder: `e.g. ${v} = 4 or ${v} = −4`, answerHTML: MX(`${vh(v)} = ±${r}`), why: `${v} = ±√${r * r} = ±${r}. Both ${r} and −${r} square to ${r * r}.` };
  }
  const a = ri(2, 5), s = ri(2, 8);
  return { prompt: `Solve. Give <b>both</b> solutions.${EQ(`${a}${vh(v)}<sup>2</sup>`, a * s * s)}`, mode: "nums", values: [s, -s], placeholder: `e.g. ${v} = 4 or ${v} = −4`, answerHTML: MX(`${vh(v)} = ±${s}`), why: `Divide by ${a}: ${v}² = ${s * s}. So ${v} = ±√${s * s} = ±${s}.` };
});

add("expected", "e-check", "Check a solution (harder)", () => {
  const v = L(), x = nz(-6, 8), a = ri(2, 6), b = nz(-8, 8), c = nz(-5, 5);
  const rhs = a * (x + b) + c;
  const tryX = Math.random() < 0.5 ? x : -x === x ? x + 1 : -x;
  const val = a * (tryX + b) + c;
  return {
    prompt: `True or false? <i>${v}</i> = ${fmt(tryX)} is a solution of ${MX(`${a}(${vh(v)}${pm(b)})${pm(c)} = ${fmt(rhs)}`)}.`,
    mode: "tf", truth: val === rhs,
    why: `Substitute: ${a}(${br(tryX)}${pm(b)})${pm(c)} = ${a} × ${br(tryX + b)}${pm(c)} = ${fmt(val)}. ${val === rhs ? `That equals ${fmt(rhs)}, so it is a solution.` : `That is not ${fmt(rhs)}, so it is not a solution.`}`,
  };
});

defineBank({
  id: "equations", title: "Equations", outcome: "MA4-EQU-C-01",
  levels: {
    basic: { sub: "One- and two-step equations, checking a solution, matching an equation to a situation, balance scales." },
    expected: { sub: "Fractions, brackets, pronumerals on both sides, collecting terms, forming and solving equations, x² = c." },
  },
  types: T,
}, T);
export default T;
