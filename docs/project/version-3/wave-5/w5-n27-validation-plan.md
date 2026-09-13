# W5-N27 Validation Plan

**Package:** W5-N27 Notification Retry Scheduling Decision Projection Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N27 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-13). Repository Synchronization (Planning) **COMPLETE**. W5-N27-a Inventory **COMPLETE**. W5-N27-b Persistence **COMPLETE**. W5-N27-c Restart Recovery **COMPLETE** (local). No runtime decision projection. No runtime scheduling.
**Date:** 2026-09-13
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n27-product-scope.md`](./w5-n27-product-scope.md)
**Security:** [`w5-n27-security-review.md`](./w5-n27-security-review.md)
**Umbrella:** [`w5-n27-implementation-package.md`](./w5-n27-implementation-package.md)
**Overview:** [`w5-n27-overview.md`](./w5-n27-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform decision projection foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), Retry Backoff Calculation, Retry Eligibility determination, Scheduling Decision Evaluation, Runtime Decision Projection, runtime scheduling, scheduling execution, retry execution, transport execution success, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantees, dead-letter processing, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from N27 alone. Validate **Notification Retry Scheduling Decision Projection Foundation** outcomes only for authorized slices.

---

## 0. What Close means for W5-N27

| Gate                | Meaning                                                                                                                                                                                                                                      | Unlocks                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N27 Closed**   | Platform decision projection foundation evidenced; walkthrough PASS (post-implementation)                                                                                                                                                    | V3-N27 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N27 alone                                                                                                                                                                                                                   | Requires separate PO act          |
| **Not claimed**     | Live Trading / live orders                                                                                                                                                                                                                   | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                                                                                                                                                               | Separate PO act                   |
| **Not claimed**     | Live Notifications / Production Ready                                                                                                                                                                                                        | Separate PO acts                  |
| **Not claimed**     | Successful delivery / provider acceptance / recipient receipt                                                                                                                                                                                | Transport evidence required       |
| **Not claimed**     | Exactly-once delivery / delivery guarantee                                                                                                                                                                                                   | Outside foundation                |
| **Not claimed**     | Retry Backoff Calculation / Eligibility determination / Scheduling Decision Evaluation / Runtime Decision Projection / runtime scheduling / scheduling execution / executing retries / workers / timers implementation / queues / transports | Deferred product scope            |
| **Not claimed**     | Retry Engine / Runtime Decision Engine / Runtime Projection Engine / Runtime Scheduler / Worker / Timer / Scheduler Platform / Workflow Engine / Event Bus / orchestration platform                                                          | Forbidden                         |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No Retry Engine; projection extension only; PC-06 preserved            |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N26 boundaries                                        |
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

| Area                                 | Must prove                                                         |
| ------------------------------------ | ------------------------------------------------------------------ |
| Projection foundation integrity      | Platform Ready requires projection foundation evidence             |
| Per-channel honesty                  | Reserved-inactive not presented as Connected                       |
| N05…N26 platform honesty             | Prior platform truth not overridden by projection layer            |
| Secret non-echo                      | Responses, logs, errors never include secrets                      |
| Workspace binding                    | Missing/wrong workspace fails closed                               |
| Cross-channel isolation              | Channel A state cannot leak to channel B                           |
| No capital side effect               | Projection foundation never places live orders                     |
| No delivery success claim            | Foundation ≠ successful delivery / acceptance / receipt            |
| No fake Projection Ready             | Label requires real foundation outcome evidence                    |
| Fail honest                          | Missing/corrupt state surfaces honestly                            |
| No backoff calculation claim         | Projection ≠ Retry Backoff Calculation                             |
| No eligibility claim                 | Projection ≠ Retry Eligibility determination                       |
| No Scheduling Decision Evaluation    | Projection ≠ Scheduling Decision Evaluation                        |
| No Runtime Decision Projection claim | Projection planning ≠ Runtime Decision Projection                  |
| No runtime schedule / execute        | Projection ≠ runtime scheduling / scheduling execution / execution |

---

## 3. Documentation validation

| Area                      | Must prove                                                       |
| ------------------------- | ---------------------------------------------------------------- |
| Planning package complete | All W5-N27 planning documents present and internally consistent  |
| Slice a–e reports         | Only after authorized slices (not opened)                        |
| Operational walkthrough   | Platform Decision Projection Foundation Walkthrough at Close     |
| Close Evidence            | Package summary, close report, integration verification at Close |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized           |

---

## 4. Architecture validation

| Area                                  | Must prove                                                          |
| ------------------------------------- | ------------------------------------------------------------------- |
| No second engine                      | Notification Delivery decision projection foundation extension only |
| No Retry Engine product               | Capability of notification-delivery only                            |
| No Runtime Decision Engine product    | Forbidden                                                           |
| No Runtime Projection Engine product  | Forbidden                                                           |
| No Runtime Scheduler product          | Forbidden                                                           |
| No Worker product                     | Forbidden                                                           |
| No Timer implementation               | Forbidden                                                           |
| No Scheduler Platform                 | Forbidden                                                           |
| No Workflow Engine                    | Projection on existing owner only                                   |
| No Event Bus / orchestration platform | Forbidden                                                           |
| Persistence ownership preserved       | Extend `notification-delivery` only                                 |
| Source of Truth preserved             | PC-06 / Ledger untouched                                            |
| No Version 2 modification             | Consume only                                                        |
| No Master Plan modification           | V3-N27 by PO authorization; Master Plan not revised                 |
| W5-N01…N26 boundaries unchanged       | Regression                                                          |

---

## 5. Governance validation

| Area                           | Must prove                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Ownership unchanged            | No ownership movement                                                                                                      |
| Previous packages unmodified   | Consume only                                                                                                               |
| No hidden future functionality | Persistence does not smuggle later package scope                                                                           |
| Implementation authorization   | Planning APPROVED; Repo Sync COMPLETE; W5-N27-a COMPLETE; W5-N27-b COMPLETE; W5-N27-c COMPLETE (local); d–e not authorized |
| Close Evidence assembled       | Deferred until authorized Close Evidence slice                                                                             |
| Planning Approval              | **RECORDED**                                                                                                               |
| Repository Synchronization     | **COMPLETE**                                                                                                               |

---

## 6. W5-N27-a validation (inventory)

| Check                                          | Expected / Status    |
| ---------------------------------------------- | -------------------- |
| Machine inventory rows ≥ 50                    | **PASS** (117)       |
| Classifications cover all five                 | **PASS**             |
| RECOVERABLE and EPHEMERAL non-empty            | **PASS** (50 / 12)   |
| DECISION / CONFIGURATION present               | **PASS** (3 / 3)     |
| No projection functional authorization         | **PASS**             |
| Inventory-only honesty boundaries              | **PASS**             |
| Inventory performs runtime decision projection | **No**               |
| Inventory performs runtime decision evaluation | **No**               |
| Inventory performs runtime scheduling          | **No**               |
| Inventory determines eligibility               | **No**               |
| Inventory performs Retry Backoff Calculation   | **No**               |
| Inventory schedules / executes retries         | **No** / **No**      |
| Ownership / architecture changed               | **No** / **No**      |
| Customer-visible feature                       | **None**             |
| W5-N27-b Persistence                           | **COMPLETE** (local) |

**Evidence:** [`w5-n27-a-inventory.md`](./w5-n27-a-inventory.md) · [`w5-n27-a-validation-report.md`](./w5-n27-a-validation-report.md) · `apps/api/src/platform-conformance/w5-n27-a-retry-scheduling-decision-projection*.ts`

---

## 7. W5-N27-b validation (persistence)

| Check                                               | Expected / Status |
| --------------------------------------------------- | ----------------- |
| Recoverable Decision Projection artifacts persisted | **PASS**          |
| Survive process termination                         | **Yes**           |
| Automatic restart recovery                          | **No** (W5-N27-c) |
| `projectionPersistenceMissing`                      | **false**         |
| Runtime decision projection                         | **No**            |
| Runtime decision evaluation                         | **No**            |
| Runtime scheduling / execution                      | **No** / **No**   |
| Ownership / architecture changed                    | **No** / **No**   |
| Customer-visible feature                            | **None**          |
| W5-N27-c opened                                     | **No**            |

**Evidence:** [`w5-n27-b-implementation-report.md`](./w5-n27-b-implementation-report.md) · [`w5-n27-b-validation-report.md`](./w5-n27-b-validation-report.md) · `apps/api/src/platform-conformance/w5-n27-b-durable-notification-platform-retry-scheduling-decision-projection.ts`

---

## 8. W5-N27-c validation (restart recovery)

| Check                                                | Expected / Status    |
| ---------------------------------------------------- | -------------------- |
| Decision Projection artifacts restored after restart | **PASS**             |
| Recovery deterministic                               | **Yes**              |
| Recovery idempotent                                  | **Yes**              |
| Fabricate missing artifacts                          | **No**               |
| Restore corrupted artifacts                          | **No**               |
| `projectionRecoveryMissing`                          | **false**            |
| Runtime decision projection                          | **No**               |
| Runtime decision evaluation                          | **No**               |
| Runtime scheduling / execution                       | **No** / **No**      |
| Ownership / architecture changed                     | **No** / **No**      |
| Customer-visible feature                             | **None**             |
| W5-N27-d opened                                      | **Yes** (authorized) |

**Evidence:** [`w5-n27-c-implementation-report.md`](./w5-n27-c-implementation-report.md) · [`w5-n27-c-validation-report.md`](./w5-n27-c-validation-report.md) · `apps/api/src/platform-conformance/w5-n27-c-notification-platform-retry-scheduling-decision-projection-restart-recovery.ts`

---

## 9. W5-N27-d validation (operational continuity)

| Check                                               | Expected / Status                |
| --------------------------------------------------- | -------------------------------- |
| Readiness derived only                              | **PASS**                         |
| States: Recovering / Ready / Degraded / Unavailable | **PASS**                         |
| Fabricate readiness                                 | **No**                           |
| Healthy owners continue                             | **Yes**                          |
| `projectionOperationalContinuityMissing`            | **false**                        |
| Runtime decision projection                         | **No**                           |
| Runtime decision evaluation                         | **No**                           |
| Runtime scheduling / execution                      | **No** / **No**                  |
| Ownership / architecture changed                    | **No** / **No**                  |
| Customer-visible feature                            | Operator Platform Readiness only |
| W5-N27-e opened                                     | **Yes** — COMPLETE (local)       |

**Evidence:** [`w5-n27-d-implementation-report.md`](./w5-n27-d-implementation-report.md) · [`w5-n27-d-validation-report.md`](./w5-n27-d-validation-report.md) · `apps/api/src/platform-conformance/w5-n27-d-notification-platform-retry-scheduling-decision-projection-operational-continuity.ts`

---

## 10. W5-N27-e validation (Close Evidence)

| Check                                            | Expected / Status      |
| ------------------------------------------------ | ---------------------- |
| Package Close Evidence assembled                 | **PASS**               |
| Approved slices a–d validated                    | **PASS**               |
| Operational journey verified                     | **PASS**               |
| Decision Projection Foundation only preserved    | **Yes**                |
| Operational Readiness derived only               | **Yes**                |
| Runtime Decision Projection / Evaluation claimed | **No** / **No**        |
| Runtime Scheduler / Retry Execution claimed      | **No** / **No**        |
| Ownership / architecture changed                 | **No** / **No**        |
| Package declared CLOSED                          | **No**                 |
| Final Package Integration Verification performed | **Yes** — PASS (local) |
| W5-N28 opened                                    | **No**                 |
| Customer-visible feature                         | **None**               |

**Evidence:** [`w5-n27-e-implementation-report.md`](./w5-n27-e-implementation-report.md) · [`w5-n27-e-validation-report.md`](./w5-n27-e-validation-report.md) · [`w5-n27-close-package-report.md`](./w5-n27-close-package-report.md) · `apps/api/src/platform-conformance/w5-n27-e-package-close-evidence.ts`

---

## 11. Final Package Integration Verification

| Check                                         | Expected / Status             |
| --------------------------------------------- | ----------------------------- |
| Internally consistent                         | **Yes**                       |
| Fully integrated                              | **Yes**                       |
| Regression-safe                               | **Yes**                       |
| Documentation synchronized                    | **Yes**                       |
| Decision Projection Foundation only preserved | **Yes**                       |
| Ready for Product Owner Final Close           | **Yes**                       |
| Package declared CLOSED                       | **Yes** — CLOSED (2026-09-13) |
| Product Owner Close Record created            | **Yes**                       |
| W5-N28 opened                                 | **No**                        |

**Evidence:** [`w5-n27-final-integration-verification.md`](./w5-n27-final-integration-verification.md) — **PASS** (local)

---

## 12. Product Owner Final Close

| Check                                           | Expected / Status |
| ----------------------------------------------- | ----------------- |
| W5-N27 officially CLOSED                        | **Yes**           |
| All implementation slices accepted              | **Yes**           |
| Final Package Integration Verification accepted | **Yes**           |
| Decision Projection Foundation only preserved   | **Yes**           |
| Ownership changed                               | **No**            |
| Architectural deviations                        | **No**            |
| W5-N28 opened                                   | **No**            |
| Repository Synchronization performed            | **No** — pending  |

**Evidence:** [`w5-n27-product-owner-close-record.md`](./w5-n27-product-owner-close-record.md) — **CLOSED** (2026-09-13)

---

## Mandatory Questions (Planning / Slice a / Slice b / Slice c / Slice d / Slice e)

1. **What business problem does W5-N27 solve?** Plan Notification Retry Scheduling Decision Projection after the Decision Evaluation Foundation is complete.
2. **Why does it follow W5-N26?** Decision Projection depends on the completed Decision Evaluation Foundation and all preceding retry foundations.
3. **What does it consume?** Closed W5-N01…W5-N26 and existing notification-delivery capabilities.
4. **What does it own?** Planning for Notification Retry Scheduling Decision Projection; W5-N27-a owns inventory; W5-N27-b owns persistence; W5-N27-c owns restart recovery; W5-N27-d owns derived operational readiness; W5-N27-e owns package validation and Close Evidence only.
5. **What is explicitly out of scope?** Runtime decision projection, runtime decision evaluation, runtime scheduling, retry execution, Retry Engine, workers, timers, transports, monitoring, BC, HA, DR.
6. **Does it perform Retry Backoff Calculation?** No.
7. **Does it determine Retry Eligibility?** No.
8. **Does it perform Scheduling Decision Evaluation?** No.
9. **Does it perform Runtime Decision Projection?** No.
10. **Does it perform Runtime Scheduling?** No.
11. **Does it execute retries?** No.
12. **Were any ownership boundaries changed?** No.
13. **Were any architectural deviations introduced?** No.

---

## Technical debt delta

| Category   | Item                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| Resolved   | Planning Approval completed                                                         |
|            | W5-N27 Planning Package synchronized                                                |
|            | Notification Retry Scheduling Decision Projection inventory baseline established    |
|            | Notification Retry Scheduling Decision Projection Persistence Foundation            |
|            | Notification Retry Scheduling Decision Projection Restart Recovery Foundation       |
|            | Notification Retry Scheduling Decision Projection Operational Continuity Foundation |
|            | Package validation and Close Evidence assembled                                     |
|            | Final Package Integration Verification completed                                    |
|            | W5-N27 governance lifecycle completed                                               |
| Introduced | None                                                                                |
| Deferred   | Repository Synchronization after Product Owner Final Close                          |
|            | Runtime decision projection                                                         |

---

**STOP.** W5-N27 is **CLOSED** by Product Owner (2026-09-13). Await Repository Synchronization. Do not open W5-N28. Do not commit. Do not push. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
