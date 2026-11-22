const CACHE = "zroute-planner-v32";
const ASSETS = ["./","./index.html","./base/","./base/index.html","./i18n.js","./assets/app.css","./assets/app.js","./assets/buildings/icons.js","./assets/buildings/1001.webp","./assets/buildings/1002.webp","./assets/buildings/1004.webp","./assets/buildings/1006.webp","./assets/buildings/1007.webp","./assets/buildings/1010.webp","./assets/buildings/1016.webp","./assets/buildings/1017.webp","./assets/buildings/1019.webp","./assets/buildings/1020.webp","./assets/buildings/1027.webp","./assets/buildings/5006.webp","./assets/buildings/5013.webp","./assets/buildings/5031.webp","./assets/buildings/5042.webp","./assets/buildings/5043.webp","./assets/buildings/5044.webp","./assets/buildings/5045.webp","./assets/buildings/5046.webp","./assets/ui/food.webp","./assets/ui/metal.webp","./assets/ui/oil.webp","./manifest.webmanifest","./icon.svg","./data/progression.json","./data/resources.json","./fighter/","./fighter/index.html","./fighter/fighter.js?v=24","./fighter/fighter_model.js","./data/fighter.json","./assets/fighter/Icon_Item_drone01.webp","./assets/fighter/Icon_Item_drone02.webp","./assets/fighter/Icon_Item_drone03.webp","./assets/fighter/Icon_Item_drone04.webp","./assets/fighter/Icon_Item_drone05.webp","./assets/fighter/Icon_Item_drone06.webp","./assets/fighter/Icon_Item_drone07.webp","./assets/fighter/Icon_Item_drone08.webp","./assets/fighter/Icon_Item_drone09.webp","./assets/fighter/Icon_Item_drone10.webp","./assets/fighter/Icon_Item_drone11.webp","./assets/fighter/Icon_Item_drone12.webp","./assets/fighter/Icon_Item_drone13.webp","./assets/fighter/Icon_Item_drone14.webp","./assets/fighter/Icon_Item_drone15.webp","./assets/fighter/Icon_Item_drone16.webp","./assets/fighter/Icon_Item_drone17.webp","./assets/fighter/Icon_Item_drone18.webp","./assets/fighter/Icon_Item_drone19.webp","./assets/fighter/Icon_Item_drone20.webp","./assets/fighter/Icon_Item_drone21.webp","./assets/fighter/Icon_Item_drone22.webp","./assets/fighter/Icon_Item_drone23.webp","./assets/fighter/Icon_Item_drone24.webp","./assets/fighter/Icon_Item_drone25.webp","./assets/fighter/Icon_Item_drone26.webp","./assets/fighter/Icon_Item_drone27.webp","./assets/fighter/Icon_Item_drone28.webp","./assets/fighter/Icon_Item_drone29.webp","./assets/fighter/Icon_Item_drone30.webp","./assets/fighter/Icon_Item_drone31.webp","./assets/fighter/Icon_Item_drone32.webp","./assets/fighter/Icon_uav_armor_lv1.webp","./assets/fighter/Icon_uav_armor_lv2.webp","./assets/fighter/Icon_uav_armor_lv3.webp","./assets/fighter/Icon_uav_armor_lv4.webp","./assets/fighter/Icon_uav_battery_lv1.webp","./assets/fighter/Icon_uav_battery_lv2.webp","./assets/fighter/Icon_uav_battery_lv3.webp","./assets/fighter/Icon_uav_battery_lv4.webp","./assets/fighter/Icon_uav_missile_lv1.webp","./assets/fighter/Icon_uav_missile_lv2.webp","./assets/fighter/Icon_uav_missile_lv3.webp","./assets/fighter/Icon_uav_missile_lv4.webp","./assets/fighter/Icon_uav_radar_lv1.webp","./assets/fighter/Icon_uav_radar_lv2.webp","./assets/fighter/Icon_uav_radar_lv3.webp","./assets/fighter/Icon_uav_radar_lv4.webp","./assets/fighter/Icon_uav_thermal_lv1.webp","./assets/fighter/Icon_uav_thermal_lv2.webp","./assets/fighter/Icon_uav_thermal_lv3.webp","./assets/fighter/Icon_uav_thermal_lv4.webp","./assets/fighter/Icon_uav_turbine_lv1.webp","./assets/fighter/Icon_uav_turbine_lv2.webp","./assets/fighter/Icon_uav_turbine_lv3.webp","./assets/fighter/Icon_uav_turbine_lv4.webp","./assets/fighter/UVA_icon_skin_01.webp","./assets/fighter/icon_item_drone_data.webp","./assets/fighter/icon_item_drone_part.webp","./season-1/","./season-1/index.html","./season-1/skills/","./season-1/skills/index.html","./assets/season-1/guide.css","./assets/season-1/radiated-land.webp","./assets/season-1/engineer.webp","./assets/season-1/war-leader.webp","./assets/season-1/season-buildings.webp","./assets/season-1/virus.webp","./assets/season-1/expedition.webp","./assets/season-1/skills.js","./assets/season-1/icons/1101.webp","./assets/season-1/icons/1102.webp","./assets/season-1/icons/1103.webp","./assets/season-1/icons/1104.webp","./assets/season-1/icons/1105.webp","./assets/season-1/icons/1106.webp","./assets/season-1/icons/1107.webp","./assets/season-1/icons/1108.webp","./assets/season-1/icons/1109.webp","./assets/season-1/icons/1110.webp","./assets/season-1/icons/1111.webp","./assets/season-1/icons/1112.webp","./assets/season-1/icons/1113.webp","./assets/season-1/icons/1114.webp","./assets/season-1/icons/1115.webp","./assets/season-1/icons/1116.webp","./assets/season-1/icons/1117.webp","./assets/season-1/icons/1118.webp","./assets/season-1/icons/1201.webp","./assets/season-1/icons/1202.webp","./assets/season-1/icons/1203.webp","./assets/season-1/icons/1204.webp","./assets/season-1/icons/1205.webp","./assets/season-1/icons/1206.webp","./assets/season-1/icons/1207.webp","./assets/season-1/icons/1208.webp","./assets/season-1/icons/1209.webp","./assets/season-1/icons/2101.webp","./assets/season-1/icons/2102.webp","./assets/season-1/icons/2103.webp","./assets/season-1/icons/2104.webp","./assets/season-1/icons/2105.webp","./assets/season-1/icons/2106.webp","./assets/season-1/icons/2107.webp","./assets/season-1/icons/2108.webp","./assets/season-1/icons/2109.webp","./assets/season-1/icons/2110.webp","./assets/season-1/icons/2111.webp","./assets/season-1/icons/2112.webp","./assets/season-1/icons/2113.webp","./assets/season-1/icons/2114.webp","./assets/season-1/icons/2115.webp","./assets/season-1/icons/2116.webp","./assets/season-1/icons/2117.webp","./assets/season-1/icons/2118.webp","./assets/season-1/icons/class-engineer.webp","./assets/season-1/icons/class-exp.webp","./assets/season-1/icons/class-reset.webp","./assets/season-1/icons/class-shared.webp","./assets/season-1/icons/class-war-leader.webp","./assets/season-1/icons/promotion-medal.webp","./assets/season-1/icons/resistance.webp","./assets/season-1/icons/skill-point.webp","./assets/season-1/icons/skill-reset.webp","./assets/heroes/heads/30003.webp","./assets/heroes/heads/31003.webp","./assets/heroes/heads/30006.webp","./assets/heroes/heads/50006.webp","./assets/heroes/heads/50011.webp","./assets/heroes/ui/weapon_30006.webp","./assets/heroes/ui/weapon_50006.webp","./assets/heroes/ui/weapon_50011.webp","./assets/season-1/field-guide/assault-base.webp","./assets/season-1/field-guide/class-hall.webp","./assets/season-1/field-guide/emergency-center.webp","./assets/season-1/field-guide/radiation-shelter.webp","./assets/season-1/field-guide/refinery.webp","./assets/season-1/field-guide/tactical-base.webp","./assets/season-1/field-guide/unit-type-base.webp","./assets/season-1/field-guide/virus-lab.webp","./assets/season-1/field-guide/warrior-base.webp","./assets/season-1/field-guide/weapon-leah.webp","./assets/season-1/field-guide/weapon-monroe.webp","./assets/season-1/field-guide/weapon-yana.webp","./assets/season-1/field-guide/world-geographic.webp","./i18n/season-1.js","./assets/season-1/localize.js"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil((async () => {
  const old = (await caches.keys()).filter(key => key.startsWith("zroute-planner-") && key !== CACHE);
  await Promise.all(old.map(key => caches.delete(key)));
  await self.clients.claim();
})()));
// Pages, scripts, styles and data are network-first so a deploy never pairs a
// fresh page with stale code (e.g. research backup links failing until a refresh).
// The cache is only an offline fallback for them. Immutable artwork stays cache-first.
const CACHE_FIRST = /\.(?:webp|png|jpe?g|gif|svg|ico|woff2?)$/i;
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode !== "navigate" && CACHE_FIRST.test(url.pathname)) {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }
    try {
      const response = await fetch(event.request, {cache: "no-cache"});
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      let cached = await cache.match(event.request);
      if (!cached && event.request.mode === "navigate") {
        // Season 1 uses client-side locale queries over the same static pages.
        for (const page of ["./season-1/", "./season-1/skills/"]) {
          const route = new URL(page, self.registration.scope);
          if (url.pathname === route.pathname || url.pathname === route.pathname + "index.html") {
            cached = await cache.match(route.href);
            break;
          }
        }
        cached ||= await cache.match("./index.html");
      }
      if (cached) return cached;
      throw error;
    }
  })());
});
