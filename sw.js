const CACHE = "zroute-planner-v24";
const ASSETS = ["./","./index.html","./i18n.js","./assets/app.css","./assets/app.js","./assets/buildings/icons.js","./assets/buildings/1001.webp","./assets/buildings/1002.webp","./assets/buildings/1004.webp","./assets/buildings/1006.webp","./assets/buildings/1007.webp","./assets/buildings/1010.webp","./assets/buildings/1016.webp","./assets/buildings/1017.webp","./assets/buildings/1019.webp","./assets/buildings/1020.webp","./assets/buildings/1027.webp","./assets/buildings/5006.webp","./assets/buildings/5013.webp","./assets/buildings/5031.webp","./assets/buildings/5042.webp","./assets/buildings/5043.webp","./assets/buildings/5044.webp","./assets/buildings/5045.webp","./assets/buildings/5046.webp","./assets/ui/food.webp","./assets/ui/metal.webp","./assets/ui/oil.webp","./manifest.webmanifest","./icon.svg","./data/progression.json","./data/resources.json","./fighter/","./fighter/index.html","./fighter/fighter.js?v=24","./fighter/fighter_model.js","./data/fighter.json","./assets/fighter/Icon_Item_drone01.webp","./assets/fighter/Icon_Item_drone02.webp","./assets/fighter/Icon_Item_drone03.webp","./assets/fighter/Icon_Item_drone04.webp","./assets/fighter/Icon_Item_drone05.webp","./assets/fighter/Icon_Item_drone06.webp","./assets/fighter/Icon_Item_drone07.webp","./assets/fighter/Icon_Item_drone08.webp","./assets/fighter/Icon_Item_drone09.webp","./assets/fighter/Icon_Item_drone10.webp","./assets/fighter/Icon_Item_drone11.webp","./assets/fighter/Icon_Item_drone12.webp","./assets/fighter/Icon_Item_drone13.webp","./assets/fighter/Icon_Item_drone14.webp","./assets/fighter/Icon_Item_drone15.webp","./assets/fighter/Icon_Item_drone16.webp","./assets/fighter/Icon_Item_drone17.webp","./assets/fighter/Icon_Item_drone18.webp","./assets/fighter/Icon_Item_drone19.webp","./assets/fighter/Icon_Item_drone20.webp","./assets/fighter/Icon_Item_drone21.webp","./assets/fighter/Icon_Item_drone22.webp","./assets/fighter/Icon_Item_drone23.webp","./assets/fighter/Icon_Item_drone24.webp","./assets/fighter/Icon_Item_drone25.webp","./assets/fighter/Icon_Item_drone26.webp","./assets/fighter/Icon_Item_drone27.webp","./assets/fighter/Icon_Item_drone28.webp","./assets/fighter/Icon_Item_drone29.webp","./assets/fighter/Icon_Item_drone30.webp","./assets/fighter/Icon_Item_drone31.webp","./assets/fighter/Icon_Item_drone32.webp","./assets/fighter/Icon_uav_armor_lv1.webp","./assets/fighter/Icon_uav_armor_lv2.webp","./assets/fighter/Icon_uav_armor_lv3.webp","./assets/fighter/Icon_uav_armor_lv4.webp","./assets/fighter/Icon_uav_battery_lv1.webp","./assets/fighter/Icon_uav_battery_lv2.webp","./assets/fighter/Icon_uav_battery_lv3.webp","./assets/fighter/Icon_uav_battery_lv4.webp","./assets/fighter/Icon_uav_missile_lv1.webp","./assets/fighter/Icon_uav_missile_lv2.webp","./assets/fighter/Icon_uav_missile_lv3.webp","./assets/fighter/Icon_uav_missile_lv4.webp","./assets/fighter/Icon_uav_radar_lv1.webp","./assets/fighter/Icon_uav_radar_lv2.webp","./assets/fighter/Icon_uav_radar_lv3.webp","./assets/fighter/Icon_uav_radar_lv4.webp","./assets/fighter/Icon_uav_thermal_lv1.webp","./assets/fighter/Icon_uav_thermal_lv2.webp","./assets/fighter/Icon_uav_thermal_lv3.webp","./assets/fighter/Icon_uav_thermal_lv4.webp","./assets/fighter/Icon_uav_turbine_lv1.webp","./assets/fighter/Icon_uav_turbine_lv2.webp","./assets/fighter/Icon_uav_turbine_lv3.webp","./assets/fighter/Icon_uav_turbine_lv4.webp","./assets/fighter/UVA_icon_skin_01.webp","./assets/fighter/icon_item_drone_data.webp","./assets/fighter/icon_item_drone_part.webp"];
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
