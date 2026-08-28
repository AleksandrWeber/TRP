# W5-N02 Product Scope

**Package:** W5-N02 Email SMTP
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N02 · CM-12
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n02-implementation-package.md`](./w5-n02-implementation-package.md)
**Overview:** [`w5-n02-overview.md`](./w5-n02-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N02. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N02` is the operational package ID for Master Plan / Execution Roadmap **V3-N02**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory.

---

## Product purpose

Email SMTP is the product package that defines how **vault-backed SMTP notification transport** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter and PC-07 catalog — replacing reserved-inactive email with honest production transport outcomes when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** send password-recovery mail. Auth host mail (S01-e) owns identity recovery infrastructure.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds transports only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own Telegram (N01), Slack/Discord/Teams (N03), or Push (N04).

```text
Notification Delivery owns email transport protocol I/O and notification anchors.
Vault owns SMTP credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N02 owns Email SMTP notification outcomes (V3-N02 · CM-12).
Real delivery ≠ Live Trading.
Auth host mail ≠ Notification Email product.
Reserved-inactive ≠ Connected.
```

---

## Why Email SMTP exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. Master Plan defers Email SMTP to **V3-N02 · CM-12**.

Today the email channel is **reserved-inactive** — PC-07 surfaces exist but transport is not offered. Operators need **real SMTP notification delivery** on the existing routing product — not silent skips or fake Connected labels. CM-12 is the universal operator alert channel per capability inventory.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Connect vaulted SMTP credentials for notification email
- Send a verifiable test email through the production transport
- See honest Connected / Error / Disconnected labels from SMTP round-trip
- Receive notification alerts by email when routing delivers to the active email transport
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package
- Distinguish Notification Email from Auth password-recovery mail

**Not available from planning open alone** — no SMTP implementation, no email sending, no outbound communication in this act.

---

## Consumes

| Product                   | How this package uses it                           | Must not do                     |
| ------------------------- | -------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators configure email transport | Parallel login; host mail merge |
| **Authorization**         | Only permitted roles trigger connect/test          | New IAM                         |
| **Workspace Isolation**   | Email notification state stays in workspace        | Cross-workspace convenience     |
| **Vault**                 | Retrieve SMTP credentials for adapter send only    | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                  | Fork platform controls          |
| **Security Audit**        | Attributable connect/test/disconnect outcomes      | Own the audit store             |
| **Connection Management** | Operator UI for email channel connect              | Redesign facade ownership       |
| **Notification Delivery** | Email SMTP adapter extension                       | Second engine; command bus      |
| **PC-06 routing**         | Routes to active email transport when enabled      | Redefine routing SoT            |
| **PC-07 catalog**         | Email channel surfaces                             | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                  | Redesign queue owner            |
| **W5-N01 foundation**     | Durable/recovery/continuity patterns (consume)     | Redesign N01 owner artifacts    |

---

## Owns

| Outcome                                           | Customer meaning                            |
| ------------------------------------------------- | ------------------------------------------- |
| Email notification inventory & honesty baseline   | Honest reserved vs real transport surfaces  |
| Durable email notification anchors                | SMTP notification state survives restart    |
| Email notification restart recovery               | Hydrated state after normal API restart     |
| Email notification operational continuity         | Platform Readiness projection for email     |
| Real SMTP connect / test / disconnect (post-impl) | Verifiable test email; honest status labels |
| Workspace-scoped email notification state         | Operator-visible email transport truth      |
| Attributable connect/test/disconnect outcomes     | Emit to Security Audit where required       |

**Does not own a new notification product or engine.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                          | Real owner                     |
| -------------------------------- | ------------------------------ |
| Secret ciphertext / encryption   | Vault                          |
| Identity / sessions              | Authentication                 |
| Password-recovery host mail      | Authentication (S01-e)         |
| Permissions (IAM)                | Authorization                  |
| Workspace membership / isolation | Workspace / Isolation          |
| Connection Management facade     | Connection Management (Wave 2) |
| Notification routing             | PC-06                          |
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| Telegram Notification            | V3-N01 (CLOSED)                |
| Slack / Discord / Teams          | V3-N03                         |
| Push                             | V3-N04                         |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N02 — post-implementation intent)

| Item                                                | Notes                                   |
| --------------------------------------------------- | --------------------------------------- |
| Email notification inventory & honesty baseline     | W5-N02-a                                |
| Durable email notification anchor persistence       | W5-N02-b on notification-delivery owner |
| Email notification restart recovery                 | W5-N02-c                                |
| Email notification operational continuity           | W5-N02-d                                |
| Package Close Evidence                              | W5-N02-e                                |
| Real SMTP connect / test / disconnect               | After Approval — not from planning open |
| Vault-backed SMTP credential use for adapter only   | No local secret store                   |
| Honest Connected / Error when SMTP round-trip fails | Fail closed                             |
| SSRF / SMTP endpoint allowlist                      | Provider endpoints only                 |
| PC-06 routing integration                           | Reuse unchanged                         |

---

## OUT of Scope

| Item                                | Owner / deferral   |
| ----------------------------------- | ------------------ |
| Live Trading                        | Wave 6 + ADR       |
| Live order submission               | Wave 6             |
| Auth password-recovery mail product | S01-e (exists)     |
| Telegram transport                  | W5-N01 (CLOSED)    |
| Slack / Discord / Teams / Push      | W5-N03 / N04       |
| Second notification routing engine  | Forbidden          |
| Connection Management redesign      | Wave 2 CLOSED      |
| Vault redesign                      | Wave 1 CLOSED      |
| Exchange I/O                        | Wave 4 CLOSED      |
| Wave 5 COMPLETE                     | PO after N01…N04   |
| Notification Platform Complete      | PO after N01…N04   |
| SMTP implementation (this act)      | Planning open only |
| Email sending (this act)            | Planning open only |

---

## Honest Product rules (binding)

| Label            | Meaning                                                        |
| ---------------- | -------------------------------------------------------------- |
| **Connected**    | Real SMTP connect / handshake succeeded with vault credentials |
| **Delivering**   | Real SMTP send round-trip succeeded for test or routed alert   |
| **Error**        | SMTP failure visible — not silent success                      |
| **Reserved**     | Channel not yet shipped — honest “Not offered”                 |
| **Disconnected** | Operator or system disconnected transport                      |

Never show **Connected** or **Delivering** without a real SMTP round-trip.

Never conflate Auth host mail success with Notification Email delivery.

Never show email as a trading control plane.

Never claim email notifications operational from foundation slices alone without Product Owner Close.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications / Connections
  → Select Email (SMTP)
  → Enter or vault SMTP credentials
  → Test send — receive verifiable email
  → PC-06 routing delivers alerts to active email transport when enabled
  → Error shown honestly when SMTP fails
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or vault context denies connect/test/send.
- **No silent success:** SMTP errors surface to operator — not swallowed as Connected.
- **No secret echo:** Logs, UI, and errors never expose SMTP passwords or credentials.
- **Provider down:** Honest degraded status — not fake Delivering.
- **Reserved honest:** Until transport ships, channel shows reserved — not fake connected.

---

## Acceptance criteria (W5-N02 Close — post-implementation)

| #   | Criterion                                              | Evidence                    |
| --- | ------------------------------------------------------ | --------------------------- |
| 1   | Email inventory complete with SURVIVE/EPHEMERAL        | W5-N02-a                    |
| 2   | Durable email notification anchors on correct owner    | W5-N02-b                    |
| 3   | Restart recovery hydrates email state                  | W5-N02-c                    |
| 4   | Operational continuity projects honest email readiness | W5-N02-d                    |
| 5   | Close Evidence assembled                               | W5-N02-e                    |
| 6   | Real SMTP test send verifiable                         | Implementation + validation |
| 7   | No cross-workspace credential leak                     | Security validation         |
| 8   | Auth host mail path unchanged                          | Regression                  |
| 9   | Master Plan unchanged                                  | Governance                  |

---

## Explicit non-claims

- Email SMTP implemented — **not claimed**
- Email notifications operational — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N02 Planning APPROVED — **not claimed**
- W5-N02-a opened — **not claimed**

---

**STOP.** W5-N02 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N02-a. Do not begin implementation.
