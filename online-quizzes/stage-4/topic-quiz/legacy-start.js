/* MMT — START SCREEN FOR THE FIVE OLDER WHOLE-TOPIC QUIZZES (2026-11-28)
 * Integers, FDP, Algebraic Techniques, Equations and Angle Relationships keep
 * their own engines. This gives them the SAME start screen as the 11 quizzes
 * on the shared engine (start-screen.js), by driving their own menus:
 *
 *   * it reads each level's question types (and any options) from the quiz's
 *     own type chooser: press .startPill[data-level], read #typesGrid
 *     checkboxes and any other checkbox in #typeOverlay. It does this once per
 *     language at load (the quiz translates its own labels), so switching
 *     language never touches a quiz in progress;
 *   * Start = press .startPill, set the ticks, #countInp and the options, then
 *     press the quiz's own #beginBtn. Everything after that is the quiz's.
 *   * the quiz's #levelOverlay and #typeOverlay are never seen: whenever the
 *     quiz opens one of them (Back, "Back to level menu"…) the start screen
 *     opens instead.
 *
 * Only on the plain URL (the student quiz). ?builder=1 is the teacher's link
 * builder and ?assignment=1 / ?types= a teacher-set task: both are left alone.
 *
 * Load in <head> (it hides the quiz until the start screen is ready):
 *   <link rel="stylesheet" href="/online-quizzes/stage-4/topic-quiz/start-screen.css?v=…">
 *   <script src="/online-quizzes/stage-4/topic-quiz/start-screen.js?v=…" defer></script>
 *   <script src="/online-quizzes/stage-4/topic-quiz/legacy-start.js?v=…" defer
 *     data-id="integers" data-title="Computation with Integers" data-outcome="MA4-INT-C-01"
 *     data-basic="…" data-expected="…"></script>
 */
(function () {
  "use strict";
  var me = document.currentScript;
  var P = new URLSearchParams(location.search);
  if (P.get("builder") === "1" || P.get("assignment") === "1" || P.has("types")) return;
  var CFG = {
    id: me.getAttribute("data-id") || location.pathname,
    title: me.getAttribute("data-title") || document.title,
    outcome: me.getAttribute("data-outcome") || "",
    sub: { basic: me.getAttribute("data-basic") || "", expected: me.getAttribute("data-expected") || "" }
  };
  var root = document.documentElement;
  root.classList.add("mmtStudentStart", "stBoot");

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var busy = false;         // true while this script is driving the quiz's own menus
  var SCAN = {};            // { lang: { basic:{name, types, options, count}, expected:{…} } }
  var SS = null;

  function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }
  function langSel() { return $("#startLanguageSelect") || $("#languageSelect"); }
  function curLang() { var s = $("#languageSelect") || langSel(); return (s && s.value) || "en"; }
  function closeOverlays() {
    ["#levelOverlay", "#typeOverlay"].forEach(function (s) { var o = $(s); if (o) o.classList.remove("show"); });
    if (!$(".overlay.show")) document.body.classList.remove("modalOpen");
  }
  function typeId(inp) { return inp.value && inp.value !== "on" ? inp.value : (inp.dataset.id || inp.value); }
  function labelHTML(lab, inp) {
    var c = lab.cloneNode(true), i = c.querySelector("input"); if (i) i.remove();
    var html = c.innerHTML.trim();
    return html || (inp && typeId(inp)) || "";
  }

  /* Read one level from the quiz's own type chooser (in the current language). */
  function readLevel(level) {
    var pill = $('.startPill[data-level="' + level + '"]'); if (!pill) return null;
    pill.click();
    var grid = $("#typesGrid"), ov = $("#typeOverlay"), cnt = $("#countInp");
    var types = $$("input[type=checkbox]", grid).map(function (inp) {
      return { id: typeId(inp), html: labelHTML(inp.closest("label") || inp.parentNode, inp) };
    });
    var options = $$("input[type=checkbox][id]", ov).filter(function (inp) {
      if (grid.contains(inp)) return false;
      for (var e = inp; e && e !== ov; e = e.parentElement) if (e.style.display === "none") return false;
      return true;
    }).map(function (inp) {
      var lab = inp.closest("label") || $('label[for="' + inp.id + '"]');
      return { id: inp.id, html: lab ? labelHTML(lab, inp) : inp.id, def: inp.checked };
    });
    var nameEl = $("#" + level + "Name");
    return { types: types, options: options, name: nameEl ? nameEl.textContent.trim() : "",
      min: cnt ? Number(cnt.min) || 5 : 5, max: cnt ? Number(cnt.max) || 60 : 60, def: cnt ? Number(cnt.value) || 15 : 15 };
  }

  function scanAll() {
    busy = true;
    // Reading the menus opens and closes the quiz's overlays, and some quizzes close
    // every other overlay when one opens (FDP's sign-in). Put back whatever was open.
    var open = $$(".overlay.show, .firebaseOverlay.show").filter(function (o) { return o.id !== "levelOverlay" && o.id !== "typeOverlay"; });
    var sel = langSel(), keep = curLang();
    var langs = sel ? $$("option", sel).map(function (o) { return o.value; }) : ["en"];
    if (langs.indexOf("en") < 0) langs.unshift("en");
    langs.forEach(function (lg) {
      if (sel && sel.value !== lg) { sel.value = lg; fire(sel, "change"); }
      SCAN[lg] = { basic: readLevel("basic"), expected: readLevel("expected") };
    });
    if (sel && sel.value !== keep) { sel.value = keep; fire(sel, "change"); }
    closeOverlays();
    open.forEach(function (o) { o.classList.add("show"); });
    if (open.length) document.body.classList.add("modalOpen");
    busy = false;
  }

  var EN = { basic: "Basic", expected: "Expected" };
  function levels() {
    var lg = curLang(), here = SCAN[lg] || SCAN.en, en = SCAN.en;
    return ["basic", "expected"].filter(function (k) { return en[k] && en[k].types.length; }).map(function (k) {
      var h = (here && here[k]) || en[k];
      var types = en[k].types.map(function (t, i) {
        var loc = h.types[i] && h.types[i].id === t.id ? h.types[i].html : t.html;
        return { id: t.id, html: loc };
      });
      var alt = lg !== "en" && h.name && h.name !== EN[k] && h.name !== en[k].name ? h.name : "";
      return { key: k, name: EN[k], alt: alt, sub: CFG.sub[k], types: types, options: h.options.length ? h.options : en[k].options };
    });
  }

  function begin(level, ids, n, opts) {
    busy = true;
    var pill = $('.startPill[data-level="' + level + '"]'); pill.click();
    $$("#typesGrid input[type=checkbox]").forEach(function (inp) {
      var want = ids.indexOf(typeId(inp)) >= 0;
      if (inp.checked !== want) { inp.checked = want; fire(inp, "change"); }
    });
    Object.keys(opts || {}).forEach(function (id) {
      var inp = document.getElementById(id);
      if (inp && inp.checked !== !!opts[id]) { inp.checked = !!opts[id]; fire(inp, "change"); }
    });
    var cnt = $("#countInp");
    if (cnt) {
      var lo = Number(cnt.min) || 1, hi = Number(cnt.max) || 60;
      cnt.value = String(Math.max(lo, Math.min(hi, n))); fire(cnt, "input"); fire(cnt, "change");
    }
    SS.hide();
    root.classList.remove("stOn");
    $("#beginBtn").click();
    closeOverlays();
    busy = false;
  }

  function counts() {
    var en = SCAN.en.basic || SCAN.en.expected, lo = en ? en.min : 5, hi = en ? en.max : 60;
    var c = [5, 10, 15, 20, 30].filter(function (x) { return x >= lo && x <= hi; });
    return c.length ? c : [lo];
  }

  /* The quiz opened its own level or type menu: show the start screen instead. */
  function watch() {
    var mo = new MutationObserver(function () {
      if (busy) return;
      var lvl = $("#levelOverlay"), typ = $("#typeOverlay");
      var wantLvl = lvl && lvl.classList.contains("show"), wantTyp = typ && typ.classList.contains("show");
      if (!wantLvl && !wantTyp) return;
      var level = null;
      if (wantTyp) {
        var first = $("#typesGrid input[type=checkbox]");
        if (first) { var id = typeId(first); ["basic", "expected"].forEach(function (k) { if (SCAN.en[k] && SCAN.en[k].types.some(function (t) { return t.id === id; })) level = k; }); }
      }
      busy = true; closeOverlays(); busy = false;
      show(level);
    });
    ["#levelOverlay", "#typeOverlay"].forEach(function (s) { var o = $(s); if (o) mo.observe(o, { attributes: true, attributeFilter: ["class"] }); });
  }

  function show(level, overQuiz) {
    SS.show({ level: level || undefined, inQuiz: !!overQuiz });
    root.classList.add("stOn");
    document.body.classList.remove("modalOpen");
  }

  function boot() {
    if (!window.MMTStartScreen || !$("#levelOverlay") || !$("#typeOverlay") || !$(".startPill")) { root.classList.remove("mmtStudentStart", "stBoot"); return; }
    scanAll();
    if (!SCAN.en || !(SCAN.en.basic || SCAN.en.expected)) { root.classList.remove("mmtStudentStart", "stBoot"); return; }
    var wrap = $(".wrap");
    SS = window.MMTStartScreen.create({
      before: wrap,
      prefsId: CFG.id,
      eyebrow: [CFG.outcome && /^MA(\d)/.test(CFG.outcome) ? "Stage " + CFG.outcome.charAt(2) : "", "Whole-topic quiz", CFG.outcome].filter(Boolean).join(" · "),
      title: CFG.title,
      counts: counts(), defaultCount: 15,
      levels: levels,
      onStart: begin,
      onResume: function () { SS.hide(); root.classList.remove("stOn"); }
    });
    // "Change level" in the top bar, as on the other whole-topic quizzes. It opens the
    // start screen OVER the quiz without touching it, so "Back to my quiz" can return.
    var acts = $(".mmtTopbar .topActions");
    if (acts) {
      var cb = document.createElement("button");
      cb.type = "button"; cb.className = "stTopBtn"; cb.textContent = "Change level";
      cb.addEventListener("click", function () { show(null, true); });
      acts.appendChild(cb);
    }
    watch();
    ["#languageSelect", "#startLanguageSelect"].forEach(function (s) { var e = $(s); if (e) e.addEventListener("change", function () { if (!busy && SS) SS.repaint(); }); });
    // Enter on the start screen must not reach a quiz that is still loaded behind it.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && root.classList.contains("stOn") && !(e.target && e.target.closest && e.target.closest(".start, .firebaseOverlay, .overlay"))) e.stopImmediatePropagation();
    }, true);
    show(null);
    root.classList.remove("stBoot");
  }

  if (document.readyState === "complete") setTimeout(boot, 0);
  else document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
})();
