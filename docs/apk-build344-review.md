# Global 1.41.02 / build 344 review

## Acquisition and verification

On 2026-11-08 the owner supplied a Google Drive archive named
`com.zroute.global.344.zip`. It contains exactly three APKs. Android manifest
inspection confirms **`com.zroute.global`, version `1.41.02`, versionCode `344`**.
This resolves the earlier [official website download limitation](apk-review-2026-11-08.md):
the new artifact was supplied by the owner, not retrieved from that stale website.

| File | SHA-256 |
| --- | --- |
| Archive | `e760c5b9ab9d81db01c04bd3f7f3e0f4390e1e5d265d8945310f44aa908e5fb2` |
| `base.apk` | `8936075cca36a4ddad8df8c3dd956d44ec4495fe2a39ebfac74364906fdfe536` |
| `base_assets.apk` | `e8db032e0ab264f9282628484c97cc3ef0c4a9aedfd2128986d953f742f5efaf` |
| `config.arm64_v8a.apk` | `fa143d96b348798b81f5f3011bfa254f8a2c473a5f430c3ee34f7d76cc604cd5` |

All three pass `apksigner verify` and have certificate SHA-256
`ca6a10b0e3833c9154efae6c5f0304cc6c036e0f7215915d703232a34420cbc3`.
That establishes internally consistent valid signatures, **not independently
verified publisher signer continuity**. The APKs were not installed or run.
The embedded catalog is **P1 / V202611021100**. Its YooAsset 2.3.1 manifest
contains **18,875 assets and 9,022 bundles**. No live update policy or effective
hot-update catalog was queried, so these findings describe the supplied embedded
build, not guaranteed current server configuration or unreleased-feature availability.

[Machine-readable provenance](../data/apk-build344-provenance.json) records file
sizes, catalog hashes and inspected protocol/UI source identities. Raw APKs,
source, bytecode, catalogs, disassemblies and localization remain outside git.

## Packaging change and static extraction

The selected bundles still restore to UnityFS after XOR `0x10`. Protobuf
TextAssets retain the previously observed encrypted text packaging. Lua files
are now **Lua 5.4 binary chunks**, with an additional sparse byte mask. Passing
those masked chunks directly to `luac -l` can fail, or worse, emit plausible but
incorrect values and misspelled identifiers. Such preliminary output was discarded.

The independently reconstructed mask uses the payload length `L`, span `S=L-31`,
and eight index values `i=0..7`:

```
offset = 31 + floor(S*i/8)
byte[offset] ^= ((S + 29*i) mod 255) + 1
```

After restoring it, every one of the **959 selected Lua chunks** parsed with a
local Lua 5.4.1 disassembler. No Lua chunk was executed. As a cross-check, the
restored `KingdomBuffTimeQueue` chunk is byte-identical to a stripped Lua 5.4.1
compilation of the previously reviewed historical table. It contains 300 seconds,
not the erroneous 450 seen in masked disassembly.

[`tools/lua54_tables.py`](../tools/lua54_tables.py) is an original bounded,
static literal-table reader: it accepts only table/constant construction, never
calls Lua, rejects control flow/function calls/unknown globals, verifies the
chunk is fully consumed, and bounds input/counts/writes. It is not a general
bytecode executor. Generated `keys` define actual data rows; auxiliary `TYPE` or
other enum tables must **not** be counted as records.

## Progression findings versus the original 1.30.07 model

The separate [`data/build344-findings.json`](../data/build344-findings.json)
contains derived deltas and Capitol facts. This comparison uses the original
model IDs, not a complete diff against every later hero/fighter extraction.

| Definition | Original model rows | Build 344 rows |
| --- | ---: | ---: |
| Buildings | 99 | 107 |
| Building levels | 1,525 | 1,576 |
| Building upgrades | 1,313 | 1,314 |
| Research technologies | 328 | 332 |
| Research levels | 1,644 | 1,684 |
| HeroInfo (all modes/copies) | 321 | 351 |
| Playable filter (`heroType=1`, `showType=1`) | 32 | 32 |
| Benefit definitions | 359 | 360 |

### Four additional Alliance Competition research technologies

| ID | English name | Levels | Research Data to max |
| --- | --- | ---: | ---: |
| 9011 | Convoy Points Buff | 10 | 4,520 |
| 9012 | Special Ops Points Buff | 10 | 4,520 |
| 9013 | Recruit Points Buff II | 10 | 4,520 |
| 9014 | Points Buff II | 10 | 7,200 |
| **Total additional** | | **40** | **20,760** |

These are tree 9. Their table-level gates preserve condition `300007` with
parameters `1`, `5`, `0`, `1` (season/world-stage state); do not show them as
unconditionally available. The first three use positions `1_8_1` through
`1_8_3`; 9014 uses `1_9_2`. All have final-level benefit value `0.5`, with benefit
IDs 6009, 6010, 6011 and 6004 respectively. The JSON preserves each level's costs,
time, prerequisite and benefit rather than treating the final value as a
per-level increment. Research Data totals are summed costs, not an inference
from power/ability values.

Summing all tree-9 level costs in build 344 gives **54,110 Research Data** for
Alliance Competition (33,350 baseline + 20,760 additional). The existing research
planner is **not yet rebuilt** with these gated nodes. The README's original
33,350 Alliance Competition / 714,690 overall totals remain historical
planner-baseline numbers, not a claim about build 344. This review does not infer
a new game-wide total merely by adding these nodes to the older overall total.

### Additional building/decor definitions

IDs 10034–10040: Dinki, Wasteland Falcon, Skyguard, Air-Ground Synergy,
Clockwork Witch, Clockwork Warlock and Clockwork Pumpkin King (configured max
level 7). ID 20015 is a one-level `grey_zone_caravan` definition; that localization
key is preserved because its English string is not in the pinned language subset.
These are client definitions, not proof of live availability or ordinary Base
construction upgrades. Their conditions/type IDs are retained in the findings JSON.

### What did not change in the checked subset

- Base definition 1001 still has **maxLv=30**. Every published Base level's
  resource costs, upgrade time and prerequisite tuple matches the supplied build.
- The playable hero ID set has no additions under the repository's existing
  filter. Increased HeroInfo row count must not be marketed as new playable heroes.
- HeroLevel still has 350 rows across the two curves; HeroStar still has 26 rows.
  Equal row count alone does not prove unchanged values.

No existing planner dataset has been silently regenerated or relabeled. Updating
all planners requires a separate model migration including other table changes,
localization/layout/artwork joins and regression validation.

## Updated headless Capitol assessment

**Evidence now covers build 344's embedded protocol and relevant bytecode**, not
only the stale website client. The full `temple.proto` is byte-for-byte identical
to the historical schema (SHA-256
`d8a12cfc91ce7c46acb1bdb0f024772ff322f040c7a25d294e1f0e4f1c012263`).
[`data/capitol_protocol_build344.json`](../data/capitol_protocol_build344.json)
records the same 21 title/application message contracts with distinct build-344
provenance. The earlier inventory is retained as historical evidence.

Restored-bytecode disassembly independently confirms:

- Send wrappers retain the literal `Network.Send` command names, including
  `TempleDepriveTitleC2S` and the misspelled `TempleChanegeTitleC2S`.
- The office information panel's Dismiss action builds `title` and `userUid`
  from the selected title/profile before invoking `TempleDepriveTitleC2S`.
- `TempleTitleModule.CheckHavePermission` still checks same-server context,
  held office, special Conqueror authority for commander seats, exclusion of the
  current player's own title, and the `appoint` flag.
- Automatic rotation IDs still map to **300/600/1200/1800 seconds**; the setting
  panel sends the selected **row ID**, not seconds. Relevant configured limits
  remain 50 queue entries, 50 applications, 100 history records, 1800-second
  same-title application cooldown and 300-second manual appointment cooldown.
- The current English role mapping is established: President=1, Vice President=2,
  Tactical Minister=3, Defense Minister=4, Construction Minister=5,
  Research Director=6, Civil Minister=7, Overlord=8, Civil Commander=9,
  Military Commander=10. The JSON also records their benefit values and flags.

**The remaining queue gap is real:** the embedded schema still does not establish
an auto-appointment removal/reorder command. The inspected application cell calls
`TempleCancelTitleC2S`; that alone does not prove it mutates the separate
`waitPlayers` queue. The current live UI may receive hot-updated logic. Do not
repurpose a different title mutation based on a matching-looking button.

**Decision remains: proceed with a read-only spike using ZR Chat's session layer.**
Build-344 schema and UI evidence strengthen feasibility for snapshots and exact-ID
dismissal. They do not establish live acceptance, complete initialization, queue
cleaning, account classification, publisher permission or reliable unattended
operation. Keep the safeguards and incremental gates in the
[headless integration assessment](capitol-headless-client.md). No game account
was connected, no credentials inspected, no live state mutated.

## Permanent server-transfer follow-up

The [server-transfer tracker](server-transfer-tracker.md) records a versioned
build-344 baseline for future APK comparisons: a **Server Migration** item,
an inactive immigration-card placeholder, migration-related server/kingdom fields,
and an immigration notification setter. These are scaffolding references, **not
an established end-to-end permanent transfer implementation**. The setter only
stores a notification flag and dispatches an event; no dedicated permanent
transfer UI/request or complete item-use route was established. The tracker
separates temporary cross-server travel, season migration and relocation cosmetics,
pins the relevant source identities, and documents coverage limits.

## Reproduce and validate

Supply local TextAssets named `<bundle>-<asset-name>` as recorded in the source
pins. These are payloads from the selected UnityFS bundles, not raw APK entries.

```sh
python3 tools/review_build344.py /outside/repo/textassets data/build344-findings.json
python3 tools/extract_capitol_protocol.py /outside/repo/temple.proto data/capitol_protocol_build344.json --build344
python3 -m unittest discover -s tools -p 'test_*.py' -v
python3 tools/extract_model.py check data
python3 tools/extract_base.py check data
```

The report generator validates every pinned payload hash before producing output.
Changing the pin or version is a new review, not an automatic update workflow.
