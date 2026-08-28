# W4-E04 Kraken Adapter (factory) — Implementation Package

```text
Package:            W4-E04
Name:               Kraken Adapter (factory)
Also known as:      V3-E04 · CM-10
Wave:               4 — Exchange Connectivity
Master Plan map:    V3-E04 Kraken adapter (factory) (CM-10).
                    Wave 4 exit: Kraken offered as real factory adapter or honestly not offered;
                    Connected means the venue answered when offered; paper remains default.
Date:               2026-08-28
Status:             Implementation Package — Planning OPEN. Awaiting Product Owner Review.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)

**Companions:**

| Document                                                     | Role                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| [`w4-e04-product-scope.md`](./w4-e04-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w4-e04-security-review.md`](./w4-e04-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w4-e04-validation-plan.md`](./w4-e04-validation-plan.md)   | How Close is proven                                   |
| [`w4-e04-overview.md`](./w4-e04-overview.md)                 | Operator / PO language product                        |
| [`w4-e04-planning-summary.md`](./w4-e04-planning-summary.md) | Package planning open record                          |
| [`wave-4-progress.md`](./wave-4-progress.md)                 | Wave 4 package status                                 |

**Prerequisites:**

| Prerequisite                   | Status                                       |
| ------------------------------ | -------------------------------------------- |
| Version 2                      | **CERTIFIED**                                |
| Wave 1 Security Foundation     | **CERTIFIED COMPLETE**                       |
| Wave 2 Connection Management   | **COMPLETE** (consumed; not redesigned)      |
| Wave 3 Durability & Operations | **COMPLETE** (consumed; not redesigned)      |
| W4-E01 Binance Real I/O        | **CLOSED** by Product Owner (2026-08-28)     |
| W4-E02 Bybit Real I/O          | **CLOSED** by Product Owner (2026-08-28)     |
| W4-E03 OKX Real I/O            | **CLOSED** by Product Owner (2026-08-28)     |
| Vault                          | **CLOSED** / available                       |
| Exchange Adapter factory       | Exists (no Kraken adapter)                   |
| Exchange Scope / RC-27         | Exists (`kraken` catalog label)              |
| Master Plan                    | **FROZEN** — this package does not revise it |
| Security Verification Standard | **Approved** (mandatory at Close)            |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-E04 Kraken adapter (factory)** (CM-10). Architecture rule: major extension of Exchange Adapter I/O — **replace nothing** in Risk, Orders, or Ledger. **W4-E04 extends the existing Exchange Adapter factory only; it introduces no engine clone and no new order path.** W4-E01, W4-E02, and W4-E03 foundation patterns are consumed — not redesigned. Wave 1–3 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Kraken Adapter (factory) consumes Vault, Connection Management, Exchange Adapter factory, and W4-E01/E02/E03 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver venue permission verification (E05).
Connected ≠ Live Trading. Paper remains default.
STOP — Do not create W4-E04-a until Product Owner Approves planning.
```

**Planning status:** **OPEN for review.** Product Owner must review and Approve before any implementation.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (Planning OPEN)
        ↓
Review                   ← not performed
        ↓
Approval                 ← not granted
        ↓
Implementation           ← forbidden until Approval + PO slice task
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close
```

---

## Overview

W4-E04 opens **Kraken Adapter (factory)**. It is the product package that delivers Kraken as a real factory adapter — the first catalog label with no existing client — or honestly declares Kraken not offered. When offered, connect / test / disconnect uses vault-backed credentials through the existing Exchange Adapter factory. **Connected** means the venue answered. Paper execution remains the default. Live order submission to capital remains blocked until Wave 6.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 operational foundations, Closed W4-E01, W4-E02, and W4-E03 exchange connectivity foundation patterns, and the existing Exchange Scope / adapter factory. It does not invent a second engine per venue or a parallel order path.

| Field                           | Value                                                |
| ------------------------------- | ---------------------------------------------------- |
| Package ID                      | W4-E04                                               |
| Master Plan / Execution Roadmap | **V3-E04** Kraken adapter (factory)                  |
| Product name                    | Kraken Adapter (factory)                             |
| Wave                            | 4 — Exchange Connectivity                            |
| Capabilities (inventory IDs)    | **CM-10**                                            |
| Complexity                      | L                                                    |
| Previous                        | W4-E03 **CLOSED**                                    |
| Next after W4-E04 Close         | W4-E05 Venue Permission Verification (PO sequencing) |

---

## Business Goal

- **Goal:** Kraken is offered as a real factory adapter with honest connect / test / disconnect, or honestly declared not offered. When offered, Connected means the venue answered. Expired or missing permissions are visible.
- **Honesty:** **Connected** means a real vendor round-trip succeeded. It does **not** mean Live Trading, live order submission, Wave 4 COMPLETE, or Exchange Connectivity Complete.
- **Master Plan reference:** Wave 4 customer-observable — fourth catalog venue through the factory without engine clone (RC-27). Execution Roadmap V3-E04 / CM-10. “Markets as plugins” proof for a label-only venue.
- **Metric:** Time to connect Kraken **< 3 min** (when offered); simulated Connected without keys **0 tolerated**; cross-workspace secret leak **0 tolerated**; honest not-offered when adapter not delivered.

---

## Customer Problem

- **Problem:** `kraken` exists in Exchange Scope with `liveAdapter: false`. No Kraken adapter, REST client, or WS client exists. Operators cannot connect, test, or disconnect Kraken. Product Owner cannot advance Wave 4 beyond E03 while Kraken remains label-only without honest product language.
- **Who feels it:** Trading operators who need honest fourth-venue status; workspace admins who may store Kraken keys in Wave 2; Product Owner who cannot complete Wave 4 exchange catalog honesty without V3-E04.
- **What they must do today that they should not:** Infer Kraken availability from catalog label alone; assume Kraken works like Binance/Bybit/OKX without factory registration; trust simulated state for a venue with no adapter.

---

## Business Value

- **Value delivered at W4-E04 Close (after implementation):** Kraken factory adapter registered (when offered) with real connect / test / disconnect; honest Connected / Error / Expired / permission labels; honest not-offered when adapter not delivered; paper remains default; CM-10 Kraken connectivity advanced for package scope.
- **What remains blocked until later packages / waves:** Venue permission verification product (E05); Wave 4 COMPLETE; Wave 5 notifications; Wave 6 live capital.

---

## Current State

| Capability or surface                  | Status       | Evidence                           |
| -------------------------------------- | ------------ | ---------------------------------- |
| Wave 1 vault                           | CLOSED       | V3-S03                             |
| Wave 2 credential collection           | COMPLETE     | W2-S01                             |
| W4-E01 foundation                      | CLOSED       | PO Close 2026-08-28                |
| W4-E02 foundation                      | CLOSED       | PO Close 2026-08-28                |
| W4-E03 foundation                      | CLOSED       | PO Close 2026-08-28                |
| `kraken` Exchange Scope label          | Catalog only | `liveAdapter: false`               |
| Kraken adapter / REST / WS             | Not exists   | No client                          |
| Binance / Bybit / OKX product outcomes | Deferred     | W4-E01 / E02 / E03 foundation only |
| Venue permission verification          | Out          | V3-E05                             |
| Live order submission                  | Out          | Wave 6 + ADR                       |
| Honest Connected / not-offered rules   | Partial      | This package                       |

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit; Connection Management facade; Exchange Scope; Canonical Order Path; Risk; Ledger |
| Minor extension | Connection status surfaces; operational continuity projection for Kraken (when offered)                                                                                        |
| Major extension | Exchange Adapter Kraken factory registration and real I/O (when offered)                                                                                                       |
| New justified   | Nothing. Master Plan already named V3-E04. Factory adapter is extension — not a new product.                                                                                   |
| Replace         | **Nothing** on Risk, Orders, Ledger, Runtime evaluator, Library                                                                                                                |

| Area                 | Owner                    | This package must not own    |
| -------------------- | ------------------------ | ---------------------------- |
| Customer credentials | Vault                    | Ciphertext / encryption keys |
| Connection UI facade | Connection Management    | Venue protocol rewrite       |
| Venue protocol I/O   | Exchange Adapter factory | Cluster identity, Risk       |
| Cluster isolation    | Exchange Scope / Cluster | API keys                     |
| Live money / orders  | Ledger / Order Path      | Live trading execution       |

---

## Dependencies

| Dependency                | Kind       | Status required    |
| ------------------------- | ---------- | ------------------ |
| Wave 1 CERTIFIED COMPLETE | Prior wave | **Required**       |
| Wave 2 COMPLETE           | Prior wave | **Required**       |
| Wave 3 COMPLETE           | Prior wave | **Required**       |
| W4-E01 CLOSED             | Prior pkg  | **Required**       |
| W4-E02 CLOSED             | Prior pkg  | **Required**       |
| W4-E03 CLOSED             | Prior pkg  | **Required**       |
| Vault                     | Wave 1     | Closed / available |
| Connection Management     | Wave 2     | COMPLETE           |
| Exchange Adapter factory  | Version 2  | Available (extend) |
| Exchange Scope RC-27      | Version 2  | Available          |

This package does **not** depend on:

- V3-E05 (sequenced after)
- Wave 5 notification transports
- Wave 6 live-capital ADR
- Billing or Wave 9 SaaS

---

## Implementation Scope

### IN Scope

| Item                              | Customer meaning                                                 |
| --------------------------------- | ---------------------------------------------------------------- |
| Kraken adapter inventory          | Catalog vs factory surfaces enumerated; honest not-offered rules |
| Factory adapter registration      | Kraken through Exchange Adapter factory (when offered)           |
| Real connect / test / disconnect  | Vault-backed vendor round-trip (when offered)                    |
| Honest Connected / Error labels   | No fake Connected without round-trip                             |
| Honest not-offered                | Clear label when adapter not delivered                           |
| Expired / permission visibility   | Vendor-reported problems visible (when offered)                  |
| Workspace isolation               | A cannot use B's Kraken credentials                              |
| Authorization                     | Only permitted roles connect / test                              |
| Operational continuity foundation | Kraken connection honesty after restart where durable            |
| Security boundaries               | Consume Wave 1–3 and W4-E01/E02/E03; do not redefine             |
| Validation strategy               | Close criteria, evidence, regressions                            |

### OUT OF Scope

| Item                                  | Why out          | Owner later    |
| ------------------------------------- | ---------------- | -------------- |
| Live order submission                 | Wave 6 + ADR     | V3-L02         |
| Venue permission verification product | E05              | V3-E05         |
| Connection Management redesign        | COMPLETE         | Wave 2         |
| W4-E01 / W4-E02 / W4-E03 reopen       | CLOSED           | Product Owner  |
| Engine clone per venue                | Forbidden        | Never          |
| Second order path                     | Forbidden        | Never          |
| Wave 4 COMPLETE                       | PO after E01…E05 | Product Owner  |
| Implementation slices                 | Not opened       | After Approval |

---

## Product Acceptance Criteria

| #   | Outcome                                                                  | Fail if                              |
| --- | ------------------------------------------------------------------------ | ------------------------------------ |
| 1   | Kraken factory adapter registered or honestly not offered                | Silent catalog label without honesty |
| 2   | Connect with vault credentials performs real Kraken round-trip (offered) | Simulated success without vendor I/O |
| 3   | Test shows vendor-visible success or failure (offered)                   | Opaque or fake errors                |
| 4   | Expired credentials and permission problems visible when vendor reports  | Hidden permission state              |
| 5   | Simulated CONNECTED without keys not shown as Connected                  | Dishonest Connected                  |
| 6   | Workspace A cannot use Workspace B credentials                           | Cross-tenant leak                    |
| 7   | Product never claims Live Trading or live order submission               | Dishonest live claim                 |
| 8   | Secrets never shown, exported, or logged as plaintext                    | Plaintext exposure                   |
| 9   | No engine clone; Exchange Scope remains isolation boundary               | Architecture drift                   |

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Kraken Adapter (factory) Walkthrough

□ Sign in
□ Open Connections → Kraken
□ When offered: use Vault-stored credentials
□ When offered: Test connection — real vendor round-trip
□ When offered: Connected when venue answers OR honest Error / Expired / permission message
□ When not offered: honest not-offered label — no fake Connected
□ Disconnect (when offered)
□ Foreign workspace — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / live order claims
□ Confirm paper remains default
□ Confirm no Exchange Connectivity Complete claims from E04

PASS / NOT APPLICABLE / REQUIRES ACTION
```

---

## Architecture constraints

| Rule                                            | Decision                                            |
| ----------------------------------------------- | --------------------------------------------------- |
| No engine clone per venue                       | **Required** — factory extension only               |
| Exchange Scope remains isolation boundary       | **Required**                                        |
| No ownership drift                              | Vault / Adapter / Cluster / Risk / Ledger unchanged |
| No duplicate Source of Truth                    | No second order path or Ledger                      |
| HTTP transport; UI not SoT                      | Yes                                                 |
| Spec v2.0 / Authority Matrix / Alias Dictionary | Unchanged                                           |
| No Master Plan modifications                    | Binding                                             |
| Consume W4-E01 / W4-E02 / W4-E03 foundation     | Extend; do not duplicate persistence owner          |
| First label-only venue through factory          | Add through factory — do not fork Runtime           |

Forbidden: engine clone per venue; second Canonical Order Path; hidden redesign of Wave 1–3 or W4-E01/E02/E03; claiming Live Trading; claiming Wave 4 COMPLETE from E04; simulated Connected without vendor round-trip; Vault bypass for credentials.

---

## Security constraints

| Rule                    | Decision                                     |
| ----------------------- | -------------------------------------------- |
| Fail Closed             | Missing auth / workspace / permission denies |
| Reuse Vault for secrets | Yes — no local secret store                  |
| SSRF / URL allowlists   | Adapter uses Kraken vendor endpoints only    |
| No credential echo      | Logs / errors / UI never plaintext secrets   |
| Workspace isolation     | A↛B credentials and connection state         |

See [`w4-e04-security-review.md`](./w4-e04-security-review.md).

---

## Validation strategy

See [`w4-e04-validation-plan.md`](./w4-e04-validation-plan.md).

Tests that mock vendor I/O without proving real round-trip do **not** count as Close evidence for connect/test (when offered).

---

## Required implementation slices (planning — not to implement now)

### W4-E04-a — Kraken adapter inventory & honesty baseline

**Objective:** Enumerate catalog label vs factory surfaces; document honest Connected and not-offered rules for Kraken; vault credential path when offered.
**Ownership:** `exchange-adapter` (inventory); consumes Connection Management and Vault contracts.
**Expected deliverables:** Kraken exchange connectivity inventory; honesty baseline; conformance registry.
**Validation focus:** Complete artifact enumeration; SURVIVE/EPHEMERAL classification; no operator-visible behaviour change without PO slice authorization.
**Explicit OUT:** Engine clone; Live Trading; REST/WebSocket product I/O implementation (beyond planning inventory); venue permission verification (E05); declare W4-E04 CLOSED.

### W4-E04-b — Durable Kraken exchange connectivity foundation

**Objective:** Persist explicit Kraken connection and adapter anchors per workspace on existing `exchange-adapter` owner; write-through and hydrated reads.
**Ownership:** `exchange-adapter` — extends W4-E01/E02/E03 patterns for Kraken venue scope only.
**Expected deliverables:** Persistence service extensions; Prisma repository usage; conformance registry.
**Validation focus:** Workspace isolation; no synthetic Connected flag; no second persistence owner.
**Explicit OUT:** Real Kraken REST/WebSocket I/O (unless separately authorized in slice); Live Trading; redesign W4-E01/E02/E03 artifacts; Connection Management facade rewrite.

### W4-E04-c — Kraken restart recovery foundation

**Objective:** Restore W4-E04-b persisted Kraken exchange connectivity anchors after normal API restart; deterministic, idempotent, fail-honest on corruption.
**Ownership:** `exchange-adapter` — extends W4-E01/E02/E03 patterns for Kraken scope.
**Expected deliverables:** Restart recovery service; integrity-gated hydrate; conformance registry.
**Validation focus:** Idempotent recovery; corruption fail-honest; no Connected fabrication.
**Explicit OUT:** REST/WebSocket I/O; operational continuity UI claims; BC/HA; declare package CLOSED.

### W4-E04-d — Kraken operational continuity foundation

**Objective:** Project Kraken Exchange Connectivity operational readiness on Platform Readiness, derived from W4-E04-c recovery outcomes.
**Ownership:** `exchange-adapter` + Platform Readiness projection — extends W4-E01/E02/E03 for Kraken.
**Expected deliverables:** Continuity status types; operational continuity integration; web `krakenExchangeConnectivity` view extensions where Kraken-scoped; conformance registry.
**Validation focus:** Recovering / Ready / Degraded / Unavailable derived honestly; no Connected labels; workspace scoped.
**Explicit OUT:** Monitoring product rewrite; REST test controls; Live Trading readiness; Exchange Connectivity Complete.

### W4-E04-e — Package Validation, Operational Verification & Close Evidence

**Objective:** Validation / walkthrough / integrity / Close Evidence assembly only.
**Ownership:** Documentation + conformance — no new runtime owner.
**Expected deliverables:** Operational walkthrough; package summary; close package report; conformance registry verifying slices a–d.
**Validation focus:** Complete chain evidenced; governance and Honest Product rules; ready for Product Owner Package Review.
**Explicit OUT:** Declare W4-E04 CLOSED; open E05; claim Wave 4 COMPLETE; Exchange Connectivity Complete; Kraken Connected product outcomes beyond evidence scope.

**STOP:** Slices are **named for planning only**. They are **not opened**.

---

## Governance checkpoints

| Checkpoint                 | Status (planning open) |
| -------------------------- | ---------------------- |
| Planning Package created   | **Met**                |
| Planning Review            | **Pending**            |
| Planning Approval          | **Pending**            |
| Implementation authorized  | **Not granted**        |
| Slice a opened             | **Forbidden**          |
| Repository synchronization | **Pending commit**     |

---

## Technical risks (planning)

| Risk                                     | Mitigation (planning)                                           |
| ---------------------------------------- | --------------------------------------------------------------- |
| First label-only venue factory addition  | RC-27 factory extension rule; architecture review at slices     |
| Duplicate persistence owner for Kraken   | Extend exchange-adapter owner only; mirror E01/E02/E03 patterns |
| Engine clone temptation for fourth venue | RC-27 factory extension rule; architecture review at slices     |
| Simulated Connected without vendor I/O   | Honest Product rules; validation requires round-trip evidence   |
| Cross-workspace credential leak          | Workspace Isolation + Vault scoped retrieve                     |
| Honest not-offered vs silent omission    | Explicit not-offered label when adapter not delivered           |
| Scope creep into Live Trading            | Explicit OUT; Wave 6 gate unchanged                             |

---

## Out-of-scope declarations (binding)

- No Live Trading
- No live order submission
- No Wave 5 / Wave 6 product delivery from this package
- No venue permission verification Complete (E05)
- No Wave 4 COMPLETE
- No engine clone per venue
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 / Wave 2 / Wave 3 / W4-E01 / W4-E02 / W4-E03 modifications
- No ownership changes
- No Planning Review PASS or Planning APPROVED from this open
- No implementation slices opened

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not create W4-E04-a.
