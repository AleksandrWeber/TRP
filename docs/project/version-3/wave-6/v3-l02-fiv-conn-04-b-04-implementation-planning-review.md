# FIV-CONN-04-B-04 Implementation Planning Review

**Document:** FIV-CONN-04-B-04 Backfill Integration Boundary — Implementation Planning Review
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-04 — 04-D integration boundary
**Authority:** Product Owner + Chief Architect + Security (Implementation Planning Review)
**Nature:** **IMPLEMENTATION PLANNING REVIEW ONLY.** Does **not** implement B-04. Does **not** modify production code, tests, Prisma, migrations, Vault, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Reviewed artifact:** [`v3-l02-fiv-conn-04-b-04-implementation-planning-package.md`](./v3-l02-fiv-conn-04-b-04-implementation-planning-package.md) @ `f29109223c740013045c5aa7ea871b0744b24a80`

```text
NO IMPLEMENTATION PERFORMED.
```

---

## 1. Review Verdict

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
```

```text
Interpretation:
  The Implementation Planning Package is sufficiently precise and safe to
  proceed to FIV-CONN-04-B-04 IMPLEMENTATION under Slice Approval and the
  binding IMPL-COND-B04-* conditions in §16.

  Conditions are non-blocking clarifications that MUST be obeyed during
  coding. They do not reopen OD-B / C-B04 freezes.

  This review does not itself write code.
```

```text
B-04 Slice Approval = GRANTED (unchanged)
B-04 coding in this act = NOT PERFORMED
04-D / FIV / C7 / live I/O / capital = NOT AUTHORIZED
```

Protected dirty/untracked leftovers were **not** modified.

---

## 2. Governance Inputs

| Gate | Artifact | Status |
| ---- | -------- | ------ |
| B-01 / B-02 / B-03 | Closed contracts | **CLOSED** |
| B-04 Planning Package | `…-b-04-planning-package.md` | COMPLETE |
| B-04 Planning Review | `…-b-04-planning-review.md` @ `913f095…` | PASS WITH CONDITIONS |
| B-04 Decision Freeze | `…-b-04-decision-freeze.md` @ `720b5df…` | **APPROVED** |
| B-04 Slice Approval | `…-b-04-slice-approval.md` @ `720b5df…` | **GRANTED** |
| B-04 Implementation Planning | `…-b-04-implementation-planning-package.md` @ `f291092…` | Under review |
| Parent OD-B / ARCH-B04 / COND-ARCH-B04 / COND-SEC-B05 | Parent B freezes | **BINDING** |
| Residuals D-B03-04/06/08 | B-03 closure | **PRESERVED** |

### C-B04-01…06 impact

| ID | Impact on this review |
| -- | --------------------- |
| C-B04-01 | Companion DI export **accepted and frozen** as authorized surface (§4) |
| C-B04-02 | heartbeatAt side-effect / no fence bump — **confirmed** in plan |
| C-B04-03 | Internal API only / no public HTTP — **confirmed** |
| C-B04-04 | acquire primary / validate resume / observe≠start — **confirmed** |
| C-B04-05 | HB/release on B04-S1 — **confirmed** |
| C-B04-06 | Zero env UPDATE — **confirmed** |

```text
C-B04-01…06 = SATISFIED BY PLAN (no reopen)
```

---

## 3. Repository Mapping

| Item | Value |
| ---- | ----- |
| Review start HEAD | `f29109223c740013045c5aa7ea871b0744b24a80` |
| origin/main | `f29109223c740013045c5aa7ea871b0744b24a80` |
| HEAD == origin/main | **YES** |

### Independent committed-HEAD inspection

| Evidence | Finding |
| -------- | ------- |
| `migration-gate.port.ts` | acquire/release/heartbeat/observe/validate only; **no** CAS |
| `prisma-migration-gate.adapter.ts` | `assertDurableAuthorityCas(txn, grant)` present; same SoT row |
| `connections.module.ts` (HEAD) | `MIGRATION_GATE_PORT` → `useExisting: PrismaMigrationGateAdapter`; exports port only |
| `connection-migration-gate-enforcement.ts` | observe-only deny-set; must not become write proof |
| `connections.controller.ts` | No gate lifecycle routes |
| Prisma `ConnectionMigrationGateLease` | Singleton durable lease |

### Dirty leftovers (untouched)

Local dirty `connections.module.ts` / `fiv-conn-04-a-*` / wave-5 docs remain present. Plan correctly targets **committed HEAD** and forbids `git add .`.

### DI necessity

```text
Module DI wiring IS NECESSARY for B-04:
  - register Conn04MigrationBoundaryService
  - provide MIGRATION_GATE_DURABLE_AUTHORITY useExisting PrismaMigrationGateAdapter
  - export façade (and/or durable-authority token) for future 04-D consumers
No duplicate adapter provider. No second lease provider.
```

```text
REPOSITORY MAPPING = PASS
```

---

## 4. Durable CAS Contract Review (Critical #1 / #2)

### Companion DI token — architectural freeze

```text
AUTHORIZED EXPORT SURFACE (IMPL-COND-B04-01):
  MigrationGateDurableAuthority / MIGRATION_GATE_DURABLE_AUTHORITY
  bound via Nest useExisting → PrismaMigrationGateAdapter
  method = existing assertDurableAuthorityCas(transaction, grant)
```

| Check | Result |
| ----- | ------ |
| Single SoT (`connection_migration_gate_leases`) | **PASS** — reuse adapter method |
| Reuses B-02 CAS implementation | **PASS** — no new SQL in façade |
| No duplicate lease/fence state | **PASS** |
| No alternate authority mechanism | **PASS** if useExisting only |
| Cannot bypass canonical adapter | **PASS** — forbid informal cast + forbid façade-local CAS SQL |
| Same-transaction CAS semantics | **PASS** — caller-provided `TransactionContext` |
| MigrationGatePort remains Prisma-free | **PASS** — companion preferred |

```text
MigrationGatePort extension with CAS = NOT the default for B-04.
Companion DI token = REQUIRED authorized path for this slice.
```

### Write-proof conditions

| Required condition | Plan coverage | Verdict |
| ------------------ | ------------- | ------- |
| ACTIVE | CAS `state='ACTIVE'` | **PASS** |
| matching gateKey | Adapter constant + grant shape | **PASS** |
| matching purpose | `FIV_CONN_04_MIGRATION_BACKFILL` | **PASS** |
| matching holder | `holderId` predicate | **PASS** |
| matching fenceGeneration | predicate | **PASS** |
| expiresAt > DB NOW() | predicate | **PASS** |
| same-txn CAS | caller txn; no pre-prove txn | **PASS** |
| Client fence not authoritative | claim + CAS | **PASS** |
| observe() cannot prove | forbidden | **PASS** |
| stale / expired / UNKNOWN refuse | CAS false / fail-closed | **PASS** |
| fenceGeneration not incremented by proof | C-B04-02 / heartbeatAt only | **PASS** |
| No Vault/HTTP/venue in CAS txn | explicit | **PASS** |

```text
DURABLE CAS VERDICT = PASS (with IMPL-COND-B04-01 / B04-02)
```

---

## 5. Start / Refuse Review (Critical #3 / C-B04-04)

| Check | Result |
| ----- | ------ |
| Primary start = acquire | **PASS** |
| Resume = validate only | **PASS** |
| observe-only NEVER start | **PASS** |
| Contention ⇒ REFUSE | **PASS** |
| UNKNOWN ⇒ REFUSE | **PASS** |
| Failed acquire ⇒ no implied authority | **PASS** |
| Successful acquire establishes grant for later proof | **PASS** (`holderId = actor.actorId`) |
| validate does not create lease | **PASS** |
| No hidden auto-acquire on resume | **PASS** |

```text
START / REFUSE VERDICT = PASS
```

---

## 6. Heartbeat / Release Review (Critical #4 / C-B04-05)

| Check | Result |
| ----- | ------ |
| Ownership-bound | **PASS** |
| Fence-bound | **PASS** |
| gateKey / purpose bound via grant + port | **PASS** |
| Stale cannot HB/release newer lease | **PASS** |
| EXPIRED / OWNERSHIP_LOST refuse | **PASS** |
| No B-02 lease redesign | **PASS** |
| Owned by B04-S1 | **PASS** |
| HB/release ≠ write authority | **PASS** |

```text
HEARTBEAT / RELEASE VERDICT = PASS
```

---

## 7. Façade Contract Review (Critical #6)

`Conn04MigrationBoundaryService` (illustrative name) reviewed as thin privileged internal façade.

| Operation | Precision | Verdict |
| --------- | --------- | ------- |
| `start` | Privileged; fixed purpose; acquire; Result refuse | **PASS** |
| `resume` | validate only; ACTIVE match | **PASS** |
| `heartbeat` | Delegates to port; ownership/fence | **PASS** |
| `release` | Delegates to port; ownership/fence | **PASS** |
| `assertWriteAuthority` | Caller txn + CAS; no Connection UPDATE | **PASS** |

| Anti-pattern | Plan | Verdict |
| ------------ | ---- | ------- |
| Independent lease/fence state | Forbidden | **PASS** |
| Public HTTP controller | Forbidden | **PASS** |
| Client-authoritative fencing | Claim + CAS | **PASS** |
| Excess surface (observe/write helpers) | Not exposed | **PASS** |
| Fail-closed | UNKNOWN/fail refuse | **PASS** |

Names remain illustrative; **semantics** above are binding.

```text
FAÇADE VERDICT = PASS
```

---

## 8. Transaction-Boundary Review (Critical #5)

| Boundary | Plan | Verdict |
| -------- | ---- | ------- |
| Acquire/HB/release short txn inside B-02 adapter | Yes | **PASS** |
| assertWriteAuthority uses **caller** txn only | Yes — must not open nested prove-then-return txn | **PASS** (+ IMPL-COND-B04-02) |
| Future 04-D UPDATE same txn as CAS | Documented handoff; OUT of B-04 | **PASS** |
| No Vault/HTTP/venue inside authority txn | Explicit | **PASS** |
| No environment UPDATE / 04-D mutation in B-04 | Explicit | **PASS** |

```text
TRANSACTION-BOUNDARY VERDICT = PASS (with IMPL-COND-B04-02)
```

---

## 9. 04-D Boundary Review (Critical #7)

| Forbidden in B-04 | Plan | Verdict |
| ----------------- | ---- | ------- |
| Connection.environment UPDATE | Zero | **PASS** |
| Backfill | Out | **PASS** |
| Vault mutate | Out | **PASS** |
| EXCHANGE create / lifecycle change | Out; B-03 untouched | **PASS** |
| Public migration endpoints | Out | **PASS** |
| Bypass B-03 enforcement | Independent; not weakened | **PASS** |

**Future 04-D may consume:**

```text
- Conn04MigrationBoundaryService.start / resume / heartbeat / release
- Conn04MigrationBoundaryService.assertWriteAuthority(txn, grant)
- MigrationGateGrant issued by successful start
- (optional) MIGRATION_GATE_DURABLE_AUTHORITY directly if needed — still same adapter
```

**Future 04-D must still own:** Vault-proven classification, conditional env UPDATE, per-row audits, batching.

```text
04-D BOUNDARY VERDICT = PASS
```

---

## 10. State / Failure Matrix

Independently verified against B-01 observations; distinctions preserved.

| State | Plan preserves distinction? | UNKNOWN refuse? |
| ----- | --------------------------- | --------------- |
| INACTIVE | Yes (acquire allowed; resume/write refuse) | N/A |
| ACTIVE | Yes (contention vs matching grant) | N/A |
| EXPIRED | Yes (reclaim via acquire; stale refuse) | N/A |
| OWNERSHIP_LOST | Yes | N/A |
| CONTENTION_DENIED | Yes (immediate refuse) | N/A |
| UNKNOWN | Yes — refuse start/resume/HB/release/write | **YES** |

```text
STATE / FAILURE MATRIX = PASS
UNKNOWN => REFUSE confirmed
```

---

## 11. SB-B04-01…12 Review

| ID | Result | Notes |
| -- | ------ | ----- |
| SB-B04-01 | **PASS** | observe-only write rejected |
| SB-B04-02 | **PASS** | client fence claim only |
| SB-B04-03 | **PASS** | UNKNOWN refuse start |
| SB-B04-04 | **PASS** | privileged-only |
| SB-B04-05 | **PASS** | contention refuse |
| SB-B04-06 | **PASS** | stale fence CAS false |
| SB-B04-07 | **PASS** | no ungated backfill/env |
| SB-B04-08 | **PASS** | no cross-workspace grant |
| SB-B04-09 | **PASS** | audit sanitizer reuse |
| SB-B04-10 | **PASS** | no Vault in txn |
| SB-B04-11 | **PASS** | retry without fence fails |
| SB-B04-12 | **PASS** | no public env API |

```text
SB-B04-01…12 = PASS (no weakening)
```

---

## 12. B04-AC01…18 Review

| ID | Result | Mapping adequacy |
| -- | ------ | ---------------- |
| B04-AC01 | **PASS** | start → acquire + T1 |
| B04-AC02 | **PASS** | INACTIVE resume refuse; acquire start |
| B04-AC03 | **PASS** | UNKNOWN + T5 |
| B04-AC04 | **PASS** | contention + T2 |
| B04-AC05 | **PASS** | expired/ownership/fence + tests |
| B04-AC06 | **PASS** | CAS-only success + T10 |
| B04-AC07 | **PASS** | stale after observe + T7/T9/T10 |
| B04-AC08 | **PASS** | pure assert insufficient + T7 |
| B04-AC09 | **PASS** | zero env UPDATE + T14 |
| B04-AC10 | **PASS** | zero Vault + T16 |
| B04-AC11 | **PASS** | zero venue + T17 |
| B04-AC12 | **PASS** | non-privileged reject |
| B04-AC13 | **PASS** | HB/release + T11/T12 |
| B04-AC14 | **PASS** | no public HTTP + T15 |
| B04-AC15 | **PASS** | no Prisma |
| B04-AC16 | **PASS** | no B-01/02/03 redesign + T18 |
| B04-AC17 | **PASS** | existing audit family |
| B04-AC18 | **PASS** | C7/FIV/capital walls |

```text
B04-AC01…18 = PASS (planning completeness)
```

---

## 13. Test-Plan Review

Required scenarios 1–18 are all present in Implementation Planning §13.

| Gap? | Finding |
| ---- | ------- |
| Missing scenario | **NONE** |
| Tests written in this act | **NO** (correct) |

Optional note (non-blocking): T10 should assert CAS receives the **same** `TransactionContext` object the test opens (or mock spy), not merely that CAS returns true.

```text
TEST-PLAN REVIEW = PASS (with IMPL-COND-B04-03 clarification)
```

---

## 14. Slice-Order Review

| Slice | Order | Safe? |
| ----- | ----- | ----- |
| B04-S1 start + HB/release (+ early DI for CAS token OK) | 1 | **YES** |
| B04-S2 write-proof | 2 | **YES** |
| B04-S3 tests/walls | 3 | **YES** |

Matches frozen C-B04-05. Optional single-commit merge remains allowed; semantics unchanged. No scope expansion.

```text
SLICE-ORDER REVIEW = PASS
```

---

## 15. Risks

Plan §17 risks accepted. Highest residual implementation risks:

| Risk | Disposition |
| ---- | ----------- |
| Informal adapter cast / alternate CAS | Blocked by IMPL-COND-B04-01 |
| Nested pre-prove transaction | Blocked by IMPL-COND-B04-02 |
| Pure assert mistaken for durable proof | Blocked by IMPL-COND-B04-04 |
| Leftover contamination of impl commit | R9 — stage only B-04 files |

---

## 16. Conditions

Non-blocking. Must be obeyed during implementation.

| ID | Condition |
| -- | --------- |
| **IMPL-COND-B04-01** | Authorized CAS export = companion `MigrationGateDurableAuthority` + `MIGRATION_GATE_DURABLE_AUTHORITY` provided with **`useExisting: PrismaMigrationGateAdapter`**. Façade MUST inject that token (or the façade wrapping it). **FORBIDDEN:** informal cast of `MigrationGatePort` to adapter; second CAS SQL/implementation; second lease provider; extending `MigrationGatePort` in this slice (companion path required). |
| **IMPL-COND-B04-02** | `assertWriteAuthority` MUST run `assertDurableAuthorityCas` on the **caller-provided** `TransactionContext` only. MUST NOT open a separate `PrismaTransactionService.run` that proves then returns, leaving the future write outside that txn. |
| **IMPL-COND-B04-03** | T10 (or equivalent) MUST demonstrate CAS is invoked with the caller txn context (spy/identity), not only boolean success. |
| **IMPL-COND-B04-04** | Optional `assertPrivilegedEnvironmentUpdateAllowed` precheck MUST NOT call `observe()` to fabricate durable ACTIVE, MUST NOT alone return write success, and MAY be omitted. Durable proof = CAS only. |
| **IMPL-COND-B04-05** | No `ConnectionsController` routes; no Prisma schema/migration; no Connection.environment writes in production or test doubles shipped as B-04 helpers. |

```text
BLOCKERS = NONE
IMPL-COND-B04-01…05 = BINDING FOR IMPLEMENTATION
```

---

## 17. Residuals

| Residual | Reassigned? | Disposition |
| -------- | ----------- | ----------- |
| D-B03-04 | **NO** | **PRESERVED** |
| D-B03-06 | **NO** | **PRESERVED** |
| D-B03-08 | **NO** | **PRESERVED** |

---

## 18. Explicit Implementation Authorization Status

```text
Slice Approval = GRANTED (prior act)
Implementation Planning Review = PASS WITH CONDITIONS
Coding by this review act = NOT PERFORMED

IMPLEMENTATION AUTHORIZATION STATUS:
  B-04 may proceed to the IMPLEMENTATION gate under
  frozen C-B04-01…06 and IMPL-COND-B04-01…05.

  This does NOT authorize 04-D, backfill, Vault mutation,
  FIV, C7, venue I/O, or capital.
```

---

## 19. Next Gate

```text
NEXT GATE:
FIV-CONN-04-B-04 IMPLEMENTATION
```

```text
Do NOT implement 04-D.
Do NOT perform FIV.
Do NOT activate C7.
Do NOT enable live capital / venue I/O.
Stage only B-04 implementation files when coding begins.
Never git add .
```

---

## Final Review State

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
Durable CAS companion DI = AUTHORIZED / FROZEN
Start / HB-release / Write-proof / 04-D wall = PASS
SB-B04-01…12 = PASS
B04-AC01…18 = PASS
Residuals D-B03-04/06/08 = PRESERVED
NO IMPLEMENTATION PERFORMED
```

**END OF FIV-CONN-04-B-04 IMPLEMENTATION PLANNING REVIEW**
