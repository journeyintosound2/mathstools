/* ==========================================================================
   MMT FULL SCREEN — shared by every game in /games (added 2026-10-16)
   --------------------------------------------------------------------------
   One <script> tag per game, just before </body>:

     <script src="shared/mmt-fullscreen.js" data-icon-host=".board-wrap" defer></script>

   What it does:
   * Puts a "Full screen" button first in the banner's button row (styled like
     the game's own Rules button). It must NEVER add a row to the banner (that
     would shrink the board for everyone): if the label would make the banner
     wrap it becomes icon-only, and if even that wraps and the game has an
     on-screen icon, the banner button steps aside (normal mode only).
   * Full screen = html.mmt-focus: the banner shrinks to ONE slim row (every
     game button still there), the footer hides, and where the browser allows it
     (iPad Safari, desktops) the page also goes truly full screen. iPhones have
     no element full screen; the slim layout still does the job there.
   * Optional on-screen icon (data-icon-host = CSS selector; the first VISIBLE
     match is used and the icon follows it if the game swaps screens):
       data-icon-pos="end" (most games): appended as the LAST item of the
         game's own top row (its toolbar, or its turn card) — the spot video
         and game players use, and it can never cover a square or a number.
       data-icon-pos="tr|tl|br|bl": pinned in that corner of the host — only
         for boards drawn with an empty margin there.
     data-icon-inset / data-icon-size in px. If the game rebuilds the host's
     contents, the icon is put back.
   * Keys: F toggles, Esc leaves (but never steals Esc from an open pop-up —
     the check runs in the CAPTURE phase, before the game closes it).
   * After every change it fires window 'resize' (twice), because most games
     size their board in a resize handler, and a 'mmt-fullscreen' event.
   API: window.MMTFullscreen.{enter, exit, toggle, isOn}
   * Optional measured fit, FULL SCREEN ONLY (normal mode is never touched):
       data-fit        the board element whose width sets its size (it must
                       scale with its width: an SVG, an aspect-ratio box, …)
       data-fit-bottom an element that must stay on screen below it (a keypad,
                       a running total); default = the board itself
       data-fit-gap    px kept free under it (default 14)
       data-fit-max    largest width in px (default 1400)
       data-fit-height 'square' also sets height = width (for boards with a
                       fixed CSS height)
       data-fit-mode   'width' (default): inline width on the board.
                       'var': sets --mmt-fit on <html> instead, for games with
                       several boards or a size variable; the game's own CSS
                       reads it (html.mmt-focus … { width: var(--mmt-fit) }).
                       'zoom': CSS zoom on the board, for boards drawn at fixed
                       pixel sizes; data-fit-max is then the largest factor.
     It binary-searches the largest width at which that bottom edge is on
     screen, nothing scrolls sideways, and no overflow-clipping ancestor cuts
     the board off. Games that already size themselves in JS (e.g. Capture the
     Grid, Crosswise, Crack the Equation) do not use it.
   ========================================================================== */
(function () {
  if (window.MMTFullscreen) return;
  var me = document.currentScript || {};
  var ds = me.dataset || {};
  var cfg = {
    host: ds.iconHost || '',
    pos: ds.iconPos || 'tr',
    inset: +(ds.iconInset || 8),
    size: +(ds.iconSize || 36),
    banner: ds.banner !== 'off',
    fit: ds.fit || '',
    fitBottom: ds.fitBottom || '',
    fitGap: +(ds.fitGap || 14),
    fitMax: +(ds.fitMax || 1400),
    fitMin: +(ds.fitMin || 220),
    fitHeight: ds.fitHeight || '',
    fitMode: ds.fitMode || 'width'
  };
  var root = document.documentElement;
  var IN = '<svg class="mmt-fs-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  var OUT = '<svg class="mmt-fs-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>';
  var T = {
    en: { on: 'Full screen', off: 'Exit full screen' },
    ar: { on: 'ملء الشاشة', off: 'الخروج من ملء الشاشة' },
    fa: { on: 'تمام صفحه', off: 'خروج از تمام صفحه' }
  };

  var css = [
    '.mmt-fs-btn{display:inline-flex!important;align-items:center;gap:6px;white-space:nowrap;}',
    '.mmt-fs-ico{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;}',
    'html.mmt-focus .mmt-fs-btn{background:#fff!important;color:#1d4ed8!important;border-color:#fff!important;}',
    '.mmt-fs-btn.mmt-fs-compact>span{display:none;}',
    '.mmt-fs-btn.mmt-fs-compact{padding-left:9px!important;padding-right:9px!important;}',
    '.mmt-fs-btn.mmt-fs-gone{display:none!important;}',
    /* the slim banner */
    'html.mmt-focus .brand-footer{display:none!important;}',
    'html.mmt-focus .mmtTopbar{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px!important;min-height:0!important;height:auto!important;padding:6px 14px!important;}',
    'html.mmt-focus .mmtTopbar .mmtBrandText{display:none!important;}',
    'html.mmt-focus .mmtTopbar .mmtBrand{margin:0!important;padding:2px!important;flex:0 0 auto;}',
    'html.mmt-focus .mmtTopbar .mmtBrandLogo{width:30px!important;height:30px!important;}',
    'html.mmt-focus .mmtTopbar .mmtTopTitle{flex:1 1 140px;min-width:0;text-align:left!important;font-size:1.1rem!important;line-height:1.2!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0!important;}',
    'html.mmt-focus .mmtTopbar .actions{flex:0 1 auto;flex-wrap:wrap;justify-content:flex-end;gap:6px!important;margin:0!important;}',
    'html.mmt-focus .mmtTopbar .actions>button,html.mmt-focus .mmtTopbar .actions>a{padding:6px 11px!important;font-size:13px!important;min-height:32px!important;border-radius:10px!important;}',
    'html.mmt-focus .mmtTopbar .language-control{padding:2px 6px!important;}',
    'html.mmt-focus .mmtTopbar .language-control label{display:none!important;}',
    'html.mmt-focus .mmtTopbar .language-control select{height:28px!important;}',
    '@media(max-width:700px){html.mmt-focus .mmtTopbar .mmtTopTitle{display:none!important;}}',
    /* the on-board icon */
    '.mmt-fs-corner{position:absolute;z-index:6;display:grid;place-items:center;padding:0;margin:0;border-radius:11px;border:1px solid #dbe3ef;background:rgba(255,255,255,.94);color:#334155;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,.10);transition:background .16s,color .16s,transform .16s;}',
    '.mmt-fs-corner::before{content:"";position:absolute;inset:-6px;}',
    '.mmt-fs-corner:hover{background:#eff6ff;color:#2563eb;border-color:#bfdbfe;transform:scale(1.06);}',
    '.mmt-fs-corner:focus-visible{outline:3px solid rgba(37,99,235,.45);outline-offset:2px;}',
    '.mmt-fs-corner .mmt-fs-ico{width:56%;height:56%;}',
    '.mmt-fs-corner.mmt-fs-inline{position:relative;flex:0 0 auto;align-self:center;justify-self:end;margin-left:auto;box-shadow:none;}',
    '@media print{.mmt-fs-corner,.mmt-fs-btn{display:none!important;}}'
  ].join('\n');
  var st = document.createElement('style');
  st.id = 'mmt-fullscreen-style';
  st.textContent = css;
  (document.head || root).appendChild(st);

  function lang() { var l = (root.lang || 'en').slice(0, 2).toLowerCase(); return T[l] ? l : 'en'; }
  function isOn() { return root.classList.contains('mmt-focus'); }
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  var realFs = false;

  /* ---- measured fit (full screen only) ---- */
  var fitEl = null, fitT = 0;
  var FIT_PROPS = ['width', 'max-width', 'min-width', 'height', 'flex-basis', 'zoom'];
  function clearFit(el) {
    root.style.removeProperty('--mmt-fit');
    if (!el || !el.__mmtFit) return;
    FIT_PROPS.forEach(function (k) { el.style.removeProperty(k); });
    var o = el.__mmtFit; Object.keys(o).forEach(function (k) { if (o[k]) el.style.setProperty(k, o[k].v, o[k].p); });
    el.__mmtFit = null;
  }
  function fitNow() {
    if (!cfg.fit) return;
    var el = document.querySelector(cfg.fit);
    if (fitEl && fitEl !== el) clearFit(fitEl);
    fitEl = el;
    if (!el) return;
    clearFit(el);
    if (!isOn() || !el.getBoundingClientRect().width) return;
    var o = {}; FIT_PROPS.forEach(function (k) { var v = el.style.getPropertyValue(k); o[k] = v ? { v: v, p: el.style.getPropertyPriority(k) } : null; });
    el.__mmtFit = o;
    var anchor = (cfg.fitBottom && document.querySelector(cfg.fitBottom)) || el;
    var zoom = cfg.fitMode === 'zoom', viaVar = cfg.fitMode === 'var';
    function apply(w) {
      if (zoom) { el.style.setProperty('zoom', String(w / 100)); return; }
      if (viaVar) { root.style.setProperty('--mmt-fit', w + 'px'); return; }
      el.style.setProperty('width', w + 'px', 'important');
      el.style.setProperty('max-width', w + 'px', 'important');
      el.style.setProperty('min-width', '0', 'important');
      el.style.setProperty('flex-basis', 'auto', 'important');
      if (cfg.fitHeight === 'square') el.style.setProperty('height', w + 'px', 'important');
    }
    function ok() {
      var vh = window.innerHeight, ar = anchor.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (ar.bottom + window.scrollY > vh - cfg.fitGap + 0.5) return false;
      if (document.documentElement.scrollWidth > window.innerWidth + 1) return false;
      for (var a = el.parentElement; a && a !== document.body && a !== root; a = a.parentElement) {
        var cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          var ra = a.getBoundingClientRect();
          if (r.right > ra.right + 1 || r.left < ra.left - 1) return false;
          if (cs.overflowY !== 'visible' && ar.bottom > ra.bottom + 1) return false;
        }
      }
      // stays inside every enclosing box (a grid track lets a wide child spill out)
      for (var c = el.parentElement; c && c !== document.body && c !== root; c = c.parentElement) {
        var rc = c.getBoundingClientRect();
        if (r.right > rc.right + 1 || r.left < rc.left - 1) return false;
      }
      // no spilling over a neighbouring column/panel (grid tracks do not clip)
      for (var b = el; b && b !== document.body && b !== root; b = b.parentElement) {
        var rb = b.getBoundingClientRect(), sibs = b.parentElement ? b.parentElement.children : [];
        for (var q = 0; q < sibs.length; q++) {
          var sb = sibs[q]; if (sb === b || sb.classList.contains('mmt-fs-corner')) continue;
          var cq = getComputedStyle(sb);
          if (cq.display === 'none' || cq.position === 'absolute' || cq.position === 'fixed' || cq.visibility === 'hidden') continue;
          var rs = sb.getBoundingClientRect();
          if (!rs.width || !rs.height) continue;
          if (rb.left < rs.right - 1 && rb.right > rs.left + 1 && rb.top < rs.bottom - 1 && rb.bottom > rs.top + 1) return false;
        }
      }
      return true;
    }
    var lo = zoom ? 45 : cfg.fitMin, hi = zoom ? Math.round((+ds.fitMax || 2) * 100) : Math.min(cfg.fitMax, window.innerWidth);
    apply(lo);
    if (!ok()) return;
    for (var k = 0; k < 14 && hi - lo > (zoom ? 1 : 2); k++) {
      var mid = Math.floor((lo + hi) / 2);
      apply(mid);
      if (ok()) lo = mid; else hi = mid;
    }
    apply(lo);
  }
  function scheduleFit(delay) {
    if (!cfg.fit) return;
    clearTimeout(fitT);
    fitT = setTimeout(function () { requestAnimationFrame(fitNow); }, delay == null ? 60 : delay);
  }
  window.addEventListener('resize', function () { scheduleFit(120); });

  function nudge() {
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 350);
    scheduleFit(30);
    setTimeout(function () { scheduleFit(0); }, 700);
  }
  /* never let the banner button add a row to the banner */
  var bannerT = 0, bannerSig = '';
  function fitBanner() {
    if (!bannerBtn) return;
    var tb = bannerBtn.closest('.mmtTopbar') || bannerBtn.parentElement;
    // skip when nothing that affects wrapping has changed (some games re-set their
    // own banner buttons every second, e.g. on a timer tick)
    var sig = [Math.round(tb.getBoundingClientRect().width), isOn() ? 1 : 0, lang(), !!cornerSeen];
    var kids = bannerBtn.parentElement.children;
    for (var k = 0; k < kids.length; k++) if (kids[k] !== bannerBtn) sig.push(Math.round(kids[k].getBoundingClientRect().width));
    sig = sig.join(',');
    if (sig === bannerSig) return;
    bannerSig = sig;
    bannerBtn.classList.remove('mmt-fs-compact', 'mmt-fs-gone');
    bannerBtn.style.setProperty('display', 'none', 'important');   // beats the !important rule
    var h0 = tb.getBoundingClientRect().height;
    bannerBtn.style.removeProperty('display');
    if (tb.getBoundingClientRect().height > h0 + 1) {
      bannerBtn.classList.add('mmt-fs-compact');
      if (tb.getBoundingClientRect().height > h0 + 1 && !isOn()) {
        var icon = document.querySelector('.mmt-fs-corner,#boardFsBtn');
        // step aside if the game has its own on-screen icon — or on a phone, where
        // the banner already wraps and an iPhone cannot go truly full screen anyway
        if ((icon && icon.getBoundingClientRect().width > 0) || window.innerWidth <= 700) { bannerBtn.classList.add('mmt-fs-gone'); }
      }
    }
  }
  function scheduleBanner() { clearTimeout(bannerT); bannerT = setTimeout(function () { requestAnimationFrame(fitBanner); }, 80); }
  window.addEventListener('resize', scheduleBanner);

  function changed() {
    paint();
    scheduleBanner();
    nudge();
    try { window.dispatchEvent(new CustomEvent('mmt-fullscreen', { detail: { on: isOn() } })); } catch (e) {}
  }
  function enter() {
    if (isOn()) return;
    root.classList.add('mmt-focus');
    changed();
    var req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (req) { try { var p = req.call(root); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  }
  function exit() {
    if (!isOn() && !fsEl()) return;
    root.classList.remove('mmt-focus');
    if (fsEl()) {
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      try { var p = ex && ex.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
    realFs = false;
    changed();
  }
  function toggle() { isOn() ? exit() : enter(); }
  function onFsChange() {
    if (fsEl()) realFs = true;
    else if (realFs) { realFs = false; if (isOn()) { root.classList.remove('mmt-focus'); changed(); return; } }
    nudge();
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  /* ---- buttons ---- */
  var bannerBtn = null;
  function makeBanner() {
    if (!cfg.banner || bannerBtn || document.querySelector('.mmt-fs-btn')) return;
    var actions = document.querySelector('.mmtTopbar .actions');
    if (!actions) return;
    var model = document.getElementById('rulesBtn') || actions.querySelector('button');
    var cls = model ? model.className.replace(/\b(hidden|btn-primary|primary|active|phone-only)\b/g, '').trim() : 'btn';
    bannerBtn = document.createElement('button');
    bannerBtn.type = 'button';
    bannerBtn.className = (cls || 'btn') + ' mmt-fs-btn';
    bannerBtn.addEventListener('click', toggle);
    var first = actions.querySelector(':scope > button, :scope > a');
    actions.insertBefore(bannerBtn, first || null);
  }
  var cornerSeen = null;
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function ensureCorner() {
    if (!cfg.host) return;
    var list = document.querySelectorAll(cfg.host), h = null;
    for (var k = 0; k < list.length; k++) if (visible(list[k])) { h = list[k]; break; }
    if (!h) return;
    var inline = cfg.pos === 'end';
    var mine = h.querySelector(':scope > .mmt-fs-corner');
    if (mine && (!inline || mine === h.lastElementChild)) return;
    var b = cornerSeen && document.contains(cornerSeen) ? cornerSeen : null;
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'mmt-fs-corner' + (inline ? ' mmt-fs-inline' : '');
      b.style.width = b.style.height = cfg.size + 'px';
      if (!inline) {
        b.style[cfg.pos.indexOf('b') === 0 ? 'bottom' : 'top'] = cfg.inset + 'px';
        b.style[cfg.pos.indexOf('l') === 1 ? 'left' : 'right'] = cfg.inset + 'px';
      }
      b.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      cornerSeen = b;
    }
    if (!inline && getComputedStyle(h).position === 'static') h.style.position = 'relative';
    h.appendChild(b);
    paint();
  }
  function paint() {
    var on = isOn(), t = T[lang()], label = on ? t.off : t.on, en = on ? T.en.off : T.en.on;
    var tip = (label === en ? label : label + ' / ' + en) + (on ? ' (Esc)' : ' (F)');
    var key = (on ? '1' : '0') + label;           // only touch the DOM when something changed
    if (bannerBtn && bannerBtn.__mmtKey !== key) {
      bannerBtn.__mmtKey = key;
      bannerBtn.innerHTML = (on ? OUT : IN) + '<span>' + label + '</span>';
      bannerBtn.title = tip;
      bannerBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    document.querySelectorAll('.mmt-fs-corner').forEach(function (b) {
      if (b.__mmtKey === key) return;
      b.__mmtKey = key;
      b.innerHTML = on ? OUT : IN;
      b.title = tip;
      b.setAttribute('aria-label', label);
    });
  }

  /* ---- keys ---- */
  function modalOpen() {
    var els = document.querySelectorAll('.modal-backdrop,.modal,.modalBox,.overlay,.waiting-overlay,dialog[open],[aria-modal="true"]');
    for (var k = 0; k < els.length; k++) {
      var el = els[k], cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0 && r.height > 0 && cs.pointerEvents !== 'none') return true;
    }
    return false;
  }
  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t.closest && t.closest('math-field')))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === 'f' || e.key === 'F') && !modalOpen()) { e.preventDefault(); e.stopPropagation(); toggle(); }
    else if (e.key === 'Escape' && isOn() && !modalOpen()) { exit(); }
  }, true);

  /* ---- boot ---- */
  function boot() {
    makeBanner();
    ensureCorner();
    paint();
    fitBanner();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBanner);
    window.addEventListener('load', scheduleBanner);
    // the game shows/hides its own banner buttons as screens change (Back to menu,
    // Undo…): re-check whenever the banner's size changes. fitBanner restores the
    // same final state each time, so this settles rather than loops.
    var tbEl = document.querySelector('.mmtTopbar');
    if (tbEl && window.ResizeObserver) { var lastW = 0, lastH = 0; new ResizeObserver(function (en) { var r = en[0].contentRect; if (Math.abs(r.width - lastW) > 1 || Math.abs(r.height - lastH) > 1) { lastW = r.width; lastH = r.height; scheduleBanner(); } }).observe(tbEl); }
    var actEl = document.querySelector('.mmtTopbar .actions');
    if (actEl) new MutationObserver(function (ms) { for (var k = 0; k < ms.length; k++) if (ms[k].target !== bannerBtn && !(bannerBtn && bannerBtn.contains(ms[k].target))) { scheduleBanner(); return; } }).observe(actEl, { attributes: true, subtree: true, attributeFilter: ['class', 'hidden', 'style'] });
    var q = false;
    new MutationObserver(function (muts) {
      for (var k = 0; k < muts.length; k++) if (muts[k].target === root) { paint(); scheduleBanner(); return; }
      if (q) return; q = true;
      requestAnimationFrame(function () {
        q = false; makeBanner();
        var had = !!cornerSeen;
        ensureCorner();
        if (!had && cornerSeen) scheduleBanner();   // first appearance only, not every re-render
        if (cfg.fit && isOn() && document.querySelector(cfg.fit) !== fitEl) scheduleFit(60);
      });
    }).observe(root, { attributes: true, attributeFilter: ['lang'], childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.MMTFullscreen = { enter: enter, exit: exit, toggle: toggle, isOn: isOn, refit: function () { scheduleFit(0); } };
})();
