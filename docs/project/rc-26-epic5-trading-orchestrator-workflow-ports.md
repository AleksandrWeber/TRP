# RC-26 Epic 5 — Trading Orchestrator Workflow Ports

**Status:** Epic 5 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Application ports + workflow coordination only — no execution, Session ownership, Orders, Risk approval, REST, or persistence  
**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md) · [Epic Breakdown](./rc-26-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-26-api-contract.md) · [Domain Model Contract](./rc-26-domain-model-contract.md)  
**Predecessor:** [Epic 4 Trading Orchestrator Domain Model](./rc-26-epic4-trading-orchestrator-domain-model.md) (**approved**)

## Implementation Report

### What shipped

| Surface                                                     | Code                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `TradingOrchestratorServicePort`                            | `TradingOrchestratorService` → `OrchestrationWorkflowCoordinator`    |
| `TradingOrchestratorQueryPort`                              | `TradingOrchestratorQueryService`                                    |
| Workflow coordinator                                        | Market State → Library → Gate → Session handoff intent               |
| OrchestrationRun / SelectionDecision / SessionHandoffIntent | Immutable domain factories                                           |
| Library consumer                                            | Delegates Lookup + Eligibility (RC-22)                               |
| Gate consumer                                               | Delegates `validateDeployment` (RC-23)                               |
| Market State consumer                                       | Seedable in-memory current-state views (aliases later to Query port) |
| Risk policy consumer                                        | Null-read adapter (no approveRisk; Risk Nest port deferred)          |

Nest wiring:

- Imports `StrategyLibraryModule` + `RuntimeEnforcementModule`
- Provides / exports Service + Query tokens
- Does **not** import Trading Session / Orders / Risk / Execution modules

### Ports / APIs affected

| Port / surface                                      | Status                           |
| --------------------------------------------------- | -------------------------------- |
| `TRADING_ORCHESTRATOR_SERVICE_PORT`                 | **Active**                       |
| `TRADING_ORCHESTRATOR_QUERY_PORT`                   | **Active**                       |
| Library / Gate / Market State / Risk-read consumers | **Active** (Risk = null reads)   |
| Session handoff intent emission                     | **Active** (intent records only) |
| Consumer-read / REST / persistence                  | **Inactive**                     |

### Explicit out of scope (confirmed absent)

- Session creation / lifecycle ownership
- Order submission / Execution
- Risk Decision production / Kill Switch
- Strategy certification / envelope invention
- Soft-pass Runtime Enforcement
- Classification algorithms
- Persistence product / REST / UI

### Product alias mapping

| Task example         | Canonical code                     |
| -------------------- | ---------------------------------- |
| Workflow coordinator | `OrchestrationWorkflowCoordinator` |
| Service port         | `TradingOrchestratorServicePort`   |
| Query port           | `TradingOrchestratorQueryPort`     |
| Handoff intent       | `SessionHandoffIntent`             |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Coordination sequence already locked under Spec §5.5 / API Contract;
this epic materializes Nest ports + delegation adapters.)

Canonical ownership changed:
None (Library / Gate / State / Session / Risk / Orders ownership untouched)

New runtime:
None (process-local in-memory coordination store only — not persistence product)

Backward compatibility:
100%

Architecture debt introduced:
None
(Risk policy Nest port remains logical/null until Risk Engine exposes read port;
Market State Query Nest port still inactive — Orchestrator uses seedable consumer buffer.)
```

---

## Compatibility Report

| Surface                        | Result                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| Spec v2.0 §5.5                 | **Compatible** — coordinates; does not execute / certify / enforce |
| Authority Matrix               | **Compatible** — `orchestration_artifact`; never money/fills SoT   |
| Alias Dictionary               | **Compatible** — Orchestrator ≠ Execution Engine                   |
| Strategy Library               | **Compatible** — Lookup/Eligibility consume only                   |
| Runtime Enforcement            | **Compatible** — fail-closed Gate consume; no soft-pass            |
| Market State                   | **Compatible** — read input only; no State ownership               |
| Trading Session                | **Compatible** — handoff intent only; no Session module import     |
| Frozen paper path              | **Compatible**                                                     |
| Duplicate Library / Gate logic | **None** — delegated                                               |

### Architecture validation checklist

| Check                                                          | Result   |
| -------------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                        | **PASS** |
| Authority Matrix compatibility                                 | **PASS** |
| Alias Dictionary compatibility                                 | **PASS** |
| Workflow sequencing (State → Library → Gate → handoff)         | **PASS** |
| Delegation only / no duplicated business logic                 | **PASS** |
| Failure propagation (missing State / ineligible / Gate reject) | **PASS** |
| Dependency direction (one-way consume; no reverse)             | **PASS** |
| No Session / Orders / Risk ownership                           | **PASS** |

---

## Tests Summary

| Suite                | File                                               | Result       |
| -------------------- | -------------------------------------------------- | ------------ |
| Workflow integration | `application/orchestration-workflow.spec.ts`       | **PASS** (7) |
| Domain model (E4)    | `domain/trading-orchestrator-domain-model.spec.ts` | **PASS** (9) |
| Boundary ownership   | `domain/trading-orchestrator-boundary.spec.ts`     | **PASS** (6) |
| Ports posture        | `ports/trading-orchestrator.port.spec.ts`          | **PASS** (2) |
| Nest wiring          | `trading-orchestrator.module.spec.ts`              | **PASS** (1) |
| Dependency direction | `trading-orchestrator.boundaries.spec.ts`          | **PASS** (3) |

**Gate:** `pnpm --filter api exec vitest run src/modules/trading-orchestrator` → **28/28 PASS**

Coverage intent:

- Happy path sequencing with Library before Gate
- Missing Market State rejection
- Out-of-envelope / ineligible tactic via Library eligibility
- Gate reject fail-closed + reason propagation
- Confirmation required before selection
- Handoff intent never creates Session / Order / Risk Decision

---

## Documentation Update Summary

| Document                                                          | Update                            |
| ----------------------------------------------------------------- | --------------------------------- |
| This Epic Report                                                  | **New**                           |
| [RC-26 Epic Breakdown](./rc-26-epic-breakdown.md)                 | Epic 5 DoD checked                |
| [RC-26 Implementation Plan](./rc-26-implementation-plan.md)       | Status → Epic 5 implemented       |
| [API Contract](./rc-26-api-contract.md)                           | Status note for Epic 5 activation |
| `docs/README.md` / status / roadmap / CHANGELOG / release-history | Epic 5 pointers                   |
| Module README                                                     | Epic 5 posture                    |

---

## Epic 5 Definition of Done

- [x] `TradingOrchestratorServicePort` can start/confirm/cancel runs and propose selections.
- [x] Operator confirmation semantics where `requiresConfirmation` / session mission change.
- [x] Strategy selection uses Library Lookup/Eligibility — never local certified lists.
- [x] Tactic selection validates via Library eligibility (envelope) — fail closed.
- [x] Deployment/Session bind path calls Runtime Enforcement Gate — fail closed.
- [x] Session handoff emits intents — Orchestrator does not own Session state.
- [x] Risk Engine consumed only as policy/constraint reads (null adapter until Nest port exists).
- [x] Unit/integration tests: happy path, missing State, ineligible, Gate reject, confirmation.
- [x] Compiles/tests without Orders / Execution / live adapter.

**STOP:** Epic 5 complete for review. Do not start Epic 6 until approved.
