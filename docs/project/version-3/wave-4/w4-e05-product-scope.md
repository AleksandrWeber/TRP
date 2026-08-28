# W4-E05 Product Scope

**Package:** W4-E05 Venue Permission Verification
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E05 · feeds LT-02 later
**Status:** Planning **OPEN**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w4-e05-implementation-package.md`](./w4-e05-implementation-package.md)
**Overview:** [`w4-e05-overview.md`](./w4-e05-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W4-E05. It does not redesign Version 2 Exchange domains. It does not invent an engine clone. It does not reopen Wave 1–3 or W4-E01 / W4-E02 / W4-E03 / W4-E04. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 4 COMPLETE.

**Naming clarity:** `W4-E05` is the operational package ID for Master Plan / Execution Roadmap **V3-E05**. This scope does not invent capabilities absent from Master Plan / Execution Roadmap.

---

## Product purpose

Venue Permission Verification is the product package that defines how **vendor-reported permissions** are verified, persisted, and displayed across catalog crypto venues — replacing hardcoded or stub `apiPermissions` defaults with real venue permission probes through the existing Exchange Adapter factory.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own Cluster identity or Exchange Scope isolation rules.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-venue Real I/O product outcomes (E01–E04).

```text
Exchange Adapter factory owns venue protocol I/O and permission probes.
Vault owns credentials.
Connection Management facade owns the operator connect product surface.
W4-E05 owns cross-venue permission verification outcomes (V3-E05).
Permission verified ≠ Live Trading.
Paper remains default.
Hardcoded defaults ≠ vendor-verified permissions.
```

---

## Why Venue Permission Verification exists (business language)

Wave 2 closed Connection Management and collected exchange credentials for catalog venues. W4-E01, W4-E02, W4-E03, and W4-E04 closed per-venue exchange connectivity foundations. Master Plan defers cross-venue venue permission verification to **V3-E05**.

Today `ExchangeManager.readApiPermissions()` returns hardcoded `['spot.read', 'spot.trade']` when adapters lack `apiPermissions()`. Operators need **vendor-verified permissions** — not defaults presented as truth. CM-04 Health Monitoring depends on venue permission APIs from Wave 4. Wave 6 live gate requires real venue permissions per Security Vision.

---

## Customer value

After this package Closes (post-implementation), an operator can:

- See vendor-reported permissions for connected catalog venues
- Distinguish verified permissions from hardcoded defaults
- See expired credentials and permission problems when the vendor reports them
- See insufficient permissions honestly — not masked as Connected
- Stay inside their workspace and authorization
- Never receive Live Trading or live order submission from this package
- Never infer live readiness from hardcoded permission labels

---

## Consumes

| Product                      | How this package uses it                        | Must not do                      |
| ---------------------------- | ----------------------------------------------- | -------------------------------- |
| **Authentication**           | Only signed-in operators view permission state  | Parallel login                   |
| **Authorization**            | Only permitted roles trigger permission probes  | New IAM                          |
| **Workspace Isolation**      | Permission state stays in workspace             | Cross-workspace convenience      |
| **Vault**                    | Retrieve credentials for permission probes only | Duplicate store; echo plaintext  |
| **Security Platform**        | Hardening and rate-limit defaults               | Fork platform controls           |
| **Security Audit**           | Attributable permission verification outcomes   | Own the audit store              |
| **Connection Management**    | Operator UI for permission visibility           | Redesign facade ownership        |
| **Exchange Adapter factory** | Cross-venue permission probe I/O                | Engine clone; second order path  |
| **Exchange Scope / Cluster** | Isolation boundary                              | Redefine cluster identity        |
| **W4-E01…E04 foundation**    | Durable/recovery/continuity patterns (consume)  | Redesign E01…E04 owner artifacts |
| **Wave 3 foundations**       | Kill switch / monitoring context (consume)      | Redesign O03–O05                 |

---

## Owns

| Outcome                                               | Customer meaning                              |
| ----------------------------------------------------- | --------------------------------------------- |
| Cross-venue permission verification                   | Real vendor permission probe across venues    |
| Vendor-reported permission labels                     | `spot.trade` from venue — not hardcoded       |
| Honest Expired / insufficient-permission labels       | No fake permission health                     |
| Workspace-scoped permission state                     | Operator-visible permission truth             |
| CM-04 venue permission API dependency (package scope) | Health monitoring can consume permission APIs |
| Attributable permission verification outcomes         | Emit to Security Audit where required         |

**Does not own a new exchange product or engine.** Exchange Adapter factory remains protocol owner.

---

## Does NOT own

| Concern                          | Real owner                     |
| -------------------------------- | ------------------------------ |
| Secret ciphertext / encryption   | Vault                          |
| Identity / sessions              | Authentication                 |
| Permissions (IAM)                | Authorization                  |
| Workspace membership / isolation | Workspace / Isolation          |
| Connection Management facade     | Connection Management (Wave 2) |
| Cluster identity                 | Exchange Scope / Cluster       |
| Risk decisions                   | Risk Engine                    |
| Orders / live execution          | Canonical Order Path / Wave 6  |
| Binance Real I/O                 | V3-E01 (CLOSED)                |
| Bybit Real I/O                   | V3-E02 (CLOSED)                |
| OKX Real I/O                     | V3-E03 (CLOSED)                |
| Kraken Adapter (factory)         | V3-E04 (CLOSED)                |
| Live Trading                     | Wave 6 + ADR                   |
| Ledger / money SoT               | Ledger                         |

---

## IN Scope

| Item                                | Customer meaning                                |
| ----------------------------------- | ----------------------------------------------- |
| Venue permission inventory          | Known permission surfaces across catalog venues |
| Cross-venue permission verification | Real vendor permission probe through factory    |
| Vendor-reported permission labels   | Honest permissions from venue — not defaults    |
| Expired / permission visibility     | Vendor-reported problems shown                  |
| Workspace isolation                 | A↛B                                             |
| Authorization                       | Unauthorized deny                               |
| Operator walkthrough                | Venue Permission Verification Walkthrough       |
| Security boundaries                 | Consume Wave 1–3 and W4-E01…E04                 |
| Audit interaction                   | Emit required permission outcomes               |
| Failure philosophy                  | Fail closed; no fake permission labels          |
| Validation strategy                 | Close criteria, evidence, regressions           |
| Implementation slices (a–e)         | Named in planning only — not opened             |

---

## OUT OF Scope

| Item                                     | Why out                                |
| ---------------------------------------- | -------------------------------------- |
| Live order submission                    | Wave 6 + ADR                           |
| Live Trading UI / session                | Wave 6                                 |
| Per-venue Real I/O product outcomes      | V3-E01…E04                             |
| Engine clone per venue                   | Forbidden                              |
| Second Canonical Order Path              | Forbidden                              |
| Connection Management redesign           | Wave 2 COMPLETE                        |
| W4-E01 / W4-E02 / W4-E03 / W4-E04 reopen | CLOSED                                 |
| Vault / Auth redesign                    | Wave 1 CLOSED                          |
| Wave 1 / Wave 2 / Wave 3 reopen          | Forbidden                              |
| Master Plan / V2 architecture change     | Forbidden                              |
| Wave 4 COMPLETE                          | PO after E05 Close + Completion Review |
| Planning Review PASS / APPROVED          | Separate PO acts                       |
| Implementation slices opened             | After Approval only                    |

---

## Honest Product rules

| Rule                | Binding statement                                             |
| ------------------- | ------------------------------------------------------------- |
| Permission verified | Real vendor permission probe succeeded with vault credentials |
| Hardcoded default   | Must not be presented as vendor-verified permission           |
| Not verified        | No probe, failed probe, vendor error, or not implemented      |
| Expired             | Vendor reports invalid / expired credentials                  |
| Permission problem  | Vendor reports insufficient permissions                       |
| Paper default       | Product does not claim live capital trading                   |
| No simulation       | Stub permissions without vendor probe forbidden               |

---

## Customer workflows

### Happy path

Sign in → Connections → select connected catalog venue → view vendor-reported permissions → permission health visible.

### Failure paths

- No permission → denied (fail closed)
- Wrong workspace → denied
- Vendor down → Error with honest message; permission state not fabricated
- Expired key → Expired label
- Insufficient permissions → permission problem visible

---

## Failure philosophy

Fail closed. Never show vendor-verified permission labels without vendor probe evidence. Never claim Live Trading. When venue unavailable, show degraded/error — do not fake permission health. When permission probe not yet implemented for a venue, show honest unverified state — do not present hardcoded defaults as verified.

---

## Acceptance criteria

| #   | Criterion                                                | Evidence at Close         |
| --- | -------------------------------------------------------- | ------------------------- |
| 1   | Vendor-reported permissions for connected catalog venues | Integration + walkthrough |
| 2   | Real permission probe on verification                    | Integration + walkthrough |
| 3   | Honest Expired / permission problem labels               | UI + product review       |
| 4   | No hardcoded defaults presented as verified              | Conformance tests         |
| 5   | Workspace isolation                                      | Security tests            |
| 6   | No plaintext secret echo                                 | Security Verification     |
| 7   | No Live Trading / live order claims                      | Product review            |
| 8   | No engine clone; factory extension only                  | Architecture review       |
| 9   | Wave 1–3 and W4-E01…E04 boundaries preserved             | Regression                |

---

## Implementation slices (planning only)

| Slice | Name                                          | Scope summary                                |
| ----- | --------------------------------------------- | -------------------------------------------- |
| a     | Venue permission inventory & honesty baseline | Permission surfaces; honest default rules    |
| b     | Durable venue permission verification         | Persist anchors on exchange-adapter owner    |
| c     | Venue permission restart recovery             | Hydrate after normal restart                 |
| d     | Venue permission operational continuity       | Platform Readiness / CM-04 health projection |
| e     | Close evidence                                | Validation + PO review                       |

**Not opened.** Not approved for implementation.

---

## Explicit non-goals

- Engine clone per venue
- Second exchange connectivity or permission subsystem
- Duplicate persistence owner
- Live Trading or live order submission
- Exchange Connectivity Complete from E05 alone
- Wave 4 COMPLETE from E05 alone
- Per-venue Real I/O product outcomes (E01–E04 reopen)
- Master Plan revision
- Version 2 architecture redesign

---

## Explicit non-claims

- W4-E05 Planning APPROVED — **not claimed**
- W4-E05 Planning Review PASS — **not claimed**
- W4-E05-a opened — **not claimed**
- W4-E05 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Venue Permission Verification Complete — **not claimed**
- Live Trading — **not claimed**
- Implementation started — **not claimed**

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review.
