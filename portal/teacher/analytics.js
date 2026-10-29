/**
 * TEACHER RESULTS & ANALYTICS (2026-10-29) — the "📊 Results & Analytics" tile.
 * Loaded on demand by portal/teacher/index.html (`openResults`), which passes a
 * context object `C` with its live data (all, students, classes, dashAssignments)
 * and helpers (openModal, head, foot, openStudent, esc …). The maths lives in
 * /portal/shared/quizInsights.js (pure, Node-tested); this file only draws.
 *
 * Tabs: Overview · Tasks · Quizzes · Skills · All attempts, plus a QUIZ REPORT
 * view (one quiz, optionally one set task): completion, score spread, where
 * marks were lost (per question type), reteach groups + matching teaching
 * tools, levels, and a student × question-type grid.
 */
import { skillsOf, levelOf, quizKey, quizReport, taskRecords, taskLevel, skillsAcross, windowStats, DAY } from "../shared/quizInsights.js?v=8fbf1a8c";

let C = null;
const A = { tab: "overview", cls: "", win: 28, view: null, taskFilter: "open", sort: { key: "best", dir: 1 }, attempts: { tool: "", q: "" } };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pc = (p) => (p == null ? "" : p >= 70 ? "hi" : p >= 50 ? "mid" : "lo");
const fmtDay = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const fmtShort = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/* ------------------------------------------------------------------ styles */
const CSS = `
.ax-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.ax-top select{min-width:150px}
.ax-tabs{display:flex;gap:4px;background:#f1f5f9;padding:4px;border-radius:12px;margin-bottom:16px;overflow-x:auto}
.ax-tabs button{flex:1 0 auto;appearance:none;border:0;background:transparent;padding:9px 14px;border-radius:9px;font-weight:700;font-size:.88rem;cursor:pointer;color:var(--muted);white-space:nowrap}
.ax-tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.ax-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.ax-kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.ax-kpi .l{font-size:.74rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:700}
.ax-kpi .v{font-size:1.75rem;font-weight:900;margin-top:4px;line-height:1.1}
.ax-kpi .v small{font-size:.9rem;color:var(--muted);font-weight:700}
.ax-kpi .s{font-size:.78rem;color:var(--muted);margin-top:4px}
.ax-delta{display:inline-block;font-size:.72rem;font-weight:800;padding:1px 7px;border-radius:999px;margin-left:6px;vertical-align:3px}
.ax-delta.up{background:#dcfce7;color:#166534}.ax-delta.down{background:#fee2e2;color:#991b1b}.ax-delta.flat{background:#f1f5f9;color:#475569}
.ax-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}
.ax-card h3{margin:0 0 2px;font-size:1.02rem}
.ax-card .hint{margin:0 0 12px;color:var(--muted);font-size:.84rem}
.ax-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ax-grid2>.ax-card{margin-bottom:0}
@media(max-width:760px){.ax-grid2{grid-template-columns:1fr}}
.ax-ins{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ax-ins li{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:#f8fafc;border:1px solid var(--line)}
.ax-ins li.warn{background:#fff7ed;border-color:#fed7aa}.ax-ins li.bad{background:#fef2f2;border-color:#fecaca}.ax-ins li.good{background:#f0fdf4;border-color:#bbf7d0}
.ax-ins .ic{font-size:1.25rem;flex:0 0 auto}.ax-ins .tx{flex:1;font-size:.9rem;min-width:0}.ax-ins .tx b{font-weight:800}
.ax-link{appearance:none;border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 11px;font-weight:700;font-size:.8rem;cursor:pointer;color:var(--mmt-blue);white-space:nowrap;text-decoration:none;display:inline-block}
.ax-link:hover{border-color:var(--mmt-blue)}
.ax-empty{color:var(--muted);font-size:.86rem;padding:14px;text-align:center;background:#f8fafc;border:1px dashed var(--line);border-radius:10px}
.ax-scroll{overflow-x:auto}
.ax-t{width:100%;border-collapse:collapse;font-size:.86rem}
.ax-t th{position:sticky;top:0;background:#fff;text-align:left;color:var(--muted);font-weight:700;font-size:.72rem;text-transform:uppercase;letter-spacing:.03em;padding:8px 9px;border-bottom:1px solid var(--line);white-space:nowrap}
.ax-t th[data-sort]{cursor:pointer}.ax-t th[data-sort]:hover{color:var(--ink)}
.ax-t th .ar{opacity:.55;margin-left:3px}
.ax-t td{padding:8px 9px;border-bottom:1px solid #eef2f7;vertical-align:middle}
.ax-t tr.click{cursor:pointer}.ax-t tr.click:hover td{background:#f8fafc}
.ax-t tr.dim td{color:#94a3b8}
.ax-t td.num,.ax-t th.num{text-align:right}
.ax-t td.nm{white-space:nowrap}
.ax-name{white-space:nowrap;appearance:none;border:0;background:none;padding:0;font:inherit;font-weight:700;color:var(--ink);cursor:pointer;text-align:left}
.ax-name:hover{color:var(--mmt-blue);text-decoration:underline}
.ax-cell{display:inline-block;min-width:44px;text-align:center;font-weight:800;font-size:.8rem;padding:4px 6px;border-radius:7px}
.ax-cell.hi{background:#dcfce7;color:#166534}.ax-cell.mid{background:#fef3c7;color:#92400e}.ax-cell.lo{background:#fee2e2;color:#991b1b}.ax-cell.na{color:#cbd5e1}
.ax-pill{display:inline-block;font-size:.72rem;font-weight:800;padding:2px 9px;border-radius:999px;background:#eef2ff;color:#3730a3;white-space:nowrap}
.ax-pill.ok{background:#dcfce7;color:#166534}.ax-pill.warn{background:#fef3c7;color:#92400e}.ax-pill.bad{background:#fee2e2;color:#991b1b}.ax-pill.mute{background:#f1f5f9;color:#475569}
.ax-bars{display:grid;gap:9px}
.ax-bar{display:grid;grid-template-columns:minmax(120px,38%) 1fr auto;gap:10px;align-items:center;font-size:.86rem}
.ax-bar .lb{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ax-bar .lb small{display:block;font-weight:600;color:var(--muted);font-size:.74rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ax-bar .tr{height:12px;background:#eef2f7;border-radius:999px;overflow:hidden}
.ax-bar .tr>i{display:block;height:100%;border-radius:999px}
.ax-bar .tr>i.hi{background:#22c55e}.ax-bar .tr>i.mid{background:#f59e0b}.ax-bar .tr>i.lo{background:#ef4444}.ax-bar .tr>i.blue{background:var(--mmt-blue)}
.ax-bar .vl{font-weight:800;min-width:92px;text-align:right;font-size:.82rem;color:#334155}
.ax-bar.click{cursor:pointer;border-radius:8px}.ax-bar.click:hover{background:#f8fafc}
.ax-tasks{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.ax-task{text-align:left;appearance:none;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;cursor:pointer;display:flex;flex-direction:column;gap:9px;font:inherit;color:inherit}
.ax-task:hover{border-color:var(--mmt-blue);box-shadow:0 4px 14px rgba(29,78,216,.08)}
.ax-task .tt{font-weight:800;font-size:.95rem;line-height:1.25}
.ax-task .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ax-prog{height:9px;background:#eef2f7;border-radius:999px;overflow:hidden}.ax-prog>i{display:block;height:100%;background:var(--mmt-blue);border-radius:999px}
.ax-task .meta{display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted);gap:8px}
.ax-task .meta b{color:var(--ink)}
.ax-seg{display:inline-flex;background:#f1f5f9;border-radius:10px;padding:3px}
.ax-seg button{appearance:none;border:0;background:transparent;padding:6px 12px;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;color:var(--muted)}
.ax-seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.ax-rhead{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}
.ax-rhead h3{margin:2px 0;font-size:1.25rem}
.ax-rhead .sub{color:var(--muted);font-size:.86rem}
.ax-back{appearance:none;border:0;background:none;color:var(--mmt-blue);font-weight:800;cursor:pointer;padding:0;font-size:.86rem}
.ax-actions{display:flex;gap:8px;flex-wrap:wrap}
.ax-chips{display:flex;gap:6px;flex-wrap:wrap}
.ax-chip{font-size:.8rem;font-weight:700;padding:4px 10px;border-radius:999px;background:#f1f5f9;color:#334155}
.ax-reteach{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.ax-rt{border:1px solid #fecaca;background:#fffafa;border-radius:12px;padding:12px 14px}
.ax-rt .h{display:flex;justify-content:space-between;gap:8px;font-weight:800}
.ax-rt .who{font-size:.82rem;color:#475569;margin:6px 0 8px;line-height:1.45}
.ax-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.ax-spread{display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:8px}
.ax-spread .col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.ax-spread .b{width:100%;max-width:70px;border-radius:8px 8px 3px 3px;min-height:3px}
.ax-spread .n{font-weight:900;font-size:.95rem}.ax-spread .x{font-size:.74rem;color:var(--muted);font-weight:700;text-align:center}
.ax-note{font-size:.78rem;color:var(--muted);margin-top:8px}
.ax-chart{position:relative;height:220px}
.ax-heat td.c{text-align:center;font-weight:800;font-size:.8rem}
.ax-backstu{appearance:none;border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 11px;font-weight:700;font-size:.82rem;cursor:pointer;margin-right:auto;margin-left:12px}
.ax-tools .ax-link{white-space:normal;text-align:left}
@media(max-width:600px){.ax-kpis{grid-template-columns:1fr 1fr}.ax-kpi{padding:12px}.ax-tabs{flex-wrap:wrap}.ax-tabs button{flex:1 1 30%;padding:8px 6px;font-size:.82rem}.ax-bar{grid-template-columns:1fr auto}.ax-bar .tr{grid-column:1/-1;grid-row:2}.ax-kpi .v{font-size:1.45rem}}
`;
function injectCss() { if (!document.getElementById("axCss")) { const s = document.createElement("style"); s.id = "axCss"; s.textContent = CSS; document.head.appendChild(s); } }

/* ------------------------------------------------------------------ data helpers */
const toolsById = () => { const m = new Map(); (C.getAllTools ? C.getAllTools() : C.getEnabledTools()).forEach((t) => m.set(t.toolId, t)); return m; };
function quizTitle(qk, rec) {
  const t = toolsById().get(qk);
  const raw = t ? t.title : (rec && rec.tool) || String(qk).replace(/^tool:/, "");
  return raw.replace(/\s*[—-]\s*Student Quiz$/i, "").replace(/\s+Student Quiz$/i, "");
}
const quizUrl = (qk) => { const t = toolsById().get(qk); return t ? t.launchUrl : ""; };
function rosterOf(cls) {
  return C.students.filter((s) => !cls || (s.className || "") === cls)
    .map((s) => ({ code: s.studentCode || s.id, name: s.name || s.studentName || s.studentCode, className: s.className || "" }));
}
function inWindow(r, win) { return !win || r.time >= Date.now() - win * DAY; }
function scopeRecs() { return C.all.filter((r) => (!A.cls || r.className === A.cls) && inWindow(r, A.win)); }
function prevRecs() { if (!A.win) return null; const now = Date.now(), a = now - 2 * A.win * DAY, b = now - A.win * DAY; return C.all.filter((r) => (!A.cls || r.className === A.cls) && r.time >= a && r.time < b); }
function tasksInScope() { return C.dashAssignments.filter((t) => !A.cls || (t.className || "") === A.cls); }
function taskState(t) {
  const now = Date.now();
  if (!t.dueAt) return { key: "open", label: "No due date", cls: "mute" };
  if (now > t.dueAt) return { key: "closed", label: "Closed " + fmtShort(t.dueAt), cls: "mute" };
  const days = (t.dueAt - now) / DAY;
  return { key: "open", label: "Due " + fmtDay(t.dueAt), cls: days <= 2 ? "bad" : days <= 7 ? "warn" : "" };
}
const taskTitle = (t) => (t.title ? t.title.replace(/\s*[—-]\s*Student Quiz$/i, "") : quizTitle(t.toolId));
function taskReport(t) { return quizReport(taskRecords(t, C.all), rosterOf(t.className || "")); }
function copy(text, btn) { try { navigator.clipboard.writeText(text); } catch (e) {} if (btn) { const o = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = o), 1300); } }
function delta(cur, prev, unit = "") {
  if (prev == null) return "";
  const d = Math.round(cur - prev); const cls = d > 0 ? "up" : d < 0 ? "down" : "flat";
  return `<span class="ax-delta ${cls}" title="Compared with the ${A.win} days before">${d > 0 ? "▲" : d < 0 ? "▼" : "•"} ${Math.abs(d)}${unit}</span>`;
}

/* ------------------------------------------------------------------ shell */
export function openAnalytics(ctx, opts = {}) {
  C = ctx; injectCss();
  if (!opts.keepState) { A.tab = "overview"; A.cls = ""; A.win = 28; A.view = null; }
  C.openModal(C.head("📊 Results &amp; Analytics") + `
    <div class="modal-body">
      <div class="ax-tabs" id="axTabs" role="tablist">
        ${[["overview", "🏠 Overview"], ["tasks", "🎯 Tasks"], ["quizzes", "📝 Quizzes"], ["skills", "🧩 Skills"], ["attempts", "📋 All attempts"]]
          .map(([k, l]) => `<button type="button" data-tab="${k}" class="${A.tab === k ? "on" : ""}">${l}</button>`).join("")}
      </div>
      <div class="ax-top" id="axTop">
        <select id="axCls" aria-label="Class"><option value="">All my classes</option>${C.classes.map((c) => `<option ${c === A.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
        <select id="axWin" aria-label="Time window">${[[7, "Last 7 days"], [28, "Last 28 days"], [90, "Last term (90 days)"], [0, "All time"]].map(([v, l]) => `<option value="${v}" ${v === A.win ? "selected" : ""}>${l}</option>`).join("")}</select>
      </div>
      <div id="axBody"></div>
    </div>${C.foot("")}`, true);
  C.modalEl.classList.add("analytics");
  $("axTabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (!b) return; A.tab = b.dataset.tab; A.view = null; paintTabs(); render(); });
  $("axCls").addEventListener("change", () => { A.cls = $("axCls").value; if (A.view && A.view.task) A.view = null; render(); });
  $("axWin").addEventListener("change", () => { A.win = Number($("axWin").value); render(); });
  C.setRefresh(() => render());
  // toolLinks.js (teaching tools for "Reteach") may still be loading: redraw a report when it lands.
  if (C.syllabusReady) C.syllabusReady.then(() => { if (A.view && $("axBody")) render(); });
  render();
}
function paintTabs() { [...$("axTabs").children].forEach((b) => b.classList.toggle("on", b.dataset.tab === A.tab && !A.view)); }
function destroyCharts() { for (const k of Object.keys(C.tCharts)) if (k.startsWith("ax")) { try { C.tCharts[k].destroy(); } catch (e) {} delete C.tCharts[k]; } }
function render() {
  if (!$("axBody")) return;
  destroyCharts(); paintTabs();
  const win = $("axWin"); if (win) win.style.display = (A.view && A.view.task) || (!A.view && A.tab === "tasks") ? "none" : "";
  const body = $("axBody");
  if (A.view) { renderReport(body); return; }
  ({ overview: renderOverview, tasks: renderTasks, quizzes: renderQuizzes, skills: renderSkills, attempts: renderAttempts })[A.tab](body);
}
function openReport(view) { A.view = view; render(); const b = C.modalEl.querySelector(".modal-body"); if (b) b.scrollTop = 0; }
function openStudentFromAnalytics(code) {
  C.openStudent(code);
  const h = C.modalEl.querySelector(".modal-head");
  if (h && !h.querySelector(".ax-backstu")) {
    const b = document.createElement("button"); b.type = "button"; b.className = "ax-backstu"; b.textContent = "← Back to results";
    b.addEventListener("click", () => openAnalytics(C, { keepState: true }));
    h.insertBefore(b, h.querySelector("[data-close]"));
  }
}

/* ------------------------------------------------------------------ OVERVIEW */
function renderOverview(body) {
  const recs = scopeRecs(), prev = prevRecs(), roster = rosterOf(A.cls);
  const cur = windowStats(recs, roster.length), pv = prev ? windowStats(prev, roster.length) : null;
  const open = tasksInScope().filter((t) => taskState(t).key === "open");
  let need = 0, done = 0; open.forEach((t) => { const r = taskReport(t); need += r.roster; done += r.started; });
  body.innerHTML = `
    <div class="ax-kpis">
      <div class="ax-kpi"><div class="l">Attempts</div><div class="v">${cur.attempts.toLocaleString()}${pv ? delta(cur.attempts, pv.attempts) : ""}</div><div class="s">${A.win ? `in the last ${A.win} days` : "all time"}</div></div>
      <div class="ax-kpi"><div class="l">Active students</div><div class="v">${cur.active}<small> / ${roster.length}</small>${pv ? delta(cur.active, pv.active) : ""}</div><div class="s">${cur.participation}% of ${A.cls ? esc(A.cls) : "your students"} did something</div></div>
      <div class="ax-kpi"><div class="l">Average score</div><div class="v pct ${pc(cur.avg)}">${cur.attempts ? cur.avg + "%" : "—"}${pv && pv.attempts && cur.attempts ? delta(cur.avg, pv.avg, "%") : ""}</div><div class="s">across every attempt</div></div>
      <div class="ax-kpi"><div class="l">Open tasks</div><div class="v">${open.length}</div><div class="s">${need ? `${done} of ${need} student-tasks started (${Math.round((done / need) * 100)}%)` : "nothing open right now"}</div></div>
    </div>
    <div class="ax-card"><h3>Worth a look</h3><p class="hint">Picked out from your tasks and results — click one to open it.</p><ul class="ax-ins" id="axIns"></ul></div>
    <div class="ax-card"><h3>Activity</h3><p class="hint" id="axActHint"></p><div class="ax-chart"><canvas id="axAct"></canvas></div></div>
    <div class="ax-card"><h3>Needs attention</h3><p class="hint">Students averaging under 50%, with a recent drop, quiet for two weeks, or yet to start a task that is due within a week or has closed. Most pressing first.</p><div id="axNeed"></div></div>
    ${A.cls ? "" : `<div class="ax-card"><h3>Class comparison</h3><p class="hint">Each class over the same window.</p><div class="ax-scroll" id="axClasses"></div></div>`}`;
  renderInsights(recs, open);
  renderActivity(recs);
  renderNeeds(recs, roster, open);
  if (!A.cls) renderClassCompare();
}
function renderInsights(recs, open) {
  const items = [];
  // set tasks: not started, due soon / just closed / all done
  tasksInScope().forEach((t) => {
    const st = taskState(t), rep = taskReport(t), miss = rep.notStarted.length, title = taskTitle(t);
    const days = t.dueAt ? (t.dueAt - Date.now()) / DAY : null;
    if (!rep.roster) return;
    if (st.key === "open" && miss && (days == null || days <= 7)) items.push({ w: 100 - (days ?? 30), cls: days != null && days <= 2 ? "bad" : "warn", ic: "⏰", tx: `<b>${miss} of ${rep.roster}</b> in ${esc(t.className)} haven't started <b>${esc(title)}</b>${t.dueAt ? ` — due ${fmtDay(t.dueAt)}` : ""}.`, act: () => openReport({ quiz: t.toolId, task: t.id }) });
    else if (st.key === "closed" && miss && Date.now() - t.dueAt < 14 * DAY) items.push({ w: 60, cls: "bad", ic: "📭", tx: `<b>${esc(title)}</b> (${esc(t.className)}) closed ${fmtShort(t.dueAt)} — <b>${miss}</b> never started.`, act: () => openReport({ quiz: t.toolId, task: t.id }) });
    else if (!miss && st.key === "open") items.push({ w: 20, cls: "good", ic: "🎉", tx: `Everyone in ${esc(t.className)} has done <b>${esc(title)}</b>${rep.avgBest != null ? ` — class average best ${rep.avgBest}%` : ""}.`, act: () => openReport({ quiz: t.toolId, task: t.id }) });
    if (rep.hasSkills) { const k = rep.skills[0]; if (k && k.rate < 60 && k.students >= 3) items.push({ w: 70 - k.rate / 2, cls: "warn", ic: "🧩", tx: `In <b>${esc(title)}</b> (${esc(t.className)}), <b>${esc(k.label)}</b> is the sticking point — ${k.rate}% correct, ${k.below.length} student${k.below.length === 1 ? "" : "s"} under 50%.`, act: () => openReport({ quiz: t.toolId, task: t.id }) });
    }
  });
  // weakest skill across everything in the window (not already covered by a task)
  const across = skillsAcross(recs, quizTitle).filter((k) => k.students >= 4);
  const wk = across[0];
  if (wk && wk.rate < 60 && !items.some((i) => i.tx.includes(esc(wk.label)))) items.push({ w: 55, cls: "warn", ic: "📉", tx: `Weakest skill ${A.win ? "this period" : "overall"}: <b>${esc(wk.label)}</b> in ${esc(wk.quizTitle)} — ${wk.rate}% correct across ${wk.students} students.`, act: () => openReport({ quiz: wk.quiz }) });
  // biggest improvement by retrying
  let bestGain = null;
  const byQuiz = new Map(); recs.forEach((r) => { const k = quizKey(r); if (!byQuiz.has(k)) byQuiz.set(k, []); byQuiz.get(k).push(r); });
  for (const [qk, rs] of byQuiz) { const rep = quizReport(rs, []); rep.students.forEach((s) => { if (s.gain != null && s.gain >= 20 && (!bestGain || s.gain > bestGain.s.gain)) bestGain = { s, qk }; }); }
  if (bestGain) items.push({ w: 25, cls: "good", ic: "🚀", tx: `<b>${esc(bestGain.s.name)}</b> lifted ${esc(quizTitle(bestGain.qk))} from ${bestGain.s.first}% to ${bestGain.s.best}% by having another go.`, act: () => openStudentFromAnalytics(bestGain.s.code) });
  // gone quiet
  const quiet = quietStudents(rosterOf(A.cls));
  if (quiet.length >= 2) items.push({ w: 40, cls: "", ic: "💤", tx: `<b>${quiet.length} students</b> haven't done anything for 2 weeks (they had before).`, act: () => document.getElementById("axNeed")?.scrollIntoView({ behavior: "smooth", block: "start" }) });
  const el = $("axIns");
  if (!items.length) { el.outerHTML = `<div class="ax-empty">Nothing stands out right now. Set a task or let a few more results come in.</div>`; return; }
  items.sort((a, b) => b.w - a.w);
  el.innerHTML = items.slice(0, 6).map((it, i) => `<li class="${it.cls}"><span class="ic">${it.ic}</span><span class="tx">${it.tx}</span><button class="ax-link" type="button" data-i="${i}">Open</button></li>`).join("");
  el.querySelectorAll("button[data-i]").forEach((b) => b.addEventListener("click", () => items[Number(b.dataset.i)].act()));
}
function quietStudents(roster) {
  const cut = Date.now() - 14 * DAY;
  return roster.filter((s) => { const rs = C.all.filter((r) => r.studentCode === s.code); return rs.length && !rs.some((r) => r.time >= cut); });
}
function renderActivity(recs) {
  const now = Date.now(); const daily = A.win && A.win <= 31; const step = daily ? DAY : 7 * DAY;
  const earliest = A.win ? now - A.win * DAY : (recs.length ? Math.min(...recs.map((r) => r.time || now)) : now - 28 * DAY);
  const n = daily ? A.win : Math.max(1, Math.min(54, Math.ceil((now - earliest) / step) + 1));
  const d = new Date(); d.setHours(0, 0, 0, 0); const start = d.getTime() - (n - 1) * step;
  const labels = [], att = [], act = [];
  for (let i = 0; i < n; i++) { const a = start + i * step, b = a + step; const rs = recs.filter((r) => r.time >= a && r.time < b); labels.push(fmtShort(a)); att.push(rs.length); act.push(new Set(rs.map((r) => r.studentCode)).size); }
  $("axActHint").textContent = `Attempts and students active ${A.win ? `over the last ${A.win} days` : "all time"}, by ${daily ? "day" : "week"}.`;
  if (typeof Chart === "undefined") return;
  C.tCharts.axAct = new Chart($("axAct").getContext("2d"), {
    data: { labels, datasets: [
      { type: "bar", label: "Attempts", data: att, backgroundColor: "#93c5fd", borderRadius: 4, order: 2 },
      { type: "line", label: "Students active", data: act, borderColor: "#1d4ed8", backgroundColor: "#1d4ed8", borderWidth: 2, tension: .3, pointRadius: 0, pointHoverRadius: 4, order: 1 } ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { backgroundColor: "#0f172a", padding: 10, cornerRadius: 8 } },
      scales: { x: { grid: { display: false }, ticks: { color: "#64748b", maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 11 } } },
                y: { beginAtZero: true, grid: { color: "#eef2f7" }, border: { display: false }, ticks: { color: "#64748b", precision: 0, font: { size: 11 } } } } } });
}
function renderNeeds(recs, roster, open) {
  const quiet = new Set(quietStudents(roster).map((s) => s.code));
  // A task only counts against a student once it is due within a week (or closed).
  const pressing = tasksInScope().filter((t) => t.dueAt && t.dueAt - Date.now() <= 7 * DAY);
  const openReps = pressing.map((t) => ({ t, rep: taskReport(t) }));
  const rows = roster.map((s) => {
    const rs = recs.filter((r) => r.studentCode === s.code && r.countsToMastery !== false);
    const avg = rs.length ? Math.round(rs.reduce((a, r) => a + r.percent, 0) / rs.length) : null;
    const mine = C.all.filter((r) => r.studentCode === s.code && r.countsToMastery !== false).sort((a, b) => a.time - b.time);
    let drop = null; if (mine.length >= 6) { const last = mine.slice(-3), before = mine.slice(-6, -3); const la = last.reduce((a, r) => a + r.percent, 0) / 3, ba = before.reduce((a, r) => a + r.percent, 0) / 3; if (ba - la >= 15) drop = Math.round(ba - la); }
    const notStarted = openReps.filter(({ t, rep }) => (t.className || "") === s.className && rep.notStarted.some((x) => x.code === s.code)).map(({ t }) => taskTitle(t) + (Date.now() > t.dueAt ? " (closed)" : " (due " + fmtShort(t.dueAt) + ")"));
    const flags = [];
    if (avg != null && avg < 50) flags.push(`<span class="ax-pill bad">Average ${avg}%</span>`);
    if (drop) flags.push(`<span class="ax-pill warn" title="Last 3 attempts against the 3 before">Down ${drop}%</span>`);
    if (quiet.has(s.code)) flags.push(`<span class="ax-pill mute">Quiet 2+ weeks</span>`);
    else if (!C.all.some((r) => r.studentCode === s.code)) flags.push(`<span class="ax-pill mute">Never started</span>`);
    if (notStarted.length) flags.push(`<span class="ax-pill warn" title="${esc(notStarted.join(", "))}">${notStarted.length === 1 ? "Not started: " + esc(notStarted[0].replace(/ \((due|closed).*$/, "")) : notStarted.length + " tasks not started"}</span>`);
    return { ...s, avg, flags, score: (avg != null && avg < 50 ? 3 : 0) + (drop ? 2 : 0) + (quiet.has(s.code) ? 1 : 0) + notStarted.length };
  }).filter((r) => r.flags.length).sort((a, b) => b.score - a.score || (a.avg ?? 101) - (b.avg ?? 101));
  const el = $("axNeed");
  if (!rows.length) { el.innerHTML = `<div class="ax-empty">Nobody flagged — everyone is active, above 50% and up to date 🎉</div>`; return; }
  const draw = (n) => {
    el.innerHTML = `<div class="ax-scroll"><table class="ax-t"><thead><tr><th>Student</th><th>Class</th><th class="num">Avg (window)</th><th>Why</th></tr></thead><tbody>` +
      rows.slice(0, n).map((r) => `<tr><td class="nm"><button class="ax-name" data-stu="${esc(r.code)}">${esc(r.name)}</button></td><td>${esc(r.className || "—")}</td><td class="num">${r.avg == null ? "—" : `<span class="pct ${pc(r.avg)}">${r.avg}%</span>`}</td><td><div class="ax-chips">${r.flags.join("")}</div></td></tr>`).join("") +
      `</tbody></table></div>${rows.length > n ? `<div style="margin-top:10px"><button class="ax-link" type="button" id="axNeedAll">Show all ${rows.length}</button></div>` : ""}`;
    el.querySelectorAll("[data-stu]").forEach((b) => b.addEventListener("click", () => openStudentFromAnalytics(b.dataset.stu)));
    const more = $("axNeedAll"); if (more) more.addEventListener("click", () => draw(rows.length));
  };
  draw(15);
}
function renderClassCompare() {
  const rows = C.classes.map((cn) => {
    const roster = rosterOf(cn); const rs = C.all.filter((r) => r.className === cn && inWindow(r, A.win)); const w = windowStats(rs, roster.length);
    const ts = C.dashAssignments.filter((t) => t.className === cn); let need = 0, done = 0; ts.forEach((t) => { const rep = taskReport(t); need += rep.roster; done += rep.started; });
    return { cn, size: roster.length, ...w, taskPct: need ? Math.round((done / need) * 100) : null };
  });
  const el = $("axClasses"); if (!el) return;
  if (!rows.length) { el.innerHTML = `<div class="ax-empty">No classes yet.</div>`; return; }
  el.innerHTML = `<table class="ax-t"><thead><tr><th>Class</th><th class="num">Students</th><th class="num">Active</th><th class="num">Participation</th><th class="num">Attempts</th><th class="num">Avg score</th><th class="num">Set tasks started</th></tr></thead><tbody>` +
    rows.map((r) => `<tr class="click" data-cls="${esc(r.cn)}"><td><b>${esc(r.cn)}</b></td><td class="num">${r.size}</td><td class="num">${r.active}</td><td class="num"><span class="ax-cell ${pc(r.participation)}">${r.participation}%</span></td><td class="num">${r.attempts}</td><td class="num">${r.attempts ? `<span class="ax-cell ${pc(r.avg)}">${r.avg}%</span>` : "—"}</td><td class="num">${r.taskPct == null ? "—" : `<span class="ax-cell ${pc(r.taskPct)}">${r.taskPct}%</span>`}</td></tr>`).join("") + `</tbody></table><p class="ax-note">Click a class to focus the whole page on it.</p>`;
  el.querySelectorAll("tr[data-cls]").forEach((tr) => tr.addEventListener("click", () => { A.cls = tr.dataset.cls; $("axCls").value = A.cls; render(); }));
}

/* ------------------------------------------------------------------ TASKS */
function renderTasks(body) {
  const all = tasksInScope().map((t) => ({ t, st: taskState(t) }));
  const list = all.filter((x) => A.taskFilter === "all" || x.st.key === A.taskFilter)
    .sort((a, b) => (a.st.key === b.st.key ? (a.st.key === "open" ? (a.t.dueAt || Infinity) - (b.t.dueAt || Infinity) : (b.t.dueAt || 0) - (a.t.dueAt || 0)) : a.st.key === "open" ? -1 : 1));
  const n = (k) => all.filter((x) => k === "all" || x.st.key === k).length;
  body.innerHTML = `<div class="ax-top" style="justify-content:space-between"><div class="ax-seg" id="axTF">${[["open", "Open"], ["closed", "Closed"], ["all", "All"]].map(([k, l]) => `<button type="button" data-k="${k}" class="${A.taskFilter === k ? "on" : ""}">${l} (${n(k)})</button>`).join("")}</div>
    <span class="ax-note" style="margin:0">A student counts as started once they have tried the quiz since the task was set.</span></div>
    ${list.length ? `<div class="ax-tasks" id="axTaskList"></div>` : `<div class="ax-empty">No ${A.taskFilter === "all" ? "" : A.taskFilter + " "}online tasks${A.cls ? " for " + esc(A.cls) : ""}. Set one from “Set an Online Task”.</div>`}`;
  $("axTF").addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (!b) return; A.taskFilter = b.dataset.k; render(); });
  const el = $("axTaskList"); if (!el) return;
  el.innerHTML = list.map(({ t, st }) => {
    const rep = taskReport(t); const pct = rep.roster ? Math.round((rep.started / rep.roster) * 100) : 0; const k = rep.skills[0];
    const lv = taskLevel(t);
    return `<button type="button" class="ax-task" data-task="${esc(t.id)}">
      <span class="tt">${esc(taskTitle(t))}</span>
      <span class="row"><span class="ax-pill">${esc(t.className || "—")}</span><span class="ax-pill ${st.cls}">${esc(st.label)}</span>${lv ? `<span class="ax-pill mute">Set level: ${esc(lv)}</span>` : ""}</span>
      <span class="ax-prog"><i style="width:${pct}%"></i></span>
      <span class="meta"><span><b>${rep.started}/${rep.roster}</b> started</span><span>Avg best <b class="pct ${pc(rep.avgBest)}">${rep.avgBest == null ? "—" : rep.avgBest + "%"}</b></span></span>
      ${k && k.rate < 70 ? `<span class="meta"><span>Weakest: <b>${esc(k.label)}</b></span><span class="pct ${pc(k.rate)}">${k.rate}%</span></span>` : ""}
    </button>`;
  }).join("");
  el.querySelectorAll("[data-task]").forEach((b) => b.addEventListener("click", () => { const t = C.dashAssignments.find((x) => x.id === b.dataset.task); openReport({ quiz: t.toolId, task: t.id }); }));
}

/* ------------------------------------------------------------------ QUIZZES */
function renderQuizzes(body) {
  const recs = scopeRecs().filter((r) => r.toolId !== "mills-maths-adventure");
  const byQuiz = new Map(); recs.forEach((r) => { const k = quizKey(r); if (!byQuiz.has(k)) byQuiz.set(k, []); byQuiz.get(k).push(r); });
  const rows = [...byQuiz.entries()].map(([qk, rs]) => { const rep = quizReport(rs, []); return { qk, title: quizTitle(qk, rs[0]), topic: rs[0].topic, rep, last: Math.max(...rs.map((r) => r.time || 0)) }; })
    .sort((a, b) => b.last - a.last);
  if (!rows.length) { body.innerHTML = `<div class="ax-empty">No quiz attempts ${A.win ? `in the last ${A.win} days` : "yet"}${A.cls ? " for " + esc(A.cls) : ""}.</div>`; return; }
  body.innerHTML = `<div class="ax-card"><h3>Quizzes your students have done</h3><p class="hint">Click a quiz for its full report — set as a task or not. Adventure results are in All attempts.</p>
    <div class="ax-scroll"><table class="ax-t"><thead><tr><th>Quiz</th><th class="num">Students</th><th class="num">Attempts</th><th class="num">Avg best</th><th>Weakest question type</th><th>Last attempt</th></tr></thead><tbody>` +
    rows.map((r) => { const k = r.rep.skills[0]; return `<tr class="click" data-q="${esc(r.qk)}"><td><b>${esc(r.title)}</b>${r.topic ? `<div class="ax-note" style="margin:0">${esc(r.topic)}</div>` : ""}</td><td class="num">${r.rep.started}</td><td class="num">${r.rep.attempts}</td><td class="num">${r.rep.avgBest == null ? "—" : `<span class="ax-cell ${pc(r.rep.avgBest)}">${r.rep.avgBest}%</span>`}</td><td>${k ? `${esc(k.label)} <span class="pct ${pc(k.rate)}">${k.rate}%</span>` : `<span class="ax-note">overall score only</span>`}</td><td>${fmtShort(r.last)}</td></tr>`; }).join("") +
    `</tbody></table></div></div>`;
  body.querySelectorAll("tr[data-q]").forEach((tr) => tr.addEventListener("click", () => openReport({ quiz: tr.dataset.q })));
}

/* ------------------------------------------------------------------ SKILLS */
function renderSkills(body) {
  const recs = scopeRecs().filter((r) => r.toolId !== "mills-maths-adventure");
  const across = skillsAcross(recs, quizTitle).filter((k) => k.students >= 2);
  const topics = new Map(); recs.filter((r) => r.countsToMastery !== false).forEach((r) => { const t = r.topic || "(untagged)"; const e = topics.get(t) || { sum: 0, n: 0, kids: new Set() }; e.sum += r.percent; e.n++; e.kids.add(r.studentCode); topics.set(t, e); });
  const tlist = [...topics.entries()].map(([t, e]) => ({ t, avg: Math.round(e.sum / e.n), n: e.n, kids: e.kids.size })).filter((x) => x.n >= 3).sort((a, b) => a.avg - b.avg);
  body.innerHTML = `
    <div class="ax-card"><h3>Weakest question types</h3><p class="hint">Across every quiz that saves a breakdown. Each % is the average of each student's own success rate on that question type. Click one to open the quiz.</p><div id="axSk"></div></div>
    <div class="ax-grid2">
      <div class="ax-card"><h3>Topics, weakest first</h3><p class="hint">Average score per topic (3+ attempts).</p><div class="ax-bars" id="axTop2"></div></div>
      <div class="ax-card"><h3>Topic × class</h3><p class="hint">Class average on each of your most-used topics.</p><div class="ax-scroll" id="axHeat"></div></div>
    </div>`;
  const sk = $("axSk");
  sk.innerHTML = across.length ? `<div class="ax-bars">` + across.slice(0, 12).map((k, i) => `<div class="ax-bar click" data-i="${i}"><span class="lb" title="${esc(k.label)} — ${esc(k.quizTitle)}">${esc(k.label)}<small>${esc(k.quizTitle)}</small></span><span class="tr"><i class="${pc(k.rate)}" style="width:${Math.max(3, k.rate)}%"></i></span><span class="vl">${k.rate}% · ${k.below.length}/${k.students} under 50%</span></div>`).join("") + `</div>`
    : `<div class="ax-empty">No question-type breakdowns in this window yet.</div>`;
  sk.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => openReport({ quiz: across[Number(b.dataset.i)].quiz })));
  $("axTop2").innerHTML = tlist.length ? tlist.slice(0, 10).map((x) => `<div class="ax-bar"><span class="lb" title="${esc(x.t)}">${esc(x.t)}<small>${x.kids} students · ${x.n} attempts</small></span><span class="tr"><i class="${pc(x.avg)}" style="width:${Math.max(3, x.avg)}%"></i></span><span class="vl">${x.avg}%</span></div>`).join("") : `<div class="ax-empty">Not enough attempts per topic yet.</div>`;
  const top = [...topics.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 6).map(([t]) => t);
  const cls = A.cls ? [A.cls] : C.classes;
  $("axHeat").innerHTML = top.length && cls.length ? `<table class="ax-t ax-heat"><thead><tr><th></th>${top.map((t) => `<th title="${esc(t)}">${esc(t.length > 14 ? t.slice(0, 13) + "…" : t)}</th>`).join("")}</tr></thead><tbody>` +
    cls.map((cn) => `<tr><td><b>${esc(cn)}</b></td>${top.map((t) => { const rs = recs.filter((r) => r.className === cn && (r.topic || "(untagged)") === t && r.countsToMastery !== false); if (!rs.length) return `<td class="c"><span class="ax-cell na">—</span></td>`; const v = Math.round(rs.reduce((a, r) => a + r.percent, 0) / rs.length); return `<td class="c"><span class="ax-cell ${pc(v)}">${v}%</span></td>`; }).join("")}</tr>`).join("") + `</tbody></table>`
    : `<div class="ax-empty">Appears once there is more data.</div>`;
}

/* ------------------------------------------------------------------ ALL ATTEMPTS */
function renderAttempts(body) {
  const tools = [...new Map(C.all.map((r) => [quizKey(r), quizTitle(quizKey(r), r)])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  body.innerHTML = `<div class="ax-top"><select id="axAtTool"><option value="">All quizzes and tools</option>${tools.map(([k, t]) => `<option value="${esc(k)}" ${k === A.attempts.tool ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
    <input id="axAtQ" placeholder="Search student or code" value="${esc(A.attempts.q)}" style="min-width:200px"/>
    <span style="flex:1"></span><button class="ax-link" type="button" id="axAtCsv">Export CSV</button><button class="ax-link" type="button" id="axAtCopy">Copy summary</button></div><div class="ax-scroll" id="axAtT"></div>`;
  const draw = () => {
    const q = String(A.attempts.q || "").trim().toUpperCase();
    const rows = scopeRecs().filter((r) => (!A.attempts.tool || quizKey(r) === A.attempts.tool) && (!q || (r.studentCode || "").includes(q) || (r.studentName || "").toUpperCase().includes(q)));
    $("axAtT").innerHTML = rows.length ? `<table class="ax-t"><thead><tr><th>Student</th><th>Class</th><th>Quiz / tool</th><th>Level</th><th class="num">Score</th><th class="num">%</th><th>Breakdown</th><th>Date</th></tr></thead><tbody>` +
      rows.slice(0, 400).map((r) => { const sk = skillsOf(r); const lv = levelOf(r).label; return `<tr><td><button class="ax-name" data-stu="${esc(r.studentCode)}">${esc(r.studentName || r.studentCode)}</button></td><td>${esc(r.className || "—")}</td><td>${esc(r.toolId === "mills-maths-adventure" ? "Adventure · " + (r.topic || "") : quizTitle(quizKey(r), r))}</td><td>${esc(lv || "—")}</td><td class="num">${r.score}/${r.total}${r.partial ? ` <span class="badge partial">${esc(C.partialLabel(r))}</span>` : ""}</td><td class="num"><span class="ax-cell ${pc(r.percent)}">${r.percent}%</span></td><td>${sk.length ? `<span class="ax-note" style="margin:0">${sk.map((k) => `${esc(k.label)} ${k.ok}/${k.total}`).join(" · ")}</span>` : "—"}</td><td>${esc(r.dateLabel)}</td></tr>`; }).join("") +
      `</tbody></table>${rows.length > 400 ? `<p class="ax-note">Showing the newest 400 of ${rows.length}. Export CSV for everything.</p>` : ""}` : `<div class="ax-empty">No attempts match.</div>`;
    $("axAtT").querySelectorAll("[data-stu]").forEach((b) => b.addEventListener("click", () => openStudentFromAnalytics(b.dataset.stu)));
    return rows;
  };
  let rows = draw();
  $("axAtTool").addEventListener("change", () => { A.attempts.tool = $("axAtTool").value; rows = draw(); });
  $("axAtQ").addEventListener("input", () => { A.attempts.q = $("axAtQ").value; rows = draw(); });
  $("axAtCsv").addEventListener("click", () => download(C.toCSV(rows), `mmt-results-${C.teacher.teacherCode}.csv`));
  $("axAtCopy").addEventListener("click", (e) => copy(C.summaryText(rows, `${C.teacher.teacherName || C.teacher.teacherCode} — results`), e.currentTarget));
}
function download(text, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

/* ------------------------------------------------------------------ QUIZ REPORT */
function teachingLinks(qk) {
  const norm = (u) => { try { const x = new URL(u, location.origin); return decodeURIComponent(x.pathname).replace(/\/index\.html$/i, "/").toLowerCase(); } catch (e) { return ""; } };
  const L = window.MMT_TOOL_LINKS; const url = norm(quizUrl(qk) || ""); if (!L || !url) return [];
  const outs = Object.keys(L).filter((o) => (L[o] || []).some((r) => norm(r.url || "") === url));
  const seen = new Set(), out = [];
  outs.forEach((o) => (L[o] || []).forEach((r) => { if (!/teacher tool|worksheet/i.test(r.kind || "") || seen.has(r.url)) return; seen.add(r.url); out.push({ ...r, outcome: o }); }));
  // the quiz's own teaching tool first: most words shared with the quiz's title
  const words = new Set(quizTitle(qk).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const score = (r) => r.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => words.has(w)).length;
  return out.sort((a, b) => score(b) - score(a) || (/teacher/i.test(a.kind) ? -1 : 1)).slice(0, 4);
}
function renderReport(body) {
  const v = A.view; const task = v.task ? C.dashAssignments.find((t) => t.id === v.task) : null;
  const recs = task ? taskRecords(task, C.all) : C.all.filter((r) => quizKey(r) === v.quiz && (!A.cls || r.className === A.cls) && inWindow(r, A.win));
  const roster = task ? rosterOf(task.className || "") : A.cls ? rosterOf(A.cls) : [];
  const rep = quizReport(recs, roster);
  const title = task ? taskTitle(task) : quizTitle(v.quiz, recs[0]);
  const st = task ? taskState(task) : null;
  const sub = task ? `${esc(task.className)} · set ${fmtShort(task.assignedAt || Date.now())} · <span class="ax-pill ${st.cls}">${esc(st.label)}</span>${taskLevel(task) ? ` · set level ${esc(taskLevel(task))}` : ""}`
    : `${A.cls ? esc(A.cls) : "All classes"} · ${A.win ? `last ${A.win} days` : "all time"}`;
  const launch = task ? task.launchUrl || quizUrl(v.quiz) : quizUrl(v.quiz);
  const links = teachingLinks(v.quiz);
  const backLabel = { overview: "Overview", tasks: "Tasks", quizzes: "Quizzes", skills: "Skills", attempts: "All attempts" }[A.tab];
  const showRoster = rep.roster > rep.started || task || A.cls;
  body.innerHTML = `
    <div class="ax-rhead"><div><button class="ax-back" type="button" id="axBack">← ${backLabel}</button><h3>${esc(title)}</h3><div class="sub">${sub}</div></div>
      <div class="ax-actions">${launch ? `<a class="ax-link" href="${esc(launch)}" target="_blank" rel="noopener">Preview quiz ↗</a>` : ""}<button class="ax-link" type="button" id="axRCsv">Export CSV</button><button class="ax-link" type="button" id="axRCopy">Copy summary</button></div></div>
    ${!rep.attempts && !rep.roster ? `<div class="ax-empty">No attempts yet.</div>` : `
    <div class="ax-kpis">
      ${showRoster ? `<div class="ax-kpi"><div class="l">Started</div><div class="v">${rep.started}<small> / ${rep.roster}</small></div><div class="s">${rep.roster ? Math.round((rep.started / rep.roster) * 100) : 0}% of the class</div></div>` : `<div class="ax-kpi"><div class="l">Students</div><div class="v">${rep.started}</div><div class="s">tried it</div></div>`}
      <div class="ax-kpi"><div class="l">Average best</div><div class="v pct ${pc(rep.avgBest)}">${rep.avgBest == null ? "—" : rep.avgBest + "%"}</div><div class="s">middle student ${rep.median == null ? "—" : rep.median + "%"}</div></div>
      <div class="ax-kpi"><div class="l">Attempts</div><div class="v">${rep.attempts}</div><div class="s">${rep.avgAttempts} per student</div></div>
      <div class="ax-kpi"><div class="l">Improved by retrying</div><div class="v">${rep.improved}</div><div class="s">best beat first try by 10%+</div></div>
    </div>
    ${rep.notStarted.length ? `<div class="ax-card"><h3>Not started (${rep.notStarted.length})</h3><div class="ax-chips" style="margin-top:8px">${rep.notStarted.map((s) => `<span class="ax-chip">${esc(s.name)}</span>`).join("")}</div><div style="margin-top:10px"><button class="ax-link" type="button" id="axCopyNS">Copy names</button></div></div>` : ""}
    <div class="ax-card"><h3>Where marks were lost</h3><p class="hint">Each question type, weakest first: the average of each student's own success rate on it, across all their attempts.</p><div id="axLost"></div></div>
    <div id="axReteach"></div>
    <div class="ax-grid2">
      <div class="ax-card"><h3>Spread of best scores</h3><p class="hint">Each student's best attempt.</p><div class="ax-spread">${rep.bands.map((b, i) => { const max = Math.max(1, ...rep.bands.map((x) => x.n)); const col = ["#ef4444", "#f59e0b", "#84cc16", "#22c55e"][i]; return `<div class="col"><span class="n">${b.n}</span><span class="b" style="height:${Math.round((b.n / max) * 100)}%;background:${col}"></span><span class="x">${b.label}</span></div>`; }).join("")}</div></div>
      <div class="ax-card"><h3>Levels</h3><p class="hint">Who tried which level, and how they went.</p>${rep.levels.length ? `<table class="ax-t"><thead><tr><th>Level</th><th class="num">Students</th><th class="num">Avg best</th></tr></thead><tbody>${rep.levels.map((l) => `<tr><td><b>${esc(l.label)}</b></td><td class="num">${l.students}</td><td class="num">${l.avgBest == null ? "—" : `<span class="ax-cell ${pc(l.avgBest)}">${l.avgBest}%</span>`}</td></tr>`).join("")}</tbody></table>` : `<div class="ax-empty">No levels recorded.</div>`}
        ${rep.facets.length ? `<div style="margin-top:12px">${rep.facets.map((f) => `<div class="ax-note" style="margin:6px 0 0"><b>${esc(f.group)}:</b> ${f.items.map((i) => i.sumT ? `${Math.round((i.sumN / i.sumT) * 100)}% of questions` : `${esc(i.label)} ${i.n}`).join(" · ")}</div>`).join("")}</div>` : ""}</div>
    </div>
    <div class="ax-card"><h3>Students</h3><p class="hint">Click a column to sort, or a name for the student's page.${rep.hasSkills ? " Coloured cells are each question type." : ""}</p><div class="ax-scroll" id="axGrid"></div></div>`}`;
  $("axBack").addEventListener("click", () => { A.view = null; render(); });
  $("axRCsv").addEventListener("click", () => download(reportCsv(rep, title), `${title.replace(/[\\/:*?"<>|]+/g, "-")} - ${task ? task.className : A.cls || "all"} - report.csv`));
  $("axRCopy").addEventListener("click", (e) => copy(reportText(rep, title, task), e.currentTarget));
  if (!rep.attempts && !rep.roster) return;
  if ($("axCopyNS")) $("axCopyNS").addEventListener("click", (e) => copy(rep.notStarted.map((s) => s.name).join("\n"), e.currentTarget));
  // where marks were lost
  $("axLost").innerHTML = rep.hasSkills ? `<div class="ax-bars">` + rep.skills.map((k) => `<div class="ax-bar"><span class="lb" title="${esc(k.label)}">${esc(k.label)}<small>${k.ok}/${k.total} questions right · ${k.students} student${k.students === 1 ? "" : "s"}</small></span><span class="tr"><i class="${pc(k.rate)}" style="width:${Math.max(3, k.rate)}%"></i></span><span class="vl">${k.rate}%${k.below.length ? ` · <span class="pct lo">${k.below.length} under 50%</span>` : ""}</span></div>`).join("") + `</div>`
    : `<div class="ax-empty">This quiz only saves an overall score, so there's no question-type breakdown. The spread, levels and student table below still apply.</div>`;
  // reteach
  const weak = rep.skills.filter((k) => k.rate < 70 && k.below.length).slice(0, 3);
  if (weak.length || links.length) {
    $("axReteach").innerHTML = `<div class="ax-card"><h3>Reteach</h3><p class="hint">${weak.length ? "The question types most worth revisiting, and who to group for each." : "Teaching tools for this quiz's outcome."}</p>
      ${weak.length ? `<div class="ax-reteach">${weak.map((k, i) => `<div class="ax-rt"><div class="h"><span>${esc(k.label)}</span><span class="pct lo">${k.rate}%</span></div><div class="who">${k.below.map((s) => esc(s.name)).join(", ")}</div><button class="ax-link" type="button" data-grp="${i}">Copy group (${k.below.length})</button></div>`).join("")}</div>` : ""}
      ${links.length ? `<div class="ax-tools">${links.map((l) => `<a class="ax-link" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.outcome)}${l.note ? " — " + esc(l.note) : ""}">${/worksheet/i.test(l.kind) ? "🖨 Worksheet maker" : "🧑‍🏫 Teaching tool"}: ${esc(l.title)}</a>`).join("")}</div>` : ""}</div>`;
    $("axReteach").querySelectorAll("[data-grp]").forEach((b) => b.addEventListener("click", (e) => { const k = weak[Number(b.dataset.grp)]; copy(`${title} — ${k.label}\n` + k.below.map((s) => s.name).join("\n"), e.currentTarget); }));
  }
  drawGrid(rep);
}
function drawGrid(rep) {
  const sk = rep.skills; const k = A.sort.key, dir = A.sort.dir;
  const val = (s) => k === "name" ? s.name.toLowerCase() : k === "status" ? (s.started ? 1 : 0) : k.startsWith("sk:") ? (s.skills[k.slice(3)]?.rate ?? -1) : (s[k] ?? -1);
  const rows = rep.students.slice().sort((a, b) => { if (a.started !== b.started) return a.started ? -1 : 1; const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || a.name.localeCompare(b.name); });
  const th = (key, label, num) => `<th data-sort="${esc(key)}" class="${num ? "num" : ""}" ${key.startsWith("sk:") ? `title="${esc(label)}"` : ""}>${esc(key.startsWith("sk:") && label.length > 16 ? label.slice(0, 15) + "…" : label)}${A.sort.key === key ? `<span class="ar">${dir > 0 ? "▲" : "▼"}</span>` : ""}</th>`;
  const multi = new Set(rep.students.map((s) => s.className)).size > 1;
  const cell = (p) => p == null ? `<span class="ax-cell na">—</span>` : `<span class="ax-cell ${pc(p)}">${p}%</span>`;
  $("axGrid").innerHTML = `<table class="ax-t"><thead><tr>${th("name", "Student")}${th("attempts", "Tries", 1)}${th("first", "First", 1)}${th("best", "Best", 1)}${th("gain", "Change", 1)}<th>Best level</th>${th("last", "Last tried")}${sk.map((s) => th("sk:" + s.id, s.label, 1)).join("")}</tr></thead><tbody>` +
    rows.map((s) => s.started
      ? `<tr><td class="nm"><button class="ax-name" data-stu="${esc(s.code)}">${esc(s.name)}</button>${multi && s.className ? ` <span class="ax-note">${esc(s.className)}</span>` : ""}</td><td class="num">${s.attempts}</td><td class="num">${cell(s.first)}</td><td class="num">${s.onlyPartial ? `<span class="badge partial" title="Only part-finished attempts">part-done</span>` : cell(s.best)}</td><td class="num">${s.gain ? `<span class="pct ${s.gain > 0 ? "hi" : "lo"}">${s.gain > 0 ? "+" : ""}${s.gain}</span>` : "—"}</td><td>${esc(s.bestLevel || "—")}</td><td>${s.last ? fmtShort(s.last) : "—"}</td>${sk.map((x) => `<td class="num">${cell(s.skills[x.id]?.rate)}</td>`).join("")}</tr>`
      : `<tr class="dim"><td class="nm"><button class="ax-name" data-stu="${esc(s.code)}" style="color:#94a3b8">${esc(s.name)}</button></td><td class="num">0</td><td colspan="${5 + sk.length}">Not started</td></tr>`).join("") + `</tbody></table>`;
  $("axGrid").querySelectorAll("th[data-sort]").forEach((h) => h.addEventListener("click", () => { const key = h.dataset.sort; A.sort = { key, dir: A.sort.key === key ? -A.sort.dir : (key === "name" ? 1 : key === "last" || key === "gain" || key === "attempts" ? -1 : 1) }; drawGrid(rep); }));
  $("axGrid").querySelectorAll("[data-stu]").forEach((b) => b.addEventListener("click", () => openStudentFromAnalytics(b.dataset.stu)));
}
function reportCsv(rep, title) {
  const q = (v) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const head = ["Student", "Class", "Status", "Attempts", "First %", "Best %", "Best score", "Best level", "Last tried", ...rep.skills.map((k) => k.label + " %")];
  const lines = rep.students.map((s) => [s.name, s.className, s.started ? "Started" : "Not started", s.attempts, s.first ?? "", s.best ?? "", s.bestScore, s.bestLevel || "", s.last ? new Date(s.last).toISOString().slice(0, 10) : "", ...rep.skills.map((k) => s.skills[k.id]?.rate ?? "")]);
  return [head, ...lines].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}
function reportText(rep, title, task) {
  const L = [`${title}${task ? ` — ${task.className}` : ""}`, `Started: ${rep.started}${rep.roster ? "/" + rep.roster : ""} · Average best: ${rep.avgBest ?? "—"}% · Middle: ${rep.median ?? "—"}% · Improved by retrying: ${rep.improved}`];
  if (rep.skills.length) L.push("Weakest question types: " + rep.skills.slice(0, 3).map((k) => `${k.label} ${k.rate}%`).join(", "));
  if (rep.notStarted.length) L.push("Not started: " + rep.notStarted.map((s) => s.name).join(", "));
  return L.join("\n");
}
