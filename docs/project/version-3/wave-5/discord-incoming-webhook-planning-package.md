# Production Discord Incoming Webhook — Connect / Test / Status

**Document:** Planning Package — Production Discord Incoming Webhook Operator Connect / Test / Status
**Date:** 2026-09-15
**Label:** Production Discord Incoming Webhook Operator Connect / Test / Status (planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Roadmap:** **V3-N03 · CM-14** (Discord portion of Slack / Discord / Teams package)
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37. Does **not** reopen foundation W5-N03.
**Authority:** Product Owner Planning Package (Planning Review **PASS**; Planning Approval **GRANTED** — this synchronization)
**Owner:** Notification Delivery (product consumed by a new discord-product HTTP adapter / notification-product / web; webhook URL remains Vault + Connections)
**Predecessor:** Production Slack Incoming Webhook Operator Connect / Test / Status **CLOSED** (`06cfaea82043ae08e2e0953ddf80b185f3e0cc37`)
**Planning analysis:** Product Owner–authorized Next Slice Planning Analysis after W5-N03 Slack close (Discord = next CM-14)

**Baseline:** `06cfaea82043ae08e2e0953ddf80b185f3e0cc37` — `docs(wave-5): close slack slice`

```text
PLANNING APPROVED
PLANNING REVIEW: PASS
PLANNING APPROVAL: GRANTED
IMPLEMENTATION: NOT AUTHORIZED
FIV: NOT AUTHORIZED
Official package ID = NOT CREATED
Foundation W5-N03 = CLOSED (consume only)
```

This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

CM-14 is the **Discord portion of V3-N03**. CM-13 Slack is CLOSED. CM-15 Teams is NOT STARTED. V3-N04 / CM-16 Push remains later.

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

Full lifecycle (no gate may be skipped):

```text
Planning Package → Planning Review → Planning Approval
→ Planning Repository Synchronization
→ Implementation
→ PO Review
→ Repository Synchronization
→ FIV
→ PO Final Close
→ Final Repository Synchronization
→ CLOSED
```

Implementation is **not** authorized by creation of this package.

---

## 1. Executive summary

Telegram, Email, and Slack are real production transports. Discord is the next original Wave 5 channel capability inside **V3-N03** after closed **CM-13 Slack**, following binding order **V3-N01 → N02 → N03 → N04** and capability order **CM-13 → CM-14 → CM-15**. Foundation W5-N03 closed as inventory / durable anchors / restart recovery / operational continuity only. There is no production Discord webhook adapter, no Discord connection domain, no Discord product REST, and `deliver()` still hard-skips Discord with `channel-reserved`.

This package defines planning for **one coherent production Discord Incoming Webhook slice**:

```text
Discord webhook credential (Vault + Connections)
+ Discord notification channel bind
+ production HTTPS webhook adapter
+ operator test
+ truthful Connected / Pending / Failed / Disconnected
+ deliver() Discord send branch when connected and routed
```

Existing architecture is sufficient. Webhook URL stays in Vault via a new Connections **DISCORD** notification provider. Notification Discord Connected lives on a new `DiscordConnection` beside `TelegramConnection` / `EmailConnection` / `SlackConnection` — **not** on `ConnectionRecord.status` and **not** on `workspace_slack_discord_teams_notification_anchors`.

```text
Slice type: production Discord Incoming Webhook transport + PC-07 product
Integration model: Discord Incoming Webhook ONLY (not Bot API / Gateway / OAuth)
Minimum production runtime change: REQUIRED
New HTTP routes: REQUIRED (/v1/discord/* parallel to /v1/slack/*)
Prisma migration: NOT REQUIRED
New npm dependency: NOT REQUIRED
Live Discord delivery in automated tests: FORBIDDEN
Live Telegram / SMTP / Slack in tests: FORBIDDEN
System Vault principal: FORBIDDEN
Inbound Discord Events receiver: FORBIDDEN
Discord Bot Token / Gateway / slash commands: FORBIDDEN
```

**Credentials stored ≠ Connected.** Vault `SecretState.Connected`, Connections local `validate()`, and webhook URL present in Vault do **not** mean Discord is Connected. Discord becomes Connected only after a successful production HTTPS POST round-trip on the operator test path (Discord returns HTTP **204 No Content**, or mocked equivalent in tests). Customer-visible Discord message receipt is required for later Product Owner FIV / live verification, analogous to Telegram, Email, and Slack.

This slice ships **Discord only**. Teams and Push remain reserved-inactive. Telegram, Email, and Slack behavior must be preserved unchanged.

---

## 2. Baseline

Verified at package writing (read-only):

| Check                | Result                                     |
| -------------------- | ------------------------------------------ |
| `git rev-parse HEAD` | `06cfaea82043ae08e2e0953ddf80b185f3e0cc37` |
| Latest commit        | `06cfaea docs(wave-5): close slack slice`  |
| HEAD == origin/main  | **YES**                                    |

Product Owner operational baseline (consumed, not re-declared):

```text
W5-N01…W5-N29 = CLOSED (foundations)
REM-01-s1 / REM-01-s2 / REM-02 / REM-03 = CLOSED
Production Telegram Operator Test-Message = CLOSED
Production Email SMTP Operator Connect / Test / Status = CLOSED
Production Slack Incoming Webhook Operator Connect / Test / Status = CLOSED
V3-N01 = PASS
V3-N02 Email production = CLOSED
V3-N03 · CM-13 Slack production = CLOSED
V3-N03 · CM-14 Discord = THIS PLANNING PACKAGE
V3-N03 · CM-15 Teams = NOT STARTED
V3-N04 / CM-16 Push = LATER
Wave 5 = NOT COMPLETE
TD-049 = OPEN
TD-050 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
Foundation W5-N03 = CLOSED (consumed, not reopened)
```

This package does **not** reopen foundation W5-N03, closed Telegram/Email/Slack production slices, or other foundation packages. It does **not** complete Wave 5.

Known working-tree leftovers (must remain untouched by this planning act):

```text
 M docs/project/version-3/wave-5/wave-5-progress.md
?? apps/api/src/modules/notification-delivery/production-telegram-operator-test-message.spec.ts
?? docs/project/version-3/wave-5/database-startup-blocker-analysis.md
?? docs/project/version-3/wave-5/next-package-planning-proposal.md
?? docs/project/version-3/wave-5/next-slice-planning-analysis.md
?? docs/project/version-3/wave-5/telegram-vault-credential-provisioning-analysis.md
```

---

## 3. Wave 5 alignment

Original objective (Execution Roadmap, unchanged):

> Delivery channels become real transports on the existing catalog and routing product.

Binding order: **V3-N01 → N02 → N03 → N04**.

| Capability                 | State                          |
| -------------------------- | ------------------------------ |
| V3-N01 · CM-11 Telegram    | Production CLOSED              |
| V3-N02 · CM-12 Email       | Production CLOSED              |
| V3-N03 · CM-13 Slack       | Production CLOSED              |
| **V3-N03 · CM-14 Discord** | **This planning package**      |
| V3-N03 · CM-15 Teams       | Not started — remains reserved |
| V3-N04 · CM-16 Push        | Later — remains reserved       |

Authorizing sources for CM-14 (unchanged files):

- `docs/project/version-3/v3-execution-roadmap.md` — Wave 5 order; V3-N03 = Slack / Discord / Teams (CM-13, CM-14, CM-15)
- `docs/project/version-3/v3-capability-inventory.md` — CM-14 Discord
- `docs/project/version-3/v3-readiness-dashboard.md` — CM-14 Discord
- `docs/project/version-3/wave-5/wave-5-planning-summary.md` — N01 → N02 → N03 → N04; do not skip
- `docs/project/version-3/wave-5/slack-incoming-webhook-planning-package.md` — Slack = first channel inside V3-N03
- Product Owner Next Slice Planning Analysis after Slack close — Discord recommended next

Master Plan: operators connect shipped channels the same way as Telegram, or see them still reserved. After this slice ships (implementation later), Discord is no longer reserved. Teams and Push stay reserved.

Foundation W5-N03 remains **CLOSED**. Its durable anchors, restart recovery, and operational continuity artifacts are **consumed**, not reopened or reinterpreted as production webhook I/O.

Telegram, Email, Slack, and Discord remain delivery-only. None is a control plane.

---

## 4. Current Discord architecture

### Catalog and routing

`NOTIFICATION_CHANNEL_CATALOG` today (`notification-channel.ts`):

```text
ACTIVE:    telegram, email, slack
RESERVED:  discord, teams, push
```

`resolveDeliveryRoutes` skips reserved channels with `channel-reserved`. Default preferences enable **telegram only**. Default type routing channels = `['telegram']`.

`NotificationDeliveryService.deliver()` sends Telegram, Email, and Slack when routed and connected; Discord/Teams/Push record `skipped / channel-reserved`.

Ports: no `DISCORD_CHANNEL_ADAPTER` token. Slack has `SLACK_CHANNEL_ADAPTER` bound to `ProductionSlackWebhookNotificationAdapter`.

### Product

- PC-07 Telegram / Email / Slack: active `/v1/{channel}/*` + settings pages.
- PC-07 Discord: reserved `NotificationChannelDetailView`. Required-field disclosure: `Webhook`, `Channel` (`notification-channel.view.ts`).
- PC-06: settings / preferences / routing / deliveries. Controllers do not connect or send tests for reserved channels.
- Web: `/notifications/channels/discord` renders the reserved detail page (no Discord settings module yet).

### Foundation (W5-N03, not a connection SoT)

`WorkspaceSlackDiscordTeamsNotificationAnchor` / `workspace_slack_discord_teams_notification_anchors`: per-notification anchors; `deliveryState = 'anchor-recorded'`. Must **not** be treated as Discord Connected.

Combined Slack/Discord/Teams restart recovery and operational continuity exist on notification-delivery owner. They do **not** establish Discord webhook transport.

### Connections / Vault (gaps)

| Artifact                                   | State today                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Connections catalog DISCORD                | **MISSING** (SLACK exists)                                                  |
| `HoldableSecretType` for Discord webhook   | **MISSING** (SlackWebhook exists; no Discord type)                          |
| Vault field validation for Discord URL     | **MISSING**                                                                 |
| `vaultSecretTypeForProvider('DISCORD')`    | **MISSING**                                                                 |
| `defaultPurposeForType('discord-webhook')` | Must map to `SecretPurpose.Notification`                                    |
| Production Discord webhook adapter         | **MISSING**                                                                 |
| Discord connection domain                  | **MISSING**                                                                 |
| Discord URL SSRF guard                     | **MISSING** (Slack guard exists; Discord requires its own host/path policy) |

Connection Management CONNECTED for a future DISCORD provider would mean “local credential slot looks stored.” It is **not** PC-07 Discord Connected and must not be reused as such.

---

## 5. Discord Incoming Webhook architecture

### Integration model (authorized)

**Discord Incoming Webhook only.**

```text
TRP
 ↓
DiscordConnection
 ↓
Vault (retrieve-at-send)
 ↓
ProductionDiscordWebhookNotificationAdapter
 ↓
HTTPS POST (JSON)
 ↓
Discord Incoming Webhook URL
 ↓
Configured Discord channel
```

### Explicitly NOT authorized

- Discord Bot Token integration
- Discord Gateway
- Discord OAuth bot installation
- Discord Events (inbound)
- Discord slash commands / interactions
- Discord WebSocket
- General Discord bot platform

This is **outbound-only**. There is no inbound receiver.

### Transport model

Discord Incoming Webhooks are **operator-supplied HTTPS URLs** whose path contains the secret token. Canonical form (Discord API docs):

```text
https://discord.com/api/webhooks/<webhook.id>/<webhook.token>
```

Legacy host still commonly issued by Discord UI:

```text
https://discordapp.com/api/webhooks/<webhook.id>/<webhook.token>
```

The angle-bracket segments are documentation placeholders only. They are **not** live webhook credentials and must never be replaced with real workspace values in repository artifacts, tests, docs, or commits.

Send model: **HTTPS POST** only, `Content-Type: application/json`, body `{"content":"..."}` (plain text for this slice). Success **without** `?wait=true` is typically HTTP **204 No Content**. Discord documents non-2xx and rate-limit responses for invalid/expired webhooks.

Do **not** append `?wait=true` or other query parameters (query strings are rejected by the URL guard). Therefore production success classification is **HTTP 204**, not a JSON message body.

### Required notification adapter

New class on notification-delivery, parallel to `ProductionSlackWebhookNotificationAdapter`:

```text
ProductionDiscordWebhookNotificationAdapter
  implements NotificationChannelPort
  channelId = 'discord'
  active = true
```

Responsibilities:

1. **Operator test / notification send** (`send`) — HTTPS POST JSON to Vault-retrieved webhook URL.
2. **Structured result** — `{ ok: true }` or `{ ok: false; detail: stable_code }`.
3. **Retrieve-at-send** — webhook URL from Vault via `DiscordWebhookCredentialResolver` (pattern: `SlackWebhookCredentialResolver`).
4. **No URL logging** — log workspace, operation, duration, stable error code only.
5. **No URL in API responses** — product may expose `credentialsStored: boolean`, never the webhook URL or token path segment.

**Connected is defined by successful `send` on the operator test path**, not by credential storage alone.

### Transport rules

| Rule           | Requirement                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| Method         | POST only                                                                                     |
| Scheme         | HTTPS only (`https:`)                                                                         |
| Host           | Exact allowlist: `discord.com` **or** `discordapp.com` only                                   |
| Path           | Must match `/api/webhooks/{snowflake}/{token}` (see §7)                                       |
| Body           | JSON `{"content": string}`; bounded length (**2000** chars — Discord content limit)           |
| Headers        | `Content-Type: application/json`                                                              |
| Retrieve       | At send/test time via resolver; no URL cache across requests                                  |
| Timeout        | Bounded (**10s**, same as Slack `SLACK_WEBHOOK_TIMEOUT_MS = 10_000`)                          |
| Redirects      | `redirect: 'error'` — reject redirects                                                        |
| DNS resolution | **Not performed** at validation (same documented limit as existing SSRF helper / Slack guard) |
| Logging        | Workspace, operation, duration, stable error code; redact URL if present in errors            |

---

## 6. Vault integration

### New holdable secret type

Add to `HoldableSecretType`:

```text
DiscordWebhook: 'discord-webhook'
```

Classification: customer secret, `SecretPurpose.Notification` (extend `defaultPurposeForType` and `secret-validation.ts`).

### Required fields

Single field stored in Vault payload:

```text
webhookUrl: string   // full https://discord.com/api/webhooks/... URL; treated as secret
```

Validation at **store** and **retrieve-before-send** (defense in depth):

| Rule             | Requirement                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Non-empty        | Required                                                                                            |
| Parseable URL    | Required                                                                                            |
| Scheme           | `https:` only                                                                                       |
| Host             | Exactly `discord.com` or `discordapp.com` (case-insensitive)                                        |
| Path             | Matches `/api/webhooks/{snowflake}/{token}` with non-empty segments                                 |
| Blocked hosts    | Reject localhost, private IP literals, metadata hostnames (via existing `hostnameIsBlocked` / SSRF) |
| Userinfo         | Reject URLs with embedded credentials                                                               |
| Query / fragment | Reject non-empty query strings and fragments (including `wait=true`, `thread_id`)                   |
| Length           | Bounded (2048 chars max for full URL — same order as Slack)                                         |

Failed validation → reject store/retrieve; adapter returns stable `discord_webhook_invalid_request` or `discord_webhook_blocked_url`.

### Retrieve contract

Reuse existing Vault retrieve pattern:

```text
actorWorkspaceId = authenticated userId
actorRole        = authenticated role
workspaceId      = X-Workspace-Id
type             = discord-webhook
purpose          = notification (default)
```

Missing actor → fail closed (`discord_webhook_invalid_request`), same as Telegram / Email / Slack.

Do **not**: second secret store; system principal; C8 bypass; URL cache; purpose/type invention; retrieve in views; echo webhook URL in product JSON.

Vault `SecretState.Connected` remains “ciphertext stored.” It does **not** flip Discord product Connected.

---

## 7. SSRF / security model

This slice accepts an **operator-supplied outbound URL** (same risk class as Slack). Security must be **stricter than Telegram** and aligned with the Slack webhook guard pattern.

### Design principle

The webhook URL is validated **before Vault storage** and **again immediately before outbound fetch**. The adapter never performs fetch to a URL supplied by the HTTP client on `deliver()` or test — only to a Vault-retrieved URL that passes the same guard.

### HTTPS-only

Reject `http:`, `file:`, `ftp:`, and any non-HTTPS scheme at validation and before fetch.

### Discord host allowlist / pinning

Allow **exactly these hostnames**:

```text
discord.com
discordapp.com
```

Use existing `validateOutboundSsrfTarget(url, ['discord.com', 'discordapp.com'])` plus additional path-pattern checks. Do **not** allow:

- Arbitrary subdomains (`evil.discord.com`, `ptb.discord.com`, `canary.discord.com`, `cdn.discordapp.com`)
- `discord.gg`, `discordapp.net`, typosquat hosts
- IP-literal hostnames even if they somehow resolve to Discord

Rationale for two hosts: Discord documents `discord.com`; Discord UI historically issues `discordapp.com` webhook URLs. Both are Discord-owned webhook fronts. With `redirect: 'error'`, allowing both avoids forcing redirects that would otherwise fail closed.

### Path pattern (incoming webhook shape)

After host allowlist passes, require path matching:

```text
/api/webhooks/{webhookId}/{webhookToken}
```

Where:

- `webhookId` is a Discord snowflake: one or more digits `[0-9]+`
- `webhookToken` is a non-empty secret segment using Discord-safe charset `[A-Za-z0-9_-]+` (bounded length)

Reject:

- Missing `/api/webhooks/` prefix
- Missing id or token segments
- Extra path segments beyond id/token
- Path traversal (`..`)
- Query string / fragment (forbidden entirely — including `?wait=true`)
- Userinfo

### Blocked destinations (existing primitives)

Apply existing `hostnameIsBlocked` / SSRF checks. Reject:

- `localhost`, `127.0.0.1`, `::1`
- RFC1918, link-local, metadata (`169.254.169.254`, `metadata.google.internal`)
- `.localhost` suffix hosts

Because hostname is pinned to Discord allowlist hosts, literal-IP hostname bypass is unlikely; still fail closed if hostname is an IP.

### Redirect handling

Outbound fetch must use `redirect: 'error'`. Do not follow redirects to arbitrary hosts. If Discord redirects (e.g. host alias edge cases), treat as transport failure (`discord_webhook_redirect_rejected`).

### DNS rebinding

**Accepted planning limitation (same class as Slack / existing SSRF helper):** validation is syntactic; no live DNS resolution. Mitigation: hostname pinned to Discord allowlist only; no operator-supplied host at send time; URL stored only after validation; re-validate immediately before fetch. Document in security review; do not claim DNS-rebind immunity.

### Timeout

**10_000 ms** bounded request timeout (same as Slack). Abort → `discord_webhook_timeout`.

### Response handling

| Condition                | Classification                                                       |
| ------------------------ | -------------------------------------------------------------------- |
| HTTP **204** No Content  | Success                                                              |
| HTTP 200 with empty body | Treat as **invalid** for this slice (expect 204 without `wait`)      |
| HTTP 200 with JSON body  | `discord_webhook_invalid_response` (do not parse as Connected proof) |
| HTTP 401 / 403 / 404     | `discord_webhook_not_found` / unauthorized / expired webhook         |
| HTTP 429                 | `discord_webhook_rate_limited`                                       |
| HTTP 5xx                 | `discord_webhook_server_error`                                       |
| Network / TLS failure    | `discord_webhook_network_error` / `discord_webhook_tls_failure`      |
| SSRF guard failure       | `discord_webhook_blocked_url`                                        |
| Redirect attempted       | `discord_webhook_redirect_rejected`                                  |

Do not log response bodies if they might echo secrets.

### Logging policy

Log: workspaceId (if policy allows), channelId=`discord`, operation, durationMs, stable error code, HTTP status class.

Never log: full webhook URL, path token segments, request body containing secrets, Vault ciphertext, redirect targets.

### Control plane

Discord message text is notification content only. No start/stop/approve trades. No Discord interactions.

---

## 8. Connections integration

### New notification provider

Add to `CONNECTION_PROVIDERS`:

```text
{
  id: 'DISCORD',
  displayName: 'Discord Incoming Webhook',
  connectionType: 'NOTIFICATION',
  credentialFields: ['webhookUrl'],
}
```

Extend `connection-vault.ts`:

```text
DISCORD: HoldableSecretType.DiscordWebhook
```

### Credential storage lifecycle

Follow existing Connections + Vault pattern (same as Slack / SMTP / Telegram):

1. Operator creates `ConnectionRecord` with provider `DISCORD` via existing Connections API/UI.
2. Operator submits webhook URL via `POST /v1/connections/:id/credentials` (existing credential endpoint).
3. Connections validates field presence locally; Vault validates URL shape + SSRF rules on store.
4. `ConnectionRecord.status` may become CONNECTED on local validate — **ignored by Discord product Connected**.

### Dual ownership (same pattern as Slack)

| Layer                                              | Stores                     | Discord Connected? |
| -------------------------------------------------- | -------------------------- | ------------------ |
| Connections + Vault                                | webhook URL ciphertext     | **No**             |
| `DiscordConnection` on notification-delivery store | bind + verification status | **Yes, only this** |

Disconnect on Discord product unbinds notification state. It does **not** revoke Vault or delete `ConnectionRecord` unless operator separately disconnects in Connections (same honesty as Telegram / Email / Slack).

---

## 9. Discord connection domain

Follow **SlackConnection** / **EmailConnection** / **TelegramConnection**, not ConnectionRecord, not W5-N03 anchors.

### `DiscordConnection` (new domain, same owner)

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

**No separate recipient field.** The Discord channel target is embedded in the webhook URL stored in Vault. Product bind confirms the operator wants Discord notifications active for this workspace user after credentials exist.

Product views may display **Verified** as a derived label when `status === 'connected'` and `verifiedAt` is set (same honesty as Slack Connected after successful test).

### State transitions

| Event                         | From                      | To                                                                    |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------- |
| Bind (Vault webhook present)  | not-connected / connected | **pending** (never connected until test)                              |
| Bind (Vault webhook missing)  | *                         | **not-connected** or remain pending; test will fail closed            |
| Successful operator test send | pending                   | **connected** (clear lastErrorCode; set verifiedAt / connectedAt)     |
| Failed operator test send     | pending / connected       | **pending** (not connected); set lastErrorCode                        |
| Disconnect                    | *                         | **not-connected** (clear bound/verified timestamps and lastErrorCode) |

There is no separate `failed` persisted status enum value — failed test returns to **pending** with error surfaced in diagnostics / last test result, matching Slack’s `markSlackWebhookFailed` → `pending` pattern. Product views may display **Failed** as a derived label when `status === 'pending' && lastErrorCode` is set.

### Credentials stored ≠ Connected / Verified

| State                              | PC-07 Discord                       |
| ---------------------------------- | ----------------------------------- |
| Webhook in Vault, not bound        | not-connected                       |
| Bound, no successful test          | **pending** — not Connected         |
| Connections `validate()` CONNECTED | ignored by Discord product          |
| Vault SecretState.Connected        | ignored by Discord product          |
| Successful webhook test send       | **connected** / Verified            |
| Failed test                        | pending + last error; not Connected |

Successful Discord test (implementation semantics):

```text
ProductionDiscordWebhookNotificationAdapter.send returned { ok: true }
= HTTPS POST completed with HTTP 204 No Content
  (or test double equivalent)
```

---

## 10. Persistence

### Comparison

| Store                                                                        | Role today                                                       | Discord Connected SoT?    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| `workspace_slack_discord_teams_notification_anchors`                         | W5-N03-b notification anchors; `deliveryState = anchor-recorded` | **No**                    |
| `TelegramConnection` / `EmailConnection` / `SlackConnection` snapshot arrays | Operator bind + verification                                     | Pattern to follow         |
| `ConnectionRecord` + Vault                                                   | Credential slot                                                  | **No** (credentials only) |

### Required persistence

Extend `InMemoryNotificationStore` / `DurableNotificationStore` snapshot with:

```text
discord: DiscordConnection[]
```

Same mechanism as `slack: SlackConnection[]`. Hydrate treats missing `discord` as empty (backward compatible).

```text
Prisma migration: NOT REQUIRED
New table: NOT REQUIRED
workspace_slack_discord_teams_notification_anchors: UNCHANGED (not connection SoT)
connection_records: UNCHANGED
Vault tables: UNCHANGED
```

**Why no migration:** Telegram, Email, and Slack production connections already persist via the durable notification owner snapshot (`telegram` / `email` / `slack` arrays). Discord follows the same snapshot pattern. W5-N03 anchors are explicitly not a connection SoT.

If implementation later proves snapshot persistence insufficient, that requires a **separate** planning act. This package does not authorize a Prisma DiscordConnection table.

---

## 11. PC-07 behavior

Discord becomes an **offered** channel (catalog `active`) **only at implementation time after Planning Approval**. Teams and Push stay reserved.

| Surface               | Behavior                                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connect / credentials | Operator creates DISCORD `ConnectionRecord` and stores webhook URL via existing Connections credential endpoint. Discord settings page links to Connections; does **not** accept webhook URL in Discord product POST bodies. |
| Bind                  | `POST /v1/discord/bind` — asserts Vault webhook exists; transitions to **pending**.                                                                                                                                          |
| Test                  | `POST /v1/discord/test` with C2 + Vault retrieve C8 inside adapter. Canonical test copy (Telegram/Email/Slack test analog).                                                                                                  |
| Status                | `not-connected` / `pending` / `connected`. Connected **only** after successful test send.                                                                                                                                    |
| Disconnect            | Discord product disconnect → not-connected. Vault/ConnectionRecord untouched.                                                                                                                                                |
| Catalog card          | Discord `offered: true`, `configurationKind: discord-connection`, transport `webhook` when production adapter bound. Teams/Push unchanged. Telegram/Email/Slack honesty untouched.                                           |
| Honesty               | `liveTransportActivated` true for Discord only when production webhook adapter is bound. `webhookUsed: true` when production adapter active (parallel to Slack).                                                             |

This planning package itself does **not** activate Discord in catalog code.

---

## 12. Delivery integration

### `deliver()`

Add a Discord send branch **after** routing, parallel to Slack:

```text
if route.channelId === 'discord'
  and DiscordConnection.status === 'connected'
  and Vault webhook retrievable
  → discordAdapter.send({
      chatId: '',                 // unused for Discord; body carries content
      subject, body, workspaceId,
      actorUserId, actorRole
    })
else if discord not connected
  → skip channel-not-connected
```

Telegram, Email, and Slack branches **unchanged**. Teams/Push remain reserved skip.

`resolveDeliveryRoutes` gains `discordConnected` beside `telegramConnected` / `emailConnected` / `slackConnected`. Discord catalog status becomes `active` so reserved skip no longer applies to Discord.

Do **not** silently redirect Discord notifications to Telegram, Email, or Slack.

### Operator test vs unattended fan-out

Operator test: `POST /v1/discord/test` → dedicated `sendTestDiscordNotification` that:

- requires authenticated actor (same as Slack test);
- does **not** depend on preferences enabling Discord (otherwise test is unusable until PC-06 routing is edited);
- records a `DeliveryResult` with a Discord attempt;
- on success, transitions `DiscordConnection` to connected.

Do **not** overload Telegram / Email / Slack test endpoints.

Unattended report/runtime `deliver()` without actor remains fail-closed at Vault retrieve. **Out of scope** to invent a system principal or plumb report actors.

### Default type routing — explicitly NOT in this slice

**Do not** add Discord to default type routing or default channel enablement.

Rationale (repository evidence):

1. Email and Slack slices left default `typeRouting.channels = ['telegram']` and default non-Telegram channel flags unchanged.
2. Enabling Discord silently for all notification types would change operator expectations.
3. Operator test must work without preference edits; routed `deliver()` to Discord requires explicit operator preference enablement — same contract as Email/Slack.
4. Default routing remains Telegram-only.

Enabling Discord for routed alerts remains an **operator preference act** in PC-06, not a silent catalog flip side effect.

### Delivery history

Record truthful Discord attempts with safe metadata only:

```text
channel = discord
outcome = delivered | failed | skipped
transport = webhook
adapterReached = true | false
```

Never store or expose the Discord webhook secret in history, diagnostics, errors, logs, API, UI, tests, or git.

Do not claim `delivered` unless the production adapter completed a successful send (HTTP 204 or mock equivalent).

### Diagnostics

Truthful diagnostics equivalent to Slack:

```text
transport = webhook
webhookUsed = true when production adapter bound
adapterReached = true/false for last attempt
scheduler = false
retries = false
lastErrorCode = stable code or absent
credentialsStored = boolean (never URL)
connection status = not-connected | pending | connected
```

Do not introduce scheduler or retry implementation.

---

## 13. API impact

Existing routes **cannot** express Discord bind / webhook test / Discord Connected:

| Existing                        | Why insufficient                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| `/v1/telegram/*`                | Telegram-only                                                            |
| `/v1/email/*`                   | Email-only                                                               |
| `/v1/slack/*`                   | Slack-only                                                               |
| `/v1/notification-channels/:id` | GET projections; no connect/test                                         |
| `/v1/connections`               | Credential slot; local validate ≠ webhook I/O; no notification Connected |
| `/v1/notification-preferences`  | Routing only                                                             |

### New routes (required) — parallel to Slack

Prefix: `/v1/discord`. Permission: list/status/diagnostics **C3 Projection**; mutating bind/test/disconnect **C2 OwnWorkspace**. Vault retrieve inside adapter still enforces **C8**.

| Method | Endpoint                  | Purpose                       | Request          | Response                                                      | Authorization | Secret handling         | State transition                                  | Failure behavior                                            |
| ------ | ------------------------- | ----------------------------- | ---------------- | ------------------------------------------------------------- | ------------- | ----------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| GET    | `/v1/discord/connection`  | Status projection             | workspace header | Discord status view (no webhook URL)                          | C3 + member   | never return URL        | none                                              | 403 if not workspace member                                 |
| POST   | `/v1/discord/bind`        | Bind after credentials stored | empty body       | Discord connection view (**pending** if Vault webhook exists) | C2 + member   | never accept/return URL | → pending                                         | 400 if webhook not configured in Vault                      |
| POST   | `/v1/discord/test`        | Production webhook test send  | empty body       | test view + delivery                                          | C2 + member   | retrieve-at-send only   | pending → connected on success; → pending on fail | 400 if not bound / no webhook; adapter stable error in view |
| POST   | `/v1/discord/disconnect`  | Unbind Discord product state  | empty            | not-connected view                                            | C2 + member   | none                    | → not-connected                                   | 403 if unauthorized                                         |
| GET    | `/v1/discord/diagnostics` | Honesty + last attempt        | workspace header | last Discord delivery + transport honesty + lastErrorCode     | C3 + member   | no URL exposure         | none                                              | no URL exposure                                             |

Security constraints for all endpoints:

- Never accept webhook URL in Discord product POST bodies (credentials only via Connections).
- Never return webhook URL, path token, or Vault fields.
- Actor required on test for C8 retrieve.

PC-07 channel catalog GET responses change **values** for Discord (offered/active) — existing routes, honesty widening only.

---

## 14. UI impact

Follow Slack settings pattern (`SlackSettingsPage` / `SlackSettingsView`). Do not redesign unrelated notification UI.

### Required Discord operator UI

| Surface     | Behavior                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Route       | `/notifications/channels/discord` → offered Discord settings page (replace reserved detail-only page)      |
| Status      | Show not-connected / pending / connected; derived Failed / Verified labels as appropriate                  |
| Credentials | Link to Connections to store DISCORD webhook URL; do not render URL or secret                              |
| Bind        | Primary action when credentials stored but not bound — calls `POST /v1/discord/bind`                       |
| Test        | Enabled when pending or connected; calls `POST /v1/discord/test`                                           |
| Disconnect  | Calls `POST /v1/discord/disconnect`                                                                        |
| Diagnostics | Show transport=`webhook`, `webhookUsed`, last delivery outcome, stable error code; scheduler/retries false |
| History     | Link to existing delivery history filtered by channel where supported                                      |
| Honesty     | No secret display; no fake Connected without verified test                                                 |

Telegram, Email, and Slack pages unchanged. Reserved Teams/Push pages unchanged.

---

## 15. Dependency impact

```text
New npm package: NOT REQUIRED
Telegram Bot API adapter: UNCHANGED
Email SMTP adapter: UNCHANGED
Slack Incoming Webhook adapter: UNCHANGED
Auth mail factory: UNCHANGED
fetch API: use existing Node fetch with injectable test double
```

---

## 16. Testing strategy

No live Discord. No live Telegram. No live SMTP. No live Slack. Use injected fetch factory / mock HTTP client.

### Domain tests

- Discord channel state machine (`not-connected` / `pending` / `connected`)
- bind with Vault webhook → pending (not connected)
- successful test → connected; verifiedAt set
- failed test → pending; lastErrorCode set
- disconnect → not-connected; timestamps cleared

### Credential / Vault tests

- `HoldableSecretType.DiscordWebhook` store/retrieve
- purpose = notification
- absence handling / missing actor fail-closed
- URL never returned from product views

### Security / SSRF tests

At minimum:

- Accept valid `https://discord.com/api/webhooks/{id}/{token}`
- Accept valid `https://discordapp.com/api/webhooks/{id}/{token}`
- Reject `http://discord.com/...`
- Reject arbitrary host (`https://evil.com/...`)
- Reject `https://ptb.discord.com/...` and other non-allowlisted Discord subdomains
- Reject localhost / `127.0.0.1` / `::1`
- Reject private IP literals
- Reject metadata hosts (`169.254.169.254`, `metadata.google.internal`)
- Reject userinfo
- Reject query (`?wait=true`)
- Reject fragment
- Reject invalid / incomplete path
- Assert redirect: error behavior
- Assert timeout / abort classification
- Assert webhook URL never appears in API JSON, logs, or delivery history detail fields

### Adapter tests (mocked HTTPS)

- Method POST; `Content-Type: application/json`; body `{"content":...}`
- Successful POST **204** → `{ ok: true }`
- HTTP 401/403/404 → not-found / unauthorized class
- HTTP 429 → `discord_webhook_rate_limited`
- HTTP 500 → `discord_webhook_server_error`
- Timeout / abort → `discord_webhook_timeout`
- TLS / network error → stable network code
- Unexpected 200 JSON → `discord_webhook_invalid_response` (not Connected)
- Missing Vault webhook → `discord_webhook_not_configured`
- Missing actor → `discord_webhook_invalid_request`
- Redirect response → `discord_webhook_redirect_rejected`
- Secret non-disclosure in errors/logs

### API tests

- Controller spec for connection / bind / test / disconnect / diagnostics
- Authorization: non-member forbidden
- Secret non-disclosure in all views
- Bind fails when Vault empty
- Invalid credential handling safe responses

### Web tests

- Discord connection UI states
- No secret exposure
- Test action / diagnostics / error state
- Teams/Push still reserved pages

### Delivery / catalog tests

- Discord branch uses production adapter when connected and routed
- Discord skip when not connected
- Telegram / Email / Slack regression unchanged
- Teams/Push still `channel-reserved`
- Discord offered/active; Teams/Push reserved
- Credentials stored without test → not Connected
- Default routing remains telegram-only

### Regression suite

- Relevant Telegram tests
- Relevant Email tests
- Relevant Slack tests
- TypeScript / formatting / `git diff --check`

---

## 17. Production FIV requirements

FIV remains **verification-only** and is **not authorized** by this planning package. When later authorized, FIV must verify:

1. Valid Discord credential provisioned through approved Connections/Vault path (`DISCORD` / `DiscordWebhook`)
2. Discord connection bind (`POST /v1/discord/bind` → pending)
3. Real production `POST /v1/discord/test`
4. Real Discord Incoming Webhook delivery (HTTP 204 path)
5. Customer-visible Discord channel message
6. Connected / Verified state after successful test
7. Delivery history truthful (`channel=discord`, outcome, `transport=webhook`, `adapterReached`)
8. Diagnostics truthful (`scheduler=false`, `retries=false`, no secret)
9. Secret non-disclosure (API / UI / logs / history / errors / git)
10. SSRF / security policy enforcement
11. Telegram regression (Bot API transport + connection semantics + default routing)
12. Email regression (SMTP transport + connection semantics)
13. Slack regression (Incoming Webhook transport + Connected/Verified behavior)
14. Channel catalog: Discord ACTIVE; Teams/Push RESERVED
15. Default routing remains Telegram-only
16. Repository integrity (HEAD sync, no secret commits)

Mock-only automated tests are required for deterministic engineering verification but are **not** sufficient for final FIV PASS. Real Discord customer-visible delivery is required for FIV PASS.

---

## 18. Technical debt

Register: `docs/project/technical-debt.md`. **This package does not close or rewrite any item.**

### TD-049 — Telegram production Bot API

| Field      | Assessment                                                                           |
| ---------- | ------------------------------------------------------------------------------------ |
| Status     | OPEN (Product Owner baseline)                                                        |
| This slice | **Does not address TD-049.** No Telegram changes.                                    |
| Sequencing | TD-049 register text may remain stale vs production reality; separate PO governance. |

### TD-050 — Reserved notification channels

| Field      | Assessment                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status     | OPEN                                                                                                                                                    |
| This slice | **Reduces Discord portion of TD-050 residual** when later implemented and closed. Teams and Push remain reserved.                                       |
| Closure    | **Does not close TD-050.** Full ID remains open until remaining shipped channels are production-real or PO explicitly accepts reserved at Wave 5 close. |
| New debt   | None introduced if SSRF model and honesty rules are implemented as specified.                                                                           |

```text
TD-049 = OPEN (unchanged; not this slice)
TD-050 = OPEN (Discord residual reducible after later Close; Teams/Push remain)
No new debt IDs
No register rewrite in this package
```

---

## 19. Exact implementation boundary

**One slice. Do not split.**

Splitting adapter-only vs product-only would recreate the foundation failure mode: a production library with reserved UI, or offered UI with reserved skip. Bind without test would invite fake Connected. `deliver()` without test would leave PC-07 incomplete.

In scope (if later authorized after Planning Approval + Implementation Authorization):

1. `HoldableSecretType.DiscordWebhook` + Vault validation + `defaultPurposeForType`
2. Connections catalog `DISCORD` provider + `vaultSecretTypeForProvider`
3. `DiscordConnection` domain + store snapshot field
4. `DiscordWebhookCredentialResolver`
5. Discord webhook URL guard (store + send) using existing SSRF primitives + Discord host/path pattern
6. `ProductionDiscordWebhookNotificationAdapter` + test double + HTTP client
7. `DISCORD_CHANNEL_ADAPTER` Nest bind
8. Catalog: Discord `active` only (Teams/Push remain reserved)
9. `resolveDeliveryRoutes` `discordConnected`
10. `deliver()` Discord send branch
11. Service port methods: get/bind/test/disconnect Discord
12. `/v1/discord/*` product module (pattern: slack-product)
13. PC-07 views: Discord offered; Teams/Push reserved; Telegram/Email/Slack honesty untouched
14. Web: Discord settings page; Connections remains credential UI
15. Tests listed in §16

---

## 20. Explicit out-of-scope

```text
Discord Bot API
Discord Gateway
Discord OAuth bot installation
Discord Events
Discord slash commands
Discord interactions
Discord WebSocket
Teams implementation (CM-15)
Push implementation (CM-16 / V3-N04)
retry scheduling
scheduler runtime
metrics
new routing architecture
new Vault architecture
new notification architecture
TD-049 remediation
TD-050 closure as standalone work
Master Plan changes
Execution Roadmap changes
W5-N30
V3-N30
CM-37
Wave 5 completion
```

Also out of scope:

- Telegram / Email / Slack adapter or projection changes
- Default routing / default Discord preference enablement
- Inbound webhook receiver
- System Vault actor / unattended fan-out actor plumbing
- Auth host mail
- Unrelated Prisma redesign / DiscordConnection Prisma table
- Reopening foundation W5-N03 or modifying closed W5-N03 evidence
- Overloading `workspace_slack_discord_teams_notification_anchors` as connection SoT
- Live Discord / Telegram / SMTP / Slack during automated engineering tests
- Control-plane commands in Discord messages
- Embedding real webhook credentials in repository files

---

## 21. Acceptance criteria

### AC-01 — Planning scope

Slice is production Discord Incoming Webhook connect / test / status only (V3-N03 · CM-14). No Bot API / Gateway / OAuth / Events.

### AC-02 — Catalog

Discord is **active** / offered in `NOTIFICATION_CHANNEL_CATALOG` after implementation. Teams and Push remain **reserved-inactive**.

### AC-03 — Credential storage

Discord incoming webhook URL is configured through existing Connections catalog + credential endpoints (`DISCORD` provider). Discord product does not collect webhook URLs in its own POST bodies.

### AC-04 — Vault type

Webhook URL is stored/retrieved only via `HoldableSecretType.DiscordWebhook` / existing Vault retrieve. C8 and workspace isolation preserved.

### AC-05 — Connection / binding

Channel bind is workspace-scoped, authorized (C2), and stored on `DiscordConnection` — not in product JSON as a URL. Bind alone never yields Connected.

### AC-06 — Production adapter

Production Nest bind uses `ProductionDiscordWebhookNotificationAdapter`, not `ReservedInactiveChannelAdapter`.

### AC-07 — API

Authorized operator endpoints exist: `/v1/discord/connection|bind|test|disconnect|diagnostics` with C2/C3/C8 semantics parallel to Slack.

### AC-08 — UI

`/notifications/channels/discord` offers Discord settings (status, bind, test, disconnect, diagnostics) without secret exposure.

### AC-09 — Real test

Authorized operator `POST /v1/discord/test` performs adapter `send` (real HTTPS when live; mock in tests). Connected only after successful webhook test send (HTTP 204 semantics).

### AC-10 — Connected / Verified honesty

Vault stored + Connections local validate + bind alone are **not** Connected / Verified / Healthy.

### AC-11 — Failure honesty

Failed test does not produce Connected; surfaces stable error without webhook URL leakage.

### AC-12 — Delivery history

Discord delivery history records truthful delivered / failed / skipped outcomes with safe metadata only (`transport=webhook`, `adapterReached`).

### AC-13 — Diagnostics

Diagnostics distinguish production webhook / adapterReached / scheduler=false / retries=false and never expose secrets.

### AC-14 — Security

SSRF protections reject non-HTTPS, non-allowlisted hosts, private/metadata/localhost targets, malformed paths, redirects, userinfo, and query/fragment URLs.

### AC-15 — Delivery integration

`deliver()` Discord route uses the production webhook adapter when Discord is connected and explicitly routed. No silent redirect to Telegram/Email/Slack.

### AC-16 — Telegram regression

Telegram Bot API transport, connection semantics, and default routing remain unchanged.

### AC-17 — Email regression

Email SMTP transport and connection semantics remain unchanged.

### AC-18 — Slack regression

Slack Incoming Webhook transport and Connected / Verified behavior remain unchanged.

### AC-19 — Default routing

Default type routing and default channel enablement remain telegram-centric; Discord not silently enabled for all types.

### AC-20 — Database

No Prisma migration. Snapshot `discord` array only.

### AC-21 — Dependencies

No new npm dependency.

### AC-22 — Tests

Automated tests cover domain, Vault, SSRF, adapter (mocked HTTPS), API, web, and Telegram/Email/Slack regression. No live Discord/Telegram/SMTP/Slack in automated tests.

### AC-23 — Documentation / integrity

Implementation docs/evidence do not embed real webhook URLs. Repository integrity checks (`git diff --check`) remain clean for authorized commits.

### AC-24 — FIV completeness

Final FIV PASS requires real customer-visible Discord delivery evidence. Mock-only unit/integration success is insufficient for Final Close.

### AC-25 — Disconnect

Disconnect returns Discord `not-connected`; test unavailable until re-bind; Vault/ConnectionRecord untouched by product disconnect.

---

## 22. Risks

| Risk                                    | Impact                               | Mitigation                                                                                                     | Verification                        |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| SSRF via operator webhook URL           | Internal network exposure            | Host pin `discord.com`/`discordapp.com`; HTTPS-only; path pattern; validate at store + send; redirect disabled | AC-14; security tests               |
| Webhook URL secrecy                     | Credential leak                      | Vault-only storage; never project URL; redact errors                                                           | AC-03/AC-04/AC-12; disclosure tests |
| Invalid/fake Connected state            | Honesty failure                      | Connected only after HTTP 204 success                                                                          | AC-09/AC-10/AC-11                   |
| Discord endpoint / host changes         | Delivery breakage                    | Dual official host allowlist; stable error codes; fail closed on unknown hosts                                 | Adapter + security tests; FIV       |
| Discord rate limits (429)               | Flaky Connected / operator confusion | Stable `discord_webhook_rate_limited`; remain pending                                                          | Adapter tests                       |
| Discord response semantics (200 vs 204) | Fake Connected on unexpected body    | Require 204 without wait query; non-204 ≠ success                                                              | Adapter tests; AC-09                |
| Redirect handling                       | SSRF bypass                          | `redirect: 'error'`                                                                                            | Security + adapter tests            |
| DNS rebinding limitation                | Residual risk                        | Document syntactic-only validation; pin hosts; re-validate before send; no stronger claim                      | Security review note                |
| Telegram regression                     | Break production Telegram            | Isolated Discord branch; regression suite                                                                      | AC-16                               |
| Email regression                        | Break production Email               | Isolated Discord branch; regression suite                                                                      | AC-17                               |
| Slack regression                        | Break production Slack               | Isolated Discord branch; regression suite                                                                      | AC-18                               |
| Accidental default routing              | Unwanted Discord fan-out             | Do not change default preferences                                                                              | AC-19                               |
| Accidental Teams/Push activation        | Scope / honesty breach               | Catalog change Discord-only                                                                                    | AC-02                               |
| Scope creep into Discord Bot API        | Unauthorized architecture            | Explicit out-of-scope; Incoming Webhook only                                                                   | AC-01; planning review              |
| Unnecessary Prisma changes              | Persistence drift                    | Snapshot-only; no DiscordConnection table                                                                      | AC-20                               |

---

## 23. Dependencies

### Closed foundations (consume, do not reopen)

- Waves 1–4
- W5-N01…W5-N29 (including foundation W5-N03 Slack/Discord/Teams)
- REM-01-s1 / REM-01-s2 / REM-02 / REM-03
- Production Telegram Operator Test-Message
- Production Email SMTP Operator Connect / Test / Status
- Production Slack Incoming Webhook Operator Connect / Test / Status

### Existing architecture (required)

| Concern        | Artifact                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Port           | `NotificationChannelPort`                                                                        |
| Delivery owner | `NotificationDeliveryService`                                                                    |
| Store          | `DurableNotificationStore` / `InMemoryNotificationStore`                                         |
| Routing        | `resolveDeliveryRoutes` + PC-06                                                                  |
| Catalog        | `NOTIFICATION_CHANNEL_CATALOG` + PC-07 views                                                     |
| Vault          | `SecretVaultService`, C8 retrieve                                                                |
| Connections    | `connection-catalog.ts`, credential endpoints                                                    |
| SSRF           | `validateOutboundSsrfTarget`, `hostnameIsBlocked`; pattern `slack-webhook-url-guard.ts`          |
| Patterns       | `slack-product`, `ProductionSlackWebhookNotificationAdapter`, Email/Telegram production adapters |
| Security       | Workspace isolation, PermissionClass C2/C3/C8                                                    |
| Queue/history  | Existing delivery history + durable queue (consume, do not redesign)                             |

### Prerequisites for implementation

1. Planning Review PASS
2. Planning Approval GRANTED
3. Planning Repository Synchronization
4. Explicit Implementation Authorization from Product Owner
5. Engineering automated tests use mocks only; FIV later requires real Discord evidence

---

## 24. Governance gates

```text
1.  Planning Package creation                        COMPLETE
2.  Product Owner Planning Review                    PASS
3.  Planning Approval                                GRANTED
4.  Planning Repository Synchronization              THIS ACT
5.  Implementation Authorization                     NOT GRANTED
6.  Implementation                                   NOT STARTED
7.  Product Owner Implementation Review              NOT PERFORMED
8.  Repository Synchronization (implementation)      NOT PERFORMED
9.  FIV                                               NOT AUTHORIZED
10. Product Owner Final Close                         NOT PERFORMED
11. Final Close Repository Synchronization           NOT PERFORMED
12. CLOSED                                            NO
```

Do not implement from this document alone.

---

## 25. Implementation exit criteria

When implementation is later authorized, engineering may claim slice-complete only when:

1. All §21 acceptance criteria are evidenced.
2. Automated test suite passes with mocked HTTPS (§16).
3. FIV PASS includes real customer-visible Discord delivery (not mocks-only for Final Close).
4. Product Owner Implementation Review PASS.
5. No unauthorized scope expansion into Teams/Push/Bot API/runtime engines.
6. Telegram, Email, and Slack regression-clean.
7. Master Plan and Execution Roadmap unchanged.

Wave 5 COMPLETE is **not** claimed from this slice.

---

## 26. Mandatory final questions

1. **What exact repository components must change?**
   Notification Delivery (`DiscordConnection`, adapter, resolver, errors, store snapshot, `deliver()` / routing, Nest bind), Security Platform Discord webhook URL guard, Secret Vault holdable type + validation/classification, Connections catalog/provider mapping, new `discord-product` HTTP module (`/v1/discord/*`), PC-07 notification-product views/catalog honesty for Discord, web Discord settings page + shared API client, and Discord-focused automated tests.

2. **What exact repository components must NOT change?**
   Master Plan; Execution Roadmap; foundation W5-N03 closed evidence; Telegram/Email/Slack production adapters and Connected semantics; default routing preferences; Teams/Push catalog reserved state; W5-N03 anchors as connection SoT; retry/scheduler/metrics runtimes; Vault architecture redesign; Prisma schema (no DiscordConnection table).

3. **Does Discord require a new Vault credential type?**
   **YES** — `HoldableSecretType.DiscordWebhook` (`discord-webhook`) with `SecretPurpose.Notification`.

4. **Does Discord require a new database migration?**
   **NO** — persist via durable notification owner snapshot `discord: DiscordConnection[]`, same pattern as Slack.

5. **What exact API endpoints are required?**
   `GET /v1/discord/connection`, `POST /v1/discord/bind`, `POST /v1/discord/test`, `POST /v1/discord/disconnect`, `GET /v1/discord/diagnostics`.

6. **What exact UI changes are required?**
   Replace reserved Discord detail page with Discord settings page at `/notifications/channels/discord` (status / Connections link / bind / test / disconnect / diagnostics / history), without rendering secrets. Telegram/Email/Slack/Teams/Push UIs unchanged except catalog honesty for Discord becoming offered.

7. **What is the exact Discord webhook security policy?**
   HTTPS only; host allowlist exactly `discord.com` or `discordapp.com`; path `/api/webhooks/{snowflake}/{token}`; reject userinfo/query/fragment/localhost/private/metadata/malformed paths; `redirect: 'error'`; 10s timeout; validate at store and again before send; syntactic SSRF only (same DNS-rebinding limitation class as Slack).

8. **How is real production delivery verified?**
   Operator `POST /v1/discord/test` through `ProductionDiscordWebhookNotificationAdapter` to the Vault-retrieved Discord Incoming Webhook; success = HTTP 204; FIV requires customer-visible Discord channel message.

9. **How is secret non-disclosure verified?**
   Automated assertions that webhook URL/token never appear in API JSON, UI, diagnostics, delivery history, logs, errors, tests, or git; credentials enter only via Connections/Vault.

10. **How is Telegram regression verified?**
    Existing Telegram production / projection / routing tests remain green; Bot API transport and default telegram routing unchanged.

11. **How is Email regression verified?**
    Existing Email SMTP production tests remain green; SMTP connection semantics unchanged.

12. **How is Slack regression verified?**
    Existing Slack webhook production tests remain green; Slack Connected/Verified behavior unchanged.

13. **Does default routing remain Telegram-only?**
    **YES.**

14. **Does this activate Teams or Push?**
    **NO.** Both remain reserved-inactive.

15. **What remains explicitly out of scope?**
    Discord Bot API/Gateway/OAuth/Events/interactions/WebSocket; Teams; Push; retry/scheduler/metrics; new architectures; TD-049 remediation; TD-050 closure; Master Plan/Execution Roadmap changes; W5-N30/V3-N30/CM-37; Wave 5 COMPLETE.

16. **What is the FIV evidence required?**
    Real Discord credential via Connections/Vault; bind; real `/v1/discord/test`; customer-visible Discord message; Connected/Verified; truthful history/diagnostics; secret non-disclosure; SSRF; Telegram/Email/Slack regression; catalog; default routing; repository integrity.

17. **What technical debt remains OPEN?**
    **TD-049 = OPEN**; **TD-050 = OPEN** (Discord residual may reduce after later Close; Teams/Push remain).

18. **What existing planning artifacts authorize CM-14?**
    Execution Roadmap Wave 5 V3-N03 (CM-13/14/15); capability inventory CM-14; readiness dashboard CM-14; Wave 5 planning sequence N01→N02→N03→N04; Slack planning package stating Slack is first V3-N03 channel; Product Owner–authorized next-slice analysis selecting Discord after Slack close.

---

## 27. Non-declarations

```text
W5-N03 reopened = NO
W5-N30 created = NO
V3-N30 created = NO
CM-37 created = NO
Master Plan changed = NO
Execution Roadmap changed = NO
Wave 5 complete = NO
Implementation authorized = NO
FIV authorized = NO
W5-N04 / Push started = NO
Teams activated = NO
Push activated = NO
```

---

## 28. STOP condition

```text
PLANNING APPROVAL = PASS
REPOSITORY SYNCHRONIZATION = THIS ACT
IMPLEMENTATION AUTHORIZED = NO
FIV AUTHORIZED = NO
OFFICIAL PACKAGE ID CREATED = NO
LIVE DISCORD CALL = NOT PERFORMED
LIVE TELEGRAM / EMAIL / SLACK CALL = NOT PERFORMED
SECRETS = NOT ACCESSED / NOT COMMITTED
FOUNDATION W5-N03 = CLOSED (not reopened)
MASTER PLAN = UNCHANGED
EXECUTION ROADMAP = UNCHANGED
WAVE 5 = NOT COMPLETE
```

Do not implement. Do not call Discord webhooks. Do not provision or retrieve credentials. Next gate after this synchronization is **Product Owner Implementation Authorization** — not granted.

---

# Conclusion

Repository evidence supports a single coherent production Discord Incoming Webhook slice on existing Notification Delivery, Vault, Connections, PC-06, PC-07, and Security Platform SSRF patterns, following the closed Slack CM-13 pattern. Foundation W5-N03 is consumed, not reopened. No official package ID. No Master Plan or Execution Roadmap change.

```text
PLANNING PACKAGE:
V3-N03 · CM-14 — Production Discord Incoming Webhook Operator Connect / Test / Status
STATUS:
PLANNING APPROVED / REPOSITORY SYNCHRONIZED
IMPLEMENTATION:
NOT AUTHORIZED
FIV:
NOT AUTHORIZED
MASTER PLAN:
UNCHANGED
EXECUTION ROADMAP:
UNCHANGED
WAVE 5:
NOT COMPLETE
```

**PLANNING APPROVAL: PASS**

**IMPLEMENTATION: NOT AUTHORIZED**

**STOP**
