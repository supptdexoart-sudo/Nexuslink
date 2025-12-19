
const CACHE_NAME = 'nexus-tactical-cache-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './vite.svg',
  './manifest.json'
];

// Instalace - uložení základních souborů
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[NEXUS SW] Archivace systémových modulů...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivace - vyčištění starých keší
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Strategie: Cache First pro UI a grafiku, Network First pro API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API volání (Gemini, Backend) ignorujeme - vyžadují čerstvá data
  if (url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Vrátíme z paměti (bleskové načtení)
      }

      return fetch(event.request).then((networkResponse) => {
        // Uložíme nové assety (JS, CSS, Obrázky) do keše pro příště
        if (networkResponse.ok && (
            event.request.destination === 'script' || 
            event.request.destination === 'style' || 
            event.request.destination === 'image' || 
            event.request.destination === 'font'
        )) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
