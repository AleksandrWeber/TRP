# FIV-CONN-04-B-03 Planning Package

**Document:** FIV-CONN-04-B-03 Lifecycle Enforcement Hooks — Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-03 — Application/service enforcement hooks for the FIV-CONN-04 migration gate  
**Parent:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Senior Staff Engineer / Architect (planning under Product Owner + Chief Architect governance)  
**Nature:** **PLANNING ONLY.** Does **not** authorize B-03 implementation. Does **not** modify production code, Prisma schema, migrations, ConnectionsService, controllers, Vault/credentials, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Repository baseline (planning start):** `1f09dda7a49b186ad51033031ad671c6514a8c6a` (`HEAD == origin/main` at planning start; B-02 closure)

```text
FIV-CONN-04-B-01 = CLOSED
FIV-CONN-04-B-02 = CLOSED
FIV-CONN-04-B-03 = PLANNING ONLY
FIV-CONN-04-B-03 IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
C7 = DENY-ALL
allowRealVenueIo = FALSE
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Planning Status

```text
PLANNING PACKAGE = READY FOR B-03 PLANNING REVIEW
Implementation = NOT AUTHORIZED
B-03 = NOT AUTHORIZED
```

---

## 2. Governance Context

| Item                                            | Status                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| Wave 6 / V3-L01…L05                             | Live Trading V3 in progress                                            |
| FIV-CONN-04-B-01 (Migration Gate Contract)      | **CLOSED**                                                             |
| FIV-CONN-04-B-02 (Durable Migration Gate Lease) | **CLOSED** (`1f09dda…` closure; impl `0b88aed…`; PO Review `4af4f65…`) |
| FIV-CONN-04-B-03 (Enforcement hooks)            | **THIS PACKAGE — planning only**                                       |
| FIV-CONN-04-B (parent write-gate)               | **NOT CLOSED**                                                         |
| FIV-CONN-04 (parent)                            | **NOT CLOSED**                                                         |
| FIV-PRE-01                                      | **NOT CLOSED**                                                         |
| FIV                                             | **NOT PERFORMED**                                                      |
| C7                                              | **DENY-ALL**                                                           |
| `allowRealVenueIo`                              | **FALSE**                                                              |
| Live capital                                    | **NOT ACTIVATED**                                                      |
| 04-D privileged environment UPDATE              | **NOT AUTHORIZED**                                                     |

### Binding freezes (not reopened)

| Freeze               | Binding essence for B-03                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **D-CONN-04-08 = B** | Deny credential store/replace/revoke + EXCHANGE create during authorized migration window |
| **D-CRED-02-12**     | Application write gate is primary; advisory lock alone insufficient                       |
| **OD-B-01 = F**      | Global authorized migration window (`FIV-CONN-04`); ≤4h; not permanent                    |
| **OD-B-02**          | Credential deny on **all** connectionTypes; NON-EXCHANGE create/rename ALLOW              |
| **OD-B-03**          | Disconnect/disable ALLOW (status-only)                                                    |
| **OD-B-04**          | Durable lease (B-02) **+** ConnectionsService deny hooks (**B-03**)                       |
| **OD-B-06**          | Durable `connection.migration-gate` audits; `lifecycle_mutation_blocked` required         |
| **OD-B-07**          | Normative operation matrix (below)                                                        |
| **OD-B-08**          | Contention = immediate rejection (gate lifecycle; not ordinary connection retry)          |

Wave-level Implementation Authorization for FIV-CONN-04-B remains **GRANTED** at governance level and **does not** authorize this sub-slice without B-03 Slice Approval.

---

## 3. Source Artifacts

Inspected (present in repository; not invented):

### Parent FIV-CONN-04-B governance

| Artifact                        | Path                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| B planning package              | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-planning-package.md`              |
| B PO planning review            | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-po-planning-review.md`            |
| B PO/Governance Decision Freeze | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md` |
| B Architecture Review           | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-architecture-review.md`           |
| B Security Review               | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-security-review.md`               |
| B Implementation Authorization  | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-implementation-authorization.md`  |

### B-01 (CLOSED)

| Artifact                | Path                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Planning package        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-01-planning-package.md`                              |
| Implementation planning | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-01-implementation-planning-package.md`               |
| Implementation report   | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-01-implementation-report.md`                         |
| PO review               | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-01-po-review.md`                                     |
| Closure                 | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-01-closure.md`                                       |
| Contract code           | `apps/api/src/modules/connections/migration-gate.ts`, `migration-gate.port.ts`, `migration-gate.spec.ts` |

### B-02 (CLOSED)

| Artifact                       | Path                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Planning package               | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-planning-package.md`                                 |
| Architecture review            | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-architecture-review.md`                              |
| Security review                | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-security-review.md`                                  |
| Decision freeze                | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-po-governance-decision-freeze.md`                    |
| Slice approval                 | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-slice-approval.md`                                   |
| Implementation planning        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-implementation-planning-package.md`                  |
| Implementation planning review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-implementation-planning-review.md`                   |
| Implementation report          | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-implementation-report.md`                            |
| PO review                      | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-po-review.md`                                        |
| Closure                        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-02-closure.md`                                          |
| Durable adapter / audit / DI   | `prisma-migration-gate.adapter.ts`, `connection-migration-gate-audit.ts`, committed `connections.module.ts` |

### Repository evidence (Connections)

| Area                          | Path / symbol                                                       |
| ----------------------------- | ------------------------------------------------------------------- |
| Controller                    | `apps/api/src/modules/connections/connections.controller.ts`        |
| Canonical service             | `apps/api/src/modules/connections/connections.service.ts`           |
| DTOs                          | `apps/api/src/modules/connections/connections.dto.ts`               |
| Lifecycle / validation audits | `connection-lifecycle-audit.ts`, `connection-validation-audit.ts`   |
| Security Audit catalog        | `security-audit-classification.ts`, `security-audit-attribution.ts` |

No B-03 planning package existed prior to this artifact. No B-03 implementation artifacts exist on `HEAD`.

---

## 4. B-03 Objective

Operationalize the durable **MigrationGatePort / FIV-CONN-04** SoT delivered by B-01/B-02 at the **canonical Connections application/service enforcement boundary**.

B-03 must:

1. Observe the durable gate via `MigrationGatePort.observe()` (B-02 SoT).
2. Classify the attempted Connections mutation via closed B-01 helpers (`classifyConnectionMutation`, `shouldBlockDenySetMutation`, `isDenySetBlocked` / `observationToDenySetDecision`).
3. **DENY** the frozen deny-set while observation is `ACTIVE` or `UNKNOWN`.
4. **ALLOW** the frozen allow-set (and deny-set when observation is not blocking) without changing ordinary Connection semantics when the gate is `INACTIVE`.
5. Emit durable `lifecycle_mutation_blocked` audits for gate-denied deny-set attempts (OD-B-06).
6. Preserve ordinary authentication/authorization (`VaultConnections`, workspace membership).
7. Keep privileged migration-gate lifecycle and 04-D completely separate from ordinary Connection request DTOs.

```text
B-03 = ENFORCEMENT HOOKS ONLY
B-03 ≠ backfill
B-03 ≠ 04-D
B-03 ≠ Vault / credential migration
B-03 ≠ second migration gate
```

---

## 5. Approved Scope

B-03 **owns**:

| Ownership                                          | Detail                                                                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical deny hooks                               | `ConnectionsService.storeCredentials`, `replaceCredentials`, `revoke`, and `create` when `connectionType === 'EXCHANGE'`              |
| Allow-path non-interference                        | Ensure rename / disconnect / disable / NON-EXCHANGE create / reads / validate are **not** blocked by B-03 when gate ACTIVE            |
| Gate observation consumption                       | Inject and call existing `MIGRATION_GATE_PORT` (`MigrationGatePort`) — **no new SoT**                                                 |
| Fail-closed mapping                                | Map observe failure / UNKNOWN / invalid observation to DENY for deny-set                                                              |
| Blocked-mutation audit                             | Emit `connection.migration-gate` / `lifecycle_mutation_blocked` for denied deny-set attempts                                          |
| Mid-flight protection (COND-ARCH-B05 / ST-B25)     | Re-observe (or equivalent fail-closed bind) after Vault I/O and before Connection bind side-effects on credential store/replace paths |
| Bypass sealing (B01-AC17 / SEC-B10 / COND-SEC-B08) | No ungated twin methods for the four deny-set entrypoints inside ConnectionsService                                                   |
| Tests                                              | Unit/service tests proving matrix + fail-closed + non-interference + no client privilege injection                                    |

B-03 **does not own** lease acquire/release/heartbeat/reclaim persistence (closed in B-02), privileged environment UPDATE (04-D), or residual direct-Prisma/DBA trust (S20).

---

## 6. Explicit Exclusions

```text
EXCLUDED FROM B-03:
  - FIV-CONN-04-D privileged Connection.environment UPDATE / backfill
  - LIVE environment backfill / residual inventory (04-C / 04-E)
  - Vault schema, Vault mutation redesign, credential rebinding
  - FIV execution / FIV-PRE-01 closure
  - C7 enablement / allowRealVenueIo / live venue I/O
  - Live capital activation
  - Redesign of B-01 contract or B-02 durable lease
  - Second migration gate / in-memory gate / boolean bypass / client-controlled gate state
  - Public REST endpoints for acquire / release / heartbeat / reclaim
  - Unrelated Connections refactor, delete API, environment public mutation
  - Advisory-lock-as-SoT
  - Closing FIV-CONN-04-B or FIV-CONN-04
```

---

## 7. Repository Evidence Map

### 7.1 Canonical application boundary (authoritative)

Governance and repository evidence agree: **`ConnectionsService` is the canonical mutation boundary**, not the controller alone.

| Operation           | Controller route                       | Service method                                               | Notes                                        |
| ------------------- | -------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Credential store    | `POST /v1/connections/:id/credentials` | `ConnectionsService.storeCredentials`                        | Vault `store` then `connectionRecord.update` |
| Credential replace  | `PUT /v1/connections/:id/credentials`  | `ConnectionsService.replaceCredentials`                      | Vault `replace` then Connection update       |
| Credential revoke   | `POST /v1/connections/:id/revoke`      | `ConnectionsService.revoke`                                  | Vault `revoke` then status `REVOKED`         |
| EXCHANGE create     | `POST /v1/connections`                 | `ConnectionsService.create` when `providerType` → `EXCHANGE` | Requires environment at create               |
| NON-EXCHANGE create | same                                   | `ConnectionsService.create` when not EXCHANGE                | OD-B-02 ALLOW                                |
| Rename              | `PATCH /v1/connections/:id`            | `ConnectionsService.rename`                                  | `displayName` only; env immutable            |
| Disconnect          | `POST /v1/connections/:id/disconnect`  | `ConnectionsService.disconnect` → `transitionLifecycle`      | Status only                                  |
| Disable             | `POST /v1/connections/:id/disable`     | `ConnectionsService.disable` → `transitionLifecycle`         | Status only                                  |
| Validate            | `POST /v1/connections/:id/validate`    | `ConnectionsService.validate`                                | May status-transition; not deny-set          |
| Reads               | `GET catalog`, `GET /`, `GET /:id`     | `catalog` / `list` / `get`                                   | No mutation                                  |

Controller authorization today: `@RequirePermission(PermissionClass.VaultConnections)` on mutations; workspace via `X-Workspace-Id` + `WorkspaceAccessService.assertMember`. B-03 **must not** replace this.

### 7.2 Production Vault mutate callers (connection credentials)

Repository evidence: production Connection credential **store/replace/revoke** that bind `vaultSecretId` occur only through `ConnectionsService`. Other modules use Vault **retrieve/get** (exchange handshake, AI, notification resolvers) or test harnesses — **not** Connection credential lifecycle deny-set mutations.

### 7.3 Direct Prisma `connectionRecord` mutation paths

| Path                                                         | Mutation                                                    | Classification for B-03                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ConnectionsService.create`                                  | `create`                                                    | **B-03 scope** (EXCHANGE deny / NON-EXCHANGE allow)                                    |
| `ConnectionsService.rename`                                  | `update` displayName                                        | Allow-set; must not be blocked                                                         |
| `ConnectionsService.storeCredentials` / `replaceCredentials` | `update` vaultSecretId/status                               | **B-03 scope**                                                                         |
| `ConnectionsService.updateStatus` / lifecycle transitions    | `update` status                                             | Allow for disconnect/disable; revoke path is deny-set                                  |
| Other production modules                                     | `findFirst` / `findMany` reads only (market-data, AI, etc.) | Out of B-03 mutation scope                                                             |
| `fiv-conn-04-a-preflight.service.ts`                         | read-only `findMany`/`findFirst`                            | Outside committed B-03; local dirty leftover — **do not treat as B-03 implementation** |

No second production Nest service mutates Connection credentials or creates Connection rows.

### 7.4 Migration gate surfaces already present (must consume, not duplicate)

| Symbol                                                                 | Role                           | B-03 use                                    |
| ---------------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| `MigrationGatePort.observe()`                                          | Durable observation            | **Primary check** for deny hooks            |
| `isDenySetBlocked` / `shouldBlockDenySetMutation`                      | Pure decision helpers          | Required                                    |
| `classifyConnectionMutation`                                           | Method → deny/allow/privileged | Required                                    |
| `ConnectionMigrationGateAudit`                                         | Durable audit emitter          | Emit `lifecycle_mutation_blocked`           |
| `PrismaMigrationGateAdapter`                                           | B-02 SoT                       | Injected via `MIGRATION_GATE_PORT`          |
| `acquire` / `release` / `heartbeat` / `validate` / `reclaimAsOperator` | Privileged gate ops            | **Not** exposed on Connections HTTP in B-03 |

### 7.5 Path classes (planning taxonomy)

| Class                            | Examples                                                                        | B-03 duty                                                               |
| -------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1. Canonical application/service | `ConnectionsService` deny-set methods                                           | **Enforce**                                                             |
| 2. Privileged/internal           | `MigrationGatePort.acquire/release/heartbeat`, `reclaimAsOperator`, future 04-D | Observe boundary only; **do not** fold into ordinary Connection DTOs    |
| 3. Direct Prisma                 | Raw SQL / DBA / scripts mutating `connection_records`                           | **Residual ops trust (S20)** — document, do not claim solved            |
| 4. Test-only                     | Specs calling Vault/Prisma directly                                             | Outside production enforcement; tests must not become production bypass |
| 5. Administrative                | Operator reclaim on adapter                                                     | Already B-02; not Connections REST                                      |
| 6. Residual later                | Future workers/jobs (COND-SEC-B04)                                              | Out of B-03 delivery; must be constrained by governance if added        |

---

## 8. Operation Enforcement Matrix

Frozen matrix preserved (OD-B-07 / D-CONN-04-08). Mapping is repository evidence only — **no new operations invented**.

| Operation                          | Canonical Path                                                | Gate ACTIVE                          | Gate INACTIVE          | Scope                               | Notes                                    |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------ | ---------------------- | ----------------------------------- | ---------------------------------------- |
| credential store                   | `ConnectionsService.storeCredentials` ← `POST …/credentials`  | **DENY**                             | ALLOW (existing rules) | **B-03 owns**                       | Also DENY on UNKNOWN / observe fail      |
| credential replace                 | `ConnectionsService.replaceCredentials` ← `PUT …/credentials` | **DENY**                             | ALLOW                  | **B-03 owns**                       | Mid-flight re-check (COND-ARCH-B05)      |
| credential revoke                  | `ConnectionsService.revoke` ← `POST …/revoke`                 | **DENY**                             | ALLOW                  | **B-03 owns**                       | Includes NON-EXCHANGE (OD-B-02)          |
| EXCHANGE connection creation       | `ConnectionsService.create` when type EXCHANGE                | **DENY**                             | ALLOW                  | **B-03 owns**                       | Classify after `providerType` resolution |
| NON-EXCHANGE connection creation   | `ConnectionsService.create` when not EXCHANGE                 | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   | OD-B-02                                  |
| rename                             | `ConnectionsService.rename`                                   | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   | displayName only                         |
| disconnect                         | `ConnectionsService.disconnect`                               | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   | ≠ revoke                                 |
| disable                            | `ConnectionsService.disable`                                  | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   | status only                              |
| reads                              | `catalog` / `list` / `get`                                    | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   |                                          |
| validation                         | `ConnectionsService.validate`                                 | **ALLOW**                            | ALLOW                  | **B-03 observes; does not block**   |                                          |
| privileged 04-D environment update | _none in Connections HTTP today_                              | ALLOW only with grant + same-txn CAS | DENY without authority | **Later slice owns (04-D)**         | Not B-03                                 |
| migration-gate acquire             | `MigrationGatePort.acquire`                                   | N/A (lifecycle)                      | N/A                    | **B-02 owns; B-03 does not expose** | Privileged actor only                    |
| migration-gate heartbeat           | `MigrationGatePort.heartbeat`                                 | N/A                                  | N/A                    | **B-02 owns**                       |                                          |
| migration-gate release             | `MigrationGatePort.release`                                   | N/A                                  | N/A                    | **B-02 owns**                       |                                          |
| migration-gate reclaim             | `PrismaMigrationGateAdapter.reclaimAsOperator`                | N/A                                  | N/A                    | **B-02 owns**                       | Not public Connections API               |

### Observation → deny-set decision (B-01 contract — authoritative)

| Observation                               | Deny-set operations (store/replace/revoke/EXCHANGE create)        |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `INACTIVE`                                | **ALLOW** (ordinary auth still applies)                           |
| `ACTIVE`                                  | **DENY**                                                          |
| `EXPIRED`                                 | **ALLOW** (`isDenySetBlocked` = false; window no longer ON)       |
| `OWNERSHIP_LOST`                          | **ALLOW** (not ON for deny-set; privileged paths remain separate) |
| `CONTENTION_DENIED`                       | **ALLOW** (contention is an acquire outcome; not an ON window)    |
| `UNKNOWN`                                 | **DENY** (fail-closed)                                            |
| observe `ok: false` / thrown / unreadable | Treat as **UNKNOWN → DENY**                                       |

```text
UNKNOWN / UNREADABLE / INVALID = DENY
No soft-pass
```

---

## 9. Enforcement Architecture

### 9.1 Proposed design

```text
HTTP (ConnectionsController)
  → existing authz (VaultConnections + workspace membership)
  → ConnectionsService.<method>
       → classifyConnectionMutation({ method, connectionType? })
       → if deny-kind:
            observation = await migrationGate.observe()
            map observe failure → UNKNOWN
            if shouldBlockDenySetMutation(...).value === 'block':
                 audit lifecycle_mutation_blocked
                 throw domain denial (fail-closed)
            else continue existing method body
       → if allow-kind: proceed without gate deny (no second gate)
```

**Canonical enforcement boundary = `ConnectionsService` method entry** (and mid-flight re-check on credential store/replace before Connection bind). Controller-only hooks are **insufficient** (internal service callers would bypass).

### 9.2 Dependency direction

```text
ConnectionsService
  → MigrationGatePort (observe only for ordinary deny hooks)
  → ConnectionMigrationGateAudit (blocked events)
  → existing Prisma / Vault / lifecycle audits (unchanged ownership)
```

Do **not** invert: MigrationGate adapter must not call ConnectionsService.

### 9.3 DI wiring

Committed `connections.module.ts` already provides:

```text
{ provide: MIGRATION_GATE_PORT, useExisting: PrismaMigrationGateAdapter }
```

B-03 injects `MIGRATION_GATE_PORT` into `ConnectionsService`. No second provider. No in-memory production gate.

### 9.4 Error mapping (proposed; freeze in Architecture/Security review)

| Case                           | Proposed API behavior                                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ACTIVE deny-set           | Fail closed with conflict/locked-style Nest exception (candidate: `ConflictException` with stable message; exact HTTP code **decision required** — Arch Review noted status as non-blocking if fail-closed + auditable) |
| Gate UNKNOWN / observe failure | Same deny shape (do not leak internal DB errors)                                                                                                                                                                        |
| Ordinary authz failure         | Unchanged Forbidden/BadRequest paths                                                                                                                                                                                    |
| Gate INACTIVE                  | Unchanged existing Connection errors                                                                                                                                                                                    |

### 9.5 Inactive-gate behavior

When observation is `INACTIVE` (or non-blocking EXPIRED/OWNERSHIP_LOST/CONTENTION_DENIED), B-03 must be a **no-op** relative to Connection business rules: existing Conflict/NotFound/Vault/ACL behavior preserved.

---

## 10. MigrationGatePort Integration

### 10.1 Consume closed contract — do not redesign

B-03 **must** use:

- `MIGRATION_GATE_PORT` / `MigrationGatePort.observe()`
- Pure helpers in `migration-gate.ts`
- Existing audit type `connection.migration-gate` and outcome `lifecycle_mutation_blocked`

B-03 **must not** create:

- A parallel boolean / env flag
- A controller shadow gate
- Client-supplied `gateKey` / `purpose` / `holderId` / `fenceGeneration` as authority
- A second DB table or in-memory SoT

### 10.2 Contract defect scan (planning)

| Check                                 | Result                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Observe failure → UNKNOWN             | Present (`MigrationGateObservationResult.ok: false` → UNKNOWN)          |
| ACTIVE\|UNKNOWN block deny-set        | Present (`isDenySetBlocked`, `shouldBlockDenySetMutation`)              |
| EXCHANGE vs NON-EXCHANGE create split | Present in `classifyConnectionMutation`                                 |
| Privileged env update separate        | Present (`privileged` kind; `assertPrivilegedEnvironmentUpdateAllowed`) |
| Audit outcome constant                | Present (`lifecycle_mutation_blocked`)                                  |

```text
B-01/B-02 CONTRACT DEFECT BLOCKING B-03 = NONE FOUND
No contract modification authorized or proposed.
```

### 10.3 How the gate is checked

1. Resolve classification for the method (and connectionType for `create`).
2. Call `observe()` **without** holding a long DB transaction across Vault I/O.
3. If `!result.ok` → treat observation as `UNKNOWN`.
4. Apply `shouldBlockDenySetMutation(observation, classification)`.
5. On block: audit, then throw — **before** Vault mutate / Connection create for entry checks.
6. On credential store/replace: after Vault I/O succeeds, **re-observe** before Connection `vaultSecretId` bind; if now blocked, fail closed (COND-ARCH-B05 / ST-B25). Do not complete unsafe bind. Orphan Vault secret handling is **not** a license to soft-pass; residual Vault/Connection non-atomicity remains pre-existing context (parent B planning §2.3) — B-03 must not invent full Vault↔Connection distributed transactions.

---

## 11. Fail-Closed Model

| Failure / state                         | Deny-set behavior                            | Notes                                                                                                                                |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Gate unavailable / DB unavailable       | **DENY**                                     | observe catch → UNKNOWN                                                                                                              |
| Gate observation error                  | **DENY**                                     |                                                                                                                                      |
| `UNKNOWN` state                         | **DENY**                                     |                                                                                                                                      |
| Invalid / malformed observe payload     | **DENY**                                     | Treat unreadable as UNKNOWN                                                                                                          |
| `ACTIVE`                                | **DENY**                                     |                                                                                                                                      |
| `INACTIVE`                              | ALLOW                                        | Ordinary auth remains                                                                                                                |
| `EXPIRED`                               | ALLOW                                        | Window not ON                                                                                                                        |
| `OWNERSHIP_LOST`                        | ALLOW for deny-set                           | Not a grant of privileged 04-D                                                                                                       |
| `CONTENTION_DENIED`                     | ALLOW for deny-set                           | Acquire-side semantics                                                                                                               |
| Stale/invalid grant presented by client | **Ignored as authority**                     | Ordinary paths do not accept grants                                                                                                  |
| Missing workspace context               | Existing controller BadRequest/Forbidden     | Gate check must not run as soft-pass without workspace on mutation paths that already require it                                     |
| Missing actor context                   | Existing auth pipeline                       | Do not invent anonymous bypass                                                                                                       |
| Unauthorized caller                     | Existing `VaultConnections` / workspace ACL  | Migration gate does **not** replace authz                                                                                            |
| Cross-workspace mismatch                | Existing `getRow(workspaceId, id)` isolation | Global gate ON affects deny-set in **all** workspaces equally (OD-B-01); audits must attribute **target** workspaceId (COND-SEC-B06) |

```text
Principle: UNKNOWN / UNREADABLE / INVALID = DENY
No soft-pass on observation uncertainty
```

---

## 12. Authorization / Privilege Boundary

### Ordinary Connection context (B-03)

```text
{ workspaceId, actorUserId, actorRole? }
+ PermissionClass.VaultConnections
+ workspace membership
```

Ordinary requests **must not** accept or honor:

- `gateKey`
- `purpose`
- `holderId`
- `fenceGeneration`
- `PrivilegedActorContext`
- any “migration bypass” flag

Evidence: current DTOs (`CreateConnectionMetadataDto`, `StoreConnectionCredentialsDto`, `RenameConnectionMetadataDto`) and service method signatures contain **no** migration-grant fields. B-03 must keep it that way.

### Privileged migration context (not B-03 HTTP)

```text
PrivilegedActorContext { actorId, actorKind: SYSTEM_JOB | OPERATOR, correlationId? }
+ MigrationGateGrant (claim only; durable SoT validates)
```

Used by B-02 port methods and future 04-D. B-03 must not expose acquire/release/heartbeat/reclaim on `ConnectionsController`.

### Separation rule

```text
Ordinary Connection authorization ≠ Migration authority
Passing VaultConnections does not open the gate
Holding a grant does not unlock deny-set for ordinary clients
04-D remains separately gated (same-txn CAS) — outside B-03
```

---

## 13. Audit Model

### Existing system (reuse)

- `SecurityAuditService` + classified catalog `connection.migration-gate`
- `ConnectionMigrationGateAudit.record` with `sanitizeMigrationGateAuditPayload`
- Forbidden sensitive keys (including `fencingToken`); use `fenceGeneration`

### B-03 required emissions (OD-B-06)

| Event                        | When                                           | Required fields (safe)                                                                                                                                 |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lifecycle_mutation_blocked` | Deny-set blocked (ACTIVE/UNKNOWN/observe fail) | `outcome`, `operation`, `reasonCode`, `observation`, `workspaceId` (target), `connectionId` when known, `actorId`, `gateKey`, optional `correlationId` |

### Explicit non-requirements / distinctions

| Situation                                                       | Audit expectation                                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration-gate denial                                           | **Require** `lifecycle_mutation_blocked`                                                                                                                                  |
| Ordinary authorization denial (no VaultConnections / workspace) | Existing authz behavior; **not** necessarily a migration-gate audit                                                                                                       |
| System failure after deny decision                              | Prefer audit-before-throw; if audit itself fails, **decision required** (fail closed on mutation still mandatory — see §19)                                               |
| Successful mutation                                             | Existing lifecycle/validation audits unchanged; B-03 does not invent success audits                                                                                       |
| Privileged bypass attempts via ordinary DTO fields              | Should be impossible by API shape; if rejected as unknown fields by validation, no migration audit required unless a grant-like payload is somehow accepted (must not be) |
| Gate state errors on allow-set paths                            | No deny audit (paths not blocked)                                                                                                                                         |

### Attribution note (decision required)

Current attribution rule for `connection.migration-gate` requires `actorId` only; `workspaceId` is optional (COND-SEC-B06 comment). OD-B-06 requires target `workspaceId` on blocked mutations. Planning recommendation: put `workspaceId` in **payload** (already allowlisted) and also set `attribution.workspaceId` when recording blocked mutations for investigation hygiene — **freeze in Security Review** whether attribution must include workspaceId for B-03 blocked events.

---

## 14. Race / Transaction Analysis

### Race window

```text
observe(INACTIVE) → proceed → [Vault I/O] → Connection mutate
                              ↑
                     concurrent acquire → ACTIVE
```

| Concern                                         | Assessment                                                                                   | Proposed B-03 handling                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Entry check alone                               | Insufficient for store/replace (COND-ARCH-B05)                                               | Entry deny + **post-Vault pre-bind re-observe**                               |
| Same-transaction gate + Vault                   | Vault is not in Prisma txn today                                                             | **Do not** invent long-lived DB txn across Vault                              |
| Same-transaction gate + Connection create       | Possible but not required by frozen design for deny hooks                                    | Entry observe sufficient for create; unique index remains Strategy B backstop |
| Stronger same-txn fencing for ordinary deny-set | Not mandated by OD-B for app deny hooks; **required for 04-D** (COND-SEC-B02)                | **Do not invent** stronger mechanism without governance freeze                |
| Gate flips OFF mid-flight                       | Deny already passed; completing mutation is acceptable relative to race model (window ended) | No special unlock needed                                                      |
| Concurrent multi-instance                       | Durable SoT via B-02 lease row                                                               | All instances observe same row                                                |

### Governance decision required

Whether B-03 must implement **only** observe→deny / re-observe-before-bind, or a stricter pattern (e.g., advisory lock support, short Prisma txn around create). Planning recommendation:

```text
RECOMMENDED DEFAULT (aligned to COND-ARCH-B05):
  observe at entry for all deny-set methods
  + re-observe after Vault I/O before Connection bind for store/replace
  + no long gate txn across Vault
  + no same-txn CAS requirement for ordinary deny-set (04-D only)
```

---

## 15. Direct Prisma / Residual Paths

| Path                                                                | Class                          | Notes                                                                                            |
| ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `ConnectionsService` Prisma creates/updates                         | **B-03 scope**                 | Hooked at service methods                                                                        |
| Market-data / AI `connectionRecord.findFirst`                       | Out of scope                   | Reads only                                                                                       |
| Direct DBA / SQL against `connection_records`                       | **Operational residual (S20)** | Outside app trust; document; not “solved” by B-03                                                |
| Direct `SecretVaultService.store/replace/revoke` from tests/scripts | Residual / test                | Production Connection bind path remains ConnectionsService; COND-SEC-B04 if future workers added |
| Future worker mutating deny-set                                     | Later governance               | Must observe durable gate (COND-SEC-B04) — not implemented in B-03                               |
| `fiv-conn-04-a-*` local dirty leftovers                             | Protected leftovers            | Not B-03; read-only preflight if present; do not stage                                           |

```text
B-03 does not claim to seal raw database access.
App-supported bypass of deny-set via ConnectionsService MUST be sealed.
```

---

## 16. Security Threat Model

Planning analysis only — **not claimed solved**.

| ID            | Threat                                                | Planning control                                                                                          |
| ------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **SB-B03-01** | Bypass via alternate ConnectionsService path          | Hook all four deny-set methods; no twin helpers; grep/tests for ungated twins                             |
| **SB-B03-02** | Bypass via controller / internal endpoint             | Enforce in service, not controller-only; no new ungated admin Connection mutate API in B-03               |
| **SB-B03-03** | Bypass via direct Prisma mutation                     | Documented S20 residual; out of app boundary                                                              |
| **SB-B03-04** | Cross-workspace gate confusion                        | Gate is global (OD-B-01); Connection row access remains workspace-scoped; audits carry target workspaceId |
| **SB-B03-05** | Fail-open on gate observation failure                 | observe fail → UNKNOWN → DENY                                                                             |
| **SB-B03-06** | Client-supplied migration authority                   | No grant fields on DTOs/service inputs; ignore any future smuggling                                       |
| **SB-B03-07** | Confusing ordinary authz with migration authority     | Gate check is additional deny; VaultConnections still required; gate does not grant privileges            |
| **SB-B03-08** | Race between gate observation and connection mutation | Entry check + COND-ARCH-B05 mid-flight re-check on store/replace                                          |
| **SB-B03-09** | Privileged migration context leakage                  | Do not plumb PrivilegedActorContext through ConnectionsController; no acquire endpoints                   |
| **SB-B03-10** | Incorrect ACTIVE/EXPIRED/UNKNOWN treatment            | Use B-01 helpers only; UNKNOWN deny; EXPIRED allow deny-set                                               |
| **SB-B03-11** | Audit bypass                                          | Emit `lifecycle_mutation_blocked` before throw; test presence; decide audit-failure behavior in review    |
| **SB-B03-12** | Operational bypass via unreviewed code path           | Evidence map + residual register; COND-SEC-B04 for future workers                                         |

---

## 17. Test Strategy

Define before implementation (service/unit focused; no FIV / live I/O):

1. **INACTIVE allows** approved operations (deny-set + allow-set) under existing auth fixtures.
2. **ACTIVE denies** credential store, replace, revoke, EXCHANGE create.
3. **ACTIVE still allows** rename, disconnect, disable, NON-EXCHANGE create, reads, validation.
4. **UNKNOWN denies** protected deny-set operations.
5. **Observe failure denies** protected operations.
6. **Cross-workspace:** global ACTIVE denies deny-set in workspace A and B; row isolation still prevents cross-workspace resource access; blocked audit includes correct target workspaceId.
7. **Client cannot inject** privileged migration context (DTO/service reject or ignore; no bypass).
8. **Existing authorization** still effective when gate INACTIVE (and when ACTIVE for allow-set).
9. **Migration gate does not replace** authentication/authorization.
10. **No B-03 path activates Vault mutation** beyond existing ConnectionsService flows; gate ON prevents new store/replace/revoke.
11. **No B-03 path activates C7 / live I/O / capital** (assertions / non-goals in tests).
12. **Direct Prisma residuals** documented; tests cover app paths; S20 not falsely marked closed.
13. **Regression** suite for existing Connections behavior with gate INACTIVE (existing `connections.service.spec.ts` + related).
14. **Audit:** `lifecycle_mutation_blocked` recorded on deny; payload sanitization; no secrets / no `fencingToken` key.
15. **Race/concurrency:** ST-B25-style mid-flight — Vault succeeds then gate ACTIVE → Connection bind fails closed (to degree supported by unit doubles).

Additional: EXPIRED observation does **not** deny deny-set (contract fidelity). NON-EXCHANGE credential ops denied when ACTIVE (OD-B-02).

---

## 18. Acceptance Criteria

| ID           | Criterion                                                                                                                                        | Observable / testable |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| **B03-AC01** | Deny hooks exist on `storeCredentials`, `replaceCredentials`, `revoke`, and EXCHANGE `create` in `ConnectionsService`                            | Code + tests          |
| **B03-AC02** | While observe=`ACTIVE`, those four operations fail closed                                                                                        | Tests                 |
| **B03-AC03** | While observe=`ACTIVE`, rename/disconnect/disable/NON-EXCHANGE create/reads/validate succeed under normal fixtures                               | Tests                 |
| **B03-AC04** | While observe=`INACTIVE`, deny-set operations behave as pre-B-03 (subject to existing authz)                                                     | Regression tests      |
| **B03-AC05** | observe=`UNKNOWN` or observe failure ⇒ deny-set DENY                                                                                             | Tests                 |
| **B03-AC06** | Decisions use B-01 helpers + B-02 `MigrationGatePort.observe` only — no second SoT                                                               | Code review           |
| **B03-AC07** | Blocked attempts emit `connection.migration-gate` / `lifecycle_mutation_blocked` with target workspaceId (payload and/or attribution per freeze) | Tests                 |
| **B03-AC08** | Ordinary DTOs/service inputs cannot supply grant/privilege bypass fields                                                                         | Code + tests          |
| **B03-AC09** | Existing `VaultConnections` + workspace checks remain required                                                                                   | Tests                 |
| **B03-AC10** | Credential store/replace re-check gate after Vault I/O before Connection bind (COND-ARCH-B05 / ST-B25)                                           | Tests                 |
| **B03-AC11** | No public Connections HTTP for acquire/release/heartbeat/reclaim                                                                                 | Code review           |
| **B03-AC12** | No Prisma schema/migration changes in B-03                                                                                                       | Diff                  |
| **B03-AC13** | No 04-D environment UPDATE / backfill / FIV / C7 / capital activation                                                                            | Diff + non-goals      |
| **B03-AC14** | Direct Prisma residual S20 remains explicitly documented, not claimed sealed                                                                     | Planning/impl report  |
| **B03-AC15** | EXPIRED observation does not block deny-set (per `isDenySetBlocked`)                                                                             | Tests                 |

```text
Acceptance criteria count = 15
```

---

## 19. Architecture Decisions Required

Freeze during next Architecture / Security / PO review before implementation authorization:

| ID           | Decision                                                        | Options / recommendation                                                                                                                    |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-B03-01** | Exact Nest/HTTP denial shape for gate blocks                    | Recommend `ConflictException` (or dedicated locked exception) with stable public message; no internal lease leakage                         |
| **D-B03-02** | Mid-flight policy for store/replace                             | Recommend entry observe + post-Vault re-observe before bind (COND-ARCH-B05); no Vault-spanning DB txn                                       |
| **D-B03-03** | Whether create requires mid-flight re-check                     | Recommend entry-only for create (no Vault); optional re-check immediately before `connectionRecord.create` if PO wants symmetry             |
| **D-B03-04** | Audit attribution.workspaceId for blocked mutations             | Recommend set attribution.workspaceId = target workspace + payload.workspaceId                                                              |
| **D-B03-05** | Behavior if blocked-mutation audit write fails                  | Recommend fail closed on the mutation (do not proceed); exact exception mapping freeze                                                      |
| **D-B03-06** | Helper extraction vs inline hooks                               | Recommend small private/helper in connections module for observe→decide→audit→throw to avoid drift across four methods                      |
| **D-B03-07** | Orphan Vault secret if post-Vault re-check denies               | Document as pre-existing non-atomicity residual; do not expand B-03 into Vault compensation transactions unless PO explicitly expands scope |
| **D-B03-08** | Confirm EXPIRED/OWNERSHIP_LOST/CONTENTION_DENIED allow deny-set | Affirm B-01 helpers; do not reinterpret                                                                                                     |

No B-01 contract change proposed.

---

## 20. Implementation Boundary

**Not authorized by this document.** Candidate files supported by repository evidence:

| File                                                                  | Expected B-03 change                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/connections/connections.service.ts`             | Inject `MIGRATION_GATE_PORT`; add deny hooks + mid-flight re-check                                              |
| `apps/api/src/modules/connections/connections.service.spec.ts`        | Matrix / fail-closed / regression tests                                                                         |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts` | Likely reuse as-is; only extend if attribution helper needed                                                    |
| Optional new helper (candidate)                                       | e.g. `connection-migration-gate-enforcement.ts` — **only if** review prefers extraction; not mandatory          |
| `apps/api/src/modules/connections/connections.module.ts`              | Likely **no** provider change (port already bound on HEAD); only if constructor injection requires export tweak |

**Explicitly not expected:**

- Prisma schema / migrations
- `migration-gate.ts` / `.port.ts` redesign
- `prisma-migration-gate.adapter.ts` behavior changes (unless a proven observe bug — none found)
- Controller privilege endpoints
- Vault module changes
- 04-D backfill code

Working-tree dirty leftovers (`fiv-conn-04-a-*`, dirty `connections.module.ts` export of preflight, etc.) remain **protected** and outside this planning commit.

---

## 21. Governance Gates

```text
Planning Package                          ← THIS ARTIFACT
  → Planning Review
  → Architecture / Security Review (if required for D-B03-01…08)
  → PO / Governance Decision Freeze
  → Slice Approval
  → Implementation Planning
  → Implementation
  → PO Review
  → Closure
```

```text
Implementation is NOT authorized by this document.
```

---

## 22. Planning Decision

```text
B-03 Planning Package = READY FOR PLANNING REVIEW
No implementation authorization is granted.
```

```text
FIV-CONN-04-B-03 = PLANNING ONLY
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
```

**Next gate:** FIV-CONN-04-B-03 PLANNING REVIEW

---

## Appendix A — Gate state cheat sheet (B-03 consumer view)

| State             | Meaning for ordinary deny-set hooks |
| ----------------- | ----------------------------------- |
| INACTIVE          | Pass (ordinary rules)               |
| ACTIVE            | Block + audit                       |
| EXPIRED           | Pass deny-set (window ended)        |
| OWNERSHIP_LOST    | Pass deny-set                       |
| CONTENTION_DENIED | Pass deny-set                       |
| UNKNOWN           | Block + audit                       |

Privileged 04-D remains **ACTIVE + matching grant + same-txn CAS** only — outside B-03.

---

## Appendix B — Commit references (evidence)

| Item                                  | SHA                                        |
| ------------------------------------- | ------------------------------------------ |
| B-02 implementation                   | `0b88aed65d04f4fd676ef17a39a1421bb8cc2e7d` |
| B-02 PO Review                        | `4af4f65bd568d477759c137ea42f46557235d540` |
| B-02 Closure (planning baseline HEAD) | `1f09dda7a49b186ad51033031ad671c6514a8c6a` |
