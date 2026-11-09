/**
 * Extra answer checkers for the Playground's own banks (Integers, FDP,
 * Algebraic Techniques, Equations, Angles). They register themselves on the
 * shared core's CHECK table, so `C.check(q, input)` handles them like any
 * other mode, with the same three outcomes: {ok:true} · {ok:false} · {nudge}.
 *
 *   mode "expr"  an algebraic expression. q.expr = the target (plain text,
 *                e.g. "6x - 15"); q.form = "simplified" | "expanded" |
 *                "factorised" | undefined. The answer must be EQUIVALENT to
 *                the target; a right value in the wrong form is a nudge.
 *   mode "nums"  a set or list of numbers. q.values = [..]; q.ordered = true
 *                when the order matters (ordering questions). "±7" counts as
 *                7 and −7; "x = 7 or x = −7" works too.
 *
 * Pure (no DOM), so the Node harness checks exactly what students are marked by.
 */
import C from "./questionCore.js";

/* ------------------------- polynomial arithmetic ------------------------- */
// A polynomial is a Map: monomial key → coefficient. Key = sorted "a2b1" style.
const keyOf = (vars) => Object.keys(vars).filter((v) => vars[v]).sort().map((v) => v + vars[v]).join("");
const varsOf = (key) => { const o = {}; key.replace(/([a-z])(\d+)/g, (_, v, e) => { o[v] = Number(e); return ""; }); return o; };
const P = (entries) => { const m = new Map(); for (const [k, c] of entries) if (Math.abs(c) > 1e-12) m.set(k, (m.get(k) || 0) + c); return clean0(m); };
function clean0(m) { for (const [k, c] of m) if (Math.abs(c) < 1e-12) m.delete(k); return m; }
const constP = (c) => P([["", c]]);
const varP = (v) => P([[v + "1", 1]]);
function add(a, b, s = 1) { const m = new Map(a); for (const [k, c] of b) m.set(k, (m.get(k) || 0) + s * c); return clean0(m); }
function mul(a, b) {
  const m = new Map();
  for (const [ka, ca] of a) for (const [kb, cb] of b) {
    const va = varsOf(ka), vb = varsOf(kb);
    for (const v in vb) va[v] = (va[v] || 0) + vb[v];
    const k = keyOf(va); m.set(k, (m.get(k) || 0) + ca * cb);
  }
  return clean0(m);
}
function div(a, b) {
  if (b.size !== 1) return null; // only divide by a single term
  const [[kb, cb]] = [...b];
  if (Math.abs(cb) < 1e-12) return null;
  const vb = varsOf(kb);
  const m = new Map();
  for (const [ka, ca] of a) {
    const va = varsOf(ka);
    for (const v in vb) { va[v] = (va[v] || 0) - vb[v]; if (va[v] < 0) return null; }
    const k = keyOf(va); m.set(k, (m.get(k) || 0) + ca / cb);
  }
  return clean0(m);
}
function pow(a, n) { if (!Number.isInteger(n) || n < 0 || n > 8) return null; let r = constP(1); for (let i = 0; i < n; i++) r = mul(r, a); return r; }
function samePoly(a, b) {
  if (!a || !b) return false;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) { const x = a.get(k) || 0, y = b.get(k) || 0; if (Math.abs(x - y) > 1e-9 * Math.max(1, Math.abs(y))) return false; }
  return true;
}

/* ------------------------------- parsing -------------------------------- */
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const t = s.slice(i, j); if ((t.match(/\./g) || []).length > 1) return null; out.push({ t: "n", v: Number(t) }); i = j; continue; }
    if (/[a-z]/i.test(ch)) { out.push({ t: "v", v: ch.toLowerCase() }); i++; continue; }
    if ("+-*/^()".includes(ch)) { out.push({ t: ch }); i++; continue; }
    return null;
  }
  // implicit multiplication: (num|var|')') followed by (num|var|'(')
  const res = [];
  for (let k = 0; k < out.length; k++) {
    const a = out[k - 1], b = out[k];
    if (a && (a.t === "n" || a.t === "v" || a.t === ")") && (b.t === "v" || b.t === "(" || (b.t === "n" && a.t !== "n"))) res.push({ t: "*", implicit: true });
    res.push(b);
  }
  return res;
}
export function parseExpr(raw) {
  let s = C.clean(raw);
  s = s.replace(/^[a-z]\s*=\s*/i, ""); // "y = 3x + 2"
  if (!s) return null;
  const toks = tokenize(s);
  if (!toks || !toks.length) return null;
  let p = 0;
  const peek = () => toks[p], eat = (t) => (toks[p] && toks[p].t === t ? toks[p++] : null);
  function expr() {
    let a = term(); if (!a) return null;
    for (;;) {
      if (eat("+")) { const b = term(); if (!b) return null; a = add(a, b); }
      else if (eat("-")) { const b = term(); if (!b) return null; a = add(a, b, -1); }
      else return a;
    }
  }
  function term() {
    let a = unary(); if (!a) return null;
    for (;;) {
      if (eat("*")) { const b = unary(); if (!b) return null; a = mul(a, b); }
      else if (eat("/")) { const b = unary(); if (!b) return null; a = div(a, b); if (!a) return null; }
      else return a;
    }
  }
  function unary() {
    if (eat("-")) { const a = unary(); return a ? mul(constP(-1), a) : null; }
    if (eat("+")) return unary();
    return power();
  }
  function power() {
    const a = atom(); if (!a) return null;
    if (eat("^")) {
      let neg = false; if (eat("-")) neg = true;
      const e = peek(); if (!e || e.t !== "n") { if (eat("(")) { const n = toks[p]; if (!n || n.t !== "n") return null; p++; if (!eat(")")) return null; return neg ? null : pow(a, n.v); } return null; }
      p++; if (neg) return null; return pow(a, e.v);
    }
    return a;
  }
  function atom() {
    const t = peek(); if (!t) return null;
    if (t.t === "n") { p++; return constP(t.v); }
    if (t.t === "v") { p++; return varP(t.v); }
    if (eat("(")) { const a = expr(); if (!a || !eat(")")) return null; return a; }
    return null;
  }
  const r = expr();
  if (!r || p !== toks.length) return null;
  return r;
}

/* Top-level terms of the typed text (signs kept), when there are no brackets. */
function topTerms(s) {
  const out = []; let depth = 0, cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++; if (ch === ")") depth--;
    if (depth === 0 && (ch === "+" || ch === "-") && i > 0 && !/[*/^(]/.test(s[i - 1])) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.map((t) => t.trim()).filter((t) => t && t !== "+" && t !== "-");
}
// A tidy single term: [coefficient][letters with optional indices][/number], each letter once.
const TIDY = /^[+-]?(\d+(\.\d+)?)?([a-z](\^\d+)?)*(\/\d+)?$/i;
function tidyTerm(t) {
  const u = t.replace(/\s+/g, "").replace(/\*/g, "");
  if (!TIDY.test(u)) return false;
  if (!/[0-9a-z]/i.test(u)) return false;
  if (/^[+-]?1[a-z]/i.test(u)) return false; // "1x" — write x
  const letters = u.replace(/\^\d+/g, "").replace(/[^a-z]/gi, "").toLowerCase();
  return new Set(letters).size === letters.length;
}
function collected(s) {
  const terms = topTerms(s);
  const keys = new Set();
  for (const t of terms) { const pt = parseExpr(t); if (!pt) return false; if (pt.size === 0) return false; if (pt.size > 1) return false; const k = [...pt.keys()][0]; if (keys.has(k)) return false; keys.add(k); }
  return true;
}
function intGcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }

/* ------------------------------- checkers ------------------------------- */
C.CHECK.expr = (q, raw) => {
  const s = C.clean(raw).replace(/^[a-z]\s*=\s*/i, "").trim();
  if (!s) return { nudge: "Type your answer." };
  const got = parseExpr(s);
  if (!got) return { nudge: "Type an expression like 3a + 2b (use ^ for a power, e.g. x^2)." };
  const want = parseExpr(q.expr);
  if (!samePoly(got, want)) return { ok: false };
  const flat = s.replace(/\s+/g, "");
  if (q.form === "simplified" || q.form === "expanded") {
    if (flat.includes("(")) return { nudge: q.form === "expanded" ? "Right value — now expand the brackets." : "Right value — now simplify it fully (no brackets needed)." };
    const terms = topTerms(flat);
    if (!terms.every(tidyTerm) || !collected(flat)) return { nudge: "Right value — now simplify fully: collect like terms and write each term once (e.g. 12ab, not 3a × 4b)." };
    return { ok: true };
  }
  if (q.form === "factorised") {
    const m = /^([+-]?[0-9.]*[a-z]*(?:\^\d+)?[a-z]*(?:\^\d+)?)\*?\((.+)\)$/i.exec(flat);
    if (!m) return { nudge: "Right value — now write it in factorised form, like 3(2x + 5)." };
    let outerTxt = m[1];
    if (outerTxt === "" || outerTxt === "+") outerTxt = "1"; else if (outerTxt === "-") outerTxt = "-1";
    const outer = parseExpr(outerTxt), inner = parseExpr(m[2]);
    if (!outer || !inner || outer.size !== 1) return { nudge: "Write it as a factor times a bracket, like 3(2x + 5)." };
    // fully factorised: no common number or letter left inside the bracket
    const coefs = [...inner.values()];
    const ints = coefs.every((c) => Number.isInteger(c));
    const g = ints ? coefs.reduce((a, c) => intGcd(a, c), 0) : 1;
    const ks = [...inner.keys()].map(varsOf);
    const commonVar = ks.length && Object.keys(ks[0]).some((v) => ks.every((o) => (o[v] || 0) > 0));
    if (inner.size < 2) return { nudge: "Right value — now write it in factorised form, like 3(2x + 5)." };
    if (g > 1 || commonVar) return { nudge: "Nearly — take out the HIGHEST common factor (there is still a common factor inside the bracket)." };
    const [[, oc]] = [...outer];
    if (Math.abs(oc) === 1 && [...outer.keys()][0] === "") return { nudge: "Right value — now take out the highest common factor." };
    return { ok: true };
  }
  return { ok: true };
};

function numbersIn(raw) {
  let s = C.clean(raw).replace(/\b[a-z]\s*=\s*/gi, " ").replace(/\bor\b|\band\b/gi, ",");
  const out = [];
  // ±n → n and −n
  s = s.replace(/±\s*(\d*\.?\d+)/g, (_, n) => { out.push(Number(n), -Number(n)); return " "; });
  s = s.replace(/(\d)[ ,](?=\d{3}(?!\d))/g, "$1");
  const re = /-?\s*\d*\.?\d+(?:\s*\/\s*\d+)?/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[0].replace(/\s+/g, "");
    const v = C.parseNumber(t);
    if (!isNaN(v)) out.push(v);
  }
  return out;
}
C.CHECK.nums = (q, raw) => {
  const got = numbersIn(raw);
  if (!got.length) return { nudge: q.ordered ? "Type the numbers in order, separated by commas." : "Type your answer(s), separated by commas." };
  const want = q.values;
  const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (q.ordered) {
    if (got.length !== want.length) {
      if (got.length < want.length) return { nudge: `Include all ${want.length} numbers.` };
      return { ok: false };
    }
    return { ok: got.every((v, i) => near(v, want[i])) };
  }
  const left = got.slice();
  for (const w of want) { const i = left.findIndex((v) => near(v, w)); if (i < 0) return { ok: false }; left.splice(i, 1); }
  return { ok: left.length === 0 };
};

export default C;
