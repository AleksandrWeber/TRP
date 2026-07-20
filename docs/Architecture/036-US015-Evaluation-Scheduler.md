# US015 — Evaluation Scheduler

Status: Implemented  
Scope: Periodic, per-strategy Signal Engine evaluation with a configurable
interval. The scheduler only triggers evaluations and observes
`BUY` / `SELL` / `HOLD` results. No Paper Trading execution, no order
placement, no Risk Management, no notifications, no Technical Indicators /
Strategy Evaluators / Portfolio / Market Cache / Binance / Authentication /
Workspace changes. Signal Engine receives comment-only clarifications.

## Architecture

```text
POST /v1/evaluation-schedules   { strategyId, intervalMs }
  ↓
EvaluationSchedulerController
  ↓
EvaluationSchedulerService                    — modules/evaluation-scheduler (US015)
  ├─ StrategyDomainService.getById            — reject unknown strategies
  ├─ setInterval(intervalMs) per schedule     — independent timers
  ↓  on each tick
SignalEngineService.evaluate(workspaceId, strategyId)   (US009, unchanged contract)
  ↓
SignalResult { signal: BUY | SELL | HOLD, … }
  ↓
Scheduler observes lastSignal / lastEvaluatedAt
  ✗  PaperTradingService.execute   — not called
  ✗  Orders / Risk / Notifications — not called
```

Dependency direction:

```text
EvaluationSchedulerModule
  → SignalEngineModule          (evaluate only)
  → StrategiesModule            (existence check on register)
  → WorkspaceModule             (X-Workspace-Id validation)
```

Nothing else depends on the scheduler. Technical Indicators, Strategy
Evaluators, Paper Trading, Portfolio, Market Cache, and Binance remain
untouched consumers/providers of the existing Signal Engine path.

## Scheduler lifecycle

| Phase          | Behaviour                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Module init    | `EvaluationSchedulerService.onModuleInit` marks the scheduler started. No schedules exist yet.            |
| Register       | Validates interval + strategy existence; starts a dedicated `setInterval`. First tick after `intervalMs`. |
| Tick           | Calls `SignalEngineService.evaluate`. Updates `lastEvaluatedAt` / `lastSignal`.                           |
| Failure        | Per-schedule `try/catch` logs the error; other schedules keep running.                                    |
| Overlap        | Per-schedule `running` flag skips a tick if the previous evaluation is still in flight.                   |
| Unregister     | `clearInterval` + remove from the in-memory map.                                                          |
| Module destroy | Clears every timer and marks the scheduler stopped.                                                       |

Timers are `unref()`'d so they do not keep the Node process alive on their own
(same lifecycle pattern as `OutboxPollingService`).

## Trigger flow

1. Client registers a schedule (`POST /v1/evaluation-schedules`) with
   `X-Workspace-Id`, `strategyId`, and `intervalMs`.
2. Scheduler verifies the strategy exists in that workspace.
3. Interval validation:
   - must be an integer
   - `1000 ≤ intervalMs ≤ 86_400_000` (1s … 24h)
4. Duplicate `(workspaceId, strategyId)` registrations are rejected
   (`DUPLICATE_SCHEDULE` → 409).
5. On each interval, the scheduler invokes the Signal Engine.
6. `BUY`, `SELL`, and `HOLD` are all accepted outcomes; none trigger
   execution.
7. Missing strategies during a tick are logged and skipped (schedule remains).

Deterministic testing uses `runOnce(workspaceId, strategyId)` (mirrors
outbox `pollOnce`) or fake timers against the live intervals.

## HTTP API

| Method | Path                                   | Purpose                          |
| ------ | -------------------------------------- | -------------------------------- |
| POST   | `/v1/evaluation-schedules`             | Register a schedule              |
| GET    | `/v1/evaluation-schedules`             | List schedules for the workspace |
| GET    | `/v1/evaluation-schedules/:strategyId` | Get one schedule                 |
| DELETE | `/v1/evaluation-schedules/:strategyId` | Unschedule                       |

All routes are authenticated (global JWT) and workspace-scoped.

Error boundary (`EvaluationSchedulerErrorFilter`):

| Code                 | HTTP |
| -------------------- | ---- |
| `INVALID_SCHEDULE`   | 400  |
| `INVALID_INTERVAL`   | 400  |
| `DUPLICATE_SCHEDULE` | 409  |
| `SCHEDULE_NOT_FOUND` | 404  |
| `STRATEGY_NOT_FOUND` | 404  |

## Limitations

- Schedules are **in-memory only** — process restart drops every registration.
- No durable last-run checkpoint; no multi-instance fencing / leader election.
- No automatic discovery of `status === 'active'` strategies — registration is explicit.
- The scheduler does not filter by strategy status; if a draft strategy is
  scheduled, the Signal Engine will still evaluate it (engine contract unchanged).
- Results are not persisted and are not published on an event bus.
- No coupling to Paper Trading — intentional for US015.

## Technical Debt

| Item                         | Notes                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| In-memory schedule store     | Restart recovery and horizontal scaling need a durable schedule table + lease.                                      |
| No active-strategy auto-scan | Future work may list active strategies across workspaces; requires a repository query that does not exist today.    |
| Observation only             | Downstream consumers (paper trading, alerts) must subscribe later without changing this trigger boundary.           |
| TD-004 overlap               | This closes the Signal Engine scheduling gap specifically; the Jobs/BullMQ scheduler gap (TD-004) remains separate. |

## Related documents

- [029 — Signal Engine](./029-US009-Signal-Engine.md)
- [032 — Strategy Evaluators](./032-US012-Strategy-Evaluators.md)
- [035 — Advanced Strategy Evaluators](./035-US014-Advanced-Strategy-Evaluators.md)
- [030 — Paper Trading Engine](./030-US010-Paper-Trading-Engine.md)
