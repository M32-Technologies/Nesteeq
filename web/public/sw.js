// Service Worker for Nesteeq Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: "Nesteeq Notification",
      body: event.data.text(),
    };
  }

  const title = payload.title || "Nesteeq Community Alert";
  const options = {
    body: payload.body || "You have a new notification.",
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/logo.png",
    tag: payload.tag || "nesteeq-push",
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: Boolean(payload.requireInteraction),
    data: {
      url: payload.data?.url || payload.url || "/",
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open on Nesteeq, navigate it and focus
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && targetPath !== "/") {
            client.navigate(targetPath);
          }
          return;
        }
      }
      // If no tab is open, open a new window to the target path
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
