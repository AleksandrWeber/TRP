# FIV-CONN-04-B Architecture Review

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — Architecture Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Architecture Review (Principal Backend Architect under PO + Chief Architect)  
**Nature:** **ARCHITECTURE REVIEW ONLY.** Does **not** authorize implementation. Does **not** perform Security Review. Does **not** create migrations/lease tables/deny hooks. Does **not** mutate Connections/Vault/credentials. Does **not** authorize FIV/C7/venue I/O/capital.

**Reviewed artifacts:**

| Artifact                     | Path                                                                                                                     | Status                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Planning Package             | [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md)                                 | COMPLETE (`5c3fb87…`)              |
| PO Planning Review           | [`v3-l02-fiv-conn-04-b-po-planning-review.md`](./v3-l02-fiv-conn-04-b-po-planning-review.md)                             | **PASS**                           |
| PO Decision Freeze           | [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md)       | OD-B-01…08 **FROZEN** (`aaf2f70…`) |
| Parent Arch/Sec Confirmation | [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md) | PASS WITH CONDITIONS               |
| Parent Decision Freeze       | [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md)           | D-CONN-04-01…10 FROZEN             |
| Parent Slice Approval        | [`v3-l02-fiv-conn-04-po-governance-slice-approval.md`](./v3-l02-fiv-conn-04-po-governance-slice-approval.md)             | GRANTED                            |
| FIV-CONN-04-A Closure        | [`v3-l02-fiv-conn-04-a-closure.md`](./v3-l02-fiv-conn-04-a-closure.md)                                                   | CLOSED                             |

**Repository baseline (review start):** `aaf2f70d319e59adbab85ecbf0299a366e1a3f7c` (`HEAD == origin/main`)

```text
ARCHITECTURE REVIEW = PASS WITH CONDITIONS

FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED BY THIS ARTIFACT
SECURITY REVIEW = NOT PERFORMED IN THIS TASK
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Review Scope

Determine whether the frozen FIV-CONN-04-B design (global authorized migration window + durable singleton lease + fencing/TTL/heartbeat + `ConnectionsService` deny hooks) is architecturally sound and sufficiently specified for Security Review and later Implementation Authorization.

Frozen OD-B-01…08 and parent D-CONN-04-01…10 / D-CRED-02-12 are **not** reopened. This review records mandatory implementation conditions; it does **not** implement them.

---

## 2. Documents Reviewed

See table above. Repository evidence inspected (read-only):

| Area                       | Evidence                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Connections mutations      | `apps/api/src/modules/connections/connections.service.ts`                                                    |
| Strategy B SQL             | `apps/api/prisma/migrations/20260917180000_v3_l02_fiv_conn_02_provider_environment_uniqueness/migration.sql` |
| Prisma Connection model    | `apps/api/prisma/schema.prisma` — `ConnectionRecord` (no lease columns)                                      |
| Trading Session fencing    | `trading-session.service.ts` `requireCurrentFence` / `mutate` (check-then-save)                              |
| Stronger CAS lease pattern | `recovery-lease-acquisition.service.ts` + `saveIfVersion` (in-txn version CAS)                               |
| Security Audit             | `security-audit.service.ts`, `security-audit-classification.ts`, attribution rules                           |
| Transactions               | `prisma-transaction.service.ts`                                                                              |
| Vault mutate callers       | Production mutating Vault paths only via `ConnectionsService`                                                |

---

## 3. Current Architecture Findings

### 3.1 Facts

```text
Runtime FIV-CONN-04 write gate:           ABSENT (expected)
Connection migration lease table:         ABSENT (expected; OD-B-04 deferred to impl auth)
Connection delete API:                    ABSENT
Public environment mutation after create: FORBIDDEN (CONN-01)
disconnect/disable:                       status-only (no Vault / vaultSecretId / environment)
Credential Vault mutate entrypoints:      ConnectionsService store/replace/revoke only
Workers mutating connections/credentials: NONE found
TradingSession lease:                     exists — DO NOT overload as CONN-04 SoT
TradingSession lifecycle fencing:         check-outside-txn then plain save (TOCTOU residual)
Recovery lease acquire:                   in-txn version CAS — preferred analogue for 04-B/04-D
Security Audit catalog:                   no connection.migration-gate yet
Sensitive-key regex:                      /token/ matches payload key "fencingToken"
allowRealVenueIo:                         false
C7:                                       DENY-ALL
```

### 3.2 Architectural coherence verdict (preview)

The frozen design is **compatible** with Model C, Strategy B, environment immutability, workspace isolation, and existing Connections/Vault boundaries. It is **not** blocked.

Mandatory conditions exist primarily around **fencing TOCTOU**, **deny-path revalidation**, **audit payload naming**, and **TTL vs max-window separation** — these are implementation/architecture obligations, not reasons to reopen OD-B decisions.

---

## 4. Global Migration Window Assessment

### Frozen design (OD-B-01)

Global authorized migration window; deny-set only; ≤ 4 hours ceiling; not permanent; not user-controllable; not nestable; auditable.

### Assessment

| Criterion                      | Result                                                 |
| ------------------------------ | ------------------------------------------------------ |
| Explicit                       | **PASS** — singleton `gateKey`, privileged opener only |
| Bounded                        | **PASS** — max duration ceiling + TTL                  |
| Purpose-specific               | **PASS** — FIV-CONN-04-D critical section only         |
| Non-permanent                  | **PASS** — release + TTL reclaim required              |
| Not user-controllable          | **PASS** — ordinary clients cannot acquire             |
| Not ordinary credential freeze | **PASS** — narrow OD-B-07 matrix                       |
| Not silently activated         | **PASS** — acquire is explicit + audited               |
| Not nestable                   | **PASS** — overlap forbidden                           |
| Auditable                      | **PASS** — `connection.migration-gate`                 |

### Expiration vs unsafe mutation

Expiration must **not** be interpreted as permission for a **stale fencing token** to continue 04-D writes. Deny-set mutations become allowed only when durable state is OFF **or** expired (treated as not active). Stale holders remain rejected by fencing (OD-B-05).

```text
GLOBAL WINDOW ASSESSMENT = PASS WITH CONDITIONS (see COND-ARCH-B01, COND-ARCH-B02)
```

---

## 5. Durable Lease Assessment

### Architecturally required fields

| Field                          | Required?   | Reason                                         |
| ------------------------------ | ----------- | ---------------------------------------------- |
| Singleton identity (`gateKey`) | **YES**     | Exactly one global gate                        |
| `state` (OFF/ON)               | **YES**     | Deny hooks observe durable ON                  |
| `holderId`                     | **YES**     | Owner identity / reclaim auth                  |
| `fencingToken` (monotonic)     | **YES**     | Stale-owner rejection                          |
| `acquiredAt`                   | **YES**     | Max-window ceiling anchor (`acquiredAt + ≤4h`) |
| `expiresAt`                    | **YES**     | TTL / heartbeat expiry                         |
| `heartbeatAt`                  | **YES**     | Observability + stale detection                |
| `correlationId`                | Recommended | Audit correlation                              |
| `purpose`                      | Optional    | May be implied by `gateKey=FIV-CONN-04`        |

### Authoritative coordination

Durable DB lease **can** be the multi-instance SoT across API instances, concurrent requests, and process restarts **if** all observers read the same row and 04-D validates fencing with a DB-conditional predicate (not process memory alone).

Advisory lock remains optional supporting acquire serialization only (D-CRED-02-12).

```text
DURABLE LEASE ASSESSMENT = PASS WITH CONDITIONS (COND-ARCH-B03)
```

**Do not** model CONN-04 after TradingSession lifecycle `mutate` (fence check outside txn + plain save). Prefer recovery-style **in-transaction CAS**.

---

## 6. Fencing Analysis

### Critical TOCTOU

```text
check token valid
  → lease expires
  → Owner B acquires (fencingToken++)
  → Owner A mutates
```

**Required architectural result:** Owner A **MUST** be rejected.

### Where fencing is authoritative

| Path                                                            | Authority                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Process memory token alone                                      | **INSUFFICIENT**                                                           |
| Read lease then mutate later                                    | **INSUFFICIENT** (TradingSession lifecycle risk)                           |
| DB conditional predicate in same transaction as protected write | **REQUIRED for 04-D privileged UPDATE**                                    |
| Deny-set hooks (non-holder)                                     | Observe durable `ON && now < expiresAt` (fencing not required for deniers) |

### Contract for 04-D (owned later; constrained now)

Privileged `Connection.environment` UPDATE must execute only when a short DB transaction can prove **current** lease ownership, for example:

```text
BEGIN
  -- assert lease row: gateKey, state=ON, holderId=:h, fencingToken=:t, expiresAt > now()
  --   via UPDATE ... WHERE ... RETURNING / SELECT FOR UPDATE + version CAS
  -- conditional Connection UPDATE (environment IS NULL + vaultSecretId predicate)
  -- optional audit write
COMMIT
```

Vault metadata reads remain **outside** that short transaction.

```text
FENCING ASSESSMENT = PASS WITH CONDITIONS (COND-ARCH-B04) — TOCTOU explicitly addressed by CAS-in-txn contract
```

---

## 7. Transaction-Boundary Analysis

### Principles (confirmed)

1. **No** Vault network I/O inside lease acquire/release DB transactions without new justified exception (none approved here).
2. 04-B owns gate acquire/heartbeat/release + deny observation.
3. 04-D owns classify (metadata read) + conditional env UPDATE under fencing proof.

### Proposed coordination (architecture contract)

```text
04-B ACQUIRE (short DB txn):
  CAS lease OFF|expired → ON; fencingToken++; set acquiredAt/expiresAt
  COMMIT → durable audit gate_acquired

DENY-SET REQUEST (any instance):
  durable read: ON && not expired? → reject + audit block
  else proceed with existing ConnectionsService logic
  COND-ARCH-B05: re-check before irreversible Connection bind after Vault I/O

04-D PER ROW:
  Vault metadata read (outside txn)
  short DB txn: fencing CAS proof + conditional env UPDATE + row audit
  on fencing failure → abort row / runner per fail-closed rules

04-B RELEASE (short DB txn):
  CAS release where holder+fencing match → OFF
  COMMIT → audit gate_released
```

```text
TRANSACTION BOUNDARY = PASS WITH CONDITIONS (COND-ARCH-B04, COND-ARCH-B05)
```

---

## 8. Lifecycle Enforcement Analysis

### Proposed primary enforcement

Deny hooks at:

- `ConnectionsService.storeCredentials`
- `ConnectionsService.replaceCredentials`
- `ConnectionsService.revoke`
- `ConnectionsService.create` when `connectionType === 'EXCHANGE'`

### Sufficiency for application paths

| Path                               | Covered?                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| REST → ConnectionsService          | **YES** if hooks present                                  |
| Internal ConnectionsService        | **YES**                                                   |
| Alternate credential service       | **N/A today** (none)                                      |
| Workers / scheduled jobs           | **N/A today**; future must use gated service              |
| Admin / migration runner           | Must use lease API; no ungated env backfill               |
| Direct `SecretVaultService` mutate | **Residual bypass** — CONN-04 must not call; SEC residual |
| Direct Prisma                      | **Residual bypass** — ops/governance only                 |

```text
LIFECYCLE ENFORCEMENT = PASS WITH CONDITIONS
  App-path sufficient at ConnectionsService
  Residual: direct Vault/Prisma (documented, not design defects of OD-B)
```

---

## 9. Operation Matrix Validation

| Operation                       | Frozen                 | Repo boundary consistency                                                       |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| Credential store/replace/revoke | DENY                   | Exact service methods exist                                                     |
| EXCHANGE create                 | DENY                   | `create` resolves EXCHANGE via provider type                                    |
| Rename                          | ALLOW                  | `displayName` only; env immutable                                               |
| Disconnect/disable              | ALLOW                  | Status-only — consistent with OD-B-03 inspection                                |
| NON-EXCHANGE create             | ALLOW                  | Same `create`; gate must branch on type                                         |
| Reads / validate                | ALLOW                  | Validate may status-transition; not deny-set; EXCHANGE NULL fail-closed remains |
| Delete                          | N/A                    | No API                                                                          |
| Public env update               | DENY                   | Already immutable                                                               |
| 04-D privileged env UPDATE      | ALLOW w/ lease+fencing | No public API; runner-only                                                      |

```text
OPERATION MATRIX VALIDATION = PASS
```

---

## 10. Model C Validation

04-B does not classify LIVE, rewrite environment, mutate Vault purpose, or introduce a second runtime SoT.

| Risk                       | Status                                                                  |
| -------------------------- | ----------------------------------------------------------------------- |
| Alter Vault purpose        | **NOT INTRODUCED**                                                      |
| Infer env from provider    | **NOT INTRODUCED**                                                      |
| Second runtime SoT         | **NOT INTRODUCED** (gate is migration coordination, not credential SoT) |
| Cross-environment fallback | **NOT INTRODUCED**                                                      |
| Provider-only resolution   | **NOT INTRODUCED**                                                      |

```text
MODEL C VALIDATION = PASS
```

---

## 11. Strategy B Validation

Strategy B partial unique index remains final DB authority for credentialed EXCHANGE `(workspaceId, provider, environment)`.

### Race: classify LIVE → concurrent EXCHANGE create → collision

Prevention chain:

1. Gate ON → EXCHANGE create **DENIED** at `ConnectionsService.create`
2. If somehow present: Strategy B unique index rejects colliding LIVE write (04-D)
3. D-CONN-04-05 prevention-only (skip/report; no cleanup)

Gate does not change uniqueness semantics; it reduces collision probability during the window.

```text
STRATEGY B VALIDATION = PASS
```

---

## 12. Multi-Instance Analysis

| Actor               | While gate ON                                          |
| ------------------- | ------------------------------------------------------ |
| Instance A (holder) | May run 04-D only with valid fencing proof             |
| Instance B          | Deny-set mutations rejected via durable ON observation |
| Worker C            | None today; if added, must observe same durable SoT    |

Determinism:

- One migration owner (singleton CAS)
- Lifecycle mutations see active gate via DB row
- Stale owners rejected by fencing CAS
- After expiry, new authorized acquire allowed with new token
- Reads remain possible

```text
MULTI-INSTANCE ANALYSIS = PASS WITH CONDITIONS (durable SoT + CAS; COND-ARCH-B03/B04)
```

---

## 13. Crash / TTL / Heartbeat Analysis

| Scenario                             | Architectural outcome                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Crash before acquire                 | Gate OFF; safe                                                                   |
| Crash after acquire                  | ON remains until release/TTL; deny-set stays denied                              |
| Crash during heartbeat               | Expiry proceeds; stale token invalid                                             |
| Crash during protected 04-D mutation | Partial row forward-fix; fencing still required for continuation                 |
| Crash after commit before release    | Lease remains; not interpreted as unlock                                         |
| Process restart                      | Memory discarded; must re-prove fencing or re-acquire                            |
| Network partition / DB loss          | Fail closed: no acquire success; deny-set checks fail closed if state unreadable |

### TTL vs max migration window (must remain distinct)

| Concept                        | Role                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Lease TTL / heartbeat**      | Liveness of current hold; expiry enables reclaim                                                  |
| **Max migration window (≤4h)** | Governance ceiling from `acquiredAt`; heartbeat **must not** extend past `acquiredAt + maxWindow` |

Ambiguous gate state must **never** mean permission to proceed.

```text
CRASH / TTL / HEARTBEAT = PASS WITH CONDITIONS (COND-ARCH-B01, COND-ARCH-B02)
```

---

## 14. Stale-Owner / Reclaim Analysis

| Mechanism                   | Risk                      | Mitigation                                                                     |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| TTL expiry → new acquire    | Stale A continues         | New acquire bumps fencing; A rejected on CAS                                   |
| Operator reclaim before TTL | Resurrect stale ownership | Reclaim must invalidate/bump fencing; audited; no unauthenticated force-unlock |
| Heartbeat by stale owner    | Extend after reassignment | Heartbeat CAS requires matching holder+fencing                                 |

```text
STALE-OWNER / RECLAIM = PASS WITH CONDITIONS (COND-ARCH-B06)
```

---

## 15. Contention Analysis

Frozen OD-B-08: immediate deterministic rejection; no queue/wait/blind retry.

Enforceable at:

- API deny hooks (throw conflict/locked-style domain error)
- Second runner acquire (CAS fail → `gate_acquire_denied`)
- Internal service calls through same hooks

Exact HTTP status is non-blocking for architecture correctness (Security/impl may choose), provided semantics remain fail-closed and auditable.

```text
CONTENTION ANALYSIS = PASS
```

---

## 16. Audit Architecture

Frozen `connection.migration-gate` fits existing Security Audit class `connection` once registered in:

1. `security-audit-classification.ts` catalog
2. Attribution rules (workspace/actor/resource conventions)

Required outcomes (acquire/deny/block/release/expiry/fencing rejection/timeout) are representable via `outcome` + safe payload.

### Critical repo-specific constraint

```text
SecurityAuditService SENSITIVE_KEY matches /token/
Payload key "fencingToken" WOULD BE REJECTED
```

Implementation must use a non-matching field name (e.g. `fenceId`, `leaseFence`, `fencingTokenValue` without substring `token` if regex remains as-is — prefer names that do not match the regex).

No secrets permitted.

```text
AUDIT ARCHITECTURE = PASS WITH CONDITIONS (COND-ARCH-B07)
```

---

## 17. Bypass Analysis

| ID        | Scenario                            | Invariant                         | Prevented by current design?                                    | Implementation obligation                 |
| --------- | ----------------------------------- | --------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| BYPASS-01 | Alternate ConnectionsService method | Deny-set exclusion                | **YES** if all deny-set methods hooked                          | Hook all four; no ungated twin methods    |
| BYPASS-02 | Lower-level repository              | Same                              | **NO** (none exists as public API today)                        | Do not add ungated repos                  |
| BYPASS-03 | Direct credential/Vault service     | No Vault mutate in window via app | **PARTIAL** — ConnectionsService covered; direct Vault residual | CONN-04 must not call Vault mutate; tests |
| BYPASS-04 | Worker mutation                     | Same                              | **N/A today**                                                   | Future workers must use gated service     |
| BYPASS-05 | Admin mutation                      | Same                              | **CONDITIONAL**                                                 | Admin/runner must acquire lease           |
| BYPASS-06 | Direct Prisma                       | Same                              | **NO** (ops residual)                                           | Runbook; accepted residual                |
| BYPASS-07 | Retry after denial                  | No bypass                         | **YES** with durable ON                                         | Retries still see ON                      |
| BYPASS-08 | Stale lease holder                  | Fencing                           | **YES if CAS-in-txn**                                           | COND-ARCH-B04                             |
| BYPASS-09 | Cross-workspace lease use           | Isolation                         | **YES** — global gate does not grant data access; ACL unchanged | SEC-B01/B02                               |
| BYPASS-10 | Provider/env mismatch lock identity | No provider/env-only lock         | **YES** — singleton gateKey                                     | SEC-B03/B04                               |

```text
BYPASS ANALYSIS = PASS WITH CONDITIONS (residuals documented; not blockers)
```

---

## 18. SEC-B01…SEC-B14 Assessment

| ID      | Assessment      | Notes                                                   |
| ------- | --------------- | ------------------------------------------------------- |
| SEC-B01 | **PASS**        | Existing workspace ACL/`getRow` preserved               |
| SEC-B02 | **PASS**        | Global gate ≠ cross-workspace data authority            |
| SEC-B03 | **PASS**        | Singleton gateKey; not provider-keyed                   |
| SEC-B04 | **PASS**        | Not environment-keyed                                   |
| SEC-B05 | **PASS**        | 04-B must not mutate Vault                              |
| SEC-B06 | **CONDITIONAL** | COND-ARCH-B07 audit field naming vs `/token/`           |
| SEC-B07 | **PASS**        | OD-B-08 immediate reject                                |
| SEC-B08 | **CONDITIONAL** | Requires CAS-in-txn fencing (COND-ARCH-B04)             |
| SEC-B09 | **PASS**        | Durable ON observation                                  |
| SEC-B10 | **CONDITIONAL** | All deny-set entrypoints hooked; no twin APIs           |
| SEC-B11 | **CONDITIONAL** | Durable lease SoT mandatory (COND-ARCH-B03)             |
| SEC-B12 | **CONDITIONAL** | Catalog + attribution registration required             |
| SEC-B13 | **PASS**        | Privileged acquire only                                 |
| SEC-B14 | **CONDITIONAL** | Enforce max-window ceiling vs heartbeat (COND-ARCH-B01) |

No SEC-B item is **BLOCKED**.

---

## 19. ARCH-B01…ARCH-B08 Assessment

| ID       | Assessment      | Notes                                                       |
| -------- | --------------- | ----------------------------------------------------------- |
| ARCH-B01 | **PASS**        | Global singleton semantics frozen and coherent              |
| ARCH-B02 | **CONDITIONAL** | Lease table + hooks only after Implementation Authorization |
| ARCH-B03 | **PASS**        | Deny hook targets match repo methods                        |
| ARCH-B04 | **CONDITIONAL** | 04-D must refuse without fencing proof (contract)           |
| ARCH-B05 | **PASS**        | No Vault I/O in lease acquire/release txns                  |
| ARCH-B06 | **PASS**        | Advisory optional only                                      |
| ARCH-B07 | **PASS**        | Public env immutability preserved                           |
| ARCH-B08 | **PASS**        | Sub-slice separation coherent                               |

---

## 20. Sub-Slice Assessment

| Sub-slice                      | Coherence                                              |
| ------------------------------ | ------------------------------------------------------ |
| B-01 Gate contract             | **COHERENT** — types/errors/fencing semantics          |
| B-02 Durable lease             | **COHERENT** — SoT; depends on impl auth for migration |
| B-03 Lifecycle enforcement     | **COHERENT** — ConnectionsService hooks                |
| B-04 04-D integration boundary | **COHERENT** — must encode CAS fencing contract        |
| B-05 Audit/security tests      | **COHERENT** — includes sensitive-key naming           |
| B-06 Crash/concurrency         | **COHERENT** — proves TOCTOU/CAS                       |

Decomposition remains acceptable. Do not merge with 04-C/D/E.

---

## 21. 04-D Integration Contract

| Concern                                            | 04-B owns | 04-D owns                 |
| -------------------------------------------------- | --------- | ------------------------- |
| Migration gate / lease / fencing / TTL / heartbeat | **YES**   | Consumes                  |
| Lifecycle deny-set exclusion                       | **YES**   | Relies on                 |
| Gate audit (`connection.migration-gate`)           | **YES**   | May correlate IDs         |
| Vault-proven LIVE classification                   | No        | **YES** (with 04-C)       |
| Conditional `environment` UPDATE                   | No        | **YES** under fencing CAS |
| Per-row backfill audit                             | No        | **YES**                   |
| Backfill execution / batching                      | No        | **YES**                   |
| Residual inventory                                 | No        | 04-E                      |

### Hard preconditions for 04-D

```text
1. Durable lease ON
2. Runner presents holderId + fencingToken
3. Each privileged write proves fencing in same DB transaction as UPDATE
4. Vault metadata reads outside that transaction
5. On fencing failure: fail closed for that write / runner continuation policy
```

---

## 22. Architecture Risks

| ID    | Risk                                                      | Severity          | Disposition                               |
| ----- | --------------------------------------------------------- | ----------------- | ----------------------------------------- |
| AR-01 | Implementing TradingSession-style check-then-save fencing | **High**          | COND-ARCH-B04 forbids as sole pattern     |
| AR-02 | Heartbeat extends beyond 4h max window                    | Medium            | COND-ARCH-B01                             |
| AR-03 | Audit payload `fencingToken` rejected by `/token/`        | Medium            | COND-ARCH-B07                             |
| AR-04 | Deny check then Vault I/O then gate acquires mid-flight   | Low/Med           | COND-ARCH-B05 re-check / fail-closed bind |
| AR-05 | Direct Prisma/Vault residual bypass                       | Accepted residual | Documented; Security Review               |
| AR-06 | Combining 04-B with 04-D in one change                    | Medium            | ARCH-B08                                  |

---

## 23. Mandatory Implementation Conditions

These are **mandatory** for any future Implementation Authorization. They do **not** authorize implementation now.

| ID                | Condition                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **COND-ARCH-B01** | Heartbeat/`expiresAt` renewal MUST NOT extend past `acquiredAt + maxWindow` (≤ 4 hours unless later PO extends).                                                                                                           |
| **COND-ARCH-B02** | Lease TTL and max migration window are distinct; expiry of TTL enables reclaim; max window is hard ceiling from `acquiredAt`.                                                                                              |
| **COND-ARCH-B03** | Durable singleton DB lease row is the multi-instance SoT; process-local state is never authoritative.                                                                                                                      |
| **COND-ARCH-B04** | Privileged 04-D writes MUST validate `holderId` + `fencingToken` + non-expired ON via **DB conditional/CAS in the same transaction** as the protected Connection UPDATE. Check-outside-txn alone is insufficient.          |
| **COND-ARCH-B05** | Deny-set paths MUST observe durable ON; after Vault I/O and before Connection bind side-effects, re-validate gate still not active **or** fail closed on bind if gate flipped ON mid-flight (do not complete unsafe bind). |
| **COND-ARCH-B06** | Operator reclaim MUST bump/invalidate fencing and emit durable audit; cannot resurrect prior fencing token authority.                                                                                                      |
| **COND-ARCH-B07** | Audit payloads MUST NOT use field names rejected by Security Audit sensitive-key rules (avoid raw `fencingToken` / `token` substrings as keys).                                                                            |
| **COND-ARCH-B08** | `connection.migration-gate` MUST be registered in classification + attribution catalogs before emission.                                                                                                                   |
| **COND-ARCH-B09** | Unreadable gate state ⇒ fail closed for deny-set mutations and for 04-D start (uncertainty ≠ allow).                                                                                                                       |
| **COND-ARCH-B10** | No Vault/external I/O inside lease acquire/release transactions.                                                                                                                                                           |

---

## 24. Final Architecture Verdict

```text
ARCHITECTURE REVIEW = PASS WITH CONDITIONS
```

### Meaning

- Frozen OD-B design is architecturally sound and repository-compatible.
- No fundamental defect requires redesign or PO decision reopen.
- Implementation may be considered **only after** Security Review and explicit Implementation Authorization, and must satisfy COND-ARCH-B01…B10.
- This artifact does **not** authorize implementation, schema/migration creation, deny hooks, backfill, FIV, C7, or capital.

### Next gate

```text
Next: FIV-CONN-04-B Security Review
Then: Implementation Authorization (separate act)
```

---

## Explicit Non-Authorization

```text
NOT AUTHORIZED by this Architecture Review:
  FIV-CONN-04-B implementation
  FIV-CONN-04-C / 04-D / 04-E
  Testnet credential verification
  FIV / Binance I/O
  Live capital
  C7 / allowRealVenueIo changes
  Schema/migration/lease table creation
```

---

## Safety State (this review act)

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
FIV-CONN-04-B = ARCHITECTURE REVIEW COMPLETE
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B ARCHITECTURE REVIEW**
