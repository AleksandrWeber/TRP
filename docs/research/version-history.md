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
