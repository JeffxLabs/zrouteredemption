const CACHE = "zroute-planner-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./data/progression.json", "./data/resources.json"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => { if (event.request.method === "GET") event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return response; })))});
