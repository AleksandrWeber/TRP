# Production Microsoft Teams Incoming Webhook — Connect / Test / Status

**Document:** Planning Package — Production Microsoft Teams Incoming Webhook Operator Connect / Test / Status / Notification Delivery
**Date:** 2026-09-16
**Label:** Production Microsoft Teams Incoming Webhook Operator Connect / Test / Status (planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Roadmap:** **V3-N03 · CM-15** (Microsoft Teams portion of Slack / Discord / Teams package)
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37. Does **not** reopen foundation W5-N03.
**Authority:** Product Owner–authorized Planning Package creation + Planning Package remediation (transport-contract freeze). Planning Approval remains a separate gate.
**Owner:** Notification Delivery (product consumed by a new teams-product HTTP adapter / notification-product / web; webhook URL remains Vault + Connections)
**Predecessor:** Production Discord Incoming Webhook Operator Connect / Test / Status **CLOSED** (`e83db7a825d69a5ac10ea95c1c15414f58d991ba`)
**Successor:** V3-N04 · CM-16 Push (reserved / not started)
**Planning analysis:** Product Owner–authorized Next Slice Planning Analysis after CM-14 Discord close (Teams = next CM-15)

**Baseline:** `e83db7a825d69a5ac10ea95c1c15414f58d991ba` — `docs(wave-5): close discord webhook slice`

```text
PACKAGE STATUS: READY FOR PLANNING APPROVAL
PLANNING REVIEW: PASS
PLANNING APPROVAL: NOT GRANTED (awaiting separate Approval review after remediation)
IMPLEMENTATION: NOT AUTHORIZED
FIV: NOT AUTHORIZED
FINAL CLOSE: NOT AUTHORIZED
Official package ID = NOT CREATED
Foundation W5-N03 = CLOSED (consume only)
Remediation: 2026-09-16 — six transport-contract blockers FROZEN
Final transport-contract verification: 2026-09-16 — hostname/query/path tightened; PASS
```

This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

CM-15 is the **Microsoft Teams portion of V3-N03**. CM-13 Slack is CLOSED. CM-14 Discord is CLOSED. V3-N04 / CM-16 Push remains later.

---

## Lifecycle

| State                          | This package             |
| ------------------------------ | ------------------------ |
| **PLANNING PACKAGE**           | **CREATED + REMEDIATED** |
| **PLANNING REVIEW**            | **PASS**                 |
| **PLANNING APPROVAL**          | **NOT GRANTED**          |
| **REPOSITORY SYNCHRONIZATION** | **NOT PERFORMED**        |
| **IMPLEMENTED**                | **NO**                   |
| **VERIFIED (FIV)**             | **NO**                   |
| **CLOSED**                     | **NO**                   |

This package itself does **not** grant Planning Approval and does **not** authorize implementation.

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

---

## Evidence classification legend

Used throughout this package for provider-contract claims:

| Label                  | Meaning                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ESTABLISHED**        | Proven by TRP authoritative artifacts and/or closed CM-13/CM-14 architecture                                              |
| **STRONGLY EVIDENCED** | Supported by current Microsoft documentation / Microsoft Support / Microsoft 365 Dev Blog as of planning/remediation date |
| **FROZEN**             | Production transport-contract item fixed by this remediation; deterministic for subsequent Planning Approval              |
| **PROPOSED**           | TRP-side architecture choice aligned with CM-13/CM-14 continuity (not a Teams provider unknown)                           |

---

## 1. Executive summary

Telegram, Email, Slack, and Discord are real production transports. Microsoft Teams is the next original Wave 5 channel capability inside **V3-N03** after closed **CM-14 Discord**, following binding order **V3-N01 → N02 → N03 → N04** and capability order **CM-13 → CM-14 → CM-15**. Foundation W5-N03 closed as inventory / durable anchors / restart recovery / operational continuity only. There is no production Teams webhook adapter, no Teams connection domain, no Teams product REST, no Connections `TEAMS` provider, no Teams Vault secret type, and `deliver()` still hard-skips Teams with `channel-reserved`.

This package defines planning for **one coherent production Microsoft Teams Incoming Webhook slice**:

```text
Teams webhook credential (Vault + Connections)
+ Teams notification channel bind
+ production HTTPS webhook adapter
+ operator test
+ truthful Connected / Pending / Failed / Disconnected
+ deliver() Teams send branch when connected and routed
```

Existing architecture is sufficient. Webhook URL stays in Vault via a new Connections **TEAMS** notification provider. Notification Teams Connected lives on a new `TeamsConnection` beside `TelegramConnection` / `EmailConnection` / `SlackConnection` / `DiscordConnection` — **not** on `ConnectionRecord.status` and **not** on `workspace_slack_discord_teams_notification_anchors`.

```text
Slice type: production Microsoft Teams Workflows Incoming Webhook transport + PC-07 product
Integration model: Teams Workflows Incoming Webhook ONLY
  (Anyone + SAS URL on <env>.<region>.environment.api.powerplatform.com;
   NOT Bot / Graph / OAuth / legacy Office 365 Connector / logic.azure.com)
Minimum production runtime change: REQUIRED
New HTTP routes: REQUIRED (/v1/teams/* parallel to /v1/discord/*)
Prisma migration: NOT REQUIRED (preferred)
New npm dependency: NOT REQUIRED
Live Teams delivery in automated tests: FORBIDDEN
Live Telegram / SMTP / Slack / Discord in tests: FORBIDDEN
System Vault principal: FORBIDDEN
Inbound Teams Events receiver: FORBIDDEN
Teams Bot / Bot Framework / Gateway / Graph event subscriptions: FORBIDDEN
Adaptive Card / MessageCard payloads: OUT OF CM-15 SCOPE
Success Connected criterion: HTTP 202 only
```

**Platform distinction (critical / FROZEN):** Microsoft has retired **Office 365 / Microsoft 365 Connectors** Incoming Webhooks (final disablement **2026-05-18 … 2026-05-22**). Power Automate Teams/HTTP trigger URLs on `logic.azure.com` stopped working **2025-11-30**. CM-15 uses **only** current Workflows / Power Automate Incoming Webhooks on `<env>.<region>.environment.api.powerplatform.com` with trigger **When a Teams webhook request is received** / template **Send webhook alerts to a channel**, authentication **Anyone**, payload `{"text":...}`, success **HTTP 202**. It does **not** authorize Bot Framework, Microsoft Graph subscriptions, OAuth, or legacy connector URLs.

**Credentials stored ≠ Connected.** Vault `SecretState.Connected`, Connections local `validate()`, and webhook URL present in Vault do **not** mean Teams is Connected. Teams becomes Connected only after a successful production HTTPS POST that returns **HTTP 202** on the operator test path (§5.7). Customer-visible Teams message receipt remains a separate FIV requirement.

This slice ships **Teams only**. Push remains reserved-inactive. Telegram, Email, Slack, and Discord behavior must be preserved unchanged.

Default routing remains **Telegram-only**. CM-15 must not make Teams a default route.

---

## 2. Baseline

Verified at package writing (read-only):

| Check                | Result                                              |
| -------------------- | --------------------------------------------------- |
| `git rev-parse HEAD` | `e83db7a825d69a5ac10ea95c1c15414f58d991ba`          |
| Latest commit        | `e83db7a docs(wave-5): close discord webhook slice` |
| HEAD == origin/main  | **YES**                                             |

Product Owner operational baseline (consumed, not re-declared):

```text
W5-N01…W5-N29 = CLOSED (foundations)
REM-01-s1 / REM-01-s2 / REM-02 / REM-03 = CLOSED
Production Telegram Operator Test-Message = CLOSED
Production Email SMTP Operator Connect / Test / Status = CLOSED
Production Slack Incoming Webhook Operator Connect / Test / Status = CLOSED
Production Discord Incoming Webhook Operator Connect / Test / Status = CLOSED
V3-N01 = PASS
V3-N02 Email production = CLOSED
V3-N03 · CM-13 Slack production = CLOSED
V3-N03 · CM-14 Discord production = CLOSED
V3-N03 · CM-15 Teams = THIS PLANNING PACKAGE
V3-N04 / CM-16 Push = LATER
Wave 5 = NOT COMPLETE
TD-049 = OPEN
TD-050 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
Foundation W5-N03 = CLOSED (consumed, not reopened)
```

This package does **not** reopen foundation W5-N03, closed Telegram/Email/Slack/Discord production slices, or other foundation packages. It does **not** complete Wave 5.

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

| Capability                         | State                     |
| ---------------------------------- | ------------------------- |
| V3-N01 · CM-11 Telegram            | Production CLOSED         |
| V3-N02 · CM-12 Email               | Production CLOSED         |
| V3-N03 · CM-13 Slack               | Production CLOSED         |
| V3-N03 · CM-14 Discord             | Production CLOSED         |
| **V3-N03 · CM-15 Microsoft Teams** | **This planning package** |
| V3-N04 · CM-16 Push                | Later — remains reserved  |

Authorizing sources for CM-15 (unchanged files):

- `docs/project/version-3/v3-execution-roadmap.md` — Wave 5 order; V3-N03 = Slack / Discord / Teams (CM-13, CM-14, CM-15)
- `docs/project/version-3/v3-capability-inventory.md` — CM-13 Slack · CM-14 Discord · CM-15 Microsoft Teams
- `docs/project/version-3/v3-readiness-dashboard.md` — CM-15 Microsoft Teams
- `docs/project/version-3/wave-5/wave-5-planning-summary.md` — N01 → N02 → N03 → N04; do not skip
- `docs/project/version-3/wave-5/discord-incoming-webhook-final-close.md` — CM-14 CLOSED; CM-15 not started / reserved
- `docs/project/version-3/wave-5/discord-incoming-webhook-planning-package.md` — capability order CM-13 → CM-14 → CM-15
- Product Owner Next Slice Planning Analysis after Discord close — CM-15 recommended next

Master Plan: operators connect shipped channels the same way as Telegram, or see them still reserved. After this slice ships (implementation later), Teams is no longer reserved. Push stays reserved.

Foundation W5-N03 remains **CLOSED**. Its durable anchors, restart recovery, and operational continuity artifacts are **consumed**, not reopened or reinterpreted as production webhook I/O.

Telegram, Email, Slack, Discord, and Teams remain delivery-only. None is a control plane.

---

## 4. Current Teams architecture (as of CM-14 close)

### Catalog and routing — ESTABLISHED

`NOTIFICATION_CHANNEL_CATALOG` today (`notification-channel.ts`):

```text
ACTIVE:    telegram, email, slack, discord
RESERVED:  teams, push
```

`resolveDeliveryRoutes` skips reserved channels with `channel-reserved`. Default preferences enable **telegram only**. Default type routing channels = `['telegram']`.

`NotificationDeliveryService.deliver()` sends Telegram, Email, Slack, and Discord when routed and connected; Teams/Push record `skipped / channel-reserved`.

Ports: no `TEAMS_CHANNEL_ADAPTER` token. Slack has `SLACK_CHANNEL_ADAPTER`; Discord has `DISCORD_CHANNEL_ADAPTER`.

### Product — ESTABLISHED

- PC-07 Telegram / Email / Slack / Discord: active `/v1/{channel}/*` + settings pages.
- PC-07 Teams: reserved `NotificationChannelDetailView`. Required-field disclosure: `Webhook`, `Team`, `Channel` (`notification-channel.view.ts`).
- PC-06: settings / preferences / routing / deliveries. Controllers do not connect or send tests for reserved channels.
- Web: `/notifications/channels/teams` renders the reserved detail page (no Teams settings module yet).

### Foundation (W5-N03, not a connection SoT) — ESTABLISHED

`WorkspaceSlackDiscordTeamsNotificationAnchor` / `workspace_slack_discord_teams_notification_anchors`: per-notification anchors; `deliveryState = 'anchor-recorded'`. Must **not** be treated as Teams Connected.

Combined Slack/Discord/Teams restart recovery and operational continuity exist on notification-delivery owner. They do **not** establish Teams webhook transport.

### Connections / Vault (gaps) — ESTABLISHED

| Artifact                                 | State today                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Connections catalog TEAMS                | **MISSING** (SLACK / DISCORD exist)                                                     |
| `HoldableSecretType` for Teams webhook   | **MISSING** (SlackWebhook / DiscordWebhook exist; no Teams type)                        |
| Vault field validation for Teams URL     | **MISSING**                                                                             |
| `vaultSecretTypeForProvider('TEAMS')`    | **MISSING**                                                                             |
| `defaultPurposeForType('teams-webhook')` | Must map to `SecretPurpose.Notification` (proposed)                                     |
| Production Teams webhook adapter         | **MISSING**                                                                             |
| Teams connection domain                  | **MISSING**                                                                             |
| Teams URL SSRF guard                     | **MISSING** (Slack/Discord guards exist; Teams requires its own host/path/query policy) |

W5-N03-a inventory still records Teams webhook transport as missing and reserved-inactive skip as current behavior.

Connection Management CONNECTED for a future TEAMS provider would mean “local credential slot looks stored.” It is **not** PC-07 Teams Connected and must not be reused as such.

---

## 5. Microsoft Teams Incoming Webhook architecture

### 5.0 FROZEN production transport contract (remediation 2026-09-16)

The six former Planning Approval blockers are **FROZEN** below. Implementation MUST follow this contract exactly. No “confirmation required” remains for these items.

| #   | Item                 | Frozen value                                                                                                                                                  |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Authentication mode  | Workflows trigger **Anyone** — invoke URL (incl. SAS query) is the sole credential; **no OAuth / bearer / Graph**                                             |
| 2   | Host allowlist       | Hostname MUST match `<env>.<region>.environment.api.powerplatform.com` (exact two-label regex in §5.4); **reject** `logic.azure.com` and `webhook.office.com` |
| 3   | Path structure       | Exact invoke path grammars in §5.4 (with optional `/cu/{scaleUnit}/`)                                                                                         |
| 4   | Query / `sig` policy | Mandatory **only** `api-version`, `sp`, `sv`, `sig` (no other params); unknown/duplicates rejected; query preserved byte-for-byte for outbound send           |
| 5   | Minimum payload      | **Only** `{"text":"<string>"}` JSON; Adaptive Cards / MessageCards **out of CM-15 scope**                                                                     |
| 6   | Success HTTP status  | **HTTP 202 only** for Connected / `{ ok: true }`; no other 2xx                                                                                                |

Authoritative Microsoft sources used for freeze:

- Microsoft Learn — _Create an Incoming Webhook_ (Workflows path; POST `{"text":...}` example)
- Microsoft Learn — _Microsoft Teams connector_ — trigger **When a Teams webhook request is received** (Anyone auth; no token header for Anyone)
- Microsoft Learn — _Troubleshoot Power Automate triggers_ — `logic.azure.com` Teams/HTTP trigger URLs stop working **2025-11-30**; current URLs use Power Platform host; from **2026-06-02** path may include `/direct/cu/{n}/workflows/...`
- Microsoft 365 Dev Blog — Office 365 Connectors retirement (legacy `*.webhook.office.com` disabled **2026-05-18…2026-05-22**)

---

### 5.1 Integration model (authorized scope)

**Microsoft Teams Incoming Webhook only** — under Microsoft’s **current** Workflows / Power Automate terminology.

```text
TRP
 ↓
TeamsConnection
 ↓
Vault (retrieve-at-send)
 ↓
ProductionTeamsWebhookNotificationAdapter
 ↓
HTTPS POST (JSON {"text":...})
 ↓
Workflows / Power Automate Teams webhook trigger URL
  (Anyone + SAS query on <env>.<region>.environment.api.powerplatform.com)
 ↓
Configured Teams channel (via operator-owned workflow)
```

### 5.2 Platform compatibility — FROZEN / STRONGLY EVIDENCED

| Question                                                             | Finding                                                                                                        | Classification                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Are Incoming Webhooks currently supported?                           | **Yes**, via Workflows / Power Automate templates and the trigger **When a Teams webhook request is received** | STRONGLY EVIDENCED                               |
| Is legacy Office 365 Connector Incoming Webhook still available?     | **No for CM-15.** Final disablement completed **2026-05-22**. Reject `*.webhook.office.com`                    | FROZEN reject                                    |
| Are Power Automate `logic.azure.com` Teams webhook URLs still valid? | **No for CM-15.** Microsoft: old URLs stop working **2025-11-30**. Reject `*.logic.azure.com`                  | FROZEN reject                                    |
| Current host family                                                  | `<env>.<region>.environment.api.powerplatform.com`                                                             | FROZEN                                           |
| Can operator provision without Bot/Graph/OAuth product?              | **Yes**, Workflows template / trigger with **Anyone**; copy webhook URL                                        | FROZEN auth model                                |
| Can webhook be tested without Bot Framework / Gateway / Graph?       | **Yes** — outbound HTTPS POST to workflow URL                                                                  | STRONGLY EVIDENCED                               |
| Orphan-flow risk                                                     | Workflows are owner-linked; co-owners recommended                                                              | STRONGLY EVIDENCED (prerequisite, not transport) |

**Scope rule:** CM-15 does **not** silently substitute Bot Framework, Microsoft Graph, or OAuth. Scope change requires separate Product Owner authorization.

### 5.3 Explicitly NOT authorized

- Microsoft Teams Bot / Bot Framework / Agents Toolkit notification bot
- Teams Gateway
- Microsoft Graph event subscriptions
- OAuth / bearer-token delivery for Teams (tenant “Any user” / “Specific users” trigger modes)
- Inbound Teams events / Socket / WebSocket
- Chat ingestion / message reading / user or directory sync
- Interactive Teams commands
- Adaptive Card / MessageCard payloads (including interactive cards) — **out of CM-15 minimum contract**
- Scheduler / retry / new queue / new Vault / Connections / notification architecture
- Dedicated Prisma `TeamsConnection` table unless later separate planning proves unavoidable
- Master Plan / Execution Roadmap changes
- CM-16 Push
- Legacy Office 365 Connector Incoming Webhooks (`*.webhook.office.com`)
- Retired Power Automate Teams webhook URLs on `*.logic.azure.com`

### 5.4 FROZEN webhook URL contract

#### Scheme / length / authority

| Rule           | Frozen value                                                              |
| -------------- | ------------------------------------------------------------------------- |
| Scheme         | `https:` only                                                             |
| Port           | Absent (default 443) **or** explicit `:443` only                          |
| Max URL length | **4096** characters (Microsoft documents new trigger URLs may exceed 255) |
| Userinfo       | **Rejected**                                                              |
| Fragment       | **Rejected**                                                              |
| Credential     | Entire URL including query/`sig` is secret material                       |

#### Host allowlist — FROZEN

Current generated Teams Workflows / Power Automate Anyone webhook hostnames follow:

```text
<environmentLabel>.<regionLabel>.environment.api.powerplatform.com
```

Observed/current examples (placeholders only; not credentials):

```text
default<hex>.<region>.environment.api.powerplatform.com
<id>.e1.environment.api.powerplatform.com
<id>.ae.environment.api.powerplatform.com
```

Hostname (case-insensitive; validate after lowercasing):

```text
APPROVED iff hostname matches EXACTLY:
  ^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.environment\.api\.powerplatform\.com$
```

Meaning (fail-closed; do not broaden):

- Exactly **two** DNS labels before the fixed suffix `.environment.api.powerplatform.com`
- Structure = `<environment>.<region>.environment.api.powerplatform.com`
- Labels are DNS-safe (`[a-z0-9-]`), no wildcards, no underscore hosts
- Deeper arbitrary prefixes (e.g. `a.b.c.environment.api.powerplatform.com`) are **rejected**
- Bare `environment.api.powerplatform.com` is **rejected**

**Rejected hosts (non-exhaustive but mandatory):**

```text
*.logic.azure.com
*.webhook.office.com
outlook.office.com
graph.microsoft.com
login.microsoftonline.com
make.powerautomate.com
service.flow.microsoft.com
any host not matching the approved two-label regex
localhost / *.localhost
IP literals (IPv4/IPv6)
private / link-local / metadata hostnames (existing SSRF blocked-address set)
```

Rationale: Microsoft Learn documents that Power Automate Teams/HTTP trigger URLs containing `logic.azure.com` stop working on **2025-11-30**. Current Anyone webhook URLs use the Power Platform environment API host with the `<environment>.<region>.environment.api.powerplatform.com` grammar. Legacy connector hosts are separately retired.

#### Path structure — FROZEN

Final verification: **both** forms are current legitimate generated URL paths.

- **Form A** is the currently observed Teams Workflows Anyone callback path (`.../direct/workflows/{id}/triggers/manual/paths/invoke`).
- **Form B** is documented by Microsoft Learn (_Troubleshoot Power Automate triggers_) as the scale-unit form introduced **2026-06-02** (`.../direct/cu/{n}/workflows/...`); Microsoft states the prior URL continues to work.

After URL parsing, `pathname` (decoded) MUST match **exactly one** of:

**Form A — without scale unit (current common generated form)**

```text
^/powerautomate/automations/direct/workflows/[A-Za-z0-9_-]+/triggers/manual/paths/invoke/?$
```

**Form B — with scale unit (Microsoft documented from 2026-06-02)**

```text
^/powerautomate/automations/direct/cu/[0-9]+/workflows/[A-Za-z0-9_-]+/triggers/manual/paths/invoke/?$
```

Rules:

| Rule                     | Frozen value                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Path prefix              | `/powerautomate/automations/direct/`                                                                                     |
| Workflow id segment      | one or more of `[A-Za-z0-9_-]`                                                                                           |
| Scale unit (Form B only) | one or more digits `[0-9]+`                                                                                              |
| Terminal                 | `/triggers/manual/paths/invoke` with optional single trailing `/`                                                        |
| Case                     | Path compared case-sensitively to the lowercase Microsoft path segments above (reject mixed-case segment substitutions)  |
| Percent-encoding in path | Reject if raw stored URL path contains `%` (require literal `/` path segments as issued; avoid signature/path ambiguity) |
| Extra segments           | Reject                                                                                                                   |
| Path traversal (`..`)    | Reject (already fails regex)                                                                                             |

Documentation placeholders such as `<id>` are never live credentials and must not appear in tests/docs as real secrets.

#### Query / signature policy — FROZEN

Unlike Slack/Discord, Teams Workflows Anyone/SAS URLs **require** a query string.

Final verification against current Anyone/NoAuth generated callback URLs: the supported query contract is **exactly** these four parameters (example shape: `api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=<secret>`).

**Allowed query parameter names (exact set — all mandatory):**

```text
api-version
sp
sv
sig
```

**Not allowed (removed from prior optional set):**

```text
tenantId
environmentName
```

Rationale: `tenantId` / `environmentName` are **not** part of the current generated Anyone/SAS Teams Workflows webhook URL contract. They must not be retained as theoretical allowances. Any URL containing them fails closed as unknown params. OAuth-mode URLs that omit `sig` are out of CM-15 scope.

| Rule                                                    | Frozen value                                                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact parameter names                                   | Only `api-version`, `sp`, `sv`, `sig`                                                                                                                                     |
| Required vs optional                                    | **All four required**; no optional query params                                                                                                                           |
| `sig`                                                   | **Mandatory**, non-empty; treated as secret (part of full URL secret)                                                                                                     |
| Unknown parameter names                                 | **Rejected**                                                                                                                                                              |
| Duplicate parameter names                               | **Rejected**                                                                                                                                                              |
| Empty values                                            | **Rejected** for any of the four                                                                                                                                          |
| Parameter order                                         | **Must not be rewritten.** Outbound fetch MUST use the **exact stored URL string** (preserve original query byte sequence). Do not sort, drop, or re-encode query params. |
| Percent-encoding                                        | Preserve as stored. Do not normalize `%2F` ↔ `/` in query values (notably `sp`).                                                                                          |
| Fragment                                                | **Rejected**                                                                                                                                                              |
| Userinfo                                                | **Rejected**                                                                                                                                                              |
| Logging / API / UI / diagnostics / errors / tests / Git | **Never** emit query string, `sig`, or full URL                                                                                                                           |

If the stored URL is missing any mandatory param, has duplicates, or includes any other param name → fail closed (`teams_webhook_blocked_url` / `teams_webhook_invalid_request`).

### 5.5 FROZEN transport rules

| Rule                         | Frozen requirement                                                            |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Method                       | **POST only**                                                                 |
| Scheme                       | **HTTPS only**                                                                |
| Host / path / query          | §5.4 exact rules                                                              |
| Headers                      | `Content-Type: application/json` (UTF-8 JSON body)                            |
| Authorization header         | **MUST NOT** be sent (Anyone mode; Microsoft: token header fails Anyone)      |
| Body                         | §5.6 minimum payload only                                                     |
| Retrieve                     | At send/test via resolver; no URL cache across requests                       |
| Timeout                      | **10_000 ms**                                                                 |
| Redirects                    | `redirect: 'error'`                                                           |
| DNS resolution at validation | **Not performed** (syntactic allowlist only; no DNS-rebinding immunity claim) |
| Logging                      | Workspace, operation, duration, stable error code only                        |

### 5.6 FROZEN minimum payload

**Single production payload (no alternate):**

```json
{
  "text": "<notification text>"
}
```

| Rule                           | Frozen value                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Content-Type                   | `application/json`                                                                                                                              |
| Encoding                       | UTF-8                                                                                                                                           |
| JSON shape                     | Object with exactly one required property: `text` (string)                                                                                      |
| Extra top-level properties     | **Rejected** by adapter construction (adapter emits only `{ text }`)                                                                            |
| Empty / whitespace-only `text` | **Rejected** (`teams_webhook_invalid_request`)                                                                                                  |
| Text source                    | Notification subject/body rendered into a single bounded string (implementation may join subject+body with a separator; empty result forbidden) |
| Max `text` length              | **4000** Unicode code points (conservative vs Teams ~28 KB message limit)                                                                       |
| Adaptive Cards                 | **OUT OF SCOPE** for CM-15                                                                                                                      |
| MessageCard                    | **OUT OF SCOPE** for CM-15                                                                                                                      |

Rationale: Microsoft Learn _Create an Incoming Webhook_ documents this exact Workflows POST body. Smallest deterministic payload. Adaptive Cards remain available on the platform but are not part of CM-15.

### 5.7 FROZEN success HTTP status / Connected criterion

| Item                        | Frozen value                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Accepted success status set | **`{ 202 }` only**                                                                                              |
| Other 2xx including 200     | **Not accepted** → `teams_webhook_invalid_response` (or `teams_webhook_unsupported_status`)                     |
| Response body inspection    | **Not required** for Connected                                                                                  |
| Transport accepted          | HTTP **202** means the Workflows trigger accepted the request for processing                                    |
| Customer-visible delivery   | **Separate** — FIV must show the message in the Teams channel; HTTP 202 alone is **not** customer-visible proof |

**Connected criterion (operator test / later deliver):**

```text
ProductionTeamsWebhookNotificationAdapter.send → { ok: true }
iff
  URL passes §5.4 guard
  AND HTTPS POST completes
  AND response status === 202
  AND no timeout / redirect / network / TLS failure
(or test-double equivalent that simulates HTTP 202)
```

### 5.8 FROZEN authentication mode

**Selected mode: Workflows trigger authentication = Anyone**

| Rule                                                    | Frozen value                                                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential                                              | Full invoke URL including SAS query (`sig` and related params)                                                                                                                                       |
| OAuth bearer token                                      | **Not used**                                                                                                                                                                                         |
| Microsoft Graph credential                              | **Not used**                                                                                                                                                                                         |
| `Authorization` request header                          | **Must not be sent**                                                                                                                                                                                 |
| Tenant modes “Any user in my tenant” / “Specific users” | **Out of CM-15 scope** (require OAuth; not implemented)                                                                                                                                              |
| Operator prerequisite                                   | Operator/FIV workflow MUST be created with **Anyone** (or equivalent URL-secret SAS access). If tenant forces OAuth-only triggers, environment is not CM-15-capable without separate PO scope change |
| 401 / 403                                               | `teams_webhook_unauthorized`; remain pending / not Connected                                                                                                                                         |

Microsoft connector docs: for Anyone, do not pass an authentication token header or POSTs fail.

### 5.9 FROZEN error classification

Stable codes (parallel to Slack/Discord; deterministic):

```text
teams_webhook_invalid_request      # malformed request / empty text / bad JSON construction
teams_webhook_not_configured       # Vault credential missing
teams_webhook_blocked_url          # host/path/query/userinfo/fragment/scheme guard failure
teams_webhook_timeout
teams_webhook_network_error
teams_webhook_tls_failure
teams_webhook_redirect_rejected
teams_webhook_unauthorized         # HTTP 401/403
teams_webhook_not_found            # HTTP 404/410
teams_webhook_rate_limited         # HTTP 429
teams_webhook_server_error         # HTTP 5xx
teams_webhook_unsupported_status   # any non-202 including other 2xx
teams_webhook_invalid_response     # residual unexpected provider response
```

Planning-level category map:

| Category                                      | Codes                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Invalid URL / host / path / query / signature | `blocked_url`, `invalid_request`                                                |
| Secret/configuration unavailable              | `not_configured`                                                                |
| Unsupported status                            | `unsupported_status`                                                            |
| Timeout / redirect / network / TLS            | matching codes                                                                  |
| Provider rejection                            | `unauthorized`, `not_found`, `rate_limited`, `server_error`, `invalid_response` |

Rate limit: single-shot operator test; no retry/scheduler scope. On 429 → pending, not Connected.

### 5.10 Required notification adapter

```text
ProductionTeamsWebhookNotificationAdapter
  implements NotificationChannelPort
  channelId = 'teams'
  active = true
```

Responsibilities:

1. `send` — HTTPS POST §5.6 JSON to Vault-retrieved URL using exact stored URL string.
2. Structured result `{ ok: true }` only on HTTP **202**.
3. Retrieve-at-send via `TeamsWebhookCredentialResolver`.
4. Re-run §5.4 guard immediately before fetch.
5. Never log/return URL or `sig`.

Registration: `TEAMS_CHANNEL_ADAPTER` → `ProductionTeamsWebhookNotificationAdapter`.

---

## 6. Connections design

### Proposed Connections provider

| Field                          | Proposed value                                                                                                                                                      | Classification      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Provider ID                    | `TEAMS`                                                                                                                                                             | FROZEN              |
| Display name                   | `Microsoft Teams Incoming Webhook`                                                                                                                                  | FROZEN              |
| Provider type / connectionType | `NOTIFICATION`                                                                                                                                                      | FROZEN              |
| Credential fields              | `['webhookUrl']`                                                                                                                                                    | FROZEN              |
| Vault mapping                  | `HoldableSecretType.TeamsWebhook` (`'teams-webhook'`)                                                                                                               | FROZEN              |
| Lifecycle                      | create ConnectionRecord → store credentials via existing Connections credential endpoint → local validate may mark Connections CONNECTED (ignored by Teams product) | ESTABLISHED pattern |
| Authorization                  | Existing Connections C2/C3/C8 workspace rules; no product endpoint accepts `webhookUrl`                                                                             | ESTABLISHED pattern |

TEAMS does **not** currently exist in `CONNECTION_PROVIDERS`. Planning defines it; implementation later adds it after Planning Approval.

### Expected lifecycle

```text
Operator creates TEAMS ConnectionRecord
→ POST /v1/connections/:id/credentials { webhookUrl }
→ Vault stores ciphertext (type teams-webhook, purpose notification)
→ Teams settings links to Connections (no URL in Teams product bodies)
→ POST /v1/teams/bind
→ POST /v1/teams/test (retrieve-at-send)
→ Connected only after approved success criterion
```

---

## 7. Vault design

### Proposed holdable secret type

```text
HoldableSecretType.TeamsWebhook = 'teams-webhook'
```

| Field                 | Proposed value                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Exact type name       | `TeamsWebhook`                                                                             |
| Exact value           | `teams-webhook`                                                                            |
| Purpose               | `SecretPurpose.Notification` via `defaultPurposeForType`                                   |
| Credential shape      | `{ webhookUrl: string }` — full HTTPS Workflows webhook URL including required query/`sig` |
| Ownership             | Secret Vault owner; retrieve by authenticated actor + workspace                            |
| Validation lifecycle  | Validate on **store** and again **immediately before outbound fetch**                      |
| Retrieval lifecycle   | Retrieve-at-send only inside resolver/adapter; no product-view retrieve; no URL cache      |
| Secret non-disclosure | Never log, return, render, commit, or echo URL / `sig` / path secrets                      |

Classification: type name/value **FROZEN**; purpose/ownership/non-disclosure **ESTABLISHED** continuity. Credential shape includes full HTTPS Workflows URL with SAS query per §5.4.

Failed validation → reject store/retrieve; adapter returns stable `teams_webhook_invalid_request` or `teams_webhook_blocked_url`.

Missing actor → fail closed (`teams_webhook_invalid_request`), same as Telegram / Email / Slack / Discord.

Do **not**: second secret store; system principal; C8 bypass; URL cache; purpose/type invention; retrieve in views; echo webhook URL in product JSON.

Vault `SecretState.Connected` remains “ciphertext stored.” It does **not** flip Teams product Connected.

---

## 8. SSRF / security model — FROZEN fail-closed contract

This slice accepts an **operator-supplied outbound URL** (same risk class as Slack/Discord). Security is **fail-closed** and implementable from §5.4–§5.8.

### Design principle — ESTABLISHED

Validate webhook URL **before Vault storage** and **again immediately before outbound fetch**. Adapter never fetches a client-supplied URL from `deliver()` / test bodies — only Vault-retrieved URLs that pass the guard.

### Implementable controls — FROZEN

| Control                         | Frozen requirement                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| HTTPS-only                      | Reject non-`https:`                                                                                                  |
| Host allowlist                  | Exact §5.4 two-label regex `<env>.<region>.environment.api.powerplatform.com`                                        |
| Reject retired hosts            | `*.logic.azure.com`, `*.webhook.office.com`, unrelated Microsoft/Azure hosts                                         |
| Arbitrary / non-matching hosts  | Reject                                                                                                               |
| IP literals                     | Reject                                                                                                               |
| Localhost / loopback            | Reject                                                                                                               |
| Private / link-local / metadata | Reject via existing blocked-address primitives                                                                       |
| Userinfo                        | Reject                                                                                                               |
| Fragment                        | Reject                                                                                                               |
| Path                            | Exact Form A / Form B regexes; no `%` in raw path; no traversal                                                      |
| Query                           | Mandatory only `api-version`,`sp`,`sv`,`sig`; no other params; no unknowns/duplicates; preserve exact query for send |
| Redirect                        | `redirect: 'error'`                                                                                                  |
| Timeout                         | **10_000 ms**                                                                                                        |
| DNS rebinding                   | Syntactic only; **no DNS-resolution immunity claim**                                                                 |
| Secret disclosure               | Never log/return/render URL, query, or `sig` in API/UI/diagnostics/errors/tests/Git                                  |
| Retrieve-at-send                | Required; no plaintext product persistence of webhook URL                                                            |

Existing `validateOutboundSsrfTarget` exact-host allowlist is insufficient alone. CM-15 requires a **Teams-specific guard** composing blocked-address checks + §5.4 pattern host/path/query rules. Provider-specific hardening — not a new security owner.

---

## 9. TeamsConnection state machine

### Domain — PROPOSED (parallel to Discord/Slack)

```text
workspaceId
userId
status: not-connected | pending | connected
boundAt?: string
verifiedAt?: string
connectedAt?: string
lastErrorCode?: string
updatedAt
```

**No separate recipient / team / channel fields in product state.** Team/channel targeting is embedded in the operator-provisioned Workflows webhook URL / workflow configuration. Product bind confirms the operator wants Teams notifications active for this workspace user after credentials exist. PC-07 disclosure labels `Webhook`, `Team`, `Channel` remain honesty labels for reserved→active UX; they are not separately collected as product secrets.

### State transitions

| Event                         | From                      | To                                                     |
| ----------------------------- | ------------------------- | ------------------------------------------------------ |
| Bind (Vault webhook present)  | not-connected / connected | **pending** (never connected until test)               |
| Bind (Vault webhook missing)  | *                         | **not-connected** or remain pending; test fails closed |
| Successful operator test send | pending                   | **connected**                                          |
| Failed operator test send     | pending / connected       | **pending** + `lastErrorCode`                          |
| Disconnect                    | *                         | **not-connected**                                      |

### Connected MUST mean

- credential exists in Vault;
- credential is retrievable by authenticated actor;
- production adapter was reached;
- Teams Workflows endpoint accepted the test request with **HTTP 202** (§5.7).

Vault validation alone MUST NOT establish Connected.
Connections local `validate()` CONNECTED MUST NOT establish Teams Connected.

---

## 10. Persistence

### Preferred architecture — ESTABLISHED pattern

Extend notification-delivery owner snapshot:

```text
teams: TeamsConnection[]
```

Same mechanism as `slack` / `discord` arrays. Hydrate treats missing `teams` as empty (backward compatible).

| Item               | Expectation                                               |
| ------------------ | --------------------------------------------------------- |
| Snapshot ownership | Notification Delivery durable/in-memory store             |
| Restart behavior   | TeamsConnection hydrates from snapshot like Slack/Discord |
| Recovery behavior  | W5-N03 anchors remain unrelated; not Teams Connected SoT  |
| Prisma migration   | **NOT REQUIRED** (preferred)                              |
| Compatibility      | Do not alter Telegram/Email/Slack/Discord snapshot keys   |

If implementation later proves snapshot persistence insufficient, that requires a **separate** planning act. This package does **not** authorize a Prisma `TeamsConnection` table.

---

## 11. PC-07 / catalog behavior

During planning / until implementation:

```text
Teams = RESERVED / INACTIVE
Push = RESERVED / INACTIVE
```

After successful CM-15 implementation (later gate):

```text
ACTIVE:   telegram, email, slack, discord, teams
RESERVED: push
```

| Surface               | Behavior                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connect / credentials | Operator creates TEAMS `ConnectionRecord` and stores webhook URL via Connections. Teams settings links to Connections; does **not** accept webhook URL in Teams product POST bodies |
| Bind                  | `POST /v1/teams/bind` → pending if Vault webhook exists                                                                                                                             |
| Test                  | `POST /v1/teams/test` with C2 + Vault retrieve C8 inside adapter                                                                                                                    |
| Status                | not-connected / pending / connected                                                                                                                                                 |
| Disconnect            | Teams product disconnect → not-connected; Vault/ConnectionRecord untouched                                                                                                          |
| Catalog card          | Teams `offered: true`, `configurationKind: teams-connection`, transport `webhook` when production adapter bound                                                                     |
| Honesty               | `liveTransportActivated` / `webhookUsed` true for Teams only when production webhook adapter bound                                                                                  |

This planning package itself does **not** activate Teams in catalog code.

---

## 12. Delivery / routing

Add a Teams send branch **after** routing, parallel to Slack/Discord:

```text
if route.channelId === 'teams'
  and TeamsConnection.status === 'connected'
  and Vault webhook retrievable
  → teamsAdapter.send(...)
else if teams not connected
  → skip channel-not-connected
```

Teams delivery occurs only when:

- Teams is explicitly selected in preferences/routing;
- `TeamsConnection` is Connected;
- Vault credential can be retrieved;
- production adapter is available.

```text
Default routing: Telegram-only — UNCHANGED
CM-15 must NOT make Teams the default route
No scheduler
No retry subsystem
```

`resolveDeliveryRoutes` gains `teamsConnected` beside existing connected flags. Teams catalog status becomes `active` only when production adapter is bound (implementation time).

Operator test must work without preference edits (parallel Email/Slack/Discord). Routed `deliver()` to Teams requires explicit operator preference enablement.

---

## 13. API design

Existing routes **cannot** express Teams bind / webhook test / Teams Connected:

| Existing                        | Why insufficient                              |
| ------------------------------- | --------------------------------------------- |
| `/v1/telegram                   | email                                         | slack | discord/*` | Other channels only |
| `/v1/notification-channels/:id` | GET projections; no connect/test              |
| `/v1/connections`               | Credential slot; local validate ≠ webhook I/O |
| `/v1/notification-preferences`  | Routing only                                  |

### Proposed routes — parallel to Discord/Slack

Prefix: `/v1/teams`. Permission: list/status/diagnostics **C3 Projection**; mutating bind/test/disconnect **C2 OwnWorkspace**. Vault retrieve inside adapter still enforces **C8**.

| Method | Endpoint                | Purpose                       | Request body                | Response                                                | Auth        | Secret handling         | State transition                                  | Failure                                             |
| ------ | ----------------------- | ----------------------------- | --------------------------- | ------------------------------------------------------- | ----------- | ----------------------- | ------------------------------------------------- | --------------------------------------------------- |
| GET    | `/v1/teams/connection`  | Status projection             | none (+ workspace header)   | Teams status view (no webhook URL)                      | C3 + member | never return URL        | none                                              | 403 if not member                                   |
| POST   | `/v1/teams/bind`        | Bind after credentials stored | **empty** (no `webhookUrl`) | pending view if Vault webhook exists                    | C2 + member | never accept/return URL | → pending                                         | 400 if webhook not configured                       |
| POST   | `/v1/teams/test`        | Production webhook test send  | **empty**                   | test view + delivery                                    | C2 + member | retrieve-at-send only   | pending → connected on success; → pending on fail | 400 if not bound / no webhook; stable error in view |
| POST   | `/v1/teams/disconnect`  | Unbind Teams product state    | empty                       | not-connected view                                      | C2 + member | none                    | → not-connected                                   | 403 if unauthorized                                 |
| GET    | `/v1/teams/diagnostics` | Honesty + last attempt        | workspace header            | last Teams delivery + transport honesty + lastErrorCode | C3 + member | no URL exposure         | none                                              | no URL exposure                                     |

**IMPORTANT:** Teams product endpoints MUST NOT accept `webhookUrl`. Credential provisioning remains Connections → Vault.

Workspace isolation: all endpoints require authenticated workspace membership via existing header/workspace guards.

---

## 14. UI design

### Route

```text
/notifications/channels/teams
```

### Expected capabilities

- connection status (not-connected / pending / connected; derived Failed / Verified labels);
- bind;
- send test;
- disconnect;
- diagnostics / history;
- link to Connections for TEAMS credential provisioning.

### UI MUST NOT

- display webhook URL / `sig`;
- store webhook URL locally;
- invent Connected independently of backend;
- accept webhook URL in Teams forms.

Telegram, Email, Slack, and Discord pages unchanged. Push reserved page unchanged.

---

## 15. Automated testing plan

No live Teams. No live Telegram / SMTP / Slack / Discord. Use injected fetch factory / mock HTTP client.

### Required areas

- TeamsConnection domain state machine
- Vault credential type `teams-webhook`
- Vault validation (store + retrieve-before-send)
- Connections provider `TEAMS`
- URL/SSRF guard (hosts, query/`sig`, path, HTTPS, rejects)
- Production adapter success/failure mapping
- Credential resolver retrieve-at-send
- API lifecycle endpoints
- Delivery routing (explicit Teams only; default telegram unchanged)
- Catalog honesty (Teams active only when adapter bound; Push reserved)
- Diagnostics honesty (no secret leakage)
- Web UI settings (no URL render; backend-driven Connected)

### Regression

- Telegram
- Email
- Slack
- Discord
- PC-07
- PC-06
- Default Telegram-only routing
- Push remains reserved

Live Teams traffic is **FORBIDDEN** during implementation. Live Teams traffic belongs to future FIV.

---

## 16. Future FIV plan (not now)

FIV must eventually verify:

1. Real Teams credential provisioned through Connections → Vault.
2. Real production Workflows Incoming Webhook URL.
3. Operator test executed.
4. Production adapter reached.
5. HTTP **202** transport success observed (Connected criterion).
6. Customer-visible Teams message received in the target channel.
7. Connected state truthful.
8. Diagnostics truthful.
9. Secret non-disclosure (API/UI/logs/diagnostics/Git).
10. Telegram regression.
11. Email regression.
12. Slack regression.
13. Discord regression.
14. Default Telegram-only routing unchanged.
15. Teams active only after successful verification / adapter binding honesty.
16. Push still reserved.
17. Repository integrity.

Do **not** perform FIV now. Do **not** contact Teams now. Do **not** request credentials now.

---

## 17. External prerequisites (identify only)

For later implementation/FIV (do not create now):

- Microsoft account / Microsoft 365 tenant with Teams
- Teams team + channel (or chat, if PO later accepts chat templates — **channel is the CM-15 default target**)
- Permissions to create Workflows in Teams / Power Automate
- Ability to use **Send webhook alerts to a channel** (or equivalent) with URL-secret trigger access compatible with CM-15 (no OAuth bearer requirement)
- Operator-created webhook URL (including `sig`)
- Credential provisioning through Connections/Vault
- Customer-visible Teams test message for FIV
- Awareness of workflow ownership / co-owner continuity (orphan-flow risk)

No credentials requested by this package. No external provider calls made for this package.

---

## 18. Risks and mitigations

| Risk                                              | Mitigation (planning level)                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Microsoft platform changes / connector retirement | Scope CM-15 to **Workflows Incoming Webhook**; reject retired `*.webhook.office.com`; document platform distinction                |
| Webhook URL host family migration                 | CM-15 accepts **only** `<env>.<region>.environment.api.powerplatform.com`; reject retired `logic.azure.com` / `webhook.office.com` |
| Tenant admin restrictions / OAuth-only triggers   | Document prerequisite; fail closed on 401; do not add OAuth in CM-15                                                               |
| Payload format mismatch                           | CM-15 ships **only** `{"text"}`; Adaptive Card/MessageCard out of scope; FIV verifies customer-visible post                        |
| HTTP 202 accepted but flow fails later            | Connected = transport accepted (202 only); FIV requires customer-visible message; diagnostics remain honest                        |
| SSRF via broad Azure hosts                        | Fail-closed §5.4 host/path/query; reject `logic.azure.com` / `webhook.office.com`; no DNS immunity claim                           |
| Secret leakage via query/`sig`                    | Treat full URL as secret; never log/return/render; redact errors                                                                   |
| False Connected state                             | Bind ≠ Connected; Vault/Connections validate ≠ Connected; Connected only after approved test send                                  |
| Default routing changes                           | Explicit prohibition; regression tests for telegram-only default                                                                   |
| Accidental catalog activation by planning docs    | Planning package does not change code; catalog flip only at implementation after approval                                          |
| Scope creep into Bot/Graph/OAuth                  | Explicit OUT OF SCOPE; STOP if PO wants different mechanism                                                                        |
| Orphaned workflow if owner leaves                 | External prerequisite: co-owners / durable operator account; document in FIV prep                                                  |
| Protected leftovers disturbed                     | Leftovers listed; must remain untouched                                                                                            |
| Prisma scope creep                                | Snapshot persistence preferred; dedicated table forbidden unless separate planning act                                             |

---

## 19. Technical debt

```text
TD-049 = OPEN / NON-BLOCKING
TD-050 = OPEN / NON-BLOCKING
```

| Debt                                  | Blocks CM-15 planning? | Notes                                                                                                                                                        |
| ------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TD-049 Telegram production Bot API    | **No**                 | Unrelated; do not remediate or close in CM-15                                                                                                                |
| TD-050 Reserved notification channels | **No**                 | Teams residual is exactly what CM-15 addresses later; full TD-050 remains open until remaining reserved channels ship or PO accepts reserved at Wave 5 close |

No new technical debt entries are created by this Planning Package.

---

## 20. Master Plan / Execution Roadmap

```text
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
```

Sequence remains:

```text
CM-13 Slack → CM-14 Discord → CM-15 Teams → CM-16 Push
```

No new node. No W5-N30 / V3-N30 / CM-37.

---

## 21. Architecture reuse summary

### A. Reusable — ESTABLISHED

```text
Connections → Vault → provider Connection domain
→ production adapter → product API → web UI
→ explicit delivery routing → truthful diagnostics
→ FIV customer-visible production verification
```

- Notification Delivery owner
- PC-06 / PC-07 honesty model
- Vault retrieve-at-send + C8
- Fail-closed Connected semantics
- Snapshot persistence pattern
- SSRF fail-closed posture class
- `/v1/{channel}/connection|bind|test|disconnect|diagnostics` product shape
- Default Telegram-only routing

### B. Provider-specific Teams components — FROZEN contract + PROPOSED Nest wiring names

- Connections `TEAMS` (FROZEN)
- `HoldableSecretType.TeamsWebhook` = `teams-webhook` (FROZEN)
- Teams URL guard implementing §5.4 exactly (FROZEN)
- `TeamsConnection` domain (PROPOSED name; ESTABLISHED pattern)
- `TeamsWebhookCredentialResolver` (PROPOSED name)
- `ProductionTeamsWebhookNotificationAdapter` + `TEAMS_CHANNEL_ADAPTER` (PROPOSED names)
- Payload `{"text"}` + success HTTP **202** (FROZEN)
- `/v1/teams/*` + `/notifications/channels/teams` (PROPOSED surfaces; ESTABLISHED shape)
- Catalog activation for Teams only at implementation time

### C. Must NOT change

- Master Plan / Execution Roadmap
- Foundation W5-N03 reopen
- Telegram / Email / Slack / Discord production behavior
- Default Telegram-only routing
- Push reserved state (until CM-16)
- Fail-closed secret non-disclosure
- No Bot/Graph/OAuth substitution without separate PO authorization

---

## 22. Mandatory Questions

1. **What exactly is CM-15?**
   V3-N03 capability **CM-15 Microsoft Teams** — production Incoming Webhook operator Connect / Test / Status / notification delivery.

2. **Why is CM-15 the next slice?**
   Execution Roadmap V3-N03 lists CM-13, CM-14, CM-15; CM-13 and CM-14 are CLOSED; CM-15 is next; CM-16 Push follows as V3-N04.

3. **What authoritative artifacts prove this?**
   `v3-execution-roadmap.md`, `v3-capability-inventory.md`, `v3-readiness-dashboard.md`, `wave-5-planning-summary.md`, Discord final close / planning package, Master Plan Wave 5 operator experience.

4. **What is the exact Microsoft Teams capability being planned?**
   Production Microsoft Teams Workflows Incoming Webhook notification delivery (Anyone + SAS URL on Power Platform host), not Bot/Graph/OAuth/legacy connectors.

5. **Is Incoming Webhook currently supported for the intended use?**
   **Yes** via Workflows / Power Automate Incoming Webhook templates/triggers. Legacy Connectors retired (2026-05-22). `logic.azure.com` Power Automate Teams webhook URLs stopped 2025-11-30.

6. **What exact Teams webhook mechanism is intended?**
   Workflows trigger **When a Teams webhook request is received** / template **Send webhook alerts to a channel**, auth **Anyone**, host `<env>.<region>.environment.api.powerplatform.com`.

7. **What is the canonical URL format?**
   HTTPS invoke URL per §5.4 Form A/B path + mandatory SAS query (`api-version`,`sp`,`sv`,`sig`). **FROZEN**.

8. **What exact host allowlist is required?**
   Exact two-label hostname `<env>.<region>.environment.api.powerplatform.com` (§5.4). Reject `logic.azure.com`, `webhook.office.com`, IP/localhost/private/metadata, deeper arbitrary prefixes. **FROZEN**.

9. **What HTTP method is required?**
   **POST**.

10. **What payload format is required?**
    **Only** JSON `{"text":"<non-empty string ≤4000>"}`. Adaptive Cards / MessageCards out of scope. **FROZEN**.

11. **What is the approved success HTTP status?**
    **HTTP 202 only**. No other 2xx. Transport accepted ≠ customer-visible delivery (FIV). **FROZEN**.

12. **What are relevant error conditions?**
    Guard failures, timeout, redirect, 401/403, 404/410, 429, 5xx, network/TLS, invalid response — mapped to `teams_webhook_*` stable codes.

13. **What is the timeout?**
    Proposed **10_000 ms**.

14. **Should redirects be rejected?**
    **Yes** (`redirect: 'error'`).

15. **What SSRF controls are required?**
    Exact §5.4 / §8 fail-closed guard (HTTPS; host regex; path Form A/B; query allowlist; reject IP/localhost/private/metadata/userinfo/fragment; redirect error; 10s; no URL disclosure; no DNS immunity claim). **FROZEN**.

16. **What Vault credential type is proposed?**
    `HoldableSecretType.TeamsWebhook = 'teams-webhook'`, purpose Notification, field `webhookUrl`.

17. **What Connections provider is proposed?**
    `TEAMS` / NOTIFICATION / display name `Microsoft Teams Incoming Webhook` / credential field `webhookUrl`.

18. **What TeamsConnection state machine is proposed?**
    `not-connected → bind → pending → successful test → connected`; failure → pending; disconnect → not-connected.

19. **What API endpoints are proposed?**
    `GET/POST /v1/teams/connection|bind|test|disconnect|diagnostics` as specified in §13.

20. **What UI surface is proposed?**
    `/notifications/channels/teams` settings consuming API truth; Connections link for credentials; no URL display.

21. **What persistence model is proposed?**
    Notification-delivery snapshot `teams: TeamsConnection[]`.

22. **Is a Prisma migration required?**
    **No** (preferred / expected). Dedicated table not authorized by this package.

23. **What automated tests are required?**
    Domain, Vault, Connections, SSRF guard, adapter, resolver, API, routing, catalog, diagnostics, UI — with mocks only.

24. **What regressions are required?**
    Telegram, Email, Slack, Discord, PC-07, PC-06, default Telegram-only routing, Push reserved.

25. **What external prerequisites are required?**
    Tenant/team/channel, Workflows webhook with URL-secret access, Connections/Vault provisioning, customer-visible FIV message.

26. **Does TD-049 block CM-15?**
    **No** (OPEN, non-blocking).

27. **Does TD-050 block CM-15?**
    **No** (OPEN, non-blocking).

28. **Does default routing remain Telegram-only?**
    **Yes**.

29. **Does Push remain reserved?**
    **Yes**.

30. **What exactly remains out of scope?**
    Bot/Bot Framework/Gateway/Graph subscriptions/OAuth delivery/inbound events/WebSocket/chat ingestion/user sync/interactive commands/scheduler/retry/new architectures/Prisma Teams table/Master Plan/Roadmap changes/CM-16.

31. **What must be verified during future FIV?**
    See §16 (17 items), including real webhook, approved HTTP success, customer-visible message, regressions, Push reserved, repo integrity.

32. **What remains unresolved and requires Planning Review?**
    **None for the six transport-contract blockers.** Those items are **FROZEN** in §5.0–§5.8. Remaining non-blockers are normal later gates: Planning Approval, Planning Repository Synchronization, implementation naming details, FIV environment readiness, and tenant policy checks during FIV.

---

## 23. Required Non-Declarations

- CM-13 remains CLOSED.
- CM-14 remains CLOSED.
- CM-15 is NOT implemented.
- CM-15 is NOT approved for implementation.
- CM-15 is NOT FIV-ready.
- CM-15 is NOT CLOSED.
- CM-16 remains reserved / not started.
- Wave 5 remains NOT COMPLETE.
- TD-049 remains OPEN.
- TD-050 remains OPEN.
- Master Plan remains unchanged.
- Execution Roadmap remains unchanged.
- No new Wave 5 node created.
- No W5-N30.
- No V3-N30.
- No CM-37.
- No external Teams credential was requested or used.
- No external Teams call was made.
- No implementation was performed.
- No FIV was performed.
- No Planning Approval was granted.
- No repository synchronization was performed.

---

## 24. Planning Approval readiness (post-remediation)

```text
READY FOR PLANNING APPROVAL
```

Rationale: the six former Approval blockers are **FROZEN** from current Microsoft documentation:

1. Authentication = Anyone (URL/SAS credential; no OAuth)
2. Host = exact `<env>.<region>.environment.api.powerplatform.com`; reject `logic.azure.com` / `webhook.office.com`
3. Path = Form A / Form B invoke grammars (both current)
4. Query = mandatory only `api-version`,`sp`,`sv`,`sig` (no `tenantId`/`environmentName`); preserve exactly; never log
5. Payload = single `{"text":...}`
6. Success HTTP status = **202 only** (transport accepted ≠ customer-visible delivery)

Architecture, API/UI, Vault/Connections, routing, persistence, tests, FIV, and debt remain consistent with CM-13/CM-14.

This remediation does **not** grant Planning Approval. A separate Product Owner Planning Approval review is required.

---

## 25. STOP Gate

```text
CM-15 Planning Package remediated.
Transport-contract blockers FROZEN.
READY FOR PLANNING APPROVAL.
Planning Approval is NOT granted by this remediation.
Implementation and FIV are NOT authorized.
No repository synchronization was performed.
STOP.
```
