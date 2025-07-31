const CACHE_NAME = 'emob-v1';
const urlsToCache = [
  '/',
  '/esports',
  '/esports/teams',
  '/esports/players',
  '/globals.css',
  '/manifest.json',
  // Agregar más recursos críticos
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de cache: Network First para APIs, Cache First para assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network First para APIs
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First para assets estáticos
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver partidos',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      },
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('EMob - Esports', options)
  );
});

// Manejo de click en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/esports'));
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
