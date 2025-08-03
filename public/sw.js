// Service Worker optimizado para EMob
const CACHE_NAME = 'emob-v2';
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
  '/rainbow6siege.svg',
  '/overwatch.svg'
];

// URLs de API que se pueden cachear
const API_URLS = [
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
        return caches.match(request).then(response => {
          return response || caches.match('/');
        });
      })
    );
    return;
  }

  // Estrategia para otros recursos (Cache First)
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }
      
      return fetch(request).then(response => {
        // Cachear recursos útiles
        if (response.status === 200 && 
            (request.destination === 'image' || 
             request.destination === 'script' || 
             request.destination === 'style')) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      });
    })
  );
});

// Limpiar cache periódicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(DYNAMIC_CACHE),
        caches.delete(API_CACHE)
      ]).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Notificaciones push (preparado para futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles',
          icon: '/icons/explore.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icons/close.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/esports')
    );
  }
});
