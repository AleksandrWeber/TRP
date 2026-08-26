# Durability Overview

**Document:** Version 3 Durability, Operations & Continuity Overview
**Date:** 2026-08-26
**Status:** Product-facing record. Wave 3 Planning **APPROVED**. W3-O01-a/b/c **APPROVED**. W3-O01-d **IMPLEMENTED** (Operational Continuity Foundation). Business Continuity / HA / Monitoring **not** delivered.
**Product:** Wave 3 — Durability, Operations & Continuity
**First package:** W3-O01 Durable Analytical Stores (V3-O01)
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.
**Inventory:** [`w3-o01-a-analytical-inventory.md`](./w3-o01-a-analytical-inventory.md)
**Operational State Matrix:** [`operational-state-matrix.md`](./operational-state-matrix.md)
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
W3-O01-a inventory complete. W3-O01-b persists SURVIVE artifacts.
W3-O01-c restores those artifacts after a normal process restart.
W3-O01-d projects operational readiness and graceful degradation after recovery.
It does NOT mean Business Continuity, High Availability, or Monitoring Complete.
```

---

## Wave packages (honest sequence)

| Package                                    | Operator meaning                                                     | Status                                                   |
| ------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------- |
| **W3-O01** Durable Analytical Stores       | Relied-on analytical artifacts survive restart (or honest ephemeral) | Planning APPROVED; **a/b/c APPROVED**; **d implemented** |
| W3-O02 Notification Durable Queue          | In-flight notification delivery not lost on process restart          | Not opened                                               |
| W3-O03 Recovery Residual (US295 / ADL-008) | Accept or write live-claim limitation — no silent PASS               | Not opened                                               |
| W3-O04 Durable Kill Switch Product         | Arm Kill Switch; sessions stop; durable across restart               | Not opened                                               |
| W3-O05 Monitoring & Security Health        | Health and recent incidents without server login; honest degradation | Not opened                                               |

---

## Current package (W3-O01)

| Capability                                            | Status                         |
| ----------------------------------------------------- | ------------------------------ |
| Inventory of process-local analytical stores          | **W3-O01-a DONE**              |
| Durable persistence for approved analytical artifacts | **W3-O01-b DONE**              |
| Normal process restart recovery                       | **W3-O01-c DONE**              |
| Operational Continuity Foundation                     | **W3-O01-d DONE**              |
| Honest ephemeral labels where survival not delivered  | Baseline documented (W3-O01-a) |
| Package Close evidence                                | Later (W3-O01-e)               |
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

### After W3-O01-d (now)

```text
Sign in
  ↓
Normal process restart restores previously persisted SURVIVE analytical state (W3-O01-c)
  ↓
Open Administration → Platform readiness
  ↓
See platform state, owner states, degraded/unavailable owners,
recovery timestamp and duration
  ↓
Unavailable owners never fabricate data; healthy owners continue when allowed
  ↓
No Business Continuity / High Availability / Monitoring claim
```

---

## Operator-visible functionality

| Surface                                        | Wave 3 role                                              | W3-O01              | After W3-O01-d                                                 |
| ---------------------------------------------- | -------------------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| Analytical / reporting artifacts after restart | Survive (default)                                        | **In**              | Restored after normal restart                                  |
| Platform readiness / operational state         | Continuity honesty after recovery                        | **W3-O01-d**        | Operator UI + readiness API                                    |
| Operational State Matrix                       | Authoritative degraded behaviour                         | **W3-O01-d**        | [`operational-state-matrix.md`](./operational-state-matrix.md) |
| Honest “ephemeral” labeling                    | Allowed only when survival not delivered                 | Baseline documented | Doc only                                                       |
| Notification delivery durability               | O02 + Wave 5 transports                                  | Out of O01          | Out                                                            |
| Kill Switch arm / stop sessions                | O04                                                      | Out of O01          | Out                                                            |
| Health / incidents without SSH                 | O05                                                      | Out of O01          | Out                                                            |
| Dependency degraded / unavailable honesty      | Continuity foundation in O01-d; O05 later productization | **Partial (O01-d)** | Owner readiness projection only                                |

---

## Customer Never Sees

- Silent disappearance of relied-on analytical artifacts presented as success
- Fake “healthy” when a required dependency is down (wave honesty)
- Live Trading enablement from Wave 3
- A second product inventing a parallel Lake or Outbox
- Another workspace’s analytical artifacts
- Plaintext secrets
- Claims of Business Continuity / High Availability / Disaster Recovery / Monitoring from W3-O01-d

---

## Security Guarantees (planning intent)

- Fail closed when workspace / auth context is missing
- Consume Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit — no new security owner
- Cross-workspace analytical artifact access denied
- Durability work does not weaken Vault ciphertext ownership
- No Live Trading path from durability packages
- Corrupt durable analytical snapshots fail honestly (no fabricated replacement state)

---

## What's Next

1. Product Owner reviews W3-O01-d reports
2. Do **not** open W3-O01-e until Product Owner authorizes
3. Do **not** claim Business Continuity, High Availability, or Monitoring from W3-O01-d
4. Do **not** claim W3-O01 Closed or Wave 3 COMPLETE

---

**STOP.** Wait for Product Owner review before W3-O01-e. Do not implement Business Continuity. Do not implement High Availability. Do not implement Monitoring.
