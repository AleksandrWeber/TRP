# FIV-CONN-04-D — Stage 4 Invocation Readiness: Environment Contract Research

```text
RESEARCH ONLY
ARTIFACT: RPT-CONN04-S4-INVOKE-ENV-2026-11-08
ENVIRONMENT = RESEARCHED / NOT SELECTED
THIS FILE DOES NOT READ OPERATIONAL SECRETS
THIS FILE DOES NOT READ DATABASE_URL OR VAULT_WRAPPING_KEY
THIS FILE DOES NOT INVOKE THE CLASSIFIER, THE CALLER, OR THE ORCHESTRATOR
THIS FILE DOES NOT EXECUTE STAGE 4
THIS FILE DOES NOT APPROVE INVOCATION
THIS FILE DOES NOT ESTABLISH D-CONN04-FULL-D-IA-S4-EXEC
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Read-only research of the environment contract required by the accepted Stage 4 classifier and Caller  
**Artifact ID:** `RPT-CONN04-S4-INVOKE-ENV-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-ENTRY-COHORT-ENV-DESIGN`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **RESEARCHED / NOT SELECTED**  
**Nature:** **RESEARCH ONLY.** Source was read. Process environment values were not read. The classifier was not invoked.

Research does not grant implementation authorization or Stage 4 execution authorization.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**.

Three different uses of the word "environment" appear in the repository. This report keeps them separate. Mixing them is a forbidden shortcut.

---

## 1. Baseline

The baseline in `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08` §1 holds. Worktree bytes of the files cited here match the execution subject where that path exists in commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`. Caller SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe`. Orchestrator SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50`. Classifier file `apps/api/src/modules/connections/fiv-conn-04-live-classifier.ts` SHA-256 `5d0232a5ba7ac1e31daba51fa8874d8fbc93b7a7694e0c8a7faeaa92d93447c7`. `OQ-S4-02` remains **OPEN**.

No `.env` file was opened. `verifyConfigurationValidity` was not called against the process.

---

## 2. Facts

### 2.1 What the accepted Caller, M1, and classifier read

**VERIFIED REPOSITORY FACT.** `invokeClassifyLiveConnectionAttempts` and `orchestrateClassifyLiveConnectionAttemptsOnce` do not read `process.env`, `process.argv`, `DATABASE_URL`, or `VAULT_WRAPPING_KEY`. Their sources contain none of those tokens. M1 has no environment parameter. The M1 spec forbids `process.env` in the implementation file (`fiv-conn-04-d-stage-4-one-shot-orchestrator.spec.ts` 108–109).

**VERIFIED REPOSITORY FACT.** `classifyFivConn04LiveConnection` is a pure function (`fiv-conn-04-live-classifier.ts` 175–188). It delegates to `classifyFivConn04AConnection`. Neither function reads process environment. The file header says no database I/O and no Vault I/O.

The pure classifier consumes three inputs:

| Input        | Source if a real Entry later runs                                 | Contract                                                                                                                       |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `connection` | The explicit array                                                | Includes column `environment: string \| null`                                                                                  |
| `vaultMeta`  | `lookupExact` metadata view `{ id, workspaceId, purpose, state }` | Purpose is mapped by `tradingEnvironmentFromPurpose`                                                                           |
| `occupancy`  | `projectFivConn04DLiveSlotOccupancy`                              | `verified_vacant`, `occupied`, or `unavailable`. `unavailable` returns `BLOCKED_OCCUPANCY_UNAVAILABLE` before the A classifier |

### 2.2 Three environment layers

**VERIFIED REPOSITORY FACT.**

| Layer                | Where defined                                                                                                                                                                                | What Stage 4 code does with it                                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Process / deployment | `apps/api/prisma/schema.prisma` 5–8: `url = env("DATABASE_URL")`. `PrismaService` extends `PrismaClient` with no constructor override (`prisma.module.ts` 6–14)                              | Used only if a live `PrismaService` is later constructed. The Caller does not construct one                                                                                                                                                                                   |
| Connection column    | `ConnectionRecord.environment` schema 192–205. Comment: `live` or `testnet`, nullable until backfill. DEMO is deferred for Connections. The column is not Vault purpose                      | `classifyFivConn04AConnection` returns `ALREADY_POPULATED` for EXCHANGE when the column is non-null (classification file 192–194). Occupancy returns before a query when the column is non-null (occupancy file 55–56)                                                        |
| Vault purpose class  | `tradingEnvironmentFromPurpose` in `trading-credential-environment.ts` 41–54. `trading` and `trading_live` map to `live`. `trading_testnet` maps to `testnet`. `trading_demo` maps to `demo` | For a null column and EXCHANGE, the A classifier admits only the live class (`fiv-conn-04-a-classification.ts` 252–284). `testnet` and `demo` become `NON_LIVE_PURPOSE`. A non-trading purpose becomes `INVALID_CREDENTIAL` when `tradingEnvironmentFromPurpose` returns null |

**TECHNICAL INFERENCE.** The column and the purpose class can disagree. The classifier does not treat the column as a substitute for purpose, and it does not treat purpose as a substitute for `DATABASE_URL`. A later design that copies one into another would change the accepted contract.

### 2.3 Access boundaries and validation that exist today

**VERIFIED REPOSITORY FACT.**

| Boundary                  | Observed behavior                                                                                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata port             | `findMetadataByIdAndWorkspaceId` selects `id`, `workspaceId`, `purpose`, `state` only. Invalid purpose or state becomes `INVALID`. A thrown repository error becomes `UNAVAILABLE`. Blank ids return `INVALID` before the repository call (`fiv-conn-04-d-vault-metadata.service.ts` 33–71) |
| `SecretVaultService.list` | Authorizes, then `listByWorkspaceId` uses `findMany` without `select` (`prisma-secret-vault.repository.ts` 181–185). The model includes `payload`, nonces, tags, and wrapped key columns (schema 72–87). The service then maps through `metadataFrom`. That map is not the Stage 4 lookup   |
| Wrapping key              | `SecretVaultModule` builds `VAULT_WRAPPING_KEY_SOURCE` from config and states that a missing key does not fail module boot (`secret-vault.module.ts` 21 and 36–39). `retrieve` decrypts. `lookupExact` does not call `retrieve`                                                             |
| Configuration check       | `verifyConfigurationValidity` (`apps/api/src/modules/health/configuration-validity.ts` 13–39) appends an issue when `DATABASE_URL` is unset. It returns a result. It does not throw. Production `NODE_ENV` adds JWT checks. It is not referenced by the Caller, M1, or the classifier       |
| Prisma lifecycle          | `$connect` runs on module init. `$disconnect` runs on destroy. A failed connect is a Nest init failure, not a Stage 4 `BATCH_ABORT`, because the call has not started                                                                                                                       |
| Write path                | Classification sets `environmentUpdated: false`. `proveWriteAuthority` is a different method and opens a transaction. Stage 5 environment UPDATE is outside Stage 4                                                                                                                         |

**VERIFIED REPOSITORY FACT.** This research did not read `DATABASE_URL`, `VAULT_WRAPPING_KEY`, ciphertext, or plaintext. It did not call `verifyConfigurationValidity(process.env)`.

### 2.4 Fail-closed behavior already on the classification path

**VERIFIED REPOSITORY FACT.** Once a real method call is inside `classifyOneLiveConnectionAttempt`, failures become batch results rather than a process-environment decision:

| Condition                                             | Closed behavior                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Blank connection identifiers                          | `BATCH_ABORT` / `BLANK_IDENTIFIER`, zero repository I/O for that attempt |
| Lookup `NOT_FOUND`                                    | `ROW_SKIP`, continue                                                     |
| Lookup `UNAVAILABLE` or `INVALID`                     | `BATCH_ABORT`                                                            |
| Occupancy exception                                   | `unavailable`, then `BATCH_ABORT` / `OCCUPANCY_UNAVAILABLE`              |
| Occupancy `unavailable` passed to the pure classifier | `BLOCKED_OCCUPANCY_UNAVAILABLE`, `eligibleLive: false`                   |
| Missing Entry or non-array at M1                      | Throw before the Caller. Zero classification calls                       |

**TECHNICAL INFERENCE.** Those closures do not answer which database was intended. A live Prisma client that connects to an unnamed URL would still fail closed on read errors, and it would also classify the wrong store if the URL is simply the wrong one. Absence of an error is not proof of the intended target.

### 2.5 Testability

**VERIFIED REPOSITORY FACT.** The Caller spec and the M1 spec pass doubles and do not construct `PrismaClient`. The consumer-loop spec stubs `lookupExact` and `connectionRecord.findFirst`. `verifyConfigurationValidity` accepts an `env` argument, so a future test can pass a fixture object. That fixture test is not an operational secret read. No such new test is added by this research.

---

## 3. Missing inputs and ambiguity

| Gap                                                          | Why it blocks a run                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No named database target                                     | `PrismaClient` reads `DATABASE_URL` from the schema `env()` call. The Caller has nowhere to pass a target                                                                                                                                                                                                                          |
| No decision that `verifyConfigurationValidity` gates Stage 4 | The check is report-only and is not on the call path                                                                                                                                                                                                                                                                               |
| `NODE_ENV` is unspecified for Stage 4                        | The validity helper treats production differently for JWT only. Stage 4 classification does not read `NODE_ENV`                                                                                                                                                                                                                    |
| Wrapping key versus metadata path                            | The metadata module does not inject the wrapping-key source. A full `AppModule` boot still constructs `SecretVaultModule`, which does. Whether a future runner may boot the full application is not decided                                                                                                                        |
| Column versus purpose versus process                         | Three layers. No selected layer is "the" Stage 4 environment                                                                                                                                                                                                                                                                       |
| `OQ-S4-02`                                                   | The operative implementation act left the VMP-1 Git baseline question **NOT ESTABLISHED**. Later records keep it **OPEN**. The subject parent is the VMP-1 commit `e6b839e0e7d75322d9626162712fa81f61147d18`, and that commit is recorded as **NOT PUBLISHED**. An open attribution question is not a selected runtime environment |

---

## 4. Candidate provision strategies

No strategy is selected.

| ID  | Strategy                                                                                                                                                                                                               | Security consequence                                                                                                                                                               | Test consequence                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| N0  | Do not provision a process environment                                                                                                                                                                                 | No URL is read and no client connects                                                                                                                                              | Current unit specs already run this way                                                                   |
| N1  | Test doubles only. No `PrismaClient`                                                                                                                                                                                   | No secret and no ciphertext column is selected                                                                                                                                     | Proves control flow. Does not prove a database target                                                     |
| N2  | A later authorized runner passes an explicit non-secret descriptor, refuses to continue when `verifyConfigurationValidity` reports `DATABASE_URL` unset, constructs Prisma only outside M1, and uses the metadata port | The URL and wrapping key stay out of evidence. Evidence names the descriptor, not the URL. `lookupExact` stays on `METADATA_SELECT`. `vault.list` and `retrieve` stay off the path | A fixture env can exercise the refusal without a live secret. A live run remains a separate authorization |
| N3  | Boot `AppModule` and inherit whatever `process.env` the shell has                                                                                                                                                      | Connects Prisma. Also builds the wrapping-key factory and the rest of the application. The target is implicit. Evidence can leak if logs include the URL                           | Poor fit for a bounded Stage 4 call. Fails open on "whichever URL is present"                             |
| N4  | Treat `Connection.environment` or Vault purpose as the process environment                                                                                                                                             | Changes the meaning of the accepted classifier inputs                                                                                                                              | Cannot supply `DATABASE_URL`. Not a provision strategy                                                    |

**RECOMMENDATION — NOT SELECTED.** N0 for this research task. If a later invocation authorization provisions a target, N2 is the only listed strategy that names the target without putting M1 in charge of `process.env` and without reading the wrapping key for classification. N2 is not selected. N3 and N4 are unfit.

---

## 5. Assumptions and unresolved questions

**Assumption, not a fact.** The metadata repository path does not need `VAULT_WRAPPING_KEY` because its `select` omits ciphertext columns and the service does not call `retrieve`. That is an inference from the source. It was not confirmed by executing a lookup.

| Question                                                                         | State                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Which of N0–N4                                                                   | **NOT SELECTED**                                      |
| The non-secret name of the database target                                       | **UNRESOLVED**                                        |
| Whether production `NODE_ENV` is in scope                                        | **UNRESOLVED**                                        |
| Whether full application boot is ever allowed for this call                      | **UNRESOLVED.** N3 is listed and not recommended      |
| Whether a failed `verifyConfigurationValidity` aborts before Prisma construction | **UNRESOLVED.** The helper does not do that by itself |

---

## 6. Result

**ENVIRONMENT = RESEARCHED / NOT SELECTED.**

The Caller and the pure classifier have no process-environment contract of their own. A live Entry adds `DATABASE_URL` through Prisma and a metadata-only Vault read. The connection column and the Vault purpose class are separate inputs. No target was selected and no secret was read.

---

**END OF ENVIRONMENT CONTRACT RESEARCH**

**RESEARCHED / NOT SELECTED.** Research does not grant implementation or execution authorization. Stage 4 was not executed.
