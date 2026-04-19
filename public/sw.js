// DailyDigivolve Service Worker
// Schedules best-effort background notifications for pomodoro and sleep alarms.
// The SW setTimeout survives page close but NOT full browser termination.
// For overnight reliability the app also checks timer expiry on every open.

var _pending = {}; // id → { handle, endTime }

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });

function scheduleNotification(id, endTime, title, body) {
  if (_pending[id]) { clearTimeout(_pending[id].handle); }
  var delay = endTime - Date.now();
  function fire() {
    delete _pending[id];
    // Sleep-wake gets a longer vibration pattern to act as an alarm signal
    var vibrate = id === 'sleep-wake'
      ? [300, 100, 300, 100, 300, 200, 600, 200, 600]
      : [200, 100, 200];
    self.registration.showNotification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: id,
      renotify: true,
      requireInteraction: true,
      vibrate: vibrate,
      data: { url: '/', id: id },
    });
  }
  if (delay <= 0) {
    fire();
  } else {
    _pending[id] = { handle: setTimeout(fire, delay), endTime: endTime };
  }
}

self.addEventListener('message', function(event) {
  var msg = event.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'SCHEDULE_TIMER') {
    scheduleNotification(msg.id, msg.endTime, msg.title, msg.body);
  }

  if (msg.type === 'CANCEL_TIMER') {
    if (_pending[msg.id]) {
      clearTimeout(_pending[msg.id].handle);
      delete _pending[msg.id];
    }
    self.registration.getNotifications({ tag: msg.id }).then(function(ns) {
      ns.forEach(function(n) { n.close(); });
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(all) {
      for (var i = 0; i < all.length; i++) {
        if ('focus' in all[i]) return all[i].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
