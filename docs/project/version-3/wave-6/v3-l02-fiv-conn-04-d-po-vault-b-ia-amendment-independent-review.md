# FIV-CONN-04-D — Independent Review: Full-D IA Amendment Draft (PO-VAULT-B)

```text
INDEPENDENT TECHNICAL + GOVERNANCE REVIEW ONLY
DOES NOT APPROVE THE IA AMENDMENT
DOES NOT AUTHORIZE IMPLEMENTATION
DOES NOT CLOSE KO-COND-01
DOES NOT MODIFY APPROVED IA / IA RATIFICATION / PO RATIFICATION / DECISION REGISTER
DOES NOT EDIT THE REVIEWED DRAFT OR DISCOVERY REPORT
DOES NOT STAGE, COMMIT, OR PUSH
```

**Document:** Independent review of the refined Full-D IA Amendment Draft and companion Discovery under `D-CONN04-PO-VAULT-B`.  
**Date:** 2026-10-30  
**Reviewer role:** Independent reviewer (not author of Draft / Discovery).  
**Overall verdict:** **PASS WITH CONDITIONS**

---

## 1. Review scope and independence statement

### 1.1 Scope

Reviewed artifacts (current repository versions only):

1. `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-draft.md`
2. `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-discovery.md`

Binding governance cross-checked:

- `v3-l02-fiv-conn-04-d-po-vault-b-ratification.md`
- `v3-l02-fiv-conn-04-d-token-scope-decision-amendment.md`
- `v3-l02-fiv-conn-04-d-implementation-authorization.md`
- `v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md`
- `v3-l02-fiv-conn-04-d-kickoff-completion.md`
- `v3-l02-fiv-conn-04-d-implementation-kickoff-review.md`
- `v3-l02-fiv-conn-04-d-stage-1-vault-entry-design.md`
- `v3-l02-fiv-conn-04-d-po-vault-trust-boundary-review.md`
- Canonical `wave-6-po-decision-register.md`

Independent source/test inspection covered Vault module composition, Prisma Vault model and repository projections, classifiers, Entry, Connections module export wall, Vault ACL/audit events, and Security Audit catalog presence of `connection.environment-backfill`.

### 1.2 Independence

This review **does not** accept Discovery conclusions at face value. Material architectural claims were re-verified against repository symbols. Where Draft/Discovery state and source diverge, the divergence is recorded as a finding.

This review **does not** authorize implementation, approve the IA amendment, close `KO-COND-01`, or modify any binding governance artifact.

---

## 2. Repository branch / HEAD baseline

| Field                                                              | Value                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| Branch                                                             | `main`                                                    |
| HEAD                                                               | `953292675e197d4f25778aaaa59eacb2826560fe`                |
| Matches expected reference baseline                                | **YES**                                                   |
| Index staged for this review                                       | **None** (reviewer did not stage)                         |
| Pre-existing dirty/untracked                                       | **Preserved** (not cleaned, stashed, reset, or committed) |
| Application source/tests/schema/deps/config changed by this review | **NO** — only this review document created                |

---

## 3. Reviewed artifact hashes

| Artifact                       | SHA-256 (this review)                                              |
| ------------------------------ | ------------------------------------------------------------------ |
| Amendment Draft                | `8704ca79616ac43c2ce2e57064d521e2876c32b08a072998d261b2132c82daa8` |
| Discovery report               | `1717edf75d641a40f9716e9eaaf69cd4eca09dad920235ffc7b35e6f35fcc451` |
| Approved Full-D IA             | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` |
| Full-D IA ratification         | `9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299` |
| PO-VAULT-B ratification        | `7417ad7cd33df0325a1c4366c34da677f0128ca08906914fd65727099c7ca7df` |
| TOKEN-SCOPE decision amendment | `9e0c46ec1bb41aae826f40d4db93d4a32ef11a0666309ca4ddc1276595a8c9ac` |

**Verification notes:**

- Approved IA hash matches the binding expectation cited in the task and Draft banner.
- IA ratification hash matches the binding expectation.
- Draft and Discovery hashes were computed from current bytes; Draft/Discovery were **not** modified by this review.

---

## 4. Binding decision consistency

### 4.1 PO-VAULT-B — **CONSISTENT** (with conditions on Nest wiring precision)

| Binding fact                                                  | Review result                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Dedicated internal Vault metadata port                        | Draft proposes dedicated port/module — **aligned**                                                                             |
| Metadata-only access                                          | Four-field view; no retrieve/decrypt — **aligned**                                                                             |
| Connection-derived `workspaceId` + exact `vaultSecretId`      | Stated as consumption rule — **aligned in intent**; enforcement is Entry-side (see COND-IR-02)                                 |
| Educational Nest composition/DI = caller-access boundary only | Explicitly stated; DI not claimed as crypto AuthN — **aligned**                                                                |
| No external actor ingress                                     | No HTTP/DTO/job ingress proposed — **aligned**                                                                                 |
| No production-grade S2S                                       | Consistent with TOKEN-SCOPE — **aligned**                                                                                      |
| No global port export / unrelated module exposure             | Dedicated module export + Connections no re-export — **aligned in design**; Nest repository wiring underspecified (COND-IR-01) |

### 4.2 TOKEN-SCOPE — **CONSISTENT**

Educational token direction retained; ADP tokens not used as Vault AuthZ proof; no production S2S infrastructure introduced by the Draft.

### 4.3 Existing Full-D authorization — **PRESERVED**

- Approved IA remains sole inventory authority until superseded.
- Draft correctly labels itself **PROPOSED / NOT APPROVED**.
- `KO-COND-01` remains OPEN; Stages 4–8 remain BLOCKED; port coding NOT AUTHORIZED.
- Historical Trust-Boundary findings (Nest DI ≠ authentication; port possession = capability; human ACL bypass = separate privilege) are preserved, not contradicted.

### 4.4 Classification of residual issues

| Issue                                                              | Classification                                                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Dedicated-module repository Nest wiring underspecified             | **Technical correction within ratified scope** (COND-IR-01); PO confirmation only if `SecretVaultModule` export surface must change |
| Connection-derived binding not enforceable inside port API         | **Technical correction** + acceptance tests (COND-IR-02); within PO-VAULT-B                                                         |
| Same-module injectability                                          | **ACCEPTED LIMITATION** already documented; elevate negative tests (COND-IR-03)                                                     |
| Repository test-double inventory gap                               | **Technical correction** (COND-IR-04)                                                                                               |
| AC #7 vs absent catalog code for `connection.environment-backfill` | **Technical correction / clarification** (COND-IR-05); not a PO option change                                                       |
| Symbol name freeze                                                 | **PO confirmation at IA approval** (COND-IR-06) — cosmetic                                                                          |
| Null/blank `vaultSecretId` pre-call guard                          | **Technical correction** (COND-IR-07)                                                                                               |

No issue requires unilaterally replacing PO-VAULT-B with another option.

---

## 5. Contract review

### 5.1 Proposed contract

`FivConn04DVaultMetadataPort.lookupExact({ workspaceId, vaultSecretId })` → success metadata `{ id, workspaceId, purpose, state }` or fail reasons `NOT_FOUND` | `UNAVAILABLE` | `INVALID`.

### 5.2 Field table (independent)

| Field                     | Source                                                                | Actual consumer                                                                                                                      | Required            | Review finding                                                  |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------- |
| `id`                      | `VaultSecret.id` (`schema.prisma`); Connection opaque `vaultSecretId` | `classifyFivConn04AConnection` exact match `vaultMeta.id !== vaultSecretId` → dangling/non-exact (`fiv-conn-04-a-classification.ts`) | **Yes**             | **Necessary.** Without `id`, exact-id binding cannot be proven. |
| `workspaceId`             | `VaultSecret.workspaceId`                                             | Classifier: `vaultMeta.workspaceId !== connection.workspaceId`                                                                       | **Yes**             | **Necessary.** Isolation check.                                 |
| `purpose`                 | `VaultSecret.purpose`                                                 | LIVE-class / `tradingEnvironmentFromPurpose` / INVALID_CREDENTIAL paths                                                              | **Yes**             | **Necessary.** Core eligibility.                                |
| `state`                   | `VaultSecret.state`                                                   | Connected required; Revoked / non-Connected blocked                                                                                  | **Yes**             | **Necessary.**                                                  |
| `type`                    | DB / `SecretVaultMetadata`                                            | **Not read** by A/C classifiers                                                                                                      | **No**              | Correctly excluded.                                             |
| `operatorLabel`           | Derived in metadata DTO                                               | **Not read**                                                                                                                         | **No**              | Correctly excluded.                                             |
| `createdAt` / `updatedAt` | DB                                                                    | **Not read**                                                                                                                         | **No**              | Correctly excluded.                                             |
| Ciphertext / plaintext    | DB columns / retrieve path                                            | **Forbidden** for this port                                                                                                          | **Must not return** | Draft exclusion **correct**.                                    |

Evidence aliases: `FivConn04AVaultMetaInput` and `FivConn04LiveVaultMetaInput` (`fiv-conn-04-a-classification.ts`, `fiv-conn-04-live-classifier.ts`) are exactly the four fields.

### 5.3 Contract questions

| #   | Question                                         | Verdict                                                                                                                         |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Does Full-D consume all four fields?             | **YES** — verified in classifiers + specs                                                                                       |
| 2   | Is each necessary for A/C logic?                 | **YES**                                                                                                                         |
| 3   | Required fields missing?                         | **NO** for classifier input                                                                                                     |
| 4   | Unnecessary returned fields?                     | **NO** in proposed view                                                                                                         |
| 5   | Expose repository entities / generic Vault DTOs? | **NO** — dedicated narrow view (proposed)                                                                                       |
| 6   | Permit arbitrary workspace queries?              | **API accepts any strings**; DB compounds `id+workspaceId`; **no list**. Binding to Connection is Entry discipline (COND-IR-02) |
| 7   | Permit arbitrary secret retrieval?               | **No decrypt/retrieve** in proposed port; metadata-only                                                                         |
| 8   | Exact-ID matching unambiguous?                   | **YES** if compound where + returned `id` checked by classifier                                                                 |
| 9   | Missing/inaccessible handled safely?             | Foreign/unknown → `NOT_FOUND` (proposed); human ACL not used — intentional under PO-VAULT-B                                     |
| 10  | Consistent with IA §7.0 intent?                  | **YES as amendment direction** — replaces `SecretVaultService.list` + filter; does not silently keep list path for D Entry      |

**Port contract verdict:** **PASS** (four-field contract is repository-grounded). Residual risk is caller-supplied identifier discipline, not field set.

---

## 6. Prisma query / data-minimization review

### 6.1 Current repository facts (**VERIFIED**)

- `SecretVaultRepository` today: `compareAndSet`, `findBySlot`, `listByWorkspaceId`, `deleteIfRevision` only (`secret-vault.repository.ts`).
- `PrismaSecretVaultRepository.findBySlot` / `listByWorkspaceId`: **no Prisma `select`** → full row including ciphertext columns mapped via `toRecord` (`prisma-secret-vault.repository.ts`).
- `VaultSecret` columns include `wrappingSalt`, `wrappedDataKey`, `dataKeyNonce`, `dataKeyTag`, `payload`, `payloadNonce`, `payloadTag` (`schema.prisma`).
- No exact-id repository API exists today.

### 6.2 Proposed path feasibility

| Check                                         | Verdict                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Exact ID + workspace at DB boundary           | **Feasible** — `id` is `@id`; `workspaceId` indexed; `findFirst`/`findUnique` with compound `where` is valid |
| No list-and-filter fallback on proposed path  | **Required** — Draft forbids list; must remain mandatory in amended IA                                       |
| No slot-based lookup substitute               | **Required** — slot uniqueness is `(workspaceId,type,purpose)`, not Connection `vaultSecretId`               |
| Narrow `select` only approved fields          | **Feasible and mandatory** — Draft correctly distinguishes DTO strip vs query projection                     |
| Ciphertext columns not selected               | **Mandatory** — AC #2                                                                                        |
| Returned object only approved fields          | **Feasible** with dedicated mapper (not `toRecord`)                                                          |
| In-memory parity                              | **Feasible** — `InMemorySecretVaultRepository` must add equivalent method                                    |
| Missing resources no cross-workspace leak     | **Feasible** if compound where collapses foreign workspace to absence                                        |
| Add method without unnecessary contract churn | **Interface extension required**; existing methods can remain unchanged                                      |

### 6.3 Important distinction

A TypeScript DTO that omits ciphertext after a **full-row** read would **not** satisfy query-level data minimization. Draft §4 correctly requires Prisma `select`. This review treats that as **mandatory**, not optional.

**Prisma data-minimization verdict:** **PASS** as proposed design; implementation not present; Nest wiring of repository into dedicated module must be specified (COND-IR-01) before IA approval.

---

## 7. Vault authorization review

### 7.1 Privilege model (independent answers)

| Question                                                     | Independent answer                                                                                                                                                                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What privilege does port possession grant?                   | Educational capability to perform **exact-id metadata-only** lookup for any `(workspaceId, vaultSecretId)` pair the caller supplies to the port method — **not** human membership/Role proof, **not** decrypt, **not** mutate     |
| What enforces workspace/secret restriction?                  | **Database compound query** (resource binding) + **Entry orchestration** (Connection-derived inputs). **Not** `VaultAccessControl`                                                                                                |
| Can caller supply arbitrary identifiers?                     | **Yes at TypeScript/port API**; Nest cannot cryptographically prevent it                                                                                                                                                          |
| How does Connection constrain identifiers?                   | Entry must load Connection and pass only `connection.workspaceId` / `connection.vaultSecretId` — **discipline + tests**, not port-enforced Connection FK check                                                                    |
| Can another provider in `ConnectionsModule` inject the port? | **YES** — Nest same-module visibility (**VERIFIED** Nest semantics; Draft ACCEPTED LIMITATION accurate)                                                                                                                           |
| Can unrelated modules inject the port?                       | **Only if** they import `FivConn04DVaultMetadataModule` or receive a re-export. Draft forbids `SecretVaultModule` / `ConnectionsModule` re-export — **correct stop condition**                                                    |
| Accidental public export?                                    | Not if inventory/export walls hold; must be tested                                                                                                                                                                                |
| Can Entry inject `SecretVaultService` / broad repository?    | **Today Nest allows** Entry to inject `SecretVaultService` because `ConnectionsModule` already imports `SecretVaultModule`. Draft forbids Entry injection of service/repository for D freshness — **discipline + tests required** |

### 7.2 Distinctions preserved

| Layer                                   | Status                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| NestJS composition boundary             | Educational caller-access wall — **not** AuthN         |
| Vault metadata privilege                | Separate from human ACL — intentional PO-VAULT-B grant |
| Connection-derived resource binding     | Entry-side mandatory                                   |
| B-04 SYSTEM_JOB business audit identity | Unchanged; **not** Vault AuthZ                         |

**Vault authorization verdict:** **PASS WITH CONDITIONS** — privilege model matches PO-VAULT-B; Authorization is educationally defined but underspecified on Nest repository wiring and Entry binding enforcement (COND-IR-01, COND-IR-02, COND-IR-03).

---

## 8. NestJS composition / export-wall review

### 8.1 Current graph (**VERIFIED**)

| Module                           | Imports / exports (relevant)                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SecretVaultModule`              | Exports **only** `SecretVaultService`; repository token **not** exported (`secret-vault.module.ts`)                                                                       |
| Importers of `SecretVaultModule` | `ConnectionsModule`, `NotificationDeliveryModule`, `AiConnectivityModule`, `ExchangeConnectivityModule`, `AppModule`                                                      |
| `ConnectionsModule`              | Imports `SecretVaultModule`; exports **only** `FivConn04APreflightService`; providers include Entry, B-04 boundary, gates, controller, services (`connections.module.ts`) |
| Entry today                      | Injects only `Conn04MigrationBoundaryService` (`fiv-conn-04-d-system-job-migration-entry.ts`)                                                                             |

### 8.2 Proposed composition

Draft §6:

- Dedicated `FivConn04DVaultMetadataModule` exports **only** the port token.
- `SecretVaultModule.exports` unchanged (must **not** add port).
- `ConnectionsModule` imports dedicated module; **does not** re-export port/Entry/B-04.
- Entry injects port; does not inject `SecretVaultService`/repository for D freshness.

### 8.3 Gap — repository acquisition (**FINDING-IR-01**)

`SECRET_VAULT_REPOSITORY` is provided inside `SecretVaultModule` and **not exported**. A dedicated metadata module **cannot** inject that provider unless:

1. It **re-provides** `PrismaSecretVaultRepository` / `SECRET_VAULT_REPOSITORY` locally (e.g. via `PrismaModule`), or
2. `SecretVaultModule` is **modified** to export a narrow repository/metadata dependency, or
3. Some other shared internal module is introduced.

Draft inventory states `secret-vault.module.ts` **NO CHANGE** but does **not** specify (1). Discovery likewise omits an explicit Nest provider graph for repository access.

This is **not** a PO-VAULT-B contradiction; it is an **incomplete composition specification** that could cause unsafe improvisation (e.g. exporting port via `SecretVaultModule`, or Entry using `SecretVaultService.list`).

**Nest export-wall verdict:** **PASS WITH CONDITIONS** — public export intent is sound; repository wiring into dedicated module is **unresolved** until COND-IR-01 closes.

---

## 9. Audit / failure review

### 9.1 Port-level audit omission

| Fact                                                     | Evidence                                                                                                                                            | Label                   |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Successful Vault `list`/`get` do not emit Security Audit | `SecretVaultService.list` returns metadata without audit write; lifecycle/access-denied are separate (`secret-vault.service.ts`, `vault-events.ts`) | **VERIFIED**            |
| Vault audit types                                        | `vault.lifecycle`, `vault.access-denied`                                                                                                            | **VERIFIED**            |
| `connection.environment-backfill` in live catalog        | **ABSENT** from `security-audit-classification.ts` CATALOG today                                                                                    | **VERIFIED**            |
| Catalog delivery authorization                           | Under existing Full-D IA / PD03-NB01 / Kickoff Stage 2 — **not** this port amendment                                                                | **VERIFIED** governance |

**Finding:** Omitting a new port-level audit event does **not** create a new forensic gap relative to current Vault **read** behavior. Business forensics remain on the ratified Full-D audit contract. Draft correctly states the port does **not** close crash-after-commit / IA-REV-03.

**Clarification required (COND-IR-05):** Draft AC #7 “`connection.environment-backfill` unchanged” must mean **governance contract preserved** (event type + SYSTEM_JOB + operation_summary), not “already present in source catalog.”

### 9.2 Failure matrix

| Failure                             | Draft treatment                     | Review                                       |
| ----------------------------------- | ----------------------------------- | -------------------------------------------- |
| Metadata not found                  | `NOT_FOUND`; no freshness success   | **PASS**                                     |
| Workspace mismatch                  | Collapsed `NOT_FOUND`               | **PASS** (isolation spirit)                  |
| Access denied (human ACL)           | N/A                                 | **PASS** under PO-VAULT-B                    |
| Repository unavailable / timeout    | `UNAVAILABLE`; fail closed          | **PASS**                                     |
| Invalid metadata                    | `INVALID`; fail closed              | **PASS**                                     |
| B-04 lease loss / write-gate denial | Existing B-04                       | **PASS**                                     |
| Audit persistence failure           | Existing §11 / IA-REV-03            | **PASS**; port must not invent false success |
| Crash after UPDATE commit           | Explicitly **not** resolved by port | **PASS** — honest                            |

Canonical SYSTEM_JOB identity (`system-job:fiv-conn-04-migration-backfill`) unchanged — **aligned**.

**Audit/failure verdict:** **PASS** (with COND-IR-05 wording clarification).

---

## 10. Denial / diagnostic review

| Proposed behavior               | Review                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Foreign workspace → `NOT_FOUND` | **Aligned** with human Vault isolation indistinguishability spirit (`VaultAccessControl` comment / `VaultIsolationError`) |
| Unknown ID → `NOT_FOUND`        | **Aligned**                                                                                                               |
| Repo failure → `UNAVAILABLE`    | Distinguishes operational failure from absence — **useful**                                                               |
| Invalid metadata → `INVALID`    | Distinguishes corrupt/incomplete projection — **useful**                                                                  |
| Full-D fails closed             | **Required**; Draft forbids treating unresolved lookup as freshness success                                               |
| No new public error contract    | **Aligned** — Entry-internal reasons                                                                                      |
| No secret values in logs        | **Required** — Draft allows category logs without secret material                                                         |

Draft does **not** conflate absence and operational failure into one code; it collapses only **authorization-shaped foreign workspace** into `NOT_FOUND` via compound query (no separate “access denied” for this educational privilege). That is consistent with PO-VAULT-B and does not harm required diagnostics **if** `UNAVAILABLE`/`INVALID` remain distinct.

**Denial/diagnostic verdict:** **PASS**

---

## 11. File inventory review

### 11.1 Draft inventory assessment

| Path                                                       | Exists / proposed     | Responsibility            | Necessary?      | Review                                                               |
| ---------------------------------------------------------- | --------------------- | ------------------------- | --------------- | -------------------------------------------------------------------- |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.port.ts`    | Proposed CREATE       | Port contract             | **Yes**         | Ownership Vault — OK                                                 |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.service.ts` | Proposed CREATE       | Port impl                 | **Yes**         | OK                                                                   |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.module.ts`  | Proposed CREATE       | Nest wall                 | **Yes**         | Must document repository providers (COND-IR-01)                      |
| `secret-vault.repository.ts`                               | Exists MODIFY         | Add exact metadata method | **Yes**         | OK                                                                   |
| `prisma-secret-vault.repository.ts`                        | Exists MODIFY         | Narrow select query       | **Yes**         | OK                                                                   |
| `in-memory-secret-vault.repository.ts`                     | Exists MODIFY         | Parity                    | **Yes**         | OK                                                                   |
| `secret-vault.module.ts`                                   | Exists NO CHANGE      | Export wall               | **Conditional** | Only valid if dedicated module self-provides repository (COND-IR-01) |
| `vault-access-control.ts`                                  | NO CHANGE             | Human ACL                 | **Yes**         | Correct                                                              |
| `secret-vault.service.ts`                                  | NO CHANGE for D Entry | Human/A paths             | **Yes**         | Correct intent                                                       |
| `connections.module.ts`                                    | MODIFY import/wire    | Composition               | **Yes**         | No re-export — OK                                                    |
| `fiv-conn-04-d-system-job-migration-entry.ts`              | MODIFY inject         | Consumer                  | **Yes**         | OK                                                                   |
| Identity / B-04 boundary                                   | NO CHANGE for Vault   | Correct                   | **Yes**         | OK                                                                   |
| Port service/module specs                                  | CREATE                | Tests                     | **Yes**         | OK                                                                   |
| Entry / export-wall specs                                  | MODIFY                | Tests                     | **Yes**         | Elevate negative injection tests (COND-IR-03)                        |

### 11.2 Missing from Draft inventory (**FINDING-IR-02**)

| Gap                                                                                                                                | Evidence                                                      | Severity                |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------- |
| `RollbackVaultRepository` / `StaleOnceRepository` in `secret-vault.lifecycle.spec.ts` implement `SecretVaultRepository` explicitly | Adding interface method breaks compile unless updated         | **Medium**              |
| Nest provider registration details for repository inside dedicated module                                                          | Not in Draft §6 / §10                                         | **High** (COND-IR-01)   |
| Explicit blank `vaultSecretId` pre-call guard in Entry inventory/AC                                                                | Classifier already handles empty id; Entry must not call port | **Medium** (COND-IR-07) |

No schema/migration change is required for the four selected columns — **correct omission**.

**File inventory verdict:** **PASS WITH CONDITIONS** — core files correct; Nest wiring + test-double updates incomplete.

---

## 12. Test coverage review

### 12.1 Proposed coverage vs architecture

| Area                                                             | Draft intent                  | Independent assessment                                                               |
| ---------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Metadata-only / no ciphertext in result                          | AC #1–2                       | **Necessary**; add assertion that Prisma call uses `select` (spy/integration)        |
| Workspace/resource isolation matrix                              | Wrong WS / wrong ID / unknown | **Necessary**                                                                        |
| Caller boundary / no global export                               | Module specs + export-wall    | **Necessary**; add **ConnectionsService/Controller do not inject port** (COND-IR-03) |
| SYSTEM_JOB / backfill / operation_summary unchanged              | AC #7                         | **Governance + Full-D tests** (catalog still absent — expected)                      |
| Failure: UNAVAILABLE / INVALID / lease / write-gate / audit fail | Matrix §8                     | **Necessary**; many already under Full-D IA inventory                                |
| No false successful freshness                                    | Explicit                      | **Necessary**                                                                        |
| Human ACL / A `list` regression                                  | AC #8                         | **Necessary**                                                                        |

### 12.2 Tests hard to enforce architecturally

| Test desire                  | Reality                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| “Only Entry can inject port” | **Not enforceable** by Nest within `ConnectionsModule` — document as ACCEPTED LIMITATION; test non-wiring of public surfaces instead |
| Cryptographic caller AuthN   | Out of TOKEN-SCOPE / PO-VAULT-B                                                                                                      |

**Test coverage verdict:** **PASS WITH CONDITIONS** — matrix direction sound; elevate same-module negative tests; add Prisma `select` evidence tests.

---

## 13. Findings by severity

### High

| ID            | Finding                                                                                                                                  | Evidence                                                                           | Required action                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| FINDING-IR-01 | Dedicated module’s acquisition of `SecretVaultRepository` / Prisma client is underspecified while claiming `SecretVaultModule` NO CHANGE | `secret-vault.module.ts` exports only `SecretVaultService`; Draft §§6,10           | Specify Nest provider graph before IA approval (COND-IR-01)                   |
| FINDING-IR-03 | Port API accepts arbitrary IDs; Connection binding is Entry-only                                                                         | Proposed `lookupExact` input type; classifier assumes caller supplied correct meta | Mandate Entry re-read Connection fields; forbid overrides; tests (COND-IR-02) |

### Medium

| ID            | Finding                                                                                  | Evidence                                                  | Required action                                                       |
| ------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| FINDING-IR-02 | Inventory omits `SecretVaultRepository` test doubles in `secret-vault.lifecycle.spec.ts` | `RollbackVaultRepository`, `StaleOnceRepository`          | Include MODIFY in inventory / acceptance (COND-IR-04)                 |
| FINDING-IR-04 | Same-module injectability accurately stated but OQ-F left optional                       | Discovery OQ-F; Nest module semantics                     | Make controller/service non-injection tests **required** (COND-IR-03) |
| FINDING-IR-05 | AC #7 wording can be misread as “catalog already contains environment-backfill”          | Catalog lacks event; Kickoff U-03 expected                | Clarify governance vs source (COND-IR-05)                             |
| FINDING-IR-06 | Blank/null `vaultSecretId` Entry pre-call guard not explicit in Draft AC                 | Classifier empty-id path; port would be meaningless/noisy | Explicit fail-closed before lookup (COND-IR-07)                       |

### Low

| ID            | Finding                                | Evidence                    | Required action                    |
| ------------- | -------------------------------------- | --------------------------- | ---------------------------------- |
| FINDING-IR-07 | Nest symbol/file spellings provisional | Draft §3.1 / Discovery OQ-E | Freeze at IA approval (COND-IR-06) |

### Non-findings (explicitly cleared)

- Four-field contract matches classifiers — **cleared**.
- Query-level minimization correctly required (not DTO-only) — **cleared**.
- No new port audit event is consistent with current Vault read audit absence — **cleared**.
- Draft does not claim to close crash-after-commit gap — **cleared**.
- PO-VAULT-B / TOKEN-SCOPE not silently replaced — **cleared**.

---

## 14. Conditions and closure evidence

### COND-IR-01 — Dedicated-module repository Nest wiring

| Attribute             | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity              | **High**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Evidence              | FINDING-IR-01; `SecretVaultModule` export wall                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Required action       | Before IA approval, Draft/successor IA text must specify exactly how `FivConn04DVaultMetadataModule` obtains repository access **without** exporting the port from `SecretVaultModule` and **without** Entry injecting `SecretVaultService` for D freshness. Acceptable pattern example: dedicated module imports `PrismaModule` and provides local `SECRET_VAULT_REPOSITORY` → `PrismaSecretVaultRepository` (Prisma wrapper duplication OK); alternative that modifies `SecretVaultModule` exports requires explicit inventory change + justification. |
| Closure evidence      | Written Nest provider graph in approved IA amendment; module spec proves unrelated SecretVault importers cannot inject port                                                                                                                                                                                                                                                                                                                                                                                                                              |
| PO approval required? | **Only if** chosen wiring changes `SecretVaultModule` public exports; otherwise **technical correction within scope**                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### COND-IR-02 — Connection-derived input binding

| Attribute             | Value                                                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity              | **High**                                                                                                                                                                                                                         |
| Evidence              | FINDING-IR-03                                                                                                                                                                                                                    |
| Required action       | Amended IA must require Entry to pass **only** Connection-loaded `workspaceId`/`vaultSecretId`; forbid caller-supplied Vault trust flags/overrides; test wrong-ID injection attempts at Entry orchestration layer where feasible |
| Closure evidence      | IA text + Entry specs                                                                                                                                                                                                            |
| PO approval required? | **No** (within PO-VAULT-B)                                                                                                                                                                                                       |

### COND-IR-03 — Same-module negative injection tests required

| Attribute             | Value                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity              | **Medium**                                                                                                                                           |
| Evidence              | FINDING-IR-04; Nest same-module visibility                                                                                                           |
| Required action       | Promote Discovery OQ-F to mandatory acceptance: `ConnectionsController` / `ConnectionsService` (and other public providers) must not inject the port |
| Closure evidence      | Failing-closed composition/export-wall specs                                                                                                         |
| PO approval required? | **No**                                                                                                                                               |

### COND-IR-04 — Repository test-double inventory

| Attribute             | Value                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity              | **Medium**                                                                                                                                                         |
| Evidence              | FINDING-IR-02                                                                                                                                                      |
| Required action       | Add `secret-vault.lifecycle.spec.ts` (and any other explicit `implements SecretVaultRepository` doubles) to MODIFY inventory or document compile-update obligation |
| Closure evidence      | Updated inventory in successor Draft/IA                                                                                                                            |
| PO approval required? | **No**                                                                                                                                                             |

### COND-IR-05 — AC #7 catalog wording

| Attribute             | Value                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Severity              | **Medium**                                                                                                                         |
| Evidence              | FINDING-IR-05; absent catalog entry                                                                                                |
| Required action       | Clarify AC #7 = preserve PD03-NB01/IA audit **contract**; catalog code delivery remains under existing Full-D IA Stage 2 inventory |
| Closure evidence      | Clarified AC text in successor package                                                                                             |
| PO approval required? | **No**                                                                                                                             |

### COND-IR-06 — Symbol freeze

| Attribute             | Value                                         |
| --------------------- | --------------------------------------------- |
| Severity              | **Low**                                       |
| Evidence              | FINDING-IR-07                                 |
| Required action       | Freeze Nest file/symbol names at IA approval  |
| Closure evidence      | Approved IA lists final names                 |
| PO approval required? | **Yes (confirmation at approval)** — cosmetic |

### COND-IR-07 — Blank vaultSecretId pre-call

| Attribute             | Value                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Severity              | **Medium**                                                                                                                           |
| Evidence              | FINDING-IR-06; classifier empty-id path                                                                                              |
| Required action       | Entry must not call `lookupExact` when `vaultSecretId` is null/blank; fail closed / classifier path without implying Vault freshness |
| Closure evidence      | IA AC + Entry tests                                                                                                                  |
| PO approval required? | **No**                                                                                                                               |

---

## 15. Overall verdict

# **PASS WITH CONDITIONS**

The refined Draft is **architecturally viable** and **consistent with ratified PO-VAULT-B / TOKEN-SCOPE / Full-D IA preservation**, and the four-field metadata contract is **independently verified** against classifier source. Approval of a successor IA amendment is **not** recommended until **COND-IR-01** through **COND-IR-05** and **COND-IR-07** are closed in the amendment text (COND-IR-06 at approval freeze).

This verdict **does not** approve the IA amendment, authorize port implementation, or close `KO-COND-01`.

---

## 16. Explicit statement — no implementation performed

No application source, tests, schema, migrations, dependencies, or configuration were created or modified by this review. Draft, Discovery, approved IA, IA ratification, PO-VAULT-B ratification, TOKEN-SCOPE decision, Kickoff Completion, Trust-Boundary review, and Decision Register were **not** edited by this review. Only this independent review document was created.

---

## 17. Governance state (unchanged)

```text
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
STAGES 4–8: BLOCKED
FULL-D IMPLEMENTATION: NOT STARTED
PORT IMPLEMENTATION: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
APPROVED IA HASH (still binding):
  fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039
IA RATIFICATION HASH (unchanged):
  9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299
PO-VAULT-B: RATIFIED (unchanged)
TOKEN-SCOPE: UNCHANGED
INDEPENDENT REVIEW (this document): COMPLETE — VERDICT PASS WITH CONDITIONS
IA AMENDMENT APPROVAL: NOT GRANTED BY THIS REVIEW
DECISION REGISTER: NOT UPDATED BY THIS REVIEW TO IMPLY APPROVAL OR GATE CLOSURE
```

---

## 18. Final verification checklist (reviewer)

| Check                                                         | Result                         |
| ------------------------------------------------------------- | ------------------------------ |
| Approved IA byte-for-byte unchanged                           | **YES** — hash `fee16e97…b039` |
| IA ratification unchanged                                     | **YES** — hash `9f0561b6…b299` |
| PO ratification unchanged                                     | **YES** — hash `7417ad7c…a7df` |
| Draft unchanged                                               | **YES** — hash `8704ca79…daa8` |
| Discovery unchanged                                           | **YES** — hash `1717edf7…c451` |
| No source/test/schema/migration/deps/config changes by review | **YES**                        |
| No implementation started                                     | **YES**                        |
| Pre-existing dirty/untracked preserved                        | **YES**                        |
| `KO-COND-01` remains OPEN                                     | **YES**                        |
| Stages 4–8 remain BLOCKED                                     | **YES**                        |
| FIV-CONN-04-E unauthorized                                    | **YES**                        |
| Production activation unauthorized                            | **YES**                        |
| Nothing staged / committed / pushed by this review            | **YES**                        |

---

_End of independent review — await separate Product Owner instruction. Do not amend Draft, approve IA, close KO-COND-01, or begin implementation based on this document alone._
