# Original game icons in the Base planner

The Base and Producer ROI tools use original transparent game sprites, exported as lossless WebP. They are not screenshot crops or hand-drawn category icons.

## Building mapping

[`data/building_icons.json`](../data/building_icons.json) records the exact mapping from building ID to the client `Building.buildFirstIcon` sprite. [`assets/buildings/icons.js`](../assets/buildings/icons.js) provides the corresponding website paths. Numeric IDs keep artwork consistent across translated names and abbreviated labels.

Source: Android built-in P1 catalog **V202609071132**, `SpriteAtlas/UI_BuildingIcon.spriteatlas`, atlas bundle `cb446b3b3c4a923394b62b622a4b0116` plus its texture dependency. Sprites were exported with UnityPy after removing the bundle's XOR `0x10` obfuscation. The decrypted Building table supplies the ID-to-sprite mapping; raw tables/APKs are not committed.

All Base prerequisite/override buildings and all six ROI producers are covered. The training-center names must not be used to guess ordering: building 5044 uses `Icon_Build_HeroCamp3`, 5045 uses `Icon_Build_HeroCamp1`, and 5046 uses `Icon_Build_HeroCamp2`.

The Base picker, stage headers, prerequisite lists, override controls and producer headings now use these sprites. Resource totals and stage/ROI costs reuse the original Food, Metal and Oil art in `assets/ui/`.

## Shared navigation

The root tool uses the shared `assets/app.css` header and mobile bottom navigation patterns, matching the hero/research tools. `assets/app.js` supplies the shared SVG theme button and the same `theme` preference. The former `zroute-theme` preference is migrated only if the shared preference has not been set. Base/ROI links retain in-page switching and update both desktop and mobile active states.

Original building/resource art and shared UI dependencies are precached for offline Base planning. Calculations and progression data are unchanged.

Check: `node tools/check_base_assets.mjs` exercises calculator initialization/self-checks, rendered Base and ROI assets, mapping coverage and view-navigation state. Localization and research checks remain separate.
