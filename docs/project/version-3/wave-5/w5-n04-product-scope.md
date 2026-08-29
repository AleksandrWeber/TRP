# W5-N04 Product Scope

**Package:** W5-N04 Push
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N04 · CM-16
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n04-implementation-package.md`](./w5-n04-implementation-package.md)
**Overview:** [`w5-n04-overview.md`](./w5-n04-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N04. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N03. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N04` is the operational package ID for Master Plan / Execution Roadmap **V3-N04**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory.

---

## Product purpose

Push is the product package that defines how **vault-backed push notification transport** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter and PC-07 catalog — replacing reserved-inactive Push channel with honest production transport outcomes when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds transports only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own Telegram (N01), Email SMTP (N02), or Slack/Discord/Teams (N03).

```text
Notification Delivery owns push transport protocol I/O and notification anchors.
Vault owns VAPID/FCM credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N04 owns Push notification outcomes (V3-N04 · CM-16).
Real delivery ≠ Live Trading.
Reserved-inactive ≠ Connected.
```

---

## Why Push exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. W5-N03 closed Slack / Discord / Teams foundation. Master Plan defers Push to **V3-N04 · CM-16**.

Today Push channel is **reserved-inactive** — PC-07 surface exists but transport is not offered. Operators need **real push notification delivery** on the existing routing product — not silent skips or fake Connected labels. CM-16 is the browser/device attention channel per capability inventory.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Register browser/device tokens for push attention alerts (workspace-scoped)
- Connect vaulted VAPID/FCM credentials for Push notification channel
- Send a verifiable test push through the production transport
- See honest Connected / Error / Disconnected labels from provider round-trip
- Receive notification alerts on registered devices when routing delivers to the active transport
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no Push implementation, no Web Push/FCM, no device token store, no outbound notifications, no runtime integration in this act.

---

## Consumes

| Product                   | How this package uses it                             | Must not do                     |
| ------------------------- | ---------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators configure push transport    | Parallel login                  |
| **Authorization**         | Only permitted roles trigger connect/test            | New IAM                         |
| **Workspace Isolation**   | Notification and device state stays in workspace     | Cross-workspace convenience     |
| **Vault**                 | Retrieve VAPID/FCM credentials for adapter send only | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                    | Fork platform controls          |
| **Security Audit**        | Attributable connect/test/disconnect outcomes        | Own the audit store             |
| **Connection Management** | Operator UI for Push connect                         | Redesign facade ownership       |
| **Notification Delivery** | Push adapter extension                               | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled              | Redefine routing SoT            |
| **PC-07 catalog**         | Push channel surface                                 | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                    | Redesign queue owner            |
| **W5-N01 foundation**     | Durable/recovery/continuity patterns (consume)       | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email foundation patterns (consume)                  | Redesign N02 owner artifacts    |
| **W5-N03 foundation**     | Slack/Discord/Teams foundation patterns (consume)    | Redesign N03 owner artifacts    |

---

## Owns

| Outcome                                            | Customer meaning                             |
| -------------------------------------------------- | -------------------------------------------- |
| Push inventory & honesty baseline                  | Honest reserved vs real transport surfaces   |
| Durable Push notification anchors                  | Push notification state survives restart     |
| Push restart recovery                              | Hydrated state after normal API restart      |
| Push operational continuity                        | Platform Readiness projection for Push       |
| Real push connect / test / disconnect (post-impl)  | Verifiable test push; honest status labels   |
| Workspace-scoped Push notification state           | Operator-visible transport truth             |
| Workspace-scoped device token registry (post-impl) | Device registration under notification owner |
| Attributable connect/test/disconnect outcomes      | Emit to Security Audit where required        |

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
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N04 — post-implementation intent)

| Item                                                   | Notes                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| Push inventory & honesty baseline                      | W5-N04-a                                   |
| Durable notification anchor persistence                | W5-N04-b on notification-delivery owner    |
| Push restart recovery                                  | W5-N04-c                                   |
| Push operational continuity                            | W5-N04-d                                   |
| Package Close Evidence                                 | W5-N04-e                                   |
| Real push connect / test / disconnect                  | After Approval — not from planning open    |
| Vault-backed VAPID/FCM credential use for adapter only | No local secret store                      |
| Workspace-scoped device token registry                 | notification-delivery owner when justified |
| Honest Connected / Error when push round-trip fails    | Fail closed                                |
| SSRF / push provider endpoint allowlist                | Provider endpoints only                    |
| PC-06 routing integration                              | Reuse unchanged                            |

---

## OUT of Scope

| Item                                   | Owner / deferral   |
| -------------------------------------- | ------------------ |
| Live Trading                           | Wave 6 + ADR       |
| Live order submission                  | Wave 6             |
| Telegram transport                     | W5-N01 (CLOSED)    |
| Email SMTP transport                   | W5-N02 (CLOSED)    |
| Slack / Discord / Teams transport      | W5-N03 (CLOSED)    |
| Second notification routing engine     | Forbidden          |
| Connection Management redesign         | Wave 2 CLOSED      |
| Vault redesign                         | Wave 1 CLOSED      |
| Exchange I/O                           | Wave 4 CLOSED      |
| Wave 5 COMPLETE                        | PO after N01…N04   |
| Notification Platform Complete         | PO after N01…N04   |
| Push implementation (this act)         | Planning open only |
| Outbound push notifications (this act) | Planning open only |
| W5-N04 Planning Review (this act)      | Separate PO act    |
| W5-N04 Planning Approval (this act)    | Separate PO act    |

---

## Honest Product rules (binding)

| Label            | Meaning                                                           |
| ---------------- | ----------------------------------------------------------------- |
| **Connected**    | Real push connect / handshake succeeded with vault credentials    |
| **Delivering**   | Real push send round-trip succeeded for test or routed alert      |
| **Error**        | Push provider failure visible — not silent success                |
| **Reserved**     | Channel not yet shipped — honest “Not offered”                    |
| **Disconnected** | Operator or system disconnected transport or revoked device token |

Never show **Connected** or **Delivering** without a real push provider round-trip.

Never show push as a trading control plane.

Never claim Push notifications operational from foundation slices alone without Product Owner Close.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications / Connections
  → Select Push
  → Register browser/device (workspace-scoped)
  → Connect or vault VAPID/FCM credentials
  → Test send — receive verifiable push on device
  → PC-06 routing delivers alerts to active transport when enabled
  → Error shown honestly when push provider fails
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or vault context denies connect/test/send.
- **No silent success:** Push provider errors surface to operator — not swallowed as Connected.
- **No secret echo:** Logs, UI, and errors never expose VAPID keys, FCM tokens, or device secrets.
- **Provider down:** Honest degraded status — not fake Delivering.
- **Reserved honest:** Until transport ships, channel shows reserved — not fake connected.
- **Device revocation:** Disconnect or revoke removes device token from active delivery set.

---

## Acceptance criteria (W5-N04 Close — post-implementation)

| #   | Criterion                                        | Evidence                    |
| --- | ------------------------------------------------ | --------------------------- |
| 1   | Push inventory complete with SURVIVE/EPHEMERAL   | W5-N04-a                    |
| 2   | Durable notification anchors on correct owner    | W5-N04-b                    |
| 3   | Restart recovery hydrates state                  | W5-N04-c                    |
| 4   | Operational continuity projects honest readiness | W5-N04-d                    |
| 5   | Close Evidence assembled                         | W5-N04-e                    |
| 6   | Real push test send verifiable                   | Implementation + validation |
| 7   | No cross-workspace credential or token leak      | Security validation         |
| 8   | W5-N01 / W5-N02 / W5-N03 boundaries unchanged    | Regression                  |
| 9   | Master Plan unchanged                            | Governance                  |

---

## Explicit non-claims

- Push implemented — **not claimed**
- Push notifications operational — **not claimed**
- CM-16 implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N04 Planning APPROVED — **not claimed**
- W5-N04-a opened — **not claimed**

---

**STOP.** W5-N04 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N04-a. Do not begin implementation.
