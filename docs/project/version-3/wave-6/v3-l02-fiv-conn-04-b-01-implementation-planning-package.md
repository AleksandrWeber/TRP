# FIV-CONN-04-B-01 Implementation Planning Package

**Document:** FIV-CONN-04-B-01 Migration Gate Contract — Implementation Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-01 — Migration Gate Contract  
**Authority:** Senior Staff Engineer (implementation planning under PO Slice Approval)  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** write production code, create schema/migrations, implement durable lease, deny hooks, or 04-D UPDATE. Does **not** perform Vault/credential/venue I/O, FIV, or C7 changes.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-01-po-governance-slice-approval.md`](./v3-l02-fiv-conn-04-b-01-po-governance-slice-approval.md) (`3b9c0ac…`) — **GRANTED**  
**Contract Planning:** [`v3-l02-fiv-conn-04-b-01-planning-package.md`](./v3-l02-fiv-conn-04-b-01-planning-package.md)  
**PO Slice Review:** [`v3-l02-fiv-conn-04-b-01-po-slice-review.md`](./v3-l02-fiv-conn-04-b-01-po-slice-review.md)

**Repository baseline:** `3b9c0ac23281b287f337a03d2bd44edffb52fccd` (`HEAD == origin/main`)

```text
B-01 SLICE APPROVAL = GRANTED
B-01 IMPLEMENTATION = AUTHORIZED
B-01 IMPLEMENTATION IN THIS TASK = NOT PERFORMED

READY FOR B-01 IMPLEMENTATION
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Planning Purpose

Produce a repository-accurate, file-level implementation plan for the approved B-01 **contract surface** so a subsequent implementation act can deliver types/port/pure helpers/tests without absorbing B-02/B-03/04-D.

---

## 2. Authoritative Governance Baseline

| Artifact                            | Status                                                    |
| ----------------------------------- | --------------------------------------------------------- |
| OD-B-01…08                          | FROZEN / BINDING                                          |
| COND-ARCH-B01…B10                   | MANDATORY (contract encodes; CAS persistence = B-02/B-04) |
| COND-SEC-B01…B11                    | MANDATORY (split by owner below)                          |
| B01-AC01…AC26                       | ACCEPTED                                                  |
| Wave B Implementation Authorization | GRANTED                                                   |
| B-01 Slice Approval                 | **GRANTED**                                               |

Not reopened: global gate, ≤4h, deny/allow matrix, fencing CAS requirement, UNKNOWN⇒DENY, audit family, Model C, Strategy B.

---

## 3. Repository Architecture Mapping

### 3.1 Connections module (canonical home for B-01)

**Path:** `apps/api/src/modules/connections/`

| Pattern                                     | Evidence path                                                     | Note                                          |
| ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Flat module (no `domain/` / `ports/` today) | `connections.module.ts`                                           | Prefer flat colocated files for B-01          |
| Pure contract + spec                        | `fiv-conn-04-a-classification.ts`, `*.spec.ts`                    | Closest B-01 analogue                         |
| Local Symbol + interface port               | `connection-validator.ts`                                         | `CONNECTION_VALIDATOR` + interface + impl     |
| ENV Result helpers                          | `connection-environment.ts`                                       | `{ ok: true\|false }` style                   |
| Lifecycle rules                             | `connection-lifecycle.ts`                                         | throws Nest `ConflictException` at boundaries |
| Audit emitters                              | `connection-lifecycle-audit.ts`, `connection-validation-audit.ts` | Thin wrappers over `SecurityAuditService`     |
| App service                                 | `connections.service.ts`                                          | Nest exceptions; actor fields explicit        |
| HTTP auth                                   | `connections.controller.ts`                                       | `@RequirePermission(VaultConnections)`        |

### 3.2 Cross-module ports (secondary pattern)

| Path                                                        | Pattern                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/api/src/modules/*/ports/*.port.ts`                    | Symbol + interface (ledger, runtime-enforcement, trading-session) |
| `apps/api/src/composition/real-live-admission-gate.port.ts` | Production adapter at composition root                            |

**Decision:** For B-01, **reuse flat connections module** (like 04-A / `connection-validator`). Optional later move to `connections/ports/` only if wiring volume justifies it — not required for B-01.

### 3.3 Security Audit

| Path                                                                   | Role                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/api/src/modules/security-audit/security-audit-classification.ts` | Must register `connection.migration-gate` before emit                     |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`    | Connection events need workspaceId/actorId/resource\*                     |
| `apps/api/src/modules/security-audit/security-audit.service.ts`        | `SENSITIVE_KEY` matches `/token/` — **forbid payload key `fencingToken`** |

### 3.4 Auth context

Service methods receive `{ workspaceId, actorUserId, actorRole }` from controller. Gate acquire is **privileged** (not ordinary `VaultConnections` client acquire). Do not invent a new auth framework.

### 3.5 Transactions

`apps/api/src/storage/prisma/prisma-transaction.service.ts` — **not used by connections today**. B-01 needs no transactions. B-02/04-D will.

### 3.6 Tests

Vitest colocated `*.spec.ts`. Pure unit style: `fiv-conn-04-a-classification.spec.ts`, `connection-environment.spec.ts`.

### 3.7 Lease analogues (do not overload)

`apps/api/src/modules/trading-session/domain/session-lease.ts`, `runtime-lease.ts`, recovery lease acquire — naming inspiration only.

---

## 4. B-01 Implementation Scope

### In scope

```text
- Const/literal types: GateKey, GatePurpose, GateObservation, operation enums
- MigrationGateGrant type + pure validators
- MigrationGatePort interface + DI Symbol
- Stable deny/error reason codes
- Operation classification helpers (deny/allow/privileged)
- Fail-closed pure observation helpers
- Time-ceiling pure helpers (TTL vs max window invariants)
- Audit event outcome constants + safe payload field allowlist helpers
- 04-D authority assertion helper (contract-level; no UPDATE)
- Unit/contract tests
- Optional: catalog stub registration of connection.migration-gate (types only) —
  prefer deferring full catalog+attribution registration to first emitter slice
  IF registration without emitter is awkward; otherwise register in B-01 for
  compile-time completeness (see §23)
```

### Out of scope (must not implement in B-01)

```text
- Durable lease table / Prisma migration (B-02)
- Nest production adapter with DB (B-02)
- ConnectionsService deny hooks (B-03)
- Privileged environment UPDATE (04-D)
- Vault / credential / venue I/O / FIV / C7
```

---

## 5. Contract Architecture

```text
┌─────────────────────────────────────────────┐
│  Callers (future)                           │
│  - privileged runner (acquire/release)      │
│  - ConnectionsService (B-03 classify+deny)  │
│  - 04-D runner (assert authority + CAS)     │
└──────────────────┬──────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────┐
│  B-01: MigrationGatePort + types/helpers    │
│  (contract; no production durable SoT)      │
└──────────────────┬──────────────────────────┘
                   │ implemented by
┌──────────────────▼──────────────────────────┐
│  B-02: Durable singleton lease adapter      │
│  (DB SoT + CAS; not this slice)             │
└─────────────────────────────────────────────┘
```

In-memory test double allowed for B-01 tests only — **not** production SoT (COND-ARCH-B03).

---

## 6. Gate Types / Value Objects

### A. `MigrationGateKey`

```text
type MigrationGateKey = 'FIV-CONN-04'
const MIGRATION_GATE_KEY_FIV_CONN_04 = 'FIV-CONN-04' as const
```

### B. `MigrationGatePurpose`

```text
type MigrationGatePurpose = 'FIV_CONN_04_MIGRATION_BACKFILL'
```

### C. `MigrationGateObservation`

```text
'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'OWNERSHIP_LOST' | 'CONTENTION_DENIED' | 'UNKNOWN'
```

### D. `MigrationGateGrant` — minimum fields

| Field                | Why required                                                                         |
| -------------------- | ------------------------------------------------------------------------------------ |
| `gateKey`            | Global identity check                                                                |
| `purpose`            | Purpose binding                                                                      |
| `holderId`           | Owner identity for release/heartbeat/04-D                                            |
| `fenceGeneration`    | Fencing authority (audit-safe name; not `fencingToken`)                              |
| `acquiredAt`         | Max-window anchor (ISO-8601 string or Date — match repo ISO preference in audit)     |
| `expiresAt`          | TTL liveness                                                                         |
| `authorizedWindowMs` | Declared ceiling (≤ 4h); enables pure ceiling checks without magic numbers scattered |
| `correlationId?`     | Optional audit correlation                                                           |

**Not included (and why):** workspaceId (not gate identity); connectionId (not gate identity); raw DB row version (B-02 persistence detail); client-forged “isActive” boolean.

Planning package used `authorizedWindow`; implementation may use `authorizedWindowMs` number or duration object — either is fine if ≤4h invariant is enforced. Prefer **milliseconds number** for pure tests.

Alias note: planning also mentioned `authorizedUntil` as conceptual — **do not duplicate** if `acquiredAt + authorizedWindowMs` derives the hard ceiling. Store `authorizedWindowMs` + `acquiredAt`; compute ceiling in helpers.

### E. Operation classification types

```text
MigrationGateDeniedOperation =
  'CREDENTIAL_STORE' | 'CREDENTIAL_REPLACE' | 'CREDENTIAL_REVOKE' | 'EXCHANGE_CREATE'

MigrationGateAllowedOperation =
  'RENAME' | 'DISCONNECT' | 'DISABLE' | 'NON_EXCHANGE_CREATE' | 'READ' | 'VALIDATE'

MigrationGatePrivilegedOperation =
  'PRIVILEGED_ENVIRONMENT_UPDATE'
```

Helpers map ConnectionsService methods → these enums without becoming a second ACL.

---

## 7. Gate State Model

| Observation       | Meaning                        | Deny-set default                                    | Privileged UPDATE                          |
| ----------------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| INACTIVE          | No active window               | ALLOW (normal APIs)                                 | DENY                                       |
| ACTIVE            | Durable ON, non-expired        | DENY                                                | ALLOW only with matching grant + later CAS |
| EXPIRED           | Past expiresAt / window        | Treat grant DENY; APIs resume when durable inactive | DENY                                       |
| OWNERSHIP_LOST    | Fence/owner mismatch           | DENY for that grant                                 | DENY                                       |
| CONTENTION_DENIED | Acquire lost                   | N/A (acquire result)                                | N/A                                        |
| UNKNOWN           | Unreadable/error/malformed SoT | **DENY**                                            | **DENY / REFUSE**                          |

```text
UNKNOWN MUST NEVER MAP TO ALLOW
```

---

## 8. Acquire / Release / Heartbeat / Validate Interfaces

### Port

```text
MIGRATION_GATE_PORT: unique Symbol
interface MigrationGatePort {
  acquire(input: MigrationGateAcquireInput): Promise<MigrationGateAcquireResult>
  release(input: MigrationGateReleaseInput): Promise<MigrationGateReleaseResult>
  heartbeat(input: MigrationGateHeartbeatInput): Promise<MigrationGateHeartbeatResult>
  observe(): Promise<MigrationGateObservationResult>
  validate(grant: MigrationGateGrant): Promise<MigrationGateValidateResult>
}
```

B-01 ships the **interface + types**. Production methods are implemented in **B-02**. B-01 may provide a `InMemoryMigrationGatePort` **test double only**.

### Acquire

| Aspect            | Contract                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Input             | `{ purpose, actor: PrivilegedActorContext, correlationId?, requestedTtlMs? }`            |
| Auth              | Privileged actor only; reject ordinary client (COND-SEC-B09)                             |
| Purpose           | Must be `FIV_CONN_04_MIGRATION_BACKFILL`                                                 |
| Already held      | **CONTENTION_DENIED** — no soft re-acquire                                               |
| Success           | `{ ok: true, grant }`                                                                    |
| Failure           | `{ ok: false, reason: CONTENTION\|UNAUTHORIZED\|PURPOSE_MISMATCH\|UNKNOWN\|TIMEOUT\|… }` |
| Audit expectation | B-02 emits `gate_acquired` / `gate_acquire_denied`                                       |

### Release

| Aspect          | Contract                                                                              |
| --------------- | ------------------------------------------------------------------------------------- |
| Input           | `{ grant, actor }`                                                                    |
| Requires        | Matching `holderId` + `fenceGeneration` on durable SoT                                |
| Stale           | OWNERSHIP_LOST / FENCE_MISMATCH — must not clear newer owner                          |
| Expired already | Idempotent inactive success or explicit ALREADY_INACTIVE — must not harm newer holder |

### Heartbeat

| Aspect   | Contract                                                         |
| -------- | ---------------------------------------------------------------- |
| Requires | ACTIVE + matching owner/fence                                    |
| Extends  | `expiresAt` only                                                 |
| Ceiling  | `newExpiresAt ≤ acquiredAt + authorizedWindowMs` and window ≤ 4h |
| Expired  | DENY — no resurrection                                           |

### Validate / observe

| Aspect            | Contract                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `observe()`       | Maps durable SoT → observation (UNKNOWN on read failure)         |
| `validate(grant)` | Checks key/purpose/owner/fence/expiry/window against durable SoT |
| Grant alone       | Never sufficient for 04-D write without B-02 same-txn CAS        |

### Pure helpers (B-01 implements)

```text
isDenySetBlocked(observation): boolean  // ACTIVE|UNKNOWN → true
assertMaxWindow(acquiredAt, expiresAt, authorizedWindowMs): void
classifyGrantShape(grant): Result  // malformed → DENY codes
classifyPrivilegedUpdateAuthority(observation, grant): Result  // contract-level
```

---

## 9. Authorization Context

```text
type PrivilegedActorContext = {
  actorId: string           // system job id or operator user id
  actorKind: 'SYSTEM_JOB' | 'OPERATOR'
  // optional: role for operator paths — do not invent PermissionClass
  correlationId?: string
}
```

Ordinary Connections mutations continue to use existing `{ workspaceId, actorUserId, actorRole }` at B-03. Gate acquire is separate privileged context — **not** a replacement for `VaultConnections`.

Client-supplied `holderId` / `fenceGeneration` / `expiresAt` are **claims** only.

---

## 10. Fencing Contract

```text
B-01 represents fencing as fenceGeneration on MigrationGateGrant.

B-01 does NOT persist fencing.

CHECK-THEN-SAVE ALONE IS NOT ACCEPTABLE for protected mutation.

B-02/04-D MUST enforce:
  durable CAS of holderId + fenceGeneration + ACTIVE + not expired
  in the SAME DB transaction as Connection.environment UPDATE

Domain port must not leak Prisma updateMany details; B-02 adapter owns CAS.
```

---

## 11. Operation Classification

| Operation                     | Classification            | Future B-03 hook              |
| ----------------------------- | ------------------------- | ----------------------------- |
| storeCredentials              | DENY when ACTIVE\|UNKNOWN | start of `storeCredentials`   |
| replaceCredentials            | DENY when ACTIVE\|UNKNOWN | start of `replaceCredentials` |
| revoke                        | DENY when ACTIVE\|UNKNOWN | start of `revoke`             |
| create EXCHANGE               | DENY when ACTIVE\|UNKNOWN | `create` when type EXCHANGE   |
| rename                        | ALLOW                     | no gate deny                  |
| disconnect / disable          | ALLOW                     | no gate deny                  |
| create NON-EXCHANGE           | ALLOW                     | no gate deny                  |
| list/get/catalog              | ALLOW                     | —                             |
| validate                      | ALLOW                     | —                             |
| public env UPDATE             | N/A / DENY                | no API                        |
| PRIVILEGED_ENVIRONMENT_UPDATE | privileged                | 04-D only with authority+CAS  |

B-01 ships `classifyConnectionMutation({ method, connectionType })` pure helper — **no Nest enforcement**.

---

## 12. Fail-Closed Semantics

Prefer **Result unions** for pure helpers (like `connection-environment.ts`). Port methods return Result or throw **only** Nest-mapped exceptions at HTTP boundaries later — B-01 port should use Result/reason codes so B-02 can map consistently.

| Condition                  | Reason code (stable)                   | Outcome               |
| -------------------------- | -------------------------------------- | --------------------- |
| Gate absent / missing seed | `GATE_UNKNOWN`                         | DENY                  |
| Unreadable / DB failure    | `GATE_UNKNOWN`                         | DENY                  |
| Expired                    | `GATE_EXPIRED`                         | DENY grant ops        |
| Owner mismatch             | `GATE_OWNERSHIP_LOST`                  | DENY                  |
| Fence mismatch             | `GATE_FENCE_MISMATCH`                  | DENY                  |
| Purpose mismatch           | `GATE_PURPOSE_MISMATCH`                | DENY                  |
| GateKey mismatch           | `GATE_KEY_MISMATCH`                    | DENY                  |
| Malformed grant            | `GATE_MALFORMED_GRANT`                 | DENY                  |
| Stale grant                | `GATE_OWNERSHIP_LOST` / `GATE_EXPIRED` | DENY                  |
| Contention                 | `GATE_CONTENTION`                      | DENY acquire          |
| Unauthorized acquire       | `GATE_UNAUTHORIZED`                    | DENY                  |
| Max window exceeded        | `GATE_MAX_WINDOW_EXCEEDED`             | DENY heartbeat extend |

```text
Exceptions must never be interpreted as ALLOW.
```

---

## 13. Audit Contract

```text
eventType = 'connection.migration-gate'   // register before first emit
```

### Outcomes (constants in B-01)

`gate_acquired`, `gate_acquire_denied`, `lifecycle_mutation_blocked`, `gate_released`, `lease_expired_reclaim`, `stale_holder_rejected`, `acquire_timeout`, `heartbeat_rejected` (optional alias of stale_holder_rejected)

### Safe payload fields

`gateKey`, `purpose`, `holderId`, `fenceGeneration`, `acquiredAt`, `expiresAt`, `operation`, `result`, `reasonCode`, `correlationId`, target `workspaceId` / `connectionId` when blocking mutations

### Forbidden keys

Anything matching `SENSITIVE_KEY` including `fencingToken`, `token`, `secret`, `credential`, …

### Emission ownership

| Event                             | Owner                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| acquire/release/heartbeat/reclaim | **B-02** (durable transitions)                                                                                                                          |
| lifecycle_mutation_blocked        | **B-03**                                                                                                                                                |
| Catalog registration              | **B-01 or B-02** — plan: register in B-01 if adding classification entry is contract-complete; else first emitter in B-02 **must** register before emit |

---

## 14. Time Model

| Concept              | Representation                                                |
| -------------------- | ------------------------------------------------------------- |
| Instants             | ISO-8601 strings in grant (match Security Audit `occurredAt`) |
| `authorizedWindowMs` | number; max `4 * 60 * 60 * 1000`                              |
| TTL                  | `expiresAt` ≤ ceiling                                         |
| Ceiling              | `Date.parse(acquiredAt) + authorizedWindowMs`                 |
| CAS comparisons      | **B-02 uses DB `now()`** for durable predicates               |
| Pure B-01 tests      | Inject `nowMs` parameter into helpers                         |

TTL ≠ max window.

---

## 15. Service / Port Boundary

| Role                     | Location                                                        |
| ------------------------ | --------------------------------------------------------------- |
| Contract types + helpers | `apps/api/src/modules/connections/migration-gate.ts` (or split) |
| Port interface + Symbol  | `apps/api/src/modules/connections/migration-gate.port.ts`       |
| Test double              | `migration-gate.in-memory.ts` (test-only) or inline in spec     |
| Callers                  | B-03 `ConnectionsService`; privileged runner; 04-D (future)     |
| Provider                 | B-02 Nest adapter binding `MIGRATION_GATE_PORT`                 |

Do not put production adapter in `composition/` until B-02.

---

## 16. 04-D Integration

```text
assertPrivilegedEnvironmentUpdateAllowed(observation, grant): Result

Requires observation ACTIVE + grant matches key/purpose/owner/fence + not expired + within max window.
Does NOT perform UPDATE.
Does NOT replace same-txn CAS (B-02/04-D).

Public Connection.environment mutation remains absent / immutable (CONN-01).
```

Document that 04-D must call port.validate + adapter CAS in write transaction — never only the pure helper.

---

## 17. B-02 Compatibility

| B-01 element       | B-02 responsibility                                                        |
| ------------------ | -------------------------------------------------------------------------- |
| Observation states | Map durable row → observation                                              |
| Grant fields       | Persist holderId, fenceGeneration, acquiredAt, expiresAt, purpose, gateKey |
| acquire            | CAS OFF\|expired → ON; bump fence; no soft re-acquire                      |
| release            | CAS match holder+fence → OFF                                               |
| heartbeat          | CAS match; clamp expiresAt to ceiling                                      |
| validate/observe   | Durable read; UNKNOWN on failure                                           |
| stale reclaim      | Fence bump + audit                                                         |
| authorizedWindowMs | Enforce ≤4h on acquire                                                     |

---

## 18. B-03 Compatibility

| ConnectionsService method                | B-01 classification | B-03 behavior when ACTIVE\|UNKNOWN |
| ---------------------------------------- | ------------------- | ---------------------------------- |
| storeCredentials                         | CREDENTIAL_STORE    | DENY + audit block                 |
| replaceCredentials                       | CREDENTIAL_REPLACE  | DENY + audit block                 |
| revoke                                   | CREDENTIAL_REVOKE   | DENY + audit block                 |
| create (EXCHANGE)                        | EXCHANGE_CREATE     | DENY + audit block                 |
| create (other)                           | NON_EXCHANGE_CREATE | ALLOW                              |
| rename/disconnect/disable/validate/reads | ALLOW               | no gate deny                       |

---

## 19. Test Strategy

### B-01 unit/contract (implement with B-01)

- GateKey/Purpose literals
- Observation deny helpers (UNKNOWN/ACTIVE → deny-set blocked)
- Malformed grant
- Owner/fence/purpose/key mismatch pure validate
- Expired / max-window clamp
- Contention reason code shape
- No soft re-acquire policy constant/documentation test
- Operation classification matrix completeness
- Audit payload allowlist rejects `fencingToken`
- Privileged UPDATE assert helper
- Model C / Strategy B: negative tests that helpers do not call Vault/Prisma

### Deferred

| Test                            | Owner          |
| ------------------------------- | -------------- |
| Multi-instance durable CAS      | B-02 / B-06    |
| ConnectionsService hook denial  | B-03           |
| Same-txn env UPDATE fencing     | B-04 / 04-D    |
| ST-B21 unauthorized acquire E2E | B-02+          |
| ST-B22 heartbeat ceiling E2E    | B-02           |
| ST-B23 TOCTOU CAS fixture       | B-02/B-04      |
| ST-B24 reclaim                  | B-02           |
| ST-B25 mid-flight bind          | B-03           |
| ST-B26 audit emission           | B-02/B-03/B-05 |

---

## 20. B01-AC01…B01-AC26 Mapping

| AC       | Implementation component                           | Verification test               | Owner              |
| -------- | -------------------------------------------------- | ------------------------------- | ------------------ |
| B01-AC01 | `MigrationGateKey` const                           | unit                            | B-01               |
| B01-AC02 | `MigrationGatePurpose` const                       | unit                            | B-01               |
| B01-AC03 | Observation union + helpers                        | unit                            | B-01               |
| B01-AC04 | UNKNOWN ⇒ deny helpers                             | unit                            | B-01               |
| B01-AC05 | Acquire input privileged actor type + B-02 enforce | contract + B-02                 | B-01 / B-02        |
| B01-AC06 | CONTENTION reason; no soft re-acquire              | unit + B-02                     | B-01 / B-02        |
| B01-AC07 | Release input requires grant owner                 | contract + B-02                 | B-01 / B-02        |
| B01-AC08 | Fence mismatch codes                               | unit + B-02                     | B-01 / B-02        |
| B01-AC09 | Heartbeat expired deny helper                      | unit + B-02                     | B-01 / B-02        |
| B01-AC10 | Max-window helper                                  | unit + B-02                     | B-01 / B-02        |
| B01-AC11 | `fenceGeneration` on grant                         | unit                            | B-01               |
| B01-AC12 | Documented forbid check-then-save; CAS note        | unit comment/assert + B-02/04-D | B-01 / B-02 / 04-D |
| B01-AC13 | Denied operation enum                              | unit                            | B-01               |
| B01-AC14 | Allowed operation enum                             | unit                            | B-01               |
| B01-AC15 | Privileged assert helper                           | unit                            | B-01               |
| B01-AC16 | No public env update path in classification        | unit                            | B-01               |
| B01-AC17 | Bypass model docs + B-03 hooks                     | B-03                            | B-03               |
| B01-AC18 | No Vault calls in B-01 modules                     | static/unit                     | B-01               |
| B01-AC19 | Classification does not replace uniqueness         | doc + B-03/04-D                 | B-01               |
| B01-AC20 | Audit outcome constants                            | unit                            | B-01               |
| B01-AC21 | Payload allowlist / sensitive key reject           | unit                            | B-01               |
| B01-AC22 | No Prisma lease model in B-01                      | review                          | B-01               |
| B01-AC23 | No ConnectionsService hook changes in B-01         | review                          | B-01               |
| B01-AC24 | No backfill code                                   | review                          | B-01               |
| B01-AC25 | No Vault/external I/O                              | review                          | B-01               |
| B01-AC26 | No C7/FIV flags                                    | review                          | B-01               |

---

## 21. Security Verification Mapping

| Condition                        | Owner                                          |
| -------------------------------- | ---------------------------------------------- |
| COND-SEC-B01 max window          | B-01 helpers + B-02 enforce                    |
| COND-SEC-B02 CAS fencing         | **B-02 / 04-D** (B-01 forbids check-then-save) |
| COND-SEC-B03 reclaim             | B-02                                           |
| COND-SEC-B04 workers             | B-03 + future callers                          |
| COND-SEC-B05 runner lease        | B-02 / 04-D                                    |
| COND-SEC-B06 audit workspace     | B-03 blocked audits                            |
| COND-SEC-B07 sensitive keys      | B-01 allowlist + emitters                      |
| COND-SEC-B08 deny hooks          | B-03                                           |
| COND-SEC-B09 privileged acquire  | B-01 types + B-02                              |
| COND-SEC-B10 UNKNOWN fail-closed | B-01 + B-02                                    |
| COND-SEC-B11 ST-B21…26           | split B-02/B-03/B-06                           |
| SEC-B01…14                       | preserved; enforcement split as above          |
| SEC-AC-23 mid-flight bind        | B-03                                           |
| SEC-AC-24 zero Vault/env in B-01 | B-01                                           |

---

## 22. Implementation Sequence

1. Add `migration-gate.ts` — keys, purpose, observations, grant type, reason codes, time helpers, deny helpers
2. Add operation classification helpers
3. Add `migration-gate.port.ts` — Symbol + `MigrationGatePort` + I/O result types
4. Add audit outcome constants + payload allowlist helper
5. Add privileged UPDATE assert helper (04-D contract)
6. Add pure unit/contract specs (`migration-gate.spec.ts`)
7. Optionally register `connection.migration-gate` in classification + attribution **without emitter** (if catalog allows unused types); else defer registration to B-02 with explicit TODO tracked in B-01 closure notes
8. Wire **nothing** into `ConnectionsService` (B-03)
9. Export types from module only if needed by tests; avoid exporting production Nest provider until B-02
10. Verification: run B-01 unit tests; confirm no schema/diff outside planned files

---

## 23. File-Level Change Plan

| Path                                                                   | Purpose                                 | Change                             | Dependency        | ACs                   |
| ---------------------------------------------------------------------- | --------------------------------------- | ---------------------------------- | ----------------- | --------------------- |
| `apps/api/src/modules/connections/migration-gate.ts`                   | Types + pure helpers                    | **CREATE**                         | none              | AC01–16, 18–21, 24–26 |
| `apps/api/src/modules/connections/migration-gate.port.ts`              | Port + Symbol + I/O types               | **CREATE**                         | migration-gate.ts | AC05–12, 15           |
| `apps/api/src/modules/connections/migration-gate.spec.ts`              | Unit/contract tests                     | **CREATE**                         | above             | AC01–16, 18–21        |
| `apps/api/src/modules/security-audit/security-audit-classification.ts` | Register `connection.migration-gate`    | **MODIFY** (optional in B-01)      | catalog rules     | AC20                  |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`    | Attribution rules for new type          | **MODIFY** (if catalog registered) | classification    | AC20                  |
| `apps/api/src/modules/connections/connections.module.ts`               | **Do not** bind production port in B-01 | **NO CHANGE** preferred            | —                 | AC23                  |

**Explicitly not created in B-01:** Prisma schema, lease migration, ConnectionsService hooks, audit emitter service, composition adapter.

If catalog registration without emitter is rejected by repo conventions, state in implementation PR and register in B-02 before first emit — still **READY** because B-01 contract constants can live without catalog until emission.

---

## 24. Database Boundary

```text
NO PRISMA SCHEMA CHANGE IN B-01
NO MIGRATION IN B-01
NO LEASE TABLE IN B-01

B-02 owns durable lease persistence.
```

---

## 25. Risks

| ID    | Risk                                                        | Mitigation                                        |
| ----- | ----------------------------------------------------------- | ------------------------------------------------- |
| IP-01 | Implementing durable adapter “just for tests” as production | Test double only; no module provide of DB adapter |
| IP-02 | Wiring B-03 hooks early                                     | Sequence forbids ConnectionsService changes       |
| IP-03 | Catalog registration deferred → forgotten                   | Closure checklist / B-02 gate                     |
| IP-04 | Using `fencingToken` payload key                            | Allowlist helper + AC21                           |
| IP-05 | Soft re-acquire creep                                       | CONTENTION_DENIED policy tests                    |

---

## 26. Non-Scope

```text
B-02 durable lease; B-03 hooks; 04-D UPDATE/backfill;
Vault; credentials; Binance/Testnet; FIV; C7; live capital;
Prisma schema; production Nest port binding.
```

---

## 27. Safety Verification

This planning act:

```text
Database writes: ZERO
Vault mutations: ZERO
Credential mutations: ZERO
External I/O: ZERO
FIV: NOT PERFORMED
Capital: ZERO
C7: DENY-ALL
allowRealVenueIo: FALSE
Protected leftovers: UNTOUCHED
```

---

## 28. Implementation Readiness

```text
READY FOR B-01 IMPLEMENTATION
```

```text
B-01 SLICE APPROVAL = GRANTED
B-01 IMPLEMENTATION = AUTHORIZED
B-01 IMPLEMENTATION IN THIS TASK = NOT PERFORMED
```

Rationale: Slice Approval granted; contract complete; repository placement mapped; file plan concrete; DB boundary clear; B-02/B-03 boundaries explicit; AC mapping complete.

---

## 29. Next Gate

```text
Next gate:
  FIV-CONN-04-B-01 Implementation
  (types/port/pure helpers/tests only — follow §22–§24)

Then:
  B-01 PO Review → Closure
  (then B-02 planning under separate authorization)
```

---

## Final State

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = IMPLEMENTATION AUTHORIZED AT GOVERNANCE LEVEL
FIV-CONN-04-B-01 = SLICE APPROVAL GRANTED
FIV-CONN-04-B-01 = IMPLEMENTATION AUTHORIZED
FIV-CONN-04-B-01 = IMPLEMENTATION PLANNING COMPLETE
FIV-CONN-04-B-01 = NO IMPLEMENTATION PERFORMED
FIV-CONN-04-B-02 = NOT AUTHORIZED BY THIS TASK
FIV-CONN-04-B-03 = NOT AUTHORIZED BY THIS TASK
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
C7 = DENY-ALL
```

**END OF FIV-CONN-04-B-01 IMPLEMENTATION PLANNING PACKAGE**
