# Runtime Engine Completion — End-to-End Runtime Report

**Document:** End-to-End Runtime Report  
**Date:** 2026-08-16  
**Nature:** Observed production path. Not intended architecture.

---

## Sequence executed automatically

```text
Command Center → Start Session
        ↓
Trading Session RUNNING + runtime ARMED
        ↓
TradingSessionStarted (outbox)
        ↓
Worker subscribes instrument/timeframe
        ↓
Closed Candle admitted by Market Feed
        ↓
MarketClosedCandle (outbox)
        ↓
Trading Session Runtime Worker
        ↓
RuntimeEvaluationService (inside pipeline.run)
        ↓
StrategyTradingPipelineService.run()
        ↓
Canonical Risk
        ↓
Paper Order + Fill
        ↓
Accounting (position + ledger)
        ↓
Reporting (ops_daily run)
        ↓
Notification (existing deliver)
        ↓
AI Narrative (attached to the run)
```

No extra REST command after Start Session. No test harness as the production caller.

---

## Stage evidence

| Stage              | Automatic?                        | Evidence                                              |
| ------------------ | --------------------------------- | ----------------------------------------------------- |
| Start Session      | Operator command (existing)       | `TradingSessionService.start`                         |
| Subscribe          | Yes                               | Worker on `TradingSessionStarted`                     |
| Closed Candle      | Market event                      | `ClosedCandleIngestService.publish` / connector kline |
| Runtime Worker     | Yes                               | Outbox consumer                                       |
| Runtime evaluation | Yes                               | Existing evaluate inside `run()`                      |
| Pipeline           | Yes                               | Same `run()` as US223                                 |
| Paper Order        | Yes when Deployment is actionable | Order + Fill rows                                     |
| Accounting         | Yes on fill                       | Position + FILL ledger                                |
| Reporting          | Yes on fill                       | Report run                                            |
| Notification       | Yes on fill                       | Delivery record                                       |
| AI Narrative       | Yes on fill                       | Attached narrative                                    |

Start Session does not place an order by itself. A closed candle after start is sufficient.

---

## Manual intervention required

None for the paper path after Start Session, provided:

- Deployment is approved and actionable (`action: 'buy'` or equivalent existing evaluate rule)
- Session remains RUNNING with an active lease
- A closed candle for the bound instrument/timeframe is ingested

Public WebSocket is optional. Operators may inject the same closed-candle event through ingest in environments without WS.

---

**End of End-to-End Runtime Report.**
