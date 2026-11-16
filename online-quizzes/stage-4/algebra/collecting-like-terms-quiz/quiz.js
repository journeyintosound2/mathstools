/* =====================================================================
   COLLECTING LIKE TERMS – BUBBLES — STUDENT QUIZ (2026-11-16)
   ---------------------------------------------------------------------
   The Number Groups quiz's pattern: the card on the left is ONE question
   and ONE answer; the panel on the right is the teaching tool's model.

   The model is the Bubbles tool itself, built from the question: each term
   is a bubble of pieces (3x = three x pieces, −2x = a red bubble of −x
   pieces, 5 × 7 = five 7 pieces). On Sweet and Mild the student can DRAG
   like bubbles together, drop a piece on its opposite to pop a zero pair,
   or press Show me ▸ for the next move. It is never marked and never
   required, and it never prints the answer: a bubble that has changed is
   captioned "?x" until the question is settled — the student counts the
   pieces. A wrong first answer plays every move to the end.

   The ladder:
     Sweet  two kinds of term, all added; numbers only (5 × 7 + 3 × 7 +
            2 × 5) beside letters; fill one box per kind; which can join?
     Mild   taking away and zero pairs; plain numbers (piles of 1s); a
            kind that cancels; the minus sign travels with its term
     Medium no model; type the whole answer; look-alikes (ab = ba);
            missing terms; three kinds; spot the mistake
     Spicy  x and x² stay apart; answers below zero; numbers only with three
            kinds; make your own expression

   Marking (as the other quizzes): only the FIRST check scores; Check again
   lets them fix it; an empty or unreadable check is free, and so is an
   answer that is equal but not yet collected; Next on an unanswered
   question counts it as wrong. Nothing typed is ever saved.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"collecting-like-terms-student-quiz", title:"Collecting Like Terms – Bubbles", mastery:"collecting-like-terms" };
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const X = "×", MINUS = "−";
const eqS = s => `<span class="eq">${s}</span>`;
const wait = ms => new Promise(r => setTimeout(r, reduceMotion || Q.fast ? 0 : ms));
const Q = { fast:false };

/* ---------------------------------------------------------- maths italics (as the tool) */
function mathItalic(str){
  let out = "";
  for(const ch of String(str)){
    const c = ch.codePointAt(0);
    if(ch === "h") out += "ℎ";
    else if(c >= 97 && c <= 122) out += String.fromCodePoint(0x1D44E + c - 97);
    else out += ch;
  }
  return out;
}
const MATH_ALPHA = (() => { try {
  const x = document.createElement("canvas").getContext("2d");
  x.font = '500 100px "Cambria Math","STIX Two Math","Latin Modern Math",serif';
  const a = x.measureText("\u{1D465}\u{1D44E}\u{1D44F}\u{1D450}").width, b = x.measureText("").width;
  return a > 0 && b > 0 && Math.abs(a - b) > 1;
} catch(e){ return false; } })();
const Lt = d => MATH_ALPHA ? `<span class="mi">${mathItalic(d)}</span>` : `<span class="mv">${esc(d)}</span>`;
const LtTxt = d => MATH_ALPHA ? mathItalic(d) : d;

/* ---------------------------------------------------------- what a key means
   x, ab, x² = letters; "1" = a plain number (a pile of ones); "n7" = groups of the number 7 */
const typeOf = k => k === "1" ? "one" : /^n\d+$/.test(k) ? "num" : "let";
const valOf = k => +k.slice(1);
const keyOf = d => d.includes("²") ? d : d.split("").sort().join("");
/* one term without its sign */
function bodyH(c, k, d){
  const t = typeOf(k);
  if(t === "one") return String(c);
  if(t === "num") return `${c} ${X} ${valOf(k)}`;
  return (c === 1 ? "" : String(c)) + Lt(d || k);
}
function bodyTxt(c, k, d){
  const t = typeOf(k);
  if(t === "one") return String(c);
  if(t === "num") return `${c} × ${valOf(k)}`;
  return (c === 1 ? "" : String(c)) + (d || k);
}
/* a list of terms {c, s, k, d}; a term with miss:true shows "?" (or a box) instead of its count */
function exprH(terms, box){
  if(!terms.length) return "0";
  return terms.map((t, i) => {
    const sg = i === 0 ? (t.s < 0 ? MINUS : "") : (t.s < 0 ? ` ${MINUS} ` : " + ");
    if(t.miss){ const ty = typeOf(t.k); return sg + (box || "?") + (ty === "num" ? ` ${X} ${valOf(t.k)}` : ty === "one" ? "" : Lt(t.d || t.k)); }
    return sg + bodyH(t.c, t.k, t.d);
  }).join("");
}
/* the collected answer, kinds in order of first appearance */
function collect(terms){
  const order = [], tot = {}, disp = {};
  terms.forEach(t => { if(!(t.k in tot)){ order.push(t.k); tot[t.k] = 0; disp[t.k] = t.d || t.k; } tot[t.k] += t.s * t.c; });
  return { order, tot, disp, list:order.filter(k => tot[k] !== 0).map(k => ({ k, d:disp[k], c:Math.abs(tot[k]), s:tot[k] < 0 ? -1 : 1 })) };
}
const grpW = (k, d, n) => typeOf(k) === "one" ? (n === 1 ? "one" : "ones") : `${n === 1 ? "group" : "groups"} of ${typeOf(k) === "num" ? valOf(k) : Lt(d || k)}`;
const unitName = (k, d) => typeOf(k) === "one" ? "ones" : typeOf(k) === "num" ? `groups of ${valOf(k)}` : Lt(d || k) + "s";

/* ---------------------------------------------------------- numbers */
/* no i, l, o (they read as 1 and 0), no v (it sits next to w and u too easily), no e (it is a number in later years) */
const LETTERS = "abcdfghjkmnpqrstuwxyz".split("");
let USED = new Set();
function letter(avoid){
  avoid = avoid || [];
  for(let t = 0; t < 80; t++){
    const f = pick(LETTERS);
    if(avoid.some(a => a.includes(f))) continue;
    if(!USED.has("L" + f) || t > 50){ USED.add("L" + f); return f; }
  }
  return "x";
}
function pair(avoid){ const p = letter(avoid), q = letter((avoid || []).concat([p])); return [p, q]; }
function numG(lo, hi, avoid){
  avoid = avoid || [];
  for(let t = 0; t < 80; t++){ const g = R(lo, hi); if(g !== 10 && !avoid.includes(g) && (!USED.has("N" + g) || t > 50)){ USED.add("N" + g); return g; } }
  return R(lo, hi);
}
/* terms are dealt so that like terms are NOT side by side: finding them is half the job */
function scatter(list){
  let best = list;
  for(let t = 0; t < 80; t++){
    const a = shuffle(list);
    if(a[0].s < 0 && a.some(x => x.s > 0)) continue;
    if(!a.some((x, i) => i > 0 && a[i - 1].k === x.k)) return a;
    best = a;
  }
  if(best[0].s < 0){ const j = best.findIndex(x => x.s > 0); if(j > 0) [best[0], best[j]] = [best[j], best[0]]; }
  return best;
}
/* spec: [{k, d, n:[counts...], neg:[indexes taken away]}] -> scattered terms */
function deal(spec, keepOrder){
  const out = [];
  spec.forEach(sp => sp.n.forEach((c, i) => out.push({ k:sp.k, d:(sp.ds ? sp.ds[i % sp.ds.length] : sp.d) || sp.k, c, s:(sp.neg || []).includes(i) ? -1 : 1 })));
  return keepOrder ? out : scatter(out);
}
const L1 = k => ({ k, d:k });
const tot = terms => terms.reduce((a, t) => a + t.s * t.c, 0);

/* ---------------------------------------------------------- questions */
function base(level, o){
  return Object.assign({ level, model:level === "sweet" || level === "mild", settled:false, correct:false, q:"", tpl:null, working:"", ask:"", mt:null }, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:[], marks:null, fixText:null, sel:null }, o); }
function why1(terms, k){
  const like = terms.filter(t => t.k === k);
  const s = like.map((t, i) => (i ? (t.s < 0 ? ` ${MINUS} ` : " + ") : (t.s < 0 ? MINUS : "")) + t.c).join("");
  return `${s} = ${tot(like)}`;
}
/* collect, one answer box per kind: 3x + 2y + 4x = [ ]x + [ ]y */
function qBoxes(level, terms, o){
  const C = collect(terms);
  const it = base(level, Object.assign({ mt:terms }, o));
  const take = terms.some(t => t.s < 0), many = C.order.length > 1, nums = typeOf(C.order[0]) === "num";
  it.q = nums ? "Collect the groups of the same number." : take ? "Collect the like terms. Some are taken away." : "Collect the like terms.";
  /* one box per kind, said in words: [ ] groups of x + [ ] groups of y — and the line under it puts
     whatever is typed back together, so the answer is visibly all the kinds collected */
  it.tpl = [exprH(terms) + " ="];
  it.grp = C.order.map(k => ({ k, d:C.disp[k] }));
  const ans = C.order.map(k => C.tot[k]);
  it.steps = [ step("nums", { cat:take ? "take" : many ? (nums ? "numbers" : "unlike") : "collect", ans,
    why:() => C.order.map(k => `${eqS(why1(terms, k))} ${grpW(k, C.disp[k], Math.abs(C.tot[k]))}`).join("; ") + `, so it is ${eqS(exprH(C.list))}.` }) ];
  return it;
}
/* numbers only, worked out: collect the groups first, then multiply once for each kind */
function qValue(level, terms){
  const C = collect(terms);
  const it = base(level, { mt:terms });
  it.q = "Work it out. Collect the groups first &mdash; it saves multiplying.";
  it.tpl = [exprH(terms) + " =", { in:0 }];
  const v = C.order.reduce((a, k) => a + C.tot[k] * valOf(k), 0);
  const short = C.order.map(k => `${C.tot[k]} ${X} ${valOf(k)}`).join(" + ");
  const parts = C.order.map(k => C.tot[k] * valOf(k)).join(" + ");
  it.steps = [ step("num", { cat:"value", ans:[v], why:() => `Collect first: ${eqS(short)} = ${eqS(parts)} = ${eqS(String(v))}. ${C.order.length} multiplication${C.order.length === 1 ? "" : "s"} instead of ${terms.length}.` }) ];
  return it;
}
/* the whole answer typed in, any order */
function qExpr(level, terms, o){
  const C = collect(terms);
  const it = base(level, Object.assign({ mt:terms }, o));
  it.q = "Simplify by collecting like terms.";
  it.tpl = [exprH(terms) + " =", { in:0, wide:true }];
  const answer = exprH(C.list.map(x => ({ c:x.c, s:x.s, k:x.k, d:x.d })));
  const cancels = C.order.some(k => C.tot[k] === 0);
  const neg = C.order.some(k => C.tot[k] < 0);
  it.steps = [ step("expr", { cat:cancels ? "zero" : neg ? "below" : C.order.length > 1 ? "unlike" : "collect", ans:C.tot,
    why:() => C.order.map(k => `${eqS(why1(terms, k))} ${grpW(k, C.disp[k], Math.abs(C.tot[k]))}`).join("; ") + `. So it is ${eqS(answer)}.` }) ];
  it.answerTxt = answer;
  return it;
}
/* a missing count: 4x + [ ]x − 2x + 3y = 7x + 3y */
function qMissing(level, terms, at){
  const it = base(level);
  const mk = terms[at].k, like = terms.filter(t => t.k === mk), ans = terms[at].c, C = collect(terms);
  it.q = "Find the missing number.";
  const mt = terms[at];
  const pre = exprH(terms.slice(0, at)) + (at === 0 ? (mt.s < 0 ? MINUS : "") : (mt.s < 0 ? ` ${MINUS}` : " +"));
  const ty = typeOf(mk);
  const rest = terms.slice(at + 1).map(t => (t.s < 0 ? ` ${MINUS} ` : " + ") + bodyH(t.c, t.k, t.d)).join("");
  const post = (ty === "num" ? `${X} ${valOf(mk)}` : ty === "one" ? "" : Lt(mt.d)) + rest + " = " + exprH(C.list);
  it.tpl = (at === 0 && mt.s > 0 ? [] : [pre]).concat([{ in:0 }, post]);
  const others = like.filter(t => t !== mt), oc = tot(others), n = C.tot[mk];
  const w = mt.s < 0 ? `The others make ${oc} and ${n} are left, so ${oc - n} were taken away.` : `${n} altogether and the others make ${oc}, so ${eqS(`${n} ${MINUS} ${oc < 0 ? "(" + MINUS + Math.abs(oc) + ")" : oc} = ${ans}`)}.`;
  it.steps = [ step("num", { cat:"missing", ans:[ans], why:() => w }) ];
  return it;
}
/* which bubble can join? */
function qLike(level, kind){
  const it = base(level);
  let target, opts, w;
  if(kind === "swap"){
    const [p, q] = pair(); const a = R(2, 7);
    target = `${a}${Lt(p + q)}`;
    opts = [ { h:eqS(`${R(2, 9)}${Lt(q + p)}`), ok:true }, { h:eqS(`${a}${Lt(p)}`), ok:false }, { h:eqS(`${a}${Lt(q)}`), ok:false }, { h:eqS(`${a}${Lt(p + "²")}`), ok:false } ];
    w = `${Lt(q + p)} means ${Lt(q)} ${X} ${Lt(p)}, which is the same as ${Lt(p)} ${X} ${Lt(q)}: they are like terms.`;
  } else if(kind === "power"){
    const p = letter(); const a = R(2, 7);
    target = `${a}${Lt(p + "²")}`;
    opts = [ { h:eqS(`${MINUS}${Lt(p + "²")}`), ok:true }, { h:eqS(`${a}${Lt(p)}`), ok:false }, { h:eqS(`${R(2, 9)}${Lt(p + "²" + letter([p]))}`), ok:false }, { h:eqS(String(a * 2)), ok:false } ];
    w = `Only groups of ${Lt(p + "²")} can join ${Lt(p + "²")}. ${Lt(p)} is a different size of group: ${Lt(p + "²")} means ${Lt(p)} ${X} ${Lt(p)}.`;
  } else {
    const p = letter(), q = letter([p]); const a = R(2, 7);
    target = `${a}${Lt(p)}`;
    opts = [ { h:eqS(`${R(2, 9)}${Lt(p)}`), ok:true }, { h:eqS(`${a}${Lt(q)}`), ok:false }, { h:eqS(String(a)), ok:false }, { h:eqS(`${a}${Lt([p, q].sort().join(""))}`), ok:false } ];
    w = `Like terms hold the same thing: only another bubble of ${Lt(p)}s can join ${eqS(target)}. The number in front can be different.`;
  }
  it.q = `Which bubble can join ${eqS(target)}?`;
  it.steps = [ step("mc", { cat:"like", opts:shuffle(opts), why:() => w }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
let NAMEBAG = [];
const nameOf = () => { if(!NAMEBAG.length) NAMEBAG = shuffle(NAMES); return NAMEBAG.pop(); };
/* a classic mistake to spot (the model, where there is one, is the left-hand side) */
function qMistake(level, kind){
  const nm = nameOf(), it = base(level);
  let opts, w;
  if(kind === "xy"){
    const [p, q] = pair(), a = R(2, 6), b = R(2, 6), pq = [p, q].sort().join("");
    it.mt = [{ c:a, s:1, k:p, d:p }, { c:b, s:1, k:q, d:q }];
    it.working = `${a}${Lt(p)} + ${b}${Lt(q)} = ${a + b}${Lt(pq)}`;
    opts = [ { h:`${Lt(p)} and ${Lt(q)} are unlike terms, so nothing joins: it stays ${eqS(`${a}${Lt(p)} + ${b}${Lt(q)}`)}`, ok:true },
             { h:`Nothing &mdash; that is right`, ok:false },
             { h:`It should be ${eqS(`${a * b}${Lt(pq)}`)}`, ok:false },
             { h:`It should be ${eqS(`${a + b}${Lt(p)}`)}`, ok:false } ];
    w = `A bubble of ${Lt(p)}s can't join a bubble of ${Lt(q)}s. Unlike terms stay apart: ${eqS(`${a}${Lt(p)} + ${b}${Lt(q)}`)}.`;
  } else if(kind === "square"){
    const p = letter(), a = R(2, 6), b = R(2, 6);
    it.mt = [{ c:a, s:1, k:p, d:p }, { c:b, s:1, k:p, d:p }];
    it.working = `${a}${Lt(p)} + ${b}${Lt(p)} = ${a + b}${Lt(p + "²")}`;
    opts = [ { h:`Joining adds the pieces, it doesn't multiply the ${Lt(p)}s: ${eqS(`${a + b}${Lt(p)}`)}`, ok:true },
             { h:`Nothing &mdash; that is right`, ok:false },
             { h:`It should be ${eqS(`${a * b}${Lt(p)}`)}`, ok:false },
             { h:`It should be ${eqS(`${a * b}${Lt(p + "²")}`)}`, ok:false } ];
    w = `${a} pieces of ${Lt(p)} and ${b} more is ${a + b} pieces of ${Lt(p)}: ${eqS(`${a + b}${Lt(p)}`)}. ${Lt(p + "²")} would be ${Lt(p)} ${X} ${Lt(p)}.`;
  } else if(kind === "sign"){
    const [p, q] = pair(), a = R(5, 9), b = R(2, 4), c = R(2, a - 2), d = R(1, b);
    const ts = [{ c:a, s:1, k:p, d:p }, { c:b, s:1, k:q, d:q }, { c, s:-1, k:p, d:p }, { c:d, s:-1, k:q, d:q }];
    it.mt = ts;
    const right = exprH(collect(ts).list), wrong = `${a + c}${Lt(p)} + ${b + d === 1 ? "" : b + d}${Lt(q)}`;
    it.working = `${exprH(ts)} = ${wrong}`;
    opts = [ { h:`The minus signs belong to their terms, so those are taken away: ${eqS(right)}`, ok:true },
             { h:`Nothing &mdash; that is right`, ok:false },
             { h:`It should be ${eqS(`${a - c}${Lt(p)} + ${b + d}${Lt(q)}`)}`, ok:false },
             { h:`It should be ${eqS(`${a + b + c + d}${Lt([p, q].sort().join(""))}`)}`, ok:false } ];
    w = `Each term moves with the sign in front of it: ${eqS(`${MINUS}${c}${Lt(p)}`)} is ${c} ${Lt(p)}s taken away. So it is ${eqS(right)}.`;
  } else {
    const p = letter(), a = R(4, 9);
    it.mt = [{ c:a, s:1, k:p, d:p }, { c:1, s:-1, k:p, d:p }];
    it.working = `${a}${Lt(p)} ${MINUS} ${Lt(p)} = ${a}`;
    opts = [ { h:`${Lt(p)} on its own is one ${Lt(p)}, so one piece goes: ${eqS(`${a - 1}${Lt(p)}`)}`, ok:true },
             { h:`Nothing &mdash; that is right`, ok:false },
             { h:`It should be ${eqS(String(a - 1))}`, ok:false },
             { h:`It should be ${eqS(`${a}${Lt(p)}`)}`, ok:false } ];
    w = `${eqS(`${a}${Lt(p)} ${MINUS} ${Lt(p)}`)} is ${a} ${Lt(p)}s take away one ${Lt(p)}: ${eqS(`${a - 1}${Lt(p)}`)}. The ${Lt(p)} doesn't disappear.`;
  }
  it.q = `${nm} wrote:`; it.ask = "What went wrong?";
  it.steps = [ step("mc", { cat:"mistake", opts:shuffle(opts), why:() => w }) ];
  return it;
}
/* make your own: four terms that simplify to 5x + 2y, with something taken away */
function qBuild(level){
  const [p, q] = pair(), a = R(3, 7), b = R(2, 5);
  const it = base(level);
  const target = `${a}${Lt(p)} + ${b}${Lt(q)}`;
  it.q = `Write an expression with <b>four</b> terms that simplifies to ${eqS(target)}. Take something away at least once.`;
  it.tpl = [{ in:0, wide:true }, "= " + target];
  it.steps = [ step("build", { cat:"build", want:{ [p]:a, [q]:b }, why:() => `For example ${eqS(`${a + 2}${Lt(p)} + ${b + 1}${Lt(q)} ${MINUS} 2${Lt(p)} ${MINUS} ${Lt(q)}`)}: the ${Lt(p)}s make ${a} and the ${Lt(q)}s make ${b}.` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Two kinds of term, all added. Groups of numbers (5 × 7 + 3 × 7 + 2 × 5) beside letters. The bubbles are there to drag together." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"Taking away and zero pairs, plain numbers, a kind that cancels, and the sign that travels with its term. The bubbles are still there." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"No bubbles. Type the whole answer. Three kinds of term, ab and ba, missing numbers and mistakes to spot." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"x and x² stay apart, answers below zero, numbers only with three kinds, and an expression of your own." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set(); NAMEBAG = [];
  const two = () => { const [p, q] = pair(); return [L1(p), L1(q)]; };
  if(level === "sweet"){
    const [a1, b1] = two(), [a2, b2] = two(), [a3, b3] = two();
    const g1 = numG(3, 9), g2 = numG(3, 9, [g1]), g3 = numG(3, 9), g4 = numG(3, 9, [g3]);
    const s = letter();
    return [
      qBoxes(level, deal([{ k:s, d:s, n:[R(2, 4), R(1, 3), R(2, 5)] }], true)),
      qBoxes(level, deal([{ ...a1, n:[R(2, 5), R(1, 4)] }, { ...b1, n:[R(2, 5), R(1, 3)] }])),
      qLike(level, "plain"),
      qBoxes(level, deal([{ k:"n" + g1, n:[R(2, 5), R(1, 4)] }, { k:"n" + g2, n:[R(2, 5)] }])),
      qBoxes(level, deal([{ ...a2, n:[R(2, 4), R(1, 3), R(2, 4)] }, { ...b2, n:[R(2, 5), R(1, 4)] }])),
      qValue(level, deal([{ k:"n" + numG(3, 9), n:[R(2, 5), R(1, 4), R(2, 4)] }], true)),
      qBoxes(level, deal([{ ...a3, n:[1, R(2, 5)] }, { ...b3, n:[R(2, 6), 1] }])),
      qLike(level, "plain"),
      qValue(level, deal([{ k:"n" + g3, n:[R(3, 5), R(2, 3), R(1, 3)] }, { k:"n" + g4, n:[R(2, 3), R(2, 4)] }])),
      qBoxes(level, deal([{ ...L1(letter()), n:[R(2, 4), R(2, 4), R(1, 3)] }, { ...L1(letter()), n:[R(2, 4), R(2, 4), R(1, 3)] }]))
    ];
  }
  if(level === "mild"){
    const [a1, b1] = two(), [a2, b2] = two(), [a3, b3] = two(), [a4, b4] = two();
    const s = letter(), cK = letter(), g1 = numG(3, 9), g2 = numG(3, 9, [g1]), g3 = numG(4, 12);
    const big = R(5, 8);
    return [
      qBoxes(level, deal([{ k:s, d:s, n:[big, R(1, big - 2), R(1, 4)], neg:[1] }], true)),
      qBoxes(level, deal([{ ...a1, n:[R(5, 8), R(1, 3)], neg:[1] }, { ...b1, n:[R(2, 5), R(1, 3)] }])),
      qBoxes(level, deal([{ k:cK, d:cK, n:[R(2, 5), R(1, 4)] }, { k:"1", n:[R(2, 6), R(1, 5)] }])),
      qExpr(level, (() => { const c = R(2, 6); return deal([{ ...a2, n:[c, c], neg:[1] }, { ...b2, n:[R(2, 6)] }]); })()),
      qMistake(level, "xy"),
      qBoxes(level, deal([{ k:"n" + g1, n:[R(5, 7), R(1, 3)], neg:[1] }, { k:"n" + g2, n:[R(2, 4), R(1, 3)] }])),
      qBoxes(level, deal([{ ...a3, n:[R(4, 7), R(1, 3)], neg:[1] }, { k:"1", n:[R(5, 8), R(1, 4)], neg:[1] }])),
      qMistake(level, "sign"),
      qExpr(level, deal([{ ...a4, n:[R(4, 7), R(1, 3)], neg:[1] }, { ...b4, n:[R(3, 6), R(1, 2)], neg:[1] }])),
      qValue(level, deal([{ k:"n" + g3, n:[R(4, 7), R(1, 3), R(2, 4)], neg:[1] }], true))
    ];
  }
  const nm = { model:false };
  if(level === "medium"){
    const [a1, b1] = two(), [a2, b2] = two(), [p, q] = pair(), [a3, b3] = two(), c3 = L1(letter([a3.k, b3.k]));
    const pq = p + q, qp = q + p;
    const miss = deal([{ ...a2, n:[R(3, 6), R(2, 5), R(1, 3)], neg:[2] }, { ...b2, n:[R(2, 6)] }]);
    const mAt = miss.findIndex(t => t.k === a2.k && t.s > 0 && miss.indexOf(t) > 0);
    return [
      qExpr(level, deal([{ ...a1, n:[R(4, 8), R(1, 3)], neg:[1] }, { ...b1, n:[R(2, 6), R(1, 4)] }]), nm),
      qExpr(level, deal([{ ...L1(letter()), n:[R(2, 6), R(2, 5)] }, { k:"1", n:[R(3, 9), R(1, 5)], neg:[1] }, { ...L1(letter()), n:[R(2, 6)] }]), nm),
      qLike(level, "swap"),
      qExpr(level, deal([{ k:keyOf(pq), ds:[pq, qp], n:[R(2, 6), R(2, 5)] }, { k:p, d:p, n:[R(2, 6)] }]), nm),
      qMistake(level, "square"),
      qMissing(level, miss, mAt < 0 ? 0 : mAt),
      qExpr(level, deal([{ ...a3, n:[R(3, 7), R(1, 3)], neg:[1] }, { ...b3, n:[R(2, 6), R(1, 4)] }, { ...c3, n:[R(2, 5)] }]), nm),
      qValue(level, deal([{ k:"n" + numG(13, 25), n:[R(2, 4), R(2, 4)] }, { k:"n" + numG(3, 9), n:[R(2, 5), R(1, 3)] }]), nm),
      qMistake(level, "sign"),
      qExpr(level, (() => { const c = R(2, 7); const [x1, y1] = two(); return deal([{ ...x1, n:[c, c], neg:[1] }, { ...y1, n:[R(2, 5), R(1, 4)] }]); })(), nm)
    ];
  }
  /* spicy */
  const [a1, b1] = two(), [a2, b2] = two(), [p, q] = pair(), c1 = L1(letter([a1.k, b1.k]));
  const sq = letter();
  const neg = (() => { const [x, y] = two(); const n1 = R(2, 4); return deal([{ ...x, n:[n1, n1 + R(2, 4)], neg:[1] }, { ...y, n:[R(3, 6), R(1, 3)] }]); })();
  const missS = deal([{ ...a2, n:[R(4, 7), R(2, 6), R(1, 3)], neg:[1] }, { ...b2, n:[R(2, 5)], neg:[0] }]);
  const mAtS = missS.findIndex(t => t.k === a2.k && t.s < 0);
  const g = [numG(3, 9), 0, 0]; g[1] = numG(3, 9, [g[0]]); g[2] = numG(11, 19, g);
  return [
    qExpr(level, deal([{ ...a1, n:[R(3, 6), R(1, 4)], neg:[1] }, { ...b1, n:[R(2, 5), R(3, 7)], neg:[1] }, { ...c1, n:[R(2, 4), R(1, 2)] }]), nm),
    qExpr(level, deal([{ k:sq, d:sq, n:[R(2, 6), R(1, 3)] }, { k:sq + "²", d:sq + "²", n:[R(2, 6), R(1, 3)], neg:[1] }]), nm),
    qMistake(level, "lone"),
    qExpr(level, deal([{ k:keyOf(p + q), ds:[p + q, q + p], n:[R(5, 8), R(1, 4)], neg:[1] }, { k:"1", n:[R(2, 9), R(1, 5)], neg:[0] }]), nm),
    qMissing(level, missS, mAtS < 0 ? 1 : mAtS),
    qValue(level, deal([{ k:"n" + g[0], n:[R(3, 6), R(1, 3)], neg:[1] }, { k:"n" + g[1], n:[R(2, 4)] }, { k:"n" + g[2], n:[R(2, 3), R(1, 2)] }]), nm),
    qBuild(level),
    qExpr(level, neg, nm),
    qLike(level, "power"),
    qExpr(level, deal([{ ...L1(letter()), n:[R(2, 5), R(4, 8)], neg:[1] }, { k:"1", n:[R(3, 8), R(2, 6)], neg:[0, 1] }, { ...L1(letter()), n:[R(2, 6), 1] }]), nm)
  ];
}

/* =====================================================================
   MARKING
   ===================================================================== */
function num(raw){
  const s = String(raw == null ? "" : raw).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
  if(!/^-?\d+$/.test(s)) return NaN;
  return parseInt(s, 10);
}
/* an expression typed by a student: 7x + 2y, 2y+7x, -3a + b, 4x^2 or 4x², 5 + 2ab; letters in a term may be in any order */
function parseExpr(raw){
  let s = String(raw == null ? "" : raw).toLowerCase().replace(/[−–—]/g, "-").replace(/[×*·]/g, "").replace(/\^2/g, "²").replace(/\s+/g, "");
  if(!s) return { empty:true };
  if(/[\^³]/.test(s)) return { err:"Only squares (x²) are needed here." };
  if(!/^[+-]?(\d*[a-z]+²?|\d+)([+-](\d*[a-z]+²?|\d+))*$/.test(s)) return { err:"Type it like 7x + 2y − 3." };
  const terms = []; const re = /([+-]?)(\d*)([a-z]*)(²?)/g; let m;
  while((m = re.exec(s)) && m[0] !== ""){
    if(m[4] && m[3].length !== 1) return { err:"Put the ² on a single letter, like x²." };
    const sign = m[1] === "-" ? -1 : 1, key = m[4] ? m[3] + "²" : m[3] ? m[3].split("").sort().join("") : "1";
    if(m[3].length > 1 && new Set(m[3]).size !== m[3].length) return { err:`Write ${m[3]} with each letter once.` };
    const one = m[2] === "1" && m[3];
    const c = m[2] === "" ? 1 : parseInt(m[2], 10);
    terms.push({ c:sign * c, key, one });
  }
  const map = {}; terms.forEach(t => { map[t.key] = (map[t.key] || 0) + t.c; });
  return { terms, map };
}
const sameMap = (a, b) => {
  const ka = Object.keys(a).filter(k => a[k] !== 0), kb = Object.keys(b).filter(k => b[k] !== 0);
  return ka.length === kb.length && ka.every(k => a[k] === b[k]);
};
const empty = s => String(s == null ? "" : s).trim() === "";
function markStep(it, s){
  if(s.t === "num"){
    if(empty(s.vals[0])) return { invalid:"Type your answer first." };
    const v = num(s.vals[0]);
    if(isNaN(v)) return { invalid:"Type a whole number." };
    const ok = v === s.ans[0];
    return { ok, marks:[ok], fix:ok ? null : s.why() };
  }
  if(s.t === "nums"){
    if(s.ans.some((_, i) => empty(s.vals[i]))) return { invalid:s.ans.length > 1 ? "Fill every box first." : "Type your answer first." };
    const vs = s.ans.map((_, i) => num(s.vals[i]));
    if(vs.some(v => isNaN(v))) return { invalid:"Type a whole number in each box." };
    const marks = vs.map((v, i) => v === s.ans[i]), ok = marks.every(Boolean);
    return { ok, marks, fix:ok ? null : s.why() };
  }
  if(s.t === "expr"){
    const p = parseExpr(s.vals[0]);
    if(p.empty) return { invalid:"Type your answer first." };
    if(p.err) return { invalid:p.err };
    const want = {}; Object.keys(s.ans).forEach(k => { want[k === "1" ? "1" : keyOf(k)] = s.ans[k]; });
    const eq = sameMap(p.map, want);
    if(eq){
      /* equal, but not finished: a nudge, not a mark */
      const keys = p.terms.map(t => t.key);
      if(new Set(keys).size !== keys.length) return { invalid:"That's equal, but some like terms haven't been collected yet." };
      if(p.terms.some(t => t.c === 0)) return { invalid:"Leave out anything that made zero." };
      if(p.terms.some(t => t.one)) return { invalid:"Write 1x as just x." };
    }
    return { ok:eq, marks:[eq], fix:eq ? null : s.why() };
  }
  if(s.t === "build"){
    const p = parseExpr(s.vals[0]);
    if(p.empty) return { invalid:"Type your answer first." };
    if(p.err) return { invalid:p.err };
    if(p.terms.length !== 4) return { invalid:"Use exactly four terms." };
    if(!p.terms.some(t => t.c < 0)) return { invalid:"Take something away at least once." };
    const ok = sameMap(p.map, s.want);
    return { ok, marks:[ok], fix:ok ? null : `Your four terms need to collect to the answer. ` + s.why() };
  }
  if(s.sel == null) return { invalid:"Choose an answer first." };
  const ok = !!s.opts[s.sel].ok;
  return { ok, marks:s.opts.map((o, i) => i === s.sel ? ok : null), fix:ok ? null : s.why() };
}

/* =====================================================================
   THE CARD — one question, one answer
   ===================================================================== */
const S = { levelKey:null, items:[], i:0 };
const cur = () => S.items[S.i];
const lv = () => LEVELS[S.levelKey];
const stacked = () => window.innerWidth <= 980;
function setPrompt(msg, kind){ const f = $("fb"); if(!f) return; f.className = "fb" + (kind ? " " + kind : ""); f.innerHTML = msg; }
function feedback(it){
  const s = it.steps[0];
  if(s.first === null) return it.model && it.mt ? setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>Drag the bubbles ${stacked() ? "below" : "on the right"} if it helps</span>`, "hint") : setPrompt("", "");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}
function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(it.grp){
    const box = i => { const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "", v = s.vals[i] == null ? "" : s.vals[i];
      return `<input class="cell ans gbox${m}" data-i="${i}" inputmode="numeric" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="How many ${typeOf(it.grp[i].k) === "one" ? "ones" : "groups of " + (typeOf(it.grp[i].k) === "num" ? valOf(it.grp[i].k) : it.grp[i].d)}">`; };
    return `<div class="ansEq">${it.tpl.map(p => `<span class="eqt">${p}</span>`).join("")}</div>`
      + `<div class="grpRow">` + it.grp.map((g, i) => `${i ? '<span class="gPlus">+</span>' : ""}<span class="gItem">${box(i)}<span class="gw">${typeOf(g.k) === "one" ? "ones" : "groups of"}</span>${typeOf(g.k) === "one" ? "" : `<span class="gU">${typeOf(g.k) === "num" ? valOf(g.k) : Lt(g.d)}</span>`}</span>`).join("") + `</div>`
      + `<div class="grpSum"><span class="gLab">All together</span><span class="eq" id="grpPrev">${grpPreview(it, s)}</span></div>`;
  }
  if(s.t !== "mc"){
    const wide = s.t === "expr" || s.t === "build";
    return `<div class="ansEq">` + it.tpl.map(p => {
      if(typeof p === "string") return `<span class="eqt">${p}</span>`;
      const i = p.in, m = s.marks ? (s.marks[i] ? " right" : " wrong") : "", v = s.vals[i] == null ? "" : s.vals[i];
      return `<input class="cell ans${wide ? " wide" : ""}${m}" data-i="${i}" ${wide ? 'inputmode="text" autocapitalize="off" spellcheck="false"' : 'inputmode="numeric"'} autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="Your answer${it.tpl.filter(x => typeof x !== "string").length > 1 ? " " + (i + 1) : ""}"${wide ? ' placeholder="type it here"' : ""}>`;
    }).join("") + `</div>`
      + (locked && !(s.marks && s.marks.every(Boolean)) && it.answerTxt ? `<div class="ansShow">The answer: ${eqS(it.answerTxt)}</div>` : "");
  }
  return `<div class="mcList">` + s.opts.map((o, i) => {
    const st = s.marks && s.marks[i] != null ? (s.marks[i] ? " right" : " wrong") : "";
    const show = locked && o.ok ? " right" : "";
    return `<button class="mcOpt${s.sel === i ? " on" : ""}${st || show}" type="button" data-opt="${i}"${locked ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${o.h}</span></button>`;
  }).join("") + `</div>`;
}
/* the collected answer, built from what has been typed so far ("?" for an empty box) */
function grpPreview(it, s){
  const parts = it.grp.map((g, i) => {
    const raw = s.vals[i] == null ? "" : String(s.vals[i]).trim(), v = num(raw);
    return { g, v:raw === "" || isNaN(v) ? null : v };
  });
  return "= " + parts.map((p, i) => {
    const ty = typeOf(p.g.k), unit = ty === "num" ? ` ${X} ${valOf(p.g.k)}` : ty === "one" ? "" : Lt(p.g.d);
    if(p.v === null) return (i ? " + " : "") + `<span class="gq">?</span>` + unit;
    const a = Math.abs(p.v), sg = i ? (p.v < 0 ? ` ${MINUS} ` : " + ") : (p.v < 0 ? MINUS : "");
    if(ty === "let") return sg + (a === 1 ? "" : a) + unit;
    return sg + a + unit;
  }).join("");
}
function paint(){
  const it = cur(); if(!it) return;
  $("qCounter").textContent = `Question ${S.i + 1} / ${S.items.length}`;
  $("progressFill").style.width = (S.items.filter(x => x.settled).length / S.items.length * 100) + "%";
  const s = it.steps[0];
  let h = `<div class="qBody">`;
  if(it.q) h += `<div class="qText">${it.q}</div>`;
  if(it.working) h += `<div class="working">${eqS(it.working)}</div>`;
  if(it.ask) h += `<div class="qText">${it.ask}</div>`;
  h += answerHTML(it, s);
  h += `<div class="checkRow">` + (s.last || s.skipped ? "" : `<button class="checkBtn" type="button" data-check="0">${s.first === null ? "Check" : "Check again"}</button>`) + `</div>`;
  h += `<div class="fb" id="fb" aria-live="polite"></div></div>`;
  $("qCard").innerHTML = h;
  feedback(it);
  bindCard();
  $("app").classList.toggle("noModel", !(it.model && it.mt));
  fitEq();
  fitBoard();
  BB.show(it);
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = S.i === S.items.length - 1 ? "Finish →" : "Next →";
  $("nextBtn").classList.toggle("ready", !!it.settled);
}
/* the line of maths with its boxes stays on ONE line if it can; a long one (5 × 7 + 3 × 7 + 2 × 5 = [ ] × 7 + [ ] × 5)
   puts the question on its own line and the answer underneath rather than shrinking past reading size */
function fitEq(){
  const e = $("qCard").querySelector(".ansEq"); if(!e) return;
  e.classList.remove("two"); e.style.fontSize = "";
  const f0 = parseFloat(getComputedStyle(e).fontSize);
  let f = f0, k = 0;
  while(e.scrollWidth > e.clientWidth + 1 && f > 15 && k++ < 30){ f *= .94; e.style.fontSize = f + "px"; }
  if((e.scrollWidth > e.clientWidth + 1 || f < f0 * .72) && e.querySelectorAll("input").length && e.firstElementChild && e.firstElementChild.classList.contains("eqt")){
    e.classList.add("two"); e.style.fontSize = ""; f = f0; k = 0;
    while(e.scrollWidth > e.clientWidth + 1 && f > 15 && k++ < 30){ f *= .94; e.style.fontSize = f + "px"; }
  }
}
function bindCard(){
  const card = $("qCard"), it = cur(), s = it.steps[0];
  const ins = [...card.querySelectorAll("input[data-i]")];
  ins.forEach((inp, n) => {
    inp.addEventListener("input", () => { s.vals[+inp.dataset.i] = inp.value; inp.classList.remove("right", "wrong"); const pv = $("grpPrev"); if(pv && it.grp) pv.innerHTML = grpPreview(it, s); });
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      if(s.last || s.skipped){ next(); return; }
      /* Enter moves to the next empty box before it checks */
      const nextEmpty = ins.find((x, j) => j > n && !x.readOnly && x.value.trim() === "");
      if(nextEmpty){ nextEmpty.focus(); return; }
      check();
    });
  });
  card.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
    s.sel = +b.dataset.opt;
    b.parentNode.querySelectorAll(".mcOpt").forEach(x => x.classList.toggle("on", x === b));
  }));
  card.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", check));
}
function focusAnswer(){
  const el = $("qCard").querySelector("input[data-i]:not([readonly])");
  if(el && !("ontouchstart" in window)) el.focus({ preventScroll:true });
}
function check(){
  const it = cur(), s = it.steps[0];
  if(s.last || s.skipped) return;
  const res = markStep(it, s);
  if(res.invalid){ setPrompt(res.invalid, "warn"); return; }
  s.marks = res.marks; s.last = res.ok; s.fixText = res.fix;
  if(s.first === null){
    s.first = res.ok; it.settled = true; it.correct = res.ok;
    if(res.ok) confetti(1);
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  paint();
  /* settled: every bubble says what it is; a wrong first answer plays the moves to the end */
  if(it.model && it.mt && !res.ok) BB.finish();
  if(res.ok) $("nextBtn").focus({ preventScroll:true }); else focusAnswer();
}
function next(){
  const it = cur();
  if(!it.settled){
    it.steps.forEach(s => { if(s.first === null){ s.first = false; s.last = false; s.skipped = true; } });
    it.settled = true; it.correct = false;
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  if(S.i < S.items.length - 1){ S.i++; paint(); focusAnswer(); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}

/* =====================================================================
   THE PANEL — the Bubbles tool, built from the question
   Each term is a bubble of pieces. Drag a bubble onto a like bubble to join
   them; onto one of the opposite sign and the pieces pop in zero pairs;
   drag a bubble into a gap to rearrange. Show me ▸ makes the next move.
   A bubble that has changed is captioned "?x" until the question is settled.
   ===================================================================== */
const BB = (() => {
  const host = $("bboard");
  let it = null, st = null, busy = false, L = null, msgT = 0;
  const EB = {}, EC = {}, ET = {};
  let NID = 1;
  const nid = p => p + (NID++);
  function stateFor(item){
    if(!item.bb){
      item.bb = { bubs:item.mt.map(t => ({ id:nid("b"), k:t.k, d:t.d || t.k, s:t.s, orig:true, toks:Array.from({ length:t.c }, () => nid("t")) })), hist:[] };
    }
    return item.bb;
  }
  const bub = id => st.bubs.find(b => b.id === id);
  const bubOfTok = t => st.bubs.find(b => b.toks.includes(t));
  const rel = (a, b) => a.k !== b.k ? "no" : a.s === b.s ? "ok" : "pair";
  /* hex packing, nearest the middle first */
  const HEX = (() => { const p = []; for(let j = -8; j <= 8; j++) for(let i = -8; i <= 8; i++){ const x = i + j / 2, y = j * Math.sqrt(3) / 2; p.push({ x, y, d:Math.hypot(x, y), a:Math.atan2(y, x) }); }
    p.sort((u, v) => (u.d - v.d) || (u.a - v.a)); return p; })();
  const PACK = {};
  function pack(n){
    if(PACK[n]) return PACK[n];
    const pts = HEX.slice(0, Math.max(1, n)).map(p => ({ x:p.x, y:p.y }));
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    pts.forEach(p => { p.x -= cx; p.y -= cy; });
    return (PACK[n] = { pts, R:Math.max(...pts.map(p => Math.hypot(p.x, p.y))) });
  }
  const bubR = (n, t) => t * (pack(Math.max(1, n)).R + 0.5) + t * .34;
  const unitH = b => typeOf(b.k) === "one" ? "1" : typeOf(b.k) === "num" ? String(valOf(b.k)) : Lt(b.d);
  const unitLen = b => typeOf(b.k) === "one" ? 1 : typeOf(b.k) === "num" ? String(valOf(b.k)).length : b.d.length;
  function capH(b){
    const n = b.toks.length, show = b.orig || it.settled, neg = b.s < 0;
    const cnt = show ? n : "?", ty = typeOf(b.k);
    let body;
    if(ty === "one") body = String(cnt);
    else if(ty === "num") body = `${cnt} ${X} ${valOf(b.k)}`;
    else body = (show && n === 1 ? "" : cnt) + Lt(b.d);
    return `${neg ? `<span class="neg">${MINUS}</span>` : ""}<span class="${neg ? "neg" : ""}${show ? "" : " q"}">${body}</span>`;
  }
  let meas = null;
  function capSize(html, px){
    if(!meas){ meas = document.createElement("div"); meas.className = "bcap measure"; host.appendChild(meas); }
    meas.style.fontSize = px + "px"; meas.innerHTML = html;
    return { w:meas.offsetWidth + 4, h:meas.offsetHeight };
  }
  function layout(W, H){
    const tryT = t => {
      const fs = Math.max(14, Math.min(28, t * .58)), gap = t * .7, padX = 10, rowGap = t * .45;
      let capH0 = fs * 1.35;
      const items = st.bubs.map(b => { const r = bubR(b.toks.length, t), cs = capSize(capH(b), fs); capH0 = Math.max(capH0, cs.h); return { b, r, w:Math.max(2 * r, cs.w) }; });
      const rows = []; let row = [], rw = 0;
      items.forEach(i2 => { const add = row.length ? gap + i2.w : i2.w; if(row.length && rw + add > W - 2 * padX){ rows.push(row); row = [i2]; rw = i2.w; } else { row.push(i2); rw += add; } });
      if(row.length) rows.push(row);
      const rh = rows.map(r => 2 * Math.max(...r.map(i2 => i2.r)) + capH0 + t * .2);
      const totH = rh.reduce((a, h) => a + h, 0) + rowGap * Math.max(0, rows.length - 1);
      const widest = Math.max(0, ...rows.map(r => r.reduce((a, i2, k) => a + i2.w + (k ? gap : 0), 0)));
      return { ok:totH <= H - 6 && widest <= W - 2 * padX, t, fs, gap, rowGap, rows, rh, totH };
    };
    let best = null;
    for(let t = 60; t >= 12; t--){ const r = tryT(t); best = r; if(r.ok) break; }
    const out = { t:best.t, fs:best.fs, gap:best.gap, B:{}, T:{} };
    let y = Math.max(3, (H - best.totH) / 2);
    best.rows.forEach((row, ri) => {
      const maxR = Math.max(...row.map(i2 => i2.r));
      const rowW = row.reduce((a, i2, k) => a + i2.w + (k ? best.gap : 0), 0);
      let x = (W - rowW) / 2;
      const cy = y + maxR, capY = y + 2 * maxR + best.t * .14;
      row.forEach(i2 => {
        const cx = x + i2.w / 2, p = pack(i2.b.toks.length);
        out.B[i2.b.id] = { x:cx, y:cy, r:i2.r, w:i2.w, capY };
        i2.b.toks.forEach((tid, k) => { out.T[tid] = { x:cx + p.pts[k].x * best.t, y:cy + p.pts[k].y * best.t }; });
        x += i2.w + best.gap;
      });
      y += best.rh[ri] + best.rowGap;
    });
    return out;
  }
  function clear(){ [EB, EC, ET].forEach(M => Object.keys(M).forEach(id => { M[id].remove(); delete M[id]; })); const z = host.querySelector(".bzero"); if(z) z.remove(); }
  function render(born){
    if(!it) return;
    const W = host.clientWidth, H = host.clientHeight; if(!W || !H) return;
    L = layout(W, H);
    const t = L.t, tokD = t * .9, live = new Set();
    st.bubs.forEach(b => {
      const P = L.B[b.id]; live.add(b.id);
      let e = EB[b.id];
      if(!e){ e = EB[b.id] = document.createElement("div"); e.className = "bub"; e.dataset.id = b.id; host.appendChild(e); if(born && !reduceMotion){ e.classList.add("born"); setTimeout(() => e.classList.remove("born"), 500); } }
      e.classList.toggle("neg", b.s < 0);
      e.style.left = (P.x - P.r) + "px"; e.style.top = (P.y - P.r) + "px"; e.style.width = e.style.height = (2 * P.r) + "px";
      e.style.borderWidth = Math.max(2.5, t * .085) + "px";
      let c = EC[b.id];
      if(!c){ c = EC[b.id] = document.createElement("div"); c.className = "bcap"; c.dataset.id = b.id; host.appendChild(c); }
      c.innerHTML = capH(b); c.style.left = P.x + "px"; c.style.top = P.capY + "px"; c.style.fontSize = L.fs + "px";
      const lab = `<span class="tl">${b.s < 0 ? MINUS : ""}${unitH(b)}</span>`, len = unitLen(b) + (b.s < 0 ? .8 : 0);
      const fsT = tokD * Math.min(.6, 1.02 / (len + .35));
      b.toks.forEach(tid => {
        const q = L.T[tid]; live.add(tid);
        let k = ET[tid];
        if(!k){ k = ET[tid] = document.createElement("div"); k.className = "tok"; k.dataset.id = tid; host.appendChild(k); }
        if(k.dataset.lab !== lab){ if(k.dataset.lab && !reduceMotion){ k.classList.remove("born"); void k.offsetWidth; k.classList.add("born"); setTimeout(() => k.classList.remove("born"), 450); } k.innerHTML = lab; k.dataset.lab = lab; }
        k.classList.toggle("neg", b.s < 0);
        k.style.left = (q.x - tokD / 2) + "px"; k.style.top = (q.y - tokD / 2) + "px"; k.style.width = k.style.height = tokD + "px"; k.style.fontSize = fsT + "px";
      });
    });
    [EB, EC].forEach(M => Object.keys(M).forEach(id => { if(!live.has(id)){ M[id].remove(); delete M[id]; } }));
    Object.keys(ET).forEach(id => { if(!live.has(id)){ ET[id].remove(); delete ET[id]; } });
    let z = host.querySelector(".bzero");
    if(!st.bubs.length){ if(!z){ z = document.createElement("div"); z.className = "bzero"; z.textContent = "0"; host.appendChild(z); } } else if(z) z.remove();
    head();
  }
  function head(){
    const box = $("stepBox"); if(!it){ box.hidden = true; return; }
    box.hidden = false;
    $("mBack").disabled = !st.hist.length || busy;
    const m = nextMove();
    $("mNext").disabled = !m || busy;
    $("mNext").innerHTML = m ? "Show me &#9656;" : "Done &#10003;";
    if(!msgT) $("stepCap").innerHTML = m ? (st.hist.length ? "Keep going &mdash; or Show me" : "Drag like bubbles together") : "Nothing else can join";
  }
  function say(html){ clearTimeout(msgT); $("stepCap").innerHTML = html; msgT = setTimeout(() => { msgT = 0; head(); }, 2600); }
  function remember(){ st.hist.push(JSON.stringify(st.bubs)); }
  /* the moves */
  function join(a, b){ remember(); b.toks = b.toks.concat(a.toks); b.orig = false; st.bubs = st.bubs.filter(x => x !== a); render(); }
  async function cancel(a, b){
    remember(); busy = true; head();
    const k = Math.min(a.toks.length, b.toks.length);
    const am = a.toks.slice(a.toks.length - k), bm = b.toks.slice(b.toks.length - k);
    await popPairs(am.map((m, i) => [m, bm[i]]));
    const ra = a.toks.slice(0, a.toks.length - k), rb = b.toks.slice(0, b.toks.length - k);
    if(ra.length){ b.toks = ra; b.s = a.s; b.d = a.d; } else b.toks = rb;
    b.orig = false;
    st.bubs = st.bubs.filter(x => x !== a && x.toks.length);
    busy = false; render();
  }
  async function popPairs(pairs){
    const tokD = L.t * .9;
    pairs.forEach(([m, p]) => { const e = ET[m], q = L.T[p]; if(e && q){ e.classList.remove("lift"); e.style.zIndex = 20; e.style.left = (q.x - tokD / 2 + tokD * .18) + "px"; e.style.top = (q.y - tokD / 2 - tokD * .12) + "px"; } });
    await wait(420);
    for(const [m, p] of pairs){
      [m, p].forEach(id => { const e = ET[id]; if(e) e.classList.add("pop"); });
      const q = L.T[p];
      if(q && !reduceMotion && !Q.fast){ const z = document.createElement("div"); z.className = "bzeroFx"; z.textContent = "0"; z.style.left = q.x + "px"; z.style.top = q.y + "px"; z.style.fontSize = (L.t * .8) + "px"; host.appendChild(z); setTimeout(() => z.remove(), 900); }
      await wait(pairs.length > 6 ? 70 : 110);
    }
    await wait(320);
  }
  function moveTok(tid, b){ const src = bubOfTok(tid); remember(); src.toks = src.toks.filter(x => x !== tid); b.toks.push(tid); src.orig = b.orig = false; st.bubs = st.bubs.filter(x => x.toks.length); render(); }
  async function pairTok(tid, b){
    const src = bubOfTok(tid); remember(); busy = true; head();
    const partner = b.toks[b.toks.length - 1];
    await popPairs([[tid, partner]]);
    src.toks = src.toks.filter(x => x !== tid); b.toks = b.toks.filter(x => x !== partner); src.orig = b.orig = false;
    st.bubs = st.bubs.filter(x => x.toks.length);
    busy = false; render();
  }
  function reorder(b, idx){
    const rest = st.bubs.filter(x => x !== b); idx = clamp(idx, 0, rest.length); rest.splice(idx, 0, b);
    if(rest.every((x, i) => x === st.bubs[i])){ render(); return; }
    remember(); st.bubs = rest; render();
  }
  function unlikeMsg(a, b){
    const nm = x => typeOf(x.k) === "one" ? "ones" : typeOf(x.k) === "num" ? `groups of ${valOf(x.k)}` : Lt(x.d) + "s";
    return `<b>Unlike:</b> ${nm(a)} can't join ${nm(b)}`;
  }
  /* show me */
  function nextMove(){
    if(!st) return null;
    const bubs = st.bubs, ks = []; bubs.forEach(b => { if(!ks.includes(b.k)) ks.push(b.k); });
    const contiguous = ks.every(k => { const ix = bubs.map((b, i) => b.k === k ? i : -1).filter(i => i >= 0); return ix[ix.length - 1] - ix[0] === ix.length - 1; });
    if(!contiguous){ const order = []; ks.forEach(k => bubs.forEach(b => { if(b.k === k) order.push(b.id); })); return { type:"order", order }; }
    for(const k of ks){
      const same = bubs.filter(b => b.k === k); if(same.length < 2) continue;
      for(const sg of [1, -1]){ const g = same.filter(b => b.s === sg); if(g.length >= 2) return { type:"join", a:g[1].id, b:g[0].id }; }
      const pos = same.find(b => b.s > 0), neg = same.find(b => b.s < 0);
      const first = bubs.indexOf(pos) < bubs.indexOf(neg) ? pos : neg;
      return { type:"cancel", a:(first === pos ? neg : pos).id, b:first.id };
    }
    return null;
  }
  async function play(m){
    if(!m || busy) return;
    if(m.type === "order"){ remember(); st.bubs = m.order.map(id => bub(id)); render(); say("<b>Like terms side by side.</b> Each keeps its own sign."); }
    else if(m.type === "join"){ const a = bub(m.a), b = bub(m.b); join(a, b); }
    else { const a = bub(m.a), b = bub(m.b); await cancel(a, b); }
  }
  async function finish(){
    if(!it || !st) return;
    const mine = it;
    let m, g = 0;
    while(it === mine && (m = nextMove()) && g++ < 30){ await play(m); await wait(420); }
    if(it === mine) render();
  }
  function undo(){ if(busy || !st.hist.length) return; st.bubs = JSON.parse(st.hist.pop()); render(true); }
  /* dragging */
  let D = null;
  const slot = document.createElement("div"); slot.className = "bslot"; host.appendChild(slot);
  const pt = e => { const r = host.getBoundingClientRect(); return { x:e.clientX - r.left, y:e.clientY - r.top }; };
  function hit(p, ex){ let best = null, bd = Infinity; st.bubs.forEach(b => { if(b.id === ex) return; const P = L.B[b.id]; if(!P) return; const d = Math.hypot(p.x - P.x, p.y - P.y); if(d < P.r + 8 && d < bd){ bd = d; best = b; } }); return best; }
  function slotAt(p, ex){
    const others = st.bubs.filter(b => b.id !== ex); if(!others.length) return { idx:0, x:p.x, y:p.y, h:60 };
    let best = null, bd = Infinity;
    others.forEach((b, i) => { const P = L.B[b.id]; const d = Math.hypot(p.x - P.x, (p.y - P.y) * 1.6); if(d < bd){ bd = d; best = { i, P }; } });
    const after = p.x > best.P.x;
    return { idx:best.i + (after ? 1 : 0), x:best.P.x + (after ? 1 : -1) * (best.P.w / 2 + L.gap / 2), y:best.P.y, h:best.P.r * 1.6 };
  }
  function marks(){ Object.values(EB).forEach(e => e.classList.remove("ok", "pair", "no")); slot.classList.remove("on"); }
  function down(e, kind, id){
    if(busy || e.button > 0 || !it) return;
    e.preventDefault(); e.stopPropagation();
    if(kind === "tok"){ const s0 = bubOfTok(id); if(!s0) return; if(s0.toks.length === 1){ kind = "bub"; id = s0.id; } }
    const p = pt(e);
    D = { kind, id, sx:p.x, sy:p.y, moved:false, target:null, slot:null };
    if(kind === "tok"){ const el = ET[id]; D.src = bubOfTok(id); D.els = [{ el, x:parseFloat(el.style.left), y:parseFloat(el.style.top) }]; }
    else { const b = bub(id); D.src = b; D.els = [EB[id], EC[id]].concat(b.toks.map(t => ET[t])).filter(Boolean).map(el => ({ el, x:parseFloat(el.style.left), y:parseFloat(el.style.top) })); }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }
  function move(e){
    if(!D) return;
    const p = pt(e), dx = p.x - D.sx, dy = p.y - D.sy;
    if(!D.moved){ if(Math.hypot(dx, dy) < 5) return; D.moved = true; D.els.forEach(o => o.el.classList.add("lift")); }
    D.els.forEach(o => { o.el.style.left = (o.x + dx) + "px"; o.el.style.top = (o.y + dy) + "px"; });
    marks();
    const ex = D.kind === "bub" ? D.id : null, tg = hit(p, ex);
    D.target = null; D.slot = null;
    if(tg && tg !== (D.kind === "tok" ? D.src : null)){ D.target = tg; EB[tg.id].classList.add(rel(D.src, tg)); }
    else if(!tg && D.kind === "bub"){ const s0 = slotAt(p, ex); D.slot = s0; slot.style.left = (s0.x - 3) + "px"; slot.style.top = (s0.y - s0.h / 2) + "px"; slot.style.height = s0.h + "px"; slot.classList.add("on"); }
  }
  async function up(){
    window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    if(!D) return;
    const d = D; D = null; marks(); d.els.forEach(o => o.el.classList.remove("lift"));
    if(!d.moved) return;
    if(d.target){
      const r = rel(d.src, d.target);
      if(r === "no"){ const e = EB[d.target.id]; e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); setTimeout(() => e.classList.remove("shake"), 450); say(unlikeMsg(d.src, d.target)); render(); return; }
      if(d.kind === "tok"){ if(r === "ok") moveTok(d.id, d.target); else await pairTok(d.id, d.target); }
      else { if(r === "ok") join(d.src, d.target); else await cancel(d.src, d.target); }
      return;
    }
    if(d.slot && d.kind === "bub"){ reorder(d.src, d.slot.idx); return; }
    render();
  }
  host.addEventListener("pointerdown", e => {
    const tk = e.target.closest(".tok"); if(tk){ down(e, "tok", tk.dataset.id); return; }
    const bb = e.target.closest(".bub, .bcap"); if(bb) down(e, "bub", bb.dataset.id);
  });
  $("mNext").addEventListener("click", () => play(nextMove()));
  $("mBack").addEventListener("click", undo);
  return {
    show(item){
      if(!item || !item.model || !item.mt){ it = null; st = null; clear(); head(); return; }
      if(it !== item){ clear(); it = item; st = stateFor(item); clearTimeout(msgT); msgT = 0; render(true); }
      else render();
    },
    render(){ if(it) render(); },
    finish, nextMove, play, undo,
    get st(){ return st; }, get it(){ return it; }, get L(){ return L; }
  };
})();

/* the panel is sized to the real page: the board gets what is left */
function fitBoard(){
  const wrap = $("boardWrap");
  if(window.innerWidth <= 980){ if(wrap.style.height) wrap.style.height = ""; $("qCard").style.maxHeight = ""; return false; }
  const work = $("work"), card = $("boardCard");
  const wr = work.getBoundingClientRect(), nav = document.querySelector(".navRow").getBoundingClientRect();
  const lay = getComputedStyle(document.querySelector(".layout"));
  const outside = (wr.top + window.scrollY) + (nav.bottom - wr.bottom) + parseFloat(lay.paddingBottom) + document.querySelector(".brandFoot").offsetHeight;
  const extra = card.offsetHeight - wrap.offsetHeight;
  const want = Math.round(clamp(window.innerHeight - outside - extra - 2, 260, 620));
  const moved = Math.abs(wrap.offsetHeight - want) > 1;
  if(moved) wrap.style.height = want + "px";
  $("qCard").style.maxHeight = Math.max(card.offsetHeight, window.innerHeight - outside - 2) + "px";
  return moved;
}
let rz = 0;
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fitEq(); fitBoard(); BB.render(); }); };
window.addEventListener("resize", onResize);
if(window.ResizeObserver){ const ro = new ResizeObserver(onResize); ro.observe($("boardWrap")); }

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { collect:"Collect like terms", unlike:"Two kinds of term", numbers:"Groups of numbers", value:"Collect first, then work it out",
  take:"Taking away", zero:"Zero pairs", below:"Answers below zero", like:"Which can join?", missing:"Find a missing number", mistake:"Spot the mistake", build:"Make your own" };
const CATS = ["collect","unlike","numbers","value","take","zero","below","like","missing","mistake","build"];
function isPartial(){ return !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial()); }
function scores(){
  const counted = isPartial() ? S.items.filter(x => x.settled) : S.items;
  const score = counted.filter(x => x.correct).length;
  const total = isPartial() && window.MMTSubmit.total ? window.MMTSubmit.total() : S.items.length;
  const cats = {};
  counted.forEach(it => it.steps.forEach(s => { const c = s.cat; cats[c] = cats[c] || [0, 0]; cats[c][1]++; if(s.first === true) cats[c][0]++; }));
  return { score, total, counted:counted.length, cats };
}
function renderCert(){
  const s = scores(), L0 = lv();
  const pct = s.total ? Math.round(s.score / s.total * 100) : 0;
  $("certScore").textContent = `${s.score} / ${s.total}`;
  $("certLine").innerHTML = `${CFG.title} &middot; ${L0.name} &middot; ${pct}%`;   // .certSub belongs to the sign-in script
  $("certBreak").innerHTML = CATS.filter(c => s.cats[c]).map(c => `${CAT_NAMES[c]}: ${s.cats[c][0]} / ${s.cats[c][1]}`).join("<br>");
  return { s, pct };
}
function finish(){
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.settled = true; it.correct = false; it.steps.forEach(s => { if(s.first === null) s.first = false; }); } });
  const { s, pct } = renderCert(), L0 = lv();
  $("progressFill").style.width = "100%";
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts. */
  const types = CATS.filter(c => s.cats[c]).map(c => ({ typeId:"clt-" + c, label:CAT_NAMES[c], correct:s.cats[c][0], total:s.cats[c][1] })).concat(["level:" + S.levelKey]);
  if(window.MMTSave) window.MMTSave({
    tool:CFG.tool, topic:"algebra",
    level:L0.name, levelKey:S.levelKey,
    score:s.score, total:s.total, percent:pct,
    masteryTopic:CFG.mastery,
    types,
    certificateText:CFG.title + " — " + L0.name + ": " + s.score + "/" + s.total,
    ...(window.MMTSubmit && window.MMTSubmit.fields ? window.MMTSubmit.fields() : {})
  });
}
const CONFETTI_COLOURS = ["#2563eb","#22c55e","#f59e0b","#ec4899","#7c3aed","#ef4444","#14b8a6"];
function confetti(scale){
  if(reduceMotion) return;
  const host = document.createElement("div");
  host.className = "confetti"; host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  const W = innerWidth, H = innerHeight, bits = [], n = Math.round(56 * (scale || 1));
  for(let i = 0; i < n; i++){
    const e = document.createElement("i"), size = 6 + Math.random() * 7;
    e.style.cssText = "position:absolute;top:0;left:0;width:" + size + "px;height:" + (size * .6) + "px;background:" + CONFETTI_COLOURS[i % CONFETTI_COLOURS.length] + ";border-radius:" + (Math.random() < .3 ? "50%" : "2px") + ";";
    host.appendChild(e);
    bits.push({ e, x:W * (.15 + Math.random() * .7), y:-20 - Math.random() * H * .35, vx:(Math.random() - .5) * 2.2, vy:2.6 + Math.random() * 3.4, rot:Math.random() * 360, vr:(Math.random() - .5) * 18 });
  }
  const t0 = performance.now();
  (function frameC(now){
    const t = now - t0; let alive = false;
    for(const b of bits){ b.x += b.vx; b.y += b.vy; b.vy += .06; b.rot += b.vr; if(b.y < H + 40) alive = true;
      b.e.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) rotate(" + b.rot.toFixed(0) + "deg)";
      b.e.style.opacity = t > 1500 ? String(Math.max(0, 1 - (t - 1500) / 700)) : "1"; }
    if(alive && t < 2300) requestAnimationFrame(frameC); else host.remove();
  })(t0);
}

/* =====================================================================
   LEVELS + WIRING
   ===================================================================== */
function buildLevelList(){
  $("lvlList").innerHTML = ORDER.map(k => { const L0 = LEVELS[k];
    return `<button class="lvlRow ${k}" type="button" data-k="${k}"><span class="lvlIco">${L0.ico}</span><strong>${L0.name}</strong><span class="d">${L0.d}</span><span class="go">&rsaquo;</span></button>`; }).join("");
  $("lvlList").querySelectorAll(".lvlRow").forEach(b => b.addEventListener("click", () => startLevel(b.dataset.k)));
}
function openLevels(){ $("certModal").classList.remove("open"); $("levelModal").classList.add("open"); }
function startLevel(k){
  S.levelKey = k; S.items = buildPaper(k); S.i = 0;
  $("levelModal").classList.remove("open"); $("certModal").classList.remove("open");
  const chip = $("levelChip"); chip.hidden = false; chip.className = "lvlChip " + k; chip.textContent = LEVELS[k].name;
  if(window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset();
  paint(); focusAnswer();
}
$("nextBtn").addEventListener("click", next);
$("prevBtn").addEventListener("click", () => { if(S.i > 0){ S.i--; paint(); } });
$("menuBtn").addEventListener("click", openLevels);
$("changeLvlBtn").addEventListener("click", openLevels);
$("againBtn").addEventListener("click", () => startLevel(S.levelKey));
$("copyBtn").addEventListener("click", async () => {
  const s = scores();
  const line = "\u{1F3C6} Mills Maths Tools — " + CFG.title + "\n" + `${lv().name}: ${s.score}/${s.total}\n` + (window.MMTAuth && window.MMTAuth.shareLine ? window.MMTAuth.shareLine() : "");
  try{ await navigator.clipboard.writeText(line); $("copyBtn").textContent = "Copied ✓"; } catch(e){ $("copyBtn").textContent = "Couldn’t copy"; }
  setTimeout(() => { $("copyBtn").textContent = "Copy my result"; }, 1800);
});
$("toolsBtn").addEventListener("click", e => {
  e.stopPropagation();
  const m = $("toolsMenu"), was = m.classList.contains("open");
  m.classList.toggle("open", !was); $("toolsBtn").setAttribute("aria-expanded", String(!was));
});
document.addEventListener("click", () => { $("toolsMenu").classList.remove("open"); $("toolsBtn").setAttribute("aria-expanded", "false"); });
document.addEventListener("keydown", e => { if(e.key === "Escape") $("toolsMenu").classList.remove("open"); });

import("/portal/shared/earlySubmit.js").then(m => {
  window.MMTSubmit = m.MMTSubmit;
  m.MMTSubmit.register({
    progress: () => ({ attempted:S.items.filter(x => x.settled).length, correct:S.items.filter(x => x.correct).length, quizLength:QUIZ_N }),
    finish: () => finish()
  });
}).catch(() => {});

buildLevelList();
fitBoard();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__CLQ__ = { S, Q, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, parseExpr, collect, BB, MATH_ALPHA };
})();
