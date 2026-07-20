# US012 — Strategy Evaluators

Status: Implemented (integration baseline: US012.1 / doc 033)  
Scope: The first real strategy evaluators — SMA and EMA — connecting the
Signal Engine (US009) to the Technical Indicators Engine (US011) through the
existing `StrategyEvaluator` port. No changes to the Signal Engine, the
Indicators Engine, Paper Trading, the Market Cache, or Binance. No
scheduling, no automation, no new endpoints, no frontend changes.

## Evaluator architecture

```text
SignalEngineService (US009, unchanged)
  ↓
StrategyRunner → SignalEvaluatorRegistry.resolve(parameters.evaluator)
  ↓                               (inventory: 'dummy' | 'sma' | 'ema')
StrategyEvaluator port
  ├─ DummyStrategyEvaluator        — US009, unchanged (regression baseline)
  ├─ SmaStrategyEvaluator ─┐
  └─ EmaStrategyEvaluator ─┴─ IndicatorStrategyEvaluator   — modules/strategy-evaluators (US012)
                                 ↓
                            IndicatorRegistry (US011)
                                 ↓
                            Indicator ('sma' | 'ema') — pure mathematics
                                 ↓
                            IndicatorResult → evaluator decides BUY/SELL
```

`modules/strategy-evaluators` is a deliberate **bridge module** — the only
place that knows both engines exist:

| Piece                            | File                                   | Responsibility                                               |
| -------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `IndicatorStrategyEvaluator`     | `indicator-strategy-evaluator.ts`      | Shared core: parameters → indicator → decision               |
| `SmaStrategyEvaluator`           | `sma-strategy-evaluator.ts`            | id `'sma'`, delegates to the `'sma'` indicator               |
| `EmaStrategyEvaluator`           | `ema-strategy-evaluator.ts`            | id `'ema'`, delegates to the `'ema'` indicator               |
| `TechnicalIndicatorsErrorFilter` | `technical-indicators-error.filter.ts` | Indicator errors → HTTP (APP_FILTER, indicator errors only)  |
| `StrategyEvaluatorsModule`       | `strategy-evaluators.module.ts`        | Registers sma/ema into the `SignalEvaluatorRegistry` at boot |

## Separation of responsibilities

The two mandatory architecture requirements hold by construction:

1. **The Signal Engine does not know SMA/EMA exist.** Not a single
   signal-engine file changed. The engine still talks only to the
   `StrategyEvaluator` port through its registry; `StrategyEvaluatorsModule`
   injects `SignalEvaluatorRegistry` (exported by `SignalEngineModule`) and
   registers the new evaluators in `onModuleInit` — imported modules
   initialize first, so the dummy is already registered and **remains the
   default** (first registered wins, US009 policy).
2. **Indicators never emit BUY/SELL/HOLD.** The Indicators Engine is equally
   untouched: indicators return `IndicatorResult` values only. The trading
   decision (`close > indicatorValue`) lives exclusively in the evaluator.

Dependency direction: `strategy-evaluators → { signal-engine port,
technical-indicators }`. Nothing depends on the bridge module; removing it
would return the system to the exact US011 state.

## Indicator delegation

Both evaluators share `IndicatorStrategyEvaluator`:

1. Read the period from `strategy.parameters.period` (default **20**).
   Non-numeric or non-positive-integer values → `INVALID_PERIOD`.
2. Resolve the indicator from the `IndicatorRegistry` —
   `strategy.parameters.indicator` when present, otherwise the evaluator's
   default (`'sma'` for the SMA evaluator, `'ema'` for the EMA evaluator).
   Unknown ids → `UNKNOWN_INDICATOR` with the registered inventory.
3. `indicator.calculate({ series: candles, period })` — the US011 pipeline
   extracts close prices and fails fast on empty input, NaN, Infinity
   (`INVALID_INPUT`) and on windows shorter than the period
   (`INSUFFICIENT_INPUT`).
4. Decide: **latest close > latest indicator value → BUY, otherwise SELL**
   (sitting exactly on the indicator counts as SELL, mirroring the dummy's
   flat-candle rule).

Example strategy configuration:

```json
{ "evaluator": "ema", "indicator": "ema", "period": 20 }
```

`evaluator` selects the strategy evaluator (US009 mechanism, unchanged);
`indicator` and `period` are read by the evaluator itself. In the common
case only `evaluator` + `period` are needed — the indicator defaults to the
evaluator's own.

## Confidence calculation

```text
confidence = min(1, |close − indicatorValue| / close), rounded to 4 decimals
```

The relative distance between the latest close and the indicator value,
normalized by the close price: 0 when price sits exactly on its moving
average (no conviction), growing as price stretches away from it, clamped at
1 (a distance of ≥ 100% of the close). Fully deterministic — a pure function
of the candle window and the period; identical inputs always produce the
identical result. Candle closes are guaranteed positive by the US006 candle
factory, so the denominator is never zero.

Metadata attached to every result: `evaluator`, `indicator`, `period`,
`indicatorValue`, `close`, `candlesEvaluated`, `calculatedLength`.

## Error handling

`TechnicalIndicatorsErrorFilter` (APP_FILTER, catches
`TechnicalIndicatorsError` only) completes the HTTP story without touching
either engine:

| Condition                         | Code                  | HTTP                   |
| --------------------------------- | --------------------- | ---------------------- |
| `parameters.evaluator` unknown    | `UNKNOWN_EVALUATOR`   | 400 (US009, unchanged) |
| `parameters.indicator` unknown    | `UNKNOWN_INDICATOR`   | 400                    |
| `parameters.period` invalid       | `INVALID_PERIOD`      | 400                    |
| candle window shorter than period | `INSUFFICIENT_INPUT`  | 400                    |
| non-finite candle data (NaN/∞)    | `INVALID_INPUT`       | 502                    |
| duplicate registration (boot bug) | `DUPLICATE_INDICATOR` | 500                    |

The cache window is `SIGNAL_CANDLES_LIMIT = 100`, so any `period ≤ 100`
evaluates; larger periods return 400 `INSUFFICIENT_INPUT`.

## API

Reuses `POST /v1/market/signal/evaluate` (US009) unchanged — the evaluator
is chosen per strategy via `parameters.evaluator`. No new endpoints.

## Testing

- `sma-strategy-evaluator.spec.ts` — BUY/SELL/on-the-line decisions against
  hand-computed SMAs, confidence formula + clamping, default period,
  metadata, determinism, indicator override, and every validation failure
  (unknown indicator, invalid period incl. string/NaN, short window, NaN/∞
  closes).
- `ema-strategy-evaluator.spec.ts` — the same suite against hand-computed
  EMAs (seed + smoothing), plus the sma-override case.
- `technical-indicators-error.filter.spec.ts` — full code → status mapping.
- `strategy-evaluators.module.spec.ts` — Nest DI boot: registry lists
  `['dummy', 'sma', 'ema']` with dummy still the default; SMA, EMA, and
  dummy strategies each evaluate end to end through the unchanged
  `SignalEngineService` with the mock provider.

## Future evaluators (roadmap — not implemented)

Each plugs in behind `StrategyEvaluator` with zero engine changes; the
period-based ones reuse `IndicatorStrategyEvaluator` directly once their
indicator exists in US011's registry:

1. **RSI** — overbought/oversold thresholds from `parameters`.
2. **MACD** — signal-line crossovers; needs the multi-series MACD indicator.
3. **Bollinger Bands** — band touches/breakouts; multi-series indicator.
4. **ATR** — volatility-scaled decisions and stop sizing.
5. **ADX** — trend-strength gating (emit HOLD in weak trends).
6. **SuperTrend** — ATR-based trailing regime flips.
7. **AI Evaluator** — the async `evaluate` port already supports gateway
   I/O; registers like any other evaluator, opt-in per strategy.

Richer evaluators will also exercise the HOLD signal type, which
`SignalResult` has supported since US009.
