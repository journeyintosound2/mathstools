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
  const DEFAULT_COUNT = 15, MIN_COUNT = 5, MAX_COUNT = 60;

  let BANK = null;
  const S = { level: null, typeIds: [], count: DEFAULT_COUNT, qs: [], recs: [], i: 0, mcPick: null, plotPt: null, done: false };

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
  function typesFor(level) { return BANK.types.filter(t => t.level === level); }
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
    ch.hidden = false; ch.textContent = LEVEL_NAME[S.level]; ch.className = "lvlChip " + S.level;
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

  function previewHTML(q, v) {
    if (!v.trim()) return "";
    if (q.mode === "mono") return "= " + C.prettyPowers(v.replace(/\s*[x*]\s*/gi, " × "));
    if (q.mode === "pi") return "= " + C.esc(v).replace(/pi/gi, "π");
    return "";
  }

  function showQuestion() {
    const q = S.qs[S.i], rec = S.recs[S.i];
    S.mcPick = rec ? rec.input : null; S.plotPt = rec && q.mode === "plot" ? rec.input : null;
    $("qType").textContent = q.label;
    $("qPrompt").innerHTML = q.prompt;
    const dh = $("qDiagram");
    const body = $("qBody");
    body.classList.toggle("hasDiag", !!q.diagram || q.mode === "plot");
    dh.hidden = !q.diagram && q.mode !== "plot";
    if (q.mode === "plot") {
      dh.innerHTML = "";
      const g = grid(Object.assign({}, q.grid || {}, { interactive: !rec, onPick: (x, y) => { S.plotPt = [x, y]; $("plotRead").textContent = `Your point: (${C.fmt(x)}, ${C.fmt(y)})`; clearNudge(); } }));
      dh.appendChild(g);
      if (rec) { g.setPoint && g.setPoint(rec.input); }
      dh._grid = g;
    } else drawDiagram(dh, q.diagram);

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
    } else if (q.mode === "plot") {
      const p = document.createElement("div"); p.className = "plotRead"; p.id = "plotRead";
      p.textContent = rec ? `Your point: (${C.fmt(rec.input[0])}, ${C.fmt(rec.input[1])})` : "Click the grid to place your point.";
      const row = document.createElement("div"); row.className = "inRow"; row.appendChild(p); row.appendChild(chk);
      area.appendChild(row);
    } else {
      const row = document.createElement("div"); row.className = "inRow";
      row.innerHTML = `<label class="inLab" for="ans">Answer</label>${q.pre ? `<span class="aff">${q.pre}</span>` : ""}<input id="ans" class="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${q.mode === "num" && !q.keys ? "decimal" : "text"}" placeholder="${C.esc(q.placeholder || "")}">${q.unit ? `<span class="aff">${q.unit}</span>` : ""}`;
      area.appendChild(row);
      const keys = q.keys || (q.mode === "pi" ? ["π"] : q.mode === "mono" ? ["^", "×"] : q.mode === "ratio" ? [":"] : q.mode === "coord" ? ["(", ",", ")", "−"] : q.mode === "linear" ? ["=", "+", "−", "x"] : null);
      if (keys) {
        const kb = document.createElement("div"); kb.className = "keys"; kb.setAttribute("aria-label", "Symbol keys");
        keys.forEach(k => { const b = document.createElement("button"); b.type = "button"; b.className = "key"; b.textContent = k; b.title = "Type " + k; b.addEventListener("mousedown", e => e.preventDefault()); b.addEventListener("click", () => { const inp = $("ans"); if (inp && !inp.disabled) insertAtCaret(inp, k === "−" ? "-" : k); }); kb.appendChild(b); });
        row.appendChild(kb);
      }
      row.appendChild(chk);
      const pv = document.createElement("div"); pv.className = "preview"; pv.id = "preview"; area.appendChild(pv);
      const inp = $("ans");
      inp.addEventListener("input", () => { clearNudge(); pv.innerHTML = previewHTML(q, inp.value); });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); S.recs[S.i] ? next() : submit(); } });
      if (rec) { inp.value = rec.input == null ? "" : rec.input; pv.innerHTML = previewHTML(q, inp.value); }
    }
    clearNudge();
    paintFeedback();
    progress();
    if (!rec && !reduceMotion) { const card = $("qCard"); card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop"); }
    const inp = $("ans");
    if (inp && !rec && !document.querySelector(".modalBack.open") && !isAuthOpen()) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 30);
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
    return "";
  }

  function paintFeedback() {
    const q = S.qs[S.i], r = S.recs[S.i];
    const fb = $("feedback");
    const area = $("answerArea");
    const check = $("checkBtn"), skip = $("skipBtn"), nxt = $("nextBtn");
    $("prevBtn").disabled = S.i === 0;
    if (!r) {
      fb.hidden = true; fb.className = "feedback";
      check.hidden = false; skip.hidden = false; nxt.hidden = true;
      check.hidden = q.mode === "mc" || q.mode === "tf";
      return;
    }
    check.hidden = true; skip.hidden = true; nxt.hidden = false;
    nxt.textContent = S.i === S.qs.length - 1 ? "Finish ✓" : "Next →";
    fb.hidden = false;
    fb.className = "feedback " + (r.ok ? "good" : "bad");
    const head = r.ok ? pickPraise() : r.skipped ? "Skipped — here is the answer" : r.swapped ? "Not quite — check the order: x first, then y" : "Not quite";
    fb.innerHTML = `<div class="fbHead">${r.ok ? "✓" : "✕"} ${head}</div>` +
      (r.ok ? "" : `<div class="fbAns">Answer: <b>${answerText(q)}</b></div>`) +
      (q.why ? `<div class="fbWhy">${q.why}</div>` : "");
    const inp = $("ans"); if (inp) { inp.disabled = true; inp.classList.add(r.ok ? "good" : "bad"); }
    area.querySelectorAll(".key").forEach(k => k.disabled = true);
    if (q.mode === "mc") area.querySelectorAll(".choice").forEach((b, k) => { b.disabled = true; b.classList.toggle("good", k === q.correct); b.classList.toggle("bad", k === r.input && !r.ok); b.classList.toggle("sel", k === r.input); });
    if (q.mode === "tf") area.querySelectorAll(".choice").forEach(b => { const v = b.dataset.v === "true"; b.disabled = true; b.classList.toggle("good", v === q.truth); b.classList.toggle("bad", v === r.input && !r.ok); });
    if (q.mode === "plot") { const g = $("qDiagram")._grid; g && g.markAnswer && g.markAnswer(r.input, r.ok, [q.x, q.y]); }
  }
  const PRAISE = ["Correct!", "Nice work!", "Spot on!", "Yes!", "That’s it!", "Great thinking!"];
  const pickPraise = () => C.pick(PRAISE);

  function readInput(q) {
    if (q.mode === "mc" || q.mode === "tf") return S.mcPick;
    if (q.mode === "plot") return S.plotPt;
    const inp = $("ans"); return inp ? inp.value : "";
  }
  function submit() {
    if (S.recs[S.i]) return;
    const q = S.qs[S.i];
    const input = readInput(q);
    if (q.mode !== "mc" && q.mode !== "tf" && q.mode !== "plot" && !String(input).trim()) { nudge("Type your answer first — or press Skip."); return; }
    const res = C.check(q, input);
    if (res.nudge) { nudge(res.nudge); const inp = $("ans"); if (inp) inp.focus(); return; }
    S.recs[S.i] = { ok: !!res.ok, input, swapped: !!res.swapped, type: q.type, label: q.label };
    if (res.ok) confetti(0.55);
    if (window.MMTSubmit && window.MMTSubmit.refresh) window.MMTSubmit.refresh();
    showQuestion();
    $("nextBtn").focus({ preventScroll: true });
  }
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
    S.qs = buildPaper(level, typeIds, count); S.recs = []; S.i = 0; S.done = false;
    try { if (window.MMTSubmit && window.MMTSubmit.reset) window.MMTSubmit.reset(); } catch (e) {}
    closeModal("levelModal"); closeModal("typesModal"); closeModal("certModal");
    chipLevel();
    $("quizMain").hidden = false;
    showQuestion();
  }

  /* ======================= Finish =================================== */
  function xpFor(pct, level) {
    const base = pct >= 100 ? 150 : pct >= 80 ? 75 : pct >= 60 ? 50 : pct >= 40 ? 25 : pct >= 10 ? 15 : 5;
    const mult = level === "expected" ? 1.5 : 1;
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
    else if (S.level === "basic" && pct >= 80 && !ASSIGN) { rec.hidden = false; rec.innerHTML = `<b>Ready for more?</b> Try the Expected level.`; }
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

  /* ======================= Level + types (student) ================== */
  function openModal(id) { const m = $(id); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); }
  function closeModal(id) { const m = $(id); m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  function renderLevels() {
    $("lvlList").innerHTML = ["basic", "expected"].map(l => `
      <button class="lvlCard ${l}" type="button" data-level="${l}">
        <span class="lvlName">${LEVEL_NAME[l]}</span>
        <span class="lvlSub">${BANK.levels[l].sub}</span>
        <span class="lvlMeta">${typesFor(l).length} question types</span>
        <span class="lvlGo">Start →</span>
      </button>`).join("");
    $("lvlList").querySelectorAll(".lvlCard").forEach(b => b.addEventListener("click", () => openTypes(b.dataset.level)));
  }
  let pendingLevel = "basic";
  function openTypes(level) {
    pendingLevel = level;
    closeModal("levelModal");
    $("typesTitle").textContent = `${LEVEL_NAME[level]} — question types`;
    $("typesGrid").innerHTML = typesFor(level).map(t => `<label class="tchk"><input type="checkbox" value="${t.id}" checked><span>${t.label}</span></label>`).join("");
    $("typesWarn").hidden = true;
    $("countInp").value = DEFAULT_COUNT;
    paintTypesToggle();
    openModal("typesModal");
  }
  function paintTypesToggle() {
    const boxes = [...$("typesGrid").querySelectorAll("input")];
    $("typesAll").textContent = boxes.every(b => b.checked) ? "Deselect all" : "Select all";
  }
  function beginFromTypes() {
    const ids = [...$("typesGrid").querySelectorAll("input:checked")].map(b => b.value);
    if (!ids.length) { $("typesWarn").hidden = false; return; }
    let n = Math.round(Number($("countInp").value) || DEFAULT_COUNT); n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, n));
    start(pendingLevel, ids, n);
  }

  /* ======================= Teacher link builder ===================== */
  function initBuilder() {
    const ov = $("teacherBuilderOverlay");
    ov.classList.add("open");
    $("builderTitle").textContent = `${BANK.title} — create a student quiz link`;
    const sel = $("builderLevel"), types = $("builderTypes"), cnt = $("builderCount"), out = $("assignmentLinkOut");
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
      let n = Math.round(Number(cnt.value) || DEFAULT_COUNT); n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, n)); cnt.value = String(n);
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
    $("resetBuilderBtn").addEventListener("click", () => { setLevel("expected"); cnt.value = String(DEFAULT_COUNT); });
    $("builderPreview").addEventListener("click", () => { if (!out.value) generate(); if (out.value) window.open(out.value, "_blank", "noopener"); });
    setLevel("expected");
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
    $("menuBtn").addEventListener("click", () => { renderLevels(); openModal("levelModal"); });
    $("typesBack").addEventListener("click", () => { closeModal("typesModal"); openModal("levelModal"); });
    $("typesAll").addEventListener("click", () => { const boxes = [...$("typesGrid").querySelectorAll("input")]; const all = boxes.every(b => b.checked); boxes.forEach(b => b.checked = !all); paintTypesToggle(); });
    $("typesGrid").addEventListener("change", () => { paintTypesToggle(); $("typesWarn").hidden = true; });
    $("beginBtn").addEventListener("click", beginFromTypes);
    $("againBtn").addEventListener("click", () => start(S.level, S.typeIds, S.count));
    $("changeLvlBtn").addEventListener("click", () => { closeModal("certModal"); renderLevels(); openModal("levelModal"); });
    $("copyBtn").addEventListener("click", copyResult);
    const tb = $("toolsBtn"), tm = $("toolsMenu");
    if (tb && tm) {
      tb.addEventListener("click", e => { e.stopPropagation(); const o = !tm.classList.contains("open"); tm.classList.toggle("open", o); tb.setAttribute("aria-expanded", String(o)); });
      document.addEventListener("click", () => { tm.classList.remove("open"); tb.setAttribute("aria-expanded", "false"); });
    }
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" || BUILDER || isAuthOpen() || document.querySelector(".modalBack.open")) return;
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
    paintShell();
    wire();
    if (BUILDER) { document.body.classList.add("builderMode"); initBuilder(); return; }
    loadAuth();
    if (ASSIGN) {
      let level = (PARAMS.get("level") || "basic").toLowerCase(); if (!LEVEL_NAME[level]) level = "basic";
      const valid = new Set(typesFor(level).map(t => t.id));
      let ids = (PARAMS.get("types") || "").split(",").map(s => s.trim()).filter(id => valid.has(id));
      if (!ids.length) ids = [...valid];
      let n = Math.round(Number(PARAMS.get("count")) || DEFAULT_COUNT); n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, n));
      lockToTask();
      start(level, ids, n);
    } else {
      renderLevels(); openModal("levelModal");
    }
  }

  window.MMTQ = { run, grid, drawDiagram, core: C, _state: S, _check: q => C.check, _start: (l, ids, n) => start(l, ids, n) };
})();
