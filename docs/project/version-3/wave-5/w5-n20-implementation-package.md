# W5-N20 Notification Retry Policy Foundation — Implementation Package

```text
Package:            W5-N20
Name:               Notification Retry Policy Foundation
Also known as:      V3-N20 · CM-30
Wave:               5 — Notification Platform
Master Plan map:    V3-N20 Notification Retry Policy Foundation (Product Owner authorization).
                    Wave 5 exit: real transports; operators receive alerts outside the process.
Date:               2026-09-12
Status:             Implementation Package — Planning APPROVED. W5-N20-a authorized only (not opened).
Nature:             Planning package only. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
Beginning commit:   2321b38ce565efb207622c4eb6b28c44ca292cb9
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)

**Companions:**

| Document                                                                           | Role                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`w5-n20-product-scope.md`](./w5-n20-product-scope.md)                             | IN / OUT, ownership, honesty, acceptance              |
| [`w5-n20-security-review.md`](./w5-n20-security-review.md)                         | Threat model, integrity, Verification Standard intent |
| [`w5-n20-validation-plan.md`](./w5-n20-validation-plan.md)                         | How Close is proven                                   |
| [`notification-retry-policy-overview.md`](./notification-retry-policy-overview.md) | Operator / PO language product                        |
| [`w5-n20-planning-summary.md`](./w5-n20-planning-summary.md)                       | Package planning open record                          |
| [`wave-5-progress.md`](./wave-5-progress.md)                                       | Wave 5 package status                                 |

**Prerequisites:**

| Prerequisite                                             | Status                                                                                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version 2                                                | **CERTIFIED**                                                                                                                                                                                                       |
| Wave 1 Security Foundation                               | **CERTIFIED COMPLETE**                                                                                                                                                                                              |
| Wave 2 Connection Management                             | **COMPLETE** (consumed; not redesigned)                                                                                                                                                                             |
| Wave 3 Durability & Operations                           | **COMPLETE** (consumed; not redesigned)                                                                                                                                                                             |
| Wave 4 Exchange Connectivity                             | **CLOSED** by Product Owner (2026-08-28)                                                                                                                                                                            |
| Wave 5 Planning                                          | **APPROVED** (2026-08-28)                                                                                                                                                                                           |
| W5-N01 Production Telegram Bot API                       | **CLOSED** by Product Owner (2026-08-28)                                                                                                                                                                            |
| W5-N02 Email SMTP                                        | **CLOSED** by Product Owner (2026-08-28)                                                                                                                                                                            |
| W5-N03 Slack / Discord / Teams                           | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N04 Push                                              | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N05 Notification Platform Integration                 | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N06 Notification Platform Delivery Foundation         | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N07 Notification Platform Dispatch Foundation         | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N08 Notification Platform Queue Foundation            | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N09 Notification Platform Workers Foundation          | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N10 Notification Platform Worker Execution Foundation | **CLOSED** by Product Owner (2026-08-29)                                                                                                                                                                            |
| W5-N11 Notification Platform Worker Runtime Foundation   | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N12 Notification Platform Scheduler Foundation        | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N13 Notification Platform Retry Foundation            | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N14 Notification Platform Dead Letter Foundation      | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N15 Notification Platform Telemetry Foundation        | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N16 Notification Platform Metrics Foundation          | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N17 Notification Platform Delivery Reliability        | **CLOSED** by Product Owner (2026-09-02)                                                                                                                                                                            |
| W5-N18 Notification Platform Retry Execution Foundation  | **CLOSED** by Product Owner (2026-09-10)                                                                                                                                                                            |
| W5-N19 Notification Retry Scheduling Foundation          | **CLOSED** by Product Owner (2026-09-10)                                                                                                                                                                            |
| Vault                                                    | **CLOSED** / available                                                                                                                                                                                              |
| Notification Delivery port                               | Exists (per-channel, integration, delivery, dispatch, queue, workers, worker execution, worker runtime, scheduler, retry, dead-letter, telemetry, metrics, reliability, retry execution, retry scheduling on owner) |
| PC-06 routing / PC-07 catalog                            | Exists (NT-01 reuse; all channels catalogued)                                                                                                                                                                       |
| W3-O02 durable notification queue                        | **CLOSED** (consumed)                                                                                                                                                                                               |
| Master Plan                                              | **FROZEN** — this package does not revise it                                                                                                                                                                        |
| Security Verification Standard                           | **Approved** (mandatory at Close)                                                                                                                                                                                   |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: NO — not until Product Owner Planning Review, Planning Approval, and an authorized implementation task.** Product Owner authorization names **V3-N20 Notification Retry Policy Foundation** (CM-30). Architecture rule: major extension of Notification Delivery retry policy foundation layer — **replace nothing** in Risk, Orders, or Ledger. **W5-N20 extends the existing Notification Delivery and PC-06 integration layer only; it introduces no Policy Engine product, no Retry Platform, no Workflow Engine, no Event Bus product, no orchestration platform, no command bus, and no second routing product.** W5-N01…N19 foundation patterns are consumed — not redesigned. Wave 1–4 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Notification Retry Policy Foundation consumes Vault, Connection Management, Notification Delivery,
PC-06 routing, W3-O02 durable queue substrate, Closed W5-N18 retry execution, Closed W5-N19 retry scheduling,
and W5-N01…N19 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT reopen per-channel transport I/O (N01…N04).
It does NOT reopen platform integration (N05).
It does NOT reopen platform delivery (N06).
It does NOT reopen platform dispatch (N07).
It does NOT reopen platform queue (N08).
It does NOT reopen platform workers (N09).
It does NOT reopen platform worker execution (N10).
It does NOT reopen platform worker runtime (N11).
It does NOT reopen platform scheduler foundation (N12).
It does NOT reopen platform retry foundation (N13).
It does NOT reopen platform dead-letter (N14).
It does NOT reopen platform telemetry (N15).
It does NOT reopen platform metrics (N16).
It does NOT reopen platform delivery reliability (N17).
It does NOT reopen platform retry execution (N18).
It does NOT reopen platform retry scheduling (N19).
It does NOT own Anthropic / AI Gateway (Wave 7 CM-20 path).
It does NOT redesign Connection Management provider framework (inventory CM-21 path).
It does NOT own Wave 3 MN-02 Observability product.
It does NOT introduce a Policy Engine product, Retry Platform, Workflow Engine, Event Bus product, or orchestration platform.
It does NOT implement retry policy evaluation runtime, backoff calculation, retry scheduler runtime,
retry execution runtime, transport execution, SMTP/Telegram/Discord/Slack/Webhook provider behavior,
dead-letter processing, notification routing, notification catalog, monitoring platform, telemetry platform,
metrics platform, Business Continuity, High Availability, Disaster Recovery, Live Notifications,
Production Ready, or Wave 5 COMPLETE.
Retry Policy Foundation ≠ retry policy evaluation runtime.
Retry Policy Foundation ≠ backoff calculation.
Retry Policy Foundation ≠ retry scheduler runtime.
Retry Policy Foundation ≠ retry execution runtime.
Retry Policy Foundation ≠ successful delivery.
Retry Policy Foundation ≠ provider acceptance.
Retry Policy Foundation ≠ recipient receipt.
Retry Policy Foundation ≠ exactly-once delivery.
Retry Policy Foundation ≠ delivery guarantee.
Retry Policy Foundation ≠ Live Trading.
Notifications are delivery-only — never a control plane.
STOP — Do not create W5-N20-a until Product Owner Approves planning.
```

**Planning status:** **APPROVED** (2026-09-12). See [`w5-n20-planning-approval.md`](./w5-n20-planning-approval.md). W5-N20-a authorized only — not opened.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (Planning OPEN)
        ↓
Review                   ← PASS
        ↓
Approval                 ← RECORDED
        ↓
Implementation           ← authorized for W5-N20-a only (not opened)
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

W5-N20 opens **Notification Retry Policy Foundation**. It is the twentieth Wave 5 product package. It establishes the engineering roadmap for governed retry policy integrity — defining how retry behavior is described, validated, and owned — on the existing catalog and routing product. It builds on Closed W5-N19 Retry Scheduling Foundation and Closed W5-N18 Retry Execution Foundation through Notification Delivery extension and PC-06 routing consumption. Operators receive a unified honest notification retry policy foundation journey only after real retry policy foundation evidence (post-implementation). Notifications cannot start, stop, or approve trades.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 durable notification queue, Closed W5-N01…N19 foundation patterns, Closed W5-N18 retry execution, Closed W5-N19 retry scheduling, PC-06 routing, and PC-07 catalog. It does not invent a Policy Engine product, a Retry Platform, a Workflow Engine, an Event Bus product, an orchestration platform, a second notification engine, or a parallel routing product.

| Field                           | Value                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| Package ID                      | W5-N20                                                      |
| Master Plan / Execution Roadmap | **V3-N20** Notification Retry Policy Foundation             |
| Product name                    | Notification Retry Policy Foundation                        |
| Wave                            | 5 — Notification Platform                                   |
| Capabilities (inventory IDs)    | **CM-30** (Wave 5 PO scope)                                 |
| Complexity                      | M                                                           |
| Previous                        | W5-N19 **CLOSED**                                           |
| Next after W5-N20 Close         | Separate PO act (Wave 5 COMPLETE remains a separate PO act) |

---

## Business Goal

- **Goal:** Operators experience a deterministic, governed Notification Retry Policy Foundation on the existing notification-delivery owner — with policy inventory, policy persistence strategy, policy recovery strategy, and operational continuity for retry policy evidenced on existing owners.
- **Honesty:** **Retry Policy Foundation** means governed policy-layer coherence for describing and owning how retry behavior is defined — not policy evaluation runtime, backoff calculation, retry scheduler runtime, retry execution runtime, transport execution, successful delivery, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantee, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from planning alone. It does **not** mean Live Trading.
- **Master Plan reference:** Product Owner authorization V3-N20 · CM-30 — "Establish governed retry policy foundation on retry scheduling and retry execution foundations; define how retry behavior is described, validated, and owned on existing notification-delivery owner; TD-049 / TD-050 remain deferred."
- **Metric:** Cross-workspace state leak **0 tolerated**; simulated retry-policy-ready without foundation evidence **0 tolerated**; Policy Engine / Retry Platform / Workflow Engine / Event Bus / orchestration platform **0 tolerated**; transport success claims from foundation slices **0 tolerated**.

---

## What Retry Policy means in Version 3 (binding)

**Retry Policy** in Version 3 means only the **retry policy foundation capabilities owned by the existing `notification-delivery` bounded context** — policy inventory, policy persistence strategy, policy recovery strategy, operational continuity for retry policy, and honest platform-wide retry-policy rules that define how retry behavior is described, validated, and owned.

**Owner:** Existing **`notification-delivery`** bounded context only. No new owner. No new bounded context.

**Retry Policy does NOT mean:** retry policy evaluation runtime, backoff calculation, retry scheduler runtime, retry execution runtime, transport execution, provider execution, successful delivery, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantee, Live Notifications, Production Ready, Notification Platform Complete, or Wave 5 COMPLETE. See [`w5-n20-product-scope.md`](./w5-n20-product-scope.md) for canonical Honest Product boundaries.

---

## Relationship with W5-N18 / W5-N19 (binding)

| Package    | Provides                                                                                                              | W5-N20                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **W5-N18** | Retry execution foundation: inventory, durable persistence, restart recovery, operational continuity, Close Evidence  | **Consumed** — ownership retained; not redesigned |
| **W5-N19** | Retry scheduling foundation: inventory, durable persistence, restart recovery, operational continuity, Close Evidence | **Consumed** — ownership retained; not redesigned |
| **W5-N20** | Retry policy foundation on N18/N19 inputs — policy description and ownership only                                     | **Consumes both** — no ownership transfer         |

W5-N18 established **retry execution** persistence, recovery, and operational continuity. W5-N19 established **retry scheduling** eligibility timing. W5-N20 plans governed **retry policy** so how retry behavior is described, validated, and owned is determined deterministically — still on the same owner, still foundation-scoped, still not runtime evaluation or a Policy Engine product.

---

## Restart continuity and durable anchors (binding)

**Policy inventory**, **policy persistence strategy**, **policy recovery strategy**, and **operational continuity for retry policy** extend the existing **`notification-delivery` owner only**. They do **not** introduce a Policy Engine product, Retry Platform, Workflow Engine, Event Bus product, orchestration platform, durability platform, runtime platform, operational platform, or persistence owner.

---

## Governance (binding)

| Rule          | Binding                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Engineering   | Prepares **implementation evidence only**                                                                    |
| Product Owner | **Only** authority that determines W5-N20 package acceptance (Planning Approval, slice authorization, Close) |
| Prohibition   | Engineering must **never** infer customer-visible delivery claims beyond implemented evidence                |

---

## Customer Problem

- **Problem:** W5-N18 closed Retry Execution Foundation. W5-N19 closed Retry Scheduling Foundation — canonical inventory, durable persistence, restart recovery, operational continuity, and Package Close. Retry execution and scheduling foundation evidence now exist. However, the platform still has no governed policy foundation defining how retry behavior is described, validated, and owned. Operators lack deterministic retry policy description on the existing notification-delivery owner. TD-049 / TD-050 remain deferred. CM-30 readiness for Notification Retry Policy Foundation is **0%** per planning baseline.
- **Who feels it:** Trading operators who need governed description of retry behavior; workspace admins who configure multiple channels; Product Owner who cannot advance Wave 5 retry policy without V3-N20.
- **What they must do today that they should not:** Assume Retry Scheduling Close (N19) or Retry Execution Close (N18) implies retry policy is described and owned; assume any foundation Close implies Notification Platform Complete, Live Notifications, or Production Ready.

---

## Business Value

- **Value delivered at W5-N20 Close (after implementation):** Notification Retry Policy Foundation evidenced; policy inventory; policy persistence strategy; policy recovery strategy; operational continuity for retry policy; CM-30 advanced for Wave 5 package scope.
- **What remains blocked until later waves / packages:** Retry policy evaluation runtime; backoff calculation; retry scheduler runtime; retry execution runtime; transport execution; provider delivery guarantees; Live Notifications; Production Ready; Wave 5 COMPLETE (separate PO act); dead-letter processing; monitoring / telemetry / metrics platforms; Business Continuity / HA / DR; Wave 6 live capital.

---

## Current State

| Capability or surface                          | Status         | Evidence                                       |
| ---------------------------------------------- | -------------- | ---------------------------------------------- |
| Wave 1 vault                                   | CLOSED         | V3-S03                                         |
| Wave 2 credential collection                   | COMPLETE       | W2-S01                                         |
| W5-N01…N19 foundations                         | CLOSED         | PO Close records                               |
| W5-N18 retry execution foundation              | CLOSED         | PO Close record                                |
| W5-N19 retry scheduling foundation             | CLOSED         | PO Close record                                |
| PC-06 routing                                  | Exists (NT-01) | Reuse unchanged                                |
| PC-07 all channel surfaces                     | Catalogued     | Per-channel reserved-inactive where applicable |
| Cross-channel platform retry policy foundation | Not exists     | Deferred to V3-N20                             |
| Retry policy inventory                         | Not exists     | Planned W5-N20-a                               |
| Policy persistence strategy                    | Not exists     | Planned W5-N20-b                               |
| Policy recovery strategy                       | Not exists     | Planned W5-N20-c                               |
| Policy operational continuity                  | Not exists     | Planned W5-N20-d                               |
| Policy evaluation / backoff / runtime          | Not exists     | Out of W5-N20 foundation scope                 |
| Production transports (TD-049 / TD-050)        | Not exists     | Out of W5-N20 foundation scope                 |

---

## Required implementation slices — W5-N20 (planning only — not started)

### W5-N20-a — Notification Retry Policy Inventory & Honest Product Baseline

| Field              | Value                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | Enumerate every retry policy surface; classify SURVIVE vs EPHEMERAL; freeze honesty rules; document policy-description gaps |
| **Ownership**      | Engineering discovery on `notification-delivery` owner substrate; no new bounded context                                    |
| **Dependencies**   | Closed W5-N01…N19 foundations; Closed W5-N18 retry execution; Closed W5-N19 retry scheduling; PC-06 routing; PC-07 catalog  |
| **Deliverables**   | Machine-readable inventory; human inventory document; honesty baseline table; deferred runtime-evaluation list              |
| **Validation**     | Inventory completeness review; architecture review; no customer-visible delivery behaviour                                  |
| **Technical debt** | None introduced — discovery only; TD-049 / TD-050 / policy evaluation runtime remain explicitly deferred                    |

### W5-N20-b — Durable Retry Policy Persistence Foundation

| Field              | Value                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | Persist canonical retry policy anchors on notification-delivery owner; extend N18/N19 patterns                                           |
| **Ownership**      | `notification-delivery` — sole owner for new durable retry policy foundation artifacts                                                   |
| **Dependencies**   | W5-N20-a inventory; Closed W5-N18 retry execution anchors; Closed W5-N19 retry scheduling anchors; W3-O02 queue substrate (consume only) |
| **Deliverables**   | Durable policy persistence; conformance registry; implementation report                                                                  |
| **Validation**     | Unit + integration tests; workspace binding; no cross-workspace leak; regression on N01…N19                                              |
| **Technical debt** | None introduced — extend existing owner only; no second persistence store; no Policy Engine                                              |

### W5-N20-c — Restart-Safe Retry Policy Recovery Foundation

| Field              | Value                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Objective**      | Hydrate retry policy state after normal API restart; prove SURVIVE classification from slice a  |
| **Ownership**      | `notification-delivery` — recovery on same owner as W5-N20-b                                    |
| **Dependencies**   | W5-N20-b durable anchors; normal process restart semantics; Closed N18/N19 recovery patterns    |
| **Deliverables**   | Restart-safe policy recovery registry; hydrate path; implementation report                      |
| **Validation**     | Restart simulation tests; policy state restored claims; regression suite                        |
| **Technical debt** | None introduced — recovery extends durable owner; no new recovery subsystem; no Workflow Engine |

### W5-N20-d — Retry Policy Operational Continuity Foundation

| Field              | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Objective**      | Project honest Platform Readiness for retry policy via `notificationPlatformRetryPolicy` view             |
| **Ownership**      | Platform Readiness projection on existing operational continuity owner; `notification-delivery` substrate |
| **Dependencies**   | W5-N20-b/c; Closed N18-d / N19-d operational continuity projections; Platform Readiness contract          |
| **Deliverables**   | Continuity projection module; Platform Readiness fields; implementation report                            |
| **Validation**     | Continuity spec tests; honest Platform Ready rules; degraded-state behaviour; regression on prior slices  |
| **Technical debt** | None introduced — projection only; policy evaluation runtime / provider success remain deferred           |

### W5-N20-e — Package Close Evidence

| Field              | Value                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Objective**      | Assemble Verification Standard evidence, operational walkthrough, and package Close artifacts for PO review |
| **Ownership**      | Engineering Close Evidence; Product Owner Close decision separate                                           |
| **Dependencies**   | Slices W5-N20-a…d COMPLETE; Final Package Integration Verification criteria                                 |
| **Deliverables**   | Close Evidence module; package summary; operational walkthrough; Final Integration Verification             |
| **Validation**     | Full regression suite; git diff --check; walkthrough PASS; engineering confidence record                    |
| **Technical debt** | None introduced — evidence assembly only; technical debt delta must remain zero at Close                    |

**STOP:** Slices are named for planning. Planning **APPROVED**. Implementation **AUTHORIZED** for **W5-N20-a only**. W5-N20-a **not opened** — requires explicit PO slice task. Do not open W5-N20-b…e.

---

## Architecture constraints (binding)

| Constraint                                    | Rule                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Notification Delivery                         | Sole owner for new platform retry policy foundation artifacts               |
| PC-06 routing                                 | Reuse unchanged — retry policy foundation consumes routing; not routing SoT |
| Vault                                         | Credential owner — consumed only                                            |
| Connection Management                         | Consumed — not redesigned                                                   |
| Exchange Adapter                              | **Untouched** — Wave 5 does not modify exchange I/O                         |
| W5-N01…N19                                    | Consumed — not reopened                                                     |
| W5-N18 retry execution                        | Consumed — not redesigned                                                   |
| W5-N19 retry scheduling                       | Consumed — not redesigned                                                   |
| W3-O02 durable queue                          | Consumed — queue substrate owner unchanged                                  |
| Wave 3 MN-02 Observability product            | **Out of scope** — not replaced or duplicated                               |
| No second notification engine                 | Forbidden                                                                   |
| No Policy Engine product                      | Forbidden                                                                   |
| No Retry Platform                             | Forbidden                                                                   |
| No Workflow Engine                            | Forbidden                                                                   |
| No Event Bus product                          | Forbidden                                                                   |
| No orchestration platform                     | Forbidden                                                                   |
| No policy evaluation runtime from foundation  | Forbidden                                                                   |
| No backoff calculation from foundation        | Forbidden                                                                   |
| No retry scheduler runtime from foundation    | Forbidden                                                                   |
| No retry execution runtime from foundation    | Forbidden                                                                   |
| No transport execution from foundation slices | Forbidden                                                                   |
| No notification control plane                 | Retry-policy-foundation-only — never trading commands                       |
| AI Gateway / Anthropic                        | **Out of scope** — Wave 7 CM-20 path untouched                              |
| Connection Management provider framework      | **Out of scope** — inventory CM-21 path untouched                           |

---

## Dependency map

| Dependency                         | Relationship | Constraint                 |
| ---------------------------------- | ------------ | -------------------------- |
| W5-N01…N04 per-channel foundations | Consumed     | Not redesigned             |
| W5-N05…N19 platform foundations    | Consumed     | Not redesigned             |
| W5-N18 retry execution             | Consumed     | Not redesigned             |
| W5-N19 retry scheduling            | Consumed     | Not redesigned             |
| PC-06 routing                      | Consumed     | SoT unchanged              |
| PC-07 catalog                      | Consumed     | No parallel catalog        |
| W3-O02 durable queue               | Consumed     | Queue owner unchanged      |
| Wave 1 Vault                       | Consumed     | Credential owner unchanged |
| Wave 2 Connection Management       | Consumed     | Facade owner unchanged     |
| Wave 4 Exchange Adapter            | Untouched    | No exchange I/O            |

---

## Governance

| Item                | Rule                                      |
| ------------------- | ----------------------------------------- |
| Planning Review     | Required before Approval                  |
| Planning Approval   | Required before W5-N20-a                  |
| Slice authorization | Separate PO act per slice                 |
| Master Plan         | **FROZEN** — not modified by this package |
| Version 2           | Consume only — no redesign                |
| Wave 5 COMPLETE     | Separate PO act — not claimed from N20    |

---

## Package completion criteria (post-implementation)

| #   | Criterion                                                       | Evidence                    |
| --- | --------------------------------------------------------------- | --------------------------- |
| 1   | Retry policy inventory complete                                 | W5-N20-a                    |
| 2   | Durable policy persistence on correct owner                     | W5-N20-b                    |
| 3   | Restart-safe policy recovery hydrates state                     | W5-N20-c                    |
| 4   | Operational continuity projects honest readiness                | W5-N20-d                    |
| 5   | Close Evidence assembled                                        | W5-N20-e                    |
| 6   | Cross-channel honest retry-policy rules evidenced               | Implementation + validation |
| 7   | No cross-workspace retry-policy state leak                      | Security validation         |
| 8   | W5-N01…N19 boundaries unchanged                                 | Regression                  |
| 9   | Master Plan unchanged                                           | Governance                  |
| 10  | No Policy Engine / Retry Platform / Workflow Engine / Event Bus | Architecture                |

---

## Explicit non-claims (this planning open)

- W5-N20 Planning Review completed — **recorded** (PASS)
- W5-N20 Planning APPROVED — **recorded** (2026-09-12)
- W5-N20-a opened — **not claimed**
- Notification Retry Policy Foundation implemented — **not claimed**
- Retry Policy implemented — **not claimed**
- Retry policy evaluation runtime — **not claimed**
- Backoff calculation — **not claimed**
- Retry scheduler runtime — **not claimed**
- Retry execution runtime — **not claimed**
- Successful delivery — **not claimed**
- Provider acceptance — **not claimed**
- Recipient receipt — **not claimed**
- Exactly-once delivery — **not claimed**
- Delivery guarantee — **not claimed**
- Transport execution — **not claimed**
- Dead-letter processing — **not claimed**
- Notification Platform Complete — **not claimed**
- Live Notifications — **not claimed**
- Production Ready — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Master Plan changed — **not claimed**

---

**STOP.** W5-N20 Planning is **APPROVED**. Implementation is **AUTHORIZED** for **W5-N20-a only**. Await explicit Product Owner instruction before opening W5-N20-a. Do not open W5-N20-b through W5-N20-e. Do NOT declare Retry Policy implemented. Do NOT declare Retry Scheduling implemented. Do NOT declare Retry Execution implemented. Do NOT declare Notification Platform COMPLETE. Do NOT declare Live Notifications. Do NOT declare Production Ready. Do NOT declare Wave 5 COMPLETE.
