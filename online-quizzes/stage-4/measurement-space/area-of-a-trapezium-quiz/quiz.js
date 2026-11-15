/* =====================================================================
   AREA OF A TRAPEZIUM — STUDENT QUIZ (2026-11-16)
   ---------------------------------------------------------------------
   The Area of a Triangle quiz's pattern: the card on the left is ONE
   question and ONE answer space; the panel on the right is the trapezium.

   Sweet and Mild: the panel is the teaching tool's model, built from the
   question's own trapezium, with BOTH of the tool's stories on a switch in
   the panel's head — students step through either with Show me ▸ / ◂.
   Never required, never marked, and it never shows the area:
     Average base         cut at the middles of the sloping sides, swing the
                          corners round, the rectangle's length is halfway
                          between the parallel sides ("?" while that IS the
                          question)
     Two copies           a copy slides then turns into a parallelogram, its
                          base is b + a, chop at the edge and slide
   A wrong first answer jumps the model to its last step.

   Medium and Spicy: the clean diagram (trapSVG, shared with the worksheet
   creator) — no squares, a sloping side often labelled as a distractor,
   and some trapeziums turned so the parallel sides run up the page.

   The ladder:
     Sweet  whole-number averages; how long is the rectangle, how big is the
            parallelogram, then areas — isosceles, right-angled, neither
     Mild   leaning trapeziums join in; an average can be a half; spot
            "forgot to halve"
     Medium no model; sloping-side distractors; turned trapeziums; answers
            in halves; spot "used the sloping side"
     Spicy  bigger numbers; work back to a missing height or parallel side;
            spot "multiplied the parallel sides"

   Marking (as the other quizzes): only the FIRST check scores; Check again
   lets them fix it; an empty check is free; Next on an unanswered question
   counts it as wrong. Nothing typed is ever saved — only marks and counts.
   ===================================================================== */
(() => {
"use strict";
const CFG = { tool:"area-of-a-trapezium-student-quiz", title:"Area of a Trapezium", mastery:"area-of-a-trapezium" };
const QUIZ_N = 10;
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const span01 = (v, r) => clamp((v - r[0]) / (r[1] - r[0]), 0, 1);
const lerp = (p, q, u) => p + (q - p) * u;
const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = n => { const r = Math.round(n * 100) / 100; return String(r); };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const X = "×";
const eqS = s => `<span class="eq">${s}</span>`;

/*SHARED-START*/
/* ---------------------------------------------------------- TRAPEZIUM: shapes + the clean diagram
   (written once, copied into the quiz and the worksheet creator — change one, re-copy to the other)
   A trapezium sits on its longer parallel side: base b from (0,0) to (b,0), top a from (p,h) to (p+a,h). */
const TRIPLES = [[3,4,5],[4,3,5],[6,8,10],[8,6,10],[5,12,13],[12,5,13],[9,12,15],[12,9,15],[8,15,17],[15,8,17]];
const trapPts = s => [[0, 0], [s.b, 0], [s.p + s.a, s.h], [s.p, s.h]];
const trapArea = s => (s.a + s.b) * s.h / 2;
function trapClip(poly, lo, hi){
  const cut = (pts, keep, xi) => { const out = [];
    for(let i = 0; i < pts.length; i++){ const q = pts[i], r = pts[(i + 1) % pts.length], qin = keep(q), rin = keep(r);
      if(qin) out.push(q);
      if(qin !== rin){ const t = (xi - q[0]) / (r[0] - q[0]); out.push([xi, q[1] + t * (r[1] - q[1])]); } }
    return out; };
  let r = cut(poly, q => q[0] >= lo - 1e-9, lo); if(r.length < 3) return null;
  r = cut(r, q => q[0] <= hi + 1e-9, hi);
  return r.length >= 3 ? r : null;
}
const trapCen = P => [P.reduce((s, q) => s + q[0], 0) / P.length, P.reduce((s, q) => s + q[1], 0) / P.length];
function trapKind(s){
  const { a, b, p } = s;
  if(p === 0 || p + a === b) return "right";
  if(2 * p === b - a) return "iso";
  if(p < 0 || p + a > b) return "lean";
  return "plain";
}
/* where the height is drawn: a vertical side when there is one, otherwise from a top corner */
function trapHeightAt(s){
  const { a, b, p } = s;
  if(p === 0) return { x:0, edge:true, out:-1 };
  if(p + a === b) return { x:b, edge:true, out:1 };
  if(p > 0 && (p + a >= b || p >= b - p - a)) return { x:p, edge:false, into:1 };
  return { x:p + a, edge:false, into:-1 };
}
/* one trapezium of a kind ("iso" | "right" | "lean" | "plain") inside the range L.
   o.slant: one sloping side gets a whole-number length (to be labelled as a distractor)
   o.avgWhole: a + b even · o.areaWhole: (a + b) × h even · o.areaHalf: the area ends in .5 */
function mkTrap(L, kind, o, used){
  o = o || {};
  for(let t = 0; t < 900; t++){
    let b, a, h, p, slant = null;
    if(o.slant){
      const c = TRIPLES.filter(x => x[1] >= L.hLo && x[1] <= L.hHi && x[0] + 2 <= L.bHi);
      if(!c.length) return mkTrap(L, kind, Object.assign({}, o, { slant:false }), used);
      const [dx, hh, len] = pick(c); h = hh;
      b = R(Math.max(L.bLo, dx + 2), L.bHi);
      if(kind === "lean"){
        a = R(Math.max(dx + 1, Math.ceil(b * .3)), b - 1);
        if(Math.random() < .55){ p = b - a + dx; slant = { side:"R", len }; } else { p = -dx; slant = { side:"L", len }; }
      } else if(kind === "right"){
        a = b - dx; if(Math.random() < .5){ p = 0; slant = { side:"R", len }; } else { p = dx; slant = { side:"L", len }; }
      } else if(kind === "iso"){
        a = b - 2 * dx; p = dx; slant = { side:Math.random() < .5 ? "L" : "R", len };
      } else {
        const q = R(1, Math.max(1, b - dx - 2)); a = b - dx - q;
        if(q === dx) continue;
        if(Math.random() < .5){ p = dx; slant = { side:"L", len }; } else { p = q; slant = { side:"R", len }; }
      }
    } else {
      b = R(L.bLo, L.bHi); h = R(L.hLo, L.hHi);
      if(kind === "iso"){ a = R(1, b - 2); if((b - a) % 2) a += a + 1 <= b - 2 ? 1 : -1; p = (b - a) / 2; }
      else if(kind === "right"){ a = R(Math.max(1, Math.ceil(b * .35)), b - 1); p = Math.random() < .5 ? 0 : b - a; }
      else if(kind === "lean"){ a = R(Math.max(2, Math.ceil(b * .3)), b - 2); const e = R(1, Math.max(1, Math.min(3, a - 1))); p = Math.random() < .6 ? b - a + e : -e; }
      else { a = R(Math.max(1, Math.ceil(b * .3)), b - 3); const fr = []; for(let q = 1; q < b - a; q++) if(2 * q !== b - a) fr.push(q); if(!fr.length) continue; p = pick(fr); }
    }
    if(!(a >= 1 && a < b) || p > b - 1 || p < 1 - a) continue;
    /* in proportion: a top at least a quarter of the base, a height neither a sliver nor a tower */
    if(a < b / 4 || h < b * .28 || h > b * 1.15) continue;
    if(trapKind({ a, b, p }) !== kind) continue;
    if(o.avgWhole && (a + b) % 2) continue;
    if(o.areaWhole && ((a + b) * h) % 2) continue;
    if(o.areaHalf && ((a + b) * h) % 2 === 0) continue;
    if(o.maxArea && (a + b) * h / 2 > o.maxArea) continue;
    /* no answer that is also a length on the diagram (an area, an average, two copies) — it reads like a giveaway */
    const shown = [a, b, h].concat(slant ? [slant.len] : []);
    if([(a + b) * h / 2, (a + b) / 2, (a + b) * h].some(v => shown.includes(v))) continue;
    const key = [b, a, h, p].join();
    if(used && used.has(key) && t < 700) continue;
    if(used) used.add(key);
    return { b, a, h, p, slant };
  }
  mkTrap.fallbacks = (mkTrap.fallbacks || 0) + 1;
  return { b:8, a:4, h:4, p:2, slant:null };
}
/* THE CLEAN DIAGRAM, as an SVG string, in whatever units o.w / o.h are (mm on paper, px in the quiz).
   s: { a, b, h, p, slant:{side,len}, missing:"a"|"b"|"h", turn (parallel sides up the page),
        show:"avg" (the cuts at the middles, the rectangle and the swing) | "para" (the turned copy) }
   o: { w, h, fs, unit, grid, gridMin, bw, key, maxS } */
function trapSVG(s, o){
  const bw = !!o.bw, fs = o.fs, twT = t => String(t).length * fs * .58;
  const col = { fill:bw ? "#e5e7eb" : "rgba(22,163,74,.34)", edge:bw ? "#111827" : "#14532d", pale:bw ? "none" : "rgba(34,197,94,.10)",
    ghost:bw ? "#6b7280" : "#64748b", alt:bw ? "#111827" : "#ea580c", a:bw ? "#111827" : "#5b21b6", b:bw ? "#111827" : "#1d4ed8",
    lab:bw ? "#111827" : "#334155", h:bw ? "#111827" : "#c2410c", key:"#15803d", grid:"#d1d5db", arrow:bw ? "#111827" : "#2563eb", cut:"#0f172a" };
  const sw = fs * .15, thin = fs * .1, dash = `${(fs * .34).toFixed(2)} ${(fs * .25).toFixed(2)}`;
  const U = o.unit ? " " + o.unit : "";
  const { a, b, h, p } = s, B = a + b, T = trapPts(s);
  const x1r = p / 2, x2r = (b + p + a) / 2;
  let x0 = Math.min(0, p), x1 = Math.max(b, p + a);
  if(s.show === "para") x1 = Math.max(B, B + p);
  if(s.show === "avg"){ x0 = Math.min(x0, x1r); x1 = Math.max(x1, x2r); }
  const turn = !!s.turn, M = q => turn ? [q[1], q[0]] : q;
  const fx0 = turn ? 0 : x0, fx1 = turn ? h : x1, fy0 = turn ? x0 : 0, fy1 = turn ? x1 : h;
  const miss = w => s.missing === w;
  const val = (w, v) => miss(w) ? (o.key ? fmt(v) + U : "?") : fmt(v) + U;
  const labs = [val("a", a), val("b", b), val("h", h)].concat(s.slant ? [fmt(s.slant.len) + U] : []);
  const lw = Math.max.apply(null, labs.map(twT));
  const mx = Math.max(fs * 2.4, (turn ? lw : lw * .5) + fs * 1.3), my = Math.max(fs * 2.4, (turn ? fs * 1.2 : fs * 1.1) + fs);
  const sc = Math.min((o.w - 2 * mx) / Math.max(.5, fx1 - fx0), (o.h - 2 * my) / Math.max(.5, fy1 - fy0), o.maxS || 12);
  const ox = (o.w - (fx1 - fx0) * sc) / 2 - fx0 * sc, oy = (o.h - (fy1 - fy0) * sc) / 2 + fy1 * sc;
  const S = q => { const m = M(q); return [ox + m[0] * sc, oy - m[1] * sc]; };
  const n2 = v => v.toFixed(2);
  const pts = A => A.map(q => S(q).map(n2).join(",")).join(" ");
  const ln = (q, r, st) => { const A = S(q), C = S(r); return `<line x1="${n2(A[0])}" y1="${n2(A[1])}" x2="${n2(C[0])}" y2="${n2(C[1])}" ${st}/>`; };
  const textAt = (xy, text, fill, weight, size) => `<text x="${n2(xy[0])}" y="${n2(xy[1])}" font-size="${n2(size || fs)}" fill="${fill}" font-weight="${weight || 600}" text-anchor="middle" dominant-baseline="central">${esc(text)}</text>`;
  const patch = (xy, text, fill, stroke, weight) => { const w = twT(text) + fs * .5, hh = fs * 1.35;
    return `<rect x="${n2(xy[0] - w / 2)}" y="${n2(xy[1] - hh / 2)}" width="${n2(w)}" height="${n2(hh)}" rx="${n2(hh / 2)}" fill="#fff" stroke="${stroke}" stroke-width="${n2(thin * .8)}"/>` + textAt(xy, text, fill, weight); };
  /* a label outside a side, square off it, away from the shape it belongs to */
  const outside = (q, r, text, fill, weight, cen) => {
    const A = S(q), C = S(r), Md = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2], K = S(cen || trapCen(T));
    const dx = C[0] - A[0], dy = C[1] - A[1], dl = Math.hypot(dx, dy) || 1;
    let nx = -dy / dl, ny = dx / dl;
    if(nx * (Md[0] - K[0]) + ny * (Md[1] - K[1]) < 0){ nx = -nx; ny = -ny; }
    const off = Math.abs(nx) * twT(text) / 2 + Math.abs(ny) * fs * .6 + fs * .45;
    return textAt([Md[0] + nx * off, Md[1] + ny * off], text, fill, weight);
  };
  let g = "";
  /* unit squares: whole numbers, upright, big enough to count */
  const whole = [a, b, h, p].every(v => Math.abs(v - Math.round(v)) < 1e-9);
  if(o.grid && !turn && whole && !s.missing && sc >= (o.gridMin || 2.6)){
    for(let x = Math.floor(x0); x <= Math.ceil(x1); x++) g += ln([x, 0], [x, h], `stroke="${col.grid}" stroke-width="${n2(thin * .5)}"`);
    for(let y = 0; y <= h; y++) g += ln([Math.floor(x0), y], [Math.ceil(x1), y], `stroke="${col.grid}" stroke-width="${n2(thin * .5)}"`);
  }
  /* half a parallelogram: the copy, turned, beside it — its short side next to the long base */
  if(s.show === "para"){
    const M2 = [(b + p + a) / 2, h / 2], CP = T.map(q => [2 * M2[0] - q[0], 2 * M2[1] - q[1]]), cc = trapCen(CP);
    g += `<polygon points="${pts(CP)}" fill="${col.pale}" stroke="${col.ghost}" stroke-width="${n2(thin)}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
    g += outside([b, 0], [B, 0], fmt(a) + U, col.ghost, 600, cc);
    g += outside([p + a, h], [B + p, h], fmt(b) + U, col.ghost, 600, cc);
  }
  /* average base: the rectangle the corners swing into */
  if(s.show === "avg") g += `<polygon points="${pts([[x1r, 0], [x2r, 0], [x2r, h], [x1r, h]])}" fill="${col.pale}" stroke="${col.ghost}" stroke-width="${n2(thin)}" stroke-dasharray="${dash}"/>`;
  g += `<polygon points="${pts(T)}" fill="${col.fill}" stroke="${col.edge}" stroke-width="${n2(sw)}" stroke-linejoin="round"/>`;
  if(s.show === "avg"){
    [[p !== 0, [x1r, h / 2], [x1r, p > 0 ? 0 : h], -1, x1r], [p + a !== b, [x2r, h / 2], [x2r, p + a < b ? 0 : h], 1, x2r]].forEach(([on, Mid, end, side, cx]) => {
      if(!on) return;
      g += ln(Mid, end, `stroke="${col.cut}" stroke-width="${n2(thin * 1.1)}" stroke-dasharray="${n2(fs * .12)} ${n2(fs * .3)}" stroke-linecap="round"`);
      const piece = side < 0 ? trapClip(T, -1e6, cx) : trapClip(T, cx, 1e6);
      if(piece){
        /* the curved arrow: from the corner piece, round the outside, to the gap it fills */
        const c0 = trapCen(piece), c1 = [2 * Mid[0] - c0[0], 2 * Mid[1] - c0[1]], rr = Math.hypot(c0[0] - Mid[0], c0[1] - Mid[1]);
        const ctl = [Mid[0] + side * rr * 1.3, Mid[1]], A = S(c0), C = S(c1), K = S(ctl);
        const tx = C[0] - K[0], ty = C[1] - K[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, ah = fs * .55;
        g += `<path d="M${n2(A[0])} ${n2(A[1])}Q${n2(K[0])} ${n2(K[1])} ${n2(C[0])} ${n2(C[1])}" fill="none" stroke="${col.arrow}" stroke-width="${n2(thin)}" stroke-linecap="round"/>`;
        g += `<path d="M${n2(C[0] - ux * ah - uy * ah * .6)} ${n2(C[1] - uy * ah + ux * ah * .6)}L${n2(C[0])} ${n2(C[1])}L${n2(C[0] - ux * ah + uy * ah * .6)} ${n2(C[1] - uy * ah - ux * ah * .6)}" fill="none" stroke="${col.arrow}" stroke-width="${n2(thin)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      const P0 = S(Mid);
      g += `<circle cx="${n2(P0[0])}" cy="${n2(P0[1])}" r="${n2(fs * .28)}" fill="#fff" stroke="${col.arrow}" stroke-width="${n2(thin)}"/>`;
    });
  }
  /* the height: a vertical side (right angle marked), or dashed from a top corner with its label on it */
  const H = trapHeightAt(s), r = Math.min(fs * .5, h * sc * .25) / sc;
  const tow = H.edge ? -H.out : (H.x === p ? 1 : -1);
  if(!H.edge) g += ln([H.x, 0], [H.x, h], `stroke="${col.alt}" stroke-width="${n2(thin)}" stroke-dasharray="${dash}"`);
  g += `<polyline points="${pts([[H.x + tow * r, 0], [H.x + tow * r, r], [H.x, r]])}" fill="none" stroke="${H.edge ? col.edge : col.alt}" stroke-width="${n2(thin * .8)}"/>`;
  const hFill = miss("h") ? (o.key ? col.key : "#6b7280") : col.h, hW = miss("h") ? 800 : 600;
  if(H.edge) g += outside([H.x, 0], [H.x, h], val("h", h), hFill, hW);
  else g += patch(S([H.x, h / 2]), val("h", h), hFill, bw ? "#111827" : "#fdba74", hW);
  /* the parallel sides, and a sloping side as a distractor */
  const mf = (w, c) => miss(w) ? (o.key ? col.key : "#6b7280") : c;
  g += outside([0, 0], [b, 0], val("b", b), mf("b", col.b), miss("b") ? 800 : 600);
  g += outside([p, h], [p + a, h], val("a", a), mf("a", col.a), miss("a") ? 800 : 600);
  if(s.slant){ const leg = s.slant.side === "L" ? [[0, 0], [p, h]] : [[b, 0], [p + a, h]]; g += outside(leg[0], leg[1], fmt(s.slant.len) + U, col.lab, 500); }
  return `<svg viewBox="0 0 ${n2(o.w)} ${n2(o.h)}" width="${n2(o.w)}${o.px ? "" : "mm"}" height="${n2(o.h)}${o.px ? "" : "mm"}" font-family="STIX Two Math, Cambria Math, Times New Roman, serif">${g}</svg>`;
}
/*SHARED-END*/


/* ---------------------------------------------------------- the model's geometry (the teaching tool's) */
const rot = (q, c, deg) => { const r = deg * Math.PI / 180, dx = q[0] - c[0], dy = q[1] - c[1];
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]; };
const centroid = trapCen;
function avgGeo(it){
  const { a, b, h, p } = it, T = trapPts(it), x1 = p / 2, x2 = (b + p + a) / 2, M1 = [x1, h / 2], M2 = [x2, h / 2];
  const pieces = [];
  if(p !== 0) pieces.push({ side:-1, P:trapClip(T, -1e6, x1), M:M1, end:[x1, p > 0 ? 0 : h], sign:p > 0 ? -1 : 1, own:p > 0 ? [0, 0] : [p, h], other:p > 0 ? [p, h] : [0, 0], ticks:1 });
  if(p + a !== b) pieces.push({ side:1, P:trapClip(T, x2, 1e6), M:M2, end:[x2, p + a < b ? 0 : h], sign:p + a < b ? 1 : -1, own:p + a < b ? [b, 0] : [p + a, h], other:p + a < b ? [p + a, h] : [b, 0], ticks:2 });
  return { x1, x2, M1, M2, pieces:pieces.filter(pc => pc.P), body:trapClip(T, x1, x2) || T };
}
const swingPoly = (pc, u, dx) => pc.P.map(q => rot([q[0] + (dx || 0), q[1]], pc.M, pc.sign * 180 * u));
function paraGeo(it){
  const { a, b, h, p } = it, B = a + b, M2 = [(b + p + a) / 2, h / 2];
  return { B, M2, CP:trapPts(it).map(q => [2 * M2[0] - q[0], 2 * M2[1] - q[1]]), PG:[[0, 0], [B, 0], [B + p, h], [p, h]], e:[[b, 0], [p + a, h]] };
}
function strips(it){
  const B = it.a + it.b, d = it.p, out = [];
  if(d >= 0) for(let k = 0; k * B < d + B - 1e-9; k++) out.push({ lo:k * B, hi:(k + 1) * B, dx:-k * B });
  else for(let k = 0; (1 - k) * B > d + 1e-9; k++) out.push({ lo:-k * B, hi:(1 - k) * B, dx:k * B });
  return out;
}
const cutsAt = it => { const ST = strips(it); return it.p >= 0 ? ST.slice(1).map(s => s.lo) : ST.slice(0, -1).map(s => s.lo); };
function flipPoly(P, e0, e1, u){
  const M = [(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2];
  const c0 = centroid(P), vx = M[0] - c0[0], vy = M[1] - c0[1];
  const Q = [M[0] + vx / 2, M[1] + vy / 2];
  const slide = ease(clamp(u / .42, 0, 1)), turn = ease(clamp((u - .55) / .45, 0, 1));
  return P.map(q => rot([q[0] + vx * slide, q[1] + vy * slide], Q, 180 * turn));
}
const rectX0 = it => it.method === "avg" ? it.p / 2 : 0;
const rectW = it => it.method === "avg" ? (it.a + it.b) / 2 : it.a + it.b;

/* ---------------------------------------------------------- building questions */
let USED = new Set();
function base(level, s, o){
  return Object.assign({ level, model:level === "sweet" || level === "mild", grid:level === "sweet" || level === "mild",
    method:"avg", missing:null, turn:false, mStep:0, settled:false, correct:false, q:"", ask:"", working:"" }, s, o || {});
}
function step(t, o){ return Object.assign({ t, first:null, last:false, vals:t === "num" ? [] : {}, marks:null, fixText:null, sel:null }, o); }
const field = (lab, ans, unit) => ({ lab, ans, unit });
const avgWhy = it => `Halfway between the parallel sides is ${eqS(`(${fmt(it.a)} + ${fmt(it.b)}) ÷ 2 = ${fmt((it.a + it.b) / 2)}`)} cm, so the area is ${eqS(`${fmt((it.a + it.b) / 2)} ${X} ${fmt(it.h)} = ${fmt(trapArea(it))}`)} cm².`;
function qArea(level, s, o){
  const it = base(level, s, o);
  it.q = "Find the area of the trapezium.";
  it.steps = [ step("num", { cat:"trap-area", fields:[ field("Area =", trapArea(it), "cm²") ], why:() => avgWhy(it) }) ];
  return it;
}
function qAvg(level, s, o){
  const it = base(level, s, Object.assign({ method:"avg", asksAvg:true }, o));
  it.q = "Swing the corners round and the trapezium becomes a rectangle. How long is that rectangle?";
  it.steps = [ step("num", { cat:"trap-avg", fields:[ field("Length =", (it.a + it.b) / 2, "cm") ],
    why:() => `It is halfway between the parallel sides: ${eqS(`(${fmt(it.a)} + ${fmt(it.b)}) ÷ 2 = ${fmt((it.a + it.b) / 2)}`)} cm.` }) ];
  return it;
}
function qPara(level, s, o){
  const it = base(level, s, Object.assign({ method:"para" }, o));
  it.q = "Two copies of this trapezium make a parallelogram. What is the area of the parallelogram?";
  it.steps = [ step("num", { cat:"trap-para", fields:[ field("Parallelogram =", (it.a + it.b) * it.h, "cm²") ],
    why:() => `Its base is both parallel sides, ${eqS(`${fmt(it.b)} + ${fmt(it.a)} = ${fmt(it.a + it.b)}`)} cm, and its height is ${fmt(it.h)} cm: ${eqS(`${fmt(it.a + it.b)} ${X} ${fmt(it.h)} = ${fmt((it.a + it.b) * it.h)}`)} cm².` }) ];
  return it;
}
function qMissing(level, s, which, o){
  const it = base(level, s, Object.assign({ missing:which }, o));
  const A = trapArea(it), two = 2 * A;
  const word = which === "h" ? "height" : which === "a" ? "shorter parallel side" : "longer parallel side";
  it.q = `The area of the trapezium is ${fmt(A)} cm². What is the ${word}?`;
  const ans = it[which];
  const why = which === "h"
    ? `Two copies make a parallelogram of ${eqS(`${fmt(A)} ${X} 2 = ${fmt(two)}`)} cm², with base ${eqS(`${fmt(it.a)} + ${fmt(it.b)} = ${fmt(it.a + it.b)}`)}. So the height is ${eqS(`${fmt(two)} ÷ ${fmt(it.a + it.b)} = ${fmt(it.h)}`)} cm.`
    : `Two copies make ${eqS(`${fmt(A)} ${X} 2 = ${fmt(two)}`)} cm², so the parallel sides add to ${eqS(`${fmt(two)} ÷ ${fmt(it.h)} = ${fmt(it.a + it.b)}`)}. Then ${eqS(`${fmt(it.a + it.b)} − ${fmt(which === "a" ? it.b : it.a)} = ${fmt(ans)}`)} cm.`;
  it.steps = [ step("num", { cat:"trap-missing", fields:[ field(which === "h" ? "Height =" : "Side =", ans, "cm") ], why:() => why }) ];
  return it;
}
const NAMES = ["Mia","Sam","Noah","Zara","Kai","Lily","Jai","Ava","Leo","Ruby","Omar","Tia"];
function qMistake(level, s, kind, o){
  const it = base(level, s, o), name = pick(NAMES), { a, b, h } = it, A = trapArea(it);
  let opts;
  it.q = `${name} worked out the area like this:`;
  if(kind === "half"){
    it.working = `(${fmt(a)} + ${fmt(b)}) ${X} ${fmt(h)} = ${fmt((a + b) * h)} cm²`;
    it.ask = `What did ${name} forget?`;
    opts = [ { h:"To halve it — that is two copies of the trapezium", ok:true }, { h:"To add the sloping sides", ok:false },
             { h:"To double it", ok:false }, { h:`Nothing — ${fmt((a + b) * h)} cm² is right`, ok:false } ];
  } else if(kind === "slant"){
    const v = (a + b) * it.slant.len / 2;
    it.working = `½ ${X} (${fmt(a)} + ${fmt(b)}) ${X} ${fmt(it.slant.len)} = ${fmt(v)} cm²`;
    it.ask = "What went wrong?";
    opts = [ { h:"The height must be at right angles to the parallel sides", ok:true }, { h:"It should not be halved", ok:false },
             { h:"The parallel sides should be multiplied", ok:false }, { h:`Nothing — ${fmt(v)} cm² is right`, ok:false } ];
  } else {
    const v = a * b * h / 2;
    it.working = `½ ${X} ${fmt(a)} ${X} ${fmt(b)} ${X} ${fmt(h)} = ${fmt(v)} cm²`;
    it.ask = "What went wrong?";
    opts = [ { h:"The parallel sides should be added, not multiplied", ok:true }, { h:"It should not be halved", ok:false },
             { h:"The height should be the sloping side", ok:false }, { h:`Nothing — ${fmt(v)} cm² is right`, ok:false } ];
  }
  it.steps = [ step("mc", { cat:"trap-mistake", opts:shuffle(opts), why:() => `Add the parallel sides, multiply by the height, then halve: ${eqS(`½ ${X} (${fmt(a)} + ${fmt(b)}) ${X} ${fmt(h)} = ${fmt(A)}`)} cm².` }) ];
  return it;
}

/* ---------------------------------------------------------- the four papers */
const LEVELS = {
  sweet:  { name:"Sweet",  ico:"\u{1F36C}", d:"On unit squares, with a model beside each one. How long is the rectangle it becomes, how big is the parallelogram — then the area." },
  mild:   { name:"Mild",   ico:"\u{1F343}", d:"Leaning trapeziums join in, and the average can be a half. The model is still there. Spot a classic mistake." },
  medium: { name:"Medium", ico:"\u{1F336}️", d:"No model and no squares. A sloping side is labelled too, some are turned on their side, and some answers are halves." },
  spicy:  { name:"Spicy",  ico:"\u{1F525}", d:"Bigger numbers, and working backwards from the area to a missing height or parallel side." }
};
const ORDER = ["sweet","mild","medium","spicy"];
/* heights from 3 where there is a model: with a height of 2 the area always equals a + b, which the model shows */
const RANGE = { sweet:{ bLo:4, bHi:10, hLo:3, hHi:6 }, mild:{ bLo:5, bHi:12, hLo:3, hHi:8 }, medium:{ bLo:6, bHi:14, hLo:3, hHi:10 }, spicy:{ bLo:8, bHi:20, hLo:4, hHi:14 } };
function buildPaper(level){
  USED = new Set();
  const Lr = RANGE[level], L0 = level;
  const t = (kind, o) => mkTrap(Lr, kind, o, USED);
  const sw = k => t(k, { avgWhole:true });
  if(level === "sweet") return [ qAvg(L0, sw("iso")), qArea(L0, sw("right")), qArea(L0, sw("iso")), qPara(L0, sw("plain")), qArea(L0, sw("right")),
    qAvg(L0, sw("plain")), qArea(L0, sw("iso")), qArea(L0, sw("plain")), qArea(L0, sw("right")), qArea(L0, sw("iso")) ];
  const mw = k => t(k, { areaWhole:true });
  if(level === "mild") return [ qArea(L0, mw("iso")), qArea(L0, mw("lean")), qPara(L0, mw("right")), qMistake(L0, mw("plain"), "half"), qArea(L0, mw("lean")),
    qAvg(L0, t("lean", {})), qArea(L0, mw("right")), qArea(L0, mw("plain")), qArea(L0, mw("lean")), qArea(L0, mw("iso")) ];
  const turned = { turn:true };
  if(level === "medium") return [ qArea(L0, t("iso", { slant:true })), qArea(L0, t("lean", { areaHalf:true })), qArea(L0, t("right", { slant:true }), turned),
    qArea(L0, t("plain", { areaWhole:true }), turned), qMistake(L0, t("plain", { slant:true }), "slant"), qArea(L0, t("lean", { slant:true })),
    qArea(L0, t("plain", { areaHalf:true }), turned), qAvg(L0, t("plain", {})), qArea(L0, t("plain", { slant:true }), turned), qArea(L0, t("right", { areaHalf:true })) ];
  return [ qMissing(L0, t("iso", {}), "h"), qArea(L0, t("lean", { slant:true })), qMissing(L0, t("right", {}), "a", turned), qArea(L0, t("plain", { areaHalf:true }), turned),
    qMissing(L0, t("plain", { slant:true }), "h"), qMistake(L0, t("plain", {}), "mult"), qMissing(L0, t("lean", {}), "b", turned),
    qArea(L0, t("lean", { areaHalf:true })), qMissing(L0, t("right", {}), "h", turned), qArea(L0, t("iso", { slant:true }), turned) ];
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
const S = { levelKey:null, items:[], i:0, method:null };
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
    /* a wrong first answer: the model shows the whole story */
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
  if(S.i < S.items.length - 1){ S.i++; startItem(); paint(); focusAnswer(); window.scrollTo({ top:0, behavior:reduceMotion ? "auto" : "smooth" }); }
  else finish();
}
/* the model opens on the student's last choice of story, unless the question is about one of them */
function startItem(){
  const it = cur(); if(!it || !it.model || it.settled || it.mStep) return;
  if(!it.asksAvg && it.steps[0].cat !== "trap-para" && S.method) it.method = S.method;
}

/* =====================================================================
   THE PANEL — the model (Sweet, Mild) or the clean diagram (Medium, Spicy)
   ===================================================================== */
const svg = $("board");
let L = null, ANIM = null, raf = 0;
const C = { tri:"rgba(22,163,74,.66)", triS:"#14532d", half:"rgba(34,197,94,.15)", halfS:"#4ade80", alt:"#ea580c", cut:"#0f172a" };
function modelSteps(it){
  if(it.method === "avg"){
    const n = avgGeo(it).pieces.length;
    return [ { t:"The trapezium" }, { t:n === 2 ? "Cut at the middles" : "Cut at the middle", anim:"cut" },
             { t:n === 2 ? "Swing the corners round" : "Swing the corner round", anim:"swing" }, { t:"How long is it?", anim:"avg" } ];
  }
  const out = [ { t:"The trapezium" }, { t:"Copy, slide, turn", anim:"copy" }, { t:"Its base: b + a", anim:"merge" } ];
  if(cutsAt(it).length) out.push({ t:"Chop and slide", anim:"chop" });
  return out;
}
const DUR = { cut:1900, swing:2800, avg:2400, copy:2200, merge:2100, chop:2300 };
function frame(it){
  const { a, b, h, p } = it;
  let x0, x1;
  if(it.method === "avg"){ x0 = Math.min(0, p, p / 2); x1 = Math.max(b, p + a, (b + p + a) / 2); }
  else { x0 = Math.min(0, p); x1 = Math.max(a + b, a + b + p); }
  let X0 = x0, X1 = x1, Y0 = 0, Y1 = h;
  const T = trapPts(it), samples = [];
  for(let u = 0; u <= 1.0001; u += .05){
    if(it.method === "avg") avgGeo(it).pieces.forEach(pc => samples.push(swingPoly(pc, u)));
    else { const g = paraGeo(it); samples.push(flipPoly(T, g.e[0], g.e[1], u)); }
  }
  samples.forEach(P => P.forEach(q => { X0 = Math.min(X0, q[0]); X1 = Math.max(X1, q[0]); Y0 = Math.min(Y0, q[1]); Y1 = Math.max(Y1, q[1]); }));
  const capX = (x1 - x0) * .2, capY = h * .32;
  return { x0:Math.max(X0, x0 - capX), x1:Math.min(X1, x1 + capX), y0:Math.max(Y0, -capY), y1:Math.min(Y1, h + capY) };
}
const fsz = () => L ? (L.compact ? 15 : 18) : 18;
function layout(it){
  const wrap = $("boardWrap");
  const w = Math.max(260, wrap.clientWidth), hh = Math.max(220, wrap.clientHeight);
  const compact = w < 520, f = compact ? 15 : 18;
  const hw = pillW(fmt(it.h) + " cm", f);
  const M = compact ? { L:Math.max(46, hw + 20), R:Math.max(34, hw + 20), T:46, B:58 } : { L:Math.max(70, hw + 24), R:Math.max(64, hw + 24), T:58, B:70 };
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
const pillW = (s, f) => Math.max(f * 1.7, tw(s, f) + f * 1.05);
function txt(x, y, s, fs, fill, g, extra){ const t = el("text", Object.assign({ x, y, "font-size":fs, fill, "text-anchor":"middle", "dominant-baseline":"central" }, extra || {}), g); t.textContent = s; return t; }
function pill(x, y, s, fs, o, g){
  o = o || {}; if(o.op != null && o.op <= 0) return null;
  const gg = el("g", { opacity:o.op != null && o.op < 1 ? o.op : null, "data-pill":s }, g);
  const w = pillW(s, fs), hg = fs * 1.6;
  el("rect", { x:x - w / 2, y:y - hg / 2, width:w, height:hg, rx:hg / 2, fill:o.bg || "#fff", stroke:o.stroke || "#e2e8f0", "stroke-width":o.sw || 1.8 }, gg);
  txt(x, y + fs * .04, s, fs, o.color || "#0f172a", gg);
  return gg;
}
const PILL_A = { color:"#5b21b6", stroke:"#c4b5fd", sw:2 }, PILL_B = { color:"#1d4ed8", stroke:"#93c5fd", sw:2 }, PILL_H = { color:"#c2410c", stroke:"#fdba74", sw:2 };
const PILL_W = { color:"#1d4ed8", stroke:"#3b82f6", sw:2.4, bg:"#eff6ff" };
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
function ticks(p, q, n, g, op){
  if(op <= 0) return;
  const X1 = L.X(p[0]), Y1 = L.Y(p[1]), X2 = L.X(q[0]), Y2 = L.Y(q[1]);
  const len = Math.hypot(X2 - X1, Y2 - Y1); if(len < 14) return;
  const ux = (X2 - X1) / len, uy = (Y2 - Y1) / len, nx = -uy, ny = ux, mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
  let d = "";
  for(let i = 0; i < n; i++){ const o = (i - (n - 1) / 2) * 5.5, cx = mx + ux * o, cy = my + uy * o; d += `M${cx - nx * 7} ${cy - ny * 7}L${cx + nx * 7} ${cy + ny * 7}`; }
  el("path", { d, stroke:"#0f172a", "stroke-width":2.2, "stroke-linecap":"round", fill:"none", opacity:op }, g);
}
function swingArrow(pc, g, op){
  if(op <= 0) return;
  const c0 = centroid(pc.P), M = pc.M, base_ = [M[0] + (c0[0] - M[0]) * .82, M[1] + (c0[1] - M[1]) * .82];
  const SP = []; for(let th = 16; th <= 164; th += 6){ const q = rot(base_, M, pc.sign * th); SP.push([L.X(q[0]), L.Y(q[1])]); }
  el("polyline", { points:SP.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "), fill:"none", stroke:"#2563eb", "stroke-width":2.4, "stroke-linecap":"round", opacity:op }, g);
  const e = SP[SP.length - 1], pv = SP[SP.length - 3], ang = Math.atan2(e[1] - pv[1], e[0] - pv[0]);
  const hd = (a_, r) => [e[0] - Math.cos(a_) * r, e[1] - Math.sin(a_) * r], l = hd(ang - .5, 10), r = hd(ang + .5, 10);
  el("path", { d:`M${l[0]} ${l[1]}L${e[0]} ${e[1]}L${r[0]} ${r[1]}`, fill:"none", stroke:"#2563eb", "stroke-width":2.4, "stroke-linecap":"round", opacity:op }, g);
}
function pin(M, g, op){
  if(op <= 0) return;
  el("circle", { cx:L.X(M[0]), cy:L.Y(M[1]), r:6, fill:"#fff", stroke:"#2563eb", "stroke-width":2.4, opacity:op }, g);
  el("circle", { cx:L.X(M[0]), cy:L.Y(M[1]), r:2.2, fill:"#2563eb", opacity:op }, g);
}

function drawBoard(){
  const it = cur(); if(!it) return;
  if(!it.model){ drawPlain(it); panelHead(it); return; }
  L = layout(it);
  svg.setAttribute("viewBox", `0 0 ${L.w} ${L.h}`);
  svg.innerHTML = "";
  const G = {}; ["grid", "back", "main", "top", "lab"].forEach(n => G[n] = el("g"));
  const k = it.mStep, t = ANIM ? ANIM.t : 1, at = i => k === i ? t : k > i ? 1 : 0;
  if(it.grid && L.s >= 12){
    const x0 = Math.floor(L.F.x0), x1 = Math.ceil(L.F.x1); let d = "";
    for(let x = x0; x <= x1; x++) d += `M${L.X(x)} ${L.Y(0)}V${L.Y(it.h)}`;
    for(let y = 0; y <= it.h; y++) d += `M${L.X(x0)} ${L.Y(y)}H${L.X(x1)}`;
    el("path", { d, stroke:"rgba(15,23,42,.09)", "stroke-width":1, fill:"none", "shape-rendering":"crispEdges" }, G.grid);
  }
  const P = { k, t, at };
  if(it.method === "avg") sceneAvg(it, P, G); else scenePara(it, P, G);
  drawHeight(it, P, G);
  if(it.method === "avg") labelsAvg(it, P, G); else labelsPara(it, P, G);
  panelHead(it);
}
/* Medium and Spicy: the clean diagram, the same drawing as the worksheet's */
function drawPlain(it){
  const wrap = $("boardWrap"), w = Math.max(260, wrap.clientWidth), hh = Math.max(220, wrap.clientHeight);
  const out = trapSVG(it, { w, h:hh, fs:w < 520 ? 15 : 18, unit:"cm", grid:false, maxS:62, px:true });
  svg.setAttribute("viewBox", `0 0 ${w} ${hh}`);
  svg.innerHTML = out.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  L = null;
}
function sceneAvg(it, P, G){
  const g = avgGeo(it), T = trapPts(it), k = P.k, cut = P.at(1), sw = P.at(2), two = g.pieces.length === 2;
  const cutC = g.pieces.map((pc, i) => ease(span01(cut, two ? (i ? [.44, .82] : [0, .38]) : [0, .8])));
  const sep = k === 1 ? ease(span01(cut, [.86, 1])) : k === 2 ? 1 - ease(span01(sw, [0, .1])) : 0;
  const swing = g.pieces.map((pc, i) => ease(span01(sw, two ? (i ? [.47, .83] : [.1, .45]) : [.1, .8])));
  const ghost = k === 2 ? span01(sw, [.1, .3]) : k > 2 ? 1 : 0;
  const shape = { fill:C.tri, stroke:C.triS, "stroke-width":3 };
  if(ghost > 0) poly(T, { fill:"none", stroke:"#64748b", "stroke-width":2, "stroke-dasharray":"6 5", opacity:ghost }, G.back);
  if(k === 0 || !g.pieces.length || (k === 1 && sep === 0)){
    poly(T, shape, G.main);
    if(k === 1) g.pieces.forEach((pc, i) => cutLine(pc.M, pc.end, cutC[i], G.top, P.t));
  } else {
    const gap = 3.5 / L.s * sep;
    poly(g.body, shape, G.main);
    g.pieces.forEach((pc, i) => poly(swingPoly(pc, swing[i], pc.side * gap), shape, G.main));
  }
  const marks = k === 0 ? 0 : k === 1 ? span01(cut, [0, .12]) : 1, arrow = k === 1 ? span01(cut, [.88, 1]) : k === 2 ? 1 - span01(sw, [0, .1]) : 0;
  g.pieces.forEach((pc, i) => {
    const gap = 3.5 / L.s * sep;
    ticks(pc.M, pc.other, pc.ticks, G.top, marks);
    if(k >= 1){ const q = swingPoly({ P:[pc.own, pc.M], M:pc.M, sign:pc.sign }, swing[i], pc.side * gap); ticks(q[0], q[1], pc.ticks, G.top, marks); }
    swingArrow(pc, G.top, arrow);
    pin(pc.M, G.top, marks);
  });
  const mid = k === 3 ? span01(P.at(3), [0, .3]) : k > 3 ? 1 : 0;
  if(mid > 0) seg([g.x1, it.h / 2], [lerp(g.x1, g.x2, mid), it.h / 2], { stroke:"#2563eb", "stroke-width":2.6, "stroke-dasharray":"9 6", "stroke-linecap":"round" }, G.top);
}
function scenePara(it, P, G){
  const g = paraGeo(it), T = trapPts(it), k = P.k;
  it._prog = 0;
  if(k === 0){ poly(T, { fill:C.tri, stroke:C.triS, "stroke-width":3 }, G.main); return; }
  if(k === 1){
    poly(T, { fill:C.tri, stroke:"none" }, G.main);
    poly(flipPoly(T, g.e[0], g.e[1], P.t), { fill:C.half, stroke:C.halfS, "stroke-width":2.5 }, G.top);
    poly(T, { fill:"none", stroke:C.triS, "stroke-width":3 }, G.top);
    if(!ANIM) poly(g.PG, { fill:"none", stroke:"#0f172a", "stroke-width":2.5 }, G.top);
    return;
  }
  const cuts = cutsAt(it), ch = cuts.length ? P.at(3) : 0;
  const chopCut = ease(span01(ch, [0, .4])), prog = ease(span01(ch, [.48, 1]));
  const sep = cuts.length && k === 3 ? span01(ch, [.4, .48]) * (1 - prog) : 0, gap = 5 / L.s * sep;
  if(prog > 0) poly(g.PG, { fill:"none", stroke:"#94a3b8", "stroke-width":2, "stroke-dasharray":"6 6", opacity:Math.min(1, prog * 1.5) }, G.back);
  const parts = [[g.CP, C.half, C.halfS, 2.2], [T, C.tri, C.triS, 3]];
  if(prog === 0 && gap === 0) parts.forEach(([Q, f, st, sw]) => poly(Q, { fill:f, stroke:st, "stroke-width":sw }, G.main));
  else { const ST = strips(it); parts.forEach(([Q, f, st, sw]) => ST.forEach(s => {
    const c = trapClip(Q, s.lo, s.hi); if(!c) return;
    const shift = s.dx * prog - Math.sign(s.dx) * gap;
    poly(c.map(q => [q[0] + shift, q[1]]), { fill:f, stroke:st, "stroke-width":sw }, G.main);
  })); }
  if(k === 3 && prog === 0 && sep === 0) cuts.forEach(x => { const r = (() => { const ys = []; const PG = g.PG;
    for(let i = 0; i < 4; i++){ const q = PG[i], rr = PG[(i + 1) % 4]; if((q[0] - x) * (rr[0] - x) <= 0 && q[0] !== rr[0]){ const tt = (x - q[0]) / (rr[0] - q[0]); ys.push(q[1] + tt * (rr[1] - q[1])); } }
    return ys.length ? [Math.min(...ys), Math.max(...ys)] : null; })(); if(r) cutLine([x, r[1]], [x, r[0]], chopCut, G.top, P.t); });
  it._prog = prog;
}
/* the height: a vertical side or a top corner, then (once the rectangle is made) the rectangle's left side */
function drawHeight(it, P, G){
  const f = fsz(), H = trapHeightAt(it), lab = fmt(it.h) + " cm", lw = pillW(lab, f);
  const lo = rectX0(it), hi = lo + rectW(it);
  const end = H.edge && (H.x === lo || H.x === hi) ? { x:H.x, side:H.out } : { x:lo, side:-1 };
  const u = it.method === "avg" ? ease(span01(P.at(2), [.86, 1])) : (cutsAt(it).length ? (it._prog || 0) : 0);
  const x = lerp(H.x, end.x, u), edgeNow = H.edge && u === 0;
  if(!edgeNow) seg([x, 0], [x, it.h], { stroke:C.alt, "stroke-width":2.5, "stroke-dasharray":"7 5" }, G.top);
  const a = u > .5 ? lo : 0, bb = u > .5 ? hi : it.b, r = Math.min(12, it.h * L.s * .3), dir = x < (a + bb) / 2 ? 1 : -1, fx = L.X(x), fy = L.Y(0);
  el("path", { d:`M${fx + dir * r} ${fy}V${fy - r}H${fx}`, fill:"none", stroke:edgeNow ? C.triS : C.alt, "stroke-width":2 }, G.top);
  const s0 = H.edge ? H.out : H.into;
  const px0 = L.X(H.x) + s0 * (lw / 2 + 10), px1 = L.X(end.x) + end.side * (lw / 2 + 12);
  pill(lerp(px0, px1, u), L.Y(it.h / 2), lab, f, PILL_H, G.lab);
}
function labelsAvg(it, P, G){
  const { a, b, h, p } = it, f = fsz(), o = L.compact ? 28 : 32, g = avgGeo(it), av = P.at(3);
  const la = fmt(a) + " cm", lb = fmt(b) + " cm";
  /* the rectangle's length is the question on "how long is the rectangle?" — it stays a ? until answered */
  const lw = it.asksAvg && !it.settled ? "?" : fmt((a + b) / 2) + " cm";
  const A0 = [L.X(p + a / 2), L.Y(h) - o], B0 = [L.X(b / 2), L.Y(0) + o];
  const mx = L.X((g.x1 + g.x2) / 2), my = L.Y(h / 2), wa = pillW(la, f), wb = pillW(lb, f);
  const Am = [mx - wa / 2 - 16, my], Bm = [mx + wb / 2 + 16, my];
  const mv = ease(span01(av, [0, .36])), join = ease(span01(av, [.44, .62])), out = span01(av, [.56, .68]);
  const pop = span01(av, [.56, .78]), drop = ease(span01(av, [.82, 1]));
  const place = (p0, pm) => [lerp(lerp(p0[0], pm[0], mv), mx, join), lerp(lerp(p0[1], pm[1], mv), my, join)];
  if(out < 1){
    const pa = place(A0, Am), pb = place(B0, Bm);
    pill(pa[0], pa[1], la, f, Object.assign({ op:1 - out }, PILL_A), G.lab);
    pill(pb[0], pb[1], lb, f, Object.assign({ op:1 - out }, PILL_B), G.lab);
  }
  if(pop > 0){
    const fz = f * (drop > 0 ? 1 : Math.max(.05, easeBack(pop)) * (1 + .25 * (1 - drop)));
    pill(mx, lerp(my, L.Y(0) + o, drop), lw, fz, PILL_W, G.lab);
  }
}
function labelsPara(it, P, G){
  const { a, b, h, p } = it, f = fsz(), o = L.compact ? 28 : 32, k = P.k, B = a + b;
  const la = fmt(a) + " cm", lb = fmt(b) + " cm", lB = fmt(B) + " cm";
  const aT = [L.X(p + a / 2), L.Y(h) - o], bB = [L.X(b / 2), L.Y(0) + o], aC = [L.X(b + a / 2), L.Y(0) + o], bC = [L.X(p + a + b / 2), L.Y(h) - o];
  const spread = (l, wl, r, wr) => { const need = (wl + wr) / 2 + 8, gp = r[0] - l[0]; if(gp < need){ const d = (need - gp) / 2; l[0] -= d; r[0] += d; } };
  spread(aT, pillW(la, f), bC, pillW(lb, f)); spread(bB, pillW(lb, f), aC, pillW(la, f));
  const copyIn = k === 1 ? span01(P.t, [.86, 1]) : k > 1 ? 1 : 0, m = P.at(2), cx = L.X(B / 2), y = L.Y(0) + o, wa = pillW(la, f), wb = pillW(lb, f);
  const mv = ease(span01(m, [.05, .4])), plus = span01(m, [.3, .42]), join = ease(span01(m, [.5, .66])), out = span01(m, [.58, .7]), pop = span01(m, [.58, .82]), topOut = span01(m, [0, .3]);
  pill(aT[0], aT[1], la, f, Object.assign({ op:1 - topOut }, PILL_A), G.lab);
  if(copyIn > 0) pill(bC[0], bC[1], lb, f, Object.assign({ op:copyIn * (1 - topOut) }, PILL_B), G.lab);
  if(out < 1){
    pill(lerp(lerp(bB[0], cx - wb / 2 - 16, mv), cx, join), y, lb, f, Object.assign({ op:1 - out }, PILL_B), G.lab);
    if(copyIn > 0) pill(lerp(lerp(aC[0], cx + wa / 2 + 16, mv), cx, join), y, la, f, Object.assign({ op:copyIn * (1 - out) }, PILL_A), G.lab);
    if(plus > 0) txt(cx, y, "+", f * 1.25, "#334155", G.lab, { opacity:plus * (1 - out) });
  }
  if(k >= 2 && pop > 0) pill(cx, y, lB, f * (pop < 1 ? Math.max(.05, easeBack(pop)) : 1), PILL_W, G.lab);
}
/* the panel's head: what is showing, the switch between the two stories, and the model's own step buttons */
function panelHead(it){
  const has = !!it.model;
  $("viewTag").textContent = has ? "Model" : "Diagram";
  $("methSeg").hidden = !has;
  $("stepBox").hidden = !has;
  if(!has) return;
  $("methSeg").querySelectorAll("button").forEach(b => { const on = b.dataset.m === it.method; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  const steps = modelSteps(it), k = it.mStep;
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
function setMethod(m){
  const it = cur(); if(!it || !it.model || it.method === m) return;
  stopAnim(); it.method = m; S.method = m;
  /* switching story starts it from the beginning — or, once a wrong answer has been marked, shows all of it */
  it.mStep = it.settled && !it.correct ? modelSteps(it).length - 1 : 0;
  drawBoard();
}
$("mNext").addEventListener("click", modelNext);
$("mBack").addEventListener("click", modelBack);
$("methSeg").querySelectorAll("button").forEach(b => b.addEventListener("click", () => setMethod(b.dataset.m)));

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
if(window.ResizeObserver){ const ro = new ResizeObserver(onResize); ro.observe($("boardWrap")); ro.observe(document.querySelector(".boardHead")); }

/* =====================================================================
   SCORES, CERTIFICATE, SAVE
   ===================================================================== */
const CAT_NAMES = { "trap-avg":"The average of the parallel sides", "trap-para":"Two copies make a parallelogram", "trap-area":"Find the area", "trap-missing":"Find a missing length", "trap-mistake":"Spot the mistake" };
const CATS = ["trap-avg","trap-para","trap-area","trap-missing","trap-mistake"];
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
  startItem(); paint(); focusAnswer();
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
window.__ZQ__ = { S, LEVELS, ORDER, buildPaper, startLevel, scores, finish, next, check, paint, markStep, num, modelSteps, modelNext, modelBack, setMethod, trapArea, trapKind, mkTrap, avgGeo, paraGeo, cutsAt, swingPoly, get L(){ return L; }, get ANIM(){ return ANIM; } };
})();
