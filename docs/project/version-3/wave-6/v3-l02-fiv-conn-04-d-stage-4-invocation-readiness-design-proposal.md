# FIV-CONN-04-D — Stage 4 Invocation Readiness: Options and Design Proposal

```text
PROPOSED — NOT APPROVED
PROPOSED ID: D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-DESIGN
RECOMMENDATION: R0 — NOT SELECTED
ENTRY CONSTRUCTION = RESEARCHED / NOT SELECTED
INPUT COHORT = RESEARCHED / NOT SELECTED
ENVIRONMENT = RESEARCHED / NOT SELECTED
INVOCATION DESIGN = PROPOSED / NOT APPROVED
INVOCATION = NOT APPROVED / NOT EXECUTED
OQ-S4-02 = OPEN
STAGE 4 EXECUTION AUTHORIZATION = NOT ESTABLISHED
STAGE 4 = NOT EXECUTED
M1 REMAINS A UTILITY
THIS FILE DOES NOT WIRE THE ORCHESTRATOR
THIS FILE DOES NOT INVOKE THE ORCHESTRATOR OR THE CALLER
THIS FILE DOES NOT EXECUTE STAGE 4
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT REWRITE PRIOR PROPOSALS
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
DECISION DATE: NOT SET
NO SIGNATURE IS RECORDED
NO AUTOMATIC PROGRESSION
```

**Document:** Consolidated invocation options and a design proposal for a later, still unauthorized, single call  
**Proposed decision ID:** **`D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-DESIGN`** — **PROPOSED / NOT APPROVED**  
**Artifact ID:** `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-DESIGN`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-ENTRY-COHORT-ENV-DESIGN`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **PROPOSED / NOT APPROVED**  
**Recommendation:** **R0 — NOT SELECTED**  
**Nature:** **DESIGN PROPOSAL ONLY.** It uses the accepted M1 function and the accepted Caller as they exist. It does not add operational wiring. It does not call either function.

Research and this proposal do not grant implementation authorization or Stage 4 execution authorization.

This file does not rewrite:

| Historical record                              | SHA-256                                                            | Status left unchanged                          |
| ---------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| `D-CONN04-FULL-D-IA-S4-EXEC-INVOCATION`        | `4af713df7892733da8301ca9873ac7c52042c58ccd3db852f4c15c853ba919d6` | **INVOCATION NOT APPROVED** in that file       |
| `D-CONN04-FULL-D-IA-S4-EXEC-INVOCATION-DESIGN` | `ef89bd595dcb4798c2548d8d3eb66003edddf7d872240001c26e22abf51ffc22` | **PROPOSED — NOT APPROVED**                    |
| M1 architecture proposal                       | `24db8d0f8488ca9dd909b459246087f1b690b928a03afbe063fcf142dac16b60` | **PROPOSED / NOT SELECTED** in its own text    |
| M1 implementation proposal                     | `57e3bace7204660d105326d357c14c6e8078a4b06c2996efb11e4a7d25ac9e22` | **PROPOSED / NOT ESTABLISHED** in its own text |
| M1 acceptance proposal                         | `7165d8b6c6e94a22f480a415fae4962a395ab8239051973dbb9cdf16572cd06c` | **PROPOSED / NOT ACCEPTED** in its own text    |

The decisions that accepted M1, the Caller, and the subject are separate files and stay in force for those scopes only.

---

## 1. Facts the design is bound to

| Fact                                                | Evidence                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1 is accepted and remains a utility                | `orchestrateClassifyLiveConnectionAttemptsOnce` receives an Entry and a readonly array, aborts if either is missing, calls `invokeClassifyLiveConnectionAttempts` once, and returns the batch. File SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50` |
| Caller is accepted                                  | `invokeClassifyLiveConnectionAttempts` returns `entry.classifyLiveConnectionAttempts(connections)`. File SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe`                                                                                            |
| Subject                                             | Commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`, tree `8f93a971f965876e2d74f3c9815e83f6aea561d2`, parent `e6b839e0e7d75322d9626162712fa81f61147d18`                                                                                                                          |
| Caller and M1 are outside that tree                 | Both paths are absent from the commit                                                                                                                                                                                                                                          |
| Entry construction, cohort, and process environment | Researched in the three companion reports. Each is **NOT SELECTED**                                                                                                                                                                                                            |
| `OQ-S4-02`                                          | **OPEN.** VMP-1 Git baseline and attribution. The operative Stage 4 act left it **NOT ESTABLISHED**. Drafts that mark it satisfied are not the operative record                                                                                                                |
| Execution authorization                             | `D-CONN04-FULL-D-IA-S4-EXEC` is **NOT ESTABLISHED**                                                                                                                                                                                                                            |

---

## 2. Numbered options

Every option below is **NOT SELECTED**. R0 is the recommendation and is also **NOT SELECTED**, because this file cannot adopt it for the Product Owner.

### 2.1 Entry

| ID  | Option                                                  | Fit with accepted M1                                                         |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| E0  | Do not obtain an Entry                                  | The function cannot be called operationally. **Recommended companion of R0** |
| E1  | Structural test cast                                    | Unit tests only                                                              |
| E2  | `new` with doubles                                      | Existing specs only                                                          |
| E3  | New test-only factory                                   | Tests only, and only under a later test authorization if the helper is new   |
| E4  | Application factory with live collaborators, outside M1 | Possible later shape. Not authorized                                         |
| E5  | Nest lookup of the unexported provider                  | Boots `$connect` and the gate adapter. Not authorized                        |
| E6  | Export the Entry                                        | Contradicts the class header. Unfit                                          |

Detail, providers, and risks: `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08`.

### 2.2 Cohort

| ID  | Option                                                              | Fit with the explicit-array contract                            |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| C0  | Do not assemble a cohort                                            | **Recommended companion of R0**                                 |
| C1  | Empty array                                                         | Legal for the type. Not a connection cohort                     |
| C2  | Spec literals                                                       | Tests only                                                      |
| C3  | `preflight.run`                                                     | Uses `vault.list`. Unfit as Stage 4 freshness                   |
| C4  | Private `loadConnections` shape, later and explicit                 | Deterministic scan. Not an id list until frozen. Not authorized |
| C5  | `ConnectionsService.list`                                           | Missing `vaultSecretId`. Unfit without another read             |
| C6  | Named ordered ids, hydrated later to the seven fields in that order | Matches "explicit array". No ids exist. Not selected            |
| C7  | Workspace-scoped C4 or C6                                           | Workspace is unnamed                                            |

Detail: `RPT-CONN04-S4-INVOKE-COHORT-2026-11-08`.

### 2.3 Environment

| ID  | Option                                                                                                                  | Fit                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| N0  | Do not provision                                                                                                        | **Recommended companion of R0**                                                 |
| N1  | Doubles only                                                                                                            | Tests only                                                                      |
| N2  | Explicit non-secret descriptor, fail closed when `DATABASE_URL` is unset, metadata port only, URL omitted from evidence | The only listed live strategy that keeps M1 free of `process.env`. Not selected |
| N3  | Implicit `AppModule` environment                                                                                        | Unfit. Target is whatever the shell contains                                    |
| N4  | Use the connection column or Vault purpose as the process environment                                                   | Unfit. Different contracts                                                      |

Detail: `RPT-CONN04-S4-INVOKE-ENV-2026-11-08`.

### 2.4 Recommendation

**R0 — NOT SELECTED.** Leave E0, C0, and N0 in force. Do not construct an Entry, do not load a cohort, and do not provision an environment. Do not approve this design as an invocation.

A later package could propose E4 or E5 together with C6 and N2. That package would be a new decision. This file does not pre-select that combination.

---

## 3. Proposed orchestration sequence

This sequence is **proposed** for a future authorization. It is not approved, and it is not to be executed from this file. M1 stays an unregistered function. No module, controller, cron, script, or `AppModule` edit is part of the proposal.

| Step                                                                                             | Who would perform it   | Abort if                                                                                                                 |
| ------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1. Recompute the subject commit, tree, parent, five accepted blobs, Caller hashes, and M1 hashes | A later evidence check | Any mismatch, or the subject is replaced by `main`                                                                       |
| 2. Confirm `OQ-S4-02` has an explicit Product Owner disposition                                  | Product Owner record   | It is still **OPEN**. This proposal does not supply that disposition                                                     |
| 3. Confirm `D-CONN04-FULL-D-IA-S4-EXEC` exists as a separate act                                 | Product Owner record   | It is **NOT ESTABLISHED**                                                                                                |
| 4. Confirm a selected Entry option other than E0, E1, E2, and E6                                 | Product Owner record   | None is selected                                                                                                         |
| 5. Confirm a selected cohort other than C0, C1, C2, C3, and C5, plus its evidence digest         | Product Owner record   | None is selected                                                                                                         |
| 6. Confirm a selected environment other than N0, N3, and N4                                      | Product Owner record   | None is selected                                                                                                         |
| 7. Obtain the Entry outside M1                                                                   | Future authorized code | The instance is missing. M1 then throws `Entry is unnamed` and does not call the Caller                                  |
| 8. Obtain the readonly array outside M1                                                          | Future authorized code | The value is not an array. M1 then throws `connection array is unnamed` and does not call the Caller                     |
| 9. Call `orchestrateClassifyLiveConnectionAttemptsOnce(entry, connections)` once                 | Future authorized code | Any second call, any direct call to `classifyLiveConnectionAttempts` that bypasses M1, any call to `proveWriteAuthority` |
| 10. Return the batch and record the evidence in §6                                               | Future authorized code | The batch is treated as write authority or as an environment UPDATE                                                      |

Steps 7 through 10 are unreachable while steps 2 through 6 fail. They fail today.

The accepted body of step 9, already implemented and not to be edited, is:

```text
if entry is null or undefined -> throw, zero Caller calls
if connections is not an array -> throw, zero Caller calls
otherwise -> return invokeClassifyLiveConnectionAttempts(entry, connections)
         -> return entry.classifyLiveConnectionAttempts(connections)
```

Inside the method, each element is handled in order. `BATCH_ABORT` stops the loop. That stop is one invocation, not a retry and not a rollback.

---

## 4. Invocation count, idempotency, and retry

| Topic                   | Proposed rule                                                                                                | Current fact                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Count                   | One entry into M1, and therefore one Caller call, for one authorization                                      | The source calls the Caller once. The spec asserts `toHaveBeenCalledTimes(1)` |
| Empty array             | Counts as that one call and is not a cohort                                                                  | Both specs forward `[]`                                                       |
| Abort before the Caller | Counts as zero classification calls                                                                          | Throws leave the mock uncalled                                                |
| Early `BATCH_ABORT`     | Still one call. The returned `attempts` prefix is the result. Remaining elements are not visited             | Loop `break` after `stopped`                                                  |
| Retry                   | A second call is a second invocation. It needs its own authorization                                         | No idempotency key exists                                                     |
| Idempotency             | The path writes nothing, so a repeat does not undo a write. It can observe a new Vault row or a new occupant | No transaction wraps the two reads                                            |
| M1 wiring               | Remains absent                                                                                               | Module, controller, `main.ts`, and `app.module.ts` do not name the function   |

---

## 5. Preconditions and abort conditions

**Preconditions that already hold**

- M1 implementation is **ACCEPTED** at the two recorded hashes.
- The Caller is **ACCEPTED** at the two recorded hashes.
- The execution subject commit, tree, and parent match `D-CONN04-FULL-D-IA-S4-EXEC-SUBJECT`.
- The five Stage 4 blobs in that commit match `D-CONN04-FULL-D-IA-S4-ACCEPT`.

**Abort conditions that hold now and block a run**

| Condition                            | State                       |
| ------------------------------------ | --------------------------- |
| Entry option selected                | **No**                      |
| Cohort selected and digested         | **No**                      |
| Process environment selected         | **No**                      |
| `OQ-S4-02`                           | **OPEN**                    |
| `D-CONN04-FULL-D-IA-S4-EXEC`         | **NOT ESTABLISHED**         |
| This design                          | **PROPOSED / NOT APPROVED** |
| Composition of subject + Caller + M1 | **Not authorized**          |

**Abort conditions inside a future run, if one were separately authorized**

- Hash mismatch at step 1.
- Entry missing or array missing, as M1 already implements.
- `verifyConfigurationValidity` reports `DATABASE_URL` unset, under N2. N2 is not selected, so this check is not active.
- Any request to call `start`, `proveWriteAuthority`, `vault.list`, `retrieve`, or an environment UPDATE in the same authorization.
- Any request to retry after `BATCH_ABORT` inside the same authorization.

---

## 6. Evidence, audit, transaction, and rollback

| Boundary                | Proposal                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Evidence of code        | Commit, tree, parent, five blob ids, Caller SHA-256, M1 SHA-256                                                                                                                      |
| Evidence of cohort      | Ordered seven-field canonical digest from the cohort report. No URL, no ciphertext, no wrapping key, no ignored preflight flag                                                       |
| Evidence of environment | Non-secret descriptor only, under a future N2 decision. The connection column and the purpose class stay inside the batch result, where the classifier already puts them             |
| Evidence of the call    | The frozen `FivConn04DStage4BatchResult`. `operationSummary` stays null. `environmentUpdated` stays false. `writeAuthorityInvoked` stays false                                       |
| Audit writes            | None on this path. The classification method does not call the security-audit service. This proposal does not add an audit write                                                     |
| Transaction             | None around `lookupExact` and occupancy. `PrismaTransactionService.run` stays on `proveWriteAuthority`, which this call does not use                                                 |
| Rollback                | There is no classification write to roll back. Disconnecting Prisma, if a client was started, is cleanup of the client and is not a data rollback. A repeated read is not a rollback |
| Secret boundary         | Metadata `select` stays `id`, `workspaceId`, `purpose`, `state`. Full-row `listByWorkspaceId` stays off this path                                                                    |

---

## 7. `OQ-S4-02`

**Fact.** `OQ-S4-02` asks how the VMP-1 Git baseline is attributed before Stage 4 work relies on it. The operative implementation act `D-CONN04-FULL-D-IA-S4` records it **NOT ESTABLISHED**. The adopted baseline decision names commit `e6b839e0e7d75322d9626162712fa81f61147d18` and records that commit **NOT PUBLISHED**. The older acceptance file that marks `OQ-S4-02` satisfied is **NOT ADOPTED**. Product Owner statements on the M1 decisions say the question remains **OPEN**.

**Implication for this design.** Step 2 aborts while the question is open. Accepting M1 did not close it. Approving this design, if that later happened, would still not close it unless the approval text said so. This proposal's text does not say so.

**What this file does.** It leaves `OQ-S4-02` **OPEN**.

---

## 8. Tests and acceptance criteria for a later act

This proposal adds no test and runs no test. A later implementation or invocation act would need at least these criteria. They are proposed, not authorized.

| Criterion           | Pass condition                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 unchanged        | Hashes stay `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50` and `e0633dbcfb50485adeb0bead21018ff1ce4d0574adfc8fc4fec20f61a629b808` unless a new acceptance says otherwise |
| Caller unchanged    | Hashes stay `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe` and `0605a223cdb42ec55683cf7913de66c8722bea337041d4a293199180326c7fbb`                                        |
| One call            | A spy observes one Caller call and the same Entry and array references                                                                                                                       |
| Missing inputs      | The two existing throw messages fire and the Caller is not entered                                                                                                                           |
| No wiring           | `orchestrateClassifyLiveConnectionAttemptsOnce` remains absent from `connections.module.ts`, `app.module.ts`, and `main.ts`                                                                  |
| Cohort identity     | The digest of the array passed in equals the authorized digest                                                                                                                               |
| Environment refusal | Under a selected N2, an unset `DATABASE_URL` aborts before `orchestrateClassifyLiveConnectionAttemptsOnce`                                                                                   |
| Secret boundary     | Evidence fixtures contain no `DATABASE_URL`, wrapping key, or ciphertext field                                                                                                               |
| Non-authorization   | The act states that `OQ-S4-02` is unchanged unless that same act closes it, and that Stage 4 execution is a separate sentence if it is granted                                               |

Existing unit specs already cover the one-call and missing-input rows for doubles. They do not cover a live cohort or a live database. Extending them into a live run is outside this proposal.

---

## 9. What remains outside authorization

- Selecting any of E0–E6, C0–C7, or N0–N4. None is selected.
- Implementing a factory, a cohort loader, a Nest lookup, or an environment runner.
- Wiring M1 into a module, controller, cron, script, or application bootstrap.
- Invoking `orchestrateClassifyLiveConnectionAttemptsOnce`, `invokeClassifyLiveConnectionAttempts`, or `classifyLiveConnectionAttempts`.
- Invoking `classifyFivConn04LiveConnection` as an operational run.
- Approving invocation.
- Establishing `D-CONN04-FULL-D-IA-S4-EXEC`.
- Closing `OQ-S4-02`.
- Composing a commit that joins the subject, the Caller, and M1.
- Stage 5 environment UPDATE, backfill, Stages 5–8, publication, deployment, and live capital.
- Editing the accepted Stage 4, Caller, or M1 files.
- Updating the Decision Register.

---

## 10. Product Owner decisions, all open

| #   | Decision                                                                   | State                                                                |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Adopt or refuse R0                                                         | **NOT DECIDED.** Recommendation is R0, marked **NOT SELECTED**       |
| 2   | Select an Entry option                                                     | **NOT SELECTED**                                                     |
| 3   | Select a cohort option and, for C6, the ordered ids                        | **NOT SELECTED**                                                     |
| 4   | Select an environment strategy and, for N2, the non-secret target name     | **NOT SELECTED**                                                     |
| 5   | Approve or refuse `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-DESIGN`      | **NOT APPROVED**                                                     |
| 6   | Dispose `OQ-S4-02`                                                         | **OPEN.** This file does not close it                                |
| 7   | Establish or refuse `D-CONN04-FULL-D-IA-S4-EXEC`                           | **NOT ESTABLISHED**                                                  |
| 8   | Authorize a composition of the subject commit with the Caller and M1 files | **NOT AUTHORIZED**                                                   |
| 9   | Decide empty-array, duplicate-id, and already-populated inclusion rules    | **NOT DECIDED**                                                      |
| 10  | Decide whether any future retry is a new authorization                     | **NOT DECIDED.** This proposal treats a retry as a new authorization |

---

## 11. Separation of claim classes

| Class                | Content                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Facts                | §1 and the source behavior in §3 step 9 and §4 "Current fact"                                   |
| Recommendations      | R0, with E0, C0, and N0. All marked **NOT SELECTED**                                            |
| Assumptions          | A future act could choose E4 or E5 with C6 and N2. That combination is not proposed as selected |
| Unresolved questions | §10                                                                                             |

---

**END OF INVOCATION READINESS DESIGN PROPOSAL**

**PROPOSED / NOT APPROVED.** R0 is **NOT SELECTED**. Research does not grant implementation or execution authorization. The orchestrator was not invoked. Stage 4 was not executed.
