# Research benefit display: flat vs percentage values

**Finding:** Benefits such as **Training Food Cost −100** are flat integers in the game. They are not percentages stored as hundredths. The research page shows them the same way the client does.

Verified against client catalog **V202610032200** (client tables 1.30.07). The decrypted Lua files were pulled from the installed game with the existing `fetchdec.py` workflow. They are kept outside this repository.

## How the client formats a benefit value

`Logic/Datas/Benefit/BenefitUtils.lua` → `BenefitUtils.GetBenefitAddValueString(benefitId, value)`. The research effect cell (`UITechResearchEffectCell.lua`) and the per-level list (`UITechAdditionItem.lua`) both call this function.

1. `paramType = DefineBenefit[id].paramType` (`BenefitDefines.BenefitValueType`: `1` Percentage, `2` Integer, `3` Time).
2. `displayFactor = DefineBenefit[id].displayFactor`, or **1** when it is unset or 0.
3. Formatting:
   - Percentage (1): `abs(value / displayFactor) * 100` followed by `%`
   - Time (3): `abs(value / displayFactor)` formatted as a duration
   - Integer (2) and anything else: `abs(value / displayFactor)`, with **no `%`**
4. The `+`/`−` symbol is added when `showSymbol` is set. The `−` in names like "Training Food Cost −" comes from the localized name string. `paramDesc1`/`paramDesc2` can wrap the value in a template, but these cost benefits don't set them.

## The cost benefits (20101–20112)

| ID | Name | paramType | displayFactor |
|---|---|---|---|
| 20101–20103 | Construction Food/Metal/Oil Cost − | 2 (Integer) | unset → 1 |
| 20104–20106 | Training Food/Metal/Oil Cost − | 2 (Integer) | unset → 1 |
| 20107–20109 | Healing Food/Metal/Oil Cost − | 2 (Integer) | unset → 1 |
| 20110–20112 | Research Food/Metal/Oil Cost − | 2 (Integer) | unset → 1 |

Example row from `CollegeTechLevel` (Barracks Expansion I, tech 1003, Lv 2):
`benefit = {{Type=20017, Value=0.01}, {Type=20104, Value=200}}`. That is Soldier Training Limit +1% (Percentage) and Training Food Cost −200 (Integer).

The client tables don't say what the flat amount applies to (per soldier, per batch, and so on), so the site shows no unit.

Don't confuse these with the percentage cost benefits, which use `paramType` 1: Building Resource Cost − (20007), Tech Research Cost − (20009), Soldier Training Cost − (20019), Healing Cost − (20023), and Oil Cost for Hero Gear Crafting − (20034).

## Mapping to this repository

`data/progression.json` → `benefits[]` carries `parameter_type` and `display_factor` from `DefineBenefit`. `tools/build_research_data.py` (`benefit_text`/`benefit_parts`) and the research page's `formatBenefits` follow the same rules: type 1 is multiplied by 100 and shown with `%`, while types 2 and 3 are shown as-is. No research benefit currently sets `display_factor`. If a future client sets one, divide by it as the client does.

## Source file hashes (MD5, decrypted)

| File | MD5 |
|---|---|
| `BenefitUtils.lua` | `ecbb0468af54f552e4fb14a6a4fd525c` |
| `DefineBenefit.lua` | `c8b412f81b3c532222e525a02161d974` |
| `BenefitDefines.lua` | `c2e86e0cfb22952f3a8c20da8a4ea5aa` |
| `CollegeTechLevel.lua` | `a9c058c29f6c6e4ec7d44d513e0c54c9` |
| `UITechResearchEffectCell.lua` | `ad9597fd6bd58c29e0111156d1ac8a28` |
