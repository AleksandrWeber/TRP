# W5-N25 Validation Plan

**Package:** W5-N25 Notification Retry Scheduling Decision Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N25 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-12). Repository Synchronization (Planning) **COMPLETE**. W5-N25-a Inventory **COMPLETE**. W5-N25-b Persistence **COMPLETE**. W5-N25-c Restart Recovery **COMPLETE**. W5-N25-d Operational Continuity **COMPLETE** (local). No runtime scheduling. No scheduling decision runtime.
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

| Area                           | Must prove                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Ownership unchanged            | No ownership movement                                                                        |
| Previous packages unmodified   | Consume only                                                                                 |
| No hidden future functionality | Persistence does not smuggle later package scope                                             |
| Implementation authorization   | Planning APPROVED; Repo Sync COMPLETE; W5-N25-a…c COMPLETE (local for c); d–e not authorized |
| Close Evidence assembled       | Deferred until authorized Close Evidence slice                                               |
| Planning Approval              | **RECORDED**                                                                                 |
| Repository Synchronization     | **COMPLETE**                                                                                 |

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

| Check                                          | Expected / Status          |
| ---------------------------------------------- | -------------------------- |
| Recoverable Decision artifacts persisted       | **PASS**                   |
| Survive process termination                    | **Yes**                    |
| Automatic restart recovery                     | **No**                     |
| Persistence on notification-delivery owner     | **PASS**                   |
| No new persistence owner / Source of Truth     | **PASS**                   |
| Persistence performs runtime decision logic    | **No**                     |
| Persistence performs runtime scheduling        | **No**                     |
| Persistence performs Retry Backoff Calculation | **No**                     |
| Persistence determines Retry Eligibility       | **No**                     |
| Persistence executes retries                   | **No**                     |
| Ownership / architecture changed               | **No** / **No**            |
| Customer-visible feature                       | **None**                   |
| W5-N25-c opened                                | **Yes** — COMPLETE (local) |

**Evidence:** [`w5-n25-b-implementation-report.md`](./w5-n25-b-implementation-report.md) · [`w5-n25-b-validation-report.md`](./w5-n25-b-validation-report.md) · `apps/api/src/platform-conformance/w5-n25-b-durable-notification-platform-retry-scheduling-decision*.ts`

---

## 8. W5-N25-c validation (restart recovery)

| Check                                            | Expected / Status          |
| ------------------------------------------------ | -------------------------- |
| Decision artifacts restored after normal restart | **PASS**                   |
| Recovery deterministic                           | **Yes**                    |
| Recovery idempotent                              | **Yes**                    |
| Fabricate missing artifacts                      | **No**                     |
| Restore corrupted artifacts                      | **No**                     |
| Existing Restart Recovery framework reused       | **PASS**                   |
| No duplicate recovery subsystem                  | **PASS**                   |
| Recovery performs runtime decision logic         | **No**                     |
| Recovery performs runtime scheduling             | **No**                     |
| Recovery performs Retry Backoff Calculation      | **No**                     |
| Recovery determines Retry Eligibility            | **No**                     |
| Recovery executes retries                        | **No**                     |
| Ownership / architecture changed                 | **No** / **No**            |
| Customer-visible feature                         | **None**                   |
| W5-N25-d opened                                  | **Yes** — COMPLETE (local) |

**Evidence:** [`w5-n25-c-implementation-report.md`](./w5-n25-c-implementation-report.md) · [`w5-n25-c-validation-report.md`](./w5-n25-c-validation-report.md) · `apps/api/src/platform-conformance/w5-n25-c-notification-platform-retry-scheduling-decision-restart-recovery*.ts`

---

## 9. W5-N25-d validation (operational continuity)

| Check                                                        | Expected / Status                |
| ------------------------------------------------------------ | -------------------------------- |
| Readiness derived from recovered state + integrity           | **PASS**                         |
| States: Recovering / Ready / Degraded / Unavailable          | **PASS**                         |
| Degraded fabricates Ready                                    | **No**                           |
| Healthy owners continue when rules allow                     | **Yes**                          |
| Runtime decision / scheduling / calc / eligibility / execute | **No**                           |
| Ownership / architecture changed                             | **No** / **No**                  |
| Customer-visible feature                                     | Operator Platform Readiness only |
| W5-N25-e opened                                              | **No**                           |

**Evidence:** [`w5-n25-d-implementation-report.md`](./w5-n25-d-implementation-report.md) · [`w5-n25-d-validation-report.md`](./w5-n25-d-validation-report.md) · `apps/api/src/platform-conformance/w5-n25-d-notification-platform-retry-scheduling-decision-operational-continuity*.ts`

---

## 10. Implementation slice e (deferred)

**Not opened. Not authorized.**

---

## Mandatory Questions (slice d)

1. **What customer-visible functionality was delivered?** Operator Platform Readiness only.
2. **How is readiness determined?** Derived from recovered Decision state, owner readiness, and persistence integrity.
3. **Which operational states are supported?** Recovering, Ready, Degraded, Unavailable.
4. **Can readiness be fabricated?** No.
5. **Can healthy owners continue operating?** Yes.
6. **Does this perform runtime decision logic?** No.
7. **Does this perform runtime scheduling?** No.
8. **Does this perform Retry Backoff Calculation?** No.
9. **Does this determine Retry Eligibility?** No.
10. **Does this execute retries?** No.
11. **Were any ownership boundaries changed?** No.
12. **Were any architectural deviations introduced?** No.

---

## Technical debt delta

| Category   | Item                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Resolved   | Notification Retry Scheduling Decision inventory baseline established    |
|            | Notification Retry Scheduling Decision Persistence Foundation            |
|            | Notification Retry Scheduling Decision Restart Recovery Foundation       |
|            | Notification Retry Scheduling Decision Operational Continuity Foundation |
| Introduced | None                                                                     |
| Deferred   | Package Validation, Operational Verification & Close Evidence (W5-N25-e) |

---

**STOP.** W5-N25-d Operational Continuity is **COMPLETE** (local). Await Product Owner Review. Do not open W5-N25-e. Do not commit. Do not push. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
