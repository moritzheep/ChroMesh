const CACHE_NAME = 'mesh-viewer-v1';
const urlsToCache = [
  '/ChroMesh/',
  '/ChroMesh/index.html',
  '/ChroMesh/styles.css',
  '/ChroMesh/js/app.js',
  '/ChroMesh/js/scene.js',
  '/ChroMesh/js/controls.js',
  '/ChroMesh/js/ui.js',
  '/ChroMesh/js/settings.js',
  '/ChroMesh/js/parsers.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle file opening from ChromeOS
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'HANDLE_FILE') {
    // Send message to main app to handle the file
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'FILE_HANDLER',
          file: event.data.file
        });
      });
    });
  }
});