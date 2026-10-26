/* =====================================================================
   COUNTING STRATEGIES FOR LINEAR RELATIONSHIPS — STUDENT QUIZ
   One engine for two pages: the First Quadrant quiz and the All Quadrants
   quiz. Each page sets window.CSQ = {quad, toolId, tool, title, ...} before
   loading this file; nothing else differs between them.

   THE LEVELS STEP UP IN APPLICATION, not in number size (teacher design
   2026-10-27):
     Sweet  — skip-counting language throughout: write the numbers, fill a
              table while the graph plots it for you, write the equation in
              a frame  y = [ ] ± [ ]x.
     Mild   — the same ideas in algebra language: from an equation to a
              table and back, "when x = 0, y = 6; each time x increases by 1,
              y increases by 4", equations from tables and graphs.
     Medium — make the graph yourself: complete the table from the rule,
              then CLICK the grid to plot each point.
     Spicy  — use it: worded problems, going further than counting, and
              graphing a line from its equation.

   THE ANSWER IS NEVER ON SCREEN BEFORE IT IS MARKED. A live graph only
   ever plots the student's own numbers; a graph to plot on starts empty.
   Only the FIRST check of each step scores; a question scores if every
   step was right first time. Nothing a student types is ever saved.
   ===================================================================== */

var CL = (function(){
  "use strict";

  // ---------- numbers ----------
  function round(n){ return Math.round(n * 1e10) / 1e10; }
  function fmt(n){
    if(!isFinite(n)) return "";
    n = round(n);
    if(Object.is(n, -0)) n = 0;
    var s = String(n);
    if(/e/i.test(s)) s = n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    return s.replace(/^-/, "−");
  }

  // ---------- the expression parser ----------
  // Accepts what a teacher types: 5+3x, 3x + 5, 3*x+5, 3(x+1), 20 - 2x, x/2 + 1, -x, 2.5x, x^2.
  // Unicode the tidier writes (− × ÷ ·, math-italic x/y) is read back as plain ASCII.
  function normalise(s){
    return String(s)
      .replace(/\u{1D465}/gu, "x").replace(/\u{1D466}/gu, "y")
      .replace(/[−–—]/g, "-")
      .replace(/[×·⋅*]/g, "*")
      .replace(/[÷:]/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/[Xx]/g, "x").replace(/[Yy]/g, "y")
      .replace(/,(?=\d{3}\b)/g, "")
      .replace(/\s+/g, "");
  }
  function tokenize(s){
    var t = [], i = 0;
    while(i < s.length){
      var c = s[i];
      var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if(m){ t.push({k:"n", v:parseFloat(m[1])}); i += m[1].length; continue; }
      if(c === "x" || c === "y"){ t.push({k:c}); i++; continue; }
      if("+-*/^()=".indexOf(c) >= 0){ t.push({k:c}); i++; continue; }
      throw new Error("char");
    }
    return t;
  }
  // Recursive descent to a tree: {k:'n',v} {k:'x'} {k:'y'} {k:'neg',a} {k:'+'|'-'|'*'|'/'|'^',a,b}
  function parseTokens(t){
    var p = 0;
    function peek(){ return t[p]; }
    function eat(k){ if(t[p] && t[p].k === k){ p++; return true; } return false; }
    function expr(){
      var a = term();
      while(peek() && (peek().k === "+" || peek().k === "-")){
        var op = t[p++].k; a = {k:op, a:a, b:term()};
      }
      return a;
    }
    function startsAtom(tk){ return tk && (tk.k === "n" || tk.k === "x" || tk.k === "y" || tk.k === "("); }
    function term(){
      var a = unary();
      for(;;){
        var tk = peek();
        if(tk && (tk.k === "*" || tk.k === "/")){ p++; a = {k:tk.k, a:a, b:unary()}; }
        else if(startsAtom(tk)){ a = {k:"*", a:a, b:power()}; }   // implicit: 3x, 2(x+1), x(x+1)
        else break;
      }
      return a;
    }
    function unary(){
      if(eat("-")) return {k:"neg", a:unary()};
      if(eat("+")) return unary();
      return power();
    }
    function power(){
      var a = atom();
      if(eat("^")) return {k:"^", a:a, b:unary()};
      return a;
    }
    function atom(){
      var tk = t[p];
      if(!tk) throw new Error("end");
      if(tk.k === "n"){ p++; return {k:"n", v:tk.v}; }
      if(tk.k === "x" || tk.k === "y"){ p++; return {k:tk.k}; }
      if(tk.k === "("){ p++; var e = expr(); if(!eat(")")) throw new Error("paren"); return e; }
      throw new Error("unexpected");
    }
    var tree = expr();
    if(p !== t.length) throw new Error("trail");
    return tree;
  }
  function has(tree, k){
    if(!tree) return false;
    if(tree.k === k) return true;
    return has(tree.a, k) || has(tree.b, k);
  }
  function evalTree(tr, x){
    switch(tr.k){
      case "n": return tr.v;
      case "x": return x;
      case "neg": return -evalTree(tr.a, x);
      case "+": return evalTree(tr.a, x) + evalTree(tr.b, x);
      case "-": return evalTree(tr.a, x) - evalTree(tr.b, x);
      case "*": return evalTree(tr.a, x) * evalTree(tr.b, x);
      case "/": return evalTree(tr.a, x) / evalTree(tr.b, x);
      case "^": return Math.pow(evalTree(tr.a, x), evalTree(tr.b, x));
    }
    return NaN;
  }
  function parseSide(s){ return parseTokens(tokenize(s)); }

  // A table cell: a number, or something that works out to one (1/2, -3, 2.5).
  function num(s){
    var n = normalise(s);
    if(n === "") return NaN;
    try{
      var tr = parseSide(n);
      if(has(tr, "x") || has(tr, "y")) return NaN;
      var v = evalTree(tr, 0);
      return isFinite(v) ? v : NaN;
    }catch(e){ return NaN; }
  }

  // An equation: returns {kind:'empty'} | {kind:'fn', f} | {kind:'vert', c} | {kind:'err', msg}
  function equation(raw){
    var s = normalise(raw);
    if(s === "" ) return {kind:"empty"};
    if(s === "y" || s === "y=") return {kind:"err", msg:"Keep going: y = …", soft:true};
    var parts = s.split("=");
    if(parts.length > 2) return {kind:"err", msg:"Only one = sign, please"};
    try{
      if(parts.length === 1){
        var tr = parseSide(parts[0]);
        if(has(tr, "y")) return {kind:"err", msg:"Write it as y = …"};
        return {kind:"fn", f:function(x){ return evalTree(tr, x); }, linear:linearOf(tr)};
      }
      var L = parts[0], R = parts[1];
      if(R === "") return {kind:"err", msg:"What does it equal?", soft:true};
      if(L === "") return {kind:"err", msg:"Start with y =", soft:true};
      if(L === "y" || R === "y"){
        var side = parseSide(L === "y" ? R : L);
        if(has(side, "y")) return {kind:"err", msg:"Write it as y = …"};
        return {kind:"fn", f:function(x){ return evalTree(side, x); }, linear:linearOf(side)};
      }
      if(L === "x" || R === "x"){
        var c = parseSide(L === "x" ? R : L);
        if(has(c, "x") || has(c, "y")) return {kind:"err", msg:"Write it as y = …"};
        return {kind:"vert", c:evalTree(c, 0)};
      }
      return {kind:"err", msg:"Write it as y = …"};
    }catch(e){
      return {kind:"err", msg:"Not finished yet — try something like y = 5 + 3x", soft:true};
    }
  }
  // If f(x) = m x + b exactly (checked at several x), return {m, b}.
  function linearOf(tr){
    try{
      var b = evalTree(tr, 0), m = evalTree(tr, 1) - b;
      if(!isFinite(b) || !isFinite(m)) return null;
      var xs = [-7, -2.5, 3, 11, 40];
      for(var i = 0; i < xs.length; i++){
        var v = evalTree(tr, xs[i]);
        if(!isFinite(v) || Math.abs(v - (m * xs[i] + b)) > 1e-7 * Math.max(1, Math.abs(v))) return null;
      }
      return {m:round(m), b:round(b)};
    }catch(e){ return null; }
  }

  // ---------- tidy what is being typed (pure; caret-preserving) ----------
  // Returns {text, caret}: text is what goes back in the box, caret a UTF-16 index.
  // `caretLogical` = how many non-space characters were before the caret.
  function tidy(raw, caretLogical, alpha){
    var X = alpha ? "\u{1D465}" : "x", Y = alpha ? "\u{1D466}" : "y";
    var chars = Array.from(raw).filter(function(c){ return !/\s/.test(c); });
    var mapped = chars.map(function(c){
      if(c === "-" || c === "–" || c === "−") return "−";
      if(c === "*" || c === "·" || c === "×") return "×";
      if(c === "/" || c === "÷") return "÷";
      if(c === "x" || c === "X" || c === "\u{1D465}") return X;
      if(c === "y" || c === "Y" || c === "\u{1D466}") return Y;
      return c;
    });
    // after[i] = where the caret goes once character i has been typed
    // (past an operator's trailing space, so typing just carries on)
    var out = "", after = [], prev = null;
    for(var i = 0; i < mapped.length; i++){
      var c = mapped[i];
      var binary = (c === "+" || c === "−") ? (prev !== null && prev !== "(" && prev !== "=" && "+−×÷^".indexOf(prev) < 0)
                 : (c === "×" || c === "÷" || c === "=");
      if(binary) out = out.replace(/ $/, "") + " " + c + " ";
      else out += c;
      after.push(out.length);
      prev = c;
    }
    var k = Math.min(caretLogical, after.length);
    var caret = k <= 0 ? 0 : Math.min(after[k - 1], out.length);
    return {text:out, caret:caret};
  }

  // ---------- rules: "Start at a, count up/down by b" ----------
  var LEVELS = {
    sweet:  {starts:[0,12],  steps:[2,3,4,5]},
    mild:   {starts:[0,30],  steps:[2,3,4,5,6,7,8,9,10]},
    medium: {starts:[-20,60],steps:[2,3,4,5,6,7,8,9,11,12,15,20,25]},
    spicy:  {starts:[-30,40],steps:[0.5,1.5,2.5,0.25,0.2,4,6,7,9,12,15]}
  };
  function ri(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function makeRule(level, dirMode, rows, avoid){
    var L = LEVELS[level] || LEVELS.mild;
    for(var tries = 0; tries < 60; tries++){
      var dir = dirMode === "either" ? (Math.random() < .5 ? "up" : "down") : dirMode;
      var step = pick(L.steps), start;
      var span = step * (rows - 1);
      if(level === "sweet" || level === "mild"){
        // never below zero inside the table
        start = dir === "up" ? ri(L.starts[0], L.starts[1]) : Math.ceil(span / step) * step + ri(0, level === "sweet" ? 10 : 20);
        if(dir === "down" && start - span < 0) continue;
      } else if(level === "medium"){
        start = dir === "up" ? ri(L.starts[0], L.starts[1]) : ri(Math.max(10, Math.round(span * .4)), Math.round(span * 1.3) + 10);
      } else {
        start = ri(L.starts[0], L.starts[1]);
        if(step < 1 && Math.random() < .5) start = start + .5;
      }
      if(start === 0 && Math.random() < .6) continue;              // 0 is fine sometimes, not often
      if(step === 1) continue;
      var r = {start:round(start), step:step, dir:dir};
      if(avoid && avoid.start === r.start && avoid.step === r.step && avoid.dir === r.dir) continue;
      return r;
    }
    return {start:5, step:3, dir:"up"};
  }
  function termOf(rule, x){ return round(rule.start + (rule.dir === "up" ? 1 : -1) * rule.step * x); }

  // ---------- axes ----------
  function niceStep(raw){
    if(!(raw > 0) || !isFinite(raw)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var n = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    return n * p;
  }
  function minorDiv(step){
    var p = Math.pow(10, Math.floor(Math.log10(step) + 1e-9)), f = Math.round(step / p);
    return f === 2 ? 4 : 5;
  }
  // Include zero when the data are close enough to it for zero to matter.
  function rangeFor(lo, hi){
    if(hi - lo < 1e-9){
      if(lo > 0) lo = 0; else if(hi < 0) hi = 0; else { lo = -1; hi = 1; }
    } else {
      if(lo > 0 && lo <= 2 * (hi - lo)) lo = 0;
      if(hi < 0 && -hi <= 2 * (hi - lo)) hi = 0;
    }
    if(hi - lo < 1e-9) hi = lo + 1;
    return [lo, hi];
  }
  // Fit [xlo,xhi] x [ylo,yhi] into a W x H box with pixel padding.
  // equal=false: each axis stretched on its own (auto-scale). equal=true: one unit is the same length both ways.
  var PAD = {l:48, r:86, t:24, b:32};   // r: clear of the tools column
  function fit(xs, ys, W, H, equal){
    var xr = rangeFor(Math.min.apply(null, xs), Math.max.apply(null, xs));
    var yr = rangeFor(Math.min.apply(null, ys), Math.max.apply(null, ys));
    var iw = Math.max(40, W - PAD.l - PAD.r), ih = Math.max(40, H - PAD.t - PAD.b);
    if(!equal){
      var sx = niceStep((xr[1] - xr[0]) / Math.max(2, iw / 90)), sy = niceStep((yr[1] - yr[0]) / Math.max(2, ih / 70));
      xr = [Math.floor(xr[0] / sx + 1e-9) * sx, Math.ceil(xr[1] / sx - 1e-9) * sx];
      yr = [Math.floor(yr[0] / sy + 1e-9) * sy, Math.ceil(yr[1] / sy - 1e-9) * sy];
      var ux = (xr[1] - xr[0]) / iw, uy = (yr[1] - yr[0]) / ih;
      return {x0:xr[0] - PAD.l * ux, x1:xr[1] + PAD.r * ux, y0:yr[0] - PAD.b * uy, y1:yr[1] + PAD.t * uy};
    }
    var u = Math.max((xr[1] - xr[0]) / iw, (yr[1] - yr[0]) / ih);
    var cx = (xr[0] + xr[1]) / 2, cy = (yr[0] + yr[1]) / 2;
    var halfW = (W / 2) * u, halfH = (H / 2) * u;
    // centre the data inside the padded box
    var offX = ((PAD.l - PAD.r) / 2) * u, offY = ((PAD.b - PAD.t) / 2) * u;
    return {x0:cx - halfW - offX, x1:cx + halfW - offX, y0:cy - halfH - offY, y1:cy + halfH - offY};
  }

  return {fmt:fmt, num:num, equation:equation, tidy:tidy, normalise:normalise,
          makeRule:makeRule, termOf:termOf, niceStep:niceStep, minorDiv:minorDiv,
          rangeFor:rangeFor, fit:fit, PAD:PAD, LEVELS:LEVELS, round:round};
})();
if(typeof module !== "undefined") module.exports = CL;


(function(){
"use strict";
const CFG = window.CSQ || { quad:false };
const QUAD = !!CFG.quad;
const CTX = window.MMT_CL_CTX;
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const QUIZ_N = 10;
const rnd = (a,b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const R = CL.round, F = CL.fmt;
const term = (r, x) => CL.termOf(r, x);
const slope = r => r.dir === "up" ? r.step : -r.step;
const span = (a, b) => { const o = []; for(let x = a; x <= b; x++) o.push(x); return o; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* x and y the way an equation editor sets them, when the font has the glyphs */
let ALPHA = false;
try{
  const c = document.createElement("canvas").getContext("2d");
  c.font = '100px "Cambria Math","STIX Two Math","Latin Modern Math",serif';
  const real = c.measureText("\u{1D465}\u{1D466}\u{1D465}\u{1D466}").width, gone = c.measureText("").width;
  ALPHA = real > 0 && gone > 0 && Math.abs(real - gone) > 1;
}catch(e){}
const X = ALPHA ? "\u{1D465}" : "<i>x</i>";
const Y = ALPHA ? "\u{1D466}" : "<i>y</i>";

/* =====================================================================
   WHICH x VALUES. All Quadrants goes back past the start (counting back);
   a worded problem always stays at x ≥ 0 — there is no "−2 hours".
   ===================================================================== */
const XR = QUAD
  ? { seq:span(-2,2), table:span(-3,3), plot:span(-2,2) }
  : { seq:span(0,4),  table:span(0,5),  plot:span(0,4) };
const STORY_XS = { table:span(0,5), plot:span(0,4) };

/* =====================================================================
   NUMBERS
   ===================================================================== */
const NUM = {
  sweet:  { m:[2,3,4,5],          b:12 },
  mild:   { m:[2,3,4,5,6],        b:20 },
  medium: { m:[1,2,3,4,5,6],      b:20 },
  spicy:  { m:[1,2,3,4,5,6,7,8],  b:30 }
};
let USED = new Set();

/* y-axis scale: square cells, whole numbers never finer than 1 a square,
   points on grid lines whenever a scale allows it */
const STEPS = [0.1,0.2,0.25,0.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000];
const onLines = (vals, f) => vals.every(v => Math.abs((v - f.a) / f.s - Math.round((v - f.a) / f.s)) < 1e-6);
function yScale(vals, zero, maxSq){
  const MAX = maxSq || 14;
  const rv = zero ? vals.concat([0]) : vals;
  const whole = vals.every(v => Number.isInteger(R(v)));
  let [lo, hi] = CL.rangeFor(Math.min(...rv), Math.max(...rv));
  const fits = s => { const a = Math.floor(lo / s + 1e-9) * s, b = Math.ceil(hi / s - 1e-9) * s; return { s, a:R(a), b:R(b), n:Math.round((b - a) / s) }; };
  const ok = STEPS.filter(s => !whole || s >= 1).map(fits).filter(f => f.n <= MAX && f.n >= 3);
  const friendly = f => { const m = Math.round(f.s / Math.pow(10, Math.floor(Math.log10(f.s) + 1e-9)) * 100) / 100; return m === 1 || m === 2 || m === 5; };
  /* a friendly scale with every point on a line, then any scale with them on lines, then a friendly one */
  let f = ok.find(g => onLines(vals, g) && friendly(g)) || ok.find(g => onLines(vals, g)) || ok.find(friendly) || ok[0] || fits(1000);
  if(f.n < MAX && Math.max(...rv) >= f.b - 1e-9) f = { s:f.s, a:f.a, b:R(f.b + f.s), n:f.n + 1 };
  if(f.n < MAX && Math.min(...rv) <= f.a + 1e-9 && f.a !== 0) f = { s:f.s, a:R(f.a - f.s), b:f.b, n:f.n + 1 };
  return f;
}
const readable = (r, xs, zero) => { const v = xs.map(x => term(r, x)); return onLines(v, yScale(v, zero)); };

/* A rule for a question.
   o.dir 'up' | 'down' | 'any'; o.xs = the x values it is used at;
   o.read = a graph will be READ or PLOTTED, so every point must sit on a grid crossing;
   o.first = keep to the first quadrant even in the All Quadrants quiz; o.bmax caps the start;
   o.half = a gradient of 0.5 or 1.5 is allowed (Spicy). */
function makeRule(level, o){
  o = o || {};
  const N = NUM[level], xs = o.xs || span(0, 5);
  const firstQ = !QUAD || o.first;
  const maxX = Math.max(...xs);
  for(let t = 0; t < 400; t++){
    const m = o.half && Math.random() < .6 ? pick([0.5, 1.5]) : pick(N.m);
    const dir = o.dir === "any" || !o.dir ? (Math.random() < .5 ? "up" : "down") : o.dir;
    const bmax = o.bmax || N.b;
    let b;
    if(firstQ){
      /* every y in the table at or above zero */
      b = dir === "down" ? m * maxX + rnd(0, Math.max(3, Math.round(bmax / 2))) : rnd(level === "sweet" || level === "mild" ? 1 : 0, bmax);
    } else {
      /* All Quadrants: the start may be negative from Mild on */
      b = level === "sweet" ? rnd(1, Math.min(bmax, 10)) : rnd(-Math.round(bmax / 2), bmax);
    }
    if(m % 1 && b % 1 === 0 && Math.random() < .3) b += 0.5;
    b = R(b);
    const r = { start:b, step:m, dir };
    /* the two numbers must be told apart, or "swapped" can't be spotted */
    if(b === m || Math.abs(b) === m) continue;
    if(b === 0 && !o.zeroOK) continue;
    if(firstQ && xs.some(x => term(r, x) < 0)) continue;
    if(o.read && !readable(r, o.fit || xs, !firstQ)) continue;
    if(o.check && !o.check(r)) continue;
    const k = r.start + "|" + r.step + "|" + r.dir;
    if(USED.has(k)) continue;
    USED.add(k);
    return r;
  }
  return { start:3, step:2, dir:"up" };
}
/* A worded problem (always first quadrant). */
function makeStory(level, o){
  o = o || {};
  for(let t = 0; t < 120; t++){
    const st = CTX.make(level, o.dir || "either", o.rows || 10);
    if(!st) continue;
    const r = st.rule;
    if(o.read && !readable(r, o.xs || STORY_XS.plot, false)) continue;
    if(o.intOnly && (!Number.isInteger(r.start) || !Number.isInteger(r.step))) continue;
    const k = r.start + "|" + r.step + "|" + r.dir;
    if(USED.has(k)) continue;
    USED.add(k);
    return { id:st.id, name:st.name, r };
  }
  return null;
}

/* ---------- writing it down ---------- */
const instr = r => `Start at <span class="num start">${F(r.start)}</span>, count ${r.dir} by <span class="num step">${F(r.step)}</span>s`;
function eqHTML(r, form){
  const m = slope(r), b = r.start;
  const mx = (Math.abs(m) === 1 ? "" : F(Math.abs(m))) + X;
  if(b === 0) return `${Y} = ${m < 0 ? "−" : ""}${mx}`;
  if(form === "grad") return `${Y} = ${m < 0 ? "−" : ""}${mx} ${b < 0 ? "−" : "+"} ${F(Math.abs(b))}`;
  return `${Y} = ${F(b)} ${m < 0 ? "−" : "+"} ${mx}`;
}
const anyForm = () => Math.random() < .5 ? "start" : "grad";
const descHTML = r => `When ${X} = 0, ${Y} = <b>${F(r.start)}</b>. Each time ${X} increases by 1, ${Y} ${r.dir === "up" ? "increases" : "decreases"} by <b>${F(r.step)}</b>.`;
const ctxOf = st => st ? CTX.BY[st.id] : null;
const storyHTML = st => CTX.storyHTML({ id:st.id, name:st.name, rule:st.r }, (k, t) => `<span class="num ${k}">${t}</span>`);
const letLine = st => { const c = ctxOf(st); return `Let ${X} = ${esc(c.x)} and ${Y} = ${esc(c.y)}.`; };
const yName = c => c.y.replace(/ \(.*\)$/, "");
const xOne = c => c.x.replace(/s$/, "");

/* =====================================================================
   QUESTIONS. An item is { level, r, st, q, sub, steps[], graph }.
   A step is one thing to do and check; the next appears once it is checked.
   ===================================================================== */
const step = (t, extra) => Object.assign({ t, first:null, last:null, marks:null }, extra);
const CAT = { seq:"count", table:"table", frame:"equation", eq:"equation", count:"meaning", desc:"meaning", plot:"plot", num:"apply", mc:"meaning" };
const CAT_NAME = { count:"Counting", table:"Tables", equation:"Equations", meaning:"What the numbers mean", plot:"Plotting", apply:"Using it" };

function graphFor(r, xs, o){
  o = o || {};
  const zero = QUAD && !o.first;
  const xMin = zero ? Math.min(...xs) - 1 : 0, xMax = Math.max(...xs) + 1;
  return Object.assign({ r, fit:xs, xMin, xMax, zero, given:[], liveStep:-1, plotStep:-1, line:false, ctx:null }, o);
}

/* ---- Sweet: counting language ---- */
function qSeq(level, dir){
  const xs = XR.seq, r = makeRule(level, { dir, xs });
  return { r, q:instr(r) + ".",
    sub: QUAD ? `Count back as well as on: write ${Y} for ${X} = −2 to 2.` : "Write the first five numbers.",
    steps:[ step("seq", { xs, caps:QUAD }) ], graph:null };
}
function qTableLive(level, dir, then){
  const xs = XR.table, r = makeRule(level, { dir, xs });
  const steps = [ step("table", { xs, live:true }) ];
  if(then) steps.push(step("frame"));
  return { r, q:instr(r) + ".",
    sub: QUAD ? `${X} = 0 is the start. Count on for positive ${X}, and back for negative ${X}.` : `${X} = 0 is the start, ${X} = 1 is one count on, and so on.`,
    steps, graph:graphFor(r, xs, { liveStep:0 }) };
}
function qFrame(level, dir){
  const r = makeRule(level, { dir, xs:XR.seq });
  return { r, q:instr(r) + ".", sub:"Write it as an equation: the start is the number on its own, the count goes with " + X + ".", steps:[ step("frame") ], graph:null };
}
function qCountFromEq(level){
  const r = makeRule(level, { dir:"any", xs:XR.seq }), form = anyForm();
  return { r, q:`<span class="eqBig">${eqHTML(r, form)}</span>`, sub:"What counting does this equation describe?", steps:[ step("count") ], graph:null };
}

/* ---- Mild: algebra language ---- */
function qTableFromRule(level, dir, live){
  const xs = live ? XR.table : XR.plot, r = makeRule(level, { dir, xs, read:!live });
  return { r, q:`<span class="eqBig">${eqHTML(r, anyForm())}</span>`, sub:`Substitute each value of ${X} into the equation.`,
    steps:[ step("table", { xs, live:!!live }) ].concat(live ? [] : [ step("plot", { xs }) ]),
    graph: graphFor(r, xs, live ? { liveStep:0 } : { plotStep:1 }) };
}
function qDescFromEq(level){
  const r = makeRule(level, { dir:"any", xs:XR.seq });
  return { r, q:`<span class="eqBig">${eqHTML(r, anyForm())}</span>`, sub:"What do the two numbers tell you?", steps:[ step("desc") ], graph:null };
}
function qEqFromDesc(level, dir){
  const r = makeRule(level, { dir, xs:XR.seq });
  return { r, q:descHTML(r), sub:"Write the equation.", steps:[ step("eq") ], graph:null };
}
function qEqFromTable(level, dir){
  const xs = XR.plot, r = makeRule(level, { dir, xs });
  return { r, q:"This table shows a linear relationship.", sub:"Write its equation.", given:"table", gxs:xs, steps:[ step("eq") ], graph:null };
}
function qEqFromGraph(level, dir, st){
  if(st){
    const r = st.r;
    return { r, st, q:`These points show the ${esc(yName(ctxOf(st)))} after ${X} ${esc(ctxOf(st).x)}.`, sub:letLine(st) + " Write the equation.",
      steps:[ step("eq") ], graph:graphFor(r, STORY_XS.plot, { first:true, given:STORY_XS.plot, ctx:ctxOf(st) }) };
  }
  const xs = XR.plot, r = makeRule(level, { dir, xs, read:true });
  return { r, q:"These points lie on a straight line.", sub:`Read the points, then write the equation of the line.`,
    steps:[ step("eq") ], graph:graphFor(r, xs, { given:xs }) };
}
function qMcTable(level){
  const xs = XR.plot;
  const r = makeRule(level, { dir:"any", xs, check:r => r.start !== 0 && Math.abs(r.start) !== r.step });
  const b = r.start, m = slope(r);
  const cands = [
    { r, ok:true },
    { r:{ start:m, step:Math.abs(b), dir:b < 0 ? "down" : "up" }, ok:false },             // the two numbers swapped
    { r:{ start:b, step:r.step, dir:r.dir === "up" ? "down" : "up" }, ok:false },          // the wrong way
    { r:{ start:R(b + m), step:r.step, dir:r.dir }, ok:false }                             // starting one step late
  ];
  const seen = new Set(), opts = [];
  cands.forEach(c => { const k = [0,1,2].map(x => term(c.r, x)).join(","); if(!seen.has(k)){ seen.add(k); opts.push({ html:`<span class="eq">${eqHTML(c.r, anyForm())}</span>`, ok:c.ok }); } });
  return { r, q:"Which equation matches this table?", sub:"Test a pair of values from the table in each one.", given:"table", gxs:xs,
    steps:[ step("mc", { opts:shuffle(opts) }) ], graph:null };
}

/* ---- Medium: make the graph yourself ---- */
function qPlotFromTable(level, dir){
  const xs = XR.plot, r = makeRule(level, { dir, xs, read:true });
  return { r, q:`Plot the points from this table.`, sub:`Click the grid where each point goes. Click a point again to take it off.`, given:"table", gxs:xs,
    steps:[ step("plot", { xs }) ], graph:graphFor(r, xs, { plotStep:0 }) };
}

/* ---- Spicy: use it ---- */
function qStoryEq(level, dir){
  const st = makeStory(level, { dir, intOnly:level !== "spicy" });
  if(!st) return qEqFromDesc(level, dir === "either" ? "any" : dir);
  return { r:st.r, st, q:storyHTML(st), sub:letLine(st) + " Write an equation for " + Y + ".", steps:[ step("eq") ], graph:null };
}
function qStoryFar(level){
  const st = makeStory(level, { dir:"either", intOnly:true });
  if(!st) return qRuleFar(level);
  const c = ctxOf(st), r = st.r;
  const x1 = rnd(6, 9), k = pick(span(2, 8).filter(v => v !== x1));
  return { r, st, q:storyHTML(st), sub:letLine(st),
    steps:[ step("num", { fields:[
      { lab:`What is ${Y} when ${X} = ${x1} (${esc(c.x)})?`, ans:term(r, x1), pre:`${Y} =` },
      { lab:`When is ${Y} = ${F(term(r, k))}?`, ans:k, pre:`${X} =` }
    ] }) ], graph:null };
}
function qRuleFar(level){
  const r = makeRule(level, { dir:QUAD ? "any" : "up", xs:QUAD ? span(-10, 25) : span(0, 25) });
  const k = rnd(12, 24), form = anyForm();
  const fields = [ { lab:`Find ${Y} when ${X} = 25.`, ans:term(r, 25), pre:`${Y} =` } ];
  if(QUAD) fields.push({ lab:`Find ${Y} when ${X} = −10.`, ans:term(r, -10), pre:`${Y} =` });
  fields.push({ lab:`Which value of ${X} gives ${Y} = ${F(term(r, k))}?`, ans:k, pre:`${X} =` });
  return { r, q:`<span class="eqBig">${eqHTML(r, form)}</span>`, sub:"Use the equation — too far to count.", steps:[ step("num", { fields }) ], graph:null };
}
function qGraphLine(level, o){
  o = o || {};
  const xs = XR.plot;
  const r = makeRule(level, { dir:o.dir || "any", xs, read:true, half:!!o.half, zeroOK:true, bmax:QUAD ? 8 : 12 });
  return { r, q:`Graph the line <span class="eqBig">${eqHTML(r, anyForm())}</span>`, sub:"Complete the table, then plot the points. The line is drawn through them once they are marked.",
    steps:[ step("table", { xs, live:false }), step("plot", { xs }) ], graph:graphFor(r, xs, { plotStep:1, line:true }) };
}
function qStoryPlot(level){
  const xs = STORY_XS.plot;
  const st = makeStory(level, { dir:"either", read:true, xs, intOnly:true });
  if(!st) return qGraphLine(level);
  const c = ctxOf(st);
  return { r:st.r, st, q:storyHTML(st), sub:letLine(st) + " Complete the table, then plot the points.",
    steps:[ step("table", { xs, live:false }), step("plot", { xs }) ], graph:graphFor(st.r, xs, { first:true, plotStep:1, line:true, ctx:c }) };
}
function qStoryMeaning(level){
  const st = makeStory(level, { dir:"either", intOnly:true });
  if(!st) return qDescFromEq(level);
  const c = ctxOf(st), r = st.r, yn = yName(c), xo = xOne(c);
  const A = CTX.fmtVal(c, r.start), B = CTX.fmtVal(c, r.step);
  const askStep = Math.random() < .5;
  const val = askStep ? F(r.step) : F(r.start);
  const opts = askStep ? [
    { html:`Every ${esc(xo)}, the ${esc(yn)} goes ${r.dir} by ${esc(B)}.`, ok:true },
    { html:`At the start, the ${esc(yn)} is ${esc(B)}.`, ok:false },
    { html:`After ${F(r.step)} ${esc(c.x)}, the ${esc(yn)} is ${esc(A)}.`, ok:false },
    { html:`The ${esc(yn)} is always ${esc(B)}.`, ok:false }
  ] : [
    { html:`At the start (${X} = 0), the ${esc(yn)} is ${esc(A)}.`, ok:true },
    { html:`Every ${esc(xo)}, the ${esc(yn)} goes ${r.dir} by ${esc(A)}.`, ok:false },
    { html:`After ${F(r.start)} ${esc(c.x)}, the ${esc(yn)} is ${esc(B)}.`, ok:false },
    { html:`The ${esc(yn)} is always ${esc(A)}.`, ok:false }
  ];
  return { r, st, q:storyHTML(st), sub:`${letLine(st)} The equation is <span class="eq">${eqHTML(r, "start")}</span>. What does the <b>${val}</b> tell you?`,
    steps:[ step("mc", { opts:shuffle(opts) }) ], graph:null };
}

/* =====================================================================
   THE FOUR PAPERS — ten questions each, in the order they build.
   ===================================================================== */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Skip counting: write the numbers, fill a table while the graph plots it for you, and write the equation." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"The same ideas in algebra words: from an equation to a table and back, and equations from tables and graphs." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"Make the graph yourself: complete the table from the equation, then click the grid to plot every point." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Use it: worded problems, going further than counting can, and graphing lines from their equations." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  const up = Math.random() < .5 ? "up" : "down", dn = up === "up" ? "down" : "up";
  let items;
  if(level === "sweet") items = [
    qSeq("sweet", up), qSeq("sweet", dn),
    qTableLive("sweet", up), qTableLive("sweet", dn),
    qFrame("sweet", "up"), qFrame("sweet", "down"),
    qTableLive("sweet", dn, true), qTableLive("sweet", up, true),
    qCountFromEq("sweet"), qFrame("mild", "any")
  ];
  else if(level === "mild") items = [
    qTableFromRule("mild", up, true), qTableFromRule("mild", dn, true),
    qDescFromEq("mild"),
    qEqFromDesc("mild", "up"), qEqFromDesc("mild", "down"),
    qEqFromTable("mild", up), qEqFromTable("mild", dn),
    qEqFromGraph("mild", up), qEqFromGraph("mild", dn),
    qMcTable("mild")
  ];
  else if(level === "medium") items = [
    qTableFromRule("medium", "up"), qTableFromRule("medium", "down"),
    qPlotFromTable("medium", up),
    qTableFromRule("medium", "any"),
    qEqFromGraph("medium", dn),
    qTableFromRule("medium", dn),
    qPlotFromTable("medium", dn),
    qEqFromDesc("medium", "any"),
    qTableFromRule("medium", up),
    qEqFromTable("medium", "any")
  ];
  else {
    const st10 = QUAD ? null : makeStory("mild", { dir:"either", read:true, xs:STORY_XS.plot, intOnly:true });
    items = [
      qStoryEq("medium", "up"), qStoryEq("medium", "down"),
      qStoryFar("medium"), qRuleFar("spicy"),
      qGraphLine("spicy", { dir:"down" }),
      qStoryPlot("mild"),
      qGraphLine("spicy", { dir:"any" }),
      qStoryMeaning("medium"),
      qGraphLine("spicy", { half:true }),
      st10 ? qEqFromGraph("spicy", "any", st10) : qEqFromGraph("spicy", "any")
    ];
  }
  return items.map(it => Object.assign(it, { level, settled:false, correct:false }));
}

/* =====================================================================
   MARKING
   ===================================================================== */
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
const numOf = s => CL.num(String(s).trim());
const words = it => it.level === "sweet" ? "count" : "alg";

/* Why an equation is wrong, in the level's language. */
function whyEq(it, gotB, gotM){
  const r = it.r, b = r.start, m = slope(r), w = words(it);
  if(gotB != null && gotM != null){
    if(near(gotB, m) && near(gotM, b)) return w === "count"
      ? `The two numbers are swapped. The start (${F(b)}) is the number on its own; the count (${F(Math.abs(m))}) goes with ${X}.`
      : `The two numbers are swapped. The number on its own is ${Y} when ${X} = 0 (${F(b)}); the number with ${X} is how much ${Y} changes each step (${F(m)}).`;
    if(near(gotB, b) && near(gotM, -m)) return `Check the direction: it goes ${r.dir}, so the number with ${X} is ${F(m)}.`;
    if(near(gotB, b)) return w === "count" ? `The start is right. Check how much it counts by each time.` : `The number on its own is right. Check how much ${Y} changes each time ${X} goes up by 1.`;
    if(near(gotM, m)) return w === "count" ? `The count is right. Check the start — the number when ${X} = 0.` : `The number with ${X} is right. Check ${Y} when ${X} = 0.`;
  }
  return w === "count" ? `Use the start for the number on its own and the count for the number with ${X}.` : `Find ${Y} when ${X} = 0, and how much ${Y} changes each time ${X} goes up by 1.`;
}

/* each returns { invalid } (nothing used up), or { ok, marks, fix } */
function markStep(it, s){
  const r = it.r;
  if(s.t === "seq" || s.t === "table"){
    const vals = s.xs.map((x, i) => (s.vals || [])[i]);
    if(vals.some(v => v == null || String(v).trim() === "")) return { invalid:"Fill in every box first." };
    const got = vals.map(numOf);
    if(got.some(v => !isFinite(v))) return { invalid:"Each box needs a number." };
    const marks = got.map((g, i) => near(g, term(r, s.xs[i])));
    const ok = marks.every(Boolean);
    const wrong = s.xs.filter((x, i) => !marks[i]);
    return { ok, marks, fix: ok ? "" : `The right numbers are shown under the boxes. ${wrong.length === 1 ? `Check ${X} = ${F(wrong[0])}.` : ""}` };
  }
  if(s.t === "frame"){
    const v = s.vals || {};
    const a = numOf(v.a || ""), b = numOf(v.b || "");
    if(!isFinite(a) || !isFinite(b)) return { invalid:"Put a number in both boxes." };
    if(!v.sign) return { invalid:"Choose + or − between the two numbers." };
    const gm = v.sign === "-" ? -b : b;
    const ok = near(a, r.start) && near(gm, slope(r));
    return { ok, marks:{ a:near(a, r.start), m:near(gm, slope(r)) }, fix: ok ? "" : whyEq(it, a, gm) + ` <span class="eq">${eqHTML(r, "start")}</span>` };
  }
  if(s.t === "eq"){
    const res = CL.equation(s.val || "");
    if(res.kind === "empty") return { invalid:`Type the equation, like ${Y} = 5 + 3${X}.` };
    if(res.kind === "err" || res.kind === "vert") return { invalid:`Write it in the form ${Y} = … , like ${Y} = 5 + 3${X}.` };
    const f = res.f;
    const ok = [-3, -1, 0, 1, 2, 5, 10].every(x => near(f(x), term(r, x)));
    const lin = res.linear;
    return { ok, marks:{ eq:ok }, fix: ok ? "" : (lin ? whyEq(it, lin.b, lin.m) : `That is not a straight line — it should be a number plus a number times ${X}.`) + ` One right answer: <span class="eq">${eqHTML(r, "start")}</span>` };
  }
  if(s.t === "count" || s.t === "desc"){
    const v = s.vals || {};
    const a = numOf(v.a || ""), b = numOf(v.b || "");
    if(!isFinite(a) || !isFinite(b)) return { invalid:"Put a number in both boxes." };
    if(!v.dir) return { invalid: s.t === "count" ? "Choose up or down." : "Choose increases or decreases." };
    /* a negative number in the box with the matching word still means the same thing */
    let gb = b, gd = v.dir;
    if(gb < 0){ gb = -gb; gd = gd === "up" ? "down" : "up"; }
    const marks = { a:near(a, r.start), dir:gd === r.dir, b:near(gb, r.step) };
    const ok = marks.a && marks.dir && marks.b;
    const right = s.t === "count" ? `${instr(r)}.` : descHTML(r);
    return { ok, marks, fix: ok ? "" : right };
  }
  if(s.t === "plot"){
    const pts = s.pts || {};
    const xsSet = s.xs;
    if(!Object.keys(pts).length) return { invalid:"Click the grid to plot your points first." };
    const marks = {};
    Object.keys(pts).forEach(k => { const x = Number(k); marks[k] = xsSet.includes(x) && near(pts[k], term(r, x)); });
    const missing = xsSet.filter(x => !(String(x) in pts) || !marks[String(x)]);
    const extra = Object.keys(pts).filter(k => !xsSet.includes(Number(k)));
    const ok = missing.length === 0 && extra.length === 0;
    return { ok, marks, fix: ok ? "" : `${missing.length ? `${missing.length === 1 ? "One point is" : missing.length + " points are"} missing or in the wrong place — the green rings show where they go.` : ""}${extra.length ? " Only plot the points from the table." : ""}` };
  }
  if(s.t === "num"){
    const vals = s.fields.map((f, i) => (s.vals || [])[i]);
    if(vals.some(v => v == null || String(v).trim() === "")) return { invalid:"Answer every part first." };
    const got = vals.map(numOf);
    if(got.some(v => !isFinite(v))) return { invalid:"Each answer needs a number." };
    const marks = got.map((g, i) => near(g, s.fields[i].ans));
    const ok = marks.every(Boolean);
    return { ok, marks, fix: ok ? "" : `The right answers are shown. Write the equation first: <span class="eq">${eqHTML(r, "start")}</span>, then substitute.` };
  }
  if(s.t === "mc"){
    if(s.sel == null || s.sel < 0) return { invalid:"Choose an answer first." };
    const ok = !!s.opts[s.sel].ok;
    return { ok, marks:{ sel:s.sel }, fix: ok ? "" : "The right answer is marked in green." };
  }
  return { invalid:"?" };
}

/* =====================================================================
   STATE
   ===================================================================== */
const S = { levelKey:null, items:[], i:0 };
const cur = () => S.items[S.i];
const lv = () => LEVELS[S.levelKey];
const curStepIndex = it => { const k = it.steps.findIndex(s => s.first === null); return k < 0 ? it.steps.length - 1 : k; };
function setPrompt(text, kind){
  const p = $("promptBar"); p.className = "promptBar" + (kind ? " " + kind : "");
  $("promptIco").textContent = kind === "good" ? "✅" : kind === "bad" ? "\u{1F50E}" : kind === "warn" ? "✋" : "\u{1F4AD}";
  $("promptText").innerHTML = text;
}

/* =====================================================================
   DRAWING THE QUESTION
   ===================================================================== */
const STEP_TITLE = {
  seq: it => it.steps[0].caps ? "Write the numbers" : "Write the first five numbers",
  table: (it, s) => s.live ? "Complete the table — the graph plots your numbers as you go" : "Complete the table",
  frame: () => "Write the equation",
  eq: () => "Write the equation",
  count: () => "Write it as counting",
  desc: () => "What do the numbers mean?",
  plot: () => "Plot the points on the grid",
  num: () => "Work it out",
  mc: () => "Choose one"
};
function tableHTML(it, s, k, given){
  const r = it.r, c = ctxOf(it.st);
  const xs = given ? it.gxs : s.xs;
  let h = `<div class="tvWrap"><table class="tv"><tr><th>${c ? `<span class="cap">${esc(c.x)}</span>` : ""}${X}</th>${xs.map(x => `<td class="giv">${F(x)}</td>`).join("")}</tr>`;
  h += `<tr><th>${c ? `<span class="cap">${esc(yName(c))}</span>` : ""}${Y}</th>`;
  xs.forEach((x, i) => {
    if(given){ h += `<td class="giv">${F(term(r, x))}</td>`; return; }
    const v = (s.vals || [])[i] || "";
    const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
    const corr = s.first !== null && s.marks && !s.marks[i] ? `<div class="corr">${F(term(r, x))}</div>` : "";
    h += `<td><input class="cell${m}" data-k="${k}" data-i="${i}" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(v)}" aria-label="y when x = ${F(x)}">${corr}</td>`;
  });
  return h + `</tr></table></div>`;
}
function stepBody(it, s, k){
  const r = it.r;
  if(s.t === "seq"){
    return `<div class="boxRow">` + s.xs.map((x, i) => {
      const v = (s.vals || [])[i] || "", m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
      const corr = s.first !== null && s.marks && !s.marks[i] ? F(term(r, x)) : "";
      return `<div class="boxCol"><input class="cell${m}" data-k="${k}" data-i="${i}" type="text" autocomplete="off" spellcheck="false" value="${esc(v)}" aria-label="y when x = ${F(x)}">`
        + (s.caps ? `<span class="boxCap">${X} = ${F(x)}</span>` : "") + `<span class="corr">${corr}</span></div>`;
    }).join("") + `</div>`;
  }
  if(s.t === "table") return tableHTML(it, s, k, false);
  if(s.t === "frame"){
    const v = s.vals || {}, mk = s.marks || {};
    return `<div class="fill"><span class="m">${Y} =</span>
      <input class="cell sm${s.marks ? (mk.a ? " right" : " wrong") : ""}" data-k="${k}" data-f="a" type="text" autocomplete="off" value="${esc(v.a || "")}" aria-label="the number on its own">
      <span class="seg math${s.marks ? (mk.m ? " right" : " wrong") : ""}" role="group" aria-label="plus or minus"><button type="button" data-k="${k}" data-sign="+" class="${v.sign === "+" ? "on" : ""}">+</button><button type="button" data-k="${k}" data-sign="-" class="${v.sign === "-" ? "on" : ""}">−</button></span>
      <input class="cell sm${s.marks ? (mk.m ? " right" : " wrong") : ""}" data-k="${k}" data-f="b" type="text" autocomplete="off" value="${esc(v.b || "")}" aria-label="the number with x">
      <span class="m">${X}</span></div>`;
  }
  if(s.t === "eq"){
    return `<div class="fill"><input class="eqIn${s.marks ? (s.marks.eq ? " right" : " wrong") : ""}" data-k="${k}" data-f="eq" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ALPHA ? "\u{1D466}" : "y"} = …" value="${esc(s.val || "")}" aria-label="Your equation"></div>`;
  }
  if(s.t === "count" || s.t === "desc"){
    const v = s.vals || {}, mk = s.marks || {};
    const cls = f => s.marks ? (mk[f] ? " right" : " wrong") : "";
    const w = s.t === "count" ? ["up", "down"] : ["increases", "decreases"];
    const seg = `<span class="seg${cls("dir")}" role="group"><button type="button" data-k="${k}" data-dir="up" class="${v.dir === "up" ? "on" : ""}">${w[0]}</button><button type="button" data-k="${k}" data-dir="down" class="${v.dir === "down" ? "on" : ""}">${w[1]}</button></span>`;
    const ia = `<input class="cell sm${cls("a")}" data-k="${k}" data-f="a" type="text" autocomplete="off" value="${esc(v.a || "")}">`;
    const ib = `<input class="cell sm${cls("b")}" data-k="${k}" data-f="b" type="text" autocomplete="off" value="${esc(v.b || "")}">`;
    return s.t === "count"
      ? `<div class="fill">Start at ${ia}, count ${seg} by ${ib}s</div>`
      : `<div class="fill">When <span class="m">${X} = 0</span>, <span class="m">${Y} =</span> ${ia}.</div><div class="fill">Each time <span class="m">${X}</span> increases by 1, <span class="m">${Y}</span> ${seg} by ${ib}.</div>`;
  }
  if(s.t === "plot"){
    const n = Object.keys(s.pts || {}).length;
    return `<div class="hintLine">${n} of ${s.xs.length} points plotted. Click the grid to place a point; click it again to take it off. One point for each value of ${X}.</div>`;
  }
  if(s.t === "num"){
    return s.fields.map((f, i) => {
      const v = (s.vals || [])[i] || "", m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
      const corr = s.first !== null && s.marks && !s.marks[i] ? `<span class="corr">${F(f.ans)}</span>` : "";
      return `<div class="fill"><span>${String.fromCharCode(97 + i)})&nbsp; ${f.lab}</span></div><div class="fill"><span class="m">${f.pre}</span><input class="cell${m}" data-k="${k}" data-i="${i}" type="text" autocomplete="off" value="${esc(v)}">${corr}</div>`;
    }).join("");
  }
  if(s.t === "mc"){
    return `<div class="mcList">` + s.opts.map((o, i) => {
      let cl = s.sel === i ? " on" : "";
      if(s.first !== null){ if(o.ok) cl += " right"; else if(s.sel === i) cl += " wrong"; }
      return `<button class="mcOpt${cl}" type="button" data-k="${k}" data-opt="${i}"><span class="key">${"ABCD"[i]}</span><span>${o.html}</span></button>`;
    }).join("") + `</div>`;
  }
  return "";
}
function paint(){
  const it = cur(); if(!it) return;
  $("qCounter").textContent = `Question ${S.i + 1} / ${S.items.length}`;
  $("progressFill").style.width = (S.items.filter(x => x.settled).length / S.items.length * 100) + "%";
  const ck = curStepIndex(it);
  let h = `<div class="qText">${it.q}</div>`;
  if(it.sub) h += `<div class="qSub">${it.sub}</div>`;
  if(it.given === "table") h += tableHTML(it, null, -1, true);
  it.steps.forEach((s, k) => {
    if(k > ck) return;                                   // the next step appears once this one is checked
    const st = s.first === null ? (k === ck ? " current" : "") : (s.last ? " ok" : " no");
    const mark = s.first === null ? "" : s.first ? "✓ Right first time" : (s.last ? "✓ Fixed (counts from your first try)" : "✗ Not yet");
    h += `<div class="part${st}" data-step="${k}"><div class="stepHead"><span class="stepNum">${it.steps.length > 1 ? k + 1 : "✓"}</span><span>${STEP_TITLE[s.t](it, s)}</span><span class="stepMark">${mark}</span></div>`;
    h += stepBody(it, s, k);
    if(s.first !== null && s.fixText && !s.last) h += `<div class="fix">${s.fixText}</div>`;
    h += (s.last ? "" : `<div class="checkRow"><button class="checkBtn" type="button" data-check="${k}">${s.first === null ? "Check" : "Check again"}</button></div>`) + `</div>`;
  });
  $("qCard").innerHTML = h;
  /* a part that is right is finished with: nothing in it changes again */
  it.steps.forEach((s, k) => { if(s.last) $("qCard").querySelectorAll(`.part[data-step="${k}"] input, .part[data-step="${k}"] button`).forEach(e => { if(e.tagName === "INPUT") e.readOnly = true; else e.disabled = true; }); });
  $("work").className = "work" + (it.graph ? " withGraph" : "");
  $("graphCard").hidden = !it.graph;
  bindCard();
  if(it.graph) drawGraph();
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").textContent = S.i === S.items.length - 1 ? "Finish →" : "Next →";
  if(!it.settled){
    const s = it.steps[ck];
    setPrompt(s.t === "plot" ? "Click the grid to plot each point, then press Check." : "Answer, then press Check (or Enter).");
  } else {
    setPrompt(it.correct ? "Correct — well done." : "Marked. Look at the corrections, then go on.", it.correct ? "good" : "bad");
  }
}
function bindCard(){
  const card = $("qCard"), it = cur();
  card.querySelectorAll("input[data-k]").forEach(inp => {
    const s = it.steps[+inp.dataset.k];
    inp.addEventListener("input", () => {
      /* a minus sign is a minus sign */
      if(inp.value.indexOf("-") >= 0 && inp.dataset.f !== "eq"){ const p = inp.selectionStart; inp.value = inp.value.replace(/-/g, "−"); try{ inp.setSelectionRange(p, p); }catch(e){} }
      if(inp.dataset.f === "eq"){
        const raw = inp.value, sel = inp.selectionStart == null ? raw.length : inp.selectionStart;
        const logical = Array.from(raw.slice(0, sel)).filter(c => !/\s/.test(c)).length;
        const t = CL.tidy(raw, logical, ALPHA);
        if(t.text !== raw){ inp.value = t.text; try{ inp.setSelectionRange(t.caret, t.caret); }catch(e){} }
        s.val = inp.value;
      } else if(inp.dataset.f){ s.vals = s.vals || {}; s.vals[inp.dataset.f] = inp.value; }
      else { s.vals = s.vals || []; s.vals[+inp.dataset.i] = inp.value; }
      inp.classList.remove("right", "wrong");
      if(it.graph && it.graph.liveStep === +inp.dataset.k) drawGraph();
    });
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      /* in a row of boxes, Enter moves along; on the last box it checks */
      const peers = [...card.querySelectorAll(`input[data-k="${inp.dataset.k}"]`)];
      const at = peers.indexOf(inp);
      if(at < peers.length - 1 && (s.t === "seq" || s.t === "table" || s.t === "num")){ peers[at + 1].focus(); peers[at + 1].select(); return; }
      check(+inp.dataset.k);
    });
  });
  card.querySelectorAll("[data-sign]").forEach(b => b.addEventListener("click", () => {
    const s = it.steps[+b.dataset.k]; s.vals = s.vals || {}; s.vals.sign = b.dataset.sign;
    b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); b.parentNode.classList.remove("right", "wrong");
  }));
  card.querySelectorAll("[data-dir]").forEach(b => b.addEventListener("click", () => {
    const s = it.steps[+b.dataset.k]; s.vals = s.vals || {}; s.vals.dir = b.dataset.dir;
    b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); b.parentNode.classList.remove("right", "wrong");
  }));
  card.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
    const s = it.steps[+b.dataset.k]; s.sel = +b.dataset.opt;
    b.parentNode.querySelectorAll(".mcOpt").forEach(x => x.classList.toggle("on", x === b));
  }));
  card.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => check(+b.dataset.check)));
}
function focusStep(k){
  const el = $("qCard").querySelector(`.part[data-step="${k}"] input, .part[data-step="${k}"] .mcOpt`);
  if(el) el.focus({ preventScroll:true });
}

/* =====================================================================
   CHECKING
   ===================================================================== */
function check(k){
  const it = cur(), s = it.steps[k];
  if(k > curStepIndex(it) && s.first === null) return;
  const res = markStep(it, s);
  if(res.invalid){ setPrompt(res.invalid, "warn"); return; }
  s.marks = res.marks; s.last = res.ok; s.fixText = res.fix;
  if(s.first === null){
    s.first = res.ok;                                          // ONLY the first check scores
    if(k === it.steps.length - 1){
      it.settled = true;
      it.correct = it.steps.every(x => x.first === true);
      if(it.correct) confetti(1);
      if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
    } else if(res.ok) confetti(.4);
  }
  paint();
  const ck = curStepIndex(it);
  if(!res.ok){
    const firstGo = s.first === false && !s.rechecked;
    s.rechecked = true;
    setPrompt(firstGo
      ? "Not quite — the corrections are shown. " + (k < it.steps.length - 1 ? "Carry on with the next part." : "You can fix it and check again, but the mark is from your first try.")
      : "Still not right — look at the corrections.", "bad");
    if(k < it.steps.length - 1) focusStep(ck);
  } else if(!it.settled){
    setPrompt("Right. Now the next part.", "good");
    focusStep(ck);
  } else {
    setPrompt(it.correct ? "Correct — every part right first time." : "That is right now. The mark for this question is from your first tries.", it.correct ? "good" : "warn");
    $("nextBtn").focus({ preventScroll:true });
  }
}
function next(){
  const it = cur();
  if(!it.settled){
    it.steps.forEach(s => { if(s.first === null){ s.first = false; s.last = false; s.skipped = true; } });
    it.settled = true; it.correct = false;
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  if(S.i < S.items.length - 1){ S.i++; paint(); focusStep(curStepIndex(cur())); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}

/* =====================================================================
   THE GRAPH — square cells; y scaled to the question's own numbers.
   Points: the given ones (black), a live table's (blue), the student's
   plotted ones (purple; green / red once marked), green rings for any
   missing after marking, and the line once the question is settled.
   ===================================================================== */
let G = null;   // geometry of the drawn graph, for clicks
function drawGraph(){
  const it = cur(), g = it.graph, svg = $("graph");
  const box = svg.getBoundingClientRect();
  const W = Math.max(260, Math.round(box.width)), H = Math.max(260, Math.round(box.height));
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const r = g.r, vals = g.fit.map(x => term(r, x));
  const ys = yScale(vals, g.zero);
  const nx = g.xMax - g.xMin, ny = ys.n;
  const PL = 54, PR = 34, PT = g.ctx ? 34 : 24, PB = g.ctx ? 50 : 36;
  const cell = Math.max(14, Math.min((W - PL - PR) / nx, (H - PT - PB) / ny));
  const gw = cell * nx, gh = cell * ny;
  const ox = PL + ((W - PL - PR) - gw) / 2, oy = PT + ((H - PT - PB) - gh) / 2;
  const px = x => ox + (x - g.xMin) * cell, py = y => oy + gh - (y - ys.a) / ys.s * cell;
  const zeroIn = ys.a <= 0 && ys.b >= 0;
  const axisY = zeroIn ? py(0) : oy + gh;
  const four = g.xMin < 0, axisX = four ? px(0) : ox;
  G = { px, py, cell, ox, oy, gw, gh, ys, xMin:g.xMin, xMax:g.xMax, W, H };
  let s = "";
  /* minor grid then axes */
  for(let i = g.xMin; i <= g.xMax; i++) s += `<line x1="${px(i)}" y1="${oy}" x2="${px(i)}" y2="${oy + gh}" stroke="#dbe3ee" stroke-width="1"/>`;
  for(let j = 0; j <= ny; j++){ const y = oy + j * cell; s += `<line x1="${ox}" y1="${y}" x2="${ox + gw}" y2="${y}" stroke="#dbe3ee" stroke-width="1"/>`; }
  s += `<line x1="${axisX}" y1="${oy - 10}" x2="${axisX}" y2="${oy + gh}" stroke="#334155" stroke-width="2"/>`;
  s += `<line x1="${ox}" y1="${axisY}" x2="${ox + gw + 12}" y2="${axisY}" stroke="#334155" stroke-width="2"/>`;
  s += `<path d="M${axisX - 5} ${oy - 4} L${axisX} ${oy - 13} L${axisX + 5} ${oy - 4}" fill="none" stroke="#334155" stroke-width="2"/>`;
  s += `<path d="M${ox + gw + 4} ${axisY - 5} L${ox + gw + 13} ${axisY} L${ox + gw + 4} ${axisY + 5}" fill="none" stroke="#334155" stroke-width="2"/>`;
  s += `<text class="axT" x="${ox + gw + 16}" y="${axisY + 6}">${ALPHA ? "\u{1D465}" : "x"}</text>`;
  s += `<text class="axT" x="${axisX + 8}" y="${oy - 6}">${ALPHA ? "\u{1D466}" : "y"}${g.ctx ? `<tspan class="axU"> ${esc(g.ctx.y)}</tspan>` : ""}</text>`;
  if(g.ctx) s += `<text class="axU" x="${ox + gw / 2}" y="${axisY + 40}" text-anchor="middle">${esc(g.ctx.x)}</text>`;
  if(!zeroIn) s += `<path d="M${axisX - 7} ${oy + gh - cell * .35} l14 -6 M${axisX - 7} ${oy + gh - cell * .35 + 7} l14 -6" stroke="#334155" stroke-width="2"/>`;
  for(let i = g.xMin; i <= g.xMax; i++){
    if(i === 0 && zeroIn) continue;
    s += `<text class="tick" x="${px(i)}" y="${axisY + 19}" text-anchor="middle">${F(i)}</text>`;
  }
  for(let j = 0; j <= ny; j++){
    const v = R(ys.a + j * ys.s);
    const yy = four && v === 0 ? py(v) - 4 : py(v) + 4.5;
    s += `<text class="tick" x="${axisX - 7}" y="${yy}" text-anchor="end">${F(v)}</text>`;
  }
  /* the line, once settled (never before) */
  if(g.line && it.settled){
    const lo = g.xMin, hi = g.xMax, m = slope(r);
    const clip = y => Math.max(ys.a, Math.min(ys.b, y));
    let xa = lo, xb = hi;
    if(term(r, lo) < ys.a || term(r, lo) > ys.b) xa = (clip(term(r, lo)) - r.start) / m;
    if(term(r, hi) < ys.a || term(r, hi) > ys.b) xb = (clip(term(r, hi)) - r.start) / m;
    s += `<line x1="${px(xa)}" y1="${py(term(r, xa))}" x2="${px(xb)}" y2="${py(term(r, xb))}" stroke="#16a34a" stroke-width="3" stroke-dasharray="9 7" stroke-linecap="round"/>`;
  }
  const dot = (x, y, fill, ring) => ring
    ? `<circle cx="${px(x)}" cy="${py(y)}" r="9" fill="none" stroke="#16a34a" stroke-width="3"/>`
    : `<circle class="pt" cx="${px(x)}" cy="${py(y)}" r="7.5" fill="${fill}" stroke="#fff" stroke-width="2.4"/>`;
  g.given.forEach(x => { s += dot(x, term(r, x), "#0f172a"); });
  if(g.liveStep >= 0){
    const st = it.steps[g.liveStep];
    st.xs.forEach((x, i) => { const v = numOf((st.vals || [])[i] || ""); if(isFinite(v) && v >= ys.a - ys.s * 6 && v <= ys.b + ys.s * 6) s += dot(x, v, "#2563eb"); });
  }
  if(g.plotStep >= 0){
    const st = it.steps[g.plotStep];
    const pts = st.pts || {};
    Object.keys(pts).forEach(k => {
      const fill = !st.marks ? "#7c3aed" : (st.marks[k] ? "#16a34a" : "#dc2626");
      s += dot(Number(k), pts[k], fill);
    });
    if(st.first !== null && st.marks) st.xs.forEach(x => { if(!st.marks[String(x)]) s += dot(x, term(r, x), null, true); });
  }
  s += `<circle id="ghost" r="7" fill="#7c3aed" fill-opacity=".35" stroke="#7c3aed" stroke-width="1.5" style="display:none"/>`;
  svg.innerHTML = s;
  const plotting = g.plotStep >= 0 && curStepIndex(it) === g.plotStep && !it.steps[g.plotStep].last && it.steps.slice(0, g.plotStep).every(x => x.first !== null);
  svg.classList.toggle("plotting", !!plotting);
  $("graphNote").textContent = plotting ? "Click where each point goes. Click a point again to remove it." :
    (g.liveStep >= 0 ? "Your numbers appear as points as you type them." : (g.given.length ? "Read the points carefully — check the scale on each axis." : ""));
  $("clearPts").hidden = !plotting;
}
function plotState(){
  const it = cur(); if(!it || !it.graph || it.graph.plotStep < 0) return null;
  const k = it.graph.plotStep;
  if(curStepIndex(it) !== k && it.steps[k].first === null) return null;
  if(it.steps[k].last) return null;                                      // right already: it stays as it is
  if(it.steps.slice(0, k).some(x => x.first === null)) return null;    // the table first
  return it.steps[k];
}
function snap(e){
  const svg = $("graph"), b = svg.getBoundingClientRect();
  const sx = (e.clientX - b.left) * G.W / b.width, sy = (e.clientY - b.top) * G.H / b.height;
  const x = Math.round(G.xMin + (sx - G.ox) / G.cell);
  const yi = Math.round((G.oy + G.gh - sy) / G.cell);
  if(x < G.xMin || x > G.xMax || yi < 0 || yi > G.ys.n) return null;
  if(sx < G.ox - G.cell * .6 || sx > G.ox + G.gw + G.cell * .6) return null;
  return { x, y:R(G.ys.a + yi * G.ys.s) };
}
$("graph").addEventListener("pointerdown", e => {
  const s = plotState(); if(!s) return;
  const p = snap(e); if(!p) return;
  s.pts = s.pts || {};
  const k = String(p.x);
  if(k in s.pts && near(s.pts[k], p.y)) delete s.pts[k];      // click it again: take it off
  else s.pts[k] = p.y;                                          // one point for each x
  s.marks = null;
  drawGraph();
  const hint = $("qCard").querySelector(`.part[data-step="${cur().graph.plotStep}"] .hintLine`);
  if(hint) hint.textContent = `${Object.keys(s.pts).length} of ${s.xs.length} points plotted. Click the grid to place a point; click it again to take it off. One point for each value of x.`;
});
$("graph").addEventListener("pointermove", e => {
  const gh = document.getElementById("ghost"); if(!gh) return;
  const s = plotState(); const p = s && snap(e);
  if(!p){ gh.style.display = "none"; return; }
  gh.setAttribute("cx", G.px(p.x)); gh.setAttribute("cy", G.py(p.y)); gh.style.display = "";
});
$("graph").addEventListener("pointerleave", () => { const gh = document.getElementById("ghost"); if(gh) gh.style.display = "none"; });
$("clearPts").addEventListener("click", () => { const s = plotState(); if(s){ s.pts = {}; s.marks = null; drawGraph(); paintPlotHint(); } });
function paintPlotHint(){ const it = cur(); const h = $("qCard").querySelector(`.part[data-step="${it.graph.plotStep}"] .hintLine`); if(h) h.textContent = `0 of ${it.steps[it.graph.plotStep].xs.length} points plotted.`; }
let rt = 0;
addEventListener("resize", () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(() => { if(cur() && cur().graph) drawGraph(); }); });

/* =====================================================================
   FINISHING
   ===================================================================== */
function isPartial(){ return !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial()); }
function scores(){
  const counted = isPartial() ? S.items.filter(x => x.settled) : S.items;
  const score = counted.filter(x => x.correct).length;
  const total = isPartial() && window.MMTSubmit.total ? window.MMTSubmit.total() : S.items.length;
  /* each step tallied by what it asks for */
  const cats = {};
  counted.forEach(it => it.steps.forEach(s => {
    const c = CAT[s.t]; cats[c] = cats[c] || [0, 0];
    cats[c][1]++; if(s.first === true) cats[c][0]++;
  }));
  return { score, total, counted:counted.length, cats };
}
function finish(){
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.settled = true; it.correct = false; it.steps.forEach(s => { if(s.first === null) s.first = false; }); } });
  const s = scores(), L = lv();
  const pct = s.total ? Math.round(s.score / s.total * 100) : 0;
  $("progressFill").style.width = "100%";
  $("certScore").textContent = `${s.score} / ${s.total}`;
  $("certLine").innerHTML = `${CFG.title} &middot; ${L.name} &middot; ${pct}%`;   // the .certSub line below is the sign-in script's
  $("certBreak").innerHTML = Object.keys(CAT_NAME).filter(c => s.cats[c]).map(c => `${CAT_NAME[c]}: ${s.cats[c][0]} / ${s.cats[c][1]}`).join("<br>");
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts. */
  if(window.MMTSave) window.MMTSave({
    tool:CFG.tool, topic:"algebra",
    level:L.name, levelKey:S.levelKey,
    score:s.score, total:s.total, percent:pct,
    masteryTopic:CFG.mastery,
    types: Object.keys(s.cats).map(c => c + ":" + s.cats[c][0] + "/" + s.cats[c][1])
      .concat(["level:" + S.levelKey, "quadrants:" + (QUAD ? "all" : "first")]),
    certificateText:"Counting Strategies — " + CFG.title + " — " + L.name + ": " + s.score + "/" + s.total,
    ...(window.MMTSubmit && window.MMTSubmit.fields ? window.MMTSubmit.fields() : {})
  });
}

/* ---------- confetti: the full burst for a question right first time, a small one for a part ---------- */
const CONFETTI_COLOURS = ["#2563eb","#22c55e","#f59e0b","#ec4899","#7c3aed","#ef4444","#14b8a6"];
function confetti(scale){
  if(reduceMotion) return;
  const host = document.createElement("div");
  host.className = "confetti"; host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  const W = innerWidth, H = innerHeight, bits = [], n = Math.round(56 * (scale || 1));
  for(let i = 0; i < n; i++){
    const e = document.createElement("i"), size = 6 + Math.random() * 7;
    e.style.cssText = "position:absolute;top:0;left:0;width:" + size + "px;height:" + (size * .6) + "px;background:"
      + CONFETTI_COLOURS[i % CONFETTI_COLOURS.length] + ";border-radius:" + (Math.random() < .3 ? "50%" : "2px") + ";";
    host.appendChild(e);
    bits.push({ e, x:W * (.15 + Math.random() * .7), y:-20 - Math.random() * H * .35, vx:(Math.random() - .5) * 2.2, vy:2.6 + Math.random() * 3.4, rot:Math.random() * 360, vr:(Math.random() - .5) * 18 });
  }
  const t0 = performance.now();
  (function frame(now){
    const t = now - t0; let live = false;
    for(const b of bits){
      b.x += b.vx; b.y += b.vy; b.vy += .06; b.rot += b.vr;
      if(b.y < H + 40) live = true;
      b.e.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) rotate(" + b.rot.toFixed(0) + "deg)";
      b.e.style.opacity = t > 1500 ? String(Math.max(0, 1 - (t - 1500) / 700)) : "1";
    }
    if(live && t < 2300) requestAnimationFrame(frame); else host.remove();
  })(t0);
}

/* =====================================================================
   LEVELS + WIRING
   ===================================================================== */
function buildLevelList(){
  $("lvlList").innerHTML = ORDER.map(k => {
    const L = LEVELS[k];
    return `<button class="lvlRow ${k}" type="button" data-k="${k}"><span class="lvlIco">${L.ico}</span>`
      + `<strong>${L.name}</strong><span class="d">${L.d}</span><span class="go">&rsaquo;</span></button>`;
  }).join("");
  $("lvlList").querySelectorAll(".lvlRow").forEach(b => b.addEventListener("click", () => startLevel(b.dataset.k)));
}
function openLevels(){ $("certModal").classList.remove("open"); $("levelModal").classList.add("open"); }
function startLevel(k){
  S.levelKey = k; S.items = buildPaper(k); S.i = 0;
  $("levelModal").classList.remove("open"); $("certModal").classList.remove("open");
  const chip = $("levelChip"); chip.hidden = false; chip.className = "lvlChip " + k; chip.textContent = LEVELS[k].name;
  if(window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset();
  paint();
  focusStep(0);
}
$("nextBtn").addEventListener("click", next);
$("prevBtn").addEventListener("click", () => { if(S.i > 0){ S.i--; paint(); } });
$("menuBtn").addEventListener("click", openLevels);
$("changeLvlBtn").addEventListener("click", openLevels);
$("againBtn").addEventListener("click", () => startLevel(S.levelKey));
$("copyBtn").addEventListener("click", async () => {
  const s = scores();
  const line = "\u{1F3C6} Mills Maths Tools — Counting Strategies " + CFG.title + "\n" + `${lv().name}: ${s.score}/${s.total}\n`
    + (window.MMTAuth && window.MMTAuth.shareLine ? window.MMTAuth.shareLine() : "");
  try{ await navigator.clipboard.writeText(line); $("copyBtn").textContent = "Copied"; }
  catch(e){ $("copyBtn").textContent = "Could not copy"; }
  setTimeout(() => { $("copyBtn").textContent = "Copy my result"; }, 1800);
});
$("toolsBtn").addEventListener("click", e => {
  e.stopPropagation();
  const m = $("toolsMenu"), was = m.classList.contains("open");
  m.classList.toggle("open", !was); $("toolsBtn").setAttribute("aria-expanded", String(!was));
});
document.addEventListener("click", () => { $("toolsMenu").classList.remove("open"); $("toolsBtn").setAttribute("aria-expanded", "false"); });
document.addEventListener("keydown", e => { if(e.key === "Escape") $("toolsMenu").classList.remove("open"); });

/* The shared early-submit button. It is an ES module, so it is imported —
   a plain <script> tag would stop at its `export` line. Offline, the quiz
   simply works without it. */
import("/portal/shared/earlySubmit.js").then(m => {
  window.MMTSubmit = m.MMTSubmit;
  m.MMTSubmit.register({
    progress: () => ({ attempted:S.items.filter(x => x.settled).length, correct:S.items.filter(x => x.correct).length, quizLength:QUIZ_N }),
    finish: () => finish()
  });
}).catch(() => {});

buildLevelList();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__CSQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, term, slope, eqHTML, yScale, readable, QUAD, get G(){ return G; }, CL, CTX };
})();
