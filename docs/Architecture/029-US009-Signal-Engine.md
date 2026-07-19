# US009 — Signal Engine Foundation

Status: Implemented  
Scope: On-request strategy evaluation on top of the cached market data
pipeline (US006–US008). One deterministic dummy evaluator behind a pluggable
evaluator abstraction. No order execution, no paper/real trading, no
WebSocket, no AI, no scheduling, no polling, no persistence, no frontend
changes.

## Engine architecture

```text
HTTP consumer (authenticated, X-Workspace-Id)
  ↓
SignalEngineController (POST /v1/market/signal/evaluate)
  ↓
SignalEngineService                             — modules/signal-engine (US009)
  ├─ StrategyDomainService (US004)              — load workspace-scoped strategy
  ├─ MarketDataCacheService (US008)             — cached candle window (read-through)
  │    ↓ on miss (loader callback)
  │    MarketDataProviderRegistry.getActive()   — unchanged (US006/US007)
  │      ↓ MarketDataProvider port
  │      ├─ MockMarketDataProvider  ('mock')
  │      └─ BinanceMarketDataProvider ('binance')
  ↓
StrategyRunner                                  — one evaluation
  ├─ SignalEvaluatorRegistry                    — evaluator inventory, 'dummy' default
  │    └─ DummyStrategyEvaluator                — close > open → BUY else SELL
  ↓
SignalResult                                    — canonical, validated, frozen
```

The engine **never** talks to Binance (or any provider) directly. Candles are
requested exclusively through `MarketDataCacheService.getCandles`; the
provider registry appears only inside the cache-miss loader callback — the
identical pattern the market controller uses (US008). A warm cache therefore
serves evaluations with **zero** provider calls, and signal reads never
multiply provider load (the convergence point predicted in 028 §Future).

`modules/signal-engine` is an independent Nest module:

| Piece                     | File                                     | Responsibility                                                   |
| ------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `SignalResult`            | `domain/signal-result.ts`                | Canonical result model + validating factory (freeze)             |
| `SignalEngineError`       | `domain/signal-engine.error.ts`          | Error boundary: `UNKNOWN_EVALUATOR`, `EMPTY_CANDLE_SERIES`       |
| `StrategyEvaluator`       | `evaluators/strategy-evaluator.ts`       | Evaluator port: `evaluate(context) → StrategyEvaluation`         |
| `DummyStrategyEvaluator`  | `evaluators/dummy-strategy-evaluator.ts` | Deterministic close-vs-open decision                             |
| `SignalEvaluatorRegistry` | `signal-evaluator-registry.ts`           | Evaluator inventory; first registered = default                  |
| `StrategyRunner`          | `strategy-runner.ts`                     | Resolve evaluator → run → normalize into `SignalResult`          |
| `SignalEngineService`     | `signal-engine.service.ts`               | Orchestration: strategy → cached candles → runner                |
| `SignalEngineController`  | `signal-engine.controller.ts`            | `POST /v1/market/signal/evaluate` (workspace-scoped)             |
| `SignalEngineErrorFilter` | `signal-engine-error.filter.ts`          | `SignalEngineError` → 400 / 502 (APP_FILTER, engine errors only) |
| `SignalEngineModule`      | `signal-engine.module.ts`                | DI wiring; registers the dummy evaluator                         |

Dependency direction: the module consumes `StrategyDomainService` (US004),
`MarketDataCacheService` (US008), and `MarketDataProviderRegistry` (US006,
loader only). Nothing depends on the signal engine; providers, cache, and
strategies are unchanged.

## Domain model — SignalResult

```json
{
  "strategyId": "ecf1e883-a5af-4ba3-918a-582466225f15",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "signal": "SELL",
  "confidence": 0.5793,
  "timestamp": "2026-07-19T11:37:25.541Z",
  "metadata": {
    "evaluator": "dummy",
    "open": 64595,
    "close": 64527.64,
    "candleOpenTime": "2026-07-19T11:00:00.000Z",
    "candleCloseTime": "2026-07-19T12:00:00.000Z",
    "candlesEvaluated": 100
  }
}
```

- `signal` ∈ `BUY | SELL | HOLD` (`SIGNAL_TYPES`). The dummy evaluator emits
  only BUY/SELL; HOLD is reserved for richer evaluators.
- `confidence` — deterministic conviction in `[0, 1]`.
- `metadata` — evaluator-specific diagnostics; frozen, never interpreted by
  the engine.
- `createSignalResult` validates every field (strategyId, symbol charset,
  timeframe membership, signal membership, confidence range, ISO timestamp,
  plain-object metadata) so a misbehaving evaluator can never emit an invalid
  result. Results are not persisted in this milestone.

## Evaluator abstraction

```ts
interface StrategyEvaluator {
  readonly id: string; // 'dummy', future: 'ma', 'rsi', 'macd', 'bollinger', 'ai'
  evaluate(context: {
    strategy: Strategy; // full US004 configuration incl. parameters
    candles: ReadonlyArray<Candle>; // cached window, oldest first, ≥ 1 guaranteed
  }): Promise<{ signal: SignalType; confidence: number; metadata: SignalMetadata }>;
}
```

Evaluators only **decide** — the `StrategyRunner` enriches the decision with
the strategy identity and timestamp and validates it via `createSignalResult`.
`evaluate` is async so future evaluators may perform I/O (AI gateway).

`SignalEvaluatorRegistry` mirrors the provider-registry policy (US006): the
first registered evaluator is the default; a strategy may request a specific
one via `parameters.evaluator` (string). An unknown id raises
`UnknownStrategyEvaluatorError` → 400 with the registered inventory in the
message. Currently registered: `dummy` only.

### DummyStrategyEvaluator

Fully deterministic, no randomness, no clock reads — a pure function of the
latest cached candle:

- `close > open` → **BUY**, otherwise (including a flat candle) → **SELL**.
- `confidence` = candle body as a fraction of the candle range
  `|close − open| / (high − low)` (4 decimals; `0` for a zero-range candle) —
  a full-body candle scores 1, a doji scores 0.

## Execution flow

```text
POST /v1/market/signal/evaluate            body: { "strategyId": "…" }
  → JwtAuthGuard (global) → ValidationPipe (EvaluateSignalBodyDto)
  → requireWorkspaceId (X-Workspace-Id, US109)
  → SignalEngineService.evaluate(workspaceId, strategyId)
      ├─ StrategyDomainService.getById — workspace-scoped; miss/foreign → 404
      ├─ MarketDataCacheService.getCandles(pair, timeframe, 100, loader)
      │     key = candles:<pair>:<timeframe>:100   (same key space as US008)
      │     hit  → no provider call
      │     miss → loader → registry.getActive().getCandles(...)
      ├─ candles empty → EmptyCandleSeriesError → 502
      └─ StrategyRunner.run(strategy, candles)
            ├─ SignalEvaluatorRegistry.resolve(parameters.evaluator ?? default)
            ├─ evaluator.evaluate({ strategy, candles })
            └─ createSignalResult(...) → frozen SignalResult
  → 201 SignalResult
```

The candle window (`SIGNAL_CANDLES_LIMIT = 100`) matches the market
controller's `DEFAULT_CANDLES_LIMIT`, so `GET /market/candles` and signal
evaluations share cache entries. Evaluation happens **only on request** —
there is no scheduler, poller, or background loop.

Failure semantics:

| Condition                              | Response                              |
| -------------------------------------- | ------------------------------------- |
| Missing / unknown `X-Workspace-Id`     | 400 / 404 (shared helper, US109)      |
| Empty / missing `strategyId`           | 400 (ValidationPipe, US113)           |
| Strategy not found / foreign workspace | 404 — never a cross-workspace leak    |
| `parameters.evaluator` unknown         | 400 `UNKNOWN_EVALUATOR`               |
| Provider returned zero candles         | 502 `EMPTY_CANDLE_SERIES`             |
| Provider failure inside the loader     | unchanged US007 mapping (400/502/504) |

## API

| Endpoint                          | Change                                     |
| --------------------------------- | ------------------------------------------ |
| `POST /v1/market/signal/evaluate` | **new** — evaluate one strategy on request |
| all existing endpoints            | unchanged                                  |

No frontend changes; the Shared API Client is untouched.

## Testing

- `signal-result.spec.ts` — BUY/SELL/HOLD inventory, factory freeze +
  field-by-field rejection, confidence boundaries.
- `dummy-strategy-evaluator.spec.ts` — BUY/SELL/flat-candle decisions,
  latest-candle selection, body/range confidence, determinism, metadata.
- `signal-evaluator-registry.spec.ts` — registration order, resolve by
  id/default, unknown id domain error, duplicate/empty guards.
- `strategy-runner.spec.ts` — default + parameter-selected evaluator,
  unknown evaluator, contract violation rejected by the factory.
- `signal-engine.service.spec.ts` — end-to-end with the mock provider,
  workspace scoping (null), cache hit on second evaluation, shared cache key
  with the market endpoint, empty-series error.
- `signal-engine-error.filter.spec.ts` — 400/502 mapping.
- `signal-engine.controller.spec.ts` — workspace-header guards, happy path,
  404 for unknown/foreign strategies.
- `signal-engine.module.spec.ts` — Nest DI boot with in-memory repositories;
  dummy registered as default; strategy → SignalResult through the module.
- `signal-engine.dto.spec.ts` — strategyId presence/type validation.

## Future indicators

Planned evaluators plug in behind `StrategyEvaluator` without engine changes:

1. **Moving Average / RSI / MACD / Bollinger** — pure functions of the candle
   window; read tuning values from `strategy.parameters`, register under
   their ids, and become selectable per strategy via `parameters.evaluator`.
2. **AI evaluator** — async `evaluate` already supports gateway calls; the
   registry keeps it opt-in per strategy.
3. **HOLD semantics** — richer evaluators emit HOLD when no edge exists; the
   type and validation already cover it.
4. **Persistence / streaming** — when signals need history or push delivery,
   a repository and the US008 write-through stream slot in around the engine;
   the evaluation core stays unchanged.
