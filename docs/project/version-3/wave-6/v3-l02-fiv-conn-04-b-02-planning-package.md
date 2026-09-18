# FIV-CONN-04-B-02 Planning Package — Durable Migration Gate Lease

**Document:** FIV-CONN-04-B-02 Durable Migration Gate Lease — Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-02 — Durable Migration Gate Lease  
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Senior Staff Engineer / Architect (planning under Product Owner + Chief Architect governance)  
**Nature:** **PLANNING ONLY.** Defines the durable singleton DB lease behind the closed B-01 contract. Does **not** authorize B-02 implementation. Does **not** modify Prisma schema, create migrations, implement acquire/release/heartbeat, wire ConnectionsService hooks, perform 04-D UPDATE/backfill, mutate Vault/credentials, or perform FIV/C7/venue I/O/capital.

**Wave-level Implementation Authorization:** [`v3-l02-fiv-conn-04-b-implementation-authorization.md`](./v3-l02-fiv-conn-04-b-implementation-authorization.md) — **GRANTED** at governance level; **does not** authorize this sub-slice without B-02 Slice Approval.

**B-01 contract (CLOSED / AUTHORITATIVE):**

| Artifact                                                                                                                     | Role                        |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| [`v3-l02-fiv-conn-04-b-01-planning-package.md`](./v3-l02-fiv-conn-04-b-01-planning-package.md)                               | Contract design             |
| [`v3-l02-fiv-conn-04-b-01-implementation-planning-package.md`](./v3-l02-fiv-conn-04-b-01-implementation-planning-package.md) | Impl plan                   |
| [`v3-l02-fiv-conn-04-b-01-po-review.md`](./v3-l02-fiv-conn-04-b-01-po-review.md)                                             | PO REVIEW = PASS            |
| [`v3-l02-fiv-conn-04-b-01-closure.md`](./v3-l02-fiv-conn-04-b-01-closure.md)                                                 | CLOSURE = GRANTED           |
| `apps/api/src/modules/connections/migration-gate.ts`                                                                         | Closed types + pure helpers |
| `apps/api/src/modules/connections/migration-gate.port.ts`                                                                    | Closed `MigrationGatePort`  |
| `apps/api/src/modules/connections/migration-gate.spec.ts`                                                                    | Closed contract tests       |

**Repository baseline (planning start):** `ebf77f53c9084a71e53ec725fdfb92c8c57954e5` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-02 = PLANNING ONLY
FIV-CONN-04-B-02 IMPLEMENTATION = NOT AUTHORIZED
Next gate: B-02 Planning Review → (Arch/Sec as required) → PO Slice Approval → Implementation
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Planning Purpose

Produce a repository-accurate planning package for **FIV-CONN-04-B-02 — Durable Migration Gate Lease** so that a later Slice-Approved implementation can deliver:

```text
Durable singleton DB lease = Source of Truth for FIV-CONN-04 migration-gate authority
```

B-02 owns the durable implementation **behind** the already-closed B-01 contract:

- Persist global gate identity `FIV-CONN-04`
- Purpose-bind to `FIV_CONN_04_MIGRATION_BACKFILL`
- Provide acquire / release / heartbeat / observe / validate via `MigrationGatePort`
- Enforce fencing (`fenceGeneration`), TTL, ≤4h authorized window, immediate contention
- Emit durable `connection.migration-gate` audits
- Expose same-transaction CAS predicates for future 04-D protected UPDATE

B-02 does **not** redesign B-01. If a genuine incompatibility is discovered, it is recorded as an explicit planning issue and planning stops. **No B-01 incompatibility was found.**

```text
PLANNING STATUS = READY FOR B-02 PLANNING REVIEW
```

---

## 2. Governance Baseline

| Artifact                             | Status                                       |
| ------------------------------------ | -------------------------------------------- |
| Parent FIV-CONN-04 Slice Approval    | GRANTED                                      |
| FIV-CONN-04-A                        | **CLOSED**                                   |
| FIV-CONN-04-B Planning + OD-B freeze | COMPLETE / FROZEN                            |
| Architecture Review                  | **PASS WITH CONDITIONS** (COND-ARCH-B01…B10) |
| Security Review                      | **PASS WITH CONDITIONS** (COND-SEC-B01…B11)  |
| Wave Implementation Authorization    | **GRANTED** (governance level)               |
| FIV-CONN-04-B-01                     | **CLOSED**                                   |
| FIV-CONN-04-B-02 Slice Approval      | **NOT GRANTED**                              |

### Frozen OD-B (not reopened)

| ID          | Binding essence                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| **OD-B-01** | GLOBAL AUTHORIZED MIGRATION WINDOW — global scope; max duration ≤4h; deny-set only; not permanent                       |
| **OD-B-02** | DENY credential store/replace/revoke (all connectionTypes); ALLOW NON-EXCHANGE create + rename                          |
| **OD-B-03** | ALLOW disconnect/disable (status-only); must not modify Vault / vaultSecretId / environment                             |
| **OD-B-04** | Dedicated singleton DB lease table + ConnectionsService deny hooks; advisory lock optional and **MUST NOT** be sole SoT |
| **OD-B-05** | TTL + heartbeat + fencing; stale holder cannot mutate; expiry allows new authorized acquire; operator reclaim audited   |
| **OD-B-06** | Durable Security Audit event family `connection.migration-gate`                                                         |
| **OD-B-07** | Normative operation matrix (deny/allow/privileged/public-env DENY; 04-D requires valid lease + fencing)                 |
| **OD-B-08** | Contention = immediate deterministic rejection; no queue / wait / blind retry                                           |

Parent freezes remain binding: **D-CONN-04-08 = B**; **D-CRED-02-12** (app write gate primary; advisory alone insufficient).

### Mandatory conditions B-02 must design for

- COND-ARCH-B01…B10
- COND-SEC-B01…B11
- SEC-B01…SEC-B14
- SEC-AC-23 / SEC-AC-24
- ST-B21…ST-B26 (B-02-owned subset + CAS surfaces)

---

## 3. B-01 Contract Dependency

B-02 **MUST implement** the closed B-01 surface. B-02 **MUST NOT** redesign it.

### 3.1 Canonical identity

```text
gateKey  = FIV-CONN-04
purpose  = FIV_CONN_04_MIGRATION_BACKFILL
```

Constants already shipped:

- `MIGRATION_GATE_KEY_FIV_CONN_04`
- `MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL`
- `MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS = 4h`
- `MIGRATION_GATE_NO_SOFT_REACQUIRE = true`

### 3.2 Observation state model (authoritative)

| State               | Durable meaning for B-02                                       |
| ------------------- | -------------------------------------------------------------- |
| `INACTIVE`          | Lease row exists; not held / released                          |
| `ACTIVE`            | Held, non-expired under DB time                                |
| `EXPIRED`           | Was ACTIVE but `expiresAt < DB now` (computed or transitioned) |
| `OWNERSHIP_LOST`    | Caller grant no longer matches durable holder/fence            |
| `CONTENTION_DENIED` | Acquire rejected because another ACTIVE authority exists       |
| `UNKNOWN`           | Unreadable / absent / malformed SoT → **DENY**                 |

```text
UNKNOWN => DENY
NEVER: UNKNOWN => ALLOW
```

### 3.3 Port surface B-02 must implement

```text
MigrationGatePort (MIGRATION_GATE_PORT Symbol)
  acquire(input) → grant | CONTENTION / reason
  release(input) → INACTIVE | EXPIRED | fail
  heartbeat(input) → updated grant | fail
  observe() → observation (+ optional grant) | UNKNOWN
  validate(grant) → ACTIVE grant | fail
```

### 3.4 Grant authority field

```text
fenceGeneration  — auditable fencing reference
fencingToken     — FORBIDDEN as authority / audit key (SENSITIVE_KEY /token/)
```

### 3.5 Compatibility verdict

| Check                                        | Result                                     |
| -------------------------------------------- | ------------------------------------------ |
| Port methods map 1:1 to durable ops          | Compatible                                 |
| Grant fields persistable                     | Compatible                                 |
| Reason codes sufficient for durable failures | Compatible                                 |
| Soft re-acquire forbidden                    | Compatible with CAS contention             |
| DB time preference for CAS                   | Compatible (B-02 introduces DB clock read) |
| Audit outcomes include reclaim/contention    | Compatible                                 |

```text
B-01 INCOMPATIBILITY = NONE
B-02 MUST NOT CHANGE B-01 CONTRACT FILES IN THIS PLANNING TASK
```

---

## 4. Repository Architecture Mapping

### 4.1 Connections module (canonical home)

| Pattern                  | Evidence                                              | B-02 use                                            |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------- |
| Flat module              | `apps/api/src/modules/connections/`                   | Colocate durable adapter + audit helper             |
| Closed contract          | `migration-gate.ts`, `migration-gate.port.ts`         | Import; do not rewrite                              |
| Symbol port              | `MIGRATION_GATE_PORT`                                 | Bind production adapter in `connections.module.ts`  |
| Validator port precedent | `CONNECTION_VALIDATOR` + `useExisting`                | Prefer `useFactory` for Prisma deps                 |
| Audit wrappers           | `connection-lifecycle-audit.ts`                       | Add `connection-migration-gate-audit.ts`            |
| Prisma usage today       | `ConnectionsService` injects `PrismaService` directly | Adapter may use Prisma + `PrismaTransactionService` |

### 4.2 Preferred concurrency analogue

| Pattern                            | Path                                                                             | Guidance                               |
| ---------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| In-txn version CAS                 | `PrismaTradingSessionRepository.saveIfVersion` (`updateMany` + expected version) | **Preferred** fencing pattern          |
| TradingSession lease columns       | `TradingSession.fencingToken`, `leaseExpiresAt`, …                               | **Inspiration only — DO NOT overload** |
| KillSwitch / LivePolicy satellites | workspace PK singletons                                                          | Pattern for dedicated satellite table  |
| Advisory locks                     | **None found** in repo                                                           | Optional only; never sole SoT          |

### 4.3 Security Audit

| Path                                               | Role                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `security-audit-classification.ts`                 | Register `connection.migration-gate` **before first emit** (COND-ARCH-B08)                       |
| `security-audit-attribution.ts`                    | Attribution rule must allow **optional** `workspaceId` for global acquire/release (COND-SEC-B06) |
| `SecurityAuditService.record(write, transaction?)` | Prefer same-txn append with lease mutation                                                       |
| `SENSITIVE_KEY`                                    | Forbids `/token/` — never emit `fencingToken`                                                    |

### 4.4 Transactions

`apps/api/src/storage/prisma/prisma-transaction.service.ts` — not used by connections today; **required** for B-02 lease mutations and for future 04-D same-txn CAS.

### 4.5 Prisma schema home

```text
apps/api/prisma/schema.prisma
apps/api/prisma/migrations/
```

Naming convention: `YYYYMMDDHHMMSS_v3_l02_fiv_conn_04_b_02_migration_gate_lease`

### 4.6 Explicit non-reuse

Do **not** reuse as lease SoT:

- `TradingSession`
- Workspace policy / KillSwitch
- `ConnectionRecord`
- Generic job lock tables
- Process-local mutex / in-memory maps

---

## 5. Durable Lease Architecture

### 5.1 Objective

One global durable row is the **only** production Source of Truth for whether FIV-CONN-04 migration authority is held.

```text
Application memory  = claim / cache only (never authoritative)
Database row        = durable authority
Advisory lock       = optional acquire serialization only (never sole SoT)
```

### 5.2 Logical lifecycle

```text
SEED (INACTIVE, fenceGeneration=0)
  → authorized acquire → ACTIVE (fenceGeneration += 1)
  → heartbeat (same owner+fence) → extends expiresAt ≤ authorizedUntil
  → release (same owner+fence) → INACTIVE
  → TTL expiry → EXPIRED observation; reclaimable by new authorized acquire
  → stale reclaim / operator reclaim → ACTIVE with advanced fenceGeneration
```

### 5.3 Authority invariant

Protected mutation (04-D) and holder ops (release/heartbeat) require proof of:

```text
gateKey = FIV-CONN-04
purpose = FIV_CONN_04_MIGRATION_BACKFILL
holderId = current durable holder
fenceGeneration = current durable fence
state = ACTIVE
expiresAt > DB NOW()
```

### 5.4 Absolute prohibition

```text
CHECK-THEN-SAVE ALONE IS FORBIDDEN
```

Example forbidden pattern:

1. `SELECT` lease
2. verify fence in application memory
3. later `UPDATE` protected Connection row **without** atomic fencing predicate in the same transaction

Why unsafe: between (2) and (3) another instance can reclaim, bump `fenceGeneration`, and the stale holder would still mutate protected state (TOCTOU / ST-B23).

---

## 6. Database Model

### 6.1 Recommended Prisma model

**Model name:** `ConnectionMigrationGateLease`  
**Table name:** `connection_migration_gate_leases`  
**Cardinality:** exactly **one** row for `gateKey = 'FIV-CONN-04'`  
**Not** one row per workspace / provider / environment / Connection.

### 6.2 Proposed schema (planning only — do not apply now)

```prisma
/// FIV-CONN-04-B-02 — global singleton migration-gate lease (durable SoT).
/// Not workspace-scoped. Do not overload TradingSession / ConnectionRecord.
model ConnectionMigrationGateLease {
  /// Fixed singleton identity — 'FIV-CONN-04'
  gateKey            String    @id @map("gate_key")
  /// Purpose binding — 'FIV_CONN_04_MIGRATION_BACKFILL'
  purpose            String
  /// Durable lifecycle: INACTIVE | ACTIVE (EXPIRED is computed vs DB time)
  state              String
  /// Current holder (null when INACTIVE)
  holderId           String?   @map("holder_id")
  /// Monotonic fencing generation (never named fencingToken)
  fenceGeneration    Int       @default(0) @map("fence_generation")
  /// Acquire instant (DB time at successful acquire); null when INACTIVE
  acquiredAt         DateTime? @map("acquired_at")
  /// TTL liveness tip; heartbeat may advance ≤ authorizedUntil
  expiresAt          DateTime? @map("expires_at")
  /// Hard ceiling duration in ms (≤ 4h); authorizedUntil = acquiredAt + this
  authorizedWindowMs Int?      @map("authorized_window_ms")
  /// Hard ceiling instant persisted for CAS clarity (must equal acquiredAt + window)
  authorizedUntil    DateTime? @map("authorized_until")
  /// Last successful heartbeat instant
  heartbeatAt        DateTime? @map("heartbeat_at")
  /// Privileged actor kind at acquire: SYSTEM_JOB | OPERATOR
  actorKind          String?   @map("actor_kind")
  /// Correlation / request id for audit
  correlationId      String?   @map("correlation_id")
  /// Schema evolution marker (satellite convention)
  schemaVersion      Int       @default(1) @map("schema_version")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  @@map("connection_migration_gate_leases")
}
```

### 6.3 Field rationale

| Field                     | Why required                                                          |
| ------------------------- | --------------------------------------------------------------------- |
| `gateKey`                 | Global identity; singleton PK; maps to grant.gateKey                  |
| `purpose`                 | Purpose-bound authority; reject mismatched purpose                    |
| `state`                   | Durable OFF/ON analogue (`INACTIVE`/`ACTIVE`)                         |
| `holderId`                | Owner for release/heartbeat/04-D CAS                                  |
| `fenceGeneration`         | Fencing authority; advances on every successful takeover              |
| `acquiredAt`              | Anchor for ≤4h authorized window                                      |
| `expiresAt`               | TTL liveness; distinct from max window                                |
| `authorizedWindowMs`      | Grant field persistence; ≤ `MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS`  |
| `authorizedUntil`         | Explicit ceiling for heartbeat CAS (`MIN(proposed, authorizedUntil)`) |
| `heartbeatAt`             | Audit/recovery evidence of liveness renewals                          |
| `actorKind`               | Privileged actor evidence (SYSTEM_JOB \| OPERATOR)                    |
| `correlationId`           | Audit correlation                                                     |
| `schemaVersion`           | Matches satellite table convention                                    |
| `createdAt` / `updatedAt` | Audit/recovery timestamps                                             |

### 6.4 Fields intentionally omitted

| Omitted                                     | Reason                                                           |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `workspaceId`                               | Gate is global (OD-B-01); would invite false workspace authority |
| `provider` / `environment` / `connectionId` | Forbidden scoping                                                |
| `fencingToken`                              | Forbidden name (audit / B-01)                                    |
| Queue / waiter columns                      | OD-B-08 forbids queue semantics                                  |
| Soft-reacquire counters                     | Soft re-acquire forbidden                                        |
| Emergency bypass flags                      | Forbidden                                                        |

### 6.5 Persisted vs computed observations

| Observation                                        | Persistence                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `INACTIVE`                                         | `state = INACTIVE`                                                                                    |
| `ACTIVE`                                           | `state = ACTIVE` AND `expiresAt > DB NOW()`                                                           |
| `EXPIRED`                                          | `state = ACTIVE` AND `expiresAt ≤ DB NOW()` **or** explicit transition to INACTIVE after reclaim prep |
| `OWNERSHIP_LOST` / `CONTENTION_DENIED` / `UNKNOWN` | **Not** stored as durable state; returned as operation outcomes                                       |

**Recommendation:** Keep durable `state` as `INACTIVE|ACTIVE` only. Compute `EXPIRED` on read using DB `NOW()`. On successful stale reclaim, atomically move EXPIRED→ACTIVE with new fence (do not require a third persisted enum value).

---

## 7. Singleton Enforcement

### 7.1 Primary enforcement

```text
PRIMARY KEY (gate_key) = 'FIV-CONN-04'
```

Migration **seeds exactly one row** in `INACTIVE` with `fenceGeneration = 0`.

### 7.2 Secondary backstops

| Control                                                                       | Role                                 |
| ----------------------------------------------------------------------------- | ------------------------------------ |
| Application refuse to INSERT additional keys                                  | Defense in depth                     |
| Unique PK                                                                     | DB backstop against duplicate rows   |
| Acquire uses `UPDATE` of the seeded row (not INSERT of a second active lease) | Prevents dual-active via insert race |
| Optional `SELECT … FOR UPDATE` on the singleton row inside acquire txn        | Serializes contending acquires       |
| `updateMany` CAS predicates                                                   | Prevent lost updates                 |

### 7.3 INSERT/UPDATE race

There is **no** “create lease row on first acquire” race in the approved design: seed at migration time. If seed row is missing → `UNKNOWN` / fail-closed (do not auto-create from hot path without audited migration repair).

If a buggy path attempts INSERT of another `gateKey`:

- Different key → reject in application (only `FIV-CONN-04` supported)
- Duplicate `FIV-CONN-04` → Prisma `P2002` → treat as `UNKNOWN` / fail-closed; never grant

### 7.4 Multiple application instances

All instances share the same DB row. Process-local maps are forbidden as SoT (COND-ARCH-B03). Two instances with the **same** logical operator identity still contend on the single ACTIVE row (R15).

---

## 8. Acquire Semantics

### 8.1 Preconditions (application, before/inside txn)

1. `assertAcquireInput` (B-01 pure): privileged actor + correct purpose + TTL ≤4h
2. Actor must be privileged path only (COND-SEC-B09 / ST-B21) — ordinary `VaultConnections` clients must not acquire
3. No soft re-acquire of an ACTIVE non-expired lease (even by same holder)

### 8.2 Durable algorithm (authoritative)

```text
BEGIN short transaction
  dbNow ← SELECT NOW()   -- DB authoritative clock
  lock singleton row FOR UPDATE (recommended)
  read row where gateKey = FIV-CONN-04

  if row missing OR malformed → UNKNOWN / GATE_UNKNOWN; ROLLBACK; audit if required
  if purpose column ≠ FIV_CONN_04_MIGRATION_BACKFILL → fail-closed (malformed SoT)

  if state = ACTIVE AND expiresAt > dbNow:
      → CONTENTION_DENIED / GATE_CONTENTION; commit or rollback (no mutation);
        audit gate_acquire_denied
      STOP

  // Eligible: INACTIVE OR (ACTIVE AND expiresAt ≤ dbNow)  [= stale reclaim path]
  ttlMs ← clamp(requestedTtlMs ?? DEFAULT_TTL_MS, 1 .. remainingOrMaxWindow)
  authorizedWindowMs ← min(requestedOrDefaultWindow, MAX_4H)  // typically = MAX or ops default ≤4h
  newFence ← fenceGeneration + 1
  acquiredAt ← dbNow
  authorizedUntil ← acquiredAt + authorizedWindowMs
  expiresAt ← min(acquiredAt + ttlMs, authorizedUntil)

  UPDATE row SET
    state = ACTIVE,
    holderId = actor.actorId,
    fenceGeneration = newFence,
    purpose = FIV_CONN_04_MIGRATION_BACKFILL,
    acquiredAt, expiresAt, authorizedWindowMs, authorizedUntil,
    heartbeatAt = dbNow,
    actorKind, correlationId, updatedAt
  WHERE gateKey = FIV-CONN-04
    AND (
      state = 'INACTIVE'
      OR (state = 'ACTIVE' AND expires_at <= dbNow)
    )
    AND fence_generation = <expected prior fence>   -- optimistic CAS

  if update count ≠ 1 → CONTENTION (lost race); audit gate_acquire_denied; STOP

  append Security Audit gate_acquired (same txn preferred)
COMMIT

return grant { gateKey, purpose, holderId, fenceGeneration:newFence, acquiredAt, expiresAt, authorizedWindowMs, correlationId? }
```

### 8.3 Properties

| Property             | Rule                                            |
| -------------------- | ----------------------------------------------- |
| Authorized           | Privileged actor only                           |
| Global               | Single `FIV-CONN-04` row                        |
| Purpose-bound        | Fixed purpose only                              |
| Immediate contention | No wait / queue / blind retry                   |
| Deterministic        | Same inputs + durable state → same result class |
| Failed acquire       | Must not leave partial ACTIVE authority         |

---

## 9. Contention Semantics

```text
ACTIVE + non-expired durable lease
  → acquire returns CONTENTION_DENIED / GATE_CONTENTION
  → no wait, no queue, no blind retry, no soft re-acquire
```

Applies even when the contending actor is the **same** logical operator (OD-B-08 + `MIGRATION_GATE_NO_SOFT_REACQUIRE`).

Second runner must not start 04-D. Audit: `gate_acquire_denied` (and/or `acquire_timeout` only if a future outer deadline exists — default path is immediate contention, not timeout).

---

## 10. Fencing Architecture

### 10.1 Invariant

```text
Every successful takeover MUST advance fenceGeneration.
A stale holder MUST be unable to mutate protected state after a newer acquire.
```

### 10.2 What fencing MUST NOT rely on

- Application-memory checks alone
- Check-then-save alone
- Stale cached grant
- Timestamp comparison alone (without fence + owner + state CAS)

### 10.3 Protected mutation CAS predicate (04-D / B-02 export)

Within the **same DB transaction** as the protected `ConnectionRecord` UPDATE:

```text
UPDATE connection_migration_gate_leases
SET /* no authority change required; optional heartbeat touch forbidden unless intentional */
WHERE gate_key = 'FIV-CONN-04'
  AND purpose = 'FIV_CONN_04_MIGRATION_BACKFILL'
  AND holder_id = :holderId
  AND fence_generation = :fenceGeneration
  AND state = 'ACTIVE'
  AND expires_at > NOW()     -- DB time
RETURNING 1

-- AND only if count = 1:
UPDATE connection_records SET environment = :newEnv, updated_at = ...
WHERE id = :connectionId AND workspace_id = :workspaceId AND ...row predicates...
```

Equivalent form: join/exists predicate or sequential `updateMany` CAS on lease then Connection inside one `PrismaTransactionService.run`.

```text
CAS PREDICATE =
  gateKey + purpose + holderId + fenceGeneration + ACTIVE + not-expired(DB NOW)
```

B-01 `assertPrivilegedEnvironmentUpdateAllowed` remains a **pure pre-check only** and is **insufficient alone**.

---

## 11. Fence Generation Rules

| Event                                          | `fenceGeneration` behavior                                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed / initial                                 | `0` while INACTIVE                                                                                                                                               |
| First successful acquire                       | `0 → 1`                                                                                                                                                          |
| Successful stale reclaim                       | `N → N+1`                                                                                                                                                        |
| Successful operator reclaim                    | `N → N+1` (mandatory; COND-ARCH-B06)                                                                                                                             |
| Heartbeat success                              | **Unchanged**                                                                                                                                                    |
| Release success                                | **Unchanged** (authority ends via state=INACTIVE; fence retained as last-issued)                                                                                 |
| Failed acquire (contention)                    | **Unchanged**                                                                                                                                                    |
| Failed heartbeat / release                     | **Unchanged**                                                                                                                                                    |
| Transaction rollback after tentative increment | Increment **does not persist**; no authority granted                                                                                                             |
| Overflow                                       | Use signed 32-bit Prisma `Int`; if approaching `2^31-1`, fail-closed and require PO ops procedure (extremely unlikely at human acquire rates). Do not wrap to 0. |

### Stale holder behavior

Any op presenting `fenceGeneration < durable` (or mismatched holder) → reject with `GATE_FENCE_MISMATCH` / `GATE_OWNERSHIP_LOST` / `stale_holder_rejected` audit. Must not release or heartbeat the newer lease.

### Failed acquisition

Must not accidentally grant authority: only commit ACTIVE after successful CAS `count = 1`.

---

## 12. TTL

### 12.1 Distinction (COND-ARCH-B02)

```text
TTL (expiresAt)              = liveness tip; may be short; renew via heartbeat
Maximum authorized window    = hard ceiling from acquiredAt; ≤ 4 hours
TTL ≠ maximum authorized window
```

### 12.2 Recommended defaults (open technical/ops — see §31)

| Parameter                 | Recommended default                                              | Notes                                                              |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Default initial TTL       | **15 minutes**                                                   | Short enough for crash fail-closed; long enough for backfill steps |
| Default authorized window | **4 hours** (max)                                                | May be tightened by ops ≤4h without reopening OD-B-01              |
| Heartbeat cadence         | **≤ 5 minutes**                                                  | Must renew before TTL elapses                                      |
| Acceptable clock skew     | Prefer **DB NOW()** for all CAS; app clock only for logs/display | Avoid app-vs-DB skew as authority                                  |

### 12.3 Expiration semantics

- While `state=ACTIVE` and `expiresAt ≤ DB NOW()` → observation `EXPIRED`
- Expired authority **cannot** heartbeat or authorize 04-D
- Expired authority **can** be reclaimed by a new authorized acquire (bumps fence)

### 12.4 Resurrection prohibition

Heartbeat / release / validate MUST NOT revive an expired lease into ACTIVE without a new acquire/reclaim path that advances fencing.

---

## 13. Maximum Authorized Window

```text
authorizedUntil = acquiredAt + authorizedWindowMs
authorizedWindowMs ∈ (0, MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS]
authorizedUntil ≤ acquiredAt + 4h
```

Validation:

- On acquire: reject if requested window/TTL would exceed 4h (`GATE_MAX_WINDOW_EXCEEDED`)
- On heartbeat: `proposedExpiresAt ≤ authorizedUntil` and `proposedExpiresAt > DB NOW()`
- Persist both `authorizedWindowMs` and `authorizedUntil` so CAS does not re-derive incorrectly under clock ambiguity

Heartbeat **never** extends `authorizedUntil` / `acquiredAt`.

---

## 14. Heartbeat

### 14.1 Port

`heartbeatMigrationGate` ≡ `MigrationGatePort.heartbeat`

### 14.2 Requirements

| Check             | Rule                                                |
| ----------------- | --------------------------------------------------- |
| Owner             | `grant.holderId` = durable `holderId`               |
| Fence             | `grant.fenceGeneration` = durable `fenceGeneration` |
| State             | durable `ACTIVE`                                    |
| Expiry            | durable `expiresAt > DB NOW()` (no resurrection)    |
| Purpose / gateKey | must match                                          |
| Ceiling           | new `expiresAt ≤ authorizedUntil`                   |
| Atomicity         | single `updateMany` CAS                             |

### 14.3 CAS (illustrative)

```text
UPDATE ... SET expires_at = :proposed, heartbeat_at = NOW()
WHERE gate_key = 'FIV-CONN-04'
  AND purpose = :purpose
  AND holder_id = :holderId
  AND fence_generation = :fenceGeneration
  AND state = 'ACTIVE'
  AND expires_at > NOW()
  AND :proposed <= authorized_until
  AND :proposed > NOW()
```

`count ≠ 1` → `GATE_HEARTBEAT_REJECTED` / `GATE_EXPIRED` / `GATE_FENCE_MISMATCH` as mapped; audit `gate_heartbeat_failed` or `heartbeat_rejected` / `stale_holder_rejected`.

---

## 15. Release

### 15.1 Port

`releaseMigrationGate` ≡ `MigrationGatePort.release`

### 15.2 Normal release CAS

```text
UPDATE ... SET
  state = 'INACTIVE',
  holder_id = NULL,
  acquired_at = NULL,
  expires_at = NULL,
  authorized_window_ms = NULL,
  authorized_until = NULL,
  heartbeat_at = NULL,
  actor_kind = NULL
  -- retain fenceGeneration (last issued) and purpose/gateKey
WHERE gate_key = 'FIV-CONN-04'
  AND holder_id = :holderId
  AND fence_generation = :fenceGeneration
  AND state = 'ACTIVE'
```

Success → `{ ok:true, observation:'INACTIVE' }` + audit `gate_released`.

### 15.3 Edge behaviors

| Case                                | Result                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expired lease, matching owner+fence | Prefer `{ ok:true, observation:'EXPIRED' }` after transitioning to INACTIVE **or** reject with `GATE_EXPIRED` then allow reclaim-only — **Recommendation:** CAS release allowed on ACTIVE-or-EXPIRED matching owner+fence → INACTIVE; return `EXPIRED` if `expiresAt ≤ now` else `INACTIVE` |
| Already INACTIVE                    | `GATE_ALREADY_INACTIVE`                                                                                                                                                                                                                                                                     |
| Ownership lost / fence mismatch     | Fail; **must not** clear newer lease; audit `stale_holder_rejected`                                                                                                                                                                                                                         |
| Stale owner vs newer acquire        | Fail (R04)                                                                                                                                                                                                                                                                                  |

Stale owner **MUST NOT** release a newer lease.

---

## 16. Stale Reclaim

### 16.1 Automatic stale reclaim (via acquire)

When durable lease is expired (`ACTIVE` with `expiresAt ≤ DB NOW()` or equivalent), a **new authorized acquire** may take over:

1. Atomically establish new ownership
2. Advance `fenceGeneration`
3. Preserve singleton
4. Invalidate old owner for mutation/heartbeat/release
5. Emit `lease_expired_reclaim` and/or `gate_stale_reclaim` + `gate_acquired`

### 16.2 Operator reclaim (before TTL)

Allowed only via separately authorized privileged procedure (OD-B-05):

- Must bump fencing
- Must emit durable audit
- Must not create an ungated emergency bypass
- Ordinary clients cannot invoke (COND-SEC-B09)

**Planning recommendation:** Implement operator reclaim as an explicit privileged method on the adapter (not on public Connections HTTP), reusing the same CAS takeover path with an audited reason code. Exact HTTP/admin surface may remain runbook-level until a later slice — but the durable semantics must exist in B-02.

### 16.3 Forbidden

- Silent takeover of non-expired ACTIVE lease
- Force-unlock for ordinary users
- Reclaim without fence bump

---

## 17. Multi-Instance Concurrency

| ID      | Race                             | Expected result                                                                                        | Txn boundary                | Fencing                                                | Audit                                                  | Safety invariant                             |
| ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| **R01** | Two simultaneous acquires        | Exactly one success; other `CONTENTION_DENIED`                                                         | Single-row FOR UPDATE + CAS | Winner advances fence once                             | One `gate_acquired`; one `gate_acquire_denied`         | Never two ACTIVE authorities                 |
| **R02** | Acquire vs heartbeat             | If acquire wins first on expired: heartbeat fails; if heartbeat renews before expiry: acquire contends | Short txns                  | Heartbeat does not bump; acquire bumps only on success | Heartbeat fail or contention                           | No dual ACTIVE                               |
| **R03** | Acquire vs release               | Release clears only matching fence; concurrent acquire on expired path CAS-ordered                     | Short txns                  | Release keeps fence number; acquire bumps              | `gate_released` or contention/acquire                  | No half-on without row evidence              |
| **R04** | Stale release vs new acquire     | Stale release fails after new fence                                                                    | CAS on holder+fence         | New fence preserved                                    | `stale_holder_rejected`                                | Stale cannot clear new                       |
| **R05** | Stale heartbeat vs new acquire   | Stale heartbeat fails                                                                                  | CAS                         | New fence preserved                                    | `gate_heartbeat_failed` / `stale_holder_rejected`      | Stale cannot extend new                      |
| **R06** | Two simultaneous stale takeovers | Exactly one wins                                                                                       | FOR UPDATE + CAS            | Exactly one bump                                       | One reclaim+acquire; one denied                        | Singleton preserved                          |
| **R07** | Heartbeat at expiration boundary | `expires_at > NOW()` predicate; at equality → fail closed                                              | DB NOW()                    | Unchanged                                              | heartbeat rejected                                     | No resurrection                              |
| **R08** | Acquire at expiration boundary   | `expires_at <= NOW()` eligible for reclaim                                                             | DB NOW()                    | Bump on success                                        | reclaim+acquire                                        | Deterministic boundary                       |
| **R09** | Crash after acquire commit       | Lease remains ACTIVE until TTL/release                                                                 | N/A                         | Intact                                                 | Prior `gate_acquired`                                  | Memory not SoT; deny-set stays denied (B-03) |
| **R10** | Crash during release             | Either released or still ACTIVE; never corrupt fence                                                   | Txn atomicity               | Unchanged or cleared holder consistently               | At most one `gate_released`                            | No silent unlock without CAS                 |
| **R11** | Crash during heartbeat           | Prior or new expiresAt atomically                                                                      | Txn atomicity               | Unchanged                                              | Optional fail audit if rolled back                     | No partial write                             |
| **R12** | Rollback during takeover         | No fence bump persisted; no ACTIVE grant                                                               | Rollback                    | Unchanged                                              | No success audit                                       | Failed acquire ≠ authority                   |
| **R13** | DB failure during validate       | `UNKNOWN` → DENY                                                                                       | Read fails closed           | N/A                                                    | Optional DB-failure audit                              | Uncertainty ≠ permission                     |
| **R14** | DB failure during acquire        | Fail closed; no grant                                                                                  | Abort                       | Unchanged                                              | `gate_acquire_denied` / fail audit if durable possible | No half-on                                   |
| **R15** | Two instances, same operator     | Still exclusive; second contends                                                                       | Same as R01                 | Same                                                   | Same                                                   | Operator identity ≠ soft re-acquire          |

---

## 18. Database Clock

```text
Authoritative for expiry / CAS / heartbeat / stale takeover: DB NOW() (PostgreSQL)
Application Date/ISO: display, grant serialization, logging only — must not override DB authority
```

Implementation approach (planning):

- Inside lease transactions, read `SELECT NOW()` once (or use SQL `NOW()` in `WHERE` predicates)
- Persist `acquiredAt` / `expiresAt` / `authorizedUntil` as DB timestamps
- Serialize grant ISO strings from those committed values
- Do not compare solely with `Date.now()` for authority decisions

Clock skew between app nodes is irrelevant if CAS predicates use DB time.

---

## 19. Transaction Boundaries

### Global rules

```text
Short DB transactions only
NO Vault I/O inside lease txn
NO external HTTP inside lease txn
NO network calls inside lease txn
NO user-controlled waits inside lease txn
```

| Operation                 | Txn required?                                             | Isolation                                                                    | SQL/Prisma                    | CAS predicate                           | Commit point                                                                          |
| ------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| **Acquire**               | YES                                                       | Default READ COMMITTED + row lock sufficient with CAS; optional `FOR UPDATE` | `updateMany` / raw            | inactive OR expired + expected fence    | After lease+audit success                                                             |
| **Release**               | YES                                                       | Same                                                                         | `updateMany`                  | holder+fence+ACTIVE (or expired-hold)   | After clear+audit                                                                     |
| **Heartbeat**             | YES                                                       | Same                                                                         | `updateMany`                  | holder+fence+ACTIVE+not expired+ceiling | After extends+audit (audit optional on success; required on security-relevant reject) |
| **Observe**               | NO (read-only)                                            | —                                                                            | `findUnique`                  | none                                    | N/A; failure → UNKNOWN                                                                |
| **Validate**              | NO for read validate; YES when used as part of 04-D write | —                                                                            | read or CAS                   | grant vs durable                        | Validate alone never writes                                                           |
| **Stale reclaim**         | YES (as acquire path)                                     | Same as acquire                                                              | Same                          | expired + fence CAS                     | Same as acquire                                                                       |
| **04-D protected UPDATE** | YES (later slice)                                         | Same txn as Connection UPDATE                                                | lease CAS + Connection UPDATE | full fencing predicate                  | Single commit                                                                         |

---

## 20. Prisma Strategy

| Topic              | Decision                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Model name         | `ConnectionMigrationGateLease`                                                                   |
| Table map          | `connection_migration_gate_leases`                                                               |
| Enum vs string     | **String** for `state` / `purpose` / `actorKind` (matches Connection/TradingSession conventions) |
| PK                 | `gateKey` string                                                                                 |
| Indexes            | PK sufficient; optional index on `expiresAt` not required for singleton                          |
| Unique constraints | PK enforces singleton key                                                                        |
| Migration name     | `YYYYMMDDHHMMSS_v3_l02_fiv_conn_04_b_02_migration_gate_lease`                                    |
| Seed               | INSERT inactive singleton `FIV-CONN-04`                                                          |
| Transaction API    | `PrismaTransactionService.run` + optional `TransactionContext` into audit                        |
| Error handling     | Map `P2002` / zero `updateMany` counts to contention/UNKNOWN; never to ALLOW                     |
| Fencing column     | `fenceGeneration` / `fence_generation` — **not** `fencing_token`                                 |

**Do not create migration in this planning task.**

---

## 21. ConnectionsService Integration Boundary

```text
B-02 implements MigrationGatePort durable adapter + Nest binding
B-02 does NOT implement ConnectionsService deny hooks (B-03)
```

### B-02 delivers

- `PrismaMigrationGateAdapter` (name illustrative) `implements MigrationGatePort`
- Provider binding for `MIGRATION_GATE_PORT` in `connections.module.ts`
- Export port if needed by future 04-D runner modules
- Readable durable ON/OFF via `observe()` / `validate()`

### B-03 will consume

- Inject `MIGRATION_GATE_PORT`
- Call `observe()` / helpers (`shouldBlockDenySetMutation`, etc.) at deny-set entry points
- Re-validate after Vault I/O before Connection bind (SEC-AC-23) — **not B-02**

### Explicit non-scope for B-02

No hooks in `storeCredentials` / `replaceCredentials` / `revoke` / `create` / rename/disconnect/disable paths.

---

## 22. 04-D Integration Boundary

```text
B-02 supplies durable authority + CAS primitive
04-D performs privileged Connection.environment UPDATE + backfill
04-D = NOT AUTHORIZED in this planning task
```

### Required proof for protected UPDATE

04-D must prove in the **same transaction**:

- global gate `FIV-CONN-04`
- purpose `FIV_CONN_04_MIGRATION_BACKFILL`
- current owner
- current `fenceGeneration`
- `ACTIVE`
- not expired (DB time)

B-02 should expose a narrow internal helper (e.g. `assertDurableAuthorityCas(tx, grant)`) usable by 04-D without encouraging check-then-save.

Public environment UPDATE remains **DENY** (OD-B-07).

---

## 23. Observe / Validate

### Observe (`observeMigrationGate`)

- Reads durable singleton row
- Maps to observation (`INACTIVE` / `ACTIVE` / `EXPIRED`)
- May include grant projection when ACTIVE
- DB failure / missing row / malformed → `{ ok:false, observation:'UNKNOWN', reason:GATE_UNKNOWN }`
- **Never grants authority**
- No authoritative cache

### Validate (`validateMigrationGate`)

- Reads authoritative durable state
- Verifies gateKey, purpose, owner, fence, state, expiry vs DB time
- Success only when durable ACTIVE and grant matches
- Unreadable → UNKNOWN ⇒ DENY
- Grant alone never authorizes 04-D write without same-txn CAS

---

## 24. Failure Semantics

| Condition                 | Result                                                       |
| ------------------------- | ------------------------------------------------------------ |
| No row                    | `UNKNOWN` / `GATE_UNKNOWN` → DENY                            |
| Active contention         | `CONTENTION_DENIED` / `GATE_CONTENTION`                      |
| Expired                   | `EXPIRED` / `GATE_EXPIRED`                                   |
| Owner mismatch            | `OWNERSHIP_LOST` / `GATE_OWNERSHIP_LOST`                     |
| Fence mismatch            | `GATE_FENCE_MISMATCH` (+ ownership lost observation)         |
| Purpose mismatch          | `GATE_PURPOSE_MISMATCH`                                      |
| GateKey mismatch          | `GATE_KEY_MISMATCH`                                          |
| DB unavailable            | `UNKNOWN` → DENY                                             |
| Transaction failure       | Fail closed; no grant                                        |
| Malformed persisted state | `UNKNOWN` → DENY                                             |
| Stale reclaim race lost   | `GATE_CONTENTION`                                            |
| Release race lost         | Fail; do not clear newer                                     |
| Heartbeat race lost       | `GATE_HEARTBEAT_REJECTED` / fence/owner/expiry mapped reason |

```text
Never convert database uncertainty into permission.
```

---

## 25. Audit Architecture

### Event family

```text
eventType = connection.migration-gate
eventClass = connection
```

Do **not** overload `connection.lifecycle`.

### Catalog prerequisite (COND-ARCH-B08)

Before first emit, register in:

- `security-audit-classification.ts`
- `security-audit-attribution.ts` — **require `actorId`; do not require `workspaceId` for global gate lifecycle**; require `workspaceId` only when payload targets a workspace mutation (B-03 blocked-mutation path)

### Outcomes B-02 must emit (as applicable)

| Outcome                                           | When                                                |
| ------------------------------------------------- | --------------------------------------------------- |
| `gate_acquired`                                   | Successful acquire / reclaim acquire                |
| `gate_acquire_denied`                             | Contention / unauthorized / malformed               |
| `gate_released`                                   | Successful release                                  |
| `gate_expired`                                    | Observable expiry transition if explicitly recorded |
| `lease_expired_reclaim`                           | Stale reclaim success                               |
| `gate_stale_reclaim`                              | Stale reclaim success (alias family member)         |
| `gate_heartbeat_failed` / `heartbeat_rejected`    | Failed heartbeat                                    |
| `gate_fencing_rejected` / `stale_holder_rejected` | Fence/owner mismatch                                |
| `acquire_timeout`                                 | Only if outer deadline exists (optional)            |

`lifecycle_mutation_blocked` → **B-03** (not B-02).

### Safe payload keys

Use B-01 allowlist: `gateKey`, `purpose`, `holderId`, `fenceGeneration`, `acquiredAt`, `expiresAt`, `authorizedWindowMs`, `operation`, `result`, `reasonCode`, `correlationId`, `workspaceId`, `connectionId`, `outcome`, `observation`.

### Forbidden

Secrets, credentials, Vault values, raw `fencingToken`, any `SENSITIVE_KEY` matching field names.

---

## 26. Security Condition Mapping

| Condition                     | B-02 design control                                                           |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **COND-ARCH-B01**             | Heartbeat CAS clamps to `authorizedUntil`; tests ST-B22                       |
| **COND-ARCH-B02**             | Distinct TTL vs max window fields                                             |
| **COND-ARCH-B03**             | Dedicated DB singleton SoT; no process-local authority                        |
| **COND-ARCH-B04**             | Documented same-txn CAS predicate for 04-D; helper surface                    |
| **COND-ARCH-B05**             | Durable ON readable via observe (hooks = B-03)                                |
| **COND-ARCH-B06**             | Operator/stale reclaim bumps fence + audit                                    |
| **COND-ARCH-B07**             | `fenceGeneration` only; sanitizer                                             |
| **COND-ARCH-B08**             | Catalog registration before emit                                              |
| **COND-ARCH-B09**             | UNKNOWN on read failure                                                       |
| **COND-ARCH-B10**             | No Vault/external I/O in lease txns                                           |
| **COND-SEC-B01**              | Window/TTL enforcement with DB time                                           |
| **COND-SEC-B02**              | CAS required; check-then-save forbidden                                       |
| **COND-SEC-B03**              | Reclaim bumps fence + audit                                                   |
| **COND-SEC-B04**              | Port is the only acquire path (no ungated twin in B-02)                       |
| **COND-SEC-B05**              | 04-D must hold lease (integration contract)                                   |
| **COND-SEC-B06**              | Attribution: no false foreign workspace on global events                      |
| **COND-SEC-B07**              | Sensitive key hygiene                                                         |
| **COND-SEC-B08**              | Deny hooks = B-03 (boundary respected)                                        |
| **COND-SEC-B09** / **ST-B21** | Privileged-only acquire                                                       |
| **COND-SEC-B10**              | UNKNOWN ⇒ DENY                                                                |
| **COND-SEC-B11**              | ST-B21…26 coverage plan                                                       |
| **SEC-B01…B02**               | Global gate ≠ cross-workspace data access                                     |
| **SEC-B03…B04**               | No provider/env-only lock identity                                            |
| **SEC-B05** / **SEC-AC-24**   | Zero Vault/env UPDATE in B-02                                                 |
| **SEC-B06**                   | No secret leakage                                                             |
| **SEC-B07**                   | OD-B-08 contention                                                            |
| **SEC-B08**                   | Stale fencing                                                                 |
| **SEC-B09**                   | Retries cannot bypass (CAS)                                                   |
| **SEC-B10**                   | Bypass sealing deferred to B-03; B-02 provides SoT                            |
| **SEC-B11**                   | Multi-instance durable row                                                    |
| **SEC-B12**                   | Required gate audits                                                          |
| **SEC-B13**                   | Ordinary clients cannot acquire                                               |
| **SEC-B14**                   | TTL + max window + release prevent permanent freeze                           |
| **SEC-AC-23**                 | Durable ON observability for mid-flight recheck (enforcement B-03)            |
| **ST-B21**                    | Unauthorized acquire denied                                                   |
| **ST-B22**                    | Heartbeat ceiling                                                             |
| **ST-B23**                    | Stale owner UPDATE rejected (CAS contract tests in B-02; full 04-D E2E later) |
| **ST-B24**                    | Operator reclaim fence bump + audit                                           |
| **ST-B25**                    | Mid-flight bind fail-closed → B-03                                            |
| **ST-B26**                    | Audit sensitive-key / fenceGeneration                                         |

### Explicit coverage themes

- TOCTOU → same-txn CAS
- Stale authority → fence bump + reject
- Crash/restart → DB SoT survives
- TTL / ≤4h → distinct fields + clamps
- Multi-instance → singleton row + CAS
- Fail-closed → UNKNOWN/DENY
- No bypass / no generic freeze expansion
- Workspace isolation distinction → no workspace PK on lease
- Replay → fence+expiry predicates

---

## 27. Operation Matrix

B-02 **does not reinterpret** the B-01 matrix.

| Class                                                   | Operations                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **DENY** (when ACTIVE\|UNKNOWN; enforced later by B-03) | credential store/replace/revoke; EXCHANGE create                                    |
| **ALLOW**                                               | rename; disconnect; disable; NON-EXCHANGE create; reads; validation                 |
| **Public environment UPDATE**                           | DENY                                                                                |
| **04-D privileged environment UPDATE**                  | Requires valid durable migration authority (B-02) + same-txn CAS; execution in 04-D |

```text
B-02 supplies authority
B-03 supplies lifecycle enforcement
04-D supplies privileged UPDATE/backfill
```

Model C (Vault purpose SoT) and Strategy B (workspace+provider+environment uniqueness) remain **untouched**.

---

## 28. Audit Atomicity

| Operation                   | Prefer lease mutation + audit same txn?                                                                | Recommendation                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Acquire                     | **YES**                                                                                                | Same txn; if audit append fails → rollback acquire (fail closed; do not proceed to 04-D) |
| Stale reclaim               | **YES**                                                                                                | Same as acquire                                                                          |
| Release                     | **YES**                                                                                                | Same txn                                                                                 |
| Heartbeat success           | Preferred YES; acceptable after-commit if documented                                                   | Prefer same txn for simplicity                                                           |
| Heartbeat/fencing rejection | YES when a durable reject marker is written; else best-effort durable audit outside if no state change | Do not weaken: attempt durable audit; never convert audit failure into ALLOW             |
| Observe/validate            | N/A (no state change)                                                                                  | —                                                                                        |

### Risk if audit cannot share txn

If `SecurityAuditService` cannot accept `TransactionContext` for this event type after catalog work, document mitigation:

1. Commit lease
2. Immediately append audit
3. If audit fails after successful acquire → **fail closed for 04-D start** until audit recorded or operator aborts (OD-B-06 spirit)

Do **not** invent a new audit architecture. Reuse existing `SecurityAuditService` + catalog.

**Repo note:** `SecurityAuditService.record` already accepts optional `TransactionContext` — prefer using it.

---

## 29. Test Strategy

Plan (do not execute implementation tests now):

| ID  | Area                  | Focus                                                 |
| --- | --------------------- | ----------------------------------------------------- |
| A   | Schema constraints    | PK singleton; column types; seed row                  |
| B   | Singleton enforcement | No second active authority; P2002 handling            |
| C   | Acquire               | Happy path grant fields                               |
| D   | Contention            | Immediate `CONTENTION_DENIED`                         |
| E   | Expiry                | ACTIVE→EXPIRED observation via DB time                |
| F   | Stale takeover        | Expired reclaim success                               |
| G   | Fence increment       | Every takeover bumps exactly once                     |
| H   | Stale release         | Cannot clear newer lease                              |
| I   | Stale heartbeat       | Cannot renew newer lease                              |
| J   | Concurrent takeover   | Dual client; one winner                               |
| K   | Heartbeat ceiling     | Cannot exceed `authorizedUntil`                       |
| L   | ≤4h maximum           | Reject oversized window/TTL                           |
| M   | DB clock              | CAS uses `NOW()` predicates                           |
| N   | Transaction rollback  | Rollback grants no authority / no fence bump          |
| O   | DB failure            | UNKNOWN/DENY                                          |
| P   | UNKNOWN ⇒ DENY        | Missing/malformed row                                 |
| Q   | Observe vs validate   | Observe non-authorizing; validate strict              |
| R   | 04-D CAS contract     | Helper proves predicate; check-then-save insufficient |
| S   | Audit                 | Outcomes + no secrets/`fencingToken`                  |
| T   | Multi-instance        | R01–R15 subset automated                              |
| U   | Restart/crash         | Lease survives process death                          |

### Required security tests where applicable

- **ST-B21** unauthorized acquire
- **ST-B22** heartbeat ≤4h ceiling
- **ST-B23** stale fence CAS rejection (contract/integration)
- **ST-B24** operator reclaim fence+audit
- **ST-B25** deferred to B-03
- **ST-B26** audit key hygiene

---

## 30. Acceptance Criteria (B02-AC01…B02-AC33)

| ID           | Criterion                                                | Design status            |
| ------------ | -------------------------------------------------------- | ------------------------ |
| **B02-AC01** | Dedicated durable singleton lease model exists in design | PASS (planned)           |
| **B02-AC02** | Global gate identity enforced                            | PASS (`FIV-CONN-04` PK)  |
| **B02-AC03** | Purpose is `FIV_CONN_04_MIGRATION_BACKFILL`              | PASS                     |
| **B02-AC04** | No workspace/provider/environment-specific lease rows    | PASS                     |
| **B02-AC05** | Database is durable Source of Truth                      | PASS                     |
| **B02-AC06** | Concurrent acquire cannot grant two active authorities   | PASS (CAS + PK)          |
| **B02-AC07** | Contention is immediate deterministic rejection          | PASS                     |
| **B02-AC08** | Expired authority can be safely reclaimed                | PASS                     |
| **B02-AC09** | Every successful takeover advances `fenceGeneration`     | PASS                     |
| **B02-AC10** | Stale authority cannot release newer authority           | PASS                     |
| **B02-AC11** | Stale authority cannot heartbeat newer authority         | PASS                     |
| **B02-AC12** | Protected mutation requires current fencing              | PASS (CAS predicate)     |
| **B02-AC13** | Check-then-save alone is forbidden                       | PASS (explicit)          |
| **B02-AC14** | Atomic same-transaction CAS is defined                   | PASS                     |
| **B02-AC15** | TTL distinct from maximum authorized window              | PASS                     |
| **B02-AC16** | Maximum authorized window ≤4h                            | PASS                     |
| **B02-AC17** | Heartbeat cannot extend beyond `authorizedUntil`         | PASS                     |
| **B02-AC18** | Expired authority cannot be resurrected                  | PASS                     |
| **B02-AC19** | DB authoritative time used for concurrency decisions     | PASS                     |
| **B02-AC20** | Unknown/unreadable state is fail-closed                  | PASS                     |
| **B02-AC21** | Release is owner+fence protected                         | PASS                     |
| **B02-AC22** | Stale reclaim is fenced and audited                      | PASS                     |
| **B02-AC23** | Audit event family is `connection.migration-gate`        | PASS                     |
| **B02-AC24** | Audit contains no secrets/raw `fencingToken`             | PASS                     |
| **B02-AC25** | Multi-instance races are covered                         | PASS (R01–R15)           |
| **B02-AC26** | No application-memory SoT                                | PASS                     |
| **B02-AC27** | No supported application bypass                          | PASS (within B-02 scope) |
| **B02-AC28** | Model C remains untouched                                | PASS                     |
| **B02-AC29** | Strategy B remains untouched                             | PASS                     |
| **B02-AC30** | No Vault/credential/external I/O performed               | PASS (non-scope)         |
| **B02-AC31** | B-02 does not implement B-03 hooks                       | PASS                     |
| **B02-AC32** | B-02 does not implement 04-D UPDATE/backfill             | PASS                     |
| **B02-AC33** | B-02 compatible with closed B-01 contract                | PASS                     |

Additional design obligations (not new ACs): COND-ARCH/COND-SEC mapping in §26; catalog registration before emit.

---

## 31. Open PO/Governance Decisions

OD-B-01…08 are **not** reopened. The following are residual choices:

| ID             | Topic                            | Recommendation                                                                                      | Tradeoff                                                        | Owner                                                                                  |
| -------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **OD-B02-T1**  | Exact default lease TTL          | **15 minutes**                                                                                      | Shorter → faster reclaim after crash; longer → fewer heartbeats | **Technical/ops** (within ≤4h ceiling)                                                 |
| **OD-B02-T2**  | Heartbeat cadence                | **≤5 minutes** (renew before TTL)                                                                   | Too rare → false expiry; too frequent → write chatter           | **Technical/ops**                                                                      |
| **OD-B02-T3**  | Default authorized window        | **4h max** unless ops tightens                                                                      | Tightening reduces exposure; must remain > TTL                  | **Ops** under frozen OD-B-01                                                           |
| **OD-B02-T4**  | Stale reclaim threshold          | Reclaim when `expiresAt ≤ DB NOW()` (no extra grace)                                                | Grace complicates clocks; zero grace is fail-closed             | **Technical**                                                                          |
| **OD-B02-T5**  | Operator reclaim before TTL      | Privileged adapter method + mandatory fence bump + audit; no public HTTP in B-02 unless PO requires | Runbook-only vs API                                             | **PO/Governance** if HTTP surface required; otherwise **Technical** for durable method |
| **OD-B02-T6**  | Persisted state representation   | Durable `INACTIVE\|ACTIVE` only; `EXPIRED` computed                                                 | Fewer invalid states vs explicit EXPIRED column                 | **Technical**                                                                          |
| **OD-B02-T7**  | Audit atomicity                  | Same txn with lease mutation via `TransactionContext`                                               | Strongest durability vs slightly longer txn                     | **Technical** (aligned with existing audit API)                                        |
| **OD-B02-T8**  | DB isolation / locking           | READ COMMITTED + `SELECT FOR UPDATE` on singleton + `updateMany` CAS                                | Serializable heavier than needed for single-row CAS             | **Technical**                                                                          |
| **OD-B02-T9**  | Singleton key representation     | PK string `'FIV-CONN-04'`                                                                           | Matches B-01 literal; no surrogate UUID                         | **Technical** (frozen identity)                                                        |
| **OD-B02-T10** | Persist `authorizedUntil` column | **Yes** (in addition to `authorizedWindowMs`)                                                       | Slight redundancy; clearer CAS                                  | **Technical**                                                                          |

```text
No silent freeze of new policy decisions beyond recommendations above.
TTL/cadence values are recommendations pending B-02 Planning Review confirmation.
```

---

## 32. Risks

| ID    | Risk                                       | Mitigation                                              |
| ----- | ------------------------------------------ | ------------------------------------------------------- |
| RK-01 | Check-then-save regression in 04-D         | Explicit CAS helper + ST-B23 tests; review gate         |
| RK-02 | Copying TradingSession `fencingToken` name | Enforce `fenceGeneration` in schema + audit             |
| RK-03 | Catalog missing before emit                | Hard prerequisite in impl plan                          |
| RK-04 | Attribution forcing fake workspaceId       | Custom attribution rule for global events               |
| RK-05 | App clock skew false expiry/extend         | DB `NOW()` predicates                                   |
| RK-06 | Missing seed row in some envs              | Migration seed + UNKNOWN fail-closed                    |
| RK-07 | Advisory lock mistaken for SoT             | Document optional-only; AC forbids sole SoT             |
| RK-08 | Scope creep into B-03/04-D                 | Explicit non-scope + AC31/AC32                          |
| RK-09 | Audit after-commit gap                     | Prefer same-txn; fail-closed 04-D if audit missing      |
| RK-10 | Operator reclaim becoming bypass           | Privileged-only + fence bump + audit; no emergency flag |

---

## 33. Non-Scope

B-02 planning / future implementation **must not** include:

- ConnectionsService deny hooks (B-03)
- 04-D environment UPDATE / backfill / LIVE classification
- Vault secret create/replace/revoke/delete
- Credential business-logic redesign
- TradingSession lease redesign / overload
- Advisory-lock-only SoT
- Soft re-acquire of ACTIVE leases
- Permanent global credential freeze
- Public force-unlock
- C7 enablement / `allowRealVenueIo=true`
- FIV / capital / venue I/O
- Rewriting closed B-01 contract files
- Strategy B uniqueness changes
- Model C Vault purpose changes
- Combining B-02 with 04-C/D/E in one change

---

## 34. Safety Boundary

During this planning task and as constraints on future B-02 implementation:

| Control               | Status                        |
| --------------------- | ----------------------------- |
| Database writes       | **ZERO** (this planning task) |
| Prisma schema changes | **ZERO** (this planning task) |
| Vault mutations       | **ZERO**                      |
| Credential mutations  | **ZERO**                      |
| External I/O          | **ZERO**                      |
| FIV                   | **NOT PERFORMED**             |
| Capital               | **ZERO**                      |
| C7                    | **DENY-ALL**                  |
| allowRealVenueIo      | **FALSE**                     |
| Protected leftovers   | **UNTOUCHED**                 |

```text
B-02 IMPLEMENTATION = NOT AUTHORIZED BY THIS DOCUMENT
```

---

## 35. Implementation Readiness

```text
READY FOR B-02 PLANNING REVIEW
```

This is **not** implementation authorization.

Even with planning readiness:

- Do **not** implement B-02
- Do **not** modify Prisma schema
- Do **not** create migrations
- Do **not** bind Nest providers yet
- Do **not** implement B-03 or 04-D

Required subsequent gates:

```text
B-02 Planning Review
→ Architecture/Security delta review if required by PO
→ B-02 PO Slice Approval
→ B-02 Implementation Planning (optional if slice review demands)
→ B-02 Implementation
→ B-02 PO Review
→ B-02 Closure
```

---

## 36. Next Gate

```text
Next governance gate:
  FIV-CONN-04-B-02 Planning Review

DO NOT implement B-02 / B-03 / 04-D from this planning package.
DO NOT modify closed B-01 contract.
DO NOT perform FIV.
DO NOT enable C7 or live capital.
```

### Final state (after this planning artifact)

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B-01 = CLOSED
FIV-CONN-04-B-02 = PLANNING ONLY
FIV-CONN-04-B-02 = IMPLEMENTATION NOT AUTHORIZED
FIV-CONN-04-B-03 = NOT AUTHORIZED / NOT STARTED
04-D = NOT AUTHORIZED / NOT STARTED
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
C7 = DENY-ALL
allowRealVenueIo = FALSE
```

---

**END OF FIV-CONN-04-B-02 PLANNING PACKAGE**
