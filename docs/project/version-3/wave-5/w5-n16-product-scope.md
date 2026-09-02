# W5-N16 Product Scope

**Package:** W5-N16 Notification Platform Metrics Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N16 · CM-26
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n16-implementation-package.md`](./w5-n16-implementation-package.md)
**Overview:** [`w5-n16-overview.md`](./w5-n16-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N16. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N15. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N16` is the operational package ID for Product Owner authorization **V3-N16**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-26** is Notification Platform Metrics Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product.

---

## Product purpose

Notification Platform Metrics Foundation is the product package that defines how **cross-channel notification platform metrics integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N15 telemetry foundations into a coherent platform metrics foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds metrics foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform integration redesign (N05 reopen).

It does **not** own platform delivery redesign (N06 reopen).

It does **not** own platform dispatch redesign (N07 reopen).

It does **not** own platform queue redesign (N08 reopen).

It does **not** own platform workers redesign (N09 reopen).

It does **not** own platform worker execution redesign (N10 reopen).

It does **not** own platform worker runtime redesign (N11 reopen).

It does **not** own platform scheduler redesign (N12 reopen).

It does **not** own platform retry redesign (N13 reopen).

It does **not** own platform dead-letter redesign (N14 reopen).

It does **not** own platform telemetry redesign (N15 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement metric collection runtime, metric exporters, dashboards, alerting, analytics, or production monitoring.

```text
Notification Delivery owns platform metrics foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N16 owns Notification Platform Metrics Foundation outcomes (V3-N16 · CM-26).
Metrics foundation ≠ metric collection runtime.
Metrics foundation ≠ exporters.
Metrics foundation ≠ dashboards.
Metrics foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Metrics Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01…N15 each closed per-channel and platform foundations through telemetry scope. Product Owner defers platform metrics foundation to **V3-N16 · CM-26**.

Today the platform has telemetry foundation — but no cross-channel platform metrics foundation layer. Platform conformance inventories across N09…N15 record missing platform metrics. Operators need **unified honest notification platform metrics behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at metrics scope. CM-26 (Wave 5 scope) is the metrics foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest metrics rules across all notification channels at platform metrics scope
- Rely on cross-channel platform metrics inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform metrics foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel metrics state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform metrics foundation implementation, no metric collection runtime, no metric exporters, no dashboards, no alerting, no analytics, no production monitoring, no dead-letter runtime, no retry execution, no notification execution, no scheduler execution, no worker execution, no production runtime, no production transport I/O, no outbound notifications, no runtime metric collection in this act.

---

## Consumes

| Product                   | How this package uses it                                 | Must not do                     |
| ------------------------- | -------------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform metrics foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access metrics foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform metrics state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types         | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                        | Fork platform controls          |
| **Security Audit**        | Attributable metrics foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                   | Redesign facade ownership       |
| **Notification Delivery** | Platform metrics foundation extension                    | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)        | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                           | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                        | Redesign queue owner            |
| **W5-N01…N15 foundation** | Per-channel and platform anchors and patterns (consume)  | Redesign prior owner artifacts  |

---

## Owns

| Outcome                                                     | Customer meaning                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| Cross-channel platform metrics inventory & honesty baseline | Honest unified platform metrics vs per-channel surfaces            |
| Durable platform metric anchors                             | Platform metrics state survives restart                            |
| Platform metrics restart recovery foundation                | Hydrated metrics state after normal API restart                    |
| Platform metrics operational continuity foundation          | Platform Readiness projection for metrics                          |
| Cross-channel honest metrics rules (post-impl)              | Consistent Connected/Delivering/Metrics semantics at metrics scope |
| Workspace-scoped platform metrics state                     | Operator-visible platform metrics truth                            |
| Attributable metrics foundation outcomes                    | Emit to Security Audit where required                              |

**Does not own a new notification product, engine, metric collection runtime, or observability platform layer.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                          | Real owner                     |
| -------------------------------- | ------------------------------ |
| Secret ciphertext / encryption   | Vault                          |
| Identity / sessions              | Authentication                 |
| Permissions (IAM)                | Authorization                  |
| Workspace membership / isolation | Workspace / Isolation          |
| Connection Management facade     | Connection Management (Wave 2) |
| Notification routing             | PC-06                          |
| Durable queue substrate          | W3-O02 (Wave 3)                |
| Observability product            | MN-02 (Wave 3)                 |
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| W5-N01…N15 prior foundations     | Respective closed packages     |
| Metric collection runtime        | Deferred post-foundation       |
| Metric exporters                 | Deferred post-foundation       |
| Dashboards                       | Deferred post-foundation       |
| Alerting                         | Deferred post-foundation       |
| Analytics                        | Deferred post-foundation       |
| Production monitoring            | Deferred post-foundation       |
| Production transport I/O         | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway           | Wave 7 V3-A02                  |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N16 — post-implementation intent)

| Item                                                        | Notes                                     |
| ----------------------------------------------------------- | ----------------------------------------- |
| Cross-channel platform metrics inventory & honesty baseline | W5-N16-a                                  |
| Durable platform metric anchor persistence                  | W5-N16-b on notification-delivery owner   |
| Platform metrics restart recovery foundation                | W5-N16-c                                  |
| Platform metrics operational continuity foundation          | W5-N16-d                                  |
| Package Close Evidence                                      | W5-N16-e                                  |
| Package validation                                          | W5-N16-e + Final Integration Verification |
| Cross-channel honest metrics rule unification               | After Approval — not from planning open   |
| PC-06 routing metrics foundation at platform scope          | Reuse unchanged — consume only            |
| Per-channel and platform foundation consumption (N01…N15)   | No redesign of prior artifacts            |
| Engineering evidence                                        | Close Evidence chain when implemented     |

---

## OUT of Scope

| Item                                                  | Owner / deferral          |
| ----------------------------------------------------- | ------------------------- |
| Live Trading                                          | Wave 6 + ADR              |
| Live order submission                                 | Wave 6                    |
| Per-channel transport I/O                             | N01…N04 / TD-049 / TD-050 |
| Metric collection runtime                             | Deferred post-foundation  |
| Metric exporters                                      | Deferred post-foundation  |
| Dashboards                                            | Deferred post-foundation  |
| Alerting                                              | Deferred post-foundation  |
| Analytics                                             | Deferred post-foundation  |
| Production monitoring                                 | Deferred post-foundation  |
| Observability platform (MN-02)                        | Wave 3 — not duplicated   |
| Dead-letter runtime                                   | Deferred post-foundation  |
| Retry execution                                       | Deferred post-foundation  |
| Notification execution                                | Deferred post-foundation  |
| Second notification routing engine                    | Forbidden                 |
| W5-N01…N15 redesign                                   | Forbidden                 |
| Wave 5 COMPLETE                                       | PO after N01…N16          |
| Notification Platform Complete                        | PO after N01…N16          |
| Platform metrics foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                     | Planning open only        |
| W5-N16 Planning Review (this act)                     | Separate PO act           |
| W5-N16 Planning Approval (this act)                   | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence            |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence            |
| **Error**          | Provider failure visible — not silent success                              |
| **Reserved**       | Channel not yet shipped — honest "Not offered"                             |
| **Disconnected**   | Operator or system disconnected transport                                  |
| **Platform Ready** | Cross-channel metrics foundation evidence exists — not transport I/O alone |
| **Metrics Ready**  | Real metric collection round-trip succeeded — not claimed from foundation  |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform metrics foundation evidence.

Never show **Metrics Ready** without real metric collection round-trip.

Never claim Notification Platform Complete from foundation or metrics foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N16 foundation alone.

Never claim metric collection runtime, exporters, dashboards, alerting, analytics, production monitoring, dead-letter runtime, retry execution, notification execution, scheduler execution, worker execution, or production runtime implemented from W5-N16 foundation alone.

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or metrics foundation context denies platform metrics reads/writes.
- **Fail honest:** Missing or corrupt metrics foundation state surfaces honestly — not fabricated as Platform Ready.
- **No silent success:** Metrics foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform metrics foundation does not override per-channel reserved-inactive truth.
- **N05…N15 honesty preserved:** Platform metrics foundation does not override prior platform foundation truth.
- **No Live Trading implication:** Metrics foundation never enables live orders.
- **Foundation ≠ I/O:** Durable metric anchors ≠ production transport operational.
- **Foundation ≠ runtime:** Metrics foundation ≠ metric collection runtime, exporters, dashboards, alerting, analytics, or production monitoring operational.

---

## Acceptance criteria (W5-N16 Close — post-implementation)

| #   | Criterion                                         | Evidence                    |
| --- | ------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform metrics inventory complete | W5-N16-a                    |
| 2   | Durable platform metric anchors on correct owner  | W5-N16-b                    |
| 3   | Restart recovery hydrates metrics state           | W5-N16-c                    |
| 4   | Operational continuity projects honest readiness  | W5-N16-d                    |
| 5   | Close Evidence assembled                          | W5-N16-e                    |
| 6   | Cross-channel honest metrics rules evidenced      | Implementation + validation |
| 7   | No cross-workspace metrics state leak             | Security validation         |
| 8   | W5-N01…N15 boundaries unchanged                   | Regression                  |
| 9   | Master Plan unchanged                             | Governance                  |

---

## Explicit non-claims

- Notification Platform Metrics Foundation implemented — **not claimed**
- Notification Platform Metrics implemented — **not claimed**
- Metric collection runtime implemented — **not claimed**
- Metric exporters implemented — **not claimed**
- Dashboards implemented — **not claimed**
- Alerting implemented — **not claimed**
- Analytics implemented — **not claimed**
- Production monitoring implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-26 implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N16 Planning APPROVED — **not claimed**
- W5-N16-a opened — **not claimed**

---

**STOP.** W5-N16 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N16-a. Do not begin implementation.
