# RC-27 Epic 2 — Exchange Scope Domain Model

**Status:** Epic 2 implemented — awaiting review  
**Date:** 2026-08-14  
**Nature:** Immutable Exchange Scope domain entities only — no trading-path integration, no Runtime / Session / Orders / Execution, no REST / persistence  
**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md) · [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Contracts:** [Domain Model Contract](./rc-27-domain-model-contract.md) · [API Contract](./rc-27-api-contract.md)  
**Predecessor:** [Epic 1 Exchange Scope Boundary](./rc-27-epic1-exchange-scope-boundary.md) (**approved**)

## Implementation Report

### What shipped

Immutable create / transition factories:

| Contract / task entity | Code                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| ExchangeScope          | `createExchangeScope` / `withExchangeScopeLifecycle` / `publishNextExchangeScopeConfig`     |
| ExchangeScopeVersion   | `createExchangeScopeVersion` + overwrite / monotonic guards                                 |
| ExchangeScopeLifecycle | `createExchangeScopeLifecycle` / `transitionExchangeScopeLifecycle`                         |
| ExchangeConfiguration  | `createExchangeScopeConfig` (alias `createExchangeConfiguration`)                           |
| ExchangeMetadata       | `createExchangeScopeMetadata` (alias `createExchangeMetadata`)                              |
| ExchangePolicyInputs   | `createExchangeRiskPolicy` / `publishNextExchangeRiskPolicy` (alias `ExchangePolicyInputs`) |
| ExchangeAccountBinding | `createTradingAccountBinding` / `unbindTradingAccount` (alias `ExchangeAccountBinding`)     |
| AdapterBindingContext  | `createAdapterBindingContext` (logical only; contract §7)                                   |

Lifecycle edges (manual immutable records only):

```text
created → active | archived
active → suspended | archived
suspended → active | archived
archived → (terminal)
```

Versioning:

- Append-only config publications; first version must be `1`
- Next version must be `max+1`
- Duplicate version numbers rejected
- Previous versions remain queryable in history
- Policy inputs versioned independently (`policyVersion`) with the same rules

Also:

- Shared catalogs (lifecycle statuses, venue codes, mode contexts, transition map)
- `blocksNewSessionCapacity` flag on suspended/archived (capacity input semantics only)
- Boundary owned-concerns expanded (`exchange-scope-version`, `exchange-scope-metadata`)
- Nest application ports remain **inactive**
- Epic 1 boundary / dependency-direction tests unchanged and still PASS

### Modules touched

| Path                                           | Change                                   |
| ---------------------------------------------- | ---------------------------------------- |
| `apps/api/src/modules/exchange-scope/domain/*` | **New** domain shared + entities + specs |
| Boundary / barrel / README                     | Owned concerns + exports updated         |
| `docs/project/rc-27-domain-model-contract.md`  | Status → Epic 2 materialized             |

### Ports / APIs affected

| Port / surface                      | Status                      |
| ----------------------------------- | --------------------------- |
| Domain create / lifecycle factories | **Active** (structure only) |
| `EXCHANGE_SCOPE_SERVICE_PORT`       | **Inactive**                |
| `EXCHANGE_SCOPE_QUERY_PORT`         | **Inactive**                |
| `EXCHANGE_SCOPE_CONSUMER_READ_PORT` | **Inactive**                |
| REST / persistence / queues         | **None**                    |

### Explicit out of scope (confirmed absent)

- Trading-path integration / routing / orchestration
- Runtime / Session / Orders / Execution / Accounting behaviour
- Authentication workflow / API communication / secrets management
- Automatic lifecycle generation
- Persistence product / REST / UI
- Application port activation (Epic 3)

### Product alias mapping

| Task example           | Canonical code entity    |
| ---------------------- | ------------------------ |
| ExchangeScope          | `ExchangeScope`          |
| ExchangeScopeVersion   | `ExchangeScopeVersion`   |
| ExchangeScopeLifecycle | `ExchangeScopeLifecycle` |
| ExchangeConfiguration  | `ExchangeScopeConfig`    |
| ExchangePolicyInputs   | `ExchangeRiskPolicy`     |
| ExchangeAccountBinding | `TradingAccountBinding`  |
| ExchangeMetadata       | `ExchangeScopeMetadata`  |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Entities already locked under Spec §5.10 / Domain Model Contract;
this epic materializes immutable domain factories only.)

Canonical ownership changed:
None (Exchange Scope owns isolation artifacts;
Session / Risk / Orders / Execution / Library SoT untouched)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                              | Result                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Spec v2.0 §5.10 / §11                                | **Compatible** — Scope isolates; shared engines; no fork                  |
| Authority Matrix                                     | **Compatible** — policy inputs ≠ Risk Decision; Cluster ≠ microservice    |
| Alias Dictionary                                     | **Compatible** — Cluster → Exchange Scope; no Cluster Risk Engine         |
| Cluster Isolation Invariants                         | **Compatible** — capacity block flags; policy per scope; no engine clones |
| Existing APIs / ports                                | **Unchanged** — no HTTP or Nest port providers                            |
| RC-19 Exchange Scope identity                        | **Preserved** — default Binance id + resolve helper intact                |
| RC-22 Strategy Library                               | **Untouched**                                                             |
| RC-23 Runtime Enforcement                            | **Untouched**                                                             |
| RC-24 Reporting / AI / Notification                  | **Untouched**                                                             |
| RC-25 Qualification / Profile                        | **Untouched**                                                             |
| RC-26 Market State / Orchestrator                    | **Untouched**                                                             |
| Trading Session / Orders / Risk / Execution / Ledger | **Untouched** — listed as non-owned                                       |
| Frozen paper path                                    | **Compatible** — no path changes                                          |
| Duplicate Runtime / Risk / Execution                 | **None**                                                                  |
| Migration / backfill                                 | **N/A** — no persistence                                                  |

### Architecture validation checklist

| Check                                                          | Result   |
| -------------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                        | **PASS** |
| Authority Matrix compatibility                                 | **PASS** |
| Alias Dictionary compatibility                                 | **PASS** |
| Exchange Scope ownership preserved (isolate only)              | **PASS** |
| Immutable entities / lifecycle / versioning / overwrite guards | **PASS** |
| Account bindings without auth/secrets/API                      | **PASS** |
| No ownership conflicts introduced                              | **PASS** |
| No Runtime / Orders / Execution / Session / Reporting deps     | **PASS** |
| Scope never becomes Runtime / Session / Execution / Library    | **PASS** |
| RC-19…RC-26 closed modules intact                              | **PASS** |

---

## Tests Summary

| Suite                | File                                                        | Result       |
| -------------------- | ----------------------------------------------------------- | ------------ |
| RC-19 identity       | `exchange-scope/domain/exchange-scope-identity.spec.ts`     | **PASS** (3) |
| Boundary invariants  | `exchange-scope/domain/exchange-scope-boundary.spec.ts`     | **PASS** (6) |
| Domain model         | `exchange-scope/domain/exchange-scope-domain-model.spec.ts` | **PASS** (8) |
| Inactive ports       | `exchange-scope/ports/exchange-scope.port.spec.ts`          | **PASS** (2) |
| Nest skeleton        | `exchange-scope/exchange-scope.module.spec.ts`              | **PASS** (1) |
| Dependency direction | `exchange-scope/exchange-scope.boundaries.spec.ts`          | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/exchange-scope` → **23/23 PASS**

Coverage intent:

- Immutable aggregates / value objects with frozen authority flags
- Created / Active / Suspended / Archived edges only; manual transitions
- Append-only config + policy versioning; overwrite + monotonic guards
- Account bindings + unbind without ledger ownership
- Adapter binding context never Execution Engine
- Dependency direction preserved (no trading-path imports)

---

## Documentation Update Summary

| Document                                                            | Update                                        |
| ------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                    | **New**                                       |
| [RC-27 Epic Breakdown](./rc-27-epic-breakdown.md)                   | Epic 2 DoD checked                            |
| [RC-27 Implementation Plan](./rc-27-implementation-plan.md)         | Status → Epic 2 implemented (awaiting review) |
| [Domain Model Contract](./rc-27-domain-model-contract.md)           | Status note: Epic 2 materialized              |
| `docs/README.md`                                                    | Index Epic 2                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 2 pointer                                |
| `release-history.md` / `CHANGELOG.md`                               | Epic 2 entry                                  |
| Module README                                                       | `exchange-scope/README.md`                    |

---

## Epic 2 Definition of Done

- [x] Immutable domain entities match Domain Model contract (+ task aliases documented).
- [x] Lifecycle transitions documented and tested (created/active/suspended/archived).
- [x] Version / overwrite protection for config and policy inputs (append-only).
- [x] Authority labels: `exchange_scope_artifact` / `exchange_policy_input`.
- [x] Explicit flags: Runtime / Session / Library / Risk / Execution always false.
- [x] No Orders / Risk-approve / Execution / Library-certify / Orchestrator / Session-own APIs.
- [x] Unit tests: immutability, lifecycle, versioning, overwrite protection, account bindings.
- [x] Compiles and passes tests independently of live exchange network.

**STOP:** Epic 2 complete for review. Do not start Epic 3 until approved.
