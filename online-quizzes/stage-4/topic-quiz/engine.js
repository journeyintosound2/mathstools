/* Mills Maths Tools — Whole-topic quizzes: the shared engine
   ------------------------------------------------------------------------
   online-quizzes/stage-4/topic-quiz/engine.js

   One engine, one bank per topic. A topic page is a thin shell that loads
   core.js, this file, the diagram engines it needs from the Revision
   Generator (/assessment/exam-builder/engines/…) and its bank
   (banks/<topic>.js), which calls MMTQ.run(bank).

   THREE WAYS IN, BY URL
     plain                   student quiz: choose Basic or Expected, choose
                             question types, go. Sign-in is the shared
                             /portal/shared/quizAuthUI.js overlay.
     ?builder=1              the teacher's "Create student quiz link" builder.
                             The Teacher Platform loads this in a hidden frame
                             and drives it through the ids every whole-topic
                             builder shares: .levelToggleBtn[data-level],
                             #builderTypes input[type=checkbox], #builderCount,
                             #generateAssignmentBtn, #assignmentLinkOut.
                             KEEP THOSE IDS.
     ?assignment=1&level=…&types=…&count=…
                             a teacher-set version: the level and question
                             types are fixed, the student just signs in and
                             starts.

   MARKING RULES (the same as the newer MMT quizzes)
     * One question, one answer.
     * Only the FIRST check scores. A wrong answer shows the right one and a
       line of working, then the student moves on.
     * A "nudge" (unreadable input, or right value in the wrong form — an
       unsimplified ratio, not in index form, not in terms of π) never uses up
       the attempt.
     * Skip counts as wrong and shows the answer.
     * No typed answer is ever saved — only marks per question type.

   A BANK is
     { id, title, toolId, tool, mastery, outcome, related:[{href,label,small}],
       levels:{ basic:{sub}, expected:{sub} },
       types:[ { id, level:"basic"|"expected", label, gen:()=>question } ] }
   Types are listed easiest first within each level; the paper is ordered
   the same way (with a little shuffle) so it climbs.

   A QUESTION is
     { prompt:html, diagram?, mode, …mode fields (see core.js), unit?, pre?,
       keys?:["π","^",":",…], answerHTML, why? }
   diagram is one of
     { engine:"area-engine", config:{…}, w?:px, h?:px }   Revision Generator engine
     { grid:{…} }                                         MMTQ.grid (Cartesian plane)
     { html:"…" }                                         a table or anything else
*/
(function () {
  "use strict";
  const C = window.MMTQCore;
  const $ = id => document.getElementById(id);
  const PARAMS = new URLSearchParams(location.search);
  const BUILDER = PARAMS.get("builder") === "1";
  const ASSIGN = !BUILDER && (PARAMS.get("assignment") === "1" || PARAMS.has("types"));
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LEVEL_NAME = { basic: "Basic", expected: "Expected" };
  /* Levels come from the bank (Stage 3 uses the syllabus parts: { a:{name:"Part A"}, ab:{name:"Parts A and B"} },
     or one level for a Part B-only outcome). LEVEL_KEYS = the bank's levels that have types, easiest first. */
  let LEVEL_KEYS = ["basic", "expected"];
  function setupLevels() {
    const lv = BANK.levels || {};
    Object.keys(lv).forEach(k => { if (lv[k] && lv[k].name) LEVEL_NAME[k] = lv[k].name; else if (!LEVEL_NAME[k]) LEVEL_NAME[k] = k; });
    LEVEL_KEYS = Object.keys(lv).filter(k => typesFor(k).length);
    if (!LEVEL_KEYS.length) LEVEL_KEYS = ["basic", "expected"].filter(k => typesFor(k).length);
  }
  const lastLevel = () => LEVEL_KEYS[LEVEL_KEYS.length - 1];
  /* colour class: the first level green, the rest amber (as Basic / Expected) */
  const levelCls = k => (k === "basic" || k === "expected") ? k : (LEVEL_KEYS.indexOf(k) === 0 && LEVEL_KEYS.length > 1 ? "basic" : "expected");
  const DEFAULT_COUNT = 15, MIN_COUNT = 5, MAX_COUNT = 60;

  let BANK = null;
  const S = { level: null, typeIds: [], count: DEFAULT_COUNT, qs: [], recs: [], miss: [], i: 0, mcPick: null, plotPt: null, seq: [], nl: null, done: false };
  const PICK_MODES = ["mc", "tf", "plot", "order", "nline", "multi"];   // answered by picking, not by typing

  /* ======================= Cartesian plane =========================== */
  /* opts: xMin,xMax,yMin,yMax, cell (px), points:[{x,y,label,color}],
     lines:[{m,b,color,label}], interactive, onPick(x,y) */
  function grid(o) {
    const NS = "http://www.w3.org/2000/svg";
    const xMin = o.xMin ?? -6, xMax = o.xMax ?? 6, yMin = o.yMin ?? -6, yMax = o.yMax ?? 6;
    const cell = o.cell || 34, pad = 26;
    const W = (xMax - xMin) * cell + pad * 2, H = (yMax - yMin) * cell + pad * 2;
    const X = x => pad + (x - xMin) * cell, Y = y => pad + (yMax - y) * cell;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "qgrid" + (o.interactive ? " pick" : ""));
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Cartesian plane");
    const el = (n, a, txt) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
    for (let x = xMin; x <= xMax; x++) el("line", { x1: X(x), y1: Y(yMin), x2: X(x), y2: Y(yMax), class: "gl" });
    for (let y = yMin; y <= yMax; y++) el("line", { x1: X(xMin), y1: Y(y), x2: X(xMax), y2: Y(y), class: "gl" });
    if (yMin <= 0 && yMax >= 0) el("line", { x1: X(xMin) - 6, y1: Y(0), x2: X(xMax) + 10, y2: Y(0), class: "ax", "marker-end": "" });
    if (xMin <= 0 && xMax >= 0) el("line", { x1: X(0), y1: Y(yMin) + 6, x2: X(0), y2: Y(yMax) - 10, class: "ax" });
    if (yMin <= 0 && yMax >= 0) { el("path", { d: `M${X(xMax) + 14},${Y(0)} l-10,-5 v10 z`, class: "axh" }); el("text", { x: X(xMax) + 12, y: Y(0) - 10, class: "axl" }, "x"); }
    if (xMin <= 0 && xMax >= 0) { el("path", { d: `M${X(0)},${Y(yMax) - 14} l-5,10 h10 z`, class: "axh" }); el("text", { x: X(0) + 12, y: Y(yMax) - 8, class: "axl" }, "y"); }
    const ox = xMin <= 0 && xMax >= 0 ? X(0) : X(xMin), oy = yMin <= 0 && yMax >= 0 ? Y(0) : Y(yMin);
    const step = o.labelStep || 1;
    for (let x = xMin; x <= xMax; x += step) if (x !== 0) el("text", { x: X(x), y: oy + 15, class: "tk", "text-anchor": "middle" }, C.fmt(x));
    for (let y = yMin; y <= yMax; y += step) if (y !== 0) el("text", { x: ox - 7, y: Y(y) + 4, class: "tk", "text-anchor": "end" }, C.fmt(y));
    if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) el("text", { x: X(0) - 7, y: Y(0) + 15, class: "tk", "text-anchor": "end" }, "0");
    // lines, clipped to the box
    // Line labels go where they are farthest from other labels and from any crossing point.
    const placed = [], cross = [];
    (o.lines || []).forEach((L, i) => (o.lines || []).slice(i + 1).forEach(M2 => { if (L.m !== M2.m) { const x = (M2.b - L.b) / (L.m - M2.m); cross.push([X(x), Y(L.m * x + L.b)]); } }));
    (o.lines || []).forEach(L => {
      const pts = [];
      const add = (x, y) => { if (x >= xMin - 1e-9 && x <= xMax + 1e-9 && y >= yMin - 1e-9 && y <= yMax + 1e-9) pts.push([x, y]); };
      add(xMin, L.m * xMin + L.b); add(xMax, L.m * xMax + L.b);
      if (L.m !== 0) { add((yMin - L.b) / L.m, yMin); add((yMax - L.b) / L.m, yMax); }
      pts.sort((a, b) => a[0] - b[0]);
      if (pts.length >= 2) {
        const a = pts[0], b = pts[pts.length - 1];
        el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: "ln", stroke: L.color || "#be123c" });
        if (L.label) {
          let best = null, bestD = -1;
          [0.85, 0.72, 0.15, 0.28, 0.5].forEach(t => {
            const px = X(a[0] + (b[0] - a[0]) * t), py = Y(a[1] + (b[1] - a[1]) * t);
            const d = Math.min(1e9, ...placed.concat(cross).map(q => Math.hypot(q[0] - px, q[1] - py)));
            if (d > bestD + 0.5) { bestD = d; best = [px, py]; }
          });
          placed.push(best);
          // Step off the line at right angles (on the upper side), anchored so the text runs away from it.
          let dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
          let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; }
          const anchor = Math.abs(nx) < 0.35 ? "middle" : nx > 0 ? "start" : "end";
          const tx = el("text", { x: best[0] + nx * 12, y: best[1] + ny * 12 + (ny > -0.5 ? 5 : 0), class: "lnl", fill: L.color || "#be123c", "text-anchor": anchor }, L.label);
          tx.setAttribute("paint-order", "stroke");
        }
      }
    });
    (o.points || []).forEach(p => {
      el("circle", { cx: X(p.x), cy: Y(p.y), r: 6.5, class: "pt", fill: p.color || "#1d4ed8" });
      if (p.label) { const t = el("text", { x: X(p.x) + 9, y: Y(p.y) - 9, class: "ptl" }, p.label); t.setAttribute("paint-order", "stroke"); }
    });
    if (o.interactive) {
      const ghost = el("circle", { r: 7, class: "ghost", cx: -50, cy: -50 });
      const mine = el("circle", { r: 8, class: "mine", cx: -50, cy: -50 });
      const toLattice = ev => {
        const r = svg.getBoundingClientRect();
        const sx = (ev.clientX - r.left) * W / r.width, sy = (ev.clientY - r.top) * H / r.height;
        const x = Math.round(xMin + (sx - pad) / cell), y = Math.round(yMax - (sy - pad) / cell);
        if (x < xMin || x > xMax || y < yMin || y > yMax) return null;
        return [x, y];
      };
      svg.addEventListener("pointermove", ev => { const p = toLattice(ev); if (p) { ghost.setAttribute("cx", X(p[0])); ghost.setAttribute("cy", Y(p[1])); } });
      svg.addEventListener("pointerleave", () => { ghost.setAttribute("cx", -50); });
      svg.addEventListener("click", ev => {
        if (svg.classList.contains("locked")) return;
        const p = toLattice(ev); if (!p) return;
        mine.setAttribute("cx", X(p[0])); mine.setAttribute("cy", Y(p[1]));
        o.onPick && o.onPick(p[0], p[1]);
      });
      svg.markAnswer = (pt, ok, truth) => {
        svg.classList.add("locked");
        if (pt) mine.setAttribute("class", "mine " + (ok ? "good" : "bad"));
        if (!ok && truth) el("circle", { cx: X(truth[0]), cy: Y(truth[1]), r: 9, class: "truth" });
      };
      svg.setPoint = pt => { if (pt) { mine.setAttribute("cx", X(pt[0])); mine.setAttribute("cy", Y(pt[1])); } };
    }
    return svg;
  }

  /* ======================= Diagrams ================================= */
  function engineFor(name) {
    return window["MMT_" + String(name).replace(/-engine$/, "").toUpperCase().replace(/-/g, "_") + "_ENGINE"];
  }
  /* Render, then trim the SVG to its ink so a small shape in a big print
     frame does not arrive as a small shape in a big empty box. Every diagram
     is then drawn at the same scale (natural size × k, capped by the box),
     so a label is the same size from one question to the next. */
  function drawDiagram(host, d) {
    host.innerHTML = "";
    if (!d) return;
    if (d.html) { host.innerHTML = d.html; return; }
    if (d.grid) { host.appendChild(grid(d.grid)); return; }
    const E = engineFor(d.engine);
    if (!E || !E.render) { host.innerHTML = `<div class="diagMissing">Diagram unavailable</div>`; return; }
    const holder = document.createElement("div"); holder.className = "engHolder";
    host.appendChild(holder);
    try { E.render(holder, d.config || {}); } catch (e) { console.warn("diagram", e); holder.innerHTML = `<div class="diagMissing">Diagram unavailable</div>`; return; }
    if (d.caption) { const cap = document.createElement("div"); cap.className = "diagCap"; cap.textContent = d.caption; host.appendChild(cap); }
    holder.querySelectorAll("svg").forEach((svg, k) => {
      if (svg.closest("svg") !== svg && svg.parentElement.closest("svg")) return;
      try {
        const bb = svg.getBBox();
        if (bb.width > 4 && bb.height > 4) {
          const p = 10;
          svg.setAttribute("viewBox", `${bb.x - p} ${bb.y - p} ${bb.width + 2 * p} ${bb.height + 2 * p}`);
          svg.removeAttribute("width"); svg.removeAttribute("height");
          const k = d.scale || 1.15;
          svg.style.width = Math.round((bb.width + 2 * p) * k) + "px";
          svg.style.maxWidth = "100%"; svg.style.height = "auto";
          if (d.maxH) svg.style.maxHeight = d.maxH + "px";
        }
      } catch (e) { /* not rendered yet; leave it */ }
    });
  }

  /* ======================= Paper ==================================== */
  function typesFor(level) { return BANK.types.filter(t => (t.levels || [t.level]).includes(level)); }
  function buildPaper(level, typeIds, n) {
    const types = typesFor(level).filter(t => typeIds.includes(t.id));
    if (!types.length) return [];
    const order = new Map(typesFor(level).map((t, i) => [t.id, i]));
    // Deal the types out evenly so every chosen type appears, then climb.
    const plan = [];
    let deck = [];
    while (plan.length < n) { if (!deck.length) deck = C.shuffle(types); plan.push(deck.pop()); }
    const qs = [], seen = new Set();
    plan.forEach(t => {
      let q = null;
      for (let tries = 0; tries < 40; tries++) {
        const c = t.gen();
        const key = t.id + "|" + (c.key || c.prompt + JSON.stringify(c.diagram && (c.diagram.config || c.diagram.grid || c.diagram.html) || "") + JSON.stringify(c.options || ""));
        q = c;
        if (!seen.has(key)) { seen.add(key); break; }
      }
      q.type = t.id; q.label = t.label; q._o = order.get(t.id) + Math.random() * 1.6;
      qs.push(q);
    });
    qs.sort((a, b) => a._o - b._o);
    return qs;
  }

  /* ======================= Quiz UI ================================== */
  function chipLevel() {
    const ch = $("lvlChip");
    if (!S.level) { ch.hidden = true; return; }
    ch.hidden = false; ch.textContent = LEVEL_NAME[S.level]; ch.className = "lvlChip " + levelCls(S.level);
  }
  function progress() {
    const n = S.qs.length || 1;
    const done = S.recs.filter(Boolean).length;
    $("progressFill").style.width = Math.round(done / n * 100) + "%";
    $("qCounter").textContent = S.qs.length ? `Question ${S.i + 1} of ${S.qs.length}` : "";
    $("scoreNow").textContent = `${S.recs.filter(r => r && r.ok).length} correct`;
  }

  function insertAtCaret(input, text) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    input.focus(); input.setSelectionRange(s + text.length, s + text.length);
    input.dispatchEvent(new Event("input"));
  }

  /* how to type it, shown under an empty algebra box: only the keys this answer needs */
  function typingHint(q) {
    const src = q.mode === "expr" ? q.expr : q.mode === "eqn" ? q.eqn : q.mode === "set" ? (q.values || []).join(" ") : "";
    if (!src) return "";
    const bits = [];
    if (/\^/.test(src)) bits.push("<b>^</b> for a power (x^2)");
    if (/\//.test(src)) bits.push("<b>/</b> for a fraction");
    if (/sqrt|√/.test(src)) bits.push("<b>√</b> for a root");
    return bits.length ? `<span class="pvHint">Type ${bits.join(", ")}.</span>` : "";
  }
  function previewHTML(q, v) {
    if (!v.trim()) return typingHint(q);
    if (q.mode === "mono") return "= " + C.prettyPowers(v.replace(/\s*[x*]\s*/gi, " × "));
    if (q.mode === "pi") return "= " + C.esc(v).replace(/pi/gi, "π");
    // algebra (Stage 5): show how the typing was read, set out as maths
    if (C.preview) { const p = C.preview(q, v); if (p) return `<span class="pvLab">Reads as</span> ${p}`; if (p === "") return `<span class="pvLab pvWait">…</span>`; }
    return "";
  }
  const KEY_TEXT = { "−": "-", "am": " am", "pm": " pm", "r": " r", "× 10^": " × 10^", "×10^": " × 10^" };
  const DEFAULT_KEYS = { expr: ["^", "(", ")", "/"], eqn: ["=", "^", "(", ")", "/"], set: ["−", ",", "/"], ineq: ["<", ">", "≤", "≥", "−"] };
  function keyBar(keys, target) {
    const kb = document.createElement("div"); kb.className = "keys"; kb.setAttribute("aria-label", "Symbol keys");
    keys.forEach(k => { const b = document.createElement("button"); b.type = "button"; b.className = "key" + (k.length > 2 ? " wide" : "") + (k === "^" ? " hat" : k === "√" ? " root" : ""); b.textContent = k; b.title = "Type " + k; b.addEventListener("mousedown", e => e.preventDefault()); b.addEventListener("click", () => { const inp = target(); if (inp && !inp.disabled) insertAtCaret(inp, KEY_TEXT[k] != null ? KEY_TEXT[k] : k); }); kb.appendChild(b); });
    return kb;
  }
  /* ---- multi: an answer in two or more parts, a box (or a choice) for each ---- */
  function multiUI(q, rec, chk) {
    const box = document.createElement("div"); box.className = "multi" + (q.fields.some(f => f.name) ? "" : " noLab");
    S.multi = q.fields.map((f, i) => (rec && rec.input ? rec.input[i] : null));
    let last = null; const keys = [];
    q.fields.forEach((f, i) => {
      const fq = f.q, row = document.createElement("div"); row.className = "mRow"; row.dataset.i = i;
      const lab = `<span class="mLab">${f.name || ""}</span>`;
      if (fq.mode === "mc" || fq.mode === "tf") {
        const opts = fq.mode === "tf" ? ["True", "False"] : fq.options;
        row.innerHTML = lab + `<span class="mIn"><span class="seg" role="group"></span></span>`;
        const seg = row.querySelector(".seg");
        opts.forEach((o, k) => { const b = document.createElement("button"); b.type = "button"; b.className = "segBtn"; b.innerHTML = o; const val = fq.mode === "tf" ? k === 0 : k;
          if (S.multi[i] === val) b.classList.add("sel");
          b.addEventListener("click", () => { if (S.recs[S.i]) return; S.multi[i] = val; seg.querySelectorAll(".segBtn").forEach(x => x.classList.toggle("sel", x === b)); clearNudge(); }); seg.appendChild(b); });
      } else {
        row.innerHTML = lab + `<span class="mIn">${fq.pre ? `<span class="aff">${fq.pre}</span>` : ""}<input class="ans mAns" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${fq.mode === "num" ? "decimal" : "text"}" placeholder="${C.esc(fq.placeholder || "")}" aria-label="${C.esc((f.name || "") + " " + String(fq.pre || "").replace(/<[^>]+>/g, ""))}">${fq.unit ? `<span class="aff">${fq.unit}</span>` : ""}<span class="preview mPv"></span></span>`;
        const inp = row.querySelector("input"), pv = row.querySelector(".mPv");
        if (S.multi[i] != null) inp.value = S.multi[i];
        const paint = () => { pv.innerHTML = previewHTML(fq, inp.value); };
        inp.addEventListener("input", () => { S.multi[i] = inp.value; clearNudge(); paint(); });
        inp.addEventListener("focus", () => { last = inp; });
        inp.addEventListener("keydown", e => { if (e.key !== "Enter") return; e.preventDefault(); e.stopPropagation(); if (S.recs[S.i]) return next();
          const all = [...box.querySelectorAll("input.mAns")], empty = all.find(x => !x.value.trim()); if (empty && empty !== inp) empty.focus(); else submit(); });
        paint();
        (fq.keys || DEFAULT_KEYS[fq.mode] || (fq.mode === "coord" ? ["(", ",", ")", "−"] : fq.mode === "num" || fq.mode === "frac" ? ["−"] : [])).forEach(k => { if (!keys.includes(k)) keys.push(k); });
      }
      box.appendChild(row);
    });
    const foot = document.createElement("div"); foot.className = "inRow mFoot";
    const typed = box.querySelector("input.mAns");
    if (keys.length && typed) foot.appendChild(keyBar(keys.filter(k => k !== "−" || keys.length > 1 || true), () => last || typed));
    foot.appendChild(chk); box.appendChild(foot);
    return box;
  }

  function showQuestion() {
    const q = S.qs[S.i], rec = S.recs[S.i];
    S.mcPick = rec ? rec.input : null; S.plotPt = rec && q.mode === "plot" ? rec.input : null;
    S.seq = rec && q.mode === "order" ? (rec.input || []).slice() : []; S.nl = rec && q.mode === "nline" ? rec.input : null;
    $("qType").textContent = q.label;
    $("qPrompt").innerHTML = q.prompt;
    const dh = $("qDiagram");
    const body = $("qBody");
    body.classList.toggle("hasDiag", !!q.diagram || q.mode === "plot" || q.mode === "nline");
    dh.hidden = !q.diagram && q.mode !== "plot" && q.mode !== "nline";
    paintSpeak(q);
    if (q.mode === "nline") {
      dh.innerHTML = "";
      dh._nl = numberLine(dh, q, !rec);
    } else if (q.mode === "plot") {
      dh.innerHTML = "";
      const g = grid(Object.assign({}, q.grid || {}, { interactive: !rec, onPick: (x, y) => { S.plotPt = [x, y]; $("plotRead").textContent = `Your point: (${C.fmt(x)}, ${C.fmt(y)})`; clearNudge(); } }));
      dh.appendChild(g);
      if (rec) { g.setPoint && g.setPoint(rec.input); }
      dh._grid = g;
    } else drawDiagram(dh, q.diagram);
    // A long, flat picture (a number line, a bar model, a time line) reads better across the
    // card, between the question and the answer box, than squeezed into the right column.
    body.classList.toggle("wideDiag", q.mode === "nline" || !!(q.diagram && (q.diagram.wide || [...dh.querySelectorAll(".engHolder > svg, .engHolder svg")].some(v => {
      const b = (v.getAttribute("viewBox") || "").split(/\s+/).map(Number); return b.length === 4 && b[3] > 0 && b[2] / b[3] > 2.6;
    }))));

    const area = $("answerArea");
    // Check lives beside the answer box (or the plot read-out); park it back in the nav row first.
    const chk = $("checkBtn"); $("nextBtn").before(chk);
    area.innerHTML = "";
    area.className = "answerArea mode-" + q.mode;
    if (q.mode === "mc") {
      const wrap = document.createElement("div"); wrap.className = "choices" + (q.options.some(o => String(o).length > 38) ? " long" : "");
      q.options.forEach((o, k) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "choice"; b.innerHTML = `<span class="cl">${"ABCDEF"[k]}</span><span class="ct">${o}</span>`;
        b.addEventListener("click", () => { if (S.recs[S.i]) return; S.mcPick = k; wrap.querySelectorAll(".choice").forEach((x, j) => x.classList.toggle("sel", j === k)); clearNudge(); submit(); });
        wrap.appendChild(b);
      });
      area.appendChild(wrap);
    } else if (q.mode === "tf") {
      const wrap = document.createElement("div"); wrap.className = "choices tf";
      [["True", true], ["False", false]].forEach(([t, v]) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "choice"; b.dataset.v = String(v); b.innerHTML = `<span class="ct">${t}</span>`;
        b.addEventListener("click", () => { if (S.recs[S.i]) return; S.mcPick = v; clearNudge(); submit(); });
        wrap.appendChild(b);
      });
      area.appendChild(wrap);
    } else if (q.mode === "order") {
      area.appendChild(orderUI(q, rec, chk));
    } else if (q.mode === "multi") {
      area.appendChild(multiUI(q, rec, chk));
    } else if (q.mode === "nline") {
      const p = document.createElement("div"); p.className = "plotRead"; p.id = "plotRead";
      p.textContent = rec ? "" : "Click the number line to place your mark.";
      const row = document.createElement("div"); row.className = "inRow"; row.appendChild(p); row.appendChild(chk);
      area.appendChild(row);
    } else if (q.mode === "plot") {
      const p = document.createElement("div"); p.className = "plotRead"; p.id = "plotRead";
      p.textContent = rec ? `Your point: (${C.fmt(rec.input[0])}, ${C.fmt(rec.input[1])})` : "Click the grid to place your point.";
      const row = document.createElement("div"); row.className = "inRow"; row.appendChild(p); row.appendChild(chk);
      area.appendChild(row);
    } else {
      const row = document.createElement("div"); row.className = "inRow";
      row.innerHTML = `<label class="inLab" for="ans">Answer</label>${q.pre ? `<span class="aff">${q.pre}</span>` : ""}<input id="ans" class="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${q.mode === "num" && !q.keys ? "decimal" : "text"}" placeholder="${C.esc(q.placeholder || "")}">${q.unit ? `<span class="aff">${q.unit}</span>` : ""}`;
      area.appendChild(row);
      const keys = q.keys || DEFAULT_KEYS[q.mode] || (q.mode === "pi" ? ["π"] : q.mode === "mono" ? ["^", "×"] : q.mode === "ratio" ? [":"] : q.mode === "coord" ? ["(", ",", ")", "−"] : q.mode === "linear" ? ["=", "+", "−", "x"] : q.mode === "time" && q.fmt === "12" ? [":", "am", "pm"] : q.mode === "time" ? [":"] : q.mode === "rem" ? ["r"] : null);
      if (keys && keys.length) row.appendChild(keyBar(keys, () => $("ans")));
      if (["expr", "eqn", "set", "ineq"].includes(q.mode)) row.classList.add("algRow");
      row.appendChild(chk);
      const pv = document.createElement("div"); pv.className = "preview"; pv.id = "preview"; area.appendChild(pv);
      const inp = $("ans");
      inp.addEventListener("input", () => { clearNudge(); pv.innerHTML = previewHTML(q, inp.value); });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); S.recs[S.i] ? next() : submit(); } });
      if (rec) inp.value = rec.input == null ? "" : rec.input;
      pv.innerHTML = previewHTML(q, inp.value);
    }
    clearNudge();
    paintFeedback();
    progress();
    if (!rec && !reduceMotion) { const card = $("qCard"); card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop"); }
    const inp = $("ans") || area.querySelector("input.mAns");
    if (inp && !rec && !document.querySelector(".modalBack.open") && !isAuthOpen()) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  /* ---- order: tap the items in order (Stage 3) ---- */
  function orderUI(q, rec, chk) {
    const box = document.createElement("div"); box.className = "ordBox";
    const ends = q.ends || ["smallest", "largest"];
    box.innerHTML = `<div class="ordRow"><span class="ordEnd">${C.esc(ends[0])}</span><div class="ordSlots"></div><span class="ordEnd">${C.esc(ends[1])}</span></div><div class="ordPool" aria-label="Items to order"></div><div class="ordHint">Tap the items in order. Tap a placed item to take it back.</div>`;
    const slots = box.querySelector(".ordSlots"), pool = box.querySelector(".ordPool");
    const paint = () => {
      slots.innerHTML = q.items.map((_, k) => `<span class="ordSlot${S.seq[k] != null ? " full" : ""}">${S.seq[k] != null ? `<button type="button" class="ordTile" data-i="${S.seq[k]}">${q.items[S.seq[k]]}</button>` : `<i>${k + 1}</i>`}</span>`).join("");
      pool.innerHTML = q.items.map((it, i) => S.seq.includes(i) ? "" : `<button type="button" class="ordTile" data-i="${i}">${it}</button>`).join("");
      box.querySelectorAll(".ordTile").forEach(b => { b.disabled = !!S.recs[S.i]; });
    };
    box.addEventListener("click", e => {
      const b = e.target.closest(".ordTile"); if (!b || S.recs[S.i]) return;
      const i = Number(b.dataset.i), at = S.seq.indexOf(i);
      if (at >= 0) S.seq.splice(at, 1); else S.seq.push(i);
      clearNudge(); paint();
    });
    paint();
    const row = document.createElement("div"); row.className = "inRow ordCheck"; row.appendChild(chk); box.appendChild(row);
    return box;
  }
  /* ---- nline: click a number line to place a mark (Stage 3) ----
     q.min, q.max, q.step (snap), q.labels: [{v, html}] under the line. No value is shown at the mark,
     so the line can't be used to hunt for the answer. Arrow keys move the mark one tick. */
  function numberLine(host, q, live) {
    const NS = "http://www.w3.org/2000/svg", W = 680, H = 150, x0 = 40, x1 = 640, y = 70;
    const n = Math.round((q.max - q.min) / q.step), X = v => x0 + (v - q.min) / (q.max - q.min) * (x1 - x0);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "nline" + (live ? " live" : ""));
    svg.setAttribute("role", "slider"); svg.setAttribute("aria-label", "Number line"); svg.setAttribute("tabindex", live ? "0" : "-1");
    svg.setAttribute("aria-valuemin", q.min); svg.setAttribute("aria-valuemax", q.max);
    const el = (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
    el("line", { x1: x0 - 14, y1: y, x2: x1 + 14, y2: y, class: "nlAxis" });
    const major = new Set((q.labels || []).map(l => Math.round((l.v - q.min) / q.step)));
    for (let k = 0; k <= n; k++) { const xx = X(q.min + k * q.step), big = major.has(k) || k === 0 || k === n; el("line", { x1: xx, y1: y - (big ? 14 : 9), x2: xx, y2: y + (big ? 14 : 9), class: big ? "nlTick big" : "nlTick" }); }
    (q.labels || []).forEach(l => { const g = el("foreignObject", { x: X(l.v) - 40, y: y + 18, width: 80, height: 56 }); const d = document.createElement("div"); d.className = "nlLab"; d.innerHTML = l.html; g.appendChild(d); });
    const mine = el("g", { class: "nlMine", visibility: "hidden" }); 
    const mk = (g, cls) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", "M0 -6 L-11 -26 L11 -26 Z"); p.setAttribute("class", cls); g.appendChild(p); const c = document.createElementNS(NS, "circle"); c.setAttribute("r", 6); c.setAttribute("cy", 0); c.setAttribute("class", cls); g.appendChild(c); };
    mk(mine, "nlPin");
    const set = v => { S.nl = v; mine.setAttribute("visibility", "visible"); mine.setAttribute("transform", `translate(${X(v)},${y})`); svg.setAttribute("aria-valuenow", v); const pr = $("plotRead"); if (pr && live) pr.textContent = "Mark placed — press Check when you are happy."; clearNudge(); };
    const sn = q.snap || q.step, ns = Math.round((q.max - q.min) / sn);   // clicks snap to q.snap (finer than the ticks if set)
    const snap = px => { const k = Math.max(0, Math.min(ns, Math.round((px - x0) / (x1 - x0) * ns))); return Math.round((q.min + k * sn) * 1e9) / 1e9; };
    if (live) {
      svg.addEventListener("click", e => { if (S.recs[S.i]) return; const r = svg.getBoundingClientRect(); set(snap((e.clientX - r.left) / r.width * W)); });
      svg.addEventListener("keydown", e => {
        if (S.recs[S.i]) return;
        const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]; if (!d) return; e.preventDefault();
        const cur = S.nl == null ? q.min + Math.round(ns / 2) * sn : S.nl; set(Math.max(q.min, Math.min(q.max, Math.round((cur + d * sn) * 1e9) / 1e9)));
      });
    }
    if (S.nl != null) set(S.nl);
    host.appendChild(svg);
    return {
      mark(v, ok) {
        if (v != null) set(v);
        mine.querySelectorAll("path,circle").forEach(e => e.setAttribute("class", ok ? "nlPin good" : "nlPin bad"));
        if (!ok) { const g = el("g", { class: "nlTrue", transform: `translate(${X(q.value)},${y})` }); mk(g, "nlPin good"); }
        svg.classList.remove("live");
      }
    };
  }
  /* ---- read aloud (bank.readAloud; Stage 3). Fractions are read as words. ---- */
  const DEN = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"], 100: ["hundredth", "hundredths"] };
  function speakText(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll(".fr").forEach(f => { const n = Number((f.querySelector(".frn") || {}).textContent), d = Number((f.querySelector(".frd") || {}).textContent); const w = DEN[d]; f.textContent = ` ${n} ${w ? w[n === 1 ? 0 : 1] : "over " + d} `; });
    c.querySelectorAll("table").forEach(t => t.remove());
    return c.textContent.replace(/□|☐|_{2,}/g, " blank ").replace(/\bcm²/g, " square centimetres").replace(/\bm²/g, " square metres").replace(/\bcm³/g, " cubic centimetres").replace(/−/g, " minus ").replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/\s+/g, " ").trim();
  }
  /* Young readers (bank.young) hear the choices as well as the question. */
  function speakAll() {
    const q = S.qs[S.i]; let t = speakText($("qPrompt"));
    if (BANK.young && q && q.mode === "mc") {
      const parts = [...document.querySelectorAll("#answerArea .choice")].map((b, k) => `${"ABCDEF"[k]}: ${q.speakOptions ? q.speakOptions[k] : speakText(b.querySelector(".ct"))}`);
      if (parts.length) t += ". The choices are. " + parts.join(". ") + ".";
    }
    if (BANK.young && q && q.mode === "multi") t += ". " + q.fields.map(f => f.name).filter(Boolean).map(n => { const d = document.createElement("span"); d.innerHTML = n; return speakText(d); }).join(". ");
    return t;
  }
  let VOICE = null;
  function pickVoice() { try { const vs = speechSynthesis.getVoices(); VOICE = vs.find(v => /en-AU/i.test(v.lang)) || vs.find(v => /^en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; } catch (e) {} }
  function paintSpeak(q) {
    let b = $("speakBtn");
    if (!BANK.readAloud || !("speechSynthesis" in window)) { if (b) b.hidden = true; return; }
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.id = "speakBtn"; b.className = "speakBtn"; b.title = "Read the question aloud"; b.setAttribute("aria-label", "Read the question aloud");
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Read aloud</span>`;
      b.addEventListener("click", () => {
        try {
          speechSynthesis.cancel(); if (!VOICE) pickVoice();
          const u = new SpeechSynthesisUtterance(speakAll()); if (VOICE) u.voice = VOICE; u.lang = (VOICE && VOICE.lang) || "en-AU"; u.rate = 0.92;
          speechSynthesis.speak(u);
        } catch (e) {}
      });
      $("qType").after(b);
      try { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } catch (e) {}
    }
    b.hidden = false;
    try { speechSynthesis.cancel(); } catch (e) {}
  }

  function isAuthOpen() { const o = $("mmtLoginOverlay"); return !!(o && o.style.display !== "none"); }

  function clearNudge() { const n = $("nudge"); n.hidden = true; n.textContent = ""; }
  function nudge(t) { const n = $("nudge"); n.hidden = false; n.textContent = t; }

  function answerText(q) {
    if (q.answerHTML) return q.answerHTML;
    if (q.mode === "mc") return q.options[q.correct];
    if (q.mode === "tf") return q.truth ? "True" : "False";
    if (q.mode === "num") return (q.pre || "") + C.fmt(q.value, q.dp == null ? 4 : q.dp, q.dp != null && q.dp > 0) + (q.unit ? (q.unit === "°" ? "°" : " " + q.unit) : "");
    if (q.mode === "coord" || q.mode === "plot") return `(${C.fmt(q.x)}, ${C.fmt(q.y)})`;
    if (q.mode === "order") return q.correct.map(i => q.items[i]).join(", ");
    if (q.mode === "nline") return q.valueHTML || C.fmt(q.value);
    if (q.mode === "rem") return `${q.quot} r ${q.rem}`;
    if (q.mode === "pair") return `${q.pair[0]} × ${q.pair[1]}`;
    if (q.mode === "text") return C.esc(q.accept[0]);
    if (q.mode === "ratio") return q.parts.map(v => C.fmt(v)).join(" : ");
    if (q.mode === "expr" && C.alg) { const t = C.alg.parse(q.expr); return (q.pre ? q.pre + " " : "") + (t ? C.alg.html(t) : C.esc(q.expr)) + (q.unit ? " " + q.unit : ""); }
    if ((q.mode === "eqn" || q.mode === "ineq" || q.mode === "set") && C.preview) return C.preview(q, q.mode === "eqn" ? q.eqn : q.mode === "set" ? q.values.join(", ") : `${q.v} ${q.op} ${q.value}`) || "";
    if (q.mode === "multi") return q.fields.map(f => (f.name ? f.name + ": " : "") + answerText(f.q)).join("; &nbsp;");
    return "";
  }

  function paintFeedback() {
    const q = S.qs[S.i], r = S.recs[S.i];
    const fb = $("feedback");
    const area = $("answerArea");
    const check = $("checkBtn"), skip = $("skipBtn"), nxt = $("nextBtn");
    $("prevBtn").disabled = S.i === 0;
    const miss = !r && S.miss[S.i];
    if (miss) {
      fb.hidden = false; fb.className = "feedback retry";
      fb.innerHTML = `<div class="fbHead">Not yet. Have another go!</div><div class="fbWhy">${q.hint || (q.diagram || q.mode === "nline" || q.mode === "plot" ? "Look closely at the picture, then try again." : "Read the question again slowly, then try again.")}</div>`;
      if (q.mode === "mc") area.querySelectorAll(".choice").forEach((b, k) => { if (k === miss.input) { b.disabled = true; b.classList.add("tried"); } });
      check.hidden = q.mode === "mc"; skip.hidden = false; nxt.hidden = true;
      return;
    }
    if (!r) {
      fb.hidden = true; fb.className = "feedback";
      check.hidden = false; skip.hidden = false; nxt.hidden = true;
      check.hidden = q.mode === "mc" || q.mode === "tf";
      return;
    }
    check.hidden = true; skip.hidden = true; nxt.hidden = false;
    nxt.textContent = S.i === S.qs.length - 1 ? "Finish ✓" : "Next →";
    fb.hidden = false;
    fb.className = "feedback " + (r.ok ? "good" : r.fixed ? "fixed" : "bad");
    const head = r.ok ? pickPraise() : r.fixed ? "You got it on your second go!" : r.skipped ? "Skipped — here is the answer" : r.swapped ? "Not quite — check the order: x first, then y" : "Not quite";
    fb.innerHTML = `<div class="fbHead">${r.ok || r.fixed ? "✓" : "✕"} ${head}</div>` +
      (r.ok || r.fixed ? "" : `<div class="fbAns">Answer: <b>${answerText(q)}</b></div>`) +
      (q.why ? `<div class="fbWhy">${q.why}</div>` : "");
    const inp = $("ans"); if (inp) { inp.disabled = true; inp.classList.add(r.ok || r.fixed ? "good" : "bad"); }
    if (q.mode === "multi") area.querySelectorAll(".mRow").forEach((row, i) => {
      const f = q.fields[i], v = r.input ? r.input[i] : null; let ok = false;
      try { ok = !r.skipped && !(f.q.mode !== "mc" && f.q.mode !== "tf" && !String(v == null ? "" : v).trim()) && !!C.check(f.q, v).ok; } catch (e) {}
      row.classList.add(ok ? "good" : "bad");
      row.querySelectorAll("input").forEach(x => { x.disabled = true; x.classList.add(ok ? "good" : "bad"); });
      row.querySelectorAll(".segBtn").forEach((b, k) => { b.disabled = true; const val = f.q.mode === "tf" ? k === 0 : k, right = f.q.mode === "tf" ? f.q.truth === (k === 0) : k === f.q.correct; b.classList.toggle("good", right); b.classList.toggle("bad", val === v && !right); });
      if (!ok && !row.querySelector(".mFix")) { const fx = document.createElement("span"); fx.className = "mFix"; fx.innerHTML = answerText(Object.assign({}, f.q, { pre: "" , answerHTML: f.q.answerHTML })); if (f.q.mode !== "mc" && f.q.mode !== "tf") row.querySelector(".mIn").appendChild(fx); }
    });
    area.querySelectorAll(".key").forEach(k => k.disabled = true);
    if (q.mode === "mc") area.querySelectorAll(".choice").forEach((b, k) => { b.disabled = true; b.classList.toggle("good", k === q.correct); b.classList.toggle("bad", k === r.input && !r.ok && !r.fixed); b.classList.toggle("sel", k === r.input); });
    if (q.mode === "tf") area.querySelectorAll(".choice").forEach(b => { const v = b.dataset.v === "true"; b.disabled = true; b.classList.toggle("good", v === q.truth); b.classList.toggle("bad", v === r.input && !r.ok); });
    if (q.mode === "plot") { const g = $("qDiagram")._grid; g && g.markAnswer && g.markAnswer(r.input, r.ok, [q.x, q.y]); }
    if (q.mode === "nline") { const g = $("qDiagram")._nl; g && g.mark(r.input, r.ok); const pr = $("plotRead"); if (pr) pr.textContent = ""; }
    if (q.mode === "order") area.querySelectorAll(".ordSlot").forEach((sl, k) => { sl.classList.toggle("good", r.input && r.input[k] === q.correct[k]); sl.classList.toggle("bad", !r.input || r.input[k] !== q.correct[k]); });
    area.querySelectorAll(".ordTile").forEach(b => b.disabled = true);
  }
  const PRAISE = ["Correct!", "Nice work!", "Spot on!", "Yes!", "That’s it!", "Great thinking!"];
  const pickPraise = () => C.pick(PRAISE);

  function readInput(q) {
    if (q.mode === "mc" || q.mode === "tf") return S.mcPick;
    if (q.mode === "plot") return S.plotPt;
    if (q.mode === "order") return S.seq.slice();
    if (q.mode === "nline") return S.nl;
    if (q.mode === "multi") return (S.multi || []).slice();
    const inp = $("ans"); return inp ? inp.value : "";
  }
  function submit() {
    if (S.recs[S.i]) return;
    const q = S.qs[S.i];
    const input = readInput(q);
    if (!PICK_MODES.includes(q.mode) && !String(input).trim()) { nudge("Type your answer first — or press Skip."); return; }
    const res = C.check(q, input);
    if (res.nudge) { nudge(res.nudge); const inp = $("ans") || (res.field != null ? document.querySelector(`.mRow[data-i="${res.field}"] input`) : null) || [...document.querySelectorAll("input.mAns")].find(x => !x.value.trim()); if (inp) inp.focus(); return; }
    /* bank.secondTry (young students): a wrong FIRST answer gets one more go with a hint before
       the answer is shown. Only a first go scores, so a fixed answer is saved as not correct. */
    const missed = S.miss[S.i];
    if (!res.ok && BANK.secondTry && !missed && canRetry(q)) {
      S.miss[S.i] = { input };
      if (q.mode === "mc") S.mcPick = null;
      if (q.mode === "order") { showQuestion(); } else paintFeedback();
      const inp = $("ans"); if (inp) { inp.focus(); try { inp.select(); } catch (e) {} }
      return;
    }
    S.recs[S.i] = { ok: !!res.ok && !missed, fixed: !!res.ok && !!missed, input, swapped: !!res.swapped, type: q.type, label: q.label };
    if (res.ok) confetti(missed ? 0.25 : 0.55);
    if (window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
    showQuestion();
    $("nextBtn").focus({ preventScroll: true });
  }
  const canRetry = q => q.mode !== "tf" && !(q.mode === "mc" && q.options.length < 3);
  function skip() {
    if (S.recs[S.i]) return;
    S.recs[S.i] = { ok: false, skipped: true, input: null, type: S.qs[S.i].type, label: S.qs[S.i].label };
    if (window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
    showQuestion();
  }
  function next() {
    if (!S.recs[S.i]) return;
    if (S.i < S.qs.length - 1) { S.i++; showQuestion(); }
    else finish();
  }
  function prev() { if (S.i > 0) { S.i--; showQuestion(); } }

  function start(level, typeIds, count) {
    S.level = level; S.typeIds = typeIds; S.count = count;
    S.qs = buildPaper(level, typeIds, count); S.recs = []; S.miss = []; S.i = 0; S.done = false;
    try { if (window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset(); } catch (e) {}
    closeModal("certModal");
    hideStart();
    showQuestion();
  }

  /* ======================= Finish =================================== */
  function xpFor(pct, level) {
    const base = pct >= 100 ? 150 : pct >= 80 ? 75 : pct >= 60 ? 50 : pct >= 40 ? 25 : pct >= 10 ? 15 : 5;
    const L = (BANK.levels || {})[level] || {};
    const mult = L.xp != null ? L.xp : (level === "expected" || (level === lastLevel() && LEVEL_KEYS.length > 1 && level !== "basic")) ? 1.5 : 1;
    return { base, mult, xp: Math.round(base * mult) };
  }
  function finish() {
    if (window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial()) {
      const done = S.recs.filter(Boolean).length;
      S.qs = S.qs.slice(0, done); S.recs = S.recs.slice(0, done);
    }
    S.done = true;
    const total = S.qs.length, score = S.recs.filter(r => r && r.ok).length;
    const pct = total ? Math.round(score / total * 100) : 0;
    $("progressFill").style.width = "100%";
    // per type, in bank order
    const by = new Map();
    typesFor(S.level).forEach(t => { if (S.typeIds.includes(t.id)) by.set(t.id, { label: t.label, ok: 0, total: 0 }); });
    S.qs.forEach((q, k) => { const e = by.get(q.type); if (!e) return; e.total++; if (S.recs[k] && S.recs[k].ok) e.ok++; });
    const rows = [...by.entries()].filter(([, e]) => e.total);
    $("certScore").textContent = `${score} / ${total}`;
    const earlyDone = !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial());
    // A part-finished paper is not a 100%: no trophy, no big confetti, and say it was submitted early.
    $("certLine").textContent = earlyDone ? `${BANK.title} · ${LEVEL_NAME[S.level]} · submitted early` : `${BANK.title} · ${LEVEL_NAME[S.level]} · ${pct}%`;
    $("certTrophy").textContent = earlyDone ? "📝" : pct >= 90 ? "🏆" : pct >= 70 ? "🥇" : pct >= 50 ? "👏" : "💪";
    $("certBreak").innerHTML = rows.map(([, e]) => `<div class="brow ${e.ok === e.total ? "all" : e.ok === 0 ? "none" : ""}"><span>${e.label}</span><b>${e.ok}/${e.total}</b></div>`).join("");
    // what to practise next: the weakest type, easiest first on ties
    let target = null, worst = 2;
    rows.forEach(([id, e], k) => { const r = e.ok / e.total + k / 1000; if (e.ok < e.total && r < worst) { worst = r; target = e; } });
    const rec = $("certNext"); rec.classList.remove("partial");
    const early = !!(window.MMTSubmit && window.MMTSubmit.isPartial && window.MMTSubmit.isPartial());
    if (early) { rec.hidden = false; rec.classList.add("partial"); rec.innerHTML = `<b>Submitted early:</b> ${total} of ${S.count} questions answered. ${ASSIGN ? "You can try again from your dashboard to improve your score before the task closes." : "Try again to finish the whole quiz."}`; }
    else if (target) { rec.hidden = false; rec.innerHTML = `<b>Practise next:</b> ${target.label}`; }
    else if (S.level !== lastLevel() && pct >= 80 && !ASSIGN) { const nx = LEVEL_KEYS[LEVEL_KEYS.indexOf(S.level) + 1]; rec.hidden = false; rec.innerHTML = `<b>Ready for more?</b> Try ${C.esc(LEVEL_NAME[nx])}.`; }
    else rec.hidden = true;
    const X = xpFor(pct, S.level);
    const xpEarned = window.MMTSubmit && window.MMTSubmit.scaleXP ? window.MMTSubmit.scaleXP(X.xp) : X.xp;
    $("certXP").textContent = `XP earned: ${xpEarned}`;
    $("changeLvlBtn").hidden = ASSIGN;
    const db = $("dashBtn"); if (db) db.hidden = !ASSIGN;
    openModal("certModal");
    if (pct >= 80 && !earlyDone) confetti(1);
    /* No typed answer is ever in the payload — only marks per question type. */
    const types = rows.map(([id, e]) => ({ typeId: id, label: e.label, correct: e.ok, total: e.total }))
      .concat(["level:" + S.level]);
    if (ASSIGN) types.push("assigned:yes");
    if (window.MMTSave) window.MMTSave({
      tool: BANK.tool, topic: BANK.title,
      level: LEVEL_NAME[S.level], levelKey: S.level,
      score, total, percent: pct,
      xpEarned, baseXP: X.base, xpMultiplier: X.mult,
      masteryTopic: BANK.mastery, types,
      assignmentMode: ASSIGN,
      // Always present (empty when opened as a whole quiz), so the portals can tell
      // an attempt made from a task's own link from one made any other way.
      assignmentId: ASSIGN ? (PARAMS.get("aid") || "") : "",
      platformVersion: "mmt-topic-quiz-v2",
      certificateText: `${BANK.title} — ${LEVEL_NAME[S.level]}: ${score}/${total}`,
      ...(window.MMTSubmit && window.MMTSubmit.fields ? window.MMTSubmit.fields() : {})
    });
  }
  function copyResult() {
    const total = S.qs.length, score = S.recs.filter(r => r && r.ok).length;
    const lines = [`${BANK.title} — ${LEVEL_NAME[S.level]}`, `Score: ${score}/${total}`, ""];
    S.qs.forEach((q, k) => lines.push(`Q${k + 1}: ${S.recs[k] && S.recs[k].ok ? "Correct" : "Incorrect"} — ${q.label}`));
    if (window.MMTAuth && window.MMTAuth.shareLine) lines.push("", window.MMTAuth.shareLine());
    try { navigator.clipboard.writeText(lines.join("\n")); $("copyBtn").textContent = "Copied ✓"; setTimeout(() => $("copyBtn").textContent = "Copy my result", 1400); } catch (e) {}
  }

  /* ======================= Start screen (student) ===================
     The level, question types and how many questions on one page, before the
     quiz. The page itself is the shared component start-screen.js (the shell
     loads it and start-screen.css before this file); this only hands it the
     bank and says what Start and "Back to my quiz" do. */
  function openModal(id) { const m = $(id); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); }
  function closeModal(id) { const m = $(id); m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  let SS = null;
  function startScreen() {
    if (SS) return SS;
    const m = /^MA(\d)/.exec(BANK.outcome || ""), stage = m ? `Stage ${m[1]}` : "";
    SS = window.MMTStartScreen.create({
      before: $("quizMain"),
      prefsId: BANK.id,
      eyebrow: [stage, BANK.stageNote, "Whole-topic quiz", BANK.outcome].filter(Boolean).join(" · "),
      title: BANK.title,
      lead: BANK.secondTry ? "Choose a level, then start. If you miss a question, you get one more go. Tap Read aloud to hear a question." : undefined,
      counts: [5, 10, 15, 20, 30], defaultCount: BANK.defaultCount || DEFAULT_COUNT,
      levels: () => LEVEL_KEYS.map(l => ({ key: l, cls: levelCls(l), name: LEVEL_NAME[l], sub: (BANK.levels[l] || {}).sub || "", types: typesFor(l).map(t => ({ id: t.id, html: t.label })) })),
      onStart: (level, ids, n) => start(level, ids, n),
      onResume: hideStart
    });
    return SS;
  }
  function showStart() {
    closeModal("certModal");
    const inQuiz = !!(S.qs.length && !S.done);
    startScreen().show({ inQuiz });
    $("quizMain").hidden = true;
    $("menuBtn").hidden = true;
    $("lvlChip").hidden = true;
    if (!inQuiz) $("progressFill").style.width = "0";
    document.body.classList.add("onStart");
  }
  function hideStart() {
    if (SS) SS.hide();
    document.body.classList.remove("onStart");
    $("menuBtn").hidden = ASSIGN;
    $("quizMain").hidden = false;
    chipLevel(); progress();
  }

  /* ======================= Teacher link builder ===================== */
  function initBuilder() {
    const ov = $("teacherBuilderOverlay");
    ov.classList.add("open");
    $("builderTitle").textContent = `${BANK.title} — create a student quiz link`;
    const sel = $("builderLevel"), types = $("builderTypes"), cnt = $("builderCount"), out = $("assignmentLinkOut");
    // One toggle button per level of this bank (the Teacher Platform drives .levelToggleBtn[data-level]).
    const tog = ov.querySelector(".levelToggle");
    if (tog) { tog.innerHTML = LEVEL_KEYS.map(l => `<button class="levelToggleBtn" type="button" data-level="${l}">${C.esc(LEVEL_NAME[l])}</button>`).join(""); tog.style.gridTemplateColumns = `repeat(${LEVEL_KEYS.length},1fr)`; }
    sel.innerHTML = LEVEL_KEYS.map(l => `<option value="${l}">${C.esc(LEVEL_NAME[l])}</option>`).join("");
    const btns = [...ov.querySelectorAll(".levelToggleBtn")];
    const summary = () => {
      const boxes = [...types.querySelectorAll("input[type=checkbox]")], on = boxes.filter(b => b.checked).length;
      $("builderSummary").textContent = `${on} of ${boxes.length} selected`;
      $("builderToggleAllBtn").textContent = on === boxes.length ? "Deselect all" : "Select all";
    };
    const renderTypes = () => {
      types.innerHTML = typesFor(sel.value).map(t => `<label class="builderChk"><input type="checkbox" value="${t.id}" checked><span>${t.label}</span></label>`).join("");
      types.querySelectorAll("input").forEach(i => i.addEventListener("change", () => { summary(); out.value = ""; $("builderWarn").hidden = true; }));
      summary();
    };
    const setLevel = l => { sel.value = l; btns.forEach(b => b.classList.toggle("active", b.dataset.level === l)); renderTypes(); out.value = ""; $("builderWarn").hidden = true; };
    btns.forEach(b => b.addEventListener("click", () => setLevel(b.dataset.level)));
    sel.addEventListener("change", () => setLevel(sel.value));
    cnt.addEventListener("input", () => { out.value = ""; });
    $("builderToggleAllBtn").addEventListener("click", () => { const boxes = [...types.querySelectorAll("input")]; const all = boxes.every(b => b.checked); boxes.forEach(b => b.checked = !all); summary(); out.value = ""; });
    const generate = () => {
      const ids = [...types.querySelectorAll("input:checked")].map(b => b.value);
      if (!ids.length) { $("builderWarn").hidden = false; return; }
      let n = Math.round(Number(cnt.value) || BANK.defaultCount || DEFAULT_COUNT); n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, n)); cnt.value = String(n);
      const u = new URL(location.href); u.search = ""; u.hash = "";
      u.searchParams.set("assignment", "1"); u.searchParams.set("level", sel.value);
      u.searchParams.set("types", ids.join(",")); u.searchParams.set("count", String(n));
      u.searchParams.set("aid", "TQ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase());
      out.value = u.toString();
    };
    $("generateAssignmentBtn").addEventListener("click", generate);
    $("copyAssignmentBtn").addEventListener("click", async () => {
      if (!out.value) generate(); if (!out.value) return;
      try { await navigator.clipboard.writeText(out.value); $("copyAssignmentBtn").textContent = "Copied ✓"; setTimeout(() => $("copyAssignmentBtn").textContent = "Copy link", 1300); }
      catch (e) { out.focus(); out.select(); }
    });
    $("resetBuilderBtn").addEventListener("click", () => { setLevel(lastLevel()); cnt.value = String(BANK.defaultCount || DEFAULT_COUNT); });
    $("builderPreview").addEventListener("click", () => { if (!out.value) generate(); if (out.value) window.open(out.value, "_blank", "noopener"); });
    setLevel(lastLevel());
  }

  /* ======================= Confetti ================================ */
  const COLOURS = ["#2563eb", "#22c55e", "#f59e0b", "#ec4899", "#7c3aed", "#ef4444", "#14b8a6"];
  function confetti(scale) {
    if (reduceMotion) return;
    const host = document.createElement("div"); host.className = "confetti"; host.setAttribute("aria-hidden", "true"); document.body.appendChild(host);
    const W = innerWidth, H = innerHeight, bits = [], n = Math.round(50 * (scale || 1));
    for (let k = 0; k < n; k++) {
      const e = document.createElement("i"), size = 6 + Math.random() * 7;
      e.style.cssText = `position:absolute;top:0;left:0;width:${size}px;height:${size * .6}px;background:${COLOURS[k % COLOURS.length]};border-radius:${Math.random() < .3 ? "50%" : "2px"}`;
      host.appendChild(e);
      bits.push({ e, x: W * (.15 + Math.random() * .7), y: -20 - Math.random() * H * .3, vx: (Math.random() - .5) * 2.2, vy: 2.6 + Math.random() * 3.4, r: Math.random() * 360, vr: (Math.random() - .5) * 18 });
    }
    const t0 = performance.now();
    (function f(now) {
      let alive = false;
      bits.forEach(b => { b.x += b.vx; b.y += b.vy; b.vy += .05; b.r += b.vr; if (b.y < H + 30) alive = true; b.e.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.r}deg)`; });
      if (alive && now - t0 < 4000) requestAnimationFrame(f); else host.remove();
    })(t0);
  }

  /* ======================= Boot ===================================== */
  function wire() {
    $("checkBtn").addEventListener("click", submit);
    $("skipBtn").addEventListener("click", skip);
    $("nextBtn").addEventListener("click", next);
    $("prevBtn").addEventListener("click", prev);
    $("menuBtn").addEventListener("click", showStart);
    $("againBtn").addEventListener("click", () => start(S.level, S.typeIds, S.count));
    $("changeLvlBtn").addEventListener("click", showStart);
    $("copyBtn").addEventListener("click", copyResult);
    const tb = $("toolsBtn"), tm = $("toolsMenu");
    if (tb && tm) {
      tb.addEventListener("click", e => { e.stopPropagation(); const o = !tm.classList.contains("open"); tm.classList.toggle("open", o); tb.setAttribute("aria-expanded", String(o)); });
      document.addEventListener("click", () => { tm.classList.remove("open"); tb.setAttribute("aria-expanded", "false"); });
    }
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" || BUILDER || isAuthOpen() || document.querySelector(".modalBack.open") || document.body.classList.contains("onStart")) return;
      if (e.target && e.target.id === "ans") return;
      if (S.qs.length && S.recs[S.i] && !S.done) { e.preventDefault(); next(); }
    });
  }

  function paintShell() {
    document.title = `${BANK.title} — Whole-topic Quiz | Mills Maths Tools`;
    $("topTitle").textContent = `${BANK.title} — Whole-topic Quiz`;
    $("outcomeTag").textContent = BANK.outcome;
    const tm = $("toolsMenu");
    if (tm) {
      const rel = (BANK.related || []);
      if (!rel.length) $("toolsWrap").hidden = true;
      else tm.innerHTML = rel.map(r => `<a class="toolLink" href="${r.href}">${r.label}<small>${r.small || ""}</small></a>`).join("");
    }
  }

  function loadAuth() {
    const s = document.createElement("script");
    s.src = "/portal/shared/quizAuthUI.js?v=5a88072e";
    document.body.appendChild(s);
    import("/portal/shared/earlySubmit.js").then(m => {
      const MS = m.MMTSubmit;
      MS.register({
        progress: () => ({ attempted: S.recs.filter(Boolean).length, correct: S.recs.filter(r => r && r.ok).length, quizLength: S.qs.length }),
        finish: () => finish()
      });
    }).catch(e => console.warn("Early submit unavailable:", e && e.message));
  }

  /* A task link is the whole of what the student may do: no level menu, no other
     quizzes, no way back to the open quiz from inside the page. (The portals also
     only count attempts made from the task's own link.) */
  function lockToTask() {
    document.body.classList.add("assignMode");
    $("assignNote").hidden = false;
    $("menuBtn").hidden = true;
    $("changeLvlBtn").hidden = true;
    const tw = $("toolsWrap"); if (tw) tw.hidden = true;
    const brand = document.querySelector(".mmtBrand");
    if (brand) { brand.removeAttribute("href"); brand.setAttribute("aria-disabled", "true"); brand.style.pointerEvents = "none"; }
    const foot = document.querySelector(".brandFoot"); if (foot) foot.hidden = true;
  }

  function run(bank) {
    BANK = bank;
    if (bank.young) document.body.classList.add("young");
    setupLevels();
    paintShell();
    wire();
    if (BUILDER) { document.body.classList.add("builderMode"); initBuilder(); return; }
    loadAuth();
    if (ASSIGN) {
      let level = (PARAMS.get("level") || LEVEL_KEYS[0]).toLowerCase(); if (!LEVEL_KEYS.includes(level)) level = LEVEL_KEYS[0];
      const valid = new Set(typesFor(level).map(t => t.id));
      let ids = (PARAMS.get("types") || "").split(",").map(s => s.trim()).filter(id => valid.has(id));
      if (!ids.length) ids = [...valid];
      let n = Math.round(Number(PARAMS.get("count")) || DEFAULT_COUNT); n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, n));
      lockToTask();
      start(level, ids, n);
    } else {
      showStart();
    }
  }

  window.MMTQ = { run, grid, drawDiagram, core: C, _state: S, _check: q => C.check, _start: (l, ids, n) => start(l, ids, n) };
})();
