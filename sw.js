
const CACHE_NAME = 'nexus-tactical-cache-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './vite.svg',
  './manifest.json'
];

// Instalace a Archivace
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Aktivace a Úklid
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Pomocná funkce pro IndexedDB
const getOfflineQueue = async () => {
  return new Promise((resolve) => {
    const request = indexedDB.open('nexus-offline-storage', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending-scans')) {
        db.createObjectStore('pending-scans', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction('pending-scans', 'readwrite');
      const store = transaction.objectStore('pending-scans');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve({ db, items: getAll.result });
    };
  });
};

// FETCH STRATEGIE
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});

// BACKGROUND SYNC - Jádro synchronizace
self.addEventListener('sync', (event) => {
  if (event.tag === 'nexus-sync-scans') {
    console.log('[NEXUS SW] Detekováno obnovení signálu. Zahajuji synchronizaci fronty...');
    event.waitUntil(syncScans());
  }
});

async function syncScans() {
  const { db, items } = await getOfflineQueue();
  
  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      if (response.ok) {
        console.log(`[NEXUS SW] Asset ${item.dataId} úspěšně synchronizován.`);
        const transaction = db.transaction('pending-scans', 'readwrite');
        transaction.objectStore('pending-scans').delete(item.id);
      }
    } catch (err) {
      console.error('[NEXUS SW] Synchronizace selhala, zkusím to později.', err);
      throw err; // Prohlížeč zkusí sync později (retry)
    }
  }
}
