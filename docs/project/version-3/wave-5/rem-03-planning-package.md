# REM-03 Planning Package — Telegram Production Truthfulness

**Document:** REM-03 Planning Package — Status, Test, Disconnect & Channel Presentation
**Date:** 2026-09-14
**Label:** REM-03 (remediation / slice planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner Planning Package (preceding planning analysis Planning Review **PASS**; Planning Approval **PASS** — this synchronization)
**Owner:** Notification Delivery (projection consumed by telegram-product / notification-product / product-flow / web)
**Predecessor:** Live Telegram verification CLOSED / SYNCHRONIZED
**Planning analysis:** [`next-slice-planning-analysis.md`](./next-slice-planning-analysis.md)

**Live verification evidence commit (HEAD):** `860f63030f048c6dc22b51428355a1bdc3da4d4f` — `docs(wave-5): record live Telegram verification evidence`

```text
PLANNING APPROVED
IMPLEMENTATION NOT AUTHORIZED
Official package ID = NOT CREATED
REM-03 planning approval = PASS
```

---

## Lifecycle

| State               | REM-03                   |
| ------------------- | ------------------------ |
| **PLANNED**         | **YES**                  |
| **PLANNING REVIEW** | **PASS**                 |
| **APPROVED**        | **PASS** (planning only) |
| **IMPLEMENTED**     | **NO**                   |
| **VERIFIED**        | **NO**                   |
| **CLOSED**          | **NO**                   |

Implementation authorization is **not** granted by this package.

REM-03 remains a **planning label**. This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

---

## 1. Executive summary

Production Telegram delivery is already closed and live-verified. Nest binds `TELEGRAM_CHANNEL_ADAPTER` to `ProductionTelegramBotApiAdapter`. Operators can connect, bind a real chat, send a real test message, and disconnect.

The remaining defect is **presentation truthfulness**. Production-facing projections still freeze:

```text
transport: 'in-memory'
botApiUsed: false
```

The frontend then hard-codes the same story (“Transport is in-memory — Bot API is not used”).

This slice changes **projection mapping and UI rendering only**. It derives `transport` and `botApiUsed` from the adapter actually bound:

| Bound adapter                            | `transport` / `telegramTransport` | `botApiUsed` |
| ---------------------------------------- | --------------------------------- | ------------ |
| `ProductionTelegramBotApiAdapter`        | `'bot-api'`                       | `true`       |
| `InMemoryTelegramAdapter` (test harness) | `'in-memory'`                     | `false`      |

No send-path, Vault, chat-bind, disconnect-behavior, schema, dependency, route, Master Plan, or Execution Roadmap change is in scope.

```text
Slice type: projection + UI honesty
Minimum production runtime change: NOT REQUIRED
New HTTP routes: NOT REQUIRED
Prisma migration: NOT REQUIRED
New dependency: NOT REQUIRED
Live Telegram in tests: FORBIDDEN
```

---

## 2. Baseline

Verified at package writing (read-only):

| Check                       | Result                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `git rev-parse HEAD`        | `860f63030f048c6dc22b51428355a1bdc3da4d4f`                         |
| `git rev-parse origin/main` | `860f63030f048c6dc22b51428355a1bdc3da4d4f`                         |
| `HEAD == origin/main`       | **YES**                                                            |
| Latest commit               | `860f630 docs(wave-5): record live Telegram verification evidence` |

Product Owner operational baseline (consumed, not re-declared):

```text
V3-N01 = PASS
J3-06 = VERIFIED
REM-01-s1 = CLOSED
REM-01-s2 = CLOSED
REM-02 = CLOSED
Production Telegram Operator Test-Message slice = CLOSED
Live Telegram verification = CLOSED and synchronized
Wave 5 = NOT COMPLETE
TD-049 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
```

This package does **not** reopen those closed slices. It does **not** complete Wave 5.

---

## 3. Problem statement

```text
PRODUCTION RUNTIME                 PRODUCTION-FACING PRODUCT
─────────────────────────────      ─────────────────────────────
ProductionTelegramBotApiAdapter    transport: 'in-memory'
HTTPS sendMessage (live PASS)      botApiUsed: false
Customer received test message     UI: "Bot API is not used"
```

Status, chat-bound, last delivery outcome, and disconnect availability are already derived from `TelegramConnection` and `DeliveryResult`. Those fields are **not** the defect.

The defect is that honesty fields are **compile-time literals**, not the bound adapter. That misrepresents a production Telegram connection after V3-N01 / J3-06 already passed.

Do **not** fix this by globally hard-coding `botApiUsed: true`. Isolated tests override `TELEGRAM_CHANNEL_ADAPTER` to `InMemoryTelegramAdapter` and must continue to project in-memory.

---

## 4. Existing architecture

Reuse only. Do not invent a second transport SoT.

```text
NotificationDeliveryModule
  TELEGRAM_CHANNEL_ADAPTER → ProductionTelegramBotApiAdapter   (production)
  InMemoryTelegramAdapter remains exported (test double)
  bindInMemoryTelegramChannelForTests() overrides the token

TelegramProductModule
  injects NOTIFICATION_SERVICE_PORT
  maps TelegramConnection / DeliveryResult → PC-07 views
  does NOT currently inspect TELEGRAM_CHANNEL_ADAPTER

NotificationProductModule
  same owner read path for settings / channels / deliveries

ProductFlowModule
  toChannelDeliveryView nested into delivery detail / test views
```

Authoritative lifecycle (unchanged by this slice):

```text
connect → pending + connectionToken
Vault botToken via Connections (separate owner)
complete → observePendingTelegramBind → numeric chatId
status / chatBound / *Available derived from TelegramConnection
POST /v1/telegram/test → deliver → ProductionTelegramBotApiAdapter.send
disconnect → not-connected; chatId cleared; Vault secret NOT revoked
```

Existing JSON already contains `transport`, `telegramTransport`, and `botApiUsed`. They are the wrong constants. **No new route is required.**

`NotificationDeliveryModule` already **exports** `TELEGRAM_CHANNEL_ADAPTER`. Telegram-product and notification-product already import that module. Product-flow already imports it. Injection of the bound adapter into product services is an existing Nest graph, not a new bounded context.

---

## 5. Exact affected modules / files

### 5.1 Backend projection (must change)

| File                                                                         | Hard-coded today                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/api/src/modules/telegram-product/telegram.view.ts`                     | `transport: 'in-memory'`; `botApiUsed: false` on connection, connect, test, diagnostics |
| `apps/api/src/modules/telegram-product/telegram-product.service.ts`          | Calls view mappers without adapter class                                                |
| `apps/api/src/modules/notification-product/notification.view.ts`             | `toTelegramStatusView` `transport: 'in-memory'`                                         |
| `apps/api/src/modules/notification-product/notification-channel.view.ts`     | Telegram `transport: 'in-memory'`, `botApiUsed: false`, `liveTransportActivated: false` |
| `apps/api/src/modules/notification-product/notification-product.service.ts`  | Calls view mappers without adapter class                                                |
| `apps/api/src/modules/product-flow/channel-delivery.view.ts`                 | `telegramTransport: 'in-memory'`; `botApiUsed: false`                                   |
| `apps/api/src/modules/product-flow/notification-channel-dispatch.service.ts` | Builds `toChannelDeliveryView` without adapter class                                    |

### 5.2 Adapter classifier (new small helper on existing owner — no new module)

Exact filename chosen at implementation; must live beside existing telegram adapters / port, for example:

```text
apps/api/src/modules/notification-delivery/domain/telegram-transport-projection.ts
```

or equivalent next to `ports/notification.port.ts`.

Responsibility: classify the **already injected** `TELEGRAM_CHANNEL_ADAPTER` instance.

```text
ProductionTelegramBotApiAdapter → { transport: 'bot-api', botApiUsed: true }
InMemoryTelegramAdapter         → { transport: 'in-memory', botApiUsed: false }
```

Must **not** call `send`, `getMe`, `getUpdates`, or `SecretVaultService.retrieve`.

### 5.3 Frontend (must change)

| File                                                    | Hard-coded today                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/shared/api.ts`                            | Client types freeze `transport: 'in-memory'` and `botApiUsed: false`                |
| `apps/web/src/telegram/TelegramSettingsView.tsx`        | Copy “Transport is in-memory — Bot API is not used”; Facts “In-memory” / “Not used” |
| `apps/web/src/notifications/NotificationDetailView.tsx` | “Bot API was not used.”                                                             |

### 5.4 Module README (in-scope docs honesty)

| File                                              | Hard-coded today                          |
| ------------------------------------------------- | ----------------------------------------- |
| `apps/api/src/modules/telegram-product/README.md` | “In-memory adapter”; “Forbidden: Bot API” |

Optional if implementation stays strictly customer-facing; include if the same module still documents a forbidden Bot API. Keep control-plane forbid.

### 5.5 Tests (must change — no live I/O)

| File                                                                                  | Current assertion                                          |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/telegram-product/telegram.view.spec.ts`                         | `botApiUsed === false`, `transport === 'in-memory'`        |
| `apps/api/src/modules/telegram-product/telegram-product.service.spec.ts`              | `test.botApiUsed === false`                                |
| `apps/api/src/modules/telegram-product/telegram.controller.spec.ts`                   | fixture literals                                           |
| `apps/api/src/validation/m2/pc07-telegram-product.integration.spec.ts`                | `status.botApiUsed === false`, `test.botApiUsed === false` |
| `apps/api/src/validation/m2/pc07-notification-channels.integration.spec.ts`           | telegram `botApiUsed === false`                            |
| `apps/api/src/modules/notification-product/notification.view.spec.ts`                 | `channelDelivery.botApiUsed === false`                     |
| `apps/api/src/modules/notification-product/notification-channel.view.spec.ts`         | telegram `botApiUsed === false`                            |
| `apps/api/src/modules/product-flow/channel-delivery.view.spec.ts`                     | `botApiUsed === false`                                     |
| `apps/api/src/modules/product-flow/notification-channel-dispatch.service.spec.ts`     | `projection.botApiUsed === false`                          |
| `apps/api/src/validation/m2/pc15-e-notification-channels-product.integration.spec.ts` | `projection.botApiUsed === false`                          |
| `apps/web/src/telegram/TelegramPage.spec.tsx`                                         | “Not used”; in-memory fixtures                             |
| `apps/web/src/notifications/NotificationPage.spec.tsx`                                | “Bot API was not used”                                     |
| `apps/web/src/notifications/NotificationChannelsPage.spec.tsx`                        | fixture literals                                           |

Plus a small classifier unit spec next to the helper.

### 5.6 Do not modify (runtime / security / closed slices)

Delivery service send/bind/disconnect, Vault, adapters’ `send`/`getMe`/`getUpdates`, HTTP client, Prisma, Master Plan, Execution Roadmap, leftover untracked mocked live-spec, reserved-channel activation.

---

## 6. Proposed implementation boundary

```text
IN:
  classify bound TELEGRAM_CHANNEL_ADAPTER
  pass classification into existing view mappers
  widen TypeScript literals on existing JSON fields
  render those fields in production-facing UI
  update tests to match bound adapter

OUT:
  adapter send/bind/Vault/disconnect behavior
  new routes, schema, dependencies, secrets, package IDs
```

**Deviation rule:** If implementation discovers that existing projections cannot expose `transport` / `botApiUsed` without a new route, schema, or dependency, **stop and return to Product Owner**. Current repository analysis does **not** predict that deviation: the fields already exist on the current contracts.

View mappers stay pure functions. Product services (`TelegramProductService`, `NotificationProductService`, `NotificationChannelDispatchService`) inject `TELEGRAM_CHANNEL_ADAPTER` (already exported) and pass `{ transport, botApiUsed }` into mappers. Do not read adapter class inside React.

`transport` describes the **bound adapter class even when status is `not-connected`**. Disconnect unbinds chat; it does not swap the Nest adapter.

Telegram channel `liveTransportActivated` follows the same classifier for the telegram card only (`true` iff production adapter). Reserved channels stay `false` / `transport: 'none'`.

---

## 7. Backend changes

Later authorized implementation (not now):

1. Add a read-only classifier over `NotificationChannelPort` / concrete adapter classes.
2. Change view mapper signatures to accept the classifier result instead of literals.
3. Inject `TELEGRAM_CHANNEL_ADAPTER` into:
   - `TelegramProductService`
   - `NotificationProductService`
   - `NotificationChannelDispatchService` (or pass through from a single helper used by `toChannelDeliveryView` callers)
4. Widen types:

```text
transport: 'in-memory' | 'bot-api'          // connection / telegram status
telegramTransport: 'in-memory' | 'bot-api'  // diagnostics / channel delivery
botApiUsed: boolean
liveTransportActivated: boolean             // telegram card only; reserved remain false
```

5. Keep unchanged: `controlPlane: false`, `userEnteredBind: false`, omission of `chatId` / `connectionToken` (except pending deepLink), status / `chatBound` / `*Available` derivation, disconnect domain function.

No controller route changes. No DTO request changes. No Vault calls on GET status / diagnostics.

---

## 8. Frontend changes

Later authorized implementation (not now):

1. Widen `apps/web/src/shared/api.ts` to match backend field types. This is the **only** client contract. Do not invent a second frontend transport flag.
2. `TelegramSettingsView`:
   - Intro copy must not assert in-memory / Bot API unused.
   - Transport fact = `connection.transport` (label `bot-api` → “Bot API”; `in-memory` → “In-memory”).
   - Last-test Bot API fact = `lastTest.botApiUsed` (and/or nested `channelDelivery.botApiUsed`).
   - Diagnostics Transport / Bot API = `diagnostics.telegramTransport` / `diagnostics.botApiUsed`.
3. `NotificationDetailView`: replace always-“Bot API was not used” with `record.channelDelivery.botApiUsed`.
4. Keep control-plane copy, “chat id is never entered”, wizard actions, and `*Available` gating.
5. Leave `TelegramHistoryView` page-scope sentence (“history page does not send / call Bot API”) — it describes the page, not the production adapter.

No new API client methods. Existing `getTelegramConnection` / `sendTelegramTest` / `getTelegramDiagnostics` / delivery detail already return the fields.

---

## 9. Test changes

Later authorized implementation (not now). **No `api.telegram.org`. No real token. No `fetch` to Telegram.**

| Case                                                         | Expect                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Classifier + production adapter instance                     | `transport: 'bot-api'`, `botApiUsed: true`                                          |
| Classifier + `InMemoryTelegramAdapter`                       | `transport: 'in-memory'`, `botApiUsed: false`                                       |
| View mappers given production projection                     | AC-01 / AC-02                                                                       |
| View mappers given in-memory projection                      | AC-03 / AC-04                                                                       |
| PC-07 HTTP with production-shaped product service            | status/test/disconnect JSON bot-api / true; still no `chatId` in JSON               |
| Harness `bindInMemoryTelegramChannelForTests`                | remains in-memory / false                                                           |
| Status / `chatBound` / `disconnectAvailable` / last delivery | unchanged vs domain                                                                 |
| Reserved channels                                            | `transport: 'none'`, `botApiUsed: false`                                            |
| Frontend with production-shaped fixtures                     | does not contain “Transport is in-memory — Bot API is not used”; shows Bot API used |
| Frontend with in-memory fixtures                             | may still show In-memory / not used                                                 |

Do not convert the leftover untracked `production-telegram-operator-test-message.spec.ts` into this slice.

---

## 10. API contract impact

**Yes — value widening of existing fields. No new routes.**

| Surface                                                | Fields                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `GET /v1/telegram/connection`                          | `transport`, `botApiUsed`                                                            |
| `POST /v1/telegram/connect`                            | nested connection + top-level `botApiUsed`                                           |
| `POST /v1/telegram/complete`                           | connection `transport`, `botApiUsed`                                                 |
| `POST /v1/telegram/verify`                             | same                                                                                 |
| `POST /v1/telegram/disconnect`                         | same; status becomes `not-connected`; transport remains bound adapter                |
| `POST /v1/telegram/test`                               | top-level `botApiUsed` + `delivery.channelDelivery.botApiUsed` / `telegramTransport` |
| `GET /v1/telegram/diagnostics`                         | `telegramTransport`, `botApiUsed`                                                    |
| Notification settings / routing / delivery detail      | `telegram.transport`; channel-delivery honesty fields                                |
| Notification channels workspace / detail / diagnostics | telegram `transport`, `botApiUsed`, `liveTransportActivated`                         |

Request bodies unchanged. No client `chatId`. No version bump. Production JSON values **will** change; that is the honesty fix.

---

## 11. Persistence / schema impact

```text
Prisma migration: NOT REQUIRED
Schema change: NOT REQUIRED
TelegramConnection columns: UNCHANGED
DeliveryResult shape: UNCHANGED
Vault records: UNCHANGED
```

Transport class is the Nest bind, not a durable row. Do not persist `transport` / `botApiUsed`.

---

## 12. Dependency impact

```text
New npm / workspace dependency: NOT REQUIRED
New Nest module: NOT REQUIRED
New HTTP client: NOT REQUIRED
New Telegram library: NOT REQUIRED
```

Classifier uses existing concrete adapter classes already in `notification-delivery`.

---

## 13. Security impact

Projection-only.

| Control                              | Requirement                                       |
| ------------------------------------ | ------------------------------------------------- |
| Token retrieve for presentation      | **FORBIDDEN**                                     |
| Token / ciphertext in JSON, UI, logs | **FORBIDDEN**                                     |
| Additional credentials               | **FORBIDDEN**                                     |
| Client-controlled `chatId`           | **FORBIDDEN** (still omitted; still not accepted) |
| C8 / VaultConnections                | **UNCHANGED**                                     |
| Workspace isolation                  | **UNCHANGED**                                     |
| `controlPlane: false`                | **UNCHANGED**                                     |
| Disconnect vs Vault revoke           | **UNCHANGED** (chat unbind only)                  |

Classifier may use `instanceof` / constructor identity. It must not read adapter internals that could contain a token (production adapter does not store the token today; do not add caching).

---

## 14. Regression risks

| Risk                                           | Mitigation                                             |
| ---------------------------------------------- | ------------------------------------------------------ |
| Hard-code `botApiUsed: true` globally          | Derive from bound adapter (AC-03 / AC-04)              |
| Frontend keeps hard-coded copy after API fix   | Same-slice UI change (AC-05)                           |
| Leak `chatId` while widening views             | Keep omit-chatId assertions (AC-06 / AC-08)            |
| Reserved channels flip to live                 | Telegram-only classifier; reserved stay `none` / false |
| Disconnect rewritten to revoke Vault           | Explicit non-goal                                      |
| Tests call Telegram                            | AC-07; no HTTP client in classifier                    |
| Honesty treated as new V3-N01 proof            | Do not re-send; do not reopen closed slices            |
| `liveTransportActivated` activates Email/Slack | Out of scope; reserved remain false                    |

Rollback: revert projection/UI/test commits. No data migration to undo.

---

## 15. Technical debt delta

```text
TD-048 = UNCHANGED
TD-049 = OPEN
TD-050 = UNCHANGED
Technical Debt Delta: NO REGISTER CLOSE
```

This slice **reduces** the known production-truthfulness gap (product no longer claims in-memory while production send uses Bot API).

It does **not** close TD-049. Register wording still names the historical in-memory certified path and Wave 5 remaining work (other channels / platform complete). Closing TD-049 would require a separate Product Owner act after evidence that the debt item’s **entire** scope is resolved. This package does not claim that.

No new debt ID is created.

---

## 16. Explicit non-goals

Do **not** implement:

- Telegram adapter send / HTTP / `getMe` / `getUpdates` changes
- Vault changes, credential provisioning, token cache, second secret store
- Chat binding algorithm; client-supplied `chatId`
- Deep-link `t.me` / `getMe` username UX
- Disconnect / Vault revoke / Connections credential delete
- Email, Slack, Discord, Teams, Push
- Retry / scheduler / webhook / `setWebhook`
- Metrics redesign
- TD-049 closure or debt-register rewrite
- Master Plan changes
- Execution Roadmap changes (including ticking V3-N01 checkboxes in that file)
- Wave 5 completion declaration
- Official package IDs (`W5-N30`, `V3-N30`, `CM-37`, …)
- New routes (unless Product Owner re-review after a proven existing-field impossibility — not expected)
- Reopening REM-01-s1 / REM-01-s2 / REM-02 / operator test-message / live verification
- Live Telegram calls in implementation or tests

---

## 17. Acceptance criteria

Testable. All must hold after a later authorized implementation.

### AC-01

Production Telegram projection reports `transport = 'bot-api'` (and `telegramTransport = 'bot-api'` where that field exists) when `TELEGRAM_CHANNEL_ADAPTER` is `ProductionTelegramBotApiAdapter`.

### AC-02

Production Telegram projection reports `botApiUsed = true` on connection, connect, complete, verify, disconnect (view), test, diagnostics, channel-delivery, and telegram channel cards when the production adapter is bound.

### AC-03

In-memory test projection remains `transport = 'in-memory'` when `TELEGRAM_CHANNEL_ADAPTER` is `InMemoryTelegramAdapter`.

### AC-04

In-memory test projection remains `botApiUsed = false` for that harness bind.

### AC-05

Frontend renders the authoritative backend values. Production-facing Telegram/notification/channel views contain **no** hard-coded assumption that Telegram uses in-memory transport or that Bot API is unused. The only source is the API payload.

### AC-06

Existing Telegram **status**, **chatBound**, **last delivery/test result** (delivery id / outcome / adapterReached), and **disconnect availability** remain derived from `TelegramConnection` / `DeliveryResult` as today. This slice does not change those rules.

### AC-07

No live Telegram API calls are introduced into tests (`api.telegram.org` not invoked; no real bot token).

### AC-08

No Vault, credential, `chatId` product-field, authorization, schema, dependency, Master Plan, or Execution Roadmap changes.

---

## 18. Validation plan

After implementation authorization (not now):

1. Unit: classifier production vs in-memory (AC-01…AC-04).
2. Unit: view mappers omit `chatId` / token; preserve `controlPlane: false`; preserve status / `chatBound` / `disconnectAvailable` (AC-06 / AC-08).
3. PC-07 / notification / channel-delivery / PC-15-e specs updated to bound adapter (AC-01…AC-04, AC-06).
4. Web: Telegram settings + notification detail render API values; production fixtures do not contain the in-memory hard-coded copy (AC-05).
5. Confirm test suite has no Telegram network I/O (AC-07).
6. `git diff` review: no Prisma, package.json, Vault, adapter `send`, Master Plan, Execution Roadmap (AC-08).
7. Do **not** send a live Telegram message to validate honesty.

FIV (later gate) repeats AC-01…AC-08 against the implementation commit. Live vendor round-trip is **not** an FIV requirement for this slice.

---

## 19. Governance gates

Do not skip.

| #   | Gate                                | Status now      |
| --- | ----------------------------------- | --------------- |
| 1   | Planning Package                    | **PASS**        |
| 2   | Product Owner Planning Review       | **PASS**        |
| 3   | Planning Approval                   | **PASS**        |
| 4   | Repository Synchronization          | **THIS ACT**    |
| 5   | Implementation authorization        | **NOT GRANTED** |
| 6   | Product Owner Implementation Review | N/A             |
| 7   | Repository Synchronization          | N/A             |
| 8   | FIV                                 | N/A             |
| 9   | Product Owner Final Close           | N/A             |
| 10  | Repository Synchronization          | N/A             |
| 11  | Close                               | N/A             |

```text
Wave 5 = NOT COMPLETE
V3-N01 = PASS (preserved)
J3-06 = VERIFIED (preserved)
TD-049 = OPEN
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
```

---

## 20. STOP conditions

Stop immediately and return to Product Owner if any of the following appears during a later authorized implementation:

- New HTTP route appears necessary
- Prisma / schema change appears necessary
- New runtime dependency appears necessary
- Token retrieve is required to compute `transport` / `botApiUsed`
- Chat id would be exposed
- Adapter `send` / bind / Vault / disconnect behavior would change
- Tests would call Telegram
- Scope expands to Email/Slack/Discord/Teams/Push, retry, webhook, or TD-049 close
- Official package ID is invented

This planning task stops here.

```text
PLANNING APPROVAL = PASS
REPOSITORY SYNCHRONIZATION = THIS ACT
IMPLEMENTATION AUTHORIZED = NO
OFFICIAL PACKAGE CREATED = NO
MASTER PLAN = UNCHANGED
EXECUTION ROADMAP = UNCHANGED
```

Do not implement. Do not call Telegram. Do not provision or retrieve credentials. Next gate after this synchronization is **Implementation authorization** — not granted.

---

**PLANNING APPROVAL: PASS**

**IMPLEMENTATION: NOT AUTHORIZED**

**STOP**
