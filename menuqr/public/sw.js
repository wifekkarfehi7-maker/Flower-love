/*
 * MenuQR staff service worker.
 *
 * It exists for one reason: Chrome on Android refuses `new Notification()` from
 * a page and only shows a notification through a service worker. So this file
 * does exactly that and nothing else.
 *
 * There is deliberately no `fetch` handler. A worker that caches pages is a
 * worker that can serve yesterday's dashboard after a deploy; this one never
 * touches the network, so it cannot.
 *
 * It is registered with scope /dashboard, so the public guest menu is never
 * controlled by it.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const path = (event.notification.data && event.notification.data.url) || "/dashboard/orders";
  const target = new URL(path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      // Bring back the dashboard the waiter already has open rather than
      // stacking a second copy of it.
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if (client.url !== target && "navigate" in client) {
          try {
            await client.navigate(target);
          } catch (error) {
            // An uncontrolled window cannot be navigated from here; it is
            // focused, and the card on it says the same thing.
          }
        }
        return;
      }

      await self.clients.openWindow(target);
    })()
  );
});
