# Z Route: Redemption progression data

This repository turns static progression facts from Android client version `1.30.07` into machine-readable JSON for route planning and leveling analysis. It covers buildings, research, resource generation and gathering nodes, speedups, playable heroes, hero progression, and equipment. The original Base level 1–30 CSV remains available for spreadsheet use.

Use the interactive [Z Route Progression Planner](https://jeffxlabs.github.io/zrouteredemption/) to calculate a Base route or compare the payback time and 30-day profit of every resource-producer upgrade.

Calculate exact leveling costs with the interactive [Hero EXP Calculator](https://jeffxlabs.github.io/zrouteredemption/hero-exp/): EXP from any level to any level (Lv 150 needs 5,237,407,280 EXP), hero level caps per HQ level (HQ × 5, `BFCastleBase`), the 1K Battle EXP item and R/SR/SSR/UR Hero EXP chests sized for your HQ level (`CastleBox`), and Alliance Competition hero-day points (1 point per 650 Hero EXP, `PointSource` 1365, boosted by the Points Buff research). The EXP table continues to Lv 175, but HQ currently stops at 30, which caps heroes at Lv 150. Data: [`data/hero_exp.json`](data/hero_exp.json) from `tools/extract_hero_exp.py`.

Plan research with the [Research planner](https://jeffxlabs.github.io/zrouteredemption/research/): all 15 Institute trees drawn from the client's own grid layout, connector lines, tech icons and frames (`CollegeTechType`/`CollegeTech` via `tools/extract_research_layout.py` → [`data/research_layout.json`](data/research_layout.json)), joined to costs, Research Data, times, prerequisites and benefits from `progression.json` by `tools/build_research_data.py`. Unlock rules come from the client too, including tree-progress gates (for example Squad 2 needs Squad 1 at 25%) and Squad 4's Monthly Card requirement. The planner supports named saved plans and JSON import/export for backup or transfer between devices; see [research plans](docs/research-plans.md).

Explore the playable heroes with the interactive [Heroes Directory](https://jeffxlabs.github.io/zrouteredemption/heroes/): client card portraits, skill, weapon, rarity, faction and role art from the game's sprite atlases, base stats with roster ranks, real skill values at every star with star-upgrade effects and damage types, tap-to-explain keywords, squad rules (lineup bonuses, the Warrior > Assault > Tactical > Warrior counter triangle, 2 front + 3 back positioning) with a squad planner, exclusive weapons (Monroe, Leah, Yana), plain-language tips, and heroes found in the client but not yet playable. The pre-antidote crossbow Nora (#10011) is omitted because the client replaces her with Awakened Nora (#10006).

Plan your Institute progression with the interactive [Research Trees & Tech Planner](https://jeffxlabs.github.io/zrouteredemption/research/) covering all 15 research trees and 328 technologies. Features extracted in-game tree category artwork, live Food/Metal/Oil and Research Speedup calculations, and the exact Research Data required to max Alliance Competition (33,350 Research Data), Convoys (81,950 Research Data), Super Soldiers (255,240 Research Data), Offense Strategy (172,300 Research Data), and Defense Strategy (171,850 Research Data)—totaling 714,690 Research Data game-wide.

The [Alliance Intel dashboard](https://jeffxlabs.github.io/zrouteredemption/intel/) presents the supplied P1MP roster. Its [leaderboard evidence page](https://jeffxlabs.github.io/zrouteredemption/intel/leaderboard/) adds a dated, screenshot-based read of the Today event board, where P1MP and ddk leaderboard points remain separate from roster power.

Producer ROI compares the selected producer levels' direct Food, Metal, and Oil costs with marginal hourly output, construction time, and user-defined relative values for unlike resources. A producer continues at its last completed level while the next upgrade builds, and fixed-horizon profit deducts each upgrade cost when that upgrade starts. Base gates are shown but their costs are excluded because they benefit the whole account.

## Data

- [`data/base-upgrades.csv`](data/base-upgrades.csv) is the compact, spreadsheet-friendly dataset.
- [`data/base-upgrades.json`](data/base-upgrades.json) preserves the prerequisite structure and source metadata.
- [`data/progression.json`](data/progression.json) joins 99 buildings and 328 research technologies to their levels, prerequisites, base times, costs, and benefits. It also defines 359 benefit types and the VIP 0–18 Building Speed curve.
- [`data/resources.json`](data/resources.json) contains six production-building curves, 190 world resource nodes, 20 search categories, and 40 speedup items.
- [`data/heroes.json`](data/heroes.json) contains 32 playable heroes, two level curves, the global star curve, their skill progressions, training-center gates, and three exclusive-gear paths.
- [`data/hero_skills.json`](data/hero_skills.json) is produced by `python3 tools/extract_hero_skills.py <decrypted-lua-tables> data/lang_hero_en.json,data/lang_rules_en.json data/hero_skills.json` from the decrypted client tables `HeroSkillDes`, `HeroInfo`, `HeroCamp`, `HeroCampAttr` and `HeroExclusive` (catalog V202610032200). It applies the client's own display formula, `(starBase + starGrow × skillLevel) × starFactor` with the parameter row chosen by whole star, at each star's skill-level cap, and records each skill's icon sprite, damage type, star-upgrade effects and the Specialty talent. `tools/lua_tables.py` reads the generated Lua data literals without executing them. Decrypted tables and keys stay outside the repository.
- [`data/heroes_directory.json`](data/heroes_directory.json) and [`data/heroes_meta.json`](data/heroes_meta.json) are generated by `python3 tools/build_heroes_directory.py` from `heroes.json`, [`data/lang_hero_en.json`](data/lang_hero_en.json) and the squad-rule strings in [`data/lang_rules_en.json`](data/lang_rules_en.json) (client catalog V202610032200), the curated [`data/hero_insights.json`](data/hero_insights.json), and the sprites in `assets/heroes/{cards,skills,heads,ui}`. Sprite names that differ from English names (for example Brooks = Toxina, Deke = Dirk, Niko = Nicole, MarilynMonroe = Monroe's head icon) were matched by comparing client head icons with hero cards; heroes without a client skill sprite get a neutral placeholder.
- [`data/equipment.json`](data/equipment.json) joins all 16 equipment bases to manufacturing, strengthening, and Mythic promotion data.
- [`data/model-manifest.json`](data/model-manifest.json) pins source hashes and records model joins and uncertainty boundaries.
- [`docs/base-leveling-guide.svg`](docs/base-leveling-guide.svg) is a visual Base level 1–30 guide with Base time, combined Base/prerequisite resources, and per-building prerequisite time for parallel scheduling.
- [`docs/hero-exp-guide.md`](docs/hero-exp-guide.md) is a comprehensive Hero EXP guide with Level 1–175 costs, HQ gating (HQ × 5), milestone brackets, and Alliance Duel VS Thursday event scoring.

All JSON values are direct client-table facts or explicitly identified interpretations. Raw tables, localization assets, bundles, and APKs are not included.

## Optimizer model

The static files support a dependency graph whose actions are building upgrades, research levels, hero levels/stars/skills, and equipment manufacturing/upgrades. Each action supplies its gate, client base time, and resource cost; research and gear actions also expose their client benefit values. A solver can derive marginal benefit by comparing adjacent levels. Producer building `ability` values are published as `base_output_per_hour` because the matching client UI labels them “Output per Hour.”

A live recommendation still needs an account-state input: current building/research/hero/gear levels, Food/Metal/Oil and item inventories, active queues, speedups, current percentage modifiers, alliance help, event/server modifiers, and the target objective. Those dynamic values are intentionally not guessed. `ResourceInfo.speed` is retained as `speed_value` because its unit and gathering-duration formula are not yet confirmed.

Conditions preserve their numeric parameters and include a semantic `kind` where confirmed. Conditions in a prerequisite list are jointly required; `any_building_in_list_level` is the client’s internal OR case. A planner can resolve `building_level`, `research_level`, and `any_building_class_level` against IDs/classes in `progression.json`; seasonal and event gates need live server state. Building levels expose `static_optimizer_supported` and `requires_external_state`; a solver should reject unsupported levels rather than treating an unknown gate as satisfied. Two event/decor buildings also expose `level_rows_complete=false` because their configured maximum exceeds the available client rows.

Hero rows are limited to client records where `heroType=1` and `showType=1`, excluding mode/copy records. Their `level_curve_id` joins to `level_curves`, and `skill_group_ids` join to `skills`. `replaces_hero_id` identifies hero replacement paths, while `uses_extra_star_fragment_cost` selects `extra_fragment_count` instead of `fragment_count` from the star curve. No direct construction, research or production modifier appears in the playable heroes’ `levelBenefit` records in this version; the three SR heroes (Jamal, Hank, Jackson) carry `Soldier Load Increase` instead of a faction stat bonus.

All prerequisite entries on a level must pass. Condition `20103` requires the named building to reach the minimum level; condition `20105` requires any one building in its group to reach the minimum. The group used here is Warrior, Tactical, or Assault Training Center.

Times are seconds from the client table before construction-speed bonuses, alliance help, events, or server-side overrides. The planner can apply the client VIP curve, Quick Construction I–IV research, an additional speed percentage, and a user-supplied free-finish threshold. The client identifies survivor benefit `20006` as “Free Building Speedup Time +”; it extends the point at which a build can be finished free rather than adding Building Speed. Costs use the English client names for resource types 1–3: Food, Metal, and Oil. The Base rows have no `specialCost`; the separate table `reward` field is intentionally not reported as a cost.

The generated sheet caption still mentions “L35,” but the live Base definition has `maxLv = 30` and the client contains no Base upgrade rows above level 30.

## Reproduce

Both generators use only Python's standard library. The complete model expects the pinned plaintext tables and five English localization JSON files listed in `model-manifest.json`; no source assets belong in this repository.

```sh
python3 tools/extract_base.py build /path/to/decrypted-tables /path/to/lang_building data
python3 tools/extract_model.py build /path/to/decrypted-tables data
python3 tools/extract_model.py check data
python3 tools/render_base_guide.py data/base-upgrades.json data/progression.json docs/base-leveling-guide.svg
```

Querying the model needs no custom library:

```sh
python3 - <<'PY'
import json
model = json.load(open("data/progression.json"))
base = next(item for item in model["buildings"] if item["id"] == 1001)
print(base["levels"][29])
PY
```

The complete-model generator verifies every source hash so a different client version cannot silently produce mislabeled data. The smaller Base-only generator remains available for its focused CSV workflow.

For the Base dataset specifically:

```sh
python3 tools/extract_base.py check data
```

The source directory must contain `Building.lua`, `BuildingLevel.lua`, and `BuildingUpgrade.lua`. Their expected hashes are pinned in the generator so a different client version cannot silently produce mislabeled data.

## Source provenance

| Item | Value |
| --- | --- |
| Android package | `com.zroute.global` |
| App version | `1.30.07` |
| Catalog package/version | `P1` / `V202608062022` |
| Catalog client build time | `2026-08-06 20:26:03` |
| APK archive SHA-256 | `390cc17ce0c2fb9230055ee6aaa5c8a49cdae64c14926660da2dedb242937ec0` |
| `base.apk` SHA-256 | `76a80fed49fee35b932e4766a32b13a08e947731fccbe91400b013b725608720` |
| `base_assets.apk` SHA-256 | `e7a1b56d15d80880615b1944c9329b56313c1b92121ee08d3438c5242c598a13` |
| `config.arm64_v8a.apk` SHA-256 | `0de42b6b90dcb700c3b4fa09d5c70fe72931f8f9ece6db2de9b6f165e2c4facb` |
| Unity app GUID | `fc8846b3-f8ce-4c94-8eef-9523dcb8feb8` |

The relevant bundles are bytewise XOR-obfuscated with `0x10`. After UnityFS extraction, their TextAsset payloads use AES-256-ECB with PKCS#7 padding and client key `3@!1$592-5#58N7W3z3&C6%D43&83~79`.

| Table | Bundle GUID | Plaintext SHA-256 |
| --- | --- | --- |
| `Building.lua` | `0eb19f215674df0a721e8af4b6e38b27` | `626e8c94253acbc3d62e35a48995c1672224ae41ef77b16d2ef82a94e73ae9a8` |
| `BuildingLevel.lua` | `fe3de944af769d3aed3c085028a01388` | `c011f412e2d8b3de100df0c4dd7605718950b30729adee240a9746a2f42208d9` |
| `BuildingUpgrade.lua` | `867eafd983c72fabb00169f6995b94ed` | `ec2855a231be5bc764f831c13abf44fc4814f6c04f53a040e2448856b95668ba` |
| `VipPrivilege.lua` | `557146594caa9ac60a1eb7fa8b53ee1f` | `99bfc9ed88d0f3ffaa14807c8302f4b947d4a3b64ed4b6444ae3ec920971383c` |
| `lang_building` | `5c86b0882980ee813ddddd26a83b5bcb` | `a2d6dc3657aaf825a5a163b0fac769bad78d212e1ffcd41ebda3d64291f0bc82` |

Only derived facts and the generator are checked in—no APK, bundle, native library, raw localization file, or decrypted client table is included.

The planner accepts `?current=N` to open directly at a Base level, for example `https://jeffxlabs.github.io/zrouteredemption/?current=26`. Changing the current level updates the shareable URL.

## Localization

Heroes, Hero EXP and Research are available in English, French, Russian, Turkish, Polish, Spanish, Portuguese, German, Korean and Simplified Chinese (the Capitol event site's languages); the language choice is shared site-wide through `i18n.js`. Game text (hero names, skills, keywords, benefits, research techs, squad rules, items) uses the client's official translations; Simplified Chinese is converted from the client's Traditional Chinese. Our own text is translated in `data/ui_i18n/`, `data/hero_insights_i18n/`, `data/hero_notes_i18n.json` and `data/hero_skill_template_i18n.json`. Rebuild with `python3 tools/build_heroes_directory.py`, `python3 tools/build_research_data.py`, `python3 tools/build_hero_exp_i18n.py` and `python3 tools/build_page_i18n.py` (the game-text steps need the client language files in a local, git-ignored `.i18n-src/`), then check with `node tools/check_localization.js`.
