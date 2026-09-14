# REM-01-s2 Planning Package

**Document:** REM-01-s2 Planning Package — Vault Integration, Async Port Evolution & Production Telegram Binding
**Date:** 2026-09-14
**Label:** REM-01-s2 (remediation / slice planning label only — not an official Wave 5 package ID)
**Wave:** 5 — Notification Platform
**Nature:** Planning only. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner Planning Package (reviewed PASS)
**Owner:** Notification Delivery
**Predecessor:** REM-01-s1 COMPLETE / SYNCHRONIZED

**REM-01-s1 feature baseline:** `12192c10f5929710e176db309c9cc53fae2b7ca7` — `feat(rem-01-s1): add production Telegram adapter foundation`
**REM-01-s1 CI naming hotfix:** `dbe1e0098ebae88b29bda7212e320dcf66ade6bd` — `fix(rem-01-s1): avoid telegram-product boundary false positive`
**Planning synchronization baseline (HEAD at approval start):** `dbe1e0098ebae88b29bda7212e320dcf66ade6bd`

---

## Lifecycle

| State           | REM-01-s2                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| **PLANNED**     | **YES**                                                                          |
| **APPROVED**    | Recorded in [`rem-01-s2-planning-approval.md`](./rem-01-s2-planning-approval.md) |
| **IMPLEMENTED** | **NO**                                                                           |
| **VERIFIED**    | **NO**                                                                           |

Implementation authorization is **not** granted by this package.

---

## Objective

Connect the REM-01-s1 isolated production Telegram Bot API adapter to the existing notification-delivery architecture using the **smallest safe implementation boundary**:

1. Vault token retrieval at send time;
2. required Vault authorization / actor context;
3. async notification channel contract evolution;
4. notification delivery service async migration;
5. production Nest binding of the Telegram adapter;
6. preserving current InMemory behavior as a **test double**;
7. security and workspace isolation;
8. tests and acceptance evidence.

---

## Current production binding (must remain until implementation is authorized)

```text
TELEGRAM_CHANNEL_ADAPTER
    ↓
InMemoryTelegramAdapter
```

REM-01-s1 already provides isolated:

- `telegram-bot-api.adapter.ts`
- `telegram-bot-api.http.ts`
- `telegram-bot-api.errors.ts`
- `production-telegram-chat-id.ts`

Those files are **not** production-bound. No Vault retrieve. No Nest production bind.

---

## Vault

Reuse the existing Telegram secret contract. Do **not** introduce a second token store, `.env` product path, or new secret type.

| Item                 | Decision                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| Service              | `SecretVaultService.retrieve`                                                 |
| Type                 | `HoldableSecretType.Telegram`                                                 |
| Field                | `botToken`                                                                    |
| Purpose              | `notification`                                                                |
| Scope                | workspace-scoped slot `(workspaceId, type, purpose)`                          |
| ACL                  | existing workspace **membership + C8** (`VaultAccessControl`) — **unchanged** |
| Cache                | none — retrieve-at-send only                                                  |
| Persistence of token | **forbidden** (adapter argument / memory only for the HTTP call)              |

Do not change Vault ACL. Do not add a system/service Vault principal.

---

## Actor / authorization

`NotificationDeliveryService.deliver()` today has `workspaceId` + recipient `userId` only — **no Vault-usable actor**.

**Smallest existing mechanism:** thread the authenticated request actor, matching handshake / OpenRouter retrieve callers.

```text
AuthUser { userId, role }
  → deliver / sendTestNotification { actorUserId, actorRole }
  → retrieve({
      actorWorkspaceId: actorUserId,  // actor user id (existing Vault naming)
      actorRole,
      workspaceId,                    // delivery workspace
      type: HoldableSecretType.Telegram,
    })
```

| Path                                                                    | Planned outcome                               |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| `POST /telegram/test` Trader/Admin, workspace member                    | Retrieve allowed (C8 still enforced by Vault) |
| Reader / Researcher                                                     | Fail closed — not `delivered`                 |
| Missing actor (report consumer, runtime worker, dispatch without actor) | Fail closed — not `delivered`                 |
| Foreign workspace actor                                                 | `VaultIsolationError` — fail closed           |

**Forbidden:** inventing a system Vault actor; impersonating a workspace Admin; looking up Identity role to retrieve as the recipient; bypassing `VaultAccessControl`.

Workspace isolation: retrieve slot is `cmd.workspaceId`; actor must be a member of that workspace.

---

## Async contract evolution

REM-01-s1 adapter methods are async. The shared port is still sync. Binding without async would require blocking HTTP — **forbidden**.

Planned signatures:

```text
NotificationChannelPort.send → Promise
NotificationServicePort.sendTestNotification → Promise
NotificationDeliveryService.deliver → Promise
```

`send` also receives `workspaceId` plus optional `actorUserId` / `actorRole`. **Do not put `botToken` on the port.**

InMemory and reserved-inactive adapters become `async` and remain logically equivalent after `await`.

Callers that must `await` (existing surfaces only — do not add workers/timers/queues):

- `NotificationDeliveryService`
- `TelegramProductService.sendTest` / `TelegramController.sendTest`
- `NotificationChannelDispatchService`
- `ReportNotificationConsumerService`
- existing `TradingSessionRuntimeWorker` notification call (await only; does **not** activate N26–N29 runtime)

`deliver()` is not inside a Prisma transaction. Async does not change transaction boundaries. Queue `retryable` remains a **status label only** — no retry execution.

---

## Production Nest binding (planned; not implemented)

```text
TELEGRAM_CHANNEL_ADAPTER
    →
ProductionTelegramBotApiAdapter
```

| Class                                             | Inject                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `TelegramBotApiHttpClient`                        | none (global `fetch`)                                                 |
| Token resolver (new, notification-delivery owned) | `SecretVaultService`                                                  |
| `ProductionTelegramBotApiAdapter`                 | HTTP client, resolver, optional logger                                |
| `NotificationDeliveryService`                     | store + `TELEGRAM_CHANNEL_ADAPTER` typed as `NotificationChannelPort` |

Import `SecretVaultModule` into `NotificationDeliveryModule`. Keep `InMemoryTelegramAdapter` as a **test double** via provider override. Do not keep InMemory as the production Nest binding once implementation is authorized.

Synthetic PC-07 `in-memory:{workspace}:{user}` chat ids remain **rejected** by the s1 guard (`telegram_chat_id_not_bound`). Real chat binding is **REM-02**, not this slice.

---

## Internal implementation order (one slice, when later authorized)

1. Async port + InMemory/reserved + await callers (InMemory still bound).
2. Resolver + production `send` retrieve.
3. Nest production bind.
4. Test overrides + isolation/security tests.

Do not ship step 3 without 1–2.

---

## Security (no relaxation)

```text
Vault-only token retrieval
workspace isolation
membership + C8 authorization
HTTPS
api.telegram.org exact host
SSRF protection
redirect:error
10-second timeout
token redaction
no token persistence
no token in logs/errors/UI
```

---

## Control plane (notification delivery only)

```text
No trade execution
No risk override
No approval/rejection authority
No gate override
No inbound Telegram command processing
```

---

## Out of scope (explicit)

| Item                                                                           | Owner / later label |
| ------------------------------------------------------------------------------ | ------------------- |
| Real chat binding, `getUpdates`, webhooks, `/start`, chat discovery, allowlist | **REM-02**          |
| `botApiUsed` / Connected honesty / view flags                                  | **REM-03**          |
| Routing as customer-visible Telegram evidence                                  | **REM-04**          |
| Metrics                                                                        | **REM-05**          |
| Email / Slack / Discord / Teams / Push                                         | reserved / TD-050   |
| Vault ACL redesign                                                             | forbidden           |
| Retry **execution**, workers, timers, queues                                   | forbidden           |
| Schema / Prisma / new dependencies                                             | none                |
| Master Plan / Execution Roadmap                                                | unchanged           |
| Official IDs `W5-N30` / `V3-N30` / `CM-37`                                     | **not created**     |

---

## Technical debt

```text
TD-049: OPEN
TD-050: UNCHANGED
```

Planning does **not** close TD-049. Planning does **not** claim customer-visible Telegram delivery or a real Telegram vendor round-trip.

---

## Wave 5

```text
Wave 5: NOT COMPLETE
```

W5-N01…N29 remain CLOSED. This remediation slice does not complete Wave 5.

---

## Acceptance criteria (for a later implementation authorization)

| ID    | Criterion                                                                                     |
| ----- | --------------------------------------------------------------------------------------------- |
| S2-01 | `TELEGRAM_CHANNEL_ADAPTER` is `ProductionTelegramBotApiAdapter`                               |
| S2-02 | Token from `SecretVaultService.retrieve` at send; type Telegram; purpose notification         |
| S2-03 | Vault ACL unchanged (membership + C8)                                                         |
| S2-04 | No token hardcode / `.env` product path / adapter cache / logs / responses                    |
| S2-05 | `send` / `deliver` / `sendTest` are async; InMemory remains await-equivalent as a test double |
| S2-06 | Missing actor or non-C8 → not `delivered`                                                     |
| S2-07 | Synthetic chat id still `telegram_chat_id_not_bound`                                          |
| S2-08 | Workspace isolation preserved                                                                 |
| S2-09 | No control-plane / inbound Telegram                                                           |
| S2-10 | Remaining InMemory tests are explicitly test-double tests                                     |
| S2-11 | Does not claim REM-02/03/04/05, Wave 5 COMPLETE, or TD-049 resolved                           |
| S2-12 | Existing relevant tests pass after await/override updates                                     |

---

## Schema / dependencies

**None.** No Prisma. No new packages.

---

**STOP.** This document is the approved planning package content. Implementation remains **NOT AUTHORIZED** until a separate Product Owner Implementation Authorization.
