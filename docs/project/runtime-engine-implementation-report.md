# Runtime Engine Completion — Implementation Report

**Document:** Runtime Engine Implementation Report  
**Date:** 2026-08-16  
**Status:** Submitted for architectural review  
**Nature:** Production wiring of existing Runtime, Pipeline, Risk, Orders, Accounting, Reporting, Notification, and AI services. Not an RC. Not a Product Completion package.

Architecture Specification v2.0, the Authority Matrix, and the Alias Dictionary are unchanged. RC-19 … RC-28 remain frozen. PC-01 … PC-20 remain Closed. Version 2 Certification remains **SUSPENDED** until review.

Canonical sequence: [`runtime-sequence-diagram.md`](./runtime-sequence-diagram.md).

---

## What was wired

| Surface               | Change                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Market Feed**       | `ClosedCandleIngestService` admits a closed candle, writes `MarketClosedCandle` to the existing transactional outbox, applies the latest-market projection, and advances the market checkpoint. Connector klines call the same ingest.     |
| **Optional WS boot**  | `LiveMarketFeedCoordinator` hydrates subscriptions. Public Binance WS connects only when `LIVE_MARKET_WS_ENABLED=true` and a WebSocket factory exists. Tests do not enable it.                                                             |
| **Session subscribe** | `TradingSessionRuntimeWorker` consumes `TradingSessionStarted` and calls existing `MarketSubscriptionRegistry.subscribe` for the Deployment instrument/timeframe. Stop/fail unsubscribes.                                                  |
| **Runtime Worker**    | Durable outbox consumer `v2-trading-session-runtime`. On `MarketClosedCandle`, selects RUNNING strategy sessions, gates instrument/timeframe, and calls existing `StrategyTradingPipelineService.run`. No `while(true)`. No `setInterval`. |
| **Assembler**         | `PipelineCommandAssembler` reads Session, Deployment, Paper Account, Ledger cash, and Position. Quantity from Deployment `quantity` / `size`, else `riskPerTrade`, else `'1'`. Not a risk engine.                                          |
| **Pipeline**          | Unchanged `run()`: RuntimeEvaluationService → Signal Intent → Orders proposal → Canonical Risk → Paper Execution → Position accounting.                                                                                                    |
| **Post-fill**         | Existing `ReportNarrativeConsumerService.requestAndNarrate` and `ReportNotificationConsumerService.requestAndDeliver` with existing `ops_daily` kind.                                                                                      |
| **Operator copy**     | Command Center start dialog and Create Bot wizard state that closed candles may create **paper** orders. Live capital remains unauthorized.                                                                                                |
| **REST**              | None added.                                                                                                                                                                                                                                |

---

## Production path (not a redesign)

| File                                                                                 | Role                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `apps/api/src/modules/live-market-data/ingest/closed-candle-ingest.service.ts`       | Closed candle → outbox + projection               |
| `apps/api/src/modules/live-market-data/ingest/live-market-feed.coordinator.ts`       | Optional public stream boot                       |
| `apps/api/src/modules/strategy-trading-pipeline/pipeline-command.assembler.ts`       | Assemble existing snapshots for `run()`           |
| `apps/api/src/modules/strategy-trading-pipeline/trading-session-runtime.worker.ts`   | Event-driven production caller of `run()`         |
| `apps/api/src/modules/strategy-trading-pipeline/strategy-trading-pipeline.module.ts` | Existing composition root; worker registered here |
| `apps/web/src/command-center/session-commands.ts`                                    | Start-session copy                                |

Processing begins when a closed candle (or equivalent production market event) is ingested. Outbox dispatch remains existing Event Processing infrastructure (`OutboxPollingService`). That poller is not a strategy evaluation loop.

---

## Reuse held

| Service                          | Disposition                                       |
| -------------------------------- | ------------------------------------------------- |
| `RuntimeEvaluationService`       | Same evaluate path inside `pipeline.run`          |
| `StrategyTradingPipelineService` | Same `run()` as US223                             |
| Canonical Risk                   | Same `CanonicalOrderPathService.runCanonicalPath` |
| Execution                        | Same paper adapter inside the canonical path      |
| Accounting                       | Same `PositionAccountingConsumer.process`         |
| Reporting                        | Same `requestReportRun` via product-flow          |
| Notification                     | Same `deliver()` via product-flow                 |
| AI Analytics                     | Same `requestAndNarrate`                          |

No second Runtime Engine. No second Pipeline. No second Signal Engine. Tactic gate is instrument/timeframe match against the bound Deployment. `tacticalEnvelopeRuntimeAdaptationImplemented()` remains `false`. Deprecated US016 Paper Trading Executor and Signal Engine are not revived.

---

## Definition of Done (implementation)

| #   | Check                                         | Result                                                      |
| --- | --------------------------------------------- | ----------------------------------------------------------- |
| 1   | Running paper session reacts to market events | **TRUE** — worker consumes `MarketClosedCandle`             |
| 2   | Runtime evaluation executes                   | **TRUE** — existing `RuntimeEvaluationService`              |
| 3   | Existing pipeline executes                    | **TRUE** — `StrategyTradingPipelineService.run`             |
| 4   | Paper orders created automatically            | **TRUE** — no test-only `pipeline.run` caller in production |
| 5   | Portfolio / ledger update                     | **TRUE** — existing accounting                              |
| 6   | Reporting / Notification / AI                 | **TRUE** — existing product-flow consumers                  |
| 7   | No ownership or architecture change           | **TRUE**                                                    |
| 8   | Certification restored                        | **FALSE** — waiting for architectural review                |

---

**STOP.** Wait for architectural review. Do not restore Version 2 Certification. Do not create the final release tag. Do not start Version 3.
