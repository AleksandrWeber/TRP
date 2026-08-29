# W5-N06 Product Scope

**Package:** W5-N06 Notification Platform Delivery Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N06 · CM-18
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n06-implementation-package.md`](./w5-n06-implementation-package.md)
**Overview:** [`w5-n06-overview.md`](./w5-n06-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N06. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N05. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N06` is the operational package ID for Product Owner authorization **V3-N06**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-18** also names OpenAI (Wave 7); W5-N06 **CM-18** is Notification Platform Delivery Foundation only — not AI Gateway.

---

## Product purpose

Notification Platform Delivery Foundation is the product package that defines how **cross-channel notification platform delivery integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N05 integration foundations into a coherent platform delivery foundation layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds delivery foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform integration redesign (N05 reopen).

It does **not** own OpenAI / AI Gateway (Wave 7).

```text
Notification Delivery owns platform delivery foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N06 owns Notification Platform Delivery Foundation outcomes (V3-N06 · CM-18).
Delivery foundation ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Delivery Foundation exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. W5-N05 closed Notification Platform Integration foundation. Product Owner defers platform delivery foundation to **V3-N06 · CM-18**.

Today the platform has integration foundation — but no cross-channel platform delivery foundation layer. Operators need **unified honest notification platform delivery behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels at delivery scope. CM-18 (Wave 5 scope) is the delivery foundation capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest delivery rules across all notification channels at platform delivery scope
- Rely on cross-channel platform delivery inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform delivery foundation anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel delivery state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform delivery foundation implementation, no production transport I/O, no outbound notifications, no runtime delivery execution in this act.

---

## Consumes

| Product                   | How this package uses it                                  | Must not do                     |
| ------------------------- | --------------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform delivery foundation | Parallel login                  |
| **Authorization**         | Only permitted roles access delivery foundation surfaces  | New IAM                         |
| **Workspace Isolation**   | Platform delivery state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types          | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                         | Fork platform controls          |
| **Security Audit**        | Attributable delivery foundation outcomes where required  | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)                    | Redesign facade ownership       |
| **Notification Delivery** | Platform delivery foundation extension                    | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)         | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                            | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                         | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)                   | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)                      | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume)        | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                       | Redesign N04 owner artifacts    |
| **W5-N05 foundation**     | Platform integration anchors and patterns (consume)       | Redesign N05 owner artifacts    |

---

## Owns

| Outcome                                                      | Customer meaning                                         |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| Cross-channel platform delivery inventory & honesty baseline | Honest unified platform delivery vs per-channel surfaces |
| Durable platform delivery anchors                            | Platform delivery state survives restart                 |
| Platform delivery restart recovery foundation                | Hydrated delivery state after normal API restart         |
| Platform delivery operational continuity foundation          | Platform Readiness projection for delivery               |
| Cross-channel honest delivery rules (post-impl)              | Consistent Connected/Delivering semantics                |
| Workspace-scoped platform delivery state                     | Operator-visible platform delivery truth                 |
| Attributable delivery foundation outcomes                    | Emit to Security Audit where required                    |

**Does not own a new notification product or engine.** Notification Delivery remains transport owner.

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
| Production transport I/O         | TD-049 / TD-050 (deferred)     |
| OpenAI / AI Gateway              | Wave 7 V3-A02                  |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N06 — post-implementation intent)

| Item                                                         | Notes                                           |
| ------------------------------------------------------------ | ----------------------------------------------- |
| Cross-channel platform delivery inventory & honesty baseline | W5-N06-a                                        |
| Durable platform delivery anchor persistence                 | W5-N06-b on notification-delivery owner         |
| Platform delivery restart recovery foundation                | W5-N06-c                                        |
| Platform delivery operational continuity foundation          | W5-N06-d                                        |
| Package Close Evidence                                       | W5-N06-e                                        |
| Cross-channel honest delivery rule unification               | After Approval — not from planning open         |
| PC-06 routing delivery foundation at platform scope          | Reuse unchanged — consume only                  |
| Per-channel and integration foundation consumption (N01…N05) | No redesign of channel or integration artifacts |

---

## OUT of Scope

| Item                                                   | Owner / deferral          |
| ------------------------------------------------------ | ------------------------- |
| Live Trading                                           | Wave 6 + ADR              |
| Live order submission                                  | Wave 6                    |
| Per-channel transport I/O                              | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                            | TD-049                    |
| Production SMTP / webhook / push I/O                   | TD-050                    |
| Second notification routing engine                     | Forbidden                 |
| Connection Management redesign                         | Wave 2 CLOSED             |
| Vault redesign                                         | Wave 1 CLOSED             |
| Exchange I/O                                           | Wave 4 CLOSED             |
| Platform integration redesign                          | W5-N05 CLOSED             |
| OpenAI / AI Gateway                                    | Wave 7 V3-A02             |
| Wave 5 COMPLETE                                        | PO after N01…N06          |
| Notification Platform Complete                         | PO after N01…N06          |
| Platform delivery foundation implementation (this act) | Planning open only        |
| Outbound notifications (this act)                      | Planning open only        |
| W5-N06 Planning Review (this act)                      | Separate PO act           |
| W5-N06 Planning Approval (this act)                    | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence             |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence             |
| **Error**          | Provider failure visible — not silent success                               |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                              |
| **Disconnected**   | Operator or system disconnected transport                                   |
| **Platform Ready** | Cross-channel delivery foundation evidence exists — not transport I/O alone |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform delivery foundation evidence.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or delivery foundation slices alone without Product Owner Close.

Never claim production transports operational from W5-N06 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform delivery foundation state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform delivery foundation errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or delivery foundation context denies platform delivery reads/writes.
- **No silent success:** Delivery foundation errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform delivery foundation does not override per-channel reserved-inactive truth.
- **Integration honesty preserved:** Platform delivery foundation does not override N05 integration truth.
- **No Live Trading implication:** Delivery foundation never enables live orders.
- **Foundation ≠ I/O:** Durable delivery anchors ≠ production transport operational.

---

## Acceptance criteria (W5-N06 Close — post-implementation)

| #   | Criterion                                          | Evidence                    |
| --- | -------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform delivery inventory complete | W5-N06-a                    |
| 2   | Durable platform delivery anchors on correct owner | W5-N06-b                    |
| 3   | Restart recovery hydrates delivery state           | W5-N06-c                    |
| 4   | Operational continuity projects honest readiness   | W5-N06-d                    |
| 5   | Close Evidence assembled                           | W5-N06-e                    |
| 6   | Cross-channel honest delivery rules evidenced      | Implementation + validation |
| 7   | No cross-workspace delivery state leak             | Security validation         |
| 8   | W5-N01…N05 boundaries unchanged                    | Regression                  |
| 9   | Master Plan unchanged                              | Governance                  |

---

## Explicit non-claims

- Notification Platform Delivery Foundation implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-18 implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N06 Planning APPROVED — **not claimed**
- W5-N06-a opened — **not claimed**

---

**STOP.** W5-N06 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N06-a. Do not begin implementation.
