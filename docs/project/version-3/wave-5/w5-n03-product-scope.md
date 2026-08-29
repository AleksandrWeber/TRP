# W5-N03 Product Scope

**Package:** W5-N03 Slack / Discord / Teams
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N03 · CM-13, CM-14, CM-15
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n03-implementation-package.md`](./w5-n03-implementation-package.md)
**Overview:** [`w5-n03-overview.md`](./w5-n03-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N03. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01/W5-N02. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N03` is the operational package ID for Master Plan / Execution Roadmap **V3-N03**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory.

---

## Product purpose

Slack / Discord / Teams is the product package that defines how **vault-backed webhook notification transport** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter and PC-07 catalog — replacing reserved-inactive Slack, Discord, and Microsoft Teams channels with honest production transport outcomes when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds transports only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own Telegram (N01), Email SMTP (N02), or Push (N04).

```text
Notification Delivery owns webhook transport protocol I/O and notification anchors.
Vault owns webhook credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W5-N03 owns Slack / Discord / Teams notification outcomes (V3-N03 · CM-13, CM-14, CM-15).
Real delivery ≠ Live Trading.
Reserved-inactive ≠ Connected.
```

---

## Why Slack / Discord / Teams exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. W5-N01 closed Telegram Notification foundation. W5-N02 closed Email Notification foundation. Master Plan defers Slack / Discord / Teams to **V3-N03 · CM-13, CM-14, CM-15**.

Today Slack, Discord, and Microsoft Teams channels are **reserved-inactive** — PC-07 surfaces exist but transport is not offered. Operators need **real webhook notification delivery** on the existing routing product — not silent skips or fake Connected labels. CM-13/14/15 are team chat operations channels per capability inventory.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Connect vaulted webhook credentials for Slack, Discord, and Microsoft Teams notification channels
- Send a verifiable test message through the production transport
- See honest Connected / Error / Disconnected labels from webhook round-trip
- Receive notification alerts in team chat when routing delivers to the active transport
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package

**Not available from planning open alone** — no Slack implementation, no Discord implementation, no Microsoft Teams implementation, no outbound notifications, no runtime integration in this act.

---

## Consumes

| Product                   | How this package uses it                             | Must not do                     |
| ------------------------- | ---------------------------------------------------- | ------------------------------- |
| **Authentication**        | Only signed-in operators configure webhook transport | Parallel login                  |
| **Authorization**         | Only permitted roles trigger connect/test            | New IAM                         |
| **Workspace Isolation**   | Notification state stays in workspace                | Cross-workspace convenience     |
| **Vault**                 | Retrieve webhook credentials for adapter send only   | Duplicate store; echo plaintext |
| **Security Platform**     | Hardening and rate-limit defaults                    | Fork platform controls          |
| **Security Audit**        | Attributable connect/test/disconnect outcomes        | Own the audit store             |
| **Connection Management** | Operator UI for Slack/Discord/Teams connect          | Redesign facade ownership       |
| **Notification Delivery** | Webhook adapter extension                            | Second engine; command bus      |
| **PC-06 routing**         | Routes to active transport when enabled              | Redefine routing SoT            |
| **PC-07 catalog**         | Slack/Discord/Teams channel surfaces                 | Invent parallel catalog         |
| **W3-O02 durable queue**  | Delivery work substrate (consume)                    | Redesign queue owner            |
| **W5-N01 foundation**     | Durable/recovery/continuity patterns (consume)       | Redesign N01 owner artifacts    |
| **W5-N02 foundation**     | Email foundation patterns (consume)                  | Redesign N02 owner artifacts    |

---

## Owns

| Outcome                                                     | Customer meaning                              |
| ----------------------------------------------------------- | --------------------------------------------- |
| Slack / Discord / Teams inventory & honesty baseline        | Honest reserved vs real transport surfaces    |
| Durable Slack / Discord / Teams notification anchors        | Webhook notification state survives restart   |
| Slack / Discord / Teams restart recovery                    | Hydrated state after normal API restart       |
| Slack / Discord / Teams operational continuity              | Platform Readiness projection for channels    |
| Real webhook connect / test / disconnect (post-impl)        | Verifiable test message; honest status labels |
| Workspace-scoped Slack / Discord / Teams notification state | Operator-visible transport truth              |
| Attributable connect/test/disconnect outcomes               | Emit to Security Audit where required         |

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
| Push                             | V3-N04                         |
| Live Trading                     | Wave 6 + ADR                   |
| Exchange I/O                     | Wave 4 Exchange Adapter        |

---

## IN Scope (W5-N03 — post-implementation intent)

| Item                                                   | Notes                                   |
| ------------------------------------------------------ | --------------------------------------- |
| Slack / Discord / Teams inventory & honesty baseline   | W5-N03-a                                |
| Durable notification anchor persistence                | W5-N03-b on notification-delivery owner |
| Slack / Discord / Teams restart recovery               | W5-N03-c                                |
| Slack / Discord / Teams operational continuity         | W5-N03-d                                |
| Package Close Evidence                                 | W5-N03-e                                |
| Real webhook connect / test / disconnect               | After Approval — not from planning open |
| Vault-backed webhook credential use for adapter only   | No local secret store                   |
| Honest Connected / Error when webhook round-trip fails | Fail closed                             |
| SSRF / webhook endpoint allowlist                      | Provider endpoints only                 |
| PC-06 routing integration                              | Reuse unchanged                         |

---

## OUT of Scope

| Item                                      | Owner / deferral   |
| ----------------------------------------- | ------------------ |
| Live Trading                              | Wave 6 + ADR       |
| Live order submission                     | Wave 6             |
| Telegram transport                        | W5-N01 (CLOSED)    |
| Email SMTP transport                      | W5-N02 (CLOSED)    |
| Push                                      | W5-N04             |
| Second notification routing engine        | Forbidden          |
| Connection Management redesign            | Wave 2 CLOSED      |
| Vault redesign                            | Wave 1 CLOSED      |
| Exchange I/O                              | Wave 4 CLOSED      |
| Wave 5 COMPLETE                           | PO after N01…N04   |
| Notification Platform Complete            | PO after N01…N04   |
| Slack implementation (this act)           | Planning open only |
| Discord implementation (this act)         | Planning open only |
| Microsoft Teams implementation (this act) | Planning open only |
| Outbound notifications (this act)         | Planning open only |

---

## Honest Product rules (binding)

| Label            | Meaning                                                           |
| ---------------- | ----------------------------------------------------------------- |
| **Connected**    | Real webhook connect / handshake succeeded with vault credentials |
| **Delivering**   | Real webhook send round-trip succeeded for test or routed alert   |
| **Error**        | Webhook failure visible — not silent success                      |
| **Reserved**     | Channel not yet shipped — honest “Not offered”                    |
| **Disconnected** | Operator or system disconnected transport                         |

Never show **Connected** or **Delivering** without a real webhook round-trip.

Never show team chat channels as a trading control plane.

Never claim Slack / Discord / Teams notifications operational from foundation slices alone without Product Owner Close.

---

## Customer journey (planning intent — post-implementation)

```text
Sign in
  → Open Notifications / Connections
  → Select Slack, Discord, or Microsoft Teams
  → Enter or vault webhook credentials
  → Test send — receive verifiable message in team chat
  → PC-06 routing delivers alerts to active transport when enabled
  → Error shown honestly when webhook fails
```

---

## Failure philosophy

- **Fail closed:** Missing workspace, auth, or vault context denies connect/test/send.
- **No silent success:** Webhook errors surface to operator — not swallowed as Connected.
- **No secret echo:** Logs, UI, and errors never expose webhook URLs or tokens.
- **Provider down:** Honest degraded status — not fake Delivering.
- **Reserved honest:** Until transport ships, channel shows reserved — not fake connected.

---

## Acceptance criteria (W5-N03 Close — post-implementation)

| #   | Criterion                                                         | Evidence                    |
| --- | ----------------------------------------------------------------- | --------------------------- |
| 1   | Slack / Discord / Teams inventory complete with SURVIVE/EPHEMERAL | W5-N03-a                    |
| 2   | Durable notification anchors on correct owner                     | W5-N03-b                    |
| 3   | Restart recovery hydrates state                                   | W5-N03-c                    |
| 4   | Operational continuity projects honest readiness                  | W5-N03-d                    |
| 5   | Close Evidence assembled                                          | W5-N03-e                    |
| 6   | Real webhook test send verifiable                                 | Implementation + validation |
| 7   | No cross-workspace credential leak                                | Security validation         |
| 8   | W5-N01 / W5-N02 boundaries unchanged                              | Regression                  |
| 9   | Master Plan unchanged                                             | Governance                  |

---

## Explicit non-claims

- Slack implemented — **not claimed**
- Discord implemented — **not claimed**
- Microsoft Teams implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- Production Ready — **not claimed**
- Live Notifications — **not claimed**
- W5-N03 Planning APPROVED — **not claimed**
- W5-N03-a opened — **not claimed**

---

**STOP.** W5-N03 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N03-a. Do not begin implementation.
