const CACHE_NAME = "zijian-focus-v55";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=53",
  "./fflate.min.js?v=52",
  "./daily-planner.js?v=53",
  "./activity-sessions.js?v=1",
  "./habits.js?v=1",
  "./app.js?v=53",
  "./manifest.webmanifest?v=52",
  "./icon.svg?v=52",
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
