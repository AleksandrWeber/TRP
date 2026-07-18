# TRP — Architecture Snapshot

Last updated: 2026-07-18 (RC-15.1 Validation Release)

Single snapshot of the **current** architecture (RC-15). Documentation only. No future ideas.

> RC-15.1 Validation Release: the Research & Simulation Platform was validated end-to-end by Validation Sprint V1 (VS001 functional, VS002 stress / determinism, VS003 invariants, VS004 readiness review). No architectural changes were made — only confirmed defect fixes (deterministic CAGR, iterative snapshot summarization, classic PnL / equity accounting) were integrated. Validated invariants: `cash + market value = equity`, `realized + unrealized = total PnL`, deterministic outputs for identical inputs (operational metadata excluded), workspace isolation, and artifact immutability. New debt from the sprint is tracked as TD-028…TD-033 in [`technical-debt.md`](./technical-debt.md).

---

## Research Pipeline Engine (RC-13)

Unified execution and analysis runtime for Research OS pipelines.

```
PipelineTemplateService
        │
        ▼
PipelineExecutor
        │
        ▼
PipelineRegistry
        │
        ├── Execution
        │     ├── Campaign Steps
        │     ├── Replay Steps
        │     └── Knowledge Steps
        │
        └── Analysis
              ├── Insight Steps
              └── Cross-Analysis Steps
```

### Pipeline categories

**Execution**

- Campaign
- Replay
- Knowledge

**Analysis**

- Insight
- CrossCampaign

### Research OS execution

```
Campaign
Replay
Knowledge
Insight
Cross-Campaign Analysis
        │
        ▼
PipelineExecutor
```

```
Insight
        │
        ▼
RecommendationDomainService
        │
        ▼
ResearchReportDomainService.build
```

### Research Intelligence API (read-only)

```
Controller (read-only)
        │
        ▼
Domain Service (search / getById)
        │
        ▼
In-memory Domain Store
```

- Module: `apps/api/src/modules/pipeline/` (+ `steps/campaign/`, `steps/replay/`, `steps/knowledge/`, `steps/insight/`, `steps/cross-analysis/`).
- Single deterministic runtime: steps resolve via `PipelineRegistry` by `metadata.order`.
- No Pipeline HTTP API, Repository, or Event Bus on the engine.

### PipelineContext

Generic fields only:

- `input`
- `output`
- `variables`
- `metadata`

No Campaign / Replay / Knowledge-specific fields on the type. Domain accessors cast known keys only.

### Pipeline Templates

Built-ins (immutable; `PipelineStepMetadata` only — no executable instances on the template):

| Template                | Template ID                        | Steps (order)                                                             |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Campaign                | `campaign-pipeline`                | `campaign.prepare` → `execute` → `aggregate` → `build-report` → `persist` |
| Replay                  | `replay-pipeline`                  | `replay.load` → `restore` → `execute` → `finalize`                        |
| Knowledge               | `knowledge-pipeline`               | `knowledge.prepare` → `extract` → `upsert`                                |
| Insight                 | `insight-pipeline`                 | `insights.prepare` → `extract` → `persist`                                |
| Cross-Campaign Analysis | `cross-campaign-analysis-pipeline` | `cross-analysis.prepare` → `compare` → `persist`                          |

- `PipelineTemplateService.createPipelineFromTemplate` yields independent Pipeline copies.
- Templates never store step class instances.

### Hooks

- `PipelineHook` — optional `beforePipeline` / `afterPipeline` / `beforeStep` / `afterStep` / `onError`
- `PipelineHookRegistry` — register / list (duplicate `hookId` rejected)
- `LoggingPipelineHook` — in-memory lifecycle records (observation only)

Lifecycle only. Hook failures are ignored. No Event Bus / Pub-Sub.

### Supporting types

- `Pipeline` / `PipelineRun` / `PipelineResult` / `PipelineMetadata` (in-memory)
- `PipelineDomainService`: `createPipeline` / `getPipeline` / `listPipelines` / `createRun` / `getRun` / `listRuns`
- `PipelineRunStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`
- `PipelineStep` / `AbstractPipelineStep` / `PipelineStepMetadata` / `PipelineStepResult`

RC-11: engine foundation (US081–US085).  
RC-13: Execution (Campaign / Replay / Knowledge) + Analysis (Insight / Cross-Campaign) pipelines; Recommendation / ResearchReport domains; Research Intelligence read-only REST (US095–US101).

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

### Knowledge (Prisma `research_outcome`)

- Type `research_outcome` for PASS / FAIL / NEEDS_REVIEW.
- Payload includes hypothesis, evidence, conclusion, strategyId, params, datasetId, metrics, validation, configHash.
- Written after experiment create (not via separate campaign Knowledge call).

### Knowledge Domain (US075–US079, US090)

- In-memory `KnowledgeEntry` (`knowledgeId`, `experimentId`, `title`, `summary`, `tags`, `insights`, `metadata`).
- `KnowledgeDomainService` — public API (`create` / `update` / `get` / `list` / `search` / `searchByTag` / `searchByExperiment` / `find`) **and** orchestrator for `createFromExperiment`.
- Role: public API + orchestration only. Extraction business logic lives in Knowledge Pipeline Steps.
- `KnowledgeExtractionService`: deterministic extract from `Experiment.currentVersion.report` (no AI); used by `ExtractKnowledgeStep`.
- One KnowledgeEntry per Experiment (upsert; never duplicates).
- Search API: `GET /knowledge?q&tag&experimentId` (AND; case-insensitive; empty array on miss).
- Extraction path: `KnowledgeDomainService.createFromExperiment` → `PipelineTemplateService` → `PipelineExecutor` → Knowledge steps (`knowledge.prepare` → `knowledge.extract` → `knowledge.upsert`).
- Independent from Prisma `research_outcome` persistence; coexists in `apps/api/src/modules/knowledge/`.
- KnowledgeEntry stores `experimentId` only (never `sessionId`).
- RC-10 finalized (Knowledge & Experiment Intelligence US075–US079).

### Experiment Domain (US076–US078)

- In-memory `Experiment` (`experimentId`, `sessionId`, `currentVersion`, `versions[]`, `metadata`).
- `ExperimentVersion`: `version`, `report`, optional `replayId`, `createdAt`, `sourceSessionId`.
- `ExperimentDomainService`: `createFromSession` / `createVersion` / `get` / `list`.
- `ExperimentComparisonService`: deterministic `compareVersions` / `compareExperiments` (structural insights/summary/tags/metadata diffs).
- Relationship: CampaignSession → Experiment → KnowledgeEntry (via extraction pipeline).
- Independent from Prisma `ExperimentsService` (backtest runner).
- RC-10 finalized (Experiment intelligence US076–US078).

### Insight Domain (US095–US096)

- In-memory `Insight` (`id`, optional `campaignSessionId` / `experimentId`, `knowledgeEntryIds[]`, `type`, `title`, `summary`, `confidence`, `sources`, `metadata`, `createdAt`).
- `InsightType`: `PATTERN` | `ANOMALY` | `CORRELATION` | `TREND` | `SUMMARY` | `OBSERVATION`.
- `InsightSource`: `Campaign` | `Experiment` | `Knowledge` | `AIAnalysis`.
- `InsightMetadata`: optional `model` / `promptVersion` / `executionTime` / `pipelineRunId`.
- `InsightDomainService`: `create` / `update` / `delete` / `getById` / `search` / `extractFromKnowledge`.
- Insight Pipeline (US096): `insights.prepare` → `insights.extract` → `insights.persist` via `PipelineExecutor`; built-in template `insight-pipeline`.
- Deterministic extraction only (summary / consistent trend / repeated observation / conflicting verdicts) — no LLM.
- Knowledge remains factual observations; Insight references Knowledge via `knowledgeEntryIds` only — does not duplicate KnowledgeEntry contents.
- No Jobs / Export / Import / Prisma / Repository coupling; Campaign / Replay / Knowledge pipelines unchanged.
- Module: `apps/api/src/modules/insight/` (`InsightModule`); steps under `pipeline/steps/insight/`.
- Read-only REST (US100): `GET /insights`, `GET /insights/:id`.

### Cross-Campaign Analysis (US097)

- `CrossCampaignAnalysisService.analyze(sessions, knowledgeEntries?, insights?)` → `CrossCampaignAnalysisResult`.
- Pipeline: `cross-analysis.prepare` → `cross-analysis.compare` → `cross-analysis.persist` via `PipelineExecutor`; built-in template `cross-campaign-analysis-pipeline`.
- Deterministic findings only: repeated findings, recurring patterns, conflicting conclusions, stable trends, unique observations.
- Read-only over Campaign / Experiment refs / Knowledge / Insight inputs; write-only via `InsightDomainService`.
- Result: `id`, `comparedCampaignIds`, `findings`, `statistics`, `generatedInsightIds`, `createdAt` (stored after `analyze` for API lookup).
- No AI / Report Builder.
- Module: `apps/api/src/modules/cross-campaign-analysis/`; steps under `pipeline/steps/cross-analysis/`.
- Read-only REST (US100): `GET /cross-campaign-analysis`, `GET /cross-campaign-analysis/:id`.

### Recommendation Domain (US098)

- In-memory `Recommendation` (`id`, `insightIds[]`, `campaignSessionIds[]`, `type`, `priority`, `title`, `description`, `rationale`, `metadata`, `createdAt`).
- `RecommendationType`: `REPEAT_EXPERIMENT` | `EXPAND_SCOPE` | `VERIFY_RESULT` | `INVESTIGATE_ANOMALY` | `COMPARE_MODELS` | `COLLECT_MORE_DATA`.
- `RecommendationPriority`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`.
- `RecommendationMetadata`: optional `confidence` / `generatedBy` / `ruleId` / `pipelineRunId`.
- `RecommendationDomainService`: `create` / `update` / `delete` / `getById` / `search` / `generateFromInsights`.
- Deterministic generation only (pattern → repeat; conflict → verify; trend → expand; anomaly → investigate; model disagreement → compare; insufficient evidence → collect more data).
- Insight remains analytical conclusions; Recommendation is actionable guidance referencing `insightIds` only — does not duplicate Insight payload.
- No PipelineExecutor / Jobs / Export / Import / Prisma / Repository / AI coupling.
- Module: `apps/api/src/modules/recommendation/` (`RecommendationModule`).
- Read-only REST (US100): `GET /recommendations`, `GET /recommendations/:id`.

### Research Report Domain (US099)

- In-memory `ResearchReport` (`id`, `campaignSessionIds[]`, `knowledgeEntryIds[]`, `insightIds[]`, `recommendationIds[]`, `sections[]`, `metadata`, `createdAt`).
- `ReportSection`: `type` (`EXECUTIVE_SUMMARY` | `FINDINGS` | `INSIGHTS` | `RECOMMENDATIONS` | `REFERENCES`) + `itemIds[]`.
- `ReportMetadata`: optional counts / `generatedBy`.
- `ResearchReportDomainService`: `create` / `getById` / `search` / `build`.
- `build()` aggregates Campaign / Knowledge / Insight / Recommendation into a structured report — id references only; no narrative / formatting / export.
- Aggregation layer only; does not duplicate entity payloads.
- No Pipeline / AI / Export / Prisma / Repository coupling.
- Module: `apps/api/src/modules/research-report/` (`ResearchReportModule`).
- Read-only REST (US100): `GET /reports`, `GET /reports/:id`.

### Research Intelligence API (US100)

- Read-only controllers: `InsightController`, `RecommendationController`, `ResearchReportController`, `CrossCampaignAnalysisController`.
- List envelope: `HistoryPage<T>` (same as Campaign History).
- Query: `page` / `pageSize` / `sortBy` / `sortOrder` + domain filters.
- Controllers → Domain Services → in-memory stores only (no generate / build / pipeline execute).

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

- `ResearchCampaignService` — **orchestrator only** (US088).
- Execution: `PipelineTemplateService` (Campaign built-in) → `PipelineExecutor` → Campaign Pipeline Steps.
- Business logic: Pipeline Steps only (`PrepareCampaignStep` / `ExecuteResearchStep` / `AggregateResultStep` / `BuildReportStep` / `PersistCampaignStep`).
- Public `run()` contract unchanged (REST / Jobs / Persistence / History compatible).
- In-memory Campaign Summary (not a DB row).
- Failed experiment runs do not stop the campaign; recorded in `failedRuns`.
- On success (when `persistSession` is true): builds `CampaignReport`, creates a `CampaignSession`, persists via `CampaignPersistenceService` (COMPLETED). FAILED path preserves session persistence contract.

### Campaign Session & Persistence

- `CampaignSession` owns report + status + metadata (US053).
- `CampaignPersistenceService` writes sessions as `CampaignRecord` (in-memory Map).
- `CampaignHistoryService` is the read path (filter → sort → paginate).
- `CampaignRecord` never leaves Persistence / History services.

### Campaign History API

- `GET /campaign-history` → `HistoryPage<CampaignSession>` (page / sort / filters).
- `GET /campaign-history/:sessionId` → `CampaignSession` or 404.

### Campaign Export

- `CampaignExportService` exports a `CampaignSession` as JSON or CSV (`ExportFormat`).
- Strategy exporters: `JsonCampaignExporter`, `CsvCampaignExporter`.
- Input is `CampaignSession` only — never `CampaignRecord`.
- `GET /campaign-history/:sessionId/export?format=json|csv` (US062).
- HTTP docs: [`api.md`](./api.md).
- RC-07 finalized (Session Persistence + History + Export).

### Campaign Import

- `CampaignImportService` imports a payload into a `CampaignSession` (`ImportFormat.JSON` initial).
- Strategy importer: `JsonCampaignImporter` (string → validated session).
- `CampaignSessionValidator` + `ImportValidationError` (US064): schema, metadata, report, timestamps, engineVersion.
- `POST /campaign-import` (US065): body `{ format, payload }` → `CampaignSession`; does not persist.
- HTTP docs: [`api.md`](./api.md).

### Campaign Replay

- `CampaignReplayService` — **orchestrator only** (US089).
- Role: prepare (`create` / `buildContext`) + execute via Pipeline Engine.
- Replay executed through `PipelineExecutor` (Replay built-in template).
- Steps: `replay.load` → `replay.restore` → `replay.execute` → `replay.finalize`.
- `ReplayStatus`: `READY` | `RUNNING` | `COMPLETED` | `FAILED`.
- `replay.execute` reuses `ResearchCampaignService.run(..., { persistSession: false })`; finalize rebuilds report.
- Restores `campaignConfig` (identity + `paramsList` from optional session metadata); no History/Repository writes on replay.
- Identical `ReplayResult` shape; no Replay HTTP API yet (internal foundation).
- RC-08 finalized (Import + Replay).

### Jobs

- `JobService` creates in-memory `Job` entities (`CAMPAIGN` / `REPLAY`) in `PENDING` status (US069–US073).
- `JobQueue` abstraction via `JOB_QUEUE` token; default `InMemoryJobQueue` (FIFO; `list` / `get` / `cancel`).
- Create path: build job → `enqueue` → return `PENDING` job.
- Cancel path: PENDING → CANCELLED only; RUNNING/COMPLETED/FAILED/CANCELLED → conflict.
- `BackgroundJobRunner` processes jobs: RUNNING → Campaign/Replay execute → COMPLETED|FAILED (`JobResult`); skips CANCELLED.
- Job Status API: `GET /jobs`, `GET /jobs/:jobId`.
- Job Cancellation API: `POST /jobs/:jobId/cancel` (200 / 404 / 409).
- `JobStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- No scheduler or job persistence yet.
- RC-09 finalized (Jobs framework US069–US073).

### Campaign Report

- `CampaignReportService` builds report from Summary + experiments.
- Campaign verdict: PASS / NEEDS_REVIEW / FAIL.
- Deterministic recommendations (no AI).

### Campaign API

- `POST /research-campaigns` → `{ summary, report, experimentIds }`.
- `POST /campaigns/run` → `CampaignSummary`.
- Existing `POST /experiments` unchanged.

---

## Documentation Layer

### Project Status

- Living status: `docs/project/project-status.md`.

### Technical Debt

- Living register: `docs/project/technical-debt.md`.

### Module Maturity

- Living matrix: `docs/project/module-maturity.md`.

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

RC-13 finalized — Research Intelligence layer (Insight / Cross-Campaign / Recommendation / ResearchReport + read-only REST) on the unified Pipeline Engine.

RC-14 finalized — production SaaS foundation (Identity / Auth / RBAC / Workspace / Prisma drivers / Queue / Logging / Metrics / Validation / API versioning).

---

## Simulation Stack (RC-15)

Historical market data → backtest / walk-forward → portfolio & trades → performance → comparison → immutable simulation report.

**No paper trading. No live trading. No broker integration. No Simulation REST / UI.**

### Modules (`apps/api/src/modules/`)

| Module             | Path                    | Role                                                         |
| ------------------ | ----------------------- | ------------------------------------------------------------ |
| MarketData         | `market-data/`          | OHLCV domain (`MarketBar`), in-memory repo, workspace-scoped |
| HistoricalImport   | `historical-import/`    | Pluggable CSV import → `MarketDataDomainService.saveBars`    |
| MarketDataProvider | `market-data-provider/` | `MarketDataProvider` + `ProviderRegistry` (local first)      |
| Backtesting        | `backtesting/`          | `BacktestEngine` + `Strategy` / `StrategyContext`            |
| Portfolio          | `portfolio/`            | `PortfolioEngine` state (cash / equity / PnL)                |
| Trade              | `trade/`                | Virtual `TradeEngine` → `PortfolioEngine.applyExecution`     |
| Performance        | `performance/`          | `PerformanceAnalyzer` → immutable `PerformanceReport`        |
| WalkForward        | `walk-forward/`         | Rolling windows; reuses `BacktestEngine` sequentially        |
| StrategyComparison | `strategy-comparison/`  | Rankings + weighted overall winner from completed results    |
| SimulationReport   | `simulation-report/`    | `SimulationReportBuilder` → immutable consolidated artifact  |

### Dependency direction (acyclic)

```
MarketData
    ▲
    │
HistoricalImport          MarketDataProvider (local → MarketDataDomainService)
                                │
                                ▼
                          Backtesting ──► Trade ──► Portfolio
                                │
                                ▼
                          Performance          (analyzes completed run artifacts)
                                │
                     WalkForward ──► Backtesting (reuse only)
                                │
              StrategyComparison ──► BacktestResult / WalkForwardResult / PerformanceReport
                                │
              SimulationReport   ──► completed artifacts only
                                     (session + backtest ± walk-forward + portfolio
                                      + trades + performance ± comparisonScore)
```

**Forbidden / verified absent**

- Cycles among RC-15 modules (Performance uses `BacktestRunSummary`, not `BacktestResult`, so Backtesting → Performance is one-way).
- `BacktestEngine` knowledge of `SimulationReport`, `StrategyComparison`, UI, or REST.
- Simulation / Strategy Comparison / Performance HTTP controllers.

### Runtime flow

```
ProviderRegistry.fetchHistorical(local)
        │
        ▼
BacktestEngine.run(session, strategy)
        │  owns PortfolioEngine + TradeEngine per session
        │  Strategy.onBar may call TradeEngine
        │  optional snapshotSink for report assembly
        ▼
PerformanceAnalyzer.analyze → BacktestResult.performance
        │
        ├── WalkForwardEngine (N sequential BacktestEngine runs)
        ├── StrategyComparisonService.compare([...])
        └── SimulationReportBuilder.build({ session, backtest, portfolio, snapshots, trades, ... })
```

### Strategy contract

- `Strategy` receives `StrategyContext` `{ trades, portfolio }`.
- Strategies must not import repositories or providers.
- Intended trading path: `context.trades.openTrade` / `closeTrade` (portfolio updates via TradeEngine).

### Workspace isolation

| Layer              | Mechanism                                              |
| ------------------ | ------------------------------------------------------ |
| MarketData         | `workspaceId` on `MarketBar` + all repo queries        |
| HistoricalImport   | Input `workspaceId` stamped on persisted bars          |
| MarketDataProvider | `HistoricalDataRequest.workspaceId`                    |
| Backtesting        | `BacktestSession.workspaceId` → provider fetch         |
| WalkForward        | `WalkForwardSession.workspaceId` → provider + backtest |
| Portfolio          | `workspaceId` on initialize                            |
| SimulationReport   | Session slice includes `workspaceId`                   |

Performance / StrategyComparison operate on already-scoped completed artifacts.

### Audit (US125)

- Dependency graph verified acyclic after Performance↔Backtesting decoupling.
- Layering matches Provider → Backtesting → Trade → Portfolio; Performance consumes run outputs.
- SimulationReport depends on completed artifacts only.
- Tests + build green at RC-15 closeout.

---

## Known Technical Debt

Living register: [`technical-debt.md`](./technical-debt.md) (US093).

RC-13 notes:

- TD-009 Accepted — Nest `forwardRef` cycle
- TD-010 Planned — Extract `InsightGenerationService`
- Accepted Legacy (do not expand; migrate RC-14+): `CampaignReport.recommendations`, `KnowledgeEntry.insights` string[], `ResearchAnalysis` parallel stack (TD-011–TD-013)

Research/data notes:

- Legacy Knowledge entries without version fields (structural legacy detection).
- Possible Donchian(10) Knowledge reflecting pre-accounting PASS via earliest configHash.
- EMA full-grid campaign not fully persisted as API experiments.
- No separate `accountingVersion` / runtime env metadata / equity curve on Experiment.
- Research UI still EMA-centric; no strategy filter.

---

## Next User Story

RC-15 release finalize (commit / tag) after US125 audit.
