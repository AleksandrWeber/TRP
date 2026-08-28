# W4-E03 Product Scope

**Package:** W4-E03 OKX Real I/O
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E03 · CM-09
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w4-e03-implementation-package.md`](./w4-e03-implementation-package.md)
**Overview:** [`w4-e03-overview.md`](./w4-e03-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W4-E03. It does not redesign Version 2 Exchange domains. It does not invent an engine clone. It does not reopen Wave 1–3 or W4-E01 / W4-E02. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 4 COMPLETE.

**Naming clarity:** `W4-E03` is the operational package ID for Master Plan / Execution Roadmap **V3-E03**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for CM-09.

---

## Product purpose

OKX Real I/O is the product package that defines how operators **connect, test, and disconnect OKX against the real venue** using vault-backed credentials (key, secret, passphrase) through the existing Exchange Adapter factory.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own Cluster identity or Exchange Scope isolation rules.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own Kraken I/O (E04).

```text
Exchange Adapter factory owns venue protocol I/O.
Vault owns credentials.
Connection Management facade owns the operator connect product surface.
W4-E03 owns real OKX connect/test/disconnect outcomes (CM-09).
Connected ≠ Live Trading.
Paper remains default.
```

---

## Why OKX Real I/O exists (business language)

Wave 2 closed Connection Management and collected exchange credentials for catalog venues including OKX (with passphrase). W4-E01 and W4-E02 closed Binance and Bybit exchange connectivity foundations. Master Plan defers third-venue I/O honesty to **V3-E03**.

Operators need **Connected** for OKX to mean the venue answered — not credential collection alone and not simulation.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- Test OKX with vault-stored credentials and see a real vendor result
- See Connected only when the venue answered
- See expired credentials and permission problems when the vendor reports them
- Disconnect without SSH or `.env`
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package
- Never need to infer OKX venue status from stub adapter state

---

## Consumes

| Product                            | How this package uses it                       | Must not do                      |
| ---------------------------------- | ---------------------------------------------- | -------------------------------- |
| **Authentication**                 | Only signed-in operators use connect/test      | Parallel login                   |
| **Authorization**                  | Only permitted roles may connect / test        | New IAM                          |
| **Workspace Isolation**            | OKX credentials and state stay in workspace    | Cross-workspace convenience      |
| **Vault**                          | Retrieve credentials for adapter I/O only      | Duplicate store; echo plaintext  |
| **Security Platform**              | Hardening and rate-limit defaults              | Fork platform controls           |
| **Security Audit**                 | Attributable connect/test/disconnect outcomes  | Own the audit store              |
| **Connection Management**          | Operator UI for connect / test / disconnect    | Redesign facade ownership        |
| **Exchange Adapter factory (OKX)** | Real vendor I/O                                | Engine clone; second order path  |
| **Exchange Scope / Cluster**       | Isolation boundary                             | Redefine cluster identity        |
| **W4-E01 / W4-E02 foundation**     | Durable/recovery/continuity patterns (consume) | Redesign E01/E02 owner artifacts |
| **Wave 3 foundations**             | Kill switch / monitoring context (consume)     | Redesign O03–O05                 |

---

## Owns

| Outcome                                                | Customer meaning                         |
| ------------------------------------------------------ | ---------------------------------------- |
| Real OKX connect / test / disconnect                   | Vendor round-trip with vault credentials |
| Honest Connected / Error / Expired / permission labels | No fake Connected                        |
| OKX connection status for workspace                    | Operator-visible venue truth             |
| Attributable exchange-connect outcomes                 | Emit to Security Audit where required    |

**Does not own a new exchange product or engine.** Exchange Adapter factory remains protocol owner.

---

## Does NOT own

| Concern                          | Real owner                     |
| -------------------------------- | ------------------------------ |
| Secret ciphertext / encryption   | Vault                          |
| Identity / sessions              | Authentication                 |
| Permissions                      | Authorization                  |
| Workspace membership / isolation | Workspace / Isolation          |
| Connection Management facade     | Connection Management (Wave 2) |
| Cluster identity                 | Exchange Scope / Cluster       |
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| Binance Real I/O                 | V3-E01 (CLOSED)                |
| Bybit Real I/O                   | V3-E02 (CLOSED)                |
| Kraken adapter                   | V3-E04                         |
| Venue permission verification    | V3-E05                         |
| Live Trading                     | Wave 6 + ADR                   |
| Ledger / money SoT               | Ledger                         |

---

## IN Scope

| Item                             | Customer meaning                      |
| -------------------------------- | ------------------------------------- |
| OKX adapter inventory            | Known stub vs real surfaces           |
| Real connect / test / disconnect | Vault-backed vendor round-trip        |
| Honest Connected rules           | Connected only after real round-trip  |
| Expired / permission visibility  | Vendor-reported problems shown        |
| Disconnect                       | Operator can disconnect without SSH   |
| Workspace isolation              | A↛B                                   |
| Authorization                    | Unauthorized deny                     |
| Operator walkthrough             | OKX Real I/O Walkthrough              |
| Security boundaries              | Consume Wave 1–3 and W4-E01/E02       |
| Audit interaction                | Emit required connect outcomes        |
| Failure philosophy               | Fail closed; no fake Connected        |
| Validation strategy              | Close criteria, evidence, regressions |
| Implementation slices (a–e)      | Named in planning only — not opened   |

---

## OUT OF Scope

| Item                                 | Why out             |
| ------------------------------------ | ------------------- |
| Live order submission                | Wave 6 + ADR        |
| Live Trading UI / session            | Wave 6              |
| Kraken real I/O                      | V3-E04              |
| Venue permission verification        | V3-E05              |
| Engine clone per venue               | Forbidden           |
| Second Canonical Order Path          | Forbidden           |
| Connection Management redesign       | Wave 2 COMPLETE     |
| W4-E01 / W4-E02 reopen / redesign    | CLOSED              |
| Vault / Auth redesign                | Wave 1 CLOSED       |
| Wave 1 / Wave 2 / Wave 3 reopen      | Forbidden           |
| Master Plan / V2 architecture change | Forbidden           |
| Wave 4 COMPLETE                      | PO after E01…E05    |
| Planning Review PASS / APPROVED      | Separate PO acts    |
| Implementation slices opened         | After Approval only |

---

## Honest Product rules

| Rule               | Binding statement                                       |
| ------------------ | ------------------------------------------------------- |
| Connected          | Real vendor round-trip succeeded with vault credentials |
| Not Connected      | No keys, failed test, vendor error, or not implemented  |
| Expired            | Vendor reports invalid / expired credentials            |
| Permission problem | Vendor reports insufficient permissions                 |
| Paper default      | Product does not claim live capital trading             |
| No simulation      | Stub CONNECTED without round-trip forbidden             |

---

## Customer workflows

### Happy path

Sign in → Connections → OKX → vault credentials present → Test → Connected → optional Disconnect.

### Failure paths

- No permission → denied (fail closed)
- Wrong workspace → denied
- Vendor down → Error with honest message; not Connected
- Expired key → Expired label; not Connected
- Missing passphrase → validation refused; not Connected
- Insufficient permissions → permission problem visible; not Connected

---

## Failure philosophy

Fail closed. Never show Connected without vendor evidence. Never claim Live Trading. When venue unavailable, show degraded/error — do not fake success.

---

## Acceptance criteria

| #   | Criterion                                              | Evidence at Close         |
| --- | ------------------------------------------------------ | ------------------------- |
| 1   | Real OKX round-trip on connect/test                    | Integration + walkthrough |
| 2   | Honest Connected / Error / Expired / permission labels | UI + product review       |
| 3   | No Connected without keys or without round-trip        | Conformance tests         |
| 4   | Workspace isolation                                    | Security tests            |
| 5   | No plaintext secret echo                               | Security Verification     |
| 6   | No Live Trading / live order claims                    | Product review            |
| 7   | No engine clone; factory extension only                | Architecture review       |
| 8   | Wave 1–3 and W4-E01/E02 boundaries preserved           | Regression                |

---

## Implementation slices (planning only)

| Slice | Name                                  | Scope summary                             |
| ----- | ------------------------------------- | ----------------------------------------- |
| a     | OKX inventory & honesty baseline      | Stub vs real; Connected rules for OKX     |
| b     | Durable OKX exchange connectivity     | Persist anchors on exchange-adapter owner |
| c     | OKX restart recovery                  | Hydrate after normal restart              |
| d     | OKX operational continuity foundation | Platform Readiness projection for OKX     |
| e     | Close evidence                        | Validation + PO review                    |

**Not opened.** Not approved for implementation.

---

## Explicit non-goals

- Engine clone per venue
- Second exchange connectivity subsystem
- Duplicate persistence owner
- Live Trading or live order submission
- Exchange Connectivity Complete from E03 alone
- Wave 4 COMPLETE from E03 alone
- Kraken adapter delivery (E04)
- Venue permission verification product (E05)
- Master Plan revision
- Version 2 architecture redesign

---

## Explicit non-claims

- W4-E03 Planning APPROVED — **not claimed**
- W4-E03 Planning Review PASS — **not claimed**
- W4-E03-a opened — **not claimed**
- W4-E03 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Live Trading — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- OKX Connected — **not claimed**
- Kraken connected — **not claimed**
- Implementation started — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review.
