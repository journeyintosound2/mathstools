/* Mills Maths Tools — shared PWA helper. Sits at the site root; every page loads it.
   1. Registers the service worker.
   2. When running as a home-screen app (no browser chrome, so no Back button),
      adds a small Home button, and keeps same-site links inside the app.
   Opt a page out of the Home button with <meta name="mmt-no-home">. */
(function () {
  var me = document.currentScript;
  if (!me) return;
  var root = new URL('./', me.src);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(new URL('sw.js', root).href, { scope: root.pathname })
        .catch(function (err) { console.warn('[mmt] service worker not registered', err); });
    });
  }

  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ||
                   navigator.standalone === true;
  if (!standalone) return;
  document.documentElement.classList.add('is-app');

  // Only the installed app saves the whole site for offline use (sw.js explains why a
  // browser tab must not: shared school IP addresses + GitHub Pages rate limits).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (reg) {
      setTimeout(function () {
        if (reg.active) reg.active.postMessage({ type: 'mmt-save-all' });
      }, 8000);
    });
  }

  // target="_blank" in a home-screen app throws the user out to Safari. Keep our own links in the app.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (a && a.origin === location.origin && a.pathname.indexOf(root.pathname) === 0) a.removeAttribute('target');
  }, true);

  var here = location.pathname.replace(/index\.html$/, '');
  if (here === root.pathname || document.querySelector('meta[name="mmt-no-home"]')) return;

  function addHome() {
    var b = document.createElement('a');
    b.href = root.href;
    b.className = 'mmt-app-home';
    b.setAttribute('aria-label', 'Mills Maths Tools home');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" fill="currentColor"/></svg>';
    var s = document.createElement('style');
    s.textContent =
      '.mmt-app-home{position:fixed;z-index:2147483000;' +
      'left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));' +
      'width:40px;height:40px;border-radius:50%;display:grid;place-items:center;' +
      'background:rgba(31,58,95,.82);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25);opacity:.75}' +
      '.mmt-app-home:hover,.mmt-app-home:focus-visible{opacity:1}' +
      '@media print{.mmt-app-home{display:none}}';
    document.head.appendChild(s);
    document.body.appendChild(b);
  }
  if (document.body) addHome(); else document.addEventListener('DOMContentLoaded', addHome);
})();
