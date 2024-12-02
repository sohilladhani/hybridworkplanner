const CACHE_NAME = 'hybrid-work-planner-v1';
const ASSETS = [
  'hybridworkplanner/',
  'hybridworkplanner/index.html',
  'hybridworkplanner/script.js',
  'hybridworkplanner/icon-192.svg',
  'hybridworkplanner/icon-512.svg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});