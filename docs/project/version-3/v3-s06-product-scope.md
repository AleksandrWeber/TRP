# V3-S06 Product Scope

**Package:** V3-S06 Workspace Isolation Hardening
**Also known as:** Isolation Proof Product · Workspace Isolation Suite
**Wave:** 1 — Security Foundation
**Status:** **CLOSED** — scope was delivered without expansion; see
[`v3-s06-close-report.md`](./v3-s06-close-report.md).
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Umbrella:** [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md)
**Capabilities:** SEC-11 Workspace Isolation (Wave 1 portion)
**Overview:** [`workspace-isolation-overview.md`](./workspace-isolation-overview.md)
**Exit governance:** [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md)
**Matrix foundation:** [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md)

This document freezes **IN / OUT**, **ownership**, **customer outcomes**, and **proof language** for V3-S06. It does not add journeys the Master Plan did not already name. It does not redesign Version 2. It does not invent a new bounded context.

---

## Product purpose

S06 is the Wave 1 **proof** that every workspace is isolated from every other workspace across the Security Foundation.

It **verifies** isolation already owned by Authentication, Authorization / Identity, Vault, Security Audit, and the Security Platform.

It does **not** replace those products.

It does **not** open Connection Management.

It does **not** redesign tenancy architecture.

```text
S06 owns isolation proof and Wave 1 exit evidence.
Owners keep Auth, Identity, Vault, Audit, and Platform.
Isolation is verification — not redesign.
Wave 1 COMPLETE still requires Certification Audit after S06 Close.
```

---

## Why S06 exists (business language)

S01–S05 closed important security products. Membership checks and workspace-scoped reads already exist in places. That is **not** the same as a business-grade claim:

> I cannot see another workspace’s data.

Without S06, Wave 1 would exit on assumptions. Connection Management would then store real customer credentials on an unproven tenancy boundary. That violates **Security Before Convenience** and makes later capital controls dishonest.

S06 exists so Product Owner can claim Wave 1 exit with **evidence**, then allow Wave 2.

---

## Mandatory questions

### 1. What does the customer receive?

Proof — as a product obligation — that Workspace A cannot obtain Workspace B’s identity binding, sessions, People/role data, vault secrets, security audit history, timeline, incidents, or Wave 1 platform-scoped security surfaces. Automated isolation and regression evidence. A completed path to Wave 1 Exit Checklist rows for isolation, cross-workspace verification, and security regression. Preparation for the independent Wave 1 Certification Audit.

### 2. What does the customer NOT receive?

Connection Management, exchange integrations, live trading, monitoring dashboards, billing, Wave 2 features, Wave 9 multi-team SaaS isolation, a new Administration “Isolation” app that replaces security products, or a redesign of Auth/Vault/Audit ownership.

### 3. What business problem does S06 solve?

Wave 1 cannot yet prove cross-workspace denial as a finished Security Foundation exit. Without that proof, the business cannot honestly open Connections on top of S01–S05.

### 4. Which products are verified?

| Product / surface                           | Verified by S06?                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Authentication & Session (S01)              | Yes — isolation proof                                                                           |
| RBAC / People / Authorization (S02)         | Yes — isolation proof                                                                           |
| Secret Vault Platform (S03)                 | Yes — isolation proof                                                                           |
| Security Platform (S04)                     | **NOT APPLICABLE** as a tenant-state isolation owner — V3-S04 Close supplies hardening evidence |
| Security Audit / Timeline / Incidents (S05) | Yes — isolation proof                                                                           |
| Future Connection Management boundary       | Yes — **boundary only** (not-yet / fail closed); not the Connections product                    |
| Connection Management product               | **No** — Wave 2                                                                                 |
| Exchange / Live / Monitoring / Billing      | **No**                                                                                          |

### 5. Does S06 introduce a new bounded context?

**No.** Isolation remains a property of existing owners (Workspace / Identity / Auth / Vault / Audit). S06 adds a proof suite and exit evidence, not a new domain empire.

### 6. Was the Master Plan respected?

**Yes (planning intent).** Package ID V3-S06, capability SEC-11 Wave 1 portion, customer outcome “I cannot see another workspace’s data,” fail-closed tenancy, Wave 9 remainder deferred. No Master Plan edit.

### 7. Were Product Principles respected?

**Yes (planning intent).** Especially Security Before Convenience, Honest Product, Customer First (proof without SSH), Architecture Is a Constraint, Everything Is Auditable (isolation denials remain attributable where already required), One Source of Truth (no duplicate tenancy SoT).

---

## Customer value

After this package Closes (and after Certification Audit for wave exit):

- The business can treat Wave 1 tenancy as **proved**
- Cross-workspace denial is evidenced for every Isolation Matrix row
- Isolation regressions are automated
- Wave 1 Exit Checklist isolation rows can move to ✅
- Wave 2 Connection Management may open **only after** Wave 1 COMPLETE

Wave 1 exit line this package owns (Master Plan):

> I cannot see another workspace’s data.

This package does **not** own:

> I save Binance credentials… (Wave 2)
> Monitoring thresholds / health dashboard (Wave 3)
> Live trading (Wave 6)
> Multi-team SaaS isolation remainder (Wave 9)

---

## Explicit receive / not-receive table

| Customer receives                                                | Customer does NOT receive               |
| ---------------------------------------------------------------- | --------------------------------------- |
| Isolation proof across Wave 1 security products                  | A new Isolation bounded context         |
| Cross-workspace denial evidence                                  | Connection Management UI/API product    |
| Fail-closed tenancy verification                                 | Exchange “Connected” honesty rewrite    |
| Isolation regression suite                                       | Live trading enablement                 |
| Wave 1 exit evidence pack for isolation rows                     | Monitoring / Grafana                    |
| Connection Management **boundary** stance (not available / deny) | Billing, invites, Wave 9 teams          |
| Honest non-claim until Certification Audit                       | Automatic Wave 1 COMPLETE without audit |

---

## Ownership (binding)

| Concern                                                      | Owner                                                    | Must not own                         |
| ------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------ |
| Isolation **proof suite** and Wave 1 isolation exit evidence | **S06**                                                  | Replacing Auth/Vault/Audit products  |
| Session / identity binding isolation rules                   | Authentication (S01)                                     | S06 rewriting session SoT            |
| People / role / permission isolation rules                   | Authorization / Identity (S02)                           | S06 inventing a second RBAC          |
| Secret ownership / retrieve isolation                        | Vault (S03)                                              | S06 storing secrets                  |
| Audit / Timeline / Incident workspace scope                  | Security Audit (S05)                                     | S06 building a second audit store    |
| Platform abuse / headers / CSRF consistency                  | Security Platform (S04)                                  | S06 becoming OWASP rewrite           |
| Workspace membership gate                                    | Workspace / Identity (existing)                          | New tenancy engine                   |
| Connection Management product                                | Wave 2 (`V3-C*`)                                         | Fake Connections under S06           |
| Wave 1 Certification Audit                                   | Independent audit after S06 Close; Product Owner accepts | Developer self-certify as substitute |
| Wave 9 teams / harder SaaS isolation                         | Wave 9                                                   | Claiming SEC-11 complete forever     |

**Bounded context:** S06 does **not** introduce a new bounded context. Master Plan already names workspace isolation as Wave 1 fail-closed verification with Wave 9 remainder.

---

## IN Scope

| Item                                             | Customer meaning                                                                                  | Notes / owner inside existing domain                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Isolation Principles (binding)                   | What “isolated” means for Wave 1                                                                  | Documented in Implementation Package                                 |
| Isolation Matrix (executable)                    | Every surface has a proof row                                                                     | Extends [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md) |
| Cross-workspace denial suite                     | A ↛ B for Auth, Session, RBAC/People, Vault, Audit, Timeline, Incidents, and Workspace membership | Evidence, not redesign; Platform hardening remains S04 evidence      |
| Positive workspace scope                         | Caller in A sees only A where allowed                                                             | Part of proof standard                                               |
| Fail-closed missing/wrong workspace context      | Unclear tenancy denies                                                                            | Security Default Policy                                              |
| Isolation regression suite                       | Found/fixed isolation defects never return                                                        | Security Verification Standard §19                                   |
| Cross-product isolation                          | Same tenancy story across S01–S05 products                                                        | No product may be “exempt by assumption”                             |
| Future Connection Management boundary            | Connections not available; no tenancy hole left for Wave 2 to inherit blindly                     | Boundary only                                                        |
| Wave 1 Exit Criteria evidence for isolation rows | Checklist rows become ✅ only with PASS evidence                                                  | [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md)             |
| Preparation pack for Wave 1 Certification Audit  | Inputs the independent audit needs                                                                | Audit runs **after** S06 Close                                       |

---

## OUT OF Scope

| Item                                            | Why out                                         | Owner later (or Master Plan deferral)                    |
| ----------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Connection Management product                   | Wave 2                                          | `V3-C01`–`C04`                                           |
| Exchange integrations / real venue I/O          | Wave 4                                          | `V3-E*`                                                  |
| Live Trading                                    | Wave 6                                          | Live packages + ADR                                      |
| Monitoring / health dashboard                   | Wave 3                                          | `V3-O05`                                                 |
| Billing                                         | Later wave                                      | Billing packages                                         |
| Wave 2 start from this package                  | Requires Wave 1 COMPLETE                        | Product Owner declaration                                |
| Vault Customer Complete UI (if still open)      | Vault-owned; not isolation suite                | S03 Customer Complete                                    |
| New bounded context “Isolation Service”         | Forbidden                                       | —                                                        |
| Ownership changes (Auth/Vault/Audit move)       | Forbidden                                       | —                                                        |
| Architecture redesign of membership             | Verification only                               | —                                                        |
| Wave 9 multi-team isolation remainder           | SEC-11 remainder                                | Wave 9                                                   |
| External penetration test as Close substitute   | May inform audit; does not replace matrix suite | Host / later                                             |
| Claiming Wave 1 COMPLETE inside S06 Close alone | Certification Audit mandatory after Close       | [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md) |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                                                                                                                                             | Fail if                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Isolation Matrix covers Auth, Session, RBAC/People, Vault, Audit, Timeline, Incidents, membership gate, route ownership inventory, and Connection Management boundary; Security Platform has an explicit N/A reason | Any Wave 1 security surface missing without named N/A                         |
| 2   | For every applicable matrix row: positive scope + negative cross-tenant + fail-closed proof PASS; every N/A has an explicit reason                                                                                  | Any row assumed from prior Close without S06 evidence                         |
| 3   | Cross-workspace attempts cannot read B’s sessions, People, vault secrets, audit/timeline/incident facts from A credentials                                                                                          | Any leak, empty-list ambiguity that discloses B, or fall-open                 |
| 4   | Isolation regressions are automated and run with ordinary tests                                                                                                                                                     | Isolation fixed once with no lasting test                                     |
| 5   | Product Owner can complete isolation-related Wave 1 Exit Checklist rows from evidence                                                                                                                               | Checklist marked ✅ without suite PASS                                        |
| 6   | Honest product: no claim of Connections, live, monitoring, or Wave 1 COMPLETE from S06 Close alone                                                                                                                  | UI/docs claim Wave 1 COMPLETE or Connections ready before Certification Audit |
| 7   | No new bounded context; no ownership drift                                                                                                                                                                          | New Isolation module empire or stolen SoT                                     |
| 8   | Master Plan Wave 1 line “I cannot see another workspace’s data” is evidenced                                                                                                                                        | Outcome claimed without matrix PASS                                           |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys. Engineers may run the isolation suite in CI; Product Owner acceptance is of **results**, not of SQL walkthroughs.

---

## Product Walkthrough (Isolation Proof Walkthrough)

Required in Product Review. Repeat at Close.

```text
Isolation Proof Walkthrough

□ Two distinct workspaces A and B exist with distinct security-relevant data
□ Sign in as an authorized operator of Workspace A only
□ Confirm A can use allowed A surfaces (positive scope smoke)
□ Attempt cross-workspace reads/mutations against B for:
        sessions · People/roles · vault · audit timeline · incidents
□ Each attempt fails closed (honest deny; no B payloads)
□ Confirm Security Platform is explicitly NOT APPLICABLE to tenant-state isolation and references V3-S04 Close hardening evidence
□ Confirm Connection Management is not offered as an available product path
□ Review Isolation Matrix evidence: every row PASS or explicitly NOT APPLICABLE
□ Confirm Wave 1 COMPLETE is still not claimed pending Certification Audit

PASS / REQUIRES ACTION
```

---

## STOP

Planning only. **Do not implement** until Product Owner approves the V3-S06 Implementation Package.
Wave 1 Exit is **not** claimed from this document.
