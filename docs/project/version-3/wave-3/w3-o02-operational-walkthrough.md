# W3-O02 Operational Walkthrough

**Package:** W3-O02 Notification Durable Queue  
**Evidence slice:** W3-O02-e  
**Date:** 2026-08-27  
**Nature:** Package operational verification walkthrough. Not a Monitoring runbook. Not HA failover. Not retry execution.

---

## Complete package journey

```text
Normal notification delivery path
        ↓
Persist queue item (W3-O02-b — DurableNotificationStore queue write-through)
        ↓
Restart application (normal process restart)
        ↓
Recover queue (W3-O02-c — integrity-gated hydrate; deterministic; idempotent)
        ↓
Derive readiness (W3-O02-d — Recovering | Ready | Degraded | Unavailable)
        ↓
Platform operational (GET /v1/operational-continuity/readiness + UI)
```

**Without:** Retry execution · Wave 5 providers · Monitoring · HA · DR

---

## Step evidence

### 1. Normal notification

Existing notification-delivery path enqueues owed work on deliver (pending → in-flight → completed | retryable). History remains distinct from queue. Wave 5 production transports are not claimed.

### 2. Persist queue

W3-O02-b persists queue items on the existing `notification-delivery` owner snapshot (`NotificationStoreDurableState.queue`). No second Outbox. No second persistence owner. Workspace-bound.

### 3. Restart application

Normal API process restart with durable (`prisma`) driver. Memory driver remains honest empty/local.

### 4. Recover queue

W3-O02-c `DurableNotificationStore.hydrate()`:

- Integrity gate before import.
- Deterministic order (`createdAt`, `queueItemId`).
- Idempotent re-hydrate.
- Missing → empty (no fabrication).
- Corrupt → fail honest / Unavailable path (not recovered).

### 5. Derive readiness

W3-O02-d evaluates recovered queue + owner boot:

- Supported states only: Recovering | Ready | Degraded | Unavailable.
- Ready requires integrity verification — never hardcoded.
- Channel-down / abandoned → Degraded (does not fabricate Ready).
- Corrupt / failed recovery → Unavailable.
- Healthy notification-delivery continues while other analytical owners are degraded (no deps).

### 6. Platform operational

`GET /v1/operational-continuity/readiness` and UI `/operational-continuity` expose:

- Notification Queue operational state
- Owner readiness
- Recovery timestamp
- Recovery duration

Do **not** expose Retry controls, Replay, Queue editing, Scheduler, Workflow controls, Monitoring dashboard, or Incident management.

---

## Walkthrough result

| Gate                                           | Result   |
| ---------------------------------------------- | -------- |
| End-to-end package journey                     | **PASS** |
| Persist → restart → recover                    | **PASS** |
| Readiness derived after recovery               | **PASS** |
| Platform readiness matches implementation      | **PASS** |
| Graceful degradation matches matrix / docs     | **PASS** |
| No Retry / Wave 5 / Monitoring / HA / DR claim | **PASS** |

---

**STOP.** Walkthrough remains Close Evidence. Do not declare W3-O02 CLOSED. Do not declare Wave 3 COMPLETE. Do not open W3-O03.
