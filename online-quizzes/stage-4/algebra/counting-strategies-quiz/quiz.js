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
   LANGUAGE — English, Arabic, Farsi (the same convention as the other MMT
   quizzes): the chosen language on top, English beneath. Equations,
   tables, graphs and every numeral stay left-to-right and Western. Every
   word lives in the LANG block (h/lang.js), pasted in when quiz.js is
   assembled.
   ===================================================================== */
/* ---------- every word the quiz shows, in English, Arabic and Farsi ----------
   {name} placeholders: a plain value is maths (an equation, a number, an input)
   and is set LEFT-TO-RIGHT inside <bdi dir="ltr">; a value that is itself an
   {en, ar, fa} object is a word and is put in as that language's word.
   An Arabic entry may be a function of the vars when a verb must agree with a
   feminine noun (vars.g === "f"). */
const UI = {
  /* page */
  chooseBegin:{ en:"Choose a level to begin.", ar:"اختر مستوى للبدء.", fa:"برای شروع یک سطح انتخاب کن." },
  counter:{ en:"Question {n} / {t}", ar:"السؤال {n} من {t}", fa:"سؤال {n} از {t}" },
  prev:{ en:"← Previous", ar:"→ السابق", fa:"→ قبلی" },
  next:{ en:"Next →", ar:"التالي ←", fa:"بعدی ←" },
  finish:{ en:"Finish →", ar:"إنهاء ←", fa:"پایان ←" },
  clearPts:{ en:"Clear my points", ar:"امسح نقاطي", fa:"پاک کردن نقطه‌هایم" },
  graphFirst:{ en:"First quadrant", ar:"الربع الأول", fa:"ربع اول" },
  graphAll:{ en:"All four quadrants", ar:"الأرباع الأربعة", fa:"هر چهار ربع" },
  changeLevel:{ en:"Change level", ar:"غيّر المستوى", fa:"تغییر سطح" },
  chooseLevel:{ en:"Choose your level", ar:"اختر مستواك", fa:"سطح خود را انتخاب کن" },
  levelSubFirst:{ en:"Ten questions. The levels build up: counting words, then algebra words, then making the graph yourself, then using it. Everything stays in the first quadrant.",
    ar:"عشرة أسئلة. تتدرّج المستويات: لغة العدّ، ثم لغة الجبر، ثم رسم التمثيل البياني بنفسك، ثم التطبيق. يبقى كل شيء في الربع الأول.",
    fa:"ده سؤال. سطح‌ها قدم‌به‌قدم پیش می‌روند: زبان شمارش، بعد زبان جبر، بعد رسم نمودار به دست خودت، بعد کاربرد. همه‌چیز در ربع اول می‌ماند." },
  levelSubAll:{ en:"Ten questions. The levels build up: counting words, then algebra words, then making the graph yourself, then using it. Negative values of x mean counting back from the start, and the graphs use all four quadrants.",
    ar:"عشرة أسئلة. تتدرّج المستويات: لغة العدّ، ثم لغة الجبر، ثم رسم التمثيل البياني بنفسك، ثم التطبيق. القيم السالبة لـ x تعني العدّ إلى الوراء من البداية، والتمثيلات البيانية تستخدم الأرباع الأربعة.",
    fa:"ده سؤال. سطح‌ها قدم‌به‌قدم پیش می‌روند: زبان شمارش، بعد زبان جبر، بعد رسم نمودار به دست خودت، بعد کاربرد. مقدارهای منفی x یعنی از نقطهٔ شروع به عقب بشمار، و نمودارها از هر چهار ربع استفاده می‌کنند." },
  finished:{ en:"Finished", ar:"انتهيت", fa:"تمام شد" },
  tryAgain:{ en:"Try again", ar:"حاول مرة أخرى", fa:"دوباره امتحان کن" },
  copyResult:{ en:"Copy my result", ar:"انسخ نتيجتي", fa:"کپی نتیجه‌ام" },
  copied:{ en:"Copied", ar:"تم النسخ", fa:"کپی شد" },
  copyFail:{ en:"Could not copy", ar:"تعذّر النسخ", fa:"کپی نشد" },

  /* levels */
  dSweet:{ en:"Skip counting: write the numbers, fill a table while the graph plots it for you, and write the equation.",
    ar:"العدّ القفزي: اكتب الأعداد، واملأ جدولاً بينما يعيّن التمثيل البياني النقاط لك، ثم اكتب المعادلة.",
    fa:"شمارش چندتایی: عددها را بنویس، جدول را پر کن تا نمودار نقطه‌ها را برایت رسم کند، و معادله را بنویس." },
  dMild:{ en:"The same ideas in algebra words: from an equation to a table and back, and equations from tables and graphs.",
    ar:"الأفكار نفسها بلغة الجبر: من المعادلة إلى الجدول والعكس، ومعادلات من الجداول والتمثيلات البيانية.",
    fa:"همان ایده‌ها با زبان جبر: از معادله به جدول و برعکس، و نوشتن معادله از روی جدول و نمودار." },
  dMedium:{ en:"Make the graph yourself: complete the table from the equation, then click the grid to plot every point.",
    ar:"ارسم التمثيل البياني بنفسك: أكمل الجدول من المعادلة، ثم انقر على الشبكة لتعيين كل نقطة.",
    fa:"نمودار را خودت رسم کن: جدول را از روی معادله کامل کن، بعد روی شبکه کلیک کن تا هر نقطه را بگذاری." },
  dSpicy:{ en:"Use it: worded problems, going further than counting can, and graphing lines from their equations.",
    ar:"طبّق ما تعلّمته: مسائل كلامية، والذهاب أبعد مما يصل إليه العدّ، ورسم المستقيمات من معادلاتها.",
    fa:"به کار ببر: مسئله‌های کلامی، رفتن فراتر از جایی که شمردن می‌رسد، و رسم خط از روی معادله‌اش." },

  /* what the certificate tallies */
  cat_count:{ en:"Counting", ar:"العدّ", fa:"شمارش" },
  cat_table:{ en:"Tables", ar:"الجداول", fa:"جدول‌ها" },
  cat_equation:{ en:"Equations", ar:"المعادلات", fa:"معادله‌ها" },
  cat_meaning:{ en:"What the numbers mean", ar:"معنى الأعداد", fa:"معنای عددها" },
  cat_plot:{ en:"Plotting", ar:"تعيين النقاط", fa:"رسم نقطه‌ها" },
  cat_apply:{ en:"Using it", ar:"التطبيق", fa:"کاربرد" },

  /* the prompt bar */
  pAnswer:{ en:"Answer, then press Check (or Enter).", ar:"أجب، ثم اضغط «تحقّق» (أو Enter).", fa:"جواب بده، بعد «بررسی» (یا Enter) را بزن." },
  pPlot:{ en:"Click the grid to plot each point, then press Check.", ar:"انقر على الشبكة لتعيين كل نقطة، ثم اضغط «تحقّق».", fa:"روی شبکه کلیک کن تا هر نقطه را بگذاری، بعد «بررسی» را بزن." },
  pWellDone:{ en:"Correct — well done.", ar:"صحيح — أحسنت.", fa:"درست است — آفرین." },
  pMarked:{ en:"Marked. Look at the corrections, then go on.", ar:"تم التصحيح. انظر إلى التصويبات، ثم تابع.", fa:"تصحیح شد. اصلاحیه‌ها را ببین و بعد ادامه بده." },
  pNotQuite:{ en:"Not quite — the corrections are shown.", ar:"ليس تماماً — التصويبات معروضة.", fa:"نه کاملاً — اصلاحیه‌ها نشان داده شده‌اند." },
  pCarryOn:{ en:"Carry on with the next part.", ar:"تابع إلى الجزء التالي.", fa:"سراغ بخش بعدی برو." },
  pFixAgain:{ en:"You can fix it and check again, but the mark is from your first try.", ar:"يمكنك التصحيح والتحقّق مرة أخرى، لكن العلامة تُحسب من محاولتك الأولى.", fa:"می‌توانی درستش کنی و دوباره بررسی کنی، ولی نمره از تلاش اولت حساب می‌شود." },
  pStill:{ en:"Still not right — look at the corrections.", ar:"ما زال غير صحيح — انظر إلى التصويبات.", fa:"هنوز درست نیست — به اصلاحیه‌ها نگاه کن." },
  pRightNext:{ en:"Right. Now the next part.", ar:"صحيح. والآن الجزء التالي.", fa:"درست است. حالا بخش بعدی." },
  pAllFirst:{ en:"Correct — every part right first time.", ar:"صحيح — كل الأجزاء صحيحة من المحاولة الأولى.", fa:"درست است — همهٔ بخش‌ها از بار اول درست بود." },
  pRightNow:{ en:"That is right now. The mark for this question is from your first tries.", ar:"هذا صحيح الآن. علامة هذا السؤال تُحسب من محاولاتك الأولى.", fa:"حالا درست است. نمرهٔ این سؤال از تلاش‌های اولت حساب می‌شود." },

  /* a part */
  check:{ en:"Check", ar:"تحقّق", fa:"بررسی" },
  checkAgain:{ en:"Check again", ar:"تحقّق مرة أخرى", fa:"دوباره بررسی کن" },
  mRight:{ en:"✓ Right first time", ar:"✓ صحيح من المحاولة الأولى", fa:"✓ از بار اول درست" },
  mFixed:{ en:"✓ Fixed (counts from your first try)", ar:"✓ صُحّح (تُحسب المحاولة الأولى)", fa:"✓ اصلاح شد (تلاش اول حساب می‌شود)" },
  mNot:{ en:"✗ Not yet", ar:"✗ ليس بعد", fa:"✗ هنوز نه" },
  tSeqCaps:{ en:"Write the numbers", ar:"اكتب الأعداد", fa:"عددها را بنویس" },
  tSeq5:{ en:"Write the first five numbers", ar:"اكتب الأعداد الخمسة الأولى", fa:"پنج عدد اول را بنویس" },
  tTableLive:{ en:"Complete the table — the graph plots your numbers as you go", ar:"أكمل الجدول — يعيّن التمثيل البياني أعدادك أثناء الكتابة", fa:"جدول را کامل کن — نمودار عددهایت را همزمان رسم می‌کند" },
  tTable:{ en:"Complete the table", ar:"أكمل الجدول", fa:"جدول را کامل کن" },
  tEq:{ en:"Write the equation", ar:"اكتب المعادلة", fa:"معادله را بنویس" },
  tFrameLine:{ en:"Write the equation — when you check, its line joins your dots", ar:"اكتب المعادلة — عند التحقّق يصل مستقيمها بين نقاطك", fa:"معادله را بنویس — با بررسی، خطش نقطه‌هایت را به هم وصل می‌کند" },
  tCount:{ en:"Write it as counting", ar:"اكتبها بلغة العدّ", fa:"آن را به شکل شمارش بنویس" },
  tDesc:{ en:"What do the numbers mean?", ar:"ماذا تعني الأعداد؟", fa:"عددها چه معنایی دارند؟" },
  tPlot:{ en:"Plot the points on the grid", ar:"عيّن النقاط على الشبكة", fa:"نقطه‌ها را روی شبکه بگذار" },
  tNum:{ en:"Work it out", ar:"احسبها", fa:"حسابش کن" },
  tMc:{ en:"Choose one", ar:"اختر إجابة واحدة", fa:"یکی را انتخاب کن" },
  hintPlot:{ en:"{n} of {t} points plotted. Click the grid to place a point; click it again to take it off. One point for each value of {x}.",
    ar:"عُيّنت {n} من {t} نقاط. انقر على الشبكة لوضع نقطة، وانقر عليها مرة أخرى لإزالتها. نقطة واحدة لكل قيمة من قيم {x}.",
    fa:"{n} از {t} نقطه گذاشته شده. روی شبکه کلیک کن تا نقطه بگذاری و دوباره کلیک کن تا برداری. برای هر مقدار {x} یک نقطه." },

  /* the graph */
  nClick:{ en:"Click where each point goes. Click a point again to remove it.", ar:"انقر حيث تقع كل نقطة. انقر على النقطة مرة أخرى لإزالتها.", fa:"جای هر نقطه کلیک کن. برای برداشتن نقطه دوباره رویش کلیک کن." },
  nLive:{ en:"Your numbers appear as points as you type them.", ar:"تظهر أعدادك نقاطاً أثناء كتابتها.", fa:"عددهایت همان‌طور که تایپشان می‌کنی به شکل نقطه ظاهر می‌شوند." },
  nLine:{ en:"The line {eq} goes through every point.", ar:"المستقيم {eq} يمرّ بكل النقاط.", fa:"خط {eq} از همهٔ نقطه‌ها می‌گذرد." },
  nYours:{ en:"The red line is your equation — it misses the points.", ar:"المستقيم الأحمر هو معادلتك — إنه لا يمرّ بالنقاط.", fa:"خط قرمز معادلهٔ توست — از نقطه‌ها نمی‌گذرد." },
  nRead:{ en:"Read the points carefully — check the scale on each axis.", ar:"اقرأ النقاط بعناية — تحقّق من التدريج على كل محور.", fa:"نقطه‌ها را با دقت بخوان — مقیاس هر محور را بررسی کن." },

  /* the two directions, as words */
  wUp:{ en:"up", ar:"تصاعدياً", fa:"به جلو" },
  wDown:{ en:"down", ar:"تنازلياً", fa:"به عقب" },
  wInc:{ en:"increases", ar:"يزداد", fa:"زیاد می‌شود" },
  wDec:{ en:"decreases", ar:"ينقص", fa:"کم می‌شود" },
  wUpDir:{ en:"up", ar:"تصاعدي", fa:"رو به بالا" },
  wDownDir:{ en:"down", ar:"تنازلي", fa:"رو به پایین" },

  /* counting and describing */
  instr:{ en:"Start at {a}, count {dir} by {b}s.", ar:"ابدأ من {a}، وعُدّ {dir} بمقدار {b} في كل مرة.", fa:"از {a} شروع کن و {dir} بشمار، هر بار {b} تا." },
  countRow:{ en:"Start at {A}, count {S} by {B}s", ar:"ابدأ من {A}، وعُدّ {S} بمقدار {B} في كل مرة", fa:"از {A} شروع کن و {S} بشمار، هر بار {B} تا" },
  countRowEn:{ en:"Start at ___, count up / down by ___s" },
  desc:{ en:"When {x0}, {yb}. Each time {x} increases by 1, {y} {dir} by {m}.",
    ar:"عندما {x0}، {yb}. كلما زاد {x} بمقدار 1، {dir} {y} بمقدار {m}.",
    fa:"وقتی {x0}، {yb}. هر بار که {x} یکی زیاد می‌شود، {y} به اندازهٔ {m} {dir}." },
  descRow1:{ en:"When {x0}, {ya}.", ar:"عندما {x0}، {ya}.", fa:"وقتی {x0}، {ya}." },
  descRow2:{ en:"Each time {x} increases by 1, {y} {S} by {B}.", ar:"كلما زاد {x} بمقدار 1، {S} {y} بمقدار {B}.", fa:"هر بار که {x} یکی زیاد می‌شود، {y} به اندازهٔ {B} {S}." },
  descRowEn:{ en:"When x = 0, y = ___. Each time x increases by 1, y increases / decreases by ___." },

  /* the questions */
  sSeqQuad:{ en:"Count back as well as on: write {y} for {xa} to {xb}.", ar:"عُدّ إلى الوراء وإلى الأمام: اكتب قيمة {y} من {xa} إلى {xb}.", fa:"هم به عقب و هم به جلو بشمار: {y} را از {xa} تا {xb} بنویس." },
  sSeq5:{ en:"Write the first five numbers.", ar:"اكتب الأعداد الخمسة الأولى.", fa:"پنج عدد اول را بنویس." },
  sLiveQuad:{ en:"{x0} is the start. Count on for positive {x}, and back for negative {x}.", ar:"{x0} هو البداية. عُدّ إلى الأمام لقيم {x} الموجبة، وإلى الوراء لقيم {x} السالبة.", fa:"{x0} نقطهٔ شروع است. برای {x}های مثبت به جلو بشمار و برای {x}های منفی به عقب." },
  sLive:{ en:"{x0} is the start, {x1} is one count on, and so on.", ar:"{x0} هو البداية، و{x1} هو عدّة واحدة إلى الأمام، وهكذا.", fa:"{x0} شروع است، {x1} یک شمارش جلوتر است و همین‌طور ادامه دارد." },
  sFrame:{ en:"Write it as an equation: the start is the number on its own, the count goes with {x}.", ar:"اكتبها معادلة: البداية هي العدد الذي يقف وحده، ومقدار العدّ يرافق {x}.", fa:"آن را به شکل معادله بنویس: عدد شروع تنها می‌آید و عدد شمارش کنار {x} می‌آید." },
  sCountEq:{ en:"What counting does this equation describe?", ar:"ما العدّ الذي تصفه هذه المعادلة؟", fa:"این معادله چه شمارشی را توصیف می‌کند؟" },
  sSubst:{ en:"Substitute each value of {x} into the equation.", ar:"عوّض كل قيمة من قيم {x} في المعادلة.", fa:"هر مقدار {x} را در معادله جایگذاری کن." },
  sDesc:{ en:"What do the two numbers tell you?", ar:"ماذا يخبرك العددان؟", fa:"این دو عدد چه چیزی به تو می‌گویند؟" },
  sWriteEq:{ en:"Write the equation.", ar:"اكتب المعادلة.", fa:"معادله را بنویس." },
  qTable:{ en:"This table shows a linear relationship.", ar:"يُظهر هذا الجدول علاقة خطية.", fa:"این جدول یک رابطهٔ خطی را نشان می‌دهد." },
  sTable:{ en:"Write its equation.", ar:"اكتب معادلتها.", fa:"معادله‌اش را بنویس." },
  qGraphSt:{ en:"These points show the {yn} after {x} {xl}.", ar:"تُظهر هذه النقاط {yn} عند كل قيمة لـ{x} ({xl}).", fa:"این نقطه‌ها {yn} را برای هر مقدار {x} ({xl}) نشان می‌دهند." },
  qGraph:{ en:"These points lie on a straight line.", ar:"تقع هذه النقاط على خط مستقيم.", fa:"این نقطه‌ها روی یک خط راست قرار دارند." },
  sGraph:{ en:"Read the points, then write the equation of the line.", ar:"اقرأ النقاط، ثم اكتب معادلة المستقيم.", fa:"نقطه‌ها را بخوان، بعد معادلهٔ خط را بنویس." },
  let:{ en:"Let {x} = {xl} and {y} = {yl}.", ar:"لنفرض أن {x} = {xl} و{y} = {yl}.", fa:"فرض کن {x} = {xl} و {y} = {yl}." },
  sEqForY:{ en:"Write an equation for {y}.", ar:"اكتب معادلة لـ{y}.", fa:"یک معادله برای {y} بنویس." },
  sTablePlot:{ en:"Complete the table, then plot the points.", ar:"أكمل الجدول، ثم عيّن النقاط.", fa:"جدول را کامل کن، بعد نقطه‌ها را بگذار." },
  sMeaning:{ en:"The equation is {eq}. What does the {v} tell you?", ar:"المعادلة هي {eq}. ماذا يخبرك العدد {v}؟", fa:"معادله {eq} است. عدد {v} چه چیزی به تو می‌گوید؟" },
  qMc:{ en:"Which equation matches this table?", ar:"أيّ معادلة تطابق هذا الجدول؟", fa:"کدام معادله با این جدول جور است؟" },
  sMc:{ en:"Test a pair of values from the table in each one.", ar:"اختبر زوجاً من القيم من الجدول في كل معادلة.", fa:"یک جفت مقدار از جدول را در هر کدام امتحان کن." },
  qPlot:{ en:"Plot the points from this table.", ar:"عيّن النقاط من هذا الجدول.", fa:"نقطه‌های این جدول را رسم کن." },
  sPlot:{ en:"Click the grid where each point goes. Click a point again to take it off.", ar:"انقر على الشبكة حيث تقع كل نقطة. انقر على النقطة مرة أخرى لإزالتها.", fa:"جای هر نقطه روی شبکه کلیک کن. برای برداشتن نقطه دوباره رویش کلیک کن." },
  farA:{ en:"What is {y} when {xk} ({xl})?", ar:"ما قيمة {y} عندما {xk} ({xl})؟", fa:"وقتی {xk} ({xl})، {y} چند است؟" },
  farB:{ en:"When is {yk}?", ar:"متى يكون {yk}؟", fa:"کِی {yk} می‌شود؟" },
  ruleFind:{ en:"Find {y} when {xk}.", ar:"أوجد {y} عندما {xk}.", fa:"وقتی {xk}، مقدار {y} را پیدا کن." },
  ruleWhich:{ en:"Which value of {x} gives {yk}?", ar:"أيّ قيمة لـ{x} تعطي {yk}؟", fa:"به ازای کدام مقدار {x}، {yk} می‌شود؟" },
  sRule:{ en:"Use the equation — too far to count.", ar:"استخدم المعادلة — المسافة أبعد من أن تُعدّ.", fa:"از معادله استفاده کن — برای شمردن خیلی دور است." },
  qLine:{ en:"Graph the line {eq}", ar:"ارسم المستقيم {eq}", fa:"خط {eq} را رسم کن" },
  sLine:{ en:"Complete the table, then plot the points. The line is drawn through them once they are marked.", ar:"أكمل الجدول، ثم عيّن النقاط. يُرسم المستقيم عبرها بعد تصحيحها.", fa:"جدول را کامل کن، بعد نقطه‌ها را بگذار. بعد از تصحیح، خط از میان آن‌ها رسم می‌شود." },

  /* what a number in a story means — Arabic verbs agree with a feminine noun */
  oEvery:{ en:"Every {xo}, the {yn} goes {dw} by {v}.",
    ar:v => "كل {xo}، " + (v.up ? (v.g === "f" ? "تزداد" : "يزداد") : (v.g === "f" ? "تنقص" : "ينقص")) + " {yn} بمقدار {v}.",
    fa:v => "هر {xo}، {yn} به اندازهٔ {v} " + (v.up ? "زیاد می‌شود" : "کم می‌شود") + "." },
  oStartIs:{ en:"At the start, the {yn} is {v}.", ar:v => "في البداية، {yn} " + (v.g === "f" ? "تساوي" : "يساوي") + " {v}.", fa:"در شروع، {yn} برابر {v} است." },
  oStart0:{ en:"At the start ({x0}), the {yn} is {v}.", ar:v => "في البداية ({x0})، {yn} " + (v.g === "f" ? "تساوي" : "يساوي") + " {v}.", fa:"در شروع ({x0})، {yn} برابر {v} است." },
  oAfter:{ en:"After {k} {xl}, the {yn} is {v}.", ar:v => "عندما {xk}، {yn} " + (v.g === "f" ? "تساوي" : "يساوي") + " {v}.", fa:"بعد از {k} {xo}، {yn} برابر {v} است." },
  oAlways:{ en:"The {yn} is always {v}.", ar:v => "{yn} " + (v.g === "f" ? "تساوي" : "يساوي") + " {v} دائماً.", fa:"{yn} همیشه برابر {v} است." },

  /* nothing used up */
  iFillAll:{ en:"Fill in every box first.", ar:"املأ كل المربعات أولاً.", fa:"اول همهٔ خانه‌ها را پر کن." },
  iNeedNum:{ en:"Each box needs a number.", ar:"كل مربع يحتاج إلى عدد.", fa:"هر خانه باید یک عدد داشته باشد." },
  iBoth:{ en:"Put a number in both boxes.", ar:"ضع عدداً في المربعين كليهما.", fa:"در هر دو خانه عدد بنویس." },
  iSign:{ en:"Choose + or − between the two numbers.", ar:"اختر + أو − بين العددين.", fa:"بین دو عدد + یا − را انتخاب کن." },
  iTypeEq:{ en:"Type the equation, like {e}.", ar:"اكتب المعادلة، مثل {e}.", fa:"معادله را بنویس، مثل {e}." },
  iForm:{ en:"Write it in the form {f}, like {e}.", ar:"اكتبها على الصورة {f}، مثل {e}.", fa:"آن را به شکل {f} بنویس، مثل {e}." },
  iUpDown:{ en:"Choose up or down.", ar:"اختر «تصاعدياً» أو «تنازلياً».", fa:"«به جلو» یا «به عقب» را انتخاب کن." },
  iIncDec:{ en:"Choose increases or decreases.", ar:"اختر «يزداد» أو «ينقص».", fa:"«زیاد می‌شود» یا «کم می‌شود» را انتخاب کن." },
  iPlot:{ en:"Click the grid to plot your points first.", ar:"انقر على الشبكة لتعيين نقاطك أولاً.", fa:"اول روی شبکه کلیک کن و نقطه‌هایت را بگذار." },
  iAll:{ en:"Answer every part first.", ar:"أجب عن كل الأجزاء أولاً.", fa:"اول به همهٔ بخش‌ها جواب بده." },
  iEachNum:{ en:"Each answer needs a number.", ar:"كل إجابة تحتاج إلى عدد.", fa:"هر جواب باید یک عدد باشد." },
  iChoose:{ en:"Choose an answer first.", ar:"اختر إجابة أولاً.", fa:"اول یک جواب انتخاب کن." },

  /* corrections */
  fShown:{ en:"The right numbers are shown under the boxes.", ar:"الأعداد الصحيحة معروضة تحت المربعات.", fa:"عددهای درست زیر خانه‌ها نشان داده شده‌اند." },
  fCheckX:{ en:"Check {xv}.", ar:"تحقّق من {xv}.", fa:"{xv} را بررسی کن." },
  fNotLine:{ en:"That is not a straight line — it should be a number plus a number times {x}.", ar:"هذا ليس خطاً مستقيماً — يجب أن يكون عدداً زائد عدد مضروب في {x}.", fa:"این یک خط راست نیست — باید یک عدد به‌علاوهٔ یک عدد ضرب در {x} باشد." },
  fOneRight:{ en:"One right answer: {eq}", ar:"إجابة صحيحة واحدة: {eq}", fa:"یک جواب درست: {eq}" },
  fEq:{ en:"{eq}", ar:"{eq}", fa:"{eq}" },
  fPt1:{ en:"One point is missing or in the wrong place — the green rings show where they go.", ar:"نقطة واحدة ناقصة أو في غير مكانها — الحلقات الخضراء تُظهر أماكن النقاط.", fa:"یک نقطه جا افتاده یا سر جایش نیست — حلقه‌های سبز جای درست را نشان می‌دهند." },
  fPtN:{ en:"{n} points are missing or in the wrong place — the green rings show where they go.", ar:"{n} نقاط ناقصة أو في غير مكانها — الحلقات الخضراء تُظهر أماكن النقاط.", fa:"{n} نقطه جا افتاده یا سر جایش نیست — حلقه‌های سبز جای درست را نشان می‌دهند." },
  fOnlyTable:{ en:"Only plot the points from the table.", ar:"عيّن نقاط الجدول فقط.", fa:"فقط نقطه‌های جدول را بگذار." },
  fNum:{ en:"The right answers are shown. Write the equation first: {eq}, then substitute.", ar:"الإجابات الصحيحة معروضة. اكتب المعادلة أولاً: {eq}، ثم عوّض.", fa:"جواب‌های درست نشان داده شده‌اند. اول معادله را بنویس: {eq}، بعد جایگذاری کن." },
  fMc:{ en:"The right answer is marked in green.", ar:"الإجابة الصحيحة مُعلّمة باللون الأخضر.", fa:"جواب درست با رنگ سبز مشخص شده است." },
  wSwapC:{ en:"The two numbers are swapped. The start ({b}) is the number on its own; the count ({m}) goes with {x}.", ar:"العددان متبادلان. البداية ({b}) هي العدد الذي يقف وحده، ومقدار العدّ ({m}) يرافق {x}.", fa:"دو عدد جابه‌جا شده‌اند. عدد شروع ({b}) تنها می‌آید و عدد شمارش ({m}) کنار {x} می‌آید." },
  wSwapA:{ en:"The two numbers are swapped. The number on its own is {y} when {x0} ({b}); the number with {x} is how much {y} changes each step ({m}).", ar:"العددان متبادلان. العدد الذي يقف وحده هو قيمة {y} عندما {x0} ({b})، والعدد المرافق لـ{x} هو مقدار تغيّر {y} في كل خطوة ({m}).", fa:"دو عدد جابه‌جا شده‌اند. عدد تنها، مقدار {y} وقتی {x0} است ({b})؛ عدد کنار {x} نشان می‌دهد {y} در هر گام چقدر تغییر می‌کند ({m})." },
  wDir:{ en:"Check the direction: it goes {dw}, so the number with {x} is {m}.", ar:"تحقّق من الاتجاه: إنه {dw}، لذا العدد المرافق لـ{x} هو {m}.", fa:"جهت را بررسی کن: {dw} می‌رود، پس عدد کنار {x} برابر {m} است." },
  wStartC:{ en:"The start is right. Check how much it counts by each time.", ar:"البداية صحيحة. تحقّق من مقدار العدّ في كل مرة.", fa:"عدد شروع درست است. بررسی کن هر بار چندتا چندتا می‌شمارد." },
  wStartA:{ en:"The number on its own is right. Check how much {y} changes each time {x} goes up by 1.", ar:"العدد الذي يقف وحده صحيح. تحقّق من مقدار تغيّر {y} كلما زاد {x} بمقدار 1.", fa:"عدد تنها درست است. بررسی کن هر بار که {x} یکی زیاد می‌شود، {y} چقدر تغییر می‌کند." },
  wCountC:{ en:"The count is right. Check the start — the number when {x0}.", ar:"مقدار العدّ صحيح. تحقّق من البداية — العدد عندما {x0}.", fa:"عدد شمارش درست است. عدد شروع را بررسی کن — عددی که وقتی {x0} داریم." },
  wCountA:{ en:"The number with {x} is right. Check {y} when {x0}.", ar:"العدد المرافق لـ{x} صحيح. تحقّق من قيمة {y} عندما {x0}.", fa:"عدد کنار {x} درست است. مقدار {y} را وقتی {x0} بررسی کن." },
  wDefC:{ en:"Use the start for the number on its own and the count for the number with {x}.", ar:"استخدم البداية للعدد الذي يقف وحده، ومقدار العدّ للعدد المرافق لـ{x}.", fa:"عدد شروع را برای عدد تنها و عدد شمارش را برای عدد کنار {x} به کار ببر." },
  wDefA:{ en:"Find {y} when {x0}, and how much {y} changes each time {x} goes up by 1.", ar:"أوجد قيمة {y} عندما {x0}، ومقدار تغيّر {y} كلما زاد {x} بمقدار 1.", fa:"مقدار {y} را وقتی {x0} پیدا کن، و اینکه هر بار که {x} یکی زیاد می‌شود {y} چقدر تغییر می‌کند." }
};

/* The 33 stories of contexts.js, in Arabic and Farsi. {n} a name, {a} the start, {b} the change.
   x / y: the labels "Let x = … and y = …" (y with its unit, kept as in the numbers: $, cm, L …);
   yn: y without the unit; xo: one x ("every hour"). Arabic g:"f" = the y noun is feminine.
   Arabic sentences avoid verbs that would have to agree with the person's name. */
const STORY = {
  savings:{ ar:{ t:"في حساب {n} المصرفي {a}، ويُضاف إليه {b} من التوفير كل أسبوع.", x:"عدد الأسابيع", xo:"أسبوع", y:"المدّخرات ($)", yn:"المدّخرات", g:"f" },
            fa:{ t:"{n} در بانک {a} دارد و هر هفته {b} پس‌انداز می‌کند.", x:"تعداد هفته‌ها", xo:"هفته", y:"پس‌انداز ($)", yn:"پس‌انداز" } },
  phone:{ ar:{ t:"الاشتراك في باقة هاتف يكلّف {a}، ثم {b} كل شهر.", x:"عدد الأشهر", xo:"شهر", y:"التكلفة الإجمالية ($)", yn:"التكلفة الإجمالية", g:"f" },
          fa:{ t:"عضویت در یک طرح تلفن همراه {a} هزینه دارد و بعد هر ماه {b}.", x:"تعداد ماه‌ها", xo:"ماه", y:"هزینهٔ کل ($)", yn:"هزینهٔ کل" } },
  taxi:{ ar:{ t:"تتقاضى سيارة الأجرة {a} عند بدء الرحلة، ثم {b} عن كل كيلومتر.", x:"عدد الكيلومترات", xo:"كيلومتر", y:"الأجرة ($)", yn:"الأجرة", g:"f" },
         fa:{ t:"تاکسی برای شروع سفر {a} می‌گیرد و بعد برای هر کیلومتر {b}.", x:"تعداد کیلومترها", xo:"کیلومتر", y:"کرایه ($)", yn:"کرایه" } },
  gym:{ ar:{ t:"يتقاضى نادٍ رياضي رسوم انتساب قدرها {a}، ثم {b} عن كل زيارة.", x:"عدد الزيارات", xo:"زيارة", y:"التكلفة الإجمالية ($)", yn:"التكلفة الإجمالية", g:"f" },
        fa:{ t:"یک باشگاه ورزشی {a} هزینهٔ عضویت می‌گیرد و بعد برای هر بار مراجعه {b}.", x:"تعداد مراجعه‌ها", xo:"بار مراجعه", y:"هزینهٔ کل ($)", yn:"هزینهٔ کل" } },
  carhire:{ ar:{ t:"تتقاضى شركة تأجير سيارات {a} مقدّماً، ثم {b} عن كل يوم.", x:"عدد الأيام", xo:"يوم", y:"التكلفة ($)", yn:"التكلفة", g:"f" },
            fa:{ t:"یک شرکت کرایهٔ خودرو {a} پیش‌پرداخت می‌گیرد و بعد برای هر روز {b}.", x:"تعداد روزها", xo:"روز", y:"هزینه ($)", yn:"هزینه" } },
  fundraiser:{ ar:{ t:"جُمع حتى الآن {a} لسباق {n} الخيري، ويُضاف {b} من الرعاة عن كل لفة.", x:"عدد اللفات", xo:"لفة", y:"المبلغ المجموع ($)", yn:"المبلغ المجموع" },
               fa:{ t:"{n} تا حالا {a} جمع کرده و برای هر دور دویدن {b} از حامیانش می‌گیرد.", x:"تعداد دورها", xo:"دور", y:"پول جمع‌شده ($)", yn:"پول جمع‌شده" } },
  giftcard:{ ar:{ t:"على بطاقة هدايا {n} مبلغ {a}، ويُضاف إليها {b} كل أسبوع.", x:"عدد الأسابيع", xo:"أسبوع", y:"المبلغ على البطاقة ($)", yn:"المبلغ على البطاقة" },
             fa:{ t:"روی کارت هدیهٔ {n} مبلغ {a} هست و هر هفته {b} به آن اضافه می‌کند.", x:"تعداد هفته‌ها", xo:"هفته", y:"موجودی کارت ($)", yn:"موجودی کارت" } },
  seedling:{ ar:{ t:"طول شتلة {a}، وتنمو {b} كل أسبوع.", x:"عدد الأسابيع", xo:"أسبوع", y:"الطول (cm)", yn:"الطول" },
             fa:{ t:"یک نهال {a} قد دارد و هر هفته {b} رشد می‌کند.", x:"تعداد هفته‌ها", xo:"هفته", y:"ارتفاع (cm)", yn:"ارتفاع" } },
  bucket:{ ar:{ t:"في دلو {a} من الماء، ويضيف الصنبور {b} كل دقيقة.", x:"عدد الدقائق", xo:"دقيقة", y:"الماء (L)", yn:"كمية الماء", g:"f" },
           fa:{ t:"در یک سطل از قبل {a} آب هست و شیر آب هر دقیقه {b} اضافه می‌کند.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"آب (L)", yn:"مقدار آب" } },
  train:{ ar:{ t:"يبعد قطار {a} عن المحطة، ويقطع {b} إضافية كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"المسافة (km)", yn:"المسافة", g:"f" },
          fa:{ t:"قطاری {a} از ایستگاه فاصله دارد و هر ساعت {b} دورتر می‌رود.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"فاصله (km)", yn:"فاصله" } },
  snow:{ ar:{ t:"على الأرض ثلج بعمق {a}، ويتساقط {b} إضافية كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"عمق الثلج (cm)", yn:"عمق الثلج" },
         fa:{ t:"روی زمین {a} برف نشسته و هر ساعت {b} برف دیگر می‌بارد.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"عمق برف (cm)", yn:"عمق برف" } },
  stamps:{ ar:{ t:"في مجموعة {n} {a} من الطوابع، ويُضاف إليها {b} من الطوابع كل شهر.", x:"عدد الأشهر", xo:"شهر", y:"عدد الطوابع", yn:"عدد الطوابع" },
           fa:{ t:"{n} {a} تمبر دارد و هر ماه {b} تمبر دیگر جمع می‌کند.", x:"تعداد ماه‌ها", xo:"ماه", y:"تعداد تمبرها", yn:"تعداد تمبرها" } },
  pages:{ ar:{ t:"عدد الصفحات المقروءة من كتاب {n} حتى الآن {a}، ويزيد {b} كل ليلة.", x:"عدد الليالي", xo:"ليلة", y:"الصفحات المقروءة", yn:"عدد الصفحات المقروءة" },
          fa:{ t:"{n} تا حالا {a} صفحه خوانده و هر شب {b} صفحهٔ دیگر می‌خواند.", x:"تعداد شب‌ها", xo:"شب", y:"صفحه‌های خوانده‌شده", yn:"تعداد صفحه‌های خوانده‌شده" } },
  queue:{ ar:{ t:"في طابور {a} من الأشخاص، وينضمّ إليه كل دقيقة {b} من الأشخاص.", x:"عدد الدقائق", xo:"دقيقة", y:"عدد الأشخاص", yn:"عدد الأشخاص" },
          fa:{ t:"{a} نفر در صف هستند و هر دقیقه {b} نفر دیگر به صف اضافه می‌شوند.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"تعداد نفرها", yn:"تعداد نفرها" } },
  tower:{ ar:{ t:"في برج {a} من المكعبات، ويُضاف إليه {b} من المكعبات في كل دور يلعبه {n}.", x:"عدد الأدوار", xo:"دور", y:"عدد المكعبات", yn:"عدد المكعبات" },
          fa:{ t:"یک برج {a} مکعب دارد و {n} در هر نوبت {b} مکعب دیگر اضافه می‌کند.", x:"تعداد نوبت‌ها", xo:"نوبت", y:"تعداد مکعب‌ها", yn:"تعداد مکعب‌ها" } },
  followers:{ ar:{ t:"لقناة {n} {a} من المتابعين، وتكسب {b} من المتابعين الجدد كل يوم.", x:"عدد الأيام", xo:"يوم", y:"عدد المتابعين", yn:"عدد المتابعين" },
              fa:{ t:"کانال {n} {a} دنبال‌کننده دارد و هر روز {b} دنبال‌کنندهٔ تازه پیدا می‌کند.", x:"تعداد روزها", xo:"روز", y:"تعداد دنبال‌کننده‌ها", yn:"تعداد دنبال‌کننده‌ها" } },
  plane:{ ar:{ t:"تحلّق طائرة على ارتفاع {a}، وترتفع {b} كل دقيقة.", x:"عدد الدقائق", xo:"دقيقة", y:"الارتفاع (m)", yn:"الارتفاع" },
          fa:{ t:"هواپیمایی در ارتفاع {a} پرواز می‌کند و هر دقیقه {b} بالاتر می‌رود.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"ارتفاع (m)", yn:"ارتفاع" } },
  sunrise:{ ar:{ t:"عند شروق الشمس تكون درجة الحرارة {a}، وترتفع {b} كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"درجة الحرارة (°C)", yn:"درجة الحرارة", g:"f" },
            fa:{ t:"هنگام طلوع آفتاب دما {a} است و هر ساعت {b} بالا می‌رود.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"دما (°C)", yn:"دما" } },
  lollies:{ ar:{ t:"كان مع {n} في البداية {a}، ويُنفَق منها {b} كل ساعة على الحلوى.", x:"عدد الساعات", xo:"ساعة", y:"المال المتبقي ($)", yn:"المال المتبقي" },
            fa:{ t:"{n} اول {a} داشت ولی هر ساعت {b} برای آب‌نبات خرج کرد.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"پول باقی‌مانده ($)", yn:"پول باقی‌مانده" } },
  loan:{ ar:{ t:"على {n} دَين قدره {a}، ويُسدَّد منه {b} كل أسبوع.", x:"عدد الأسابيع", xo:"أسبوع", y:"المتبقي من الدين ($)", yn:"المتبقي من الدين" },
         fa:{ t:"{n} {a} بدهکار است و هر هفته {b} از آن را پس می‌دهد.", x:"تعداد هفته‌ها", xo:"هفته", y:"بدهی باقی‌مانده ($)", yn:"بدهی باقی‌مانده" } },
  buscard:{ ar:{ t:"على بطاقة الحافلة الخاصة بـ{n} مبلغ {a}، وكل رحلة تكلّف {b}.", x:"عدد الرحلات", xo:"رحلة", y:"المال المتبقي ($)", yn:"المال المتبقي" },
            fa:{ t:"روی کارت اتوبوس {n} {a} هست و هر سفر {b} هزینه دارد.", x:"تعداد سفرها", xo:"سفر", y:"پول باقی‌مانده ($)", yn:"پول باقی‌مانده" } },
  candle:{ ar:{ t:"طول شمعة {a}، وتقصر {b} كل ساعة وهي تحترق.", x:"عدد الساعات", xo:"ساعة", y:"الطول (cm)", yn:"الطول" },
           fa:{ t:"یک شمع {a} بلندی دارد و هر ساعت {b} از آن می‌سوزد.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"ارتفاع (cm)", yn:"ارتفاع" } },
  tank:{ ar:{ t:"في خزان ماء {a}، ويتسرّب منه {b} كل يوم.", x:"عدد الأيام", xo:"يوم", y:"الماء (L)", yn:"كمية الماء", g:"f" },
         fa:{ t:"در یک مخزن {a} آب هست و هر روز {b} از آن نشت می‌کند.", x:"تعداد روزها", xo:"روز", y:"آب (L)", yn:"مقدار آب" } },
  petrol:{ ar:{ t:"في خزان سيارة {a} من البنزين، وتستهلك {b} كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"البنزين (L)", yn:"كمية البنزين", g:"f" },
           fa:{ t:"در باک یک خودرو {a} بنزین هست و هر ساعت {b} مصرف می‌کند.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"بنزین (L)", yn:"مقدار بنزین" } },
  hike:{ ar:{ t:"يبعد متنزّه {a} عن الكوخ، ويقترب منه {b} كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"المسافة إلى الكوخ (km)", yn:"المسافة إلى الكوخ", g:"f" },
         fa:{ t:"یک کوهنورد {a} با کلبه فاصله دارد و هر ساعت {b} به آن نزدیک‌تر می‌شود.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"فاصله تا کلبه (km)", yn:"فاصله تا کلبه" } },
  paint:{ ar:{ t:"في علبة {a} من الطلاء، ويُستعمل {b} لكل لوح من السياج.", x:"عدد ألواح السياج", xo:"لوح سياج", y:"الطلاء المتبقي (L)", yn:"الطلاء المتبقي" },
          fa:{ t:"در یک قوطی {a} رنگ هست و برای هر تختهٔ نرده {b} مصرف می‌شود.", x:"تعداد تخته‌های نرده", xo:"تختهٔ نرده", y:"رنگ باقی‌مانده (L)", yn:"رنگ باقی‌مانده" } },
  battery:{ ar:{ t:"شحن بطارية هاتف {a}، وينخفض {b} كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"الشحن (%)", yn:"الشحن" },
            fa:{ t:"شارژ باتری یک گوشی {a} است و هر ساعت {b} کم می‌شود.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"شارژ باتری (%)", yn:"شارژ باتری" } },
  pizza:{ ar:{ t:"تبدأ حفلة بـ{a} من شرائح البيتزا، ويُؤكل منها {b} كل دقيقة.", x:"عدد الدقائق", xo:"دقيقة", y:"الشرائح المتبقية", yn:"عدد الشرائح المتبقية" },
          fa:{ t:"یک مهمانی با {a} برش پیتزا شروع می‌شود و هر دقیقه {b} برش خورده می‌شود.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"برش‌های باقی‌مانده", yn:"تعداد برش‌های باقی‌مانده" } },
  tickets:{ ar:{ t:"بقي لحفلة موسيقية {a} من التذاكر، ويُباع منها {b} كل دقيقة.", x:"عدد الدقائق", xo:"دقيقة", y:"التذاكر المتبقية", yn:"عدد التذاكر المتبقية" },
            fa:{ t:"یک کنسرت {a} بلیت باقی‌مانده دارد و هر دقیقه {b} بلیت فروخته می‌شود.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"بلیت‌های باقی‌مانده", yn:"تعداد بلیت‌های باقی‌مانده" } },
  biscuits:{ ar:{ t:"في مرطبان {a} من البسكويت، ويُؤكل منها {b} كل يوم.", x:"عدد الأيام", xo:"يوم", y:"البسكويت المتبقي", yn:"عدد قطع البسكويت المتبقية" },
             fa:{ t:"در یک شیشه {a} بیسکویت هست و هر روز {b} تا خورده می‌شود.", x:"تعداد روزها", xo:"روز", y:"بیسکویت‌های باقی‌مانده", yn:"تعداد بیسکویت‌های باقی‌مانده" } },
  bookleft:{ ar:{ t:"بقي من كتاب {n} {a} من الصفحات، ويُقرأ منها {b} كل ليلة.", x:"عدد الليالي", xo:"ليلة", y:"الصفحات المتبقية", yn:"عدد الصفحات المتبقية" },
             fa:{ t:"از کتاب {n} {a} صفحه مانده و او هر شب {b} صفحه می‌خواند.", x:"تعداد شب‌ها", xo:"شب", y:"صفحه‌های باقی‌مانده", yn:"تعداد صفحه‌های باقی‌مانده" } },
  balloon:{ ar:{ t:"منطاد هواء ساخن على ارتفاع {a} فوق الأرض، وينخفض {b} كل دقيقة.", x:"عدد الدقائق", xo:"دقيقة", y:"الارتفاع (m)", yn:"الارتفاع" },
            fa:{ t:"یک بالن هوای گرم {a} بالاتر از زمین است و هر دقیقه {b} پایین می‌آید.", x:"تعداد دقیقه‌ها", xo:"دقیقه", y:"ارتفاع (m)", yn:"ارتفاع" } },
  midnight:{ ar:{ t:"عند منتصف الليل تكون درجة الحرارة {a}، وتنخفض {b} كل ساعة.", x:"عدد الساعات", xo:"ساعة", y:"درجة الحرارة (°C)", yn:"درجة الحرارة", g:"f" },
             fa:{ t:"نیمه‌شب دما {a} است و هر ساعت {b} پایین می‌آید.", x:"تعداد ساعت‌ها", xo:"ساعت", y:"دما (°C)", yn:"دما" } }
};

/* The names in the stories, written the way an Arabic or Farsi reader would say them. */
const NAME_T = {
  Jimmy:{ ar:"جيمي", fa:"جیمی" }, Mia:{ ar:"ميا", fa:"میا" }, Ari:{ ar:"آري", fa:"آری" }, Zoe:{ ar:"زوي", fa:"زویی" },
  Leo:{ ar:"ليو", fa:"لئو" }, Priya:{ ar:"بريا", fa:"پریا" }, Sam:{ ar:"سام", fa:"سام" }, Ruby:{ ar:"روبي", fa:"روبی" },
  Kai:{ ar:"كاي", fa:"کای" }, Noah:{ ar:"نوح", fa:"نوح" }, Isla:{ ar:"آيلا", fa:"آیلا" }, Jack:{ ar:"جاك", fa:"جک" },
  Mei:{ ar:"مي", fa:"می" }, Ava:{ ar:"آفا", fa:"آوا" }, Tane:{ ar:"تاني", fa:"تانه" }, Lucas:{ ar:"لوكاس", fa:"لوکاس" },
  Amira:{ ar:"أميرة", fa:"امیره" }, Ollie:{ ar:"أولي", fa:"اولی" }
};

const LANGS = ["en", "ar", "fa"];
let LANG = "en";
try{ const v = localStorage.getItem("mmt-csq-lang"); if(LANGS.includes(v)) LANG = v; }catch(e){}
/* one language's text for a key (or an {en, ar, fa} word) with its {vars} filled:
   a plain value is maths and sits left-to-right; an object is a word */
function tx(o, lang, v){
  const d = typeof o === "string" ? UI[o] : o;
  if(!d) return String(o);
  let s = d[lang] != null ? d[lang] : d.en;
  if(typeof s === "function") s = s(v || {});
  if(!v) return s;
  return String(s).replace(/\{(\w+)\}/g, (m, k) => {
    const x = v[k];
    if(x == null) return "";
    if(typeof x === "object") return tx(x, lang, null);
    return lang === "en" ? String(x) : `<bdi dir="ltr">${x}</bdi>`;
  });
}
const norm = (a, v) => Array.isArray(a) ? a : [[a, v]];
const runL = (ps, lang) => ps.map(p => tx(p[0], lang, p[1])).join(" ");
const bi = (en, tr) => LANG === "en" ? en : `<span class="tl" dir="rtl" lang="${LANG}">${tr}</span><span class="el">${en}</span>`;
/* L: the chosen language over English.  one: the chosen language only.  plain: for an attribute or the graph. */
const L = (a, v) => { const ps = norm(a, v); return bi(runL(ps, "en"), LANG === "en" ? "" : runL(ps, LANG)); };
const one = (a, v) => { const ps = norm(a, v), t = runL(ps, LANG); return LANG === "en" ? t : `<span dir="rtl" lang="${LANG}">${t}</span>`; };
const plain = (a, v) => runL(norm(a, v), LANG).replace(/<[^>]+>/g, "");
/* a question's text is kept as a function (or parts) and drawn in the current language */
const H = x => typeof x === "function" ? x() : Array.isArray(x) ? L(x) : (x || "");

/* =====================================================================
   WHICH x VALUES. All Quadrants goes back past the start (counting back);
   a worded problem always stays at x ≥ 0 — there is no "−2 hours".
   SWEET STAYS IN THE FIRST QUADRANT ON BOTH PAGES (teacher request
   2026-10-28): every Sweet question starts at x = 0 and no y goes below 0.
   FIRSTQ is set for each paper in buildPaper.
   ===================================================================== */
let FIRSTQ = !QUAD;
const XR4 = { seq:span(-2,2), table:span(-3,3), plot:span(-2,2) };
const XR1 = { seq:span(0,4),  table:span(0,5),  plot:span(0,4) };
const xr = () => FIRSTQ ? XR1 : XR4;
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
  const firstQ = FIRSTQ || o.first;
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
function eqHTML(r, form){
  const m = slope(r), b = r.start;
  const mx = (Math.abs(m) === 1 ? "" : F(Math.abs(m))) + X;
  if(b === 0) return `${Y} = ${m < 0 ? "−" : ""}${mx}`;
  if(form === "grad") return `${Y} = ${m < 0 ? "−" : ""}${mx} ${b < 0 ? "−" : "+"} ${F(Math.abs(b))}`;
  return `${Y} = ${F(b)} ${m < 0 ? "−" : "+"} ${mx}`;
}
const anyForm = () => Math.random() < .5 ? "start" : "grad";
const eqSpan = (r, form) => `<span class="eq">${eqHTML(r, form || "start")}</span>`;
const eqBig = (r, form) => `<span class="eqBig">${eqHTML(r, form)}</span>`;
/* "Start at 5, count up by 3s." */
const instrP = r => ["instr", { a:`<span class="num start">${F(r.start)}</span>`, b:`<span class="num step">${F(r.step)}</span>`, dir:r.dir === "up" ? UI.wUp : UI.wDown }];
/* "When x = 0, y = 5. Each time x increases by 1, y increases by 3." */
const descP = r => ["desc", { x0:`${X} = 0`, yb:`${Y} = <b>${F(r.start)}</b>`, x:X, y:Y, dir:r.dir === "up" ? UI.wInc : UI.wDec, m:`<b>${F(r.step)}</b>` }];
const ctxOf = st => st ? CTX.BY[st.id] : null;
const yName = c => c.y.replace(/ \(.*\)$/, "");
const xOne = c => c.x.replace(/s$/, "");
/* a story's label as a word in every language: f = x | y | yn (y without its unit) | xo (one x) */
const word = (c, f) => {
  const o = { en: f === "x" ? c.x : f === "y" ? c.y : f === "yn" ? yName(c) : xOne(c) };
  LANGS.slice(1).forEach(l => { const t = (STORY[c.id] || {})[l]; if(t && t[f]) o[l] = t[f]; });
  return o;
};
const gen = c => ((STORY[c.id] || {}).ar || {}).g || "m";
function storyHTML(st){
  const c = ctxOf(st), r = st.r;
  const mk = (k, t) => `<span class="num ${k}">${t}</span>`;
  const en = CTX.storyHTML({ id:st.id, name:st.name, rule:r }, mk);
  const t = LANG !== "en" && ((STORY[c.id] || {})[LANG] || {}).t;
  if(!t) return en;
  const nm = (NAME_T[st.name] || {})[LANG] || st.name;
  const tr = esc(t).replace("{n}", esc(nm))
    .replace("{a}", `<bdi dir="ltr">${mk("start", CTX.fmtVal(c, r.start))}</bdi>`)
    .replace("{b}", `<bdi dir="ltr">${mk("step", CTX.fmtVal(c, r.step))}</bdi>`);
  return bi(en, tr);
}
const letP = st => { const c = ctxOf(st); return ["let", { x:X, y:Y, xl:word(c, "x"), yl:word(c, "y") }]; };

/* =====================================================================
   QUESTIONS. An item is { level, r, st, q, sub, steps[], graph }.
   q and sub are functions, so a question redraws in whichever language is
   chosen. A step is one thing to do and check; the next appears once it
   is checked.
   ===================================================================== */
const step = (t, extra) => Object.assign({ t, first:null, last:null, marks:null }, extra);
const CAT = { seq:"count", table:"table", frame:"equation", eq:"equation", count:"meaning", desc:"meaning", plot:"plot", num:"apply", mc:"meaning" };
const CATS = ["count", "table", "equation", "meaning", "plot", "apply"];

/* o.four: the work stays in the first quadrant but the plane shows all four
   (Sweet on the All Quadrants page, teacher request 2026-10-28), so once the
   line is drawn it can be seen running on into the other quadrants. The y
   scale is set from the whole line across the plane, plus some room below 0. */
function graphFor(r, xs, o){
  o = o || {};
  const four = !!o.four;
  const zero = four || (!FIRSTQ && !o.first);
  const xMin = four ? -4 : zero ? Math.min(...xs) - 1 : 0, xMax = Math.max(...xs) + 1;
  let scaleVals = null;
  if(four){
    const v = span(xMin, xMax).map(x => term(r, x));
    scaleVals = v.concat([-Math.max(2, Math.round(Math.max(...v.map(Math.abs)) * .25))]);
  }
  return Object.assign({ r, fit:xs, xMin, xMax, zero, scaleVals, given:[], liveStep:-1, plotStep:-1, line:false, ctx:null }, o);
}

/* ---- Sweet: counting language ---- */
function qSeq(level, dir){
  const xs = xr().seq, r = makeRule(level, { dir, xs }), caps = !FIRSTQ;
  return { r, q:() => L([instrP(r)]),
    sub: caps ? () => L("sSeqQuad", { y:Y, xa:`${X} = ${F(xs[0])}`, xb:F(xs[xs.length - 1]) }) : () => L("sSeq5"),
    steps:[ step("seq", { xs, caps }) ], graph:null };
}
/* a table that plots as it is typed. With `then`, a second part: write the
   equation — and once it is marked the line is drawn through the dots, the
   way typing y = 1 + 4x in the teaching tool joins them up. */
function qTableLive(level, dir, then){
  const xs = xr().table, r = makeRule(level, { dir, xs }), quad = !FIRSTQ;
  const steps = [ step("table", { xs, live:true }) ];
  if(then) steps.push(step("frame"));
  return { r, q:() => L([instrP(r)]),
    sub: quad ? () => L("sLiveQuad", { x0:`${X} = 0`, x:X }) : () => L("sLive", { x0:`${X} = 0`, x1:`${X} = 1` }),
    steps, graph:graphFor(r, xs, { liveStep:0, line:!!then, four:QUAD && FIRSTQ }) };
}
function qFrame(level, dir){
  const r = makeRule(level, { dir, xs:xr().seq });
  return { r, q:() => L([instrP(r)]), sub:() => L("sFrame", { x:X }), steps:[ step("frame") ], graph:null };
}
function qCountFromEq(level){
  const r = makeRule(level, { dir:"any", xs:xr().seq }), form = anyForm();
  return { r, q:eqBig(r, form), sub:() => L("sCountEq"), steps:[ step("count") ], graph:null };
}

/* ---- Mild: algebra language ---- */
function qTableFromRule(level, dir, live){
  const xs = live ? xr().table : xr().plot, r = makeRule(level, { dir, xs, read:!live }), form = anyForm();
  return { r, q:eqBig(r, form), sub:() => L("sSubst", { x:X }),
    steps:[ step("table", { xs, live:!!live }) ].concat(live ? [] : [ step("plot", { xs }) ]),
    graph: graphFor(r, xs, live ? { liveStep:0 } : { plotStep:1 }) };
}
function qDescFromEq(level){
  const r = makeRule(level, { dir:"any", xs:xr().seq }), form = anyForm();
  return { r, q:eqBig(r, form), sub:() => L("sDesc"), steps:[ step("desc") ], graph:null };
}
function qEqFromDesc(level, dir){
  const r = makeRule(level, { dir, xs:xr().seq });
  return { r, q:() => L([descP(r)]), sub:() => L("sWriteEq"), steps:[ step("eq") ], graph:null };
}
function qEqFromTable(level, dir){
  const xs = xr().plot, r = makeRule(level, { dir, xs });
  return { r, q:() => L("qTable"), sub:() => L("sTable"), given:"table", gxs:xs, steps:[ step("eq") ], graph:null };
}
function qEqFromGraph(level, dir, st){
  if(st){
    const r = st.r, c = ctxOf(st);
    return { r, st, q:() => L("qGraphSt", { yn:word(c, "yn"), x:X, xl:word(c, "x") }), sub:() => L([letP(st), ["sWriteEq"]]),
      steps:[ step("eq") ], graph:graphFor(r, STORY_XS.plot, { first:true, given:STORY_XS.plot, ctx:c }) };
  }
  const xs = xr().plot, r = makeRule(level, { dir, xs, read:true });
  return { r, q:() => L("qGraph"), sub:() => L("sGraph"), steps:[ step("eq") ], graph:graphFor(r, xs, { given:xs }) };
}
function qMcTable(level){
  const xs = xr().plot;
  const r = makeRule(level, { dir:"any", xs, check:r => r.start !== 0 && Math.abs(r.start) !== r.step });
  const b = r.start, m = slope(r);
  const cands = [
    { r, ok:true },
    { r:{ start:m, step:Math.abs(b), dir:b < 0 ? "down" : "up" }, ok:false },             // the two numbers swapped
    { r:{ start:b, step:r.step, dir:r.dir === "up" ? "down" : "up" }, ok:false },          // the wrong way
    { r:{ start:R(b + m), step:r.step, dir:r.dir }, ok:false }                             // starting one step late
  ];
  const seen = new Set(), opts = [];
  cands.forEach(c => { const k = [0,1,2].map(x => term(c.r, x)).join(","); if(!seen.has(k)){ seen.add(k); opts.push({ html:eqSpan(c.r, anyForm()), ok:c.ok }); } });
  return { r, q:() => L("qMc"), sub:() => L("sMc"), given:"table", gxs:xs,
    steps:[ step("mc", { opts:shuffle(opts) }) ], graph:null };
}

/* ---- Medium: make the graph yourself ---- */
function qPlotFromTable(level, dir){
  const xs = xr().plot, r = makeRule(level, { dir, xs, read:true });
  return { r, q:() => L("qPlot"), sub:() => L("sPlot"), given:"table", gxs:xs,
    steps:[ step("plot", { xs }) ], graph:graphFor(r, xs, { plotStep:0 }) };
}

/* ---- Spicy: use it ---- */
function qStoryEq(level, dir){
  const st = makeStory(level, { dir, intOnly:level !== "spicy" });
  if(!st) return qEqFromDesc(level, dir === "either" ? "any" : dir);
  return { r:st.r, st, q:() => storyHTML(st), sub:() => L([letP(st), ["sEqForY", { y:Y }]]), steps:[ step("eq") ], graph:null };
}
function qStoryFar(level){
  const st = makeStory(level, { dir:"either", intOnly:true });
  if(!st) return qRuleFar(level);
  const c = ctxOf(st), r = st.r;
  const x1 = rnd(6, 9), k = pick(span(2, 8).filter(v => v !== x1));
  return { r, st, q:() => storyHTML(st), sub:() => L([letP(st)]),
    steps:[ step("num", { fields:[
      { lab:["farA", { y:Y, xk:`${X} = ${x1}`, xl:word(c, "x") }], ans:term(r, x1), pre:`${Y} =` },
      { lab:["farB", { yk:`${Y} = ${F(term(r, k))}` }], ans:k, pre:`${X} =` }
    ] }) ], graph:null };
}
function qRuleFar(level){
  const quad = !FIRSTQ;
  const r = makeRule(level, { dir:quad ? "any" : "up", xs:quad ? span(-10, 25) : span(0, 25) });
  const k = rnd(12, 24), form = anyForm();
  const fields = [ { lab:["ruleFind", { y:Y, xk:`${X} = 25` }], ans:term(r, 25), pre:`${Y} =` } ];
  if(quad) fields.push({ lab:["ruleFind", { y:Y, xk:`${X} = −10` }], ans:term(r, -10), pre:`${Y} =` });
  fields.push({ lab:["ruleWhich", { x:X, yk:`${Y} = ${F(term(r, k))}` }], ans:k, pre:`${X} =` });
  return { r, q:eqBig(r, form), sub:() => L("sRule"), steps:[ step("num", { fields }) ], graph:null };
}
function qGraphLine(level, o){
  o = o || {};
  const xs = xr().plot, form = anyForm();
  const r = makeRule(level, { dir:o.dir || "any", xs, read:true, half:!!o.half, zeroOK:true, bmax:FIRSTQ ? 12 : 8 });
  return { r, q:() => L("qLine", { eq:eqBig(r, form) }), sub:() => L("sLine"),
    steps:[ step("table", { xs, live:false }), step("plot", { xs }) ], graph:graphFor(r, xs, { plotStep:1, line:true }) };
}
function qStoryPlot(level){
  const xs = STORY_XS.plot;
  const st = makeStory(level, { dir:"either", read:true, xs, intOnly:true });
  if(!st) return qGraphLine(level);
  const c = ctxOf(st);
  return { r:st.r, st, q:() => storyHTML(st), sub:() => L([letP(st), ["sTablePlot"]]),
    steps:[ step("table", { xs, live:false }), step("plot", { xs }) ], graph:graphFor(st.r, xs, { first:true, plotStep:1, line:true, ctx:c }) };
}
function qStoryMeaning(level){
  const st = makeStory(level, { dir:"either", intOnly:true });
  if(!st) return qDescFromEq(level);
  const c = ctxOf(st), r = st.r;
  const A = CTX.fmtVal(c, r.start), B = CTX.fmtVal(c, r.step);
  const askStep = Math.random() < .5;
  const val = askStep ? F(r.step) : F(r.start);
  const w = { yn:word(c, "yn"), xo:word(c, "xo"), xl:word(c, "x"), g:gen(c), up:r.dir === "up", dw:r.dir === "up" ? UI.wUpDir : UI.wDownDir };
  const after = (k, v) => ["oAfter", Object.assign({}, w, { k:F(k), xk:`${X} = ${F(k)}`, v })];
  const opts = askStep ? [
    { p:["oEvery", Object.assign({}, w, { v:B })], ok:true },
    { p:["oStartIs", Object.assign({}, w, { v:B })], ok:false },
    { p:after(r.step, A), ok:false },
    { p:["oAlways", Object.assign({}, w, { v:B })], ok:false }
  ] : [
    { p:["oStart0", Object.assign({}, w, { x0:`${X} = 0`, v:A })], ok:true },
    { p:["oEvery", Object.assign({}, w, { v:A })], ok:false },
    { p:after(r.start, B), ok:false },
    { p:["oAlways", Object.assign({}, w, { v:A })], ok:false }
  ];
  return { r, st, q:() => storyHTML(st), sub:() => L([letP(st), ["sMeaning", { eq:eqSpan(r), v:`<b>${val}</b>` }]]),
    steps:[ step("mc", { opts:shuffle(opts) }) ], graph:null };
}

/* =====================================================================
   THE FOUR PAPERS — ten questions each, in the order they build.
   ===================================================================== */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"dSweet" },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"dMild" },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"dMedium" },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"dSpicy" }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  FIRSTQ = !QUAD || level === "sweet";          // Sweet: x from 0, first quadrant, on both pages
  const up = Math.random() < .5 ? "up" : "down", dn = up === "up" ? "down" : "up";
  let items;
  if(level === "sweet") items = [
    qSeq("sweet", up), qSeq("sweet", dn),
    qTableLive("sweet", up, true), qTableLive("sweet", dn, true),
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

/* Why an equation is wrong, in the level's language: one [key, vars] part. */
function whyEq(it, gotB, gotM){
  const r = it.r, b = r.start, m = slope(r), w = words(it);
  const v = { b:F(b), m:F(m), x:X, y:Y, x0:`${X} = 0` };
  if(gotB != null && gotM != null){
    if(near(gotB, m) && near(gotM, b)) return w === "count" ? ["wSwapC", Object.assign(v, { m:F(Math.abs(m)) })] : ["wSwapA", v];
    if(near(gotB, b) && near(gotM, -m)) return ["wDir", Object.assign(v, { dw:r.dir === "up" ? UI.wUpDir : UI.wDownDir })];
    if(near(gotB, b)) return w === "count" ? ["wStartC", v] : ["wStartA", v];
    if(near(gotM, m)) return w === "count" ? ["wCountC", v] : ["wCountA", v];
  }
  return w === "count" ? ["wDefC", v] : ["wDefA", v];
}

/* each returns { invalid } (nothing used up), or { ok, marks, fix } — invalid and
   fix are lists of [key, vars] parts, drawn in the chosen language */
const EG = () => `${Y} = 5 + 3${X}`;
function markStep(it, s){
  const r = it.r;
  if(s.t === "seq" || s.t === "table"){
    const vals = s.xs.map((x, i) => (s.vals || [])[i]);
    if(vals.some(v => v == null || String(v).trim() === "")) return { invalid:[["iFillAll"]] };
    const got = vals.map(numOf);
    if(got.some(v => !isFinite(v))) return { invalid:[["iNeedNum"]] };
    const marks = got.map((g, i) => near(g, term(r, s.xs[i])));
    const ok = marks.every(Boolean);
    const wrong = s.xs.filter((x, i) => !marks[i]);
    return { ok, marks, fix: ok ? null : [["fShown"]].concat(wrong.length === 1 ? [["fCheckX", { xv:`${X} = ${F(wrong[0])}` }]] : []) };
  }
  if(s.t === "frame"){
    const v = s.vals || {};
    const a = numOf(v.a || ""), b = numOf(v.b || "");
    if(!isFinite(a) || !isFinite(b)) return { invalid:[["iBoth"]] };
    if(!v.sign) return { invalid:[["iSign"]] };
    const gm = v.sign === "-" ? -b : b;
    const ok = near(a, r.start) && near(gm, slope(r));
    return { ok, marks:{ a:near(a, r.start), m:near(gm, slope(r)) }, fix: ok ? null : [whyEq(it, a, gm), ["fEq", { eq:eqSpan(r) }]] };
  }
  if(s.t === "eq"){
    const res = CL.equation(s.val || "");
    if(res.kind === "empty") return { invalid:[["iTypeEq", { e:EG() }]] };
    if(res.kind === "err" || res.kind === "vert") return { invalid:[["iForm", { f:`${Y} = …`, e:EG() }]] };
    const f = res.f;
    const ok = [-3, -1, 0, 1, 2, 5, 10].every(x => near(f(x), term(r, x)));
    const lin = res.linear;
    return { ok, marks:{ eq:ok }, fix: ok ? null : [lin ? whyEq(it, lin.b, lin.m) : ["fNotLine", { x:X }], ["fOneRight", { eq:eqSpan(r) }]] };
  }
  if(s.t === "count" || s.t === "desc"){
    const v = s.vals || {};
    const a = numOf(v.a || ""), b = numOf(v.b || "");
    if(!isFinite(a) || !isFinite(b)) return { invalid:[["iBoth"]] };
    if(!v.dir) return { invalid:[[s.t === "count" ? "iUpDown" : "iIncDec"]] };
    /* a negative number in the box with the matching word still means the same thing */
    let gb = b, gd = v.dir;
    if(gb < 0){ gb = -gb; gd = gd === "up" ? "down" : "up"; }
    const marks = { a:near(a, r.start), dir:gd === r.dir, b:near(gb, r.step) };
    const ok = marks.a && marks.dir && marks.b;
    return { ok, marks, fix: ok ? null : [s.t === "count" ? instrP(r) : descP(r)] };
  }
  if(s.t === "plot"){
    const pts = s.pts || {};
    const xsSet = s.xs;
    if(!Object.keys(pts).length) return { invalid:[["iPlot"]] };
    const marks = {};
    Object.keys(pts).forEach(k => { const x = Number(k); marks[k] = xsSet.includes(x) && near(pts[k], term(r, x)); });
    const missing = xsSet.filter(x => !(String(x) in pts) || !marks[String(x)]);
    const extra = Object.keys(pts).filter(k => !xsSet.includes(Number(k)));
    const ok = missing.length === 0 && extra.length === 0;
    const fix = [];
    if(missing.length) fix.push(missing.length === 1 ? ["fPt1"] : ["fPtN", { n:missing.length }]);
    if(extra.length) fix.push(["fOnlyTable"]);
    return { ok, marks, fix: ok ? null : fix };
  }
  if(s.t === "num"){
    const vals = s.fields.map((f, i) => (s.vals || [])[i]);
    if(vals.some(v => v == null || String(v).trim() === "")) return { invalid:[["iAll"]] };
    const got = vals.map(numOf);
    if(got.some(v => !isFinite(v))) return { invalid:[["iEachNum"]] };
    const marks = got.map((g, i) => near(g, s.fields[i].ans));
    const ok = marks.every(Boolean);
    return { ok, marks, fix: ok ? null : [["fNum", { eq:eqSpan(r) }]] };
  }
  if(s.t === "mc"){
    if(s.sel == null || s.sel < 0) return { invalid:[["iChoose"]] };
    const ok = !!s.opts[s.sel].ok;
    return { ok, marks:{ sel:s.sel }, fix: ok ? null : [["fMc"]] };
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
/* the prompt bar: msg is a list of [key, vars] parts (or plain HTML); it is
   remembered so a change of language can redraw it */
let PROMPT = null;
function setPrompt(msg, kind){
  PROMPT = { msg, kind, i:S.i };
  const p = $("promptBar"); p.className = "promptBar" + (kind ? " " + kind : "");
  $("promptIco").textContent = kind === "good" ? "✅" : kind === "bad" ? "\u{1F50E}" : kind === "warn" ? "✋" : "\u{1F4AD}";
  $("promptText").innerHTML = typeof msg === "string" ? msg : L(msg);
}

/* =====================================================================
   DRAWING THE QUESTION
   ===================================================================== */
const STEP_TITLE = {
  seq: it => it.steps[0].caps ? "tSeqCaps" : "tSeq5",
  table: (it, s) => s.live ? "tTableLive" : "tTable",
  frame: it => it.graph && it.graph.line ? "tFrameLine" : "tEq",
  eq: () => "tEq",
  count: () => "tCount",
  desc: () => "tDesc",
  plot: () => "tPlot",
  num: () => "tNum",
  mc: () => "tMc"
};
function tableHTML(it, s, k, given){
  const r = it.r, c = ctxOf(it.st);
  const xs = given ? it.gxs : s.xs;
  let h = `<div class="tvWrap"><table class="tv"><tr><th>${c ? `<span class="cap">${one(word(c, "x"))}</span>` : ""}${X}</th>${xs.map(x => `<td class="giv">${F(x)}</td>`).join("")}</tr>`;
  h += `<tr><th>${c ? `<span class="cap">${one(word(c, "yn"))}</span>` : ""}${Y}</th>`;
  xs.forEach((x, i) => {
    if(given){ h += `<td class="giv">${F(term(r, x))}</td>`; return; }
    const v = (s.vals || [])[i] || "";
    const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
    const corr = s.first !== null && s.marks && !s.marks[i] ? `<div class="corr">${F(term(r, x))}</div>` : "";
    h += `<td><input class="cell${m}" data-k="${k}" data-i="${i}" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(v)}" aria-label="y when x = ${F(x)}">${corr}</td>`;
  });
  return h + `</tr></table></div>`;
}
const hintPlot = (n, t) => L("hintPlot", { n, t, x:X });
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
    return `<div class="fill" dir="ltr"><span class="m">${Y} =</span>
      <input class="cell sm${s.marks ? (mk.a ? " right" : " wrong") : ""}" data-k="${k}" data-f="a" type="text" autocomplete="off" value="${esc(v.a || "")}" aria-label="the number on its own">
      <span class="seg math${s.marks ? (mk.m ? " right" : " wrong") : ""}" role="group" aria-label="plus or minus"><button type="button" data-k="${k}" data-sign="+" class="${v.sign === "+" ? "on" : ""}">+</button><button type="button" data-k="${k}" data-sign="-" class="${v.sign === "-" ? "on" : ""}">−</button></span>
      <input class="cell sm${s.marks ? (mk.m ? " right" : " wrong") : ""}" data-k="${k}" data-f="b" type="text" autocomplete="off" value="${esc(v.b || "")}" aria-label="the number with x">
      <span class="m">${X}</span></div>`;
  }
  if(s.t === "eq"){
    return `<div class="fill" dir="ltr"><input class="eqIn${s.marks ? (s.marks.eq ? " right" : " wrong") : ""}" data-k="${k}" data-f="eq" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ALPHA ? "\u{1D466}" : "y"} = …" value="${esc(s.val || "")}" aria-label="Your equation"></div>`;
  }
  if(s.t === "count" || s.t === "desc"){
    /* the sentence with its boxes in the chosen language; in Arabic or Farsi
       the English sentence sits underneath, with blanks */
    const v = s.vals || {}, mk = s.marks || {};
    const cls = f => s.marks ? (mk[f] ? " right" : " wrong") : "";
    const w = s.t === "count" ? [UI.wUp, UI.wDown] : [UI.wInc, UI.wDec];
    const seg = `<span class="seg${cls("dir")}" role="group"><button type="button" data-k="${k}" data-dir="up" class="${v.dir === "up" ? "on" : ""}">${one(w[0])}</button><button type="button" data-k="${k}" data-dir="down" class="${v.dir === "down" ? "on" : ""}">${one(w[1])}</button></span>`;
    const ia = `<input class="cell sm${cls("a")}" data-k="${k}" data-f="a" type="text" autocomplete="off" value="${esc(v.a || "")}">`;
    const ib = `<input class="cell sm${cls("b")}" data-k="${k}" data-f="b" type="text" autocomplete="off" value="${esc(v.b || "")}">`;
    const rtl = LANG === "en" ? "" : ` dir="rtl" lang="${LANG}"`;
    const rows = s.t === "count"
      ? `<div class="fill"${rtl}>${tx("countRow", LANG, { A:ia, S:seg, B:ib })}</div>`
      : `<div class="fill"${rtl}>${tx("descRow1", LANG, { x0:`<span class="m">${X} = 0</span>`, ya:`<span class="m">${Y} =</span> ${ia}` })}</div>`
        + `<div class="fill"${rtl}>${tx("descRow2", LANG, { x:`<span class="m">${X}</span>`, y:`<span class="m">${Y}</span>`, S:seg, B:ib })}</div>`;
    return rows + (LANG === "en" ? "" : `<div class="fillEn">${UI[s.t === "count" ? "countRowEn" : "descRowEn"].en}</div>`);
  }
  if(s.t === "plot"){
    return `<div class="hintLine">${hintPlot(Object.keys(s.pts || {}).length, s.xs.length)}</div>`;
  }
  if(s.t === "num"){
    return s.fields.map((f, i) => {
      const v = (s.vals || [])[i] || "", m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
      const corr = s.first !== null && s.marks && !s.marks[i] ? `<span class="corr">${F(f.ans)}</span>` : "";
      return `<div class="numLab"><span class="nl">${String.fromCharCode(97 + i)})</span><div>${L([f.lab])}</div></div><div class="fill" dir="ltr"><span class="m">${f.pre}</span><input class="cell${m}" data-k="${k}" data-i="${i}" type="text" autocomplete="off" value="${esc(v)}">${corr}</div>`;
    }).join("");
  }
  if(s.t === "mc"){
    return `<div class="mcList">` + s.opts.map((o, i) => {
      let cl = s.sel === i ? " on" : "";
      if(s.first !== null){ if(o.ok) cl += " right"; else if(s.sel === i) cl += " wrong"; }
      return `<button class="mcOpt${cl}" type="button" data-k="${k}" data-opt="${i}"><span class="key">${"ABCD"[i]}</span><span>${o.html || L([o.p])}</span></button>`;
    }).join("") + `</div>`;
  }
  return "";
}
function paint(){
  const it = cur(); if(!it) return;
  $("qCounter").innerHTML = one("counter", { n:S.i + 1, t:S.items.length });
  $("progressFill").style.width = (S.items.filter(x => x.settled).length / S.items.length * 100) + "%";
  const ck = curStepIndex(it);
  let h = `<div class="qText">${H(it.q)}</div>`;
  if(it.sub) h += `<div class="qSub">${H(it.sub)}</div>`;
  if(it.given === "table") h += tableHTML(it, null, -1, true);
  it.steps.forEach((s, k) => {
    if(k > ck) return;                                   // the next step appears once this one is checked
    const st = s.first === null ? (k === ck ? " current" : "") : (s.last ? " ok" : " no");
    const mark = s.first === null ? "" : L(s.first ? "mRight" : (s.last ? "mFixed" : "mNot"));
    h += `<div class="part${st}" data-step="${k}"><div class="stepHead"><span class="stepNum">${it.steps.length > 1 ? k + 1 : "✓"}</span><span class="stepTitle">${L(STEP_TITLE[s.t](it, s))}</span><span class="stepMark">${mark}</span></div>`;
    h += stepBody(it, s, k);
    if(s.first !== null && s.fixText && !s.last) h += `<div class="fix">${L(s.fixText)}</div>`;
    h += (s.last ? "" : `<div class="checkRow"><button class="checkBtn" type="button" data-check="${k}">${L(s.first === null ? "check" : "checkAgain")}</button></div>`) + `</div>`;
  });
  $("qCard").innerHTML = h;
  /* a part that is right is finished with: nothing in it changes again */
  it.steps.forEach((s, k) => { if(s.last) $("qCard").querySelectorAll(`.part[data-step="${k}"] input, .part[data-step="${k}"] button`).forEach(e => { if(e.tagName === "INPUT") e.readOnly = true; else e.disabled = true; }); });
  $("work").className = "work" + (it.graph ? " withGraph" : "");
  $("graphCard").hidden = !it.graph;
  bindCard();
  if(it.graph) drawGraph();
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = L(S.i === S.items.length - 1 ? "finish" : "next");
  if(!it.settled){
    const s = it.steps[ck];
    setPrompt([[s.t === "plot" ? "pPlot" : "pAnswer"]]);
  } else {
    setPrompt([[it.correct ? "pWellDone" : "pMarked"]], it.correct ? "good" : "bad");
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
    setPrompt(firstGo ? [["pNotQuite"], [k < it.steps.length - 1 ? "pCarryOn" : "pFixAgain"]] : [["pStill"]], "bad");
    if(k < it.steps.length - 1) focusStep(ck);
  } else if(!it.settled){
    setPrompt([["pRightNext"]], "good");
    focusStep(ck);
  } else {
    setPrompt([[it.correct ? "pAllFirst" : "pRightNow"]], it.correct ? "good" : "warn");
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
  const ys = yScale(g.scaleVals || vals, g.zero);
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
  s += `<text class="axT" x="${axisX + 8}" y="${oy - 6}">${ALPHA ? "\u{1D466}" : "y"}${g.ctx ? `<tspan class="axU"> ${esc(plain(word(g.ctx, "y")))}</tspan>` : ""}</text>`;
  if(g.ctx) s += `<text class="axU" x="${ox + gw / 2}" y="${axisY + 40}" text-anchor="middle">${esc(plain(word(g.ctx, "x")))}</text>`;
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
  /* the line, once settled (never before) — and when the student's own
     equation was wrong, its line too, in red, so they see it miss the dots */
  const seg = (m, c, colour) => {
    const f = x => c + m * x, lo = g.xMin, hi = g.xMax;
    const clip = y => Math.max(ys.a, Math.min(ys.b, y));
    let xa = lo, xb = hi;
    if(m === 0){ if(c < ys.a || c > ys.b) return ""; }
    else {
      if(f(lo) < ys.a || f(lo) > ys.b) xa = (clip(f(lo)) - c) / m;
      if(f(hi) < ys.a || f(hi) > ys.b) xb = (clip(f(hi)) - c) / m;
      xa = Math.max(lo, Math.min(hi, xa)); xb = Math.max(lo, Math.min(hi, xb));
      if(Math.abs(xb - xa) < 1e-9) return "";
    }
    return `<line x1="${px(xa)}" y1="${py(f(xa))}" x2="${px(xb)}" y2="${py(f(xb))}" stroke="${colour}" stroke-width="3" stroke-dasharray="9 7" stroke-linecap="round"/>`;
  };
  let yours = null;
  if(g.line && it.settled){
    s += seg(slope(r), r.start, "#16a34a");
    yours = theirLine(it);
    if(yours) s += seg(yours.m, yours.c, "#dc2626");
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
  $("graphNote").innerHTML = plotting ? L("nClick") :
    (g.line && it.settled ? L([["nLine", { eq:eqSpan(r) }]].concat(yours ? [["nYours"]] : [])) :
    (g.liveStep >= 0 ? L("nLive") : (g.given.length ? L("nRead") : "")));
  $("graphHead").innerHTML = one(g.zero ? "graphAll" : "graphFirst");
  $("clearPts").hidden = !plotting;
}
/* the line of the student's own equation, when it was marked wrong */
function theirLine(it){
  const s = it.steps.find(x => (x.t === "frame" || x.t === "eq") && x.first !== null);
  if(!s || s.last) return null;
  if(s.t === "frame"){
    const v = s.vals || {}, a = numOf(v.a || ""), b = numOf(v.b || "");
    if(!isFinite(a) || !isFinite(b) || !v.sign) return null;
    return { c:a, m:v.sign === "-" ? -b : b };
  }
  const res = CL.equation(s.val || "");
  return res.linear ? { c:res.linear.b, m:res.linear.m } : null;
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
  if(hint) hint.innerHTML = hintPlot(Object.keys(s.pts).length, s.xs.length);
});
$("graph").addEventListener("pointermove", e => {
  const gh = document.getElementById("ghost"); if(!gh) return;
  const s = plotState(); const p = s && snap(e);
  if(!p){ gh.style.display = "none"; return; }
  gh.setAttribute("cx", G.px(p.x)); gh.setAttribute("cy", G.py(p.y)); gh.style.display = "";
});
$("graph").addEventListener("pointerleave", () => { const gh = document.getElementById("ghost"); if(gh) gh.style.display = "none"; });
$("clearPts").addEventListener("click", () => { const s = plotState(); if(s){ s.pts = {}; s.marks = null; drawGraph(); paintPlotHint(); } });
function paintPlotHint(){ const it = cur(); const h = $("qCard").querySelector(`.part[data-step="${it.graph.plotStep}"] .hintLine`); if(h) h.innerHTML = hintPlot(0, it.steps[it.graph.plotStep].xs.length); }
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
function renderCert(){
  const s = scores(), L0 = lv();
  const pct = s.total ? Math.round(s.score / s.total * 100) : 0;
  $("certScore").textContent = `${s.score} / ${s.total}`;
  $("certLine").innerHTML = `${CFG.title} &middot; ${L0.name} &middot; ${pct}%`;   // the .certSub line below is the sign-in script's
  $("certBreak").innerHTML = CATS.filter(c => s.cats[c]).map(c => `${one("cat_" + c)}${LANG === "en" ? "" : ` <span class="elI">(${UI["cat_" + c].en})</span>`}: <bdi dir="ltr">${s.cats[c][0]} / ${s.cats[c][1]}</bdi>`).join("<br>");
  return { s, pct };
}
function finish(){
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.settled = true; it.correct = false; it.steps.forEach(s => { if(s.first === null) s.first = false; }); } });
  const { s, pct } = renderCert(), L0 = lv();
  $("progressFill").style.width = "100%";
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts. */
  const types = CATS.filter(c => s.cats[c]).map(c => c + ":" + s.cats[c][0] + "/" + s.cats[c][1])
    .concat(["level:" + S.levelKey, "quadrants:" + (QUAD ? "all" : "first")]);
  if(LANG !== "en") types.push("lang:" + LANG);
  if(window.MMTSave) window.MMTSave({
    tool:CFG.tool, topic:"algebra",
    level:L0.name, levelKey:S.levelKey,
    score:s.score, total:s.total, percent:pct,
    masteryTopic:CFG.mastery,
    types,
    certificateText:"Counting Strategies — " + CFG.title + " — " + L0.name + ": " + s.score + "/" + s.total,
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
    const L0 = LEVELS[k];
    return `<button class="lvlRow ${k}" type="button" data-k="${k}"><span class="lvlIco">${L0.ico}</span>`
      + `<strong>${L0.name}</strong><span class="d">${L(L0.d)}</span><span class="go">&rsaquo;</span></button>`;
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
  try{ await navigator.clipboard.writeText(line); $("copyBtn").innerHTML = L("copied"); }
  catch(e){ $("copyBtn").innerHTML = L("copyFail"); }
  setTimeout(() => { $("copyBtn").innerHTML = L("copyResult"); }, 1800);
});
$("toolsBtn").addEventListener("click", e => {
  e.stopPropagation();
  const m = $("toolsMenu"), was = m.classList.contains("open");
  m.classList.toggle("open", !was); $("toolsBtn").setAttribute("aria-expanded", String(!was));
});
document.addEventListener("click", () => { $("toolsMenu").classList.remove("open"); $("toolsBtn").setAttribute("aria-expanded", "false"); });
document.addEventListener("keydown", e => { if(e.key === "Escape") $("toolsMenu").classList.remove("open"); });

/* ---------- the language switch (top bar and level chooser) ---------- */
function applyLang(){
  try{ localStorage.setItem("mmt-csq-lang", LANG); }catch(e){}
  document.querySelectorAll(".langTog button").forEach(b => { b.classList.toggle("on", b.dataset.lang === LANG); b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)); });
  $("prevBtn").innerHTML = L("prev");
  $("clearPts").innerHTML = L("clearPts");
  $("menuBtn").innerHTML = one("changeLevel");
  $("lvlTitle").innerHTML = L("chooseLevel");
  $("lvlSub").innerHTML = L(QUAD ? "levelSubAll" : "levelSubFirst");
  $("certTitle").innerHTML = L("finished");
  $("againBtn").innerHTML = L("tryAgain");
  $("changeLvlBtn").innerHTML = L("changeLevel");
  $("copyBtn").innerHTML = L("copyResult");
  buildLevelList();
  const keep = PROMPT;
  if(cur()){
    paint();
    if(keep && keep.i === S.i) setPrompt(keep.msg, keep.kind);
    if($("certModal").classList.contains("open")) renderCert();
  } else {
    $("nextBtn").innerHTML = L("next");
    $("graphHead").innerHTML = one(QUAD ? "graphAll" : "graphFirst");
    setPrompt([["chooseBegin"]]);
  }
}
document.addEventListener("click", e => {
  const b = e.target.closest(".langTog button"); if(!b) return;
  e.stopPropagation();
  LANG = b.dataset.lang; applyLang();
});

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

applyLang();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__CSQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, term, slope, eqHTML, yScale, readable, QUAD, get G(){ return G; }, get FIRSTQ(){ return FIRSTQ; }, CL, CTX, UI, STORY, NAME_T, tx, setLang:k => { LANG = k; applyLang(); }, lang:() => LANG };
})();
