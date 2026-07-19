# US010 — Paper Trading Engine

Status: Implemented  
Scope: Manual, in-memory, long-only paper execution driven by `SignalResult`
(US009) and priced with the latest read-through cached ticker (US008). No real
orders, exchange credentials, futures, margin, leverage, fees, slippage,
external persistence, scheduling, polling, automation, UI, or charts.

## Engine architecture

```text
POST /v1/paper-trading/execute { strategyId }
  ↓ authenticated + X-Workspace-Id
PaperTradingController
  ↓
PaperTradingService                         application orchestration
  ├─ StrategyDomainService                  strategy + positionSize
  ├─ SignalEngineService                    SignalResult (US009)
  └─ MarketDataCacheService.getTicker       latest execution price (US008)
       ↓ only on cache miss (loader)
       MarketDataProviderRegistry → active provider
  ↓ SignalResult + cached price + quantity
PaperTradingEngine                         pure execution boundary
  ↓
PositionManager
  ├─ PositionRegistry                       in-memory, workspace-scoped
  ├─ TradeHistory                           in-memory, workspace-scoped
  └─ PnLCalculator                          simple long-only arithmetic
```

`PaperTradingEngine` has no cache, provider, Binance, exchange, API-key, order,
or persistence dependency. It consumes the `SignalResult` and execution inputs
already resolved by the application service. `PaperTradingService` obtains a
ticker exclusively through `MarketDataCacheService`; the active provider is
reachable only inside the cache-miss loader callback. Binance is never imported
or referenced by the paper-trading module.

The split preserves two independently testable boundaries:

- Signal Engine: market candles → trading decision.
- Paper Trading Engine: trading decision + cached execution price → simulated
  position transition.

There is deliberately no automatic loop between them. A transition occurs only
when a client manually invokes `POST /paper-trading/execute`.

## Components

| Component                | Responsibility                                      |
| ------------------------ | --------------------------------------------------- |
| `PaperPosition`          | Validated, frozen long-position lifecycle model     |
| `TradeResult`            | Validated result of one manual execution request    |
| `PositionRegistry`       | One open position per strategy; workspace isolation |
| `TradeHistory`           | Ordered in-memory history of executed opens/closes  |
| `PnLCalculator`          | Realized, unrealized, and aggregate portfolio PnL   |
| `PositionManager`        | Applies BUY/SELL/HOLD transition rules              |
| `PaperTradingEngine`     | Provider-free paper-execution boundary              |
| `PaperTradingService`    | Loads strategy/signal and resolves cached prices    |
| `PaperTradingController` | Authenticated, workspace-scoped REST API            |

State is process-local. A backend restart intentionally clears all paper
positions and history.

## Relationship to RC-16 durable paper trading

This milestone is **not** a replacement for the existing durable RC-16 path
(`paper-account`, `orders`, `execution-adapter`, `execution-engine`,
`positions`, `ledger`). Those modules remain the owners of:

- Prisma `PaperPosition` / positions-domain `Position`
- cash reservation, fills, ledger transactions, outbox events
- authenticated trading-command authorization and idempotency

`modules/paper-trading` is an isolated, in-memory simulation layer for the
Signal Engine foundation (US006–US009). It must not import or write through
the RC-16 repositories, and RC-16 must not consume this module's state.

Naming note: the US010 domain type is also called `PaperPosition` because that
is the story contract. It lives only under `modules/paper-trading` and must
not be confused with the Prisma `PaperPosition` model used by RC-16. If the
two surfaces need to coexist long-term in shared application code, rename this
module's type (for example `SignalPaperPosition`) before promoting it beyond
the foundation milestone.

## Domain models

### PaperPosition

```json
{
  "id": "uuid",
  "strategyId": "strategy-uuid",
  "symbol": "BTCUSDT",
  "side": "LONG",
  "quantity": 2,
  "entryPrice": 64500,
  "entryTime": "2026-07-19T12:00:00.000Z",
  "status": "OPEN"
}
```

Only `LONG` exists in US010. Status transitions once from `OPEN` to `CLOSED`.
Exit information is represented by the matching `CLOSE_LONG` result in trade
history, keeping the required position contract compact.

### TradeResult

```json
{
  "positionId": "uuid",
  "action": "OPEN_LONG",
  "price": 64500,
  "quantity": 2,
  "realizedPnL": 0,
  "timestamp": "2026-07-19T12:00:00.000Z"
}
```

Actions are `OPEN_LONG`, `CLOSE_LONG`, and `IGNORED`. For `IGNORED`,
`positionId` is `null`, quantity is `0`, and realized PnL is `0`. Ignored
decisions are returned to the caller but are not trade history because no trade
occurred.

## Position lifecycle

```text
No open position
  ├─ BUY  → create OPEN LONG → record OPEN_LONG
  ├─ SELL → IGNORED
  └─ HOLD → IGNORED

OPEN LONG
  ├─ BUY  → IGNORED (one-open-position rule)
  ├─ SELL → mark CLOSED → calculate PnL → record CLOSE_LONG
  └─ HOLD → IGNORED
```

- Position identity is a UUID generated locally.
- Quantity is the strategy's `positionSize`.
- Entry and exit prices are latest cached ticker prices.
- The registry enforces one open position per strategy per workspace.
- No short positions, partial closes, leverage, commissions, or slippage.
- If a strategy symbol changes while a position remains open, the existing
  position is marked using its original symbol to avoid cross-instrument PnL.

## PnL calculation

For a long position:

```text
realizedPnL   = (exitPrice - entryPrice) × quantity
unrealizedPnL = (currentPrice - entryPrice) × quantity
totalPnL      = realizedPnL + unrealizedPnL
```

Values are rounded to eight decimal places to suppress binary floating-point
noise. Portfolio realized PnL is the sum of `CLOSE_LONG` history. Unrealized PnL
marks every open position with one cached ticker per unique symbol.

Portfolio response:

```json
{
  "realizedPnL": 25,
  "unrealizedPnL": 10,
  "totalPnL": 35,
  "openPositions": 1,
  "closedPositions": 1,
  "positions": [
    {
      "positionId": "uuid",
      "strategyId": "strategy-uuid",
      "symbol": "BTCUSDT",
      "quantity": 2,
      "entryPrice": 100,
      "currentPrice": 105,
      "unrealizedPnL": 10
    }
  ],
  "generatedAt": "2026-07-19T12:00:00.000Z"
}
```

## API

All routes require JWT authentication and `X-Workspace-Id`.

| Method | Endpoint                      | Behavior                                              |
| ------ | ----------------------------- | ----------------------------------------------------- |
| POST   | `/v1/paper-trading/execute`   | Evaluate `strategyId` and apply one manual transition |
| GET    | `/v1/paper-trading/positions` | List workspace positions, open and closed             |
| GET    | `/v1/paper-trading/history`   | List executed opens/closes in order                   |
| GET    | `/v1/paper-trading/portfolio` | Mark open positions and return PnL summary            |

The execute body is exactly `{ "strategyId": "..." }`. A missing or
cross-workspace strategy returns 404. Existing Signal Engine and Market Data
errors retain their established HTTP mappings.

## Future real-trading integration

Real trading and durable paper accounting must remain on the RC-16 ownership
boundary, not become a conditional branch inside this module's
`PositionManager`.

1. Keep `SignalResult` as the decision contract.
2. Introduce an execution port whose **foundation** paper implementation can
   delegate to this engine, while durable RC-16 paper and live exchange
   adapters remain separate implementations.
3. Put credentials, exchange order ids, idempotency, reconciliation, fees,
   slippage, and risk approval exclusively behind the durable/live adapters.
4. Require an explicit operator-approved mode switch; never infer real trading
   from strategy configuration.
5. Add durable repositories and event auditing before any real-order path —
   reuse RC-16 rather than duplicating it here.

Automatic Signal Engine → execution scheduling should be a later milestone,
after both manual modules are stable and independently observable.
