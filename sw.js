/* Bump this version whenever the shipped game files change. */
const CACHE = 'simon-offline-v2';
const FILES = ['./', './index.html', './style.css', './index.js', './app.js', './manifest.webmanifest', './assets/dark-geometric.png', './assets/icon.svg', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('simon-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
 if (event.request.mode === 'navigate') {
  event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
