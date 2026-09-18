# FIV-CONN-04-B-06 Implementation Planning

**Document:** FIV-CONN-04-B-06 Crash / Concurrency Verification — Implementation Planning  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-06 — Crash / concurrency verification  
**Authority:** Implementation-planning engineer under PO Slice Approval  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** create B-06 specs. Does **not** modify production code, B-02/B-03/B-04/B-05, OD-B-06, D-B03 residuals, Prisma, migrations, Vault, 04-D, FIV, C7, venue I/O, or capital. Does **not** introduce testcontainers, live multi-process Postgres, or wait/queue/timeout behavior.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-06-slice-approval.md`](./v3-l02-fiv-conn-04-b-06-slice-approval.md) — **GRANTED**  
**Decision Freeze:** [`v3-l02-fiv-conn-04-b-06-decision-freeze.md`](./v3-l02-fiv-conn-04-b-06-decision-freeze.md) — **APPROVED** (C-B06-01…05)  
**Planning Package:** [`v3-l02-fiv-conn-04-b-06-planning-package.md`](./v3-l02-fiv-conn-04-b-06-planning-package.md)  
**Planning Review:** Formal Planning Review — **PASS WITH CONDITIONS** (resolved by Decision Freeze)

**Repository baseline:** `d6b860299f3a5ade944c5ea55a7c007fe091843d` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-06 SLICE APPROVAL = GRANTED
B-06 IMPLEMENTATION PLANNING = THIS ARTIFACT
B-06 CODING IN THIS TASK = NOT PERFORMED
NO IMPLEMENTATION AUTHORIZATION IS GRANTED BY THIS ARTIFACT
NEXT GATE = B-06 IMPLEMENTATION PLANNING REVIEW
```

---

## 1. Executive Summary

B-06 delivers a **TEST-ONLY** crash/concurrency verification suite proving **RACE-05…RACE-10** and parent **AC-B06…AC-B10 + AC-B20** via dual logical clients against the existing B-02 durable lease SoT.

```text
DEFAULT DELIVERY = TEST-ONLY
PRODUCTION CHANGES = NONE
EVIDENCE METHOD = dual logical clients / adapters (C-B06-01)
TESTCONTAINERS = NOT SELECTED
LIVE DUAL-PROCESS = NOT CLAIMED (C-B06-02 residual remains OPEN/OPTIONAL)
RACE-09 = immediate contention fail-closed (C-B06-05); NO wait/queue/timeout invention
```

Closed B-02 already implements CAS/FOR UPDATE, contention deny, TTL reclaim, fencing, release/HB ownership. B-03 observes durable ON for deny-set. B-04 refuses D without lease/write-proof. B-06 consolidates **RACE matrix evidence** without redesigning those surfaces.

---

## 2. Baseline

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| HEAD        | `d6b860299f3a5ade944c5ea55a7c007fe091843d` |
| origin/main | `d6b860299f3a5ade944c5ea55a7c007fe091843d` |
| Branch      | `main`                                     |
| B-05 CLOSED | `d6b8602`                                  |

### Working-tree leftovers (OUTSIDE B-06 — DO NOT TOUCH)

Recorded at planning start (`git status --short`):

| Class                                             | Paths (representative)                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Modified (pre-existing / prior CI)                | `live-admission-gate-ports.module.spec.ts`; `fiv-conn-04-b-05-*.spec.ts`; `technical-debt.md`; `wave-5-progress.md` |
| Untracked Wave-5 / 04-A / misc                    | `fiv-conn-04-a-*`, telegram specs, wave-5 docs, technical-debt duplicates, unrelated wave-6 drafts                  |
| Untracked B-06 governance (authorized prior acts) | `…-b-06-planning-package.md`, `…-b-06-decision-freeze.md`, `…-b-06-slice-approval.md`                               |

```text
Protected leftovers = OUTSIDE B-06
This planning act MUST NOT clean / revert / format / stage / delete them.
Only authorized new file for this act: THIS DOCUMENT.
```

---

## 3. Frozen Decisions (immutable for implementation)

| ID           | Frozen rule                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **C-B06-01** | Dual logical clients/adapters + unit/integration vs shared B-02 SoT. Testcontainers **NOT**. Live multi-process **NOT**. |
| **C-B06-02** | B-02 live dual-process residual = **OPEN / OPTIONAL**. Do not close, mandate, or claim.                                  |
| **C-B06-03** | Verification/consume-only. No greenfield SoT/fencing/TTL/reclaim/boundary/audit. Defect → **STOP + escalate**.           |
| **C-B06-04** | `B06-AC*` / `SB-B06-*` tracing-only. Normative: AC-B06…10, AC-B20, RACE-05…10, SEC/COND.                                 |
| **C-B06-05** | RACE-09 = immediate contention/acquire-fail. **No** wait/queue/timeout. Evidence: fail → no proof → refuse D → no D.     |

---

## 4. Scope

```text
IN SCOPE:
  A. RACE-05 — second acquire denied
  B. RACE-06 — shared SoT; all logical observers deny while ON
  C. RACE-07 — crash → TTL/reclaim → fence advance → stale grant dead
  D. RACE-08 — commit then process crash → durable lease survives
  E. RACE-09 — immediate contention/acquire failure → no D
  F. RACE-10 — retry without fresh proof cannot bypass fencing
  G. AC-B20 — wrong/stale fence cannot release / authorize D / mutate via boundary
  H. AC-B07 structural — process-local memory is not SoT
  I. Security smoke walls (no Vault/env/HTTP/second SoT introduced by B-06)
```

---

## 5. Non-Scope

```text
OUT OF SCOPE / FORBIDDEN:
  testcontainers / live dual-process Postgres
  wait/queue/timeout invention (RACE-09)
  lease / fencing / TTL / reclaim / boundary / audit redesign
  OD-B-06 reopen
  B-05 rewrite
  D-B03-04 / D-B03-06 / D-B03-08 remediation
  04-D / FIV / C7 / capital chaos
  Wave-5 / 04-A leftovers
  unrelated refactors / dependency upgrades
  production modifications (default)
```

---

## 6. RACE Matrix

| Race        | Objective                               | Parent AC       | B06-AC          | Primary file                       | Existing consumed                         | New B-06 evidence                                                                                     |
| ----------- | --------------------------------------- | --------------- | --------------- | ---------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **RACE-05** | Second acquire denied while first holds | AC-B08          | B06-AC07        | concurrency                        | B-02 `acquire` CAS contention             | Dual-adapter contention matrix + boundary refuse if start attempted by loser                          |
| **RACE-06** | Shared SoT; deny everywhere while ON    | AC-B06          | B06-AC01 / AC08 | concurrency + security-smoke       | B-02 row SoT; B-03 `assertDenySetAllowed` | Two adapters share **same mutable row**; both observe ACTIVE; deny-set blocked                        |
| **RACE-07** | Crash→TTL/reclaim→fence; stale dead     | AC-B09          | B06-AC04        | crash-ttl                          | B-02 reclaim on expiry                    | Simulate grant loss; advance `dbNow` past `expiresAt`; reclaim bumps fence; old grant HB/release fail |
| **RACE-08** | Commit then crash; lease durable        | AC-B09          | B06-AC04        | crash-ttl                          | B-02 durable row                          | After successful acquire, discard in-memory grant object; new adapter reads ACTIVE from shared row    |
| **RACE-09** | Immediate acquire-fail → no D           | AC-B08          | B06-AC03        | boundary-concurrency               | B-02 contention; B-04 `start`             | Contention/deny acquire → `start` ok:false → D spy never called (**no wait harness**)                 |
| **RACE-10** | Retry without fresh proof blocked       | AC-B10 / AC-B20 | B06-AC05 / AC06 | boundary-concurrency + concurrency | B-02 fence; B-04 `assertWriteAuthority`   | Cached/stale grant retry → write-proof false; release with wrong fence rejected                       |

---

## 7. AC Traceability

| Parent AC  | B06-AC   | Race / note    | Test file              | Scenario (planned)                                                     | Expected evidence                                                            |
| ---------- | -------- | -------------- | ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **AC-B06** | B06-AC01 | RACE-06        | concurrency            | Dual adapters, one shared row: A acquires; B observes ACTIVE           | Both see same fence/holder from SoT                                          |
| **AC-B07** | B06-AC02 | structural     | security-smoke         | Instance-local “I hold lease” flag cannot authorize observe/deny/write | SoT is shared row / port; memory flag insufficient                           |
| **AC-B08** | B06-AC03 | RACE-09        | boundary-concurrency   | Acquire/contention fail → `boundary.start` refuses                     | `ok:false`; D spy not entered                                                |
| **AC-B08** | B06-AC07 | RACE-05        | concurrency            | Second `acquire` while ACTIVE                                          | `ok:false` / CONTENTION; fence unchanged                                     |
| **AC-B09** | B06-AC04 | RACE-07/08     | crash-ttl              | Expiry reclaim + crash durability                                      | Fence bumps; stale grant dead; row remains ACTIVE after memory discard       |
| **AC-B10** | B06-AC05 | RACE-10        | boundary-concurrency   | Retry with cached grant after fence bump                               | `assertWriteAuthority` false; no soft-pass                                   |
| **AC-B20** | B06-AC06 | RACE-10 / T-16 | concurrency + boundary | Wrong fence release + write-proof                                      | Release rejected; boundary auth rejected; no protected mutation path entered |
| Walls      | B06-AC09 | SEC-AC-24      | security-smoke         | Diff/static walls                                                      | No Vault/env/HTTP/live chaos in B-06 files                                   |
| Walls      | B06-AC10 | closures       | security-smoke         | Residual + OD-B-06 checklist                                           | No redesign; residuals preserved; OD-B-06 not reopened                       |

```text
C-B06-04: B06-AC* = TRACEABILITY ONLY
Normative authority remains parent AC / RACE / SEC / COND.
```

---

## 8. Test Architecture

### 8.1 Dual-client SoT pattern (anti-false-positive)

```text
REQUIRED PATTERN (C-B06-01 / RACE-06):
  sharedMockClient ──► single mutable lease row (SoT)
         ▲                    ▲
         │                    │
   Adapter A            Adapter B
   (logical client 1)   (logical client 2)

FORBIDDEN FALSE POSITIVE:
  Separate per-adapter boolean "gateOn" that is not the durable row.
  Fake shared flag disconnected from PrismaMigrationGateAdapter CAS path.
```

Reuse the established B-02 / B-05 mock pattern:

- `mockClient.connectionMigrationGateLease.findUnique` / `updateMany` mutating one `row`
- `$queryRaw` returns controllable `dbNow` for TTL expiry
- `PrismaTransactionService.run` executes work with a txn marker object
- `ConnectionMigrationGateAudit` with `vi.fn` record (smoke only; no OD-B-06 redesign)

### 8.2 Distinguishing consume vs new evidence

| Existing behavior consumed                                | New B-06 evidence added                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| B-02 acquire/contention/CAS/TTL reclaim/fence/release/HB  | Dual-adapter RACE matrix consolidation                             |
| B-03 `assertDenySetAllowed` / `observeOrUnknown`          | Second logical observer deny while shared ACTIVE                   |
| B-04 `start` / `assertWriteAuthority` / release/HB façade | Acquire-fail → refuse D; stale proof → no write; D spy not entered |
| B-05 wall spirit (no Vault/env/HTTP)                      | B-06-local smoke walls + AC-B07 structural                         |

### 8.3 Isolation / cleanup

- Each `describe`/`beforeEach`: reset shared `row`, `dbNow`, `vi.clearAllMocks`
- No real DB, network, Vault, venue, or capital
- FAKE_* / synthetic ids only (IMPL-COND-B06-08)
- No shared mutable state across files beyond vitest process defaults

---

## 9. Exact Test File Plan

### 9.1 `fiv-conn-04-b-06-concurrency.spec.ts`

| Field          | Definition                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**    | Dual-client contention, shared SoT observation, wrong-fence release, retry-without-proof at adapter                                                    |
| **RACE**       | RACE-05, RACE-06 (SoT half), RACE-10 (adapter half)                                                                                                    |
| **AC**         | B06-AC01, AC05, AC06, AC07 (AC-B06/B08/B10/B20)                                                                                                        |
| **Fixtures**   | Shared `mockClient` + mutable `row`; **two** `PrismaMigrationGateAdapter` instances; operator/job actors; optional audit `vi.fn`                       |
| **Consumed**   | `PrismaMigrationGateAdapter.acquire/release/heartbeat/observe`                                                                                         |
| **Assertions** | A acquires; B acquire denied without fence bump; B.observe sees ACTIVE same holder/fence; stale fence release fails; after reclaim, old grant ops fail |
| **Isolation**  | Dedicated file; reset row each test                                                                                                                    |
| **Cleanup**    | `beforeEach` clear mocks + inactive row                                                                                                                |

### 9.2 `fiv-conn-04-b-06-crash-ttl.spec.ts`

| Field          | Definition                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**    | Crash/TTL/reclaim/fence advancement; durable lease after memory discard                                                                                                              |
| **RACE**       | RACE-07, RACE-08                                                                                                                                                                     |
| **AC**         | B06-AC04 (AC-B09)                                                                                                                                                                    |
| **Fixtures**   | Shared row + controllable `dbNow`; adapter A/B; grants captured then discarded                                                                                                       |
| **Consumed**   | Acquire; expiry path reclaim (`lease_expired_reclaim` class); release/HB reject stale fence                                                                                          |
| **Assertions** | After acquire, drop grant variable / new adapter instance still sees ACTIVE (RACE-08); advance now past expiry; reclaim bumps `fenceGeneration`; old grant HB/release fail (RACE-07) |
| **Isolation**  | Time controlled solely via mock `$queryRaw` now                                                                                                                                      |
| **Cleanup**    | Reset `dbNow` + row                                                                                                                                                                  |

### 9.3 `fiv-conn-04-b-06-boundary-concurrency.spec.ts`

| Field          | Definition                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**    | Boundary refuse D on acquire fail; stale/wrong fence cannot authorize D; retry without proof                                                                        |
| **RACE**       | RACE-09, RACE-10 (boundary), AC-B20 boundary half                                                                                                                   |
| **AC**         | B06-AC03, AC05, AC06 (AC-B08/B10/B20)                                                                                                                               |
| **Fixtures**   | `Conn04MigrationBoundaryService` + `MigrationGatePort` / `MigrationGateDurableAuthority` doubles; **D execution spy** (`vi.fn`) that must remain uncalled on refuse |
| **Consumed**   | `boundary.start`, `assertWriteAuthority`, `release`/`heartbeat` façade                                                                                              |
| **Assertions** | Contention/fail acquire → `start.ok===false` → D spy not called (**no wait**); stale grant → write-proof false → D spy not called; wrong fence release rejected     |
| **Isolation**  | Port doubles only (may optionally wire real adapter+shared row for one end-to-end start-fail case)                                                                  |
| **Cleanup**    | Clear spies each test                                                                                                                                               |

**RACE-09 explicit non-design:**

```text
DO NOT implement timed wait / queue / acquireTimeout sleep.
Model failure as immediate GATE_CONTENTION / acquire ok:false
(already produced by B-02 / port doubles).
```

### 9.4 `fiv-conn-04-b-06-security-smoke.spec.ts`

| Field          | Definition                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**    | RACE-06 deny-set observation; AC-B07 structural; walls; residual/OD-B-06 checklist                                                                                                   |
| **RACE**       | RACE-06 (deny half)                                                                                                                                                                  |
| **AC**         | B06-AC02, AC08, AC09, AC10                                                                                                                                                           |
| **Fixtures**   | Shared ACTIVE observation via real enforcement + migrationGate double observing ACTIVE from shared state; `readFileSync` walls like B-05 S3                                          |
| **Consumed**   | `assertDenySetAllowed`, `observeOrUnknown`; boundary/module source walls                                                                                                             |
| **Assertions** | While shared SoT ACTIVE, deny-set throws Conflict; process-local flag alone insufficient; no Vault/env/HTTP/second SoT; D-B03 residuals not “closed” by B-06; OD-B-06 not redesigned |
| **Isolation**  | Smoke only — no B-06 harness expansion into mid-flight Vault residual (D-B03-08 preserved)                                                                                           |
| **Cleanup**    | N/A beyond mocks                                                                                                                                                                     |

---

## 10. Existing Surfaces Consumed

| Surface                   | Path                                                     | Methods / symbols                                                                              | Role                                          |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| B-02 adapter              | `prisma-migration-gate.adapter.ts`                       | `acquire`, `release`, `heartbeat`, `observe`, `reclaimAsOperator`, `assertDurableAuthorityCas` | Shared SoT under dual clients                 |
| B-02 contracts            | `migration-gate.ts`, `migration-gate.port.ts`, constants | grants, reasons, purposes                                                                      | Types / invariants                            |
| B-03 enforcement          | `connection-migration-gate-enforcement.ts`               | `assertDenySetAllowed`, `observeOrUnknown`, `GATE_DENY_PUBLIC_MESSAGE`                         | Deny while ON                                 |
| B-04 boundary             | `conn04-migration-boundary.service.ts`                   | `start`, `assertWriteAuthority`, `release`, `heartbeat`                                        | Refuse D / write-proof                        |
| Audit helper (smoke only) | `connection-migration-gate-audit.ts`                     | `record`                                                                                       | Optional emit smoke — **no redesign**         |
| Prior fixture patterns    | `prisma-migration-gate.adapter.spec.ts`, B-05 specs      | mockClient / row / dbNow                                                                       | Reuse patterns; **do not MODIFY** those files |

```text
DO NOT duplicate B-02/B-03/B-04 implementation.
DO NOT MODIFY closed ownership specs by default (IMPL-COND-B06-07/10).
```

---

## 11. Negative / Security Assertions (required)

| #   | Negative assertion                                    | Primary file           |
| --- | ----------------------------------------------------- | ---------------------- |
| N1  | Process-local memory cannot be authoritative SoT      | security-smoke         |
| N2  | Second acquire cannot obtain lease while ACTIVE       | concurrency            |
| N3  | Acquire failure cannot start D (D spy uncalled)       | boundary-concurrency   |
| N4  | Stale grant cannot authorize D                        | boundary-concurrency   |
| N5  | Wrong fence cannot release                            | concurrency / boundary |
| N6  | Wrong fence cannot authorize D                        | boundary-concurrency   |
| N7  | Wrong fence cannot mutate protected state (no D path) | boundary-concurrency   |
| N8  | Retry cannot bypass fresh proof                       | boundary-concurrency   |
| N9  | Deny-set observers cannot proceed while gate ON       | security-smoke         |

```text
Avoid positive-path-only coverage.
Each RACE must include at least one explicit negative assertion.
```

---

## 12. Regression Plan

### 12.1 Dedicated B-06 command

```bash
cd apps/api && npx vitest run \
  src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts \
  src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts \
  src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts \
  src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts
```

Expected count: **TBD at implementation** (plan target: roughly 12–24 focused tests; not invented as a hard gate here).

### 12.2 Related closed-slice regression

```bash
cd apps/api && npx vitest run \
  src/modules/connections/prisma-migration-gate.adapter.spec.ts \
  src/modules/connections/connection-migration-gate-enforcement.spec.ts \
  src/modules/connections/connections.service.fiv-conn-04-b-03.spec.ts \
  src/modules/connections/conn04-migration-boundary.service.spec.ts \
  src/modules/connections/migration-gate.spec.ts \
  src/modules/connections/fiv-conn-04-b-05-audit-integrity.spec.ts \
  src/modules/connections/fiv-conn-04-b-05-secret-leakage.spec.ts \
  src/modules/connections/fiv-conn-04-b-05-security-smoke.spec.ts
```

### 12.3 Failure interpretation

| Failure                               | Action                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| B-06 dedicated fail                   | Fix **B-06 specs** or escalate if production defect         |
| Closed-suite fail caused by B-06 edit | Revert B-06 approach; do not “fix” by editing closed suites |
| Apparent production defect            | **STOP + escalate** (C-B06-03); no silent production patch  |

Also run `npx tsc --noEmit -p tsconfig.json` for type-safety (B-05 CI lesson).

---

## 13. Production Impact

```text
PRODUCTION CHANGES = NONE
```

### Untouched production files (explicit)

| Path                                               | Why untouched        |
| -------------------------------------------------- | -------------------- |
| `prisma-migration-gate.adapter.ts`                 | Consume only         |
| `connection-migration-gate-enforcement.ts`         | Consume only         |
| `conn04-migration-boundary.service.ts`             | Consume only         |
| `connection-migration-gate-audit.ts`               | Smoke only           |
| `migration-gate.ts` / ports / constants            | Consume only         |
| `connections.service.ts` / controller / module     | No redesign          |
| Security Audit core / classification / attribution | OD-B-06 not reopened |
| Prisma schema / migrations                         | None                 |

### Blocker rule

```text
If a B-06 requirement cannot be verified without production modification:
  BLOCKER / ESCALATION REQUIRED
  Do NOT propose the modification inside B-06 implementation.
```

**Current planner assessment:** No blocker. All required seams exist on CLOSED surfaces under dual-client mocks.

---

## 14. Exact File Delta

### CREATE (after Implementation Planning Review authorizes coding)

| Path                                                                             | Why                                  |
| -------------------------------------------------------------------------------- | ------------------------------------ |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts`          | RACE-05/06/10 adapter evidence       |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts`            | RACE-07/08                           |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts` | RACE-09/10 + AC-B20 boundary         |
| `apps/api/src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts`       | RACE-06 deny + walls + AC-B07        |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-06-implementation-report.md` | Evidence report (implementation act) |

### CREATE (this act only)

| Path                                                                               | Why               |
| ---------------------------------------------------------------------------------- | ----------------- |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-06-implementation-planning.md` | **THIS ARTIFACT** |

### MODIFY

```text
NONE expected
```

### DELETE

```text
NONE
```

### NO CHANGE

- B-02/B-03/B-04/B-05 production and closed tests
- Prisma/schema/migrations
- OD-B-06
- D-B03 residuals
- Wave-5 / 04-A leftovers
- Unrelated dirty/untracked files
- Prior uncommitted B-05 CI diffs (outside B-06; do not fold into B-06)

---

## 15. Implementation Conditions

| ID                   | Condition                                           | Class                |
| -------------------- | --------------------------------------------------- | -------------------- |
| **IMPL-COND-B06-01** | No production changes                               | Blocking             |
| **IMPL-COND-B06-02** | RACE-05…RACE-10 coverage in dedicated evidence      | Blocking             |
| **IMPL-COND-B06-03** | AC-B06…AC-B10 + AC-B20 traceability in report       | Blocking             |
| **IMPL-COND-B06-04** | No OD-B-06 reopen                                   | Blocking             |
| **IMPL-COND-B06-05** | D-B03-04/06/08 preserved                            | Blocking             |
| **IMPL-COND-B06-06** | Dual-client unit/integration; **no testcontainers** | Blocking             |
| **IMPL-COND-B06-07** | Dedicated `fiv-conn-04-b-06-*.spec.ts` only         | Blocking             |
| **IMPL-COND-B06-08** | FAKE_*/doubles only; no live capital chaos          | Blocking             |
| **IMPL-COND-B06-09** | Related closed suites remain green                  | Non-blocking quality |
| **IMPL-COND-B06-10** | Authorized file delta only                          | Blocking             |

---

## 16. Scope-Creep Walls

```text
PROHIBITED:
  testcontainers
  live dual-process Postgres
  wait/queue timeout implementation
  lease / fencing / TTL redesign
  audit redesign / OD-B-06 reopen
  B-05 rewrite
  D-B03 remediation
  04-D / FIV / C7 / capital chaos
  Wave-5 / 04-A leftovers
  unrelated refactors / dependency upgrades
  claiming closure of B-02 live dual-process residual
```

---

## 17. Implementation Sequence

```text
Stage 1 — Create concurrency evidence (RACE-05/06/10 adapter)
Stage 2 — Create crash/TTL evidence (RACE-07/08)
Stage 3 — Create boundary/fencing evidence (RACE-09/10 + AC-B20)
Stage 4 — Create security smoke (RACE-06 deny + AC-B07 + walls)
Stage 5 — Run dedicated B-06 vitest command
Stage 6 — Run related B-02/B-03/B-04/B-05 regression + tsc
Stage 7 — Inspect git status/diff (authorized delta only)
Stage 8 — Produce implementation report with RACE→AC→test matrix

NO COMMIT / NO PUSH in implementation planning.
NO COMMIT / NO PUSH until a separate explicit instruction after implementation review.
```

---

## 18. Risks

| ID    | Risk                                                    | Mitigation                                                |
| ----- | ------------------------------------------------------- | --------------------------------------------------------- |
| RK-01 | Dual-client uses fake boolean SoT                       | Mandate shared mutable lease row through adapter CAS path |
| RK-02 | Accidental wait/timeout harness for RACE-09             | C-B06-05; immediate contention only                       |
| RK-03 | Editing closed B-02 specs instead of dedicated files    | IMPL-COND-B06-07/10                                       |
| RK-04 | Claiming live dual-process proof                        | C-B06-02                                                  |
| RK-05 | Silently remediating D-B03 mid-flight via “concurrency” | IMPL-COND-B06-05; smoke excludes Vault orphan cleanup     |
| RK-06 | Touching leftovers / B-05 dirty CI files                | IMPL-COND-B06-10; leave untouched                         |
| RK-07 | TypeScript mock.calls empty-tuple CI failures           | Type mock fns with args (B-05 lesson)                     |

---

## 19. Escalation Rules

```text
STOP + ESCALATE when:
  1. A RACE/AC cannot be proven without production redesign
  2. Closed-suite failure appears to require closed-file MODIFY
  3. Temptation to add testcontainers / live dual-process
  4. Temptation to invent wait/queue timeout for RACE-09
  5. Temptation to reopen OD-B-06 or close D-B03 residuals
  6. Temptation to absorb Wave-5 / 04-A leftovers into B-06

Escalation output:
  BLOCKER / ESCALATION REQUIRED
  + exact gap
  + why production change would be needed
  + proposed governance amendment path (not silent patch)
```

---

## 20. Final Planning Verdict

```text
IMPLEMENTATION PLANNING VERDICT = PASS
```

```text
Rationale:
  - Frozen C-B06-01…05 fully operable as a TEST-ONLY plan
  - Existing B-02/B-03/B-04 seams sufficient; PRODUCTION CHANGES = NONE
  - RACE-05…10 + AC-B06…10 + AC-B20 mapped to four dedicated specs
  - No blockers / no escalation required at planning time
  - Leftovers recorded and excluded
```

```text
THIS ARTIFACT DOES NOT AUTHORIZE CODING.
NEXT GATE = FIV-CONN-04-B-06 IMPLEMENTATION PLANNING REVIEW
Only after that review PASSES may implementation be authorized.
```

```text
NO IMPLEMENTATION PERFORMED.
NO TESTS CREATED.
NO PRODUCTION MODIFIED.
NO COMMIT.
NO PUSH.
Protected leftovers = UNTOUCHED.
```

**END OF FIV-CONN-04-B-06 IMPLEMENTATION PLANNING**
