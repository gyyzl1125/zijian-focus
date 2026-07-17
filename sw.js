const CACHE_NAME = "zijian-focus-v57";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=57",
  "./fflate.min.js?v=57",
  "./daily-planner.js?v=57",
  "./activity-sessions.js?v=57",
  "./habits.js?v=57",
  "./app.js?v=57",
  "./manifest.webmanifest?v=57",
  "./icon.svg?v=57",
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
