# TRP — Architecture Snapshot

Last updated: 2026-07-17

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

### Knowledge Domain (US075–US079)

- In-memory `KnowledgeEntry` (`knowledgeId`, `experimentId`, `title`, `summary`, `tags`, `insights`, `metadata`).
- `KnowledgeDomainService`: `create` / `update` / `get` / `list` / `createFromExperiment` / `search` / `searchByTag` / `searchByExperiment` / `find`.
- `KnowledgeExtractionService`: deterministic extract from `Experiment.currentVersion.report` (no AI).
- One KnowledgeEntry per Experiment (upsert; never duplicates).
- Search API: `GET /knowledge?q&tag&experimentId` (AND; case-insensitive; empty array on miss).
- Independent from Prisma research_outcome persistence; coexists in `apps/api/src/modules/knowledge/`.
- KnowledgeEntry stores `experimentId` only (never `sessionId`).
- RC-10 finalized (Knowledge & Experiment Intelligence US075–US079).

### Experiment Domain (US076–US078)

- In-memory `Experiment` (`experimentId`, `sessionId`, `currentVersion`, `versions[]`, `metadata`).
- `ExperimentVersion`: `version`, `report`, optional `replayId`, `createdAt`, `sourceSessionId`.
- `ExperimentDomainService`: `createFromSession` / `createVersion` / `get` / `list`.
- `ExperimentComparisonService`: deterministic `compareVersions` / `compareExperiments` (structural insights/summary/tags/metadata diffs).
- Relationship: CampaignSession → Experiment → KnowledgeEntry (via extraction).
- Independent from Prisma `ExperimentsService` (backtest runner).
- RC-10 finalized (Experiment intelligence US076–US078).

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
- In-memory Campaign Summary (not a DB row).
- Failed experiment runs do not stop the campaign; recorded in `failedRuns`.
- After each `run`, builds `CampaignReport`, creates a `CampaignSession`, and persists it via `CampaignPersistenceService` (COMPLETED or FAILED).

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

- `CampaignReplayService` prepares and executes a `ReplayResult` from a `CampaignSession` (US066–US067).
- `ReplayStatus`: `READY` | `RUNNING` | `COMPLETED` | `FAILED`.
- `execute` reuses `ResearchCampaignService.run(..., { persistSession: false })` then rebuilds report.
- Restores `campaignConfig` (identity + `paramsList` from optional session metadata); no History/Repository writes on replay.
- No Replay HTTP API yet (internal foundation).
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

### Pipeline Domain (US081–US085)

- In-memory `Pipeline` / `PipelineRun` / `PipelineContext` / `PipelineResult` / `PipelineMetadata`.
- `PipelineDomainService`: `createPipeline` / `getPipeline` / `listPipelines` / `createRun` / `getRun` / `listRuns`.
- `PipelineRunStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- `PipelineStep` + `AbstractPipelineStep` + `PipelineStepMetadata` / `PipelineStepResult`.
- `PipelineRegistry`: register/get/list executable steps (Pipeline stores metadata only).
- `PipelineExecutor`: execute by `metadata.order` via registry; context propagation; optional `PipelineRun` lifecycle (PENDING→RUNNING→COMPLETED|FAILED); returns `PipelineResult`.
- `PipelineHook` + `PipelineHookRegistry` + `LoggingPipelineHook`: optional before/after pipeline/step + onError; hook exceptions ignored; observation only.
- `PipelineTemplate` + `PipelineTemplateService`: immutable templates; `createPipelineFromTemplate` yields independent Pipeline copies; built-in Campaign / Replay / Knowledge (step metadata only).
- Generic context only — no Campaign / Experiment / Knowledge coupling.
- No Events, Event Bus, Repository, or HTTP yet.
- RC-11 finalized (Research Pipeline Engine US081–US085).

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
