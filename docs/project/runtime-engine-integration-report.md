# Runtime Engine Completion — Runtime Integration Report

**Document:** Runtime Integration Report  
**Date:** 2026-08-16  
**Verdict:** Production worker is mounted in the existing pipeline module and driven by durable market events.

---

## Mounting

| Unit                            | How it is live                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `StrategyTradingPipelineModule` | Already imported by `AppModule`                                                                               |
| `TradingSessionRuntimeWorker`   | Provider; `onModuleInit` registers consumer `v2-trading-session-runtime` on `OutboxDispatcher`                |
| `ClosedCandleIngestService`     | Provider on `LiveMarketDataModule` (already imported by `AppModule`)                                          |
| `LiveMarketFeedCoordinator`     | Optional WS; hydrates subscriptions on boot                                                                   |
| Event delivery                  | Existing `OutboxPollingService` calls `dispatcher.start()` and dispatches outbox rows. Not a strategy poller. |

---

## Event contracts reused

| Event                              | Producer                                                 | Consumer                                                |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `TradingSessionStarted`            | Trading Session (existing)                               | Runtime Worker → `MarketSubscriptionRegistry.subscribe` |
| `TradingSessionStopped` / `Failed` | Trading Session (existing)                               | Runtime Worker → unsubscribe                            |
| `MarketClosedCandle`               | Closed-candle ingest (new producer of the existing type) | Runtime Worker → assemble → `pipeline.run`              |

No new event type for evaluation. No second outbox.

---

## Integration proof

`apps/api/src/validation/m3/runtime-engine-paper-session.integration.spec.ts`

1. Seed approved Deployment (`action: 'buy'`), paper account, ledger opening, strategy session.
2. `TradingSessionService.start` — Command Center equivalent. No extra REST.
3. `ClosedCandleIngestService.publish` — production ingest, not `pipeline.run`.
4. `OutboxDispatcher.dispatchOnce` — same dispatcher the worker registered on.
5. Assert paper order, fill, long position, FILL ledger transaction, report run, attached AI narrative, recorded notification delivery.

The test does not call `pipeline.run`.

Unit/boundary:

- `trading-session-runtime.worker.spec.ts`
- `closed-candle-ingest.service.spec.ts`
- `strategy-trading-pipeline.boundaries.spec.ts` (no `while(true)` / `setInterval` / Signal Engine)
- `live-market-data.boundaries.spec.ts` (no Strategy Runtime / Orders / pipeline)

---

**End of Runtime Integration Report.**
