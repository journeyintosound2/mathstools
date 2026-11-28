/* Mills Maths Tools — whole-topic quizzes: typed algebra
   ------------------------------------------------------------------------
   online-quizzes/stage-4/topic-quiz/algebra.js   (plain script, after core.js)

   The Stage 5 quizzes ask for algebra: "Expand (y + 3)(y + 4)", "Factorise
   6x² − 3x", "Solve x² − x − 6 = 0", "Find the equation of the line". This file
   adds what core.js needs to mark what a student TYPES for those:

     MMTQCore.alg.parse(text)   → a small expression tree (or null)
     MMTQCore.alg.html(tree)    → the same thing set out as maths (stacked
                                  fractions, raised indices, a drawn root) — the
                                  engine shows it under the box as the student
                                  types, so they see how their typing was read
     CHECK.expr   an expression. Marked by VALUE (the two expressions agree at
                  random numbers), then by FORM, which is only ever a free nudge:
                    form "expand"    no brackets left, like terms collected
                    form "factor"    a product, and fully factorised
                    form "simplify"  no more parts than the answer; a fraction
                                     fully cancelled
                    + posIndex (no negative indices), noFraction (no division),
                      ratDenom (no root in a denominator), power (a single power)
     CHECK.eqn    an equation (a line, a circle, a formula with a new subject):
                  right when it is the answer's equation rearranged.
                  form "subject" wants  y = …  with y on its own.
                  form "general" wants  ax + by + c = 0  with whole numbers.
     CHECK.set    every solution: "x = −4 or x = 7", "−4, 7", "±3", "1 ± √10".
     CHECK.ineq   an inequality: "x ≥ 2" (or "2 ≤ x").
     CHECK.multi  two or three boxes for an answer in parts ("gradient … ,
                  y-intercept …"); right only when every box is right.

   Typing rules (shown in the placeholders and nudges): ^ for an index (x^2),
   / for a fraction with brackets round a top or bottom that has more than one
   term ((x + 2)/3), sqrt(…) or the √ key for a root. "1/2x" is read as ½x.
   No DOM in here except html() returning a string — the Node harness loads it.
*/
(function () {
  "use strict";
  const C = (typeof window !== "undefined" ? window : globalThis).MMTQCore;
  const CHECK = C.CHECK;
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+", "ⁿ": "n", "ˣ": "x" };
  const FUNCS = ["sqrt", "cbrt", "sin", "cos", "tan", "log", "ln"];

  /* ---------------- tokens ---------------- */
  function normalise(raw) {
    let s = String(raw == null ? "" : raw).normalize("NFC");
    s = s.replace(/[−–—]/g, "-").replace(/[×·•∙]/g, "*").replace(/÷/g, "/").replace(/√/g, " sqrt ").replace(/∛/g, " cbrt ").replace(/π/g, " pi ")
      .replace(/≤|=<|<=/g, "≤").replace(/≥|=>|>=/g, "≥").replace(/\+\s*-|\+\/-|\+-/g, "±").replace(/ | | /g, " ");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿˣ]+/g, m => "^(" + m.split("").map(c => SUP[c]).join("") + ")");
    s = s.replace(/½/g, "(1/2)").replace(/¼/g, "(1/4)").replace(/¾/g, "(3/4)").replace(/⅓/g, "(1/3)").replace(/⅔/g, "(2/3)");
    s = s.replace(/(\d) (?=\d{3}(?!\d))/g, "$1");            // 12 500 → 12500
    return s;
  }
  function tokens(raw) {
    const s = normalise(raw), out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const t = s.slice(i, j); if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null; out.push({ t: "num", v: Number(t), raw: t }); i = j; continue; }
      if (/[A-Za-zθαβΔ]/.test(c)) {
        let j = i; while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
        const w = s.slice(i, j) || c; const lw = w.toLowerCase();
        if (lw === "pi") { out.push({ t: "sym", n: "π" }); i = j; continue; }
        const f = FUNCS.find(fn => lw.startsWith(fn));
        if (f) { out.push({ t: "fn", n: f }); i += f.length; continue; }
        out.push({ t: "sym", n: c }); i++; continue;               // every other letter is a pronumeral
      }
      if ("+-*/^(),±=<>≤≥_".includes(c)) { out.push({ t: c }); i++; continue; }
      if (c === "$" || c === "°" || c === "%") { i++; continue; }
      return null;
    }
    return out;
  }

  /* ---------------- parser ---------------- */
  /* nodes: num{v} sym{n} add{a:[{s:1|-1|"pm",e}]} mul{f:[]} div{n,d} pow{b,e} neg{e} fn{n,a,base?} */
  const N = v => ({ t: "num", v });
  function parseTokens(tk) {
    let p = 0;
    const peek = () => tk[p], eat = t => (tk[p] && tk[p].t === t ? tk[p++] : null);
    const startsPrimary = t => t && (t.t === "num" || t.t === "sym" || t.t === "fn" || t.t === "(");
    function expr() {
      const a = []; let s = 1;
      if (eat("-")) s = -1; else if (eat("±")) s = "pm"; else eat("+");
      let e = term(); if (!e) return null; a.push({ s, e });
      for (;;) {
        const t = peek(); if (!t || !(t.t === "+" || t.t === "-" || t.t === "±")) break; p++;
        e = term(); if (!e) return null; a.push({ s: t.t === "+" ? 1 : t.t === "-" ? -1 : "pm", e });
      }
      if (a.length === 1) return a[0].s === 1 ? a[0].e : a[0].s === -1 ? { t: "neg", e: a[0].e } : { t: "add", a };
      return { t: "add", a };
    }
    function term() {
      let left = factor(); if (!left) return null;
      let f = [left];
      const wrap = () => (f.length === 1 ? f[0] : { t: "mul", f });
      for (;;) {
        const t = peek(); if (!t) break;
        if (t.t === "*") { p++; const r = signed(); if (!r) return null; f.push(r); continue; }
        if (t.t === "/") {
          p++; const r = signed(); if (!r) return null;
          // "1/2x" is read as ½x: a number over a number takes only the number
          const last = f[f.length - 1];
          if (last.t === "num" && r.t === "num") { f[f.length - 1] = { t: "div", n: last, d: r }; continue; }
          const n = wrap(); f = [{ t: "div", n, d: r }]; continue;
        }
        if (startsPrimary(t)) { const r = factor(); if (!r) return null; f.push(r); continue; }
        break;
      }
      return wrap();
    }
    function signed() { if (eat("-")) { const e = factor(); return e ? { t: "neg", e } : null; } eat("+"); return factor(); }
    function factor() {
      const b = primary(); if (!b) return null;
      if (eat("^")) {
        let e;
        if (eat("-")) { const x = primary(); if (!x) return null; e = { t: "neg", e: x }; }
        else { e = primary(); if (!e) return null; }
        return { t: "pow", b, e };
      }
      return b;
    }
    function primary() {
      const t = peek(); if (!t) return null;
      if (t.t === "num") { p++; return N(t.v); }
      if (t.t === "sym") { p++; return { t: "sym", n: t.n }; }
      if (t.t === "(") { p++; const e = expr(); if (!e || !eat(")")) return null; return { t: "grp", e }; }
      if (t.t === "fn") {
        p++; let base = null;
        if (t.n === "log" && eat("_")) { const b = primary(); if (!b) return null; base = b; }
        else if (t.n === "log" && peek() && peek().t === "num" && tk[p + 1] && tk[p + 1].t === "(") { base = N(tk[p].v); p++; }
        const a = factor(); if (!a) return null;       // √54, √x³, sqrt(x + 1), sin 30
        return { t: "fn", n: t.n, a, base };
      }
      return null;
    }
    const e = expr();
    return e && p === tk.length ? strip(e) : null;
  }
  /* brackets are kept only as far as the tree shape; drop the grp wrappers */
  function strip(n) {
    switch (n.t) {
      case "grp": return strip(n.e);
      case "add": return { t: "add", a: n.a.map(x => ({ s: x.s, e: strip(x.e) })) };
      case "mul": return { t: "mul", f: n.f.map(strip) };
      case "div": return { t: "div", n: strip(n.n), d: strip(n.d) };
      case "pow": return { t: "pow", b: strip(n.b), e: strip(n.e) };
      case "neg": return { t: "neg", e: strip(n.e) };
      case "fn": return { t: "fn", n: n.n, a: strip(n.a), base: n.base ? strip(n.base) : null };
      default: return n;
    }
  }
  function parse(raw) { const tk = tokens(raw); if (!tk || !tk.length) return null; if (tk.some(t => "=<>≤≥,".includes(t.t))) return null; try { return parseTokens(tk); } catch (e) { return null; } }

  /* ---------------- evaluate ---------------- */
  function ev(n, env, pm) {
    switch (n.t) {
      case "num": return n.v;
      case "sym": return n.n === "π" ? Math.PI : (n.n in env ? env[n.n] : NaN);
      case "neg": return -ev(n.e, env, pm);
      case "add": return n.a.reduce((s, x) => s + (x.s === "pm" ? pm : x.s) * ev(x.e, env, pm), 0);
      case "mul": return n.f.reduce((s, x) => s * ev(x, env, pm), 1);
      case "div": return ev(n.n, env, pm) / ev(n.d, env, pm);
      case "pow": { const b = ev(n.b, env, pm), e = ev(n.e, env, pm); if (b < 0 && !Number.isInteger(e)) { const r = Math.round(1 / e); return Math.abs(1 / e - r) < 1e-9 && r % 2 ? -Math.pow(-b, e) : NaN; } return Math.pow(b, e); }
      case "fn": { const a = ev(n.a, env, pm);
        if (n.n === "sqrt") return a < 0 ? NaN : Math.sqrt(a); if (n.n === "cbrt") return Math.cbrt(a);
        if (n.n === "sin") return Math.sin(a * Math.PI / 180); if (n.n === "cos") return Math.cos(a * Math.PI / 180); if (n.n === "tan") return Math.tan(a * Math.PI / 180);
        if (n.n === "ln") return Math.log(a); if (n.n === "log") return Math.log(a) / Math.log(n.base ? ev(n.base, env, pm) : 10); return NaN; }
    }
    return NaN;
  }
  function symbols(n, out = new Set()) {
    if (!n) return out;
    if (n.t === "sym") { if (n.n !== "π") out.add(n.n); }
    else if (n.t === "add") n.a.forEach(x => symbols(x.e, out));
    else if (n.t === "mul") n.f.forEach(x => symbols(x, out));
    else if (n.t === "div") { symbols(n.n, out); symbols(n.d, out); }
    else if (n.t === "pow") { symbols(n.b, out); symbols(n.e, out); }
    else if (n.t === "neg") symbols(n.e, out);
    else if (n.t === "fn") { symbols(n.a, out); if (n.base) symbols(n.base, out); }
    return out;
  }
  const hasPM = n => !!n && (n.t === "add" ? n.a.some(x => x.s === "pm" || hasPM(x.e)) : n.t === "mul" ? n.f.some(hasPM) : n.t === "div" ? hasPM(n.n) || hasPM(n.d) : n.t === "pow" ? hasPM(n.b) || hasPM(n.e) : n.t === "neg" || n.t === "fn" ? hasPM(n.t === "fn" ? n.a : n.e) : false);
  /* fixed sample points: positive, not whole, so roots and divisions behave */
  const PTS = [[1.37, 2.11, 0.83, 1.91, 2.57, 1.19], [2.23, 1.31, 1.73, 0.71, 1.13, 2.89], [0.61, 1.87, 2.41, 1.29, 0.93, 1.61], [3.17, 0.77, 1.43, 2.63, 1.83, 0.67], [1.79, 2.71, 0.59, 1.51, 2.29, 1.07], [2.83, 1.17, 2.03, 0.89, 1.39, 2.21]];
  function envs(names, shift = 0) { const v = [...names].sort(); return PTS.map(row => { const e = {}; v.forEach((n, i) => { e[n] = row[i % row.length] + 0.137 * Math.floor(i / row.length) + shift; }); return e; }); }
  const close = (a, b, tol = 1e-8) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  /* "same" | "near" (within ½%: a rounded decimal for an exact value) | "diff" */
  function compare(a, b, shift = 0) {
    const es = envs(new Set([...symbols(a), ...symbols(b)]), shift); let n = 0, near = true, same = true;
    for (const pm of hasPM(a) || hasPM(b) ? [1, -1] : [1]) for (const e of es) {
      const x = ev(a, e, pm), y = ev(b, e, pm);
      if (!isFinite(x) && !isFinite(y)) continue;
      if (!isFinite(x) || !isFinite(y)) return "diff";
      n++; if (!close(x, y)) same = false; if (Math.abs(x - y) > 0.006 * Math.max(0.5, Math.abs(y))) near = false;
    }
    if (n < 2) return shift ? "diff" : compare(a, b, 5.3);      // roots of negatives at the small points: try larger ones
    return same ? "same" : near ? "near" : "diff";
  }

  /* ---------------- shape ---------------- */
  const unneg = n => (n.t === "neg" ? unneg(n.e) : n);
  const termsOf = n => (n.t === "add" ? n.a.map(x => x.e) : [n]);
  const factorsOf = n => { n = unneg(n); return n.t === "mul" ? n.f.flatMap(factorsOf) : [n]; };
  function walk(n, fn) { fn(n); if (n.t === "add") n.a.forEach(x => walk(x.e, fn)); else if (n.t === "mul") n.f.forEach(x => walk(x, fn)); else if (n.t === "div") { walk(n.n, fn); walk(n.d, fn); } else if (n.t === "pow") { walk(n.b, fn); walk(n.e, fn); } else if (n.t === "neg") walk(n.e, fn); else if (n.t === "fn") walk(n.a, fn); }
  const any = (n, pred) => { let hit = false; walk(n, x => { if (pred(x)) hit = true; }); return hit; };
  /* how many numbers and letters it is written with (an index of 1, a coefficient of 1 are not written) */
  function leaves(n) { let k = 0; walk(n, x => { if (x.t === "num" || x.t === "sym") k++; }); return k; }
  const isSum = n => unneg(n).t === "add";
  /* a bracket still to expand: a sum multiplied by something, or raised to a power */
  const unexpanded = n => any(n, x => (x.t === "mul" && x.f.filter(f => isSum(f)).length >= 1 && x.f.length >= 2) || (x.t === "pow" && isSum(x.b)) || (x.t === "neg" && false));
  /* whole-number coefficient of a term (1 if none written); null when it is not a whole number */
  function coeff(term) {
    let c = 1, t = term; while (t.t === "neg") { c = -c; t = t.e; }
    for (const f of (t.t === "mul" ? t.f : [t])) { if (f.t === "num") c *= f.v; else if (f.t === "neg" && f.e.t === "num") c *= -f.e.v; else if (f.t === "div" && f.n.t === "num" && f.d.t === "num") c *= f.n.v / f.d.v; }
    return c;
  }
  function symsOfTerm(term) { const s = new Set(); for (const f of factorsOf(term)) { if (f.t === "sym") s.add(f.n); else if (f.t === "pow" && f.b.t === "sym" && !(f.e.t === "neg")) s.add(f.b.n); } return s; }
  /* a sum whose terms still share a whole-number factor or a pronumeral */
  function sharesFactor(sum) {
    const ts = termsOf(unneg(sum)); if (ts.length < 2) return false;
    const cs = ts.map(coeff);
    if (cs.every(c => Number.isInteger(c) && c !== 0)) { const g = cs.reduce((a, b) => C.gcd(a, b)); if (g > 1) return true; }
    const sets = ts.map(symsOfTerm); return [...sets[0]].some(v => v !== "π" && sets.every(s => s.has(v)));
  }
  /* bracket factors, with (x + 2)² counted twice */
  function sumFactors(n) { const out = []; for (const f of factorsOf(n)) { if (isSum(f)) out.push(f); else if (f.t === "pow" && isSum(f.b) && f.e.t === "num" && Number.isInteger(f.e.v)) for (let i = 0; i < f.e.v; i++) out.push(f.b); else if (f.t === "div") sumFactors(f.n).forEach(x => out.push(x)); } return out; }
  const letterFactors = n => { const s = new Set(); for (const f of factorsOf(n)) { if (f.t === "sym") s.add(f.n); else if (f.t === "pow" && f.b.t === "sym") s.add(f.b.n); } return s.size; };
  const topFraction = n => { n = unneg(n); return n.t === "div" ? n : null; };
  /* a fraction that still cancels: top and bottom share a whole-number factor or a pronumeral */
  function cancels(fr) {
    const tn = termsOf(unneg(fr.n)), td = termsOf(unneg(fr.d));
    const cs = tn.concat(td).map(coeff);
    if (cs.every(c => Number.isInteger(c) && c !== 0)) { const g = cs.reduce((a, b) => C.gcd(a, b)); if (g > 1) return true; }
    const sets = tn.concat(td).map(symsOfTerm); return [...sets[0]].some(v => v !== "π" && sets.every(s => s.has(v)));
  }

  /* ---------------- set out as maths ---------------- */
  const E = C.esc;
  const numH = v => C.fmt(Math.abs(v), 10).replace(/,/g, "") ;
  function html(n, ctx) {
    switch (n.t) {
      case "num": return (n.v < 0 ? "−" : "") + numH(n.v);
      case "sym": return n.n === "π" ? "π" : `<i>${E(n.n)}</i>`;
      case "neg": { const inner = html(n.e, "neg"); return "−" + (n.e.t === "add" ? `(${inner})` : inner); }
      case "add": return n.a.map((x, i) => { const h = html(x.e, "term"), w = x.e.t === "add" ? `(${h})` : h; const sg = x.s === "pm" ? "±" : x.s === 1 ? "+" : "−"; return i === 0 ? (x.s === 1 ? w : sg + w) : ` ${sg} ${w}`; }).join("");
      case "mul": return n.f.map((x, i) => { let h = html(x, "fac"); if (x.t === "add" || (x.t === "neg" && i > 0)) h = `(${h})`; const prev = n.f[i - 1];
        const needTimes = i > 0 && ((x.t === "num") || (x.t === "div" && prev && prev.t !== "add") || (x.t === "pow" && x.b.t === "num") || (prev && prev.t === "fn" && x.t !== "add")); return (needTimes ? " × " : "") + h; }).join("");
      case "div": return `<span class="fr"><span class="frn">${html(n.n)}</span><span class="frd">${html(n.d)}</span></span>`;
      case "pow": { let b = html(n.b); if (["add", "mul", "div", "neg", "fn"].includes(n.b.t) || (n.b.t === "num" && n.b.v < 0)) b = `(${b})`; return `${b}<sup>${html(n.e, "exp").replace(/<span class="fr"><span class="frn">(.*?)<\/span><span class="frd">(.*?)<\/span><\/span>/g, "$1/$2")}</sup>`; }
      // a radical is drawn (a tick and a bar), not typed: the √ glyph sits differently in every maths font
      case "fn": if (n.n === "sqrt" || n.n === "cbrt") return `<span class="rt">${n.n === "cbrt" ? '<sup class="rti">3</sup>' : ""}<svg class="rtk" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0.6 12.2 L3 11 L5.6 18.6 L10 0.9"/></svg><span class="rad">${html(n.a)}</span></span>`;
        return `${n.n}${n.base ? `<sub>${html(n.base)}</sub>` : ""}${n.a.t === "num" || n.a.t === "sym" ? " " + html(n.a) : `(${html(n.a)})`}`;
    }
    return "";
  }

  /* ---------------- CHECK.expr ---------------- */
  const HOW = "Use ^ for an index (x^2), / for a fraction and brackets round a top or bottom with more than one term.";
  function exprCheck(q, raw) {
    const want = q._tree || (q._tree = parse(q.expr));
    const s = String(raw == null ? "" : raw).trim().replace(/^[A-Za-z]\s*=\s*(?=.)/, m => (q.allowLhs ? "" : m));
    if (!s) return { nudge: "Type your answer." };
    const got = parse(s);
    if (!got) return { nudge: /=/.test(s) ? "Type just the expression — no equals sign." : "I can't read that. " + HOW };
    const extra = [...symbols(got)].filter(v => !symbols(want).has(v));
    if (extra.length && symbols(want).size) return { nudge: `This question uses ${[...symbols(want)].join(", ")} — check the letter${extra.length > 1 ? "s" : ""} you typed (${extra.join(", ")}).` };
    const cmp = compare(got, want);
    if (cmp === "near" && !q.approx) return { nudge: q.exactHint || "Close — but give the exact value, not a rounded decimal." };
    if (cmp !== "same" && !(q.approx && cmp === "near")) return { ok: false };
    const f = q.form || "simplify";
    if (f === "expand") {
      if (unexpanded(got)) return { nudge: "Right so far — now expand every bracket." };
      if (termsOf(got).length > termsOf(want).length) return { nudge: "Right — now collect the like terms." };
    } else if (f === "factor") {
      if (isSum(got)) return { nudge: unexpanded(got) ? "That is equal, but it is not one product yet — keep factorising." : "That is the expanded form — write it as a product, with brackets." };
      const sg = sumFactors(got), sw = sumFactors(want);
      if (sg.some(sharesFactor) || sg.length < sw.length || (sg.length === sw.length && letterFactors(got) < letterFactors(want))) return { nudge: "Equal, but not fully factorised — there is still a common factor to take out, or a bracket that factorises again." };
      if (any(got, x => x.t === "div") && !any(want, x => x.t === "div")) return { nudge: "Factorise without fractions." };
    } else if (f === "simplify") {
      if (unexpanded(got) && !unexpanded(want)) return { nudge: "Right — now expand and simplify." };
      const fr = topFraction(got);
      if (fr && cancels(fr)) return { nudge: "Right value — now cancel the common factor to simplify fully." };
      if (leaves(got) > leaves(want) + (q.slack || 0)) return { nudge: q.simplifyHint || "That is equal, but it can be written more simply." };
    }
    if (q.posIndex && any(got, x => x.t === "pow" && (x.e.t === "neg" || (x.e.t === "num" && x.e.v < 0)))) return { nudge: "Write your answer with positive indices only." };
    if (q.noFraction && any(got, x => x.t === "div")) return { nudge: "Write your answer without a fraction — use a negative index." };
    if (q.ratDenom && any(got, x => x.t === "div" && any(x.d, y => y.t === "fn"))) return { nudge: "There is still a root in the denominator." };
    if (q.noRoot && any(got, x => x.t === "fn" && (x.n === "sqrt" || x.n === "cbrt"))) return { nudge: "Write it in index form — no root sign." };
    if (q.power) { const g = unneg(got); if (!(g.t === "pow" && g.b.t !== "pow") && !(g.t === "num" || g.t === "sym")) return { nudge: "Write your answer as a single power, like 2^5." }; if (q.base != null && g.t === "pow" && !(g.b.t === "num" && g.b.v === q.base)) return { nudge: `Write it as a power of ${q.base}.` }; if (q.base != null && g.t === "num" && g.v !== q.base && g.v !== 1) return { nudge: `Write it as a power of ${q.base}.` }; }
    if (q.sci) { const g = got.t === "neg" ? got.e : got; const fs = g.t === "mul" ? g.f : [g]; const co = fs.length === 2 ? fs[0] : fs.length === 1 && fs[0].t === "pow" ? N(1) : null; const pw = fs[fs.length - 1];
      const okPow = pw.t === "pow" && pw.b.t === "num" && pw.b.v === 10 && (pw.e.t === "num" || (pw.e.t === "neg" && pw.e.e.t === "num"));
      if (!co || co.t !== "num" || !okPow || fs.length > 2) return { nudge: "Right value — now write it in scientific notation, like 3.2 × 10^5." };
      if (!(co.v >= 1 && co.v < 10)) return { nudge: "In scientific notation the first number is at least 1 and less than 10." }; }
    if (q.entire) { const g = unneg(got); if (!(g.t === "fn" && g.n === "sqrt")) return { nudge: "Write it as one root: √ of a single number." }; }
    if (q.surd && any(got, x => x.t === "fn" && x.n === "sqrt" && x.a.t === "num" && squareFactor(x.a.v))) return { nudge: "Right value — now simplify the surd fully." };
    return { ok: true };
  }
  function squareFactor(v) { if (!Number.isInteger(v) || v < 4) return false; for (let i = 2; i * i <= v; i++) if (v % (i * i) === 0) return true; return false; }
  CHECK.expr = exprCheck;

  /* ---------------- CHECK.eqn ---------------- */
  function splitEq(raw) { const s = normalise(raw); const parts = s.split("="); if (parts.length !== 2) return null; const l = parse(parts[0]), r = parse(parts[1]); return l && r ? { l, r } : null; }
  CHECK.eqn = (q, raw) => {
    const want = q._eq || (q._eq = splitEq(q.eqn));
    const s = String(raw == null ? "" : raw).trim();
    if (!s) return { nudge: "Type your answer." };
    if (!/=/.test(s)) return { nudge: `Write an equation, like ${q.example || "y = 2x + 3"}.` };
    const got = splitEq(s);
    if (!got) return { nudge: "I can't read that equation. " + HOW };
    const all = new Set([...symbols(want.l), ...symbols(want.r)]);
    const extra = [...symbols(got.l), ...symbols(got.r)].filter(v => !all.has(v));
    if (extra.length) return { nudge: `This question uses ${[...all].join(", ")} — check the letters you typed.` };
    const pms = hasPM(want.l) || hasPM(want.r) || hasPM(got.l) || hasPM(got.r) ? [1, -1] : [1];
    const sub = q.subject || (q.form === "subject" ? "y" : null);
    let same = false;
    const wIsSub = sub && want.l.t === "sym" && want.l.n === sub && !symbols(want.r).has(sub);
    if (wIsSub) {
      // answer is  sub = f(…): the student's equation must hold wherever sub takes that value
      for (const shift of [0, 5.3]) {
        let n = 0, ok = true;
        for (const pm of pms) for (const e of envs(all, shift)) { const v = ev(want.r, e, pm); if (!isFinite(v)) continue; const e2 = Object.assign({}, e, { [sub]: v }); const a = ev(got.l, e2, pm), b = ev(got.r, e2, pm); if (!isFinite(a) || !isFinite(b)) continue; n++; if (!close(a, b, 1e-7)) ok = false; }
        if (n >= 2) { same = ok; break; }
      }
      // …and must not be true for every value (x = x)
      if (same) { const e = envs(all)[0]; e[sub] = (ev(want.r, e, 1) || 1) + 1.234; const a = ev(got.l, e, 1), b = ev(got.r, e, 1); if (isFinite(a) && isFinite(b) && close(a, b, 1e-7)) same = false; }
    } else {
      // the same equation rearranged: (L − R) of one is a constant multiple of the other's
      let k = null, n = 0, ok = true, zeroMismatch = 0;
      for (const pm of pms) for (const e of envs(all)) {
        const a = ev(got.l, e, pm) - ev(got.r, e, pm), b = ev(want.l, e, pm) - ev(want.r, e, pm);
        if (!isFinite(a) || !isFinite(b)) continue;
        if (Math.abs(b) < 1e-9) { if (Math.abs(a) > 1e-7) zeroMismatch++; continue; }
        const r = a / b; n++; if (k == null) k = r; else if (!close(r, k, 1e-7)) ok = false;
      }
      same = n >= 2 && ok && k != null && Math.abs(k) > 1e-9 && !zeroMismatch;
    }
    if (!same) return { ok: false };
    if (sub) {
      const lhsIs = got.l.t === "sym" && got.l.n === sub, rhsIs = got.r.t === "sym" && got.r.n === sub;
      const other = lhsIs ? got.r : rhsIs ? got.l : null;
      if (!other || symbols(other).has(sub)) return { nudge: `Right line — now make ${sub} the subject: ${sub} = …`.replace("Right line", q.rightWord || "Right") };
      if (q.simplify !== false && unexpanded(other) && !unexpanded(want.r)) return { nudge: "Right — now expand the brackets and simplify." };
    }
    if (q.form === "general") {
      const zeroR = got.r.t === "num" && got.r.v === 0, zeroL = got.l.t === "num" && got.l.v === 0;
      const side = zeroR ? got.l : zeroL ? got.r : null;
      if (!side) return { nudge: "Right line — now write it in general form: ax + by + c = 0." };
      if (any(side, x => x.t === "div" || (x.t === "num" && !Number.isInteger(x.v)))) return { nudge: "In general form the numbers are whole — multiply through to clear the fractions." };
      if (unexpanded(side)) return { nudge: "Expand the brackets to finish the general form." };
      const cs = termsOf(side).map(coeff); if (cs.every(Number.isInteger) && cs.length > 1 && cs.reduce((a, b) => C.gcd(a, b)) > 1) return { nudge: "Right line — now divide through by the common factor." };
    }
    return { ok: true };
  };

  /* ---------------- CHECK.set ---------------- */
  function parseList(raw, v) {
    let s = normalise(raw).replace(/\b(or|and)\b/gi, ",").replace(/;/g, ",");
    if (v) s = s.replace(new RegExp("\\b" + v + "\\s*[=≈]", "g"), "");
    s = s.replace(/[A-Za-z]\s*=\s*/g, "").replace(/≈/g, "");
    const out = [];
    for (const part of s.split(",")) { if (!part.trim()) continue; const t = parse(part); if (!t || symbols(t).size) return null; if (hasPM(t)) { out.push(ev(t, {}, 1), ev(t, {}, -1)); } else out.push(ev(t, {}, 1)); }
    return out.every(isFinite) ? out : null;
  }
  CHECK.set = (q, raw) => {
    const want = q._vals || (q._vals = parseList(q.values.join(", "), q.v));
    if (!String(raw == null ? "" : raw).trim()) return { nudge: "Type your answer." };
    const got = parseList(raw, q.v);
    if (!got) return { nudge: `Type the value${want.length > 1 ? "s, with a comma between them" : ""} — like ${q.example || (want.length > 1 ? "−4, 7" : "5")}.` };
    const tol = q.tol != null ? q.tol : 1e-9;
    const uniq = arr => arr.filter((x, i) => arr.findIndex(y => Math.abs(x - y) <= 1e-9) === i);
    const g = uniq(got), w = uniq(want);
    const match = (a, b, t) => a.length === b.length && a.every(x => b.some(y => Math.abs(x - y) <= t + 1e-9 * Math.max(1, Math.abs(y))));
    if (match(g, w, tol)) return { ok: true };
    if (tol < 1e-6 && match(g, w, 0.006)) return { nudge: "Close — but give exact answers (use the √ key), not rounded decimals." };
    return { ok: false };
  };

  /* ---------------- CHECK.ineq ---------------- */
  CHECK.ineq = (q, raw) => {
    const s = normalise(raw).trim(); if (!s) return { nudge: "Type your answer." };
    const m = /^(.+?)\s*(≤|≥|<|>)\s*(.+)$/.exec(s);
    if (!m) return { nudge: `Write an inequality, like ${q.v} ≥ 3. Use the < > ≤ ≥ keys.` };
    let l = parse(m[1]), r = parse(m[3]), op = m[2];
    if (!l || !r) return { nudge: `Write an inequality, like ${q.v} ≥ 3.` };
    const flip = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
    if (!(l.t === "sym" && l.n === q.v)) { if (r.t === "sym" && r.n === q.v) { [l, r] = [r, l]; op = flip[op]; } else return { nudge: `Finish with ${q.v} on its own, like ${q.v} ≥ 3.` }; }
    if (symbols(r).size) return { nudge: `Finish with ${q.v} on its own.` };
    return { ok: op === q.op && close(ev(r, {}, 1), q.value, 1e-9) };
  };

  /* ---------------- CHECK.multi ---------------- */
  CHECK.multi = (q, inputs) => {
    const parts = [];
    for (let i = 0; i < q.fields.length; i++) {
      const f = q.fields[i], v = inputs ? inputs[i] : null;
      if (f.q.mode !== "mc" && !String(v == null ? "" : v).trim()) return { nudge: "Fill in every box first — or press Skip." };
      if (f.q.mode === "mc" && v == null) return { nudge: "Choose an option for every part first." };
      const r = C.check(f.q, v);
      if (r.nudge) return { nudge: (f.name ? f.name + ": " : "") + r.nudge, field: i };
      parts.push(!!r.ok);
    }
    return { ok: parts.every(Boolean), parts };
  };

  /* A very small answer (7.2 × 10⁻⁷ written as a basic numeral) is marked to its own size: core's
     nine-decimal-place tolerance would accept 0, or a number ten times too small. */
  const num0 = CHECK.num;
  CHECK.num = (q, raw) => {
    if (q.tol == null && q.dp == null && q.value !== 0 && Math.abs(q.value) < 1e-3 && !(q.alts && q.alts.length)) {
      raw = String(raw == null ? "" : raw).replace(/(\d)\s+(?=\d)/g, "$1");      // 0.000 000 97
      const v = C.parseNumber ? C.parseNumber(raw) : Number(String(raw).replace(/[−–]/g, "-").replace(/[\s,]/g, ""));
      if (isNaN(v)) return { nudge: "Type a number." };
      return { ok: Math.abs(v - q.value) <= Math.abs(q.value) * 1e-6 };
    }
    return num0(q, raw);
  };

  /* what the typing was read as (shown under the box) */
  C.preview = (q, v) => {
    if (!String(v).trim()) return "";
    if (q.mode === "expr") { const t = parse(String(v).replace(/^[A-Za-z]\s*=\s*(?=.)/, m => (q.allowLhs ? "" : m))); return t ? html(t) : ""; }
    if (q.mode === "eqn") { const e = splitEq(v); return e ? `${html(e.l)} = ${html(e.r)}` : ""; }
    if (q.mode === "ineq") { const m = /^(.+?)\s*(≤|≥|<|>)\s*(.+)$/.exec(normalise(v)); if (!m) return ""; const l = parse(m[1]), r = parse(m[3]); return l && r ? `${html(l)} ${m[2]} ${html(r)}` : ""; }
    if (q.mode === "set") { const parts = normalise(v).replace(/\b(or|and)\b/gi, ",").replace(/;/g, ",").split(",").map(p => p.replace(/^\s*[A-Za-z]\s*=\s*/, "").trim()).filter(Boolean).map(p => parse(p)); return parts.length && parts.every(Boolean) ? parts.map(t => html(t)).join(", ") : ""; }
    return null;
  };
  C.alg = { parse, html, compare, ev, symbols, leaves, unexpanded, sumFactors, sharesFactor, parseList, splitEq, normalise, termsOf };
})();
