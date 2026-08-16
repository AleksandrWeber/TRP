# Runtime Gap Analysis

**Document:** Runtime Gap Analysis  
**Date:** 2026-08-16  
**Nature:** Code-backed gap map for Runtime Engine Completion. No implementation.  
**Source of truth:** Current code under `apps/`.  
**Parent:** [Runtime Completion Audit](./runtime-completion-audit.md)  
**Plan:** [Runtime Implementation Plan](./runtime-implementation-plan.md)

Marks: **Existing** · **Partial** · **Missing**

---

## Pipeline map

```text
Market Feed
    ↓
Runtime Worker
    ↓
Strategy Evaluation
    ↓
Tactic Evaluation
    ↓
Signal Intent
    ↓
Trading Pipeline
    ↓
Paper Order
    ↓
Portfolio
    ↓
Reporting
    ↓
Notification
    ↓
AI
```

| Stage               | Mark         | Production-ready?         | After Start Session | Notes                                                                                                      |
| ------------------- | ------------ | ------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Market Feed         | **Partial**  | Primitives yes; ingest no | Does not run        | Connector class exists; Nest does not start it; `onMessage` ignores klines; projection never fed           |
| Runtime Worker      | **Missing**  | No                        | Does not run        | No worker, no outbox consumer, no session fan-out                                                          |
| Strategy Evaluation | **Partial**  | Runtime evaluator yes     | Does not run        | `decideRuntimeEvaluation` is production code, uninvoked. Indicator `Strategy.evaluate` is a different path |
| Tactic Evaluation   | **Missing**  | No runtime method         | Does not run        | Envelope is configuration. `evaluateTacticPoint` is Library eligibility only                               |
| Signal Intent       | **Existing** | Yes                       | Does not run        | Created inside `RuntimeEvaluationService` when decision is `SIGNAL_INTENT`                                 |
| Trading Pipeline    | **Partial**  | Service yes; callers no   | Does not run        | `StrategyTradingPipelineService.run` mounted; only tests call it                                           |
| Paper Order         | **Existing** | Yes                       | Does not run        | Created only through pipeline proposal                                                                     |
| Portfolio           | **Existing** | Yes                       | Does not run        | `PositionAccountingConsumer` inside pipeline `run`                                                         |
| Reporting           | **Partial**  | Generator + query yes     | Does not run        | No auto `requestReportRun` from fills. HTTP is GET-only                                                    |
| Notification        | **Partial**  | Delivery yes              | Does not run        | `ReportNotificationConsumerService` has no production trading caller                                       |
| AI                  | **Partial**  | Narrative yes             | Does not run        | `ReportNarrativeConsumerService` has no production trading caller                                          |

---

## Existing

Components that are implemented, mounted, and owned. They work when called.

- Trading Session create / start / pause / resume / stop (`TradingSessionService`)
- Runtime context load + arm (`StrategyRuntimeService` / `RuntimeLifecycleCoordinator`)
- Closed-candle admission (`admitClosedCandleTick`)
- Runtime evaluation + Signal Intent persistence + checkpoint + `SignalIntentCreated` outbox
- `StrategyTradingPipelineService.run` orchestration
- Order proposal from Signal Intent
- Canonical Risk → reservation → paper execution
- Position / ledger accounting from fill
- Outbox dispatcher + polling
- Knowledge Lake one-way projection of trading-path events
- Reporting generation + query
- Notification delivery
- AI analytical narrative
- Runtime Enforcement Gate (checked on start, not per candle)
- Library tactical envelope as certification configuration
- Live Market Data **read** API and SSE projection channel

---

## Missing

Completely absent as a production runtime unit.

- Market-event worker bound to RUNNING / ARMED Trading Sessions
- Production caller of `StrategyTradingPipelineService.run`
- Connector frame → `ClosedCandleDraft` → `MarketClosedCandle` ingest adapter
- Event delivery on `LiveMarketConnector` (port has no emit/subscribe-callback)
- Session-start market subscription (instrument / timeframe from Deployment)
- Nest registration of `BinanceWebSocketConnector` / `StartupRecoveryService`
- Production assembler for `quantity`, `reservation`, `CanonicalRiskSnapshot`
- Trading-runtime `Tactic.evaluate` (or equivalent per-candle envelope decision)
- Automatic Reporting request after fill
- Automatic Notification after that report
- Automatic AI narrative after that report
- Outbox consumer that turns `SignalIntentCreated` into an Order (unnecessary if the worker calls `run`, which already does proposal)

---

## Needs wiring

Existing production services that must be connected, not rewritten.

| From                            | To                                                 | How (existing ports only)                                                          |
| ------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `TradingSessionStarted`         | Live Market Data subscription                      | Durable `MarketSubscriptionRegistry.subscribe` for Deployment instrument/timeframe |
| Normalized `MarketClosedCandle` | Runtime Worker                                     | New consumer or in-process handoff into pipeline module                            |
| Runtime Worker                  | `StrategyTradingPipelineService.run`               | Direct port call (this is the US223 path)                                          |
| Pipeline fill                   | `PositionAccountingConsumer`                       | **Already inside `run`**                                                           |
| Pipeline fill / order events    | Knowledge Lake                                     | **Already registered** outbox consumer                                             |
| Pipeline fill                   | `ReportNarrativeConsumerService.requestAndNarrate` | Product-flow call after `filled`                                                   |
| Completed ReportRun             | `ReportNotificationConsumerService`                | Existing `requestAndDeliver` or `deliverCompletedRun`                              |
| Completed ReportRun             | AI Analytics                                       | Already inside `requestAndNarrate`                                                 |

Do **not** wire:

- Evaluation Scheduler → Paper Trading Executor (unmounted legacy parallel path)
- Signal Engine HTTP into Trading Session
- Live capital / venue private orders
- Knowledge Lake back into commands

---

## Needs implementation

Small new composition inside existing modules. No new bounded context. No new SoT.

| Unit                                        | Owner module (existing)                                        | Why it is implementation, not a one-line wire           |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Kline ingest in connector or ingest adapter | Live Market Data                                               | `onMessage` today only ACKs subscribe; mapper is unused |
| Session market-subscription on start        | Product-flow or Live Market Data, triggered by session event   | Start does not subscribe                                |
| Runtime worker                              | `strategy-trading-pipeline` (existing composition root)        | No loop exists                                          |
| Pipeline command assembler                  | `strategy-trading-pipeline`                                    | Tests invent risk snapshot and quantity                 |
| Optional envelope gate on the candle        | Consume Library envelope already bound to Deployment / session | Not `tacticalEnvelopeRuntimeAdaptationImplemented()`    |
| Post-fill report+notify+narrate             | `product-flow`                                                 | PC-15 consumers have no trading caller                  |

---

## Missing runtime stages (detail)

### 1. Market Feed — Partial

**Existing:** domain events, validator, normalization, checkpoint store, subscription registry, query/SSE, Binance WS class, Binance REST backfill adapter, kline mapper function.

**Missing:** Nest boot of a connector; ingest path from frames to `LatestMarketStateProjection.apply`; any publish of `MarketClosedCandle` into Outbox/Inbox from production.

`LiveMarketDataModule` comment is accurate: “No strategy / Orders / accounting.” That boundary must stay. The feed must emit market events only.

### 2. Runtime Worker — Missing

No file implements a loop over market events for ARMED sessions. Recovery services accept an event they are given. Session `findByStatuses` is for startup recovery, not candle dispatch.

### 3. Strategy Evaluation — Partial

**Existing production evaluator:** `decideRuntimeEvaluation`.

**Not the session evaluator:** SMA/RSI/… `evaluator.evaluate`.

After wiring, evaluation “executes” when a candle is admitted. It still emits `NO_ACTION` unless Deployment parameters are actionable. That is current domain behavior.

### 4. Tactic Evaluation — Missing

No per-candle tactic decision in Runtime. Envelope is frozen configuration. Eligibility `evaluateTacticPoint` is the only tactic-shaped function, and it is not imported by session runtime.

### 5. Signal Intent — Existing

Created atomically with checkpoint when evaluation returns `SIGNAL_INTENT`. HTTP cannot create intents.

### 6. Trading Pipeline — Partial

Service is the intended production orchestration. It has no production caller. Command shape is complete in types; filling it from live state is not.

### 7. Paper Order — Existing

Strategy-origin paper orders via proposal. Manual `POST /v1/orders` is a different origin. US208 paper-session order POST is retired.

### 8. Portfolio — Existing

Updates only when accounting processes a fill. No change from start alone.

### 9. Reporting — Partial

Generation exists. Product surface is query. No trading-path request.

### 10. Notification — Partial

Delivery exists. PC-15-d consumer exists. No trading-path request.

### 11. AI — Partial

Narrative exists. PC-15-c consumer exists. No trading-path request. AI remains read-only consumer of reports.

---

## Breaks in the chain (current)

```text
Start Session ──► RUNNING + ARMED ──► (end)

Market connector ──► (not started)
Connector onMessage ──► ACK only ──► (kline dropped)
Projection.apply ──► (no production caller)
pipeline.run ──► (tests only)
requestAndNarrate / requestAndDeliver ──► (tests only)
```

Intended chain after completion (no new domains):

```text
Start Session
  → RUNNING + ARMED
  → subscribe market stream (existing registry)
  → connector frames
  → normalize MarketClosedCandle (existing)
  → worker selects ARMED sessions (new composition)
  → optional envelope gate (reuse eligibility check)
  → pipeline.run (existing)
      → decideRuntimeEvaluation (existing)
      → Signal Intent (existing)
      → Paper Order (existing)
      → fill + portfolio (existing)
  → requestAndNarrate + requestAndDeliver (existing consumers)
```

---

## Test evidence of intended vs actual

| Test                                                            | What it proves                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `pc13-command-center-product.integration.spec.ts`               | Start → RUNNING + arm. Does not place orders                        |
| `us208-paper-trading-api.contract.spec.ts`                      | Paper session start leaves orders empty                             |
| `us223-strategy-e2e-candle-fill-accounting.integration.spec.ts` | Full candle → fill → accounting when **test** calls `pipeline.run`  |
| `strategy-trading-pipeline.service.spec.ts`                     | Pipeline branches when invoked                                      |
| `tactical-envelope-binding.spec.ts`                             | Runtime adaptation implemented === false                            |
| PC-15-c / PC-15-d product specs                                 | Report → AI and Report → Notification when **test** calls consumers |

---

**STOP.** Implementation Plan is proposed only. No code until architectural review.
