# FIV-CONN-04-D — Trust-Boundary Review: PO-VAULT-A vs PO-VAULT-B

```text
INDEPENDENT TECHNICAL DISCOVERY — PENDING PRODUCT OWNER DECISION

KO-COND-01: OPEN — PENDING PRODUCT OWNER DECISION
FULL-D IA: GRANTED WITH AMENDMENTS
KICKOFF: COMPLETED — PASS WITH CONDITIONS
FULL-D IMPLEMENTATION: NOT STARTED
STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
BACKFILL: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**Document:** Focused evidence-based comparison of Nest DI visibility, invocation trust, and exact-ID data minimization for proposed Vault metadata access under Full-D.  
**Date:** 2026-10-30  
**Nature:** **DOCUMENTATION ONLY.** Does **not** select or ratify PO-VAULT-A or B. Does **not** implement, amend IA/register/Kickoff/Decision Package, or modify source/tests. Does **not** stage, commit, or push.

**Evidence labels:** **VERIFIED** | **INFERRED** | **UNKNOWN** | **PROPOSED DESIGN** (not implemented)

---

## 1. Repository and source baseline

| Field      | Value                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Branch     | `main`                                                                                  |
| HEAD       | `953292675e197d4f25778aaaa59eacb2826560fe`                                              |
| Index      | empty                                                                                   |
| IA SHA-256 | `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039` (**VERIFIED** match) |

### Sources / symbols inspected

| Area             | Paths / symbols                                                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision prep    | `v3-l02-fiv-conn-04-d-po-vault-authorization-decision-package.md`, Stage 1 design, IA §7.0, Kickoff Completion, Decision Register                                                                                                      |
| Entry / identity | `fiv-conn-04-d-system-job-migration-entry.ts`, `fiv-conn-04-d-system-job-identity.ts`, `migration-gate.ts` (`PrivilegedActorContext`)                                                                                                  |
| Modules          | `connections.module.ts`, `secret-vault.module.ts`, `app.module.ts`, importers of `SecretVaultModule`                                                                                                                                   |
| Vault            | `secret-vault.service.ts` (`list`/`get`/`retrieve`/`metadataFrom`), `vault-access-control.ts`, `secret-vault.repository.ts`, `prisma-secret-vault.repository.ts`, `secret-record.ts` (`SecretVaultMetadata` / `toSecretVaultMetadata`) |
| Membership       | `workspace-access.service.ts`                                                                                                                                                                                                          |
| Tokens           | `SECRET_VAULT_REPOSITORY`, `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY`                                                                                                                                                   |
| Export tests     | `fiv-conn-04-d-system-job-migration-entry.spec.ts` CONDITION-2                                                                                                                                                                         |
| Schema           | `schema.prisma` `VaultSecret` (`id` PK; unique `(workspaceId,type,purpose)`)                                                                                                                                                           |

---

## 2. Investigation A — NestJS DI / provider visibility

### 2.1 `SecretVaultModule` (**VERIFIED**)

| Fact                 | Evidence                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not `@Global()`      | Ordinary `@Module` in `secret-vault.module.ts`                                                                                                    |
| Owns                 | `VaultAccessControl`, `SecretVaultService`, `SECRET_VAULT_REPOSITORY`, clock, wrapping key                                                        |
| **Exports**          | **`SecretVaultService` only**                                                                                                                     |
| Does **not** export  | `VaultAccessControl`, `SECRET_VAULT_REPOSITORY`, clock, wrapping key                                                                              |
| Importers (app code) | `AppModule`, `ConnectionsModule`, `NotificationDeliveryModule`, `AiConnectivityModule`, `ExchangeConnectivityModule` (+ test/composition imports) |

**Consequence:** Any module that imports `SecretVaultModule` can inject **`SecretVaultService`** and call `list` / `get` / `retrieve` / mutate APIs (subject to `VaultAccessControl` on those methods). Nest **does not** limit export visibility to a single consumer module.

### 2.2 `ConnectionsModule` (**VERIFIED**)

| Provider                                                   | Nest-exported? | Notes                                       |
| ---------------------------------------------------------- | -------------- | ------------------------------------------- |
| `Conn04SystemJobMigrationEntry`                            | **No**         | Internal provider; CONDITION-2 tests assert |
| `Conn04MigrationBoundaryService`                           | **No**         |                                             |
| `MIGRATION_GATE_PORT` / `MIGRATION_GATE_DURABLE_AUTHORITY` | **No**         | Symbol tokens; same-module only via Nest    |
| `FivConn04APreflightService`                               | **Yes**        | Sole Connections export                     |
| `ConnectionsService`, audits, validator, adapter           | **No**         |                                             |

`ConnectionsModule` imports `SecretVaultModule` → **all** Connections providers (Entry, A preflight, `ConnectionsService`, …) may inject `SecretVaultService` today.

### 2.3 Visibility diagram (actual)

```text
AppModule
  ├─ imports SecretVaultModule ─────────────────────────────┐
  ├─ imports ConnectionsModule                              │
  │    imports SecretVaultModule ───────────────────────────┤
  │    providers: Entry, B-04, PORT, durable, A preflight,  │
  │               ConnectionsService, …                     │
  │    exports: [FivConn04APreflightService] only           │
  ├─ NotificationDeliveryModule → SecretVaultModule ────────┤
  ├─ AiConnectivityModule → SecretVaultModule ──────────────┤
  └─ ExchangeConnectivityModule → SecretVaultModule ────────┤
                                                            ▼
                                              SecretVaultModule (not Global)
                                              providers: VaultAccessControl,
                                                SecretVaultService, REPOSITORY, …
                                              exports: [SecretVaultService]
```

| Provider                         | Owning module | Export  | Unrelated module inject?             | Known consumers                                            |
| -------------------------------- | ------------- | ------- | ------------------------------------ | ---------------------------------------------------------- |
| `SecretVaultService`             | SecretVault   | **Yes** | **Yes** if imports SecretVaultModule | Connections, Exchange, AI, Notification, …                 |
| `VaultAccessControl`             | SecretVault   | **No**  | **No** via Nest export graph         | Injected into `SecretVaultService` only                    |
| `SECRET_VAULT_REPOSITORY`        | SecretVault   | **No**  | **No** via Nest export graph         | Vault service / module factories                           |
| `Conn04SystemJobMigrationEntry`  | Connections   | **No**  | **No** via Nest exports              | Same-module only (unless AppModule lists it — it does not) |
| `Conn04MigrationBoundaryService` | Connections   | **No**  | **No**                               | Entry + same-module                                        |
| `MIGRATION_GATE_PORT`            | Connections   | **No**  | **No**                               | Boundary / adapter wiring                                  |
| `FivConn04APreflightService`     | Connections   | **Yes** | **Yes** if imports ConnectionsModule | External Nest consumers of preflight                       |

### 2.4 Distinctions (**VERIFIED** / **INFERRED**)

| Concept                            | Status                                                   |
| ---------------------------------- | -------------------------------------------------------- |
| Provider visibility (Nest exports) | Restricts **which modules** can inject a token           |
| TypeScript source visibility       | `private` methods / non-exported types ≠ runtime auth    |
| Runtime object access              | Same-module providers freely inject each other           |
| Authorization                      | Only `VaultAccessControl` on Vault service methods today |

**Strict Entry-only DI boundary:** **Not established** in the current codebase and **not achievable by Nest exports alone** among Connections providers. Smallest _conventional_ arrangement:

1. Do **not** export a new metadata port from `SecretVaultModule` (unlike `SecretVaultService`).
2. Register a Connections-internal provider that only **Entry** constructor-injects (other providers simply omit it) — this is **composition convention**, enforceable by review/tests that scan constructors, **not** by Nest preventing `ConnectionsService` from adding the same injection later.
3. Keep Entry / B-04 / PORT unexported (already true).

**Could another module construct an equivalent provider?** **INFERRED:** Yes in principle — import `SecretVaultModule`, inject `SecretVaultService`, call `list` with any credentials; or, if a new port is exported, inject that port. Dynamic/test overrides (`notification-delivery.test-harness.ts` overrides `SecretVaultModule`) show the graph is mutable in tests.

---

## 3. Investigation B — Invocation authentication

### 3.1 Reject identity-string assumptions (**VERIFIED** threat model)

| Caller-supplied value                                 | Sufficient to authenticate Entry? | Why                                                                                                    |
| ----------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `actorKind = SYSTEM_JOB`                              | **No**                            | Plain string; forgeable by any in-process caller                                                       |
| `actorId = system-job:fiv-conn-04-migration-backfill` | **No**                            | Literal is public in source; factory builds it but any code can pass the same string to a gullible API |
| Capability name string                                | **No**                            | Same as caller-controlled enum                                                                         |
| `workspaceId` from caller                             | **No**                            | Establishes intended tenant claim only; does not authenticate caller                                   |
| `trusted = true`                                      | **No**                            | Caller-controlled boolean                                                                              |

`buildFivConn04DSystemJobActor` authenticates **nothing for Vault**. It constructs the **B-04** `PrivilegedActorContext` only (**VERIFIED**). Comment on `PrivilegedActorContext`: _“not a replacement for VaultConnections.”_

### 3.2 Existing capability-like patterns (**VERIFIED**)

| Pattern                             | File / symbol                                             | Actual protection                                                                                        |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Symbol DI tokens not exported       | `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY` | Nest: only Connections providers inject; **not** cryptographic; **not** Entry-only (B-04 also uses them) |
| Vault repository token not exported | `SECRET_VAULT_REPOSITORY`                                 | Nest: not available to modules that only import exported `SecretVaultService`                            |
| TypeScript `private` methods        | e.g. A preflight `loadVaultMetadataByWorkspace`           | Compile-time only; not runtime auth                                                                      |
| Export-wall tests                   | Entry CONDITION-2 specs                                   | Detect Nest **export** leaks; do not prove invocation auth                                               |
| Exchange “capability”               | Trading capability verification                           | Unrelated domain (venue features), not S2S auth                                                          |
| Notification resolvers              | Require `actorUserId`+`actorRole`                         | Still ACL-bound human context; fail-closed if missing                                                    |

**No** repository example of: unforgeable capability objects, cryptographic caller attestation, or Vault S2S principals was found.

### 3.3 Candidate mechanisms (design assessment — not implemented)

#### Mechanism 1 — Nest DI visibility only

Inject metadata port / Vault into Entry; do not export broadly.

| Aspect         | Assessment                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Meaningful?    | **Bounded architectural boundary** vs other _modules_ if port is **not** exported                        |
| Entry-only?    | **No** — any Connections provider can inject the same token                                              |
| Classification | **Bounded architectural boundary** + **convention** for Entry-only; **not** strong caller authentication |

#### Mechanism 2 — Private capability object / closure

Factory creates a closure held only by Entry.

| Aspect            | Assessment                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Nest enforcement? | Nest does not natively distribute closures to one provider; custom `useFactory` + single inject site = **convention** |
| Reconstructable?  | Another provider with repository/service access can bypass the closure                                                |
| Classification    | **Convention only** / **insufficient evidence** of strong technical boundary in this codebase                         |

#### Mechanism 3 — Dedicated internal port + explicit capability

Vault owns narrow port; composition supplies it to Entry.

| Aspect              | Assessment                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who creates         | **PROPOSED:** SecretVault module or Connections factory                                                                                             |
| Forge from strings? | If port methods take only `workspaceId`/`vaultSecretId` with **no** ACL, any holder of the port is powerful — DI possession **is** the capability   |
| vs A                | If port **bypasses** `VaultAccessControl`, it **is** a Vault-side privilege grant — policy-equivalent to A’s exception, packaged as a separate type |
| Classification      | **Bounded architectural boundary** (type/method surface, export walls) unless paired with additional invocation auth (**UNKNOWN** / not evidenced)  |

#### Mechanism 4 — Vault-side authorization policy (sibling or `VaultAccessControl`)

Explicit FIV-CONN-04-D metadata-list policy.

| Aspect                    | Assessment                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Differs from A?           | **Naming/structure may differ; security essence matches PO-VAULT-A** if it keys off SYSTEM_JOB strings or “internal call” flags |
| Avoid general SYSTEM_JOB? | Requires capability scoped tighter than `actorKind === SYSTEM_JOB` (**INFERRED**)                                               |
| Classification            | **Policy control** (needed by both A and strong B); **not** proven Entry authentication by itself                               |

### 3.4 Mechanism conclusions

| Mechanism           | Boundary class                                                     |
| ------------------- | ------------------------------------------------------------------ |
| 1 DI visibility     | Bounded architectural + convention; **not** Entry authentication   |
| 2 Closure           | Convention; insufficient as sole control                           |
| 3 Dedicated port    | Bounded architectural (surface/exports); auth ≈ possession of port |
| 4 Vault-side policy | Authorization policy; may equal A                                  |

**Do not call Nest DI “authenticated Entry invocation.”** Under a defined trust model, Nest DI proves **module composition intent**, not cryptographic or session authentication of the Entry class.

---

## 4. Investigation C — Exact-ID metadata / data minimization

### 4.1 Existing repository capabilities (**VERIFIED**)

| API                                                 | Behavior                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `listByWorkspaceId(workspaceId)`                    | All vault rows for workspace (full `SecretVaultRecord` including ciphertext columns mapped in repo)                                                          |
| `findBySlot({workspaceId,type,purpose})`            | Slot unique key — **not** exact `vaultSecretId`                                                                                                              |
| Exact `(workspaceId, vaultSecretId)` metadata query | **Does not exist** on `SecretVaultRepository`                                                                                                                |
| Prisma                                              | `VaultSecret.id` is PK — a `findUnique({ where: { id } })` is **technically possible** at Prisma layer but **not** exposed on the repository interface today |

### 4.2 IA §7.0 wording vs semantics

Quoted (**VERIFIED**):

> Fresh Vault **metadata** by exact `vaultSecretId` … `SecretVaultService.list(...)` → … then exact match `meta.id === connection.vaultSecretId`  
> **FACT:** No separate exact-id Vault getter exists. Exact-id freshness = `list` + id equality.  
> **Do not** use `SecretVaultService.get` … **not** exact-id lookup.

Also IMPL-REV-D-06: fresh Vault metadata (exact id) + occupancy + C before write txn.

| Interpretation                                 | Assessment                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Semantic requirement                           | Fresh **metadata** for the Connection’s exact id, purpose/state suitable for C, no secret material    | **VERIFIED** intent     |
| Literal requirement of calling public `list()` | Text currently **names** `list` + id equality as the approved algorithm                               | **VERIFIED** wording    |
| Exact-ID query returning one metadata row      | **Not** in current inventory; would need IA amendment if treated as replacement for named `list` path | **INFERRED** governance |

### 4.3 Shapes A / B / C

| Shape                            | Data across Vault→Connections                      | Unrelated meta exposed?                                                                              | WS isolation                                  | Exact-ID       | Purpose/state for C | Preserves §7.0 / D-06?                                                  | Extra repo/service work?                                       | Auth bypass risk?                      |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------- | ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| **A** Workspace list then filter | Full workspace `SecretVaultMetadata[]` then filter | **Yes**, briefly in Connections if filter is there; or only inside Vault if filter stays Vault-owned | Via `workspaceId` arg                         | Equality check | Yes                 | **Yes** if still fresh list+match                                       | Minimal if reuse `listByWorkspaceId` + `toSecretVaultMetadata` | If ACL bypassed for list               |
| **B** Exact-ID metadata query    | Single metadata or null                            | **No** (ideal)                                                                                       | Must require `workspaceId` **and** `id` match | Native         | Yes                 | **Semantic yes**; **literal §7.0 names list** → likely **IA amendment** | **New** repository/service method (**PROPOSED**)               | Same if ACL bypassed                   |
| **C** Reuse public `list()`      | Same as user path                                  | Yes at service return                                                                                | Owner+Role ACL                                | Filter after   | Yes                 | Literal yes                                                             | None                                                           | **Does not solve** SYSTEM_JOB auth gap |

### 4.4 Secret-value exclusion (**VERIFIED** for metadata DTO)

- `SecretVaultMetadata` / `toSecretVaultMetadata` omit ciphertext and secret field keys (**VERIFIED** `secret-record.ts`).
- `list` / `get` return metadata via `metadataFrom` (**VERIFIED**).
- `retrieve` returns decrypted fields — **must not** be on a metadata-only port (**VERIFIED** separate API).
- Repository `listByWorkspaceId` loads ciphertext into `SecretVaultRecord` in-process; mapping to metadata strips it before return if service uses `metadataFrom` (**VERIFIED**).
- If a port returned raw `SecretVaultRecord`, secrets could leak — **must** return metadata only (**INFERRED** design rule).

---

## 5. Direct comparison — strongest feasible A vs B

| Dimension                       | Strongest PO-VAULT-A                                                                                                | Strongest PO-VAULT-B                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Actual caller authentication    | Vault policy + hopefully Nest non-export; **strings alone insufficient**                                            | Possession of non-exported port token + policy; **still not Entry-class authentication**               |
| DI visibility                   | Exception on paths reachable via exported `SecretVaultService` (wide) **or** sibling only if carefully non-exported | Narrow type **can** stay non-exported → **better module-level visibility** than exporting full service |
| Runtime invocation restriction  | Any code holding `SecretVaultService` may hit exception path if poorly keyed                                        | Any Connections provider that injects the port may call it                                             |
| Capability creation / ownership | Vault ACL policy owns grant                                                                                         | Vault module owns port; Connections owns inject site                                                   |
| Workspace binding               | Must bind `workspaceId`                                                                                             | Must bind `workspaceId` (+ ideally exact id)                                                           |
| Exact-ID data minimization      | Typically Shape A (list+filter) unless also adds exact query                                                        | **Can** prefer Shape B (new query) — **main technical differentiator**                                 |
| Secret-value exclusion          | Metadata-only methods                                                                                               | Single-method port without `retrieve` — **easier least-privilege API surface**                         |
| Reuse/escape risk               | High if SYSTEM_JOB string exception is broad                                                                        | Lower across modules if **not exported**; same-module escape remains                                   |
| Revocation                      | Disable policy flag                                                                                                 | Unregister provider / flag                                                                             |
| Audit attribution               | Policy allow/deny events                                                                                            | Port-specific events                                                                                   |
| Required source files           | `vault-access-control.ts` (+/− service)                                                                             | New port + wiring; possibly repository exact-id; Entry inject                                          |
| IA §7 inventory                 | Exceeds (ACL MODIFY)                                                                                                | Exceeds (new files + possibly repo)                                                                    |
| Required negative tests         | Spoof strings; retrieve still denied; foreign WS                                                                    | Non-export; other Connections providers; retrieve absent; foreign WS/id                                |
| Residual risk                   | Spoof / broad exception                                                                                             | Port possession = power; same-module misuse                                                            |

### Architectural equivalence cases

**A and B are policy-equivalent** when:

- Both bypass human membership for metadata reads, and
- Both accept caller-supplied `workspaceId` (and optionally id) without proving Entry identity, and
- B’s port is merely a rename of “ACL exception + list”.

**B is stronger than A** only when **all** hold:

1. Port is **not** exported from `SecretVaultModule` (unlike `SecretVaultService`).
2. Port’s **method surface excludes** retrieve/store/revoke.
3. Preferably Shape B exact-ID query (data minimization) with `workspaceId`+`id` binding.
4. Negative tests prove other modules cannot inject the port.
5. Same-module misuse is constrained by review/tests (Nest cannot fully enforce Entry-only).

Even then, B does **not** magically authenticate the Entry class — it authenticates **holders of the port token**.

---

## 6. Security test design (do not implement)

| #   | Test                                                               | Level           | Expected                                                              | Invariant              |
| --- | ------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------- | ---------------------- |
| 1   | Trusted Entry obtains intended metadata                            | Integration     | Metadata for exact id                                                 | Happy path             |
| 2   | Unrelated Connections provider cannot obtain capability            | Module / static | Fail compile or DI if port not injected; or runtime deny if attempted | Same-module discipline |
| 3   | Unrelated module cannot inject via exports                         | Module metadata | Token absent from `SecretVaultModule.exports`                         | Export wall            |
| 4   | Caller supplying SYSTEM_JOB strings alone cannot obtain capability | Unit            | Deny / no-op                                                          | No string auth         |
| 5   | Forged workspace ID                                                | Integration     | No foreign metadata                                                   | Tenant isolation       |
| 6   | Secret id of another workspace                                     | Integration     | Null / closed                                                         | Exact-ID + WS bind     |
| 7   | Missing/deleted record                                             | Unit            | Fail closed                                                           | Freshness fail-closed  |
| 8   | No secret/ciphertext in result                                     | Unit            | `metadataContainsSecretFields` false                                  | Data minimization      |
| 9   | No retrieve/store/revoke on port type                              | Static / unit   | Type has no those methods                                             | Least privilege        |
| 10  | B-04 attribution still SYSTEM_JOB                                  | Integration     | Audit actorId canonical                                               | Identity separation    |
| 11  | Provider disable / flag                                            | Integration     | Subsequent calls fail                                                 | Revocation             |
| 12  | Audit no secret leakage                                            | Unit            | Safe fields only                                                      | Audit hygiene          |

---

## 7. Inventory and governance impact (provisional vs verified)

### Verified (current)

- IA §7 does **not** include Vault ACL MODIFY, new Vault ports, or exact-id repository methods.
- Entry MODIFY + `SecretVaultService` REUSE alone do **not** solve authorization.
- SYSTEM_JOB factory should remain unchanged for B-04.
- No schema change **required** for auth policy alone; exact-id query can use existing PK (**INFERRED** no migration for `find by id`).

### Proposed design impact (not authorized)

|                | Strong A                                                          | Strong B                                                                               |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Likely MODIFY  | `vault-access-control.ts`, maybe `secret-vault.service.ts`, Entry | Entry; `secret-vault.module.ts` providers; possibly repository interface + Prisma repo |
| Likely CREATE  | Policy helper / flag                                              | Metadata port interface + provider; specs                                              |
| Exports        | Prefer **not** widen Vault exports                                | Prefer **not** export port                                                             |
| IA §7          | Add ACL/policy MODIFY                                             | Add port CREATE + optional repo method; amend §7.0 if Shape B replaces named `list`    |
| Entry contract | Gains Vault/port dependency                                       | Same                                                                                   |
| Factory        | Unchanged                                                         | Unchanged                                                                              |

---

## 8. Independent recommendation

1. **Does B have a demonstrably stronger boundary than A?**  
   **Conditionally yes, but narrowly.** Strength comes from **(a)** non-exported narrow API surface (no `retrieve`) and **(b)** optional exact-ID data minimization — **not** from Nest “proving” the Entry identity. Without those, **A ≈ B**.

2. **Exact mechanism of advantage?**  
   Module **export walls** + **least-privilege type** + optional **Shape B query**; still **capability = DI possession**.

3. **When effectively the same?**  
   When B is an ACL bypass wrapped in a new class that still keys off forgeable identity or is exported beside `SecretVaultService`.

4. **Smallest secure design preserving autonomous Full-D?**  
   **INFERRED:** Non-exported Vault-owned metadata reader (Shape A list+filter **inside Vault** or Shape B exact-id) callable only via Connections DI, **without** human Role, **without** retrieve, with workspace(+id) binding and export/negative tests — plus **IA inventory amendment**. Treat “Entry-only among Connections providers” as **tested convention**, not Nest law.

5. **Evidence still missing for PO?**
   - Whether PO accepts **DI possession** as the trust model for autonomous Nest jobs.
   - Whether PO requires literal `list` (IA amendment for Shape B).
   - Whether same-module Connections misuse is an accepted residual risk.
   - No existing unforgeable S2S pattern to reuse (**VERIFIED** absence).

| Lens                  | Assessment                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Technical feasibility | Both feasible with new code + IA amendment                                                        |
| Security strength     | Strong B ≥ strong A on surface/data minimization; **neither** authenticates Entry class by itself |
| Implementation cost   | B usually higher (new types/repo); A smaller diff, easier to get wrong (broad exception)          |
| Governance            | Both need IA/inventory + renewed review; KO-COND-01 stays OPEN until PO decides                   |

**This review does not auto-prefer B** from the prior Decision Package. If PO rejects “DI possession = authorization,” recommend **`RETURN FOR FURTHER DISCOVERY`** (need authenticated S2S principal design) or **`REJECT ALL OPTIONS / KEEP STOP`** until a stronger trust model exists.

---

## 9. Open questions / evidence gaps

1. Accept Nest composition as the trust root for privileged Nest-internal jobs?
2. Amend IA §7.0 for exact-ID query vs keep literal `list`?
3. Accept same-module Connections provider residual risk?
4. Any future platform S2S auth standard? (**UNKNOWN** / absent today)
5. Should metadata port live in Vault BC vs Connections-local wrapper over repository? (export implications)

---

## 10. Explicit non-authorization

```text
THIS DOCUMENT DOES NOT SELECT PO-VAULT-A OR PO-VAULT-B.
THIS DOCUMENT DOES NOT RATIFY ANY OPTION.
THIS DOCUMENT DOES NOT CLOSE KO-COND-01.
THIS DOCUMENT DOES NOT AUTHORIZE IMPLEMENTATION.

KO-COND-01: OPEN — PENDING PRODUCT OWNER DECISION
FULL-D IMPLEMENTATION: NOT STARTED
STAGES 4–8: BLOCKED
FIV-CONN-04-E: NOT AUTHORIZED
BACKFILL: NOT STARTED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF TRUST-BOUNDARY REVIEW**
