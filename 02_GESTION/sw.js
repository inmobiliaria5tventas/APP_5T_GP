// 5 Tierras - Service Worker (Safe Mobile WebKit Shell)
const CACHE_NAME = '5t-gestion-v20261104_1150';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // CRITICAL: NEVER intercept cross-origin requests (Supabase, CDNs, external APIs)
  // Intercepting cross-origin requests in WebKit/iOS Safari causes CORS drops and network failures.
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For local same-origin static assets, allow standard network fetch with fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
