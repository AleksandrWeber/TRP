# W4-E04 Product Scope

**Package:** W4-E04 Kraken Adapter (factory)
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E04 · CM-10
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w4-e04-implementation-package.md`](./w4-e04-implementation-package.md)
**Overview:** [`w4-e04-overview.md`](./w4-e04-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W4-E04. It does not redesign Version 2 Exchange domains. It does not invent an engine clone. It does not reopen Wave 1–3 or W4-E01 / W4-E02 / W4-E03. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 4 COMPLETE.

**Naming clarity:** `W4-E04` is the operational package ID for Master Plan / Execution Roadmap **V3-E04**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap / inventory for CM-10.

---

## Product purpose

Kraken Adapter (factory) is the product package that defines how Kraken is **offered as a real factory adapter or honestly not offered**, and when offered how operators **connect, test, and disconnect Kraken against the real venue** using vault-backed credentials through the existing Exchange Adapter factory.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own Cluster identity or Exchange Scope isolation rules.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own venue permission verification (E05).

```text
Exchange Adapter factory owns venue protocol I/O.
Vault owns credentials.
Connection Management facade owns the operator connect product surface.
W4-E04 owns Kraken factory registration and connect/test/disconnect outcomes (when offered) (CM-10).
Connected ≠ Live Trading.
Paper remains default.
Honest not-offered when adapter not delivered.
```

---

## Why Kraken Adapter (factory) exists (business language)

Wave 2 closed Connection Management and collected exchange credentials for catalog venues. W4-E01, W4-E02, and W4-E03 closed Binance, Bybit, and OKX exchange connectivity foundations. Master Plan defers Kraken factory adapter to **V3-E04**.

`kraken` exists as an Exchange Scope catalog label with no adapter, REST, or WS client. Operators need either **Connected** for Kraken to mean the venue answered, or an honest **not offered** label — not a silent catalog label alone.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See Kraken honestly offered or honestly not offered
- When offered: test Kraken with vault-stored credentials and see a real vendor result
- When offered: see Connected only when the venue answered
- When offered: see expired credentials and permission problems when the vendor reports them
- When offered: disconnect without SSH or `.env`
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package
- Never infer Kraken availability from catalog label alone

---

## Consumes

| Product                                 | How this package uses it                       | Must not do                          |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| **Authentication**                      | Only signed-in operators use connect/test      | Parallel login                       |
| **Authorization**                       | Only permitted roles may connect / test        | New IAM                              |
| **Workspace Isolation**                 | Kraken credentials and state stay in workspace | Cross-workspace convenience          |
| **Vault**                               | Retrieve credentials for adapter I/O only      | Duplicate store; echo plaintext      |
| **Security Platform**                   | Hardening and rate-limit defaults              | Fork platform controls               |
| **Security Audit**                      | Attributable connect/test/disconnect outcomes  | Own the audit store                  |
| **Connection Management**               | Operator UI for connect / test / disconnect    | Redesign facade ownership            |
| **Exchange Adapter factory**            | Kraken factory registration and vendor I/O     | Engine clone; second order path      |
| **Exchange Scope / Cluster**            | Isolation boundary                             | Redefine cluster identity            |
| **W4-E01 / W4-E02 / W4-E03 foundation** | Durable/recovery/continuity patterns (consume) | Redesign E01/E02/E03 owner artifacts |
| **Wave 3 foundations**                  | Kill switch / monitoring context (consume)     | Redesign O03–O05                     |

---

## Owns

| Outcome                                                | Customer meaning                            |
| ------------------------------------------------------ | ------------------------------------------- |
| Kraken factory adapter registration (when offered)     | First label-only venue through factory      |
| Honest not-offered (when adapter not delivered)        | Clear product language — no silent omission |
| Real Kraken connect / test / disconnect (when offered) | Vendor round-trip with vault credentials    |
| Honest Connected / Error / Expired / permission labels | No fake Connected                           |
| Kraken connection status for workspace (when offered)  | Operator-visible venue truth                |
| Attributable exchange-connect outcomes                 | Emit to Security Audit where required       |

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
| OKX Real I/O                     | V3-E03 (CLOSED)                |
| Venue permission verification    | V3-E05                         |
| Live Trading                     | Wave 6 + ADR                   |
| Ledger / money SoT               | Ledger                         |

---

## IN Scope

| Item                             | Customer meaning                                       |
| -------------------------------- | ------------------------------------------------------ |
| Kraken adapter inventory         | Known catalog vs factory surfaces                      |
| Factory adapter registration     | Kraken through Exchange Adapter factory (when offered) |
| Honest not-offered               | Clear label when adapter not delivered                 |
| Real connect / test / disconnect | Vault-backed vendor round-trip (when offered)          |
| Honest Connected rules           | Connected only after real round-trip (when offered)    |
| Expired / permission visibility  | Vendor-reported problems shown (when offered)          |
| Disconnect                       | Operator can disconnect without SSH (when offered)     |
| Workspace isolation              | A↛B                                                    |
| Authorization                    | Unauthorized deny                                      |
| Operator walkthrough             | Kraken Adapter (factory) Walkthrough                   |
| Security boundaries              | Consume Wave 1–3 and W4-E01/E02/E03                    |
| Audit interaction                | Emit required connect outcomes                         |
| Failure philosophy               | Fail closed; no fake Connected                         |
| Validation strategy              | Close criteria, evidence, regressions                  |
| Implementation slices (a–e)      | Named in planning only — not opened                    |

---

## OUT OF Scope

| Item                                 | Why out             |
| ------------------------------------ | ------------------- |
| Live order submission                | Wave 6 + ADR        |
| Live Trading UI / session            | Wave 6              |
| Venue permission verification        | V3-E05              |
| Engine clone per venue               | Forbidden           |
| Second Canonical Order Path          | Forbidden           |
| Connection Management redesign       | Wave 2 COMPLETE     |
| W4-E01 / W4-E02 / W4-E03 reopen      | CLOSED              |
| Vault / Auth redesign                | Wave 1 CLOSED       |
| Wave 1 / Wave 2 / Wave 3 reopen      | Forbidden           |
| Master Plan / V2 architecture change | Forbidden           |
| Wave 4 COMPLETE                      | PO after E01…E05    |
| Planning Review PASS / APPROVED      | Separate PO acts    |
| Implementation slices opened         | After Approval only |

---

## Honest Product rules

| Rule               | Binding statement                                                      |
| ------------------ | ---------------------------------------------------------------------- |
| Connected          | Real vendor round-trip succeeded with vault credentials (when offered) |
| Not offered        | Adapter not delivered — honest label; no fake Connected                |
| Not Connected      | No keys, failed test, vendor error, or not implemented (when offered)  |
| Expired            | Vendor reports invalid / expired credentials (when offered)            |
| Permission problem | Vendor reports insufficient permissions (when offered)                 |
| Paper default      | Product does not claim live capital trading                            |
| No simulation      | Stub CONNECTED without round-trip forbidden                            |

---

## Customer workflows

### Happy path (when offered)

Sign in → Connections → Kraken → vault credentials present → Test → Connected → optional Disconnect.

### Honest not-offered path

Sign in → Connections → Kraken → honest not-offered label → no fake Connected → no implied live trading.

### Failure paths (when offered)

- No permission → denied (fail closed)
- Wrong workspace → denied
- Vendor down → Error with honest message; not Connected
- Expired key → Expired label; not Connected
- Insufficient permissions → permission problem visible; not Connected

---

## Failure philosophy

Fail closed. Never show Connected without vendor evidence. Never claim Live Trading. When venue unavailable, show degraded/error — do not fake success. When adapter not delivered, show honest not-offered — do not fake availability.

---

## Acceptance criteria

| #   | Criterion                                                 | Evidence at Close         |
| --- | --------------------------------------------------------- | ------------------------- |
| 1   | Kraken factory adapter registered or honestly not offered | Integration + walkthrough |
| 2   | Real Kraken round-trip on connect/test (when offered)     | Integration + walkthrough |
| 3   | Honest Connected / Error / Expired / permission labels    | UI + product review       |
| 4   | No Connected without keys or without round-trip           | Conformance tests         |
| 5   | Workspace isolation                                       | Security tests            |
| 6   | No plaintext secret echo                                  | Security Verification     |
| 7   | No Live Trading / live order claims                       | Product review            |
| 8   | No engine clone; factory extension only                   | Architecture review       |
| 9   | Wave 1–3 and W4-E01/E02/E03 boundaries preserved          | Regression                |

---

## Implementation slices (planning only)

| Slice | Name                                     | Scope summary                                     |
| ----- | ---------------------------------------- | ------------------------------------------------- |
| a     | Kraken inventory & honesty baseline      | Catalog vs factory; Connected / not-offered rules |
| b     | Durable Kraken exchange connectivity     | Persist anchors on exchange-adapter owner         |
| c     | Kraken restart recovery                  | Hydrate after normal restart                      |
| d     | Kraken operational continuity foundation | Platform Readiness projection for Kraken          |
| e     | Close evidence                           | Validation + PO review                            |

**Not opened.** Not approved for implementation.

---

## Explicit non-goals

- Engine clone per venue
- Second exchange connectivity subsystem
- Duplicate persistence owner
- Live Trading or live order submission
- Exchange Connectivity Complete from E04 alone
- Wave 4 COMPLETE from E04 alone
- Venue permission verification product (E05)
- Master Plan revision
- Version 2 architecture redesign

---

## Explicit non-claims

- W4-E04 Planning APPROVED — **not claimed**
- W4-E04 Planning Review PASS — **not claimed**
- W4-E04-a opened — **not claimed**
- W4-E04 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Live Trading — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Kraken Connected — **not claimed**
- Implementation started — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review.
