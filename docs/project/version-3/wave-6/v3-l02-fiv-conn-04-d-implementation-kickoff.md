# FIV-CONN-04-D — Implementation Kickoff Package

**Document:** Decision-ready Implementation Kickoff proposal for independent Kickoff Review  
**Date of preparation:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Nature:** **KICKOFF PREPARATION ONLY.** Does **not** authorize implementation execution by itself. Does **not** implement code, tests, schemas, catalog, or migrations. Does **not** modify the Decision Register, Full-D IA package, or Full-D IA ratification. Does **not** stage, commit, or push. Does **not** start FIV-CONN-04-E or production activation.

```text
FULL-D IMPLEMENTATION AUTHORIZATION: GRANTED WITH AMENDMENTS
IMPLEMENTATION KICKOFF: PREPARED — PENDING INDEPENDENT KICKOFF REVIEW
IMPLEMENTATION EXECUTION: NOT STARTED
FIV-CONN-04-E: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Governing authority:** The ratified Full-D IA package is the **sole** scope authority for what may be implemented after Kickoff Review passes. This Kickoff package sequences and verifies readiness; it does **not** expand, narrow, or re-ratify that scope.

---

## 1. Authorization and provenance

| Field                        | Value                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Decision ID                  | **D-CONN04-FULL-D-IA**                                                                                         |
| Decision type                | **APPROVE WITH AMENDMENTS**                                                                                    |
| Authorization status         | **GRANTED WITH AMENDMENTS**                                                                                    |
| Ratification path            | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`         |
| Ratified IA package path     | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md`                           |
| Verified package SHA-256     | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`                                             |
| Hash verification (this act) | Recalculated with `shasum -a 256`; **exact character-for-character match** to ratification Amendment 2 binding |
| Preparation date             | 2026-10-30                                                                                                     |
| Branch                       | `main`                                                                                                         |
| HEAD                         | `953292675e197d4f25778aaaa59eacb2826560fe`                                                                     |
| Index                        | **empty** (no staged files)                                                                                    |
| Working tree                 | Pre-existing dirty + untracked files present (preserved; see §1.1)                                             |

**Sole scope authority:** After Kickoff Review issues a non-BLOCKED verdict and any required conditions are cleared, engineering may implement **only** the bounded Full-D scope in the ratified IA package at the hash above. Material content drift of that package after this hash requires a new Product Owner act before coding.

**Kickoff vs ratification:** D-CONN04-FULL-D-IA grants bounded implementation authority. **Implementation Kickoff remains incomplete** until an independent Kickoff Review records `PASS` or `PASS WITH CONDITIONS` against this package. **Coding must not start** until that gate is completed.

### 1.1 Working-tree baseline (preserved)

Pre-existing dirty (modified, not staged):

- `apps/api/src/composition/live-admission-gate-ports.module.spec.ts`
- `apps/api/src/modules/connections/conn04-migration-boundary.service.spec.ts`
- `apps/api/src/modules/connections/connections.module.ts`
- `docs/project/technical-debt.md`
- `docs/project/version-3/wave-5/wave-5-progress.md`
- `docs/project/version-3/wave-6/wave-6-po-decision-register.md`
- `docs/releases/rc-1/security.md`

Pre-existing untracked include P-D-02 Entry/identity sources and specs, Full-D IA package, Full-D IA ratification, Planning Delta artifacts, and other wave-6 governance docs. **This Kickoff act creates only this document** and must not disturb that baseline.

### 1.2 Ratification Markdown structure check

Source-file inspection of the ratification Basis artifacts table and §2 / §8 tables: **PASS** — tables are well-formed Markdown (`| … |` rows with header separators). Prior fragmented appearance in copied chat text is treated as a **copy/rendering artifact**, not a source defect. No silent edit of the ratification was performed.

---

## 2. Kickoff entry criteria

Evidence-based checklist. Items marked **PASS** cite repository artifacts inspected in this preparation act. Items marked **PASS WITH CONDITION** require Kickoff Review attention but are not treated as authorization blockers for preparing this package. No criterion is marked PASS without evidence.

| #     | Criterion                                      | Evidence                                                                                                                                                                                                                | Status                                                                                  |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| EC-01 | Formal Full-D IA grant exists                  | Ratification Decision ID `D-CONN04-FULL-D-IA`; Status **APPROVE WITH AMENDMENTS** / **GRANTED WITH AMENDMENTS**; Decision Register CURRENT STATE + append entry `D-CONN04-FULL-D-IA`                                    | **PASS**                                                                                |
| EC-02 | Ratification hash matches current IA package   | Observed SHA-256 `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` equals ratification §2 / Amendment 2 and Decision Register final package SHA-256                                                    | **PASS**                                                                                |
| EC-03 | Decision Register consistent with ratification | CURRENT STATE row, append entry, NON-DECLARATIONS sync, and STOP all record GRANTED WITH AMENDMENTS; kickoff NOT COMPLETED; execution NOT STARTED; E / production NOT AUTHORIZED                                        | **PASS**                                                                                |
| EC-04 | P-D-02 prerequisite satisfied                  | `D-CONN04-PD02-SAT` / `v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md` = **SATISFIED**; Entry + identity present in tree (lease mediation only)                                                           | **PASS**                                                                                |
| EC-05 | P-D-03 / NB-01 prerequisite satisfied          | `D-CONN04-PD03-NB01` / Option B ratification = **APPROVED — OPTION B**; event type `connection.environment-backfill`; catalog code still absent (`rg` over `apps/api/src/modules/security-audit/` — no matches)         | **PASS**                                                                                |
| EC-06 | Planning Delta + review accepted               | Delta exists; independent review verdict **PASS WITH CONDITIONS**; IA binds COND-IA-01…06 + COND-DOC-01                                                                                                                 | **PASS**                                                                                |
| EC-07 | IA-REV-01…03 dispositions preserved            | Package §19: IA-REV-01 **CLOSED**; IA-REV-02 **CLOSED**; IA-REV-03 **CLOSED — ACCEPTED WITH EXPLICIT LIMITATION**; ratification Amendment 1 identical                                                                   | **PASS**                                                                                |
| EC-08 | COND-IA-01…06 and COND-DOC-01 understood       | IA §5 matrix + parent Slice Planning Package §13 Audit Model counters/outcomes/safe fields inspected; Kickoff §§3–6 restate without weakening                                                                           | **PASS**                                                                                |
| EC-09 | No conflicting Full-D authorization            | Single Decision ID `D-CONN04-FULL-D-IA`; no alternate Full-D IA grant; register STOP agrees                                                                                                                             | **PASS**                                                                                |
| EC-10 | No Full-D implementation started               | Entry still P-D-02 lease-only (no `runEnvironmentBackfill` / env UPDATE); catalog lacks type; no Full-D write-unit / audit-helper files; this Kickoff creates docs only                                                 | **PASS**                                                                                |
| EC-11 | Ratification separates kickoff from grant      | Ratification §1 / §7: kickoff NOT YET COMPLETED; execution MUST NOT START until separate kickoff gate                                                                                                                   | **PASS**                                                                                |
| EC-12 | Production / E remain unauthorized             | Ratification exclusions + register STOP                                                                                                                                                                                 | **PASS**                                                                                |
| EC-13 | Dirty-tree protection acknowledged             | Baseline recorded §1.1; Kickoff must not reset/stash/clean/checkout/stage                                                                                                                                               | **PASS**                                                                                |
| EC-14 | Vault list authorization design readiness      | IA §7.0 CONDITION: wire `SecretVaultService.list(actorWorkspaceId, workspaceId, actorRole?)` without public actor ingress / second constructor. Design freeze (Stage 1) must document exact privileged Nest call shape. | **PASS WITH CONDITION** — design note required at Stage 1; not a missing artifact today |

**Entry-criteria roll-up for Kickoff Review:** All hard authorization integrity criteria **PASS**. EC-14 is a planned Stage-1 deliverable condition, not an authorization hash/register failure.

---

## 3. Authorized implementation scope

Reproduce **exactly** the bounded scope from D-CONN04-FULL-D-IA / ratified IA §§6.1, 18.2 — **no expansion**:

1. Expand/absorb `Conn04SystemJobMigrationEntry` under **Option A** as the **sole** trusted SYSTEM_JOB execution boundary.
2. Preserve the sole trusted SYSTEM_JOB ↔ B-04 boundary (canonical identity via `buildFivConn04DSystemJobActor` only).
3. Register exactly `connection.environment-backfill` in Security Audit classification and attribution.
4. Implement conditional `Connection.environment` NULL → `live` backfill under B-04.
5. Enforce fresh Vault metadata (exact-id), typed occupancy, and C classification **before each write attempt** (IMPL-REV-D-06).
6. Implement per-row durable audit and `operation_summary`.
7. Enforce **mandatory** same-transaction UPDATE + per-row audit on the normal successful path (§11.2.A).
8. Implement authorized failure and forward-fix semantics (§11.1 / §11.2.B–E).
9. Add tests and module wiring within the approved inventory (§7 / §13).
10. Preserve Nest export walls (B-04 / PORT / durable / Entry remain unexported unless separately justified without DTO ingress).
11. Bind conditions **COND-IA-01…06**, **COND-DOC-01**, and **IMPL-REV-D-01…06**.

**Accepted limitation (IA-REV-03 — not eliminated):**

- Post-commit synchronous audit retry is **in-process only**.
- Crash-window missing audits require **operator reconciliation**.
- **FIV-CONN-04-E is not** audit-completeness reconciliation.
- **No** outbox, pending-audit table, retry queue, or second event type.

**Explicit exclusions (non-exhaustive; full list in IA §6.2 / ratification §6):**

- FIV-CONN-04-E implementation
- Production activation, live capital, FIV PASS
- Public HTTP / UI / cron / scheduler / Trading Runtime ingress
- Second SYSTEM_JOB constructor or external actor ingress
- Prisma `actorKind` column
- Outbox / pending-audit mechanism
- Unrelated refactoring or inventory expansion

Any additional file or scope discovered during coding that is not in §4 inventory → **`SCOPE CHANGE — STOP AND SEEK SEPARATE PRODUCT OWNER AUTHORITY`**.

---

## 4. Exact authorized file inventory

Source of truth: ratified IA package **§7** (including §7.0 dependency reuse). Classifications below are **authorized actions after Kickoff Review passes**, not claims that work has started.

### 4.0 Evidence-based dependencies (REUSE — no new Vault/occupancy/C modules)

| Dependency                                    | Exact existing source                                                                                                                         | How D consumes it                 | Authorized?                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------- |
| Fresh Vault metadata by exact `vaultSecretId` | `SecretVaultService.list` → exact match `meta.id === connection.vaultSecretId` in `apps/api/src/modules/secret-vault/secret-vault.service.ts` | Outside write txn, before C       | **YES — REUSE** (do **not** use slot-based `get`) |
| Typed occupancy                               | Prisma `findFirst` projection → `FivConn04LiveSlotOccupancy` (`fiv-conn-04-live-classifier.ts`)                                               | Outside write txn, before C       | **YES — REUSE**                                   |
| Per-attempt C                                 | `classifyFivConn04LiveConnection`                                                                                                             | Outside write txn                 | **YES — REUSE**                                   |
| Informational candidates                      | `FivConn04APreflightService.run`                                                                                                              | Once per run; never write SoT     | **YES — REUSE**                                   |
| Write authority                               | `Conn04MigrationBoundaryService.assertWriteAuthority(txn, grant)`                                                                             | Inside write txn                  | **YES — REUSE**                                   |
| Durable audit append                          | `SecurityAuditService.record(..., transaction?)`                                                                                              | Mandatory same-txn on normal path | **YES — REUSE**                                   |

### 4.1 SYSTEM_JOB Entry / orchestration

| Path                                                                           | Action     | Purpose                                                                                      | Dependencies                                                       | Required acceptance evidence             | Authorized? |
| ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- | ----------- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` | **MODIFY** | Expand Entry with backfill orchestration; identity internal; Vault list + occupancy per §7.0 | Identity factory; B-04; Vault; Prisma; C; write unit; audit helper | Entry boundary + freshness + lease tests | **YES**     |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`        | **REUSE**  | Canonical factory                                                                            | P-D-02 SAT                                                         | Existing identity specs remain green     | **YES**     |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`        | **REUSE**  | Lease + `assertWriteAuthority`                                                               | B-04 CLOSED                                                        | Existing B-04 / B-06 specs               | **YES**     |
| `apps/api/src/modules/connections/fiv-conn-04-a-preflight.service.ts`          | **REUSE**  | Informational candidate discovery                                                            | A CLOSED                                                           | Existing A preflight specs               | **YES**     |
| `apps/api/src/modules/secret-vault/secret-vault.service.ts`                    | **REUSE**  | `list` for exact-id metadata                                                                 | SecretVaultModule already imported                                 | Freshness tests                          | **YES**     |
| `apps/api/src/storage/prisma/prisma.module.ts` (`PrismaService`)               | **REUSE**  | Occupancy projection + Connection re-read/UPDATE                                             | Prisma                                                             | Occupancy / UPDATE tests                 | **YES**     |
| `apps/api/src/modules/connections/fiv-conn-04-live-classifier.ts`              | **REUSE**  | Per-attempt C + occupancy type                                                               | C CLOSED                                                           | Existing C specs                         | **YES**     |
| `apps/api/src/modules/connections/fiv-conn-04-d-environment-backfill-write.ts` | **CREATE** | Module-local per-row write unit                                                              | Entry-only invoke; B-04 CAS; audit helper                          | New write-unit specs                     | **YES**     |
| `apps/api/src/modules/connections/connections.module.ts`                       | **MODIFY** | Register audit/write helpers if Nest-injected; **preserve** export walls                     | Existing providers                                                 | Export negative tests                    | **YES**     |

### 4.2 Security Audit catalog and attribution

| Path                                                                        | Action     | Purpose                                                           | Dependencies                 | Required acceptance evidence                     | Authorized? |
| --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------ | ----------- |
| `apps/api/src/modules/security-audit/security-audit-classification.ts`      | **MODIFY** | Admit `connection.environment-backfill`                           | PD03-NB01                    | Refuse-closed before/after; service refuse tests | **YES**     |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`         | **MODIFY** | Attribution rule for type                                         | COND-IA-04; parent §13 floor | Attribution specs                                | **YES**     |
| `apps/api/src/modules/connections/connection-environment-backfill-audit.ts` | **CREATE** | Sanitize + record helper (txn-capable); mirror gate-audit pattern | `SecurityAuditService`       | New audit helper specs                           | **YES**     |
| `apps/api/src/modules/security-audit/security-audit.service.ts`             | **REUSE**  | `record(..., transaction?)`                                       | Existing txn architecture    | Existing service specs                           | **YES**     |

### 4.3 Conditional environment mutation

| Path                                                        | Action                    | Purpose                 | Dependencies     | Required acceptance evidence        | Authorized?         |
| ----------------------------------------------------------- | ------------------------- | ----------------------- | ---------------- | ----------------------------------- | ------------------- |
| Write unit (above) + Prisma Connection UPDATE               | **CREATE** via write unit | Conditional NULL→`live` | AC-D-01/03; B-04 | Predicate / idempotency / CAS tests | **YES**             |
| `apps/api/src/storage/prisma/prisma-transaction.service.ts` | **REUSE**                 | Short write txn         | B-04 handoff     | Txn tests                           | **YES**             |
| Prisma schema                                               | **NO CHANGE**             | Nullable env remains    | D-CONN-04-07     | —                                   | **YES (no change)** |

### 4.4 Failure / recovery and operation summary

| Path                                                                | Action     | Purpose                                                                | Dependencies                     | Required acceptance evidence | Authorized? |
| ------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- | -------------------------------- | ---------------------------- | ----------- |
| Entry `runEnvironmentBackfill` (same Entry file)                    | **MODIFY** | HB fail-closed; abort/skip matrix; summary counters; forward-fix flags | Impl Planning §17; IMPL-REV-D-05 | Failure matrix specs         | **YES**     |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts` | **REUSE**  | Lease semantics; `reclaimAsOperator` unchanged                         | OBSERVATION-01                   | Existing reclaim regression  | **YES**     |

### 4.5 Tests (authorized proposed paths)

| Path                                                      | Action              | Focus                                                               | Authorized? |
| --------------------------------------------------------- | ------------------- | ------------------------------------------------------------------- | ----------- |
| `fiv-conn-04-d-system-job-migration-entry.spec.ts`        | **MODIFY**          | No actor params; orchestration; export walls; lease-only regression | **YES**     |
| `fiv-conn-04-d-environment-backfill-write.spec.ts`        | **CREATE**          | CAS, conditional UPDATE, 0-row, same-txn audit, forward-fix         | **YES**     |
| `connection-environment-backfill-audit.spec.ts`           | **CREATE**          | Sanitize refuse; attribution; txn overload; type string             | **YES**     |
| `fiv-conn-04-d-freshness.spec.ts` (or colocated sections) | **CREATE**          | IMPL-REV-D-06 stale preflight rejection                             | **YES**     |
| `security-audit.service.spec.ts`                          | **MODIFY** / extend | Classified type admission; refuse unclassified                      | **YES**     |
| `security-audit-attribution.spec.ts`                      | **MODIFY** / extend | New type rule                                                       | **YES**     |
| `conn04-migration-boundary.service.spec.ts`               | **REUSE**           | Export negatives; write authority                                   | **YES**     |
| `prisma-migration-gate.adapter.spec.ts`                   | **REUSE**           | OPERATOR reclaim regression                                         | **YES**     |
| `fiv-conn-04-live-classifier.spec.ts` / A preflight specs | **REUSE**           | C / A regressions                                                   | **YES**     |
| `fiv-conn-04-b-05-audit-integrity.spec.ts` / B-06 suites  | **REUSE**           | Gate audit / concurrency regressions                                | **YES**     |

### 4.6 Documentation (after grant / during or after implementation)

| Path                                         | Action           | Notes                                                 | Authorized at coding phase? |
| -------------------------------------------- | ---------------- | ----------------------------------------------------- | --------------------------- |
| Full-D implementation report / PIR / closure | **CREATE** later | Required before satisfaction claims; not this Kickoff | Later gate                  |

**Forbidden without new PO authority:** public controllers, cron modules, Prisma migrations, second orchestrator CREATE, outbox/pending-audit tables, any path not listed above.

**Discovery rule:** If implementation discovery suggests an additional file or scope change → classify as `SCOPE CHANGE — STOP AND SEEK SEPARATE PRODUCT OWNER AUTHORITY`. Do not treat convenience as permission.

---

## 5. Architecture and execution sequence

Aligned with ratified IA **§§5–10 / §8 Stages 0–9**. Stages below are the **authorized coding sequence after Kickoff Review passes**. This Kickoff preparation completes Stage 0 documentation only; it does **not** execute Stages 1–9.

### Stage 0 — Preflight and authorization verification (THIS PACKAGE)

| Field           | Content                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Preconditions   | D-CONN04-FULL-D-IA grant recorded; hash binding verified                                                     |
| Authorized work | Confirm grant scope; confirm catalog absent; confirm Entry/export walls; record COND-IA-01…06 acknowledgment |
| Required tests  | N/A (governance)                                                                                             |
| Exit criteria   | This Kickoff package + independent Kickoff Review non-BLOCKED verdict                                        |
| Stop conditions | Hash mismatch; contradictory grant; scope creep into coding                                                  |
| Dependencies    | Ratification + register + IA package                                                                         |

**Status of Stage 0:** Prepared herein; **Kickoff Review pending**.

### Stage 1 — Entry extension design freeze

| Field           | Content                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preconditions   | Stage 0 complete (Kickoff Review passed)                                                                                                                                                                                       |
| Authorized work | Confirm method surface (`runEnvironmentBackfill` or synonym on Entry); helper split (write unit + audit helper); no second constructor; document Vault `list` actorWorkspaceId/actorRole wiring without public ingress (EC-14) |
| Required tests  | Design review checklist (no coding claim)                                                                                                                                                                                      |
| Exit criteria   | Design note matching COND-IA-06 shape                                                                                                                                                                                          |
| Stop conditions | Second constructor; public actor ingress; Entry export that implies DTO/HTTP                                                                                                                                                   |
| Dependencies    | Stage 0                                                                                                                                                                                                                        |

### Stage 2 — Security Audit catalog + attribution

| Field           | Content                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Preconditions   | Stage 1                                                                                              |
| Authorized work | Register exactly `connection.environment-backfill`; attribution rule; refuse-closed until registered |
| Required tests  | Classification admit; refuse unknown; attribution specs; service refuse regression                   |
| Exit criteria   | Classified emission possible; unknown types still refuse                                             |
| Stop conditions | Catalog/attribution desync; second event type; emit before registration                              |
| Dependencies    | Stage 1; PD03-NB01 string                                                                            |

### Stage 3 — Lease acquisition and write-authority setup

| Field           | Content                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Preconditions   | Stage 2 (or parallel only if **no emission** yet)                      |
| Authorized work | Wire Entry→B-04 start/HB/release; `assertWriteAuthority` in write unit |
| Required tests  | Entry→B-04; CAS miss / authority fail → stop                           |
| Exit criteria   | Entry acquires/releases with canonical actor; CAS callable in txn      |
| Stop conditions | Export of B-04/PORT/durable; reclaim redesign                          |
| Dependencies    | P-D-02 Entry; B-04 CLOSED                                              |

### Stage 4 — Per-attempt fresh Vault + occupancy + C

| Field           | Content                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| Preconditions   | Classifier + Vault metadata APIs available (EXISTING)                                        |
| Authorized work | Freshness loop before each write attempt; preflight informational only                       |
| Required tests  | Freshness suite (IMPL-REV-D-06); stale preflight cannot write; unavailable occupancy → abort |
| Exit criteria   | Tests prove stale batch-pass insufficient                                                    |
| Stop conditions | Skipping per-attempt proof; using `get` as exact-id                                          |
| Dependencies    | Stages 1–3 design; §7.0 REUSE                                                                |

### Stage 5 — Conditional NULL→live UPDATE

| Field           | Content                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Preconditions   | Stages 3–4                                                                                            |
| Authorized work | Conditional UPDATE + eligibility predicates; EXCHANGE only; Strategy B preserved; zero Vault mutation |
| Required tests  | Predicate / CAS / occupancy collision; 0-row idempotent skip                                          |
| Exit criteria   | Idempotent 0-row on retry; ineligible never LIVE                                                      |
| Stop conditions | Check-then-save without CAS; rewrite populated env                                                    |
| Dependencies    | Stages 3–4                                                                                            |

### Stage 6 — Per-row durable Security Audit

| Field           | Content                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Preconditions   | Stage 2 complete                                                                                                |
| Authorized work | Emit per disposition within parent Slice §13 floor; **mandatory** same-txn with UPDATE on normal path (§11.2.A) |
| Required tests  | Per-row audit integrity; same-txn rollback                                                                      |
| Exit criteria   | Updated + blocked durable; attribution canonical                                                                |
| Stop conditions | Secrets in payload; emit before catalog registration; success without durable audit                             |
| Dependencies    | Stages 2, 5                                                                                                     |

### Stage 7 — Operation-level summary

| Field           | Content                                                              |
| --------------- | -------------------------------------------------------------------- |
| Preconditions   | Stage 6 path exists                                                  |
| Authorized work | One `operation_summary` (+ counters) per run; parent §13 counter set |
| Required tests  | Summary + counter assertions; summary fail ⇒ run not successful      |
| Exit criteria   | Counters match parent §13 set                                        |
| Stop conditions | Silent omission of errors; second catalog type for summary           |
| Dependencies    | Stage 6                                                              |

### Stage 8 — Failure handling and forward-fix

| Field           | Content                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Preconditions   | Stages 5–7                                                                                                    |
| Authorized work | Matrix §11.1; §11.2.B in-process retry; §11.2.C operator (not E) for crash gaps; no auto LIVE→NULL; no outbox |
| Required tests  | Audit-fail-after-UPDATE; retry success; retry exhaust; HB fail; summary fail                                  |
| Exit criteria   | No silent success; HB fail stops subsequent writes                                                            |
| Stop conditions | Claiming success with unaudited updates; inventing outbox/queue                                               |
| Dependencies    | Stages 5–7                                                                                                    |

### Stage 9 — Residual counters / evidence for E (handoff only)

| Field           | Content                                                       |
| --------------- | ------------------------------------------------------------- |
| Preconditions   | Run completion                                                |
| Authorized work | Persist/emit counters + durable audits required by parent §13 |
| Required tests  | Counter taxonomy present                                      |
| Exit criteria   | D outputs available for **future** E                          |
| Stop conditions | **Merging E into D**; claiming PRE-01/FIV closure             |
| Dependencies    | Stages 7–8                                                    |

**Parallelization rule (IA §8):** Stage 2 may proceed early but **must not** emit before registration. Stages 4–8 are sequential per row. **Do not merge E into D.** **Do not invent a new max-window policy** (IMPL-REV-D-02 guidance only).

---

## 6. Mandatory technical invariants

### 6.1 Identity and Entry

- Canonical SYSTEM_JOB identity remains unchanged: `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill`.
- `Conn04SystemJobMigrationEntry` remains the **sole** trusted boundary.
- **No** second actor constructor or parallel trusted Entry.
- **No** external actor input / caller-controlled `actorId` / `actorKind` / `PrivilegedActorContext`.
- **No** public HTTP / DTO / cron / scheduler / Trading Runtime ingress.
- Preserve B-04 and module export walls (`ConnectionsModule` currently exports only `FivConn04APreflightService` — must not export B-04 / PORT / durable / Entry without separate justification).

### 6.2 Freshness and write safety

- Fresh exact-id Vault metadata **per attempt** (`list` + id equality).
- Fresh typed occupancy **per attempt**.
- Re-run C **per attempt** immediately before write decision.
- Conditional UPDATE only for eligible NULL environment rows.
- B-04 write authority inside the write transaction.
- Preserve Strategy B; **no Vault mutation**.
- FOR UPDATE optional (IMPL-REV-D-01); safety = CAS + conditional UPDATE + Strategy B.

### 6.3 Audit

- Event type exactly `connection.environment-backfill`.
- Per-row durable audit and `operation_summary`.
- **Mandatory** same-transaction UPDATE + per-row audit on the normal successful path.
- **No** success count without durable per-row audit.
- **No** second event type.
- **No** Prisma `actorKind` column.
- Payload floor = parent Slice Planning Package §13 (COND-DOC-01); forbidden secret-bearing fields.

### 6.4 Recovery

- Post-commit synchronous retry is **in-process only**.
- **No** automatic LIVE → NULL rollback after a committed UPDATE.
- Crash-window audit gaps require **operator reconciliation**.
- **E is not** audit-completeness reconciliation.
- Summary failure means the run is **not** successful.
- **No** outbox, pending-audit table, or retry queue.

### 6.5 Parent Slice acceptance anchors (D vs E)

**In-scope for Full-D (AC-D-01…07):** conditional UPDATE predicates; `vaultSecretId` unchanged; no rewrite of populated env; durable audit for updated/blocked; batch continues after skip/block; zero Vault mutations; migration exception not public API.

**Out of scope for Full-D (AC-E-01…05):** residual inventory closure; idempotent re-run claims as E duty; residual NULL fail-closed spot-checks as E; gate-release-after-inventory as E; PRE-01/FIV closure claims — all remain **E / later gates**.

---

## 7. Test and evidence plan

Built from ratified IA **§13**. **No tests are claimed passed** by this Kickoff package. Implementation has **not** started.

| Area                                          | Suites / evidence                                                                                               | Status at kickoff                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Entry identity boundary / no actor parameters | Expand `fiv-conn-04-d-system-job-migration-entry.spec.ts`; existing `fiv-conn-04-d-system-job-identity.spec.ts` | **NOT RUN for Full-D** (P-D-02 suites exist; Full-D expansion pending) |
| No second constructor                         | Source assert + Entry/module specs                                                                              | Pending                                                                |
| Nest export negatives                         | `conn04-migration-boundary.service.spec.ts` CONDITION-2 style; re-assert after module MODIFY                    | Pending                                                                |
| B-04 lease / write authority                  | B-04 / B-06 + Entry→boundary                                                                                    | Pending regression                                                     |
| Catalog admission / refuse-closed             | `security-audit.service.spec.ts` before/after type registration                                                 | Pending                                                                |
| Attribution                                   | `security-audit-attribution.spec.ts`                                                                            | Pending                                                                |
| Exact event type                              | Audit helper + classification specs for `connection.environment-backfill`                                       | Pending                                                                |
| Fresh Vault exact-id                          | Freshness suite / Entry-write specs (`list` + id)                                                               | Pending                                                                |
| Occupancy collision vs unavailable            | D loop: occupied→skip; unavailable→abort                                                                        | Pending                                                                |
| C reclassification per attempt                | Freshness + write specs                                                                                         | Pending                                                                |
| Conditional UPDATE / 0-row                    | Write-unit specs                                                                                                | Pending                                                                |
| Same-transaction audit rollback               | Write-unit: audit fail rolls back UPDATE                                                                        | Pending                                                                |
| In-process retry success                      | Forward-fix specs                                                                                               | Pending                                                                |
| Retry exhaustion / failed incomplete run      | Forward-fix specs                                                                                               | Pending                                                                |
| `operation_summary` failure                   | Summary fail ⇒ run not successful                                                                               | Pending                                                                |
| Heartbeat / lease expiry fail-closed          | Entry + B-04                                                                                                    | Pending                                                                |
| OPERATOR reclaim regression                   | `prisma-migration-gate.adapter.spec.ts`                                                                         | Pending regression                                                     |
| A/B/C regression suites                       | A preflight, C classifier, B-05, B-06                                                                           | Pending regression                                                     |
| TypeScript / API suites                       | Project `tsc` + relevant `apps/api` vitest                                                                      | Pending                                                                |

Filenames for new specs may be colocated equivalently if inventory purpose is met (IA §13 note).

---

## 8. Stop conditions and change control

Stop Kickoff Review acceptance and/or stop any subsequent implementation if:

1. IA package SHA-256 or ratification Decision ID / path mismatch.
2. Second SYSTEM_JOB constructor or parallel trusted Entry.
3. External actor ingress or caller-supplied privileged context.
4. Public API / cron / scheduler / Trading Runtime path for D.
5. Catalog emission before coordinated registration.
6. Missing fresh Vault / occupancy / C evidence on a write attempt.
7. B-04 authority or lease loss (CAS miss / fence / HB fail) ignored.
8. Audit failure treated as silent success; success without durable per-row audit.
9. Out-of-inventory file creation (unless classified SCOPE CHANGE and separately authorized).
10. Changes that weaken COND-IA-01…06, COND-DOC-01, or IMPL-REV-D-01…06.
11. Need for a new event type, outbox, pending-audit mechanism, or Prisma schema change.
12. Any attempt to merge E into D.
13. Production activation / live capital / FIV PASS under this Kickoff alone.
14. Working-tree destructive ops (reset/stash/clean/broad checkout) that discard protected dirty state.

**Change control:** Any scope expansion requires **separate Product Owner authority**. Kickoff Review may add conditions; it may not invent a broader inventory.

---

## 9. Kickoff review requirements

An **independent Kickoff Review** (separate artifact / act from this preparation) must check:

| Check                    | Focus                                                                          |
| ------------------------ | ------------------------------------------------------------------------------ |
| Authorization integrity  | D-CONN04-FULL-D-IA grant language and exclusions                               |
| Hash binding             | Current IA package SHA-256 vs ratification                                     |
| Scope and file inventory | Exact match to IA §7; no silent adds                                           |
| Dependency readiness     | P-D-02 Entry/B-04; Vault list; C; audit txn architecture; catalog still absent |
| Architecture consistency | COND-IA-06 shape; Stages 1–9; Option A only                                    |
| Test plan completeness   | §7 matrix covers IA §13 + AC-D anchors                                         |
| Failure and recovery     | §11.1 / §11.2 + IA-REV-03 limitation preserved                                 |
| Repository baseline      | Dirty/untracked protection; empty index; no hidden coding                      |
| No hidden implementation | Diff limited to this Kickoff doc for the preparation act                       |

**Required Kickoff Review verdict (to be issued separately — not prefilled here):**

```text
PASS | PASS WITH CONDITIONS | BLOCKED
```

Until that verdict is recorded, status remains:

```text
IMPLEMENTATION KICKOFF: PREPARED — PENDING INDEPENDENT KICKOFF REVIEW
IMPLEMENTATION EXECUTION: NOT STARTED
```

---

## 10. Unresolved dependencies and conditions (for Kickoff Review)

| ID   | Item                                                                                          | Nature                      | Blocks coding start?                                                                                         |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| U-01 | Independent Kickoff Review verdict not yet issued                                             | Gate                        | **YES** — until PASS / PASS WITH CONDITIONS                                                                  |
| U-02 | Stage 1 design note (Vault `list` actor wiring + Entry method surface)                        | Planned Stage 1 deliverable | **YES** as Stage 1 exit before substantive Stages 2–8 coding claims (may be same delivery wave if sequenced) |
| U-03 | Catalog still lacks `connection.environment-backfill`                                         | Expected; Stage 2 work      | Expected — not a contradiction                                                                               |
| U-04 | Full-D write/audit loop absent in code                                                        | Expected; Stages 4–8        | Expected                                                                                                     |
| U-05 | IA-REV-03 crash-window limitation                                                             | Accepted limitation         | **No** — must remain explicit; not “resolved” by inventing outbox                                            |
| U-06 | Deferred details (exact payload wiring within §13 floor; method synonym; optional FOR UPDATE) | IA §15 DEFERRED DETAIL      | **No** if within floor; stop if inventing beyond floor                                                       |
| U-07 | Pre-existing dirty `connections.module.ts` and related specs                                  | Working-tree hygiene        | Kickoff Review must ensure Full-D MODIFY does not silently mix unrelated dirty intent                        |

---

## 11. Explicit pending state

```text
FULL-D IMPLEMENTATION AUTHORIZATION: GRANTED WITH AMENDMENTS
IMPLEMENTATION KICKOFF: PREPARED — PENDING INDEPENDENT KICKOFF REVIEW
IMPLEMENTATION EXECUTION: NOT STARTED
FIV-CONN-04-E: NOT AUTHORIZED
FULL-D BACKFILL EXECUTION: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF FIV-CONN-04-D IMPLEMENTATION KICKOFF PACKAGE**
