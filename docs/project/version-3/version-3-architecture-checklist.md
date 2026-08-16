# Version 3 Architecture Checklist

**Document:** Version 3 Architecture Checklist  
**Date:** 2026-08-16  
**Status:** Mandatory for every `V3-*` package  
**Authority:** Subordinate to [`version-3-master-plan.md`](./version-3-master-plan.md) §10–11, §16 and Architecture Specification v2.0 (read-only)  
**Template:** [`version-3-package-template.md`](./version-3-package-template.md)  
**Nature:** Checklist. Not an RC. Not an ADR. Not implementation. Not a Spec v2.0 amendment.

Every Version 3 package must verify the items below at **Implementation Package** (intent) and at **Close** (evidence). Version 3 extends the certified platform. It does not redesign Version 2.

Architecture Specification v2.0, the Authority Matrix, and the Alias Dictionary remain the frozen constitution. This checklist does not amend them.

---

## Package identity

| Field                            | Value                          |
| -------------------------------- | ------------------------------ |
| Package                          | V3-___                         |
| Wave                             |                                |
| Existing owner (Master Plan §11) |                                |
| Reviewer                         |                                |
| Date (package / close)           |                                |
| Stage                            | Implementation Package / Close |

---

## Verdicts

| Verdict             | Meaning                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **PASS**            | The rule holds for this package, with evidence.                                                          |
| **NOT APPLICABLE**  | The rule cannot arise in this package (rare). Explain. Prefer PASS with “no change” over NOT APPLICABLE. |
| **REQUIRES ACTION** | Drift, duplication, unjustified impact, or hidden redesign. Package cannot Close.                        |

---

## Verify

### 1. No ownership drift

Master Plan §11: one product area, one owner.

| Check                                                                                                                                            | Verdict                                 | Evidence |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | -------- |
| Work landed in the named owner, not a convenient nearby module                                                                                   | PASS / REQUIRES ACTION                  |          |
| Identity remains profile/role/status; Authentication remains credentials/sessions (unless this package is the named owner of a listed extension) | PASS / NOT APPLICABLE / REQUIRES ACTION |          |
| Ledger / Risk / Gate / Library / Workspace aggregate not given new competing owners                                                              | PASS / REQUIRES ACTION                  |          |
| Notification Delivery does not own identity mail; Telegram does not own trading commands                                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |          |
| UI is not Source of Truth                                                                                                                        | PASS / REQUIRES ACTION                  |          |
| HTTP remains transport                                                                                                                           | PASS / REQUIRES ACTION                  |          |

**Must not own (from Master Plan, this package):**

### 2. No duplicate bounded context

| Check                                                                                                                             | Verdict                                 | Evidence |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------- |
| No second authentication, vault, ledger, or order path                                                                            | PASS / REQUIRES ACTION                  |          |
| No new bounded context unless the Master Plan already named it (Credential Vault, Connection Management facade, isolated Billing) | PASS / REQUIRES ACTION                  |          |
| Persistence/ports added only **inside** an existing owner                                                                         | PASS / NOT APPLICABLE / REQUIRES ACTION |          |
| Trading Session / SessionRecovery* not reused as login sessions                                                                   | PASS / NOT APPLICABLE / REQUIRES ACTION |          |

**New context claimed?** None / Named in Master Plan as: ________

### 3. No duplicate Source of Truth

| Check                                                           | Verdict                | Evidence |
| --------------------------------------------------------------- | ---------------------- | -------- |
| Money remains Ledger                                            | PASS / REQUIRES ACTION |          |
| Certification / Gate / Library not cloned                       | PASS / REQUIRES ACTION |          |
| No parallel mechanism for risk, lifecycle, or identity profiles | PASS / REQUIRES ACTION |          |
| Projections (UI, reports, lake) remain projections              | PASS / REQUIRES ACTION |          |

### 4. Master Plan respected

| Check                                                                             | Verdict                | Evidence |
| --------------------------------------------------------------------------------- | ---------------------- | -------- |
| Package ID, wave, and capabilities match the frozen plan                          | PASS / REQUIRES ACTION |          |
| IN Scope is a subset of the plan; nothing invented                                | PASS / REQUIRES ACTION |          |
| OUT OF Scope names the real later owner                                           | PASS / REQUIRES ACTION |          |
| Live capital not authorized (unless this is post-ADR Wave 6 work)                 | PASS / REQUIRES ACTION |          |
| If implementation would contradict the plan, work **stopped** rather than patched | PASS / REQUIRES ACTION |          |

### 5. Product Principles respected

| Principle                    | Verdict                                 | Evidence (one line) |
| ---------------------------- | --------------------------------------- | ------------------- |
| Customer First               | PASS / REQUIRES ACTION                  |                     |
| Security Before Convenience  | PASS / REQUIRES ACTION                  |                     |
| One Source of Truth          | PASS / REQUIRES ACTION                  |                     |
| Paper First                  | PASS / NOT APPLICABLE / REQUIRES ACTION |                     |
| Live Must Be Earned          | PASS / NOT APPLICABLE / REQUIRES ACTION |                     |
| Honest Product               | PASS / REQUIRES ACTION                  |                     |
| AI Never Controls Capital    | PASS / NOT APPLICABLE / REQUIRES ACTION |                     |
| Everything Is Auditable      | PASS / REQUIRES ACTION                  |                     |
| No Hidden Configuration      | PASS / REQUIRES ACTION                  |                     |
| Architecture Is a Constraint | PASS / REQUIRES ACTION                  |                     |

### 6. Dependencies unchanged

| Check                                                                                                                | Verdict                | Evidence |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------- |
| Depends only on certified Version 2 products and **Closed** earlier `V3-*` packages (plus named host infrastructure) | PASS / REQUIRES ACTION |          |
| Does not take a dependency on a later wave “just this once”                                                          | PASS / REQUIRES ACTION |          |
| Does not require a Master Plan or Spec change to compile or to Close                                                 | PASS / REQUIRES ACTION |          |
| Reuse table (Master Plan §10) stance for touched subsystems is honored                                               | PASS / REQUIRES ACTION |          |

**Dependencies used:**

**Dependencies refused:**

### 7. Architecture impact justified

| Check                                                                             | Verdict                | Evidence |
| --------------------------------------------------------------------------------- | ---------------------- | -------- |
| Every schema/module/port addition is required to meet a named Master Plan outcome | PASS / REQUIRES ACTION |          |
| Impact is described as extension of an existing owner, not a platform rewrite     | PASS / REQUIRES ACTION |          |
| Canonical Order Path, Ledger, Runtime evaluator, and Library are **not** replaced | PASS / REQUIRES ACTION |          |
| Spec v2.0 / Authority Matrix / Alias Dictionary unchanged                         | PASS / REQUIRES ACTION |          |

**Justified additions (list):**

**Unjustified ideas rejected:**

### 8. No hidden redesign

| Check                                                                                                                                                                                                                                                          | Verdict                                 | Evidence |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------- |
| No Version 2.1 rewrite under production pressure                                                                                                                                                                                                               | PASS / REQUIRES ACTION                  |          |
| No new IAM / SOC / order engine / ABAC product                                                                                                                                                                                                                 | PASS / REQUIRES ACTION                  |          |
| No Version 2-style RC track created                                                                                                                                                                                                                            | PASS / REQUIRES ACTION                  |          |
| No ADR created except the Master Plan’s named future live-capital ADR when that wave is reached                                                                                                                                                                | PASS / REQUIRES ACTION                  |          |
| No silent Master Plan edit                                                                                                                                                                                                                                     | PASS / REQUIRES ACTION                  |          |
| Certified Version 2 products listed as maintain (Library, Certification, Gate, Deployment, Orchestrator, Qualification, Market Profile, Market State, Command Center paper, Knowledge Lake, Reporting, AI Analytics, paper Execution Adapter) were not rebuilt | PASS / NOT APPLICABLE / REQUIRES ACTION |          |

---

## Close rule

Architecture Review **PASS** only when items 1–8 have **no REQUIRES ACTION**.

An unauthorized architectural deviation means the package **cannot Close**. Question 8 of the Package Summary Standard must then be answered **Yes** only if a prior approved planning revision authorized it — otherwise the answer is **Yes, unauthorized** and Close is refused.

---

**STOP.** If this package needs a new bounded context the Master Plan did not name, implementation stops until planning is updated.
