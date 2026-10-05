# Sky Fighter planner

Page: [`fighter/`](../fighter/). The first release has English Fighter-specific UI and item names, with the shared theme and translated site navigation.

## Included

- Current/target Fighter level **and completed Key Upgrade stage**.
- Remaining normal-level progress, Combat Chips and Fighter Parts holdings.
- Upgrade-by-upgrade material budgets and shortfalls.
- Six-component comparisons, including Lv.8–11 enhancement percentages.
- Separate Fighter attributes, direct component Hero bonuses and converted Hero contributions.
- Optional evolution level comparison, evolution XP and chip amplification.
- Four wingman chip types, stars/red stars, conditional effect descriptions, configured chip power and duplicate-copy requirements for same-chip upgrades.
- Browser autosave, named save/load/delete, validated JSON import/export and full-plan URL sharing.

This is **not a battle simulator or combat optimizer**. Chip descriptions retain their targeting/faction conditions. Configured power is not a prediction of damage or winning odds.

## Source and extraction

Curated facts in `data/fighter.json` come from the v1.30.07 APK's `P1_V202609071132` catalog:

- `UavLevel`: 766 level/stage states, through Lv.250.
- `UavComponent`: 2,448 component states, six slots, Lv.1–12.
- `UavAdvance`: evolution benefits, XP and amplification level.
- `UavModuleSynthesis`, `UavModuleStar`, `UavAdvanceIncreaseSkill`: 32 wingman chips, star steps and evolution amplification.
- `DefineBenefit`, `Item` and English language tables: names, percentage formatting and original sprite IDs.

`tools/build_fighter_data.py` reads decrypted Lua and language JSON outside this repository. It uses the existing data-only Lua parser; no client code is executed. APKs, complete tables, language bundles and extraction keys are not added to the website.

## Rules checked in client UI

Inspected paths under `Lua/AbyssEmpire/Logic/UAV/`:

- `UI/UIUAVAttributePart.lua`: current row's costs and benefits, component/active-skin/evolution bonuses, and **displayed stage = phase − 1**.
- `UI/UIUAVComponentPart.lua`: sum equipped component benefits by their benefit type.
- `UI/UIUAVAttributeRatioPanel.lua`: table `convertBenefit` plus extra Fighter benefits multiplied by `uavConv / 10000`.
- `UI/UIUAVAttributeItem.lua`: floor displayed attributes.
- `UI/UAVUIUtil.lua`: chip descriptions filled with star and amplification parameters; chip power is base chip power plus evolution amplification power.
- `UI/ChipLab/UAVSkillChipDetailPanel.lua`: duplicate-copy requirement is the **current star step's** `starNumber`.
- `UI/Upgrade/UAVUpgrade.lua`: three-copy synthesis at low levels, then XP-fed progression.

Costs are attached to the **current state**, not the destination. Key Upgrade stages are 0/5 through 4/5; completing the fifth click advances to the next level.

Ordinary-level budgets use `ceil((progressTotal − currentProgress) / progressAdd) × currentRowCost`, with zero progress on later rows. This is a **no-bonus/no-cross-level-carry scenario**, not expected spending. The server's RNG and carry-over handling are not replicated. Key Upgrade clicks on the checked path are fixed-cost.

Component recipes below Lv.8 count additional identical copies, with the equipped copy retained as an ingredient. Above that, they sum the configured feed-XP requirements and subtract the selected starting progress. Spare bag items, fractional-material overfeed and automatic inventory optimization are not modeled. Replacements/downgrades are comparisons, not refund calculations.

Evolution XP is separate from Combat Chips and does not imply any feed-item exchange rate. Current evolution progress is not subtracted. Activation/reversal costs are unknown and explicitly excluded.

## Screenshot validation

User references dated 2026-10-05:

- https://i.8upload.com/image/28ff4fc1a1c805ae/screenshot-20261005-002420-z-route-redemption.jpg
- https://i.8upload.com/image/23c4f7f4f6b04afd/screenshot-20261005-002425-z-route-redemption.jpg

At Lv.95, Stage 3/5, the current row is **170 (phase 4)**. The next row is 171 (phase 5). Each click costs **12,000 Combat Chips + 90 Fighter Parts**. Two clicks advance to Lv.96 at a total of 24,000 Chips + 180 Parts.

Visible equipped components:

| Slot | Component | Level | Relevant bonuses |
|---|---|---:|---|
| 0 | Navigator | 7 | Fighter HP +405,900 |
| 1 | Engine | 7 | Hero HP +186,000 (below the visible scroll region) |
| 2 | Composite Armor | 7 | Hero DEF +890 |
| 3 | Infrared Detector | 6 | Fighter DEF +760 (below the visible scroll region) |
| 4 | Battery Pack | 7 | Fighter ATK +9,700 |
| 5 | Tactical Missile | 6 | Hero ATK +2,000; Hero Damage +2.5% |

The main screen is reproduced as:

| Attribute | Current | Next stage |
|---|---:|---:|
| Fighter HP | 1,115,716 | 1,134,504 |
| Fighter DEF | 4,309 | 4,403 |
| Fighter ATK | 32,545 | 33,015 |

HP and DEF follow directly from the selected level and components. **ATK needs another +5,100**, whose source is not visible in these screenshots. The example sets a clearly labelled manual offset; it does not infer an owned skin or claim every source is verified. All three displayed coefficients are 16%. Example Chip holdings use the screenshot's rounded 890K, not an inferred exact inventory.

This validates this specific state and transition. Other states are table-derived and not individually verified against the live server.

## Artwork

All 59 lossless WebP images in `assets/fighter/` are original transparent sprites from `SpriteAtlas/UI_Icon.spriteatlas`, bundle `70eecdde4d520e321b23d3083e2e5bc4`. The Fighter thumbnail is `UVA_icon_skin_01`; component and chip images use the exact config/Item sprite IDs.

`assets/fighter/provenance.json` records the sprite names and dimensions. `tools/export_fighter_assets.py` converts original sprite PNG exports with lossless WebP and `exact=True`, verifying equality of all RGBA bytes, including fully transparent pixels. No screenshot crops or reconstructed artwork are used.

## Portable plans

Format: `zroute-fighter-plan`, version 1. Each current/target side contains a valid level-row ID, six component IDs, an evolution level and four chip `{id, star}` entries. The plan also stores current normal-level progress, three fixed other Fighter bonuses, holdings and a name.

Validation rebuilds the allowed schema; arbitrary extra properties are discarded. It checks ID/slot/star compatibility, all number ranges, stage progress, target ordering, file size (1 MiB) and name length (100 characters). URL payloads are UTF-8/base64url with a 16,000-character limit. Invalid imports do not replace the active plan. Loading, importing and opening shared links require confirmation; named overwrites and deletions also require confirmation. Storage failures are surfaced rather than falsely reported as successful saves.

Storage keys: `zr-fighter-plan`, `zr-fighter-saved-plans` (100 named snapshots maximum). Fragment sharing needs no backend; anyone holding the URL can decode the whole plan, including its name and holdings. The fragment is not included in ordinary HTTP requests.

## Checks

```sh
python3 tools/build_fighter_data.py /path/to/decrypted-sources
python3 tools/export_fighter_assets.py /path/to/original-sprite-pngs
node tools/check_fighter.mjs
node tools/check_base_assets.mjs
node tools/check_research_plans.mjs
node tools/check_research_effects.mjs
node tools/check_localization.js
```

The Fighter suite includes screenshot numeric fixtures, full level coverage, partial progress, merge/feed recipes, chip requirements, UTF-8 sharing, hostile/malformed plans, original asset paths and a DOM smoke test. It does not substitute for real-browser layout checks or battle validation.
