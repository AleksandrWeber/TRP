# W5-N05 Product Scope

**Package:** W5-N05 Notification Platform Integration
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N05 · CM-17
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n05-implementation-package.md`](./w5-n05-implementation-package.md)
**Overview:** [`w5-n05-overview.md`](./w5-n05-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N05. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N04. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N05` is the operational package ID for Product Owner authorization **V3-N05**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-17** also names OpenRouter (Wave 7); W5-N05 **CM-17** is Notification Platform Integration only — not AI Gateway.

---

## Product purpose

Notification Platform Integration is the product package that defines how **cross-channel notification platform integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — unifying Closed W5-N01…N04 per-channel foundations into a coherent platform integration layer when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds integration consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own OpenRouter / AI Gateway (Wave 7).

```text
Notification Delivery owns platform integration artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N05 owns Notification Platform Integration outcomes (V3-N05 · CM-17).
Platform integrated ≠ Live Trading.
Foundation ≠ production transport I/O.
```

---

## Why Notification Platform Integration exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. W5-N04 closed Push foundation. Product Owner defers platform integration to **V3-N05 · CM-17**.

Today each channel has an isolated foundation — but no cross-channel platform integration layer. Operators need **unified honest notification platform behavior** on the existing routing product — not silent per-channel inconsistency or fake platform-ready labels. CM-17 (Wave 5 scope) is the platform integration capability per Product Owner authorization.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See consistent honest delivery rules across all notification channels at platform scope
- Rely on cross-channel platform inventory with SURVIVE/EPHEMERAL classification
- Experience unified platform integration anchors that survive restart (when implemented)
- See honest Platform Readiness projection for cross-channel integration state
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no platform integration implementation, no production transport I/O, no outbound notifications, no runtime integration in this act.

---

## Consumes

| Product                   | How this package uses it                           | Must not do                     |
| ------------------------- | -------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators see platform integration  | Parallel login                  |
| **Authorization**         | Only permitted roles access integration surfaces   | New IAM                         |
| **Workspace Isolation**   | Platform integration state stays in workspace      | Cross-workspace convenience     |
| **Vault**                 | Consumes vault availability; no new secret types   | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                  | Fork platform controls          |
| **Security Audit**        | Attributable integration outcomes where required   | Own the audit store             |
| **Connection Management** | Operator UI for all channels (consume)             | Redesign facade ownership       |
| **Notification Delivery** | Platform integration extension                     | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled (consume)  | Redefine routing SoT            |
| **PC-07 catalog**         | All channel surfaces (consume)                     | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                  | Redesign queue owner            |
| **W5-N01 foundation**     | Telegram anchors and patterns (consume)            | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email anchors and patterns (consume)               | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams anchors and patterns (consume) | Redesign N03 owner artifacts    |
| **W5-N04 foundation**     | Push anchors and patterns (consume)                | Redesign N04 owner artifacts    |

---

## Owns

| Outcome                                             | Customer meaning                                    |
| --------------------------------------------------- | --------------------------------------------------- |
| Cross-channel platform inventory & honesty baseline | Honest unified platform vs per-channel surfaces     |
| Durable platform integration anchors                | Platform integration state survives restart         |
| Platform restart recovery integration               | Hydrated integration state after normal API restart |
| Platform operational continuity integration         | Platform Readiness projection for integration       |
| Cross-channel honest delivery rules (post-impl)     | Consistent Connected/Delivering semantics           |
| Workspace-scoped platform integration state         | Operator-visible platform truth                     |
| Attributable integration outcomes                   | Emit to Security Audit where required               |

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
| Production transport I/O         | TD-049 / TD-050 (deferred)     |
| OpenRouter / AI Gateway          | Wave 7 V3-A01                  |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N05 — post-implementation intent)

| Item                                                | Notes                                   |
| --------------------------------------------------- | --------------------------------------- |
| Cross-channel platform inventory & honesty baseline | W5-N05-a                                |
| Durable platform integration anchor persistence     | W5-N05-b on notification-delivery owner |
| Platform restart recovery integration               | W5-N05-c                                |
| Platform operational continuity integration         | W5-N05-d                                |
| Package Close Evidence                              | W5-N05-e                                |
| Cross-channel honest delivery rule unification      | After Approval — not from planning open |
| PC-06 routing integration at platform scope         | Reuse unchanged — consume only          |
| Per-channel foundation consumption (N01…N04)        | No redesign of channel artifacts        |

---

## OUT of Scope

| Item                                           | Owner / deferral          |
| ---------------------------------------------- | ------------------------- |
| Live Trading                                   | Wave 6 + ADR              |
| Live order submission                          | Wave 6                    |
| Per-channel transport I/O                      | N01…N04 / TD-049 / TD-050 |
| Production Telegram Bot API                    | TD-049                    |
| Production SMTP / webhook / push I/O           | TD-050                    |
| Second notification routing engine             | Forbidden                 |
| Connection Management redesign                 | Wave 2 CLOSED             |
| Vault redesign                                 | Wave 1 CLOSED             |
| Exchange I/O                                   | Wave 4 CLOSED             |
| OpenRouter / AI Gateway                        | Wave 7 V3-A01             |
| Wave 5 COMPLETE                                | PO after N01…N05          |
| Notification Platform Complete                 | PO after N01…N05          |
| Platform integration implementation (this act) | Planning open only        |
| Outbound notifications (this act)              | Planning open only        |
| W5-N05 Planning Review (this act)              | Separate PO act           |
| W5-N05 Planning Approval (this act)            | Separate PO act           |

---

## Honest Product rules (binding)

| Label              | Meaning                                                             |
| ------------------ | ------------------------------------------------------------------- |
| **Connected**      | Real channel connect succeeded — per-channel transport evidence     |
| **Delivering**     | Real send round-trip succeeded — per-channel transport evidence     |
| **Error**          | Provider failure visible — not silent success                       |
| **Reserved**       | Channel not yet shipped — honest “Not offered”                      |
| **Disconnected**   | Operator or system disconnected transport                           |
| **Platform Ready** | Cross-channel integration evidence exists — not transport I/O alone |

Never show **Connected** or **Delivering** without real per-channel provider round-trip.

Never show **Platform Ready** without platform integration evidence.

Never show notifications as a trading control plane.

Never claim Notification Platform Complete from foundation or integration slices alone without Product Owner Close.

Never claim production transports operational from W5-N05 foundation alone.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications
  → See unified platform integration state across channels
  → Per-channel connect/test remains on individual channel surfaces (N01…N04 transport scope)
  → PC-06 routing delivers to active transport when enabled and transport exists
  → Platform integration errors shown honestly
  → Reserved channels remain honestly reserved
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or integration context denies platform integration reads/writes.
- **No silent success:** Integration errors surface to operator — not swallowed as Platform Ready.
- **No secret echo:** Logs, UI, and errors never expose channel credentials or tokens.
- **Per-channel honesty preserved:** Platform integration does not override per-channel reserved-inactive truth.
- **No Live Trading implication:** Platform integration never enables live orders.
- **Foundation ≠ I/O:** Durable integration anchors ≠ production transport operational.

---

## Acceptance criteria (W5-N05 Close — post-implementation)

| #   | Criterion                                             | Evidence                    |
| --- | ----------------------------------------------------- | --------------------------- |
| 1   | Cross-channel platform inventory complete             | W5-N05-a                    |
| 2   | Durable platform integration anchors on correct owner | W5-N05-b                    |
| 3   | Restart recovery hydrates integration state           | W5-N05-c                    |
| 4   | Operational continuity projects honest readiness      | W5-N05-d                    |
| 5   | Close Evidence assembled                              | W5-N05-e                    |
| 6   | Cross-channel honest delivery rules evidenced         | Implementation + validation |
| 7   | No cross-workspace integration state leak             | Security validation         |
| 8   | W5-N01…N04 boundaries unchanged                       | Regression                  |
| 9   | Master Plan unchanged                                 | Governance                  |

---

## Explicit non-claims

- Notification Platform Integration implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- CM-17 implemented — **not claimed**
- Production transports operational — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N05 Planning APPROVED — **not claimed**
- W5-N05-a opened — **not claimed**

---

**STOP.** W5-N05 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N05-a. Do not begin implementation.
