# Research Version History

This document tracks how `researchEngineVersion` and `validationVersion` evolve over time for Knowledge identity.

## Timeline

### 1.0.0 — Initial engine

- First stable research calculation semantics.

### 1.0.1 — Accounting fix

- Backtest/fees accounting semantics changed, affecting resulting metrics and verdicts.

### 1.0.2 — Validation fix

- Validation rules/interpretation semantics changed, affecting `validation.verdict` and `reasons`.

### 1.0.3 — Knowledge identity update

- Knowledge result identity/deduplication logic was updated so that identity is based on engine+validation versions, not only configuration.

## Current versions

- `researchEngineVersion`: `1.0.3`
- `validationVersion`: `1.0.2`
- `knowledgeSchemaVersion`: `2`

## Simulation Platform semantics (apps/api)

The Research & Simulation Platform (Backtesting / Portfolio / Trade / Performance / Simulation Report) is a separate engine from `@trp/research`. Its semantics do **not** affect Knowledge identity, so `researchEngineVersion` is unchanged. Corrections are recorded here for provenance.

### RC-15.1 — Validation Sprint V1 corrections (2026-07-18)

- **PnL identity.** `unrealizedPnL` now represents classic unrealized profit/loss on open positions (`(price − entry) × quantity`), not raw position market value. Raw market value is available separately via `computePositionMarketValue`. This restores `realizedPnL + unrealizedPnL = totalPnL` for every snapshot.
- **Equity accounting.** `equity = initialCapital + realizedPnL + unrealizedPnL`, keeping `cash + market value of open positions = equity` for every snapshot.
- **Determinism.** Equity-curve snapshots are anchored to session / bar timestamps, and CAGR duration is derived from the equity-curve span (wall-clock only as fallback), so identical inputs yield identical business results across repeated runs (operational metadata excluded).
