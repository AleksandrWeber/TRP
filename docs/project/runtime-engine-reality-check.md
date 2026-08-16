# Runtime Engine Reality Check

**Date:** 2026-08-16  
**Nature:** Implementation audit only. No code change. No architecture change. No roadmap change.  
**Source of truth:** Current code under `apps/`. Architecture documents and intended design were not used as evidence.

---

## Primary question

Does the runtime execution engine already exist in the codebase, or is it still missing?

**It is still missing.** One-shot evaluation and pipeline services exist. No production component continuously executes strategy or tactic evaluation for a running Trading Session, and no automatic Paper Orders are created after Start Session.

---

## 1. RuntimeEvaluationService

**Location:** `apps/api/src/modules/strategy-runtime/runtime-evaluation.service.ts`

This is a **complete one-shot production evaluator**, not a test-only helper.

Evidence:

- Registered as a Nest provider and export in `StrategyRuntimeModule`.
- Injected by `StrategyRuntimeService`, which is the production `STRATEGY_RUNTIME_PORT` implementation.
- `evaluate(command)` admits one closed candle, calls `decideRuntimeEvaluation`, and (when actionable) commits Signal Intent + Strategy Checkpoint + Outbox (`SignalIntentCreated`, `StrategyCheckpointAdvanced`) in one transaction.
- Comment in the class: no Orders, Risk, or Execution.

It is **not** a continuous engine. It processes one caller-supplied tick and returns.

It is **not** `Strategy.evaluate()`. Decision logic is `decideRuntimeEvaluation` in `apps/api/src/modules/strategy-runtime/domain/runtime-evaluation.ts`. That function reads approved Deployment parameters only:

- `parameters.action` = `buy` | `sell` | `hold`
- or `parameters.compareCloseToOpen === true`
- otherwise `NO_ACTION`

It does not load a Strategy entity, does not call `StrategyEvaluator.evaluate`, and does not use SMA / RSI / MACD / Bollinger evaluators.

Production caller of `RuntimeEvaluationService.evaluate`: **only** `StrategyRuntimeService.evaluate`. Tests also construct it directly.

---

## 2. Strategy Runtime

**Does a component exist whose responsibility is continuously executing `Strategy.evaluate()` during a running Trading Session?**

**No.**

What exists instead:

| Component                           | What it actually does                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TradingSessionService.start`       | CREATED → STARTING → RUNNING, attaches lease, calls `runtime.loadContext` then `runtime.arm`. Does not evaluate.                                    |
| `StrategyRuntimeService`            | Application shell: lifecycle, admit tick, one-shot `evaluate`.                                                                                      |
| `RuntimeLifecycleCoordinator`       | In-memory **state machine**. Arms / pauses / drains. Gates `canEvaluate`. Does not poll, subscribe, or pull ticks.                                  |
| `decideRuntimeEvaluation`           | Pure function of Deployment parameters + one candle. Not `Strategy.evaluate()`.                                                                     |
| `RecoveryStrategyEvaluationService` | Recovery-stage one-shot. Uses `admitTick` + `decideRuntimeEvaluation`. Comment: does not emit Signal Intent, create Orders, or persist checkpoints. |

Command Center Start Session path (implementation):

1. UI: `api.startTradingSession(id)` → `POST /trading-sessions/:id/start`
2. `TradingSessionCommandController.start` → `BotFacadeService.startBot`
3. `TradingSessionService.start` → `runtime.arm({ reason: 'session started' })`

After that, Runtime worker state is `ARMED`. Nothing then feeds candles or calls `evaluate`.

`StrategyRuntimePort` comment in `strategy-runtime.port.ts` refers to “future workers”. No such worker is implemented.

Separate, non-session path (do not treat as Trading Session runtime):

- `StrategyEvaluator.evaluate` exists under Signal Engine (`apps/api/src/modules/signal-engine/evaluators/strategy-evaluator.ts`).
- `EvaluationSchedulerService` can periodically call `SignalEngineService.evaluate` for **registered strategy schedules**.
- That loop is not bound to a Trading Session, is not started by Command Center Start Session, and does not create Paper Orders through `OrderService`.

`StrategyDomainService` is CRUD only. Comment: “No calculations or trading logic.” There is no `Strategy.evaluate()` method on the Strategy entity.

---

## 3. Tactic Runtime

**Does any production component execute `Tactic.evaluate()` or equivalent?**

**No.** Tactical configuration is metadata today.

Evidence:

- No `Tactic` class, no `Tactic.evaluate`, no tactic evaluator module.
- `TacticalEnvelope` (`apps/api/src/modules/tactical-envelope/domain/tactical-envelope.ts`) is an immutable configuration stub. File comment: not a runtime decision engine; runtime must ignore the field.
- `LibraryTacticalEnvelope` is bound to Strategy Certification as configuration. `tacticalEnvelopeRuntimeAdaptationImplemented()` returns `false`.
- `evaluateTacticPoint` in `strategy-eligibility.ts` is **certification eligibility** (symbol / timeframe / scope allowlists), not session runtime evaluation.

A running Trading Session does not evaluate a tactic.

---

## 4. Market Event Loop

**Does any production worker exist that continuously processes ticks / candles / market events for a running session?**

**No. It does not exist.**

`TradingSessionService.start` does not subscribe to a market stream, does not admit a tick, and does not dispatch a candle.

Live Market Data exists as a **separate** product (`LiveMarketDataModule`):

- Binance WebSocket connector
- `MarketClosedCandle` normalization
- `LatestMarketStateProjection` (market-state projection + SSE)
- Outbox polling for durable delivery

That module’s own comment: “No strategy / Orders / accounting.” It does not import Strategy Runtime or Trading Session. There is no production consumer that takes `MarketClosedCandle` and calls `StrategyRuntimePort.evaluate` or `StrategyTradingPipelineService.run`.

Registered durable outbox consumers in production code:

- `m2-position-accounting-runtime`
- `m2-position-valuation-runtime`
- `m2-portfolio-projection-runtime`
- `rc21-knowledge-lake-trading-path`
- live-market latest-state projection

None of these evaluate a running Trading Session.

`OutboxPollingService` is a generic outbox dispatcher. It is not a session market loop.

`RuntimeLifecycleCoordinator` stores an in-memory “worker slot” per session. That slot is lifecycle state only. It is not a tick processor.

---

## 5. Strategy Trading Pipeline

**`StrategyTradingPipelineService.run()` — production callers**

**None.**

Production search of `apps/` excluding tests:

- Defined in `apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.service.ts`
- Nest module is imported in `app.module.ts`
- Module has **no controller**, **no outbox consumer**, **no `OnModuleInit` worker**
- No `@Inject(StrategyTradingPipelineService)` and no `@Inject(STRATEGY_TRADING_PIPELINE_PORT)` anywhere outside the module itself

Callers of `.run(`:

| Caller                                                          | Production?                                            |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `strategy-trading-pipeline.service.spec.ts`                     | No (unit test)                                         |
| `us223-strategy-e2e-candle-fill-accounting.integration.spec.ts` | No (test constructs the service and supplies a candle) |

`run()` itself does: `runtime.evaluate` → `proposeOrderFromSignalIntent` → canonical Risk/Execution → fill accounting. That chain only executes when a test (or a future caller) invokes `run` with a fully built command, including `quantity`, `reservation`, `risk`, and `referencePrice`. No production component builds that command.

---

## 6. Paper Orders

**Can a running Trading Session create Paper Orders without manual API calls or test harnesses?**

**NO.**

Why:

1. Start Session only arms lifecycle. It never calls `RuntimeEvaluationService`, `StrategyRuntimeService.evaluate`, or `StrategyTradingPipelineService.run`.
2. The only production path from Signal Intent to an Order is `OrderService.proposeOrderFromSignalIntent`, and the only non-test caller of that method is `StrategyTradingPipelineService.run`, which has no production caller.
3. There is no outbox consumer of `SignalIntentCreated` that creates orders.
4. HTTP `POST /v1/orders` creates orders with `origin: 'manual'`. That is a manual API call, not session runtime.
5. Older `paper-trading` / `PaperTradingExecutorService` paths create in-memory virtual trades from Signal Engine / Evaluation Scheduler. They are not Trading Session Paper Orders and are not started by Command Center Start Session.
6. `PaperTradingEngine` (US208) start flips `PaperSession` status only. Comment: session lifecycle only; order submission must go through the canonical pipeline.

UI copy in `session-commands.ts` matches the implementation: Start “does not place orders.”

---

## 7. Runtime Wiring

The chain below is **absent** in production.

```
Market Feed
    ↓
RuntimeEvaluationService
    ↓
StrategyTradingPipeline
    ↓
Paper Orders
    ↓
Portfolio
    ↓
Reporting
    ↓
Notification
```

What is connected today:

- Command Center Start Session → Trading Session RUNNING + Runtime `ARMED`
- Live Market Data → market projection / SSE (not Strategy Runtime)
- `StrategyTradingPipelineService` → mounted in `app.module`, **uninvoked**
- Signal Intent query API is read-only (`SignalIntentController`)
- Notification delivery is a separate product surface; it is not driven by session evaluation or paper fills from this path

This is not “every required component exists, only a wire is missing.” Several links have no producer or no consumer at all (see section 8). Arming Runtime without a tick source is a gate with nothing behind it.

---

## 8. Missing Components

These do not exist in the current implementation. Listed only. No design.

1. **Session-scoped market event worker** — a production component that, while a Trading Session is RUNNING, continuously admits ticks / closed candles for that session and invokes runtime evaluation or the trading pipeline.
2. **`Strategy.evaluate()` in the Trading Session runtime path** — session runtime uses `decideRuntimeEvaluation` (Deployment parameter fixture). It does not execute Strategy evaluators against the bound strategy during a session.
3. **`Tactic.evaluate()` / tactic runtime** — no tactic evaluator; Tactical Envelope is unused configuration.
4. **Production caller of `StrategyTradingPipelineService.run`** — no HTTP adapter, no event consumer, no session worker. Nobody supplies `quantity` / `reservation` / `risk` / `referencePrice` for a live session.
5. **`SignalIntentCreated` order consumer** — Outbox event is written; nothing consumes it to create orders (pipeline would do that inline if it were called).
6. **Session → market subscription binding** — Start Session does not subscribe the session’s instrument/timeframe to Live Market Data, and Live Market Data does not notify Strategy Runtime.

Building blocks that **do** exist (one-shot, not an engine): `RuntimeEvaluationService`, `StrategyRuntimeService` lifecycle gates, `StrategyTradingPipelineService`, `OrderService.proposeOrderFromSignalIntent`, Live Market Data ingestion/projection, Paper Account + Trading Session lifecycle.

---

## 9. Final verdict

**B. The Runtime Engine itself is not implemented.**

Not A. Lifecycle arming plus unused one-shot services is not a runtime engine. The engine would be the production worker that continuously evaluates strategy (and tactic, if any) for a running Trading Session and can create Paper Orders. That worker is not in the codebase.

What Start Session does in implementation: load runtime context, attach a fenced lease, set RUNNING, arm Strategy Runtime to `ARMED`, and stop.

---

## Evidence index (implementation files)

- `apps/api/src/modules/trading-session/trading-session.service.ts` — start arms runtime; no evaluate
- `apps/api/src/modules/bot-facade/trading-session-command.controller.ts` — `POST :id/start`
- `apps/api/src/modules/strategy-runtime/runtime-evaluation.service.ts` — one-shot tick evaluator
- `apps/api/src/modules/strategy-runtime/domain/runtime-evaluation.ts` — `decideRuntimeEvaluation`
- `apps/api/src/modules/strategy-runtime/runtime-lifecycle.coordinator.ts` — in-memory gate, not a loop
- `apps/api/src/modules/strategy-runtime/ports/strategy-runtime.port.ts` — “future workers”
- `apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.service.ts` — `run()`; no production caller
- `apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.module.ts` — no controller / consumer
- `apps/api/src/modules/tactical-envelope/domain/tactical-envelope.ts` — metadata stub
- `apps/api/src/modules/strategy-library/domain/tactical-envelope-binding.ts` — `tacticalEnvelopeRuntimeAdaptationImplemented(): false`
- `apps/api/src/modules/live-market-data/live-market-data.module.ts` — no strategy / orders
- `apps/api/src/modules/orders/orders.controller.ts` — manual `origin: 'manual'`
- `apps/web/src/command-center/session-commands.ts` — Start does not place orders
- `apps/api/src/app.module.ts` — `StrategyTradingPipelineModule` imported, unused by other production modules
