# Runtime Implementation Plan

**Document:** Runtime Implementation Plan  
**Status:** **PROPOSED — awaiting architectural review**  
**Date:** 2026-08-16  
**Nature:** Smallest implementation to make the paper trading runtime operational. Not an RC. Not a new bounded context.  
**Inputs:** [Runtime Completion Audit](./runtime-completion-audit.md) (A — mostly wiring) · [Runtime Gap Analysis](./runtime-gap-analysis.md)

**STOP.** Do not implement until this plan is approved.

---

## Objective

After Command Center → Start Session, without manual API calls and without a test harness:

Market data arrives → runtime worker receives it → Strategy evaluates → Tactic gate runs → Signal Intent → Trading Pipeline → Paper Order → Portfolio updates → Reporting updates → Notification → AI narrative available.

---

## Non-negotiables

- Do **not** redesign architecture.
- Do **not** introduce new bounded contexts, ownership, or Sources of Truth.
- Do **not** reopen RC-19 … RC-28 or Product Completion packages.
- Do **not** authorize live capital.
- Do **not** wire research Signal Engine / Evaluation Scheduler / US016 Paper Trading Executor into Trading Session.
- Do **not** set `tacticalEnvelopeRuntimeAdaptationImplemented()` to true.
- Reuse every existing service listed in the audit.

---

## What “smallest” means

Use the path US223 already proved:

```text
closed candle → StrategyTradingPipelineService.run
  → StrategyRuntimePort.evaluate
  → proposeOrderFromSignalIntent
  → CanonicalOrderPathService.runCanonicalPath
  → PositionAccountingConsumer.process
```

Add only the production driver and the two product-flow calls that US223 never made (Reporting / Notification / AI).

---

## Proposed work (existing owners)

### 1. Live Market Data ingest (owner: Live Market Data)

Reuse: `BinanceWebSocketConnector`, `mapBinanceKlineMessageToDraft`, `MarketDataValidator`, `LatestMarketStateProjection`, `MarketSubscriptionRegistry`, `StartupRecoveryService` (register it; do not rewrite).

Add:

- Nest provider that registers a public connector on the existing empty `LiveMarketConnectorRegistry`.
- Ingest adapter: kline frame → mapper → validator → `projection.apply`. Optionally append durable `MarketClosedCandle` for consumers.
- Teach connector `onMessage` to deliver kline payloads, or handle mapping in the adapter if the connector port must stay credential-free and strategy-free.

Paper-first: public market data only. No private trading credentials (`BinanceWebSocketConnector` already rejects them).

Do not import Strategy Runtime, Orders, or Pipeline into Live Market Data.

### 2. Subscribe on session start (owner: product-flow or Trading Session notify-only)

Reuse: `TradingSessionStarted` outbox event, `MarketSubscriptionRegistry.subscribe`, Deployment instrument/timeframe already on the approved Deployment / session.

Add a durable outbox consumer (same pattern as `KnowledgeLakeTradingPathOutboxConsumer`) that, on `TradingSessionStarted` for strategy-origin sessions, registers the closed-candle subscription. On stop, unsubscribe.

Trading Session remains lifecycle-only. It already must not import Orders. Subscription is a market-data write triggered by an event, not a Session domain expansion.

### 3. Runtime worker (owner: Strategy Trading Pipeline)

This module is already the composition root that Runtime itself is forbidden to be (Runtime module forbids Orders / Risk / Execution).

Add one Nest worker/consumer:

- Input: normalized `MarketClosedCandle` (in-process after projection, or Outbox/Inbox — prefer the existing durable consumer pattern).
- Select sessions: `TradingSessionRepository.findByStatuses(['running'])` filtered to strategy origin, matching instrument/timeframe, runtime `ARMED` / `canEvaluate`.
- For each: assemble command (step 4) → `StrategyTradingPipelineService.run`.
- Honor pause/stop via existing lifecycle (`canEvaluate` already rejects).
- Idempotency: runtime checkpoint + pipeline `already_processed` already exist. Do not add a second SoT.

No timer-based Strategy evaluation. Closed candles only (`CLOSED_CANDLE_TICK_EVENT_TYPE = 'MarketClosedCandle'`).

### 4. Pipeline command assembler (owner: Strategy Trading Pipeline)

Reuse reads only:

- Session + lease + fencing token (`TradingSessionService` / repository)
- Paper account
- Ledger cash / reservation ports
- Position + portfolio reads already used by risk tests
- Candle → market snapshot (`marketFromCandle` already in the pipeline service)
- Quantity: Deployment `parameters` if present; otherwise a deterministic size from existing envelope `riskPerTrade` and available cash. Do not invent a new sizing engine.

This is the largest new function. It is still assembly of existing snapshots, not a new risk SoT. Risk **decisions** remain `RiskDecisionService.evaluate` inside the canonical path.

### 5. Tactic gate (not a Tactic engine)

Reuse `evaluateTacticPoint` logic (Library eligibility) against the frozen envelope already bound at certification / copied onto session or Deployment facts.

Call it **before** `pipeline.run` (or inside the assembler): if the candle’s symbol / timeframe / scope is outside the envelope, skip the session (`NO_ACTION` / reject), do not adapt parameters.

Do **not** implement runtime adaptation APIs. Envelope stays configuration.

This is the minimum that makes “Tactic evaluates” true without changing ownership. It is a gate, not a tactic strategy.

### 6. Post-fill Reporting → Notification → AI (owner: product-flow)

Reuse: `ReportNarrativeConsumerService.requestAndNarrate`, `ReportNotificationConsumerService.requestAndDeliver` (or narrate + deliver on the same completed run).

Trigger when pipeline outcome is `filled` (and optionally `resting` if a report definition covers working orders). Use existing report kinds / definitions. Do not generate reports inside Orders or Runtime.

Reporting product HTTP stays query-only.

### 7. Operator copy

Update Command Center start dialog: start **does** arm runtime **and** the worker will place paper orders when market events and Deployment parameters produce a Signal Intent. Do not claim live capital.

---

## Explicitly out of scope

| Item                                                      | Why                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| Porting SMA/RSI evaluators into `decideRuntimeEvaluation` | Runtime comments forbid Signal Engine. Architecture change. |
| Reviving US016 Paper Trading Executor                     | Unmounted parallel path; not canonical US223                |
| US208 PaperSession auto-trading                           | No strategy binding; Command Center path is Trading Session |
| New “Runtime Engine” bounded context                      | Pipeline module already composes the path                   |
| Live venue orders                                         | Paper freeze                                                |
| New report kinds / notification channels                  | PC-05 / PC-06 / PC-07 Closed                                |
| Changing Spec, Authority Matrix, Alias Dictionary         | Frozen                                                      |

---

## Suggested sequence

1. Ingest: connector delivers closed candles into projection (and durable event if used).
2. Assembler + worker calling `pipeline.run` for one ARMED session (can be driven by a recorded candle in a production-shaped integration test, not a test-only `new StrategyTradingPipelineService(...)` harness as the product path).
3. Session-start subscription so Start Session is sufficient.
4. Envelope gate.
5. Post-fill `requestAndNarrate` + `requestAndDeliver`.
6. End-to-end verification: Start Session → (market event) → order → portfolio → report → notification → AI, with no extra HTTP commands.

Skip 3 and the product is still a manual-subscription engine. Do not skip 3 if the objective is “Start Session is enough.”

---

## Completion criteria (from the task)

Version 2 may return to CERTIFIED only when:

- A running Paper Session automatically reacts to market events.
- Strategy evaluation executes (`RuntimeEvaluationService` / `decideRuntimeEvaluation`).
- Tactic gate executes (envelope vs candle).
- Signals are generated when Deployment parameters are actionable.
- Paper Orders are created automatically.
- Portfolio changes.
- Reporting updates.
- Notification works.
- AI Analytics receives report data.
- End-to-end paper trading works without manual intervention.

Until then: [Version 2 Certification Suspended — Pending Runtime Engine Completion](./version-2-certification-hold.md).

---

## Validation expected after approval

- Integration: Start Session → inject/public closed candle → pipeline outcomes without constructing `StrategyTradingPipelineService` in the test as the only caller (Nest-mounted worker must run).
- Regression: US223 still passes.
- Boundary: Live Market Data still must not import Strategy Runtime / Orders.
- Boundary: Strategy Runtime still must not import Orders.
- Envelope adaptation flag remains `false`.
- No Signal Engine import from pipeline/runtime.

---

**STOP.** Wait for architectural review.
