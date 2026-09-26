const CACHE_NAME = "etd-lepeh-calculator-v9";
const APP_FILES = [
  "./etd-lepeh-manifest.json",
  "./etd-lepeh-icon-192.png",
  "./etd-lepeh-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const isNavigation = request.mode === "navigate";

  // HTML/navigation must be network-first so Cloudflare deployments appear immediately.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match("./"))
    );
    return;
  }

  // Static assets can remain cache-first.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && !response.redirected) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
