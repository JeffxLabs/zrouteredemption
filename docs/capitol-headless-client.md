# Capitol management without the full game client

## Assessment

**A standalone Capitol service is technically plausible, but not yet demonstrated.**
The retrieved website APK has named protobuf commands for office snapshots,
applications, appointment, replacement and dismissal. Its UI sends those commands
through the same generic `Network.Send(command, protobuf)` mechanism used by chat.
There is no rendering dependency in the inspected command builders. Reusing the
existing ZR Chat authentication/session/transport implementation is a much better
starting point than running Unity, emulating taps, or creating another login stack.

This is a **static protocol assessment of historical version 1.22.05**, not proof
that today's servers accept these commands, nor a finding about new features in
1.41.02. See [the acquisition report](apk-review-2026-11-08.md). No game account
was connected, credentials read, messages sent, buffs changed or live Apparatchik
process modified for this review.

## Confirmed from the retrieved APK

The game's internal name for the Capitol subsystem is `temple`. Derived field
facts for 21 relevant messages are in [`data/capitol_protocol.json`](../data/capitol_protocol.json).
They are sufficient to plan decoders/encoders, **not a complete session schema**:
`PlayerSimpleDataPB` and its dependencies, common errors/heartbeat, kingdom state,
and login initialization also need their current definitions.

| Task | Observed wire contract | Important qualification |
| --- | --- | --- |
| Snapshot all offices | `GetTempleTitleC2S(serverId)` → `PushTempleTitleS2C(serverId, titleInfos)` | Keep snapshots segregated by server. |
| Refresh one office | `TempleTitleC2S(title)` → `TempleTitleS2C(titleDto)` | No server ID in the request. Do not assume an arbitrary remote Capitol write context. |
| Track changes | `UpdateTempleTitleS2C(titleInfo)` | No server ID in this incremental message; contextual routing needs verification. |
| Dismiss an occupant | `TempleDepriveTitleC2S(title, userUid)` | Actual Dismiss UI uses this exact tuple. The request includes the expected player's int64 ID, not a display name. Server stale-occupant handling is unknown. |
| Appoint / replace | `TempleAppointTitleC2S(title, userUid)` / `TempleChanegeTitleC2S(title, userUid)` | `Chanege` is the actual wire spelling, not a documentation typo. |
| Read applications | `TempleApplicationListC2S(title)` → `TempleApplicationListS2C(title, applicationPlayers)` | Application entries include player identity and application time. |
| Approve / reject applications | `TempleAgreeTitleApplicationC2S(title, playerId)` / `TempleCancelTitleC2S(title, playerId)` | Rejection is confirmed by the application-list UI. Do not assume rejection also removes an auto-appointment entry. |
| Read automatic appointment queue | `TempleTitleDto.waitPlayers` | Separate from the applications list. Order is meaningful. |
| Configure rotation interval | `TempleTitleCDC2S(id)` | `id` is a config row ID, **not seconds or a title ID**. |
| Configure automatic approval | `TempleAutoApplicationC2S(auto)` | Global-looking request, not a per-position toggle. Kingdom state holds `autoAgreeTitle`; scope still needs live verification. |
| Read tenure history | `GetTempleTitleRecordC2S(serverId, titleId)` → `TempleTitleRecordS2C` | Useful for reconciliation, not a substitute for a fresh snapshot. |

`TempleTitleDto` contains `title`, `appointTime`, `appointAgreeTime`,
`playerSimpleData`, `waitPlayers`, and `closeTime`. The consuming Lua treats
appointment times as **milliseconds**, converts to seconds for the displayed
tenure, and computes estimated appointment time as:

```
appointTime / 1000 + queueIndex * kingdomInfo.titleChangeCd
```

The queue index is 1-based. These are estimates from the client, not reserved
appointments or a safe basis for local mutations. `closeTime` supports expiring
cross-server offices; its exact boundary behavior still needs checking.

### Static intervals and limits (historical)

`KingdomBuffTimeQueue` maps row IDs 1–4 to 300, 600, 1200, and 1800 seconds.
`UITempleOfficialTimeSettingPanel` matches `titleChangeCd` against those seconds;
the setter transmits the selected row's ID.

`ActivityTempleBattleParameter` includes:

| Key | Value | Interpretation supported by consuming code |
| --- | ---: | --- |
| `kingdom_rank_max_list_queue` | 50 | Auto-appointment queue capacity displayed in the office UI. |
| `kingdom_rank_max_list_approve` | 50 | Configured application-list limit. |
| `kingdom_official_record_limit` | 100 | Configured tenure-record limit. |
| `kingdom_same_rank_time_limit` | 1800 | Same-office application cooldown, seconds in `GetAplicationCd`. |
| `kingdom_rank_appoint_limit` | 300 | Manual appointment cooldown, seconds added to `appointAgreeTime`. |
| `kingdom_rank_time_limit` | 280 | Raw configured value; do not conflate with the interval selector or infer semantics from the name alone. |

Do not overwrite newer planner constants or assume these limits are current
server rules. Source hashes are in [`data/apk-review-2026-11-08.json`](../data/apk-review-2026-11-08.json).

### Permissions and special seats

`TempleDefine.TitleIdType` identifies King=1, Praetor=2, Conqueror=8,
CivilianLeader=9 and MilitaryLeader=10. English role labels must be resolved from
current localization/config, not guessed from these internal names.

`TempleTitleModule.CheckHavePermission`:

1. Rejects another server's context.
2. Requires the current player to hold an office.
3. Allows the special CivilianLeader/MilitaryLeader seats only when the player is
   the Conqueror.
4. Otherwise rejects managing one's own title and requires `titleConfig.appoint == 1`.

The historical title table sets `appoint=1` for IDs 1, 2 and 8, zero for the
others. These are **client-side UI gates**, not a way around server permissions.
Apparatchik should retain its own narrower policy: no automatic action on the
President/Overlord or its own seat, with special commander seats observation-only
unless separately authorized and actually permitted.

### Buffs versus offices

Office benefits are static `ActivityTempleBattleTitle.benefit` entries. Granting
an office asks the server to assign a title; a headless client does not apply a
local stat modifier. Kingdom decrees are a **different capability**:
`GetTempleDecreeC2S`/`PushTempleDecreeS2C` and `UseTempleDecreeC2S` exist, with
remaining uses, decree points, use time and buff end time. Do not enable spending
or decree execution as an incidental consequence of implementing seat management.
Treasury distribution, gifts, nation changes and mail are also out of scope.

## What remains unproven

- **Current protocol:** the website points at an older distribution. Obtain a
  current publisher-delivered APK and its effective patch catalog; compare the
  schema, title mapping, permission code and UI send paths before implementing writes.
- **Auto-appointment removal / move-up:** no dedicated operation was established
  in the inspected historical title schema/UI subset. `TempleCancelTitleC2S` is
  confirmed for *applications*, not the separate `waitPlayers` queue. Current
  queue cleaning cannot be claimed supported from this evidence.
- **Live state completeness:** verify whether login pushes everything required,
  which queries produce incremental changes, kingdom settings/permissions update
  reliably, and whether a slow/stopped subscriber misses events.
- **Acceptance and races:** no live dismissal, permission rejection, stale UID
  rejection, replacement race, or same-title command correlation was tested.
- **Session coexistence:** ZR Chat documents account-in-use disconnections. A
  second connection for the same account must not fight the full game, ZR Chat,
  or another headless instance for ownership.
- **Operational risk:** current authentication renewal, server classification,
  rate limits, publisher permission and long-running behavior are not established
  by an offline schema or by chat working. Consult the game's terms/account rules.

## Recommended Apparatchik integration

Keep the current screen/OCR backend intact. Introduce a capability-based backend
interface; a headless backend produces structured office/queue observations and
accepts narrow intents, rather than pretending to supply screenshots or taps.

```
ZR Chat-derived single-owner session
  → current-version protocol decoder
  → versioned Capitol state store
  → Apparatchik policy / Observe or Execute mode / durable intent log
  → narrowly allowlisted command writer
  → server update + explicit read-back verification
```

Suggested capabilities: `readOffices`, `readApplications`, `dismissOccupant`,
`approveApplication`, `rejectApplication`; advertise `removeAppointmentQueueEntry`
only after separately recovering and verifying its real wire path. Keep interval,
auto-approval, appointment/replacement and decrees disabled by default.

### Required execution safeguards

- One connection owner per account across backends; explicit handover, never
  automatic takeover. Disconnect on another-client/session-replacement errors.
- Reuse the reviewed ZR Chat login identity check, policy/version gate, Ping/Pong,
  framing, bounded decoder and token renewal. **Do not copy stale versions or
  import private account stores into this public repository.**
- Bind every intent to account, character, server, title, exact player ID, state
  generation and policy revision. Store int64 IDs losslessly (strings at JSON/JS
  boundaries), not IEEE-754 numbers or mutable display names.
- Re-read the seat immediately before mutation, re-evaluate permissions and
  allowlist against fresh structured alliance identity, and cancel on changes.
  Unknown/missing alliance membership is not evidence that removal is safe.
- Serialize writes. Persist intent before send. A socket write, generic ACK or
  lack of an error is not success; require a fresh title update/read-back. If a
  different player instantly refills the seat, record replacement separately and
  evaluate them as a new candidate.
- On timeout, disconnect or crash, mark the attempt uncertain and reconcile via
  snapshot/history before considering another intent. Never blindly replay it.
- Fail closed on unknown schema, stale or ambiguous state, cross-server context,
  expired office, lost permissions or uncorrelatable errors. Retain dry-run,
  per-position enablement, audit history, rate bounds and an emergency stop.
- Choose one actuator: the screen backend and headless backend must not execute
  against the same account at the same time. Switching back to the full game
  requires releasing the headless session first.

### Incremental delivery / acceptance gates

1. **Current evidence + offline codec:** recover the current effective schema and
   produce synthetic fixtures for nested IDs, empty seats, ordered queues,
   expiring commander seats, malformed fields and incremental updates.
2. **Read-only spike:** explicitly authorized account, full game and other clients
   disconnected, no automatic rules. Reach authenticated identity, query offices,
   compare with a human-verified snapshot, then test permission changes,
   reconnect, missed updates and account-in-use shutdown.
3. **Shadow backend:** feed real structured observations into Apparatchik Observe
   mode, compare proposed decisions with the existing guard without executing.
4. **Single manual write:** separately authorize a known target dismissal;
   verify command rejection paths and read-back. No queue cleaning yet.
5. **Controlled Execute mode:** enable only validated capabilities with durable
   uncertainty handling, soak tests and explicit handover/rollback. Add queue
   mutation only after current wire evidence and a scoped test establish it.

**Decision:** pursue a read-only proof of concept first. Reusing ZR Chat makes a
small, non-Unity daemon credible; this review does not justify replacing the live
Apparatchik guard or promising complete queue management yet.

## Evidence anchors and reproduction

All publisher source stays outside git. The source index records the owning
bundle and plaintext SHA-256, disambiguating the send and receive files that are
both named `temple.lua`.

- `temple.proto`: title/application messages and DTO fields.
- send `temple.lua`: literal command strings passed to `Network.Send`.
- receive `temple.lua`: snapshots, single-title changes and application callbacks.
- `UITempleOfficialInformationPanel.lua`: Dismiss builds `(title, userUid)`;
  queue count; tenure/interval logic.
- `UITempleOfficialApplicationListCell.lua`: reject via `TempleCancelTitleC2S`.
- `UITempleOfficialTimeSettingPanel.lua`, `KingdomBuffTimeQueue.lua`: ID/seconds mapping.
- `TempleTitleModule.lua`, `TempleTitleObject.lua`, `TempleDefine.lua`,
  `ActivityTempleBattleTitle.lua`, `ActivityTempleBattleParameter.lua`: permission,
  timing and static table evidence.
- Related implementation review: local `zroute-chat/docs/COMPATIBILITY.md` and
  `apparatchik/docs/GAME_SCREENS.md` were inspected read-only. Their existing live
  verification claims concern chat/UI, not a headless Capitol write.

Reproduce the checked-in field inventory from the exact pinned local schema:

```sh
python3 tools/extract_capitol_protocol.py /outside/repo/temple.proto data/capitol_protocol.json
python3 -m unittest discover -s tools -p 'test_capitol_protocol.py' -v
```

The extractor refuses another source hash before touching its output. Updating
that pin requires a new review, not simply relabeling the extracted data.
