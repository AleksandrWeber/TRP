# FIV-CONN-04-D — Full-D IA Amendment Draft (PO-VAULT-B) — Remediated

```text
PROPOSED AMENDMENT — NOT APPROVED — REMEDIATED FOR REPEAT INDEPENDENT REVIEW
NOT AN IMPLEMENTATION AUTHORIZATION
DOES NOT REPLACE THE RATIFIED IA UNTIL SEPARATE APPROVAL + RE-HASH + RE-RATIFICATION
DOES NOT CLOSE KO-COND-01

Current ratified IA SHA-256 (UNCHANGED / BINDING UNTIL SUPERSEDED):
fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039

Decision basis: D-CONN04-PO-VAULT-B — RATIFIED — PO-VAULT-B
Educational scope: D-CONN04-TOKEN-SCOPE
Companion discovery: v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-discovery.md
Remediation matrix: v3-l02-fiv-conn-04-d-po-vault-b-ia-remediation-matrix.md
Historical independent review (unchanged): v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-independent-review.md
  verdict PASS WITH CONDITIONS — SHA-256 5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031
```

**Document:** Remediated draft Full-D Implementation Authorization amendment for the dedicated internal Vault metadata port (addresses COND-IR-01…07).  
**Date:** 2026-10-30 (remediated)  
**Nature:** **DRAFT ONLY.** Does **not** edit the approved IA or its ratification. Does **not** claim a new approved IA hash. Does **not** authorize coding. Authoring is **not** independent review. Historical independent-review findings are **not** rewritten.

All implementation details below are **PROPOSED** until IA approval.

---

## 1. Binding Product Owner decisions

| Decision               | Binding effect on this draft                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D-CONN04-PO-VAULT-B`  | Dedicated internal metadata port; Nest composition = educational caller-access boundary only (not crypto AuthN)                                                 |
| `D-CONN04-TOKEN-SCOPE` | No prod S2S infra; ADP tokens ≠ Vault AuthZ proof                                                                                                               |
| Full-D IA (current)    | Hash above remains sole inventory authority until superseded                                                                                                    |
| PD03-NB01 / IA audit   | Event **contract** `connection.environment-backfill` + SYSTEM_JOB + `operation_summary` preserved (catalog **code** still Stage 2 under existing IA — see §8.1) |

Historical Trust-Boundary findings preserved: Nest DI ≠ authentication; port possession = capability; bypassing human ACL = separate privilege grant.

---

## 2. Amendment status

Until separate approval + re-hash + re-ratification:

1. Ratified IA remains binding.
2. PO-VAULT-B is **not** implementable under current §7 inventory.
3. `KO-COND-01` remains **OPEN**.
4. Stages 4–8 remain **BLOCKED**.
5. Port coding remains **NOT AUTHORIZED**.
6. Historical independent review remains evidence; this draft remediates its **conditions**, it does not supersede its verdict text.

---

## 3. Proposed port contract

### 3.1 Nest symbols — see §13 freeze table (**PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL**)

### 3.2 TypeScript interface (**PROPOSED**)

```ts
export type FivConn04DVaultMetadataLookupInput = Readonly<{
  workspaceId: string; // MUST be Entry-derived from trusted Connection.workspaceId
  vaultSecretId: string; // MUST be Entry-derived from same Connection.vaultSecretId
}>;

/** Minimal Full-D freshness view — matches FivConn04AVaultMetaInput / FivConn04LiveVaultMetaInput */
export type FivConn04DVaultMetadataView = Readonly<{
  id: string;
  workspaceId: string;
  purpose: string;
  state: string;
}>;

export type FivConn04DVaultMetadataLookupResult =
  | Readonly<{ ok: true; metadata: FivConn04DVaultMetadataView }>
  | Readonly<{
      ok: false;
      reason: 'NOT_FOUND' | 'UNAVAILABLE' | 'INVALID';
    }>;

export interface FivConn04DVaultMetadataPort {
  lookupExact(
    input: FivConn04DVaultMetadataLookupInput,
  ): Promise<FivConn04DVaultMetadataLookupResult>;
}
```

### 3.3 Minimal metadata fields

| Field         | Required | Rationale                       |
| ------------- | -------- | ------------------------------- |
| `id`          | Yes      | Exact match to `vaultSecretId`  |
| `workspaceId` | Yes      | Must equal Connection workspace |
| `purpose`     | Yes      | LIVE-class / env classification |
| `state`       | Yes      | Connected required              |

**Excluded:** `type`, `operatorLabel`, `createdAt`, `updatedAt`, all ciphertext/plaintext/secret fields, repository entities, generic full `SecretVaultMetadata` DTO.

Evidence: `fiv-conn-04-a-classification.ts` / `fiv-conn-04-live-classifier.ts` read only the four fields above.

---

## 4. Exact-ID / workspace query & Prisma projection

### 4.1 Query semantics (**PROPOSED**)

```text
Repository method (proposed name): findMetadataByIdAndWorkspaceId(workspaceId, vaultSecretId)
WHERE id = :vaultSecretId AND workspace_id = :workspaceId
SELECT id, workspace_id, purpose, state
```

- One row or none.
- No workspace-wide list.
- No slot `(type, purpose)` lookup.
- Dedicated mapper — **not** `toRecord` / ciphertext assert path.
- Query-level minimization required (DTO strip after full-row read is **not** sufficient).

### 4.2 Prisma selection (minimum)

**Select:** `id`, `workspaceId`, `purpose`, `state`  
**Never select:** `wrappingSalt`, `wrappedDataKey`, `dataKeyNonce`, `dataKeyTag`, `payload`, `payloadNonce`, `payloadTag`, or other secret material columns.

### 4.3 In-memory repository parity (**PROPOSED**)

Must match Prisma for exact id + workspace, wrong workspace / unknown id → not found, return only approved fields. Scan by record `id` + `workspaceId` (InMemory is slot-keyed today; method filters stored records — **PROPOSED**).

---

## 5. Connection-derived resource binding (COND-IR-02) + blank-ID guard (COND-IR-07)

### 5.1 Trusted identifier flow (**PROPOSED** — mandatory)

Full-D Entry (`Conn04SystemJobMigrationEntry` expand/absorb per IA COND-IA-02/06) MUST:

1. Obtain the **relevant Connection row** from the trusted B-04 / backfill processing context (Prisma Connection read under Entry orchestration — same Connection identity being evaluated for environment write).
2. Derive `workspaceId` **only** from that Connection’s `workspaceId`.
3. Derive `vaultSecretId` **only** from that **same** Connection’s `vaultSecretId`.
4. Validate both identifiers (§5.2) **before** invoking the metadata port.
5. Invoke `lookupExact({ workspaceId, vaultSecretId })` only with those validated Connection-derived values.
6. Never accept independently trusted workspace/Vault identifiers from: public HTTP, DTOs, job payloads, caller-supplied actor context, untrusted metadata, or arbitrary method arguments intended as Vault trust inputs.
7. Never combine Connection A’s `workspaceId` with Connection B’s `vaultSecretId`.
8. Preserve existing eligibility / write-gate / B-04 checks; port lookup does not replace them.

**Port API note:** The port may accept explicit `{ workspaceId, vaultSecretId }` parameters (query shape). The **Entry** is the trusted source of those values. Possession of the Nest port is an educational capability — not Connection FK enforcement inside the port.

**Evidence (current code):** Entry today only mediates B-04 leases (`fiv-conn-04-d-system-job-migration-entry.ts`). Connection fields exist on Prisma / `ConnectionRow` (`vaultSecretId: string | null`, `workspaceId: string`). Classifier empty-id path: `fiv-conn-04-a-classification.ts` (`vaultSecretId.trim()` length 0 → `AMBIGUOUS`).

### 5.2 Pre-call validation / blank-ID guard (**PROPOSED** — mandatory)

Before any port or repository call:

| Condition                                                        | Entry behavior                                                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `workspaceId` missing / null / blank after trim                  | **Fail closed**; **do not** call port; **do not** query Vault repository; no env UPDATE as fresh; no false successful `operation_summary` |
| `vaultSecretId` missing / null / blank after trim                | Same — align with existing classifier **AMBIGUOUS** / no-freshness semantics; **zero** port invocations                                   |
| Malformed identifiers (implementation-defined non-empty invalid) | Fail closed; no port call if detectable before I/O                                                                                        |

Do **not** invent a new public HTTP/API error contract. Entry remains non-HTTP.

### 5.3 Privilege summary

| Layer                      | Meaning                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| Nest composition           | Educational caller-access boundary (Connections import of dedicated module) |
| Vault metadata privilege   | Exact-id metadata-only read via port                                        |
| Connection-derived binding | Entry orchestration mandatory                                               |
| B-04 SYSTEM_JOB identity   | Business audit attribution only — **not** Vault AuthZ                       |

Human `VaultAccessControl` is **not** invoked by this port.

---

## 6. NestJS composition and export walls (COND-IR-01)

### 6.1 Selected wiring — Option A (**PROPOSED**)

**Recommendation:** Dedicated metadata module owns a **module-private** Prisma repository provider. `SecretVaultModule` remains **unchanged**.

```text
PrismaModule
  exports: [PrismaService, ...]                         — UNCHANGED

FivConn04DVaultMetadataModule                          — CREATE (Vault-owned)
  imports:  [PrismaModule]
  providers:
    - { provide: SECRET_VAULT_REPOSITORY,
        useFactory: (prisma) => new PrismaSecretVaultRepository(prisma),
        inject: [PrismaService] }                      — MODULE-PRIVATE (not exported)
    - FivConn04DVaultMetadataService                   — injects SECRET_VAULT_REPOSITORY;
                                                         calls findMetadataByIdAndWorkspaceId only
    - { provide: FIV_CONN_04_D_VAULT_METADATA_PORT,
        useExisting: FivConn04DVaultMetadataService }
  exports: [FIV_CONN_04_D_VAULT_METADATA_PORT ONLY]
  does NOT export: SECRET_VAULT_REPOSITORY, PrismaSecretVaultRepository,
                   SecretVaultService, VaultAccessControl

SecretVaultModule                                      — NO CHANGE
  exports: [SecretVaultService] only
  does NOT export port or SECRET_VAULT_REPOSITORY

ConnectionsModule                                      — MODIFY
  imports: [..., FivConn04DVaultMetadataModule]
  Conn04SystemJobMigrationEntry injects FIV_CONN_04_D_VAULT_METADATA_PORT only
  exports: [FivConn04APreflightService]                — UNCHANGED public surface
  does NOT re-export port / Entry / B-04 / repository
```

| Question                                   | Answer under Option A                                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Module owning metadata repository provider | `FivConn04DVaultMetadataModule` (private `SECRET_VAULT_REPOSITORY`)                                                                      |
| Module owning public metadata port         | `FivConn04DVaultMetadataModule` (sole export)                                                                                            |
| Exact DI relationship                      | Port token → service → private repository → `findMetadataByIdAndWorkspaceId`                                                             |
| Does `SecretVaultModule` change?           | **NO**                                                                                                                                   |
| Can Entry inject only the port?            | **YES** (intended)                                                                                                                       |
| Can Entry inject general Vault service?    | Nest **allows** today via existing `SecretVaultModule` import — **FORBIDDEN** for D freshness by this amendment; negative tests required |
| Can Entry inject broad repository?         | Repository token **not** exported from either Vault module — Entry **must not** import/provide it                                        |
| Can unrelated modules access the port?     | **Only if** they import `FivConn04DVaultMetadataModule` or receive a forbidden re-export — **Stop if** re-exported                       |

### 6.2 Options considered (not selected)

| Option                                                     | Why not selected                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| B — Export narrow repo capability from `SecretVaultModule` | Feasible but expands `SecretVaultModule` public surface; unnecessary if A works                                         |
| C — Reuse existing internal repository DI path             | **Infeasible without change** — `SECRET_VAULT_REPOSITORY` is not exported from `SecretVaultModule` today (**VERIFIED**) |

### 6.3 Same-module limitation (**ACCEPTED LIMITATION** — COND-IR-03)

Any provider registered in `ConnectionsModule` _could_ inject the port once the dedicated module is imported. Nest cannot make the port Entry-exclusive without a larger refactor (out of scope).

Educational trust model accepts Connections-internal composition, **not** cryptographic Entry-only AuthN. Mitigations: no re-export; do not inject into controllers/public services; mandatory negative tests (§12).

**Stop if:** port added to `SecretVaultModule.exports` or `ConnectionsModule.exports`.

---

## 7. Denial and diagnostic semantics

| Condition                                                 | Port `reason` | External/public disclosure        | Internal logs                            |
| --------------------------------------------------------- | ------------- | --------------------------------- | ---------------------------------------- |
| No row for `(id, workspaceId)` incl. foreign-workspace id | `NOT_FOUND`   | None beyond Entry-internal result | May log category without secret material |
| Repo/timeout/infra                                        | `UNAVAILABLE` | Entry-internal                    | Allowed                                  |
| Bad/incomplete projection                                 | `INVALID`     | Entry-internal                    | Allowed                                  |

Foreign-workspace confirmation is **collapsed** into `NOT_FOUND` via compound `where`.

Entry **must not**:

- Treat unresolved lookup as Vault freshness success.
- Silently skip lookup and UPDATE environment.
- Emit successful `operation_summary` after unresolved freshness failure.
- Call the port when identifiers fail §5.2 validation.

---

## 8. Failure / audit matrix

### 8.1 Port-level audit + Draft AC #7 clarification (COND-IR-05)

**No new port-level Security Audit event type.**

| Layer                                                | State                                                                                                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current catalog (`security-audit-classification.ts`) | `connection.environment-backfill` is **ABSENT** today (**VERIFIED**)                                                                                                              |
| Ratified event **contract** (PD03-NB01 / Full-D IA)  | Event type `connection.environment-backfill`; per-row + `operation_summary`; SYSTEM_JOB attribution                                                                               |
| Future catalog/code delivery                         | Under **existing** Full-D IA Stage 2 inventory — **not** invented by this Vault-metadata amendment                                                                                |
| This amendment’s AC #7 meaning                       | Preserve the **governance contract** (type string + attribution + summary semantics); **do not** claim the catalog already contains the event; **do not** add a second/port event |

Evidence: successful Vault `list`/`get` are not audited today; only `vault.lifecycle` and `vault.access-denied` (human ACL). Adding a port event would expand the closed catalog without demonstrated mandatory gap.

Optional structured **logger** diagnostics only — not Security Audit catalog admission.

### 8.2 Operational matrix

| Failure                      | Port           | Entry                           | Operation result                                         |
| ---------------------------- | -------------- | ------------------------------- | -------------------------------------------------------- |
| Blank/missing ids (pre-call) | **Not called** | Fail closed / AMBIGUOUS-aligned | No false success summary                                 |
| Metadata missing             | `NOT_FOUND`    | No freshness proof              | No successful live UPDATE on that path                   |
| Workspace mismatch           | `NOT_FOUND`    | Same                            | Same                                                     |
| Access denied (human ACL)    | N/A            | Port does not use human ACL     | —                                                        |
| Repository unavailable       | `UNAVAILABLE`  | Fail closed                     | No false success summary                                 |
| Timeout                      | `UNAVAILABLE`  | Same                            | Same                                                     |
| Invalid metadata             | `INVALID`      | Fail closed                     | Same                                                     |
| B-04 lease lost              | —              | Existing B-04                   | Existing                                                 |
| Write-gate denied            | —              | Existing B-04                   | Existing                                                 |
| Audit persistence failure    | —              | Existing §11.2 / IA-REV-03      | Existing; **port does not close crash-after-commit gap** |

Canonical attribution: `SYSTEM_JOB` / `system-job:fiv-conn-04-migration-backfill` unchanged.

---

## 9. Revised §7.0 dependency row (**PROPOSED** replacement text)

Replace ratified “`SecretVaultService.list` + exact id filter” Entry dependency with:

| Dependency                                    | Source                                                                                                            | Consumption                                                                       | Inventory                                                                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Vault metadata by exact `vaultSecretId` | `FivConn04DVaultMetadataPort.lookupExact({ workspaceId, vaultSecretId })` → `{ id, workspaceId, purpose, state }` | Outside write txn, before C; **Connection-derived inputs only** after §5.2 guards | CREATE port/module; MODIFY vault repository (narrow select + method); MODIFY Entry inject; **do not** use human `list` or slot `get` for D Entry freshness |

A preflight may continue using human `SecretVaultService.list` (unchanged informational path).

---

## 10. Exact source / test file inventory (**PROPOSED**)

| Path                                                                             | Action                | Owner       | Notes                                                                                                                                     |
| -------------------------------------------------------------------------------- | --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.port.ts`         | CREATE                | Vault       | Port types + token                                                                                                                        |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.ts`      | CREATE                | Vault       | Port impl                                                                                                                                 |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.ts`       | CREATE                | Vault       | Option A wiring; export port only                                                                                                         |
| `apps/api/src/modules/secret-vault/secret-vault.repository.ts`                   | MODIFY                | Vault       | Add `findMetadataByIdAndWorkspaceId`                                                                                                      |
| `apps/api/src/modules/secret-vault/prisma-secret-vault.repository.ts`            | MODIFY                | Vault       | Narrow `select` query                                                                                                                     |
| `apps/api/src/modules/secret-vault/in-memory-secret-vault.repository.ts`         | MODIFY                | Vault       | Parity                                                                                                                                    |
| `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts`               | MODIFY                | Vault       | **COND-IR-04:** update `RollbackVaultRepository` + `StaleOnceRepository` to implement new interface method (forward to InMemory delegate) |
| `apps/api/src/modules/secret-vault/secret-vault.module.ts`                       | **NO CHANGE**         | Vault       | Do not export port/repository                                                                                                             |
| `apps/api/src/modules/secret-vault/vault-access-control.ts`                      | NO CHANGE             | Vault       | —                                                                                                                                         |
| `apps/api/src/modules/secret-vault/secret-vault.service.ts`                      | NO CHANGE for D Entry | Vault       | Still exported for human/A paths                                                                                                          |
| `apps/api/src/modules/connections/connections.module.ts`                         | MODIFY                | Connections | Import metadata module; no re-export                                                                                                      |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`   | MODIFY                | Connections | Inject port; §5 binding + guards                                                                                                          |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`          | NO CHANGE             | Connections | —                                                                                                                                         |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`          | NO CHANGE for Vault   | Connections | —                                                                                                                                         |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` | CREATE                | Vault       | Metadata/isolation/select tests                                                                                                           |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts`  | CREATE                | Vault       | Export-wall tests                                                                                                                         |
| Entry / Connections export-wall + binding specs                                  | MODIFY / CREATE       | Connections | §12 matrix                                                                                                                                |

### 10.1 Repository test-double dispositions (COND-IR-04)

| Double                    | Path                             | Responsibility today                                                              | Required change                                                            | Reason                                                                                                         | Relevant tests                   |
| ------------------------- | -------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `RollbackVaultRepository` | `secret-vault.lifecycle.spec.ts` | Implements `SecretVaultRepository`; wraps InMemory; CAS reject + snapshot restore | **MODIFY** — add `findMetadataByIdAndWorkspaceId` forwarding to `delegate` | Interface implementor; compile break otherwise; lifecycle tests may not call it but TypeScript requires method | `secret-vault.lifecycle.spec.ts` |
| `StaleOnceRepository`     | `secret-vault.lifecycle.spec.ts` | Implements `SecretVaultRepository`; stale-once CAS                                | **MODIFY** — forward new method to `delegate`                              | Same                                                                                                           | Same                             |

Neither double is a production path. They are **not** unrelated to the interface change. Do **not** invent production behavior on them beyond forwarding (or equivalent compile-compatible stub that never returns ciphertext).

Other Full-D inventory (audit catalog Stage 2, write unit, occupancy, C, etc.) unchanged by this Vault-metadata amendment unless a hard conflict appears.

---

## 11. Acceptance criteria (**PROPOSED**)

1. Port returns only `{ id, workspaceId, purpose, state }` on success.
2. Prisma/in-memory exact `(id, workspaceId)` query with narrow `select` (no ciphertext columns).
3. Wrong workspace / unknown id → `NOT_FOUND`; no env UPDATE as fresh Connected.
4. `UNAVAILABLE`/`INVALID` fail closed; no false `operation_summary` success.
5. Port not exported from `SecretVaultModule` or `ConnectionsModule`; dedicated module exports **only** the port; repository provider in dedicated module is **not** exported.
6. Entry injects port only for Vault freshness; does **not** inject `SecretVaultService` or Vault repository for D freshness.
7. **AC #7 (clarified):** SYSTEM_JOB attribution + `connection.environment-backfill` **governance contract** + `operation_summary` semantics remain binding; **no** new port audit event; catalog **code** admission remains existing Full-D Stage 2 work (event **absent** in catalog today — not claimed implemented by this amendment).
8. Human Vault ACL / A preflight `list` regressions green.
9. Same-module limitation documented; controller/public paths do not receive port (mandatory negative tests).
10. Entry Connection-derived binding + blank-ID guards (§5); zero port/repo calls on blank ids.
11. Lifecycle repository doubles updated for new interface method.
12. Independent review PASS (or PASS WITH CONDITIONS closed) + PO approval + new IA hash binding before coding.
13. Option A Nest wiring implemented exactly as specified (or successor IA text if PO selects Option B explicitly).

---

## 12. Security and regression test matrix (**PROPOSED** — specify only)

### 12.1 Metadata-only / Prisma minimization

- Success result keys ⊆ `{ id, workspaceId, purpose, state }`.
- No ciphertext/plaintext fields in result.
- Prisma call args include narrow `select`; cipher columns absent.
- Port exposes no retrieve/decrypt/write.

### 12.2 Workspace / resource isolation

- Correct workspace + correct id → success metadata.
- Correct workspace + wrong id → `NOT_FOUND`.
- Wrong workspace + correct id → `NOT_FOUND`.
- Unknown id → `NOT_FOUND`.
- In-memory parity with Prisma semantics.

### 12.3 Connection-derived binding / blank guards (COND-IR-02/07)

- Missing/blank `workspaceId` → **zero** port invocations; **zero** repository metadata calls.
- Missing/blank `vaultSecretId` → **zero** port invocations; **zero** repository metadata calls.
- Correct Connection-derived pair → exact `lookupExact` once with those values.
- No caller-supplied identifier override path on Entry public methods.
- No cross-Connection identifier mixing in Entry orchestration unit tests.
- B-04 start/HB/release behavior unchanged by Vault wiring.

### 12.4 Caller boundary / same-module negatives (COND-IR-03)

| Test                                                                                       | Layer                                            | Limitation                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| Dedicated module exports only port token                                                   | Module spec                                      | Proves export array — not runtime exclusivity               |
| Port not on `SecretVaultModule.exports`                                                    | Module spec                                      | —                                                           |
| Port not on `ConnectionsModule.exports`                                                    | Module spec                                      | —                                                           |
| Unrelated module (e.g. Notification) cannot inject port without importing dedicated module | Composition/export-wall spec                     | —                                                           |
| `ConnectionsController` constructor/providers do not inject port                           | Provider wiring / Nest testing module inspection | Does **not** prove future contributors cannot add injection |
| `ConnectionsService` does not inject port                                                  | Same                                             | Same                                                        |
| Only Entry (intended Full-D path) injects port among current Connections providers         | Provider graph assertion                         | Current inventory only                                      |
| Entry does not inject `SecretVaultService`                                                 | Constructor token assertion                      | Nest still _could_ allow it — test current wiring           |
| Entry does not inject `SECRET_VAULT_REPOSITORY` / Prisma vault repository                  | Same                                             | Token not exported — assert Entry providers                 |

Do **not** claim tests enforce a universal NestJS Entry-only guarantee.

### 12.5 Audit / identity / failure

- Canonical SYSTEM_JOB identity unchanged.
- No new port audit event type.
- No false successful completion on unresolved freshness / blank ids / UNAVAILABLE / INVALID.
- Lease loss / write-gate denial / audit persistence failure retain existing Full-D semantics.
- Existing Vault, Connections, B-04, A/C regressions green.

---

## 13. Proposed symbol / file-name freeze (COND-IR-06)

**Status for all rows:** `PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL`  
**Not implemented.** Cosmetics only — no architecture expansion to choose names.

| Symbol/path                               | Proposed exact name                                                             | Owner       | Responsibility                          | Status                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ----------- | --------------------------------------- | ------------------------------------------------------- |
| Metadata port interface                   | `FivConn04DVaultMetadataPort`                                                   | Vault       | Port contract                           | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Lookup method                             | `lookupExact`                                                                   | Vault       | Exact metadata read                     | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Lookup input type                         | `FivConn04DVaultMetadataLookupInput`                                            | Vault       | `{ workspaceId, vaultSecretId }`        | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Minimal metadata type                     | `FivConn04DVaultMetadataView`                                                   | Vault       | `{ id, workspaceId, purpose, state }`   | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Lookup result type                        | `FivConn04DVaultMetadataLookupResult`                                           | Vault       | ok/fail discriminated union             | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| DI token                                  | `FIV_CONN_04_D_VAULT_METADATA_PORT`                                             | Vault       | Nest injection token                    | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Port implementation                       | `FivConn04DVaultMetadataService`                                                | Vault       | Adapter over repository                 | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Dedicated module                          | `FivConn04DVaultMetadataModule`                                                 | Vault       | Option A composition                    | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Repository method                         | `findMetadataByIdAndWorkspaceId`                                                | Vault       | Narrow select query                     | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Repository result (internal)              | four-field view or `null` (mapper-local type OK)                                | Vault       | Not a public DTO export                 | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Port file                                 | `fiv-conn-04-d-vault-metadata.port.ts`                                          | Vault       | Types + token                           | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Service file                              | `fiv-conn-04-d-vault-metadata.service.ts`                                       | Vault       | Impl                                    | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Module file                               | `fiv-conn-04-d-vault-metadata.module.ts`                                        | Vault       | Nest module                             | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Service spec                              | `fiv-conn-04-d-vault-metadata.service.spec.ts`                                  | Vault       | Unit tests                              | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Module spec                               | `fiv-conn-04-d-vault-metadata.module.spec.ts`                                   | Vault       | Export walls                            | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Entry injection                           | `@Inject(FIV_CONN_04_D_VAULT_METADATA_PORT)` on `Conn04SystemJobMigrationEntry` | Connections | Consumer                                | PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL       |
| Existing repository token (private reuse) | `SECRET_VAULT_REPOSITORY`                                                       | Vault       | Module-private in dedicated module only | PROPOSED reuse — PENDING PO CONFIRMATION AT IA APPROVAL |

---

## 14. Decisions for explicit PO confirmation at IA approval

| #   | Resolution in this draft                                                                      | PO action                             |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | **No** new port-level Security Audit event                                                    | May override                          |
| 2   | Minimal return `{ id, workspaceId, purpose, state }`                                          | May override                          |
| 3   | Dedicated exact-id + workspace query with narrow Prisma `select` + in-memory parity           | May override                          |
| 4   | Fail-closed; foreign workspace → `NOT_FOUND`; reasons `NOT_FOUND` / `UNAVAILABLE` / `INVALID` | May override                          |
| 5   | Nest **Option A** wiring (`SecretVaultModule` unchanged)                                      | Confirm or explicitly select Option B |
| 6   | Symbol/file freeze table (§13)                                                                | Confirm spellings (COND-IR-06)        |
| 7   | AC #7 governance-contract clarification (§8.1)                                                | Confirm understanding                 |

---

## 15. Remaining risks and limitations

1. **Same-module Nest injectability** — ACCEPTED LIMITATION; mitigated by tests, not crypto.
2. **Port API accepts explicit ids** — Entry binding mandatory; mis-wired Connections provider could call with arbitrary ids.
3. **Dual `PrismaSecretVaultRepository` instances** (SecretVaultModule + dedicated module) — both wrap `PrismaService`; acceptable; InMemory tests must override dedicated-module provider.
4. **Crash-after-commit audit gap (IA-REV-03)** — unchanged; not solved by port.
5. **Catalog absence of `connection.environment-backfill`** — expected until Full-D Stage 2 delivery under existing IA.

---

## 16. Preserved exclusions / stop conditions

Does **not** authorize: FIV-CONN-04-E; production/live capital/FIV PASS; public D ingress; second SYSTEM_JOB constructor; Prisma `actorKind`; outbox invention; Stages 4–8 before KO-COND-01 closure; coding before amended IA approval; production S2S; ADP tokens as Vault AuthZ.

**Stop if:**

- Port exported via `SecretVaultModule` or `ConnectionsModule`.
- Entry uses fabricated human Role/`userId` for `list`.
- Full-row ciphertext load accepted without explicit residual-risk override.
- New Security Audit event invented without separate PO catalog decision.
- External actor ingress / trust flags introduced.
- SYSTEM_JOB attribution altered.
- Stages 4–8 / E / production implied by this draft alone.
- Option A abandoned silently without documenting SecretVaultModule export change.

Does **not** claim to resolve IA-REV-03 crash-after-commit audit limitation.

---

## 17. Hash re-computation (future act only)

On approval of a successor package: apply text → recompute IA SHA-256 → re-ratify → register update → then KO-COND-01 closure eligibility. **This draft has no approved hash.**

---

## 18. Governance banner

```text
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
PORT IMPLEMENTATION: NOT AUTHORIZED
APPROVED IA HASH: fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039 (still binding)
HISTORICAL INDEPENDENT REVIEW: PASS WITH CONDITIONS (unchanged artifact)
REMEDIATION PACKAGE: READY FOR REPEAT INDEPENDENT REVIEW
IA AMENDMENT APPROVAL: NOT GRANTED
```

---

## 19. Next step

Await separate Product Owner instruction for **repeat independent review**, IA approval, KO-COND-01 closure, or implementation.

Do **not** treat this remediation as independent re-verification or IA approval.

---

_End of remediated PO-VAULT-B Full-D IA amendment draft._
