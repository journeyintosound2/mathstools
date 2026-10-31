/* =====================================================================
   AREA MODEL — STUDENT QUIZZES (one engine, two pages)
   ---------------------------------------------------------------------
   area-model.html               window.AMQ.focus = "area"  (multiplication)
   perimeter-area-rectangle.html window.AMQ.focus = "both"  (area + perimeter)

   The right-hand panel is the teaching tool's area model, live: on the
   questions that say so, students split the sides themselves (click the
   ruler, drag a split, drag it off the end to remove it) and the pieces
   they make become the multiplications they answer.

   The ladder is WHAT STUDENTS DO, not just bigger numbers:
     Sweet  the splits are drawn — find each piece, then add them
     Mild   split it yourself, any way you like
     Medium bigger numbers, work backwards from the products, spot a mistake
     Spicy  the biggest numbers with a free model, cut-out shapes, reasoning
   The Area & Perimeter page mixes perimeter questions into every level:
   tens and ones, double the half, make a ten, cut-out shapes.

   Marking (as Counting Strategies): only the FIRST check of each part
   scores; a question is right when every part is right first time; an
   empty box uses nothing up; Next settles an unfinished question as wrong.
   Nothing typed is ever saved — only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = Object.assign({ focus:"area", toolId:"area-model-quiz", tool:"area-model-student-quiz", title:"Area Model", mastery:"area-model" }, window.AMQ || {});
const BOTH = CFG.focus === "both";
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = n => n >= 10000 ? n.toLocaleString("en-AU") : String(n);
const plus = a => a.map(fmt).join(" + ");
const sum = a => a.reduce((x, y) => x + y, 0);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const X = "×";
const eqWH = (W, H) => `<span class="eq"><span class="cx">${fmt(W)}</span> ${X} <span class="cy">${fmt(H)}</span></span>`;
const eqS = s => `<span class="eq">${s}</span>`;

/* ---------------------------------------------------------- numbers */
function digitsOK(n){ const o = n % 10, t = Math.floor(n / 10) % 10; return o >= 2 && (n < 100 || t >= 1); }
function pickNum(lo, hi){ for(let i = 0; i < 400; i++){ const n = R(lo, hi); if(digitsOK(n)) return n; } return R(lo, hi); }
function pair(a, b){ return a >= b ? [a, b] : [b, a]; }
const SIZES = {
  t1:() => [pickNum(12, 19), R(3, 9)],
  "21":() => [pickNum(21, 98), R(3, 9)],
  tt:() => pair(pickNum(12, 19), pickNum(12, 19)),
  "22":() => pair(pickNum(21, 79), pickNum(12, 39)),
  "31":() => [pickNum(112, 489), R(3, 9)],
  "32":() => [pickNum(112, 389), pickNum(12, 39)]
};
let USED = new Set();
function dims(size, test){
  for(let a = 0; a < 500; a++){
    const [W, H] = SIZES[size]();
    if(W === H) continue;
    const key = W + "x" + H;
    if(USED.has(key) && a < 400) continue;
    if(test && !test(W, H)) continue;
    USED.add(key);
    return [W, H];
  }
  throw new Error("no dims for " + size);
}
function pv(n){
  const out = []; let mult = 1, m = n;
  while(m > 0){ const d = m % 10; if(d) out.unshift(d * mult); m = Math.floor(m / 10); mult *= 10; }
  return out.length ? out : [n];
}
/* a split a class would suggest that is not the place-value one (two parts) */
function alt2(n){
  const c = [];
  if(n % 2 === 0) c.push([n / 2, n / 2]);
  if(n > 15 && n < 30) c.push([15, n - 15]);
  if(n > 25 && n < 50) c.push([25, n - 25]);
  if(n > 50 && n < 100) c.push([50, n - 50]);
  if(n > 10) c.push([n - 10 - (n % 10 ? 0 : 5), 10 + (n % 10 ? 0 : 5)].reverse());
  if(n >= 100) c.push([Math.floor(n / 100) * 100 - 50, n - Math.floor(n / 100) * 100 + 50]);
  c.push([Math.ceil(n / 2), Math.floor(n / 2)]);
  const ok = c.filter(p => p.length === 2 && p[0] > 0 && p[1] > 0 && sum(p) === n && p.join() !== pv(n).join());
  return pick(ok);
}
const cutsOf = parts => { const c = []; let r = 0; for(let i = 0; i < parts.length - 1; i++){ r += parts[i]; c.push(r); } return c; };
const partsOf = (tot, cuts) => { const p = []; let prev = 0; cuts.forEach(c => { p.push(c - prev); prev = c; }); p.push(tot - prev); return p; };

/* ---------------------------------------------------------- geometry (the teaching tool's) */
function pieces(it){
  const X0 = [0], Y0 = [0];
  it.px.forEach(v => X0.push(X0[X0.length - 1] + v));
  it.py.forEach(v => Y0.push(Y0[Y0.length - 1] + v));
  const list = [];
  for(let j = 0; j < it.py.length; j++) for(let i = 0; i < it.px.length; i++){
    const key = i + "," + j;
    list.push({ i, j, key, w:it.px[i], h:it.py[j], x0:X0[i], y0:Y0[j], gk:X0[i] + ":" + Y0[j] + ":" + it.px[i] + "x" + it.py[j], removed:!!(it.removed && it.removed.has(key)) });
  }
  return { list, X:X0, Y:Y0 };
}
const livePieces = it => pieces(it).list.filter(p => !p.removed);
function boundary(it){
  const P = pieces(it), nx = it.px.length, ny = it.py.length;
  const live = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && !(it.removed && it.removed.has(i + "," + j));
  const segs = [];
  for(let k = 0; k <= ny; k++) for(let i = 0; i < nx; i++){
    const up = live(i, k - 1), dn = live(i, k); if(up === dn) continue;
    const y = P.Y[k], a = P.X[i], b = P.X[i + 1];
    segs.push(dn ? { x1:a, y1:y, x2:b, y2:y, dir:"E" } : { x1:b, y1:y, x2:a, y2:y, dir:"W" });
  }
  for(let k = 0; k <= nx; k++) for(let j = 0; j < ny; j++){
    const lf = live(k - 1, j), rt = live(k, j); if(lf === rt) continue;
    const x = P.X[k], a = P.Y[j], b = P.Y[j + 1];
    segs.push(lf ? { x1:x, y1:a, x2:x, y2:b, dir:"S" } : { x1:x, y1:b, x2:x, y2:a, dir:"N" });
  }
  segs.forEach(s => { s.len = Math.abs(s.x2 - s.x1) + Math.abs(s.y2 - s.y1); });
  const by = new Map(); segs.forEach(s => by.set(s.x1 + "," + s.y1, s));
  const start = segs.filter(s => s.dir === "E").sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1)[0];
  const loop = []; let cur = start, g = 0;
  while(cur && g++ < segs.length + 2){ loop.push(cur); cur = by.get(cur.x2 + "," + cur.y2); if(cur === start) break; }
  return { segs:loop, total:sum(loop.map(s => s.len)) };
}
function removalOK(it){
  const nx = it.px.length, ny = it.py.length, rm = it.removed;
  const live = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && !rm.has(i + "," + j);
  const all = []; for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++) if(live(i, j)) all.push([i, j]);
  if(!all.length) return false;
  const seen = new Set([all[0].join()]), st = [all[0]];
  while(st.length){ const [i, j] = st.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (i + a) + "," + (j + b); if(live(i + a, j + b) && !seen.has(k)){ seen.add(k); st.push([i + a, j + b]); } }); }
  if(seen.size !== all.length) return false;
  const out = new Set(), s2 = [];
  rm.forEach(k => { const [i, j] = k.split(",").map(Number); if(i === 0 || j === 0 || i === nx - 1 || j === ny - 1){ out.add(k); s2.push([i, j]); } });
  while(s2.length){ const [i, j] = s2.pop(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b]) => { const k = (i + a) + "," + (j + b); if(rm.has(k) && !out.has(k)){ out.add(k); s2.push([i + a, j + b]); } }); }
  return out.size === rm.size;
}
const areaOf = it => sum(livePieces(it).map(p => p.w * p.h));
function pvRows(segs){
  const rows = [{ name:"Hundreds", v:[] }, { name:"Tens", v:[] }, { name:"Ones", v:[] }];
  segs.forEach(s => { const h = Math.floor(s.len / 100) * 100, t = Math.floor(s.len % 100 / 10) * 10, o = s.len % 10; if(h) rows[0].v.push(h); if(t) rows[1].v.push(t); if(o) rows[2].v.push(o); });
  return rows.filter(r => r.v.length).map(r => Object.assign(r, { total:sum(r.v) }));
}

/* ---------------------------------------------------------- building questions */
function base(level, W, H, o){
  return Object.assign({ level, W, H, px:[W], py:[H], removed:new Set(), explore:false, locked:false,
    missX:new Set(), missY:new Set(), given:new Map(), hideOverall:false, settled:false, correct:false, note:"" }, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:t === "num" ? [] : {}, marks:null, fixText:null, sel:null, view:"area" }, o || {}); }
const totalStep = (W, H, o) => step("num", Object.assign({ cat:"area", title:"Put the pieces together",
  fields:[{ lab:`${eqWH(W, H)} =`, ans:W * H }], why:() => "" }, o || {}));

/* A — find each piece (splits drawn), then add */
function qPieces(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { px:pv(W), py:pv(H) });
  it.q = `Find the area of each piece, then add them to work out ${eqWH(W, H)}.`;
  it.sub = "The splits are drawn for you. Each piece is its width times its height.";
  it.steps = [ step("prods", { cat:"pieces", title:"The area of each piece" }), totalStep(W, H, { why:() => `${plus(livePieces(it).map(p => p.w * p.h))} = ${fmt(W * H)}` }) ];
  return it;
}
/* B — split it yourself */
function qOwn(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { explore:true });
  it.q = `Split the rectangle into parts that are easy to multiply. Then work out ${eqWH(W, H)}.`;
  it.sub = "Use the area model: click the ruler along the top or the left to split a side. Any split works.";
  it.steps = [ step("prods", { cat:"pieces", own:true, title:"Your pieces" }), totalStep(W, H, { why:() => `${plus(livePieces(it).map(p => p.w * p.h))} = ${fmt(W * H)}` }) ];
  return it;
}
/* just the answer, with the model free to explore */
function qTotal(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { explore:true });
  it.q = `Work out ${eqWH(W, H)}.`;
  it.sub = "Split the area model any way that helps, and work out each piece.";
  it.steps = [ totalStep(W, H, { title:"The answer", why:() => { const a = pv(W), b = pv(H); const P = []; b.forEach(y => a.forEach(x => P.push(x * y))); return `For example, by place value: ${plus(P)} = ${fmt(W * H)}`; } }) ];
  return it;
}
/* C — missing numbers: the products are known, the sides are not */
function qMissing(level, size, hard){
  const [W, H] = dims(size, (W, H) => pv(W).length > 1 && (!hard || pv(H).length > 1));
  const it = base(level, W, H, { px:pv(W), py:pv(H), hideOverall:true });
  const P = livePieces(it);
  const fields = [];
  if(hard){
    const mi = it.px.length - 1, mj = it.py.length - 1;
    it.missX.add(mi); it.missY.add(mj);
    P.forEach(p => { if(!(p.i === mi && p.j === mj)) it.given.set(p.gk, p.w * p.h); });
    fields.push({ lab:"The missing width (top)", ans:it.px[mi], side:{ axis:"x", idx:mi } });
    fields.push({ lab:"The missing height (left)", ans:it.py[mj], side:{ axis:"y", idx:mj } });
    const empty = P.find(p => p.i === mi && p.j === mj);
    fields.push({ lab:"The empty piece", ans:empty.w * empty.h, piece:empty.gk });
    it.q = "Some side lengths are missing. Use the products to find them, and the empty piece.";
  } else {
    it.py.forEach((v, j) => { it.missY.add(j); fields.push({ lab:it.py.length > 1 ? (j === 0 ? "The top height" : "The bottom height") : "The missing height", ans:v, side:{ axis:"y", idx:j } }); });
    P.forEach(p => it.given.set(p.gk, p.w * p.h));
    it.q = "The products are written in the pieces. Find the missing heights down the left.";
  }
  it.sub = "Each product is width times height, so divide a product by the side you know.";
  it.steps = [
    step("num", { cat:"backwards", title:"The missing numbers", fields,
      why:() => fields.map(f => `${f.lab.toLowerCase()} is ${fmt(f.ans)}`).join(", ") }),
    step("num", { cat:"area", title:"Now the whole multiplication", inline:true,
      fields:[{ ans:W, lab:"width" }, { ans:H, lab:"height" }, { ans:W * H, lab:"product" }],
      why:() => `${eqWH(W, H)} = ${plus(livePieces(it).map(p => p.w * p.h))} = ${fmt(W * H)}` })
  ];
  return it;
}
/* D — spot the mistake */
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
function qMistake(level, size){
  const [W, H] = dims(size, (W, H) => pv(W).length > 1 && pv(H).length > 1);
  const it = base(level, W, H, { px:pv(W), py:pv(H) });
  const P = livePieces(it), name = pick(NAMES);
  let used, missingTxt;
  if(P.length === 4 && Math.random() < .65){
    used = P.filter(p => p.i === p.j);                     // the classic: tens × tens, ones × ones
  } else {
    const drop = pick(P); used = P.filter(p => p !== drop);
  }
  const missing = P.filter(p => !used.includes(p));
  const pw = p => `${fmt(p.w)} ${X} ${fmt(p.h)}`;
  missingTxt = missing.length === 1 ? `the piece ${eqS(pw(missing[0]))}` : `the pieces ${missing.map(p => eqS(pw(p))).join(" and ")}`;
  const usedTot = sum(used.map(p => p.w * p.h));
  it.q = `${name} worked out ${eqWH(W, H)} like this:`;
  it.working = `${used.map(pw).join(" + ")} = ${plus(used.map(p => p.w * p.h))} = ${fmt(usedTot)}`;
  it.sub = `Compare ${name}’s working with the pieces of the area model.`;
  const wrongPiece = pick(used);
  const opts = shuffle([
    { h:`${name} left out ${missingTxt}.`, ok:true },
    { h:`${name} left out the piece ${eqS(pw(wrongPiece))}.`, ok:false },
    { h:`Nothing — ${fmt(usedTot)} is right.`, ok:false },
    { h:`${name} should add ${fmt(W)} + ${fmt(H)} on as well.`, ok:false }
  ]);
  it.steps = [
    step("mc", { cat:"reasoning", title:`What went wrong?`, opts,
      why:() => `The area model has ${P.length} pieces, and every piece is part of ${eqWH(W, H)}. ${name} only used ${used.length} of them.` }),
    totalStep(W, H, { title:"What is the right answer?", why:() => `${plus(P.map(p => p.w * p.h))} = ${fmt(W * H)}` })
  ];
  return it;
}
/* E — which of these is NOT equal (the model is free to test each one) */
function qNotEqual(level, size){
  const [W, H] = dims(size, (W, H) => pv(W).length === 2 && pv(H).length === 2);
  const it = base(level, W, H, { explore:true });
  const [a1, a2] = pv(W), [b1, b2] = pv(H), [c1, c2] = alt2(W);
  const t = (s) => eqS(s);
  const opts = shuffle([
    { h:t(`${a1} ${X} ${b1} + ${a2} ${X} ${b1} + ${a1} ${X} ${b2} + ${a2} ${X} ${b2}`), ok:false },
    { h:t(`${c1} ${X} ${H} + ${c2} ${X} ${H}`), ok:false },
    { h:t(`${W} ${X} ${b1} + ${W} ${X} ${b2}`), ok:false },
    { h:t(`${a1} ${X} ${b1} + ${a2} ${X} ${b2}`), ok:true }
  ]);
  it.q = `Three of these work out ${eqWH(W, H)}. Which one does NOT?`;
  it.sub = "Try each split on the area model if it helps.";
  it.steps = [ step("mc", { cat:"reasoning", title:"Which one is NOT equal?", opts,
    why:() => `${eqS(`${a1} ${X} ${b1} + ${a2} ${X} ${b2}`)} only uses two of the four pieces — it leaves out ${eqS(`${a2} ${X} ${b1}`)} and ${eqS(`${a1} ${X} ${b2}`)}.` }) ];
  return it;
}
/* F — cut-out shapes */
function qCut(level, size, notch){
  for(let a = 0; a < 80; a++){
    const [W, H] = dims(size, (W, H) => W >= 10 && (!notch || pv(W).length >= 3));
    const px = pv(W).length > 1 ? pv(W) : alt2(W), py = pv(H).length > 1 ? pv(H) : alt2(H);
    if(!px || !py || px.length < 2 || py.length < 2) continue;
    const it = base(level, W, H, { px, py });
    const nx = px.length, ny = py.length;
    /* a corner, but never the biggest piece (that leaves a thin frame, not a cut-out) */
    const cell = notch ? [R(1, nx - 2), pick([0, ny - 1])] : pick([[nx - 1, 0], [nx - 1, ny - 1], [0, ny - 1]]);
    it.removed = new Set([cell.join()]);
    if(!removalOK(it)) continue;
    const gone = pieces(it).list.filter(p => p.removed)[0];
    const A = areaOf(it), B = boundary(it), whole = 2 * (W + H);
    it.q = `A piece has been cut out of a ${fmt(W)} by ${fmt(H)} rectangle.`;
    const areaWhy = () => `${fmt(W * H)} − ${fmt(gone.w * gone.h)} = ${fmt(A)} (the whole rectangle take away the cut-out piece), or add the pieces that are left: ${plus(livePieces(it).map(p => p.w * p.h))}.`;
    if(!BOTH){
      it.sub = "Find the area of the whole rectangle, then the area of the shape that is left.";
      it.steps = [
        totalStep(W, H, { title:"The whole rectangle", why:() => `${plus(pieces(it).list.map(p => p.w * p.h))} = ${fmt(W * H)}` }),
        step("num", { cat:"composite", title:"The shape that is left", fields:[{ lab:"Area of the shape =", ans:A }], why:areaWhy })
      ];
    } else {
      it.sub = "Find its area and its perimeter, then compare with the whole rectangle.";
      const same = B.total === whole, longer = B.total > whole;
      it.steps = [
        step("num", { cat:"composite", title:"Area of the shape", fields:[{ lab:"Area =", ans:A }], why:areaWhy }),
        step("num", { cat:"perimeter", view:"perim", title:"Perimeter of the shape", fields:[{ lab:"Perimeter =", ans:B.total }],
          why:() => `${plus(B.segs.map(s => s.len))} = ${fmt(B.total)}` }),
        step("mc", { cat:"reasoning", view:"perim", title:`The whole rectangle’s perimeter is ${fmt(whole)}. The shape’s perimeter is…`,
          opts:[{ h:"the same", ok:same }, { h:"longer", ok:longer }, { h:"shorter", ok:!same && !longer }],
          why:() => same ? "The same: cutting out a corner moves two edges inwards without changing their lengths." : `Longer by ${fmt(B.total - whole)}: the notch adds its two inside edges.` })
      ];
    }
    return it;
  }
  throw new Error("no cut shape");
}
/* G — perimeter: tens and ones */
function qPerimPV(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { px:pv(W), py:pv(H) });
  const B = boundary(it), rows = pvRows(B.segs);
  it.q = `Find the perimeter of this ${fmt(W)} by ${fmt(H)} rectangle.`;
  it.sub = "The splits break every edge into tens and ones. Add all the tens, then all the ones.";
  const fields = rows.map(r => ({ lab:`All the ${r.name.toLowerCase()} =`, ans:r.total }));
  fields.push({ lab:"Perimeter =", ans:B.total });
  it.steps = [ step("num", { cat:"perimeter", view:"perim", title:"Add the edges", fields,
    why:() => rows.map(r => `${r.name.toLowerCase()} ${plus(r.v)} = ${fmt(r.total)}`).join("; ") + `; together ${plus(rows.map(r => r.total))} = ${fmt(B.total)}` }) ];
  return it;
}
/* H — perimeter: double the half */
function qPerimHalf(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { px:pv(W), py:pv(H) });
  it.q = `Find the perimeter of this ${fmt(W)} by ${fmt(H)} rectangle.`;
  it.sub = "Opposite sides match, so add half way round (the top and the right side), then double it.";
  it.steps = [ step("num", { cat:"perimeter", view:"perim", title:"Half way round, then double", fields:[
      { lab:"Half way round =", ans:W + H }, { lab:"Perimeter =", ans:2 * (W + H) } ],
    why:() => `${plus(it.px.concat(it.py))} = ${fmt(W + H)}, and ${fmt(W + H)} + ${fmt(W + H)} = ${fmt(2 * (W + H))}` }) ];
  return it;
}
/* I — perimeter: make a ten (a non-standard split) */
function qMakeTen(level, size){
  const [W, H] = dims(size, (W, H) => { const a = W % 10; return a >= 2 && a <= 8 && H > 10 - a; });
  const p = 10 - W % 10;
  const it = base(level, W, H, { px:[W], py:[p, H - p] });
  it.q = `Find the perimeter of this ${fmt(W)} by ${fmt(H)} rectangle.`;
  it.sub = `The side of ${fmt(H)} is split into ${p} + ${fmt(H - p)}, so the ${p} makes a ten with the top.`;
  it.steps = [ step("num", { cat:"perimeter", view:"perim", title:"Make a ten, then add", fields:[
      { lab:`${eqS(`${fmt(W)} + ${p}`)} =`, ans:W + p }, { lab:"Perimeter =", ans:2 * (W + H) } ],
    why:() => `${fmt(W)} + ${p} = ${fmt(W + p)} twice is ${fmt(2 * (W + p))}, then ${fmt(H - p)} + ${fmt(H - p)} = ${fmt(2 * (H - p))}: ${fmt(2 * (W + p))} + ${fmt(2 * (H - p))} = ${fmt(2 * (W + H))}` }) ];
  return it;
}
/* J — area and perimeter of the same rectangle, free model */
function qAreaPerim(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { explore:true });
  it.q = `Find the area and the perimeter of a ${fmt(W)} by ${fmt(H)} rectangle.`;
  it.sub = "Split the area model any way that helps.";
  it.steps = [
    totalStep(W, H, { title:"The area", fields:[{ lab:`Area = ${eqWH(W, H)} =`, ans:W * H }],
      why:() => { const a = pv(W), b = pv(H), P = []; b.forEach(y => a.forEach(x => P.push(x * y))); return `For example: ${plus(P)} = ${fmt(W * H)}`; } }),
    step("num", { cat:"perimeter", view:"perim", title:"The perimeter", fields:[{ lab:"Perimeter =", ans:2 * (W + H) }],
      why:() => `${fmt(W)} + ${fmt(H)} + ${fmt(W)} + ${fmt(H)} = ${fmt(2 * (W + H))}` })
  ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:BOTH ? "The splits are drawn for you: find each piece and add them, and add the edges for the perimeter. Smaller rectangles with unit squares." : "The splits are drawn for you. Find the area of each piece, then add them up." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:BOTH ? "Split the rectangle yourself, any way you like. Perimeter by doubling the half and by making a ten." : "Split the rectangle yourself, any way you like, then multiply each piece and add. Spot a classic mistake." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:BOTH ? "Cut-out shapes (is the perimeter the same?), missing numbers, three-digit sides." : "Three-digit numbers, missing numbers from the products, and spotting mistakes." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:BOTH ? "Three-digit by two-digit, notched shapes, making a ten and reasoning." : "Three-digit by two-digit with a free model, cut-out shapes and reasoning about splits." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  let items;
  if(!BOTH){
    if(level === "sweet") items = [qPieces(level,"t1"), qPieces(level,"t1"), qPieces(level,"t1"), qPieces(level,"21"), qPieces(level,"21"), qPieces(level,"21"), qPieces(level,"tt"), qPieces(level,"tt"), qPieces(level,"tt"), qPieces(level,"22")];
    else if(level === "mild") items = [qOwn(level,"21"), qOwn(level,"21"), qOwn(level,"tt"), qOwn(level,"tt"), qOwn(level,"22"), qOwn(level,"22"), qMistake(level,"22"), qOwn(level,"22"), qPieces(level,"31"), qOwn(level,"22")];
    else if(level === "medium") items = [qOwn(level,"31"), qOwn(level,"31"), qMissing(level,"22"), qMissing(level,"22"), qTotal(level,"22"), qMistake(level,"22"), qOwn(level,"32"), qMissing(level,"tt", true), qOwn(level,"32"), qTotal(level,"31")];
    else items = [qTotal(level,"32"), qTotal(level,"32"), qCut(level,"22"), qNotEqual(level,"22"), qMissing(level,"32", true), qCut(level,"32"), qMistake(level,"32"), qTotal(level,"32"), qNotEqual(level,"22"), qCut(level,"31", true)];
  } else {
    if(level === "sweet") items = [qPieces(level,"t1"), qPerimPV(level,"t1"), qPieces(level,"t1"), qPerimPV(level,"tt"), qPieces(level,"tt"), qPerimHalf(level,"tt"), qAreaPerim(level,"t1"), qPerimPV(level,"tt"), qPieces(level,"tt"), qAreaPerim(level,"tt")];
    else if(level === "mild") items = [qOwn(level,"21"), qMakeTen(level,"21"), qOwn(level,"tt"), qPerimHalf(level,"22"), qOwn(level,"22"), qMakeTen(level,"22"), qPerimPV(level,"22"), qOwn(level,"22"), qAreaPerim(level,"22"), qMakeTen(level,"22")];
    else if(level === "medium") items = [qCut(level,"22"), qMissing(level,"22"), qPerimPV(level,"31"), qCut(level,"tt"), qOwn(level,"31"), qMistake(level,"22"), qCut(level,"31", true), qPerimHalf(level,"31"), qMakeTen(level,"22"), qAreaPerim(level,"22")];
    else items = [qAreaPerim(level,"32"), qCut(level,"32", true), qMakeTen(level,"31"), qMissing(level,"22", true), qNotEqual(level,"22"), qCut(level,"32"), qPerimPV(level,"32"), qMistake(level,"32"), qCut(level,"31", true), qAreaPerim(level,"32")];
  }
  return items;
}

/* =====================================================================
   MARKING
   ===================================================================== */
const num = s => { const t = String(s == null ? "" : s).replace(/[\s, ]/g, "").replace(/−/g, "-"); return /^-?\d+$/.test(t) ? Number(t) : NaN; };
const empty = s => String(s == null ? "" : s).trim() === "";
function markStep(it, s){
  if(s.t === "prods"){
    const P = livePieces(it);
    if(s.own && P.length < 2) return { invalid:"Split the rectangle on the area model first — click the ruler along the top or the left edge." };
    if(P.some(p => empty(s.vals[p.gk]))) return { invalid:"Fill in the area of every piece first." };
    const marks = {}; let ok = true; const wrong = [];
    P.forEach(p => { const r = num(s.vals[p.gk]) === p.w * p.h; marks[p.gk] = r; if(!r){ ok = false; wrong.push(p); } });
    return { ok, marks, fix:ok ? null : "Each piece is width " + X + " height: " + wrong.map(p => eqS(`${fmt(p.w)} ${X} ${fmt(p.h)} = ${fmt(p.w * p.h)}`)).join(", ") + "." };
  }
  if(s.t === "num"){
    if(s.fields.some((f, i) => empty(s.vals[i]))) return { invalid:"Fill in every box first." };
    const marks = s.fields.map((f, i) => num(s.vals[i]) === f.ans);
    const ok = marks.every(Boolean);
    return { ok, marks, fix:ok ? null : s.why() };
  }
  if(s.t === "mc"){
    if(s.sel == null) return { invalid:"Choose an answer first." };
    const ok = !!s.opts[s.sel].ok;
    return { ok, marks:s.opts.map((o, i) => i === s.sel ? ok : null), fix:ok ? null : s.why() };
  }
}

/* =====================================================================
   STATE + DRAWING THE QUESTION
   ===================================================================== */
const S = { levelKey:null, items:[], i:0, hl:null };
const cur = () => S.items[S.i];
const lv = () => LEVELS[S.levelKey];
const curStepIndex = it => { const k = it.steps.findIndex(s => s.first === null); return k < 0 ? it.steps.length - 1 : k; };
function setPrompt(msg, kind){
  const p = $("promptBar"); p.className = "promptBar" + (kind ? " " + kind : "");
  $("promptIco").textContent = kind === "good" ? "✅" : kind === "bad" ? "\u{1F50E}" : kind === "warn" ? "✋" : "\u{1F4AD}";
  $("promptText").innerHTML = msg;
}
const PAL = ["#dbeafe","#fef3c7","#dcfce7","#ffe4e6","#ede9fe","#ccfbf1","#ffedd5","#e0e7ff"];
const PALMID = ["#93c5fd","#fcd34d","#86efac","#fda4af","#c4b5fd","#5eead4","#fdba74","#a5b4fc"];
const INK = ["#1e40af","#92400e","#166534","#9f1239","#5b21b6","#115e59","#9a3412","#3730a3"];
function colourIndex(it){
  const m = new Map(); pieces(it).list.forEach(p => { const k = p.w + "x" + p.h; if(!m.has(k)) m.set(k, m.size); p.c = m.get(k); });
  return m;
}
function pieceColour(it, p){ const m = colourIndex(it); return m.get(p.w + "x" + p.h) % PAL.length; }

function stepBody(it, s, k){
  const locked = s.last;
  if(s.t === "prods"){
    const P = livePieces(it);
    if(s.own && P.length < 2 && s.first === null)
      return `<div class="waitNote">→ Split the rectangle on the area model: click the ruler along the top or the left edge (it snaps to whole numbers and to tens). Make parts that are easy to multiply. The pieces you make appear here.</div>`;
    return `<div class="prodGrid">` + P.map(p => {
      const ci = pieceColour(it, p), m = s.marks && s.marks[p.gk] !== undefined ? (s.marks[p.gk] ? " right" : " wrong") : "";
      const v = s.vals[p.gk] == null ? "" : s.vals[p.gk];
      return `<label class="prodRow" data-gk="${p.gk}"><span class="sw" style="background:${PALMID[ci]}"></span><span class="m"><span class="cx">${fmt(p.w)}</span> ${X} <span class="cy">${fmt(p.h)}</span> =</span>`
        + `<input class="cell${m}" data-k="${k}" data-gk="${p.gk}" inputmode="numeric" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="${p.w} times ${p.h}"></label>`;
    }).join("") + `</div>`;
  }
  if(s.t === "num"){
    const box = (f, i) => {
      const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
      const v = s.vals[i] == null ? "" : s.vals[i];
      return `<input class="cell${s.inline ? " sm" : ""}${m}" data-k="${k}" data-i="${i}" inputmode="numeric" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="${esc((f.lab || "").replace(/<[^>]+>/g, ""))}">`;
    };
    if(s.inline) return `<div class="fieldInline">${box(s.fields[0], 0)}<span>${X}</span>${box(s.fields[1], 1)}<span>=</span>${box(s.fields[2], 2)}</div>`;
    return `<div class="fieldRows">` + s.fields.map((f, i) => `<label class="fieldRow"><span class="lab">${f.lab}</span>${box(f, i)}</label>`).join("") + `</div>`;
  }
  if(s.t === "mc"){
    return `<div class="mcList">` + s.opts.map((o, i) => {
      const st = s.marks && s.marks[i] !== null && s.marks[i] !== undefined ? (s.marks[i] ? " right" : " wrong") : "";
      const show = s.last && o.ok ? " right" : "";
      return `<button class="mcOpt${s.sel === i ? " on" : ""}${st || show}" type="button" data-k="${k}" data-opt="${i}"${locked ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${o.h}</span></button>`;
    }).join("") + `</div>`;
  }
  return "";
}
/* a part that is right folds to one line, so the card stays short */
function doneLine(it, s){
  if(s.t === "prods") return livePieces(it).map(p => eqS(`${fmt(p.w)} ${X} ${fmt(p.h)} = ${esc(String(s.vals[p.gk]).trim())}`)).join(" &nbsp;&middot;&nbsp; ");
  if(s.t === "num"){
    const v = i => esc(String(s.vals[i] == null ? "" : s.vals[i]).trim());
    if(s.inline) return eqS(`${v(0)} ${X} ${v(1)} = ${v(2)}`);
    return s.fields.map((f, i) => `${f.lab} <b class="eq">${v(i)}</b>`).join(" &nbsp;&middot;&nbsp; ");
  }
  if(s.t === "mc") return s.opts[s.sel] ? s.opts[s.sel].h : "";
  return "";
}
function paint(){
  const it = cur(); if(!it) return;
  $("qCounter").textContent = `Question ${S.i + 1} / ${S.items.length}`;
  $("progressFill").style.width = (S.items.filter(x => x.settled).length / S.items.length * 100) + "%";
  const ck = curStepIndex(it);
  let h = `<div class="qText">${it.q}</div>`;
  if(it.working) h += `<div class="working">${it.working}</div>`;
  if(it.sub) h += `<div class="qSub">${it.sub}</div>`;
  it.steps.forEach((s, k) => {
    if(k > ck) return;                                  // the next part appears once this one is checked
    const st = s.first === null ? (k === ck ? " current" : "") : (s.last ? " ok" : " no");
    const mark = s.first === null ? "" : (s.first ? "✓ Right first time" : s.last ? "Fixed — well done" : "Not quite");
    const fold = s.last && (k < ck || it.settled);
    h += `<div class="part${st}${fold ? " folded" : ""}" data-step="${k}"><div class="stepHead"><span class="stepNum">${it.steps.length > 1 ? k + 1 : "✓"}</span><span class="stepTitle">${s.title}</span><span class="stepMark">${mark}</span></div>`;
    h += fold ? `<div class="doneLine">${doneLine(it, s)}</div>` : stepBody(it, s, k);
    if(s.first !== null && s.fixText && !s.last) h += `<div class="fix">${s.fixText}</div>`;
    h += (s.last ? "" : `<div class="checkRow"><button class="checkBtn" type="button" data-check="${k}">${s.first === null ? "Check" : "Check again"}</button></div>`) + `</div>`;
  });
  $("qCard").innerHTML = h;
  bindCard();
  drawBoard();                 /* sets the note under the board, which can wrap to two lines… */
  if(fitBoard()) drawBoard();  /* …so the board is sized after it, and redrawn if that moved it */
  keepInView();
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = S.i === S.items.length - 1 ? "Finish →" : "Next →";
  if(!it.settled){
    const s = it.steps[ck];
    if(s.t === "prods" && s.own && livePieces(it).length < 2) setPrompt("Split the rectangle on the area model, then fill in each piece.");
    else setPrompt("Answer, then press Check (or Enter).");
  } else setPrompt(it.correct ? "Well done — that one is finished." : "This one is marked. Look at the model, then move on.", it.correct ? "good" : "bad");
}
function bindCard(){
  const card = $("qCard"), it = cur();
  card.querySelectorAll("input[data-k]").forEach(inp => {
    const s = it.steps[+inp.dataset.k];
    inp.addEventListener("input", () => {
      if(inp.dataset.gk) s.vals[inp.dataset.gk] = inp.value; else s.vals[+inp.dataset.i] = inp.value;
      inp.classList.remove("right", "wrong");
      drawBoard();                                       // the board shows what is typed, as it is typed
    });
    inp.addEventListener("focus", () => { S.hl = inp.dataset.gk || null; drawBoard(); });
    inp.addEventListener("blur", () => { S.hl = null; drawBoard(); });
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      const peers = [...card.querySelectorAll(`input[data-k="${inp.dataset.k}"]`)].filter(x => !x.readOnly);
      const at = peers.indexOf(inp);
      const nextEmpty = peers.slice(at + 1).find(x => empty(x.value)) || peers.slice(0, at).find(x => empty(x.value));
      if(nextEmpty){ nextEmpty.focus(); nextEmpty.select(); return; }
      check(+inp.dataset.k);
    });
  });
  card.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
    const s = it.steps[+b.dataset.k]; s.sel = +b.dataset.opt;
    b.parentNode.querySelectorAll(".mcOpt").forEach(x => x.classList.toggle("on", x === b));
  }));
  card.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => check(+b.dataset.check)));
  card.querySelectorAll(".prodRow").forEach(r => {
    r.addEventListener("mouseenter", () => { S.hl = r.dataset.gk; drawBoard(); });
    r.addEventListener("mouseleave", () => { if(!r.contains(document.activeElement)){ S.hl = null; drawBoard(); } });
  });
}
function focusStep(k){
  const els = [...$("qCard").querySelectorAll(`.part[data-step="${k}"] input:not([readonly]), .part[data-step="${k}"] .mcOpt:not(:disabled)`)];
  const el = els.find(e => e.tagName !== "INPUT" || empty(e.value)) || els[0];
  if(el && !("ontouchstart" in window)) el.focus({ preventScroll:true });
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
    s.first = res.ok;                                    // ONLY the first check scores
    if(s.t === "prods" && s.own) it.locked = true;       // the pieces that were marked are the pieces that stay
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
    setPrompt(firstGo ? (k < it.steps.length - 1 ? "Not quite — see why, fix it if you like, and carry on." : "Not quite — see why, and fix it if you like.") : "Still not right — read the red box again.", "bad");
    if(k < it.steps.length - 1) focusStep(ck);
  } else if(!it.settled){
    setPrompt("Right! On to the next part.", "good");
    focusStep(ck);
  } else {
    setPrompt(it.correct ? "Right first time, every part!" : "Right now — well fixed.", it.correct ? "good" : "warn");
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
   THE AREA MODEL — the teaching tool's board, cut down to what a
   student needs. Live: typed products appear in their pieces; on the
   "split it yourself" questions the rulers are active.
   ===================================================================== */
const svg = $("board");
const editable = it => it.explore && !it.locked;
function viewOf(it){ const s = it.steps[it.settled ? it.steps.length - 1 : curStepIndex(it)]; return s.view || "area"; }
const M_FULL = { L:104, T:92, R:58, B:48 }, M_COMPACT = { L:70, T:64, R:46, B:42 };
function axisMap(tot, parts, start, len, open, minPx){
  if(!open) return { f:v => start + v * len / tot, inv:p => (p - start) * tot / len };
  const n = parts.length, mn = Math.min(minPx, len / n * .75), extra = len - n * mn;
  const vals = [0], pos = [start];
  parts.forEach(p => { vals.push(vals[vals.length - 1] + p); pos.push(pos[pos.length - 1] + mn + extra * p / tot); });
  const seg = (arr, x) => { let k = 0; while(k < arr.length - 2 && x > arr[k + 1]) k++; return k; };
  return { f:v => { const k = seg(vals, v); return pos[k] + (v - vals[k]) * (pos[k + 1] - pos[k]) / (vals[k + 1] - vals[k]); },
           inv:p => { const k = seg(pos, p); return vals[k] + (p - pos[k]) * (vals[k + 1] - vals[k]) / (pos[k + 1] - pos[k]); } };
}
function layout(it){
  const wrap = $("boardWrap");
  const w = Math.max(240, wrap.clientWidth), h = Math.max(220, wrap.clientHeight);
  const compact = w < 520, M = compact ? M_COMPACT : M_FULL;
  const aw = w - M.L - M.R, ah = h - M.T - M.B;
  let s = Math.min(aw / it.W, ah / it.H), sx = s, sy = s, open = false;
  if(Math.min(it.W, it.H) * s < Math.min(160, Math.min(aw, ah) * .42)) open = true;
  if(!open && Math.max(it.W, it.H) > 100){
    const thin = Math.min(...it.px.map(v => v * s), ...it.py.map(v => v * s));
    if(thin < 22) open = true;
  }
  if(open){ const asp = clamp(it.W / it.H, 1 / 2.2, 2.2); let rw = aw, rh = rw / asp; if(rh > ah){ rh = ah; rw = rh * asp; } sx = rw / it.W; sy = rh / it.H; }
  const rw = it.W * sx, rh = it.H * sy, left = M.L + (aw - rw) / 2, top = M.T + (ah - rh) / 2;
  const mx = axisMap(it.W, it.px, left, rw, open, 54), my = axisMap(it.H, it.py, top, rh, open, 46);
  return { w, h, sx, sy, rw, rh, left, top, open, compact, X:mx.f, Y:my.f, ix:mx.inv, iy:my.inv };
}
function el(tag, attrs, parent){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs || {}) if(attrs[k] != null) e.setAttribute(k, attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, fs, fill, extra){
  const t = el("text", Object.assign({ x, y, "font-size":fs, fill, "text-anchor":"middle", "dominant-baseline":"central" }, extra || {}), parent);
  t.textContent = s; return t;
}
const tw = (s, fs) => String(s).length * fs * .56;
function pill(parent, x, y, s, fs, o){
  o = o || {};
  const g = el("g", null, parent);
  const w = Math.max(fs * 1.5, tw(s, fs) + fs * .9), h = fs * 1.55;
  el("rect", { x:x - w / 2, y:y - h / 2, width:w, height:h, rx:h / 2, fill:o.bg || "#fff", stroke:o.stroke || "#e2e8f0", "stroke-width":o.sw || 1.5 }, g);
  txt(g, x, y + fs * .04, s, fs, o.color || "#0f172a");
  return g;
}
let L = null, DRAG = null, DRAGL = null;
function drawBoard(){
  const it = cur(); if(!it) return;
  L = (DRAG && DRAGL) ? DRAGL : layout(it);
  const area = viewOf(it) === "area", ed = editable(it);
  const P = pieces(it), cmap = colourIndex(it);
  const showGrid = !L.open && it.W <= 40 && it.H <= 40 && Math.min(L.sx, L.sy) >= 7;
  svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`);
  svg.setAttribute("class", ed ? "canEdit" : "");
  svg.innerHTML = "";
  $("scaleTag").hidden = !L.open;
  const X0 = L.X, Y0 = L.Y;
  const defs = el("defs", null, svg);
  const hatch = el("pattern", { id:"hatch", width:8, height:8, patternUnits:"userSpaceOnUse", patternTransform:"rotate(45)" }, defs);
  el("rect", { width:8, height:8, fill:"#fff" }, hatch);
  el("line", { x1:0, y1:0, x2:0, y2:8, stroke:"#fecdd3", "stroke-width":3 }, hatch);
  const gP = el("g", null, svg), gG = el("g", null, svg), gC = el("g", null, svg), gE = el("g", null, svg), gL = el("g", null, svg), gR = el("g", null, svg), gChip = el("g", null, svg);
  el("g", { id:"ghost" }, svg);
  const ps = it.steps.find(s => s.t === "prods");
  /* pieces */
  P.list.forEach(p => {
    const x = X0(p.x0), y = Y0(p.y0), pw = X0(p.x0 + p.w) - x, ph = Y0(p.y0 + p.h) - y;
    if(p.removed){ el("rect", { x:x + 1.5, y:y + 1.5, width:Math.max(0, pw - 3), height:Math.max(0, ph - 3), fill:"url(#hatch)", stroke:"#fb7185", "stroke-width":1.5, "stroke-dasharray":"6 5" }, gP); return; }
    const ci = cmap.get(p.w + "x" + p.h) % PAL.length;
    const has = it.given.has(p.gk) || (ps && !empty(ps.vals[p.gk])) || it.settled;
    el("rect", { x, y, width:pw, height:ph, fill:area ? (has ? PALMID[ci] : PAL[ci]) : "#f8fafc", class:"piece" + (S.hl === p.gk ? " hl" : ""), "data-gk":p.gk }, gP);
  });
  if(showGrid){
    let d = "";
    P.list.forEach(p => { if(p.removed) return;
      for(let u = p.x0 + 1; u < p.x0 + p.w; u++) d += `M${X0(u)} ${Y0(p.y0)}V${Y0(p.y0 + p.h)}`;
      for(let v = p.y0 + 1; v < p.y0 + p.h; v++) d += `M${X0(p.x0)} ${Y0(v)}H${X0(p.x0 + p.w)}`; });
    if(d) el("path", { d, stroke:area ? "rgba(15,23,42,.15)" : "rgba(15,23,42,.08)", "stroke-width":1, fill:"none", "shape-rendering":"crispEdges" }, gG);
  }
  /* splits inside the shape */
  const live = (i, j) => i >= 0 && j >= 0 && i < it.px.length && j < it.py.length && !it.removed.has(i + "," + j);
  let dc = "";
  for(let k = 1; k < it.px.length; k++) for(let j = 0; j < it.py.length; j++) if(live(k - 1, j) && live(k, j)) dc += `M${X0(P.X[k])} ${Y0(P.Y[j])}V${Y0(P.Y[j + 1])}`;
  for(let k = 1; k < it.py.length; k++) for(let i = 0; i < it.px.length; i++) if(live(i, k - 1) && live(i, k)) dc += `M${X0(P.X[i])} ${Y0(P.Y[k])}H${X0(P.X[i + 1])}`;
  if(dc) el("path", area ? { d:dc, stroke:"#1e293b", "stroke-width":3, fill:"none" } : { d:dc, stroke:"#cbd5e1", "stroke-width":2, fill:"none", "stroke-dasharray":"7 6" }, gC);
  /* outline */
  const B = boundary(it);
  if(B.segs.length){
    let d = `M${X0(B.segs[0].x1)} ${Y0(B.segs[0].y1)}`; B.segs.forEach(s => { d += `L${X0(s.x2)} ${Y0(s.y2)}`; });
    el("path", { d:d + "Z", fill:"none", stroke:area ? "#1e293b" : (it.settled ? "#7c3aed" : "#a78bfa"), "stroke-width":area ? 3 : 6, "stroke-linejoin":"round" }, gE);
  }
  /* inside the pieces: what is typed, given, or (once settled) the answer; else the multiplication */
  if(area) P.list.forEach(p => {
    if(p.removed) return;
    const x = X0(p.x0), y = Y0(p.y0), pw = X0(p.x0 + p.w) - x, ph = Y0(p.y0 + p.h) - y, cx = x + pw / 2, cy = y + ph / 2;
    const ci = cmap.get(p.w + "x" + p.h) % PAL.length;
    let val = null, col = INK[ci];
    if(it.given.has(p.gk)){ val = fmt(it.given.get(p.gk)); col = "#0f172a"; }
    else if(ps && !empty(ps.vals[p.gk])){
      val = ps.vals[p.gk].trim();
      const m = ps.marks && ps.marks[p.gk];
      col = m === true ? "#15803d" : m === false ? "#b91c1c" : "#1d4ed8";
    } else {
      const ef = it.steps.flatMap(s => s.fields || []).find(f => f.piece === p.gk);
      if(ef){ const s = it.steps.find(s => (s.fields || []).includes(ef)); const v = s.vals[s.fields.indexOf(ef)]; if(!empty(v)){ val = String(v).trim(); col = s.marks ? (s.marks[s.fields.indexOf(ef)] ? "#15803d" : "#b91c1c") : "#1d4ed8"; } }
      if(val == null && it.settled){ val = fmt(p.w * p.h); col = "#15803d"; }
    }
    const missing = it.missX.has(p.i) || it.missY.has(p.j);
    const mult = missing && !it.settled ? "?" : `${fmt(p.w)} ${X} ${fmt(p.h)}`;
    if(val != null){
      const fs = Math.min(40, ph * .4, (pw - 8) / (String(val).length * .56));
      const fs2 = Math.min(fs * .5, ph * .2, (pw - 8) / (mult.length * .56));
      const showM = fs2 >= 10 && ph > fs + fs2 * 1.7 + 6 && mult !== "?";
      if(fs >= 10) txt(gL, cx, cy + (showM ? fs2 * .62 : 0), val, fs, col);
      if(showM) txt(gL, cx, cy - fs * .55, mult, fs2, INK[ci], { opacity:.75 });
    } else {
      const fs = Math.min(26, ph * .3, (pw - 8) / (mult.length * .56));
      if(fs >= 9.5) txt(gL, cx, cy, mult, fs, INK[ci], { opacity:.8 });
    }
  });
  /* part sizes along the top and left; missing ones as boxes */
  const rT = L.top, rL = L.left, rR = L.left + L.rw, rB = L.top + L.rh;
  const sideField = (axis, idx) => { for(const s of it.steps) for(let i = 0; i < (s.fields || []).length; i++){ const f = s.fields[i]; if(f.side && f.side.axis === axis && f.side.idx === idx) return { s, i, f }; } return null; };
  const sideLabel = (axis, idx, v, cx, cy, anchor) => {
    const miss = (axis === "x" ? it.missX : it.missY).has(idx);
    if(!miss){ txt(gL, cx, cy, fmt(v), clamp(Math.min(21, (axis === "x" ? (X0(1) - X0(0)) * v : (Y0(1) - Y0(0)) * v) * .6), 12, 21), axis === "x" ? "#1d4ed8" : "#c2410c", anchor ? { "text-anchor":anchor } : null); return; }
    const sf = sideField(axis, idx); let shown = "?", col = "#64748b";
    if(sf && !empty(sf.s.vals[sf.i])){ shown = String(sf.s.vals[sf.i]).trim(); col = sf.s.marks ? (sf.s.marks[sf.i] ? "#15803d" : "#b91c1c") : "#1d4ed8"; }
    if(it.settled){ shown = fmt(v); col = "#15803d"; }
    const bw = Math.max(40, tw(shown, 18) + 16);
    const bx = anchor === "end" ? cx - bw : cx - bw / 2;
    el("rect", { x:bx, y:cy - 14, width:bw, height:28, rx:7, fill:"#fff", stroke:"#64748b", "stroke-width":1.5, "stroke-dasharray":"4 3" }, gL);
    txt(gL, bx + bw / 2, cy, shown, 18, col);
  };
  if(area || it.missX.size || it.missY.size){
    if(it.px.length > 1 || it.missX.size) it.px.forEach((v, i) => sideLabel("x", i, v, (X0(P.X[i]) + X0(P.X[i + 1])) / 2, rT - 44));
    if(it.py.length > 1 || it.missY.size) it.py.forEach((v, j) => sideLabel("y", j, v, rL - 32, (Y0(P.Y[j]) + Y0(P.Y[j + 1])) / 2, "end"));
  }
  /* overall measurements */
  if(!(it.hideOverall && !it.settled) && !L.compact){
    const aY = rT - 76, aX = rL - 84;
    const arrow = (x1, y1, x2, y2, col) => {
      el("line", { x1, y1, x2, y2, stroke:col, "stroke-width":2 }, gL);
      const hz = y1 === y2, s = 7;
      const head = (x, y, dir) => { const pts = hz ? [[x, y], [x - dir * s * 1.4, y - s * .75], [x - dir * s * 1.4, y + s * .75]] : [[x, y], [x - s * .75, y - dir * s * 1.4], [x + s * .75, y - dir * s * 1.4]]; el("polygon", { points:pts.map(p => p.join(",")).join(" "), fill:col }, gL); };
      head(x1, y1, -1); head(x2, y2, 1);
    };
    arrow(rL, aY, rR, aY, "#1d4ed8"); pill(gL, (rL + rR) / 2, aY, fmt(it.W), 18, { color:"#1d4ed8", stroke:"#bfdbfe" });
    arrow(aX, rT, aX, rB, "#c2410c");
    const vp = pill(gL, aX, (rT + rB) / 2, fmt(it.H), 18, { color:"#c2410c", stroke:"#fed7aa" });
    if(fmt(it.H).length > 2) vp.setAttribute("transform", `rotate(-90 ${aX} ${(rT + rB) / 2})`);
  }
  /* perimeter view: every edge part labelled outside the shape */
  if(!area){
    const placed = [], fs = L.compact ? 14 : 16;
    B.segs.forEach(s => {
      const mx = X0((s.x1 + s.x2) / 2), my = Y0((s.y1 + s.y2) / 2);
      let ox = 0, oy = 0;
      if(s.dir === "E") oy = s.y1 === 0 ? -44 : -22;
      if(s.dir === "W") oy = s.y1 === it.H ? 26 : 22;
      if(s.dir === "S") ox = s.x1 === it.W ? 32 : 24;
      if(s.dir === "N") ox = s.x1 === 0 ? -44 : -24;
      let x = mx + ox, y = my + oy;
      const lab = fmt(s.len), w = Math.max(fs * 1.5, tw(lab, fs) + fs * .9), h = fs * 1.55;
      const hits = () => placed.find(r => Math.abs(r.x - x) < (r.w + w) / 2 + 2 && Math.abs(r.y - y) < (r.h + h) / 2 + 1);
      let r = hits(), g = 0;
      while(r && g++ < 6){ if(s.dir === "E") x = r.x + (r.w + w) / 2 + 3; else if(s.dir === "W") x = r.x - (r.w + w) / 2 - 3; else if(s.dir === "S") y = r.y + (r.h + h) / 2 + 2; else y = r.y - (r.h + h) / 2 - 2; r = hits(); }
      placed.push({ x, y, w, h });
      pill(gChip, x, y, lab, fs, it.settled ? { bg:"#7c3aed", stroke:"#7c3aed", color:"#fff" } : { bg:"#fff", stroke:"#c4b5fd", color:"#5b21b6" });
    });
  }
  /* rulers + handles, where the student splits */
  if(ed){
    const tick = sc => sc >= 6 ? 1 : sc >= 2.4 ? 5 : sc >= .6 ? 10 : 50;
    const ruler = (axis) => {
      const r = el("g", { class:"ruler", "data-ruler":axis }, gR);
      if(axis === "x") el("rect", { class:"band", x:rL, y:rT - 26, width:L.rw, height:20, rx:6, fill:"#f1f5f9", stroke:"#cbd5e1" }, r);
      else el("rect", { class:"band", x:rL - 26, y:rT, width:20, height:L.rh, rx:6, fill:"#f1f5f9", stroke:"#cbd5e1" }, r);
      const tot = axis === "x" ? it.W : it.H, st = tick(axis === "x" ? L.rw / it.W : L.rh / it.H); let d = "";
      for(let u = st; u < tot; u += st){ const big = u % 10 === 0, mid = u % 5 === 0;
        d += axis === "x" ? `M${X0(u)} ${rT - 6}v-${big ? 11 : mid ? 7 : 4}` : `M${rL - 6} ${Y0(u)}h-${big ? 11 : mid ? 7 : 4}`; }
      if(d) el("path", { d, stroke:"#94a3b8", "stroke-width":1, fill:"none" }, r);
    };
    if(it.W > 1) ruler("x");
    if(it.H > 1) ruler("y");
    const handle = (axis, idx, v) => {
      const off = DRAG && DRAG.axis === axis && DRAG.idx === idx && DRAG.off;
      const stroke = off ? "#dc2626" : "#1e293b";
      if(axis === "x"){ const x = X0(v);
        el("line", { class:"cutHit", "data-cut":"x:" + idx, x1:x, y1:rT - 28, x2:x, y2:rB, stroke:"transparent", "stroke-width":22 }, gR);
        el("circle", { cx:x, cy:rT - 16, r:9, fill:off ? "#fee2e2" : "#fff", stroke, "stroke-width":2.5 }, gR).style.pointerEvents = "none";
      } else { const y = Y0(v);
        el("line", { class:"cutHit y", "data-cut":"y:" + idx, x1:rL - 28, y1:y, x2:rR, y2:y, stroke:"transparent", "stroke-width":22 }, gR);
        el("circle", { cx:rL - 16, cy:y, r:9, fill:off ? "#fee2e2" : "#fff", stroke, "stroke-width":2.5 }, gR).style.pointerEvents = "none";
      }
    };
    cutsOf(it.px).forEach((v, i) => handle("x", i, v));
    cutsOf(it.py).forEach((v, i) => handle("y", i, v));
  }
  /* the panel's head and note */
  $("viewTag").className = "viewTag " + (area ? "area" : "perim");
  $("viewTag").textContent = area ? "Area model" : "Perimeter — every edge";
  $("clearBtn").hidden = !ed;
  $("clearBtn").disabled = it.px.length < 2 && it.py.length < 2;
  let note;
  if(ed) note = it.px.length < 2 && it.py.length < 2 ? "Click the ruler along the top or the left edge to split a side." : "Drag a split to move it, or off the end to remove it.";
  else if(it.explore && it.locked) note = "These are the pieces you split it into.";
  else if(!area) note = "The perimeter is the distance all the way round — the lines inside don’t count.";
  else if(it.missX.size || it.missY.size) note = "The dashed boxes are the missing side lengths.";
  else if(it.removed.size) note = "The hatched piece has been cut out.";
  else note = "The splits are drawn for you.";
  $("boardNote").textContent = note;
}

/* ---------- splitting on the board (the teaching tool's interaction) ---------- */
function svgPt(e){ const r = svg.getBoundingClientRect(); return { x:(e.clientX - r.left) * (L.w / r.width), y:(e.clientY - r.top) * (L.h / r.height) }; }
function snap(axis, v){
  const it = cur(), tot = axis === "x" ? it.W : it.H, map = axis === "x" ? L.X : L.Y;
  let r = Math.round(v); const r10 = Math.round(v / 10) * 10;
  if(r10 > 0 && r10 < tot && Math.abs(map(v) - map(r10)) < 10) r = r10;
  return r;
}
function setCuts(axis, cuts){
  const it = cur();
  if(axis === "x") it.px = partsOf(it.W, cuts); else it.py = partsOf(it.H, cuts);
}
function cutsNow(axis){ const it = cur(); return cutsOf(axis === "x" ? it.px : it.py); }
function afterSplit(){
  /* the list of pieces in the question follows the board */
  const it = cur(), ps = it.steps.find(s => s.t === "prods");
  if(ps && ps.own && ps.first === null){ const keep = new Set(livePieces(it).map(p => p.gk)); Object.keys(ps.vals).forEach(k => { if(!keep.has(k)) delete ps.vals[k]; }); paint(); }
  else drawBoard();
}
svg.addEventListener("pointerdown", e => {
  const it = cur(); if(!it || e.button > 0) return;
  const t = e.target;
  const cutEl = t.closest("[data-cut]"), rul = t.closest("[data-ruler]"), pc = t.closest("[data-gk]");
  if(editable(it) && cutEl){ const [axis, idx] = cutEl.dataset.cut.split(":"); startDrag(e, axis, +idx); return; }
  if(editable(it) && rul){
    const axis = rul.dataset.ruler, pt = svgPt(e), tot = axis === "x" ? it.W : it.H;
    const v = snap(axis, axis === "x" ? L.ix(pt.x) : L.iy(pt.y));
    if(v < 1 || v > tot - 1) return;
    const cuts = cutsNow(axis);
    if(cuts.includes(v)){ startDrag(e, axis, cuts.indexOf(v)); return; }
    if(cuts.length >= 5){ setPrompt("That’s plenty of pieces along one side.", "warn"); return; }
    cuts.push(v); cuts.sort((a, b) => a - b); setCuts(axis, cuts);
    startDrag(e, axis, cuts.indexOf(v));
    afterSplit();
    return;
  }
  if(pc){
    const inp = $("qCard").querySelector(`input[data-gk="${pc.dataset.gk}"]`);
    if(inp && !inp.readOnly){ inp.focus(); inp.select(); }
  }
});
function startDrag(e, axis, idx){
  e.preventDefault();
  try{ svg.setPointerCapture(e.pointerId); }catch(err){}
  DRAG = { axis, idx, off:false }; DRAGL = L;
}
svg.addEventListener("pointermove", e => {
  const it = cur(); if(!it) return;
  if(!DRAG){ ghostAt(e); return; }
  const { axis, idx } = DRAG, cuts = cutsNow(axis), tot = axis === "x" ? it.W : it.H;
  const pt = svgPt(e), span = axis === "x" ? L.rw : L.rh, pos = axis === "x" ? pt.x - L.left : pt.y - L.top;
  const off = pos < -30 || pos > span + 30;
  const lo = (idx > 0 ? cuts[idx - 1] : 0) + 1, hi = (idx < cuts.length - 1 ? cuts[idx + 1] : tot) - 1;
  let changed = off !== DRAG.off; DRAG.off = off;
  if(!off && lo <= hi){ const v = clamp(snap(axis, axis === "x" ? L.ix(pt.x) : L.iy(pt.y)), lo, hi); if(v !== cuts[idx]){ cuts[idx] = v; setCuts(axis, cuts); changed = true; } }
  if(changed) afterSplit();
});
const endDrag = () => {
  if(!DRAG) return;
  const { axis, idx, off } = DRAG; DRAG = null; DRAGL = null;
  if(off){ const c = cutsNow(axis); c.splice(idx, 1); setCuts(axis, c); }
  afterSplit();
};
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);
svg.addEventListener("pointerleave", () => { const g = $("ghost"); if(g && !DRAG) g.innerHTML = ""; });
function ghostAt(e){
  const g = $("ghost"); if(!g) return; g.innerHTML = "";
  const it = cur(); if(!editable(it)) return;
  const rul = e.target.closest && e.target.closest("[data-ruler]"); if(!rul) return;
  const axis = rul.dataset.ruler, pt = svgPt(e), tot = axis === "x" ? it.W : it.H;
  const v = snap(axis, axis === "x" ? L.ix(pt.x) : L.iy(pt.y));
  if(v < 1 || v > tot - 1 || cutsNow(axis).includes(v)) return;
  const cuts = cutsNow(axis).concat(v).sort((a, b) => a - b), parts = partsOf(tot, cuts), at = cuts.indexOf(v);
  const lab = parts[at] + " | " + parts[at + 1];
  if(axis === "x"){ const x = L.X(v); el("line", { x1:x, y1:L.top - 26, x2:x, y2:L.top + L.rh, stroke:"#2563eb", "stroke-width":2, "stroke-dasharray":"6 5" }, g); pill(g, x, L.top - 44, lab, 14, { color:"#1d4ed8", stroke:"#93c5fd" }); }
  else { const y = L.Y(v); el("line", { x1:L.left - 26, y1:y, x2:L.left + L.rw, y2:y, stroke:"#2563eb", "stroke-width":2, "stroke-dasharray":"6 5" }, g); pill(g, L.left - 50, y, lab, 14, { color:"#c2410c", stroke:"#fdba74" }); }
}
$("clearBtn").addEventListener("click", () => { const it = cur(); if(!editable(it)) return; it.px = [it.W]; it.py = [it.H]; afterSplit(); });
/* The model is sized to the REAL page, not a guessed vh: whatever the header,
   prompt, nav and footer take, the board gets the rest (300–620px), so a
   laptop screen never scrolls just because the board was too tall. */
function fitBoard(){
  const wrap = $("boardWrap");
  if(window.innerWidth <= 980){ if(wrap.style.height) wrap.style.height = ""; $("qCard").style.maxHeight = ""; return; }
  const work = $("work"), card = $("boardCard");
  /* everything above and below the work row, measured from the elements themselves (the page's
     scrollHeight can't be used: when the page is shorter than the window it reports the window,
     and the board would shrink a little more on every repaint) */
  const wr = work.getBoundingClientRect(), nav = document.querySelector(".navRow").getBoundingClientRect();
  const lay = getComputedStyle(document.querySelector(".layout"));
  const outside = (wr.top + window.scrollY) + (nav.bottom - wr.bottom) + parseFloat(lay.paddingBottom) + document.querySelector(".brandFoot").offsetHeight;
  const extra = card.offsetHeight - wrap.offsetHeight;
  const want = Math.round(clamp(window.innerHeight - outside - extra - 2, 260, 620));
  const moved = Math.abs(wrap.offsetHeight - want) > 1;
  if(moved) wrap.style.height = want + "px";
  /* the question card is never taller than the model beside it: it scrolls inside itself */
  $("qCard").style.maxHeight = Math.max(card.offsetHeight, window.innerHeight - outside - 2) + "px";
  return moved;
}
function keepInView(){
  const q = $("qCard"); if(q.scrollHeight <= q.clientHeight + 1) return;
  const el = q.querySelector(".part.current") || q.querySelector(".part.no:not(.folded)") || q.querySelector(".fix");
  if(el){ const top = el.offsetTop - q.offsetTop; if(top + el.offsetHeight > q.scrollTop + q.clientHeight || top < q.scrollTop) q.scrollTop = Math.max(0, top + el.offsetHeight - q.clientHeight + 12); }
}
let rz = 0;
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fitBoard(); if(!DRAG && cur()) drawBoard(); }); };
window.addEventListener("resize", onResize);
if(window.ResizeObserver) new ResizeObserver(onResize).observe($("boardWrap")); else window.addEventListener("resize", onResize);

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { pieces:"Products of the pieces", area:"The multiplication / area", backwards:"Missing numbers", reasoning:"Reasoning", composite:"Cut-out shapes", perimeter:"Perimeter" };
const CATS = ["pieces","area","backwards","composite","perimeter","reasoning"];
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
  (function frame(now){
    const t = now - t0; let alive = false;
    for(const b of bits){ b.x += b.vx; b.y += b.vy; b.vy += .06; b.rot += b.vr; if(b.y < H + 40) alive = true;
      b.e.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) rotate(" + b.rot.toFixed(0) + "deg)";
      b.e.style.opacity = t > 1500 ? String(Math.max(0, 1 - (t - 1500) / 700)) : "1"; }
    if(alive && t < 2300) requestAnimationFrame(frame); else host.remove();
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
  paint(); focusStep(0);
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

/* The shared early-submit button (an ES module, so it is imported). Offline, the quiz works without it. */
import("/portal/shared/earlySubmit.js").then(m => {
  window.MMTSubmit = m.MMTSubmit;
  m.MMTSubmit.register({
    progress: () => ({ attempted:S.items.filter(x => x.settled).length, correct:S.items.filter(x => x.correct).length, quizLength:QUIZ_N }),
    finish: () => finish()
  });
}).catch(() => {});

buildLevelList();
setPrompt("Choose a level to begin.");
fitBoard();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__AMQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, pieces, livePieces, boundary, areaOf, pv, alt2, removalOK, pvRows, CFG, setCuts:(axis, cuts) => { setCuts(axis, cuts); afterSplit(); }, get L(){ return L; } };
})();
