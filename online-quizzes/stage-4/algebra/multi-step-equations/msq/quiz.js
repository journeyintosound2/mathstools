(() => {
"use strict";
/* ================= THE TEACHING TOOL'S ENGINE AND BOARD (copied from the Multi-Step tool, verbatim apart from the
   "?" hook in moveScene: S.hide = {i, side} keeps the new number hidden until the student has typed it).
   Change the tool's engine or board → re-copy them here. ================= */
const MS = (function(){
  "use strict";
  const $ = id => document.getElementById(id);
  const S = { set:{ type:"axb", neg:"off", nonwhole:false, nw:"frac", div:"frac", vary:false, letters:false, split:false, check:false,
    moves:true, parts:true, sides:false }, q:null, step:0, hide:null };
  /* ================= small helpers ================= */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const fmt = n => n < 0 ? "−" + Math.abs(n) : String(n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* exact numbers: every value is a fraction {n, d}, d > 0, in lowest terms */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a || 1; };
  const R = (n, d) => { d = d || 1; if(d < 0){ n = -n; d = -d; } const g = gcd(n, d); return { n:n / g, d:d / g }; };
  const rAdd = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d), rSub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
  const rMul = (a, b) => R(a.n * b.n, a.d * b.d), rDiv = (a, b) => R(a.n * b.d, a.d * b.n);
  const rI = n => R(n, 1), rF = r => r.n / r.d, rInt = r => r.d === 1, rEq = (a, b) => a.n === b.n && a.d === b.d;

  /* MATHS ITALICS (as the other tools): real glyphs when a font has them, else a serif italic */
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
  function detectMathAlpha(){
    try {
      const x = document.createElement("canvas").getContext("2d");
      x.font = '500 100px "Cambria Math","STIX Two Math","Latin Modern Math",serif';
      const real = x.measureText("\u{1D465}\u{1D44E}\u{1D44F}\u{1D450}").width, gone = x.measureText("").width;
      return real > 0 && gone > 0 && Math.abs(real - gone) > 1;
    } catch(e){ return false; }
  }
  const MATH_ALPHA = detectMathAlpha();
  const LV = () => (S.q && S.q.v) || "x";
  const letterHTML = v => MATH_ALPHA ? `<span class="mi">${mathItalic(v)}</span>` : `<span class="mv">${esc(v)}</span>`;
  const UI = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const MF = '"Cambria Math","STIX Two Math","Latin Modern Math",Cambria,"Times New Roman",serif';
  const cv = document.createElement("canvas").getContext("2d");
  function tw(txt, px, fam, wt){ cv.font = `${wt || 500} ${px}px ${fam || MF}`; return cv.measureText(txt).width; }

  /* ================= sides of an equation =================
     {t:"num", v:R}                       a number
     {t:"ops", ops:[{o,n}], kFirst}       things done to the letter, in order:  [mul 3, add 4] is 3x + 4,  [add 2, mul 3] is 3(x + 2)
     {t:"lin", m, k, kFirst}              m·x + k with whole m and k (used when the letter is on both sides, or taken away: 10 − 2x) */
  const num = v => ({ t:"num", v:typeof v === "number" ? rI(v) : v });
  const opsS = (ops, kFirst) => ({ t:"ops", ops, kFirst:!!kFirst });
  const linS = (m, k, kFirst) => ({ t:"lin", m, k, kFirst:!!kFirst });
  const hasX = s => s.t === "ex" ? linOf(s).m.n !== 0 : s.t !== "num";
  function evalS(s, x){
    if(s.t === "num") return s.v;
    if(s.t === "lin") return rAdd(rMul(rI(s.m), x), rI(s.k));
    if(s.t === "ex") return exVal(s, x);
    let v = x;
    s.ops.forEach(op => { const n = rI(op.n); v = op.o === "add" ? rAdd(v, n) : op.o === "sub" ? rSub(v, n) : op.o === "mul" ? rMul(v, n) : rDiv(v, n); });
    return v;
  }
  function linToOps(s){
    const ops = [];
    if(s.m !== 1) ops.push({ o:"mul", n:s.m });
    if(s.k > 0) ops.push({ o:"add", n:s.k }); else if(s.k < 0) ops.push({ o:"sub", n:-s.k });
    return opsS(ops, s.kFirst && s.k > 0);
  }
  /* solve: a list of stages (each one an equation: top = left side, bottom = right side) and the moves between them */
  function solve(top, bot, x){
    const stages = [{ top, bot, val:evalS(top, x) }], moves = [];
    for(let guard = 0; guard < 8; guard++){
      const cur = stages[stages.length - 1]; let t = cur.top, b = cur.bot, mv = null, nt, nb;
      if(hasX(t) && hasX(b)){
        if(t.t !== "lin" || b.t !== "lin") return null;
        const s = Math.min(t.m, b.m);
        const strip = side => side.m - s === 0 ? num(side.k) : linS(side.m - s, side.k, side.kFirst);
        nt = strip(t); nb = strip(b); mv = { kind:"xterm", s };
      } else {
        const onTop = hasX(t); let X = onTop ? t : b, other = onTop ? b : t;
        if(!hasX(X)) return null;
        if(X.t === "lin" && X.m < 0){
          /* 10 − 2x = 4: add 2x to both sides */
          const s = X.m, nX = num(X.k), nO = linS(-s, rInt(other.v) ? other.v.n : NaN, true);
          if(!rInt(other.v)) return null;
          nt = onTop ? nX : nO; nb = onTop ? nO : nX; mv = { kind:"xterm", s };
        } else {
          if(X.t === "lin") X = linToOps(X);
          if(!X.ops.length) break;
          const last = X.ops[X.ops.length - 1], rest = opsS(X.ops.slice(0, -1), false), n = rI(last.n);
          let v;
          if(last.o === "add"){ v = rSub(other.v, n); mv = { kind:"sub", n:last.n }; }
          else if(last.o === "sub"){ v = rAdd(other.v, n); mv = { kind:"add", n:last.n }; }
          else if(last.o === "mul"){ v = rDiv(other.v, n); mv = { kind:"div", n:last.n }; }
          else { v = rMul(other.v, n); mv = { kind:"mul", n:last.n }; }
          nt = onTop ? rest : num(v); nb = onTop ? num(v) : rest;
        }
      }
      moves.push(mv);
      stages.push({ top:nt, bot:nb, val:evalS(hasX(nt) ? nt : nb, x) });
    }
    /* tidy: a lin side that is ready to be undone reads the same as its ops */
    return { stages, moves };
  }


  /* ================= harder equations: a side written as a list of terms =================
     {t:"ex", terms:[{s:±1, f}]}, f is one of
       {k:"x", c}                 c·x (c ≥ 1)
       {k:"n", v}                 a whole number ≥ 0 (the sign lives in s)
       {k:"br", c, m, kk, kFirst} c(m·x + kk)
       {k:"fr", top, d}           top over d, top is {k:"x"}, {k:"lin", m, kk, kFirst} or {k:"br"}
     Solving one: clear the fractions (× both sides), expand the brackets, collect like terms; then it is an ordinary
     ax + b = cx + d and the solver above takes over. Expanding and collecting are not moves on the line: the point stays. */
  const exS = terms => ({ t:"ex", terms });
  const fX = c => ({ k:"x", c }), fN = v => ({ k:"n", v }), fBr = (c, m, kk, kFirst) => ({ k:"br", c, m, kk, kFirst:!!kFirst });
  const fLin = (m, kk, kFirst) => ({ k:"lin", m, kk, kFirst:!!kFirst }), fFr = (top, d) => ({ k:"fr", top, d });
  const tm = (s, f) => ({ s, f });
  const nT = v => tm(v < 0 ? -1 : 1, fN(Math.abs(v))), xT = c => tm(c < 0 ? -1 : 1, fX(Math.abs(c)));
  /* m·x + k of a piece, exact */
  function linF(f){
    if(f.k === "x") return { m:rI(f.c), k:rI(0) };
    if(f.k === "n") return { m:rI(0), k:rI(f.v) };
    if(f.k === "lin") return { m:rI(f.m), k:rI(f.kk) };
    if(f.k === "br") return { m:rI(f.c * f.m), k:rI(f.c * f.kk) };
    const t = linF(f.top); return { m:rDiv(t.m, rI(f.d)), k:rDiv(t.k, rI(f.d)) };
  }
  function linOf(s){
    if(s.t === "num") return { m:rI(0), k:s.v };
    if(s.t !== "ex"){ const k = evalS(s, rI(0)); return { m:rSub(evalS(s, rI(1)), k), k }; }
    let m = rI(0), k = rI(0);
    s.terms.forEach(t => { const l = linF(t.f); m = rAdd(m, rMul(rI(t.s), l.m)); k = rAdd(k, rMul(rI(t.s), l.k)); });
    return { m, k };
  }
  const exVal = (s, x) => { const l = linOf(s); return rAdd(rMul(l.m, x), l.k); };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const densOf = s => s.t === "ex" ? s.terms.filter(t => t.f.k === "fr").map(t => t.f.d) : [];
  const hasBr = s => s.t === "ex" && s.terms.some(t => t.f.k === "br");
  const needCol = s => s.t === "ex" && (s.terms.filter(t => t.f.k === "x").length > 1 || s.terms.filter(t => t.f.k === "n").length > 1);
  /* the terms m·x + kk, in the order they are written */
  const linTerms = (s, m, kk, kFirst) => { const a = m ? [tm(s * Math.sign(m), fX(Math.abs(m)))] : [], b = kk ? [tm(s * Math.sign(kk), fN(Math.abs(kk)))] : []; return kFirst ? b.concat(a) : a.concat(b); };
  function mulTerm(t, L){
    const f = t.f;
    if(f.k === "x") return [tm(t.s, fX(f.c * L))];
    if(f.k === "n") return [tm(t.s, fN(f.v * L))];
    if(f.k === "br") return [tm(t.s, fBr(f.c * L, f.m, f.kk, f.kFirst))];
    if(f.k === "lin") return [tm(t.s, fBr(L, f.m, f.kk, f.kFirst))];
    const q = L / f.d, top = f.top;
    if(top.k === "x") return [tm(t.s, fX(top.c * q))];
    if(top.k === "br") return [tm(t.s, fBr(top.c * q, top.m, top.kk, top.kFirst))];
    return q === 1 ? linTerms(t.s, top.m, top.kk, top.kFirst) : [tm(t.s, fBr(q, top.m, top.kk, top.kFirst))];
  }
  /* × L: a side with a fraction is multiplied term by term (that is what clears it); any other side gets a bracket */
  function mulSide(s, L){
    if(s.t === "num") return num(rMul(s.v, rI(L)));
    if(s.t !== "ex"){ const l = linOf(s); s = exS(linTerms(1, l.m.n, l.k.n, s.kFirst)); }
    if(s.terms.some(t => t.f.k === "fr") || s.terms.length === 1) return exS(s.terms.flatMap(t => mulTerm(t, L)));
    const l = linOf(s), first = s.terms[0].f.k === "n";
    return exS([tm(1, fBr(L, l.m.n, l.k.n, first))]);
  }
  function expandSide(s){
    if(!hasBr(s)) return s;
    return exS(s.terms.flatMap(t => t.f.k === "br" ? linTerms(t.s, t.f.c * t.f.m, t.f.c * t.f.kk, t.f.kFirst) : [t]));
  }
  function collectSide(s){
    if(!needCol(s)) return s;
    const l = linOf(s), first = s.terms[0].f.k === "n";
    const out = linTerms(1, l.m.n, l.k.n, first);
    return exS(out.length ? out : [tm(1, fN(0))]);
  }
  /* a side that is now just m·x + k (or a number) goes back to the ordinary forms */
  function plainSide(s){
    if(s.t !== "ex") return s;
    const l = linOf(s);
    if(l.m.n === 0) return num(l.k);
    return linS(l.m.n, l.k.n, s.terms[0].f.k === "n" && l.k.n !== 0);
  }
  const isPlain = s => s.t !== "ex" || (!densOf(s).length && !hasBr(s) && !needCol(s));
  function exSolve(top, bot, x){
    const stages = [{ top, bot, val:exVal(top, x) }], moves = [];
    for(let g = 0; g < 8; g++){
      const cur = stages[stages.length - 1], t = cur.top, b = cur.bot;
      if(isPlain(t) && isPlain(b)) break;
      let nt, nb, mv;
      const dens = densOf(t).concat(densOf(b));
      if(dens.length){ const L = dens.reduce(lcm, 1); nt = mulSide(t, L); nb = mulSide(b, L); mv = { kind:"mul", n:L }; }
      else if(hasBr(t) || hasBr(b)){ nt = expandSide(t); nb = expandSide(b); mv = { kind:"exp", sides:{ t:hasBr(t), b:hasBr(b) } }; }
      else { nt = collectSide(t); nb = collectSide(b); mv = { kind:"col", sides:{ t:needCol(t), b:needCol(b) } }; }
      moves.push(mv); stages.push({ top:nt, bot:nb, val:exVal(nt, x) });
    }
    const last = stages[stages.length - 1];
    last.top = plainSide(last.top); last.bot = plainSide(last.bot);
    if(!isPlain(last.top) || !isPlain(last.bot)) return null;
    if(hasX(last.top) && hasX(last.bot) && last.top.m === last.bot.m) return null;
    const rest = solve(last.top, last.bot, x);
    if(!rest) return null;
    return { stages:stages.concat(rest.stages.slice(1)), moves:moves.concat(rest.moves) };
  }
  const isRewrite = mv => mv.kind === "exp" || mv.kind === "col";

  /* ================= questions ================= */
  const TWO = ["axb", "xab", "brk", "frc", "bax"], BOTH = ["both", "bbrk", "bfrc", "bhard"];
  const TYPES = TWO.concat(BOTH);
  const TYPE_NAME = { axb:"Multiply, then add or subtract", xab:"Divide, then add or subtract", brk:"Brackets", frc:"A sum, then divide",
    bax:"Taking the pronumeral away", mix:"Mixed two-step", both:"Simple", bbrk:"Involving brackets", bfrc:"Involving one fraction",
    bhard:"Harder", bmix:"Mixed: pronumerals on both sides" };
  const familyOf = t => BOTH.includes(t) || t === "bmix" ? "both" : "two";
  const fracPool = () => S.set.nw === "dec" ? [2, 4, 5, 10] : [2, 3, 4, 5];
  const nonMult = (a, lo, hi) => { for(let t = 0; t < 60; t++){ const n = ri(lo, hi); if(n % a !== 0) return n; } return a + 1; };

  /* ---- pronumerals on both sides: brackets, a fraction, harder ones ----
     Every form is built from its answer: all the numbers but one are picked, and the last one is worked out so the
     equation is true. A form that would need a non-whole number there is thrown away and another is tried. */
  function genBoth(type, wantNeg, wantFrac){
    const sg = wantNeg ? -1 : 1, pm = () => Math.random() < 0.5 ? 1 : -1;
    let x;
    if(wantFrac){ const d = pick([2, 3, 4]); x = R(sg * nonMult(d, 1, d * 6), d); } else x = rI(sg * ri(1, 10));
    const at = (side) => exVal(side, x);
    const whole = r => rInt(r) && Math.abs(r.n) <= 40 ? r.n : null;
    const swap = (A, B) => Math.random() < 0.3 ? { top:B, bot:A, x } : { top:A, bot:B, x };
    const form = type === "bbrk" ? pick(["a", "a", "b", "c"]) : type === "bfrc" ? pick(["a", "a", "b"]) : pick(["a", "b", "c", "d", "e"]);
    if(type === "bbrk"){
      const a = ri(2, 6), b = pm() * ri(1, 9);
      const A = exS([tm(1, fBr(a, 1, b))]);
      if(form === "a"){                                   /* a(x + b) = cx + d */
        const c = ri(1, 9); if(c === a) return null;
        const d = whole(rSub(at(A), rMul(rI(c), x))); if(d === null || d === 0) return null;
        return swap(A, linS(c, d));
      }
      if(form === "b"){                                   /* a(x + b) = c(x + d) */
        const c = ri(2, 6); if(c === a) return null;
        const d = whole(rSub(rDiv(at(A), rI(c)), x)); if(d === null || d === 0 || d === b) return null;
        return swap(A, exS([tm(1, fBr(c, 1, d))]));
      }
      /* a(x + b) + e = cx + d */
      const e = pm() * ri(1, 9), A2 = exS([tm(1, fBr(a, 1, b)), nT(e)]), c = ri(1, 9); if(c === a) return null;
      const d = whole(rSub(at(A2), rMul(rI(c), x))); if(d === null || d === 0) return null;
      return swap(A2, linS(c, d));
    }
    if(type === "bfrc"){
      if(form === "a"){                                   /* (ax + b)/c = dx + e */
        const a = ri(1, 4), c = ri(2, 5), d = ri(1, 4); if(a === c * d) return null;
        const V = Math.round(rF(rMul(rI(a), x)) / c) + ri(-3, 4), b = whole(rSub(rI(c * V), rMul(rI(a), x)));
        if(b === null || b === 0 || Math.abs(b) > 20) return null;
        const A = exS([tm(1, fFr(a === 1 ? fLin(1, b) : fLin(a, b), c))]);
        const e = whole(rSub(rI(V), rMul(rI(d), x))); if(e === null || e === 0) return null;
        return swap(A, linS(d, e));
      }
      /* x/c + b = dx + e */
      const c = ri(2, 5), b = pm() * ri(1, 9), d = ri(1, 3);
      const A = exS([tm(1, fFr(fX(1), c)), nT(b)]);
      const e = whole(rSub(at(A), rMul(rI(d), x))); if(e === null || e === 0) return null;
      return swap(A, linS(d, e));
    }
    /* harder */
    if(form === "a"){                                     /* a(x + b) − c(x + d) = ex + f */
      const a = ri(3, 7), c = ri(2, a - 1), b = pm() * ri(1, 8), d = pm() * ri(1, 8), e = ri(1, 5); if(a - c === e || b === d) return null;
      const A = exS([tm(1, fBr(a, 1, b)), tm(-1, fBr(c, 1, d))]);
      const f = whole(rSub(at(A), rMul(rI(e), x))); if(f === null || f === 0) return null;
      return { top:A, bot:linS(e, f), x };
    }
    if(form === "b"){                                     /* (x + a)/b = (x + c)/d */
      const b = ri(2, 5), d = ri(2, 6); if(b === d) return null;
      const V = Math.round(rF(x) / Math.max(b, d)) + ri(-2, 3);
      const a = whole(rSub(rI(b * V), x)), c = whole(rSub(rI(d * V), x));
      if(a === null || c === null || a === 0 || c === 0 || a === c || Math.abs(a) > 20 || Math.abs(c) > 20) return null;
      return { top:exS([tm(1, fFr(fLin(1, a), b))]), bot:exS([tm(1, fFr(fLin(1, c), d))]), x };
    }
    if(form === "c"){                                     /* b − a(x + c) = dx + e */
      const a = ri(2, 5), c = ri(1, 6), b = ri(10, 40), d = ri(1, 5);
      const A = exS([nT(b), tm(-1, fBr(a, 1, c))]);
      const e = whole(rSub(at(A), rMul(rI(d), x))); if(e === null || e === 0) return null;
      return swap(A, linS(d, e));
    }
    if(form === "d"){                                     /* x/a + b = x/c + d */
      const a = ri(2, 5), c = ri(2, 6); if(a === c) return null;
      const b = pm() * ri(1, 9), A = exS([tm(1, fFr(fX(1), a)), nT(b)]);
      const d = whole(rSub(at(A), rDiv(x, rI(c)))); if(d === null || d === 0) return null;
      return { top:A, bot:exS([tm(1, fFr(fX(1), c)), nT(d)]), x };
    }
    /* a(x + b) = c(x + d) + e */
    const a = ri(2, 6), c = ri(2, 6); if(a === c) return null;
    const b = pm() * ri(1, 8), d = pm() * ri(1, 8); if(b === d) return null;
    const A = exS([tm(1, fBr(a, 1, b))]);
    const e = whole(rSub(at(A), rMul(rI(c), rAdd(x, rI(d))))); if(e === null || e === 0) return null;
    return swap(A, exS([tm(1, fBr(c, 1, d)), nT(e)]));
  }
  function genType(type, wantNeg, wantFrac){
    if(type !== "both" && BOTH.includes(type)) return genBoth(type, wantNeg, wantFrac);
    const sg = wantNeg ? -1 : 1, pm = () => Math.random() < 0.5 ? 1 : -1;
    if(type === "axb"){
      const sgn = pm(), b = ri(1, 12); let a, x;
      if(wantFrac){ a = pick(fracPool()); x = R(sg * nonMult(a, 1, a * 9), a); } else { a = ri(2, 9); x = rI(sg * ri(1, 12)); }
      const c = rAdd(rMul(rI(a), x), rI(sgn * b));
      return { top:opsS([{ o:"mul", n:a }, { o:sgn > 0 ? "add" : "sub", n:b }]), bot:num(c), x };
    }
    if(type === "xab"){
      const a = ri(2, 8), q = sg * ri(1, 10), sgn = pm(), b = ri(1, 12);
      return { top:opsS([{ o:"div", n:a }, { o:sgn > 0 ? "add" : "sub", n:b }]), bot:num(q + sgn * b), x:rI(a * q) };
    }
    if(type === "brk"){
      const sgn = pm(), b = ri(1, 9); let a, u;
      if(wantFrac){ a = pick(fracPool()); u = R(pm() * nonMult(a, 1, a * 9), a); } else { a = ri(2, 8); u = rI(pm() * ri(1, 12)); }
      const x = rSub(u, rI(sgn * b));
      return { top:opsS([{ o:sgn > 0 ? "add" : "sub", n:b }, { o:"mul", n:a }]), bot:num(rMul(rI(a), u)), x };
    }
    if(type === "frc"){
      const a = ri(2, 8), c = pm() * ri(1, 10), sgn = pm(), b = ri(1, 12);
      return { top:opsS([{ o:sgn > 0 ? "add" : "sub", n:b }, { o:"div", n:a }]), bot:num(c), x:rI(a * c - sgn * b) };
    }
    if(type === "bax"){
      let a, x; const b = ri(2, 30);
      if(wantFrac){ a = pick(fracPool()); x = R(sg * nonMult(a, 1, a * 8), a); } else { a = ri(1, 7); x = rI(sg * ri(1, 10)); }
      const c = rSub(rI(b), rMul(rI(a), x));
      return { top:linS(-a, b), bot:num(c), x };
    }
    /* both sides */
    let big, small, x;
    if(wantFrac){ const dlt = pick(fracPool().filter(d => d <= 5)); small = ri(1, 5); big = small + dlt; x = R(sg * nonMult(dlt, 1, dlt * 8), dlt); }
    else { big = ri(2, 9); small = ri(1, big - 1); x = rI(sg * ri(1, 10)); }
    let neg2 = S.set.vary && Math.random() < 0.25;
    const k1 = Math.random() < 0.12 ? 0 : ri(-9, 12);
    let A, B;
    if(neg2){
      const k2 = rAdd(rMul(rI(big + small), x), rI(k1)); if(!rInt(k2)) return null;
      A = linS(big, k1); B = linS(-small, k2.n);
    } else {
      const k2 = rAdd(rMul(rI(big - small), x), rI(k1)); if(!rInt(k2)) return null;
      if(k1 === 0 && k2.n === 0) return null;
      A = linS(big, k1); B = linS(small, k2.n);
    }
    if(A.k === 0 && B.k === 0) return null;
    return Math.random() < 0.35 ? { top:B, bot:A, x } : { top:A, bot:B, x };
  }
  const FRAC_OK = { axb:1, brk:1, bax:1, both:1, bbrk:1, bfrc:1, bhard:1 };
  function sigOf(q){ return JSON.stringify([q.stages[0].top, q.stages[0].bot]); }
  function finish(g, v, own){
    const sol = g.top.t === "ex" || g.bot.t === "ex" ? exSolve(g.top, g.bot, g.x) : solve(g.top, g.bot, g.x);
    if(!sol || !sol.moves.length) return null;
    const q = { v:v || "x", x:g.x, stages:sol.stages, moves:sol.moves, type:g.type || "own", own:!!own };
    return q;
  }
  function okQ(q, wantNeg){
    const vals = q.stages.map(s => rF(s.val));
    const lim = q.type && BOTH.includes(q.type) && q.type !== "both" ? 160 : 99;
    if(vals.some(v => v === 0 || Math.abs(v) > lim)) return false;
    if(!q.stages.every(s => [s.top, s.bot].every(sd => sd.t !== "lin" || (Math.abs(sd.k) <= 60 && !(sd.m < 0 && sd.k <= 0))))) return false;
    if(q.stages[0].top.t === "num" && Math.abs(rF(q.stages[0].top.v)) > 99) return false;
    const xf = rF(q.x);
    if(wantNeg){ if(xf >= 0) return false; }
    else {
      if(xf <= 0 || vals.some(v => v < 0)) return false;
      /* no negative number is written anywhere */
      if(!q.stages.every(s => [s.top, s.bot].every(sd => sd.t !== "num" || rF(sd.v) > 0))) return false;
      if(!q.stages.every(s => [s.top, s.bot].every(sd => sd.t !== "lin" || (sd.m > 0 ? true : sd.k > 0)))) return false;
    }
    return true;
  }

  /* ================= pieces: one description of a bit of maths, drawn as HTML or SVG =================
     {v:1} the letter · {n:"5"} a number · {o:"+"} an operator · {fr:[top, bottom]} a fraction · {t:"("} text */
  const V = { v:1 }, N = n => ({ n:fmt(n) }), O = o => ({ o }), T = t => ({ t });
  const MINUS = "−", TIMES = "×", DIVIDE = "÷";
  const fracOn = () => S.set.div === "frac";
  const termP = m => Math.abs(m) === 1 ? (m < 0 ? [T(MINUS), V] : [V]) : [N(m), V];
  function decStr(r){ let d = r.d, k = 0; while(d % 2 === 0){ d /= 2; k++; } let j = 0; while(d % 5 === 0){ d /= 5; j++; } if(d !== 1) return null; return fmt(+(r.n / r.d).toFixed(Math.max(k, j))); }
  function valP(r){
    if(rInt(r)) return [N(r.n)];
    const a = Math.abs(r.n), sign = r.n < 0 ? [T(MINUS)] : [];
    if(S.set.nw === "dec"){ const s = decStr(r); if(s) return [{ n:s }]; }
    if(S.set.nw === "mixed" && a > r.d) return [...sign, N(Math.floor(a / r.d)), { fr:[[N(a % r.d)], [N(r.d)]] }];
    return [...sign, { fr:[[N(a)], [N(r.d)]] }];
  }
  const hasSum = p => p.some(it => it.o === "+" || it.o === MINUS);
  const wrap = p => [T("("), ...p, T(")")];
  /* a side written as terms (brackets, fractions, several terms) */
  function linPcs(m, k, kFirst){
    if(k === 0) return termP(m);
    if(m < 0 && k > 0) return [N(k), O(MINUS), ...termP(-m)];
    if(kFirst && k > 0) return [N(k), O(m < 0 ? MINUS : "+"), ...termP(Math.abs(m))];
    return [...termP(m), O(k > 0 ? "+" : MINUS), N(Math.abs(k))];
  }
  function factorP(f){
    if(f.k === "x") return termP(f.c);
    if(f.k === "n") return [N(f.v)];
    if(f.k === "lin") return linPcs(f.m, f.kk, f.kFirst);
    if(f.k === "br"){ const inner = wrap(linPcs(f.m, f.kk, f.kFirst)); return f.c === 1 ? inner : [N(f.c), ...inner]; }
    const tp = factorP(f.top);
    return fracOn() ? [{ fr:[tp, [N(f.d)]] }] : [...(hasSum(tp) && f.top.k !== "br" ? wrap(tp) : tp), O(DIVIDE), N(f.d)];
  }
  const exP = s => s.terms.flatMap((t, i) => { const p = factorP(t.f); return i === 0 ? (t.s < 0 ? [T(MINUS), ...p] : p) : [O(t.s < 0 ? MINUS : "+"), ...p]; });
  /* the answer put in for the letter, anywhere in a list of pieces: 3x is 3 × 4, 2(x + 1) is 2 × (4 + 1) */
  function substP(p, x, inFr){
    /* inside a fraction a fractional answer is written on one line, (3/2), since a fraction can't sit in a fraction here */
    let xv = valP(x);
    if(inFr && xv.some(it => it.fr)) xv = [T("(")].concat(xv.flatMap(it => it.fr ? [...it.fr[0], T("/"), ...it.fr[1]] : [it]), [T(")")]);
    const neg = x.n < 0, xb = (neg || (!rInt(x) && !xv.some(it => it.fr))) && xv[0].t !== "(" ? wrap(xv) : xv, out = [];
    p.forEach((it, i) => {
      const prev = p[i - 1];
      if(it.v){ if(prev && prev.n != null) out.push(O(TIMES), ...xb); else out.push(...xb); }
      else if(it.fr) out.push({ fr:[substP(it.fr[0], x, true), substP(it.fr[1], x, true)] });
      else if(it.t === "(" && prev && prev.n != null) out.push(O(TIMES), it);
      else out.push(it);
    });
    return out;
  }
  function sideP(s){
    if(s.t === "num") return valP(s.v);
    if(s.t === "ex") return exP(s);
    if(s.t === "lin"){
      if(s.k === 0) return termP(s.m);
      if(s.m < 0 && s.k > 0) return [N(s.k), O(MINUS), ...termP(-s.m)];
      if(s.kFirst && s.k > 0) return [N(s.k), O("+"), ...termP(s.m)];
      return [...termP(s.m), O(s.k > 0 ? "+" : MINUS), N(Math.abs(s.k))];
    }
    let cur = [V];
    s.ops.forEach((op, i) => {
      const lastOne = i === s.ops.length - 1;
      if(op.o === "mul") cur = cur.length === 1 && cur[0].v ? [N(op.n), V] : [N(op.n), ...wrap(cur)];
      else if(op.o === "add") cur = s.kFirst && lastOne ? [N(op.n), O("+"), ...cur] : [...cur, O("+"), N(op.n)];
      else if(op.o === "sub") cur = [...cur, O(MINUS), N(op.n)];
      else cur = fracOn() ? [{ fr:[cur, [N(op.n)]] }] : [...(hasSum(cur) ? wrap(cur) : cur), O(DIVIDE), N(op.n)];
    });
    return cur;
  }
  /* the same side with the answer put in for the letter */
  function subP(s, x){
    if(s.t === "ex") return substP(exP(s), x);
    const neg = x.n < 0, xv = valP(x), xb = neg || (!rInt(x) && !xv.some(it => it.fr)) ? wrap(xv) : xv;
    if(s.t === "num") return valP(s.v);
    const times = m => Math.abs(m) === 1 ? (m < 0 ? [T(MINUS), ...wrap(xv)] : xv) : [N(m), O(TIMES), ...xb];
    if(s.t === "lin"){
      if(s.k === 0) return times(s.m);
      if(s.m < 0 && s.k > 0) return [N(s.k), O(MINUS), ...(s.m === -1 ? xb : times(-s.m))];
      if(s.kFirst && s.k > 0) return [N(s.k), O("+"), ...(s.m === 1 ? xb : times(s.m))];
      return [...times(s.m), O(s.k > 0 ? "+" : MINUS), N(Math.abs(s.k))];
    }
    let cur = xv, atom = true;
    s.ops.forEach((op, i) => {
      const lastOne = i === s.ops.length - 1;
      if(op.o === "mul") cur = [N(op.n), O(TIMES), ...(atom ? xb : wrap(cur))];
      else if(op.o === "add") cur = s.kFirst && lastOne ? [N(op.n), O("+"), ...(atom ? xb : cur)] : [...cur, O("+"), N(op.n)];
      else if(op.o === "sub") cur = [...cur, O(MINUS), N(op.n)];
      else cur = fracOn() && !cur.some(it => it.fr) ? [{ fr:[cur, [N(op.n)]] }] : [...(hasSum(cur) || (atom && neg) ? wrap(atom ? xv : cur) : cur), O(DIVIDE), N(op.n)];
      atom = false;
    });
    return cur;
  }
  function H(p){
    return p.map(it => it.v ? letterHTML(LV())
      : it.n != null ? `<span>${it.n}</span>`
      : it.o ? `<span class="op">${it.o}</span>`
      : it.fr ? `<span class="frac"><span class="fn">${H(it.fr[0])}</span><span class="fd">${H(it.fr[1])}</span></span>`
      : it.ans ? `<span class="ans">${H(it.ans)}</span>`
      : `<span>${it.t}</span>`).join("");
  }
  const eqHTML = p => `<span class="eq">${H(p)}</span>`;
  const hasFr = p => p.some(it => it.fr);
  /* SVG text: runs of inline text and stacked fractions, side by side */
  const runTxt = items => items.map(it => it.v ? (MATH_ALPHA ? mathItalic(LV()) : LV()) : it.n != null ? it.n : it.o ? ` ${it.o} ` : it.t || "").join("");
  function segsOf(p, size){
    const segs = []; let run = [];
    const flush = () => { if(run.length){ segs.push({ run, w:tw(runTxt(run), size) * 1.03 }); run = []; } };
    p.forEach(it => { if(it.fr){ flush(); const s2 = size * 0.74; segs.push({ fr:it.fr, w:Math.max(measureP(it.fr[0], s2), measureP(it.fr[1], s2)) + size * 0.22 }); } else run.push(it); });
    flush(); return segs;
  }
  function measureP(p, size){ const sg = segsOf(p, size); return sg.reduce((a, s) => a + s.w, 0) + Math.max(0, sg.length - 1) * size * 0.07; }
  function svgLetter(){ return MATH_ALPHA ? `<tspan>${mathItalic(LV())}</tspan>` : `<tspan font-style="italic" style="font-family:var(--itFont)">${esc(LV())}</tspan>`; }
  const svgIn = items => items.map(it => it.v ? svgLetter() : it.n != null ? `<tspan>${it.n}</tspan>` : it.o ? `<tspan> ${it.o} </tspan>` : `<tspan>${esc(it.t || "")}</tspan>`).join("");
  const f1 = v => v.toFixed(1);
  function pSVG(p, x, y, size, col){
    const sg = segsOf(p, size), gap = size * 0.07, total = sg.reduce((a, s) => a + s.w, 0) + Math.max(0, sg.length - 1) * gap;
    let cx = x - total / 2, out = "";
    const txt = (items, tx, ty, sz) => `<text xml:space="preserve" x="${f1(tx)}" y="${f1(ty)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(sz)}" fill="${col}">${svgIn(items)}</text>`;
    sg.forEach(s => {
      const mid = cx + s.w / 2;
      if(s.run) out += txt(s.run, mid, y, size);
      else {
        const s2 = size * 0.74;
        out += txt(s.fr[0], mid, y - size * 0.47, s2) +
          `<line x1="${f1(mid - s.w / 2 + size * 0.03)}" x2="${f1(mid + s.w / 2 - size * 0.03)}" y1="${f1(y)}" y2="${f1(y)}" stroke="${col}" stroke-width="${f1(Math.max(1.6, size * 0.06))}" stroke-linecap="round"/>` +
          txt(s.fr[1], mid, y + size * 0.5, s2);
      }
      cx += s.w + gap;
    });
    return out;
  }

  /* ================= steps =================
     "s"            the equation as one point
     "t{i}"         (setting) move i on the top line only, the bottom still a ?
     "m{i}"         move i on both lines
     "r{i}"         reset: the new, simpler equation as one point
     "check"        put the answer back into the first equation */
  let IDS = [];
  function stepIds(q){
    const s = ["s"];
    q.moves.forEach((m, i) => { if(isRewrite(m)){ s.push("w" + i); return; } if(S.set.split) s.push("t" + i); s.push("m" + i); s.push("r" + i); });
    if(S.set.check) s.push("check");
    return s;
  }
  const sid = () => IDS[S.step];
  const kindOf = id => id === "check" ? "check" : id[0];
  const idxOf = id => id === "check" || id === "s" ? 0 : parseInt(id.slice(1), 10);
  /* the latest equation on the board at a step */
  function stageAt(id){ const k = kindOf(id); return k === "s" ? 0 : k === "t" ? idxOf(id) : k === "check" ? S.q.stages.length - 1 : idxOf(id) + 1; }
  /* a side that is written the same way in stages j … i keeps one key, so it stays put instead of fading and coming back */
  const pkey = p => JSON.stringify(p);
  const keyT = i => { let j = i; while(j > 0 && pkey(topP(j - 1)) === pkey(topP(j))) j--; return "lt" + j; };
  const keyB = i => { let j = i; while(j > 0 && pkey(botP(j - 1)) === pkey(botP(j))) j--; return "lb" + j; };
  const topP = i => sideP(S.q.stages[i].top), botP = i => sideP(S.q.stages[i].bot);
  const eqP = i => [...topP(i), O("="), ...botP(i)];
  function pillText(mv){
    if(mv.kind === "sub") return MINUS + " " + mv.n;
    if(mv.kind === "add") return "+ " + mv.n;
    if(mv.kind === "div") return DIVIDE + " " + mv.n;
    if(mv.kind === "mul") return TIMES + " " + mv.n;
    if(mv.kind === "exp") return "expand";
    if(mv.kind === "col") return "collect";
    const a = Math.abs(mv.s), L = MATH_ALPHA ? mathItalic(LV()) : LV();
    return (mv.s > 0 ? MINUS + " " : "+ ") + (a === 1 ? "" : a) + L;
  }
  const pillHTML = mv => `<b class="cUndo">${esc(pillText(mv))}</b>`;

  /* ================= layout (real pixels: the board is drawn at the size it is shown) ================= */
  const L = {};
  function layout(){
    const wrapEl = $("boardWrap"), q = S.q;
    const W = Math.max(240, wrapEl.clientWidth), Hh = Math.max(170, wrapEl.clientHeight);
    L.W = W; L.H = Hh;
    let fr = false;
    q.stages.forEach((st, i) => { if(hasFr(topP(i)) || hasFr(botP(i))) fr = true; });
    L.fracs = fr;
    let fsM = Math.min(58, Hh / (fr ? 8.7 : 7.4), W / 15);
    fsM = Math.max(15, fsM);
    L.fsM = fsM; L.fsS = fsM * 0.6;
    L.tk = fsM * 0.44; L.tkm = L.tk * 0.6; L.arcH = fsM * 0.62;
    L.half = fr ? fsM * 0.86 : fsM * 0.55;
    L.d = L.tk + L.arcH * 0.95 + L.half;
    L.y0 = Math.round(Hh / 2);
    L.yLt = L.y0 - L.d; L.yLb = L.y0 + L.d;
    L.yAt = L.yLt - L.half - fsM * 0.2; L.yAb = L.yLb + L.half + fsM * 0.2;
    L.arrH = fsM * 1.05;
    L.cx = W / 2;
    return L;
  }
  const fit = (p, size, maxW) => { const w = measureP(p, size); return w > maxW ? Math.max(7, size * maxW / w) : size; };

  /* ================= scenes: the board at a step is a list of keyed elements ================= */
  const COL = { ink:"#0f172a", line:"#334155", soft:"#94a3b8", top:"#1d4ed8", bot:"#15803d", undo:"#7c3aed", undoBg:"#f5f3ff", q:"#64748b" };
  const tick = (key, x, major, o, d) => ({ key, type:"tick", x, y:L.y0, h:major ? L.tk : L.tkm, w:major ? Math.max(3.5, L.fsM * 0.09) : Math.max(2.2, L.fsM * 0.055), col:major ? COL.ink : COL.soft, o, d:d || 0, z:4 });
  const lab = (key, x, top, p, size, col, o, d, extra) => Object.assign({ key, type:"lab", x, y:top ? L.yLt : L.yLb, p, size, col, o, d:d || 0, z:5 }, extra || {});
  const pill = (key, x, y, text, o, d) => ({ key, type:"pill", x, y, text, col:COL.undo, bg:COL.undoBg, o, d:d || 0, z:6 });
  const hop = (key, x1, x2, side, o, d, dash) => ({ key, type:"hop", x1, x2, y:L.y0 + side * L.tkm * 1.05, h:L.arcH * 1.75, side, col:COL.undo, o, d:d || 0, head:true, dash:!!dash, w:Math.max(2.4, L.fsM * 0.07), z:3 });
  const arrow = (key, x1, x2, side, o, d) => ({ key, type:"hop", x1, x2, y:side < 0 ? L.yAt : L.yAb, h:L.arrH, side, col:COL.undo, o, d:d || 0, head:true, w:Math.max(2.4, L.fsM * 0.07), z:3 });
  const loop = (key, x1, x2, o, d) => ({ key, type:"loop", x1, x2, y:L.y0, ry:L.arcH * 0.95, o, d:d || 0, z:2 });

  function scene(id){
    const q = S.q, els = [{ key:"axis", type:"axis", x1:6, x2:L.W - 6, y:L.y0, o:1, z:1 }];
    const k = kindOf(id);
    if(k === "s") seeScene(0, els);
    else if(k === "r") seeScene(idxOf(id) + 1, els);
    else if(k === "t") moveScene(idxOf(id), true, els);
    else if(k === "m") moveScene(idxOf(id), false, els);
    else if(k === "w") rewriteScene(idxOf(id), els);
    else checkScene(els);
    return els;
  }
  function tags(els, o){
    if(!S.set.sides || L.W < 560) return;
    els.push({ key:"tagT", type:"tag", x:14, y:L.yLt, text:"LEFT SIDE", col:COL.top, o, z:1 });
    els.push({ key:"tagB", type:"tag", x:14, y:L.yLb, text:"RIGHT SIDE", col:COL.bot, o, z:1 });
  }
  /* one point: an equation says two things are at the same place */
  function seeScene(i, els){
    const q = S.q, st = q.stages[i], last = i === q.stages.length - 1, big = L.fsM * 1.14;
    const tp = topP(i), bp = botP(i), size = Math.min(fit(tp, big, L.W * 0.7), fit(bp, big, L.W * 0.7));
    els.push({ key:"halo", type:"halo", x:L.cx, y:L.y0, r:L.fsM * 2.1, o:1, z:0 });
    els.push(tick("p" + i, L.cx, true, 1));
    els.push(lab(keyT(i), L.cx, true, tp, size, COL.top, 1, 0, { bg:last && st.top.t === "num" }));
    els.push(lab(keyB(i), L.cx, false, bp, size, COL.bot, 1, 0, { bg:last && st.bot.t === "num" }));
    tags(els, 1);
    return size;
  }
  /* written another way (expand, collect): the point does not move. The old way shrinks into a grey note beside its side. */
  function rewriteScene(i, els){
    const q = S.q, mv = q.moves[i], size = seeScene(i + 1, els), gs = Math.min(size * 0.56, L.fsM * 0.62), text = pillText(mv);
    const fs = L.fsS * 0.85, pw = tw(text, fs, UI, 900) + fs * 1.05;
    [[mv.sides.t, topP(i), true, keyT(i), "t"], [mv.sides.b, botP(i), false, keyB(i), "b"]].forEach(([on, p, top, key, s2]) => {
      if(!on) return;
      const half = (hasFr(p) ? 0.95 : 0.6) * gs, newHalf = L.half * size / (L.fsM * 1.14);
      const y = top ? L.yLt - newHalf - L.fsM * 0.32 - half : L.yLb + newHalf + L.fsM * 0.32 + half;
      const g = fit(p, gs, L.W * 0.62), w = measureP(p, g);
      const gx = L.cx - (pw + 12) / 2;
      els.push(lab(key, gx, top, p, g, COL.q, 0.85, 0, { y }));
      els.push({ key:"pw" + i + s2, type:"pill", x:gx + w / 2 + 12 + pw / 2, y, text, col:"#64748b", bg:"#f1f5f9", o:1, d:0.25, z:6, fs });
    });
  }
  function moveGeom(i){
    const q = S.q, mv = q.moves[i], a = q.stages[i], b = q.stages[i + 1], W = L.W;
    if(mv.kind === "div" || mv.kind === "mul"){
      const whole = mv.kind === "div" ? a : b, sgn = rF(whole.val) < 0 ? -1 : 1, n = mv.n;
      const left = W * 0.13, right = W * 0.87, step = (right - left) / n;
      const pos = j => sgn > 0 ? left + j * step : right - j * step;
      return { mult:true, n, step, pos, x1:mv.kind === "div" ? pos(n) : pos(1), x2:mv.kind === "div" ? pos(1) : pos(n), unitI:mv.kind === "div" ? i + 1 : i, wholeI:mv.kind === "div" ? i : i + 1 };
    }
    const dir = rF(b.val) > rF(a.val) ? 1 : -1, xa = W * 0.25, xb = W * 0.75;
    return { mult:false, x1:dir > 0 ? xa : xb, x2:dir > 0 ? xb : xa, dir };
  }
  function moveScene(i, topOnly, els){
    const q = S.q, mv = q.moves[i], g = moveGeom(i), fsM = L.fsM, text = pillText(mv);
    const pw = tw(text, L.fsS * 0.95, UI, 900) + L.fsS * 1.05;
    const t1 = topP(i), b1 = botP(i), t2 = topP(i + 1), b2 = botP(i + 1), qm = [T("?")];
    const last = i + 1 === q.stages.length - 1, st2 = q.stages[i + 1];
    let s1, s2;
    if(g.mult){
      const zs = Math.min(fsM * 0.9, g.step * 0.42), z = measureP([N(0)], zs) / 2;
      const wholeIs1 = mv.kind === "div";
      const wT = wholeIs1 ? t1 : t2, wB = wholeIs1 ? b1 : b2, uT = wholeIs1 ? t2 : t1, uB = wholeIs1 ? b2 : b1;
      const maxWhole = 2 * (L.W * 0.13 - 8);
      const sW = Math.min(fit(wT, fsM, maxWhole), fit(wB, fsM, maxWhole));
      const wholeHalf = Math.max(measureP(wT, sW), measureP(wB, sW)) / 2;
      const maxUnit = 2 * Math.min(g.step - z - 10, g.n === 1 ? 1e9 : (g.n - 1) * g.step - wholeHalf - 12);
      const boxPad = last ? fsM * 0.5 : 0;
      let sU = Math.min(fit(uT, fsM, maxUnit - boxPad), fit(uB, fsM, maxUnit - boxPad));
      /* many small parts (× 20): if one part still won't fit beside the 0, the 0 tick keeps quiet and the part gets the room */
      const uHalf = Math.max(measureP(uT, sU), measureP(uB, sU)) / 2, noZero = uHalf + z + 4 > g.step;
      if(noZero){ const room = 2 * (g.step - 6) - boxPad; sU = Math.min(fit(uT, fsM, room), fit(uB, fsM, room)); }
      s1 = wholeIs1 ? sW : sU; s2 = wholeIs1 ? sU : sW;
      els.push(tick("z" + i, g.pos(0), true, 1, 0.05));
      if(!noZero){
        els.push(lab("zt" + i, g.pos(0), true, [N(0)], zs, COL.ink, 1, 0.05));
        els.push(lab("zb" + i, g.pos(0), false, [N(0)], zs, COL.ink, 1, 0.05));
      }
      for(let j = 2; j < g.n; j++) els.push(tick("mt" + i + "_" + j, g.pos(j), false, 1, 0.08 + 0.2 * j / g.n));
      if(S.set.parts) for(let j = 0; j < g.n; j++){ const a = g.pos(j), b = g.pos(j + 1); els.push(loop("g" + i + "_" + j, Math.min(a, b), Math.max(a, b), 1, 0.08 + 0.2 * j / g.n)); }
      if(S.set.moves){
        const mid = (g.x1 + g.x2) / 2;
        els.push(arrow("h" + i + "t", g.x1, g.x2, -1, 1, 0.2));
        els.push(pill("pl" + i + "t", mid, L.yAt - L.arrH * 0.5, text, 1, 0.22));
        if(!topOnly){
          els.push(arrow("h" + i + "b", g.x1, g.x2, 1, 1, 0.3));
          els.push(pill("pl" + i + "b", mid, L.yAb + L.arrH * 0.5, text, 1, 0.32));
        }
      }
    } else {
      const half = L.W * 0.25 - pw / 2 - 12, boxPad = last ? fsM * 0.5 : 0;
      const s = Math.min(fit(t1, fsM, 2 * half), fit(b1, fsM, 2 * half), fit(t2, fsM, 2 * half - boxPad), fit(b2, fsM, 2 * half - boxPad));
      s1 = s2 = s;
      if(mv.kind !== "xterm" && mv.n <= 20 && S.set.parts){
        for(let j = 1; j < mv.n; j++) els.push(tick("mt" + i + "_" + j, g.x1 + (g.x2 - g.x1) * j / mv.n, false, 1, 0.06 + 0.2 * j / mv.n));
      }
      if(S.set.moves){
        const mid = (g.x1 + g.x2) / 2, dash = mv.kind === "xterm";
        els.push(hop("h" + i + "t", g.x1, g.x2, -1, 1, 0.16, dash));
        els.push(pill("pl" + i + "t", mid, L.yLt, text, 1, 0.2));
        if(!topOnly){
          els.push(hop("h" + i + "b", g.x1, g.x2, 1, 1, 0.28, dash));
          els.push(pill("pl" + i + "b", mid, L.yLb, text, 1, 0.3));
        }
      }
    }
    els.push({ key:"halo", type:"halo", x:g.x1, y:L.y0, r:fsM * 2.1, o:0, z:0 });
    els.push(tick("p" + i, g.x1, true, 1));
    els.push(lab(keyT(i), g.x1, true, t1, s1, COL.top, 1));
    els.push(lab(keyB(i), g.x1, false, b1, s1, COL.bot, 1));
    els.push(tick("p" + (i + 1), g.x2, true, 1, 0.24));
    const hid = sk => S.hide && S.hide.i === i && S.hide.side === sk;
    if(hid("top")) els.push(lab("q" + i + "t", g.x2, true, qm, s2 * 1.1, COL.q, 1, 0.3));
    else els.push(lab(keyT(i + 1), g.x2, true, t2, s2, COL.top, 1, 0.3, { bg:last && st2.top.t === "num" }));
    if(topOnly) els.push(lab("q" + i, g.x2, false, qm, s2 * 1.1, COL.q, 1, 0.3));
    else if(hid("bot")) els.push(lab("q" + i + "b", g.x2, false, qm, s2 * 1.1, COL.q, 1, 0.42));
    else els.push(lab(keyB(i + 1), g.x2, false, b2, s2, COL.bot, 1, 0.42, { bg:last && st2.bot.t === "num" }));
    tags(els, 0);
  }
  function checkP(){
    const q = S.q, st = q.stages[0], v = valP(st.val);
    const one = sd => sd.t === "num" ? valP(sd.v) : [...subP(sd, q.x), O("="), ...v];
    return { top:one(st.top), bot:one(st.bot) };
  }
  function checkScene(els){
    const c = checkP(), size = Math.min(fit(c.top, L.fsM, L.W * 0.8), fit(c.bot, L.fsM, L.W * 0.8));
    els.push({ key:"halo", type:"halo", x:L.cx, y:L.y0, r:L.fsM * 2.1, o:1, z:0 });
    els.push(tick("pc", L.cx, true, 1));
    els.push(lab("ltc", L.cx, true, c.top, size, COL.top, 1, 0.05));
    els.push(lab("lbc", L.cx, false, c.bot, size, COL.bot, 1, 0.15));
    const r = L.fsM * 0.3;
    [[c.top, L.yLt, "ck"], [c.bot, L.yLb, "ck2"]].forEach(([p, y, key], j) => els.push({ key, type:"badge", x:Math.min(L.W - r - 4, L.cx + measureP(p, size) / 2 + r + 12), y, r, o:1, d:0.3 + j * 0.08, z:7 }));
    tags(els, 1);
  }

  /* ================= drawing ================= */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  function labSVG(e){
    let bg = "";
    if(e.bg){
      const w = measureP(e.p, e.size) + e.size * 0.5, h = hasFr(e.p) ? e.size * 1.9 : e.size * 1.18;
      bg = `<rect x="${f1(e.x - w / 2)}" y="${f1(e.y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(e.size * 0.22)}" fill="#fef9c3" stroke="#fde047" stroke-width="1.5"/>`;
    }
    return `<g data-key="${e.key}" opacity="${e.o.toFixed(3)}">${bg}${pSVG(e.p, e.x, e.y, e.size, e.col)}</g>`;
  }
  function hopPath(e){ const mx = (e.x1 + e.x2) / 2, cy = e.y + e.side * e.h; return `M${f1(e.x1)} ${f1(e.y)}Q${f1(mx)} ${f1(cy)} ${f1(e.x2)} ${f1(e.y)}`; }
  function headSVG(e){
    const mx = (e.x1 + e.x2) / 2, cy = e.y + e.side * e.h;
    const ang = Math.atan2(e.y - cy, e.x2 - mx), s = e.w * 3.4;
    const bx = e.x2 - Math.cos(ang) * s, by = e.y - Math.sin(ang) * s, wx = -Math.sin(ang) * s * 0.55, wy = Math.cos(ang) * s * 0.55;
    return `<polygon points="${f1(e.x2)},${f1(e.y)} ${f1(bx + wx)},${f1(by + wy)} ${f1(bx - wx)},${f1(by - wy)}" fill="${e.col}"/>`;
  }
  function drawEls(list){
    const out = [];
    list.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(e => {
      if(e.o <= 0.004) return;
      const op = e.o.toFixed(3);
      if(e.type === "axis") out.push(`<line x1="${f1(e.x1)}" x2="${f1(e.x2)}" y1="${f1(e.y)}" y2="${f1(e.y)}" stroke="${COL.line}" stroke-width="${f1(Math.max(3, L.fsM * 0.085))}" stroke-linecap="round" opacity="${op}"/>`);
      else if(e.type === "halo") out.push(`<circle class="halo" cx="${f1(e.x)}" cy="${f1(e.y)}" r="${f1(e.r)}" fill="url(#haloG)" opacity="${op}"/>`);
      else if(e.type === "tick") out.push(`<line data-key="${e.key}" x1="${f1(e.x)}" x2="${f1(e.x)}" y1="${f1(e.y - e.h)}" y2="${f1(e.y + e.h)}" stroke="${e.col}" stroke-width="${f1(e.w)}" stroke-linecap="round" opacity="${op}"/>`);
      else if(e.type === "lab") out.push(labSVG(e));
      else if(e.type === "tag") out.push(`<text x="${f1(e.x)}" y="${f1(e.y)}" dominant-baseline="central" font-size="${f1(clamp(L.fsM * 0.22, 9.5, 12.5))}" fill="${e.col}" opacity="${(e.o * 0.75).toFixed(3)}" style='font-family:${UI};font-weight:900;letter-spacing:.08em'>${e.text}</text>`);
      else if(e.type === "badge"){
        const r = e.r, x = e.x, y = e.y;
        out.push(`<g data-key="${e.key}" opacity="${op}"><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${COL.bot}" stroke="#fff" stroke-width="2"/>` +
          `<path d="M${f1(x - r * 0.45)} ${f1(y + r * 0.02)}L${f1(x - r * 0.1)} ${f1(y + r * 0.36)}L${f1(x + r * 0.48)} ${f1(y - r * 0.34)}" fill="none" stroke="#fff" stroke-width="${f1(Math.max(2, r * 0.28))}" stroke-linecap="round" stroke-linejoin="round"/></g>`);
      }
      else if(e.type === "loop"){
        const inset = Math.min(6, (e.x2 - e.x1) * 0.08), a = e.x1 + inset, b = e.x2 - inset, rx = Math.max(4, (b - a) / 2);
        out.push(`<path d="M${f1(a)} ${f1(e.y - 3)}A${f1(rx)} ${f1(e.ry)} 0 0 1 ${f1(b)} ${f1(e.y - 3)}M${f1(b)} ${f1(e.y + 3)}A${f1(rx)} ${f1(e.ry)} 0 0 1 ${f1(a)} ${f1(e.y + 3)}" fill="rgba(148,163,184,.08)" stroke="${COL.soft}" stroke-width="${f1(Math.max(1.6, L.fsM * 0.045))}" stroke-dasharray="7 6" opacity="${op}"/>`);
      } else if(e.type === "hop"){
        out.push(`<g data-key="${e.key}" opacity="${op}"><path d="${hopPath(e)}" fill="none" stroke="${e.col}" stroke-width="${f1(e.w)}" stroke-linecap="round"${e.dash ? ` stroke-dasharray="${f1(e.w * 2.6)} ${f1(e.w * 2.4)}"` : ""}/>${headSVG(e)}</g>`);
      } else if(e.type === "pill"){
        const fs = e.fs || L.fsS * 0.95, w = tw(e.text, fs, UI, 900) + fs * 1.05, h = fs * 1.5;
        out.push(`<g data-key="${e.key}" opacity="${op}"><rect x="${f1(e.x - w / 2)}" y="${f1(e.y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${e.bg}" stroke="${e.col}" stroke-width="${e.fs ? 1.2 : 1.8}"/>` +
          `<text x="${f1(e.x)}" y="${f1(e.y)}" text-anchor="middle" dominant-baseline="central" font-size="${f1(fs)}" fill="${e.col}" style='font-family:${UI};font-weight:900'>${esc(e.text)}</text></g>`);
      }
    });
    $("board").setAttribute("viewBox", `0 0 ${L.W} ${L.H}`);
    $("board").innerHTML = `<defs><radialGradient id="haloG"><stop offset="0" stop-color="#bfdbfe" stop-opacity=".95"/><stop offset=".65" stop-color="#dbeafe" stop-opacity=".45"/><stop offset="1" stop-color="#dbeafe" stop-opacity="0"/></radialGradient></defs>` + out.join("");
  }
  /* tween between two scenes; T in 0..1. The point both scenes share is the anchor: everything that comes or goes
     slides with it, so the whole line pans as one piece while the old marks fade (the reset) or the new ones arrive. */
  function mix(A, B, T){
    const out = [], mapA = new Map(A.map(e => [e.key, e])), span = 0.58;
    const t0 = ease(clamp(T / span, 0, 1));
    let dx = 0;
    for(const b of B){ if(b.type === "tick" && b.key[0] === "p"){ const a = mapA.get(b.key); if(a && Math.abs(a.x - b.x) > 0.5){ dx = b.x - a.x; break; } } }
    const shift = (e, by) => { ["x", "x1", "x2"].forEach(p => { if(typeof e[p] === "number") e[p] += by; }); return e; };
    B.forEach(b => {
      const a = mapA.get(b.key); mapA.delete(b.key);
      const d = Math.min(0.42, b.d || 0), t = ease(clamp((T - d) / span, 0, 1));
      if(!a){ const e = Object.assign({}, b, { o:b.o * t }); if(dx && b.type !== "axis" && b.type !== "tag") shift(e, -dx * (1 - t0)); out.push(e); return; }
      const e = Object.assign({}, t0 < 0.5 ? a : b);
      ["x", "y", "x1", "x2", "h", "r", "size"].forEach(p => { if(typeof a[p] === "number" && typeof b[p] === "number") e[p] = lerp(a[p], b[p], t0); });
      e.o = lerp(a.o, b.o, t0);
      out.push(e);
    });
    mapA.forEach(a => { const e = Object.assign({}, a, { o:a.o * (1 - t0) }); if(dx && a.type !== "axis" && a.type !== "tag") shift(e, dx * t0); out.push(e); });
    return out;
  }

  return { S, L, R, rAdd, rSub, rMul, rDiv, rI, rF, rInt, rEq, gcd, fmt, esc, MATH_ALPHA, mathItalic, letterHTML,
    num, opsS, linS, evalS, hasX, isRewrite, linOf, exS, tm, fX, fN, fBr, fLin, fFr, linTerms, plainSide, solve, exSolve,
    TWO, BOTH, FRAC_OK, genType, finish, okQ, sideP, subP, valP, H, V, N, O, T, hasFr, pillText, layout, scene, mix, drawEls, ease };
})();

/* =====================================================================
   EVERY WORD THE QUIZ SHOWS, IN ENGLISH, ARABIC AND FARSI
   (the Counting Strategies convention: the chosen language on top, English
   underneath; equations, numbers and inputs stay left-to-right and Western).
   {name}: a plain value is maths and sits in <bdi dir="ltr">; a value that is
   itself an {en, ar, fa} object is a word, put in as that language's word.
   The Arabic and Farsi want a fluent proofread, as on the other quizzes.
   ===================================================================== */
const UI = {
  /* page */
  counter:{ en:"Question {n} / {t}", ar:"السؤال {n} من {t}", fa:"سؤال {n} از {t}" },
  prev:{ en:"← Previous", ar:"→ السابق", fa:"→ قبلی" },
  next:{ en:"Next →", ar:"التالي ←", fa:"بعدی ←" },
  finish:{ en:"Finish →", ar:"إنهاء ←", fa:"پایان ←" },
  changeLevel:{ en:"Change level", ar:"غيّر المستوى", fa:"تغییر سطح" },
  chooseLevel:{ en:"Choose your level", ar:"اختر مستواك", fa:"سطح خود را انتخاب کن" },
  finished:{ en:"Finished", ar:"انتهيت", fa:"تمام شد" },
  tryAgain:{ en:"Try again", ar:"حاول مرة أخرى", fa:"دوباره امتحان کن" },
  copyResult:{ en:"Copy my result", ar:"انسخ نتيجتي", fa:"کپی نتیجه‌ام" },
  copied:{ en:"Copied ✓", ar:"تم النسخ ✓", fa:"کپی شد ✓" },
  copyFail:{ en:"Couldn’t copy", ar:"تعذّر النسخ", fa:"کپی نشد" },
  boardTag:{ en:"Double number line", ar:"خط الأعداد المزدوج", fa:"محور اعداد دوتایی" },
  legendMove:{ en:"the same move on both lines", ar:"الخطوة نفسها على الخطين", fa:"همان حرکت روی هر دو محور" },
  check:{ en:"Check", ar:"تحقّق", fa:"بررسی" },
  checkAgain:{ en:"Check again", ar:"تحقّق مرة أخرى", fa:"دوباره بررسی کن" },
  fracBtn:{ en:"Fraction", ar:"كسر", fa:"کسر" },
  fracHint:{ en:"Click to enter a fraction", ar:"انقر لإدخال كسر", fa:"برای نوشتن کسر کلیک کن" },

  /* the level chooser */
  levelSub:{ en:"Ten questions. Sweet: you drive the double number line, one move at a time. Mild: you write the working, = under =. Medium: just the answer, with negative numbers. Spicy: fraction answers, mistakes to spot and worded problems.",
    ar:"عشرة أسئلة. السهل: أنت تقود خط الأعداد المزدوج، خطوة بخطوة. المعتدل: تكتب خطوات الحل، علامة = تحت علامة =. المتوسط: الجواب فقط، مع أعداد سالبة. الحار: أجوبة كسرية، وأخطاء تكتشفها، ومسائل كلامية.",
    fa:"ده سؤال. شیرین: خودت محور اعداد دوتایی را حرکت می‌دهی، یک حرکت در هر بار. ملایم: مراحل حل را می‌نویسی، = زیر =. متوسط: فقط جواب، با عددهای منفی. تند: جواب‌های کسری، پیدا کردن اشتباه و مسئله‌های کلامی." },
  dSweet:{ en:"You drive the double number line: choose each move, then type the new number. Small whole numbers.",
    ar:"أنت تقود خط الأعداد المزدوج: اختر كل خطوة، ثم اكتب العدد الجديد. أعداد صحيحة صغيرة.",
    fa:"خودت محور اعداد دوتایی را حرکت می‌دهی: هر حرکت را انتخاب کن، بعد عدد جدید را بنویس. عددهای صحیح کوچک." },
  dMild:{ en:"No line. Write the working = under =: the move under each side, then the new equation. Bigger numbers, other letters.",
    ar:"بلا خط. اكتب خطوات الحل = تحت =: الخطوة تحت كل طرف، ثم المعادلة الجديدة. أعداد أكبر وحروف أخرى.",
    fa:"بدون محور. مراحل حل را = زیر = بنویس: حرکت زیر هر طرف، بعد معادلهٔ جدید. عددهای بزرگ‌تر و حرف‌های دیگر." },
  dMedium:{ en:"Just the equation and your answer. Every second answer is negative. Which move comes first, and checking.",
    ar:"المعادلة وجوابك فقط. كل جواب ثانٍ سالب. أي خطوة تأتي أولاً، والتحقق.",
    fa:"فقط معادله و جواب تو. از هر دو جواب یکی منفی است. کدام حرکت اول می‌آید، و بررسی جواب." },
  dSpicy:{ en:"Negative and fraction answers, mistakes to spot and worded problems.",
    ar:"أجوبة سالبة وكسرية، وأخطاء تكتشفها، ومسائل كلامية.",
    fa:"جواب‌های منفی و کسری، پیدا کردن اشتباه و مسئله‌های کلامی." },

  /* questions */
  solve:{ en:"Solve.", ar:"حُلّ.", fa:"حل کن." },
  solveFor:{ en:"Solve. Write {x} as a whole number or a fraction.", ar:"حُلّ. اكتب {x} عدداً صحيحاً أو كسراً.", fa:"حل کن. {x} را به صورت عدد صحیح یا کسر بنویس." },
  driveIntro:{ en:"Solve it on the double number line: choose each move, then type the new number.", ar:"حُلّها على خط الأعداد المزدوج: اختر كل خطوة، ثم اكتب العدد الجديد.", fa:"آن را روی محور اعداد دوتایی حل کن: هر حرکت را انتخاب کن، بعد عدد جدید را بنویس." },
  gridIntro:{ en:"Write the working. Put the move under each side, then the new equation, = under =.", ar:"اكتب خطوات الحل. ضع الخطوة تحت كل طرف، ثم المعادلة الجديدة، = تحت =.", fa:"مراحل حل را بنویس. حرکت را زیر هر طرف بگذار، بعد معادلهٔ جدید را، = زیر =." },
  gridHint:{ en:"Type a move like −4, +2x, ÷3 or ×2.", ar:"اكتب خطوة مثل ‎−4‎ أو ‎+2x‎ أو ‎÷3‎ أو ‎×2‎.", fa:"حرکتی مثل ‎−4‎ یا ‎+2x‎ یا ‎÷3‎ یا ‎×2‎ بنویس." },
  askUndo:{ en:"Which move undoes the last thing done to {x}?", ar:"أي خطوة تعكس آخر ما فُعل بـ {x}؟", fa:"کدام حرکت آخرین کاری را که روی {x} انجام شده خنثی می‌کند؟" },
  askXterm:{ en:"Which move gets {x} on one side only?", ar:"أي خطوة تجعل {x} في طرف واحد فقط؟", fa:"کدام حرکت {x} را فقط در یک طرف نگه می‌دارد؟" },
  askClear:{ en:"Which move clears the fraction?", ar:"أي خطوة تتخلّص من الكسر؟", fa:"کدام حرکت کسر را از بین می‌برد؟" },
  askFirst:{ en:"What comes first?", ar:"ماذا يأتي أولاً؟", fa:"اول چه کاری باید کرد؟" },
  rwExp:{ en:"First, expand the bracket", ar:"أولاً، فُكّ القوس", fa:"اول، پرانتز را باز کن" },
  rwCol:{ en:"Collect like terms", ar:"اجمع الحدود المتشابهة", fa:"جمله‌های متشابه را جمع کن" },
  rwExpOpt:{ en:"Expand the bracket", ar:"فُكّ القوس", fa:"پرانتز را باز کن" },
  rwColOpt:{ en:"Collect like terms", ar:"اجمع الحدود المتشابهة", fa:"جمله‌های متشابه را جمع کن" },
  rwNote:{ en:"Writing a side another way doesn’t move the point. Press it to go on.", ar:"كتابة طرف بطريقة أخرى لا تحرّك النقطة. اضغط للمتابعة.", fa:"نوشتن یک طرف به شکل دیگر نقطه را جابه‌جا نمی‌کند. برای ادامه بزن." },
  typeNew:{ en:"Type the new number.", ar:"اكتب العدد الجديد.", fa:"عدد جدید را بنویس." },
  bothOnLine:{ en:"{m} on both lines", ar:"{m} على الخطين", fa:"{m} روی هر دو محور" },
  driveDone:{ en:"Solved: {e}", ar:"تم الحل: {e}", fa:"حل شد: {e}" },
  checkQ:{ en:"Which value of {x} makes this true?", ar:"أي قيمة لـ {x} تجعل هذه المعادلة صحيحة؟", fa:"کدام مقدار {x} این را درست می‌کند؟" },
  mistakeQ:{ en:"{name} solved {e} like this. Which line has the first mistake?", ar:"حلّ {name} المعادلة {e} هكذا. أي سطر فيه الخطأ الأول؟", fa:"{name} معادلهٔ {e} را این‌طور حل کرد. اولین اشتباه در کدام سطر است؟" },
  lineN:{ en:"Line {n}", ar:"السطر {n}", fa:"سطر {n}" },
  noMistake:{ en:"There is no mistake", ar:"لا يوجد خطأ", fa:"اشتباهی ندارد" },
  thinkAsk:{ en:"What is the number?", ar:"ما هو العدد؟", fa:"آن عدد چیست؟" },
  wordAsk:{ en:"Write an equation, then solve it.", ar:"اكتب معادلة، ثم حُلّها.", fa:"یک معادله بنویس، بعد آن را حل کن." },
  letBe:{ en:"Let {v} be {w}.", ar:"ليكن {v} {w}.", fa:"فرض کن {v} {w} باشد." },

  /* feedback */
  hintBoard:{ en:"The double number line is {where}", ar:"خط الأعداد المزدوج {where}", fa:"محور اعداد دوتایی {where} است" },
  right:{ en:"on the right", ar:"على اليمين", fa:"در سمت راست" },
  below:{ en:"below", ar:"في الأسفل", fa:"در پایین" },
  good:{ en:"✓ Right first time!", ar:"✓ صحيح من أول مرة!", fa:"✓ بار اول درست بود!" },
  fixed:{ en:"✓ Fixed — well done.", ar:"✓ صحّحته — أحسنت.", fa:"✓ درستش کردی — آفرین." },
  fixedNoScore:{ en:"✓ Solved. One step was wrong the first time, so this one does not score.", ar:"✓ تم الحل. كانت خطوة واحدة خاطئة في المرة الأولى، لذلك لا يُحتسب هذا السؤال.", fa:"✓ حل شد. یک مرحله بار اول اشتباه بود، پس این سؤال امتیاز ندارد." },
  stepGood:{ en:"✓ Yes.", ar:"✓ نعم.", fa:"✓ بله." },
  notQuite:{ en:"Not quite.", ar:"ليس تماماً.", fa:"نه کاملاً." },
  skipped:{ en:"Skipped.", ar:"تم التخطي.", fa:"رد شد." },
  theAnswer:{ en:"The answer:", ar:"الجواب:", fa:"جواب:" },
  working:{ en:"The working:", ar:"خطوات الحل:", fa:"مراحل حل:" },
  typeFirst:{ en:"Type your answer first.", ar:"اكتب جوابك أولاً.", fa:"اول جوابت را بنویس." },
  chooseFirst:{ en:"Choose an answer first.", ar:"اختر جواباً أولاً.", fa:"اول یک جواب انتخاب کن." },
  unreadable:{ en:"Type a number, like 7, −3, 5/2 or 2 1/2.", ar:"اكتب عدداً، مثل 7 أو ‎−3‎ أو 5/2 أو 2 1/2.", fa:"یک عدد بنویس، مثل 7 یا ‎−3‎ یا 5/2 یا 2 1/2." },
  wholeOnly:{ en:"Type a whole number. Use − for a negative.", ar:"اكتب عدداً صحيحاً. استخدم − للعدد السالب.", fa:"یک عدد صحیح بنویس. برای منفی از − استفاده کن." },
  simplify:{ en:"Right value — now write the fraction in its simplest form.", ar:"القيمة صحيحة — اكتب الكسر الآن في أبسط صورة.", fa:"مقدار درست است — حالا کسر را به ساده‌ترین شکل بنویس." },
  fillAll:{ en:"Fill in every box first.", ar:"املأ كل المربعات أولاً.", fa:"اول همهٔ خانه‌ها را پر کن." },
  badMove:{ en:"A move looks like −4, +2x, ÷3 or ×2 — check row {n}.", ar:"الخطوة تُكتب مثل ‎−4‎ أو ‎+2x‎ أو ‎÷3‎ أو ‎×2‎ — راجع السطر {n}.", fa:"حرکت این‌طور نوشته می‌شود: ‎−4‎ یا ‎+2x‎ یا ‎÷3‎ یا ‎×2‎ — سطر {n} را ببین." },
  badSide:{ en:"Row {n} has a side I can’t read. Use numbers, {x}, + − × ÷ and brackets.", ar:"في السطر {n} طرف لا أستطيع قراءته. استخدم الأعداد و{x} و+ − × ÷ والأقواس.", fa:"سطر {n} طرفی دارد که نمی‌توانم بخوانم. از عدد، {x}، + − × ÷ و پرانتز استفاده کن." },
  notSimple:{ en:"Row {n}: the value is right — write it as simply as you can.", ar:"السطر {n}: القيمة صحيحة — اكتبها بأبسط صورة.", fa:"سطر {n}: مقدار درست است — آن را تا جای ممکن ساده بنویس." },
  rowWrong:{ en:"Row {n} isn’t right yet. The red boxes need another look.", ar:"السطر {n} ليس صحيحاً بعد. المربعات الحمراء تحتاج نظرة أخرى.", fa:"سطر {n} هنوز درست نیست. خانه‌های قرمز را دوباره ببین." },
  rowRight:{ en:"It should be {e}.", ar:"يجب أن تكون {e}.", fa:"باید {e} باشد." },
  moveShould:{ en:"The move is {m}.", ar:"الخطوة هي {m}.", fa:"حرکت {m} است." },

  /* why a move is wrong */
  wDoes:{ en:"{c} does it again. To undo {b}, use {m} — on both lines.", ar:"{c} تكرّر العملية نفسها. لعكس {b}، استخدم {m} — على الخطين.", fa:"{c} همان کار را دوباره انجام می‌دهد. برای خنثی کردن {b}، از {m} استفاده کن — روی هر دو محور." },
  wOrder:{ en:"{c} isn’t the last thing done to {x}. {b} was done last, so undo it first with {m}.", ar:"{c} ليست آخر ما فُعل بـ {x}. آخر ما فُعل هو {b}، فاعكسه أولاً بـ {m}.", fa:"{c} آخرین کاری نیست که روی {x} انجام شده. آخرین کار {b} بود، پس اول آن را با {m} خنثی کن." },
  wXterm:{ en:"Take the smaller {x}-term from both sides: {m}. Then {x} is on one side only.", ar:"اطرح الحد الأصغر الذي فيه {x} من الطرفين: {m}. عندها يكون {x} في طرف واحد فقط.", fa:"جملهٔ کوچک‌تر {x} را از هر دو طرف کم کن: {m}. آن‌وقت {x} فقط در یک طرف است." },
  wXneg:{ en:"Adding {t} to both sides gets rid of the {u} and keeps {x} positive: {m}.", ar:"إضافة {t} إلى الطرفين تتخلّص من {u} وتُبقي {x} موجباً: {m}.", fa:"اضافه کردن {t} به هر دو طرف {u} را از بین می‌برد و {x} را مثبت نگه می‌دارد: {m}." },
  wClear:{ en:"Multiply both sides by {d} to clear the fraction: {m}.", ar:"اضرب الطرفين في {d} للتخلّص من الكسر: {m}.", fa:"هر دو طرف را در {d} ضرب کن تا کسر از بین برود: {m}." },
  wGeneric:{ en:"That doesn’t get {x} on its own. The move is {m}.", ar:"هذه لا تجعل {x} وحده. الخطوة هي {m}.", fa:"این {x} را تنها نمی‌کند. حرکت {m} است." },
  wVal:{ en:"Do {m} to the number too: {e}.", ar:"طبّق {m} على العدد أيضاً: {e}.", fa:"{m} را روی عدد هم انجام بده: {e}." },
  firstExp:{ en:"The bracket comes first: expand it. Writing a side another way doesn’t change its value.", ar:"القوس أولاً: فُكّه. كتابة الطرف بطريقة أخرى لا تغيّر قيمته.", fa:"اول پرانتز: آن را باز کن. نوشتن یک طرف به شکل دیگر مقدارش را عوض نمی‌کند." },
  firstCol:{ en:"First collect the like terms on that side.", ar:"اجمع أولاً الحدود المتشابهة في ذلك الطرف.", fa:"اول جمله‌های متشابه آن طرف را جمع کن." },
  checkWhy:{ en:"Put it back in: {e}. Only {a} makes both sides match.", ar:"عوّض بها: {e}. فقط {a} تجعل الطرفين متساويين.", fa:"آن را جای‌گذاری کن: {e}. فقط {a} دو طرف را برابر می‌کند." },
  mistakeWhy:{ en:"Line {n} is the first wrong line: {why} It should be {e}, and the answer is {a}.", ar:"السطر {n} هو أول سطر خاطئ: {why} يجب أن يكون {e}، والجواب {a}.", fa:"سطر {n} اولین سطر اشتباه است: {why} باید {e} باشد، و جواب {a} است." },
  noMistakeWhy:{ en:"There is a mistake: substitute {a} and the sides don’t match.", ar:"هناك خطأ: عوّض بـ {a} ولن يتساوى الطرفان.", fa:"اشتباهی هست: {a} را جای‌گذاری کن، دو طرف برابر نمی‌شوند." },
  wordWhy:{ en:"The equation is {e}, so {a}.", ar:"المعادلة هي {e}، إذن {a}.", fa:"معادله {e} است، پس {a}." },

  /* the slips in a worked answer */
  sWay:{ en:"the move was {m} on one side but {o} on the other. Both sides need the same move.", ar:"كانت الخطوة {m} في طرف و{o} في الطرف الآخر. يحتاج الطرفان إلى الخطوة نفسها.", fa:"حرکت در یک طرف {m} بود و در طرف دیگر {o}. هر دو طرف به یک حرکت نیاز دارند." },
  sOne:{ en:"{m} was only done to one side. Whatever is done to one side has to be done to the other.", ar:"طُبّقت {m} على طرف واحد فقط. ما يُطبَّق على طرف يجب أن يُطبَّق على الآخر.", fa:"{m} فقط روی یک طرف انجام شد. هر کاری روی یک طرف بکنی، باید روی طرف دیگر هم بکنی." },
  sXway:{ en:"the move was {m} on one side but the opposite on the other. Both sides need the same move.", ar:"كانت الخطوة {m} في طرف وعكسها في الطرف الآخر. يحتاج الطرفان إلى الخطوة نفسها.", fa:"حرکت در یک طرف {m} بود و در طرف دیگر برعکس آن. هر دو طرف به یک حرکت نیاز دارند." },
  sHalf:{ en:"the {c} outside the bracket multiplies BOTH terms inside it, not just the first.", ar:"العدد {c} خارج القوس يضرب الحدّين داخله كليهما، لا الأول فقط.", fa:"{c} بیرون پرانتز در هر دو جملهٔ داخل آن ضرب می‌شود، نه فقط جملهٔ اول." },
  sNeg:{ en:"−{c} multiplies every term in the bracket, so the sign of the second term changes too.", ar:"‎−{c}‎ يضرب كل حدّ في القوس، فتتغيّر إشارة الحد الثاني أيضاً.", fa:"‎−{c}‎ در همهٔ جمله‌های پرانتز ضرب می‌شود، پس علامت جملهٔ دوم هم عوض می‌شود." },
  sFrac:{ en:"× {d} has to multiply EVERY term on the side, including the {k}.", ar:"يجب أن يضرب ‎× {d}‎ كل حدّ في الطرف، بما فيه {k}.", fa:"‎× {d}‎ باید در همهٔ جمله‌های آن طرف ضرب شود، از جمله {k}." },

  /* the certificate's breakdown */
  cDrive:{ en:"On the double number line", ar:"على خط الأعداد المزدوج", fa:"روی محور اعداد دوتایی" },
  cGrid:{ en:"Writing the working", ar:"كتابة خطوات الحل", fa:"نوشتن مراحل حل" },
  cSolve:{ en:"Solving", ar:"الحل", fa:"حل کردن" },
  cFirst:{ en:"Which move first?", ar:"أي خطوة أولاً؟", fa:"کدام حرکت اول؟" },
  cCheck:{ en:"Checking by substituting", ar:"التحقق بالتعويض", fa:"بررسی با جای‌گذاری" },
  cMistake:{ en:"Spot the mistake", ar:"اكتشف الخطأ", fa:"پیدا کردن اشتباه" },
  cThink:{ en:"Think of a number", ar:"فكّر في عدد", fa:"عددی را در نظر بگیر" },
  cWord:{ en:"Worded problems", ar:"مسائل كلامية", fa:"مسئله‌های کلامی" },
  cNeg:{ en:"With negative answers", ar:"بأجوبة سالبة", fa:"با جواب‌های منفی" },
  cFrac:{ en:"With fraction answers", ar:"بأجوبة كسرية", fa:"با جواب‌های کسری" }
};

/* the names in spot-the-mistake and the stories, as an Arabic or Farsi reader would say them */
const NAME_T = {
  Mia:{ ar:"ميا", fa:"میا" }, Sam:{ ar:"سام", fa:"سام" }, Noah:{ ar:"نوح", fa:"نوح" }, Zara:{ ar:"زارا", fa:"زارا" },
  Kai:{ ar:"كاي", fa:"کای" }, Lily:{ ar:"ليلي", fa:"لیلی" }, Jai:{ ar:"جاي", fa:"جای" }, Ava:{ ar:"آفا", fa:"آوا" },
  Leo:{ ar:"ليو", fa:"لئو" }, Ruby:{ ar:"روبي", fa:"روبی" }, Omar:{ ar:"عمر", fa:"عمر" }, Tia:{ ar:"تيا", fa:"تیا" },
  Ella:{ ar:"إيلا", fa:"الا" }
};
const nameW = n => ({ en:n, ar:(NAME_T[n] || {}).ar || n, fa:(NAME_T[n] || {}).fa || n });

const LANGS = ["en", "ar", "fa"];
let LANG = "en";
try{ const v = localStorage.getItem("mmt-msq-lang"); if(LANGS.includes(v)) LANG = v; }catch(e){}
function tx(o, lang, v){
  const d = typeof o === "string" ? UI[o] : o;
  if(!d) return String(o);
  let s = d[lang] != null ? d[lang] : d.en;
  if(typeof s === "function") s = s(v || {});
  if(!v) return s;
  return String(s).replace(/\{(\w+)\}/g, (m, k) => {
    const x = v[k];
    if(x == null) return "";
    if(typeof x === "object") return x.k ? tx(x.k, lang, x.v) : tx(x, lang, null);
    return lang === "en" ? String(x) : `<bdi dir="ltr">${x}</bdi>`;
  });
}
const bi = (en, tr) => LANG === "en" ? en : `<span class="tl" dir="rtl" lang="${LANG}">${tr}</span><span class="el">${en}</span>`;
/* Lg: the chosen language over English.  one: the chosen language only. */
const Lg = (k, v) => bi(tx(k, "en", v), LANG === "en" ? "" : tx(k, LANG, v));
const one = (k, v) => { const t = tx(k, LANG, v); return LANG === "en" ? t : `<span dir="rtl" lang="${LANG}">${t}</span>`; };
/* several keys run together into one sentence, in each language */
const Lrun = parts => bi(parts.map(p => tx(p[0], "en", p[1])).join(" "), LANG === "en" ? "" : parts.map(p => tx(p[0], LANG, p[1])).join(" "));

/* =====================================================================
   MULTI-STEP EQUATIONS — DOUBLE NUMBER LINE — STUDENT QUIZZES (2026-11-17)
   ---------------------------------------------------------------------
   ONE engine for five quiz pages. Each page sets window.MSQ =
   { scope, toolId, tool, title, mastery } and loads this file:
     two    Two-step equations: 3x + 4 = 19, x/4 + 3 = 5, 10 − 2x = 4
     group  Two-step with grouping: 3(x + 2) = 15, (x − 1)/4 = 3
     both   Pronumerals on both sides: 5x + 2 = 3x + 10, 3(x + 2) = x + 14
     frac   Fractions and harder ones: (x + 7)/2 = x + 2, two brackets, two fractions
     mix    Everything
   The equations, the solving and the double number line are the teaching
   tool's own (MS, copied verbatim). The levels mean the same on every page:
     Sweet  the student DRIVES the double number line: choose each move (it
            plays on both lines), then type the new number. Small whole numbers.
     Mild   no line: write the working = under = (the move under each side,
            then the new equation). Bigger numbers, written other ways, other letters.
     Medium just the equation and the answer; every second answer negative;
            which move first; checking by substituting; spot the mistake.
     Spicy  negative and fraction answers, mistakes, worded problems.
   Marking (as the other quizzes): a question scores only if every part is
   right FIRST time; Check again lets them fix it; empty or unreadable input
   uses nothing up; Next on an unfinished question counts it as wrong.
   Nothing typed is ever saved.
   ===================================================================== */
const CFG = Object.assign({ scope:"mix", toolId:"multi-step-equations-quiz", tool:"multi-step-equations-student-quiz",
  title:"Multi-Step Equations", mastery:"multi-step-equations" }, window.MSQ || {});
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

/* ---------------------------------------------------------- maths as HTML, in the question's own letter */
const at = q => { MS.S.q = q; return q; };
const Hq = (q, p) => { at(q); return MS.H(p); };
const sideP = (q, sd) => { at(q); return MS.sideP(sd); };
const sideH = (q, sd) => Hq(q, sideP(q, sd));
const eqS = h => `<bdi dir="ltr" class="eq">${h}</bdi>`;
const eqLine = (q, st) => `${sideH(q, st.top)} = ${sideH(q, st.bot)}`;
const eqH = (q, i) => eqLine(q, q.stages[i]);
const valH = (q, r) => { at(q); return MS.H(MS.valP(r)); };
const valTxt = (q, r) => r.d === 1 ? fmt(r.n) : `${fmt(r.n)}/${r.d}`;
const Lt = v => MS.letterHTML(v);
const xEq = (q, r) => eqS(`${Lt(q.v)} = ${valH(q, r == null ? q.x : r)}`);
const pillOf = (q, mv) => { at(q); return MS.pillText(mv); };
const pillH = (q, mv) => `<span class="mvPill${MS.isRewrite(mv) ? " rw" : ""}">${esc(pillOf(q, mv))}</span>`;
const realMoves = q => q.moves.map((m, i) => i).filter(i => !MS.isRewrite(q.moves[i]));
/* the working, line by line, as the tool's panel writes it */
function workingHTML(q, from){
  let h = `<div class="wList" dir="ltr">`;
  for(let i = from || 0; i < q.stages.length; i++){
    const mv = i ? q.moves[i - 1] : null;
    h += `<div class="wRow">${mv ? pillH(q, mv) : `<span class="mvPill none"></span>`}<span class="eq">${eqH(q, i)}</span></div>`;
  }
  return h + "</div>";
}

/* ---------------------------------------------------------- the equation kinds on each page */
const TYPE_NAME = {
  axb:"Multiply, then add or subtract", xab:"Divide, then add or subtract", brk:"Brackets", frc:"A sum, then divide",
  bax:"Taking the pronumeral away", both:"Both sides: simple", bbrk:"Both sides: brackets", bfrc:"Both sides: one fraction", bhard:"Both sides: harder"
};
const SCOPES = { two:["axb", "xab", "bax"], group:["brk", "frc"], both:["both", "bbrk"], frac:["bfrc", "bhard"],
  mix:["axb", "xab", "brk", "frc", "bax", "both", "bbrk", "bfrc", "bhard"] };
const POOL = SCOPES[CFG.scope] || SCOPES.mix;

/* ---------------------------------------------------------- numbers for each level */
const LV = {
  sweet:  { maxN:20, maxX:10, vary:false, letters:0 },
  mild:   { maxN:40, maxX:15, vary:true,  letters:.3 },
  medium: { maxN:40, maxX:15, vary:true,  letters:.3 },
  spicy:  { maxN:60, maxX:20, vary:true,  letters:.3 }
};
const LETTERS = "abcdfghkmnpqrstuwyz".split("");
const numsIn = p => p.flatMap(it => it.fr ? numsIn(it.fr[0]).concat(numsIn(it.fr[1])) : it.n != null ? [Math.abs(parseFloat(String(it.n).replace(MINUS, "-")) || 0)] : []);
const sigOf = q => JSON.stringify([q.stages[0].top, q.stages[0].bot]);
let USED = new Set();
/* one equation from the tool's own generators, held to the level's sizes.
   o: { neg, frac, plain (as written by the tool, no letters), test } */
function makeEq(type, level, o){
  o = o || {};
  const L0 = LV[level];
  MS.S.set.vary = !!(L0.vary && !o.plain);
  const wantFrac = !!(o.frac && MS.FRAC_OK[type]);
  for(let t = 0; t < 4000; t++){
    const g = MS.genType(type, !!o.neg, wantFrac); if(!g) continue;
    g.type = type;
    if(MS.S.set.vary && MS.TWO.includes(type)){
      if(g.top.t === "ops"){ const l = g.top.ops[g.top.ops.length - 1]; if(l.o === "add" && Math.random() < 0.3) g.top.kFirst = true; }
      if(Math.random() < 0.25){ const tmp = g.top; g.top = g.bot; g.bot = tmp; }
    }
    const v = !o.plain && Math.random() < L0.letters ? pick(LETTERS) : "x";
    const q = MS.finish(g, v);
    if(!q || !MS.okQ(q, !!o.neg)) continue;
    if(wantFrac === MS.rInt(q.x)) continue;
    if(MS.rInt(q.x) && Math.abs(q.x.n) > L0.maxX) continue;
    if(!MS.rInt(q.x) && q.x.d > 6) continue;
    if(numsIn(sideP(q, q.stages[0].top).concat(sideP(q, q.stages[0].bot))).some(n => n > L0.maxN)) continue;
    if(q.stages.some(st => Math.abs(MS.rF(st.val)) > (level === "spicy" ? 160 : 120))) continue;
    if(o.test && !o.test(q)) continue;
    const sg = sigOf(q); if(USED.has(sg) && t < 3000) continue;
    USED.add(sg); q.level = level;
    return q;
  }
  return null;
}
/* the kinds on this page, dealt from a shuffled deck so they come round evenly */
let DECK = [];
function eqFor(level, o, typeOk){
  for(let k = 0; k < 2 * POOL.length + 2; k++){
    if(!DECK.length) DECK = shuffle(POOL);
    const t = DECK.pop();
    if(typeOk && !typeOk(t)) continue;
    const q = makeEq(t, level, o);
    if(q) return q;
  }
  for(const t of POOL){ if(typeOk && !typeOk(t)) continue; const q = makeEq(t, level, Object.assign({}, o, { test:null })); if(q) return q; }
  return makeEq(POOL[0], level, {});
}

/* ---------------------------------------------------------- reading what is typed */
const normIn = s => String(s == null ? "" : s).trim().replace(/[−–—]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/\s+/g, " ");
/* a number: 7, -3, 5/2, 2 1/2, -2 1/2, 3.5 */
function parseNum(raw){
  const s = normIn(raw).replace(/^[a-z]\s*=\s*/i, "");
  let m;
  if((m = /^([+-]?)(\d+)$/.exec(s))) return { r:MS.R((m[1] === "-" ? -1 : 1) * +m[2], 1) };
  if((m = /^([+-]?)(\d*\.\d+|\d+\.\d*)$/.exec(s))){ const dp = (m[2].split(".")[1] || "").length, d = Math.pow(10, dp); return { r:MS.R((m[1] === "-" ? -1 : 1) * Math.round(parseFloat(m[2]) * d), d) }; }
  if((m = /^([+-]?)\(?\s*(\d+)\s*\/\s*(\d+)\s*\)?$/.exec(s)) && +m[3] > 0){ const sg = m[1] === "-" ? -1 : 1; return { r:MS.R(sg * +m[2], +m[3]), frac:[+m[2], +m[3]] }; }
  if((m = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s)) && +m[4] > 0){ const sg = m[1] === "-" ? -1 : 1; return { r:MS.R(sg * (+m[2] * +m[4] + +m[3]), +m[4]), frac:[+m[3], +m[4]] }; }
  return null;
}
/* a move: −4, +2x, ÷3, ×2, /3, *2 */
function parseMove(raw, letter){
  const s = normIn(raw).replace(/\s+/g, "").toLowerCase();
  const m = new RegExp("^([+\\-*/])(\\d*)(" + letter + ")?$").exec(s);
  if(!m) return null;
  const op = m[1], n = m[2] === "" ? null : +m[2], hasL = !!m[3];
  if(hasL){ if(op !== "+" && op !== "-") return null; const c = n == null ? 1 : n; if(!c) return null; return { kind:"xterm", s:op === "-" ? c : -c }; }
  if(n == null || !n) return null;
  return { kind:{ "+":"add", "-":"sub", "*":"mul", "/":"div" }[op], n };
}
const sameMove = (a, b) => a && b && a.kind === b.kind && (a.kind === "xterm" ? a.s === b.s : a.n === b.n);
/* a side: a linear expression in the letter. Returns {m, k} (exact), how many numbers and letters
   were written, and whether it used brackets or a fraction bar. */
function parseSideIn(raw, letter){
  const s = normIn(raw).replace(/\s+/g, "").toLowerCase();
  if(!s) return null;
  let i = 0, cnt = 0, br = false, dv = false;
  const peek = () => s[i];
  const Z = { m:MS.rI(0), k:MS.rI(0) };
  const add = (a, b, sg) => ({ m:MS.rAdd(a.m, MS.rMul(MS.rI(sg), b.m)), k:MS.rAdd(a.k, MS.rMul(MS.rI(sg), b.k)) });
  const isC = a => a.m.n === 0;
  const scale = (a, r) => ({ m:MS.rMul(a.m, r), k:MS.rMul(a.k, r) });
  function expr(){
    let v = Z, first = true;
    while(i < s.length && peek() !== ")"){
      let sg = 1;
      if(peek() === "+" || peek() === "-"){ sg = peek() === "-" ? -1 : 1; i++; }
      else if(!first) throw 0;
      v = add(v, term(), sg); first = false;
    }
    if(first) throw 0;
    return v;
  }
  function term(){
    let v = factor();
    for(;;){
      const c = peek();
      if(c === "*"){ i++; const f = factor(); if(!isC(v) && !isC(f)) throw 0; v = isC(v) ? scale(f, v.k) : scale(v, f.k); }
      else if(c === "/"){ i++; dv = true; const f = factor(); if(!isC(f) || f.k.n === 0) throw 0; v = scale(v, MS.rDiv(MS.rI(1), f.k)); }
      else if(c === "(" || c === letter){ const f = factor(); if(!isC(v) && !isC(f)) throw 0; v = isC(v) ? scale(f, v.k) : scale(v, f.k); }
      else break;
    }
    return v;
  }
  function factor(){
    const c = peek();
    if(c === "("){ i++; br = true; const v = expr(); if(peek() !== ")") throw 0; i++; return v; }
    if(c === letter){ i++; cnt++; return { m:MS.rI(1), k:MS.rI(0) }; }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if(m){ i += m[0].length; cnt++; const dp = (m[1] || "").length - (m[1] ? 1 : 0), d = Math.pow(10, Math.max(0, dp)); return { m:MS.rI(0), k:MS.R(Math.round(parseFloat(m[0]) * d), d) }; }
    if(c === "-"){ i++; const v = factor(); return scale(v, MS.rI(-1)); }
    throw 0;
  }
  try { const v = expr(); if(i !== s.length) return null; return { m:v.m, k:v.k, cnt, br, dv }; } catch(e){ return null; }
}
const piecesCount = p => p.reduce((a, it) => a + (it.fr ? piecesCount(it.fr[0]) + piecesCount(it.fr[1]) : it.n != null || it.v ? 1 : 0), 0);
const hasBrP = p => p.some(it => it.t === "(" || (it.fr && (hasBrP(it.fr[0]) || hasBrP(it.fr[1]))));
const hasFrP = p => p.some(it => it.fr);
/* a side as plain text, the way a student would type it */
function sideTxt(q, sd){
  const t = p => p.map(it => it.v ? q.v : it.n != null ? String(it.n) : it.o ? ` ${it.o} ` : it.fr ? `${wrapT(t(it.fr[0]))}/${wrapT(t(it.fr[1]))}` : it.t || "").join("");
  const wrapT = x => /[+−-]/.test(x.slice(1)) || x.includes(" ") ? `(${x})` : x;
  return t(sideP(q, sd));
}

/* =====================================================================
   WORDS FOR EQUATIONS: "think of a number" sentences built from the
   equation's own structure, and short contexts (the worksheet creator's,
   with Arabic and Farsi). Every context is built from its answer, so every
   number in it is a sensible whole one.
   ===================================================================== */
const PH = {
  mul:{ en:n => `multiply it by ${n}`, ar:n => `أضربه في ${bd(n)}`, fa:n => `آن را در ${bd(n)} ضرب می‌کنم` },
  div:{ en:n => `divide it by ${n}`, ar:n => `أقسمه على ${bd(n)}`, fa:n => `آن را بر ${bd(n)} تقسیم می‌کنم` },
  add:{ en:n => `add ${n}`, ar:n => `أضيف ${bd(n)}`, fa:n => `${bd(n)} اضافه می‌کنم` },
  sub:{ en:n => `subtract ${n}`, ar:n => `أطرح ${bd(n)}`, fa:n => `${bd(n)} کم می‌کنم` },
  mulB:{ en:n => `multiply by ${n}`, ar:n => `أضرب في ${bd(n)}`, fa:n => `در ${bd(n)} ضرب می‌کنم` },
  divB:{ en:n => `divide by ${n}`, ar:n => `أقسم على ${bd(n)}`, fa:n => `بر ${bd(n)} تقسیم می‌کنم` },
  takeFrom:{ en:(a, k) => `multiply it by ${a} and take that away from ${k}`, ar:(a, k) => `أضربه في ${bd(a)} وأطرح الناتج من ${bd(k)}`, fa:(a, k) => `آن را در ${bd(a)} ضرب می‌کنم و حاصل را از ${bd(k)} کم می‌کنم` }
};
const bd = n => `<bdi dir="ltr">${n}</bdi>`;
const THEN = { en:", then ", ar:"، ثم ", fa:"، بعد " };
/* one side in words, as a list of phrase makers (each gives the words in a language) */
function sideWordsL(sd){
  const P = (k, ...a) => lang => PH[k][lang](...a);
  const nW = n => n < 0 ? P("sub", -n) : P("add", n);
  if(sd.t === "ops") return sd.ops.map(o => P(o.o, o.n));
  if(sd.t === "lin"){
    if(sd.m < 0) return sd.k > 0 ? [P("takeFrom", -sd.m, sd.k)] : null;
    if(sd.m === 1) return sd.k ? [nW(sd.k)] : null;
    return sd.k ? [P("mul", sd.m), nW(sd.k)] : [P("mul", sd.m)];
  }
  if(sd.t === "ex"){
    const ts = sd.terms;
    if(ts.length === 1 && ts[0].s > 0){
      const f = ts[0].f;
      if(f.k === "br" && f.m === 1) return [nW(f.kk), P("mulB", f.c)];
      if(f.k === "fr" && f.top.k === "lin") return (f.top.m === 1 ? [nW(f.top.kk)] : [P("mul", f.top.m), nW(f.top.kk)]).concat([P("divB", f.d)]);
    }
    if(ts.length === 2 && ts[0].s > 0 && ts[0].f.k === "fr" && ts[0].f.top.k === "x" && ts[0].f.top.c === 1 && ts[1].f.k === "n")
      return [P("div", ts[0].f.d), nW(ts[1].s * ts[1].f.v)];
  }
  return null;
}
const joinW = (ws, lang) => ws.length === 1 ? ws[0](lang) : ws.slice(0, -1).map(w => w(lang)).join(lang === "en" ? ", " : "، ") + THEN[lang] + ws[ws.length - 1](lang);
/* the whole sentence, in one language; null when this equation can't be said simply */
function thinkText(q, lang){
  const st = q.stages[0], hT = MS.hasX(st.top), hB = MS.hasX(st.bot);
  if(hT && hB){
    const a = sideWordsL(st.top), b = sideWordsL(st.bot);
    if(!a || !b) return null;
    const A = joinW(a, lang), B = joinW(b, lang);
    return { en:`I think of a number. If I ${A}, I get the same as if I ${B}.`,
      ar:`أفكر في عدد. عندما ${A}، أحصل على النتيجة نفسها التي أحصل عليها عندما ${B}.`,
      fa:`عددی را در نظر می‌گیرم. وقتی ${A}، همان عددی را به دست می‌آورم که وقتی ${B}.` }[lang];
  }
  const xs = hT ? st.top : st.bot, ns = hT ? st.bot : st.top, w = sideWordsL(xs);
  if(!w || ns.t !== "num") return null;
  const c = bd(valTxt(q, ns.v)), W = joinW(w, lang);
  return { en:`I think of a number. I ${W}, and get ${valTxt(q, ns.v)}.`,
    ar:`أفكر في عدد. ${W}، فأحصل على ${c}.`,
    fa:`عددی را در نظر می‌گیرم. ${W} و ${c} به دست می‌آید.` }[lang];
}

/* contexts by equation type; u = the unit of the answer, w = what the letter stands for */
const CTX = {
  axb:[ () => { const a = R(2, 6), b = R(3, 15), x = R(3, 20);
          return { top:MS.opsS([{ o:"mul", n:a }, { o:"add", n:b }]), bot:MS.num(a * x + b), x, v:"k",
            t:{ en:`A taxi charges a $${b} flag fall plus $${a} for each kilometre. A trip cost $${a * x + b}. How many kilometres was the trip?`,
                ar:`تتقاضى سيارة أجرة ${bd("$" + b)} أجرة بدء الرحلة و${bd("$" + a)} عن كل كيلومتر. كلّفت رحلة ${bd("$" + (a * x + b))}. كم كيلومتراً كانت الرحلة؟`,
                fa:`یک تاکسی ${bd("$" + b)} ورودیه و برای هر کیلومتر ${bd("$" + a)} می‌گیرد. یک سفر ${bd("$" + (a * x + b))} شد. سفر چند کیلومتر بود؟` },
            w:{ en:"the number of kilometres", ar:"عدد الكيلومترات", fa:"تعداد کیلومترها" } }; },
        () => { const a = R(4, 12), b = R(10, 40), x = R(3, 15);
          return { top:MS.opsS([{ o:"mul", n:a }, { o:"add", n:b }]), bot:MS.num(a * x + b), x, v:"v",
            t:{ en:`A gym charges $${b} to join and $${a} for each visit. Ruby has paid $${a * x + b} altogether. How many visits has she made?`,
                ar:`يتقاضى نادٍ رياضي ${bd("$" + b)} للاشتراك و${bd("$" + a)} عن كل زيارة. دفعت روبي ${bd("$" + (a * x + b))} في المجموع. كم زيارة قامت بها؟`,
                fa:`یک باشگاه ${bd("$" + b)} حق عضویت و برای هر بار ${bd("$" + a)} می‌گیرد. روبی روی هم ${bd("$" + (a * x + b))} پرداخته است. چند بار به باشگاه رفته؟` },
            w:{ en:"the number of visits", ar:"عدد الزيارات", fa:"تعداد دفعه‌ها" } }; } ],
  xab:[ () => { const a = R(2, 5), p = R(4, 12), b = R(5, 20), x = a * p;
          return { top:MS.opsS([{ o:"div", n:a }, { o:"add", n:b }]), bot:MS.num(p + b), x, v:"r",
            t:{ en:`A ribbon is cut into ${a} equal pieces. One piece and a ${b} cm offcut measure ${p + b} cm together. How long was the ribbon?`,
                ar:`قُطع شريط إلى ${bd(a)} قطع متساوية. طول قطعة واحدة مع بقية طولها ${bd(b + " cm")} معاً ${bd((p + b) + " cm")}. كم كان طول الشريط؟`,
                fa:`یک روبان به ${bd(a)} تکهٔ مساوی بریده شد. یک تکه و یک دم‌قیچی ${bd(b + " cm")} روی هم ${bd((p + b) + " cm")} است. روبان چقدر بود؟` },
            w:{ en:"the length of the ribbon in cm", ar:"طول الشريط بالسنتيمتر", fa:"طول روبان بر حسب سانتی‌متر" } }; } ],
  brk:[ () => { const a = R(2, 6), b = R(2, 6), x = R(5, 20);
          return { top:MS.opsS([{ o:"add", n:b }, { o:"mul", n:a }]), bot:MS.num(a * (x + b)), x, v:"t",
            t:{ en:`${a} friends each buy a movie ticket and a $${b} drink. Altogether they pay $${a * (x + b)}. How much is one ticket?`,
                ar:`اشترى كل واحد من ${bd(a)} أصدقاء تذكرة سينما ومشروباً بـ ${bd("$" + b)}. دفعوا ${bd("$" + a * (x + b))} في المجموع. كم ثمن التذكرة الواحدة؟`,
                fa:`هر کدام از ${bd(a)} دوست یک بلیت سینما و یک نوشیدنی ${bd("$" + b)} می‌خرند. روی هم ${bd("$" + a * (x + b))} می‌پردازند. یک بلیت چند است؟` },
            w:{ en:"the price of one ticket in dollars", ar:"ثمن التذكرة الواحدة بالدولار", fa:"قیمت یک بلیت به دلار" } }; } ],
  frc:[ () => { const a = R(2, 6), b = R(2, 12), c = R(3, 12), x = a * c - b;
          return x > 0 ? { top:MS.opsS([{ o:"add", n:b }, { o:"div", n:a }]), bot:MS.num(c), x, v:"l",
            t:{ en:`Mia has a bag of lollies. She adds ${b} more, then shares them equally between ${a} friends. Each friend gets ${c}. How many lollies were in the bag?`,
                ar:`مع ميا كيس حلوى. أضافت ${bd(b)} أخرى، ثم وزّعتها بالتساوي على ${bd(a)} أصدقاء. أخذ كل صديق ${bd(c)}. كم قطعة حلوى كانت في الكيس؟`,
                fa:`میا یک کیسه آبنبات دارد. ${bd(b)} تای دیگر اضافه می‌کند، بعد آن‌ها را مساوی بین ${bd(a)} دوست تقسیم می‌کند. به هر دوست ${bd(c)} تا می‌رسد. در کیسه چند آبنبات بود؟` },
            w:{ en:"the number of lollies in the bag", ar:"عدد قطع الحلوى في الكيس", fa:"تعداد آبنبات‌های کیسه" } } : null; } ],
  bax:[ () => { const a = R(2, 4), x = R(2, 8), c = R(3, 12), b = c + a * x;
          return { top:MS.linS(-a, b), bot:MS.num(c), x, v:"h",
            t:{ en:`A candle is ${b} cm tall and burns down ${a} cm every hour. After how many hours is it ${c} cm tall?`,
                ar:`طول شمعة ${bd(b + " cm")} وتقصر ${bd(a + " cm")} كل ساعة. بعد كم ساعة يصبح طولها ${bd(c + " cm")}؟`,
                fa:`شمعی ${bd(b + " cm")} بلندی دارد و هر ساعت ${bd(a + " cm")} کوتاه می‌شود. بعد از چند ساعت ${bd(c + " cm")} می‌شود؟` },
            w:{ en:"the number of hours", ar:"عدد الساعات", fa:"تعداد ساعت‌ها" } }; } ],
  both:[ () => { const c = R(2, 6), a = c + R(1, 5), x = R(3, 12), b = R(5, 30), d = b + (a - c) * x;
          return { top:MS.linS(a, b), bot:MS.linS(c, d), x, v:"w",
            t:{ en:`Ava has $${b} and saves $${a} a week. Leo has $${d} and saves $${c} a week. After how many weeks will they have the same amount?`,
                ar:`مع آفا ${bd("$" + b)} وتدّخر ${bd("$" + a)} كل أسبوع. ومع ليو ${bd("$" + d)} ويدّخر ${bd("$" + c)} كل أسبوع. بعد كم أسبوعاً يصبح معهما المبلغ نفسه؟`,
                fa:`آوا ${bd("$" + b)} دارد و هر هفته ${bd("$" + a)} پس‌انداز می‌کند. لئو ${bd("$" + d)} دارد و هر هفته ${bd("$" + c)} پس‌انداز می‌کند. بعد از چند هفته پولشان برابر می‌شود؟` },
            w:{ en:"the number of weeks", ar:"عدد الأسابيع", fa:"تعداد هفته‌ها" } }; },
         () => { const c = R(1, 4), a = c + R(1, 4), x = R(4, 15), b = R(5, 20), d = b + (a - c) * x;
          return { top:MS.linS(a, b), bot:MS.linS(c, d), x, v:"g",
            t:{ en:`Phone plan A costs $${b} plus $${a} per GB of data. Plan B costs $${d} plus $${c} per GB. For how many GB do they cost the same?`,
                ar:`تكلفة باقة الهاتف A هي ${bd("$" + b)} و${bd("$" + a)} لكل GB من البيانات. وتكلفة الباقة B هي ${bd("$" + d)} و${bd("$" + c)} لكل GB. عند كم GB تتساوى تكلفتهما؟`,
                fa:`طرح تلفن A ${bd("$" + b)} به‌اضافهٔ ${bd("$" + a)} برای هر GB اینترنت است. طرح B ${bd("$" + d)} به‌اضافهٔ ${bd("$" + c)} برای هر GB است. برای چند GB هزینه‌شان برابر است؟` },
            w:{ en:"the number of GB", ar:"عدد الـ GB", fa:"تعداد GB" } }; } ],
  bbrk:[ () => { const a = R(2, 4), c = a + R(1, 3), b = R(3, 9), x = R(3, 12), d = a * (x + b) - c * x;
          return d > 0 ? { top:MS.exS([MS.tm(1, MS.fBr(a, 1, b))]), bot:MS.linS(c, d), x, v:"m",
            t:{ en:`Ella buys ${a} bags of marbles, and each bag comes with ${b} bonus marbles. Sam buys ${c} bags with no bonus, plus ${d} loose marbles. They end up with the same number. How many marbles are in a bag?`,
                ar:`اشترت إيلا ${bd(a)} أكياس من الكرات الزجاجية، ومع كل كيس ${bd(b)} كرات إضافية. واشترى سام ${bd(c)} أكياس بلا إضافة، و${bd(d)} كرة منفردة. صار مع كلٍّ منهما العدد نفسه. كم كرة في الكيس؟`,
                fa:`الا ${bd(a)} کیسه تیله می‌خرد و با هر کیسه ${bd(b)} تیلهٔ هدیه می‌گیرد. سام ${bd(c)} کیسه بدون هدیه و ${bd(d)} تیلهٔ جدا می‌خرد. تعداد تیله‌هایشان برابر می‌شود. در هر کیسه چند تیله است؟` },
            w:{ en:"the number of marbles in a bag", ar:"عدد الكرات في الكيس", fa:"تعداد تیله‌های هر کیسه" } } : null; } ]
};

/* =====================================================================
   QUESTIONS
   An item: { kind, level, q (the equation), cat, parts[], settled, correct }.
   A part:  { t, first (null until marked), last (right now), ... }.
   ===================================================================== */
function item(kind, level, q, o){
  return Object.assign({ kind, level, q, cat:kind, parts:[], pi:0, settled:false, correct:false, model:kind === "drive" }, o || {});
}
const part = (t, o) => Object.assign({ t, first:null, last:false, tries:0 }, o);
const numSide = st => st.top.t === "num" ? "top" : st.bot.t === "num" ? "bot" : null;

/* the move's choices: the right one and three that aren't (doing it again, undoing in the wrong order, another operation) */
function moveOpts(q, j){
  const mv = q.moves[j], st = q.stages[j], out = [{ mv, ok:true }];
  const seen = new Set([JSON.stringify([mv.kind, mv.n, mv.s])]);
  const add = (m, why) => { const key = JSON.stringify([m.kind, m.n, m.s]); if(seen.has(key) || out.length >= 4) return; seen.add(key); out.push({ mv:m, ok:false, why }); };
  const lab = m => pillOf(q, m);
  const clearing = mv.kind === "mul" && (MS.hasFr(sideP(q, st.top)) || MS.hasFr(sideP(q, st.bot)));
  if(mv.kind === "xterm"){
    const a = Math.abs(mv.s);
    add({ kind:"xterm", s:-mv.s }, mv.s > 0 ? ["wXterm", {}] : ["wXneg", {}]);
    add({ kind:mv.s > 0 ? "sub" : "add", n:a }, ["wGeneric", {}]);
    add({ kind:a > 1 ? "div" : "mul", n:Math.max(2, a) }, ["wGeneric", {}]);
    add({ kind:"mul", n:Math.max(2, a) + 1 }, ["wGeneric", {}]);
  } else {
    const opp = { add:"sub", sub:"add", mul:"div", div:"mul" }[mv.kind];
    add({ kind:opp, n:mv.n }, clearing ? ["wClear", {}] : ["wDoes", { c:lab({ kind:opp, n:mv.n }), b:lab({ kind:opp, n:mv.n }) }]);
    /* undoing another operation on the same side first: the wrong order */
    const sd = st.top.t === "ops" ? st.top : st.bot.t === "ops" ? st.bot : null;
    if(sd && sd.ops.length > 1){
      const inner = sd.ops[sd.ops.length - 2], und = { add:"sub", sub:"add", mul:"div", div:"mul" }[inner.o];
      add({ kind:und, n:inner.n }, ["wOrder", { c:lab({ kind:und, n:inner.n }), b:lab({ kind:opp, n:mv.n }) }]);
    }
    if(st.top.t === "lin" && st.top.k){ const k = Math.abs(st.top.k); add({ kind:st.top.k > 0 ? "add" : "sub", n:k }, ["wGeneric", {}]); }
    ["add", "sub", "mul", "div"].forEach(k => { if(k === "mul" || k === "div"){ if(mv.n >= 2) add({ kind:k, n:mv.n }, ["wGeneric", {}]); } else add({ kind:k, n:mv.n }, ["wGeneric", {}]); });
    add({ kind:mv.kind, n:mv.n + 1 }, ["wGeneric", {}]);
    add({ kind:opp, n:mv.n + 1 }, ["wGeneric", {}]);
    add({ kind:mv.kind, n:mv.n + 2 }, ["wGeneric", {}]);
  }
  return shuffle(out).map(o => Object.assign(o, { label:lab(o.mv) }));
}
/* the right move, said in words when a wrong one is chosen */
function moveWhy(q, j, opt){
  const mv = q.moves[j], m = eqS(esc(pillOf(q, mv))), x = eqS(Lt(q.v));
  const [k, v] = opt.why || ["wGeneric", {}];
  const vars = Object.assign({ m, x }, v);
  if(vars.c) vars.c = eqS(esc(vars.c)); if(vars.b) vars.b = eqS(esc(vars.b));
  if(k === "wClear") vars.d = mv.n;
  if(k === "wXneg"){ const a = Math.abs(mv.s), L = (a === 1 ? "" : a) + q.v; vars.t = eqS(esc(L)); vars.u = eqS(esc(MINUS + L)); }
  return [k, vars];
}

/* ---- Sweet: drive the double number line ---- */
function qDrive(level, q){
  const it = item("drive", level, q);
  q.moves.forEach((mv, j) => {
    if(MS.isRewrite(mv)){ it.parts.push(part("rw", { j, unmarked:true })); return; }
    it.parts.push(part("move", { j, opts:moveOpts(q, j), sel:null }));
    const side = numSide(q.stages[j + 1]);
    if(side) it.parts.push(part("val", { j, side, ans:q.stages[j + 1][side].v, val:"" }));
  });
  return it;
}
/* ---- Mild: write the working = under = ---- */
function qGrid(level, q){
  const it = item("grid", level, q);
  it.rows = q.moves.map((mv, j) => {
    const rw = MS.isRewrite(mv), nxt = q.stages[j + 1];
    return { j, rw, mv, move:"", top:"", bot:"",
      fixT:rw && !mv.sides.t, fixB:rw && !mv.sides.b,        /* a side a rewrite doesn't touch is printed */
      exT:nxt.top, exB:nxt.bot };
  });
  it.parts.push(part("grid", { marks:null }));
  return it;
}
/* ---- solve: just the answer ---- */
function qSolve(level, q){
  const it = item("solve", level, q);
  it.parts.push(part("num", { ans:q.x, val:"" }));
  return it;
}
/* ---- which move first? (the first move is never a rewrite here) ---- */
function qFirst(level, q){
  const it = item("first", level, q);
  it.parts.push(part("mc", { opts:moveOpts(q, 0).map(o => ({ h:`<span class="mvPill big">${esc(o.label)}</span>`, ok:o.ok, why:o.why })), sel:null }));
  return it;
}
/* ---- check by substituting ---- */
function qCheck(level, q){
  const it = item("check", level, q);
  const right = q.x, wrong = [];
  const seen = new Set([valTxt(q, right)]);
  const add = r => { if(!r) return; const k = valTxt(q, r); if(seen.has(k) || wrong.length >= 3 || Math.abs(MS.rF(r)) > 200) return; seen.add(k); wrong.push(r); };
  /* the usual slips first, then near misses */
  q.moves.forEach((m, j) => slips(q, j).forEach(s => { const w = wrongFromSlip(q, j, s); if(w) add(w.x); }));
  add(MS.rMul(right, MS.rI(-1))); add(MS.rAdd(right, MS.rI(1))); add(MS.rSub(right, MS.rI(1))); add(MS.rAdd(right, MS.rI(2)));
  const opts = [{ h:xEq(q, right), ok:true }].concat(wrong.map(r => ({ h:xEq(q, r), ok:false })));
  it.parts.push(part("mc", { opts:shuffle(opts), sel:null }));
  return it;
}
/* ---- spot the mistake ---- */
const NAMES = ["Mia", "Sam", "Noah", "Zara", "Kai", "Lily", "Jai", "Ava", "Leo", "Ruby", "Omar", "Tia"];
let NAMEBAG = [];
const nameOf = () => { if(!NAMEBAG.length) NAMEBAG = shuffle(NAMES); return NAMEBAG.pop(); };
function qMistake(level, q, mk){
  const it = item("mistake", level, q, { mk, name:nameOf() });
  const opts = mk.lines.slice(1).map((l, i) => ({ h:"lineN", n:i + 2, ok:i + 1 === mk.bad }));
  opts.push({ h:"noMistake", ok:false });
  it.parts.push(part("mc", { opts, sel:null, words:true }));
  return it;
}
/* ---- think of a number ---- */
function qThink(level, q){
  const it = item("think", level, q);
  it.parts.push(part("num", { ans:q.x, val:"" }));
  return it;
}
/* ---- a worded problem ---- */
function qWord(level, type){
  const list = CTX[type];
  for(let t = 0; t < 400; t++){
    const c = pick(list)(); if(!c) continue;
    const q = MS.finish({ top:c.top, bot:c.bot, x:MS.rI(c.x), type }, c.v);
    if(!q) continue;
    const sg = sigOf(q); if(USED.has(sg)) continue; USED.add(sg);
    q.st = c; q.level = level;
    const it = item("word", level, q);
    it.parts.push(part("num", { ans:q.x, val:"" }));
    return it;
  }
  return null;
}

/* ---------------------------------------------------------- the slips in someone's working (the worksheet creator's) */
function solveFrom(top, bot){
  const lt = MS.linOf(top), lb = MS.linOf(bot);
  if(MS.rEq(lt.m, lb.m)) return null;
  const x = MS.rDiv(MS.rSub(lb.k, lt.k), MS.rSub(lt.m, lb.m));
  const sol = top.t === "ex" || bot.t === "ex" ? MS.exSolve(top, bot, x) : MS.solve(top, bot, x);
  return sol && sol.moves.length ? { x, stages:sol.stages } : null;
}
function slips(q, j){
  const mv = q.moves[j], a = q.stages[j], b = q.stages[j + 1], out = [];
  const numS = a.top.t === "num" ? "top" : a.bot.t === "num" ? "bot" : null;
  const m = eqS(esc(pillOf(q, mv)));
  if(["add", "sub", "mul", "div"].includes(mv.kind) && numS){
    const v = a[numS].v, n = MS.rI(mv.n);
    const wrong = mv.kind === "sub" ? MS.rAdd(v, n) : mv.kind === "add" ? MS.rSub(v, n) : mv.kind === "div" ? MS.rMul(v, n) : MS.rDiv(v, n);
    const opp = { sub:"+ " + mv.n, add:MINUS + " " + mv.n, div:TIMES + " " + mv.n, mul:DIVIDE + " " + mv.n }[mv.kind];
    out.push({ kind:"way", side:numS, val:wrong, why:{ k:"sWay", v:{ m, o:eqS(opp) } } });
    out.push({ kind:"one", side:numS, val:v, why:{ k:"sOne", v:{ m } } });
  }
  if(mv.kind === "xterm" && a.top.t === "lin" && a.bot.t === "lin"){
    const sd = a.bot;
    out.push({ kind:"xway", side:"bot", sideObj:MS.linS(sd.m + mv.s, sd.k, sd.kFirst), why:{ k:"sXway", v:{ m } } });
  }
  if(mv.kind === "exp"){
    ["top", "bot"].forEach(sk => {
      const sd = a[sk]; if(sd.t !== "ex") return;
      const bi = sd.terms.findIndex(t => t.f.k === "br"); if(bi < 0) return;
      const t0 = sd.terms[bi], f = t0.f;
      const half = MS.exS(sd.terms.flatMap((t, i) => i === bi ? MS.linTerms(t.s, f.c * f.m, f.kk, f.kFirst) : [t]));
      out.push({ kind:"half", side:sk, sideObj:half, why:{ k:"sHalf", v:{ c:f.c } } });
      if(t0.s < 0){
        const sgn = MS.exS(sd.terms.flatMap((t, i) => i === bi ? MS.linTerms(1, -f.c * f.m, f.c * f.kk, f.kFirst) : [t]));
        out.push({ kind:"neg", side:sk, sideObj:sgn, why:{ k:"sNeg", v:{ c:f.c } } });
      }
    });
  }
  if(mv.kind === "mul" && (a.top.t === "ex" || a.bot.t === "ex")){
    ["top", "bot"].forEach(sk => {
      const sd = a[sk]; if(sd.t !== "ex" || !sd.terms.some(t => t.f.k === "fr") || !sd.terms.some(t => t.f.k === "n")) return;
      const correct = b[sk]; if(correct.t !== "ex") return;
      const nTerm = sd.terms.find(t => t.f.k === "n");
      const wrong = MS.exS(correct.terms.map(t => t.f.k === "n" ? nTerm : t));
      out.push({ kind:"frac", side:sk, sideObj:wrong, why:{ k:"sFrac", v:{ d:mv.n, k:nTerm.f.v } } });
    });
  }
  return out;
}
function wrongFromSlip(q, j, s){
  const b = q.stages[j + 1], wrong = { top:b.top, bot:b.bot };
  if(s.sideObj) wrong[s.side] = s.sideObj; else wrong[s.side] = MS.num(s.val);
  const rest = solveFrom(wrong.top, wrong.bot);
  if(!rest || MS.rEq(rest.x, q.x) || rest.x.d > 12 || Math.abs(MS.rF(rest.x)) > 400) return null;
  return { wrong, x:rest.x, stages:rest.stages };
}
function makeMistake(q, level){
  const cands = [];
  q.moves.forEach((m, j) => slips(q, j).forEach(s => cands.push({ j, s })));
  if(!cands.length) return null;
  const hardK = ["half", "neg", "frac"], late = level === "medium" || level === "spicy";
  const pool = late && cands.some(c => hardK.includes(c.s.kind)) ? cands.filter(c => hardK.includes(c.s.kind)) : cands;
  for(const c of shuffle(pool)){
    const w = wrongFromSlip(q, c.j, c.s); if(!w) continue;
    const lines = q.stages.slice(0, c.j + 1).map(st => ({ top:st.top, bot:st.bot })).concat([w.wrong], w.stages.slice(1).map(st => ({ top:st.top, bot:st.bot })));
    if(lines.length > 6) continue;
    return { lines, bad:c.j + 1, wrongX:w.x, why:c.s.why, right:{ top:q.stages[c.j + 1].top, bot:q.stages[c.j + 1].bot } };
  }
  return null;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"dSweet" },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"dMild" },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"dMedium" },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"dSpicy" }
};
const ORDER = ["sweet", "mild", "medium", "spicy"];
const firstReal = q => !MS.isRewrite(q.moves[0]);
const canThink = q => !!thinkText(q, "en") && !!thinkText(q, "ar") && !!thinkText(q, "fa");
function buildPaper(level){
  USED = new Set(); NAMEBAG = []; DECK = [];
  const E = (o, ok) => eqFor(level, o, ok);
  const drive = o => qDrive(level, E(Object.assign({ plain:true, test:q => q.moves.length <= 6 }, o)));
  const grid = o => qGrid(level, E(Object.assign({ test:q => q.moves.length <= 5 }, o)));
  const solve = o => qSolve(level, E(o));
  const first = o => qFirst(level, E(Object.assign({ test:firstReal }, o)));
  const check = o => qCheck(level, E(o));
  const mistake = o => { const q = E(Object.assign({ test:q => !!(q._mk = makeMistake(q, level)) }, o)); return qMistake(level, q, q._mk || makeMistake(q, level)); };
  const think = o => qThink(level, E(Object.assign({ plain:true, test:canThink }, o)));
  const word = () => { const ks = POOL.filter(k => CTX[k]); return ks.length ? qWord(level, pick(ks)) : think({}); };
  if(level === "sweet") return [drive(), drive(), first(), drive(), drive(), check(), drive(), drive(), first(), drive()];
  if(level === "mild") return [grid(), solve(), first(), grid(), check(), grid(), mistake(), solve(), grid(), think()];
  if(level === "medium") return [solve({ neg:true }), solve(), first({ neg:true }), solve({ neg:true }), check({ neg:true }),
    mistake(), solve({ neg:true }), think(), solve(), solve({ neg:true })];
  const fr = POOL.some(k => MS.FRAC_OK[k]);
  return [solve({ neg:true }), solve({ frac:fr }), mistake({ neg:true }), word(), solve({ neg:true, frac:fr }),
    check({ neg:true }), solve({ frac:fr }), mistake(), word(), solve({ neg:true })];
}

/* =====================================================================
   THE PAGE
   ===================================================================== */
const S = { levelKey:null, items:[], i:0, busy:false };
const cur = () => S.items[S.i];
const stacked = () => window.innerWidth <= 980;
let FB = null;                                  /* the feedback line: [kind, html] */
function setFb(kind, html){ FB = kind ? [kind, html] : null; const f = $("fb"); if(f){ f.className = "fb" + (kind ? " " + kind : ""); f.innerHTML = html || ""; } }

/* ---------------------------------------------------------- the answer box: MathLive's fraction box on Spicy
   (as the Adding and Subtracting Fractions quiz); a plain box if it can't load */
let ML = false;
function latexToEntry(latex){
  let s = String(latex || "");
  s = s.replace(/\\left|\\right|\\,|\\;|\\!/g, "").replace(/\\placeholder\{([^{}]*)\}/g, "$1");
  let prev;
  do { prev = s;
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, " $1/$2 ").replace(/\\frac\{([^{}]*)\}(\d)/g, " $1/$2 ")
      .replace(/\\frac(\d)\{([^{}]*)\}/g, " $1/$2 ").replace(/\\frac(\d)(\d)/g, " $1/$2 ");
  } while(s !== prev);
  return s.replace(/[{}]/g, "").replace(/\\cdot|\\times/g, "*").replace(/\s+/g, " ").trim();
}
const wantsML = it => ML && it.level === "spicy";
function ansBox(it, p, locked, mark){
  const cls = mark == null ? "" : mark ? " right" : " wrong";
  if(wantsML(it)) return `<span class="mfWrap${cls}"><math-field class="mf${cls}" data-mf="1"${locked ? " read-only" : ""}></math-field></span>`;
  return `<input class="cell ans${cls}" data-a="1" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(p.val || "")}"${locked ? " readonly" : ""} aria-label="Your answer">`;
}
function readAns(p){
  const mf = $("qCard").querySelector("math-field[data-mf]");
  if(mf){ try { p.latex = mf.getValue ? mf.getValue("latex") : mf.value; } catch(e){ p.latex = ""; } p.val = latexToEntry(p.latex); }
  return p.val;
}

/* ---------------------------------------------------------- the card */
function qHead(it){
  const q = it.q, x = eqS(Lt(q.v));
  if(it.kind === "drive") return Lg("driveIntro");
  if(it.kind === "grid") return Lg("gridIntro");
  if(it.kind === "solve") return Lg(MS.rInt(q.x) || it.level !== "spicy" ? "solve" : "solveFor", { x });
  if(it.kind === "first"){ const mv = q.moves[0]; return Lg(mv.kind === "xterm" ? "askXterm" : (mv.kind === "mul" && (MS.hasFr(sideP(q, q.stages[0].top)) || MS.hasFr(sideP(q, q.stages[0].bot)))) ? "askClear" : "askUndo", { x }); }
  if(it.kind === "check") return Lg("checkQ", { x });
  if(it.kind === "mistake") return Lg("mistakeQ", { name:nameW(it.name), e:eqS(eqH(q, 0)) });
  if(it.kind === "think") return bi(thinkText(q, "en"), LANG === "en" ? "" : thinkText(q, LANG)) + `<div class="qSub">${Lg("thinkAsk")}</div>`;
  if(it.kind === "word") return bi(esc(q.st.t.en), LANG === "en" ? "" : q.st.t[LANG]) + `<div class="qSub">${Lg("wordAsk")} ${Lg("letBe", { v:Lt(q.v), w:q.st.w })}</div>`;
  return "";
}
function paint(){
  const it = cur(); if(!it) return;
  $("qCounter").innerHTML = one("counter", { n:S.i + 1, t:S.items.length });
  $("progressFill").style.width = (S.items.filter(x => x.settled).length / S.items.length * 100) + "%";
  let h = `<div class="qBody"><div class="qText">${qHead(it)}</div>`;
  if(!["mistake", "think", "word", "grid"].includes(it.kind)) h += `<div class="origEq" dir="ltr">${eqS(eqH(it.q, 0))}</div>`;
  if(it.kind === "drive") h += driveHTML(it);
  else if(it.kind === "grid") h += gridHTML(it);
  else if(it.kind === "mistake") h += mistakeLines(it) + mcHTML(it, it.parts[0]);
  else if(it.parts[0].t === "mc") h += mcHTML(it, it.parts[0]);
  else h += numHTML(it, it.parts[0]);
  h += `<div class="fb" id="fb" aria-live="polite"></div></div>`;
  $("qCard").innerHTML = h;
  if(FB) setFb(FB[0], FB[1]); else defaultFb(it);
  bindCard(it);
  $("app").classList.toggle("noModel", !it.model);
  $("prevBtn").disabled = S.i === 0;
  $("nextBtn").innerHTML = one(S.i === S.items.length - 1 ? "finish" : "next");
  $("nextBtn").classList.toggle("ready", !!it.settled);
  if(it.model){ fitBoard(); boardShow(it, false); }
}
function defaultFb(it){
  if(it.settled){
    if(it.correct) return setFb("good", Lg("good"));
    if(it.skipped) return setFb("bad", `<b>${Lg("skipped")}</b>` + solution(it));
    if(it.kind === "drive" || it.kind === "grid") return setFb("fixed", Lg("fixedNoScore"));
    return setFb("bad", `<b>${Lg("notQuite")}</b>` + solution(it));
  }
  if(it.model) setFb("hint", `<span class="hIco" aria-hidden="true">${stacked() ? "↓" : "→"}</span>${Lg("hintBoard", { where:{ k:stacked() ? "below" : "right" } })}`);
  else setFb("", "");
}
/* what a settled question shows: the working, or why */
function solution(it){
  const q = it.q, p = it.parts[0];
  if(it.kind === "check"){ at(q); const st = q.stages[0], v = valH(q, st.val);
    const e = [st.top, st.bot].filter(sd => MS.hasX(sd)).map(sd => `${MS.H(MS.subP(sd, q.x))} = ${v}`).join(" , ");
    return " " + Lg("checkWhy", { e:eqS(e), a:xEq(q) }); }
  if(it.kind === "mistake"){ const mk = it.mk;
    return " " + Lg("mistakeWhy", { n:mk.bad + 1, why:mk.why, e:eqS(eqLine(q, mk.right)), a:xEq(q) }); }
  if(it.kind === "first"){ const o = p.opts.find(o => o.ok); return ` ${Lg("moveShould", { m:eqS(esc(pillOf(q, q.moves[0]))) })}` + workingHTML(q); }
  if(it.kind === "word") return ` ${Lg("wordWhy", { e:eqS(eqH(q, 0)), a:xEq(q) })}` + workingHTML(q);
  return ` ${Lg("theAnswer")} ${xEq(q)}` + workingHTML(q);
}

/* ---- a typed number ---- */
function numHTML(it, p){
  const locked = p.last || it.settled && !p.last && it.skipped;
  return `<div class="ansEq" dir="ltr"><span class="eqt">${eqS(Lt(it.q.v) + " =")}</span>${ansBox(it, p, p.last || it.skipped, p.mark)}</div>`
    + (wantsML(it) && !(p.last || it.skipped) ? `<div class="fracRow"><button class="fracBtn" type="button" id="fracBtn"><span class="fracIco"><span>a</span><span>b</span></span></button><span class="fracHint">${one("fracHint")}</span></div>` : "")
    + checkRow(it, p.last || it.skipped);
}
const checkRow = (it, done) => `<div class="checkRow">${done ? "" : `<button class="checkBtn" type="button" id="checkBtn">${one(it.parts[0].first === null ? "check" : "checkAgain")}</button>`}</div>`;
/* ---- multiple choice ---- */
function mcHTML(it, p){
  const done = p.last || it.skipped;
  return `<div class="mcList">` + p.opts.map((o, i) => {
    const st = p.marks && p.marks[i] != null ? (p.marks[i] ? " right" : " wrong") : "";
    const show = done && o.ok ? " right" : "";
    const body = p.words ? Lg(o.h, { n:o.n }) : o.h;
    return `<button class="mcOpt${p.sel === i ? " on" : ""}${st || show}" type="button" data-opt="${i}"${done ? " disabled" : ""}><span class="key">${"ABCDEFG"[i]}</span><span>${body}</span></button>`;
  }).join("") + `</div>` + checkRow(it, done);
}
function mistakeLines(it){
  const q = it.q, mk = it.mk, show = it.settled;
  return `<div class="mLines" dir="ltr">` + mk.lines.map((l, i) => `<div class="mRow${show && i === mk.bad ? " bad" : ""}"><span class="mN">${one("lineN", { n:i + 1 })}</span><span class="eq">${eqLine(q, l)}</span></div>`).join("") + `</div>`;
}

/* ---- Sweet: driving the line ---- */
function driveHTML(it){
  const q = it.q;
  if(it.skipped) return "";
  let rows = "";
  /* the working so far, = under = */
  const doneTo = it.parts.slice(0, it.pi).reduce((a, p) => Math.max(a, p.t === "rw" || (p.t === "val") || (p.t === "move" && !hasVal(it, p.j)) ? p.j + 1 : a), 0);
  for(let i = 1; i <= doneTo; i++) rows += `<div class="wRow">${pillH(q, q.moves[i - 1])}<span class="eq">${eqH(q, i)}</span></div>`;
  let h = rows ? `<div class="wList" dir="ltr">${rows}</div>` : "";
  const p = it.parts[it.pi];
  if(!p){ h += `<div class="driveDone">${Lg("driveDone", { e:xEq(q) })}</div>`; return h; }
  if(p.t === "rw") h += `<div class="drivePrompt">${Lg("rwNote")}</div><div class="rwRow"><button class="rwBtn" type="button" id="rwBtn">${Lg(q.moves[p.j].kind === "exp" ? "rwExp" : "rwCol")} ▸</button></div>`;
  else if(p.t === "move"){
    const mv = q.moves[p.j], st = q.stages[p.j];
    const clearing = mv.kind === "mul" && (MS.hasFr(sideP(q, st.top)) || MS.hasFr(sideP(q, st.bot)));
    h += `<div class="drivePrompt">${Lg(mv.kind === "xterm" ? "askXterm" : clearing ? "askClear" : "askUndo", { x:eqS(Lt(q.v)) })}</div>`;
    h += `<div class="moveOpts" dir="ltr">` + p.opts.map((o, i) => `<button class="moveOpt${p.bad && p.bad.includes(i) ? " wrong" : ""}" type="button" data-mv="${i}"${S.busy ? " disabled" : ""}>${esc(o.label)}</button>`).join("") + `</div>`;
  } else if(p.t === "val"){
    const mv = q.moves[p.j], nx = q.stages[p.j + 1], box = `<input class="cell val${p.mark === false ? " wrong" : ""}" data-v="1" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(p.val || "")}" aria-label="The new number">`;
    const L0 = p.side === "top" ? box : sideH(q, nx.top), R0 = p.side === "bot" ? box : sideH(q, nx.bot);
    h += `<div class="drivePrompt">${Lg("bothOnLine", { m:eqS(esc(pillOf(q, mv))) })} &middot; ${Lg("typeNew")}</div>`;
    h += `<div class="ansEq" dir="ltr"><span class="eq">${L0}</span><span class="eq">=</span><span class="eq">${R0}</span></div>` + `<div class="checkRow"><button class="checkBtn" type="button" id="checkBtn"${S.busy ? " disabled" : ""}>${one("check")}</button></div>`;
  }
  return h;
}
const hasVal = (it, j) => it.parts.some(p => p.t === "val" && p.j === j);

/* ---- Mild: the working, = under = ---- */
function gridHTML(it){
  const q = it.q, p = it.parts[0], done = p.last || it.skipped, mk = p.marks || {};
  const cls = k => mk[k] == null ? "" : mk[k] ? " right" : " wrong";
  const show = (r, k) => done && !p.last ? (k === "move" ? pillOf(q, r.mv) : sideTxt(q, k === "top" ? r.exT : r.exB)) : r[k];
  const inp = (r, k, ph) => `<input class="cell g${k === "move" ? " mvIn" : ""}${cls(r.j + k)}" data-g="${r.j}" data-k="${k}" autocomplete="off" spellcheck="false" inputmode="text" value="${esc(show(r, k) || "")}"${done ? " readonly" : ""}${ph ? ` placeholder="${ph}"` : ""} aria-label="${k}">`;
  let h = `<div class="grid" dir="ltr"><div class="gL"><span class="eq">${sideH(q, q.stages[0].top)}</span></div><div class="gE">=</div><div class="gR"><span class="eq">${sideH(q, q.stages[0].bot)}</span></div>`;
  it.rows.forEach(r => {
    if(r.rw){
      const pl = `<span class="mvPill rw">${esc(pillOf(q, r.mv))}</span>`;
      h += `<div class="gL gp">${r.fixT ? "" : pl}</div><div class="gE"></div><div class="gR gp">${r.fixB ? "" : pl}</div>`;
    } else h += `<div class="gL gp">${inp(r, "move")}</div><div class="gE"></div><div class="gR gp"><span class="mirror" data-mirror="${r.j}">${esc(r.move || "")}</span></div>`;
    const prev = q.stages[r.j];
    h += `<div class="gL">${r.fixT ? `<span class="eq">${sideH(q, prev.top)}</span>` : inp(r, "top")}</div><div class="gE">=</div><div class="gR">${r.fixB ? `<span class="eq">${sideH(q, prev.bot)}</span>` : inp(r, "bot")}</div>`;
  });
  h += `</div><div class="gHint">${Lg("gridHint")}</div>` + checkRow(it, done);
  return h;
}

/* ---------------------------------------------------------- wiring the card */
function bindCard(it){
  const card = $("qCard"), p = it.parts[it.pi] || it.parts[0];
  card.querySelectorAll("input[data-a]").forEach(inp => {
    inp.addEventListener("input", () => { p.val = inp.value; inp.classList.remove("right", "wrong"); });
    inp.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); if(it.settled) next(); else check(); } });
  });
  card.querySelectorAll("math-field[data-mf]").forEach(mf => {
    try { if(p.latex) mf.value = p.latex; } catch(e){}
    try { mf.mathVirtualKeyboardPolicy = window.matchMedia && matchMedia("(pointer: coarse)").matches ? "onfocus" : "manual"; } catch(e){}
    mf.addEventListener("input", () => { try { p.latex = mf.getValue ? mf.getValue("latex") : mf.value; } catch(e){} mf.classList.remove("right", "wrong"); });
    mf.addEventListener("keydown", e => { if(e.key !== "Enter") return; e.preventDefault(); e.stopPropagation(); if(it.settled) next(); else check(); }, true);
  });
  const fb = $("fracBtn");
  if(fb) fb.addEventListener("click", () => { const mf = card.querySelector("math-field[data-mf]"); if(!mf) return; try { if(mf.insert) mf.insert("\\frac{#?}{#?}", { focus:true }); else if(mf.executeCommand) mf.executeCommand(["insert", "\\frac{#?}{#?}"]); mf.focus(); } catch(e){} });
  card.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => {
    p.sel = +b.dataset.opt;
    b.parentNode.querySelectorAll(".mcOpt").forEach(x => x.classList.toggle("on", x === b));
  }));
  card.querySelectorAll("[data-mv]").forEach(b => b.addEventListener("click", () => chooseMove(+b.dataset.mv)));
  card.querySelectorAll("input[data-v]").forEach(inp => {
    inp.addEventListener("input", () => { p.val = inp.value; inp.classList.remove("wrong"); });
    inp.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); check(); } });
  });
  card.querySelectorAll("input[data-g]").forEach(inp => {
    const r = it.rows[+inp.dataset.g];
    inp.addEventListener("input", () => {
      r[inp.dataset.k] = inp.value; inp.classList.remove("right", "wrong");
      if(inp.dataset.k === "move"){ const m = card.querySelector(`[data-mirror="${r.j}"]`); if(m) m.textContent = inp.value; }
    });
    inp.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); if(it.settled) next(); else check(); } });
  });
  const rb = $("rwBtn"); if(rb) rb.addEventListener("click", pressRewrite);
  const cb = $("checkBtn"); if(cb) cb.addEventListener("click", check);
}
function focusAnswer(){
  if("ontouchstart" in window) return;
  const el = $("qCard").querySelector("input[data-v], input[data-a]:not([readonly]), input[data-g]:not([readonly]), math-field[data-mf]:not([read-only])");
  if(el) try { el.focus({ preventScroll:true }); } catch(e){}
}

/* ---------------------------------------------------------- marking */
function settle(it, ok){
  if(it.settled) return;
  it.settled = true; it.correct = ok;
  if(ok) confetti(1);
  if(window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
}
function markFirst(p, ok){ if(p.first === null) p.first = ok; }
function check(){
  const it = cur(); if(!it || S.busy) return;
  if(it.kind === "drive") return checkVal(it);
  if(it.kind === "grid") return checkGrid(it);
  const p = it.parts[0];
  if(p.last || it.skipped) return;
  if(p.t === "mc"){
    if(p.sel == null){ setFb("warn", Lg("chooseFirst")); return; }
    const ok = !!p.opts[p.sel].ok;
    p.marks = p.opts.map((o, i) => i === p.sel ? ok : null);
    return after(it, p, ok);
  }
  const raw = readAns(p);
  if(!String(raw || "").trim()){ setFb("warn", Lg("typeFirst")); return; }
  const r = parseNum(raw);
  if(!r){ setFb("warn", Lg("unreadable")); return; }
  const ok = MS.rEq(r.r, p.ans);
  if(ok && r.frac && MS.gcd(r.frac[0], r.frac[1]) > 1){ setFb("warn", Lg("simplify")); return; }
  p.mark = ok;
  after(it, p, ok);
}
function after(it, p, ok){
  const firstTry = p.first === null;
  markFirst(p, ok); p.last = ok;
  if(firstTry) settle(it, ok);
  FB = null;
  paint();
  if(ok) $("nextBtn").focus({ preventScroll:true }); else focusAnswer();
}

/* ---- Sweet: choose a move; type the new number; press on through a rewrite ---- */
function chooseMove(i){
  const it = cur(), p = it.parts[it.pi];
  if(!p || p.t !== "move" || S.busy) return;
  const o = p.opts[i];
  p.tries++;
  if(!o.ok){
    markFirst(p, false);
    p.bad = (p.bad || []).concat([i]);
    FB = ["bad", `<b>${Lg("notQuite")}</b> ` + Lg(...moveWhy(it.q, p.j, o))];
    paint(); return;
  }
  markFirst(p, true); p.last = true;
  FB = ["good", Lg("stepGood")];
  advance(it);
}
function checkVal(it){
  const p = it.parts[it.pi];
  if(!p || p.t !== "val" || S.busy) return;
  if(!String(p.val || "").trim()){ setFb("warn", Lg("typeFirst")); return; }
  const r = parseNum(p.val);
  if(!r){ setFb("warn", Lg("unreadable")); return; }
  const ok = MS.rEq(r.r, p.ans);
  markFirst(p, ok);
  if(!ok){
    p.mark = false;
    const q = it.q, mv = q.moves[p.j], a = q.stages[p.j][p.side], b = q.stages[p.j + 1][p.side];
    FB = ["bad", `<b>${Lg("notQuite")}</b> ` + Lg("wVal", { m:eqS(esc(pillOf(q, mv))), e:eqS(`${sideH(q, a)} ${esc(pillOf(q, mv))} = ${sideH(q, b)}`) })];
    paint(); return;
  }
  p.last = true; p.mark = true;
  FB = ["good", Lg("stepGood")];
  advance(it);
}
function pressRewrite(){
  const it = cur(), p = it.parts[it.pi];
  if(!p || p.t !== "rw" || S.busy) return;
  p.last = true; p.first = true;
  FB = null;
  advance(it);
}
/* the next part, and the line moves to it */
function advance(it){
  const before = driveState(it);
  it.pi++;
  const done = it.pi >= it.parts.length;
  if(done){ settle(it, it.parts.filter(p => !p.unmarked).every(p => p.first === true)); FB = null; }
  const afterSt = driveState(it);
  paint();
  boardMove(it, before, afterSt);
  if(done) $("nextBtn").focus({ preventScroll:true }); else focusAnswer();
}
function checkGrid(it){
  const p = it.parts[0], q = it.q;
  if(p.last || it.skipped) return;
  const marks = {};
  let firstBad = null, nudge = null;
  for(const r of it.rows){
    const n = r.j + 1;
    if(!r.rw){
      if(!String(r.move).trim()) return setFb("warn", Lg("fillAll"));
      const m = parseMove(r.move, q.v);
      if(!m) return setFb("warn", Lg("badMove", { n }));
      marks[r.j + "move"] = sameMove(m, r.mv);
    }
    for(const k of ["top", "bot"]){
      if((k === "top" && r.fixT) || (k === "bot" && r.fixB)) continue;
      if(!String(r[k]).trim()) return setFb("warn", Lg("fillAll"));
      const v = parseSideIn(r[k], q.v);
      if(!v) return setFb("warn", Lg("badSide", { n, x:eqS(Lt(q.v)) }));
      const ex = k === "top" ? r.exT : r.exB, l = MS.linOf(ex), pc = sideP(q, ex);
      const same = MS.rEq(v.m, l.m) && MS.rEq(v.k, l.k);
      if(same && (v.cnt > piecesCount(pc) || (v.br && !hasBrP(pc)) || (v.dv && !hasFrP(pc)))){ nudge = nudge || n; continue; }
      marks[r.j + k] = same;
    }
  }
  if(nudge){ setFb("warn", Lg("notSimple", { n:nudge })); return; }
  const ok = Object.values(marks).every(Boolean);
  p.marks = marks;
  const firstTry = p.first === null;
  markFirst(p, ok); p.last = ok;
  if(firstTry) settle(it, ok);
  if(!ok){
    const r = it.rows.find(r => Object.keys(marks).some(k => k.startsWith(r.j) && !marks[k]));
    FB = ["bad", `<b>${Lg("notQuite")}</b> ` + Lg("rowWrong", { n:r.j + 1 }) + (r.rw ? "" : " " + Lg("moveShould", { m:eqS(esc(pillOf(q, r.mv))) }))];
  } else FB = null;
  paint();
  if(ok) $("nextBtn").focus({ preventScroll:true });
}
function next(){
  const it = cur();
  if(!it.settled){
    it.parts.forEach(p => { if(p.first === null && !p.unmarked) p.first = false; });
    it.skipped = true;
    settle(it, false);
  }
  stopAnim(); FB = null;
  if(S.i < S.items.length - 1){ S.i++; paint(); focusAnswer(); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}

/* =====================================================================
   THE BOARD (Sweet): the teaching tool's double number line, driven by
   the student. Each state is one of the tool's scenes:
     "s" / "r{j}"   the equation at stage j as one point (choose a move)
     "m{j}"         move j on both lines, the new number a "?" until typed
     "w{j}"         a side written another way (expand / collect)
   ===================================================================== */
function driveState(it){
  const q = it.q, p = it.parts[it.pi];
  if(!p || it.skipped) return { id:"r" + (q.moves.length - 1), hide:null };
  if(p.t === "val") return { id:"m" + p.j, hide:{ i:p.j, side:p.side } };
  return { id:p.j === 0 ? "s" : "r" + (p.j - 1), hide:null };
}
let ANIM = null, raf = 0;
function sceneFor(it, st){ MS.S.q = it.q; MS.S.hide = st.hide; const e = MS.scene(st.id); MS.S.hide = null; return e; }
function boardShow(it){
  if(!it || !it.model) return;
  stopAnim();
  MS.S.q = it.q; MS.layout();
  MS.drawEls(sceneFor(it, driveState(it)));
}
function setBusy(v){
  S.busy = v;
  $("qCard").querySelectorAll("[data-mv], #checkBtn, #rwBtn").forEach(b => { b.disabled = v; });
}
/* from the state before a step to the state after it, through the move itself */
function boardMove(it, A, B){
  if(!it.model) return;
  const prev = it.parts[it.pi - 1], j = prev.j, chain = [A];
  if(prev.t === "rw") chain.push({ id:"w" + j, hide:null });
  else if(prev.t === "move" && B.id !== "m" + j) chain.push({ id:"m" + j, hide:null });
  else if(prev.t === "val") chain.push({ id:"m" + j, hide:null });
  chain.push(B);
  if(reduceMotion || window.__MSQ_FAST__){ boardShow(it); return; }
  stopAnim();
  MS.S.q = it.q; MS.layout();
  const legs = [];
  for(let k = 0; k + 1 < chain.length; k++){
    const a = chain[k], b = chain[k + 1];
    const dur = b.id[0] === "m" && a.id[0] !== "m" ? 1700 : a.id === b.id ? 520 : b.id[0] === "w" ? 1300 : 1350;
    legs.push({ A:sceneFor(it, a), B:sceneFor(it, b), dur, hold:k + 2 < chain.length ? 380 : 0 });
  }
  ANIM = { it, legs, k:0, t0:performance.now() };
  setBusy(true);
  raf = requestAnimationFrame(frame);
}
function frame(now){
  if(!ANIM) return;
  const L0 = ANIM.legs[ANIM.k], T = clamp((now - ANIM.t0) / L0.dur, 0, 1);
  MS.drawEls(MS.mix(L0.A, L0.B, T));
  if(now - ANIM.t0 < L0.dur + L0.hold){ raf = requestAnimationFrame(frame); return; }
  if(ANIM.k + 1 < ANIM.legs.length){ ANIM.k++; ANIM.t0 = now; raf = requestAnimationFrame(frame); return; }
  const it = ANIM.it; ANIM = null; setBusy(false);
  if(it === cur()) boardShow(it);
}
function stopAnim(){ if(ANIM){ cancelAnimationFrame(raf); ANIM = null; S.busy = false; } }
function fitBoard(){
  const wrap = $("boardWrap");
  if(window.innerWidth <= 980){ if(wrap.style.height) wrap.style.height = ""; return; }
  const work = $("work"), card = $("boardCard");
  const wr = work.getBoundingClientRect(), nav = document.querySelector(".navRow").getBoundingClientRect();
  const lay = getComputedStyle(document.querySelector(".layout"));
  const outside = (wr.top + window.scrollY) + (nav.bottom - wr.bottom) + parseFloat(lay.paddingBottom) + document.querySelector(".brandFoot").offsetHeight;
  const cs = getComputedStyle(card);
  const extra = [...card.children].filter(c => c !== wrap).reduce((a, c) => a + c.offsetHeight, 0) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + (parseFloat(cs.rowGap) || 0) * (card.children.length - 1) + 2;
  const want = Math.round(clamp(window.innerHeight - outside - extra - 2, 260, 600));
  if(Math.abs(wrap.offsetHeight - want) > 1) wrap.style.height = want + "px";
}
let rz = 0;
const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { const it = cur(); if(it && it.model){ fitBoard(); if(!ANIM) boardShow(it); } }); };
window.addEventListener("resize", onResize);
if(window.ResizeObserver){ const ro = new ResizeObserver(onResize); ro.observe($("boardWrap")); }

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CATS = ["drive", "grid", "solve", "first", "check", "mistake", "think", "word"];
const CAT_KEY = { drive:"cDrive", grid:"cGrid", solve:"cSolve", first:"cFirst", check:"cCheck", mistake:"cMistake", think:"cThink", word:"cWord" };
function isPartial(){ return !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial()); }
function scores(){
  const counted = isPartial() ? S.items.filter(x => x.settled) : S.items;
  const score = counted.filter(x => x.correct).length;
  const total = isPartial() && window.MMTSubmit.total ? window.MMTSubmit.total() : S.items.length;
  const cats = {}, kinds = {}, neg = [0, 0], frac = [0, 0];
  counted.forEach(it => {
    const c = cats[it.cat] = cats[it.cat] || [0, 0]; c[1]++; if(it.correct) c[0]++;
    const t = it.q.type, k = kinds[t] = kinds[t] || [0, 0]; k[1]++; if(it.correct) k[0]++;
    if(MS.rF(it.q.x) < 0){ neg[1]++; if(it.correct) neg[0]++; }
    if(!MS.rInt(it.q.x)){ frac[1]++; if(it.correct) frac[0]++; }
  });
  return { score, total, counted:counted.length, cats, kinds, neg, frac };
}
function renderCert(){
  const s = scores(), L0 = LEVELS[S.levelKey];
  const pct = s.total ? Math.round(s.score / s.total * 100) : 0;
  $("certScore").textContent = `${s.score} / ${s.total}`;
  $("certLine").innerHTML = `${esc(CFG.title)} &middot; ${L0.name} &middot; ${pct}%`;   // .certSub belongs to the sign-in script
  const row = (k, v) => `${one(k)}: ${v[0]} / ${v[1]}`;
  $("certBreak").innerHTML = CATS.filter(c => s.cats[c]).map(c => row(CAT_KEY[c], s.cats[c])).join("<br>")
    + (s.neg[1] ? "<br>" + row("cNeg", s.neg) : "") + (s.frac[1] ? "<br>" + row("cFrac", s.frac) : "");
  return { s, pct };
}
function finish(){
  stopAnim();
  if(!isPartial()) S.items.forEach(it => { if(!it.settled){ it.parts.forEach(p => { if(p.first === null && !p.unmarked) p.first = false; }); it.skipped = true; it.settled = true; it.correct = false; } });
  const { s, pct } = renderCert(), L0 = LEVELS[S.levelKey];
  $("progressFill").style.width = "100%";
  $("certModal").classList.add("open");
  /* No typed answer is ever in the payload — only marks and counts, in the object shape so
     "where marks were lost" gets its labels with no SKILL_LABELS edit. */
  const en = k => UI[k].en;
  const types = CATS.filter(c => s.cats[c]).map(c => ({ typeId:"msq-" + c, label:en(CAT_KEY[c]), correct:s.cats[c][0], total:s.cats[c][1] }))
    .concat(Object.keys(s.kinds).map(t => ({ typeId:"msq-eq-" + t, label:TYPE_NAME[t] || t, correct:s.kinds[t][0], total:s.kinds[t][1] })));
  if(s.neg[1]) types.push({ typeId:"msq-negatives", label:en("cNeg"), correct:s.neg[0], total:s.neg[1] });
  if(s.frac[1]) types.push({ typeId:"msq-fractions", label:en("cFrac"), correct:s.frac[0], total:s.frac[1] });
  types.push("level:" + S.levelKey, "scope:" + CFG.scope);
  if(LANG !== "en") types.push("lang:" + LANG);
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
   LEVELS, LANGUAGE, WIRING
   ===================================================================== */
function buildLevelList(){
  $("lvlList").innerHTML = ORDER.map(k => { const L0 = LEVELS[k];
    return `<button class="lvlRow ${k}" type="button" data-k="${k}"><span class="lvlIco">${L0.ico}</span><strong>${L0.name}</strong><span class="d">${Lg(L0.d)}</span><span class="go">&rsaquo;</span></button>`; }).join("");
  $("lvlList").querySelectorAll(".lvlRow").forEach(b => b.addEventListener("click", () => startLevel(b.dataset.k)));
}
function openLevels(){ $("certModal").classList.remove("open"); $("levelModal").classList.add("open"); }
function startLevel(k){
  stopAnim();
  S.levelKey = k; S.items = buildPaper(k); S.i = 0; FB = null;
  $("levelModal").classList.remove("open"); $("certModal").classList.remove("open");
  const chip = $("levelChip"); chip.hidden = false; chip.className = "lvlChip " + k; chip.textContent = LEVELS[k].name;
  if(window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset();
  paint(); focusAnswer();
}
function applyLang(){
  try{ localStorage.setItem("mmt-msq-lang", LANG); }catch(e){}
  document.querySelectorAll(".langTog button").forEach(b => { b.classList.toggle("on", b.dataset.lang === LANG); b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)); });
  $("prevBtn").innerHTML = one("prev");
  $("menuBtn").innerHTML = one("changeLevel");
  $("lvlTitle").innerHTML = Lg("chooseLevel");
  $("lvlSub").innerHTML = Lg("levelSub");
  $("certTitle").innerHTML = Lg("finished");
  $("againBtn").innerHTML = Lg("tryAgain");
  $("changeLvlBtn").innerHTML = Lg("changeLevel");
  $("copyBtn").innerHTML = Lg("copyResult");
  $("viewTag").innerHTML = one("boardTag");
  $("legendMove").innerHTML = one("legendMove");
  buildLevelList();
  if(S.levelKey && cur()) paint();
  if($("certModal").classList.contains("open")) renderCert();
}
document.querySelectorAll(".langTog button").forEach(b => b.addEventListener("click", () => { LANG = b.dataset.lang; FB = null; applyLang(); }));
$("nextBtn").addEventListener("click", next);
$("prevBtn").addEventListener("click", () => { if(S.i > 0){ stopAnim(); FB = null; S.i--; paint(); } });
$("menuBtn").addEventListener("click", openLevels);
$("changeLvlBtn").addEventListener("click", openLevels);
$("againBtn").addEventListener("click", () => startLevel(S.levelKey));
$("copyBtn").addEventListener("click", async () => {
  const s = scores();
  const line = "\u{1F3C6} Mills Maths Tools — " + CFG.title + "\n" + `${LEVELS[S.levelKey].name}: ${s.score}/${s.total}\n` + (window.MMTAuth && window.MMTAuth.shareLine ? window.MMTAuth.shareLine() : "");
  try{ await navigator.clipboard.writeText(line); $("copyBtn").innerHTML = Lg("copied"); } catch(e){ $("copyBtn").innerHTML = Lg("copyFail"); }
  setTimeout(() => { $("copyBtn").innerHTML = Lg("copyResult"); }, 1800);
});
$("toolsBtn").addEventListener("click", e => {
  e.stopPropagation();
  const m = $("toolsMenu"), was = m.classList.contains("open");
  m.classList.toggle("open", !was); $("toolsBtn").setAttribute("aria-expanded", String(!was));
});
document.addEventListener("click", () => { $("toolsMenu").classList.remove("open"); $("toolsBtn").setAttribute("aria-expanded", "false"); });
document.addEventListener("keydown", e => { if(e.key === "Escape") $("toolsMenu").classList.remove("open"); });
if(MS.MATH_ALPHA) document.querySelectorAll(".modal i, .mmtTopTitle i").forEach(el => { el.outerHTML = `<span class="mi">${MS.mathItalic(el.textContent)}</span>`; });

/* MathLive, for fractions on Spicy. If the CDN can't be reached the plain box stays. */
(function loadMathLive(){
  if(window.__MSQ_NO_ML__) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/mathlive@0.101.2/dist/mathlive.min.js";
  s.async = true;
  s.onload = () => { try {
    if(!window.customElements || !customElements.get("math-field")) return;
    const ME = window.MathfieldElement || (window.MathLive && window.MathLive.MathfieldElement);
    if(ME){ try { ME.soundsDirectory = null; } catch(e){} }
    ML = true;
    const it = cur(); if(it && it.level === "spicy" && !it.settled) paint();
  } catch(e){} };
  document.head.appendChild(s);
})();

import("/portal/shared/earlySubmit.js").then(m => {
  window.MMTSubmit = m.MMTSubmit;
  m.MMTSubmit.register({
    progress: () => ({ attempted:S.items.filter(x => x.settled).length, correct:S.items.filter(x => x.correct).length, quizLength:QUIZ_N }),
    finish: () => finish()
  });
}).catch(() => {});

applyLang();
fitBoard();
openLevels();

/* a small surface for the automated checks; nothing in the page reads it */
window.__MSQ__ = { CFG, S, MS, LEVELS, ORDER, POOL, buildPaper, startLevel, scores, finish, next, check, paint, chooseMove, pressRewrite,
  parseNum, parseMove, parseSideIn, sideTxt, thinkText, makeMistake, makeEq, moveOpts, UI, tx, sameMove,
  setLang:k => { LANG = k; applyLang(); }, lang:() => LANG, get ANIM(){ return ANIM; }, get ML(){ return ML; } };

})();
