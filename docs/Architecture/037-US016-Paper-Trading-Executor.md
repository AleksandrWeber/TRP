# US016 — Paper Trading Executor

Status: Implemented  
Scope: Automatic virtual-trade execution driven by Evaluation Scheduler
results. The executor subscribes to scheduler evaluations, applies
`BUY` / `SELL` / `HOLD` rules to per-strategy virtual portfolios, and
preserves every executed trade in an in-memory trade history. No real
exchange orders, no Risk Management, no Stop Loss / Take Profit, no
leverage, no fees, no slippage. Technical Indicators, Strategy Evaluators,
Signal Engine decision logic, scheduler timing logic, Authentication,
Binance Provider, Workspace, and Market Cache are unchanged. The only
scheduler change is a new result-publication seam (`onResult`), which US015
explicitly deferred to downstream consumers ("must subscribe later without
changing this trigger boundary").

## Architecture

```text
EvaluationSchedulerService                  — modules/evaluation-scheduler (US015)
  setInterval tick → SignalEngineService.evaluate
  ↓ SignalResult { BUY | SELL | HOLD }
  ├─ schedule.lastSignal / lastEvaluatedAt   (US015, unchanged)
  └─ publish(EvaluationResultEvent)          (US016 — new seam)
       ↓  onResult listener (in-process, failure-isolated)
PaperTradingExecutorService                 — modules/paper-trading-executor (US016)
  ├─ idempotency guard (signal timestamp)   — duplicate signals never re-execute
  ├─ BUY  → open virtual position (none open, strategy exists)
  ├─ SELL → close open virtual position
  ├─ HOLD → record signal statistics only
  ├─ MarketDataCacheService.getTicker        — execution price (read-through cache)
  └─ ExecutorPortfolioStore                  — per-strategy portfolio + trade history
       ✗ real exchange orders — never
       ✗ risk / SL / TP / leverage / fees / slippage — out of scope
```

Dependency direction:

```text
PaperTradingExecutorModule
  → EvaluationSchedulerModule   (onResult subscription)
  → StrategiesModule            (positionSize lookup on BUY)
  → MarketDataCacheModule       (execution + valuation prices)
  → MarketDataDomainModule      (provider registry, cache-miss loader only)
  → WorkspaceModule             (X-Workspace-Id validation)
```

The scheduler has no compile-time dependency on the executor — it only holds
a `Set<EvaluationResultListener>`. The legacy manual `PaperTradingModule`
(US010) and the durable M2 orders/ledger stack are untouched and unaware of
this module.

## Execution flow

1. A schedule tick (or `runOnce`) produces a `SignalResult`.
2. The scheduler updates `lastSignal` / `lastEvaluatedAt` (US015 behavior),
   then publishes a frozen `EvaluationResultEvent { workspaceId, strategyId,
result }` to every listener. A throwing listener is logged and skipped;
   scheduling and other listeners continue.
3. `PaperTradingExecutorService.process`:
   - **Idempotency** — the signal key `timestamp::signal` is checked against
     the strategy's processed-signal set. Re-delivery returns `DUPLICATE`
     and increments a counter; no trade is ever created twice.
   - **HOLD** — increments `signalStats.hold`; returns `HELD`. No price
     fetch, no trade.
   - **BUY** — with an open position → `IGNORED`. With a missing/foreign
     strategy → `IGNORED`. Otherwise the current ticker price is read
     through the market cache and an `OPEN` trade is stored
     (side `BUY`, quantity = `strategy.positionSize`,
     `openTime` = signal timestamp).
   - **SELL** — without an open position → `IGNORED`. Otherwise the open
     trade is closed at the cached ticker price of the trade's own symbol
     (never the signal's, so a mid-position trading-pair edit cannot mix
     instruments), with `profitLoss = (exit − entry) × quantity`.
4. Any thrown error (e.g. provider outage during the price fetch) is caught,
   counted in `signalStats.failures`, logged, and returned as `FAILED` — the
   executor and the scheduler keep running.

Determinism: trade open/close times come from the signal timestamp, and the
idempotency key is derived from the signal itself, so processing the same
signal twice can never create a duplicate trade.

## Portfolio update flow

Portfolios are derived from the trade store at read time — there is no dual
bookkeeping to drift:

| Field             | Source                                                                |
| ----------------- | --------------------------------------------------------------------- |
| `currentPosition` | The single `OPEN` trade, or null                                      |
| `unrealizedPnL`   | `(cached ticker price − entry) × quantity` of the open trade          |
| `realizedPnL`     | Sum of `profitLoss` over `CLOSED` trades                              |
| `totalTrades`     | Every executed trade (OPEN + CLOSED)                                  |
| `wins` / `losses` | `CLOSED` trades with `profitLoss > 0` / `< 0` (break-even is neither) |
| `signalStats`     | buy / sell / hold / ignored / duplicates / failures counters          |

Each strategy owns exactly one portfolio per workspace; strategies and
symbols are fully isolated because all state is keyed by
`workspaceId::strategyId` and every trade carries its own symbol.

## Trade lifecycle

```text
BUY signal (no open position)
  → ExecutedTrade { status: OPEN, exitPrice: null, closeTime: null, profitLoss: 0 }
SELL signal (position open)
  → same record → { status: CLOSED, exitPrice, closeTime, profitLoss }
```

Trade fields: `tradeId`, `strategyId`, `symbol`, `side` (`BUY` — long-only;
`SELL` reserved for future shorts), `entryPrice`, `exitPrice`, `quantity`,
`openTime`, `closeTime`, `profitLoss`, `status`. Records are validated by
`createExecutedTrade` and frozen. Trade history only grows — nothing is ever
deleted automatically.

## Failure handling

| Failure                                | Behavior                                                     |
| -------------------------------------- | ------------------------------------------------------------ |
| Listener throws inside the scheduler   | Logged by the scheduler; tick completes; other listeners run |
| Price fetch / execution throws         | Caught by the executor, `FAILED` outcome, `failures` counter |
| Strategy deleted before a BUY executes | `IGNORED` — no trade                                         |
| Same signal delivered twice            | `DUPLICATE` — no trade, counter only                         |
| Scheduler evaluation failure           | Unchanged US015 behavior — executor never sees a result      |

## HTTP API

Execution is driven exclusively by the scheduler subscription — no endpoint
triggers a trade. All routes are authenticated (global JWT) and
workspace-scoped via `X-Workspace-Id`.

| Method | Path                                        | Purpose                              |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/v1/paper-executor/portfolios`             | All executor portfolios in workspace |
| GET    | `/v1/paper-executor/portfolios/:strategyId` | One strategy portfolio               |
| GET    | `/v1/paper-executor/trades[?strategyId=]`   | Trade history (OPEN + CLOSED)        |

Error boundary (`PaperTradingExecutorErrorFilter`):

| Code                  | HTTP |
| --------------------- | ---- |
| `PORTFOLIO_NOT_FOUND` | 404  |

## Current limitations

- All executor state (portfolios, trades, processed-signal keys) is
  **in-memory** — a process restart loses it, like US010/US015 state.
- Long-only: BUY opens, SELL closes; no shorts (`direction` is not yet
  consulted).
- Execution price is the cached ticker at processing time, not the candle
  close the evaluator saw.
- The idempotency set grows unboundedly with process lifetime (one key per
  processed signal per strategy).
- The in-process listener seam is single-instance only; multi-instance
  delivery needs the durable outbox/event-processing stack.
- No frontend view of executor portfolios/trades yet.

## Technical Debt

| Item                                | Notes                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-memory store                     | Durable persistence (Prisma) or integration with the M2 orders/fills/ledger stack is the long-term home for automated paper execution.                                                      |
| Three paper-trading implementations | US010 manual module, US016 executor, and the M2 durable stack coexist; consolidation is a future milestone.                                                                                 |
| Failed signals are not retried      | A signal marked processed that later fails (e.g. provider outage) is never re-executed; acceptable because every tick produces a fresh signal, but a durable retry queue would be stricter. |
| Processed-key growth                | Bounded eviction (e.g. keep last N keys per strategy) once memory matters.                                                                                                                  |
| No executor UI                      | Dashboard/production pages do not surface `/v1/paper-executor` data.                                                                                                                        |

## Related documents

- [036 — Evaluation Scheduler](./036-US015-Evaluation-Scheduler.md)
- [030 — Paper Trading Engine](./030-US010-Paper-Trading-Engine.md)
- [029 — Signal Engine](./029-US009-Signal-Engine.md)
- [028 — Market Data Cache](./028-US008-Market-Data-Cache.md)
