# FIV-CONN-04-B-03 Implementation Report

**Document:** FIV-CONN-04-B-03 Lifecycle Enforcement Hooks — Implementation Report
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-03 — Application/service enforcement hooks
**Authority:** Implementation under PO Slice Approval + Implementation Planning Review
**Nature:** **IMPLEMENTATION COMPLETE.** Does **not** perform PO Review, Closure, 04-D, FIV, C7, live I/O, or capital activation.

---

## 1. Implementation Status

```text
IMPLEMENTATION = COMPLETE
READY FOR PO REVIEW
B-03 PO REVIEW = NOT YET PERFORMED
B-03 CLOSURE = NOT GRANTED
```

---

## 2. Governance Context

| Gate                                  | Artifact / commit                          | Status               |
| ------------------------------------- | ------------------------------------------ | -------------------- |
| B-01 CLOSED                           | contract + helpers                         | CLOSED               |
| B-02 CLOSED                           | durable lease `1f09dda…`                   | CLOSED               |
| B-03 Decision Freeze + Slice Approval | `b0e6a12b6947bd822d9e1df030cace8c7ca75ec7` | APPROVED / GRANTED   |
| B-03 Implementation Planning Package  | `4c22333991c0b280be1657d06e5c80579e2ba1fa` | AUTHORITATIVE        |
| B-03 Implementation Planning Review   | `be2df990575731fc979339e7ff192a9a8d8e78ba` | PASS WITH CONDITIONS |
| Implementation authorization          | this task                                  | AUTHORIZED           |
| B-03 state after this report          | IMPLEMENTATION COMPLETE                    | PO Review next       |

```text
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
C7 = DENY-ALL
allowRealVenueIo = FALSE
04-D = NOT AUTHORIZED
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
```

Protected leftovers (04-A files, dirty `connections.module.ts`, wave-5 docs, etc.) were **not** staged and remain untouched by this commit.

---

## 3. Implemented Files

| Path                                                                             | Action                                                                 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/api/src/modules/connections/connection-migration-gate-enforcement.ts`      | **Created** — pure enforcement helpers                                 |
| `apps/api/src/modules/connections/connection-migration-gate-enforcement.spec.ts` | **Created** — entry matrix / audit / HTTP tests                        |
| `apps/api/src/modules/connections/connections.service.fiv-conn-04-b-03.spec.ts`  | **Created** — mid-flight store/replace/revoke + EXCHANGE create        |
| `apps/api/src/modules/connections/connections.service.ts`                        | **Modified** — inject port+audit; hooks on create/store/replace/revoke |
| `apps/api/src/modules/connections/connections.service.spec.ts`                   | **Modified** — ctor stubs for gate+audit regression                    |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts`            | **Modified** — optional `workspaceId` attribution                      |
| `apps/api/src/modules/connections/connection-migration-gate-audit.spec.ts`       | **Modified** — workspace attribution coverage                          |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-03-implementation-report.md` | **Created** — this report                                              |

**Not staged (protected leftovers / out of scope):**

- `connections.module.ts` dirty 04-A preflight wiring
- `fiv-conn-04-a-*` untracked files
- wave-5 / technical-debt leftovers
- `live-admission-gate-ports.module.spec.ts`

Committed HEAD module already provides `MIGRATION_GATE_PORT` + `ConnectionMigrationGateAudit` — Nest DI resolves the new ctor deps without module changes (**IMPL-COND-B03-03**).

---

## 4. Enforcement Architecture

```text
HTTP ConnectionsController
  → existing VaultConnections + workspace membership authz   [unchanged]
  → ConnectionsService.<method>
       → classifyConnectionMutation (B-01)
       → if deny-kind:
            observeOrUnknown(MigrationGatePort)
            shouldBlockDenySetMutation / isDenySetBlocked (B-01)
            if block:
              ConnectionMigrationGateAudit.lifecycle_mutation_blocked
              (audit throw ⇒ fail closed)
              ConflictException(GATE_DENY_PUBLIC_MESSAGE)
       → continue existing business logic
       → [store|replace|revoke] after Vault mutate:
            assertDenySetAllowedAfterVault (re-observe)
            if block → audit + ConflictException; NO Connection mutation
       → Connection persistence (existing)
```

No second SoT. No client-controlled migration authority. No controller-only enforcement.

---

## 5. storeCredentials

Evidence in `connections.service.ts`:

1. `getRow` (workspace-scoped)
2. `assertDenySetAllowed({ method: 'storeCredentials', ... })`
3. Existing DISABLED / already-stored / slot checks
4. `vault.store(...)`
5. `assertDenySetAllowedAfterVault(...)`
6. Only then `connectionRecord.update({ vaultSecretId, status: DISCONNECTED })`

Mid-flight deny: Vault may succeed; Connection is **not** bound (**D-B03-04** accepted residual).
Tests: `connections.service.fiv-conn-04-b-03.spec.ts` (bind success + mid-flight ACTIVE unbound).

---

## 6. replaceCredentials

1. Entry `assertDenySetAllowed`
2. Existing Vault replace + ownership check
3. Mid-flight `assertDenySetAllowedAfterVault`
4. Only then Connection update + lifecycle audit

Mid-flight UNKNOWN/fail-closed covered in B-03 service spec.

---

## 7. revoke (C-B03-01)

Frozen sequence implemented:

```text
entry assertDenySetAllowed
→ vault.get ownership
→ vault.revoke
→ assertDenySetAllowedAfterVault   // no Connection mutation between
→ updateStatus(REVOKED)            // only if mid-flight allows
```

Tests verify:

- mid-flight ACTIVE → `vault.revoke` called, status ≠ `REVOKED`, no REVOKED update
- mid-flight INACTIVE → status `REVOKED`

**C-B03-01 = SATISFIED**

---

## 8. EXCHANGE Creation

`create`: when `connectionType === 'EXCHANGE'`, entry `assertDenySetAllowed({ method: 'create', connectionType: 'EXCHANGE' })` before `connectionRecord.create`.

NON-EXCHANGE create does not call deny-set enforcement (classification allow / early skip).

---

## 9. Audit

- Classification / event type: existing `connection.migration-gate` via `MIGRATION_GATE_AUDIT_EVENT_TYPE`
- Outcome: `lifecycle_mutation_blocked`
- Attribution: `actorId` + optional `workspaceId` (D-B03-03)
- Payload: operation, observation, workspaceId, connectionId; **no** `GATE_ACTIVE` (**IMPL-COND-B03-01**)
- ACTIVE deny: `observation: 'ACTIVE'` without inventing a new reason code
- UNKNOWN deny: existing `GATE_UNKNOWN` when applicable
- Audit failure: exception propagates → fail closed (no soft-pass)

---

## 10. Error Contract

| Field     | Value                                                                                |
| --------- | ------------------------------------------------------------------------------------ |
| Exception | `ConflictException`                                                                  |
| HTTP      | 409 (Nest default for ConflictException)                                             |
| Message   | `This connection operation is temporarily unavailable.` (`GATE_DENY_PUBLIC_MESSAGE`) |

No holderId, fenceGeneration, lease timestamps, Vault IDs, credentials, or migration internals in the public message.

---

## 11. DI (IMPL-COND-B03-02)

| Choice                                                     | Evidence                                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Pure helper** `connection-migration-gate-enforcement.ts` | Matches B-01 pure-helper style (`migration-gate.ts`); no Nest `@Injectable` needed           |
| Injected deps                                              | `ConnectionsService` injects `@Inject(MIGRATION_GATE_PORT)` + `ConnectionMigrationGateAudit` |
| No second port/adapter                                     | Consumes existing B-02 `PrismaMigrationGateAdapter` via `MIGRATION_GATE_PORT` only           |

**IMPL-COND-B03-02 = SATISFIED** (plain helpers; no unnecessary Nest provider)

---

## 12. State Semantics (D-B03-05)

Enforcement calls `shouldBlockDenySetMutation` → B-01 `isDenySetBlocked`. States are **not** collapsed:

| Observation       | Deny-set | Test evidence                                   |
| ----------------- | -------- | ----------------------------------------------- |
| INACTIVE          | ALLOW    | enforcement.spec + service mid-flight allow     |
| ACTIVE            | DENY     | enforcement.spec + EXCHANGE create / mid-flight |
| EXPIRED           | ALLOW    | enforcement.spec (distinct case)                |
| OWNERSHIP_LOST    | ALLOW    | enforcement.spec (distinct case)                |
| CONTENTION_DENIED | ALLOW    | enforcement.spec (distinct case)                |
| UNKNOWN           | DENY     | enforcement.spec + mid-flight fail              |

---

## 13. Tests

### Commands and results

```text
cd apps/api && pnpm exec vitest run \
  src/modules/connections/connection-migration-gate-enforcement.spec.ts \
  src/modules/connections/connections.service.fiv-conn-04-b-03.spec.ts \
  src/modules/connections/connection-migration-gate-audit.spec.ts \
  src/modules/connections/connections.service.spec.ts \
  src/modules/connections/migration-gate.spec.ts
→ 5 files, 92 tests PASSED

cd apps/api && pnpm exec vitest run src/modules/connections/
→ 14 files, 145 tests PASSED
  (includes untracked 04-A specs present in working tree; not staged)

cd apps/api && pnpm exec tsc --noEmit
→ exit 0
```

### Coverage mapping (combined, not 39 artificial files)

| Requirement cluster                                                                       | Evidence                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Entry matrix ACTIVE/UNKNOWN DENY; INACTIVE/EXPIRED/OWNERSHIP_LOST/CONTENTION_DENIED ALLOW | `connection-migration-gate-enforcement.spec.ts` |
| Deny-set store/replace/revoke/EXCHANGE create                                             | enforcement + service B-03 specs                |
| Allow-set rename/disable/NON-EXCHANGE/reads/catalog under ACTIVE                          | service B-03 spec; classify allow skips gate    |
| Store/replace/revoke mid-flight                                                           | service B-03 spec                               |
| C-B03-01 no mutation between revoke and re-observe                                        | service B-03 revoke mid-flight test             |
| Audit + no GATE_ACTIVE + audit fail-closed                                                | enforcement + audit specs                       |
| HTTP 409 / frozen message                                                                 | enforcement + EXCHANGE create tests             |
| Regression                                                                                | `connections.service.spec.ts` 43 PASSED         |

---

## 14. Acceptance Criteria

| AC       | Result   | Implementation Evidence                         | Test Evidence                         |
| -------- | -------- | ----------------------------------------------- | ------------------------------------- |
| B03-AC01 | **PASS** | Four deny hooks in `connections.service.ts`     | service + B-03 specs                  |
| B03-AC02 | **PASS** | ACTIVE → deny via B-01 helpers                  | enforcement ACTIVE tests              |
| B03-AC03 | **PASS** | Allow-set not hooked; NON-EXCHANGE under ACTIVE | service B-03 allow-set test           |
| B03-AC04 | **PASS** | INACTIVE default stubs + success paths          | service.spec + mid-flight allow       |
| B03-AC05 | **PASS** | observe fail → UNKNOWN deny                     | enforcement + replace mid-flight fail |
| B03-AC06 | **PASS** | Only `MIGRATION_GATE_PORT` + B-01 helpers       | code review; no second SoT            |
| B03-AC07 | **PASS** | `lifecycle_mutation_blocked` + workspaceId      | audit + enforcement tests             |
| B03-AC08 | **PASS** | No grant fields on DTO/service                  | dto unchanged; enforce uses port      |
| B03-AC09 | **PASS** | Gate additive after existing authz boundary     | controller authz unchanged            |
| B03-AC10 | **PASS** | Mid-flight on store/replace/**revoke**          | service B-03 mid-flight tests         |
| B03-AC11 | **PASS** | No public gate HTTP added                       | controller not modified               |
| B03-AC12 | **PASS** | No Prisma schema/migration in B-03 commit       | diff review                           |
| B03-AC13 | **PASS** | No 04-D/FIV/C7/capital                          | diff + non-goals                      |
| B03-AC14 | **PASS** | S20 residual documented §17                     | this report                           |
| B03-AC15 | **PASS** | EXPIRED allows deny-set                         | enforcement EXPIRED case              |

```text
B03-AC01…AC15 = 15/15 PASS
```

---

## 15. Security Verification

| ID        | Result        | Evidence                                                         |
| --------- | ------------- | ---------------------------------------------------------------- |
| SB-B03-01 | **PASS**      | All four deny-set methods hooked; no ungated twins               |
| SB-B03-02 | **PASS**      | Enforcement in service, not controller-only                      |
| SB-B03-03 | **CONDITION** | S20 direct Prisma residual preserved outside B-03 (D-B03-06)     |
| SB-B03-04 | **PASS**      | Global observe + workspace-scoped `getRow` + audit `workspaceId` |
| SB-B03-05 | **PASS**      | observe fail/throw → UNKNOWN → DENY                              |
| SB-B03-06 | **PASS**      | No client migration-authority fields                             |
| SB-B03-07 | **PASS**      | Ordinary authz remains; gate is additional deny                  |
| SB-B03-08 | **PASS**      | Entry + mid-flight re-observe for store/replace/revoke           |
| SB-B03-09 | **PASS**      | No public acquire/release/heartbeat/reclaim on Connections HTTP  |
| SB-B03-10 | **PASS**      | B-01 `isDenySetBlocked` only; states not collapsed               |
| SB-B03-11 | **PASS**      | Audit before throw; audit fail ⇒ fail closed                     |
| SB-B03-12 | **CONDITION** | S20 + future COND-SEC-B04 operational-trust residual             |
| SB-B03-13 | **CONDITION** | Vault orphan accepted residual D-B03-04; no compensation         |
| SB-B03-14 | **PASS**      | Frozen non-leaking ConflictException message                     |

---

## 16. Scope-Creep Review

Inspected staged B-03 diff only. **No** unauthorized changes to:

- B-01 / B-02 contracts or lease adapter redesign
- Prisma schema / migrations
- 04-D / backfill
- Vault redesign / compensation
- FIV / C7 / live venue I/O / capital / trading execution
- S20 remediation

Dirty `connections.module.ts` (04-A) and other leftovers remain local and **were not staged** (**IMPL-COND-B03-03**).

---

## 17. Residuals

Explicitly preserved:

1. **Vault orphan residual (D-B03-04)** — Vault mutate may succeed while mid-flight gate blocks Connection bind/update/REVOKED; no compensation in B-03.
2. **S20 operational-trust residual (D-B03-06)** — Direct Prisma bypass outside application trust boundary; not remediated here.
3. **Approved observe→mutate race (D-B03-08)** — No Vault-spanning transaction; observe → Vault → observe → Connection mutate remains.

---

## 18. Safety Boundary

Confirmed:

- no Vault redesign
- no FIV execution
- no C7 change
- no live venue I/O activation
- no capital movement
- no 04-D work
- no PO Review / Closure artifacts in this task

---

## 19. Implementation Verdict

```text
IMPLEMENTATION = COMPLETE
READY FOR PO REVIEW

B-03 = IMPLEMENTATION COMPLETE
B-03 PO REVIEW = NOT YET PERFORMED
B-03 CLOSURE = NOT GRANTED

NEXT GATE:
FIV-CONN-04-B-03 PO REVIEW
```

### Commit note

Pre-commit hooks may fail solely because of known protected leftovers in the working tree. For this authorized B-03 implementation commit only, `--no-verify` may be used if and only if that is the sole cause, per task authorization. Actual usage is recorded in the final operator response after commit.

---

**End of Implementation Report**
