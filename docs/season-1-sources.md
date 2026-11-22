# Season 1 source notes

Unofficial player reference. APK build 344, asset catalog `V202611021100`.
Bundled catalog `.bytes` SHA-256: `855e10883a4a0f0ca8365861f95dac2a4e6e9ed2973fe628f1dda9d73ac34f95`.

The guide uses the shipped English locale and statically decoded Lua configuration tables. The skill subset takes `validSeason` 0 or 1 at the S1 class cap (`SeasonProfessionInfo`, row 1); `ProfessionSkillLevel` joins on `skillID` and supplies the numbers interpolated into the corresponding English effect text. `TrendWorld` is filtered to group 1; day offsets are not shown because they are not proven absolute. Reward group 10001 is a client example. No activation date is inferred for Warzone 117.

## Artwork

The selected Unity Sprite assets were found in the embedded catalog and physically present in `base_assets.apk`. Each was resized and re-encoded as WebP for this guide; no APK, raw bundle, or raw locale dump is distributed. Artwork remains the property of its respective rights holders.

| File | Catalog address | Asset split member (bundle basename) |
| --- | --- | --- |
| `radiated-land.webp` | `UI_Sprite/Bg/Season/foresight_bg_07.png` | `f96440bd1fd8fd022fe47911f0366667.bundle` |
| `engineer.webp` | `UI_Sprite/Banner/Season/Profession/Occupation_img_engineer01.png` | `5fe540eca32c16e0a4c120417cfb963b.bundle` |
| `war-leader.webp` | `UI_Sprite/Banner/Season/Profession/Occupation_img_warleader01.png` | `059155f160f35c2bd4d9f55b66b3daf7.bundle` |
| `season-buildings.webp` | `UI_Sprite/Banner/Explanation/Rule_banner_S1_001.png` | `c38e6f6752970c3531181ffe7198d36b.bundle` |
| `virus.webp` | `UI_Sprite/Banner/Explanation/Rule_banner_S1_003.png` | `dc6d79673325d526d04beb9d09608d45.bundle` |
| `expedition.webp` | `UI_Sprite/Bg/Season/foresight_bg_06.png` | `9ab5dc3fad8898cc6cbe811ee75f9190.bundle` |

The [icon manifest](../assets/season-1/icons/sources.json) records the atlas, exact sprite name, archived bundle, path ID and WebP hash for every extracted skill, class, resistance and item icon. Atlas sprites were resolved with their packed texture dependencies from the same APK. The hero portraits reuse the existing Hero Directory art.

The [field guide manifest](../assets/season-1/field-guide/sources.json) covers ten construction-menu renders (`UI_BuildingIcon`) and three larger weapon sprites (`UI_HeroSignatureWeapon`). Building IDs and `buildMenuIcon` bind the renders to their labels. These images are from the construction menu, not live base screenshots or a level-by-level model gallery. The Gray Zone Caravan row has no menu sprite; the guide does not substitute an image. `HeroExclusive` binds each weapon sprite and lists appearances at weapon levels 1, 10 and 30. The matching `itemdes_exclusiveWeapon_*` entries specify the hero’s five-star gate and 50-shard cost.

## Additional joins

- Season 1 Virus Lab is `Building[20003]`. All `BuildingLevel` rows from Lab Lv.1 to Lv.30 (`200020004`–`200020033`) require building `1001` (Base, `buildingname_01`) at Lv.10, not Lv.30. Lab Lv.1 also has the repair milestone condition (`400008`, `2005001`). Lv.30 supplies 108,100 base Virus Resistance. Prioritizing the Lab is guide advice.
- The `BuildingLevel` row for Refinery I (`20004`) at Lv.6 requires Refinery II (`20005`) at Lv.5. This is separate from the condition to repair Refinery II, which needs Refinery I at Lv.5 and the repair milestone.
- The client’s `item_season_Immune_protein_3–5` strings identify First Kill Rewards for Radiated Zombie and Radiated Elite. Check each target’s live reward preview; this tip does not assume shared eligibility, a specific payout, or repeatable first-kill bonuses.
- `ProfessionParameter` maps the different reset tickets to `Item` entries. `SeasonAchievements` target `400002` is shown as Virus Resistance in the associated English text. `WorldSeason.skillPointsItemMaxTimes` matches the item’s ten-use cap. `ExchangeShop` stock is conditional; `BattlePassReward` group 1000001 separates free and paid tracks.
- `HeroInfo[30003].upHeroId` points to 31003. Day 9 comes from the Promotion Medal description, not a world milestone offset. The weapon numbers are the S1 day parameters in `HeroExclusive.openCondition`, joined to the existing Hero Directory. Check the live event panel before spending upgrade resources.
- Outpost and protection rules use `season_cross_battle_tips176–194`. Radiation Legion, Aria’s Hunting Day and settlement use the shipped event help and mail. These are not independently observed live schedules.

## Languages and shareable links

The guide and class skill reference use the language selector shared by the other ZR:Reference pages. For example, link to `season-1/?lang=es#buildings` or `season-1/skills/?lang=de#skill-1103`. Language selection preserves the section fragment. English content remains readable without JavaScript; enabled browsers can open localized links offline after the site cache is installed.

Edit [the page dictionary](../data/ui_i18n/season-1.json), then run `python3 tools/build_page_i18n.py`. The [localization provenance](../data/ui_i18n/season-1-provenance.json) records build-344 client terms and bundle identities. Class and skill names, world milestones and all 152 skill rank descriptions use the corresponding client strings with the original stat parameters. Chinese terms are converted from the shipped Traditional Chinese locale to match the site's Simplified Chinese display. Explanatory guide prose is a fan translation, not official client copy.

## Checks

Run `python3 tools/check_season1.py` and `python3 tools/check_season1_refresh.py` for navigation, skill and rank coverage, art hashes, and offline cache entries. Existing tool regression checks remain separate.
