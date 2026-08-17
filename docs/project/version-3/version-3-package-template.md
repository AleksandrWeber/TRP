# Version 3 Package Template

**Document:** Version 3 Package Template
**Date:** 2026-08-16
**Status:** Binding execution standard for every `V3-*` package
**Extended:** 2026-08-16 — Product Walkthrough (Product Review) and Threat Review (Security Review) are mandatory
**Extended:** 2026-08-16 — Session walkthrough must include refresh reuse → family revoke when the package owns sessions
**Extended:** 2026-08-17 — Optional dual Close naming when planned: **Platform Complete** (domain ready for consumers) vs **Customer Complete** (operators can use the product surface). See [`version-3-implementation-policy.md`](./version-3-implementation-policy.md) binding rule 12 and [`v3-s03-close-criteria-resolution.md`](./v3-s03-close-criteria-resolution.md).
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md)
**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)
**Nature:** Template. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

Copy this file for every Version 3 package. Replace placeholders. Do not delete sections. If a section does not apply, write **NOT APPLICABLE**, name the owning package or Master Plan deferral, and stop. Do not invent work to fill a blank.

**Canon companions (mandatory, copy and complete per package):**

| Checklist / standard  | File                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Security              | [`version-3-security-checklist.md`](./version-3-security-checklist.md)                         |
| Security verification | [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md) |
| Product               | [`version-3-product-checklist.md`](./version-3-product-checklist.md)                           |
| Architecture          | [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md)                 |

---

## How to use this template

1. Identify the package ID from the Master Plan / Execution Roadmap. If the work is not listed, **stop**.
2. Create `docs/project/version-3/v3-<id>-implementation-package.md` from this template (example: `v3-s02-implementation-package.md`).
3. Fill every required section below **before** Approval.
4. Complete the three checklists at Implementation Package time (planning verdicts) and again at Close (evidence verdicts). Product Review must include the Product Walkthrough artifact. Security Review must include the Threat Review (STRIDE) table. Packages that start after the Security Verification Standard is approved must also complete that standard (every category, every row) and the Security Regression Suite.
5. Do not write production code until this package is **Approved**.
6. Do not mark the package **Closed** until the Package Close Checklist and Package Summary Standard are complete.

V3-S01 already has an approved Implementation Package written before this template existed. S01 **implementation, reviews, validation, and Close** must still follow this lifecycle, these checklists, and the Package Summary Standard. Every package after S01 must be authored from this template.

S01-a is **accepted** without a Product Walkthrough artifact or a STRIDE Threat Review table. Do **not** rewrite S01-a reports. Every subsequent slice review and every subsequent package (starting S01-b) must include both artifacts.

---

## Header (required)

```text
Package:            V3-___
Name:               ________________
Wave:               ___ — ________________
Capabilities:       ________
Date:               YYYY-MM-DD
Status:             Implementation Package | Review | Approved | Implementation | Implementation Report | Architecture Review | Security Review | Product Review | Validation | Closed
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Planning question:** Can implementation of this package begin without changing planning?

**Answer:** YES / NO. If NO, implementation **stops** until an approved Master Plan revision exists.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package
        ↓
Review
        ↓
Approval
        ↓
Implementation
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

Do not skip a stage. Do not start the next `V3-*` package until this package is **Closed**. The next package opens at **Implementation Package**, not at code.

This lifecycle is identical to [`version-3-implementation-policy.md`](./version-3-implementation-policy.md). No package may invent a shorter path.

---

## Overview

**Fill:** One paragraph. What this package is, which wave it belongs to, and which Master Plan customer outcomes it owns.

| Field                                | Value     |
| ------------------------------------ | --------- |
| Package ID                           | V3-___    |
| Master Plan / Execution Roadmap name |           |
| Wave                                 |           |
| Capabilities (inventory IDs)         |           |
| Complexity                           | S / M / L |
| Previous package                     |           |
| Next package                         |           |

---

## Business Goal

**Fill:** Why this package exists as a business increment, not as an engineering wishlist. Cite Master Plan section.

- Goal:
- Master Plan reference:
- Metric this package must meet or not regress (Master Plan §6, if any):

---

## Customer Problem

**Fill:** The operator-visible problem that exists **today** (usually a Version 2 limitation). Write it as the customer experiences it.

- Problem:
- Who feels it (researcher / operator / workspace admin / team):
- What they must do today that they should not (SSH, `.env`, SQL, shared identity, dishonest UI, etc.):

---

## Business Value

**Fill:** What becomes true for the business when this package Closes. Unblock later packages only as a consequence, not as the value itself.

- Value delivered at Close:
- What remains blocked until later packages:

---

## Current State

**Fill:** Honest Version 2 / prior-package facts. Reuse the pattern: Already exists / Needs extension / Missing / Out of this package.

| Capability or surface | Status                                                           | Evidence (owners, files, certified PC/US if known) |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
|                       | Already exists / Needs extension / Missing / Out of this package |                                                    |

Facts implementers must not forget:

-

---

## Reuse from Version 2

**Fill:** Map to Master Plan §10. Do not redesign certified subsystems.

| Stance                                                                                    | This package |
| ----------------------------------------------------------------------------------------- | ------------ |
| Reuse unchanged                                                                           |              |
| Minor extension                                                                           |              |
| Major extension                                                                           |              |
| New justified (only if Master Plan already named it)                                      |              |
| Replace (must be **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library) |              |

Owner from Master Plan §11:

| Area | Owner | This package must not own |
| ---- | ----- | ------------------------- |
|      |       |                           |

---

## Dependencies

**Fill:** Certified Version 2 products and earlier `V3-*` packages this work requires. Do not add unofficial dependencies.

| Dependency | Kind                                                         | Status required before this package |
| ---------- | ------------------------------------------------------------ | ----------------------------------- |
|            | Version 2 product / earlier V3 package / host infrastructure | Exists / Closed / Host-operated     |

This package does **not** depend on:

-

---

## Implementation Scope

### IN Scope

| Item | Customer meaning | Notes / owner inside existing domain |
| ---- | ---------------- | ------------------------------------ |
|      |                  |                                      |

### OUT OF Scope

| Item | Why out | Owner later (or Master Plan deferral) |
| ---- | ------- | ------------------------------------- |
|      |         |                                       |

Nothing in IN Scope may be invented. If a desired item is not in the Master Plan, **stop**.

---

## Product Acceptance Criteria

**Fill:** Customer-visible outcomes a non-engineer can perform in the product. Fail conditions required.

| #   | Outcome | Fail if |
| --- | ------- | ------- |
| 1   |         |         |

The customer never uses SSH, customer `.env`, or manual database edits for these journeys.

Copy and complete [`version-3-product-checklist.md`](./version-3-product-checklist.md).

---

## Product Walkthrough

**Required in Product Review. Repeat at Close. Mandatory for every package after S01-a.**

Every package must include a **Manual Product Walkthrough**.

This is not a unit test. This is not an integration test. This is not a UI test. This is a **customer validation checklist**: a reviewer performs the customer journey step by step in the product.

**Purpose:** Demonstrate the customer journey.

Copy this shape into the Product Review. Replace the title and steps with this package’s (or this slice’s) customer path. Do not delete the artifact. If there is no customer-visible journey, mark **NOT APPLICABLE**, name why, and stop.

```text
<Journey name> Walkthrough

□ <customer step>
□ <customer step>
□ <honest failure or non-goal the customer must still see>

PASS / NOT APPLICABLE / REQUIRES ACTION
```

**Example** (registration-shaped work):

```text
Registration Walkthrough

□ Open Create Account
□ Enter valid data
□ Registration succeeds
□ Duplicate email rejected
□ Weak password rejected
□ Password never exposed

PASS
```

**Example** (session-shaped work — mandatory step when this package issues or refreshes sessions):

```text
Session Walkthrough

□ Login
□ Receive session
□ Refresh session
□ Continue working
□ Refresh token reused
        ↓
  Session family revoked
□ Logout
□ Tokens never exposed

PASS
```

Customer-facing lifecycle (not implementation): [`session-lifecycle-overview.md`](./session-lifecycle-overview.md).

Rules:

- Steps are what a customer does and sees. Not test names. Not file paths.
- Include the happy path and the honest failure path this package owns.
- Secrets (passwords, tokens, hashes) must never appear in the API response or the UI.
- No SSH. No customer `.env`. No manual database edits.
- Automated tests do not replace this walkthrough.
- A customer-visible slice Product Review uses the same artifact for **that slice’s** journey. Package Close still requires the full package walkthrough.
- If this package issues or refreshes sessions, the walkthrough **must** include:

```text
□ Refresh token reused
        ↓
  Session family revoked
```

**NOT APPLICABLE** only when this package does not own refresh, with a named later owner. S01-c is accepted without this line in its Product Review artifact; do **not** rewrite that review. Every subsequent session walkthrough (S01-d and S01 Close) must include it.

- Close (and a slice Product Review for customer-visible work) requires **PASS**, or **NOT APPLICABLE** with a named reason. A failed or missing step is **REQUIRES ACTION**.

Overall verdict for this package:

| Field                   | Value                                   |
| ----------------------- | --------------------------------------- |
| Walkthrough name        |                                         |
| Executed in the product | Yes / NOT APPLICABLE                    |
| Overall                 | PASS / NOT APPLICABLE / REQUIRES ACTION |

---

## Architecture Review

**Fill at package time (intent) and again at Close (evidence).**

Copy and complete [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md).

Summary (must match the checklist):

| Rule                                                           | Decision                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it |                                                                            |
| No ownership drift                                             |                                                                            |
| No duplicate Source of Truth                                   |                                                                            |
| HTTP remains transport; UI remains not Source of Truth         |                                                                            |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged unless a future approved ADR already required by the Master Plan |
| Justified persistence/ports inside an existing owner           |                                                                            |

Forbidden: duplicate auth, vault, ledger, or order path; hidden redesign; Version 2-style RC track.

---

## Security Review

**Fill at package time (intent) and again at Close (evidence).**

Copy and complete [`version-3-security-checklist.md`](./version-3-security-checklist.md).

Every Security Review must include the **Threat Review** (lightweight STRIDE) from that checklist. This is one table. It is not a full threat model.

| Category               | Verdict                                 |
| ---------------------- | --------------------------------------- |
| Spoofing               | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Tampering              | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Repudiation            | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Information Disclosure | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Denial of Service      | PASS / NOT APPLICABLE / REQUIRES ACTION |
| Elevation of Privilege | PASS / NOT APPLICABLE / REQUIRES ACTION |

Threats this package must reduce:

| Threat (from Security Vision) | Control in this package |
| ----------------------------- | ----------------------- |
|                               |                         |

Controls explicitly **not** this package (name the owning `V3-*` ID):

| Control | Owner |
| ------- | ----- |
|         |       |

### Security Verification Standard (mandatory for packages that start after approval)

Copy and complete [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md).

Every category and every row must be marked **PASS**, **NOT APPLICABLE**, or **REQUIRES ACTION**. No section may be omitted. Blank is not PASS.

Must include:

- Injection through Secure Headers (categories 1–14)
- Explicit OWASP Top 10 and OWASP API Top 10 mapping
- **Security Regression Suite** — every found-and-fixed vulnerability owned by this package leaves an automated regression test that runs with ordinary tests

A package cannot Close while any checklist item, Threat Review row, Timing/Abuse row, verification-standard row, or regression-suite row is **REQUIRES ACTION**.

---

## Implementation Slices

**Fill:** Independently reviewable slices. Do not implement in the Implementation Package task.

Merge order is listed. Each slice names goal, expected touch, done-when, and must-not.

### ___-a — ________________

**Goal:**

**Touch (expected):**

**Done when:**

**Must not:**

### ___-b — ________________

**Goal:**

**Touch (expected):**

**Done when:**

**Must not:**

Add slices as required. Do not use slices to smuggle OUT OF Scope work.

---

## Validation Plan

Close requires all of the following that apply. Tests that mock the customer outcome do not count.

| Gate                                                          | Required                                                                                                                      | Evidence |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| Unit tests                                                    | Yes / NOT APPLICABLE                                                                                                          |          |
| Integration tests                                             | Yes / NOT APPLICABLE                                                                                                          |          |
| UI tests                                                      | Yes / NOT APPLICABLE                                                                                                          |          |
| Manual product walkthrough (no SSH / customer `.env` / SQL)   | **Yes** for any customer-visible package — the Product Walkthrough artifact in Product Review, not a unit/integration/UI test |          |
| Security verification (checklist)                             | **Yes**                                                                                                                       |          |
| Security Verification Standard + Regression Suite             | **Yes** for packages that start after the standard is approved; grandfathered packages: **NOT APPLICABLE**                    |          |
| Architecture verification (checklist)                         | **Yes**                                                                                                                       |          |
| Product verification (checklist)                              | **Yes**                                                                                                                       |          |
| Customer acceptance of Master Plan outcomes this package owns | **Yes**                                                                                                                       |          |

Companion validation document (if the package needs a longer plan): `v3-<id>-validation-plan.md`.

---

## Required Reports

Every package produces these before Close. Names may use the package ID. Do not create RC or ADR documents from a package.

| Report                 | When                        | Path convention                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation Package | Before Approval             | `v3-<id>-implementation-package.md` (this template)                                                                                                                                                                                               |
| Implementation Report  | After Implementation        | `v3-<id>-implementation-report.md`                                                                                                                                                                                                                |
| Architecture Review    | After Implementation Report | `v3-<id>-architecture-review.md` **or** completed architecture checklist attached to Close                                                                                                                                                        |
| Security Review        | After Architecture Review   | `v3-<id>-security-review.md` **or** completed security checklist attached to Close. **Must include Threat Review (STRIDE).** Packages that start after approval must also include the Security Verification Standard + Security Regression Suite. |
| Product Review         | After Security Review       | `v3-<id>-product-review.md` **or** completed product checklist attached to Close. **Must include the Product Walkthrough artifact.**                                                                                                              |
| Validation evidence    | After Product Review        | `v3-<id>-validation-plan.md` plus recorded results                                                                                                                                                                                                |
| Package Close record   | At Close                    | Close Checklist + Package Summary Standard below                                                                                                                                                                                                  |

Optional companions when the Implementation Package would otherwise become unreadable: product-scope, security-review (planning), validation-plan. They are not a license to skip template sections.

**Forbidden:** Version 2-style RC documents; ADRs except the Master Plan’s named future live-capital ADR (Wave 6); Master Plan edits from inside the package.

---

## Package Close Checklist

A package may be marked **CLOSED** only after **all** of the following are true.

| #   | Gate                                                                                                                                                                                                                                                              | Verdict         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | **Implementation Review** — slices done; Implementation Report written; honest limitations recorded                                                                                                                                                               | PASS / NOT DONE |
| 2   | **Architecture Review** — architecture checklist complete; no ownership drift; no duplicate context or SoT                                                                                                                                                        | PASS / NOT DONE |
| 3   | **Security Review** — security checklist complete; Threat Review (STRIDE) complete; Timing/Abuse complete where required; Security Verification Standard + Regression Suite complete when this package is subject to them; zero **REQUIRES ACTION**               | PASS / NOT DONE |
| 4   | **Product Review** — product checklist complete; Product Walkthrough artifact present and **PASS** (or **NOT APPLICABLE** with reason); customer-visible outcomes demonstrated                                                                                    | PASS / NOT DONE |
| 5   | **Validation** — validation plan executed; customer walkthrough passed                                                                                                                                                                                            | PASS / NOT DONE |
| 6   | **All mandatory reports** — listed in Required Reports, present, and consistent                                                                                                                                                                                   | PASS / NOT DONE |
| 7   | **Master Plan compliance** — no invented scope; wave and capability IDs unchanged                                                                                                                                                                                 | PASS / NOT DONE |
| 8   | **Product Principles compliance** — Customer First, Security Before Convenience, One Source of Truth, Paper First, Live Must Be Earned, Honest Product, AI Never Controls Capital, Everything Is Auditable, No Hidden Configuration, Architecture Is a Constraint | PASS / NOT DONE |
| 9   | **Customer walkthrough** — Product Walkthrough artifact executed; non-engineer path; no SSH; no customer `.env`; no manual DB edits                                                                                                                               | PASS / NOT DONE |

If any row is **NOT DONE**, the package is **not Closed**. The next package must not open.

---

## Customer-visible Changes

**Fill at Close.** What a customer can now do in the product that they could not do before this package.

-

What the UI / copy must **not** claim:

-

---

## Next Package Dependencies

| Field                             | Value  |
| --------------------------------- | ------ |
| This package unblocks             | V3-___ |
| This package does **not** unblock |        |
| Remaining wave work               |        |

Do not claim wave exit unless this package is the last package of the wave **and** the Master Plan wave outcomes are all met.

---

## Lessons Learned

**Fill at Close.** Process, reuse, and honesty only. Not a backlog of new product.

-

If a lesson requires new scope, it is a **Master Plan revision request**, not a silent next-slice.

---

## Package Summary Standard (mandatory at Close)

Cursor (or any implementer) must answer **exactly** these questions at the end of every Version 3 package. Do not paraphrase the questions. Do not skip any.

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Answers:

1.
2.
3.
4.
5.
6.
7.
8.

Question 8 must be **No** unless an approved Master Plan revision (and, where the Master Plan already requires it, a future ADR) already authorized the deviation. An unauthorized deviation means the package **cannot Close**.

---

## Future guidance (binding)

1. **No future Version 3 package may bypass this process.**
2. **If a package cannot satisfy this template, implementation stops until planning is updated.** Planning updates are Master Plan revisions, not package-local edits.
3. Do not start production code before Approval.
4. Do not modify Version 2 certification, Spec v2.0, the Authority Matrix, or the Alias Dictionary from inside a package.
5. Do not create RC documents. Do not create ADR documents except the Master Plan’s named Wave 6 live-capital ADR when that wave is reached.
6. Live capital remains unauthorized until that future ADR. No earlier package may enable live money.
7. Conflicts: **Master Plan wins.**

---

**STOP.** Wait for Review and Approval before production code. After Close, open the next package at Implementation Package — not at implementation.
