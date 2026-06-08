const CACHE_NAME = 'pwa-memorizer-v1';

// Files to cache for offline use
// Set to empty array to disable caching
const CACHE_FILES = [
  './',
  './main.js',
  './styles.css',
  './manifest.json',
  './sw-register.js',
  './sw.js',
  './i18n.js',
  './utils/storage.js',
  './utils/scheduler.js',
  './data/word-lists.js',
  './data/wordlists/incel.js',
  './data/wordlists/cet-4.js',
  './data/wordlists/toefl.js'
];

// LNA (Local Network Access) - Hosts to exclude from SW interception
// Per LNA proposal, these should not be cached/intercepted by SW
const LNA_HOST_PATTERNS = [
  // Localhost variants
  /^localhost$/i,
  /^127\./i,
  // Private IPv4 ranges (RFC 1918)
  /^10\./i,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./i,
  /^192\.168\./i,
  // Link-local
  /^169\.254\./i,
  // .local mDNS/Bonjour domain
  /\.local$/i,
  // IPv6 loopback
  /^\[::1\]$/i,
  // IPv6 link-local
  /^\[fe80:/i,
];

function isLNAUrl(url) {
  try {
    const { hostname } = new URL(url);
    return LNA_HOST_PATTERNS.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}

// Install event - cache files
self.addEventListener('install', (event) => {
  if (CACHE_FILES.length === 0) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // LNA compliance: skip SW for local network addresses and .local
  if (isLNAUrl(request.url)) {
    return;
  }

  // Skip cross-origin requests (optional, uncomment if needed)
  // if (!request.url.startsWith(self.location.origin)) {
  //   return;
  // }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }
            // Don't cache opaque responses (cross-origin without CORS)
            if (response.type === 'opaque') {
              return response;
            }
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache));
            return response;
          });
      })
      .catch(() => {
        // Offline fallback - could return a custom offline page
        return new Response('Offline', { status: 503 });
      })
  );
});