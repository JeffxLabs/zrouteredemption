const CACHE = "zroute-planner-v10";
const ASSETS = ["./", "./index.html", "./i18n.js", "./assets/buildings/research.svg", "./assets/buildings/drill.svg", "./assets/buildings/soldier.svg", "./assets/buildings/military.svg", "./assets/buildings/warrior.svg", "./assets/buildings/defense.svg", "./assets/buildings/medical.svg", "./assets/buildings/economy.svg", "./assets/buildings/default.svg", "./manifest.webmanifest", "./icon.svg", "./data/progression.json", "./data/resources.json"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter(key => key.startsWith("zroute-planner-") && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  // Prefer fresh pages; retain cached pages for offline use.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === "navigate") {
      try {
        const response = await fetch(event.request, {cache: "no-cache"});
        if (response.ok) { await cache.put(event.request, response.clone()); return response; }
        return await cache.match(event.request) || response;
      } catch (error) {
        const cached = await cache.match(event.request) || await cache.match("./index.html");
        if (cached) return cached;
        throw error;
      }
    }
    const hit = await cache.match(event.request);
    if (hit) return hit;
    const response = await fetch(event.request);
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  })());
});
