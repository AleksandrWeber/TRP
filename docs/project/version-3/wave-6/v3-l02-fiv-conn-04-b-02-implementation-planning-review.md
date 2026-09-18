# FIV-CONN-04-B-02 Implementation Planning Review

**Document:** FIV-CONN-04-B-02 Durable Migration Gate Lease — Implementation Planning Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-02 — Durable Migration Gate Lease  
**Authority:** Engineering Implementation Planning Review (under PO + Chief Architect)  
**Nature:** **REVIEW ONLY.** Does **not** implement B-02. Does **not** modify Prisma/schema/code/B-01. Does **not** authorize B-03, 04-D, Vault, FIV, C7, or capital.

**Reviewed artifact:** [`v3-l02-fiv-conn-04-b-02-implementation-planning-package.md`](./v3-l02-fiv-conn-04-b-02-implementation-planning-package.md) (`f82981c…`)

**Repository baseline (review start):** `f82981cd8cf4390e78ac304f884a1039d44310a9` (`HEAD == origin/main`)

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS

B-02 production implementation = NOT STARTED BY THIS ACT
DO NOT IMPLEMENT B-02 IN THIS TASK
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Review Purpose

Determine whether the B-02 Implementation Planning Package is sufficiently precise and safe for production implementation — i.e., whether Engineering can implement exactly what was approved **without making additional architectural or governance decisions**.

---

## 2. Current State

| Item                                  | Status                                           |
| ------------------------------------- | ------------------------------------------------ |
| FIV-CONN-04-A                         | **CLOSED**                                       |
| FIV-CONN-04-B-01                      | **CLOSED**                                       |
| B-02 Slice Approval                   | **GRANTED**                                      |
| B-02 Decision Freeze                  | **COMPLETE**                                     |
| B-02 Arch / Sec                       | **PASS WITH CONDITIONS**                         |
| B-02 Implementation Planning Package  | **CREATED**                                      |
| B-02 production implementation        | **NOT STARTED**                                  |
| B-03 / 04-D                           | **NOT AUTHORIZED**                               |
| FIV / Capital / C7 / allowRealVenueIo | NOT PERFORMED / NOT ACTIVATED / DENY-ALL / FALSE |

---

## 3. Authoritative Artifacts

| Artifact                                    | Role                                     |
| ------------------------------------------- | ---------------------------------------- |
| B-02 Planning Package                       | Design SoT                               |
| B-02 Architecture / Security Reviews        | COND-ARCH / COND-SEC mapping             |
| B-02 Decision Freeze                        | COND-B02-01…06 frozen                    |
| B-02 Slice Approval                         | Scope authorization                      |
| B-02 Implementation Planning Package        | File/algorithm blueprint under review    |
| Closed B-01 contract + `migration-gate*.ts` | Port/semantics (inspected, not modified) |
| Parent OD-B-01…08                           | Not reopened                             |

---

## 4. Slice Approval Confirmation

```text
FIV-CONN-04-B-02 SLICE APPROVAL = GRANTED (confirmed)
AUTHORIZED SCOPE matches implementation plan:
  durable lease, persistence, acquire/release/heartbeat,
  reclaim, fenceGeneration, ≤4h, DB NOW(), audit,
  MigrationGatePort adapter, CAS helper for 04-D
EXCLUSIONS preserved:
  B-03 hooks, 04-D UPDATE/backfill, Vault/creds, FIV, C7, capital, venue I/O
```

```text
SLICE APPROVAL ALIGNMENT = PASS
```

---

## 5. Repository Evidence

Plan correctly cites:

| Evidence                                                          | Verdict                    |
| ----------------------------------------------------------------- | -------------------------- |
| Flat `connections/` module + Symbol ports                         | **PASS**                   |
| Global `PrismaTransactionService` / `prismaClientForTransaction`  | **PASS**                   |
| `saveIfVersion` `updateMany` + `count !== 1` CAS                  | **PASS**                   |
| `WorkspaceKillSwitchState` satellite PK pattern                   | **PASS**                   |
| `SecurityAuditService.record(write, transaction?)`                | **PASS**                   |
| Catalog/attribution registration files                            | **PASS**                   |
| Migration naming `…_v3_l02_fiv_conn_04_b_02_migration_gate_lease` | **PASS**                   |
| Dirty `connections.module.ts` leftover warning                    | **PASS** (correct caution) |

```text
REPOSITORY EVIDENCE = PASS
```

---

## 6. File Map Review

| Proposed path                                | Exists today? | Planned op       | In B-02 scope? | Overlap                                  |
| -------------------------------------------- | ------------- | ---------------- | -------------- | ---------------------------------------- |
| `schema.prisma`                              | YES           | MODIFY           | YES            | None                                     |
| migration folder                             | NO            | CREATE           | YES            | None                                     |
| `prisma-migration-gate.adapter.ts`           | NO            | CREATE           | YES            | Implements B-01 port; does not edit B-01 |
| adapter spec                                 | NO            | CREATE           | YES            | None                                     |
| `connection-migration-gate-audit.ts` (+spec) | NO            | CREATE           | YES            | None                                     |
| `migration-gate.constants.ts`                | NO            | CREATE optional  | YES            | None                                     |
| `connections.module.ts`                      | YES           | MODIFY           | YES            | Must stage only B-02 wiring              |
| audit classification/attribution             | YES           | MODIFY           | YES            | Catalog only                             |
| validation integration (optional)            | —             | CREATE as needed | YES            | None                                     |
| B-01 `migration-gate*.ts`                    | YES           | **NO CHANGE**    | Correct        | **No B-01 edit required**                |

No unnecessary architecture. No B-03/04-D file ownership.

```text
FILE MAP REVIEW = PASS
```

---

## 7. Prisma Review

| Check                                | Result                                      |
| ------------------------------------ | ------------------------------------------- |
| Model/table names                    | **PASS** — repo conventions                 |
| Fields / nullability / defaults      | **PASS** — match freeze                     |
| `fenceGeneration Int @default(0)`    | **PASS** — sole fencing; not `fencingToken` |
| No workspace/provider/env columns    | **PASS**                                    |
| String state `INACTIVE\|ACTIVE`      | **PASS**                                    |
| Timestamps `DateTime` + `@updatedAt` | **PASS**                                    |
| PK singleton                         | **PASS**                                    |

```text
PRISMA REVIEW = PASS
```

---

## 8. Migration Review

| Check                               | Result                                           |
| ----------------------------------- | ------------------------------------------------ |
| Name slug                           | **PASS**                                         |
| Table + PK                          | **PASS**                                         |
| Seed INACTIVE / fence=0             | **PASS**                                         |
| `ON CONFLICT DO NOTHING`            | **PASS** — cannot reset fence/holder/until/state |
| Forward-only rollback guidance      | **PASS**                                         |
| No migration created in this review | **PASS**                                         |

```text
MIGRATION REVIEW = PASS
```

---

## 9. Singleton Review

PK `FIV-CONN-04`, UPDATE-only hot path, missing row → UNKNOWN, purpose bound.

```text
SINGLETON REVIEW = PASS
```

---

## 10. Acquire Review

| Requirement                               | Result                          |
| ----------------------------------------- | ------------------------------- |
| Global gate + purpose + privileged actor  | **PASS**                        |
| DB time                                   | **PASS** (SELECT NOW / SQL NOW) |
| Immediate contention; no queue/wait/retry | **PASS**                        |
| Atomic takeover via `updateMany` CAS      | **PASS**                        |
| Fence +1 on success                       | **PASS**                        |
| Same-txn audit                            | **PASS**                        |
| Rollback ⇒ no authority                   | **PASS**                        |

**Critical check — check-then-save:** Plan uses read for `priorFence` / path selection, but **authorization is the CAS `updateMany`** (`fenceGeneration=priorFence` + inactive/expired predicate + `count=1`). Lost races map to CONTENTION. This is **not** check-then-save as sole authority.

**Condition:** Implementation MUST keep eligibility predicates inside the `updateMany` WHERE (and prefer `SELECT … FOR UPDATE` on the singleton row). Application-only eligibility without CAS = defect.

```text
ACQUIRE REVIEW = PASS WITH CONDITIONS (see IMPL-COND-B02-01)
```

---

## 11. Fencing Review

| Check                                   | Result                          |
| --------------------------------------- | ------------------------------- |
| Sole `fenceGeneration`                  | **PASS**                        |
| No `fencingToken` / UUID / memory token | **PASS**                        |
| Protected CAS predicate exact           | **PASS** (`expires_at > NOW()`) |
| Stale HB/release/mutation fail          | **PASS** (designed)             |
| Helper for 04-D same-txn                | **PASS**                        |

```text
FENCING REVIEW = PASS
```

---

## 12. ≤4h Review

Durable enforcement via clamp + persisted `authorizedUntil` + heartbeat SQL ceiling. App-only check alone rejected by plan.

Invariant `expiresAt ≤ authorizedUntil` stated.

```text
<=4H REVIEW = PASS
```

**Condition:** Impl must prove SQL/CAS predicates (not only B-01 pure helpers) — IMPL-COND-B02-02.

---

## 13. TTL Review

15m / ≤5m classified as ops defaults; ≤4h governance frozen; config cannot exceed max; TTL ≠ window.

```text
TTL REVIEW = PASS
```

---

## 14. Heartbeat Review

Owner+fence+gate+purpose+ACTIVE+not expired+≤`authorizedUntil`; atomic; no resurrection; no fence bump.

```text
HEARTBEAT REVIEW = PASS
```

---

## 15. Release Review

Owner+fence+gate+purpose CAS; stale cannot clear newer; mappings for inactive/expired/mismatch.

```text
RELEASE REVIEW = PASS
```

---

## 16. Stale Reclaim Review

Acquire-on-expired CAS; fence +1; audit; concurrent one-winner; operator reclaim privileged, no emergency bypass.

```text
STALE RECLAIM REVIEW = PASS
```

**Condition:** Operator reclaim authorization check must reuse privileged-actor assertion (ST-B21/B24) — IMPL-COND-B02-03.

---

## 17. DB Clock Review

CAS/expiry/reclaim/HB/validate handoff use DB `NOW()`. App `Date` not sole authority.

```text
DB CLOCK REVIEW = PASS
```

**Condition:** When passing `dbNow` into Prisma `DateTime` comparisons, values MUST originate from DB `SELECT NOW()` (or SQL `NOW()` in WHERE), not `new Date()` — IMPL-COND-B02-04.

---

## 18. Transaction Review

Mutating ops short txn; no Vault/HTTP/network/queue/waits; rollback grants nothing.

```text
TRANSACTION REVIEW = PASS
```

---

## 19. Audit Review

| Check                                               | Result   |
| --------------------------------------------------- | -------- |
| Family `connection.migration-gate`                  | **PASS** |
| Catalog before emit                                 | **PASS** |
| Attribution: actorId required; workspaceId optional | **PASS** |
| Same-txn for acquire/reclaim/release                | **PASS** |
| Fail → rollback lease                               | **PASS** |
| No secrets / `fencingToken`                         | **PASS** |
| Existing Security Audit only                        | **PASS** |

Heartbeat success audit “prefer” same-txn is acceptable if state change is committed with durable evidence; failures must still be auditable without becoming fail-open.

```text
AUDIT REVIEW = PASS WITH CONDITIONS (IMPL-COND-B02-05)
```

---

## 20. DI Review

`MIGRATION_GATE_PORT` → `PrismaMigrationGateAdapter` via `useExisting`/`useFactory`; B-01 port unchanged; export port; no composition-root adapter.

```text
DI REVIEW = PASS
```

**Condition:** Stage only intentional B-02 provider/export lines in dirty `connections.module.ts` — IMPL-COND-B02-06.

---

## 21. Error / UNKNOWN Review

Mapping table complete; DB uncertainty → `GATE_UNKNOWN` / `UNKNOWN` → DENY; no fail-open.

```text
ERROR / UNKNOWN REVIEW = PASS
```

---

## 22. R01–R15 Review

All fifteen races specified with txn/CAS/winner/fence/state/audit. No under-specified race requiring new design decision.

```text
R01–R15 REVIEW = PASS
```

**Condition:** Prefer `FOR UPDATE` on singleton for R01/R06 (plan marks optional) — IMPL-COND-B02-01.

---

## 23. B-03 Boundary

No deny hooks planned. Port observe/validate only.

```text
B-03 BOUNDARY = PASS
```

---

## 24. 04-D Boundary

No environment UPDATE/backfill/Vault. CAS helper only.

```text
04-D BOUNDARY = PASS
```

---

## 25. S20 Residual

Correctly classified as ops-trust; no generic DB ACL / freeze / emergency lock invented.

```text
S20 RESIDUAL = PASS
```

---

## 26. Test Plan Review

T01–T22 cover required groups. ST-B21/22/23/24/26 owned by B-02; ST-B25 deferred to B-03. Colocated + optional integration path matches repo.

```text
TEST PLAN REVIEW = PASS
```

---

## 27. B02-AC01…AC33 Review

| AC range  | Classification                                  |
| --------- | ----------------------------------------------- |
| AC01–AC33 | **READY** (all have impl+test evidence mapping) |

No criterion weakened. None **BLOCKED**. None require governance reopen.

```text
B02-AC01…AC33 = ALL READY
```

---

## 28. Implementation Sequence Review

Phases 1→10: schema → catalog → observe/validate → acquire/reclaim → HB/release → operator/CAS helper → DI → tests → regression → report.

Safer than emitting before catalog. No unsafe intermediate product path if DI export occurs before enabling callers (B-03/04-D not started).

Optional refinement (not blocking): wire DI earlier in Phase 3 for adapter testing — acceptable either way.

```text
SEQUENCE REVIEW = PASS
```

---

## 29. Security Handoff

Plan §34 covers TOCTOU, stale authority, fencing, singleton, 4h, TTL, DB clock, audit atomicity, fail-closed, concurrency, S20, B-03/04-D walls, operator reclaim.

```text
SECURITY HANDOFF = PASS
```

---

## 30. Findings

### Strengths

1. Exact Prisma model and idempotent seed that cannot reset ACTIVE leases.
2. CAS `updateMany` as authority; check-then-save alone forbidden.
3. Durable ≤4h + heartbeat ceiling predicates.
4. Closed B-01 port preserved; no B-01 edits.
5. Audit catalog + same-txn path via existing `SecurityAuditService`.
6. Clear B-03/04-D/S20 walls.
7. R01–R15 and B02-AC verification fully mapped.

### Non-blocking gaps (conditions)

See §31 — implementation-time verification only; **no new OD-B / architecture decision required**.

### Blockers

```text
BLOCKER COUNT = 0
```

---

## 31. Conditions

Concrete implementation-time verification conditions (do **not** reopen governance):

| ID                   | Condition                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **IMPL-COND-B02-01** | Singleton acquire/reclaim MUST use atomic `updateMany` eligibility predicates; **prefer** `SELECT … FOR UPDATE` on the singleton row inside the txn for R01/R06 serialization. |
| **IMPL-COND-B02-02** | ≤4h / heartbeat ceiling MUST be proven via SQL/CAS predicates in tests (T11/T12/T13/ST-B22), not only pure B-01 helpers.                                                       |
| **IMPL-COND-B02-03** | Operator reclaim MUST enforce privileged actor authorization (same class as acquire); no ungated method; ST-B21/B24.                                                           |
| **IMPL-COND-B02-04** | All CAS expiry comparisons MUST use DB-originated time (`SELECT NOW()` and/or SQL `NOW()` in WHERE), never sole `new Date()` / `Date.now()`.                                   |
| **IMPL-COND-B02-05** | Register `connection.migration-gate` in classification+attribution **before** first emit; acquire/reclaim/release lease+audit same txn (audit failure rolls back lease).       |
| **IMPL-COND-B02-06** | When modifying dirty `connections.module.ts`, stage **only** B-02 provider/export lines; do not fold protected leftovers into the B-02 commit.                                 |

```text
CONDITIONS = BINDING FOR IMPLEMENTATION
NEW GOVERNANCE DECISIONS REQUIRED = NONE
```

---

## 32. Risks

| ID    | Risk                                   | Treatment                          |
| ----- | -------------------------------------- | ---------------------------------- |
| IR-01 | Accidental app-clock CAS               | IMPL-COND-B02-04 + T13             |
| IR-02 | Emit before catalog                    | Phase 2 + IMPL-COND-B02-05         |
| IR-03 | Dirty module commit bleed              | IMPL-COND-B02-06                   |
| IR-04 | 04-D later check-then-save             | CAS helper + slice wall (residual) |
| IR-05 | Optional FOR UPDATE omitted under load | IMPL-COND-B02-01                   |

---

## 33. Non-Scope

Confirmed excluded from B-02 implementation: B-03 hooks; 04-D UPDATE/backfill; Vault/credentials; FIV; C7; capital; venue I/O; soft re-acquire; advisory-only SoT; B-01 redesign; generic DB ACL.

---

## 34. Safety Verification

| Control               | This review act   |
| --------------------- | ----------------- |
| Database writes       | **ZERO**          |
| Prisma schema changes | **ZERO**          |
| Vault / credentials   | **ZERO**          |
| External I/O          | **ZERO**          |
| FIV                   | **NOT PERFORMED** |
| Capital               | **ZERO**          |
| C7                    | **DENY-ALL**      |
| allowRealVenueIo      | **FALSE**         |
| Protected leftovers   | **UNTOUCHED**     |
| B-01 files            | **UNTOUCHED**     |

```text
SAFETY VERIFICATION = PASS
```

---

## 35. Verdict

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
```

### Meaning

Engineering can implement the approved B-02 durable lease **without new architectural or governance decisions**, provided IMPL-COND-B02-01…06 are observed and verified during implementation.

### Why not bare PASS

Six concrete implementation-time verification conditions remain (FOR UPDATE preference, durable 4h proof, operator reclaim auth, DB clock binding, catalog/audit atomicity, dirty-module staging). None reopen OD-B or redesign B-01.

### Why not BLOCKED

Zero unresolved items requiring a new decision. File map, Prisma/migration/seed, CAS, fencing, ≤4h, audit, DI, races, ACs, and boundaries are specified.

### Answer to review question

```text
Can Engineering implement exactly what was approved without making
additional architectural or governance decisions?

YES — under IMPL-COND-B02-01…06 (implementation verification only).
```

---

## 36. Next Gate

```text
Next gate:
  FIV-CONN-04-B-02 IMPLEMENTATION

DO NOT implement B-02 in this review act.
Carry IMPL-COND-B02-01…06 into the implementation task.
DO NOT start B-03 / 04-D / FIV.
C7 = DENY-ALL; allowRealVenueIo = FALSE.
```

### Final state

```text
FIV-CONN-04-B-02 = SLICE APPROVAL GRANTED
Implementation Planning Package = REVIEWED
Implementation Planning Review = PASS WITH CONDITIONS
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

**END OF FIV-CONN-04-B-02 IMPLEMENTATION PLANNING REVIEW**
