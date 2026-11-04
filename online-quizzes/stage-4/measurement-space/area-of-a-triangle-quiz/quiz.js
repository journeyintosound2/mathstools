/* =====================================================================
   AREA OF A TRIANGLE — STUDENT QUIZ
   ---------------------------------------------------------------------
   Same pattern as the Area Model quizzes: the card on the left is ONE
   question and ONE answer space; the panel on the right is the triangle.

   Sweet and Mild: the panel is the teaching tool's model, built from the
   question's own triangle. Students step through it themselves (Show me ▸
   / ◂) — never required, never marked:
     height inside or on a side  → Rectangle: cut along the height, a copy
                                    of each piece slides then turns, and
                                    the copies complete the rectangle
     height outside (obtuse)      → Two copies: a copy slides then turns
                                    into a parallelogram, chop at the edge
                                    of the base and slide the piece across
   A wrong answer on these levels jumps the model to its last step.

   Medium and Spicy: a plain diagram, no unit squares, and a sloping side
   is often labelled too, so the height has to be chosen with care.

   The ladder:
     Sweet  the rectangle it is half of, then areas; right-angled and acute
     Mild   obtuse triangles join in; spot the "forgot to halve" mistake
     Medium no model; a sloping side labelled as a distractor; answers in
            halves (22.5); spot "used the sloping side"
     Spicy  bigger numbers; work backwards to a missing base or height;
            spot "halved twice"

   Marking (as the other quizzes): only the FIRST check scores; Check again
   lets them fix it; an empty check is free; Next on an unanswered question
   counts it as wrong. Nothing typed is ever saved — only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"area-of-a-triangle-student-quiz", title:"Area of a Triangle", mastery:"area-of-a-triangle" };
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
const HALF = `<span class="frac"><span>1</span><span>2</span></span>`;

/* ---------------------------------------------------------- geometry (the teaching tool's) */
const rot = (p, c, deg) => { const r = deg * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]; };
const polyArea = P => { let s = 0; for(let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s) / 2; };
const centroid = P => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
const T = it => [[0, 0], [it.b, 0], [it.a, it.h]];
const where = it => it.a > 0 && it.a < it.b ? "in" : (it.a === 0 || it.a === it.b) ? "edge" : "out";
function clipX(poly, lo, hi){
  const cut = (pts, keep, xi) => { const out = [];
    for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length], pin = keep(p), qin = keep(q);
      if(pin) out.push(p);
      if(pin !== qin){ const t = (xi - p[0]) / (q[0] - p[0]); out.push([xi, p[1] + t * (q[1] - p[1])]); } }
    return out; };
  let r = cut(poly, p => p[0] >= lo - 1e-9, lo); if(r.length < 3) return null;
  r = cut(r, p => p[0] <= hi + 1e-9, hi);
  return r.length >= 3 && polyArea(r) > 1e-6 ? r : null;
}
function yRangeAt(poly, x){
  const ys = [];
  for(let i = 0; i < poly.length; i++){ const p = poly[i], q = poly[(i + 1) % poly.length];
    if((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]){ const t = (x - p[0]) / (q[0] - p[0]); ys.push(p[1] + t * (q[1] - p[1])); }
    else if(p[0] === x) ys.push(p[1]); }
  return ys.length ? [Math.min(...ys), Math.max(...ys)] : null;
}
/* the copy goes onto the LONGER slanted side, so the parallelogram stands on the base */
function paraInfo(it){
  const { a, b, h } = it;
  if(a * a >= (a - b) * (a - b)) return { mid:[a / 2, h / 2], d:a - b, edge:[[0, 0], [a, h]] };
  return { mid:[(a + b) / 2, h / 2], d:a, edge:[[b, 0], [a, h]] };
}
function strips(it){
  const { b } = it, d = paraInfo(it).d, out = [];
  if(d >= 0) for(let k = 0; k * b < d + b - 1e-9; k++) out.push({ lo:k * b, hi:(k + 1) * b, dx:-k * b });
  else for(let k = 0; (1 - k) * b > d + 1e-9; k++) out.push({ lo:-k * b, hi:(1 - k) * b, dx:k * b });
  return out;
}
const cutsAt = it => { const ST = strips(it); return paraInfo(it).d >= 0 ? ST.slice(1).map(s => s.lo) : ST.slice(0, -1).map(s => s.lo); };
/* a copy moves in TWO clear motions: a straight slide (half way towards its place), then a
   half-turn about Q = M + v/2, so it lands where a half-turn about the shared edge's middle puts it */
function moveCopy(P, e0, e1, u){
  const M = [(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2];
  const c0 = centroid(P), vx = M[0] - c0[0], vy = M[1] - c0[1];
  const Q = [M[0] + vx / 2, M[1] + vy / 2];
  const slide = ease(clamp(u / .42, 0, 1)), turn = ease(clamp((u - .55) / .45, 0, 1));
  return P.map(q => rot([q[0] + vx * slide, q[1] + vy * slide], Q, 180 * turn));
}
const hyp = it => it.a === 0 ? [[0, it.h], [it.b, 0]] : [[0, 0], [it.b, it.h]];
function copyMotions(it){
  const { a, b, h } = it, w = where(it);
  if(w === "in") return [{ P:[[0, 0], [a, 0], [a, h]], e:[[0, 0], [a, h]] }, { P:[[a, 0], [b, 0], [a, h]], e:[[b, 0], [a, h]] }];
  if(w === "edge") return [{ P:T(it), e:hyp(it) }];
  return [{ P:T(it), e:paraInfo(it).edge }];
}

/* ---------------------------------------------------------- building questions */
/* sides whose lengths are whole numbers: (across, up, length) */
const TRIPLES = [[3,4,5],[4,3,5],[6,8,10],[8,6,10],[5,12,13],[12,5,13],[9,12,15],[12,9,15],[8,15,17],[15,8,17]];
let USED = new Set();
function fresh(key){ if(USED.has(key)) return false; USED.add(key); return true; }
function base(level, o){
  return Object.assign({ level, model:level === "sweet" || level === "mild", grid:level === "sweet" || level === "mild",
    slant:null, missing:null, mStep:0, settled:false, correct:false, q:"", ask:"", working:"" }, o);
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:t === "num" ? [] : {}, marks:null, fixText:null, sel:null }, o); }
const field = (lab, ans, unit) => ({ lab, ans, unit });
const halfWhy = it => `The rectangle is ${eqS(`${fmt(it.b)} ${X} ${fmt(it.h)} = ${fmt(it.b * it.h)}`)} cm², and the triangle is half of it: ${eqS(`${fmt(it.b * it.h)} ÷ 2 = ${fmt(it.b * it.h / 2)}`)} cm².`;

/* a triangle on base b, height h: kind "right" | "acute" | "obtuse" */
function shape(kind, bLo, bHi, hLo, hHi, parity){
  for(let t = 0; t < 600; t++){
    const b = R(bLo, bHi), h = R(hLo, hHi);
    if(parity === "even" && (b * h) % 2) continue;
    if(parity === "odd" && (b * h) % 2 === 0) continue;
    let a;
    if(kind === "right") a = Math.random() < .5 ? 0 : b;
    else if(kind === "obtuse"){ const o = R(2, Math.max(2, Math.min(6, Math.round(b * .6)))); a = Math.random() < .7 ? b + o : -o; }
    else { if(b < 3) continue; a = R(1, b - 1); if(a * (b - a) >= h * h) continue; }
    if(!fresh(`${b}x${h}:${a}`) && t < 500) continue;
    return { b, h, a };
  }
  return { b:6, h:4, a:kind === "obtuse" ? 8 : kind === "right" ? 0 : 2 };
}
/* a triangle with one sloping side a whole number long (a distractor for the height) */
function slanted(kind, bLo, bHi, hMax, parity){
  for(let t = 0; t < 600; t++){
    const [dx, h, len] = pick(TRIPLES.filter(x => x[1] <= hMax));
    let b, a, side;
    if(kind === "right"){ b = dx; a = Math.random() < .5 ? 0 : b; side = a === 0 ? [[0, h], [b, 0]] : [[0, 0], [b, h]]; }
    else if(kind === "obtuse"){ b = R(bLo, bHi); if(Math.random() < .7){ a = b + dx; side = [[b, 0], [a, h]]; } else { a = -dx; side = [[0, 0], [a, h]]; } }
    else { const q = R(2, Math.max(2, bHi - dx)); b = dx + q; a = dx; side = [[0, 0], [a, h]]; if(a * (b - a) >= h * h) continue; }
    if(b < bLo || b > bHi) continue;
    if(parity === "even" && (b * h) % 2) continue;
    if(parity === "odd" && (b * h) % 2 === 0) continue;
    if(!fresh(`${b}x${h}:${a}`) && t < 500) continue;
    return { b, h, a, slant:{ side, len } };
  }
  return null;
}
function qArea(level, s){
  const it = base(level, s);
  it.q = "Find the area of the triangle.";
  it.steps = [ step("num", { cat:where(it) === "out" ? "tri-area-obtuse" : "tri-area", fields:[ field("Area =", it.b * it.h / 2, "cm²") ], why:() => halfWhy(it) }) ];
  return it;
}
function qRect(level, s){
  const it = base(level, s);
  it.q = where(it) === "out" ? "Two copies of this triangle make a rectangle. What is the area of that rectangle?" : "The triangle is half of a rectangle. What is the area of that rectangle?";
  it.steps = [ step("num", { cat:"tri-rect", fields:[ field("Rectangle =", it.b * it.h, "cm²") ],
    why:() => `The rectangle has the same base and height: ${eqS(`${fmt(it.b)} ${X} ${fmt(it.h)} = ${fmt(it.b * it.h)}`)} cm².` }) ];
  return it;
}
function qMissing(level, s, which){
  const it = base(level, Object.assign({ missing:which }, s));
  const A = it.b * it.h / 2;
  it.q = `The area of the triangle is ${fmt(A)} cm². What is the ${which}?`;
  const ans = which === "height" ? it.h : it.b, other = which === "height" ? it.b : it.h;
  it.steps = [ step("num", { cat:"tri-missing", fields:[ field(which === "height" ? "Height =" : "Base =", ans, "cm") ],
    why:() => `The rectangle is double the triangle: ${eqS(`${fmt(A)} ${X} 2 = ${fmt(2 * A)}`)} cm². Then ${eqS(`${fmt(2 * A)} ÷ ${fmt(other)} = ${fmt(ans)}`)}, so the ${which} is ${fmt(ans)} cm.` }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
function qMistake(level, s, kind){
  const it = base(level, s), name = pick(NAMES), b = it.b, h = it.h, A = b * h / 2;
  let opts;
  if(kind === "half"){
    it.q = `${name} worked out the area like this:`;
    it.working = `${fmt(b)} ${X} ${fmt(h)} = ${fmt(b * h)} cm²`;
    it.ask = `What did ${name} forget?`;
    opts = [ { h:"To halve it — the triangle is half the rectangle", ok:true }, { h:"To add the three sides", ok:false },
             { h:"To double it", ok:false }, { h:`Nothing — ${fmt(b * h)} cm² is right`, ok:false } ];
  } else if(kind === "slant"){
    const v = b * it.slant.len / 2;
    it.q = `${name} worked out the area like this:`;
    it.working = `½ ${X} ${fmt(b)} ${X} ${fmt(it.slant.len)} = ${fmt(v)} cm²`;
    it.ask = "What went wrong?";
    opts = [ { h:"The height must be at right angles to the base", ok:true }, { h:"It should not be halved", ok:false },
             { h:"The base should be the longest side", ok:false }, { h:`Nothing — ${fmt(v)} cm² is right`, ok:false } ];
  } else {
    it.q = `${name} worked out the area like this:`;
    it.working = `½ ${X} ${fmt(b)} ${X} ½ ${X} ${fmt(h)} = ${fmt(b * h / 4)} cm²`;
    it.ask = "What went wrong?";
    opts = [ { h:"It was halved twice — halve only once", ok:true }, { h:"It should not be halved at all", ok:false },
             { h:"The base and height were swapped", ok:false }, { h:`Nothing — ${fmt(b * h / 4)} cm² is right`, ok:false } ];
  }
  it.steps = [ step("mc", { cat:"tri-mistake", opts:shuffle(opts),
    why:() => `The area is half the rectangle, once: ${eqS(`½ ${X} ${fmt(b)} ${X} ${fmt(h)} = ${fmt(A)}`)} cm².` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Right-angled and acute triangles on unit squares. The model shows the rectangle each triangle is half of." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"Obtuse triangles join in — the model makes them into a rectangle too. Spot a classic mistake." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"No model and no squares. A sloping side is labelled too — which length is the height? Some answers are halves." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Bigger numbers, and working backwards from the area to a missing base or height." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  const L0 = level;
  const sh = (k, p) => level === "sweet" ? shape(k, 3, 10, 2, 8, p || "even") : shape(k, 4, 12, 3, 10, p || "even");
  const sl = (k, p, big) => slanted(k, big ? 5 : 4, big ? 18 : 12, big ? 15 : 12, p) || shape(k, 4, 12, 3, 10, p);
  const bg = (k, p) => shape(k, 8, 20, 6, 16, p);
  if(level === "sweet") return [ qRect(L0, sh("right")), qArea(L0, sh("right")), qRect(L0, sh("acute")), qArea(L0, sh("acute")), qArea(L0, sh("right")),
    qArea(L0, sh("acute")), qArea(L0, sh("right")), qArea(L0, sh("acute")), qArea(L0, sh("acute")), qArea(L0, sh("right")) ];
  if(level === "mild") return [ qArea(L0, sh("acute")), qArea(L0, sh("obtuse")), qArea(L0, sh("right")), qMistake(L0, sh("acute"), "half"), qArea(L0, sh("obtuse")),
    qRect(L0, sh("obtuse")), qArea(L0, sh("acute")), qArea(L0, sh("obtuse")), qArea(L0, sh("right")), qArea(L0, sh("obtuse")) ];
  if(level === "medium") return [ qArea(L0, sl("acute", "even")), qArea(L0, sl("obtuse", "even")), qArea(L0, sl("right", "even")), qArea(L0, sh("acute", "odd")),
    qArea(L0, sh("obtuse", "odd")), qMistake(L0, sl("obtuse", "even"), "slant"), qArea(L0, sl("obtuse")), qArea(L0, sh("acute", "odd")),
    qArea(L0, sh("right", "odd")), qArea(L0, sl("obtuse", "odd")) ];
  const four = k => { for(let t = 0; t < 200; t++){ const s = bg(k); if((s.b * s.h) % 4 === 0) return s; } return { b:12, h:8, a:5 }; };
  return [ qMissing(L0, bg("acute"), "height"), qArea(L0, sl("obtuse", null, true)), qMissing(L0, bg("right"), "base"), qArea(L0, bg("acute", "odd")),
    qMissing(L0, sl("obtuse", null, true), "height"), qMistake(L0, four("acute"), "twice"), qMissing(L0, bg("obtuse"), "base"),
    qArea(L0, bg("obtuse", "odd")), qMissing(L0, bg("right"), "height"), qArea(L0, sl("acute", null, true)) ];
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
  if(s.first === null) return it.model ? setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>Use the model if it helps</span>`, "hint") : setPrompt("", "");
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
    /* a wrong first answer: the model shows the whole reason it is half */
    if(!res.ok && it.model){ stopAnim(); it.mStep = modelSteps(it).length - 1; }
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
   THE PANEL — the model (Sweet, Mild) or a plain diagram (Medium, Spicy)
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const C = { tri:"rgba(22,163,74,.66)", triS:"#14532d", half:"rgba(34,197,94,.15)", halfS:"#4ade80", alt:"#ea580c", cut:"#0f172a" };
function modelSteps(it){
  const w = where(it);
  if(w === "in") return [ { t:"The triangle" }, { t:"Cut along the height", anim:"cut" }, { t:"Copy each piece, slide and turn it", anim:"join" } ];
  if(w === "edge") return [ { t:"The triangle" }, { t:"Mark the sloping side" }, { t:"Copy it, slide and turn it", anim:"turn" } ];
  return [ { t:"The triangle" }, { t:"Copy it, slide and turn it", anim:"copy" }, { t:"Chop at the edge of the base and slide", anim:"chop" } ];
}
const DUR = { cut:1500, join:3600, turn:2200, copy:2200, chop:2300 };
function frame(it){
  const { a, b, h } = it, w = where(it);
  let x0 = Math.min(0, a), x1 = Math.max(b, a), y0 = 0, y1 = h;
  if(it.model){
    if(w === "out"){ const d = paraInfo(it).d; x0 = Math.min(x0, d); x1 = Math.max(x1, d + b); }
    let X0 = x0, X1 = x1, Y0 = 0, Y1 = h;
    copyMotions(it).forEach(m => { for(let u = 0; u <= 1.0001; u += .05) moveCopy(m.P, m.e[0], m.e[1], u).forEach(q => {
      X0 = Math.min(X0, q[0]); X1 = Math.max(X1, q[0]); Y0 = Math.min(Y0, q[1]); Y1 = Math.max(Y1, q[1]); }); });
    const capX = (x1 - x0) * .22, capY = h * (w === "out" ? .45 : .3);
    x0 = Math.max(X0, x0 - capX); x1 = Math.min(X1, x1 + capX); y0 = Math.max(Y0, -capY); y1 = Math.min(Y1, h + capY);
  }
  return { x0, x1, y0, y1 };
}
function layout(it){
  const wrap = $("boardWrap");
  const w = Math.max(260, wrap.clientWidth), hh = Math.max(220, wrap.clientHeight);
  const compact = w < 520;
  const M = compact ? { L:46, R:34, T:30, B:52 } : { L:70, R:64, T:36, B:64 };
  const F = frame(it), fw = Math.max(1, F.x1 - F.x0), fh = Math.max(1, F.y1 - F.y0);
  const s = Math.min((w - M.L - M.R) / fw, (hh - M.T - M.B) / fh, 70);
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
const copies = (list, u, g) => list.forEach(p => poly(moveCopy(p.P, p.e[0], p.e[1], u).map(q => [q[0] + (p.sx || 0), q[1]]), { fill:C.half, stroke:C.halfS, "stroke-width":2.2 }, g));
const fsz = () => L.compact ? 15 : 18;

function drawBoard(){
  const it = cur(); if(!it) return;
  L = layout(it);
  svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`);
  svg.innerHTML = "";
  const gGrid = el("g"), gBack = el("g"), gMain = el("g"), gTop = el("g"), gLab = el("g");
  const k = it.model ? it.mStep : 0, t = ANIM ? ANIM.t : 1;
  const sc = { k, t, gBack, gMain, gTop, gLab, hideAlt:false, alt:null };
  if(it.grid && L.s >= 12){
    const x0 = Math.floor(L.F.x0), x1 = Math.ceil(L.F.x1); let d = "";
    for(let x = x0; x <= x1; x++) d += `M${L.X(x)} ${L.Y(0)}V${L.Y(it.h)}`;
    for(let y = 0; y <= it.h; y++) d += `M${L.X(x0)} ${L.Y(y)}H${L.X(x1)}`;
    el("path", { d, stroke:"rgba(15,23,42,.09)", "stroke-width":1, fill:"none", "shape-rendering":"crispEdges" }, gGrid);
  }
  if(!it.model || k === 0) poly(T(it), { fill:C.tri, stroke:C.triS, "stroke-width":3 }, gMain);
  else if(where(it) === "out") scenePara(it, sc); else sceneRect(it, sc);
  drawDims(it, sc);
  panelHead(it);
}
function sceneRect(it, sc){
  const { a, b, h } = it, { k, t } = sc, w = where(it);
  if(w === "in"){
    const line = [[a, h], [a, 0]];
    const cutC = k === 1 ? ease(clamp(t / .85, 0, 1)) : 1;
    const flip = k >= 2 ? clamp(t / .62, 0, 1) : 0;
    const sep = k === 1 ? ease(clamp((t - .85) / .15, 0, 1)) : 1 - ease(clamp((t - .64) / .16, 0, 1));
    const g = 3.5 / L.s * sep;
    const halves = [ { P:[[0, 0], [a, 0], [a, h]], e:[[0, 0], [a, h]], sx:-g }, { P:[[a, 0], [b, 0], [a, h]], e:[[b, 0], [a, h]], sx:g } ];
    halves.forEach(p => poly(p.P.map(q => [q[0] + p.sx, q[1]]), { fill:C.tri, stroke:"none" }, sc.gMain));
    if(flip > 0) copies(halves, flip, sc.gTop);
    /* outlines: the outer edges always; the cut edge fades as the halves join back up */
    const seam = k >= 2 ? sep : 1;
    halves.forEach((p, i) => {
      const Q = p.P.map(q => [q[0] + p.sx, q[1]]);
      el("polyline", { points:pts(i ? Q : [Q[2], Q[0], Q[1]]), fill:"none", stroke:C.triS, "stroke-width":3, "stroke-linejoin":"round", "stroke-linecap":"round" }, sc.gTop);
      if(seam > 0) seg(Q[i ? 2 : 1], Q[i ? 0 : 2], { stroke:C.triS, "stroke-width":3, opacity:seam }, sc.gTop);
    });
    /* then the height slides out to the rectangle's nearer edge */
    const hp = k >= 2 ? ease(clamp((t - .84) / .16, 0, 1)) : 0;
    /* the dotted height takes over from the fading seam, then slides */
    if(k >= 2 && sep < 1){ const to = a <= b / 2 ? 0 : b; sc.alt = { x:a + (to - a) * hp, p:hp, side:to === 0 ? -1 : 1 }; }
    if(cutC < 1) cutLine(line[0], line[1], cutC, sc.gTop, t);
    sc.hideAlt = true;
    return;
  }
  const flip = k >= 2 ? t : 0;
  poly(T(it), { fill:C.tri, stroke:"none" }, sc.gMain);
  if(flip > 0) copies([{ P:T(it), e:hyp(it) }], flip, sc.gTop);
  poly(T(it), { fill:"none", stroke:C.triS, "stroke-width":3 }, sc.gTop);
  if(flip < 1){ const e = hyp(it); seg(e[0], e[1], { stroke:C.cut, "stroke-width":3.4, "stroke-dasharray":"2 7", "stroke-linecap":"round" }, sc.gTop); }
}
function scenePara(it, sc){
  const { b, h } = it, { k, t } = sc, info = paraInfo(it), d = info.d;
  const tri = T(it), PG = [[0, 0], [b, 0], [d + b, h], [d, h]];
  if(k === 1){
    poly(tri, { fill:C.tri, stroke:"none" }, sc.gMain);
    poly(moveCopy(tri, info.edge[0], info.edge[1], t), { fill:C.half, stroke:C.halfS, "stroke-width":2.5 }, sc.gTop);
    poly(tri, { fill:"none", stroke:C.triS, "stroke-width":3 }, sc.gTop);
    return;
  }
  const fin = tri.map(p => rot(p, info.mid, 180));
  const ST = strips(it), cuts = cutsAt(it);
  const cutC = ease(clamp(t / .4, 0, 1)), prog = ease(clamp((t - .48) / .52, 0, 1));
  const sep = clamp((t - .4) / .08, 0, 1) * (1 - prog), g = 5 / L.s * sep;
  if(prog > 0) poly(PG, { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"6 6", opacity:Math.min(1, prog * 1.5) }, sc.gBack);
  [[fin, C.half, C.halfS, 2], [tri, C.tri, C.triS, 3]].forEach(([P, f, st, sw]) => ST.forEach(s => {
    const c = clipX(P, s.lo, s.hi); if(!c) return;
    const shift = s.dx * prog - Math.sign(s.dx) * g;
    poly(c.map(p => [p[0] + shift, p[1]]), { fill:f, stroke:st, "stroke-width":sw }, sc.gMain);
  }));
  if(prog === 0 && sep === 0) cuts.forEach(x => { const r = yRangeAt(PG, x); if(r) cutLine([x, r[1]], [x, r[0]], cutC, sc.gTop, t); });
  if(prog > 0){ const a = it.a, to = a <= b / 2 ? 0 : b; sc.alt = { x:a + (to - a) * prog, p:prog, side:to === 0 ? -1 : 1 }; }
}
/* base, height (or ?), right angle, and on Medium/Spicy a labelled sloping side */
function drawDims(it, sc){
  const { a, b, h } = it, f = fsz();
  const bLab = it.missing === "base" ? "?" : fmt(b) + " cm", hLab = it.missing === "height" ? "?" : fmt(h) + " cm";
  const miss = { color:"#64748b", stroke:"#94a3b8", sw:2 };
  pill(L.X(b / 2), L.Y(0) + (L.compact ? 26 : 30), bLab, f, it.missing === "base" ? miss : { color:"#1d4ed8", stroke:"#93c5fd", sw:2 }, sc.gLab);
  const hOpt = it.missing === "height" ? miss : { color:"#c2410c", stroke:"#fdba74", sw:2 };
  if(sc.alt){
    const { x, p, side } = sc.alt, lw = Math.max(f * 1.7, tw(hLab, f) + f * 1.05);
    seg([x, 0], [x, h], { stroke:C.alt, "stroke-width":2.5, "stroke-dasharray":"7 5" }, sc.gTop);
    const r = Math.min(12, h * L.s * .3), dir = p < .5 ? (a >= b ? -1 : 1) : (side === 1 ? -1 : 1), fx = L.X(x), fy = L.Y(0);
    el("path", { d:`M${fx + dir * r} ${fy}V${fy - r}H${fx}`, fill:"none", stroke:C.alt, "stroke-width":2 }, sc.gTop);
    pill(L.X(x) + side * (lw / 2 + 12) * p, L.Y(h / 2), hLab, f, hOpt, sc.gLab);
    return;
  }
  const w = where(it);
  if(a > b) seg([b, 0], [a, 0], { stroke:"#94a3b8", "stroke-width":2.5, "stroke-dasharray":"2 5", "stroke-linecap":"round" }, sc.gBack);
  if(a < 0) seg([a, 0], [0, 0], { stroke:"#94a3b8", "stroke-width":2.5, "stroke-dasharray":"2 5", "stroke-linecap":"round" }, sc.gBack);
  if(!sc.hideAlt && w !== "edge") seg([a, 0], [a, h], { stroke:C.alt, "stroke-width":2.5, "stroke-dasharray":"7 5" }, sc.gTop);
  const r = Math.min(12, h * L.s * .3), dir = a >= b ? -1 : 1, fx = L.X(a), fy = L.Y(0);
  el("path", { d:`M${fx + dir * r} ${fy}V${fy - r}H${fx}`, fill:"none", stroke:w === "edge" ? C.triS : C.alt, "stroke-width":2 }, sc.gTop);
  const lw = Math.max(f * 1.7, tw(hLab, f) + f * 1.05);
  let side = a <= 0 ? -1 : a >= b ? 1 : (a < b / 2 ? -1 : 1);
  /* a labelled sloping side on the same side as the height label would crowd it: move the height label over */
  let x = L.X(a) + side * (lw / 2 + 10);
  if(w === "in") x = L.X(a);
  pill(x, L.Y(h / 2), hLab, f, hOpt, sc.gLab);
  if(it.slant){
    const [p, q] = it.slant.side, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    /* outside the triangle: away from the third corner */
    /* outside the triangle, square off the side, far enough that the pill clears the line */
    const c = centroid(T(it)), dx = L.X(q[0]) - L.X(p[0]), dy = L.Y(q[1]) - L.Y(p[1]), dl = Math.hypot(dx, dy) || 1;
    let nx = -dy / dl, ny = dx / dl;
    if(nx * (L.X(mx) - L.X(c[0])) + ny * (L.Y(my) - L.Y(c[1])) < 0){ nx = -nx; ny = -ny; }
    const lab = fmt(it.slant.len) + " cm", pw = Math.max((f - 1) * 1.7, tw(lab, f - 1) + (f - 1) * 1.05), ph = (f - 1) * 1.6;
    const off = Math.abs(nx) * pw / 2 + Math.abs(ny) * ph / 2 + 8;
    pill(L.X(mx) + nx * off, L.Y(my) + ny * off, lab, f - 1, { color:"#334155", stroke:"#cbd5e1", sw:1.6 }, sc.gLab);
  }
  if(it.missing){
    const cc = centroid(T(it)), big = polyArea(T(it)) * L.s * L.s > 5000;
    if(big) pill(L.X(cc[0]) + (w === "in" ? (a < b / 2 ? 1 : -1) * 70 : 0), L.Y(cc[1]), `Area = ${fmt(b * h / 2)} cm²`, f, { color:"#14532d", stroke:"rgba(21,128,61,.45)", bg:"#f0fdf4", sw:2 }, sc.gLab);
  }
}
/* the panel's head: what the model is, and its own step buttons */
function panelHead(it){
  const steps = modelSteps(it), k = it.mStep;
  $("viewTag").textContent = !it.model ? "Diagram" : where(it) === "out" ? "Model · Two copies" : "Model · Rectangle";
  $("stepBox").hidden = !it.model;
  if(!it.model) return;
  $("stepCap").innerHTML = `<b>${k + 1}/${steps.length}</b> ${steps[k].t}`;
  $("mBack").disabled = k === 0;
  $("mNext").disabled = k >= steps.length - 1;
  $("mNext").classList.toggle("busy", !!ANIM);
}
function animate(dur, t0, t1, onEnd){
  cancelAnimationFrame(raf);
  if(reduceMotion){ ANIM = null; onEnd && onEnd(); drawBoard(); return; }
  ANIM = { t:t0, end:onEnd }; const start = performance.now();
  const f = now => {
    const p = clamp((now - start) / dur, 0, 1);
    ANIM.t = t0 + (t1 - t0) * p; drawBoard();
    if(p < 1) raf = requestAnimationFrame(f); else { ANIM = null; onEnd && onEnd(); drawBoard(); }
  };
  raf = requestAnimationFrame(f);
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); const e = ANIM.end; ANIM = null; e && e(); } }
function modelNext(){
  const it = cur(); if(!it || !it.model || ANIM) return;
  const steps = modelSteps(it); if(it.mStep >= steps.length - 1) return;
  it.mStep++; const s = steps[it.mStep];
  if(s.anim) animate(DUR[s.anim], 0, 1); else drawBoard();
}
function modelBack(){
  const it = cur(); if(!it || !it.model || ANIM || it.mStep === 0) return;
  const s = modelSteps(it)[it.mStep], k = it.mStep;
  if(s.anim) animate(DUR[s.anim], 1, 0, () => { it.mStep = k - 1; }); else { it.mStep--; drawBoard(); }
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
const CAT_NAMES = { "tri-rect":"The rectangle it is half of", "tri-area":"Find the area", "tri-area-obtuse":"Find the area (obtuse)", "tri-missing":"Find a missing length", "tri-mistake":"Spot the mistake" };
const CATS = ["tri-rect","tri-area","tri-area-obtuse","tri-missing","tri-mistake"];
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
window.__TQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, where, modelSteps, modelNext, modelBack, get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
