# W5-N07 Product Scope

**Package:** W5-N07 Notification Platform Dispatch Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N07 · CM-19
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n07-implementation-package.md`](./w5-n07-implementation-package.md)
**Overview:** [`w5-n07-overview.md`](./w5-n07-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N07. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N06. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N07` is the operational package ID for Product Owner authorization **V3-N07**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-19** also names Gemini (Wave 7); W5-N07 **CM-19** is Notification Platform Dispatch Foundation only — not AI Gateway.

---

## Product purpose

Notification Platform Dispatch Foundation is the product package that defines how **cross-channel notification platform dispatch integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N06 delivery foundations into a coherent platform dispatch foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds dispatch foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform integration redesign (N05 reopen).

It does **not** own platform delivery redesign (N06 reopen).

It does **not** own Gemini / AI Gateway (Wave 7).

It does **not** implement dispatcher execution, queue orchestration, retry engine, or scheduler.

```text
Notification Delivery owns platform dispatch foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N07 owns Notification Platform Dispatch Foundation outcomes (V3-N07 · CM-19).
Dispatch foundation ≠ dispatch execution.
Dispatch foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Dispatch Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. W5-N05 closed Notification Platform Integration foundation. W5-N06 closed Notification Platform Delivery foundation. Product Owner defers platform dispatch foundation to **V3-N07 · CM-19**.

Today the platform has delivery foundation — but no cross-channel platform dispatch foundation layer. Operators need **unified honest notification platform dispatch behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at dispatch scope. CM-19 (Wave 5 scope) is the dispatch foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest dispatch rules across all notification channels at platform dispatch scope
- Rely on cross-channel platform dispatch inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform dispatch foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel dispatch state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform dispatch foundation implementation, no dispatch execution, no dispatcher, no queue orchestration, no retry, no scheduler, no production transport I/O, no outbound notifications, no runtime dispatch execution in this act.

---

## Consumes

| Product                   | How this package uses it                                  | Must not do                     |
| ------------------------- | --------------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform dispatch foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access dispatch foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform dispatch state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types          | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                         | Fork platform controls          |
| **Security Audit**        | Attributable dispatch foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                    | Redesign facade ownership       |
| **Notification Delivery** | Platform dispatch foundation extension                    | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)         | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                            | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                         | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)                   | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)                      | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume)        | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                       | Redesign N04 owner artifacts    |
| **W5-N05 foundation**     | Platform integration anchors and patterns (consume)       | Redesign N05 owner artifacts    |
| **W5-N06 foundation**     | Platform delivery anchors and patterns (consume)          | Redesign N06 owner artifacts    |

---

## Owns

| Outcome                                                      | Customer meaning                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| Cross-channel platform dispatch inventory & honesty baseline | Honest unified platform dispatch vs per-channel surfaces    |
| Durable platform dispatch anchors                            | Platform dispatch state survives restart                    |
| Platform dispatch restart recovery foundation                | Hydrated dispatch state after normal API restart            |
| Platform dispatch operational continuity foundation          | Platform Readiness projection for dispatch                  |
| Cross-channel honest dispatch rules (post-impl)              | Consistent Connected/Delivering semantics at dispatch scope |
| Workspace-scoped platform dispatch state                     | Operator-visible platform dispatch truth                    |
| Attributable dispatch foundation outcomes                    | Emit to Security Audit where required                       |

**Does not own a new notification product, engine, or dispatch execution layer.** Notification Delivery remains transport owner.

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
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| Telegram Notification            | V3-N01 (CLOSED)                |
| Email SMTP                       | V3-N02 (CLOSED)                |
| Slack / Discord / Teams          | V3-N03 (CLOSED)                |
| Push                             | V3-N04 (CLOSED)                |
| Platform Integration             | V3-N05 (CLOSED)                |
| Platform Delivery                | V3-N06 (CLOSED)                |
| Dispatcher execution             | Deferred post-foundation       |
| Queue orchestration              | Deferred post-foundation       |
| Retry engine                     | Deferred post-foundation       |
| Scheduler                        | Deferred post-foundation       |
| Production transport I/O         | TD-049 / TD-050 (deferred)     |
| Gemini / AI Gateway              | Wave 7 V3-A02                  |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N07 — post-implementation intent)

| Item                                                                    | Notes                                   |
| ----------------------------------------------------------------------- | --------------------------------------- |
| Cross-channel platform dispatch inventory & honesty baseline            | W5-N07-a                                |
| Durable platform dispatch anchor persistence                            | W5-N07-b on notification-delivery owner |
| Platform dispatch restart recovery foundation                           | W5-N07-c                                |
| Platform dispatch operational continuity foundation                     | W5-N07-d                                |
| Package Close Evidence                                                  | W5-N07-e                                |
| Cross-channel honest dispatch rule unification                          | After Approval — not from planning open |
| PC-06 routing dispatch foundation at platform scope                     | Reuse unchanged — consume only          |
| Per-channel, integration, and delivery foundation consumption (N01…N06) | No redesign of prior artifacts          |

---

## OUT of Scope

| Item                                                   | Owner / deferral          |
| ------------------------------------------------------ | ------------------------- |
| Live Trading                                           | Wave 6 + ADR              |
| Live order submission                                  | Wave 6                    |
| Per-channel transport I/O                              | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                            | TD-049                    |
| Production SMTP / webhook / push I/O                   | TD-050                    |
| Dispatcher execution                                   | Deferred post-foundation  |
| Queue orchestration                                    | Deferred post-foundation  |
| Retry engine                                           | Deferred post-foundation  |
| Scheduler                                              | Deferred post-foundation  |
| Second notification routing engine                     | Forbidden                 |
| Connection Management redesign                         | Wave 2 CLOSED             |
| Vault redesign                                         | Wave 1 CLOSED             |
| Exchange I/O                                           | Wave 4 CLOSED             |
| Platform integration redesign                          | W5-N05 CLOSED             |
| Platform delivery redesign                             | W5-N06 CLOSED             |
| Gemini / AI Gateway                                    | Wave 7 V3-A02             |
| Wave 5 COMPLETE                                        | PO after N01…N07          |
| Notification Platform Complete                         | PO after N01…N07          |
| Platform dispatch foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                      | Planning open only        |
| W5-N07 Planning Review (this act)                      | Separate PO act           |
| W5-N07 Planning Approval (this act)                    | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence             |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence             |
| **Error**          | Provider failure visible — not silent success                               |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                              |
| **Disconnected**   | Operator or system disconnected transport                                   |
| **Platform Ready** | Cross-channel dispatch foundation evidence exists — not transport I/O alone |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform dispatch foundation evidence.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or dispatch foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N07 foundation alone.

Never claim dispatcher, queue, retry, or scheduler implemented from W5-N07 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform dispatch foundation state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform dispatch foundation errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or dispatch foundation context denies platform dispatch reads/writes.
- **No silent success:** Dispatch foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform dispatch foundation does not override per-channel reserved-inactive truth.
- **Integration honesty preserved:** Platform dispatch foundation does not override N05 integration truth.
- **Delivery honesty preserved:** Platform dispatch foundation does not override N06 delivery truth.
- **No Live Trading implication:** Dispatch foundation never enables live orders.
- **Foundation ≠ I/O:** Durable dispatch anchors ≠ production transport operational.
- **Foundation ≠ execution:** Dispatch foundation ≠ dispatcher, queue, retry, or scheduler operational.

---

## Acceptance criteria (W5-N07 Close — post-implementation)

| #   | Criterion                                          | Evidence                    |
| --- | -------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform dispatch inventory complete | W5-N07-a                    |
| 2   | Durable platform dispatch anchors on correct owner | W5-N07-b                    |
| 3   | Restart recovery hydrates dispatch state           | W5-N07-c                    |
| 4   | Operational continuity projects honest readiness   | W5-N07-d                    |
| 5   | Close Evidence assembled                           | W5-N07-e                    |
| 6   | Cross-channel honest dispatch rules evidenced      | Implementation + validation |
| 7   | No cross-workspace dispatch state leak             | Security validation         |
| 8   | W5-N01…N06 boundaries unchanged                    | Regression                  |
| 9   | Master Plan unchanged                              | Governance                  |

---

## Explicit non-claims

- Notification Platform Dispatch Foundation implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-19 implemented — **not claimed**
- Dispatcher implemented — **not claimed**
- Queue implemented — **not claimed**
- Retry implemented — **not claimed**
- Scheduler implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N07 Planning APPROVED — **not claimed**
- W5-N07-a opened — **not claimed**

---

**STOP.** W5-N07 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N07-a. Do not begin implementation.
