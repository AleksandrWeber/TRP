# EventEmissionFailure Semantics — Research Execution Framework

Status: Verified  
Scope: SmokeBacktestService, HistoricalReplayService, WalkForwardValidationService,
MultiYearResearchService, DeterministicReplayValidationService

Related: [ADR-019 — Event Emission Semantics](../adr/ADR-019-event-emission-semantics.md)

## Selected Contract

**Contract B — Application events are infrastructure notifications.**

When application event emission cannot complete after business execution has
finished, the failure is an **infrastructure notification failure**, not a
business execution failure.

| Requirement       | Behavior                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| Execution status  | Remains `COMPLETED` after successful business execution                             |
| ExecutionResult   | Unchanged; cached via `lastResult()`                                                |
| Business state    | Unchanged; TradingSession already closed                                            |
| Failure recording | `eventEmissionDiagnostics()` captures emitter exception                             |
| Determinism       | Identical `ExecutionResult` under identical conditions; only diagnostics may differ |

Contract A (events as mandatory execution steps) is **not** implemented.

## Execution Ordering

All services commit business state before attempting completion notifications:

1. Execute business logic (create → start → cycles → stop).
2. Produce immutable `ExecutionResult` with `executionStatus: COMPLETED`.
3. Commit `completedResult` and metrics.
4. Attempt completion notifications via `notifyCompletion()` (best-effort).

`notifyCompletion()` uses `createApplicationEventNotificationState` from
`research-api`. Emitter exceptions are captured in `eventEmissionDiagnostics()`
and do not propagate to callers.

## Verification Answers

### Q1 — Does execution fail or complete?

**Execution completes.** `executionStatus` remains `COMPLETED` when notification
emission fails after business success.

### Q2 — State on emission exception after business completion

| Concern                | Behavior                                                |
| ---------------------- | ------------------------------------------------------- |
| TradingSession         | Closed via `stopSession` before notification            |
| ExecutionResult        | `COMPLETED`; unchanged after emission failure           |
| Cleanup completion     | `inFlight` reset in `finally`; business state committed |
| Repository consistency | Session record reflects stopped state                   |

### Q3 — Successful execution with failed emission

**ExecutionResult remains internally consistent.** Completion events may be absent
from `domainEvents()`, but `lastResult()` and metrics reflect successful business
execution. Diagnostics record the infrastructure failure.

### Q4 — Failure because of event emission

| Concern       | Behavior                                                            |
| ------------- | ------------------------------------------------------------------- |
| Error type    | None propagated — execution resolves successfully                   |
| Failure event | No `*Failed` lifecycle event for infrastructure-only failure        |
| Diagnostics   | `EventEmissionDiagnostic` with `eventType`, `message`, `occurredAt` |
| Cleanup       | Completed result cached; `inFlight` cleared                         |

### Q5 — Deterministic behavior

Repeated execution under identical EventEmissionFailure conditions produces
identical `ExecutionResult` values. Infrastructure diagnostics are also
deterministic when clock is fixed.

## Cross-Service Consistency Matrix

| Service                              | Completion notifications                                   | Diagnostics API              | Result on emission failure |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------- | -------------------------- |
| SmokeBacktestService                 | `SmokeBacktestCompleted`                                   | `eventEmissionDiagnostics()` | `COMPLETED`                |
| HistoricalReplayService              | `HistoricalReplayCompleted`, `HistoricalReplayFinished`    | `eventEmissionDiagnostics()` | `COMPLETED`                |
| WalkForwardValidationService         | `WalkForwardWindowCompleted`, `WalkForwardCompleted`       | `eventEmissionDiagnostics()` | Windows succeeded          |
| MultiYearResearchService             | `DatasetCompleted` (success), `MultiYearResearchCompleted` | `eventEmissionDiagnostics()` | Datasets succeeded         |
| DeterministicReplayValidationService | `ReplayCompared`, `DeterministicValidationCompleted`       | `eventEmissionDiagnostics()` | Iterations succeeded       |

## Test Coverage

Explicit unit tests in each service spec verify Contract B when
`applicationEventNotifier` throws on completion events. Chaos testing injects
`EventEmissionFailure` at the notification boundary and verifies business
execution completes with diagnostics recorded.
