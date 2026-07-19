# US008 — Market Data Cache

Status: Implemented  
Scope: Provider-independent in-memory TTL cache between the Market Data
Domain controller (US006) and the active `MarketDataProvider` (mock / Binance,
US007). Read-through only — no WebSocket, no streaming, no database
persistence, no signal generation, no frontend changes. Provider
implementations are unchanged.

## Cache architecture

```text
HTTP consumer (authenticated)
  ↓
MarketDataDomainController (/v1/market)        — consumes the Cache Service
  ↓
MarketDataCacheService (read-through)          — modules/market-data-cache (US008)
  ├─ MarketDataCacheRegistry                   — named caches: 'ticker', 'candles'
  │    ├─ MarketDataCache('ticker',  TTL 5s)   — key ticker:<symbol>
  │    └─ MarketDataCache('candles', TTL 60s)  — key candles:<symbol>:<timeframe>:<limit>
  ↓ on miss (loader callback)
MarketDataProviderRegistry.getActive()         — unchanged (US006/US007)
  ↓ MarketDataProvider port
  ├─ MockMarketDataProvider    ('mock')        — unchanged
  └─ BinanceMarketDataProvider ('binance')     — unchanged
```

`modules/market-data-cache` is an independent Nest module:

| Piece                      | File                            | Responsibility                                                       |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `MarketDataCache<T>`       | `market-data-cache.ts`          | Pure TTL map: get/set, absolute expiry, per-cache hit/miss counters  |
| `MarketDataCacheRegistry`  | `market-data-cache-registry.ts` | Named cache inventory + aggregated per-cache metrics                 |
| `MarketDataCacheService`   | `market-data-cache.service.ts`  | Read-through orchestration, key format, provider-call counter, stats |
| `MARKET_DATA_CACHE_CONFIG` | `market-data-cache.config.ts`   | Env parsing (enabled + TTLs), fail-fast validation at bootstrap      |
| `MarketDataCacheModule`    | `market-data-cache.module.ts`   | DI wiring; exports service, registry, and config token               |

Dependency direction: the cache module imports only the domain **types**
(`Ticker`, `Candle`, `Timeframe`) — never the provider port, the provider
registry, or an implementation. The provider is reached exclusively through
the loader callback supplied by the controller, so the cache can never know
(or care) which provider serves the data. `MarketDataDomainModule` imports
`MarketDataCacheModule`; the reverse dependency does not exist.

## Data flow

```text
GET /v1/market/ticker/BTCUSDT
  → JwtAuthGuard (global) → ValidationPipe (DTO)
  → MarketDataDomainController.ticker
  → MarketDataCacheService.getTicker('BTCUSDT', loader)
      key = ticker:BTCUSDT
      ├─ fresh entry  → hits+1  → return cached Ticker      (no provider call)
      └─ miss/expired → misses+1 → providerCalls+1
           → loader() → registry.getActive().getTicker()
           → store (expiry = now + TTL) → return Ticker
```

Candles are identical with key `candles:<symbol>:<timeframe>:<limit>` —
each symbol/timeframe/limit combination is an independent entry, so
`limit=100` and `limit=50` never serve each other.

Failure semantics: a loader failure (provider error) is **not** cached — the
domain error propagates unchanged to the `MarketDataDomainErrorFilter`
(400/502/504, US007) and the next request retries the provider. A cached
entry also counts a miss before the loader runs, so `misses` ≥ `providerCalls`
only when loads fail; on the happy path they advance together.

`GET /market/health` intentionally bypasses the cache — health must always
reflect the live provider.

## TTL policy

| Cache   | Default TTL | Env variable               |
| ------- | ----------- | -------------------------- |
| ticker  | 5 seconds   | `MARKET_CACHE_TICKER_TTL`  |
| candles | 60 seconds  | `MARKET_CACHE_CANDLES_TTL` |

- Expiry is absolute: `expiresAt = storedAt + TTL`. A read at or past the
  expiry is a miss, evicts the stale entry, and triggers a provider refresh.
- Re-storing a key resets its expiry.
- There is no background sweeper — expired entries are purged lazily on read
  and on metrics enumeration, which is sufficient for the small key space
  (symbols × timeframes × limits actually requested).

## Configuration

```dotenv
MARKET_CACHE_ENABLED=true    # true | false | 1 | 0   (default: true)
MARKET_CACHE_TICKER_TTL=5    # seconds > 0            (default: 5)
MARKET_CACHE_CANDLES_TTL=60  # seconds > 0            (default: 60)
```

Resolved once at bootstrap from `ConfigService` (global `ConfigModule`,
`.env` / `apps/api/.env`) into the frozen `MARKET_DATA_CACHE_CONFIG` object.
Unset/blank values fall back to defaults; an unparseable value
(`MARKET_CACHE_ENABLED=maybe`, `MARKET_CACHE_TICKER_TTL=fast`, `0`, negative)
fails bootstrap fast — same policy as `MARKET_DATA_PROVIDER` (US007).
`MARKET_CACHE_ENABLED=false` short-circuits the service: every request goes
straight to the provider, nothing is stored, and `/market/cache` reports
`enabled: false` with zero cache traffic.

## Metrics

`GET /v1/market/cache` (authenticated, like every market endpoint) returns:

```json
{
  "enabled": true,
  "hits": 2,
  "misses": 3,
  "entries": 2,
  "hitRatio": 0.4,
  "lastRefresh": "2026-07-19T11:07:23.340Z",
  "providerCalls": 3,
  "caches": {
    "ticker": {
      "hits": 1,
      "misses": 2,
      "entries": 1,
      "hitRatio": 0.3333,
      "lastRefresh": "...",
      "ttlSeconds": 5
    },
    "candles": {
      "hits": 1,
      "misses": 1,
      "entries": 1,
      "hitRatio": 0.5,
      "lastRefresh": "...",
      "ttlSeconds": 60
    }
  },
  "generatedAt": "2026-07-19T11:07:23.360Z"
}
```

- `hits` / `misses` — cache lookups served / not served from memory (totals
  are the sum across the ticker and candles caches).
- `entries` — live (non-expired) entries; expired entries are purged before
  counting.
- `hitRatio` — `hits / (hits + misses)`, rounded to 4 decimals, `0` before
  the first lookup.
- `lastRefresh` — ISO-8601 of the most recent store (most recent across
  caches at the top level), `null` before the first store.
- `providerCalls` — number of times the cache invoked the provider loader
  (misses + disabled-mode passthroughs). Counters are in-process and reset on
  restart, matching the lifetime of the cache itself.

## API

| Endpoint                   | Change                                            |
| -------------------------- | ------------------------------------------------- |
| `GET /v1/market/ticker/:s` | unchanged contract — now served through the cache |
| `GET /v1/market/candles`   | unchanged contract — now served through the cache |
| `GET /v1/market/health`    | unchanged — bypasses the cache                    |
| `GET /v1/market/cache`     | **new** — cache statistics (shape above)          |

No frontend changes; the Shared API Client is untouched.

## Testing

- `market-data-cache.spec.ts` — TTL expiry/eviction with an injected clock,
  re-store expiry reset, hit-ratio math, lastRefresh, entry purge, guards.
- `market-data-cache.config.spec.ts` — defaults, blank fallback, boolean
  spellings, fractional TTLs, fail-fast on invalid values.
- `market-data-cache-registry.spec.ts` — registration, duplicates, lookup,
  per-cache metrics, clearAll.
- `market-data-cache.service.spec.ts` — read-through miss/hit, per-TTL
  refresh (fake timers), key composition, loader failures not cached,
  disabled mode, aggregated stats.
- `market-data-cache.module.spec.ts` — Nest DI: env-driven config, disabled
  flag, bootstrap failure on invalid env.
- `market-data-domain.controller.spec.ts` — extended: second identical
  request is a hit, per-key candle caching, `/market/cache` stats shape;
  existing US006 assertions unchanged.

## Future WebSocket interaction

When streaming lands (see 027 §Future WebSocket integration), the cache
becomes the natural convergence point:

1. A `MarketDataStream` subscription pushes fresh `Ticker` / closed `Candle`
   objects **into** the same named caches (`set` on the existing keys),
   turning the cache from read-through into write-through — REST consumers
   then hit warm entries almost always, and `providerCalls` collapses to
   stream reconnect gaps.
2. TTLs stay as the staleness backstop: if the stream drops, entries expire
   on the existing schedule and the read-through path transparently falls
   back to REST snapshots.
3. The future Signal Engine consumes `MarketDataCacheService` (or a
   subscription façade on top of it) rather than the provider, so signal
   reads never multiply provider load.
4. Metrics extend additively (e.g. `streamUpdates`, per-cache `source`)
   without breaking the `/market/cache` contract.
