# Notification Durable Queue Overview

**Document:** Version 3 Notification Durable Queue Overview
**Date:** 2026-08-27
**Status:** Product-facing record. W3-O02 Planning **APPROVED**. Slices **W3-O02-a** and **W3-O02-b** **COMPLETE** — awaiting Product Owner review before W3-O02-c. Restart survival of owed queue work **not** claimed yet.
**Product:** W3-O02 Notification Durable Queue (V3-O02 · NT-02 · TD-045)
**Wave:** 3 — Durability, Operations & Continuity
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.
**Umbrella:** [`w3-o02-implementation-package.md`](./w3-o02-implementation-package.md)
**Inventory (a):** [`w3-o02-a-notification-queue-inventory.md`](./w3-o02-a-notification-queue-inventory.md)
**Persistence (b):** [`w3-o02-b-implementation-report.md`](./w3-o02-b-implementation-report.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Notification Durable Queue makes **owed alerts survive process restart**: in-flight notification delivery work is not silently lost when the API restarts.

```text
Queue durable means pending / in-flight / retryable notification delivery
survives API restart (or the product records honest failure — never silent drop).
It extends the existing notification-delivery owner only —
it does NOT invent a second Outbox or a new persistence product.
It does NOT mean Wave 5 production Telegram / Email / Slack delivery.
It does NOT mean Live Trading enabled.
It does NOT mean Monitoring Complete.
It does NOT mean production restart-safety Complete from O02 alone.
It does NOT mean Wave 3 COMPLETE.
W3-O02-a inventory alone does NOT make the queue durable.
W3-O02-b persistence alone does NOT prove owed work survives restart (that is W3-O02-c).
```

---

## Why this package (after W3-O01)

W3-O01 made analytical artifacts survive restart — including notification **history**, preferences, and connect state.

That is not enough for owed alerts. If delivery work was still in flight when the process restarted, the **queue** could still lose it. W3-O02 closes that gap (TD-045).

Wave 5 will later make channels production-real. This package makes the queue restart-safe first.

---

## Current package (W3-O02)

| Capability                                    | Status                                                   |
| --------------------------------------------- | -------------------------------------------------------- |
| Planning package                              | **APPROVED**                                             |
| Notification queue inventory                  | **COMPLETE** (W3-O02-a)                                  |
| Durable queue persistence                     | **COMPLETE** (W3-O02-b — persistence only; not recovery) |
| Restart-survival proof for in-flight delivery | Planned (slice c — **not opened**)                       |
| Degraded delivery honesty                     | Planned (slice d — **not opened**)                       |
| Package Close evidence                        | Planned (slice e — **not opened**)                       |
| Wave 5 production transports                  | Out                                                      |
| Kill Switch product                           | Out (O04)                                                |
| Monitoring / health dashboard                 | Out (O05)                                                |
| Live Trading                                  | Out (Wave 6)                                             |

### What W3-O02-a found (operator language)

- Delivery finished in one step (send or skip, then history). Pending queue states were absent.
- History that already finished can survive restart (from W3-O01). **Owed unfinished work** needed a queue.
- Paper event Outbox is a **different** system — not this alert queue.
- Real Telegram / Email / Slack sending remains a later wave (Wave 5).

### What W3-O02-b delivered (operator language)

- The platform can now **write** owed delivery work into durable storage on the existing notification owner.
- Operators still see **no** Pending Queue / Retry / Recovery screens.
- **Restart survival is not claimed yet** — that proof is W3-O02-c.

---

## Customer Journey (W3-O02 — after full package Close)

```text
Sign in
  ↓
Operate so an owed notification delivery is enqueued
  (certified / in-process path until Wave 5)
  ↓
API process restarts while delivery is pending / in-flight / retryable
  ↓
Delivery work is still present and resumes
  — or —
  Product records honest failure / unavailable
  (never silent drop without a record)
```

**Not available from W3-O02-a/b alone.** Persistence writes exist after b; restart-survival proof comes in c.

### Operator workflow (at package Close)

1. Sign in with an authorized role.
2. Trigger or rely on an owed notification path that creates pending delivery work.
3. Confirm the work is attributable before restart.
4. Restart the API (Close evidence / validation).
5. Confirm the work survived and resumes — or honest failure is recorded.
6. Confirm foreign workspace and unauthorized roles are denied.

---

## Operator-visible functionality (planned outcomes)

| Surface                                        | Role in W3-O02                              |
| ---------------------------------------------- | ------------------------------------------- |
| Pending / in-flight notification delivery work | Survives restart or honest failure recorded |
| No silent drop without record                  | Binding honesty after Wave 3 queue          |
| Workspace-scoped delivery                      | A cannot see B’s delivery                   |
| Wave 5 real channel send                       | **Out** — later wave                        |
| Monitoring dashboard                           | **Out** — O05                               |

**After W3-O02-a/b:** still no new operator screen; still no restart-survival claim.

---

## Customer Never Sees

- Silent disappearance of owed in-flight delivery presented as success
- Fake “delivered” when delivery did not complete
- Production Telegram / Email / Slack / Discord / Teams / Push from this package
- Live Trading enablement from this package
- A second product inventing a parallel Outbox
- Another workspace’s notification delivery
- Plaintext secrets / bot tokens
- Claims of Monitoring Complete / Kill Switch Complete / Wave 3 COMPLETE from W3-O02
- Claims that W3-O01 history survival alone was the durable queue
- Claims that W3-O02-a inventory alone made the queue durable
- Claims that W3-O02-b persistence alone proved restart survival

---

## Security Guarantees (planning intent)

- Fail closed when workspace / auth context is missing
- Consume Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit — no new security owner
- Cross-workspace notification delivery access denied
- Queue work does not weaken Vault ciphertext ownership
- No Live Trading path from queue durability
- Telegram never becomes a control plane

---

## What's Next

1. Product Owner reviews W3-O02-b persistence foundation
2. Do **not** open W3-O02-c until Product Owner authorizes the next implementation task
3. Do **not** claim queue restart-safe, Wave 5 Complete, Live Trading, Monitoring, or Wave 3 COMPLETE

---

**STOP.** Wait for Product Owner review before W3-O02-c. Do not declare Wave 3 COMPLETE.
