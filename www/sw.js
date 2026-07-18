const CACHE_NAME = "zijian-focus-v59";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=59",
  "./fflate.min.js?v=59",
  "./daily-planner.js?v=59",
  "./activity-sessions.js?v=59",
  "./habits.js?v=59",
  "./app.js?v=59",
  "./manifest.webmanifest?v=59",
  "./icon.svg?v=59",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
