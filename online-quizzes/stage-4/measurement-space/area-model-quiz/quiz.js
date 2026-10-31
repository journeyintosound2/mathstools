/* =====================================================================
   AREA MODEL — STUDENT QUIZZES (one engine, two pages)
   ---------------------------------------------------------------------
   area-model.html               window.AMQ.focus = "area"  (multiplication)
   perimeter-area-rectangle.html window.AMQ.focus = "both"  (area + perimeter)

   Each question is ONE question with ONE answer space, and nothing else
   in the card. The right-hand panel is the teaching tool's area model,
   there to HELP: students may split it (click a ruler, drag a split,
   drag it off the end) and jot each piece's product inside it, but the
   board is never required and never marked. A wrong answer on a whole
   rectangle splits the model by place value to show the working.

   The ladder:
     Sweet  smaller numbers, the model already split by place value
     Mild   the model starts whole; a classic mistake to spot
     Medium bigger numbers, missing numbers from the products
     Spicy  the biggest numbers, cut-out shapes, reasoning
   The Area & Perimeter page mixes perimeter into every level (the model
   has an Area / Perimeter switch): tens and ones, double the half, make
   a ten, cut-out shapes.

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

/* ---------------------------------------------------------- building questions
   ONE question, ONE answer space. The area model beside it is there to
   help — students may split it and jot each piece's product inside it —
   but nothing on the board is required, and nothing on it is marked. */
function base(level, W, H, o){
  return Object.assign({ level, W, H, px:[W], py:[H], removed:new Set(), explore:false, locked:false,
    missX:new Set(), missY:new Set(), given:new Map(), hideOverall:false, settled:false, correct:false,
    scratch:{}, viewPick:null, q:"", ask:"", working:"" }, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:t === "num" ? [] : {}, marks:null, fixText:null, sel:null, view:"area" }, o || {}); }
/* the place-value working, for the feedback line */
function pvWorking(W, H){
  const a = pv(W), b = pv(H), terms = [], vals = [];
  b.forEach(y => a.forEach(x => { terms.push(`${fmt(x)} ${X} ${fmt(y)}`); vals.push(x * y); }));
  if(vals.length < 2) return eqS(`${fmt(W)} ${X} ${fmt(H)} = ${fmt(W * H)}`);
  if(vals.length > 4) return eqS(`${plus(vals)} = ${fmt(W * H)}`);
  return eqS(`${terms.join(" + ")}`) + " " + eqS(`= ${plus(vals)} = ${fmt(W * H)}`);
}
const field = (lab, ans, o) => Object.assign({ lab, ans }, o || {});

/* multiply — the model starts split by place value on Sweet, whole after that */
function qMul(level, size, drawn){
  const [W, H] = dims(size);
  const it = base(level, W, H, { explore:true });
  if(drawn){ it.px = pv(W); it.py = pv(H); }
  if(BOTH) it.q = "Find the area of the rectangle.";
  it.steps = [ step("num", { cat:"area",
    fields:[ BOTH ? field("Area =", W * H) : field(eqS(`<span class="cx">${fmt(W)}</span> ${X} <span class="cy">${fmt(H)}</span> =`), W * H, { big:true }) ],
    why:() => pvWorking(W, H) }) ];
  return it;
}
/* missing numbers: the products are known, a side is not */
function qMissing(level, size, hard){
  const [W, H] = dims(size, (W, H) => pv(W).length > 1 && (!hard || pv(H).length > 1));
  const it = base(level, W, H, { px:pv(W), py:hard ? pv(H) : [H], hideOverall:true });
  const P = livePieces(it);
  if(hard){
    const mi = it.px.length - 1, mj = it.py.length - 1;
    it.missX.add(mi); it.missY.add(mj);
    P.forEach(p => { if(!(p.i === mi && p.j === mj)) it.given.set(p.gk, p.w * p.h); });
    const empty = P.find(p => p.i === mi && p.j === mj);
    const colP = P.find(p => p.i === mi && p.j === 0), rowP = P.find(p => p.i === 0 && p.j === mj);
    it.q = "What number goes in the empty piece?";
    it.steps = [ step("num", { cat:"backwards", fields:[ field("Empty piece =", empty.w * empty.h, { piece:empty.gk }) ],
      why:() => `The missing width is ${eqS(`${fmt(colP.w * colP.h)} ÷ ${fmt(colP.h)} = ${fmt(colP.w)}`)} and the missing height is ${eqS(`${fmt(rowP.w * rowP.h)} ÷ ${fmt(rowP.w)} = ${fmt(rowP.h)}`)}, so the empty piece is ${eqS(`${fmt(empty.w)} ${X} ${fmt(empty.h)} = ${fmt(empty.w * empty.h)}`)}.` }) ];
  } else {
    it.missY.add(0);
    P.forEach(p => it.given.set(p.gk, p.w * p.h));
    const p0 = P[0];
    it.q = "What is the missing height?";
    it.steps = [ step("num", { cat:"backwards", fields:[ field("Height =", H, { side:{ axis:"y", idx:0 } }) ],
      why:() => `${eqS(`${fmt(p0.w * p0.h)} ÷ ${fmt(p0.w)} = ${fmt(H)}`)} — every piece in the row has the same height.` }) ];
  }
  return it;
}
/* spot the mistake */
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
function qMistake(level, size){
  const [W, H] = dims(size, (W, H) => pv(W).length > 1 && pv(H).length > 1);
  const it = base(level, W, H, { px:pv(W), py:pv(H) });
  const P = livePieces(it), name = pick(NAMES);
  let used;
  if(P.length === 4 && Math.random() < .65) used = P.filter(p => p.i === p.j);   // the classic: tens × tens, ones × ones
  else { const drop = pick(P); used = P.filter(p => p !== drop); }
  const missing = P.filter(p => !used.includes(p));
  const pw = p => eqS(`${fmt(p.w)} ${X} ${fmt(p.h)}`);
  const usedTot = sum(used.map(p => p.w * p.h));
  it.q = `${name} worked out ${eqWH(W, H)} like this:`;
  it.working = `${used.map(p => `${fmt(p.w)} ${X} ${fmt(p.h)}`).join(" + ")} = ${fmt(usedTot)}`;
  it.ask = `What did ${name} leave out?`;
  const sh = shuffle(used);
  const opts = [{ h:missing.map(pw).join(" and "), ok:true }];
  if(missing.length > 1) opts.push({ h:pw(missing[0]), ok:false });
  else opts.push({ h:pw(sh[1]), ok:false });
  opts.push({ h:pw(sh[0]), ok:false });
  opts.push({ h:`Nothing — ${fmt(usedTot)} is right`, ok:false });
  it.steps = [ step("mc", { cat:"reasoning", opts:shuffle(opts),
    why:() => `The model has ${P.length} pieces and ${name} used ${used.length}. All of them: ${eqS(`${plus(P.map(p => p.w * p.h))} = ${fmt(W * H)}`)}.` }) ];
  return it;
}
/* which of these is NOT equal (the model is free to test each one) */
function qNotEqual(level, size){
  const [W, H] = dims(size, (W, H) => pv(W).length === 2 && pv(H).length === 2);
  const it = base(level, W, H, { explore:true });
  const [a1, a2] = pv(W), [b1, b2] = pv(H), [c1, c2] = alt2(W);
  const opts = shuffle([
    { h:eqS(`${a1} ${X} ${b1} + ${a2} ${X} ${b1} + ${a1} ${X} ${b2} + ${a2} ${X} ${b2}`), ok:false },
    { h:eqS(`${c1} ${X} ${H} + ${c2} ${X} ${H}`), ok:false },
    { h:eqS(`${W} ${X} ${b1} + ${W} ${X} ${b2}`), ok:false },
    { h:eqS(`${a1} ${X} ${b1} + ${a2} ${X} ${b2}`), ok:true }
  ]);
  it.q = `Which one is NOT equal to ${eqWH(W, H)}?`;
  it.steps = [ step("mc", { cat:"reasoning", opts,
    why:() => `${eqS(`${a1} ${X} ${b1} + ${a2} ${X} ${b2}`)} leaves out two pieces: ${eqS(`${a2} ${X} ${b1}`)} and ${eqS(`${a1} ${X} ${b2}`)}.` }) ];
  return it;
}
/* cut-out shapes: ask = "area" | "perim" | "compare" */
function qCut(level, size, notch, ask){
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
    if(ask === "perim"){
      it.q = "Find the perimeter of the shape.";
      it.steps = [ step("num", { cat:"perimeter", view:"perim", fields:[ field("Perimeter =", B.total) ],
        why:() => eqS(`${plus(B.segs.map(s => s.len))} = ${fmt(B.total)}`) }) ];
    } else if(ask === "compare"){
      const same = B.total === whole, longer = B.total > whole;
      it.q = "A piece has been cut out. Compared with the whole rectangle, the perimeter of the shape is…";
      it.steps = [ step("mc", { cat:"reasoning", view:"perim",
        opts:[{ h:"the same", ok:same }, { h:"longer", ok:longer }, { h:"shorter", ok:!same && !longer }],
        why:() => same ? "The same — cutting out a corner moves two edges inwards without changing their lengths."
                       : `Longer, by ${fmt(B.total - whole)} — the notch adds its two inside edges.` }) ];
    } else {
      it.q = "Find the area of the shape.";
      it.steps = [ step("num", { cat:"composite", fields:[ field("Area =", A) ],
        why:() => `The whole rectangle take away the cut-out piece: ${eqS(`${fmt(W * H)} − ${fmt(gone.w * gone.h)} = ${fmt(A)}`)}` }) ];
    }
    return it;
  }
  throw new Error("no cut shape");
}
/* perimeter: split = "pv" (tens and ones) | "none" | "ten" (make a ten) */
function qPerim(level, size, split){
  const test = split === "ten" ? (W, H) => { const a = W % 10; return a >= 2 && a <= 8 && H > 10 - a; } : null;
  const [W, H] = dims(size, test);
  const it = base(level, W, H, { explore:true });
  let why;
  if(split === "pv"){
    it.px = pv(W); it.py = pv(H);
    const rows = pvRows(boundary(it).segs);
    why = () => rows.map(r => `${r.name.toLowerCase()} ${eqS(`${plus(r.v)} = ${fmt(r.total)}`)}`).join(", ") + `; together ${eqS(`${plus(rows.map(r => r.total))} = ${fmt(2 * (W + H))}`)}`;
  } else if(split === "ten"){
    const p = 10 - W % 10; it.py = [p, H - p];
    why = () => `Make a ten: ${eqS(`${fmt(W)} + ${p} = ${fmt(W + p)}`)}, twice is ${eqS(fmt(2 * (W + p)))}. The rest: ${eqS(`${fmt(H - p)} + ${fmt(H - p)} = ${fmt(2 * (H - p))}`)}. Together ${eqS(`${fmt(2 * (W + p))} + ${fmt(2 * (H - p))} = ${fmt(2 * (W + H))}`)}.`;
  } else {
    why = () => `Half way round is ${eqS(`${fmt(W)} + ${fmt(H)} = ${fmt(W + H)}`)}, and double that is ${eqS(fmt(2 * (W + H)))}.`;
  }
  it.q = "Find the perimeter of the rectangle.";
  it.steps = [ step("num", { cat:"perimeter", view:"perim", fields:[ field("Perimeter =", 2 * (W + H)) ], why }) ];
  return it;
}
/* area and perimeter of the same rectangle */
function qAreaPerim(level, size){
  const [W, H] = dims(size);
  const it = base(level, W, H, { explore:true });
  it.q = "Find the area and the perimeter.";
  it.steps = [ step("num", { cats:["area", "perimeter"], fields:[ field("Area =", W * H), field("Perimeter =", 2 * (W + H)) ],
    why:() => `Area: ${pvWorking(W, H)}. Perimeter: ${eqS(`${fmt(W)} + ${fmt(H)} + ${fmt(W)} + ${fmt(H)} = ${fmt(2 * (W + H))}`)}.` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:BOTH ? "Area and perimeter of smaller rectangles. The model is split for you." : "Two-digit by one-digit, up to two-digit by two-digit. The model is split for you." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:BOTH ? "Bigger rectangles. Split the model any way that helps." : "Split the model yourself if it helps. Spot a classic mistake." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:BOTH ? "Cut-out shapes, missing numbers and three-digit sides." : "Three-digit numbers and missing numbers." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:BOTH ? "Three-digit by two-digit, notched shapes and reasoning." : "Three-digit by two-digit, cut-out shapes and reasoning." }
};
const ORDER = ["sweet","mild","medium","spicy"];
function buildPaper(level){
  USED = new Set();
  const L0 = level;
  const M = (s, d) => qMul(L0, s, d), PR = (s, k) => qPerim(L0, s, k);
  if(!BOTH){
    if(level === "sweet") return [M("t1",1), M("t1",1), M("t1",1), M("21",1), M("21",1), M("21",1), M("tt",1), M("tt",1), M("tt",1), M("22",1)];
    if(level === "mild") return [M("21"), M("21"), M("tt"), M("tt"), M("22"), M("22"), qMistake(L0,"22"), M("22"), M("31",1), M("22")];
    if(level === "medium") return [M("31"), M("31"), qMissing(L0,"22"), qMissing(L0,"22"), M("22"), qMistake(L0,"22"), M("32"), qMissing(L0,"tt",true), M("32"), M("31")];
    return [M("32"), M("32"), qCut(L0,"22",false,"area"), qNotEqual(L0,"22"), qMissing(L0,"32",true), qCut(L0,"32",false,"area"), qMistake(L0,"32"), M("32"), qNotEqual(L0,"22"), qCut(L0,"31",true,"area")];
  }
  if(level === "sweet") return [M("t1",1), PR("t1","pv"), M("t1",1), PR("tt","pv"), M("tt",1), PR("tt","none"), qAreaPerim(L0,"t1"), PR("tt","pv"), M("tt",1), qAreaPerim(L0,"tt")];
  if(level === "mild") return [M("21"), PR("21","ten"), M("tt"), PR("22","none"), M("22"), PR("22","ten"), PR("22","pv"), M("22"), qAreaPerim(L0,"22"), PR("22","ten")];
  if(level === "medium") return [qCut(L0,"22",false,"area"), qMissing(L0,"22"), PR("31","pv"), qCut(L0,"tt",false,"perim"), M("31"), qMistake(L0,"22"), qCut(L0,"22",false,"compare"), PR("31","none"), PR("22","ten"), qAreaPerim(L0,"22")];
  return [qAreaPerim(L0,"32"), qCut(L0,"32",true,"perim"), PR("31","ten"), qMissing(L0,"22",true), qNotEqual(L0,"22"), qCut(L0,"32",false,"area"), PR("32","pv"), qMistake(L0,"32"), qCut(L0,"31",true,"compare"), qAreaPerim(L0,"32")];
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
    if(s.fields.some((f, i) => empty(s.vals[i]))) return { invalid:s.fields.length > 1 ? "Fill in both answers first." : "Type your answer first." };
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
const PAL = ["#dbeafe","#fef3c7","#dcfce7","#ffe4e6","#ede9fe","#ccfbf1","#ffedd5","#e0e7ff"];
const PALMID = ["#93c5fd","#fcd34d","#86efac","#fda4af","#c4b5fd","#5eead4","#fdba74","#a5b4fc"];
const INK = ["#1e40af","#92400e","#166534","#9f1239","#5b21b6","#115e59","#9a3412","#3730a3"];
function colourIndex(it){
  const m = new Map(); pieces(it).list.forEach(p => { const k = p.w + "x" + p.h; if(!m.has(k)) m.set(k, m.size); p.c = m.get(k); });
  return m;
}

/* the one line under the answer: a quiet pointer to the model before
   marking, the feedback after it */
const stacked = () => window.innerWidth <= 980;
function hintHTML(it){
  const verb = editable(it) && !it.settled ? "Split" : "Use";
  return `<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span><span>${verb} the ${BOTH ? "model" : "area model"} if it helps</span>`;
}
function setPrompt(msg, kind){
  const f = $("fb"); if(!f) return;
  f.className = "fb" + (kind ? " " + kind : "");
  f.innerHTML = msg;
}
function feedback(it){
  const s = it.steps[0];
  if(s.first === null) return setPrompt(hintHTML(it), "hint");
  if(s.skipped) return setPrompt(`<b>Skipped.</b> ${s.why()}`, "bad");
  if(s.first) return setPrompt(`<b>✓ Right first time!</b>`, "good");
  if(s.last) return setPrompt(`<b>✓ Fixed — well done.</b>`, "fixed");
  setPrompt(`<b>Not quite.</b> ${s.fixText || s.why()}`, "bad");
}

function answerHTML(it, s){
  const locked = s.last || s.skipped;
  if(s.t === "num"){
    return `<div class="answers">` + s.fields.map((f, i) => {
      const m = s.marks ? (s.marks[i] ? " right" : " wrong") : "";
      const v = s.vals[i] == null ? "" : s.vals[i];
      return `<label class="ansRow${f.big ? " big" : ""}"><span class="lab">${f.lab}</span>`
        + `<input class="cell ans${m}" data-k="0" data-i="${i}" inputmode="numeric" autocomplete="off" value="${esc(v)}"${locked ? " readonly" : ""} aria-label="${esc(String(f.lab).replace(/<[^>]+>/g, ""))}"></label>`;
    }).join("") + `</div>`;
  }
  return `<div class="mcList">` + s.opts.map((o, i) => {
    const st = s.marks && s.marks[i] !== null && s.marks[i] !== undefined ? (s.marks[i] ? " right" : " wrong") : "";
    const show = (s.last || s.skipped) && o.ok ? " right" : "";
    return `<button class="mcOpt${s.sel === i ? " on" : ""}${st || show}" type="button" data-k="0" data-opt="${i}"${locked ? " disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${o.h}</span></button>`;
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
  card.querySelectorAll("input[data-k]").forEach(inp => {
    inp.addEventListener("input", () => {
      s.vals[+inp.dataset.i] = inp.value;
      inp.classList.remove("right", "wrong");
      const f = s.fields[+inp.dataset.i];
      if(f.piece || f.side) drawBoard();               // a missing number shows on the model as it is typed
    });
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      const peers = [...card.querySelectorAll("input[data-k]")].filter(x => !x.readOnly);
      const at = peers.indexOf(inp);
      const nextEmpty = peers.slice(at + 1).find(x => empty(x.value)) || peers.slice(0, at).find(x => empty(x.value));
      if(nextEmpty){ nextEmpty.focus(); return; }
      check(0);
    });
  });
  card.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
    s.sel = +b.dataset.opt;
    b.parentNode.querySelectorAll(".mcOpt").forEach(x => x.classList.toggle("on", x === b));
  }));
  card.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => check(0)));
}
function focusStep(){
  const els = [...$("qCard").querySelectorAll("input[data-k]:not([readonly])")];
  const el = els.find(e => empty(e.value)) || els[0];
  if(el && !("ontouchstart" in window)) el.focus({ preventScroll:true });
}

/* =====================================================================
   CHECKING — only the FIRST check scores; "Check again" lets them fix it
   ===================================================================== */
function check(){
  const it = cur(), s = it.steps[0];
  if(s.last || s.skipped) return;
  const res = markStep(it, s);
  if(res.invalid){ setPrompt(res.invalid, "warn"); return; }
  s.marks = res.marks; s.last = res.ok; s.fixText = res.fix;
  if(s.first === null){
    s.first = res.ok;
    it.settled = true; it.correct = res.ok;
    /* a wrong answer on a whole rectangle: the model splits itself by place value, so it shows the working */
    if(!res.ok && it.explore && it.px.length < 2 && it.py.length < 2 && s.view !== "perim"){ it.px = pv(it.W); it.py = pv(it.H); }
    if(res.ok) confetti(1);
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  paint();
  if(res.ok) $("nextBtn").focus({ preventScroll:true });
  else focusStep();
}
function next(){
  const it = cur();
  if(!it.settled){
    it.steps.forEach(s => { if(s.first === null){ s.first = false; s.last = false; s.skipped = true; } });
    it.settled = true; it.correct = false;
    if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
  }
  if(S.i < S.items.length - 1){ S.i++; paint(); focusStep(); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}

/* =====================================================================
   THE AREA MODEL — the teaching tool's board, cut down to what a
   student needs. Live: typed products appear in their pieces; on the
   "split it yourself" questions the rulers are active.
   ===================================================================== */
const svg = $("board");
const editable = it => it.explore && !it.locked;
function viewOf(it){ if(it.viewPick && !it.missX.size && !it.missY.size) return it.viewPick; return it.steps[0].view || "area"; }
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
  /* pieces */
  P.list.forEach(p => {
    const x = X0(p.x0), y = Y0(p.y0), pw = X0(p.x0 + p.w) - x, ph = Y0(p.y0 + p.h) - y;
    if(p.removed){ el("rect", { x:x + 1.5, y:y + 1.5, width:Math.max(0, pw - 3), height:Math.max(0, ph - 3), fill:"url(#hatch)", stroke:"#fb7185", "stroke-width":1.5, "stroke-dasharray":"6 5" }, gP); return; }
    const ci = cmap.get(p.w + "x" + p.h) % PAL.length;
    const has = it.given.has(p.gk) || it.settled;
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
  /* inside the pieces: given products, a typed missing number, the answers once marked;
     otherwise the multiplication, with a box to jot its product in when there is room */
  const scr = [];
  const jot = area && !it.settled && !it.given.size && P.list.filter(p => !p.removed).length >= 2;
  if(area) P.list.forEach(p => {
    if(p.removed) return;
    const x = X0(p.x0), y = Y0(p.y0), pw = X0(p.x0 + p.w) - x, ph = Y0(p.y0 + p.h) - y, cx = x + pw / 2, cy = y + ph / 2;
    const ci = cmap.get(p.w + "x" + p.h) % PAL.length;
    let val = null, col = INK[ci];
    if(it.given.has(p.gk)){ val = fmt(it.given.get(p.gk)); col = "#0f172a"; }
    else {
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
      return;
    }
    if(mult === "?"){ const fs = Math.min(34, ph * .4, pw * .5); if(fs >= 10) txt(gL, cx, cy, "?", fs, "#64748b"); return; }
    const bh = clamp(ph * .34, 26, 36), bw = Math.min(112, pw - 14);
    let fs = Math.min(24, ph * .26, (pw - 10) / (mult.length * .56));
    if(jot && bw >= 46 && ph >= bh + 10){
      const lab = fs >= 9.5 && ph >= bh + fs + 16;
      const blockH = bh + (lab ? fs + 6 : 0), top = cy - blockH / 2;
      if(lab) txt(gL, cx, top + fs / 2, mult, fs, INK[ci], { opacity:.85 });
      scr.push({ p, x:cx - bw / 2, y:top + (lab ? fs + 6 : 0), w:bw, h:bh, ph:lab ? "" : mult });
      return;
    }
    fs = Math.min(26, ph * .3, (pw - 8) / (mult.length * .56));
    if(fs >= 9.5) txt(gL, cx, cy, mult, fs, INK[ci], { opacity:.8 });
  });
  placeJots(it, scr);
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
  /* the panel's head: a label, or on the Area & Perimeter page an Area / Perimeter switch
     (not when a side is missing — the perimeter view would show it) */
  const vt = $("viewTag");
  if(BOTH && !it.missX.size && !it.missY.size){
    vt.className = "viewSeg";
    vt.innerHTML = `<button type="button" data-v="area" class="${area ? "on" : ""}" aria-pressed="${area}">Area</button><button type="button" data-v="perim" class="${area ? "" : "on"}" aria-pressed="${!area}">Perimeter</button>`;
  } else { vt.className = "viewTag area"; vt.textContent = "Area model"; }
  $("clearBtn").hidden = !ed;
  $("clearBtn").disabled = it.px.length < 2 && it.py.length < 2;
}
/* the jotting boxes: plain inputs over the pieces, never marked, kept per question */
function placeJots(it, list){
  const lay = $("jots"); if(!lay) return;
  const ae = document.activeElement, keep = ae && ae.dataset && ae.dataset.sk ? ae.dataset.sk : null;
  lay.innerHTML = "";
  if(!list.length) return;
  const r = svg.getBoundingClientRect(), wr = $("boardWrap").getBoundingClientRect();
  const kx = r.width / L.w, ky = r.height / L.h, ox = r.left - wr.left, oy = r.top - wr.top;
  list.forEach(b => {
    const inp = document.createElement("input");
    inp.className = "jot"; inp.dataset.sk = b.p.gk; inp.inputMode = "numeric"; inp.autocomplete = "off"; inp.spellcheck = false;
    inp.value = it.scratch[b.p.gk] || ""; if(b.ph) inp.placeholder = b.ph;
    inp.setAttribute("aria-label", `${b.p.w} times ${b.p.h} (your working, not marked)`);
    Object.assign(inp.style, { left:(ox + b.x * kx) + "px", top:(oy + b.y * ky) + "px", width:(b.w * kx) + "px", height:(b.h * ky) + "px", fontSize:Math.round(Math.min(20, b.h * ky * .58)) + "px" });
    inp.addEventListener("input", () => { it.scratch[b.p.gk] = inp.value; });
    inp.addEventListener("focus", () => hlPiece(b.p.gk));
    inp.addEventListener("blur", () => hlPiece(null));
    inp.addEventListener("keydown", e => {
      if(e.key !== "Enter") return; e.preventDefault();
      const all = [...lay.querySelectorAll(".jot")], at = all.indexOf(inp);
      const nx = all.slice(at + 1).find(x => empty(x.value));
      if(nx) nx.focus(); else focusStep();
    });
    lay.appendChild(inp);
  });
  if(keep){ const k = lay.querySelector(`.jot[data-sk="${CSS.escape(keep)}"]`); if(k){ k.focus({ preventScroll:true }); const n = k.value.length; try{ k.setSelectionRange(n, n); }catch(e){} } }
}
function hlPiece(gk){ S.hl = gk; svg.querySelectorAll("rect.piece").forEach(r => r.classList.toggle("hl", r.dataset.gk === gk)); }
$("viewTag").addEventListener("click", e => {
  const b = e.target.closest("[data-v]"); const it = cur(); if(!b || !it) return;
  it.viewPick = b.dataset.v; drawBoard();
});

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
function afterSplit(){ drawBoard(); }
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
    const j = document.querySelector(`#jots .jot[data-sk="${CSS.escape(pc.dataset.gk)}"]`);
    if(j){ e.preventDefault(); j.focus(); }
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
  counted.forEach(it => it.steps.forEach(s => (s.cats || [s.cat]).forEach(c => { cats[c] = cats[c] || [0, 0]; cats[c][1]++; if(s.first === true) cats[c][0]++; })));
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
  paint(); focusStep();
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
fitBoard();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__AMQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, pieces, livePieces, boundary, areaOf, pv, alt2, removalOK, pvRows, CFG, setCuts:(axis, cuts) => { setCuts(axis, cuts); afterSplit(); }, get L(){ return L; } };
})();
