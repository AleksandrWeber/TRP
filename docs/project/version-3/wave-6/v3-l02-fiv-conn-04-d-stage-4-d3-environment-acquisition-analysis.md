# FIV-CONN-04-D — Stage 4 D3 Environment Acquisition Decision Analysis

```text
RESEARCH / DECISION ANALYSIS ONLY
ARTIFACT: ANL-CONN04-S4-D3-ENV-2026-11-08
D1-E0 = PO SELECTED / ACCEPTED / RECORDED
D2-C0 = PO SELECTED / ACCEPTED / RECORDED
D3 ENVIRONMENT ANALYSIS = PREPARED
N0 = AVAILABLE
N1 = ANALYZED
N2 = ANALYZED
D3 RECOMMENDATION = N0 — NOT SELECTED
D3 PO ACCEPTANCE = NOT RECORDED
D4 = NOT APPROVED
D5 OQ-S4-02 = OPEN
D6 = NOT ESTABLISHED
INVOCATION = NOT APPROVED
STAGE 4 = NOT EXECUTED
THIS FILE DOES NOT ACQUIRE AN ENVIRONMENT
THIS FILE DOES NOT READ DATABASE_URL OR VAULT_WRAPPING_KEY
THIS FILE DOES NOT READ PROCESS ENVIRONMENT
THIS FILE DOES NOT LOAD A COHORT
THIS FILE DOES NOT RUN PREFLIGHT
THIS FILE DOES NOT CONSTRUCT AN ENTRY
THIS FILE DOES NOT INVOKE THE CLASSIFIER, THE CALLER, OR M1
THIS FILE DOES NOT SELECT A PRODUCT OWNER OPTION
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT ALTER D1-E0 OR D2-C0
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Evidence-backed Product Owner decision analysis for D3 — Environment Acquisition  
**Artifact ID:** `ANL-CONN04-S4-D3-ENV-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-PO-D3-ENVIRONMENT-ANALYSIS`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **PREPARED — RECOMMENDATION NOT SELECTED — PO ACCEPTANCE NOT RECORDED**  
**Nature:** **RESEARCH / DECISION ANALYSIS ONLY.** Source was read. No environment was acquired. `DATABASE_URL` and `VAULT_WRAPPING_KEY` were not read. `verifyConfigurationValidity` was not called. No cohort was loaded. No Entry was constructed. The accepted Caller and M1 were not invoked.

This file does not embed its own SHA-256. The readiness assessment records that hash after this file is written. A later accepting sentence must include that exact hash. A sentence in this file is a draft. It is not a Product Owner decision.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**, **UNRESOLVED PROPOSAL**.

Research and this analysis do not grant implementation authorization or Stage 4 execution authorization.

Accepted D1-E0 and accepted D2-C0 remain in force. This analysis does not reopen them.

Three uses of the word environment stay separate in this file. The connection column, the Vault purpose class, and the process database target are not substitutes for one another.

---

## 1. Baseline verified before analysis

Recomputed from file bytes and `git rev-parse` on 2026-11-08. No listed baseline item mismatched. Analysis continued.

| Record                                                      | Required                                                                   | Recomputed                                                                 | Result                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `HEAD`                                                      | `a2a643a2a8d2c6b4eb306b357c6f0d4d8d795b14`                                 | Same                                                                       | **Match.** `docs(connections): record Stage 4 D2 PO acceptance` |
| `origin/main`                                               | Same commit as `HEAD`                                                      | `a2a643a2a8d2c6b4eb306b357c6f0d4d8d795b14`                                 | **Match**                                                       |
| D1 decision `D-CONN04-FULL-D-IA-S4-D1`                      | **PO SELECTED / ACCEPTED — E0**                                            | SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b` | **Match.** Unchanged                                            |
| D2 decision `D-CONN04-FULL-D-IA-S4-D2`                      | **PO SELECTED / ACCEPTED — C0**                                            | SHA-256 `d0b66d28b0914008d78f1c7d8274b5dd10f6ff5394c2acff76acabc4a9a41255` | **Match.** Unchanged                                            |
| D2 recording commit                                         | `a2a643a2a8d2c6b4eb306b357c6f0d4d8d795b14`                                 | `HEAD`                                                                     | **Match**                                                       |
| Environment research `RPT-CONN04-S4-INVOKE-ENV-2026-11-08`  | SHA-256 `0e3aa36f625d161e497646bc7b0f769a7671c9e754a3244deea6ee3fc4f7e3f7` | Same                                                                       | **Match.** **RESEARCHED / NOT SELECTED**                        |
| Stage 4 acceptance `D-CONN04-FULL-D-IA-S4-ACCEPT`           | SHA-256 `94006f48e02406325317476885ddcf32a6aafb0d74794838cf29f12ba281e57f` | Same                                                                       | **Match.** **ACCEPTED — OPTION A**                              |
| Caller acceptance `D-CONN04-FULL-D-IA-S4-CALLER-RESULT-ACC` | SHA-256 `79a0bef1c5024a79ea56baa77e5d7f72094d3ea11b79e29fd809ceffff30d6e2` | Same                                                                       | **Match**                                                       |
| M1 acceptance `D-CONN04-FULL-D-IA-S4-M1-RESULT-ACC`         | SHA-256 `d88c5e02c83b4abe9203511eb14264ef33ad72a1d7320ec031beb12070fde30a` | Same                                                                       | **Match**                                                       |
| Caller file                                                 | SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe` | Same                                                                       | **Match**                                                       |
| M1 file                                                     | SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50` | Same                                                                       | **Match**                                                       |
| Accepted Entry                                              | SHA-256 `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163` | Same                                                                       | **Match**                                                       |
| Live classifier                                             | SHA-256 `5d0232a5ba7ac1e31daba51fa8874d8fbc93b7a7694e0c8a7faeaa92d93447c7` | Same                                                                       | **Match.** Cited by the environment research                    |

The options analyzed are exactly the three options named by this task:

| ID  | Option in this analysis                                      | What the option is                                                                                       |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| N0  | No environment acquisition; remain blocked                   | No column is read for acquisition, no purpose is mapped for acquisition, and no process target is named  |
| N1  | Derive environment from existing connection metadata/purpose | A later derivation that takes `Connection.environment` and Vault purpose as its inputs                   |
| N2  | Dedicated explicit environment acquisition boundary          | A later boundary, absent today, whose output names one environment layer and does not substitute another |

### 1.1 Same letters, different earlier meanings

**VERIFIED REPOSITORY FACT.** Package §6 and environment research §4 use N0, N1, and N2 for different propositions. Those earlier letters are not the options of this analysis.

| Letter | This analysis                                                | Package `PKG-CONN04-S4-INVOKE-PO-2026-11-08` §6 | Environment research §4                                                         |
| ------ | ------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| N0     | No environment acquisition; remain blocked                   | D3-N0 — No environment provision                | Do not provision a process environment                                          |
| N1     | Derive environment from existing connection metadata/purpose | D3-N1 — Explicit non-secret descriptor          | Test doubles only. No `PrismaClient`                                            |
| N2     | Dedicated explicit environment acquisition boundary          | D3-N2 — Controlled configuration resolution     | A later runner with a non-secret descriptor and a `DATABASE_URL` presence check |

Research N3, boot `AppModule`, and research N4, treat the connection column or Vault purpose as the process environment, are historical labels. Section 9 records them as unresolved proposals. None of them is a fourth option. None is selected.

Package SHA-256 `074a88c41d6b3090381661676f9455fae042dc4e5b024c7520d7a7de1d65de67` is unchanged. This analysis does not rewrite the package.

---

## 2. Existing environment sources

No source below was executed. No process variable was read. No connection row was loaded.

### 2.1 The connection column

**VERIFIED REPOSITORY FACT.** `ConnectionRecord.environment` is `String?` at `apps/api/prisma/schema.prisma` lines 205. The comment at lines 192–193 says the vocabulary is `live` or `testnet`, the column is nullable until FIV-CONN-04 backfill, DEMO is deferred for Connections, and the column is not Vault purpose. The Strategy B comment at lines 194–198 is a partial unique predicate for credentialed non-revoked EXCHANGE rows whose environment is non-null. That predicate is not an acquisition API.

`CONNECTION_TRADING_ENVIRONMENTS` is `live` and `testnet` (`trading-credential-environment.ts` lines 22–23). `isConnectionTradingEnvironment` (lines 31–35) accepts only those two strings.

`resolveConnectionEnvironmentForCreate` (`connection-environment.ts` lines 23–47) is create-time validation. EXCHANGE create fails closed when the value is omitted, `demo`, or any other non-member. Non-EXCHANGE create stores null when the value is omitted. The function does not read a stored row and does not read Vault purpose.

`connectionEnvironment` (`connections.service.ts` lines 845–853) projects the stored string for the metadata view. `live` and `testnet` pass through. Null and every other string become null. The comment at line 851 says unknown values are not mapped to `live`.

`FivConn04DEnvironmentBackfillWrite.assertWriteAuthorityInTransaction` (`fiv-conn-04-d-environment-backfill-write.ts` lines 30–39) proves write authority inside a transaction. The file header at lines 7–8 says the unit does not mutate connection environment columns and does not run backfill orchestration. Stage 4 classification sets `environmentUpdated: false`.

### 2.2 Purpose and the purpose-to-environment map

**VERIFIED REPOSITORY FACT.** `SecretPurpose` (`secret-purpose.ts` lines 13–20) includes `trading`, `trading_live`, `trading_testnet`, `trading_demo`, `notification`, and `ai`. `isTradingSecretPurpose` (lines 52–58) is true for the four trading values only.

`tradingEnvironmentFromPurpose` (`trading-credential-environment.ts` lines 41–55) returns:

| Purpose                                        | Result    |
| ---------------------------------------------- | --------- |
| Non-trading, including `notification` and `ai` | `null`    |
| `trading_testnet`                              | `testnet` |
| `trading_demo`                                 | `demo`    |
| `trading` and `trading_live`                   | `live`    |

`purposeForTradingEnvironment` (lines 57–63) maps `testnet` to `trading_testnet`, `demo` to `trading_demo`, and `live` to `trading_live` only. It does not return the legacy purpose `trading`. The two functions are not inverses. `trading` becomes `live`, and `live` becomes `trading_live`.

`vaultPurposeForConnection` (`connections.service.ts` lines 812–821) returns `purposeForTradingEnvironment` only when the stored column is `live` or `testnet`. A null or other column returns `undefined`. `vaultPurposesToProbe` (lines 827–838) treats a `live` column as both `trading` and `trading_live` when probing slot conflicts. One column value therefore corresponds to two purposes on that probe path and to one purpose on `purposeForTradingEnvironment`.

The file header of `trading-credential-environment.ts` lines 4–5 says environment classification comes from Vault purpose and never from a client request field. That sentence is the ENV1 contract. It is not a Stage 4 acquisition function.

### 2.3 What the accepted classifier uses

**VERIFIED REPOSITORY FACT.** `classifyFivConn04LiveConnection` (`fiv-conn-04-live-classifier.ts` lines 175–188) is pure. It fails closed on occupancy `unavailable`, then calls `classifyFivConn04AConnection`. Neither function contains `process.env` or `DATABASE_URL`.

The A classifier header (`fiv-conn-04-a-classification.ts` lines 4–5) says Vault purpose remains the runtime source of truth and `Connection.environment` is constraint and audit context only.

For one connection the A function (`classifyFivConn04AConnection`, lines 180–194 and 251–284) uses the column before it uses purpose:

| Observed column and type                                                             | Result before purpose is read |
| ------------------------------------------------------------------------------------ | ----------------------------- |
| Not EXCHANGE, column null                                                            | `NON_EXCHANGE_NULL`           |
| Not EXCHANGE, column non-null                                                        | `ALREADY_POPULATED`           |
| EXCHANGE, column non-null, including `live`, `testnet`, `demo`, and any other string | `ALREADY_POPULATED`           |
| EXCHANGE, column null                                                                | Purpose path below            |

On the null-column EXCHANGE path, purpose is read only after status, vault id, workspace, and vault state checks. Then:

| `tradingEnvironmentFromPurpose`                        | Classification                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `null`                                                 | `INVALID_CREDENTIAL`                                                         |
| `demo`                                                 | `NON_LIVE_PURPOSE`                                                           |
| `testnet`                                              | `NON_LIVE_PURPOSE`                                                           |
| `live`, and the purpose is `trading` or `trading_live` | Continues to the occupancy check, then `ELIGIBLE_LIVE` when the slot is free |
| Any other surviving value                              | `PURPOSE_MISMATCH`                                                           |

The classifier does not write the column. It does not replace a non-null column with the purpose class. A non-null column and a contradictory purpose never meet inside this function, because the non-null column returns first.

`projectFivConn04DLiveSlotOccupancy` returns before its query when `connection.environment !== null` (`fiv-conn-04-d-live-slot-occupancy.ts` lines 55–56). The occupancy query that does run looks for another row with `environment: 'live'` (lines 65–76).

The accepted Caller and M1 contain no `process.env`, no `DATABASE_URL`, and no `VAULT_WRAPPING_KEY`. M1 has no environment parameter. The M1 spec at lines 108–109 forbids `process.env` in the orchestrator source.

### 2.4 Process variables and configuration validation

**VERIFIED REPOSITORY FACT.** `apps/api/prisma/schema.prisma` lines 5–8 set the Prisma datasource URL to `env("DATABASE_URL")`. `PrismaService.onModuleInit` calls `$connect` (`prisma.module.ts` lines 8–10). That call is not on the Caller or the pure classifier.

`verifyConfigurationValidity` (`configuration-validity.ts` lines 13–39) defaults its argument to `process.env`. It appends `DATABASE_URL is not set` when the trimmed value is empty. In production `NODE_ENV` it also checks `JWT_SECRET`. It returns `{ valid, issues, detail }`. It does not throw. It does not echo the URL. It is not referenced by the Caller, M1, or either classifier. This analysis did not call it.

`SecretVaultModule` resolves `VAULT_WRAPPING_KEY` lazily and states that a missing key does not fail module boot (`secret-vault.module.ts` lines 21 and 36–38). `lookupExact` selects `id`, `workspaceId`, `purpose`, and `state`. It does not call `retrieve`. The wrapping key is not an input to `tradingEnvironmentFromPurpose`.

No symbol in the accepted Stage 4 path acquires an environment. Create-time resolution, the metadata-view projection, the purpose map, and the configuration report are existing functions. None of them is an acquisition API for a Stage 4 invocation.

### 2.5 Tests that already exist

| Test                                               | What it shows                                                                                                    | What it does not show                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `connection-environment.spec.ts`                   | EXCHANGE create requires `live` or `testnet`. `demo` and omission fail closed. Non-EXCHANGE omission stores null | It does not read a stored cohort and does not map purpose |
| `connections.service.ts` `connectionEnvironment`   | Unknown stored strings become null in the view and are not mapped to `live`                                      | The Stage 4 classifier does not use this helper           |
| A classifier lines 192–194                         | Any non-null EXCHANGE column is `ALREADY_POPULATED` before purpose                                               | A unit of that branch is not an acquisition               |
| M1 spec lines 108–109                              | The orchestrator source must not contain `process.env`                                                           | It does not name a database target                        |
| `fiv-conn-04-d-environment-backfill-write.spec.ts` | The write unit source must not assign `environment`                                                              | Stage 4 does not perform the backfill UPDATE              |

### 2.6 Suitability of the current source

| Source                                  | Suitable as a Stage 4 environment acquisition                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted Caller and M1                  | No environment parameter and no process read                                                                                             |
| Pure classifier                         | Consumes a column value and a purpose that the caller already supplied. It does not obtain them                                          |
| `tradingEnvironmentFromPurpose`         | A pure map from one purpose to one class. It does not read a connection and does not name `DATABASE_URL`                                 |
| `Connection.environment`                | A stored column. Reading it for a future invocation requires a connection identity. D2-C0 acquires no cohort                             |
| `resolveConnectionEnvironmentForCreate` | Create validation. It rejects `demo`. It is not a read of an existing row                                                                |
| `verifyConfigurationValidity`           | A report that a URL string is present or absent. Calling the default argument reads `process.env`. The report is not on the Stage 4 path |
| `FivConn04DEnvironmentBackfillWrite`    | Write-authority scaffold. It does not write the column                                                                                   |

**TECHNICAL INFERENCE.** The repository already contains the maps a derivation would call. It does not contain a function that acquires an environment for Stage 4. Using the purpose map as the process target would give the map a job it does not have.

---

## 3. N1 — Derive from existing connection metadata and purpose

N1 means a later Stage 4 environment would be derived from the connection column and Vault purpose. No derivation was implemented. No row was read.

### 3.1 Whether the purpose map is authoritative

**VERIFIED REPOSITORY FACT.** The A classifier header says Vault purpose is the runtime source of truth and the column is constraint and audit context. That authority applies on the null-column EXCHANGE path, after the column gate. On every non-null EXCHANGE path the function returns `ALREADY_POPULATED` and does not call `tradingEnvironmentFromPurpose`.

The purpose map is therefore authoritative for the class of a null-column EXCHANGE candidate. It is not authoritative for the stored column, and it is not authoritative for `DATABASE_URL`. `purposeForTradingEnvironment` does not restore `trading` from `live`, so a derivation that ran the map in both directions would change a legacy purpose into `trading_live`.

### 3.2 Whether the column and the purpose can disagree

**VERIFIED REPOSITORY FACT.** They can disagree, and the accepted classifier does not reconcile them.

| Pair                                                                                   | What the accepted classifier does                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Column `live` or `testnet`, purpose `trading_testnet` or `trading_demo` or non-trading | Returns `ALREADY_POPULATED` and does not read purpose                          |
| Column null, purpose `trading` or `trading_live`                                       | Can reach `ELIGIBLE_LIVE`                                                      |
| Column null, purpose `trading_testnet` or `trading_demo`                               | `NON_LIVE_PURPOSE`                                                             |
| Column null, purpose `notification` or `ai`                                            | `INVALID_CREDENTIAL`                                                           |
| Column any non-null string that is not `live` or `testnet`                             | Classifier: `ALREADY_POPULATED`. Metadata view `connectionEnvironment`: `null` |

**TECHNICAL INFERENCE.** A derivation that prefers purpose would override the column gate the classifier actually uses. A derivation that prefers the column would ignore the header's statement that purpose is the runtime source of truth. A derivation that prefers the view helper would hide unknown strings that the classifier treats as already populated. N1 has no rule in the current source for which of those three readers wins. This analysis does not choose one.

### 3.3 Missing, invalid, and ambiguous values

| Input                                            | Existing behavior                                                                               | Acquisition result                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Column omitted on EXCHANGE create                | `environment_required`                                                                          | Create rejection. Not a read of an existing row                       |
| Column null on a stored EXCHANGE row             | Candidate path. Purpose decides the class                                                       | Null is a meaningful Stage 4 input, not a missing process target      |
| Column `demo`                                    | Create rejects it. A stored `demo`, if one existed, is non-null and becomes `ALREADY_POPULATED` | The create rule and the classifier rule differ                        |
| Unknown column string                            | View returns null. Classifier returns `ALREADY_POPULATED` for EXCHANGE                          | Two readers, two results                                              |
| Purpose missing because vault metadata is absent | `DANGLING_VAULT_BINDING` or `AMBIGUOUS` when the vault id is blank                              | The class is not invented                                             |
| Purpose present and non-trading                  | `INVALID_CREDENTIAL`                                                                            | `tradingEnvironmentFromPurpose` returns null. That null is not `live` |

`AMBIGUOUS` in the classifier is a null-column EXCHANGE row with a blank vault id. It is not an ambiguous environment string.

### 3.4 D2-C0 and the absence of a cohort

**VERIFIED REPOSITORY FACT.** D2-C0 is **PO SELECTED / ACCEPTED**. No cohort is acquired. The column and the purpose are properties of a connection. `lookupExact` needs a `workspaceId` and a `vaultSecretId` that the cohort would have carried. The Caller receives those fields on the array. It does not discover them.

**TECHNICAL INFERENCE.** Deriving an environment from connection metadata requires a connection. Under D2-C0 there is no accepted connection. A scan that discovers rows in order to derive their environments is cohort acquisition, which D2-C0 withholds. A derivation that runs on an unnamed example is not an operational environment. N1 cannot be performed while D2-C0 remains accepted. Describing N1 does not load a cohort and does not change D2.

D1-E0 likewise withholds the Entry. A live read of the column through that Entry is Entry use. N1 does not construct the Entry.

### 3.5 Risks of deriving without a cohort

- The derivation has no connection to bind, so any value it produced would be an invention or a hidden scan.
- Copying the purpose class into `Connection.environment` would be a column write. The backfill write unit does not perform that write, and Stage 4 sets `environmentUpdated: false`.
- Copying the purpose class or the column into the process target would make `trading_live` stand in for `DATABASE_URL`. The map does not return a URL. Research §4 called that substitution unfit. This analysis records it as an unresolved proposal in §9. It is not what N1 is authorized to do, because N1 is not selected and no derivation is authorized.
- `trading` and `trading_live` both become `live`, then the reverse map keeps only `trading_live`. A derived value is not a lossless record of the purpose that produced it.
- The list-view helper and the classifier disagree on unknown strings. A derivation that picked one silently would change the other's result.

### 3.6 Tests a later N1 authorization would still need

This analysis does not add them and does not choose N1.

- The chosen reader is named: classifier column gate, purpose map, or view projection.
- A fixture where the column is `live` and the purpose is `trading_testnet` shows the classifier stopping at `ALREADY_POPULATED`.
- A fixture where the column is null and the purpose is `trading` shows `live` without writing the column.
- The test double does not call `findMany`, `vault.list`, or `verifyConfigurationValidity(process.env)`.
- No assertion treats the class as `DATABASE_URL`.

Existing create-environment tests do not discharge that list.

### 3.7 N1 conclusion

The purpose map is a pure function and is the classifier's source of truth only after a null EXCHANGE column. The column and the purpose can disagree. The accepted classifier does not derive one from the other, and it does not read process environment. N1 cannot run while D2-C0 withholds every connection. N1 stays analyzed. It is not selected.

---

## 4. N2 — Dedicated explicit environment acquisition boundary

N2 means a future boundary whose only job is to acquire one named environment layer. That boundary is not in the repository. This section specifies the contract a later authorization would have to meet. It does not implement the boundary and does not choose the layer.

### 4.1 Inputs and output

| Contract item    | Proposed content                                                                                 | Chosen by this analysis                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Output           | A non-secret record that names exactly one layer and the value of that layer                     | The three layers are the column, the purpose class, and a process-target label. The record is not created |
| Forbidden output | `DATABASE_URL`, `VAULT_WRAPPING_KEY`, ciphertext, and a value copied from one layer onto another | Part of the proposed boundary                                                                             |
| Input            | A request that states the layer and the value's origin                                           | **Not chosen**                                                                                            |
| Origin A         | A Product Owner or operator supplies a non-secret label. The label is not a URL                  | **UNRESOLVED PROPOSAL** inside N2. See §9                                                                 |
| Origin B         | A derivation from column and purpose, only after a later decision has a connection               | **UNRESOLVED PROPOSAL** inside N2. See §9. Under current D2-C0 there is no connection                     |
| Exclusions       | Cohort `findMany`, preflight `run`, Entry construction, Caller, M1, and `environment` UPDATE     | Part of the proposed boundary. Not implemented                                                            |

The task asks whether the value should be supplied or derived. Both origins fit inside N2 and contradict each other. This analysis does not pick one. Until a later record picks one, N2 has a separation rule and no operational input.

### 4.2 Validation and failure

**TECHNICAL INFERENCE.** A boundary that meets the table fails closed:

- The request names no layer: no value is returned and no other layer is consulted.
- The named layer is absent: the result is an absence. `tradingEnvironmentFromPurpose` returning null stays null. The view helper's null stays null. Neither null becomes `live`.
- The named layer is the process target: the evidence records the label. It does not record the URL. `verifyConfigurationValidity` may later be used with a fixture argument. Its default `process.env` argument is not the Stage 4 call. A failed report aborts before any Prisma construction. The helper does not do that abort by itself today.
- The named layer is the column or the purpose class: the boundary returns that layer's value and a statement of the other layer's value when both were supplied. It does not reconcile them. Reconciliation would be a different decision.

Determinism is the named input. The purpose map is a pure function of one purpose. The column is the stored string, not the view projection, unless the later record says the projection is the layer. A second acquisition is the same result only while that input is unchanged.

Auditability is the record: layer name, value, origin (supplied or derived), and the hashes of D1 and D2 that were in force. The URL and the wrapping key stay out of the record.

### 4.3 D1-E0, D2-C0, and hidden authority

The proposed boundary does not construct `Conn04SystemJobMigrationEntry` and does not query connections. D1-E0 remains Entry acquisition blocked. D2-C0 remains cohort acquisition blocked. N2 does not satisfy either decision and does not modify either decision file.

M1 still requires an Entry and an array. An environment record, even if one later existed, is not an Entry and is not a cohort. Passing it to M1 is not possible, because M1 has no environment parameter. Selecting N2 would not approve invocation.

The boundary creates hidden acquisition if it discovers connection rows, calls preflight, calls `lookupExact` for an unnamed id, or reads `process.env` in order to print a target. Those calls are outside the proposed contract. A label that merely says "the shell environment" is research N3, boot whatever the shell has, and is an unresolved proposal in §9. It is not a completed N2 input.

Read-only: the boundary does not UPDATE `environment` and does not call `proveWriteAuthority`. Capability is the single named read or the supplied label. A column read is a connection read and is unavailable while D2-C0 stands, unless a later decision changes D2. This analysis does not change D2.

### 4.4 Tests and complexity

Tests that would belong to a later authorization, and that are not added here:

- A missing layer returns absence and does not consult another layer.
- `trading` and `trading_live` both yield the class `live` when the named layer is purpose, and the record still shows which purpose was supplied.
- A non-null column and a contradictory purpose are both present in the record and are not merged.
- The test does not open `process.env`, does not call `findMany`, and does not construct an Entry.
- `verifyConfigurationValidity` is called only with a fixture object when the named layer is the process target.

Implementation complexity is one later function and those tests, behind a separate implementation authorization that names the file. No file is named for creation.

### 4.5 N2 conclusion

N2 can be specified so one layer is named, the other two stay unsubstitued, and D1-E0 and D2-C0 stay in force. The choice between a supplied label and a derivation is unresolved. The boundary does not exist. N2 stays analyzed. It is not selected.

---

## 5. N0 — No environment acquisition

N0 acquires nothing. No column is read for this decision. No purpose is mapped for this decision. No process target is named.

### 5.1 What remains blocked

| Item                              | State under N0                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| Environment acquisition           | No derived class, no supplied label, and no process target                                    |
| Cohort                            | D2-C0 continues to block acquisition                                                          |
| Entry                             | D1-E0 continues to block acquisition                                                          |
| M1                                | No environment parameter exists to fill. The call stays without an Entry and without a cohort |
| Invocation                        | **NOT APPROVED**                                                                              |
| `OQ-S4-02`                        | **OPEN**                                                                                      |
| D4                                | **NOT APPROVED**                                                                              |
| D6 / `D-CONN04-FULL-D-IA-S4-EXEC` | **NOT ESTABLISHED**                                                                           |
| Stage 4                           | **NOT EXECUTED**                                                                              |

### 5.2 What is preserved

D1-E0 stays **PO SELECTED / ACCEPTED / RECORDED**. D2-C0 stays **PO SELECTED / ACCEPTED / RECORDED**. The three environment layers stay separate. The purpose map stays a pure function. The column stays unwritten by Stage 4. `verifyConfigurationValidity` stays off the Stage 4 path. The Decision Register is not edited.

### 5.3 What can be prepared independently

The column comment, the purpose map, the create validator, the view projection, and the configuration report are already in source and are cited above. Existing unit tests already pass fixture arguments. This analysis is the D3 preparation. None of that preparation reads `process.env` or authorizes a run.

### 5.4 Conditions for reconsideration

A later Product Owner sentence can refuse N0 only by matching the N1 sentence or the N2 sentence in §8, including the analysis hash recorded in the readiness assessment. That sentence still would not:

- derive an operational value,
- implement N2,
- load a cohort,
- construct an Entry,
- read `DATABASE_URL` or `VAULT_WRAPPING_KEY`,
- change D1-E0 or D2-C0,
- approve invocation,
- close `OQ-S4-02`,
- establish `D-CONN04-FULL-D-IA-S4-EXEC`,
- or execute Stage 4.

An N1 sentence would still leave the missing cohort and the unresolved reader rule in §3. An N2 sentence would still need a later implementation authorization, a named layer, and a named origin before any read. Invocation would still require an Entry decision other than E0, a cohort decision other than C0, a D4 approval, a D5 disposition that a later sentence says is sufficient, and a separate D6 act. Those gates are outside D3.

---

## 6. Comparative assessment

| Criterion                           | N0 — no acquisition                                        | N1 — derive from column and purpose                                                                                           | N2 — dedicated boundary                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Source authority                    | No source is promoted                                      | Purpose is authoritative only on the null-column EXCHANGE path. The column gate runs first. The view helper is a third reader | The later record names one layer. No layer is promoted by this analysis                                                             |
| Consistency with connection purpose | The current disagreement is left untouched                 | A derivation has to pick a winner the classifier does not pick. The reverse map drops legacy `trading`                        | Both values can be recorded without merging them. The merge rule is not chosen                                                      |
| Correctness                         | No value, so no value assigned to the wrong layer          | Cannot supply `DATABASE_URL`. Can mis-state the classifier by overriding the column gate                                      | Correct when the output names one layer and refuses to copy it onto another. Not implemented                                        |
| Determinism                         | Nothing to reproduce                                       | The purpose map is pure. The column and the purpose of a real row are not available under D2-C0                               | Deterministic for a named input. The input is not named                                                                             |
| Validation                          | No check is invoked                                        | Create validation, the view projection, and the classifier disagree on `demo` and on unknown strings                          | Fail closed on a missing named layer. `verifyConfigurationValidity` stays a report unless a later record puts it in front of Prisma |
| Side-effect risk                    | No read and no write                                       | A hidden scan would be a cohort load. A column update would be a backfill write. Neither is N1 as it exists                   | Proposed as a read or a supplied label. UPDATE and `proveWriteAuthority` are outside it                                             |
| Security and capability exposure    | No URL, no wrapping key, no connection row                 | Reading purpose for a real row needs vault metadata for a connection D2-C0 does not name                                      | The URL and the wrapping key stay out of the record. A shell-inherited URL is outside the contract                                  |
| Testability                         | Existing fixture tests remain. They are not an acquisition | Needs the reader rule before a new test means anything                                                                        | A fixture object can prove absence and non-substitution. That test is not added here                                                |
| Implementation complexity           | No source change                                           | No new function, and the current maps still do not acquire a Stage 4 environment                                              | One later function and tests, after a separate authorization names the file                                                         |
| Compatibility with D1-E0 and D2-C0  | Preserves both blocks                                      | Cannot read a connection without a cohort, and cannot use the Entry that D1-E0 withholds                                      | Must not query a cohort and must not construct an Entry. Still cannot call M1                                                       |

### 6.1 Recommendation

**RECOMMENDATION — NOT SELECTED.** N0.

**Confidence:** **HIGH** that N0 is the option to recommend while D1-E0 and D2-C0 remain accepted and no Stage 4 function acquires an environment. **The recommendation is not a selection.**

Reasoning:

1. D1-E0 withholds the Entry. D2-C0 withholds every connection. The column and the purpose belong to a connection. The process target belongs to a live Prisma client. None of those inputs is accepted for a run.
2. The Caller, M1, and both classifiers do not read `process.env`. M1 has no environment parameter. An acquired value has nowhere to go on the accepted call.
3. N1's purpose map is real and pure, and it is not an acquisition. The classifier applies it only after a null column. The column, the purpose, and the view helper can disagree. Deriving a winner would change the accepted contract. Deriving anything operationally would require a connection D2-C0 does not provide.
4. N2 describes a boundary that is absent. Its layer and its origin, supplied or derived, are unresolved. Describing the contract does not create the function.
5. Invocation is **NOT APPROVED**. `OQ-S4-02` is **OPEN**. D4 is **NOT APPROVED**. D6 is **NOT ESTABLISHED**. A D3 choice does not by itself authorize a run.
6. N0 adds no source, no read, and no register row. It leaves D1-E0, D2-C0, the Caller, M1, and the accepted Entry bytes unchanged.

**Conditional observation, not a second recommendation and not a selection.** If a later Product Owner statement refuses N0, derivation from column and purpose still needs a connection and still cannot name `DATABASE_URL`. A dedicated boundary is the option in this analysis that can name one layer and refuse to copy it onto another, and that specification would still need its own implementation authorization, a named layer, and a named origin. This sentence does not select N2.

---

## 7. Decision draft

This section is a draft for a later Product Owner decision. It is not that decision. `D3 PO ACCEPTANCE = NOT RECORDED`.

| Draft item                   | Content                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision ID                  | `D-CONN04-FULL-D-IA-S4-D3`                                                                                                                                                   |
| Decision status in this file | **DRAFT — NOT RECORDED**                                                                                                                                                     |
| Options                      | N0 — no environment acquisition; remain blocked. N1 — derive environment from existing connection metadata/purpose. N2 — dedicated explicit environment acquisition boundary |
| Recommended option           | **N0 — NOT SELECTED**                                                                                                                                                        |
| D1                           | Remains `D-CONN04-FULL-D-IA-S4-D1` = **PO SELECTED / ACCEPTED — E0**. This draft does not edit that decision                                                                 |
| D2                           | Remains `D-CONN04-FULL-D-IA-S4-D2` = **PO SELECTED / ACCEPTED — C0**. This draft does not edit that decision                                                                 |
| Register                     | This draft does not add a D3 row                                                                                                                                             |

### 7.1 Rationale

The accepted call has no environment parameter. The classifier already receives a column and a purpose from the caller and does not obtain them. Purpose is the runtime source of truth only after a null EXCHANGE column. The process database target is a third layer. D1-E0 and D2-C0 leave the Entry and the connection unacquired, so none of the three layers can be obtained for a run. The draft recommendation is to acquire nothing.

### 7.2 Limitations

- N1 cannot be treated as already able to produce a Stage 4 environment. The maps exist. The acquisition does not.
- N2's supplied label and N2's derivation are unresolved proposals inside that option. This draft does not choose between them, and it does not choose the layer.
- Package D3-N1 and package D3-N2 are different propositions that share letters with this draft. An acceptance of this draft must cite this analysis, not the package letter alone.
- No environment record exists, because no environment was acquired.
- The worktree Decision Register is not edited.

### 7.3 Acceptance criteria

A later recording of `D-CONN04-FULL-D-IA-S4-D3` is valid only when all of the following hold:

1. The spoken sentence is exactly one of the three sentences in §8, with the analysis SHA-256 from the readiness assessment in place of `ANALYSIS_SHA256`.
2. The sentence names one of N0, N1, or N2 as defined in §1 of this analysis.
3. D1 decision bytes remain SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b`, and D2 decision bytes remain SHA-256 `d0b66d28b0914008d78f1c7d8274b5dd10f6ff5394c2acff76acabc4a9a41255`, unless a separate decision says otherwise. This D3 draft is not that separate decision.
4. The recording does not acquire an environment, does not read `DATABASE_URL` or `VAULT_WRAPPING_KEY`, does not load a cohort, does not run preflight, does not construct an Entry, does not invoke the Caller or M1, does not close `OQ-S4-02`, and does not establish `D-CONN04-FULL-D-IA-S4-EXEC`.
5. Accepted Caller, M1, and Entry hashes remain the hashes in §1.
6. An N1 or N2 sentence is an option selection only. It is not implementation authorization and not execution authorization.

This analysis meets none of those recording steps. The criteria describe a future recording. They do not perform it.

### 7.4 Exact PO acceptance statements

These sentences are drafts. They are not spoken. Replace `ANALYSIS_SHA256` with the SHA-256 of this file recorded by the readiness assessment. Any other wording is not acceptance of this analysis.

```text
PO ACCEPTANCE: I select D3 option N0 in ANL-CONN04-S4-D3-ENV-2026-11-08 at SHA-256 ANALYSIS_SHA256. No environment is acquired. Environment acquisition stays blocked. This statement selects only D3-N0 as defined in that analysis. It does not select N1 or N2. It does not select the package D3-N1 descriptor or the package D3-N2 configuration check. It does not alter D1-E0 or D2-C0. It does not construct an Entry. It does not load a cohort. It does not read DATABASE_URL or VAULT_WRAPPING_KEY. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D3 option N1 in ANL-CONN04-S4-D3-ENV-2026-11-08 at SHA-256 ANALYSIS_SHA256. The environment source under consideration is derivation from connection metadata and Vault purpose. This statement does not derive a value. It does not read a connection. It does not load a cohort. It does not select N0 or N2. It does not treat the purpose class as DATABASE_URL. It does not alter D1-E0 or D2-C0. It does not construct an Entry. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D3 option N2 in ANL-CONN04-S4-D3-ENV-2026-11-08 at SHA-256 ANALYSIS_SHA256. A later implementation authorization may define a dedicated explicit environment boundary that names one layer and does not copy it onto another. This statement does not implement that boundary. It does not name the layer. It does not name whether the value is supplied or derived. It does not read DATABASE_URL or VAULT_WRAPPING_KEY. It does not select N0 or N1. It does not alter D1-E0 or D2-C0. It does not construct an Entry. It does not load a cohort. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

---

## 8. What this analysis does not do

| Action                                  | State                                     |
| --------------------------------------- | ----------------------------------------- |
| Environment acquisition                 | **Not performed**                         |
| `DATABASE_URL` and `VAULT_WRAPPING_KEY` | **Not read**                              |
| `verifyConfigurationValidity`           | **Not called**                            |
| Cohort acquisition                      | **Not performed.** D2-C0 remains accepted |
| Preflight execution                     | **Not performed**                         |
| Entry construction                      | **Not performed.** D1-E0 remains accepted |
| Caller or M1 invocation                 | **Not performed**                         |
| `OQ-S4-02`                              | **OPEN**                                  |
| Execution authorization                 | **NOT ESTABLISHED**                       |
| Stage 4                                 | **NOT EXECUTED**                          |
| Option selection                        | **NOT SELECTED**                          |
| Accepted implementation files           | **Not modified**                          |
| D1 and D2 decisions                     | **Not modified**                          |
| Decision Register                       | **Not modified**                          |

---

## 9. Unresolved questions and unresolved proposals

Unresolved proposals are not options. They are not selected. They do not create a fourth alternative.

| ID       | Item                                                                                    | State                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| UQ-D3-01 | Which layer a future N2 record acquires: column, purpose class, or process-target label | **UNRESOLVED.** No layer was chosen                                                                                                              |
| UQ-D3-02 | Whether a future N2 value is supplied by a Product Owner or operator, or derived        | **UNRESOLVED.** Both origins are inside N2. Neither was chosen                                                                                   |
| UQ-D3-03 | The non-secret name of a database target                                                | **UNRESOLVED.** No label was assigned                                                                                                            |
| UQ-D3-04 | Whether production `NODE_ENV` is in scope                                               | **UNRESOLVED.** The validity helper uses it for JWT only                                                                                         |
| UQ-D3-05 | Whether an unknown column string is `ALREADY_POPULATED` or null                         | **UNRESOLVED.** The classifier and `connectionEnvironment` disagree. No reader was selected                                                      |
| UQ-D3-06 | How a non-null column and a contradictory purpose are recorded together                 | **UNRESOLVED.** The classifier returns before purpose. This analysis does not add a reconciliation rule                                          |
| UQ-D3-07 | Whether a failed `verifyConfigurationValidity` aborts before Prisma construction        | **UNRESOLVED.** The helper returns a report and does not throw                                                                                   |
| UP-D3-01 | Package D3-N1, an explicit non-secret descriptor                                        | **UNRESOLVED PROPOSAL — NOT AN OPTION.** It is not this analysis's N1. It can later be named as N2 origin A                                      |
| UP-D3-02 | Package D3-N2, controlled configuration resolution                                      | **UNRESOLVED PROPOSAL — NOT AN OPTION.** It is not this analysis's N2 by itself. A later N2 record could cite the helper. This analysis does not |
| UP-D3-03 | Research N1, test doubles only                                                          | **UNRESOLVED PROPOSAL — NOT AN OPTION.** A historical label. Current unit specs already use doubles. That is not an operational environment      |
| UP-D3-04 | Research N2, a descriptor plus a `DATABASE_URL` presence check outside M1               | **UNRESOLVED PROPOSAL — NOT AN OPTION.** A possible later shape of this analysis's N2. Not selected                                              |
| UP-D3-05 | Research N3, boot `AppModule` and inherit the shell                                     | **UNRESOLVED PROPOSAL — NOT AN OPTION.** The target would be implicit. It is outside N2                                                          |
| UP-D3-06 | Research N4, treat the column or the purpose class as the process environment           | **UNRESOLVED PROPOSAL — NOT AN OPTION.** The map does not return a URL. Using it as `DATABASE_URL` changes the accepted classifier inputs        |

---

## 10. Result

**D3 ENVIRONMENT ANALYSIS = PREPARED.**

N0 is available. N1 and N2 are analyzed. The recommendation is N0 and is **NOT SELECTED**. D3 acceptance is **NOT RECORDED**. D1-E0 and D2-C0 remain **PO SELECTED / ACCEPTED / RECORDED**. No environment was acquired. Stage 4 was not executed.

---

**END OF D3 ENVIRONMENT ACQUISITION ANALYSIS**

**PREPARED — RECOMMENDATION NOT SELECTED.** This analysis does not grant implementation or execution authorization. D1-E0 and D2-C0 remain accepted. Invocation remains **NOT APPROVED**.
