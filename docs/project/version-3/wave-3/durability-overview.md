# Durability Overview

**Document:** Version 3 Durability, Operations & Continuity Overview
**Date:** 2026-08-26
**Status:** Product-facing record. Wave 3 Planning **APPROVED**. W3-O01-a **APPROVED**. W3-O01-b **IMPLEMENTED** (durable persistence foundation). Restart recovery / operational continuity **not** delivered.
**Product:** Wave 3 — Durability, Operations & Continuity
**First package:** W3-O01 Durable Analytical Stores (V3-O01)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.
**Inventory:** [`w3-o01-a-analytical-inventory.md`](./w3-o01-a-analytical-inventory.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Wave 3 makes the product **durable and operable**: restarts must not silently erase work operators rely on; later packages add durable queues, recovery honesty, Kill Switch productization, and health/incident visibility without SSH.

```text
Durable analytical stores mean operator-relied analytical artifacts survive API restart
(or the product honestly says what does not survive — default: it survives).
W3-O01 extends existing owners only — it does NOT invent a new persistence product.
It does NOT mean Live Trading enabled.
It does NOT mean Monitoring Complete.
It does NOT mean production restart-safety Complete from O01 alone.
It does NOT mean Notification delivery is production-real (Wave 5).
W3-O01-a inventory is complete. W3-O01-b persists approved SURVIVE artifacts on existing owners.
The platform does NOT automatically recover after restart.
The platform does NOT guarantee operational continuity from O01-b alone.
```

---

## Wave packages (honest sequence)

| Package                                    | Operator meaning                                                     | Status                                               |
| ------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| **W3-O01** Durable Analytical Stores       | Relied-on analytical artifacts survive restart (or honest ephemeral) | Planning APPROVED; **a APPROVED**; **b implemented** |
| W3-O02 Notification Durable Queue          | In-flight notification delivery not lost on process restart          | Not opened                                           |
| W3-O03 Recovery Residual (US295 / ADL-008) | Accept or write live-claim limitation — no silent PASS               | Not opened                                           |
| W3-O04 Durable Kill Switch Product         | Arm Kill Switch; sessions stop; durable across restart               | Not opened                                           |
| W3-O05 Monitoring & Security Health        | Health and recent incidents without server login; honest degradation | Not opened                                           |

---

## Current package (W3-O01)

| Capability                                            | Status                         |
| ----------------------------------------------------- | ------------------------------ |
| Inventory of process-local analytical stores          | **W3-O01-a DONE**              |
| Durable persistence for approved analytical artifacts | **W3-O01-b DONE**              |
| Survive-restart proof for operator-relied artifacts   | Not started (W3-O01-c)         |
| Honest ephemeral labels where survival not delivered  | Baseline documented (W3-O01-a) |
| Restart-survival proof                                | Not started (W3-O01-c)         |
| Notification durable queue                            | Out (O02)                      |
| Kill Switch product                                   | Out (O04)                      |
| Monitoring / health dashboard                         | Out (O05)                      |
| Live Trading                                          | Out (Wave 6)                   |

---

## Customer Journey (Wave 3 — operator visible)

### After Wave 3 exit (all O01…O05 Closed — not claimed now)

```text
Sign in
  ↓
Continue paper / research / connections work
  ↓
API restarts
  ↓
Relied-on paper work and owed alerts are not silently gone
  (or product honestly labels what does not survive)
  ↓
Arm Kill Switch → see sessions stop (and stay stopped across restart)
  ↓
Open health / recent incidents without SSH
  ↓
If exchange / AI / notify / DB / queue is down → degraded or unavailable
  (never fake success)
```

### W3-O01 journey (this package only — after Approval and Close)

```text
Sign in
  ↓
Create / rely on in-scope analytical artifacts
  (Reporting / related analytical surfaces named in inventory)
  ↓
API process restarts
  ↓
Those artifacts are still present
  — or —
  Product honestly shows they were ephemeral (exception path)
```

### After W3-O01-b only (now)

```text
Sign in
  ↓
Use existing analytical surfaces as before
  ↓
No new UI capability
  ↓
Approved analytical state can be persisted by existing owners
  ↓
No automatic restart recovery yet
  ↓
No operational continuity guarantee yet
```

---

## Operator-visible functionality

| Surface                                        | Wave 3 role                              | W3-O01                                   | After W3-O01-b                  |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------- | ------------------------------- |
| Analytical / reporting artifacts after restart | Survive (default)                        | **In** (proof in W3-O01-c)               | Persisted; recovery not claimed |
| Honest “ephemeral” labeling                    | Allowed only when survival not delivered | Baseline documented                      | Doc only                        |
| Notification delivery durability               | O02 + Wave 5 transports                  | Out of O01                               | Out                             |
| Kill Switch arm / stop sessions                | O04                                      | Out of O01                               | Out                             |
| Health / incidents without SSH                 | O05                                      | Out of O01                               | Out                             |
| Dependency degraded / unavailable honesty      | Wave exit; O05 primary productization    | Out of O01 (no fake success still binds) | Unchanged                       |

---

## Customer Never Sees

- Silent disappearance of relied-on analytical artifacts presented as success
- Fake “healthy” when a required dependency is down (wave honesty)
- Live Trading enablement from Wave 3
- A second product inventing a parallel Lake or Outbox
- Another workspace’s analytical artifacts
- Plaintext secrets
- Claims that W3-O01-a/b alone made the platform restart-safe or operationally continuous

---

## Security Guarantees (planning intent)

- Fail closed when workspace / auth context is missing
- Consume Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit — no new security owner
- Cross-workspace analytical artifact access denied
- Durability work does not weaken Vault ciphertext ownership
- No Live Trading path from durability packages

---

## What's Next

1. Product Owner reviews W3-O01-b reports
2. Do **not** open W3-O01-c until Product Owner authorizes
3. Do **not** claim automatic recovery or operational continuity from W3-O01-b
4. Do **not** claim W3-O01 Closed or Wave 3 COMPLETE

---

**STOP.** Wait for Product Owner review before W3-O01-c. Do not implement restart recovery. Do not implement automatic restore.
