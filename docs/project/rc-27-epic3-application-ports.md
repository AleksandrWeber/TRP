# RC-27 Epic 3 — Exchange Scope Application Ports

**Status:** Epic 3 **approved**  
**Date:** 2026-08-14  
**Nature:** Exchange Scope application ports only — no trading-path integration, no Runtime / Session / Orders / Execution / Risk, no REST / persistence product  
**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md) · [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-27-api-contract.md) §§4–5, §8 · [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Predecessor:** [Epic 2 Domain Model](./rc-27-epic2-domain-model.md) (**approved**)

## Implementation Report

### What shipped

- `ExchangeScopeLifecycleService` (`ExchangeScopeServicePort`):
  - `registerExchangeScope` / `activateExchangeScope` / `suspendExchangeScope` / `archiveExchangeScope`
  - `updateExchangeScopeConfig` (append-only config publish)
  - `publishExchangeRiskPolicy` (policy inputs only)
  - `bindTradingAccount` / `unbindTradingAccount`
  - `setAdapterBindingContext` (logical only)
- `ExchangeScopeQueryService` (`ExchangeScopeQueryPort`):
  - get / list scopes, config, policy, bindings, adapter context
  - Views carry isolation authority flags (`isRuntime` / `approvesRisk` / `submitsOrders` = false)
- `ExchangeScopeConsumerReadAdapter` (`ExchangeScopeConsumerReadPort`):
  - Immutable projections for Reporting / Command Center / Orchestrator / Notification
- Process-local `InMemoryExchangeScopeStore` (not a persistence product)
- Deterministic id helpers (`deriveExchangeScopeId`, binding / policy / adapter ids)
- Nest wiring: service / query / consumer-read tokens **active**
- Boundary posture: `exchangeScopeService` + `exchangeScopeQuery` + `consumerRead` = `true`

### Modules touched

| Path                                                              | Change                                    |
| ----------------------------------------------------------------- | ----------------------------------------- |
| `exchange-scope/ports/exchange-scope.port.ts`                     | Full Epic 3 typed contracts; ports active |
| `exchange-scope/adapters/in-memory-exchange-scope-store.ts`       | **New** process-local artifact store      |
| `exchange-scope/adapters/exchange-scope-consumer-read.adapter.ts` | **New** consumer projections              |
| `exchange-scope/application/derive-exchange-scope-ids.ts`         | **New** stable ids                        |
| `exchange-scope/domain/exchange-scope-consumer-read-model.ts`     | **New** projection types                  |
| `exchange-scope/exchange-scope-lifecycle.service.ts`              | **New** management service                |
| `exchange-scope/exchange-scope-query.service.ts`                  | **New** query service                     |
| `exchange-scope/exchange-scope.module.ts`                         | Wire service + query + consumer ports     |
| `exchange-scope/domain/exchange-scope-boundary.ts`                | Activate application ports                |

### Ports / APIs affected

| Port / surface                   | Status                         |
| -------------------------------- | ------------------------------ |
| `ExchangeScopeServicePort`       | **Active**                     |
| `ExchangeScopeQueryPort`         | **Active**                     |
| `ExchangeScopeConsumerReadPort`  | **Active** (read-only façades) |
| Trading-path / Runtime / Session | **Not wired**                  |
| REST / UI / persistence product  | **None**                       |

### Explicit out of scope (confirmed absent)

- Trading Session / Runtime / Orders / Execution / Risk integration
- Live Market Data / Exchange API communication / authentication / secrets
- Business routing / orchestration / strategy selection
- Durable persistence schema / REST controllers
- Epic 4 isolation enforcement against Orders path

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Ports already locked in Spec §5.10 + RC-27 API Contract;
this epic activates Nest application ports over approved domain factories)

Canonical ownership changed:
None (Exchange Scope owns isolation management ports;
Session / Risk / Orders / Execution / Library SoT untouched)

New runtime:
None (no schedulers / transport / exchange adapters)

Backward compatibility:
100%

Architecture debt introduced:
None intentional (durable persistence / REST deferred)
```

---

## Compatibility Report

| Surface                                              | Result                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Spec v2.0 §5.10 / §11                                | **Compatible** — Scope isolates via ports; shared engines untouched              |
| Authority Matrix                                     | **Compatible** — policy inputs ≠ Risk Decision; no execution SoT                 |
| Alias Dictionary                                     | **Compatible** — Cluster → Exchange Scope                                        |
| Cluster Isolation Invariants                         | **Compatible** — duplicate active venue rejected; suspended blocks capacity flag |
| Existing APIs / ports                                | **Additive** — no HTTP; Nest tokens only within Exchange Scope module            |
| RC-19 Exchange Scope identity                        | **Preserved** — `exchange-scope:{venue}` id derivation                           |
| RC-22…RC-26 closed modules                           | **Untouched** — no imports / reverse Nest wiring                                 |
| Trading Session / Orders / Risk / Execution / Ledger | **Untouched**                                                                    |
| Frozen paper path                                    | **Compatible** — no path changes                                                 |
| Duplicate Runtime / Risk / Execution                 | **None**                                                                         |
| Migration / backfill                                 | **N/A** — in-memory only                                                         |

### Architecture validation checklist

| Check                                                       | Result   |
| ----------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                     | **PASS** |
| Authority Matrix compatibility                              | **PASS** |
| Alias Dictionary compatibility                              | **PASS** |
| Application ports manage isolation only                     | **PASS** |
| Immutable consumer projections                              | **PASS** |
| No business routing / exchange API / auth                   | **PASS** |
| No Runtime / Session / Orders / Execution / Risk deps       | **PASS** |
| Scope never becomes Runtime / Session / Execution / Library | **PASS** |
| RC-19…RC-26 closed modules intact                           | **PASS** |

---

## Tests Summary

| Suite                  | File                                                        | Result       |
| ---------------------- | ----------------------------------------------------------- | ------------ |
| RC-19 identity         | `exchange-scope/domain/exchange-scope-identity.spec.ts`     | **PASS** (3) |
| Boundary invariants    | `exchange-scope/domain/exchange-scope-boundary.spec.ts`     | **PASS** (6) |
| Domain model           | `exchange-scope/domain/exchange-scope-domain-model.spec.ts` | **PASS** (8) |
| Ports posture          | `exchange-scope/ports/exchange-scope.port.spec.ts`          | **PASS** (2) |
| Nest application ports | `exchange-scope/exchange-scope.module.spec.ts`              | **PASS** (2) |
| Dependency direction   | `exchange-scope/exchange-scope.boundaries.spec.ts`          | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/exchange-scope` → **24/24 PASS**

Coverage intent:

- Register / activate / suspend / archive lifecycle via service port
- Append-only config + policy publish; duplicate active venue reject
- Query views + consumer projections with isolation authority flags
- Account bind without ledger ownership; adapter context without Execution Engine
- Dependency direction: no trading-path / REST / Prisma imports

---

## Documentation Update Summary

| Document                                                            | Update                                        |
| ------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                    | **New**                                       |
| [RC-27 Epic Breakdown](./rc-27-epic-breakdown.md)                   | Epic 3 DoD checked                            |
| [RC-27 Implementation Plan](./rc-27-implementation-plan.md)         | Status → Epic 3 implemented (awaiting review) |
| [API Contract](./rc-27-api-contract.md)                             | Status note: Epic 3 ports active              |
| `docs/README.md`                                                    | Index Epic 3                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 3 pointer                                |
| `release-history.md` / `CHANGELOG.md`                               | Epic 3 entry                                  |
| Module README                                                       | `exchange-scope/README.md`                    |

---

## Epic 3 Definition of Done

- [x] `ExchangeScopeServicePort` can register/activate/suspend/archive scopes and update config/policy/bindings.
- [x] `ExchangeScopeQueryPort` can list/get scopes, config, policy inputs, bindings.
- [x] All commands require `workspaceId`; venue operations require `exchangeScopeId` after create.
- [x] Fail-closed on ambiguous / missing scope identity for scoped commands.
- [x] Default Binance scope creatable; second scope (e.g. Bybit) creatable at port level.
- [x] No Session create, Order submit, Risk approve, Gate soft-pass, Library certify ports.
- [x] Consumer read projections immutable and non-authoritative for money/fills/risk.
- [x] Unit/integration tests for happy path, duplicate venue reject, suspend capacity flag.
- [x] Compiles/tests without live adapter transport.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
