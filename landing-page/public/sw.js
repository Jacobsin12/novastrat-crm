const CACHE_NAME = 'nova-strat-v4'; // Incremented version to force update and cache offline.html
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-32x32.png',
  '/pwa-192x192.png',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation of the new SW
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches automatically
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', event => {
  // For navigation requests (like index.html), use Network-First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Save the latest version to cache
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If offline or connection fails (offline / server down), serve offline.html
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For other static assets (images, CSS, JS), use Cache-First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
