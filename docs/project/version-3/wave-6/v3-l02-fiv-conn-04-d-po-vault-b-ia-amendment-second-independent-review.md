# FIV-CONN-04-D — Second Independent Review: PO-VAULT-B IA Amendment Remediation

```text
SECOND INDEPENDENT TECHNICAL + GOVERNANCE REVIEW ONLY
DOES NOT APPROVE THE IA AMENDMENT
DOES NOT AUTHORIZE IMPLEMENTATION
DOES NOT CLOSE KO-COND-01
DOES NOT MODIFY APPROVED IA / RATIFICATIONS / DECISION REGISTER / REMEDIATION ARTIFACTS
DOES NOT STAGE, COMMIT, OR PUSH
```

**Document:** Second independent review of the remediated Full-D IA Amendment Draft, Discovery, and Remediation Matrix under `D-CONN04-PO-VAULT-B`.  
**Date:** 2026-10-30  
**Reviewer role:** Independent reviewer (not author of Draft / Discovery / Remediation Matrix).  
**Overall verdict:** **PASS WITH CONDITIONS**

**Historical first review (unchanged artifact):**  
`v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-independent-review.md`  
SHA-256 `5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031` — verdict `PASS WITH CONDITIONS`.

This review **re-verifies** remediation claims against repository architecture. It does **not** rewrite the historical review.

---

## 1. Review purpose and scope

### 1.1 Purpose

Independently determine whether the remediation package adequately resolves COND-IR-01…07 such that the Draft is safe for Product Owner IA-approval consideration — without authorizing implementation or closing governance gates.

### 1.2 Reviewed artifacts (current bytes)

| Artifact           | Path                                                                                  | SHA-256 (this review)                                              | Matches expected? |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- |
| IA Amendment Draft | `.../v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-draft.md` | `b4153e2a6384fea1ac86ae13a9d447bded4fc5a171fe367f376b9d3175507cdd` | **YES**           |
| Discovery          | `.../v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-discovery.md`                       | `e288db898fcca91ccc055885f77710d194646183e316221f5b4331dfc1dfd556` | **YES**           |
| Remediation Matrix | `.../v3-l02-fiv-conn-04-d-po-vault-b-ia-remediation-matrix.md`                        | `69869d16d0b7c38fe49e9f5dc7788ec603bcabcae7f28cd6c94dd20af09213d0` | **YES**           |

**Path note:** Task text referenced `...-ia-amendment-remediation-matrix.md`. Actual repository file is `...-ia-remediation-matrix.md`. Hash matches the expected remediation-matrix digest.

### 1.3 Governance cross-checks

| Artifact                            | SHA-256                                                            | Status              |
| ----------------------------------- | ------------------------------------------------------------------ | ------------------- |
| Approved Full-D IA                  | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` | Unchanged / binding |
| Full-D IA ratification              | `9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299` | Unchanged           |
| PO-VAULT-B ratification             | `7417ad7cd33df0325a1c4366c34da677f0128ca08906914fd65727099c7ca7df` | Unchanged           |
| Historical first independent review | `5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031` | Unchanged           |

Also inspected (content, not re-hashed for binding): Kickoff Completion, Stage 1 Vault Entry Design, Decision Register entries for PO-VAULT-B / TOKEN-SCOPE / PD03-NB01 / Full-D IA.

### 1.4 Independence

Draft / Discovery / Matrix claims were challenged against Nest module declarations, Prisma schema, repository interface/implementations, classifiers, Entry source, Connections module exports, and Security Audit catalog. Remediation matrix conclusions were **not** accepted at face value.

---

## 2. Repository branch and HEAD

| Field                                                  | Value                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Branch                                                 | `main`                                                                    |
| HEAD                                                   | `953292675e197d4f25778aaaa59eacb2826560fe`                                |
| Pre-existing dirty/untracked                           | **Preserved** (unchanged by this review except creation of this document) |
| Application source/tests modified by this review       | **NO**                                                                    |
| Reviewed remediation artifacts modified by this review | **NO**                                                                    |

---

## 3. Repository / source files inspected

| Area                                            | Paths / symbols                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Nest Vault module                               | `secret-vault.module.ts`, `secret-vault.repository.token.ts`                        |
| Prisma DI                                       | `storage/prisma/prisma.module.ts` (`PrismaService`, `@Global`, exports)             |
| Prisma Vault repo                               | `prisma-secret-vault.repository.ts` (`toRecord`, `findBySlot`, `listByWorkspaceId`) |
| Repository interface                            | `secret-vault.repository.ts`                                                        |
| In-memory repo                                  | `in-memory-secret-vault.repository.ts`                                              |
| Lifecycle doubles                               | `secret-vault.lifecycle.spec.ts` (`RollbackVaultRepository`, `StaleOnceRepository`) |
| Grep for all `implements SecretVaultRepository` | Prisma, InMemory, Rollback, StaleOnce only                                          |
| Schema                                          | `schema.prisma` `VaultSecret`, `Connection` (`vaultSecretId`, `workspaceId`)        |
| Classifiers                                     | `fiv-conn-04-a-classification.ts`, `fiv-conn-04-live-classifier.ts`                 |
| Entry                                           | `fiv-conn-04-d-system-job-migration-entry.ts`                                       |
| Connections module                              | `connections.module.ts`                                                             |
| Vault ACL / events                              | `vault-access-control.ts`, `vault-events.ts`                                        |
| Audit catalog                                   | `security-audit-classification.ts` (absence of `connection.environment-backfill`)   |
| SecretVaultService list path                    | `secret-vault.service.ts` (authorize + list; no success audit on list)              |

---

## 4. Independent technical findings (summary)

1. **Option A Nest wiring is feasible** under actual module visibility: `PrismaModule` exports `PrismaService`; `PrismaSecretVaultRepository` constructs from `PrismaClient`; `SECRET_VAULT_REPOSITORY` is **not** exported from `SecretVaultModule`, so a dedicated module-private provider is the correct Option A path.
2. **Four-field metadata contract matches live classifier inputs** (`FivConn04AVaultMetaInput`).
3. **Compound exact-id + workspace query with narrow `select` is schema-feasible** (`VaultSecret.id` is `@id`; columns exist). Current `list`/`findBySlot` paths load full rows — confirming why the dedicated method is required.
4. **Same-module injectability remains real**; Draft correctly treats it as ACCEPTED LIMITATION, not Entry-only Nest enforcement.
5. **Repository implementor inventory is complete** for TypeScript interface compliance (four implementors).
6. **AC #7 clarification is accurate** relative to absent catalog vs ratified contract.
7. **Symbol freeze still requires explicit PO confirmation** at IA approval — therefore overall verdict cannot be unconditional `PASS`.
8. **No new material architecture/security blocker** found that would force `BLOCKED` or replace PO-VAULT-B.

---

## 5. Assessment of each COND-IR finding

| Finding    | Previous severity | Independent verdict                         | Evidence                                                                                                                                                                                                                                       | Remaining condition                                                       |
| ---------- | ----------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| COND-IR-01 | High              | **RESOLVED IN DRAFT**                       | Option A provider graph valid vs `prisma.module.ts` / `secret-vault.module.ts`; dual thin `PrismaSecretVaultRepository` wrappers share `PrismaService` — acceptable; repository token not exported; no cycle with Connections→dedicated→Prisma | Carry Option A text into approved IA; implement exactly (when authorized) |
| COND-IR-02 | High              | **RESOLVED IN DRAFT**                       | Draft §5.1 mandatory Connection-same-row derivation; Entry today has no HTTP/DTO Vault inputs (`fiv-conn-04-d-system-job-migration-entry.ts`); Connection fields on Prisma/`ConnectionRow`                                                     | Implementation + binding tests when coding authorized                     |
| COND-IR-03 | Medium            | **RESOLVED IN DRAFT (limitation retained)** | Nest exports can wall off unrelated modules; **cannot** make port Entry-only inside `ConnectionsModule`; Draft §6.3 / §12.4 honest                                                                                                             | Keep ACCEPTED LIMITATION + mandatory negative tests in approved IA        |
| COND-IR-04 | Medium            | **RESOLVED IN DRAFT**                       | Only four `implements SecretVaultRepository`; lifecycle doubles correctly inventoried for MODIFY/forward                                                                                                                                       | Compile-time update of doubles at implementation                          |
| COND-IR-05 | Medium            | **RESOLVED IN DRAFT**                       | Catalog lacks event (**VERIFIED**); PD03-NB01/IA contract preserved; Stage 2 scope unchanged; no new event                                                                                                                                     | None for wording                                                          |
| COND-IR-06 | Low               | **CONDITIONALLY RESOLVED**                  | Draft §13 freeze table internally consistent with §§3–10 naming                                                                                                                                                                                | **PO confirmation of freeze table at IA approval** (mandatory)            |
| COND-IR-07 | Medium            | **RESOLVED IN DRAFT**                       | Draft §5.2 zero port/repo calls; aligns with classifier empty-id → `AMBIGUOUS`                                                                                                                                                                 | Implementation + zero-invocation tests when coding authorized             |

---

## 6. NestJS module / provider visibility analysis (COND-IR-01 / 03)

### 6.1 Option A feasibility checklist

| Question                                                                          | Independent answer                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does `PrismaModule` export what `PrismaSecretVaultRepository` needs?              | **YES** — exports `PrismaService` (`PrismaService extends PrismaClient`). Module is `@Global()`, so `PrismaService` is broadly available; Draft still correctly `imports: [PrismaModule]` for explicit dependency.                                                                                         |
| Can dedicated module instantiate repository without changing `SecretVaultModule`? | **YES** — duplicate the existing factory pattern locally; do not export `SECRET_VAULT_REPOSITORY`.                                                                                                                                                                                                         |
| Second repository implementation / duplicate behavior?                            | **Two Nest provider instances** of the same class wrapping the **same** `PrismaService` / DB. Not a second persistence store. Acceptable residual for educational Option A. InMemory tests must override the **dedicated module’s** provider.                                                              |
| Bypass repository invariants / txn conventions / Vault ownership?                 | **No material bypass identified** for a read-only metadata method outside write txn (matches IA freshness “outside write txn”). Must use dedicated mapper (**not** `toRecord` / `assertCiphertextOnlyPersist` full-row path) — Draft §4.1 requires this. Module remains Vault-owned under `secret-vault/`. |
| Provider graph valid under Nest visibility?                                       | **YES** if dedicated module exports **only** the port token and Connections imports that module without re-export.                                                                                                                                                                                         |
| Circular dependencies?                                                            | **None** in proposed graph: dedicated → Prisma; Connections → dedicated + existing SecretVault; SecretVault → Prisma.                                                                                                                                                                                      |
| Consistent with existing architecture?                                            | **YES** — mirrors how `SecretVaultModule` already constructs `PrismaSecretVaultRepository`; avoids expanding `SecretVaultModule.exports`.                                                                                                                                                                  |

### 6.2 Enforcement vs convention

| Restriction                                                             | Enforcement class                                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unrelated modules cannot inject port without importing dedicated module | **Nest module visibility** (if export walls hold)                                                          |
| `SecretVaultModule` / `ConnectionsModule` do not re-export port         | **Nest exports** + regression tests                                                                        |
| Entry does not inject `SecretVaultService` for D freshness              | **Governance + tests** — Nest still allows service injection today via existing `SecretVaultModule` import |
| Entry-only exclusive injection inside `ConnectionsModule`               | **Cannot be guaranteed by Nest** — ACCEPTED LIMITATION                                                     |
| Connection-derived ids                                                  | **Governance + Entry code + tests** — not port-enforced FK                                                 |

**Do not claim the port is technically Entry-only.** Draft does not make that false claim.

---

## 7. Repository query and metadata minimization analysis

### 7.1 Metadata contract `{ id, workspaceId, purpose, state }`

| Check                                                              | Result                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Sufficient for A/C classifiers?                                    | **YES** — all four consumed (`fiv-conn-04-a-classification.ts`; live alias) |
| Ciphertext / plaintext excluded?                                   | **YES** in proposed view                                                    |
| Unrelated metadata (`type`, timestamps, `operatorLabel`) excluded? | **YES**                                                                     |

### 7.2 Exact-ID query

| Rejected pattern                      | Draft position            | Review                                                |
| ------------------------------------- | ------------------------- | ----------------------------------------------------- |
| List-all + memory filter              | Forbidden                 | **Correct** — current `listByWorkspaceId` is full-row |
| `SecretVaultService.list` + `meta.id` | Replaced for D Entry      | **Correct** amendment direction                       |
| Slot `findBySlot` / `get`             | Forbidden for D freshness | **Correct** — slot ≠ Connection `vaultSecretId`       |
| Full-row load then strip              | Forbidden                 | **Correct** — query-level `select` required           |

**Feasibility:** `findFirst`/`findUnique`-style `where: { id, workspaceId }` + `select: { id, workspaceId, purpose, state }` is valid on `VaultSecret`.

**In-memory parity:** Feasible by filtering stored `SecretVaultRecord` values by `id` + `workspaceId` (store is slot-keyed; records still carry `id`). Draft acknowledges this.

---

## 8. Vault authorization, audit, and failure behavior

| Claim                                                                 | Independent assessment                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Nest DI = educational caller-access only                              | **Accurate** and consistent with PO-VAULT-B                    |
| Not cryptographic AuthN / Entry identity proof                        | **Accurate**                                                   |
| ADP / educational tokens ≠ Vault AuthZ                                | **Accurate** (TOKEN-SCOPE)                                     |
| Port = separate metadata-only privilege (bypasses human ACL)          | **Accurate** — intentional under PO-VAULT-B                    |
| No production S2S claimed                                             | **Accurate**                                                   |
| Business audit remains `connection.environment-backfill` + SYSTEM_JOB | **Accurate** as governance contract; catalog code still absent |
| No new port audit event                                               | **Consistent** with unaudited successful `list`/`get` today    |
| Fail-closed; no false success summary                                 | **Specified** in Draft §§7–8                                   |
| Crash-after-commit / IA-REV-03 not closed by port                     | **Honestly stated**                                            |

---

## 9. Test coverage assessment

Proposed matrix (Draft §12) is **adequate as a specification** for:

- metadata minimization / Prisma `select` evidence;
- isolation matrix;
- Connection-derived binding + blank-ID **zero invocation** spies;
- export-wall + same-module negative wiring tests (with stated Nest limitations);
- SYSTEM_JOB / no new port event / fail-closed regressions.

**Limitation:** Tests are **not implemented** (correct under documentation-only remediation). Coverage claims remain **PROPOSED** until coding is authorized. Negative Nest tests can assert **current** provider graphs; they cannot prove future contributors never inject the port inside `ConnectionsModule`.

---

## 10. Technical enforcement vs governance convention (explicit)

| Control                              | Technical Nest/DB enforcement      | Governance / convention / tests |
| ------------------------------------ | ---------------------------------- | ------------------------------- |
| Port not globally available          | Export walls                       | Stop conditions + module specs  |
| Metadata-only / no ciphertext select | Prisma `select` (when implemented) | IA ACs                          |
| Workspace+id compound match          | DB `where`                         | —                               |
| Connection-derived inputs            | **Not** in port                    | Entry rules + unit tests        |
| Blank-ID no I/O                      | **Not** automatic                  | Entry guard + spies             |
| No Entry `SecretVaultService` for D  | **Not** Nest-enforced today        | Forbidden + negative tests      |
| Entry-only within ConnectionsModule  | **Impossible** without refactor    | ACCEPTED LIMITATION             |
| SYSTEM_JOB attribution               | Audit helpers (Full-D Stage 2+)    | IA / PD03-NB01                  |

---

## 11. Newly discovered issues / limitations

| ID        | Severity         | Issue                                                                                            | Blocks amendment approval?                      |
| --------- | ---------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| SIR2-N-01 | Info             | Remediation matrix filename differs from task alias; hash still matches                          | **No**                                          |
| SIR2-N-02 | Low              | Dual `PrismaSecretVaultRepository` Nest instances (Option A residual) — must be handled in tests | **No** if documented (already is)               |
| SIR2-N-03 | Low              | `PrismaModule` is `@Global()` — dedicated module import is still good practice; not a defect     | **No**                                          |
| SIR2-N-04 | Medium (process) | Symbol freeze + Option A confirmation still require PO at IA approval                            | **Yes as condition** — not a technical redesign |

No newly discovered **BLOCKED**-class architecture or security defect.

---

## 12. Overall verdict

# **PASS WITH CONDITIONS**

The remediation package **independently verifies** as a technically viable, PO-VAULT-B-consistent design. Prior High/Medium technical gaps (Nest wiring underspecification, Connection binding, blank-ID guards, test-double inventory, AC #7 wording, same-module honesty) are **adequately resolved in the Draft**.

Unconditional `PASS` is **not** issued because:

1. **COND-IR-06** still requires **explicit PO confirmation** of the symbol/file freeze at IA approval.
2. Draft §14 still lists PO confirmations (including Option A) as approval-time acts.
3. Same-module Nest limitation remains an **accepted residual risk** that must stay explicit in any approved IA text.

This verdict **does not** approve the IA amendment, authorize port/Full-D coding, or close `KO-COND-01`.

---

## 13. Conditions and required next actions

### SIR2-COND-01 — PO confirm symbol/file freeze (from COND-IR-06)

| Attribute        | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Severity         | Low (process)                                                              |
| Required action  | At IA approval, PO confirms Draft §13 names or records approved alternates |
| Closure evidence | Approved IA text with frozen names                                         |
| Blocks coding?   | Names must be frozen in approved IA before coding                          |

### SIR2-COND-02 — PO confirm Nest Option A (+ remaining draft decisions 1–4, AC #7 reading)

| Attribute        | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Severity         | Process / governance                                                                                                     |
| Required action  | PO confirms Option A (`SecretVaultModule` unchanged) or explicitly selects Option B with export-surface inventory change |
| Closure evidence | Approval/ratification text                                                                                               |

### SIR2-COND-03 — Preserve ACCEPTED LIMITATION in approved IA

| Attribute        | Value                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Severity         | Medium (honesty)                                                                          |
| Required action  | Approved IA must retain same-module injectability limitation and mandatory negative tests |
| Closure evidence | Approved IA §§ composition / ACs                                                          |

### Separate governance acts (not performed by this review)

1. Approve successor Full-D IA amendment text → re-hash → re-ratify.
2. Separate act to close `KO-COND-01` after amendment + review disposition.
3. Only then authorize Stages 4–8 / port implementation per amended inventory.

**Recommended next governance action:** Product Owner IA-approval review of the remediated Draft (with SIR2-COND-01/02 confirmations), followed by independent hash binding — **not** immediate implementation.

---

## 14. Explicit confirmation — no implementation or source changes

This review created **only** this document. It did **not**:

- modify application source, tests, schema, migrations, dependencies, or configuration;
- modify the Draft, Discovery, Remediation Matrix, historical first review, approved IA, IA ratification, PO-VAULT-B ratification, TOKEN-SCOPE decision, Kickoff Completion, or Decision Register;
- stage, commit, or push;
- start Full-D / port implementation or execute backfill.

---

## 15. Governance state (unchanged)

```text
KO-COND-01: OPEN
STAGES 4–8: BLOCKED
FULL-D IMPLEMENTATION: NOT STARTED
PORT IMPLEMENTATION: NOT AUTHORIZED
CONNECTION ENVIRONMENT UPDATE / FULL-D BACKFILL: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION / LIVE CAPITAL / FIV PASS: NOT AUTHORIZED
APPROVED IA HASH (still binding):
  fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039
SECOND INDEPENDENT REVIEW VERDICT: PASS WITH CONDITIONS
IA AMENDMENT APPROVAL: NOT GRANTED BY THIS REVIEW
```

---

_End of second independent review. Await separate Product Owner instruction for IA approval or other governance acts._
