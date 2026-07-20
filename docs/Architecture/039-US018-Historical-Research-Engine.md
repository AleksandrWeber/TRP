# US018 — Historical Research Engine v1

Status: Implemented  
Scope: Deterministic, workspace-scoped historical strategy research. No live
market connection, Paper Trading session, exchange order, or strategy ranking.

## Architecture

```text
Reusable Dataset (Prisma Dataset + immutable OHLCV bars)
  ↓
HistoricalReplayEngine (chronological prefix windows)
  ↓
StrategyRunner
  ↓
registered StrategyEvaluator + Technical Indicators
  ↓
shared executeVirtualSignal state machine
  ↓
isolated ExecutorPortfolioStore
  ↓
HistoricalResearchResult (immutable Strategy × Dataset × Regime row)
  ↓
HistoricalResearchReport
```

The engine reuses the existing `StrategyRunner`, evaluator registry, technical
indicators, `ExecutedTrade` contract, portfolio store, and the BUY/SELL/HOLD
state machine shared with the Paper Trading Executor. Historical Research does
not call Binance, the live market provider registry, the evaluation scheduler,
or a Paper Trading session.

`HistoricalResearchModule` is an orchestration boundary. Dataset persistence
remains owned by `DatasetsModule`; strategy configuration remains owned by
`StrategiesModule`; signal decisions remain owned by `SignalEngineModule`.

## Replay Flow

1. Resolve enabled datasets and workspace-owned strategies.
2. Build compatible Dataset × Strategy pairs by symbol and timeframe.
3. Load candles from the persisted dataset in ascending timestamp order.
4. Create a new portfolio store for that one pair.
5. Sort defensively and reject duplicate candle timestamps.
6. For candle `n`, pass only candles `0..n` to `StrategyRunner`.
7. Stamp the signal with the current candle close time, not wall-clock time.
8. Execute BUY/SELL/HOLD through the shared virtual execution state machine at
   the current historical close price.
9. Calculate trades, win rate, net profit, profit factor, and max drawdown.
10. Hash deterministic inputs and outputs, then persist a new immutable result.

Evaluator warm-up is explicit. `InsufficientIndicatorInputError` skips only the
prefixes that cannot satisfy an indicator period. Other configuration or
evaluation errors fail that Strategy × Dataset result and do not stop sibling
executions.

Replay speed cannot alter signal order or prices. Trade identifiers derive from
dataset content hash, strategy identity, symbol, historical timestamp, and trade
sequence. Operational run/result row ids and execution duration are not part of
the deterministic result hash.

## Dataset Model

The existing reusable `Dataset` object now supports:

- `id` (`datasetId` in the historical domain/API)
- `displayName`
- `description`
- `marketRegime`
- `exchange`
- `symbols`
- `timeframe`
- `startTime` / `endTime` (`startDate` / `endDate` in the historical domain)
- `enabled`
- immutable `contentHash`
- chronologically indexed OHLCV bars

Supported regime vocabulary:

- `BULL_MARKET`
- `BEAR_MARKET`
- `SIDEWAYS`
- `HIGH_VOLATILITY`
- `LOW_VOLATILITY`
- `UNCLASSIFIED`

Dataset contents are not hardcoded in the replay engine. Binance import remains
an ingestion option; replay reads only persisted bars. Metadata can be supplied
during import and updated independently through `PATCH /v1/datasets/:id`.

## Execution Flow

`POST /v1/historical-research/runs` accepts either selected `datasetIds` or
`allDatasets: true`. Optional `strategyIds` select workspace strategies;
otherwise all active strategies execute.

Each request inserts a new `HistoricalResearchRun`. Every compatible
Strategy × Dataset pair gets a new `HistoricalResearchResult`; no previous run
or result is updated. A pair owns a fresh in-memory virtual portfolio, processed
signal set, and trade sequence. A failed pair is persisted as `FAILED`, while
remaining pairs continue. The run completes as `COMPLETED` or
`COMPLETED_WITH_FAILURES`.

Read APIs:

- `GET /v1/historical-research/runs`
- `GET /v1/historical-research/runs/:id`
- `GET /v1/historical-research/runs/:id/report`
- `GET /v1/historical-research/results`

Results can be filtered by strategy, dataset, or market regime.

## Research Results

Each result stores the required identity and metrics:

- Research id
- Dataset id, name, content hash, and market regime
- Strategy id, name, and immutable configuration snapshot
- Exchange, symbol, and timeframe
- Complete virtual trade payload
- Trade count, win rate, net profit, profit factor, and max drawdown
- Operational execution time
- Validation summary and deterministic result hash

Scalar `strategyId`, `marketRegime`, and performance columns are indexed for a
future Strategy × Market Regime matrix. Results preserve every execution and do
not rank or select a winner.

## Research Report

The run stores a lightweight report containing:

- datasets and market regimes
- strategies executed
- result, dataset, strategy, and trade statistics
- aggregate net profit, average win rate, and worst max drawdown
- passed/failed validation counts

The report is descriptive only. It performs no advanced analytics, strategy
selection, AI recommendation, or market-regime inference.

## Validation

Automated coverage verifies:

- defensive chronological replay
- prefix-only evaluator access (no future candles)
- deterministic trades, metrics, and result hashes
- duplicate candle rejection
- duplicate signal/trade prevention
- per-strategy store isolation
- per-dataset failure isolation
- insert-only runs and results
- explicit historical timestamps in `StrategyRunner`
- unchanged Paper Trading execution behavior after extracting the shared state
  machine

## Future Integration

Automatic Research can query immutable result rows by strategy and regime,
aggregate repeated runs, compare multiple regime dimensions, and consume the
stored strategy snapshot/result hash without changing replay semantics. A
future job layer can invoke the same service asynchronously. A dedicated UI can
build the regime matrix from the indexed results API.

## Technical Debt

1. Persisted OHLCV rows are still inherited from the legacy single-symbol
   dataset schema. `symbols` supports future multi-symbol metadata, but v1
   imports and replays one stored symbol per dataset.
2. Replay uses an immutable prefix array per candle. This is simple and
   leakage-safe but is O(n²) in array copying for very large datasets.
3. Execution time is operational and can vary between identical runs; the
   deterministic result hash intentionally excludes it.
4. Research runs execute synchronously in the API process. Large campaigns need
   durable job orchestration, cancellation, progress, and restart recovery.
5. Fees, slippage, short positions, stop loss, and take profit are not part of
   the US016 Paper Trading Executor semantics and therefore are not introduced
   by historical replay v1.
6. Dataset metadata is platform-global because the inherited Dataset model has
   no workspace ownership. Research runs/results are workspace-scoped.
7. A richer report and Strategy × Regime aggregation API remain future work.
