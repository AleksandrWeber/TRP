# FIV-CONN-04-D — Stage 4 Implementation Design Analysis

```text
RESEARCH / DESIGN ANALYSIS ONLY
ARTIFACT: ANL-CONN04-S4-IMPL-DESIGN-2026-11-08
D1-E0 = PO SELECTED / ACCEPTED / RECORDED
D2-C0 = PO SELECTED / ACCEPTED / RECORDED
D3-N0 = PO SELECTED / ACCEPTED / RECORDED
D4-N0 = PO SELECTED / ACCEPTED / RECORDED
IMPLEMENTATION DESIGN = PREPARED
FIRST CODE INCREMENT = NONE CURRENTLY AUTHORIZED
RECOMMENDATION = NO CODE INCREMENT — NOT A PO SELECTION
OQ-S4-02 = OPEN
D6 = NOT ESTABLISHED
INVOCATION = NOT APPROVED
STAGE 4 = NOT EXECUTED
THIS FILE DOES NOT IMPLEMENT CODE
THIS FILE DOES NOT INVOKE THE CALLER OR M1
THIS FILE DOES NOT ACQUIRE AN ENTRY, A COHORT, OR AN ENVIRONMENT
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
NO AUTOMATIC PROGRESSION
```

**Document:** Repository-grounded implementation design for FIV-CONN-04-D Stage 4  
**Artifact ID:** `ANL-CONN04-S4-IMPL-DESIGN-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-IMPL-DESIGN`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **PREPARED — NO CODE INCREMENT CURRENTLY AUTHORIZED**  
**Nature:** **DESIGN ONLY.** Source and accepted decisions were read. No source file was edited. The Caller and M1 were not invoked. No Entry, cohort, or environment was acquired.

This file does not embed its own SHA-256. The readiness assessment records that hash after this file is written. This design is not a Product Owner decision and does not change D1-E0, D2-C0, D3-N0, or D4-N0.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **PROPOSAL**, **RECOMMENDATION**.

---

## 1. Baseline

Recomputed on 2026-11-08. No listed item mismatched. Design continued.

| Record                                            | Required                                                                   | Recomputed | Result                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `HEAD` and `origin/main`                          | `603356de58a83e28545449536623770eb229b632`                                 | Same       | **Match.** `docs(connections): record Stage 4 D4 PO acceptance` |
| Parent                                            | `a91e14de8be16a2c15bfff822306a22eb46970fc`                                 | Same       | **Match**                                                       |
| D4 decision `D-CONN04-FULL-D-IA-S4-D4`            | SHA-256 `5f4428298b6e9bf6175668a41a0e29dda98717d91320e320ad7af7f9b7c20044` | Same       | **Match.** **PO SELECTED / ACCEPTED — N0**                      |
| D3 decision `D-CONN04-FULL-D-IA-S4-D3`            | SHA-256 `528dd3b96a47b6b563318e832f742abd51bbe3d286169182128905d1899f011b` | Same       | **Match.** **PO SELECTED / ACCEPTED — N0**                      |
| D2 decision `D-CONN04-FULL-D-IA-S4-D2`            | SHA-256 `d0b66d28b0914008d78f1c7d8274b5dd10f6ff5394c2acff76acabc4a9a41255` | Same       | **Match.** **PO SELECTED / ACCEPTED — C0**                      |
| D1 decision `D-CONN04-FULL-D-IA-S4-D1`            | SHA-256 `5229763159981f55a4d6d227aeb4603be6f736c44ecc08df54cf3b61dd8e6b3b` | Same       | **Match.** **PO SELECTED / ACCEPTED — E0**                      |
| Stage 4 acceptance `D-CONN04-FULL-D-IA-S4-ACCEPT` | SHA-256 `94006f48e02406325317476885ddcf32a6aafb0d74794838cf29f12ba281e57f` | Same       | **Match**                                                       |
| Caller acceptance                                 | SHA-256 `79a0bef1c5024a79ea56baa77e5d7f72094d3ea11b79e29fd809ceffff30d6e2` | Same       | **Match**                                                       |
| M1 acceptance                                     | SHA-256 `d88c5e02c83b4abe9203511eb14264ef33ad72a1d7320ec031beb12070fde30a` | Same       | **Match**                                                       |

No staged changes were present. The worktree already held unrelated modifications. This design does not stage or edit them. The Decision Register is not edited.

---

## 2. Accepted implementation that already exists

**VERIFIED REPOSITORY FACT.** `D-CONN04-FULL-D-IA-S4-ACCEPT` accepts exactly five worktree files and says no other test or source file is accepted by that act. Current bytes match the act:

| Path                                                                                | SHA-256                                                            | Current git state                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`      | `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163` | Dirty versus `HEAD`. Bytes match |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts` | `d6c6baadd07b02bbc19bec1742edce553805fc977fa3d261942979237912ee48` | Dirty versus `HEAD`. Bytes match |
| `apps/api/src/modules/connections/fiv-conn-04-d-live-slot-occupancy.ts`             | `bf1a9560dc7f033c14bb1429b3f29677b28d3f4a9264b5b969a28d0c8e52cc17` | Untracked. Bytes match           |
| `apps/api/src/modules/connections/fiv-conn-04-d-stage-4-consumer-loop.spec.ts`      | `cb5e9f42c3568eaa702647515cbcc0311ffdbf251dd31eacc21a27bf6311e018` | Untracked. Bytes match           |
| `apps/api/src/modules/connections/fiv-conn-04-d-vault-metadata-entry-seam.spec.ts`  | `c158aa9fc6e042128a28bd72446c546c73928e414866b38d71281bae058d6ff3` | Untracked. Bytes match           |

**VERIFIED REPOSITORY FACT.** The accepted loop symbol is `Conn04SystemJobMigrationEntry.classifyLiveConnectionAttempts`. The occupancy symbol is `projectFivConn04DLiveSlotOccupancy`. No `TODO` or unimplemented throw was found in the Entry file.

**VERIFIED REPOSITORY FACT.** Caller acceptance is two files. Current bytes match: `fiv-conn-04-d-stage-4-explicit-caller.ts` SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe` and its spec SHA-256 `0605a223cdb42ec55683cf7913de66c8722bea337041d4a293199180326c7fbb`. The function is `invokeClassifyLiveConnectionAttempts`. It returns `entry.classifyLiveConnectionAttempts(connections)`.

**VERIFIED REPOSITORY FACT.** M1 acceptance is two files. Current bytes match: `fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50` and its spec SHA-256 `e0633dbcfb50485adeb0bead21018ff1ce4d0574adfc8fc4fec20f61a629b808`. The function is `orchestrateClassifyLiveConnectionAttemptsOnce`. It refuses a null Entry and a non-array cohort, then calls the Caller once. M1 authorization named exactly those two paths and withheld Entry construction, Nest resolution, cohort loading, environment configuration, database access, and invocation.

**TECHNICAL INFERENCE.** The authorized code surface is already present at the accepted byte identities. A further edit of those files would replace an accepted identity. A new source or test file would be outside every acceptance that says its list is exhaustive. Neither is authorized by the decisions in force.

Dirty or untracked git state is not a missing implementation. The acceptance acts accepted worktree bytes and withheld commit and publication.

---

## 3. Critical question

**What is the first real code increment we can implement now, without violating D1-E0, D2-C0, D3-N0, or D4-N0?**

**RECOMMENDATION.** None.

| Candidate                                                           | Why it is not a current increment                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Another edit of the accepted Entry, occupancy helper, Caller, or M1 | Those bytes are the accepted implementation. Changing them is a new acceptance, not work already authorized                                       |
| A new caller of M1, a controller, a job, or a startup hook          | D4-N0 blocks invocation, a trigger, and an operational boundary                                                                                   |
| Entry construction, a factory, or provider resolution               | D1-E0 blocks it                                                                                                                                   |
| Cohort loading, preflight execution, or a cohort boundary           | D2-C0 blocks it                                                                                                                                   |
| Environment acquisition, a boundary, or configuration resolution    | D3-N0 blocks it                                                                                                                                   |
| A new unit test that calls the Caller or M1                         | That is an invocation of those functions, and it is a new file outside the accepted lists                                                         |
| A pure helper with no evidenced missing symbol                      | No unimplemented symbol was found in the accepted loop. Adding a file only to have an increment is activity without evidence                      |
| Commit or publication of the accepted files                         | The Stage 4 acceptance act says commit, merge, cherry-pick, push, and publication are **NOT AUTHORIZED**. That is not an implementation increment |

**TECHNICAL INFERENCE.** Isolated pure logic, a non-operational adapter, deterministic tests, and a further safety guard were considered. The accepted M1 function is already the safety guard for a missing Entry and a missing array. No remaining pure function is named by the accepted source as absent. A new adapter would be a new boundary. D4-N0 says operational boundary implementation is **NOT AUTHORIZED**.

The smallest additional Product Owner decision that could authorize code is a new decision that names one exact path, states the new byte change, and states that the change does not acquire an Entry, does not load a cohort, does not acquire an environment, and does not invoke the Caller or M1. Repository evidence does not identify that path. This design does not invent one. Until such a decision exists, no code increment is authorized.

---

## 4. Scope classes

| Class                              | Item                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Already implemented and accepted   | Five Stage 4 files; two Caller files; two M1 files. Symbols in §2                                                                             |
| Proposed but not implemented       | Nothing. This design proposes no new file and no edit                                                                                         |
| Blocked by accepted PO decisions   | Entry acquisition (D1-E0). Cohort acquisition (D2-C0). Environment acquisition (D3-N0). Invocation, trigger, and operational boundary (D4-N0) |
| Requiring additional PO acceptance | Any path or byte identity outside the accepted lists                                                                                          |
| Requiring execution authorization  | Any run of `classifyLiveConnectionAttempts` on a real Entry, and `D-CONN04-FULL-D-IA-S4-EXEC`, which remains **NOT ESTABLISHED**              |

---

## 5. Sequence

The sequence is a classification, not a build order. Increment 0 is the only current result. Increments 1 through 4 are blocked. They are listed so a later decision can see the gate. This analysis does not authorize them.

| ID           | Purpose                                                                         | Authorized now                             |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `IMPL-S4-00` | No code change. Accepted bytes stay accepted                                    | This is the finding. It is not a code task |
| `IMPL-S4-01` | Any new or edited source that acquires an Entry                                 | **NOT AUTHORIZED.** D1-E0                  |
| `IMPL-S4-02` | Any new or edited source that loads a cohort                                    | **NOT AUTHORIZED.** D2-C0                  |
| `IMPL-S4-03` | Any new or edited source that acquires an environment or resolves configuration | **NOT AUTHORIZED.** D3-N0                  |
| `IMPL-S4-04` | Any trigger, operational boundary, or call of the Caller or M1                  | **NOT AUTHORIZED.** D4-N0                  |

File-level scope, interface, tests, and acceptance criteria for 01 through 04 are not specified, because specifying them would invent an implementation. Their forbidden scope is the whole increment. The backlog file records the same five rows.

---

## 6. OQ-S4-02 and execution

**VERIFIED REPOSITORY FACT.** `OQ-S4-02` remains **OPEN**. The operative Stage 4 authorization act, SHA-256 `afbf7e48f9efe5fb872e9f978b345ef4b89f5e95ec2ef9398e66f38350b1ebe8`, §4, says it is **NOT ESTABLISHED** after naming VMP-1 baseline commit `e6b839e0e7d75322d9626162712fa81f61147d18`. The outstanding question is VMP-1 Git baseline and attribution. Draft alternatives A, B, and C in the implementation-authorization draft were not adopted as the disposition.

No proposed code increment depends on closing `OQ-S4-02`, because no code increment is proposed. Nothing in this design can proceed as implementation while it remains open, and nothing is waiting on its closure in order to start. Closure needs its own Product Owner acceptance. Execution needs `D-CONN04-FULL-D-IA-S4-EXEC`, which this design does not establish.

---

## 7. What this analysis does not do

| Action                                    | State               |
| ----------------------------------------- | ------------------- |
| Code change                               | **NOT IMPLEMENTED** |
| Caller or M1 invocation                   | **NOT PERFORMED**   |
| Entry, cohort, or environment acquisition | **NOT PERFORMED**   |
| `OQ-S4-02`                                | **OPEN**            |
| `D-CONN04-FULL-D-IA-S4-EXEC`              | **NOT ESTABLISHED** |
| Stage 4                                   | **NOT EXECUTED**    |
| D1, D2, D3, D4                            | **Not modified**    |
| Decision Register                         | **Not modified**    |

---

## 8. Result

**IMPLEMENTATION DESIGN = PREPARED.**

The first code increment is none. The recommendation is that no code increment is currently authorized. That recommendation is not a Product Owner selection. D1-E0, D2-C0, D3-N0, and D4-N0 remain accepted.

---

**END OF STAGE 4 IMPLEMENTATION DESIGN ANALYSIS**

**PREPARED — NO CODE INCREMENT CURRENTLY AUTHORIZED.** This analysis does not grant implementation or execution authorization.
