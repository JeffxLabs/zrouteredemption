const CACHE = "zroute-planner-v22";
const ASSETS = ["./","./index.html","./i18n.js","./assets/app.css","./assets/app.js","./assets/buildings/icons.js","./assets/buildings/1001.webp","./assets/buildings/1002.webp","./assets/buildings/1004.webp","./assets/buildings/1006.webp","./assets/buildings/1007.webp","./assets/buildings/1010.webp","./assets/buildings/1016.webp","./assets/buildings/1017.webp","./assets/buildings/1019.webp","./assets/buildings/1020.webp","./assets/buildings/1027.webp","./assets/buildings/5006.webp","./assets/buildings/5013.webp","./assets/buildings/5031.webp","./assets/buildings/5042.webp","./assets/buildings/5043.webp","./assets/buildings/5044.webp","./assets/buildings/5045.webp","./assets/buildings/5046.webp","./assets/ui/food.webp","./assets/ui/metal.webp","./assets/ui/oil.webp","./manifest.webmanifest","./icon.svg","./data/progression.json","./data/resources.json"];
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
