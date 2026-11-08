# Official website APK review — 2026-11-08

## Result and important version limitation

The current APK button on the official website was resolved and its target
successfully downloaded and inspected. **It is not a newer global game build**:

| Property | Observed value |
| --- | --- |
| Official landing page | <https://www.zrrglobal.com/zrrofficial/> |
| APK | <https://d2ex983vwhbc52.cloudfront.net/exe/2026/06/09/232380/85541.apk> |
| Android package | `com.zroute.global.website` |
| Version name / code | `1.22.05` / `250` |
| Download size | 1,420,324,932 bytes |
| SHA-256 | `23e7d694915351860de717bb01a6da2d7179c93307ee9b29670aaae96d339bcd` |
| Catalog | `P1` / `V202606032030` |
| Manifest assets / bundles | 13,909 / 8,373 |
| APK signer certificate SHA-256 | `3dc1a0a21b63f0a23239fb886d6dc61afa33dee5eccf9d84012f4a0928872002` |

The repo's original progression baseline is `com.zroute.global` **1.30.07**,
with some later feature extractions from catalog `V202610032200`. The official
website distribution uses a different Android package and an older embedded
catalog. It must **not** replace or relabel those newer datasets.

Search results for [Uptodown](https://z-route-redemption.en.uptodown.com/android)
and [APKTurbo](https://www.apkturbo.com/games/z-route-redemption/com.zroute.global/)
advertise global version **1.41.02**, dated November 4, 2026. That is secondary
listing evidence only. Its APK was **not retrieved or inspected**, and a current
publisher hot-update catalog was **not retrieved**. The latest global build is
therefore not independently verified by this review. The request to inspect the
latest game build remains partially blocked by the website's stale download;
this report records what was actually acquired rather than claiming completion.

## Resolving the real official button

The HTML does not contain a direct APK link. At review time it loaded:

```
https://abres.octlib.com/site/zrrofficial/assets/index-ebe_Naoj.js
```

That JavaScript uses the website configuration endpoint:

```
https://www.zrrglobal.com/website/getWebsiteConfig?name=official_zroute&websiteName=official_zroute&language=en-US
```

`data.websiteConfig.EXT_PARAMS` is a JSON-encoded string. The button selects
`urlConfig[locale].downloadUrlConfig.apkUrl`, falling back to
`urlConfig.default.downloadUrlConfig.apkUrl` when blank. The default is the APK
URL above. Queries for `en-US`, `ru-RU`, `ja-JP` and `ko-KR` all exposed the same
fallback target; none exposed a newer locale-specific APK URL.

The URL's June directory was not used to infer its version: the version was read
from the APK manifest using Android build-tools `aapt dump badging`. The package's
embedded `BuildinCatalog.json` and `P1_V202606032030.bytes` were independently
read from the ZIP. `apksigner verify --print-certs` succeeded and printed the
certificate hash above; it also warned about unsigned `META-INF/services/*`
entries. **Signature validity does not establish signer continuity with the
repo's older global-package download**, and no such continuity comparison was
performed.

A filename or fixed download URL can remain old while a client retrieves patches.
This review did not launch the game or establish the effective live patch state.
Consequently the embedded June catalog must not be represented as today's game
configuration, even though the website still serves it.

## Findings added to this repository

- [Standalone Capitol feasibility and integration assessment](capitol-headless-client.md),
  including the distinction between office assignment, application queues,
  automatic appointment queues and kingdom decrees.
- [`data/capitol_protocol.json`](../data/capitol_protocol.json): derived field
  inventory for 21 historical title/application messages. Its provenance and
  status explicitly say historical, not latest or live-verified.
- [`data/apk-review-2026-11-08.json`](../data/apk-review-2026-11-08.json): acquisition
  chain, package/catalog/signature details, source hashes and explicit limits.
- [`tools/extract_capitol_protocol.py`](../tools/extract_capitol_protocol.py):
  source-hash-pinned, offline extractor; no network or game execution.
- [`tools/test_capitol_protocol.py`](../tools/test_capitol_protocol.py): synthetic
  parser tests, hash-gate test and checked-in contract checks.

The existing progression, hero, fighter and research datasets are unchanged.
The discoveries are **new to this repository**, not claimed new to the game.

## Static inspection method

The APK was downloaded outside the repository, SHA-256 hashed and examined as a
ZIP without installing or executing it. A local YooAsset 2.3.1 manifest reader
mapped selected source addresses to bundle hashes. Selected bundles used the
same outer XOR and inner TextAsset AES packaging already documented by this
repository. UnityPy parsed the restored bundles; TextAssets were decoded locally
without executing their Lua. Selection was limited to the protocol, title data,
permission logic and relevant UI send paths. The source index disambiguates
same-named send and receive files by owning bundle and plaintext hash.

Raw APKs, binaries, manifests/catalogs, publisher source, localization payloads,
private credentials and account state were not added to git. The public artifacts
are derived wire-field facts, source identities, an original extractor and an
assessment with uncertainty boundaries.

## Next acquisition required

Obtain the current publisher-delivered global APK (or establish an official
updated website channel), inspect its Android manifest/signature and embedded
catalog, then retrieve/verify the effective resource catalog through the
publisher's normal update flow. Compare current title schemas, UI send sites,
permission gates, queue operations and table hashes with these historical facts.
A schema mismatch requires a new reviewed provenance record; changing only the
version label is not sufficient.
