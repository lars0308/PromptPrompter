/**
 * Service Worker Caching Strategy
 *
 * Implements intelligent caching for offline support and performance.
 * Strategies:
 * - Cache-first: Static assets (JS, CSS, fonts)
 * - Network-first: API calls (fresh data priority)
 * - Stale-while-revalidate: Images (serve cached, update in background)
 *
 * Target: Reduce repeated requests by 60%, enable offline functionality
 */

// Service Worker version - increment to force cache updates
const CACHE_VERSION = 'v1';
const CACHE_NAME = `promptprompter-${CACHE_VERSION}`;
const CACHE_MANIFEST = {
  static: `${CACHE_NAME}-static`,
  api: `${CACHE_NAME}-api`,
  images: `${CACHE_NAME}-images`,
  pages: `${CACHE_NAME}-pages`,
};

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/theme-init.js',
  '/global-init.js',
  '/error-boundary.js',
  '/fonts/inter-normal.woff2',
  '/fonts/inter-bold.woff2',
  '/favicon.ico',
];

// API endpoints to cache (response)
const API_CACHE_PATTERNS = [
  /^https:\/\/[^/]+\/api\/public\//,
  /^https:\/\/[^/]+\/api\/config\//,
  /^https:\/\/[^/]+\/api\/templates\//,
];

// API endpoints to NOT cache (always network)
const API_NO_CACHE_PATTERNS = [
  /^https:\/\/[^/]+\/api\/logs\//,
  /^https:\/\/[^/]+\/api\/errors\//,
  /^https:\/\/[^/]+\/api\/auth\//,
];

// Max age for different cache types (ms)
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  api: 5 * 60 * 1000, // 5 minutes
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  pages: 24 * 60 * 60 * 1000, // 1 day
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches
      .open(CACHE_MANIFEST.static)
      .then((cache) => {
        console.log(`[SW] Caching ${STATIC_ASSETS.length} static assets`);
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.warn('[SW] Static asset caching failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that don't match current version
          if (!Object.values(CACHE_MANIFEST).includes(cacheName)) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Route to appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (isAPIRequest(url)) {
    event.respondWith(apiCachingStrategy(event.request));
  } else if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  } else if (isPageRequest(url)) {
    event.respondWith(networkFirstStrategy(event.request));
  }
});

/**
 * Cache-first strategy: serve from cache, fallback to network
 * Used for: static assets (JS, CSS)
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_MANIFEST.static);
  const cached = await cache.match(request);

  if (cached) {
    console.log(`[SW-CACHE] Cache hit: ${request.url}`);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn(`[SW-CACHE] Fetch failed: ${request.url}`, error);
    return createOfflineResponse();
  }
}

/**
 * Network-first strategy: try network first, fallback to cache
 * Used for: HTML pages
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_MANIFEST.pages);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn(`[SW-NETWORK] Network failed: ${request.url}`, error);
    const cached = await cache.match(request);
    return cached || createOfflineResponse();
  }
}

/**
 * Stale-while-revalidate strategy: serve cached while updating
 * Used for: images
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_MANIFEST.images);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * API-specific caching strategy
 */
async function apiCachingStrategy(request) {
  // Check if API should be cached
  if (shouldNotCacheAPI(request.url)) {
    return fetch(request);
  }

  const cache = await caches.open(CACHE_MANIFEST.api);
  const cached = await cache.match(request);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      console.log(`[SW-API] Using cached API response: ${request.url}`);
      return cached;
    }
    throw error;
  }
}

/**
 * Check if request is static asset
 */
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|woff2|font)$/) ||
    url.pathname === '/favicon.ico'
  );
}

/**
 * Check if request is API call
 */
function isAPIRequest(url) {
  return url.pathname.includes('/api/');
}

/**
 * Check if request is image
 */
function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/);
}

/**
 * Check if request is page
 */
function isPageRequest(url) {
  return url.pathname === '/' || url.pathname.endsWith('.html');
}

/**
 * Check if API endpoint should not be cached
 */
function shouldNotCacheAPI(url) {
  return API_NO_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Create offline fallback response
 */
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Offline</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .offline-container {
            text-align: center;
            padding: 40px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.2);
          }
          h1 { margin: 0 0 10px 0; }
          p { margin: 0 0 20px 0; opacity: 0.9; }
          button {
            padding: 12px 24px;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
          }
          button:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <h1>📡 Offline</h1>
          <p>Du bist derzeit offline. Starten Sie erneut, wenn die Verbindung wiederhergestellt ist.</p>
          <button onclick="location.reload()">Versuchen Sie es erneut</button>
        </div>
      </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
      status: 503,
    }
  );
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_CACHE_STATS') {
    getCacheStats().then((stats) => {
      event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
    });
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(event.data.cacheName).then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const stats = {
    caches: {},
    totalSize: 0,
  };

  for (const [key, cacheName] of Object.entries(CACHE_MANIFEST)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats.caches[key] = {
      name: cacheName,
      entries: keys.length,
      items: keys.map((r) => r.url),
    };
  }

  return stats;
}

console.log('[SW] Service worker script loaded');
