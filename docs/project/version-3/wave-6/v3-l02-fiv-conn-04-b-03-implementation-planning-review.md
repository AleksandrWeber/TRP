# FIV-CONN-04-B-03 Implementation Planning Review

**Document:** FIV-CONN-04-B-03 Lifecycle Enforcement Hooks — Implementation Planning Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-03 — Application/service enforcement hooks  
**Authority:** Product Owner / Chief Architect governance (Implementation Planning Review)  
**Nature:** **IMPLEMENTATION PLANNING REVIEW ONLY.** Does **not** implement B-03. Does **not** modify production code. Does **not** create an implementation commit. Does **not** authorize 04-D / FIV / C7 / venue I/O / capital.

**Reviewed artifact:** [`v3-l02-fiv-conn-04-b-03-implementation-planning-package.md`](./v3-l02-fiv-conn-04-b-03-implementation-planning-package.md) @ `4c22333991c0b280be1657d06e5c80579e2ba1fa`

---

## 1. Review Status

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
Implementation = NOT STARTED
```

```text
B-03 = IMPLEMENTATION AUTHORIZED BY SLICE APPROVAL (unchanged)
B-03 IMPLEMENTATION = NOT STARTED
04-D / FIV / C7 / live I/O / capital = NOT AUTHORIZED
```

Conditions are **non-blocking** implementation clarifications (see §20). They do **not** reopen D-B03-01…08 or C-B03-01.

Protected dirty/untracked leftovers were **not** modified.

---

## 2. Governance Chain

| Gate                         | Artifact                                                 | Status               |
| ---------------------------- | -------------------------------------------------------- | -------------------- |
| B-01 Closure                 | `v3-l02-fiv-conn-04-b-01-closure.md` + contract          | **CLOSED**           |
| B-02 Closure                 | `v3-l02-fiv-conn-04-b-02-closure.md` @ `1f09dda…`        | **CLOSED**           |
| B-03 Planning Package        | `…-b-03-planning-package.md` @ `0002f00…`                | COMPLETE             |
| B-03 Planning Review         | `…-b-03-planning-review.md` @ `78f8dd8…`                 | PASS WITH CONDITIONS |
| B-03 Decision Freeze         | `…-b-03-decision-freeze.md` @ `b0e6a12…`                 | **APPROVED**         |
| B-03 Slice Approval          | `…-b-03-slice-approval.md` @ `b0e6a12…`                  | **GRANTED**          |
| B-03 Implementation Planning | `…-b-03-implementation-planning-package.md` @ `4c22333…` | Under review         |
| This review                  | this artifact                                            | PASS WITH CONDITIONS |

Parent OD-B / COND-ARCH-B05 / COND-SEC remain binding. Wave B Implementation Authorization remains the ceiling; sub-slice Slice Approval already grants B-03 implementation authority subject to frozen decisions + this planning readiness.

---

## 3. Repository State

| Item                | Value                                      |
| ------------------- | ------------------------------------------ |
| HEAD                | `4c22333991c0b280be1657d06e5c80579e2ba1fa` |
| origin/main         | `4c22333991c0b280be1657d06e5c80579e2ba1fa` |
| HEAD == origin/main | **YES**                                    |

### Protected leftovers (untouched)

Dirty/untracked items remain present (including dirty `connections.module.ts`, `fiv-conn-04-a-*`, wave-5 docs, etc.). Planning package correctly instructs implementers to target **committed HEAD** and not stage leftovers.

### Independent source inspection (committed HEAD)

| Evidence                                       | Finding                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `connections.service.ts`                       | No `MigrationGate` references; deny hooks absent                                                                                  |
| `connections.module.ts` (HEAD)                 | `MIGRATION_GATE_PORT` → `PrismaMigrationGateAdapter`; `ConnectionMigrationGateAudit` provided                                     |
| `migration-gate.ts` `isDenySetBlocked`         | ACTIVE\|UNKNOWN → true; INACTIVE\|EXPIRED\|OWNERSHIP_LOST\|CONTENTION_DENIED → false                                              |
| `prisma-migration-gate.adapter.ts` `observe()` | Returns INACTIVE / ACTIVE / EXPIRED / UNKNOWN (`ok:false`→UNKNOWN); does **not** normally emit OWNERSHIP_LOST / CONTENTION_DENIED |
| `connectionRecord` mutate under `apps/api/src` | **Only** `ConnectionsService`                                                                                                     |
| Controller                                     | Preserves `ConflictException` on credential paths                                                                                 |

---

## 4. Planning Package Review

| Dimension                               | Result                                                              |
| --------------------------------------- | ------------------------------------------------------------------- |
| Faithful to D-B03-01…08 / C-B03-01      | **PASS**                                                            |
| Repository-grounded file/symbol map     | **PASS**                                                            |
| Call order concrete enough to implement | **PASS**                                                            |
| Residuals honest (S20, Vault orphan)    | **PASS**                                                            |
| No B-01/B-02 redesign                   | **PASS**                                                            |
| Remaining developer choices             | **NON-BLOCKING** only (helper DI style; ACTIVE `reasonCode` naming) |

```text
PACKAGE IMPLEMENTATION-READINESS = PASS WITH CONDITIONS
```

A developer can implement without making a **material** architecture/security/governance decision. Remaining choices are local engineering clarifications.

---

## 5. State Semantics Verification

### Critical Check #1 — independent B-01 verification

| State                 | `isDenySetBlocked` | Typical `observe()` source (B-02)                                             | Nature                              | B-03 planned deny-set behavior | Verified?                                                                           |
| --------------------- | ------------------ | ----------------------------------------------------------------------------- | ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| **INACTIVE**          | `false`            | Durable row `state=INACTIVE`                                                  | Terminal OFF                        | **ALLOW**                      | **YES**                                                                             |
| **ACTIVE**            | `true`             | Durable ON, non-expired                                                       | Terminal ON                         | **DENY**                       | **YES**                                                                             |
| **EXPIRED**           | `false`            | ACTIVE row with `expiresAt <= NOW()`                                          | Window ended (not ON)               | **ALLOW**                      | **YES**                                                                             |
| **OWNERSHIP_LOST**    | `false`            | Not returned by `observe()` today; appears on validate/acquire mismatch paths | Auth/fencing outcome, not ON window | **ALLOW** if observed          | **YES** (helper + Decision Freeze; **not** equated to EXPIRED conceptually)         |
| **CONTENTION_DENIED** | `false`            | Acquire contention outcome; not durable observe SoT                           | Transient acquire denial            | **ALLOW** if observed          | **YES** (same: not equated to EXPIRED; same deny-set decision class = non-blocking) |
| **UNKNOWN**           | `true`             | Missing row / purpose mismatch / malformed ACTIVE / catch / `ok:false`        | Error-like / unreadable             | **DENY**                       | **YES**                                                                             |

```text
STATE SEMANTICS = PASS
Planning package matches B-01 isDenySetBlocked and frozen D-B03-05.
EXPIRED ≠ ACTIVE.
OWNERSHIP_LOST / CONTENTION_DENIED ≠ EXPIRED (different meanings) but share deny-set ALLOW decision.
UNKNOWN ≠ EXPIRED (DENY).
No contradiction with B-01 → no blocker.
```

---

## 6. Enforcement Boundary

| Claim                                         | Result   | Evidence                                      |
| --------------------------------------------- | -------- | --------------------------------------------- |
| Canonical boundary = `ConnectionsService`     | **PASS** | Sole app mutator; OD-B-04                     |
| Methods: store/replace/revoke/EXCHANGE create | **PASS** | Repo methods exist; classify helpers map them |
| Controller-only insufficient                  | **PASS** | Plan enforces in service                      |
| No twin bypass services                       | **PASS** | Grep                                          |

```text
ENFORCEMENT BOUNDARY = PASS
```

---

## 7. Store / Replace Review

| Requirement                              | Plan                      | Result   |
| ---------------------------------------- | ------------------------- | -------- |
| Entry observe before Vault               | store §8 / replace §9     | **PASS** |
| Vault then mid-flight re-observe         | Explicit                  | **PASS** |
| No Connection bind if mid-flight blocked | Explicit + D-B03-04       | **PASS** |
| No Vault-spanning txn                    | Explicit                  | **PASS** |
| No success before persistence            | Fail closed before update | **PASS** |
| Audit on deny                            | Before ConflictException  | **PASS** |

Minor non-blocking note: store places entry gate **before** business prechecks; replace places entry gate **after** some prechecks. Both remain before Vault mutate — **acceptable**, not a security defect.

```text
STORE / REPLACE = PASS
```

---

## 8. Revoke / C-B03-01 Review

Frozen sequence verified against plan §10 and current `ConnectionsService.revoke`:

```text
entry assertDenySetAllowed
→ vault.get (read)
→ vault.revoke
→ mid-flight assertDenySetAllowedAfterVault
→ updateStatus(REVOKED) OR fail closed
```

| Check                                                | Result                      |
| ---------------------------------------------------- | --------------------------- |
| Second observe after `vault.revoke`                  | **PASS**                    |
| Before `updateStatus(REVOKED)`                       | **PASS**                    |
| No Connection mutation between revoke and re-observe | **PASS** (only Vault)       |
| Blocked mid-flight ⇒ no REVOKED / no success view    | **PASS**                    |
| UNKNOWN/error mid-flight fail closed                 | **PASS** (observeOrUnknown) |
| Vault orphan classified D-B03-04                     | **PASS**                    |
| Sequence not weakened                                | **PASS**                    |

```text
C-B03-01 REVOKE = PASS
```

---

## 9. EXCHANGE Creation Review

| Check                                 | Result                  |
| ------------------------------------- | ----------------------- |
| Classify after `providerType`         | **PASS**                |
| Entry observe only (no Vault)         | **PASS**                |
| Deny before `connectionRecord.create` | **PASS**                |
| NON-EXCHANGE not blocked              | **PASS**                |
| Audit + 409 on deny                   | **PASS**                |
| No client grant bypass                | **PASS** (DTO evidence) |

```text
EXCHANGE CREATE = PASS
```

---

## 10. Audit Review

| Check                                                      | Result   | Notes                         |
| ---------------------------------------------------------- | -------- | ----------------------------- |
| Reuse `ConnectionMigrationGateAudit` / Security Audit      | **PASS** | No second subsystem           |
| `connection.migration-gate` / `lifecycle_mutation_blocked` | **PASS** | Constants exist               |
| Workspace + actor attribution                              | **PASS** | Plan extends audit helper     |
| Before throw                                               | **PASS** |                               |
| Audit failure ⇒ fail closed                                | **PASS** | Propagate throw               |
| Outside Vault-spanning txn                                 | **PASS** |                               |
| Sensitive leakage                                          | **PASS** | sanitize + fixed HTTP message |

**CONDITION (non-blocking):** Plan §12 suggests `reasonCode` example `GATE_ACTIVE`, but **`GATE_ACTIVE` is not in `MIGRATION_GATE_REASON_CODES`**. Implementer must use an **existing** reason code when one applies (e.g. `GATE_UNKNOWN` for observe failure) and rely on payload `observation: 'ACTIVE'` for the active-window deny case — **do not invent a new B-01 reason enum value** in B-03.

```text
AUDIT = PASS WITH CONDITION (IMPL-COND-B03-01)
```

---

## 11. HTTP Contract Review

| Check                   | Result                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| `ConflictException`     | **PASS** — matches service conventions                                     |
| HTTP 409                | **PASS** — Nest + controller `credentialError` preserves ConflictException |
| Message frozen          | **PASS** — `This connection operation is temporarily unavailable.`         |
| Non-leaking             | **PASS** — no holder/fence/lease/Vault ids in public message               |
| Distinct from 403 authz | **PASS**                                                                   |

```text
HTTP CONTRACT = PASS
```

---

## 12. S20 Review

Independent grep at review HEAD: `connectionRecord.(create|update|…)` under `apps/api/src` **only** in `connections.service.ts`.

| Class              | Paths                | B-03             |
| ------------------ | -------------------- | ---------------- |
| ConnectionsService | create/update/status | In scope         |
| Other app modules  | reads only           | Out              |
| DBA/SQL/scripts    | ops                  | **S20 residual** |
| Tests              | doubles              | Test only        |

No new production bypass since Decision Freeze.

```text
S20 = PASS (residual outside B-03; not an implementation task)
```

---

## 13. DI / Module Review

| Check                                           | Result                               |
| ----------------------------------------------- | ------------------------------------ |
| Existing `MIGRATION_GATE_PORT`                  | **PASS** (HEAD module)               |
| Existing `PrismaMigrationGateAdapter`           | **PASS** — consume, do not duplicate |
| Inject into `ConnectionsService`                | **PASS** — planned                   |
| `ConnectionMigrationGateAudit` already provided | **PASS**                             |
| Second gate adapter                             | **Forbidden / avoided**              | **PASS** |

**CONDITION (non-blocking):** Helper may be Injectable provider **or** plain functions (plan allows both). Either is acceptable; prefer one consistently in implementation.

```text
DI / MODULE = PASS WITH CONDITION (IMPL-COND-B03-02)
```

---

## 14. Race / Transaction Review

| Topic                                            | Result                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Sequence matches D-B03-08 / COND-ARCH-B05        | **PASS**                                                                       |
| Residual race: final observe → Connection mutate | **Accepted** by frozen architecture (app deny-hook strength; no new atomicity) |
| Vault-spanning txn                               | **Not introduced**                                                             | **PASS** |
| Same-txn CAS                                     | **04-D only** — correctly excluded                                             | **PASS** |

```text
RACE / TRANSACTION = PASS
```

---

## 15. Security Review

Planning-level controls only (not yet implemented).

| ID        | Result        | Notes                                           |
| --------- | ------------- | ----------------------------------------------- |
| SB-B03-01 | **PASS**      | Four hooks planned                              |
| SB-B03-02 | **PASS**      | Service enforcement                             |
| SB-B03-03 | **CONDITION** | S20 residual documented                         |
| SB-B03-04 | **PASS**      | Global gate + workspace row + audit workspaceId |
| SB-B03-05 | **PASS**      | UNKNOWN deny                                    |
| SB-B03-06 | **PASS**      | No grant DTOs                                   |
| SB-B03-07 | **PASS**      | Additive policy                                 |
| SB-B03-08 | **PASS**      | Mid-flight store/replace/revoke                 |
| SB-B03-09 | **PASS**      | No public gate HTTP                             |
| SB-B03-10 | **PASS**      | B-01 helpers verified                           |
| SB-B03-11 | **PASS**      | Audit before throw; fail closed                 |
| SB-B03-12 | **CONDITION** | S20 / future COND-SEC-B04                       |
| SB-B03-13 | **CONDITION** | Accepted D-B03-04 residual                      |
| SB-B03-14 | **PASS**      | Fixed message                                   |

```text
SECURITY REVIEW = PASS WITH CONDITIONS (accepted residuals)
BLOCKERS = NONE
```

---

## 16. Acceptance Criteria Review

| AC       | Result   | Implementation Mapping          | Test Mapping        | Notes                          |
| -------- | -------- | ------------------------------- | ------------------- | ------------------------------ |
| B03-AC01 | **PASS** | Four service methods            | Matrix tests        |                                |
| B03-AC02 | **PASS** | ACTIVE deny                     | Entry ACTIVE        |                                |
| B03-AC03 | **PASS** | Allow-set                       | Allow under ACTIVE  |                                |
| B03-AC04 | **PASS** | INACTIVE path                   | Regression          |                                |
| B03-AC05 | **PASS** | UNKNOWN / observe fail          | Entry UNKNOWN       |                                |
| B03-AC06 | **PASS** | Port + B-01 helpers             | Code review         |                                |
| B03-AC07 | **PASS** | Audit extend                    | Audit tests         | IMPL-COND-B03-01 on reasonCode |
| B03-AC08 | **PASS** | DTO/service                     | Security tests      |                                |
| B03-AC09 | **PASS** | Controller authz                | Regression          |                                |
| B03-AC10 | **PASS** | store/replace/revoke mid-flight | Mid-flight + revoke | C-B03-01                       |
| B03-AC11 | **PASS** | Controller unchanged            | Review              |                                |
| B03-AC12 | **PASS** | No Prisma                       | Diff                |                                |
| B03-AC13 | **PASS** | Exclusions                      | Diff                |                                |
| B03-AC14 | **PASS** | §15 S20                         | Report              |                                |
| B03-AC15 | **PASS** | EXPIRED ALLOW                   | Entry EXPIRED       | Verified vs B-01               |

```text
AC REVIEW: 15/15 PASS (0 FAIL, 0 NEEDS CLARIFICATION as AC wording)
```

---

## 17. Test Plan Review

| Area                                                                          | Coverage in plan        | Result   |
| ----------------------------------------------------------------------------- | ----------------------- | -------- |
| Entry states INACTIVE/ACTIVE/EXPIRED/OWNERSHIP_LOST/CONTENTION_DENIED/UNKNOWN | Yes; EXPIRED etc. ALLOW | **PASS** |
| Deny-set store/replace/revoke/EXCHANGE create                                 | Yes                     | **PASS** |
| Allow-set rename/disconnect/disable/NON-EXCHANGE/reads/validate               | Yes                     | **PASS** |
| Mid-flight store/replace/revoke                                               | Yes                     | **PASS** |
| Revoke second observe ALLOW/BLOCKED/UNKNOWN                                   | Yes                     | **PASS** |
| Audit classification/attribution/fail-closed                                  | Yes                     | **PASS** |
| HTTP ConflictException/409/message                                            | Yes                     | **PASS** |
| Security client grant / cross-ws / authz                                      | Yes                     | **PASS** |
| Regression connections suite                                                  | Yes                     | **PASS** |

No critical test missing relative to frozen ACs.

```text
TEST PLAN = PASS
```

---

## 18. File-Level Implementation Readiness

| File                                            | Exists? | Why                                | Exact symbols                                                      | Scope valid?                       |
| ----------------------------------------------- | ------- | ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| `connections.service.ts`                        | YES     | Hooks + DI                         | `storeCredentials`, `replaceCredentials`, `revoke`, `create`, ctor | **YES**                            |
| `connection-migration-gate-audit.ts`            | YES     | workspace attribution              | `record`                                                           | **YES**                            |
| `connection-migration-gate-audit.spec.ts`       | YES     | Attribution tests                  | —                                                                  | **YES**                            |
| `connections.service.spec.ts`                   | YES     | Matrix/mid-flight/ctor updates     | many ctors                                                         | **YES**                            |
| `connection-migration-gate-enforcement.ts`      | NO      | Recommended helper                 | `observeOrUnknown`, asserts, message const                         | **YES** (optional but recommended) |
| `connection-migration-gate-enforcement.spec.ts` | NO      | Helper unit tests                  | —                                                                  | **YES** if helper created          |
| `connections.module.ts`                         | YES     | Provider only if helper Injectable | optional                                                           | **YES** if needed                  |
| Controllers/DTOs/Prisma/B-01/B-02 adapter       | —       | Must not change for B-03           | —                                                                  | **Correct exclusion**              |

```text
FILE PLAN = PASS
```

---

## 19. Scope Review

Confirmed **absent** from implementation plan as delivery work:

- B-01/B-02 redesign, 04-D, backfill, Vault redesign/compensation, credential migration, FIV, C7, live I/O, capital, trading execution, S20 remediation, unrelated refactor

Protected leftovers correctly excluded from staging guidance.

```text
SCOPE-CREEP = PASS (NONE)
```

---

## 20. Findings

### PASS

- State semantics match B-01 `isDenySetBlocked` and D-B03-05 (independently verified).
- C-B03-01 revoke sequence correctly planned.
- Store/replace/EXCHANGE flows concrete and fail-closed.
- Audit/HTTP/S20/DI/race models aligned with freezes.
- All 15 ACs mapped; test plan adequate.
- No material architecture decision left to the implementer.

### Conditions (non-blocking)

| ID                   | Condition                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IMPL-COND-B03-01** | Do not invent `GATE_ACTIVE` as a new `MigrationGateReasonCode`. For ACTIVE denies, record `observation: 'ACTIVE'` (and existing reason codes only when applicable, e.g. `GATE_UNKNOWN`). |
| **IMPL-COND-B03-02** | Choose either Injectable enforcement helper **or** plain functions; do not create a second gate port/adapter either way.                                                                 |
| **IMPL-COND-B03-03** | Implement against committed HEAD module wiring; do not stage protected dirty/untracked leftovers.                                                                                        |

### Blockers

```text
BLOCKERS = NONE
```

### Residuals

- S20 direct Prisma/DBA
- D-B03-04 Vault↔Connection desync after mid-flight deny
- Micro-race after final observe→mutate (accepted by D-B03-08)

---

## 21. Final Verdict

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
```

**Meaning:**

- Implementation Planning Package is sufficiently concrete, repository-grounded, and faithful to frozen B-03 decisions.
- Conditions IMPL-COND-B03-01…03 are binding clarifications for the implementer, not grounds to reopen governance.
- **B-03 implementation remains NOT STARTED.**
- Slice Approval’s implementation authorization remains in force; this review clears the Implementation Planning Review gate.

```text
Material unresolved architecture/security/governance ambiguities = NONE
```

---

## 22. Next Gate

```text
NEXT GATE:
FIV-CONN-04-B-03 IMPLEMENTATION
```

```text
B-03 = IMPLEMENTATION AUTHORIZED BY SLICE APPROVAL
B-03 IMPLEMENTATION = NOT STARTED
Implementation Planning Review = PASS WITH CONDITIONS
Do not implement 04-D / FIV / C7 / live I/O / capital under B-03.
```

---

## Appendix — Explicit non-implementation

This review does **not**:

- modify production code or create an implementation commit
- grant new scope beyond frozen B-03
- close FIV-CONN-04-B or FIV-CONN-04
- authorize 04-D, FIV, C7, venue I/O, or capital
