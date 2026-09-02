# W5-N13 Product Scope

**Package:** W5-N13 Notification Platform Retry Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N13 · CM-23
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n13-implementation-package.md`](./w5-n13-implementation-package.md)
**Overview:** [`w5-n13-overview.md`](./w5-n13-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N13. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N12. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N13` is the operational package ID for Product Owner authorization **V3-N13**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-23** is Notification Platform Retry Foundation only — not Connection Management provider framework redesign, not AI Gateway.

---

## Product purpose

Notification Platform Retry Foundation is the product package that defines how **cross-channel notification platform retry integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N12 scheduler foundations into a coherent platform retry foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds retry foundation consumption only.

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

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement retry engine, retry execution, or dead-letter processing.

```text
Notification Delivery owns platform retry foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N13 owns Notification Platform Retry Foundation outcomes (V3-N13 · CM-23).
Retry foundation ≠ retry engine.
Retry foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Retry Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. W5-N05 closed Notification Platform Integration foundation. W5-N06 closed Notification Platform Delivery foundation. W5-N07 closed Notification Platform Dispatch foundation. W5-N08 closed Notification Platform Queue foundation. W5-N09 closed Notification Platform Workers foundation. W5-N10 closed Notification Platform Worker Execution foundation. W5-N11 closed Notification Platform Worker Runtime foundation. W5-N12 closed Notification Platform Scheduler foundation. Product Owner defers platform retry foundation to **V3-N13 · CM-23**.

Today the platform has scheduler foundation — but no cross-channel platform retry foundation layer. Operators need **unified honest notification platform retry behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at retry scope. CM-23 (Wave 5 scope) is the retry foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest retry rules across all notification channels at platform retry scope
- Rely on cross-channel platform retry inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform retry foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel retry state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform retry foundation implementation, no retry engine, no retry execution, no dead-letter processing, no scheduler runtime, no scheduler execution, no production transport I/O, no outbound notifications, no runtime retry execution in this act.

---

## Consumes

| Product                   | How this package uses it                                 | Must not do                     |
| ------------------------- | -------------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform retry foundation   | Parallel login                  |
| **Authorization**         | Only permitted roles access retry foundation surfaces    | New IAM                         |
| **Workspace Isolation**   | Platform retry state stays in workspace                  | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types         | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                        | Fork platform controls          |
| **Security Audit**        | Attributable retry foundation outcomes where required    | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                   | Redesign facade ownership       |
| **Notification Delivery** | Platform retry foundation extension                      | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)        | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                           | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                        | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)                  | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)                     | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume)       | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                      | Redesign N04 owner artifacts    |
| **W5-N05 foundation**     | Platform integration anchors and patterns (consume)      | Redesign N05 owner artifacts    |
| **W5-N06 foundation**     | Platform delivery anchors and patterns (consume)         | Redesign N06 owner artifacts    |
| **W5-N07 foundation**     | Platform dispatch anchors and patterns (consume)         | Redesign N07 owner artifacts    |
| **W5-N08 foundation**     | Platform queue anchors and patterns (consume)            | Redesign N08 owner artifacts    |
| **W5-N09 foundation**     | Platform workers anchors and patterns (consume)          | Redesign N09 owner artifacts    |
| **W5-N10 foundation**     | Platform worker execution anchors and patterns (consume) | Redesign N10 owner artifacts    |
| **W5-N11 foundation**     | Platform worker runtime anchors and patterns (consume)   | Redesign N11 owner artifacts    |
| **W5-N12 foundation**     | Platform scheduler anchors and patterns (consume)        | Redesign N12 owner artifacts    |

---

## Owns

| Outcome                                                   | Customer meaning                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Cross-channel platform retry inventory & honesty baseline | Honest unified platform retry vs per-channel surfaces             |
| Durable platform retry anchors                            | Platform retry state survives restart                             |
| Platform retry restart recovery foundation                | Hydrated retry state after normal API restart                     |
| Platform retry operational continuity foundation          | Platform Readiness projection for retry                           |
| Cross-channel honest retry rules (post-impl)              | Consistent Connected/Delivering/Retrying semantics at retry scope |
| Workspace-scoped platform retry state                     | Operator-visible platform retry truth                             |
| Attributable retry foundation outcomes                    | Emit to Security Audit where required                             |

**Does not own a new notification product, engine, or retry engine layer.** Notification Delivery remains transport owner.

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
| Platform Worker Runtime                  | V3-N11 (CLOSED)                |
| Platform Scheduler                       | V3-N12 (CLOSED)                |
| Retry engine                             | Deferred post-foundation       |
| Retry execution                          | Deferred post-foundation       |
| Dead-letter processing                   | Deferred post-foundation       |
| Scheduler runtime                        | Deferred post-foundation       |
| Scheduler execution                      | Deferred post-foundation       |
| Production transport I/O                 | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway                   | Wave 7 V3-A02                  |
| Connection Management provider framework | Inventory CM-21 (Wave 2)       |
| Live Trading                             | Wave 6 + ADR                   |
| Exchange I/O                             | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N13 — post-implementation intent)

| Item                                                                                                                                           | Notes                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Cross-channel platform retry inventory & honesty baseline                                                                                      | W5-N13-a                                |
| Durable platform retry anchor persistence                                                                                                      | W5-N13-b on notification-delivery owner |
| Platform retry restart recovery foundation                                                                                                     | W5-N13-c                                |
| Platform retry operational continuity foundation                                                                                               | W5-N13-d                                |
| Package Close Evidence                                                                                                                         | W5-N13-e                                |
| Cross-channel honest retry rule unification                                                                                                    | After Approval — not from planning open |
| PC-06 routing retry foundation at platform scope                                                                                               | Reuse unchanged — consume only          |
| Per-channel, integration, delivery, dispatch, queue, workers, worker execution, worker runtime, and scheduler foundation consumption (N01…N12) | No redesign of prior artifacts          |

---

## OUT of Scope

| Item                                                | Owner / deferral          |
| --------------------------------------------------- | ------------------------- |
| Live Trading                                        | Wave 6 + ADR              |
| Live order submission                               | Wave 6                    |
| Per-channel transport I/O                           | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                         | TD-049                    |
| Production SMTP / webhook / push I/O                | TD-050                    |
| Retry engine                                        | Deferred post-foundation  |
| Retry execution                                     | Deferred post-foundation  |
| Dead-letter processing                              | Deferred post-foundation  |
| Scheduler runtime                                   | Deferred post-foundation  |
| Scheduler execution                                 | Deferred post-foundation  |
| Second notification routing engine                  | Forbidden                 |
| Connection Management redesign                      | Wave 2 CLOSED             |
| Connection Management provider framework redesign   | Inventory CM-21 (Wave 2)  |
| Vault redesign                                      | Wave 1 CLOSED             |
| Exchange I/O                                        | Wave 4 CLOSED             |
| Platform integration redesign                       | W5-N05 CLOSED             |
| Platform delivery redesign                          | W5-N06 CLOSED             |
| Platform dispatch redesign                          | W5-N07 CLOSED             |
| Platform queue redesign                             | W5-N08 CLOSED             |
| Platform workers redesign                           | W5-N09 CLOSED             |
| Platform worker execution redesign                  | W5-N10 CLOSED             |
| Platform worker runtime redesign                    | W5-N11 CLOSED             |
| Platform scheduler redesign                         | W5-N12 CLOSED             |
| Anthropic / AI Gateway                              | Wave 7 V3-A02             |
| Wave 5 COMPLETE                                     | PO after N01…N13          |
| Notification Platform Complete                      | PO after N01…N13          |
| Platform retry foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                   | Planning open only        |
| W5-N13 Planning Review (this act)                   | Separate PO act           |
| W5-N13 Planning Approval (this act)                 | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence          |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence          |
| **Error**          | Provider failure visible — not silent success                            |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                           |
| **Disconnected**   | Operator or system disconnected transport                                |
| **Platform Ready** | Cross-channel retry foundation evidence exists — not transport I/O alone |
| **Retrying**       | Real retry round-trip succeeded — not claimed from foundation            |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform retry foundation evidence.

Never show **Retrying** without real retry round-trip.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or retry foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N13 foundation alone.

Never claim retry engine, retry execution, dead-letter processing, scheduler runtime, or scheduler execution implemented from W5-N13 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform retry foundation state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform retry foundation errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or retry foundation context denies platform retry reads/writes.
- **No silent success:** Retry foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform retry foundation does not override per-channel reserved-inactive truth.
- **Integration honesty preserved:** Platform retry foundation does not override N05 integration truth.
- **Delivery honesty preserved:** Platform retry foundation does not override N06 delivery truth.
- **Dispatch honesty preserved:** Platform retry foundation does not override N07 dispatch truth.
- **Queue honesty preserved:** Platform retry foundation does not override N08 queue truth.
- **Workers honesty preserved:** Platform retry foundation does not override N09 workers truth.
- **Worker execution honesty preserved:** Platform retry foundation does not override N10 worker execution truth.
- **Worker runtime honesty preserved:** Platform retry foundation does not override N11 worker runtime truth.
- **Scheduler honesty preserved:** Platform retry foundation does not override N12 scheduler truth.
- **No Live Trading implication:** Retry foundation never enables live orders.
- **Foundation ≠ I/O:** Durable retry anchors ≠ production transport operational.
- **Foundation ≠ engine:** Retry foundation ≠ retry engine, retry execution, dead-letter processing, scheduler runtime, or scheduler execution operational.

---

## Acceptance criteria (W5-N13 Close — post-implementation)

| #   | Criterion                                        | Evidence                    |
| --- | ------------------------------------------------ | --------------------------- |
| 1   | Cross-channel platform retry inventory complete  | W5-N13-a                    |
| 2   | Durable platform retry anchors on correct owner  | W5-N13-b                    |
| 3   | Restart recovery hydrates retry state            | W5-N13-c                    |
| 4   | Operational continuity projects honest readiness | W5-N13-d                    |
| 5   | Close Evidence assembled                         | W5-N13-e                    |
| 6   | Cross-channel honest retry rules evidenced       | Implementation + validation |
| 7   | No cross-workspace retry state leak              | Security validation         |
| 8   | W5-N01…N12 boundaries unchanged                  | Regression                  |
| 9   | Master Plan unchanged                            | Governance                  |

---

## Explicit non-claims

- Notification Platform Retry Foundation implemented — **not claimed**
- Notification Platform Retry implemented — **not claimed**
- Retry engine implemented — **not claimed**
- Retry execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-23 implemented — **not claimed**
- Dead-letter processing implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N13 Planning APPROVED — **not claimed**
- W5-N13-a opened — **not claimed**

---

**STOP.** W5-N13 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N13-a. Do not begin implementation.
