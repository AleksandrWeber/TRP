# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for Research Engine / Validation / Knowledge Schema versions tracked in
`docs/project/project-status.md` and `docs/research/version-history.md`.

## [Unreleased]

### Added

- RC-16 M1 US126 — Live Market Data Domain Contracts
  (`apps/api/src/modules/live-market-data/`): immutable provider-neutral
  closed-candle, mark-price, and market-status events plus subscription and
  checkpoint contracts.
- RC-16 M1 US127 — Market Event Identity and Timestamp Semantics: deterministic
  stream IDs, semantic deduplication identity independent of UUID/operational
  clocks, distinct exchange/domain vs received/processed/recorded timestamps.
- RC-16 M1 US128 — Transactional Outbox Persistence (`event-processing/`):
  ADR-013 durable envelope, atomic accepted-state + Outbox commit, immutable
  envelopes with mutable delivery metadata, ordered unpublished retrieval,
  Prisma `OutboxEvent` model.
- RC-16 M1 US129 — Consumer Inbox and Checkpoints: unique `consumerId+eventId`,
  duplicate no-op, atomic Inbox+projection+checkpoint, blocked-gap deferral,
  restart-surviving checkpoints, Prisma Inbox/Checkpoint models.
- RC-16 M1 US131 — Live Market Connector Port and Registry: public-stream
  connector port, duplicate-source registration guard, fake connector tests
  without network access.
- RC-16 M1 US132 — Binance REST Metadata and Backfill Adapter: exchangeInfo
  precision mapping, bounded closed-candle backfill, rate-limit retry; Binance
  payloads remain adapter-internal.
- RC-16 M1 US133 — Binance WebSocket Connection Lifecycle: explicit connection
  states, subscription ack tracking, idempotent subscribe/unsubscribe, clean
  shutdown, raw messages retained inside adapter; no private credentials.
  Epic E2-A complete.
- RC-16 M1 US134 — Connector Reconnect and Rate-Limit Resilience: immediate
  disconnect health transition, bounded reconnect backoff/jitter, heartbeat
  timeout, non-busy-loop rate-limit delays, RECOVERING until gap recovery.
  Epic E2-B complete.
- RC-16 M1 US135 — Closed-Candle Normalization: reject open candles; OHLC
  validation; semantic equality independent of operational clocks; Binance
  kline mapping stays adapter-internal.
- RC-16 M1 US136 — Mark-Price Normalization: positive finite price; explicit
  mark source; deterministic identity; configurable publication/retention
  policy; no Position/Portfolio/fill logic.
- RC-16 M1 US137 — Data Validation and Quarantine: invalid drafts quarantine
  with reason + raw fingerprint (secrets stripped); stream-safe per-draft
  failures. Epic E3-A complete.
- RC-16 M1 US138 — Duplicate and Stream-Ordering Control: semantic/event-id
  dedup, per-stream sequence admit, stale ignore+metrics, deferred gap blocks
  only the affected stream (no global order).
- RC-16 M1 US139 — Gap Detection and REST Recovery: deterministic candle gaps,
  REST backfill via same validate/admit path, overlap elimination, RECOVERING
  until close, unresolved gaps remain visible. Epic E3-B / Epic E3 complete.

- RC-16 M1 US140 — Workspace-Scoped Subscription Registry: deterministic
  workspace-scoped identity, idempotent subscribe/unsubscribe, desired state
  survives connector replacement, strict workspace isolation.
- RC-16 M1 US141 — Durable Market Stream Checkpoints: Prisma-backed
  market_stream_checkpoints, advance gated on durable event recording,
  regression rejected, heartbeat separate from semantic progress. Epic E4-A
  complete. Fixed eslint unused-import in accepted-market-stream-state.

RC-15.1 is released. RC-16 M1 Epic E4-A complete (US140–US141).

### Added (architecture)

- RC-16 Paper Trading Platform planning document:
  `docs/project/rc-16-paper-trading-plan.md`.
- RC-16 Architecture Freeze ADRs:
  - ADR-012 — Execution Architecture.
  - ADR-013 — Event Processing Model.
  - ADR-014 — Runtime Lifecycle.
  - ADR-015 — Accounting Model.
  - ADR-016 — Risk & Safety Model.
  - ADR-017 — Module Boundaries.
  - ADR-018 — Architectural Invariants.
- RC-15 Retrospective & Development Guide v2, including the official
  Architecture Freeze lifecycle gate.
- RC-16 Frozen Architecture Audit: PASS WITH MINOR RECOMMENDATIONS;
  Architecture Approved and Implementation Approved.
- RC-16 implementation-readiness handoff:
  `docs/project/rc-16-implementation-readiness.md`.

- Paginated Binance historical import (startTime/endTime).
- Multi-Strategy Foundation (Strategy Contract, Registry, Resolver).
- Donchian Breakout strategy.
- Knowledge Layer (`research_outcome`) with Result Identity dedup and immutable lineage.
- Experiment provenance fields: `researchEngineVersion`, `validationVersion` (separate from `gitCommit`).
- Campaign Layer: sequential Campaign Runner + in-memory Campaign Summary.
- Campaign Report Builder with campaign verdict and deterministic recommendations.
- Campaign API: `POST /research-campaigns` returns summary + report + experimentIds.
- Campaign API: `POST /campaigns/run` returns `CampaignSummary` via existing `ResearchCampaignService`.
- Web client: `runCampaign()` helper calls `POST /campaigns/run` and returns `CampaignSummary`.
- Campaign Run page (MVP): form for datasetId / strategyId / paramsList JSON → `runCampaign()`.
- Campaign Results page (MVP): shows CampaignSummary fields + display verdict/recommendations after run.
- Campaign History view (MVP): localStorage list of CampaignSummary after each successful run (newest first).
- Deterministic Research Analysis service: `buildAnalysis(CampaignReport)` → executiveSummary / strengths / weaknesses / recommendations / nextHypothesis (no external AI).
- Research Analysis API/UI: `POST /campaigns/analyze` + `CampaignAnalysisView` on Campaign Results page.
- Multi-dataset Campaign runner: `MultiDatasetCampaignService` reuses `ResearchCampaignService` per dataset and aggregates summaries.
- Multi-dataset Campaign API: `POST /campaigns/run-multi` returns `MultiDatasetCampaignSummary`.
- Multi-dataset Campaign UI: `MultiDatasetCampaignPage` runs `/campaigns/run-multi` and renders summary + per-dataset table.
- Walk-Forward Campaign foundation (US037): `WalkForwardCampaignService` validates request and returns empty `WalkForwardCampaignSummary` (stub; no real walk-forward yet).
- Walk-Forward Window Builder (US038): `buildWalkForwardWindows()` produces inclusive train/test index windows; service returns `windowCount` + `windows` (no experiments).
- Walk-Forward Campaign Runner (US039): one `ResearchCampaignService.run` per window; returns successful/failed window counts.
- Walk-Forward Aggregate Report (US040): averages, best/worst window, verdict counts, and `overallVerdict` over successful windows only.
- Walk-Forward Analysis (US041): deterministic `WalkForwardAnalysisService` with stability/consistency scores and ROBUST / PROMISING / UNSTABLE / UNUSABLE assessment (no AI).
- Walk-Forward API (US042): `POST /campaigns/run-walk-forward` returns `WalkForwardCampaignSummary` via existing `WalkForwardCampaignService`.
- Walk-Forward UI (US043): `WalkForwardCampaignPage` at `/campaigns/walk-forward` (summary + window table; no Analysis).
- Project documentation workflow: living Project Status, ADR Index, Version History, Release Process, Roadmap.
- Root `CHANGELOG.md` (this file).
- Release Candidate docs: Ready for Commit for Research OS (US003–US019, US020A–US020B) + documentation (DOC-021–DOC-024, US025–US026, US025A–US025C), pending explicit commit sequence.
- Architecture Snapshot: `docs/project/architecture-snapshot.md` (current-state only).
- Campaign Domain Model: `docs/project/campaign-domain-model.md` (implemented Campaign Layer only).
- Research Domain Model: `docs/project/research-domain-model.md` (implemented Research Layer only).
- Knowledge Domain Model: `docs/project/knowledge-domain-model.md` (implemented Knowledge Layer only).
- ADR-007 — Campaign Layer: `docs/adr/ADR-007-campaign-layer.md` (Accepted).
- ADR-008 — Deterministic Research Analysis: `docs/adr/ADR-008-deterministic-research-analysis.md` (Accepted).
- ADR-009 — Multi-dataset Campaign: `docs/adr/ADR-009-multi-dataset-campaign.md` (Accepted).
- ADR-010 — Walk-Forward Architecture: `docs/adr/ADR-010-walk-forward-architecture.md` (Accepted).
- ADR-011 — Dataset Slice Architecture: `docs/adr/ADR-011-dataset-slice-architecture.md` (Accepted).
- Dataset Slice Domain Model (US045): `@trp/research` `createSliceRef` / `resolveSlice` over in-memory bars (immutable `SliceRef`, no DB).
- Experiment Slice Support (US046): `runExperiment` accepts optional `SliceRef`; report gets `sliceIdentity` only for sliced runs (Engine unchanged).
- Campaign Slice Support (US047): `ResearchCampaignService.run` accepts optional `sliceRef`; CampaignReport may include `sliceIdentity`.
- True Walk-Forward Execution (US048): per-window Train/Test `SliceRef`; campaign runs on Train only; `trainSliceIdentity` / `testSliceIdentity` provenance (test evaluation deferred).
- Walk-Forward Test Evaluation (US049): best train experiment re-run on Test SliceRef; window train/test metrics & verdicts; aggregate still train-based.
- Walk-Forward Aggregate v2 (US050): Test Aggregate block + `overallVerdict` from Test only; Train Aggregate retained for reference.
- Campaign Persistence Domain (US051): `CampaignRecord`, `CampaignRepository`, `CampaignMapper`, `InMemoryCampaignRepository` (Map-backed; not wired to Campaign execution).
- Campaign Persistence Service (US052): `CampaignPersistenceService` injects repository, maps `CampaignReport` ↔ `CampaignRecord`, never exposes storage model externally.
- Campaign Session Model (US053): `CampaignSession` / `CampaignSessionStatus` / `CampaignSessionFactory` (CREATED sessions; no persistence).
- Persist Campaign Session (US054): `CampaignPersistenceService` persists `CampaignSession` via `CampaignSessionMapper` and session-shaped `CampaignRecord`.
- Integrate Campaign Persistence (US055): each `ResearchCampaignService.run` persists one COMPLETED or FAILED `CampaignSession` (DI; in-memory).
- Campaign History Query Service (US056): read-only `CampaignHistoryService` returns `CampaignSession` via repository + mapper.
- Campaign History Search & Filters (US057): `search(HistoryQuery)` filters by status / engineVersion / datasetId / tags (AND; Repository unchanged).
- Campaign History Pagination & Sorting (US058): `search(query, pageRequest)` returns `HistoryPage` after filter → sort → paginate.
- Campaign History API (US059): `GET /campaign-history` (paged/filtered) and `GET /campaign-history/:sessionId` (404 if missing).
- Export Foundation (US061): `CampaignExportModule` with Strategy Pattern JSON/CSV exporters; `CampaignExportService` accepts `CampaignSession` only (no HTTP API yet).
- Export API (US062): `GET /campaign-history/:sessionId/export?format=json|csv` (HistoryService → ExportService; 200/400/404; Content-Type).
- Import Foundation (US063): `CampaignImportModule` with Strategy Pattern JSON importer; `CampaignImportService` returns `CampaignSession` only (no persist / no HTTP API).
- JSON Import Validation (US064): `CampaignSessionValidator` + `ImportValidationError`; parse → validate metadata/report/timestamps/version → `CampaignSession`.
- Import API (US065): `POST /campaign-import` with `{ format: "json", payload }` → `CampaignSession` (200) or 400; does not persist.
- Replay Foundation (US066): `CampaignReplayModule` prepares `ReplayResult` from `CampaignSession` (READY; report copy; no execution/AI/persist/API).
- Replay Execution (US067): `CampaignReplayService.execute` reuses `ResearchCampaignService.run` with `persistSession: false`; READY→RUNNING→COMPLETED|FAILED; regenerated report.
- Job Domain Model (US069): `JobsModule` with `Job` / `JobResult` / `JobMetadata`, `JobStatus` / `JobType`, create-only `JobService` (no queue/execution/persist/API).
- Job Queue Abstraction (US070): `JobQueue` + `JOB_QUEUE` token + `InMemoryJobQueue`; job create auto-enqueues as `PENDING` (no worker/BullMQ/Redis).
- Background Campaign Runner (US071): `BackgroundJobRunner` executes CAMPAIGN via `ResearchCampaignService` and REPLAY via `CampaignReplayService`; stores `JobResult`; no job persistence.
- Job Status API (US072): read-only `GET /jobs` and `GET /jobs/:jobId` via `JobController` → `JobService` → `JobQueue` (404 if missing; no processing).
- Job Cancellation (US073): `POST /jobs/:jobId/cancel` cancels PENDING only (409 otherwise); `BackgroundJobRunner` skips CANCELLED; no execution result.
- Knowledge Domain Model (US075): in-memory `KnowledgeEntry` / `KnowledgeMetadata` / `KnowledgeTag` + `KnowledgeDomainService` (`create` / `update` / `get` / `list`); no Repository / API.
- Experiment Entity & Versioning (US076): in-memory `Experiment` / `ExperimentVersion` / `ExperimentMetadata` + `ExperimentDomainService` (`createFromSession` / `createVersion` / `get` / `list`); CampaignSession → Experiment → future KnowledgeEntry via `experimentId`.
- Knowledge Extraction Pipeline (US077): deterministic `KnowledgeExtractionService.extract` from `Experiment.currentVersion.report` + `createFromExperiment` upsert (one entry per experiment; no AI).
- Experiment Comparison Service (US078): deterministic structural `compareVersions` / `compareExperiments` (insights/summary/tags/metadata; no AI/similarity).
- Knowledge Search API (US079): `GET /knowledge` over in-memory `KnowledgeEntry` with `q` / `tag` / `experimentId` (AND; case-insensitive; no vectors).
- Pipeline Domain Model (US081): in-memory `Pipeline` / `PipelineRun` / `PipelineContext` / `PipelineResult` / `PipelineMetadata` + `PipelineDomainService` (no executor/API/Repository).
- Pipeline Step Contract (US082): `PipelineStep` + `AbstractPipelineStep` + `PipelineStepMetadata` / `PipelineStepResult` + `PipelineRegistry`; Pipeline stores metadata only.
- Pipeline Executor (US083): `PipelineExecutor` resolves registered steps by `metadata.order`, propagates context, updates optional `PipelineRun` lifecycle, returns `PipelineResult` (no persistence/API).
- Pipeline Hooks (US084): `PipelineHook` + `PipelineHookRegistry` + `LoggingPipelineHook`; executor lifecycle callbacks; hook failures ignored; no Events/bus.
- Pipeline Templates (US085): `PipelineTemplate` + `PipelineTemplateService`; built-in Campaign / Replay / Knowledge templates (step metadata only); `createPipelineFromTemplate` yields independent Pipeline copies.
- Campaign Pipeline Steps (US087): `PrepareCampaignStep` / `ExecuteResearchStep` / `AggregateResultStep` / `BuildReportStep` / `PersistCampaignStep`; registered on `PipelineRegistry`; Campaign template metadata updated; `ResearchCampaignService` unchanged (no executor wiring).
- Execute Campaign through PipelineExecutor (US088): `ResearchCampaignService` orchestrates Campaign via built-in template + `PipelineExecutor` + in-memory `PipelineRun`; public contract / REST / Jobs / Replay unchanged.
- Replay Pipeline Integration (US089): `LoadReplaySessionStep` / `RestoreReplayContextStep` / `ExecuteReplayCampaignStep` / `FinalizeReplayStep`; registered on `PipelineRegistry`; Replay template metadata updated; `CampaignReplayService` orchestrates via template + `PipelineExecutor`; identical `ReplayResult` / Jobs / History.
- Knowledge Extraction Pipeline Integration (US090): `PrepareKnowledgeExtractionStep` / `ExtractKnowledgeStep` / `UpsertKnowledgeEntryStep`; registered on `PipelineRegistry`; Knowledge template metadata updated; `KnowledgeDomainService.createFromExperiment` orchestrates via template + `PipelineExecutor`; identical KnowledgeEntry / upsert / Experiment compatibility.
- Architecture Snapshot Synchronization (US092): `architecture-snapshot.md` aligned to RC-12 unified Pipeline Engine runtime (Campaign / Replay / Knowledge orchestrators; generic PipelineContext; metadata-only templates; lifecycle hooks; no Event Bus); docs only.
- Technical Debt Register (US093): living `docs/project/technical-debt.md` (Accepted / Deferred / Planned; infrastructure debt + possible RC milestones); linked from Project Status; docs only.
- Module Maturity Matrix (US094): living `docs/project/module-maturity.md` (status / scope / limitations / next milestone per major module); linked from Project Status; docs only.
- Insight Domain (US095): in-memory `Insight` / `InsightType` / `InsightSource` / `InsightMetadata` + `InsightDomainService` (`create` / `update` / `delete` / `getById` / `search`); references Knowledge ids only; no AI / Pipeline / REST / Prisma.
- Insight Extraction Pipeline (US096): `insights.prepare` / `insights.extract` / `insights.persist`; built-in Insight template; deterministic rules; `InsightDomainService.extractFromKnowledge` via `PipelineExecutor`; Campaign / Replay / Knowledge pipelines unchanged.
- Cross-Campaign Analysis (US097): `CrossCampaignAnalysisService` + pipeline; result store for API lookup (`id` / `createdAt`); writes Insights via `InsightDomainService`.
- Recommendation Engine (US098): in-memory domain + deterministic `generateFromInsights`.
- Research Report Domain (US099): in-memory aggregation via `build()` (id refs only).
- Research Intelligence API (US100): read-only REST — `GET /insights`, `/recommendations`, `/reports`, `/cross-campaign-analysis` (+ `/:id`); `HistoryPage` envelope; pagination / sorting / filtering; domain services only.
- RC-14 — Production SaaS foundation (`feat(rc14)` / tag `rc-14`).
- RC-15 — Research & Simulation Platform (US115–US125): Market Data, Historical Import, Market Data Provider, Backtesting Engine, Walk-Forward Engine, Portfolio Simulation, Trade Execution Simulation, Performance Metrics, Strategy Comparison, Simulation Report + RC-15 Architecture Audit.
- Validation Sprint V1 harnesses (RC-15.1): VS001 functional-validation suite, VS002 stress runner (`vs002-stress-runner.ts`; synthetic 10k / 100k / 1M-bar workloads with memory / CPU / determinism capture), VS003 consistency & invariant suite; simulation-report large-array regression test.

### Fixed

- RC-15.1 Validation Release: integrated confirmed Validation Sprint V1 defect fixes and restored repository quality (no new functionality; no architectural changes):
  - Deterministic CAGR — `PerformanceAnalyzer` derives duration from equity-curve snapshot timestamps instead of wall-clock `startedAt` / `finishedAt`; backtest snapshots anchored to session / bar timestamps (VS001).
  - Deterministic Strategy Comparison — operational `durationMs` excluded from semantic equality via `stableComparison` (VS001).
  - Large-workload stability — `SimulationReportBuilder.summarizeSnapshots` computes peak / trough iteratively (previously overflowed the call stack via `Math.max(...)` on 1M+ snapshots); 150k-snapshot regression test added (VS002).
  - PnL identity restored — `TradeEngine.unrealizedPnL` is now classic unrealized PnL (position market value exposed separately via `computePositionMarketValue`); `equity = initialCapital + realizedPnL + unrealizedPnL`, so `realized + unrealized = total PnL` and `cash + market value = equity` hold per snapshot (VS003).
  - Repository lint restored to green (40 pre-existing errors): `no-unused-vars` now honors `^_` argsIgnorePattern; `no-explicit-any` scoped off for test files only (production strict; TD-008).
  - Standalone typecheck (`tsc --noEmit`) restored to green (13 pre-existing spec errors): `engineVersion` added to `CampaignSessionMetadata` fixtures, nullable JSON report access typed in experiments specs, branded `Instrument` in a simulation-report spec.
- RC-13 completed: Research Intelligence layer (US095–US100) + RC-13 Architecture Audit (US101) PASS WITH RECOMMENDATIONS; Execution vs Analysis pipeline categories; Living Next RC-14; Accepted Legacy dual paths documented (TD-011–TD-013); full monorepo tests green; docs synced (no remote release yet).
- RC-12 finalized: Research Pipeline Engine is the unified execution runtime for Campaign / Replay / Knowledge (US081–US091) architecture audit PASS (full monorepo tests green; pipeline orchestration lint scope clean; pre-existing experiments/knowledge Prisma-spec `any` debt unchanged); docs synced; committed and pushed.
- RC-11 finalized: Research Pipeline Engine (US081–US085) architecture audit PASS (full monorepo tests green; pipeline lint scope clean); docs synced; committed and pushed.
- RC-10 finalized: Knowledge & Experiment Intelligence (US075–US079) architecture audit PASS (full monorepo tests green); docs synced; committed and pushed.
- RC-09 finalized: Background Job Execution framework (US069–US073) verified (full monorepo tests green); docs synced; committed and pushed.
- RC-08 finalized: Campaign Import + Replay stack verified (full monorepo tests green); docs synced; committed and pushed.
- RC-07 finalized: Campaign Session Persistence + History + Export stack verified (full monorepo tests green); docs synced; committed and pushed.
- RC-06 Architecture Audit (US060): Campaign Session Persistence stack boundaries, History API, and docs aligned; 63 related unit tests green.
- Documentation sync (US050A): ADR-010 aligned to Dataset Slice + Train/Test execution + Aggregate v2; Analysis documented as still Train-oriented by intent; ADR index blurb updated.
- Documentation sync (US041A): Current Goal after Walk-Forward Aggregate + Analysis; Roadmap Next drops misplaced US024 (Portfolio Research remains a Future Milestone); CHANGELOG [Unreleased] labels US037–US041 explicitly.
- Backtest accounting: trade PnL includes entry fee (Research Engine 1.0.1 semantics).
- Documentation story IDs: former docs US021–US024 renumbered to DOC-021–DOC-024 (no collision with product backlog US021–US024).
- Terminology: Config Identity (was Configuration Identity); Research Layer for the architectural layer (ADR-002, Project Status).
- US007 title aligned to Architecture Review Before Implementation.
- Release Candidate scope refreshed to include current documentation stories.

### Changed

- Knowledge dedup moved from config-only identity to Result Identity
  (`configIdentityKey` + engine + validation versions).
- Simulation Platform accounting semantics (RC-15.1): `unrealizedPnL` now represents classic unrealized profit/loss on open positions (not raw market value), and `equity = initialCapital + realizedPnL + unrealizedPnL`. Simulation determinism is anchored to bar / session timestamps rather than wall-clock. Distinct from the `@trp/research` `researchEngineVersion` used for Knowledge identity (unchanged at `1.0.3`).
- RC-16 phase changed from an ambiguous simulation-realism placeholder to an
  approved, paper-only Trading Platform plan. The architecture remains a
  modular monolith and is frozen by ADR-012…ADR-018; future architectural
  changes require a new ADR.
- RC-16 current phase advanced to M1 — Live Market Data Foundation after the
  successful Frozen Architecture Audit.

### Research versions (working tree)

- Research Engine: `1.0.3`
- Validation: `1.0.2`
- Knowledge Schema: `2`

## [0.1.0] - 2026-07-16

Reflects what already exists in git history (bootstrap / MVP Stage 0–1), not the uncommitted Research OS campaign/knowledge extensions.

### Added

- Monorepo bootstrap (pnpm / Turborepo).
- Stage 0 research pipeline (OHLCV → strategy → backtest → validation → report).
- Stage 1 paper production pipeline (signal → adapter → execution history).
- JWT authentication.
- MVP Implementation stack (docs + core API/web wiring).
- Localhost CORS support and clearer API-down errors.
- MVP architecture documentation freeze / cleanup.

### Notes

- Dedicated Research OS release will be cut only after an explicit commit sequence.
