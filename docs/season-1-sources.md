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

## Checks

Run `python3 tools/check_season1.py` for static navigation, assets, cache entries and the skill coverage. Existing tool regression checks remain separate.
