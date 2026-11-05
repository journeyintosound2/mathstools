/* MMT LEGACY QUIZ SKIN (2026-11-06)
 * Gives the five older whole-topic quizzes (Integers, FDP, Algebraic Techniques,
 * Equations, Angle Relationships) the same look as the shared topic-quiz engine:
 * the dark MMT top bar with the quiz title, the account / level chips and the
 * language picker moved up into it, a slim question row, and the early-submit
 * button beside Skip. Styling is in legacy-skin.css.
 *
 * It only MOVES the quiz's own elements (ids unchanged, nothing re-created), so
 * every handler, the teacher builder and the portal's hidden-frame builder keep
 * working. Load with:
 *   <script src="/online-quizzes/stage-4/topic-quiz/legacy-skin.js?v=…" data-title="Equations — Whole-topic Quiz" defer></script>
 */
(function () {
  "use strict";
  var me = document.currentScript;
  var TITLE = (me && me.getAttribute("data-title")) || document.title || "Whole-topic Quiz";
  var p = new URLSearchParams(location.search);
  var TASK = p.get("assignment") === "1" || p.has("types");

  function $(s, r) { return (r || document).querySelector(s); }

  function build() {
    if (document.querySelector(".mmtTopbar.legacy")) return;
    document.documentElement.classList.add("mmt-skin");

    // --- top bar ---
    var bar = document.createElement("header");
    bar.className = "mmtTopbar legacy";
    bar.innerHTML =
      '<a class="mmtBrand" href="https://www.millsmathstools.au" aria-label="Back to Mills Maths Tools">' +
      '<span class="mmtBrandLogo" aria-hidden="true">MMT</span>' +
      '<span class="mmtBrandText"><strong>MMT</strong><span>Mills Maths Tools</span></span></a>' +
      '<div class="mmtTopTitle"></div><div class="topActions"></div>';
    bar.querySelector(".mmtTopTitle").textContent = TITLE;
    if (TASK) { var a = bar.querySelector(".mmtBrand"); a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
    document.body.insertBefore(bar, document.body.firstChild);
    var acts = bar.querySelector(".topActions");

    // Thin progress strip under the bar (the quiz's own .bar, so #barFill keeps updating).
    var progBar = $(".progressRow .bar");
    if (progBar) { var strip = document.createElement("div"); strip.className = "mmtStrip"; strip.appendChild(progBar); bar.after(strip); }

    // Language picker, achievements, account chips and the level chip move up into the bar.
    var top = $(".topRow");
    if (top) {
      var lang = top.querySelector(".languageSelectCard");
      ["#achievementsBtn", "#accessChip", "#studentChip", "#changeCodeBtn"].forEach(function (s) { var e = top.querySelector(s); if (e) acts.appendChild(e); });
      if (lang) acts.insertBefore(lang, acts.firstChild);
      var lvl = top.querySelector("#levelChipText");
      lvl = lvl && lvl.closest(".chip");
      if (lvl) { lvl.classList.add("mmtLevelChip"); acts.appendChild(lvl); }
    }

    // Question row: "Question 1/15" on the left, the quiz's remaining controls on the right.
    var row = $(".progressRow");
    if (row && top) { row.appendChild(top); top.classList.add("mmtTools"); }

    // Early submit sits with Skip, as in the newer quizzes.
    var slot = $("#mmtSubmitSlot"), skip = $("#skipBtn");
    if (slot && skip && skip.parentElement) { skip.parentElement.classList.add("mmtNav"); skip.parentElement.insertBefore(slot, skip); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
