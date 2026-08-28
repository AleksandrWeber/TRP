# W5-N01-a Telegram Notification Inventory & Honest Product Baseline

**Slice:** W5-N01-a — Telegram Notification Inventory & Honest Product Baseline  
**Package:** W5-N01 Production Telegram Bot API (V3-N01 · CM-11)  
**Wave:** 5 — Notification Platform  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not Bot API implementation. Not outbound production notifications. Not runtime delivery to `api.telegram.org`.  
**Machine inventory:** `apps/api/src/platform-conformance/w5-n01-a-telegram-notification-inventory.ts`  
**Conformance:** `apps/api/src/platform-conformance/w5-n01-a-telegram-notification.ts`

```text
This inventory does NOT implement production Telegram Bot API.
This inventory does NOT send outbound notifications.
This inventory does NOT wire Vault bot tokens into delivery.
This inventory does NOT declare Telegram Bot implemented.
This inventory does NOT declare W5-N01 COMPLETE or Wave 5 COMPLETE.
Customer-visible Telegram real delivery remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Telegram notification artifact required to implement W5-N01: Bot API surfaces, delivery pipeline, PC-06 routing, PC-07 connect workflow, persistence, vault credentials, workspace isolation, user preferences, message copy, durable queue, Platform Readiness dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Notification Delivery / Vault / Connection / Queue owners. |
| **EPHEMERAL** | Transient, stub, in-memory transport, UI-only, process-local, or missing — must not be treated as production Telegram truth.          |

---

## Binding finding

**Production Telegram Bot API is NOT implemented. Telegram notifications do NOT function after this slice.**

- `InMemoryTelegramAdapter` is the **only** Telegram transport — records sends in process memory; no `api.telegram.org`.
- PC-07 `telegram-product` connect workflow binds a **synthetic** chat id (`inMemory:…`); not real Bot API chat binding.
- Wave 2 `connections` TELEGRAM provider stores `botToken` in Vault but is **not wired** into notification-delivery.
- PC-06 routing and user preferences are **implemented** — they decide routes/skips but do not send via production transport.
- W3-O02 durable notification queue exists on `notification-delivery` owner — delivery work can survive restart; transport is still in-memory.
- Message templates are **caller-defined inline strings** — no template catalog owner.
- Exchange Adapter / Wave 4 exchange I/O is **reference only** — untouched by this inventory.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented today**   | None — no customer-visible production Telegram notification functionality.                                                                                                                                                                               |
| **Infrastructure only** | In-memory Telegram adapter, sync delivery pipeline, PC-06 routing, PC-07 connect UX, preferences, durable history/queue on existing owner, **W5-N01-b canonical notification anchors**, vault Telegram secret type, Platform Readiness queue projection. |
| **Planned**             | W5-N01-c — Telegram notification restart recovery; later Bot API / real delivery slices.                                                                                                                                                                 |
| **Not implemented**     | `api.telegram.org`, real chat bind, vault in delivery path, message template catalog, honest vendor Connected labels, converged vault + PC-07 path, restart hydrate of anchors.                                                                          |
| **Future roadmap**      | W5-N01-c…e, W5-N02 Email, W5-N03 Slack/Discord/Teams, W5-N04 Push, Wave 6 Live Trading.                                                                                                                                                                  |

---

## Required ownership inventory (summary)

| Artifact ID                             | Owner                 | Class     | Role                                              |
| --------------------------------------- | --------------------- | --------- | ------------------------------------------------- |
| `own-telegram-bot-transport`            | notification-delivery | EPHEMERAL | Telegram Bot transport protocol I/O (stub today)  |
| `own-notification-delivery-domain`      | notification-delivery | SURVIVE   | Delivery domain owner — extend adapters only      |
| `own-delivery-pipeline`                 | notification-delivery | EPHEMERAL | Sync deliver() pipeline — no Bot API round-trip   |
| `own-notification-persistence`          | notification-delivery | SURVIVE   | DurableNotificationStore history + queue snapshot |
| `own-secret-vault-telegram`             | secret-vault          | SURVIVE   | Bot token ciphertext owner — not consumed yet     |
| `own-workspace-isolation-notifications` | workspace-isolation   | SURVIVE   | A↛B notification credentials and delivery state   |
| `own-user-notification-preferences`     | notification-delivery | SURVIVE   | Master enable, routing, schedule inputs           |
| `own-message-template-catalog`          | notification-delivery | EPHEMERAL | Inline caller strings only — no catalog           |
| `own-notification-durable-queue`        | notification-delivery | SURVIVE   | W3-O02 queue on existing owner                    |
| `own-honest-product-boundaries`         | wave-5-documentation  | EPHEMERAL | Frozen honesty rules for W5-N01                   |

Full row detail: `W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY` and helpers `rowsSurvive()`, `rowsEphemeral()`, `rowsTelegramNotificationSurvive()`, `rowsTelegramNotificationEphemeral()`.

---

## W5-N01-b durability update (post-slice b)

| Artifact ID                            | Before (W5-N01-a) | After (W5-N01-b)                                                                |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `persist-telegram-notification-anchor` | Not in inventory  | **SURVIVE** — `workspace_telegram_notification_anchors`; canonical anchors only |

**Binding finding (unchanged):** Production Telegram Bot API is **NOT implemented**. Anchor rows survive in storage, but **restart recovery is not claimed** until W5-N01-c.

---

## Telegram notification SURVIVE artifacts (summary)

Vault Telegram secret type, connection-catalog TELEGRAM mapping, durable notification store, delivery queue substrate, **canonical notification anchors (W5-N01-b)**, user preferences, PC-06/PC-07 product surfaces (metadata), workspace isolation consumption, security dependencies, and verified ownership rows.

## Telegram notification EPHEMERAL artifacts (summary)

`InMemoryTelegramAdapter`, synthetic chat binding, missing Bot API HTTP client, missing vault retrieve in delivery path, inline message copy only, reserved-inactive channel stubs, and honesty blockers for fake Connected/Delivering labels.

---

## Explicit non-claims

- Telegram Bot implemented — **not claimed**
- Notifications implemented (production) — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N01 COMPLETE — **not claimed**
- Wave 5 COMPLETE — **not claimed**

---

**STOP.** W5-N01-a inventory baseline remains authoritative. W5-N01-b added durable anchor persistence only. Await Product Owner review before W5-N01-c. Do not begin restart recovery from inventory alone.
