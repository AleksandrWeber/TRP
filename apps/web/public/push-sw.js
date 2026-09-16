/* CM-16 — minimal Web Push Service Worker. No trading commands. No offline/PWA extras. */

self.addEventListener('push', (event) => {
  let title = 'Notification';
  let body = '';
  try {
    const data = event.data ? event.data.json() : null;
    if (data && typeof data === 'object') {
      if (typeof data.title === 'string' && data.title.trim()) title = data.title;
      if (typeof data.body === 'string') body = data.body;
    }
  } catch {
    // Keep defaults when payload is missing or not JSON { title, body }.
  }
  event.waitUntil(self.registration.showNotification(title, { body }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
      return undefined;
    }),
  );
});
