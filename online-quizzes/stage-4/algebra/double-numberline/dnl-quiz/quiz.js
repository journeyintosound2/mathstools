/* =====================================================================
   ONE-STEP EQUATIONS — DOUBLE NUMBER LINE — STUDENT QUIZ (2026-11-17)
   ---------------------------------------------------------------------
   ONE engine for the three quiz pages (add/subtract, multiply/divide,
   mixed). Each page sets window.DNQ = { scope, tool, title, mastery } and
   loads this file; the saved tool names are the old pages' names, so
   tasks and results already set keep working.

   The idea is the teaching tool's: a double number line pairs every
   point, an expression in x on top and its value underneath. Solving is
   making the move that gets from the known pair back to x — and the same
   move happens on BOTH lines. Orange = what was done to x, purple = the
   move that undoes it.

   The card on the left is ONE question and ONE answer. The panel on the
   right (Sweet and Mild) is the teaching tool's double number line, drawn
   from the question: Show me ▸ plays the move on both lines. It is never
   marked, never required, and the answer stays "?" until the question is
   settled. A wrong first answer runs the model to its end.
     Sweet  the model counts along the bottom line as the move is made
     Mild   the model draws the move but leaves the bottom line to them
     Medium / Spicy  no model
   The ladder:
     Sweet  small whole numbers; read the line (x is over 7: what is under
            x + 5?), what undoes it?, solve
     Mild   bigger whole numbers; 5 + x and 12 = x + 5; other letters;
            check by substituting; spot the mistake
     Medium negative numbers; write the equation from words; a word problem
     Spicy  bigger negatives, sides swapped, word problems, sign mistakes
   Marking (as the other quizzes): only the FIRST check scores; Check again
   lets them fix it; an empty or unreadable check is free; Next on an
   unanswered question counts it as wrong. Nothing typed is ever saved.
   ===================================================================== */
(() => {
"use strict";
const CFG = Object.assign({ scope:"mix", tool:"equations-double-number-line-student-quiz", title:"One-Step Equations — Double Number Line",
  mastery:"equations-double-number-line-student-quiz" }, window.DNQ || {});
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const MINUS = "−", TIMES = "×", DIVIDE = "÷";
const fmt = n => n < 0 ? MINUS + Math.abs(n) : String(n);
const eqS = s => `<span class="eq">${s}</span>`;

/* ---------------------------------------------------------- maths italics, as Word's equation editor
   (the same as the teaching tool): real maths-italic glyphs when a font has them, else a serif italic */
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
const frH = (top, bot) => `<span class="frac"><span>${top}</span><span>${bot}</span></span>`;

/* ---------------------------------------------------------- an equation
   q = { op:"add"|"sub"|"mul"|"div", v (the letter), k | a | d, c (what the expression equals), x (the answer),
         kFirst (5 + x), rev (12 = x + 5), turn (× ÷ with a negative: the line turns around) }      */
function exprH(q){
  const v = Lt(q.v);
  if(q.op === "add") return q.kFirst ? `${q.k} + ${v}` : `${v} + ${q.k}`;
  if(q.op === "sub") return `${v} ${MINUS} ${q.k}`;
  if(q.op === "mul") return `${q.a}${v}`;
  return frH(v, q.d);
}
const eqnH = q => q.rev ? `${fmt(q.c)} = ${exprH(q)}` : `${exprH(q)} = ${fmt(q.c)}`;
const buildOp = q => q.op === "add" ? `+ ${q.k}` : q.op === "sub" ? `${MINUS} ${q.k}` : q.op === "mul" ? `${TIMES} ${q.a}` : `${DIVIDE} ${q.d}`;
const undoOp = q => q.op === "add" ? `${MINUS} ${q.k}` : q.op === "sub" ? `+ ${q.k}` : q.op === "mul" ? `${DIVIDE} ${q.a}` : `${TIMES} ${q.d}`;
/* the working, both sides: x + 5 − 5 = 12 − 5 */
function bothH(q){
  const e = exprH(q), c = fmt(q.c);
  let l, r;
  if(q.op === "add"){ l = `${e} ${MINUS} ${q.k}`; r = `${c} ${MINUS} ${q.k}`; }
  else if(q.op === "sub"){ l = `${e} + ${q.k}`; r = `${c} + ${q.k}`; }
  else if(q.op === "mul"){ l = frH(e, q.a); r = frH(c, q.a); }
  else { l = `${e} ${TIMES} ${q.d}`; r = `${c} ${TIMES} ${q.d}`; }
  return q.rev ? `${r} = ${l}` : `${l} = ${r}`;
}
/* substituting the answer back in: 3 × (−4) = −12 */
function subH(q, xv){
  xv = xv == null ? q.x : xv;
  const br = xv < 0 ? `(${fmt(xv)})` : fmt(xv);
  let e;
  if(q.op === "add") e = q.kFirst ? `${q.k} + ${br}` : `${fmt(xv)} + ${q.k}`;
  else if(q.op === "sub") e = `${fmt(xv)} ${MINUS} ${q.k}`;
  else if(q.op === "mul") e = `${q.a} ${TIMES} ${br}`;
  else e = frH(fmt(xv), q.d);
  return e;
}
const evalE = (q, xv) => q.op === "add" ? xv + q.k : q.op === "sub" ? xv - q.k : q.op === "mul" ? q.a * xv : xv / q.d;
const whySolve = q => `${eqS(undoOp(q))} undoes ${eqS(buildOp(q))}. Do it to both sides: ${eqS(bothH(q))}, so ${eqS(`${Lt(q.v)} = ${fmt(q.x)}`)}.`;

/* ---------------------------------------------------------- numbers for each level */
/* no i, l, o (they read as 1 and 0), no v, and no e (it is a number in other subjects) */
const LETTERS = "abcdfghjkmnpqrstuwyz".split("");
let USED = new Set();
const sigOf = q => [q.op, q.k, q.a, q.d, q.c].join(",");
function letterFor(level){
  const p = { sweet:0, mild:.3, medium:.5, spicy:.5 }[level] || 0;
  return Math.random() < p ? pick(LETTERS) : "x";
}
/* neg: "no" positive only, "yes" must use a negative somewhere, "any" */
function genOne(op, level, neg){
  for(let t = 0; t < 4000; t++){
    let q;
    if(op === "add" || op === "sub"){
      let k, x;
      if(level === "sweet"){ k = R(2, 9); x = R(1, 12); }
      else if(level === "mild"){ k = R(4, 20); x = R(3, 30); }
      else if(level === "medium"){ k = R(2, 15); x = R(-15, 15); }
      else { k = R(10, 60); x = R(-80, 80); }
      const c = op === "add" ? x + k : x - k;
      q = { op, k, x, c };
      if(level === "sweet" && (c < 1 || c > 20)) continue;
      if(level === "mild" && (c < 1 || c > 50)) continue;
      if(level === "medium" && (c < -20 || c > 20)) continue;
      if(level === "spicy" && (c < -99 || c > 99)) continue;
    } else if(op === "mul"){
      let a, x;
      if(level === "sweet"){ a = R(2, 5); x = R(2, 10); }
      else if(level === "mild"){ a = R(2, 10); x = R(2, 12); }
      else if(level === "medium"){ a = R(2, 9); x = R(2, 10) * (Math.random() < .75 ? -1 : 1); }
      else { a = R(3, 12); x = R(2, 15) * (Math.random() < .7 ? -1 : 1); }
      q = { op, a, x, c:a * x };
      if(Math.abs(q.c) > 180) continue;
    } else {
      let d, c;
      if(level === "sweet"){ d = R(2, 5); c = R(2, 10); }
      else if(level === "mild"){ d = R(2, 10); c = R(2, 12); }
      else if(level === "medium"){ d = R(2, 9); c = R(2, 10) * (Math.random() < .75 ? -1 : 1); }
      else { d = R(3, 12); c = R(2, 15) * (Math.random() < .7 ? -1 : 1); }
      q = { op, d, c, x:d * c };
      if(Math.abs(q.x) > 180) continue;
    }
    const hasNeg = q.x < 0 || q.c < 0;
    if(neg === "no" && (hasNeg || q.x === 0 || q.c === 0)) continue;
    if(neg === "yes" && !hasNeg) continue;
    if(q.x === 0) continue;
    if(USED.has(sigOf(q)) && t < 3000) continue;
    USED.add(sigOf(q));
    q.v = "x";
    return finishQ(q);
  }
  return finishQ({ op:"add", k:5, x:7, c:12, v:"x" });
}
function finishQ(q){
  q.kFirst = !!q.kFirst && q.op === "add";
  q.rev = !!q.rev;
  q.turn = (q.op === "mul" || q.op === "div") && q.c < 0;
  return q;
}
/* the operations this page asks about, dealt from a shuffled deck so they come round evenly */
const OPS = { as:["add", "sub"], md:["mul", "div"], mix:["add", "sub", "mul", "div"] }[CFG.scope] || ["add", "sub", "mul", "div"];
let DECK = [];
const nextOp = () => { if(!DECK.length) DECK = shuffle(OPS); return DECK.pop(); };
function eqFor(level, o){
  o = o || {};
  const neg = o.neg || (level === "sweet" || level === "mild" ? "no" : level === "medium" ? (Math.random() < .7 ? "yes" : "any") : (Math.random() < .8 ? "yes" : "any"));
  const q = genOne(o.op || nextOp(), level, neg);
  if(!o.plain){
    if(level !== "sweet") q.v = letterFor(level);
    if(o.form === "rev") q.rev = true;
    if(o.form === "kFirst" && q.op === "add") q.kFirst = true;
    if(o.form === "any"){ if(q.op === "add" && Math.random() < .35) q.kFirst = true; if(Math.random() < (level === "spicy" ? .45 : .3)) q.rev = true; }
  }
  return finishQ(q);
}

/* ---------------------------------------------------------- questions */
function base(level, o){
  return Object.assign({ level, model:level === "sweet" || level === "mild", mStep:0, settled:false, correct:false, q:"", tpl:null, working:"", ask:"" }, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:[], marks:null, fixText:null, sel:null }, o); }
const catOf = q => q.op;

/* solve: x + 5 = 12, x = [ ] */
function qSolve(level, eq){
  const it = base(level, { eq, dir:"inv" });
  it.q = "Solve.";
  it.working = eqnH(eq);
  it.tpl = [`${Lt(eq.v)} =`, { in:0 }];
  it.steps = [ step("num", { cat:catOf(eq), neg:eq.x < 0 || eq.c < 0, ans:[eq.x], why:() => whySolve(eq) }) ];
  return it;
}
/* read the line, going forward: x is above 7, what is under x + 5? */
function qPair(level, eq){
  const it = base(level, { eq, dir:"fwd" });
  it.q = `On the double number line, ${eqS(Lt(eq.v))} is above ${eqS(fmt(eq.x))}. What number goes under ${eqS(exprH(eq))}?`;
  it.tpl = [`${exprH(eq)} =`, { in:0 }];
  const how = eq.op === "add" ? `${eqS(exprH(eq))} is ${eq.k} more than ${eqS(Lt(eq.v))}` : eq.op === "sub" ? `${eqS(exprH(eq))} is ${eq.k} less than ${eqS(Lt(eq.v))}`
    : eq.op === "mul" ? `${eqS(exprH(eq))} is ${eq.a} groups of ${eqS(Lt(eq.v))}` : `${eqS(exprH(eq))} is one of ${eq.d} equal parts of ${eqS(Lt(eq.v))}`;
  it.steps = [ step("num", { cat:"pair", ans:[eq.c], why:() => `${how}. Do the same on the bottom line: ${eqS(`${subH(eq)} = ${fmt(eq.c)}`)}.` }) ];
  return it;
}
/* what undoes it? (multiple choice) */
function qUndo(level, eq){
  const it = base(level, { eq, dir:"inv", hidePill:true });
  it.q = `What move takes ${eqS(exprH(eq))} back to ${eqS(Lt(eq.v))} on both lines?`;
  it.working = eqnH(eq);
  const n = eq.k || eq.a || eq.d;
  const ops = [["+", "add"], [MINUS, "sub"], [TIMES, "mul"], [DIVIDE, "div"]].map(([s, o]) => ({ h:`<span class="pillOpt">${s} ${n}</span>`, o }));
  const inv = { add:"sub", sub:"add", mul:"div", div:"mul" }[eq.op];
  const opts = ops.map(p => ({ h:p.h, ok:p.o === inv }));
  it.steps = [ step("mc", { cat:"undo", opts:shuffle(opts), why:() => `${eqS(exprH(eq))} is ${eqS(Lt(eq.v))} with ${eqS(buildOp(eq))} done to it. ${eqS(undoOp(eq))} undoes that, on both lines: ${Lt(eq.v)} = ${fmt(eq.x)}.` }) ];
  return it;
}
/* check by substituting: which value makes it true? (multiple choice) */
function qCheck(level, eq){
  const it = base(level, { eq, dir:"inv" });
  it.q = `Which value of ${eqS(Lt(eq.v))} makes this true?`;
  it.working = eqnH(eq);
  const right = eq.x, wrong = new Set();
  /* the usual slips: the move made the wrong way, the number left as it was, the sign lost */
  if(eq.op === "add") [eq.c + eq.k, eq.k - eq.c, eq.c].forEach(v => wrong.add(v));
  if(eq.op === "sub") [eq.c - eq.k, eq.k - eq.c, eq.c].forEach(v => wrong.add(v));
  if(eq.op === "mul") [eq.c * eq.a, eq.c - eq.a, -eq.x].forEach(v => wrong.add(v));
  if(eq.op === "div") [eq.c, eq.c + eq.d, -eq.x].forEach(v => wrong.add(v));
  wrong.delete(right);
  [right + 1, right - 1, right + 2, -right].forEach(v => { if(wrong.size < 3 && v !== right) wrong.add(v); });
  const opts = [{ h:eqS(`${Lt(eq.v)} = ${fmt(right)}`), ok:true }].concat([...wrong].slice(0, 3).map(v => ({ h:eqS(`${Lt(eq.v)} = ${fmt(v)}`), ok:false })));
  it.steps = [ step("mc", { cat:"check", opts:shuffle(opts), why:() => `Put it back in: ${eqS(eq.rev ? `${fmt(eq.c)} = ${subH(eq)}` : `${subH(eq)} = ${fmt(eq.c)}`)} ✓. Only ${eqS(`${Lt(eq.v)} = ${fmt(right)}`)} makes both sides match.` }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
let NAMEBAG = [];
const nameOf = () => { if(!NAMEBAG.length) NAMEBAG = shuffle(NAMES); return NAMEBAG.pop(); };
/* spot the mistake: a worked answer with a classic slip (multiple choice) */
function qMistake(level, eq, kind){
  const it = base(level, { eq, dir:"inv" }), nm = nameOf(), v = Lt(eq.v);
  /* "dir": the move made the wrong way (added instead of took away, multiplied instead of divided)
     "sign": the right size, the sign lost (only asked when the answer really is negative) */
  const wrongWay = eq.op === "add" ? eq.c + eq.k : eq.op === "sub" ? eq.c - eq.k : eq.op === "mul" ? eq.c * eq.a : null;
  let bad, says;
  if(kind === "sign"){
    bad = -eq.x;
    says = `${nm} lost the negative sign. It is ${eqS(`${v} = ${fmt(eq.x)}`)}`;
  } else {
    bad = wrongWay != null ? wrongWay : eq.c - eq.d;     /* ÷: subtracted instead of multiplying */
    says = eq.op === "div" ? `${nm} took ${eq.d} away instead of undoing ${eqS(buildOp(eq))} with ${eqS(undoOp(eq))}. It is ${eqS(`${v} = ${fmt(eq.x)}`)}`
      : `${nm} did ${eqS(buildOp(eq))} again instead of undoing it with ${eqS(undoOp(eq))}. It is ${eqS(`${v} = ${fmt(eq.x)}`)}`;
  }
  it.q = `${nm} solved this and wrote ${eqS(`${v} = ${fmt(bad)}`)}.`;
  it.working = eqnH(eq);
  it.ask = "What went wrong?";
  const seen = new Set([bad, eq.x]), alt = [];
  const add = (val, h) => { if(val == null || !Number.isInteger(val) || seen.has(val) || alt.length >= 2) return; seen.add(val); alt.push({ h:h(val), ok:false }); };
  if(kind === "sign") add(wrongWay != null ? wrongWay : eq.c - eq.d, val => `${nm} should have done ${eqS(buildOp(eq))} again: ${eqS(`${v} = ${fmt(val)}`)}`);
  add(eq.c, val => `The other side doesn't change, so ${eqS(`${v} = ${fmt(val)}`)}`);
  add(-bad, val => `The sign is wrong: ${eqS(`${v} = ${fmt(val)}`)}`);
  add(bad + 1, val => `${nm} is out by one: ${eqS(`${v} = ${fmt(val)}`)}`);
  const opts = [{ h:says, ok:true }, { h:`Nothing — ${eqS(`${v} = ${fmt(bad)}`)} is right`, ok:false }].concat(alt);
  it.steps = [ step("mc", { cat:"mistake", opts:shuffle(opts), why:() => `Check ${eqS(`${v} = ${fmt(bad)}`)}: ${eqS(subH(eq, bad))} is ${fmt(evalE(eq, bad))}, not ${fmt(eq.c)}. ${whySolve(eq)}` }) ];
  return it;
}
/* write the equation from words (multiple choice) */
function qWrite(level, eq){
  const it = base(level, { eq, model:false });
  const n = eq.k || eq.a || eq.d, c = fmt(eq.c);
  const say = { add:`add ${n}`, sub:`take away ${n}`, mul:`multiply it by ${n}`, div:`divide it by ${n}` }[eq.op];
  it.q = `I think of a number, ${say}, and get ${c}. Which equation shows this?`;
  const v = Lt("x"), forms = { add:`${v} + ${n} = ${c}`, sub:`${v} ${MINUS} ${n} = ${c}`, mul:`${n}${v} = ${c}`, div:`${frH(v, n)} = ${c}` };
  const opts = Object.keys(forms).map(o => ({ h:eqS(forms[o]), ok:o === eq.op }));
  it.steps = [ step("mc", { cat:"write", opts:shuffle(opts), why:() => `The number is ${eqS(v)}. To ${say} is ${eqS(forms[eq.op].split(" = ")[0])}, and that makes ${c}: ${eqS(forms[eq.op])}. Then ${eqS(`${v} = ${fmt(eq.x)}`)}.` }) ];
  return it;
}
/* use it: a word problem (the answer is the unknown) */
const STORIES = {
  add:[ (k, c) => ({ t:`Ava had some stickers. She was given ${k} more and now has ${c}. How many did she have at the start?`, v:"s", u:"stickers" }),
        (k, c) => ({ t:`A plant grew ${k} cm and is now ${c} cm tall. How tall was it before?`, v:"h", u:"cm" }),
        (k, c) => ({ t:`After scoring ${k} points in the last round, Leo's total is ${c}. What was his score before the last round?`, v:"p", u:"points" }) ],
  sub:[ (k, c) => ({ t:`Some people were on a bus. ${k} got off and ${c} were left. How many were on the bus?`, v:"p", u:"people" }),
        (k, c) => ({ t:`Mia spent $${k} and has $${c} left. How much did she have to start with?`, v:"m", u:"dollars" }),
        (k, c) => ({ t:`A rope had ${k} m cut off it. ${c} m is left. How long was the rope?`, v:"r", u:"m" }) ],
  mul:[ (a, c) => ({ t:`Movie tickets cost $${a} each. Noah paid $${c}. How many tickets did he buy?`, v:"t", u:"tickets" }),
        (a, c) => ({ t:`${a} identical boxes weigh ${c} kg altogether. How much does one box weigh?`, v:"b", u:"kg" }),
        (a, c) => ({ t:`A car travels the same distance each hour. In ${a} hours it travels ${c} km. How far does it go each hour?`, v:"d", u:"km" }) ],
  div:[ (d, c) => ({ t:`A ribbon is cut into ${d} equal pieces, each ${c} cm long. How long was the ribbon?`, v:"r", u:"cm" }),
        (d, c) => ({ t:`A prize is shared equally between ${d} people. Each gets $${c}. How big was the prize?`, v:"p", u:"dollars" }),
        (d, c) => ({ t:`A class is split into ${d} equal teams of ${c}. How many students are in the class?`, v:"s", u:"students" }) ]
};
/* below zero: temperatures, depths and bank balances */
const NEG_STORIES = {
  add:(k, c) => ({ t:`A diver rose ${k} m and is now at ${fmt(c)} m. What depth did she start at?`, v:"d", u:"m" }),
  sub:(k, c) => ({ t:`The temperature dropped ${k}°C overnight to ${fmt(c)}°C. What was it before the drop?`, v:"t", u:"°C" }),
  mul:(a, c) => ({ t:`A share price changed by the same amount each day for ${a} days. Altogether it changed by ${fmt(c)} dollars. What was the change each day?`, v:"p", u:"dollars" }),
  div:(d, c) => ({ t:`A total change in temperature was split evenly over ${d} hours: ${fmt(c)}°C each hour. What was the total change?`, v:"t", u:"°C" })
};
function qWord(level, eq){
  if(eq.x < 0 || eq.c < 0){
    /* a diver ends below the surface; a temperature, a share price and a total change can all be negative */
    for(let t = 0; t < 200 && !(eq.op === "add" ? eq.c < 0 && eq.x < 0 : eq.op === "sub" ? eq.c < 0 : eq.x < 0 && eq.c < 0); t++) eq = eqFor(level, { op:eq.op, neg:"yes" });
  }
  const it = base(level, { eq, model:false });
  const n = eq.k || eq.a || eq.d;
  const neg = eq.x < 0 || eq.c < 0;
  const st = neg ? NEG_STORIES[eq.op](n, eq.c) : pick(STORIES[eq.op])(n, eq.c);
  eq.v = st.v; eq.kFirst = false; eq.rev = false;
  it.q = st.t;
  it.ask = `<span class="qSmall">Write an equation, then solve it.</span>`;
  it.tpl = [`${Lt(st.v)} =`, { in:0 }];
  it.steps = [ step("num", { cat:"word", ans:[eq.x], why:() => `The equation is ${eqS(eqnH(eq))}. ${whySolve(eq)}` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"Small whole numbers. Read the double number line, find the move that undoes it, then solve. The model counts along the line with you." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"Bigger numbers, other letters, 5 + x and 12 = x + 5, checking and spotting a mistake. The model draws the move; you finish it." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"No model. Negative numbers, writing the equation from words, and a word problem." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Bigger negatives, sides swapped, word problems and sign mistakes to spot." }
};
const ORDER = ["sweet","mild","medium","spicy"];
const negX = E => { let q = E({ neg:"yes" }); for(let t = 0; t < 200 && q.x >= 0; t++) q = E({ neg:"yes", op:q.op }); return q; };
function buildPaper(level){
  USED = new Set(); NAMEBAG = []; DECK = [];
  const E = o => eqFor(level, o);
  if(level === "sweet") return [
    qPair(level, E({ plain:true })), qSolve(level, E()), qUndo(level, E()), qSolve(level, E()), qPair(level, E()),
    qSolve(level, E()), qUndo(level, E()), qSolve(level, E()), qSolve(level, E()), qSolve(level, E())
  ];
  if(level === "mild") return [
    qSolve(level, E({ plain:true })), qSolve(level, E()), qUndo(level, E()), qSolve(level, E({ form:"kFirst" })), qCheck(level, E()),
    qSolve(level, E()), qMistake(level, E(), "dir"), qSolve(level, E({ form:"rev" })), qSolve(level, E()), qSolve(level, E({ form:"any" }))
  ];
  if(level === "medium") return [
    qSolve(level, E({ neg:"yes" })), qSolve(level, E({ form:"any" })), qWrite(level, E({ neg:"no" })), qSolve(level, E({ neg:"yes", form:"rev" })), qCheck(level, E({ neg:"yes" })),
    qSolve(level, E({ neg:"yes" })), qMistake(level, negX(E), "sign"), qSolve(level, E({ form:"any" })), qWord(level, E({ neg:"no" })), qSolve(level, E({ neg:"yes", form:"any" }))
  ];
  return [
    qSolve(level, E({ neg:"yes" })), qSolve(level, E({ neg:"yes", form:"rev" })), qMistake(level, negX(E), "sign"), qSolve(level, E({ form:"any" })), qWord(level, E({ neg:"no" })),
    qSolve(level, E({ neg:"yes", form:"any" })), qCheck(level, E({ neg:"yes", form:"any" })), qSolve(level, E({ neg:"yes", form:"rev" })), qWord(level, E({ neg:"yes" })), qSolve(level, E({ neg:"yes" }))
  ];
}

/* =====================================================================
   MARKING
   ===================================================================== */
function num(raw){
  let s = String(raw == null ? "" : raw).trim().toLowerCase().replace(/[−–—]/g, "-").replace(/\s+/g, "");
  s = s.replace(/^[a-z]=/, "");          /* "x = 12" is fine */
  if(!/^[+-]?\d+$/.test(s)) return NaN;
  return parseInt(s, 10);
}
const empty = s => String(s == null ? "" : s).trim() === "";
function markStep(it, s){
  if(s.t === "num"){
    if(empty(s.vals[0])) return { invalid:"Type your answer first." };
    const v = num(s.vals[0]);
    if(isNaN(v)) return { invalid:"Type a whole number. Use − for a negative." };
    const ok = v === s.ans[0];
    return { ok, marks:[ok], fix:ok ? null : s.why() };
  }
  if(s.sel == null) return { invalid:"Choose an answer first." };
  const ok = !!s.opts[s.sel].ok;
  return { ok, marks:s.opts.map((o, i) => i === s.sel ? ok : null), fix:ok ? null : s.why() };
}

/* =====================================================================
   THE CARD — one question, one answer (as the Number Groups quiz)
   ===================================================================== */
const S = { levelKey:null, items:[], i:0 };
const cur = () => S.items[S.i];
const lv = () => LEVELS[S.levelKey];
const stacked = () => window.innerWidth <= 980;
function setPrompt(msg, kind){ const f = $("fb"); if(!f) return; f.className = "fb" + (kind ? " " + kind : ""); f.innerHTML = msg; }
function feedback(it){
  const s = it.steps[0];
  if(s.first === null) return it.model ? setPrompt(`<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>The double number line is ${stacked() ? "below" : "on the right"} if it helps</span>`, "hint") : setPrompt("", "");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}
function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(s.t !== "mc"){
    const m = s.marks ? (s.marks[0] ? " right" : " wrong") : "", v = s.vals[0] == null ? "" : s.vals[0];
    return `<div class="ansEq">` + it.tpl.map(p => typeof p === "string"
      ? `<span class="eqt">${p}</span>`
      : `<input class="cell ans${m}" data-i="0" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="Your answer">`).join("") + `</div>`
      + (s.skipped || (locked && !(s.marks && s.marks[0])) ? `<div class="ansShow">The answer: ${eqS(fmt(s.ans[0]))}</div>` : "");
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
  if(it.working) h += `<div class="working dnlEq">${eqS(it.working)}</div>`;
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
    /* a wrong first answer: the model plays the whole story */
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
   THE PANEL — the teaching tool's double number line, built from the
   question. Steps: the top line is built · what it equals · [the line turns
   around] · the move on both lines. Reading the line forward (x is over 7,
   what is under x + 5?) makes the BUILD move on the bottom line instead.
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const UI = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const MF = '"Cambria Math","STIX Two Math","Latin Modern Math",Cambria,"Times New Roman",serif';
const cv = document.createElement("canvas").getContext("2d");
function tw(txt, px, fam, wt){ cv.font = `${wt || 500} ${px}px ${fam || MF}`; return cv.measureText(txt).width; }
const isAS = q => q.op === "add" || q.op === "sub";
/* pieces of maths for the board: {v:1} letter · {n:"5"} number · {o:"+"} operator · {fr:[top, bottom]} · {t:"?"} */
const V = { v:1 }, Np = n => ({ n:fmt(n) }), Op = o => ({ o });
function exprP(q){
  if(q.op === "add") return q.kFirst ? [Np(q.k), Op("+"), V] : [V, Op("+"), Np(q.k)];
  if(q.op === "sub") return [V, Op(MINUS), Np(q.k)];
  if(q.op === "mul") return [Np(q.a), V];
  return [{ fr:[[V], [Np(q.d)]] }];
}
const offP = j => j === 0 ? [V] : [V, Op(j > 0 ? "+" : MINUS), Np(Math.abs(j))];
const mulP = i => i === 0 ? [Np(0)] : i === 1 ? [V] : [Np(i), V];
const divP = (i, d) => i === 0 ? [Np(0)] : i === d ? [V] : [{ fr:[i === 1 ? [V] : [Np(i), V], [Np(d)]] }];
const isFrac = p => p.length === 1 && !!p[0].fr;
const plainP = p => p.map(t => t.v ? "x" : t.n != null ? t.n : t.o ? ` ${t.o} ` : t.fr ? plainP(t.fr[0]) + "/" + plainP(t.fr[1]) : t.t || "").join("");
function measureP(p, size){
  if(isFrac(p)) return Math.max(measureP(p[0].fr[0], size), measureP(p[0].fr[1], size)) + size * 0.24;
  return tw(plainP(p), size) * 1.04;
}
let QV = "x";
const svgLetter = () => MATH_ALPHA ? `<tspan>${mathItalic(QV)}</tspan>` : `<tspan font-style="italic" style="font-family:var(--itFont)">${esc(QV)}</tspan>`;
const svgIn = p => p.map(t => t.v ? svgLetter() : t.n != null ? `<tspan>${t.n}</tspan>` : t.o ? `<tspan> ${t.o} </tspan>` : `<tspan>${esc(t.t || "")}</tspan>`).join("");

function mSteps(it){
  const q = it.eq, out = [{ t:"Build the top line", id:"build" }, { t:it.dir === "fwd" ? `${Lt(q.v)} is over ${fmt(q.x)}` : "What it equals", id:"value" }];
  if(q.turn && it.dir !== "fwd") out.push({ t:"Turn the line around", id:"turn" });
  out.push({ t:it.dir === "fwd" ? "Same move underneath" : `Undo it on both lines`, id:"move" });
  return out;
}
function layoutModel(it){
  const q = it.eq, W = Math.max(260, svg.clientWidth), H = Math.max(200, svg.clientHeight);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  L = { W, H };
  const fracs = q.op === "div";
  let fsM = Math.min(48, H / (fracs ? 8.4 : isAS(q) ? 7.2 : 8.1), W / 13);
  fsM = Math.max(14, fsM);
  L.fsM = fsM; L.fsS = fsM * 0.62; L.tk = fsM * 0.44; L.tkm = L.tk * 0.6; L.arcH = fsM * 0.62; L.fsF = fsM * 0.78;
  const halfFrac = L.fsF * 1.12, halfIn = fsM * 0.55;
  L.halfT = fracs ? halfFrac : halfIn; L.halfB = halfIn;
  L.dT = L.tk + L.arcH * 0.95 + L.halfT; L.dB = L.tk + L.arcH * 0.95 + L.halfB;
  const pillH = L.fsS * 0.95 * 1.55, asq = isAS(q);
  const extT = asq ? L.dT + L.halfT + pillH + fsM * 0.25 : L.dT + L.halfT + fsM * 1.37;
  const extB = asq ? L.dB + L.halfB + pillH + fsM * 0.25 : L.dB + L.halfB + fsM * 1.37;
  L.y0 = Math.round((H - extT - extB) / 2 + extT);
  L.yLt = L.y0 - L.dT; L.yLb = L.y0 + L.dB;
  L.yAt = L.yLt - L.halfT - fsM * 0.2; L.yAb = L.yLb + L.halfB + fsM * 0.2; L.arrH = fsM * 1.05;
  L.yPt = asq ? L.yLt - L.halfT - pillH * .5 - fsM * .08 : L.yAt - L.arrH * .5;
  L.yPb = asq ? L.yLb + L.halfB + pillH * .5 + fsM * .08 : L.yAb + L.arrH * .5;
  const big = p => measureP(p, fsM);
  let endW;
  if(asq) endW = Math.max(big(exprP(q)), big([Np(q.c)]) * 1.3, big([Np(q.x)]) * 1.3);
  else endW = Math.max(big(q.op === "mul" ? mulP(q.a) : [V]), big([Np(q.op === "mul" ? q.c : q.x)]) * 1.3, big([Np(0)]));
  L.pad = Math.max(W * 0.045, endW / 2 + 12);
  L.left = L.pad; L.right = W - L.pad;
  if(asq){
    const lo = Math.min(q.x, q.c), hi = Math.max(q.x, q.c);
    L.units = hi - lo <= 24; L.unit = (L.right - L.left) / Math.max(1, hi - lo);
    L.P = v => L.left + (v - lo) * L.unit;
    let wmax = .001;
    for(let v = lo + 1; v < hi; v++) wmax = Math.max(wmax, measureP(offP(v - q.x), 1), measureP([Np(v)], 1));
    L.stride = 0; L.fsI = 0;
    if(L.units) for(const s of [1, 2, 5, 10]){ const f = Math.min(L.fsS, .86 * s * L.unit / wmax); if(f >= 11.5){ L.stride = s; L.fsI = f; break; } }
    L.majW = { x:Math.max(big([V]), big([Np(q.x)]) * 1.3), e:Math.max(big(exprP(q)), big([Np(q.c)]) * 1.3) };
  } else {
    const n = q.op === "mul" ? q.a : q.d;
    L.n = n; L.step = (L.right - L.left) / n; L.Pi = i => L.left + i * L.step; L.mirror = px => L.left + L.right - px;
    let wmax = .001; const unitV = q.op === "mul" ? q.x : q.c;
    for(let i = 2; i < n; i++) wmax = Math.max(wmax, measureP(q.op === "mul" ? mulP(i) : divP(i, n), 1), measureP([Np(i * unitV)], 1));
    const f = Math.min(L.fsS, .84 * L.step / wmax); L.fsI = f >= 11 ? f : 0;
    const kP = q.op === "mul" ? mulP(n) : divP(1, n);
    L.kSize = Math.min(isFrac(kP) ? L.fsF : fsM, .9 * L.step / Math.max(.001, measureP(kP, 1)));
    L.bSize = Math.min(fsM, .92 * L.step / Math.max(.001, measureP([Np(q.c)], 1), measureP([Np(q.x)], 1) + .5));
  }
  return L;
}
const COL = { ink:"#0f172a", line:"#334155", soft:"#94a3b8", top:"#1d4ed8", topI:"#3b6fe0", bot:"#15803d", botI:"#2f9e5b",
  build:"#ea580c", buildBg:"#fff7ed", undo:"#7c3aed", undoBg:"#f5f3ff", bad:"#dc2626", q:"#64748b" };
const tick = (key, x, major, o, d) => ({ key, type:"tick", x, y:L.y0, h:major ? L.tk : L.tkm, w:major ? Math.max(3, L.fsM * .09) : Math.max(2, L.fsM * .055), col:major ? COL.ink : COL.soft, o, d:d || 0, z:4 });
const lab = (key, x, top, p, size, col, o, d, extra) => Object.assign({ key, type:"lab", x, y:top ? L.yLt : L.yLb, p, size, col, o, d:d || 0, z:5 }, extra || {});
const pill = (key, x, top, text, col, bg, o, d) => ({ key, type:"pill", x, y:top ? L.yPt : L.yPb, text, col, bg, o, d:d || 0, z:6 });
const hop = (key, x1, x2, side, col, o, d, last) => ({ key, type:"hop", x1, x2, y:L.y0 + side * L.tkm * 1.05, h:L.arcH * .95, side, col, o, d:d || 0, head:true, big:!!last, w:Math.max(2, L.fsM * .06), z:3 });
const arrow = (key, x1, x2, side, col, o, d) => ({ key, type:"hop", x1, x2, y:side < 0 ? L.yAt : L.yAb, h:L.arrH, side, col, o, d:d || 0, head:true, big:true, w:Math.max(2.2, L.fsM * .07), z:3 });
const loop = (key, x1, x2, o, d) => ({ key, type:"loop", x1, x2, y:L.y0, ry:L.arcH * .95, o, d:d || 0, z:2 });
function sceneOf(it, id){
  const ids = mSteps(it).map(s => s.id), at = ids.indexOf(id), has = s => { const k = ids.indexOf(s); return k > -1 && k <= at; };
  const els = [{ key:"axis", type:"axis", x1:5, x2:L.W - 5, y:L.y0, o:1, z:1 }];
  if(isAS(it.eq)) sceneAS(it, has, els); else sceneMD(it, has, els);
  return els;
}
const showCount = it => it.level === "sweet";
function sceneAS(it, has, els){
  const q = it.eq, fwd = it.dir === "fwd", valued = has("value"), moved = has("move"), done = it.settled;
  const sgn = q.op === "add" ? 1 : -1, k = q.k, fsM = L.fsM, Px = L.P(q.x), Pe = L.P(q.c);
  const nearMaj = (v, w) => Math.abs(L.P(v) - Pe) <= L.majW.e / 2 + w / 2 + 5 || Math.abs(L.P(v) - Px) <= L.majW.x / 2 + w / 2 + 5;
  const showI = (v, p) => L.units && L.stride && L.fsI && (v - q.x) % L.stride === 0 && !nearMaj(v, measureP(p, L.fsI));
  const bd = j => .08 + .3 * (j / Math.max(1, k));
  els.push(tick("tx", Px, true, 1), lab("lx", Px, true, [V], fsM, COL.top, 1));
  els.push(tick("te", Pe, true, 1), lab("le", Pe, true, exprP(q), fsM, COL.top, 1));
  if(L.units) for(let j = 1; j < k; j++){
    const v = q.x + sgn * j;
    els.push(tick("tu" + v, L.P(v), false, 1, bd(j)));
    if(showI(v, offP(sgn * j))) els.push(lab("lu" + v, L.P(v), true, offP(sgn * j), L.fsI, COL.topI, .9, bd(j)));
  }
  /* the build move on top: orange, faded once the bottom line is in play (unless it is the move being copied) */
  const bo = fwd ? 1 : moved ? 0 : valued ? .22 : 1;
  if(L.units) for(let j = 0; j < k; j++) els.push(hop("hb" + j, L.P(q.x + sgn * j), L.P(q.x + sgn * (j + 1)), -1, COL.build, bo, bd(j), j === k - 1));
  else els.push(hop("hb0", Px, Pe, -1, COL.build, bo, .1, true));
  els.push(pill("pb", (Px + Pe) / 2, true, buildOp(q).replace(/ /, " "), COL.build, COL.buildBg, bo, .3));
  if(!valued) return;
  const ansAt = fwd ? Pe : Px, known = fwd ? Px : Pe, kv = fwd ? q.x : q.c, av = fwd ? q.c : q.x;
  els.push(lab("bk", known, false, [Np(kv)], fsM, COL.bot, 1, .06));
  if(!done) els.push(lab("bq", ansAt, false, [{ t:"?" }], fsM * 1.1, COL.q, 1, .06));
  if(moved){
    const col = fwd ? COL.build : COL.undo, bg = fwd ? COL.buildBg : COL.undoBg, op = fwd ? buildOp(q) : undoOp(q);
    const dir = fwd ? sgn : -sgn, from = kv, steps = L.units ? k : 1;
    for(let j = 0; j < steps; j++){
      const a = L.units ? L.P(from + dir * j) : known, b = L.units ? L.P(from + dir * (j + 1)) : ansAt;
      if(!fwd) els.push(hop("hs" + j, a, b, -1, COL.undo, 1, bd(j), j === steps - 1));
      els.push(hop("hz" + j, a, b, 1, col, 1, bd(j), j === steps - 1));
    }
    const pt = it.hidePill && !done ? "?" : op;
    if(!fwd) els.push(pill("ps", (Px + Pe) / 2, true, pt, COL.undo, COL.undoBg, 1, .1));
    els.push(pill("pz", (Px + Pe) / 2, false, pt, col, bg, 1, .1));
    if(showCount(it) && L.units) for(let j = 1; j < k; j++){
      const v = from + dir * j;
      if(showI(v, [Np(v)])) els.push(lab("bu" + v, L.P(v), false, [Np(v)], L.fsI, v === 0 ? COL.ink : COL.botI, .9, bd(j)));
    }
  }
  if(done) els.push(lab("ba", ansAt, false, [Np(av)], fsM, COL.bot, 1, .3, { bg:true }));
}
function sceneMD(it, has, els){
  const q = it.eq, fwd = it.dir === "fwd", valued = has("value"), turned = has("turn"), moved = has("move"), done = it.settled;
  const n = L.n, mul = q.op === "mul", xI = mul ? 1 : n, kI = mul ? n : 1, fsM = L.fsM;
  const pos = i => turned ? L.mirror(L.Pi(i)) : L.Pi(i);
  const topP = i => mul ? mulP(i) : divP(i, n), unitV = mul ? q.x : q.c;
  const bd = i => .1 + .28 * ((mul ? i - 1 : i) / Math.max(1, n));
  const fI = L.fsI * (!mul ? 1.15 : 1);
  const clearOfK = i => Math.abs(L.Pi(i) - L.Pi(kI)) > measureP(topP(kI), L.kSize) / 2 + measureP(topP(i), fI) / 2 + 6;
  for(let i = 0; i <= n; i++){
    const major = i === 0 || i === xI || i === kI;
    els.push(tick("p" + i, pos(i), major, 1, major ? 0 : bd(i)));
    if(i === 0) els.push(lab("l0", pos(0), true, [Np(0)], fsM, COL.ink, 1));
    else if(i === xI) els.push(lab("l" + i, pos(i), true, [V], fsM, COL.top, 1));
    else if(i === kI) els.push(lab("l" + i, pos(i), true, topP(i), L.kSize, COL.top, 1));
    else if(L.fsI && clearOfK(i)) els.push(lab("l" + i, pos(i), true, topP(i), fI, COL.topI, .9, bd(i)));
  }
  for(let i = 0; i < n; i++){ const a = pos(i), b = pos(i + 1); els.push(loop("g" + i, Math.min(a, b), Math.max(a, b), 1, bd(i + 1))); }
  const bo = fwd ? 1 : moved ? 0 : valued ? .22 : 1;
  els.push(arrow("ab", pos(xI), pos(kI), -1, COL.build, bo, .25), pill("pb", (pos(xI) + pos(kI)) / 2, true, buildOp(q), COL.build, COL.buildBg, bo, .3));
  if(!valued) return;
  const ansI = fwd ? kI : xI, knI = fwd ? xI : kI, kv = fwd ? q.x : q.c, av = fwd ? q.c : q.x;
  const wrong = q.turn && !turned && !fwd;
  els.push(lab("b0", pos(0), false, [Np(0)], fsM, COL.ink, 1, .05));
  els.push(lab("bk", pos(knI), false, [Np(kv)], L.bSize, wrong ? COL.bad : COL.bot, 1, .06));
  if(!done) els.push(lab("bq", pos(ansI), false, [{ t:"?" }], L.bSize * 1.1, COL.q, 1, .06));
  if(moved){
    const col = fwd ? COL.build : COL.undo, bg = fwd ? COL.buildBg : COL.undoBg, op = fwd ? buildOp(q) : undoOp(q);
    const pt = it.hidePill && !done ? "?" : op;
    if(!fwd){ els.push(arrow("as", pos(kI), pos(xI), -1, COL.undo, 1, .08), pill("ps", (pos(kI) + pos(xI)) / 2, true, pt, COL.undo, COL.undoBg, 1, .12)); }
    els.push(arrow("az", pos(knI), pos(ansI), 1, col, 1, .08), pill("pz", (pos(knI) + pos(ansI)) / 2, false, pt, col, bg, 1, .12));
    if(showCount(it) && L.fsI){
      const mids = []; for(let i = 2; i < n; i++) mids.push(i);
      if((mul && !fwd) || (!mul && fwd)) mids.reverse();
      const clearB = i => [[ansI, measureP([Np(av)], L.bSize) + L.bSize * .5], [knI, measureP([Np(kv)], L.bSize)]]
        .every(([m, w]) => Math.abs(L.Pi(i) - L.Pi(m)) > w / 2 + measureP([Np(i * unitV)], L.fsI) / 2 + 6);
      mids.forEach((i, j) => { if(clearB(i)) els.push(lab("bb" + i, pos(i), false, [Np(i * unitV)], L.fsI, COL.botI, .9, .1 + .26 * j / Math.max(1, mids.length))); });
    }
  }
  if(done) els.push(lab("ba", pos(ansI), false, [Np(av)], L.bSize, COL.bot, 1, .3, { bg:true }));
}
/* drawing (the teaching tool's) */
const easeC = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => v.toFixed(1);
function labSVG(e){
  let bg = "";
  if(e.bg){ const w = measureP(e.p, e.size) + e.size * .5, h = e.size * 1.18;
    bg = `<rect x="${f1(e.x - w / 2)}" y="${f1(e.y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(e.size * .22)}" fill="#fef9c3" stroke="#fde047" stroke-width="1.5"/>`; }
  if(isFrac(e.p)){
    const s = e.size, fr = e.p[0].fr, w = Math.max(measureP(fr[0], s), measureP(fr[1], s)) + s * .24;
    return `<g opacity="${e.o.toFixed(3)}" fill="${e.col}">${bg}<text x="${f1(e.x)}" y="${f1(e.y - s * .55)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(s)}">${svgIn(fr[0])}</text>`
      + `<line x1="${f1(e.x - w / 2)}" x2="${f1(e.x + w / 2)}" y1="${f1(e.y)}" y2="${f1(e.y)}" stroke="${e.col}" stroke-width="${f1(Math.max(1.5, s * .07))}" stroke-linecap="round"/>`
      + `<text x="${f1(e.x)}" y="${f1(e.y + s * .6)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(s)}">${svgIn(fr[1])}</text></g>`;
  }
  return `<g opacity="${e.o.toFixed(3)}">${bg}<text x="${f1(e.x)}" y="${f1(e.y)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(e.size)}" fill="${e.col}">${svgIn(e.p)}</text></g>`;
}
function drawEls(list){
  const out = [];
  list.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(e => {
    if(e.o <= .004) return;
    const op = e.o.toFixed(3);
    if(e.type === "axis") out.push(`<line x1="${f1(e.x1)}" x2="${f1(e.x2)}" y1="${f1(e.y)}" y2="${f1(e.y)}" stroke="${COL.line}" stroke-width="${f1(Math.max(3, L.fsM * .085))}" stroke-linecap="round" opacity="${op}"/>`);
    else if(e.type === "tick") out.push(`<line x1="${f1(e.x)}" x2="${f1(e.x)}" y1="${f1(e.y - e.h)}" y2="${f1(e.y + e.h)}" stroke="${e.col}" stroke-width="${f1(e.w)}" stroke-linecap="round" opacity="${op}"/>`);
    else if(e.type === "lab") out.push(labSVG(e));
    else if(e.type === "loop"){
      const ins = Math.min(5, (e.x2 - e.x1) * .08), a = e.x1 + ins, b = e.x2 - ins, rx = Math.max(4, (b - a) / 2);
      out.push(`<path d="M${f1(a)} ${f1(e.y - 3)}A${f1(rx)} ${f1(e.ry)} 0 0 1 ${f1(b)} ${f1(e.y - 3)}M${f1(b)} ${f1(e.y + 3)}A${f1(rx)} ${f1(e.ry)} 0 0 1 ${f1(a)} ${f1(e.y + 3)}" fill="rgba(148,163,184,.08)" stroke="${COL.soft}" stroke-width="${f1(Math.max(1.5, L.fsM * .045))}" stroke-dasharray="7 6" opacity="${op}"/>`);
    } else if(e.type === "hop"){
      const mx = (e.x1 + e.x2) / 2, cy = e.y + e.side * e.h;
      const ang = Math.atan2(e.y - cy, e.x2 - mx), s = e.w * (e.big ? 3.4 : 2.6);
      const bx = e.x2 - Math.cos(ang) * s, by = e.y - Math.sin(ang) * s, wx = -Math.sin(ang) * s * .55, wy = Math.cos(ang) * s * .55;
      out.push(`<g opacity="${op}"><path d="M${f1(e.x1)} ${f1(e.y)}Q${f1(mx)} ${f1(cy)} ${f1(e.x2)} ${f1(e.y)}" fill="none" stroke="${e.col}" stroke-width="${f1(e.w)}" stroke-linecap="round"/>`
        + `<polygon points="${f1(e.x2)},${f1(e.y)} ${f1(bx + wx)},${f1(by + wy)} ${f1(bx - wx)},${f1(by - wy)}" fill="${e.col}"/></g>`);
    } else if(e.type === "pill"){
      const fs = L.fsS * .95, w = tw(e.text, fs, UI, 900) + fs * 1.1, h = fs * 1.55;
      out.push(`<g opacity="${op}"><rect x="${f1(e.x - w / 2)}" y="${f1(e.y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${e.bg}" stroke="${e.col}" stroke-width="1.8"/>`
        + `<text x="${f1(e.x)}" y="${f1(e.y)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(fs)}" fill="${e.col}" style='font-family:${UI};font-weight:900'>${esc(e.text)}</text></g>`);
    }
  });
  svg.innerHTML = out.join("");
}
function mix(A, B, T){
  const out = [], mapA = new Map(A.map(e => [e.key, e])), span = .58;
  B.forEach(b => {
    const a = mapA.get(b.key); mapA.delete(b.key);
    const d = Math.min(.42, b.d || 0), t = easeC(clamp((T - d) / span, 0, 1));
    if(!a){ out.push(Object.assign({}, b, { o:b.o * t })); return; }
    const e = Object.assign({}, t < .5 ? a : b);
    ["x", "y", "x1", "x2", "h", "size"].forEach(p => { if(typeof a[p] === "number" && typeof b[p] === "number") e[p] = lerp(a[p], b[p], t); });
    e.o = lerp(a.o, b.o, t);
    out.push(e);
  });
  mapA.forEach(a => { const t = easeC(clamp(T / span, 0, 1)); out.push(Object.assign({}, a, { o:a.o * (1 - t) })); });
  return out;
}
function drawModel(){
  const it = cur(); if(!it || !it.model){ svg.innerHTML = ""; return; }
  QV = it.eq.v;
  layoutModel(it);
  const ids = mSteps(it).map(s => s.id);
  if(ANIM){
    const T = clamp((performance.now() - ANIM.t0) / ANIM.dur, 0, 1);
    if(ANIM.flip){
      const e = easeC(T), first = e < .5;
      drawEls(sceneOf(it, first ? ANIM.from : ANIM.to));
      const deg = first ? e * 180 : (e - 1) * 180, edge = Math.abs(Math.sin(e * Math.PI));
      svg.style.transform = `perspective(1400px) rotateY(${deg.toFixed(2)}deg) scale(${(1 - edge * .04).toFixed(3)})`;
    } else drawEls(mix(sceneOf(it, ANIM.from), sceneOf(it, ANIM.to), T));
    if(T < 1){ raf = requestAnimationFrame(drawModel); return; }
    ANIM = null; paintBoardHead();
  }
  svg.style.transform = "";
  drawEls(sceneOf(it, ids[it.mStep]));
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); ANIM = null; } svg.style.transform = ""; }
function goModel(k){
  const it = cur(); if(!it || !it.model) return;
  const ids = mSteps(it).map(s => s.id);
  k = clamp(k, 0, ids.length - 1); if(k === it.mStep) return;
  const from = ids[it.mStep];
  stopAnim(); it.mStep = k;
  if(!reduceMotion && Math.abs(ids.indexOf(from) - k) === 1){
    const flip = from === "turn" || ids[k] === "turn" ? (ids.indexOf(from) < k ? ids[k] === "turn" : from === "turn") : false;
    ANIM = { from, to:ids[k], t0:performance.now(), dur:flip ? 1400 : ids[k] === "move" || from === "move" ? 1700 : 900, flip };
  }
  paintBoardHead(); drawModel();
}
function paintBoardHead(){
  const it = cur(), box = $("stepBox");
  if(!it || !it.model){ box.hidden = true; return; }
  const st = mSteps(it);
  box.hidden = false;
  $("viewTag").textContent = "Double number line";
  $("stepCap").innerHTML = `<b>${it.mStep + 1}/${st.length}</b>${st[it.mStep].t}`;
  $("mBack").disabled = it.mStep === 0;
  $("mNext").disabled = it.mStep >= st.length - 1;
}
$("mNext").addEventListener("click", () => { const it = cur(); if(it) goModel(it.mStep + 1); });
$("mBack").addEventListener("click", () => { const it = cur(); if(it) goModel(it.mStep - 1); });

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
const CAT_NAMES = { add:"Solve: + equations", sub:"Solve: − equations", mul:"Solve: × equations", div:"Solve: ÷ equations",
  pair:"Read the double number line", undo:"Which move undoes it?", check:"Check by substituting", mistake:"Spot the mistake",
  write:"Write the equation", word:"Word problems" };
const CATS = ["pair","undo","add","sub","mul","div","check","mistake","write","word"];
function isPartial(){ return !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial()); }
function scores(){
  const counted = isPartial() ? S.items.filter(x => x.settled) : S.items;
  const score = counted.filter(x => x.correct).length;
  const total = isPartial() && window.MMTSubmit.total ? window.MMTSubmit.total() : S.items.length;
  const cats = {}; let neg = [0, 0];
  counted.forEach(it => it.steps.forEach(s => { const c = s.cat; cats[c] = cats[c] || [0, 0]; cats[c][1]++; if(s.first === true) cats[c][0]++;
    if(it.eq && (it.eq.x < 0 || it.eq.c < 0)){ neg[1]++; if(s.first === true) neg[0]++; } }));
  return { score, total, counted:counted.length, cats, neg };
}
function renderCert(){
  const s = scores(), L0 = lv();
  const pct = s.total ? Math.round(s.score / s.total * 100) : 0;
  $("certScore").textContent = `${s.score} / ${s.total}`;
  $("certLine").innerHTML = `${CFG.title} &middot; ${L0.name} &middot; ${pct}%`;   // .certSub belongs to the sign-in script
  $("certBreak").innerHTML = CATS.filter(c => s.cats[c]).map(c => `${CAT_NAMES[c]}: ${s.cats[c][0]} / ${s.cats[c][1]}`).join("<br>")
    + (s.neg[1] ? `<br>With negative numbers: ${s.neg[0]} / ${s.neg[1]}` : "");
  return { s, pct };
}
function finish(){
  stopAnim();
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.settled = true; it.correct = false; it.steps.forEach(s => { if(s.first === null) s.first = false; }); } });
  const { s, pct } = renderCert(), L0 = lv();
  $("progressFill").style.width = "100%";
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts. Skills in the object shape, so
     "where marks were lost" gets its labels with no SKILL_LABELS edit. */
  const types = CATS.filter(c => s.cats[c]).map(c => ({ typeId:"dnl-" + c, label:CAT_NAMES[c], correct:s.cats[c][0], total:s.cats[c][1] }));
  if(s.neg[1]) types.push({ typeId:"dnl-negatives", label:"With negative numbers", correct:s.neg[0], total:s.neg[1] });
  types.push("level:" + S.levelKey, "scope:" + CFG.scope);
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
  /* every model opens on the whole equation drawn ("What it equals"); Back shows how the top line was built */
  S.items.forEach(it => { if(it.model) it.mStep = 1; });
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
if(MATH_ALPHA) document.querySelectorAll(".modal i, .mmtTopTitle i").forEach(el => { el.outerHTML = `<span class="mi">${mathItalic(el.textContent)}</span>`; });

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
window.__DNQ__ = { CFG, S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, mSteps, goModel, sceneOf, genOne, eqFor, evalE, MATH_ALPHA,
  get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
