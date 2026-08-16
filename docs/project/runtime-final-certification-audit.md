# Runtime Final Certification Audit

**Document:** Runtime Final Certification Audit  
**Date:** 2026-08-16  
**Nature:** Independent verification of Runtime Engine Completion from current implementation only.  
**Scope:** Audit. No code change. No architecture change. No certification restore in this document.  
**Source of truth:** Production TypeScript under `apps/`. Prior runtime reports were not used as evidence.  
**Tests:** Used only as corroboration of a production path, never as a substitute for a production caller.

**STOP.** This audit does not implement. It does not amend Spec v2.0, the Authority Matrix, the Alias Dictionary, or living certification status.

---

## Verdict

**A. Version 2 Runtime is operational. Certification may be restored.**

The paper runtime execution loop that was missing after Start Session is now wired in production Nest code. A strategy-origin Start Session subscribes the bound instrument/timeframe. An admitted `MarketClosedCandle` is dispatched to `TradingSessionRuntimeWorker`, which calls the existing `StrategyTradingPipelineService.run()`. That call evaluates via `RuntimeEvaluationService`, proposes a paper Order, runs canonical Risk/Execution, applies Fill accounting, and on `filled` invokes the existing Reporting / Notification / AI consumers.

No new bounded context. No new Source of Truth. No duplicate Runtime or Pipeline. No Signal Engine merge.

---

## 1. Start Session

**Does it now subscribe a running session to production market events?**

**YES.**

`TradingSessionService.start` still only loads context, attaches a lease, becomes `RUNNING`, arms Strategy Runtime, and appends `TradingSessionStarted` to the Outbox. It does not subscribe itself.

Subscription is production and event-driven. `TradingSessionRuntimeWorker` registers on Nest boot as Outbox consumer `v2-trading-session-runtime`. On `TradingSessionStarted` with `payload.origin === 'strategy'` it:

1. Loads the bound Deployment instrument/timeframe.
2. Writes a durable closed-candle subscription via `MarketSubscriptionRegistry.subscribe` (`BINANCE_SPOT_SOURCE_ID`, `MarketStreamChannel.CLOSED_CANDLE`).
3. If a live connector is already registered, also calls `connector.subscribe` for the same stream.

`lifecycleEnvelope` on session start includes `origin` and `deploymentId`. Stop / fail unsubscribes the durable registry entry.

`OutboxPollingService` starts the dispatcher on module init (250ms default poll). The worker is a provider of `StrategyTradingPipelineModule`, which is imported by `AppModule`.

Public WebSocket connect remains opt-in (`LIVE_MARKET_WS_ENABLED=true` in `LiveMarketFeedCoordinator`). That flag does not remove the subscription: the durable registry is written regardless. When the coordinator boots with WS enabled, it hydrates persisted subscriptions and subscribes the connector.

---

## 2. Closed Candle

**Does a real closed candle automatically reach the Runtime Worker?**

**YES.**

Production admit path:

```text
Binance public kline frame (when WS enabled)
  → BinanceWebSocketConnector.deliverKlineFrame
  → LiveMarketFeedCoordinator onKlineFrame
  → ClosedCandleIngestService.ingestKline
      (open klines are dropped; closed drafts continue)
  → validate → integrity → TransactionalOutboxWriter.acceptMarketEvent
      (eventType MarketClosedCandle)
  → LatestMarketStateProjection.apply
  → OutboxPollingService / OutboxDispatcher.dispatchOnce
  → TradingSessionRuntimeWorker.handle
```

`CLOSED_CANDLE_TICK_EVENT_TYPE` is `'MarketClosedCandle'`. The worker ignores other event types except session start/stop/fail. `toDurableMarketEnvelope` copies instrument, timeframe, openTime, closeTime, and OHLCV into the durable payload; the worker maps those fields into `EvaluationCandleInput`.

Live Market Data still does not import Strategy Runtime, Orders, or the pipeline. The candle reaches the worker through the existing Outbox, not an in-process strategy callback.

A test may inject the same production event through `ClosedCandleIngestService.publish`. That is the admit API, not a bypass of the worker. The worker is still the consumer.

---

## 3. Runtime Evaluation

**Does RuntimeEvaluationService execute automatically?**

**YES.**

Automatic chain after a matching closed candle:

1. Worker `dispatchClosedCandle` → `PipelineCommandAssembler.assemble` → `pipeline.run(command)`.
2. `StrategyTradingPipelineService.run` → `this.runtime.evaluate(evaluateCommand)`.
3. `StrategyRuntimeService.evaluate` (production `STRATEGY_RUNTIME_PORT`) gates lifecycle, then `this.evaluations.evaluate(command)`.
4. `RuntimeEvaluationService.evaluate` admits the tick, calls `decideRuntimeEvaluation`, and commits Signal Intent (when actionable) + checkpoint + Outbox atomically.

Nothing in this chain is HTTP. Nothing is a test helper. Evaluation still runs only when the session is `ARMED` and `canEvaluate` is true (pause/stop already fail closed). Default Deployment parameters still yield `NO_ACTION`. That is existing evaluator behavior, not a missing driver.

---

## 4. Trading Pipeline

**Is StrategyTradingPipelineService.run() now called by production code?**

**YES.**

### Production callers

| Caller                                             | Location                                                                           | How                                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `TradingSessionRuntimeWorker.dispatchClosedCandle` | `apps/api/src/modules/strategy-trading-pipeline/trading-session-runtime.worker.ts` | `await this.pipeline.run(command)` after assembling a live command for each matching RUNNING / ARMED strategy session |

That is the only production caller.

`STRATEGY_TRADING_PIPELINE_PORT` is bound to the same service and is not injected by any other production class.

### Not production callers

| File                                                            | Role                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `strategy-trading-pipeline.service.spec.ts`                     | Unit test constructs the service and calls `run`                         |
| `us223-strategy-e2e-candle-fill-accounting.integration.spec.ts` | Regression: test is still the caller of `run`                            |
| `runtime-engine-paper-session.integration.spec.ts`              | Constructs the pipeline for the worker; the test does **not** call `run` |

---

## 5. Paper Orders

**Are Paper Orders created automatically without REST calls or test harnesses?**

**YES.**

Inside `pipeline.run`, after a `SIGNAL_INTENT` evaluation:

- `ORDER_PROPOSAL_PORT.proposeOrderFromSignalIntent` — internal Orders intake, not HTTP.
- `CanonicalOrderPathService.runCanonicalPath` — Risk, reservation, paper execution.

No `POST /v1/orders`. No Command Center order form. No test harness in the production module.

Orders are created only when evaluation is actionable and canonical Risk accepts. A hold / `NO_ACTION` / rejected path correctly creates none.

---

## 6. Portfolio

**Is Accounting updated automatically after a Paper Order?**

**YES.**

When the canonical path returns a Fill, `pipeline.run` calls `PositionAccountingConsumer.process(orderFillRecordedEnvelope(fill), …)` in the same invocation. That consumer applies the Fill to Position and posts a balanced FILL ledger transaction in one PostgreSQL transaction (inbox-idempotent).

A second existing Outbox consumer (`PositionAccountingOutboxConsumer`) also handles `OrderFillRecorded`. Duplicate application is the existing inbox/checkpoint guard, not a second accounting SoT.

Accounting does not run on `resting` / `order_rejected` / `no_action`. Paper market fills are the path that updates portfolio.

---

## 7. Reporting

**Does Reporting update automatically after execution?**

**YES.**

On pipeline outcome `filled`, the worker `afterFill` calls `ReportNarrativeConsumerService.requestAndNarrate`, which delegates `ReportingServicePort.requestReportRun` with an `ops_daily` paper definition scoped to the session. Product Reporting HTTP remains GET-only. No operator report request is required.

Trigger is fill-only (not `resting`). `requestAndNarrate` / `requestAndDeliver` each request a run; that is two product-flow calls, not a new report owner.

---

## 8. Notification

**Does Notification Delivery execute automatically?**

**YES.**

The same `afterFill` path calls `ReportNotificationConsumerService.requestAndDeliver`, which on a completed or empty ReportRun calls existing `NotificationServicePort.deliver()`. Notification does not generate the report. Channel activation / Telegram connectivity is unchanged: `deliver()` still runs; an unconnected channel may record a skip rather than a send.

---

## 9. AI Analytics

**Does AI Narrative become available automatically?**

**YES.**

`requestAndNarrate` calls `AIAnalyticsPort.generateNarrative` and attaches the narrative to the ReportRun view. AI remains a read-only consumer of reports. It does not own ReportRuns and is not imported by Live Market Data or Strategy Runtime.

---

## 10. Architecture

**Confirm:**

| Check                  | Result  |
| ---------------------- | ------- |
| No new BC              | **YES** |
| No new SoT             | **YES** |
| No ownership drift     | **YES** |
| No duplicate Runtime   | **YES** |
| No duplicate Pipeline  | **YES** |
| No Signal Engine merge | **YES** |

**YES** on all six.

Evidence:

- New files are composition inside existing modules: `ClosedCandleIngestService` and `LiveMarketFeedCoordinator` in Live Market Data; `PipelineCommandAssembler` and `TradingSessionRuntimeWorker` in Strategy Trading Pipeline (already the US223 composition root).
- No new Nest bounded-context module. No new persistence models for runtime state. Checkpoints, Outbox, subscriptions, Orders, Positions, Ledger, ReportRuns, deliveries, and narratives stay with their owners.
- Live Market Data boundary still forbids Strategy Runtime, pipeline, Orders, Risk, Execution, Positions, Ledger, Signal Engine.
- Pipeline boundary still forbids Signal Engine, Evaluation Scheduler, and direct Execution Adapter.
- Strategy Runtime still evaluates only; it does not import Orders.
- One `RuntimeEvaluationService`. One `StrategyTradingPipelineService.run`.
- `decideRuntimeEvaluation` is unchanged (Deployment `action` / `compareCloseToOpen`). Research `StrategyEvaluator` / Evaluation Scheduler are not on this path. `tacticalEnvelopeRuntimeAdaptationImplemented()` remains `false`. Envelope eligibility is not a per-candle Tactic engine; that was already certified as configuration.

---

## Observed production sequence

```text
Command Center Start Session
  → TradingSessionService.start (RUNNING + ARMED)
  → Outbox TradingSessionStarted
  → Worker subscribe (durable registry ± connector)
  → Closed candle admitted (ingest / optional public WS)
  → Outbox MarketClosedCandle
  → TradingSessionRuntimeWorker
  → PipelineCommandAssembler
  → StrategyTradingPipelineService.run
      → StrategyRuntimeService.evaluate
          → RuntimeEvaluationService.evaluate
      → proposeOrderFromSignalIntent
      → CanonicalOrderPathService.runCanonicalPath
      → PositionAccountingConsumer.process
  → requestAndNarrate (Reporting + AI)
  → requestAndDeliver (Notification)
```

No extra REST command after Start Session. No test harness as the production caller.

---

## Conditions that are not incompleteness

These are existing product rules, not missing runtime wiring:

- Public Binance WebSocket boots only when `LIVE_MARKET_WS_ENABLED=true` and `globalThis.WebSocket` exists. Ingest is the production admit path either way.
- Deployment without `action` or `compareCloseToOpen` evaluates `NO_ACTION` and creates no order.
- Live venue orders remain unauthorized.
- Tactic runtime adaptation remains unimplemented by design.
- Gap-recovery / `StartupRecoveryService` is still not a Nest boot provider. That is stream-integrity hardening, not the execution loop this audit was asked to certify.

---

## 11. Final Verdict

**A. Version 2 Runtime is operational. Certification may be restored.**

The hold condition was: after Start Session, nothing fed market events into Strategy Runtime, and `StrategyTradingPipelineService.run` had no production caller, so automatic Paper Orders never existed. That condition is no longer true in the implementation.

This audit does not itself flip living status to CERTIFIED. Restoration is a separate status change after this verification.

**STOP.** No implementation.
