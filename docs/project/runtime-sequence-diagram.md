# Runtime Sequence Diagram

**Document:** Runtime Sequence Diagram  
**Status:** Canonical production Runtime document  
**Date:** 2026-08-16  
**Nature:** Implementation of the paper Runtime Engine as it runs. Not intended architecture. Not an RC.

One page. Architecture Specification v2.0, the Authority Matrix, and the Alias Dictionary are unchanged.

---

## Production runtime

```text
Closed Candle
    ↓
Market Feed
    ↓
Trading Session Runtime Worker
    ↓
RuntimeEvaluationService
    ↓
StrategyTradingPipelineService.run()
    ↓
Canonical Risk
    ↓
Paper Order
    ↓
Accounting
    ↓
Reporting
    ↓
Notification
    ↓
AI Narrative
```

```mermaid
sequenceDiagram
    autonumber
    participant CC as Command Center
    participant TS as Trading Session
    participant Feed as Live Market Data
    participant Worker as Trading Session Runtime Worker
    participant Eval as RuntimeEvaluationService
    participant Pipe as StrategyTradingPipelineService
    participant Risk as Canonical Risk
    participant Ord as Orders / Paper Execution
    participant Acc as Accounting
    participant Rep as Reporting
    participant Ntf as Notification
    participant AI as AI Analytics

    CC->>TS: Start Session
    TS->>TS: RUNNING + runtime ARMED
    TS-->>Feed: TradingSessionStarted (outbox)
    Worker->>Feed: subscribe instrument/timeframe
    Note over Feed: Processing starts only when a closed candle arrives.<br/>No while(true). No setInterval strategy poll.

    Feed->>Feed: kline / ingest → validate → MarketClosedCandle
    Feed-->>Worker: MarketClosedCandle (outbox)
    Worker->>Worker: select RUNNING strategy sessions
    Worker->>Pipe: run(assembled command)
    Pipe->>Eval: evaluate(closed candle)
    Eval-->>Pipe: Signal Intent or NO_ACTION
    Pipe->>Ord: proposeOrderFromSignalIntent
    Pipe->>Risk: runCanonicalPath
    Risk->>Ord: paper fill
    Pipe->>Acc: PositionAccountingConsumer.process
    Worker->>Rep: requestReportRun (existing)
    Worker->>AI: requestAndNarrate (existing)
    Worker->>Ntf: requestAndDeliver (existing)
```

---

## What each arrow is in code

| Stage                         | Production unit                                                                               | Owner (unchanged)                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Start Session                 | `TradingSessionService.start` → `runtime.arm`                                                 | Trading Session / Strategy Runtime lifecycle          |
| Subscribe                     | Outbox `TradingSessionStarted` → `MarketSubscriptionRegistry.subscribe`                       | Live Market Data (write triggered by session event)   |
| Closed Candle                 | `ClosedCandleIngestService` (connector kline or accepted event) → Outbox `MarketClosedCandle` | Live Market Data                                      |
| Runtime Worker                | `TradingSessionRuntimeWorker` durable outbox consumer                                         | Strategy Trading Pipeline (existing composition root) |
| Runtime evaluation            | `StrategyTradingPipelineService.run` → `RuntimeEvaluationService.evaluate`                    | Strategy Runtime                                      |
| Pipeline                      | same `run()` as US223                                                                         | Strategy Trading Pipeline                             |
| Canonical Risk                | `CanonicalOrderPathService.runCanonicalPath`                                                  | Risk / Execution                                      |
| Paper Order                   | `OrderService.proposeOrderFromSignalIntent`                                                   | Orders                                                |
| Accounting                    | `PositionAccountingConsumer.process` (already inside `run`)                                   | Positions / Ledger                                    |
| Reporting / Notification / AI | `ReportNarrativeConsumerService` + `ReportNotificationConsumerService` after `filled`         | product-flow consumers of existing owners             |

Start Session does not place an order by itself. After start, a closed candle is sufficient. No extra REST command. No test-only `pipeline.run` caller in production.
