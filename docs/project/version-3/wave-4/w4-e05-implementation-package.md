# W4-E05 Venue Permission Verification — Implementation Package

```text
Package:            W4-E05
Name:               Venue Permission Verification
Also known as:      V3-E05 · feeds LT-02 later
Wave:               4 — Exchange Connectivity
Master Plan map:    V3-E05 Venue permission verification.
                    Wave 4 exit: real venue-reported permissions; expired and permission problems visible;
                    paper remains default.
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
| [`w4-e05-product-scope.md`](./w4-e05-product-scope.md)       | IN / OUT, ownership, honesty, acceptance              |
| [`w4-e05-security-review.md`](./w4-e05-security-review.md)   | Threat model, integrity, Verification Standard intent |
| [`w4-e05-validation-plan.md`](./w4-e05-validation-plan.md)   | How Close is proven                                   |
| [`w4-e05-overview.md`](./w4-e05-overview.md)                 | Operator / PO language product                        |
| [`w4-e05-planning-summary.md`](./w4-e05-planning-summary.md) | Package planning open record                          |
| [`wave-4-progress.md`](./wave-4-progress.md)                 | Wave 4 package status                                 |

**Prerequisites:**

| Prerequisite                    | Status                                       |
| ------------------------------- | -------------------------------------------- |
| Version 2                       | **CERTIFIED**                                |
| Wave 1 Security Foundation      | **CERTIFIED COMPLETE**                       |
| Wave 2 Connection Management    | **COMPLETE** (consumed; not redesigned)      |
| Wave 3 Durability & Operations  | **COMPLETE** (consumed; not redesigned)      |
| W4-E01 Binance Real I/O         | **CLOSED** by Product Owner (2026-08-28)     |
| W4-E02 Bybit Real I/O           | **CLOSED** by Product Owner (2026-08-28)     |
| W4-E03 OKX Real I/O             | **CLOSED** by Product Owner (2026-08-28)     |
| W4-E04 Kraken Adapter (factory) | **CLOSED** by Product Owner (2026-08-28)     |
| Vault                           | **CLOSED** / available                       |
| Exchange Adapter factory        | Exists (hardcoded `apiPermissions` defaults) |
| Exchange Scope / RC-27          | Exists (BINANCE / BYBIT / OKX / kraken)      |
| Master Plan                     | **FROZEN** — this package does not revise it |
| Security Verification Standard  | **Approved** (mandatory at Close)            |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Planning Review, Planning Approval, and an authorized implementation task).** Master Plan and Execution Roadmap already name **V3-E05 Venue permission verification** (feeds LT-02 later). Architecture rule: major extension of Exchange Adapter I/O — **replace nothing** in Risk, Orders, or Ledger. **W4-E05 extends the existing Exchange Adapter factory only; it introduces no engine clone and no new order path.** W4-E01, W4-E02, W4-E03, and W4-E04 foundation patterns are consumed — not redesigned. Wave 1–3 remain closed. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced.

```text
Venue Permission Verification consumes Vault, Connection Management, Exchange Adapter factory, and W4-E01…E04 foundation patterns.
It does NOT redesign Vault, Auth, Cluster identity, Risk, or Ledger.
It does NOT own live order submission (Wave 6).
It does NOT deliver per-venue Real I/O product outcomes (E01–E04).
Permission verified ≠ Live Trading. Paper remains default.
STOP — Do not create W4-E05-a until Product Owner Approves planning.
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

W4-E05 opens **Venue Permission Verification**. It is the fifth and final Wave 4 product package. It delivers cross-venue **real permission verification** from vendor APIs — replacing hardcoded or stub `apiPermissions` defaults with vendor-reported permissions (e.g. `spot.trade` from the venue). Operators see honest permission, expired, and insufficient-permission labels across catalog crypto venues. Paper execution remains the default. Live order submission to capital remains blocked until Wave 6.

It consumes Wave 1 vault, Closed Wave 2 Connection Management, Closed Wave 3 operational foundations, Closed W4-E01…E04 exchange connectivity foundation patterns, and the existing Exchange Scope / adapter factory. It does not invent a second permission engine or a parallel order path.

| Field                           | Value                                                 |
| ------------------------------- | ----------------------------------------------------- |
| Package ID                      | W4-E05                                                |
| Master Plan / Execution Roadmap | **V3-E05** Venue permission verification              |
| Product name                    | Venue Permission Verification                         |
| Wave                            | 4 — Exchange Connectivity                             |
| Capabilities (inventory IDs)    | Feeds **LT-02** later; satisfies **CM-04** dependency |
| Complexity                      | M                                                     |
| Previous                        | W4-E04 **CLOSED**                                     |
| Next after W4-E05 Close         | Wave 4 Completion Review (PO sequencing)              |

---

## Business Goal

- **Goal:** Operators see **vendor-verified permissions** for connected catalog venues. Hardcoded `apiPermissions` defaults are replaced with real venue-reported permission probes. Expired credentials and permission problems remain visible.
- **Honesty:** **Permission verified** means a real vendor permission probe succeeded. It does **not** mean Live Trading, live order submission, Wave 4 COMPLETE, or Exchange Connectivity Complete.
- **Master Plan reference:** Wave 4 customer-observable — “Expired or missing permissions are visible.” Security Vision — “real permission verification (`spot.trade` from venue, not hardcoded `apiPermissions`).” Execution Roadmap V3-E05 feeds LT-02 later.
- **Metric:** Permission probe accuracy **100%** vendor-sourced (no hardcoded defaults presented as verified); cross-workspace secret leak **0 tolerated**; simulated permission labels without vendor probe **0 tolerated**.

---

## Customer Problem

- **Problem:** `ExchangeManager.readApiPermissions()` returns hardcoded `['spot.read', 'spot.trade']` when adapters lack `apiPermissions()`. Operators cannot trust permission labels for live readiness. CM-04 Health Monitoring depends on venue permission APIs (Wave 4) that do not yet exist as a product. Wave 6 live gate requires real venue permissions — not stubs.
- **Who feels it:** Trading operators who need honest permission status; workspace admins who store exchange keys; Product Owner who cannot complete Wave 4 exchange honesty without V3-E05; Wave 6 live readiness gate.
- **What they must do today that they should not:** Assume default permissions reflect real vendor state; infer live readiness from hardcoded labels; trust capability probes from E01–E04 connect/test as E05 Complete.

---

## Business Value

- **Value delivered at W4-E05 Close (after implementation):** Cross-venue vendor-verified permission labels; honest Expired / insufficient-permission visibility; workspace-scoped permission state; CM-04 venue permission API dependency satisfied for package scope; LT-02 prerequisite advanced.
- **What remains blocked until later packages / waves:** Wave 4 COMPLETE (requires PO Completion Review after E05 Close); Wave 5 notifications; Wave 6 live capital and live order I/O (LT-02).

---

## Current State

| Capability or surface               | Status     | Evidence                                |
| ----------------------------------- | ---------- | --------------------------------------- |
| Wave 1 vault                        | CLOSED     | V3-S03                                  |
| Wave 2 credential collection        | COMPLETE   | W2-S01                                  |
| W4-E01…E04 foundations              | CLOSED     | PO Close 2026-08-28                     |
| `apiPermissions()` adapter surface  | Partial    | Hardcoded defaults in `ExchangeManager` |
| Cross-venue permission verification | Not exists | Deferred to V3-E05                      |
| CM-04 venue permission APIs         | Not exists | Depends on Wave 4 E05                   |
| Per-venue Real I/O product outcomes | Deferred   | W4-E01…E04 foundation only              |
| Live order submission               | Out        | Wave 6 + ADR                            |
| Honest permission / expired rules   | Partial    | This package                            |

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit; Connection Management facade; Exchange Scope; Canonical Order Path; Risk; Ledger |
| Minor extension | Connection status surfaces; permission labels on Connections UI; Platform Readiness permission projection                                                                      |
| Major extension | Exchange Adapter cross-venue permission verification and vendor permission probe I/O                                                                                           |
| New justified   | Nothing. Master Plan already named V3-E05. Permission verification is extension — not a new product.                                                                           |
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
| W4-E04 CLOSED             | Prior pkg  | **Required**       |
| Vault                     | Wave 1     | Closed / available |
| Connection Management     | Wave 2     | COMPLETE           |
| Exchange Adapter factory  | Version 2  | Available (extend) |
| Exchange Scope RC-27      | Version 2  | Available          |

This package does **not** depend on:

- Wave 5 notification transports
- Wave 6 live-capital ADR
- Billing or Wave 9 SaaS

---

## Implementation Scope

### IN Scope

| Item                                         | Customer meaning                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Venue permission inventory                   | Permission surfaces enumerated across catalog venues; honest default rules |
| Cross-venue permission verification          | Real vendor permission probe through Exchange Adapter factory              |
| Vendor-reported permission labels            | `spot.trade` and equivalents from venue — not hardcoded defaults           |
| Expired / insufficient-permission visibility | Vendor-reported problems shown across venues                               |
| Workspace isolation                          | A cannot use B's permission state or credentials                           |
| Authorization                                | Only permitted roles trigger permission verification                       |
| Operational continuity foundation            | Permission state honesty after restart where durable                       |
| Security boundaries                          | Consume Wave 1–3 and W4-E01…E04; do not redefine                           |
| Validation strategy                          | Close criteria, evidence, regressions                                      |

### OUT OF Scope

| Item                                     | Why out                                | Owner later    |
| ---------------------------------------- | -------------------------------------- | -------------- |
| Live order submission                    | Wave 6 + ADR                           | V3-L02         |
| Live Trading UI / session                | Wave 6                                 | V3-L01         |
| Per-venue Real I/O product outcomes      | E01–E04                                | V3-E01…E04     |
| Connection Management redesign           | COMPLETE                               | Wave 2         |
| W4-E01 / W4-E02 / W4-E03 / W4-E04 reopen | CLOSED                                 | Product Owner  |
| Engine clone per venue                   | Forbidden                              | Never          |
| Second order path                        | Forbidden                              | Never          |
| Wave 4 COMPLETE                          | PO after E05 Close + Completion Review | Product Owner  |
| Implementation slices                    | Not opened                             | After Approval |

---

## Product Acceptance Criteria

| #   | Outcome                                                                 | Fail if                                  |
| --- | ----------------------------------------------------------------------- | ---------------------------------------- |
| 1   | Vendor-reported permissions shown for connected catalog venues          | Hardcoded defaults presented as verified |
| 2   | Permission probe performs real vendor round-trip                        | Simulated permissions without vendor I/O |
| 3   | Expired credentials and permission problems visible when vendor reports | Hidden permission state                  |
| 4   | Insufficient permissions distinguishable from Connected                 | Opaque permission failures               |
| 5   | Workspace A cannot use Workspace B permission state                     | Cross-tenant leak                        |
| 6   | Product never claims Live Trading or live order submission              | Dishonest live claim                     |
| 7   | Secrets never shown, exported, or logged as plaintext                   | Plaintext exposure                       |
| 8   | No engine clone; Exchange Scope remains isolation boundary              | Architecture drift                       |
| 9   | W4-E01…E04 foundations consumed — not reopened                          | Ownership drift                          |

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Venue Permission Verification Walkthrough

□ Sign in
□ Open Connections for a connected catalog venue (Binance / Bybit / OKX / Kraken when offered)
□ View vendor-reported permissions — not hardcoded defaults
□ Expired credentials show Expired label
□ Insufficient permissions show permission problem label
□ Foreign workspace — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / live order claims
□ Confirm paper remains default
□ Confirm no Exchange Connectivity Complete claims from E05 alone
□ Confirm no Wave 4 COMPLETE claims from E05 alone

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
| Consume W4-E01…E04 foundation                   | Extend; do not duplicate persistence owner          |
| Cross-venue permission — not per-venue fork     | Single factory extension pattern                    |

Forbidden: engine clone per venue; second Canonical Order Path; hidden redesign of Wave 1–3 or W4-E01…E04; claiming Live Trading; claiming Wave 4 COMPLETE from E05 alone; simulated permission labels without vendor probe; Vault bypass for credentials.

---

## Security constraints

| Rule                    | Decision                                     |
| ----------------------- | -------------------------------------------- |
| Fail Closed             | Missing auth / workspace / permission denies |
| Reuse Vault for secrets | Yes — no local secret store                  |
| SSRF / URL allowlists   | Adapter uses vendor endpoints only           |
| No credential echo      | Logs / errors / UI never plaintext secrets   |
| Workspace isolation     | A↛B credentials and permission state         |

See [`w4-e05-security-review.md`](./w4-e05-security-review.md).

---

## Validation strategy

See [`w4-e05-validation-plan.md`](./w4-e05-validation-plan.md).

Tests that mock vendor permission I/O without proving real permission probe do **not** count as Close evidence.

---

## Required implementation slices (planning — not to implement now)

### W4-E05-a — Venue permission inventory & honesty baseline

**Objective:** Enumerate permission surfaces across catalog venues; document honest permission / hardcoded-default rules; vault credential path for permission probes.
**Ownership:** `exchange-adapter` (inventory); consumes Connection Management and Vault contracts.
**Expected deliverables:** Venue permission inventory; honesty baseline; conformance registry.
**Validation focus:** Complete artifact enumeration; SURVIVE/EPHEMERAL classification; no operator-visible behaviour change without PO slice authorization.
**Explicit OUT:** Engine clone; Live Trading; permission probe I/O implementation (beyond planning inventory); declare W4-E05 CLOSED.

### W4-E05-b — Durable venue permission verification foundation

**Objective:** Persist explicit venue permission anchors per workspace on existing `exchange-adapter` owner; write-through and hydrated reads.
**Ownership:** `exchange-adapter` — extends W4-E01…E04 patterns cross-venue.
**Expected deliverables:** Persistence service extensions; Prisma repository usage; conformance registry.
**Validation focus:** Workspace isolation; no synthetic permission labels; no second persistence owner.
**Explicit OUT:** Real vendor permission probe I/O (unless separately authorized in slice); Live Trading; redesign W4-E01…E04 artifacts; Connection Management facade rewrite.

### W4-E05-c — Venue permission restart recovery foundation

**Objective:** Restore W4-E05-b persisted permission anchors after normal API restart; deterministic, idempotent, fail-honest on corruption.
**Ownership:** `exchange-adapter` — extends W4-E01…E04 patterns cross-venue.
**Expected deliverables:** Restart recovery service; integrity-gated hydrate; conformance registry.
**Validation focus:** Idempotent recovery; corruption fail-honest; no permission label fabrication.
**Explicit OUT:** Permission probe I/O; operational continuity UI claims; BC/HA; declare package CLOSED.

### W4-E05-d — Venue permission operational continuity foundation

**Objective:** Project venue permission operational readiness on Platform Readiness / CM-04 health surfaces, derived from W4-E05-c recovery outcomes.
**Ownership:** `exchange-adapter` + Platform Readiness projection — extends W4-E01…E04 cross-venue.
**Expected deliverables:** Continuity status types; operational continuity integration; web permission health view extensions; conformance registry.
**Validation focus:** Recovering / Ready / Degraded / Unavailable derived honestly; no Live Trading labels; workspace scoped.
**Explicit OUT:** Monitoring product rewrite; Live Trading readiness; Exchange Connectivity Complete; Wave 4 COMPLETE.

### W4-E05-e — Package Validation, Operational Verification & Close Evidence

**Objective:** Validation / walkthrough / integrity / Close Evidence assembly only.
**Ownership:** Documentation + conformance — no new runtime owner.
**Expected deliverables:** Operational walkthrough; package summary; close package report; conformance registry verifying slices a–d.
**Validation focus:** Complete chain evidenced; governance and Honest Product rules; ready for Product Owner Package Review.
**Explicit OUT:** Declare W4-E05 CLOSED; claim Wave 4 COMPLETE; Exchange Connectivity Complete; Live Trading product outcomes beyond evidence scope.

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

| Risk                                     | Mitigation (planning)                                        |
| ---------------------------------------- | ------------------------------------------------------------ |
| Hardcoded default persistence            | Explicit inventory; replace defaults only after vendor probe |
| Duplicate persistence owner              | Extend exchange-adapter owner only; mirror E01…E04 patterns  |
| Engine clone temptation                  | RC-27 factory extension rule; architecture review at slices  |
| Simulated permissions without vendor I/O | Honest Product rules; validation requires probe evidence     |
| Cross-workspace permission leak          | Workspace Isolation + Vault scoped retrieve                  |
| E01–E04 capability probe confusion       | Explicit boundary: probe during connect ≠ E05 Complete       |
| Scope creep into Live Trading            | Explicit OUT; Wave 6 gate unchanged                          |

---

## Out-of-scope declarations (binding)

- No Live Trading
- No live order submission
- No Wave 5 / Wave 6 product delivery from this package
- No per-venue Real I/O product outcomes (E01–E04)
- No Wave 4 COMPLETE from planning alone
- No engine clone per venue
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 / Wave 2 / Wave 3 / W4-E01 / W4-E02 / W4-E03 / W4-E04 modifications
- No ownership changes
- No Planning Review PASS or Planning APPROVED from this open
- No implementation slices opened

---

**STOP.** Planning **OPEN** only. Await Product Owner Planning Review. Do not create W4-E05-a.
