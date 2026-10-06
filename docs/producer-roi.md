# Producer ROI Survivor modifiers

The Producer ROI calculator reads its static producer curves and upgrade costs from [`data/resources.json`](../data/resources.json) and [`data/progression.json`](../data/progression.json). Its inputs use the client benefit definitions below, rather than estimated Survivor rolls or invented defaults:

| Client benefit ID | Client name | ROI effect |
| ---: | --- | --- |
| 20001 | Food Output | Applies to the Farm's hourly output |
| 20002 | Metal Output | Applies to the Metal Smelting Plant's hourly output |
| 20003 | Oil Output | Applies to the Oil Extraction Well's hourly output |
| 20006 | Free Building Speedup Time + | Survivor free-finish threshold; entered in minutes |

The UI renders the names from the version-pinned client benefit data and uses original game resource icons in `assets/ui/` plus the Base sprite in `assets/buildings/1001.webp`. Values are user-entered because the static client tables identify modifier types, not a player's assigned Survivors, currently active bonuses, or account/server state. Enter the current totals shown in-game. The resource output inputs are kept separate so the selected producer only receives its matching Food, Metal, or Oil Survivor bonus. The client identifies Survivor benefit 20006 specifically as free building speedup time; it extends the free-finish threshold rather than adding Building Speed.

ROI calculations apply the entered construction speed to build time, add the Survivor free-finish threshold after speed adjustment, and scale matching producer output by the entered Survivor and other production bonuses plus collection uptime. Direct costs remain the original client costs. Other modifiers remain separate inputs to avoid assuming the user's non-Survivor bonuses.

The scope is limited to direct producer upgrades and their marginal output. Base prerequisite costs, gathering/march effects, Survivor recruitment bonuses, and server/event overrides are not modeled. This is an independent reference and is not affiliated with the game publisher.
