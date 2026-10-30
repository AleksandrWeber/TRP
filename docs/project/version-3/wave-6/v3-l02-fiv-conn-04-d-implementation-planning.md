# FIV-CONN-04-D Implementation Planning

**Document:** FIV-CONN-04-D Conditional Environment UPDATE + Durable Audit — Implementation Planning  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-D — Conditional environment UPDATE + durable audit  
**Authority:** Engineering / Architecture under Wave 6 PO + Chief Architect governance  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** implement D. Does **not** create production files or tests. Does **not** modify application source, A/B/C, Prisma/schema, Vault, or public APIs. Does **not** grant Implementation Authorization. Does **not** silently invent unbound policy.

**Slice Approval:** [`v3-l02-fiv-conn-04-d-slice-approval.md`](./v3-l02-fiv-conn-04-d-slice-approval.md) — **APPROVED FOR IMPLEMENTATION PLANNING**  
**Decision Freeze:** [`v3-l02-fiv-conn-04-d-decision-freeze.md`](./v3-l02-fiv-conn-04-d-decision-freeze.md)  
**Planning Review:** [`v3-l02-fiv-conn-04-d-planning-review.md`](./v3-l02-fiv-conn-04-d-planning-review.md)  
**Planning Package:** [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md)

**Repository baseline:** `e4c4e9a183c016ac23eb0d0685341438e860f46e`

**Evidence labels:**

| Label                          | Meaning                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **FROZEN**                     | Binding from Decision Freeze / parent freezes                                 |
| **RATIFIED**                   | Bound by this plan from existing evidence without inventing policy            |
| **PROPOSED**                   | Planning recommendation; requires Implementation Planning Review ratification |
| **UNRESOLVED**                 | Insufficient evidence; must not be assumed                                    |
| **PREREQUISITE**               | Must be true before later gates                                               |
| **BLOCKING FOR AUTHORIZATION** | Must be PASS before Implementation Authorization                              |

> **Reader note (2026-10-30):** Current full-D planning baseline after P-D-02 SAT and P-D-03 / NB-01 Option B is recorded in [`v3-l02-fiv-conn-04-d-planning-delta.md`](./v3-l02-fiv-conn-04-d-planning-delta.md). That delta **supersedes** this document’s “New D orchestrator CREATE” / separate privileged orchestrator inventory in favor of **Option A** Entry expand/absorb, and records ratified event type `connection.environment-backfill` (implementation still **NOT AUTHORIZED**). Historical sections below are preserved.

---

## 1. Status

```text
IMPLEMENTATION PLANNING STATUS = READY FOR IMPLEMENTATION PLANNING REVIEW

VERDICT = PLAN COMPLETE WITH EXPLICIT PREREQUISITES / PROPOSED BINDINGS

This artifact:
  - binds planning decisions only where repository/governance evidence supports them
  - leaves genuine gaps UNRESOLVED or PROPOSED
  - does NOT authorize implementation
  - does NOT deliver A preflight synchronization
```

```text
D IMPLEMENTATION = NOT STARTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
FIV-CONN-04-C = FORMALLY CLOSED
NEXT GATE = FIV-CONN-04-D IMPLEMENTATION PLANNING REVIEW
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 2. Baseline

| Field                             | Value                                                                |
| --------------------------------- | -------------------------------------------------------------------- |
| `HEAD`                            | `e4c4e9a183c016ac23eb0d0685341438e860f46e`                           |
| C closed                          | FORMALLY CLOSED @ same commit                                        |
| A classifier on main              | `fiv-conn-04-a-classification.ts` (`32388f4`)                        |
| C classifier on main              | `fiv-conn-04-live-classifier.ts` (`ee252be`)                         |
| B-04 façade on main               | `Conn04MigrationBoundaryService`                                     |
| A preflight Nest service          | **Not tracked**; local untracked WIP; **not** in `ConnectionsModule` |
| D runner / env UPDATE             | **ABSENT**                                                           |
| `connection.environment-backfill` | **ABSENT** from Security Audit catalog                               |

---

## 3. Governance Inputs

| Artifact                                                                             | Role                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Parent Decision Freeze D-CONN-04-01…10                                               | Frozen requirements                                  |
| Slice Planning §7.4 / §10 / §13–18 / AC-D-01…07                                      | D identity, UPDATE, audit, failure                   |
| D Decision Freeze                                                                    | COND/OQ dispositions                                 |
| D Slice Approval                                                                     | Approved scope for this plan                         |
| B-04 Implementation Planning / code                                                  | Runner handoff: Vault outside txn; CAS+UPDATE inside |
| A Closure + A sync                                                                   | Closed A file list vs what is on main                |
| Code: B-04, CAS adapter, C/A classifiers, Security Audit, `PrismaTransactionService` | Reality                                              |

---

## 4. Scope

**IN SCOPE for later authorized implementation (unchanged from Slice Approval):**

- Conditional `Connection.environment` NULL → `live`
- Vault-proven eligible EXCHANGE only; C re-invoke; `SecretState.Connected`
- B gate + B-04 + same-txn CAS + Strategy B
- Workspace/environment isolation
- Durable Security Audit (D-CONN-04-09 substance)
- Nullable / fail-closed / idempotent / batch-continue
- Fresh A preflight evidence obligation before writes

---

## 5. Non-Scope

Unchanged: no C/B/A redesign; no E absorption; no PRE-01/FIV; no public env API; no second SoT; no Vault payload/mutation; no NOT NULL; residuals preserved; no inventing unbound actor IDs or numeric thresholds.

---

## 6. Requirements Traceability

| Req             | Plan treatment                                                      |
| --------------- | ------------------------------------------------------------------- |
| D-CONN-04-01…07 | Write path + skip/continue + nullable — **FROZEN**                  |
| D-CONN-04-08    | Consume B-04/gate — **FROZEN**                                      |
| D-CONN-04-09    | Durable audit substance — **FROZEN**; event type — see §9 COND-D-02 |
| D-CONN-04-10    | No PRE-01/FIV claims — **FROZEN**                                   |
| AC-D-01…07      | **FROZEN / BINDING** acceptance for later verification              |
| IPR-C-01        | Connected — **FROZEN**                                              |
| COND-ARCH-B04   | Same-txn CAS — **FROZEN**                                           |

---

## 7. Decision Freeze Inheritance

| Item                  | Inherited status | This plan                                               |
| --------------------- | ---------------- | ------------------------------------------------------- |
| COND-D-01 obligation  | RATIFIED         | Reaffirmed                                              |
| COND-D-01 delivery    | UNRESOLVED       | Bound as **BLOCKING** A sync prerequisite (§9)          |
| COND-D-02 / NB-01     | DEFERRED         | **PROPOSED** candidate + **REQUIRES EXPLICIT DECISION** |
| COND-D-03 kinds       | RATIFIED         | Reaffirmed                                              |
| COND-D-03 ops mapping | UNRESOLVED       | Remains **BLOCKING** until bound                        |
| COND-D-04 model       | FROZEN           | Reaffirmed; FOR UPDATE **PROPOSED** pattern             |
| COND-D-05 dichotomy   | RATIFIED         | **RATIFIED** qualitative-only (no number invented)      |
| COND-D-06 ceiling     | FROZEN           | Cadence **PROPOSED** = existing constants               |
| OQ-D-02               | DEFERRED         | **PROPOSED** Nest orchestrator                          |
| OQ-D-06               | Partial          | **PROPOSED** write-path per-row + summary               |
| OQ-D-08               | Deferred to E    | Unchanged                                               |

---

## 8. Prerequisites

| ID         | Prerequisite                                                                                                                                                                                                                                          | Class                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **P-D-01** | Governed **A source synchronization / delivery** of closed A preflight I/O artifacts onto `origin/main` (service + specs + module registration), matching A Closure — **or** explicit PO selection of alternate composition using tracked pure A only | **PREREQUISITE** / **BLOCKING FOR AUTHORIZATION** |
| **P-D-02** | Concrete privileged `actorId` provenance mapping for D invocation (OPERATOR vs SYSTEM_JOB)                                                                                                                                                            | **PREREQUISITE** / **BLOCKING FOR AUTHORIZATION** |
| **P-D-03** | Explicit ratification of NB-01 event type (proposed candidate below)                                                                                                                                                                                  | **BLOCKING FOR AUTHORIZATION**                    |
| **P-D-04** | Implementation Planning Review PASS (ratify PROPOSED items or record alternatives)                                                                                                                                                                    | **PREREQUISITE** for Authorization                |
| **P-D-05** | No public ConnectionsController env PATCH; B-04 remains privileged internal                                                                                                                                                                           | **FROZEN**                                        |

```text
Untracked local fiv-conn-04-a-preflight.service.ts ≠ origin/main SoT.
Do NOT treat WIP as delivered.
Do NOT redesign A eligibility inside D.
```

---

## 9. Decision Resolution Matrix

### COND-D-01 — A preflight delivery

| Field                                   | Content                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Required capability**                 | Fresh read-only inventory: Connections + exact-id Vault **metadata** + Strategy B live-slot projection + A/C classification → structured report (Slice §14). Systemic Vault failure blocks D start. |
| **Tracked on main**                     | `fiv-conn-04-a-classification.ts` (`classifyFivConn04AConnection`, `buildFivConn04APreflightReport`, counters).                                                                                     |
| **Local-only / WIP**                    | `fiv-conn-04-a-preflight.service.ts` (+ specs); listed in A Closure; **not** git-tracked; **not** in `ConnectionsModule`.                                                                           |
| **A vs D boundary**                     | A = evidence production (read-only). D = consume fresh report → gate → write. D must not fork eligibility SoT.                                                                                      |
| **Does D require new A delivery?**      | **YES** for the closed Nest preflight I/O surface (delivery gap analogous to classifier sync), **unless** PO explicitly selects alternate composition.                                              |
| **Can D consume tracked helpers only?** | Pure report builders yes; full inventory I/O **not** on main today.                                                                                                                                 |
| **Status**                              | Obligation **FROZEN**. Delivery **PREREQUISITE / BLOCKING FOR AUTHORIZATION** (A sync of closed preflight artifacts **preferred**; not performed by this plan).                                     |

### COND-D-03 — Privileged actor mapping

| Field                      | Content                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Representation**         | `PrivilegedActorContext = { actorId: string; actorKind: 'SYSTEM_JOB' \| 'OPERATOR'; correlationId?: string }` (`migration-gate.ts`). |
| **B-04**                   | Already requires `isPrivilegedActorContext`; passes actor into acquire/heartbeat/release.                                            |
| **Security Audit**         | Uses `attribution.actorId` (see `ConnectionMigrationGateAudit`).                                                                     |
| **SYSTEM_JOB vs OPERATOR** | Discriminated by `actorKind` only in code; both are privileged; CLIENT forbidden.                                                    |
| **Anti-spoofing**          | No public HTTP for B-04; type-guard only. Trusted invocation boundary must construct actor — **not** client-supplied grant/fence.    |
| **What D must receive**    | Full `PrivilegedActorContext` at start; same `actorId`/`correlationId` for audits.                                                   |
| **Status**                 | Contract **FROZEN**. Concrete `actorId` provenance **UNRESOLVED / BLOCKING FOR AUTHORIZATION**. Do **not** invent identity values.   |

**PROPOSED (non-binding until Review):** D entry is internal-only; OPERATOR `actorId` = authenticated operator subject already trusted by the invocation boundary; SYSTEM_JOB `actorId` = stable job identity string provisioned by ops — exact strings unbound here.

### COND-D-02 — NB-01 audit event type

| Field                  | Content                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frozen substance**   | Durable events for updated/blocked; Slice §13 fields; no secrets; existing Security Audit infra.                                                                                                     |
| **Existing types**     | `connection.lifecycle` (credential/lifecycle), `connection.migration-gate` (lease), `connection.validation`.                                                                                         |
| **Evidence**           | Lifecycle investigation text targets credential/lifecycle material; migration-gate is lease-scoped; Slice §13 **prefers** dedicated `connection.environment-backfill`.                               |
| **PROPOSED candidate** | Register **`connection.environment-backfill`** (`eventClass: connection`) + attribution rules + D audit helper patterned on `ConnectionMigrationGateAudit` (supports optional `TransactionContext`). |
| **Status**             | **PROPOSED** / **REQUIRES EXPLICIT DECISION / AUTHORIZATION** — not silently frozen. Alternative (extend `connection.lifecycle`) remains allowed if Review rejects dedicated type.                   |

**Payload (FROZEN substance / Slice §13):** connectionId, workspaceId, provider, connectionType, previousEnvironment, newEnvironment, evidenceClass/disposition, opaque vaultSecretId, vaultPurpose, actorId/systemJobId, correlationId, timestamp, outcome, reasonCode.  
**Outcomes (minimum):** `updated_live`, blocked_* family, `skipped_no_longer_eligible`, `operation_summary`.  
**Idempotency/correlation:** reuse `correlationId` from grant/actor across the run; per-row events are disposition records (not secret diffs).

### COND-D-04 — FOR UPDATE / locking

| Field                        | Content                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frozen model**             | Lease + B-04 + predicates + same-txn CAS + Strategy B. No second SoT.                                                                                                                                       |
| **Existing abstractions**    | `PrismaTransactionService.run` + opaque `TransactionContext`; gate adapter already uses `$queryRaw` `FOR UPDATE` on lease row; `assertDurableAuthorityCas` = `updateMany` CAS in caller txn.                |
| **B-04 handoff (code/docs)** | Vault metadata **outside** short write txn; inside txn: `assertWriteAuthority` then conditional Connection UPDATE (+ audit).                                                                                |
| **PROPOSED Connection lock** | Inside per-row write txn, optionally `SELECT … FROM connection_records WHERE id = $id FOR UPDATE` via the **same** `$queryRaw`/`Prisma.sql` pattern as the gate adapter, then re-read + conditional UPDATE. |
| **Interaction**              | Lease CAS proves migration authority; Connection FOR UPDATE reduces row races; conditional `environment IS NULL` is idempotent authority; Strategy B unique is final.                                       |
| **Status**                   | Model **FROZEN**. Exact Connection FOR UPDATE necessity **PROPOSED** (pattern identified; Review may accept conditional UPDATE + CAS without row FOR UPDATE if justified).                                  |

### COND-D-05 — Vault threshold

| Field                      | Content                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frozen**                 | Systemic outage → abort D; per-row meta failure → skip/block continue.                                                                                                                                                                            |
| **Numeric needed?**        | **No** for D v1 — governance supplies qualitative dichotomy; no population size mandate for N.                                                                                                                                                    |
| **RATIFIED planning rule** | Systemic = preflight or batch cannot obtain Vault metadata for a required workspace (transport/auth/unavailable), or occupancy status `unavailable` at write classification input. Per-row = exact-id miss / non-Connected / purpose block / etc. |
| **Status**                 | **RATIFIED** (qualitative-only). No number invented.                                                                                                                                                                                              |

### COND-D-06 — Heartbeat / TTL

| Field                      | Content                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frozen**                 | ≤4h max window; expire/UNKNOWN/ownership lost → stop writes; re-acquire + fresh preflight after crash.                                                                                           |
| **Existing**               | `MIGRATION_GATE_DEFAULT_TTL_MS` = 15m; `MIGRATION_GATE_DEFAULT_HEARTBEAT_MS` = 5m (guidance, not new OD-B). B-04 `heartbeat` / `requestedTtlMs`.                                                 |
| **Does D need heartbeat?** | **YES** if batch may outlive `expiresAt`.                                                                                                                                                        |
| **PROPOSED**               | Default acquire TTL = existing default; heartbeat at ≤ guidance cadence while work remains; heartbeat failure → stop new writes fail-closed; do not extend past `acquiredAt + authorizedWindow`. |
| **Max batch duration**     | Bounded by remaining authorized window (≤4h), not a new constant.                                                                                                                                |
| **Status**                 | Ceiling **FROZEN**. Cadence **PROPOSED** = reuse existing constants (Review ratification).                                                                                                       |

### OQ-D-02 — Runner shape

| Field           | Content                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Conventions** | A/B/C delivered as Nest module services; B-04 docs describe “future 04-D runner” consuming façade; no public HTTP; scripts exist elsewhere but CONN-04 privileged path is Nest-internal.         |
| **PROPOSED**    | Privileged Nest **orchestrator/service** (injectable), not scheduled job by default, not public controller. Optional thin CLI may wrap the same service later — not required for first delivery. |
| **Lifecycle**   | One-shot run: preflight → start → process → heartbeat as needed → release (or abort path).                                                                                                       |
| **Status**      | **PROPOSED** (Review ratification).                                                                                                                                                              |

### OQ-D-06 — Audit granularity

| Field        | Content                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frozen**   | Durable audit for updated + blocked (AC-D-04).                                                                                                                                                                                                                                       |
| **PROPOSED** | During D write window: durable **per-row** audit for each write-path disposition (`updated_live`, blocked_*, `skipped_no_longer_eligible`); one `operation_summary` (+ counters) per run. A preflight inventory remains read-only and does **not** require D durable per-row audits. |
| **Status**   | **PROPOSED** (aligned with AC-D-04 / Slice §13).                                                                                                                                                                                                                                     |

### OQ-D-08

**Deferred to E** — D emits Slice §13 counters only; no E absorption.

---

## 10. Exact Implementation Surface

| Surface                                                     | Create/Modify                     | Responsibility                                        | Why D                     | Dependency                                          | Test surface              | Risk                                     |
| ----------------------------------------------------------- | --------------------------------- | ----------------------------------------------------- | ------------------------- | --------------------------------------------------- | ------------------------- | ---------------------------------------- |
| `Conn04MigrationBoundaryService`                            | **Reuse (no redesign)**           | start/resume/heartbeat/release/`assertWriteAuthority` | B-04 wall                 | B gate/CAS                                          | Existing B-04 specs       | Extending with UPDATE would violate B-04 |
| New D orchestrator (Nest service)                           | **CREATE** (after auth)           | Run lifecycle composition                             | Slice 04-D                | B-04, A preflight, C, txn, audit                    | New D specs               | Public exposure / ungated entry          |
| Per-row write unit (module-local helper or private methods) | **CREATE**                        | Same-txn CAS + conditional UPDATE + row audit         | COND-ARCH-B04             | `PrismaTransactionService`, B-04, Prisma Connection | Unit + txn mocks          | Check-then-save drift                    |
| Security Audit catalog + attribution                        | **MODIFY** (after NB-01 decision) | Register event type                                   | D-CONN-04-09              | Security Audit module                               | Catalog/attribution tests | Wrong type / secret leakage              |
| D audit helper                                              | **CREATE**                        | Sanitize + record outcomes (txn-capable)              | Mirror gate audit pattern | `SecurityAuditService`                              | Audit integrity specs     | Payload secrets                          |
| `connections.module.ts`                                     | **MODIFY**                        | Register D orchestrator (+ A preflight after sync)    | DI                        | Module                                              | Smoke                     | Wiring A WIP prematurely                 |
| ConnectionsService / controllers                            | **DO NOT** add env PATCH          | Preserve AC-D-07                                      | —                         | —                                                   | Regression                | Public exception creep                   |
| Prisma schema                                               | **NO CHANGE**                     | Nullable remains                                      | D-CONN-04-07              | —                                                   | —                         | Accidental NOT NULL                      |
| C / A classifier files                                      | **DO NOT redesign**               | Re-invoke only                                        | Boundary                  | —                                                   | Preserve A/C specs        | Fork SoT                                 |

**Architectural answers (planning):**

| Question                         | Answer                                                                                                                                              | Class                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Extend B-04 with UPDATE?         | **No** — consume only                                                                                                                               | **FROZEN** intent / B-04 wall   |
| New privileged orchestrator?     | **Yes** (proposed Nest service)                                                                                                                     | **PROPOSED**                    |
| Per-row write unit?              | **Yes**                                                                                                                                             | **PROPOSED**                    |
| Call CAS via B-04 façade?        | **Yes** — `assertWriteAuthority(txn, grant)`                                                                                                        | **RATIFIED** from B-04          |
| Audit from orchestration vs txn? | Prefer **same txn as UPDATE** when API allows (gate audit already accepts `TransactionContext`)                                                     | **PROPOSED**                    |
| Vault read before or inside txn? | **Before** short write txn (B-04 handoff / COND-ARCH-B10)                                                                                           | **RATIFIED** from B-04 planning |
| C invoke timing?                 | Immediately before mutation decision, on fresh Connection+Vault+occupancy inputs; **again** logically at write time (stale batch pass insufficient) | **FROZEN**                      |

---

## 11. Data-Flow / Transaction Design

```text
[Trusted entry] PrivilegedActorContext
        │
        ▼
1. Fresh A preflight (read-only) ──fail systemic──► ABORT (no gate acquire)
        │
        ▼
2. B-04 start(actor) ──fail──► ABORT
        │ grant
        ▼
3. Candidate set from preflight ELIGIBLE_LIVE (informational)
        │
        ▼
4. For each candidate (and/or re-scan write population):
   a. Vault metadata read (exact id)     OUTSIDE write txn
   b. Strategy B occupancy typed input   OUTSIDE write txn
   c. classifyFivConn04LiveConnection    OUTSIDE write txn (pure)
   d. if not eligible → durable blocked audit; continue
   e. PrismaTransactionService.run:
        - optional Connection FOR UPDATE (PROPOSED)
        - re-read Connection
        - assertWriteAuthority(txn, grant)   // CAS
        - conditional UPDATE NULL→live
        - durable updated/skip audit (same txn PROPOSED)
   f. heartbeat if near TTL (PROPOSED)
        │
        ▼
5. operation_summary audit + counters
6. B-04 release (or abort/release policy)
```

| Step                  | Input                | Output                      | Owner        | Failure                   | Fail-closed?              | Txn?               |
| --------------------- | -------------------- | --------------------------- | ------------ | ------------------------- | ------------------------- | ------------------ |
| 1 Privileged invoke   | Trusted actor        | Context                     | D entry      | Bad actor                 | Refuse                    | No                 |
| 2 Actor binding       | Context              | Same for gate+audit         | D            | Unresolved mapping        | Block auth until bound    | No                 |
| 3 Fresh A preflight   | Actor for Vault list | Report                      | A capability | Systemic Vault            | Abort D                   | No                 |
| 4 B-04 start          | Actor                | Grant                       | B-04         | Contention/UNKNOWN        | Abort                     | Lease txn inside B |
| 5 Candidate discovery | Report               | IDs                         | D            | Empty                     | No-op success path        | No                 |
| 6 Vault meta          | vaultSecretId        | Meta/null                   | Vault        | Per-row/systemic          | Skip or abort             | No                 |
| 7 C re-invoke         | Conn+meta+occupancy  | Disposition                 | C            | Non-eligible              | Skip+audit                | No                 |
| 8 Strategy B          | Occupancy            | vacant/occupied/unavailable | D/Prisma     | unavailable               | Never LIVE                | No                 |
| 9 Write txn           | Grant+row            | Commit/rollback             | D            | CAS miss / 0 rows / P2002 | Skip or stop if gate lost | **Yes**            |
| 10 Conditional UPDATE | Predicates           | rowCount                    | D            | 0 rows                    | Skip                      | In txn             |
| 11 CAS                | Grant                | ok/fail                     | B-04         | Miss                      | Abort row/stop            | In txn             |
| 12 Durable audit      | Outcome              | Record                      | D+Audit      | Fail after UPDATE         | Forward-fix; mark error   | Prefer in txn      |
| 13 Heartbeat/release  | Grant                | Extended/released           | B-04         | HB fail                   | Stop writes               | Lease ops          |
| 14 Abort              | —                    | Inventory/counters          | D            | —                         | No dual-run               | —                  |

---

## 12. Concurrency / Fencing Design

| Layer                 | Role                                 | Class         |
| --------------------- | ------------------------------------ | ------------- |
| B lease + B-04        | Single runner; refuse without proof  | **FROZEN**    |
| Same-txn CAS          | Stale fence cannot write             | **FROZEN**    |
| Conditional UPDATE    | Idempotent NULL-only                 | **FROZEN**    |
| Strategy B unique     | Final collision authority            | **FROZEN**    |
| Connection FOR UPDATE | Optional row lock (proposed pattern) | **PROPOSED**  |
| C-B06-02              | Remains OPEN/OPTIONAL                | **PRESERVED** |

---

## 13. Vault / TTL Design

| Topic               | Rule                              | Class        |
| ------------------- | --------------------------------- | ------------ |
| Metadata only       | `list`/`get` metadata; no payload | **FROZEN**   |
| Exact id            | No sibling lookup                 | **FROZEN**   |
| Connected           | Required for LIVE                 | **FROZEN**   |
| Systemic vs per-row | §9 COND-D-05 qualitative          | **RATIFIED** |
| TTL/heartbeat       | §9 COND-D-06 proposed constants   | **PROPOSED** |
| Expire mid-run      | Stop writes; no silent continue   | **FROZEN**   |

---

## 14. Security Audit Design

| Topic                   | Rule                                       | Class                            |
| ----------------------- | ------------------------------------------ | -------------------------------- |
| Substance               | Updated + blocked + counters               | **FROZEN**                       |
| Event type              | Proposed `connection.environment-backfill` | **PROPOSED / REQUIRES DECISION** |
| Helper                  | New D audit helper; txn-capable            | **PROPOSED**                     |
| Sanitize                | Reject secret keys (gate pattern)          | **PROPOSED** reuse               |
| Audit fail after UPDATE | Forward-fix; no LIVE→NULL                  | **FROZEN**                       |
| Granularity             | Write-path per-row + summary               | **PROPOSED** (OQ-D-06)           |

---

## 15. Actor Binding Design

| Topic        | Rule                                      | Class                         |
| ------------ | ----------------------------------------- | ----------------------------- |
| Kinds        | SYSTEM_JOB \| OPERATOR only               | **FROZEN**                    |
| Pass-through | Same context to B-04 + audits             | **RATIFIED**                  |
| Concrete IDs | Ops/auth boundary decision                | **UNRESOLVED / BLOCKING**     |
| Spoofing     | No public B-04/D HTTP; trusted entry only | **PROPOSED** enforcement wall |

---

## 16. Runner / Orchestrator Design

| Topic    | Rule                                              | Class             |
| -------- | ------------------------------------------------- | ----------------- |
| Shape    | Nest injectable privileged orchestrator           | **PROPOSED**      |
| Consumes | A preflight (after delivery), B-04, C, txn, audit | **RATIFIED** deps |
| Does not | Extend B-04 with UPDATE; public env API           | **FROZEN** walls  |
| Entry    | Bound with actor mapping (P-D-02)                 | **BLOCKING**      |

---

## 17. Failure / Recovery Matrix

| Failure                         | D behavior              | Skip vs abort               | Audit           | Retry                   | SoT                    |
| ------------------------------- | ----------------------- | --------------------------- | --------------- | ----------------------- | ---------------------- |
| Stale C disposition             | Re-classify; ignore old | Skip if now ineligible      | Blocked/skip    | Safe re-run             | C+DB+Vault             |
| C reclass failure / ERROR       | Skip row                | Skip                        | Blocked/error   | Continue                | C                      |
| SecretState ≠ Connected         | Never UPDATE            | Skip                        | Blocked         | Continue                | Vault state            |
| Workspace mismatch              | Never UPDATE            | Skip                        | Blocked         | Continue                | Vault+Conn             |
| Env already populated           | No rewrite              | Skip                        | Skip            | Idempotent              | DB predicate           |
| Strategy B collision / occupied | Never UPDATE            | Skip                        | Blocked         | Continue                | Occupancy+unique       |
| Occupancy unavailable           | Never LIVE              | Skip or abort if systemic   | Blocked         | —                       | IMPL-REV-C-01          |
| Lease unavailable at start      | Abort                   | Abort                       | Gate audit (B)  | Re-acquire later        | B lease                |
| Lease expire / HB fail mid-run  | Stop new writes         | Abort further rows          | Summary+errors  | Fresh preflight+acquire | B lease                |
| Vault unavailable systemic      | Abort                   | Abort                       | Summary/errors  | After recovery          | Vault                  |
| Vault per-row miss              | Skip                    | Skip                        | Blocked         | Continue                | Vault                  |
| DB txn failure                  | Rollback row txn        | Skip/abort per severity     | Error           | Per-row retry safe      | DB                     |
| CAS miss                        | No UPDATE               | Skip/stop if ownership lost | Skip/blocked    | Re-validate grant       | CAS                    |
| Duplicate retry                 | 0-row UPDATE            | Skip                        | Skip            | Expected                | Predicate              |
| Audit fail after UPDATE         | Forward-fix             | Continue with error flag    | Retry audit     | Operator reconcile      | Audit+DB               |
| Partial batch                   | Allowed                 | Continue                    | Per-row+summary | Idempotent resume       | D-CONN-04-03/05        |
| Actor invalid                   | Refuse start            | Abort                       | None/gate deny  | Fix actor               | PrivilegedActorContext |

---

## 18. Test Plan

| #   | Category                               | Level            | Expected             | Harness                 |
| --- | -------------------------------------- | ---------------- | -------------------- | ----------------------- |
| 1   | Happy-path eligible UPDATE             | Unit/integration | NULL→live once       | New D + Prisma mock/txn |
| 2   | NULL-only mutation                     | Unit             | Predicates enforce   | New D                   |
| 3   | Non-NULL no-op                         | Unit             | Skip                 | New D                   |
| 4   | Stale C rejection                      | Unit             | Reclass blocks write | C fixtures              |
| 5   | SecretState negatives                  | Unit             | Never LIVE           | C/A fixtures            |
| 6   | Vault meta negatives                   | Unit             | Block/skip           | Vault doubles           |
| 7   | Workspace mismatch                     | Unit             | Block                | C fixtures              |
| 8   | Environment mismatch / testnet purpose | Unit             | No LIVE              | C fixtures              |
| 9   | Strategy B collision                   | Unit/integration | Skip; no cleanup     | Occupancy + P2002       |
| 10  | B gate/lease failure                   | Unit             | Abort start          | B-04 mocks              |
| 11  | CAS race                               | Unit             | No UPDATE            | B-04/CAS mocks          |
| 12  | Duplicate retry                        | Unit             | Idempotent           | Predicate               |
| 13  | Audit success updated                  | Unit             | Event+fields         | Audit helper            |
| 14  | Audit blocked                          | Unit             | Durable blocked      | Audit helper            |
| 15  | Audit failure                          | Unit             | Forward-fix path     | Audit fail double       |
| 16  | Partial batch                          | Integration      | Continue             | Orchestrator            |
| 17  | Lease/TTL expiration                   | Unit             | Stop writes          | B-04 heartbeat mocks    |
| 18  | Privileged actor validation            | Unit             | CLIENT refused       | B-04 + D entry          |

Preserve existing A/B/C/B-04/B-05/B-06 suites. No venue/FIV/capital tests.

---

## 19. Implementation Sequence

| Stage | Work                                                                                                                                           | Blocked by                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **0** | Prerequisites: A preflight delivery (P-D-01); actor mapping decision (P-D-02); NB-01 decision (P-D-03); Impl Planning Review on PROPOSED items | **BLOCKING**                         |
| **1** | Contracts/types: dispositions→audit outcomes; run counters; orchestrator input types                                                           | Stage 0 NB-01 / Review               |
| **2** | Orchestrator skeleton (no writes): preflight→start→iterate→release                                                                             | P-D-01, P-D-02, OQ-D-02 ratification |
| **3** | Per-row write unit: txn + CAS + conditional UPDATE                                                                                             | COND-D-04 Review bind                |
| **4** | Audit helper + catalog registration                                                                                                            | NB-01 decision                       |
| **5** | D-focused tests (matrix §18)                                                                                                                   | Stages 2–4                           |
| **6** | Regression/security (A/B/C/B-04 walls; no public API)                                                                                          | Stage 5                              |
| **7** | Verification / report for Authorization                                                                                                        | All PASS                             |

```text
NO STAGE STARTED BY THIS ARTIFACT
```

---

## 20. Implementation Authorization Checklist

| #   | Condition                                                        | Status now                                        |
| --- | ---------------------------------------------------------------- | ------------------------------------------------- |
| 1   | A preflight delivery resolved on `origin/main` (or PO alternate) | **NOT SATISFIED** — **BLOCKING**                  |
| 2   | Actor mapping resolved                                           | **NOT SATISFIED** — **BLOCKING**                  |
| 3   | NB-01 event type explicitly decided                              | **NOT SATISFIED** — **BLOCKING**                  |
| 4   | Runner shape ratified                                            | **PROPOSED** — pending Review                     |
| 5   | FOR UPDATE decision ratified if required                         | **PROPOSED** — pending Review                     |
| 6   | Vault threshold approach ratified                                | **RATIFIED** qualitative-only (confirm at Review) |
| 7   | Heartbeat/TTL cadence ratified                                   | **PROPOSED** — pending Review                     |
| 8   | Audit granularity ratified                                       | **PROPOSED** — pending Review                     |
| 9   | AC-D-01…07 preserved                                             | **PASS** (inherited)                              |
| 10  | No C boundary change planned                                     | **PASS**                                          |
| 11  | No B gate bypass planned                                         | **PASS**                                          |
| 12  | No second SoT planned                                            | **PASS**                                          |
| 13  | Security plan complete                                           | **PARTIAL** — pending NB-01 + actor mapping       |
| 14  | Implementation Planning Review = PASS                            | **NOT YET**                                       |

```text
IMPLEMENTATION AUTHORIZATION = NOT GRANTED
Checklist incomplete until Stage 0 + Review PASS
```

---

## 21. Risks

| ID     | Risk                             | Mitigation                     |
| ------ | -------------------------------- | ------------------------------ |
| R-D-01 | Public env API                   | AC-D-07; no controller changes |
| R-D-02 | Check-then-save                  | CAS mandatory                  |
| R-D-03 | Stale C                          | Re-invoke                      |
| R-D-04 | Ungated script                   | Nest+B-04 only                 |
| R-D-05 | Dual A preflight                 | P-D-01 A sync preferred        |
| R-D-06 | Silent residual close            | Preserved                      |
| R-D-07 | Slice Approval ≠ impl auth       | Explicit walls                 |
| R-D-08 | NB-01 delay                      | Blocking checklist #3          |
| R-D-09 | Premature use of untracked A WIP | Explicit non-SoT               |

---

## 22. Open Questions

| ID          | Question                                                      | Class                       |
| ----------- | ------------------------------------------------------------- | --------------------------- |
| P-D-01      | A preflight delivery vehicle finalized                        | **BLOCKING**                |
| P-D-02      | Concrete actorId provenance                                   | **BLOCKING**                |
| NB-01       | Confirm `connection.environment-backfill` vs lifecycle        | **BLOCKING** / **PROPOSED** |
| FOR UPDATE  | Mandatory Connection row lock vs predicates+CAS only          | **PROPOSED**                |
| Entry point | Exact trusted invocation (ops runbook / internal module call) | Tied to P-D-02              |
| OQ-D-08     | D→E artifact format                                           | Deferred to E               |

---

## 23. Explicit Non-Authorization Statement

```text
════════════════════════════════════════════════════════
IMPLEMENTATION PLANNING = READY FOR REVIEW
════════════════════════════════════════════════════════

D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED

This artifact does NOT:
  - authorize coding or tests
  - deliver A preflight synchronization
  - invent actor identity values or numeric Vault thresholds
  - silently freeze NB-01
  - authorize FIV / C7 / live capital / venue I/O
  - close residuals or reopen C
  - skip Implementation Planning Review
```

---

## Final State

```text
PLAN = COMPLETE WITH PREREQUISITES + PROPOSED BINDINGS
BLOCKING FOR AUTHORIZATION: P-D-01 (A delivery), P-D-02 (actor map), NB-01 decision
NEXT GATE = FIV-CONN-04-D IMPLEMENTATION PLANNING REVIEW
```

**END OF FIV-CONN-04-D IMPLEMENTATION PLANNING**
