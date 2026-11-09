# Permanent server-transfer tracker

This tracks **permanent character/server migration**, not temporary event travel,
map relocation, relocation cosmetics, or automatic season-start Warzone migration.

## Reviewed versions

| Client | Embedded catalog | Assessment | Evidence |
| --- | --- | --- | --- |
| Global 1.41.02 / build 344 | V202611021100 | References present; complete workflow **not established** | [Snapshot](../data/server-transfer/build344.json) / [APK provenance](../data/apk-build344-provenance.json) |

**Current conclusion:** the inspected embedded client contains preparatory or
leftover migration scaffolding. A usable end-to-end permanent transfer feature
has **not** been established. This is not proof that all implementation is absent;
it is not a release announcement or evidence that transfers are currently enabled.
The effective live hot-update catalog and server behavior were not inspected.

## Build-344 evidence

### Item definitions and official English text

- `item_UseUp_abroadMove`: **Server Migration**; description **“Use to change your
  server.”** Type `UseUp`, subtype `abroadMove`, `isUse=1`, icon
  `Icon_Item_Useup_Abroadmove`.
- Its prerequisite tuple is `id=20103, param1="1001", param2="15", param3="1"`:
  a condition referencing the Base and level 15. **Do not report this as confirmed
  transfer eligibility** without tracing the condition consumer and item-use
  handler. A usable-item flag alone is not proof of a working migration action.
- `item_UseUp_immigrantCard` has icon `icon_item_UseUp_immigrantCard` but blank
  name/description/type/subtype, empty prerequisites and `isUse=0`. This is a
  placeholder/inactive definition, not a confirmed obtainable transfer ticket.

### Protocol scaffolding

| Definition | Field | Evidence / limitation |
| --- | --- | --- |
| `server.proto` → `SmallWorldServerInfoDto` | `bool isOpen = 6` | Comment means “whether character migration is open.” May also gate cross-server visits; permanent execution flow not established. |
| `world.proto` → `KingdomInfoDto` | `int32 migrateCastleLevel = 19` | Comment describes an immigration Base level, cross-server. Exact threshold semantics and live policy unknown. |
| `world.proto` → `KingdomInfoDto` | `int64 lastMigrateLimitModifiedTime = 21` | Last modification time of immigration restrictions. |

### Notification code, not migration execution

Restored `TempleKingdomInfoObject.lua`, function `SetImmigrationRedPoint`
(source line range 194–198), performs only:

1. Store `immigrateRedPoint`.
2. Dispatch `OnImmigrationRedPointUpdate` with that flag.

This is UI-notification scaffolding. It does **not** select a destination, consume
a ticket, send a migration request or change the account's home server. Earlier
conversation wording that described this as “immigration logic” was too broad.

### Missing pieces in the inspected subset

- No dedicated permanent-transfer screen or permanent destination-selection flow
  was identified in the searched embedded manifest paths and inspected assets.
- No clearly named permanent-migration request was identified in the inspected
  protobuf schemas.
- The `abroadMove` item's actual execution path was **not traced**.
- Costs, power/age/season restrictions, target-server acceptance, and release
  timing are **not established**.

The search covered manifest address names, selected/restored protobufs, 24
English localization TextAssets, Item definitions and selected Temple bytecode.
It was **not an exhaustive semantic audit of every Lua, managed or native method**.
A generic command, inherited implementation or effective hot update could escape
these searches. Missing search hits must not become a definitive “not implemented”
claim.

## Similar-looking references that do not establish permanent transfer

- `WorldCityRelocateC2S` and `PushMyCityStateS2C.relocateCDEndTime` support
  relocation/cross-server state. English text `cross_server_tips8` mentions a
  **5-minute cooldown for cross-server transfer**, while `cross_server_tips9`
  says **“Click to return to the original Warzone.”** Do not apply that cooldown
  to permanent migration.
- `S1_season_mail_1` describes Warzones migrating and a server restart at season
  start. That does not establish player-selected permanent migration.
- `CityMigrationSkin` and similarly named items are relocation appearances.
  “Permanent” on a cosmetic means permanent skin duration, not permanent transfer.

## Updating this tracker for future APKs

1. Record package, app/build version, archive/split hashes, signer verification
   and embedded catalog. Record effective hot-update provenance separately if
   actually acquired; do not infer it from the APK version.
2. Locate current bundles by manifest **address**, not old bundle hashes. Search
   for `abroadMove`, `immigrantCard`, migration/immigration/server-transfer terms,
   the three fields above, and any new relevant screens/commands. Generic
   relocation hits require classification, not automatic inclusion.
3. Restore the actual packaging. Build 344's Lua is sparse-masked 5.4 bytecode;
   raw masked disassembly can produce convincing false values. The static
   [literal-table reader](../tools/lua54_tables.py) must fail closed if a future
   format differs. Never run publisher Lua just to inspect definitions.
4. Compare Item fields, official strings, conditions, protocol field numbers/types,
   use-handler routing, destination UI, confirmation/spending code, server/home
   identity changes and result/error handling. Trace the path end to end before
   upgrading the implementation assessment.
5. Add `data/server-transfer/build<CODE>.json` using the same schema as the
   baseline. Preserve old snapshots. Populate **observed** evidence and explicit
   coverage gaps; do not just copy the old claims and change its version label.
6. Compare snapshots with the offline helper:

   ```sh
   python3 tools/compare_server_transfer.py \
     data/server-transfer/build344.json \
     data/server-transfer/build<CODE>.json
   ```

   It reports semantic evidence, source hash, assessment and coverage changes
   separately. Hash changes alone are not a feature change; unchanged evidence
   with incomplete coverage is not proof that nothing changed. A valid comparison
   exits 0 even when changes exist; invalid input exits 2. This tool does **not**
   extract APKs or decide whether transfers are implemented/available.
7. Append the reviewed version to the table above and link the new report from
   that APK's review. Keep raw assets, localization, bytecode and account data
   outside git. No live transfer/item use should occur without separate explicit
   authorization.

### Assessment boundaries

- **References present; workflow not established:** current build-344 baseline.
- **Client workflow established:** reserve this for a traced permanent-transfer
  path, with entry UI, destination/eligibility, command construction and result
  handling. Still not proof of live availability.
- **Live availability verified:** requires separately authorized observations on
  a named build/effective catalog and server context. A server flag or an item
  definition alone does not meet this bar.

## Reproducibility / validation

The snapshot pins six relevant TextAssets by owning bundle and SHA-256; Lua also
has its restored chunk hash. For protocols, the payload hash is of the locally
decoded text; for Lua it is of the masked chunk; for localization it is of decoded
JSON. These identities let another reviewer reproduce the comparisons without
publishing the publisher's source. The complete APK identity is linked above.

```sh
python3 tools/compare_server_transfer.py data/server-transfer/build344.json data/server-transfer/build344.json
python3 -m unittest discover -s tools -p 'test_*.py' -v
```
