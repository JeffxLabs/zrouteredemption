# Apparatchik Direct: complete headless Capitol host implementation plan

- **Status:** proposed implementation plan, not an implemented or live-verified service.
- **Prepared:** 2026-11-09.
- **Working product name:** Apparatchik Direct (rename before publishing if desired).
- **Primary targets:** Linux x86_64, initially this Arch Linux/WSL2 environment, then a small unprivileged Proxmox LXC.
- **Clients:** Apparatchik Android for complete host/Capitol administration; ZR Chat Android for hosted chat.
- **Hard requirement:** production operation must not need Unity, the game APK, an Android emulator, OCR, screen capture, ADB, or a permanently connected phone.

## 1. Decision summary

Build a **private functionality fork of Apparatchik**, not a fresh dashboard or an OCR shim. Retain its Linux daemon, secure remote-control platform, policy concepts, audit/recovery machinery and Android companion. Add a structured game-protocol backend and a shared game-session service derived from ZR Chat's pure Kotlin/JVM modules.

Use two small cooperating processes:

1. **`apparatchik-directd` — Swift:** public HTTPS endpoint, pairing/access control, host administration, Capitol policy and scheduling, operation coordination, audit and alerts.
2. **`zr-sessiond` — Kotlin/JVM:** sole owner of game credentials, policy/gateway lookup, authenticated game connections, heartbeat, protocol decoding, chat services and narrowly typed Capitol commands. Local Unix socket only; no independent public listener.

The Android apps are remote clients of this host. **Neither app opens a second direct game session while using hosted mode.** A single hosted game connection for an account serves both Capitol management and chat. Losing a phone connection does not disconnect that game session or stop authorized host automation.

This is a reuse-first choice, not a claim that these capabilities already exist. ZR Chat currently connects directly from Android; a Linux broker, hosted-client API and remote transport still have to be built. The Swift/Kotlin boundary is intentional: porting the established game stack to Swift, or rewriting Apparatchik in Kotlin, would create substantially more parity work. Revisit the two-process design only after measured resource results, not speculation.

**Complete release is conditional on recovering and verifying all required operations**, especially automatic appointment-queue removal and queue-priority/bump behavior. A working office reader or dismissal prototype is not the complete product.

## 2. Baseline, evidence and source boundaries

### Inspected source anchors

| Project | Inspected baseline | Useful existing code |
| --- | --- | --- |
| Apparatchik | `e37a5776`, branch `port/linux`, repository `jfryton/apparatchik` | `Sources/ApparatchikCore/Daemon/`, `Handoff/`, `Settings.swift`, `Policy.swift`, `AppointmentQueue.swift`, `AppointmentBump.swift`, `Sources/ApparatchikServer/`, `android/` |
| ZR Chat | `740c4f1`, branch `fix/android-reliability-background-20260927`, repository `JeffxLabs/zroute-chat` | JVM modules `core-protocol`, `core-auth`, `core-chat`, `core-storage`, `service-connection`; Android `ChatRuntime`, `AndroidChatConnection`, account/authentication flows |
| APK research | global 1.41.02 / build 344, catalog `V202611021100`; reference commit `9fbd402` | [build review](apk-build344-review.md), [Capitol inventory](../data/capitol_protocol_build344.json), [derived facts](../data/build344-findings.json) |

The Apparatchik checkout has substantial uncommitted Linux-port work. It was inspected read-only. **Do not branch/copy it as a supposedly clean release, reset it, or fold unrelated changes into this fork.** At implementation start, inventory upstream branches/PRs and choose a reviewed, testable committed baseline in a separate clone/worktree. Record any specifically selected follow-up fixes. ZR Chat's source and deployment handoff have different checkpoints; use a pinned source commit, not an assumed installed-phone version.

No top-level license file was identified in the inspected tracked trees. Confirm the owner's authority to fork/reuse each repository, license choice and third-party attribution before distribution. Default the new implementation repository to **private**, particularly because ZR Chat is private. The public reference repo may carry derived protocol facts and this plan, not copied private implementation, credentials or restored publisher source.

### Evidence classification

- **Observed:** build-344 `temple.proto` equals the historical schema; restored bytecode confirms the exact-ID Dismiss path, title permission checks and 300/600/1200/1800-second rotation choices. Existing app source provides the reusable infrastructure described above.
- **Existing project behavior, not new headless proof:** Apparatchik has Linux remote control, seat/queue workflows and timed bumps; ZR Chat has an independently developed session/auth/chat stack. Previous verification of those products is not verification of their combination or all current hosted features.
- **Unverified:** effective live hot-update schema, headless Capitol initialization/permission changes, server rejection/correlation behavior, queue removal/reorder mapping, queued versus searched appointment behavior, round-trip timing, continuous auth renewal, restrictions/classification and resource consumption of this fork.
- **Proposed below:** APIs, storage schemas, services, capabilities, budgets, timelines and acceptance thresholds. None should be presented as existing endpoints or measured benchmarks.

Read-only login can still displace another game client. Planning authorization does **not** authorize a live login, message, appointment, dismissal, credential renewal, infrastructure provisioning or migration. Each live stage below needs a named account and bounded owner-approved scope. Preserve all existing account exclusions; do not select an account just because it is locally available.

## 3. Product scope and definition of complete

### Mandatory Capitol functionality

| Capability | Required behavior | Evidence / delivery gate |
| --- | --- | --- |
| Cabinet dashboard | All known roles, exact occupant ID/name/alliance, tenure, vacant/unknown/stale, expiring commanders, controller/server context | Snapshot contract known; initialization and context need live checks |
| Policy guard | Alliance allowlist, player allow/deny policy, per-position enable/pause, dry run, rate limits, durable stop, immediate-refill handling | Existing policies need extraction from OCR assumptions |
| Manual office operations | Dismiss, appoint, replace where actually permitted; resolved target identity and explicit confirmation | Named contracts known; server safety/race behavior unverified |
| Applications | Full application list, approve/reject, individual and bounded policy-assisted decisions | Contracts known; list freshness/completeness require verification |
| Automatic appointment queue | Full ordered list, safe individual removal, per-position automatic cleaning, immediate queued appointment/priority action | Read field known; removal/priority semantics are **release blockers** |
| Timed appointment bump | Queue or resolved-search target; verified actual first queued player, safe clock bounds, no late firing, persistence/cancel/results | Must recover actual queued/search wire paths and stale-occupant behavior |
| Rotation/auto approval | Read current setting; change interval by config row ID; change actual automatic-approval scope; verify read-back | Request shapes known; resulting state updates/scope need review |
| Cross-server/commander behavior | Display conquered/overlord layouts as structured roles; write only within proven account authority and supported target context | Never infer write permission from visible seats |
| History and audit | Office tenure history, operation ledger, policy reasons, bounded evidence, export/retention and restart recovery | Replace screenshots with structured, source-attributed evidence |
| Remote administration | Every normal lifecycle/setup/configuration/recovery action available in Apparatchik Android | No desktop UI or routine SSH requirement |
| Always-on hosting | Headless service survives client disconnect, host restart and bounded network faults without replaying uncertain actions | Fault tests and soak required |

**Office buffs versus kingdom decrees:** the baseline release covers the complete office/queue management workflow above, including all permissions the account legitimately holds. Also implement read-only decree status in the Capitol console. Add manual decree activation as a separately permissioned, explicitly confirmed capability once its cost/cooldown/effect path is verified; never enable automatic expenditure by default. Treasury gifts/resources, nation renaming, mail campaigns, battles and arbitrary gameplay are not part of Capitol-buff parity.

**Other existing Apparatchik functionality:** retain remote administration, backups, health reports, history, notifications, host management and updates. Do not fake a screen/video in headless mode. Alliance Help is an independent optional protocol feature, not a reason to retain an emulator; advertise it only after its own protocol/reliability validation. OCR learning, pixel confidence, display density, touch jitter, keyboard, clipboard and emulator recovery have no headless equivalent and must be explicitly unavailable, not silently ignored controls.

### Hosted ZR Chat functionality

Hosted mode must preserve the supported Android chat experience: account/room selection, private/groups/channels and language rooms, history pagination/search, messages/shares/images/quotes, delivery status, recall and existing supported reactions/actions, account profiles, saved rules, translations/AI settings, exports and notifications. Track each feature in a compatibility matrix against the pinned Android source. Unsupported existing protocol features must not become implicitly promised just because the UI can display them.

The host owns game interaction, shared history ingestion, delivery/recall attempts and any unattended rules. Phones own drafts, layout, selection, local caches and their notification preferences. Explicitly decide execution location for translations, AI replies and uploads; never run an automatic rule or AI responder both on the phone and host.

### Non-goals / prohibited shortcuts

- No emulator, accessibility automation, packet tunnel from a live game, protocol impersonation workaround, integrity/anti-cheat bypass or synthetic gameplay traffic to appear active.
- No general `sendRawGameCommand`, arbitrary shell/URL fetch, arbitrary SQL or unrestricted file API exposed to either Android app.
- No promise of exactly-once game commands: the game server does not expose our idempotency keys or a demonstrated compare-and-swap.
- No forced automatic host takeover, concurrent same-account session, silent credential migration or background email-code requests.
- No public internet exposure by default, automatic Proxmox administration, or dependence on Home Assistant for operation.

## 4. Target architecture

```text
 Apparatchik Android                         ZR Chat Android (hosted mode)
   host/Capitol administration                 chat UI, drafts, notifications
           \                                      /
        pinned TLS + individually scoped client credentials
                              |
                  apparatchik-directd :57567
       pairing/RBAC | versioned APIs | resumable event stream
       Capitol policy | scheduler | operation coordinator | audit
                              |
             bounded typed Unix-domain RPC + peer credentials
                              |
                        zr-sessiond
       account vault | policy/version gate | session actor per account
       gameplay writer | Capitol reducer | chat/history/rules | auth
                              |
          ONE game gateway connection per hosted game account
```

### Ownership rules

| State/resource | Sole authoritative owner |
| --- | --- |
| Public TLS identity, client registry, permissions, host settings | Swift control daemon |
| Policy revisions, enabled roles, Execute/stop grants, bump schedule | Swift control daemon |
| Provider credentials, reconnect credentials, private connection config | JVM service/vault |
| TCP framing counters, authenticated identity, gateway socket | One JVM session actor per identity |
| Decoded game state / wire receive order | JVM reducers, partitioned by account/server/context |
| Public accepted operation ID / authorization / policy audit | Swift durable operation coordinator |
| Final wire attempt and uncertain-send journal | JVM service, durably linked to operation ID |
| Chat ingestion/history and automatic-send ledger | JVM service |
| Phone drafts, selections, presentation and cache cursors | Each Android app instance |

Do not let both services update one SQLite database. Use separate owner-controlled databases and explicit RPC receipts/reconciliation. Broker-side read models can be mirrored in Swift only with generation/revision metadata; no second writable source of truth.

### Initial component layout (proposed)

**Apparatchik fork:**

- `Sources/ApparatchikDomain/`: policy model, exact identity, roles, intent and result types, state quality; no CoreGraphics/ImageIO/ADB imports.
- `Sources/ApparatchikHeadless/`: broker adapter, lifecycle, reconciliation, session fencing, backend-independent scheduler.
- `Sources/ApparatchikServer/`: reuse TLS/auth/router foundation; add capability, account, Capitol, operation and hosted-chat routes.
- `Sources/ApparatchikDirectDaemon/`: composition root, local admin socket, systemd integration; does not instantiate emulator/OCR objects.
- `Sources/ApparatchikStorage/`: SQLite and migrations for control-plane state/operations if not sensibly isolated in Domain.
- `android/`: existing companion extended with backend capabilities, account/admin screens, structured evidence and new command contracts.
- `broker/` or a version-pinned private build dependency: JVM host module and shared ZR Chat modules, with independent tests/lockfiles/SBOM.
- `contracts/`: JSON schemas/golden fixtures for public APIs and local RPC; synthetic data only.
- `packaging/direct/`: Arch and Debian/Ubuntu installers, units, upgrade and backup tooling.

**ZR Chat repository:** retain reusable JVM modules; extract a transport-independent app-facing chat interface and add a hosted HTTPS/event transport. Keep Android-only ML Kit/Keystore/notifications/UI adapters out of JVM service modules. Reuse exact tested protocol/auth code through a pinned shared artifact/submodule or audited source integration; pick one mechanism in Phase 0 and record licenses/provenance. Do not maintain untracked copied forks of the codec.

### Removing heavy dependencies

Current Linux `Package.swift` pulls PNG, FFmpeg and other screen-path dependencies into `ApparatchikCore`. A new binary alone will not remove them if it still imports that whole target. Split portable policy/server/security code into light targets so the Direct release neither links nor installs CPNG/CFFmpeg/OCR dependencies. Optional compatibility builds may retain the old screen backend, but it is not installed or required by the Direct runtime.

## 5. Backend and protocol contracts

### Backend interface

Define `CapitolBackend` around **structured observations and typed intents**, not `capture()`, taps or a synthetic device lease:

- `capabilities(account)`
- `subscribe(account, cursor)` and `snapshot(account, context)`
- `refreshOffices`, `refreshApplications`, `refreshAppointmentQueue`, `fetchTenureHistory`
- `resolvePlayer(query, context)` → user-selected exact ID
- `prepare(intent)` → proof/state revision/permission summary/expiry
- `commit(preparedIntent, executionGrant)` → durable operation reference
- `reconcile(operation)` and `cancelUndispatched(operation)`
- explicit `releaseSession`/`acquireSession` lifecycle.

Extract a pure `CapitolPolicyEngine` rather than implementing the existing `DaemonEngine` by faking OCR confidence and screenshot coordinates. Keep an optional adapter for legacy reads, but all headless write APIs require exact IDs and current revisions. The current `/v1/removal` accepts a name/tag, and `AppointmentQueueEntry.id` is derived from tag/name/time: **neither is sufficient as a headless destructive identifier**.

### Capabilities

Each capability is `unavailable`, `discovered`, `offlineTested`, `liveReadVerified`, `liveWriteVerified` or `disabledByOperator`, with reason/version/evidence ID. Examples:

`readCabinet`, `readApplications`, `readAppointmentQueue`, `dismissOccupant`, `appointPlayer`, `replaceOccupant`, `approveApplication`, `rejectApplication`, `removeAppointmentQueueEntry`, `appointQueuedPlayer`, `timedAppointment`, `setRotationInterval`, `setAutoApproval`, `readDecrees`, `activateDecree`, `hostedChat`.

Availability is the intersection of build compatibility, account permission, operator configuration, state freshness and safety mode. Static schema presence alone never enables a live-write capability. The Android UI displays why an operation is unavailable. Mandatory queue/bump capabilities cannot be absent in a release labeled complete.

### Wire discovery work that must precede parity claims

1. Recover current `commander`, `world`, login/common, title/decree and nested identity definitions, including kingdom/controller settings and relevant startup handlers.
2. Establish empty versus omitted `PlayerSimpleDataPB`, full snapshots versus partial updates, `waitPlayers` completeness, permissions, auto-approval and interval updates.
3. Trace the actual queue red-X and priority-arrow handlers from the **effective live patch**, not just the embedded bundle. Record command name, field values, context, callbacks, cooldowns and error mappings.
4. Trace direct-search appointment separately from queued appointment. Do not assume `TempleAppointTitleC2S` and `TempleChanegeTitleC2S` are interchangeable.
5. Verify whether title mutations carry or enforce an expected current occupant. If the server does not offer such a precondition, document the residual race; a fresh read and a local check do not make it atomic.
6. Determine how an incremental title update without a server ID is scoped. Separate observed foreign-Capitol state from the account's writable context.
7. If owner-authorized runtime observation is necessary, keep it short and scoped to normal client actions; cancel dialogs unless a specific mutation is authorized. A full client may be used for this development evidence, never as a production dependency.
8. If a required operation cannot be recovered/verified, stop at a clearly labeled partial release. Do not invent a command or quietly keep an emulator fallback to claim completion.

Publish only original codec logic, synthetic fixtures and derived field identities. Keep publisher source/raw captures private and outside the implementation tree.

## 6. State, identity and policy design

### Structured state

A snapshot must carry:

- `accountId` (opaque host-local ID), provider/game identity bindings, character ID, home server and queried/controller server context;
- `sessionGeneration`, `receiveSequence` (host-assigned, not claimed server sequence), `contextGeneration`, `stateRevision`, `policyRevision`;
- `observedAt`, monotonic receive instant, last authoritative refresh, source command and completeness/freshness status;
- role ID/key, occupant with lossless decimal-string player/alliance/server IDs, display name/tag, appointment/agreement/close timestamps;
- distinct application list and automatic appointment queue, including authoritative order and estimated versus explicit inauguration time;
- current permission evidence and kingdom interval/auto-approval state;
- known/unknown versus absent fields, and whether a snapshot is complete enough for a particular operation.

Game 64-bit IDs travel across public JSON/IPC as decimal strings with strict range checking. Never use JS-style floating point IDs, display-name hashes or time-slot identity for writes. Persist instants in UTC; UI display zones do not alter scheduling.

Reducers are deterministic and account/context partitioned. On reconnect/identity/config change, increment the generation and invalidate outstanding prepares. A local receive sequence provides ordering only within that session; it does not prove an unbroken server event history. Refresh snapshots before re-enabling actions. Foreign snapshots must never overwrite the home writable context.

### Policy migration

Actual current source supports `allowedTags`, allowed names and blacklisted names. Its explicit blacklist can override alliance/name protection; do not silently replace that with an always-allowlist-wins rule or re-use loose OCR matching for destructive structured decisions.

Implement explicit precedence with preview and migration acknowledgment:

1. Global safety gates, protected roles/own seat and actual permission always win over a request to mutate.
2. A reviewed explicit **ID deny rule** may override an alliance allow rule; show that override conspicuously.
3. Explicit ID allow/name allow rules protect according to the saved precedence; resolve conflicts deterministically and show them before enabling Execute.
4. Alliance policy uses verified alliance ID where available, with current exact tag aliases for presentation/migration. Unknown affiliation is not an unauthorized alliance.
5. Legacy name rules import as unresolved references requiring confirmation or exact current resolution, not automatic bulk UID blacklisting. Name changes and homographs must not redirect a destructive intent.
6. A no-alliance player is distinguishable from missing/unknown alliance data; keep the configured tagless policy explicit.

Persist policy changes with optimistic revision checks and audit. Importing old Execute settings must start the **new backend in Observe**, with queue cleaning, scheduled writes, AI responses and notices disarmed until reviewed. Preserve legacy configuration/history for rollback.

### Observation consensus

Do not label a structured value `confidence=1.0` just to satisfy OCR code. Track identity/completeness/freshness and a bounded stability window. Multiple events copied from one snapshot are not independent confirmation. For automatic removal require stable same occupant/context and a fresh pre-dispatch refresh; the stability/refresh policy must be tested with the game's actual update cadence and approved request budget.

Default automatically guarded roles remain the five ministers (IDs 3–7). President/Overlord are never automatically mutated; the account's own role is protected. Commander roles 9/10 can be displayed and separately enabled only where the session actually has authority. Show permission loss immediately and disarm affected actions.

## 7. Operation safety and persistence

### Two-level operation lifecycle

Public API workflow:

`accepted → awaitingState → prepared → authorized → dispatching → awaitingEvidence → verified | rejected | cancelled | expired | uncertain`.

- The phone supplies a unique idempotency key; the host stores `(client, account, key, requestHash)` transactionally. Same key/content returns the original operation; changed content returns conflict.
- Preparation records exact target IDs, current occupant/queue order, generations, policy revision, expiry and requested effect. A manual confirmation displays that exact target/context and operation type, not just a generic Confirm.
- The Swift coordinator persists the authorized intent, then the broker persists its linked wire attempt **before** writing bytes. Storage failure forbids the send.
- Broker final dispatch rechecks current generation, ownership, scope, deadline, target preconditions, permission, Execute grant, stop latch and queued cancellation.
- After any possibly started write, a crash/timeout is **uncertain**. Both ledgers reconcile through operation IDs; neither may retry a game mutation because the other did not acknowledge IPC.
- A host-generated idempotency key prevents duplicate API submissions; it cannot make the game server process a command exactly once.

Start with one outstanding mutating game operation **per account across Capitol and chat**, unless reliable error/result correlation proves a less restrictive model safe. The scheduler may have independent bounded read requests, but command-only errors must not be misattributed to another operation. Heartbeat/login control handling never waits on disk exports, a phone subscriber, media download, AI or an automatic-rule worker.

### Verification

- Dismissal: observe that the expected occupant is no longer seated using a fresh authoritative refresh, classify vacant versus refilled, then verify policy against the new occupant independently. State change alone may not prove our command caused it; retain attribution quality.
- Queue removal: verify exact target absence, complete queue, expected count/order under concurrent changes; do not accept a one-row count drop alone.
- Appointment: verify exact target seated, expected previous occupant transition, target removed from queue if applicable, and remaining relative queue order. Do not compare only display times, which may shift.
- Settings: read back the actual server interval/auto-approval state. A sent ACK is not completion.
- Errors: distinguish permission/cooldown/rejection from identity loss or unsupported schema. Preserve unconfirmed outcomes for operator review, not automatic replay.

### Stop/pause semantics

Expose separate controls:

- **Pause Capitol automation:** stops new guard/scheduled mutations, keeps game session/chat connected unless separately requested.
- **Observe:** allows approved state queries but no Capitol mutations; does not implicitly pause chat sends. UI must say which domain is disabled.
- **Account disconnect:** stops that account's game socket and host automations, without affecting other accounts.
- **Global Emergency Stop:** durable host latch that forbids all new game mutations, including chat rules/AI and manual writes; closes or quarantines affected game sessions after recording in-flight uncertainty. HTTPS administration remains up.

Emergency Stop bypasses normal work queues. Swift first persists its latch; broker receives a high-priority revoke, persists its local latch and checks it immediately before dispatch. On broker/control-daemon restart, grants are invalid until a new authenticated handshake reconciles both latches and generations. If the broker is unresponsive, stop it through the supervised service boundary; never show “all stopped” until shutdown/ack is known. Already-transmitted commands cannot be undone. Clearing stop does not automatically resume, reconnect, rearm schedules or re-enable rules.

Normal settings changes and stop revocation use short-lived execution grants bound to account/session/policy generation and operation class; no permanent “trusted broker means Execute forever” flag.

### Storage and audit

- Swift SQLite: policies/revisions, operations/prepares, schedule intent/results, pairing scope references, audit and retention metadata.
- JVM SQLite: account binding metadata, structured snapshots/checkpoints, event log, chat history, automatic rules, send ledger and linked wire attempts. Secrets stored encrypted in a separate vault, referenced by opaque IDs.
- Use SQLite transactions/WAL, foreign keys, migration version checks, bounded queries, periodic checkpoints and crash tests. Never truncate unresolved operations to satisfy retention.
- Evidence is a redacted structured before/after snapshot with receive/time/generation references, expected effect, verification/attribution result and policy explanation. No fabricated screenshot evidence.
- Default retention proposals: 30 days chat, 90 days operation audit, bounded media cache; size caps override age with visible storage pressure. Exact caps configurable and benchmarked before release.
- Near/full disk: stop writes before durability is lost; alert, retain administration/read-only access and avoid restart loops. All logs redact tokens, codes, private installation constants and message bodies unless the operator explicitly exports selected content.

## 8. Queue management and timed appointments

Treat queue parity as its own workstream, not a minor extension of dismissal.

1. Distinguish pending applications from accepted automatic-appointment entries in models, UI, policy and endpoints.
2. Read a complete queue with exact player IDs, verified top entry and order. Never schedule based on the first row that happened to decode successfully.
3. Verify actual red-X behavior from current code/live scoped test. Request tuple must identify the exact entry; never guess `TempleCancelTitleC2S` removes it.
4. Verify queued immediate-appointment behavior independently of search appointment and its cooldown. Preserve the rest of the queue's relative order.
5. Apply cleaning budgets (per sweep/account/time), reread after each mutation and evaluate new context. No blind multi-remove list based on an old snapshot.
6. Preserve per-position queue-cleaning toggles, audit, manual removal and cancellation in Android.

### Clock and deadline model

Use authoritative server timestamps if their semantics are proven, synchronized host wall time, monotonic deadlines, measured RTT and an explicit uncertainty bound. Do not carry forward the old hard-coded screen offset or assume each natural turnover happens exactly at the displayed estimate. `appointTime + index × interval` is a client prediction, not a reservation.

Prepare early; at commit revalidate occupant, target, actual first queue entry, interval, expiry and permissions. Derive the latest safe dispatch from the proven turn boundary minus clock/transport/processing uncertainty. If remaining margin is insufficient, record a missed/cancelled bump. **Never retry late.** WSL sleep/resume, NTP steps, reconnect, changed queue, changed controller or changing interval disarms/reprepares affected schedules.

A command that lacks a server-enforced expected-occupant condition cannot guarantee that a queued replacement will never race natural turnover. Release timed bumps only after the chosen wire path's safety semantics and conservative refusal conditions are acceptable. Do not claim parity simply because average RTT is low. If safety cannot be established, this mandatory feature remains blocked and the release remains partial.

Persist operator schedule intent separately from disposable prepared network state. Restart restores schedules **disarmed**, revalidates future events and reports missed ones; it never replays a scheduled write at boot. Appoint/replace/decree actions have independent enablement from normal dismiss/clean automation.

## 9. Shared hosted-chat service

### Refactor ZR Chat transport first

Introduce an app-facing `ChatBackend`/`ChatConnection` interface with two implementations:

- `DirectChatBackend`: current Android account-owned `SocketRunner` path, unchanged by default.
- `HostedChatBackend`: TLS API/event client; no game socket, provider credential use or local automatic-send loop for hosted accounts.

`SocketRunner` currently constructs a chat `Conversation` and considers missing rooms a readiness timeout. Refactor into a shared session runtime with pluggable bounded consumers (`Capitol`, `Chat`, optionally other proven domains). Capitol readiness must not require chat rooms, and chat readiness must not imply valid Capitol permissions/state. A shared writer arbitrates requests; multiple consumers never maintain independent frame counters or call `GameSession.send` concurrently.

### Hosting rules

- One session per verified provider/game-account identity boundary, with server/character bindings and explicit restrictions on multiple characters under one provider. Do not assume the publisher permits concurrent alternate-character sessions.
- One durable history ingestion path. Phones receive account-scoped cursor streams and page history rather than independently requesting every channel's history on reconnect.
- Each phone keeps its own displayed room, draft and read cursor. Do not make one phone's selection redirect another phone's send or create the fiction that the gateway has multiple independent UI selections.
- Every outgoing message contains an explicit server-provided room identity and expected account/session. No default-room fallback.
- Delivery/recall uncertainty follows the established self-echo/result rules. Persist before send, serialize when correlation requires it, and never resend on mobile reconnect.
- Store rules and their execution state on the host. Migrate ordered notice sequences, intervals, current pending deliveries and generated-send budgets; no catch-up bursts after downtime. Disable imported rules until reviewed.
- AI reply engine is single-owner per account/room, opt-in and paced; phone disconnect must not create a second AI owner. Provider failure never changes game-session safety.
- Translation/draft preview may remain on-device; optional host-side translation uses a separately consented worker and account-scoped config. ML Kit is Android-specific; it cannot simply be loaded into the JVM daemon.
- Keep phone local message exports/HTML sharing and media tools working against bounded cached/host-fetched content. Host-side publication/upload/AI credentials require independent opt-in, limits, lifecycle and deletion support. Do not silently move phone cloud credentials to the host.
- Validate media object references and known origins; no arbitrary HTTP proxy/SSRF endpoint. Bound dimensions/bytes/time/concurrency and never block heartbeat on media operations.

### Multi-client notifications and offline behavior

Use a resumable authenticated event stream with account and topic ACLs, monotonic host event cursors and explicit `resyncRequired` after gaps. Separate mutation-result/control events from a droppable/coalescible live feed. Bound per-client queues; slow clients cannot backpressure game decoding.

Apparatchik Android receives Capitol/health notifications; ZR Chat Android receives chat notifications. Foreground streaming is immediate when connected. Android WorkManager alone is not real-time background delivery. Offer an explicit foreground connection service for prompt background delivery and retain bounded polling as a documented delayed fallback. External ntfy/push relays are optional, with consent and redacted payloads. Deduplicate by account/message/event ID and avoid replaying a full history backlog as notifications.

Phones cache history/state for offline reading, visibly mark cached data, and disable live mutations while disconnected. Preserve a draft locally; never queue it to auto-send later without a fresh explicit send. Multi-phone sync includes sent status and configurable read receipts, not private unsent drafts unless separately requested.

## 10. Remote API and Android control surface

### Compatibility approach

Keep the existing pinned TLS **Protocol 2 security envelope** and port `57567` for this host; do not confuse transport security version with REST path versions. Give the fork a distinct product/backend identity and advertise `apiRevision`, minimum client version and capability manifest. Preserve compatible `/v1/state`, health/alerts/activity/pairing/admin routes where meaningful.

Add a new typed `/v2` surface for headless identities, operations and hosted chat. Legacy name/tag destructive endpoints refuse on `backend=headless` with an upgrade-required/capability error; they must not translate an old queue-row hash into a guessed player ID. Older clients may be offered read-only compatibility, never unsafe writes. Screen/video/ADB endpoints return a stable unsupported-capability response, not a blank image or an attempted emulator launch.

### Proposed routes (not existing APIs)

| Area | Routes / contract |
| --- | --- |
| Discovery | `GET /v2/capabilities`, backend/runtime/version/feature verification levels; no secrets |
| Accounts | `GET/POST /v2/accounts`, patch label/config/binding references; delete with explicit data/credential semantics |
| Auth | `POST /v2/auth/attempts`, `.../{id}/request-code`, `.../{id}/verify`, `DELETE .../{id}`; short-lived challenge generation and no implicit connect |
| Account lifecycle | `POST /v2/accounts/{a}/connect`, `/disconnect`, `/verify-identity`, `/renew`; explicit account ownership checks |
| Cabinet | `GET /v2/accounts/{a}/capitol`, `/offices/{role}`, `/applications`, `/appointment-queue`, `/history`; context and revision included |
| Mutations | `POST /v2/accounts/{a}/operations/prepare`, `POST .../{op}/commit`, `GET .../{op}`, `POST .../{op}/cancel`; typed operation enum only |
| Policy | `GET/PUT /v2/accounts/{a}/policy`, per-role state, If-Match revision; conflict never overwrites silently |
| Schedules | `GET/POST /v2/accounts/{a}/schedules`, arm/disarm/cancel separately; validate fresh target/context |
| Chat | `GET /v2/accounts/{a}/chat/rooms`, `/history`, `/search`; typed send/recall/action operations and stable operation IDs |
| Rules | `GET/PUT /v2/accounts/{a}/chat/rules`, pause/enable separately; single executor |
| Events | `GET /v2/events` via authenticated WebSocket upgrade; cursor, subscription ACL and bounded resync contract |
| Lifecycle | `/v2/host/pause`, `/resume`, `/emergency-stop`, `/clear-stop`; account/domain/global scope explicit |
| Ownership | `/v2/accounts/{a}/handoff/prepare`, `/release`, `/acquire`, `/status`; authenticated destination-bound transfer |
| Maintenance | backup/export/import, storage cleanup, redacted diagnostics, staged signed update, service health/restart request; admin-only |

A queued operation response is `202 Accepted` with a durable operation ID, not success. Return `409` for revisions/preconditions/idempotency conflicts, an explicit deadline error, and structured permission/capability errors. Decide exact HTTP details in the contract phase and test them across Kotlin/Swift/Android rather than inferring from strings.

### Required Apparatchik Android screens

1. **Hosts:** Linux/Direct identity, host reachability versus game-session health, capabilities, version and ownership; replace “Run the game here” with backend-appropriate “Host this account here.”
2. **First-run:** pair and verify fingerprint; import private connection configuration or supported account backup; add account/server/character; authenticate; read-only verify identity; explicitly connect and select role/policy. No initial Execute.
3. **Dashboard:** structured role cards, exact identity details, vacancy/stale/unknown/expiry, permission reasons, manual action prepare/confirm/result and per-position pause.
4. **Queues:** applications and appointment queue in distinct tabs; full count/order/completeness, exact player ID details, refresh/remove/approve/reject/priority actions as capabilities allow.
5. **Appointments:** search/select exact player, schedule/bump preview with clock uncertainty, arm/cancel/missed/uncertain states, independent execution setting.
6. **Automation:** tag/alliance/player rules, precedence/UID resolution preview, Observe/Execute, per-role queue cleaning, budgets and global stop semantics.
7. **Kingdom settings:** current rotation interval/auto approval, confirmed writes and read-back; decree status and separately permissioned manual activation.
8. **Accounts/security:** identity and credential health, explicit renewal, session release/acquire, client scopes/revoke, account exclusions and encrypted backup.
9. **Activity/evidence:** operation state machine, before/after structured facts, attribution/uncertainty, filter/export/cleanup; no screenshot dependency.
10. **System:** metrics, storage, logs, alert routing, updates/restart, backup/restore and diagnostics. No arbitrary remote shell.

Every supported host function needs a tested Android UI path, not just a hidden endpoint. Initial OS install, trust bootstrap, lost-all-credentials recovery and operating-system repair are explicit out-of-band exceptions; normal operation/renewal/update must need neither SSH nor a desktop.

### Required ZR Chat Android changes

- Add Host profiles/pairing and per-account **Direct / Hosted** mode; show which host owns the live session.
- Separate host-local account IDs from old Android local IDs; stable import/mapping preserves existing history, rules, translations and archive preferences.
- Hosted profile uses restricted credentials and contains no copied game token unless the operator separately keeps a dormant direct-mode profile.
- Switching modes disconnects the old owner, reconciles pending attempts, confirms the handover and does not silently start both backends.
- Keep direct mode functional for accounts not migrated. Host failure never automatically falls back to direct game login.
- Provide remote email renewal using short-lived auth challenge flows; Google sign-in, if retained, originates from supported Android Credential Manager and is bound to the host attempt/account/config. No embedded browser login bypass or manufactured OAuth proof.
- Validate all existing chat UI operations against the hosted feature matrix, including muted/archived rooms, private/group history, language choices, outgoing translation previews, media and notification routing.

## 11. Security, authentication and ownership

### Public access

Reuse self-signed pinned TLS, one-use expiring pairing codes, per-device credentials, revocation, HTTPS-only transport, request bounds and LAN/Tailscale routing. Use one public listener; no separate unprotected chat port. Extend credentials with least-privilege scopes and explicit account grants:

- `host.admin`, `security.admin`, `account.auth`;
- `capitol.read`, `capitol.control`, `capitol.configure`;
- `chat.read`, `chat.send`, `chat.rules`, optional `chat.actions`;
- emergency-stop permission appropriate to trusted operators, distinct from clear/resume.

ZR Chat does not receive host-admin/Capitol rights by default; Apparatchik does not receive blanket permission to read private chat just because it administers the service. First trusted local owner bootstrap can issue an admin pairing; later privilege elevation requires an existing admin/local control approval. QR/deep links never contain reusable provider/game tokens. Client credentials are independently revocable; rotating one phone does not rotate game credentials.

### Local broker boundary

Run services under dedicated non-root identities. Use an owner/group-restricted runtime directory and Unix socket, verify peer UID, version the RPC, cap message sizes/timeouts/concurrency and restrict message types. No loopback TCP secret-only listener. Broker grants and private vault files are not exposed through diagnostics. Reject unknown operation types, stale grants and mismatched target/account/config snapshots even from the expected daemon.

The broker must stop accepting writes when the authorized control session dies or its execution grants expire. Continue heartbeat/read-only observation only if explicitly configured safe; do not continue unattended mutation under a stale controller.

### Secrets and login

Use envelope encryption for game/provider/installation secrets with a local master key protected by file permissions and an optional systemd credential mechanism. Without TPM, an unattended LXC unlock key stored on the same disk does **not** protect against a root/disk compromise; state that limitation. Passphrases/codes travel through bounded TLS bodies or private file descriptors, not process arguments, logs or URLs.

Preserve ZR Chat's identity separation: provider SDK UID, game account UID, server ID and character ID are different namespaces. First binding is read-only and persisted before protocol login acknowledgment allows normal activity. Existing verified pins cannot be silently relearned. Renewal verifies the same intended account and preserves old valid credentials until the replacement is durably saved.

Import existing backups using the reviewed codec with size/KDF/schema limits and preview; no network side effect. Host-held accounts/rules stay disabled until verification. Never take an arbitrary `InstallationConfig` update as authority to change an account's identity or send secrets to new origins. Configuration changes invalidate pending auth attempts and prepared commands.

### Session exclusivity and handover

Per-account local file/process locks plus one broker actor prevent duplicate local sessions. Multi-host ownership requires an explicit release/acquire protocol; the existing Apparatchik host-epoch UI flow is useful, but its locally generated tokens/epochs are **not distributed fencing** against an unreachable host or an unmodified direct game client.

Use an authenticated, short-lived transfer bound to source, destination, account and ownership generation. Source durably drains/disarms, records in-flight uncertainty and disconnects before acknowledging release. Target verifies the receipt with the paired source or configured single coordinator. Transfer failure/unreachable source refuses acquisition by default. Any owner-forced takeover is a separate risky action, starts Observe with rules/schedules disabled, and does not claim split-brain prevention. Never auto-fail back to Arch when LXC is unreachable.

On publisher account-in-use/session-replacement: close, latch `externalOwnerDetected`, pause automation and alert. No reconnect fight. Unknown external clients cannot be fenced by our database; the operational contract must require the owner to keep them disconnected.

## 12. Arch Linux and Proxmox LXC deployment

### Initial Arch environment

This machine reports Arch Linux x86_64 under **WSL2**, not a dedicated always-on bare-metal Arch host. Windows suspend, WSL shutdown and clock changes must be part of testing. Use it for development, offline simulation and explicitly scoped trials; do not promise unattended availability when Windows sleeps.

- Build JVM modules with pinned Gradle/JDK 17+; run a packaged JRE 17/21 supported by tested libraries.
- Build Swift in the pinned Ubuntu/Noble toolchain container used by the Linux port, or a separately verified Arch toolchain. For runtime, either supply/test an Arch build with pinned library dependencies or run the small Noble userspace image under Podman. Do not assume the existing Ubuntu installer works on Arch.
- If using a rootless container during development, bind only required data/runtime sockets, enforce resource limits and test systemd/WSL behavior. It is optional development packaging, not a requirement to nest Docker in LXC later.
- New commands/paths/service names avoid colliding with existing Apparatchik or game/chat sessions. No service starts merely because the project is built.

### Direct release artifacts

Produce signed versioned x86_64 artifacts with manifest, checksums, dependency/SBOM/attribution and offline smoke tests:

- Swift control daemon and JVM host bundle/runtime;
- supported Debian/Ubuntu install path and Arch package/install path;
- systemd units, CLI for bootstrap/status/stop/recovery, example configuration and migrations;
- **no** ADB, OCR models/worker, FFmpeg/scrcpy, emulator APK or game asset runtime requirements.

Install under `/opt/apparatchik-direct/<version>` with an atomic `current` symlink. Control and broker have separate state subdirectories/ownership under `/var/lib/apparatchik-direct`; private runtime socket under `/run/apparatchik-direct`. Exact UID/group/credential access is reviewed in packaging. Journald is bounded. Release rollback is permitted only when the DB schema is backward compatible, otherwise restore a validated backup while all account sessions are stopped.

Use `Type=notify`/watchdog support where implemented; avoid treating a healthy HTTPS listener as a healthy game session. Restart policy is bounded/backoff-aware and preserves all stop/uncertainty latches. Software restart may reconnect only with saved opt-in ownership policy; it never reenables Execute or lost-ownership sessions automatically.

### Resource targets — estimates to validate, not measurements

For **one game account, Capitol guard plus normal hosted chat, no host AI model and bounded media/history**:

| Metric | Engineering target / initial allocation |
| --- | --- |
| Combined idle memory | ≤350 MiB PSS/cgroup memory after warm-up |
| Sustained working memory | ≤512 MiB under the acceptance workload; burst budgets must be measured |
| Idle CPU | <2% of one vCPU averaged over 10 minutes, excluding reconnect/maintenance |
| Normal sustained CPU | <10% of one vCPU under the defined one-account chat load |
| Initial LXC allocation | **1 vCPU, 1 GiB RAM, 8–12 GiB disk**; raise to 2 GiB during initial validation if needed |
| Smaller experiment | 512 MiB only after measured peak/cold-start/media tests leave headroom; not the first production default |
| Multiple accounts | Measure 1/3/5-account scaling; do not extrapolate RAM or publisher concurrency permission linearly |
| Disk policy | Small release/runtime footprint, chat/media/audit quotas, reserved free space; no unbounded attachment store |

Starting JVM limits can be tested around 128–192 MiB heap, bounded metaspace/direct buffers and a small-footprint GC; these are tuning experiments, not blindly shipped flags. Account for JIT/native stacks, Swift, SQLite/WAL, OS page cache and container overhead. Measure `memory.current`/peak and PSS rather than summing RSS or reporting only JVM heap. If the two-process design misses the budget, profile linkage, worker counts/caches and event retention first; defer a language rewrite until evidence justifies it.

Builds/tests/toolchains are heavier than runtime. Build elsewhere and deploy release artifacts to the LXC. No GPU, display server, Android runtime or privileged container should be necessary.

### Proxmox target

Create a **new, dedicated unprivileged x86_64 Debian/Ubuntu LXC** after separate provisioning approval; do not reuse Home Assistant or an existing production container. Prefer the distro matching the tested Swift runtime artifact. No Docker nesting or device passthrough is intrinsically required. Test the chosen systemd sandbox in an unprivileged LXC; only request namespace/nesting features if that exact hardening requires them, rather than copying the old OCR installer's requirements.

Networking: trusted LAN/Tailscale access to TCP 57567, outbound DNS/NTP/TLS and the publisher-selected game gateway ports; no forwarded public port by default. Gateway hosts/ports may be dynamic, so validate an actual observed policy before firewall tightening. Tailscale can run with explicitly approved minimal TUN support or on the host/router; don't make LXC privileged merely to simplify VPN setup.

Container time comes from Proxmox; NTP belongs on the Proxmox host. Do not grant the container `CAP_SYS_TIME`. During migration, release the Arch session, validate encrypted export/import, re-pair or explicitly transfer host TLS identity while old endpoint is disabled, verify read-only state, then separately reauthorize execution. Prefer a fresh fork identity instead of cloning the current production server's pairing identity by default.

## 13. Implementation work packages and acceptance gates

Implement in dependency order. Independent tasks can later be assigned to isolated worktrees, but this plan does not authorize launching agents or changing production. Every phase ends with reviewed source, deterministic tests, a clean committed checkpoint and an updated evidence/status record.

### P0 — Baseline and contract freeze (2–4 engineering days)

- Select/review committed Apparatchik baseline; record dirty-work exclusions and Linux test known-failure inventory.
- Create private fork/new Direct branch and pinned ZR Chat reuse mechanism; confirm rights/licenses and supported runtime versions.
- Inventory all current Android/host features and map them to `preserve`, `replace`, `optional`, `not applicable`, `blocked`.
- Write architecture decisions for two processes, single session ownership, dual-ledger RPC, exact IDs, new API version and safety scopes.
- Establish synthetic data and no-network test defaults; no real credentials in CI.

**Exit:** approved parity matrix and scope, reproducible baseline builds, no live changes. Future task IDs/dependencies below are entered into the fork's issue tracker.

### P1 — Protocol completion and queue investigation (4–8 days, uncertainty may extend)

- Recover nested schemas/startup paths, explicit queue/button commands and current patch evidence.
- Produce original typed contracts/codecs, failure mappings and synthetic fixtures for all mandatory operations.
- Document timing, partial-field semantics, permissions, queue completeness and contextual updates.
- Identify which facts require owner-approved live observation and specify a bounded test plan.

**Exit:** mandatory operations have an evidence-backed implementation path, or a named blocker. Queue removal/priority and timed safety have explicit proof requirements; no invented fallbacks.

### P2 — Light Swift runtime and backend-independent domain (4–6 days)

- Split screen-free targets; separate domain policy from OCR/tag heuristics, UI geometry and device operations.
- Introduce exact identities/state quality/capabilities, policy revisions, structured evidence and backend interface.
- Provide fake backend and synthetic Android-compatible snapshots; no gateway access.
- Add Direct daemon entry point with existing secure listener/local admin and no OCR/ADB startup path.

**Exit:** clean Arch/container build and Linux unit tests run without ADB/FFmpeg/OCR packages/models; first private Direct artifact starts only offline.

### P3 — JVM session broker and local RPC (5–8 days)

- Extract session runtime from chat-only readiness; add per-account consumers and one heartbeat-priority writer.
- Implement vault/config/auth identity binding, typed RPC, peer validation, quotas and session/execution generations.
- Add deterministic fake gateway for login, mismatch, token expiry, account-in-use, fragmentation and unknown frames.
- Implement dual-ledger operation IDs and boot safety handshake; broker never grants itself write authority.

**Exit:** socketpair/fake-gateway proof of one socket serving both consumers, bounded IPC/backpressure, persist-before-ACK/send, graceful crash/restart and no writes from expired authority.

### P4 — Read-only Capitol vertical slice and Android setup (4–6 days)

- Parse complete offices, applications/queue/history and kingdom/permission state.
- Add capability/snapshot/event APIs and Android structured cards/queues/setup/identity verification.
- Implement account-specific disconnect/renewal UI, no automatic rules, immutable snapshot provenance.
- After explicit scope approval, compare against a human-verified game snapshot; stop the normal game before broker login.

**Exit:** current authorized account identity verified, roles/queue/permissions match independent evidence, disconnect/reconnect/resync and missed-update handling documented. This is a partial read-only milestone, not complete release.

### P5 — Durable command coordinator and basic office writes (5–8 days)

- Implement prepare/commit/expiry/idempotency, queue arbitration, fresh preconditions and final broker enforcement.
- Implement manual dismissal/appointment/replacement and application approve/reject according to verified paths.
- Add error/read-back verification, uncertainty recovery, attribution levels and durable global stop.
- Owner-authorized single-target tests only after offline fault suite; no broad automatic cleanup during validation.

**Exit:** one authorized example of each enabled write verified, controlled rejection/race/timeout tests, crash uncertainty never replayed, Android confirms exact identities and shows actual outcomes.

### P6 — Full queue policy, rotation and timed parity (6–10 days)

- Implement verified appointment-queue removal/priority, complete order verification and policy cleaning budgets.
- Implement interval/auto-approval read-modify-verify and optional decree read/manual activation scopes.
- Replace screen-clock scheduler inputs with proven time samples/uncertainty; no-late-dispatch and restart-disarm tests.
- Add complete Android queue/appointment/settings screens and per-role policy handling.

**Exit:** every mandatory queue/bump function in the parity matrix is independently verified. If timing/queue mapping remains unproven, mark release blocked/partial, not complete.

### P7 — Hosted chat API and ZR Chat transport (6–10 days)

- Host chat ingestion/history/delivery/rules in the same account session.
- Add scoped chat API/event cursor resume and per-client room/draft state.
- Implement HostedChatBackend with DirectChatBackend unchanged for unmigrated accounts.
- Test same-account chat+Capitol concurrency, phone disconnect/reconnect, no-send replay and no second socket.

**Exit:** two phone clients can view/send via one host without stealing selections or creating duplicate game sessions; host persists history and continues authorized work while phones disconnect.

### P8 — Full Android parity, remote auth/admin and notifications (5–9 days)

- Finish remote configuration, credential renewal, backup/restore, client scope/revoke, update/restart and diagnostics flows.
- Port unattended ordered rules/AI ownership; retain on-device translation/media/export behavior and explicitly opt in host alternatives.
- Implement foreground notification stream plus documented background fallback; test duplicates/gaps/mutes.
- Validate every row of both Android feature matrices; no hidden SSH prerequisite for a normal operation.

**Exit:** end-to-end remote-first acceptance from a fresh paired phone and cold host, including auth expiry/recovery and multi-client scope rejection.

### P9 — Resource hardening, packaging and Arch soak (4–7 days)

- Produce minimal artifacts/installers/units; tune memory, bounded worker queues, history/media and log retention.
- Inject storage/full-disk, network, WSL suspend, slow subscriber, AI outage and broker/controller crash faults.
- Run 72-hour mixed workload and seven-day non-destructive observation soak; limited authorized Execute windows are separately scheduled.
- Record CPU/PSS/cgroup peaks/disk growth/latency and all unknowns with exact release hashes.

**Exit:** performance budget and safety gates met, no automatic takeover/replay, no screen/emulator dependency, release and restore/rollback drills pass.

### P10 — LXC migration and complete release (3–5 days plus soak)

- Separately provision approved new LXC; install signed artifact without build toolchain.
- Test sandbox/network/storage/watchdog, staged backup/import and explicit Arch release/LXC acquire.
- Pair both Android apps and verify every normal admin/Capitol/chat path remotely.
- Repeat 72-hour target-resource soak and selected non-destructive faults; reauthorize production Execute/rules only after review.

**Exit:** complete parity matrix green, no unresolved critical safety issue, current evidence bundle and deployment runbook published privately. Old host remains stopped/standby, not an automatic fallback.

### Schedule expectation

Rough sum: **48–81 engineering days** for one experienced implementer, approximately **10–17 engineering weeks**, plus soak/owner scheduling. This is a planning range, not a commitment. Current queue/patch recovery and server behavior can extend or block it; P1/P4 are deliberate go/no-go gates. A read-only vertical slice can be delivered substantially earlier, but is not a substitute for P6/P8 completeness. Do not spend weeks polishing hosted chat before resolving mandatory Capitol feasibility gates.

## 14. Test strategy and measurable release criteria

### Offline layers

- Golden cross-language contract tests for JSON types/revisions/IDs, Protobuf nested fields, omitted/zero/present values, unknown fields and bounded decode failures.
- Property/fuzz tests for framing lengths/compression/counters, numeric range/UTF-8 validation, IPC framing and API bodies.
- Deterministic state-reducer tests for snapshot/incremental ordering, context changes, aliases/renames, partial queues, permission/expiry changes and stale generations.
- Policy tests covering deny overrides, allow collisions, tagless/unknown distinction, special/own roles, rate budgets and changed policy after prepare.
- Transaction/crash tests at every operation boundary: before accepted intent, after prepare, before/after broker attempt record, partial socket write, state update before API response, and restart during verification.
- Duplicate Android requests, lost responses, simultaneous devices, idempotency-key content mismatch, stale confirmation, operation cancellation and account switch tests.
- Scheduler tests with fake monotonic/wall clocks, NTP steps, WSL suspend, boundary races, changed first row, empty queue, interval/controller changes and insufficient safe margin.
- Full client-to-host fake-gateway test exercising one session, incoming chat, a bounded read, one synthetic authorized mutation, matching response, stop and reconnect without replay.
- Security tests for pairing expiry/rate limits/pin mismatch, cross-account/role escalation, token revocation, broker peer checks, secret redaction, backup KDF/size limits, malicious media URLs and update signing.

### Android verification

Run existing JVM/Gradle tests and lint/build gates for both products, plus hosted-mode transport/contract tests. Add instrumentation tests using synthetic isolated accounts and local fake servers; never load production accounts merely to test migrations. Cover small/foldable screens, accessibility, rotation, process death, multi-host/account switch, stale cached controls, background service/notification permission and no-direct-socket assertions in hosted mode.

### Runtime acceptance workload (proposed)

- One account, all ten roles read, queues up to configured limits, two connected Android clients, cursor history and 10,000 bounded synthetic chat events in the fake-gateway soak; include bursts and a deliberately slow subscriber.
- Warm idle and active resource measurements at 1/3/5 synthetic accounts, cold-start peak, media cache pressure, history rotation, backup and update windows.
- Target a fresh state event reaching a connected phone within **1 second p95 on LAN** and an already-received office change reaching the guard decision within **500 ms p95**, measured under the test load. These exclude publisher delivery latency and are not timed-bump safety guarantees.
- Missing/gapped state becomes visibly stale and disables dependent writes within a tested bounded timeout; configured refreshes respect a verified request budget, not a speculative high-frequency poll.
- No unbounded queue, leaked session/process, memory trend or disk-growth escape over the soak; all uncertainty and stop states survive hard restarts.

### Required real-service acceptance (separate authorization)

1. Read-only login/identity and snapshot comparison; repeat with full game closed.
2. Safe account release/reacquire; explicitly tested external-session notification ends ownership without fighting it.
3. Named manual office operation and rejection/read-back; exact target and allowed window documented.
4. Named application/queue removal and priority action; remaining queue order checked.
5. Timed bump only after wire/timing semantics reviewed; demonstrate refusal near/after cutoff as well as authorized success.
6. Concurrent hosted chat on the same game socket; individually authorized sends/recalls, no automatic message storm.
7. Credential renewal and host restart with rules disarmed; later controlled enablement and unattended observation.
8. LXC cutover and phone-only control, including stop, revoke, update, backup and a rollback drill.

**Complete-release checklist:** all mandatory capabilities live verified on the supported effective version; both Android matrices green; resource targets recorded on Arch and LXC; seven-day observation stability; no critical security/replay/identity issue; operator runbooks and exclusions; explicit owner approval for production accounts/rules/Execute. Document unsupported optional features honestly.

## 15. Operational runbooks and failure behavior

| Event | Required behavior |
| --- | --- |
| Phone loses network | Host continues only saved authorized tasks; phone shows cached state and cannot commit stale operations |
| Game network loss | Invalidate prepares; uncertain attempts persist; bounded reconnect only if ownership/stop policy permits; resnapshot before writes |
| Another client signs in | Close and latch external ownership; no reconnect loop/takeback |
| Token renewal required | Stop dependent writes; alert and offer remote explicit renewal; never request codes automatically |
| Permission/controller/season changes | Invalidate related capabilities/prepares/schedules; preserve read-only state and notify |
| Unknown patch/schema | Fail closed for affected operations; reviewed compatibility update required; no falsified version strings |
| Broker crashes | Writer disappears, all pending attempts reconciled; public daemon remains admin-only/degraded |
| Swift daemon crashes | Broker execution grants expire/revoke; no orphaned writes; reconnect control in stopped/observe state |
| Disk/migration failure | Stop before sends that cannot be journaled; no reset-to-empty policy/vault; redacted recovery alert |
| Clock discontinuity | Disarm deadline-sensitive actions, re-establish timing; never dispatch missed appointments |
| Update failure | Preserve state/latches, roll back only compatible code/schema; never restart an external-owner account |
| Restored backup/VM snapshot | Start Observe/disconnected, reconcile ownership/uncertain sends and reauthorize; snapshots can resurrect old execution intent |

Write operator guides for install/bootstrap, import without connection, remote renewal, normal handover, emergency stop, lost phone/revocation, quota cleanup, signed updates, backups/restore and returning to the normal game. Explain that no local transaction can fence an unmodified external client or cancel bytes already delivered to the publisher.

## 16. Immediate next implementation tasks

1. Approve this architecture/scope and choose the private fork repository identity; keep existing production checkouts untouched.
2. Freeze a clean committed upstream baseline and run baseline Linux/Android tests in isolated build directories.
3. Open the parity matrix and P1 protocol blockers, specifically **queue red-X**, **queued-priority appointment**, **server/context initialization**, and **safe timed-bump preconditions**.
4. Build the light Swift daemon and JVM fake-gateway broker skeleton with no real credentials.
5. Agree a separate live read-only account/window once P3 is green. Do not connect automatically as a consequence of starting implementation.

The implementation should initially prove a reliable shared session and structured Capitol state, but the final deliverable is the entire remotely operated, Linux-hosted workflow—not a demo that still depends on the game client for queue cleaning, reauthentication or daily administration.
