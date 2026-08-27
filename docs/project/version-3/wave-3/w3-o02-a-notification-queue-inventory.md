# W3-O02-a Notification Queue Inventory & Honesty Baseline

**Slice:** W3-O02-a — Notification Queue Inventory & Honesty Baseline  
**Package:** W3-O02 Notification Durable Queue (V3-O02 · NT-02 · TD-045)  
**Wave:** 3 — Durability, Operations & Continuity  
**Date:** 2026-08-27  
**Nature:** Discovery and honesty preparation only. Not queue persistence. Not restart recovery.  
**Machine inventory:** `apps/api/src/platform-conformance/w3-o02-a-notification-queue-inventory.ts`

```text
This inventory does NOT make the notification queue durable.
This inventory does NOT introduce a new persistence owner.
This inventory does NOT introduce a second Outbox.
This inventory does NOT merge TD-045 into TD-035.
Customer-visible queue durability remains FALSE until later slices.
```

---

## Purpose

Enumerate every notification-delivery surface that can create, hold, retry, or complete in-flight notification work. Classify ownership, storage, restart impact, and honesty before W3-O02-b persistence work.

Freeze the binding distinctions:

| Domain                   | Debt / package               | What it is                                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------- |
| **Notification Queue**   | TD-045 / NT-02 / W3-O02      | In-flight / pending / retryable channel delivery work               |
| **Paper Outbox**         | TD-035 (resolved)            | Paper runtime event publication (pending → published / dead_letter) |
| **Notification History** | W3-O01 (CLOSED)              | Completed `DeliveryResult` analytical history                       |
| **Wave 5 Providers**     | V3-N01…N04 / TD-049 / TD-050 | Production Telegram Bot API, SMTP, Slack/Discord/Teams, Push        |

---

## Binding finding

**There is no durable notification delivery queue today.**

`NotificationDeliveryService.deliver()` is **synchronous and terminal**: route → send/skip → record `DeliveryResult`. Pending / retryable / abandoned **queue** states for notification delivery work **do not exist** (TD-045 gap). Completed outcomes exist only as W3-O01 history.

---

## Inventory

Every row classifies: Owner · Workspace scope · Current storage · Ephemeral or Durable · Restart impact · Honesty requirement · Future W3-O02 responsibility.

### A. Notification-producing paths (TD-045 / require durable queue)

| Surface ID                              | Surface                                 | Owner                     | Workspace scope | Current storage   | Ephemeral / Durable | Restart impact                               | Honesty requirement                                | Future W3-O02 |
| --------------------------------------- | --------------------------------------- | ------------------------- | --------------- | ----------------- | ------------------- | -------------------------------------------- | -------------------------------------------------- | ------------- |
| `produce-notification-delivery-deliver` | `NotificationDeliveryService.deliver()` | notification-delivery     | workspace-bound | none (sync stack) | **EPHEMERAL**       | Crash mid-deliver loses unrecorded owed send | Must not claim in-flight survival until W3-O02-b/c | **W3-O02-b**  |
| `produce-send-test-notification`        | `sendTestNotification()`                | notification-delivery     | workspace-bound | none (sync stack) | **EPHEMERAL**       | Same as deliver()                            | Not Wave 5 Bot API; not a durable queue item       | **W3-O02-b**  |
| `produce-report-notification-consumer`  | `ReportNotificationConsumerService`     | product-flow              | via delivery    | none (sync stack) | **EPHEMERAL**       | Best-effort; no held queue row               | No scheduler/retries; not paper Outbox             | **W3-O02-b**  |
| `produce-channel-dispatch`              | `NotificationChannelDispatchService`    | product-flow              | via delivery    | none (sync stack) | **EPHEMERAL**       | Sync deliver only                            | In-process until Wave 5; not TD-035                | **W3-O02-b**  |
| `produce-runtime-worker-report-deliver` | Runtime worker → `requestAndDeliver`    | strategy-trading-pipeline | via delivery    | none (sync stack) | **EPHEMERAL**       | Best-effort catch/warn                       | Not Live Trading enablement                        | **W3-O02-b**  |
| `produce-telegram-product-test`         | Telegram product test send              | telegram-product          | via delivery    | none (sync stack) | **EPHEMERAL**       | HTTP still sync-terminal                     | Not production Bot API (TD-049)                    | **W3-O02-b**  |

### B. Pending / retryable / abandoned notification queue states (ABSENT — TD-045)

| Surface ID                             | Surface                                | Owner                 | Workspace scope | Current storage | Ephemeral / Durable | Restart impact                        | Honesty requirement                 | Future W3-O02 |
| -------------------------------------- | -------------------------------------- | --------------------- | --------------- | --------------- | ------------------- | ------------------------------------- | ----------------------------------- | ------------- |
| `pending-notification-delivery-work`   | Pending / in-flight delivery work item | notification-delivery | workspace-bound | **absent**      | **EPHEMERAL**       | Cannot resume owed work after restart | Must not claim pending queue exists | **W3-O02-b**  |
| `retryable-notification-delivery-work` | Retryable delivery work item           | notification-delivery | workspace-bound | **absent**      | **EPHEMERAL**       | No notification retry queue           | ≠ Outbox retry (TD-035)             | **W3-O02-b**  |
| `abandoned-notification-delivery-work` | Abandoned delivery work item           | notification-delivery | workspace-bound | **absent**      | **EPHEMERAL**       | Silent loss is the honesty gap        | ≠ Outbox dead_letter                | **W3-O02-d**  |

### C. Completed / failure states (Notification History — W3-O01)

| Surface ID                          | Surface                                               | Owner                 | Workspace scope | Current storage        | Ephemeral / Durable | Restart impact                  | Honesty requirement           | Future W3-O02           |
| ----------------------------------- | ----------------------------------------------------- | --------------------- | --------------- | ---------------------- | ------------------- | ------------------------------- | ----------------------------- | ----------------------- |
| `completed-delivery-result-history` | `DeliveryResult` `delivered` \| `skipped` \| `failed` | notification-delivery | workspace-bound | durable owner snapshot | **DURABLE**         | History may survive (O01)       | History ≠ queue               | **out-of-scope-w3-o01** |
| `failure-delivery-result-failed`    | Attempt/result `failed`                               | notification-delivery | workspace-bound | durable owner snapshot | **DURABLE**         | Terminal history; no retry item | `failed` is not pending retry | **out-of-scope-w3-o01** |

### D. Operator-visible projections

| Surface ID                                | Surface                                    | Owner                | Workspace scope | Current storage | Ephemeral / Durable | Restart impact                        | Honesty requirement                                 | Future W3-O02       |
| ----------------------------------------- | ------------------------------------------ | -------------------- | --------------- | --------------- | ------------------- | ------------------------------------- | --------------------------------------------------- | ------------------- |
| `projection-notification-deliveries-http` | `GET v1/notification-deliveries`           | notification-product | workspace-bound | durable history | **DURABLE**         | History only; no pending queue UX     | Must not present as durable queue / Wave 5 Complete | honesty-baseline    |
| `projection-web-notification-history`     | Web Notification History / Channel History | notification-product | workspace-bound | durable history | **DURABLE**         | Filters delivered/skipped/failed only | No queue-durable claim from this slice              | honesty-baseline    |
| `projection-command-center-toasts`        | Command Center toasts                      | command-center-ui    | n/a             | React session   | **EPHEMERAL**       | Wiped on refresh                      | Never conflate with channel delivery queue          | **out-of-scope-ux** |

### E. Internal queue representations

| Surface ID                                 | Surface                                   | Owner                 | Workspace scope | Current storage            | Ephemeral / Durable | Restart impact      | Honesty requirement                   | Future W3-O02           |
| ------------------------------------------ | ----------------------------------------- | --------------------- | --------------- | -------------------------- | ------------------- | ------------------- | ------------------------------------- | ----------------------- |
| `internal-deliveries-array`                | `InMemoryNotificationStore.deliveries[]`  | notification-delivery | workspace-bound | durable snapshot (history) | **DURABLE**         | Append-only history | Distinct from W3-O02 queue            | **out-of-scope-w3-o01** |
| `internal-telegram-adapter-sent`           | `InMemoryTelegramAdapter.sent[]`          | notification-delivery | workspace-bound | process-local              | **EPHEMERAL**       | Lost on restart     | Not durable queue; not Bot API        | honesty-baseline        |
| `internal-durable-notification-store`      | `DurableNotificationStore` snapshot       | notification-delivery | workspace-bound | durable snapshot           | **DURABLE**         | O01 analytical only | Header: Not W3-O02 queue              | **out-of-scope-w3-o01** |
| `internal-absent-notification-queue-table` | Dedicated NotificationQueue / DeliveryJob | notification-delivery | workspace-bound | **absent**                 | **EPHEMERAL**       | TD-045 gap          | Future persist on existing owner only | **W3-O02-b**            |

### F. Adjacent (not notification queue)

| Surface ID                             | Surface                      | Owner                 | Workspace scope | Current storage  | Ephemeral / Durable | Restart impact                  | Honesty requirement                      | Future W3-O02    |
| -------------------------------------- | ---------------------------- | --------------------- | --------------- | ---------------- | ------------------- | ------------------------------- | ---------------------------------------- | ---------------- |
| `adjacent-telegram-connection-pending` | TelegramConnection `pending` | notification-delivery | workspace-bound | durable snapshot | **DURABLE**         | Connect-state may survive (O01) | Connect pending ≠ delivery queue pending | honesty-baseline |

### G. Paper Outbox (TD-035) — distinct, out of W3-O02

| Surface ID                           | Surface                          | Owner            | Workspace scope | Current storage      | Ephemeral / Durable | Restart impact         | Honesty requirement                  | Future W3-O02          |
| ------------------------------------ | -------------------------------- | ---------------- | --------------- | -------------------- | ------------------- | ---------------------- | ------------------------------------ | ---------------------- |
| `paper-outbox-pending-publishing`    | Outbox `pending` \| `publishing` | event-processing | n/a             | durable paper Outbox | **DURABLE**         | Paper events survive   | **TD-035 ≠ TD-045**                  | **out-of-scope-td035** |
| `paper-outbox-retry-dead-letter`     | Outbox retry / `dead_letter`     | event-processing | n/a             | durable paper Outbox | **DURABLE**         | Paper retries resolved | Must not reuse as Notification Queue | **out-of-scope-td035** |
| `paper-outbox-published-completed`   | Outbox `published`               | event-processing | n/a             | durable paper Outbox | **DURABLE**         | Publication complete   | Distinct from DeliveryResult         | **out-of-scope-td035** |
| `paper-outbox-dead-letter-abandoned` | Outbox `dead_letter`             | event-processing | n/a             | durable paper Outbox | **DURABLE**         | Paper exhaustion only  | Not notification abandoned           | **out-of-scope-td035** |

### H. Wave 5 Notification Providers — out of W3-O02

| Surface ID                         | Surface                                    | Owner                 | Workspace scope | Current storage           | Ephemeral / Durable | Restart impact             | Honesty requirement                | Future W3-O02           |
| ---------------------------------- | ------------------------------------------ | --------------------- | --------------- | ------------------------- | ------------------- | -------------------------- | ---------------------------------- | ----------------------- |
| `wave5-reserved-inactive-channels` | email \| slack \| discord \| teams \| push | notification-delivery | workspace-bound | absent (skipped reserved) | **EPHEMERAL**       | No production send         | Wave 5 / TD-049 / TD-050           | **out-of-scope-wave-5** |
| `wave5-reserved-inactive-adapter`  | `ReservedInactiveChannelAdapter`           | notification-delivery | workspace-bound | absent / stub             | **EPHEMERAL**       | Stub always fails reserved | Production providers remain Wave 5 | **out-of-scope-wave-5** |

**Rule:** Future durable queue persistence belongs to exactly one existing owner: **notification-delivery**. Producers may call into delivery; they do not become a second queue owner.

---

## Classification summary

| Class                               | Meaning                                                                  | Count (this freeze)                                |
| ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| **Requires durable queue (TD-045)** | Producing paths + absent pending/retry/abandon + absent queue table      | See machine inventory `requiresDurableQueue: true` |
| **Ephemeral today**                 | Sync stack, adapter memory, toasts, absent queue states, reserved Wave 5 | Majority of TD-045 / Wave 5 / UX rows              |
| **Durable today (not queue)**       | DeliveryResult history, O01 snapshot, paper Outbox, Telegram connect     | W3-O01 / TD-035 / adjacent                         |
| **Wave 5**                          | Reserved-inactive production transports                                  | 2 rows                                             |
| **Out of W3-O02**                   | TD-035, W3-O01 history redesign, Wave 5, Command Center UX               | Explicit                                           |

---

## Domain distinction (binding)

```text
Notification Queue (TD-045 / W3-O02)
  └── in-flight / pending / retryable channel delivery work
      └── owner: notification-delivery (extend only)
      └── EXISTS TODAY: producing paths only (sync); pending/retry/abandon ABSENT

Notification History (W3-O01)
  └── DeliveryResult delivered|skipped|failed
      └── survives restart (analytical) — NOT the queue

Paper Outbox (TD-035)
  └── OutboxEvent pending|publishing|published|dead_letter
      └── resolved paper runtime — NOT the notification queue

Wave 5 Providers
  └── production Telegram / SMTP / Slack / Discord / Teams / Push
      └── reserved-inactive today — NOT delivered by W3-O02
```

---

## Ownership verification

| Owner                     | Role in this inventory                      | Persistence / ownership change |
| ------------------------- | ------------------------------------------- | ------------------------------ |
| notification-delivery     | Delivery domain; sole future queue owner    | **None**                       |
| notification-product      | HTTP/UI history & settings projections      | **None**                       |
| telegram-product          | Test send HTTP (calls delivery)             | **None**                       |
| product-flow              | Report / channel dispatch producers         | **None**                       |
| strategy-trading-pipeline | Runtime report-deliver producer             | **None**                       |
| event-processing          | Paper Outbox/Inbox (TD-035) — contrast only | **None**                       |
| command-center-ui         | Ephemeral toasts — contrast only            | **None**                       |

---

## Gap identification

| Gap                                              | Status after W3-O02-a                        |
| ------------------------------------------------ | -------------------------------------------- |
| Complete notification-delivery surface inventory | **Closed** (this document + machine catalog) |
| Ownership / honesty freeze                       | **Closed**                                   |
| TD-045 ≠ TD-035 ≠ W3-O01 history ≠ Wave 5        | **Closed**                                   |
| Durable queue persistence                        | **Open** → W3-O02-b                          |
| Restart-survival proof                           | **Open** → W3-O02-c                          |
| Degraded delivery honesty                        | **Open** → W3-O02-d                          |
| Package Close evidence                           | **Open** → W3-O02-e                          |

---

## Explicit OUT (do not expand without Product Owner)

- Queue persistence / restart recovery implementation
- Retry Engine, Scheduler, Workflow Engine, Event Bus
- Second Outbox / second Notification domain
- Monitoring, Business Continuity, High Availability, Disaster Recovery
- Wave 5 production transports
- Kill Switch product / Live Trading
- Opening W3-O02-b from this slice alone

---

## Honesty baseline (binding for UI / product language)

Until W3-O02-b/c Close evidence exists, no operator surface may imply:

- notification queue durable / restart-safe
- pending delivery work survives API restart
- Wave 5 production Telegram / Email / Slack send from O02
- that W3-O01 history survival alone closed TD-045
- that paper Outbox (TD-035) is the Notification Durable Queue

This slice delivers foundation inventory only.

---

**STOP.** Wait for Product Owner review before W3-O02-b.
