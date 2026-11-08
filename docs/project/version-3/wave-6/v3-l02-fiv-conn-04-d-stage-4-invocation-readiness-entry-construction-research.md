# FIV-CONN-04-D — Stage 4 Invocation Readiness: Entry Construction Research

```text
RESEARCH ONLY
ARTIFACT: RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08
ENTRY CONSTRUCTION = RESEARCHED / NOT SELECTED
THIS FILE DOES NOT CONSTRUCT AN ENTRY
THIS FILE DOES NOT INSTANTIATE NEST
THIS FILE DOES NOT INVOKE THE ORCHESTRATOR OR THE CALLER
THIS FILE DOES NOT EXECUTE STAGE 4
THIS FILE DOES NOT APPROVE INVOCATION
THIS FILE DOES NOT ESTABLISH D-CONN04-FULL-D-IA-S4-EXEC
THIS FILE DOES NOT CLOSE OQ-S4-02
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Read-only research of how an existing `Conn04SystemJobMigrationEntry` could be obtained for a later invocation  
**Artifact ID:** `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-INVOCATION-READINESS-ENTRY-COHORT-ENV-DESIGN`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **RESEARCHED / NOT SELECTED**  
**Nature:** **RESEARCH ONLY.** Source was read. No Entry was constructed. The accepted orchestrator and the accepted Caller were not invoked.

Research does not grant implementation authorization or Stage 4 execution authorization.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**.

The earlier report `RPT-CONN04-S4-ENTRY-CONSTRUCTION-2026-11-07` is historical and is not rewritten. This report re-checks the bytes after M1 acceptance.

---

## 1. Baseline verified before research

| Record                                                               | Required                                                                                                                                              | Recomputed                                                                                         | Result                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Stage 4 implementation acceptance `D-CONN04-FULL-D-IA-S4-ACCEPT`     | SHA-256 `94006f48e02406325317476885ddcf32a6aafb0d74794838cf29f12ba281e57f`                                                                            | Same                                                                                               | **Match.** **ACCEPTED — OPTION A**                 |
| Explicit Caller acceptance `D-CONN04-FULL-D-IA-S4-CALLER-RESULT-ACC` | SHA-256 `79a0bef1c5024a79ea56baa77e5d7f72094d3ea11b79e29fd809ceffff30d6e2`                                                                            | Same                                                                                               | **Match.** **ACCEPTED — TWO FILES ONLY**           |
| Execution subject                                                    | Commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`, tree `8f93a971f965876e2d74f3c9815e83f6aea561d2`, parent `e6b839e0e7d75322d9626162712fa81f61147d18` | `git rev-parse` of the commit, its tree, and its parent                                            | **Match.** The commit is not an ancestor of `main` |
| M1 architecture `D-CONN04-FULL-D-IA-S4-M1-ARCH`                      | SHA-256 `4f817f4bb575ed16ae2e8b45a25c071eb6721893d0f9504b4bf213c027cad7d7`                                                                            | Same                                                                                               | **SELECTED**                                       |
| M1 implementation authorization `D-CONN04-FULL-D-IA-S4-M1-IMPL`      | SHA-256 `c52af03fa65da8a5759acb0e65449ca8ed35e07a6803795948a7a7f23874c497`                                                                            | Same                                                                                               | **ESTABLISHED — CONDITIONAL**                      |
| M1 acceptance `D-CONN04-FULL-D-IA-S4-M1-RESULT-ACC`                  | SHA-256 `d88c5e02c83b4abe9203511eb14264ef33ad72a1d7320ec031beb12070fde30a`                                                                            | Same                                                                                               | **ACCEPTED — TWO FILES ONLY**                      |
| Orchestrator                                                         | SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50`, 934 bytes                                                                 | Same                                                                                               | **Match.** Absent from the subject tree            |
| Caller                                                               | SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe`, 604 bytes                                                                 | Same                                                                                               | **Match.** Absent from the subject tree            |
| `OQ-S4-02`                                                           | **OPEN**                                                                                                                                              | Operative act still says **NOT ESTABLISHED**. Later PO statements keep it **OPEN**. No closure row | **OPEN**                                           |
| Invocation / `D-CONN04-FULL-D-IA-S4-EXEC`                            | **NOT APPROVED** / **NOT ESTABLISHED**                                                                                                                | Register summary through the M1 acceptance row does not approve invocation or establish execution  | **Match**                                          |

`main` at `2fb76edaabcb74f719e4b32bf63425bbc7108d8b` is not the execution subject.

**VERIFIED REPOSITORY FACT.** The worktree bytes of `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` are SHA-256 `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163` (10863 bytes), git blob `9afd147cc73f6612a7d4918f177d48481f991e7b`. That is the subject blob. `git status` shows the path modified against `main` because `main` does not contain that blob. This research does not stage the path.

---

## 2. Facts

### 2.1 Constructor and what classification uses

**VERIFIED REPOSITORY FACT.** `Conn04SystemJobMigrationEntry` is `@Injectable()`. The constructor at `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` 114–121 stores five positional dependencies. It does not validate them and it does not take an options object.

| Order | Parameter       | Type                                                                     | Used by `classifyLiveConnectionAttempts`                                         |
| ----- | --------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1     | `boundary`      | `Conn04MigrationBoundaryService`                                         | No. Used by `start`, `resume`, `heartbeat`, `release`, and `proveWriteAuthority` |
| 2     | `writeUnit`     | `FivConn04DEnvironmentBackfillWrite`                                     | No. Used by `proveWriteAuthority`                                                |
| 3     | `transactions`  | `PrismaTransactionService`                                               | No. `proveWriteAuthority` calls `transactions.run` at lines 187–194              |
| 4     | `vaultMetadata` | `FivConn04DVaultMetadataPort`, token `FIV_CONN_04_D_VAULT_METADATA_PORT` | Yes. `lookupVaultMetadataForConnection` at lines 204–215                         |
| 5     | `prisma`        | `PrismaService`                                                          | Yes. `projectFivConn04DLiveSlotOccupancy(this.prisma, trusted)` at line 269      |

`classifyLiveConnectionAttempts` is at lines 224–247. It does not call `transactions.run`, `assertWriteAuthority`, `start`, or an environment UPDATE. The returned object fixes `operationSummary: null`, `environmentUpdated: false`, and `writeAuthorityInvoked: false`.

The class header at lines 14–15 says the class must remain unexported from `ConnectionsModule` until a separately authorized consumer exists.

### 2.2 Actual providers

**VERIFIED REPOSITORY FACT.** `ConnectionsModule` at `apps/api/src/modules/connections/connections.module.ts` registers the collaborators and does not export the Entry.

| Provider                             | Registration                                                                      | Further dependencies                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PrismaMigrationGateAdapter`         | Lines 41–46, both as `MIGRATION_GATE_PORT` and `MIGRATION_GATE_DURABLE_AUTHORITY` | `PrismaService`, `PrismaTransactionService`, `ConnectionMigrationGateAudit` (`prisma-migration-gate.adapter.ts` 10–16) |
| `Conn04MigrationBoundaryService`     | Line 47                                                                           | The two gate tokens (`conn04-migration-boundary.service.ts` 63–68)                                                     |
| `FivConn04DEnvironmentBackfillWrite` | Line 48                                                                           | The boundary (`fiv-conn-04-d-environment-backfill-write.ts` 23)                                                        |
| `Conn04SystemJobMigrationEntry`      | Line 49                                                                           | The five constructor parameters                                                                                        |
| `FivConn04APreflightService`         | Line 50, and the only export at line 55                                           | Not an Entry factory                                                                                                   |

`FivConn04DVaultMetadataModule` (`apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.ts` 14–29) imports `PrismaModule`, builds a module-private `PrismaSecretVaultRepository`, and exports only `FIV_CONN_04_D_VAULT_METADATA_PORT` as `useExisting: FivConn04DVaultMetadataService`. `ConnectionsModule` imports that module at line 27. `SecretVaultModule` exports `SecretVaultService` only (`secret-vault.module.ts` 44). It does not export the metadata port.

`PrismaModule` is `@Global()` and exports `PrismaService`, `PRISMA_CLIENT`, and `PrismaTransactionService` (`apps/api/src/storage/prisma/prisma.module.ts` 17–25). `PrismaService.onModuleInit` calls `$connect` (lines 8–10). `onModuleDestroy` calls `$disconnect` (lines 12–14).

`AppModule` imports `ConnectionsModule` at `apps/api/src/app.module.ts` 199. It does not export the Entry.

### 2.3 Existing construction patterns

**VERIFIED REPOSITORY FACT.** No production factory and no `moduleRef.get(Conn04SystemJobMigrationEntry)` call were found. The constructions that exist are tests or the Nest provider list.

| Pattern                   | Where                                                                                     | What it supplies                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Structural cast           | `fiv-conn-04-d-stage-4-explicit-caller.spec.ts` 34–38                                     | An object with only `classifyLiveConnectionAttempts`                                                 |
| Direct `new` with doubles | `fiv-conn-04-d-stage-4-consumer-loop.spec.ts` 60–66; entry spec; vault-metadata seam spec | Stub boundary, write unit, transactions, port, and Prisma                                            |
| Nest provider             | `connections.module.ts` 49                                                                | The class, unexported                                                                                |
| Accepted Caller           | `fiv-conn-04-d-stage-4-explicit-caller.ts` 12–16                                          | Receives `entry`. Contains no `new`                                                                  |
| Accepted M1               | `fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` 13–23                                    | Receives `entry`. Throws if `entry == null`. Contains no `new`, no `NestFactory`, and no `moduleRef` |

The M1 file header says it is unregistered and performs no Entry construction. The spec at `fiv-conn-04-d-stage-4-one-shot-orchestrator.spec.ts` 96–123 asserts that absence and asserts that `connections.module.ts`, `app.module.ts`, and `main.ts` do not name `orchestrateClassifyLiveConnectionAttemptsOnce`.

### 2.4 Lifecycle and transactions

**VERIFIED REPOSITORY FACT.** `classifyLiveConnectionAttempts` performs two reads that are not wrapped in `PrismaTransactionService.run`: `lookupExact`, then `projectFivConn04DLiveSlotOccupancy`. A failure of the second read cannot roll back the first, because neither read is a write. The method has no compensating transaction.

**VERIFIED REPOSITORY FACT.** The same class instance exposes `proveWriteAuthority`, which does open `transactions.run`. M1 and the Caller do not call that method. A live provider, once obtained, still has the method.

**TECHNICAL INFERENCE.** Resolving the registered Entry also constructs `PrismaMigrationGateAdapter` and its audit collaborator, because they are constructor dependencies of the boundary. Those objects are not on the classification call path. Their construction is still part of obtaining the Nest provider. `PrismaService.onModuleInit` connects when the application context starts. This research did not start it.

---

## 3. Options

No option is selected.

| ID  | Option                                                                                                          | Additional authority required                                                                                     | Consequence                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| E0  | Do not obtain an Entry                                                                                          | None                                                                                                              | No operational call is possible. Matches the accepted M1 boundary                                                           |
| E1  | Caller-spec cast                                                                                                | None in source. Forbidden as an operational Entry                                                                 | Compiles as the parameter type and does not run the method body                                                             |
| E2  | `new` with test doubles                                                                                         | None beyond existing specs                                                                                        | Exercises the loop only when the doubles are the ones already in the Stage 4 specs. Not a repository Entry                  |
| E3  | Dedicated test-only factory                                                                                     | A later test-scope authorization if a new helper is added. Existing specs already call `new` directly             | Appropriate only inside unit tests. A factory that accepts live `PrismaService` stops being test-only                       |
| E4  | Application-level factory that calls `new` with the five live collaborators                                     | New code outside M1, plus an invocation authorization                                                             | Duplicates the Nest graph. Must still avoid export and avoid wiring M1. Selects a database the moment Prisma is constructed |
| E5  | `NestFactory` or `app.select(ConnectionsModule).get(Conn04SystemJobMigrationEntry)` without exporting the class | New retrieval code and invocation authorization. The class header forbids export until a separate consumer exists | Boots `onModuleInit` and `$connect`. Does not by itself require an export change. Still constructs the gate adapter         |
| E6  | Export `Conn04SystemJobMigrationEntry` from `ConnectionsModule`                                                 | Amends the class header and the export wall at module line 55                                                     | Removes the current boundary. Forbidden as a shortcut                                                                       |

**RECOMMENDATION — NOT SELECTED.** E0. Keep M1 a receiver of an existing Entry. Do not add a factory, an export, or a Nest lookup in this task.

---

## 4. Risks, prerequisites, and forbidden shortcuts

| Item                                                                                      | Class                                                                                                    |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A cast or a test double presented as the operational Entry                                | **Forbidden shortcut.** It skips `lookupExact` and occupancy                                             |
| Exporting the Entry, or registering M1, to make retrieval convenient                      | **Forbidden shortcut.** Contradicts the class header and the accepted M1 file                            |
| Calling `proveWriteAuthority`, `start`, or an environment UPDATE on the obtained instance | **Outside Stage 4 classification.** Those methods exist on the class and are not the accepted invocation |
| Booting `AppModule` during research                                                       | **Not done.** It would connect Prisma                                                                    |
| Subject bytes, Caller bytes, and M1 bytes are three different trees                       | **Prerequisite.** The subject commit does not contain the Caller or M1. Composition is not authorized    |
| The port and `PrismaService` must address the same store as the cohort                    | **Prerequisite.** The constructor does not record a store id                                             |
| `OQ-S4-02` remains open                                                                   | **Prerequisite unresolved.** This report does not close it                                               |

---

## 5. Assumptions and unresolved questions

**Assumption, not a fact.** A future Product Owner could choose E3 for tests and a different option for any later operational run. This report does not make that split.

| Question                                                                          | State                                                                            |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Which of E0–E6 is adopted                                                         | **NOT SELECTED**                                                                 |
| Whether a live resolution may construct the migration-gate adapter                | **UNRESOLVED**                                                                   |
| How the subject commit and the two untracked M1 files are placed in one process   | **UNRESOLVED.** No composition commit is proposed                                |
| Whether `moduleRef.get` from the root application can see the unexported provider | **Not observed.** Nest was not started. The export list is the verified boundary |

---

## 6. Result

**ENTRY CONSTRUCTION = RESEARCHED / NOT SELECTED.**

An Entry type, a five-argument constructor, a Nest registration, and test constructions exist. No production factory exists. The accepted M1 function receives an Entry and does not build one. No Entry was constructed for this research.

---

**END OF ENTRY CONSTRUCTION RESEARCH**

**RESEARCHED / NOT SELECTED.** Research does not grant implementation or execution authorization. Stage 4 was not executed.
