const CACHE_NAME = 'educ-ci-genius-v1';
const DATA_CACHE = 'educ-ci-data-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app/student',
  '/suivi',
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch avec stratégies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls - Network first with cache fallback
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ offline: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Static assets - Cache first
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Background sync pour les messages et justifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
  if (event.tag === 'sync-justifications') {
    event.waitUntil(syncJustifications());
  }
});

async function syncMessages() {
  const cache = await caches.open(DATA_CACHE);
  const requests = await cache.keys();
  const pendingMessages = requests.filter(req => req.url.includes('pending-message'));
  
  for (const request of pendingMessages) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Envoyer le message
      await fetch('/rest/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Supprimer du cache
      await cache.delete(request);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

async function syncJustifications() {
  const cache = await caches.open(DATA_CACHE);
  const requests = await cache.keys();
  const pendingJustifications = requests.filter(req => req.url.includes('pending-justification'));
  
  for (const request of pendingJustifications) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Envoyer la justification via edge function
      await fetch('/functions/v1/attendance-justify', {
        method: 'POST',
        body: data.formData
      });
      
      await cache.delete(request);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}
