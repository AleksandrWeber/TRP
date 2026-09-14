# W5-N28 Validation Plan

**Package:** W5-N28 Notification Retry Scheduling Decision Projection Publication Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N28 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-13). Repository Synchronization (Planning) **COMPLETE**. W5-N28-a Inventory **COMPLETE**. W5-N28-b Persistence **COMPLETE**. W5-N28-c Restart Recovery **COMPLETE** (local). No runtime Decision Projection Publication. No runtime Decision Projection. No runtime scheduling.
**Date:** 2026-09-13
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n28-product-scope.md`](./w5-n28-product-scope.md)
**Security:** [`w5-n28-security-review.md`](./w5-n28-security-review.md)
**Umbrella:** [`w5-n28-implementation-package.md`](./w5-n28-implementation-package.md)
**Overview:** [`w5-n28-overview.md`](./w5-n28-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform decision projection publication foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), Runtime Decision Projection Publication, Runtime Decision Projection, Runtime Decision Evaluation, runtime scheduling, scheduling execution, retry execution, transport execution success, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantees, dead-letter processing, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from N28 alone. Validate **Notification Retry Scheduling Decision Projection Publication Foundation** outcomes only for authorized slices.

---

## 0. What Close means for W5-N28

| Gate                | Meaning                                                                                                                                                                                                                     | Unlocks                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N28 Closed**   | Platform decision projection publication foundation evidenced; walkthrough PASS (post-implementation)                                                                                                                       | V3-N28 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N28 alone                                                                                                                                                                                                  | Requires separate PO act          |
| **Not claimed**     | Live Trading / live orders                                                                                                                                                                                                  | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                                                                                                                                              | Separate PO act                   |
| **Not claimed**     | Live Notifications / Production Ready                                                                                                                                                                                       | Separate PO acts                  |
| **Not claimed**     | Successful delivery / provider acceptance / recipient receipt                                                                                                                                                               | Transport evidence required       |
| **Not claimed**     | Exactly-once delivery / delivery guarantee                                                                                                                                                                                  | Outside foundation                |
| **Not claimed**     | Runtime Decision Projection Publication / Runtime Decision Projection / Runtime Decision Evaluation / runtime scheduling / scheduling execution / executing retries / workers / timers implementation / queues / transports | Deferred product scope            |
| **Not claimed**     | Retry Engine / Runtime Decision Engine / Runtime Projection Engine / Runtime Publication Engine / Runtime Scheduler / Worker / Timer / Scheduler Platform / Workflow Engine / Event Bus / orchestration platform            | Forbidden                         |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No Retry Engine; publication extension only; PC-06 preserved           |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N27 boundaries                                        |
| Package close validation | Final Integration Verification; Product Owner Close Record             |

### Commands (authorized slices)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression           |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |

### Planning-phase gate (this open)

| Command            | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `git diff --check` | Planning documentation whitespace integrity |

---

## 2. Conformance validation (post-implementation intent)

| Area                                             | Must prove                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Publication foundation integrity                 | Platform Ready requires publication foundation evidence             |
| Per-channel honesty                              | Reserved-inactive not presented as Connected                        |
| N05…N27 platform honesty                         | Prior platform truth not overridden by publication layer            |
| Secret non-echo                                  | Responses, logs, errors never include secrets                       |
| Workspace binding                                | Missing/wrong workspace fails closed                                |
| Cross-channel isolation                          | Channel A state cannot leak to channel B                            |
| No capital side effect                           | Publication foundation never places live orders                     |
| No delivery success claim                        | Foundation ≠ successful delivery / acceptance / receipt             |
| No fake Publication Ready                        | Label requires real foundation outcome evidence                     |
| Fail honest                                      | Missing/corrupt state surfaces honestly                             |
| No Runtime Decision Projection Publication claim | Publication planning ≠ runtime publication                          |
| No Runtime Decision Projection claim             | Publication planning ≠ Runtime Decision Projection                  |
| No Runtime Decision Evaluation claim             | Publication ≠ Runtime Decision Evaluation                           |
| No runtime schedule / execute                    | Publication ≠ runtime scheduling / scheduling execution / execution |

---

## 3. Documentation validation

| Area                      | Must prove                                                               |
| ------------------------- | ------------------------------------------------------------------------ |
| Planning package complete | All W5-N28 planning documents present and internally consistent          |
| Slice a–e reports         | Only after authorized slices (not opened)                                |
| Operational walkthrough   | Platform Decision Projection Publication Foundation Walkthrough at Close |
| Close Evidence            | Package summary, close report, integration verification at Close         |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized                   |

---

## 4. Architecture validation

| Area                                  | Must prove                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| No second engine                      | Notification Delivery decision projection publication foundation extension only |
| No Retry Engine product               | Capability of notification-delivery only                                        |
| No Runtime Decision Engine product    | Forbidden                                                                       |
| No Runtime Projection Engine product  | Forbidden                                                                       |
| No Runtime Publication Engine product | Forbidden                                                                       |
| No Runtime Scheduler product          | Forbidden                                                                       |
| No Worker product                     | Forbidden                                                                       |
| No Timer implementation               | Forbidden                                                                       |
| No Scheduler Platform                 | Forbidden                                                                       |
| No Workflow Engine                    | Publication on existing owner only                                              |
| No Event Bus / orchestration platform | Forbidden                                                                       |
| Persistence ownership preserved       | Extend `notification-delivery` only                                             |
| Source of Truth preserved             | PC-06 / Ledger untouched                                                        |
| No Version 2 modification             | Consume only                                                                    |
| No Master Plan modification           | V3-N28 by PO authorization; Master Plan not revised                             |
| W5-N01…N27 boundaries unchanged       | Regression                                                                      |

---

## 5. Governance validation

| Area                           | Must prove                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| Ownership unchanged            | No ownership movement                                        |
| Previous packages unmodified   | Consume only                                                 |
| No hidden future functionality | Persistence does not smuggle later package scope             |
| Implementation authorization   | Planning APPROVED; Repo Sync COMPLETE; slices not authorized |
| Close Evidence assembled       | Deferred until authorized Close Evidence slice               |
| Planning Approval              | **RECORDED**                                                 |
| Planning Review                | **PASS**                                                     |
| Repository Synchronization     | **COMPLETE**                                                 |

---

## 6. W5-N28-a validation (inventory)

| Check                                                      | Expected / Status    |
| ---------------------------------------------------------- | -------------------- |
| Machine inventory rows ≥ 50                                | **PASS** (120)       |
| Classifications cover all five                             | **PASS**             |
| RECOVERABLE and EPHEMERAL non-empty                        | **PASS** (51 / 12)   |
| DECISION / CONFIGURATION present                           | **PASS** (3 / 3)     |
| `projectionPublicationInventoryMissing`                    | **false**            |
| No publication functional authorization                    | **PASS**             |
| Inventory-only honesty boundaries                          | **PASS**             |
| Inventory performs Runtime Decision Projection Publication | **No**               |
| Inventory performs Runtime Decision Projection             | **No**               |
| Inventory performs Runtime Decision Evaluation             | **No**               |
| Inventory performs runtime scheduling                      | **No**               |
| Inventory determines eligibility                           | **No**               |
| Inventory performs Retry Backoff Calculation               | **No**               |
| Inventory schedules / executes retries                     | **No** / **No**      |
| Ownership / architecture changed                           | **No** / **No**      |
| Customer-visible feature                                   | **None**             |
| W5-N28-b Persistence                                       | **COMPLETE** (local) |

**Evidence:** [`w5-n28-a-inventory.md`](./w5-n28-a-inventory.md) · [`w5-n28-a-validation-report.md`](./w5-n28-a-validation-report.md) · `apps/api/src/platform-conformance/w5-n28-a-retry-scheduling-decision-projection-publication*.ts`

---

## 7. W5-N28-b validation (persistence)

| Check                                                           | Expected / Status |
| --------------------------------------------------------------- | ----------------- |
| Recoverable Decision Projection Publication artifacts persisted | **PASS**          |
| Survive process termination                                     | **Yes**           |
| Automatic restart recovery                                      | **No** (W5-N28-c) |
| `publicationPersistenceMissing`                                 | **false**         |
| Persistence performs Runtime Decision Projection Publication    | **No**            |
| Persistence performs runtime publication                        | **No**            |
| Persistence performs Runtime Decision Projection                | **No**            |
| Persistence performs Runtime Decision Evaluation                | **No**            |
| Persistence performs runtime scheduling                         | **No**            |
| Persistence performs Retry Backoff Calculation                  | **No**            |
| Persistence determines Retry Eligibility                        | **No**            |
| Persistence executes retries                                    | **No**            |
| Ownership / architecture changed                                | **No** / **No**   |
| Customer-visible feature                                        | **None**          |
| W5-N28-c Restart Recovery                                       | **Not opened**    |

**Evidence:** [`w5-n28-b-implementation-report.md`](./w5-n28-b-implementation-report.md) · [`w5-n28-b-validation-report.md`](./w5-n28-b-validation-report.md) · `apps/api/src/platform-conformance/w5-n28-b-durable-notification-platform-retry-scheduling-decision-projection-publication*.ts`

## 8. W5-N28-c validation (restart recovery)

| Check                                                                   | Expected / Status    |
| ----------------------------------------------------------------------- | -------------------- |
| Decision Projection Publication artifacts restored after normal restart | **PASS**             |
| Recovery deterministic / idempotent                                     | **Yes** / **Yes**    |
| Fabricate missing / restore corrupted                                   | **No** / **No**      |
| `publicationRecoveryMissing`                                            | **false**            |
| Recovery performs Runtime Decision Projection Publication               | **No**               |
| Recovery performs runtime publication                                   | **No**               |
| Recovery performs Runtime Decision Projection                           | **No**               |
| Recovery performs Runtime Decision Evaluation                           | **No**               |
| Recovery performs runtime scheduling                                    | **No**               |
| Recovery performs Retry Backoff Calculation                             | **No**               |
| Recovery determines Retry Eligibility                                   | **No**               |
| Recovery executes retries                                               | **No**               |
| Ownership / architecture changed                                        | **No** / **No**      |
| Customer-visible feature                                                | **None**             |
| W5-N28-d Operational Continuity                                         | **COMPLETE** (local) |

### W5-N28-d Operational Continuity Foundation

| Check                                                            | Expected / Status                |
| ---------------------------------------------------------------- | -------------------------------- |
| Readiness derived from recovered Publication + integrity + owner | **PASS**                         |
| Supported states Recovering / Ready / Degraded / Unavailable     | **Yes**                          |
| Fabricate readiness                                              | **No**                           |
| Healthy owners continue reporting Ready                          | **Yes**                          |
| `publicationOperationalContinuityMissing`                        | **false**                        |
| Continuity performs Decision Projection Publication              | **No**                           |
| Continuity performs runtime publication                          | **No**                           |
| Continuity performs Runtime Decision Projection                  | **No**                           |
| Continuity performs Runtime Decision Evaluation                  | **No**                           |
| Continuity performs runtime scheduling                           | **No**                           |
| Continuity performs Retry Backoff Calculation                    | **No**                           |
| Continuity determines Retry Eligibility                          | **No**                           |
| Continuity executes retries                                      | **No**                           |
| Ownership / architecture changed                                 | **No** / **No**                  |
| Customer-visible feature                                         | Operator Platform Readiness only |
| W5-N28-e Package Close                                           | **COMPLETE** (local)             |

**Evidence:** [`w5-n28-d-implementation-report.md`](./w5-n28-d-implementation-report.md) · [`w5-n28-d-validation-report.md`](./w5-n28-d-validation-report.md) · `apps/api/src/platform-conformance/w5-n28-d-notification-platform-retry-scheduling-decision-projection-publication-operational-continuity*.ts`

### W5-N28-e Package Validation, Operational Verification & Close Evidence

| Check                                            | Expected / Status             |
| ------------------------------------------------ | ----------------------------- |
| Complete operational journey                     | **PASS**                      |
| Approved slices a–d validated                    | **Yes**                       |
| Decision Projection Publication Foundation only  | **Yes**                       |
| Operational Readiness derived only               | **Yes**                       |
| Runtime Publication claimed                      | **No**                        |
| Runtime Decision Projection claimed              | **No**                        |
| Runtime Decision Evaluation claimed              | **No**                        |
| Runtime Scheduler claimed                        | **No**                        |
| Retry Execution claimed                          | **No**                        |
| Ownership / architecture changed                 | **No** / **No**               |
| Package declared CLOSED                          | **Yes** — CLOSED (2026-09-13) |
| Final Package Integration Verification performed | **PASS** (local) — accepted   |

**Evidence:** [`w5-n28-e-implementation-report.md`](./w5-n28-e-implementation-report.md) · [`w5-n28-e-validation-report.md`](./w5-n28-e-validation-report.md) · [`w5-n28-close-package-report.md`](./w5-n28-close-package-report.md) · [`w5-n28-final-integration-verification.md`](./w5-n28-final-integration-verification.md) · [`w5-n28-product-owner-close-record.md`](./w5-n28-product-owner-close-record.md) · `apps/api/src/platform-conformance/w5-n28-e-package-close-evidence*.ts`

**Evidence:** [`w5-n28-c-implementation-report.md`](./w5-n28-c-implementation-report.md) · [`w5-n28-c-validation-report.md`](./w5-n28-c-validation-report.md) · `apps/api/src/platform-conformance/w5-n28-c-notification-platform-retry-scheduling-decision-projection-publication-restart-recovery*.ts`

## Mandatory Questions

1. **What business problem does W5-N28 solve?** Plan Notification Retry Scheduling Decision Projection Publication after the Decision Projection Foundation is complete.
2. **Why does it follow W5-N27?** Decision Projection Publication depends on the completed Decision Projection Foundation and all preceding retry foundations.
3. **What does it consume?** Closed W5-N01…W5-N27 and existing notification-delivery capabilities.
4. **What does it own?** Planning for Notification Retry Scheduling Decision Projection Publication; W5-N28-a owns inventory only.
5. **What is explicitly out of scope?** Runtime publication, runtime Decision Projection, runtime Decision Evaluation, runtime scheduling, retry execution, Retry Engine, workers, timers, transports, monitoring, BC, HA, DR.
6. **Does it perform Decision Projection Publication?** No.
7. **Does it perform Runtime Decision Projection?** No.
8. **Does it perform Runtime Decision Evaluation?** No.
9. **Does it perform Runtime Scheduling?** No.
10. **Does it execute retries?** No.
11. **Were any ownership boundaries changed?** No.
12. **Were any architectural deviations introduced?** No.

---

## Technical debt delta

| Category   | Item                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Resolved   | Planning Approval completed                                                                     |
|            | W5-N28 Planning Package synchronized                                                            |
|            | Notification Retry Scheduling Decision Projection Publication inventory baseline established    |
|            | Notification Retry Scheduling Decision Projection Publication Persistence Foundation            |
|            | Notification Retry Scheduling Decision Projection Publication Restart Recovery Foundation       |
|            | Notification Retry Scheduling Decision Projection Publication Operational Continuity Foundation |
|            | Notification Retry Scheduling Decision Projection Publication Package Close Evidence            |
|            | Final Package Integration Verification                                                          |
|            | W5-N28 governance lifecycle completed                                                           |
| Introduced | None                                                                                            |
| Deferred   | Repository Synchronization after Product Owner Final Close                                      |
|            | Runtime Decision Projection Publication                                                         |

---

**STOP.** W5-N28 is **CLOSED** by Product Owner (2026-09-13). Await Repository Synchronization. Do **not** open W5-N29. Do **not** commit. Do **not** push. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
