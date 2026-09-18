# FIV-CONN-04-B-04 Implementation Planning Package

**Document:** FIV-CONN-04-B-04 Backfill Integration Boundary — Implementation Planning Package
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-04 — 04-D integration boundary
**Authority:** Implementation-planning engineer under PO Slice Approval
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** modify production code, tests, Prisma, migrations, Vault, ConnectionsService deny matrix, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-04-slice-approval.md`](./v3-l02-fiv-conn-04-b-04-slice-approval.md) — **GRANTED** (`720b5df…`)
**Decision Freeze:** [`v3-l02-fiv-conn-04-b-04-decision-freeze.md`](./v3-l02-fiv-conn-04-b-04-decision-freeze.md) — **APPROVED** (`720b5df…`)
**Planning Review:** [`v3-l02-fiv-conn-04-b-04-planning-review.md`](./v3-l02-fiv-conn-04-b-04-planning-review.md) @ `913f095…` — PASS WITH CONDITIONS (resolved)
**Planning Package:** [`v3-l02-fiv-conn-04-b-04-planning-package.md`](./v3-l02-fiv-conn-04-b-04-planning-package.md)

**Repository baseline:** `720b5dffa4601e47d7e3f17c9afcbf38f19f169d` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-04 SLICE APPROVAL = GRANTED
B-04 IMPLEMENTATION PLANNING = AUTHORIZED
B-04 CODING IN THIS TASK = NOT PERFORMED
No implementation performed.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.
Plan against **committed HEAD** `connections.module.ts` (local dirty 04-A leftovers ignored).

---

## 1. Planning Verdict

```text
IMPLEMENTATION PLANNING PACKAGE = READY FOR IMPLEMENTATION PLANNING REVIEW
Implementation = NOT STARTED
Coding = NOT AUTHORIZED BY THIS ARTIFACT
```

Scope remains the frozen integration boundary only. Repository evidence confirms reusable `MigrationGatePort` + `PrismaMigrationGateAdapter.assertDurableAuthorityCas` without a second SoT. Minimal contract export surface for CAS is required (plan only — not implemented here).

---

## 2. Frozen Governance Inputs

| Source | Binding content |
| ------ | --------------- |
| Decision Freeze C-B04-01…06 | CAS export; heartbeatAt side-effect; internal API; start semantics; S1 owns HB/release; zero env UPDATE |
| Required decisions 1…13 | observe≠write; CAS mandatory; no second SoT; no public HTTP; UNKNOWN⇒REFUSE; write = ACTIVE+owner+fence+same-txn CAS; HB/release ownership-bound; 04-D/backfill/Vault/FIV/C7 separate |
| ARCH-B04 / COND-ARCH-B04 / COND-SEC-B05 | Refuse start without lease+fence; same-txn CAS for write proof; no ungated scripts |
| B04-AC01…18 / SB-B04-01…12 | ACCEPTED / COMPATIBLE |
| B-01 / B-02 / B-03 | CLOSED — consume; do not redesign |
| Residuals D-B03-04/06/08 | PRESERVED — not B-04 |

---

## 3. Repository Mapping

Inspected at `720b5df…` (committed HEAD).

| Concern | Canonical location | Notes |
| ------- | ------------------ | ----- |
| B-01 contract / pure helpers | `apps/api/src/modules/connections/migration-gate.ts` | Grant, observations, `assertPrivilegedEnvironmentUpdateAllowed`, `assertAcquireInput`, reason codes |
| B-01 port | `apps/api/src/modules/connections/migration-gate.port.ts` | `MigrationGatePort`: acquire/release/heartbeat/observe/validate; **no** CAS method; `MIGRATION_GATE_PORT` token |
| B-01 constants | `apps/api/src/modules/connections/migration-gate.constants.ts` | TTL defaults |
| B-02 adapter | `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts` | Durable SoT; **`assertDurableAuthorityCas(transaction, grant)`** present |
| B-02 audit | `apps/api/src/modules/connections/connection-migration-gate-audit.ts` | `connection.migration-gate` family |
| B-03 enforcement | `apps/api/src/modules/connections/connection-migration-gate-enforcement.ts` | observe-only for deny-set; **must not** be used as write proof |
| ConnectionsService | `apps/api/src/modules/connections/connections.service.ts` | B-03 hooks; ordinary lifecycle — **not** B-04 façade |
| Module wiring (HEAD) | `apps/api/src/modules/connections/connections.module.ts` | `PrismaMigrationGateAdapter` + `{ provide: MIGRATION_GATE_PORT, useExisting: … }`; exports `MIGRATION_GATE_PORT` |
| Lease model | Prisma `ConnectionMigrationGateLease` → `connection_migration_gate_leases` | Singleton `gateKey` PK |
| Txn type | `apps/api/src/storage/prisma/prisma-transaction.service.ts` | Opaque `TransactionContext`; `prismaClientForTransaction` |
| Controller | `connections.controller.ts` | Ordinary VaultConnections HTTP — **no** gate lifecycle endpoints (preserve) |
| Closest privileged internal pattern | Adapter methods requiring `PrivilegedActorContext` (`SYSTEM_JOB` \| `OPERATOR`); B-03 pure helper module style | Prefer Nest `@Injectable()` façade + Result unions |
| Test conventions | Colocated `*.spec.ts` under connections; B-02 mocks Prisma CAS; B-03 enforcement specs | Follow adapter.spec / enforcement.spec style |

### Critical export gap (C-B04-01)

```text
assertDurableAuthorityCas EXISTS on PrismaMigrationGateAdapter
assertDurableAuthorityCas is NOT on MigrationGatePort
MigrationGatePort intentionally has no Prisma/TransactionContext dependency
```

**Minimal contract-only change (plan; do not implement in this task):**

Introduce a companion internal port (preferred) so B-01 port purity is preserved:

```text
File (new): migration-gate-durable-authority.port.ts  [illustrative]
  export const MIGRATION_GATE_DURABLE_AUTHORITY = Symbol(...)
  export interface MigrationGateDurableAuthority {
    assertDurableAuthorityCas(
      transaction: TransactionContext,
      grant: MigrationGateGrant,
    ): Promise<boolean>
  }

Module wiring:
  { provide: MIGRATION_GATE_DURABLE_AUTHORITY,
    useExisting: PrismaMigrationGateAdapter }

FORBIDDEN alternatives:
  - informal cast of MigrationGatePort → PrismaMigrationGateAdapter
  - second lease / duplicate CAS SQL in the façade
  - putting Prisma into migration-gate.ts pure module
```

Alternative acceptable under freeze: extend `MigrationGatePort` with CAS — **less preferred** because it couples the B-01-neutral port to `TransactionContext`. Implementation Planning Review may accept either if same-txn semantics and single SoT are preserved.

---

## 4. Architecture Blueprint

```text
Future 04-D runner (OUT OF B-04)
        │
        ▼
Conn04MigrationBoundaryService  (NEW — B-04 privileged façade)
        │
        ├── start()     → MigrationGatePort.acquire
        ├── resume()    → MigrationGatePort.validate
        ├── heartbeat() → MigrationGatePort.heartbeat
        ├── release()   → MigrationGatePort.release
        └── assertWriteAuthority(txn, grant)
                          → MigrationGateDurableAuthority.assertDurableAuthorityCas
                          → optional pure assertPrivilegedEnvironmentUpdateAllowed (pre-check only)
        │
        ├── DOES NOT call observe() as write authority
        ├── DOES NOT UPDATE Connection.environment
        ├── DOES NOT Vault / venue I/O
        └── DOES NOT expose Controllers

B-03 ConnectionsService deny hooks remain independent (observe-only for deny-set).
```

**Handoff to future 04-D (consume, not implement):**

```text
04-D short DB txn (FUTURE):
  BEGIN
    ok = boundary.assertWriteAuthority(txn, grant)   // B-04 proof
    if (!ok) abort
    // 04-D ONLY: conditional Connection.environment UPDATE + row audit
  COMMIT
Vault metadata reads remain OUTSIDE that txn (COND-ARCH-B10 / parent Arch).
```

---

## 5. Internal Façade Contract

Illustrative Nest service API (names may be refined at Implementation Planning Review; semantics frozen):

```text
Conn04MigrationBoundaryService (privileged internal only)

start(input: {
  actor: PrivilegedActorContext
  correlationId?: string
  requestedTtlMs?: number
}): Promise<StartResult>
  // purpose FIXED to FIV_CONN_04_MIGRATION_BACKFILL — not client-selectable
  // PRIMARY start = port.acquire
  // success → { ok:true, grant }
  // failure → { ok:false, reason, observation? }  (CONTENTION/UNKNOWN/…)

resume(input: {
  actor: PrivilegedActorContext
  grant: MigrationGateGrant
}): Promise<ResumeResult>
  // validate(grant) only — NEVER observe()-based success
  // success only when observation ACTIVE + matching grant

heartbeat(input: {
  actor: PrivilegedActorContext
  grant: MigrationGateGrant
  proposedExpiresAt: string
}): Promise<HeartbeatResult>
  // delegates to port.heartbeat — ownership + fence bound

release(input: {
  actor: PrivilegedActorContext
  grant: MigrationGateGrant
}): Promise<ReleaseResult>
  // delegates to port.release — ownership + fence bound

assertWriteAuthority(
  transaction: TransactionContext,
  grant: MigrationGateGrant,
): Promise<WriteProofResult>
  // MUST call assertDurableAuthorityCas
  // MAY run assertPrivilegedEnvironmentUpdateAllowed as non-authoritative precheck
  // MUST NOT treat observe()/validate() as sufficient
```

### Make invalid usage difficult

| Rule | Mechanism |
| ---- | --------- |
| No client fence authority | Grant must pass `classifyGrantShape`; CAS matches durable row |
| No purpose spoofing | Façade hardcodes purpose; ignore client purpose if present |
| No observe-as-write | Do **not** expose `observe` on façade write API; no `assertWriteAuthorityFromObserve` |
| Privileged only | Reject non-`PrivilegedActorContext` via `assertAcquireInput` / `isPrivilegedActorContext` |
| No HTTP | Not registered on `ConnectionsController` |
| No env UPDATE | Method surface has zero Connection repository writes |

---

## 6. Start / Refuse Flow (C-B04-04)

```text
PRIMARY START (new runner):
  1. Require PrivilegedActorContext (SYSTEM_JOB | OPERATOR)
  2. Call MigrationGatePort.acquire({
       purpose: FIV_CONN_04_MIGRATION_BACKFILL,  // fixed
       actor,
       correlationId?,
       requestedTtlMs?,
     })
  3. If ok → return grant (holderId = actor.actorId per B-02)
  4. If !ok → REFUSE (map reason/observation; no session)

RESUME / CONTINUE ONLY:
  1. Require privileged actor + existing grant claim
  2. Call MigrationGatePort.validate(grant)
  3. Success only if ok && observation === 'ACTIVE'
  4. Else REFUSE

FORBIDDEN:
  observe() alone → start success
  soft re-acquire / wait / queue on CONTENTION
```

---

## 7. Durable Write-Proof Flow

### Existing B-02 contract (exact)

```text
PrismaMigrationGateAdapter.assertDurableAuthorityCas(
  transaction: TransactionContext,
  grant: MigrationGateGrant,
): Promise<boolean>
```

| Field | Source / required value |
| ----- | ----------------------- |
| Caller | Future 04-D txn **or** B-04 façade method invoked **inside** caller txn |
| `gateKey` | Durable `FIV-CONN-04` (adapter constant; from grant via `classifyGrantShape`) |
| `purpose` | `FIV_CONN_04_MIGRATION_BACKFILL` |
| `holderId` | `grant.holderId` (must match durable row) |
| `fenceGeneration` | `grant.fenceGeneration` (must match durable row) |
| Transaction | **Caller-provided** `TransactionContext` (same txn as future protected UPDATE) |
| DB conditions | `state='ACTIVE'` AND `expiresAt > DB NOW()` AND key/purpose/holder/fence match |
| Side-effect | May set `heartbeatAt = dbNow` — **must not** bump `fenceGeneration` (C-B04-02) |
| Success | `updateMany.count === 1` → `true` |
| Failure | count≠1 / malformed grant → `false` (treat as REFUSE write) |
| UNKNOWN | Missing lease / txn errors → façade maps to REFUSE (fail closed); do not return true |

### Façade semantics

```text
assertWriteAuthority(txn, grant):
  shaped = classifyGrantShape(grant); if !shaped → REFUSE
  // optional pure precheck (INSUFFICIENT alone):
  //   assertPrivilegedEnvironmentUpdateAllowed({ observation:'ACTIVE', grant, ... })
  ok = durableAuthority.assertDurableAuthorityCas(txn, shaped.value)
  if (!ok) → REFUSE
  else → PROOF_OK  // does NOT perform Connection UPDATE
```

```text
observe() → write        = FORBIDDEN
validate() alone → write = FORBIDDEN as sole authority
CAS in same txn          = MANDATORY
```

---

## 8. Heartbeat / Release Flow (C-B04-05 → B04-S1)

| Op | Who | Required identity | Semantics |
| -- | --- | ----------------- | --------- |
| Heartbeat | Privileged actor presenting grant | `grant.holderId` + `grant.fenceGeneration` + purpose/gateKey | `port.heartbeat`; ACTIVE + non-expired; ceiling ≤ authorizedUntil; stale → REFUSE |
| Release | Privileged actor presenting grant | matching holder + fence | `port.release` → INACTIVE; stale cannot clear newer |

| Failure class | Behavior |
| ------------- | -------- |
| OWNERSHIP_LOST / fence mismatch | REFUSE HB/release |
| EXPIRED | REFUSE (no resurrection via HB) |
| UNKNOWN / DB error | REFUSE fail-closed |
| Wrong purpose/gateKey in grant | Reject via shape/port |

HB/release **do not** authorize write-proof. After successful release, deny-set resumes per B-03 when observation non-blocking.

---

## 9. State / Failure Matrix

Do not collapse distinct states.

| Observation | Start (acquire) | Resume (validate) | Heartbeat | Release | Write-proof |
| ----------- | --------------- | ----------------- | --------- | ------- | ----------- |
| **INACTIVE** | ALLOW acquire path (creates ACTIVE) | REFUSE | N/A | N/A | REFUSE |
| **ACTIVE** (matching grant) | CONTENTION if other holder; holder uses resume/HB | ALLOW | ALLOW iff CAS | ALLOW iff CAS | ALLOW iff same-txn CAS |
| **ACTIVE** (wrong holder/fence) | CONTENTION / REFUSE | REFUSE | REFUSE | REFUSE | REFUSE |
| **EXPIRED** | ALLOW reclaim-via-acquire (B-02) | REFUSE stale | REFUSE | REFUSE | REFUSE |
| **OWNERSHIP_LOST** | REFUSE for that grant | REFUSE | REFUSE | REFUSE | REFUSE |
| **CONTENTION_DENIED** | REFUSE (immediate) | N/A | N/A | N/A | N/A |
| **UNKNOWN** | **REFUSE** | **REFUSE** | **REFUSE** | **REFUSE** | **REFUSE** |

```text
UNKNOWN => REFUSE (start, resume, HB, release, write-proof)
```

---

## 10. Transaction Boundaries

| Operation | Own short txn? | Notes |
| --------- | -------------- | ----- |
| start → acquire | **Yes** (inside B-02 adapter) | Façade does not nest Vault/HTTP |
| resume → validate | **No** long txn; B-02 read validate | Not write authority |
| heartbeat / release | **Yes** (inside B-02 adapter) | Ownership CAS |
| assertWriteAuthority | **Caller txn** | Façade must not open a separate txn that “pre-proves” then returns; CAS runs in **provided** txn |
| Future 04-D UPDATE | **Same txn as CAS** | OUT OF B-04 |
| Vault / venue / HTTP | **Forbidden** inside lease/CAS txns | COND-ARCH-B10 |

---

## 11. Security Mapping (SB-B04-01…12)

| ID | Control in plan |
| -- | --------------- |
| SB-B04-01 | No observe-only write API; CAS mandatory |
| SB-B04-02 | Client holder/fence only as claim; CAS decides |
| SB-B04-03 | UNKNOWN → refuse start |
| SB-B04-04 | PrivilegedActorContext required; no VaultConnections start |
| SB-B04-05 | Acquire contention → refuse second runner |
| SB-B04-06 | Stale fence after reclaim → CAS false |
| SB-B04-07 | No env UPDATE / backfill helpers in B-04 files |
| SB-B04-08 | Façade grants no cross-workspace Connection mutate |
| SB-B04-09 | Reuse audit sanitizer; no `fencingToken` keys |
| SB-B04-10 | No Vault in façade / lease txns |
| SB-B04-11 | Retry without current fence → CAS fail |
| SB-B04-12 | No controller endpoints; no public env PATCH |

Also: privileged-only, no second SoT, txn integrity, fail-closed.

---

## 12. B04-AC01…18 Mapping

| ID | Planned file/module | Planned behavior | Planned test | Dependency | Out-of-scope |
| -- | ------------------- | ---------------- | ------------ | ---------- | ------------ |
| AC01 | façade `start` | Privileged acquire → ACTIVE grant | T1 success start | B-02 acquire | — |
| AC02 | façade `start`/`resume` | INACTIVE → refuse resume; start via acquire only | T3/T matrix | B-02 | — |
| AC03 | façade | UNKNOWN → refuse | T5 | B-02 observe/acquire fail | — |
| AC04 | façade `start` | Second acquire CONTENTION | T2 | B-02 | — |
| AC05 | façade | EXPIRED/OWNERSHIP_LOST/fence mismatch refuse | T3/T4/T9 | B-02 | — |
| AC06 | façade `assertWriteAuthority` | Success only if CAS true in txn | T10 | CAS export | No env UPDATE |
| AC07 | façade write-proof | Prior observe ACTIVE + stale fence → CAS false | T7/T9/T10 | CAS | — |
| AC08 | façade write-proof | Pure assert alone insufficient | T7 | B-01 pure | — |
| AC09 | façade + static review | Zero env UPDATE | T14 | — | 04-D |
| AC10 | façade | Zero Vault | T16 | — | Vault |
| AC11 | façade | Zero venue I/O | T17 | — | live I/O |
| AC12 | façade | Non-privileged rejected | T1 negative | B-01 assertAcquireInput | — |
| AC13 | façade HB/release | Port semantics; stale rejected | T11/T12 | B-02 | — |
| AC14 | controller unchanged | No public gate HTTP | T15 | — | HTTP |
| AC15 | no Prisma files | No schema/migration | review | — | Prisma |
| AC16 | no B-01/02/03 redesign | Consume only | T18 regression | closed slices | — |
| AC17 | audit via existing emitter | Reuse outcomes | audit assertions in T1/T2 | B-02 audit | new codes |
| AC18 | safety walls | C7/FIV/capital unchanged | T18 / review | — | FIV/C7 |

---

## 13. Test Plan

Do **not** write tests in this task. Planned coverage:

| # | Scenario | Expected |
| - | -------- | -------- |
| 1 | Successful acquire/start | `ok` + grant ACTIVE fields |
| 2 | Contention denial | Second start REFUSE / CONTENTION |
| 3 | Expired lease | Stale resume/HB/write REFUSE; reclaim via new acquire per B-02 |
| 4 | Ownership loss | Wrong holder REFUSE HB/release/write |
| 5 | UNKNOWN refusal | Start/resume/write REFUSE |
| 6 | Resume via validate | ACTIVE matching grant OK; observe-only path absent |
| 7 | Observe-only cannot establish authority | No API; write-proof without CAS fails |
| 8 | Matching holder + fence | CAS true |
| 9 | Stale holder rejection | After fence bump, old grant CAS false |
| 10 | Same-transaction CAS proof | CAS invoked with caller txn; count semantics |
| 11 | Heartbeat ownership | Matching grant extends; mismatch fails |
| 12 | Release ownership | Matching release → INACTIVE; stale cannot release |
| 13 | Client fence cannot authorize | Forged fenceGeneration → CAS false |
| 14 | No environment UPDATE | Façade/module has no Connection env write; spy/static |
| 15 | No public HTTP | Controller unchanged; no new routes |
| 16 | No Vault interaction | No SecretVault imports/calls in façade |
| 17 | No live venue I/O | No execution-adapter / allowRealVenueIo changes |
| 18 | Regression B-01/B-02/B-03 | Existing migration-gate / adapter / enforcement / service specs green |

Suggested new spec: `conn04-migration-boundary.service.spec.ts` (name illustrative) colocated under connections; mock `MigrationGatePort` + durable authority; optional light adapter integration for CAS.

---

## 14. Slice Plan

Frozen C-B04-05 ownership preserved (refines task prompt’s S3 wording: HB/release belong to **S1**, not S3).

| ID | Objective | Deliverables | Depends | AC / SB focus |
| -- | --------- | ------------ | ------- | ------------- |
| **B04-S1** | Start/refuse + heartbeat/release | Façade skeleton; `start`/`resume`/`heartbeat`/`release`; DI registration; CAS port **export wiring may land early if needed for compile** | B-01/B-02 closed | AC01–05, AC12–13, AC17; SB-03…05, SB-08 |
| **B04-S2** | Durable write-proof | `assertWriteAuthority` → `assertDurableAuthorityCas`; companion port if not in S1; **zero** Connection UPDATE | B04-S1 | AC06–08; SB-01/02/06/11 |
| **B04-S3** | Tests + integration walls | T1–T18; no HTTP/Vault/env/venue; B-01/02/03 regression | B04-S1/S2 | AC09–11, AC14–18; SB-07/09/10/12 |

Optional single-commit merge of S1–S3 remains allowed at implementation time if review prefers; slice semantics still apply.

```text
NO IMPLEMENTATION AUTHORIZATION FOR CODING IN THIS PLANNING ARTIFACT.
Next review gate must PASS before coding.
```

---

## 15. Scope Exclusions

```text
OUT OF B-04 IMPLEMENTATION:
  - Connection.environment UPDATE / LIVE backfill
  - 04-D batching / per-row backfill audits
  - Vault retrieve/store/replace/revoke/ACL
  - EXCHANGE create / credential lifecycle changes
  - B-03 deny-hook redesign / matrix change
  - B-01/B-02 lease redesign / second gate
  - Public ConnectionsController gate endpoints
  - Prisma schema / migrations
  - FIV / C7 / allowRealVenueIo / live capital / venue I/O
  - D-B03-04/06/08 remediation
```

---

## 16. Residuals

| Residual | Assigned to B-04? | Disposition |
| -------- | ----------------- | ----------- |
| D-B03-04 Vault orphan | **NO** | Preserve |
| D-B03-06 S20 | **NO** | Preserve |
| D-B03-08 observe→mutate race | **NO** | Preserve |

---

## 17. Risks

| ID | Risk | Mitigation |
| -- | ---- | ---------- |
| R1 | observe/write authority confusion | No observe on write API; AC08/SB-01 tests |
| R2 | Stale fencing accepted | CAS predicates + T9/T10 |
| R3 | Ownership loss ignored | Port HB/release + write CAS |
| R4 | Accidental public HTTP | AC14/T15; controller untouched |
| R5 | Accidental 04-D UPDATE | AC09/C-B04-06; no Connection writes in façade |
| R6 | Wrong transaction boundary (pre-prove then write) | CAS only in caller txn; document handoff |
| R7 | Duplicate gate / second SoT | Reuse adapter CAS; forbid new lease SQL |
| R8 | Informal adapter cast | C-B04-01 companion token/port |
| R9 | Dirty local 04-A leftovers contaminate commit | Stage only B-04 files; never `git add .` |

---

## 18. Implementation Preconditions

Before coding may start:

1. This Implementation Planning Package exists
2. **Implementation Planning Review = PASS** (or PASS WITH CONDITIONS resolved)
3. Frozen C-B04-01…06 remain binding
4. HEAD synchronized for authorized implementation commit
5. Protected leftovers not staged

```text
Coding is NOT authorized by this Implementation Planning Package alone.
```

---

## 19. Exact Files Expected to Change During Implementation

| File | Action | Slice |
| ---- | ------ | ----- |
| `apps/api/src/modules/connections/migration-gate-durable-authority.port.ts` (name illustrative) | **CREATE** — companion CAS port + DI token | S1/S2 |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts` (name illustrative) | **CREATE** — privileged façade | S1/S2 |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.spec.ts` | **CREATE** — T1–T18 coverage | S3 |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts` | **MODIFY** only if needed to `implements MigrationGateDurableAuthority` (method already exists — likely signature-only/implements clause) | S1/S2 |
| `apps/api/src/modules/connections/connections.module.ts` | **MODIFY** — register façade + `MIGRATION_GATE_DURABLE_AUTHORITY` `useExisting` adapter; **export** façade and/or durable authority token for future 04-D | S1 |
| Optional: `migration-gate.port.ts` | **MODIFY only if** Review chooses port extension instead of companion — prefer companion | conditional |

### Explicitly must NOT change

| File / area | Reason |
| ----------- | ------ |
| `migration-gate.ts` pure helpers (unless tiny re-export need — prefer none) | B-01 closed |
| `connection-migration-gate-enforcement.ts` / ConnectionsService deny matrix | B-03 closed |
| `connections.controller.ts` / DTOs | No public HTTP |
| Prisma schema / migrations | Persistence NONE |
| Vault / execution-adapter / C7 modules | Out of scope |
| Protected leftovers (04-A files, wave-5 docs, etc.) | Untouched |

---

## 20. Explicit Statement

```text
No implementation performed.
```

```text
This artifact does not modify production code, tests, Prisma, migrations,
Vault, B-01/B-02/B-03 behavior, 04-D, backfill, FIV, C7, or capital.
```

---

## Final Planning State

```text
IMPLEMENTATION PLANNING = READY FOR REVIEW
NEXT GATE = FIV-CONN-04-B-04 IMPLEMENTATION PLANNING REVIEW

B-04 coding = NOT STARTED
04-D = NOT AUTHORIZED
FIV = NOT PERFORMED
C7 = DENY-ALL
LIVE CAPITAL = NOT ACTIVATED
allowRealVenueIo = FALSE
```

**END OF FIV-CONN-04-B-04 IMPLEMENTATION PLANNING PACKAGE**
