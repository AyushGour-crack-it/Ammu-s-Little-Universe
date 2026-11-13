const CACHE_PREFIX = 'ammus-little-universe-';
const CACHE_NAME = `${CACHE_PREFIX}shell-v2`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/script.js',
  '/pwa.js',
  '/manifest.webmanifest',
  '/assets/app-icon.svg',
  '/assets/app-icon-192.png',
  '/assets/app-icon-512.png',
  '/assets/app-icon-maskable-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/diary-opening-story.jpg',
  '/assets/diary-night-opening.jpg',
  '/assets/diary-night-opening-mobile.jpg',
  '/assets/stars/first-hello-sky.png',
  '/assets/photos/ammu-purple-glasses.jpeg',
  '/assets/photos/ammu-black-white.jpeg',
  '/assets/photos/ammu-saree.jpeg',
  '/assets/photos/ammu-playful.jpeg',
  '/assets/photos/ammu-night.jpeg',
  '/assets/photos/ammu-soft-smile.jpeg',
  '/assets/photobooth/oct-19-laugh-strip.jpg',
  '/assets/photobooth/oct-19-spiderman-strip.jpg',
  '/assets/photobooth/oct-19-cat-strip.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const isHome = url.pathname === '/' || url.pathname === '/index.html';
    event.respondWith(fetch(request).then((response) => {
      if (isHome && response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (isHome && await cache.match('/index.html')) || await cache.match('/offline.html');
    }));
    return;
  }

  // Keep the app shell and artwork available offline. Never cache audio/video,
  // Supabase responses, auth tokens, or private diary memory URLs.
  const isStaticShell = ['/styles.css', '/script.js', '/pwa.js', '/archive.css', '/archive-live.js', '/diary-client.js', '/manifest.webmanifest'].includes(url.pathname);
  const isArtwork = url.pathname.startsWith('/assets/') && /\.(svg|png|jpe?g|webp)$/i.test(url.pathname);
  if (!isStaticShell && !isArtwork) return;

  if (isStaticShell) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
