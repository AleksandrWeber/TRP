# FIV-CONN-04-D — Stage 4 D1 Entry Acquisition Decision Analysis

```text
RESEARCH / DECISION ANALYSIS ONLY
ARTIFACT: ANL-CONN04-S4-D1-ENTRY-2026-11-08
D1 ENTRY ANALYSIS = PREPARED
E0 = AVAILABLE
E1 = ANALYZED
E2 = ANALYZED
D1 RECOMMENDATION = E0 — NOT SELECTED
D1 PO ACCEPTANCE = NOT RECORDED
INVOCATION = NOT APPROVED
OQ-S4-02 = OPEN
STAGE 4 = NOT EXECUTED
THIS FILE DOES NOT CONSTRUCT AN ENTRY
THIS FILE DOES NOT IMPLEMENT A FACTORY OR A PROVIDER
THIS FILE DOES NOT REGISTER OR RESOLVE A NEST PROVIDER
THIS FILE DOES NOT START A DATABASE CONNECTION
THIS FILE DOES NOT INVOKE THE CLASSIFIER, THE CALLER, OR M1
THIS FILE DOES NOT SELECT A PRODUCT OWNER OPTION
THIS FILE DOES NOT UPDATE THE DECISION REGISTER
THIS FILE DOES NOT GRANT IMPLEMENTATION OR EXECUTION AUTHORIZATION
NO AUTOMATIC PROGRESSION
```

**Document:** Evidence-backed Product Owner decision analysis for D1 — Entry acquisition  
**Artifact ID:** `ANL-CONN04-S4-D1-ENTRY-2026-11-08`  
**Date:** 2026-11-08  
**Task ID:** `D-CONN04-FULL-D-IA-S4-PO-D1-ENTRY-ANALYSIS`  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Status:** **PREPARED — RECOMMENDATION NOT SELECTED — PO ACCEPTANCE NOT RECORDED**  
**Nature:** **RESEARCH / DECISION ANALYSIS ONLY.** Source was read. No Entry was constructed. No factory or provider was added. Nest was not started. The accepted orchestrator and the accepted Caller were not invoked.

This file does not embed its own SHA-256. The readiness assessment records that hash after this file is written. A later accepting sentence must include that exact hash. A sentence in this file is a draft. It is not a Product Owner decision.

Claim classes: **VERIFIED REPOSITORY FACT**, **TECHNICAL INFERENCE**, **RECOMMENDATION — NOT SELECTED**, **UNRESOLVED QUESTION**, **UNRESOLVED PROPOSAL**.

Research and this analysis do not grant implementation authorization or Stage 4 execution authorization.

---

## 1. Baseline verified before analysis

Recomputed from file bytes and `git rev-parse` on 2026-11-08. Current `HEAD` and `origin/main` are `20290f694b34983b783bbe9387283c1b652f16fe`. The decision package records an earlier `HEAD` of `d199508c8ea7b0b2147f511202e96764672e15b5`. The required artifact bytes below still match. That HEAD movement is not a baseline mismatch.

| Record                                                          | Required                                                                                                                                              | Recomputed                                                                                                                            | Result                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Package `PKG-CONN04-S4-INVOKE-PO-2026-11-08`                    | SHA-256 `074a88c41d6b3090381661676f9455fae042dc4e5b024c7520d7a7de1d65de67`                                                                            | Same                                                                                                                                  | **Match.** **PREPARED — NOT A PRODUCT OWNER DECISION**                                                     |
| Entry research `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08`          | SHA-256 `60514cd130782e17ce12591a21bcc0875b748a6273f28ac023215a9fc675fc11`                                                                            | Same                                                                                                                                  | **Match.** **RESEARCHED / NOT SELECTED**                                                                   |
| Stage 4 authorization `D-CONN04-FULL-D-IA-S4`                   | SHA-256 `afbf7e48f9efe5fb872e9f978b345ef4b89f5e95ec2ef9398e66f38350b1ebe8`                                                                            | Same                                                                                                                                  | **Match.** **APPROVED / FORMALIZED — NOT YET EXECUTED**                                                    |
| Stage 4 acceptance `D-CONN04-FULL-D-IA-S4-ACCEPT`               | SHA-256 `94006f48e02406325317476885ddcf32a6aafb0d74794838cf29f12ba281e57f`                                                                            | Same                                                                                                                                  | **Match.** **ACCEPTED — OPTION A**                                                                         |
| Caller acceptance `D-CONN04-FULL-D-IA-S4-CALLER-RESULT-ACC`     | SHA-256 `79a0bef1c5024a79ea56baa77e5d7f72094d3ea11b79e29fd809ceffff30d6e2`                                                                            | Same                                                                                                                                  | **Match.** **ACCEPTED — TWO FILES ONLY**                                                                   |
| Execution subject `D-CONN04-FULL-D-IA-S4-EXEC-SUBJECT`          | Commit `fdd14e5c294fa00930a3235868ca7b52aca70a6f`, tree `8f93a971f965876e2d74f3c9815e83f6aea561d2`, parent `e6b839e0e7d75322d9626162712fa81f61147d18` | `git rev-parse` of the commit, its tree, and its parent                                                                               | **Match.** `git merge-base --is-ancestor` against `HEAD` exits 1. The subject is not an ancestor of `main` |
| M1 architecture `D-CONN04-FULL-D-IA-S4-M1-ARCH`                 | SHA-256 `4f817f4bb575ed16ae2e8b45a25c071eb6721893d0f9504b4bf213c027cad7d7`                                                                            | Same                                                                                                                                  | **Match.** **SELECTED**                                                                                    |
| M1 implementation authorization `D-CONN04-FULL-D-IA-S4-M1-IMPL` | SHA-256 `c52af03fa65da8a5759acb0e65449ca8ed35e07a6803795948a7a7f23874c497`                                                                            | Same                                                                                                                                  | **Match.** **ESTABLISHED — CONDITIONAL**                                                                   |
| M1 acceptance `D-CONN04-FULL-D-IA-S4-M1-RESULT-ACC`             | SHA-256 `d88c5e02c83b4abe9203511eb14264ef33ad72a1d7320ec031beb12070fde30a`                                                                            | Same                                                                                                                                  | **Match.** **ACCEPTED — TWO FILES ONLY**                                                                   |
| Orchestrator                                                    | SHA-256 `93a4c9b8d29ad98d6a48c18a2924386fe4a4fc0fedb68dbb8bbd70f04afa2c50`, 934 bytes                                                                 | Same                                                                                                                                  | **Match**                                                                                                  |
| Orchestrator spec                                               | SHA-256 `e0633dbcfb50485adeb0bead21018ff1ce4d0574adfc8fc4fec20f61a629b808`, 4469 bytes                                                                | Same                                                                                                                                  | **Match**                                                                                                  |
| Caller                                                          | SHA-256 `9fb28a639596e6adf50bb488a71dce36d40b21a7599c7a90f4607e6dee57dffe`, 604 bytes                                                                 | Same                                                                                                                                  | **Match**                                                                                                  |
| Caller spec                                                     | SHA-256 `0605a223cdb42ec55683cf7913de66c8722bea337041d4a293199180326c7fbb`, 3699 bytes                                                                | Same                                                                                                                                  | **Match**                                                                                                  |
| Entry worktree file                                             | SHA-256 `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163`, git blob `9afd147cc73f6612a7d4918f177d48481f991e7b`                       | Same                                                                                                                                  | **Match.** Subject blob. This analysis does not stage the path                                             |
| `OQ-S4-02`                                                      | **OPEN**                                                                                                                                              | Operative authorization act records the question **NOT ESTABLISHED**. M1 acceptance leaves it **OPEN**. Package D5 leaves it **OPEN** | **OPEN**                                                                                                   |
| Invocation / `D-CONN04-FULL-D-IA-S4-EXEC`                       | **NOT APPROVED** / **NOT ESTABLISHED**                                                                                                                | M1 acceptance and the package both leave those states unchanged                                                                       | **Match**                                                                                                  |

The five accepted Stage 4 worktree files remain the bytes named in `D-CONN04-FULL-D-IA-S4-ACCEPT` §3:

| Path                                                                                | SHA-256                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`      | `b513493ac90d0badea0d7ec648ccdc70c8816a279e802ddfb296ae4d00532163` |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts` | `d6c6baadd07b02bbc19bec1742edce553805fc977fa3d261942979237912ee48` |
| `apps/api/src/modules/connections/fiv-conn-04-d-live-slot-occupancy.ts`             | `bf1a9560dc7f033c14bb1429b3f29677b28d3f4a9264b5b969a28d0c8e52cc17` |
| `apps/api/src/modules/connections/fiv-conn-04-d-stage-4-consumer-loop.spec.ts`      | `cb5e9f42c3568eaa702647515cbcc0311ffdbf251dd31eacc21a27bf6311e018` |
| `apps/api/src/modules/connections/fiv-conn-04-d-vault-metadata-entry-seam.spec.ts`  | `c158aa9fc6e042128a28bd72446c546c73928e414866b38d71281bae058d6ff3` |

`connections.module.ts` is not one of those five files. This analysis does not edit it.

The Decision Register worktree file remains SHA-256 `6657b3dac95f19f5a38c81e1230f6b3cfee55932e6f98aa29717b15c381f6144`. It already differs from `HEAD`. This analysis does not edit it and does not stage it.

No baseline mismatch was found. Analysis continued.

The options analyzed are only the package options:

| ID  | Option in this analysis                                                                          | Package meaning that binds the option                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E0  | No Entry acquisition; remain blocked                                                             | Package §4 D1-E0                                                                                                                                                   |
| E1  | Explicit factory boundary, subject to architectural review                                       | Package §4 D1-E1. A later function would call `new Conn04SystemJobMigrationEntry` with five collaborators passed in. It is not a test cast and it is not an export |
| E2  | Dedicated controlled factory/provider, subject to dependency lifecycle and initialization review | Package §4 D1-E2. Retrieval of the registered unexported provider, or a new dedicated provider that wraps it. Exporting the class is outside this option           |

Entry-research labels E3 through E6 are historical names in `RPT-CONN04-S4-INVOKE-ENTRY-2026-11-08` §3. They are not additional D1 options. Research E6, exporting the class, stays excluded.

---

## 2. Constructor and dependency analysis

### 2.1 Constructor signature

**VERIFIED REPOSITORY FACT.** `Conn04SystemJobMigrationEntry` is declared `@Injectable()` at `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` lines 112–121. The constructor is positional. It stores five parameters. The constructor body is empty. It does not validate arguments, read the environment, call a method, or open a transaction.

```text
constructor(
  boundary: Conn04MigrationBoundaryService,
  writeUnit: FivConn04DEnvironmentBackfillWrite,
  transactions: PrismaTransactionService,
  vaultMetadata: FivConn04DVaultMetadataPort,   // @Inject(FIV_CONN_04_D_VAULT_METADATA_PORT)
  prisma: PrismaService,
)
```

The class header at lines 14–15 says the class must remain unexported from `ConnectionsModule` until a separately authorized consumer exists.

### 2.2 Every constructor dependency and its provider

| Order | Parameter       | Token or type                                                                        | Concrete provider                                                                                                                                         | Constructor of that provider                                                                                                                                                                                                                                                     |
| ----- | --------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `boundary`      | `Conn04MigrationBoundaryService`                                                     | Class provider at `connections.module.ts` line 47                                                                                                         | Lines 63–68 of `conn04-migration-boundary.service.ts`. Injects `MIGRATION_GATE_PORT` and `MIGRATION_GATE_DURABLE_AUTHORITY`. Both are `useExisting: PrismaMigrationGateAdapter` at `connections.module.ts` lines 42–46                                                           |
| 2     | `writeUnit`     | `FivConn04DEnvironmentBackfillWrite`                                                 | Class provider at `connections.module.ts` line 48                                                                                                         | Line 23 of `fiv-conn-04-d-environment-backfill-write.ts`. Stores `Conn04MigrationBoundaryService`                                                                                                                                                                                |
| 3     | `transactions`  | `PrismaTransactionService`                                                           | Provider and export of `@Global()` `PrismaModule` at `prisma.module.ts` lines 17–24                                                                       | Lines 19–20 of `prisma-transaction.service.ts`. Injects `PRISMA_CLIENT`, which is `useExisting: PrismaService` at `prisma.module.ts` line 21                                                                                                                                     |
| 4     | `vaultMetadata` | `FIV_CONN_04_D_VAULT_METADATA_PORT` (`fiv-conn-04-d-vault-metadata.port.ts` line 12) | `useExisting: FivConn04DVaultMetadataService` at `fiv-conn-04-d-vault-metadata.module.ts` lines 23–26. `ConnectionsModule` imports that module at line 27 | `FivConn04DVaultMetadataService` lines 28–31 inject `SECRET_VAULT_REPOSITORY`. That token's factory at module lines 17–20 is `(prisma) => new PrismaSecretVaultRepository(prisma)`. The repository constructor at `prisma-secret-vault.repository.ts` line 119 stores the client |
| 5     | `prisma`        | `PrismaService`                                                                      | Class provider of `@Global()` `PrismaModule`, also imported by `AppModule` at `app.module.ts` line 127 and by `FivConn04DVaultMetadataModule` line 15     | `PrismaService` at `prisma.module.ts` lines 6–15 extends `PrismaClient`. It has no constructor body of its own                                                                                                                                                                   |

`PrismaMigrationGateAdapter` is the concrete object behind both gate tokens. Its constructor at `prisma-migration-gate.adapter.ts` lines 88–92 stores `PrismaService`, `PrismaTransactionService`, and `ConnectionMigrationGateAudit`. The audit constructor at `connection-migration-gate-audit.ts` lines 11–12 stores `SecurityAuditService`. `SecurityAuditService` at `security-audit.service.ts` lines 24–27 stores `SECURITY_AUDIT_REPOSITORY`. Those constructors assign fields. They do not call `acquire`, `record`, or `$connect`.

`SecretVaultModule` exports `SecretVaultService` only (`secret-vault.module.ts` line 44). It does not export `FIV_CONN_04_D_VAULT_METADATA_PORT`. It has a separate `SECRET_VAULT_REPOSITORY` factory. The metadata module's repository provider is module-private.

### 2.3 What classification uses

**VERIFIED REPOSITORY FACT.** `classifyLiveConnectionAttempts` is at lines 224–247. `classifyOneLiveConnectionAttempt` is at lines 250–286.

| Dependency      | Read by classification                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vaultMetadata` | Yes. Line 261 calls `lookupVaultMetadataForConnection`, which calls `vaultMetadata.lookupExact` at lines 212–215 when both ids are non-blank                                                                                                                             |
| `prisma`        | Yes. Line 269 calls `projectFivConn04DLiveSlotOccupancy(this.prisma, trusted)`. That function at `fiv-conn-04-d-live-slot-occupancy.ts` lines 33–46 may call `prisma.connectionRecord.findFirst` at lines 65–76 for an `EXCHANGE` connection whose `environment` is null |
| `boundary`      | No reference in either classification method                                                                                                                                                                                                                             |
| `writeUnit`     | No reference in either classification method                                                                                                                                                                                                                             |
| `transactions`  | No reference in either classification method                                                                                                                                                                                                                             |

`classifyFivConn04LiveConnection` is a direct function import at entry lines 41–45. It is not a constructor parameter. The returned batch at lines 241–246 fixes `operationSummary: null`, `environmentUpdated: false`, and `writeAuthorityInvoked: false`.

`lookupVaultMetadataForConnection` at lines 204–216 is public. Classification uses it. The method itself is not a write-authority method. Blank ids return `INVALID` before `lookupExact`.

### 2.4 What only write authority or lease operations use

**VERIFIED REPOSITORY FACT.**

| Method                | Lines   | Dependencies it uses                                                                                                                                                                      |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start`               | 126–143 | `boundary.start` after `buildFivConn04DSystemJobActor`                                                                                                                                    |
| `resume`              | 145–153 | `boundary.resume`                                                                                                                                                                         |
| `heartbeat`           | 155–170 | `boundary.heartbeat`                                                                                                                                                                      |
| `release`             | 172–180 | `boundary.release`                                                                                                                                                                        |
| `proveWriteAuthority` | 187–195 | `transactions.run`, then `writeUnit.assertWriteAuthorityInTransaction`. The write unit at `fiv-conn-04-d-environment-backfill-write.ts` lines 30–38 calls `boundary.assertWriteAuthority` |

Classification does not call those five methods. The same instance still has them. `PrismaTransactionService.run` at `prisma-transaction.service.ts` lines 22–28 calls `this.prisma.$transaction`. That call is inside `run`. The Entry constructor does not call `run`.

### 2.5 Initialization and Prisma lifecycle

**VERIFIED REPOSITORY FACT.** `PrismaService.onModuleInit` at `prisma.module.ts` lines 8–10 calls `this.$connect()`. `onModuleDestroy` at lines 12–14 calls `this.$disconnect()`. Neither hook has a `catch`. No `OnModuleInit` or `OnModuleDestroy` implementation appears in `apps/api/src/modules/connections` or `apps/api/src/modules/secret-vault` outside test matchers that forbid those strings in M1 and the Caller.

**VERIFIED REPOSITORY FACT.** `envWrappingKeySource` at `wrapping-key.ts` lines 49–53 returns an object whose `resolve` method reads the key. `SecretVaultModule` lines 36–39 register that factory. The factory expression does not call `resolve`. The module comment at line 21 says a missing wrapping key does not fail module boot. `ConnectionsModule` imports `SecretVaultModule` at line 26, so a Nest context that initializes `ConnectionsModule` also initializes `SecretVaultModule`.

**TECHNICAL INFERENCE.** Nest constructs providers before it calls `onModuleInit`. Calling the Entry constructor, or calling `moduleRef.get` after a context is already initialized, does not itself execute `PrismaService.onModuleInit`. Creating and initializing a context that includes `PrismaService` does execute that hook, and that hook calls `$connect`. This analysis did not create a context, did not call `get`, and did not call `$connect`. The Prisma engine's behavior inside the `PrismaClient` constructor was not inspected and was not executed.

**VERIFIED REPOSITORY FACT.** The occupancy read and `findMetadataByIdAndWorkspaceId` at `prisma-secret-vault.repository.ts` lines 188–196 are reads. They are not wrapped in `PrismaTransactionService.run`. A failed occupancy read cannot roll back the metadata read, because neither method writes. `METADATA_SELECT` at repository lines 22–27 is `id`, `workspaceId`, `purpose`, and `state`.

### 2.6 Module registration and export boundaries

**VERIFIED REPOSITORY FACT.** `ConnectionsModule` providers include `Conn04SystemJobMigrationEntry` at line 49. The export list at line 55 is only `FivConn04APreflightService`. The comment at lines 52–54 says the boundary, the port tokens, the durable authority, the Entry, and the write unit stay module-internal, and that the identity factory is not exported.

`FivConn04DVaultMetadataModule` exports only `FIV_CONN_04_D_VAULT_METADATA_PORT`. `AppModule` imports `ConnectionsModule` at `app.module.ts` line 199. `AppModule` does not export the Entry. `orchestrateClassifyLiveConnectionAttemptsOnce` does not appear in `connections.module.ts`, `app.module.ts`, or `main.ts`. The M1 spec at `fiv-conn-04-d-stage-4-one-shot-orchestrator.spec.ts` lines 112–123 asserts that absence for the module, the controller, `main.ts`, `app.module.ts`, `package.json`, and `scripts/backfill-knowledge.ts`.

### 2.7 Existing factory, provider, and test construction patterns

**VERIFIED REPOSITORY FACT.** No production function calls `new Conn04SystemJobMigrationEntry`. No `moduleRef.get(Conn04SystemJobMigrationEntry)` call exists. The Entry provider is a class provider, not a `useFactory`.

| Pattern                   | Where                                                                               | What it does                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural cast           | `fiv-conn-04-d-stage-4-explicit-caller.spec.ts` lines 34–38, function `entryDouble` | Builds an object with only `classifyLiveConnectionAttempts` and casts it to the class                                                             |
| Direct `new` with doubles | `fiv-conn-04-d-stage-4-consumer-loop.spec.ts` lines 60–66                           | Passes an empty boundary, a write-unit double, a transaction double, a port double, and a Prisma double                                           |
| Direct `new` with doubles | `fiv-conn-04-d-system-job-migration-entry.spec.ts` lines 104–110 and line 418       | Same five-argument construction                                                                                                                   |
| Direct `new` with doubles | `fiv-conn-04-d-vault-metadata-entry-seam.spec.ts` lines 50–56                       | Empty boundary, write unit, and transactions, plus a port double and a Prisma double                                                              |
| Nest class provider       | `connections.module.ts` line 49                                                     | Registers the class and does not export it                                                                                                        |
| Repository `useFactory`   | `fiv-conn-04-d-vault-metadata.module.ts` lines 17–20                                | Builds `PrismaSecretVaultRepository`. It is not an Entry factory                                                                                  |
| Accepted Caller           | `fiv-conn-04-d-stage-4-explicit-caller.ts` lines 12–16                              | Receives `entry` and calls `classifyLiveConnectionAttempts`. Contains no `new`                                                                    |
| Accepted M1               | `fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` lines 13–23                        | Receives `entry`. Throws `FIV-CONN-04-D M1 abort: Entry is unnamed` when `entry == null`. Contains no `new`, no `NestFactory`, and no `moduleRef` |

The M1 spec lines 107–109 assert that the orchestrator source contains no `new Conn04SystemJobMigrationEntry` and no Nest lifecycle, environment, or write-authority strings.

---

## 3. E1 — Explicit factory boundary

E1 is a future function that receives the five collaborators and calls `new Conn04SystemJobMigrationEntry`. The function does not exist. This section describes it. It does not add it.

### 3.1 Can a factory avoid unnecessary dependencies?

**VERIFIED REPOSITORY FACT.** The constructor requires all five parameters. A factory that calls `new Conn04SystemJobMigrationEntry` must pass five arguments. TypeScript does not allow the call to omit `boundary`, `writeUnit`, or `transactions`.

**VERIFIED REPOSITORY FACT.** The consumer-loop spec passes an empty object as `boundary` and still calls `classifyLiveConnectionAttempts`. That is evidence that the classification methods do not read `this.boundary`, `this.writeUnit`, or `this.transactions`. A future factory can therefore receive inert objects for those three parameters and live objects for the port and `PrismaService`.

Those inert objects avoid constructing `PrismaMigrationGateAdapter`, `ConnectionMigrationGateAudit`, and `SecurityAuditService`. They do not remove the parameters. They also do not remove `start`, `resume`, `heartbeat`, `release`, or `proveWriteAuthority` from the returned instance. Calling `proveWriteAuthority` on an instance built with an inert transaction double would call the double, not the durable gate.

### 3.2 Can classification be separated from write-authority dependencies?

Call-path separation is already present: classification does not call the write-authority or lease methods.

Instance separation is not present. One class holds both groups of methods. The accepted M1 parameter type is `Conn04SystemJobMigrationEntry` (`fiv-conn-04-d-stage-4-one-shot-orchestrator.ts` line 14). A value produced by `new Conn04SystemJobMigrationEntry` is that class. E1, as defined, returns that class. It does not change the M1 signature and it does not change the Caller signature. Those two files stay at their accepted hashes.

The structural cast in the Caller spec is not E1. The package defines E1 as a real `new` with five collaborators.

### 3.3 Does construction require production module initialization?

**VERIFIED REPOSITORY FACT.** `new Conn04SystemJobMigrationEntry(...)` is a language constructor call. The specs perform it without `NestFactory`, `Test.createTestingModule`, or `onModuleInit`. The Entry class has no lifecycle hook.

An E1 factory that only receives already built collaborators does not itself initialize `ConnectionsModule`, `SecretVaultModule`, or `PrismaModule`.

Obtaining a live `PrismaService` and a live port is a separate step. If that step is Nest initialization, `$connect` belongs to that step. If the factory itself executes `new PrismaService()`, the application hook `onModuleInit` does not run, because nothing calls it. The occupancy function can still issue `connectionRecord.findFirst` later. This analysis did not construct `PrismaService` and did not issue that query.

### 3.4 Direct injection or explicit construction?

E1's defined shape is explicit construction: the caller passes the five objects into `new`. Nest constructor injection is the existing class provider. That registration is the E2 graph, not a new E1 function.

Explicit construction is the form that matches E1. It can live outside `ConnectionsModule`, so the export list can stay unchanged. It can accept inert objects for the three unused parameters. Nest injection of the registered class cannot skip those providers, because they are constructor dependencies of the class Nest instantiates.

### 3.5 Test-only or application-level?

The existing specs already call `new` at the call site. A test-only helper would refactor those specs. It would not obtain an Entry for M1. The package says E1 is not a test cast. The factory that could later satisfy D1 is application-level: a named function in a new file, receiving five collaborators, returning the Entry, and calling no method.

That file must stay out of the accepted M1 file, the accepted Caller file, and the five accepted Stage 4 paths. M1 and the Caller must not import it unless a later authorization says so. This analysis does not choose a path and does not create the file.

### 3.6 Risks of bypassing lifecycle guarantees

| Risk                                                                                            | Evidence                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new PrismaService()` skips `onModuleInit` and `onModuleDestroy`                                | The only application `$connect` and `$disconnect` calls are those two hooks                                                                                 |
| A later occupancy read can still open a database session                                        | `projectFivConn04DLiveSlotOccupancy` calls `connectionRecord.findFirst` when the connection is an exchange row with a null environment                      |
| Inert write-authority collaborators are not the durable gate                                    | The gate adapter is constructed only when Nest builds `PrismaMigrationGateAdapter`, or when some other caller constructs it. E1 can avoid that construction |
| The returned object can still open `transactions.run` when the transaction collaborator is live | `proveWriteAuthority` lines 187–195                                                                                                                         |
| The port and `PrismaService` can address different stores                                       | The constructor does not record a store id. Entry research §4 already records that prerequisite                                                             |
| Placing the factory inside M1 would change the accepted utility                                 | M1 spec lines 107–109 forbid `new Conn04SystemJobMigrationEntry` in that file                                                                               |

### 3.7 Required later interface, tests, and acceptance criteria

These criteria describe a future implementation authorization. They are not authorization, and they are not implemented here.

Interface shape that matches the constructor:

```text
createConn04SystemJobMigrationEntry(deps: {
  boundary: Conn04MigrationBoundaryService;
  writeUnit: FivConn04DEnvironmentBackfillWrite;
  transactions: PrismaTransactionService;
  vaultMetadata: FivConn04DVaultMetadataPort;
  prisma: PrismaService;
}): Conn04SystemJobMigrationEntry
```

The body would pass those five values to `new` and return the instance. It would not call a method on the instance.

Later tests would have to show:

| Check           | Required observation                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Five arguments  | The call passes the same five objects the test supplied                                                                              |
| No use          | The test's port, Prisma, transaction, boundary, and write-unit doubles receive no calls                                              |
| No connection   | The factory source contains no `$connect`, `NestFactory`, `moduleRef`, or `process.env`                                              |
| No write path   | The factory source contains no `proveWriteAuthority`, `transactions.run`, `start`, `resume`, `heartbeat`, or `release`               |
| Walls unchanged | `ConnectionsModule` exports remain `FivConn04APreflightService`. M1, the Caller, and the five accepted Stage 4 hashes stay unchanged |

Acceptance of a future E1 implementation would require a separate Product Owner implementation authorization that names the new file before that file exists. Selecting the E1 sentence in §6 does not name a file and does not create one.

---

## 4. E2 — Controlled factory or provider

E2 is retrieval of the already registered, unexported `Conn04SystemJobMigrationEntry`, or a new dedicated provider that wraps it. Exporting the class is outside E2. This section does not register a provider and does not resolve one.

### 4.1 Nest lifecycle and module visibility

**VERIFIED REPOSITORY FACT.** The class is a provider of `ConnectionsModule` and is absent from `exports`. Nest module exports are the declared visibility boundary in source. `FivConn04APreflightService` is the only exported provider. `AppModule` imports the module and does not re-export the Entry.

**UNRESOLVED QUESTION.** Whether `moduleRef.get(Conn04SystemJobMigrationEntry)` or a selected module context can see that unexported provider was not executed. Nest was not started. The export list is the verified boundary. A successful or failed `get` is not a verified result.

A new dedicated provider would be new source. The current file has no `useFactory` that returns `Conn04SystemJobMigrationEntry`.

### 4.2 Dependency ownership and initialization

| Object                                         | Owner today                                          | What initialization of that owner constructs                                        |
| ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Entry                                          | `ConnectionsModule`                                  | The class, which requires the other four constructor objects                        |
| Boundary and write unit                        | `ConnectionsModule`                                  | `PrismaMigrationGateAdapter` and `ConnectionMigrationGateAudit`                     |
| Metadata port                                  | `FivConn04DVaultMetadataModule`                      | `FivConn04DVaultMetadataService` and a module-private `PrismaSecretVaultRepository` |
| `PrismaService` and `PrismaTransactionService` | `PrismaModule`                                       | The client and the transaction service. `onModuleInit` then calls `$connect`        |
| Wrapping-key source                            | `SecretVaultModule`, imported by `ConnectionsModule` | The factory returns `envWrappingKeySource`. It does not call `resolve`              |

Resolving the registered Entry through Nest constructs the boundary, the write unit, the gate adapter, the audit collaborator, the metadata service, and the repository, because those objects are on the constructor path. An E1 factory can pass inert substitutes for the first three Entry parameters. The registered Nest class cannot, because Nest satisfies the real constructor types from the module.

### 4.3 Does resolving the provider trigger `$connect`?

**VERIFIED REPOSITORY FACT.** The Entry constructor does not call `$connect`. The only application call is `PrismaService.onModuleInit`.

**TECHNICAL INFERENCE.** Provider construction and `onModuleInit` are different phases. A `get` performed after initialization does not call `onModuleInit` again. Initializing a context that contains `PrismaService` does call `onModuleInit`, and that call awaits `$connect`. E2 retrieval from a running application therefore depends on a context whose initialization already performed `$connect`. A new `useFactory` whose body only calls `new Conn04SystemJobMigrationEntry` would not itself call `$connect`. Registering that factory in a module that also initializes `PrismaService` still places `$connect` in the same context initialization.

This analysis did not resolve the provider and did not observe a connection.

### 4.4 How initialization failure would be handled

**VERIFIED REPOSITORY FACT.** `onModuleInit` has no `catch`. A rejected `$connect` rejects that hook.

**TECHNICAL INFERENCE.** Nest fails context initialization when `onModuleInit` rejects. That failure happens before a classification result exists. It is not `UNAVAILABLE`, `OCCUPANCY_UNAVAILABLE`, or any other `FivConn04DStage4AttemptReason`. Those reasons are returned only by methods that this analysis did not call.

There is no Entry-specific recovery policy, because the Entry has no lifecycle hook. A later E2 implementation would have to leave `$connect` failure as context-start failure. It would not convert that failure into a batch result. That policy is a requirement for a future authorization. It is not implemented here.

The wrapping-key factory is a different failure mode. Its `resolve` method is lazy. Module initialization can succeed when `VAULT_WRAPPING_KEY` is missing. Classification's `lookupExact` path uses `findMetadataByIdAndWorkspaceId` and the metadata select. It does not call `requireWrappingKey`. A missing wrapping key is therefore not the classification lookup's failure mode. Booting `ConnectionsModule` still constructs the wrapping-key provider, because the module import is present.

### 4.5 Capability exposure and isolation from write authority

The registered provider's type is the class. The class exposes `start`, `resume`, `heartbeat`, `release`, `proveWriteAuthority`, `lookupVaultMetadataForConnection`, and `classifyLiveConnectionAttempts`.

A provider of that class exposes the write-authority and lease methods. M1 calls only `invokeClassifyLiveConnectionAttempts`, and the Caller calls only `classifyLiveConnectionAttempts`. The instance obtained from the provider still has the other methods. Source does not delete them and does not hide them behind a second token.

A wrapper provider could expose a narrower method list while holding the class privately. No such wrapper exists. Adding one is future source under a later authorization. It is not created here. It would still construct the class unless the wrapper itself called `new` with substitutes, which is the E1 construction shape placed inside a provider. That hybrid is not a fourth option. It is recorded in §7 as an unresolved proposal.

E2 cannot both resolve the registered class and avoid the write-authority collaborators. Those collaborators are required constructor parameters of the class Nest builds.

### 4.6 Required module exports and security boundaries

A later E2 implementation would have to preserve these boundaries:

| Boundary            | Current source                                                          | Later E2 requirement                                                                                                 |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Entry export        | Absent from `connections.module.ts` line 55                             | Remains absent. Exporting the class is outside E2                                                                    |
| Class header        | Lines 14–15 forbid export until a separately authorized consumer exists | A provider retrieval does not by itself satisfy that sentence. A later authorization would have to name the consumer |
| Metadata port       | Exported token only. Repository is module-private                       | Stays module-private                                                                                                 |
| `SecretVaultModule` | Exports `SecretVaultService` only                                       | Stays unchanged. E2 does not gain a reason to export the metadata port from that module                              |
| M1 and Caller       | Unregistered functions that receive an Entry                            | Stay unregistered. E2 does not add them to a module                                                                  |
| Write methods       | Present on the class                                                    | A later review must say which type the caller is allowed to hold. Holding the class holds the write methods          |

### 4.7 Testing and verification implications

Existing Entry tests use `new` and doubles. They do not compile a Nest module and they do not resolve the provider. Verifying E2 later would require a testing module or an application context. Compiling that context initializes providers and, when `PrismaService` is included, runs `onModuleInit`. That verification is a future authorized test. This analysis does not run it, does not compile a module, and does not open a database.

A source inspection can later confirm the export list, the absence of `orchestrateClassifyLiveConnectionAttemptsOnce` from module files, and the presence of `$connect` only in `PrismaService.onModuleInit`. Those inspections do not require a running Nest context. They are the inspections already completed above.

---

## 5. E0 — No acquisition

E0 obtains no Entry. M1 stays a function that throws when its Entry argument is null. The accepted Caller stays a function that receives an Entry and does not build one.

### 5.1 What remains blocked

| Blocked action                                                       | Why it stays blocked                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| An operational call to M1                                            | M1 requires an Entry argument. E0 supplies none                                   |
| An operational call to the Caller                                    | The Caller has the same requirement                                               |
| `classifyLiveConnectionAttempts` on a repository Entry               | No Entry is obtained                                                              |
| `lookupExact` and `connectionRecord.findFirst` through this task     | No method was called                                                              |
| `proveWriteAuthority`, `start`, `resume`, `heartbeat`, and `release` | No instance exists on which to call them                                          |
| `$connect`                                                           | No context is initialized and `PrismaService` is not constructed by this analysis |
| A production factory or a new provider                               | E0 adds neither                                                                   |

D2, D3, D4, D5, and D6 stay unselected. `OQ-S4-02` stays **OPEN**. `D-CONN04-FULL-D-IA-S4-EXEC` stays **NOT ESTABLISHED**. Invocation stays **NOT APPROVED**.

### 5.2 What risks are avoided

E0 avoids a live instance that still has `proveWriteAuthority`. It avoids constructing `PrismaMigrationGateAdapter` and its audit collaborator for this decision. It avoids `PrismaService.onModuleInit`. It avoids a factory that accepts test doubles and is later treated as an operational Entry. It avoids an export-list edit. It avoids placing `new Conn04SystemJobMigrationEntry` inside the accepted M1 file. It avoids binding a port and a `PrismaService` that might address different stores, because no pair is chosen.

### 5.3 What progress remains possible

The following work stays possible while E0 is the standing recommendation:

| Work that remains possible                                         | Limit                                                    |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| Reading D2, D3, D4, D5, and D6 in the existing package             | The package selects none of them                         |
| Keeping the accepted unit specs that already construct doubles     | Those specs are tests. They are not an operational Entry |
| A later Product Owner sentence that selects E0, E1, or E2          | The sentence is not in this file                         |
| A later implementation authorization after a non-blocked selection | This analysis is not that authorization                  |

Stage 4 execution does not become possible under E0.

### 5.4 What additional evidence would justify reconsideration

Reconsideration of E0 would require a later Product Owner statement that refuses E0 and selects E1 or E2, plus evidence that does not exist today:

| Missing evidence                                                                                                                      | Why it would matter                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A named new file and an implementation authorization for E1                                                                           | E1 has no factory to accept                                               |
| A demonstration that the E1 factory passes five arguments and calls none of the instance methods                                      | Prevents the factory from becoming an invocation                          |
| A named provider token and module for E2, with the class still unexported                                                             | E2 otherwise collapses into an export change, which is outside the option |
| An explicit statement of whether context initialization is allowed to call `$connect`                                                 | E2's lifecycle effect is otherwise undecided                              |
| A statement of which type the caller may hold                                                                                         | The class includes write-authority methods                                |
| The same-store prerequisite for the port and `PrismaService`                                                                          | The constructor does not record a store id                                |
| Separate disposition of `OQ-S4-02`, a cohort decision, an environment decision, invocation approval, and `D-CONN04-FULL-D-IA-S4-EXEC` | Package §3 and §9 say a D1 selection alone does not authorize a run       |

---

## 6. Comparative assessment

No option is selected. The recommendation row is a recommendation.

| Criterion                        | E0 — no acquisition                                                                    | E1 — explicit factory                                                                                                                                                      | E2 — controlled provider                                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architectural fit                | Matches the accepted M1 contract: the function receives an Entry and contains no `new` | Adds one function outside M1, the Caller, and `ConnectionsModule`. Matches the package definition of E1                                                                    | Uses the module that already registers the class, or adds a provider beside it. Exporting the class is outside the option                                                              |
| Lifecycle correctness            | No Nest context and no `$connect`                                                      | Correct when the factory only receives collaborators whose owner already ran lifecycle. `new PrismaService()` skips `onModuleInit` and `onModuleDestroy`                   | Context initialization that includes `PrismaService` runs `onModuleInit` and therefore `$connect`. A later `get` does not repeat that hook. Not observed, because Nest was not started |
| Dependency minimization          | No dependencies obtained                                                               | Must still pass five arguments. Can pass inert objects for `boundary`, `writeUnit`, and `transactions`                                                                     | Resolving the registered class constructs the gate adapter, the audit collaborator, the metadata repository, and `PrismaService`                                                       |
| Side-effect risk                 | No classification read, no write transaction, and no connection from this decision     | The factory itself can be side-effect free. A live `PrismaService` argument can later serve `findFirst`. A live transaction argument can later serve `proveWriteAuthority` | Context initialization calls `$connect` and constructs the write-authority graph. `ConnectionsModule` also initializes `SecretVaultModule`                                             |
| Security and capability exposure | No instance                                                                            | The returned class still exposes lease and write-authority methods. Inert collaborators mean those methods do not reach the durable gate                                   | A live provider exposes lease and write-authority methods on a fully wired instance, including `transactions.run`                                                                      |
| Testability                      | No new test is required. Existing M1 null-Entry coverage remains the check             | The existing `new` pattern in the specs is the pattern a later factory test would follow                                                                                   | A later Nest test would initialize a context. That test is not run here                                                                                                                |
| Implementation complexity        | No source change                                                                       | One new function and its tests, behind a later authorization that names the file                                                                                           | Module ownership, initialization failure, export review, and a decision about wrapper versus class type                                                                                |
| Reversibility                    | Nothing is added                                                                       | A new unregistered file can be removed without editing the accepted hashes                                                                                                 | A provider added to `ConnectionsModule` later would be a module edit. `connections.module.ts` is outside the five accepted Stage 4 files and is still not edited here                  |
| Required PO decisions            | One later D1-E0 sentence. It does not approve invocation                               | One later D1-E1 sentence, then a separate implementation authorization before any file exists                                                                              | One later D1-E2 sentence, then a separate implementation authorization. This analysis is the lifecycle review the package deferred. It is not that authorization                       |

### 6.1 Recommendation

**RECOMMENDATION — NOT SELECTED.** E0.

**Confidence:** **HIGH** that E0 is the option to recommend. **The recommendation is not a selection.**

Reasoning:

1. The accepted M1 function receives an Entry and throws when the argument is null. Its source contains no construction. That contract is the current architectural boundary, and it is already accepted.
2. No production factory and no provider lookup exist. E1 and E2 are descriptions of source that would have to be written later.
3. Classification uses two of the five constructor dependencies. The constructor still requires the other three, and the instance still exposes `proveWriteAuthority` and the lease methods. Neither E1 nor E2 removes those methods from the class.
4. E1 can avoid booting Nest and can avoid constructing `PrismaMigrationGateAdapter`, but only by passing objects the factory did not build. A live port and a live `PrismaService` still have to come from somewhere. Building `PrismaService` inside the factory skips the only application `$connect` / `$disconnect` pair.
5. E2 follows Nest's lifecycle only by initializing a context. That initialization is the `$connect` site, and it constructs the write-authority graph even though classification does not call it. Retrieval of the unexported provider was not executed, so that part of E2 remains unresolved.
6. Invocation is **NOT APPROVED**. `OQ-S4-02` is **OPEN**. `D-CONN04-FULL-D-IA-S4-EXEC` is **NOT ESTABLISHED**. The package says a D1 choice does not by itself authorize a run. Recommending a factory or a provider would name a construction path while every run gate remains closed.
7. The class header still requires the Entry to stay unexported until a separately authorized consumer exists. No such consumer is authorized.

**Conditional observation, not a second recommendation and not a selection.** If a later Product Owner statement refuses E0, E1 is the smaller following boundary: it does not initialize `AppModule`, and it can avoid the gate adapter. That statement would still need its own implementation authorization, a named file, and the acceptance criteria in §3.7. This sentence does not select E1.

---

## 7. Unresolved questions and one unresolved proposal

| ID       | Item                                                                                                 | State                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| UQ-D1-01 | Whether a module context can retrieve the unexported Entry provider                                  | **UNRESOLVED.** Nest was not started                                                                                                                  |
| UQ-D1-02 | Whether an application E1 factory may pass inert objects for the three unused constructor parameters | **UNRESOLVED.** The spec pattern shows classification does not read them. No Product Owner statement accepts inert objects as an operational boundary |
| UQ-D1-03 | How the subject commit, the Caller, and M1 are placed in one process                                 | **UNRESOLVED.** The subject commit is not an ancestor of `main`. No composition commit is proposed                                                    |
| UQ-D1-04 | Whether the port and `PrismaService` used by a future factory address the same store                 | **UNRESOLVED.** The constructor records no store id                                                                                                   |

**UNRESOLVED PROPOSAL — NOT AN OPTION AND NOT SELECTED.** A classification-only facade could hold a `Conn04SystemJobMigrationEntry` privately and expose `classifyLiveConnectionAttempts` only. That facade is not E0, E1, or E2. It would be a new type. The accepted M1 parameter is the class, so adopting the facade as M1's parameter would change an accepted file. This analysis does not propose that change, does not select the facade, and does not add it to the option list.

---

## 8. Decision record draft

**Decision ID:** `D1` of package `PKG-CONN04-S4-INVOKE-PO-2026-11-08`, analyzed by `ANL-CONN04-S4-D1-ENTRY-2026-11-08`.  
**Draft ID:** `DRAFT-CONN04-S4-D1-ENTRY-2026-11-08`.  
**Status:** **DRAFT — NOT RECORDED.** Product Owner **Oleksandr Shvachko** has not spoken an accepting sentence for this draft. This task does not speak one.

| Field                              | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Options                            | E0, E1, and E2, as defined in §1. No fourth option                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Recommended option                 | **E0. NOT SELECTED**                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Rationale                          | §6.1. The accepted boundary receives an Entry. No production factory exists. Both acquisition options leave write-authority methods on the instance. E2's context initialization is the `$connect` site. Invocation, `OQ-S4-02`, and execution authorization remain unchanged                                                                                                                                                                                             |
| Conditions and limitations         | The draft selects nothing. It does not implement a factory or a provider. It does not modify the five accepted Stage 4 files, the Caller, or M1. It does not export the Entry. It does not close `OQ-S4-02`. It does not approve invocation. It does not establish `D-CONN04-FULL-D-IA-S4-EXEC`. It does not execute Stage 4. It does not update the Decision Register. A future selection of E1 or E2 still requires a separate implementation authorization before code |
| Acceptance criteria for this draft | A future sentence matches one sentence below, including the analysis SHA-256 recorded by `ASMT-CONN04-S4-D1-ENTRY-2026-11-08`. One sentence selects one option. The sentence names this analysis id. The other package decisions stay unselected                                                                                                                                                                                                                          |
| PO acceptance                      | **NOT RECORDED**                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The sentences below use the token `ANALYSIS_SHA256`. The readiness assessment replaces that token with the analysis file hash. Speaking a sentence that still contains the token does not accept this draft.

```text
PO ACCEPTANCE: I select D1 option E0 in ANL-CONN04-S4-D1-ENTRY-2026-11-08 at SHA-256 ANALYSIS_SHA256. Entry acquisition stays blocked. No Entry is obtained. This statement selects only D1-E0. It does not implement a factory or a provider. It does not select D2, D3, D4, D5, or D6. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D1 option E1 in ANL-CONN04-S4-D1-ENTRY-2026-11-08 at SHA-256 ANALYSIS_SHA256. A later implementation authorization may define an explicit factory that calls new Conn04SystemJobMigrationEntry with the five collaborators passed in. This statement does not implement that factory. It does not construct an Entry. It does not boot Nest. It does not export Conn04SystemJobMigrationEntry. It does not modify the accepted Stage 4, Caller, or M1 files. It does not select D2, D3, D4, D5, or D6. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

```text
PO ACCEPTANCE: I select D1 option E2 in ANL-CONN04-S4-D1-ENTRY-2026-11-08 at SHA-256 ANALYSIS_SHA256. A later implementation authorization may define a dedicated controlled provider for Conn04SystemJobMigrationEntry. This statement does not implement that provider. It does not register a provider. It does not boot Nest. It does not resolve a provider. It does not construct an Entry. It does not export Conn04SystemJobMigrationEntry. It does not modify the accepted Stage 4, Caller, or M1 files. It does not select D2, D3, D4, D5, or D6. It does not approve invocation. It does not close OQ-S4-02. It does not establish D-CONN04-FULL-D-IA-S4-EXEC. It does not execute Stage 4.
```

The package file still contains its own D1 templates bound to `PKG-CONN04-S4-INVOKE-PO-2026-11-08`. This draft does not replace those templates and does not edit that file. The package E2 template says the lifecycle review has not been done. That sentence described the package at the time it was written. This analysis is the later review. It leaves the package bytes unchanged. A future statement that selects E2 should cite this analysis. This paragraph does not select E2.

---

## 9. Result

**D1 ENTRY ANALYSIS = PREPARED.**  
**E0 = AVAILABLE.**  
**E1 = ANALYZED.**  
**E2 = ANALYZED.**  
**D1 RECOMMENDATION = E0 — NOT SELECTED.**  
**D1 PO ACCEPTANCE = NOT RECORDED.**

An Entry type, a five-argument constructor, an unexported Nest registration, and test constructions exist. No production factory exists. The accepted M1 function receives an Entry and does not build one. No Entry was constructed for this analysis. Stage 4 was not executed.

---

**END OF D1 ENTRY ACQUISITION ANALYSIS**

**PREPARED — RECOMMENDATION NOT SELECTED.** This analysis does not grant implementation or execution authorization. Stage 4 was not executed.
