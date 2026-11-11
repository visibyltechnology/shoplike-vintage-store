const CACHE = 'shoplike-v7';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await caches.open(CACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Always fetch the app shell and executable assets from the network.
  // Cache-first here can keep old JavaScript alive after a production deploy.
  if (request.mode === 'navigate' || /\\.(?:js|css|html)(?:\\?|$)/i.test(new URL(request.url).pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Cache only static images; never cache Firebase/API responses.
  if (request.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })());
  }
});
