# RC-26 Epic 4 — Trading Orchestrator Domain Model

**Status:** Epic 4 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Immutable Trading Orchestrator domain entities only — no workflow engine, no strategy selection, no Runtime / Session / Orders / Risk / persistence / REST  
**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md) · [Epic Breakdown](./rc-26-epic-breakdown.md)  
**Contracts:** [Domain Model Contract](./rc-26-domain-model-contract.md) · [API Contract](./rc-26-api-contract.md)  
**Predecessor:** [Epic 3 Market State Domain Model](./rc-26-epic3-domain-model.md) (**approved**)

## Implementation Report

### What shipped

Immutable create / transition factories:

| Contract / task entity   | Code                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| TradingOrchestrator      | `createTradingOrchestrator`                                                                   |
| OrchestrationPlan        | `createOrchestrationPlan` / `withOrchestrationPlanLifecycle` / `publishNextOrchestrationPlan` |
| OrchestrationPlanVersion | `createOrchestrationPlanVersion` + overwrite / monotonic guards                               |
| OrchestrationIntent      | `createOrchestrationIntent` (`selectsStrategy/createsSession/executesActions: false`)         |
| OrchestrationLifecycle   | `createOrchestrationLifecycle` / `transitionOrchestrationLifecycle`                           |
| OrchestrationMetadata    | `createOrchestrationMetadata` (opaque State/Qual/Profile refs)                                |

Lifecycle edges (manual immutable records only):

```text
created → planned | cancelled | archived
planned → ready | cancelled | archived
ready → cancelled | archived
cancelled → archived
```

Versioning:

- Append-only; first version must be `1`
- Next version must be `max+1`
- Duplicate version numbers rejected
- Publishing a new ready plan archives the prior ready copy (new immutable object)

Also:

- Shared catalogs (`ORCHESTRATION_LIFECYCLE_STATUSES`, mode contexts, transition map)
- Boundary owned-concerns expanded (plan / intent / lifecycle / metadata / identity)
- Domain Model Contract §§3, 6–9 updated to Epic 4 vocabulary; Selection / Tactic / Handoff deferred to Epic 5+
- Service / query / Library / Gate Nest ports remain **inactive**
- No workflow behaviour

### Modules touched

| Path                                                 | Change                                       |
| ---------------------------------------------------- | -------------------------------------------- |
| `apps/api/src/modules/trading-orchestrator/domain/*` | **New** domain shared + entities + specs     |
| Boundary / barrel / README                           | Owned concerns + exports updated             |
| `docs/project/rc-26-domain-model-contract.md`        | Orchestrator sections aligned to Epic 4 task |

### Ports / APIs affected

| Port / surface                      | Status                      |
| ----------------------------------- | --------------------------- |
| Domain create / lifecycle factories | **Active** (structure only) |
| `TRADING_ORCHESTRATOR_SERVICE_PORT` | **Inactive** (no workflow)  |
| `TRADING_ORCHESTRATOR_QUERY_PORT`   | **Inactive**                |
| Library / Gate / Session consumers  | **Inactive**                |
| REST / persistence / queues         | **None**                    |

### Explicit out of scope (confirmed absent)

- Orchestration workflow engine / automatic transitions
- Strategy selection / TacticSelection / Session handoff
- Runtime Enforcement calls / soft-pass Gate
- Orders / Execution / Risk decisions
- Persistence product / REST / UI
- Market State classification (sibling module)

### Product alias mapping

| Task example            | Canonical code entity    |
| ----------------------- | ------------------------ |
| Trading Orchestrator    | `TradingOrchestrator`    |
| Orchestration Plan      | `OrchestrationPlan`      |
| Orchestration Intent    | `OrchestrationIntent`    |
| Orchestration Lifecycle | `OrchestrationLifecycle` |
| Orchestration Metadata  | `OrchestrationMetadata`  |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Entities already locked under Spec §5.5 / Domain Model Contract;
this epic materializes immutable domain factories only.
Vocabulary refined to TradingOrchestrator / OrchestrationPlan
per Epic 4 task — still coordination artifacts, not a workflow engine
or Execution Engine.)

Canonical ownership changed:
None (Orchestrator owns plans/intent/lifecycle/metadata;
Library / Gate / State / Qual / Profile / Session / execution SoT untouched)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                          | Result                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Spec v2.0 §5.5                   | **Compatible** — Orchestrator coordinates; does not execute / certify / enforce |
| Authority Matrix                 | **Compatible** — `orchestration_artifact`; never money/fills SoT                |
| Alias Dictionary                 | **Compatible** — Orchestrator ≠ Execution Engine; ≠ Library; ≠ Gate             |
| Market State (Epic 3)            | **Compatible** — opaque `marketStateRef` only; `ownsMarketState: false`         |
| Runtime Enforcement              | **Untouched** — `authorizesRuntime: false`; no Gate consumer wiring             |
| Strategy Library                 | **Untouched** — `selectsStrategy: false`; no Library consumer wiring            |
| Qualification / Profile          | **Untouched** — opaque refs only                                                |
| Session / Orders / Risk          | **Untouched** — `createsSession` / `submitsOrders` / `approvesRisk: false`      |
| Frozen paper path                | **Compatible**                                                                  |
| Duplicate Library / Gate / State | **None**                                                                        |

### Architecture validation checklist

| Check                                             | Result   |
| ------------------------------------------------- | -------- |
| Spec v2.0 compatibility                           | **PASS** |
| Authority Matrix compatibility                    | **PASS** |
| Alias Dictionary compatibility                    | **PASS** |
| Immutable entities + no overwrite                 | **PASS** |
| Lifecycle edges enforced                          | **PASS** |
| Version history monotonic                         | **PASS** |
| No workflow / selection / Session behaviour       | **PASS** |
| Orchestrator ≠ Library / Gate / State / Execution | **PASS** |
| No Runtime authorization                          | **PASS** |
| Dependency direction unchanged                    | **PASS** |

---

## Tests Summary

| Suite                | File                                               | Result       |
| -------------------- | -------------------------------------------------- | ------------ |
| Domain model         | `domain/trading-orchestrator-domain-model.spec.ts` | **PASS** (9) |
| Boundary ownership   | `domain/trading-orchestrator-boundary.spec.ts`     | **PASS** (6) |
| Ports posture        | `ports/trading-orchestrator.port.spec.ts`          | **PASS** (2) |
| Nest wiring          | `trading-orchestrator.module.spec.ts`              | **PASS** (1) |
| Dependency direction | `trading-orchestrator.boundaries.spec.ts`          | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/trading-orchestrator` → **21/21 PASS**  
**Regression:** `src/modules/market-state` → **25/25 PASS** (RC-26 combined **46/46**)

Coverage intent:

- Frozen aggregates; `mutable: false`
- Lifecycle Created/Planned/Ready/Cancelled/Archived only
- `publishNextOrchestrationPlan` archives prior ready; rejects overwrite / non-monotonic versions
- Intent never selects / creates Session / executes
- Orchestrator ≠ Library / Gate / State / Execution flags
- Service Nest ports still inactive

---

## Documentation Update Summary

| Document                                                          | Update                                 |
| ----------------------------------------------------------------- | -------------------------------------- |
| This Epic Report                                                  | **New**                                |
| [Domain Model Contract](./rc-26-domain-model-contract.md)         | Orchestrator §§3, 6–9 refined          |
| [RC-26 Epic Breakdown](./rc-26-epic-breakdown.md)                 | Epic 4 DoD aligned to plan/intent task |
| [RC-26 Implementation Plan](./rc-26-implementation-plan.md)       | Status → Epic 4 implemented            |
| `docs/README.md` / status / roadmap / CHANGELOG / release-history | Epic 4 pointers                        |
| Module README                                                     | Epic 4 posture                         |

---

## Epic 4 Definition of Done

- [x] Domain entities match Domain Model contract (TradingOrchestrator, Plan, Intent, Lifecycle, Metadata).
- [x] Lifecycle transitions documented and tested (Created/Planned/Ready/Cancelled/Archived edges only).
- [x] Plan version history append-only with overwrite protection.
- [x] Orchestration describes intent only — never workflow / selection / Session handoff in this epic.
- [x] Explicit authority labels: `orchestration_artifact` / coordination — never execution SoT.
- [x] No Orders / Risk-approve / Execution / Library-certify / Qualification-evaluate APIs.
- [x] Unit tests prove no workflow behaviour and identity flags (≠ Library / Gate / State / Execution).
- [x] Compiles and passes tests independently of live order path.
- [x] Service/query application ports remain inactive (deferred to Epic 5).

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
