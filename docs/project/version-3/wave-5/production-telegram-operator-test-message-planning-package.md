# Production Telegram Operator Test-Message Delivery — Planning Package

**Document:** Planning Package — Production Telegram Operator Test-Message Delivery
**Date:** 2026-09-14
**Label:** Production Telegram Operator Test-Message Delivery (remediation / slice planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner Planning Package (Planning Review PASS; Planning Approval recorded separately)
**Owner:** Notification Delivery
**Predecessor:** REM-02 CLOSED / SYNCHRONIZED
**Planning analysis:** [`next-slice-planning-analysis.md`](./next-slice-planning-analysis.md)

**REM-02 implementation commit:** `f7b7d50aaadedb9e3015c97d023fab763622b613` — `feat(rem-02): bind real Telegram chat`
**REM-02 Final Close commit:** `244b25b3636ad5a5e318a0eb01550a91c4e37d7a` — `docs(rem-02): close package`
**Planning discovery baseline (HEAD):** `244b25b3636ad5a5e318a0eb01550a91c4e37d7a`

```text
PLANNING APPROVED
IMPLEMENTATION NOT AUTHORIZED
Official package ID = NOT CREATED
```

---

## 0. Slice determination (mandatory)

Repository discovery supports **Outcome A**. This package concludes that explicitly.

```text
Outcome: A
Slice type: tests/evidence only
Minimum production code change: NOT REQUIRED
Minimum tests: REQUIRED (composed deterministic evidence; later implementation authorization)
Outcome B (minimum code + tests): NOT SELECTED
Outcome C (architectural change): NOT FOUND — do not escalate
```

```text
This slice is:
tests/evidence only
```

Production runtime already composes:

```text
POST /v1/telegram/test
  → TelegramProductService.sendTest
  → NotificationDeliveryService.sendTestNotification
  → deliver()
  → resolveDeliveryRoutes
  → TELEGRAM_CHANNEL_ADAPTER = ProductionTelegramBotApiAdapter
  → TelegramBotTokenResolver
  → SecretVaultService.retrieve
  → sendMessage { chat_id: TelegramConnection.chatId }
```

The unfinished gap is **deterministic composed proof**, not missing plumbing.

### Required-contents map (this artifact)

| Required item                         | Section |
| ------------------------------------- | ------- |
| Objective                             | §1      |
| Current baseline                      | §3      |
| Repository discovery                  | §4      |
| Existing capability                   | §6      |
| Identified gap                        | §7      |
| Proposed smallest implementation      | §8      |
| Architecture                          | §9      |
| Files/components                      | §10     |
| Tests                                 | §11     |
| Security                              | §12     |
| Credential boundary                   | §13     |
| Live verification boundary            | §14     |
| Schema determination                  | §15     |
| PC-06 / PC-07 impact                  | §16     |
| REM-03 boundary                       | §17     |
| Technical debt                        | §18     |
| Risks                                 | §19     |
| Rollback                              | §20     |
| Explicit non-declarations             | §21     |
| Acceptance criteria                   | §22     |
| Implementation authorization boundary | §23     |
| Q1–Q10                                | §5      |

---

## 1. Objective

Prove, with **mocked / deterministic** Telegram Bot API responses, that the existing operator test path invokes production Telegram notification delivery using the already-bound numeric `TelegramConnection.chatId`.

```text
I connect Telegram and receive a real test message.
```

This slice contributes toward that unchanged Master Plan / V3-N01 outcome. It does **not** declare the outcome complete. It does **not** prove that Telegram actually received a message.

```text
POST /v1/telegram/test
        ↓
TelegramProductService.sendTest
        ↓
NotificationDeliveryService.sendTestNotification / deliver
        ↓
resolveDeliveryRoutes
        ↓
TELEGRAM_CHANNEL_ADAPTER = ProductionTelegramBotApiAdapter
        ↓
TelegramBotTokenResolver
        ↓
SecretVaultService.retrieve
        ↓
Telegram Bot API sendMessage
        ↓
numeric bound TelegramConnection.chatId
```

HTTP surface discovered in repository: `TelegramController` `@Controller({ path: 'telegram', version: '1' })` + URI versioning in `apps/api/src/main.ts` → **`POST /v1/telegram/test`**. Planning uses that exact path. The shorthand `POST /telegram/test` refers to the same controller action.

Exact production send-chain files:

```text
apps/api/src/modules/telegram-product/telegram.controller.ts
  POST test  (sendTest; no body; no chat id)
apps/api/src/modules/telegram-product/telegram-product.service.ts
  sendTest → sendTestNotification(actor)
apps/api/src/modules/notification-delivery/notification-delivery.service.ts
  sendTestNotification → deliver
  deliver → getTelegramConnection.chatId → resolveDeliveryRoutes → telegram.send
apps/api/src/modules/notification-delivery/routing/resolve-delivery-routing.ts
apps/api/src/modules/notification-delivery/notification-delivery.module.ts
  TELEGRAM_CHANNEL_ADAPTER useExisting ProductionTelegramBotApiAdapter
apps/api/src/modules/notification-delivery/adapters/telegram-bot-api.adapter.ts
  send → parseProductionTelegramChatId → resolver → dispatchSendMessage
apps/api/src/modules/notification-delivery/adapters/telegram-bot-token.resolver.ts
  SecretVaultService.retrieve HoldableSecretType.Telegram / notification
apps/api/src/modules/notification-delivery/adapters/telegram-bot-api.http.ts
  POST sendMessage { chat_id, text }
apps/api/src/modules/notification-delivery/domain/telegram-connection.ts
  durable TelegramConnection.chatId
```

---

## 2. Package identity

```text
Descriptive name:
Production Telegram Operator Test-Message Delivery
Official package ID:
NOT CREATED
```

Repository discovery found **no** authoritative post-W5-N29 package-ID allocation. Master Plan / Execution Roadmap / Wave 5 binding sequence do not name `W5-N30`, `V3-N30`, or `CM-37`. This package does **not** invent those IDs.

```text
W5-N01…N29 = CLOSED (do not reopen)
REM-01-s1   = CLOSED (do not reopen)
REM-01-s2   = CLOSED (do not reopen)
REM-02      = CLOSED (do not reopen)
```

---

## 3. Current baseline

| Item                | State                                      |
| ------------------- | ------------------------------------------ |
| HEAD                | `244b25b3636ad5a5e318a0eb01550a91c4e37d7a` |
| origin/main         | `244b25b3636ad5a5e318a0eb01550a91c4e37d7a` |
| HEAD == origin/main | **YES**                                    |
| Master Plan         | UNCHANGED / authoritative                  |
| Execution Roadmap   | UNCHANGED / authoritative                  |
| Wave 5              | NOT COMPLETE                               |
| J3-06               | NOT DECLARED PASS                          |
| V3-N01 exit         | NOT DECLARED PASS                          |

REM-02 provides: real Telegram-observed `chat.id`, connection-token matching, workspace/user isolation, durable chat binding, PC-07 production complete observation, on-demand `getUpdates` `timeout=0`.

REM-01-s2 provides: async delivery, Vault retrieve-at-send, authenticated actor propagation, Nest bind of `ProductionTelegramBotApiAdapter`, `sendMessage` capability.

---

## 4. Repository discovery

Inspected without modifying source:

| Surface             | Location                                                  | Finding                                                                                                                                                                |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operator test HTTP  | `telegram.controller.ts` `POST test`                      | No request body. No chat-id parameter. Workspace from `X-Workspace-Id`. Actor from JWT. Permission `OwnWorkspace` (C2).                                                |
| Product adapter     | `telegram-product.service.ts` `sendTest`                  | Delegates `sendTestNotification` with `actorUserId` / `actorRole`. Does not call `deliver()` directly. Chat id never a product field.                                  |
| Test notification   | `notification-delivery.service.ts` `sendTestNotification` | Calls `deliver()` with type `daily-report`, fixed subject/body, optional actor.                                                                                        |
| Delivery            | `deliver()`                                               | Loads `TelegramConnection` from store; `resolveDeliveryRoutes`; if telegram not skipped, `telegram.send({ chatId: telegram.chatId!, …actor })`.                        |
| Routing             | `resolve-delivery-routing.ts`                             | Sends telegram when prefs enabled, type enabled, telegram channel enabled, and `status === 'connected' && Boolean(chatId)`. Else skip (`channel-not-connected`, etc.). |
| Nest bind           | `notification-delivery.module.ts`                         | `TELEGRAM_CHANNEL_ADAPTER` → `useExisting: ProductionTelegramBotApiAdapter`. `InMemoryTelegramAdapter` remains a provider / test double.                               |
| Production adapter  | `telegram-bot-api.adapter.ts`                             | `send()` parses production chat id, retrieves token, `dispatchSendMessage` POSTs `sendMessage` `{ chat_id, text }`.                                                    |
| Token resolver      | `telegram-bot-token.resolver.ts`                          | `SecretVaultService.retrieve` type Telegram, purpose notification. Missing actor → fail closed, no retrieve.                                                           |
| Chat id domain      | `telegram-connection.ts`                                  | `TelegramConnection.chatId` persisted via existing store / durable snapshot.                                                                                           |
| Production guard    | `production-telegram-chat-id.ts`                          | Numeric `/^-?\d+$/` only. Rejects empty, `in-memory:*`, non-numeric.                                                                                                   |
| HTTP client         | `telegram-bot-api.http.ts`                                | Injected `fetch` (default global). Tests already substitute a mock fetch.                                                                                              |
| Error mapping       | `telegram-bot-api.errors.ts`                              | Stable codes; secret redaction helpers.                                                                                                                                |
| PC-07 views         | `telegram.view.ts`                                        | Still `botApiUsed: false`, `transport: 'in-memory'`. Out of this slice (REM-03).                                                                                       |
| PC-06               | `notification-product` + `resolveDeliveryRoutes`          | Settings/history HTTP. Routing already consumed by `deliver()`. Not the next blocker.                                                                                  |
| Preferences default | `user-notification-preferences.ts`                        | Telegram channel default enabled; `daily-report` type default enabled. Operator test type is `daily-report`.                                                           |

### Existing tests (not a composed production send proof)

| Test                                        | What it proves                                                                     | What it does not prove                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `telegram-production-binding.spec.ts`       | Nest binds production adapter                                                      | No `sendTest` / no `sendMessage`                                                                |
| `telegram-bot-api.adapter.spec.ts`          | Direct `send()` / `sendMessage` with numeric fixture + mock fetch + Vault resolver | Not through `deliver()` / not through persisted `TelegramConnection`                            |
| `telegram-bot-token.resolver.spec.ts`       | Retrieve-at-send + fail closed                                                     | No delivery path                                                                                |
| `rem-02-telegram-chat-bind.spec.ts`         | Numeric bind via mocked `getUpdates`                                               | Uses `InMemoryTelegramAdapter`; does not `sendTest` after bind                                  |
| `notification-delivery.spec.ts`             | Full connect/test/disconnect workflow                                              | Overrides adapter to InMemory; binds `chat-auto-42` (non-numeric; production send would reject) |
| `telegram.controller.spec.ts`               | Actor passed into `sendTest`; workspace header / foreign workspace                 | Product service mocked                                                                          |
| `pc07-telegram-product.integration.spec.ts` | HTTP product calls `sendTestNotification` with actor; no client chat id            | `sendTestNotification` is a stub; `deliver` not called                                          |
| `telegram-product.service.spec.ts`          | Same as PC-07 at service layer                                                     | Stubbed port                                                                                    |
| Isolated delivery harness                   | `bindInMemoryTelegramChannelForTests`                                              | Intentionally **replaces** production adapter                                                   |

### Mocked Bot API infrastructure already present

- `TelegramBotApiHttpClient` constructor accepts a fetch function.
- Adapter / observer / HTTP specs already return deterministic JSON envelopes.
- Resolver tests use synthetic tokens (not live credentials).
- No live `api.telegram.org` call is required for those specs.

### Evidence / reporting mechanism

Wave 5 remediations record: planning package, planning approval, implementation (when later authorized), FIV, Product Owner close. There is no separate live-Telegram evidence product. This slice should add **deterministic specs**; later FIV (if implementation is authorized) must still **not** claim live vendor receipt.

---

## 5. Planning questions

### Q1 — Does `/telegram/test` already reach the production Telegram adapter?

**YES in production composition.** Nest `TELEGRAM_CHANNEL_ADAPTER` is `ProductionTelegramBotApiAdapter`. `POST /v1/telegram/test` → `sendTest` → `sendTestNotification` → `deliver()` → `this.telegram.send(...)`.

**NO in most current tests.** Isolated delivery tests override the adapter to `InMemoryTelegramAdapter`. PC-07 tests stub `sendTestNotification`.

### Q2 — Does it correctly use the durable numeric `TelegramConnection.chatId`?

**YES in production `deliver()`.** Chat id is read from the store (`getTelegramConnection`) and passed as `chatId: telegram.chatId!` only after routing considers the connection connected. HTTP test action accepts **no** client chat id.

**NOT proven end-to-end** with a REM-02 numeric persisted id on the production adapter. The certified in-process workflow still uses `chat-auto-42`.

### Q3 — Does it retrieve the bot token through the existing Vault mechanism?

**YES on the production send path.** `ProductionTelegramBotApiAdapter.send` → `TelegramBotTokenResolver` → `SecretVaultService.retrieve` (`HoldableSecretType.Telegram`, `SecretPurpose.Notification`). No second secret store. No token on the notification port.

### Q4 — Does the authenticated operator actor propagate correctly?

**YES on the HTTP operator test path.** Controller passes `{ userId, role }` into `sendTest`; product service maps to `actorUserId` / `actorRole`; `deliver()` forwards them into `telegram.send`; resolver requires both or fail-closes without retrieve.

Existing Vault ACL remains: retrieve requires membership + **C8** (`VaultConnections`) = Trader / Admin. Researcher/Reader may call `POST /v1/telegram/test` (C2) but retrieve fail-closes. That is existing REM-01-s2 security. This slice must **not** invent a system Vault actor.

### Q5 — Does the existing production adapter already call `sendMessage` correctly?

**YES at adapter unit scope.** Mocked HTTP POST to `api.telegram.org` `/sendMessage` with `{ chat_id, text }`, HTTPS-only, redirect error, 10s timeout, `ok === true` + `result.message_id` required. Token redacted from results/logs.

### Q6 — What exact gap prevents deterministic proof of bound chat → production `sendMessage`?

**Missing composed evidence**, not missing production plumbing:

```text
REM-02 numeric TelegramConnection.chatId
        ↓
NotificationDeliveryService.sendTestNotification
        ↓
ProductionTelegramBotApiAdapter (not InMemory)
        ↓
mocked fetch sendMessage
        ↓
assert jsonBody.chat_id === persisted numeric chatId
```

That chain is not covered by any current spec. Piecewise tests exist. Bind tests keep InMemory. Send tests skip `deliver()`. Workflow tests use a non-numeric fixture.

### Q7 — Is any implementation change actually required?

**Not required for production runtime behavior**, based on discovery. The operator test path already invokes production send with the stored chat id and Vault actor.

A later implementation authorization should start as **tests/evidence only**. If those tests expose a real production defect, stop and report the minimum code fix — do not expand architecture.

### Q8 — Can the gap be solved entirely through tests/evidence?

**YES. Outcome A.**

```text
tests/evidence only
```

### Q9 — Is a schema change required?

**NO.**

```text
Schema change = NOT REQUIRED
```

Existing `TelegramConnection.chatId` and durable notification snapshot already hold the numeric bind. No Prisma migration.

### Q10 — Is a real Telegram token required for implementation?

**NO** for this planning slice’s deterministic tests.

```text
Real Telegram token required for implementation: NO
Real Telegram token required for later live verification: YES
```

Do not request, paste, or commit a token.

---

## 6. Existing capability (do not duplicate)

Already complete and must be reused:

1. `POST /v1/telegram/test` operator action.
2. Actor-threaded `sendTestNotification` / `deliver()`.
3. `resolveDeliveryRoutes` telegram connected gate.
4. Nest production adapter bind.
5. Vault retrieve-at-send (`HoldableSecretType.Telegram` / notification).
6. Production numeric chat-id guard.
7. Adapter `sendMessage` HTTP + error mapping + redaction.
8. REM-02 bind of numeric `chat.id` via on-demand `getUpdates`.
9. Mock fetch injection on `TelegramBotApiHttpClient`.

Do **not** rebuild bind, webhook, Vault, PC-06, or PC-07 views.

---

## 7. Identified gap

```text
DETERMINISTIC PROOF MISSING:
bound numeric TelegramConnection.chatId
        →
operator test / sendTestNotification
        →
production adapter sendMessage
        →
mocked request chat_id equals persisted chatId
```

```text
LIVE TELEGRAM RECEIPT:
NOT IN SCOPE
NOT PROVEN BY THIS SLICE
```

---

## 8. Proposed smallest implementation

**Outcome A — tests/evidence only.** Not Outcome B. Not Outcome C.

```text
Conclusion: tests/evidence only
Production source change: NOT REQUIRED on current discovery
```

### In scope (when a later Product Owner Implementation Authorization is granted)

- Add deterministic notification-delivery tests that:
  - persist a **numeric test-fixture** `TelegramConnection.chatId` (distinct from production observation; may bind via existing `completeTelegramConnect` / store save, or consume a REM-02 mocked bind then send);
  - construct `NotificationDeliveryService` with `ProductionTelegramBotApiAdapter` + mocked HTTP + mocked/stub resolver;
  - call `sendTestNotification` with Trader/Admin actor;
  - assert fetch URL path ends with `/sendMessage`;
  - assert POST JSON `chat_id` equals the persisted numeric id;
  - assert no token in delivery result / thrown messages / captured logs.
- Fail-closed cases on the same composed path: missing bind (skip, no fetch); missing credential; missing actor; synthetic `in-memory:` id; foreign workspace id not used as retrieve `workspaceId`; Telegram HTTP error mapping preserved.
- Keep existing tests green. Do not weaken `botApiUsed: false` assertions (REM-03 out of scope).

### Out of scope

- Production source changes unless composed tests prove a defect (then escalate the minimum fix; do not expand).
- Live Bot API.
- Credential provisioning.
- PC-07 view honesty (`botApiUsed`, `transport: 'in-memory'`).
- PC-06 redesign.
- Webhook / `setWebhook` / polling workers / timers.
- Repeating REM-02 bind as the slice purpose.
- Email / Slack / Discord / Teams / Push.
- Retry execution / scheduler runtime.
- W5-N30 / V3-N30 / CM-37.
- Declaring J3-06 / V3-N01 / Wave 5 COMPLETE.

### Test fixture vs production persisted chat ID

| Kind                             | Allowed                                                                            | Forbidden                                          |
| -------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Test fixture**                 | Deterministic numeric string, e.g. `777001`, supplied in mocked bind / store setup | Live Telegram chat ids; operator-typed ids; tokens |
| **Production persisted chat ID** | Value already stored on `TelegramConnection.chatId` from REM-02 observation        | HTTP body, query, header, or UI field              |

Tests **must not** teach production to accept client-supplied chat ids.

---

## 9. Architecture

```text
No new bounded context
No new persistence owner
No new secret type
No new HTTP route
No webhook
No worker / timer / scheduler
Notification Delivery remains send owner
Vault remains credential owner
PC-07 remains HTTP product adapter
PC-06 routing function remains consumed, not redesigned
```

Expected architectural changes:

```text
NONE
```

If composed tests later force a production code change, the change must remain on existing `notification-delivery` surfaces and be reported before expanding.

---

## 10. Files / components likely affected

**Tests only (expected):**

- New spec under `apps/api/src/modules/notification-delivery/` (composed operator-test production send).
- Optionally extend existing adapter / delivery specs **without** weakening them.

**Must not change in this slice:**

- `telegram.view.ts` / web Telegram settings copy (REM-03).
- `resolve-delivery-routing.ts` redesign.
- Prisma schema.
- Master Plan / Execution Roadmap.
- Vault ACL.
- `TelegramController` chat-id parameters (must remain absent).

---

## 11. Tests

### Happy path

```text
bound TelegramConnection (numeric fixture)
        ↓
sendTestNotification (Trader/Admin actor)
        ↓
ProductionTelegramBotApiAdapter
        ↓
mocked sendMessage success
        ↓
chat_id === persisted numeric chatId
delivery attempt outcome delivered
```

### Missing binding

`chatId` null / absent / not-connected → routing skip `channel-not-connected` (or equivalent fail-closed). **No** `sendMessage` fetch.

### Missing credential

Resolver / Vault cannot provide `botToken` → no successful send; stable fail detail; no token echo.

### Missing actor

No `actorUserId` / `actorRole` → resolver fail closed; no retrieve; no `sendMessage`.

### Wrong workspace

Retrieve `workspaceId` is the delivery workspace, not a foreign workspace. Controller already 403s foreign `X-Workspace-Id`. Preserve both.

### Synthetic ID

Persisted `in-memory:workspace:user` (test-only setup of a **forbidden production destination**) → `telegram_chat_id_not_bound`; no Vault retrieve before guard (existing adapter order).

### Telegram API failure

Non-200 / `ok !== true` / missing `message_id` → existing `mapTelegramHttpStatus` / `telegram_invalid_response`. Retry execution still not introduced.

### Secret safety

Token never in delivery result, test assertion payloads, or captured log context. Reuse `redactTelegramSecrets` expectations. Do not print live or fixture tokens in planning or future reports.

### Regression

Existing notification-delivery, telegram-product, PC-07, Vault resolver, and REM-02 bind tests remain green. Do not flip `botApiUsed` expectations.

Mocked tests **do not** prove:

```text
Telegram actually received the message
J3-06 = PASS
V3-N01 exit = PASS
```

---

## 12. Security

```text
Client-supplied chat ID: NOT ACCEPTED
Production chat ID source: TelegramConnection.chatId (numeric guard)
Vault: existing retrieve-at-send, membership + C8
Actor: required on send; no system Vault principal
Control plane: NOT INTRODUCED
HTTPS / api.telegram.org / redirect:error / timeout: UNCHANGED
Secret leakage: forbidden in results and logs
```

Happy-path composed tests must use Trader or Admin actors because C8 is required to retrieve. Do not weaken C8 to make Researcher “succeed.”

Telegram remains a **notification surface**, not a trading control plane.

---

## 13. Credential boundary

```text
Real Telegram token required for implementation: NO
Real Telegram token required for later live verification: YES
```

Existing provisioning path (unchanged, not used by this planning slice):

```text
POST /v1/connections
POST /v1/connections/:id/credentials
credentials.botToken
SecretVaultService
HoldableSecretType.Telegram
purpose = notification
```

Do not invent another credential path. Do not put a token in this package, source, tests, `.env`, Git, or chat.

If a later act needs live I/O:

```text
LIVE CREDENTIAL GATE REQUIRED
```

Stop. Identify the path above. Wait for Product Owner confirmation. Do not ask the user to paste the token into Cursor.

---

## 14. Live verification boundary

```text
DETERMINISTIC MOCKED VERIFICATION
        = IN SCOPE for a later implementation authorization
LIVE TELEGRAM VERIFICATION
        = NOT IN SCOPE
        = NOT AUTHORIZED
```

This slice may prove:

```text
operator test
    ↓
production adapter
    ↓
sendMessage request
    ↓
correct numeric chat_id
```

It MUST NOT claim:

```text
Telegram actually received the message
```

---

## 15. Schema determination

```text
Schema change required = NO
Schema change = NOT REQUIRED
```

If a later implementation authorization discovers otherwise: **STOP.** Do not create a migration. Escalate to Product Owner.

---

## 16. PC-06 / PC-07 impact

```text
PC-06 = not the next blocker
PC-07 = existing binding foundation + existing operator test HTTP
```

`deliver()` already consumes `resolveDeliveryRoutes`. Operator test already exists on PC-07. This slice does **not** redesign either. No new PC-07 field. Views remain historically in-memory until a separate honesty slice.

Direct dependency documented: PC-07 `POST /v1/telegram/test` is the operator entry. It already delegates correctly. Evidence should sit on Notification Delivery (owner of send), not a PC-07 rewrite.

---

## 17. REM-03 boundary

Do **not** implement view honesty.

Known remaining product projection (out of scope):

```text
botApiUsed: false
transport: 'in-memory'
```

UI copy still states Bot API is not used. This slice proves the **send path**, not status views. Existing tests that assert `botApiUsed === false` must stay green.

---

## 18. Technical debt

```text
TD-048 = UNCHANGED
TD-049 = OPEN
TD-050 = UNCHANGED
```

This slice, if later implemented, **contributes** to TD-049 by proving mocked production `sendMessage` on a bound chat. It **must not** close TD-049: live customer-visible Telegram delivery remains unproven. TD-048 (analytical stores) and TD-050 (other channels) are untouched.

---

## 19. Risks

| Risk                                                       | Mitigation                                              |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| Treating mocked `sendMessage` as live receipt              | Explicit live-verification boundary; non-declarations   |
| Rebuilding adapter / bind                                  | Outcome A; reuse only                                   |
| Weakening C8 / inventing system Vault actor                | Forbidden                                               |
| Flipping `botApiUsed`                                      | REM-03 out of scope                                     |
| Client chat-id creeping into HTTP                          | Controller remains body-less; tests assert no client id |
| Non-numeric fixtures leaking into “production path” proofs | Composed tests use numeric fixtures only                |
| Token in logs/tests                                        | Synthetic doubles; redaction assertions; no live token  |

---

## 20. Rollback

No schema, owner, or Nest bind change is planned. If only tests are added, rollback is to delete those tests. If an unexpected production defect fix is later authorized, it must remain isolated to notification-delivery send/test wiring and be revertible without identity/vault redesign.

---

## 21. Explicit non-declarations

```text
Wave 5 = NOT COMPLETE
J3-06 = NOT DECLARED PASS
V3-N01 exit = NOT DECLARED PASS
Customer-visible real Telegram delivery = NOT VERIFIED
Live Telegram vendor certification = NOT VERIFIED
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
Official package ID = NOT CREATED
Implementation = NOT AUTHORIZED
REM-03 = NOT IMPLEMENTED
PC-06 redesign = NOT IMPLEMENTED
Schema change = NOT REQUIRED
```

---

## 22. Acceptance criteria (future implementation)

| ID        | Criterion                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| **PT-01** | Operator test / `sendTestNotification` reaches `ProductionTelegramBotApiAdapter` (not InMemory) on the composed proof. |
| **PT-02** | Persisted numeric `TelegramConnection.chatId` is the `sendMessage` `chat_id`.                                          |
| **PT-03** | No client-supplied chat ID is accepted on `POST /v1/telegram/test`.                                                    |
| **PT-04** | Bot token retrieval uses existing Vault Telegram / notification path.                                                  |
| **PT-05** | Authenticated actor semantics remain enforced (missing actor fail-closed; C8 unchanged).                               |
| **PT-06** | Production adapter invokes `sendMessage` with the correct numeric chat ID (mocked HTTP).                               |
| **PT-07** | Missing binding fails closed (no `sendMessage` fetch).                                                                 |
| **PT-08** | Missing credential fails closed.                                                                                       |
| **PT-09** | Telegram API errors preserve stable error mapping.                                                                     |
| **PT-10** | No secrets leak into logs/results.                                                                                     |
| **PT-11** | Existing notification and Telegram tests remain green.                                                                 |
| **PT-12** | No schema change unless explicitly approved (none expected).                                                           |
| **PT-13** | No live Telegram dependency in deterministic tests.                                                                    |
| **PT-14** | No trading / control-plane behavior is introduced.                                                                     |
| **PT-15** | Master Plan and Execution Roadmap remain unchanged.                                                                    |

Mocked PT-01…PT-06 do **not** equal J3-06 or V3-N01 exit.

---

## 23. Implementation authorization boundary

```text
Implementation authorization:
NOT GRANTED
```

This planning package authorizes **planning documentation only**. Source, tests, schema, credentials, and live Telegram remain forbidden until a separate Product Owner Implementation Authorization.

---

## Lifecycle (this document)

| State           | This slice                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PLANNED**     | **YES** (this package)                                                                                                                                     |
| **APPROVED**    | **YES** (recorded in [`production-telegram-operator-test-message-planning-approval.md`](./production-telegram-operator-test-message-planning-approval.md)) |
| **IMPLEMENTED** | **NO**                                                                                                                                                     |
| **VERIFIED**    | **NO**                                                                                                                                                     |

```text
Does the existing Master Plan need modification?
NO
```

No STOP-AND-ESCALATE condition: Outcome C (larger architectural change) was **not** found.
