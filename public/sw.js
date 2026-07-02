const CACHE_NAME = 'qr-sos-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/dashboard', '/offline'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'QR-SOS', body: event.data.text() };
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If any app tab is open the page's polling will show an in-app toast.
      // Skip the OS notification to avoid duplicates.
      if (clientList.length > 0) return;

      return self.registration.showNotification(data.title || 'QR-SOS', {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: data.data,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'qr-scan',
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((c) => c.url.includes('/dashboard'));
      if (existingClient) return existingClient.focus();
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
