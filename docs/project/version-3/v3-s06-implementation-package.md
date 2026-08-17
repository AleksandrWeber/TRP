# V3-S06 Workspace Isolation Hardening — Implementation Package

```text
Package:            V3-S06
Name:               Workspace Isolation Hardening
Also known as:      Isolation Proof Product · Workspace Isolation Suite
Wave:               1 — Security Foundation
Capabilities:       SEC-11 (Wave 1 portion)
Date:               2026-08-17
Status:             **CLOSED** — see v3-s06-close-report.md
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)
**Governance:** [`version-3-governance-freeze.md`](./version-3-governance-freeze.md)
**Annexes used (read-only):** Execution Roadmap, Security Vision, Capability Inventory, Product Roadmap, Wave 1 Progress / Security Progress.
**Mandatory:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)
**Constitution:** [`security-default-policy.md`](./security-default-policy.md)

**Companions:**

| Document                                                               | Role                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`v3-s06-product-scope.md`](./v3-s06-product-scope.md)                 | IN / OUT, customer meaning, ownership, acceptance              |
| [`v3-s06-security-review.md`](./v3-s06-security-review.md)             | Threat model, isolation outcomes, Verification Standard intent |
| [`v3-s06-validation-plan.md`](./v3-s06-validation-plan.md)             | How Close is proven                                            |
| [`workspace-isolation-overview.md`](./workspace-isolation-overview.md) | Operator / PO language product                                 |
| [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md)           | Planning matrix foundation                                     |
| [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md)               | Product Owner Wave 1 exit governance                           |

**Prerequisites:**

| Prerequisite                     | Status                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Version 2                        | **CERTIFIED**                                                                |
| V3-S01 Authentication & Session  | **CLOSED**                                                                   |
| V3-S02 RBAC Product              | **CLOSED**                                                                   |
| V3-S03 Secret Vault & Encryption | **Platform Complete CLOSED** (Customer Complete may remain open under Vault) |
| V3-S04 OWASP & API Hardening     | **CLOSED**                                                                   |
| V3-S05 Audit Trail Foundation    | **CLOSED**                                                                   |
| Master Plan                      | **FROZEN**                                                                   |
| Security Verification Standard   | **Approved** (mandatory)                                                     |
| Wave 1 Exit                      | **NOT claimed**                                                              |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package).** Scope, owners, and exit criteria are already in the frozen Master Plan (SEC-11 / V3-S06). This package only sequences proof work inside that freeze. Version 2 remains certified. The Master Plan is not modified. No new bounded context is invented.

```text
S06 proves workspace isolation across the Security Foundation.
It does NOT redesign Auth, RBAC, Vault, Audit, or Platform.
It does NOT open Connection Management.
It does NOT claim Wave 1 COMPLETE by itself.
Isolation is verification — not ownership change.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (awaiting PO review)
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← S06-a … S06-e only
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
Close                    → then Wave 1 Certification Audit
        ↓
Wave 1 COMPLETE          ← Product Owner only, after audit PASS
        ↓
Wave 2 may open
```

Do not skip a stage. Do not start Wave 2 from this package. Do not claim Wave 1 COMPLETE at S06 Close alone.

---

## Overview

V3-S06 is the final Wave 1 Security Foundation package. It turns “workspaces should be isolated” into **executed proof** that Workspace A never obtains Workspace B data across Authentication, Authorization, Vault, Security Audit (including Timeline and Incidents), Workspace membership, and the future Connection Management boundary. Security Platform contributes hardening evidence under S04 but does not own tenant state.

This package is about **proof**. Not assumptions. Not architecture diagrams as substitutes. Not code ownership transfers.

| Field                                | Value                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Package ID                           | V3-S06                                                                                                              |
| Master Plan / Execution Roadmap name | Workspace Isolation Hardening                                                                                       |
| Product name                         | Isolation Proof Product                                                                                             |
| Wave                                 | 1 — Security Foundation                                                                                             |
| Capabilities (inventory IDs)         | SEC-11 Workspace Isolation (Wave 1 portion; remainder Wave 9)                                                       |
| Complexity                           | M                                                                                                                   |
| Previous package                     | V3-S05 Audit Trail Foundation (**CLOSED**)                                                                          |
| Next after S06 Close                 | Wave 1 Certification Audit → Product Owner Wave 1 COMPLETE → Wave 2 Connection Management at Implementation Package |

---

## Business Goal

- **Goal:** Prove every workspace is isolated from every other workspace across the Security Foundation so Wave 1 can exit honestly before Connection Management holds customer credentials.
- **Master Plan reference:** §4 Wave 1 exit “I cannot see another workspace’s data”; §7 Workspace isolation (Wave 1 fail-closed; Wave 9 teams); Execution Roadmap V3-S06 / SEC-11; Security Vision § Workspace isolation (V3-S06); Capability Inventory SEC-11.
- **Metric this package must meet or not regress (Master Plan §6):** cross-workspace leak **0** for in-scope Wave 1 surfaces; credential exposure **0**; default misconfig **0**. S06 must not regress S01–S05 journeys. Time-to-connect-Binance remains Wave 4.

---

## Customer Problem

- **Problem:** S01–S05 shipped security products with membership and workspace-scoped behavior in places, but Wave 1 still lacks a finished **isolation proof product**. The business cannot yet claim the Master Plan line “I cannot see another workspace’s data” as exit-complete evidence.
- **Who feels it:** Product Owner / business (cannot open Wave 2 honestly); future customers (tenancy risk before credentials); auditors (assumption vs proof).
- **What they must do today that they should not:** Trust slideware, tribal knowledge, or “it probably fails closed” instead of a matrix of executed negatives.

---

## Business Value

- **Value delivered at S06 Close:** Isolation Matrix proved; cross-workspace denial evidenced; isolation regressions automated; Wave 1 Exit Checklist isolation rows eligible for ✅; Certification Audit may begin.
- **Value delivered only after Certification Audit + PO declaration:** Wave 1 COMPLETE; Wave 2 Connection Management may open.
- **What remains blocked until later packages:** Connections product (Wave 2); venue I/O (Wave 4); monitoring (Wave 3); live trading (Wave 6); Wave 9 teams isolation remainder; billing.

---

## Mandatory Planning Sections

### 1. Isolation Principles

These principles are binding for S06 planning, implementation, Close, and Wave 1 exit evidence.

| #   | Principle                    | Meaning                                                                                                                                        |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Prove, don’t assume**      | “Membership exists” is not Close evidence. Every matrix surface needs executed PASS proof in S06.                                              |
| P2  | **Fail closed**              | Missing, forged, or wrong workspace context denies. Convenience never opens “all tenants.”                                                     |
| P3  | **Positive + negative**      | Allowed A-only visibility **and** A↛B denial are both required.                                                                                |
| P4  | **No payload on deny**       | Cross-tenant deny must not return B’s secrets, sessions, people, or audit facts.                                                               |
| P5  | **Cross-product same story** | Auth, RBAC, Vault, Audit, Timeline, Incidents, and Workspace membership must not disagree on tenancy. Platform hardening remains S04 evidence. |
| P6  | **No new bounded context**   | Isolation is a property verified on existing owners — not a new Isolation Service empire.                                                      |
| P7  | **No ownership change**      | S01–S05 keep their SoTs. S06 owns proof and exit evidence.                                                                                     |
| P8  | **No assumption credit**     | Prior package Close does not auto-check an S06 matrix row.                                                                                     |
| P9  | **Regression forever**       | Fixed isolation holes leave automated tests in the ordinary suite.                                                                             |
| P10 | **Honest Wave 1 exit**       | S06 Close ≠ Wave 1 COMPLETE. Certification Audit is mandatory before COMPLETE.                                                                 |
| P11 | **Boundary for Connections** | Wave 2 must inherit a proved boundary; S06 does not implement Connections.                                                                     |
| P12 | **Wave 9 honesty**           | SEC-11 remainder (teams / harder SaaS) stays Wave 9 — not silently claimed here.                                                               |

### 2. Isolation Matrix

Canonical planning foundation: [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md).

S06 must execute proof for every row below. Planning status ✅ means the row is identified; execution status starts ⏳ until suite PASS.

| Product surface                           | Isolation owner                      | Proof required                                                                                                                                       | Evidence type                                                     | Planning | Execution          |
| ----------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- | ------------------ |
| Authentication / identity binding         | Auth                                 | A cannot act as B’s operator; session resolution cannot leak cross-workspace subject binding                                                         | Negative HTTP / session resolution; fail-closed membership        | ✅       | ⏳                 |
| Session                                   | Auth                                 | A cookies/tokens never authorize B reads/mutations; session lists do not expose B                                                                    | Cross-workspace session list/deny; cookie-auth negatives          | ✅       | ⏳                 |
| RBAC / People / role assignment           | Identity                             | Identity-global People and role assignment never substitute for Workspace membership; non-Admins cannot list or mutate People                        | `role ≠ membership` regression                                    | ✅       | ✅                 |
| Vault secrets                             | Vault                                | A cannot read, list, unwrap, or lifecycle-operate B secrets                                                                                          | Vault access-control negatives; ownership fail-closed             | ✅       | ⏳                 |
| Security Audit store                      | Audit                                | Audit append/read never accepts or returns another workspace’s records                                                                               | Repository/service workspace-scope; write attribution fail-closed | ✅       | ⏳                 |
| Timeline                                  | Audit                                | A timeline never includes B events; cursor cannot hop tenants                                                                                        | Timeline HTTP/service isolation; wrong-workspace deny             | ✅       | ⏳                 |
| Incident / investigation                  | Audit                                | Workspace-bound incidents refuse mixed evidence; internal investigation/export assemble linked same-workspace events; no customer HTTP caller exists | Mixed-evidence negative regression                                | ✅       | ✅                 |
| Security Platform tenancy                 | Platform                             | Not applicable: Platform owns hardening, not workspace-scoped tenant state                                                                           | V3-S04 Close evidence                                             | ✅       | **NOT APPLICABLE** |
| Workspace membership / boundary           | Workspace / Identity                 | Membership is the gate; non-members get honest deny                                                                                                  | Membership gate tests; consistent deny semantics                  | ✅       | ⏳                 |
| Future Connection Management boundary     | Wave 2 owner (boundary verified now) | Connections not available as product; no path that reads foreign workspace credentials “early”                                                       | Boundary unavailable/deny tests; no Connections product scope     | ✅       | ⏳                 |
| Wave 1 security route ownership inventory | Owning package of that endpoint      | Every security-relevant route maps to an owner and PASS/N/A matrix row                                                                               | Close route→owner inventory                                       | ✅       | ✅                 |

**Proof standard (binding):** for each row — (1) positive scope, (2) negative cross-tenant, (3) fail closed, (4) no assumption credit from prior Close.

### 3. Isolation Proof Strategy

```text
Two workspaces A and B with distinct security-relevant data
        ↓
Authorized caller for A only
        ↓
For each matrix surface:
   positive scope (A sees A)
   negative cross-tenant (A ↛ B)
   fail closed (bad/missing context denies)
        ↓
Record evidence against the matrix
        ↓
Isolation Proof Walkthrough (Product Review)
        ↓
S06 Close only if every row PASS
```

| Strategy element        | Required                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| Dual-workspace fixtures | Distinct identities, roles as needed, vault/audit/session facts in A and B     |
| Product-path negatives  | HTTP/API (and UI where the surface exists) — not mocks of the customer outcome |
| Cross-product sweep     | One suite narrative covering S01–S05 surfaces, not five disconnected anecdotes |
| Endpoint inventory      | During S06, newly noticed Wave 1 routes are added to the matrix before Close   |
| Side-channel honesty    | Follow S04 anti-enumeration policy; never return B payloads on deny            |
| Evidence artifacts      | Validation results map 1:1 to matrix rows                                      |

### 4. Isolation Regression Strategy

| Rule                             | Meaning                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| §19 applies                      | Every found-and-fixed isolation defect owned during S06 leaves an automated regression test                 |
| Matrix ↔ tests                   | Orphan matrix rows are Close blockers                                                                       |
| Ordinary CI                      | Isolation suite runs with ordinary tests — not a one-off manual ceremony                                    |
| No flake PASS                    | Flaky isolation tests are REQUIRES ACTION                                                                   |
| Retain prior package regressions | S01–S05 security regressions remain green; S06 adds isolation coverage                                      |
| Wave 2 inheritance               | Connections packages must extend the matrix when they add tenant-scoped routes — documented expectation now |

### 5. Wave 1 Exit Criteria

Product Owner checklist: [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md).

| Requirement                  | Evidence required before ✅                                    | S06 role                                                |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Authentication               | S01 Close                                                      | Already ✅                                              |
| Authorization                | S02 Close                                                      | Already ✅                                              |
| Vault Platform               | S03 Platform Complete Close                                    | Already ✅                                              |
| Security Platform            | S04 Close                                                      | Already ✅                                              |
| Security Audit               | S05 Close                                                      | Already ✅                                              |
| Workspace Isolation          | S06 Close + suite PASS                                         | **S06 delivers**                                        |
| Cross-workspace verification | Isolation Matrix all rows PASS                                 | **S06 delivers**                                        |
| Security Regression          | Isolation Regression Suite PASS (+ retained prior regressions) | **S06 delivers**                                        |
| Wave 1 Certification Audit   | Independent audit after S06 Close                              | **S06 prepares inputs; does not self-certify COMPLETE** |

**Exact evidence before claiming Wave 1 COMPLETE:**

1. All Exit Checklist rows ✅
2. Independent Wave 1 Certification Audit report with PASS
3. Product Owner written declaration: **Wave 1 COMPLETE**
4. Only then may Wave 2 Connection Management open at Implementation Package

**S06 Close alone is insufficient for Wave 1 COMPLETE.**

#### Wave 1 Certification Audit (planned; runs after S06 Close)

| Audit must confirm                                                           |     |
| ---------------------------------------------------------------------------- | --- |
| All S01–S06 closed with accepted evidence                                    |     |
| Implementation vs Master Plan Wave 1 outcomes                                |     |
| Product Principles respected                                                 |     |
| Security Default Policy respected                                            |     |
| Security Verification Standard respected (honest N/A where grandfathered)    |     |
| No package violated ownership / bounded-context rules                        |     |
| Isolation proved (matrix + suite)                                            |     |
| Wave 1 truly finished — no silent deferral of a Wave 1 exit line into Wave 2 |     |

---

## Mandatory Questions

| #   | Question                                  | Answer (planning)                                                                                                                                                                 |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What does the customer receive?           | Isolation proof across Wave 1 security products; cross-workspace denial evidence; isolation regressions; Wave 1 exit evidence for isolation rows; inputs for Certification Audit  |
| 2   | What does the customer NOT receive?       | Connection Management, exchanges, live trading, monitoring, billing, Wave 2, Wave 9 teams remainder, a new Isolation bounded context, Wave 1 COMPLETE without Certification Audit |
| 3   | What business problem does S06 solve?     | Wave 1 cannot yet prove “I cannot see another workspace’s data” as exit-complete evidence before Connections                                                                      |
| 4   | Which products are verified?              | Auth, Session, RBAC/People, Vault Platform, Security Platform (tenancy-relevant), Security Audit, Timeline, Incidents, Connection Management **boundary**                         |
| 5   | Does S06 introduce a new bounded context? | **No**                                                                                                                                                                            |
| 6   | Was the Master Plan respected?            | **Yes** — V3-S06 / SEC-11 Wave 1; no Master Plan edit                                                                                                                             |
| 7   | Were Product Principles respected?        | **Yes (intent)** — especially Security Before Convenience, Honest Product, Architecture Is a Constraint, Customer First                                                           |

---

## Current State

| Capability or surface              | Status                                      | Evidence                                      |
| ---------------------------------- | ------------------------------------------- | --------------------------------------------- |
| Auth / session workspace binding   | Already exists (needs proof suite)          | S01 Closed                                    |
| RBAC / People workspace discipline | Already exists (needs proof suite)          | S02 Closed; must not punch holes              |
| Vault workspace ownership          | Already exists (needs proof suite)          | S03 Platform Complete; S03-d isolation slices |
| Audit / Timeline / Incident scope  | Already exists (needs proof suite)          | S05 Closed; workspace-scoped reads claimed    |
| Security Platform                  | Already exists (needs tenancy bypass check) | S04 Closed                                    |
| Isolation **suite product**        | Missing                                     | This package                                  |
| Wave 1 Exit claim                  | Missing                                     | Exit Checklist + Certification Audit          |
| Connection Management              | Out of this package                         | Wave 2                                        |

Facts implementers must not forget:

- Prior Close reports are prerequisites, not matrix PASS credit.
- S03 Customer Complete UI may still be open under Vault — Wave 1 vault outcome is Platform Complete.
- Wave 1 Exit has **not** been claimed.

---

## Reuse from Version 2

| Stance          | This package                                                                              |
| --------------- | ----------------------------------------------------------------------------------------- |
| Reuse unchanged | Workspace membership concepts; certified Version 2 paper path; Gate/Risk/Ledger untouched |
| Minor extension | Isolation proof harness / suite around existing owners                                    |
| Major extension | Nothing                                                                                   |
| New justified   | Only the isolation **proof** obligation already named as V3-S06 / SEC-11                  |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library                   |

Owner from Master Plan §11:

| Area                      | Owner                | This package must not own  |
| ------------------------- | -------------------- | -------------------------- |
| Authentication / sessions | Auth                 | Session SoT rewrite        |
| Roles / People            | Identity / Authz     | Second RBAC                |
| Vault                     | Vault                | Ciphertext / wrapping keys |
| Audit                     | Security Audit       | Second audit store         |
| Workspace membership      | Workspace / Identity | New tenancy engine         |
| Connections               | Wave 2               | Connections product        |

---

## Dependencies

| Dependency                     | Kind                 | Status required before this package |
| ------------------------------ | -------------------- | ----------------------------------- |
| Version 2 certified baseline   | Version 2 product    | Exists                              |
| V3-S01                         | Earlier V3 package   | Closed                              |
| V3-S02                         | Earlier V3 package   | Closed                              |
| V3-S03 Platform Complete       | Earlier V3 package   | Closed                              |
| V3-S04                         | Earlier V3 package   | Closed                              |
| V3-S05                         | Earlier V3 package   | Closed                              |
| Security Verification Standard | Host / process       | Approved                            |
| Security Default Policy        | Process constitution | In force                            |

This package does **not** depend on:

- Connection Management
- Exchange adapters going live
- Monitoring dashboards
- Billing
- Wave 9 teams
- Vault Customer Complete UI (if still open)

---

## Implementation Scope

### IN Scope

| Item                                    | Customer meaning                                     | Notes / owner inside existing domain |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| Isolation Principles                    | Shared definition of proved isolation                | This package                         |
| Isolation Matrix execution              | Every surface has PASS evidence                      | Extends wave-1-isolation-matrix      |
| Cross-workspace denial suite            | A ↛ B across Wave 1 security products                | Verify existing owners               |
| Cross-product isolation                 | One coherent tenancy story                           | Auth…Audit…Platform                  |
| Isolation regression suite              | Defects never return                                 | Verification Standard §19            |
| Connection Management boundary          | Not available / deny; no early credential cross-read | Boundary only                        |
| Wave 1 exit evidence for isolation rows | Checklist can move to ✅                             | wave-1-exit-checklist                |
| Certification Audit input pack          | Index of S01–S06 evidence                            | Audit runs after Close               |

### OUT OF Scope

| Item                                       | Why out                   | Owner later      |
| ------------------------------------------ | ------------------------- | ---------------- |
| Connection Management product              | Wave 2                    | V3-C01–C04       |
| Exchange integrations                      | Wave 4                    | V3-E*            |
| Live Trading                               | Wave 6                    | Live + ADR       |
| Monitoring                                 | Wave 3                    | V3-O05           |
| Billing                                    | Later                     | Billing packages |
| Wave 2 start                               | Needs Wave 1 COMPLETE     | Product Owner    |
| New bounded context                        | Forbidden                 | —                |
| Ownership changes                          | Forbidden                 | —                |
| Architecture redesign                      | Verification only         | —                |
| Wave 9 SEC-11 remainder                    | Deferred                  | Wave 9           |
| Declaring Wave 1 COMPLETE inside S06 Close | Needs Certification Audit | Exit checklist   |

---

## Product Acceptance Criteria

See [`v3-s06-product-scope.md`](./v3-s06-product-scope.md). Summary:

| #   | Outcome                                                                                                            | Fail if                                        |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 1   | Matrix complete for all Wave 1 security surfaces + CM boundary                                                     | Missing surface without named N/A              |
| 2   | Every applicable row: positive + negative + fail-closed PASS; each exclusion has an explicit NOT APPLICABLE reason | Assumption credit or an undocumented exclusion |
| 3   | No cross-workspace data disclosure                                                                                 | Any B payload to A                             |
| 4   | Isolation regressions automated                                                                                    | One-off manual-only proof                      |
| 5   | Exit Checklist isolation rows evidence-ready                                                                       | ✅ without PASS                                |
| 6   | Honest non-claim of Wave 1 COMPLETE / Connections                                                                  | Premature claims                               |
| 7   | No new bounded context / ownership drift                                                                           | Architecture violation                         |
| 8   | Master Plan isolation line evidenced                                                                               | Claim without suite                            |

---

## Product Walkthrough

```text
Isolation Proof Walkthrough

□ Two distinct workspaces A and B exist with distinct security-relevant data
□ Sign in as an authorized operator of Workspace A only
□ Confirm A can use allowed A surfaces (positive scope smoke)
□ Attempt cross-workspace reads/mutations against B for:
        sessions · People/roles · vault · audit timeline · incidents
□ Each attempt fails closed (honest deny; no B payloads)
□ Confirm Security Platform is recorded as NOT APPLICABLE to tenant-state isolation and references V3-S04 Close hardening evidence
□ Confirm Connection Management is not offered as an available product path
□ Review Isolation Matrix evidence: every row PASS or explicitly NOT APPLICABLE
□ Confirm Wave 1 COMPLETE is still not claimed pending Certification Audit

PASS / REQUIRES ACTION
```

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Walkthrough name        | Isolation Proof Walkthrough |
| Executed in the product | Required at Close           |
| Overall                 | Pending implementation      |

---

## Architecture Review (planning intent)

| Rule                                                           | Decision                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | **PASS (intent)** — proof suite only; SEC-11 verification            |
| No ownership drift                                             | **PASS (intent)** — Auth/Identity/Vault/Audit/Platform keep SoTs     |
| No duplicate Source of Truth                                   | **PASS (intent)** — no second membership/audit/vault                 |
| HTTP remains transport; UI remains not Source of Truth         | **PASS (intent)**                                                    |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | **Unchanged**                                                        |
| Justified persistence/ports inside an existing owner           | **N/A / minimal** — prefer tests and harnesses; no new tenancy store |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track; Isolation Service as a new domain.

Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) at Close with evidence.

---

## Security Review (planning)

Companion: [`v3-s06-security-review.md`](./v3-s06-security-review.md).

| Category               | Verdict                 |
| ---------------------- | ----------------------- |
| Spoofing               | PASS (intent)           |
| Tampering              | PASS (intent)           |
| Repudiation            | PASS (intent)           |
| Information Disclosure | PASS (intent) — primary |
| Denial of Service      | PASS (intent)           |
| Elevation of Privilege | PASS (intent)           |

Threats this package must reduce: cross-tenant data theft, IDOR/BOLA, credential amplification, audit reconnaissance across tenants.

Controls explicitly not this package: session crypto (S01), role catalog (S02), vault encryption (S03), CSP/rate limits product (S04), append-only store (S05), Connections (Wave 2), monitoring (O05).

Security Verification Standard + Regression Suite: **mandatory** at Close.

---

## Implementation Slices

Do not implement in this planning task. Merge order below.

### S06-a — Isolation harness & matrix freeze

**Goal:** Dual-workspace fixtures and an executable matrix contract aligned to [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md). Freeze proof standard (positive / negative / fail-closed).

**Touch (expected):** Test harness / fixtures; matrix tracking artifact; no product redesign.

**Done when:** A/B fixtures exist; every matrix row is listed as a required case family; no Connections product code.

**Must not:** Redesign Auth/Vault/Audit; open Wave 2; claim any matrix PASS without tests.

### S06-b — Identity surfaces isolation proof

**Goal:** Prove Auth, Session, RBAC/People, and membership gate isolation (A ↛ B).

**Touch (expected):** Isolation tests against existing Auth/Identity HTTP and domain gates.

**Done when:** Matrix rows for Authentication, Session, RBAC/People, membership gate PASS.

**Must not:** Change role catalog meaning; invent teammate invites; weaken anti-enumeration into a tenancy leak.

### S06-c — Vault isolation proof

**Goal:** Prove Vault secrets cannot be read, listed, or lifecycle-operated across workspaces.

**Touch (expected):** Isolation tests against Vault platform paths; ownership fail-closed evidence.

**Done when:** Vault matrix row PASS; no plaintext in deny paths.

**Must not:** Build Vault Customer Complete UI; retrieve plaintext to “make tests easier”; add Exchange consumers.

### S06-d — Audit product isolation proof

**Goal:** Prove Security Audit store, Timeline, Incidents, and export/investigation assembly never cross tenants.

**Touch (expected):** Isolation tests against Audit/Timeline/Incident paths.

**Done when:** Audit, Timeline, Incident matrix rows PASS; no mixed-tenant evidence.

**Must not:** Build monitoring; rewrite append-only store; claim SEC-16 live financial complete.

### S06-e — Platform boundary, regression, exit pack, Close

**Goal:** Security Platform tenancy bypass checks; Connection Management boundary unavailable/deny; Isolation Regression Suite complete; Wave 1 Exit evidence pack; Verification Standard Close; prepare Certification Audit inputs.

**Touch (expected):** Remaining matrix rows; regression suite wiring; Close reports; exit checklist evidence references.

**Done when:** Entire matrix PASS; Regression Suite PASS; S06 Close Checklist ready; Certification Audit input index exists; Wave 1 COMPLETE still **not** declared.

**Must not:** Declare Wave 1 COMPLETE; start Wave 2 implementation; edit Master Plan or Version 2 certification.

---

## Validation Plan

Companion: [`v3-s06-validation-plan.md`](./v3-s06-validation-plan.md).

| Gate                                                 | Required                                  | Evidence                              |
| ---------------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| Unit tests                                           | Yes                                       | Scope helpers; deny shaping; fixtures |
| Integration tests                                    | **Yes — primary**                         | Isolation Suite vs matrix             |
| UI tests                                             | Yes where UI exists; else N/A per surface | Honest deny / no Connections claim    |
| Manual product walkthrough                           | Yes                                       | Isolation Proof Walkthrough           |
| Security verification (checklist)                    | Yes                                       | Close Security Review                 |
| Security Verification Standard + Regression Suite    | **Yes**                                   | Mandatory                             |
| Architecture verification                            | Yes                                       | Checklist                             |
| Product verification                                 | Yes                                       | Checklist                             |
| Customer acceptance of Master Plan isolation outcome | Yes                                       | Matrix + walkthrough                  |
| Wave 1 COMPLETE                                      | **Not claimed at S06 Close**              | Certification Audit + PO declaration  |

---

## Required Reports

| Report                       | When                        | Path convention                                              |
| ---------------------------- | --------------------------- | ------------------------------------------------------------ |
| Implementation Package       | Before Approval             | `v3-s06-implementation-package.md` (this file)               |
| Implementation Report        | After Implementation        | `v3-s06-implementation-report.md` (and/or per-slice reports) |
| Architecture Review          | After Implementation Report | `v3-s06-architecture-review.md`                              |
| Security Review              | After Architecture Review   | Update `v3-s06-security-review.md` with evidence             |
| Product Review               | After Security Review       | `v3-s06-product-review.md` with walkthrough                  |
| Validation evidence          | After Product Review        | `v3-s06-validation-plan.md` results                          |
| Package Close record         | At Close                    | Close Checklist + Package Summary                            |
| Wave 1 Certification Audit   | **After** S06 Close         | Separate audit document — Product Owner commissions          |
| Wave 1 Exit Checklist update | After audit                 | `wave-1-exit-checklist.md` rows → ✅ then COMPLETE           |

**Forbidden:** Version 2-style RC documents; ADRs; Master Plan edits; Version 2 certification edits; claiming Wave 1 COMPLETE inside S06 Close.

---

## Package Close Checklist

A package may be marked **CLOSED** only after **all** of the following are true.

| #   | Gate                                                                                                  | Verdict  |
| --- | ----------------------------------------------------------------------------------------------------- | -------- |
| 1   | Implementation Review — slices done; Implementation Report written; honest limitations recorded       | **PASS** |
| 2   | Architecture Review — no ownership drift; no new bounded context; no duplicate SoT                    | **PASS** |
| 3   | Security Review — checklist + STRIDE + Verification Standard + Regression Suite; zero REQUIRES ACTION | **PASS** |
| 4   | Product Review — checklist + Isolation Proof Walkthrough PASS                                         | **PASS** |
| 5   | Validation — Isolation Matrix all rows PASS or explicitly NOT APPLICABLE; validation plan executed    | **PASS** |
| 6   | All mandatory reports present and consistent                                                          | **PASS** |
| 7   | Master Plan compliance — no invented scope; SEC-11 Wave 1 only                                        | **PASS** |
| 8   | Product Principles compliance                                                                         | **PASS** |
| 9   | Customer walkthrough — no SSH / customer `.env` / manual DB as the proof path                         | **PASS** |
| 10  | Explicit non-claim recorded: Wave 1 COMPLETE still requires Certification Audit                       | **PASS** |

If any row is **NOT DONE**, the package is **not Closed**. Wave 2 must not open.

---

## Customer-visible Changes

**Fill at Close.** Expected planning stance:

- Customer / business receives isolation **proof**, not a new daily Isolation app.
- UI / copy must **not** claim: Wave 1 COMPLETE; Connections available; live ready; “certified unhackable.”

---

## Next Package Dependencies

| Field                               | Value                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| This package unblocks               | Wave 1 Certification Audit; then (after COMPLETE) Wave 2 Connection Management Implementation Package |
| This package does **not** unblock   | Exchange live I/O, monitoring product, billing, live capital, Wave 9 teams                            |
| Remaining wave work after S06 Close | Certification Audit → Wave 1 COMPLETE declaration                                                     |

Do not claim wave exit unless Exit Checklist + Certification Audit + PO declaration are done.

---

## Lessons Learned

Process, reuse, and honesty only. Harness-first isolation proof under existing
module owners avoided duplicate SoT. Matrix and executable contract must stay
aligned at Close.

---

## Package Summary Standard (answers at Close)

1. What did the customer receive?
   Isolation proof across Wave 1 security boundaries and Close/certification evidence inputs.
2. What did the customer NOT receive?
   Connections, live trading, monitoring, billing, Wave 1 COMPLETE, or a new Isolation product surface.
3. What business problem was solved?
   Unproved tenancy no longer blocks honest Wave 1 exit evidence for SEC-11.
4. What remains for later packages?
   Independent Wave 1 Certification Audit → Wave 1 COMPLETE → Wave 2 Connection Management; Wave 9 SEC-11 remainder.
5. Which package becomes available next?
   Independent Wave 1 Certification Audit when commissioned by Product Owner.
6. Was the Master Plan followed?
   **Yes.**
7. Were Product Principles respected?
   **Yes.**
8. Were any architectural deviations introduced?
   **No.**

---

## Future guidance (binding)

1. No future Version 3 package may bypass this process.
2. If this package cannot satisfy the template, implementation stops until planning is updated via Master Plan revision.
3. Do not write production code before Approval.
4. Do not modify Version 2 certification, Spec v2.0, Authority Matrix, or Alias Dictionary.
5. Do not create RC/ADR documents from this package.
6. Live capital remains unauthorized until Wave 6 ADR.
7. Conflicts: **Master Plan wins.**
8. **Wave 1 COMPLETE** requires Certification Audit after S06 Close — no exceptions.

---

## STOP

**V3-S06 is CLOSED.** See [`v3-s06-close-report.md`](./v3-s06-close-report.md).

Do **not** claim Wave 1 COMPLETE.
Do **not** open the independent Wave 1 Certification Audit without Product Owner commission.
Do **not** start Wave 2.
Do **not** edit the Master Plan or Version 2 artifacts from this package.
