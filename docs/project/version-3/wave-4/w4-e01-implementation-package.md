# W4-E01 Binance Real I/O — Implementation Package

```text
Package:            W4-E01
Name:               Binance Real I/O
Also known as:      V3-E01 · CM-07
Wave:               4 — Exchange Connectivity
Master Plan map:    V3-E01 Binance real I/O (CM-07).
                    Wave 4 exit: connect, test, disconnect Binance against the real venue;
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
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

**Companions:**

| Document                                                                           | Role                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`w4-e01-product-scope.md`](./w4-e01-product-scope.md)                             | IN / OUT, ownership, honesty, acceptance              |
| [`w4-e01-security-review.md`](./w4-e01-security-review.md)                         | Threat model, integrity, Verification Standard intent |
| [`w4-e01-validation-plan.md`](./w4-e01-validation-plan.md)                         | How Close is proven                                   |
| [`w4-e01-overview.md`](./w4-e01-overview.md)                                       | Operator / PO language product                        |
| [`wave-4-planning-summary.md`](./wave-4-planning-summary.md)                       | Wave Planning open record                             |
| [`wave-4-progress.md`](./wave-4-progress.md)                                       | Wave 4 package status                                 |
| [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md) | Implementation Readiness Checklist                    |

**Prerequisites:**

| Prerequisite                   | Status                                        |
| ------------------------------ | --------------------------------------------- |
| Version 2                      | **CERTIFIED**                                 |
| Wave 1 Security Foundation     | **CERTIFIED COMPLETE**                        |
| Wave 2 Connection Management   | **COMPLETE** (consumed; not redesigned)       |
| Wave 3 Durability & Operations | **COMPLETE** (consumed; not redesigned)       |
| W2-S02 Exchange Connectivity   | **CLOSED** (Binance early handshake; context) |
| Vault                          | **CLOSED** / available                        |
| Exchange Adapter factory       | Exists (stub BINANCE)                         |
| Exchange Scope / RC-27         | Exists                                        |
| Master Plan                    | **FROZEN** — this package does not revise it  |
| Security Verification Standard | **Approved** (mandatory at Close)             |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-E01 Binance real I/O** (CM-07). Architecture rule: major extension of Exchange Adapter I/O — **replace nothing** in Risk, Orders, or Ledger. **W4-E01 extends the existing Exchange Adapter factory only; it introduces no engine clone and no new order path.** Wave 1–3 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Binance Real I/O consumes Vault, Connection Management, and Exchange Adapter factory.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver Bybit/OKX/Kraken (E02–E04).
Connected ≠ Live Trading. Paper remains default.
STOP — Do not create W4-E01-a until Product Owner Approves planning.
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

W4-E01 opens **Binance Real I/O**. It is the product package that delivers real connect / test / disconnect against Binance using vault-backed credentials through the existing Exchange Adapter factory. **Connected** means the venue answered. Paper execution remains the default. Live order submission to capital remains blocked until Wave 6.

It consumes Wave 1 vault, Closed Wave 2 Connection Management and Exchange Connectivity Foundation, Closed Wave 3 operational foundations, and the existing Exchange Scope / adapter factory. It does not invent a second engine per venue or a parallel order path.

| Field                           | Value                                 |
| ------------------------------- | ------------------------------------- |
| Package ID                      | W4-E01                                |
| Master Plan / Execution Roadmap | **V3-E01** Binance real I/O           |
| Product name                    | Binance Real I/O                      |
| Wave                            | 4 — Exchange Connectivity             |
| Capabilities (inventory IDs)    | **CM-07**                             |
| Complexity                      | L                                     |
| Previous                        | Wave 3 COMPLETE                       |
| Next after W4-E01 Close         | W4-E02 Bybit Real I/O (PO sequencing) |

---

## Business Goal

- **Goal:** Operators can connect, test, and disconnect Binance against the real venue. Connected means the venue answered. Expired or missing permissions are visible.
- **Honesty:** **Connected** means a real vendor round-trip succeeded. It does **not** mean Live Trading, live order submission, Wave 4 COMPLETE, or Bybit/OKX/Kraken connected.
- **Master Plan reference:** Wave 4 customer-observable — “I connect, test, and disconnect **Binance** against the real venue.” Execution Roadmap V3-E01 / Wave 4 exit criteria.
- **Metric:** Time to connect Binance **< 3 min** (wizard + successful test); simulated Connected without keys **0 tolerated**; cross-workspace secret leak **0 tolerated**.

---

## Customer Problem

- **Problem:** Wave 2 collected Binance credentials and delivered an early handshake foundation, but full Wave 4 honesty requires real I/O through the adapter factory with vault credentials, honest status for expired keys and permission problems, and no simulated Connected without a vendor round-trip.
- **Who feels it:** Trading operators who need honest venue status; workspace admins who stored keys in Wave 2; Product Owner who cannot advance live-capital gate (Waves 1–4) while venue I/O remains stub-only for catalog venues.
- **What they must do today that they should not:** Infer Connected from credential collection alone; SSH to test keys; trust simulated adapter state.

---

## Business Value

- **Value delivered at W4-E01 Close (after implementation):** Binance connect / test / disconnect performs real vendor round-trip; honest Connected / Error / Expired / permission labels; paper remains default; CM-07 Binance connectivity advanced for package scope.
- **What remains blocked until later packages / waves:** Bybit (E02); OKX (E03); Kraken (E04); venue permission verification product (E05); Wave 4 COMPLETE; Wave 5 notifications; Wave 6 live capital.

---

## Current State

| Capability or surface               | Status          | Evidence          |
| ----------------------------------- | --------------- | ----------------- |
| Wave 1 vault                        | CLOSED          | V3-S03            |
| Wave 2 credential collection        | COMPLETE        | W2-S01            |
| W2-S02 Binance early handshake      | CLOSED          | Partial real REST |
| Stub `VenueExchangeAdapter` BINANCE | Needs extension | Factory exists    |
| Bybit / OKX real I/O                | Out             | V3-E02 / E03      |
| Kraken adapter                      | Out             | V3-E04            |
| Live order submission               | Out             | Wave 6 + ADR      |
| Honest Connected product rules      | Partial         | This package      |

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit; Connection Management facade; Exchange Scope; Canonical Order Path; Risk; Ledger |
| Minor extension | Connection status surfaces; operational continuity projection for Binance                                                                                                      |
| Major extension | Exchange Adapter Binance real I/O (connect / test / disconnect)                                                                                                                |
| New justified   | Nothing. Master Plan already named V3-E01.                                                                                                                                     |
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

| Dependency                         | Kind       | Status required    |
| ---------------------------------- | ---------- | ------------------ |
| Wave 1 CERTIFIED COMPLETE          | Prior wave | **Required**       |
| Wave 2 COMPLETE                    | Prior wave | **Required**       |
| Wave 3 COMPLETE                    | Prior wave | **Required**       |
| Vault                              | Wave 1     | Closed / available |
| Connection Management              | Wave 2     | COMPLETE           |
| Exchange Adapter factory + BINANCE | Version 2  | Available (extend) |
| Exchange Scope RC-27               | Version 2  | Available          |

This package does **not** depend on:

- V3-E02…E05 (sequenced after)
- Wave 5 notification transports
- Wave 6 live-capital ADR
- Billing or Wave 9 SaaS

---

## Implementation Scope

### IN Scope

| Item                              | Customer meaning                                           |
| --------------------------------- | ---------------------------------------------------------- |
| Binance adapter inventory         | Stub vs real surfaces enumerated                           |
| Real connect / test / disconnect  | Vault-backed vendor round-trip                             |
| Honest Connected / Error labels   | No fake Connected without round-trip                       |
| Expired / permission visibility   | Vendor-reported problems visible                           |
| Workspace isolation               | A cannot use B's Binance credentials                       |
| Authorization                     | Only permitted roles connect / test                        |
| Public market data policy hook    | Per workspace policy without trading key (if in E01 scope) |
| Operational continuity foundation | Connection honesty after restart where durable             |
| Security boundaries               | Consume Wave 1–3; do not redefine                          |
| Validation strategy               | Close criteria, evidence, regressions                      |

### OUT OF Scope

| Item                                  | Why out           | Owner later    |
| ------------------------------------- | ----------------- | -------------- |
| Live order submission                 | Wave 6 + ADR      | V3-L02         |
| Bybit / OKX real I/O                  | Separate packages | V3-E02 / E03   |
| Kraken adapter                        | Separate package  | V3-E04         |
| Venue permission verification product | E05               | V3-E05         |
| Connection Management redesign        | COMPLETE          | Wave 2         |
| Engine clone per venue                | Forbidden         | Never          |
| Second order path                     | Forbidden         | Never          |
| Wave 4 COMPLETE                       | PO after E01…E05  | Product Owner  |
| Implementation slices                 | Not opened        | After Approval |

---

## Product Acceptance Criteria

| #   | Outcome                                                                 | Fail if                              |
| --- | ----------------------------------------------------------------------- | ------------------------------------ |
| 1   | Connect with vault credentials performs real Binance round-trip         | Simulated success without vendor I/O |
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
Binance Real I/O Walkthrough

□ Sign in
□ Open Connections → Binance
□ Use Vault-stored credentials
□ Test connection — real vendor round-trip
□ Connected when venue answers OR honest Error / Expired / permission message
□ Disconnect
□ Foreign workspace — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / live order claims
□ Confirm paper remains default
□ Confirm no Bybit/OKX/Kraken Complete claims from E01

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

Forbidden: engine clone per venue; second Canonical Order Path; hidden redesign of Wave 1–3; claiming Live Trading; claiming Wave 4 COMPLETE from E01; simulated Connected without vendor round-trip; Vault bypass for credentials.

---

## Security constraints

| Rule                    | Decision                                     |
| ----------------------- | -------------------------------------------- |
| Fail Closed             | Missing auth / workspace / permission denies |
| Reuse Vault for secrets | Yes — no local secret store                  |
| SSRF / URL allowlists   | Adapter uses vendor endpoints only           |
| No credential echo      | Logs / errors / UI never plaintext secrets   |
| Workspace isolation     | A↛B credentials and connection state         |

See [`w4-e01-security-review.md`](./w4-e01-security-review.md).

---

## Validation strategy

See [`w4-e01-validation-plan.md`](./w4-e01-validation-plan.md).

Tests that mock vendor I/O without proving real round-trip do **not** count as Close evidence for connect/test.

---

## Required implementation slices (planning — not to implement now)

### W4-E01-a — Binance adapter inventory & honesty baseline

**Goal:** Enumerate stub vs real Binance surfaces; document honest Connected rules and vault credential path.
**Done when:** Inventory evidenced; honesty baseline for operators documented.
**Must not:** Engine clone; Live Trading; open E02–E05.

### W4-E01-b — Real Binance connect / test / disconnect I/O

**Goal:** Vault-backed vendor round-trip through Exchange Adapter factory.
**Done when:** Connect / test / disconnect perform real Binance I/O for authorized workspace.
**Must not:** Live order submission; bypass Vault; redesign Connection Management.

### W4-E01-c — Permission & credential status visibility

**Goal:** Expired credentials and permission problems visible when vendor reports them.
**Done when:** Status surfaces show Expired / permission problems honestly.
**Must not:** Claim E05 venue permission verification Complete.

### W4-E01-d — Operational continuity foundation

**Goal:** Connection state / health projection survives restart where durable; honest degraded when venue unavailable.
**Done when:** Continuity foundation PASS; no BC/HA/Live claims.
**Must not:** Expand into Monitoring product rewrite.

### W4-E01-e — Package Validation, Operational Verification & Close Evidence

**Goal:** Validation / walkthrough / integrity / Close Evidence only.
**Done when:** Close Evidence assembled for Product Owner Package Review.
**Must not:** Declare W4-E01 CLOSED; start E02; claim Wave 4 COMPLETE.

**STOP:** Slices are **named for planning only**. They are **not opened**.

---

## Out-of-scope declarations (binding)

- No Live Trading
- No live order submission
- No Wave 5 / Wave 6 product delivery from this package
- No Bybit / OKX / Kraken Complete (E02–E04)
- No Wave 4 COMPLETE
- No engine clone per venue
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 / Wave 2 / Wave 3 modifications
- No ownership changes
- No Planning Review PASS or Planning APPROVED from this open
- No implementation slices opened

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not create W4-E01-a.
