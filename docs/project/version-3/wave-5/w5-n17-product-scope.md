# W5-N17 Product Scope

**Package:** W5-N17 Notification Platform Delivery Reliability Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N17 · CM-27
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n17-implementation-package.md`](./w5-n17-implementation-package.md)
**Overview:** [`notification-delivery-reliability-overview.md`](./notification-delivery-reliability-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N17. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N16. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N17` is the operational package ID for Product Owner authorization **V3-N17**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-27** is Notification Platform Delivery Reliability Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product.

---

## Product purpose

Notification Platform Delivery Reliability Foundation is the product package that defines how **cross-channel notification platform delivery reliability integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N14 dead-letter, W5-N15 telemetry, and W5-N16 metrics foundations into a coherent platform delivery reliability foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds reliability foundation consumption only.

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

It does **not** own platform metrics redesign (N16 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement delivery execution runtime, dead-letter processing, automatic replay, retry execution, metric collection runtime, metric exporters, dashboards, alerting, analytics, or production monitoring.

```text
Notification Delivery owns platform delivery reliability foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N17 owns Notification Platform Delivery Reliability Foundation outcomes (V3-N17 · CM-27).
Reliability foundation ≠ delivery execution runtime.
Reliability foundation ≠ dead-letter processing.
Reliability foundation ≠ retry execution.
Reliability foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Delivery Reliability Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01…N16 each closed per-channel and platform foundations through metrics scope. W5-N14 closed dead-letter foundation, W5-N15 closed telemetry foundation, and W5-N16 closed metrics foundation. Product Owner defers platform delivery reliability foundation to **V3-N17 · CM-27**.

Today the platform has dead-letter, telemetry, and metrics foundations — but no cross-channel platform delivery reliability foundation layer. Platform conformance inventories across N09…N16 record missing platform delivery reliability. Operators need **unified honest notification platform delivery reliability behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at reliability scope. CM-27 (Wave 5 scope) is the delivery reliability foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest delivery reliability rules across all notification channels at platform reliability scope
- Rely on cross-channel platform delivery reliability inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform delivery reliability foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel delivery reliability state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform delivery reliability foundation implementation, no delivery execution runtime, no dead-letter processing, no automatic replay, no retry execution, no notification execution, no scheduler execution, no worker execution, no production runtime, no metric collection runtime, no metric exporters, no dashboards, no alerting, no analytics, no production monitoring, no production transport I/O, no outbound notifications, no runtime delivery execution in this act.

---

## Consumes

| Product                   | How this package uses it                                     | Must not do                     |
| ------------------------- | ------------------------------------------------------------ | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform reliability foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access reliability foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform reliability state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types             | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                            | Fork platform controls          |
| **Security Audit**        | Attributable reliability foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                       | Redesign facade ownership       |
| **Notification Delivery** | Platform delivery reliability foundation extension           | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)            | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                               | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                            | Redesign queue owner            |
| **W5-N14 dead-letter**    | Dead-letter foundation patterns and anchors (consume)        | Redesign N14 owner artifacts    |
| **W5-N15 telemetry**      | Telemetry foundation patterns and anchors (consume)          | Redesign N15 owner artifacts    |
| **W5-N16 metrics**        | Metrics foundation patterns and anchors (consume)            | Redesign N16 owner artifacts    |
| **W5-N01…N16 foundation** | Per-channel and platform anchors and patterns (consume)      | Redesign prior owner artifacts  |

---

## Owns

| Outcome                                                                  | Customer meaning                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Cross-channel platform delivery reliability inventory & honesty baseline | Honest unified platform delivery reliability vs per-channel surfaces       |
| Durable platform reliability anchors                                     | Platform delivery reliability state survives restart                       |
| Platform delivery reliability restart recovery foundation                | Hydrated reliability state after normal API restart                        |
| Platform delivery reliability operational continuity foundation          | Platform Readiness projection for delivery reliability                     |
| Cross-channel honest reliability rules (post-impl)                       | Consistent Connected/Delivering/Reliability semantics at reliability scope |
| Workspace-scoped platform reliability state                              | Operator-visible platform delivery reliability truth                       |
| Attributable reliability foundation outcomes                             | Emit to Security Audit where required                                      |

**Does not own a new notification product, engine, delivery execution runtime, or observability platform layer.** Notification Delivery remains transport owner.

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
| W5-N01…N16 prior foundations     | Respective closed packages     |
| Delivery execution runtime       | Deferred post-foundation       |
| Dead-letter processing           | Deferred post-foundation       |
| Automatic replay                 | Deferred post-foundation       |
| Retry execution                  | Deferred post-foundation       |
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

## IN Scope (W5-N17 — post-implementation intent)

| Item                                                                     | Notes                                     |
| ------------------------------------------------------------------------ | ----------------------------------------- |
| Cross-channel platform delivery reliability inventory & honesty baseline | W5-N17-a                                  |
| Durable platform reliability anchor persistence                          | W5-N17-b on notification-delivery owner   |
| Platform delivery reliability restart recovery foundation                | W5-N17-c                                  |
| Platform delivery reliability operational continuity foundation          | W5-N17-d                                  |
| Package Close Evidence                                                   | W5-N17-e                                  |
| Package validation                                                       | W5-N17-e + Final Integration Verification |
| Cross-channel honest reliability rule unification                        | After Approval — not from planning open   |
| PC-06 routing reliability foundation at platform scope                   | Reuse unchanged — consume only            |
| Per-channel and platform foundation consumption (N01…N16)                | No redesign of prior artifacts            |
| W5-N14 dead-letter, W5-N15 telemetry, W5-N16 metrics consumption         | No redesign of N14/N15/N16 artifacts      |
| Engineering evidence                                                     | Close Evidence chain when implemented     |

---

## OUT of Scope

| Item                                                               | Owner / deferral          |
| ------------------------------------------------------------------ | ------------------------- |
| Implementation (this act)                                          | Planning open only        |
| Live Notifications                                                 | Deferred post-foundation  |
| Wave 5 COMPLETE                                                    | PO after N01…N17          |
| Wave 6 functionality                                               | Wave 6 + ADR              |
| Production Ready                                                   | Separate PO act           |
| Live Trading                                                       | Wave 6 + ADR              |
| Live order submission                                              | Wave 6                    |
| Per-channel transport I/O                                          | N01…N04 / TD-049 / TD-050 |
| Delivery execution runtime                                         | Deferred post-foundation  |
| Dead-letter processing                                             | Deferred post-foundation  |
| Automatic replay                                                   | Deferred post-foundation  |
| Retry execution                                                    | Deferred post-foundation  |
| Notification execution                                             | Deferred post-foundation  |
| Metric collection runtime                                          | Deferred post-foundation  |
| Metric exporters                                                   | Deferred post-foundation  |
| Dashboards                                                         | Deferred post-foundation  |
| Alerting                                                           | Deferred post-foundation  |
| Analytics                                                          | Deferred post-foundation  |
| Production monitoring                                              | Deferred post-foundation  |
| Observability platform (MN-02)                                     | Wave 3 — not duplicated   |
| Second notification routing engine                                 | Forbidden                 |
| W5-N01…N16 redesign                                                | Forbidden                 |
| Notification Platform Complete                                     | PO after N01…N17          |
| Platform delivery reliability foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                                  | Planning open only        |
| W5-N17 Planning Review (this act)                                  | Separate PO act           |
| W5-N17 Planning Approval (this act)                                | Separate PO act           |

---

## Honest Product rules (binding)

| Label                 | Meaning                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Connected**         | Real channel connect succeeded — per-channel transport evidence                         |
| **Delivering**        | Real send round-trip succeeded — per-channel transport evidence                         |
| **Error**             | Provider failure visible — not silent success                                           |
| **Reserved**          | Channel not yet shipped — honest "Not offered"                                          |
| **Disconnected**      | Operator or system disconnected transport                                               |
| **Platform Ready**    | Cross-channel delivery reliability foundation evidence exists — not transport I/O alone |
| **Reliability Ready** | Real delivery outcome round-trip succeeded — not claimed from foundation                |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform delivery reliability foundation evidence.

Never show **Reliability Ready** without real delivery outcome round-trip.

Never claim Notification Platform Complete from foundation or reliability foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N17 foundation alone.

Never claim delivery execution runtime, dead-letter processing, automatic replay, retry execution, notification execution, scheduler execution, worker execution, or production runtime implemented from W5-N17 foundation alone.

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or reliability foundation context denies platform reliability reads/writes.
- **Fail honest:** Missing or corrupt reliability foundation state surfaces honestly — not fabricated as Platform Ready.
- **No silent success:** Reliability foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform delivery reliability foundation does not override per-channel reserved-inactive truth.
- **N05…N16 honesty preserved:** Platform delivery reliability foundation does not override prior platform foundation truth.
- **No Live Trading implication:** Reliability foundation never enables live orders.
- **Foundation ≠ I/O:** Durable reliability anchors ≠ production transport operational.
- **Foundation ≠ runtime:** Reliability foundation ≠ delivery execution runtime, dead-letter processing, retry execution, or production monitoring operational.

---

## Customer journey (post-implementation intent)

1. Operator configures notification channels on existing Connection Management surfaces.
2. Operator views cross-channel delivery reliability state on platform surfaces.
3. Operator sees honest Platform Ready / Reliability Ready labels — never fabricated.
4. Operator receives workspace-scoped delivery reliability truth.
5. Operator does **not** receive live trading controls from this package.

---

## Operator journey (post-implementation intent)

1. Operator signs in with existing Authentication.
2. Operator accesses delivery reliability surfaces permitted by Authorization.
3. Operator reviews cross-channel delivery reliability inventory and Platform Readiness projection.
4. Operator trusts SURVIVE/EPHEMERAL classification for reliability state.
5. Operator sees honest degraded-state behaviour when reliability foundation is incomplete.
6. Operator does **not** trigger delivery execution, dead-letter processing, or retry from foundation surfaces alone.

---

## Technical debt

| Item                                     | Status at planning open                              |
| ---------------------------------------- | ---------------------------------------------------- |
| TD-049 Telegram production Bot API       | **Deferred** — not resolved by planning open         |
| TD-050 Reserved notification channels    | **Deferred** — not resolved by planning open         |
| Platform delivery reliability foundation | **Deferred** to W5-N17 implementation after Approval |
| Delivery execution runtime               | **Deferred** post-foundation                         |
| Dead-letter processing                   | **Deferred** post-foundation                         |
| Automatic replay                         | **Deferred** post-foundation                         |
| Retry execution                          | **Deferred** post-foundation                         |
| Implementation slices (a–e)              | **Deferred** — planning only                         |

**Technical debt introduced by this planning open:** None.

**Technical debt resolved by this planning open:** Planning preparation only.

---

## Acceptance criteria (W5-N17 Close — post-implementation)

| #   | Criterion                                                      | Evidence                    |
| --- | -------------------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform delivery reliability inventory complete | W5-N17-a                    |
| 2   | Durable platform reliability anchors on correct owner          | W5-N17-b                    |
| 3   | Restart recovery hydrates reliability state                    | W5-N17-c                    |
| 4   | Operational continuity projects honest readiness               | W5-N17-d                    |
| 5   | Close Evidence assembled                                       | W5-N17-e                    |
| 6   | Cross-channel honest reliability rules evidenced               | Implementation + validation |
| 7   | No cross-workspace reliability state leak                      | Security validation         |
| 8   | W5-N01…N16 boundaries unchanged                                | Regression                  |
| 9   | Master Plan unchanged                                          | Governance                  |

---

## Explicit non-claims

- Notification Platform Delivery Reliability Foundation implemented — **not claimed**
- Delivery execution runtime implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Retry execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-27 implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N17 Planning APPROVED — **not claimed**
- W5-N17-a opened — **not claimed**

---

**STOP.** W5-N17 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N17-a. Do not begin implementation.
