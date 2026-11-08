# FIV-CONN-04-D — Stage 4 D2 Cohort Acquisition Decision Analysis

```text
RESEARCH / DECISION ANALYSIS ONLY
ARTIFACT: ANL-CONN04-S4-D2-COHORT-2026-11-08
D1-E0 = PO SELECTED / ACCEPTED / RECORDED
D2 COHORT ANALYSIS = PREPARED
C0 = AVAILABLE
C1 = ANALYZED
C2 = ANALYZED
D2 RECOMMENDATION = C0 — NOT SELECTED
D2 PO ACCEPTANCE = NOT RECORDED
D3 = PENDING
D4 = NOT APPROVED
D5 OQ-S4-02 = OPEN
D6 = NOT ESTABLISHED
INVOCATION = NOT APPROVED
STAGE 4 = NOT EXECUTED
THIS FILE DOES NOT ACQUIRE A COHORT
THIS FILE DOES NOT RUN PREFLIGHT
THIS FILE DOES NOT QUERY A DATABASE
THIS FILE DOES NOT CONSTRUCT AN ENTRY
THIS FILE DOES NOT IMPLEMENT A FACTORY, A PROVIDER, OR A COHORT BOUNDARY
THIS FILE DOES NOT INVOKE THE CLASSIFIER, THE CALLER, OR M1
THIS FILE DOES NOT SELECT A PRODUCT OWNER OPTION
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT ALTER D1-E0
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Evidence-backed Product Owner decision analysis for D2 — Cohort Acquisition  
**Artifact ID:** `ANL-CONN04-S4-D2-COHORT-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-PO-D2-COHORT-ANALYSIS`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **PREPARED — RECOMMENDATION NOT SELECTED — PO ACCEPTANCE NOT RECORDED**  
**Nature:** **RESEARCH / DECISION ANALYSIS ONLY.** Source was read. No cohort was loaded. Preflight was not executed. No database client was opened. No Entry was constructed. The accepted Caller and M1 were not invoked.

This file does not embed its own SHA-256. The readiness assessment records that hash after this file is written. A later accepting sentence must include that exact hash. A sentence in this file is a draft. It is not a Product Owner decision.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**, **UNRESOLVED PROPOSAL**.

Research and this analysis do not grant implementation authorization or Stage 4 execution authorization.

The accepted D1 decision remains **PO SELECTED / ACCEPTED — E0**. This analysis does not reopen it.

---

## 1. Baseline verified before analysis

Recomputed from file bytes and `git rev-parse` on 2026-11-08. No listed baseline item mismatched. Analysis continued.

| Record                                                             | Required                                                                                                                                              | Recomputed                                                                                              | Result                                                                                                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `HEAD`                                                             | `77caf8bfd731583a5ff7e51b95d87901916bbebc`                                                                                                            | Same                                                                                                    | **Match.** `docs(connections): record Stage 4 D1 PO acceptance`                                                                       |
| `origin/main`                                                      | Same commit as `HEAD`                                                                                                                                 | `77caf8bfd731583a5ff7e51b95d87901916bbebc`                                                              | **Match**                                                                                                                             |
| D1 decision `D-CONN04-FULL-D-IA-S4-D1`                             | **PO SELECTED / ACCEPTED / RECORDED**, option E0                                                                                                      | Decision file banner and §1. SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b` | **Match.** Byte-identical to that commit                                                                                              |
| D1-E0 statement                                                    | No Entry acquisition; remain blocked                                                                                                                  | Decision §1 recorded statement                                                                          | **Match**                                                                                                                             |
| D1 analysis `ANL-CONN04-S4-D1-ENTRY-2026-11-08`                    | SHA-256 `10176af8c4afb03f13f61096d5ae2b7feb619fa2bb590155d1e20e7c618eb647`                                                                            | Same                                                                                                    | **Match.** Its own text still says **PREPARED — RECOMMENDATION NOT SELECTED**. That text is historical. Acceptance is the D1 decision |
| Cohort research `RPT-CONN04-S4-INVOKE-COHORT-2026-11-08`           | SHA-256 `e48fcee575512446ecce3120bb8f02a7673612de952c6dc2e91a3e7df4b306fc`                                                                            | Same                                                                                                    | **Match.** **RESEARCHED / NOT SELECTED**                                                                                              |
| D1 verification `VER-CONN04-S4-D1-E0-2026-11-08`                   | Recorded with the D1 commit                                                                                                                           | SHA-256 `18c60b472a477e830d65cc89a4d026edff0c8ddc232d0e9822ef5d6632afbee2`                              | **Match.** **MATCH / CONSISTENT**                                                                                                     |
| D1 acceptance completion `RPT-CONN04-S4-D1-E0-COMPLETE-2026-11-08` | Recorded with the D1 commit                                                                                                                           | SHA-256 `8564ae3d37b34c97f17bc268cad05c2664ad43e38dfd55fce84a2c9fbf105dba`                              | **Match**                                                                                                                             |
| Package `PKG-CONN04-S4-INVOKE-PO-2026-11-08`                       | Unchanged                                                                                                                                             | SHA-256 `074a88c41d6b3090381661676f9455fae042dc4e5b024c7520d7a7de1d65de67`                              | **Match.** **PREPARED — NOT A PRODUCT OWNER DECISION**                                                                                |
| Caller                                                             | SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe`, 604 bytes                                                                 | Same                                                                                                    | **Match.** Worktree file. Untracked on `main`                                                                                         |
| M1 orchestrator                                                    | SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50`, 934 bytes                                                                 | Same                                                                                                    | **Match.** Worktree file. Untracked on `main`                                                                                         |
| Accepted Entry                                                     | SHA-256 `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163`, blob `9afd147cc73f6612a7d4918f177d48481f991e7b`                           | Same                                                                                                    | **Match.** Worktree bytes equal subject commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`                                             |
| Subject                                                            | Commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`, tree `8f93a971f965876e2d74f3c9815e83f6aea561d2`, parent `e6b839e0e7d75322d9626162712fa81f61147d18` | `git rev-parse` of the commit, its tree, and its parent                                                 | **Match.** `git merge-base --is-ancestor` against `HEAD` exits 1                                                                      |

**VERIFIED REPOSITORY FACT.** The D1 recording commit contains three files: the acceptance decision, the verification, and the acceptance completion report. It does not contain `wave-6-po-decision-register.md`. The committed register blob is `1dd9ed33eb6f3dc76c2f689ec16c8916d9816b95` and contains no `D-CONN04-FULL-D-IA-S4-D1` row. The worktree register blob is `46be5727a75d1fc340ba4e011f155fcce7c76e35`. That worktree file contains the D1 row. Verification §2 states that the register was left unstaged so a pre-existing worktree difference would not be published. This analysis does not edit the register and does not stage it.

**VERIFIED REPOSITORY FACT.** `main` blob `5b65c99dd688f282015bb724dff27e10001f205d` of `fiv-conn-04-d-system-job-migration-entry.ts` is the lease entry. The Stage 4 cohort type and `classifyLiveConnectionAttempts` live in the accepted worktree bytes above. Line numbers for the Entry, the Caller, and M1 in this analysis are those accepted bytes. Preflight, classification, and `ConnectionsService` are identical in `HEAD`, in the subject commit, and in the worktree.

The options analyzed are exactly the three options named by this task:

| ID  | Option in this analysis                        | What the option is                                                                     |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| C0  | No cohort acquisition; remain blocked          | No array is formed. No query runs                                                      |
| C1  | Reuse existing preflight cohort acquisition    | A later use of `FivConn04APreflightService` as the cohort source                       |
| C2  | Dedicated explicit cohort acquisition boundary | A later read-only boundary, absent today, whose output is the array M1 already accepts |

### 1.1 Same letters, different earlier meanings

**VERIFIED REPOSITORY FACT.** Package §5 and cohort research §3 use C0, C1, and C2 for different propositions. Those earlier letters are not the options of this analysis. They are recorded here so a later sentence cannot accept the wrong proposition by letter alone.

| Letter | This analysis                                  | Package `PKG-CONN04-S4-INVOKE-PO-2026-11-08` §5 | Cohort research §3                      |
| ------ | ---------------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| C0     | No cohort acquisition; remain blocked          | D2-C0 — No cohort                               | Do not assemble a cohort                |
| C1     | Reuse existing preflight cohort acquisition    | D2-C1 — Explicit ordered id list                | Empty array                             |
| C2     | Dedicated explicit cohort acquisition boundary | D2-C2 — Controlled repository query             | Spec literals such as `conn-1` / `ws-a` |

Research C3 is the preflight `run` path. Research C4 is a later copy of the private `loadConnections` shape. Research C6 is a named id list. Those labels stay historical. Section 9 records the ones that are alternative sources as unresolved proposals. None of them is a fourth option. None is selected.

---

## 2. Existing cohort sources

No source below was executed. No connection row was loaded for Stage 4.

### 2.1 What the accepted Caller and M1 require

**VERIFIED REPOSITORY FACT.** `orchestrateClassifyLiveConnectionAttemptsOnce` takes an existing `Conn04SystemJobMigrationEntry` and `readonly FivConn04DStage4TrustedConnection[]` (`fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` lines 13–23). It throws when the Entry is null and when the value is not an array. It then calls `invokeClassifyLiveConnectionAttempts` once. The Caller forwards that same array (`fiv-conn-04-d-stage-4-explicit-caller.ts` lines 12–16). Neither function queries rows. The Caller spec at lines 76–87 asserts that the Caller file does not construct an Entry and does not discover connections. The empty-array call is covered at Caller spec lines 57–62.

`FivConn04DStage4TrustedConnection` is `FivConn04LiveConnectionInput` plus optional `informationalPreflightEligibleLive` (entry lines 70–77). `FivConn04LiveConnectionInput` is `FivConn04AConnectionInput` (`fiv-conn-04-live-classifier.ts` line 21). The seven fields are `fiv-conn-04-a-classification.ts` lines 55–63:

| Field                                | Type               | On the accepted path                                                                                                              |
| ------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | `string`           | Copied onto the attempt. Occupancy excludes this id                                                                               |
| `workspaceId`                        | `string`           | Blank aborts the batch before vault and occupancy I/O                                                                             |
| `provider`                           | `string`           | Occupancy predicate and classification output                                                                                     |
| `connectionType`                     | `string`           | `EXCHANGE` is required before an occupancy query                                                                                  |
| `environment`                        | `string \| null`   | Column value. The pure classifier treats a non-null EXCHANGE row as already populated. This column is not the process environment |
| `vaultSecretId`                      | `string \| null`   | Blank aborts the batch before vault and occupancy I/O. `lookupExact` binds this id with `workspaceId`                             |
| `status`                             | `string`           | `REVOKED` skips occupancy and is classified from vault metadata when that metadata is present                                     |
| `informationalPreflightEligibleLive` | optional `boolean` | Ignored. Entry comment at lines 70–72. Classification comment at lines 220–222                                                    |

The loop visits elements in the array order it receives until `BATCH_ABORT` (entry lines 230–238). It does not sort, filter, or deduplicate. A blank `workspaceId` or `vaultSecretId` returns `BATCH_ABORT` / `BLANK_IDENTIFIER` before the port and before occupancy (lines 253–256).

`ConnectionRecord` stores the seven classifier fields plus `displayName`, `createdAt`, and `updatedAt` (`apps/api/prisma/schema.prisma` lines 199–214). The Stage 4 type does not include `displayName` or the timestamps. The comment at schema lines 194–198 is Strategy B uniqueness for credentialed non-revoked EXCHANGE rows with a non-null environment. That predicate is not a cohort filter and not a cohort order.

### 2.2 `Conn04SystemJobMigrationEntry` has no cohort method

**VERIFIED REPOSITORY FACT.** The accepted class at lines 113–247 exposes `start`, `resume`, `heartbeat`, `release`, `proveWriteAuthority`, `lookupVaultMetadataForConnection`, and `classifyLiveConnectionAttempts`. It has no `loadConnections`, no preflight call, and no `findMany` on `connectionRecord`. Cohort acquisition is outside the class.

`proveWriteAuthority` (lines 187–193) is the `transactions.run` site. The classification comment at lines 220–222 states that `classifyLiveConnectionAttempts` does not open a write transaction, does not call write authority, and does not UPDATE environment. Per-attempt freshness is `lookupVaultMetadataForConnection` (lines 204–214), which calls `vaultMetadata.lookupExact`.

The `main` blob of this path has the lease methods and `proveWriteAuthority`. It does not declare `FivConn04DStage4TrustedConnection` and does not declare `classifyLiveConnectionAttempts`. A cohort for the accepted Caller cannot be read from the `main` blob.

### 2.3 `loadConnections`

**VERIFIED REPOSITORY FACT.** `FivConn04APreflightService.loadConnections` is private (`fiv-conn-04-a-preflight.service.ts` lines 66–80).

| Property    | Source                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Call        | `this.prisma.connectionRecord.findMany`                                                                                                                                        |
| Filter      | `where: { workspaceId }` when the argument is defined. No `where` when it is undefined. No status filter. No connection-type filter. No environment filter. No vault-id filter |
| Order       | `workspaceId asc`, then `provider asc`, then `id asc`                                                                                                                          |
| Select      | `id`, `workspaceId`, `provider`, `connectionType`, `environment`, `vaultSecretId`, `status`                                                                                    |
| Transaction | None. The call is one `findMany` on `PrismaService`. It does not use `PrismaTransactionService.run`                                                                            |
| Return      | `ConnectionScanRow[]`, a file-private type with those seven fields                                                                                                             |

The seven selected columns are the seven classifier fields. `vaultSecretId` is selected. The method is not exported and is not a Stage 4 type. The only caller in this file is `run` at line 52.

### 2.4 `FivConn04APreflightService.run`

**VERIFIED REPOSITORY FACT.** `run` (lines 51–64) loads connections, then calls `loadVaultMetadataByWorkspace`, then `classifyRow` for every loaded row, then `buildFivConn04APreflightReport`.

`loadVaultMetadataByWorkspace` (lines 83–94) sorts distinct workspace ids with `localeCompare` and calls `this.vault.list(actorUserId, workspaceId, actorRole)` once per workspace. `SecretVaultService.list` ( `secret-vault.service.ts` lines 141–148) calls `authorize` and then `repository.listByWorkspaceId`. `authorize` (lines 393–398) calls `accessControl.assertCanAccess`. `listByWorkspaceId` (`prisma-secret-vault.repository.ts` lines 181–185) is `findMany` by `workspaceId` with no `select` and no `orderBy`. The repository therefore materializes the vault row type. `toSecretVaultMetadata` (`secret-record.ts` lines 59–69) returns id, workspace, type, purpose, state, operator label, and timestamps. Ciphertext fields are absent from that metadata object.

`classifyRow` (preflight lines 96–114) copies the seven fields, resolves one vault metadata element by exact `vaultSecretId`, and may call `findLiveStrategyBOccupant`. That helper (lines 144–173) issues `connectionRecord.findFirst` for another credentialed non-revoked live EXCHANGE row in the same workspace and provider. It returns before the query when the row is not EXCHANGE, already has an environment, has a blank vault id, or is `REVOKED`. The helper does not open a transaction.

`resolveExactVaultMeta` (lines 120–138) returns null when the vault id is blank or when the listed metadata has no element with that id. It does not call `lookupExact`.

The public result is `FivConn04APreflightReport` (`fiv-conn-04-a-classification.ts` lines 97–109): `generatedAt`, classified rows, counters, and safety markers. `buildFivConn04APreflightReport` (lines 384–406) defaults `generatedAt` to `new Date().toISOString()` and sorts rows with `localeCompare` on workspace, provider, and connection id. The report row type includes classification, reason, vault purpose, vault state, and collision fields. It is not `FivConn04DStage4TrustedConnection`.

Preflight does not call `Conn04SystemJobMigrationEntry`. It does not call `proveWriteAuthority`. It does not UPDATE `environment`. The service comment at lines 1–6 states that the service loads connection rows and vault metadata and does not mutate vault credentials or perform venue I/O.

### 2.5 `ConnectionsService.list`

**VERIFIED REPOSITORY FACT.** `list` (`connections.service.ts` lines 116–121) requires a `workspaceId`, calls `connectionRecord.findMany` with `where: { workspaceId }` and `orderBy: { createdAt: 'asc' }`, and maps each row through `view`. There is no `select`, so the service receives the full connection row, including `vaultSecretId`. `view` (lines 764–775) returns `credentialsStored`, computed as `vaultSecretId !== null && status !== 'REVOKED'`. The returned `ConnectionMetadataView` includes `id`, `workspaceId`, `displayName`, `provider`, `connectionType`, `environment`, and `status`. It does not include `vaultSecretId`.

The HTTP list route (`connections.controller.ts` lines 61–67) passes the workspace from `requireWorkspace`. That authorization sits on the controller. `list` itself does not take an actor.

The service spec sorts its fake by `createdAt` when `orderBy.createdAt === 'asc'` (`connections.service.spec.ts` lines 40–50). That order is the list order. It is not the preflight order.

### 2.6 Freshness query used by the accepted loop

**VERIFIED REPOSITORY FACT.** Stage 4 freshness for an element already in the array is `FivConn04DVaultMetadataService.lookupExact` (`fiv-conn-04-d-vault-metadata.service.ts` lines 33–71). The repository method is `findMetadataByIdAndWorkspaceId` (`prisma-secret-vault.repository.ts` lines 188–196). `METADATA_SELECT` (lines 22–27) is `id`, `workspaceId`, `purpose`, and `state`. Those vault files match subject commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f` and differ from `HEAD`. This analysis does not stage them.

`lookupExact` is not a cohort query. It reads one vault metadata projection for one already supplied pair. `listByWorkspaceId` remains the preflight list path and has no column select.

### 2.7 Tests that already exist

| Test                                                                                          | What it shows                                                                                                                                                                                                                                    | What it does not show                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `fiv-conn-04-a-preflight.service.spec.ts` lines 121–273, `21-24. runs read-only inventory...` | `run` can be driven with an in-memory `findMany` / `findFirst` and an in-memory `vault.list`. Update, create, delete, store, replace, revoke, and retrieve throw or are asserted unused. The serialized report is checked for secret-shaped keys | It does not call the Stage 4 Entry. The fake ignores the `orderBy` argument (`void orderBy` at line 63) and sorts with `localeCompare` |
| Same file, `does not select sibling Vault credentials by provider`                            | Exact id match inside the listed workspace metadata                                                                                                                                                                                              | It does not produce a Stage 4 array                                                                                                    |
| `fiv-conn-04-d-stage-4-explicit-caller.spec.ts` lines 57–62 and 76–87                         | The Caller forwards `[]` and the source of the Caller does not discover connections                                                                                                                                                              | It does not load repository rows                                                                                                       |
| `fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` lines 20–22                                  | M1 rejects a non-array                                                                                                                                                                                                                           | No cohort fixture is loaded from a database                                                                                            |
| `connections.service.spec.ts` lines 40–50                                                     | The list fake honors `createdAt` order                                                                                                                                                                                                           | The public view still has no `vaultSecretId`                                                                                           |

### 2.8 Suitability of the current source for an explicit Stage 4 cohort

**VERIFIED REPOSITORY FACT.** No current public method returns `readonly FivConn04DStage4TrustedConnection[]`.

| Source                                           | Suitable as the accepted array                                                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted Entry methods                           | No acquisition method exists                                                                                                                                                                  |
| Private `loadConnections`                        | The select list is the seven fields, and the `orderBy` is total for one unchanged table. The method is private. The only public path that reaches it also lists vault metadata and classifies |
| `run`                                            | Returns a classified report with `generatedAt`, counters, and vault purpose/state. It does not return the Stage 4 array                                                                       |
| `ConnectionsService.list`                        | Omits `vaultSecretId` from the returned view and orders by `createdAt`                                                                                                                        |
| `lookupExact` / `findMetadataByIdAndWorkspaceId` | One vault metadata row. It does not list connections                                                                                                                                          |
| `listByWorkspaceId`                              | Vault rows, no `select`, no connection fields                                                                                                                                                 |

**TECHNICAL INFERENCE.** The private select list is evidence of a query shape a later boundary could copy. Copying it is implementation. This analysis does not copy it. The current public source is not an explicit Stage 4 cohort.

---

## 3. C1 — Reuse existing preflight cohort acquisition

C1 means a later Stage 4 cohort would be taken from the existing preflight service. Preflight was not executed. The assessment below is from the source.

### 3.1 Exact cohort required by the accepted boundary

**VERIFIED REPOSITORY FACT.** The Caller and M1 require `readonly FivConn04DStage4TrustedConnection[]` in caller-supplied order. Preflight `run` returns `FivConn04APreflightReport`. The report rows contain classification output and vault purpose/state. They are not that array. No function in the preflight service maps the report back to `FivConn04DStage4TrustedConnection`.

The private loader's row has the seven fields. Reaching that row requires `run`, because `loadConnections` is private. `run` then replaces the row list with a classified report. C1, defined as reuse of the existing preflight acquisition, therefore yields the report, not the accepted array.

A blank identifier remains in the loaded set. The accepted loop aborts the batch at the first blank `workspaceId` or `vaultSecretId`. Preflight does not apply that abort. A non-null `environment` remains in the loaded set. The accepted loop does not remove it. Inclusion of those rows would be a property of reusing the scan. It is not an eligibility decision the Caller already made.

### 3.2 Side effects, vault access, and extra validation

**VERIFIED REPOSITORY FACT.** `run` performs these reads on every call:

1. `connectionRecord.findMany` for the optional workspace or for every connection workspace.
2. `vault.list` once per distinct workspace, after `authorize`.
3. `connectionRecord.findFirst` for occupancy when the row is an unscoped, credentialed, non-revoked EXCHANGE row.

`vault.list` is metadata at the service boundary. The repository `findMany` has no `select`. The preflight spec asserts that store, replace, revoke, and retrieve are not used, and that the report text does not contain secret-shaped keys. The spec does not assert that the repository query omitted ciphertext columns.

`run` classifies through `classifyFivConn04AConnection`. That is a classification pass. The accepted Stage 4 path classifies later, inside `classifyLiveConnectionAttempts`, after `lookupExact`. The preflight classification is a different pass. The optional flag `informationalPreflightEligibleLive` is ignored when the accepted loop runs, and the report does not even set that flag. It sets `classification` and `reasonCode`.

`run` does not call the migration Entry, does not call `proveWriteAuthority`, and does not UPDATE `environment`. Reuse of preflight can happen without running the migration write. Reuse cannot happen without the vault list and without the classification pass, because those calls are in `run` and the loader is private.

### 3.3 Stability, determinism, and completeness

**VERIFIED REPOSITORY FACT.** Connection `orderBy` in `loadConnections` is `workspaceId`, `provider`, `id`. The report builder then sorts again with `String.localeCompare` on workspace, provider, and connection id. The preflight spec discards the `orderBy` argument and sorts with `localeCompare`. The spec therefore does not lock the Prisma `orderBy` object.

`generatedAt` defaults to the current time. Two calls that read the same rows do not produce byte-identical reports.

The report is complete as an FIV-CONN-04-A inventory. It is not complete as a Stage 4 array: the element type differs, the clock field is extra, and classification fields are extra. The seven connection fields are present on each report row, including `vaultSecretId`. Presence on the report row does not make the report the accepted array.

**TECHNICAL INFERENCE.** Prisma `orderBy` is deterministic for one unchanged table under one collation. `localeCompare` follows the runtime locale. Those two orders are the same for the ASCII identifiers used in the spec. They are not the same function. Stage 4 will not reorder whichever array it is given. A cohort whose order is "whatever the report sort produced" is reproducible only when the locale and the stored keys are both recorded. Preflight records neither as a cohort digest.

`ConnectionsService.list` order is `createdAt`. That order is a different sequence from the preflight order. Stage 4 has no separate required order beyond the order of the array argument. Preflight order is compatible with Stage 4 only after some other code copies seven-field elements into an array and a later decision adopts that array's order. That copying code does not exist. The report order is therefore not an accepted Stage 4 order.

### 3.4 Hidden coupling and stale reads

**VERIFIED REPOSITORY FACT.** `run` is three kinds of read with no shared `TransactionContext`: the connection `findMany`, one or more `vault.list` calls, and zero or more occupancy `findFirst` calls. The accepted classification path performs a later `lookupExact` per element, also outside that sequence. Package D4 records that the two Stage 4 reads are not one transaction. Preflight does not change that fact.

**TECHNICAL INFERENCE.** A row can change between `loadConnections` and a later `lookupExact`. The report can name a vault id that the later exact lookup does not find, or the reverse. C1 would freeze a classified snapshot that Stage 4 is required to ignore as freshness. The accepted freshness read remains `lookupExact`. Using `vault.list` as the cohort's vault evidence would contradict that boundary.

C1 also couples cohort identity to preflight inputs that the Caller does not have: `actorUserId`, `actorRole`, and an optional `workspaceId`. A missing actor fails in `authorize` before any Stage 4 array exists. The workspace argument is unnamed. Omitting it scans every connection workspace.

### 3.5 Tests and lifecycle if C1 were later chosen

This analysis does not add those tests and does not choose C1.

A later implementation authorization would have to show, before any operational call:

- The value passed to M1 is `readonly FivConn04DStage4TrustedConnection[]`.
- `vault.list` was not that value's freshness source.
- `generatedAt` is absent from the cohort digest.
- The order is the order M1 will keep, and the locale or the SQL `orderBy` is stated.
- Blank identifiers and non-null environments are either excluded by a stated rule or accepted with the batch-abort consequence.
- `run` was not executed against an operational database by the authorization itself.

Existing preflight tests remain inventory tests. They do not discharge that list. `FivConn04APreflightService` is the only export of `ConnectionsModule` (worktree `connections.module.ts` line 55). The Entry class is registered at line 49 and is not exported. C1 does not need the Entry. D1-E0 still blocks obtaining the Entry that M1 requires. A preflight result cannot be passed to M1 while the Entry argument is absent, because M1 throws when the Entry is null.

### 3.6 C1 conclusion

**TECHNICAL INFERENCE.** C1 can run without the migration write. C1 cannot, by the current public method, produce the exact array the accepted Caller and M1 require. The private select is the right field list and is not independently callable. The public method adds vault listing, authorization, a second classification, occupancy reads, a clock field, and a second sort. Those are the coupling and staleness risks.

C1 stays analyzed. It is not selected.

---

## 4. C2 — Dedicated explicit cohort acquisition boundary

C2 means a future boundary whose only job is to produce the accepted array. That boundary is not in the repository. This section specifies the contract a later authorization would have to meet. It does not implement the boundary and does not choose the filter.

### 4.1 Inputs and output

| Contract item    | Proposed content                                                                                                                                                        | Chosen by this analysis                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Output           | `Promise<readonly FivConn04DStage4TrustedConnection[]>`                                                                                                                 | The type is the accepted Caller input. Proposed as the output. The function is not created |
| Fields           | The seven classifier fields. `informationalPreflightEligibleLive` omitted                                                                                               | Required by the type. The ignored flag stays omitted                                       |
| Input            | A request object supplied by a later record                                                                                                                             | **Not chosen.** The record must state one selection mode before any query                  |
| Selection mode A | Ordered connection ids. The read copies the seven fields for those ids and preserves the named order                                                                    | **UNRESOLVED PROPOSAL** inside C2. See §9. It is not a fourth option                       |
| Selection mode B | One stated `where` together with `orderBy` `workspaceId`, `provider`, `id`, and the seven-field `select`                                                                | **UNRESOLVED PROPOSAL** inside C2. See §9. It is not a fourth option                       |
| Exclusions       | `FivConn04APreflightService.run`, `vault.list`, `listByWorkspaceId`, `lookupExact`, `classifyLiveConnectionAttempts`, `proveWriteAuthority`, and any environment UPDATE | Part of the proposed boundary. Not implemented                                             |

The output array is the cohort. M1 does not query it. A digest, if a later record requires one, is a SHA-256 of a canonical encoding of that ordered seven-field array. The encoding is **UNRESOLVED** (cohort research §4). This analysis does not invent the encoding and does not compute a digest. No ids are named.

### 4.2 Query and selection semantics

**TECHNICAL INFERENCE.** A boundary that meets the table above can be a single `connectionRecord.findMany` or a single read by primary key. The `select` list is the seven fields already used by `loadConnections`. `displayName`, `createdAt`, and `updatedAt` stay out of the output. The query does not join vault rows.

Selection itself is not in the current source. `loadConnections` takes an optional workspace and otherwise returns every row. The accepted loop accepts an empty array, duplicate ids, and rows with a non-null environment, and it aborts on the first blank identifier. A dedicated boundary must state which of those the cohort includes. This analysis does not state them. Until that statement exists, C2 has a type and no operational predicate.

Deterministic order:

- Named-id mode keeps the named order. The query must not replace it with `createdAt` or with `localeCompare`.
- Filter mode uses `workspaceId asc`, `provider asc`, `id asc`, and the later record must say that this order is the cohort order.
- Stage 4 will not sort the array again. Order is part of cohort identity.

### 4.3 Freshness and snapshot

**VERIFIED REPOSITORY FACT.** The accepted loop's freshness read is `lookupExact` after the array already exists. That read selects four vault metadata columns. It is not part of cohort acquisition.

**TECHNICAL INFERENCE.** One `findMany` is one statement. It does not need `PrismaTransactionService.run` to be atomic as a single statement. A transaction or a database snapshot would matter only if acquisition and the later `lookupExact` had to observe one snapshot. The accepted loop does not wrap those reads in one transaction. Putting the acquisition query in a write transaction would couple a read to the `transactions.run` path used by `proveWriteAuthority`. That coupling is outside C2.

The array is fresh only for the statement that produced it. A second read is the same cohort while the seven stored fields are unchanged. C2 must record the store by a name that is not a URL. `DATABASE_URL` stays out of the record. This analysis does not read that variable.

### 4.4 Read-only, D1-E0, and the Entry boundary

The proposed boundary reads connection columns and returns an array. It does not construct `Conn04SystemJobMigrationEntry`. It does not register a provider. It does not call the Caller. D1-E0 remains Entry acquisition blocked. C2 does not satisfy D1 and does not modify the D1 decision.

M1 still requires an Entry argument. A C2 array, even if one later existed, cannot be passed to M1 while the Entry is null. D1-E0 keeps that call blocked. Selecting C2 would not be an Entry decision and would not authorize the call.

The Entry class remains unexported from `ConnectionsModule`. C2 must not export it and must not add a method to the accepted Entry file. The accepted Entry hash stays `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163`.

### 4.5 Security, capability, and tests

Capability of the proposed boundary is a read of connection identifiers and status. The `select` list excludes vault ciphertext because it does not read vault tables. A later implementation that called `listByWorkspaceId` would load vault rows without a column select. That call is outside the proposed boundary.

Authorization for the connection read is **UNRESOLVED**. `ConnectionsService.list` relies on the controller's `requireWorkspace`. Preflight relies on vault `authorize`. A new read needs its own stated actor rule. This analysis does not choose that rule.

Tests that would belong to a later authorization, and that are not added here:

- The fake client receives the seven-field `select` and the stated `orderBy` or the stated id order.
- The result elements contain `vaultSecretId` and omit `displayName` and timestamps.
- The test double for `vault.list`, `lookupExact`, and `classifyLiveConnectionAttempts` is not called.
- An empty result is distinguishable from a query that did not run.
- No assertion opens a database.

Implementation complexity is one new read function and those tests, behind a separate implementation authorization that names the file. That authorization is not this analysis. No file is named for creation.

### 4.6 C2 conclusion

C2 can be specified so the output type matches the accepted Caller, so the read stays off the vault list path, and so the Entry remains unacquired under D1-E0. The predicate, the id-list versus filter choice, the digest encoding, and the actor rule are unresolved inside the option. The boundary does not exist. C2 stays analyzed. It is not selected.

---

## 5. C0 — No cohort acquisition

C0 forms no array and runs no query.

### 5.1 What remains blocked

| Item                              | State under C0                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| Cohort load                       | No id list, no scan, no preflight run, no Stage 4 query                                            |
| M1 call                           | The connection argument has no operational value. An empty array is a legal M1 input and is not C0 |
| Entry                             | D1-E0 continues to block acquisition. C0 does not supply the missing Entry                         |
| Invocation                        | **NOT APPROVED**                                                                                   |
| `OQ-S4-02`                        | **OPEN**                                                                                           |
| D3                                | **PENDING**                                                                                        |
| D4                                | **NOT APPROVED**                                                                                   |
| D6 / `D-CONN04-FULL-D-IA-S4-EXEC` | **NOT ESTABLISHED**                                                                                |
| Stage 4                           | **NOT EXECUTED**                                                                                   |

### 5.2 What is preserved

D1-E0 stays **PO SELECTED / ACCEPTED / RECORDED**. E1 and E2 stay **NOT SELECTED**. The D1 decision bytes stay SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b`. The accepted Caller, M1, and Entry hashes stay the hashes in §1. Preflight remains the FIV-CONN-04-A inventory service. It is not promoted to a Stage 4 cohort source. The Decision Register is not edited.

### 5.3 What can be prepared independently

The type, the private select list, the public report type, and the list view are already in source and are cited above. The Caller spec already forwards an empty array as a type-level fixture. This analysis is the D2 preparation. None of that preparation loads a cohort or authorizes a run.

### 5.4 Conditions for reconsideration

A later Product Owner sentence can refuse C0 only by matching the C1 sentence or the C2 sentence in §8, including the analysis hash recorded in the readiness assessment. That sentence still would not:

- run preflight or a cohort query,
- implement C2,
- construct an Entry,
- change D1-E0,
- approve invocation,
- close `OQ-S4-02`,
- establish `D-CONN04-FULL-D-IA-S4-EXEC`,
- or execute Stage 4.

A C1 sentence would still leave the type mismatch in §3. A C2 sentence would still need a later implementation authorization, a stated selection mode, and a stated predicate before any read. Invocation would still require an Entry decision other than E0, a D3 decision other than no environment, a D4 approval, a D5 disposition that a later sentence says is sufficient, and a separate D6 act. Those gates are outside D2.

---

## 6. Comparative assessment

| Criterion                         | C0 — no acquisition                                                         | C1 — reuse preflight                                                                                                                      | C2 — dedicated boundary                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Correctness of cohort             | No array, so no wrong array. M1 stays without an operational cohort         | The public result is a classified report, not `FivConn04DStage4TrustedConnection[]`                                                       | The proposed output is that array. The predicate is not yet stated, so no operational cohort exists                       |
| Data completeness                 | No fields                                                                   | Report rows include the seven fields plus classification and vault metadata. The array M1 accepts is not returned. `generatedAt` is extra | Seven fields in the proposed output. Flag omitted. Digest encoding unresolved                                             |
| Determinism                       | Nothing to reproduce                                                        | SQL order and `localeCompare` are both present. `generatedAt` changes every call. The spec does not lock `orderBy`                        | Named order, or `workspaceId` / `provider` / `id`, once a later record states which. Not implemented                      |
| Freshness                         | No read                                                                     | Connection scan, then `vault.list`, then occupancy `findFirst`, with no shared transaction. Later `lookupExact` is a further read         | One connection read. Freshness of vault state stays on the later `lookupExact`. No shared snapshot with that lookup       |
| Side effects                      | No query and no vault call                                                  | No migration write. Does call `vault.list`, `authorize`, classification, and conditional occupancy reads                                  | Proposed as a connection `select` only. No vault list and no classification. Not implemented                              |
| Security and capability exposure  | No connection identifiers and no vault rows                                 | Vault list loads repository rows without a column select, then maps to metadata. Actor role is required                                   | Connection identifiers and status only, if the `select` is honored. Actor rule unresolved. Vault ciphertext path excluded |
| Testability                       | Existing Caller empty-array test remains a type fixture. It is not a cohort | Existing preflight spec covers inventory and non-mutation. It does not cover a Stage 4 array                                              | A later fake-client test can assert `select` and unused vault doubles. That test is not added here                        |
| Implementation complexity         | No source change                                                            | No new method, and the current method still has the wrong return type. A mapping layer would be new code and is not C1 as it exists       | One later function and tests, after a separate authorization names the file                                               |
| Compatibility with accepted D1-E0 | Preserves the block. Does not obtain an Entry                               | Does not obtain an Entry. Still cannot call M1, because M1 requires the Entry                                                             | Does not obtain an Entry and must not edit the accepted Entry file. Still cannot call M1                                  |
| Reversibility                     | Nothing is added                                                            | No new cohort file. A later mapping would be a new change                                                                                 | A new unregistered file can be removed later. Nothing is added now                                                        |

### 6.1 Recommendation

**RECOMMENDATION — NOT SELECTED.** C0.

**Confidence:** **HIGH** that C0 is the option to recommend while D1-E0 remains accepted and no public method returns the accepted array. **The recommendation is not a selection.**

Reasoning:

1. D1-E0 is accepted. M1 throws when the Entry is null. A cohort array without that Entry still cannot enter M1. Recommending a load would name a read while the accepted Entry gate stays closed.
2. C1's public method returns `FivConn04APreflightReport`. The accepted functions require `readonly FivConn04DStage4TrustedConnection[]`. The private seven-field loader is not callable without `run`, and `run` always lists vault metadata and classifies.
3. C1's `generatedAt`, second sort, occupancy reads, and `vault.list` are extra relative to the accepted cohort contract. Stage 4 freshness remains `lookupExact`. The preflight list is a different read.
4. C2 describes a boundary that is absent. Its selection mode, eligibility predicate, digest encoding, and actor rule are unresolved. Describing the contract does not create the function.
5. Invocation is **NOT APPROVED**. `OQ-S4-02` is **OPEN**. D4 is **NOT APPROVED**. D6 is **NOT ESTABLISHED**. A D2 choice does not by itself authorize a run.
6. C0 adds no source, no query, and no register row. It leaves D1-E0, the Caller, M1, and the accepted Entry bytes unchanged.

**Conditional observation, not a second recommendation and not a selection.** If a later Product Owner statement refuses C0, the current preflight `run` method still returns the wrong type. A dedicated boundary is the option in this analysis that can be specified to return the accepted array, and that specification would still need its own implementation authorization, a stated selection mode, and a stated predicate. This sentence does not select C2.

---

## 7. Decision draft

This section is a draft for a later Product Owner decision. It is not that decision. `D2 PO ACCEPTANCE = NOT RECORDED`.

| Draft item                   | Content                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision ID                  | `D-CONN04-FULL-D-IA-S4-D2`                                                                                                                        |
| Decision status in this file | **DRAFT — NOT RECORDED**                                                                                                                          |
| Options                      | C0 — no cohort acquisition; remain blocked. C1 — reuse existing preflight cohort acquisition. C2 — dedicated explicit cohort acquisition boundary |
| Recommended option           | **C0 — NOT SELECTED**                                                                                                                             |
| D1                           | Remains `D-CONN04-FULL-D-IA-S4-D1` = **PO SELECTED / ACCEPTED — E0**. This draft does not edit that decision                                      |
| Register                     | This draft does not add a D2 row                                                                                                                  |

### 7.1 Rationale

The accepted Caller and M1 consume an explicit array and do not discover rows. The existing public preflight path produces a classified inventory report and reads vault metadata. The existing connection list omits `vaultSecretId`. No dedicated acquisition function exists. D1-E0 keeps the Entry unacquired, so M1 remains unreachable. The draft recommendation is to acquire nothing.

### 7.2 Limitations

- C1 cannot be treated as already able to emit the accepted array.
- C2's id-list mode and filter mode are unresolved proposals inside that option. This draft does not choose between them.
- Package D2-C1 and package D2-C2 are different propositions that share letters with this draft. An acceptance of this draft must cite this analysis, not the package letter alone.
- No cohort digest exists, because no cohort was loaded.
- The worktree Decision Register contains the D1 row and is not part of commit `77caf8bfd731583a5ff7e51b95d87901916bbebc`. This draft does not repair that split and does not stage the register.

### 7.3 Acceptance criteria

A later recording of `D-CONN04-FULL-D-IA-S4-D2` is valid only when all of the following hold:

1. The spoken sentence is exactly one of the three sentences in §8, with the analysis SHA-256 from the readiness assessment in place of `ANALYSIS_SHA256`.
2. The sentence names one of C0, C1, or C2 as defined in §1 of this analysis.
3. D1 decision bytes remain SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b`, and the selected D1 option remains E0, unless a separate D1 decision says otherwise. This D2 draft is not that separate decision.
4. The recording does not run preflight, does not query a cohort, does not construct an Entry, does not implement a boundary, does not invoke the Caller or M1, does not close `OQ-S4-02`, and does not establish `D-CONN04-FULL-D-IA-S4-EXEC`.
5. Accepted Caller, M1, and Entry hashes remain the hashes in §1.
6. A C1 or C2 sentence is an option selection only. It is not implementation authorization and not execution authorization.

This analysis meets none of those recording steps. The criteria describe a future recording. They do not perform it.

### 7.4 Exact PO acceptance statements

These sentences are drafts. They are not spoken. Replace `ANALYSIS_SHA256` with the SHA-256 of this file recorded by the readiness assessment. Any other wording is not acceptance of this analysis.

```text
PO ACCEPTANCE: I select D2 option C0 in ANL-CONN04-S4-D2-COHORT-2026-11-08 at SHA-256 ANALYSIS_SHA256. No cohort is acquired. Cohort acquisition stays blocked. This statement selects only D2-C0 as defined in that analysis. It does not select C1 or C2. It does not select the package D2-C1 id list or the package D2-C2 query. It does not alter D1-E0. It does not construct an Entry. It does not run preflight. It does not query a cohort. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D2 option C1 in ANL-CONN04-S4-D2-COHORT-2026-11-08 at SHA-256 ANALYSIS_SHA256. The cohort source under consideration is reuse of the existing preflight acquisition. This statement does not run preflight. It does not load a cohort. It does not implement a mapper. It does not select C0 or C2. It does not select the package D2-C1 id list. It does not alter D1-E0. It does not construct an Entry. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D2 option C2 in ANL-CONN04-S4-D2-COHORT-2026-11-08 at SHA-256 ANALYSIS_SHA256. A later implementation authorization may define a dedicated explicit read-only cohort boundary whose output is the accepted connection array. This statement does not implement that boundary. It does not name ids or filters. It does not query a cohort. It does not select C0 or C1. It does not alter D1-E0. It does not construct an Entry. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

---

## 8. What this analysis does not do

| Action                                               | State                                     |
| ---------------------------------------------------- | ----------------------------------------- |
| Cohort acquisition                                   | **Not performed**                         |
| Preflight execution                                  | **Not performed**                         |
| Database query for Stage 4                           | **Not performed**                         |
| Entry construction                                   | **Not performed.** D1-E0 remains accepted |
| Factory or provider implementation                   | **Not performed**                         |
| Caller or M1 invocation                              | **Not performed**                         |
| `OQ-S4-02`                                           | **OPEN**                                  |
| Execution authorization                              | **NOT ESTABLISHED**                       |
| Stage 4                                              | **NOT EXECUTED**                          |
| Option selection                                     | **NOT SELECTED**                          |
| Accepted implementation files                        | **Not modified**                          |
| D1 decision, verification, and acceptance completion | **Not modified**                          |
| Decision Register                                    | **Not modified**                          |

---

## 9. Unresolved questions and unresolved proposals

Unresolved proposals are not options. They are not selected. They do not create a fourth alternative.

| ID       | Item                                                                                                             | State                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UQ-D2-01 | Whether a future C2 request is an ordered id list or a filter                                                    | **UNRESOLVED.** Neither mode was chosen                                                                                                                                                      |
| UQ-D2-02 | Whether the cohort includes blank identifiers, non-null `environment`, `REVOKED`, non-EXCHANGE, or duplicate ids | **UNRESOLVED.** The accepted loop aborts on the first blank identifier, accepts duplicates, and does not drop non-null environments                                                          |
| UQ-D2-03 | Workspace scope                                                                                                  | **UNRESOLVED.** Preflight's workspace argument is optional and unnamed                                                                                                                       |
| UQ-D2-04 | Canonical digest encoding                                                                                        | **UNRESOLVED.** No digest was computed                                                                                                                                                       |
| UQ-D2-05 | Whether acquisition and `lookupExact` share a snapshot                                                           | **UNRESOLVED.** The accepted loop does not put them in one transaction. No snapshot was opened                                                                                               |
| UQ-D2-06 | Actor rule for a connection-only read                                                                            | **UNRESOLVED.** Controller workspace checks and vault `authorize` are different existing checks                                                                                              |
| UQ-D2-07 | Database collation versus `localeCompare`                                                                        | **UNRESOLVED.** The preflight spec sorts with `localeCompare` and discards `orderBy`                                                                                                         |
| UQ-D2-08 | Committed register versus worktree register                                                                      | **RECORDED FACT, NOT REPAIRED.** Commit `77caf8bfd731583a5ff7e51b95d87901916bbebc` does not contain the register. The worktree register contains the D1 row. This analysis does not stage it |
| UP-D2-01 | Package D2-C1 / research C6, an explicit ordered id list                                                         | **UNRESOLVED PROPOSAL — NOT AN OPTION.** It is not this analysis's C1. It can later be named as C2 selection mode A. No ids exist in the repository                                          |
| UP-D2-02 | Research C4, a later copy of private `loadConnections` without `vault.list`                                      | **UNRESOLVED PROPOSAL — NOT AN OPTION.** It can later be named as C2 selection mode B. It is not implemented                                                                                 |
| UP-D2-03 | Classification-only cohort: use `FivConn04APreflightReport` or `eligibleLive` as the Stage 4 input               | **UNRESOLVED PROPOSAL — NOT AN OPTION.** The accepted loop ignores `informationalPreflightEligibleLive`. The report type is not the Caller argument                                          |
| UP-D2-04 | Research C1 empty array, and research C2 spec literals                                                           | **UNRESOLVED PROPOSAL — NOT AN OPTION.** They are historical labels. An empty array is a legal M1 fixture and is not operational C0. Spec literals are not repository identity               |
| UP-D2-05 | `ConnectionsService.list` as the cohort source                                                                   | **UNRESOLVED PROPOSAL — NOT AN OPTION.** The returned view has `credentialsStored` and omits `vaultSecretId`. Order is `createdAt`                                                           |

---

## 10. Result

**D2 COHORT ANALYSIS = PREPARED.**

C0 is available. C1 and C2 are analyzed. The recommendation is C0 and is **NOT SELECTED**. D2 acceptance is **NOT RECORDED**. D1-E0 remains **PO SELECTED / ACCEPTED / RECORDED**. No cohort was acquired. Stage 4 was not executed.

---

**END OF D2 COHORT ACQUISITION ANALYSIS**

**PREPARED — RECOMMENDATION NOT SELECTED.** This analysis does not grant implementation or execution authorization. D1-E0 remains accepted. Invocation remains **NOT APPROVED**.
