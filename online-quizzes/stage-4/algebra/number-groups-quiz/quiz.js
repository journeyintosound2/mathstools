/* =====================================================================
   NUMBER GROUPS — COLLECTING LIKE TERMS — STUDENT QUIZ (2026-11-16)
   ---------------------------------------------------------------------
   The trapezium quiz's pattern: the card on the left is ONE question and
   ONE answer; the panel on the right is the teaching tool's model.

   The idea is the tool's: a term is some GROUPS of the same thing, and
   collecting like terms is COUNTING THE GROUPS FIRST.
       3 × 7 + 2 × 7 + 5 × 7 = 10 × 7       x + 3x + 6x = 10x

   Sweet and Mild: the panel draws the question's own terms as bars (one
   bar = one group). Show me ▸ stacks them into one pile, and takes groups
   away when a term is subtracted. Never marked, never required, and it
   never shows the answer: the pile's count is "?" until the question is
   settled. A wrong first answer jumps the model to its last step.

   Medium and Spicy: no model. Unlike terms (groups of a different thing),
   two-letter groups, big numbers, and the whole simplified expression typed
   in (any order; "4x + 3x + 2y" is equal but not collected: a nudge, not a
   mark).

   The ladder:
     Sweet  numbers, then the same picture with letters; 2–3 terms, all
            added; write it as one multiplication, work it out, collect
     Mild   a single group (x), taking groups away, a missing term, spot
            "3x + 2x = 5x²"
     Medium no model; unlike terms; two-letter groups (ab); big numbers;
            give the letter a value; which are like terms?
     Spicy  two groups of each kind, results that cancel or go negative,
            "5x − x = 5", write 12x as three different like terms

   Marking (as the other quizzes): only the FIRST check scores; Check again
   lets them fix it; an empty or unreadable check is free; Next on an
   unanswered question counts it as wrong. Nothing typed is ever saved —
   only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"number-groups-student-quiz", title:"Number Groups — Collecting Like Terms", mastery:"number-groups" };
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

/* ---------------------------------------------------------- maths italics, as Word's equation editor
   Real glyphs from the Mathematical Alphanumeric Symbols block (x -> U+1D465) when a font has them,
   else a serif with a true italic face. (Same as the teaching tool.) */
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
const Lt = f => MATH_ALPHA ? `<span class="mi">${mathItalic(f)}</span>` : `<span class="mv">${esc(f)}</span>`;
const isNum = f => typeof f === "number";
const G = f => isNum(f) ? String(f) : Lt(f);
/* one term: c groups of f */
function termH(c, f){
  if(isNum(f)) return `${c} ${X} ${f}`;
  return (c === 1 ? "" : String(c)) + Lt(f);
}
/* a list of terms {c, f, sign}; a term with miss:true shows a box (or "?") instead of its count */
function exprH(terms, box){
  return terms.map((t, i) => {
    const s = i === 0 ? (t.sign < 0 ? MINUS : "") : (t.sign < 0 ? ` ${MINUS} ` : " + ");
    if(t.miss) return s + (box || "?") + (isNum(t.f) ? ` ${X} ${t.f}` : Lt(t.f));
    return s + termH(t.c, t.f);
  }).join("");
}
const plainT = (c, f) => isNum(f) ? `${c} × ${f}` : (c === 1 ? "" : c) + f;
const gw = n => n === 1 ? "group" : "groups";

/* ---------------------------------------------------------- numbers */
/* no i, l, o (they read as 1 and 0) and no v (it sits next to w and u too easily) */
const LETTERS = "abcdefghjkmnpqrstuwxyz".split("");
/* n whole parts (each >= min) adding to total, none hogging the groups, at most one lone 1 */
function compose(total, n, min){
  min = min || 1;
  const cap = n === 2 ? total - min : Math.max(Math.ceil(total * 0.5), Math.ceil(total / n) + 2);
  let best = null;
  for(let t = 0; t < 120; t++){
    const cuts = []; for(let i = 0; i < n - 1; i++) cuts.push(R(1, total - 1));
    cuts.sort((x, y) => x - y);
    const v = []; let prev = 0; cuts.concat(total).forEach(c => { v.push(c - prev); prev = c; });
    if(v.some(x => x < min)) continue;
    best = v;
    if(Math.max(...v) <= cap && v.filter(x => x === 1).length <= 1) return shuffle(v);
  }
  if(best) return shuffle(best);
  const v = Array(n).fill(min); let left = total - n * min, i = 0; while(left-- > 0){ v[i % n]++; i++; }
  return shuffle(v);
}
let USED = new Set();
function letter(two){
  for(let t = 0; t < 60; t++){
    let f;
    if(two){ let p = pick(LETTERS), q = pick(LETTERS); while(q === p) q = pick(LETTERS); f = [p, q].sort().join(""); }
    else f = pick(LETTERS);
    if(!USED.has("L" + f) || t > 40){ USED.add("L" + f); return f; }
  }
  return "x";
}
function numG(lo, hi){
  for(let t = 0; t < 60; t++){ const g = R(lo, hi); if(g !== 10 && (!USED.has("N" + g) || t > 40)){ USED.add("N" + g); return g; } }
  return R(lo, hi);
}
function otherLetter(f){ let g, t = 0; do { g = pick(LETTERS); } while((g === f || f.includes(g)) && t++ < 40); return g; }
/* counts that make n groups in k terms, one of them taken away when take is true */
function countsFor(n, k, take, allowOne){
  const min = allowOne ? 1 : 2;
  if(take){
    const sub = R(1, Math.max(1, Math.min(5, Math.floor(n / 2))));
    const pos = compose(n + sub, k - 1, min).map(c => ({ c, sign:1 }));
    pos.splice(R(1, k - 1), 0, { c:sub, sign:-1 });
    return pos;
  }
  return compose(n, k, min).map(c => ({ c, sign:1 }));
}
const withF = (cs, f) => cs.map(t => Object.assign({ f }, t));
const countOf = terms => terms.reduce((s, t) => s + t.sign * t.c, 0);
const countsTxt = terms => terms.map((t, i) => (i ? (t.sign < 0 ? ` ${MINUS} ` : " + ") : "") + t.c).join("");

/* ---------------------------------------------------------- questions */
function base(level, o){
  return Object.assign({ level, model:level === "sweet" || level === "mild", mStep:0, settled:false, correct:false, q:"", tpl:null, working:"", ask:"" }, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:[], marks:null, fixText:null, sel:null }, o); }
/* the model for a question: like terms of ONE group, possibly one taken away, possibly one missing */
const modelOf = (terms, total) => ({ terms:terms.map(t => ({ c:t.c, sign:t.sign, miss:!!t.miss })), f:terms[0].f, total });

/* write a sum of groups of a number as one multiplication: 3 × 7 + 2 × 7 = __ × 7 */
function qCount(level, terms){
  const f = terms[0].f, n = countOf(terms);
  const it = base(level, { mt:modelOf(terms) });
  it.q = "Count the groups. Write it as one multiplication.";
  it.tpl = [exprH(terms) + " =", { in:0 }, `${X} ${f}`];
  it.steps = [ step("num", { cat:"count", ans:[n], why:() => `${eqS(countsTxt(terms))} = ${n} ${gw(n)} of ${f}, so it is ${eqS(`${n} ${X} ${f}`)}.` }) ];
  return it;
}
/* work it out: count the groups first, then one multiplication */
function qValue(level, terms, ask){
  const f = terms[0].f, n = countOf(terms), v = n * f;
  const it = base(level, { mt:modelOf(terms) });
  it.q = ask || "Work it out. Count the groups first.";
  it.tpl = [exprH(terms) + " =", { in:0 }];
  it.steps = [ step("num", { cat:"value", ans:[v], why:() => `${eqS(countsTxt(terms))} = ${n} ${gw(n)} of ${f}, and ${eqS(`${n} ${X} ${f} = ${v}`)}.` }) ];
  return it;
}
/* collect like terms with a letter: x + 3x + 6x = __x */
function qCollect(level, terms, o){
  const f = terms[0].f, n = countOf(terms), take = terms.some(t => t.sign < 0);
  const it = base(level, Object.assign({ mt:modelOf(terms) }, o));
  it.q = take ? "Collect the like terms. Some groups are taken away." : "Collect the like terms.";
  it.tpl = [exprH(terms) + " =", { in:0 }, Lt(f)];
  const lone = terms.some(t => t.c === 1) ? ` (${G(f)} on its own is 1 group of ${G(f)}.)` : "";
  it.steps = [ step("num", { cat:take ? "take" : "collect", ans:[n], why:() => `${eqS(countsTxt(terms))} = ${n} ${gw(n)} of ${G(f)}, so it is ${eqS(termH(n, f))}.${lone}` }) ];
  return it;
}
/* a missing count: 3x + __x = 8x (other kinds of term may be in the line too: they just carry across) */
function collectedH(terms){
  const order = [], tot = {};
  terms.forEach(t => { if(!(t.f in tot)){ order.push(t.f); tot[t.f] = 0; } tot[t.f] += t.sign * t.c; });
  return order.filter(f => tot[f] !== 0).map((f, i) => (i === 0 ? (tot[f] < 0 ? MINUS : "") : (tot[f] < 0 ? ` ${MINUS} ` : " + ")) + termH(Math.abs(tot[f]), f)).join("");
}
function qMissing(level, terms, at, o){
  const mf = terms[at].f, like = terms.filter(t => t.f === mf), n = countOf(like), ans = terms[at].c;
  const shown = terms.map((t, i) => Object.assign({}, t, { miss:i === at }));
  const it = base(level, Object.assign({ mt:modelOf(shown.filter(t => t.f === mf), n) }, o));
  it.q = "Find the missing number of groups.";
  const mt = terms[at];
  let pre = exprH(terms.slice(0, at));
  pre += at === 0 ? (mt.sign < 0 ? MINUS : "") : (mt.sign < 0 ? ` ${MINUS}` : " +");
  const rest = terms.slice(at + 1).map(t => (t.sign < 0 ? ` ${MINUS} ` : " + ") + termH(t.c, t.f)).join("");
  const post = (isNum(mf) ? `${X} ${mf}` : Lt(mf)) + rest + " = " + collectedH(terms);
  it.tpl = (pre ? [pre] : []).concat([{ in:0 }, post]);
  const others = like.filter(t => t !== mt), oc = countOf(others);
  const why = mt.sign < 0
    ? `${eqS(countsTxt(others))} = ${oc} groups of ${G(mf)}, and ${n} are left, so ${oc - n} were taken away.`
    : `${n} groups of ${G(mf)} altogether, and the others make ${oc}, so ${eqS(`${n} ${MINUS} ${oc} = ${ans}`)}.`;
  it.steps = [ step("num", { cat:"missing", ans:[ans], why:() => why }) ];
  return it;
}
/* which is the same? */
function qSame(level, terms){
  const f = terms[0].f, n = countOf(terms), sum = terms.reduce((s, t) => s + t.c, 0);
  const it = base(level, { mt:modelOf(terms) });
  it.q = `Which is the same as ${eqS(exprH(terms))}?`;
  const opts = [ { h:eqS(`${n} ${X} ${f}`), ok:true }, { h:eqS(`${n} ${X} ${f * terms.length}`), ok:false },
    { h:eqS(`${sum + f * terms.length}`), ok:false }, { h:eqS(terms.map(t => t.c).join(` ${X} `) + ` ${X} ${f}`), ok:false } ];
  it.steps = [ step("mc", { cat:"same", opts:shuffle(opts), why:() => `It is ${eqS(countsTxt(terms))} = ${n} groups of ${f}: ${eqS(`${n} ${X} ${f}`)}.` }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
let NAMEBAG = [];
const nameOf = () => { if(!NAMEBAG.length) NAMEBAG = shuffle(NAMES); return NAMEBAG.pop(); };
/* a classic mistake to spot */
function qMistake(level, kind){
  const nm = nameOf(), it = base(level);
  let opts, why;
  if(kind === "square"){
    const f = letter(), a = R(2, 6), b = R(2, 6), n = a + b;
    it.mt = modelOf(withF([{ c:a, sign:1 }, { c:b, sign:1 }], f));
    it.q = `${nm} wrote:`; it.working = `${termH(a, f)} + ${termH(b, f)} = ${n}${Lt(f)}²`;
    it.ask = `What went wrong?`;
    opts = [ { h:`Adding groups doesn't multiply the ${G(f)}s — it is ${n} groups of ${G(f)}: ${eqS(termH(n, f))}`, ok:true },
             { h:`Nothing — ${eqS(`${n}${Lt(f)}²`)} is right`, ok:false },
             { h:`It should be ${eqS(termH(a * b, f))}`, ok:false },
             { h:`It should be ${eqS(`${n} + ${Lt(f)}`)}`, ok:false } ];
    why = `${eqS(`${a} + ${b} = ${n}`)} groups of ${G(f)}, so ${eqS(termH(n, f))}. ${eqS(`${Lt(f)}²`)} would mean ${G(f)} ${X} ${G(f)}.`;
  } else if(kind === "xy"){
    const f = letter(), g = otherLetter(f), a = R(2, 6), b = R(2, 6);
    it.q = `${nm} wrote:`; it.working = `${termH(a, f)} + ${termH(b, g)} = ${a + b}${Lt([f, g].sort().join(""))}`;
    it.ask = "What went wrong?";
    opts = [ { h:`${G(f)} and ${G(g)} are different groups, so they can't be counted together: it stays ${eqS(`${termH(a, f)} + ${termH(b, g)}`)}`, ok:true },
             { h:`Nothing — that is right`, ok:false },
             { h:`It should be ${eqS(`${a * b}${Lt([f, g].sort().join(""))}`)}`, ok:false },
             { h:`It should be ${eqS(termH(a + b, f))}`, ok:false } ];
    why = `Groups of ${G(f)} and groups of ${G(g)} are different sizes. Unlike terms stay apart: ${eqS(`${termH(a, f)} + ${termH(b, g)}`)}.`;
  } else {
    const f = letter(), a = R(4, 9);
    it.q = `${nm} wrote:`; it.working = `${termH(a, f)} ${MINUS} ${Lt(f)} = ${a}`;
    it.ask = "What went wrong?";
    opts = [ { h:`${G(f)} on its own is 1 group of ${G(f)}, so it is ${eqS(termH(a - 1, f))}`, ok:true },
             { h:`Nothing — that is right`, ok:false },
             { h:`It should be ${eqS(String(a - 1))}`, ok:false },
             { h:`It should be ${eqS(termH(a, f))}`, ok:false } ];
    why = `${eqS(`${termH(a, f)} ${MINUS} ${Lt(f)}`)} is ${a} groups take away 1 group: ${eqS(termH(a - 1, f))}.`;
  }
  it.steps = [ step("mc", { cat:"mistake", opts:shuffle(opts), why:() => why }) ];
  return it;
}
/* which are like terms? */
function qLike(level){
  const f = letter(), g = otherLetter(f), a = R(2, 9), b = R(2, 9), c = R(2, 9);
  const it = base(level);
  it.q = "Which two are like terms?";
  const two = [f, g].sort().join("");
  const opts = shuffle([ { h:eqS(`${termH(a, f)} and ${termH(b, f)}`), ok:true }, { h:eqS(`${termH(a, f)} and ${termH(a, g)}`), ok:false },
    { h:eqS(`${termH(c, f)} and ${c}${Lt(f)}²`), ok:false }, { h:eqS(`${termH(b, f)} and ${termH(b, two)}`), ok:false } ]);
  it.steps = [ step("mc", { cat:"like", opts, why:() => `Like terms are groups of exactly the same thing: ${eqS(`${termH(a, f)} and ${termH(b, f)}`)} are both groups of ${G(f)}. The number in front can be different.` }) ];
  return it;
}
/* simplify, the whole expression typed in: 4x + 2y + 3x = 7x + 2y */
function qExpr(level, terms){
  const it = base(level);
  it.q = "Simplify by collecting like terms.";
  it.tpl = [exprH(terms) + " =", { in:0, wide:true }];
  const ans = {}; terms.forEach(t => { ans[t.f] = (ans[t.f] || 0) + t.sign * t.c; });
  const order = []; terms.forEach(t => { if(!order.includes(t.f)) order.push(t.f); });
  const parts = order.filter(f => ans[f] !== 0).map((f, i) => {
    const v = ans[f], s = i === 0 ? (v < 0 ? MINUS : "") : (v < 0 ? ` ${MINUS} ` : " + ");
    return s + termH(Math.abs(v), f);
  });
  const answer = parts.join("") || "0";
  const groups = order.map(f => `${eqS(countsTxt(terms.filter(t => t.f === f)))} = ${ans[f]} ${gw(Math.abs(ans[f]))} of ${G(f)}`).join("; ");
  it.steps = [ step("expr", { cat:terms.some(t => t.f !== terms[0].f) ? "unlike" : "collect", ans, why:() => `${groups}. So it is ${eqS(answer)}.` }) ];
  it.answerTxt = answer;
  return it;
}
/* give the letter a value: count the groups first */
function qTry(level, terms, vals){
  const it = base(level);
  const names = Object.keys(vals);
  it.q = `If ${names.map(f => eqS(`${Lt(f)} = ${vals[f]}`)).join(" and ")}, what is ${eqS(exprH(terms))}?`;
  it.tpl = ["=", { in:0 }];
  const ans = terms.reduce((s, t) => s + t.sign * t.c * vals[t.f], 0);
  const coll = {}; terms.forEach(t => { coll[t.f] = (coll[t.f] || 0) + t.sign * t.c; });
  const short = names.map(f => `${coll[f]} ${X} ${vals[f]}`).join(" + ");
  it.steps = [ step("num", { cat:"value", ans:[ans], why:() => `Collect first: ${eqS(names.map(f => termH(coll[f], f)).join(" + "))}. Then ${eqS(`${short} = ${ans}`)}.` }) ];
  return it;
}
/* make your own: 12x as three different like terms */
function qBuild(level){
  const f = letter(), n = pick([10, 12, 15, 18, 20]);
  const it = base(level);
  it.q = `Write ${eqS(termH(n, f))} as the sum of <b>three</b> like terms, each with a different number of ${G(f)}s.`;
  it.tpl = [{ in:0, wide:true }, "= " + termH(n, f)];
  it.steps = [ step("build", { cat:"build", f, n, why:() => `Any three different counts that add to ${n} work, e.g. ${eqS(`${termH(1, f)} + ${termH(4, f)} + ${termH(n - 5, f)}`)}.` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Groups of a number, then the same picture with a letter. Two or three terms, all added. The model beside each one shows the groups." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"Groups taken away, a single group (x), a missing term and a classic mistake. The model is still there." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"No model. Unlike terms, two-letter groups (ab), big numbers, and giving the letter a value." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Two kinds of term at once, answers that cancel or go below zero, and making your own like terms." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set(); NAMEBAG = [];
  const nG = (lo, hi) => numG(lo, hi);
  const ct = (n, k, take, one) => countsFor(n, k, take, one);
  if(level === "sweet"){
    return [
      qCount(level, withF(ct(R(5, 8), 2), nG(3, 9))),
      qCount(level, withF(ct(R(6, 10), 3), nG(3, 9))),
      qValue(level, withF(ct(R(5, 9), 2), nG(3, 9))),
      qCollect(level, withF(ct(R(5, 9), 2), letter())),
      qCollect(level, withF(ct(R(6, 10), 3, false, true), letter())),
      qSame(level, withF(ct(R(5, 9), 2), nG(3, 9))),
      qCollect(level, withF(ct(R(6, 10), 3), letter())),
      qValue(level, withF(ct(R(6, 10), 3), nG(3, 9))),
      qCollect(level, withF(ct(R(5, 10), 2, false, true), letter())),
      qCollect(level, withF(ct(R(7, 10), 3), letter()))
    ];
  }
  if(level === "mild"){
    const mt = (n, k) => { const t = withF(ct(n, k), letter()); return qMissing(level, t, R(0, k - 1)); };
    const mtTake = n => { const t = withF(ct(n, 3, true), letter()); return qMissing(level, t, t.findIndex(x => x.sign < 0)); };
    return [
      qCollect(level, withF(ct(R(8, 13), 3, false, true), letter())),
      qCollect(level, withF(ct(R(5, 10), 3, true), letter())),
      mt(R(7, 12), 2),
      qValue(level, withF(ct(R(6, 10), 3, true), nG(4, 12))),
      qMistake(level, "square"),
      qCollect(level, withF(ct(R(10, 15), 4, false, true), letter())),
      mtTake(R(4, 8)),
      qCollect(level, withF(ct(R(6, 12), 4, true, true), letter())),
      mt(R(9, 14), 3),
      qValue(level, withF(ct(R(5, 10), 2), nG(13, 25)), "Work it out. Count the groups first — it's quicker.")
    ];
  }
  const unlike = (n, k, take, f, gc) => {
    const ts = withF(ct(n, k, take, true), f), g = otherLetter(f);
    const at = R(1, ts.length);
    ts.splice(at, 0, { c:gc || R(2, 6), sign:1, f:g });
    return ts;
  };
  if(level === "medium"){
    const f1 = letter(), f2 = letter(true), f3 = letter();
    const miss = (() => { const f = letter(), ts = unlike(R(7, 12), 2, false, f); let at = -1; ts.forEach((t, i) => { if(i > 0 && t.f === f) at = i; }); return { ts, at:at < 0 ? 0 : at }; })();
    const mIt = qMissing(level, miss.ts, miss.at, { model:false, mt:null });
    const tf = letter();
    return [
      qExpr(level, unlike(R(6, 11), 2, false, f1)),
      qCollect(level, withF(ct(R(7, 12), 3, false, true), f2), { model:false, mt:null }),
      qLike(level),
      qValue(level, withF(ct(10, 2), nG(23, 79)), "Work it out. Count the groups first."),
      qExpr(level, unlike(R(4, 9), 2, true, f3)),
      qMistake(level, "xy"),
      mIt,
      qExpr(level, unlike(R(5, 10), 3, true, letter())),
      qTry(level, withF(ct(R(6, 10), 3), tf), { [tf]:R(3, 9) }),
      qExpr(level, unlike(R(7, 12), 2, false, letter(true)))
    ];
  }
  /* spicy: two kinds of term, each in more than one place */
  const two = (fa, fb, opts) => {
    opts = opts || {};
    const A = withF(ct(opts.na || R(6, 12), 2, !!opts.takeA, true), fa);
    const B = withF(opts.cancelB ? [{ c:opts.cancelB, sign:1 }, { c:opts.cancelB, sign:-1 }] : ct(opts.nb || R(4, 9), 2, !!opts.takeB, true), fb);
    const out = [A[0], B[0], A[1], B[1]];
    if(out[0].sign < 0){ const i = out.findIndex(t => t.sign > 0); [out[0], out[i]] = [out[i], out[0]]; }
    return out;
  };
  const fa = letter(), fb = otherLetter(fa);
  const ta = letter(), tb = otherLetter(ta);
  const neg = (() => { const f = letter(), g = otherLetter(f); const b1 = R(2, 5), b2 = b1 + R(2, 5); return [{ c:R(2, 6), sign:1, f:g }, { c:R(3, 8), sign:1, f }, { c:b2, sign:-1, f:g }, { c:b1 > 2 ? b1 : 3, sign:1, f:g }]; })();
  const miss = (() => { const f = letter(), g = otherLetter(f); const ts = [{ c:R(3, 7), sign:1, f }, { c:R(2, 5), sign:1, f:g }, { c:R(3, 7), sign:1, f }]; return qMissing(level, ts, 0, { model:false, mt:null }); })();
  const xy = (() => { const f = letter(), g = otherLetter(f), fg = [f, g].sort().join(""); return [{ c:R(2, 6), sign:1, f:fg }, { c:R(2, 6), sign:1, f }, { c:R(2, 6), sign:1, f:fg }]; })();
  return [
    qExpr(level, two(fa, fb)),
    qExpr(level, two(letter(), letter(), { takeA:true, takeB:true })),
    qMistake(level, "lone"),
    qExpr(level, xy),
    miss,
    qTry(level, [{ c:R(2, 5), sign:1, f:ta }, { c:R(2, 5), sign:1, f:tb }, { c:R(2, 6), sign:1, f:ta }], { [ta]:R(2, 9), [tb]:R(2, 9) }),
    qBuild(level),
    qExpr(level, neg),
    qExpr(level, two(letter(), letter(), { cancelB:R(2, 6) })),
    qExpr(level, two(letter(true), letter(), { takeA:true }))
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
/* an expression typed by a student: 7x + 2y, 2y+7x, 7*x, -3a + b; letters in a term may be in any order */
function parseExpr(raw){
  let s = String(raw == null ? "" : raw).toLowerCase().replace(/[−–—]/g, "-").replace(/[×*·]/g, "").replace(/\s+/g, "");
  if(!s) return { empty:true };
  if(/[\^²³]/.test(s)) return { err:"No powers are needed here." };
  if(!/^[+-]?(\d*[a-z]+|\d+)([+-](\d*[a-z]+|\d+))*$/.test(s)) return { err:"Type it like 7x + 2y." };
  const terms = []; const re = /([+-]?)(\d*)([a-z]*)/g; let m;
  while((m = re.exec(s)) && m[0] !== ""){
    const sign = m[1] === "-" ? -1 : 1, key = m[3].split("").sort().join("");
    const one = m[2] === "1" && key;
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
  if(s.t === "expr"){
    const p = parseExpr(s.vals[0]);
    if(p.empty) return { invalid:"Type your answer first." };
    if(p.err) return { invalid:p.err };
    const want = {}; Object.keys(s.ans).forEach(k => { want[k.split("").sort().join("")] = s.ans[k]; });
    const eq = sameMap(p.map, want);
    if(eq){
      /* equal, but not in its simplest form: a nudge, not a mark */
      const keys = p.terms.map(t => t.key);
      if(new Set(keys).size !== keys.length) return { invalid:"That's equal, but some like terms haven't been collected yet." };
      if(p.terms.some(t => t.c === 0)) return { invalid:"Leave out any term with 0 groups." };
      if(p.terms.some(t => t.one)) return { invalid:"Write 1x as just x." };
    }
    return { ok:eq, marks:[eq], fix:eq ? null : s.why() };
  }
  if(s.t === "build"){
    const p = parseExpr(s.vals[0]);
    if(p.empty) return { invalid:"Type your answer first." };
    if(p.err) return { invalid:p.err };
    if(p.terms.length !== 3) return { invalid:"Use exactly three terms." };
    const ok = p.terms.every(t => t.key === s.f && t.c > 0) && new Set(p.terms.map(t => t.c)).size === 3 && p.terms.reduce((a, t) => a + t.c, 0) === s.n;
    return { ok, marks:[ok], fix:ok ? null : `Three terms, all groups of ${G(s.f)}, each a different number, adding to ${s.n}. ` + s.why() };
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
  if(s.first === null) return it.model && s.t !== "mc" ? setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>The groups are drawn ${stacked() ? "below" : "on the right"} if it helps</span>`, "hint") : setPrompt("", "");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}
function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(s.t !== "mc"){
    const m = s.marks ? (s.marks[0] ? " right" : " wrong") : "", v = s.vals[0] == null ? "" : s.vals[0];
    const wide = s.t !== "num";
    return `<div class="ansEq">` + it.tpl.map(p => typeof p === "string"
      ? `<span class="eqt">${p}</span>`
      : `<input class="cell ans${wide ? " wide" : ""}${m}" data-i="0" ${wide ? 'inputmode="text" autocapitalize="off" spellcheck="false"' : 'inputmode="numeric"'} autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="Your answer"${wide ? ' placeholder="type it here"' : ""}>`).join("") + `</div>`
      + (locked && !(s.marks && s.marks[0]) && it.answerTxt ? `<div class="ansShow">The answer: ${eqS(it.answerTxt)}</div>` : "");
  }
  return `<div class="mcList">` + s.opts.map((o, i) => {
    const st = s.marks && s.marks[i] != null ? (s.marks[i] ? " right" : " wrong") : "";
    const show = locked && o.ok ? " right" : "";
    return `<button class="mcOpt${s.sel === i ? " on" : ""}${st || show}" type="button" data-opt="${i}"${locked ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${o.h}</span></button>`;
  }).join("") + `</div>`;
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
  $("app").classList.toggle("noModel", !it.model);
  fitEq();
  paintBoardHead();
  fitBoard();
  drawModel();
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = S.i === S.items.length - 1 ? "Finish →" : "Next →";
  $("nextBtn").classList.toggle("ready", !!it.settled);
}
/* the line of maths with the answer box stays on ONE line: it shrinks until it fits */
function fitEq(){
  const e = $("qCard").querySelector(".ansEq"); if(!e) return;
  e.style.fontSize = "";
  let f = parseFloat(getComputedStyle(e).fontSize), k = 0;
  while(e.scrollWidth > e.clientWidth + 1 && f > 15 && k++ < 30){ f *= .94; e.style.fontSize = f + "px"; }
}
function bindCard(){
  const card = $("qCard"), it = cur(), s = it.steps[0];
  card.querySelectorAll("input[data-i]").forEach(inp => {
    inp.addEventListener("input", () => { s.vals[0] = inp.value; inp.classList.remove("right", "wrong"); });
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      if(s.last || s.skipped){ next(); return; }
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
    /* a wrong first answer: the model shows the whole story */
    if(!res.ok && it.model){ stopAnim(); it.mStep = mSteps(it).length - 1; }
    if(res.ok) confetti(1);
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  paint();
  if(res.ok) $("nextBtn").focus({ preventScroll:true }); else focusAnswer();
}
function next(){
  const it = cur();
  if(!it.settled){
    it.steps.forEach(s => { if(s.first === null){ s.first = false; s.last = false; s.skipped = true; } });
    it.settled = true; it.correct = false;
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  stopAnim();
  if(S.i < S.items.length - 1){ S.i++; paint(); focusAnswer(); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}

/* =====================================================================
   THE PANEL — the teaching tool's bars, built from the question
   step 0: one column of bars under each term (one bar = one group)
   step 1: the bars stack into one pile, braces count each term
   step 2: (a term taken away) its bars land on the top of the pile and go
   The pile's count is "?" until the question is settled.
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const UI = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const cv = document.createElement("canvas").getContext("2d");
function tw(txt, px, fam, wt){ cv.font = `${wt || 500} ${px}px ${fam || '"Cambria Math","STIX Two Math","Times New Roman",serif'}`; return cv.measureText(txt).width; }
const lab = f => isNum(f) ? String(f) : (MATH_ALPHA ? mathItalic(f) : f);
function mSteps(it){
  const mt = it.mt, out = [{ t:"The groups", id:"draw" }, { t:"Put them together", id:"collect" }];
  if(mt.terms.some(t => t.sign < 0 && !t.miss)) out.push({ t:"Take some away", id:"take" });
  return out;
}
function layoutModel(it){
  const mt = it.mt;
  const cw = Math.max(200, svg.clientWidth), ch = Math.max(200, svg.clientHeight);
  let W = Math.max(460, cw); const sc = cw / W; const H = ch / sc;
  svg.setAttribute("viewBox", `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
  const capF = Math.max(13 / sc, Math.min(26, W / 24));
  const base = H - capF * 2 - 8;
  const n = mt.terms.length;
  const caps = mt.terms.map(t => t.miss ? (isNum(mt.f) ? `? × ${mt.f}` : "?" + mt.f) : plainT(t.c, mt.f));
  const marg = 16, sg = Math.max(22, capF * 1.5);
  let f = capF, Lk = 100;
  for(let k = 0; k < 30; k++){
    const free = W - 2 * marg - (n - 1) * sg;
    Lk = Math.min(W * .3, 240, free / n * .92);
    const need = caps.reduce((s, c) => s + Math.max(Lk, tw(c, f) * 1.05), 0);
    if(need <= free || f < 12 / sc) break;
    f *= .93;
  }
  const lblF = Math.max(13 / sc, Math.min(24, W / 30));
  const lbl = tw("20 groups of 99", lblF * 1.1, null, 800) + 34;
  const take = mt.terms.some(t => t.sign < 0 && !t.miss);
  const stackFree = (W - 2 * marg - 60 - lbl - (take ? 40 : 0)) / (take ? 2 : 1);
  Lk = Math.max(28, Math.min(Lk, stackFree));
  const pos = mt.terms.filter(t => t.sign > 0 && !t.miss).reduce((s, t) => s + t.c, 0);
  const missPos = mt.terms.find(t => t.miss && t.sign > 0);
  const pile = missPos ? mt.total : pos;
  const colRows = Math.max(...mt.terms.map(t => t.miss ? 1 : t.c));
  const rows = Math.max(colRows, pile);
  const pitch = Math.max(6, Math.min(40, (base - 30) / rows));
  const bh = Math.max(4, pitch - Math.max(2, pitch * .17));
  const slots = caps.map(c => Math.max(Lk, tw(c, f) * 1.05));
  const tot = slots.reduce((s, x) => s + x, 0) + (n - 1) * sg;
  let x = (W - tot) / 2; const colC = [];
  slots.forEach(w => { colC.push(x + w / 2); x += w + sg; });
  const parts = 60 + Lk + lbl + (take ? 40 + Lk : 0);
  const pileX = Math.max(marg, (W - parts) / 2) + 60;
  L = { W, H, base, capF:f, lblF, Lk, pitch, bh, colC, slots, sg, caps, pileX, takeX:pileX + Lk + lbl + 40, pos, pile };
  return L;
}
const barY = r => L.base - (r + 1) * L.pitch + (L.pitch - L.bh);
const SHADE_S = ["#4ade80", "#22c55e", "#34d399"], SHADE_P = ["#bbf7d0", "#d1fae5", "#a7f3d0"];
function svgGrp(f, col){ return `<tspan fill="${col}"${!isNum(f) && !MATH_ALPHA ? ' font-style="italic"' : ""}>${esc(lab(f))}</tspan>`; }
function sceneOf(it, id){
  const mt = it.mt, ids = mSteps(it).map(s => s.id), at = ids.indexOf(id);
  const has = s => { const k = ids.indexOf(s); return k > -1 && k <= at; };
  const stackedNow = has("collect"), taken = has("take"), els = [];
  const pos = mt.terms.map((t, i) => ({ t, i })).filter(o => o.t.sign > 0 && !o.t.miss);
  let r = 0; const start = {};
  pos.slice().reverse().forEach(o => { start[o.i] = r; r += o.t.c; });
  const missPos = mt.terms.findIndex(t => t.miss && t.sign > 0), missNeg = mt.terms.findIndex(t => t.miss && t.sign < 0);
  const units = isNum(mt.f) && mt.f <= 12 ? mt.f : 0;
  mt.terms.forEach((t, i) => {
    const pIdx = pos.findIndex(o => o.i === i);
    const shade = t.sign < 0 ? "#fecaca" : (pIdx % 2 ? SHADE_P : SHADE_S)[Math.floor(Math.max(0, pIdx) / 2) % 3];
    if(t.miss){
      /* the missing term: one dashed "?" bar in its column */
      els.push({ key:`m${i}`, type:"bar", x:L.colC[i] - L.Lk / 2, y:barY(0), w:L.Lk, h:L.bh, o:stackedNow ? 0 : 1, fill:"#fff", stroke:t.sign < 0 ? "#dc2626" : "#64748b", dash:true, lab:"?", lc:"#334155", units:0 });
      return;
    }
    for(let j = 0; j < t.c; j++){
      const e = { key:`b${i}_${j}`, type:"bar", w:L.Lk, h:L.bh, lab:lab(mt.f), units, o:1, fill:shade,
        stroke:t.sign < 0 ? "#dc2626" : "#15803d", lc:t.sign < 0 ? "#991b1b" : "#14532d", x:L.colC[i] - L.Lk / 2, y:barY(j), d:.3 * i / Math.max(1, mt.terms.length) + .01 * j };
      if(stackedNow){
        if(t.sign > 0){ e.x = L.pileX; e.y = barY(start[i] + j); }
        else { e.x = L.takeX; e.y = barY(j); }
      }
      if(taken && t.sign < 0){ e.x = L.pileX; e.y = barY(L.pos - 1 - j); e.o = 0; e.late = true; e.d = .05 * j; }
      els.push(e);
    }
  });
  const left = countOf(mt.terms.filter(t => !t.miss));
  if(taken){
    els.forEach(e => {
      const m = /^b(\d+)_(\d+)$/.exec(e.key); if(!m) return;
      const t = mt.terms[+m[1]]; if(t.sign < 0) return;
      const row = start[+m[1]] + +m[2];
      if(row >= left){ e.fill = "#fff"; e.stroke = "#fca5a5"; e.dash = true; e.lc = "#fca5a5"; e.o = .55; e.units = 0; e.late = true; }
    });
  }
  if(!stackedNow){
    mt.terms.forEach((t, i) => {
      els.push({ key:"cap" + i, type:"text", x:L.colC[i], y:L.base + L.capF * 1.35, o:1, size:L.capF, html:capH(t, mt.f) });
      if(i > 0) els.push({ key:"sg" + i, type:"text", x:L.colC[i] - L.slots[i] / 2 - L.sg / 2, y:L.base + L.capF * 1.35, o:1, size:L.capF * 1.1,
        html:`<tspan fill="${t.sign < 0 ? "#dc2626" : "#334155"}">${t.sign < 0 ? "−" : "+"}</tspan>` });
    });
    return els;
  }
  /* the pile */
  pos.forEach(o => {
    const y1 = barY(start[o.i] + o.t.c - 1) - 1, y2 = barY(start[o.i]) + L.bh + 1;
    els.push({ key:"bb" + o.i, type:"brace", x:L.pileX - 8, y1, y2, dir:-1, o:taken ? .35 : 1, col:"#2563eb", d:.5 });
    els.push({ key:"bt" + o.i, type:"text", x:L.pileX - 30, y:(y1 + y2) / 2 + L.lblF * .34, o:taken ? .35 : 1, size:L.lblF, anchor:"end", html:`<tspan fill="#1d4ed8">${o.t.c}</tspan>`, d:.5 });
  });
  const rx = L.pileX + L.Lk + 8;
  if(missPos > -1){
    /* empty slots on top of the pile, up to the total: how many more groups? */
    for(let k = L.pos; k < mt.total; k++) els.push({ key:"e" + k, type:"bar", x:L.pileX, y:barY(k), w:L.Lk, h:L.bh, o:1, fill:"#fff", stroke:"#94a3b8", dash:true, lab:"", units:0, d:.4 + .02 * (k - L.pos) });
    const y1 = barY(mt.total - 1) - 1, y2 = barY(L.pos) + L.bh + 1;
    els.push({ key:"bq", type:"brace", x:L.pileX - 8, y1, y2, dir:-1, o:1, col:"#64748b", d:.55 });
    els.push({ key:"bqt", type:"text", x:L.pileX - 30, y:(y1 + y2) / 2 + L.lblF * .34, o:1, size:L.lblF, anchor:"end", html:`<tspan fill="#334155">?</tspan>`, d:.55 });
    els.push({ key:"rb", type:"brace", x:rx, y1:barY(mt.total - 1) - 1, y2:L.base, dir:1, o:1, col:"#1d4ed8", d:.55 });
    els.push({ key:"rl", type:"text", x:rx + 26, y:(barY(mt.total - 1) + L.base) / 2 + L.lblF * .36, o:1, size:L.lblF * 1.1, anchor:"start", html:countH(mt.total, mt.f), d:.6 });
    return els;
  }
  if(missNeg > -1){
    /* groups taken away to leave the total: the ones that go are outlined red */
    els.forEach(e => {
      const m = /^b(\d+)_(\d+)$/.exec(e.key); if(!m) return;
      const t = mt.terms[+m[1]]; if(t.sign < 0) return;
      if(start[+m[1]] + +m[2] >= mt.total){ e.fill = "#fff"; e.stroke = "#dc2626"; e.dash = true; e.lc = "#fca5a5"; e.units = 0; }
    });
    const y1 = barY(L.pos - 1) - 1, y2 = barY(mt.total) + L.bh + 1;
    els.push({ key:"rq", type:"brace", x:rx, y1, y2, dir:1, o:1, col:"#dc2626", d:.55 });
    els.push({ key:"rqt", type:"text", x:rx + 26, y:(y1 + y2) / 2 + L.lblF * .34, o:1, size:L.lblF, anchor:"start", html:`<tspan fill="#dc2626">? taken away</tspan>`, fam:UI, d:.55 });
    els.push({ key:"rb", type:"brace", x:rx, y1:barY(mt.total - 1) - 1, y2:L.base, dir:1, o:1, col:"#1d4ed8", d:.55 });
    els.push({ key:"rl", type:"text", x:rx + 26, y:(barY(mt.total - 1) + L.base) / 2 + L.lblF * .36, o:1, size:L.lblF * 1.1, anchor:"start", html:countH(mt.total, mt.f), d:.6 });
    return els;
  }
  const yTop = (taken ? barY(left - 1) : barY(L.pos - 1)) - 1, nNow = taken ? left : L.pos;
  const show = it.settled;
  els.push({ key:taken ? "rb2" : "rb", type:"brace", x:rx, y1:yTop, y2:L.base, dir:1, o:1, col:"#1d4ed8", d:.55 });
  els.push({ key:(taken ? "rl2" : "rl") + (show ? "s" : ""), type:"text", x:rx + 26, y:(yTop + L.base) / 2 + L.lblF * .36, o:1, size:L.lblF * 1.1, anchor:"start",
    html:countH(show ? nNow : "?", mt.f), d:.6 });
  if(mt.terms.some(t => t.sign < 0) && !taken){
    els.push({ key:"tl", type:"text", x:Math.min(L.W - 60, L.takeX + L.Lk / 2), y:L.base + L.capF * 1.35, o:1, size:L.capF * .78, fam:UI,
      html:`<tspan fill="#dc2626" font-weight="800">take away ${mt.terms.find(t => t.sign < 0).c}</tspan>`, d:.6 });
  }
  return els;
}
function capH(t, f){
  const C = t.miss ? `<tspan fill="#334155">?</tspan>` : `<tspan fill="#1d4ed8">${t.c}</tspan>`;
  if(isNum(f)) return `${C}<tspan fill="#334155"> × </tspan>${svgGrp(f, "#15803d")}`;
  return (!t.miss && t.c === 1 ? "" : C) + svgGrp(f, "#15803d");
}
function countH(n, f){
  return `<tspan fill="#1d4ed8">${n}</tspan><tspan fill="#64748b" style='font-family:${UI}' font-weight="800" font-size="${(L.lblF * .76).toFixed(1)}"> ${n === 1 ? "group" : "groups"} of </tspan>${svgGrp(f, "#15803d")}`;
}
/* drawing (the teaching tool's) */
const easeC = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
function brace(x, y1, y2, dir){
  let w = Math.min(9, (y2 - y1) / 4); if(w < 1.5) w = 1.5;
  const m = (y1 + y2) / 2, b = x + dir * w, tip = x + 2 * dir * w;
  return `M${x} ${y1}Q${b} ${y1} ${b} ${y1 + w}L${b} ${m - w}Q${b} ${m} ${tip} ${m}Q${b} ${m} ${b} ${m + w}L${b} ${y2 - w}Q${b} ${y2} ${x} ${y2}`;
}
function drawEls(list){
  let bars = "", over = "";
  list.forEach(e => {
    if(e.o <= .004) return;
    if(e.type === "bar"){
      const rx = Math.min(5, e.h * .3);
      let s = `<g opacity="${e.o.toFixed(3)}"><rect x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" width="${e.w.toFixed(1)}" height="${e.h.toFixed(1)}" rx="${rx}" fill="${e.fill}" stroke="${e.stroke}" stroke-width="1.6"${e.dash ? ' stroke-dasharray="5 4"' : ""}/>`;
      if(e.units > 1 && e.w / e.units >= 5 && e.h >= 6){
        let p = ""; for(let k = 1; k < e.units; k++){ const xx = e.x + e.w * k / e.units; p += `M${xx.toFixed(1)} ${(e.y + 1.5).toFixed(1)}V${(e.y + e.h - 1.5).toFixed(1)}`; }
        s += `<path d="${p}" stroke="${e.stroke}" stroke-opacity=".38" stroke-width="1.1"/>`;
      }
      if(e.h >= 11 && e.lab){
        const fs = Math.min(e.h * .78, 24, e.w * .42);
        const it = /^[a-z]+$/.test(e.lab) ? ' font-style="italic"' : "";
        s += `<text x="${(e.x + e.w / 2).toFixed(1)}" y="${(e.y + e.h / 2 + fs * .34).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" fill="${e.lc}"${it} stroke="${e.dash ? "none" : "#fff"}" stroke-width="${e.units > 1 ? 3.2 : 0}" stroke-opacity=".85" paint-order="stroke">${esc(e.lab)}</text>`;
      }
      bars += s + "</g>";
    } else if(e.type === "text"){
      over += `<text x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" opacity="${e.o.toFixed(3)}" text-anchor="${e.anchor || "middle"}" font-size="${e.size.toFixed(1)}"${e.fam ? ` style='font-family:${e.fam}'` : ""}>${e.html}</text>`;
    } else if(e.type === "brace"){
      over += `<path d="${brace(e.x, e.y1, e.y2, e.dir)}" fill="none" stroke="${e.col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="${e.o.toFixed(3)}"/>`;
    }
  });
  svg.innerHTML = bars + over;
}
function mix(A, B, T){
  const out = [], mapA = new Map(A.map(e => [e.key, e])), span = .58;
  B.forEach(b => {
    const a = mapA.get(b.key); mapA.delete(b.key);
    const d = Math.min(.42, b.d || 0), t = easeC(clamp((T - d) / span, 0, 1));
    if(!a){ out.push(Object.assign({}, b, { o:b.o * t })); return; }
    const late = (b.late && !a.late) || (a.late && !b.late);
    const tc = late ? clamp((t - .62) / .38, 0, 1) : t;
    const e = Object.assign({}, tc < .5 ? a : b);
    ["x", "y", "w", "h", "y1", "y2"].forEach(p => { if(typeof a[p] === "number" && typeof b[p] === "number") e[p] = lerp(a[p], b[p], t); });
    if(typeof a.o === "number" && typeof b.o === "number") e.o = lerp(a.o, b.o, tc);
    out.push(e);
  });
  mapA.forEach(a => { const t = easeC(clamp(T / span, 0, 1)); out.push(Object.assign({}, a, { o:a.o * (1 - t) })); });
  return out;
}
function drawModel(){
  const it = cur(); if(!it || !it.model){ svg.innerHTML = ""; return; }
  layoutModel(it);
  const ids = mSteps(it).map(s => s.id);
  if(ANIM){
    const T = clamp((performance.now() - ANIM.t0) / ANIM.dur, 0, 1);
    drawEls(mix(sceneOf(it, ANIM.from), sceneOf(it, ANIM.to), T));
    if(T < 1){ raf = requestAnimationFrame(drawModel); return; }
    ANIM = null; paintBoardHead();
  }
  drawEls(sceneOf(it, ids[it.mStep]));
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); ANIM = null; } }
function goModel(k){
  const it = cur(); if(!it || !it.model) return;
  const ids = mSteps(it).map(s => s.id);
  k = clamp(k, 0, ids.length - 1); if(k === it.mStep) return;
  const from = ids[it.mStep];
  stopAnim(); it.mStep = k;
  if(!reduceMotion) ANIM = { from, to:ids[k], t0:performance.now(), dur:from === "draw" || ids[k] === "draw" ? 1400 : 1000 };
  paintBoardHead(); drawModel();
}
function paintBoardHead(){
  const it = cur(), box = $("stepBox");
  if(!it || !it.model){ box.hidden = true; $("viewTag").textContent = "Model"; return; }
  const st = mSteps(it);
  box.hidden = false;
  $("viewTag").textContent = isNum(it.mt.f) ? `Groups of ${it.mt.f}` : `Groups of ${MATH_ALPHA ? mathItalic(it.mt.f) : it.mt.f}`;
  $("stepCap").innerHTML = `<b>${it.mStep + 1}/${st.length}</b>${st[it.mStep].t}`;
  $("mBack").disabled = it.mStep === 0;
  $("mNext").disabled = it.mStep >= st.length - 1;
}
$("mNext").addEventListener("click", () => { const it = cur(); if(it) goModel(it.mStep + 1); });
$("mBack").addEventListener("click", () => { const it = cur(); if(it) goModel(it.mStep - 1); });

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
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fitEq(); fitBoard(); if(cur()) drawModel(); }); };
window.addEventListener("resize", onResize);
if(window.ResizeObserver){ const ro = new ResizeObserver(onResize); ro.observe($("boardWrap")); }

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { count:"Write it as one multiplication", value:"Count the groups, then work it out", collect:"Collect like terms", take:"Take groups away",
  missing:"Find a missing term", same:"Which is the same?", mistake:"Spot the mistake", like:"Which are like terms?", unlike:"Unlike terms", build:"Make your own" };
const CATS = ["count","value","collect","take","missing","same","like","unlike","mistake","build"];
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
  stopAnim();
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.settled = true; it.correct = false; it.steps.forEach(s => { if(s.first === null) s.first = false; }); } });
  const { s, pct } = renderCert(), L0 = lv();
  $("progressFill").style.width = "100%";
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts. Skills in the object shape,
     so "where marks were lost" gets its labels with no SKILL_LABELS edit. */
  const types = CATS.filter(c => s.cats[c]).map(c => ({ typeId:"ng-" + c, label:CAT_NAMES[c], correct:s.cats[c][0], total:s.cats[c][1] })).concat(["level:" + S.levelKey]);
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
  stopAnim();
  S.levelKey = k; S.items = buildPaper(k); S.i = 0;
  $("levelModal").classList.remove("open"); $("certModal").classList.remove("open");
  const chip = $("levelChip"); chip.hidden = false; chip.className = "lvlChip " + k; chip.textContent = LEVELS[k].name;
  if(window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset();
  paint(); focusAnswer();
}
$("nextBtn").addEventListener("click", next);
$("prevBtn").addEventListener("click", () => { if(S.i > 0){ stopAnim(); S.i--; paint(); } });
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
window.__NGQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, parseExpr, mSteps, goModel, sceneOf, MATH_ALPHA,
  get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
