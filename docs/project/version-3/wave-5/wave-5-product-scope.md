# Wave 5 Product Scope

**Wave:** 5 — Notification Platform
**First package:** W5-N01 Production Telegram Bot API
**Master Plan / Roadmap:** V3-N01…N04 · CM-11…CM-16
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`wave-5-implementation-package.md`](./wave-5-implementation-package.md)
**Overview:** [`wave-5-overview.md`](./wave-5-overview.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for Wave 5. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE.

**Naming clarity:** `W5-N01`…`W5-N04` are operational package IDs for Master Plan / Execution Roadmap **V3-N01…N04**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory.

---

## Product purpose

The Notification Platform is the wave that makes delivery channels **real transports** on the existing catalog and routing product.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own notification routing rules. PC-06 owns routing.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own Exchange I/O (Wave 4 closed; not modified).

```text
Notification Delivery owns transport protocol I/O.
Vault owns credentials.
Connection Management facade owns the operator connect product surface.
PC-06 owns routing.
Wave 5 owns real transport connect/test/disconnect outcomes (CM-11…CM-16).
Telegram ≠ control plane.
Real delivery ≠ Live Trading.
```

---

## Why Notification Platform exists (business language)

Wave 2 closed Connection Management and the notification catalog. Wave 3 closed the durable notification queue. Telegram wizard UX exists but transport is in-memory until Wave 5.

Operators need **real alerts outside the process** — not in-memory simulation and not reserved-inactive labels for shipped channels.

---

## Customer value (Wave 5 exit — post-implementation)

After Wave 5 Closes (all packages N01…N04, post-implementation), an operator can:

- Connect Telegram and receive a real test message via Bot API
- Connect Email (SMTP) and shipped Slack/Discord/Teams/Push the same way, or see them honestly reserved
- Test each shipped channel and see success or vendor-visible failure
- Disconnect without SSH or `.env`
- Receive routed alerts from PC-06 through active transports
- Never use Telegram to start, stop, or approve trades
- Stay inside their workspace and authorization

---

## Consumes

| Product                              | How Wave 5 uses it                            | Must not do                     |
| ------------------------------------ | --------------------------------------------- | ------------------------------- |
| **Authentication**                   | Only signed-in operators use connect/test     | Parallel login                  |
| **Authorization**                    | Only permitted roles may connect / test       | New IAM                         |
| **Workspace Isolation**              | Notification credentials stay in workspace    | Cross-workspace convenience     |
| **Vault**                            | Retrieve credentials for adapter send only    | Duplicate store; echo plaintext |
| **Security Platform**                | Hardening and rate-limit defaults             | Fork platform controls          |
| **Security Audit**                   | Attributable connect/test/disconnect outcomes | Own the audit store             |
| **Connection Management**            | Operator UI for connect / test / disconnect   | Redesign facade ownership       |
| **Notification Durable Queue (O02)** | Delivery survives restart                     | Second queue / Outbox           |
| **PC-06 routing**                    | Route events to active transport              | Redesign routing SoT            |
| **PC-07 catalog**                    | Channel entries and status                    | Second catalog                  |
| **Notification Delivery port**       | Real adapter I/O                              | Second notification engine      |
| **Wave 4 Exchange Connectivity**     | Not consumed — unchanged                      | Modify exchange I/O             |

---

## Owns

### Wave 5 (wave-level)

| Outcome                                        | Customer meaning                         |
| ---------------------------------------------- | ---------------------------------------- |
| Real transport connect / test / disconnect     | Production Bot API, SMTP, webhooks, push |
| Honest Connected / Error / Expired labels      | No fake delivery                         |
| Reserved-inactive removed for shipped channels | Honest offered vs reserved UI            |
| PC-06 routing to active transport              | Alerts reach real channels               |
| Telegram delivery-only                         | Cannot start/stop/approve trades         |

### W5-N01 (first package)

| Outcome                                                 | Customer meaning                   |
| ------------------------------------------------------- | ---------------------------------- |
| Production Telegram Bot API connect / test / disconnect | Real `api.telegram.org` round-trip |
| Chat binding                                            | Test message reaches bound chat    |
| Honest Telegram transport status                        | No in-memory fake delivery         |

**Does not own a new notification product or routing engine.** Notification Delivery remains transport owner. PC-06 remains routing owner.

---

## Does NOT own

| Concern                                      | Real owner                     |
| -------------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption               | Vault                          |
| Identity / sessions                          | Authentication                 |
| Permissions                                  | Authorization                  |
| Workspace membership / isolation             | Workspace / Isolation          |
| Connection Management facade                 | Connection Management (Wave 2) |
| Notification routing                         | PC-06                          |
| Risk decisions                               | Risk Engine                    |
| Orders / live execution                      | Canonical Order Path / Wave 6  |
| Exchange I/O                                 | Exchange Adapter (Wave 4)      |
| Email / Slack / Discord / Teams / Push (N01) | V3-N02 / N03 / N04             |
| Live Trading                                 | Wave 6 + ADR                   |
| Ledger / money SoT                           | Ledger                         |

---

## IN Scope (Wave 5)

| Item                                | Customer meaning                       |
| ----------------------------------- | -------------------------------------- |
| V3-N01 Telegram Bot API             | Real connect / test / disconnect       |
| V3-N02 Email SMTP                   | Real SMTP transport when sequenced     |
| V3-N03 Slack / Discord / Teams      | Real webhook transports when sequenced |
| V3-N04 Push                         | Real push transport when sequenced     |
| Honest delivery rules               | Real transport round-trip required     |
| Workspace isolation                 | A↛B                                    |
| Authorization                       | Unauthorized deny                      |
| PC-06 routing integration           | Events reach active transport          |
| Security boundaries                 | Consume Wave 1–4                       |
| Audit interaction                   | Emit required connect outcomes         |
| Failure philosophy                  | Fail closed; no fake delivery          |
| Implementation slices (per package) | Named in planning only — not opened    |

---

## OUT OF Scope

| Item                                 | Why out             |
| ------------------------------------ | ------------------- |
| Live order submission                | Wave 6 + ADR        |
| Live Trading UI / session            | Wave 6              |
| Telegram command bus                 | Forbidden           |
| Exchange real I/O                    | Wave 4 (closed)     |
| Second notification routing product  | Forbidden           |
| Connection Management redesign       | Wave 2 COMPLETE     |
| Vault / Auth redesign                | Wave 1 CLOSED       |
| Wave 1–4 reopen                      | Forbidden           |
| Master Plan / V2 architecture change | Forbidden           |
| Wave 5 COMPLETE                      | PO after N01…N04    |
| Planning Review PASS / APPROVED      | Separate PO acts    |
| Implementation slices opened         | After Approval only |

---

## Honest Product rules

| Rule           | Binding statement                                         |
| -------------- | --------------------------------------------------------- |
| Real delivery  | Production transport round-trip succeeded                 |
| Not delivering | No token, failed test, provider error, or not implemented |
| Expired        | Provider reports invalid / expired credentials            |
| Telegram       | Delivery-only — never start/stop/approve trades           |
| Reserved       | Channel not shipped — honest label only                   |
| No simulation  | In-memory fake delivery forbidden for shipped channels    |

---

## Customer workflows

### Happy path (Telegram — W5-N01)

Sign in → Connections / Notifications → Telegram → vault bot token → Test → real message in chat → optional Disconnect.

### Failure paths

- No permission → denied (fail closed)
- Wrong workspace → denied
- Provider down → Error with honest message; not Delivering
- Invalid token → Expired label; not Connected
- Telegram command to trade → rejected / ignored (control plane forbidden)

---

## Failure philosophy

Fail closed. Never show real delivery without transport evidence. Never allow Telegram to control trades. When provider unavailable, show degraded/error — do not fake success.

---

## Acceptance criteria (Wave 5 exit)

| #   | Criterion (Master Plan)                                | Evidence at Wave Close  |
| --- | ------------------------------------------------------ | ----------------------- |
| 1   | Telegram connect binds real chat; test sends message   | N01 Close               |
| 2   | Email/Slack/Discord/Teams/Push connect/test/disconnect | N02–N04 Close (shipped) |
| 3   | Reserved-inactive gone for shipped channels            | Catalog honesty         |
| 4   | PC-06 routing delivers to active transport             | Integration tests       |
| 5   | Telegram cannot start/stop/approve trades              | Conformance tests       |
| 6   | Workspace isolation holds                              | Automated tests         |
| 7   | No plaintext secret echo                               | Security Review         |

---

## Explicit non-claims

- Wave 5 COMPLETE — **not claimed**
- W5-N01 APPROVED — **not claimed**
- Live Trading — **not claimed**
- Telegram control plane — **not claimed**
- All channels shipped — **not claimed** (unshipped stay reserved)

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review.
