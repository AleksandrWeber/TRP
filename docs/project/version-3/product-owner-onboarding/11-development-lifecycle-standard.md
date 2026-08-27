# 11 — Version 3 Development Lifecycle Standard

**Audience:** Permanent AI Product Owner / Chief Architect · Cursor / implementers  
**Nature:** Binding **process** standard for every Version 3 package  
**Authority:** Product Owner  
**Status:** Normative for all future Version 3 packages unless explicitly revised by Product Owner  
**Authority stack:** Subordinate to [`../version-3-master-plan.md`](../version-3-master-plan.md). Companion to [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md).  
**Origin:** Engineering workflow evolved and proven during **W3-O01** and **W3-O02**.

**This document does not** modify the Master Plan, Version 2, package scopes, or architecture. It does **not** authorize implementation.

---

## 1. Purpose

This document exists to **standardize the engineering lifecycle** used during Version 3 development.

It freezes the mandatory workflow that every package must follow from Master Plan identification through Product Owner Final Close and repository synchronization. It standardizes **how** packages are planned, implemented, reviewed, verified, closed, and handed off — not **what** products, waves, or capabilities exist.

Product architecture, ownership, and scope remain governed by the Master Plan and Architecture constitution. This standard governs process discipline only.

---

## 2. Lifecycle

Every Version 3 package follows this complete lifecycle. Stages are not skipped. The next Planning Package opens only after Product Owner Final Close of the current package (unless Product Owner explicitly sequences otherwise).

```text
Master Plan
        ↓
Planning Package
        ↓
Planning Review
        ↓
Product Owner Approval
        ↓
Implementation
        ↓
Slice Reviews
        ↓
Slice Validation
        ↓
Package Close Evidence
        ↓
Final Package Integration Verification
        ↓
Product Owner Final Close
        ↓
Status Update
        ↓
Commit
        ↓
Push
        ↓
Next Planning Package
```

### Stage meanings

| Stage                                      | Meaning                                                                                                                                                 | Must not                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Master Plan**                            | Product Owner source of truth for waves, package IDs, outcomes, and reuse. Work must map here before planning begins.                                   | Invent work not in the plan; amend the plan inside an implementation or close task    |
| **Planning Package**                       | Freeze scope, slices, security, validation, and readiness so implementation can start without changing planning. Companion documents required (see §3). | Write production code; redesign architecture; create RC/ADR; modify Version 2         |
| **Planning Review**                        | Read planning against Master Plan, Security Vision, Architecture freeze, ownership, and Honest Product rules.                                           | Treat review comments as silent scope expansion                                       |
| **Product Owner Approval**                 | Explicit go-ahead to write production code for **this package only**.                                                                                   | Start a later wave or a different package ID                                          |
| **Implementation**                         | Execute **approved slices** only, in sequence. Extend existing owners.                                                                                  | Duplicate domains; enable live UI early; amend Spec v2.0; implement unapproved slices |
| **Slice Reviews**                          | After each slice: Implementation Report + Architecture / Security / Product Review. Honor STOP lines.                                                   | Treat slice PASS as Package Close; smuggle later-slice capabilities                   |
| **Slice Validation**                       | Execute the validation plan rows owned by that slice; record evidence.                                                                                  | Close the package on slice evidence alone; accept mocked customer outcomes as Close   |
| **Package Close Evidence**                 | Assemble mandatory close artifacts (see §5). Typically a final evidence slice with **no new product functionality**.                                    | Declare Closed; open the next package; invent new scope in the evidence slice         |
| **Final Package Integration Verification** | Mandatory pre-Close engineering verification (see §6). **No implementation.**                                                                           | Write production code; declare Closed; update wave COMPLETE; open next package        |
| **Product Owner Final Close**              | Exclusive Product Owner act: Closed / Platform Complete / Customer Complete as applicable (see §7).                                                     | Cursor or implementer declaring Close; claiming Wave COMPLETE without PO authority    |
| **Status Update**                          | Synchronize progress / overview / status docs to the Close decision.                                                                                    | Contradict Close evidence; silently expand claims                                     |
| **Commit**                                 | Persist Close decision and synchronized documentation in the repository.                                                                                | Commit after Close except when Product Owner requests corrections (§8)                |
| **Push**                                   | Publish the Closed package record to the remote.                                                                                                        | Push unauthorized next-package planning or Master Plan edits                          |
| **Next Planning Package**                  | Open planning for the next Master Plan package only after current Close.                                                                                | Begin next package at code; reopen Closed scope by stealth                            |

**Terminology note:** Historical documents may say **Implementation Package** for the primary planning artifact. Under this standard, **Planning Package** means that artifact plus required companions (§3). Both names refer to planning — never to production code.

---

## 3. Planning Stage

### Required documents

| Document                                      | Role                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Planning Package** (Implementation Package) | Scope, current-state, slices, architecture constraints, security posture, validation outline, STOP lines |
| **Product Scope**                             | Freeze IN / OUT; customer receives / does NOT receive; ownership tables                                  |
| **Security Review** (planning)                | Security Vision controls for this package; fail-closed stance; Verification Standard applicability       |
| **Validation Plan**                           | How outcomes will be proven (unit, integration, UI, walkthrough, security, architecture)                 |
| **Planning Summary**                          | Compact planning roll-up for Product Owner review                                                        |
| **Implementation Readiness**                  | When applicable — confirm implementation can begin without changing planning                             |
| **Planning Integrity Review**                 | When applicable — confirm no accidental new product, ownership, BC, or hidden bounded context            |

Operator / product overview documents are required when customer-facing language changes.

### Planning rules

1. No production code during planning.
2. Answer: _Can implementation begin without changing planning?_ If **NO**, stop until Master Plan revision or planning correction.
3. IN / OUT must be explicit; OUT names later owners.
4. Ownership: consume ≠ own; Does-not-own must be complete.
5. No new bounded context unless Master Plan already named it.
6. No Version 2 reopen, Spec amendment, or unauthorized ADR.
7. Live capital is never authorized by ordinary package planning.
8. Review comments do not silently expand IN.

### Approval rules

- Only the **Product Owner** Approves a Planning Package.
- Approval unlocks production code for **this package only**.
- Reject / REQUIRES ACTION blocks all implementation until resolved.
- Slice names in planning are sequencing — not silent approval to implement later slices.

Sources: [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md) · [`../version-3-package-template.md`](../version-3-package-template.md) · [`07-review-checklists.md`](./07-review-checklists.md)

---

## 4. Implementation Stage

### Slices

Packages decompose into independently reviewable slices (typically `a`…`e`). Each slice has explicit outcomes, must-nots, and a **STOP** line requiring Product Owner review before the next slice (when sequencing requires it).

```text
Approved package
        ↓
Product Owner unlocks slice N
        ↓
Implement slice N
        ↓
Implementation Report
        ↓
Architecture / Security / Product Review
        ↓
Slice Validation
        ↓
STOP — Product Owner review
        ↓
Next slice (only if approved)
```

### STOP lines

STOP lines are binding. Implementers must not proceed past a STOP without Product Owner approval. Slice PASS ≠ Package Close. Slice walkthrough ≠ full package walkthrough.

### Approval required before every slice

No slice starts until:

- Planning Package is Approved, and
- The Product Owner has approved (or sequenced) that slice as the next allowed work, and
- Prior slice STOP is cleared when required.

### Mandatory slice artifacts

| Artifact                  | Role                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| **Implementation Report** | What shipped, files, tests, honest limitations, non-claims              |
| **Architecture Review**   | No unjustified BC; no ownership drift; no SoT change                    |
| **Security Review**       | Fail closed; checklist / STRIDE / Verification Standard when applicable |
| **Product Review**        | Customer-visible outcomes; Honest Product; walkthrough when required    |
| **Validation Report**     | Evidence against the validation plan rows for this slice                |

Checklists: [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md) · [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`07-review-checklists.md`](./07-review-checklists.md)

---

## 5. Package Close Evidence

Before Final Package Integration Verification, the package must assemble Close Evidence. Mandatory artifacts:

| Artifact                 | Role                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| **Close Package Report** | Evidence index and close checklist; prepares PO Close (does not declare it) |
| **Package Summary**      | Package Summary Standard (eight mandatory questions)                        |
| **Walkthrough**          | Operator / operational walkthrough proving customer or operational journey  |
| **Transition Matrix**    | Before → after → still missing for the close evidence slice/package         |
| **Operational Maturity** | Operational readiness progression and remaining gaps                        |
| **Capability Evolution** | Package opened → current → closed capability (honest non-claims)            |
| **Technical Debt Delta** | Resolved / introduced / deferred debt for the package                       |

Close Evidence slices must **not** add new product functionality. They assemble and verify evidence only.

Package Summary questions (exact):

1. What did the customer receive?
2. What did the customer NOT receive?
3. What business problem was solved?
4. What remains for later packages?
5. Which package becomes available next?
6. Was the Master Plan followed?
7. Were Product Principles respected?
8. Were any architectural deviations introduced?

Question 8 must be **No** unless an authorized Master Plan revision (and required ADR) already authorized the deviation.

---

## 6. Final Package Integration Verification

**Mandatory before Product Owner Final Close.**

Nature: pre-Close engineering verification only. **Not** a new slice. **Not** Package Close. **No implementation allowed.**

### Required checks

| Check                             | Meaning                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Package completeness**          | All approved slices present with Implementation / Architecture / Security / Product / Validation reports; Close Evidence documents present |
| **Architecture**                  | No new BC; no ownership drift; no second SoT / duplicate owners; dependency graph valid                                                    |
| **Master Plan alignment**         | No scope expansion; no hidden capability; no silent requirement changes; planning frozen post-Approval                                     |
| **Operational verification**      | End-to-end operational journey evidenced for package outcomes (without claiming OUT capabilities)                                          |
| **Regression verification**       | Lint / typecheck / tests / required builds / diff hygiene PASS                                                                             |
| **Documentation synchronization** | Active status docs agree; no contradictory current claims                                                                                  |
| **Technical debt review**         | Resolved / introduced / deferred debt documented; no undocumented introduced debt                                                          |
| **Package KPI Summary**           | Planned vs completed slices; deviation counts; validation / regression success; confidence                                                 |
| **Engineering verdict**           | Internally consistent; fully integrated; regression-safe; docs synchronized; ready for PO Close                                            |

This verification **recommends** readiness. It does **not** declare Closed, Wave COMPLETE, or open the next package.

---

## 7. Product Owner Close

Only the **Product Owner** may:

| Decision                              | Effect                                                   |
| ------------------------------------- | -------------------------------------------------------- |
| Declare **CLOSED**                    | Package done at the accepted gate                        |
| Declare **Platform Complete**         | Domain ready for consumers (when dual gates are planned) |
| Declare **Customer Complete**         | Operators can use the product surface                    |
| Declare Wave **COMPLETE**             | Wave exit — exclusive; not implied by package Close      |
| Approve opening next Planning Package | Unlocks planning for the next Master Plan package only   |

Cursor and implementers prepare evidence. They do **not** declare these outcomes.

Platform Complete must not claim Customer Complete. Close reports prepare evidence; only Product Owner Final Close completes the package.

Detail: [`06-product-owner-guide.md`](./06-product-owner-guide.md)

---

## 8. Repository Rules

Standard repository workflow for package execution:

```text
Implementation
        ↓
Internal Validation
        ↓
Commit
        ↓
Push
        ↓
Final Package Integration Verification
        ↓
Product Owner Close
```

Rules:

1. Slice and package work is committed and pushed after internal validation so Final Integration Verification and Product Owner Close review a synchronized remote state.
2. After Product Owner Final Close, Status Update → Commit → Push finalize the Close record (§2).
3. **No commits after Close** unless the Product Owner requests corrections.
4. Do not open the next Planning Package in the same commit stream as unauthorized scope.
5. Do not amend the Master Plan from package commits.

---

## 9. Mandatory Artifacts

| Category           | Mandatory documents / artifacts                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planning**       | Planning Package (Implementation Package) · Product Scope · Security Review (planning) · Validation Plan · Planning Summary · Implementation Readiness (when applicable) · Planning Integrity Review (when applicable) · Operator/product overview when customer language changes |
| **Implementation** | Per-slice Implementation Report · Architecture Review · Security Review · Product Review                                                                                                                                                                                          |
| **Validation**     | Per-slice Validation Report · Package Walkthrough (at Close Evidence) · Security Verification Standard worksheet when required                                                                                                                                                    |
| **Close**          | Close Package Report · Package Summary · Walkthrough · Transition Matrix · Operational Maturity · Capability Evolution · Technical Debt Delta · Final Package Integration Verification · Product Owner Close Record (PO)                                                          |
| **Repository**     | Commits and pushes for validated slice work · Close Status Update commit/push · No post-Close commits unless PO requests corrections                                                                                                                                              |
| **Status**         | Wave/progress and overview docs synchronized to Close decision · Explicit non-claims (Wave COMPLETE / next package / OUT capabilities)                                                                                                                                            |

---

## 10. Engineering Principles

| Principle                           | Meaning                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| **Customer First**                  | Customer features usable without SSH, Docker, or customer `.env`         |
| **Honest Product**                  | If the system cannot do something, it says so                            |
| **Fail Closed**                     | When unsafe or uncertain, deny                                           |
| **One Source of Truth**             | No duplicate domains or parallel mechanisms for owned facts              |
| **No ownership drift**              | Consume ≠ own; ownership changes require Master Plan revision            |
| **No hidden scope expansion**       | Review comments and slices do not silently expand IN                     |
| **No silent Master Plan revisions** | Conflicts stop work; request approved planning revision                  |
| **No architectural drift**          | No unjustified BC; HTTP transport; UI not SoT; Spec frozen               |
| **Regression safety**               | Prior Closed packages and security properties must not weaken            |
| **Documentation synchronization**   | Status, overview, validation, and Close docs must agree on current truth |

---

## 11. Package Completion Criteria

A package is **NOT** eligible for Product Owner Close until **ALL** of the following are **PASS**:

| Criterion                           | Required |
| ----------------------------------- | -------- |
| Planning approved                   | PASS     |
| All slices approved                 | PASS     |
| Validation PASS                     | PASS     |
| Architecture PASS                   | PASS     |
| Security PASS                       | PASS     |
| Product PASS                        | PASS     |
| Close Evidence complete             | PASS     |
| Final Integration Verification PASS | PASS     |
| Repository synchronized             | PASS     |

Missing any row blocks Close.

---

## 12. Explicit Non-Goals

This document does **NOT**:

- Change the Master Plan
- Change Architecture
- Create new package types
- Create new ownership
- Modify Version 2
- Authorize implementation

---

## 13. Cross References

| Document                       | Path                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Implementation Policy          | [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)                   |
| Review Checklists              | [`07-review-checklists.md`](./07-review-checklists.md)                                             |
| Product Owner Guide            | [`06-product-owner-guide.md`](./06-product-owner-guide.md)                                         |
| Development Process (summary)  | [`05-development-process.md`](./05-development-process.md)                                         |
| Current State                  | [`08-current-state.md`](./08-current-state.md)                                                     |
| Future Roadmap                 | [`09-future-roadmap.md`](./09-future-roadmap.md)                                                   |
| Glossary                       | [`10-glossary.md`](./10-glossary.md)                                                               |
| Package Template               | [`../version-3-package-template.md`](../version-3-package-template.md)                             |
| Master Plan                    | [`../version-3-master-plan.md`](../version-3-master-plan.md)                                       |
| Architecture Checklist         | [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md)                 |
| Security Checklist             | [`../version-3-security-checklist.md`](../version-3-security-checklist.md)                         |
| Product Checklist              | [`../version-3-product-checklist.md`](../version-3-product-checklist.md)                           |
| Security Verification Standard | [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) |

---

**STOP.** Wait for Product Owner review. This standard does not modify any package, open W3-O03, or change the Master Plan.
