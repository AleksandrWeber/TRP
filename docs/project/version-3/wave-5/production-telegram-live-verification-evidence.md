# Production Telegram Live Verification Evidence

**Document:** Wave 5 verification artifact — controlled live Telegram delivery
**Date:** 2026-09-14
**Authority:** Product Owner — verification / evidence only
**Wave:** 5 — Notification Platform
**Live send count this session:** exactly **one** (`POST /v1/telegram/test`)

```text
VERIFICATION / EVIDENCE ONLY
Second live Telegram message: NOT SENT
Telegram API: NOT CALLED by this task
Code / tests / schema / config / Vault: UNCHANGED
Bot token / JWT / cookies / ciphertext: NOT EXPOSED
Master Plan / Execution Roadmap: UNCHANGED
```

This artifact did not exist before this verification. It records application-side evidence and Product Owner customer-visible confirmation of a live test that had already completed. It does not re-run the test.

---

## 1. Verification Context

The Product Owner completed a controlled live Telegram operator test on the existing local stack (Nest API + Vite UI + remediating PostgreSQL 89/89). Sequence already performed before this artifact:

1. Telegram Bot Token stored through Connections UI → Vault (`type: telegram`, `purpose: notification`).
2. Telegram chat bound through Notification Channels → Telegram settings (`Connect Telegram` → operator `/start` in Telegram → `Complete bind`).
3. Operator pressed **Send test notification**.
4. Product Owner received the expected message in the Telegram chat.

This task inspects the already-running application logs and existing production path. It does **not** send another message. It does **not** call `getMe`, `getUpdates`, or `sendMessage`. It does **not** retrieve Vault secrets.

Two evidence classes are kept distinct:

| Class                                  | What it proves                                                                              | What it does not prove by itself               |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **APPLICATION-SIDE EVIDENCE**          | HTTP outcomes, Vault lifecycle metadata, production adapter success log, existing code path | That a human saw the Telegram bubble           |
| **CUSTOMER-VISIBLE TELEGRAM EVIDENCE** | Product Owner confirmation that the expected text appeared in the Telegram chat             | Adapter internals (those are application-side) |

Mocked tests (`production-telegram-operator-test-message.spec.ts` leftover and prior PT slices) are **not** used as live verification. This live test is **not** mocked.

---

## 2. Repository Baseline

Captured at evidence collection (this task):

| Check                       | Result                                                       |
| --------------------------- | ------------------------------------------------------------ |
| `git rev-parse HEAD`        | `67c655175fc50dca8f35ba380bb65bd149d001c5`                   |
| `git rev-parse origin/main` | `67c655175fc50dca8f35ba380bb65bd149d001c5`                   |
| HEAD == origin/main         | **PASS**                                                     |
| HEAD subject                | `docs(wave-5): close production telegram test-message slice` |
| This task source changes    | **NONE**                                                     |
| This task commits / pushes  | **NONE**                                                     |

Known leftovers (untouched by this task except the new evidence file):

```text
 M docs/project/version-3/wave-5/wave-5-progress.md
?? apps/api/src/modules/notification-delivery/production-telegram-operator-test-message.spec.ts
?? docs/project/version-3/wave-5/database-startup-blocker-analysis.md
?? docs/project/version-3/wave-5/next-package-planning-proposal.md
?? docs/project/version-3/wave-5/next-slice-planning-analysis.md
?? docs/project/version-3/wave-5/telegram-vault-credential-provisioning-analysis.md
```

---

## 3. Credential Provisioning Evidence

**APPLICATION-SIDE** (no secret values inspected or printed).

| Item                   | Evidence                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| Operator surface       | Existing Connections UI (`POST /v1/connections/:id/credentials`)        |
| Connection metadata id | `2cb0811a-55a8-42e7-802e-b9057c487331`                                  |
| First credentials POST | HTTP **401** (expired session; no Vault write)                          |
| Session refresh        | `POST /v1/auth/refresh` HTTP **201** (`auth.session` outcome `refresh`) |
| Retry credentials POST | HTTP **201**                                                            |
| Vault lifecycle        | `SecretVaultService` `vault.lifecycle` **outcome=`created`**            |
| Vault type / purpose   | `type: telegram`, `purpose: notification`                               |
| Workspace              | `163bcf3b-ee70-4049-bf80-8ff79ca344ab`                                  |
| Timestamp (UTC)        | `2026-09-14T15:00:39.502Z`                                              |
| Token in logs          | **NOT PRESENT**                                                         |
| `.env` Telegram token  | **NOT USED** (architecture: Connections → Vault)                        |

This proves a Telegram notification secret slot was created in Vault. It does **not** by itself prove a Telegram message was sent.

---

## 4. Real Chat Binding Evidence

**APPLICATION-SIDE.** Chat id values are not printed.

| Step                         | HTTP    | Result                                                                              |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `POST /v1/telegram/connect`  | **200** | Pending bind started (`req-4c`, ~`2026-09-14T15:05:57Z`)                            |
| `POST /v1/telegram/verify`   | **200** | Verify while pending (`req-4k`); does not bind chat                                 |
| `POST /v1/telegram/complete` | **400** | First complete: chat not yet observed (`req-4s`, ~`2026-09-14T15:11:55Z`, ~3289 ms) |
| `POST /v1/telegram/complete` | **200** | Second complete: bind succeeded (`req-5a`, ~`2026-09-14T15:15:23Z`, ~164 ms)        |

Production complete path (existing code, not re-executed by this task):

```text
POST /v1/telegram/complete
→ TelegramController.complete
→ TelegramProductService.complete
→ NotificationDeliveryService.observePendingTelegramBind
→ TelegramStartBindObserver.observeStartBind (on-demand getUpdates)
→ bind persisted TelegramConnection.chatId (numeric production guard)
```

UI contract: **Send test notification** is enabled only when `connection.status === 'connected'` (`testAvailable: connected` in `telegram.view.ts`). The later successful test therefore requires Connected status after bind.

**A. Telegram connection status:** **Connected** (inferred from successful complete + subsequent enabled test; chat id not printed).
**B. Chat binding:** **Yes** (complete HTTP 200; production adapter would fail closed on missing/non-numeric chat id).

Customer-visible bind confirmation is the Product Owner’s `/start` in the real Telegram chat, already performed before this artifact.

This task did **not** call `getUpdates`.

---

## 5. Operator Test Evidence

**APPLICATION-SIDE.** Exactly one live test request exists in the Nest process log.

| Item                                     | Evidence                      |
| ---------------------------------------- | ----------------------------- |
| Operator action                          | UI **Send test notification** |
| Transport                                | `POST /v1/telegram/test`      |
| Request id                               | `req-6f`                      |
| HTTP status                              | **200**                       |
| Timestamp (UTC)                          | `2026-09-14T15:29:21.195Z`    |
| Response time                            | ~209 ms                       |
| Subsequent `GET /v1/telegram/connection` | HTTP **200**                  |
| Second `POST /v1/telegram/test`          | **NONE**                      |

Existing production send path (not re-run):

```text
POST /v1/telegram/test
→ TelegramController.sendTest
→ TelegramProductService.sendTest
→ NotificationDeliveryService.sendTestNotification
→ deliver()
→ resolveDeliveryRoutes()  (telegramConnected = status connected AND chatId present)
→ ProductionTelegramBotApiAdapter.send
→ TelegramBotTokenResolver.resolve
→ SecretVaultService.retrieve (Telegram / notification)
→ TelegramBotApiHttpClient execute method sendMessage
```

Canonical test body in `NotificationDeliveryService.sendTestNotification`:

```text
subject: Test notification
body: TRP notification delivery test. Delivery channel only — not a trading command.
```

**C. Last test status/outcome (application-side):** HTTP **200** on `POST /v1/telegram/test`. Adapter result `ok` maps to channel attempt `outcome: 'delivered'` in `deliver()`. Access logs do not store the JSON body; outcome is inferred from HTTP 200 plus the production-adapter success log in section 6.

---

## 6. Production Adapter Evidence

**APPLICATION-SIDE.** Nest log line (secrets redacted by existing logger; none observed):

```text
timestamp: 2026-09-14T15:29:21.195Z
component: ProductionTelegramBotApiAdapter
message: telegram_bot_api_succeeded
channelId: telegram
operation: sendMessage
durationMs: 186
workspaceId: 163bcf3b-ee70-4049-bf80-8ff79ca344ab
vendorStatus: 200
```

This log is emitted only after:

1. numeric production chat-id guard passes;
2. Vault retrieve via `TelegramBotTokenResolver` succeeds;
3. HTTPS `sendMessage` returns HTTP 200 with a valid Telegram `ok: true` envelope.

Fail-closed paths (`telegram_chat_id_not_bound`, missing actor/C8, Vault miss, non-200 vendor) would **not** emit `telegram_bot_api_succeeded`.

**D. Adapter reached:** **Yes** (application-side). `telegramAdapterReached` is true when the telegram attempt outcome is `delivered` or `failed`. Combined with `telegram_bot_api_succeeded` / `vendorStatus: 200`, the attempt is `delivered`.

**E. Successful delivery through the production adapter:** **Yes** (application-side). Component name is `ProductionTelegramBotApiAdapter`, operation `sendMessage`, vendor HTTP 200.

Honesty note (not a live-path contradiction): PC-07 product views still hardcode `transport: 'in-memory'` and `botApiUsed: false`. Those labels are a known projection-honesty gap (REM-03). They must **not** be read as proof that this live send used the in-memory adapter. The live send log is the production adapter.

---

## 7. Telegram API Evidence

**APPLICATION-SIDE vendor evidence for the one live test:**

| Call          | Performed by this verification task | Historical (already completed before this task)                        |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `sendMessage` | **NOT CALLED**                      | **YES** — one success, `vendorStatus: 200`, `2026-09-14T15:29:21.195Z` |
| `getMe`       | **NOT CALLED**                      | Not observed on the live test path                                     |
| `getUpdates`  | **NOT CALLED**                      | Used earlier by existing complete-bind observer (bind only)            |

The live test used **real** Telegram Bot API `sendMessage`. It was **not** a mocked HTTP client and **not** the in-memory notification adapter.

Token material was not present in the inspected log lines.

---

## 8. Customer-Visible Evidence

**CUSTOMER-VISIBLE TELEGRAM EVIDENCE** (Product Owner, not inferred from mocks).

The Product Owner reported the Telegram chat showed:

```text
Test notification
TRP notification delivery test. Delivery channel only — not a trading command.
```

That matches the canonical `sendTestNotification` subject + body.

| Item                     | Status            |
| ------------------------ | ----------------- |
| Customer-visible receipt | **CONFIRMED**     |
| Expected message         | **MATCH**         |
| Second live attempt      | **NOT PERFORMED** |

Application-side logs cannot see the Telegram bubble. Customer-visible confirmation is the Product Owner’s observation. Together with the production adapter `sendMessage` 200, the live round-trip is evidenced on both sides.

---

## 9. Security Evidence

| Control                               | Result                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Bot token printed                     | **NO**                                                                 |
| Authorization / JWT / cookies printed | **NO**                                                                 |
| Vault ciphertext printed              | **NO**                                                                 |
| Chat id printed                       | **NO**                                                                 |
| Client-supplied chat id               | **NOT ACCEPTED** (existing complete/test contract)                     |
| Control plane commands                | **NOT INTRODUCED** (test copy states delivery channel only)            |
| Vault retrieve at send                | Existing C8 / membership retrieve-at-send; token not stored on adapter |
| This task Vault mutation              | **NONE**                                                               |

---

## 10. Repository State

After writing this artifact only:

| Item                           | State                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| HEAD                           | `67c655175fc50dca8f35ba380bb65bd149d001c5`                                        |
| Code / tests / schema / config | **UNCHANGED**                                                                     |
| Master Plan                    | **UNCHANGED**                                                                     |
| Execution Roadmap              | **UNCHANGED**                                                                     |
| Files added by this task       | `docs/project/version-3/wave-5/production-telegram-live-verification-evidence.md` |
| Commit                         | **NONE**                                                                          |
| Push                           | **NONE**                                                                          |

---

## 11. V3-N01 Evidence Assessment

Authoritative customer-observable (Master Plan, Wave 5):

> I connect Telegram and receive a real test message.

Authoritative V3-N01 / Wave 5 Telegram exit bullet (Execution Roadmap):

> Telegram connect binds a real chat; test sends a real message; Bot API is used; control plane remains forbidden.

Collected evidence **appears to satisfy** those Telegram-specific statements:

- real chat bind completed (`POST /v1/telegram/complete` HTTP 200);
- real test send (`POST /v1/telegram/test` HTTP 200);
- production adapter `sendMessage` vendor 200;
- Product Owner received the canonical test text;
- control plane remains forbidden in copy and product contract.

This artifact does **not** independently declare `V3-N01 = PASS`.

Full Wave 5 / V3-N01…N04 exit still includes Email/Slack/Discord/Teams/Push and PC-06 routed active-transport criteria. Those are **out of this live-Telegram evidence**.

```text
V3-N01:
EVIDENCE READY FOR PRODUCT OWNER REVIEW
```

---

## 12. J3-06 Evidence Assessment

Journey J3-06 (Product Roadmap):

> Receive a real Telegram (or Email/Slack) notification — Wave 5.

Customer-visible Telegram receipt is **CONFIRMED** by the Product Owner. Application-side production `sendMessage` succeeded once.

This artifact does **not** independently declare `J3-06 = VERIFIED`.

```text
J3-06:
EVIDENCE READY FOR PRODUCT OWNER REVIEW
```

Customer-visible receipt was confirmed. Product Owner Review is required before any official journey status change.

---

## 13. Governance Decision

```text
LIVE TELEGRAM DELIVERY: PASS (this controlled attempt)
CUSTOMER-VISIBLE MESSAGE: CONFIRMED
SECOND LIVE ATTEMPT: NOT PERFORMED
V3-N01: EVIDENCE READY FOR PRODUCT OWNER REVIEW
J3-06: EVIDENCE READY FOR PRODUCT OWNER REVIEW
WAVE 5: NOT YET DECLARED COMPLETE
TD-049: OPEN
Technical Debt Delta: NO CHANGE
MASTER PLAN: UNCHANGED
EXECUTION ROADMAP: UNCHANGED
```

Wait for Product Owner Review. Do not send another Telegram message. Do not close Wave 5 from this artifact.

STOP.
