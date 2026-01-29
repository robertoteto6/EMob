// Service Worker optimizado para EMob
const _CACHE_NAME = 'emob-v2';
const STATIC_CACHE = 'emob-static-v2';
const DYNAMIC_CACHE = 'emob-dynamic-v2';
const API_CACHE = 'emob-api-v2';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/dota2.svg',
  '/leagueoflegends.svg',
  '/counterstrike.svg',
  '/icons/games/rainbow-six.svg',
  '/overwatch.svg'
];

// URLs de API que se pueden cachear
const _API_URLS = [
  '/api/esports/matches',
  '/api/esports/teams',
  '/api/esports/players'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Estrategia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia para recursos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Estrategia para APIs
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(request).then(response => {
          // Solo cachear respuestas exitosas
          if (response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Devolver desde cache si la red falla
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Estrategia para páginas (Network First)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        // Cachear páginas exitosas
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        // Fallback a cache o página offline
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Estrategia para otros recursos (Cache First)
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(response => {
        // Cachear recursos dinámicos
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      });
    })
  );
});
