# FIV-CONN-04-B-03 Implementation Planning Package

**Document:** FIV-CONN-04-B-03 Lifecycle Enforcement Hooks — Implementation Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-03 — Application/service enforcement hooks  
**Authority:** Senior Staff Engineer (implementation planning under PO Slice Approval)  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** modify production code, Prisma, ConnectionsService, controllers, Vault, 04-D, backfill, FIV, C7, venue I/O, or capital.

**Slice Approval:** [`v3-l02-fiv-conn-04-b-03-slice-approval.md`](./v3-l02-fiv-conn-04-b-03-slice-approval.md) — **GRANTED** (`b0e6a12…`)  
**Decision Freeze:** [`v3-l02-fiv-conn-04-b-03-decision-freeze.md`](./v3-l02-fiv-conn-04-b-03-decision-freeze.md) — **APPROVED** (`b0e6a12…`)  
**Planning Review:** [`v3-l02-fiv-conn-04-b-03-planning-review.md`](./v3-l02-fiv-conn-04-b-03-planning-review.md) — PASS WITH CONDITIONS (resolved)  
**Planning Package:** [`v3-l02-fiv-conn-04-b-03-planning-package.md`](./v3-l02-fiv-conn-04-b-03-planning-package.md) @ `0002f00…`

**Repository baseline:** `b0e6a12b6947bd822d9e1df030cace8c7ca75ec7` (`HEAD == origin/main`)

```text
FIV-CONN-04-B-03 SLICE APPROVAL = GRANTED
B-03 IMPLEMENTATION = AUTHORIZED FOR THIS SLICE
B-03 IMPLEMENTATION IN THIS TASK = NOT PERFORMED
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Planning Status

```text
IMPLEMENTATION PLANNING PACKAGE = READY FOR IMPLEMENTATION PLANNING REVIEW
Implementation = NOT STARTED
```

---

## 2. Governance Context

| Gate                                  | Artifact                                       | Status / commit                 |
| ------------------------------------- | ---------------------------------------------- | ------------------------------- |
| B-01 CLOSED                           | contract + closure                             | CLOSED                          |
| B-02 CLOSED                           | durable lease + closure `1f09dda…`             | CLOSED                          |
| B-03 Planning Package                 | `…-b-03-planning-package.md`                   | `0002f00…`                      |
| B-03 Planning Review                  | `…-b-03-planning-review.md`                    | `78f8dd8…` PASS WITH CONDITIONS |
| B-03 Decision Freeze + Slice Approval | `…-decision-freeze.md` + `…-slice-approval.md` | `b0e6a12…` APPROVED / GRANTED   |
| Parent OD-B / Arch / Sec              | B-series freezes + COND-ARCH-B05               | BINDING                         |
| FIV-CONN-04-B parent                  | NOT CLOSED                                     |                                 |
| 04-D / FIV / C7 / capital             | NOT AUTHORIZED                                 |                                 |

```text
B-03 = SLICE APPROVED / IMPLEMENTATION AUTHORIZED
B-03 implementation = NOT YET STARTED
04-D = NOT AUTHORIZED
FIV = NOT PERFORMED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
```

---

## 3. Frozen Decisions

| ID           | Frozen rule (do not reopen)                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **D-B03-01** | Gate deny → `ConflictException` / HTTP **409**; non-leaking message                                                  |
| **D-B03-02** | store/replace/revoke: entry observe + post-Vault mid-flight re-observe                                               |
| **D-B03-03** | Durable `lifecycle_mutation_blocked` before deny; workspace + actor attribution; audit fail ⇒ fail closed            |
| **D-B03-04** | Vault/Connection desync after mid-flight deny = **accepted residual**; no B-03 compensation                          |
| **D-B03-05** | EXPIRED / OWNERSHIP_LOST / CONTENTION_DENIED → deny-set **ALLOW** via `isDenySetBlocked`; ACTIVE\|UNKNOWN → **DENY** |
| **D-B03-06** | S20 direct Prisma residual outside B-03                                                                              |
| **D-B03-07** | `observe()` is additional policy; does not replace `VaultConnections` / workspace authz                              |
| **D-B03-08** | No Vault-spanning txn; no new atomicity; create = entry observe only                                                 |
| **C-B03-01** | Revoke: `vault.revoke` → re-observe → `REVOKED` **or** fail closed (no REVOKED)                                      |
| **C-B03-03** | Helper extraction **optional** (recommended below to prevent four-way drift)                                         |

### Contract defect scan

| Check                                                                            | Result         |
| -------------------------------------------------------------------------------- | -------------- |
| `MigrationGatePort.observe()`                                                    | Present (B-02) |
| `isDenySetBlocked` / `shouldBlockDenySetMutation` / `classifyConnectionMutation` | Present (B-01) |
| `lifecycle_mutation_blocked` outcome constant                                    | Present        |
| `ConnectionMigrationGateAudit`                                                   | Present        |
| `MIGRATION_GATE_PORT` DI on committed module                                     | Present        |

```text
B-01/B-02 CONTRACT DEFECT BLOCKING B-03 = NONE
Do not redesign MigrationGatePort, lease schema, adapter, fencing, or B-01 helpers.
```

---

## 4. Repository Evidence

### 4.1 Canonical files (committed HEAD)

| Path                                                                  | Role                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/connections/connections.service.ts`             | Canonical mutation boundary — **no gate hooks yet**                                           |
| `apps/api/src/modules/connections/connections.controller.ts`          | Thin HTTP; preserves `ConflictException` → 409                                                |
| `apps/api/src/modules/connections/connections.dto.ts`                 | No grant/privilege fields                                                                     |
| `apps/api/src/modules/connections/connections.module.ts`              | `MIGRATION_GATE_PORT` → `PrismaMigrationGateAdapter`; `ConnectionMigrationGateAudit` provided |
| `apps/api/src/modules/connections/migration-gate.ts`                  | Pure helpers + audit constants                                                                |
| `apps/api/src/modules/connections/migration-gate.port.ts`             | Port + Symbol                                                                                 |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`   | Durable observe SoT (**do not redesign**)                                                     |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts` | Audit emitter (extend attribution)                                                            |
| `apps/api/src/modules/connections/connections.service.spec.ts`        | Large suite; constructs `ConnectionsService` with 12 ctor args today                          |
| `apps/api/src/modules/security-audit/security-audit.service.ts`       | Durable audit; throws on unsafe/unclassified writes                                           |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`   | `connection.migration-gate`: `actorId` required; `workspaceId` optional (allowed)             |

### 4.2 Current `ConnectionsService` symbols

| Method                                                                        | Deny-set?      | Vault I/O                     | Connection mutation                            |
| ----------------------------------------------------------------------------- | -------------- | ----------------------------- | ---------------------------------------------- |
| `storeCredentials`                                                            | YES            | `vault.store`                 | `connectionRecord.update` vaultSecretId/status |
| `replaceCredentials`                                                          | YES            | `vault.replace`               | `connectionRecord.update`                      |
| `revoke`                                                                      | YES            | `vault.get` + `vault.revoke`  | `updateStatus(…, 'REVOKED')`                   |
| `create`                                                                      | EXCHANGE only  | none                          | `connectionRecord.create`                      |
| `rename` / `disconnect` / `disable` / `list` / `get` / `catalog` / `validate` | NO (allow-set) | n/a (validate may read Vault) | status/displayName as today                    |

### 4.3 Constructor today (no gate)

```text
ConnectionsService(
  prisma, vault, validator, validationAudit, lifecycleAudit,
  handshake, sessions, capabilities, openRouterTests,
  openRouterConnectivity, openRouterAudit, openRouterAiRequests
)
```

### 4.4 Protected leftovers note

Working tree may contain dirty `connections.module.ts` (e.g. 04-A preflight) and untracked 04-A files. **Implementation MUST target committed HEAD wiring** and must **not** stage protected leftovers. If local dirty module differs, rebase/merge carefully without absorbing out-of-scope 04-A into B-03.

---

## 5. Implementation Boundary

### IN SCOPE

- `ConnectionsService` deny hooks for store / replace / revoke / EXCHANGE create
- `MigrationGatePort.observe()` consumption
- Mid-flight re-observe for store / replace / revoke (C-B03-01)
- Durable blocked audits via existing Security Audit
- `ConflictException` / 409 mapping
- Minimal DI (inject port + audit into service)
- Optional shared enforcement helper
- Tests for B03-AC01…AC15 + regression of existing Connections suites

### OUT OF SCOPE

- B-01 / B-02 redesign or Prisma lease changes
- 04-D / backfill / environment UPDATE
- Vault redesign / compensation / credential migration
- FIV / C7 / live I/O / capital / trading execution
- Public gate acquire/release/heartbeat/reclaim HTTP
- S20 DBA/Prisma residual remediation
- Unrelated Connections refactor
- Absorbing protected 04-A leftovers

---

## 6. Enforcement Architecture

### 6.1 Canonical call flow

```text
HTTP ConnectionsController
  → existing authz (VaultConnections + workspace membership)   [unchanged]
  → ConnectionsService.<method>
       → classifyConnectionMutation({ method, connectionType? })
       → if deny-kind:
            observation = await observeOrUnknown(migrationGate)
            if shouldBlockDenySetMutation(...).value === 'block'
                 OR decision not ok:
              await recordBlocked(...)   // fail closed if throws
              throw new ConflictException(GATE_DENY_MESSAGE)
       → continue existing business logic
       → [store|replace|revoke only] after Vault mutate:
            re-observe; if blocked → audit + ConflictException
            (do NOT Connection-mutate)
       → Connection persistence (existing)
```

### 6.2 Shared helper (recommended; C-B03-03 optional)

**Create** `apps/api/src/modules/connections/connection-migration-gate-enforcement.ts`:

| Export / method                       | Responsibility                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `GATE_DENY_PUBLIC_MESSAGE`            | Frozen public string (see §13)                                                 |
| `observeOrUnknown(port)`              | `observe()`; `!ok` → `'UNKNOWN'`                                               |
| `assertDenySetAllowed(...)`           | classify + observe + `shouldBlockDenySetMutation`; on block → audit then throw |
| `assertDenySetAllowedAfterVault(...)` | mid-flight re-observe path                                                     |

Injectable Nest provider **or** plain functions taking `MigrationGatePort` + `ConnectionMigrationGateAudit` — either is acceptable; prefer **Injectable** for testability consistency with other connection audits.

### 6.3 Dependency direction

```text
ConnectionsService → MigrationGatePort (observe only)
ConnectionsService → ConnectionMigrationGateAudit (blocked events)
  ↛ do not invert (adapter must not call ConnectionsService)
```

### 6.4 No second SoT

Use only `MIGRATION_GATE_PORT.observe()`. Forbidden: in-memory flags, env booleans, client body fields, shadow controller checks as sole enforcement.

---

## 7. Operation Mapping

**Authoritative matrix** = Decision Freeze §6 + B-01 `isDenySetBlocked` (**D-B03-05**).

> Note: Any draft matrix showing EXPIRED / OWNERSHIP_LOST / CONTENTION_DENIED as DENY for deny-set is **incorrect** and must not be implemented. Frozen B-01 semantics win.

| Operation                                          | INACTIVE            | ACTIVE   | EXPIRED | OWNERSHIP_LOST | CONTENTION_DENIED | UNKNOWN  | Mid-flight     |
| -------------------------------------------------- | ------------------- | -------- | ------- | -------------- | ----------------- | -------- | -------------- |
| credential store                                   | ALLOW               | **DENY** | ALLOW   | ALLOW          | ALLOW             | **DENY** | Yes            |
| credential replace                                 | ALLOW               | **DENY** | ALLOW   | ALLOW          | ALLOW             | **DENY** | Yes            |
| credential revoke                                  | ALLOW               | **DENY** | ALLOW   | ALLOW          | ALLOW             | **DENY** | Yes (C-B03-01) |
| EXCHANGE create                                    | ALLOW               | **DENY** | ALLOW   | ALLOW          | ALLOW             | **DENY** | Entry only     |
| NON-EXCHANGE create                                | ALLOW               | ALLOW    | ALLOW   | ALLOW          | ALLOW             | ALLOW    | No             |
| rename / disconnect / disable / reads / validation | ALLOW               | ALLOW    | ALLOW   | ALLOW          | ALLOW             | ALLOW    | No             |
| 04-D env UPDATE                                    | Outside B-03        |          |         |                |                   |          |                |
| gate acquire/HB/release/reclaim                    | Outside B-03 (B-02) |          |         |                |                   |          |                |

`observe()` failure / thrown error → treat as **UNKNOWN → DENY**.

---

## 8. storeCredentials Flow

Exact insertion points in `ConnectionsService.storeCredentials`:

```text
1. [existing] authz already done in controller
2. [existing] getRow(workspaceId, id)
3. NEW: assertDenySetAllowed({
     method: 'storeCredentials',
     workspaceId, actorUserId, connectionId: id
   })
4. [existing] DISABLED / already-stored / slot availability prechecks
5. [existing] vault.store(...)
6. NEW: assertDenySetAllowedAfterVault({ same context, phase: 'mid_flight' })
7. [existing] connectionRecord.update({ vaultSecretId, status: DISCONNECTED })
8. [existing] cache clears / OpenRouter audit
```

If step 6 blocks: **do not** perform step 7; throw after durable blocked audit; Vault secret may remain unbound → **D-B03-04**.

---

## 9. replaceCredentials Flow

```text
1. getRow + existing prechecks (null secret, status transition)
2. NEW: entry assertDenySetAllowed({ method: 'replaceCredentials', ... })
3. [existing] vault.replace(...)
4. [existing] ownership id equality check
5. NEW: mid-flight assertDenySetAllowedAfterVault(...)
6. [existing] connectionRecord.update + lifecycleAudit credentials_replaced
```

Same orphan residual if step 5 blocks after successful Vault replace.

---

## 10. revoke Flow (C-B03-01)

**Frozen sequence — do not alter:**

```text
1. getRow + transition assert + vaultSecretId null check
2. NEW: entry assertDenySetAllowed({ method: 'revoke', ... })
3. [existing] vault.get ownership verification
4. [existing] vault.revoke(...)
5. NEW: mid-flight assertDenySetAllowedAfterVault(...)
6. if blocked at 5:
     - durable lifecycle_mutation_blocked
     - ConflictException
     - DO NOT updateStatus(REVOKED)
     - DO NOT claim successful REVOKED view
     - Vault may already be revoked → D-B03-04 residual
7. if allowed:
     - [existing] updateStatus(REVOKED)
     - cache clears
     - lifecycleAudit outcome 'revoked'
```

`vault.get` is read-only and occurs **after** entry gate allow; it is not a Connection mutation. Mid-flight re-observe is **after** `vault.revoke`, **before** `updateStatus`.

---

## 11. EXCHANGE Creation Flow

```text
1. providerType(provider) → connectionType
2. existing NotFound / environment resolution
3. NEW: if connectionType === 'EXCHANGE':
     assertDenySetAllowed({
       method: 'create',
       connectionType: 'EXCHANGE',
       workspaceId, actorUserId
       // connectionId absent
     })
4. [existing] connectionRecord.create(...)
```

NON-EXCHANGE: **no** gate deny call (classification allow). Optional no-op classify for clarity is fine but must not block.

No mid-flight re-observe (no Vault). No mandatory second observe immediately before create (D-B03-08).

---

## 12. Audit Design

### Existing system

- `ConnectionMigrationGateAudit.record` → `SecurityAuditService.record`
- `eventType`: `connection.migration-gate` (`MIGRATION_GATE_AUDIT_EVENT_TYPE`)
- `outcome`: `lifecycle_mutation_blocked`
- Catalog already registered (B-02)

### Required B-03 blocked-audit payload (safe keys only)

| Field                    | Source                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `gateKey`                | `FIV-CONN-04`                                                                                             |
| `operation`              | `CREDENTIAL_STORE` / `CREDENTIAL_REPLACE` / `CREDENTIAL_REVOKE` / `EXCHANGE_CREATE` (from classification) |
| `observation`            | observed state or `UNKNOWN`                                                                               |
| `reasonCode`             | e.g. `GATE_UNKNOWN` or stable `GATE_ACTIVE` / helper reason when available                                |
| `workspaceId`            | target workspace                                                                                          |
| `connectionId`           | when known                                                                                                |
| `outcome`                | `lifecycle_mutation_blocked` (also top-level outcome)                                                     |
| `result`                 | `denied`                                                                                                  |
| optional `correlationId` | if available from request context (usually absent today)                                                  |

**Forbidden in HTTP and audit keys:** secrets, credentials, `fencingToken`, holder/fence as authority leakage in HTTP (fence may appear in **gate lifecycle** audits elsewhere; for blocked ordinary mutations prefer observation/reasonCode only — do not put grant claims from clients).

### Attribution (D-B03-03)

Extend `ConnectionMigrationGateAudit.record` input to accept optional `workspaceId` and set:

```text
attribution: {
  actorId,
  workspaceId,          // REQUIRED for B-03 blocked mutations
  resourceType: 'migration-gate',
  resourceId: 'FIV-CONN-04',
}
```

Catalog rule already allows optional `workspaceId` (not required by schema); B-03 **must supply it** for blocked mutations.

### Placement / transaction

| Choice                                | Decision                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| When                                  | **Before** throwing `ConflictException`                                                         |
| Same Prisma txn as Connection mutate? | **No** — denial path does not open a Connection mutation txn; audit is a separate durable write |
| Vault-spanning txn?                   | **Forbidden**                                                                                   |
| Audit failure                         | Propagate throw → **fail closed** (do not Connection-mutate; do not return success)             |

Do not wrap Vault I/O + audit + Connection update in one DB transaction.

### Tests for audit helper

Update `connection-migration-gate-audit.spec.ts` to cover workspace attribution on blocked outcome.

---

## 13. Error Contract

### Frozen public message (Implementation Planning fix for D-B03-01)

```text
GATE_DENY_PUBLIC_MESSAGE =
  'This connection operation is temporarily unavailable.'
```

| Property            | Rule                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Exception           | `ConflictException(GATE_DENY_PUBLIC_MESSAGE)`                                                                 |
| HTTP                | **409** (Nest default; controller preserves ConflictException for credentials/revoke paths)                   |
| Body                | Nest default message string only — **no** holderId, fenceGeneration, lease timestamps, Vault ids, credentials |
| Distinct from authz | Workspace denial remains `ForbiddenException` (403)                                                           |

Create path: controller does not wrap create in `credentialError`; Nest still maps `ConflictException` → 409.

---

## 14. Vault Residual (D-B03-04)

| Trigger                                  | Residual                                                       | B-03 action                      |
| ---------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| store/replace Vault OK → mid-flight DENY | Unbound / replaced Vault secret without Connection bind update | Fail closed; **no** compensation |
| revoke Vault OK → mid-flight DENY        | Vault revoked; Connection not REVOKED                          | Fail closed; **no** restore      |
| Soft-pass to avoid residual              | **FORBIDDEN**                                                  |                                  |

Document residual in implementation report; later ops/governance owns cleanup.

---

## 15. S20 Residual

Re-verified at planning baseline `b0e6a12…`:

| Path                               | Caller                                         | Op     | Class         | B-03                  |
| ---------------------------------- | ---------------------------------------------- | ------ | ------------- | --------------------- |
| `connectionRecord.create/update`   | `ConnectionsService` only under `apps/api/src` | mutate | App canonical | **In scope** (hooks)  |
| `connectionRecord.find*`           | market-data, AI, etc.                          | read   | App read      | Out of mutation scope |
| Direct DBA/SQL/scripts             | Ops                                            | mutate | **S20**       | Outside B-03          |
| Specs calling Vault/Prisma doubles | Tests                                          | test   | Test          | Not production        |

```text
S20 remains outside B-03. Do not expand scope to seal raw DB access.
```

---

## 16. DI / Module Wiring

### Committed HEAD already provides

```text
ConnectionMigrationGateAudit
PrismaMigrationGateAdapter
{ provide: MIGRATION_GATE_PORT, useExisting: PrismaMigrationGateAdapter }
```

### Planned `ConnectionsService` constructor additions

```text
@Inject(MIGRATION_GATE_PORT) private readonly migrationGate: MigrationGatePort
private readonly migrationGateAudit: ConnectionMigrationGateAudit
```

Order: append after existing deps **or** place near other audits — keep Nest-friendly; update **all** `new ConnectionsService(...)` call sites in specs.

### Module changes

| File                         | Change                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `connections.module.ts`      | Likely **none** if providers already present; only if optional Enforcement helper is registered as provider |
| Dirty local module with 04-A | **Do not** commit leftover preflight as part of B-03 unless separately authorized                           |

Exports: no change required for B-03 (service is internal to module).

---

## 17. Files to Modify/Create

| Path                                                      | Action                                                 | Purpose                                                      |
| --------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `connections.service.ts`                                  | **MODIFY**                                             | Inject port+audit; hooks in store/replace/revoke/create      |
| `connection-migration-gate-audit.ts`                      | **MODIFY**                                             | Accept/pass `workspaceId` in attribution                     |
| `connection-migration-gate-audit.spec.ts`                 | **MODIFY**                                             | Attribution tests                                            |
| `connection-migration-gate-enforcement.ts`                | **CREATE** (recommended)                               | Shared observe/assert/audit/throw                            |
| `connection-migration-gate-enforcement.spec.ts`           | **CREATE** (if helper created)                         | Unit tests for helper                                        |
| `connections.service.spec.ts`                             | **MODIFY**                                             | Ctor updates + B-03 matrix / mid-flight / audit / HTTP tests |
| `connections.module.ts`                                   | **MODIFY only if** helper provider registration needed | Minimal                                                      |
| Controllers / DTOs / Prisma / adapter / migration-gate.ts | **NO** (unless proven bug — none found)                |                                                              |

---

## 18. Test Plan

Primary location: `connections.service.spec.ts` (+ helper/audit specs).

Use doubles for `MigrationGatePort.observe` returning configurable observations / failures.

### A. Entry gate (deny-set)

| Case                        | Expected                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| INACTIVE                    | ALLOW store/replace/revoke/EXCHANGE create (existing success paths) |
| ACTIVE                      | DENY + audit + ConflictException                                    |
| EXPIRED                     | **ALLOW** (D-B03-05)                                                |
| OWNERSHIP_LOST              | **ALLOW**                                                           |
| CONTENTION_DENIED           | **ALLOW**                                                           |
| UNKNOWN                     | DENY                                                                |
| observe `ok: false` / throw | DENY as UNKNOWN                                                     |

### B. Allowed operations under ACTIVE

rename, disconnect, disable, NON-EXCHANGE create, list/get/catalog, validate still succeed under normal fixtures.

### C–E. store / replace / revoke mid-flight

| Case                                 | Expected                                             |
| ------------------------------------ | ---------------------------------------------------- |
| Entry blocked                        | No Vault mutate; audit; ConflictException            |
| Vault OK + mid-flight ALLOW          | Connection mutate succeeds                           |
| Vault OK + mid-flight ACTIVE/UNKNOWN | No Connection bind/REVOKED; ConflictException; audit |
| Audit failure on deny path           | Fail closed (no Connection mutate)                   |

Revoke-specific (C-B03-01): after `vault.revoke`, blocked mid-flight ⇒ Connection status **not** `REVOKED`.

### F. Security

- DTOs/service ignore grant fields (none present)
- Cross-workspace `getRow` still isolates
- Gate INACTIVE still requires ordinary authz at controller (service tests document; controller tests if present)
- `observe` does not grant privileges

### G. HTTP

ConflictException message equals `GATE_DENY_PUBLIC_MESSAGE`; no sensitive fields.

### H. Audit

`connection.migration-gate` + `lifecycle_mutation_blocked` + actorId + workspaceId.

### I. Regression

Run full `apps/api/src/modules/connections/` vitest suite + tsc as in prior B-02 closure style.

---

## 19. Security Control Mapping

| ID        | Control                                         | Location                    | Test                      |
| --------- | ----------------------------------------------- | --------------------------- | ------------------------- |
| SB-B03-01 | Hook all four deny methods; no twins            | `connections.service.ts`    | Matrix tests              |
| SB-B03-02 | Service-level enforcement                       | service not controller-only | Service tests             |
| SB-B03-03 | Document S20                                    | impl report                 | Evidence grep             |
| SB-B03-04 | Global gate + workspace row + audit workspaceId | observe + getRow + audit    | Cross-ws tests            |
| SB-B03-05 | observe fail → UNKNOWN deny                     | helper                      | Observe-fail tests        |
| SB-B03-06 | No grant DTOs                                   | dto/service                 | Shape tests               |
| SB-B03-07 | Authz unchanged; gate additive                  | controller+service          | Regression                |
| SB-B03-08 | Mid-flight re-observe                           | store/replace/revoke        | Mid-flight tests          |
| SB-B03-09 | No public gate HTTP                             | controller review           | AC11                      |
| SB-B03-10 | B-01 helpers only                               | helper                      | EXPIRED allow tests       |
| SB-B03-11 | Audit before throw; audit fail closed           | audit path                  | Audit-fail tests          |
| SB-B03-12 | S20 + COND-SEC-B04 later                        | docs                        | Residual note             |
| SB-B03-13 | Accept residual; no compensation                | mid-flight deny             | Documented behavior tests |
| SB-B03-14 | Fixed public message                            | D-B03-01                    | Message assertion         |

---

## 20. Acceptance Criteria Mapping

| AC       | Implementation location             | Test                 | Verification        |
| -------- | ----------------------------------- | -------------------- | ------------------- |
| B03-AC01 | Four methods hooked                 | service specs        | Code review + tests |
| B03-AC02 | ACTIVE deny                         | A tests              | vitest              |
| B03-AC03 | Allow-set under ACTIVE              | B tests              | vitest              |
| B03-AC04 | INACTIVE regression                 | existing + A         | vitest              |
| B03-AC05 | UNKNOWN / observe fail              | A tests              | vitest              |
| B03-AC06 | Port + B-01 helpers only            | code review          | no second SoT       |
| B03-AC07 | Audit emit + workspace              | H tests              | vitest              |
| B03-AC08 | No grant injection                  | F tests              | dto/service         |
| B03-AC09 | Authz preserved                     | F/regression         | vitest              |
| B03-AC10 | Mid-flight store/replace/**revoke** | C–E                  | vitest              |
| B03-AC11 | No public gate HTTP                 | controller unchanged | review              |
| B03-AC12 | No Prisma schema                    | diff                 | review              |
| B03-AC13 | No 04-D/FIV/C7/capital              | diff + non-goals     | review              |
| B03-AC14 | S20 documented                      | §15 + impl report    | review              |
| B03-AC15 | EXPIRED does not block deny-set     | A tests              | vitest              |

```text
All 15 ACs are implementable and testable under this plan.
```

---

## 21. Implementation Phases

### Phase 1 — Enforcement helper + audit attribution

|         |                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Files   | `connection-migration-gate-enforcement.ts` (+spec), `connection-migration-gate-audit.ts` (+spec)                              |
| Symbols | `observeOrUnknown`, `assertDenySetAllowed`, `assertDenySetAllowedAfterVault`, `GATE_DENY_PUBLIC_MESSAGE`; audit `workspaceId` |
| Deps    | `MigrationGatePort`, B-01 helpers, `ConnectionMigrationGateAudit`                                                             |
| Tests   | Helper unit + audit attribution                                                                                               |
| Exit    | Helper blocks ACTIVE/UNKNOWN; EXPIRED passes; audit includes workspaceId; audit throw propagates                              |

### Phase 2 — storeCredentials

|         |                                                         |
| ------- | ------------------------------------------------------- |
| Files   | `connections.service.ts`, `connections.service.spec.ts` |
| Symbols | ctor inject; entry + mid-flight in `storeCredentials`   |
| Tests   | C cases                                                 |
| Exit    | AC02/05/10 store paths green                            |

### Phase 3 — replaceCredentials

|         |                                            |
| ------- | ------------------------------------------ |
| Files   | same                                       |
| Symbols | entry + mid-flight in `replaceCredentials` |
| Tests   | D cases                                    |
| Exit    | replace mid-flight green                   |

### Phase 4 — revoke (C-B03-01)

|         |                                                     |
| ------- | --------------------------------------------------- |
| Files   | same                                                |
| Symbols | entry + post-`vault.revoke` mid-flight              |
| Tests   | E cases                                             |
| Exit    | blocked mid-flight ⇒ not REVOKED; AC10 revoke green |

### Phase 5 — EXCHANGE create

|         |                                                                    |
| ------- | ------------------------------------------------------------------ |
| Files   | same                                                               |
| Symbols | entry deny when `connectionType === 'EXCHANGE'` after type resolve |
| Tests   | ACTIVE denies EXCHANGE create; NON-EXCHANGE create allowed         |
| Exit    | AC01/02/03 create split green                                      |

### Phase 6 — Audit integration hardening

|         |                                            |
| ------- | ------------------------------------------ |
| Files   | service + audit specs                      |
| Symbols | ensure every deny path audits before throw |
| Tests   | H + audit-fail fail-closed                 |
| Exit    | AC07 green                                 |

### Phase 7 — Regression / security / suite

|       |                                                                         |
| ----- | ----------------------------------------------------------------------- |
| Files | all connections specs                                                   |
| Tests | I + SB mapping cases; update all ctor sites                             |
| Exit  | connections vitest green; tsc clean; no B-01/B-02 contract file changes |

Phase order may combine 2–5 in one PR if review prefers, but exit criteria remain additive.

---

## 22. Risks / Residuals

| Risk / residual                                 | Severity                   | Handling                        |
| ----------------------------------------------- | -------------------------- | ------------------------------- |
| Vault↔Connection desync after mid-flight deny   | Accepted (D-B03-04)        | Fail closed; document           |
| Spec ctor churn (many `new ConnectionsService`) | Medium eng                 | Systematic update in Phase 1–2  |
| Dirty local `connections.module.ts` leftovers   | Process                    | Do not stage; implement on HEAD |
| Future workers bypassing service                | COND-SEC-B04 later         | Out of B-03                     |
| S20 DBA bypass                                  | Residual                   | Out of B-03                     |
| Race after final observe→mutate micro-window    | Accepted app-hook strength | No new atomicity (D-B03-08)     |

No unresolved contract blocker.

---

## 23. Governance Gates

```text
Implementation Planning Package          ← THIS ARTIFACT
  → Implementation Planning Review
  → Implementation (authorized by Slice Approval; execute only after planning review as required)
  → PO Review
  → Closure Review
```

```text
Do not skip Implementation Planning Review.
This package does not start coding.
```

Still not authorized by B-03 implementation: 04-D, FIV, C7, live I/O, capital.

---

## 24. Planning Decision

```text
IMPLEMENTATION PLANNING PACKAGE = READY FOR IMPLEMENTATION PLANNING REVIEW
B-03 implementation has NOT started.
```

```text
NEXT GATE:
FIV-CONN-04-B-03 IMPLEMENTATION PLANNING REVIEW
```

```text
FIV-CONN-04-B-03 = SLICE APPROVED / IMPLEMENTATION AUTHORIZED
B-03 implementation = NOT YET STARTED
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
```
