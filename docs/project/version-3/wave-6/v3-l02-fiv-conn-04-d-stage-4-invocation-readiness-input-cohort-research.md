# FIV-CONN-04-D — Stage 4 Invocation Readiness: Input Cohort Research

```text
RESEARCH ONLY
ARTIFACT: RPT-CONN04-S4-INVOKE-COHORT-2026-11-08
INPUT COHORT = RESEARCHED / NOT SELECTED
THIS FILE DOES NOT LOAD A COHORT
THIS FILE DOES NOT QUERY A DATABASE
THIS FILE DOES NOT INVOKE THE ORCHESTRATOR OR THE CALLER
THIS FILE DOES NOT EXECUTE STAGE 4
THIS FILE DOES NOT APPROVE INVOCATION
THIS FILE DOES NOT ESTABLISH D-CONN04-FULL-D-IA-S4-EXEC
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Read-only research of how a deterministic explicit connection cohort could be obtained  
**Artifact ID:** `RPT-CONN04-S4-INVOKE-COHORT-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-ENTRY-COHORT-ENV-DESIGN`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **RESEARCHED / NOT SELECTED**  
**Nature:** **RESEARCH ONLY.** Query code was read. No connection row was loaded. No cohort was assembled.

Research does not grant implementation authorization or Stage 4 execution authorization.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**.

The earlier report `RPT-CONN04-S4-INPUT-COHORT-2026-11-07` is historical and is not rewritten.

---

## 1. Baseline

The baseline in `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08` §1 was verified again before this report. Subject commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`. Caller and M1 hashes match the acceptance records. `OQ-S4-02` remains **OPEN**. Invocation remains **NOT APPROVED**.

**VERIFIED REPOSITORY FACT.** Worktree bytes of the files cited below match the subject commit for each path that exists in that commit. This report does not stage them. No database client was opened.

---

## 2. Facts

### 2.1 The array the accepted functions require

**VERIFIED REPOSITORY FACT.** M1 and the Caller both take `readonly FivConn04DStage4TrustedConnection[]`. M1 rejects a non-array and then calls `invokeClassifyLiveConnectionAttempts` once (`fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` 13–23). The Caller forwards that array (`fiv-conn-04-d-stage-4-explicit-caller.ts` 12–16). Neither function queries rows.

`FivConn04DStage4TrustedConnection` is `FivConn04LiveConnectionInput` plus optional `informationalPreflightEligibleLive` (`fiv-conn-04-d-system-job-migration-entry.ts` 74–77). `FivConn04LiveConnectionInput` is `FivConn04AConnectionInput` (`fiv-conn-04-live-classifier.ts` 21). The fields are `fiv-conn-04-a-classification.ts` 55–63:

| Field                                | Type               | Role on the Stage 4 path                                                                                                    |
| ------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | `string`           | Copied onto the attempt result. Occupancy excludes this id                                                                  |
| `workspaceId`                        | `string`           | Same-element binding. Blank aborts the batch before I/O                                                                     |
| `provider`                           | `string`           | Occupancy predicate and classification output                                                                               |
| `connectionType`                     | `string`           | `EXCHANGE` is required before an occupancy query                                                                            |
| `environment`                        | `string \| null`   | Column value. Non-null EXCHANGE becomes `ALREADY_POPULATED` inside the pure classifier. This is not the process environment |
| `vaultSecretId`                      | `string \| null`   | Same-element binding for `lookupExact`. Blank aborts before I/O                                                             |
| `status`                             | `string`           | `REVOKED` skips the occupancy query and is classified as revoked when vault metadata is present                             |
| `informationalPreflightEligibleLive` | optional `boolean` | Ignored. Comment at entry lines 70–72                                                                                       |

`ConnectionRecord` stores those classifier fields plus `displayName`, `createdAt`, and `updatedAt` (`apps/api/prisma/schema.prisma` 199–214). The Stage 4 type does not include `displayName` or the timestamps. The partial unique comment at schema lines 194–198 is Strategy B uniqueness for non-null `environment`. It is not a cohort order.

### 2.2 Repository reads that already exist

**VERIFIED REPOSITORY FACT.** None of these returns an accepted Stage 4 cohort. None was executed.

| Read                                         | Path                                                | Filter                                                                                                                                                                                     | Order                                                                                        | Fields                                                                                                           |
| -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FivConn04APreflightService.loadConnections` | `fiv-conn-04-a-preflight.service.ts` 66–80. Private | Optional `workspaceId`. No status or type filter                                                                                                                                           | `workspaceId asc`, `provider asc`, `id asc`                                                  | The seven classifier fields                                                                                      |
| `FivConn04APreflightService.run`             | Same file 51–64                                     | Calls `loadConnections`, then `loadVaultMetadataByWorkspace`                                                                                                                               | Connection order as above. Workspace ids are sorted with `localeCompare` before `vault.list` | Preflight report, not the Stage 4 array                                                                          |
| `SecretVaultService.list`                    | `secret-vault.service.ts` 141–148                   | Workspace, after an authorization check                                                                                                                                                    | No `orderBy` on `listByWorkspaceId` (`prisma-secret-vault.repository.ts` 181–185)            | Service maps to metadata. The repository `findMany` has no `select`, so the row type includes ciphertext columns |
| `ConnectionsService.list`                    | `connections.service.ts` 116–121                    | Required `workspaceId`                                                                                                                                                                     | `createdAt asc`                                                                              | `view` at 764–775 exposes `credentialsStored`, not `vaultSecretId`                                               |
| `projectFivConn04DLiveSlotOccupancy`         | `fiv-conn-04-d-live-slot-occupancy.ts` 48–77        | One other live EXCHANGE row for the same workspace and provider. Runs only after the array element is already in the loop, and only when type, null environment, vault id, and status pass | `findFirst` with no `orderBy`                                                                | `{ id: true }`                                                                                                   |

**VERIFIED REPOSITORY FACT.** `D-CONN04-FULL-D-IA-S4` keeps preflight informational and requires fresh `lookupExact` per attempt. `run` uses `vault.list`. That is a different read from `lookupExact`, which selects only `id`, `workspaceId`, `purpose`, and `state` (`prisma-secret-vault.repository.ts` 22–27 and 188–196).

### 2.3 Eligibility, completeness, and order inside the accepted loop

**VERIFIED REPOSITORY FACT.** The loop visits elements in array order until `BATCH_ABORT` (`fiv-conn-04-d-system-job-migration-entry.ts` 230–238). It does not sort, filter, or deduplicate.

| Input observed in source               | Result                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Blank `workspaceId` or `vaultSecretId` | `BATCH_ABORT` / `BLANK_IDENTIFIER` before port and occupancy I/O (lines 253–257)        |
| `lookupExact` `NOT_FOUND`              | `ROW_SKIP` / `NOT_FOUND`. Later elements continue                                       |
| Other lookup failure                   | `BATCH_ABORT` with that reason                                                          |
| Occupancy throw                        | `unavailable`, then `BATCH_ABORT` / `OCCUPANCY_UNAVAILABLE`                             |
| Occupied live slot                     | `ROW_SKIP` / `OCCUPIED`                                                                 |
| `eligibleLive === false`               | `ROW_SKIP` / `INELIGIBLE`                                                               |
| Eligible                               | `INFORMATIONAL_CLASSIFICATION` / `CLASSIFIED`. No write flags                           |
| Duplicate ids                          | Each element is visited. No id set                                                      |
| Empty array                            | One call, empty `attempts`, `stopped: false`. Caller spec and M1 spec both forward `[]` |
| Preflight flag `true`                  | Not read                                                                                |

**TECHNICAL INFERENCE.** A deterministic cohort is the ordered seven-field array itself. The same rows read again are the same cohort only while the stored fields are unchanged. `createdAt` order and preflight order diverge. `findFirst` occupancy is not part of cohort identity. It is a later read against whatever database the Entry holds.

**TECHNICAL INFERENCE.** A row with a non-null `environment` still reaches `lookupExact` when its identifiers are non-blank. The pure classifier then returns `ALREADY_POPULATED` for EXCHANGE (`fiv-conn-04-a-classification.ts` 192–194). Including those rows changes both I/O and the attempt list. Excluding them is a selection rule. It is not in the Caller.

---

## 3. Candidate cohort options

No option is selected. No ids are named.

| ID  | Option                                                                                                                    | Consequence                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C0  | Do not assemble a cohort                                                                                                  | No operational array exists. Invocation stays impossible. Matches current authority                                                                                                                       |
| C1  | Empty array                                                                                                               | Reproducible and already accepted by the function types. It proves the call shape. It identifies no connection                                                                                            |
| C2  | Spec literals such as `conn-1` / `ws-a`                                                                                   | Fixed test input in the consumer spec and the M1 spec. Not repository identity                                                                                                                            |
| C3  | Call `FivConn04APreflightService.run` and reuse its rows                                                                  | Private loader plus `vault.list`. The list read is not the Stage 4 freshness path. The public method also classifies through A, which is a second classifier pass. Not executed here                      |
| C4  | Copy the private `loadConnections` shape into a later explicit read, without `vault.list`                                 | Seven fields and a total order exist in source. The method is private. Executing it needs a database and a workspace-or-all decision. The result is still a scan, not a named id list, until it is frozen |
| C5  | `ConnectionsService.list`                                                                                                 | Omits `vaultSecretId`. Order is `createdAt`. Workspace id is required and unnamed. Cannot satisfy the type without another read                                                                           |
| C6  | Product Owner names an ordered id list. A later authorized read copies the seven fields for those ids only, in that order | This is the shape M1 can receive without discovering rows. No list exists in the repository. Naming ids is a Product Owner act. The read is not authorized by this research                               |
| C7  | Workspace-scoped C4 or C6                                                                                                 | Same as C4 or C6 with `workspaceId` fixed. The workspace is not named                                                                                                                                     |

**RECOMMENDATION — NOT SELECTED.** C0. If a later decision selects a real cohort, C6 is the only listed shape that is an explicit array rather than a scan. C6 is not selected. C4 remains a candidate loader for hydrating C6, and it is not selected either.

---

## 4. Evidence required to prove identity and reproducibility

**RECOMMENDATION — NOT SELECTED.** A later cohort record, if one is authorized, would need all of the following before it could be compared with a second read. This research does not create that record.

| Evidence                                                         | Why it is required                                   | What must stay out of it                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Subject commit, tree, and parent                                 | The field meanings live in that tree                 | A claim that `main` is the subject                                                     |
| Ordered seven-field array                                        | The functions do not reorder                         | `displayName`, timestamps, and the ignored preflight flag, unless a decision adds them |
| SHA-256 of a canonical encoding of that ordered array            | Reproducibility without depending on object identity | Secret material. These seven fields are identifiers and status, not ciphertext         |
| The exact filter and `orderBy` used to produce the array         | C4 order and C5 order are different facts            | A database URL                                                                         |
| Store identity that is not the URL                               | The Entry does not record which database it reads    | `DATABASE_URL`, wrapping key, payload, nonce, tag                                      |
| Statement of duplicates, empty array, and already-populated rows | The loop accepts all three                           | An inference that an empty result means the table is empty                             |
| Statement that `vault.list` was not the freshness source         | Stage 4 freshness is `lookupExact`                   | Output of `list`                                                                       |

**UNRESOLVED QUESTION.** Canonical encoding, inclusion of already-populated rows, duplicate refusal, and empty-array refusal are not decided. The functions today accept duplicates and an empty array.

---

## 5. Assumptions and unresolved questions

**Assumption, not a fact.** A frozen seven-field array can be reproduced by reading the same ids again. That holds only for an unchanged table. This research did not read the table, so no cohort identity is known.

| Question                                                                   | State                                        |
| -------------------------------------------------------------------------- | -------------------------------------------- |
| Which of C0–C7                                                             | **NOT SELECTED**                             |
| Workspace, status, type, and null-environment filters                      | **NOT SELECTED**                             |
| Whether the first blank identifier is allowed inside an operational cohort | **NOT DECIDED.** The method aborts the batch |
| A stored id list                                                           | **Absent**                                   |

---

## 6. Result

**INPUT COHORT = RESEARCHED / NOT SELECTED.**

The input type, the existing query shapes, and the gap between preflight `list` and Stage 4 `lookupExact` are verified. No operational cohort was loaded.

---

**END OF INPUT COHORT RESEARCH**

**RESEARCHED / NOT SELECTED.** Research does not grant implementation or execution authorization. Stage 4 was not executed.
