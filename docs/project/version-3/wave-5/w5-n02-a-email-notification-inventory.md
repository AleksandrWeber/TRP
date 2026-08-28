# W5-N02-a Email Notification Inventory & Honest Product Baseline

**Slice:** W5-N02-a — Email Notification Inventory & Honest Product Baseline  
**Package:** W5-N02 Email SMTP (V3-N02 · CM-12)  
**Wave:** 5 — Notification Platform  
**Date:** 2026-08-28  
**Nature:** Discovery and classification only. Not SMTP implementation. Not outbound production notifications. Not runtime delivery to customer SMTP servers.  
**Machine inventory:** `apps/api/src/platform-conformance/w5-n02-a-email-notification-inventory.ts`  
**Conformance:** `apps/api/src/platform-conformance/w5-n02-a-email-notification.ts`

```text
This inventory does NOT implement production SMTP.
This inventory does NOT send outbound notification email.
This inventory does NOT wire Vault SMTP credentials into delivery.
This inventory does NOT declare Email SMTP implemented.
This inventory does NOT declare W5-N02 COMPLETE or Wave 5 COMPLETE.
Auth host mail (S01-e) is NOT Notification Email — paths must remain separate.
Customer-visible Email real delivery remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Email notification artifact required to implement W5-N02: SMTP surfaces, delivery pipeline, PC-06 routing, PC-07 reserved channel UX, persistence, vault credentials, workspace isolation, user preferences, message copy, durable queue, retry metadata, Platform Readiness dependencies, ownership, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL** with explicit justification.

| Class         | Meaning                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Notification Delivery / Vault / Connection / Queue owners. |
| **EPHEMERAL** | Transient, stub, reserved-inactive transport, UI-only, process-local, or missing — must not be treated as production Email truth.     |

---

## Binding finding

**Production Email SMTP is NOT implemented. Email notifications do NOT function after this slice.**

- Email channel is **reserved-inactive** — `ReservedInactiveChannelAdapter` always returns `channel-reserved`.
- PC-07 / notification channels UI shows Email as **reserved** — no SMTP connect/test/disconnect product.
- Wave 2 `connections` SMTP provider stores credentials in Vault (`HoldableSecretType.Smtp`) but is **not wired** into notification-delivery.
- Auth **host mail** (`host-mail.smtp.ts`) sends password-recovery email — **not** the Notification Email product (V3-N02).
- PC-06 routing and user preferences are **implemented** — they decide routes/skips but do not send via production SMTP.
- W3-O02 durable notification queue exists on `notification-delivery` owner — delivery work can survive restart; email transport is still reserved-inactive.
- **No** durable email notification anchors yet — W5-N02-b planned (mirrors W5-N01-b Telegram pattern).
- Message templates are **caller-defined inline strings** — no template catalog owner.
- Exchange Adapter / Wave 4 exchange I/O is **reference only** — untouched by this inventory.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented today**   | None — no customer-visible production Email notification functionality.                                                                                                                                                          |
| **Infrastructure only** | Reserved-inactive email adapter, sync delivery pipeline with email skip path, PC-06 routing, PC-07 reserved channel UX, preferences, durable history/queue on existing owner, vault SMTP secret type, Auth host mail (separate). |
| **Planned**             | W5-N02-b — Durable email notification anchors + production SMTP connect / test / disconnect.                                                                                                                                     |
| **Not implemented**     | Customer SMTP round-trip, vault in delivery path, email connect product, message template catalog, honest Connected/Delivering from SMTP round-trip, email Platform Readiness projection.                                        |
| **Future roadmap**      | W5-N02-c…e, W5-N03 Slack/Discord/Teams, W5-N04 Push, Wave 6 Live Trading.                                                                                                                                                        |

---

## Required ownership inventory (summary)

| Artifact ID                             | Owner                 | Class     | Role                                                |
| --------------------------------------- | --------------------- | --------- | --------------------------------------------------- |
| `own-email-smtp-transport`              | notification-delivery | EPHEMERAL | Email SMTP transport (reserved-inactive today)      |
| `own-notification-delivery-domain`      | notification-delivery | SURVIVE   | Delivery domain owner — extend adapters only        |
| `own-delivery-pipeline`                 | notification-delivery | EPHEMERAL | Sync deliver() pipeline — no SMTP round-trip        |
| `own-notification-persistence`          | notification-delivery | SURVIVE   | DurableNotificationStore history + queue snapshot   |
| `own-secret-vault-smtp`                 | secret-vault          | SURVIVE   | SMTP credential ciphertext owner — not consumed yet |
| `own-workspace-isolation-notifications` | workspace-isolation   | SURVIVE   | A↛B notification credentials and delivery state     |
| `own-user-notification-preferences`     | notification-delivery | SURVIVE   | Master enable, routing, schedule inputs             |
| `own-message-template-catalog`          | notification-product  | EPHEMERAL | Inline caller strings only — no catalog             |
| `own-notification-durable-queue`        | notification-delivery | SURVIVE   | W3-O02 queue on existing owner                      |
| `own-auth-host-mail-separate`           | authentication        | SURVIVE   | S01-e recovery mail — NOT Notification Email        |
| `own-honest-product-boundaries`         | wave-5-documentation  | EPHEMERAL | Frozen honesty rules for W5-N02                     |

Full row detail: `W5_N02_A_EMAIL_NOTIFICATION_INVENTORY` and helpers `rowsSurvive()`, `rowsEphemeral()`, `rowsEmailNotificationSurvive()`, `rowsEmailNotificationEphemeral()`.

---

## W5-N02-b durability update (post-slice b)

| Artifact ID                         | Before (W5-N02-a) | After (W5-N02-b)                                                             |
| ----------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `persist-email-notification-anchor` | EPHEMERAL         | **SURVIVE** — `workspace_email_notification_anchors`; canonical anchors only |

**Binding finding (unchanged):** Production Email SMTP is **NOT implemented**. Anchor rows survive in storage, but **restart recovery is not claimed** until W5-N02-c.

---

## Email notification SURVIVE artifacts (summary)

Vault SMTP secret type, connection-catalog SMTP mapping, durable notification store, delivery queue substrate, **canonical notification anchors (W5-N02-b)**, user preferences, PC-06/PC-07 product surfaces (metadata), workspace isolation consumption, security dependencies, and verified ownership rows.

## Email notification EPHEMERAL artifacts (summary)

`ReservedInactiveChannelAdapter` for email, sync delivery pipeline with email skip path, missing SMTP transport, missing vault retrieve in delivery path, inline message copy only, reserved-inactive channel stubs, and honesty blockers for fake Connected/Delivering labels.

---

## Mandatory Questions (inventory echo)

| Question                                      | Answer                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Customer-visible functionality?               | None                                                                   |
| Email Notification SURVIVE artifacts?         | Documented in inventory (`rowsEmailNotificationSurvive()`)             |
| Email Notification EPHEMERAL artifacts?       | Documented in inventory (`rowsEmailNotificationEphemeral()`)           |
| Ownership boundaries verified?                | Yes                                                                    |
| New persistence owners introduced?            | No                                                                     |
| Ownership boundaries changed?                 | No                                                                     |
| Architectural deviations introduced?          | No                                                                     |
| Can Email notifications function after slice? | No — reserved-inactive; no SMTP round-trip; vault not in delivery path |

---

**STOP.** W5-N02-a inventory only. Do not declare SMTP implemented. Do not declare Email notifications operational. Do not declare W5-N02 COMPLETE or Wave 5 COMPLETE.
