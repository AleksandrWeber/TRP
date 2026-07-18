# TRP Research OS — Project Status

Last updated:
2026-07-18 (RC-16 M1 Epic E5 complete — US144–US147)

---

# Current Phase

M1 — Live Market Data Foundation

---

# Current Goal

Побудувати Evidence-driven Research OS: reproducible experiments, immutable Knowledge, і чітке provenance/versioning результатів.

Walk-Forward: Train/Test evaluation + Aggregate v2 (US048–US050); Dataset Slice US045–US047. Campaign Persistence + History API (US051–US059). RC-06 Architecture Audit complete (US060). Export Foundation + Export API (US061–US062). RC-07 finalized. Import Foundation (US063). JSON Import Validation (US064). Import API (US065). Replay Foundation (US066). Replay Execution (US067). RC-08 finalized. Job Domain Model (US069). Job Queue Abstraction (US070). Background Campaign Runner (US071). Job Status API (US072). Job Cancellation (US073). RC-09 finalized. Knowledge Domain Model (US075). Experiment Entity & Versioning (US076). Knowledge Extraction Pipeline (US077). Experiment Comparison Service (US078). Knowledge Search API (US079). RC-10 finalized. Pipeline Domain Model (US081). Pipeline Step Contract (US082). Pipeline Executor (US083). Pipeline Hooks (US084). Pipeline Templates (US085). RC-11 finalized. Campaign Pipeline Steps (US087). Execute Campaign through PipelineExecutor (US088). Replay Pipeline Integration (US089). Knowledge Extraction Pipeline Integration (US090). RC-12 Architecture Audit (US091) finalized — Pipeline Engine is the unified execution runtime. Architecture Snapshot Synchronization (US092). Technical Debt Register (US093). Module Maturity Matrix (US094). Insight Domain (US095). Insight Extraction Pipeline (US096). Cross-Campaign Analysis (US097). Recommendation Engine (US098). Research Report Domain (US099). Research Intelligence API (US100). RC-13 Architecture Audit (US101) PASS WITH RECOMMENDATIONS — RC-13 finalized. RC-14 production SaaS foundation finalized (`rc-14`). RC-15 Simulation Stack (US115–US124) + Architecture Audit (US125) — MarketData / Import / Provider / Backtesting / Portfolio / Trade / Performance / WalkForward / StrategyComparison / SimulationReport.

RC-15.1 Validation Release: Validation Sprint V1 (VS001–VS004) executed against the Research & Simulation Platform; confirmed defects fixed and integrated; documentation synchronized; repository quality restored (lint / typecheck / build / test green).

RC-16 Planning Session approved the Paper Trading Platform scope. The
Architecture Freeze accepted ADR-012…ADR-018 before User Story definition.

M1 Epic E1 complete (US126–US130).
M1 Epic E2-A complete (US131–US133).
M1 Epic E2-B complete (US134): reconnect, backoff, heartbeat, rate-limit
resilience, and health transitions.
M1 Epic E3-A complete (US135–US137): closed-candle/mark-price normalization,
validation, and quarantine (provider payloads stay in adapters).
M1 Epic E3-B complete (US138–US139): semantic dedup, per-stream ordering,
gap detection, and REST recovery with overlap elimination.
M1 Epic E4 complete (US140–US143): durable subscriptions/checkpoints, startup
recovery with live-event buffering, and Inbox-idempotent latest-market-state
projection (rebuildable).
M1 Epic E5 complete (US144–US147): market status/staleness + observability;
workspace-scoped read-only query API (subscriptions/status/latest/checkpoints);
SSE live projection channel with reconnect cursors, drop-oldest backpressure,
and non-authoritative client caches. Epic E5 complete.
Next: M2 — Durable Paper Order and Accounting Core.

---

# RC-16 Architecture Freeze

Status:
COMPLETE

Architecture Frozen:
YES

Implementation Allowed:
YES

Architecture Changes:
ADR Required

Frozen decisions:

- ADR-012 — single Execution Engine entry point; paper adapter only.
- ADR-013 — PostgreSQL Transactional Outbox/Inbox; at-least-once delivery with
  idempotent effects and per-stream ordering.
- ADR-014 — durable Trading Session state machine, fenced lease, checkpoints,
  and reconciliation-before-resume.
- ADR-015 — Fill → Position → Ledger → Portfolio; decimal arithmetic; Ledger
  is the financial source of truth.
- ADR-016 — mandatory Risk approval, durable Kill Switch, fail-safe paper-only
  operation.
- ADR-017 — explicit module ownership, inputs, outputs, dependencies, and
  prohibited responsibilities.
- ADR-018 — immutable architectural invariants covering execution, events,
  runtime, accounting, safety, time, and isolation.

Canonical plan:
[`rc-16-paper-trading-plan.md`](./rc-16-paper-trading-plan.md)

ADR index: [`../adr/README.md`](../adr/README.md)

No production code was changed by the Architecture Freeze.

---

# RC-16 Frozen Architecture Audit

Status:
PASS WITH MINOR RECOMMENDATIONS

Architecture Approved:
YES

Implementation Approved:
YES

The final read-only audit confirmed:

- ADR-012…ADR-018 are internally consistent;
- every core domain object has one authoritative owner;
- dependency direction has no circular ownership;
- Outbox/Inbox, per-stream ordering, idempotency, checkpoints, and replay rules
  are coherent;
- Strategy cannot bypass Risk;
- Orders cannot bypass Execution Engine;
- Execution cannot modify Position, Ledger, or Portfolio;
- Ledger remains the financial source of truth;
- restart recovery reconciles before execution resumes;
- real-capital execution is structurally outside RC-16.

Minor non-blocking recommendations:

1. Define Orders ↔ Execution strictly through ports/events; Execution must not
   write Order persistence directly.
2. Route cash reservation writes through Ledger; Portfolio remains a
   projection/read model.
3. Name the authoritative Strategy Deployment owner in M3 stories.
4. Name the authoritative Incident owner before M4 implementation.

Implementation readiness:
[`rc-16-implementation-readiness.md`](./rc-16-implementation-readiness.md)

---

# Validation Sprint V1 & RC-15.1 Validation Release

Status: ✅ Released (`bf46b64`, tag `rc-15.1`, synchronized with `origin/main`)

Validation Sprint V1 validated the complete Research & Simulation Platform (Historical Import → Market Data → Provider → Backtesting → Trade → Portfolio → Performance → Walk-Forward → Strategy Comparison → Simulation Report).

## Sprint verdicts

| Sprint | Objective                                | Verdict                      |
| ------ | ---------------------------------------- | ---------------------------- |
| VS001  | Functional Validation                    | ✅ PASS                      |
| VS002  | Long-running Simulation & Stress Testing | ✅ PASS                      |
| VS003  | Consistency & Invariant Validation       | ✅ PASS                      |
| VS004  | Production Readiness Review              | ✅ PASS WITH RECOMMENDATIONS |

## Confirmed defects fixed during the sprint

1. **Non-deterministic CAGR (VS001).** `PerformanceAnalyzer` derived CAGR duration from wall-clock `startedAt` / `finishedAt`. Now derived from equity-curve snapshot timestamps (wall-clock only as fallback). Files: `performance-analyzer.ts`, `backtest-engine.ts` (snapshots anchored to session / bar timestamps).
2. **Non-deterministic Strategy Comparison equality (VS001).** Comparison entries carried `durationMs` (operational metadata) into semantic equality. Tests now filter it via `stableComparison`. File: `vs001-functional-validation.spec.ts`.
3. **Large-workload crash (VS002).** `SimulationReportBuilder.summarizeSnapshots` used `Math.max(...equities)` / `Math.min(...)` and overflowed the call stack on 1M+ snapshots. Replaced with iterative peak / trough. Files: `simulation-report.builder.ts` (+ 150k-snapshot regression test).
4. **Broken PnL identity (VS003).** `TradeEngine` stored position market value in `unrealizedPnL`, and `equity` only balanced by coincidence, breaking `realized + unrealized = total PnL`. `unrealizedPnL` redefined to classic unrealized PnL; `computePositionMarketValue` exposed separately; `equity = initialCapital + realizedPnL + unrealizedPnL`. Files: `trade-engine.ts`, `portfolio-engine.ts` (+ spec updates).

## Repository quality (RC-15.1)

- Repository lint restored to green (40 pre-existing errors resolved): underscore-prefixed unused-args now honored via `no-unused-vars` `argsIgnorePattern`; `no-explicit-any` scoped off for test files only (production code stays strict — TD-008).
- Standalone typecheck (`tsc --noEmit`) restored to green (13 pre-existing spec errors fixed): missing `engineVersion` in `CampaignSessionMetadata` fixtures, nullable JSON report access in experiments specs, branded `Instrument` in a simulation-report spec.

## New technical debt (Validation Sprint findings)

TD-028 Execution Model · TD-029 Advanced Performance Metrics · TD-030 Scoring Strategy · TD-031 Report Exporters · TD-032 Operational Metadata Isolation · TD-033 Large Dataset Scalability. See [`technical-debt.md`](./technical-debt.md).

Full readiness review and validated performance baselines: RC-16 Production Readiness Review canvas (VS004).

---

# Development Workflow

Після кожної завершеної User Story:

1. Оновити цей файл — Project Status (`docs/project/project-status.md`).
2. Оновити Version History (`docs/research/version-history.md`), якщо змінилась логіка або семантика Research Engine / Validation / Knowledge.
3. Оновити ADR Index (`docs/adr/README.md`) при нових архітектурних рішеннях.
4. Додати до запису історії story (мінімум):
   - Completed Story
   - Changed Files
   - Tests
   - Next Step
5. Оновити `CHANGELOG.md` (секція `[Unreleased]`) для release-relevant змін.

Правила commit/push і scope guard: [`release-process.md`](./release-process.md).

Changelog: [`../../CHANGELOG.md`](../../CHANGELOG.md).

Roadmap: [`roadmap.md`](./roadmap.md).

Architecture Snapshot: [`architecture-snapshot.md`](./architecture-snapshot.md).

Technical Debt Register: [`technical-debt.md`](./technical-debt.md).

Module Maturity Matrix: [`module-maturity.md`](./module-maturity.md).

Campaign History & Export API: [`api.md`](./api.md).

RC-15 Retrospective & Development Guide v2:
[`rc-15-retrospective-development-guide-v2.md`](./rc-15-retrospective-development-guide-v2.md).

RC-16 Paper Trading Plan:
[`rc-16-paper-trading-plan.md`](./rc-16-paper-trading-plan.md).

---

# Release Readiness

Status: RC-15.1 officially released; RC-16 architecture frozen

## RC-15.1 Validation Release

Verification (working tree):

- `npm run lint` — PASS (repository clean)
- `pnpm --filter @trp/api exec tsc --noEmit` (standalone typecheck) — PASS
- `npm run build` — PASS (`@trp/api`, `@trp/web`, `@trp/research`)
- `npm test` — PASS (84 files, 565 tests)
- Documentation synchronized (project-status / roadmap / CHANGELOG / version-history / architecture-snapshot / module-maturity / technical-debt)
- No pending release blockers

Scope: integrate validated Validation Sprint V1 fixes (VS001–VS003), synchronize documentation, register new technical debt (TD-028…TD-033), and prepare the repository for RC-16. No new functionality; no architectural changes.

Release commit: `bf46b64d184d004add4f9c0316a3e33da1116718`

Release tag: `rc-15.1`

Current Research OS + Simulation Platform is released. RC-16 remains
documentation/architecture only until implementation User Stories begin.

---

# Architecture Status

## Research Layer

Status:
✅ Stable (working tree; not yet released as dedicated commits)

Completed:

- Backtest engine з fee/slippage accounting (entry fee включено в trade PnL).
- Validation Engine (pass / needs_review / fail).
- Strategy Contract + Registry + Resolver.
- EMA Crossover і Donchian Breakout зареєстровані.
- Paginated Binance historical import (startTime/endTime, ≤1000 per page).

Next: RC-14.

---

## Knowledge Layer

Status:
✅ RC-10 finalized + extraction via PipelineExecutor (US075–US079, US090)

Completed:

- `research_outcome` для PASS / FAIL / NEEDS_REVIEW.
- Payload: hypothesis, evidence, conclusion + strategy/params/dataset/metrics/validation/configHash.
- Result Identity dedup: `configIdentityKey` + `researchEngineVersion` + `validationVersion`.
- Immutable lineage: `supersedesKnowledgeId` + reverse lookup через `getLineage()`.
- Structural legacy detection (без hardcode package versions).
- Single source of truth: `knowledge.version.ts`.
- Integration/unit tests для create / duplicate / lineage / version consistency.
- Knowledge Domain Model (US075): in-memory `KnowledgeEntry` / `KnowledgeMetadata` / `KnowledgeTag` + `KnowledgeDomainService` (`create` / `update` / `get` / `list`); no Repository / API / extraction.
- Knowledge Extraction Pipeline (US077): `KnowledgeExtractionService.extract` + `KnowledgeDomainService.createFromExperiment` (deterministic from `Experiment.currentVersion.report`; one entry per experiment; upsert).
- Knowledge Extraction Pipeline Integration (US090): `PrepareKnowledgeExtractionStep` / `ExtractKnowledgeStep` / `UpsertKnowledgeEntryStep`; `createFromExperiment` orchestrates via Knowledge template + `PipelineExecutor`.
- Knowledge Search API (US079): `search` / `searchByTag` / `searchByExperiment` / `find` + `GET /knowledge?q&tag&experimentId` (AND; case-insensitive; empty array on miss).

Next: RC-14.

---

## Insight Domain

Status:
✅ Domain + Pipeline extraction + read-only REST (US095–US096, US100; no AI)

Completed:

- Module `apps/api/src/modules/insight/` (`InsightModule`).
- `Insight` / `InsightType` / `InsightSource` / `InsightMetadata`.
- `InsightDomainService`: `create` / `update` / `delete` / `getById` / `search` / `extractFromKnowledge`.
- Insight Pipeline Steps: `insights.prepare` → `insights.extract` → `insights.persist`.
- Built-in Insight Pipeline template (`insight-pipeline`); deterministic rules only (no LLM).
- References Knowledge via `knowledgeEntryIds` only — does not duplicate KnowledgeEntry contents.
- REST API available (read-only): `GET /insights`, `GET /insights/:id`.
- No AI / Prisma / Repository / Jobs / Export / Import.

Next: RC-14.

---

## Experiment Provenance

Status:
✅ RC-10 finalized (US076–US078 Experiment intelligence)

Completed:

- Provenance audit (US015): що є / чого бракує для reproducibility.
- `Experiment.report` зберігає `researchEngineVersion` і `validationVersion` (ті самі константи, що Knowledge).
- `gitCommit` лишається окремим provenance-полем (не version).
- Optional `sliceIdentity` on ExperimentReport when run via SliceRef (US046).
- Optional `sliceIdentity` on CampaignReport when campaign runs with SliceRef (US047).
- Walk-Forward windows carry `trainSliceIdentity` / `testSliceIdentity` (US048).
- Walk-Forward test evaluation: `trainBestExperimentId` / `testExperimentId` + train/test metrics & verdicts (US049).
- Walk-Forward Aggregate v2 (US050): Train Aggregate + Test Aggregate; `overallVerdict` from Test only.
- Experiment Entity & Versioning (US076): in-memory `Experiment` / `ExperimentVersion` / `ExperimentMetadata` + `ExperimentDomainService` (`createFromSession` / `createVersion` / `get` / `list`); links CampaignSession → future KnowledgeEntry via `experimentId` only.
- Experiment Comparison Service (US078): deterministic `ExperimentComparisonService.compareVersions` / `compareExperiments` (structural insights/summary/tags/metadata diffs; no AI).

Next: RC-14.

---

## Campaign Persistence

Status:
✅ Integrated (US051–US059; in-memory store + History API)

Completed:

- Domain module `apps/api/src/modules/campaign-persistence/`.
- `CampaignRecord` stores session fields: `sessionId`, `status`, timestamps, `metadata`, nested `report`.
- `CampaignRepository` contract: `save` / `findById` / `findAll` / `exists` / `delete`.
- `CampaignSessionMapper`: `CampaignSession` ↔ `CampaignRecord`.
- `InMemoryCampaignRepository` (Map-backed; no DB / filesystem / singleton).
- `CampaignPersistenceService` (writes) + `CampaignHistoryService` (read-only history).
- `HistoryQuery` filters + `HistoryPageRequest` / `HistoryPage` pagination & sorting.
- `CampaignHistoryController`: `GET /campaign-history`, `GET /campaign-history/:sessionId`.
- `ResearchCampaignService.run` creates/persists one `CampaignSession` per execution (`COMPLETED` or `FAILED`).
- RC-06 Architecture Audit (US060): dependency direction / History flow / API / tests validated PASS.

Next: RC-14.

---

## Campaign Session

Status:
✅ Integrated with Campaign execution (US053–US055); RC-06 audited

Completed:

- `CampaignSession` execution entity (`id`, `status`, `createdAt`, `completedAt?`, `report`, `metadata`).
- `CampaignSessionStatus`: `CREATED` / `COMPLETED` / `FAILED`.
- `CampaignSessionMetadata`: `engineVersion`, optional `datasetId` / `tags`.
- `CampaignSessionFactory` (DI): creates CREATED sessions; Campaign sets COMPLETED/FAILED + `completedAt` before save.
- Every `ResearchCampaignService.run` persists exactly one session.
- `CampaignHistoryService` + History API (US056–US059).

Next: RC-14.

---

## Campaign Export

Status:
✅ Export API (US061–US062)

Completed:

- Module `apps/api/src/modules/campaign-export/`.
- `ExportFormat` enum: `JSON` | `CSV`.
- `CampaignExporter` strategy interface + `JsonCampaignExporter` / `CsvCampaignExporter`.
- `CampaignExportService` accepts `CampaignSession` only (never `CampaignRecord`); delegates by format.
- `CampaignExportController`: `GET /campaign-history/:sessionId/export?format=json|csv`.
- Flow: HistoryService.getById → CampaignExportService.export; 200 / 400 / 404; Content-Type set.

Next: RC-14.

---

## Campaign Import

Status:
✅ Import API (US063–US065; does not persist)

Completed:

- Module `apps/api/src/modules/campaign-import/`.
- `ImportFormat` enum: `JSON` (initial).
- `CampaignImporter` strategy interface + `JsonCampaignImporter` (string → `CampaignSession`).
- `CampaignImportService` accepts payload + format; delegates by Strategy Pattern; returns `CampaignSession` only.
- `CampaignSessionValidator` + `ImportValidationError` (US064): required fields, metadata, report, timestamps, engineVersion semver.
- Flow: parse → validator → `CampaignSession` (no Persistence / Repository).
- `CampaignImportController`: `POST /campaign-import` with `{ format, payload }` → `CampaignSession` (200) or 400.
- Nest `CampaignImportModule` wired in `AppModule` (no persistence side effects).

Next: RC-14.

---

## Campaign Replay

Status:
✅ Executes via PipelineExecutor (US066–US067, US089; no HTTP / no persist)

Completed:

- Module `apps/api/src/modules/campaign-replay/`.
- `ReplayStatus`: `READY` | `RUNNING` | `COMPLETED` | `FAILED`.
- `ReplayContext` + `ReplayCampaignConfig` + `ReplayResult` (`completedAt` on finish).
- `CampaignReplayService.create(session)` → prepare; status `READY`.
- Replay Pipeline Integration (US089): `CampaignReplayService` orchestrates via Replay template + `PipelineExecutor`; steps `replay.load` → `replay.restore` → `replay.execute` → `replay.finalize`.
- `execute(session)` → Campaign via `persistSession: false` inside Replay steps → regenerated report; `COMPLETED` / `FAILED`.
- Identical `ReplayResult` / History / Jobs behavior; no History/Repository writes on replay.

Next: RC-14.

---

## Cross-Campaign Analysis

Status:
🟡 Foundation (US097, US100; deterministic; REST API available (read-only); no AI)

Completed:

- Module `apps/api/src/modules/cross-campaign-analysis/` (`CrossCampaignAnalysisModule`).
- `CrossCampaignAnalysisService.analyze` → Cross-Campaign Analysis Pipeline.
- Steps: `cross-analysis.prepare` → `cross-analysis.compare` → `cross-analysis.persist`.
- Built-in template `cross-campaign-analysis-pipeline`.
- Reads CampaignSessions / KnowledgeEntries / Insights; writes only via `InsightDomainService`.
- Deterministic findings: repeated findings, recurring patterns, conflicting conclusions, stable trends, unique observations.
- Output: `CrossCampaignAnalysisResult` (`id`, `comparedCampaignIds`, `findings`, `statistics`, `generatedInsightIds`, `createdAt`).
- REST API available (read-only): `GET /cross-campaign-analysis`, `GET /cross-campaign-analysis/:id`.

Next: RC-14.

---

## Recommendation

Status:
🟡 Foundation (US098, US100; deterministic; REST API available (read-only); no AI)

Completed:

- Module `apps/api/src/modules/recommendation/` (`RecommendationModule`).
- Domain models: `Recommendation`, `RecommendationType`, `RecommendationPriority`, `RecommendationMetadata`.
- `RecommendationDomainService`: `create` / `update` / `delete` / `getById` / `search` / `generateFromInsights`.
- Deterministic generation from Insights (pattern → repeat; conflict → verify; trend → expand; anomaly → investigate; model disagreement → compare; insufficient evidence → collect more data).
- Insight id refs only; structured recommendations; no Pipeline / Jobs / Export / Import / Prisma.
- REST API available (read-only): `GET /recommendations`, `GET /recommendations/:id`.

Next: RC-14.

---

## Research Report

Status:
🟡 Foundation (US099, US100; structured data only; REST API available (read-only); no export / no AI)

Completed:

- Module `apps/api/src/modules/research-report/` (`ResearchReportModule`).
- Domain models: `ResearchReport`, `ReportSection`, `ReportMetadata` (`ReportSectionType`).
- `ResearchReportDomainService`: `create` / `getById` / `search` / `build`.
- `build()` aggregates Campaign / Knowledge / Insight / Recommendation by id into structured sections.
- No PDF / HTML / Markdown / AI narrative / Pipeline / Export coupling.
- REST API available (read-only): `GET /reports`, `GET /reports/:id`.

Next: RC-14.

---

## Research Intelligence API

Status:
🟡 Foundation (US100; read-only REST)

Completed:

- Controllers: `InsightController`, `RecommendationController`, `ResearchReportController`, `CrossCampaignAnalysisController`.
- Endpoints: `GET /insights`, `GET /recommendations`, `GET /reports`, `GET /cross-campaign-analysis` (+ `/:id`).
- List envelope: `HistoryPage<T>`; pagination (`page` / `pageSize`), sorting (`sortBy` / `sortOrder`), filtering.
- Controllers call Domain Service `search` / `getById` only (no generate / build / pipeline execute).
- Cross-campaign `analyze()` stores results with `id` / `createdAt` for lookup.

Next: RC-14.

---

## Jobs

Status:
✅ RC-09 finalized (US069–US073; no scheduler / job persist)

Completed:

- Module `apps/api/src/modules/jobs/` (wired into `AppModule`).
- `Job`, `JobResult`, `JobMetadata` (incl. `paramsList` / `session` for execution).
- `JobStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- `JobType`: `CAMPAIGN` | `REPLAY`.
- `JobQueue` interface + `JOB_QUEUE` token + `InMemoryJobQueue` (FIFO, in-memory; `list` / `get` / `cancel`).
- `JobService.createCampaignJob` / `createReplayJob` → create `PENDING` job → `JobQueue.enqueue`.
- `JobService.listJobs` / `getJob` → read-only via queue.
- `JobService.cancelJob` → PENDING → CANCELLED (conflict otherwise).
- `JobRunner` + `BackgroundJobRunner`: process → RUNNING → Campaign/Replay → COMPLETED|FAILED (`JobResult`); skips CANCELLED.
- Job Status API (US072): `GET /jobs`, `GET /jobs/:jobId` (404 if missing).
- Job Cancellation (US073): `POST /jobs/:jobId/cancel` (200 / 404 / 409).

Next: RC-14.

---

## Pipeline

Status:
✅ RC-13 finalized — Execution + Analysis pipelines (US081–US091, US095–US101)

Completed:

- Module `apps/api/src/modules/pipeline/`.
- `Pipeline`, `PipelineRun`, `PipelineContext`, `PipelineResult`, `PipelineMetadata`.
- `PipelineRunStatus`: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- `PipelineDomainService`: `createPipeline` / `getPipeline` / `listPipelines` / `createRun` / `getRun` / `listRuns` (in-memory Maps).
- Generic context only (`input` / `output` / `variables` / `metadata`) — no campaign/knowledge/replay-specific fields.
- Pipeline Step Contract (US082): `PipelineStep` / `AbstractPipelineStep` / `PipelineStepMetadata` / `PipelineStepResult` + `PipelineRegistry` (register/get/list; duplicate rejected).
- Pipeline stores `PipelineStepMetadata[]` only — never executable instances.
- Pipeline Executor (US083): `PipelineExecutor.execute(pipeline, context, run?)` resolves steps via registry by `metadata.order`; propagates context; updates optional `PipelineRun` lifecycle; returns `PipelineResult` (success/fail + duration).
- Pipeline Hooks (US084): `PipelineHook` + `PipelineHookRegistry` + `LoggingPipelineHook`; executor invokes before/after pipeline/step and onError; hook failures ignored; observation only (no context mutation).
- Pipeline Templates (US085): `PipelineTemplate` + `PipelineTemplateService` (`createTemplate` / `getTemplate` / `listTemplates` / `createPipelineFromTemplate`); built-ins Campaign / Replay / Knowledge; immutable templates → independent Pipeline copies.
- RC-11 Architecture Audit (US086): architecture PASS; isolation verified; no Event Bus; no API/Repository.
- Campaign Pipeline Steps (US087): `PrepareCampaignStep` / `ExecuteResearchStep` / `AggregateResultStep` / `BuildReportStep` / `PersistCampaignStep` under `pipeline/steps/campaign/`; registered on `PipelineRegistry`; Campaign template metadata updated.
- Execute Campaign through PipelineExecutor (US088): `ResearchCampaignService` orchestrates via template + `PipelineExecutor` + in-memory `PipelineRun`; public `run()` contract, REST API, persistence/History, Jobs, and Replay behavior unchanged.
- Replay Pipeline Integration (US089): `LoadReplaySessionStep` / `RestoreReplayContextStep` / `ExecuteReplayCampaignStep` / `FinalizeReplayStep` under `pipeline/steps/replay/`; registered on `PipelineRegistry`; Replay template metadata updated; `CampaignReplayService` orchestrates via template + `PipelineExecutor`.
- Knowledge Extraction Pipeline Integration (US090): `PrepareKnowledgeExtractionStep` / `ExtractKnowledgeStep` / `UpsertKnowledgeEntryStep` under `pipeline/steps/knowledge/`; registered on `PipelineRegistry`; Knowledge template metadata updated; `KnowledgeDomainService.createFromExperiment` orchestrates via template + `PipelineExecutor`.
- RC-12 Architecture Audit (US091): Pipeline Engine verified as unified Campaign / Replay / Knowledge runtime; isolation PASS; no Event Bus.
- Insight Extraction Pipeline (US096): `insights.prepare` / `insights.extract` / `insights.persist`; Insight built-in template; `InsightDomainService.extractFromKnowledge` orchestrator.
- Cross-Campaign Analysis (US097): `cross-analysis.prepare` / `compare` / `persist`; built-in Cross-Campaign Analysis template; `CrossCampaignAnalysisService` orchestrator.

Next: RC-14.

---

## Strategy Framework

Status:
🟡 In Progress

Completed:

- Multi-Strategy Foundation (US008).
- EMA Crossover (benchmark).
- Donchian Breakout (US009) + перша кампанія (US010).
- Мінімальний Campaign Layer (US017): sequential runner + in-memory summary.
- Campaign Report Builder (US018): verdict + recommendations поверх Summary + Experiments.
- Campaign API (US019): `POST /research-campaigns` → summary + report.
- Campaign API (US026): `POST /campaigns/run` → CampaignSummary.
- Campaign UI (US027–US030): web client, Run / Results / History.
- Deterministic Research Analysis (US031–US032): service + `POST /campaigns/analyze` + Results view.
- Multi-dataset Campaign (US033–US035): orchestration service + API + UI.
- Walk-Forward foundation (US037): `WalkForwardCampaignService` stub (validate + empty summary).
- Walk-Forward window builder (US038): `buildWalkForwardWindows()` → index train/test windows in summary.
- Walk-Forward campaign runner (US039): one `ResearchCampaignService.run` per window; continues on failure.
- Walk-Forward aggregate report (US040): averages + best/worst window + overallVerdict over successful windows.
- Walk-Forward analysis (US041): deterministic `WalkForwardAnalysisService` (stability/consistency + ROBUST…UNUSABLE).
- Walk-Forward API (US042): `POST /campaigns/run-walk-forward` → `WalkForwardCampaignSummary`.
- Walk-Forward UI (US043): `WalkForwardCampaignPage` at `/campaigns/walk-forward`.
- Dataset Slice Architecture (US044 / ADR-011): immutable `SliceRef`; `SliceResolver`-only construction (design freeze).
- Dataset Slice Domain Model (US045): `createSliceRef` / `resolveSlice` in `@trp/research` (bars array only; no DB).
- Experiment Slice Support (US046): `runExperiment(bars, config?, sliceRef?)` → optional `sliceIdentity` provenance; Engine unchanged.
- Campaign Slice Support (US047): optional `sliceRef` on `ResearchCampaignService.run`; CampaignReport may include `sliceIdentity`.
- True Walk-Forward Execution (US048): Train/Test `SliceRef` per window; campaign runs on Train slice only; test identity stored as provenance.
- Walk-Forward Test Evaluation (US049): best train params re-run on Test SliceRef; window train/test metrics & verdicts.
- Walk-Forward Aggregate v2 (US050): separate Test Aggregate metrics; `overallVerdict` from Test verdicts only; Train Aggregate kept for reference.
- Campaign Persistence Domain (US051): `CampaignRecord` / `CampaignRepository` / `CampaignMapper` / `InMemoryCampaignRepository`; Campaign execution unwired.
- Campaign Persistence Service (US052): `CampaignPersistenceService` orchestrates mapper + repository; exposes `CampaignReport` API only.
- Campaign Session Model (US053): `CampaignSession` + factory; CREATED sessions with report + metadata; not persisted / not wired.
- Persist Campaign Session (US054): PersistenceService saves/loads `CampaignSession` via `CampaignSessionMapper` + extended `CampaignRecord`.
- Integrate Campaign Persistence (US055): `ResearchCampaignService` persists COMPLETED/FAILED sessions via factory + PersistenceService (DI).
- Campaign History Query Service (US056): read-only `CampaignHistoryService` (`getById` / `getAll` / `exists`); returns `CampaignSession` only.
- Campaign History Search & Filters (US057): `search(HistoryQuery)` with AND filters over status / engineVersion / datasetId / tags.
- Campaign History Pagination & Sorting (US058): `search(query, pageRequest)` → `HistoryPage`; sort by createdAt / completedAt / status.
- Campaign History API (US059): `GET /campaign-history` + `GET /campaign-history/:sessionId` (read-only).
- RC-06 Architecture Audit (US060): Campaign→Session→Persistence→History→API boundaries PASS; 63 related tests green.
- Export Foundation (US061): `CampaignExportService` + JSON/CSV exporters (Strategy Pattern); Session-only input.
- Export API (US062): `GET /campaign-history/:sessionId/export` (json/csv; 404/400; Content-Type).
- Import Foundation (US063): `CampaignImportService` + `JsonCampaignImporter` (Strategy Pattern); Session-only output; no persist/API.
- JSON Import Validation (US064): `CampaignSessionValidator` + `ImportValidationError`; parse → validate → session.
- Import API (US065): `POST /campaign-import` → validated `CampaignSession` (no persist).
- Replay Foundation (US066): `CampaignReplayService` prepares `ReplayResult` from `CampaignSession` (no execution/AI/persist).
- Replay Execution (US067): `execute(session)` via `ResearchCampaignService` (`persistSession: false`); READY→RUNNING→COMPLETED|FAILED.
- Replay Pipeline Integration (US089): Replay stages as PipelineSteps; `CampaignReplayService` orchestrates via template + `PipelineExecutor`.
- Job Domain Model (US069): `Job` / `JobStatus` / `JobType` + create-only `JobService` (no queue/API/persist).
- Job Queue Abstraction (US070): `JobQueue` + `JOB_QUEUE` + `InMemoryJobQueue`; create auto-enqueues as `PENDING`.
- Background Campaign Runner (US071): `BackgroundJobRunner` processes CAMPAIGN/REPLAY jobs → COMPLETED|FAILED (`JobResult`).
- Job Status API (US072): `GET /jobs` + `GET /jobs/:jobId` (read-only; Controller → JobService → JobQueue).
- Job Cancellation (US073): `POST /jobs/:jobId/cancel` (PENDING → CANCELLED; runner skips cancelled).
- RC-09 finalized: Background Job Execution framework (US069–US073).
- Knowledge Domain Model (US075): in-memory `KnowledgeEntry` + `KnowledgeDomainService` (create/update/get/list).
- Experiment Entity & Versioning (US076): in-memory `Experiment` + `ExperimentDomainService` (createFromSession/createVersion/get/list).
- Knowledge Extraction Pipeline (US077): deterministic extract from Experiment report → upsert KnowledgeEntry.
- Knowledge Extraction Pipeline Integration (US090): Knowledge stages as PipelineSteps; `createFromExperiment` via `PipelineExecutor`.
- Experiment Comparison Service (US078): structural compareVersions / compareExperiments (no AI).
- Knowledge Search API (US079): `GET /knowledge` with `q` / `tag` / `experimentId` (AND; in-memory).
- RC-10 finalized: Knowledge & Experiment Intelligence architecture audit PASS.
- Pipeline Domain Model (US081): in-memory `Pipeline` / `PipelineRun` + `PipelineDomainService` (no executor/API).
- Pipeline Step Contract (US082): `PipelineStep` + `PipelineRegistry` + metadata-only steps on Pipeline.
- Pipeline Executor (US083): ordered step execution via registry; context propagation; run status transitions; no persistence/API.
- Pipeline Hooks (US084): optional lifecycle hooks via `PipelineHookRegistry`; `LoggingPipelineHook` reference; no Events/bus.
- Pipeline Templates (US085): `PipelineTemplate` + `PipelineTemplateService`; built-in Campaign / Replay / Knowledge templates (metadata only); independent copies via `createPipelineFromTemplate`.
- RC-11 finalized: Research Pipeline Engine architecture audit PASS (US081–US085).
- Campaign Pipeline Steps (US087): extracted Campaign stages as PipelineSteps; registry + template updated; ResearchCampaignService unchanged.
- Execute Campaign through PipelineExecutor (US088): `ResearchCampaignService` → template → `PipelineExecutor` → Campaign steps; public contract unchanged.
- Replay Pipeline Integration (US089): `CampaignReplayService` → template → `PipelineExecutor` → Replay steps; identical `ReplayResult` / Jobs / History behavior.
- Knowledge Extraction Pipeline Integration (US090): `KnowledgeDomainService.createFromExperiment` → template → `PipelineExecutor` → Knowledge steps; identical KnowledgeEntry / upsert.
- RC-12 Architecture Audit (US091): Pipeline Engine verified as unified Campaign / Replay / Knowledge runtime; isolation PASS; no Event Bus.
- Insight Extraction Pipeline (US096): `insights.prepare` / `insights.extract` / `insights.persist`; Insight built-in template; `InsightDomainService.extractFromKnowledge` orchestrator.
- Cross-Campaign Analysis (US097): `cross-analysis.prepare` / `compare` / `persist`; built-in Cross-Campaign Analysis template; `CrossCampaignAnalysisService` orchestrator.

Next: RC-14.

---

# Completed User Stories

US001 — First Successful Research (audit)

- Усі наявні FAIL на короткому EMA dataset проаналізовано; PASS не досягнуто чесно без зміни rules/data.

US002 — Research Dataset Expansion (audit)

- Виявлено ліміт імпорту (~1000 candles); для чесного PASS потрібна більша історія.

US003 — Paginated Binance Import

- Реалізовано pagination; імпортовано BTCUSDT 1h ~4344 bars (Jan–Jun 2025).

US004 — First EMA Research Campaign

- 9 frozen EMA configs на 6-місячному dataset; усі FAIL; найближчий — EMA(12,20).

US005 — Explain the Failure

- Root cause: whipsaw / false crossovers; не промоутити unfiltered EMA.

US006 — Design the Next Research Hypothesis

- Рекомендовано Donchian Channel Breakout як першу наступну гіпотезу.

US007 — Architecture Review Before Implementation

- Verdict: Minor refactoring required перед multi-strategy.

US008 — Multi-Strategy Foundation

- Strategy contract, registry, generic dispatch; EMA regression збережено.

US009 — Implement Donchian Breakout

- Donchian зареєстровано; EMA без змін.

US010 — First Donchian Campaign

- Periods 10–50; початково period 10 дав PASS через accounting bug.

US011 — Accounting Audit

- Verdict: Accounting Bug — trade PnL не враховував entry fee.

US012 — Fix Accounting Bug

- PnL/fees виправлено; Donchian re-run: усі FAIL; accounting reconciled.

US013 — Record Research Knowledge (audit)

- Verdict: Knowledge Model Incomplete — FAIL не зберігались як Knowledge.

US014 — Research Knowledge Foundation

- Knowledge Layer для всіх verdict + dedup + backfill існуючих experiments.

US015 — Knowledge Versioning / Provenance

- Result Identity, lineage, legacy detection, version source, Experiment report versions (audit + implementation steps).

US016 — Experiment Provenance Versioning

- `researchEngineVersion` / `validationVersion` у `Experiment.report`; unit tests; gitCommit окремо.

US000 — Project Memory

- Створено цей living status document.

US000A — Architecture Decision Records (ADR Index)

- Створено `docs/adr/README.md` з індексом ADR-001…ADR-006.

US017 — Research Campaign

- Мінімальний Campaign Runner поверх `ExperimentsService` (без зміни engine/validation/knowledge).
- In-memory Campaign Summary (aggregates + bestExperimentId за Profit Factor + failedRuns).
- Knowledge пишеться лише через існуючий post-create шлях Experiment.
- Integration-style тести на моках.

US018 — Campaign Report

- `CampaignReportService` будує Report із Campaign Summary + Experiments.
- Verdict: PASS / NEEDS_REVIEW / FAIL за наявністю verdict у runs.
- Best metrics + lowest drawdown; детерміновані recommendations без AI.
- Unit/integration-style тести, включно з empty campaign.

Documentation Workflow

- Completed Story: процес підтримки документації (Project Status + Release Process + Changelog).
- Changed Files: `docs/project/project-status.md`, `docs/project/release-process.md`, `CHANGELOG.md`.
- Tests: markdown formatting check only (no production/unit test changes).
- Next: US020 — Campaign UI.

US019 — Campaign API

- Completed Story: `POST /research-campaigns` повертає summary + report + experimentIds.
- Changed Files: `research-campaign.controller.ts`, `research-campaign.service.ts`, module/specs, docs.
- Tests: controller + campaign service unit/integration-style.
- Next: US020 — Campaign UI.

US020A — Release Readiness Fix (documentation only)

- Completed Story: docs sync з git-станом (Next Step, Current Phase, CHANGELOG Unreleased, Release Readiness note).
- Changed Files: `docs/project/project-status.md`, `docs/project/roadmap.md`, `CHANGELOG.md`.
- Tests: not required.
- Next: US020 — Campaign UI.

US020B — Release Preparation (documentation only)

- Completed Story: підготовка до першого логічного commit Research OS (docs check + Release Candidate).
- Changed Files: `docs/project/project-status.md`, `docs/project/roadmap.md`.
- Tests: markdown prettier/check only.
- Next: US020 — Campaign UI (після explicit commit sequence, якщо користувач підтвердить).

DOC-021 — Architecture Snapshot (documentation only)

- Completed Story: living architecture snapshot of current Research OS.
- Changed Files: `docs/project/architecture-snapshot.md`, `docs/project/project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: DOC-022.

DOC-022 — Campaign Domain Model (documentation only)

- Completed Story: read-only domain model of implemented Campaign Layer.
- Changed Files: `docs/project/campaign-domain-model.md`, `architecture-snapshot.md`, `project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: DOC-023.

DOC-023 — Research Domain Model (documentation only)

- Completed Story: read-only domain model of implemented Research Layer.
- Changed Files: `docs/project/research-domain-model.md`, `architecture-snapshot.md`, `project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: DOC-024.

DOC-024 — Knowledge Domain Model (documentation only)

- Completed Story: read-only domain model of implemented Knowledge Layer.
- Changed Files: `docs/project/knowledge-domain-model.md`, `architecture-snapshot.md`, `project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: US025.

US025 — Architecture Consistency Review (documentation only)

- Completed Story: read-only audit of documentation consistency (findings; no edits).
- Changed Files: none.
- Tests: not required.
- Next: US026.

US026 — Documentation Numbering Cleanup (documentation only)

- Completed Story: renumber docs stories DOC-021–DOC-024; unify Config Identity / Research Layer terms; align US007; refresh Release Candidate scope.
- Changed Files: `project-status.md`, `roadmap.md`, `architecture-snapshot.md`, `CHANGELOG.md`, `docs/adr/README.md`.
- Tests: markdown prettier/check only.
- Next: Architecture Freeze Review.

US025A — ADR-007 Campaign Layer (documentation only)

- Completed Story: Accepted ADR for Campaign Layer boundaries (runner / summary / report; not backtest / validation / knowledge / campaign DB persistence).
- Changed Files: `docs/adr/ADR-007-campaign-layer.md`, `docs/adr/README.md`, `project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: Architecture Freeze Review.

US025B — Documentation Sync (documentation only)

- Completed Story: sync ADR range, Roadmap Completed, Release Candidate scope, and ADR index note after US025A.
- Changed Files: `architecture-snapshot.md`, `roadmap.md`, `project-status.md`, `CHANGELOG.md`, `docs/adr/README.md`.
- Tests: markdown prettier/check only.
- Next: Architecture Freeze Review (final).

US025C — Documentation Sync (final) (documentation only)

- Completed Story: add US025B to Roadmap Completed; sync Release Candidate scope to US025A–US025C.
- Changed Files: `roadmap.md`, `project-status.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: Architecture Freeze Review.

US026 — Campaign API

- Completed Story: `POST /campaigns/run` returns CampaignSummary via existing `ResearchCampaignService.run()`.
- Changed Files: `campaign.controller.ts`, `campaign.controller.spec.ts`, `research-campaign.module.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: campaign controller + existing campaign suite passed.
- Next: US027.

US027 — Campaign UI API Integration

- Completed Story: web `runCampaign()` client + `CampaignRunRequest` / `CampaignSummary` types; mock-fetch helper test.
- Changed Files: `apps/web/src/shared/api.ts`, `apps/web/src/shared/api.spec.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: web `api.spec.ts` passed.
- Next: US028.

US028 — Campaign Run Page (MVP)

- Completed Story: minimal Campaign Run form calling `runCampaign()`; shows campaignId / bestExperimentId on success.
- Changed Files: `CampaignRunPage.tsx`, `CampaignRunPage.spec.ts`, `App.tsx`, `AppLayout.tsx`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: web `CampaignRunPage.spec.ts` passed.
- Next: US029.

US029 — Campaign Results Page (MVP)

- Completed Story: after `runCampaign()`, navigate to Results page rendering CampaignSummary (counts, bestExperimentId, verdict, recommendations).
- Changed Files: `CampaignResultsView.tsx`, `CampaignResultsView.spec.tsx`, `CampaignResultsPage.tsx`, `CampaignRunPage.tsx`, `App.tsx`, `vitest.config.ts`, docs.
- Tests: web `CampaignResultsView.spec.tsx` + `CampaignRunPage.spec.ts` passed.
- Next: US030.

US030 — Campaign History (MVP)

- Completed Story: localStorage campaign history + `CampaignHistoryView` (newest first); append after each successful `runCampaign()`.
- Changed Files: `campaign-history.ts`, `CampaignHistoryView.tsx`, `CampaignHistoryView.spec.tsx`, `CampaignRunPage.tsx`, `CampaignResultsPage.tsx`, docs.
- Tests: web `CampaignHistoryView.spec.tsx` passed.
- Next: US031.

US031 — Deterministic Research Analysis

- Completed Story: `ResearchAnalysisService.buildAnalysis(CampaignReport)` returns deterministic executiveSummary / strengths / weaknesses / recommendations / nextHypothesis (no external AI). Formerly tracked as US021.
- Changed Files: `apps/api/src/modules/research-analysis/*`, `app.module.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: `research-analysis.service.spec.ts` (PASS / FAIL / NEEDS_REVIEW / empty) passed.
- Next: US032.

US032 — Research Analysis API + UI

- Completed Story: `POST /campaigns/analyze` + read-only `CampaignAnalysisView` under Campaign Results; uses existing `ResearchAnalysisService`. Formerly tracked as US021A.
- Changed Files: `research-analysis.controller.ts`, `CampaignAnalysisView.tsx`, `CampaignResultsPage.tsx`, `api.ts`, docs.
- Tests: controller + `CampaignAnalysisView` component tests passed.
- Next: US033.

US033 — Multi-dataset Campaign Service

- Completed Story: `MultiDatasetCampaignService` runs one campaign per dataset via existing `ResearchCampaignService`; continues on dataset failure; aggregates `MultiDatasetCampaignSummary`. Formerly tracked as US022.
- Changed Files: `multi-dataset-campaign.service.ts`, `multi-dataset-campaign.types.ts`, `multi-dataset-campaign.service.spec.ts`, `research-campaign.module.ts`, docs.
- Tests: single / multiple / one failure / overall best selection passed.
- Next: US034.

US034 — Multi-dataset Campaign API

- Completed Story: `POST /campaigns/run-multi` validates input and returns `MultiDatasetCampaignSummary` via existing `MultiDatasetCampaignService`. Formerly tracked as US022A.
- Changed Files: `campaign.controller.ts`, `campaign.controller.spec.ts`, docs.
- Tests: valid request / empty datasets / service exception passed.
- Next: US035.

US035 — Multi-dataset Campaign UI

- Completed Story: `MultiDatasetCampaignPage` with strategy/datasets/params form, calls `runMultiDatasetCampaign`, renders aggregate summary + dataset table. Formerly tracked as US022B.
- Changed Files: `MultiDatasetCampaignPage.tsx`, `MultiDatasetCampaignPage.spec.tsx`, `api.ts`, `App.tsx`, `AppLayout.tsx`, docs.
- Tests: initial render / success / API error / empty datasets validation passed.
- Next: US036.

US036 — Documentation Sync + ADR Extension

- Completed Story: sync Project Status / Roadmap after Campaign UI + Analysis + Multi-dataset; add ADR-008 (deterministic analysis) and ADR-009 (multi-dataset campaign); update ADR index + CHANGELOG.
- Changed Files: `project-status.md`, `roadmap.md`, `CHANGELOG.md`, `docs/adr/README.md`, `ADR-008-deterministic-research-analysis.md`, `ADR-009-multi-dataset-campaign.md`.
- Tests: markdown prettier/check only.
- Next: US037 — Walk-Forward Testing Foundation.

US037 — Walk-Forward Testing Foundation

- Completed Story: `WalkForwardCampaignService` orchestration stub — validates request, returns empty `WalkForwardCampaignSummary`, TODO for real walk-forward; no dataset split / backtests / controller.
- Changed Files: `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.ts`, `walk-forward-campaign.service.spec.ts`, `research-campaign.module.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: `walk-forward-campaign.service.spec.ts` (valid / invalid window / invalid step / empty paramsList) passed.
- Next: US038.

US038 — Walk-Forward Window Builder

- Completed Story: `buildWalkForwardWindows(datasetLength, windowSize, stepSize)` builds inclusive train/test index windows; `WalkForwardCampaignService` returns `windowCount` + `windows` (no experiments).
- Changed Files: `walk-forward-window-builder.ts`, `walk-forward-window-builder.spec.ts`, `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.ts`, `walk-forward-campaign.service.spec.ts`, docs.
- Tests: window-builder (normal / exact fit / one window / too small / invalid step / invalid window) + service specs passed.
- Next: US039.

US039 — Walk-Forward Campaign Runner (без persistence)

- Completed Story: `WalkForwardCampaignService` runs one `ResearchCampaignService.run` per built window; returns `windowCount` / `windows` / `successfulWindows` / `failedWindows`; continues when a window fails; no aggregate metrics.
- Changed Files: `walk-forward-campaign.service.ts`, `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.spec.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: one window / several windows / one failure continues / successful+failed counts passed.
- Next: US040 — Walk-Forward Aggregate Report.

US040 — Walk-Forward Aggregate Report

- Completed Story: aggregate over successful windows — averages (PF / return / drawdown / expectancy), best/worst window index, pass/needsReview/fail counts, overallVerdict (PASS / NEEDS_REVIEW / FAIL); error windows excluded from averages.
- Changed Files: `walk-forward-aggregate.ts`, `walk-forward-aggregate.spec.ts`, `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.ts`, `walk-forward-campaign.service.spec.ts`, docs.
- Tests: aggregate unit + service aggregate cases passed; prior walk-forward tests unchanged and still green.
- Next: US041.

US041 — Walk-Forward Analysis Service

- Completed Story: deterministic `WalkForwardAnalysisService.buildAnalysis(WalkForwardCampaignSummary)` → overallAssessment / strengths / weaknesses / recommendations / stabilityScore / consistencyScore (no AI).
- Changed Files: `walk-forward-analysis.types.ts`, `walk-forward-analysis.service.ts`, `walk-forward-analysis.service.spec.ts`, `research-campaign.module.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: robust / promising / unstable / all failed / empty / error windows passed.
- Next: US042.

US041A — Documentation Sync

- Completed Story: sync Current Goal after Walk-Forward Aggregate + Analysis; fix Roadmap Next (remove misplaced US024 — Portfolio research → Future Milestones only); verify CHANGELOG [Unreleased] covers US037–US041.
- Changed Files: `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: documentation only.
- Next: US042.

US042 — Walk-Forward API

- Completed Story: `POST /campaigns/run-walk-forward` validates input and returns `WalkForwardCampaignSummary` via existing `WalkForwardCampaignService` (no persistence / Knowledge / Analysis).
- Changed Files: `campaign.controller.ts`, `campaign.controller.spec.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: valid / invalid window / invalid step / service throws / response passthrough passed.
- Next: US043.

US043 — Walk-Forward UI

- Completed Story: `WalkForwardCampaignPage` at `/campaigns/walk-forward` — form + summary + per-window table via `runWalkForwardCampaign()`; no Analysis / charts / Knowledge / History.
- Changed Files: `WalkForwardCampaignPage.tsx`, `WalkForwardCampaignPage.spec.tsx`, `api.ts`, `App.tsx`, `AppLayout.tsx`, docs.
- Tests: initial render / successful request / API error / invalid windowSize passed.
- Next: US044.

US043A — Walk-Forward Architecture Freeze

- Completed Story: ADR-010 freezes Walk-Forward architecture (role, Window Builder, Runner, Aggregate, Analysis, API, UI) as orchestration above `ResearchCampaignService`; Research Engine not modified; update ADR index + Important Decisions + CHANGELOG.
- Changed Files: `ADR-010-walk-forward-architecture.md`, `docs/adr/README.md`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: markdown prettier/check only.
- Next: US044.

US044 — ADR-011 Dataset Slice Architecture

- Completed Story: ADR-011 freezes Dataset Slice design — immutable `SliceRef` (`datasetId` + range + role), `sliceIdentity` without separate `sliceId`, no `parentWindowId`, `SliceResolver` as sole construction point, roles include `VALIDATION`, recommend future Result Identity inclusion; Engine unchanged.
- Changed Files: `ADR-011-dataset-slice-architecture.md`, `docs/adr/README.md`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: documentation only.
- Next: US045.

US045 — Dataset Slice Domain Model

- Completed Story: `@trp/research` `dataset-slice` module — `SliceRole` / `SliceIdentity` / `SliceRef`, `createSliceRef` + `resolveSlice(bars)` per ADR-011; no Experiment/Campaign/WF/Engine integration.
- Changed Files: `packages/research/src/dataset-slice/*`, `packages/research/src/index.ts`, `project-status.md`, `roadmap.md`, `CHANGELOG.md`.
- Tests: `slice-resolver.spec.ts` (immutable / valid / invalid / empty / identity / role) passed.
- Next: US046.

US046 — Experiment Slice Support

- Completed Story: `runExperiment` accepts optional `SliceRef`; resolves bars via `resolveSlice`; Engine still receives plain bars; ExperimentReport includes `sliceIdentity` only for sliced runs.
- Changed Files: `packages/research/src/index.ts`, `packages/research/src/types.ts`, `packages/research/src/experiment-slice.spec.ts`, docs.
- Tests: full / train / test / invalid slice / sliceIdentity present/absent passed.
- Next: US047.

US047 — Campaign Slice Support

- Completed Story: `ResearchCampaignService.run` accepts optional `sliceRef`; all experiments use that slice; Campaign Summary unchanged; CampaignReport may include `sliceIdentity` provenance.
- Changed Files: `research-campaign.service.ts`, `research-campaign.types.ts`, `campaign-report.service.ts`, `campaign-report.types.ts`, `experiments.service.ts`, specs, docs.
- Tests: full / train / test / invalid slice / report sliceIdentity present/absent passed.
- Next: US048.

US048 — True Walk-Forward Execution

- Completed Story: each Walk-Forward window builds Train/Test `SliceRef` via `createSliceRef`; campaign runs with Train slice only (test slice provenance only); window carries `trainSliceIdentity` / `testSliceIdentity`; aggregate/analysis unchanged.
- Changed Files: `walk-forward-campaign.service.ts`, `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.spec.ts`, docs.
- Tests: train/test SliceRef per window / campaign uses Train / invalid slice provenance / aggregate unchanged passed.
- Next: US049.

US049 — Walk-Forward Test Evaluation

- Completed Story: after train campaign, best experiment params are evaluated on Test SliceRef via `ExperimentsService`; window gains train/test experiment ids, metrics, verdicts; test failures do not fail the window or stop others; aggregate remains train-based.
- Changed Files: `walk-forward-campaign.service.ts`, `walk-forward-campaign.types.ts`, `walk-forward-campaign.service.spec.ts`, docs.
- Tests: train+best+test flow / test uses best params / test error continues / aggregate unchanged passed.
- Next: US050.

US050 — Walk-Forward Aggregate v2

- Completed Story: Walk-Forward summary gains independent Test Aggregate (`testPassCount` / averages); Train Aggregate kept for reference; `overallVerdict` uses Test verdicts only; Analysis untouched.
- Changed Files: `walk-forward-aggregate.ts`, `walk-forward-aggregate.spec.ts`, `walk-forward-campaign.service.ts`, `walk-forward-campaign.types.ts`, related specs, docs.
- Tests: train-only / train+test / mixed verdicts / failed test / empty test metrics passed.
- Next: US051.

US050A — Walk-Forward Documentation Sync

- Completed Story: ADR-010 refreshed to current implementation (Dataset Slice, Train/Test slices, Train Campaign, Test Experiment, Aggregate v2, Test-based `overallVerdict`, Analysis still on Train Aggregate by intent); ADR index blurb updated; CHANGELOG note.
- Changed Files: `docs/adr/ADR-010-walk-forward-architecture.md`, `docs/adr/README.md`, `docs/project/project-status.md`, `CHANGELOG.md`.
- Tests: n/a (documentation only).
- Next: US051.

US051 — Persistence Domain

- Completed Story: introduced Campaign Persistence domain (`CampaignRecord`, `CampaignRepository`, `CampaignMapper`, `InMemoryCampaignRepository`); Campaign execution / Walk-Forward / API / UI / DB unchanged and unwired.
- Changed Files: `apps/api/src/modules/campaign-persistence/*`, docs.
- Tests: repository CRUD / multi-record isolation / mapper CampaignReport → CampaignRecord passed.
- Next: US052.

US052 — Campaign Persistence Service

- Completed Story: `CampaignPersistenceService` is the Persistence entry point (DI repository + mapper); save maps Report→Record; reads return `CampaignReport` only; Campaign / Walk-Forward / API / UI unwired.
- Changed Files: `campaign-persistence.service.ts`, `campaign-persistence.module.ts`, mapper `toReport`, specs, docs.
- Tests: save/mapper delegation / find / exists / delete / exception propagation / no CampaignRecord leak passed.
- Next: US053.

US053 — Campaign Session Model

- Completed Story: introduced `CampaignSession` domain (`status`, `metadata`, factory); sessions start as CREATED with report assigned; no persistence or Campaign integration.
- Changed Files: `apps/api/src/modules/campaign-session/*`, docs.
- Tests: factory create / id / createdAt / CREATED / metadata / report / completedAt undefined passed.
- Next: US054.

US054 — Persist Campaign Session

- Completed Story: Persistence switched to `CampaignSession`; `CampaignSessionMapper` + extended `CampaignRecord` (status/metadata/timestamps/report); service returns sessions only; Campaign execution unwired.
- Changed Files: `campaign-record.ts`, `campaign-session.mapper.ts`, `campaign-persistence.service.ts`, in-memory clone, specs, docs; removed report-level `CampaignMapper`.
- Tests: save/load / mapper both ways / metadata+status+timestamps / multi-session isolation passed.
- Next: US055.

US055 — Integrate Campaign Persistence

- Completed Story: `ResearchCampaignService.run` builds report, creates CampaignSession via factory, sets COMPLETED/FAILED + `completedAt`, persists via `CampaignPersistenceService`; failures rethrow after FAILED persist; one run = one session.
- Changed Files: `research-campaign.service.ts`, `research-campaign.module.ts`, `campaign-session.factory.ts` (`@Injectable`), specs, docs.
- Tests: successful COMPLETED persist / FAILED persist + rethrow / completedAt / one session per execution passed.
- Next: RC-05 Architecture Audit.

US056 — Campaign History Query Service

- Completed Story: read-only `CampaignHistoryService` queries sessions via repository + mapper; `CampaignRecord` never leaves the service; writes stay on PersistenceService.
- Changed Files: `campaign-history.service.ts`, module exports, specs, docs.
- Tests: getById / getAll / exists / empty list / unknown id / Session-only returns passed.
- Next: US057.

US057 — Campaign History Search & Filters

- Completed Story: `HistoryQuery` + `CampaignHistoryService.search`; filters applied in-service after `findAll`; AND logic; Repository contract unchanged.
- Changed Files: `history-query.ts`, `campaign-history.service.ts`, specs, docs.
- Tests: status / engineVersion / datasetId / tags / AND / no filters / no matches passed.
- Next: US058.

US058 — Campaign History Pagination & Sorting

- Completed Story: `HistoryPageRequest` / `HistoryPage`; `search` applies filter → sort → paginate; sort by createdAt / completedAt / status (ASC/DESC); Repository unchanged.
- Changed Files: `history-page.ts`, `campaign-history.service.ts`, specs, docs.
- Tests: first/second page / out of range / ASC/DESC / pagination after filter / totalItems / totalPages passed.
- Next: US059.

US059 — Campaign History API

- Completed Story: read-only `CampaignHistoryController` exposes list + get-by-id over `CampaignHistoryService`; query params for page/sort/filters; 404 when missing; domain model API docs updated.
- Changed Files: `campaign-history.controller.ts`, module, specs, `campaign-domain-model.md`, docs.
- Tests: GET history / GET by id / pagination / sorting / filtering / 404 / empty history passed.
- Next: US060 — RC-06 Architecture Audit.

US060 — RC-06 Architecture Audit

- Completed Story: validated dependency direction, History flow, public History API, and RC-06 test suite (63 passed); synced campaign-domain-model + architecture-snapshot; no code/contract changes.
- Changed Files: `docs/project/project-status.md`, `roadmap.md`, `CHANGELOG.md`, `campaign-domain-model.md`, `architecture-snapshot.md`.
- Tests: campaign-session + campaign-persistence + campaign persistence integration — 63 passed.
- Next: RC-07.

US061 — Export Foundation

- Completed Story: Campaign Export module with Strategy Pattern (`JsonCampaignExporter` / `CsvCampaignExporter`); `CampaignExportService` exports `CampaignSession` only (never `CampaignRecord`); no HTTP API.
- Changed Files: `apps/api/src/modules/campaign-export/*`, `docs/project/project-status.md`, `roadmap.md`, `CHANGELOG.md`, `campaign-domain-model.md`, `architecture-snapshot.md`.
- Tests: JSON export / CSV export / invalid format / metadata + report in payload — 5 passed.
- Next: US062.

US062 — Export API

- Completed Story: read-only `CampaignExportController` at `GET /campaign-history/:sessionId/export`; loads session via HistoryService, exports via CampaignExportService; Content-Type + 404/400.
- Changed Files: `campaign-export.controller.ts`, `campaign-export.module.ts`, `app.module.ts`, specs, `docs/project/api.md`, docs.
- Tests: export JSON / CSV / invalid format / empty format / session not found / content-type — 6 controller + 5 service passed.
- Next: US063.

RC-07 finalized

- Completed Story: RC-07 finalized — full test suite green, lint clean for RC-07 scope, docs synced (project-status / roadmap / CHANGELOG / campaign-domain-model / architecture-snapshot / api.md), export + session persistence stack committed and pushed.
- Changed Files: campaign-session, campaign-persistence, campaign-export, research-campaign wiring, docs.
- Tests: monorepo — api 167, web 18, research 24 (all passed).
- Next: RC-08.

US063 — Import Foundation

- Completed Story: Campaign Import module with Strategy Pattern (`JsonCampaignImporter`); `CampaignImportService` parses payload → `CampaignSession` only; no persist / no HTTP API.
- Changed Files: `apps/api/src/modules/campaign-import/*`, `docs/project/project-status.md`, `roadmap.md`, `CHANGELOG.md`, `campaign-domain-model.md`, `architecture-snapshot.md`.
- Tests: valid JSON / invalid JSON / unsupported format / metadata restored / report restored — 5 passed.
- Next: US064.

US064 — JSON Import Validation

- Completed Story: `CampaignSessionValidator` + `ImportValidationError`; `JsonCampaignImporter` flow parse → validator → `CampaignSession`; rejects malformed JSON / missing fields / invalid version / timestamps / schema.
- Changed Files: `campaign-session.validator.ts`, `import-validation.error.ts`, `json-campaign.importer.ts`, specs, docs.
- Tests: validator + importer — 19 passed.
- Next: US065.

US065 — Import API

- Completed Story: `CampaignImportController` at `POST /campaign-import`; body `{ format, payload }` → `CampaignSession`; maps validation errors to 400; does not persist.
- Changed Files: `campaign-import.controller.ts`, `campaign-import.module.ts`, `app.module.ts`, specs, `docs/project/api.md`, docs.
- Tests: successful import / malformed JSON / invalid schema / unsupported format / validation error / metadata + report restored — 8 controller (+ existing import suite) passed.
- Next: US066.

US066 — Replay Foundation

- Completed Story: `CampaignReplayService` prepares `ReplayResult` / `ReplayContext` from `CampaignSession`; restores `campaignConfig`, copies report, status `READY`; no execution / AI / persist / API.
- Changed Files: `apps/api/src/modules/campaign-replay/*`, docs.
- Tests: create replay / replayId / source link / config / report copy / READY / invalid session — 7 passed.
- Next: US067.

US067 — Replay Execution

- Completed Story: `CampaignReplayService.execute` reuses `ResearchCampaignService.run({ persistSession: false })`; regenerates report; statuses RUNNING/COMPLETED/FAILED; transient (no History writes).
- Changed Files: `campaign-replay.service.ts`, `replay-status.ts`, `research-campaign.service.ts` (optional persist flag), session metadata `paramsList`, specs, docs.
- Tests: successful replay / status / regenerated report / config reused / source linked / FAILED / no repository — 14 passed.
- Next: US068.

RC-08 finalized

- Completed Story: RC-08 finalized — Import (US063–US065) + Replay (US066–US067) verified; full monorepo tests green; RC-08 lint scope clean; docs synced; committed and pushed.
- Changed Files: campaign-import, campaign-replay, session metadata/factory, research-campaign persist flag, app.module, docs.
- Tests: monorepo — api 208, web 18, research 24 (all passed).
- Next: RC-09.

US069 — Job Domain Model

- Completed Story: Jobs domain module with `Job` / `JobResult` / `JobMetadata`, `JobStatus` / `JobType`, and create-only `JobService` (campaign + replay jobs); no queue / execution / persist / API.
- Changed Files: `apps/api/src/modules/jobs/*`, docs.
- Tests: create campaign/replay job / default PENDING / timestamps / metadata / enums — 6 passed.
- Next: US070.

US070 — Job Queue Abstraction

- Completed Story: `JobQueue` interface + `JOB_QUEUE` token + `InMemoryJobQueue` (FIFO); `JobService` creates then enqueues `PENDING` jobs; DI never binds concrete queue into service.
- Changed Files: `job-queue.ts`, `job-queue.token.ts`, `in-memory-job.queue.ts`, `job.service.ts`, `jobs.module.ts`, specs, docs.
- Tests: enqueue / dequeue / get / cancel / FIFO / DI token / interface-only dependency — 12 passed.
- Next: US071.

US071 — Background Campaign Runner

- Completed Story: `BackgroundJobRunner` processes queued CAMPAIGN/REPLAY jobs via `ResearchCampaignService` / `CampaignReplayService`; PENDING→RUNNING→COMPLETED|FAILED with `JobResult`; no job persistence.
- Changed Files: `background-job.runner.ts`, `job-runner.ts`, `job-metadata.ts`, `jobs.module.ts`, specs, docs.
- Tests: campaign/replay process / status / completed/failed result / empty queue / no persistence — 20 jobs suite passed.
- Next: US072.

US072 — Job Status API

- Completed Story: Read-only `JobController` exposes `GET /jobs` and `GET /jobs/:jobId` via `JobService` → `JobQueue.list` / `get`; 404 when missing; no execution/processing.
- Changed Files: `job.controller.ts`, `job.service.ts`, `job-queue.ts`, `in-memory-job.queue.ts`, `jobs.module.ts`, `app.module.ts`, specs, docs (`api.md`).
- Tests: list / get / 404 / completed result / pending no result / queue unchanged / controller — 30 jobs suite passed.
- Next: US073.

US073 — Job Cancellation

- Completed Story: Cancel PENDING jobs via `JobService.cancelJob` → `JobQueue.cancel`; `POST /jobs/:jobId/cancel` (200/404/409); runner skips CANCELLED; no execution result on cancel.
- Changed Files: `job-queue.ts`, `in-memory-job.queue.ts`, `job.service.ts`, `job.controller.ts`, `job-cancel-conflict.error.ts`, `background-job.runner.ts`, specs, docs.
- Tests: cancel pending / cannot cancel running|completed|failed|cancelled / runner skip / 404 / 409 / controller — 41 jobs suite passed.
- Next: US074.

RC-09 finalized

- Completed Story: RC-09 finalized — Jobs framework (US069–US073) verified; full monorepo tests green; RC-09 lint scope clean (pre-existing experiments/knowledge lint debt unchanged); docs synced; committed and pushed.
- Changed Files: `apps/api/src/modules/jobs/*`, `app.module.ts`, docs (`project-status` / `roadmap` / `CHANGELOG` / `campaign-domain-model` / `architecture-snapshot` / `api.md`).
- Tests: monorepo — api 249, web 18, research 24 (all passed).
- Next: RC-10.

US075 — Knowledge Domain Model

- Completed Story: In-memory Knowledge domain above Experiments — `KnowledgeEntry` / `KnowledgeMetadata` / `KnowledgeTag` + `KnowledgeDomainService` (`create` / `update` / `get` / `list`); independent from Prisma research_outcome; no Repository / API / extraction.
- Changed Files: `apps/api/src/modules/knowledge/knowledge-entry.ts`, `knowledge-metadata.ts`, `knowledge-tag.ts`, `knowledge-domain.service.ts`, `knowledge.module.ts`, specs, docs.
- Tests: create / update / get / list / metadata / tags — 7 passed.
- Next: US076.

US076 — Experiment Entity & Versioning

- Completed Story: In-memory Experiment domain linking CampaignSession → future Knowledge — `Experiment` / `ExperimentVersion` / `ExperimentMetadata` + `ExperimentDomainService` (`createFromSession` / `createVersion` / `get` / `list`); no Repository / API / Knowledge integration.
- Changed Files: `apps/api/src/modules/experiments/experiment.ts`, `experiment-version.ts`, `experiment-metadata.ts`, `experiment-domain.service.ts`, `experiments.module.ts`, specs, docs.
- Tests: create / first version / additional version / history / metadata / list / get — 9 passed.
- Next: US077.

US077 — Knowledge Extraction Pipeline

- Completed Story: Deterministic `KnowledgeExtractionService.extract` from `Experiment.currentVersion.report` + `KnowledgeDomainService.createFromExperiment` upsert (one KnowledgeEntry per Experiment); no AI / Jobs / Events / API.
- Changed Files: `knowledge-extraction.service.ts`, `knowledge-domain.service.ts`, `knowledge.module.ts`, specs, docs.
- Tests: extract / update existing / deterministic / duplicate prevention / tags / metadata / summary — 8 extraction + existing domain suite passed.
- Next: US078.

US078 — Experiment Comparison Service

- Completed Story: Deterministic `ExperimentComparisonService` structural diffs (`compareVersions` / `compareExperiments`) over insights, summary, tags, metadata; `ExperimentComparison` / `ComparisonResult` / `ComparisonChange`; no AI / API / persistence.
- Changed Files: `experiment-comparison.service.ts`, `experiment-comparison.ts`, `comparison-result.ts`, `comparison-change.ts`, `experiments.module.ts`, specs, docs.
- Tests: identical / summary / insights / tags / metadata / compare experiments / invalid version / not found — 10 passed.
- Next: US079.

US079 — Knowledge Search API

- Completed Story: In-memory Knowledge search (`search` / `searchByTag` / `searchByExperiment` / `find`) + `GET /knowledge` with optional `q` / `tag` / `experimentId` (AND; case-insensitive; empty array on miss); no Prisma / AI / vectors.
- Changed Files: `knowledge-domain.service.ts`, `knowledge.controller.ts`, specs, docs (`api.md`).
- Tests: list / title / summary / insight / tag / experimentId / combined / empty / case-insensitive / controller — 12 search+controller + suite passed.
- Next: US080.

RC-10 finalized

- Completed Story: RC-10 finalized — Knowledge & Experiment Intelligence (US075–US079) architecture audit PASS; isolation from Jobs/History/Replay/Export/Import/Persistence verified; full monorepo tests green; RC-10 lint scope clean (pre-existing experiments/knowledge Prisma-spec `any` debt unchanged); docs synced; committed and pushed.
- Changed Files: knowledge domain (entry/extraction/search/API), experiment domain (versioning/comparison), docs.
- Tests: monorepo — api 295, web 18, research 24 (all passed).
- Next: RC-11.

US081 — Pipeline Domain Model

- Completed Story: In-memory generic Research Pipeline domain — `Pipeline` / `PipelineRun` / `PipelineContext` / `PipelineResult` / `PipelineMetadata` + `PipelineDomainService` (create/get/list pipelines & runs); no executor / API / Repository / hooks.
- Changed Files: `apps/api/src/modules/pipeline/*`, docs.
- Tests: create/list/get pipeline / create run / status / context / metadata / list runs — 10 passed.
- Next: US082.

US082 — Pipeline Step Contract

- Completed Story: `PipelineStep` interface + `AbstractPipelineStep` + `PipelineStepMetadata` / `PipelineStepResult` + `PipelineRegistry` (register/get/list; duplicate rejected); Pipeline stores metadata only.
- Changed Files: `pipeline-step.ts`, `abstract-pipeline-step.ts`, `pipeline-step-metadata.ts`, `pipeline-step-result.ts`, `pipeline-registry.ts`, `pipeline.ts`, `pipeline-domain.service.ts`, `pipeline.module.ts`, specs, docs.
- Tests: register / duplicate / get / list / metadata / abstract execute — 16 pipeline suite passed.
- Next: US083.

US083 — Pipeline Executor

- Completed Story: `PipelineExecutor.execute(pipeline, context, run?)` resolves registered steps by `metadata.order` (ties by `stepId`); propagates context; on throw stops and returns failed `PipelineResult`; updates optional `PipelineRun` PENDING→RUNNING→COMPLETED|FAILED; no persistence/API/Campaign/Replay.
- Changed Files: `pipeline-executor.ts`, `pipeline-executor.spec.ts`, `pipeline.module.ts`, `index.ts`, docs.
- Tests: single / ordered / context / missing / duplicate order / throws / run transitions / duration / success & fail — 27 pipeline suite passed.
- Next: US084.

US084 — Pipeline Hooks

- Completed Story: `PipelineHook` (optional before/after pipeline/step + onError) + `PipelineHookRegistry` (register/list; duplicate hookId rejected) + `LoggingPipelineHook`; `PipelineExecutor` invokes hooks around execution; hook exceptions ignored; observation only — no Events/Campaign/Knowledge.
- Changed Files: `pipeline-hook.ts`, `pipeline-hook-registry.ts`, `logging-pipeline-hook.ts`, `pipeline-executor.ts`, `pipeline-hook.spec.ts`, `pipeline.module.ts`, `index.ts`, docs.
- Tests: before/after pipeline/step / onError / multiple hooks / hook failure ignored / order / logging records — 40 pipeline suite passed.
- Next: US085.

US085 — Pipeline Templates

- Completed Story: `PipelineTemplate` + `PipelineTemplateService` (`createTemplate` / `getTemplate` / `listTemplates` / `createPipelineFromTemplate`); built-in Campaign / Replay / Knowledge templates reference blueprint Pipelines (step metadata only); immutable templates yield independent Pipeline copies; duplicate templateId rejected; no execution/API/Campaign integration.
- Changed Files: `pipeline-template.ts`, `pipeline-template.service.ts`, `builtin-pipeline-templates.ts`, `pipeline-template.service.spec.ts`, `pipeline.module.ts`, `index.ts`, docs.
- Tests: create / list / get / instantiate / independent copy / metadata / built-ins / duplicate — 50 pipeline suite passed.
- Next: US086.

RC-11 finalized

- Completed Story: RC-11 finalized — Research Pipeline Engine (US081–US085) architecture audit PASS; isolation from Campaign/Knowledge/Experiment/Jobs/Replay/History/Export/Import/Persistence verified; no Event Bus / Pub-Sub; pipeline lint scope clean (pre-existing experiments/knowledge Prisma-spec `any` debt unchanged); docs synced; committed and pushed.
- Changed Files: `apps/api/src/modules/pipeline/*`, docs.
- Tests: monorepo — api 345, web 18, research 24 (all passed).
- Next: RC-12.

US087 — Campaign Pipeline Steps

- Completed Story: Extracted ResearchCampaignService stages into PipelineSteps (`PrepareCampaignStep` / `ExecuteResearchStep` / `AggregateResultStep` / `BuildReportStep` / `PersistCampaignStep`); registered on `PipelineRegistry`; Campaign built-in template metadata updated; `ResearchCampaignService` flow and REST API unchanged — no PipelineExecutor wiring.
- Changed Files: `apps/api/src/modules/pipeline/steps/campaign/*`, `pipeline-template.service.ts`, `pipeline.module.ts`, `app.module.ts`, specs, docs.
- Tests: per-step / registry / template order / output parity with ResearchCampaignService — 59 pipeline suite passed.
- Next: US088.

US088 — Execute Campaign through PipelineExecutor

- Completed Story: `ResearchCampaignService` is now an orchestrator — creates in-memory `PipelineRun`, instantiates Campaign pipeline from built-in template, executes via `PipelineExecutor`; business logic remains in Campaign PipelineSteps; public `run()` contract, FAILED persistence path, REST API, Jobs, and Replay behavior preserved.
- Changed Files: `research-campaign.service.ts`, `research-campaign.module.ts`, `pipeline.module.ts`, `pipeline-executor.ts`, `pipeline-template.service.ts`, specs, docs.
- Tests: campaign / pipeline / jobs / replay / persistence regression — 237 related tests passed.
- Next: US089.

US089 — Replay Pipeline Integration

- Completed Story: Extracted Replay stages into PipelineSteps (`LoadReplaySessionStep` / `RestoreReplayContextStep` / `ExecuteReplayCampaignStep` / `FinalizeReplayStep`); registered on `PipelineRegistry`; Replay built-in template metadata updated; `CampaignReplayService` orchestrates via template + `PipelineExecutor` + in-memory `PipelineRun`; `ReplayResult` / Jobs / History / Campaign execution unchanged.
- Changed Files: `apps/api/src/modules/pipeline/steps/replay/*`, `campaign-replay.service.ts`, `campaign-replay.module.ts`, `pipeline-template.service.ts`, specs, docs.
- Tests: replay / pipeline / jobs / campaign regression — 199 related tests passed.
- Next: US090.

US090 — Knowledge Extraction Pipeline Integration

- Completed Story: Extracted Knowledge extraction stages into PipelineSteps (`PrepareKnowledgeExtractionStep` / `ExtractKnowledgeStep` / `UpsertKnowledgeEntryStep`); registered on `PipelineRegistry`; Knowledge built-in template metadata updated; `KnowledgeDomainService.createFromExperiment` orchestrates via template + `PipelineExecutor` + in-memory `PipelineRun`; identical KnowledgeEntry / upsert / Experiment compatibility; no AI / Events / Jobs / API changes.
- Changed Files: `apps/api/src/modules/pipeline/steps/knowledge/*`, `knowledge-domain.service.ts`, `knowledge.module.ts`, `knowledge-extraction.service.ts`, `pipeline-template.service.ts`, specs, docs.
- Tests: knowledge / pipeline / campaign / replay / jobs / experiments regression — 204 related tests passed.
- Next: US091.

US091 — RC-12 Architecture Audit

- Completed Story: RC-12 finalized — Research Pipeline Engine is the unified execution runtime for Campaign / Replay / Knowledge (US081–US090); architecture checklist PASS; orchestrators only; templates metadata-only; hooks lifecycle-only (no Event Bus); isolation from Jobs/History/Export/Import/REST verified; docs synced; committed and pushed.
- Changed Files: docs (audit closeout); US087–US090 pipeline migration included in same commit; no external API / behavior changes.
- Tests: monorepo — api 369, web 18, research 24 (all passed). Lint: pipeline orchestration scope clean; pre-existing experiments/knowledge Prisma-spec `any` debt unchanged (same as RC-11).
- Next: US092.

US092 — Architecture Snapshot Synchronization

- Completed Story: Synchronized `architecture-snapshot.md` with RC-12 — Pipeline Engine as unified runtime; Campaign / Replay / Knowledge orchestrator roles; generic PipelineContext; metadata-only templates; lifecycle hooks (no Event Bus); no source/test/API changes.
- Changed Files: `docs/project/architecture-snapshot.md`, `docs/project/project-status.md`, `CHANGELOG.md`, `docs/project/roadmap.md`.
- Tests: N/A (docs only).
- Next: US093.

US093 — Technical Debt Register

- Completed Story: Introduced living `docs/project/technical-debt.md` (Accepted / Deferred / Planned; current infrastructure debt + possible RC milestones); linked from Project Status; no implementation changes.
- Changed Files: `docs/project/technical-debt.md`, `docs/project/project-status.md`, `CHANGELOG.md`, `docs/project/roadmap.md`, `docs/project/architecture-snapshot.md`.
- Tests: N/A (docs only).
- Next: US094.

US094 — Module Maturity Matrix

- Completed Story: Introduced living `docs/project/module-maturity.md` (status / scope / limitations / next milestone for Research Engine, Campaign, Pipeline, Replay, Knowledge, Experiment, Persistence, History, Import, Export, Jobs); linked from Project Status; no implementation changes.
- Changed Files: `docs/project/module-maturity.md`, `docs/project/project-status.md`, `CHANGELOG.md`, `docs/project/roadmap.md`.
- Tests: N/A (docs only).
- Next: US095.

US095 — Insight Domain

- Completed Story: Introduced Insight domain (`Insight` / `InsightType` / `InsightSource` / `InsightMetadata`) + in-memory `InsightDomainService` (`create` / `update` / `delete` / `getById` / `search`); `InsightModule` wired in `AppModule`; references Knowledge ids only; no AI / Pipeline / REST / Prisma.
- Changed Files: `apps/api/src/modules/insight/*`, `app.module.ts`, docs.
- Tests: InsightDomainService — 10 passed.
- Next: US096.

US096 — Insight Extraction Pipeline

- Completed Story: Insight Pipeline Steps (`insights.prepare` / `insights.extract` / `insights.persist`); registered on `PipelineRegistry`; built-in Insight template; deterministic extraction rules; `InsightDomainService.extractFromKnowledge` orchestrates via `PipelineExecutor`; Campaign / Replay / Knowledge pipelines unchanged.
- Changed Files: `apps/api/src/modules/pipeline/steps/insight/*`, `insight-domain.service.ts`, `insight.module.ts`, `pipeline-template.service.ts`, `builtin-pipeline-templates.ts`, specs, docs.
- Tests: insight + insight pipeline + template — 26 passed.
- Next: US097.

US097 — Cross-Campaign Analysis

- Completed Story: `CrossCampaignAnalysisService` + Cross-Campaign Analysis Pipeline (`cross-analysis.prepare` / `compare` / `persist`); built-in template; deterministic multi-campaign findings; writes Insights only via `InsightDomainService`; Campaign / Replay / Knowledge / PipelineExecutor unchanged.
- Changed Files: `apps/api/src/modules/cross-campaign-analysis/*`, `pipeline/steps/cross-analysis/*`, `pipeline-template.service.ts`, `builtin-pipeline-templates.ts`, `app.module.ts`, docs.
- Tests: cross-campaign analysis + template + insight regression — 27 related passed.
- Next: US098.

US098 — Recommendation Engine

- Completed Story: `RecommendationModule` + in-memory `RecommendationDomainService` (CRUD + `generateFromInsights`); deterministic rules from Insights; Insight id refs only; no Pipeline / REST / AI / Prisma.
- Changed Files: `apps/api/src/modules/recommendation/*`, `app.module.ts`, docs.
- Tests: recommendation rules + domain service — 11 passed.
- Next: US099.

US099 — Research Report Domain

- Completed Story: `ResearchReportModule` + in-memory `ResearchReportDomainService` (`create` / `getById` / `search` / `build`); structured aggregation of Campaign / Knowledge / Insight / Recommendation by id; no export / AI / REST / Pipeline.
- Changed Files: `apps/api/src/modules/research-report/*`, `app.module.ts`, docs.
- Tests: research-report build rules + domain service — 7 passed.
- Next: US100.

US100 — Research Intelligence API

- Completed Story: Read-only REST for Insights / Recommendations / Reports / Cross-Campaign Analysis; `HistoryPage` lists; Domain Service adapters only; Cross-Campaign result store for GET.
- Changed Files: controllers + modules under insight / recommendation / research-report / cross-campaign-analysis; `common/api-list`; `docs/project/api.md`; docs.
- Tests: 4 controller suites + cross-campaign regression — 20 related passed.
- Next: US101.

US101 — RC-13 Final Architecture Audit

- Completed Story: RC-13 architecture audit PASS WITH RECOMMENDATIONS; docs closeout — Living Next RC-14; Accepted Legacy dual paths (CampaignReport.recommendations / Knowledge.insights string[] / ResearchAnalysis); TD-009 Accepted; TD-010 Planned.
- Changed Files: docs only (`architecture-snapshot.md`, `project-status.md`, `roadmap.md`, `module-maturity.md`, `CHANGELOG.md`, `technical-debt.md`).
- Tests: N/A (audit / docs).
- Next: RC-14.

---

# Current Version

Research Engine:
1.0.3

Validation:
1.0.2

Knowledge Schema:
2

Note: ці версії стосуються working-tree Research OS semantics; окремий git release ще не створено.

Simulation Platform (apps/api backtesting / portfolio / trade / performance) semantics were corrected during Validation Sprint V1 (RC-15.1): classic PnL identity `realized + unrealized = total`, `equity = initialCapital + realizedPnL + unrealizedPnL`, and determinism anchored to bar / session timestamps. These are separate from the `@trp/research` `researchEngineVersion` (which governs Knowledge identity and is unchanged). See [`../research/version-history.md`](../research/version-history.md).

---

# Open Technical Debt

Living register: [`technical-debt.md`](./technical-debt.md) (US093).

Infrastructure / runtime debt (InMemory stores, PipelineRun, Scheduler, AuthZ, vector search, Prisma `any`, `forwardRef`) is tracked there with Accepted / Deferred / Planned status.

Accepted Legacy (do not expand; migrate RC-14+): `CampaignReport.recommendations`, `KnowledgeEntry.insights` string[], `ResearchAnalysis` parallel stack (TD-011–TD-013). TD-009 Accepted; TD-010 Planned.

Research/data notes still relevant locally:

- Legacy Knowledge entries (pre-versioning) без `resultIdentityKey` / version fields — живуть через structural legacy detection.
- Donchian(10) Knowledge може відображати pre-accounting PASS (dedup за configHash першого run).
- EMA campaign (9 configs на 4344 bars) не всі збережені як окремі Experiments у БД (частина runs була поза API).
- Experiment не зберігає окремо `accountingVersion`, runtime/env metadata, equity curve.
- UI Research Page ще EMA-centric у copy; фільтр по strategyId відсутній.

---

# Future Backlog

High Priority

- RC-14.
- US074.
- Наступна research hypothesis після EMA + Donchian FAIL.
- За потреби: campaign-level Knowledge summary (не лише per-config).

Medium Priority

- Experiment provenance extensions (env metadata, optional accountingVersion).
- Research UI: filter by strategy, show params + FAIL reasons.

Low Priority

- Equity curve persistence.
- Random seed field (якщо з’явиться недетермінізм).
- Knowledge graph / similarity search.

---

# Important Decisions

Повний ADR Index: [`docs/adr/README.md`](../adr/README.md)

- Knowledge immutable: старі записи не оновлюються і не видаляються.
- Result Identity (`configIdentityKey` + engine + validation versions) використовується для dedup.
- Engine Version окрема від `gitCommit`; `gitCommit` — лише provenance.
- Single source of truth для версій: `apps/api/src/modules/knowledge/knowledge.version.ts`.
- EMA залишається benchmark; unfiltered EMA не є MVP baseline.
- Donchian FAIL після accounting fix — чесний негативний результат.
- Validation rules не підлаштовуються під PASS.
- Multi-strategy через Registry; без plugin marketplace у V1.
- Цей файл (`docs/project/project-status.md`) — єдиний living project status; оновлювати після кожної User Story.
- Commit після 2–4 US; push лише за явною командою користувача (див. `release-process.md`).
- Scope > 3 modules або вихід за межі story → Architecture Review замість реалізації.
- Walk-Forward Architecture Freeze (ADR-010): Campaign Layer orchestration above `ResearchCampaignService` (Window Builder, Runner, Aggregate, Analysis, API, UI); Research Engine is not modified.
- Dataset Slice Architecture (ADR-011): immutable `SliceRef`; `SliceResolver` sole construction; `sliceIdentity` = datasetId + range + role; recommend future Result Identity inclusion; Engine unchanged.
