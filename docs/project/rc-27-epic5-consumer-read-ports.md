# RC-27 Epic 5 — Exchange Scope Consumer Read Ports

**Status:** Epic 5 **approved**  
**Date:** 2026-08-14  
**Nature:** Immutable consumer-read façades only — no commands, no REST, no persistence product, no trading-path behaviour  
**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md) · [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-27-api-contract.md) §8 · [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Predecessor:** [Epic 4 Trading Path Scope Integration](./rc-27-epic4-trading-path-scope-integration.md) (**approved**)  
**Successor:** [Epic 6 Authority Conformance](./rc-27-epic6-authority-conformance.md)

## Implementation Report

### What shipped

- `ExchangeScopeConsumerReadService` — Nest façade implementing `ExchangeScopeConsumerReadPort`
- `ExchangeScopeConsumerReadAdapter` — query adapter (store → frozen projections)
- Expanded immutable projections:
  - identity (`ExchangeScopeProjection` + `isActive`)
  - lifecycle (`ExchangeScopeLifecycleProjection`)
  - configuration summary
  - account bindings
  - policy inputs
  - metadata
  - active status
  - explicit workspace aggregate (`getWorkspaceAggregateProjection`) — never invents balances
- Intended audiences: Reporting, AI Analytics, Knowledge Lake, Command Center, Notification Delivery, Trading Orchestrator, Multi-Exchange UI
- Nest token `EXCHANGE_SCOPE_CONSUMER_READ_PORT` → `ExchangeScopeConsumerReadService`

### Modules touched

| Path                                                              | Change                            |
| ----------------------------------------------------------------- | --------------------------------- |
| `exchange-scope/domain/exchange-scope-consumer-read-model.ts`     | Epic 5 projection types + flags   |
| `exchange-scope/adapters/exchange-scope-consumer-read.adapter.ts` | Full query adapter surface        |
| `exchange-scope/exchange-scope-consumer-read.service.ts`          | **New** Nest consumer façade      |
| `exchange-scope/ports/exchange-scope.port.ts`                     | Port methods expanded             |
| `exchange-scope/exchange-scope.module.ts`                         | Wire service as consumer port     |
| `exchange-scope/conformance/consumer-read.spec.ts`                | **New** Epic 5 conformance        |
| `rc-27-api-contract.md` §8                                        | Locked expanded consumer contract |

### Explicit out of scope (confirmed absent)

- Exchange routing / exchange API / Runtime / Session / Orders / Execution
- REST / durable persistence / UI product
- Command mutations through consumer port
- Invented balances / fills / risk approvals in aggregates

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Consumer-read façades already locked in Spec §5.10 + RC-27 API Contract §8;
Epic 5 completes Nest façade + expanded immutable projections)

Canonical ownership changed:
None (Exchange Scope remains isolation / metadata SoT;
consumers receive projections only)

New runtime:
None

Backward compatibility:
100% (Epic 3 methods preserved; additive projections only)

Architecture debt introduced:
None intentional (REST / durable store deferred)
```

---

## Compatibility Report

| Surface                          | Result                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| Spec v2.0 §5.10 / §11            | **Compatible** — Scope isolates; consumers read only                   |
| Authority Matrix                 | **Compatible** — projections never claim Risk / Execution / Ledger SoT |
| Alias Dictionary                 | **Compatible** — Cluster → Exchange Scope                              |
| Cluster Isolation Invariants     | **Compatible** — aggregate is explicit & non-inventing                 |
| RC-19…RC-26                      | **Compatible** — no reverse Nest deps from engines                     |
| Existing Epic 3 consumer methods | **Preserved** (additive)                                               |
| Frozen paper path                | **Untouched**                                                          |

### Architecture validation checklist

| Check                                        | Result   |
| -------------------------------------------- | -------- |
| Spec v2.0 compatibility                      | **PASS** |
| Authority Matrix compatibility               | **PASS** |
| Alias Dictionary compatibility               | **PASS** |
| Immutable projections + authorityClass       | **PASS** |
| No commands on consumer port                 | **PASS** |
| Cross-scope aggregate never invents balances | **PASS** |
| No REST / persistence / routing              | **PASS** |
| RC-19…RC-26 closed modules intact            | **PASS** |

---

## Tests Summary

| Suite                     | File                                               | Result       |
| ------------------------- | -------------------------------------------------- | ------------ |
| Consumer read conformance | `exchange-scope/conformance/consumer-read.spec.ts` | **PASS** (5) |
| Nest wiring               | `exchange-scope/exchange-scope.module.spec.ts`     | **PASS** (2) |
| Dependency direction      | `exchange-scope/exchange-scope.boundaries.spec.ts` | **PASS** (3) |
| Full module suite         | `src/modules/exchange-scope`                       | **PASS**     |

**Gate:** `pnpm --filter api exec vitest run src/modules/exchange-scope` → **33/33 PASS**

Coverage intent:

- Immutable frozen projections + authority flags
- Lifecycle / metadata / active status / bindings / policy inputs
- Workspace aggregate inventsBalances/Fills/RiskApprovals = false
- Consumer port has no command methods
- Workspace / scope identity isolation
- Nest wires `ConsumerReadService` as port implementation

---

## Documentation Update Summary

| Document                                                          | Update                                 |
| ----------------------------------------------------------------- | -------------------------------------- |
| This Epic Report                                                  | **New**                                |
| [RC-27 Epic Breakdown](./rc-27-epic-breakdown.md)                 | Epic 5 DoD checked; STOP before Epic 6 |
| [RC-27 Implementation Plan](./rc-27-implementation-plan.md)       | Status → Epic 5 review                 |
| [API Contract](./rc-27-api-contract.md) §8                        | Expanded consumer port surface         |
| `docs/README.md` / status / roadmap / release-history / CHANGELOG | Epic 5 pointers                        |
| Module README                                                     | Epic 5 consumer surfaces               |

---

## Epic 5 Definition of Done

- [x] `ExchangeScopeConsumerReadPort` projects list / detail / lifecycle / config / policy / bindings / metadata / active status
- [x] Projections carry `authorityClass` and never claim risk / execution / ledger SoT
- [x] Intended consumers listed; reverse command dependencies forbidden (evidenced)
- [x] Cross-scope aggregate explicit, read-only, never invents balances
- [x] No REST / persistence product / UI shipped
- [x] Module README + index updates

**CLOSED for Epic 5:** Approved — consumed by Epic 6.
