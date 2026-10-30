# FIV-CONN-04-D — Full Implementation Authorization Package

**Document:** Decision-ready Full-D Implementation Authorization proposal for Product Owner review  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Decision authority:** Product Owner  
**Nature:** **AUTHORIZATION PROPOSAL ONLY.** Does **not** grant Implementation Authorization. Does **not** implement code, tests, schemas, or Security Audit catalog changes. Does **not** create an authorization ratification. Does **not** modify the Decision Register. Does **not** stage, commit, or push.

```text
IMPLEMENTATION AUTHORIZATION: PENDING PRODUCT OWNER DECISION

PLANNING DELTA: ACCEPTED AS CURRENT BASELINE (PASS WITH CONDITIONS)
INDEPENDENT REVIEW: PASS WITH CONDITIONS
P-D-02: SATISFIED (D-CONN04-PD02-SAT)
P-D-03 / NB-01 DECISION: APPROVED — OPTION B (D-CONN04-PD03-NB01)
P-D-03 CATALOG/CODE: NOT STARTED / NOT IMPLEMENTED
FULL-D IMPLEMENTATION: NOT AUTHORIZED (awaiting PO decision on this package)
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Labels:** **RATIFIED DECISION** | **APPROVED DESIGN** | **EXISTING IMPLEMENTATION** | **PROPOSED IMPLEMENTATION SCOPE** | **DEFERRED DETAIL** | **CONDITION** | **EXCLUDED**

> **Path note:** This artifact is the **Full-D** IA package. The historical P-D-02 identity-boundary IA remains at [`v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md) and is **not** overwritten by this document.

---

## 1. Executive summary

This package requests Product Owner Implementation Authorization for the **bounded full FIV-CONN-04-D write/audit delivery** defined by the accepted Planning Delta, subject to **COND-IA-01…06** and **COND-DOC-01**.

If the Product Owner **APPROVES** this package (in a **separate** ratification act), engineering may implement **only** the inventory and stages in §§7–9 under the bound conditions. Until that act:

```text
NO CODING · NO CATALOG MUTATION · NO ENVIRONMENT UPDATE · NO PRODUCTION ACTIVATION
```

| Question                | Answer in this package                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What may be authorized? | Option A Entry expand/absorb for D write/audit loop; coordinated `connection.environment-backfill` catalog+attribution; conditional NULL→`live` UPDATE; per-row + `operation_summary` audits; tests |
| What remains excluded?  | E; HTTP/UI/cron/Trading Runtime; second constructor; public actor ingress; Prisma `actorKind` column; outbox; unrelated audit redesign; production activation                                       |
| Catalog included?       | **YES** — coordinated under this same authorization if granted (P-D-03 **decision** already ratified; **implementation** still pending)                                                             |
| Cursor recommendation   | Non-binding: package is decision-ready for PO review                                                                                                                                                |
| PO decision             | **PENDING** — see §18                                                                                                                                                                               |

---

## 2. Governance baseline

| Priority | Artifact                                                                                                                                                | Role                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1        | `D-CONN04-PD02-SAT` / [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md)  | P-D-02 **SATISFIED**                                      |
| 2        | `D-CONN04-PD03-NB01` / [`v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-pd03-nb01-product-owner-ratification.md) | NB-01 Option B **APPROVED**                               |
| 3        | [`v3-l02-fiv-conn-04-d-planning-delta.md`](./v3-l02-fiv-conn-04-d-planning-delta.md)                                                                    | Current full-D planning baseline                          |
| 4        | [`v3-l02-fiv-conn-04-d-planning-delta-review.md`](./v3-l02-fiv-conn-04-d-planning-delta-review.md)                                                      | Independent review **PASS WITH CONDITIONS**               |
| 5        | [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) §§6–7, 13                          | **IMPL-REV-D-01…06**                                      |
| 6        | Decision Freeze + Slice Approval + parent Slice Planning Package                                                                                        | Frozen AC / D-CONN-04 / audit floor                       |
| 7        | [`v3-l02-fiv-conn-04-slice-planning-package.md`](./v3-l02-fiv-conn-04-slice-planning-package.md) **§13 Audit Model**                                    | **COND-DOC-01** controlling counters/outcomes/safe fields |
| 8        | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md)                                                                                    | Register (read-only for this act)                         |

**FACT:** Full-D write/audit loop is **not** present in code today. Entry = P-D-02 lease mediation only. Catalog lacks `connection.environment-backfill`.

---

## 3. Ratified decisions

| ID                                     | Status                                                                          | Class                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| P-D-02 SYSTEM_JOB identity + Entry     | **SATISFIED**                                                                   | **RATIFIED DECISION** / **EXISTING IMPLEMENTATION**         |
| Canonical identity                     | `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill` | **RATIFIED DECISION**                                       |
| Option A                               | `Conn04SystemJobMigrationEntry` sole trusted SYSTEM_JOB ↔ B-04 boundary         | **RATIFIED DECISION**                                       |
| MINOR-PD02-PIR-01                      | ACCEPTED — BOUNDED; remediation before public/DTO/external actor ingress        | **RATIFIED DECISION**                                       |
| P-D-03 / NB-01                         | **APPROVED — OPTION B**                                                         | **RATIFIED DECISION**                                       |
| Event type                             | `connection.environment-backfill`                                               | **RATIFIED DECISION** (direction; **not** catalog delivery) |
| AC-D-01…07 / D-CONN-04-01…10 substance | Binding                                                                         | **APPROVED DESIGN** / Freeze                                |

---

## 4. Planning Delta and independent review

| Item               | Value                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Planning Delta     | [`v3-l02-fiv-conn-04-d-planning-delta.md`](./v3-l02-fiv-conn-04-d-planning-delta.md) — **CREATED**; current baseline |
| Independent review | [`v3-l02-fiv-conn-04-d-planning-delta-review.md`](./v3-l02-fiv-conn-04-d-planning-delta-review.md)                   |
| Review verdict     | **PASS WITH CONDITIONS**                                                                                             |
| Findings           | MINOR-PD-DELTA-REV-01 (Slice §13 citation); OBSERVATION-01 (adapter reclaim); OBSERVATION-02 (parent §13 floor)      |
| BLOCKER / MAJOR    | **None**                                                                                                             |

This package **binds** COND-IA-01…06 and COND-DOC-01 explicitly (§5).

---

## 5. COND-IA-01…06 binding matrix

### COND-IA-01 — Planning Delta and review acknowledgment

| Element                   | Binding                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning Delta            | Acknowledged as controlling current planning baseline                                                                                                                                  |
| Review                    | **PASS WITH CONDITIONS** acknowledged; findings dispositioned herein                                                                                                                   |
| **IMPL-REV-D-01**         | Connection-row FOR UPDATE remains **optional**; frozen safety = CAS + conditional UPDATE + Strategy B; **not** required for Authorization                                              |
| **IMPL-REV-D-02**         | 15m TTL / 5m heartbeat = **guidance defaults** under frozen ≤4h; MUST NOT invent new max-window policy; HB-on-long-batch + stop-on-HB-fail acceptable                                  |
| **IMPL-REV-D-03**         | Privileged Nest execution; **no** public HTTP; **not** default cron; Option A Entry is the runner binding                                                                              |
| **IMPL-REV-D-04**         | Write-path **per-row durable audit** + **`operation_summary`**; A preflight inventory ≠ D per-row duty                                                                                 |
| **IMPL-REV-D-05**         | Audit-after-UPDATE = **forward-fix**; no silent success; prefer same-txn (operationalized as **mandatory** same-txn on normal Full-D path — §11.2.A); operator reconciliation retained |
| **IMPL-REV-D-06**         | Per write attempt: fresh Vault metadata (exact id) + typed occupancy + re-invoke C **immediately before** write txn; preflight ELIGIBLE_LIVE informational only                        |
| Other planning conditions | AC-D-01…07; B-04 wall; zero Vault mutation; residual NULL preserved for E; Planning Delta §§3.3, 6, 11                                                                                 |

**CONDITION:** None of the above may be weakened by implementation.

### COND-IA-02 — Option A trusted Entry boundary

**Bind:**

1. `Conn04SystemJobMigrationEntry` is the **sole** trusted SYSTEM_JOB execution boundary.
2. Full D **extends/absorbs** this Entry (see §5 COND-IA-06 / §8).
3. **No** second SYSTEM_JOB actor constructor or parallel trusted Entry.
4. Canonical identity constructed **only** via `buildFivConn04DSystemJobActor` inside Entry.
5. **No** caller-controlled `actorId` / `actorKind` / `PrivilegedActorContext`.
6. B-04 (`Conn04MigrationBoundaryService`) remains internal lease/write-authority façade (`start`/`resume`/`heartbeat`/`release`/`assertWriteAuthority`).
7. B-04, `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY` remain **non-exported** from `ConnectionsModule`.
8. OPERATOR recovery/reclaim compatibility preserved.

**OPERATOR reclaim clarification (OBSERVATION-PD-DELTA-REV-01):**  
`PrismaMigrationGateAdapter.reclaimAsOperator` is the **existing** adapter-level recovery capability. This authorization does **not** require Entry or B-04 to expose OPERATOR reclaim. Do **not** redesign reclaim under this package.

### COND-IA-03 — No external actor ingress

**Bind — proposed scope includes none of:**

- Public HTTP endpoint for D
- External DTO carrying actor identity
- Externally supplied privileged actor context
- Job-payload identity
- Public / parallel run-as API
- Default cron / scheduler
- Trading Runtime ingress

**Stop rule:** If any future change requires external actor ingress → stop; remediate MINOR-PD02-PIR-01; fresh independent review; separate PO decision. **Not in this proposed scope.**

Entry remains **unexported** unless a same-app authorized consumer is explicitly justified in kickoff without public/DTO ingress (prefer remain unexported; Nest testing / in-module invocation).

### COND-IA-04 — Dedicated Security Audit event

**Bind:**

| Element               | Requirement                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| Event type            | `connection.environment-backfill` (character-for-character)                        |
| Catalog + attribution | Coordinated **MODIFY** under this same authorization if granted                    |
| Until registered      | Refuse-closed (existing Security Audit unclassified refuse)                        |
| Scopes                | Per-row durable audit + `operation_summary` on **one** type                        |
| Outcomes              | Updated + blocked (AC-D-04); floor taxonomy from parent Slice Planning Package §13 |
| Attribution           | Canonical SYSTEM_JOB `actorId` on SYSTEM_JOB path                                  |
| Persistence           | Existing `SecurityAuditService.record(..., transaction?)`                          |
| Prisma                | **No** `actorKind` column                                                          |
| Second type           | **Forbidden** without new evidence + separate PO approval                          |

**COND-DOC-01 / payload floor:**  
Controlling citation is [`v3-l02-fiv-conn-04-slice-planning-package.md`](./v3-l02-fiv-conn-04-slice-planning-package.md) **§13 — Audit Model** (counters, minimum outcomes, safe fields, forbidden secrets).  
**Do not confuse** with D Slice Approval §13 (Risks).

Exact payload field wiring and disposition→outcome mapping are **DEFERRED DETAIL** as implementation acceptance criteria, **within** that §13 floor, Freeze, and PD03-NB01. Do not invent new ratified requirements; do not weaken updated/blocked guarantees.

**Coordination:** Catalog entry + attribution rule + D audit helper + tests land in the same delivery window; emission must not precede registration.

### COND-IA-05 — Audit failure and fresh evidence

**IMPL-REV-D-05 bind:**

- **Normal successful path:** UPDATE + per-row audit **must** share one DB txn (§11.2.A) — operationalizes same-txn preference for authorized delivery.
- Post-commit sync retry = **in-process only** (§11.2.B); not crash-safe.
- Unrecoverable / crash gaps → mark failed/incomplete; **operator reconciliation**; **no** silent success; **no** auto LIVE→NULL (§11.2.C).

**IMPL-REV-D-06 bind:**

- Immediately before each write attempt: fresh Vault metadata via §7.0 (`list` + exact `vaultSecretId`) + typed occupancy projection + C re-invoke.
- Only then open write txn (re-read Connection + `assertWriteAuthority` + conditional UPDATE).
- Preflight set is informational candidate discovery only.

**Acceptance tests required (proposed):** stale preflight-only path rejected; failure behaviors per **§11.1** (not ambiguous skip/abort); concurrent Connection change → 0-row **row skip**; B-04 fence miss → **stop batch**; forward-fix per **§11.2**; summary reflects errors.

**FACT:** The future D write/audit loop does **not** already exist.

### COND-IA-06 — Entry expansion/absorption design

**Proposed shape (PROPOSED IMPLEMENTATION SCOPE — not yet code):**

```text
Conn04SystemJobMigrationEntry  (EXISTING — sole trusted boundary)
  ├─ start / resume / heartbeat / release     (EXISTING — P-D-02)
  └─ runEnvironmentBackfill(opts?)            (PROPOSED — expand Entry)
        │
        ├─ buildFivConn04DSystemJobActor()    (EXISTING factory — sole constructor)
        ├─ FivConn04APreflightService         (EXISTING — informational candidates)
        ├─ boundary.start(actor, …)           (EXISTING B-04)
        ├─ for each candidate / write population:
        │     Vault meta (exact id)           OUTSIDE txn — fresh
        │     typed occupancy                 OUTSIDE txn — fresh
        │     classifyFivConn04LiveConnection OUTSIDE txn — fresh C
        │     if not eligible → per-row blocked/skip audit; continue
        │     PrismaTransactionService.run:
        │       re-read Connection
        │       optional FOR UPDATE           (IMPL-REV-D-01 optional)
        │       boundary.assertWriteAuthority(txn, grant)
        │       conditional UPDATE WHERE environment IS NULL (+ eligibility predicates)
        │       environment-backfill audit    same txn REQUIRED (§11.2.A)
        │     heartbeat near TTL              (guidance IMPL-REV-D-02)
        ├─ operation_summary audit + counters
        └─ boundary.release / stop-on-HB-fail
```

**Module-local helpers (not second Entry / not second actor constructor):**

- `connection-environment-backfill-audit.ts` — sanitize + `SecurityAuditService.record` for ratified type (mirror `ConnectionMigrationGateAudit` pattern).
- `fiv-conn-04-d-environment-backfill-write.ts` — per-row write unit (CAS + conditional UPDATE + audit call); invoked **only** from Entry.

**Identity:** Helpers never construct `PrivilegedActorContext`; Entry passes already-built actor / `actorId` string for audit attribution only.

**Prove no second constructor:** Only `buildFivConn04DSystemJobActor` / Entry methods construct SYSTEM_JOB context; Nest does not export a second privileged orchestrator class; inventory forbids a parallel “D orchestrator” CREATE.

If implementation cannot follow this shape without a second constructor → **STOP** / escalate (Option A contradiction).

---

## 6. Full-D implementation scope

### 6.1 In scope if PO grants this package

| Area                  | Scope                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Entry expand/absorb   | `runEnvironmentBackfill` (or equivalent single Entry method) + private helpers                                                |
| Catalog / attribution | Register `connection.environment-backfill` + attribution rule                                                                 |
| Mutation              | Conditional `Connection.environment` NULL → `live` for eligible EXCHANGE under B-04                                           |
| Audit                 | Per-row + `operation_summary`; SYSTEM_JOB attribution; mandatory same-txn on normal path (§11.2.A); forward-fix per §11.2.B–C |
| Tests                 | §13 strategy                                                                                                                  |
| Docs                  | Implementation report / closure evidence as required by later gates                                                           |

### 6.2 Explicitly out of scope (**EXCLUDED**)

| Exclusion                                                             |
| --------------------------------------------------------------------- |
| FIV-CONN-04-E residual verification / gate release                    |
| Public HTTP / UI / cron / scheduler / Trading Runtime                 |
| Second SYSTEM_JOB constructor or parallel trusted Entry               |
| External actor DTO / job-payload identity / run-as API                |
| Prisma `actorKind` column; new transactional outbox                   |
| Vault secret mutation; Strategy B redesign                            |
| Remediating preserved residuals (D-B03-04/06/08, etc.) as silent duty |
| Production activation / live capital / FIV PASS                       |
| Unrelated Security Audit event redesign                               |
| OPERATOR reclaim redesign (adapter path preserved as-is)              |

---

## 7. Exact proposed file inventory

Paths inspected in repository. Classifications are **proposed** only — **not** authorized until PO grant.

### 7.0 Evidence-based dependency inventory (IA-REV-01)

Per-attempt freshness (**IMPL-REV-D-06**) reuses **existing** APIs. No new Vault/occupancy/C modules are added to the authorized inventory.

| Dependency                                        | Exact existing source                                                                                                                                                                                                                                                                                                                                                                                     | How D consumes it                                                                                             | Encapsulated today?                                                                                                                                                                                                                     | Inventory impact                                                                                                                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fresh Vault **metadata** by exact `vaultSecretId` | `SecretVaultService.list(actorWorkspaceId, workspaceId, actorRole?)` → `readonly SecretVaultMetadata[]` in `apps/api/src/modules/secret-vault/secret-vault.service.ts`; then exact match `meta.id === connection.vaultSecretId` (same algorithm as `FivConn04APreflightService.resolveExactVaultMeta`)                                                                                                    | Outside write txn, before C                                                                                   | **Partial:** A preflight encapsulates list+exact match for **inventory** (`loadVaultMetadataByWorkspace` / `resolveExactVaultMeta` are **private**). D write loop must call `list` + exact-id match itself (or via Entry-local helper). | **REUSE** `SecretVaultService` (module already imports `SecretVaultModule`). **Do not** use `SecretVaultService.get` for this — `get` is **slot-based** (`type`/`purpose` via `WorkspaceScopedQuery`), **not** exact-id lookup |
| Typed occupancy evidence                          | Prisma read-only projection equivalent to `FivConn04APreflightService.findLiveStrategyBOccupant` (`connectionRecord.findFirst` for another non-REVOKED EXCHANGE with `environment: 'live'` in same workspace/provider); map to `FivConn04LiveSlotOccupancy` in `fiv-conn-04-live-classifier.ts`: no occupant → `verified_vacant`; occupant → `occupied`+`occupantId`; read/verify failure → `unavailable` | Outside write txn, before C                                                                                   | **Partial:** occupancy **query** is private on A preflight; **type + C fail-closed** are public on C (`FivConn04LiveSlotOccupancy`, IMPL-REV-C-01)                                                                                      | **REUSE** `PrismaService` + C occupancy type. Query algorithm copied into Entry/write orchestration (no new Nest service). DB unique index remains final Strategy B authority                                                  |
| Per-attempt C classifier                          | `classifyFivConn04LiveConnection(connection, vaultMeta, occupancy)` — pure export in `fiv-conn-04-live-classifier.ts`                                                                                                                                                                                                                                                                                     | Outside write txn, immediately before write decision                                                          | **Yes** — pure function, no I/O                                                                                                                                                                                                         | **REUSE** (already in §7.1)                                                                                                                                                                                                    |
| Informational candidate set                       | `FivConn04APreflightService.run`                                                                                                                                                                                                                                                                                                                                                                          | Once per run before/at start; **never** substitutes for per-attempt proof                                     | **Yes**                                                                                                                                                                                                                                 | **REUSE** (already in §7.1)                                                                                                                                                                                                    |
| Write authority                                   | `Conn04MigrationBoundaryService.assertWriteAuthority(txn, grant)`                                                                                                                                                                                                                                                                                                                                         | Inside write txn before UPDATE                                                                                | **Yes**                                                                                                                                                                                                                                 | **REUSE** (already in §7.1)                                                                                                                                                                                                    |
| Durable audit append                              | `SecurityAuditService.record(..., transaction?)` → repository `append`                                                                                                                                                                                                                                                                                                                                    | **Mandatory** same-txn with UPDATE on normal path (§11.2.A); post-commit sync retry in-process only (§11.2.B) | **Yes**                                                                                                                                                                                                                                 | **REUSE** (already in §7.2)                                                                                                                                                                                                    |

**FACT:** No separate exact-id Vault getter exists. Exact-id freshness = `list` + id equality.  
**FACT:** No dedicated occupancy Nest port exists; typed occupancy is constructed at the C boundary from a Prisma projection.  
**CONDITION:** Kickoff must wire Vault `list` authorization (`actorWorkspaceId` / `actorRole`) without introducing public actor ingress or a second privileged constructor (COND-IA-03). Workspace-scoped Vault access remains `SecretVaultService` access-control as today.

### 7.1 SYSTEM_JOB Entry / orchestration

| Path                                                                           | Action                         | Responsibility                                                                                                                 | Why                         | AC / tests                               | Kind                      |
| ------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------- | ------------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` | **MODIFY**                     | Expand Entry with backfill orchestration; keep identity internal; inject/use Vault list + Prisma occupancy projection per §7.0 | COND-IA-02/06; IA-REV-01    | Entry boundary + freshness + lease tests | Identity + orchestration  |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`        | **REUSE** (no change expected) | Canonical factory                                                                                                              | P-D-02 SAT                  | Existing identity specs                  | Identity                  |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`        | **REUSE**                      | Lease + `assertWriteAuthority`                                                                                                 | B-04 wall                   | Existing B-04 / B-06 specs               | Orchestration / authority |
| `apps/api/src/modules/connections/fiv-conn-04-a-preflight.service.ts`          | **REUSE**                      | Informational candidate discovery (not per-attempt SoT)                                                                        | IMPL-REV-D-06               | Existing A preflight specs               | Orchestration             |
| `apps/api/src/modules/secret-vault/secret-vault.service.ts`                    | **REUSE**                      | `list` for workspace Vault metadata (exact-id match in Entry)                                                                  | IA-REV-01 / IMPL-REV-D-06   | Freshness tests                          | Orchestration             |
| `apps/api/src/storage/prisma/prisma.module.ts` (`PrismaService`)               | **REUSE**                      | Occupancy projection `findFirst` + Connection re-read/UPDATE                                                                   | IA-REV-01                   | Occupancy / UPDATE tests                 | Persistence               |
| `apps/api/src/modules/connections/fiv-conn-04-live-classifier.ts`              | **REUSE**                      | Per-attempt C + `FivConn04LiveSlotOccupancy`                                                                                   | IMPL-REV-D-06               | Existing C specs                         | Orchestration             |
| `apps/api/src/modules/connections/fiv-conn-04-d-environment-backfill-write.ts` | **CREATE**                     | Module-local per-row write unit                                                                                                | COND-IA-06; mutation safety | New write-unit specs                     | Persistence / mutation    |
| `apps/api/src/modules/connections/connections.module.ts`                       | **MODIFY**                     | Register audit/write helpers as providers if Nest-injected; **preserve** export walls                                          | DI; COND-IA-02 #7           | Export negative tests                    | Module wiring             |

### 7.2 Security Audit catalog and attribution

| Path                                                                        | Action     | Responsibility                                                                      | Why                       | AC / tests                                       | Kind                |
| --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ------------------- |
| `apps/api/src/modules/security-audit/security-audit-classification.ts`      | **MODIFY** | Admit `connection.environment-backfill`                                             | COND-IA-04 / PD03-NB01    | Refuse-closed before/after; service refuse tests | Audit               |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`         | **MODIFY** | Attribution rule (workspace/actor/resource as required by floor + investigation)    | COND-IA-04                | Attribution specs                                | Audit               |
| `apps/api/src/modules/connections/connection-environment-backfill-audit.ts` | **CREATE** | Sanitize + record helper (txn-capable); mirror `connection-migration-gate-audit.ts` | COND-IA-04/05             | New audit helper specs                           | Audit               |
| `apps/api/src/modules/security-audit/security-audit.service.ts`             | **REUSE**  | `record(..., transaction?)`                                                         | Existing txn architecture | Existing service specs                           | Audit / persistence |

### 7.3 Conditional environment mutation

| Path                                                        | Action                         | Responsibility          | Why          | AC / tests                          | Kind        |
| ----------------------------------------------------------- | ------------------------------ | ----------------------- | ------------ | ----------------------------------- | ----------- |
| Write unit (above) + Prisma Connection UPDATE               | **CREATE** path via write unit | Conditional NULL→`live` | AC-D-01/03   | Predicate / idempotency / CAS tests | Persistence |
| `apps/api/src/storage/prisma/prisma-transaction.service.ts` | **REUSE**                      | Short write txn         | B-04 handoff | Txn tests                           | Persistence |
| Prisma schema                                               | **NO CHANGE**                  | Nullable env remains    | D-CONN-04-07 | —                                   | —           |

### 7.4 Failure/recovery and operation summary

| Path                                                                | Action                       | Responsibility                                                         | Why                              | AC / tests                  | Kind                  |
| ------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------- | -------------------------------- | --------------------------- | --------------------- |
| Entry `runEnvironmentBackfill`                                      | **MODIFY** (same Entry file) | HB fail-closed; abort/skip matrix; summary counters; forward-fix flags | Impl Planning §17; IMPL-REV-D-05 | Failure matrix specs        | Orchestration / audit |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts` | **REUSE**                    | Lease semantics; `reclaimAsOperator` unchanged                         | OBSERVATION-01                   | Existing reclaim regression | Recovery              |

### 7.5 Tests (proposed new + existing)

| Path                                                                 | Action              | Focus                                                                                              |
| -------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `fiv-conn-04-d-system-job-migration-entry.spec.ts`                   | **MODIFY**          | Expand: no actor params; orchestration; export walls; no env UPDATE on lease-only paths regression |
| `fiv-conn-04-d-environment-backfill-write.spec.ts`                   | **CREATE**          | CAS, conditional UPDATE, 0-row, same-txn audit, forward-fix                                        |
| `connection-environment-backfill-audit.spec.ts`                      | **CREATE**          | Sanitize refuse; attribution; txn overload; type string                                            |
| `fiv-conn-04-d-freshness.spec.ts` (or sections in Entry/write specs) | **CREATE**          | IMPL-REV-D-06 stale preflight rejection                                                            |
| `security-audit.service.spec.ts`                                     | **MODIFY** / extend | Classified type admission; refuse unclassified regression                                          |
| `security-audit-attribution.spec.ts`                                 | **MODIFY** / extend | New type rule                                                                                      |
| `conn04-migration-boundary.service.spec.ts`                          | **REUSE**           | Export negatives; write authority                                                                  |
| `prisma-migration-gate.adapter.spec.ts`                              | **REUSE**           | OPERATOR reclaim regression                                                                        |
| `fiv-conn-04-live-classifier.spec.ts` / A preflight specs            | **REUSE**           | C / A regressions                                                                                  |
| `fiv-conn-04-b-05-audit-integrity.spec.ts` / B-06 suites             | **REUSE**           | Gate audit / concurrency regressions                                                               |

### 7.6 Documentation (implementation phase — after grant)

| Path                                         | Action                | Notes                                                                 |
| -------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| Full-D implementation report / PIR / closure | **CREATE** later      | Out of this package’s edit scope; required before satisfaction claims |
| This IA package                              | **CREATE** (this act) | Proposal only                                                         |

**Do not invent** additional public controllers, cron modules, or Prisma migrations under this inventory.

---

## 8. Architecture and execution sequence

### Stage 0 — Preflight and authorization verification

| Field         | Content                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| Preconditions | PO grant recorded in separate ratification; HEAD/index hygiene; COND-IA bound       |
| Work          | Confirm grant scope; confirm catalog absent before work; confirm Entry/export walls |
| Excluded      | Coding before grant                                                                 |
| Exit          | Written kickoff acknowledgment of COND-IA-01…06                                     |
| Stop          | Missing/contradictory grant; scope creep                                            |

### Stage 1 — Entry extension design freeze (kickoff)

| Field         | Content                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Preconditions | Stage 0                                                                |
| Work          | Confirm method name/surface; helper split; no second constructor       |
| Excluded      | Public export of Entry unless separately justified without DTO ingress |
| Exit          | Design note matching COND-IA-06                                        |
| Tests         | Design review checklist                                                |
| Stop          | Any second constructor / public actor ingress                          |

### Stage 2 — Security Audit catalog + attribution

| Field         | Content                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| Preconditions | Stage 1                                                                  |
| Work          | Register type + attribution; refuse-closed until done                    |
| Excluded      | Second event type; Prisma actorKind; outbox                              |
| Exit          | Classified emission possible; prior refuse tests still pass for unknowns |
| Tests         | Classification/attribution/service refuse + admit                        |
| Stop          | Catalog/attribution desync                                               |

### Stage 3 — Lease acquisition and write-authority setup

| Field         | Content                                                              |
| ------------- | -------------------------------------------------------------------- |
| Preconditions | Stage 2 (or parallel only if no emission yet)                        |
| Work          | Wire Entry→B-04 start/HB/release; assertWriteAuthority in write unit |
| Excluded      | Reclaim redesign                                                     |
| Exit          | Entry acquires/releases with canonical actor; CAS callable in txn    |
| Tests         | Entry→B-04; CAS miss                                                 |
| Stop          | Export of B-04/PORT/durable                                          |

### Stage 4 — Per-attempt fresh Vault + occupancy + C

| Field         | Content                                               |
| ------------- | ----------------------------------------------------- |
| Preconditions | Classifier + Vault metadata APIs available (EXISTING) |
| Work          | Implement freshness loop before each write attempt    |
| Excluded      | Treating preflight as write authority                 |
| Exit          | Tests prove stale batch-pass insufficient             |
| Tests         | Freshness suite (IMPL-REV-D-06)                       |
| Stop          | Skipping per-attempt proof                            |

### Stage 5 — Conditional NULL→live UPDATE

| Field         | Content                                                 |
| ------------- | ------------------------------------------------------- |
| Preconditions | Stages 3–4                                              |
| Work          | Conditional UPDATE + predicates; eligible EXCHANGE only |
| Excluded      | Rewrite populated env; Vault mutation                   |
| Exit          | Idempotent 0-row on retry; ineligible never LIVE        |
| Tests         | Predicate / CAS / occupancy collision                   |
| Stop          | Check-then-save without CAS                             |

### Stage 6 — Per-row durable Security Audit

| Field         | Content                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Preconditions | Stage 2                                                                                                     |
| Work          | Emit per disposition within §13 floor; **mandatory** same-txn with UPDATE for normal per-row path (§11.2.A) |
| Excluded      | Secrets in payload                                                                                          |
| Exit          | Updated + blocked durable; attribution canonical                                                            |
| Tests         | Per-row audit integrity                                                                                     |
| Stop          | Emitting before catalog registration                                                                        |

### Stage 7 — Operation-level summary

| Field         | Content                                      |
| ------------- | -------------------------------------------- |
| Preconditions | Stage 6 path exists                          |
| Work          | One `operation_summary` (+ counters) per run |
| Excluded      | Second catalog type                          |
| Exit          | Counters match parent §13 set                |
| Tests         | Summary + counter assertions                 |
| Stop          | Silent omission of errors                    |

### Stage 8 — Failure handling and forward-fix

| Field         | Content                                    |
| ------------- | ------------------------------------------ |
| Preconditions | Stages 5–7                                 |
| Work          | Matrix §11; forward-fix paths              |
| Excluded      | Auto LIVE→NULL; new max-window policy      |
| Exit          | No silent success; HB fail stops writes    |
| Tests         | Audit-fail-after-UPDATE; HB fail; CAS miss |
| Stop          | Claiming success with unaudited updates    |

### Stage 9 — Residual counters / evidence for E (handoff only)

| Field         | Content                                                       |
| ------------- | ------------------------------------------------------------- |
| Preconditions | Run completion                                                |
| Work          | Persist/emit counters + durable audits required by parent §13 |
| Excluded      | **E implementation**                                          |
| Exit          | D outputs available for future E                              |
| Tests         | Counter taxonomy present                                      |
| Stop          | Merging E into D                                              |

**Parallelization:** Stage 2 may proceed early but **must not** emit before registration. Stages 4–8 are sequential per row. E remains separate.

---

## 9. Audit contract

| Item               | Binding                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Type               | `connection.environment-backfill`                                                                                       |
| Floor              | Parent Slice Planning Package §13 (counters, outcomes, safe fields, forbidden)                                          |
| Per-row            | Required for write-path dispositions                                                                                    |
| Summary            | `operation_summary` (+ counters) per run                                                                                |
| Updated + blocked  | AC-D-04 mandatory                                                                                                       |
| Attribution        | SYSTEM_JOB canonical on Entry path                                                                                      |
| Txn                | **Mandatory** same-txn UPDATE+per-row audit on normal path (§11.2.A); post-commit forward-fix in-process only (§11.2.B) |
| Append-only        | Preserve existing Security Audit semantics                                                                              |
| Not yet in catalog | **FACT** — delivery under this IA if granted                                                                            |

---

## 10. Write safety and mutation semantics

| Rule                                             | Source                  |
| ------------------------------------------------ | ----------------------- |
| B-04 write gate + lease lifecycle                | B-04 CLOSED; COND-IA-02 |
| Contention / CAS fail-closed                     | `assertWriteAuthority`  |
| Fresh Vault + occupancy + C per attempt          | IMPL-REV-D-06           |
| Conditional `environment IS NULL` → `live`       | AC-D-01/03              |
| Eligible EXCHANGE only; Connected / Vault-proven | C / A inheritance       |
| No mutation of ineligible / already populated    | AC-D-03; fail-closed    |
| Zero Vault mutation                              | AC-D-06                 |
| No public env API                                | AC-D-07                 |
| FOR UPDATE optional                              | IMPL-REV-D-01           |

---

## 11. Failure / recovery matrix

Derived from Implementation Planning §17, COND-D-05 qualitative dichotomy, IMPL-REV-C-01, IMPL-REV-D-02/D-05, AC-D-01…07. **IA-REV-02** removes prior “skip or abort” ambiguity. No new max-window policy. No invented numeric Vault threshold.

### 11.1 Deterministic failure semantics (IA-REV-02)

| Failure class                                                                                                 | Controlling source                                                                                            | Unambiguous behavior                                         | Audit                                                         | Continue other rows? |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- | -------------------- |
| Per-row C ineligibility (blocked_*, skip already populated, non-eligible after reclassify)                    | AC-D-04/05; Impl Planning §17; IMPL-REV-D-06                                                                  | **ROW SKIP** — no UPDATE                                     | Per-row blocked/skip                                          | **YES**              |
| Occupancy **collision** (`occupied`)                                                                          | Strategy B; §17; C dispositions                                                                               | **ROW SKIP** — never LIVE                                    | Per-row blocked (collision)                                   | **YES**              |
| Occupancy **source unavailable** (`unavailable`)                                                              | COND-D-05 ratified: occupancy `unavailable` at write classification = **systemic**; IMPL-REV-C-01 fail-closed | **BATCH ABORT** — never LIVE; **stop all subsequent writes** | Summary + errors; blocked/error for current row if classified | **NO**               |
| Vault **systemic** unavailable (list/auth/transport cannot obtain required workspace metadata)                | COND-D-05; Freeze; §17                                                                                        | **BATCH ABORT** before/at affected workspace                 | Summary/errors                                                | **NO**               |
| Vault **per-row** exact-id miss / non-Connected / purpose block after successful list                         | COND-D-05 per-row; §17                                                                                        | **ROW SKIP**                                                 | Per-row blocked                                               | **YES**              |
| Connection concurrent modification (conditional UPDATE **0 rows**; env no longer NULL)                        | AC-D-03 idempotency; §17                                                                                      | **ROW SKIP** — idempotent; no rewrite                        | skip / no_longer_eligible                                     | **YES**              |
| B-04 `assertWriteAuthority` fail — ownership lost / fence mismatch (`GATE_FENCE_MISMATCH` / `OWNERSHIP_LOST`) | B-04; §17 “stop if ownership lost”; COND-D-06                                                                 | **STOP ALL SUBSEQUENT WRITES** — no UPDATE on that attempt   | blocked/error + summary errors                                | **NO**               |
| B-04 `assertWriteAuthority` fail — `GATE_UNKNOWN` / unexpected                                                | B-04 fail-closed                                                                                              | **STOP ALL SUBSEQUENT WRITES**                               | summary/errors                                                | **NO**               |
| Lease unavailable at start                                                                                    | §17                                                                                                           | **BATCH ABORT** (no acquire)                                 | Existing gate audit                                           | N/A                  |
| Lease expiry / heartbeat failure mid-run                                                                      | COND-D-06; IMPL-REV-D-02; §17                                                                                 | **STOP ALL SUBSEQUENT WRITES**; fail-closed                  | Summary + errors                                              | **NO**               |
| DB txn rollback (before commit)                                                                               | §17                                                                                                           | No env change; **ROW SKIP** or stop if authority lost        | As applicable                                                 | Per cause            |
| Unique/Strategy B DB reject (P2002)                                                                           | Strategy B final SoT                                                                                          | **ROW SKIP**                                                 | blocked collision                                             | **YES**              |
| Audit failure after committed UPDATE                                                                          | IMPL-REV-D-05; Slice forward-fix                                                                              | See **§11.2** — never silent success; no auto LIVE→NULL      | Required forward-fix                                          | Per §11.2            |
| `operation_summary` persistence failure                                                                       | IMPL-REV-D-04/D-05                                                                                            | **Run outcome = failed**; no silent success                  | Attempt summary; mark errors                                  | N/A (end of run)     |
| Partial batch with only row-skips                                                                             | AC-D-05                                                                                                       | Allowed                                                      | Per-row + summary                                             | —                    |
| OPERATOR reclaim                                                                                              | Adapter `reclaimAsOperator`                                                                                   | **Out of Entry scope** — existing recovery                   | Gate audits                                                   | —                    |

**Distinctions (mandatory):**

1. **Occupancy collision** ≠ **occupancy unavailable** — collision is row-skip; unavailable is batch abort.
2. **Connection 0-row UPDATE** ≠ **B-04 write-authority failure** — 0-row is row-skip (idempotent concurrency on Connection); authority/fence failure stops the batch.
3. There is **no separate Connection-row CAS API**; Connection concurrency = conditional `environment IS NULL` UPDATE (+ optional FOR UPDATE). Lease fence CAS = `assertWriteAuthority` only.

### 11.2 Forward-fix recovery acceptance criteria (IA-REV-03)

**Disposition:** **IA-REV-03 = ACCEPTED WITH EXPLICIT LIMITATION — NOT BLOCKING FULL-D IMPLEMENTATION AUTHORIZATION.**  
Does **not** grant Implementation Authorization. Status remains `PENDING PRODUCT OWNER DECISION`.

**Existing architecture (FACT):** `SecurityAuditService.record(..., transaction?)` → `PrismaSecurityAuditRepository.append` via `prismaClientForTransaction` when a txn is supplied. Append-only. **No** audit outbox, **no** pending-audit table, **no** second event type. Event type remains `connection.environment-backfill`. Attribution remains P-D-02 canonical SYSTEM_JOB on the Entry path. Payload stays within parent Slice Planning Package §13 floor — **not** reinvented here.

#### A. Normal successful D execution (mandatory same-transaction coupling)

For the **normal successful** Full-D delivery path, the `Connection.environment` UPDATE and its corresponding **per-row** Security Audit append **must** commit atomically in the **same** database transaction.

| Rule                      | Binding                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Coupling                  | UPDATE + per-row `record(..., transaction)` in one txn                                                                                                                                           |
| Audit append fails in txn | Transaction **fails**; UPDATE **rolls back**                                                                                                                                                     |
| Counting success          | A row is **not** counted as successfully updated unless the required per-row audit evidence is **durably committed**                                                                             |
| Event / attribution       | `connection.environment-backfill`; canonical SYSTEM_JOB attribution (P-D-02)                                                                                                                     |
| Policy note               | This **operationalizes** IMPL-REV-D-05’s same-transaction preference as an **implementation requirement** for authorized Full-D delivery. It does **not** amend Product Owner ratification texts |

#### B. Post-commit forward-fix (in-process only — not crash-safe)

Synchronous audit retry is an **in-process** recovery mechanism only (Slice §17; IMPL-REV-D-05).

| Rule                 | Binding                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| While process alive  | Bounded synchronous retries of `record`/`append` **without** a txn that would rewrite env |
| Across process death | **Does not** provide durable retry                                                        |
| Repeated failure     | **Must not** be treated as success; run = failed/incomplete; **operator reconciliation**  |
| Env                  | **Do not** auto-revert committed LIVE → NULL                                              |
| Description ban      | **Do not** describe this mechanism as crash-safe audit recovery                           |

#### C. Process crash after UPDATE commit (explicit limitation)

| Fact                                                                                   | Consequence                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| No durable pending-audit marker / outbox / recovery queue in the approved architecture | Automatic completion of a missing per-row audit after kill is **not** guaranteed                  |
| Restart sees already-populated env                                                     | Idempotent **ROW SKIP** (no double LIVE write)                                                    |
| Restart / idempotency alone                                                            | **Does not** detect or repair a missing `connection.environment-backfill` / `updated_live` record |
| Who reconciles                                                                         | **Operator reconciliation** under IMPL-REV-D-05 / parent Slice §17                                |
| Not E                                                                                  | **Do not** assign crash audit-completeness repair to FIV-CONN-04-E                                |

**Limitation (accepted):** The system does **not** guarantee automatic completion of every per-row audit record after an arbitrary process crash in a post-commit window. This limitation is **accepted** under ratified forward-fix + operator reconciliation and does **not** by itself block Full-D IA approval.

#### D. `operation_summary`

| Rule                      | Binding                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Successful completed run  | `operation_summary` **required** under the approved audit contract (IMPL-REV-D-04 / PD03-NB01) |
| Summary persistence fails | Run **must not** be reported as successful                                                     |
| Process crash             | May leave an incomplete run **without** a completed summary                                    |
| Recovery                  | **Do not** invent a durable summary-recovery mechanism                                         |

#### E. FIV-CONN-04-E boundary (not audit reconciliation)

| Owner                             | Responsibility                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **D**                             | Backfill execution and required audit evidence (per-row + summary for successful completion)     |
| **E**                             | Residual **Connection** inventory / verification per parent Slice §7.5, §15, **AC-E-01…05** only |
| **E is not**                      | An audit-completeness reconciliation mechanism                                                   |
| Missing per-row audit after crash | **Operator reconciliation** (IMPL-REV-D-05 / Slice §17) — **not** E                              |

Ambiguous “operator/E residual” wording is **superseded** by this subsection: crash audit gaps → **operator** only.

#### Scenario acceptance table

| Scenario                                         | Required behavior                                                               | Classification                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A — same-txn; audit fails                        | Txn rollback; env unchanged; row not counted updated                            | **GUARANTEED** (normal path)                                 |
| B — post-commit; sync retry succeeds             | Durable per-row audit; run may proceed per matrix                               | **GUARANTEED WITH LIMITATION** (in-process only)             |
| C — post-commit; retries exhaust                 | Failed/incomplete run; operator reconciliation; no LIVE→NULL; no silent success | **GUARANTEED WITH LIMITATION**                               |
| Crash after commit, before audit                 | No automatic audit repair; restart skips LIVE row; operator reconciles          | **NOT GUARANTEED** (auto-complete) · limitation **accepted** |
| `operation_summary` fails / crash before summary | No success claim; no durable summary invent                                     | **GUARANTEED WITH LIMITATION**                               |

**EXCLUDED** (would need separate evidence + PO): transactional outbox, pending-audit table, retry queue, second catalog event type, auto LIVE→NULL, assigning audit completeness to E.

**Does this block Full-D IA approval / kickoff after PO grant?** **No** — limitation is explicit and within ratified IMPL-REV-D-05 / Slice §17. Kickoff must implement **§11.2.A** mandatory same-txn for normal UPDATE+per-row audit, and **§11.2.B–E** as stated, using existing `record`/`append` only.

---

## 12. IMPL-REV-D-01…06 acceptance matrix

| ID       | Source meaning                                                         | Proposed requirement                                                                                                                           | Acceptance criteria                                                                                                                          | Required tests                                                                             | Closure evidence     | Component                  |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------- | -------------------------- |
| **D-01** | FOR UPDATE optional; safety = CAS + conditional UPDATE + Strategy B    | May omit Connection FOR UPDATE                                                                                                                 | Lease `assertWriteAuthority` + conditional UPDATE + occupancy suffice; if FOR UPDATE used, documented optional                               | Authority fail stop; 0-row skip; collision skip                                            | Spec + design note   | Write unit                 |
| **D-02** | 15m/5m guidance under ≤4h; no new max-window policy                    | Use existing gate defaults; HB on long batch; stop on HB fail                                                                                  | No new policy constants elevated to freeze; fail-closed on expire/HB                                                                         | HB fail / TTL → **stop subsequent writes**                                                 | Spec log             | Entry + B-04               |
| **D-03** | Privileged Nest; no public HTTP; not default cron; Entry binding       | Option A Entry expand only                                                                                                                     | No controller D path; no cron; exports exclude B-04/PORT/durable/Entry (unless justified unexported consumer)                                | Module export + controller absence                                                         | Source assert        | Module + Entry             |
| **D-04** | Per-row + `operation_summary`; A ≠ D duty                              | Emit both on write path                                                                                                                        | Updated+blocked durable; one summary; A inventory without D per-row OK                                                                       | Audit integrity                                                                            | Spec + audit records | Audit helper + Entry       |
| **D-05** | Forward-fix; no silent success; prefer same-txn                        | §11.2: **mandatory** same-txn on normal path; post-commit sync retry in-process only; operator (not E) for crash gaps; no outbox; no LIVE→NULL | Row not counted updated without committed per-row audit; retry exhaust ⇒ failed run; crash limitation explicit; summary required for success | Same-txn rollback; in-process retry; repeated fail; summary fail; no success without audit | Spec                 | Write unit + audit + Entry |
| **D-06** | Fresh Vault+occupancy+C before each write txn; preflight informational | §7.0 APIs: `list`+exact id; occupancy projection; `classifyFivConn04LiveConnection`                                                            | Stale preflight-only cannot write; unavailable occupancy aborts batch                                                                        | Freshness suite; unavailable→abort; occupied→skip                                          | Spec                 | Entry loop                 |

---

## 13. Test strategy

| Layer                                 | Existing suites (examples)                                    | Proposed additions                                                           |
| ------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Identity / Entry boundary             | `fiv-conn-04-d-system-job-identity.spec.ts`, Entry spec       | Expand Entry for backfill surface walls                                      |
| Nest exports                          | `conn04-migration-boundary.service.spec.ts` CONDITION-2 style | Re-assert after module MODIFY                                                |
| B-04 lease / write authority          | B-04 / B-06 specs                                             | Regression; authority-fail → **stop batch**                                  |
| SYSTEM_JOB attribution                | Entry audit integrity cases; B-05                             | D backfill attribution asserts                                               |
| Catalog admission / refuse-closed     | `security-audit.service.spec.ts`                              | Admit new type; refuse unknown                                               |
| Per-row / summary audit               | —                                                             | New backfill audit + write specs                                             |
| Same-txn                              | Gate audit txn patterns                                       | Write-unit: audit fail rolls back UPDATE                                     |
| Conditional UPDATE / Connection 0-row | —                                                             | Idempotent skip (not batch abort)                                            |
| Occupancy collision vs unavailable    | C specs for input semantics                                   | D loop: occupied→skip; unavailable→**abort**                                 |
| Freshness Vault/occupancy/C           | C / A specs (inputs)                                          | `list`+exact-id; reject preflight-only write                                 |
| Concurrency / lease contention        | B-06 concurrency                                              | Fence mismatch → stop subsequent writes                                      |
| Failure / forward-fix (§11.2)         | Planning §17                                                  | Retry success; retry exhaust; summary fail; no success with unaudited UPDATE |
| OPERATOR reclaim regression           | `prisma-migration-gate.adapter.spec.ts`                       | Must remain green                                                            |
| A/B/C regressions                     | A/C/B-05/B-06 suites                                          | Must remain green                                                            |
| Typecheck / API suite                 | repo scripts                                                  | Full relevant `apps/api` vitest + `tsc` as used by project                   |

**Do not claim tests have passed.** Filenames for new specs are **proposed**; implementers may colocate equivalently if inventory purpose is met.

---

## 14. E handoff

| Item                 | Binding                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| E stage              | **Separate** — **EXCLUDED** from this authorization                         |
| D must provide       | Parent Slice Planning Package §13 counters + durable updated/blocked audits |
| D→E transport format | **DEFERRED** to E (Freeze OQ-D-08)                                          |
| Residual NULL        | Allowed / fail-closed on use — not silently closed by D                     |

---

## 15. Open details and disposition

| Item                                                          | Disposition                                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Exact payload field wiring within §13 floor                   | **DEFERRED DETAIL** — acceptance criteria under grant                                  |
| Disposition→outcome naming within §13 taxonomy                | **DEFERRED DETAIL** — floor binding mandatory                                          |
| Entry method exact name (`runEnvironmentBackfill` vs synonym) | **DEFERRED DETAIL** — must remain on Entry                                             |
| Entry export vs unexported                                    | Prefer unexported; IA grant does not require export                                    |
| Optional Connection FOR UPDATE                                | Optional (D-01)                                                                        |
| Numeric Vault abort threshold                                 | **Not invented**; qualitative COND-D-05 (systemic vs per-row dichotomy bound in §11.1) |
| D→E report format                                             | Deferred to E                                                                          |
| MINOR-01 remediation                                          | Only if public/DTO ingress proposed — **out of scope** here                            |
| Historical unaudited LIVE after crash mid-forward-fix         | **Limitation** §11.2.C — **operator reconciliation** (not E); no outbox invented       |

---

## 16. Exclusions (restated)

See §6.2. Additionally: no Decision Register edit; no grant by this document; no ratification artifact until PO decides.

---

## 17. Stop conditions

Stop implementation (if ever granted) or stop this proposal interpretation if:

1. PO decision missing / contradictory / narrower than assumed.
2. Second SYSTEM_JOB constructor or parallel trusted Entry introduced.
3. Public HTTP / DTO / external actor / cron / Trading Runtime added.
4. Catalog emission before coordinated registration.
5. IMPL-REV-D-05 or D-06 violated.
6. Payload invents fields outside parent §13 floor / secrets.
7. B-04 / PORT / durable exported.
8. E merged into D.
9. Production activation attempted under this IA alone.
10. Scope expands beyond §7 inventory without new PO authority.

---

## 18. Product Owner authorization decision section

```text
IMPLEMENTATION AUTHORIZATION: PENDING PRODUCT OWNER DECISION
```

### 18.1 Decision request

The Product Owner is asked to decide whether to **APPROVE** or **REJECT** (or approve with recorded amendments) Implementation Authorization for the scope in this package.

| Field                           | Content                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Decision ID (if approved later) | To be assigned in separate ratification (e.g. `D-CONN04-FULL-D-IA`) — **not** assigned here |
| Package date                    | 2026-10-30                                                                                  |
| Status now                      | **PENDING**                                                                                 |

### 18.2 If APPROVED — exact authorized scope

1. Expand/absorb `Conn04SystemJobMigrationEntry` per COND-IA-06 (no second constructor).
2. Coordinated Security Audit catalog + attribution for `connection.environment-backfill`.
3. Module-local write unit + backfill audit helper.
4. Conditional NULL→`live` UPDATE under B-04 + IMPL-REV-D-06 freshness.
5. Per-row + `operation_summary` audits; IMPL-REV-D-05 forward-fix.
6. Tests per §13.
7. Module wiring preserving export walls.

**Catalog/attribution included in same authorization:** **YES** (if this package is approved without amendment stripping them).

### 18.3 Exact exclusions (even if approved)

§6.2 + §16; E; production activation; live capital; public ingress; reclaim redesign; Prisma `actorKind`; outbox; unrelated refactors.

### 18.4 Authorized file inventory bound

§7 proposed inventory (CREATE/MODIFY/REUSE/NO CHANGE as listed). No implicit authority to expand paths.

### 18.5 Conditions and acceptance criteria

COND-IA-01…06, COND-DOC-01, IMPL-REV-D-01…06 matrix (§12), parent Slice Planning Package §13 floor, AC-D-01…07.

### 18.6 Evidence before implementation closure

- Green focused + relevant regression suites; `tsc` as applicable.
- Catalog present; refuse-closed for unknowns preserved.
- Export negatives still hold.
- Freshness + forward-fix + attribution evidence.
- Independent PIR / formal satisfaction disposition (separate later acts).
- No production activation claim.

### 18.7 No pre-filled approval

```text
PO DECISION: _______________
DATE: _______________
AMENDMENTS (if any): _______________
```

**Do not** treat blank lines as approval. A separate ratification artifact is required after an explicit PO decision.

---

## 19. Findings disposition — IA-REV-01…03

Remediation of the independent Full-D IA package review findings. Documentation-only; does **not** grant authorization.

| Finding                                                                     | Disposition                                    | Severity (review) | Resolution in this package                                                                                                                                                                                                      | Blocks kickoff? |
| --------------------------------------------------------------------------- | ---------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **IA-REV-01** — Explicit Vault metadata and occupancy dependency inventory  | **CLOSED**                                     | (review finding)  | **§7.0** + §7.1 REUSE rows: `SecretVaultService.list` + exact-id match; Prisma occupancy projection → `FivConn04LiveSlotOccupancy`; `classifyFivConn04LiveConnection`; documented that `get` is not exact-id                    | **No**          |
| **IA-REV-02** — Deterministic failure for occupancy / CAS / write-authority | **CLOSED**                                     | (review finding)  | **§11.1** table: collision→row skip; unavailable→batch abort; Connection 0-row→row skip; B-04 fence/unknown→stop subsequent writes; lease/HB→stop                                                                               | **No**          |
| **IA-REV-03** — Forward-fix recovery acceptance criteria                    | **CLOSED — ACCEPTED WITH EXPLICIT LIMITATION** | (review finding)  | **§11.2.A–E** (mandatory same-txn normal path; in-process forward-fix; crash → operator not E; `operation_summary` success gate; E ≠ audit reconciliation). **Not blocking** Full-D IA approval. Explicit limitation preserved. | **No**          |

**Unresolved issues:** None that require a new PO decision or expand the CREATE inventory. Crash-window audit incompleteness remains an **accepted limitation** under IMPL-REV-D-05 / Slice §17 **operator reconciliation** (not FIV-CONN-04-E).

```text
IA-REV-01: CLOSED
IA-REV-02: CLOSED
IA-REV-03: CLOSED — ACCEPTED WITH EXPLICIT LIMITATION
IMPLEMENTATION AUTHORIZATION: PENDING PRODUCT OWNER DECISION
  (formal grant, if any, is recorded only in a separate Product Owner ratification + Decision Register entry)
```

---

## 20. Git provenance and file inventory (IA-REV-03 closure act)

| Item                  | Value                                      |
| --------------------- | ------------------------------------------ |
| Branch                | `main`                                     |
| HEAD                  | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Index                 | empty                                      |
| Stage / commit / push | **none**                                   |

| Path                                                                                 | Action                                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md` | **MODIFY** — Close IA-REV-03 (§11.2.A–E; aligned cross-refs; §19 disposition) |

**Not modified:** application source, tests, schemas, Security Audit catalog, Decision Register, Planning Delta, Planning Delta Review, P-D-02/P-D-03 ratifications, P-D-02 IA package, E planning/AC texts.

```text
FINAL STATE AFTER IA-REV-03 CLOSURE:
  P-D-02: SATISFIED
  P-D-03 / NB-01 DECISION: APPROVED — OPTION B
  PLANNING DELTA: PASS WITH CONDITIONS (baseline)
  IA-REV-03: ACCEPTED WITH EXPLICIT LIMITATION — NOT BLOCKING
  IA PACKAGE: PENDING PRODUCT OWNER DECISION
  FULL-D IMPLEMENTATION: NOT AUTHORIZED
  FULL-D BACKFILL: NOT AUTHORIZED
  PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF FIV-CONN-04-D FULL IMPLEMENTATION AUTHORIZATION PACKAGE**
