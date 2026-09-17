# FIV-CONN-04 Slice Planning Package

**Document:** FIV-CONN-04 LIVE Environment Backfill / Migration — Slice Planning Package  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Senior Staff Engineer / Architect (implementation-ready planning under Product Owner + Chief Architect governance)  
**Nature:** **SLICE PLANNING ONLY.** Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** create migrations, mutate Prisma schema, mutate Connections/Vault/credentials, perform LIVE backfill, or authorize FIV/C7/venue I/O/capital.

**Latest synchronized commit (planning baseline):** `3c467b31e3fbfb4d99ec79b11a7858dedc22d965`  
**HEAD must remain equal to `origin/main`.**

```text
SLICE PLANNING = READY FOR PO REVIEW

Implementation:                 NOT PERFORMED
LIVE backfill:                  NOT PERFORMED
External I/O:                   ZERO
FIV:                            NOT PERFORMED
Capital:                        ZERO
C7:                             DENY-ALL
allowRealVenueIo:               FALSE
Vault:                          NOT MODIFIED
Credentials:                    NOT MODIFIED
Database data:                  NOT MODIFIED
Schema / migrations:            NOT MODIFIED / NOT CREATED
Protected leftovers:            UNTOUCHED
Slice Approval:                 NOT GRANTED
Implementation authorization:   NOT GRANTED
Next gate:                      FIV-CONN-04 PO SLICE REVIEW / SLICE APPROVAL
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Planning Verdict

```text
SLICE PLANNING = READY FOR PO REVIEW
```

**Rationale**

- D-CONN-04-01…10 are frozen and are not reopened.
- Architecture/Security Confirmation = **PASS WITH CONDITIONS** (C-01…C-06).
- This package resolves C-01…C-06 as explicit implementation obligations with acceptance criteria.
- No blocking architectural or governance defect remains for planning completeness.
- This artifact does **not** claim Slice Approval, implementation authorization, FIV authorization, or LIVE backfill completion.

---

## 2. Governance Baseline

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Parent Planning Package | [`v3-l02-fiv-conn-04-planning-package.md`](./v3-l02-fiv-conn-04-planning-package.md) | COMPLETE |
| Planning Review | [`v3-l02-fiv-conn-04-planning-review.md`](./v3-l02-fiv-conn-04-planning-review.md) | PASS WITH REQUIRED PO DECISIONS |
| PO/Governance Decision Support | [`v3-l02-fiv-conn-04-po-governance-decision-support.md`](./v3-l02-fiv-conn-04-po-governance-decision-support.md) | COMPLETE |
| PO/Governance Decision Freeze | [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md) | GRANTED — D-CONN-04-01…10 FROZEN |
| Architecture/Security Confirmation | [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md) | PASS WITH CONDITIONS |
| Repository baseline | `3c467b31e3fbfb4d99ec79b11a7858dedc22d965` | `HEAD == origin/main` |

### Closed / frozen parents (not reopened)

```text
CLOSED:   FIV-CRED-01, FIV-CONN-01, FIV-CONN-02, FIV-CONN-03
FROZEN:   D-CRED-02-01…14, D-CONN-03-01…05, D-CONN-04-01…10
NOT CLOSED: FIV-PRE-01
NOT AUTHORIZED: FIV / C7 / venue I/O / capital
```

### Slice ladder

```text
CLOSED:   FIV-CRED-01 → FIV-CONN-01 → FIV-CONN-02 → FIV-CONN-03
CURRENT:  FIV-CONN-04 SLICE PLANNING  ← THIS ARTIFACT
FUTURE:   Slice Approval → Implementation Authorization → Implementation → PO Review → Closure
          (then FIV-CONN-05 / PRE-01 gates as independently governed)
```

---

## 3. Frozen Decisions

Do **not** reinterpret or modify these decisions.

| ID | Frozen choice | Binding summary |
| -- | ------------- | --------------- |
| **D-CONN-04-01 = A** | Vault-proven LIVE only | LIVE only when exact `vaultSecretId` resolves to `SecretPurpose.Trading` or `SecretPurpose.TradingLive` in the same workspace. Metadata alone insufficient. |
| **D-CONN-04-02 = A** | Ambiguous → NULL + fail closed | Audit-only disposition allowed. No runtime waiver/bypass. |
| **D-CONN-04-03 = A** | Skip/quarantine mismatch; continue | Mismatched rows skipped/audited; eligible batch continues. |
| **D-CONN-04-04 = A** | Skip defective bindings | Missing/dangling/revoked/invalid/workspace-mismatched never auto-LIVE. |
| **D-CONN-04-05 = A** | Strategy B prevention only | Colliding rows skipped/reported. No cleanup/delete/merge/substitution. |
| **D-CONN-04-06 = C** | Residual NULL policy | NON-EXCHANGE NULL allowed/normal. EXCHANGE NULL may remain documented residual and fail-closed. NULL never means LIVE. |
| **D-CONN-04-07 = A** | Keep nullable | Do **not** enforce NOT NULL in FIV-CONN-04. |
| **D-CONN-04-08 = B** | Write gate deny set | During backfill: deny credential store/replace/revoke + EXCHANGE create. |
| **D-CONN-04-09 = B** | Audit depth | Required security fields/counters **plus** durable Security Audit events for updated/blocked rows. No secrets. |
| **D-CONN-04-10 = B** | PRE-01 coupling | PRE-01 may proceed if specific Binance Testnet path is coherent; unrelated residual NULL non-blocking. |

### Parent ownership that remains binding

| Decision | Role for CONN-04 |
| -------- | ---------------- |
| **D-CRED-02-04** | Unambiguous LIVE backfill; ambiguous ≠ auto-LIVE; pre-audit; zero Vault mutation |
| **D-CRED-02-05** | Migration sequence residual ownership (Strategy B already applied in CONN-02) |
| **D-CRED-02-09** | Environment immutable after create — CONN-04 needs explicit migration-time exception only |
| **D-CRED-02-12** | Write serialization during migration critical section |
| **D-CONN-03-03** | EXCHANGE + NULL → FAIL CLOSED; NULL ≠ LIVE |

---

## 4. Architecture/Security Conditions C-01…C-06

Architecture/Security Confirmation identified C-01…C-06 as conditions for Slice Planning / Implementation. This package **disposes** each condition as a concrete design obligation.

| ID | Condition | Disposition in this Slice Plan |
| -- | --------- | ------------------------------ |
| **C-01** | Write gate | §11 Write-gate design + slice **04-B**. Deny store/replace/revoke + EXCHANGE create; single-runner; acquire/release; failure/recovery. |
| **C-02** | Migration-time environment exception | §10 Conditional UPDATE + §24 Implementation boundaries. Exception is write-window-only, not a public API, not a Model C/C7/FIV bypass. |
| **C-03** | Classifier / UPDATE | §9 Classification algorithm + §10 Conditional UPDATE. Exact 10-step semantics, transaction boundaries, race behavior. |
| **C-04** | Audit events | §13 Audit model. Distinguishes updated LIVE, blocked classes, skipped, operation summary; safe metadata only. |
| **C-05** | Target preflight | §14 Preflight design + slice **04-A**. Mandatory read-only inventory; defective rows do not halt eligible updates. |
| **C-06** | Residual inventory | §15 Residual inventory design + slice **04-E**. Exact final counters; residual EXCHANGE NULL allowed and fail-closed. |

```text
C-01…C-06: ADDRESSED BY SLICE PLAN (design-complete)
C-01…C-06: NOT YET IMPLEMENTED (implementation not authorized)
```

---

## 5. Exact Scope

### In scope (future authorized implementation)

```text
- Connections table environment classification residual work
- EXCHANGE Connections with environment IS NULL that require LIVE classification
- Vault-proven LIVE promotion only (Trading / TradingLive)
- Read-only target preflight inventory
- Application write gate for credential lifecycle + EXCHANGE create during window
- Vault metadata purpose lookup by exact vaultSecretId (no secret payload)
- Conditional Connection.environment NULL → 'live' UPDATE
- Strategy B collision prevention before write
- Durable Security Audit + run counters
- Post-backfill residual inventory / verification
- Focused offline tests for classifier, gate, idempotency, audit shapes
```

### Explicitly out of scope

See §25. Highlights:

```text
TESTNET population, DEMO, NOTIFICATION connections, unrelated providers/types,
Vault secret mutation, credential migration/replace/cleanup, duplicate cleanup,
LIVE↔TESTNET changes, C7, live execution, Binance I/O, FIV, NOT NULL enforcement.
```

Do **not** broaden scope.

---

## 6. Target Population

### Eligibility population (write candidates)

A Connection is in the **target write population** only if **all** hold:

1. `connectionType = 'EXCHANGE'`
2. `environment IS NULL`
3. `vaultSecretId IS NOT NULL`
4. Exact Vault metadata for that `vaultSecretId` exists in the **same** `workspaceId`
5. Vault purpose ∈ `{ trading, trading_live }` (`SecretPurpose.Trading` \| `SecretPurpose.TradingLive`)
6. Credential not revoked / not dangling / not invalid-purpose / not workspace-mismatched
7. Projected assignment `environment = 'live'` would **not** collide under Strategy B
8. Row not already populated (`live` / `testnet`)

### Scanned but non-write populations (inventory only)

| Class | Action |
| ----- | ------ |
| NON-EXCHANGE (`NOTIFICATION`, `AI`, …) with NULL env | Inventory as out-of-scope / normal residual |
| EXCHANGE + NULL + metadata-only (no `vaultSecretId`) | Ambiguous / defective → remain NULL, audit |
| EXCHANGE + NULL + TESTNET purpose | Non-LIVE → skip; do **not** write LIVE; do **not** populate TESTNET in CONN-04 |
| EXCHANGE + NULL + DEMO purpose | Deferred / non-LIVE → skip |
| Already `environment = 'live'` | Skip (idempotent) |
| Already `environment = 'testnet'` | Skip forever for LIVE path |
| Strategy B collision projected | Skip / quarantine / report |
| Revoked / dangling / workspace mismatch | Skip / quarantine / report |

### Historical local snapshot (planning evidence only — NOT production certification)

Previously verified local inventory (must **not** be used as production proof):

```text
13 Connections total; all environment NULL
4 EXCHANGE NULL
1 credentialed BINANCE with LIVE-class Vault purpose "trading"
0 populated LIVE; 0 populated TESTNET
3 metadata-only ambiguous
0 local purpose conflicts
9 NOTIFICATION NULL (outside intended backfill scope)
```

**Mandatory:** every authorized run must execute a **fresh runtime preflight** on the target environment (§14). Historical counts are illustrative only.

---

## 7. Slice Decomposition

Proposed and frozen sequence for future authorized implementation (refinement only if repository evidence requires justification; none found):

| Sub-slice | Objective |
| --------- | --------- |
| **FIV-CONN-04-A** | Target inventory + read-only preflight |
| **FIV-CONN-04-B** | Write-gate / lifecycle mutation lock |
| **FIV-CONN-04-C** | Vault-proven LIVE classifier |
| **FIV-CONN-04-D** | Conditional environment UPDATE + durable audit |
| **FIV-CONN-04-E** | Post-backfill residual inventory + verification |

Dependency order: **A → B → C → D → E** (C may be unit-developed in parallel with B after A contract is fixed; D requires B+C; E requires D).

### 7.1 FIV-CONN-04-A — Target inventory + read-only preflight

| Attribute | Definition |
| --------- | ---------- |
| **Objective** | Produce a complete, non-mutating inventory and classification of the target DB before any UPDATE. |
| **Likely files/modules** | New: `apps/api/src/modules/connections/fiv-conn-04-preflight.ts` (or equivalent); optional `apps/api/scripts/fiv-conn-04-preflight.ts`; reads via Prisma + Vault metadata ports; reuse `tradingEnvironmentFromPurpose`. Specs: `*.preflight.spec.ts`. |
| **Data flow** | Scan `connection_records` → join Vault metadata by exact `vaultSecretId` → classify → emit report object (no writes). |
| **Read/write** | **Read-only.** Zero Connection/Vault/credential mutations. |
| **Transactions** | Read-only queries; no write transaction. |
| **Concurrency** | Safe concurrent with normal ops; must be re-run immediately before write window. |
| **Failure** | Vault metadata unavailable → fail preflight closed (do not proceed to D). DB read failure → abort. |
| **Security** | Workspace-scoped reporting; opaque ids only; no secret payloads. |
| **Tests** | Offline fixtures for EXCHANGE/NON-EXCHANGE/NULL/credentialed/dangling/collision projections. |
| **Acceptance** | See §23 AC-A-\*. |
| **Rollback** | N/A (no mutation). |
| **Dependencies** | Closed CONN-01/02/03; Vault metadata read ports. |
| **Non-scope** | No UPDATE; no write gate; no TESTNET fill. |

### 7.2 FIV-CONN-04-B — Write-gate / lifecycle mutation lock

| Attribute | Definition |
| --------- | ---------- |
| **Objective** | Enforce D-CONN-04-08 / D-CRED-02-12 during the authorized backfill window. |
| **Likely files/modules** | `connections.service.ts` (`create`, `storeCredentials`, `replaceCredentials`, `revoke`); new gate module e.g. `connection-migration-write-gate.ts`; `connections.module.ts` wiring; specs asserting deny behavior. |
| **Data flow** | Gate ON at window start → deny listed mutations → single-runner holds lock token → gate OFF after E verification or controlled abort. |
| **Read/write** | Gate state is process/app config or durable flag (implementation choice); Connection data otherwise unchanged by B alone. |
| **Transactions** | Gate acquisition should be exclusive (single-runner). Prefer DB advisory/row lock **plus** application deny hooks; advisory alone insufficient. |
| **Concurrency** | Single backfill runner. Concurrent credential/create writers receive explicit deny. |
| **Failure** | Fail to acquire → do not start D. Crash while ON → restart must re-acquire or fail closed until operator clears. |
| **Security** | Deny set exactly: store, replace, revoke, EXCHANGE create. No public env mutation API introduced. |
| **Tests** | Unit/integration: each denied path; non-denied paths (e.g. rename displayName, NON-EXCHANGE create if allowed) remain coherent. |
| **Acceptance** | See §23 AC-B-\*. |
| **Rollback / forward-fix** | Release gate; never auto-undo environments. |
| **Dependencies** | A report reviewed/accepted for target window. |
| **Non-scope** | Broader freeze of rename/status (not required by D-CONN-04-08 = B). |

### 7.3 FIV-CONN-04-C — Vault-proven LIVE classifier

| Attribute | Definition |
| --------- | ---------- |
| **Objective** | Deterministic pure/classification service implementing D-CONN-04-01…05. |
| **Likely files/modules** | New: `fiv-conn-04-live-classifier.ts` (+ types for disposition codes); reuse `trading-credential-environment.ts`, `secret-purpose.ts`; Strategy B projection query helpers in connections module. |
| **Data flow** | Connection row + Vault metadata + collision projection → disposition enum + evidence class. |
| **Read/write** | Read-only classification (no UPDATE in C). |
| **Transactions** | N/A for pure classify; collision check uses consistent read snapshot. |
| **Concurrency** | Classification results are stale-sensitive; D rechecks before UPDATE. |
| **Failure** | Missing Vault metadata → defective disposition; never LIVE. |
| **Security** | Exact-id only; workspace match required; no sibling/provider lookup. |
| **Tests** | Full matrix in §19. |
| **Acceptance** | See §23 AC-C-\*. |
| **Rollback** | N/A. |
| **Dependencies** | Frozen decisions; ENV1 helpers. |
| **Non-scope** | No TESTNET classifier write path; DEMO deferred. |

### 7.4 FIV-CONN-04-D — Conditional environment UPDATE + durable audit

| Attribute | Definition |
| --------- | ---------- |
| **Objective** | Apply NULL→`live` only for eligible rows under write gate; emit durable Security Audit. |
| **Likely files/modules** | New backfill runner service/script under `modules/connections/` and/or `apps/api/scripts/`; Prisma UPDATE; `security-audit-classification.ts` catalog extension; new `connection-environment-backfill-audit.ts` (or outcomes under `connection.lifecycle` / new classified type); attribution rules. |
| **Data flow** | For each eligible candidate: recheck → conditional UPDATE → audit updated/blocked → continue batch. |
| **Read/write** | Writes **only** `connection_records.environment` (`NULL`→`live`) and audit records. Never `vaultSecretId`, Vault secrets, purposes. |
| **Transactions** | Prefer **per-row** transaction: recheck + UPDATE + audit (or UPDATE then audit with compensating failure policy in §17). |
| **Concurrency** | Single-runner; Strategy B unique index final authority; P2002 → skip/quarantine that row. |
| **Failure** | See §17. Partial completion allowed; rerun idempotent. |
| **Security** | Migration-time exception only (C-02); no public PATCH env; no secrets in audit. |
| **Tests** | Conditional UPDATE predicates; audit event shapes; collision; concurrent race fixtures. |
| **Acceptance** | See §23 AC-D-\*. |
| **Forward-fix** | §18. No destructive rollback. |
| **Dependencies** | B gate ON; C classifier; A preflight. |
| **Non-scope** | NOT NULL; TESTNET fill; Vault mutation. |

### 7.5 FIV-CONN-04-E — Post-backfill residual inventory + verification

| Attribute | Definition |
| --------- | ---------- |
| **Objective** | Prove resulting state, emit residual inventory (C-06), verify idempotent re-run is no-op, release gate. |
| **Likely files/modules** | Reuse preflight inventory with post-mode; verification assertions in runner; operator report artifact (non-secret). |
| **Data flow** | Re-scan → compare expected dispositions → emit final counters → optional dry-run second pass. |
| **Read/write** | Read-only verification preferred; second pass UPDATE must be zero rows. |
| **Transactions** | Read-only. |
| **Concurrency** | Gate remains ON until E succeeds or operator aborts. |
| **Failure** | Verification mismatch → do not claim closure; keep residuals documented; forward-fix under governance. |
| **Security** | Residual EXCHANGE NULL remain fail-closed; no waiver flag. |
| **Tests** | Residual counter schema; idempotent second pass. |
| **Acceptance** | See §23 AC-E-\*. |
| **Rollback** | N/A. |
| **Dependencies** | D completed (or explicitly aborted with inventory). |
| **Non-scope** | FIV-PRE-01 closure; NOT NULL. |

---

## 8. Detailed Data Flow

```text
┌──────────────────────────────────────────────────────────────────┐
│ 04-A PREFLIGHT (read-only)                                       │
│  connection_records ──► Vault metadata (id/purpose/ws/state)     │
│                      ──► Strategy B collision projection         │
│                      ──► PreflightReport (no mutations)          │
└───────────────────────────────┬──────────────────────────────────┘
                                │ operator/governance window open
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 04-B WRITE GATE ON                                               │
│  deny: store / replace / revoke / EXCHANGE create                │
│  acquire: single-runner lease                                    │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 04-C CLASSIFY each EXCHANGE NULL row                             │
│  evidence: exact vaultSecretId → purpose ∈ {Trading,TradingLive} │
│  dispositions: ELIGIBLE_LIVE | AMBIGUOUS | DEFECTIVE |           │
│                 MISMATCH | COLLISION | OUT_OF_SCOPE | SKIP_*     │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 04-D PER ELIGIBLE ROW (transactional)                            │
│  1. re-read Connection                                           │
│  2. confirm still NULL + same vaultSecretId + EXCHANGE           │
│  3. re-fetch Vault purpose metadata                              │
│  4. re-check Strategy B projection                               │
│  5. UPDATE environment='live' WHERE predicates hold              │
│  6. durable Security Audit (updated or blocked)                  │
│  7. continue batch (D-CONN-04-03/05)                             │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ 04-E RESIDUAL INVENTORY + VERIFY                                 │
│  counters + residual NULL classes + idempotent dry re-run        │
│  WRITE GATE OFF                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Model C preservation:** Vault purpose remains runtime SoT; Connection.environment becomes populated constraint/audit context for updated rows only. Use-path CONN-03 assertions remain unchanged.

---

## 9. Classification Algorithm

Exact algorithm (C-03). Inputs: Connection row, Vault metadata for exact `vaultSecretId` (if present), Strategy B occupancy for `(workspaceId, provider, 'live')`.

```text
classify(connection, vaultMeta | null, liveSlotOccupancy):

  IF connection.connectionType ≠ 'EXCHANGE'
    → OUT_OF_SCOPE_NON_EXCHANGE   // remain NULL; inventory only

  IF connection.environment = 'live'
    → SKIP_ALREADY_LIVE

  IF connection.environment = 'testnet'
    → SKIP_ALREADY_TESTNET        // never LIVE-ify

  IF connection.environment IS NOT NULL
    → SKIP_ALREADY_POPULATED

  // environment IS NULL + EXCHANGE from here

  IF connection.vaultSecretId IS NULL
    → BLOCKED_MISSING_CREDENTIAL  // D-CONN-04-04; ambiguous/defective

  IF vaultMeta IS NULL
    → BLOCKED_DANGLING_CREDENTIAL

  IF vaultMeta.workspaceId ≠ connection.workspaceId
    → BLOCKED_WORKSPACE_MISMATCH

  IF vaultMeta revoked OR invalid state for use
    → BLOCKED_REVOKED_OR_INVALID

  LET envFromPurpose = tradingEnvironmentFromPurpose(vaultMeta.purpose)

  IF envFromPurpose IS NULL
    → BLOCKED_INVALID_PURPOSE     // non-trading purpose on EXCHANGE

  IF envFromPurpose = 'demo'
    → BLOCKED_DEMO_DEFERRED       // never LIVE in CONN-04

  IF envFromPurpose = 'testnet'
    → BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE
       // CONN-04 does not write TESTNET; leave NULL residual

  IF envFromPurpose ≠ 'live'
    → BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE

  // LIVE-class purpose only (Trading / TradingLive)

  IF liveSlotOccupancy has another credentialed non-revoked EXCHANGE
     with environment='live' for same (workspaceId, provider)
     AND that row.id ≠ connection.id
    → BLOCKED_STRATEGY_B_COLLISION

  IF connection.status = 'REVOKED'   // even if Strategy B excludes REVOKED
    → BLOCKED_REVOKED_OR_INVALID    // D-CONN-04-04 never auto-LIVE

  → ELIGIBLE_LIVE
```

### Purpose → LIVE mapping (CONN-04 write path)

| Vault purpose | `tradingEnvironmentFromPurpose` | CONN-04 action |
| ------------- | --------------------------------- | -------------- |
| `trading` | `live` | May UPDATE NULL→`live` if other gates pass |
| `trading_live` | `live` | May UPDATE NULL→`live` if other gates pass |
| `trading_testnet` | `testnet` | **Must not** produce LIVE; leave NULL (TESTNET fill out of scope) |
| `trading_demo` | `demo` | Deferred; not LIVE |
| other / missing | null / N/A | Block / skip |

**Hard rules**

- Provider/type/status alone never yields `ELIGIBLE_LIVE`.
- No sibling credential substitution.
- No client-controlled purpose.
- A TESTNET purpose must **not** produce LIVE.

---

## 10. Conditional UPDATE Semantics

### Authorized write shape

```sql
UPDATE connection_records
SET environment = 'live'
    -- updated_at via ORM if applicable
WHERE id = :connectionId
  AND workspace_id = :workspaceId
  AND connection_type = 'EXCHANGE'
  AND environment IS NULL
  AND vault_secret_id IS NOT DISTINCT FROM :expectedVaultSecretId;
```

If `rowCount = 0` → treat as `SKIPPED_NO_LONGER_ELIGIBLE` (race / concurrent change / already processed). Do **not** force-write.

### Pre-UPDATE recheck (mandatory inside same transaction when possible)

1. Read target Connection (`FOR UPDATE` preferred).
2. Confirm `environment IS NULL`.
3. Confirm provider/type eligible (`EXCHANGE`).
4. Confirm exact `vaultSecretId` unchanged vs classification snapshot.
5. Obtain Vault purpose metadata again (metadata only).
6. Confirm LIVE-class purpose.
7. Reject/skip ambiguous, invalid, mismatched, revoked, dangling, missing, cross-workspace.
8. Recheck Strategy B collision projection.
9. UPDATE only when predicates hold.
10. Never rewrite an already-populated environment.

### Migration-time exception boundary (C-02)

```text
ALLOWED:
  Privileged migration runner UPDATE of Connection.environment
  NULL → 'live' for Vault-proven eligible rows
  only while write gate is ON
  only for FIV-CONN-04 authorized window

FORBIDDEN (exception MUST NOT become):
  - runtime waiver for EXCHANGE NULL use
  - general public/API environment mutation capability
  - Model C bypass
  - live trading authorization
  - C7 enablement / allowRealVenueIo=true
  - credential promotion without Vault proof
  - Vault purpose mutation
```

After window close: application immutability (D-CRED-02-09) remains intact; no public env PATCH.

### Transaction boundaries

| Unit | Boundary |
| ---- | -------- |
| Preflight (A) | No write txn |
| Gate acquire (B) | Exclusive lease txn/flag |
| Per eligible row (D) | Prefer one txn: lock row → recheck → UPDATE → audit write |
| Batch | Continue on per-row skip/block (D-CONN-04-03/05); do not abort entire batch on single defective row |
| Uniqueness conflict | Catch P2002 / unique violation → block that row; continue |
| Post inventory (E) | Read-only |

### Race behavior

| Race | Behavior |
| ---- | -------- |
| Concurrent credential store (should be denied by gate) | If observed, skip row / abort runner closed + report |
| Concurrent EXCHANGE create live sibling | Denied by gate; DB unique is backstop |
| Row env set by another process | Conditional UPDATE no-ops; audit `SKIPPED_NO_LONGER_ELIGIBLE` |
| vaultSecretId changed mid-flight | Predicate fails; skip |
| Double runner | Second runner fails lease acquisition |

---

## 11. Write-Gate Design (C-01)

### Deny set (frozen D-CONN-04-08 = B)

During backfill operation window:

| Operation | Gate behavior |
| --------- | ------------- |
| Credential **store** | **DENIED** |
| Credential **replace** | **DENIED** |
| Credential **revoke** | **DENIED** |
| **EXCHANGE** Connection **create** | **DENIED** |

Hook points (repository-confirmed entry methods):

- `ConnectionsService.storeCredentials`
- `ConnectionsService.replaceCredentials`
- `ConnectionsService.revoke`
- `ConnectionsService.create` when `connectionType === 'EXCHANGE'`

### Single-runner semantics

```text
1. Attempt acquireMigrationLease(slice='FIV-CONN-04', owner=runnerId, ttl=...)
2. If not acquired → exit non-zero; do not classify/write
3. Set application writeGate = ON (deny hooks active)
4. Run D (and E)
5. Release: writeGate = OFF; release lease
```

Lease must be exclusive. Implementation may use a durable DB row / advisory lock **in addition to** deny hooks. **Advisory locks alone are insufficient** (D-CRED-02-12).

### Acquisition / release

| Event | Behavior |
| ----- | -------- |
| Normal success | E verification pass → release gate + lease |
| Controlled abort | Inventory residuals → release gate + lease |
| Process crash | Lease TTL expiry or operator clear; restart must not write without re-acquire + fresh preflight |
| Partial D completion | Leave committed UPDATEs; release only after E inventory documents residuals; rerun is idempotent |

### Failure / recovery

| Failure | Recovery |
| ------- | -------- |
| Deny-hook misconfiguration | Do not start D; fix forward |
| Lease stolen / expired mid-run | Stop writes; re-preflight; re-acquire |
| Gate OFF while D running | Treat as hard fault; stop |

Gate applies **only** to the authorized migration/backfill window — not a permanent API capability freeze beyond the window.

---

## 12. Transaction / Concurrency Model

```text
Authorities (ordered):
  1. Application write gate (primary race reduction)
  2. Per-row conditional UPDATE predicates
  3. Strategy B partial unique index (final DB authority)
```

Strategy B (already implemented — do not redesign):

```sql
CREATE UNIQUE INDEX connection_records_ws_provider_env_credentialed_uidx
ON connection_records (workspace_id, provider, environment)
WHERE vault_secret_id IS NOT NULL
  AND status <> 'REVOKED'
  AND environment IS NOT NULL
  AND connection_type = 'EXCHANGE';
```

Concurrency principles:

- One backfill runner.
- Eligible rows continue when others are blocked.
- Never delete/merge/rebind on collision.
- Reads (validate/handshake) may continue; EXCHANGE NULL remains fail-closed under CONN-03.

---

## 13. Audit Model (C-04 / D-CONN-04-09 = B)

### Required run counters

`scanned`, `eligible`, `updated`, `blocked`, `skipped`, `ambiguous`, `defective`, `collision`, `errors`, `already_populated`, `non_exchange_null`.

### Durable Security Audit events

Reuse Security Audit infrastructure (`SecurityAuditService`, classified catalog, sensitive-key rejection). Prefer a dedicated classified event type (recommended):

```text
connection.environment-backfill
  eventClass: connection
```

Alternatively, extend `connection.lifecycle` with CONN-04 outcomes **only if** catalog/attribution rules remain coherent. Slice implementation must register the chosen type in `security-audit-classification.ts` + attribution rules.

### Outcome taxonomy (minimum)

| Outcome code | Meaning |
| ------------ | ------- |
| `updated_live` | NULL→`live` committed |
| `blocked_ambiguity` | Metadata-only / insufficient evidence |
| `blocked_missing_or_dangling` | Missing or dangling `vaultSecretId` |
| `blocked_revoked_or_invalid` | Revoked / invalid credential/purpose |
| `blocked_workspace_mismatch` | Vault workspace ≠ Connection workspace |
| `blocked_purpose_env_mismatch` | Purpose not LIVE-class for LIVE write |
| `blocked_strategy_b_collision` | Would violate Strategy B |
| `skipped_no_longer_eligible` | Recheck failed / already processed |
| `operation_summary` | End-of-run aggregate (may be one summary event + counters) |

### Safe payload fields (allowed)

```text
connectionId, workspaceId, provider, connectionType,
previousEnvironment, newEnvironment,
evidenceClass, vaultSecretId (opaque), vaultPurpose (enum string),
actorId / systemJobId, correlationId, timestamp,
outcome, reasonCode
```

### Forbidden

```text
API keys, tokens, ciphertext, decrypted payloads, wrapping keys,
raw Vault secret bodies, client-supplied purpose as authority
```

Do **not** invent a parallel secret-bearing logger.

---

## 14. Preflight Design (C-05)

### Mandatory before any UPDATE

Preflight inventories and classifies:

| Inventory dimension | Required |
| ------------------- | -------- |
| Target Connections (total) | Yes |
| EXCHANGE vs NON-EXCHANGE | Yes |
| Current environment (`NULL`/`live`/`testnet`) | Yes |
| `vaultSecretId` presence | Yes |
| Vault purpose (metadata) | Yes for credentialed rows |
| Workspace binding match | Yes |
| Revoked / dangling state | Yes |
| Strategy B collision risk for projected LIVE | Yes |
| Expected LIVE candidates | Yes |
| Expected residual NULL (by class) | Yes |
| Metadata-only ambiguity | Yes |

### Mutation policy

```text
Preflight MUST NOT mutate anything.
```

### Proceed policy (frozen)

```text
Eligible rows may proceed to UPDATE.
Defective / ambiguous / colliding rows are skipped/quarantined and reported.
Preflight detecting defective rows does NOT by itself block the eligible batch.
Preflight detecting Vault-unavailable / systemic read failure DOES block progression to D.
```

Fresh runtime preflight on the **target** environment is mandatory; local historical counts are non-authoritative.

---

## 15. Residual Inventory Design (C-06)

Final report after operation must include exact counts/sets:

| Bucket | Definition |
| ------ | ---------- |
| `updated_live` | Rows committed NULL→`live` |
| `already_populated` | Pre-existing `live`/`testnet` |
| `ambiguous_residual_null` | Insufficient Vault proof (e.g. metadata-only EXCHANGE) |
| `defective_residual_null` | Missing/dangling/revoked/invalid/workspace mismatch |
| `collision_residual_null` | Strategy B prevention skips |
| `non_exchange_null` | NOTIFICATION/AI/etc. NULL (normal) |
| `total_scanned` | All examined Connections |
| `total_eligible` | Classifier `ELIGIBLE_LIVE` at write time |
| `total_updated` | Successful UPDATEs |
| `total_blocked_or_skipped` | All non-update dispositions |
| `total_errors` | Hard failures |

```text
Residual EXCHANGE NULL is ALLOWED and MUST remain fail-closed (CONN-03).
NULL never means LIVE.
No waiver flag.
```

---

## 16. Idempotency

Restart-safe behavior:

| Requirement | Mechanism |
| ----------- | --------- |
| Do not rewrite populated environments | `WHERE environment IS NULL` |
| Do not replace `vaultSecretId` | UPDATE never touches credential fields |
| Do not reclassify LIVE as anything else | Skip already `live` |
| Skip already-processed rows | Conditional UPDATE + skip outcomes |
| Preserve audit integrity | Emit skip/blocked events; do not fabricate secret-bearing diffs |
| Handle concurrent changes | Recheck + rowCount=0 → `skipped_no_longer_eligible` |

### Expected failure modes

| Mode | Expected behavior |
| ---- | ----------------- |
| Process crash | Re-acquire gate; fresh preflight; rerun; already-`live` rows no-op |
| DB timeout | Retry per-row safely; no blanket rewrite |
| Concurrent writer | Gate deny; if slipped, conditional UPDATE/Strategy B protect |
| Uniqueness conflict | Skip/report collision; continue |
| Vault lookup failure | Block that row or abort run if systemic; never invent LIVE |
| Audit write failure | See §17 — do not claim success without durable audit for updated rows |

---

## 17. Failure Handling

| Failure | Handling |
| ------- | -------- |
| Classifier marks non-eligible | Skip + audit blocked reason; continue |
| Conditional UPDATE matches 0 rows | Skip `skipped_no_longer_eligible`; continue |
| Strategy B P2002 | Skip/report collision; continue |
| Per-row Vault metadata error | Skip/block that row; continue unless outage policy says abort |
| Systemic Vault outage | Abort D; keep gate policy coherent; no partial silent LIVE without evidence |
| Audit write fails after successful UPDATE | **Forward-fix:** retry audit; if unrecoverable, mark run `errors` and require operator reconciliation — do **not** auto-revert env to NULL |
| Gate contention | Fail closed; do not dual-run |
| Unexpected env already `testnet` | Never overwrite |

Partial batch completion is **allowed** and expected under D-CONN-04-03/05.

---

## 18. Forward-Fix Model

```text
NO destructive rollback:
  - no Vault rollback
  - no credential rollback
  - no automatic LIVE → NULL
  - no automatic LIVE → TESTNET
  - no deletion
  - no credential replacement
```

If an incorrect environment assignment is discovered:

1. Stop further automated env writes.
2. Preserve audit trail of the defective assignment.
3. Quarantine affected Connection IDs for governance review.
4. Correct via **explicit governed forward-fix** (separate authorization) — e.g. operator-approved remediation slice — **not** a silent general rewrite API.
5. Until fixed, Model C / CONN-03 continue to fail closed on purpose/env mismatch; do not add waiver.

This plan intentionally does **not** create a silent environment rewrite mechanism.

---

## 19. Test Strategy

Mandatory offline/read-only-during-planning matrix for future implementation. Tests must not perform venue I/O, FIV, or LIVE capital paths.

### LIVE classification

| Case | Expect |
| ---- | ------ |
| Purpose `Trading` | Eligible → UPDATE `live` |
| Purpose `TradingLive` | Eligible → UPDATE `live` |

### NON-LIVE

| Case | Expect |
| ---- | ------ |
| Purpose `TradingTestnet` | Not LIVE; no UPDATE to `live` |
| DEMO if represented | Deferred; not LIVE |

### Invalid / defective

| Case | Expect |
| ---- | ------ |
| Missing Vault record | Block dangling; remain NULL |
| Dangling `vaultSecretId` | Block; remain NULL |
| Revoked credential | Block; remain NULL |
| Invalid purpose | Block; remain NULL |
| Workspace mismatch | Block; remain NULL |
| Purpose/environment mismatch | Block; remain NULL |

### Data shapes

| Case | Expect |
| ---- | ------ |
| EXCHANGE NULL eligible | Update |
| NON-EXCHANGE NULL | Out of scope; unchanged |
| Already LIVE | Skip |
| Already TESTNET | Skip; never LIVE |
| Metadata-only EXCHANGE | Ambiguous residual NULL |
| Duplicate/collision | Skip/report; no cleanup |
| Concurrent update | Conditional no-op / safe skip |

### Security

| Case | Expect |
| ---- | ------ |
| Cross-workspace isolation | No cross-ws LIVE write |
| Cross-environment isolation | No TESTNET→LIVE |
| No sibling credential substitution | `vaultSecretId` unchanged |
| No provider-only lookup | Classifier refuses |
| No client-controlled purpose | Ignored/absent |
| No secret leakage | Audit payload sanitization |
| No runtime waiver | NULL still fail-closed on use path |
| C7 remains DENY-ALL | Untouched composition |

### Operational

| Case | Expect |
| ---- | ------ |
| Idempotent rerun | Second pass updates=0 |
| Crash/restart | Safe resume |
| Partial batch completion | Residuals inventoried |
| Audit failure | Documented error path |
| Vault unavailable | Fail closed progression rules |
| DB conflict | Collision handling |
| Write-gate contention | Second runner denied |

---

## 20. Security Regression Matrix

| ID | Control | Required proof |
| -- | ------- | -------------- |
| SR-01 | Workspace isolation | Update predicates + Vault ws match tests |
| SR-02 | Exact `vaultSecretId` binding | Unchanged before/after; no sibling select |
| SR-03 | Purpose isolation | TESTNET purpose ≠ LIVE write |
| SR-04 | Environment isolation | No LIVE↔TESTNET rewrite |
| SR-05 | Strategy B authority | Collision skip + unique index backstop |
| SR-06 | Defective bindings never auto-LIVE | D-CONN-04-04 cases |
| SR-07 | No Vault mutation | No store/replace/rotate/delete calls in runner |
| SR-08 | No secret leakage | Audit sensitive-key rejection |
| SR-09 | No runtime waiver | Residual NULL still denied on validate/handshake |
| SR-10 | Migration exception bounded | No public env PATCH; gate window-only |
| SR-11 | C7 DENY-ALL preserved | Composition untouched |
| SR-12 | `allowRealVenueIo=false` preserved | `execution-adapter.module.ts` unchanged by CONN-04 |
| SR-13 | No FIV / venue I/O | Runner performs zero Binance/Bybit/OKX calls |
| SR-14 | Client authority | No client purpose/env promotion |

---

## 21. FIV-PRE-01 Relationship

```text
FIV-CONN-04 does NOT close FIV-PRE-01 by itself.
FIV-CONN-04 does NOT authorize FIV.
FIV-CONN-04 does NOT create Testnet credentials.
FIV-CONN-04 does NOT call Binance.
```

Per **D-CONN-04-10 = B**:

- The specific Binance Testnet path may proceed when independently coherent under PRE-01’s own gates.
- Unrelated residual NULL Connections are **non-blocking** for PRE-01 if documented and fail-closed.
- CONN-04 residual EXCHANGE NULL must not be misread as LIVE or as PRE-01 completion.

Independent PRE-01 coherence still requires its own Connection `environment=testnet` + `TradingTestnet` binding + Model C — which is **out of CONN-04 write scope**.

---

## 22. Risks and Residuals

| ID | Risk | Severity | Mitigation in plan |
| -- | ---- | -------- | ------------------ |
| R-01 | Treating local inventory as production | High | Mandatory fresh preflight (04-A) |
| R-02 | Omitting write gate at implementation | High | 04-B acceptance blocking for D |
| R-03 | Broadening migration exception into API | High | C-02 boundary; no public env mutation |
| R-04 | Accidental TESTNET→LIVE | High | Classifier + skip already testnet |
| R-05 | Audit without durable events | Medium | D-CONN-04-09 = B; 04-D AC |
| R-06 | Misreading residual NULL as LIVE | Medium | Residual inventory + CONN-03 fail-closed |
| R-07 | Dual runners | High | Single-runner lease |
| R-08 | Scope bleed into CRED-04/05 / C7 / FIV | Medium | Explicit non-scope |
| R-09 | Attempting NOT NULL despite residuals | High | D-CONN-04-07 = A forbids in CONN-04 |
| R-10 | Collision cleanup temptation | Medium | D-CONN-04-05 = A prevention only |

Residuals after successful CONN-04 (expected/allowed):

- NON-EXCHANGE NULL
- Ambiguous/defective/collision EXCHANGE NULL (fail-closed)
- No NOT NULL constraint
- No TESTNET backfill from this slice

---

## 23. Acceptance Criteria for Each Slice

### 04-A

| ID | Criterion |
| -- | --------- |
| AC-A-01 | Fresh target inventory produced without mutations |
| AC-A-02 | EXCHANGE vs NON-EXCHANGE partitioned |
| AC-A-03 | Credentialed vs metadata-only identified |
| AC-A-04 | Vault purpose metadata joined by exact id only |
| AC-A-05 | Strategy B collision projections listed |
| AC-A-06 | Expected LIVE candidates and residual NULL classes enumerated |
| AC-A-07 | No secrets in report |

### 04-B

| ID | Criterion |
| -- | --------- |
| AC-B-01 | store/replace/revoke denied while gate ON |
| AC-B-02 | EXCHANGE create denied while gate ON |
| AC-B-03 | Single-runner lease enforced |
| AC-B-04 | Acquire/release/failure paths defined and tested |
| AC-B-05 | Gate does not permanently weaken normal APIs after release |

### 04-C

| ID | Criterion |
| -- | --------- |
| AC-C-01 | LIVE only for Trading/TradingLive |
| AC-C-02 | TradingTestnet never yields LIVE |
| AC-C-03 | Metadata-only never yields LIVE |
| AC-C-04 | Defective bindings never yield LIVE |
| AC-C-05 | Collision never yields LIVE |
| AC-C-06 | Classifier is deterministic and unit-tested |

### 04-D

| ID | Criterion |
| -- | --------- |
| AC-D-01 | Conditional UPDATE predicates enforced |
| AC-D-02 | `vaultSecretId` unchanged for all rows |
| AC-D-03 | No rewrite of populated env |
| AC-D-04 | Durable audit for updated and blocked rows |
| AC-D-05 | Batch continues after skip/block |
| AC-D-06 | Zero Vault mutations |
| AC-D-07 | Migration exception not exposed as public API |

### 04-E

| ID | Criterion |
| -- | --------- |
| AC-E-01 | Final residual inventory matches §15 buckets |
| AC-E-02 | Idempotent re-run updates=0 |
| AC-E-03 | Residual EXCHANGE NULL remain fail-closed (spot-check use path) |
| AC-E-04 | Gate released only after inventory emitted |
| AC-E-05 | No claim of PRE-01/FIV closure |

### Cross-slice (must hold at CONN-04 completion)

AC-01…AC-24 and SC-04-01…14 from the parent Planning Package remain binding intent; this Slice Plan does not weaken them. Notably: Model C preserved; Strategy B preserved; C7 DENY-ALL; allowRealVenueIo false; no FIV; no venue I/O.

---

## 24. Implementation Boundaries

Future implementation (only after Slice Approval + Implementation Authorization) may:

```text
- Add read-only preflight tooling
- Add write-gate hooks + single-runner lease
- Add Vault-proven LIVE classifier
- Perform gated conditional Connection.environment UPDATEs
- Emit durable Security Audit events + counters
- Add offline tests/fixtures
- Optionally add a classified audit event type to the Security Audit catalog
```

Future implementation must **not** without new governance:

```text
- Alter Prisma nullability / add NOT NULL
- Redesign Strategy B index
- Mutate Vault secrets or purposes
- Replace vaultSecretId
- Populate TESTNET/DEMO in this slice
- Enable C7 / allowRealVenueIo
- Call Binance or other venues
- Close FIV-PRE-01 or authorize FIV
- Introduce runtime NULL waiver
```

Likely touch surfaces (planning estimate, not authorization):

| Area | Paths |
| ---- | ----- |
| Connections | `apps/api/src/modules/connections/**` |
| ENV1 helpers (reuse) | `.../trading-credential-environment.ts` |
| Secret purpose (reuse) | `.../secret-purpose.ts` |
| Security Audit catalog | `.../security-audit-classification.ts`, attribution, new audit helper |
| Scripts (optional) | `apps/api/scripts/` |
| Prisma schema | **No change expected** (nullable remains) |
| Strategy B migration | **No change** (already applied) |

---

## 25. Explicit Non-Scope

```text
OUT OF SCOPE FOR FIV-CONN-04:
  - TESTNET environment population / backfill
  - DEMO support for Connections
  - NOTIFICATION / AI / non-EXCHANGE LIVE classification
  - Unrelated provider/type expansions
  - Vault secret create/rotate/delete/purpose change
  - Credential migration / replacement / cleanup
  - Duplicate destructive cleanup / merge / delete
  - LIVE → TESTNET or TESTNET → LIVE changes
  - EXCHANGE environment NOT NULL enforcement (D-CONN-04-07 = A)
  - C7 changes; allowRealVenueIo=true
  - Live execution; capital movement
  - Binance / Bybit / OKX I/O
  - FIV execution / FIV authorization
  - FIV-PRE-01 closure
  - UI Testnet flows (CRED-05)
  - Handshake origin/host selection (CRED-04)
  - Reopening CLOSED CONN-01/02/03 or CRED-01
  - Runtime waiver / exception flags for NULL EXCHANGE
```

---

## 26. Repository Safety Statement

```text
Before repository operations for this planning act:
  git status --short  (protected leftovers present; untouched)

Protected leftovers MUST remain untouched.
Never use: git add . | git add -A | git clean | git reset --hard | git restore . | git rebase

Only intended artifact:
  docs/project/version-3/wave-6/v3-l02-fiv-conn-04-slice-planning-package.md

No commit is authorized by this planning task unless separately requested.
```

---

## 27. Current Safety State

```text
Implementation:                 NOT PERFORMED
LIVE backfill:                  NOT PERFORMED
External I/O:                   ZERO
Binance / Bybit / OKX:          ZERO
FIV:                            NOT PERFORMED
Capital:                        ZERO
C7:                             DENY-ALL
allowRealVenueIo:               FALSE
Vault:                          NOT MODIFIED
Credentials:                    NOT MODIFIED
Database data:                  NOT MODIFIED
Schema:                         NOT MODIFIED
Migrations:                     NOT CREATED
Protected leftovers:            UNTOUCHED
```

---

## 28. Next Governance Gate

```text
Next gate:
  FIV-CONN-04 PO SLICE REVIEW / SLICE APPROVAL

Do NOT:
  - implement code
  - create migrations
  - perform LIVE backfill
  - mutate Vault/credentials/DB data
  - enable C7 / allowRealVenueIo
  - authorize FIV
  - close FIV-CONN-04 or FIV-PRE-01
```

After Slice Approval, normal ladder remains:

```text
Slice Approval
  → Implementation Authorization
  → Implementation (04-A…E)
  → PO Review
  → Closure
```

---

## Planning Act Footer

```text
SLICE PLANNING = READY FOR PO REVIEW

C-01 Write gate:                 DESIGNED in §11 / 04-B
C-02 Migration-time exception:   BOUNDED in §10 / §24
C-03 Classifier / UPDATE:        SPECIFIED in §9 / §10 / 04-C/D
C-04 Audit events:               SPECIFIED in §13 / 04-D
C-05 Target preflight:           SPECIFIED in §14 / 04-A
C-06 Residual inventory:         SPECIFIED in §15 / 04-E

Implementation: NOT AUTHORIZED BY THIS ARTIFACT
```

**END OF FIV-CONN-04 SLICE PLANNING PACKAGE**
