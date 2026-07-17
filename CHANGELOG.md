# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for Research Engine / Validation / Knowledge Schema versions tracked in
`docs/project/project-status.md` and `docs/research/version-history.md`.

## [Unreleased]

Research OS Foundation Release Candidate exists as a local commit; remote push not performed.

### Added

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

### Fixed

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
