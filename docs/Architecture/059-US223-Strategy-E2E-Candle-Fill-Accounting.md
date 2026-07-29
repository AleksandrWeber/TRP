# US223 — End-to-End Strategy Candle → Fill → Accounting

Status: Implemented  
Milestone: RC-16 M3 / Epic E16  
Scope: Orchestrate the first complete strategy trading happy path from a
closed candle through Runtime, Signal Intent, Order proposal, canonical
Risk/Execution, Fill, and existing Position/Ledger accounting. No parallel
accounting or execution paths.

## Architecture

```text
ClosedCandle Market Event
        ↓
STRATEGY_RUNTIME_PORT.evaluate  (admit + Intent | NO_ACTION)
        ↓ SignalIntent
ORDER_PROPOSAL_PORT.proposeOrderFromSignalIntent
        ↓ PROPOSED strategy Order
CANONICAL_ORDER_PATH_PORT.runCanonicalPath
  ├─ RiskDecisionService.evaluate
  ├─ CashReservationPort.reserveCash
  ├─ EXECUTABLE
  └─ ExecutionEngineService.submit → Paper Adapter → Fill
        ↓ OrderFillRecorded
PositionAccountingConsumer.process  (US174)
  └─ Position + Ledger (existing)
```

Module: `apps/api/src/modules/strategy-trading-pipeline/`.

## Ownership (ADR-012 / ADR-017 / ADR-018)

| Owner                     | Role in E2E                                 |
| ------------------------- | ------------------------------------------- |
| Strategy Runtime          | Admit/evaluate → Signal Intent \| NO_ACTION |
| Orders                    | Propose strategy-origin Order               |
| Canonical Order Path      | Risk → reservation → Execution Engine       |
| Execution Engine          | Sole adapter submit + Fill fact             |
| Position Accounting       | Existing Fill → Position/Ledger consumer    |
| Strategy Trading Pipeline | Orchestration only — no domain ownership    |

## Outcomes

| Outcome             | Meaning                                   |
| ------------------- | ----------------------------------------- |
| `filled`            | Happy path through accounting             |
| `no_action`         | Runtime NO_ACTION — no Order/Fill         |
| `already_processed` | Same candle replay — no duplicate effects |
| `already_executed`  | Duplicate execution path — no second Fill |
| `order_rejected`    | Risk rejected                             |
| `rejected_*`        | Admission / lifecycle rejection           |

## Persistence note

Migration `20260729200000_us223_strategy_session_origin` relaxes the M2
`trading_sessions` origin check to allow `'strategy'` (US217 domain already
supported this; DB constraint lagged).

## Preserved boundaries

Forbidden: research Signal Engine / Evaluation Scheduler, direct Execution
Adapter calls, strategy-specific Position/Ledger writers, Runtime → Orders
reverse imports.

Enforced by `strategy-trading-pipeline.boundaries.spec.ts` and existing
Runtime/Orders boundary suites.
