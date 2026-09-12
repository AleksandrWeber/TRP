# W5-N24 Validation Plan

**Package:** W5-N24 Notification Retry Scheduling Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N24 · CM-34
**Status:** Planning Package **APPROVED** (2026-09-12). Repository Synchronization (Planning) **COMPLETE**. W5-N24-a **COMPLETE**. W5-N24-b **COMPLETE** (local) — awaiting Product Owner Review. Slices c–e **not opened**. No runtime scheduling.
**Date:** 2026-09-12
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w5-n24-product-scope.md`](./w5-n24-product-scope.md)
**Security:** [`w5-n24-security-review.md`](./w5-n24-security-review.md)
**Umbrella:** [`w5-n24-implementation-package.md`](./w5-n24-implementation-package.md)
**Overview:** [`w5-n24-overview.md`](./w5-n24-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock platform scheduling foundation without proving cross-channel foundation coherence do **not** count as Close evidence.

Do not validate per-channel production transport I/O (N01…N04 transport scope), Retry Backoff Calculation, Retry Eligibility determination, runtime scheduling, retry execution, transport execution success, provider acceptance, recipient receipt, exactly-once delivery, delivery guarantees, dead-letter processing, Live Notifications, Production Ready, Wave 5 COMPLETE, or Notification Platform Complete from N24 alone. Validate **Notification Retry Scheduling Foundation** outcomes only for authorized slices.

---

## 0. What Close means for W5-N24

| Gate                | Meaning                                                                                                                                                | Unlocks                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **W5-N24 Closed**   | Platform scheduling foundation evidenced; walkthrough PASS (post-implementation)                                                                       | V3-N24 advanced for package scope |
| **Wave 5 COMPLETE** | Not claimed from N24 alone                                                                                                                             | Requires separate PO act          |
| **Not claimed**     | Live Trading / live orders                                                                                                                             | Wave 6 + ADR                      |
| **Not claimed**     | Notification Platform Complete                                                                                                                         | Separate PO act                   |
| **Not claimed**     | Live Notifications / Production Ready                                                                                                                  | Separate PO acts                  |
| **Not claimed**     | Successful delivery / provider acceptance / recipient receipt                                                                                          | Transport evidence required       |
| **Not claimed**     | Exactly-once delivery / delivery guarantee                                                                                                             | Outside foundation                |
| **Not claimed**     | Retry Backoff Calculation / Eligibility determination / runtime scheduling / executing retries / workers / timers implementation / queues / transports | Deferred product scope            |
| **Not claimed**     | Retry Engine / Runtime Scheduler / Worker / Timer / Scheduler Platform / Workflow Engine / Event Bus / orchestration platform                          | Forbidden                         |

---

## 1. Validation strategy overview

| Layer                    | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Conformance validation   | Platform conformance registry; inventory completeness; honesty rules   |
| Documentation validation | Planning package integrity; slice reports; walkthrough; Close Evidence |
| Architecture validation  | No Retry Engine; scheduling extension only; PC-06 preserved            |
| Governance validation    | Master Plan unchanged; ownership preserved; no duplicate subsystem     |
| Regression validation    | Wave 1–4, W5-N01…N23 boundaries                                        |
| Package close validation | Final Integration Verification; Product Owner Close Record             |

### Commands (authorized slices)

| Command                        | Purpose              |
| ------------------------------ | -------------------- |
| `pnpm lint`                    | Monorepo lint        |
| `pnpm typecheck`               | Type safety          |
| `pnpm test`                    | Regression           |
| `pnpm --filter @trp/web build` | Web build            |
| `git diff --check`             | Whitespace integrity |

---

## 2. Conformance validation (post-implementation intent)

| Area                            | Must prove                                              |
| ------------------------------- | ------------------------------------------------------- |
| Scheduling foundation integrity | Platform Ready requires scheduling foundation evidence  |
| Per-channel honesty             | Reserved-inactive not presented as Connected            |
| N05…N23 platform honesty        | Prior platform truth not overridden by scheduling layer |
| Secret non-echo                 | Responses, logs, errors never include secrets           |
| Workspace binding               | Missing/wrong workspace fails closed                    |
| Cross-channel isolation         | Channel A state cannot leak to channel B                |
| No capital side effect          | Scheduling foundation never places live orders          |
| No delivery success claim       | Foundation ≠ successful delivery / acceptance / receipt |
| No fake Scheduling Ready        | Label requires real foundation outcome evidence         |
| Fail honest                     | Missing/corrupt state surfaces honestly                 |
| No backoff calculation claim    | Scheduling ≠ Retry Backoff Calculation                  |
| No eligibility claim            | Scheduling ≠ Retry Eligibility determination            |
| No runtime schedule / execute   | Scheduling ≠ runtime scheduling / execution             |

---

## 3. Documentation validation

| Area                      | Must prove                                                       |
| ------------------------- | ---------------------------------------------------------------- |
| Planning package complete | All W5-N24 planning documents present and internally consistent  |
| Slice a reports           | Inventory + six review docs present for W5-N24-a                 |
| Slice b reports           | Implementation + four review docs present for W5-N24-b           |
| Slice c–e reports         | Only after authorized slices (not opened)                        |
| Operational walkthrough   | Platform Scheduling Foundation Walkthrough at Close              |
| Close Evidence            | Package summary, close report, integration verification at Close |
| Wave documentation sync   | wave-5-overview.md and wave-5-progress.md synchronized           |

---

## 4. Architecture validation

| Area                                  | Must prove                                                 |
| ------------------------------------- | ---------------------------------------------------------- |
| No second engine                      | Notification Delivery scheduling foundation extension only |
| No Retry Engine product               | Capability of notification-delivery only                   |
| No Runtime Scheduler product          | Forbidden                                                  |
| No Worker product                     | Forbidden                                                  |
| No Timer implementation               | Forbidden                                                  |
| No Scheduler Platform                 | Forbidden                                                  |
| No Workflow Engine                    | Scheduling on existing owner only                          |
| No Event Bus / orchestration platform | Forbidden                                                  |
| Persistence ownership preserved       | Extend `notification-delivery` only                        |
| Source of Truth preserved             | PC-06 / Ledger untouched                                   |
| No Version 2 modification             | Consume only                                               |
| No Master Plan modification           | V3-N24 by PO authorization; Master Plan not revised        |
| W5-N01…N23 boundaries unchanged       | Regression                                                 |

---

## 5. Governance validation

| Area                           | Must prove                                               |
| ------------------------------ | -------------------------------------------------------- |
| Ownership unchanged            | No ownership movement                                    |
| Previous packages unmodified   | Consume only                                             |
| No hidden future functionality | Persistence does not smuggle later package scope         |
| Implementation authorization   | Planning APPROVED; W5-N24-a…b authorized; c–e not opened |
| No slices c–e opened           | W5-N24-c…e not created                                   |
| Planning Approval              | **RECORDED**                                             |
| Repository Synchronization     | **COMPLETE**                                             |

---

## 6. W5-N24-a validation (inventory)

| Check                                        | Expected / Status     |
| -------------------------------------------- | --------------------- |
| Machine inventory rows ≥ 50                  | **PASS** (83)         |
| Classifications cover all five               | **PASS**              |
| RECOVERABLE and EPHEMERAL non-empty          | **PASS** (28 / 12)    |
| SCHEDULING / CONFIGURATION present           | **PASS** (3 / 3)      |
| No scheduling functional authorization       | **PASS**              |
| Inventory-only honesty boundaries            | **PASS**              |
| Inventory determines eligibility             | **No**                |
| Inventory performs Retry Backoff Calculation | **No**                |
| Inventory schedules / executes retries       | **No** / **No**       |
| Ownership / architecture changed             | **No** / **No**       |
| Customer-visible feature                     | **None**              |
| W5-N24-b opened                              | **Yes** (persistence) |

**Evidence:** [`w5-n24-a-inventory.md`](./w5-n24-a-inventory.md) · [`w5-n24-a-validation-report.md`](./w5-n24-a-validation-report.md) · `apps/api/src/platform-conformance/w5-n24-a-retry-scheduling*.ts`

---

## 7. W5-N24-b validation (durable persistence)

| Check                                             | Expected / Status |
| ------------------------------------------------- | ----------------- |
| Durable scheduling anchors persist/load           | **PASS**          |
| Survive process termination (durable rows)        | **PASS**          |
| Automatic restart recovery                        | **No** (slice b)  |
| Inventory sync (persist-candidate RECOVERABLE)    | **PASS**          |
| Consumes W5-N19-b stack (no duplicate storage)    | **PASS**          |
| Ownership on notification-delivery only           | **PASS**          |
| Runtime scheduling / calc / eligibility / execute | **No**            |
| Ownership / architecture changed                  | **No** / **No**   |
| Customer-visible feature                          | **None**          |
| W5-N24-c opened                                   | **No**            |

**Evidence:** [`w5-n24-b-implementation-report.md`](./w5-n24-b-implementation-report.md) · [`w5-n24-b-validation-report.md`](./w5-n24-b-validation-report.md) · `apps/api/src/platform-conformance/w5-n24-b-durable-notification-platform-retry-scheduling*.ts`

---

## 8. Future slice validation (deferred — not opened)

| Slice    | Focus                       | Status         |
| -------- | --------------------------- | -------------- |
| W5-N24-c | Restart Recovery Foundation | **Not opened** |
| W5-N24-d | Operational Continuity      | **Not opened** |
| W5-N24-e | Package Validation & Close  | **Not opened** |

---

## Mandatory Questions

1. **Business problem?** Plan Notification Retry Scheduling after Backoff Calculation and Retry Eligibility are available.
2. **Why after W5-N23?** Scheduling depends on completed Backoff Calculation and Eligibility foundations.
3. **Consumes?** Closed W5-N01…W5-N23 and existing notification-delivery capabilities (incl. W5-N19-b).
4. **Owns?** Scheduling inventory (a) and durable persistence sync (b).
5. **OUT?** Runtime scheduling, retry execution, workers, timers implementation, transports, Monitoring, BC, HA, DR.
6. **Performs Retry Backoff Calculation?** No.
7. **Determines Retry Eligibility?** No.
8. **Executes retries?** No.
9. **Introduces runtime scheduling?** No.
10. **Ownership changed?** No.
11. **Architectural deviations?** No.

---

## Technical debt delta

| Category   | Item                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| Resolved   | Durable persistence foundation for Notification Retry Scheduling artifacts |
| Introduced | None                                                                       |
| Deferred   | Restart Recovery Foundation (W5-N24-c)                                     |
|            | Operational Continuity Foundation (W5-N24-d)                               |
|            | Package Validation & Close Evidence (W5-N24-e)                             |

---

**STOP.** W5-N24-b is **COMPLETE** (local). Await Product Owner Review. Do not commit. Do not push. Do not open W5-N24-c. Do NOT declare W5-N24 COMPLETE. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
