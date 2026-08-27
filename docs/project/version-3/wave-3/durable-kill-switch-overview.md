# Durable Kill Switch Overview

**Document:** Version 3 Durable Kill Switch Overview
**Date:** 2026-08-27
**Status:** Product-facing record. W3-O04 Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not approved. Not implementation. Slices not opened.
**Product:** W3-O04 Durable Kill Switch Product (V3-O04 · LT-03 · TD-047)
**Wave:** 3 — Durability, Operations & Continuity
**Nature:** Customer / operator description. Not an RC. Not an ADR. Not a Master Plan revision.
**Umbrella:** [`w3-o04-implementation-package.md`](./w3-o04-implementation-package.md)
**Scope:** [`w3-o04-product-scope.md`](./w3-o04-product-scope.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Prior closed:** [`w3-o03-package-summary.md`](./w3-o03-package-summary.md) · [`recovery-residual-overview.md`](./recovery-residual-overview.md)

This is what an ordinary operator should understand. It is not an internal design note.

---

## Purpose

Durable Kill Switch Product makes **emergency halt control honest on paper**: operators can **arm** a Kill Switch from the product, **see** that sessions stop, and **trust** that the armed state **survives restart** and **blocks evaluation/admission** — without SSH or hidden live-only controls.

```text
Kill Switch Complete (O04 scope) means visible, durable halt on paper
that survives restart and blocks evaluation/admission.
It does NOT invent a second Kill Switch engine or runtime controller.
It does NOT redesign Risk Engine.
It does NOT mean Live Trading enabled (Wave 6 reuses the same control later).
It does NOT mean Monitoring Complete (O05).
It does NOT mean Business Continuity, High Availability, or Disaster Recovery.
It does NOT mean Wave 3 COMPLETE.
Pause / resume / stop alone do NOT mean Kill Switch Complete.
Hidden live-only REST alone do NOT mean Kill Switch Complete.
W3-O01 store survival alone does NOT close Kill Switch.
W3-O02 queue durability alone does NOT close Kill Switch.
W3-O03 recovery claim stance alone does NOT close Kill Switch.
Planning open alone does NOT mean Kill Switch Complete.
```

---

## Why this package (after W3-O03)

W3-O01 made analytical artifacts survive restart.

W3-O02 made owed notification delivery survive restart.

W3-O03 made production restart-safety **claim language** honest.

That is still not enough for **operational emergency halt**. Master Plan Wave 3 requires that operators can arm a Kill Switch and see sessions stop — with halt state that survives restart. TD-047 says the durable control is live-only and hidden on paper today. W3-O04 closes that gap.

---

## Current package (W3-O04) — Planning open

| Capability                         | Status                                           |
| ---------------------------------- | ------------------------------------------------ |
| W3-O04 Planning Package            | **OPEN** — Planning COMPLETE; awaiting PO review |
| Kill Switch inventory              | Not opened (W3-O04-a)                            |
| Durable Kill Switch persistence    | Not opened (W3-O04-b)                            |
| Paper product visibility           | Not opened (W3-O04-c)                            |
| Restart survival & admission block | Not opened (W3-O04-d)                            |
| Package Close evidence             | Not opened (W3-O04-e)                            |
| Monitoring / health dashboard      | Out (O05)                                        |
| Live Trading                       | Out (Wave 6)                                     |

### What already exists (operator language)

- Domain hooks for halt admission (`kill_switch_active`) exist in runtime recovery paths.
- Kill Switch REST exists but is **live-only** and **hidden** from the paper product.
- Pause / resume / stop exist but are **not** the same as durable Kill Switch Complete.
- W3-O01, W3-O02, and W3-O03 are **CLOSED** — different durability outcomes.

---

## Customer Journey (W3-O04 — after full package Close)

```text
Sign in
  ↓
Open operational safety / Command Center surface
  ↓
Arm Kill Switch
  ↓
See sessions stop
  ↓
API restarts
  ↓
Kill Switch still armed; sessions stay stopped;
evaluation/admission still blocked on paper
  ↓
Authorized operator clears Kill Switch explicitly
```

---

## Operator-visible functionality (after Close)

| Surface                       | Meaning                                         |
| ----------------------------- | ----------------------------------------------- |
| Arm Kill Switch on paper      | Visible emergency halt control                  |
| Sessions stop                 | Trading sessions halt when armed                |
| Armed survives restart        | Halt state persists after API restart           |
| Admission blocked while armed | Paper evaluation/admission denied               |
| Explicit clear                | Authorized operator clears halt deliberately    |
| Workspace / role gates        | Foreign workspace and unauthorized roles denied |

---

## Customer Never Sees

- Hidden-only Kill Switch on paper with no product control
- Silent loss of armed state on restart presented as success
- Fake “cleared” while Kill Switch remains armed
- Live Trading enablement from this package
- Monitoring Complete / health dashboard from this package
- Business Continuity / High Availability / Disaster Recovery claims
- A second Kill Switch product or parallel halt platform
- Telegram owning Kill Switch
- Another workspace’s Kill Switch state
- Plaintext secrets
- Wave 3 COMPLETE from W3-O04 alone

---

## Security Guarantees (planning intent)

- Fail closed when workspace / auth context is missing
- Consume Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit — no new security owner
- Cross-workspace Kill Switch access denied
- Arm / clear require authorization; attributable where required
- Kill Switch work does not weaken Vault ciphertext ownership
- No Live Trading path from Kill Switch productization package
- No Gate/Risk/Kill Switch chain bypass

---

## Explicit Non-Claims

| Claim                | Status for planning open |
| -------------------- | ------------------------ |
| W3-O04 APPROVED      | **Not claimed**          |
| W3-O04 CLOSED        | **Not claimed**          |
| Kill Switch Complete | **Not claimed**          |
| Monitoring Complete  | **Not claimed**          |
| Live Trading enabled | **Not claimed**          |
| Wave 3 COMPLETE      | **Not claimed**          |
| W3-O04-a opened      | **Not claimed**          |

---

## What's Next

1. Product Owner Planning Review of W3-O04 package set
2. Product Owner Approval before any implementation slice
3. W3-O05 Monitoring & Security Health — **not opened** from this package
4. Wave 6 Live Trading — reuses same Kill Switch control later; **not enabled** by O04

---

**STOP.** Planning only. Awaiting Product Owner Planning Review. Do not open W3-O04-a. Do not approve the package. Do not declare W3-O04 READY. Do not declare Wave 3 COMPLETE.
