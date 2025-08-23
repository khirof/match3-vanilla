var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  'index.html',
  'changeButtonWord.js',
  'constants.js',
  'domManipulation.js',
  'dragAndSwap.js',
  'eventHandlers.js',
  'explosiveButton.js',
  'game.js',
  'icon-192x192.png',
  'icon-256x256.png',
  'icon-384x384.png',
  'icon-512x512.png',
  'interact.min.js',
  'manifest.json',
  'matchManagement.js',
  'pieceManagement.js',
  'specialManagement.js',
  'style-base.css',
  'style-bubble.css',
  'style-explosion.css',
  'style-object.css',
  'style-piece.css',
  'style-wave.css',
  'style-word.css',
  'utils.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
