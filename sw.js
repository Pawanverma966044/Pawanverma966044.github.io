/* रक्षा-गार्ड service worker — offline shell (original code © 2026 Pawan Verma / PAWANGAMINGSTUDIO) */
/* v3 — fixed install + offline for all devices */
const CACHE = 'raksha-guard-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

/* -------- INSTALL -------- */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* -------- ACTIVATE — clean old caches -------- */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* -------- FETCH — network-first with cache fallback -------- */
self.addEventListener('fetch', e => {
  /* Only handle GET requests from same origin */
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        /* Clone and update cache with fresh copy */
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => {
        /* Offline: try cache, fall back to index.html for navigation */
        return caches.match(e.request).then(hit => {
          return hit || caches.match('/index.html');
        });
      })
  );
});
