# US006 — Market Data Domain

Status: Implemented  
Scope: Provider-agnostic Market Data Domain for current-market reads. Mock
provider only — no exchange integration, no WebSocket, no polling, no signal
generation, no paper trading.

## Domain architecture

```text
HTTP consumer (authenticated)
  ↓
MarketDataDomainController (/v1/market)
  ├─ GET /v1/market/health
  ├─ GET /v1/market/ticker/:symbol
  └─ GET /v1/market/candles?symbol&timeframe&limit
  ↓
MarketDataProviderRegistry (single active provider)
  ↓ MarketDataProvider port (interface only)
MockMarketDataProvider (deterministic, in-process)
```

Module: `apps/api/src/modules/market-data-domain/` (`MarketDataDomainModule`).

The module is fully independent: it imports no Strategy, Workspace, Auth,
Prisma, or live-market module. It is deliberately distinct from two
pre-existing modules with similar names:

- `modules/market-data` (`MarketDataModule`, US115) — historical OHLCV bar
  storage for research.
- `modules/market-data-provider` (`MarketDataProviderModule`, US117) —
  pluggable **historical** dataset sources for backtesting.

US006 covers **current** market reads (ticker / recent candles / provider
health) and is the abstraction future live providers implement.

## Domain models

- **`Timeframe`** (`domain/timeframe.ts`) — re-exports the canonical
  `Timeframe` enum (US115): `1m | 5m | 15m | 1h | 4h | 1d`. One source of
  truth; the domain adds `timeframeToMillis` for bucket arithmetic.
- **`Candle`** (`domain/candle.ts`) — `symbol`, `timeframe`, `openTime`,
  `closeTime` (ISO-8601, `closeTime = openTime + timeframe`), `open`, `high`,
  `low`, `close`, `volume`. The `createCandle` factory enforces OHLCV
  invariants (`high >= max(open, close)`, `low <= min(open, close)`, positive
  prices, non-negative volume, valid time window) so a misbehaving provider
  can never hydrate an invalid domain object.
- **`Ticker`** (`domain/ticker.ts`) — `symbol`, `price`, `timestamp`
  (ISO-8601), validated by `createTicker`.

Symbols are canonical uppercase alphanumerics (`BTCUSDT`), matching the
Strategy Domain's `tradingPair` format.

## Provider abstraction

`ports/market-data-provider.ts` defines the only contract consumers may use:

```text
interface MarketDataProvider {
  readonly id: string;                    // 'mock' | 'binance' | 'bybit' | 'okx'
  getTicker(symbol): Promise<Ticker>
  getCandles(symbol, timeframe, limit): Promise<Candle[]>
  health(): Promise<MarketDataProviderHealth>
}
```

`MarketDataProviderHealth` reports `providerId`, `status`
(`ok | degraded | down`), and a human-readable `detail`. Provider-specific
payloads never cross the port boundary — every implementation must map its
responses into the domain models above.

### Provider registry

`MarketDataProviderRegistry` (`ports/market-data-provider-registry.ts`) owns
the provider inventory:

- `register(provider)` — ids must be unique and non-empty; the first
  registration becomes active.
- `setActive(id)` / `getActive()` — exactly one provider serves traffic.
- `list()` — registered ids, exposed by the health endpoint.

No provider-specific logic exists outside the provider implementation.

### Mock provider

`MockMarketDataProvider` (`providers/mock-market-data-provider.ts`) is a pure
function of the request: no I/O, no randomness, no clock reads. Identical
requests always return identical data.

- All series are anchored at the fixed constant
  `MOCK_SERIES_ANCHOR_ISO = 2026-01-01T00:00:00.000Z`.
- Values derive from an FNV-1a hash of `symbol:timeframe:bucket` seeds; the
  per-symbol base price and every OHLCV value are deterministic.
- Candle buckets are contiguous and end exactly at the anchor.
- Output passes through the validating domain factories, so mock data always
  satisfies OHLCV invariants.

## Dependency Injection

`MarketDataDomainModule` wires everything through Nest DI:

- `MarketDataProviderRegistry` is provided by a factory that registers the
  mock provider — swapping in Binance later means registering another
  implementation here (or via configuration), nothing else changes.
- The `MARKET_DATA_PROVIDER` symbol token resolves to
  `registry.getActive()`, letting future consumers inject the active provider
  as a plain `MarketDataProvider` interface.
- `MarketDataDomainController` depends only on the registry; it never
  references an implementation class.

## API

All routes are versioned (`/v1`) and covered by the global JWT guard, like
every other domain endpoint. Market data is global — no `X-Workspace-Id`.

| Endpoint                        | Query/Params                                                          | Response                                                |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| `GET /v1/market/health`         | —                                                                     | provider health + registered provider ids + `checkedAt` |
| `GET /v1/market/ticker/:symbol` | `symbol` (uppercase alphanumeric)                                     | `Ticker`                                                |
| `GET /v1/market/candles`        | `symbol`, `timeframe` (enum), `limit` (optional, 1–1000, default 100) | `Candle[]`                                              |

Request validation uses class-validator DTOs (`MarketSymbolParamDto`,
`MarketCandlesQueryDto`) registered in `src/validation`, enforced by the
global validation pipe (whitelist + forbid unknown fields).

## Data flow

```text
GET /v1/market/candles?symbol=BTCUSDT&timeframe=1h&limit=100
  → JwtAuthGuard (global)
  → ValidationPipe → MarketCandlesQueryDto
  → MarketDataDomainController.candles
  → MarketDataProviderRegistry.getActive()      // 'mock'
  → MarketDataProvider.getCandles(...)           // port
  → MockMarketDataProvider                       // deterministic series
  → createCandle(...) domain factory             // invariant gate
  → Candle[] JSON response (domain model shape)
```

## Frontend

No frontend changes. No page, chart, visualization, polling, or WebSocket.
The Shared API Client is untouched.

## Future Binance integration

The next milestone replaces the mock without touching consumers:

1. Implement `BinanceMarketDataProvider implements MarketDataProvider`
   inside `providers/` (REST klines / ticker mapped into `Candle` /
   `Ticker` via the validating factories).
2. Register it in the `MarketDataDomainModule` factory and activate it
   (`registry.setActive('binance')`), ideally driven by configuration
   (e.g. `MARKET_DATA_PROVIDER=binance`).
3. `health()` maps exchange reachability into
   `ok | degraded | down` — the endpoint contract is unchanged.
4. Bybit / OKX follow the same pattern; the registry, controller, domain
   models, and API consumers stay untouched.

The legacy `modules/market/binance.client.ts` (historical klines for
datasets/production) is unrelated and will not be reused for this port.
