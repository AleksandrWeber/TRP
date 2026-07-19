# US007 — Binance Market Data Provider

Status: Implemented  
Scope: Live Binance Spot integration behind the existing `MarketDataProvider`
port (US006). Public REST only — no API key, no WebSocket, no polling, no
frontend changes. The Market Data Domain (models, port, registry, controller)
is unchanged; the provider plugs in behind it and is activated by
configuration.

## Architecture

```text
HTTP consumer (authenticated)
  ↓
MarketDataDomainController (/v1/market)          — unchanged (US006)
  ↓
MarketDataProviderRegistry (single active provider)
  ↓ MarketDataProvider port (interface only, unchanged)
  ├─ MockMarketDataProvider      ('mock', deterministic — US006)
  └─ BinanceMarketDataProvider   ('binance', live Spot REST — US007)
        ↓ https://api.binance.com (public endpoints)
```

The controller and every other consumer resolve the active provider through
the registry; nothing outside `providers/binance-market-data-provider.ts`
knows Binance exists.

## Provider implementation

`providers/binance-market-data-provider.ts` —
`BinanceMarketDataProvider implements MarketDataProvider`, id `binance`.

| Port method            | Binance Spot endpoint      | Mapping                                         |
| ---------------------- | -------------------------- | ----------------------------------------------- |
| `getTicker(symbol)`    | `GET /api/v3/ticker/price` | `price` string → number, timestamp = fetch time |
| `getCandles(s, tf, n)` | `GET /api/v3/klines`       | kline tuple → `Candle` via `createCandle`       |
| `health()`             | `GET /api/v3/ping`         | reachability + latency → `ok/degraded/down`     |

Details:

- **Timeframes** — every domain `Timeframe` maps 1:1 onto a Binance interval
  through an explicit record (`1m 5m 15m 1h 4h 1d`). An unmapped value fails
  as `UNSUPPORTED_TIMEFRAME` before any network call.
- **Candle times** — Binance reports an inclusive close (`open + tf − 1ms`);
  the domain convention is an exclusive bucket end, so `closeTime` is computed
  as `openTime + timeframeToMillis(tf)`. Consecutive candles stay contiguous.
- **Domain factories as gate** — every mapped payload passes through
  `createTicker` / `createCandle`. A payload violating OHLCV invariants can
  never hydrate a domain object; it surfaces as `PROVIDER_UNAVAILABLE`
  ("response violates contract").
- **Symbols** — validated upfront against the canonical `^[A-Z0-9]+$` format;
  a symbol Binance rejects (error code `-1121`) becomes
  `UNSUPPORTED_SYMBOL`.
- **Options** — `baseUrl`, `timeoutMs` (default 5000ms), and `fetchFn` are
  injectable, which keeps the unit tests network-free.
- **Health** — ping success within 2s → `ok` (detail includes latency),
  slower → `degraded`, failure/timeout → `down`. `health()` never throws.

## Configuration

`market-data-provider.config.ts` + `MarketDataDomainModule`:

- Environment variable: `MARKET_DATA_PROVIDER` = `mock` (default) | `binance`.
- The module factory registers **both** providers in the registry, then calls
  `registry.setActive(resolveMarketDataProviderId(...))` with the value from
  `ConfigService` (global `ConfigModule`, `.env` / `apps/api/.env`).
- Unset or blank → `mock`. Unknown value (e.g. a typo) → bootstrap fails fast
  with the list of registered ids, so a misconfiguration can never silently
  serve mock data.
- Consumers are untouched: the controller still depends only on the registry,
  and the `MARKET_DATA_PROVIDER` DI token still resolves `registry.getActive()`.

`.env.example` documents the variable with the `mock` default.

## Error handling

`domain/market-data-domain.error.ts` defines the domain error boundary:

| Error                                | Code                    | HTTP |
| ------------------------------------ | ----------------------- | ---- |
| `UnsupportedMarketSymbolError`       | `UNSUPPORTED_SYMBOL`    | 400  |
| `UnsupportedMarketTimeframeError`    | `UNSUPPORTED_TIMEFRAME` | 400  |
| `MarketDataProviderUnavailableError` | `PROVIDER_UNAVAILABLE`  | 502  |
| `MarketDataProviderTimeoutError`     | `PROVIDER_TIMEOUT`      | 504  |

Provider failures are converted at the source:

- HTTP 4xx with Binance error code `-1121` / `-1120` → unsupported
  symbol / timeframe.
- HTTP 418/429 (rate limit / IP ban) and any other non-2xx →
  `PROVIDER_UNAVAILABLE` (detail carries only the HTTP status, never the
  Binance payload).
- `AbortSignal.timeout` abort → `PROVIDER_TIMEOUT`.
- Network errors → `PROVIDER_UNAVAILABLE` ("network request failed" — raw
  socket errors are not leaked).
- Malformed JSON / unexpected payload shape / invariant-violating values →
  `PROVIDER_UNAVAILABLE`.

`MarketDataDomainErrorFilter` (registered via `APP_FILTER` in
`MarketDataDomainModule`, same pattern as the validation filter) maps
`MarketDataDomainError` onto the HTTP statuses above with body
`{ statusCode, code, message }`. It catches only domain errors; all other
exceptions keep their existing behavior. Request validation (DTOs) still
rejects malformed input with 400 before any provider is reached.

## Request flow

```text
GET /v1/market/candles?symbol=BTCUSDT&timeframe=1h&limit=100
  → JwtAuthGuard (global)
  → ValidationPipe → MarketCandlesQueryDto
  → MarketDataDomainController.candles
  → MarketDataProviderRegistry.getActive()          // 'binance' via env
  → BinanceMarketDataProvider.getCandles
      → GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100
      → kline tuples → createCandle (invariant gate, exclusive closeTime)
      → on failure: MarketDataDomainError
  → Candle[] JSON response (domain model shape)
      or MarketDataDomainErrorFilter → 400 / 502 / 504
```

## Frontend

No frontend changes. No page, chart, polling, or WebSocket. The Shared API
Client is untouched.

## Testing

- `binance-market-data-provider.spec.ts` — mapping, timeframe/interval table,
  symbol pre-validation, Binance error codes, HTTP failures, rate limits,
  timeout, malformed JSON, invariant-violating klines, health states,
  custom base URL (all via injected `fetchFn`, no network).
- `market-data-provider.config.spec.ts` — default, case-insensitivity,
  fail-fast on unknown ids.
- `market-data-domain.module.spec.ts` — Nest DI: both providers registered,
  env-driven activation, bootstrap failure on typo.
- `market-data-domain-error.filter.spec.ts` — status mapping and body shape.

## Future WebSocket integration

A later milestone can add streaming without touching the domain:

1. Extend the port (or add a sibling `MarketDataStream` port) with
   `subscribeTicker` / `subscribeCandles`; REST methods stay as the snapshot
   path.
2. `BinanceMarketDataProvider` adds a `wss://stream.binance.com` client that
   feeds the same `createTicker` / `createCandle` factories, so the invariant
   gate and error boundary stay identical.
3. Reconnection/backoff live inside the provider; `health()` extends
   naturally (`degraded` when the stream is down but REST is up).
4. Consumers keep resolving the same registry — mock gains a deterministic
   stream for tests, Bybit/OKX follow the same shape.
