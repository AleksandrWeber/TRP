# W5-N11 Product Scope

**Package:** W5-N11 Notification Platform Worker Runtime Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N11 · CM-21
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n11-implementation-package.md`](./w5-n11-implementation-package.md)
**Overview:** [`w5-n11-overview.md`](./w5-n11-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N11. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N10. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N11` is the operational package ID for Product Owner authorization **V3-N11**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-21** also names Future provider framework (Connection Management); W5-N11 **CM-21** is Notification Platform Worker Runtime Foundation only — not Connection Management provider framework redesign, not AI Gateway.

---

## Product purpose

Notification Platform Worker Runtime Foundation is the product package that defines how **cross-channel notification platform worker runtime integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N10 worker execution foundations into a coherent platform worker runtime foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds worker runtime foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform integration redesign (N05 reopen).

It does **not** own platform delivery redesign (N06 reopen).

It does **not** own platform dispatch redesign (N07 reopen).

It does **not** own platform queue redesign (N08 reopen).

It does **not** own platform workers redesign (N09 reopen).

It does **not** own platform worker execution redesign (N10 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement worker runtime execution, worker orchestration, retry engine, scheduler, or dead-letter processing.

```text
Notification Delivery owns platform worker runtime foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N11 owns Notification Platform Worker Runtime Foundation outcomes (V3-N11 · CM-21).
Worker runtime foundation ≠ worker runtime execution.
Worker runtime foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Worker Runtime Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. W5-N05 closed Notification Platform Integration foundation. W5-N06 closed Notification Platform Delivery foundation. W5-N07 closed Notification Platform Dispatch foundation. W5-N08 closed Notification Platform Queue foundation. W5-N09 closed Notification Platform Workers foundation. W5-N10 closed Notification Platform Worker Execution foundation. Product Owner defers platform worker runtime foundation to **V3-N11 · CM-21**.

Today the platform has worker execution foundation — but no cross-channel platform worker runtime foundation layer. Operators need **unified honest notification platform worker runtime behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at worker runtime scope. CM-21 (Wave 5 scope) is the worker runtime foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest worker runtime rules across all notification channels at platform worker runtime scope
- Rely on cross-channel platform worker runtime inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform worker runtime foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel worker runtime state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform worker runtime foundation implementation, no worker runtime execution, no worker orchestration, no retry, no scheduler, no dead-letter processing, no production transport I/O, no outbound notifications, no runtime worker execution in this act.

---

## Consumes

| Product                   | How this package uses it                                        | Must not do                     |
| ------------------------- | --------------------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform worker runtime foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access worker runtime foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform worker runtime state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types                | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                               | Fork platform controls          |
| **Security Audit**        | Attributable worker runtime foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                          | Redesign facade ownership       |
| **Notification Delivery** | Platform worker runtime foundation extension                    | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)               | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                                  | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                               | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)                         | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)                            | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume)              | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                             | Redesign N04 owner artifacts    |
| **W5-N05 foundation**     | Platform integration anchors and patterns (consume)             | Redesign N05 owner artifacts    |
| **W5-N06 foundation**     | Platform delivery anchors and patterns (consume)                | Redesign N06 owner artifacts    |
| **W5-N07 foundation**     | Platform dispatch anchors and patterns (consume)                | Redesign N07 owner artifacts    |
| **W5-N08 foundation**     | Platform queue anchors and patterns (consume)                   | Redesign N08 owner artifacts    |
| **W5-N09 foundation**     | Platform workers anchors and patterns (consume)                 | Redesign N09 owner artifacts    |
| **W5-N10 foundation**     | Platform worker execution anchors and patterns (consume)        | Redesign N10 owner artifacts    |

---

## Owns

| Outcome                                                            | Customer meaning                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Cross-channel platform worker runtime inventory & honesty baseline | Honest unified platform worker runtime vs per-channel surfaces     |
| Durable platform worker runtime anchors                            | Platform worker runtime state survives restart                     |
| Platform worker runtime restart recovery foundation                | Hydrated worker runtime state after normal API restart             |
| Platform worker runtime operational continuity foundation          | Platform Readiness projection for worker runtime                   |
| Cross-channel honest worker runtime rules (post-impl)              | Consistent Connected/Delivering/Running semantics at runtime scope |
| Workspace-scoped platform worker runtime state                     | Operator-visible platform worker runtime truth                     |
| Attributable worker runtime foundation outcomes                    | Emit to Security Audit where required                              |

**Does not own a new notification product, engine, or worker runtime execution layer.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                                  | Real owner                     |
| ---------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption           | Vault                          |
| Identity / sessions                      | Authentication                 |
| Permissions (IAM)                        | Authorization                  |
| Workspace membership / isolation         | Workspace / Isolation          |
| Connection Management facade             | Connection Management (Wave 2) |
| Notification routing                     | PC-06                          |
| Durable queue substrate                  | W3-O02 (Wave 3)                |
| Risk decisions                           | Risk Engine                    |
| Orders / live execution                  | Canonical Order Path / Wave 6  |
| Telegram Notification                    | V3-N01 (CLOSED)                |
| Email SMTP                               | V3-N02 (CLOSED)                |
| Slack / Discord / Teams                  | V3-N03 (CLOSED)                |
| Push                                     | V3-N04 (CLOSED)                |
| Platform Integration                     | V3-N05 (CLOSED)                |
| Platform Delivery                        | V3-N06 (CLOSED)                |
| Platform Dispatch                        | V3-N07 (CLOSED)                |
| Platform Queue                           | V3-N08 (CLOSED)                |
| Platform Workers                         | V3-N09 (CLOSED)                |
| Platform Worker Execution                | V3-N10 (CLOSED)                |
| Worker runtime execution                 | Deferred post-foundation       |
| Worker orchestration                     | Deferred post-foundation       |
| Retry engine                             | Deferred post-foundation       |
| Scheduler                                | Deferred post-foundation       |
| Dead-letter processing                   | Deferred post-foundation       |
| Production transport I/O                 | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway                   | Wave 7 V3-A02                  |
| Connection Management provider framework | Inventory CM-21 (Wave 2)       |
| Live Trading                             | Wave 6 + ADR                   |
| Exchange I/O                             | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N11 — post-implementation intent)

| Item                                                                                                                | Notes                                   |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Cross-channel platform worker runtime inventory & honesty baseline                                                  | W5-N11-a                                |
| Durable platform worker runtime anchor persistence                                                                  | W5-N11-b on notification-delivery owner |
| Platform worker runtime restart recovery foundation                                                                 | W5-N11-c                                |
| Platform worker runtime operational continuity foundation                                                           | W5-N11-d                                |
| Package Close Evidence                                                                                              | W5-N11-e                                |
| Cross-channel honest worker runtime rule unification                                                                | After Approval — not from planning open |
| PC-06 routing worker runtime foundation at platform scope                                                           | Reuse unchanged — consume only          |
| Per-channel, integration, delivery, dispatch, queue, workers, and worker execution foundation consumption (N01…N10) | No redesign of prior artifacts          |

---

## OUT of Scope

| Item                                                         | Owner / deferral          |
| ------------------------------------------------------------ | ------------------------- |
| Live Trading                                                 | Wave 6 + ADR              |
| Live order submission                                        | Wave 6                    |
| Per-channel transport I/O                                    | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                                  | TD-049                    |
| Production SMTP / webhook / push I/O                         | TD-050                    |
| Worker runtime execution                                     | Deferred post-foundation  |
| Worker orchestration                                         | Deferred post-foundation  |
| Retry engine                                                 | Deferred post-foundation  |
| Scheduler                                                    | Deferred post-foundation  |
| Dead-letter processing                                       | Deferred post-foundation  |
| Second notification routing engine                           | Forbidden                 |
| Connection Management redesign                               | Wave 2 CLOSED             |
| Connection Management provider framework redesign            | Inventory CM-21 (Wave 2)  |
| Vault redesign                                               | Wave 1 CLOSED             |
| Exchange I/O                                                 | Wave 4 CLOSED             |
| Platform integration redesign                                | W5-N05 CLOSED             |
| Platform delivery redesign                                   | W5-N06 CLOSED             |
| Platform dispatch redesign                                   | W5-N07 CLOSED             |
| Platform queue redesign                                      | W5-N08 CLOSED             |
| Platform workers redesign                                    | W5-N09 CLOSED             |
| Platform worker execution redesign                           | W5-N10 CLOSED             |
| Anthropic / AI Gateway                                       | Wave 7 V3-A02             |
| Wave 5 COMPLETE                                              | PO after N01…N11          |
| Notification Platform Complete                               | PO after N01…N11          |
| Platform worker runtime foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                            | Planning open only        |
| W5-N11 Planning Review (this act)                            | Separate PO act           |
| W5-N11 Planning Approval (this act)                          | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence                   |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence                   |
| **Error**          | Provider failure visible — not silent success                                     |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                                    |
| **Disconnected**   | Operator or system disconnected transport                                         |
| **Platform Ready** | Cross-channel worker runtime foundation evidence exists — not transport I/O alone |
| **Running**        | Real worker runtime round-trip succeeded — not claimed from foundation            |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform worker runtime foundation evidence.

Never show **Running** without real worker runtime round-trip.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or worker runtime foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N11 foundation alone.

Never claim worker runtime execution, orchestration, retry, scheduler, or dead-letter implemented from W5-N11 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform worker runtime foundation state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform worker runtime foundation errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or worker runtime foundation context denies platform worker runtime reads/writes.
- **No silent success:** Worker runtime foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform worker runtime foundation does not override per-channel reserved-inactive truth.
- **Integration honesty preserved:** Platform worker runtime foundation does not override N05 integration truth.
- **Delivery honesty preserved:** Platform worker runtime foundation does not override N06 delivery truth.
- **Dispatch honesty preserved:** Platform worker runtime foundation does not override N07 dispatch truth.
- **Queue honesty preserved:** Platform worker runtime foundation does not override N08 queue truth.
- **Workers honesty preserved:** Platform worker runtime foundation does not override N09 workers truth.
- **Worker execution honesty preserved:** Platform worker runtime foundation does not override N10 worker execution truth.
- **No Live Trading implication:** Worker runtime foundation never enables live orders.
- **Foundation ≠ I/O:** Durable worker runtime anchors ≠ production transport operational.
- **Foundation ≠ execution:** Worker runtime foundation ≠ worker runtime execution, orchestration, retry, scheduler, or dead-letter operational.

---

## Acceptance criteria (W5-N11 Close — post-implementation)

| #   | Criterion                                                | Evidence                    |
| --- | -------------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform worker runtime inventory complete | W5-N11-a                    |
| 2   | Durable platform worker runtime anchors on correct owner | W5-N11-b                    |
| 3   | Restart recovery hydrates worker runtime state           | W5-N11-c                    |
| 4   | Operational continuity projects honest readiness         | W5-N11-d                    |
| 5   | Close Evidence assembled                                 | W5-N11-e                    |
| 6   | Cross-channel honest worker runtime rules evidenced      | Implementation + validation |
| 7   | No cross-workspace worker runtime state leak             | Security validation         |
| 8   | W5-N01…N10 boundaries unchanged                          | Regression                  |
| 9   | Master Plan unchanged                                    | Governance                  |

---

## Explicit non-claims

- Notification Platform Worker Runtime Foundation implemented — **not claimed**
- Notification Platform Worker Runtime implemented — **not claimed**
- Worker runtime execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-21 implemented — **not claimed**
- Worker orchestration implemented — **not claimed**
- Retry implemented — **not claimed**
- Scheduler implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N11 Planning APPROVED — **not claimed**
- W5-N11-a opened — **not claimed**

---

**STOP.** W5-N11 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N11-a. Do not begin implementation.
