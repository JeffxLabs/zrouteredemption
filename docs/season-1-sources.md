# Season 1 source notes

Unofficial player reference. APK build 344, asset catalog `V202611021100`.
Bundled catalog `.bytes` SHA-256: `855e10883a4a0f0ca8365861f95dac2a4e6e9ed2973fe628f1dda9d73ac34f95`.

The guide uses the shipped English locale and statically decoded Lua configuration tables. The skill subset takes `validSeason` 0 or 1 at the S1 class cap (`SeasonProfessionInfo`, row 1); `ProfessionSkillLevel` joins on `skillID` and supplies the numbers interpolated into the corresponding English effect text. `TrendWorld` is filtered to group 1; day offsets are not shown because they are not proven absolute. Reward group 10001 is a client example. No activation date is inferred for Warzone 117.

## Typography

The homepage and Season 1 pages use self-hosted Lora display text (Google Fonts v37, variable weights 500–700, Latin, Latin Extended and Cyrillic). Lora is licensed under the [SIL Open Font License](../assets/fonts/lora-OFL.txt). Korean and Simplified Chinese headings use native serif fallbacks. The guide cover shares the official event-entry landscape used on the homepage.

## Artwork

The selected Unity Sprite assets were found in the embedded catalog and physically present in `base_assets.apk`. Each was resized and re-encoded as WebP for this guide; no APK, raw bundle, or raw locale dump is distributed. Artwork remains the property of its respective rights holders.

| File | Catalog address | Asset split member (bundle basename) |
| --- | --- | --- |
| `home-banner.webp` | `UI_Sprite/Banner/Season/ActEntry/season_banner_s1_main.png` | `f9d100b1ffcda1c0da12428ecc6775a1.bundle` |
| `radiated-land.webp` | `UI_Sprite/Bg/Season/foresight_bg_07.png` | `f96440bd1fd8fd022fe47911f0366667.bundle` |
| `engineer.webp` | `UI_Sprite/Banner/Season/Profession/Occupation_img_engineer01.png` | `5fe540eca32c16e0a4c120417cfb963b.bundle` |
| `war-leader.webp` | `UI_Sprite/Banner/Season/Profession/Occupation_img_warleader01.png` | `059155f160f35c2bd4d9f55b66b3daf7.bundle` |
| `season-buildings.webp` | `UI_Sprite/Banner/Explanation/Rule_banner_S1_001.png` | `c38e6f6752970c3531181ffe7198d36b.bundle` |
| `virus.webp` | `UI_Sprite/Banner/Explanation/Rule_banner_S1_003.png` | `dc6d79673325d526d04beb9d09608d45.bundle` |
| `expedition.webp` | `UI_Sprite/Bg/Season/foresight_bg_06.png` | `9ab5dc3fad8898cc6cbe811ee75f9190.bundle` |

The homepage uses the main Season 1 event-entry sprite (path ID `597244594278310346`). The decorative in-game frame is cropped out, and the card keeps the text as HTML so the banner works in all site languages.

The [icon manifest](../assets/season-1/icons/sources.json) records the atlas, exact sprite name, archived bundle, path ID and WebP hash for every extracted skill, class, resistance and item icon. Atlas sprites were resolved with their packed texture dependencies from the same APK. The hero portraits reuse the existing Hero Directory art.

The [field guide manifest](../assets/season-1/field-guide/sources.json) covers ten construction-menu renders (`UI_BuildingIcon`) and three larger weapon sprites (`UI_HeroSignatureWeapon`). Building IDs and `buildMenuIcon` bind the renders to their labels. These images are from the construction menu, not live base screenshots or a level-by-level model gallery. The Gray Zone Caravan row has no menu sprite; the guide does not substitute an image. `HeroExclusive` binds each weapon sprite and lists appearances at weapon levels 1, 10 and 30. The matching `itemdes_exclusiveWeapon_*` entries specify the hero’s five-star gate and 50-shard cost.

## Additional joins

- Season 1 Virus Lab is `Building[20003]`. All `BuildingLevel` rows from Lab Lv.1 to Lv.30 (`200020004`–`200020033`) require building `1001` (Base, `buildingname_01`) at Lv.10, not Lv.30. Lab Lv.1 also has the repair milestone condition (`400008`, `2005001`). Lv.30 supplies 108,100 base Virus Resistance. Prioritizing the Lab is guide advice.
- The `BuildingLevel` row for Refinery I (`20004`) at Lv.6 requires Refinery II (`20005`) at Lv.5. This is separate from the condition to repair Refinery II, which needs Refinery I at Lv.5 and the repair milestone.
- The client’s `item_season_Immune_protein_3–5` strings identify First Kill Rewards for Radiated Zombie and Radiated Elite. Check each target’s live reward preview; this tip does not assume shared eligibility, a specific payout, or repeatable first-kill bonuses.
- `ProfessionParameter` maps the different reset tickets to `Item` entries. `SeasonAchievements` target `400002` is shown as Virus Resistance in the associated English text. `WorldSeason.skillPointsItemMaxTimes` matches the item’s ten-use cap. `ExchangeShop` stock is conditional; `BattlePassReward` group 1000001 separates free and paid tracks.
- `HeroInfo[30003].upHeroId` points to 31003. Day 9 comes from the Promotion Medal description, not a world milestone offset. The weapon numbers are the S1 day parameters in `HeroExclusive.openCondition`, joined to the existing Hero Directory. Check the live event panel before spending upgrade resources.
- Outpost and protection rules use `season_cross_battle_tips176–194`. Radiation Legion, Aria’s Hunting Day and settlement use the shipped event help and mail. These are not independently observed live schedules.

## Warm-up, Season Boost and settlement

- **Season Preview:** `S1_Season_Preview_Des25` says Phase Quests open daily, an incomplete phase’s preview opens with the next phase, and unclaimed warm-up rewards aren’t reissued. Do not apply this rule to World Progress; `S1_season_world_situation_54–56` includes a reissue notice for that track.
- **Warm-up boss chain:** `S1_preheat_activity_bossGroup010/018/034` define the Virus Spread protein cap, temporary Resistance Research, and a shared three-attack reward limit across both bosses. Chests are limited and first come, first served. Warm-up protein becomes General Speedups; leftover season resources become Class EXP under `S1_season_mail_9`. These are separate from the later Mutant Lizard (`RadiationRemoval50`).
- **Season Boost:** `S1_Inner_City_Milestone_3/4`, `season_virus_tips51/122/131/159–160`, and `Item[item_cityskin_globe_s1_1]` bind the Gamma Terminator skin, Like Reward and one-reward-per-base rule. The UI shows a daily cap; this guide does not assume a live cap value or a specific drop.
- **Settlement:** `alliance_season_reward10/33` and `S1_season_mail_9` name R5 or the Housekeeper and state that finalized distributions cannot change. The settlement screen is distinct from the city-capture Alliance Contribution Ranking (`S1_season_contribution_rank026`).
- [ARES’s Season 1 overview](https://www.youtube.com/watch?v=aGqR0Pa9Fys) prompted these checks (1:51, 2:46, 6:19 and 13:56). The game client supplies the labels and limits; the video is not evidence of a current Warzone schedule or a Nora drop bonus.

The [activity art manifest](../assets/season-1/activities/sources.json) records the original Warm-up icon, Gamma Terminator item sprite and Alliance Loot chest. The Gamma Terminator image is its item icon (`Icon_Item_Skin_Castle8`), not a live map screenshot. The warm-up icon illustrates the event, not either actual boss.

Earlier guide evidence remains here for maintenance instead of interrupting the player pages: opening uses `WorldSeason`, `SeasonPreview`, and `S1_season_mail_1`; construction and recovery use `Building`, `BuildingLevel`, `BuildingUpgrade`, `SeasonRule`, `S1_building_hint_1`, `emergency_center11` and `grey_zone_caravan_visit_tips`; rally and pathogen rules use `S1_start_virus_resistance025–026` and `season_virus_tips31/37/129`. `SeasonTaskChapterInfo` and `SeasonMechCityWarOutpost` supplement `TrendWorld`; rewards and events use `AllianceSeasonReward`, `ZoneSeasonReward`, `S1_season_mail_7/9`, `S1_ZombieAttackCity_Text_009`, `S1_season_other_system_text20` and `UnionStarLikeReward`. The listed build-344 examples span 14 days of preparation and 49 days of play; no launch timing is inferred for Warzone 117.

## Languages and shareable links

The guide and class skill reference use the language selector shared by the other ZR:Reference pages. For example, link to `season-1/?lang=es#buildings` or `season-1/skills/?lang=de#skill-1103`. Language selection preserves the section fragment. English content remains readable without JavaScript; enabled browsers can open localized links offline after the site cache is installed.

Edit [the page dictionary](../data/ui_i18n/season-1.json), then run `python3 tools/build_page_i18n.py`. The [localization provenance](../data/ui_i18n/season-1-provenance.json) records build-344 client terms and bundle identities. Class and skill names, world milestones and all 152 skill rank descriptions use the corresponding client strings with the original stat parameters. Chinese terms are converted from the shipped Traditional Chinese locale to match the site's Simplified Chinese display. Explanatory guide prose is a fan translation, not official client copy.

## Checks

Run `python3 tools/check_season1.py` and `python3 tools/check_season1_refresh.py` for navigation, skill and rank coverage, art hashes, and offline cache entries. Existing tool regression checks remain separate.
