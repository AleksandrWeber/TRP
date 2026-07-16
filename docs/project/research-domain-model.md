# TRP — Research Domain Model

Last updated: 2026-07-16

Read-only description of the **currently implemented** Research Layer.
Sources: `packages/research`, `apps/api` datasets/experiments modules, Prisma `Dataset` / `Experiment`.

---

## Purpose

The Research Layer turns market data and a strategy configuration into a reproducible Experiment:
import OHLCV → resolve strategy → backtest → validate → persist Experiment (and optionally Knowledge via existing side effect).

---

## Main Entities

### Dataset

Persisted market snapshot (`Dataset` + `OhlcvBar`).

- `symbol`, `timeframe`, `exchange` (default `binance`)
- `contentHash` (unique fingerprint of bars)
- `barCount`, `startTime`, `endTime`
- optional `gitCommit` at import time
- bars: timestamp, OHLCV

Import path supports paginated Binance klines with `startTime` / `endTime`.

### Strategy

Code-level entity via Strategy Contract + Registry (not a DB table).

- `id`, `version`, `defaultParams`
- `normalizeParams`, `minBars`, `signals`

Registered today:

- `ema-crossover`
- `donchian-breakout`

Resolved by `resolveStrategy(strategyId)`.

### Strategy Parameters

`StrategyParams` — open record of string | number | boolean | null.

Normalized per strategy before backtest.
Stored on the Experiment inside `report.params` (and hashed into `configHash`).

### Experiment

Persisted research result (`Experiment`).

- Links: `datasetId`
- Strategy identity: `strategyId`, `strategyVersion`
- `configHash` of experiment config (strategy + params + backtest settings)
- `gitCommit` (provenance, not engine version)
- `verdict` (denormalized from validation)
- JSON: `report`, `metrics`, `validation`, `trades`
- `createdAt`
- Relations: optional Knowledge entries, optional deployment

Created by `ExperimentsService.run` / `POST /experiments`.

### Validation

In-process result (`ValidationResult`), also stored on Experiment.

- `verdict`: `pass` | `fail` | `needs_review`
- `reasons[]`
- `checks[]` (name, passed, value, threshold)

Produced by `validateBacktest(metrics)` using default rules (min trades, profit factor, drawdown, expectancy).

### Report

`ExperimentReport` (JSON on Experiment.report).

Includes:

- `strategyId`, `strategyVersion`, `params`, `backtest`
- `metrics`, `validation`
- `tradeCount`, `datasetBarCount`, `generatedAt`
- working-tree additions: `researchEngineVersion`, `validationVersion`

---

## Relationships

```
Dataset 1 ─── * Experiment
Strategy (code) ─── used by Experiment (strategyId + strategyVersion + params)
Experiment ─── contains metrics, validation, trades, report
Experiment ─── * KnowledgeEntry (optional, after create)
Experiment 0..1 ─── StrategyDeployment (production; outside pure research)
```

Config identity for hashing: strategy + strategyVersion + params + backtest config → `configHash`.

---

## Research Lifecycle

1. Import / select Dataset.
2. Choose `strategyId` + params (or defaults).
3. Load bars; resolve strategy; normalize params.
4. Run backtest → trades + metrics (+ equity curve in memory only).
5. Run validation → verdict / reasons / checks.
6. Build report; compute `configHash`; capture `gitCommit`.
7. Persist Experiment.
8. Side effect: attempt Knowledge record (existing Knowledge path).

Campaigns (separate layer) call this lifecycle repeatedly for a params list.

---

## Data Flow

```
Binance / import API
  → Dataset + OhlcvBar

POST /experiments { datasetId, strategyId?, params? }
  → ExperimentsService.run
      → resolveStrategy
      → runBacktest
      → validateBacktest
      → runExperiment (report assembly)
      → hashConfig
      → Experiment.create
      → Knowledge.recordFromExperiment (best-effort)
  → Experiment response
```

---

## Versioning & Provenance

| Field                   | Role                                               |
| ----------------------- | -------------------------------------------------- |
| `dataset.contentHash`   | Dataset fingerprint                                |
| `strategyVersion`       | Strategy code version string                       |
| `configHash`            | Hash of config under test                          |
| `gitCommit`             | Repo commit at experiment create (provenance only) |
| `researchEngineVersion` | Calculation semantics (on report; working tree)    |
| `validationVersion`     | Validation semantics (on report; working tree)     |

Engine version ≠ git commit. Shared constants live in Knowledge version source for working-tree Research OS.

---

## Failure Handling

| Case                           | Behavior                                     |
| ------------------------------ | -------------------------------------------- |
| Unknown `strategyId`           | `resolveStrategy` throws                     |
| Not enough bars                | Backtest throws                              |
| Dataset missing                | `NotFoundException`                          |
| Validation FAIL / NEEDS_REVIEW | Experiment still persisted with that verdict |
| Knowledge write fails          | Logged warning; Experiment still returned    |

No silent PASS; thresholds are not adjusted to force success.

---

## Current Limitations

- Equity curve not persisted (only used to compute metrics).
- Strategy definitions are code/registry only (no Strategy DB table).
- No walk-forward / multi-dataset experiment in one call.
- Research UI remains largely EMA-oriented.
- Full EMA campaign grid may not all exist as API Experiments.
- Dedicated Research OS git release not yet cut (working tree).

---

## Future Extensions

- Persist equity curve artifacts.
- Strategy metadata table / catalog API.
- Walk-forward research schedules.
- Multi-dataset single experiment scope.
- Explicit `accountingVersion` on Experiment.
- Richer Research UI (strategy filter, params, FAIL reasons).
