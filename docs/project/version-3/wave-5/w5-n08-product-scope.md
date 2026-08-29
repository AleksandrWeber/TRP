# W5-N08 Product Scope

**Package:** W5-N08 Notification Platform Queue Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N08 · CM-20
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n08-implementation-package.md`](./w5-n08-implementation-package.md)
**Overview:** [`w5-n08-overview.md`](./w5-n08-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N08. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N07. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N08` is the operational package ID for Product Owner authorization **V3-N08**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-20** also names Anthropic (Wave 7); W5-N08 **CM-20** is Notification Platform Queue Foundation only — not AI Gateway.

---

## Product purpose

Notification Platform Queue Foundation is the product package that defines how **cross-channel notification platform queue integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N07 dispatch foundations into a coherent platform queue foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds queue foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform integration redesign (N05 reopen).

It does **not** own platform delivery redesign (N06 reopen).

It does **not** own platform dispatch redesign (N07 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** implement queue execution, queue orchestration, retry engine, or scheduler.

```text
Notification Delivery owns platform queue foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N08 owns Notification Platform Queue Foundation outcomes (V3-N08 · CM-20).
Queue foundation ≠ queue execution.
Queue foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Queue Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. W5-N05 closed Notification Platform Integration foundation. W5-N06 closed Notification Platform Delivery foundation. W5-N07 closed Notification Platform Dispatch foundation. Product Owner defers platform queue foundation to **V3-N08 · CM-20**.

Today the platform has dispatch foundation — but no cross-channel platform queue foundation layer. Operators need **unified honest notification platform queue behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at queue scope. CM-20 (Wave 5 scope) is the queue foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest queue rules across all notification channels at platform queue scope
- Rely on cross-channel platform queue inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform queue foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel queue state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform queue foundation implementation, no queue execution, no queue orchestration, no retry, no scheduler, no production transport I/O, no outbound notifications, no runtime queue execution in this act.

---

## Consumes

| Product                   | How this package uses it                               | Must not do                     |
| ------------------------- | ------------------------------------------------------ | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform queue foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access queue foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform queue state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types       | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                      | Fork platform controls          |
| **Security Audit**        | Attributable queue foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                 | Redesign facade ownership       |
| **Notification Delivery** | Platform queue foundation extension                    | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)      | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                         | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                      | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)                | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)                   | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume)     | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                    | Redesign N04 owner artifacts    |
| **W5-N05 foundation**     | Platform integration anchors and patterns (consume)    | Redesign N05 owner artifacts    |
| **W5-N06 foundation**     | Platform delivery anchors and patterns (consume)       | Redesign N06 owner artifacts    |
| **W5-N07 foundation**     | Platform dispatch anchors and patterns (consume)       | Redesign N07 owner artifacts    |

---

## Owns

| Outcome                                                   | Customer meaning                                         |
| --------------------------------------------------------- | -------------------------------------------------------- |
| Cross-channel platform queue inventory & honesty baseline | Honest unified platform queue vs per-channel surfaces    |
| Durable platform queue anchors                            | Platform queue state survives restart                    |
| Platform queue restart recovery foundation                | Hydrated queue state after normal API restart            |
| Platform queue operational continuity foundation          | Platform Readiness projection for queue                  |
| Cross-channel honest queue rules (post-impl)              | Consistent Connected/Delivering semantics at queue scope |
| Workspace-scoped platform queue state                     | Operator-visible platform queue truth                    |
| Attributable queue foundation outcomes                    | Emit to Security Audit where required                    |

**Does not own a new notification product, engine, or queue execution layer.** Notification Delivery remains transport owner.

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
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| Telegram Notification            | V3-N01 (CLOSED)                |
| Email SMTP                       | V3-N02 (CLOSED)                |
| Slack / Discord / Teams          | V3-N03 (CLOSED)                |
| Push                             | V3-N04 (CLOSED)                |
| Platform Integration             | V3-N05 (CLOSED)                |
| Platform Delivery                | V3-N06 (CLOSED)                |
| Platform Dispatch                | V3-N07 (CLOSED)                |
| Queue execution                  | Deferred post-foundation       |
| Queue orchestration              | Deferred post-foundation       |
| Retry engine                     | Deferred post-foundation       |
| Scheduler                        | Deferred post-foundation       |
| Production transport I/O         | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway           | Wave 7 V3-A02                  |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N08 — post-implementation intent)

| Item                                                                              | Notes                                   |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| Cross-channel platform queue inventory & honesty baseline                         | W5-N08-a                                |
| Durable platform queue anchor persistence                                         | W5-N08-b on notification-delivery owner |
| Platform queue restart recovery foundation                                        | W5-N08-c                                |
| Platform queue operational continuity foundation                                  | W5-N08-d                                |
| Package Close Evidence                                                            | W5-N08-e                                |
| Cross-channel honest queue rule unification                                       | After Approval — not from planning open |
| PC-06 routing queue foundation at platform scope                                  | Reuse unchanged — consume only          |
| Per-channel, integration, delivery, and dispatch foundation consumption (N01…N07) | No redesign of prior artifacts          |

---

## OUT of Scope

| Item                                                | Owner / deferral          |
| --------------------------------------------------- | ------------------------- |
| Live Trading                                        | Wave 6 + ADR              |
| Live order submission                               | Wave 6                    |
| Per-channel transport I/O                           | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                         | TD-049                    |
| Production SMTP / webhook / push I/O                | TD-050                    |
| Queue execution                                     | Deferred post-foundation  |
| Queue orchestration                                 | Deferred post-foundation  |
| Retry engine                                        | Deferred post-foundation  |
| Scheduler                                           | Deferred post-foundation  |
| Second notification routing engine                  | Forbidden                 |
| Connection Management redesign                      | Wave 2 CLOSED             |
| Vault redesign                                      | Wave 1 CLOSED             |
| Exchange I/O                                        | Wave 4 CLOSED             |
| Platform integration redesign                       | W5-N05 CLOSED             |
| Platform delivery redesign                          | W5-N06 CLOSED             |
| Platform dispatch redesign                          | W5-N07 CLOSED             |
| Anthropic / AI Gateway                              | Wave 7 V3-A02             |
| Wave 5 COMPLETE                                     | PO after N01…N08          |
| Notification Platform Complete                      | PO after N01…N08          |
| Platform queue foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                   | Planning open only        |
| W5-N08 Planning Review (this act)                   | Separate PO act           |
| W5-N08 Planning Approval (this act)                 | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence          |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence          |
| **Error**          | Provider failure visible — not silent success                            |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                           |
| **Disconnected**   | Operator or system disconnected transport                                |
| **Platform Ready** | Cross-channel queue foundation evidence exists — not transport I/O alone |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform queue foundation evidence.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or queue foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N08 foundation alone.

Never claim queue execution, orchestration, retry, or scheduler implemented from W5-N08 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform queue foundation state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform queue foundation errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or queue foundation context denies platform queue reads/writes.
- **No silent success:** Queue foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform queue foundation does not override per-channel reserved-inactive truth.
- **Integration honesty preserved:** Platform queue foundation does not override N05 integration truth.
- **Delivery honesty preserved:** Platform queue foundation does not override N06 delivery truth.
- **Dispatch honesty preserved:** Platform queue foundation does not override N07 dispatch truth.
- **No Live Trading implication:** Queue foundation never enables live orders.
- **Foundation ≠ I/O:** Durable queue anchors ≠ production transport operational.
- **Foundation ≠ execution:** Queue foundation ≠ queue execution, orchestration, retry, or scheduler operational.

---

## Acceptance criteria (W5-N08 Close — post-implementation)

| #   | Criterion                                        | Evidence                    |
| --- | ------------------------------------------------ | --------------------------- |
| 1   | Cross-channel platform queue inventory complete  | W5-N08-a                    |
| 2   | Durable platform queue anchors on correct owner  | W5-N08-b                    |
| 3   | Restart recovery hydrates queue state            | W5-N08-c                    |
| 4   | Operational continuity projects honest readiness | W5-N08-d                    |
| 5   | Close Evidence assembled                         | W5-N08-e                    |
| 6   | Cross-channel honest queue rules evidenced       | Implementation + validation |
| 7   | No cross-workspace queue state leak              | Security validation         |
| 8   | W5-N01…N07 boundaries unchanged                  | Regression                  |
| 9   | Master Plan unchanged                            | Governance                  |

---

## Explicit non-claims

- Notification Platform Queue Foundation implemented — **not claimed**
- Notification Platform Queue implemented — **not claimed**
- Queue execution implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-20 implemented — **not claimed**
- Queue orchestration implemented — **not claimed**
- Retry implemented — **not claimed**
- Scheduler implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N08 Planning APPROVED — **not claimed**
- W5-N08-a opened — **not claimed**

---

**STOP.** W5-N08 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N08-a. Do not begin implementation.
