# US011 — Technical Indicators Engine

Status: Implemented  
Scope: A pure calculation library for technical market indicators. SMA and
EMA behind a generic `Indicator` port and an `IndicatorRegistry`. No trading
decisions, no BUY/SELL logic, no provider access, no API calls, no HTTP
endpoints, no persistence, no frontend changes.

## Architecture

```text
Input (Candle[] or number[])
  ↓
IndicatorRegistry.resolve(id)          — modules/technical-indicators (US011)
  ↓
Indicator.calculate(input)             — pure, stateless, deterministic
  ├─ assertPeriod / toNumericSeries    — fail-fast validation
  │    (candles → close prices; NaN/Infinity/empty rejected)
  ↓
IndicatorResult                        — canonical, validated, deeply frozen
```

The module is **completely independent** of the Strategy Engine, Signal
Engine, Paper Trading, Binance, the Market Cache, Authentication, and the
Workspace. Its only external reference is the `Candle` **type** from the
Market Data Domain (US006) — a compile-time-only import so that candle series
from the cached pipeline can be fed to indicators without conversion glue.
There is no runtime dependency upward into US006–US010. Downstream, the
Strategy Evaluators bridge (US012) is the first consumer of
`IndicatorRegistry`; the Signal Engine still never imports this module.

`modules/technical-indicators` is an independent Nest module:

| Piece                       | File                                   | Responsibility                                             |
| --------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `Indicator<TInput,TResult>` | `domain/indicator.ts`                  | Indicator port: `calculate()`, `id()`, `name()`            |
| `IndicatorResult`           | `domain/indicator-result.ts`           | Immutable result model + validating factory (deep freeze)  |
| Input validation            | `domain/indicator-input.ts`            | `toNumericSeries`, `assertPeriod`, `assertSeriesLength`    |
| `TechnicalIndicatorsError`  | `domain/technical-indicators.error.ts` | Error boundary: 5 typed error codes                        |
| `SeriesIndicator`           | `indicators/series-indicator.ts`       | Shared shape of period-based indicators (`series, period`) |
| `SmaIndicator`              | `indicators/sma-indicator.ts`          | Simple Moving Average (rolling sum, O(n))                  |
| `EmaIndicator`              | `indicators/ema-indicator.ts`          | Exponential Moving Average (SMA seed, k = 2/(period+1))    |
| `IndicatorRegistry`         | `indicator-registry.ts`                | Indicator inventory: register / resolve / list / has       |
| `TechnicalIndicatorsModule` | `technical-indicators.module.ts`       | DI wiring; registers `sma` and `ema`                       |

Dependency direction: nothing → technical-indicators → (Candle type only).
The module is registered in `AppModule` so future consumers can inject the
registry, but it exposes **no controllers** — it is internal only.

## Indicator port

```ts
interface Indicator<TInput, TResult> {
  id(): string; // stable registry key: 'sma', 'ema', future 'rsi', 'macd', …
  name(): string; // human-readable: 'Simple Moving Average'
  calculate(input: TInput): TResult; // pure function, never mutates input
}
```

Implementations must be stateless and deterministic. The generic parameters
keep the port open for future indicator families with richer inputs/outputs
(e.g. MACD returning multiple series); the current period-based family is
pinned by `SeriesIndicator`:

```ts
type SeriesIndicatorInput = Readonly<{
  series: ReadonlyArray<number> | ReadonlyArray<Candle>; // closes extracted
  period: number;
}>;
type SeriesIndicator = Indicator<SeriesIndicatorInput, IndicatorResult>;
```

## Indicator lifecycle

1. **Validate the period** — `assertPeriod` rejects anything that is not a
   positive integer (`INVALID_PERIOD`).
2. **Normalize the input** — `toNumericSeries` copies the series into a fresh
   frozen array, extracting `close` from candles; empty input and any
   NaN/Infinity value fail fast with the offending index (`INVALID_INPUT`).
   The caller's array is never mutated.
3. **Check sufficiency** — `assertSeriesLength` requires
   `input length >= period` (`INSUFFICIENT_INPUT`).
4. **Calculate** — pure arithmetic, oldest → newest.
5. **Package** — `createIndicatorResult` re-validates every field (id,
   finiteness of all values, metadata consistency) and returns a **deeply
   frozen** result. A misbehaving indicator can never emit NaN or a
   metadata/values mismatch to consumers.

## Result model

```json
{
  "indicatorId": "sma",
  "values": [2, 3, 4],
  "metadata": { "period": 3, "inputLength": 5, "calculatedLength": 3 }
}
```

- `values` are aligned to the **end** of the input: `values[i]` corresponds to
  input index `inputLength − calculatedLength + i`. For both SMA and EMA,
  `calculatedLength = inputLength − period + 1`.
- The result object, `values`, and `metadata` are all frozen; values are a
  copy, never an alias of an internal buffer.

## Registry

`IndicatorRegistry` mirrors the evaluator-registry policy (US009) with one
deliberate difference: **no default indicator**. Indicators are not
interchangeable (an SMA is not a fallback for an EMA), so `resolve(id)`
always requires an explicit id.

- `register(indicator)` — rejects empty ids (`INVALID_INPUT`) and duplicates
  (`DUPLICATE_INDICATOR`).
- `resolve(id)` — unknown ids raise `UNKNOWN_INDICATOR` with the registered
  inventory in the message.
- `list()` — frozen id array in registration order; `has(id)` for probing.

Currently registered: `sma`, `ema`.

## Indicators

### SMA — Simple Moving Average (`sma`)

`values[i]` = arithmetic mean of the `period` inputs ending at input index
`period − 1 + i`. Implemented with a rolling window sum — O(n) for any
period. `period = 1` degenerates to the identity series.

### EMA — Exponential Moving Average (`ema`)

Standard smoothing `k = 2 / (period + 1)`. The first output is seeded with
the SMA of the first `period` inputs (the conventional TA seeding), then

```text
EMA[i] = value[i] * k + EMA[i-1] * (1 - k)
```

Both indicators share the identical validation pipeline and metadata shape.

## Error handling

All failures are typed `TechnicalIndicatorsError` subclasses — fail fast,
never a partial result:

| Code                  | Raised when                             |
| --------------------- | --------------------------------------- |
| `INVALID_INPUT`       | empty input, NaN, Infinity, non-numbers |
| `INVALID_PERIOD`      | period ≤ 0, non-integer, non-finite     |
| `INSUFFICIENT_INPUT`  | input length < period                   |
| `DUPLICATE_INDICATOR` | registering an already-registered id    |
| `UNKNOWN_INDICATOR`   | resolving an unregistered id            |

There is no HTTP filter because the module has no HTTP surface; a future
consumer that exposes indicators over HTTP maps these codes at its own
boundary (the US007/US009 filter pattern).

## Extension model

Adding an indicator requires **zero engine changes**:

1. Implement `SeriesIndicator` (or `Indicator<TIn, TOut>` for richer shapes)
   as a pure calculation in `indicators/`.
2. Reuse `assertPeriod` / `toNumericSeries` / `createIndicatorResult` for the
   shared validation and packaging.
3. Register the instance in the `TechnicalIndicatorsModule` factory.
4. Export it from `index.ts`.

Consumers resolve by id via the registry and never reference an
implementation class — the same inversion the provider (US006) and evaluator
(US009) registries enforce.

## Future indicators

- **RSI** — period-based; fits `SeriesIndicator` unchanged (gain/loss
  smoothing is an internal detail).
- **MACD** — composes two EMAs plus a signal line; returns multiple series,
  so it will define its own `Indicator<MacdInput, MacdResult>` shape while
  reusing the EMA arithmetic and the validation helpers.
- **Bollinger Bands** — SMA ± k·stddev; multi-series result like MACD.
- **Indicator-based evaluators (US009 §Future)** — a `StrategyEvaluator` that
  injects the `IndicatorRegistry`, computes e.g. fast/slow SMA over the
  cached candle window, and emits BUY/SELL/HOLD. The trading decision stays
  in the Signal Engine; this module remains decision-free.

## Testing

- `indicator-input.spec.ts` — numeric passthrough, candle close extraction,
  freeze + no-mutation, empty/NaN/Infinity/non-array/non-number rejection,
  period and length guards.
- `indicator-result.spec.ts` — deep freeze, value copying, field-by-field
  rejection (id, finiteness, period, inputLength, calculatedLength).
- `sma-indicator.spec.ts` — known series, candle input, minimal window,
  period 1 identity, metadata, immutability, determinism, all validation
  failures.
- `ema-indicator.spec.ts` — SMA seed, standard smoothing on a known series,
  candle input, recency weighting, metadata, immutability, determinism, all
  validation failures.
- `indicator-registry.spec.ts` — registration order, resolve by id, `has`,
  unknown id domain error, duplicate/empty guards, frozen list.
- `technical-indicators.module.spec.ts` — standalone Nest DI boot (no other
  module required), sma/ema registered, end-to-end calculation through the
  registry.
