/* =========================================================================
   Mills Maths Tools — FLIP CARDS engine (2026-11-18)
   A deck page sets window.FLIP_DECK and loads this file. The engine draws the
   MMT shell (topbar, Settings ▾, Tools ▾, board card, side panel) and runs the
   cards: show the front, think, flip to reveal, next card.

   FLIP_DECK = {
     title, short?, outcome?, storeKey,
     prompt?: string | (set, S) => string     the line above the card
     sets:[{ id, name, sub?, ex?, prompt?, gen(S, recent) -> card }],
     settings?:[{ id, type:"switch"|"select", label, note?, def, options?:[[v,label]] , group? }],
     tools?:[{ href, label, sub? }],
     notes?: html,                            teacher notes under the sets
     preload?: [urls],                        images to load before the first card
     backTag?: "Answer", frontTag?: "Question"
   }
   card = { front:{ main, sub?, pic?, ui?, wrap? }, back:{ main, sub?, pic?, ui?, wrap? }, key?, colour? }
     main/sub/pic are HTML strings. `key` is used to avoid repeats.
     colour sets the back border/answer colour (e.g. the parallel-line deck).
   Keys: Enter / R / ↑↓ flip · Space / → next · ← previous · 1–9 set · F full screen · P panel · T think timer
   ========================================================================= */
(() => {
  "use strict";
  const D = window.FLIP_DECK;
  if(!D){ console.error("FLIP_DECK missing"); return; }
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  /* ---------------------------------------------------------- saved settings */
  const KEY = D.storeKey || ("mmtFlip." + location.pathname);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){ saved = {}; }
  const S = { set:null, panel:true, think:0, opts:{} };
  (D.settings || []).forEach(o => { S.opts[o.id] = saved.opts && o.id in saved.opts ? saved.opts[o.id] : o.def; });
  const qs = new URLSearchParams(location.search);
  const want = qs.get("set") || qs.get("level") || saved.set;
  S.set = (D.sets.find(s => s.id === want) || D.sets[0]).id;
  if(saved.panel === false) S.panel = false;
  if(typeof saved.think === "number") S.think = saved.think;
  if(window.innerWidth < 1200 && saved.panel == null) S.panel = window.innerWidth > 980;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ set:S.set, panel:S.panel, think:S.think, opts:S.opts })); } catch(e){} };

  /* ---------------------------------------------------------- the shell */
  const ICON = {
    again:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/></svg>',
    panel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M15 4v16"/></svg>',
    fsIn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    fsOut:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    timer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg>'
  };
  const setting = o => {
    if(o.type === "select") return `<label class="selRow"><span>${o.label}</span><select data-opt="${o.id}">${o.options.map(([v, l]) => `<option value="${esc(v)}"${String(S.opts[o.id]) === String(v) ? " selected" : ""}>${l}</option>`).join("")}</select></label>` + (o.note ? `<p class="settingsNote">${o.note}</p>` : "");
    return `<label class="sw"><input type="checkbox" data-opt="${o.id}"${S.opts[o.id] ? " checked" : ""}><span class="track"></span><span>${o.label}</span></label>` + (o.note ? `<p class="settingsNote">${o.note}</p>` : "");
  };
  let settingsHTML = "", lastGroup = null;
  (D.settings || []).forEach(o => {
    const g = o.group || "On the cards";
    if(g !== lastGroup){ if(lastGroup !== null) settingsHTML += '<div class="settingsRule" role="separator"></div>'; settingsHTML += `<div class="settingsHead">${g}</div>`; lastGroup = g; }
    settingsHTML += setting(o);
  });
  if(lastGroup !== null) settingsHTML += '<div class="settingsRule" role="separator"></div>';
  settingsHTML += `<div class="settingsHead">Think time</div><label class="selRow"><span>Before the flip</span><select id="thinkSel">${[[0, "No timer"], [5, "5 seconds"], [10, "10 seconds"], [15, "15 seconds"], [20, "20 seconds"], [30, "30 seconds"]].map(([v, l]) => `<option value="${v}"${S.think === v ? " selected" : ""}>${l}</option>`).join("")}</select></label><p class="settingsNote">A ring counts down on the card while the class writes on their mini-whiteboards. The card does not flip itself.</p>`;
  const toolsHTML = (D.tools || []).map(t => `<a class="toolLink" href="${t.href}">${esc(t.label)}${t.sub ? `<small>${esc(t.sub)}</small>` : ""}</a>`).join("")
    + '<a class="toolLink" href="/?cat=flip#browse">All flip cards<small>Every flip-card deck on Mills Maths Tools</small></a>';

  document.body.innerHTML = `<div class="app${S.panel ? "" : " noPanel"}" id="app">
  <header class="mmtTopbar">
    <a class="mmtBrand" href="https://www.millsmathstools.au" aria-label="Back to Mills Maths Tools"><span class="mmtBrandLogo" aria-hidden="true">MMT</span><span class="mmtBrandText"><strong>MMT</strong><span>Mills Maths Tools</span></span></a>
    <div class="mmtTopTitle">${esc(D.title)}</div>
    <div class="topActions">
      <div class="menuWrap"><button class="btn" id="settingsBtn" type="button" aria-haspopup="true" aria-expanded="false">Settings &#9662;</button>
        <nav class="dropMenu settingsMenu" id="settingsMenu" aria-label="Settings">${settingsHTML}</nav></div>
      <div class="menuWrap"><button class="btn" id="toolsBtn" type="button" aria-haspopup="true" aria-expanded="false">Tools &#9662;</button>
        <nav class="dropMenu" id="toolsMenu" aria-label="Tools">${toolsHTML}</nav></div>
    </div>
  </header>
  <main class="layout">
    <section class="card boardCard" aria-label="Flip card">
      <div class="boardTop">
        <div class="topLeft"><span class="chip" id="setChip"></span><span class="chip grey" id="countChip">Card 1</span>${D.outcome ? `<span class="chip grey">${esc(D.outcome)}</span>` : ""}</div>
        <div class="topRight"><div class="iconGroup">
          <button class="iconBtn" id="timerBtn" type="button" title="Think-time timer (T)" aria-label="Think-time timer" aria-pressed="${S.think > 0}">${ICON.timer}</button>
          <button class="iconBtn" id="againBtn" type="button" title="Start the set again (Home)" aria-label="Start the set again">${ICON.again}</button>
          <button class="iconBtn" id="panelBtn" type="button" title="Show or hide the sets (P)" aria-label="Show or hide the sets" aria-pressed="${S.panel}">${ICON.panel}</button>
          <button class="iconBtn" id="fsBtn" type="button" title="Full screen (F)" aria-label="Full screen"><span class="fsIn">${ICON.fsIn}</span><span class="fsOut" hidden>${ICON.fsOut}</span></button>
        </div></div>
      </div>
      <div class="prompt" id="prompt"></div>
      <div class="stage" id="stage">
        <div class="scene" id="scene">
          <div class="flip" id="flip">
            <div class="face front"><span class="faceTag">${esc(D.frontTag || "Question")}</span><div class="faceInner" id="frontIn"></div></div>
            <div class="face back"><span class="faceTag">${esc(D.backTag || "Answer")}</span><div class="faceInner" id="backIn"></div></div>
          </div>
          <svg class="think" id="think" viewBox="0 0 46 46" hidden><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" id="thinkArc" cx="23" cy="23" r="19"/><text x="23" y="28" text-anchor="middle" id="thinkTxt"></text></svg>
        </div>
      </div>
      <div class="controls">
        <button class="ctlBtn" id="prevBtn" type="button" title="Previous card (←)">&#8592; Back</button>
        <button class="ctlBtn flipBtn" id="flipBtn" type="button" title="Flip (Enter)">Flip</button>
        <button class="ctlBtn" id="nextBtn" type="button" title="Next card (Space or →)">Next &#8594;</button>
      </div>
      <div class="hint"><span class="kbd">Enter</span> flip · <span class="kbd">Space</span> next · <span class="kbd">&#8592;</span> back · <span class="kbd">1</span>&ndash;<span class="kbd">${Math.min(9, D.sets.length)}</span> set · <span class="kbd">F</span> full screen</div>
    </section>
    <aside class="card panel" id="panel" aria-label="Sets">
      <p class="pHead">${esc(D.setsHead || "Choose a set")}</p>
      <div class="setList" id="setList"></div>
      <div class="tally" id="tally"></div>
      ${D.notes ? `<p class="pHead">${esc(D.notesHead || "Teacher notes")}</p><div class="notes">${D.notes}</div>` : ""}
    </aside>
  </main>
</div>`;

  const app = $("app"), flip = $("flip"), frontIn = $("frontIn"), backIn = $("backIn");

  /* ---------------------------------------------------------- the cards */
  const H = { cards:[], i:-1 };       /* history: back goes through cards already seen */
  let revealed = false, seen = 0, flipped = 0;
  const currentSet = () => D.sets.find(s => s.id === S.set);
  function makeCard(){
    const set = currentSet(), recent = H.cards.slice(-8).map(c => c.key);
    let c = null;
    for(let t = 0; t < 40; t++){ c = set.gen(S.opts, recent, S); if(!c.key || !recent.includes(c.key)) break; }
    return c;
  }
  const face = f => {
    if(!f) return "";
    let h = "";
    let t = "";
    if(f.main != null && f.main !== "") t += `<div class="faceMain${f.ui ? " ui" : ""}${f.wrap ? " wrap" : ""}">${f.main}</div>`;
    if(f.sub) t += `<div class="faceSub${f.subMath ? " math" : ""}">${f.sub}</div>`;
    if(f.pic && f.side) return `<div class="faceRow"><div class="facePic side">${f.pic}</div><div class="faceText">${t}</div></div>`;
    if(f.pic) h += `<div class="facePic">${f.pic}</div>`;
    return h + t;
  };
  const cardAt = i => { const c0 = H.cards[i]; return c0.render ? Object.assign({}, c0, c0.render(S.opts)) : c0; };
  function paint(dir){
    const c = cardAt(H.i);
    revealed = false;
    flip.style.transition = "none"; flip.classList.remove("revealed");
    void flip.offsetWidth; flip.style.transition = "";
    frontIn.innerHTML = face(c.front); backIn.innerHTML = face(c.back);
    flip.style.setProperty("--bc", c.colour || "");
    flip.querySelector(".face.back").style.setProperty("--bc", c.colour || "");
    flip.querySelector(".face.front").style.borderColor = c.frontColour || "";
    flip.classList.remove("deal", "dealBack"); void flip.offsetWidth;
    if(dir) flip.classList.add(dir > 0 ? "deal" : "dealBack");
    $("countChip").textContent = "Card " + (H.i + 1);
    $("prevBtn").disabled = H.i <= 0;
    flipLabel();
    fitText();
    startThink();
  }
  function next(){
    if(H.i < H.cards.length - 1){ H.i++; paint(1); return; }
    H.cards.push(makeCard()); H.i = H.cards.length - 1; seen++; paint(1); tally();
  }
  function prev(){ if(H.i > 0){ H.i--; paint(-1); } }
  function toggle(){
    revealed = !revealed;
    flip.classList.toggle("revealed", revealed);
    if(revealed){ flipped++; tally(); const bi = backIn; bi.classList.remove("pop"); void bi.offsetWidth; bi.classList.add("pop"); stopThink(); }
    flipLabel();
  }
  function flipLabel(){
    const b = $("flipBtn");
    b.textContent = revealed ? "Flip back" : "Flip";
    b.classList.toggle("isBack", revealed);
  }
  function restart(){ H.cards = []; H.i = -1; seen = 0; flipped = 0; next(); }
  function chooseSet(id){
    if(!D.sets.some(s => s.id === id)) return;
    S.set = id; save(); paintSets(); restart();
  }
  function tally(){ $("tally").innerHTML = `<span>${seen} card${seen === 1 ? "" : "s"} shown</span><span>${flipped} flipped</span>`; }

  /* ---------------------------------------------------------- the set list */
  function paintSets(){
    $("setList").innerHTML = D.sets.map((s, i) => `<button class="setBtn" type="button" data-set="${s.id}" aria-pressed="${s.id === S.set}">`
      + `<span class="sn"><span class="num">${i + 1}</span>${esc(s.name)}</span>${s.sub ? `<span class="ss">${s.sub}</span>` : ""}${s.ex ? `<span class="se">${s.ex}</span>` : ""}</button>`).join("");
    const set = currentSet();
    $("setChip").textContent = set.chip || set.name;
    const p = set.prompt != null ? set.prompt : D.prompt;
    $("prompt").innerHTML = typeof p === "function" ? p(set, S.opts) : (p || "");
  }
  $("setList").addEventListener("click", e => { const b = e.target.closest(".setBtn"); if(b) chooseSet(b.dataset.set); });

  /* ---------------------------------------------------------- size: the card fills the board, the text fills the card */
  function fitCard(){
    const st = $("stage"), r = st.getBoundingClientRect();
    const availW = Math.max(260, r.width - 8), availH = Math.max(200, r.height - 14);
    const ratio = D.ratio || 1.7;
    let w = Math.min(availW, availH * ratio, 1180), h = w / ratio;
    if(h > availH){ h = availH; w = h * ratio; }
    if(window.innerWidth <= 980){ w = Math.min(availW, 760); h = window.innerWidth <= 640 ? Math.max(260, Math.min(w * .95, window.innerHeight * .56)) : Math.max(240, Math.min(w / ratio, window.innerHeight * .5)); }
    const sc = $("scene"); sc.style.setProperty("--cw", w + "px"); sc.style.setProperty("--ch", h + "px");
    fitText();
  }
  function fitOne(inner, faceEl){
    const base = Math.max(22, Math.min(faceEl.clientHeight * (D.fontScale || .26), faceEl.clientWidth * .14));
    let fs = base;
    inner.style.setProperty("--fs", fs + "px");
    const pad = 2 * parseFloat(getComputedStyle(faceEl).paddingLeft || 0);
    const maxW = faceEl.clientWidth - pad, maxH = faceEl.clientHeight - 2 * parseFloat(getComputedStyle(faceEl).paddingTop || 0);
    /* pictures are sized first, from the card; then only the text is shrunk to fit around them */
    const alone = inner.children.length === 1;
    inner.querySelectorAll(".facePic:not(.side) svg,.facePic:not(.side) img").forEach(p => { p.style.maxHeight = Math.max(60, maxH * (alone ? .98 : .66)) + "px"; p.style.maxWidth = maxW + "px"; });
    let k = 0;
    while(k++ < 40 && fs > 12 && (inner.scrollWidth > maxW + 1 || inner.scrollHeight > maxH + 1 || [...inner.children].some(ch => ch.scrollWidth > maxW + 1))){
      fs *= .93; inner.style.setProperty("--fs", fs + "px");
    }
  }
  function fitText(){
    const faces = flip.querySelectorAll(".face");
    fitOne(frontIn, faces[0]); fitOne(backIn, faces[1]);
  }
  new ResizeObserver(() => fitCard()).observe($("stage"));
  window.addEventListener("resize", fitCard);

  /* ---------------------------------------------------------- think time */
  let tTimer = null;
  function stopThink(){ clearInterval(tTimer); tTimer = null; $("think").hidden = true; }
  function startThink(){
    stopThink();
    if(!S.think) return;
    const T = S.think * 1000, t0 = performance.now(), C = 2 * Math.PI * 19, arc = $("thinkArc");
    arc.style.strokeDasharray = C; $("think").hidden = false;
    const tick = () => {
      const left = Math.max(0, T - (performance.now() - t0));
      arc.style.strokeDashoffset = C * (1 - left / T);
      $("thinkTxt").textContent = Math.ceil(left / 1000);
      if(left <= 0){ clearInterval(tTimer); tTimer = null; $("thinkTxt").textContent = "✓"; }
    };
    tick(); tTimer = setInterval(tick, 100);
  }
  $("thinkSel").addEventListener("change", e => { S.think = +e.target.value; $("timerBtn").setAttribute("aria-pressed", String(S.think > 0)); save(); if(!revealed) startThink(); });
  $("timerBtn").addEventListener("click", () => {
    const steps = [0, 5, 10, 15, 20, 30], i = steps.indexOf(S.think);
    S.think = steps[(i + 1) % steps.length] || 0;
    if(S.think === 0 && i === -1) S.think = 10;
    $("thinkSel").value = String(S.think); $("timerBtn").setAttribute("aria-pressed", String(S.think > 0));
    $("timerBtn").title = S.think ? `Think time: ${S.think} s (T)` : "Think-time timer (T)";
    save(); if(!revealed) startThink(); else stopThink();
  });

  /* ---------------------------------------------------------- menus */
  const menus = [["settingsBtn", "settingsMenu"], ["toolsBtn", "toolsMenu"]];
  const closeMenus = except => menus.forEach(([b, m]) => { if(m !== except){ $(m).classList.remove("open"); $(b).setAttribute("aria-expanded", "false"); } });
  menus.forEach(([b, m]) => $(b).addEventListener("click", e => { e.stopPropagation(); const open = !$(m).classList.contains("open"); closeMenus(m); $(m).classList.toggle("open", open); $(b).setAttribute("aria-expanded", String(open)); }));
  document.addEventListener("click", e => { if(!e.target.closest(".menuWrap")) closeMenus(); });
  document.querySelectorAll("[data-opt]").forEach(el => el.addEventListener("change", () => {
    const o = (D.settings || []).find(x => x.id === el.dataset.opt);
    S.opts[o.id] = el.type === "checkbox" ? el.checked : el.value; save();
    if(o.repaint){ const was = revealed; paint(0); if(was) toggle(); }
    else { if(D.onSetting) D.onSetting(o.id, S.opts); paintSets(); restart(); }
  }));

  /* ---------------------------------------------------------- buttons, keys */
  $("flipBtn").addEventListener("click", toggle);
  $("nextBtn").addEventListener("click", next);
  $("prevBtn").addEventListener("click", prev);
  $("scene").addEventListener("click", toggle);
  $("againBtn").addEventListener("click", restart);
  function setPanel(on){ S.panel = on; app.classList.toggle("noPanel", !on); $("panelBtn").setAttribute("aria-pressed", String(on)); save(); requestAnimationFrame(fitCard); }
  $("panelBtn").addEventListener("click", () => setPanel(!S.panel));
  function setFS(on){
    app.classList.toggle("fs", on);
    $("fsBtn").querySelector(".fsIn").hidden = on; $("fsBtn").querySelector(".fsOut").hidden = !on;
    try {
      if(on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      if(!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch(e){}
    requestAnimationFrame(fitCard);
  }
  $("fsBtn").addEventListener("click", () => setFS(!app.classList.contains("fs")));
  document.addEventListener("fullscreenchange", () => { if(!document.fullscreenElement && app.classList.contains("fs")) setFS(false); });
  document.addEventListener("keydown", e => {
    if(e.target.closest("input,select,textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if(k === "Escape"){ closeMenus(); if(app.classList.contains("fs")) setFS(false); return; }
    if(k === "Enter" || k === "r" || k === "R" || k === "ArrowUp" || k === "ArrowDown"){ e.preventDefault(); toggle(); return; }
    if(k === " " || k === "ArrowRight" || k === "n" || k === "N"){ e.preventDefault(); next(); return; }
    if(k === "ArrowLeft" || k === "b" || k === "B"){ e.preventDefault(); prev(); return; }
    if(k === "Home"){ e.preventDefault(); restart(); return; }
    if(k === "f" || k === "F"){ setFS(!app.classList.contains("fs")); return; }
    if(k === "p" || k === "P"){ setPanel(!S.panel); return; }
    if(k === "t" || k === "T"){ $("timerBtn").click(); return; }
    if(/^[1-9]$/.test(k) && D.sets[+k - 1]){ chooseSet(D.sets[+k - 1].id); }
  });
  /* a button that was clicked keeps focus and would swallow the next Enter/Space */
  document.addEventListener("pointerup", e => { const b = e.target.closest("button"); if(b && !b.closest(".dropMenu")) setTimeout(() => b.blur(), 0); });

  /* ---------------------------------------------------------- start (after any images have loaded) */
  function start(){ paintSets(); tally(); fitCard(); restart(); requestAnimationFrame(fitCard); }
  if(D.preload && D.preload.length){
    const ov = document.createElement("div");
    ov.className = "loading";
    ov.innerHTML = '<div class="box"><b>Loading the cards…</b><div class="bar"><span id="ldBar"></span></div></div>';
    document.body.appendChild(ov);
    let done = 0;
    const one = () => { done++; $("ldBar").style.width = (100 * done / D.preload.length) + "%"; if(done === D.preload.length){ ov.remove(); start(); } };
    D.preload.forEach(u => { const im = new Image(); im.onload = one; im.onerror = one; im.src = u; });
  } else start();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);

  window.__FLIP__ = { S, H, next, prev, toggle, restart, chooseSet, get revealed(){ return revealed; }, fitText, deck:D };
})();
