
const CACHE_NAME = 'nexus-tactical-cache-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './vite.svg',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;800&family=JetBrains+Mono:wght@400;700&display=swap'
];

// Knihovny z esm.sh, které musíme nacachovat pro offline běh
const EXTERNAL_LIBS = [
  'https://esm.sh/react@^18.2.0',
  'https://esm.sh/react-dom@^18.2.0',
  'https://esm.sh/@google/genai@^1.34.0',
  'https://esm.sh/lucide-react@^0.395.0',
  'https://esm.sh/framer-motion@^11.0.8'
];

self.addEventListener('install', (event) => {
  console.log('[NEXUS SW] Instalace taktického jádra...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...STATIC_ASSETS, ...EXTERNAL_LIBS]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[NEXUS SW] Aktivace uzlu, čištění starých protokolů...');
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Agresivní strategie Cache-First pro statické assety a knihovny
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requesty nikdy necachujeme (ty jdou přes offline frontu v apiService)
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Cachujeme za běhu vše, co není API volání
        if (!response || response.status !== 200 || response.type !== 'basic' && !url.href.includes('esm.sh')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Pokud selže i síť (jsme offline a není v cache), můžeme vrátit offline stránku pokud ji máme
        console.log('[NEXUS SW] Request selhal (Offline stav)');
      });
    })
  );
});

// Background Sync pro odeslání dat po obnovení signálu
self.addEventListener('sync', (event) => {
  if (event.tag === 'nexus-sync-scans') {
    event.waitUntil(syncScans());
  }
});

async function syncScans() {
  // ... (ponechána stávající implementace pro IndexedDB)
}
