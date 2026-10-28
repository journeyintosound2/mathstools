/**
 * MMT PORTAL → QUIZ SIGN-IN HANDOFF (2026-10-29).
 *
 * A student who is signed in to the Student Platform and presses Start / Try
 * again on a task should land in the quiz already signed in, not be asked for
 * their code again.
 *
 * HOW: when a link is clicked in the portal, `MMTHandoff.link(href, code)`
 * writes a one-use ticket { code, exp } to localStorage under a random nonce and
 * adds `#mmt-handoff=<nonce>` to the link. The quiz page loads this script; it
 * reads the nonce from the URL, takes the ticket (deleting it), strips the hash,
 * and — if the ticket is fresh — types the code into the page's own code box and
 * presses the page's own sign-in button. So every quiz still signs in through
 * its OWN normal path (the server checks the code exactly as if it were typed).
 *
 * WHY A TICKET AND NOT JUST "IS SOMEONE SIGNED IN?": school computers are
 * shared. A quiz opened any other way (bookmark, history, typed URL, another
 * student's link) still asks for the code. A ticket lives TICKET_MS, works once,
 * and only the portal (which already holds the code after sign-in) can make one.
 * After it is used, the code is remembered in THIS TAB'S sessionStorage only, so
 * reloading the quiz tab keeps the student signed in; closing the tab forgets it.
 *
 * QUIZ PAGES: load it in <head> with the ids of their code box and button:
 *   <script src="/portal/shared/portalHandoff.js?v=…" data-input="#codeInput"
 *           data-button="#loginBtn"></script>
 * quizAuthUI.js loads it itself (for #mmtCodeInput / #mmtLoginBtn).
 */
(function () {
  "use strict";
  if (window.MMTHandoff) return;
  var PREFIX = "mmt-handoff:", TAB_KEY = "mmt-handoff-tab", TICKET_MS = 3 * 60 * 1000;
  var HASH_RE = /(^#|&)mmt-handoff=([A-Za-z0-9]+)/;

  function normal(c) { return String(c || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, ""); }
  function ls(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }
  function ss(fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } }

  /* ---------------- portal side ---------------- */
  function prune(all) {
    ls(function (s) {
      var now = Date.now(), dead = [];
      for (var i = 0; i < s.length; i++) {
        var k = s.key(i); if (!k || k.indexOf(PREFIX) !== 0) continue;
        var t = null; try { t = JSON.parse(s.getItem(k)); } catch (e) {}
        if (all || !t || !(t.exp > now)) dead.push(k);
      }
      dead.forEach(function (k) { s.removeItem(k); });
    });
  }
  function issue(code) {
    code = normal(code); if (!code) return null;
    var nonce = "";
    try { var a = new Uint8Array(12); crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) nonce += (a[i] % 36).toString(36); }
    catch (e) { nonce = Math.random().toString(36).slice(2) + Date.now().toString(36); }
    prune(false);
    var ok = ls(function (s) { s.setItem(PREFIX + nonce, JSON.stringify({ code: code, exp: Date.now() + TICKET_MS })); return true; });
    return ok ? nonce : null;
  }
  /** The link with a fresh one-use ticket on it (or unchanged if storage is blocked). */
  function link(href, code) {
    var nonce = issue(code); if (!nonce) return href;
    try {
      var u = new URL(href, location.href);
      var h = (u.hash || "").replace(/^#/, "").split("&").filter(function (p) { return p && p.indexOf("mmt-handoff=") !== 0; });
      h.push("mmt-handoff=" + nonce);
      u.hash = h.join("&");
      return u.href;
    } catch (e) { return href; }
  }

  /* ---------------- quiz side ---------------- */
  var claimed = false, claimedCode = null;
  function claim() {
    if (claimed) return claimedCode;
    claimed = true;
    var m = HASH_RE.exec(location.hash || "");
    if (m) {
      var key = PREFIX + m[2];
      var raw = ls(function (s) { var v = s.getItem(key); s.removeItem(key); return v; });
      // tidy the URL so the nonce isn't bookmarked, copied or reused
      try {
        var rest = location.hash.replace(/^#/, "").split("&").filter(function (p) { return p && p.indexOf("mmt-handoff=") !== 0; }).join("&");
        history.replaceState(history.state, "", location.pathname + location.search + (rest ? "#" + rest : ""));
      } catch (e) {}
      var t = null; try { t = JSON.parse(raw); } catch (e) {}
      if (t && t.exp > Date.now() && normal(t.code)) {
        claimedCode = normal(t.code);
        ss(function (s) { s.setItem(TAB_KEY, claimedCode); });
      }
    } else {
      claimedCode = normal(ss(function (s) { return s.getItem(TAB_KEY); })) || null;
    }
    return claimedCode;
  }
  /** Cheap check, no side effects: might this page have been opened from the portal? */
  function pending() {
    return HASH_RE.test(location.hash || "") || !!ss(function (s) { return s.getItem(TAB_KEY); });
  }
  function forget() { claimedCode = null; ss(function (s) { s.removeItem(TAB_KEY); }); }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    if (!el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden";
  }
  /**
   * Type the handed-off code into the page's own code box and press its own
   * sign-in button, once both are on screen. Retries a few times (some pages
   * finish connecting to Firebase a moment after they appear) but stops as soon
   * as the box disappears (signed in) or the student starts typing their own.
   * Returns true if there is a code to use.
   */
  function autofill(inputSel, buttonSel, opts) {
    var code = claim(); if (!code) return false;
    opts = opts || {};
    var tries = 0, MAX = 4, started = Date.now(), filled = false, lastClick = 0;
    function tick() {
      var input = document.querySelector(inputSel), btn = document.querySelector(buttonSel);
      if (filled && (!visible(input) || normal(input && input.value) !== code)) return done(true);
      if (Date.now() - started > 20000 || tries >= MAX) return done(false);
      if (visible(input) && btn && !btn.disabled) {
        if (!filled || Date.now() - lastClick > 4000) {
          input.value = code;
          try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
          filled = true; tries++; lastClick = Date.now();
          btn.click();
        }
      }
      setTimeout(tick, 250);
    }
    function done(ok) { if (typeof opts.onDone === "function") { try { opts.onDone(ok); } catch (e) {} } }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(tick, 150); });
    else setTimeout(tick, 150);
    return true;
  }

  window.MMTHandoff = { link: link, issue: issue, clearAll: function () { prune(true); },
                        claim: claim, pending: pending, forget: forget, autofill: autofill };

  // <script … data-input="#x" data-button="#y"> wires itself up.
  var me = document.currentScript;
  if (me && me.getAttribute("data-input") && me.getAttribute("data-button")) {
    autofill(me.getAttribute("data-input"), me.getAttribute("data-button"));
  }
})();
