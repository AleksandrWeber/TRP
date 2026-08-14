# RC-27 Epic 1 — Exchange Scope Boundary

**Status:** Epic 1 implemented — awaiting review  
**Date:** 2026-08-14  
**Nature:** Additive Exchange Scope bounded context only — no lifecycle behaviour, no trading-path integration, no Runtime / Session / Orders / Execution / Risk changes  
**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md) · [Epic Breakdown](./rc-27-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-27-api-contract.md) · [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Boundary diagram:** [rc-27-epic1-boundary-diagram.md](./rc-27-epic1-boundary-diagram.md)

## Implementation Report

### What shipped

- Nest module skeleton expanded: `apps/api/src/modules/exchange-scope/`
- Immutable boundary descriptor:
  - `EXCHANGE_SCOPE_BOUNDARY` — authority `exchange_scope_artifact`; UI alias Cluster; owns identity / config / context / lifecycle / account bindings / policy inputs; all ports inactive
- Inactive application port declarations (Symbols + stub interfaces) — **no implementations, no Nest providers**
- Injectable `ExchangeScopeBoundaryService`
- `ExchangeScopeModule` registered in `AppModule` beside — not replacing — Library / Enforcement / State / Orchestrator / Session / Orders / Risk
- RC-19 identity helpers preserved (`DEFAULT_BINANCE_EXCHANGE_SCOPE_ID`, `resolveExchangeScopeId`)
- Dependency-direction tests (no Runtime / Orders / Execution / Session / Reporting imports; no reverse Nest-surface deps from engines)
- Module README documenting ownership and non-goals
- Unit + Nest skeleton tests
- Boundary diagram document

### Modules touched

| Path                                     | Change                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/api/src/modules/exchange-scope/**` | **Expanded** — boundary + inactive ports + Nest module (RC-19 identity kept) |
| `apps/api/src/app.module.ts`             | Import `ExchangeScopeModule`                                                 |

### Ports / APIs affected

**Declared inactive only.** No register/activate behaviour, no trading-path wiring, no REST, no persistence, no transport.

| Token                               | Module         | Active? |
| ----------------------------------- | -------------- | ------- |
| `EXCHANGE_SCOPE_SERVICE_PORT`       | exchange-scope | **No**  |
| `EXCHANGE_SCOPE_QUERY_PORT`         | exchange-scope | **No**  |
| `EXCHANGE_SCOPE_CONSUMER_READ_PORT` | exchange-scope | **No**  |

### Explicit out of scope (confirmed absent)

- Domain entity factories (Epic 2)
- Active Exchange Scope lifecycle / query ports (Epic 3)
- Trading-path integration / isolation enforcement wiring (Epic 4)
- Consumer read activation (Epic 5)
- Authority conformance closeout (Epic 6)
- Runtime / Library / Session / Orders / Execution / Risk behaviour changes
- Reporting / AI / Notification redesign
- UI / REST / persistence / transport

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Exchange Scope materializes Spec v2.0 §5.10 as a boundary skeleton —
module already on Spec / Isolation Invariants; Spec modules unchanged.
RC-19 identity remains the thin default Binance hook.)

Canonical ownership changed:
None (ownership declared in code invariants; no fact families moved)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                              | Result                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Spec v2.0 §5.10 / §11                | **Compatible** — Scope isolates; shared engines; no fork                   |
| Authority Matrix                     | **Compatible** — Scope + policy inputs; never Risk/Execution SoT           |
| Alias Dictionary                     | **Compatible** — Cluster → Exchange Scope; no Cluster Risk Engine          |
| Cluster Isolation Invariants         | **Compatible** — isolation-only boundary declared; engine clones forbidden |
| Existing APIs / ports                | **Unchanged** — no HTTP or active application command ports                |
| RC-19 Exchange Scope identity        | **Preserved** — default Binance id + resolve helper intact                 |
| RC-22 Strategy Library               | **Untouched** — remains certification SoT                                  |
| RC-23 Runtime Enforcement            | **Untouched** — remains Gate                                               |
| RC-24 Reporting / AI / Notification  | **Untouched** — future consumers only                                      |
| RC-25 Qualification / Profile        | **Untouched**                                                              |
| RC-26 Market State / Orchestrator    | **Untouched**                                                              |
| RC-21 Knowledge Lake                 | **Untouched**                                                              |
| RC-20 Command Center                 | **Untouched** — future Cluster surface                                     |
| Trading Session lifecycle            | **Untouched** — no Session integration in Epic 1                           |
| Orders / Risk / Execution / Ledger   | **Untouched** — listed as non-owned; no integration                        |
| Frozen paper path                    | **Compatible** — no path changes                                           |
| Duplicate Runtime / Risk / Execution | **None**                                                                   |
| Migration / backfill                 | **N/A** — no persistence                                                   |

### Architecture validation checklist

| Check                                                       | Result   |
| ----------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                     | **PASS** |
| Authority Matrix compatibility                              | **PASS** |
| Alias Dictionary compatibility                              | **PASS** |
| Exchange Scope ownership preserved (isolate only)           | **PASS** |
| No ownership conflicts introduced                           | **PASS** |
| No duplicate Runtime / Risk / Execution / Library           | **PASS** |
| No Runtime / Orders / Execution / Session / Reporting deps  | **PASS** |
| Scope never becomes Runtime / Session / Execution / Library | **PASS** |
| RC-19…RC-26 closed modules intact                           | **PASS** |

---

## Tests Summary

| Suite                     | File                                                    | Result       |
| ------------------------- | ------------------------------------------------------- | ------------ |
| RC-19 identity (retained) | `exchange-scope/domain/exchange-scope-identity.spec.ts` | **PASS** (3) |
| Boundary invariants       | `exchange-scope/domain/exchange-scope-boundary.spec.ts` | **PASS** (6) |
| Inactive ports            | `exchange-scope/ports/exchange-scope.port.spec.ts`      | **PASS** (2) |
| Nest skeleton             | `exchange-scope/exchange-scope.module.spec.ts`          | **PASS** (1) |
| Dependency direction      | `exchange-scope/exchange-scope.boundaries.spec.ts`      | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/exchange-scope` → **15/15 PASS**

Coverage intent:

- `exchange_scope_artifact` authority class; UI alias Cluster
- Owned concerns declared without lifecycle / trading-path behaviour
- Non-ownership of Library / Gate / Qualification / Profile / State / Orchestrator / Session / Risk / Orders / Execution / Accounting / Reporting
- Forbidden capabilities including become-runtime, clone engines, approve-risk, submit-order
- Epic 1 ports remain inactive; port tokens not Nest-provided
- Dependency direction: no forbidden imports; no reverse Nest-surface deps from engines / peers

---

## Documentation Update Summary

| Document                                                            | Update                                        |
| ------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                    | **New**                                       |
| [Boundary Diagram](./rc-27-epic1-boundary-diagram.md)               | **New**                                       |
| [RC-27 Epic Breakdown](./rc-27-epic-breakdown.md)                   | Epic 1 status + DoD checked                   |
| [RC-27 Implementation Plan](./rc-27-implementation-plan.md)         | Status → Epic 1 implemented (awaiting review) |
| Planning companions (API / Domain / Integration / …)                | Status note: package approved → Epic 1 done   |
| `docs/README.md`                                                    | Index Epic 1                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md` | Epic 1 pointer                                |
| `CHANGELOG.md`                                                      | Unreleased Epic 1 entry                       |
| Module README                                                       | `exchange-scope/README.md`                    |

---

## Epic 1 Definition of Done

- [x] Module named and documented (canonical: **Exchange Scope** — UI: Cluster; not Runtime, not Session, not Library, not Lake).
- [x] Ownership table accepted: Scope owns identity / config / context / lifecycle / policy inputs / account bindings; business engines unchanged.
- [x] Explicit: Scope isolates; Scope never owns strategies, runtime validation, orchestration, orders, execution, or accounting.
- [x] Explicit: Multi-scope ≠ multi-runtime; no cloned Risk / Orders / Execution / Ledger / Library / Enforcement / Reporting.
- [x] Forbidden dependencies listed (no Scope → Risk Decision; no Scope → Order submit; no Scope → certify strategy).
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.10 Exchange Scope.

**STOP:** Epic 1 complete for review. Do not start Epic 2 until approved.
