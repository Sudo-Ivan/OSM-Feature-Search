const CACHE_NAME = 'osm-feature-search-cache-v1';
const urlsToCache = [
  '/', // Alias for index.html
  '/index.html',
  '/style.css',
  '/script.js',
  '/logo.png',
  'https://unpkg.com/leaflet/dist/leaflet.css', // Cache the CDN file
  'https://unpkg.com/leaflet/dist/leaflet.js'   // Cache the CDN file
];

// Install event: Cache the application shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        // Use addAll for atomic caching
        // Important: If any file fails to download, the entire operation fails.
        return cache.addAll(urlsToCache).catch(error => {
            console.error('[Service Worker] Failed to cache urls:', urlsToCache, error);
            // Re-throw the error to ensure the installation fails if caching fails
            throw error;
        });
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
        console.log('[Service Worker] Claiming clients');
        // Take control of all open pages immediately
        return self.clients.claim();
    })
  );
});

// Fetch event: Serve from cache first, then network
self.addEventListener('fetch', event => {
    console.log('[Service Worker] Fetching:', event.request.url);
    // Exclude non-GET requests and API calls from caching strategy
    if (event.request.method !== 'GET' || 
        event.request.url.includes('overpass-api.de') || 
        event.request.url.includes('nominatim.openstreetmap.org')) {
        // Let the browser handle these requests normally
        // console.log('[Service Worker] Bypassing cache for non-GET or API request:', event.request.url);
        return;
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
            // console.log('[Service Worker] Serving from cache:', event.request.url);
            return response; // Serve from cache
            }
            // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
            return fetch(event.request).then(
                // Optional: Cache new resources dynamically (be careful with this)
                // function(response) {
                //     // Check if we received a valid response
                //     if(!response || response.status !== 200 || response.type !== 'basic') {
                //         return response;
                //     }
                //     var responseToCache = response.clone();
                //     caches.open(CACHE_NAME)
                //         .then(function(cache) {
                //             cache.put(event.request, responseToCache);
                //         });
                //     return response;
                // }
            );
        })
        .catch(error => {
            console.error('[Service Worker] Fetch failed; returning offline page or error perhaps?', error);
            // Optional: return a fallback offline page here if needed
            // return caches.match('/offline.html'); 
        })
    );
}); 