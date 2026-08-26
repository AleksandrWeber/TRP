# 05 — Development Process

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Binding process summary for reviews
**Authority:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)

---

## Methodology in one sentence

No Version 3 package starts with production code. Every package follows the same lifecycle; stages are not skipped; the next package opens only after the current package is **Closed**.

---

## Canonical lifecycle (every package)

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

---

## Stage meanings

| Stage                      | Meaning                                                                                                                                   | Must not                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Master Plan**            | Product Owner source of truth for waves, packages, outcomes, reuse                                                                        | Invent work not in the plan; amend the plan inside an implementation task            |
| **Implementation Package** | Scope, current-state, slices, security, architecture, validation prepared                                                                 | Write production code; redesign architecture; create RC/ADR; modify V2 certification |
| **Review**                 | Read package against Master Plan, Security Vision, Architecture freeze                                                                    | Treat review comments as silent scope expansion                                      |
| **Approval**               | Explicit go-ahead to write production code for **this package only**                                                                      | Start a later wave or a different package ID                                         |
| **Implementation**         | Execute approved slices; extend existing owners                                                                                           | Duplicate domains; enable live UI early; amend Spec v2.0                             |
| **Implementation Report**  | What shipped, files, tests, honest limitations                                                                                            | Claim wave exit for later packages’ capabilities                                     |
| **Architecture Review**    | No new BC unless Master Plan justified; no ownership drift; no SoT change                                                                 | Rubber-stamp duplicate auth/vault/ledger/order path                                  |
| **Security Review**        | Security Vision controls; fail closed; no secret leakage; checklist + STRIDE + (when applicable) Verification Standard + Regression Suite | Move another package’s controls into this closeout without plan revision             |
| **Product Review**         | Customer-visible outcomes; Product Walkthrough                                                                                            | Accept developer-only path as product path                                           |
| **Validation**             | Execute validation plan with evidence                                                                                                     | Close on mocked customer outcomes                                                    |
| **Close**                  | Product Owner accepts package (or named gate) done                                                                                        | Reopen V2; claim Customer Complete without UI/walkthrough                            |

---

## Planning

Planning = Implementation Package + companion product scope, security review (planning), validation plan, and (where used) operator overview — **before Approval**.

Planning question every package must answer: _Can implementation begin without changing planning?_ If **NO**, stop until Master Plan revision.

**Sources:** Policy · Package Template · Wave 2 package headers

---

## Implementation

Allowed only after **Approval**, and only for **approved slices** of the approved package.

Prohibited while planning/review is open, after a REQUIRES ACTION review, when work is not in the Master Plan, or when implementation would contradict the Master Plan.

---

## Reports

| Artifact                     | When                           | Role                                                     |
| ---------------------------- | ------------------------------ | -------------------------------------------------------- |
| **Implementation Report**    | After each slice (and package) | Record what shipped and limitations                      |
| **Validation Report**        | After validation               | Evidence against validation plan                         |
| **Close Report**             | At Close                       | Evidence packet; **only Product Owner declares Closed**  |
| **Package Summary Standard** | At Close                       | Eight mandatory questions answered by Cursor/implementer |

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

## Validation

Validation executes the package validation plan: unit, integration, UI, walkthrough, security, architecture, customer acceptance. Security regression tests run with ordinary tests when the Verification Standard applies.

Tests that mock the customer outcome do **not** count as Close evidence.

**Sources:** Policy · Package validation plans · [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

---

## Architecture Review

Confirm:

- No new bounded context unless Master Plan already named it
- No ownership drift (consume ≠ own)
- No Source of Truth change
- HTTP remains transport; UI remains not SoT
- Canonical Order Path / Ledger / Runtime evaluator not replaced

Checklist: [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md)

---

## Security Review

Confirm package Security Vision controls; fail closed; no secret leakage.

Mandatory companions:

| Document                                                                                           | Role                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`../version-3-security-checklist.md`](../version-3-security-checklist.md)                         | High-level Close gate                             |
| [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) | Itemized verification + Security Regression Suite |
| Threat Review (STRIDE)                                                                             | Required in Security Review (post S01-a)          |

For packages that start after the Verification Standard is approved: every category row PASS or NOT APPLICABLE; REQUIRES ACTION blocks Close; found-and-fixed vulnerabilities leave automated regression tests.

---

## Product Review

Confirm customer-visible outcomes. No SSH, no customer `.env`, no manual DB edits as the journey. Include Product Walkthrough artifact.

Checklist: [`../version-3-product-checklist.md`](../version-3-product-checklist.md)

---

## Product Owner Approval

| Decision                              | Effect                                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| Approve Implementation Package        | Unlocks production code for that package only                 |
| Approve a slice                       | Unlocks the next slice (when sequencing requires it)          |
| Reject / REQUIRES ACTION              | Implementation of next work stops until resolved              |
| Declare Close                         | Package done; next package may open at Implementation Package |
| Declare Platform vs Customer Complete | Dual gates when planned (e.g. V3-S03)                         |
| Declare Wave COMPLETE / Certification | Exclusive Product Owner authority after evidence              |

Detail: [`06-product-owner-guide.md`](./06-product-owner-guide.md)

---

## Close

Package is done at the gate the Product Owner accepted.

Prefer clear names when two gates exist:

| Gate                  | Meaning                               |
| --------------------- | ------------------------------------- |
| **Platform Complete** | Domain ready for consumers            |
| **Customer Complete** | Operators can use the product surface |

Platform Complete must not claim Customer Complete. Example: [`../v3-s03-close-criteria-resolution.md`](../v3-s03-close-criteria-resolution.md).

Close reports prepare evidence. **Only the Product Owner may declare Closed.**

---

## Certification

Distinct from package Close.

```text
Independent Certification Audit
        ↓
Certification Resolution (if blockers)
        ↓
Independent Certification Validation
        ↓
Product Owner Certification / Wave COMPLETE
```

Wave 1 used this path. Independent validation recommends; **Product Owner decides**.

F-05 example: Wave 1 certifies Security Audit **Foundation**, not Customer Audit Product — [`../wave-1-f05-product-owner-decision-record.md`](../wave-1-f05-product-owner-decision-record.md).

---

## Wave lifecycle

1. Master Plan names the wave and customer-observable exit criteria.
2. Packages execute in order under Implementation Policy.
3. Wave exit = customer outcomes met + (where required) independent certification + **Product Owner declaration**.
4. Next wave may open for planning only after prior wave is accepted as complete for that purpose.

Live capital wave (Wave 6) additionally requires Waves 1–4 complete **and** live-capital ADR.

---

## Package lifecycle

Identical to the canonical lifecycle above. Next `V3-*` / `W2-S*` opens at **Implementation Package**, not at code. Do not start the next package until the current package is Closed (or the accepted dual-gate equivalent).

---

## Slice lifecycle

Packages decompose into independently reviewable slices (a…e typical).

```text
Approved package
        ↓
Implement slice N
        ↓
Implementation Report
        ↓
Architecture / Security / Product Review
        ↓
Validation
        ↓
STOP — Product Owner review
        ↓
Next slice (only if approved / sequencing allows)
```

Rules:

- Slice PASS ≠ Package Close
- Slice walkthrough ≠ full package walkthrough
- Later slice names are sequencing, not silent approval to implement them

**Sources:** Package Template · Wave 2 slice STOP lines

---

## When implementation is allowed

- Master Plan lists the work
- Implementation Package reviewed and **Approved** by Product Owner
- Current slice is the approved next slice
- Prior slice review STOP cleared (when required)
- No Master Plan contradiction

## When implementation is prohibited

- Before Approval
- Work not in Master Plan
- Would contradict Master Plan (stop; request planning revision)
- Would redesign Version 2 / amend Spec without authority
- Would authorize live capital before Wave 6 ADR
- Would reopen Closed package scope by stealth
- REQUIRES ACTION open on a gated review
- Next package before current Close

---

## Binding rules (short list)

1. Identify wave and package before any work.
2. Conflicts: **Master Plan wins.**
3. Do not reopen Version 2 RCs, PC packages, or certification.
4. Do not create Version 2-style RC tracks for Version 3.
5. Live capital requires future ADR.
6. Customer First still applies.
7. Security is a first-class product capability.

Full text: [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)

---

**STOP.** Process changes are policy revisions — not package-local shortcuts.
