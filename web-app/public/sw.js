const CACHE_NAME = 'nova-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar esquemas no soportados como chrome-extension://
  if (!(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          console.warn('Network error fetching', event.request.url);
        });
      })
    );
  }
});
