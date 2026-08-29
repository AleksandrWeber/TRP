# W5-N09-a Notification Platform Workers Inventory & Honest Product Baseline

**Slice:** W5-N09-a — Notification Platform Workers Inventory & Honest Product Baseline  
**Package:** W5-N09 Notification Platform Workers Foundation (V3-N09 · CM-20)  
**Wave:** 5 — Notification Platform  
**Date:** 2026-08-29  
**Nature:** Discovery and classification only. Not Notification Platform Workers implementation. Not worker runtime. Not worker orchestration. Not retry. Not scheduler. Not production transport I/O.  
**Machine inventory:** `apps/api/src/platform-conformance/w5-n09-a-notification-platform-workers-inventory.ts`  
**Conformance:** `apps/api/src/platform-conformance/w5-n09-a-notification-platform-workers.ts`

```text
This inventory does NOT implement Notification Platform Workers.
This inventory does NOT add a worker runtime.
This inventory does NOT add delivery worker orchestration.
This inventory does NOT add delivery retry or scheduler.
This inventory does NOT add platform workers anchors or queue execution.
This inventory does NOT declare Notification Platform Workers implemented.
This inventory does NOT declare Notification Platform Complete or W5-N09 COMPLETE or Wave 5 COMPLETE.
Customer-visible platform workers remains unchanged until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Notification Platform Workers artifact required to implement W5-N09: Closed W5-N05 integration, W5-N06 delivery, W5-N07 dispatch, and W5-N08 queue foundation consumption, per-channel W5-N01…N04 foundation references, PC-06 routing consumption, PC-07 notification product surfaces, per-channel/integration/delivery/dispatch/queue operational continuity views, durable notification queue (consumed not orchestrated), missing unified platform workers layer, missing platform workers anchors/recovery/continuity, missing worker execution/scheduler/retry/dead-letter/orchestration/telemetry/scaling, TD-049/TD-050 production transport deferrals, ownership, persistence/recovery/continuity responsibility, and Honest Product boundaries. Classify each as **SURVIVE** or **EPHEMERAL**.

| Class         | Meaning                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate on existing Notification Delivery / Vault / Connection / Queue owners.  |
| **EPHEMERAL** | Transient, per-channel-only, missing workers layer, UI-only, process-local, or absent — must not be treated as platform-workers truth. |

---

## Binding finding

**Notification Platform Workers is NOT implemented. Platform workers does NOT function after this slice.**

- Closed W5-N05 integration, W5-N06 delivery, W5-N07 dispatch, and W5-N08 queue foundations exist — consumed as reference patterns only.
- Per-channel W5-N01…N04 foundations exist and are **CLOSED** — consumed as reference patterns only.
- PC-06 routing and PC-07 notification product are **implemented** — they decide routes and expose per-channel settings but do not constitute unified platform workers.
- **No** unified cross-channel platform workers layer, platform workers anchors, platform workers restart recovery, platform workers operational continuity projection, worker execution, scheduler, retry, dead-letter processing, orchestration, telemetry, or scaling exists.
- **W5-N09-b** durable platform workers anchors are **missing** — deferred to W5-N09-b; restart hydrate is W5-N09-c.
- W3-O02 durable notification queue exists on `notification-delivery` owner — queue work survives restart; platform workers orchestration is still absent.
- TD-049 / TD-050 production transport I/O remains deferred — not claimed from this inventory.

---

## Honest Product baseline

| Category                | Summary                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Implemented today**   | None — no customer-visible Notification Platform Workers functionality.                                                                                                                                                                                                                                                                                                                                            |
| **Infrastructure only** | Per-channel N01…N04 anchors, W5-N05 integration anchors/recovery/continuity, W5-N06 delivery anchors/recovery/continuity, W5-N07 dispatch anchors/recovery/continuity, W5-N08 queue anchors/recovery/continuity, per-channel/integration/delivery/dispatch/queue continuity projections, PC-06 routing, PC-07 notification product, NOTIFICATION_CHANNEL_CATALOG, durable queue/history, W5-N01…N09-a inventories. |
| **Planned**             | W5-N09-b — Durable Notification Platform Workers Foundation.                                                                                                                                                                                                                                                                                                                                                       |
| **Not implemented**     | Unified platform workers layer, platform workers restart recovery, platform workers operational continuity, worker execution, scheduler, retry, dead-letter processing, orchestration, telemetry, scaling, operator platform workers UI, production transport I/O.                                                                                                                                                 |
| **Future roadmap**      | W5-N09-c…e, Wave 6 Live Trading, Wave 7 OpenAI (out of W5-N09 scope).                                                                                                                                                                                                                                                                                                                                              |

---

## Required ownership inventory (summary)

| Artifact ID                              | Owner                 | Class     | Persistence responsibility | Recovery responsibility | Operational continuity responsibility |
| ---------------------------------------- | --------------------- | --------- | -------------------------- | ----------------------- | ------------------------------------- |
| `own-platform-workers-layer`             | notification-delivery | EPHEMERAL | Deferred W5-N09-b          | Deferred W5-N09-c       | Deferred W5-N09-d                     |
| `own-notification-delivery-domain`       | notification-delivery | SURVIVE   | notification-delivery      | notification-delivery   | platform-readiness                    |
| `own-w5-n08-queue-foundation-consume`    | w5-n08-reference      | SURVIVE   | w5-n08-reference           | w5-n08-reference        | w5-n08-reference                      |
| `own-w5-n07-dispatch-foundation-consume` | w5-n07-reference      | SURVIVE   | w5-n07-reference           | w5-n07-reference        | w5-n07-reference                      |
| `own-platform-workers-persistence`       | notification-delivery | EPHEMERAL | Deferred W5-N09-b          | none-missing            | none-missing                          |
| `own-notification-durable-queue`         | notification-delivery | SURVIVE   | notification-delivery      | notification-delivery   | platform-readiness                    |

Full row detail: `W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY` and helpers `rowsSurvive()`, `rowsEphemeral()`, `rowsNotificationPlatformWorkersSurvive()`, `rowsNotificationPlatformWorkersEphemeral()`.

---

## Notification Platform Workers SURVIVE artifacts (summary)

Notification Delivery ownership, PC-06 routing substrate, durable notification store, delivery queue, per-channel W5-N01…N04 anchors, W5-N05 integration anchors/recovery/continuity, W5-N06 delivery anchors/recovery/continuity, W5-N07 dispatch anchors/recovery/continuity, W5-N08 queue anchors/recovery/continuity, per-channel/integration/delivery/dispatch/queue operational continuity views, user preferences, delivery metadata, workspace isolation consumption, channel catalog, and verified ownership rows on existing owners.

See `rowsNotificationPlatformWorkersSurvive()` for the full machine-readable list.

---

## Notification Platform Workers EPHEMERAL artifacts (summary)

Missing unified platform workers layer, missing platform workers durable anchors, missing platform workers restart recovery, missing platform workers operational continuity, missing worker execution/scheduler/retry/dead-letter/orchestration/telemetry/scaling, missing cross-channel worker honesty unification, missing platform workers UI, missing production transport delivery (TD-049/TD-050), and honesty blockers.

See `rowsNotificationPlatformWorkersEphemeral()` for the full machine-readable list.

---

## Explicit non-claims

- Notification Platform Workers implemented — **not claimed**
- Worker execution implemented — **not claimed**
- Dead-letter queue implemented — **not claimed**
- Retry implemented — **not claimed**
- Scheduler implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N09 COMPLETE — **not claimed**
- Wave 5 COMPLETE — **not claimed**
