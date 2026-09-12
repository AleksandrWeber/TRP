# W5-N25 Validation Plan

**Package:** W5-N25 Notification Retry Scheduling Decision Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N25 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-12). Repository Synchronization (Planning) **COMPLETE**. W5-N25-a Inventory **COMPLETE**. W5-N25-b Persistence **COMPLETE** (local). No runtime scheduling. No scheduling decision runtime.
**Date:** 2026-09-12
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n25-product-scope.md`](./w5-n25-product-scope.md)
**Security:** [`w5-n25-security-review.md`](./w5-n25-security-review.md)
**Umbrella:** [`w5-n25-implementation-package.md`](./w5-n25-implementation-package.md)
**Overview:** [`w5-n25-overview.md`](./w5-n25-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform decision foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), Retry Backoff Calculation, Retry Eligibility determination, runtime scheduling, scheduling execution, retry execution, transport execution success, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantees, dead-letter processing, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from N25 alone. Validate **Notification Retry Scheduling Decision Foundation** outcomes only for authorized slices.

---

## 0. What Close means for W5-N25

| Gate                | Meaning                                                                                                                                                                       | Unlocks                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **W5-N25 Closed**   | Platform decision foundation evidenced; walkthrough PASS (post-implementation)                                                                                                | V3-N25 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N25 alone                                                                                                                                                    | Requires separate PO act          |
| **Not claimed**     | Live Trading / live orders                                                                                                                                                    | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                                                                                                | Separate PO act                   |
| **Not claimed**     | Live Notifications / Production Ready                                                                                                                                         | Separate PO acts                  |
| **Not claimed**     | Successful delivery / provider acceptance / recipient receipt                                                                                                                 | Transport evidence required       |
| **Not claimed**     | Exactly-once delivery / delivery guarantee                                                                                                                                    | Outside foundation                |
| **Not claimed**     | Retry Backoff Calculation / Eligibility determination / runtime scheduling / scheduling execution / executing retries / workers / timers implementation / queues / transports | Deferred product scope            |
| **Not claimed**     | Retry Engine / Runtime Scheduler / Worker / Timer / Scheduler Platform / Workflow Engine / Event Bus / orchestration platform                                                 | Forbidden                         |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No Retry Engine; decision extension only; PC-06 preserved              |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N24 boundaries                                        |
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

| Area                          | Must prove                                                       |
| ----------------------------- | ---------------------------------------------------------------- |
| Decision foundation integrity | Platform Ready requires decision foundation evidence             |
| Per-channel honesty           | Reserved-inactive not presented as Connected                     |
| N05…N24 platform honesty      | Prior platform truth not overridden by decision layer            |
| Secret non-echo               | Responses, logs, errors never include secrets                    |
| Workspace binding             | Missing/wrong workspace fails closed                             |
| Cross-channel isolation       | Channel A state cannot leak to channel B                         |
| No capital side effect        | Decision foundation never places live orders                     |
| No delivery success claim     | Foundation ≠ successful delivery / acceptance / receipt          |
| No fake Decision Ready        | Label requires real foundation outcome evidence                  |
| Fail honest                   | Missing/corrupt state surfaces honestly                          |
| No backoff calculation claim  | Decision ≠ Retry Backoff Calculation                             |
| No eligibility claim          | Decision ≠ Retry Eligibility determination                       |
| No runtime schedule / execute | Decision ≠ runtime scheduling / scheduling execution / execution |

---

## 3. Documentation validation

| Area                      | Must prove                                                       |
| ------------------------- | ---------------------------------------------------------------- |
| Planning package complete | All W5-N25 planning documents present and internally consistent  |
| Slice a–e reports         | Only after authorized slices (not opened)                        |
| Operational walkthrough   | Platform Decision Foundation Walkthrough at Close                |
| Close Evidence            | Package summary, close report, integration verification at Close |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized           |

---

## 4. Architecture validation

| Area                                  | Must prove                                               |
| ------------------------------------- | -------------------------------------------------------- |
| No second engine                      | Notification Delivery decision foundation extension only |
| No Retry Engine product               | Capability of notification-delivery only                 |
| No Runtime Scheduler product          | Forbidden                                                |
| No Worker product                     | Forbidden                                                |
| No Timer implementation               | Forbidden                                                |
| No Scheduler Platform                 | Forbidden                                                |
| No Workflow Engine                    | Decision on existing owner only                          |
| No Event Bus / orchestration platform | Forbidden                                                |
| Persistence ownership preserved       | Extend `notification-delivery` only                      |
| Source of Truth preserved             | PC-06 / Ledger untouched                                 |
| No Version 2 modification             | Consume only                                             |
| No Master Plan modification           | V3-N25 by PO authorization; Master Plan not revised      |
| W5-N01…N24 boundaries unchanged       | Regression                                               |

---

## 5. Governance validation

| Area                           | Must prove                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Ownership unchanged            | No ownership movement                                                                                   |
| Previous packages unmodified   | Consume only                                                                                            |
| No hidden future functionality | Persistence does not smuggle later package scope                                                        |
| Implementation authorization   | Planning APPROVED; Repo Sync COMPLETE; W5-N25-a COMPLETE; W5-N25-b COMPLETE (local); c–e not authorized |
| Close Evidence assembled       | Deferred until authorized Close Evidence slice                                                          |
| Planning Approval              | **RECORDED**                                                                                            |
| Repository Synchronization     | **COMPLETE**                                                                                            |

---

## 6. W5-N25-a validation (inventory)

| Check                                        | Expected / Status          |
| -------------------------------------------- | -------------------------- |
| Machine inventory rows ≥ 50                  | **PASS** (102)             |
| Classifications cover all five               | **PASS**                   |
| RECOVERABLE and EPHEMERAL non-empty          | **PASS** (38 / 12)         |
| DECISION / CONFIGURATION present             | **PASS** (3 / 3)           |
| No decision functional authorization         | **PASS**                   |
| Inventory-only honesty boundaries            | **PASS**                   |
| Inventory performs runtime decision logic    | **No**                     |
| Inventory makes scheduling decisions         | **No**                     |
| Inventory determines eligibility             | **No**                     |
| Inventory performs Retry Backoff Calculation | **No**                     |
| Inventory schedules / executes retries       | **No** / **No**            |
| Ownership / architecture changed             | **No** / **No**            |
| Customer-visible feature                     | **None**                   |
| W5-N25-b opened                              | **Yes** — COMPLETE (local) |

**Evidence:** [`w5-n25-a-inventory.md`](./w5-n25-a-inventory.md) · [`w5-n25-a-validation-report.md`](./w5-n25-a-validation-report.md) · `apps/api/src/platform-conformance/w5-n25-a-retry-scheduling-decision*.ts`

---

## 7. W5-N25-b validation (durable persistence)

| Check                                          | Expected / Status |
| ---------------------------------------------- | ----------------- |
| Recoverable Decision artifacts persisted       | **PASS**          |
| Survive process termination                    | **Yes**           |
| Automatic restart recovery                     | **No**            |
| Persistence on notification-delivery owner     | **PASS**          |
| No new persistence owner / Source of Truth     | **PASS**          |
| Persistence performs runtime decision logic    | **No**            |
| Persistence performs runtime scheduling        | **No**            |
| Persistence performs Retry Backoff Calculation | **No**            |
| Persistence determines Retry Eligibility       | **No**            |
| Persistence executes retries                   | **No**            |
| Ownership / architecture changed               | **No** / **No**   |
| Customer-visible feature                       | **None**          |
| W5-N25-c opened                                | **No**            |

**Evidence:** [`w5-n25-b-implementation-report.md`](./w5-n25-b-implementation-report.md) · [`w5-n25-b-validation-report.md`](./w5-n25-b-validation-report.md) · `apps/api/src/platform-conformance/w5-n25-b-durable-notification-platform-retry-scheduling-decision*.ts`

---

## 8. Implementation slices c–e (deferred)

**Not opened. Not authorized.**

---

## Mandatory Questions (slice b)

1. **What customer-visible functionality was delivered?** None.
2. **Were recoverable Decision artifacts persisted?** Yes.
3. **Can persisted artifacts survive process termination?** Yes.
4. **Can persisted artifacts automatically recover after restart?** No.
5. **Does persistence perform runtime decision logic?** No.
6. **Does persistence perform runtime scheduling?** No.
7. **Does persistence perform Retry Backoff Calculation?** No.
8. **Does persistence determine Retry Eligibility?** No.
9. **Does persistence execute retries?** No.
10. **Were any ownership boundaries changed?** No.
11. **Were any architectural deviations introduced?** No.

---

## Technical debt delta

| Category   | Item                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Resolved   | Notification Retry Scheduling Decision inventory baseline established    |
|            | Notification Retry Scheduling Decision Persistence Foundation            |
| Introduced | None                                                                     |
| Deferred   | Restart Recovery Foundation (W5-N25-c)                                   |
|            | Operational Continuity Foundation (W5-N25-d)                             |
|            | Package Validation, Operational Verification & Close Evidence (W5-N25-e) |

---

**STOP.** W5-N25-b Persistence is **COMPLETE** (local). Await Product Owner Review. Do not open W5-N25-c. Do not commit. Do not push. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
