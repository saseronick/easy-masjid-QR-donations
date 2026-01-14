const CACHE_NAME = 'donation-platform-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  dynamic: 'stale-while-revalidate'
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Cache failed during install:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
            console.log('[SW] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

async function networkFirst(request, cacheName, timeout = 3000) {
  try {
    const fetchPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Using cached response for:', request.url);
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.includes('/functions/v1/')) {
    event.respondWith(
      networkFirst(request, API_CACHE, 5000).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Offline - operation queued',
            offline: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  if (url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      networkFirst(request, API_CACHE, 3000).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', offline: true }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else {
      event.respondWith(
        staleWhileRevalidate(request, DYNAMIC_CACHE).catch(() => {
          return caches.match('/index.html');
        })
      );
    }
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.ports[0].postMessage({ type: 'SYNC_STARTED' });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-donations') {
    event.waitUntil(
      self.registration.showNotification('Syncing', {
        body: 'Syncing your offline changes...',
        icon: '/icon.png',
        badge: '/badge.png'
      })
    );
  }
});
