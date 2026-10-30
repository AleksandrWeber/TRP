# FIV-CONN-04-D — Full-D Implementation Authorization Amendment

## PO-VAULT-B Dedicated Vault Metadata Port — Final Candidate Successor-01

```text
SUCCESSOR FINAL CANDIDATE — PENDING INDEPENDENT REVIEW OF SUCCESSOR CANDIDATE
NOT AN APPROVED IA AMENDMENT
NOT IMPLEMENTATION AUTHORIZATION
DOES NOT CLOSE KO-COND-01
DOES NOT REPLACE THE APPROVED FULL-D IA UNTIL SEPARATE APPROVAL + RE-HASH + RE-RATIFICATION
PREDECESSOR CANDIDATE REVIEW IS HISTORICAL ONLY — NOT A REVIEW OF THIS SUCCESSOR
```

**Document:** Successor final-candidate Full-D Implementation Authorization Amendment incorporating ratified decision package `D-CONN04-PO-VAULT-B-IA-AMD`, remedying independent-review findings FC-01, FC-02, and FC-04.  
**Date:** 2026-10-30  
**Predecessor:** `v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate.md` (SHA-256 `9a3cacdb0afd7dfc9cdd61c4cc73b38e7a349fcd7e4988f1bc24ea7aaac65a9f`)  
**Predecessor independent review:** `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-final-candidate-independent-review.md` (SHA-256 `e2f22de32cc70a954586a099867fcc72bef542c1da2f3427631d9e93b4689a79`) — historical; does **not** review this successor.  
**Nature:** **GOVERNANCE / DOCUMENTATION ONLY — REVIEW-READY SUCCESSOR CANDIDATE.** Does **not** authorize coding. Does **not** amend the Decision Register. Does **not** stage, commit, or push.

---

## 0. Drafting evidence — verified source hashes

| Artifact                                          | Path                                                                                        | SHA-256                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| PO package ratification                           | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-po-ratification.md`                           | `079341e4c417585196727f5d79d93536532cb50a13cd8f6989413ba735c7ca31` |
| PO decision package                               | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-po-ratification-package.md`                   | `73b8e32d0cd2d92dbd9f0c5165102d2d47be4c59673f43ac6ee513cb6dd6c106` |
| Recommendation memo                               | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-recommendation-memo.md`                       | `248c6105af86b35ab197aae3cbf5aef2dbaf8e4794a5a2b856bd80f3cba57faa` |
| Prior amendment draft                             | `v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-draft.md`           | `b4153e2a6384fea1ac86ae13a9d447bded4fc5a171fe367f376b9d3175507cdd` |
| Discovery                                         | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-discovery.md`                                 | `e288db898fcca91ccc055885f77710d194646183e316221f5b4331dfc1dfd556` |
| Remediation matrix                                | `v3-l02-fiv-conn-04-d-po-vault-b-ia-remediation-matrix.md`                                  | `69869d16d0b7c38fe49e9f5dc7788ec603bcabcae7f28cd6c94dd20af09213d0` |
| Second independent review                         | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-second-independent-review.md`                 | `3752a914881c3d5f3bda176bf93e535478aadc6e1536577f42f0dfd093363525` |
| First independent review                          | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-independent-review.md`                        | `5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031` |
| **Approved Full-D IA (binding until superseded)** | `v3-l02-fiv-conn-04-d-implementation-authorization.md`                                      | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` |
| Full-D IA ratification                            | `v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`                    | `9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299` |
| PO-VAULT-B strategy ratification                  | `v3-l02-fiv-conn-04-d-po-vault-b-ratification.md`                                           | `7417ad7cd33df0325a1c4366c34da677f0128ca08906914fd65727099c7ca7df` |
| TOKEN-SCOPE                                       | `v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`                                    | `9e0c46ec1bb41aae826f40d4db93d4a32ef11a0666309ca4ddc1276595a8c9ac` |
| Kickoff Completion                                | `v3-l02-fiv-conn-04-d-kickoff-completion.md`                                                | `f197c2944e1e4b37b005ecd72a30fda6fc5ecbb2d821de68af921eacb1e1fe50` |
| Kickoff                                           | `v3-l02-fiv-conn-04-d-implementation-kickoff.md`                                            | `3b8d3e10a47bd95b00e2d5070e93f1b7742a7a69df55c5e1ebf55732d0225d2d` |
| Kickoff Review                                    | `v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`                                     | `7c732fe9556c6f69e4516e2f9c5826545ced5a39e704cf2b9d6a9f06a033ee15` |
| Stage 1 Vault Entry Design                        | `v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md`                                        | `2212f931cf966650f9b580fcba512a56dbc57b6117d9d1a204bed112ccbec652` |
| Decision Register (reference)                     | `wave-6-po-decision-register.md`                                                            | `1438e52fc64a9aef76f77fdde0d62ba184a93150b266044c90af8692336e3d66` |
| Predecessor final candidate                       | `v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate.md` | `9a3cacdb0afd7dfc9cdd61c4cc73b38e7a349fcd7e4988f1bc24ea7aaac65a9f` |
| Predecessor independent review                    | `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-final-candidate-independent-review.md`        | `e2f22de32cc70a954586a099867fcc72bef542c1da2f3427631d9e93b4689a79` |

**Repository baseline at drafting:** branch `main`, HEAD `953292675e197d4f25778aaaa59eacb2826560fe`. Pre-existing dirty/untracked preserved. Primary ratification / package / memo / predecessor / predecessor-review hashes **MATCH** expected values.

**Successor remediation scope:** FC-01 (§2 → §10 cross-reference), FC-02 (explicit supersession of identified approved Full-D IA §7.0 / §7.1 statements), FC-04 (successor independent-review status). COND-IR-06 / FC-03 remains **open** (Interpretation B).

**Binding decision source:** `D-CONN04-PO-VAULT-B-IA-AMD` — **RATIFIED — PO DECISION PACKAGE** (Decisions 1–7 **ACCEPT**; overall **RATIFY**).

---

## 1. Purpose and relationship to the existing Full-D IA

### 1.1 Purpose

This candidate amends the existing Full-D Implementation Authorization **only** in the areas required by the ratified PO-VAULT-B decision package: replace the Entry Vault freshness dependency on human `SecretVaultService.list` + exact-id filter (approved IA §7.0) with a dedicated internal Vault **metadata-only** port under Nest Option A composition.

### 1.2 Relationship to approved IA

| Fact                                                | Status                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Approved Full-D IA SHA-256                          | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` — **still binding**                                         |
| This candidate                                      | **NOT APPROVED**; not yet effective                                                                                            |
| Unaffected original IA provisions                   | **Remain in force** (including Stage 2 catalog delivery, write unit, occupancy, C classifier, SYSTEM_JOB identity, exclusions) |
| Silent replace / broaden / weaken of original scope | **Forbidden**                                                                                                                  |
| Implementation authorization                        | **Not granted** by this candidate                                                                                              |

Until a separate IA Amendment approval + re-hash + re-ratification becomes effective, implementers must treat the approved Full-D IA as governing and must **not** code the dedicated port under this candidate alone.

### 1.3 Explicit Supersession of Approved Full-D IA Provisions

**Effective only after** a separate, explicit Product Owner approval of this IA Amendment (with re-hash + re-ratification as required). Until that approval, the currently approved Full-D IA (`fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`) remains binding in full. **This candidate document itself does not amend the approved IA.**

Once the IA Amendment is separately approved, **only** the specifically identified statements/rows below are superseded, and **only** within the narrow D Entry metadata-freshness scope described. All other provisions of the approved Full-D IA remain binding and unchanged. Do **not** interpret this as “§7 is replaced” or as a general Vault redesign.

| #   | Approved Full-D IA locus                                       | Exact / source wording (abridged)                                                      | Supersession after separate IA Amendment approval                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | §7.0 intro paragraph                                           | “No new Vault/occupancy/C modules are added to the authorized inventory.”              | **Narrow exception only:** permits the dedicated internal Vault metadata module (`FivConn04DVaultMetadataModule` / Option A) and its Vault-owned port/service files described in this amendment for D Entry metadata freshness. **Not** general permission to introduce other Vault, occupancy, or C modules. Occupancy and C remain REUSE as in the approved IA. |
| S2  | §7.0 FACT                                                      | “No separate exact-id Vault getter exists. Exact-id freshness = `list` + id equality.” | Superseded **only** for the Full-D D Entry metadata-freshness path: that path uses the dedicated metadata port / compound exact-id repository method described herein (not `list` + id equality). Other Vault access paths and requirements are **unchanged** by this supersession.                                                                               |
| S3  | §7.1 Entry row — `fiv-conn-04-d-system-job-migration-entry.ts` | Responsibility includes “inject/use Vault list + Prisma occupancy projection per §7.0” | For the **D Entry metadata-freshness decision**, inject/use the dedicated metadata port (see this amendment §2 and §10) rather than Vault `list`. Prisma occupancy projection and other Entry responsibilities outside Vault metadata freshness remain as in the approved IA.                                                                                     |
| S4  | §7.1 REUSE row — `secret-vault.service.ts`                     | “`list` for workspace Vault metadata (exact-id match in Entry)”                        | After amendment approval, `secret-vault.service.ts` is **not** the D Entry metadata-freshness lookup mechanism. Existing REUSE for other approved flows remains applicable where those flows still use the service (including informational / human **A preflight** `SecretVaultService.list`, which this amendment does **not** remove or reinvent).             |

**Precedence rule:**

1. Until separate IA Amendment approval → approved Full-D IA governs exclusively.
2. After separate IA Amendment approval → S1–S4 above supersede the listed statements/rows only; amendment §2 / §10 govern D Entry Vault metadata freshness; all other approved IA provisions remain in force.
3. This successor candidate is **not** approval and creates **no** interim dual-authority to follow both old and new D Entry freshness instructions for coding.

**Implementer stop rule:** Do not follow both the old §7.0/`list` D Entry freshness path and the dedicated port path. After approval, only the dedicated port path is authorized for D Entry metadata freshness.

---

## 2. Amended §7.0 Vault freshness dependency (**CANDIDATE** replacement)

**Replace** the ratified Entry dependency on `SecretVaultService.list` + exact `meta.id` filter for Full-D freshness with:

| Dependency                                    | Source                                                                                                            | Consumption                                                                       | Inventory                                                                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Vault metadata by exact `vaultSecretId` | `FivConn04DVaultMetadataPort.lookupExact({ workspaceId, vaultSecretId })` → `{ id, workspaceId, purpose, state }` | Outside write txn, before C; Connection-derived inputs only after blank-ID guards | CREATE port/module; MODIFY vault repository (narrow select + method); MODIFY Entry inject; **do not** use human `list` or slot `get` for D Entry freshness |

A preflight may continue using human `SecretVaultService.list` (unchanged informational path).

All other §7 inventory rows of the approved Full-D IA remain unchanged unless explicitly listed in **§10** of this candidate (or explicitly superseded under §1.3 S1–S4).

---

## 3. Ratified Decision 1 — Option A Nest composition

### 3.1 Module wiring (binding)

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
                   SecretVaultService, VaultAccessControl, B-04, durable authority

SecretVaultModule                                      — NO CHANGE
  exports: [SecretVaultService] only
  does NOT export port or SECRET_VAULT_REPOSITORY

ConnectionsModule                                      — MODIFY
  imports: [..., FivConn04DVaultMetadataModule]
  Conn04SystemJobMigrationEntry injects FIV_CONN_04_D_VAULT_METADATA_PORT only
  exports: [FivConn04APreflightService]                — UNCHANGED public surface
  does NOT re-export port / Entry / B-04 / repository
```

### 3.2 Accepted educational trade-off

A second Nest `PrismaSecretVaultRepository` wrapper instance (dedicated module + `SecretVaultModule`) over the same `PrismaService` is an **accepted educational trade-off**. It is **not** a cryptographic security boundary.

### 3.3 Stop conditions

- Port added to `SecretVaultModule.exports` or `ConnectionsModule.exports`.
- Repository, `SecretVaultService`, B-04, or durable authority exported through the dedicated module.
- Entry injects `SecretVaultService` or Vault repository for D freshness.

---

## 4. Ratified Decision 2 — Inventory approach (Interpretation B)

### 4.1 Working basis

The proposed symbol/file/provider/method inventory below is the **working basis** for this candidate and for eventual implementation planning.

### 4.2 Exact freeze — NOT closed

Exact spellings are **NOT** frozen by `D-CONN04-PO-VAULT-B-IA-AMD`.  
**COND-IR-06 remains PENDING PO CONFIRMATION AT IA APPROVAL** (separate approval act).  
Do **not** mark COND-IR-06 fully closed at this stage.

### 4.3 Proposed freeze table (status preserved)

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

## 5. Ratified Decision 3 — AC #7 governance contract

| Layer                 | Binding statement                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Governance contract   | Event type `connection.environment-backfill` + canonical SYSTEM_JOB attribution + `operation_summary` semantics remain binding (PD03-NB01 / Full-D IA) |
| Runtime catalog today | Event **absent** from `security-audit-classification.ts`                                                                                               |
| Catalog code delivery | Full-D **Stage 2** under **existing** approved IA §7.2 — **not** expanded by this amendment                                                            |
| Port audit            | **No** new Vault metadata port Security Audit event                                                                                                    |
| Wording               | Must not invent additional implementation scope                                                                                                        |

Distinguish: governance requirements (contract) vs runtime implementation (Stage 2 still pending code delivery).

---

## 6. Ratified Decision 4 — Metadata view and compound query

### 6.1 Metadata view (exact)

```text
{ id, workspaceId, purpose, state }
```

**Excluded:** plaintext, ciphertext, decryption, retrieve/mutate/admin, `type`, timestamps, `operatorLabel`, repository entities, full `SecretVaultMetadata` DTO.

### 6.2 Mandatory repository lookup

```text
WHERE VaultSecret.id = :vaultSecretId
  AND VaultSecret.workspaceId = :workspaceId
```

Prisma-style:

```ts
where: { id: vaultSecretId, workspaceId }
select: { id: true, workspaceId: true, purpose: true, state: true }
```

- Query-level minimization mandatory (no full-row load then strip).
- **No** list-and-filter, `SecretVaultService.list` for D Entry, or slot-based lookup.
- Dedicated mapper — **not** `toRecord` / ciphertext assert path.
- Proposed method name (pending freeze): `findMetadataByIdAndWorkspaceId`.

### 6.3 Port result reasons

| Condition                                              | Reason        |
| ------------------------------------------------------ | ------------- |
| No row for `(id, workspaceId)` incl. foreign workspace | `NOT_FOUND`   |
| Repo/timeout/infra                                     | `UNAVAILABLE` |
| Bad/incomplete projection                              | `INVALID`     |

---

## 7. Ratified Decision 5 — Connection-derived resource binding

Full-D Entry **MUST**:

1. Obtain the relevant Connection from trusted B-04 / backfill processing context.
2. Derive `workspaceId` and `vaultSecretId` from that **same** Connection only.
3. Validate both (trim; non-empty) **before** any port/repository call.
4. On missing/blank/invalid: fail closed; **zero** port invocations; **zero** repository metadata calls; AMBIGUOUS-aligned; no env UPDATE as fresh; no false successful `operation_summary`.
5. Never accept overrides from HTTP, DTOs, job payloads, caller-supplied actor context, or untrusted metadata.
6. Never mix Connection A workspace with Connection B vault id.
7. Preserve existing eligibility / write-gate / B-04 checks.

Port API may accept explicit `{ workspaceId, vaultSecretId }`; Entry is the trusted source. Nest port possession ≠ Connection FK enforcement.

---

## 8. Ratified Decision 6 — Educational Nest trust boundary

| Statement                                                | Binding                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Nest composition / DI                                    | Educational caller-access boundary **only**                                                       |
| Same-module limitation                                   | Any `ConnectionsModule` provider **can** inject the port once imported — **ACCEPTED LIMITATION**  |
| Cryptographic Entry-only                                 | **Not claimed**; Nest cannot enforce it without larger refactor                                   |
| Production S2S / Entry identity proof / token provenance | **Not claimed**                                                                                   |
| ADP / educational tokens                                 | Do **not** grant Vault authorization (`D-CONN04-TOKEN-SCOPE`)                                     |
| Deferred                                                 | Production identity, trust roots, provisioning, custody, rotation, revocation, workload bootstrap |
| Forbidden infra in this amendment                        | SPIFFE/SPIRE, mTLS, IdP, OAuth client credentials, cloud WI, KMS, HSM, equivalents                |

Mandatory negative tests: export walls + controller/public service non-injection + Entry does not inject `SecretVaultService`/repository for D freshness. Tests cannot prove universal future Nest exclusivity.

Human `VaultAccessControl` is **not** invoked by this port.

---

## 9. Ratified Decision 7 — Audit and fail-closed behavior

| Requirement                             | Binding                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Business event                          | `connection.environment-backfill`                                                 |
| Attribution                             | Canonical P-D-02 `SYSTEM_JOB` / `system-job:fiv-conn-04-migration-backfill`       |
| Port-level Security Audit event         | **None**                                                                          |
| Second summary / outbox / pending-audit | **Not added**                                                                     |
| Fail-closed                             | Required for NOT_FOUND / UNAVAILABLE / INVALID / blank-ID                         |
| False success `operation_summary`       | **Forbidden**                                                                     |
| Transaction context                     | Use existing Security Audit txn architecture where supported (approved Full-D IA) |
| Crash-after-commit (IA-REV-03)          | **Accepted residual** — **not solved** by this amendment                          |

---

## 10. Source / test inventory (authorized when amendment is approved)

**Status of all rows:** inventory for future authorized implementation — **not implemented** by this candidate.

| Path                                                                             | Action                | Owner       | Notes                                                                |
| -------------------------------------------------------------------------------- | --------------------- | ----------- | -------------------------------------------------------------------- |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.port.ts`         | CREATE                | Vault       | Port types + token                                                   |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.ts`      | CREATE                | Vault       | Port impl                                                            |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.ts`       | CREATE                | Vault       | Option A; export port only                                           |
| `apps/api/src/modules/secret-vault/secret-vault.repository.ts`                   | MODIFY                | Vault       | Add `findMetadataByIdAndWorkspaceId`                                 |
| `apps/api/src/modules/secret-vault/prisma-secret-vault.repository.ts`            | MODIFY                | Vault       | Narrow `select`                                                      |
| `apps/api/src/modules/secret-vault/in-memory-secret-vault.repository.ts`         | MODIFY                | Vault       | Parity                                                               |
| `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts`               | MODIFY                | Vault       | `RollbackVaultRepository` + `StaleOnceRepository` forward new method |
| `apps/api/src/modules/secret-vault/secret-vault.module.ts`                       | NO CHANGE             | Vault       | Do not export port/repository                                        |
| `apps/api/src/modules/secret-vault/vault-access-control.ts`                      | NO CHANGE             | Vault       | —                                                                    |
| `apps/api/src/modules/secret-vault/secret-vault.service.ts`                      | NO CHANGE for D Entry | Vault       | Human/A paths unchanged                                              |
| `apps/api/src/modules/connections/connections.module.ts`                         | MODIFY                | Connections | Import metadata module; no re-export                                 |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`   | MODIFY                | Connections | Inject port; binding + guards                                        |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`          | NO CHANGE             | Connections | —                                                                    |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`          | NO CHANGE for Vault   | Connections | —                                                                    |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` | CREATE                | Vault       | Metadata/isolation/select                                            |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts`  | CREATE                | Vault       | Export walls                                                         |
| Entry / Connections export-wall + binding specs                                  | MODIFY / CREATE       | Connections | §11 matrix                                                           |

Other Full-D inventory (Stage 2 catalog, write unit, occupancy, C, etc.) remains under the **approved** Full-D IA and is **unchanged** by this Vault-metadata amendment.

---

## 11. Required future tests (specify only — not executed)

Distinguish: these are **required future** tests under authorized implementation; this candidate does **not** claim they have been written or passed.

1. Metadata-only result; Prisma `select` excludes cipher columns.
2. Exact compound lookup success; wrong workspace / wrong id / unknown → `NOT_FOUND`.
3. In-memory parity with Prisma.
4. Missing/blank `workspaceId` / `vaultSecretId` → zero port + zero repository metadata calls.
5. No caller override / no cross-Connection mixing.
6. Fail-closed; no false `operation_summary`.
7. Export-wall + same-module negative injection tests (with Nest limitation documented).
8. Entry does not inject `SecretVaultService` / repository for D freshness.
9. Lifecycle doubles compile with new interface method.
10. AC #7 governance/catalog distinction (contract preserved; catalog absence expected until Stage 2).
11. Human ACL / A `list` regressions remain green.
12. B-04 lease / write-gate / existing Full-D failure semantics unchanged.

---

## 12. Acceptance criteria (for authorized implementation after approval)

1. Port success returns only `{ id, workspaceId, purpose, state }`.
2. Exact `(id, workspaceId)` query with narrow `select`.
3. Wrong workspace / unknown id → `NOT_FOUND`; no fresh env UPDATE.
4. `UNAVAILABLE`/`INVALID`/blank-ID fail closed; no false summary.
5. Port not on `SecretVaultModule` / `ConnectionsModule` exports; dedicated module exports port only; repository private.
6. Entry injects port only for D freshness.
7. AC #7 governance contract preserved; no port audit event; Stage 2 catalog scope unchanged.
8. Same-module limitation documented; mandatory negative tests.
9. Connection-derived binding + zero-I/O blank guards.
10. Lifecycle doubles updated.
11. Option A wiring as specified.
12. Independent review of **this candidate** + separate IA approval + symbol freeze confirmation + new IA hash binding **before** coding.

---

## 13. Scope and exclusions

Unaffected approved Full-D IA provisions remain in force.

This amendment does **not** authorize:

- FIV-CONN-04-E;
- Production activation / live capital / FIV PASS;
- Public HTTP/UI access;
- Cron/scheduler invocation;
- Trading Runtime access;
- External actor-context ingress;
- Second SYSTEM_JOB constructor or alternate Entry;
- Prisma `actorKind` column;
- Outbox or pending-audit architecture;
- Production-grade S2S identity infrastructure (SPIFFE/SPIRE, mTLS, IdP, OAuth client credentials, cloud WI, KMS, HSM).

---

## 14. Gate and condition status

```text
PO DECISION PACKAGE (D-CONN04-PO-VAULT-B-IA-AMD): RATIFIED
SUCCESSOR FINAL IA AMENDMENT CANDIDATE: PREPARED — PENDING INDEPENDENT REVIEW OF SUCCESSOR CANDIDATE
IA AMENDMENT: NOT APPROVED
EXACT SYMBOL FREEZE (COND-IR-06 / FC-03): PENDING PO CONFIRMATION AT IA APPROVAL
PREDECESSOR CANDIDATE INDEPENDENT REVIEW: PASS WITH CONDITIONS (historical; applies only to predecessor hash 9a3cacdb…65a9f — NOT this successor)
SECOND REVIEW OF DRAFT: PASS WITH CONDITIONS (historical; not final IA approval)
KO-COND-01: OPEN
STAGES 4–8: BLOCKED
FULL-D IMPLEMENTATION: NOT AUTHORIZED
VAULT PORT IMPLEMENTATION: NOT AUTHORIZED
FULL-D BACKFILL: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
APPROVED FULL-D IA HASH (still binding):
  fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039
```

Do **not** close `KO-COND-01` in this document.  
Do **not** treat the predecessor independent review, or the second independent review of the remediation draft, as review or approval of **this successor** candidate.

---

## 15. Required next governance sequence

1. Predecessor final candidate reviewed (`PASS WITH CONDITIONS`; historical).
2. Successor final candidate prepared (**this document** — FC-01 / FC-02 / FC-04 remediation).
3. Recalculate and record **successor** candidate SHA-256.
4. Independent review of **this exact successor** candidate (delta review acceptable if scope-limited).
5. Resolve findings; produce a further successor/hash if necessary.
6. Separate Product Owner IA Amendment approval and re-ratification.
7. Confirm/freeze exact symbols and inventory (COND-IR-06 / FC-03 — still open).
8. Separate formal `KO-COND-01` closure act.
9. Only after all applicable gates are satisfied → separately authorized implementation stages.

No implementation starts as part of candidate preparation.

---

## 16. Traceability — Decisions 1–7

| PO Decision                    | Ratification §  | This candidate § | Review / remediation mapping                 | Representation                          |
| ------------------------------ | --------------- | ---------------- | -------------------------------------------- | --------------------------------------- |
| 1 Option A module              | §5.4 / §4 Dec-1 | §3               | COND-IR-01 resolved (Option A)               | Nest wiring + trade-off                 |
| 2 Inventory / Interpretation B | §5.1            | §4               | COND-IR-06 **pending** at IA approval        | Freeze table status preserved           |
| 3 AC #7 contract               | §5.4 Dec-3      | §5               | COND-IR-05 resolved                          | Governance vs Stage 2 catalog           |
| 4 Four-field + compound query  | §5.4 Dec-4      | §6               | Contract / Prisma minimization               | Exact view + `where`/`select`           |
| 5 Connection binding           | §5.4 Dec-5      | §7               | COND-IR-02 / COND-IR-07                      | Same-row ids + zero-I/O guards          |
| 6 Educational Nest DI          | §5.2            | §8               | COND-IR-03 ACCEPTED LIMITATION               | Same-module honesty + negatives         |
| 7 Audit / fail-closed          | §5.3            | §9               | Decision 1 no port audit; IA-REV-03 residual | Event + SYSTEM_JOB + crash gap retained |

### Pending conditions (explicit)

| Condition                                                  | Status                                                        | Why pending                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| COND-IR-06 exact symbol freeze                             | **PENDING** PO confirmation at separate IA Amendment approval | Interpretation B — ratification intentionally deferred freeze                                       |
| Independent review of **this successor candidate**         | **REQUIRED**                                                  | Predecessor review covers only predecessor hash `9a3cacdb…65a9f`; draft second review is historical |
| Separate IA Amendment approval / re-hash / re-ratification | **REQUIRED**                                                  | Candidate ≠ approved IA                                                                             |
| `KO-COND-01` closure                                       | **OPEN**                                                      | Separate formal act after amended IA approval                                                       |

COND-IR-01…05 and COND-IR-07 were addressed in the remediated draft / predecessor and are retained here; they remain subject to re-verification against **this successor** by independent review. FC-01 / FC-02 / FC-04 remediations in this successor address the predecessor independent-review findings of those IDs; they do **not** constitute a completed independent review of this successor.

---

## 17. Explicit non-authorization banner

```text
THIS DOCUMENT IS A SUCCESSOR FINAL CANDIDATE ONLY.
PENDING INDEPENDENT REVIEW OF SUCCESSOR CANDIDATE
IT DOES NOT APPROVE THE IA AMENDMENT.
IT DOES NOT SUPERSEDE THE APPROVED FULL-D IA UNTIL SEPARATE APPROVAL.
IT DOES NOT CLOSE KO-COND-01.
IT DOES NOT AUTHORIZE IMPLEMENTATION.
IT DOES NOT AUTHORIZE STAGES 4–8.
IT DOES NOT AUTHORIZE FIV-CONN-04-E OR PRODUCTION ACTIVATION.
COND-IR-06 / FC-03 SYMBOL FREEZE REMAINS OPEN.
WAIT FOR INDEPENDENT REVIEW OF THIS SUCCESSOR AND SEPARATE PRODUCT OWNER IA APPROVAL.
```

---

_End of PO-VAULT-B Full-D IA Amendment final candidate successor-01._
