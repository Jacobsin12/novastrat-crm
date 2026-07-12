self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nueva Notificación', body: event.data.text() };
    }
  }

  const title = data.title || 'Nueva Notificación';
  const options = {
    body: data.body || 'Tienes una nueva actualización en NovaStrat.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si hay una pestaña abierta de la aplicación, poner el foco en ella
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Si no hay pestaña abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
