# FIV-CONN-04-D — Stage 4 D2 Cohort Acquisition Consistency Review

```text
REVIEW ONLY
VERDICT: CONSISTENT — PREPARED — RECOMMENDATION NOT SELECTED — EXECUTION BLOCKED
THIS REVIEW IS NOT A PRODUCT OWNER DECISION
D1-E0 = PO SELECTED / ACCEPTED / RECORDED
D2 COHORT ANALYSIS = PREPARED
C0 = AVAILABLE
C1 = ANALYZED
C2 = ANALYZED
D2 RECOMMENDATION = C0 — NOT SELECTED
D2 PO ACCEPTANCE = NOT RECORDED
INVOCATION = NOT APPROVED
OQ-S4-02 = OPEN
STAGE 4 = NOT EXECUTED
DECISION REGISTER = NOT MODIFIED BY THIS TASK
NO AUTOMATIC PROGRESSION
```

**Document:** Independent consistency review of the D2 Cohort Acquisition analysis and its readiness assessment  
**Artifact ID:** `REV-CONN04-S4-D2-COHORT-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-PO-D2-COHORT-ANALYSIS`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Verdict:** **CONSISTENT — PREPARED — RECOMMENDATION NOT SELECTED — EXECUTION BLOCKED**  
**Nature:** **REVIEW ONLY.** The analysis, the readiness assessment, the accepted D1 decision, and the cited source paths were checked. No source file was edited. No option was selected. No cohort was loaded. Preflight was not executed. The Caller and M1 were not invoked.

This review does not grant implementation authorization or Stage 4 execution authorization. This review does not embed its own SHA-256.

---

## 1. Records

| Record                                                   | SHA-256                                                                                                                                 | Result                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Analysis `ANL-CONN04-S4-D2-COHORT-2026-11-08`            | `42dc41bef66d3d280327e48fc8975672d128607d83e2f61715dbb0c7e1917f27`                                                                      | **PREPARED — RECOMMENDATION NOT SELECTED**                                                    |
| Readiness `ASMT-CONN04-S4-D2-COHORT-2026-11-08`          | `232d894ce8db95d1925006ef1cf4ec206f992bcc18183dfb345bd03fe1daa8eb`                                                                      | **PREPARED — RECOMMENDATION NOT SELECTED — EXECUTION BLOCKED.** Cites the analysis hash above |
| D1 decision `D-CONN04-FULL-D-IA-S4-D1`                   | `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b`                                                                      | **PO SELECTED / ACCEPTED — E0.** Unchanged                                                    |
| D1 analysis `ANL-CONN04-S4-D1-ENTRY-2026-11-08`          | `10176af8c4afb03f13f61096d5ae2b7feb619fa2bb590155d1e20e7c618eb647`                                                                      | **Match.** Unchanged                                                                          |
| Cohort research `RPT-CONN04-S4-INVOKE-COHORT-2026-11-08` | `e48fcee575512446ecce3120bb8f02a7673612de952c6dc2e91a3e7df4b306fc`                                                                      | **Match.** Unchanged                                                                          |
| Package `PKG-CONN04-S4-INVOKE-PO-2026-11-08`             | `074a88c41d6b3090381661676f9455fae042dc4e5b024c7520d7a7de1d65de67`                                                                      | **Match.** Unchanged                                                                          |
| Caller / M1                                              | `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe` / `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50` | **Match.** Not edited                                                                         |
| Accepted Entry                                           | `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163`                                                                      | **Match.** Not edited                                                                         |
| Preflight                                                | `4faf2055470b53b99561cd8c4f5c42a1637e05c820aadd4fef3a88818a93eaa4`                                                                      | **Match.** Not executed                                                                       |
| `HEAD` / `origin/main`                                   | `77caf8bfd731583a5ff7e51b95d87901916bbebc`                                                                                              | **Match** at the time of this review                                                          |
| Committed register blob                                  | `1dd9ed33eb6f3dc76c2f689ec16c8916d9816b95`                                                                                              | **Unchanged by this task.** Contains no D1 row                                                |
| Subject                                                  | `fdd14e5c294fa00930a3235868ca7b52aca70a6f` / `8f93a971f965876e2d74f3c9815e83f6aea561d2` / `e6b839e0e7d75322d9626162712fa81f61147d18`    | **Match.** Not an ancestor of `HEAD`                                                          |

---

## 2. Acceptance sentences

The analysis contains three `PO ACCEPTANCE` templates that use the token `ANALYSIS_SHA256`. The assessment contains the same three sentences with that token replaced by `42dc41bef66d3d280327e48fc8975672d128607d83e2f61715dbb0c7e1917f27`. The replacement matches the analysis file hash. Each sentence names one of C0, C1, or C2 as defined in the analysis and withholds the other two options, the package's different D2-C1 and D2-C2, any change to D1-E0, Entry construction, preflight execution, a cohort query, invocation approval, closure of `OQ-S4-02`, `D-CONN04-FULL-D-IA-S4-EXEC`, and Stage 4 execution. The C1 sentence also withholds a mapper. The C2 sentence also withholds implementation and naming of ids or filters. None of the three sentences is spoken by the analysis, the assessment, or this review.

The package's D2 templates remain bound to `PKG-CONN04-S4-INVOKE-PO-2026-11-08` and to hash `074a88c41d6b3090381661676f9455fae042dc4e5b024c7520d7a7de1d65de67`. This review did not edit them. Those templates use C1 for an ordered id list and C2 for a controlled query. The D2 analysis §1.1 states that difference. A later sentence that used the package template would accept a different proposition from a sentence that used this analysis. Both files can stand because the package was left byte-identical.

---

## 3. Claim check

| Claim in the analysis                                                                   | Independent check                                                                                                                                                                                                       | Result     |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| M1 receives an Entry and an array and does not query                                    | `orchestrateClassifyLiveConnectionAttemptsOnce` lines 13–23 throw on a null Entry and a non-array, then call the Caller                                                                                                 | **Agrees** |
| The Caller forwards the array                                                           | Lines 12–16 call `entry.classifyLiveConnectionAttempts(connections)`                                                                                                                                                    | **Agrees** |
| The accepted Entry has no cohort loader                                                 | Class at line 113. Methods include `proveWriteAuthority` at 187, `lookupVaultMetadataForConnection` at 204, and `classifyLiveConnectionAttempts` at 224. No `loadConnections`                                           | **Agrees** |
| The loop keeps caller order and aborts on a blank identifier                            | Lines 230–238 iterate the array. Lines 253–256 return `BATCH_ABORT` / `BLANK_IDENTIFIER`                                                                                                                                | **Agrees** |
| The optional preflight flag is ignored                                                  | Comment at lines 70–72 and lines 220–222                                                                                                                                                                                | **Agrees** |
| `loadConnections` is a private seven-field `findMany`                                   | Lines 66–80. `select` includes `vaultSecretId`. `orderBy` is workspace, provider, id. No transaction wrapper                                                                                                            | **Agrees** |
| `run` lists vault metadata and returns a report                                         | Lines 51–64 call `loadConnections`, `loadVaultMetadataByWorkspace`, and `buildFivConn04APreflightReport`. Return type is `FivConn04APreflightReport`                                                                    | **Agrees** |
| Vault list has no column select                                                         | `secret-vault.service.ts` lines 141–148 call `listByWorkspaceId`. Repository lines 181–185 are `findMany` without `select`. `toSecretVaultMetadata` lines 59–69 omit ciphertext fields                                  | **Agrees** |
| Report order and clock differ from the SQL order                                        | `buildFivConn04APreflightReport` lines 384–406 default `generatedAt` to `new Date().toISOString()` and sort with `localeCompare`. Preflight spec line 63 discards `orderBy`                                             | **Agrees** |
| `ConnectionsService.list` omits `vaultSecretId` from the view and orders by `createdAt` | Lines 116–121 and 764–775. `credentialsStored` is the boolean projection                                                                                                                                                | **Agrees** |
| Stage 4 freshness is `lookupExact` with four metadata columns                           | Service lines 33–71. `METADATA_SELECT` lines 22–27. `findMetadataByIdAndWorkspaceId` lines 188–196                                                                                                                      | **Agrees** |
| Module exports preflight and registers the Entry                                        | Worktree `connections.module.ts` line 49 registers the class. Line 55 exports `FivConn04APreflightService` only                                                                                                         | **Agrees** |
| `main` Entry blob is not the accepted Stage 4 file                                      | `HEAD` blob `5b65c99dd688f282015bb724dff27e10001f205d`. Worktree and subject blob `9afd147cc73f6612a7d4918f177d48481f991e7b`                                                                                            | **Agrees** |
| D1 recording commit omits the register                                                  | `git show --stat 77caf8bfd731583a5ff7e51b95d87901916bbebc` lists the three acceptance files. Register blob `1dd9ed33eb6f3dc76c2f689ec16c8916d9816b95` has no decision id. Verification §2 already records that omission | **Agrees** |
| C0 is recommended and not selected                                                      | Analysis §6.1 and the banner. Readiness §2 records the same limit                                                                                                                                                       | **Agrees** |
| Alternative sources are not options                                                     | Analysis §9 marks UP-D2-01 through UP-D2-05 **UNRESOLVED PROPOSAL — NOT AN OPTION**                                                                                                                                     | **Agrees** |

Collation versus `localeCompare`, the absence of a shared snapshot, and the actor rule for a future connection read are labeled **UNRESOLVED** or **TECHNICAL INFERENCE** in the analysis. They are not stated as executed observations. That labeling is consistent with the prohibition on running preflight and on opening a database.

---

## 4. Boundary check

| Boundary                     | Result                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| D1-E0                        | **Preserved.** Decision file hash unchanged. Draft sentences withhold any alteration |
| Option count                 | **Three.** C0, C1, and C2. No fourth selected alternative                            |
| Recommendation               | **C0, NOT SELECTED**                                                                 |
| PO acceptance                | **NOT RECORDED**                                                                     |
| Cohort load                  | **Not performed**                                                                    |
| Preflight                    | **Not executed**                                                                     |
| Entry, factory, provider     | **Not implemented.** Accepted Entry hash unchanged                                   |
| Caller and M1                | **Not invoked.** Hashes unchanged                                                    |
| `OQ-S4-02`                   | **OPEN**                                                                             |
| `D-CONN04-FULL-D-IA-S4-EXEC` | **NOT ESTABLISHED**                                                                  |
| Stage 4                      | **NOT EXECUTED**                                                                     |
| Decision Register            | **Not modified by this task**                                                        |

---

## 5. Verdict

**CONSISTENT — PREPARED — RECOMMENDATION NOT SELECTED — EXECUTION BLOCKED.**

The analysis, the readiness assessment, and the cited source agree. The recommendation is C0 and is not a selection. D1-E0 remains accepted. No cohort was acquired.

---

**END OF D2 COHORT ACQUISITION CONSISTENCY REVIEW**

**CONSISTENT.** This review does not grant implementation or execution authorization.
