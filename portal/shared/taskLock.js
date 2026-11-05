/* MMT TASK LOCK (2026-11-05)
 * On a task link (?assignment=1 or ?types=…) the quiz IS the task: the student
 * should not be able to step out to the level menu, the type chooser or another
 * part of the site from inside the page. Teacher request, after students left
 * their set level to try ones they weren't ready for.
 *
 * One tag in a quiz's <head>, listing that quiz's own controls:
 *   <script src="/portal/shared/taskLock.js?v=…"
 *           data-restart="#menuBtn,#resetBtn"   (these start the SAME task again)
 *           data-hide="#backBtn,a.brand"></script>  (these disappear)
 * Restart = reload the task link, so the quiz starts its task exactly as it did
 * the first time (signed in again from the tab's own session where it has one).
 * The portals ALSO only count attempts made from the task's own link
 * (quizInsights.recordFitsTask), so leaving by typing another address gains nothing.
 * Does nothing at all on a plain quiz URL.
 */
(function () {
  "use strict";
  var me = document.currentScript;
  var p = new URLSearchParams(location.search);
  if (!(p.get("assignment") === "1" || p.has("types"))) return;
  var restart = ((me && me.getAttribute("data-restart")) || "").trim();
  var hide = ((me && me.getAttribute("data-hide")) || "").trim();
  var LABEL = "↻ Start this task again";

  document.documentElement.classList.add("mmt-task-locked");
  var css = document.createElement("style");
  css.textContent = hide ? hide.split(",").map(function (s) { return s.trim() + "{display:none!important}"; }).join("") : "";
  (document.head || document.documentElement).appendChild(css);

  if (hide) {
    // A hidden exit stays shut even if something clicks it in code or by keyboard.
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest(hide);
      if (t) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
  }
  if (restart) {
    // Capture phase, so the quiz's own handler (which opens the level menu) never runs.
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest(restart);
      if (!t) return;
      e.preventDefault(); e.stopImmediatePropagation();
      location.reload();
    }, true);
    // Say what the button now does, and keep saying it when the quiz repaints its labels.
    var paint = function () {
      document.querySelectorAll(restart).forEach(function (b) {
        if (b.textContent.trim() !== LABEL) { b.textContent = LABEL; b.title = "Start your teacher's task again from the beginning"; }
      });
    };
    var start = function () {
      paint();
      try { new MutationObserver(paint).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {}
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  }
})();
