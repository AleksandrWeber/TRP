# Trading Platform V1 (US204–US210)

Status: Implemented (RC-1 certification scope)  
Scope: Durable, Prisma-backed trading core (portfolio, position, order, risk) plus
paper and live orchestration layers. All trading mutations flow through the Order
Lifecycle Engine after Risk evaluation; position and portfolio state are updated
only via their public service APIs. Exchange connectivity is I/O-only and never
mutates trading core state directly.

This document is the canonical architecture reference for RC-1. Per-story stub
`041-US204-Portfolio-Engine.md` points here.

## Platform overview

Trading Platform V1 replaces the in-memory US010 / US016 paper paths as the
**registered** trading surface in `AppModule`. Legacy modules
(`modules/paper-trading`, `modules/paper-trading-executor`) may remain in the
repository for historical research virtual fills but are **not** imported by
`AppModule`. The older RC-16 durable modules (`paper-account`, `orders`,
`execution-adapter`, `execution-engine`, `positions`) remain registered for
research and foundation workflows; they are a separate ownership boundary from
Trading Platform V1 (`portfolio-engine`, `position-engine`, `order-engine`,
`risk-engine`, `paper-trading-engine`, `exchange-adapter`, `live-trading-engine`).

### Intended execution flow

```text
Client (Paper / Live / direct Order API)
  ↓ authenticated JWT + X-Workspace-Id
Orchestrator (PaperTradingService | LiveTradingService)  [optional]
  ↓
OrderService.create
  ├─ validate → PENDING candidate
  ├─ RiskService.evaluate  ← mandatory gate (US207)
  └─ submit → PENDING | reject → REJECTED
  ↓
Execution
  ├─ Paper: OrderService.execute + execution-simulator slippage/commission
  └─ Live: ExchangeAdapterService.submitOrder → RecoveryManager.applyExecution
       → OrderService.execute
  ↓
OrderExecutionService
  ├─ PositionService (open | increase | reduce | close)
  └─ PositionService.syncPortfolio → PortfolioService.applyFinancials
```

Exchange Adapter (US209) performs connect/disconnect, market data, and order
submission only. It does **not** write to `portfolios`, `trading_positions`, or
`trading_orders`. Live fills are applied back into the trading core through
`OrderService.execute`, which delegates to `OrderExecutionService`.

### Module map

| Story | Module path            | REST prefix          | Role                                                            |
| ----- | ---------------------- | -------------------- | --------------------------------------------------------------- |
| US204 | `portfolio-engine`     | `/v1/portfolio`      | Financial state (cash, equity, margin, snapshots)               |
| US205 | `position-engine`      | `/v1/positions`      | Position lifecycle (internal mutations; REST read + mark-price) |
| US206 | `order-engine`         | `/v1/trading-orders` | Order lifecycle, fills, history                                 |
| US207 | `risk-engine`          | `/v1/risk`           | Pre-trade policy evaluation                                     |
| US208 | `paper-trading-engine` | `/v1/paper`          | Paper session orchestration via OrderService                    |
| US209 | `exchange-adapter`     | `/v1/exchanges`      | Exchange I/O boundary                                           |
| US210 | `live-trading-engine`  | `/v1/live`           | Live session orchestration, sync, recovery, kill switch         |

### Security (all stories)

- **Authentication:** global `JwtAuthGuard` — every route requires a valid JWT.
- **Authorization:** global `RolesGuard`. Exchange `connect` and `disconnect`
  require `@Roles(Role.Trader, Role.Admin)`. Other trading routes rely on JWT
  plus workspace membership (no additional role decorator).
- **Workspace isolation:** `X-Workspace-Id` header validated via
  `requireWorkspaceId` / `WorkspaceDomainService`.
- **Rate limiting:** global `ThrottlerGuard` (configurable via
  `API_THROTTLE_TTL_MS`, `API_THROTTLE_LIMIT`).

### Prisma migrations (apply in order)

| Migration                               | Story                    |
| --------------------------------------- | ------------------------ |
| `20260720120000_us204_portfolio_engine` | US204                    |
| `20260720130000_us205_position_engine`  | US205                    |
| `20260720140000_us206_order_lifecycle`  | US206                    |
| `20260720150000_us207_risk_engine`      | US207                    |
| `20260720160000_us208_paper_trading`    | US208                    |
| `20260720170000_us209_exchange_adapter` | US209                    |
| `20260720180000_us210_live_trading`     | US210                    |
| `20260720190000_us210_kill_switch`      | US210 kill switch column |

Run `npx prisma migrate deploy` (or project equivalent) before starting the API
in any environment that persists trading state.

---

## US204 — Portfolio Engine

Status: Implemented  
Module: `apps/api/src/modules/portfolio-engine`

### 1. Architecture

```text
GET /v1/portfolio/*
  ↓
PortfolioController
  ↓
PortfolioService                    single source of truth for account financials
  ├─ PortfolioCalculator            balance / equity / margin derivation
  ├─ PortfolioSnapshotService       point-in-time snapshots
  ├─ PortfolioEventPublisher        domain events
  └─ PrismaPortfolioRepository
```

`PortfolioService` owns cash, realized/unrealized PnL, used margin, equity, and
portfolio status. It has **no** exchange, order, position, or execution
dependencies. Position mutations trigger portfolio refresh through
`PositionService.syncPortfolio` → `PortfolioService.applyFinancials`.

Default creation values: currency `USD`, initial cash `100000`
(`DEFAULT_PORTFOLIO_INITIAL_CASH`). One portfolio per workspace
(`portfolios.workspace_id` unique).

Portfolio statuses: `ACTIVE`, `PAUSED`, `ARCHIVED`.

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                  | Behavior                                 |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | `/v1/portfolio`           | Get or create workspace portfolio        |
| GET    | `/v1/portfolio/balance`   | Cash balance view                        |
| GET    | `/v1/portfolio/equity`    | Equity view                              |
| GET    | `/v1/portfolio/margin`    | Margin usage view                        |
| GET    | `/v1/portfolio/snapshots` | List portfolio snapshots                 |
| POST   | `/v1/portfolio/reset`     | Reset to initial cash (development only) |

`POST /reset` returns `403 Forbidden` when `NODE_ENV` is not `development`
(`PORTFOLIO_RESET_FORBIDDEN`).

### 3. Database / Persistence

| Table                 | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `portfolios`          | One row per workspace; financial columns (cash, PnL, margin) |
| `portfolio_snapshots` | Historical equity/margin snapshots                           |
| `portfolio_events`    | Append-only portfolio domain events (JSON payload)           |

Foreign keys cascade on portfolio delete. Decimal columns use `DECIMAL(38,18)`.

### 4. Migration notes

Migration `20260720120000_us204_portfolio_engine` creates the three tables above.
Must run before US205–US210 migrations (downstream FKs reference `portfolios`).

Paper (US208) and live (US210) sessions create **additional** portfolios keyed by
`portfolio_workspace_key` (synthetic workspace id per session), not the user's
primary workspace portfolio row.

### 5. Design decisions

- **Workspace-scoped singleton:** one canonical portfolio per `workspace_id`
  simplifies risk and order scoping for direct API use.
- **Session-isolated portfolios:** paper/live sessions call
  `getOrCreateWithInitialCash(portfolioWorkspaceKey, …)` so simulated and live
  runs do not corrupt the workspace default portfolio.
- **Development-only reset:** production reset would destroy audit history; gated
  by `NODE_ENV`.
- **No REST mutation of financials:** cash and PnL change only through
  `applyFinancials` invoked by Position Engine sync.

### 6. Known limitations

- No multi-currency conversion; single `currency` field per portfolio.
- Snapshots are created on reset and financial transitions but there is no
  scheduled snapshot job in V1.
- Pause/resume/archive transitions exist on `PortfolioService` but are not
  exposed on `PortfolioController` REST surface.

### 7. Deployment notes

- Ensure migration `20260720120000` applied before API traffic.
- Default initial cash is code-defined (`100000` USD); override at session
  creation for paper, not via environment variable.
- Portfolio reset endpoint must not be exposed to production clients; it is
  blocked in code but verify `NODE_ENV=production` in deployed environments.

---

## US205 — Position Engine

Status: Implemented  
Module: `apps/api/src/modules/position-engine`

### 1. Architecture

```text
GET /v1/positions/*  |  PATCH /v1/positions/mark-price
  ↓
PositionController
  ↓
PositionService                     position lifecycle + portfolio sync
  ├─ PositionCalculator             exposure, unrealized PnL, derived metrics
  ├─ PositionHistoryService
  ├─ PositionEventPublisher
  └─ PrismaPositionRepository

OrderExecutionService (US206) ──────► PositionService.open | increase | reduce | close
                                      (not exposed on REST)
```

Position sides: `LONG`, `SHORT`. Statuses include open and closed terminal
states tracked in `domain/position-status.ts`.

REST intentionally does **not** expose `open`, `increase`, `reduce`, or `close`.
The controller comment documents that lifecycle mutations must flow
Order → Risk → Execution → `PositionService`. The only REST mutation is
`PATCH /mark-price` for valuation updates without size/side changes.

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                   | Behavior                                          |
| ------ | -------------------------- | ------------------------------------------------- |
| GET    | `/v1/positions`            | List all positions for workspace portfolio        |
| GET    | `/v1/positions/open`       | List open positions                               |
| GET    | `/v1/positions/history`    | Position history (`?positionId=` optional filter) |
| GET    | `/v1/positions/:id`        | Single position                                   |
| PATCH  | `/v1/positions/mark-price` | Update mark price (`positionId`, `markPrice`)     |

Body for mark-price: `{ "positionId": "…", "markPrice": "…" }`.

### 3. Database / Persistence

| Table               | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `trading_positions` | Position state (symbol, side, qty, prices, PnL) |
| `position_history`  | OPEN, INCREASE, REDUCE, CLOSE actions           |
| `position_events`   | Append-only position domain events              |

FK: `trading_positions.portfolio_id` → `portfolios.id` (CASCADE).

### 4. Migration notes

Migration `20260720130000_us205_position_engine` depends on US204 `portfolios`
table. Table name `trading_positions` avoids collision with RC-16 `positions`
domain.

### 5. Design decisions

- **Closed REST boundary for mutations:** prevents clients from bypassing Risk
  and Order lifecycle.
- **Order-driven fill mapping:** `OrderExecutionService` maps BUY/SELL to
  close-reduce-open logic (including position flips when fill exceeds open qty).
- **Automatic portfolio sync:** every lifecycle mutation calls `syncPortfolio`,
  aggregating realized/unrealized PnL and exposure into `PortfolioService`.

### 6. Known limitations

- Mark-price updates do not trigger exchange market data feeds; caller supplies
  price (paper supplies `marketPrice`; live may use exchange ticker indirectly).
- No hedged/multi-leg position model; one row per symbol/side per portfolio.
- Partial close semantics follow fill quantity from orders; no standalone
  partial-close REST.

### 7. Deployment notes

- Apply migration `20260720130000` after US204.
- Monitor `position_events` growth if event retention policies are added later
  (V1 has no TTL purge).

---

## US206 — Order Lifecycle Engine

Status: Implemented  
Module: `apps/api/src/modules/order-engine`

### 1. Architecture

```text
POST /v1/trading-orders  |  POST …/execute  |  POST …/cancel
  ↓
OrderController                     path `trading-orders` (not `/v1/orders`)
  ↓
OrderService
  ├─ OrderValidator / OrderLifecycleManager
  ├─ RiskService.evaluate           on create (mandatory)
  ├─ OrderExecutionService          fills → PositionService
  ├─ OrderFillService / OrderHistoryService
  └─ PrismaOrderRepository
```

Order statuses: `CREATED`, `VALIDATED`, `PENDING`, `PARTIALLY_FILLED`, `FILLED`,
`CANCELLED`, `EXPIRED`, `REJECTED`.

Order types: `MARKET`, `LIMIT`, `STOP`, `STOP_LIMIT`, `TAKE_PROFIT`. Limit-like
types require `requestedPrice` at creation.

Create flow: validate → persist → risk evaluate → `PENDING` or `REJECTED`.
Execute flow: `OrderExecutionService.execute` (simulated fill; no exchange I/O).

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                         | Behavior                                    |
| ------ | -------------------------------- | ------------------------------------------- |
| GET    | `/v1/trading-orders`             | List orders                                 |
| GET    | `/v1/trading-orders/open`        | List open orders                            |
| GET    | `/v1/trading-orders/history`     | Order status history (`?orderId=` optional) |
| GET    | `/v1/trading-orders/:id`         | Get order                                   |
| GET    | `/v1/trading-orders/:id/fills`   | List fills for order                        |
| POST   | `/v1/trading-orders`             | Create order (runs risk gate)               |
| POST   | `/v1/trading-orders/:id/cancel`  | Cancel open order                           |
| POST   | `/v1/trading-orders/:id/execute` | Apply simulated fill                        |
| PATCH  | `/v1/trading-orders/:id`         | Update quantity/price/TIF while mutable     |

Create body fields: `symbol`, `side`, `type`, `quantity`, optional
`requestedPrice`, optional `timeInForce`.

Execute body: `price` (required), optional `quantity`, optional `fee`.

### 3. Database / Persistence

| Table            | Purpose                         |
| ---------------- | ------------------------------- |
| `trading_orders` | Order aggregate                 |
| `order_fills`    | Individual fill records         |
| `order_history`  | Status transition audit         |
| `order_events`   | Append-only order domain events |

FK: `trading_orders.portfolio_id` → `portfolios.id`.

### 4. Migration notes

Migration `20260720140000_us206_order_lifecycle` requires US204. The REST path
`/v1/trading-orders` deliberately avoids collision with RC-16
`OrdersController` at `/v1/orders`.

### 5. Design decisions

- **Risk on create only:** re-submission on execute is not re-evaluated in V1;
  rejected orders never reach `PENDING`.
- **Simulated execution in core:** `OrderExecutionService` has no exchange
  dependency; live layer applies exchange fills by calling `execute` with
  observed price/qty.
- **Event-rich lifecycle:** every transition publishes typed order events for
  downstream observability.

### 6. Known limitations

- No native exchange order id on `trading_orders` row; live correlation uses
  client order id prefix `live-{orderId}` and session execution dedupe tables.
- Stop/take-profit types are modeled but triggering logic is not a background
  worker in V1 (manual execute or orchestrator-driven).
- Partial fills supported; no REST for amend on exchange in core.

### 7. Deployment notes

- Apply migration `20260720140000` after US204–US205.
- Direct `POST …/execute` is intended for paper simulation and recovery replay;
  production live clients should prefer `/v1/live/orders` orchestration.

---

## US207 — Risk Engine

Status: Implemented  
Module: `apps/api/src/modules/risk-engine`

### 1. Architecture

```text
POST /v1/risk/evaluate  (also invoked internally by OrderService.create)
  ↓
RiskController
  ↓
RiskService
  ├─ RiskEvaluator / RiskPolicyEngine
  ├─ ExposureCalculator / MarginValidator / PositionLimitValidator
  ├─ reads PortfolioService + PositionService (read-only)
  └─ PrismaRiskRepository
```

Risk Engine **never** executes orders and **never** mutates portfolio, position,
or order tables. It records decisions and publishes events.

Default system policies (seeded on first evaluate):

| Policy               | Purpose                        |
| -------------------- | ------------------------------ |
| `portfolio_balance`  | Sufficient cash for order      |
| `position_size`      | Max quantity / notional        |
| `exposure`           | Max exposure percent           |
| `margin`             | Margin rate validation         |
| `max_open_positions` | Cap open position count        |
| `duplicate_orders`   | Duplicate open order detection |
| `daily_loss`         | Daily loss limit               |

Decision types: `APPROVED`, `REJECTED` (see `domain/risk-decision-type.ts`).

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                | Behavior                                        |
| ------ | ----------------------- | ----------------------------------------------- |
| POST   | `/v1/risk/evaluate`     | Evaluate hypothetical or existing order context |
| GET    | `/v1/risk/history`      | Evaluation history                              |
| GET    | `/v1/risk/decisions`    | Stored decisions                                |
| GET    | `/v1/risk/policies`     | List policies                                   |
| GET    | `/v1/risk/summary`      | Exposure/margin summary                         |
| PATCH  | `/v1/risk/policies/:id` | Update enabled/priority/configuration           |

Evaluate body: `orderId`, `symbol`, `side`, `type`, `quantity`, optional
`requestedPrice`, optional `referencePrice`.

### 3. Database / Persistence

| Table                    | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `trading_risk_decisions` | Per-evaluation decision record                          |
| `trading_risk_policies`  | Global (`portfolio_id` null) and per-portfolio policies |
| `trading_risk_events`    | Risk domain events                                      |

### 4. Migration notes

Migration `20260720150000_us207_risk_engine` FKs decisions to `portfolios`.
Default policies are inserted at runtime by `RiskService.ensureDefaultPolicies`,
not by SQL seed.

Distinct from legacy RC-16 `modules/risk` (paper risk decisions); path `/v1/risk`
is Trading Platform V1.

### 5. Design decisions

- **Mandatory gate in OrderService:** clients cannot skip risk by calling
  PositionService directly through REST (mutations not exposed).
- **Read-only context assembly:** evaluator pulls live portfolio and open
  positions for each evaluation.
- **Configurable policies:** PATCH allows tuning limits without redeploy.

### 6. Known limitations

- No per-symbol policy overrides in default seed; customization via JSON
  `configuration` only.
- Evaluate endpoint exposed for diagnostics; production flow relies on implicit
  evaluate-on-create.
- Daily loss policy depends on portfolio PnL snapshot semantics in V1 (no
  external calendar reset job documented).

### 7. Deployment notes

- Apply migration `20260720150000` after US204.
- Review default policy thresholds (`maxDailyLoss: 100000`, etc.) before
  production; adjust via `/v1/risk/policies/:id` or future seed tooling.

---

## US208 — Paper Trading Engine

Status: Implemented (canonical paper path for Trading Platform V1)  
Module: `apps/api/src/modules/paper-trading-engine`

Legacy note: US010 (`/v1/paper-trading`, in-memory) and US016 (Paper Trading
Executor) are **not** registered in `AppModule`. US208 is the durable,
orchestrated paper path at `/v1/paper`.

### 1. Architecture

```text
POST /v1/paper/sessions/:id/orders
  ↓
PaperTradingController
  ↓
PaperTradingService
  ↓
PaperExecutionCoordinator
  ├─ PaperSessionManager            session lifecycle + isolated portfolio
  ├─ OrderService.create            → Risk.evaluate inside
  ├─ execution-simulator            slippage + commission
  ├─ OrderService.execute           → OrderExecutionService → Position → Portfolio
  └─ PaperTradingRepository         session executions + events
```

Session statuses: `CREATED`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`,
`ARCHIVED`. Trades require `RUNNING` session and matching `ownerId`.

Each session owns a dedicated portfolio via `portfolio_workspace_key`
(`paper-session-{sessionId}` pattern in domain).

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                            | Behavior                                           |
| ------ | ----------------------------------- | -------------------------------------------------- |
| GET    | `/v1/paper/sessions`                | List sessions                                      |
| GET    | `/v1/paper/sessions/:id`            | Get session                                        |
| POST   | `/v1/paper/sessions`                | Create session (`name`, optional `initialBalance`) |
| POST   | `/v1/paper/sessions/:id/start`      | Start session                                      |
| POST   | `/v1/paper/sessions/:id/pause`      | Pause                                              |
| POST   | `/v1/paper/sessions/:id/stop`       | Stop                                               |
| POST   | `/v1/paper/sessions/:id/complete`   | Complete                                           |
| DELETE | `/v1/paper/sessions/:id`            | Delete session                                     |
| POST   | `/v1/paper/sessions/:id/orders`     | Execute paper trade                                |
| GET    | `/v1/paper/sessions/:id/orders`     | List session orders (via trading core)             |
| GET    | `/v1/paper/sessions/:id/positions`  | Positions for session portfolio                    |
| GET    | `/v1/paper/sessions/:id/portfolio`  | Portfolio for session                              |
| GET    | `/v1/paper/sessions/:id/executions` | Paper execution records                            |
| GET    | `/v1/paper/sessions/:id/events`     | Session events                                     |
| GET    | `/v1/paper/sessions/:id/statistics` | Session statistics                                 |

Trade body: order fields plus optional `marketPrice` (required for MARKET-style
fill if no `requestedPrice`). Default execution policy: no partial fill, zero
slippage, zero commission (overridable in coordinator for tests).

### 3. Database / Persistence

| Table                      | Purpose                                        |
| -------------------------- | ---------------------------------------------- |
| `paper_trading_sessions`   | Session metadata + portfolio linkage           |
| `paper_trading_executions` | Simulated fill metadata (slippage, commission) |
| `paper_trading_events`     | Session event log                              |

Unique: `portfolio_id`, `portfolio_workspace_key` per session.

### 4. Migration notes

Migration `20260720160000_us208_paper_trading` FKs sessions to `portfolios`.
Apply after US204–US207.

### 5. Design decisions

- **Orchestrate, don't duplicate:** paper never writes positions/portfolios
  directly; all mutations go through OrderService.
- **Isolated portfolio per session:** prevents cross-session contamination.
- **execution-simulator boundary:** slippage/commission applied before
  `OrderService.execute`, keeping core fill logic exchange-agnostic.

### 6. Known limitations

- No automatic link to Signal Engine / Evaluation Scheduler in V1; trades are
  manual POST per session.
- Default simulator uses deterministic slippage, not historical order book.
- Session delete cascades portfolio data; no soft-archive REST beyond
  `complete` / status transitions.

### 7. Deployment notes

- Apply migration `20260720160000`.
- Default session initial balance `100000` when omitted (matches portfolio
  default).
- Do not mount US010 routes in production expecting US208 persistence; paths
  differ (`/v1/paper-trading` vs `/v1/paper`).

---

## US209 — Exchange Adapter

Status: Implemented  
Module: `apps/api/src/modules/exchange-adapter`

### 1. Architecture

```text
GET|POST /v1/exchanges/*
  ↓
ExchangeAdapterController
  ↓
ExchangeAdapterService
  ↓
ExchangeManager
  ├─ ExchangeRegistry / ExchangeFactory / ExchangeRouter
  ├─ Venue adapters (BINANCE, BYBIT, OKX) — stub live I/O
  ├─ MockExchangeAdapter (MOCK) — full in-process simulation
  └─ PrismaExchangeAdapterRepository   connection persistence
```

Registered exchange ids: `MOCK`, `BINANCE`, `BYBIT`, `OKX`
(`ExchangeFactory.ensureAllRegistered`).

Exchange Adapter is **I/O only**:

- Connect/disconnect/ping, capabilities, market price, order submit/cancel
  (venue-dependent).
- Persists connection state and exchange events.
- Does **not** import Portfolio, Position, Order, or Risk modules.

Venue adapters (`VenueExchangeAdapter`) simulate connect and declare
capabilities; live order submission on BINANCE/BYBIT/OKX throws until wired with
credentials and network I/O. `MockExchangeAdapter` supports full local order/fill
flows for integration tests.

### 2. API

JWT and `X-Workspace-Id` on all routes. Role-gated routes noted.

| Method | Endpoint                         | Roles             | Behavior                                     |
| ------ | -------------------------------- | ----------------- | -------------------------------------------- |
| GET    | `/v1/exchanges`                  | any authenticated | List exchanges + connection                  |
| GET    | `/v1/exchanges/status`           | any               | Aggregate connection status                  |
| GET    | `/v1/exchanges/:id`              | any               | Single exchange view                         |
| GET    | `/v1/exchanges/:id/capabilities` | any               | Capability flags                             |
| POST   | `/v1/exchanges/connect`          | **Trader, Admin** | Connect (`exchangeId`)                       |
| POST   | `/v1/exchanges/disconnect`       | **Trader, Admin** | Disconnect (`exchangeId`, optional `reason`) |

Programmatic methods on `ExchangeAdapterService` (used by live engine, not all
exposed on REST): `submitOrder`, `cancelOrder`, `getMarketPrice`, `getBalances`,
`getPositions`, etc.

### 3. Database / Persistence

| Table                  | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `exchange_connections` | Per workspace + exchange connection state |
| `exchange_events`      | Connection/order/market events            |

Unique: `(workspace_id, exchange_id)`.

### 4. Migration notes

Migration `20260720170000_us209_exchange_adapter` is independent of trading
orders/positions but should be applied before live trading sessions connect
persisted state.

### 5. Design decisions

- **Strict boundary:** trading core never imports exchange SDKs; only adapter
  module does.
- **MOCK for CI/local:** enables live orchestration tests without credentials.
- **Role-gated connect:** limits who can establish exchange sessions in shared
  workspaces.

### 6. Known limitations

- BINANCE/BYBIT/OKX adapters are capability stubs; real REST/WebSocket I/O not
  implemented in V1 venue classes.
- No encrypted credential vault in adapter tables; connection is simulated or
  environment-driven outside this schema.
- Exchange adapter does not reconcile trading core positions with exchange
  positions automatically (live sync is US210 `SynchronizationManager`).

### 7. Deployment notes

- Apply migration `20260720170000`.
- Use `MOCK` exchange for staging without external dependencies.
- Grant Trader or Admin role to operators who must call connect/disconnect.

---

## US210 — Live Trading + Kill Switch

Status: Implemented  
Module: `apps/api/src/modules/live-trading-engine`

### 1. Architecture

```text
POST /v1/live/orders  |  POST /v1/live/start  |  POST /v1/live/kill-switch
  ↓
LiveTradingController
  ↓
LiveTradingService
  ├─ LiveSessionManager              session + isolated portfolio
  ├─ ConnectionSupervisor            exchange connectivity
  ├─ LiveExecutionCoordinator        Order → Risk → Exchange → Recovery
  ├─ RecoveryManager                 dedupe + replay executions
  ├─ SynchronizationManager          balance/position sync logs
  ├─ EmergencyManager                kill switch (exchange-independent)
  └─ HealthMonitor                   latency / heartbeat metrics
```

Live session statuses: `CREATED`, `CONNECTING`, `CONNECTED`, `RUNNING`, `PAUSED`,
`RECONNECTING`, `STOPPED`, `FAILED`, `ARCHIVED`.

Kill switch sequence (`EmergencyManager`):

1. Freeze trading (`trading_frozen = true`) — blocks new orders immediately.
2. Cancel all open orders via `OrderService.cancel` (best effort).
3. Emit strategy-disabled signal (operational flag via freeze + event).
4. Optionally close all open positions via `PositionService.close` (default
   `closePositions: true`).

Kill switch does **not** require exchange connectivity.

### 2. API

All routes require JWT and `X-Workspace-Id`.

| Method | Endpoint                          | Behavior                                                      |
| ------ | --------------------------------- | ------------------------------------------------------------- |
| GET    | `/v1/live/sessions`               | List live sessions                                            |
| GET    | `/v1/live/status`                 | Workspace live status summary                                 |
| GET    | `/v1/live/health`                 | Health metrics                                                |
| GET    | `/v1/live/synchronization`        | Sync logs + sessions                                          |
| POST   | `/v1/live/start`                  | Start session (`exchange`, `accountId`, optional `sessionId`) |
| POST   | `/v1/live/stop`                   | Stop session                                                  |
| POST   | `/v1/live/pause`                  | Pause                                                         |
| POST   | `/v1/live/resume`                 | Resume                                                        |
| POST   | `/v1/live/reconnect`              | Reconnect session                                             |
| POST   | `/v1/live/synchronize`            | Run synchronization                                           |
| POST   | `/v1/live/orders`                 | Submit live order (`sessionId` + order fields)                |
| GET    | `/v1/live/sessions/:id/orders`    | Orders for session portfolio                                  |
| GET    | `/v1/live/sessions/:id/positions` | Positions                                                     |
| GET    | `/v1/live/sessions/:id/portfolio` | Portfolio                                                     |
| GET    | `/v1/live/sessions/:id/events`    | Events                                                        |
| POST   | `/v1/live/kill-switch`            | Activate kill switch                                          |
| POST   | `/v1/live/kill-switch/clear`      | Clear trading freeze                                          |

Kill switch body: `sessionId`, optional `closePositions` (default true), optional
`reason`.

Live order flow blocked when `tradingFrozen` is true on session.

### 3. Database / Persistence

| Table                               | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `live_trading_sessions`             | Session state incl. `trading_frozen` (kill switch) |
| `live_trading_events`               | Live session event log                             |
| `live_trading_synchronization_logs` | Sync/recovery/kill-switch audit                    |
| `live_trading_processed_executions` | Idempotent execution replay dedupe                 |

Migrations:

- `20260720180000_us210_live_trading` — core live tables
- `20260720190000_us210_kill_switch` — adds `trading_frozen BOOLEAN DEFAULT false`

### 4. Migration notes

Apply US204–US209 before US210 migrations. Kill switch migration is additive
(`ALTER TABLE`) and safe on existing live session rows (defaults to not frozen).

### 5. Design decisions

- **Same trading core as paper:** live and paper share Order/Risk/Position/
  Portfolio engines; only execution source differs (exchange vs simulator).
- **Recovery idempotency:** `live_trading_processed_executions` prevents duplicate
  fill application on reconnect.
- **Kill switch independence:** cancels/closes via trading core without waiting
  for exchange ACK.

### 6. Known limitations

- Live venue adapters for BINANCE/BYBIT/OKX remain stubs; production live I/O
  requires MOCK or future venue implementation work.
- Kill switch position closes use mark/average entry price, not guaranteed exchange
  market fills.
- No automatic strategy scheduler integration in V1 live path.
- Single active session constraints enforced in session manager but not globally
  across workspaces in REST documentation.

### 7. Deployment notes

- Apply both US210 migrations before enabling live endpoints.
- Test kill switch in staging with MOCK exchange connected.
- Monitor `live_trading_synchronization_logs` for `KILL_SWITCH` and `RECOVERY`
  kinds during incidents.
- Ensure operators know `kill-switch/clear` only removes freeze; it does not
  reverse closed positions or cancelled orders.

---

## Cross-cutting: overall architecture

Trading Platform V1 is a **layered modular monolith**:

```text
┌─────────────────────────────────────────────────────────┐
│  Orchestration: paper-trading-engine | live-trading-engine │
├─────────────────────────────────────────────────────────┤
│  Trading Core: order-engine → risk-engine (gate)         │
│                order-execution → position-engine         │
│                → portfolio-engine                        │
├─────────────────────────────────────────────────────────┤
│  I/O: exchange-adapter (MOCK | BINANCE | BYBIT | OKX)    │
├─────────────────────────────────────────────────────────┤
│  Persistence: Prisma / PostgreSQL (US204–US210 tables)   │
└─────────────────────────────────────────────────────────┘
```

Event publishers in each module write append-only `*_events` tables for audit;
there is no cross-module direct repository access—only public Nest service APIs.

## Cross-cutting: overall API index

| Prefix               | Story | Auth                                      | Notes                  |
| -------------------- | ----- | ----------------------------------------- | ---------------------- |
| `/v1/portfolio`      | US204 | JWT + workspace                           | dev-only reset         |
| `/v1/positions`      | US205 | JWT + workspace                           | read + mark-price only |
| `/v1/trading-orders` | US206 | JWT + workspace                           | risk on create         |
| `/v1/risk`           | US207 | JWT + workspace                           | no mutations to core   |
| `/v1/paper`          | US208 | JWT + workspace                           | canonical paper        |
| `/v1/exchanges`      | US209 | JWT + workspace; Trader/Admin for connect | I/O only               |
| `/v1/live`           | US210 | JWT + workspace                           | kill switch            |

Version prefix `/v1` enforced by Nest URI versioning on controllers.

## Cross-cutting: deployment checklist

1. Run all eight migrations US204–US210 in timestamp order.
2. Configure PostgreSQL connection for Prisma (`DATABASE_URL`).
3. Set `NODE_ENV=production` to disable portfolio reset.
4. Configure JWT secrets per `AuthModule` / existing RC-16 baseline.
5. Assign Trader or Admin roles for exchange operators.
6. Prefer MOCK exchange in non-production live/paper integration tests.
7. Verify health module reports migration status (`prisma-migration-check`) on
   startup if enabled in deployment profile.

## Cross-cutting: known limitations (V1)

- Venue exchange adapters declare capabilities but do not perform production
  network trading without further implementation.
- US010/US016 paper paths are not AppModule-registered; documentation and clients
  must target `/v1/paper` (US208).
- RC-16 and Trading Platform V1 coexist; duplicate concepts (`/v1/orders` vs
  `/v1/trading-orders`, legacy `positions` vs `trading_positions`) require
  client discipline.
- No unified UI for Trading Platform V1 in this documentation scope.
- Background workers for stop orders, scheduled risk reset, and automatic signal
  → trade execution are out of scope for US204–US210 V1.

## Relationship to other documentation

- RC-16 foundation: `022-RC-16-Foundation-Baseline.md` (auth, workspace).
- Legacy in-memory paper: `030-US010-Paper-Trading-Engine.md` (not AppModule).
- Legacy executor: `037-US016-Paper-Trading-Executor.md` (not AppModule).
- Deployment baseline: `019-Deployment.md`.
- API conventions: `016 API Architecture.md`.
