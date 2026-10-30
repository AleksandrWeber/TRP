# FIV-CONN-04-D — PO-VAULT-B IA Amendment Discovery Report (Remediated)

```text
DISCOVERY + DRAFT SUPPORT ONLY — REMEDIATED FOR COND-IR-01…07
DOES NOT AMEND THE APPROVED FULL-D IA
DOES NOT AUTHORIZE IMPLEMENTATION
DOES NOT CLOSE KO-COND-01
DOES NOT UPDATE GOVERNANCE GATES
DOES NOT REWRITE THE HISTORICAL INDEPENDENT REVIEW VERDICT

Binding: D-CONN04-PO-VAULT-B (RATIFIED — PO-VAULT-B)
Binding: D-CONN04-TOKEN-SCOPE (educational token scope)
Approved IA SHA-256: fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039 (UNCHANGED)
Historical independent review: PASS WITH CONDITIONS
  SHA-256 5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031 (UNCHANGED ARTIFACT)
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
```

**Document:** Evidence-based discovery supporting the remediated Full-D IA amendment draft for the dedicated internal Vault metadata port.  
**Date:** 2026-10-30 (remediated after independent review)  
**Nature:** **DOCUMENTATION / DISCOVERY ONLY.** Companion to [`v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-draft.md`](./v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-draft.md) and [`v3-l02-fiv-conn-04-d-po-vault-b-ia-remediation-matrix.md`](./v3-l02-fiv-conn-04-d-po-vault-b-ia-remediation-matrix.md). Does **not** modify application source, tests, schema, approved IA, IA ratification, Kickoff, Decision Register, or the historical independent review artifact. Does **not** stage, commit, or push. Authoring is **not** independent review.

**Evidence labels:** **VERIFIED** | **INFERRED** | **PROPOSED** | **RESOLVED** | **ACCEPTED LIMITATION** | **OPEN** | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

**Historical note:** An independent review recorded `PASS WITH CONDITIONS` (COND-IR-01…07). This remediation package addresses those conditions in documentation. It does **not** erase or rewrite that review’s findings/verdict text.

---

## 1. Repository baseline (**VERIFIED** this remediation)

| Field                                  | Value                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Branch                                 | `main`                                                                             |
| HEAD                                   | `953292675e197d4f25778aaaa59eacb2826560fe`                                         |
| Approved IA hash                       | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`                 |
| IA ratification hash                   | `9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299`                 |
| PO-VAULT-B ratification                | `7417ad7cd33df0325a1c4366c34da677f0128ca08906914fd65727099c7ca7df`                 |
| Historical independent review          | `5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031` (**unchanged**) |
| Prior draft hash (pre-remediation)     | `8704ca79616ac43c2ce2e57064d521e2876c32b08a072998d261b2132c82daa8`                 |
| Prior discovery hash (pre-remediation) | `1717edf75d641a40f9716e9eaaf69cd4eca09dad920235ffc7b35e6f35fcc451`                 |
| Working tree                           | Pre-existing dirty/untracked **preserved**; documentation remediation only         |

---

## 2. Architecture re-verification (Vault)

| Finding                                                        | Evidence                                                                                   | Label        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------ |
| `SecretVaultModule` exports only `SecretVaultService`          | `secret-vault.module.ts`                                                                   | **VERIFIED** |
| Importers include Connections, Notification, AI, Exchange, App | module imports                                                                             | **VERIFIED** |
| `list` / `get` / mutate always `authorize` → human ACL         | `secret-vault.service.ts`                                                                  | **VERIFIED** |
| Successful `list` / `get` **do not** emit Security Audit       | `list` returns metadata only; audit only via lifecycle / access-denied                     | **VERIFIED** |
| Vault audit events                                             | `vault.lifecycle`, `vault.access-denied` in `vault-events.ts` + catalog                    | **VERIFIED** |
| `listByWorkspaceId` / `findBySlot` load full rows (ciphertext) | `prisma-secret-vault.repository.ts` — no `select`                                          | **VERIFIED** |
| No exact-id repository API                                     | Interface has slot + list only                                                             | **VERIFIED** |
| `SecretVaultMetadata` fields                                   | `id`, `workspaceId`, `type`, `purpose`, `state`, `operatorLabel`, `createdAt`, `updatedAt` | **VERIFIED** |
| `operatorLabel` derived from `state`                           | `toOperatorLabel` in `toSecretVaultMetadata`                                               | **VERIFIED** |

---

## 3. Architecture re-verification (Connections / Full-D)

| Finding                                                             | Evidence                                                                                                   | Label        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ |
| Entry injects only `Conn04MigrationBoundaryService` today           | `fiv-conn-04-d-system-job-migration-entry.ts`                                                              | **VERIFIED** |
| `ConnectionsModule` exports only `FivConn04APreflightService`       | `connections.module.ts`                                                                                    | **VERIFIED** |
| Entry / B-04 / gate tokens not exported                             | Same                                                                                                       | **VERIFIED** |
| `workspaceId` / `vaultSecretId` on `ConnectionRecord`               | `schema.prisma`                                                                                            | **VERIFIED** |
| Classifier vault input                                              | `FivConn04AVaultMetaInput` = `{ id, workspaceId, purpose, state }`                                         | **VERIFIED** |
| Classifier uses all four fields                                     | `fiv-conn-04-a-classification.ts` (id match, workspace match, state Connected/Revoked, purpose LIVE-class) | **VERIFIED** |
| Live classifier reuses same vault meta type                         | `FivConn04LiveVaultMetaInput` alias                                                                        | **VERIFIED** |
| Does **not** read `type`, `operatorLabel`, `createdAt`, `updatedAt` | Grep of classifiers                                                                                        | **VERIFIED** |

---

## 4. Decision 1 — Port-level audit events — **RESOLVED**

### 4.1 Evidence

| Question                                        | Finding                                                                                        | Label                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| Are Vault metadata **reads** audited today?     | **No.** `list`/`get` do not call `recordVaultLifecycle` or emit classified read events         | **VERIFIED**            |
| What Vault audits exist?                        | Lifecycle create/replace/revoke/delete; human ACL **access-denied**                            | **VERIFIED**            |
| Would the port bypass a mandatory read-audit?   | **No** — successful metadata reads are not mandatorily audited today                           | **VERIFIED**            |
| Does B-04 backfill audit cover the business op? | Yes — binding `connection.environment-backfill` per-row + `operation_summary` (IA / PD03-NB01) | **VERIFIED** governance |

### 4.2 Conclusion (**RESOLVED**)

**Prefer no new port-level Security Audit event type.**

Rationale:

1. Adding a port read/deny event would invent audit semantics beyond current Vault read behavior.
2. Business forensics for Full-D remain on `connection.environment-backfill` with canonical SYSTEM_JOB attribution.
3. A second event risks duplicate/misleading “Vault access” narratives and catalog expansion requiring separate PO approval (closed catalog pattern).
4. Port must not create a second business identity or replace B-04 audits.
5. Existing crash-after-commit / IA-REV-03 audit limitations are **not** solved by a port event.

**Internal diagnostics:** structured logger warnings for deny/unavailable categories are allowed (no secret material; no new catalog event) — **PROPOSED**.

**If future compliance requires Vault technical access auditing:** separate PO decision + catalog admission — **OPEN** (out of this amendment).

---

## 5. Decision 2 — Minimal metadata contract — **RESOLVED**

### 5.1 Field analysis

| Field                        | In `SecretVaultMetadata` / DB | Used by Full-D classifiers                | Required?     | Reason                      |
| ---------------------------- | ----------------------------- | ----------------------------------------- | ------------- | --------------------------- |
| `id`                         | Yes                           | Yes — exact match vs `vaultSecretId`      | **Yes**       | Exact-id proof              |
| `workspaceId`                | Yes                           | Yes — must equal Connection workspace     | **Yes**       | Isolation                   |
| `purpose`                    | Yes                           | Yes — LIVE-class / env-from-purpose       | **Yes**       | Eligibility                 |
| `state`                      | Yes                           | Yes — Connected required; Revoked blocked | **Yes**       | Eligibility                 |
| `type`                       | Yes                           | **No**                                    | **No**        | Not read by A/C classifiers |
| `operatorLabel`              | Derived                       | **No**                                    | **No**        | Derived; unused by Full-D   |
| `createdAt` / `updatedAt`    | Yes                           | **No**                                    | **No**        | Unused by Full-D            |
| Ciphertext / payload columns | Yes in DB                     | **No**                                    | **Forbidden** | Secret material             |

### 5.2 Recommended contract (**PROPOSED** / ready for IA draft)

```ts
lookupExact({ workspaceId, vaultSecretId })
  → { ok: true, metadata: { id, workspaceId, purpose, state } }
  | { ok: false, reason: 'NOT_FOUND' | 'UNAVAILABLE' | 'INVALID' }
```

Aligns 1:1 with existing `FivConn04AVaultMetaInput` / `FivConn04LiveVaultMetaInput` (**VERIFIED**).

---

## 6. Decision 3 — Repository-level data minimization — **RESOLVED**

### 6.1 Recommendation

**Dedicated exact-ID query with narrow Prisma `select`:**

```text
findFirst / findUnique equivalent:
  where: { id: vaultSecretId, workspaceId: workspaceId }
  select: { id, workspaceId, purpose, state }
```

Do **not** select: `type`, timestamps (unless later required), or any of `wrappingSalt`, `wrappedDataKey`, `dataKeyNonce`, `dataKeyTag`, `payload`, `payloadNonce`, `payloadTag`.

Do **not** use `listByWorkspaceId` + memory filter.  
Do **not** use slot `findBySlot`.  
Do **not** reuse `toRecord` / `assertCiphertextOnlyPersist` for this path — use a metadata-only mapper.

### 6.2 In-memory repository parity (**PROPOSED**)

| Requirement                  | Spec                                                 |
| ---------------------------- | ---------------------------------------------------- |
| Exact id + workspace         | Return projection or empty                           |
| Wrong workspace / unknown id | Empty / not found (same as Prisma)                   |
| Return shape                 | Only `{ id, workspaceId, purpose, state }`           |
| Must not                     | Expose ciphertext fields; broader list API for Entry |

### 6.3 Residual limitation

None identified that blocks narrow `select` on current Prisma model (**VERIFIED** columns exist). If implementation discovers a mapper/assert coupling forcing full-row load, that is a **blocker** requiring escalation — not silent acceptance.

### 6.4 Required tests (specify only)

1. Exact id + correct workspace → minimal metadata.
2. Exact id + wrong workspace → no result.
3. Unknown id → no result.
4. Returned object keys ⊆ approved set.
5. Prisma args include narrow `select`.
6. Select excludes cipher columns.
7. In-memory and Prisma agree on semantics.

---

## 7. Decision 4 — Denial behavior & diagnostics — **RESOLVED**

### 7.1 Boundaries

| Boundary                 | Behavior                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Port → Entry result      | Discriminated result; fail-closed categories                                                        |
| Entry → business outcome | Never treat missing/inaccessible metadata as freshness proof; never UPDATE env on unresolved lookup |
| Public / external API    | No new public error contract; Entry remains non-HTTP                                                |
| Internal logs            | May distinguish categories without secret/cross-tenant disclosure                                   |
| Security Audit           | No new port event (Decision 1); B-04 events unchanged                                               |

### 7.2 Recommended port reasons

| Condition                                             | Port `reason` | Notes                                                                                              |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| No row for `(id, workspaceId)`                        | `NOT_FOUND`   | Includes “id exists elsewhere” **collapsed** into not found at query boundary (id+workspace where) |
| Repo/Prisma/timeout/mapping failure                   | `UNAVAILABLE` | Transient / infra                                                                                  |
| Projection fails integrity (e.g. blank purpose/state) | `INVALID`     | Data inconsistency                                                                                 |

**Cross-workspace:** Enforced by compound `where`; a secret in another workspace yields **no row** → `NOT_FOUND` (same as missing). Do **not** return a distinct external “wrong workspace” that would confirm foreign secret existence beyond Connection’s own ids.

**“Access denied” as separate from human ACL:** This port does not call `VaultAccessControl`. Educational privilege is Nest composition + exact query. Unauthorized Nest acquisition is a composition/test concern, not a port result code.

### 7.3 Alignment with existing conventions

Human Vault ACL uses indistinguishable `VaultIsolationError` for foreign vs role deny (**VERIFIED**). Collapsing foreign-id into `NOT_FOUND` at the exact `(id, workspaceId)` query is consistent with that spirit.

---

## 8. NestJS composition & export-wall verification

### 8.1 Required walls (**PROPOSED**)

| Rule                                 | Spec                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| Dedicated module                     | `FivConn04DVaultMetadataModule` exports **only** the port            |
| Not on `SecretVaultModule.exports`   | Prevents Notification/AI/Exchange injection                          |
| Imported only by `ConnectionsModule` | Caller-access boundary                                               |
| Connections public exports           | Remain **only** `FivConn04APreflightService`                         |
| Entry                                | Injects port; **does not** inject `SecretVaultService` or repository |

### 8.2 Same-module limitation (**ACCEPTED LIMITATION**)

Importing the metadata module into `ConnectionsModule` makes the port injectable by **any** provider in that module (e.g. `ConnectionsService`, A preflight, Entry), not Entry alone.

Nest module boundaries **cannot** enforce Entry-only exclusivity without a larger refactor (not in scope).

**Accepted educational architectural limitation** under PO-VAULT-B: bounded internal composition (Connections module graph), **not** cryptographic Entry-only authentication. Mitigations: do not re-export; do not inject into Controllers/public services; **mandatory** negative composition tests (COND-IR-03 — see §15.3); document that other Connections providers **could** inject it.

### 8.3 Repository DI visibility (**VERIFIED** — COND-IR-01 basis)

| Fact                                                             | Evidence                             | Label                                           |
| ---------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| `SECRET_VAULT_REPOSITORY` provided inside `SecretVaultModule`    | `secret-vault.module.ts` providers   | **VERIFIED**                                    |
| `SECRET_VAULT_REPOSITORY` **not** exported                       | `exports: [SecretVaultService]` only | **VERIFIED**                                    |
| `PrismaModule` exports `PrismaService`                           | `prisma.module.ts`                   | **VERIFIED**                                    |
| Unrelated modules importing `SecretVaultModule` get service only | Notification/AI/Exchange/App imports | **VERIFIED**                                    |
| Option C (reuse exported repository path)                        | No exported repository token exists  | **Infeasible without SecretVaultModule change** |

**Selected design (Option A) — PROPOSED:** dedicated module imports `PrismaModule`, registers **module-private** `SECRET_VAULT_REPOSITORY` → `PrismaSecretVaultRepository`, implements port, exports port only. `SecretVaultModule` **NO CHANGE**. Full analysis in §15.1.

---

## 9. Failure / audit matrix (refined)

| Failure                         | Port behavior                | Entry behavior                                     | Operation result                          |
| ------------------------------- | ---------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Metadata missing                | `NOT_FOUND`                  | No freshness proof; classify/block/skip per matrix | No env UPDATE as “fresh Connected”        |
| Workspace mismatch (foreign id) | `NOT_FOUND` (compound where) | Same                                               | No UPDATE                                 |
| Human ACL N/A                   | —                            | Port does not use human ACL                        | —                                         |
| Unauthorized Nest use           | Composition tests            | Must not wire port to public surfaces              | Out of Entry happy path                   |
| Repository unavailable          | `UNAVAILABLE`                | Fail closed / abort freshness                      | No false success summary                  |
| Timeout                         | `UNAVAILABLE`                | Same                                               | Same                                      |
| Invalid metadata                | `INVALID`                    | Fail closed                                        | Same                                      |
| B-04 lease lost                 | N/A                          | Existing B-04                                      | Existing                                  |
| Write-gate denied               | N/A                          | Existing B-04                                      | Existing                                  |
| Audit persistence failure       | N/A                          | Existing §11.2                                     | Existing; port does not fix IA-REV-03 gap |

**SYSTEM_JOB attribution unchanged. No second audit architecture.**

---

## 10. Exact proposed file inventory (remediated)

| File                                                            | Status       | Change                                                                                         | Owner       | Export impact                    |
| --------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- | ----------- | -------------------------------- |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.port.ts`         | New          | CREATE                                                                                         | Vault       | Via dedicated module only        |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.service.ts`      | New          | CREATE                                                                                         | Vault       | None                             |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.module.ts`       | New          | CREATE — Option A private repo provider + export port only                                     | Vault       | Export port only                 |
| `.../secret-vault/secret-vault.repository.ts`                   | Exists       | MODIFY — `findMetadataByIdAndWorkspaceId`                                                      | Vault       | Not exported                     |
| `.../secret-vault/prisma-secret-vault.repository.ts`            | Exists       | MODIFY — narrow select query                                                                   | Vault       | Not exported                     |
| `.../secret-vault/in-memory-secret-vault.repository.ts`         | Exists       | MODIFY — parity                                                                                | Vault       | —                                |
| `.../secret-vault/secret-vault.lifecycle.spec.ts`               | Exists       | **MODIFY** — `RollbackVaultRepository` + `StaleOnceRepository` forward new method (COND-IR-04) | Vault       | Test-only                        |
| `.../secret-vault/secret-vault.module.ts`                       | Exists       | **NO CHANGE** (do not export port/repository)                                                  | Vault       | Unchanged                        |
| `.../secret-vault/vault-access-control.ts`                      | Exists       | **NO CHANGE**                                                                                  | Vault       | —                                |
| `.../secret-vault/secret-vault.service.ts`                      | Exists       | **NO CHANGE** for D Entry                                                                      | Vault       | Still exported for human/A paths |
| `.../connections/connections.module.ts`                         | Exists       | MODIFY — import metadata module; Entry wiring; no re-export                                    | Connections | Public exports unchanged         |
| `.../connections/fiv-conn-04-d-system-job-migration-entry.ts`   | Exists       | MODIFY — inject port; Connection-derived binding + blank guards                                | Connections | Still not exported               |
| `.../connections/fiv-conn-04-d-system-job-identity.ts`          | Exists       | NO CHANGE                                                                                      | Connections | —                                |
| `.../connections/conn04-migration-boundary.service.ts`          | Exists       | NO CHANGE for Vault                                                                            | Connections | —                                |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` | New          | CREATE                                                                                         | Vault       | —                                |
| `.../secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts`  | New          | CREATE                                                                                         | Vault       | —                                |
| Extend Entry / export-wall / binding specs                      | Exists / new | MODIFY / CREATE                                                                                | Connections | —                                |

---

## 11. Conflict with approved IA

| Topic                                   | Conflict?                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| §7.0 `SecretVaultService.list` + filter | **Yes** — draft proposes replacement call-site/AuthZ; requires approved amendment |
| §11 audit / SYSTEM_JOB                  | **No** — preserved                                                                |
| Exclusions (E, production, Stages 4–8)  | **No** — preserved                                                                |
| Inventory without new Vault files       | **Yes** — port/module/repo method absent from ratified inventory                  |

---

## 12. Remaining unresolved / optional PO confirmations

| ID                | Item                                                                | Status                                                                            |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| OQ-A              | Confirm Decision 1 (no port audit event)                            | **RESOLVED in draft**; PO may override at IA approval                             |
| OQ-B              | Confirm minimal four-field contract                                 | **RESOLVED in draft**                                                             |
| OQ-C              | Confirm narrow select query                                         | **RESOLVED in draft**                                                             |
| OQ-D              | Confirm NOT_FOUND collapse for foreign workspace                    | **RESOLVED in draft**                                                             |
| OQ-E / COND-IR-06 | Exact Nest file/symbol spellings                                    | Freeze table in Draft §13 — **PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL** |
| OQ-F / COND-IR-03 | ConnectionsService/Controller must be tested to **not** inject port | Elevated to **mandatory** acceptance tests in Draft §12.4                         |
| PO-OPT-A          | Confirm Nest Option A (`SecretVaultModule` unchanged)               | **PROPOSED** in Draft §6; PO may select Option B explicitly                       |

No High technical blocker requiring a different PO-VAULT option. Educational Nest same-module limitation remains **ACCEPTED LIMITATION**.

---

## 13. Independent review readiness (post-remediation)

A **repeat** independent reviewer can assess without reconstructing chat history by reading:

1. This discovery (including §15 remediation evidence).
2. Remediated IA amendment draft.
3. Remediation matrix.
4. Historical independent review (unchanged artifact — prior verdict context).
5. PO-VAULT-B + TOKEN-SCOPE ratifications.
6. Ratified IA §7.0 / §11 (for conflict surface).
7. Cited source files.

**Authoring of these docs is not an independent review. Repeat independent review is not completed by this remediation.**

Checklist for repeat independent reviewer:

- [ ] COND-IR-01 Option A Nest wiring exact and feasible
- [ ] COND-IR-02 Connection-derived binding mandatory
- [ ] COND-IR-03 same-module limitation + negative tests accurate
- [ ] COND-IR-04 test-double inventory complete
- [ ] COND-IR-05 AC #7 catalog wording clarified
- [ ] COND-IR-06 freeze table present
- [ ] COND-IR-07 blank-ID pre-call guard + zero-invocation tests
- [ ] PO-VAULT-B / TOKEN-SCOPE compliance
- [ ] No broader Vault capability / no new audit subsystem / no prod S2S
- [ ] Approved IA hash unchanged until separate approval

---

## 14. Governance state (unchanged)

```text
Approved IA hash: UNCHANGED
IA ratification: UNCHANGED
D-CONN04-PO-VAULT-B: RATIFIED (strategy)
D-CONN04-TOKEN-SCOPE: DECIDED — EDUCATIONAL SCOPE
Historical independent review artifact: UNCHANGED (PASS WITH CONDITIONS)
KO-COND-01: OPEN — PENDING FULL-D IA INVENTORY AMENDMENT, INDEPENDENT REVIEW, AND SEPARATE CLOSURE ACT
Stages 4–8: BLOCKED
Port implementation: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
Production activation: NOT AUTHORIZED
Decision Register: not updated by this remediation to imply gate changes
```

---

## 15. Remediation of independent-review COND-IR-01…07

**Context:** Historical independent review (`v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-independent-review.md`, SHA-256 `5656a68c…9031`) recorded **PASS WITH CONDITIONS**. Findings below are remediated in documentation only. Closure status = documentation readiness for **repeat** independent verification — **not** IA approval.

### 15.1 COND-IR-01 — Dedicated module repository wiring (**HIGH**)

#### Verified repository facts

| Fact                                                                         | Path / symbol                                  | Label        |
| ---------------------------------------------------------------------------- | ---------------------------------------------- | ------------ |
| `SecretVaultModule` exports only `SecretVaultService`                        | `secret-vault.module.ts`                       | **VERIFIED** |
| `SECRET_VAULT_REPOSITORY` factory uses `PrismaSecretVaultRepository(prisma)` | Same                                           | **VERIFIED** |
| Repository token not in exports                                              | Same + `secret-vault.repository.token.ts`      | **VERIFIED** |
| `PrismaModule` exports `PrismaService`                                       | `apps/api/src/storage/prisma/prisma.module.ts` | **VERIFIED** |
| Connections already imports `SecretVaultModule`                              | `connections.module.ts`                        | **VERIFIED** |
| No exact-id metadata repository method today                                 | `secret-vault.repository.ts`                   | **VERIFIED** |

#### Option analysis

| Option                                                         | Nest visibility                                                                                            | SecretVaultModule change?               | Broad exposure?                                                           | Within PO-VAULT-B?       | Disposition                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------- |
| **A — Dedicated module-private repository provider**           | Dedicated module imports `PrismaModule`; provides private `SECRET_VAULT_REPOSITORY`; exports **only** port | **NO**                                  | Port only to importers of dedicated module; repository token not exported | **YES**                  | **SELECTED — PROPOSED**                         |
| B — Vault-owned module exports narrow metadata repo capability | Would add export(s) on Vault module                                                                        | **YES**                                 | Narrower than service but expands Vault public surface                    | YES if carefully bounded | Not selected (unnecessary if A works)           |
| C — Reuse existing internal composition path                   | No exported repository path exists                                                                         | Would require export to become feasible | N/A                                                                       | N/A                      | **Rejected — infeasible without module change** |

#### Recommended wiring (Option A) — **PROPOSED**

1. **Owner of metadata repository provider:** `FivConn04DVaultMetadataModule` (module-private).
2. **Owner of public metadata port:** same module (sole export).
3. **Imports:** `[PrismaModule]`.
4. **Exports:** `[FIV_CONN_04_D_VAULT_METADATA_PORT]` only.
5. **DI:** port token → `FivConn04DVaultMetadataService` → `@Inject(SECRET_VAULT_REPOSITORY)` → `findMetadataByIdAndWorkspaceId`.
6. **`SecretVaultModule` changes:** **NONE**.
7. **Entry injects:** port only (intended).
8. **Entry must not inject:** `SecretVaultService` / repository for D freshness (Nest may still _allow_ service via existing import — forbidden by amendment + tests).
9. **Unrelated modules:** cannot inject port unless they import dedicated module or receive forbidden re-export.

**Residual risk:** two `PrismaSecretVaultRepository` wrapper instances sharing `PrismaService` — acceptable for Prisma; InMemory tests override dedicated-module provider.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.2 COND-IR-02 — Connection-derived resource binding (**HIGH**)

#### Verified facts

| Fact                                                              | Evidence                                                       | Label                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| Entry today = B-04 lease mediation only                           | `fiv-conn-04-d-system-job-migration-entry.ts`                  | **VERIFIED**            |
| Connection row has `workspaceId`, `vaultSecretId: string \| null` | `connections.service.ts` `ConnectionRow`; Prisma Connection    | **VERIFIED**            |
| Classifier empty `vaultSecretId` → AMBIGUOUS                      | `fiv-conn-04-a-classification.ts`                              | **VERIFIED**            |
| Classifier requires meta.id === vaultSecretId and workspace match | Same                                                           | **VERIFIED**            |
| No public D HTTP ingress on Entry                                 | Entry unexported; Connections controller does not expose Entry | **VERIFIED**            |
| Full-D freshness intended outside write txn before C              | Approved IA §7.0 / IMPL-REV-D-06                               | **VERIFIED** governance |

#### Proposed Entry rules (**PROPOSED**)

Trusted Connection from B-04/backfill context → derive both ids from **same** row → validate → `lookupExact` → never HTTP/DTO/job/actor overrides → never cross-Connection mixing → preserve gates.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.3 COND-IR-03 — Same-module negative injection tests (**MEDIUM**)

| Statement                                                                                   | Label                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------- |
| Port available to any ConnectionsModule provider after import                               | **ACCEPTED LIMITATION** / Nest fact |
| Nest does not guarantee Entry-only injection                                                | **VERIFIED** semantics              |
| Port possession = educational capability, not crypto AuthN                                  | **ACCEPTED** under PO-VAULT-B       |
| Mandatory negative tests (controller/service/export walls/Entry no SecretVaultService/repo) | **PROPOSED** Draft §12.4            |
| Tests cannot enforce universal future exclusivity                                           | **ACCEPTED LIMITATION**             |

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.4 COND-IR-04 — Repository test-double inventory (**MEDIUM**)

| Double                    | Path                                                               | Models                                      | Implements interface? | Needed for new method? | Disposition                                                         |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------- | --------------------- | ---------------------- | ------------------------------------------------------------------- |
| `RollbackVaultRepository` | `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts` | CAS reject + snapshot restore over InMemory | **YES**               | **YES** (compile)      | **MODIFY** — forward `findMetadataByIdAndWorkspaceId` to `delegate` |
| `StaleOnceRepository`     | Same file                                                          | Stale-once CAS over InMemory                | **YES**               | **YES** (compile)      | **MODIFY** — forward to `delegate`                                  |

Neither is a production metadata path. They are **related** to the interface change (not “unrelated — no change”). Do not add unrelated production behavior.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.5 COND-IR-05 — Draft AC #7 catalog wording (**MEDIUM**)

**Clarification:** “AC #7” means **Draft acceptance criterion #7**, not a numeric id inside `security-audit-classification.ts`.

| Layer                 | Fact                                                                                              | Label                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Current catalog       | No `connection.environment-backfill` key in CATALOG                                               | **VERIFIED** (`security-audit-classification.ts`) |
| Ratified contract     | PD03-NB01 Option B event type + Full-D IA audit semantics                                         | **VERIFIED** governance                           |
| Catalog code delivery | Existing Full-D Stage 2 inventory; Kickoff recorded absence as expected                           | **VERIFIED**                                      |
| This amendment        | Preserves contract; adds **no** port event; does **not** claim catalog already contains the event | **PROPOSED** wording                              |

No PO clarification required beyond confirming this reading at IA approval. No premature catalog modification.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.6 COND-IR-06 — Symbol / file-name freeze (**LOW**)

Proposed freeze table in remediated Draft §13. All rows marked `PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL`. No source files created.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION** (cosmetic PO confirmation still required at IA approval)

### 15.7 COND-IR-07 — Blank `vaultSecretId` pre-call guard (**MEDIUM**)

| Step                                    | Behavior                                                                                                   | Label        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ |
| Obtain trusted Connection               | Entry backfill context                                                                                     | **PROPOSED** |
| Extract `workspaceId` + `vaultSecretId` | Same row only                                                                                              | **PROPOSED** |
| Validate both (trim; non-empty)         | Fail closed if missing/blank                                                                               | **PROPOSED** |
| On failure                              | **Do not** call port; **do not** Prisma/repo metadata query; no fresh UPDATE; no false `operation_summary` | **PROPOSED** |
| Align with classifier                   | Empty vault id → AMBIGUOUS path already exists                                                             | **VERIFIED** |
| Tests                                   | Spy/assert **zero** port invocations and **zero** repository metadata calls                                | **PROPOSED** |
| Public error contract                   | None new                                                                                                   | **PROPOSED** |

Equivalent validation applies to blank `workspaceId`.

**Status:** **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**

### 15.8 Conditions requiring independent verification

All seven COND-IR items above are documented as **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**. None remain **OPEN — TECHNICAL BLOCKER** or **OPEN — PENDING PO DECISION** for architecture replacement of PO-VAULT-B. Remaining PO actions are confirmation/freeze/approval acts — not new Vault AuthZ option selection.

---

_End of remediated discovery report._
