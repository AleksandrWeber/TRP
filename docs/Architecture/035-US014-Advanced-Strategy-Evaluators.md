# US014 — Advanced Strategy Evaluators

Status: Implemented  
Scope: RSI, MACD, and Bollinger Bands Strategy Evaluators inside the existing
Strategy Evaluators bridge module. No Signal Engine changes, no Technical
Indicators changes, no Paper Trading, Market Cache, Binance Provider,
Authentication, or Workspace changes, no scheduler, no UI changes.

## Architecture

US014 extends only the strategy layer introduced by US012. The evaluator flow
is unchanged:

```text
POST /v1/market/signal/evaluate
  ↓
SignalEngineService (US009, unchanged)
  ↓  100 cached candles, oldest first
StrategyRunner → SignalEvaluatorRegistry.resolve(parameters.evaluator)
  ↓
StrategyEvaluator.evaluate({ strategy, candles })   ← US014 lives here
  ↓  delegates the mathematics to
IndicatorRegistry.resolve('rsi' | 'macd' | 'bollinger')   (US013, unchanged)
  ↓
StrategyEvaluation { signal, confidence, metadata } → SignalResult
```

Rules preserved:

- The Signal Engine sees only the `StrategyEvaluator` port. No imports, no
  references, no coupling were added.
- Technical Indicators remain pure mathematics. They never return
  `BUY` / `SELL` / `HOLD`.
- Trading decisions are made exclusively inside Strategy Evaluators.

Unlike SMA/EMA, the three new evaluators do not extend
`IndicatorStrategyEvaluator`. That base class encodes a specific decision
(price versus a single indicator value) over the canonical
`IndicatorResult.values` shape. RSI needs threshold decisions, and MACD /
Bollinger consume richer multi-series results (`MacdResult`,
`BollingerBandsResult`), so each new evaluator implements the
`StrategyEvaluator` port directly and resolves its indicator from the
`IndicatorRegistry` with explicit result types. The existing SMA/EMA/dummy
evaluators are byte-for-byte unchanged.

## Registry

`StrategyEvaluatorsModule.onModuleInit` now registers five indicator-backed
evaluators after the Signal Engine registers `dummy`:

```text
dummy (default), sma, ema, rsi, macd, bollinger
```

The `SignalEvaluatorRegistry` (unchanged) keeps rejecting duplicate ids at
registration and unknown ids at resolution (`UNKNOWN_EVALUATOR` → HTTP 400).

## RSI Evaluator (`rsi`)

Configuration (`strategy.parameters`):

```json
{ "evaluator": "rsi", "period": 14, "overbought": 70, "oversold": 30 }
```

Defaults: `period` 14, `overbought` 70, `oversold` 30.

Decision on the latest completed Wilder RSI value:

```text
RSI <= oversold   → BUY
RSI >= overbought → SELL
otherwise         → HOLD
```

Metadata: `evaluator`, `indicator`, `period`, `rsi`, `overbought`,
`oversold`, `candlesEvaluated`, `calculatedLength`.

Validation: period must be a positive integer (`INVALID_PERIOD` → 400);
thresholds must be finite numbers within `[0, 100]` with
`oversold < overbought` (`INVALID_EVALUATOR_CONFIG` → 400); the indicator
requires `period + 1` candles (`INSUFFICIENT_INPUT` → 400) and rejects
non-finite closes (`INVALID_INPUT` → 502).

## MACD Evaluator (`macd`)

Configuration:

```json
{ "evaluator": "macd", "fast": 12, "slow": 26, "signal": 9 }
```

Defaults: `fast` 12, `slow` 26, `signal` 9.

Decision by completed-value crossover — the previous completed MACD/Signal
pair against the latest completed pair. No intrabar logic:

```text
previous MACD <= previous Signal AND latest MACD > latest Signal → BUY  (cross above)
previous MACD >= previous Signal AND latest MACD < latest Signal → SELL (cross below)
otherwise                                                        → HOLD
```

Metadata: `evaluator`, `indicator`, `fastPeriod`, `slowPeriod`,
`signalPeriod`, `macd`, `signalLine`, `histogram`, `previousMacd`,
`previousSignalLine`, `close`, `candlesEvaluated`, `calculatedLength`.
(`signalLine` avoids a name collision with the top-level `signal` decision.)

Validation: all three periods must be positive integers (`INVALID_PERIOD` →
400); `fast >= slow` is rejected before the indicator runs
(`INVALID_EVALUATOR_CONFIG` → 400); crossover detection needs two completed
values, so the evaluator requires `slow + signal` candles — one more than the
indicator itself (`INSUFFICIENT_INPUT` → 400).

## Bollinger Evaluator (`bollinger`)

Configuration:

```json
{ "evaluator": "bollinger", "period": 20, "multiplier": 2 }
```

Defaults: `period` 20, `multiplier` 2.

Decision on the latest completed bands against the latest close:

```text
Close <= Lower Band → BUY
Close >= Upper Band → SELL
otherwise           → HOLD
```

On a zero-width band (flat window: upper = lower = close) the BUY branch wins
deterministically.

Metadata: `evaluator`, `indicator`, `period`, `multiplier`, `upperBand`,
`middleBand`, `lowerBand`, `close`, `candlesEvaluated`, `calculatedLength`.

Validation: period must be a positive integer (`INVALID_PERIOD` → 400);
multiplier must be a finite positive number (`INVALID_EVALUATOR_CONFIG` →
400, checked in the evaluator before the indicator's own guard); the
indicator requires `period` candles (`INSUFFICIENT_INPUT` → 400).

## Confidence

US014 reuses the US012 confidence mechanism unchanged in design: a
deterministic relative distance, clamped to `[0, 1]` and rounded to 4
decimals. Each evaluator maps it onto its own decision geometry:

| Evaluator | BUY                             | SELL                                      | HOLD |
| --------- | ------------------------------- | ----------------------------------------- | ---- |
| rsi       | `(oversold − rsi) / oversold`   | `(rsi − overbought) / (100 − overbought)` | 0    |
| macd      | `\|macd − signalLine\| / close` | same                                      | 0    |
| bollinger | `(lowerBand − close) / close`   | `(close − upperBand) / close`             | 0    |

A value sitting exactly on its trigger line scores 0 — the same convention as
SMA/EMA, where a close exactly on the moving average scores 0.

Observed limitations (documented only, per US014 — no redesign):

- HOLD always scores 0, so confidence carries no information about how close
  the market is to a trigger.
- The MACD gap is smallest right after a genuine crossover, so fresh BUY/SELL
  signals — the only ones this evaluator emits — systematically get low
  confidence values.
- Normalizing by the close price (MACD, Bollinger) makes confidence scale
  with the instrument's price level rather than its volatility.
- RSI thresholds at the scale edges (`oversold = 0`, `overbought = 100`)
  leave no penetration room; those degenerate cases score 0.
- The formula lives in each evaluator; there is still no shared
  `ConfidenceCalculator` (see Technical Debt).

## Error boundary

Period-like validation reuses the existing US011/US012 errors
(`InvalidIndicatorPeriodError`, `InsufficientIndicatorInputError`,
`InvalidIndicatorInputError`) mapped by the existing
`TechnicalIndicatorsErrorFilter`. Evaluator-only misconfiguration (invalid
thresholds, `fast >= slow`, non-positive multiplier, wrong parameter types)
has no counterpart in the indicator engine, so US014 adds
`InvalidEvaluatorConfigError` (`INVALID_EVALUATOR_CONFIG`) plus
`EvaluatorConfigErrorFilter` (→ HTTP 400) inside the strategy-evaluators
module. The Technical Indicators module was not touched.

## Future evaluator roadmap (documented only — not implemented)

- **ATR Evaluator** — volatility-based position filters and stop sizing;
  needs an ATR indicator consuming high/low/close, the first indicator to
  read more than close prices.
- **ADX Evaluator** — trend-strength gate (e.g. only trade when ADX > 25);
  natural composite partner for the crossover evaluators.
- **SuperTrend Evaluator** — ATR-derived trailing band with flip-based
  BUY/SELL; requires cross detection like MACD.
- **AI Evaluator** — delegates the decision to the AI Gateway (US: async
  `evaluate` was designed for exactly this); needs timeout/fallback policy
  and non-determinism handling before it can share the deterministic
  contract.

All of them plug in behind the same `StrategyEvaluator` port and registry —
no Signal Engine changes required.

## Verification

- Backend: 201 test files / 1161 tests green, `tsc --noEmit` clean,
  `nest build` clean, ESLint clean.
- Frontend: 28 tests green, build and lint clean, no changes needed (the
  strategy form already passes arbitrary parameter JSON through).
- Browser: RSI / MACD / Bollinger strategies created and evaluated through
  the UI; dummy, SMA, and EMA re-verified; all nav pages render; no console
  errors.
- Regression: auth, workspace bootstrap, strategies CRUD, signal engine,
  market health (binance active), market cache stats, ticker, paper trading,
  knowledge, and campaign history endpoints verified live.
