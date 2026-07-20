# US017 — Integration & Regression Baseline

Status: Release candidate validated  
Validation date: 2026-07-19  
Scope: Integration, regression, stability, runtime, and browser validation for
the first complete Paper Trading execution pipeline. No product functionality
or architecture was added.

## Integration Architecture

```text
Authentication (JWT)
  ↓
Workspace (X-Workspace-Id)
  ↓
Strategy Configuration
  ↓
Market Data Provider (Binance | deterministic mock)
  ↓
Market Data Cache
  ↓
Technical Indicators
  ↓
Strategy Evaluators
  ↓
Signal Engine
  ↓
Evaluation Scheduler
  ↓  in-process EvaluationResultEvent
Paper Trading Executor
  ↓
Strategy Portfolio
  ↓
Trade History
```

The Signal Engine obtains candles exclusively through `MarketDataCacheService`.
Evaluator selection remains strategy configuration (`parameters.evaluator`).
The scheduler owns periodic evaluation and publishes successful results to
isolated listeners. The executor is the only scheduler listener that mutates
paper portfolio state. It obtains execution prices through the cache, never
directly from Binance.

Workspace and strategy identifiers are retained through every transition.
Schedules, executor state, positions, idempotency keys, portfolios, and trade
history are keyed by workspace and strategy.

## Tested Execution Pipeline

### Live Binance path

The running application reported `providerId=binance` and `status=ok`.
One workspace-scoped strategy was evaluated through every registered evaluator
against the same cached 100-candle Binance window:

- `dummy` produced SELL.
- `sma` produced SELL.
- `ema` produced SELL.
- `rsi` produced HOLD.
- `macd` produced HOLD.
- `bollinger` produced HOLD.

Every response was a valid `SignalResult` and identified the selected evaluator
in metadata. The first request caused one provider miss; the five subsequent
evaluations produced five candle-cache hits. This verifies the Market Data →
Cache → Indicators → Evaluators → Signal Engine contracts without bypassing the
provider gateway.

### Deterministic scheduled paper session

An isolated runtime used the production Nest application with the deterministic
mock provider. The session performed the following through authenticated HTTP
contracts:

1. Bootstrapped the default workspace.
2. Created and activated a strategy.
3. Registered a 1,000 ms evaluation schedule.
4. Observed a scheduled BUY open a paper position.
5. Allowed another BUY and verified that it was ignored without creating a
   duplicate trade.
6. Changed the configured symbol to one producing SELL and observed the
   position close.
7. Repeated BUY → open → SELL → close for a second cycle.
8. Verified two closed trades with two unique trade identifiers.
9. Removed the schedule.
10. Waited beyond another interval and verified that portfolio statistics and
    trade history no longer changed.

Observed final executor statistics were three BUY signals, two SELL signals,
one ignored repeated BUY, zero duplicate deliveries, and zero failures. Trade
history contained exactly two closed trades. The deterministic mock ticker
prices happened to produce zero aggregate PnL; the state transitions and
accounting contracts were valid.

Exact signal re-delivery idempotency is separately covered by the executor unit
suite. Repeated schedule results have different timestamps and are valid new
signals; position-state rules prevent repeated BUY results from creating
additional open trades.

## Regression Results

The complete repository test command passed after stabilization:

- API: 206 test files and 1,203 tests.
- Web: 11 test files and 28 tests.
- Research package: 4 test files and 24 tests.
- Total: 221 test files and 1,255 tests.

The suite includes unit, module, controller/API, integration, persistence,
failure-injection, and release-baseline tests.

Additional gates passed:

- TypeScript across all applications and packages.
- Nest API production build.
- Vite web production build.
- Research package build.
- ESLint across API, web, and research.
- Repository-wide Prettier verification.

Regression coverage remained green for Authentication, Identity, Workspace,
Dashboard APIs, Market Data, Market Cache, Technical Indicators, Strategy
Evaluators, Signal Engine, Evaluation Scheduler, Paper Trading, Portfolio,
Trade History, Health, Binance adapters/providers, persistence, production,
research, workflows, and existing execution/accounting modules.

## Frontend and Browser Results

The web test suite, TypeScript check, production build, and ESLint all passed.

Browser verification against the running API passed for:

- Login with the development administrator.
- Workspace bootstrap and authenticated application shell.
- Dashboard data loading.
- Strategies route and complete strategy form rendering.
- Production route and deployment/execution data loading.
- Public health response, reporting both API and database as up.

No application error banner, React render failure, failed authentication
transition, or browser-visible runtime exception was observed. The existing web
application does not expose dedicated Evaluation Scheduler, executor Portfolio,
or executor Trade History pages. Those contracts were therefore validated
through authenticated API and end-to-end runtime checks rather than a dedicated
UI route.

## Stability Results

- Repeated scheduling: passed in service tests and the runtime session.
- Multiple strategies: independently scheduled at different intervals in unit
  coverage; executor portfolio state remains strategy-scoped.
- Multiple symbols: passed in the two-cycle runtime session and executor tests.
- Multiple workspaces: workspace isolation passed in controller/domain and
  executor tests.
- Duplicate signal protection: exact re-delivery produces `DUPLICATE`; repeated
  BUY with a new timestamp is ignored while a position is open.
- Concurrent scheduler execution: the per-schedule `running` guard now has an
  explicit regression test proving slow evaluation ticks do not overlap.
- Failure isolation: evaluator failures, listener failures, and executor market
  price failures are contained; later evaluations continue.
- Disable behavior: removing a schedule prevents future ticks and state changes.
- Module lifecycle: scheduler timers and executor subscriptions are released on
  module shutdown.

## Integration Issues Found and Resolved

No production contract, dependency-injection, DTO, API, or state-transition
defect was found during the integrated runtime scenarios.

Two release-baseline issues were resolved:

1. Seven US014/US015 source, test, and architecture files did not satisfy the
   repository Prettier gate. They were formatted without semantic changes.
2. The scheduler's existing no-overlap guard lacked a direct concurrency
   regression. A slow-evaluation test now verifies that elapsed timer intervals
   cannot start a second evaluation for the same schedule.
3. An initial final-suite run overlapped two API watch processes with the
   PostgreSQL Outbox integration tests. The live pollers consumed rows owned by
   the test and caused two transient assertions to fail. After stopping the
   validation servers, the affected test passed 5/5 and the complete suite
   passed. Release validation must run without an application process polling
   the same database.

## Remaining Technical Debt

1. Evaluation schedules, executor portfolios, processed-signal keys, and trade
   history are process-local. Restarting the API intentionally loses all of
   them; schedules do not resume automatically.
2. Exact processed-signal keys are retained for the process lifetime and are
   currently unbounded.
3. Unscheduling clears future timer ticks but cannot cancel an evaluation that
   already started. That in-flight evaluation may finish and publish once.
4. Scheduler and executor communication is in-process. Multi-instance API
   deployment would require a durable scheduler/event transport and distributed
   idempotency before horizontal scaling.
5. Portfolio and Trade History for the US016 executor are API-only; the current
   frontend Production page belongs to the earlier persisted production
   pipeline.
6. Deterministic BUY → SELL release validation uses the mock provider because a
   live Binance candle cannot be expected to reverse within a bounded test
   window.
7. PostgreSQL integration tests and local runtime currently share the configured
   database. A dedicated test database/schema would remove interference from
   accidentally running Outbox pollers.

## Release Readiness Assessment

Verdict: **PASS WITH RECOMMENDATIONS**

The complete pipeline is integrated, deterministic under the test provider,
operational against Binance for market/evaluator reads, protected against
duplicate execution, isolated by strategy/workspace, and green across all
automated and browser gates.

The recommendations are to persist scheduler/executor state before claiming
restart recovery, bound idempotency retention, define in-flight cancellation
semantics, and add dedicated executor portfolio/history UI when that frontend
functionality is explicitly scheduled. None of these limitations regresses or
blocks the current single-process Paper Trading baseline.
