# TRP — Architecture Snapshot

Last updated: 2026-07-16

Single snapshot of the **current** architecture. Documentation only. No future ideas.

---

## Research Layer

Domain model: [`research-domain-model.md`](./research-domain-model.md).

### Import

- Binance OHLCV import via API.
- Paginated klines (`startTime` / `endTime`, ≤1000 candles per page).
- Dataset stored with `contentHash`, bars, symbol, timeframe.

### Strategy

- Strategy Contract + Registry + Resolver.
- Registered strategies: `ema-crossover`, `donchian-breakout`.
- Generic params; EMA remains benchmark (not MVP promotion baseline).

### Backtest

- Deterministic long-only backtest engine.
- Fee / slippage / initial capital via backtest config.
- Trade PnL includes entry fee (accounting semantics in working tree).

### Validation

- Verdicts: `pass` / `needs_review` / `fail`.
- Threshold-based checks (trades, profit factor, drawdown, expectancy).
- Validation rules are not tuned to force PASS.

### Experiment

- Persisted experiment: dataset, strategy, params (in report), metrics, validation, trades, `configHash`, `gitCommit`.
- Report also carries `researchEngineVersion` and `validationVersion` (working tree).
- Created via `ExperimentsService` / `POST /experiments`.

---

## Knowledge Layer

Domain model: [`knowledge-domain-model.md`](./knowledge-domain-model.md).

### Knowledge

- Type `research_outcome` for PASS / FAIL / NEEDS_REVIEW.
- Payload includes hypothesis, evidence, conclusion, strategyId, params, datasetId, metrics, validation, configHash.
- Written after experiment create (not via separate campaign Knowledge call).

### Versioning

- Single source: `apps/api/src/modules/knowledge/knowledge.version.ts`.
- Identity split: Config Identity vs Result Identity.
- Dedup key uses Result Identity (`configIdentityKey` + engine + validation versions).

### Lineage

- Immutable: old entries are not updated or deleted.
- Forward link: `supersedesKnowledgeId` on new entries.
- Reverse navigation via `getLineage()` lookup.

---

## Campaign Layer

Domain model: [`campaign-domain-model.md`](./campaign-domain-model.md).

### Campaign Runner

- `ResearchCampaignService` runs a params list sequentially through `ExperimentsService`.
- In-memory Campaign Summary (not persisted in DB).
- Failed runs do not stop the campaign; recorded in `failedRuns`.

### Campaign Report

- `CampaignReportService` builds report from Summary + experiments.
- Campaign verdict: PASS / NEEDS_REVIEW / FAIL.
- Deterministic recommendations (no AI).

### Campaign API

- `POST /research-campaigns` → `{ summary, report, experimentIds }`.
- Existing `POST /experiments` unchanged.

---

## Documentation Layer

### Project Status

- Living status: `docs/project/project-status.md`.

### Roadmap

- Direction only: `docs/project/roadmap.md`.

### Version History

- Engine / validation / knowledge semantics: `docs/research/version-history.md`.

### ADR

- Index of accepted decisions: `docs/adr/README.md` (ADR-001…ADR-007).

### Canonical

- Stack / MVP source of truth: `docs/CANONICAL.md`.

---

## Current Versions

| Field                    | Value   |
| ------------------------ | ------- |
| `researchEngineVersion`  | `1.0.3` |
| `validationVersion`      | `1.0.2` |
| `knowledgeSchemaVersion` | `2`     |

Note: versions describe working-tree Research OS semantics; dedicated git release not cut yet.

---

## Current Phase

Research OS Foundation

---

## Known Technical Debt

- Research OS implementation still in working tree (uncommitted); Release Candidate Ready for Commit.
- Legacy Knowledge entries without version fields (structural legacy detection).
- Possible Donchian(10) Knowledge reflecting pre-accounting PASS via earliest configHash.
- EMA full-grid campaign not fully persisted as API experiments.
- No separate `accountingVersion` / runtime env metadata / equity curve on Experiment.
- Research UI still EMA-centric; no strategy filter.

---

## Next User Story

US020 — Campaign UI
