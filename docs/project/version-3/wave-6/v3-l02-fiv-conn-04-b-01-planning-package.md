# FIV-CONN-04-B-01 Planning Package — Migration Gate Contract

**Document:** FIV-CONN-04-B-01 Migration Gate Contract — Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-01 — Migration Gate Contract  
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Senior Staff Engineer / Architect (planning under Product Owner + Chief Architect governance)  
**Nature:** **PLANNING ONLY.** Defines the abstract migration-gate contract. Does **not** authorize B-01 implementation. Does **not** create lease tables, deny hooks, Prisma migrations, or mutate Connections/Vault/credentials. Does **not** authorize FIV/C7/venue I/O/capital.

**Wave-level Implementation Authorization:** [`v3-l02-fiv-conn-04-b-implementation-authorization.md`](./v3-l02-fiv-conn-04-b-implementation-authorization.md) (`94a58a2…`) — **GRANTED** at governance level; **does not** authorize this sub-slice without Slice Approval.

**Repository baseline (planning start):** `94a58a2fde893a79b1f0f49c528af64fff1be8ab` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-01 = PLANNING ONLY
FIV-CONN-04-B-01 IMPLEMENTATION = NOT AUTHORIZED
Next gate: B-01 Planning Review → PO Slice Approval → Implementation
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Summary

```text
PLANNING STATUS = READY FOR B-01 PLANNING REVIEW
```

B-01 defines the **stable contract** for the FIV-CONN-04 global authorized migration window so that B-02 (durable lease), B-03 (lifecycle enforcement), and later 04-D (privileged env UPDATE) share one fail-closed meaning of:

```text
“Is migration authority currently valid for this operation?”
```

**B-01 delivers (when later Slice-Approved):** typed gate identity/purpose, state model, acquire/release/heartbeat/validate contracts, fencing authority surface, deny/allow operation classification, fail-closed/time/audit contracts, and 04-D integration contract.

**B-01 does not deliver:** durable lease persistence, ConnectionsService deny hooks, Vault I/O, environment UPDATE, or LIVE backfill.

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
| B-01 Slice Approval                  | **NOT GRANTED**                              |

### Frozen OD-B (not reopened)

OD-B-01…08 as recorded in [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md).

### Mandatory conditions (contract must enable enforcement)

- COND-ARCH-B01…B10
- COND-SEC-B01…B11
- SEC-B01…SEC-B14
- SEC-AC-23 / SEC-AC-24
- Tests T-01…T-20 + ST-B21…ST-B26

---

## 3. Current Repository Architecture

### 3.1 Findings (read-only)

| Area                    | Fact                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Connections mutations   | `ConnectionsService`: `create`, `rename`, `storeCredentials`, `replaceCredentials`, `disconnect`, `disable`, `revoke`, `validate`, …     |
| Rename                  | Writes **`displayName` only**; comment/code: environment immutable after create (CONN-01)                                                |
| Disconnect/disable      | Status-only via `transitionLifecycle` / `updateStatus`                                                                                   |
| Credential Vault mutate | Only via `storeCredentials` / `replaceCredentials` / `revoke`                                                                            |
| Delete API              | **None**                                                                                                                                 |
| Public env UPDATE       | **None** (immutable after create)                                                                                                        |
| Operation/command enum  | **No** existing Connections operation catalog — methods are the natural classification points                                            |
| Auth                    | `@RequirePermission(PermissionClass.VaultConnections)` + workspace membership; gate must **not** replace this                            |
| Security Audit          | Classified catalog + `SENSITIVE_KEY` matching `/token                                                                                    | secret | credential | …/i` |
| Transactions            | `PrismaTransactionService`; Connections credential flows are sequential Vault then Connection (pre-existing)                             |
| Lease analogue          | TradingSession fencing exists — **must not** overload; recovery `saveIfVersion` CAS is the preferred durable pattern for later B-02/B-04 |
| Migration gate runtime  | **ABSENT** (expected)                                                                                                                    |

### 3.2 Implication for B-01

Classify deny/allow by a **typed operation enum** mapped 1:1 to `ConnectionsService` entry methods (plus a privileged `PRIVILEGED_ENVIRONMENT_UPDATE` for 04-D). Do **not** invent a second auth framework or fragile free-form string matching as the primary classifier.

---

## 4. B-01 Scope

### In scope (contract design)

```text
- Gate state model
- Global gate identity
- Purpose binding (FIV-CONN-04 only)
- Acquire / release / heartbeat / validate contracts
- Fencing authority surface (proof shape; CAS ownership deferred to B-02/B-04)
- Deny-set / allow-set operation classification
- Fail-closed semantics
- Time invariants (TTL vs max window)
- Security caller context (non-authoritative client fields)
- Audit contract (event family + safe fields)
- Service/domain port placement
- Bypass model (supported app paths vs ops residual)
- Model C / Strategy B preservation statements
- 04-D privileged UPDATE contract boundary
- Pure contract tests (when later implemented)
```

### Explicit non-scope

```text
- Durable lease table / migration (B-02)
- ConnectionsService deny hooks (B-03)
- Actual fencing CAS persistence (B-02 / B-04)
- 04-D backfill / environment UPDATE execution
- Vault mutation / credential ops execution
- FIV / C7 / venue I/O / capital
```

### Ownership map

| Concern                                          | Owner                         |
| ------------------------------------------------ | ----------------------------- |
| Abstract contract / types / semantics            | **B-01**                      |
| Durable singleton lease persistence              | **B-02**                      |
| Lifecycle deny hooks                             | **B-03**                      |
| 04-D integration boundary + refuse without proof | **B-04**                      |
| Audit emission wiring / tests                    | **B-05** (uses B-01 contract) |
| Crash/concurrency verification                   | **B-06**                      |
| Privileged env UPDATE execution                  | **04-D** (future)             |

---

## 5. Gate State Model

Conceptual observation results for “is authority valid?”:

| State                    | Meaning                                                                       | Default security result for protected ops                                                         |
| ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **INACTIVE**             | No active migration window (OFF / never acquired)                             | Deny-set: **ALLOW** (normal APIs); privileged 04-D UPDATE: **DENY**                               |
| **ACTIVE**               | Durable ON, non-expired, known current owner+fence                            | Deny-set: **DENY**; privileged 04-D UPDATE: **ALLOW only with matching grant**                    |
| **EXPIRED**              | Was ON; `now >= expiresAt` (and/or past max window)                           | Treat as **not active** for deny-set; stale grant: **DENY**; reclaim/acquire may proceed per B-02 |
| **OWNERSHIP_LOST**       | Caller’s grant fence/owner no longer matches durable SoT                      | **DENY** for that grant’s mutations/release/heartbeat                                             |
| **CONTENTION_DENIED**    | Acquire failed because another holder is active                               | **DENY** acquire; immediate deterministic rejection                                               |
| **UNKNOWN / UNREADABLE** | DB error, missing expected seed, malformed durable state, timeout reading SoT | **DENY** deny-set mutations; **REFUSE** 04-D start; **DENY** acquire success claims               |

```text
CRITICAL RULE:
  UNKNOWN / UNREADABLE MUST NOT MEAN ALLOW
```

States are **observation outcomes**, not necessarily persisted enum columns. B-02 maps durable row fields → these outcomes.

---

## 6. Gate Identity

```text
gateKey = "FIV-CONN-04"   // singleton global coordination identity
```

| Property             | Rule                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| Scope                | **GLOBAL** (OD-B-01)                                                     |
| Forbidden identities | workspace-only, provider-only, environment-only, Connection-id gate keys |
| Distinguishes from   | Workspace ACL / `getRow(workspaceId, id)` / Vault workspace binding      |

```text
GLOBAL GATE IDENTITY  ≠  WORKSPACE BUSINESS AUTHORIZATION

Gate coordinates migration exclusion.
Workspace ACL still governs who may touch which Connection/credential data.
```

---

## 7. Purpose Binding

```text
purpose = FIV_CONN_04_MIGRATION_BACKFILL
```

| Allowed use                                                | Forbidden generalization                 |
| ---------------------------------------------------------- | ---------------------------------------- |
| FIV-CONN-04 controlled migration/backfill critical section | Generic credential freeze                |
| Single-runner 04-D prep/execution window                   | Emergency trading lock                   |
| Deny-set exclusion during that window                      | Workspace lock / system maintenance flag |

Acquire **must** bind purpose; validate **must** reject wrong purpose. Do not silently generalize the port into a multi-purpose lock framework in B-01.

---

## 8. Acquire Contract

### Conceptual signature

```text
acquireMigrationGate(input: {
  purpose: FIV_CONN_04_MIGRATION_BACKFILL
  actor: PrivilegedActorContext   // system job / operator — NOT ordinary client
  correlationId?: string
  requestedTtl?: Duration         // optional; must not exceed remaining max window
}): AcquireResult
```

### Semantics

| Topic                     | Contract                                                                                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization             | Privileged only (COND-SEC-B09); existing auth preserved; gate ≠ new auth framework                                                                                                                                                                               |
| Purpose                   | Must be `FIV_CONN_04_MIGRATION_BACKFILL`                                                                                                                                                                                                                         |
| Max duration              | `authorizedWindow ≤ 4h` from `acquiredAt` (OD-B-01)                                                                                                                                                                                                              |
| Ownership                 | Assigns `holderId` (opaque durable owner id)                                                                                                                                                                                                                     |
| Fencing                   | Monotonic `fenceGeneration` incremented on successful acquire                                                                                                                                                                                                    |
| Already-active same owner | **Contention deny** or explicit “already held” deny — **no** silent re-acquire without policy; recommended: **CONTENTION_DENIED** unless identical holder+live fence re-entrant is later Slice-Approved (default: **no re-entrant soft acquire** without new PO) |
| Contention                | Immediate deterministic rejection (**OD-B-08**); no queue/wait/blind retry                                                                                                                                                                                       |
| Success grant             | Returns `MigrationGateGrant` (see §12) — **proof object**, not DB SoT                                                                                                                                                                                            |
| Failure                   | Never claims ACTIVE; audit `gate_acquire_denied` / timeout                                                                                                                                                                                                       |
| Audit                     | Durable `connection.migration-gate` / `gate_acquired` or denied                                                                                                                                                                                                  |

```text
Client-supplied fence/owner MUST NOT authorize acquire success.
Durable SoT (B-02) remains authority.
```

---

## 9. Release Contract

```text
releaseMigrationGate(grant: MigrationGateGrant, actor: PrivilegedActorContext): ReleaseResult
```

| Topic           | Contract                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Who may release | Current durable owner **and** matching `fenceGeneration` only                                        |
| Stale owner     | **REJECT** — must not invalidate newer owner (COND-ARCH-B06)                                         |
| Already expired | Idempotent safe outcome: treat as already inactive; audit as appropriate; must not harm newer holder |
| Ownership lost  | **REJECT**                                                                                           |
| Audit           | `gate_released` on successful transition to inactive                                                 |

---

## 10. Heartbeat Contract

```text
heartbeatMigrationGate(grant: MigrationGateGrant, actor: PrivilegedActorContext): HeartbeatResult
```

| Topic                | Contract                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Preconditions        | Matching owner + fence; lease still ACTIVE (not expired)                                                                    |
| Extends              | `expiresAt` / TTL liveness only                                                                                             |
| Ceiling              | `newExpiresAt ≤ acquiredAt + authorizedWindow` and `authorizedWindow ≤ 4h`                                                  |
| Expired resurrection | **FORBIDDEN**                                                                                                               |
| Stale owner          | **REJECT**                                                                                                                  |
| Audit                | Optional success; **required** durable evidence on fencing rejection / reclaim-related failures as Security Review requires |

---

## 11. Validation Contract

```text
validateMigrationGate(grant: MigrationGateGrant): ValidationResult
assertMigrationGateActive(grant): void  // throws/fail-closed on invalid
```

Must establish **all** of:

1. Durable gate identity = `FIV-CONN-04`
2. Purpose = `FIV_CONN_04_MIGRATION_BACKFILL`
3. State observation = **ACTIVE**
4. `holderId` matches durable owner
5. `fenceGeneration` matches durable fencing
6. `now < expiresAt` and `now < acquiredAt + authorizedWindow`

| Invalid case                                                       | Result                                       |
| ------------------------------------------------------------------ | -------------------------------------------- |
| Any mismatch / expiry / ownership lost                             | **DENY**                                     |
| UNKNOWN / UNREADABLE                                               | **DENY**                                     |
| Cached grant without re-read of durable SoT for protected mutation | **INSUFFICIENT** — B-04/04-D must CAS in-txn |

```text
Grant object is a capability claim, not the SoT.
```

---

## 12. Fencing Contract

### Minimum grant surface (`MigrationGateGrant`)

| Field              | Role                                                      |
| ------------------ | --------------------------------------------------------- |
| `gateKey`          | Global identity                                           |
| `purpose`          | Purpose binding                                           |
| `holderId`         | Owner                                                     |
| `fenceGeneration`  | Monotonic fencing (name avoids audit `/token/` collision) |
| `acquiredAt`       | Max-window anchor                                         |
| `expiresAt`        | TTL liveness                                              |
| `authorizedWindow` | Declared ceiling (≤4h)                                    |
| `correlationId`    | Optional audit correlation                                |

### Critical invariant

```text
Stale owner MUST NOT perform protected mutation after another acquire.

FORBIDDEN as sole protection:
  check fencing once → mutate later (check-then-save)

REQUIRED for privileged 04-D UPDATE (B-04 / 04-D):
  durable CAS of holderId + fenceGeneration + ACTIVE + not expired
  in the SAME DB transaction as Connection.environment UPDATE
```

B-01 forbids the unsafe pattern in contract text. B-02/B-04 implement CAS.

---

## 13. Deny-Set

Typed operations (proposed enum `MigrationGateDeniedOperation`):

| Operation            | Maps to repository method                                        |
| -------------------- | ---------------------------------------------------------------- |
| `CREDENTIAL_STORE`   | `ConnectionsService.storeCredentials`                            |
| `CREDENTIAL_REPLACE` | `ConnectionsService.replaceCredentials`                          |
| `CREDENTIAL_REVOKE`  | `ConnectionsService.revoke`                                      |
| `EXCHANGE_CREATE`    | `ConnectionsService.create` when `connectionType === 'EXCHANGE'` |

While gate **ACTIVE** (or **UNKNOWN**): these MUST be rejected (UNKNOWN → DENY).

Classification uses typed enum + method wiring in B-03 — **not** free-form client strings as authority.

---

## 14. Allow-Set

| Operation             | Maps to                    | Repository verification                                                                           |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `RENAME`              | `rename`                   | **Confirmed:** updates `displayName` only; does not touch `environment` / Vault / `vaultSecretId` |
| `DISCONNECT`          | `disconnect`               | Status-only                                                                                       |
| `DISABLE`             | `disable`                  | Status-only                                                                                       |
| `NON_EXCHANGE_CREATE` | `create` when not EXCHANGE | Allowed under OD-B-02                                                                             |
| `READ`                | `list` / `get` / catalog   | No mutation                                                                                       |
| `VALIDATE`            | `validate`                 | May transition status; EXCHANGE NULL remains fail-closed under Model C; **not** deny-set          |

### Discrepancy check

No discrepancy found vs frozen ALLOW matrix for rename/disconnect/disable. If future code changes rename to mutate env/credentials, that would be a governance defect outside B-01 — do not silently expand deny-set here.

---

## 15. 04-D Privileged Update Contract

```text
operation = PRIVILEGED_ENVIRONMENT_UPDATE
```

| Rule                     | Contract                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| Public API               | **FORBIDDEN** (env immutability)                                               |
| Ownership                | **04-D** executes; **B-01** defines required authority                         |
| Requires                 | ACTIVE gate + correct purpose + matching owner + matching fence + same-txn CAS |
| Does not require B-01 to | Perform UPDATE, classify LIVE, call Vault                                      |

B-04 exposes “refuse to start / refuse write without valid proof” using this contract.

---

## 16. Fail-Closed Model

| Condition                     | Result                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| No gate record / missing seed | UNKNOWN → **DENY** protected paths; refuse 04-D                            |
| Unreadable gate / DB error    | UNKNOWN → **DENY**                                                         |
| Expired lease                 | EXPIRED → deny stale grant; deny-set may resume only when durable inactive |
| Owner mismatch                | OWNERSHIP_LOST → **DENY**                                                  |
| Fencing mismatch              | OWNERSHIP_LOST → **DENY**                                                  |
| Purpose mismatch              | **DENY**                                                                   |
| Malformed / stale grant       | **DENY**                                                                   |
| Release failure               | Do not claim released; fail closed                                         |
| Heartbeat failure             | Do not extend; fail closed                                                 |
| Contention                    | CONTENTION_DENIED — immediate reject                                       |

```text
NEVER: UNKNOWN → ALLOW
```

---

## 17. Time Model

| Concept            | Definition                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `acquiredAt`       | Instant of successful acquire (durable)                                                                                                                                                |
| `authorizedWindow` | ≤ 4 hours; hard ceiling from `acquiredAt`                                                                                                                                              |
| `expiresAt`        | TTL liveness deadline; may be extended by heartbeat                                                                                                                                    |
| Invariant          | `expiresAt ≤ acquiredAt + authorizedWindow` always                                                                                                                                     |
| Heartbeat          | May move `expiresAt` forward only while `now < acquiredAt + authorizedWindow` and never past that ceiling                                                                              |
| Clock authority    | **Prefer database `now()`** for compare/CAS predicates (multi-instance consistency). Application clocks may set proposed timestamps but durable comparisons should use DB time in B-02 |

TTL ≠ max window (COND-ARCH-B02).

---

## 18. Security Context

Caller context for acquire/release/heartbeat (non-authoritative except for privilege checks):

| Field                          | Role                                                  |
| ------------------------------ | ----------------------------------------------------- |
| Actor identity                 | Privileged system job id / operator user id           |
| Authorization                  | Existing privilege checks — gate does not replace ACL |
| Operation                      | Typed enum when evaluating deny/allow                 |
| Purpose                        | Must match bound purpose                              |
| Correlation / request / job id | Audit attribution                                     |

```text
Client-supplied holderId / fenceGeneration / expiresAt
  are CLAIMS only — durable lease SoT decides.
```

Workspace id appears on **blocked mutation** audits (target workspace), not as gate identity.

---

## 19. Audit Contract

```text
eventType = connection.migration-gate
eventClass = connection
```

### Required outcomes (B-01 contract; emission in B-02/B-05)

| Outcome                      | When                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `gate_acquired`              | Successful acquire                                                                 |
| `gate_acquire_denied`        | Contention / unauthorized / timeout                                                |
| `lifecycle_mutation_blocked` | Deny-set blocked while ACTIVE/UNKNOWN                                              |
| `gate_released`              | Successful release                                                                 |
| `lease_expired_reclaim`      | Reclaim after expiry                                                               |
| `stale_holder_rejected`      | Fence/owner mismatch on release/heartbeat/validate path                            |
| `acquire_timeout`            | Acquire timeout                                                                    |
| Heartbeat fencing rejection  | Covered by `stale_holder_rejected` (or dedicated outcome if catalog needs clarity) |

### Safe payload fields

`gateKey`, `purpose`, `holderId`, `fenceGeneration` (**not** key name `fencingToken` / `token`), `acquiredAt`, `expiresAt`, `operation`, `result`, `reasonCode`, `correlationId`, target `workspaceId` (blocked mutations), `connectionId` when applicable.

### Forbidden

Secrets, API keys, ciphertext, credential material; payload keys matching `SENSITIVE_KEY`.

---

## 20. Service / Domain Boundary

| Layer                       | B-01 role                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Domain/application port** | **Primary** — `MigrationGatePort` (or equivalent) with grant/types/errors      |
| ConnectionsService          | **Consumer** of deny classification in B-03 — not the contract definition site |
| Auth guard                  | Unchanged; privilege checks remain separate                                    |
| Repository                  | B-02 implements port against durable lease                                     |
| DB constraint               | Strategy B remains separate uniqueness backstop                                |

```text
Do NOT create a new authorization framework.
Integrate as a migration-coordination port beside existing Connections/Vault ACL.
```

---

## 21. Bypass Model

| Path                       | Expectation                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| REST → ConnectionsService  | B-03 hooks enforce deny-set via contract                                            |
| Alternate controller       | Must not call ungated Vault/Connection mutate                                       |
| ConnectionsService         | Canonical app enforcement point                                                     |
| Credential service         | None separate today                                                                 |
| Worker / scheduled job     | Must use gated service (COND-SEC-B04)                                               |
| Admin / migration runner   | Acquire via privileged port; 04-D needs grant+CAS                                   |
| Repository / direct Prisma | **Trusted operational residual** — outside app threat model; not a supported bypass |

```text
SUPPORTED APPLICATION PATHS: Nest app paths through ConnectionsService + privileged gate port
TRUSTED OPERATIONAL DB ACCESS: DBA/raw SQL — not claimed as application-secure
```

---

## 22. Model C

Preserved:

```text
Vault purpose = runtime credential SoT
Connection.environment = constraint / audit context
```

Gate contract **must not**:

- resolve Vault secrets
- mutate Vault
- change SecretPurpose
- infer environment from provider
- create credential fallback

---

## 23. Strategy B

Preserved:

```text
(workspaceId, provider, environment) uniqueness for credentialed EXCHANGE
```

Gate **does not replace** the unique index. Both required:

```text
migration gate (exclude EXCHANGE create during window)
  +
Strategy B DB uniqueness (final collision authority)
```

No cleanup/substitution.

---

## 24. Proposed B-01 Interfaces / Contracts

Conceptual deliverables (names illustrative; final names may match repo style at implementation):

```text
// Types
MigrationGateKey = 'FIV-CONN-04'
MigrationGatePurpose = 'FIV_CONN_04_MIGRATION_BACKFILL'
MigrationGateObservation = INACTIVE | ACTIVE | EXPIRED | OWNERSHIP_LOST | CONTENTION_DENIED | UNKNOWN
MigrationGateDeniedOperation = CREDENTIAL_STORE | CREDENTIAL_REPLACE | CREDENTIAL_REVOKE | EXCHANGE_CREATE
MigrationGateAllowedOperation = RENAME | DISCONNECT | DISABLE | NON_EXCHANGE_CREATE | READ | VALIDATE
MigrationGatePrivilegedOperation = PRIVILEGED_ENVIRONMENT_UPDATE
MigrationGateGrant = { gateKey, purpose, holderId, fenceGeneration, acquiredAt, expiresAt, authorizedWindow, correlationId? }

// Port
MigrationGatePort {
  acquire(input): AcquireResult
  release(grant, actor): ReleaseResult
  heartbeat(grant, actor): HeartbeatResult
  observe(): MigrationGateObservation          // durable read outcome
  validate(grant): ValidationResult
  isDeniedOperation(op, connectionType?): boolean
  assertDenySetBlocked(op): void               // fail-closed when ACTIVE|UNKNOWN
}

// Errors (stable codes)
MIGRATION_GATE_CONTENTION
MIGRATION_GATE_UNAUTHORIZED
MIGRATION_GATE_UNKNOWN
MIGRATION_GATE_EXPIRED
MIGRATION_GATE_OWNERSHIP_LOST
MIGRATION_GATE_PURPOSE_MISMATCH
MIGRATION_GATE_FENCE_MISMATCH
MIGRATION_GATE_MAX_WINDOW_EXCEEDED
```

B-01 implementation (later) may ship **types + pure helpers + port interface** with **in-memory fake for tests only** — **not** production SoT. Production durable adapter is **B-02**.

---

## 25. Test Strategy (B-01 — contract only)

When Slice-Approved for implementation, B-01 tests are **pure/unit**:

| #    | Scenario                                                                             | Expected                |
| ---- | ------------------------------------------------------------------------------------ | ----------------------- |
| C-01 | Observation mapping ACTIVE vs INACTIVE vs UNKNOWN                                    | Correct deny defaults   |
| C-02 | UNKNOWN → deny helpers                                                               | DENY                    |
| C-03 | Deny-set enum covers store/replace/revoke/EXCHANGE_CREATE                            | Complete                |
| C-04 | Allow-set excludes deny-set                                                          | No overlap              |
| C-05 | Max-window invariant helpers                                                         | `expiresAt` clamp rules |
| C-06 | Grant validate pure predicates                                                       | Mismatch → fail         |
| C-07 | Audit payload key allowlist rejects `fencingToken`/`token`                           | Fail closed             |
| C-08 | Purpose mismatch                                                                     | DENY                    |
| C-09 | Document check-then-save forbidden in contract comments/tests as invariant statement | Present                 |

Persistence/CAS/multi-instance tests belong to **B-02/B-06**. Hook tests belong to **B-03**. ST-B21…ST-B26 span B-02…B-06.

---

## 26. Acceptance Criteria

| ID           | Criterion                                                          |
| ------------ | ------------------------------------------------------------------ |
| **B01-AC01** | Gate identity is globally scoped (`FIV-CONN-04`)                   |
| **B01-AC02** | Gate purpose restricted to FIV-CONN-04 migration/backfill          |
| **B01-AC03** | Contract distinguishes valid active authority from invalid/unknown |
| **B01-AC04** | UNKNOWN/unreadable ⇒ DENY                                          |
| **B01-AC05** | Acquire requires authorized privileged caller/context              |
| **B01-AC06** | Contention = immediate deterministic rejection                     |
| **B01-AC07** | Only current owner can release                                     |
| **B01-AC08** | Stale owner cannot release newer authority                         |
| **B01-AC09** | Heartbeat cannot resurrect expired authority                       |
| **B01-AC10** | Heartbeat cannot extend beyond `acquiredAt + ≤4h`                  |
| **B01-AC11** | Fencing is part of protected mutation authority                    |
| **B01-AC12** | Check-then-save alone explicitly forbidden                         |
| **B01-AC13** | Deny-set frozen and explicit                                       |
| **B01-AC14** | Allow-set frozen and explicit                                      |
| **B01-AC15** | 04-D env UPDATE requires valid migration authority                 |
| **B01-AC16** | Public env UPDATE remains denied                                   |
| **B01-AC17** | No supported application path may bypass the contract              |
| **B01-AC18** | Model C preserved                                                  |
| **B01-AC19** | Strategy B uniqueness remains authoritative                        |
| **B01-AC20** | Audit contract durable and attributable                            |
| **B01-AC21** | Secrets excluded from audit payloads; no sensitive key names       |
| **B01-AC22** | B-01 does not implement the durable lease                          |
| **B01-AC23** | B-01 does not implement lifecycle enforcement hooks                |
| **B01-AC24** | B-01 does not perform backfill                                     |
| **B01-AC25** | B-01 does not perform Vault or external I/O                        |
| **B01-AC26** | B-01 does not enable C7 or authorize FIV                           |

**Count: 26**

---

## 27. Open Decisions

| ID        | Topic                                   | Type              | Disposition                                                        |
| --------- | --------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| OD-B01-T1 | Exact TypeScript symbol names           | Technical         | Defer to implementation style guide                                |
| OD-B01-T2 | Re-entrant acquire by same holder       | Technical default | **No soft re-entrant acquire** unless later Slice Approval adds it |
| OD-B01-T3 | DB `now()` vs app clock for comparisons | Technical         | **Prefer DB time** for CAS predicates (this package)               |
| —         | Frozen OD-B-01…08                       | Governance        | **Not reopened**                                                   |

```text
No new PO decisions required to proceed to B-01 Planning Review.
```

---

## 28. Risks

| ID       | Risk                                             | Mitigation                 |
| -------- | ------------------------------------------------ | -------------------------- |
| R-B01-01 | Implementing durable lease inside B-01           | AC22; Slice boundary       |
| R-B01-02 | Generalizing to multi-purpose lock framework     | Purpose binding §7         |
| R-B01-03 | Using check-then-save despite contract           | AC12; B-04 CAS             |
| R-B01-04 | Audit key `fencingToken` rejection               | Use `fenceGeneration`      |
| R-B01-05 | Treating grant cache as SoT                      | Validation + CAS contracts |
| R-B01-06 | Skipping Slice Approval because wave auth exists | §30 gate statement         |

---

## 29. Non-Scope

```text
- B-02 durable lease / schema / migration
- B-03 ConnectionsService deny hooks
- B-04/04-D environment UPDATE execution
- B-05/B-06 full integration suites beyond contract tests
- Vault/credential mutation
- FIV / C7 / allowRealVenueIo / capital / venue I/O
- Reopening OD-B or parent D-CONN-04 decisions
- Modifying CLOSED FIV-CONN-04-A
```

---

## 30. Implementation Gate Statement

```text
FIV-CONN-04-B-01 IMPLEMENTATION = NOT AUTHORIZED

Wave-level FIV-CONN-04-B Implementation Authorization = GRANTED
  does NOT replace B-01 Slice Approval.

Required next gates:
  1. B-01 Planning Review
  2. PO Slice Approval for FIV-CONN-04-B-01
  3. Implementation (types/port/contract only)
  4. PO Review → Closure

DO NOT skip the slice gate.
DO NOT implement durable lease or deny hooks under B-01.
```

---

## Safety State (this planning act)

```text
Database writes:        ZERO
Schema/migrations:      NOT CREATED
Vault mutations:        ZERO
Credential mutations:   ZERO
External I/O:           ZERO
FIV:                    NOT PERFORMED
Capital:                ZERO
C7:                     DENY-ALL
allowRealVenueIo:       FALSE
LIVE backfill:          NOT PERFORMED
Protected leftovers:    UNTOUCHED
```

---

## Final State

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = IMPLEMENTATION AUTHORIZED AT GOVERNANCE LEVEL
FIV-CONN-04-B-01 = PLANNING ONLY
FIV-CONN-04-B-01 IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B-01 PLANNING PACKAGE**
