/* =====================================================================
   AREA OF A PARALLELOGRAM & RHOMBUS — STUDENT QUIZ (2026-11-01)
   ---------------------------------------------------------------------
   The triangle quiz's pattern: the card on the left is ONE question and
   ONE answer; the panel on the right is the teaching tool's model, built
   from the question's own shape, stepped with ◀ / Show me ▸ — never
   required, never marked, and it NEVER shows the answer (no area bubble,
   no running totals up the side of a rectangle).
     rectangle / square  → count one row, then the rows (squares darken)
     parallelogram / rhombus → cut along the height, slide into a rectangle
     rhombus by its diagonals → cut along both, slide the two pieces up
   A wrong first answer jumps the model to its last step.

   The ladder (Jeff's spec):
     Sweet  squares, rectangles, parallelograms, rhombuses; whole numbers
            within the 12 × 12 tables
     Mild   as Sweet, plus rhombuses (and squares) by their diagonals
     Medium as Mild, half the paper is the area given and a base or height
            to find (the grid is off on those, so it can't be counted)
     Spicy  as Mild with no grid, lengths in halves (6.5) on the area
            questions, and two questions finding a diagonal from the area
   A parallelogram's sloping side is labelled whenever it is a whole
   number, so students choose the height rather than the side.

   Marking: only the FIRST check scores; Check again lets them fix it; an
   empty check is free; Next on an unanswered question counts it wrong.
   Nothing typed is ever saved — only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"area-of-a-parallelogram-student-quiz", title:"Area of a Parallelogram & Rhombus", mastery:"area-of-a-parallelogram" };
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = n => { const r = Math.round(n * 100) / 100; return String(r); };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const X = "×";
const eqS = s => `<span class="eq">${s}</span>`;

/* ---------------------------------------------------------- geometry (the teaching tool's) */
const paraPts = it => [[0, 0], [it.b, 0], [it.b + it.d, it.h], [it.d, it.h]];
const slantLen = it => Math.hypot(it.d, it.h);
const isRhombus = it => it.kind === "para" && it.d !== 0 && Math.abs(it.b - slantLen(it)) < 1e-9;
function plan(it){
  const { b, h, d } = it;
  if(d === 0) return { kind:"none" };
  if(Math.abs(d) < b){
    if(d > 0) return { kind:"one", cut:[[d, h], [d, 0]], piece:[[0, 0], [d, 0], [d, h]], rest:[[d, 0], [b, 0], [b + d, h], [d, h]], dx:b };
    return { kind:"one", cut:[[b + d, h], [b + d, 0]], piece:[[b + d, 0], [b, 0], [b + d, h]], rest:[[0, 0], [b + d, 0], [b + d, h], [d, h]], dx:-b };
  }
  const out = [];
  if(d > 0) for(let k = 0; k * b < d + b - 1e-9; k++) out.push({ lo:k * b, hi:(k + 1) * b, dx:-k * b });
  else for(let k = 0; (1 - k) * b > d + 1e-9; k++) out.push({ lo:-k * b, hi:(1 - k) * b, dx:k * b });
  return { kind:"strips", strips:out, cuts:d > 0 ? out.slice(1).map(s => s.lo) : out.slice(0, -1).map(s => s.lo) };
}
function clipX(poly, lo, hi){
  const cut = (pts, keep, xi) => { const out = [];
    for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length], pin = keep(p), qin = keep(q);
      if(pin) out.push(p);
      if(pin !== qin){ const t = (xi - p[0]) / (q[0] - p[0]); out.push([xi, p[1] + t * (q[1] - p[1])]); } }
    return out; };
  let r = cut(poly, p => p[0] >= lo - 1e-9, lo); if(r.length < 3) return null;
  r = cut(r, p => p[0] <= hi + 1e-9, hi);
  return r.length >= 3 ? r : null;
}
const yRangeAt = (poly, x) => { const ys = [];
  for(let i = 0; i < poly.length; i++){ const p = poly[i], q = poly[(i + 1) % poly.length];
    if((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]){ const t = (x - p[0]) / (q[0] - p[0]); ys.push(p[1] + t * (q[1] - p[1])); } }
  return ys.length ? [Math.min(...ys), Math.max(...ys)] : null; };
const areaOf = it => it.kind === "diag" ? it.dp * it.dq / 2 : it.b * it.h;

/* ---------------------------------------------------------- building questions */
/* (lean, height, side): a sloping side with a whole-number length */
const TRIPLES = [[3,4,5],[4,3,5],[6,8,10],[8,6,10],[5,12,13],[9,12,15],[12,9,15]];
let USED = new Set();
function fresh(key){ if(USED.has(key)) return false; USED.add(key); return true; }
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:[], marks:null, fixText:null, sel:null }, o); }
const field = (lab, ans, unit) => ({ lab, ans, unit });
function base(level, o){
  return Object.assign({ level, model:true, grid:level !== "spicy", missing:null, mStep:0, settled:false, correct:false, q:"" }, o);
}
/* lengths: whole numbers, or (Spicy area questions) halves */
const halfNum = (lo, hi) => R(lo * 2, hi * 2) / 2;
function rectShape(level, square, halves){
  for(let t = 0; t < 400; t++){
    const hi = level === "spicy" ? 15 : 12;
    let b = halves && Math.random() < .6 ? halfNum(3, square ? 9 : hi) : R(2, square ? 9 : hi), h;
    if(square) h = b;
    else { h = halves && !Number.isInteger(b) ? R(2, 10) : (halves && Math.random() < .5 ? halfNum(2, 10) : R(2, 10)); if(h === b || h > b) continue; }
    if(!halves && (b > 12 || h > 12)) continue;
    if(halves && Number.isInteger(b) && Number.isInteger(h)) continue;
    if(!fresh(`r${b}x${h}`) && t < 300) continue;
    return { kind:"rect", b, h, d:0, square };
  }
  return { kind:"rect", b:7, h:4, d:0, square:false };
}
function paraShape(level, opts){
  opts = opts || {};
  for(let t = 0; t < 500; t++){
    let b, h, d;
    if(opts.rhombus){
      const [dd, hh, ss] = pick(TRIPLES.filter(x => x[1] <= 10 && x[2] <= 12));
      b = ss; h = hh; d = (Math.random() < .7 ? 1 : -1) * dd;
    } else if(opts.long){
      b = R(3, 5); h = R(3, 6); d = (Math.random() < .7 ? 1 : -1) * R(b + 1, b + 5);
    } else {
      if(opts.slant && Math.random() < .75){ const [dd, hh] = pick(TRIPLES.filter(x => x[1] <= 10 && x[0] <= 8)); d = dd; h = hh; }
      else { h = R(2, 10); d = R(1, 5); }
      b = R(Math.max(3, d + 1), 12);
      if(Math.random() < .3) d = -d;
      if(Math.abs(b - Math.hypot(d, h)) < 1e-9) continue;              /* keep rhombuses for the rhombus questions */
      if(opts.halves){ if(Math.random() < .5) b = b - .5; else h = h + .5; if(h > 10.5) continue; }
    }
    if(b > 12 && !opts.halves) continue;
    if(!fresh(`p${b}x${h}:${d}`) && t < 400) continue;
    return { kind:"para", b, h, d };
  }
  return { kind:"para", b:8, h:4, d:3 };
}
function diagShape(level, opts){
  opts = opts || {};
  for(let t = 0; t < 400; t++){
    let p, q;
    if(opts.square){ p = q = 2 * R(2, 6); }
    else {
      p = R(4, level === "spicy" ? 16 : 12); q = R(3, 10);
      if(opts.halves && Math.random() < .6){ if(Math.random() < .5) p -= .5; else q += .5; }
      if(p === q) continue;
      if(!opts.halves && (p * q) % 2) continue;
      if(opts.halves && Number.isInteger(p) && Number.isInteger(q)) continue;
    }
    if(!fresh(`d${p}x${q}`) && t < 300) continue;
    return { kind:"diag", dp:p, dq:q, square:!!opts.square };
  }
  return { kind:"diag", dp:10, dq:6 };
}
/* the shape's name in the question */
function nameOf(it){
  if(it.kind === "rect") return it.square ? "square" : "rectangle";
  if(it.kind === "diag") return it.square ? "square" : "rhombus";
  return isRhombus(it) ? "rhombus" : "parallelogram";
}
function qArea(level, s){
  const it = base(level, s);
  it.q = `Find the area of the ${nameOf(it)}.`;
  const A = areaOf(it);
  let why, cat;
  if(it.kind === "rect"){ cat = "pa-rect"; why = () => `${it.square ? "Side × side" : "Length × width"}: ${eqS(`${fmt(it.b)} ${X} ${fmt(it.h)} = ${fmt(A)}`)} cm².`; }
  else if(it.kind === "para"){ cat = "pa-para";
    const sl = slantLen(it), sw = Number.isInteger(sl) && !isRhombus(it) ? ` The ${fmt(sl)} cm side slopes — it isn't the height.` : "";
    why = () => `Base × height: ${eqS(`${fmt(it.b)} ${X} ${fmt(it.h)} = ${fmt(A)}`)} cm².${sw} Cut along the height and slide the piece across: it makes a ${fmt(it.b)} by ${fmt(it.h)} rectangle.`; }
  else { cat = "pa-diag";
    why = () => `Half of the rectangle round it: ${eqS(`${fmt(it.dp)} ${X} ${fmt(it.dq)} = ${fmt(it.dp * it.dq)}`)}, and ${eqS(`${fmt(it.dp * it.dq)} ÷ 2 = ${fmt(A)}`)} cm².`; }
  it.steps = [ step("num", { cat, fields:[ field("Area =", A, "cm²") ], why }) ];
  return it;
}
/* area given: find a base / height (or a side of a rectangle) */
function qMissing(level, s, which){
  const it = base(level, Object.assign({ missing:which, grid:false }, s));
  const A = areaOf(it), ans = which === "base" ? it.b : it.h, other = which === "base" ? it.h : it.b;
  const word = it.kind === "rect" ? (which === "base" ? "length" : "width") : which;
  it.q = `The area of the ${nameOf(it)} is ${fmt(A)} cm². What is the ${word}?`;
  it.steps = [ step("num", { cat:"pa-missing", fields:[ field(word[0].toUpperCase() + word.slice(1) + " =", ans, "cm") ],
    why:() => `The area is ${word === "length" || word === "width" ? "length × width" : "base × height"}, so ${eqS(`${fmt(A)} ÷ ${fmt(other)} = ${fmt(ans)}`)} — the ${word} is ${fmt(ans)} cm.` }) ];
  return it;
}
/* area given: find a diagonal */
function qMissingDiag(level, s){
  const which = Math.random() < .5 ? "dp" : "dq";
  const it = base(level, Object.assign({ missing:which, grid:false }, s));
  const A = areaOf(it), ans = it[which], other = which === "dp" ? it.dq : it.dp;
  it.q = `The area of the rhombus is ${fmt(A)} cm². One diagonal is ${fmt(other)} cm. How long is the other diagonal?`;
  it.steps = [ step("num", { cat:"pa-diag-missing", fields:[ field("Diagonal =", ans, "cm") ],
    why:() => `The rhombus is half of the rectangle round it, so that rectangle is ${eqS(`${fmt(A)} ${X} 2 = ${fmt(2 * A)}`)} cm². Then ${eqS(`${fmt(2 * A)} ÷ ${fmt(other)} = ${fmt(ans)}`)} cm.` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Squares, rectangles, parallelograms and rhombuses. Whole numbers up to 12, on unit squares." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"As Sweet, plus rhombuses found from their diagonals." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"Half the questions give you the area — find the missing base or height." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"No unit squares, lengths in halves (6.5), and finding a diagonal from the area." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  const L0 = level, A = s => qArea(L0, s);
  if(level === "sweet") return [ A(rectShape(L0)), A(paraShape(L0, { slant:true })), A(rectShape(L0, true)), A(paraShape(L0)), A(paraShape(L0, { rhombus:true })),
    A(rectShape(L0)), A(paraShape(L0, { slant:true })), A(paraShape(L0)), A(paraShape(L0, { rhombus:true })), A(paraShape(L0, { long:true })) ];
  if(level === "mild") return [ A(rectShape(L0)), A(paraShape(L0, { slant:true })), A(diagShape(L0)), A(paraShape(L0)), A(paraShape(L0, { rhombus:true })),
    A(diagShape(L0)), A(rectShape(L0, true)), A(paraShape(L0, { slant:true })), A(diagShape(L0, { square:true })), A(paraShape(L0, { long:true })) ];
  if(level === "medium"){
    const M = (s, w) => qMissing(L0, s, w);
    return [ A(paraShape(L0, { slant:true })), M(paraShape(L0), "height"), A(diagShape(L0)), M(rectShape(L0), "base"), A(paraShape(L0, { rhombus:true })),
      M(paraShape(L0, { slant:true }), "base"), A(diagShape(L0)), M(paraShape(L0, { rhombus:true }), "height"), A(rectShape(L0, true)), M(paraShape(L0), "height") ];
  }
  return [ A(paraShape(L0, { halves:true, slant:true })), A(diagShape(L0, { halves:true })), qMissingDiag(L0, diagShape(L0)), A(rectShape(L0, false, true)), A(paraShape(L0, { rhombus:true })),
    A(paraShape(L0, { halves:true })), A(diagShape(L0, { halves:true })), qMissingDiag(L0, diagShape(L0)), A(paraShape(L0, { long:true })), A(rectShape(L0, true, true)) ];
}

/* =====================================================================
   MARKING
   ===================================================================== */
/* whole numbers, decimals, 22½, 22 1/2, 45/2 */
function num(raw){
  let s = String(raw == null ? "" : raw).trim().toLowerCase().replace(/cm²|cm2|cm/g, "").replace(/,/g, "");
  if(!s) return NaN;
  s = s.replace(/½/g, " 1/2").replace(/¼/g, " 1/4").replace(/¾/g, " 3/4").replace(/\s+/g, " ").trim();
  let m;
  if((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[3] ? +m[1] + m[2] / m[3] : NaN;
  if((m = s.match(/^(\d+)\/(\d+)$/))) return +m[2] ? m[1] / m[2] : NaN;
  if(/^\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}
const empty = s => String(s == null ? "" : s).trim() === "";
function markStep(it, s){
  if(s.t === "num"){
    if(s.fields.some((f, i) => empty(s.vals[i]))) return { invalid:"Type your answer first." };
    if(s.fields.some((f, i) => isNaN(num(s.vals[i])))) return { invalid:"Type a number — you can use .5 for a half." };
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
  if(s.first === null) return hasModel(it) ? setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>Use the model if it helps</span>`, "hint") : setPrompt("", "");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}
function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(s.t === "num") return `<div class="answers">` + s.fields.map((f, i) => {
    const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "", v = s.vals[i] == null ? "" : s.vals[i];
    return `<label class="ansRow"><span class="lab">${f.lab}</span><input class="cell ans${m}" data-i="${i}" inputmode="decimal" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="${esc(f.lab)} in ${f.unit}"><span class="unit">${f.unit}</span></label>`;
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
  if(it.working) h += `<div class="working">${eqS(it.working)}</div>`;
  if(it.ask) h += `<div class="qText">${it.ask}</div>`;
  h += answerHTML(it, s);
  h += `<div class="checkRow">` + (s.last || s.skipped ? "" : `<button class="checkBtn" type="button" data-check="0">${s.first === null ? "Check" : "Check again"}</button>`) + `</div>`;
  h += `<div class="fb" id="fb" aria-live="polite"></div></div>`;
  $("qCard").innerHTML = h;
  feedback(it);
  bindCard();
  drawBoard();
  if(fitBoard()) drawBoard();
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
    /* a wrong first answer: the model plays out to its last step */
    if(!res.ok && hasModel(it)){ stopAnim(); it.mStep = modelSteps(it).length - 1; }
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
   THE PANEL — the teaching tool's model, built from the question's shape.
   It never shows the answer: no area bubble, no running totals.
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const C = { solid:"#65c288", fill:"rgba(22,163,74,.66)", edge:"#14532d", alt:"#ea580c", cut:"#0f172a" };
function modelSteps(it){
  if(it.kind === "rect"){
    const countable = it.grid && !it.missing && Number.isInteger(it.b) && Number.isInteger(it.h);
    return countable ? [ { t:it.square ? "The square" : "The rectangle" }, { t:"Count one row", anim:"row" }, { t:"Count the rows", anim:"rows" } ]
                     : [ { t:it.square ? "The square" : "The rectangle" } ];
  }
  if(it.kind === "para"){
    if(it.d === 0) return [ { t:"The shape" } ];
    const long = plan(it).kind === "strips";
    return [ { t:isRhombus(it) ? "The rhombus" : "The parallelogram" }, { t:long ? "Cut it into strips one base wide" : "Cut along the height", anim:"cut" }, { t:long ? "Slide the strips back" : "Slide the piece to the other end", anim:"slide" } ];
  }
  return [ { t:it.square ? "The square and its diagonals" : "The rhombus and its diagonals" }, { t:"Cut along the diagonals", anim:"cut" }, { t:"Slide the two pieces up", anim:"slide" } ];
}
function dur(it, s){
  if(s.anim === "row") return clamp(240 * it.b, 1100, 2600);
  if(s.anim === "rows") return clamp(380 * it.h, 1100, 3000);
  if(s.anim === "cut") return it.kind === "diag" ? 2600 : 1800;
  return it.kind === "diag" ? 2600 : 1700;
}
const hasModel = it => modelSteps(it).length > 1;
function frame(it){
  if(it.kind === "rect") return { x0:0, x1:it.b, y0:0, y1:it.h };
  if(it.kind === "diag") return { x0:0, x1:it.dp, y0:0, y1:it.dq };
  return { x0:Math.min(0, it.d), x1:Math.max(it.b, it.b + it.d), y0:0, y1:it.h };
}
function layout(it){
  const wrap = $("boardWrap");
  const w = Math.max(260, wrap.clientWidth), hh = Math.max(220, wrap.clientHeight);
  const compact = w < 520;
  const M = compact ? { L:50, R:48, T:28, B:56 } : { L:76, R:76, T:34, B:66 };
  const F = frame(it), fw = Math.max(1, F.x1 - F.x0), fh = Math.max(1, F.y1 - F.y0);
  const s = Math.min((w - M.L - M.R) / fw, (hh - M.T - M.B) / fh, 72);
  const ox = M.L + ((w - M.L - M.R) - fw * s) / 2, oy = M.T + ((hh - M.T - M.B) - fh * s) / 2;
  return { w, h:hh, s, F, compact, X:x => ox + (x - F.x0) * s, Y:y => oy + (F.y1 - y) * s };
}
function el(tag, attrs, parent){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs || {}) if(attrs[k] != null) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e); return e;
}
const pts = P => P.map(p => L.X(p[0]).toFixed(1) + "," + L.Y(p[1]).toFixed(1)).join(" ");
const poly = (P, attrs, g) => el("polygon", Object.assign({ points:pts(P), "stroke-linejoin":"round" }, attrs), g);
const seg = (p, q, attrs, g) => el("line", Object.assign({ x1:L.X(p[0]), y1:L.Y(p[1]), x2:L.X(q[0]), y2:L.Y(q[1]) }, attrs), g);
const tw = (s, fs) => String(s).length * fs * .55;
function txt(x, y, s, fs, fill, g){ const t = el("text", { x, y, "font-size":fs, fill, "text-anchor":"middle", "dominant-baseline":"central" }, g); t.textContent = s; return t; }
function pill(x, y, s, fs, o, g){
  o = o || {}; const gg = el("g", null, g);
  const w = Math.max(fs * 1.7, tw(s, fs) + fs * 1.05), hg = fs * 1.6;
  el("rect", { x:x - w / 2, y:y - hg / 2, width:w, height:hg, rx:hg / 2, fill:o.bg || "#fff", stroke:o.stroke || "#e2e8f0", "stroke-width":o.sw || 1.8 }, gg);
  txt(x, y + fs * .04, s, fs, o.color || "#0f172a", gg);
  return gg;
}
function scissors(x, y, ang, snip, g){
  const o = .25 + .75 * Math.abs(Math.sin(snip * Math.PI * 9));
  const gg = el("g", { transform:`translate(${x} ${y}) rotate(${ang * 180 / Math.PI})` }, g);
  el("path", { d:`M-16 0L4 ${-o * 6}M-16 0L4 ${o * 6}`, stroke:"#0f172a", "stroke-width":3.4, "stroke-linecap":"round", fill:"none" }, gg);
  el("path", { d:"M-16 0L-22 -6M-16 0L-22 6", stroke:"#0f172a", "stroke-width":2.6, "stroke-linecap":"round" }, gg);
  el("circle", { cx:-27, cy:-8, r:6, fill:"#fff", stroke:"#dc2626", "stroke-width":3 }, gg);
  el("circle", { cx:-27, cy:8, r:6, fill:"#fff", stroke:"#dc2626", "stroke-width":3 }, gg);
}
function cutLine(p, q, c, g, snip){
  seg(p, q, { stroke:C.cut, "stroke-width":3, "stroke-dasharray":"2 7", "stroke-linecap":"round" }, g);
  if(c <= 0) return;
  const m = [p[0] + (q[0] - p[0]) * c, p[1] + (q[1] - p[1]) * c];
  seg(p, m, { stroke:C.cut, "stroke-width":3.2 }, g);
  if(ANIM && c < 1) scissors(L.X(m[0]), L.Y(m[1]), Math.atan2(L.Y(q[1]) - L.Y(p[1]), L.X(q[0]) - L.X(p[0])), snip, g);
}
const fsz = () => L.compact ? 15 : 18;
const blueO = { color:"#1d4ed8", stroke:"#93c5fd", sw:2 }, orangeO = { color:"#c2410c", stroke:"#fdba74", sw:2 }, missO = { color:"#64748b", stroke:"#94a3b8", sw:2 };
const lab = (it, which, v) => it.missing === which ? "?" : fmt(v) + " cm";
const optFor = (it, which, o) => it.missing === which ? missO : o;

function drawBoard(){
  const it = cur(); if(!it) return;
  L = layout(it);
  svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`);
  svg.innerHTML = "";
  const gGrid = el("g"), gBack = el("g"), gMain = el("g"), gTop = el("g"), gLab = el("g");
  const k = it.mStep, at = j => k > j ? 1 : k < j ? 0 : (ANIM ? ANIM.t : 1);
  const sc = { gBack, gMain, gTop, gLab, at };
  if(it.grid && L.s >= 12 && it.kind !== "rect"){
    const F = L.F, x0 = Math.floor(F.x0), x1 = Math.ceil(F.x1), y1 = Math.ceil(F.y1); let d = "";
    for(let x = x0; x <= x1; x++) d += `M${L.X(x)} ${L.Y(0)}V${L.Y(y1)}`;
    for(let y = 0; y <= y1; y++) d += `M${L.X(x0)} ${L.Y(y)}H${L.X(x1)}`;
    el("path", { d, stroke:"rgba(15,23,42,.09)", "stroke-width":1, fill:"none", "shape-rendering":"crispEdges" }, gGrid);
  }
  if(it.kind === "rect") sceneRect(it, sc); else if(it.kind === "para") scenePara(it, sc); else sceneDiag(it, sc);
  panelHead(it);
}
/* rectangles: pale green; on the model each square darkens as it is counted (no totals up the side) */
function sceneRect(it, sc){
  const { b, h } = it, countable = hasModel(it);
  if(countable){
    const rowT = sc.at(1), rowsT = sc.at(2), lit1 = rowT * b, rowsLit = 1 + rowsT * (h - 1), fsN = Math.min(22, L.s * .42);
    for(let j = 0; j < h; j++) for(let i = 0; i < b; i++){
      const on = j === 0 ? clamp(lit1 - i, 0, 1) : (rowT >= 1 ? clamp(rowsLit - j, 0, 1) : 0);
      poly([[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], { fill:`rgba(22,163,74,${(.16 + .5 * on).toFixed(3)})`, stroke:"rgba(20,83,45,.35)", "stroke-width":1.2 }, sc.gMain);
      if(j === 0 && on >= 1 && L.s >= 24 && k1(it)) txt(L.X(i + .5), L.Y(.5), String(i + 1), fsN, "#14532d", sc.gLab);
    }
  } else poly([[0, 0], [b, 0], [b, h], [0, h]], { fill:it.grid ? "rgba(22,163,74,.16)" : C.fill, stroke:"none" }, sc.gMain);
  if(!countable && it.grid){ let d = ""; for(let x = 1; x < b; x++) d += `M${L.X(x)} ${L.Y(0)}V${L.Y(h)}`; for(let y = 1; y < h; y++) d += `M${L.X(0)} ${L.Y(y)}H${L.X(b)}`; if(d) el("path", { d, stroke:"rgba(20,83,45,.35)", "stroke-width":1.2, fill:"none" }, sc.gMain); }
  poly([[0, 0], [b, 0], [b, h], [0, h]], { fill:"none", stroke:C.edge, "stroke-width":3 }, sc.gTop);
  pill(L.X(b / 2), L.Y(0) + (L.compact ? 26 : 30), lab(it, "base", b), fsz(), optFor(it, "base", blueO), sc.gLab);
  pill(L.X(0) - (L.compact ? 32 : 42), L.Y(h / 2), lab(it, "height", h), fsz(), optFor(it, "height", orangeO), sc.gLab);
  if(it.square && !it.missing){
    /* equal-side marks */
    [[[0, 0], [b, 0]], [[b, 0], [b, h]], [[b, h], [0, h]], [[0, h], [0, 0]]].forEach(([a1, a2]) => {
      const mx = L.X((a1[0] + a2[0]) / 2), my = L.Y((a1[1] + a2[1]) / 2), hz = a1[1] === a2[1];
      el("line", hz ? { x1:mx, y1:my - 8, x2:mx, y2:my + 8, stroke:C.edge, "stroke-width":2.5 } : { x1:mx - 8, y1:my, x2:mx + 8, y2:my, stroke:C.edge, "stroke-width":2.5 }, sc.gTop);
    });
  }
}
const k1 = it => it.mStep <= 1;
/* parallelograms: cut along the height, slide */
function scenePara(it, sc){
  const { b, h, d } = it, P = plan(it), PG = paraPts(it);
  const cT = sc.at(1), sT = sc.at(2);
  const cutC = ease(clamp(cT / .82, 0, 1));
  const sep = it.mStep === 1 ? ease(clamp((cT - .84) / .16, 0, 1)) : it.mStep >= 2 ? 1 - ease(clamp((sT - .8) / .2, 0, 1)) : 0;
  const prog = ease(clamp(sT / .8, 0, 1)), g = 5 / L.s * sep;
  if(P.kind === "none" || (it.mStep === 0 && !ANIM)) poly(PG, { fill:C.fill, stroke:C.edge, "stroke-width":3 }, sc.gMain);
  else if(P.kind === "one"){
    const dir = P.dx > 0 ? -1 : 1, moving = prog > 0 && prog < 1;
    poly(P.rest, { fill:C.fill, stroke:C.edge, "stroke-width":3 }, sc.gMain);
    poly(P.piece.map(q => [q[0] + P.dx * prog + dir * g, q[1]]), { fill:moving ? C.solid : C.fill, stroke:C.edge, "stroke-width":3 }, moving ? sc.gTop : sc.gMain);
    if(prog > 0) poly(P.piece, { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"6 6" }, sc.gBack);
    if(cutC < 1) cutLine(P.cut[0], P.cut[1], cutC, sc.gTop, cT);
  } else {
    P.strips.forEach(st => { const c = clipX(PG, st.lo, st.hi); if(!c) return; const shift = st.dx * prog - Math.sign(st.dx) * g;
      poly(c.map(q => [q[0] + shift, q[1]]), { fill:C.fill, stroke:C.edge, "stroke-width":3 }, sc.gMain); });
    if(prog > 0) poly(PG, { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"6 6" }, sc.gBack);
    if(cutC < 1) P.cuts.forEach(x => { const r = yRangeAt(PG, x); if(r) cutLine([x, r[1]], [x, r[0]], cutC, sc.gTop, cT); });
  }
  const endMid = P.kind === "one" ? d + b / 2 : b / 2;
  pill(L.X(b / 2 + (endMid - b / 2) * prog), L.Y(0) + (L.compact ? 26 : 30), lab(it, "base", b), fsz(), optFor(it, "base", blueO), sc.gLab);
  const done = P.kind !== "none" && it.mStep >= 2 && prog >= 1;
  const hx = P.kind === "strips" && done ? (d > 0 ? 0 : b) : (d >= 0 ? d : b + d);
  const cutting = P.kind === "one" && it.mStep === 1 && cutC < 1;
  if(!cutting && d !== 0) seg([hx, h], [hx, 0], { stroke:C.alt, "stroke-width":2.5, "stroke-dasharray":"7 5" }, sc.gTop);
  const toward = d >= 0 ? 1 : -1, rA = Math.min(12, h * L.s * .3), fx = L.X(hx), fy = L.Y(0);
  el("path", { d:`M${fx + toward * rA} ${fy}V${fy - rA}H${fx}`, fill:"none", stroke:C.alt, "stroke-width":2 }, sc.gTop);
  const hl = lab(it, "height", h), lw = Math.max(fsz() * 1.7, tw(hl, fsz()) + fsz() * 1.05);
  pill(L.X(hx) - toward * (lw / 2 + 8), L.Y(h / 2), hl, fsz(), optFor(it, "height", orangeO), sc.gLab);
  /* the sloping side: a whole-number distractor, while the shape still has it */
  const sl = slantLen(it);
  if(d !== 0 && Number.isInteger(sl) && !isRhombus(it) && it.mStep === 0){
    const sideP = d > 0 ? [[b, 0], [b + d, h]] : [[0, 0], [d, h]];
    const mx = (sideP[0][0] + sideP[1][0]) / 2, out = d > 0 ? 1 : -1, l2 = fmt(sl) + " cm", w2 = tw(l2, fsz() - 1) + fsz();
    pill(L.X(mx) + out * (w2 / 2 + 14), L.Y(h / 2), l2, fsz() - 1, { color:"#334155", stroke:"#cbd5e1" }, sc.gLab);
  }
  if(isRhombus(it) && it.mStep === 0) [[PG[0], PG[1]], [PG[1], PG[2]], [PG[2], PG[3]], [PG[3], PG[0]]].forEach(([a1, a2]) => {
    const mx = L.X((a1[0] + a2[0]) / 2), my = L.Y((a1[1] + a2[1]) / 2), dx = L.X(a2[0]) - L.X(a1[0]), dy = L.Y(a2[1]) - L.Y(a1[1]), dl = Math.hypot(dx, dy) || 1;
    el("line", { x1:mx - dy / dl * 8, y1:my + dx / dl * 8, x2:mx + dy / dl * 8, y2:my - dx / dl * 8, stroke:C.edge, "stroke-width":2.5 }, sc.gTop);
  });
}
/* a rhombus by its diagonals: cut along both, the two bottom pieces slide up */
function sceneDiag(it, sc){
  const p = it.dp, q = it.dq, cx = p / 2, cy = q / 2;
  const R_ = [[0, cy], [cx, 0], [p, cy], [cx, q]];
  const top = [[0, cy], [p, cy], [cx, q]], BL = [[0, cy], [cx, cy], [cx, 0]], BR = [[cx, cy], [p, cy], [cx, 0]];
  const cT = sc.at(1), sT = sc.at(2);
  poly([[0, 0], [p, 0], [p, q], [0, q]], { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"7 6" }, sc.gBack);
  if(it.mStep === 0 && !ANIM){
    poly(R_, { fill:C.fill, stroke:C.edge, "stroke-width":3 }, sc.gMain);
    seg([0, cy], [p, cy], { stroke:"#1d4ed8", "stroke-width":2.5, "stroke-dasharray":"7 5" }, sc.gTop);
    seg([cx, 0], [cx, q], { stroke:C.alt, "stroke-width":2.5, "stroke-dasharray":"7 5" }, sc.gTop);
    const r = Math.min(12, L.s * .6);
    el("path", { d:`M${L.X(cx) + r} ${L.Y(cy)}V${L.Y(cy) - r}H${L.X(cx)}`, fill:"none", stroke:C.edge, "stroke-width":2 }, sc.gTop);
  } else {
    const c1 = ease(clamp(cT / .48, 0, 1)), c2 = ease(clamp((cT - .5) / .34, 0, 1));
    const sep = it.mStep === 1 ? ease(clamp((cT - .86) / .14, 0, 1)) : 1 - ease(clamp((sT - .88) / .12, 0, 1));
    const g = 5 / L.s * sep;
    const mBR = ease(clamp(sT / .44, 0, 1)), mBL = ease(clamp((sT - .46) / .44, 0, 1));
    const oBR = [g * (1 - 2 * mBR), -g * (1 - 2 * mBR)], oBL = [-g * (1 - 2 * mBL), -g * (1 - 2 * mBL)];
    poly(top.map(v => [v[0], v[1] + g]), { fill:C.fill, stroke:C.edge, "stroke-width":3 }, sc.gMain);
    const mvR = mBR > 0 && mBR < 1, mvL = mBL > 0 && mBL < 1;
    poly(BR.map(v => [v[0] - cx * mBR + oBR[0], v[1] + cy * mBR + oBR[1]]), { fill:mvR ? C.solid : C.fill, stroke:C.edge, "stroke-width":3 }, mvR ? sc.gTop : sc.gMain);
    poly(BL.map(v => [v[0] + cx * mBL + oBL[0], v[1] + cy * mBL + oBL[1]]), { fill:mvL ? C.solid : C.fill, stroke:C.edge, "stroke-width":3 }, mvL ? sc.gTop : sc.gMain);
    if(mBR > 0 || mBL > 0) poly([[0, cy], [cx, 0], [p, cy]], { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"6 6" }, sc.gBack);
    if(it.mStep === 1 && c1 < 1) cutLine([0, cy], [p, cy], c1, sc.gTop, cT);
    if(it.mStep === 1 && c1 >= 1 && c2 < 1) cutLine([cx, cy], [cx, 0], c2, sc.gTop, cT);
  }
  pill(L.X(cx), L.Y(0) + (L.compact ? 26 : 30), it.missing === "dp" ? "?" : fmt(p) + " cm", fsz(), it.missing === "dp" ? missO : blueO, sc.gLab);
  el("path", { d:`M${L.X(0)} ${L.Y(0) + 12}V${L.Y(0) + 20}M${L.X(0)} ${L.Y(0) + 16}H${L.X(p)}M${L.X(p)} ${L.Y(0) + 12}V${L.Y(0) + 20}`, stroke:"#93c5fd", "stroke-width":1.6, fill:"none" }, sc.gBack);
  const ql = it.missing === "dq" ? "?" : fmt(q) + " cm", qw = Math.max(fsz() * 1.7, tw(ql, fsz()) + fsz() * 1.05);
  pill(L.X(p) + 20 + qw / 2, L.Y(cy), ql, fsz(), it.missing === "dq" ? missO : orangeO, sc.gLab);
  el("path", { d:`M${L.X(p) + 12} ${L.Y(0)}H${L.X(p) + 20}M${L.X(p) + 16} ${L.Y(0)}V${L.Y(q)}M${L.X(p) + 12} ${L.Y(q)}H${L.X(p) + 20}`, stroke:"#fdba74", "stroke-width":1.6, fill:"none" }, sc.gBack);
}
/* the panel's head: what the model is, and its own step buttons */
function panelHead(it){
  const steps = modelSteps(it), k = it.mStep, m = steps.length > 1;
  $("viewTag").textContent = m ? "Model" : "Diagram";
  $("stepBox").hidden = !m;
  if(!m) return;
  $("stepCap").innerHTML = `<b>${k + 1}/${steps.length}</b> ${steps[k].t}`;
  $("mBack").disabled = k === 0;
  $("mNext").disabled = k >= steps.length - 1;
  $("mNext").classList.toggle("busy", !!ANIM);
}
function animate(d, t0, t1, onEnd){
  cancelAnimationFrame(raf);
  if(reduceMotion){ ANIM = null; onEnd && onEnd(); drawBoard(); return; }
  ANIM = { t:t0, end:onEnd }; const start = performance.now();
  const f = now => {
    const p = clamp((now - start) / d, 0, 1);
    ANIM.t = t0 + (t1 - t0) * p; drawBoard();
    if(p < 1) raf = requestAnimationFrame(f); else { ANIM = null; onEnd && onEnd(); drawBoard(); }
  };
  raf = requestAnimationFrame(f);
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); const e = ANIM.end; ANIM = null; e && e(); } }
function modelNext(){
  const it = cur(); if(!it || ANIM) return;
  const steps = modelSteps(it); if(it.mStep >= steps.length - 1) return;
  it.mStep++; const s = steps[it.mStep];
  if(s.anim) animate(dur(it, s), 0, 1); else drawBoard();
}
function modelBack(){
  const it = cur(); if(!it || ANIM || it.mStep === 0) return;
  const s = modelSteps(it)[it.mStep], k = it.mStep;
  if(s.anim) animate(dur(it, s), 1, 0, () => { it.mStep = k - 1; }); else { it.mStep--; drawBoard(); }
}
$("mNext").addEventListener("click", modelNext);
$("mBack").addEventListener("click", modelBack);

/* The panel is sized to the real page (as the Area Model quizzes): the board gets what is left */
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
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fitBoard(); if(cur()) drawBoard(); }); };
window.addEventListener("resize", onResize);
if(window.ResizeObserver) new ResizeObserver(onResize).observe($("boardWrap"));

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { "pa-rect":"Rectangles and squares", "pa-para":"Parallelograms and rhombuses", "pa-diag":"Rhombuses from their diagonals", "pa-missing":"Find a missing base or height", "pa-diag-missing":"Find a missing diagonal" };
const CATS = ["pa-rect","pa-para","pa-diag","pa-missing","pa-diag-missing"];
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
    tool:CFG.tool, topic:"measurement-space",
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
window.__PQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, modelSteps, hasModel, modelNext, modelBack, areaOf, isRhombus, plan, get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
