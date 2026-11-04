/* =====================================================================
   FRACTION OF AN AMOUNT — STUDENT QUIZ (2026-11-04)
   ---------------------------------------------------------------------
   The Area quizzes' pattern: the card on the left is ONE question and ONE
   answer; the panel on the right is the teaching tool's bar, built from
   the question's own numbers, stepped with ◀ / Show me ▸:
       the whole → cut into b equal parts → (a > 1) shade a of them
   ("Which is the same?" shows the whole only — cutting it would give the
   matching option away.)
   It is never required, never marked, and it NEVER shows a value: the
   parts carry their names (⅕) and, once cut, a box the student can type
   into — typing in one part fills EVERY part, because the parts are equal.
   Sweet also draws the ones, so one part can be counted.
   A wrong first answer jumps the model to its last step.

   The ladder:
     Sweet  unit fractions — halves, quarters, fifths, tenths; one part 2–6;
            ⅕ of 20 and 20 ÷ 5; the ones on the bar
     Mild   unit fractions to tenths (+ thirds, sixths, eighths); one part to
            12; ⅙ of 42, 42 ÷ 6 and 42/6; "which is the same?"; one question
            back to the whole
     Medium more than one part, written all five ways: ⅗ of 30, 3 × ⅕ of 30,
            3 × (30 ÷ 5), (30 ÷ 5) × 3, 30/5 × 3; "which is the same?" both
            directions; a word problem
     Spicy  any fraction to twelfths, one part to 25 (amounts to 300), mixed
            forms, back to the whole, word problems

   Marking: only the FIRST check scores; Check again lets them fix it; an
   empty check is free; Next on an unanswered question counts it wrong.
   Nothing typed is ever saved — only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"fraction-of-amount-division-student-quiz", title:"Fraction of an Amount", mastery:"fraction-of-amount-division" };
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const gcd = (x, y) => y ? gcd(y, x % y) : x;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const X = "×", D = "÷";

/* ---------------------------------------------------------- notation (colour = role, as on the tool) */
const N_ = n => `<span class="cn">${n}</span>`, B_ = b => `<span class="cb">${b}</span>`, A_ = a => `<span class="ca">${a}</span>`, V_ = v => `<span class="cv">${v}</span>`;
const fr = (t, b) => `<span class="frac"><span>${t}</span><span>${b}</span></span>`;
const of = '<span class="of">of</span>';
/* the five ways to write a × (n ÷ b), plus the two unit-fraction ones */
function formHTML(it, form, plain){
  const a = plain ? it.a : A_(it.a), b = plain ? it.b : B_(it.b), n = plain ? it.n : N_(it.n), one = plain ? 1 : A_(1);
  switch(form){
    case "frac":  return `${fr(a, b)} ${of} ${n}`;
    case "unit":  return `${a} ${X} ${fr(one, b)} ${of} ${n}`;
    case "ops":   return `${a} ${X} (${n} ${D} ${b})`;
    case "ops2":  return `(${n} ${D} ${b}) ${X} ${a}`;
    case "quot":  return `${fr(n, b)} ${X} ${a}`;
    case "div":   return `${n} ${D} ${b}`;
    case "quotU": return fr(n, b);
  }
}
const eqS = s => `<span class="eq">${s}</span>`;

/* ---------------------------------------------------------- building questions */
const LV = {
  sweet:  { set:[2,4,5,10],             lo:2, hi:6,  maxN:60 },
  mild:   { set:[2,3,4,5,6,8,10],       lo:3, hi:12, maxN:120 },
  medium: { set:[3,4,5,6,8,10],         lo:2, hi:10, maxN:100 },
  spicy:  { set:[3,4,5,6,7,8,9,10,11,12], lo:6, hi:25, maxN:300 }
};
let USED = new Set();
function makeFrac(level, o){
  o = o || {};
  const L0 = LV[level];
  for(let t = 0; t < 600; t++){
    const b = pick(o.unit ? L0.set : L0.set.filter(x => x >= 3));
    const co = []; for(let a = 2; a < b; a++) if(gcd(a, b) === 1) co.push(a);
    const a = o.unit ? 1 : (co.length ? pick(co) : 1);
    if(!o.unit && a === 1) continue;
    const v = R(L0.lo, L0.hi), n = b * v;
    if(n > L0.maxN) continue;
    const key = a + "/" + b + "/" + n;
    if(USED.has(key) && t < 450) continue;
    USED.add(key);
    return { a, b, n, v, ans:a * v };
  }
  return o.unit ? { a:1, b:5, n:20, v:4, ans:4 } : { a:3, b:5, n:30, v:6, ans:18 };
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:[], marks:null, fixText:null, sel:null }, o); }
const field = (lab, ans, unit, pre) => ({ lab, ans, unit:unit || "", pre:pre || "" });
function base(level, f, o){
  return Object.assign({ level, mStep:0, settled:false, correct:false, q:"", jot:"", ones:level === "sweet" && f.n <= 60, kind:"calc" }, f, o);
}
/* how the working is said, for each way of writing it */
function whyCalc(it, form){
  const { a, b, n, v, ans } = it;
  const one = `${n} ${D} ${b} = ${v}`;
  if(form === "div") return `Share ${n} into ${b} equal parts: ${eqS(one)}. That is the same as ${eqS(fr(1, b) + " of " + n)}.`;
  if(form === "quotU") return `The fraction line means divide: ${eqS(fr(n, b) + " = " + one)}.`;
  if(a === 1) return `Cut ${n} into ${b} equal parts — one part is ${eqS(one)}.`;
  if(form === "ops") return `Brackets first: ${eqS(one)}. Then ${eqS(`${a} ${X} ${v} = ${ans}`)}.`;
  if(form === "ops2") return `Brackets first: ${eqS(one)}. Then ${eqS(`${v} ${X} ${a} = ${ans}`)}.`;
  if(form === "quot") return `The fraction line means divide: ${eqS(one)}. Then ${eqS(`${v} ${X} ${a} = ${ans}`)}.`;
  if(form === "unit") return `${eqS(fr(1, b) + " of " + n)} is one part: ${eqS(one)}. ${a} of those is ${eqS(`${a} ${X} ${v} = ${ans}`)}.`;
  return `Cut ${n} into ${b} equal parts: ${eqS(one)}. Take ${a} of them: ${eqS(`${a} ${X} ${v} = ${ans}`)}.`;
}
/* work it out, in one of the forms */
function qCalc(level, f, form){
  const it = base(level, f, { form });
  it.expr = formHTML(it, form);
  it.long = ["ops", "ops2", "unit"].includes(form) || String(it.n).length > 2;
  it.steps = [ step("num", { cat:it.a === 1 ? "fa-unit" : "fa-nonunit", fields:[ field("", it.ans) ], why:() => whyCalc(it, form) }) ];
  return it;
}
/* which is the same? (plain ink — colour must not give it away) */
function qSame(level, f, dir){
  const it = base(level, f, { kind:"same" });
  const { a, b, n, ans } = it, P = form => formHTML(it, form, true);
  /* each option carries its value, so no wrong option can happen to equal the answer
     (½ of 4 is 2, and so is 4 − 2) */
  let stem, right, pool;
  if(a === 1){
    stem = dir === "quot" ? `Which of these is the same as ${eqS(fr(n, b))}?` : `Which of these is the same as ${eqS(P("frac"))}?`;
    right = { h:`${n} ${D} ${b}` };
    pool = [ { h:`${b} ${D} ${n}`, v:b / n }, { h:`${n} ${X} ${b}`, v:n * b }, { h:`${n} − ${b}`, v:n - b }, { h:`${n} + ${b}`, v:n + b }, { h:`${n} ${D} 2`, v:n / 2 } ];
  } else if(dir === "back"){
    const f2 = pick(["ops", "ops2", "quot"]);
    stem = `${eqS(P(f2))} is the same as …`;
    right = { h:P("frac") };
    pool = [ { h:`${fr(b, a)} ${of} ${n}`, v:b * n / a }, { h:`${fr(1, b)} ${of} ${n}`, v:n / b }, { h:`${fr(a, n)} ${of} ${b}`, v:a * b / n }, { h:`${fr(1, a)} ${of} ${n}`, v:n / a } ];
  } else {
    stem = `Which of these is the same as ${eqS(P("frac"))}?`;
    right = { h:P(pick(["ops", "ops2", "quot", "unit"])) };
    pool = [ { h:`${b} ${X} (${n} ${D} ${a})`, v:b * n / a }, { h:`${n} ${D} ${b}`, v:n / b }, { h:`${a} ${X} ${n}`, v:a * n }, { h:`${n} ${D} ${a}`, v:n / a }, { h:`(${n} ${D} ${b}) + ${a}`, v:n / b + a } ];
  }
  const seen = new Set([ans]), wrong = [];
  for(const o of pool){ if(wrong.length < 3 && Math.abs(o.v - ans) > 1e-9 && ![...seen].some(x => Math.abs(x - o.v) < 1e-9)){ wrong.push(o); seen.add(o.v); } }
  const opts = [Object.assign(right, { ok:true })].concat(wrong);
  it.q = stem;
  const why = a === 1 ? `${eqS(P("frac"))} means ${n} shared into ${b} equal parts: ${eqS(`${n} ${D} ${b}`)}.`
    : `${eqS(P("frac"))} means ${n} cut into ${b} equal parts (${eqS(`${n} ${D} ${b}`)}), then ${a} of them: ${eqS(P("ops"))}.`;
  it.steps = [ step("mc", { cat:"fa-same", opts:shuffle(opts).map(o => Object.assign({}, o, { h:eqS(o.h) })), why:() => why }) ];
  return it;
}
/* back to the whole: ⅗ of a number is 18 */
function qWhole(level, f){
  const it = base(level, f, { kind:"whole", ones:false });
  const { a, b, n, v, ans } = it;
  it.q = `${eqS(fr(A_(a), B_(b)))} of a number is ${eqS(A_(ans))}. What is the number?`;
  it.steps = [ step("num", { cat:"fa-whole", fields:[ field("The number =", n) ],
    why:() => a === 1 ? `One part is ${ans}, and the whole is ${b} parts: ${eqS(`${b} ${X} ${ans} = ${n}`)}.`
      : `${a} parts make ${ans}, so one part is ${eqS(`${ans} ${D} ${a} = ${v}`)}. The whole is ${b} parts: ${eqS(`${b} ${X} ${v} = ${n}`)}.` }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia","Eli","Isla"];
const CONTEXTS = [
  { t:"A bag holds {n} lollies. {N} eats {f} of them. How many lollies does {N} eat?", unit:"lollies" },
  { t:"{N} has ${n}. {N} spends {f} of it on a book. How much does the book cost?", pre:"$" },
  { t:"A book has {n} pages. {N} has read {f} of it. How many pages has {N} read?", unit:"pages" },
  { t:"A ribbon is {n} cm long. {f} of it is used to wrap a present. How much ribbon is used?", unit:"cm" },
  { t:"There are {n} students at the sports carnival. {f} of them are in blue team. How many students are in blue team?", unit:"students" },
  { t:"A farmer has {n} sheep. {f} of them are in the top paddock. How many sheep are in the top paddock?", unit:"sheep" },
  { t:"A water tank holds {n} L. It is {f} full. How many litres of water are in the tank?", unit:"L" },
  { t:"A bike trail is {n} km long. {N} has ridden {f} of it. How far has {N} ridden?", unit:"km", max:120 },
  { t:"A movie is {n} minutes long. {f} of it has played. How many minutes have played?", unit:"minutes", max:180 },
  { t:"{N} has {n} marbles. {f} of them are blue. How many blue marbles does {N} have?", unit:"marbles" }
];
let CTX = [], NM = [];
function qWord(level, f){
  const it = base(level, f, { kind:"word" });
  if(!CTX.length) CTX = shuffle(CONTEXTS);
  if(!NM.length) NM = shuffle(NAMES);
  let c = CTX.pop(); if(c.max && it.n > c.max) c = pick(CONTEXTS.filter(x => !x.max || it.n <= x.max));
  const name = NM.pop();
  it.q = esc(c.t).replace(/\{N\}/g, esc(name)).replace(/\{n\}/g, it.n).replace(/\{f\}/g, eqS(fr(A_(it.a), B_(it.b))));
  it.steps = [ step("num", { cat:"fa-word", fields:[ field("Answer =", it.ans, c.unit, c.pre) ], why:() => whyCalc(it, "frac") }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"One part of an amount: halves, quarters, fifths and tenths. The bar shows the ones, so you can count." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"One part, with bigger numbers — written as ⅙ of 42, 42 ÷ 6 and 42/6. One question works back to the whole." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"More than one part, written five ways: ⅗ of 30, 3 × ⅕ of 30, 3 × (30 ÷ 5), (30 ÷ 5) × 3 and 30/5 × 3." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Any fraction to twelfths, amounts up to 300, working back to the whole, and word problems." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set(); CTX = []; NM = [];
  const U = () => makeFrac(level, { unit:true }), F = () => makeFrac(level, {});
  const C = (f, form) => qCalc(level, f, form);
  if(level === "sweet") return [ C(U(), "frac"), C(U(), "frac"), C(U(), "div"), C(U(), "frac"), qSame(level, U()),
    C(U(), "frac"), C(U(), "div"), C(U(), "frac"), C(U(), "frac"), C(U(), "div") ];
  if(level === "mild") return [ C(U(), "frac"), C(U(), "div"), C(U(), "frac"), C(U(), "quotU"), qSame(level, U(), "quot"),
    C(U(), "frac"), C(U(), "div"), qWhole(level, U()), C(U(), "quotU"), C(U(), "frac") ];
  if(level === "medium") return [ C(F(), "frac"), C(F(), "unit"), C(F(), "ops"), qSame(level, F(), "fwd"), C(F(), "frac"),
    C(F(), "ops2"), C(F(), "quot"), qSame(level, F(), "back"), C(F(), "frac"), qWord(level, F()) ];
  return [ C(F(), "frac"), C(F(), "ops"), qWhole(level, F()), C(F(), "quot"), qWord(level, F()),
    C(F(), "unit"), qSame(level, F(), pick(["fwd", "back"])), C(F(), "ops2"), qWhole(level, F()), qWord(level, F()) ];
}

/* =====================================================================
   MARKING
   ===================================================================== */
function num(raw){
  const s = String(raw == null ? "" : raw).trim().toLowerCase().replace(/[$,]/g, "").replace(/[a-z²]+\.?$/g, "").trim();
  if(!s) return NaN;
  if(/^\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}
const empty = s => String(s == null ? "" : s).trim() === "";
function markStep(it, s){
  if(s.t === "num"){
    if(s.fields.some((f, i) => empty(s.vals[i]))) return { invalid:"Type your answer first." };
    if(s.fields.some((f, i) => isNaN(num(s.vals[i])))) return { invalid:"Type a number." };
    const marks = s.fields.map((f, i) => Math.abs(num(s.vals[i]) - f.ans) < 1e-9);
    const ok = marks.every(Boolean);
    return { ok, marks, fix:ok ? null : s.why() };
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
  if(s.first === null) return setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>Use the bar if it helps</span>`, "hint");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}
function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(s.t === "num") return `<div class="answers">` + s.fields.map((f, i) => {
    const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "", v = s.vals[i] == null ? "" : s.vals[i];
    const big = it.kind === "calc";
    const lab = big ? `<span class="lab">${eqS(it.expr)} <span class="eqSign">=</span></span>` : `<span class="lab">${f.lab}</span>`;
    return `<label class="ansRow${big ? " big" + (it.long ? " long" : "") : ""}">${lab}${f.pre ? `<span class="unit">${f.pre}</span>` : ""}<input class="cell ans${m}" data-i="${i}" inputmode="numeric" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="Your answer"><span class="unit">${f.unit}</span></label>`;
  }).join("") + `</div>`;
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
  h += answerHTML(it, s);
  h += `<div class="checkRow">` + (s.last || s.skipped ? "" : `<button class="checkBtn" type="button" data-check="0">${s.first === null ? "Check" : "Check again"}</button>`) + `</div>`;
  h += `<div class="fb" id="fb" aria-live="polite"></div></div>`;
  $("qCard").innerHTML = h;
  feedback(it);
  bindCard();
  redraw();
  if(fitBoard()) redraw();
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = S.i === S.items.length - 1 ? "Finish →" : "Next →";
  $("nextBtn").classList.toggle("ready", !!it.settled);
}
function bindCard(){
  const card = $("qCard"), it = cur(), s = it.steps[0];
  card.querySelectorAll("input[data-i]").forEach(inp => {
    inp.addEventListener("input", () => { s.vals[+inp.dataset.i] = inp.value; inp.classList.remove("right", "wrong"); });
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
    /* a wrong first answer: the bar plays out to its last step (still with no values on it) */
    if(!res.ok){ stopAnim(); it.mStep = modelSteps(it).length - 1; }
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
   THE PANEL — the teaching tool's bar. It never shows a value.
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const COL = { edge:"#334155", blue:"#2563eb", blueT:"#1d4ed8", purple:"#6d28d9", orange:"#c2410c", shade:"rgba(249,115,22,.22)", ones:"rgba(100,116,139,.42)" };
function modelSteps(it){
  /* "which is the same?" asks the student to read the notation: cutting and
     shading the bar would hand over the matching option, so it shows the whole only */
  if(it.kind === "same") return [ { t:`The whole: ${it.n}` } ];
  if(it.kind === "whole") return [ { t:it.a === 1 ? `One part of ${it.b} is ${it.ans}` : `${it.a} parts of ${it.b} make ${it.ans}` } ];
  const s = [ { t:`The whole: ${it.n}` }, { t:`Cut it into ${it.b} equal parts`, anim:"cut" } ];
  if(it.a > 1) s.push({ t:`Take ${it.a} of the parts`, anim:"shade" });
  return s;
}
const hasModel = it => modelSteps(it).length > 1;
function dur(it, s){ return s.anim === "cut" ? 1300 : clamp(260 * it.a + 300, 800, 2400); }
function layout(){
  const wrap = $("boardWrap");
  const w = Math.max(260, wrap.clientWidth), h = Math.max(220, wrap.clientHeight);
  const compact = w < 520;
  const M = compact ? 16 : 34;
  const barH = clamp(h * .34, 84, 170), topB = compact ? 52 : 62, botB = compact ? 58 : 70;
  const y0 = Math.max(topB, (h - (topB + barH + botB)) / 2 + topB);
  return { w, h, compact, x0:M, barW:w - 2 * M, y0, barH };
}
function el(tag, attrs, parent){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs || {}) if(attrs[k] != null) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e); return e;
}
function txt(x, y, s, fs, fill, g, op){ const t = el("text", { x, y, "font-size":fs, fill, "text-anchor":"middle", "dominant-baseline":"central", opacity:op == null ? null : op }, g); t.textContent = s; return t; }
function pill(x, y, s, fs, color, g, op){
  const gg = el("g", { opacity:op == null ? null : op }, g);
  const w = Math.max(fs * 1.8, String(s).length * fs * .6 + fs * 1.1), hg = fs * 1.55;
  el("rect", { x:x - w / 2, y:y - hg / 2, width:w, height:hg, rx:hg / 2, fill:"#fff" }, gg);
  txt(x, y + fs * .04, s, fs, color, gg);
  return w;
}
/* where each part sits, for the bar and the typing boxes */
function cellsAt(it, cutT){
  const cells = cutT > 0 ? it.b : 1, gap = 8 * ease(clamp(cutT, 0, 1));
  const cw = (L.barW - gap * (cells - 1)) / cells;
  return Array.from({ length:cells }, (_, i) => ({ x:L.x0 + i * (cw + gap), w:cw }));
}
function drawBoard(){
  const it = cur(); if(!it) return;
  L = layout();
  svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`);
  svg.innerHTML = "";
  const k = it.mStep, at = j => k > j ? 1 : k < j ? 0 : (ANIM ? ANIM.t : 1);
  const whole = it.kind === "whole";
  const cutT = whole ? 1 : at(1), shadeT = whole ? 1 : (it.a > 1 ? at(2) : 0);
  const cells = cellsAt(it, cutT), y0 = L.y0, H = L.barH, fsBig = Math.min(H * .46, 64);
  const gMain = el("g"), gLab = el("g");
  /* the parts */
  cells.forEach((c, i) => {
    const taken = i < it.a && (whole || it.a > 1);
    const lit = taken ? clamp(shadeT * (it.a + 1) - i, 0, 1) : 0;
    const rest = !taken && (whole || it.a > 1) ? shadeT : 0;
    const g = el("g", { opacity:(1 - .5 * rest).toFixed(3) }, gMain);
    el("rect", { x:c.x, y:y0, width:c.w, height:H, rx:9, fill:lit ? `rgba(249,115,22,${(.22 * lit).toFixed(3)})` : "#fff", stroke:lit > .5 ? COL.orange : COL.edge, "stroke-width":3 }, g);
    /* the ones: faint lines, where they are far enough apart to count */
    const per = cells.length === 1 ? it.n : it.v;
    if(it.ones && per > 1 && c.w / per >= 5){
      let d = ""; for(let j = 1; j < per; j++){ const x = c.x + j * c.w / per; d += `M${x.toFixed(1)} ${y0 + 3}V${y0 + H - 3}`; }
      el("path", { d, stroke:COL.ones, "stroke-width":1.4, fill:"none" }, g);
    }
    /* its name, once it has been cut */
    if(cutT > 0 && c.w >= 26){
      const op = clamp((cutT - .55) / .45, 0, 1), fs = clamp(Math.min(c.w * .32, H * .16), 11, 20), cy = y0 + H * .8, cx = c.x + c.w / 2;
      txt(cx, cy - fs * .55, "1", fs, COL.purple, g, op); txt(cx, cy + fs * .6, String(it.b), fs, COL.purple, g, op);
      el("line", { x1:cx - fs * .55, y1:cy, x2:cx + fs * .55, y2:cy, stroke:COL.purple, "stroke-width":1.6, opacity:op }, g);
    }
  });
  /* the whole: written in the bar, then lifted into the bracket above it */
  const inOp = whole ? 0 : 1 - clamp(cutT * 2, 0, 1);
  if(inOp > 0) txt(L.x0 + L.barW / 2, y0 + H / 2, String(it.n), fsBig, COL.blueT, gLab, inOp);
  const topOp = whole ? 1 : clamp(cutT * 2 - .4, 0, 1);
  if(topOp > 0){
    const yt = y0 - (L.compact ? 22 : 26);
    el("path", { d:`M${L.x0 + 1} ${y0 - 4}V${yt}H${L.x0 + L.barW - 1}V${y0 - 4}`, fill:"none", stroke:COL.blue, "stroke-width":3, "stroke-linejoin":"round", opacity:topOp }, gLab);
    pill(L.x0 + L.barW / 2, yt, whole ? "?" : String(it.n), L.compact ? 20 : 26, whole ? "#64748b" : COL.blueT, gLab, topOp);
  }
  /* the parts taken, bracketed underneath */
  if((whole || it.a > 1) && shadeT > 0){
    const last = cells[Math.min(it.a, cells.length) - 1], xs = cells[0].x + 1, xe = last.x + last.w - 1, yb = y0 + H + (L.compact ? 22 : 26);
    const xm = xs + (xe - xs) * ease(shadeT);
    el("path", { d:`M${xs} ${y0 + H + 4}V${yb}H${xm}${shadeT >= 1 ? `V${y0 + H + 4}` : ""}`, fill:"none", stroke:COL.orange, "stroke-width":3, "stroke-linejoin":"round" }, gLab);
    if(shadeT >= .6){
      const label = whole ? String(it.ans) : `${it.a} parts`, fs = L.compact ? 18 : 22;
      const w = String(label).length * fs * .6 + fs * 1.1, cx = clamp((xs + xe) / 2, L.x0 + w / 2, L.x0 + L.barW - w / 2);
      pill(cx, yb, label, fs, COL.orange, gLab, clamp((shadeT - .6) / .4, 0, 1));
    }
  }
  panelHead(it);
}
/* typing boxes over the parts: type in one and every part fills — never marked */
function renderJots(){
  const it = cur(), host = $("jots"); if(!it){ host.innerHTML = ""; return; }
  const show = !ANIM && (it.kind === "whole" || it.mStep >= 1);
  $("boardNote").textContent = show ? "Type how much is in one part — every part fills, because the parts are equal." : "";
  if(!show){ host.innerHTML = ""; return; }
  const cells = cellsAt(it, 1), H = L.barH, w0 = $("boardWrap").clientWidth, sx = w0 / L.w;
  if(cells[0].w < 30){ host.innerHTML = ""; $("boardNote").textContent = ""; return; }
  const bw = Math.min(cells[0].w - 8, 70), bh = clamp(H * .36, 30, 48), fs = clamp(bh * .55, 15, 26);
  host.innerHTML = cells.map((c, i) => `<input class="jot" data-j="${i}" inputmode="numeric" autocomplete="off" aria-label="One part" placeholder="?" value="${esc(it.jot)}" style="left:${((c.x + c.w / 2 - bw / 2) * sx).toFixed(1)}px;top:${((L.y0 + H * .38 - bh / 2) * sx).toFixed(1)}px;width:${(bw * sx).toFixed(1)}px;height:${(bh * sx).toFixed(1)}px;font-size:${fs.toFixed(1)}px">`).join("");
  host.querySelectorAll(".jot").forEach(inp => inp.addEventListener("input", () => {
    it.jot = inp.value.slice(0, 5);
    host.querySelectorAll(".jot").forEach(o => { if(o !== inp) o.value = it.jot; });
  }));
}
function redraw(){ drawBoard(); renderJots(); }
function panelHead(it){
  const steps = modelSteps(it), k = it.mStep, m = steps.length > 1;
  $("viewTag").textContent = m ? "Model" : "Diagram";
  $("stepBox").hidden = !m;
  const ob = $("onesBtn"), canOnes = it.kind !== "whole" && it.kind !== "same" && it.n <= 60;
  ob.hidden = !canOnes; ob.setAttribute("aria-pressed", String(!!it.ones));
  if(!m) return;
  $("stepCap").innerHTML = `<b>${k + 1}/${steps.length}</b> ${esc(steps[k].t)}`;
  $("mBack").disabled = k === 0;
  $("mNext").disabled = k >= steps.length - 1;
  $("mNext").classList.toggle("busy", !!ANIM);
}
function animate(d, t0, t1, onEnd){
  cancelAnimationFrame(raf);
  if(reduceMotion){ ANIM = null; onEnd && onEnd(); redraw(); return; }
  ANIM = { t:t0, end:onEnd }; const start = performance.now();
  $("jots").innerHTML = "";
  const f = now => {
    const p = clamp((now - start) / d, 0, 1);
    ANIM.t = t0 + (t1 - t0) * p; drawBoard();
    if(p < 1) raf = requestAnimationFrame(f); else { ANIM = null; onEnd && onEnd(); redraw(); }
  };
  raf = requestAnimationFrame(f);
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); const e = ANIM.end; ANIM = null; e && e(); } }
function modelNext(){
  const it = cur(); if(!it || ANIM) return;
  const steps = modelSteps(it); if(it.mStep >= steps.length - 1) return;
  it.mStep++; const s = steps[it.mStep];
  if(s.anim) animate(dur(it, s), 0, 1); else redraw();
}
function modelBack(){
  const it = cur(); if(!it || ANIM || it.mStep === 0) return;
  const s = modelSteps(it)[it.mStep], k = it.mStep;
  if(s.anim) animate(dur(it, s) * .7, 1, 0, () => { it.mStep = k - 1; }); else { it.mStep--; redraw(); }
}
$("mNext").addEventListener("click", modelNext);
$("mBack").addEventListener("click", modelBack);
$("onesBtn").addEventListener("click", () => { const it = cur(); if(!it) return; it.ones = !it.ones; redraw(); });

/* The panel is sized to the real page: the board gets what is left */
function fitBoard(){
  const wrap = $("boardWrap");
  if(window.innerWidth <= 980){ if(wrap.style.height) wrap.style.height = ""; $("qCard").style.maxHeight = ""; return false; }
  const work = $("work"), card = $("boardCard");
  const wr = work.getBoundingClientRect(), nav = document.querySelector(".navRow").getBoundingClientRect();
  const lay = getComputedStyle(document.querySelector(".layout"));
  const outside = (wr.top + window.scrollY) + (nav.bottom - wr.bottom) + parseFloat(lay.paddingBottom) + document.querySelector(".brandFoot").offsetHeight;
  const extra = card.offsetHeight - wrap.offsetHeight;
  const want = Math.round(clamp(window.innerHeight - outside - extra - 2, 260, 560));
  const moved = Math.abs(wrap.offsetHeight - want) > 1;
  if(moved) wrap.style.height = want + "px";
  $("qCard").style.maxHeight = Math.max(card.offsetHeight, window.innerHeight - outside - 2) + "px";
  return moved;
}
let rz = 0;
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fitBoard(); if(cur()) redraw(); }); };
window.addEventListener("resize", onResize);
/* the board head can change height when the step caption changes, so it is watched too */
if(window.ResizeObserver){ const ro = new ResizeObserver(onResize); ro.observe($("boardWrap")); ro.observe(document.querySelector(".boardHead")); }

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { "fa-unit":"One part (unit fractions)", "fa-nonunit":"More than one part", "fa-same":"Which is the same?", "fa-whole":"Back to the whole", "fa-word":"Word problems" };
const CATS = ["fa-unit","fa-nonunit","fa-same","fa-whole","fa-word"];
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
  /* No typed answer is ever in the payload — only marks and counts. */
  const types = CATS.filter(c => s.cats[c]).map(c => c + ":" + s.cats[c][0] + "/" + s.cats[c][1]).concat(["level:" + S.levelKey]);
  if(window.MMTSave) window.MMTSave({
    tool:CFG.tool, topic:"number",
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
window.__FQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, modelSteps, hasModel, modelNext, modelBack, formHTML, get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
