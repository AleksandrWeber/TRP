# Runtime Completion Audit

**Document:** Runtime Completion Audit  
**Date:** 2026-08-16  
**Nature:** Implementation audit of the paper trading Runtime Engine. No Runtime Engine code change. No architecture change.  
**Source of truth:** Current code under `apps/`. Architecture documents were not used as evidence.  
**Companion:** [Runtime Gap Analysis](./runtime-gap-analysis.md) · [Runtime Implementation Plan](./runtime-implementation-plan.md)  
**Prior trace:** [Runtime Trading Engine Verification](./runtime-trading-engine-verification.md)

**STOP.** This audit does not authorize implementation. Implementation waits for architectural review.

---

## Verdict

**Runtime Engine Completion is A) mostly wiring.**

It is not B) substantial implementation of new trading domains.

The certified paper-first **operator lifecycle** is implemented. The automated **execution loop** is not. Almost every stage the loop would call already exists as a production Nest service. The missing work is composition: ingest market events, drive `StrategyTradingPipelineService.run` for ARMED sessions, assemble the pipeline command from existing reads, and invoke existing Reporting / Notification / AI consumers after a fill.

That is more than a few glue lines. It is still wiring and composition, not a new bounded context.

---

## Primary question

**Is the Runtime Engine itself implemented?**

**No.** After Command Center Start Session the system loads runtime context, becomes `RUNNING`, and arms Strategy Runtime to `ARMED`. Nothing then feeds market events into that runtime. Automatic Paper Orders are never created.

---

## A vs B — justification from code

### Why A (mostly wiring)

| Claim                                                                                                               | Code evidence                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| End-to-end candle → Signal Intent → Paper Order → fill → accounting already exists as a callable production service | `StrategyTradingPipelineService.run` in `apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.service.ts`. Module is imported in `app.module.ts`.      |
| Runtime evaluation exists and is production code                                                                    | `StrategyRuntimeService.evaluate` → `RuntimeEvaluationService.evaluate` → `decideRuntimeEvaluation`. Mounted in `StrategyRuntimeModule`.                                   |
| Order, risk, paper execution, and position accounting exist                                                         | `OrderService.proposeOrderFromSignalIntent`, `CanonicalOrderPathService.runCanonicalPath`, `PositionAccountingConsumer.process`. Pipeline already calls all three.         |
| Session start already arms the runtime                                                                              | `TradingSessionService.start` calls `runtime.loadContext` then `runtime.arm`.                                                                                              |
| Proven when a caller supplies a closed candle                                                                       | `apps/api/src/validation/m3/us223-strategy-e2e-candle-fill-accounting.integration.spec.ts` constructs a candle and calls `pipeline.run`.                                   |
| Reporting, Notification, and AI consumers exist                                                                     | `ReportNarrativeConsumerService`, `ReportNotificationConsumerService`. They are production Nest services.                                                                  |
| Market-data primitives exist                                                                                        | `normalizeClosedCandle`, `MarketDataValidator`, `LatestMarketStateProjection`, `BinanceWebSocketConnector`, `mapBinanceKlineMessageToDraft`, `MarketSubscriptionRegistry`. |

### Why not B (substantial new domain implementation)

Completing the engine does **not** require writing a new Strategy domain, Order domain, Risk engine, Execution engine, Portfolio/ledger, Reporting generator, Notification delivery, or AI narrative engine. Those owners already exist.

Completing the engine **must not** merge research Signal Engine indicator evaluators into Strategy Runtime. Runtime evaluation is an explicit pure function of Deployment parameters + admitted closed candle:

```27:36:apps/api/src/modules/strategy-runtime/domain/runtime-evaluation.ts
/**
 * Deterministic Runtime evaluator (US219 / ADR-014 / ADR-018).
 * Pure function of approved Deployment parameters + admitted closed candle.
 * Does not use wall-clock, research Signal Engine, or Evaluation Scheduler.
 *
 * Parameter contract (optional, immutable on Deployment):
 * - `action`: `buy` | `sell` | `hold` — explicit fixture/simple deployments
 * - `compareCloseToOpen`: `true` — bullish close→buy, bearish→sell, else hold
 * Default without actionable parameters: NO_ACTION.
 */
```

Completing the engine **must not** invent a Tactic runtime-adaptation API. The Library already declares that unimplemented:

```126:129:apps/api/src/modules/strategy-library/domain/tactical-envelope-binding.ts
/** Epic 4: envelope is configuration only — no runtime adaptation APIs. */
export function tacticalEnvelopeRuntimeAdaptationImplemented(): false {
  return false;
}
```

### What “mostly wiring” still has to implement

These are new **composition** units, not new Sources of Truth:

1. **Market ingest adapter** — `BinanceWebSocketConnector.onMessage` currently handles subscribe ACKs only. It never calls `mapBinanceKlineMessageToDraft`. `LiveMarketConnector` has no event-delivery method. Projection `apply()` is never called from Nest boot.
2. **Runtime market-event worker** — no worker file exists under `apps/api/src`. Nothing lists `RUNNING` sessions and calls the pipeline.
3. **Pipeline command assembler** — `RunStrategyTradingPipelineCommand` requires `quantity`, `reservation`, and a full `CanonicalRiskSnapshot`. Tests fabricate these. No production builder exists.
4. **Post-fill product-flow trigger** — Reporting HTTP is GET-only. `requestAndNarrate` / `requestAndDeliver` have no production callers outside tests.

---

## Inventory — already exists

### Production-ready (mounted, owned, callable)

| Component                            | Location                                             | What it does today                                                                          | Invoked after Start Session?                 |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Trading Session start                | `trading-session.service.ts` `start()`               | Enforcement check → `loadContext` → lease → `RUNNING` → `runtime.arm`                       | **Yes** — this is start                      |
| Strategy Runtime lifecycle           | `runtime-lifecycle.coordinator.ts`                   | Arm / pause / resume / stop / enableEventAdmission                                          | **Arm only**                                 |
| Strategy Runtime evaluate            | `runtime-evaluation.service.ts`                      | Admit closed candle, `decideRuntimeEvaluation`, persist Signal Intent + checkpoint + outbox | No                                           |
| Tick admission                       | `domain/tick-admission.ts` `admitClosedCandleTick`   | Semantic closed-candle admission                                                            | No                                           |
| Strategy Trading Pipeline            | `strategy-trading-pipeline.service.ts` `run()`       | Evaluate → propose order → canonical path → accounting                                      | No production caller                         |
| Order proposal from Signal Intent    | `orders` `ORDER_PROPOSAL_PORT`                       | Creates strategy-origin paper Order                                                         | Only inside pipeline                         |
| Canonical order path                 | `canonical-order-path.service.ts`                    | Risk → reservation → paper execution                                                        | Only inside pipeline                         |
| Paper fill + accounting              | `execution-engine` + `PositionAccountingConsumer`    | Fill + position/ledger                                                                      | Only inside pipeline                         |
| Signal Intent read API               | `signal-intent.controller.ts`                        | Read-only HTTP                                                                              | N/A                                          |
| Outbox polling                       | `outbox-polling.service.ts`                          | Dispatches registered consumers                                                             | Yes, if consumers exist                      |
| Knowledge Lake trading-path consumer | `knowledge-lake-trading-path-outbox.consumer.ts`     | Projects session/order/risk/fill events                                                     | Yes, once events exist                       |
| Position mark-price consumer         | `position-valuation-outbox.consumer.ts`              | Values positions on `MarketMarkPrice`                                                       | Yes, if that event is published              |
| Reporting generation                 | `reporting-generation.service.ts` `requestReportRun` | Creates ReportRun                                                                           | No auto trigger from trades                  |
| Report → AI                          | `report-narrative-consumer.service.ts`               | `requestAndNarrate` / `narrateCompletedRun`                                                 | No production caller                         |
| Report → Notification                | `report-notification-consumer.service.ts`            | `requestAndDeliver` / `deliverCompletedRun`                                                 | No production caller                         |
| Live Market Data query + SSE         | `MarketDataQueryController`, SSE channel             | Read projection                                                                             | Query only; nothing writes into it from boot |
| Runtime Enforcement on start         | `TradingSessionService.start`                        | Requires prior Gate PASS on Deployment                                                      | **Yes**                                      |

### Production-ready but disconnected (wrong path for this runtime)

| Component                                    | Location                                    | Why it is not the Version 2 session runtime                                                                                                           |
| -------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signal Engine `evaluate`                     | `signal-engine.service.ts`                  | HTTP `POST /v1/market/signal/evaluate`. Loads cached candles. Not bound to Trading Session or Deployment. Runtime evaluator comments forbid using it. |
| Strategy evaluators (SMA, RSI, EMA, MACD, …) | `strategy-evaluators/`                      | Indicator `evaluator.evaluate({ strategy, candles })`. Used by Signal Engine, not Strategy Runtime.                                                   |
| Evaluation Scheduler                         | `evaluation-scheduler.service.ts`           | `setInterval` → Signal Engine. Comment: “executes nothing: no orders”. Session start does not create a schedule. Mounted in `app.module.ts`.          |
| Market data cache + providers                | `market-data-cache`, `market-data-provider` | REST candle window for Signal Engine. Not admitted as Runtime ticks.                                                                                  |

### Exists as code, not production-started

| Component                              | Location                                        | Gap                                                                                                        |
| -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `BinanceWebSocketConnector`            | `live-market-data/connectors/binance/`          | Class exists. `LiveMarketDataModule` does not register or `connect()` it. `onMessage` does not map klines. |
| `mapBinanceKlineMessageToDraft`        | `map-binance-kline-message.ts`                  | Used by tests and replay fixtures. Not called from the connector.                                          |
| `StartupRecoveryService`               | `live-market-data/recovery/`                    | Not a Nest provider. Tests construct it.                                                                   |
| `ClosedCandleGapRecoveryService`       | `integrity/gap-recovery-service.ts`             | Not registered in `LiveMarketDataModule`.                                                                  |
| `LatestMarketStateProjection.apply`    | `projection/latest-market-state-projection.ts`  | Callable. No production ingest caller.                                                                     |
| `MarketSubscriptionRegistry.subscribe` | `subscriptions/market-subscription-registry.ts` | Durable subscription store. Session start does not subscribe. HTTP market-data API is GET-only.            |

### Test helpers / unmounted legacy

| Component                                      | Location                                                                     | Classification                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FakeLiveMarketConnector`                      | `live-market-data/ports/fake-live-market-connector.ts`                       | Test helper. No event emission of candles.                                                                                                                     |
| US223 / pipeline unit specs                    | `validation/m3/us223-*.spec.ts`, `strategy-trading-pipeline.service.spec.ts` | Prove pipeline when the **test** is the caller.                                                                                                                |
| `PaperTradingRunner` / `PaperStrategy.execute` | `paper-trading-runner/`                                                      | Stub contract. “Performs no market simulation.” Research/smoke, not Command Center.                                                                            |
| US208 `PaperSessionManager`                    | `paper-trading-engine/paper-session-manager.ts`                              | Lifecycle only. No strategy binding. Order POST retired.                                                                                                       |
| US016 `PaperTradingExecutorModule`             | `paper-trading-executor/`                                                    | Subscribes to Evaluation Scheduler and books virtual trades. **Not imported in `app.module.ts`.** Parallel path. Must not be revived as the Version 2 runtime. |
| US010 `PaperTradingModule`                     | `paper-trading/`                                                             | Not mounted in `app.module.ts`.                                                                                                                                |
| Recovery strategy evaluation                   | `trading-session/recovery/recovery-strategy-evaluation.service.ts`           | Production class for recovery. Evaluates a supplied event; does not emit Signal Intent or create Orders. Not the live loop.                                    |

### Completely missing

| Missing unit                                                 | What “missing” means in code                                                                                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime execution loop / market-event worker                 | Zero worker files. `findByStatuses` exists for recovery discovery, not for candle fan-out.                                                                                              |
| Production caller of `StrategyTradingPipelineService.run`    | Grep in `apps/`: definition, unit spec, US223 integration spec only.                                                                                                                    |
| Connector → draft → `MarketClosedCandle` ingest              | Connector port has connect/subscribe/health/backfill. No `onEvent`. `onMessage` ignores kline payloads.                                                                                 |
| Session → market subscription                                | `TradingSessionStarted` is written to outbox. Knowledge Lake projects it. Nothing subscribes a stream.                                                                                  |
| Production `CanonicalRiskSnapshot` assembler                 | Only test objects.                                                                                                                                                                      |
| Production quantity / reservation sizing                     | Pipeline command fields; tests hardcode `'1'` / `'120'`.                                                                                                                                |
| Runtime `Tactic.evaluate`                                    | No such method. Envelope is configuration. `evaluateTacticPoint` is Library eligibility only.                                                                                           |
| Automatic report / notify / AI after fill                    | Product HTTP is query-only (`ReportingRunController` is `@Get`). PC-15 consumers are test-driven.                                                                                       |
| Outbox consumer of `SignalIntentCreated` that creates Orders | Intent is created inside evaluation; orders are created only by the pipeline `run` call, not by a separate consumer. That is correct **if** the worker calls `run`. There is no worker. |

---

## What Start Session actually does

From `TradingSessionService.start`:

1. Strategy-origin sessions must already have Runtime Enforcement PASS on the bound Deployment.
2. Status `STARTING`.
3. `runtime.loadContext` — approved Deployment + checkpoint.
4. Attach fenced lease. Status `RUNNING`. Outbox `TradingSessionStarted`.
5. `runtime.arm` — worker state `ARMED`, `acceptsEvaluation` true.
6. **Stop.**

Command Center copy is accurate:

```34:36:apps/web/src/command-center/session-commands.ts
      title: 'Start session?',
      message: `Start ${sessionId}. Trading Session will arm paper runtime if the bound Deployment is approved. This does not place orders.`,
```

PC-13 tests assert `RUNNING` + `ARMED`. They do not assert evaluation or orders.

---

## What “Strategy.evaluate()” means in this codebase

There is **no** class `Strategy` with `evaluate()` on the Trading Session path.

Two evaluators exist:

| Path             | Function                                      | Production?                | Session-bound?   |
| ---------------- | --------------------------------------------- | -------------------------- | ---------------- |
| Strategy Runtime | `decideRuntimeEvaluation(deployment, candle)` | Yes, uninvoked after start | Yes, when called |
| Signal Engine    | `evaluator.evaluate({ strategy, candles })`   | Yes, HTTP / scheduler      | No               |

The audit finding “No production Strategy.evaluate()” is true in the sense that **nothing runs after start**. It is false if read as “RuntimeEvaluationService does not exist.” It exists. Session start is not its caller.

Default without `parameters.action` or `parameters.compareCloseToOpen` is `NO_ACTION` (`no actionable deployment parameters`). Wiring the loop without actionable Deployment parameters will still produce no orders. That is existing evaluator behavior, not a missing engine.

---

## What “Tactic.evaluate()” means in this codebase

| Function                                           | Role                                                                             | Runtime?                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| `evaluateTacticPoint` in `strategy-eligibility.ts` | Certification eligibility: symbol / timeframe / scope / riskPerTrade vs envelope | **No** — Library only         |
| Session `tacticalEnvelope` field                   | Optional stub stored on Trading Session                                          | Configuration, not evaluation |
| `tacticalEnvelopeRuntimeAdaptationImplemented()`   | Always `false`                                                                   | Explicitly unimplemented      |

There is no production trading-runtime tactic evaluator. Envelope checks already happen at certification, eligibility, and Runtime Enforcement (deployment validation). They do not re-run per candle.

---

## Downstream stages after a Paper Order

When `pipeline.run` is invoked and fills:

1. Order persisted (paper mode).
2. Risk decision persisted.
3. Paper fill persisted; `OrderFillRecorded` outbox.
4. `PositionAccountingConsumer.process` updates position / ledger.
5. Knowledge Lake consumer may project those events.
6. **Reporting is not requested.**
7. **Notification is not delivered.**
8. **AI narrative is not generated.**

Those three product services exist. They require an explicit `requestReportRun` (then narrate / deliver). Reporting product HTTP cannot request a run.

Portfolio **does** change if the pipeline fills, because accounting is inside `run`. It does not change after Start Session, because `run` is never called.

---

## Classification summary

| Kind                                               | Count (this audit)                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Production-ready and already running after Start   | Lifecycle only (session + arm)                                                                                 |
| Production-ready, callable, not driven after Start | Runtime evaluate, pipeline, orders, risk, execution, accounting                                                |
| Production-ready, disconnected parallel path       | Signal Engine, evaluators, Evaluation Scheduler                                                                |
| Exists, not mounted / not started                  | Binance connector, startup recovery, gap recovery, Paper Trading Executor                                      |
| Test-only driver of the real pipeline              | US223, pipeline unit specs                                                                                     |
| Completely missing                                 | Ingest adapter, runtime worker, command assembler, post-fill report/notify/AI trigger, Tactic runtime evaluate |

---

## Final statement

Version 2 can start a paper Trading Session. It cannot run one.

The Runtime Engine is the missing driver of services that already exist. Completing it is **mostly wiring and composition**. It is not a redesign and not a new architecture program.

**STOP.** Wait for architectural review of the Gap Analysis and Implementation Plan before writing Runtime Engine code.
