# W5-N04 Push — Implementation Package

```text
Package:            W5-N04
Name:               Push
Also known as:      V3-N04 · CM-16
Wave:               5 — Notification Platform
Master Plan map:    V3-N04 Push.
                    Wave 5 exit: real transports; operators receive alerts outside the process.
Date:               2026-08-29
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
| [`w5-n04-product-scope.md`](./w5-n04-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w5-n04-security-review.md`](./w5-n04-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w5-n04-validation-plan.md`](./w5-n04-validation-plan.md)   | How Close is proven                                   |
| [`w5-n04-overview.md`](./w5-n04-overview.md)                 | Operator / PO language product                        |
| [`w5-n04-planning-summary.md`](./w5-n04-planning-summary.md) | Package planning open record                          |
| [`wave-5-progress.md`](./wave-5-progress.md)                 | Wave 5 package status                                 |

**Prerequisites:**

| Prerequisite                       | Status                                          |
| ---------------------------------- | ----------------------------------------------- |
| Version 2                          | **CERTIFIED**                                   |
| Wave 1 Security Foundation         | **CERTIFIED COMPLETE**                          |
| Wave 2 Connection Management       | **COMPLETE** (consumed; not redesigned)         |
| Wave 3 Durability & Operations     | **COMPLETE** (consumed; not redesigned)         |
| Wave 4 Exchange Connectivity       | **CLOSED** by Product Owner (2026-08-28)        |
| Wave 5 Planning                    | **APPROVED** (2026-08-28)                       |
| W5-N01 Production Telegram Bot API | **CLOSED** by Product Owner (2026-08-28)        |
| W5-N02 Email SMTP                  | **CLOSED** by Product Owner (2026-08-28)        |
| W5-N03 Slack / Discord / Teams     | **CLOSED** by Product Owner (2026-08-29)        |
| Vault                              | **CLOSED** / available (VAPID/FCM secret types) |
| Notification Delivery port         | Exists (reserved-inactive Push)                 |
| PC-06 routing / PC-07 catalog      | Exists (Push reserved-inactive)                 |
| W3-O02 durable notification queue  | **CLOSED** (consumed)                           |
| Master Plan                        | **FROZEN** — this package does not revise it    |
| Security Verification Standard     | **Approved** (mandatory at Close)               |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-N04 Push** (CM-16). Architecture rule: major extension of Notification Delivery adapters — **replace nothing** in Risk, Orders, or Ledger. **W5-N04 extends the existing Notification Delivery adapters only; it introduces no command bus and no second routing product.** W5-N01, W5-N02, and W5-N03 foundation patterns are consumed — not redesigned. Wave 1–4 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Push consumes Vault, Connection Management, Notification Delivery adapters, PC-06 routing, and W5-N01…N03 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver Telegram, Email, or Slack/Discord/Teams (N01, N02, N03).
Push connected ≠ Live Trading. Push is delivery-only — never a control plane.
STOP — Do not create W5-N04-a until Product Owner Approves planning.
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

W5-N04 opens **Push**. It is the fourth and final Wave 5 product package. It establishes the engineering roadmap for production-grade browser/device push notifications on the existing catalog and routing product — vault-backed Web Push/FCM connect / test / disconnect through Notification Delivery adapter extension. Operators receive verifiable test push only after real provider round-trip (post-implementation). Push cannot start, stop, or approve trades.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 durable notification queue, Closed W5-N01, W5-N02, and W5-N03 foundation patterns, PC-06 routing, and PC-07 reserved Push channel surface. It does not invent a second notification engine or a parallel routing product.

| Field                           | Value                     |
| ------------------------------- | ------------------------- |
| Package ID                      | W5-N04                    |
| Master Plan / Execution Roadmap | **V3-N04** Push           |
| Product name                    | Push                      |
| Wave                            | 5 — Notification Platform |
| Capabilities (inventory IDs)    | **CM-16**                 |
| Complexity                      | M                         |
| Previous                        | W5-N03 **CLOSED**         |
| Next after W5-N04 Close         | Wave 5 COMPLETE (PO act)  |

---

## Business Goal

- **Goal:** Operators register devices and connect vaulted VAPID/FCM credentials to receive **real** notification test push through the production transport. Reserved-inactive Push channel becomes honestly offered when implemented.
- **Honesty:** **Real delivery** means a production push provider round-trip succeeded. It does **not** mean Live Trading, Wave 5 COMPLETE, or Notification Platform Complete.
- **Master Plan reference:** Execution Roadmap V3-N04 · CM-16 — “Activate reserved Push channel with vaulted Web Push/FCM credentials and workspace-scoped device registry.”
- **Metric:** Cross-workspace secret or token leak **0 tolerated**; simulated Connected/Delivering without push round-trip **0 tolerated**; SSRF to non-provider endpoints **0 tolerated**.

---

## Customer Problem

- **Problem:** PC-07 lists Push as reserved-inactive. Push fields show “Not offered”. No production Web Push/FCM adapters. No device token store. Operators cannot receive mobile/browser attention alerts. CM-16 readiness is **25%** per capability inventory.
- **Who feels it:** Trading operators who need mobility alerts; workspace admins who would store VAPID/FCM credentials; Product Owner who cannot advance Wave 5 push transport without V3-N04.
- **What they must do today that they should not:** Assume routing in PC-06 implies push delivery; expect Push from W5-N01, W5-N02, or W5-N03 Close alone.

---

## Business Value

- **Value delivered at W5-N04 Close (after implementation):** Push notification foundation evidenced; real push connect / test / disconnect when product slices complete; honest Connected/Delivering from transport round-trip; workspace-scoped notification and device state; CM-16 advanced for package scope.
- **What remains blocked until later waves:** Wave 5 COMPLETE (requires N01…N04 Close + PO declaration); Wave 6 live capital.

---

## Current State

| Capability or surface                  | Status            | Evidence                                  |
| -------------------------------------- | ----------------- | ----------------------------------------- |
| Wave 1 vault                           | CLOSED            | V3-S03                                    |
| Wave 2 credential collection           | COMPLETE          | W2-S01                                    |
| W5-N01 Telegram foundation             | CLOSED            | PO Close 2026-08-28                       |
| W5-N02 Email foundation                | CLOSED            | PO Close 2026-08-28                       |
| W5-N03 Slack/Discord/Teams foundation  | CLOSED            | PO Close 2026-08-29                       |
| PC-07 Push channel                     | Reserved-inactive | `wave5-reserved-inactive-channels`        |
| Production push notification transport | Not exists        | Deferred to V3-N04                        |
| Push durable anchors                   | Not exists        | Planned W5-N04-b                          |
| Push restart recovery / continuity     | Not exists        | Planned W5-N04-c/d                        |
| Device token registry                  | Not exists        | Planned under notification-delivery owner |

---

## Required implementation slices — W5-N04 (planning only — not started)

| Slice    | Name                                                  | Role                                                                             |
| -------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| W5-N04-a | Push Notification Inventory & Honest Product Baseline | Enumerate push surfaces; SURVIVE vs EPHEMERAL; honest delivery rules; vault path |
| W5-N04-b | Durable Push Notification Foundation                  | Canonical notification anchor persistence on notification-delivery owner         |
| W5-N04-c | Push Restart Recovery Foundation                      | Hydrate notification anchors after normal API restart                            |
| W5-N04-d | Push Operational Continuity Foundation                | Platform Readiness projection for Push notification state                        |
| W5-N04-e | Package Close Evidence                                | Verification Standard + walkthrough + Close                                      |

**STOP:** Slices are named for planning only. **Not opened.** Do not create W5-N04-a until Planning Approval.

---

## Architecture constraints (binding)

| Constraint                    | Rule                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| Notification Delivery         | Sole owner for new push transport artifacts                  |
| PC-06 routing                 | Reuse unchanged — Wave 5 adds transports, not routing SoT    |
| Vault                         | Credential owner — adapter retrieve only                     |
| Connection Management         | Consumed — not redesigned                                    |
| Exchange Adapter              | **Untouched** — Wave 5 does not modify exchange I/O          |
| W5-N01 / W5-N02 / W5-N03      | Consumed — not reopened                                      |
| No second notification engine | Forbidden                                                    |
| No push control plane         | Push is delivery-only                                        |
| Device token store            | Justified under notification-delivery owner when implemented |
| SSRF allowlist                | Provider push endpoints only                                 |

---

## Explicit non-claims (this planning open)

- W5-N04-a opened — **not claimed**
- Push implemented — **not claimed**
- Push notifications operational — **not claimed**
- Web Push / FCM / APNs operational — **not claimed**
- Live Notifications — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- W5-N04 Planning Review completed — **not claimed**
- W5-N04 Planning APPROVED — **not claimed**
- Master Plan changed — **not claimed**

---

**STOP.** W5-N04 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N04-a. Do not begin implementation.
