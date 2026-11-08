/**
 * Uzair AI Studio - Progressive Web App Service Worker
 * Powers separate offline installation for:
 * 1. Admin Portal (/admin)
 * 2. Intern Portal (/intern-portal)
 * Pre-caches shells, offline document templates, and assets.
 */

const CACHE_NAME = 'uzair-studio-v5';

const PRECACHE_URLS = [
  // App Shells
  '/admin',
  '/admin.html',
  '/intern-portal',
  '/intern-portal.html',
  '/manifest-admin.json',
  '/manifest-intern.json',

  // Core Scripts & Styles
  '/css/style.css',
  '/js/admin.js',
  '/js/intern-portal.js',
  '/js/local-db.js',
  '/js/uzair-notifications.js',
  '/js/firebase-client.js',
  '/js/qrcode-bundle.js',
  '/js/qrcode.js',
  '/js/qr-badge-generator.js',

  // Official Offline Document Templates
  '/offer-letter.html',
  '/certificate.html',
  '/recommendation-letter.html',
  '/experience-letter.html',
  '/verify.html',
  '/task-assignment',
  '/assets/verfication/Intern%20Task%20Assignment%20%E2%80%93%20UZAIR%20AI%20STUDIO.html',

  // Brand Assets
  '/assets/uzairaistudio.png',
  '/assets/uzair_signature (2).png',
  '/assets/saad_signature.png'
];

// Install: Pre-cache core shells and templates
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline shells and document templates...');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Non-fatal pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Purging legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart offline fallback strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle origin requests
  if (url.origin !== self.location.origin) return;

  // 1. Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // Update cache with fresh version
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(async () => {
          // Offline fallback based on route
          const pathname = url.pathname;
          const cache = await caches.open(CACHE_NAME);

          if (pathname.startsWith('/admin')) {
            const cachedAdmin = await cache.match('/admin') || await cache.match('/admin.html');
            if (cachedAdmin) return cachedAdmin;
          }

          if (pathname.startsWith('/intern-portal')) {
            const cachedIntern = await cache.match('/intern-portal') || await cache.match('/intern-portal.html');
            if (cachedIntern) return cachedIntern;
          }

          if (pathname.includes('offer-letter')) {
            const cached = await cache.match('/offer-letter.html');
            if (cached) return cached;
          }

          if (pathname.includes('certificate')) {
            const cached = await cache.match('/certificate.html');
            if (cached) return cached;
          }

          if (pathname.includes('recommendation-letter')) {
            const cached = await cache.match('/recommendation-letter.html');
            if (cached) return cached;
          }

          if (pathname.includes('experience-letter')) {
            const cached = await cache.match('/experience-letter.html');
            if (cached) return cached;
          }

          if (pathname.includes('verify')) {
            const cached = await cache.match('/verify.html');
            if (cached) return cached;
          }

          return (await cache.match(req)) || caches.match('/intern-portal.html');
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Images, Fonts) - Cache-first with network refresh
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Fetch updated version in background
          fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          }).catch(() => {});
          return cached;
        }

        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 3. API requests: Network first with cache mirror fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ 
            offline: true, 
            success: false, 
            message: 'Device is offline. Using IndexedDB local database.' 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Default passthrough
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// ============================================================
// REAL-TIME PUSH NOTIFICATIONS & NATIVE BACKGROUND DISPATCH
// ============================================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || 'Uzair AI Studio Alert';
  const options = {
    body: data.body || 'You have an important update.',
    icon: '/assets/uzairaistudio.png',
    badge: '/assets/uzairaistudio.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    tag: data.tag || 'uzair-push-alert'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NATIVE_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/assets/uzairaistudio.png',
      badge: '/assets/uzairaistudio.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
});
