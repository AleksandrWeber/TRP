# US013 — Advanced Technical Indicators

Status: Implemented  
Scope: Pure, deterministic RSI, MACD, and Bollinger Bands calculations inside
the existing Technical Indicators Engine. No HTTP endpoints, trading decisions,
Signal Engine changes, providers, cache access, persistence, or UI changes.

## Architecture

The module remains an independent mathematical library:

```text
number[] | Candle[] (close prices)
  ↓
IndicatorRegistry.resolve(id)
  ↓
pure Indicator.calculate(config)
  ↓
deeply immutable numeric result
```

The only external reference remains the compile-time `Candle` type from the
Market Data Domain. Indicators contain no Strategy, Signal, Evaluator, Paper
Trading, Binance, cache, authentication, or workspace concepts. They never
return `BUY`, `SELL`, or `HOLD`.

All implementations:

- reject empty, non-finite, invalid-period, and insufficient inputs;
- never mutate their input;
- never round output values;
- are stateless and deterministic;
- return frozen result objects, metadata, and numeric arrays.

## RSI (`rsi`)

`RsiIndicator` implements J. Welles Wilder's original Relative Strength Index.
For period `p`, the first output requires `p + 1` closes and uses the first `p`
price changes:

```text
change[t] = close[t] - close[t-1]
gain[t]   = max(change[t], 0)
loss[t]   = max(-change[t], 0)

firstAverageGain = sum(gain[1..p]) / p
firstAverageLoss = sum(loss[1..p]) / p

averageGain[t] = (averageGain[t-1] × (p-1) + gain[t]) / p
averageLoss[t] = (averageLoss[t-1] × (p-1) + loss[t]) / p

RS  = averageGain / averageLoss
RSI = 100 - 100 / (1 + RS)
```

When average gain is zero, RSI is `0`; when average loss is zero (and gain is
non-zero), RSI is `100`. The result uses the existing `IndicatorResult` shape:
`values[]` plus `{ period, inputLength, calculatedLength }` metadata.

## MACD (`macd`)

`MacdIndicator` accepts configurable `fastPeriod`, `slowPeriod`, and
`signalPeriod`. The fast period must be smaller than the slow period.

```text
alpha(period) = 2 / (period + 1)
EMA[t] = close[t] × alpha + EMA[t-1] × (1 - alpha)

MACD[t]      = fastEMA[t] - slowEMA[t]
signal[t]    = EMA(MACD, signalPeriod)[t]
histogram[t] = MACD[t] - signal[t]
```

Each EMA is seeded with the arithmetic mean of its first `period` inputs,
matching the engine's existing EMA convention. The minimum input length is
`slowPeriod + signalPeriod - 1`.

The immutable result contains aligned `fastEma`, `slowEma`, `macd`, `signal`,
and `histogram` arrays. Every array starts at input index
`slowPeriod + signalPeriod - 2`, when all five values are available. Metadata
records all periods, input length, calculated length, and this start index.

## Bollinger Bands (`bollinger`)

`BollingerBandsIndicator` accepts a configurable positive period `p` and
finite positive multiplier `k`. It uses the population standard deviation,
which is the convention used by established Bollinger Bands implementations:

```text
middle[t] = SMA(close, p)[t]
variance[t] = sum((close - middle[t])² over window) / p
standardDeviation[t] = sqrt(variance[t])
upper[t] = middle[t] + k × standardDeviation[t]
lower[t] = middle[t] - k × standardDeviation[t]
```

The implementation maintains rolling first and second moments, making it O(n)
with no per-window allocations. The immutable result contains aligned
`middle`, `upper`, `lower`, and `standardDeviation` arrays plus period,
multiplier, input-length, and calculated-length metadata.

## Registry

The default inventory is:

```text
sma, ema, rsi, macd, bollinger
```

Registration still rejects empty and duplicate ids; resolution still rejects
unknown ids. `IndicatorRegistry` now stores the generic
`Indicator<TInput, TResult>` port so richer MACD and Bollinger contracts can
coexist with `SeriesIndicator`. Its generic `resolve<TInput, TResult>()`
defaults preserve the original SMA/EMA/RSI series contract for existing
consumers.

## Extension model

1. Define a readonly input and immutable result contract.
2. Implement `Indicator<TInput, TResult>` as a stateless pure calculation.
3. Reuse common series normalization and validation helpers.
4. Validate every configuration parameter and all emitted numeric values.
5. Deep-freeze all returned arrays, metadata, and result objects.
6. Add a fixed OHLC reference fixture and trusted-formula regression values.
7. Register the implementation in `TechnicalIndicatorsModule`.
8. Export its public contract from the module barrel.

No Signal Engine or Strategy Evaluator change is required to add an indicator.

## Reference verification

Each indicator test contains a fixed 38-candle OHLC dataset derived from
Wilder's published worksheet price series. Expected arrays are committed at
full IEEE-754 precision; tests perform exact equality so future arithmetic,
seeding, alignment, or accidental-rounding changes fail immediately.

Conventions were checked against established references:

- Wilder RSI initialization and `1 / period` smoothing: Wilder worksheet,
  StockCharts ChartSchool, and Macroption.
- MACD definition, standard 12/26/9 periods, EMA factors, histogram, and
  33-point lookback: TA-Lib documentation/source and pandas-ta documentation.
- Bollinger middle/upper/lower formulas, population deviation convention,
  and standard 20/2 parameters: TradingView and StockCharts ChartSchool.

The regression values intentionally retain full precision rather than the
two-decimal intermediate rounding shown in some educational worksheets.

## Technical debt review (review only)

### IndicatorResult evolution

`IndicatorResult` works for one numeric series. MACD and Bollinger require
dedicated result types and repeat alignment metadata. A future
`Series<T> = { values, offset }` model could make multi-series alignment
explicit and composable. This should be a versioned migration because current
evaluators assume end-aligned `IndicatorResult.values`.

### ConfidenceCalculator extraction

Strategy Evaluators currently own confidence arithmetic. If additional
indicator-based evaluators repeat it, extract a strategy-layer
`ConfidenceCalculator`. It must not move into this mathematical module because
confidence is a trading-decision concern.

### Numeric precision policy

The engine uses JavaScript IEEE-754 double precision and never rounds.
Document tolerances at integration boundaries if results are compared with
libraries that use different EMA seeds or decimal precision. Decimal
formatting remains a UI concern.

### Performance opportunities

The current calculations are O(n). Future work could share an internal,
allocation-conscious EMA primitive between EMA and MACD and benchmark typed
arrays for large backtests. Optimization must preserve exact seeding,
alignment, and deterministic output.

### Streaming calculations

All indicators are currently batch calculations. Stateful streaming variants
could retain rolling sums or prior averages, but should be separate ports so
the current pure deterministic API remains unchanged and replayable.

## Future Indicators

Documented roadmap only:

- ATR
- ADX
- VWAP
- SuperTrend
- Ichimoku
- Stochastic
- Parabolic SAR
