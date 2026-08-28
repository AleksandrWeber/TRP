# W4-E02 Bybit Real I/O — Implementation Package

```text
Package:            W4-E02
Name:               Bybit Real I/O
Also known as:      V3-E02 · CM-08
Wave:               4 — Exchange Connectivity
Master Plan map:    V3-E02 Bybit real I/O (CM-08).
                    Wave 4 exit: connect, test, disconnect Bybit against the real venue;
                    Connected means the venue answered; paper remains default.
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
| [`w4-e02-product-scope.md`](./w4-e02-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w4-e02-security-review.md`](./w4-e02-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w4-e02-validation-plan.md`](./w4-e02-validation-plan.md)   | How Close is proven                                   |
| [`w4-e02-overview.md`](./w4-e02-overview.md)                 | Operator / PO language product                        |
| [`w4-e02-planning-summary.md`](./w4-e02-planning-summary.md) | Package planning open record                          |
| [`wave-4-progress.md`](./wave-4-progress.md)                 | Wave 4 package status                                 |

**Prerequisites:**

| Prerequisite                   | Status                                       |
| ------------------------------ | -------------------------------------------- |
| Version 2                      | **CERTIFIED**                                |
| Wave 1 Security Foundation     | **CERTIFIED COMPLETE**                       |
| Wave 2 Connection Management   | **COMPLETE** (consumed; not redesigned)      |
| Wave 3 Durability & Operations | **COMPLETE** (consumed; not redesigned)      |
| W4-E01 Binance Real I/O        | **CLOSED** by Product Owner (2026-08-28)     |
| Vault                          | **CLOSED** / available                       |
| Exchange Adapter factory       | Exists (stub BYBIT)                          |
| Exchange Scope / RC-27         | Exists                                       |
| Master Plan                    | **FROZEN** — this package does not revise it |
| Security Verification Standard | **Approved** (mandatory at Close)            |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-E02 Bybit real I/O** (CM-08). Architecture rule: major extension of Exchange Adapter I/O — **replace nothing** in Risk, Orders, or Ledger. **W4-E02 extends the existing Exchange Adapter factory only; it introduces no engine clone and no new order path.** W4-E01 foundation (inventory, durable exchange connectivity, restart recovery, operational continuity) is consumed — not redesigned. Wave 1–3 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Bybit Real I/O consumes Vault, Connection Management, Exchange Adapter factory, and W4-E01 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver OKX/Kraken (E03–E04).
Connected ≠ Live Trading. Paper remains default.
STOP — Do not create W4-E02-a until Product Owner Approves planning.
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

W4-E02 opens **Bybit Real I/O**. It is the product package that delivers real connect / test / disconnect against Bybit using vault-backed credentials through the existing Exchange Adapter factory. **Connected** means the venue answered. Paper execution remains the default. Live order submission to capital remains blocked until Wave 6.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 operational foundations, Closed W4-E01 exchange connectivity foundation patterns, and the existing Exchange Scope / adapter factory. It does not invent a second engine per venue or a parallel order path.

| Field                           | Value                               |
| ------------------------------- | ----------------------------------- |
| Package ID                      | W4-E02                              |
| Master Plan / Execution Roadmap | **V3-E02** Bybit real I/O           |
| Product name                    | Bybit Real I/O                      |
| Wave                            | 4 — Exchange Connectivity           |
| Capabilities (inventory IDs)    | **CM-08**                           |
| Complexity                      | L                                   |
| Previous                        | W4-E01 **CLOSED**                   |
| Next after W4-E02 Close         | W4-E03 OKX Real I/O (PO sequencing) |

---

## Business Goal

- **Goal:** Operators can connect, test, and disconnect Bybit against the real venue. Connected means the venue answered. Expired or missing permissions are visible.
- **Honesty:** **Connected** means a real vendor round-trip succeeded. It does **not** mean Live Trading, live order submission, Wave 4 COMPLETE, or OKX/Kraken connected.
- **Master Plan reference:** Wave 4 customer-observable — second catalog venue with real I/O through the factory without engine clone (RC-27). Execution Roadmap V3-E02 / CM-08.
- **Metric:** Time to connect Bybit **< 3 min** (wizard + successful test); simulated Connected without keys **0 tolerated**; cross-workspace secret leak **0 tolerated**.

---

## Customer Problem

- **Problem:** Wave 2 collected Bybit credentials and the catalog lists BYBIT, but the `BybitExchangeAdapter` remains a stub. Operators cannot trust Bybit venue status, permissions, or expired credentials without real vendor round-trip through the adapter factory.
- **Who feels it:** Trading operators who need honest second-venue status; workspace admins who stored Bybit keys in Wave 2; Product Owner who cannot advance Wave 4 beyond E01 while Bybit I/O remains stub-only.
- **What they must do today that they should not:** Infer Connected from credential collection alone; SSH to test keys; trust simulated adapter state for BYBIT.

---

## Business Value

- **Value delivered at W4-E02 Close (after implementation):** Bybit connect / test / disconnect performs real vendor round-trip; honest Connected / Error / Expired / permission labels; paper remains default; CM-08 Bybit connectivity advanced for package scope.
- **What remains blocked until later packages / waves:** OKX (E03); Kraken (E04); venue permission verification product (E05); Wave 4 COMPLETE; Wave 5 notifications; Wave 6 live capital.

---

## Current State

| Capability or surface             | Status          | Evidence               |
| --------------------------------- | --------------- | ---------------------- |
| Wave 1 vault                      | CLOSED          | V3-S03                 |
| Wave 2 credential collection      | COMPLETE        | W2-S01                 |
| W4-E01 foundation                 | CLOSED          | PO Close 2026-08-28    |
| Stub `BybitExchangeAdapter` BYBIT | Needs extension | Factory exists         |
| Binance Real I/O product outcomes | Deferred        | W4-E01 foundation only |
| OKX / Kraken real I/O             | Out             | V3-E03 / E04           |
| Live order submission             | Out             | Wave 6 + ADR           |
| Honest Connected product rules    | Partial         | This package           |

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit; Connection Management facade; Exchange Scope; Canonical Order Path; Risk; Ledger |
| Minor extension | Connection status surfaces; operational continuity projection for Bybit                                                                                                        |
| Major extension | Exchange Adapter Bybit real I/O (connect / test / disconnect)                                                                                                                  |
| New justified   | Nothing. Master Plan already named V3-E02.                                                                                                                                     |
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

| Dependency                       | Kind       | Status required    |
| -------------------------------- | ---------- | ------------------ |
| Wave 1 CERTIFIED COMPLETE        | Prior wave | **Required**       |
| Wave 2 COMPLETE                  | Prior wave | **Required**       |
| Wave 3 COMPLETE                  | Prior wave | **Required**       |
| W4-E01 CLOSED                    | Prior pkg  | **Required**       |
| Vault                            | Wave 1     | Closed / available |
| Connection Management            | Wave 2     | COMPLETE           |
| Exchange Adapter factory + BYBIT | Version 2  | Available (extend) |
| Exchange Scope RC-27             | Version 2  | Available          |

This package does **not** depend on:

- V3-E03…E05 (sequenced after)
- Wave 5 notification transports
- Wave 6 live-capital ADR
- Billing or Wave 9 SaaS

---

## Implementation Scope

### IN Scope

| Item                              | Customer meaning                                     |
| --------------------------------- | ---------------------------------------------------- |
| Bybit adapter inventory           | Stub vs real surfaces enumerated for BYBIT           |
| Real connect / test / disconnect  | Vault-backed vendor round-trip                       |
| Honest Connected / Error labels   | No fake Connected without round-trip                 |
| Expired / permission visibility   | Vendor-reported problems visible                     |
| Workspace isolation               | A cannot use B's Bybit credentials                   |
| Authorization                     | Only permitted roles connect / test                  |
| Operational continuity foundation | Bybit connection honesty after restart where durable |
| Security boundaries               | Consume Wave 1–3 and W4-E01; do not redefine         |
| Validation strategy               | Close criteria, evidence, regressions                |

### OUT OF Scope

| Item                                  | Why out           | Owner later    |
| ------------------------------------- | ----------------- | -------------- |
| Live order submission                 | Wave 6 + ADR      | V3-L02         |
| OKX / Kraken real I/O                 | Separate packages | V3-E03 / E04   |
| Venue permission verification product | E05               | V3-E05         |
| Connection Management redesign        | COMPLETE          | Wave 2         |
| W4-E01 reopen / redesign              | CLOSED            | Product Owner  |
| Engine clone per venue                | Forbidden         | Never          |
| Second order path                     | Forbidden         | Never          |
| Wave 4 COMPLETE                       | PO after E01…E05  | Product Owner  |
| Implementation slices                 | Not opened        | After Approval |

---

## Product Acceptance Criteria

| #   | Outcome                                                                 | Fail if                              |
| --- | ----------------------------------------------------------------------- | ------------------------------------ |
| 1   | Connect with vault credentials performs real Bybit round-trip           | Simulated success without vendor I/O |
| 2   | Test shows vendor-visible success or failure                            | Opaque or fake errors                |
| 3   | Expired credentials and permission problems visible when vendor reports | Hidden permission state              |
| 4   | Simulated CONNECTED without keys not shown as Connected                 | Dishonest Connected                  |
| 5   | Workspace A cannot use Workspace B credentials                          | Cross-tenant leak                    |
| 6   | Product never claims Live Trading or live order submission              | Dishonest live claim                 |
| 7   | Secrets never shown, exported, or logged as plaintext                   | Plaintext exposure                   |
| 8   | No engine clone; Exchange Scope remains isolation boundary              | Architecture drift                   |

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Bybit Real I/O Walkthrough

□ Sign in
□ Open Connections → Bybit
□ Use Vault-stored credentials
□ Test connection — real vendor round-trip
□ Connected when venue answers OR honest Error / Expired / permission message
□ Disconnect
□ Foreign workspace — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / live order claims
□ Confirm paper remains default
□ Confirm no OKX/Kraken Complete claims from E02

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
| Consume W4-E01 foundation                       | Extend; do not duplicate persistence owner          |

Forbidden: engine clone per venue; second Canonical Order Path; hidden redesign of Wave 1–3 or W4-E01; claiming Live Trading; claiming Wave 4 COMPLETE from E02; simulated Connected without vendor round-trip; Vault bypass for credentials.

---

## Security constraints

| Rule                    | Decision                                     |
| ----------------------- | -------------------------------------------- |
| Fail Closed             | Missing auth / workspace / permission denies |
| Reuse Vault for secrets | Yes — no local secret store                  |
| SSRF / URL allowlists   | Adapter uses Bybit vendor endpoints only     |
| No credential echo      | Logs / errors / UI never plaintext secrets   |
| Workspace isolation     | A↛B credentials and connection state         |

See [`w4-e02-security-review.md`](./w4-e02-security-review.md).

---

## Validation strategy

See [`w4-e02-validation-plan.md`](./w4-e02-validation-plan.md).

Tests that mock vendor I/O without proving real round-trip do **not** count as Close evidence for connect/test.

---

## Required implementation slices (planning — not to implement now)

### W4-E02-a — Bybit adapter inventory & honesty baseline

**Objective:** Enumerate stub vs real Bybit surfaces; document honest Connected rules and vault credential path for BYBIT.
**Ownership:** `exchange-adapter` (inventory); consumes Connection Management and Vault contracts.
**Expected deliverables:** Bybit exchange connectivity inventory; honesty baseline; conformance registry.
**Validation focus:** Complete artifact enumeration; SURVIVE/EPHEMERAL classification; no operator-visible behaviour change without PO slice authorization.
**Explicit OUT:** Engine clone; Live Trading; REST/WebSocket product I/O implementation; OKX/Kraken (E03–E04); declare W4-E02 CLOSED.

### W4-E02-b — Durable Bybit exchange connectivity foundation

**Objective:** Persist explicit Bybit connection and adapter anchors per workspace on existing `exchange-adapter` owner; write-through and hydrated reads.
**Ownership:** `exchange-adapter` — extends W4-E01-b patterns for BYBIT venue scope only.
**Expected deliverables:** Persistence service extensions; Prisma repository usage; conformance registry.
**Validation focus:** Workspace isolation; no synthetic Connected flag; no second persistence owner.
**Explicit OUT:** Real Bybit REST/WebSocket I/O; Live Trading; redesign W4-E01 artifacts; Connection Management facade rewrite.

### W4-E02-c — Bybit restart recovery foundation

**Objective:** Restore W4-E02-b persisted Bybit exchange connectivity anchors after normal API restart; deterministic, idempotent, fail-honest on corruption.
**Ownership:** `exchange-adapter` — extends W4-E01-c patterns for BYBIT scope.
**Expected deliverables:** Restart recovery service; integrity-gated hydrate; conformance registry.
**Validation focus:** Idempotent recovery; corruption fail-honest; no Connected fabrication.
**Explicit OUT:** REST/WebSocket I/O; operational continuity UI claims; BC/HA; declare package CLOSED.

### W4-E02-d — Bybit operational continuity foundation

**Objective:** Project Bybit Exchange Connectivity operational readiness on Platform Readiness, derived from W4-E02-c recovery outcomes.
**Ownership:** `exchange-adapter` + Platform Readiness projection — extends W4-E01-d for BYBIT.
**Expected deliverables:** Continuity status types; operational continuity integration; web `exchangeConnectivity` view extensions where Bybit-scoped; conformance registry.
**Validation focus:** Recovering / Ready / Degraded / Unavailable derived honestly; no Connected labels; workspace scoped.
**Explicit OUT:** Monitoring product rewrite; REST test controls; Live Trading readiness; Exchange Connectivity Complete.

### W4-E02-e — Package Validation, Operational Verification & Close Evidence

**Objective:** Validation / walkthrough / integrity / Close Evidence assembly only.
**Ownership:** Documentation + conformance — no new runtime owner.
**Expected deliverables:** Operational walkthrough; package summary; close package report; conformance registry verifying slices a–d.
**Validation focus:** Complete chain evidenced; governance and Honest Product rules; ready for Product Owner Package Review.
**Explicit OUT:** Declare W4-E02 CLOSED; open E03; claim Wave 4 COMPLETE; Exchange Connectivity Complete; Bybit Connected product outcomes beyond evidence scope.

**STOP:** Slices are **named for planning only**. They are **not opened**.

---

## Out-of-scope declarations (binding)

- No Live Trading
- No live order submission
- No Wave 5 / Wave 6 product delivery from this package
- No OKX / Kraken Complete (E03–E04)
- No Wave 4 COMPLETE
- No engine clone per venue
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 / Wave 2 / Wave 3 / W4-E01 modifications
- No ownership changes
- No Planning Review PASS or Planning APPROVED from this open
- No implementation slices opened

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not create W4-E02-a.
