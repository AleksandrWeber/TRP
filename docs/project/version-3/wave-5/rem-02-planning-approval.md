# REM-02 Planning Approval

**Document:** REM-02 Product Owner Planning Approval
**Date:** 2026-09-14
**Label:** REM-02 — Real Telegram Chat Binding
**Wave:** 5 — Notification Platform
**Nature:** Product Owner Planning Approval and Planning Repository Synchronization for a remediation/slice label. Not an official Wave 5 package ID. Not implementation. Not Package Close. Not Wave 5 COMPLETE. Not an RC. Not an ADR. Not a Master Plan revision. Not an Execution Roadmap revision. Not W5-N30 / V3-N30 / CM-37.
**Authority:** Product Owner
**Planning package:** [`rem-02-planning-package.md`](./rem-02-planning-package.md)

**Planning Review:** **PASS** (Product Owner)
**REM-01-s2 Final Close baseline:** `51ccc60d438d496baf99ad224c26156fa170dbd6` — `docs(rem-01-s2): close package`
**Current synchronized HEAD at approval start:** `51ccc60d438d496baf99ad224c26156fa170dbd6`

---

## Approval record

| Field                                     | Decision                |
| ----------------------------------------- | ----------------------- |
| **Planning Review**                       | **PASS**                |
| **Planning Approval**                     | **PASS**                |
| **Lifecycle: PLANNED**                    | **YES**                 |
| **Lifecycle: APPROVED**                   | **YES**                 |
| **Lifecycle: IMPLEMENTED**                | **NO**                  |
| **Lifecycle: VERIFIED**                   | **NO**                  |
| **Repository Synchronization (Planning)** | **COMPLETE** (this act) |
| **Implementation Authorization**          | **NOT YET GRANTED**     |
| **REM-02 implementation**                 | **NOT AUTHORIZED**      |
| **REM-03 / REM-04 / REM-05**              | **NOT AUTHORIZED**      |
| **TD-049**                                | **OPEN**                |
| **TD-050**                                | **UNCHANGED**           |
| **Wave 5 COMPLETE**                       | **Not granted**         |
| **Customer-visible Telegram delivery**    | **Not granted**         |
| **Real Telegram vendor round-trip**       | **Not granted**         |
| **Real chat binding implementation**      | **Not granted**         |
| **W5-N30 / V3-N30 / CM-37**               | **Not created**         |

```text
REM-02 Planning Approval = PASS
Implementation Authorization = NOT YET GRANTED
```

```text
Planning Review: PASS
Planning Approval: PASS
Implementation Authorization: NOT GRANTED
```

---

## Approval verdict

| Field                                     | Decision           |
| ----------------------------------------- | ------------------ |
| **Planning**                              | **APPROVED**       |
| **Repository Synchronization (Planning)** | **COMPLETE**       |
| **REM-02 implementation**                 | **NOT AUTHORIZED** |

---

## Binding authorization

Product Owner **Approves** the REM-02 Planning Package and **authorizes Repository Synchronization (Planning)** subject to the frozen planning document and the rules below.

### What is authorized

1. **Planning APPROVED** for REM-02.
2. **Repository Synchronization (Planning) is COMPLETE** — planning package and this approval record are synchronized to the repository under this act.
3. **Implementation remains NOT AUTHORIZED** by this Approval.
4. A later Product Owner **Implementation Authorization** is required before any source, test, schema, inbound Telegram, or credential-provisioning change.

### What is unchanged

5. **Master Plan unchanged.**
6. **Execution Roadmap unchanged.**
7. **W5-N01…N29 remain CLOSED.** No official next package is opened.
8. **Ownership unchanged** — Secret Vault remains credential owner; Notification Delivery remains Telegram send owner; PC-06 / PC-07 remain HTTP product adapters.
9. **Vault ACL unchanged** — membership + C8. No system Vault actor. No Admin impersonation.
10. **REM-01-s2 remains CLOSED.** Production adapter bind and Vault retrieve-at-send remain as implemented; this approval does not reopen them.

### What remains forbidden until a separate implementation authorization

- Observing Telegram updates (`getUpdates`, webhooks, `/start` processing)
- Binding a real numeric `chat_id`
- Changing PC-07 `complete()` away from `inMemoryAdapterChatId()`
- Changing Telegram views / PC-06 / Vault / Prisma / dependencies
- Calling the real Telegram Bot API
- Requesting or provisioning the real bot token
- Declaring TD-049 closed, Wave 5 COMPLETE, J3-06 satisfied, or customer Telegram delivery
- Starting REM-03 / REM-04 / REM-05

---

## Frozen planning decisions

### Objective

```text
Associate a real numeric Telegram chat_id with the existing
TelegramConnection for the correct workspace/user so that the
already implemented production Telegram adapter can deliver a real
test message.
```

Chat ID originates from Telegram observation. Chat ID is **never** a user-entered form field.

### Existing primitives (reuse)

```text
connectTelegram
connectionToken
tg://connect/{token}
completeTelegramConnect
bindTelegramChat
disconnectTelegramConnection
TelegramConnection.chatId
durable notification snapshot
PC-07 Telegram connect flow
ProductionTelegramBotApiAdapter
TelegramBotTokenResolver
SecretVaultService
```

Do not introduce a second identity store unless implementation discovery proves it unavoidable.

### Inbound observation

```text
NOT IMPLEMENTED
Webhook vs getUpdates = implementation discovery.
```

This approval does **not** choose webhook vs `getUpdates`.

### PC-07

Preserve PC-07. After a later authorized implementation:

```text
production real chat binding
≠
synthetic test binding
```

`inMemoryAdapterChatId()` must not remain the production bind. `InMemoryTelegramAdapter` remains a valid test double.

Do not redesign PC-07 beyond stopping production synthesis of the chat ID.

### Data model

```text
Schema change = NOT PROVEN REQUIRED
```

No schema change is authorized by this approval.

### Credential / token

```text
Real token NOT required for mocked REM-02 implementation.
Existing path: POST /v1/connections and POST /v1/connections/:id/credentials
credentials.botToken → HoldableSecretType.Telegram / purpose = notification
```

Do **not** request, provision, or commit the token during planning.

A future authorized live step must stop, identify that exact Connections / Vault path, tell the user where to provision, and wait for confirmation.

### Tests vs vendor proof

```text
Mocked REM-02 tests ≠ Real Telegram vendor verification
```

Mocked fetches do **not** prove J3-06, V3-N01 exit, or customer-visible delivery.

Real Telegram API verification is **NOT PART OF THIS PLANNING APPROVAL**.

---

## Scope boundaries preserved

### In scope (later implementation only)

- Observe Telegram `/start` connection event
- Extract connection token and numeric `chat.id`
- Match pending connection with workspace/user isolation
- Persist real chat ID through existing `TelegramConnection`
- Stop production use of synthetic chat ID
- Keep synthetic binding for tests
- Update relevant tests

### Out of scope

- REM-03 view honesty
- REM-04 PC-06 redesign
- REM-05 / J3-06 vendor certification
- Trading / control-plane Telegram commands
- Retry / scheduler execution
- New workers / timers / queues as products
- Email / Slack / Discord / Teams / Push
- Vault ACL redesign
- Schema redesign unless discovery proves unavoidable
- Master Plan / Execution Roadmap changes

---

## Security preservation

```text
token matching against pending connection
workspace isolation
update.chat.id is authoritative
client never supplies production chat ID
fail closed on missing / unmatched / invalid / unauthorized bind
no secret leakage
no trading commands
```

Control-plane prohibition:

```text
/start stop-trading approve-trade execute-trade
```

or equivalent commands are forbidden as part of REM-02.

No security relaxation is authorized.

---

## Control-plane preservation

```text
No trade execution
No risk override
No approval/rejection authority
No gate override
No inbound Telegram command processing as a control plane
```

REM-02 remains notification delivery bind only.

---

## Technical debt

```text
TD-049: OPEN
TD-050: UNCHANGED
```

Planning approval does not close either item. REM-02 is intended to address the real-chat portion of TD-049 but **MUST NOT** close TD-049 automatically.

---

## Wave 5 status

```text
Wave 5: NOT COMPLETE
```

Do not claim customer-visible Telegram delivery. Do not claim a real Telegram vendor round-trip. Do not claim J3-06 / V3-N01 exit.

---

## Confirm unchanged

| Item                 | Status                         |
| -------------------- | ------------------------------ |
| Master Plan          | **Unchanged**                  |
| Execution Roadmap    | **Unchanged**                  |
| W5-N01…N29           | **CLOSED / unchanged**         |
| REM-01-s2            | **CLOSED / unchanged**         |
| PC-06                | **Unchanged**                  |
| PC-07 implementation | **Unchanged**                  |
| Vault ACL            | **Unchanged**                  |
| Prisma / schema      | **Unchanged**                  |
| Dependencies         | **Unchanged**                  |
| Official package IDs | **No W5-N30 / V3-N30 / CM-37** |

---

## Mandatory Approval Questions

1. **Is the Planning Package complete?** **Yes.**
2. **Is Planning Review PASS?** **Yes.**
3. **Is Planning Approval PASS?** **Yes.**
4. **Is implementation authorized?** **No.**
5. **Does this invent W5-N30 / V3-N30 / CM-37?** **No.**
6. **Does this close TD-049?** **No.**
7. **Does this declare Wave 5 COMPLETE?** **No.**
8. **Does this implement real chat binding?** **No** — planned only; current production complete still uses `inMemoryAdapterChatId()`.
9. **Was the real Telegram token requested or provisioned?** **No.**
10. **Does this call the real Telegram API?** **No.**

---

## Next stage

| Stage                                 | Status                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Planning Package                      | **APPROVED**                                                                   |
| Planning Review                       | **PASS**                                                                       |
| Planning Approval                     | **RECORDED**                                                                   |
| Repository Synchronization (Planning) | **COMPLETE**                                                                   |
| Implementation                        | **NOT AUTHORIZED** — await separate Product Owner Implementation Authorization |

---

## Explicit non-claims

- No REM-02 implementation occurred
- No inbound Telegram processing was implemented
- No webhook / `getUpdates` mechanism was chosen or built
- No real chat binding was implemented
- No PC-07 production complete path was changed
- No real Telegram delivery was proven
- No token was requested, provisioned, or committed
- No retry execution was implemented
- No workers / timers / queues were introduced
- No schema or dependency changes were made
- No Master Plan or Execution Roadmap changes were made
- Planning approval does not equal implementation completion

---

**STOP.** Planning is **APPROVED**. Repository Synchronization (Planning) is **COMPLETE**. REM-02 implementation is **NOT AUTHORIZED**. Await a separate Product Owner Implementation Authorization. Do **not** begin implementation.
