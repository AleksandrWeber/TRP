# Production Slack Incoming Webhook — Connect / Test / Status

**Document:** Planning Package — Production Slack Incoming Webhook Operator Connect / Test / Status
**Date:** 2026-09-15
**Label:** Production Slack Incoming Webhook Operator Connect / Test / Status (planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Roadmap:** **V3-N03 · CM-13** (Slack portion of Slack / Discord / Teams package)
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37. Does **not** reopen W5-N03.
**Authority:** Product Owner Planning Package (Planning Review **PASS**; Planning Approval **GRANTED** — this synchronization)
**Owner:** Notification Delivery (product consumed by a new slack-product HTTP adapter / notification-product / web; webhook URL remains Vault + Connections)
**Predecessor:** Production Email SMTP Operator Connect / Test / Status **CLOSED** (`c3e5e05c78ee2d41484e0719ae7c7449944d1292`)
**Planning analysis:** [`next-slice-planning-analysis.md`](./next-slice-planning-analysis.md)

**Baseline:** `c3e5e05c78ee2d41484e0719ae7c7449944d1292` — `docs(wave-5): close email smtp slice`

```text
PLANNING APPROVED
PLANNING REVIEW: PASS
PLANNING APPROVAL: GRANTED
IMPLEMENTATION: NOT AUTHORIZED
Official package ID = NOT CREATED
W5-N03 = CLOSED (consume foundation only)
```

This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

---

## Lifecycle

| State                          | This package             |
| ------------------------------ | ------------------------ |
| **PLANNED**                    | **YES**                  |
| **PLANNING REVIEW**            | **PASS**                 |
| **PLANNING APPROVAL**          | **PASS** (planning only) |
| **REPOSITORY SYNCHRONIZATION** | **THIS ACT**             |
| **IMPLEMENTED**                | **NO**                   |
| **VERIFIED (FIV)**             | **NO**                   |
| **CLOSED**                     | **NO**                   |

Implementation authorization is **not** granted by this package.

---

## 1. Executive summary

Telegram and Email are real production transports. Slack is the next original Wave 5 channel in binding order (**V3-N01 → N02 → N03 → N04**). W5-N03 closed as **foundation only** (durable Slack/Discord/Teams anchors, restart recovery, operational continuity). There is no production Slack webhook adapter, no Slack connection domain, no Slack product REST, and `deliver()` still hard-skips Slack with `channel-reserved`.

This package defines planning for **one coherent production Slack slice**:

```text
Slack webhook credential (Vault + Connections)
+ Slack notification channel bind
+ production HTTPS webhook adapter
+ operator test
+ truthful Connected / Pending / Failed / Disconnected
+ deliver() Slack send branch when connected and routed
```

Existing architecture is sufficient. Webhook URL stays in Vault via a new Connections **SLACK** notification provider. Notification Slack Connected lives on a new `SlackConnection` beside `TelegramConnection` / `EmailConnection` — **not** on `ConnectionRecord.status` and **not** on `workspace_slack_discord_teams_notification_anchors`.

```text
Slice type: production Slack transport + PC-07 product
Minimum production runtime change: REQUIRED
New HTTP routes: REQUIRED (/v1/slack/* parallel to /v1/telegram/* and /v1/email/*)
Prisma migration: NOT REQUIRED
New npm dependency: NOT REQUIRED
Live Slack delivery in automated tests: FORBIDDEN
Live Telegram / SMTP in tests: FORBIDDEN
System Vault principal: FORBIDDEN
Inbound webhook receiver: FORBIDDEN
```

**Credentials stored ≠ Connected.** Vault `SecretState.Connected`, Connections local `validate()`, and webhook URL present in Vault do **not** mean Slack is Connected. Slack becomes Connected only after a successful production HTTPS POST round-trip on the operator test path (Slack returns HTTP 200 with body `ok`, or mocked equivalent in tests). Customer-visible Slack message receipt is a later Product Owner live-verification act, analogous to Telegram and Email.

This slice ships **Slack only**. Discord and Teams remain reserved-inactive. Push remains reserved-inactive.

---

## 2. Baseline

Verified at package writing (read-only):

| Check                | Result                                         |
| -------------------- | ---------------------------------------------- |
| `git rev-parse HEAD` | `c3e5e05c78ee2d41484e0719ae7c7449944d1292`     |
| Latest commit        | `c3e5e05 docs(wave-5): close email smtp slice` |

Product Owner operational baseline (consumed, not re-declared):

```text
W5-N01…W5-N29 = CLOSED (foundations)
REM-01-s1 / REM-01-s2 / REM-02 / REM-03 = CLOSED
Production Telegram Operator Test-Message = CLOSED
Production Email SMTP Operator Connect / Test / Status = CLOSED
V3-N01 = PASS
J3-06 = VERIFIED (Telegram)
Email channel = Connected / Verified
Telegram production = REAL / CUSTOMER-VISIBLE / VERIFIED
Wave 5 = NOT COMPLETE
TD-049 = OPEN
TD-050 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
W5-N03 = CLOSED (foundation consumed, not reopened)
```

This package does **not** reopen W5-N03, W5-N02, closed Email/Telegram slices, or foundation packages. It does **not** complete Wave 5.

---

## 3. Wave 5 alignment

Original objective (Execution Roadmap, unchanged):

> Delivery channels become real transports on the existing catalog and routing product.

Binding order: **V3-N01 → N02 → N03 → N04**. Telegram (N01) and Email (N02) are production-real. This slice is production **Slack (CM-13)** only — the first channel inside V3-N03.

Master Plan: operators connect shipped channels the same way as Telegram, or see them still reserved. After this slice ships, Slack is no longer reserved. Discord, Teams, and Push stay reserved.

W5-N03 remains **CLOSED**. Its durable anchors, restart recovery, and operational continuity artifacts are **consumed**, not reopened or reinterpreted as production webhook I/O.

Telegram, Email, and Slack remain delivery-only. None is a control plane.

---

## 4. Current Slack architecture

### Catalog and routing

`NOTIFICATION_CHANNEL_CATALOG` today:

```text
ACTIVE:    telegram, email
RESERVED:  slack, discord, teams, push
```

`resolveDeliveryRoutes` skips reserved channels with `channel-reserved`. Default preferences enable **telegram only**. Default type routing channels = `['telegram']`.

`NotificationDeliveryService.deliver()` sends Telegram and Email when routed and connected; Slack/Discord/Teams/Push record `skipped / channel-reserved`. `ReservedInactiveChannelAdapter` exists but is **not Nest-bound**.

Ports: `slackChannel: false`. No `SLACK_CHANNEL_ADAPTER` token.

### Product

- PC-07 Telegram: `/v1/telegram/*` + Telegram settings page.
- PC-07 Email: `/v1/email/*` + Email settings page.
- PC-07 Slack: reserved `NotificationChannelDetailView`. Copy: webhooks not collected; send test not offered. Required-field disclosure: `Workspace`, `Webhook`, `Channel` (`notification-channel.view.ts`).
- PC-06: settings / preferences / routing / deliveries. Controllers explicitly do not connect or send tests for reserved channels.
- Web: `/notifications/channels/slack` renders the reserved page.

### Foundation (W5-N03, not a connection SoT)

`WorkspaceSlackDiscordTeamsNotificationAnchor` / `workspace_slack_discord_teams_notification_anchors`: per-notification anchors with optional `recipientIdentifier` (may hold example webhook URL in tests), `deliveryState = 'anchor-recorded'`. W5-N03-a inventory forbids treating this as Slack Connected.

Combined Slack/Discord/Teams restart recovery and operational continuity exist on notification-delivery owner. They do **not** establish webhook transport.

### Connections / Vault (gaps)

| Artifact                                 | State today                                             |
| ---------------------------------------- | ------------------------------------------------------- |
| Connections catalog SLACK                | **MISSING**                                             |
| `HoldableSecretType` for Slack webhook   | **MISSING** (only Telegram, Smtp, exchange, OpenRouter) |
| Vault field validation for webhook URL   | **MISSING**                                             |
| `vaultSecretTypeForProvider('SLACK')`    | **MISSING**                                             |
| `defaultPurposeForType('slack-webhook')` | Must map to `SecretPurpose.Notification`                |
| Production webhook adapter               | **MISSING**                                             |
| Slack connection domain                  | **MISSING**                                             |

Connection Management CONNECTED for a future SLACK provider would mean “local credential slot looks stored.” It is **not** PC-07 Slack Connected and must not be reused as such.

---

## 5. Slack incoming webhook architecture

### Transport model

Slack Incoming Webhooks are **operator-supplied HTTPS URLs** whose path contains the secret. Canonical form:

```text
https://hooks.slack.com/services/<team-id>/<hook-id>/<token>
```

Legacy OAuth-generated URLs may omit `/services/`:

```text
https://hooks.slack.com/<team-id>/<hook-id>/<token>
```

The angle-bracket segments are documentation placeholders only. They are **not** live webhook credentials and must never be replaced with real workspace values in repository artifacts.

Send model: **HTTPS POST** only, `Content-Type: application/json`, body `{"text":"..."}`. Success is typically HTTP **200** with response body **`ok`**. Slack documents non-200 and error JSON for invalid/expired webhooks.

This is **outbound-only**. There is no inbound receiver, no `setWebhook`, no Slack Events API, no bot token OAuth in this slice.

### Required notification adapter

New class on notification-delivery, parallel to `ProductionTelegramBotApiAdapter` and `ProductionSmtpNotificationAdapter`:

```text
ProductionSlackWebhookNotificationAdapter
  implements NotificationChannelPort
  channelId = 'slack'
  active = true
```

Responsibilities:

1. **Operator test / notification send** (`send`) — HTTPS POST JSON to Vault-retrieved webhook URL.
2. **Structured result** — `{ ok: true }` or `{ ok: false; detail: stable_code }`.
3. **Retrieve-at-send** — webhook URL from Vault via `SlackWebhookCredentialResolver` (pattern: `TelegramBotTokenResolver` / `SmtpCredentialResolver`).
4. **No URL logging** — log workspace, operation, duration, stable error code only.
5. **No URL in API responses** — product may expose `credentialsStored: boolean`, never the webhook URL or path secret.

**Connected is defined by successful `send` on the operator test path**, not by credential storage alone.

### Transport rules

| Rule           | Requirement                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| Method         | POST only                                                                                |
| Scheme         | HTTPS only (`https:`)                                                                    |
| Host           | Exact allowlist: `hooks.slack.com` only                                                  |
| Path           | Must match Slack incoming webhook path pattern (see §7)                                  |
| Body           | JSON `{"text": string}`; bounded length (4096 chars, same order as Telegram message cap) |
| Headers        | `Content-Type: application/json`                                                         |
| Retrieve       | At send/test time via resolver; no URL cache across requests                             |
| Timeout        | Bounded (10s, same order as Telegram HTTP / SMTP)                                        |
| Redirects      | `redirect: 'error'` — reject redirects                                                   |
| DNS resolution | **Not performed** at validation (same documented limit as existing SSRF helper)          |
| Logging        | Workspace, operation, duration, stable error code; redact URL if present in errors       |

---

## 6. Vault integration

### New holdable secret type

Add to `HoldableSecretType`:

```text
SlackWebhook: 'slack-webhook'
```

Classification: customer secret, `SecretPurpose.Notification` (extend `defaultPurposeForType` and `secret-validation.ts`).

### Required fields

Single field stored in Vault payload:

```text
webhookUrl: string   // full https://hooks.slack.com/... URL; treated as secret
```

Validation at **store** and **retrieve-before-send** (defense in depth):

| Rule             | Requirement                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Non-empty        | Required                                                                                     |
| Parseable URL    | Required                                                                                     |
| Scheme           | `https:` only                                                                                |
| Host             | Exactly `hooks.slack.com` (case-insensitive)                                                 |
| Path             | Matches `/services/{T}/{B}/{secret}` or legacy `/{T}/{B}/{secret}` with non-empty segments   |
| Blocked hosts    | Reject localhost, private IP literals, metadata hostnames (via existing `hostnameIsBlocked`) |
| Userinfo         | Reject URLs with embedded credentials (`https://user:pass@hooks.slack.com/...`)              |
| Query / fragment | Reject non-empty query strings and fragments (webhook secret must be path-only)              |
| Length           | Bounded (2048 chars max for full URL)                                                        |

Failed validation → reject store/retrieve; adapter returns stable `slack_webhook_invalid_request` or `slack_webhook_blocked_url`.

### Retrieve contract

Reuse existing Vault retrieve pattern:

```text
actorWorkspaceId = authenticated userId
actorRole        = authenticated role
workspaceId      = X-Workspace-Id
type             = slack-webhook
purpose          = notification (default)
```

Missing actor → fail closed (`slack_webhook_invalid_request`), same as Telegram and Email.

Do **not**: second secret store; system principal; C8 bypass; URL cache; purpose/type invention; retrieve in views; echo webhook URL in product JSON.

Vault `SecretState.Connected` remains “ciphertext stored.” It does **not** flip Slack product Connected.

---

## 7. SSRF / security model

This slice accepts an **operator-supplied outbound URL** (unlike Telegram’s fixed `api.telegram.org`). Security is therefore **stricter than Telegram** and **different from SMTP host blocking**.

### Design principle

The webhook URL is validated **before Vault storage** and **again immediately before outbound fetch**. The adapter never performs fetch to a URL supplied by the HTTP client on `deliver()` or test — only to a Vault-retrieved URL that passes the same guard.

### HTTPS-only

Reject `http:`, `file:`, `ftp:`, and any non-HTTPS scheme at validation and before fetch.

### Slack host allowlist / pinning

Allow **exactly one hostname**:

```text
hooks.slack.com
```

Use existing `validateOutboundSsrfTarget(url, ['hooks.slack.com'])` plus additional path-pattern checks. Do **not** allow:

- Arbitrary subdomains of slack.com (`evil.slack.com`, `hooks.evil.com`)
- `slack.com`, `api.slack.com`, `hooks.slack.services`, typosquat hosts
- IP-literal hostnames even if they somehow resolve to Slack

### Path pattern (incoming webhook shape)

After host allowlist passes, require path matching one of:

```text
/services/{teamId}/{channelId}/{token}
/{teamId}/{channelId}/{token}          // legacy OAuth form
```

Where each segment is non-empty and uses Slack-documented token charset (alphanumeric plus `_`, `-`, `/` in token segment only as Slack allows). Reject:

- `/services/` with missing segments
- Path traversal (`..`)
- Double-encoded secrets in query string (queries forbidden entirely)

### Blocked destinations (existing primitives)

Apply existing `hostnameIsBlocked` checks to the URL hostname. Reject:

- `localhost`, `127.0.0.1`, `::1`
- RFC1918, link-local, metadata (`169.254.169.254`, `metadata.google.internal`)
- `.localhost` suffix hosts

Because hostname is pinned to `hooks.slack.com`, literal-IP hostname bypass is unlikely; still fail closed if hostname is an IP.

### Redirect handling

Outbound fetch must use `redirect: 'error'`. Do not follow redirects to arbitrary hosts. If Slack ever redirects (unusual for webhooks), treat as transport failure (`slack_webhook_redirect_rejected`).

### DNS rebinding

**Accepted planning limitation (same class as existing SSRF helper):** validation is syntactic; no live DNS resolution. Mitigation: hostname pinned to `hooks.slack.com` only; no operator-supplied host at send time; URL stored only after validation; re-validate immediately before fetch. Document in security review; do not claim DNS-rebind immunity.

### Timeout

10s bounded request timeout (configurable constant, default 10_000 ms). Abort → `slack_webhook_timeout`.

### Response handling

| Condition                      | Classification                                                      |
| ------------------------------ | ------------------------------------------------------------------- |
| HTTP 200 + body `ok` (trimmed) | Success                                                             |
| HTTP 200 + other body          | `slack_webhook_invalid_response` (log status only, not body secret) |
| HTTP 404 / 410                 | `slack_webhook_not_found` (expired/removed webhook)                 |
| HTTP 429                       | `slack_webhook_rate_limited`                                        |
| HTTP 5xx                       | `slack_webhook_server_error`                                        |
| Network / TLS failure          | `slack_webhook_network_error` / `slack_webhook_tls_failure`         |
| SSRF guard failure             | `slack_webhook_blocked_url`                                         |

Do not log response bodies if they might echo secrets. Slack success body is the literal `ok`.

### Logging policy

Log: workspaceId (if policy allows), channelId=`slack`, operation, durationMs, stable error code, HTTP status class.

Never log: full webhook URL, path token segments, request body containing secrets, Vault ciphertext, redirect targets.

### Control plane

Slack message text is notification content only. No start/stop/approve trades.

---

## 8. Connections integration

### New notification provider

Add to `CONNECTION_PROVIDERS`:

```text
{
  id: 'SLACK',
  displayName: 'Slack Incoming Webhook',
  connectionType: 'NOTIFICATION',
  credentialFields: ['webhookUrl'],
}
```

Extend `connection-vault.ts`:

```text
SLACK: HoldableSecretType.SlackWebhook
```

### Credential storage lifecycle

Follow existing Connections + Vault pattern (same as SMTP / Telegram):

1. Operator creates `ConnectionRecord` with provider `SLACK` via existing Connections API/UI.
2. Operator submits webhook URL via `POST /v1/connections/:id/credentials` (existing credential endpoint).
3. Connections validates field presence locally; Vault validates URL shape + SSRF rules on store.
4. `ConnectionRecord.status` may become CONNECTED on local validate — **ignored by Slack product Connected**.

### Dual ownership (same pattern as Email)

| Layer                                            | Stores                     | Slack Connected?   |
| ------------------------------------------------ | -------------------------- | ------------------ |
| Connections + Vault                              | webhook URL ciphertext     | **No**             |
| `SlackConnection` on notification-delivery store | bind + verification status | **Yes, only this** |

Disconnect on Slack product unbinds notification state. It does **not** revoke Vault or delete `ConnectionRecord` unless operator separately disconnects in Connections (same honesty as Telegram / Email).

---

## 9. Slack connection domain

Follow **TelegramConnection** / **EmailConnection**, not ConnectionRecord, not W5-N03 anchors.

### `SlackConnection` (new domain, same owner)

```text
workspaceId
userId
status: not-connected | pending | connected
boundAt?: string           // when operator bound channel (pending)
verifiedAt?: string         // set only after successful webhook send
connectedAt?: string
lastErrorCode?: string      // stable adapter code from last failed test (optional, no URL)
updatedAt
```

**No separate recipient field.** The Slack channel target is embedded in the webhook URL stored in Vault. Product bind confirms the operator wants Slack notifications active for this workspace user after credentials exist.

### State transitions

| Event                         | From                      | To                                                                    |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------- |
| Bind (Vault webhook present)  | not-connected / connected | **pending** (never connected until test)                              |
| Bind (Vault webhook missing)  | *                         | **not-connected** or remain pending; test will fail closed            |
| Successful operator test send | pending                   | **connected** (clear lastErrorCode)                                   |
| Failed operator test send     | pending / connected       | **pending** (not connected); set lastErrorCode                        |
| Disconnect                    | *                         | **not-connected** (clear bound/verified timestamps and lastErrorCode) |

There is no separate `failed` persisted status enum value — failed test returns to **pending** with error surfaced in diagnostics / last test result, matching Email’s `markEmailSmtpFailed` → `pending` pattern. Product views may display **Failed** as a derived label when `status === 'pending' && lastErrorCode` is set.

### Credentials stored ≠ Connected

| State                              | PC-07 Slack                         |
| ---------------------------------- | ----------------------------------- |
| Webhook in Vault, not bound        | not-connected                       |
| Bound, no successful test          | **pending** — not Connected         |
| Connections `validate()` CONNECTED | ignored by Slack product            |
| Vault SecretState.Connected        | ignored by Slack product            |
| Successful webhook test send       | **connected**                       |
| Failed test                        | pending + last error; not Connected |

Successful Slack test (implementation semantics):

```text
ProductionSlackWebhookNotificationAdapter.send returned { ok: true }
= HTTPS POST completed with HTTP 200 and body 'ok'
  (or test double equivalent)
```

---

## 10. Persistence

### Comparison

| Store                                                | Role today                                                       | Slack Connected SoT?      |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| `workspace_slack_discord_teams_notification_anchors` | W5-N03-b notification anchors; `deliveryState = anchor-recorded` | **No**                    |
| `TelegramConnection` snapshot array                  | Operator Telegram bind + connected chat                          | Pattern to follow         |
| `EmailConnection` snapshot array                     | Operator recipient bind + SMTP verified                          | Pattern to follow         |
| `ConnectionRecord` + Vault                           | Credential slot                                                  | **No** (credentials only) |

### Required persistence

Extend `InMemoryNotificationStore` / `DurableNotificationStore` snapshot with:

```text
slack: SlackConnection[]
```

Same mechanism as `telegram: TelegramConnection[]` and `email: EmailConnection[]`. Hydrate treats missing `slack` as empty (backward compatible).

```text
Prisma migration: NOT REQUIRED
New table: NOT REQUIRED
workspace_slack_discord_teams_notification_anchors: UNCHANGED (not connection SoT)
connection_records: UNCHANGED
Vault tables: UNCHANGED
```

If implementation later proves snapshot persistence insufficient, that requires a **separate** planning act. This package does not authorize a Prisma SlackConnection table.

---

## 11. PC-07 behavior

Slack becomes an **offered** channel (catalog `active`). Discord, Teams, and Push stay reserved.

| Surface               | Behavior                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connect / credentials | Operator creates SLACK `ConnectionRecord` and stores webhook URL via existing Connections credential endpoint. Slack settings page links to Connections; does **not** accept webhook URL in Slack product POST bodies. |
| Bind                  | `POST /v1/slack/bind` — asserts Vault webhook exists; transitions to **pending**.                                                                                                                                      |
| Test                  | `POST /v1/slack/test` with C2 + Vault retrieve C8 inside adapter. Canonical test copy (Telegram/Email test analog).                                                                                                    |
| Status                | `not-connected` / `pending` / `connected`. Connected **only** after successful test send.                                                                                                                              |
| Disconnect            | Slack product disconnect → not-connected. Vault/ConnectionRecord untouched.                                                                                                                                            |
| Catalog card          | Slack `offered: true`, `configurationKind: slack-connection`, transport `webhook` when production adapter bound. Discord/Teams/Push unchanged.                                                                         |
| Honesty               | `liveTransportActivated` true for Slack only when production webhook adapter is bound. `webhookUsed: true` when production adapter active (parallel to Email `smtpUsed`, Telegram `botApiUsed`).                       |

---

## 12. Delivery integration

### `deliver()`

Add a Slack send branch **after** routing, parallel to Telegram and Email:

```text
if route.channelId === 'slack'
  and SlackConnection.status === 'connected'
  and Vault webhook retrievable
  → slackAdapter.send({
      chatId: '',                 // unused for Slack; body carries text
      subject, body, workspaceId,
      actorUserId, actorRole
    })
else if slack not connected
  → skip channel-not-connected
```

Telegram and Email branches **unchanged**. Discord/Teams/Push remain reserved skip.

`resolveDeliveryRoutes` gains `slackConnected` beside `telegramConnected` and `emailConnected`. Slack catalog status becomes `active` so reserved skip no longer applies to Slack.

### Operator test vs unattended fan-out

Operator test: `POST /v1/slack/test` → dedicated `sendTestSlackNotification` that:

- requires authenticated actor (same as Telegram/Email test);
- does **not** depend on preferences enabling Slack (otherwise test is unusable until PC-06 routing is edited);
- records a `DeliveryResult` with a Slack attempt;
- on success, transitions `SlackConnection` to connected.

Do **not** overload Telegram or Email test endpoints.

Unattended report/runtime `deliver()` without actor remains fail-closed at Vault retrieve. **Out of scope** to invent a system principal or plumb report actors.

### Default type routing — explicitly NOT in this slice

**Do not** add Slack to default type routing or default channel enablement.

Rationale (repository evidence):

1. Email slice explicitly left default `typeRouting.channels = ['telegram']` and default `channels.email = false` unchanged (`user-notification-preferences.ts`).
2. Enabling Slack silently for all notification types would change operator expectations and could send alerts to Slack before explicit PC-06 preference configuration.
3. Operator test must work without preference edits; routed `deliver()` to Slack requires explicit operator preference enablement — same contract as Email.
4. Execution Roadmap exit (4) is satisfied incrementally per active transport; silent default activation is not required for this slice.

Enabling Slack for routed alerts remains an **operator preference act** in PC-06, not a silent catalog flip side effect.

---

## 13. API impact

Existing routes **cannot** express Slack bind / webhook test / Slack Connected:

| Existing                        | Why insufficient                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| `/v1/telegram/*`                | Telegram-only                                                            |
| `/v1/email/*`                   | Email-only                                                               |
| `/v1/notification-channels/:id` | GET projections; no connect/test                                         |
| `/v1/connections`               | Credential slot; local validate ≠ webhook I/O; no notification Connected |
| `/v1/notification-preferences`  | Routing only                                                             |

### New routes (required) — parallel to Email

Prefix: `/v1/slack`. Permission: list/status/diagnostics **C3 Projection**; mutating bind/test/disconnect **C2 OwnWorkspace**. Vault retrieve inside adapter still enforces **C8**.

| Method | Endpoint                | Request          | Response                                                    | State transition                                  | Failure behavior                                            |
| ------ | ----------------------- | ---------------- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| GET    | `/v1/slack/connection`  | workspace header | Slack status view (no webhook URL)                          | none                                              | 403 if not workspace member                                 |
| POST   | `/v1/slack/bind`        | empty body       | Slack connection view (**pending** if Vault webhook exists) | → pending                                         | 400 if webhook not configured in Vault                      |
| POST   | `/v1/slack/test`        | empty body       | test view + delivery                                        | pending → connected on success; → pending on fail | 400 if not bound / no webhook; adapter stable error in view |
| POST   | `/v1/slack/disconnect`  | empty            | not-connected view                                          | → not-connected                                   | 403 if unauthorized                                         |
| GET    | `/v1/slack/diagnostics` | workspace header | last Slack delivery + transport honesty + lastErrorCode     | none                                              | no URL exposure                                             |

Security constraints for all endpoints:

- Never accept webhook URL in Slack product POST bodies (credentials only via Connections).
- Never return webhook URL, path token, or Vault fields.
- Actor required on test for C8 retrieve.

PC-07 channel catalog GET responses change **values** for Slack (offered/active) — existing routes, honesty widening only.

---

## 14. UI impact

Follow Email settings pattern (`EmailSettingsPage` / `EmailSettingsView`). Do not redesign unrelated notification UI.

### Required Slack operator UI

| Surface     | Behavior                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Route       | `/notifications/channels/slack` → offered Slack settings page (replace reserved detail-only page) |
| Status      | Show not-connected / pending / connected; derived Failed label when pending + last error          |
| Credentials | Link to Connections to store SLACK webhook URL; do not render URL or secret                       |
| Bind        | Primary action when credentials stored but not bound — calls `POST /v1/slack/bind`                |
| Test        | Enabled when pending or connected; calls `POST /v1/slack/test`                                    |
| Disconnect  | Calls `POST /v1/slack/disconnect`                                                                 |
| Diagnostics | Show transport=`webhook`, `webhookUsed`, last delivery outcome, stable error code                 |
| History     | Link to existing delivery history filtered by channel where supported                             |
| Honesty     | No secret display; no fake Connected without verified test                                        |

Telegram and Email pages unchanged. Reserved Discord/Teams/Push pages unchanged.

---

## 15. Dependency impact

```text
New npm package: NOT REQUIRED
Telegram HTTP client: UNCHANGED
Email SMTP adapter: UNCHANGED
Auth mail factory: UNCHANGED
fetch API: use existing Node fetch with injectable test double
```

---

## 16. Testing strategy

No live Slack. No live Telegram. No live SMTP. Use injected fetch factory / mock HTTP client.

### Security tests

- Reject `http://hooks.slack.com/...`
- Reject `https://evil.com/...`
- Reject `https://hooks.slack.com/` (missing path segments)
- Reject `https://127.0.0.1/...`
- Reject `https://169.254.169.254/...`
- Reject `https://localhost/...`
- Reject `https://hooks.slack.com/services/` incomplete path
- Reject URL with query string or fragment
- Reject URL with embedded userinfo
- Assert webhook URL never appears in API JSON, logs, or delivery history detail fields

### Adapter tests

- Successful POST 200 `ok` → `{ ok: true }`
- HTTP 404 → `slack_webhook_not_found`
- HTTP 429 → `slack_webhook_rate_limited`
- HTTP 500 → `slack_webhook_server_error`
- Timeout / abort → `slack_webhook_timeout`
- TLS / network error → stable network code
- Malformed non-`ok` 200 body → `slack_webhook_invalid_response`
- Missing Vault webhook → `slack_webhook_not_configured`
- Missing actor → `slack_webhook_invalid_request`
- Redirect response → `slack_webhook_redirect_rejected`

### Domain tests

- bind with Vault webhook → pending (not connected)
- successful test → connected; verifiedAt set
- failed test → pending; lastErrorCode set
- disconnect → not-connected; timestamps cleared

### API tests

- Controller spec for connection / bind / test / disconnect / diagnostics
- Authorization: non-member forbidden
- Secret non-disclosure in all views
- Bind fails when Vault empty

### Delivery tests

- Slack branch uses production adapter when connected and routed
- Slack skip when not connected
- Telegram and Email regression unchanged
- Discord/Teams/Push still `channel-reserved`

### PC-07 / catalog tests

- Slack offered/active; Discord/Teams/Push reserved
- `liveTransportActivated` / `webhookUsed` honesty projections
- Credentials stored without test → not Connected

### Regression

- Telegram production projections unchanged
- Email production projections unchanged
- Auth boundary specs unchanged
- Reserved channel adapter semantics preserved for Discord/Teams/Push

---

## 17. Live evidence strategy

Later Product Owner act (**not** this package, **not** automated FIV):

1. SLACK `ConnectionRecord` exists in the workspace.
2. Vault holds `SlackWebhook` / `notification` ciphertext (metadata only in evidence).
3. Slack channel is bound (pending then connected).
4. Nest bind is `ProductionSlackWebhookNotificationAdapter`.
5. Operator test reaches real Slack incoming webhook (HTTP 200 `ok`).
6. Operator confirms the canonical test message in the Slack channel.
7. No webhook URL in git, logs, or API JSON.
8. UI/API report Connected and last test success.

Engineering FIV uses mocks only.

---

## 18. Technical debt

Register: `docs/project/technical-debt.md`. **This package does not close or rewrite any item.**

### TD-049 — Telegram production Bot API

| Field      | Assessment                                                                            |
| ---------- | ------------------------------------------------------------------------------------- |
| Status     | OPEN (Product Owner baseline)                                                         |
| This slice | **Does not address TD-049.** No Telegram changes.                                     |
| Sequencing | TD-049 register text remains stale vs production reality; separate PO governance act. |

### TD-050 — Reserved notification channels

| Field      | Assessment                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status     | OPEN                                                                                                                                              |
| This slice | **Reduces Slack portion of TD-050 residual** when later implemented and closed. Discord, Teams, Push remain reserved.                             |
| Closure    | **Does not close TD-050.** Full ID remains open until all shipped channels are production-real or PO explicitly accepts reserved at Wave 5 close. |
| New debt   | None introduced if SSRF model and honesty rules are implemented as specified.                                                                     |

```text
TD-048 = UNCHANGED
TD-049 = OPEN (unchanged; not this slice)
TD-050 = OPEN (Slack residual reducible after Close; Discord/Teams/Push remain)
No new debt IDs
No register rewrite in this package
```

---

## 19. Exact implementation boundary

**One slice. Do not split.**

Splitting adapter-only vs product-only would recreate the W5-N03 foundation failure mode: a production library with reserved UI, or offered UI with reserved skip. Bind without test would invite fake Connected. `deliver()` without test would leave PC-07 incomplete.

In scope (if later authorized):

1. `HoldableSecretType.SlackWebhook` + Vault validation + `defaultPurposeForType`
2. Connections catalog `SLACK` provider + `vaultSecretTypeForProvider`
3. `SlackConnection` domain + store snapshot field
4. `SlackWebhookCredentialResolver`
5. Slack webhook URL guard (store + send) using existing SSRF primitives + path pattern
6. `ProductionSlackWebhookNotificationAdapter` + test double + HTTP client
7. `SLACK_CHANNEL_ADAPTER` Nest bind
8. Catalog: Slack `active` only
9. `resolveDeliveryRoutes` `slackConnected`
10. `deliver()` Slack send branch
11. Service port methods: get/bind/test/disconnect Slack
12. `/v1/slack/*` product module (pattern: email-product)
13. PC-07 views: Slack offered; Discord/Teams/Push reserved; Telegram/Email honesty untouched
14. Web: Slack settings page; Connections remains credential UI
15. Tests listed in §16

---

## 20. Explicit out-of-scope

- Telegram changes (adapter, bind, projections, routes, UI)
- Email SMTP changes
- Email default routing changes
- Discord production transport
- Teams production transport
- Push production transport
- Inbound webhook receiver
- Slack Events API / bot token OAuth
- `setWebhook`
- Webhook workers / background polling
- Retry runtime
- Scheduler runtime
- Metrics runtime / telemetry runtime
- System Vault actor
- Unattended report fan-out actor plumbing
- Auth `SmtpHostMail` / `MAIL_*`
- Unrelated Prisma redesign
- New notification engine
- Reopening W5-N03 or modifying W5-N03 closed evidence
- Overloading `workspace_slack_discord_teams_notification_anchors` as connection SoT
- Default routing of all types to Slack
- Default `channels.slack = true` for all users
- Master Plan changes
- Execution Roadmap changes
- Wave 5 COMPLETE declaration
- W5-N30 / V3-N30 / CM-37
- TD-049 closure
- TD-050 closure
- Live Slack / Telegram / SMTP during automated engineering tests
- Control-plane commands in Slack messages

---

## 21. Acceptance criteria

### AC-01

Slack is **active** / offered in `NOTIFICATION_CHANNEL_CATALOG`.

### AC-02

Discord, Teams, and Push remain **reserved-inactive**.

### AC-03

Slack incoming webhook URL is configured through existing Connections catalog + credential endpoints (`SLACK` provider). Slack product does not collect webhook URLs in its own POST bodies.

### AC-04

Webhook URL is stored/retrieved only via `HoldableSecretType.SlackWebhook` / existing Vault retrieve. C8 and workspace isolation preserved.

### AC-05

Channel bind is workspace-scoped, authorized (C2), and stored on `SlackConnection` — not in product JSON as a URL.

### AC-06

Production Nest bind uses `ProductionSlackWebhookNotificationAdapter`, not `ReservedInactiveChannelAdapter`.

### AC-07

Authorized operator `POST /v1/slack/test` performs adapter `send` (real HTTPS when live; mock in tests).

### AC-08

Slack reports Connected only after successful webhook test send. Vault stored + Connections local validate + bind alone are **not** Connected.

### AC-09

Failed test does not produce Connected; surfaces stable error without webhook URL leakage.

### AC-10

`deliver()` Slack route uses the production webhook adapter when Slack is connected and explicitly routed. Telegram and Email paths unchanged.

### AC-11

Slack delivery history records truthful delivered / failed / skipped outcomes.

### AC-12

Webhook URL never appears in API responses, logs, delivery history detail, or repository artifacts.

### AC-13

SSRF protections reject non-HTTPS, non-`hooks.slack.com`, private/metadata/localhost targets, malformed paths, redirects, and query/fragment URLs.

### AC-14

Disconnect returns Slack `not-connected`; test unavailable until re-bind; Vault/ConnectionRecord untouched by product disconnect.

### AC-15

Telegram production behavior and REM-03 projections remain unchanged.

### AC-16

Email production behavior remains unchanged.

### AC-17

Default type routing and default channel enablement remain telegram-centric; Slack not silently enabled for all types.

### AC-18

No new npm dependency.

### AC-19

No Prisma migration. Snapshot `slack` array only.

### AC-20

Automated tests use mocks/doubles. No live Slack, Telegram, or SMTP.

---

## 22. Risks

| Risk                                                | Mitigation                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SSRF via operator webhook URL                       | Host pin `hooks.slack.com`; HTTPS-only; path pattern; validate at store + send; redirect disabled; AC-13   |
| DNS rebinding                                       | Document syntactic-only validation; pin hostname; no client-supplied URL at fetch; re-validate before send |
| Webhook URL secrecy                                 | Vault-only storage; never project URL; redact errors; AC-12                                                |
| Fake Connected without send                         | Connected only after test HTTP 200 `ok`; AC-08                                                             |
| Using ConnectionRecord CONNECTED as Slack Connected | Separate `SlackConnection`; AC-08                                                                          |
| Accidental Discord/Teams/Push catalog activation    | Catalog change Slack-only; AC-02                                                                           |
| Accidental default routing activation               | Do not change default preferences; AC-17                                                                   |
| Persistence ambiguity with W5-N03 anchors           | Explicit SoT = `SlackConnection` snapshot; anchors unchanged                                               |
| Slack vendor response semantics (non-`ok` 200)      | Classify as invalid response; do not mark Connected                                                        |
| Rate limits (429)                                   | Stable `slack_webhook_rate_limited`; pending state                                                         |
| Timeout / hung requests                             | 10s abort; stable timeout code                                                                             |
| Regression of Telegram/Email                        | Isolated Slack branch; regression tests; AC-15/AC-16                                                       |
| Scope creep to Discord/Teams                        | Single-channel slice; explicit out-of-scope                                                                |
| Splitting into unusable sub-slices                  | One coherent slice (§19)                                                                                   |
| Inventing W5-N30                                    | Forbidden                                                                                                  |
| Reopening W5-N03                                    | Forbidden; consume foundation only                                                                         |

---

## 23. Dependencies

### Closed foundations (consume, do not reopen)

- Waves 1–4
- W5-N01…W5-N29 (including W5-N03 Slack/Discord/Teams foundation)
- REM-01-s1 / REM-01-s2 / REM-02 / REM-03
- Production Telegram Operator Test-Message
- Production Email SMTP Operator Connect / Test / Status

### Existing architecture (required)

| Concern        | Artifact                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Port           | `NotificationChannelPort`                                                                                   |
| Delivery owner | `NotificationDeliveryService`                                                                               |
| Store          | `DurableNotificationStore` / `InMemoryNotificationStore`                                                    |
| Routing        | `resolveDeliveryRoutes` + PC-06                                                                             |
| Catalog        | `NOTIFICATION_CHANNEL_CATALOG` + PC-07 views                                                                |
| Vault          | `SecretVaultService`, C8 retrieve                                                                           |
| Connections    | `connection-catalog.ts`, credential endpoints                                                               |
| SSRF           | `validateOutboundSsrfTarget`, `hostnameIsBlocked`                                                           |
| Patterns       | `telegram-product`, `email-product`, `ProductionSmtpNotificationAdapter`, `ProductionTelegramBotApiAdapter` |
| Security       | Workspace isolation, PermissionClass C2/C3/C8                                                               |
| Queue/history  | Existing delivery history + durable queue (consume, do not redesign)                                        |

### Prerequisites for implementation (after Planning Approval)

1. Planning Review PASS
2. Planning Approval GRANTED
3. Planning Repository Synchronization
4. Explicit Implementation Authorization from Product Owner
5. Engineering FIV plan uses mocks only

---

## 24. Governance gates

Full lifecycle (no gate may be skipped):

```text
1.  Planning Package creation                        COMPLETE
2.  Product Owner Planning Review                    PASS
3.  Planning Approval                                GRANTED
4.  Planning Repository Synchronization              THIS ACT
5.  Implementation Authorization                     NOT GRANTED
6.  Implementation                                   NOT STARTED
7.  Product Owner Implementation Review              NOT PERFORMED
8.  Repository Synchronization (implementation)      NOT PERFORMED
9.  Product Owner Sync Review                        NOT PERFORMED
10. FIV (mocks only)                                  NOT PERFORMED
11. Product Owner Final Close                         NOT PERFORMED
12. Final Close Repository Synchronization           NOT PERFORMED
13. CLOSED                                            NO
```

Live Slack channel verification is a **later** PO act after Close, analogous to Telegram live verification and Email SMTP live verification. It is not a substitute for FIV.

Do not implement from this document alone.

---

## 25. Implementation exit criteria

When implementation is later authorized, engineering may claim slice-complete only when:

1. All §21 acceptance criteria are evidenced.
2. Automated test suite passes with mocked HTTPS (§16).
3. FIV PASS on synchronized implementation commit (mocks only; no FIV defects).
4. Product Owner Implementation Review PASS.
5. No unauthorized scope expansion into Discord/Teams/Push/runtime engines.
6. Telegram, Email, and reserved channels regression-clean.
7. Master Plan and Execution Roadmap unchanged.

Wave 5 COMPLETE is **not** claimed from this slice.

---

## 26. STOP condition

```text
PLANNING APPROVAL = PASS
REPOSITORY SYNCHRONIZATION = THIS ACT
IMPLEMENTATION AUTHORIZED = NO
OFFICIAL PACKAGE ID CREATED = NO
LIVE SLACK CALL = NOT PERFORMED
LIVE TELEGRAM CALL = NOT PERFORMED
LIVE SMTP CALL = NOT PERFORMED
SECRETS = NOT ACCESSED
W5-N03 = CLOSED (not reopened)
MASTER PLAN = UNCHANGED
EXECUTION ROADMAP = UNCHANGED
WAVE 5 = NOT COMPLETE
```

Do not implement. Do not call Slack webhooks. Do not call Telegram. Do not call SMTP. Do not provision or retrieve credentials. Next gate after this synchronization is **Product Owner review of the synchronized Slack planning package**, then Implementation Authorization — not granted.

---

# Conclusion

Repository evidence supports a single coherent production Slack Incoming Webhook slice on existing Notification Delivery, Vault, Connections, PC-06, PC-07, and Security Platform SSRF patterns. W5-N03 foundation is consumed, not reopened. No official package ID. No Master Plan or Execution Roadmap change.

**PLANNING APPROVAL: PASS**

**IMPLEMENTATION: NOT AUTHORIZED**

**STOP**
