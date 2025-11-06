// public/service-worker.js

// Install and cache videos
self.addEventListener("install", (event) => {
  console.log("Service Worker installing…");
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open("video-cache-v1").then((cache) => {
      return cache.addAll(["/og.mp4", "/final.mp4"]);
    })
  );
});

// Activate and clean old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== "video-cache-v1") {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Serve cached videos, don't affect other files
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith(".mp4")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log("Serving from cache:", url.pathname);
          return cachedResponse;
        }
        console.log("Fetching from network:", url.pathname);
        return fetch(event.request);
      })
    );
  }
});
