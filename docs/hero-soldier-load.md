# SR Soldier Load guidance correction

The former guide recommended Jackson, Jamal and Hank for gathering because they were the only listed heroes with a Soldier Load benefit. That recommendation was stronger than the available evidence.

## What the data actually establishes

The inspected `HeroInfo` entries for IDs 30011, 40001 and 40002 have:

```json
{"levelBenefit":[{"Source":705,"Type":10106,"Value":0.01}]}
```

Benefit 10106 is named **Soldier Load Increase**. This is a configuration entry, not one of their displayed combat skills. Its value must not be multiplied by hero level or treated as an active march bonus without verifying the consuming logic.

The inspected client `Lua/AbyssEmpire/Logic/Hero/HeroObject.lua`, `CalcHeroBenefit`, takes ordinary level bonuses from the separate `HeroLevel` configuration and star bonuses from the star table. This inspection does **not** establish that this `HeroInfo.levelBenefit` field is used for gathering. It also does not prove the server never uses it elsewhere. No verified in-game display or controlled gathering comparison has established the claimed effect.

Therefore the corrected insights label the gathering claim **unverified** and no longer recommend these heroes for gathering on that basis. The raw `level_benefits` facts remain in the directory for provenance, not as proof of live behavior.

## Related Specialty wording

The former Jackson/Hank tips said “no passive skill.” Although they lack the normal three-skill hero pattern, their displayed Specialty is **Survival Expert**, unlocked at Hero Lv.31 and 4★, increasing ATK, DEF and HP by 5%. The correction replaces the misleading wording with this explicit Specialty description.

## Updated outputs

- `data/hero_insights.json` and all nine translated insight sources.
- `data/heroes_directory.json`, `data/heroes_meta.json`, `heroes/heroes_data.js`.
- All nine generated `heroes/heroes_i18n/` payloads.

The source insights remain authoritative for future directory builds. No combat stats, level curves, skills, research formulas or Base progression calculations were changed.
