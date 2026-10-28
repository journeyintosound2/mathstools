/* Mills Maths Tools — service worker.
   The list of files to save for offline use lives in precache-manifest.js,
   which tools/build-pwa.mjs writes. Run that before every push. */
importScripts('./precache-manifest.js');

const { version, files } = self.MMT_PRECACHE;
const CACHE = `mmt-${version}`;      // the whole site, replaced on each new version
const CDN = 'mmt-cdn';               // versioned third-party scripts and fonts
const SCOPE_PATH = new URL('./', self.location).pathname;
const NAV_TIMEOUT_MS = 3500;         // slow classroom wifi: give up and use the saved copy

// Hosts whose URLs are versioned, so a saved copy never goes stale.
// Firestore itself (firestore.googleapis.com) is deliberately NOT here: live data always goes to the network.
const CDN_HOSTS = new Set([
  'www.gstatic.com',            // Firebase SDK
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
]);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Batches, and one missing file never blocks the install (addAll would).
    for (let i = 0; i < files.length; i += 20) {
      await Promise.all(files.slice(i, i + 20).map((f) =>
        cache.add(new Request(new URL(f, self.location), { cache: 'reload' }))
          .catch((err) => console.warn('[mmt] could not save', f, err))));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('mmt-') && key !== CACHE && key !== CDN) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (CDN_HOSTS.has(url.hostname)) event.respondWith(cacheFirst(req));
    return;                                   // everything else: straight to the network
  }
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  if (req.mode === 'navigate') event.respondWith(networkFirst(req, event));
  else if (url.searchParams.has('v')) event.respondWith(versionedFirst(req, event));
  else event.respondWith(staleWhileRevalidate(req, event));
});

// A page: newest copy when the network answers in time, saved copy otherwise.
async function networkFirst(req, event) {
  const network = fetch(req).then(async (res) => {
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
    }
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS, 'timeout'));

  try {
    const first = await Promise.race([network, timeout]);
    if (first !== 'timeout') return first;
    return (await lookup(req)) || (await network);   // slow: saved copy if we have one
  } catch {
    return (await lookup(req)) || offlinePage();
  }
}

// Scripts, styles, images: saved copy at once, refreshed quietly behind it.
async function staleWhileRevalidate(req, event) {
  const cached = await lookup(req);
  const fresh = fetch(req).then(async (res) => {
    if (res.ok) {
      const copy = res.clone();
      await (await caches.open(CACHE)).put(req, copy);
    }
    return res;
  }).catch(() => null);
  if (cached) { event.waitUntil(fresh); return cached; }
  return (await fresh) || new Response('', { status: 504, statusText: 'Offline' });
}

// A versioned script or style (quiz.js?v=…): the page asking for it is new and needs THIS
// version now, not on the next visit — otherwise new HTML runs against yesterday's code.
// Network first; the saved copy only when offline.
async function versionedFirst(req, event) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
      return res;
    }
    return (await lookup(req)) || res;
  } catch {
    return (await lookup(req)) || new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CDN);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

// GitHub Pages serves folder/ and folder/index.html as the same page; the cache does not.
// Query strings (?level=spicy) are ignored so a tool opened with settings still loads offline.
async function lookup(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/')) {
    url.pathname += 'index.html';
    return caches.match(url.href, { ignoreSearch: true });
  }
  return undefined;
}

function offlinePage() {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Offline</title>
     <body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;text-align:center;padding:1rem">
       <div><h1>You're offline</h1>
       <p>This page hasn't been saved to this device yet.</p>
       <p><a href="${SCOPE_PATH}">Back to Mills Maths Tools</a></p></div>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
