const CACHE_NAME = 'nova-strat-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-32x32.png',
  '/pwa-192x192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
