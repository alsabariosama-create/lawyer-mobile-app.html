const CACHE_NAME = 'lawyer-app-v3.0';
const STATIC_CACHE_NAME = 'lawyer-app-static-v3.0';
const DYNAMIC_CACHE_NAME = 'lawyer-app-dynamic-v3.0';
const RUNTIME_CACHE_NAME = 'lawyer-app-runtime-v3.0';

const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  './shared-config.js',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

const externalAssets = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing version 3.0...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(staticAssets).catch((error) => {
          console.error('Service Worker: Failed to cache static assets:', error);
          // Cache individual files that can be cached
          return Promise.allSettled(
            staticAssets.map(asset => cache.add(asset).catch(err => {
              console.warn(`Failed to cache ${asset}:`, err);
            }))
          );
        });
      }),
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching external assets');
        return Promise.allSettled(
          externalAssets.map(asset => cache.add(asset).catch(err => {
            console.warn(`Failed to cache external asset ${asset}:`, err);
          }))
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating version 3.0...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== RUNTIME_CACHE_NAME
            ) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - improved caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle Firebase requests - network first with offline fallback
  if (url.hostname.includes('firebase') || url.hostname.includes('firebaseio')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful Firebase responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try to get from cache
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response
            return new Response(
              JSON.stringify({ 
                error: 'offline', 
                message: 'التطبيق يعمل بدون اتصال',
                timestamp: Date.now()
              }),
              { 
                headers: { 
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
                },
                status: 503
              }
            );
          });
        })
    );
    return;
  }

  // Handle external CDN requests - cache first with network update
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request).then(response => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle app files - cache first strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // For HTML files, also try to update cache in background
          if (request.destination === 'document') {
            fetch(request).then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME).then(cache => {
                  cache.put(request, responseClone);
                });
              }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          // Cache successful responses
          const responseClone = response.clone();
          const cacheToUse = staticAssets.includes(url.pathname) ? STATIC_CACHE_NAME : RUNTIME_CACHE_NAME;
          
          caches.open(cacheToUse).then(cache => {
            cache.put(request, responseClone);
          });

          return response;
        }).catch(() => {
          // Network failed and not in cache
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
          return new Response('غير متاح بدون اتصال', { 
            status: 503, 
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // For all other requests, just fetch normally
  event.respondWith(fetch(request));
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '3.0' });
  }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'background-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            message: 'تم استعادة الاتصال - جاري مزامنة البيانات...'
          });
        });
      })
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من تطبيق المحامين',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: 'lawyer-app-notification',
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق',
        icon: './icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: './icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('تطبيق المحامين', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow('./index.html');
        }
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PERIODIC_SYNC',
            message: 'تم تحديث البيانات في الخلفية'
          });
        });
      })
    );
  }
});

console.log('Service Worker v3.0: تم تحميل خدمة العامل بنجاح');
