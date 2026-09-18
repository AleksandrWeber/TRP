# FIV-CONN-04-B-02 Implementation Planning Package

**Document:** FIV-CONN-04-B-02 Durable Migration Gate Lease — Implementation Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-02 — Durable Migration Gate Lease  
**Authority:** Senior Staff Engineer (implementation planning under PO Slice Approval)  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** write production code, create Prisma schema/migrations, implement lease adapter, wire deny hooks, or perform 04-D/Vault/FIV/C7/capital changes.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-02-slice-approval.md`](./v3-l02-fiv-conn-04-b-02-slice-approval.md) (`bdee841…`) — **GRANTED**  
**Decision Freeze:** [`v3-l02-fiv-conn-04-b-02-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-02-po-governance-decision-freeze.md) — **COMPLETE**  
**Planning / Arch / Sec:** B-02 planning package + architecture/security reviews — **PASS WITH CONDITIONS** (conditions frozen as COND-B02-01…06)

**Repository baseline:** `bdee841a6b5ceb25ebe49fcbbc5c0e67d4eb2062` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-02 SLICE APPROVAL = GRANTED
B-02 IMPLEMENTATION = AUTHORIZED FOR THIS SLICE
B-02 IMPLEMENTATION IN THIS TASK = NOT PERFORMED

READY FOR B-02 IMPLEMENTATION PLANNING REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Purpose

Translate frozen B-02 governance (COND-B02-01…06, B02-AC01…33, closed B-01 `MigrationGatePort`) into an exact repository-level implementation blueprint: files, Prisma model/migration, adapter algorithms, CAS predicates, transactions, audit, DI, tests, and sequence — **without implementing any of it in this act**.

---

## 2. Governance Baseline

| Artifact                            | Status                                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| OD-B-01…08                          | FROZEN / BINDING                                            |
| COND-ARCH-B01…B10                   | MANDATORY (B-02 owns durable SoT/CAS/audit portions)        |
| COND-SEC-B01…B11                    | MANDATORY (ownership split; B-03/04-D deferred where noted) |
| COND-B02-01…06                      | **FROZEN / PASS** (binding impl constraints)                |
| B02-AC01…AC33                       | **FROZEN**                                                  |
| Wave B Implementation Authorization | GRANTED (ceiling)                                           |
| B-02 Slice Approval                 | **GRANTED**                                                 |
| B-01                                | **CLOSED**                                                  |

Not reopened: ≤4h window, deny/allow matrix, `fenceGeneration`, UNKNOWN⇒DENY, audit family, Model C, Strategy B.

---

## 3. Slice Approval Authority

```text
AUTHORIZED FOR THIS SLICE (after this plan is reviewed as required):
  durable singleton lease + persistence + acquire/release/heartbeat
  + stale/operator reclaim + fenceGeneration + durable ≤4h
  + DB NOW() + connection.migration-gate audit
  + MigrationGatePort adapter/binding + CAS helper for future 04-D

NOT AUTHORIZED:
  B-03 hooks, 04-D UPDATE/backfill, Vault/credentials, FIV, C7, capital, venue I/O
```

This Implementation Planning Package does **not** by itself start coding. Next gate after planning review (as required) is implementation.

---

## 4. Authoritative Artifacts

| Role                   | Path                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| B-02 Planning          | `v3-l02-fiv-conn-04-b-02-planning-package.md`                            |
| B-02 Arch / Sec        | `v3-l02-fiv-conn-04-b-02-architecture-review.md`, `…-security-review.md` |
| B-02 Freeze / Approval | `…-po-governance-decision-freeze.md`, `…-slice-approval.md`              |
| Parent B governance    | B planning, OD-B freeze, arch/sec, wave impl auth                        |
| Closed B-01            | B-01 docs + `migration-gate.ts` / `.port.ts` / `.spec.ts`                |

---

## 5. B-01 Contract Dependency

**DO NOT modify** B-01 contract semantics. Implement behind:

| Item            | Closed value                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Token           | `MIGRATION_GATE_PORT`                                                                                                 |
| Interface       | `MigrationGatePort`: `acquire`, `release`, `heartbeat`, `observe`, `validate`                                         |
| `gateKey`       | `FIV-CONN-04`                                                                                                         |
| `purpose`       | `FIV_CONN_04_MIGRATION_BACKFILL`                                                                                      |
| Max window      | `MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS` (4h)                                                                        |
| Fencing field   | `fenceGeneration` only                                                                                                |
| Soft re-acquire | Forbidden (`MIGRATION_GATE_NO_SOFT_REACQUIRE`)                                                                        |
| UNKNOWN         | ⇒ DENY                                                                                                                |
| Pure helpers    | Reuse `assertAcquireInput`, `assertHeartbeatCeiling`, `classifyGrantShape`, `sanitizeMigrationGateAuditPayload`, etc. |

**B-01 file modification:** None required for contract. DI binding occurs in `connections.module.ts` (MODIFY in impl act) — does not change B-01 files.

---

## 6. Repository Architecture Evidence

| Pattern                 | Evidence                                                                                                 | B-02 use                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Flat connections module | `apps/api/src/modules/connections/`                                                                      | Colocate adapter + audit helper + specs   |
| Symbol port             | `MIGRATION_GATE_PORT` (B-01); `CONNECTION_VALIDATOR` + `useExisting`                                     | Prefer `useFactory` for Prisma+audit deps |
| Global Prisma           | `@Global()` `PrismaModule` exports `PrismaService` + `PrismaTransactionService`                          | Inject without module import              |
| Txn API                 | `apps/api/src/storage/prisma/prisma-transaction.service.ts` — `run(work)` + `prismaClientForTransaction` | All mutating lease ops                    |
| CAS analogue            | `PrismaTradingSessionRepository.saveIfVersion` — `updateMany` + `count !== 1`                            | Lease CAS                                 |
| Satellite singleton     | `WorkspaceKillSwitchState` PK = scope key                                                                | PK = `gateKey`                            |
| Audit service           | `SecurityAuditService.record(write, transaction?)`                                                       | Same-txn audit                            |
| Catalog                 | `security-audit-classification.ts` + `security-audit-attribution.ts`                                     | Register `connection.migration-gate`      |
| Audit wrapper           | `connection-lifecycle-audit.ts`                                                                          | New `connection-migration-gate-audit.ts`  |
| Schema                  | `apps/api/prisma/schema.prisma`                                                                          | Add model                                 |
| Migrations              | `apps/api/prisma/migrations/`                                                                            | New folder                                |
| Tests                   | Colocated `*.spec.ts`; heavier CAS in validation/integration if needed                                   | See §30                                   |
| TTL config              | No ConfigService in connections; B-01 constants module-local                                             | Defaults beside adapter/constants         |

**Dirty leftover note:** `connections.module.ts` appears modified in working tree from prior unrelated work — **must not be cleaned/touched by this planning task**. Future impl must stage only intentional B-02 wiring.

---

## 7. Implementation File Map

| Path                                                                            | Action (future)    | Role                                                      |
| ------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                                 | MODIFY             | Add `ConnectionMigrationGateLease`                        |
| `apps/api/prisma/migrations/<ts>_v3_l02_fiv_conn_04_b_02_migration_gate_lease/` | CREATE             | Table + seed                                              |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`             | CREATE             | `implements MigrationGatePort`                            |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.spec.ts`        | CREATE             | Unit/CAS tests (mocked Prisma)                            |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts`           | CREATE             | Thin audit emitter                                        |
| `apps/api/src/modules/connections/connection-migration-gate-audit.spec.ts`      | CREATE             | Payload/sanitizer tests                                   |
| `apps/api/src/modules/connections/migration-gate.constants.ts`                  | CREATE (optional)  | Default TTL/heartbeat constants (or colocate in adapter)  |
| `apps/api/src/modules/connections/connections.module.ts`                        | MODIFY             | Provider + export `MIGRATION_GATE_PORT`                   |
| `apps/api/src/modules/security-audit/security-audit-classification.ts`          | MODIFY             | Register event type                                       |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`             | MODIFY             | Attribution rule (actorId required; workspaceId optional) |
| `apps/api/src/validation/...` or colocated integration spec                     | CREATE (as needed) | DB concurrency proofs                                     |
| B-01 `migration-gate.ts` / `.port.ts` / `.spec.ts`                              | **NO CHANGE**      | Closed contract                                           |

---

## 8. Prisma Model

### Exact model (planning freeze)

```prisma
/// FIV-CONN-04-B-02 — global singleton migration-gate lease (durable SoT).
model ConnectionMigrationGateLease {
  gateKey            String    @id @map("gate_key")
  purpose            String
  state              String
  holderId           String?   @map("holder_id")
  fenceGeneration    Int       @default(0) @map("fence_generation")
  acquiredAt         DateTime? @map("acquired_at")
  expiresAt          DateTime? @map("expires_at")
  authorizedWindowMs Int?      @map("authorized_window_ms")
  authorizedUntil    DateTime? @map("authorized_until")
  heartbeatAt        DateTime? @map("heartbeat_at")
  actorKind          String?   @map("actor_kind")
  correlationId      String?   @map("correlation_id")
  schemaVersion      Int       @default(1) @map("schema_version")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  @@map("connection_migration_gate_leases")
}
```

### Field dictionary

| Field                | Prisma type | Null | Default      | Constraint | Purpose                            |
| -------------------- | ----------- | ---- | ------------ | ---------- | ---------------------------------- |
| `gateKey`            | `String`    | NO   | —            | `@id`      | Global identity `FIV-CONN-04`      |
| `purpose`            | `String`    | NO   | —            | —          | `FIV_CONN_04_MIGRATION_BACKFILL`   |
| `state`              | `String`    | NO   | —            | —          | `INACTIVE` \| `ACTIVE`             |
| `holderId`           | `String?`   | YES  | null         | —          | Current holder; null when inactive |
| `fenceGeneration`    | `Int`       | NO   | `0`          | —          | Sole fencing authority             |
| `acquiredAt`         | `DateTime?` | YES  | null         | —          | Window anchor                      |
| `expiresAt`          | `DateTime?` | YES  | null         | —          | TTL tip                            |
| `authorizedWindowMs` | `Int?`      | YES  | null         | —          | Ceiling duration ≤4h               |
| `authorizedUntil`    | `DateTime?` | YES  | null         | —          | Hard ceiling instant               |
| `heartbeatAt`        | `DateTime?` | YES  | null         | —          | Last heartbeat                     |
| `actorKind`          | `String?`   | YES  | null         | —          | `SYSTEM_JOB` \| `OPERATOR`         |
| `correlationId`      | `String?`   | YES  | null         | —          | Audit correlation                  |
| `schemaVersion`      | `Int`       | NO   | `1`          | —          | Satellite convention               |
| `createdAt`          | `DateTime`  | NO   | `now()`      | —          | Row birth                          |
| `updatedAt`          | `DateTime`  | NO   | `@updatedAt` | —          | Row update                         |

No workspace/provider/environment columns. No `fencingToken`. String enums match Connection/TradingSession conventions.

---

## 9. Singleton Enforcement

| Mechanism       | Spec                                                    |
| --------------- | ------------------------------------------------------- |
| Primary key     | `gate_key = 'FIV-CONN-04'`                              |
| Unique          | PK only (one row possible for this key)                 |
| Seed            | Migration inserts INACTIVE row if absent                |
| Initial state   | `INACTIVE`                                              |
| Initial fence   | `0`                                                     |
| Hot path        | `UPDATE` only; never INSERT second row                  |
| Missing row     | `UNKNOWN` / fail-closed (do not auto-create)            |
| Wrong `gateKey` | Application reject; only supported key is B-01 constant |

---

## 10. Migration Design

### Name

```text
apps/api/prisma/migrations/<YYYYMMDDHHMMSS>_v3_l02_fiv_conn_04_b_02_migration_gate_lease/migration.sql
```

Timestamp chosen at implementation time (repo convention: `20260917…` style).

### Planned SQL (conceptual — do not create now)

1. `CREATE TABLE connection_migration_gate_leases (…)` with PK on `gate_key`.
2. Idempotent seed:

```sql
INSERT INTO connection_migration_gate_leases (
  gate_key, purpose, state, fence_generation, schema_version, created_at, updated_at
) VALUES (
  'FIV-CONN-04',
  'FIV_CONN_04_MIGRATION_BACKFILL',
  'INACTIVE',
  0,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (gate_key) DO NOTHING;
```

### Already-existing row

- `ON CONFLICT DO NOTHING` preserves ACTIVE leases and existing fence (safe re-apply).
- Must **not** reset fence/state on conflict.

### Rollback

Forward-only preferred. Do not casually unlock ACTIVE mid-backfill via down migration. If rollback required in empty env: drop table only when no ACTIVE lease (ops judgment).

### Indexes

PK sufficient for singleton.

---

## 11. Durable Adapter

### Class

```text
PrismaMigrationGateAdapter implements MigrationGatePort
```

**Path:** `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`  
**Deps:** `PrismaService`, `PrismaTransactionService`, `ConnectionMigrationGateAudit` (or `SecurityAuditService` directly)

### Methods (B-01 exact)

| Port method | Adapter responsibility                         |
| ----------- | ---------------------------------------------- |
| `acquire`   | Durable CAS acquire/reclaim + audit            |
| `release`   | Owner+fence CAS → INACTIVE + audit             |
| `heartbeat` | Owner+fence+ceiling CAS + audit on fail        |
| `observe`   | Read durable row → observation (no auth grant) |
| `validate`  | Read + compare grant vs durable ACTIVE         |

Optional internal helper (exported for 04-D later, same module or package-private):

```text
assertDurableAuthorityCas(tx, grant): Promise<boolean>
```

Does **not** UPDATE Connection rows.

### Operator reclaim

Privileged method on adapter (e.g. `reclaimAsOperator(input)`) — **not** on public Connections HTTP in B-02 unless later PO. Must bump fence + audit (COND-B02-06). Can share CAS path with stale acquire using forced-expired semantics only when authorized.

---

## 12. Acquire

### Preconditions

1. `assertAcquireInput` (B-01) — privileged actor + purpose + TTL ≤4h.
2. No soft re-acquire of ACTIVE non-expired (even same holder).

### Algorithm (authoritative)

```text
transactions.run(async (tx) => {
  dbNow ← SELECT NOW()  -- via $queryRaw or SQL NOW() in predicates
  -- optional: SELECT … FOR UPDATE on gate_key
  row ← findUnique(FIV-CONN-04)
  if missing/malformed → UNKNOWN; audit optional; return fail
  if purpose mismatch → fail-closed

  if state=ACTIVE AND expiresAt > dbNow:
    audit gate_acquire_denied; return CONTENTION

  // INACTIVE OR expired ACTIVE → takeover
  priorFence ← row.fenceGeneration
  windowMs ← clamp(requestedOrDefault ≤ MAX_4H)
  ttlMs ← clamp(requestedTtlMs ?? DEFAULT_TTL_MS, 1..windowMs)
  newFence ← priorFence + 1
  acquiredAt ← dbNow
  authorizedUntil ← acquiredAt + windowMs
  expiresAt ← min(acquiredAt + ttlMs, authorizedUntil)

  count ← updateMany WHERE
    gateKey=FIV-CONN-04
    AND fenceGeneration=priorFence
    AND (
      state='INACTIVE'
      OR (state='ACTIVE' AND expiresAt <= dbNow)
    )
    SET state=ACTIVE, holderId, fenceGeneration=newFence, purpose,
        acquiredAt, expiresAt, authorizedWindowMs, authorizedUntil,
        heartbeatAt=dbNow, actorKind, correlationId

  if count ≠ 1 → CONTENTION (lost race); audit denied; return

  if expired-path → audit lease_expired_reclaim / gate_stale_reclaim
  audit gate_acquired (same tx)
  return grant
})
```

### Rollback safety

Fence bump only persists on commit. Failed CAS / thrown error ⇒ no authority.

---

## 13. Contention

```text
ACTIVE + expiresAt > DB NOW()
  → GATE_CONTENTION / CONTENTION_DENIED
  → immediate; no wait/queue/blind retry
```

Audit: `gate_acquire_denied`.

---

## 14. Fencing

Sole authority: `fenceGeneration` (Int). No `fencingToken` / UUID.

### Protected mutation CAS (for 04-D handoff; implement helper in B-02)

```text
WHERE gate_key = 'FIV-CONN-04'
  AND purpose = 'FIV_CONN_04_MIGRATION_BACKFILL'
  AND holder_id = :holderId
  AND fence_generation = :fenceGeneration
  AND state = 'ACTIVE'
  AND expires_at > NOW()
```

Must run in **same transaction** as future Connection UPDATE. Check-then-save alone **FORBIDDEN**.

---

## 15. Fence Generation

| Event                      | Behavior                               |
| -------------------------- | -------------------------------------- |
| Seed                       | `0`                                    |
| Successful acquire/reclaim | `N → N+1`                              |
| Heartbeat / release        | **unchanged**                          |
| Failed acquire             | unchanged                              |
| Rollback                   | no persist                             |
| Overflow                   | fail-closed near `2^31-1`; do not wrap |

---

## 16. Maximum Authorized Window

**Frozen:** `authorizedUntil ≤ acquiredAt + 4 hours` (COND-B02-01).

### Durable enforcement

1. Application: reject `authorizedWindowMs` / TTL > `MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS`.
2. Persist `authorizedWindowMs` and `authorizedUntil = acquiredAt + windowMs` using DB time at acquire.
3. Heartbeat CAS: `proposedExpiresAt ≤ authorized_until` **and** `proposedExpiresAt > NOW()` **and** `expires_at > NOW()`.
4. Never extend `authorizedUntil` via heartbeat.

App-only check is **insufficient** alone — SQL predicates required.

---

## 17. TTL

| Parameter         | Value          | Classification    |
| ----------------- | -------------- | ----------------- |
| Default TTL       | **15 minutes** | Technical/ops     |
| Heartbeat cadence | **≤5 minutes** | Technical/ops     |
| Max window        | **≤4h**        | Governance frozen |

### Config location

```text
migration-gate.constants.ts (CREATE) or adapter-local:
  MIGRATION_GATE_DEFAULT_TTL_MS = 15 * 60 * 1000
  MIGRATION_GATE_DEFAULT_HEARTBEAT_MS = 5 * 60 * 1000  // guidance only
```

Config **must not** allow defaults/requests above 4h. `requestedTtlMs` clamped to `[1, authorizedWindowMs]`.

Invariant always: `expiresAt ≤ authorizedUntil`.

---

## 18. Heartbeat

```text
transactions.run:
  assert grant shape + actor
  assertHeartbeatCeiling (pure) using DB now for nowMs
  count ← updateMany WHERE
    gateKey AND purpose AND holderId AND fenceGeneration
    AND state='ACTIVE'
    AND expires_at > NOW()
    AND :proposed <= authorized_until
    AND :proposed > NOW()
    SET expires_at=:proposed, heartbeat_at=NOW()
  if count≠1 → map to GATE_HEARTBEAT_REJECTED / EXPIRED / FENCE / OWNERSHIP; audit
  else return updated grant (fence unchanged)
```

No resurrection. No fence increment. No memory SoT.

---

## 19. Release

```text
transactions.run:
  count ← updateMany WHERE
    gateKey AND purpose AND holderId AND fenceGeneration
    AND state='ACTIVE'
    SET state='INACTIVE', holderId=null, acquiredAt/expiresAt/window/until/heartbeat/actorKind=null
    -- retain fenceGeneration + purpose + gateKey
  if count=1:
    observation = (prior expiresAt <= NOW() ? EXPIRED : INACTIVE)
    audit gate_released; return ok
  else:
    re-read → ALREADY_INACTIVE / OWNERSHIP_LOST / FENCE_MISMATCH / EXPIRED mapping
    audit stale_holder_rejected when fence/owner mismatch
```

Stale holder **must not** clear newer authority.

---

## 20. Stale Reclaim

Covered by acquire path when `ACTIVE && expiresAt ≤ NOW()` (or INACTIVE). Concurrent reclaim: one `updateMany` winner; loser CONTENTION (R06).

Operator reclaim before TTL: separate privileged entry; same fence bump + audit; no emergency bypass.

---

## 21. DB Clock

| Use                                            | Authority                                                |
| ---------------------------------------------- | -------------------------------------------------------- |
| Expiry / CAS / heartbeat / reclaim eligibility | PostgreSQL `NOW()` via `$queryRaw` and/or SQL in `WHERE` |
| Grant ISO serialization                        | Convert committed DB timestamps to ISO strings           |
| Logs/display                                   | App clock OK                                             |
| Forbidden as sole CAS authority                | `Date.now()` / `new Date()` alone                        |

---

## 22. Transaction Boundaries

| Operation                   | Txn?                                                          | Notes                                       |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Acquire                     | **YES**                                                       | Short; lease+audit                          |
| Heartbeat                   | **YES**                                                       | Short; lease(+audit on fail/success prefer) |
| Release                     | **YES**                                                       | Short; lease+audit                          |
| Stale/operator reclaim      | **YES**                                                       | As acquire                                  |
| Observe                     | **NO**                                                        | Read; failure → UNKNOWN                     |
| Validate                    | **NO** for read validate; **YES** when embedded in 04-D write | Must read durable state                     |
| `assertDurableAuthorityCas` | **YES** (caller txn)                                          | No Vault/HTTP                               |

**Rules:** no Vault I/O; no HTTP; no network; no user waits; no queues inside txn.

---

## 23. Audit Implementation

### Catalog registration (before first emit)

| File                               | Change                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `security-audit-classification.ts` | Add `connection.migration-gate` (`eventClass: 'connection'`, high criticality/security)            |
| `security-audit-attribution.ts`    | Require `actorId`; **do not** require `workspaceId` for global lifecycle; optional resource fields |

### Emitter

`connection-migration-gate-audit.ts` — wrap `SecurityAuditService.record` with `sanitizeMigrationGateAuditPayload`, `source: 'connections'`, `eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE`.

### Outcomes (B-02)

| Outcome                                           | When                                  |
| ------------------------------------------------- | ------------------------------------- |
| `gate_acquired`                                   | Success acquire                       |
| `gate_acquire_denied`                             | Contention/unauthorized               |
| `lease_expired_reclaim` / `gate_stale_reclaim`    | Expired takeover                      |
| `gate_released`                                   | Release success                       |
| `gate_heartbeat_failed` / `heartbeat_rejected`    | Heartbeat fail                        |
| `gate_fencing_rejected` / `stale_holder_rejected` | Fence/owner mismatch                  |
| `gate_expired`                                    | Optional explicit expiry observe path |

`lifecycle_mutation_blocked` → B-03 (not B-02).

### Atomicity

Prefer same `TransactionContext` for acquire/reclaim/release/heartbeat. Exception: observe-only. If audit append fails inside txn → rollback lease mutation. Never emit secrets/`fencingToken`.

---

## 24. DI / Module Wiring

```ts
// connections.module.ts (MODIFY in impl — not now)
providers: [
  ConnectionMigrationGateAudit,
  PrismaMigrationGateAdapter,
  {
    provide: MIGRATION_GATE_PORT,
    useExisting: PrismaMigrationGateAdapter, // or useFactory injecting Prisma + audit + tx
  },
],
exports: [MIGRATION_GATE_PORT],
```

`PrismaService` / `PrismaTransactionService` come from global `PrismaModule`. `SecurityAuditModule` already imported.

**Do not** put production adapter in `composition/` for B-02.

---

## 25. Error Semantics

| Condition                    | Reason / observation                         |
| ---------------------------- | -------------------------------------------- |
| Contention                   | `GATE_CONTENTION` / `CONTENTION_DENIED`      |
| Ownership lost               | `GATE_OWNERSHIP_LOST` / `OWNERSHIP_LOST`     |
| Fence mismatch               | `GATE_FENCE_MISMATCH` (+ ownership lost obs) |
| Purpose mismatch             | `GATE_PURPOSE_MISMATCH`                      |
| Gate mismatch                | `GATE_KEY_MISMATCH`                          |
| Expired                      | `GATE_EXPIRED` / `EXPIRED`                   |
| Already inactive             | `GATE_ALREADY_INACTIVE`                      |
| Unauthorized actor           | `GATE_UNAUTHORIZED`                          |
| Max window                   | `GATE_MAX_WINDOW_EXCEEDED`                   |
| Heartbeat reject             | `GATE_HEARTBEAT_REJECTED`                    |
| Malformed                    | `GATE_MALFORMED_GRANT` / `UNKNOWN`           |
| DB/txn failure / missing row | `GATE_UNKNOWN` / `UNKNOWN` → **DENY**        |

Never map DB uncertainty to permission.

---

## 26. Concurrency Design (R01–R15)

| ID  | Race                        | Txn/CAS                       | Expected           | State              | Fence           | Audit                     |
| --- | --------------------------- | ----------------------------- | ------------------ | ------------------ | --------------- | ------------------------- |
| R01 | Dual acquire                | FOR UPDATE + CAS              | One win            | One ACTIVE         | +1 once         | acquired + denied         |
| R02 | Acquire vs heartbeat        | Short txns                    | Renew or contend   | Consistent         | HB no bump      | as outcome                |
| R03 | Acquire vs release          | CAS ordered                   | Clear or contend   | INACTIVE or ACTIVE | release no bump | released/denied           |
| R04 | Stale release vs new        | fence CAS                     | Stale fails        | Newer ACTIVE       | preserved       | stale_holder_rejected     |
| R05 | Stale HB vs new             | fence CAS                     | Stale fails        | Newer ACTIVE       | preserved       | heartbeat_failed          |
| R06 | Dual stale takeover         | CAS                           | One win            | One ACTIVE         | +1 once         | reclaim+acquired / denied |
| R07 | HB at expiry                | `expires_at > NOW()`          | Fail closed        | EXPIRED/ACTIVE     | unchanged       | heartbeat_failed          |
| R08 | Acquire at expiry           | `expires_at <= NOW()` reclaim | Success possible   | ACTIVE             | +1              | reclaim+acquired          |
| R09 | Crash after acquire         | committed                     | Remains ACTIVE     | ACTIVE             | kept            | prior acquired            |
| R10 | Crash mid-release           | atomic                        | Released or ACTIVE | consistent         | consistent      | ≤1 released               |
| R11 | Crash mid-HB                | atomic                        | old or new expires | consistent         | unchanged       | —                         |
| R12 | Rollback takeover           | abort                         | No grant           | prior              | unchanged       | no success                |
| R13 | DB fail validate            | —                             | UNKNOWN DENY       | —                  | —               | optional                  |
| R14 | DB fail acquire             | abort                         | No grant           | prior              | unchanged       | denied/fail               |
| R15 | Same operator dual instance | as R01                        | CONTENTION         | one ACTIVE         | +1 once         | as R01                    |

---

## 27. Direct Prisma/DBA Residual (S20)

```text
B-02 protects supported application path (MigrationGatePort).
B-03 later enforces ConnectionsService deny-set.
04-D later binds privileged UPDATE to CAS.
Direct DBA/Prisma bypass = operational trust residual — NOT a new app freeze system.
```

Do not expand B-02 into generic DB access control.

---

## 28. B-03 Integration Boundary

B-02 exports `MIGRATION_GATE_PORT` with durable `observe()` / `validate()`.

B-02 **MUST NOT** implement deny hooks for: credential store/replace/revoke, EXCHANGE create, NON-EXCHANGE create, rename, disconnect, disable.

---

## 29. 04-D Integration Boundary

04-D (later) must, in one transaction:

```text
assertDurableAuthorityCas(tx, grant)  -- B-02 helper
+ ConnectionRecord environment UPDATE
```

B-02 does **not** implement environment UPDATE/backfill.

---

## 30. Test Plan

| ID  | Group                | Focus                                        |
| --- | -------------------- | -------------------------------------------- |
| T01 | Schema/model         | Fields, types, @@map                         |
| T02 | Singleton            | PK; dual row impossible                      |
| T03 | Initialization       | Seed INACTIVE fence=0; ON CONFLICT           |
| T04 | Acquire              | Happy path grant                             |
| T05 | Contention           | Immediate deny                               |
| T06 | Expiry               | ACTIVE→EXPIRED observation                   |
| T07 | Stale reclaim        | Fence bump + audit                           |
| T08 | Fence increment      | Exactly +1 on success                        |
| T09 | Stale release        | Fail                                         |
| T10 | Stale heartbeat      | Fail                                         |
| T11 | Heartbeat ceiling    | ≤ authorizedUntil                            |
| T12 | 4h maximum           | Reject oversize                              |
| T13 | DB clock             | NOW() predicates                             |
| T14 | Rollback             | No authority after abort                     |
| T15 | DB failure           | UNKNOWN                                      |
| T16 | UNKNOWN⇒DENY         | Missing/malformed                            |
| T17 | Audit                | Outcomes; no secrets/token                   |
| T18 | Multi-instance       | R01–R15 subset                               |
| T19 | Restart/crash        | Lease survives                               |
| T20 | DI/port              | Provider binds; methods match                |
| T21 | B-01 regression      | Existing `migration-gate.spec.ts` still pass |
| T22 | S01–S20 (B-02-owned) | See security review ownership                |

### ST-B21…ST-B26

| ID     | Owner | Plan                                          |
| ------ | ----- | --------------------------------------------- |
| ST-B21 | B-02  | Unauthorized acquire denied                   |
| ST-B22 | B-02  | Heartbeat ≤4h                                 |
| ST-B23 | B-02  | Stale fence CAS reject (contract/integration) |
| ST-B24 | B-02  | Operator reclaim bump+audit                   |
| ST-B25 | B-03  | Deferred                                      |
| ST-B26 | B-02  | Audit sensitive-key / fenceGeneration         |

Prefer colocated unit tests; add DB integration under `apps/api/src/validation/` if repo pattern needed for real Postgres CAS. No invented numeric coverage quotas.

---

## 31. B02-AC01…B02-AC33 Verification Plan

| AC   | Impl evidence           | Test evidence | PASS when           |
| ---- | ----------------------- | ------------- | ------------------- |
| AC01 | Prisma model exists     | T01           | Model/table present |
| AC02 | PK gateKey              | T02           | Only FIV-CONN-04    |
| AC03 | purpose column/constant | T04           | Mismatch rejected   |
| AC04 | No ws/provider/env cols | T01           | Schema review       |
| AC05 | Adapter reads DB        | T04/T16       | Memory not SoT      |
| AC06 | CAS acquire             | T05/R01       | One ACTIVE          |
| AC07 | CONTENTION              | T05           | Immediate           |
| AC08 | Expired reclaim         | T07           | Success + bump      |
| AC09 | Fence +1                | T08           | Monotonic           |
| AC10 | Stale release           | T09           | Fail                |
| AC11 | Stale HB                | T10           | Fail                |
| AC12 | CAS helper              | T22/S03       | Predicate           |
| AC13 | Docs+tests forbid CTS   | Review/T22    | No sole CTS         |
| AC14 | Same-txn CAS            | T13/T18       | Defined+tested      |
| AC15 | Distinct TTL/window     | T11/T12       | Fields differ       |
| AC16 | ≤4h                     | T12           | Enforced durable    |
| AC17 | HB ceiling              | T11           | Fail over           |
| AC18 | No resurrect            | T10/T07       | Fail/reclaim only   |
| AC19 | DB NOW()                | T13           | Predicates          |
| AC20 | UNKNOWN deny            | T15/T16       | Fail-closed         |
| AC21 | Release CAS             | T09           | Protected           |
| AC22 | Reclaim audit           | T07/T17       | Audited             |
| AC23 | Event type              | T17           | Catalog+emit        |
| AC24 | No secrets/token        | ST-B26        | Sanitizer           |
| AC25 | Races                   | T18           | Covered             |
| AC26 | No memory SoT           | Code review   | Adapter only        |
| AC27 | Single port path        | T20           | No twin API         |
| AC28 | Model C                 | Review        | Untouched           |
| AC29 | Strategy B              | Review        | Untouched           |
| AC30 | No Vault I/O            | Review/T      | Zero                |
| AC31 | No B-03 hooks           | File review   | None                |
| AC32 | No 04-D UPDATE          | File review   | None                |
| AC33 | B-01 compat             | T21           | Specs pass          |

---

## 32. Implementation Sequence

| Phase  | Work                                               |
| ------ | -------------------------------------------------- |
| **1**  | Prisma model + migration + seed (COND-B02-05)      |
| **2**  | Audit catalog + attribution + audit helper         |
| **3**  | Adapter skeleton + observe/validate (fail-closed)  |
| **4**  | Atomic acquire + stale reclaim + contention        |
| **5**  | Heartbeat + release                                |
| **6**  | Operator reclaim (privileged) + CAS helper export  |
| **7**  | DI/module wiring + export port                     |
| **8**  | Unit/integration/concurrency tests (T01–T22, ST-*) |
| **9**  | B-01 regression + connections suite                |
| **10** | Implementation report + PO review prep             |

No phase executed in this planning task.

---

## 33. File Change Plan

### PRODUCTION FILES

| Path                                 | Op              | Purpose        | ACs                        |
| ------------------------------------ | --------------- | -------------- | -------------------------- |
| `prisma-migration-gate.adapter.ts`   | CREATE          | Port impl      | AC05–AC22, AC26–AC27, AC33 |
| `connection-migration-gate-audit.ts` | CREATE          | Audit emits    | AC23–AC24                  |
| `migration-gate.constants.ts`        | CREATE optional | TTL defaults   | AC15–AC17                  |
| `connections.module.ts`              | MODIFY          | DI bind/export | AC27, T20                  |
| `security-audit-classification.ts`   | MODIFY          | Catalog        | AC23                       |
| `security-audit-attribution.ts`      | MODIFY          | Attribution    | AC23, COND-SEC-B06         |

### DATABASE FILES

| Path                                                         | Op     | Purpose    | ACs                          |
| ------------------------------------------------------------ | ------ | ---------- | ---------------------------- |
| `schema.prisma`                                              | MODIFY | Model      | AC01–AC04                    |
| `migrations/…_v3_l02_fiv_conn_04_b_02_migration_gate_lease/` | CREATE | Table+seed | AC01–AC02, AC05, COND-B02-05 |

### TEST FILES

| Path                                      | Op     | Purpose         |
| ----------------------------------------- | ------ | --------------- |
| `prisma-migration-gate.adapter.spec.ts`   | CREATE | T04–T16, ST-*   |
| `connection-migration-gate-audit.spec.ts` | CREATE | T17, ST-B26     |
| Optional validation integration           | CREATE | T13/T18 real DB |

### GOVERNANCE FILES

| Path                         | Op                | Purpose   |
| ---------------------------- | ----------------- | --------- |
| This planning package        | CREATE (this act) | Blueprint |
| Future implementation report | Later             | Evidence  |

**B-01 files:** no change.

---

## 34. Security Handoff

Next implementation planning review / PO review of impl should verify:

- CAS correctness (COND-B02-02)
- Fence monotonicity (COND-B02-04)
- Stale holder invalidation (S01–S03, S15)
- 4h durable cap (COND-B02-01)
- TTL ≤ authorizedUntil
- DB clock usage
- Singleton seed/idempotency (COND-B02-05)
- Audit atomicity (COND-B02-03)
- Fail-closed UNKNOWN
- Concurrency R01–R15 / S04–S14
- Bypass boundaries (S19–S20; no B-03/04-D creep)
- Operator reclaim (COND-B02-06 / ST-B24)

---

## 35. Risks

| ID    | Risk                                        | Mitigation                           |
| ----- | ------------------------------------------- | ------------------------------------ |
| RK-01 | Check-then-save in 04-D                     | Helper + ST-B23; slice wall          |
| RK-02 | Catalog forgotten                           | Phase 2 before emits                 |
| RK-03 | App clock used for CAS                      | T13; SQL NOW()                       |
| RK-04 | Seed conflict resets ACTIVE                 | ON CONFLICT DO NOTHING               |
| RK-05 | Dirty connections.module leftover collision | Stage only B-02 wiring lines         |
| RK-06 | Public reclaim HTTP creep                   | COND-B02-06; no HTTP in B-02 default |

---

## 36. Non-Scope

B-03 hooks; 04-D UPDATE/backfill; Vault/credentials; FIV; C7; capital; venue I/O; soft re-acquire; advisory-only SoT; TradingSession overload; B-01 redesign; new audit system; generic DB ACL.

---

## 37. Safety Checklist (before later implementation)

- [ ] Protected leftovers untouched unless unrelated intentional work by owner
- [ ] No B-03 / 04-D / Vault / credential changes
- [ ] C7 remains DENY-ALL; `allowRealVenueIo=false`
- [ ] No FIV / capital / external / live venue I/O
- [ ] Stage only B-02 files (never `git add .`)
- [ ] COND-B02-01…06 verified in impl report

---

## 38. Implementation Readiness

```text
READY FOR B-02 IMPLEMENTATION PLANNING REVIEW
```

This artifact does **not** authorize starting production implementation by itself if lifecycle requires a planning-review gate first. Slice Approval already **GRANTED**; after planning review acceptance, implementation may proceed under frozen constraints.

---

## 39. Next Gate

```text
Next gate:
  B-02 Implementation Planning Review
  → (on acceptance) B-02 Implementation

DO NOT implement B-02 in this act.
DO NOT create Prisma migration now.
DO NOT start B-03 / 04-D / FIV.
```

### Final state (after this planning artifact)

```text
FIV-CONN-04-B-02 = SLICE APPROVAL GRANTED
B-02 = IMPLEMENTATION AUTHORIZED FOR THIS SLICE
B-02 Implementation Planning Package = CREATED
B-02 production implementation = NOT STARTED
B-03 = NOT AUTHORIZED
04-D = NOT AUTHORIZED
FIV-CONN-04-B = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
C7 = DENY-ALL
allowRealVenueIo = FALSE
```

---

**END OF FIV-CONN-04-B-02 IMPLEMENTATION PLANNING PACKAGE**
