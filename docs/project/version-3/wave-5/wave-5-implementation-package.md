# Wave 5 — Notification Platform Implementation Package

```text
Wave:               5 — Notification Platform
First package:      W5-N01 Production Telegram Bot API (V3-N01 · CM-11)
Master Plan map:    Wave 5 — Notification Platform
                    Packages: V3-N01 → V3-N02 → V3-N03 → V3-N04
                    Wave 5 exit: real transports; Telegram test sends real message;
                    control plane forbidden; routing from PC-06 to active transport.
Date:               2026-08-28
Status:             Wave Implementation Package — Planning OPEN. Awaiting Product Owner Review.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

**Companions:**

| Document                                                                           | Role                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`wave-5-product-scope.md`](./wave-5-product-scope.md)                             | IN / OUT, ownership, honesty, acceptance              |
| [`wave-5-security-review.md`](./wave-5-security-review.md)                         | Threat model, integrity, Verification Standard intent |
| [`wave-5-validation-plan.md`](./wave-5-validation-plan.md)                         | How Close is proven                                   |
| [`wave-5-overview.md`](./wave-5-overview.md)                                       | Operator / PO language product                        |
| [`wave-5-planning-summary.md`](./wave-5-planning-summary.md)                       | Wave Planning open record                             |
| [`wave-5-progress.md`](./wave-5-progress.md)                                       | Wave 5 package status                                 |
| [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md) | Implementation Readiness Checklist                    |

**Prerequisites:**

| Prerequisite                               | Status                                       |
| ------------------------------------------ | -------------------------------------------- |
| Version 2                                  | **CERTIFIED**                                |
| Wave 1 Security Foundation                 | **CERTIFIED COMPLETE**                       |
| Wave 2 Connection Management               | **COMPLETE** (consumed; not redesigned)      |
| Wave 3 Durability & Operations             | **COMPLETE** (consumed; not redesigned)      |
| Wave 4 Exchange Connectivity               | **CLOSED** by Product Owner (2026-08-28)     |
| Wave 3 Notification Durable Queue (V3-O02) | **CLOSED** (consumed)                        |
| PC-06 routing / PC-07 catalog              | Exists (extend transports only)              |
| Notification Delivery port                 | Exists (in-memory Telegram until Wave 5)     |
| Vault                                      | **CLOSED** / available                       |
| Master Plan                                | **FROZEN** — this package does not revise it |
| Security Verification Standard             | **Approved** (mandatory at Close)            |

**Planning question:** Can implementation of Wave 5 begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task per package).** Master Plan and Execution Roadmap already name **V3-N01…N04**. Architecture rule: major extension of Notification Delivery adapters — **replace nothing** in Risk, Orders, Ledger, or PC-06 routing. **Wave 5 extends existing Notification Delivery adapters only; it introduces no command bus and no second routing product.** Wave 1–4 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Notification Platform consumes Vault, Connection Management, durable queue, and Notification Delivery.
It does NOT redesign Vault, Auth, Exchange Adapter, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver Email/Slack/Discord/Teams/Push in N01 (N02–N04 sequenced).
Telegram ≠ control plane. Real delivery ≠ Live Trading.
STOP — Do not create W5-N01-a until Product Owner Approves planning.
```

**Planning status:** **OPEN for review.** Product Owner must review and Approve before any implementation.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Wave Implementation Package   ← YOU ARE HERE (Planning OPEN)
        ↓
Review                        ← not performed
        ↓
Approval                      ← not granted
        ↓
Implementation                ← forbidden until Approval + PO slice task
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close
```

---

## Overview

Wave 5 opens the **Notification Platform**. It is the wave that delivers real notification transports on the existing catalog and routing product. The first package is **W5-N01 Production Telegram Bot API** — real Bot API connect / test / disconnect with vault-backed credentials. **Real delivery** means a production transport sends a verifiable message. Telegram cannot start, stop, or approve trades.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 durable notification queue, and existing PC-06 routing / PC-07 catalog. It does not invent a second notification engine or a parallel routing product.

| Field                           | Value                                  |
| ------------------------------- | -------------------------------------- |
| Wave                            | 5 — Notification Platform              |
| Master Plan / Execution Roadmap | **V3-N01 → V3-N02 → V3-N03 → V3-N04**  |
| First package                   | **W5-N01** Production Telegram Bot API |
| Capabilities (N01)              | **CM-11**                              |
| Complexity (N01)                | M                                      |
| Previous                        | Wave 4 **CLOSED**                      |
| Next after W5-N01 Close         | W5-N02 Email SMTP (PO sequencing)      |

---

## Wave packages (Master Plan)

| Package    | Roadmap ID | Name                        | Capabilities        | Complexity |
| ---------- | ---------- | --------------------------- | ------------------- | ---------- |
| **W5-N01** | **V3-N01** | Production Telegram Bot API | CM-11               | M          |
| **W5-N02** | **V3-N02** | Email (SMTP)                | CM-12               | M          |
| **W5-N03** | **V3-N03** | Slack / Discord / Teams     | CM-13, CM-14, CM-15 | M          |
| **W5-N04** | **V3-N04** | Push                        | CM-16               | M          |

Order: **N01 → N02 → N03 → N04**. Do not skip.

---

## Business Goal

- **Goal:** Operators receive real alerts outside the process. Telegram connect binds a real chat; test sends a real message. Shipped channels get connect / test / status / disconnect. Reserved channels stay honestly reserved.
- **Honesty:** **Real delivery** means a production transport succeeded. It does **not** mean Live Trading, Telegram control plane, or Wave 5 COMPLETE from N01 alone.
- **Master Plan reference:** Wave 5 customer-observable — "I connect Telegram and receive a real test message." Execution Roadmap V3-N01…N04 / Wave 5 exit criteria.
- **Metric:** Time to connect Telegram **< 1 min** (after bot token available); simulated delivery shown as real **0 tolerated**; Telegram-initiated trade **0 tolerated**.

---

## W5-N01 — Production Telegram Bot API (first package)

### Purpose

Deliver production Telegram Bot API connect / test / disconnect using vault-backed bot tokens through Notification Delivery adapter extension.

### Consumes

| Product                    | Use                                       |
| -------------------------- | ----------------------------------------- |
| Vault                      | Bot token retrieve for adapter send only  |
| Connection Management      | Operator connect / test / disconnect UI   |
| Notification Durable Queue | Delivery survives restart (Wave 3)        |
| PC-06 routing              | Route events to active Telegram transport |
| PC-07 catalog              | Telegram channel entry                    |
| In-memory Telegram wizard  | UX pattern reuse; transport replaced      |

### Owns (outcomes only)

- Real Telegram Bot API connect / test / disconnect
- Chat binding with verifiable test message
- Honest Connected / Error / Expired labels for Telegram transport
- Attributable connect/test outcomes to Security Audit where required

### Does not own

- Secret storage (Vault)
- Routing rules (PC-06)
- Trading commands (forbidden)
- Email / Slack / Discord / Teams / Push (N02–N04)

---

## Required implementation slices — W5-N01 (planning only — not started)

| Slice    | Name                                                | Role                                                           |
| -------- | --------------------------------------------------- | -------------------------------------------------------------- |
| W5-N01-a | Notification transport inventory & honesty baseline | Stub vs real surfaces; honest delivery rules; vault path       |
| W5-N01-b | Production Telegram Bot API I/O                     | Vault-backed Bot API round-trip                                |
| W5-N01-c | Chat binding & delivery verification                | Real chat bind; test message; PC-06 routing integration        |
| W5-N01-d | Operational continuity foundation                   | Transport state durability; honest degraded when provider down |
| W5-N01-e | Security verification + package Close evidence      | Verification Standard + walkthrough + Close                    |

**STOP:** Slices are named for planning only. **Not opened.** Do not create W5-N01-a until Planning Approval.

---

## Architecture constraints (binding)

| Rule                                    | Requirement                                               |
| --------------------------------------- | --------------------------------------------------------- |
| Notification Delivery adapter extension | Major extension only — no second notification engine      |
| PC-06 routing                           | Reuse unchanged — Wave 5 adds transports, not routing SoT |
| Telegram control plane                  | **Forbidden** — delivery only                             |
| Vault                                   | Credential owner — adapters retrieve only                 |
| Exchange Adapter                        | **Untouched** — Wave 5 does not modify exchange I/O       |
| Ledger / Canonical Order Path           | **Untouched**                                             |
| Connection Management                   | Facade consumed — not redesigned                          |
| Durable queue                           | Wave 3 O02 consumed — not duplicated                      |

---

## Explicit non-claims

- Planning Review PASS — **not claimed**
- Planning APPROVED — **not claimed**
- W5-N01-a opened — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Live Trading — **not claimed**
- Telegram control plane — **not claimed**
- Email / Slack / Discord / Teams / Push delivered — **not claimed** (N02–N04)

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not begin implementation.
