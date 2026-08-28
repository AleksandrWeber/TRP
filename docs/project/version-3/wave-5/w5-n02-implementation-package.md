# W5-N02 Email SMTP — Implementation Package

```text
Package:            W5-N02
Name:               Email (SMTP)
Also known as:      V3-N02 · CM-12
Wave:               5 — Notification Platform
Master Plan map:    V3-N02 Email (SMTP).
                    Wave 5 exit: real transports; operators receive alerts outside the process.
Date:               2026-08-28
Status:             Implementation Package — Planning OPEN. Awaiting Planning Review.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)

**Companions:**

| Document                                                     | Role                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| [`w5-n02-product-scope.md`](./w5-n02-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w5-n02-security-review.md`](./w5-n02-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w5-n02-validation-plan.md`](./w5-n02-validation-plan.md)   | How Close is proven                                   |
| [`w5-n02-overview.md`](./w5-n02-overview.md)                 | Operator / PO language product                        |
| [`w5-n02-planning-summary.md`](./w5-n02-planning-summary.md) | Package planning open record                          |
| [`wave-5-progress.md`](./wave-5-progress.md)                 | Wave 5 package status                                 |

**Prerequisites:**

| Prerequisite                       | Status                                             |
| ---------------------------------- | -------------------------------------------------- |
| Version 2                          | **CERTIFIED**                                      |
| Wave 1 Security Foundation         | **CERTIFIED COMPLETE**                             |
| Wave 2 Connection Management       | **COMPLETE** (consumed; not redesigned)            |
| Wave 3 Durability & Operations     | **COMPLETE** (consumed; not redesigned)            |
| Wave 4 Exchange Connectivity       | **CLOSED** by Product Owner (2026-08-28)           |
| Wave 5 Planning                    | **APPROVED** (2026-08-28)                          |
| W5-N01 Production Telegram Bot API | **CLOSED** by Product Owner (2026-08-28)           |
| Vault                              | **CLOSED** / available (`HoldableSecretType.Smtp`) |
| Notification Delivery port         | Exists (reserved-inactive email channel)           |
| PC-06 routing / PC-07 catalog      | Exists (email reserved-inactive)                   |
| W3-O02 durable notification queue  | **CLOSED** (consumed)                              |
| Master Plan                        | **FROZEN** — this package does not revise it       |
| Security Verification Standard     | **Approved** (mandatory at Close)                  |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-N02 Email (SMTP)** (CM-12). Architecture rule: major extension of Notification Delivery adapters — **replace nothing** in Risk, Orders, or Ledger. **W5-N02 extends the existing Notification Delivery adapters only; it introduces no command bus and no second routing product.** W5-N01 foundation patterns are consumed — not redesigned. Wave 1–4 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Email SMTP consumes Vault, Connection Management, Notification Delivery adapters, PC-06 routing, and W5-N01 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT merge Auth host mail (password recovery) with Notification SMTP.
It does NOT own live order submission (Wave 6).
It does NOT deliver Telegram, Slack, Discord, Teams, or Push (N01, N03, N04).
SMTP connected ≠ Live Trading. Email is delivery-only — never a control plane.
STOP — Do not create W5-N02-a until Product Owner Approves planning.
```

**Planning status:** **OPEN for review.** Product Owner must review and Approve before any implementation.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (Planning OPEN)
        ↓
Review                   ← not performed
        ↓
Approval                 ← not granted
        ↓
Implementation           ← forbidden until Approval + PO slice task
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

W5-N02 opens **Email (SMTP)**. It is the second Wave 5 product package. It establishes the engineering roadmap for production-grade email notifications on the existing catalog and routing product — vault-backed SMTP connect / test / disconnect through Notification Delivery adapter extension. Operators receive verifiable test email only after real SMTP round-trip (post-implementation). Email cannot start, stop, or approve trades.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 durable notification queue, Closed W5-N01 Telegram Notification foundation patterns, PC-06 routing, and PC-07 reserved email channel surfaces. It does not invent a second notification engine or a parallel routing product.

| Field                           | Value                                          |
| ------------------------------- | ---------------------------------------------- |
| Package ID                      | W5-N02                                         |
| Master Plan / Execution Roadmap | **V3-N02** Email (SMTP)                        |
| Product name                    | Email SMTP                                     |
| Wave                            | 5 — Notification Platform                      |
| Capabilities (inventory IDs)    | **CM-12**                                      |
| Complexity                      | M                                              |
| Previous                        | W5-N01 **CLOSED**                              |
| Next after W5-N02 Close         | W5-N03 Slack / Discord / Teams (PO sequencing) |

---

## Business Goal

- **Goal:** Operators connect vaulted SMTP credentials and receive **real** notification test email through the production transport. Reserved-inactive email channel becomes honestly offered when implemented.
- **Honesty:** **Real delivery** means a production SMTP round-trip succeeded. It does **not** mean Live Trading, Wave 5 COMPLETE, or Notification Platform Complete.
- **Master Plan reference:** Execution Roadmap V3-N02 · CM-12 — “Activate reserved Email channel with vaulted SMTP.”
- **Metric:** Cross-workspace secret leak **0 tolerated**; simulated Connected/Delivering without SMTP round-trip **0 tolerated**; Auth host mail path conflation **0 tolerated**.

---

## Customer Problem

- **Problem:** PC-07 lists Email as reserved-inactive. SMTP fields show “Not offered”. No production SMTP adapter. Operators cannot receive notification alerts by email. CM-12 readiness is **25%** per capability inventory.
- **Who feels it:** Trading operators who need universal email alerts; workspace admins who would store SMTP credentials; Product Owner who cannot advance Wave 5 email transport without V3-N02.
- **What they must do today that they should not:** Assume email routing in PC-06 implies delivery; conflate Auth password-recovery mail with Notification Email product; expect SMTP from W5-N01 Close alone.

---

## Business Value

- **Value delivered at W5-N02 Close (after implementation):** Email notification foundation evidenced; real SMTP connect / test / disconnect when product slices complete; honest Connected/Delivering from transport round-trip; workspace-scoped email notification state; CM-12 advanced for package scope.
- **What remains blocked until later packages / waves:** W5-N03 Slack/Discord/Teams; W5-N04 Push; Wave 5 COMPLETE (requires N01…N04 + PO declaration); Wave 6 live capital.

---

## Current State

| Capability or surface                  | Status            | Evidence                           |
| -------------------------------------- | ----------------- | ---------------------------------- |
| Wave 1 vault                           | CLOSED            | V3-S03; `HoldableSecretType.Smtp`  |
| Wave 2 credential collection           | COMPLETE          | W2-S01                             |
| W5-N01 Telegram foundation             | CLOSED            | PO Close 2026-08-28                |
| PC-07 email channel                    | Reserved-inactive | `wave5-reserved-inactive-channels` |
| Production SMTP notification transport | Not exists        | Deferred to V3-N02                 |
| Auth host mail (recovery)              | Exists            | S01-e — **not** Notification SMTP  |
| Email notification durable anchors     | Not exists        | Planned W5-N02-b                   |
| Email restart recovery / continuity    | Not exists        | Planned W5-N02-c/d                 |

---

## Required implementation slices — W5-N02 (planning only — not started)

| Slice    | Name                                                   | Role                                                                                   |
| -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| W5-N02-a | Email Notification Inventory & Honest Product Baseline | Enumerate email/SMTP surfaces; SURVIVE vs EPHEMERAL; honest delivery rules; vault path |
| W5-N02-b | Durable Email Notification Foundation                  | Canonical email notification anchor persistence on notification-delivery owner         |
| W5-N02-c | Email Notification Restart Recovery Foundation         | Hydrate email notification anchors after normal API restart                            |
| W5-N02-d | Email Notification Operational Continuity Foundation   | Platform Readiness projection for email notification state                             |
| W5-N02-e | Package Close Evidence                                 | Verification Standard + walkthrough + Close                                            |

**STOP:** Slices are named for planning only. **Not opened.** Do not create W5-N02-a until Planning Approval.

---

## Architecture constraints (binding)

| Constraint                              | Rule                                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| Notification Delivery                   | Sole owner for new email transport artifacts                 |
| PC-06 routing                           | Reuse unchanged — Wave 5 adds transports, not routing SoT    |
| Vault                                   | Credential owner — adapter retrieve only                     |
| Connection Management                   | Consumed — not redesigned                                    |
| Exchange Adapter                        | **Untouched** — Wave 5 does not modify exchange I/O          |
| Auth host mail                          | **Separate** — identity recovery only; not Notification SMTP |
| W5-N01                                  | Consumed — not reopened                                      |
| No second notification engine           | Forbidden                                                    |
| No Telegram-style command bus for email | Email is delivery-only                                       |

---

## Explicit non-claims (this planning open)

- W5-N02-a opened — **not claimed**
- SMTP implemented — **not claimed**
- Email notifications operational — **not claimed**
- Email sent — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N03 / N04 opened — **not claimed**
- Master Plan changed — **not claimed**

---

**STOP.** W5-N02 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N02-a. Do not begin implementation.
