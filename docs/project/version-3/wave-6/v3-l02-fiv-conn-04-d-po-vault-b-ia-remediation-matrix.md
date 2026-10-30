# FIV-CONN-04-D — PO-VAULT-B IA Amendment Remediation Matrix (COND-IR-01…07)

```text
DOCUMENTATION REMEDIATION EVIDENCE ONLY
DOES NOT APPROVE THE IA AMENDMENT
DOES NOT AUTHORIZE IMPLEMENTATION
DOES NOT CLOSE KO-COND-01
DOES NOT REWRITE THE HISTORICAL INDEPENDENT REVIEW
DOES NOT MODIFY APPROVED IA / RATIFICATIONS / DECISION REGISTER
```

**Document:** Finding-remediation evidence matrix for independent-review conditions COND-IR-01…07.  
**Date:** 2026-10-30  
**Binding review:** `v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-independent-review.md`  
**Review verdict (historical, unchanged):** `PASS WITH CONDITIONS`  
**Review SHA-256 (verified this remediation):** `5656a68c6d47a84f4057abb6bbb3510333c818b7045311e943080dc342789031`  
**Companions:** updated Discovery + updated IA Amendment Draft (this package).

**Closure labels used here** mean documentation remediation only — **not** independent re-verification closure and **not** IA approval.

---

## 1. Baseline (this remediation)

| Field                             | Value                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Branch                            | `main`                                                                             |
| HEAD                              | `953292675e197d4f25778aaaa59eacb2826560fe`                                         |
| Approved IA                       | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` (**unchanged**) |
| IA ratification                   | `9f0561b63467618737c1b59b2950d2577f3cfd738b45fa6ae71f32f6b72bb299` (**unchanged**) |
| PO-VAULT-B ratification           | `7417ad7cd33df0325a1c4366c34da677f0128ca08906914fd65727099c7ca7df` (**unchanged**) |
| Prior Draft (pre-remediation)     | `8704ca79616ac43c2ce2e57064d521e2876c32b08a072998d261b2132c82daa8`                 |
| Prior Discovery (pre-remediation) | `1717edf75d641a40f9716e9eaaf69cd4eca09dad920235ffc7b35e6f35fcc451`                 |

---

## 2. Consolidated matrix

| Finding    | Severity | Original issue                                                                                               | Remediation                                                                                                                                                                                                                                                                                                                                                       | Evidence                                                                                                                                                                                                                                                               | Closure status                                                                                                          | Remaining risk                                                                                                                                                                                   |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| COND-IR-01 | High     | Dedicated metadata module repository Nest wiring underspecified while claiming `SecretVaultModule` NO CHANGE | **Option A selected:** `FivConn04DVaultMetadataModule` imports `PrismaModule`, provides **module-private** `SECRET_VAULT_REPOSITORY` → `PrismaSecretVaultRepository`, implements port; exports **only** port token. `SecretVaultModule` truly unchanged. Option C rejected (repository token not exported). Option B deferred (would change SecretVault exports). | `secret-vault.module.ts` exports only `SecretVaultService`; `SECRET_VAULT_REPOSITORY` not exported (`secret-vault.repository.token.ts`); `PrismaModule` exports `PrismaService`; Discovery §15.1; Draft §6                                                             | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | Dual Prisma repository wrapper instances (dedicated module + SecretVaultModule) share `PrismaService` — acceptable; tests must override dedicated-module repository provider when using InMemory |
| COND-IR-02 | High     | Port accepts arbitrary IDs; Connection binding Entry-side only                                               | Entry must load trusted Connection from B-04/backfill processing context; derive both ids from **same** Connection row; validate before port call; forbid HTTP/DTO/job/actor overrides; forbid cross-Connection mixing                                                                                                                                            | Entry today: `fiv-conn-04-d-system-job-migration-entry.ts` (lease only); Connection fields: `connections.service.ts` `ConnectionRow` / Prisma `Connection`; classifiers: `fiv-conn-04-a-classification.ts`; IA §7.0 freshness intent; Draft §5 / §5.1; Discovery §15.2 | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | Educational Nest same-module providers could still call port with arbitrary ids if wired — mitigated by COND-IR-03 tests, not crypto                                                             |
| COND-IR-03 | Medium   | Same-module injectability; OQ-F optional                                                                     | Document ACCEPTED LIMITATION; elevate mandatory negative composition tests (controller/public services/export walls/Entry no SecretVaultService)                                                                                                                                                                                                                  | Nest semantics + `connections.module.ts` provider list; Draft §6.3 / §12; Discovery §15.3                                                                                                                                                                              | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | Tests cannot prove universal Nest exclusivity — only current provider wiring                                                                                                                     |
| COND-IR-04 | Medium   | Inventory omitted `RollbackVaultRepository` / `StaleOnceRepository`                                          | Both implement `SecretVaultRepository` in `secret-vault.lifecycle.spec.ts`; **MODIFY** to forward new metadata method to InMemory delegate (compile + parity); not production path                                                                                                                                                                                | `secret-vault.lifecycle.spec.ts` L42–132; Draft §10; Discovery §15.4                                                                                                                                                                                                   | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | None material if forwarding implemented                                                                                                                                                          |
| COND-IR-05 | Medium   | Draft AC #7 “environment-backfill unchanged” ambiguous vs absent catalog                                     | Clarify: AC #7 = **governance contract** (event type + SYSTEM_JOB + operation_summary) preserved; catalog code still **absent** and remains Full-D Stage 2 under existing IA; no new event; no claim of current catalog presence                                                                                                                                  | `security-audit-classification.ts` CATALOG lacks event (**VERIFIED**); PD03-NB01 ratification; Kickoff U-03; Draft §8.1 / AC #7; Discovery §15.5                                                                                                                       | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | None — wording clarified; no PO option change                                                                                                                                                    |
| COND-IR-06 | Low      | Symbol/file names provisional                                                                                | Proposed freeze table marked `PROPOSED — PENDING PO CONFIRMATION AT IA APPROVAL`                                                                                                                                                                                                                                                                                  | Draft §13; Discovery §15.6                                                                                                                                                                                                                                             | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION** (cosmetic freeze still needs **PO confirmation at IA approval**) | Names may change cosmetically at approval                                                                                                                                                        |
| COND-IR-07 | Medium   | Blank `vaultSecretId` pre-call guard                                                                         | Entry validates workspaceId + vaultSecretId; blank/missing → fail closed **without** port/repo call; align with classifier AMBIGUOUS / no UPDATE / no false summary                                                                                                                                                                                               | Classifier empty-id → AMBIGUOUS (`fiv-conn-04-a-classification.ts`); Draft §5.2 / AC; Discovery §15.7                                                                                                                                                                  | **CLOSED IN DRAFT — PENDING INDEPENDENT VERIFICATION**                                                                  | None if Entry tests assert zero invocations                                                                                                                                                      |

---

## 3. Option analysis summary (COND-IR-01)

| Option                                               | Feasible? | SecretVaultModule change?               | Broad Vault exposure?                                                         | Disposition                                                      |
| ---------------------------------------------------- | --------- | --------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **A — Dedicated module-private repository provider** | **YES**   | **NO**                                  | Port only exported; repository token not exported from dedicated module       | **SELECTED**                                                     |
| B — Vault module exports narrow metadata capability  | YES       | YES (exports change)                    | Narrower than SecretVaultService but expands SecretVaultModule public surface | **Not selected** — unnecessary if A works                        |
| C — Reuse existing internal repository DI path       | **NO**    | Would require export to become feasible | N/A                                                                           | **Rejected** — `SECRET_VAULT_REPOSITORY` is module-private today |

---

## 4. Remaining PO decisions

| ID           | Decision                                                                                | Blocks remediation docs? | Blocks IA approval?                                       |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| PO-FREEZE-01 | Confirm symbol/file freeze table (COND-IR-06)                                           | No                       | Cosmetic at approval                                      |
| PO-DEC-1…4   | Prior draft resolutions (no port audit; four fields; narrow select; NOT_FOUND collapse) | No                       | PO may override at IA approval                            |
| Separate     | Approve successor IA + re-hash + re-ratify                                              | N/A                      | **Yes** — required before coding                          |
| Separate     | Close KO-COND-01                                                                        | N/A                      | After amended IA + independent verification + closure act |

**No High finding remains OPEN pending PO architecture change.** COND-IR-01 resolved within PO-VAULT-B via Option A.

---

## 5. Remaining technical blockers

| Item                                                    | Status                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Nest Option A composition                               | **Specified** — not implemented                                                                 |
| Port / Entry coding                                     | **NOT AUTHORIZED**                                                                              |
| Catalog admission of `connection.environment-backfill`  | Authorized under existing Full-D IA Stage 2 — **not this port package**; still absent in source |
| Stages 4–8                                              | **BLOCKED** on KO-COND-01                                                                       |
| Independent re-verification of this remediation package | **PENDING** (separate act)                                                                      |

---

## 6. Independent review readiness

This remediation package is **ready for a second independent review** of the updated Draft + Discovery + this matrix.

It is **not** itself a second independent review, IA approval, or KO-COND-01 closure.

---

## 7. Governance state (unchanged)

```text
KO-COND-01: OPEN
STAGES 4–8: BLOCKED
FULL-D IMPLEMENTATION: NOT STARTED
PORT IMPLEMENTATION: NOT AUTHORIZED
FIV-CONN-04-E: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
APPROVED IA HASH: fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039
HISTORICAL INDEPENDENT REVIEW VERDICT: PASS WITH CONDITIONS (unchanged)
```

---

_End of remediation matrix._
