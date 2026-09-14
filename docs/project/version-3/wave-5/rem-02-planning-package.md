# REM-02 Planning Package

**Document:** REM-02 Planning Package — Real Telegram Chat Binding
**Date:** 2026-09-14
**Label:** REM-02 (remediation / slice planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner Planning Package (Planning Review PASS; Planning Approval recorded separately)
**Owner:** Notification Delivery
**Predecessor:** REM-01-s2 CLOSED / SYNCHRONIZED

**REM-01-s2 implementation baseline:** `67affda7cf89fe3c45285f4cc3a5d693bbc6a474` — `feat(rem-01-s2): integrate Telegram adapter with Vault`
**REM-01-s2 Final Close commit:** `51ccc60d438d496baf99ad224c26156fa170dbd6` — `docs(rem-01-s2): close package`
**Planning synchronization baseline (HEAD at approval start):** `51ccc60d438d496baf99ad224c26156fa170dbd6`

---

## A. Package Identity

```text
REM-02 — Real Telegram Chat Binding
```

```text
PLANNING APPROVED
IMPLEMENTATION NOT AUTHORIZED
```

REM-02 remains a **remediation / planning label**. This package does **not** create:

```text
W5-N30
V3-N30
CM-37
```

or any other official Master Plan / Execution Roadmap package ID.

---

## Lifecycle

| State           | REM-02                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| **PLANNED**     | **YES**                                                                    |
| **APPROVED**    | Recorded in [`rem-02-planning-approval.md`](./rem-02-planning-approval.md) |
| **IMPLEMENTED** | **NO**                                                                     |
| **VERIFIED**    | **NO**                                                                     |

Implementation authorization is **not** granted by this package.

---

## B. Objective

Associate a **real numeric Telegram `chat_id`** with the existing `TelegramConnection` for the correct workspace/user so that the already implemented production Telegram adapter can deliver a real test message.

```text
Associate a real numeric Telegram chat_id with the existing
TelegramConnection for the correct workspace/user so that the
already implemented production Telegram adapter can deliver a real
test message.
```

The chat ID **MUST** originate from Telegram observation.

The chat ID **MUST NOT** be a user-entered form field.

This slice satisfies the remaining critical-path gap after REM-01-s1 / REM-01-s2:

```text
production send exists
        ↓
Vault retrieve-at-send exists
        ↓
synthetic PC-07 chat_id is still bound
        ↓
production adapter rejects it before send
```

Without a real numeric `chat_id`, customer-visible Telegram delivery remains blocked even if a live bot token is already in Vault.

---

## Existing primitives to reuse

Do **not** invent a second identity store unless implementation discovery proves it unavoidable.

| Primitive                         | Role                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `connectTelegram`                 | Creates pending connection + `connectionToken`          |
| `connectionToken`                 | Matches inbound Telegram `/start` to the pending bind   |
| `tg://connect/{token}`            | Existing deep-link string shown by PC-07                |
| `completeTelegramConnect`         | Completes bind with a `chatId`                          |
| `bindTelegramChat`                | Domain bind of chat identity onto `TelegramConnection`  |
| `disconnectTelegramConnection`    | Revokes / clears the bind                               |
| `TelegramConnection.chatId`       | Existing field for the bound chat                       |
| Durable notification snapshot     | Existing persistence of `TelegramConnection`            |
| PC-07 Telegram connect flow       | HTTP/UI connect / complete / verify / test / disconnect |
| `ProductionTelegramBotApiAdapter` | REM-01-s1 / s2 production send                          |
| `TelegramBotTokenResolver`        | Retrieve-at-send                                        |
| `SecretVaultService`              | Existing Vault store / retrieve                         |

---

## Current production binding (must not remain after later implementation)

PC-07 `complete()` currently supplies:

```text
inMemoryAdapterChatId()
→ in-memory:{workspaceId}:{userId}
```

REM-01-s2 production send rejects that identifier (`telegram_chat_id_not_bound`) **before** Vault retrieve.

After a later authorized implementation, that synthetic identifier **must not** remain the production bind.

`InMemoryTelegramAdapter` remains a valid **test double**. Tests may keep a synthetic binding. Production must not.

---

## Target flow

```text
Authenticated TRP user
        ↓
PC-07 Telegram connect
        ↓
pending connection + connectionToken
        ↓
Telegram user opens Telegram deep-link / sends /start
        ↓
Telegram update is observed          ← NOT IMPLEMENTED
        ↓
extract connectionToken + update.chat.id
        ↓
match pending connection
        ↓
workspace/user isolation check
        ↓
completeTelegramConnect({ chatId: numeric })
        ↓
persist TelegramConnection.chatId
        ↓
production NotificationDeliveryService
        ↓
ProductionTelegramBotApiAdapter
        ↓
TelegramBotTokenResolver
        ↓
SecretVaultService
        ↓
Telegram Bot API
        ↓
real Telegram message
```

Inbound observation (`getUpdates` / webhook / `/start` processing) is:

```text
NOT IMPLEMENTED
```

and is therefore part of REM-02 **implementation discovery**. This planning package does **not** implement it.

---

## Webhook vs getUpdates

```text
Webhook vs getUpdates = implementation discovery.
```

This package does **not** choose the mechanism.

A later authorized implementation must inspect the repository and choose the **smallest safe** mechanism consistent with:

- existing architecture;
- security;
- deployment constraints;
- workspace isolation;
- no control-plane commands.

No inbound Telegram handling is authorized by this document.

---

## Security boundary

### Token matching

The inbound connection token must match an existing **pending** Telegram connection.

### Workspace isolation

A Telegram update associated with one workspace/user **MUST NOT** bind another workspace/user.

### Chat identity

`update.chat.id` is the authoritative Telegram chat identifier.

The client must **never** supply the production chat ID.

### Fail closed

Binding must fail closed for:

- missing token;
- expired/invalid token if existing lifecycle supports expiry;
- unmatched token;
- wrong workspace;
- unauthorized actor;
- malformed update;
- invalid chat ID.

Pending `connectionToken` expiry is **not specified** in the current domain. Implementation must not invent expiry unless existing lifecycle already supports it; if absent, report as discovery, do not silently add a new product lifecycle.

### Control-plane prohibition

Telegram inbound processing **MUST NOT** become a trading control plane.

Explicitly prohibit as part of REM-02:

```text
/start stop-trading approve-trade execute-trade
```

or equivalent trading commands.

Telegram remains **delivery-only**.

---

## PC-07 boundary

Preserve PC-07 as the product HTTP adapter.

Do **not** redesign PC-07 beyond what is required to stop synthesizing a production chat ID.

| Path                                           | Decision                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Production complete                            | Must stop using `inMemoryAdapterChatId()` as the production bind |
| Test double                                    | Synthetic binding remains valid in tests                         |
| Views (`botApiUsed`, `transport: 'in-memory'`) | **Out of scope** (REM-03)                                        |
| Channel catalog / PC-06 routing                | **Out of scope** (REM-04)                                        |

---

## Telegram credential / token rule

The real Telegram bot token is **NOT required for mocked REM-02 implementation**.

The existing credential mechanism is:

```text
POST /v1/connections
POST /v1/connections/:id/credentials
```

with:

```text
credentials.botToken
```

mapped through:

```text
HoldableSecretType.Telegram
purpose = notification
```

and stored through the existing Vault mechanism (`SecretVaultService.store` / `replace` / `retrieve`).

Connections **validate** remains local non-empty field validation. It is **not** Bot API `getMe` and is not a substitute for live vendor proof.

For live verification, the token must already exist in the target workspace’s Vault Telegram notification slot.

### Absolute rule

Cursor **MUST NOT** ask the user to paste the token into:

- ChatGPT;
- Cursor chat;
- source code;
- test code;
- tracked `.env`;
- terminal logs;
- Git.

When a later authorized implementation reaches the credential-provisioning / live-verification step:

1. stop;
2. identify the exact repository-supported credential path (`POST /v1/connections/:id/credentials`, C8 `VaultConnections`, field `botToken`);
3. explicitly tell the user where/how to provision the token;
4. wait for user confirmation;
5. only then continue.

This planning package does **not** request or provision the token.

---

## Real Telegram API

Planning and mocked implementation must **not** call the real Telegram API.

| Class                             | Meaning                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| Mocked REM-02 tests               | Deterministic unit / integration / product / security tests |
| Real Telegram vendor verification | Later Product Owner–authorized action                       |

A real vendor test is **not** part of this planning approval.

Do **not** treat mocked fetches as proof of:

```text
J3-06
V3-N01 exit
real customer-visible delivery
```

---

## Data model

```text
Schema change = NOT PROVEN REQUIRED
```

Existing `TelegramConnection.chatId` and the durable notification snapshot mechanism appear capable of holding the binding.

Implementation must verify this **before** proposing schema changes.

No schema change is authorized by this planning package.

---

## Implementation boundary

If implementation is later authorized, the smallest slice includes only:

### In scope

- observe Telegram `/start` connection event;
- extract connection token;
- extract numeric `chat.id`;
- match pending connection;
- preserve workspace/user isolation;
- persist real chat ID through existing `TelegramConnection` path;
- stop production use of synthetic chat ID;
- preserve synthetic binding for tests;
- update relevant unit / integration / product tests.

### Out of scope

- REM-03 view honesty;
- REM-04 PC-06 redesign;
- REM-05 / J3-06 vendor certification;
- trading / control-plane Telegram commands;
- retry execution;
- scheduler execution;
- new workers / timers / queues as products;
- Email;
- Slack;
- Discord;
- Teams;
- Push;
- Vault ACL redesign;
- schema redesign unless discovery proves unavoidable;
- Master Plan changes;
- Execution Roadmap changes.

---

## Test plan

Future implementation must cover:

### Unit

- parse `/start`;
- extract connection token;
- extract numeric `chat.id`;
- reject malformed update;
- reject unmatched token;
- reject cross-workspace binding;
- reject user-supplied production chat ID.

### Integration

```text
pending connection
→ inbound Telegram update
→ real chat_id
→ completeTelegramConnect
→ persisted TelegramConnection.chatId
```

### Product / PC-07

Verify that production completion no longer synthesizes:

```text
in-memory:{workspace}:{user}
```

### Security

- workspace isolation;
- token matching;
- no secret leakage;
- no trading commands;
- no unauthorized binding.

### Adapter

```text
numeric chat_id → accepted
synthetic chat_id → rejected
```

### Real vendor

Real Telegram API verification is:

```text
NOT PART OF THIS PLANNING APPROVAL
```

and requires a later explicit Product Owner authorization.

---

## File-level impact

Do **not** modify these files during planning approval.

### CONFIRMED / WILL BE INVOLVED IF IMPLEMENTATION IS AUTHORIZED

```text
apps/api/src/modules/telegram-product/telegram-product.service.ts
apps/api/src/modules/telegram-product/telegram.controller.ts
apps/api/src/modules/notification-delivery/domain/telegram-connection.ts
apps/api/src/modules/notification-delivery/notification-delivery.service.ts
```

### LIKELY

```text
new notification-delivery inbound helper
telegram-product.service.spec.ts
PC-07 integration tests
apps/web/src/telegram/TelegramSettingsPage.tsx
module wiring if inbound adapter becomes injectable
```

### UNKNOWN / IMPLEMENTATION DISCOVERY

```text
getUpdates vs webhook
exact Telegram update ingestion mechanism
whether a dedicated persistence table is required
whether deep-link format needs alignment
```

---

## Technical debt

```text
TD-049 = OPEN
TD-050 = UNCHANGED
```

REM-02 is intended to address the **real-chat portion** of TD-049. It **MUST NOT** close TD-049 automatically.

TD-050 remains outside the Telegram critical path.

---

## Governance

```text
Master Plan = UNCHANGED
Execution Roadmap = UNCHANGED
Wave 5 = NOT COMPLETE
```

Official package ID: **none**. Label remains:

```text
REM-02
```

Do not create:

```text
W5-N30
V3-N30
CM-37
```

---

## Mandatory planning questions

| Q                                                      | Answer                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Next logical slice                                     | REM-02 — Real Telegram Chat Binding                                                      |
| Why next                                               | Production send already exists; synthetic chat ID is the remaining critical-path blocker |
| Master Plan objective                                  | Wave 5 / V3-N01 / CM-11 / J3-06 — connect Telegram and receive a real test message       |
| Master Plan change required                            | **NO**                                                                                   |
| New official package ID                                | **NOT AUTHORIZED YET**                                                                   |
| Schema change required                                 | **NOT PROVEN REQUIRED**                                                                  |
| Real Telegram token required for mocked implementation | **NO**                                                                                   |
| Real token for live inbound / vendor verification      | **YES**, via existing Connections / Vault path, later authorized only                    |
| Explicitly out of scope                                | REM-03 / REM-04 / REM-05, control-plane commands, TD-050 channels, Master Plan / Roadmap |
| What blocks customer-visible delivery today            | No real Telegram `chat_id`; PC-07 still synthesizes `in-memory:{workspace}:{user}`       |

---

## Explicit non-claims

- No REM-02 implementation is authorized
- No inbound Telegram processing is implemented by this document
- No webhook / `getUpdates` choice is made
- No real Telegram API call is authorized
- No token is requested or provisioned
- No schema change is authorized
- No Master Plan or Execution Roadmap change is authorized
- Planning approval does not equal implementation completion
- Mocked tests will not prove J3-06 / V3-N01 exit

---

**STOP.** Planning is recorded for Product Owner Planning Approval and Repository Synchronization (Planning) only. REM-02 implementation is **NOT AUTHORIZED**.
