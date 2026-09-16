# Production Push — Connect / Test / Status

**Document:** Planning Package — Production Push Operator Connect / Test / Status / Notification Delivery  
**Date:** 2026-09-16  
**Label:** Production Push Operator Connect / Test / Status (planning label only — not an official Wave 5 package ID)  
**Wave:** 5 — Notification Platform  
**Roadmap:** **V3-N04 · CM-16**  
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37. Does **not** reopen foundation W5-N04.  
**Authority:** Product Owner Planning Package (Planning Review **PASS**; Planning Approval **GRANTED** — this synchronization). Provider **FROZEN = P3**. Implementation may begin only as a **separate** controlled task after this Planning Repository Synchronization. FIV and Final Close remain separate gates.  
**Owner:** Notification Delivery (product consumed by a new push-product HTTP adapter / notification-product / web; application credentials remain Vault + Connections; subscriptions owned by notification-delivery)  
**Predecessor:** V3-N03 · CM-15 Microsoft Teams — Implementation PASS; FIV **BLOCKED / DEFERRED** (`TD-CM15-TEAMS-LIVE` OPEN / DEFERRED / NON-BLOCKING); Final Close **NOT AUTHORIZED**; **CLOSED = NO**  
**Successor:** None named on Execution Roadmap after V3-N04 (Wave 5 channel sequence ends at Push)  
**Planning analysis:** Product Owner–authorized Next Slice Planning Analysis after CM-15 FIV deferment (Push = next V3-N04 · CM-16)  
**Provider freeze evidence:** CM-16 Push Provider Decision Analysis (PO decision analyst) — P3 selected by Product Owner; P1/P2/P4 not reopened  
**Planning Review:** PASS (Engineering Planning Reviewer; blocking issues: None)  
**Planning Approval:** GRANTED by Product Owner (2026-09-16)

**Baseline (pre-sync):** `bb79f03b9344d5400ee246b397fb33f960bce59b` — `test(wave-5): expect Push-only reserved after Teams activate`  
**Planning Package hash at Planning Review:** `4e3271eb95ce1bebfbfe0c1d2d9caff0753db59f`

```text
PACKAGE STATUS: APPROVED
PLANNING REVIEW: PASS
PLANNING APPROVAL: GRANTED
PLANNING REPOSITORY SYNCHRONIZATION: THIS ACT
IMPLEMENTATION GATE: AUTHORIZED (separate task; NOT EXECUTED by this act)
IMPLEMENTED: NO
FIV: NOT AUTHORIZED
FINAL CLOSE: NOT AUTHORIZED
Official package ID = NOT CREATED
Foundation W5-N04 = CLOSED (consume only)
Provider decision = FROZEN = P3 (Web Push + VAPID; FCM OUT; APNs OUT)
Push = RESERVED / INACTIVE / NOT OPERATIONAL
```

This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

CM-16 is **V3-N04 Push**. CM-13 Slack = CLOSED. CM-14 Discord = CLOSED. CM-15 Teams = Implementation PASS / FIV BLOCKED·DEFERRED / NOT CLOSED. CM-16 = THIS PLANNING PACKAGE (RESERVED / NOT STARTED until gates pass).

---

## Lifecycle

| State                          | This package                          |
| ------------------------------ | ------------------------------------- |
| **PLANNING PACKAGE**           | **CREATED**                           |
| **PLANNING REVIEW**            | **PASS**                              |
| **PLANNING APPROVAL**          | **GRANTED**                           |
| **REPOSITORY SYNCHRONIZATION** | **THIS ACT (planning artifact only)** |
| **IMPLEMENTED**                | **NO**                                |
| **VERIFIED (FIV)**             | **NO**                                |
| **CLOSED**                     | **NO**                                |

**Governance distinction (binding):**

```text
Planning Approval = GRANTED
→ Implementation gate = AUTHORIZED for a separate controlled task
→ Implementation has NOT been executed by this Approval / sync
→ FIV has NOT occurred
→ CM-16 is NOT closed
→ Push is NOT operational
```

Full lifecycle (no gate may be skipped):

```text
Planning Package → Planning Review → Planning Approval
→ Planning Repository Synchronization
→ Implementation
→ Product Owner Review
→ Repository Synchronization
→ FIV
→ PO Final Close
→ Final Repository Synchronization
→ CLOSED
```

Implementation requires **all** of:

```text
Planning Review PASS
+ Planning Approval GRANTED
+ Planning Repository Synchronization PASS
```

All three are satisfied for opening the next **separate** implementation task. This act does **not** start implementation.

---

## Evidence classification legend

| Label                  | Meaning                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **ESTABLISHED**        | Proven by TRP code and/or closed Wave 5 channel architecture                                    |
| **STRONGLY EVIDENCED** | Supported by capability inventory / W5-N04 foundation planning language                         |
| **PROPOSED**           | Historical planning recommendation (superseded for provider by PO freeze)                       |
| **OPEN**               | Remaining non-provider items still awaiting Planning Approval freeze (e.g. exact Vault type id) |
| **FROZEN**             | Binding Product Owner decision — **provider = P3** (this document §6)                           |

---

## 1. Package identity

| Field               | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| Wave                | 5 — Notification Platform                                            |
| Roadmap node        | **V3-N04**                                                           |
| Capability          | **CM-16**                                                            |
| Name                | Production Push Operator Connect / Test / Status                     |
| Official package ID | **NOT CREATED** (do not invent W5-N30 / V3-N30 / CM-37)              |
| Foundation package  | W5-N04 CLOSED (2026-08-29) — consume inventory/anchors/recovery only |
| Slice type          | Production Push transport + PC-07 product                            |

---

## 2. Status

```text
CM-16 Planning Package     = APPROVED
CM-16 Provider decision    = FROZEN = P3
CM-16 Planning Review      = PASS
CM-16 Planning Approval    = GRANTED
CM-16 Planning Repo Sync   = THIS ACT
CM-16 Implementation gate  = AUTHORIZED (separate task)
CM-16 Implemented          = NO
CM-16 FIV                  = NOT AUTHORIZED
CM-16 Final Close          = NOT AUTHORIZED
CM-16 CLOSED               = NO
Push catalog status today  = reserved-inactive
Push operational           = NO
FCM                        = OUT OF SCOPE for CM-16
APNs                       = OUT OF SCOPE for CM-16
Native iOS/Android push    = OUT OF SCOPE for CM-16
```

---

## 3. Scope

Define **one coherent production Push slice** under **frozen P3** (Web Push + VAPID; FCM OUT):

```text
VAPID credentials (Vault + Connections)
+ browser Web Push subscription registration (notification-delivery owned)
+ Production Web Push adapter on NotificationChannelPort
+ operator connect / register / test / status / diagnostics / disconnect
+ truthful Connected / Pending / Failed / Disconnected
+ deliver() Push send branch when connected, subscribed, and routed
+ dedicated Web Push endpoint security policy
+ regression of Telegram / Email / Slack / Discord / Teams / PC-06 / PC-07
```

IN scope (planning contracts only — not implementation):

- **Provider = P3 FROZEN** (Web Push + VAPID; FCM OUT; APNs OUT; browser-only)
- VAPID credential / Vault / Connections contract
- Web Push subscription persistence model (new table; anchors ≠ registry)
- API / UI / delivery / diagnostics / routing contracts
- Security model (credential protection, Web Push endpoint validation, ownership, redaction)
- Automated and real-provider verification strategy
- Acceptance criteria and FIV entry criteria
- Technical debt impact on TD-050 (Push portion only — do not auto-close)

---

## 4. Non-goals

Explicit OUT for CM-16:

- Live Trading / order start / stop / approve / size
- Telegram / Email / Slack / Discord / Teams reopen or redesign
- CM-15 Final Close or live Teams FIV resume
- Closing TD-049, TD-050, or TD-CM15-TEAMS-LIVE
- Declaring Wave 5 COMPLETE
- Master Plan / Execution Roadmap edits
- Inventing W5-N30 / V3-N30 / CM-37
- Push as a control plane or command bus
- Making Push a default route
- Inbound push click → trade actions
- Marketing/campaign push blast engines
- **FCM** (Firebase project, FCM credentials, FCM SDK, FCM token flow, FCM adapter) — **EXPLICITLY OUT**
- **APNs** / native iOS/Android push — **OUT**
- Reinterpreting `workspace_push_notification_anchors` as Connected or as a subscription registry
- System Vault principal
- Storing production credentials in Git, docs, tests, logs, API, UI, or diagnostics
- Implementing code, migrations, dependencies, or UI in this planning/governance freeze act
- Reopening P1 / P2 / P4 or ranking providers again

---

## 5. Current architecture (ESTABLISHED)

### Catalog and routing

`NOTIFICATION_CHANNEL_CATALOG` today (`notification-channel.ts`):

```text
ACTIVE:    telegram, email, slack, discord, teams
RESERVED:  push
```

`resolveDeliveryRoutes` skips reserved channels with `channel-reserved`. Default preferences enable **telegram only**. Default type routing channels = `['telegram']`.

`NotificationDeliveryService.deliver()` sends Telegram / Email / Slack / Discord / Teams when routed and connected; Push records `skipped / channel-reserved` (no push send branch; fallthrough also `channel-reserved`).

Ports: no `PUSH_CHANNEL_ADAPTER` token. No Nest-bound push adapter.

### Product (PC-07 / PC-06)

- Active channels: `/v1/{telegram|email|slack|discord|teams}/*` + dedicated settings pages.
- Push: reserved `NotificationChannelDetailView` / `ReservedChannelPage`.
- Required-field disclosure today: `Device`, `Browser` (`notification-channel.view.ts`).
- Web: `/notifications/channels/push` is reserved-only.
- PC-06 routing/preferences exist; they do not activate reserved Push transport.

### Foundation W5-N04 (CLOSED — consume only)

| Artifact                                                                  | Role today                                                            | Must not mean                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `WorkspacePushNotificationAnchor` / `workspace_push_notification_anchors` | Per-notification durable anchors; `deliveryState = 'anchor-recorded'` | Push Connected; subscription registry; VAPID store |
| Push restart recovery / operational continuity                            | Hydrate/project foundation anchors                                    | Production push I/O                                |
| Platform readiness `pushNotification` field                               | Continuity counts                                                     | Customer-visible push delivery                     |

### Connections / Vault (gaps)

| Artifact                                         | State today                                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connections catalog `PUSH`                       | **MISSING**                                                                                                                                                          |
| `HoldableSecretType` for Push / VAPID            | **MISSING** (types: binance, bybit, okx, telegram, smtp, slack-webhook, discord-webhook, teams-webhook, openrouter). FCM/APNs types also absent and **OUT of CM-16** |
| Vault field validation for Push credentials      | **MISSING**                                                                                                                                                          |
| `vaultSecretTypeForProvider('PUSH')`             | **MISSING**                                                                                                                                                          |
| Device / subscription Prisma model               | **MISSING**                                                                                                                                                          |
| `web-push` / Firebase / APNs npm deps in `apps/` | **MISSING**                                                                                                                                                          |
| Service worker / `PushManager` in `apps/web`     | **MISSING**                                                                                                                                                          |

### Parallel shipped-channel pattern (ESTABLISHED)

```text
Connections provider
→ Vault HoldableSecretType + validation
→ Credential resolver (retrieve-at-send, actor fail-closed)
→ Production adapter (NotificationChannelPort)
→ Domain connection status (not ConnectionRecord.status alone)
→ PC-07 product REST + settings UI
→ Catalog active + deliver() branch
```

Push must follow this ownership pattern after provider freeze. Do **not** invent a second notification engine.

---

## 6. Provider Decision / PO Freeze

### Binding Product Owner decision (FROZEN)

```text
PROVIDER DECISION = FROZEN = P3
Provider            = Web Push
Authentication      = VAPID
FCM                 = OUT OF SCOPE for CM-16
APNs                = OUT OF SCOPE for CM-16
Native iOS/Android  = OUT OF SCOPE for CM-16
Browser scope       = apps/web operator surface only
```

**Authority:** Product Owner explicit freeze. Evidence basis: CM-16 Push Provider Decision Analysis (completed).  
**Do not** reinterpret, rank, reconsider, or reopen P1 / P2 / P3 / P4.  
**Do not** introduce FCM as an implementation option for CM-16.

### P3 definition

| Element                 | Binding contract                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Mechanism               | Standards-based **Web Push** with **VAPID**                                                 |
| Application credentials | VAPID public/private key pair in Vault via Connections                                      |
| Private VAPID key       | Vault-only; retrieve-at-send; never in API/UI/diagnostics/logs/tests/commits/repo artifacts |
| Public VAPID key        | May be exposed only where required for browser `PushManager.subscribe`                      |
| Subscriptions           | Browser Web Push `endpoint` + `keys.p256dh` + `keys.auth`                                   |
| Adapter                 | Production Web Push adapter on `NotificationChannelPort`                                    |
| Client surface          | Existing `apps/web` browser SPA                                                             |

### Explicit OUT statements

| Mechanism               | CM-16 status                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| **FCM**                 | **EXPLICITLY OUT OF SCOPE** — no Firebase project, FCM credential, FCM SDK, FCM token flow, or FCM adapter |
| **APNs**                | **OUT OF SCOPE**                                                                                           |
| Native iOS/Android push | **OUT OF SCOPE**                                                                                           |
| Dual-provider (P4)      | **NOT SELECTED** — not in CM-16                                                                            |
| FCM-only (P2)           | **NOT SELECTED** — not in CM-16                                                                            |

Historical analysis options P1–P4 are **closed for selection**. Only **P3** is binding.

### Governance consequence of this freeze + Approval

| Gate                                | Status                                         |
| ----------------------------------- | ---------------------------------------------- |
| Provider decision                   | **FROZEN = P3**                                |
| Planning Review                     | **PASS**                                       |
| Planning Approval                   | **GRANTED**                                    |
| Planning Repository Synchronization | **THIS ACT**                                   |
| Implementation gate                 | **AUTHORIZED** (separate controlled task only) |
| Implementation executed             | **NO**                                         |
| FIV                                 | **NOT AUTHORIZED**                             |
| CM-16 CLOSED                        | **NO**                                         |
| Push operational                    | **NO**                                         |

Sections 7–15 below are **binding Web Push + VAPID contracts** under P3 (no FCM conditionals).

---

## 7. Credential model (VAPID)

### Common rules

- Credentials live **only** in Vault via Connections.
- Purpose: `SecretPurpose.Notification`.
- Retrieve **at send/test time** only (clone of Telegram/SMTP/webhook resolver pattern).
- System Vault principal: **FORBIDDEN**.
- Never echo private material in API, UI, logs, diagnostics, tests, docs, or Git.
- `ConnectionRecord.status = CONNECTED` / Vault `SecretState.Connected` / local `validate()` / subscription stored **≠** Push Connected.
- Disconnect must stop delivery use of credentials; revocation semantics defined in §10.

### VAPID fields (P3)

| Item                 | Contract                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Connections provider | New `PUSH` (or `WEB_PUSH`) notification provider                                                                  |
| Vault type           | New `HoldableSecretType` e.g. `vapid` / `web-push-vapid` (exact string frozen at Planning Approval)               |
| Fields               | `publicKey` (URL-safe base64), `privateKey` (URL-safe base64), optional `subject` (`mailto:` or `https:` contact) |
| Validation           | Shape/format only at store time — **no** provider I/O on validate                                                 |
| Public key exposure  | Public VAPID key **may** be returned to the authenticated operator browser solely for `PushManager.subscribe`     |
| Private key exposure | **FORBIDDEN** everywhere outside Vault retrieve-at-send                                                           |

**FCM credentials:** not part of CM-16.

---

## 8. Vault integration

| Step       | Behavior                                                                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provision  | Operator creates/updates Connections PUSH credential → Vault store via existing facade                                                                                                                                                              |
| Bind       | Push product bind associates workspace+user with credential binding + subscription readiness                                                                                                                                                        |
| Retrieve   | Adapter resolver retrieves at test/deliver only with authorized actor                                                                                                                                                                               |
| Redact     | All responses/diagnostics show presence/fingerprint only — never private material                                                                                                                                                                   |
| Rotate     | Replace Vault secret; prior ciphertext not logged                                                                                                                                                                                                   |
| Disconnect | Local Push connection → disconnected; stop retrieve/send; Vault secret revoke/retain policy mirrors Slack/Discord/Teams (local unbind without requiring Vault destroy unless product explicitly offers revoke) — freeze exact revoke UX at Approval |

---

## 9. Device / subscription model (Web Push)

Push is **not** a single webhook URL channel. Delivery requires:

1. VAPID application credentials (Vault), and
2. At least one **browser Web Push subscription** owned by notification-delivery.

**`WorkspacePushNotificationAnchor` is NOT the subscription registry** and must not be treated as one.

### What must be stored (logical fields)

| Field                                                 | Purpose                          | Secret?                                                                                           |
| ----------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| workspaceId / userId                                  | Ownership + isolation            | No                                                                                                |
| subscriptionId                                        | Stable local id                  | No                                                                                                |
| providerKind                                          | `web-push` (P3 only)             | No                                                                                                |
| endpoint                                              | Web Push delivery URL            | **Sensitive** — treat as secret-like; never return full value after create; redact in diagnostics |
| keys.p256dh                                           | Web Push encryption              | **Secret** — store protected at rest with workspace isolation; never echo                         |
| keys.auth                                             | Web Push authentication secret   | **Secret** — same                                                                                 |
| userAgent / label (optional)                          | Operator recognition             | No                                                                                                |
| createdAt / updatedAt / lastSuccessAt / lastErrorCode | Lifecycle                        | No                                                                                                |
| status                                                | `active` / `revoked` / `expired` | No                                                                                                |

### Ownership

- **Owner:** Notification Delivery (justified under existing bounded context — ESTABLISHED by capability inventory / W5-N04 scope).
- **Not owner:** Vault (credentials only), Connection Management facade (connect UX only), PC-06 (routing only).

### Lifecycle (binding)

```text
register
→ active
→ provider reports gone / 410 / invalid
→ subscription becomes inactive / expired
→ browser may re-register
```

Disconnect must revoke/deactivate the workspace user’s Push subscriptions.

### Registration flow (product)

```text
Operator authenticates
→ ensures VAPID credentials provisioned (Connections/Vault)
→ browser obtains PushSubscription via PushManager (apps/web)
→ POST /v1/push/subscriptions with endpoint + keys.p256dh + keys.auth
→ server validates + persists
→ operator Test uses VAPID + subscription via production adapter
→ Connected only after successful production send evidence (§13)
```

---

## 10. Persistence decision

| Question                                                                | Decision                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are `workspace_push_notification_anchors` sufficient for subscriptions? | **NO** — anchors are per-notification foundation rows (`anchor-recorded` only); they do not store endpoints/keys                                                                                                                |
| Is a database table required?                                           | **YES** — durable Web Push subscription registry under notification-delivery                                                                                                                                                    |
| Is a Prisma migration required?                                         | **YES** — new model/table required at implementation (not in this planning act)                                                                                                                                                 |
| Snapshot-only / in-memory?                                              | **FORBIDDEN** for production subscriptions                                                                                                                                                                                      |
| Stale subscription lifecycle                                            | Provider 404/410/Gone → mark `expired`/`revoked`; stop further sends; browser may re-register                                                                                                                                   |
| Disconnect semantics                                                    | Disconnect sets Push connection disconnected **and** revokes/deactivates subscriptions for that workspace+user (exact cascade detail at Planning Approval); does not claim Vault secret destroyed unless explicit revoke action |
| Cross-workspace                                                         | Forbidden — fail closed                                                                                                                                                                                                         |

**This package does not create a migration and does not implement persistence.**

---

## 11. API contract

Mirror PC-07 channel product shape; do **not** blindly copy webhook-only bind semantics.

Proposed surface (names frozen at Approval; Nest module `push-product` parallel to `discord-product`):

| Method   | Endpoint                     | Purpose                                               |
| -------- | ---------------------------- | ----------------------------------------------------- |
| `GET`    | `/v1/push/connection`        | Status view (no secrets)                              |
| `POST`   | `/v1/push/bind`              | Associate credentials + readiness (provider-specific) |
| `POST`   | `/v1/push/subscriptions`     | Register/replace Web Push subscription                |
| `DELETE` | `/v1/push/subscriptions/:id` | Revoke one subscription                               |
| `POST`   | `/v1/push/test`              | Production Web Push adapter test send                 |
| `POST`   | `/v1/push/disconnect`        | Disconnect + revoke subscriptions                     |
| `GET`    | `/v1/push/diagnostics`       | Safe diagnostics (redacted)                           |

### Common semantics

| Topic             | Contract                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Authorization     | Authenticated workspace member with existing notification-channel permissions (same class as other PC-07 channels) |
| Request secrets   | Private VAPID credentials never accepted on push-product routes — only via Connections/Vault                       |
| Subscription body | Accepted once at register; responses return id + metadata only                                                     |
| State             | `disconnected` / `pending` / `connected` / `failed` — Connected only after successful test send (§13)              |
| Errors            | Stable error codes; no credential leakage                                                                          |

### Web Push registration body (binding)

```text
endpoint: https URL
keys.p256dh: string
keys.auth: string
expirationTime?: number | null
```

**FCM registrationToken bodies are OUT OF SCOPE for CM-16.**

---

## 12. UI contract

| Surface                        | Before CM-16 implementation               | After implementation + verification gates                                                              |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Catalog                        | Push **RESERVED / INACTIVE**              | Push **active** only when adapter bound and product offered                                            |
| `/notifications/channels/push` | Reserved disclosure (`Device`, `Browser`) | Push settings: VAPID credential guidance, browser subscription register, test, disconnect, diagnostics |
| Connect/bind                   | Not offered                               | Offered when authorized                                                                                |
| Test                           | Not offered                               | Offered when bound/subscribed                                                                          |
| Diagnostics                    | Not offered / reserved                    | Redacted only                                                                                          |
| False operational labels       | Forbidden                                 | Connected only from production send evidence                                                           |

**Planning rule:** Do **not** modify UI in this planning act. Push must remain **RESERVED / INACTIVE** until CM-16 is implemented and verification rules in this package are met (Connected still requires test evidence; customer-visible proof remains FIV).

---

## 13. Delivery contract

### Adapter

```text
ProductionWebPushNotificationAdapter
  implements NotificationChannelPort
  channelId = 'push'
  active = true (only when Nest-bound after implementation + Approval)
```

Shape:

```text
NotificationChannelPort
→ Production Web Push adapter
→ Vault VAPID credential resolver (retrieve-at-send; no secrets on adapter)
→ Web Push provider (HTTPS to subscription endpoint)
```

Injectable/mocked transport required for automated tests (parallel to Teams `TEAMS_WEBHOOK_FETCH` pattern).

### Transport semantics (Web Push — P3)

| Topic                          | Contract                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Protocol                       | HTTPS POST to subscription endpoint (RFC 8030 / Web Push)                                                    |
| Auth                           | VAPID JWT / authorization headers                                                                            |
| Payload                        | Encrypted push message (title/body attention text)                                                           |
| Success (transport acceptance) | Provider accepted request (HTTP 201/200 class — exact codes frozen with library choice at Planning Approval) |
| Timeout                        | Hard timeout (propose 10s; freeze at Planning Approval); fail closed                                         |
| Redirects                      | Reject / do not follow — must not allow SSRF bypass                                                          |
| Error mapping                  | Stable codes: timeout, rejected, gone/expired, unauthorized, invalid-subscription, malformed/unsafe endpoint |

### Evidence fields

| Field                      | Meaning                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `adapterReached`           | Production adapter executed send path                                |
| `pushUsed` (or equivalent) | Real Web Push transport used (not reserved skip; not in-memory fake) |
| delivery attempt id        | Correlation for diagnostics/history                                  |

### Connected / Verified truthfulness (binding)

Push must **NOT** become Connected merely because:

- a Connection record exists;
- Vault contains VAPID credentials;
- a browser subscription exists;
- an endpoint was accepted into persistence.

A production test must reach the production Web Push adapter/provider path.

```text
Transport acceptance  ≠  Customer-visible notification
```

- **Transport acceptance:** Web Push provider accepted the request on the operator test path → may advance connection toward **Connected**.
- **Customer-visible notification:** operator actually sees the browser/OS notification — **required for FIV**, not claimed by transport acceptance alone.

**Credentials stored ≠ Connected. Subscription stored ≠ Connected. Transport HTTP success ≠ FIV customer-visible proof.**

---

## 14. Security model

| Control                    | Requirement                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Credential protection      | Vault only; retrieve-at-send; no system principal                                                                                                                  |
| Authorization              | Workspace-scoped; authenticated; same notification permission class                                                                                                |
| Tenant ownership           | Subscriptions bound to workspaceId + userId; cross-workspace forbidden                                                                                             |
| Secret redaction           | VAPID private key, `auth`, `p256dh`, full endpoints never in API/UI/logs/diagnostics/tests/docs/Git                                                                |
| Malformed subscription     | Reject fail-closed; do not persist garbage                                                                                                                         |
| Provider response handling | Map to stable errors; never attach provider raw bodies containing secrets to client views                                                                          |
| Timeout                    | Fail closed; no hang                                                                                                                                               |
| Retry                      | Operator test: no aggressive multi-retry that amplifies SSRF; deliver() retry remains existing platform policy — do not invent push-specific retry engine in CM-16 |
| Replay                     | Subscription registration requires auth session; test requires auth; no anonymous subscribe endpoint                                                               |
| Endpoint ownership         | Only the authenticated user may register/revoke their subscriptions in the workspace                                                                               |
| No trading capability      | Push delivery must not start/stop/approve trades                                                                                                                   |

---

## 15. Web Push endpoint security policy

**Do not copy Slack/Discord/Teams fixed-host webhook allowlists blindly.** Web Push endpoints are dynamic provider URLs.

Validation must be performed against the **actual outbound target**.

### Minimum requirements (binding)

| Rule                   | Contract                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheme                 | `https` only                                                                                                                                                                                             |
| Localhost              | Reject                                                                                                                                                                                                   |
| Loopback               | Reject                                                                                                                                                                                                   |
| Private IP ranges      | Reject                                                                                                                                                                                                   |
| Link-local             | Reject                                                                                                                                                                                                   |
| Cloud metadata targets | Reject                                                                                                                                                                                                   |
| Malformed endpoints    | Reject fail-closed                                                                                                                                                                                       |
| Userinfo in URL        | Reject                                                                                                                                                                                                   |
| Fragments              | Reject                                                                                                                                                                                                   |
| Timeout                | Bounded; fail closed                                                                                                                                                                                     |
| Redirects              | Policy must **not** allow SSRF bypass (do not follow to arbitrary hosts)                                                                                                                                 |
| Size limits            | Cap endpoint/key lengths                                                                                                                                                                                 |
| Host policy            | Cannot be a single vendor host — browsers produce push-service URLs; combine blocked-address checks + public resolution policy + optional known push-service host suffixes (detail at Planning Approval) |

Outbound send must go through the production adapter’s validated target path only — never operator-supplied free-form URLs on the test endpoint beyond the stored subscription.

**FCM fixed-host allowlist model:** not applicable (FCM OUT).

---

## 16. Test strategy

### Automatable without real Push provider

| Class      | Coverage                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | Domain connection state; subscription validation; redaction; error mapping                                                                                             |
| Contract   | Adapter port with mocked/injected Web Push transport; Connected only on mocked success                                                                                 |
| Security   | No secret echo; Web Push endpoint policy rejects (localhost/loopback/private/link-local/metadata/malformed/userinfo/fragment); authz fail-closed; cross-workspace deny |
| API        | Route auth; bind/subscribe/test/disconnect status codes; diagnostics redaction                                                                                         |
| UI         | Reserved page remains honest until feature flags/catalog flip; settings wiring with mocks                                                                              |
| Regression | Telegram / Email / Slack / Discord / Teams / PC-06 / PC-07 catalog + default telegram-only                                                                             |

### Requires real environment (FIV / live — not planning)

| Need                                     | Why                                             |
| ---------------------------------------- | ----------------------------------------------- |
| Real browser                             | PushManager subscription issuance on `apps/web` |
| Real Web Push subscription               | endpoint + keys authenticity                    |
| Real VAPID credential in Vault           | Never in Git/tests                              |
| Real production Web Push adapter         | Not mocked transport                            |
| Customer-visible browser/OS notification | Operator sees notification                      |

**Live Push delivery: FIV ONLY.**  
**Do not place real provider credentials or live delivery into automated test suites.**  
**Live Push tests during planning: FORBIDDEN.**  
**Live Telegram / SMTP / Slack / Discord / Teams in automated CM-16 unit tests: FORBIDDEN.**

---

## 17. Real-provider verification strategy (future FIV)

FIV is **not** authorized by this package.

Future FIV must prove end-to-end:

```text
1. Real browser Web Push subscription
2. Real VAPID credential in Vault (Connections)
3. POST /v1/push/test → production Web Push adapter reached
4. Provider accepted the notification (transport acceptance)
5. Real customer-visible browser/OS notification appeared
6. Sensitive credentials / subscription material were not leaked
7. Disconnect / revocation works
8. Existing notification channels remain unaffected
+ adapterReached + pushUsed evidence
+ Connected/Verified honesty (not credential/subscription alone)
+ regression: Telegram default + Email/Slack/Discord/Teams + PC-06/PC-07
+ CM-15 remains represented as FIV BLOCKED/DEFERRED (not CLOSED)
```

---

## 18. Customer-visible evidence requirements

| Evidence                                                | Gate                                |
| ------------------------------------------------------- | ----------------------------------- |
| Transport acceptance on test                            | Required for Connected candidacy    |
| Customer-visible notification                           | Required for **FIV PASS**           |
| Screenshot/operator attestation of visible notification | PO FIV record (never store secrets) |
| Diagnostics show redacted subscription metadata only    | Required                            |

---

## 19. Routing

| Rule                    | Contract                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Today                   | Push reserved → `channel-reserved`                                                                                        |
| After implementation    | Push may become **selectable** only through explicit channel configuration when catalog `active` and connection Connected |
| Default routing         | **Telegram-only** preserved — **do not** automatically add Push to the default route                                      |
| Push as default         | **FORBIDDEN** in CM-16                                                                                                    |
| Trading / control plane | **FORBIDDEN** — no trading command capability                                                                             |
| CM-15 deferred          | Teams remains implemented but live FIV deferred; routing must not invent Teams-default either                             |

Do **not** change routing in this planning act.

---

## 20. Diagnostics

Safe diagnostics may include:

- connection status / timestamps / lastErrorCode
- subscription count / ids / statuses (not full endpoints/tokens/keys)
- last test outcome codes
- `adapterReached` / `pushUsed` booleans from last attempt
- providerKind = `web-push`

Must never include:

- VAPID private key
- `auth` / `p256dh` / full endpoints
- Authorization headers / JWT
- Any FCM material (FCM is OUT — must not appear)

---

## 21. Regression requirements

Mandatory regression before CM-16 close candidates:

| Area               | Requirement                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Telegram           | Connect/test/status/disconnect unchanged; default route telegram-only                          |
| Email              | Production SMTP path unchanged                                                                 |
| Slack              | Incoming webhook path unchanged                                                                |
| Discord            | Incoming webhook path unchanged                                                                |
| Teams              | Implementation path unchanged; **CM-15 FIV remains BLOCKED/DEFERRED**; **CM-15 is NOT CLOSED** |
| PC-06              | Preferences/routing/deliveries unchanged except Push becoming selectable post-activation       |
| PC-07              | Catalog honesty; Push reserved until activation rules met                                      |
| TD-CM15-TEAMS-LIVE | Remains OPEN / DEFERRED / NON-BLOCKING                                                         |

---

## 22. Technical debt impact

| Debt                   | Impact of CM-16                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TD-049**             | **Unchanged / remains OPEN** — Telegram Bot API debt item; do not close                                                                            |
| **TD-CM15-TEAMS-LIVE** | **Unchanged / remains OPEN / DEFERRED / NON-BLOCKING** — do not merge or close                                                                     |
| **TD-050**             | CM-16 addresses **Push portion only** after future close. Selecting P3 does **NOT** resolve or close TD-050. Do **NOT** automatically close TD-050 |

### TD-050 residual after successful CM-16 close (future)

Register text historically listed SMTP/Slack/Discord/Teams/Push as reserved. Code today activates Telegram/Email/Slack/Discord/Teams; Push remains the reserved catalog channel. After CM-16 closes:

- **Resolved portion:** Push reserved-inactive transport gap (when production Push verified).
- **Remaining TD-050 scope:** Any residual register wording / honesty cleanup PO accepts; do not silent-close the whole item. If PO determines TD-050’s entire remaining meaning was “Push still reserved,” a **separate PO debt act** may close it — **not** automatic with CM-16 planning or implementation alone.

---

## 23. Dependencies

| Dependency                                                    | Role                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Wave 1 Vault                                                  | Credential store                                                   |
| Wave 2 Connection Management                                  | Operator credential facade                                         |
| Wave 3 durable notification queue                             | Existing delivery durability (consume)                             |
| PC-06 routing                                                 | Route decisions                                                    |
| PC-07 catalog                                                 | Channel surfaces                                                   |
| Notification Delivery port                                    | Adapter bind                                                       |
| W5-N04 foundation                                             | Anchors/recovery patterns (consume, do not reopen as transport)    |
| Closed CM-11…CM-14 production channels + CM-15 implementation | Regression baselines                                               |
| TD-CM15-TEAMS-LIVE NON-BLOCKING                               | Allows planning while Teams live FIV deferred                      |
| **Provider freeze P3**                                        | **COMPLETE** — Web Push + VAPID; FCM OUT                           |
| Browser Push API / Service Worker on `apps/web`               | Runtime environment for FIV                                        |
| Optional npm Web Push library                                 | Implementation-time only after Approval (not added by this freeze) |

---

## 24. Risks

| Risk                                            | Mitigation                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Provider decision remains OPEN                  | **Resolved** — FROZEN = P3                                               |
| SSRF via malicious subscription endpoint        | Web Push endpoint security policy (§15); no blind webhook allowlist copy |
| Claiming Connected without visible notification | Split transport vs FIV customer-visible proof                            |
| Treating anchors as subscriptions               | Explicit persistence decision (§10)                                      |
| Secret leakage of endpoint keys                 | Redaction + retrieve-at-send                                             |
| Push becomes default route                      | Forbidden                                                                |
| CM-15 treated as CLOSED                         | Explicit regression + non-declarations                                   |
| Premature TD-050 close                          | Push-portion-only rule; P3 selection does not close TD-050               |
| Scope creep to FCM / APNs / native apps         | **OUT** — do not reopen                                                  |
| New npm dependency supply chain                 | Freeze library at Planning Approval; minimal surface                     |

---

## 25. Acceptance criteria

Objective criteria for a future successful CM-16 (post-implementation + FIV):

1. Provider decision **FROZEN = P3** implemented as frozen (Web Push + VAPID; FCM OUT).
2. VAPID credentials configured and stored only in Vault via Connections.
3. Browser Web Push subscription registration works (`endpoint` + `keys.p256dh` + `keys.auth`).
4. Production Web Push adapter selected and Nest-bound.
5. Operator test delivery achieves transport acceptance.
6. Transport evidence truthful (`adapterReached`, `pushUsed` / equivalent).
7. Customer-visible browser/OS notification verified at FIV.
8. Connection state truthful (Connected only after successful test send evidence — not credential/subscription alone).
9. Disconnect/revoke stops further Push delivery use.
10. Diagnostics are safe (no secret material).
11. Credentials never exposed in API/UI/logs/diagnostics/tests/docs/Git (private VAPID never; public only for subscribe).
12. Web Push endpoint security controls verified (§15).
13. Routing remains safe; Push selectable only via explicit config when active+connected; **not** default.
14. Default routing remains Telegram-only.
15. Telegram / Email / Slack / Discord / Teams do not regress.
16. Push does not falsely become “operational” before FIV customer-visible proof.
17. No unauthorized trading capability introduced.
18. Catalog leaves reserved-inactive only under honest activation rules.
19. Prisma subscription persistence present and workspace-isolated (anchors ≠ registry).
20. CM-15 remains documented as FIV BLOCKED/DEFERRED / NOT CLOSED.
21. No FCM / APNs / native mobile push introduced.

---

## 26. FIV entry criteria

FIV may be requested only after:

```text
Planning Review PASS
+ Planning Approval GRANTED
+ Planning Repository Synchronization PASS
+ Implementation PASS
+ Implementation Repository Synchronization PASS
+ Automated unit/contract/security/API/UI/regression PASS (mocked Web Push transport)
+ Real VAPID credentials available in Vault (never in Git)
+ Real browser available for PushManager subscription
+ Real Web Push provider reachable
+ Operator ready to attest customer-visible browser/OS notification
```

FIV must prove the chain in §17. This package does **not** authorize FIV.

---

## 27. Repository synchronization requirements

| Gate                                | Rule                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Planning Repository Synchronization | Separate PO-authorized gate after Planning Approval — commit planning artifact(s) only   |
| Implementation sync                 | Separate gate after implementation                                                       |
| This Planning Approval + sync act   | Commit **only** this planning package. Protected leftovers untouched. No implementation. |

Known protected leftovers (must remain untouched by this planning act):

```text
 M docs/project/technical-debt.md
 M docs/project/version-3/wave-5/wave-5-progress.md
?? apps/api/src/modules/notification-delivery/production-telegram-operator-test-message.spec.ts
?? docs/project/version-3/wave-5/database-startup-blocker-analysis.md
?? docs/project/version-3/wave-5/next-package-planning-proposal.md
?? docs/project/version-3/wave-5/next-slice-planning-analysis.md
?? docs/project/version-3/wave-5/teams-incoming-webhook-fiv-deferred.md
?? docs/project/version-3/wave-5/telegram-vault-credential-provisioning-analysis.md
```

---

## 28. Governance gates

| Gate                                | Status after Planning Approval + sync                                       |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Planning Package                    | **APPROVED** (provider FROZEN = P3)                                         |
| Provider decision                   | **FROZEN = P3**                                                             |
| Planning Review                     | **PASS**                                                                    |
| Planning Approval                   | **GRANTED**                                                                 |
| Planning Repository Synchronization | **PASS** (this commit)                                                      |
| Implementation gate                 | **AUTHORIZED** — begin only as a **separate** Product Owner–instructed task |
| Implementation executed             | **NO**                                                                      |
| FIV                                 | **NOT AUTHORIZED**                                                          |
| Final Close                         | Not authorized                                                              |
| CM-16 CLOSED                        | No                                                                          |
| Push operational                    | No                                                                          |
| FCM / APNs / native mobile          | **OUT OF SCOPE**                                                            |

Master Plan confirms CM-16 already represented by **V3-N04**. Execution Roadmap confirms **V3-N04 → CM-16 Push**. Neither file is modified by this package.

---

## 29. Explicit non-declarations

- CM-16 is **NOT IMPLEMENTED** (Approval does not equal implementation).
- CM-16 Implementation gate is **AUTHORIZED**; implementation has **NOT** been executed by this Approval / sync.
- CM-16 is **NOT FIV AUTHORIZED**.
- CM-16 is **NOT CLOSED**.
- Push is **NOT operational**.
- No real Push customer-visible delivery has been verified.
- No live Push notification was sent by this Approval / sync.
- No VAPID credential was provisioned by this Approval / sync.
- Provider mechanism is **FROZEN = P3** (Web Push + VAPID).
- **FCM is OUT OF SCOPE** for CM-16.
- **APNs is OUT OF SCOPE** for CM-16.
- Native iOS/Android push is **OUT OF SCOPE** for CM-16.
- CM-15 remains **BLOCKED / DEFERRED** (live FIV).
- CM-15 is **NOT CLOSED**.
- TD-CM15-TEAMS-LIVE remains **OPEN / DEFERRED / NON-BLOCKING**.
- TD-049 remains **OPEN**.
- TD-050 remains **OPEN** (Approval does not resolve TD-050).
- Master Plan unchanged.
- Execution Roadmap unchanged.
- Wave 5 **NOT COMPLETE**.
- No W5-N30 / V3-N30 / CM-37 created.
- Foundation W5-N04 not reopened as production transport.

---

## 30. STOP conditions

**STOP** after Planning Approval + Planning Repository Synchronization.

Do **NOT** in this act:

- start CM-16 implementation
- add Prisma migrations
- add npm dependencies
- modify application code, tests, schema, or configuration
- modify UI or routing
- provision VAPID credentials
- perform live Push delivery
- perform FIV
- perform Final Close
- close TD-049 / TD-050 / TD-CM15-TEAMS-LIVE
- treat CM-15 as CLOSED
- introduce FCM / APNs / native mobile push
- invent another slice identifier
- reopen P1 / P2 / P4
- modify Master Plan or Execution Roadmap
- touch protected leftovers

**Next gate:** Implementation — only as a **separate** Product Owner–instructed controlled task, strictly within this approved P3 Planning Package.

---

## Baseline confirmation

| Check                | Result                                     |
| -------------------- | ------------------------------------------ |
| `git rev-parse HEAD` | `bb79f03b9344d5400ee246b397fb33f960bce59b` |
| `origin/main`        | `bb79f03b9344d5400ee246b397fb33f960bce59b` |
| HEAD == origin/main  | **YES**                                    |
| Master Plan          | **UNCHANGED**                              |
| Execution Roadmap    | **UNCHANGED**                              |
| Wave 5               | **NOT COMPLETE**                           |

Product Owner operational baseline (consumed, not re-declared):

```text
W5-N01…W5-N29 = CLOSED (foundations)
V3-N01 Telegram production = CLOSED / PASS
V3-N02 Email production = CLOSED
V3-N03 · CM-13 Slack = CLOSED
V3-N03 · CM-14 Discord = CLOSED
V3-N03 · CM-15 Teams = Implementation PASS; FIV BLOCKED/DEFERRED; NOT CLOSED
TD-CM15-TEAMS-LIVE = OPEN / DEFERRED / NON-BLOCKING
V3-N04 · CM-16 Push = PLANNING APPROVED / SYNCED (provider FROZEN = P3; NOT IMPLEMENTED)
Wave 5 = NOT COMPLETE
TD-049 = OPEN
TD-050 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
Foundation W5-N04 = CLOSED (consumed, not reopened)
FCM = OUT OF SCOPE for CM-16
APNs = OUT OF SCOPE for CM-16
```
