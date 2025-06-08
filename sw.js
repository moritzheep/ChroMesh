const CACHE_NAME = 'chromesh-v1.0.0';

const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/app.js',
  './js/scene.js',
  './js/controls.js',
  './js/ui.js',
  './js/settings.js',
  './js/parsers.js',
  './js/fileHandler.js',
  './js/pwa.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

console.log('URLs to cache:', urlsToCache);

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache.map(url => {
          // Handle external URLs differently
          if (url.startsWith('https://')) {
            return new Request(url, { mode: 'cors' });
          }
          return url;
        }));
      })
      .then(() => {
        console.log('All resources cached successfully');
        // Force the waiting service worker to become the active one
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and ready');
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();
            
            // Only cache same-origin resources
            if (event.request.url.startsWith(self.location.origin)) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          });
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        
        // For navigation requests, return the cached index.html
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        
        // For other requests, just fail
        throw error;
      })
  );
});

// Handle file opening from file associations
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'HANDLE_FILE') {
    // Send message to main app to handle the file
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        console.log('Forwarding file to client:', event.data.file?.name);
        client.postMessage({
          type: 'FILE_HANDLER',
          file: event.data.file
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync (future enhancement)
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  // Could be used for offline file processing
});

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
  console.log('Push notification received:', event.data?.text());
  // Could be used for update notifications
});

// Global error handler
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded successfully');