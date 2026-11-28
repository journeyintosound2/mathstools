/* Mills Maths Tools — Whole-topic quiz START SCREEN (shared component)
   ------------------------------------------------------------------------
   online-quizzes/stage-4/topic-quiz/start-screen.js  (+ start-screen.css)

   One page, not pop-ups: 1 Level · 2 Question types · 3 How many, then Start.
   Used by EVERY Stage 4 whole-topic quiz:
     * the 11 on the shared engine (engine.js calls it), and
     * the 5 older quizzes through legacy-start.js, which reads their own
       level / type menus and starts them with their own Begin button.
   The component knows nothing about either: the host hands it the levels and
   says what Start does.

     const ss = MMTStartScreen.create({
       before: element,            // the start screen is inserted before this
       prefsId: "area",            // choices remembered per topic
       eyebrow: "Stage 4 · Whole-topic quiz · MA4-ARE-C-01",
       title: "Area",
       levels: () => [ { key:"basic"|"expected", name, alt?, sub,
                         types:[{id, html}], options?:[{id, html, def}] } ],
       counts: [5,10,15,20,30], defaultCount: 15,
       onStart(level, typeIds, count, options) {},
       onResume() {}               // optional: "Back to my quiz"
     });
     ss.show({ inQuiz, level });  ss.hide();  ss.repaint();  ss.isOpen();

   Choices live in localStorage "mmt.topicQuiz.v1" as
   { [prefsId]: { level, count, off:{level:[ids]}, opt:{id:bool} } }.
   Unticked types are stored ("off"), so a type added later starts ticked.
*/
(function () {
  "use strict";
  const PREF_KEY = "mmt.topicQuiz.v1";
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TICK = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 6.8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  let uid = 0;

  function create(cfg) {
    const n = ++uid, id = s => `st${n}_${s}`;
    const counts = (cfg.counts && cfg.counts.length ? cfg.counts : [5, 10, 15, 20, 30]).slice();
    const ST = { level: null, count: counts.includes(cfg.defaultCount) ? cfg.defaultCount : counts[Math.min(2, counts.length - 1)], off: {}, opt: {} };
    let LV = [], sec = null, inQuiz = false;

    const levelsNow = () => (LV = cfg.levels() || []);
    const lv = k => LV.find(l => l.key === k) || LV[0];
    const offSet = k => (ST.off[k] = ST.off[k] || new Set());
    const chosen = () => { const L = lv(ST.level), off = offSet(L.key); return L.types.filter(t => !off.has(t.id)).map(t => t.id); };
    const optVal = o => (o.id in ST.opt ? ST.opt[o.id] : !!o.def);

    function load() {
      try {
        const p = (JSON.parse(localStorage.getItem(PREF_KEY) || "{}"))[cfg.prefsId];
        if (!p) return;
        if (p.level) ST.level = p.level;
        if (counts.includes(p.count)) ST.count = p.count;
        Object.keys(p.off || {}).forEach(k => { ST.off[k] = new Set(p.off[k]); });
        if (p.opt && typeof p.opt === "object") ST.opt = { ...p.opt };
      } catch (e) {}
    }
    function save() {
      try {
        const all = JSON.parse(localStorage.getItem(PREF_KEY) || "{}"), off = {};
        Object.keys(ST.off).forEach(k => { off[k] = [...ST.off[k]]; });
        all[cfg.prefsId] = { level: ST.level, count: ST.count, off, opt: ST.opt };
        localStorage.setItem(PREF_KEY, JSON.stringify(all));
      } catch (e) {}
    }

    function build() {
      if (sec) return;
      sec = document.createElement("main");
      sec.className = "start"; sec.id = cfg.id || "startScreen"; sec.hidden = true; sec.dir = "ltr";
      sec.innerHTML = `
        <div class="stCard">
          <div class="stHead">
            <div class="stHeadText">
              <div class="stEyebrow">${esc(cfg.eyebrow || "Whole-topic quiz")}</div>
              <h1 class="stTitle">${esc(cfg.title || "")}</h1>
              <p class="stLead">${esc(cfg.lead || "Choose a level and the question types, then start. You get one try at each question.")}</p>
            </div>
            <button class="stResume" data-r="resume" type="button" hidden>&larr; Back to my quiz</button>
          </div>
          <section class="stSec" aria-labelledby="${id("lh")}">
            <h2 class="stH" id="${id("lh")}"><span class="stNum">1</span>Level</h2>
            <div class="stLevels" data-r="levels" role="radiogroup" aria-labelledby="${id("lh")}"></div>
          </section>
          <section class="stSec" aria-labelledby="${id("th")}">
            <div class="stHRow">
              <h2 class="stH" id="${id("th")}"><span class="stNum">2</span>Question types</h2>
              <span class="stTally" data-r="tally"></span>
              <button class="stLink" data-r="all" type="button"></button>
            </div>
            <div class="stTypes" data-r="types" role="group" aria-labelledby="${id("th")}"></div>
            <div class="stOpts" data-r="opts" hidden></div>
          </section>
          <div class="stFoot">
            <div class="stCountWrap">
              <span class="stH stHSmall" id="${id("ch")}"><span class="stNum">3</span>Questions</span>
              <div class="stCount" data-r="count" role="radiogroup" aria-labelledby="${id("ch")}">
                ${counts.map(c => `<button type="button" role="radio" data-n="${c}">${c}</button>`).join("")}
              </div>
            </div>
            <div class="stGoWrap">
              <span class="stNote" data-r="note" aria-live="polite"></span>
              <button class="stGo" data-r="go" type="button">Start quiz <span aria-hidden="true">&rarr;</span></button>
            </div>
          </div>
        </div>`;
      cfg.before.parentNode.insertBefore(sec, cfg.before);
      const R = k => sec.querySelector(`[data-r="${k}"]`);

      R("levels").addEventListener("click", e => { const b = e.target.closest(".stLvl"); if (b) pickLevel(b.dataset.level); });
      R("levels").addEventListener("keydown", e => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        const k = LV.findIndex(l => l.key === ST.level), d = (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1;
        pickLevel(LV[(k + d + LV.length) % LV.length].key);
        const on = R("levels").querySelector(".stLvl.on"); if (on) on.focus();
      });
      R("types").addEventListener("click", e => {
        const b = e.target.closest(".stType"); if (!b) return;
        const off = offSet(ST.level); off.has(b.dataset.id) ? off.delete(b.dataset.id) : off.add(b.dataset.id);
        paintTypes(); save();
      });
      R("all").addEventListener("click", () => {
        const off = offSet(ST.level);
        if (off.size) off.clear(); else lv(ST.level).types.forEach(t => off.add(t.id));
        paintTypes(); save();
      });
      R("opts").addEventListener("click", e => {
        const b = e.target.closest(".stOpt"); if (!b) return;
        const o = (lv(ST.level).options || []).find(x => x.id === b.dataset.id); if (!o) return;
        ST.opt[o.id] = !optVal(o); paintOpts(); save();
      });
      R("count").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; ST.count = Number(b.dataset.n); paintCount(); save(); });
      R("count").addEventListener("keydown", e => {
        const k = counts.indexOf(ST.count), d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
        if (d == null) return; e.preventDefault();
        ST.count = counts[Math.max(0, Math.min(counts.length - 1, k + d))]; paintCount(); save();
        R("count").querySelector('[aria-checked="true"]').focus();
      });
      R("go").addEventListener("click", () => {
        const ids = chosen(); if (!ids.length) { paintNote(true); return; }
        const L = lv(ST.level), opts = {};
        (L.options || []).forEach(o => { opts[o.id] = optVal(o); });
        cfg.onStart(L.key, ids, ST.count, opts);
      });
      R("resume").addEventListener("click", () => { if (cfg.onResume) cfg.onResume(); });
      sec._R = R;
    }
    const R = k => sec._R(k);

    function pickLevel(k) { if (k === ST.level || !LV.some(l => l.key === k)) return; ST.level = k; paintLevels(); paintTypes(true); save(); }
    function paintLevels() {
      R("levels").classList.toggle("one", LV.length === 1);
      R("levels").innerHTML = LV.map(l => {
        const on = l.key === ST.level;
        return `<button class="stLvl ${esc(l.cls || l.key)}${on ? " on" : ""}" type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-level="${esc(l.key)}">
          <span class="stRadio" aria-hidden="true"></span>
          <span class="stLvlBody">
            <span class="stLvlTop"><span class="stLvlName">${esc(l.name)}</span>${l.alt ? `<span class="stLvlAlt" dir="auto">${esc(l.alt)}</span>` : ""}<span class="stLvlMeta">${l.types.length} types</span></span>
            ${l.sub ? `<span class="stLvlSub">${l.sub}</span>` : ""}
          </span>
        </button>`;
      }).join("");
    }
    function paintTypes(swap) {
      const L = lv(ST.level), off = offSet(L.key);
      const box = R("types");
      box.className = "stTypes " + (L.cls || L.key) + (swap && !reduceMotion ? " swap" : "");
      box.innerHTML = L.types.map(t => `<button class="stType${off.has(t.id) ? "" : " on"}" type="button" aria-pressed="${!off.has(t.id)}" data-id="${esc(t.id)}"><span class="stBox">${TICK}</span><span class="stTypeLab">${t.html}</span></button>`).join("");
      const on = L.types.length - L.types.filter(t => off.has(t.id)).length;
      R("tally").textContent = `${on} of ${L.types.length} chosen`;
      R("all").textContent = on < L.types.length ? "Select all" : "Clear all";
      paintOpts(); paintNote(false);
    }
    function paintOpts() {
      const L = lv(ST.level), list = L.options || [], box = R("opts");
      box.hidden = !list.length;
      box.innerHTML = list.length ? `<span class="stOptsH">Options</span>` + list.map(o => { const v = optVal(o); return `<button class="stOpt${v ? " on" : ""}" type="button" role="switch" aria-checked="${v}" data-id="${esc(o.id)}"><span class="stSw" aria-hidden="true"></span><span>${o.html}</span></button>`; }).join("") : "";
    }
    function paintCount() {
      R("count").querySelectorAll("button").forEach(b => { const on = Number(b.dataset.n) === ST.count; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; });
      paintNote(false);
    }
    function paintNote(shout) {
      const k = chosen().length, note = R("note"), go = R("go"), L = lv(ST.level);
      go.classList.toggle("off", !k); go.setAttribute("aria-disabled", String(!k));
      note.classList.toggle("warn", !k); note.classList.remove("shake");
      if (!k) note.textContent = "Choose at least one question type.";
      else if (ST.count < k) note.textContent = `${ST.count} questions won’t cover all ${k} types.`;
      else note.textContent = `${L.name} · ${k} type${k === 1 ? "" : "s"} · ${ST.count} questions`;
      if (shout && !k && !reduceMotion) { void note.offsetWidth; note.classList.add("shake"); }
    }
    function repaint() {
      if (!sec || sec.hidden) return;
      levelsNow();
      if (!LV.some(l => l.key === ST.level)) ST.level = LV[0] && LV[0].key;
      paintLevels(); paintTypes(); paintCount();
    }
    function show(o) {
      o = o || {};
      build(); levelsNow();
      if (!LV.length) return;
      if (o.level && LV.some(l => l.key === o.level)) ST.level = o.level;
      if (!LV.some(l => l.key === ST.level)) ST.level = LV[0].key;
      inQuiz = !!o.inQuiz;
      R("resume").hidden = !(inQuiz && cfg.onResume);
      sec.hidden = false;
      document.documentElement.classList.add("stOn");
      paintLevels(); paintTypes(); paintCount();
      window.scrollTo(0, 0);
    }
    function hide() { if (sec) sec.hidden = true; document.documentElement.classList.remove("stOn"); }

    load();
    return { show, hide, repaint, isOpen: () => !!(sec && !sec.hidden), get el() { return sec; }, get state() { return ST; } };
  }

  window.MMTStartScreen = { create };
})();
