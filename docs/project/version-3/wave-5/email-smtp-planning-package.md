# Production Email SMTP — Connect / Test / Status

**Document:** Planning Package — Production Email SMTP Operator Connect / Test / Status
**Date:** 2026-09-14
**Label:** Production Email SMTP Operator Connect / Test / Status (planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner Planning Package (Planning Review **PASS**; Planning Approval **GRANTED** — this synchronization)
**Owner:** Notification Delivery (product consumed by a new email-product HTTP adapter / notification-product / web; credentials remain Vault + Connections)
**Predecessor:** REM-03 CLOSED
**Planning analysis:** [`next-slice-planning-analysis.md`](./next-slice-planning-analysis.md)

**Baseline:** `be317fb287e846687faf056268c21e44d77ff746` — `docs(rem-03): close package`

```text
PLANNING APPROVED
IMPLEMENTATION NOT AUTHORIZED
Official package ID = NOT CREATED
Email SMTP planning approval = PASS
```

---

## Lifecycle

| State               | This package             |
| ------------------- | ------------------------ |
| **PLANNED**         | **YES**                  |
| **PLANNING REVIEW** | **PASS**                 |
| **APPROVED**        | **PASS** (planning only) |
| **IMPLEMENTED**     | **NO**                   |
| **VERIFIED**        | **NO**                   |
| **CLOSED**          | **NO**                   |

Implementation authorization is **not** granted by this package.

This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

---

## 1. Executive summary

Telegram is a real production transport. Email is the next original Wave 5 channel (V3-N02 / CM-12). W5-N02 closed as **foundation only**. There is no production SMTP notification adapter, no Email connection domain, no Email product REST, and `deliver()` still hard-skips every non-Telegram channel.

This package authorizes planning for **one coherent production Email slice**:

```text
Email connection
+ Vault SMTP credential (existing HoldableSecretType.Smtp)
+ recipient binding
+ production SMTP adapter
+ operator test
+ truthful Connected / status / disconnect
+ deliver() Email send branch
```

Existing architecture is sufficient. Credentials stay in Vault via the existing Connections SMTP catalog. Notification Email Connected lives on a new `EmailConnection` beside `TelegramConnection` — **not** on `ConnectionRecord.status` and **not** on `workspace_email_notification_anchors`.

Auth `SmtpHostMail` remains password-recovery infrastructure. It is not the notification adapter.

```text
Slice type: production Email transport + PC-07 product
Minimum production runtime change: REQUIRED
New HTTP routes: REQUIRED (/v1/email/* parallel to /v1/telegram/*)
Prisma migration: NOT REQUIRED
New npm dependency: NOT REQUIRED (nodemailer already present)
Live SMTP in tests: FORBIDDEN
Live Telegram in tests: FORBIDDEN
System Vault principal: FORBIDDEN
```

**Credentials stored ≠ Connected.** Vault `SecretState.Connected` and Connections local `validate()` do not mean SMTP works. Email becomes Connected only after a successful production SMTP send of the operator test message (SMTP accepted the DATA / mocked transporter `ok`). Customer-visible mailbox proof is a later Product Owner live-verification act, analogous to Telegram.

---

## 2. Baseline

Verified at package writing (read-only):

| Check                | Result                                     |
| -------------------- | ------------------------------------------ |
| `git rev-parse HEAD` | `be317fb287e846687faf056268c21e44d77ff746` |
| Latest commit        | `be317fb docs(rem-03): close package`      |

Product Owner operational baseline (consumed, not re-declared):

```text
REM-01-s1 = CLOSED
REM-01-s2 = CLOSED
REM-02 = CLOSED
Production Telegram Operator Test-Message = CLOSED
REM-03 = CLOSED
V3-N01 = PASS
J3-06 = VERIFIED
Telegram production delivery = REAL / CUSTOMER-VISIBLE / VERIFIED
Telegram production truthfulness = RESOLVED
Wave 5 = NOT COMPLETE
TD-049 = OPEN
TD-050 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
```

This package does **not** reopen those closed slices. It does **not** complete Wave 5.

---

## 3. Wave 5 alignment

Original objective (Execution Roadmap, unchanged):

> Delivery channels become real transports on the existing catalog and routing product.

Binding order: **V3-N01 → N02 → N03 → N04**. Telegram (N01) is production-real. This slice is production **Email (N02)** only.

Master Plan: operators connect Email the same way as Telegram, or see it still reserved. After this slice ships, Email is no longer reserved. Slack/Discord/Teams/Push stay reserved.

Telegram remains delivery-only. Email is delivery-only. Neither is a control plane.

---

## 4. Current Email architecture

### Catalog and routing

`NOTIFICATION_CHANNEL_CATALOG`: Telegram `active`; Email/Slack/Discord/Teams/Push `reserved-inactive`.

`resolveDeliveryRoutes` skips reserved channels with `channel-reserved`. Default preferences enable **telegram only**. Default type routing channels = `['telegram']`.

`NotificationDeliveryService.deliver()` sends Telegram when routed; every other channel is recorded `skipped / channel-reserved` even if routing later changed. `ReservedInactiveChannelAdapter` exists but is **not Nest-bound**.

Ports: `emailChannel: false`. No `EMAIL_CHANNEL_ADAPTER` token.

### Product

- PC-07 Telegram: `/v1/telegram/*` + `TelegramSettingsPage`.
- PC-07 Email: reserved `NotificationChannelDetailView`. Copy: SMTP not collected; send test not offered. Required-field disclosure: Provider / SMTP, Sender, Recipient(s).
- PC-06: settings / preferences / routing / deliveries. Controllers explicitly do not connect or send tests.
- Web: `/notifications/channels/email` renders the reserved page. Telegram is the only special-cased offered channel.

### Foundation (W5-N02, not a connection SoT)

`WorkspaceEmailNotificationAnchor` / `workspace_email_notification_anchors`: per-notification anchors with optional `recipientIdentifier`, `deliveryState = 'anchor-recorded'`. Inventory forbids treating this as SMTP Connected.

### Connections / Vault (credential substrate, not Email Connected)

| Artifact                                     | State                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| Connections catalog SMTP                     | EXISTS — `host/port/username/password/sender`                                   |
| `vaultSecretTypeForProvider('SMTP')`         | `HoldableSecretType.Smtp`                                                       |
| Vault purpose                                | `SecretPurpose.Notification`                                                    |
| Field validation                             | well-formed only; no vendor I/O                                                 |
| `POST /v1/connections/:id/validate` for SMTP | **local** non-empty field check → may set `ConnectionRecord.status = CONNECTED` |
| `vaultConnectedMeansProviderWorks()`         | **false** (frozen)                                                              |

Connection Management CONNECTED for SMTP means “local credential slot looks stored.” It is **not** PC-07 Email Connected and must not be reused as such.

---

## 5. SMTP architecture

### Existing mail infrastructure (must stay split)

| Path                              | Owner                  | Role                                                                       |
| --------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| `SmtpHostMail` + `createHostMail` | Authentication         | Host `MAIL_*` env; password-reset only                                     |
| `nodemailer`                      | API dependency already | Library for Auth mail today; **reuse as library** for notification adapter |
| Telegram Bot API HTTP             | Notification Delivery  | Pattern for retrieve-at-send + timeout + SSRF + stable errors              |

### Required notification SMTP adapter

New class on notification-delivery, parallel to `ProductionTelegramBotApiAdapter`:

```text
ProductionSmtpNotificationAdapter
  implements NotificationChannelPort
  channelId = 'email'
  active = true
```

One adapter supports:

1. **Operator test / notification send** (`send`) — `nodemailer.sendMail` to the bound recipient.
2. **Optional handshake helper** (`verify`) — `transporter.verify()` for diagnostics only.

**Connected is defined by successful `send`, not by handshake-only `verify`.** Handshake without a recipient is not a notification test. Telegram Connected is chat-bound; Email Connected is “recipient bound and SMTP accepted a test message.”

Do **not** call `SmtpHostMail`. Do **not** read `MAIL_HOST` / `MAIL_PASSWORD`. Credentials come only from Vault `Smtp`.

### Transport rules

| Rule                      | Requirement                                                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retrieve                  | At send/test time via `SmtpCredentialResolver` (clone of `TelegramBotTokenResolver` for Smtp fields)                                                                             |
| Cache                     | None. No transporter reuse that retains password across requests                                                                                                                 |
| Timeout                   | Bounded (10s, same order as Telegram HTTP)                                                                                                                                       |
| TLS                       | Port 465 → implicit TLS (`secure: true`). Port 587 → STARTTLS required (`requireTLS: true`). `tls.rejectUnauthorized: true`. Plaintext/port 25 without TLS → `smtp_tls_required` |
| From                      | Vault `sender` field                                                                                                                                                             |
| To                        | Bound `EmailConnection.recipient` (port destination; see §8)                                                                                                                     |
| Redirects / operator URLs | Not applicable; host is a hostname, not a webhook URL                                                                                                                            |
| Logging                   | Workspace, operation, duration, stable error code only. Redact password/username/sender if they appear in nodemailer errors                                                      |

### SSRF / host policy

`validateOutboundSsrfTarget` validates **http(s) URLs** and optional host allowlists. Telegram pins `api.telegram.org`. Customer SMTP cannot be pinned to one host.

Apply the **same hostname/IP block set** (localhost, RFC1918, link-local, metadata `169.254.169.254`, IPv6 ULA/link-local) to the SMTP `host` field. Implementation: a small SMTP host guard beside the existing SSRF helper (wrap `smtp://host` or extract the shared `hostnameIsBlocked` checks). No DNS resolution — same documented limit as current SSRF helper.

Blocked host → `smtp_blocked_host`. Do not connect.

---

## 6. Vault integration

**No Vault authorization or schema change is required.**

Reuse:

```text
HoldableSecretType.Smtp
SecretPurpose.Notification          (defaultPurposeForType('smtp'))
validateHoldableSecretFields        (host, port, username, password, sender)
SecretVaultService.retrieve         (C8 + workspace membership)
TelegramBotTokenResolver pattern    → SmtpCredentialResolver
```

Retrieve input (same actor contract as Telegram):

```text
actorWorkspaceId = authenticated userId
actorRole        = authenticated role
workspaceId      = X-Workspace-Id
type             = smtp
purpose          = notification (default)
```

Missing actor → fail closed (`smtp_invalid_request`), same as Telegram.

Vault `SecretState.Connected` remains “ciphertext stored.” It does **not** flip Email product Connected.

Do **not**: second secret store; system principal; C8 bypass; token/password cache; purpose/type invention; retrieve in views.

---

## 7. Connection model

Follow **TelegramConnection**, not ConnectionRecord, not Email anchors.

### Dual ownership (already true for Telegram)

| Layer                                            | Stores                                  | Email Connected?   |
| ------------------------------------------------ | --------------------------------------- | ------------------ |
| Connections + Vault                              | SMTP host/port/username/password/sender | **No**             |
| `EmailConnection` on notification-delivery store | recipient + verification status         | **Yes, only this** |

### `EmailConnection` (new domain, same owner as Telegram)

```text
workspaceId
userId
status: not-connected | pending | connected
recipient?: string          // operator-bound mailbox; not a secret
verifiedAt?: string         // set only after successful SMTP send
connectedAt?: string
updatedAt
```

Transitions:

| Event                               | From                                | To                                                         |
| ----------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Bind recipient (Vault SMTP present) | not-connected / pending / connected | **pending** (never connected)                              |
| Bind recipient (Vault SMTP missing) | *                                   | **pending** or remain not-connected; test will fail closed |
| Successful operator test send       | pending                             | **connected**                                              |
| Failed operator test send           | pending / connected                 | **pending** (not connected)                                |
| Disconnect                          | *                                   | **not-connected** (recipient and verifiedAt cleared)       |

Disconnect does **not** revoke Vault and does **not** delete `ConnectionRecord`. Same split as Telegram chat unbind vs Connections credential revoke.

Persistence: extend `InMemoryNotificationStore` / `DurableNotificationStore` snapshot with `email: EmailConnection[]`, exactly as `telegram: TelegramConnection[]`. Hydrate must treat missing `email` as empty (backward compatible). **No Prisma model.**

`workspace_email_notification_anchors` is **not** the Email connection table.

---

## 8. Recipient binding

Recipient does **not** exist as an Email connection field today. Anchor `recipientIdentifier` is a per-notification foundation field and must not be reused as the operator bind SoT.

### Rules

- Operator-entered mailbox on `POST /v1/email/bind` (or connect body). Telegram `userEnteredBind` stays `false`. Email bind is the exception that matches product truth.
- Workspace-scoped via `EmailConnection.workspaceId` + `userId`.
- Not a Vault secret; still omitted from logs as a credential; may appear in product JSON as the bound address (unlike Telegram `chatId`, which is hidden). Showing the mailbox is required for operator confirmation. Do not show SMTP password.
- Validate: non-empty, single address, no CR/LF (header injection), reasonable length. Reject display-name wrappers if they complicate sendMail.
- Client cannot set Connected. Bind → pending only.
- Routing continues to use the catalog + `resolveDeliveryRoutes`. Recipient is destination after a route is chosen.
- Telegram bind unchanged.

On `NotificationChannelPort.send`, reuse `chatId` as the destination string **filled by the service from `EmailConnection.recipient`**, never from the HTTP client on `deliver()`. Same pattern as Telegram filling `chatId` from `TelegramConnection`.

---

## 9. PC-07 behavior

Email becomes an **offered** channel (catalog `active`). Slack/Discord/Teams/Push stay reserved.

| Surface               | Behavior                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connect / credentials | Operator creates SMTP `ConnectionRecord` and `POST /v1/connections/:id/credentials` (existing). Email settings page links to Connections; does not collect password itself.               |
| Recipient             | Email product bind. Status becomes **pending**.                                                                                                                                           |
| Test                  | `POST /v1/email/test` with C2 + Vault retrieve C8 inside adapter. Canonical subject/body (Telegram test copy analog).                                                                     |
| Status                | `not-connected` / `pending` / `connected`. Connected **only** after successful test send.                                                                                                 |
| Disconnect            | Email product disconnect → not-connected. Vault/ConnectionRecord untouched.                                                                                                               |
| Catalog card          | Email `offered: true`, `configurationKind` email-connection, transport `smtp` when production adapter bound. Reserved channels unchanged.                                                 |
| Honesty               | `liveTransportActivated` true for Email only when production SMTP adapter is bound (classifier parallel to REM-03). Tests using an in-memory Email double project `in-memory` / not live. |

**Credentials stored ≠ Connected**

| State                                    | PC-07 Email                                      |
| ---------------------------------------- | ------------------------------------------------ |
| SMTP in Vault, no recipient              | not-connected (or pending without testAvailable) |
| Recipient bound, no successful test      | **pending** — not Connected                      |
| Connections `validate()` local CONNECTED | ignored by Email product                         |
| Vault SecretState.Connected              | ignored by Email product                         |
| Successful SMTP test send                | **connected**                                    |
| Failed test                              | pending; last test failed                        |

Successful SMTP test (implementation semantics):

```text
ProductionSmtpNotificationAdapter.send returned { ok: true }
= nodemailer sendMail completed without error
  (SMTP server accepted the message, or test double did)
```

Not required at implementation: IMAP/mailbox screenshot, live internet SMTP, or DNS MX proof.

---

## 10. Delivery integration

### `deliver()`

Add an Email send branch **after** routing, parallel to Telegram:

```text
if route.channelId === 'email'
  and EmailConnection.status === 'connected'
  and recipient present
  → emailAdapter.send({
      chatId: email.recipient,  // destination
      subject, body, workspaceId,
      actorUserId, actorRole    // from command, operator test supplies them
    })
else if email not connected
  → skip channel-not-connected
```

Telegram branch **unchanged**. Slack/Discord/Teams/Push remain hardcoded reserved skip (or catalog reserved).

`resolveDeliveryRoutes` gains `emailConnected` beside `telegramConnected`. Email catalog status becomes `active` so reserved skip no longer applies to Email.

### Operator test vs unattended fan-out

Operator test: `POST /v1/email/test` → dedicated `sendTestEmail` (or parameterized test) that:

- requires authenticated actor (same as Telegram test);
- does **not** depend on preferences enabling Email (otherwise test is unusable until PC-06 routing is edited);
- records a `DeliveryResult` with an Email attempt;
- on success, transitions EmailConnection to connected.

`sendTestNotification` today always routes `daily-report` to Telegram. **Do not overload it** in a way that changes Telegram tests. Add Email-specific test on the service port.

Unattended report/runtime `deliver()` without actor remains fail-closed at Vault retrieve. **Out of scope** to invent a system principal or plumb report actors. If an operator later enables Email in PC-06 and a report `deliver()` has no actor, Email send fails closed — same as Telegram today. Not this slice.

Default type routing stays telegram-only. Enabling Email for routed alerts is an operator preference act, not a silent default.

---

## 11. API impact

Existing routes **cannot** express Email recipient / SMTP test / Email Connected:

| Existing                        | Why insufficient                                         |
| ------------------------------- | -------------------------------------------------------- |
| `/v1/telegram/*`                | Telegram-only                                            |
| `/v1/notification-channels/:id` | GET projections; no connect/test                         |
| `/v1/connections`               | Credential slot; local validate ≠ SMTP I/O; no recipient |
| `/v1/notification-preferences`  | Routing only                                             |

### New routes (required) — parallel to Telegram

Prefix: `/v1/email`. Permission: list/status **C3 Projection**; mutating connect/bind/test/disconnect **C2 OwnWorkspace**. Vault retrieve inside adapter still enforces **C8**.

| Method | Endpoint                | Request          | Response                                | Why new        |
| ------ | ----------------------- | ---------------- | --------------------------------------- | -------------- |
| GET    | `/v1/email/connection`  | workspace header | Email status view (no password)         | Status         |
| POST   | `/v1/email/bind`        | `{ recipient }`  | Email connection view (pending)         | Recipient bind |
| POST   | `/v1/email/test`        | empty body       | test view + delivery                    | SMTP send      |
| POST   | `/v1/email/disconnect`  | empty            | not-connected view                      | Unbind         |
| GET    | `/v1/email/diagnostics` | workspace header | last Email delivery + transport honesty | Diagnostics    |

Optional: `POST /v1/email/connect` as an alias that only asserts Vault SMTP exists and returns pending/not-connected without collecting credentials (credentials stay on Connections). If bind is the first Email product mutation, connect can be omitted and the UI can say “store SMTP under Connections, then bind recipient.” **Prefer bind + test + status + disconnect as the minimum.** A connect endpoint that does not collect secrets is allowed if it improves UX parity with Telegram’s connect button.

No client `password`. No client SMTP host in Email product JSON (host lives in Vault; product may show `credentialsStored: boolean` via Vault metadata `get`, never fields).

PC-07 channel catalog GET responses change **values** for Email (offered/active) — existing routes, honesty widening.

---

## 12. Persistence / schema impact

```text
Prisma migration: NOT REQUIRED
New table: NOT REQUIRED
workspace_email_notification_anchors: UNCHANGED (not connection SoT)
connection_records: UNCHANGED
Vault tables: UNCHANGED
```

Email connection state persists on the existing notification-delivery **owner snapshot** (`DurableNotificationStore`), same mechanism as `TelegramConnection`. Snapshot JSON gains an `email` array; recovery treats absence as empty.

If implementation later proves snapshot persistence insufficient, that requires a **separate** planning act. This package does not authorize a Prisma EmailConnection table.

---

## 13. Dependency impact

```text
nodemailer: already in apps/api/package.json (^7.0.13)
@types/nodemailer: already present
New npm package: NOT REQUIRED
Telegram HTTP client: UNCHANGED
Auth mail factory: UNCHANGED
```

---

## 14. Security analysis

### Credentials

Vault only. No plaintext in `EmailConnection`, Prisma Email anchors, product JSON, or logs. Adapter redacts nodemailer error strings.

### SMTP SSRF

Operator-chosen host. Must use the existing private/metadata host block list. No connect to localhost/RFC1918/link-local/metadata. Syntactic check only (no DNS), matching current SSRF helper.

### Workspace isolation

`EmailConnection` keyed by workspace+user. Vault retrieve is workspace-scoped. Cross-workspace deny is indistinguishable at Vault (existing `VaultIsolationError`).

### Authorization

C2 for Email product mutations; C8 at retrieve; C3 for reads. No C8 bypass. No system actor.

### Auth SMTP

`SmtpHostMail`, `createHostMail`, `MAIL_*` env: **untouched**. Notification adapter must not import `host-mail.smtp.ts`.

### Control plane

Email body is notification text only. No start/stop/approve trades.

### Recipient

Not a secret; still workspace-scoped; injection-safe.

---

## 15. Error model

Stable codes on adapter `detail` (never raw SMTP banners, never passwords). Mirror Telegram’s classified codes:

| Code                      | Meaning                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `smtp_invalid_request`    | Missing actor, empty recipient, malformed mailbox, missing resolver |
| `smtp_not_configured`     | Vault slot missing / not Connected ciphertext                       |
| `smtp_unauthorized`       | SMTP AUTH rejected (535)                                            |
| `smtp_blocked_host`       | SSRF / private host policy                                          |
| `smtp_tls_required`       | Insecure port/TLS policy                                            |
| `smtp_timeout`            | Bounded timeout                                                     |
| `smtp_network_error`      | Connect/reset                                                       |
| `smtp_tls_failure`        | Certificate / handshake                                             |
| `smtp_recipient_rejected` | 550 / 553 mailbox                                                   |
| `smtp_server_error`       | 4xx/5xx other                                                       |
| `smtp_invalid_response`   | Unexpected transporter result                                       |

Product JSON exposes the stable code (or a mapped user-safe phrase), not the server reply text if it may echo credentials.

---

## 16. Testing strategy

No live SMTP. No live Telegram. Use injected transporter factory / mock `sendMail` / `verify`.

### Adapter

Success send; AUTH failure; timeout; network error; TLS failure; blocked host; recipient rejected; password absent from thrown/logged messages.

### Vault resolver

Retrieve success; missing; C8 denial; wrong workspace; no actor fail-closed.

### Product

Bind → pending not connected; test success → connected; test fail → pending; disconnect → not-connected; password absent from JSON.

### Delivery

Email branch uses production adapter; Telegram regression (in-memory harness still in-memory; production classifier unchanged); Slack/Discord/Teams/Push still reserved skip.

### PC-07

Credentials stored without test → not Connected; successful mocked SMTP → Connected; failed verification → not Connected; truthful last test.

### Security

No password in responses/logs/snapshots; Telegram `chatId` still omitted; Auth host-mail files unchanged.

---

## 17. Live evidence strategy

Later Product Owner act (**not** this package, **not** automated FIV):

1. SMTP `ConnectionRecord` exists in the workspace.
2. Vault holds `Smtp` / `notification` ciphertext (metadata only in evidence).
3. Email recipient is bound (pending then connected).
4. Nest bind is `ProductionSmtpNotificationAdapter`.
5. Operator test reaches real SMTP (accepted DATA).
6. Operator confirms the canonical test message in the mailbox.
7. No secret in git, logs, or API JSON.
8. UI/API report Connected and last test success.

Engineering FIV uses mocks only.

---

## 18. Technical debt delta

```text
TD-048 = UNCHANGED
TD-049 = OPEN (unchanged; not this slice)
TD-050 = OPEN (Email residual reduced after Close; Slack/Discord/Teams/Push remain)
No new debt IDs
No register rewrite in this package
```

After a future Close of this slice, TD-050 is **not** fully resolved.

---

## 19. Exact implementation boundary

**One slice. Do not split.**

Splitting adapter-only vs product-only would recreate the W5-N02 foundation failure: an unusable half-feature (SMTP library with reserved UI, or offered UI with reserved skip). Recipient bind without test would invite fake Connected. `deliver()` without test would leave PC-07 incomplete.

In scope (if later authorized):

1. `EmailConnection` domain + store snapshot field
2. `SmtpCredentialResolver`
3. SMTP host/SSRF guard + TLS/timeout policy
4. `ProductionSmtpNotificationAdapter` + test double
5. `EMAIL_CHANNEL_ADAPTER` Nest bind
6. Catalog: Email `active`
7. `resolveDeliveryRoutes` `emailConnected`
8. `deliver()` Email send branch
9. Service port methods: get/bind/test/disconnect Email
10. `/v1/email/*` product module (pattern: telegram-product)
11. PC-07 views: Email offered; reserved others unchanged; Telegram honesty untouched
12. Web: Email settings page (not reserved detail); Connections remains credential UI
13. Tests listed in §16

---

## 20. Explicit out-of-scope

- Telegram adapter, bind, projections, routes, UI
- Slack, Discord, Teams, Push, webhooks
- Retry / scheduler / metrics runtime
- Unattended system Vault actor / report fan-out plumbing
- Auth `SmtpHostMail` / `MAIL_*` / password-reset
- Vault revoke redesign; Connection Management lifecycle redesign
- Treating Connections `validate()` CONNECTED as Email Connected
- Overloading `workspace_email_notification_anchors` as connection SoT
- Prisma EmailConnection table
- New npm dependency
- Default routing of all types to Email
- Message templates
- Deep-link UX
- Master Plan / Execution Roadmap edits
- Wave 5 COMPLETE
- W5-N30 / V3-N30 / CM-37
- TD-049 / TD-050 closure
- Live SMTP or Telegram during implementation tests
- Control-plane commands in email

---

## 21. Acceptance criteria

### AC-01

Email SMTP credentials are configured through existing Connections catalog + credential endpoints (`SMTP` provider). Email product does not collect passwords.

### AC-02

SMTP credentials are stored/retrieved only via `HoldableSecretType.Smtp` / existing Vault retrieve. C8 and workspace isolation preserved.

### AC-03

Recipient bind is workspace-scoped, authorized (C2), validated, and stored on `EmailConnection` — not in Vault.

### AC-04

Production Nest bind uses `ProductionSmtpNotificationAdapter`, not `SmtpHostMail`, not a reserved adapter.

### AC-05

Authorized operator `POST /v1/email/test` performs adapter `send` (real SMTP when live; mock in tests).

### AC-06

Email reports Connected only after successful SMTP test send. Vault stored + Connections local validate + recipient bind alone are **not** Connected.

### AC-07

`deliver()` Email route uses the production SMTP adapter when Email is connected and routed. Telegram path unchanged.

### AC-08

Telegram production behavior and REM-03 projections remain unchanged.

### AC-09

Slack/Discord/Teams/Push remain reserved-inactive.

### AC-10

No SMTP password in API responses, logs, or persistence outside Vault.

### AC-11

SMTP host security/SSRF controls reject private/metadata/localhost targets.

### AC-12

Auth `SmtpHostMail` files and `MAIL_*` factory are unmodified.

### AC-13

No new npm dependency.

### AC-14

No Prisma migration. Snapshot `email` array only.

### AC-15

Automated tests use mocks/doubles. No live SMTP or Telegram.

---

## 22. Risks

| Risk                                                | Mitigation                        |
| --------------------------------------------------- | --------------------------------- |
| Using ConnectionRecord CONNECTED as Email Connected | Separate `EmailConnection`; AC-06 |
| Merging Auth host mail                              | Import boundary tests; AC-12      |
| SMTP SSRF                                           | Host block list; AC-11            |
| Fake Connected without send                         | Connected only after test send    |
| Breaking Telegram                                   | Isolated Email branch; AC-08      |
| Activating Slack/Push                               | Catalog change Email-only; AC-09  |
| Snapshot hydrate reject missing email               | Default empty array               |
| Header injection in recipient                       | Validation; no CR/LF              |
| Unattended deliver fail-closed                      | Accepted; out of scope            |
| Splitting into unusable s1                          | Single slice (§19)                |
| Inventing W5-N30                                    | Forbidden                         |

---

## 23. Governance gates

```text
1. Product Owner Planning Review of this package     PASS
2. Planning Approval                                 GRANTED
3. Repository Synchronization of approved planning   THIS ACT
4. Implementation Authorization                      NOT GRANTED
5. Implementation                                    NOT STARTED
6. Product Owner Implementation Review
7. Repository Synchronization
8. FIV (mocks only)
9. Product Owner Final Close
10. Final Close Repository Synchronization
```

Live SMTP/mailbox verification is a **later** PO act after Close, analogous to Telegram live verification. It is not a substitute for FIV.

Do not skip gates. Do not implement from this document alone.

---

## 24. STOP condition

```text
PLANNING APPROVAL = PASS
REPOSITORY SYNCHRONIZATION = THIS ACT
IMPLEMENTATION AUTHORIZED = NO
OFFICIAL PACKAGE CREATED = NO
LIVE SMTP CALL = NOT PERFORMED
LIVE TELEGRAM CALL = NOT PERFORMED
SECRETS = NOT ACCESSED
MASTER PLAN = UNCHANGED
EXECUTION ROADMAP = UNCHANGED
WAVE 5 = NOT COMPLETE
```

Do not implement. Do not call SMTP. Do not call Telegram. Do not provision or retrieve credentials. Next gate after this synchronization is **Product Owner review of the synchronized Email planning package**, then Implementation Authorization — not granted.

---

# Conclusion

Repository evidence supports a single coherent production Email SMTP slice on existing Notification Delivery, Vault, Connections, PC-06, and PC-07 patterns. No official package ID. No Master Plan or Execution Roadmap change.

**PLANNING APPROVAL: PASS**

**IMPLEMENTATION: NOT AUTHORIZED**

**STOP**
