# TRP Research OS — Roadmap

Last updated: 2026-08-10 (RC-26 CLOSED — Trading Orchestrator + Market State; tag `v1.0.0-rc26`)

Living roadmap for product direction.

Related:

- Product Vision (Level-0): [`trp-product-vision.md`](./trp-product-vision.md)
- UX Vision (Level-0): [`trp-ux-vision.md`](./trp-ux-vision.md)
- Project Status: [`project-status.md`](./project-status.md)
- Release History: [`release-history.md`](./release-history.md)
- Story ID Allocation: [`story-id-allocation.md`](./story-id-allocation.md)
- RC-17 Release Planning: [`rc-17-release-planning.md`](./rc-17-release-planning.md)
- RC-17 Roadmap: [`rc-17-roadmap.md`](./rc-17-roadmap.md)
- RC-17 Retrospective: [`rc-17-retrospective.md`](./rc-17-retrospective.md)
- Architecture Decision Log: [`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md)
- ADR Index: [`../adr/README.md`](../adr/README.md)
- Release Process: [`release-process.md`](./release-process.md)
- Technical Debt: [`technical-debt.md`](./technical-debt.md)
- Module Maturity: [`module-maturity.md`](./module-maturity.md)
- Changelog: [`../../CHANGELOG.md`](../../CHANGELOG.md)
- V1 Completion: [`../releases/V1-COMPLETION.md`](../releases/V1-COMPLETION.md)

---

## Completed

- US001 — First Successful Research (audit)
- US002 — Research Dataset Expansion (audit)
- US003 — Paginated Binance Import
- US004 — First EMA Research Campaign
- US005 — Explain the Failure
- US006 — Design the Next Research Hypothesis
- US007 — Architecture Review Before Implementation
- US008 — Multi-Strategy Foundation
- US009 — Implement Donchian Breakout
- US010 — First Donchian Campaign
- US011 — Accounting Audit
- US012 — Fix Accounting Bug
- US013 — Record Research Knowledge (audit)
- US014 — Research Knowledge Foundation
- US015 — Knowledge Versioning / Provenance
- US016 — Experiment Provenance Versioning
- US017 — Research Campaign
- US018 — Campaign Report
- US019 — Campaign API
- US000 / US000A — Project Memory + ADR Index
- Documentation Workflow — Project Status, Changelog, Release Process
- US020A — Release Readiness Fix (documentation only)
- US020B — Release Preparation (documentation only)
- DOC-021 — Architecture Snapshot (documentation only)
- DOC-022 — Campaign Domain Model (documentation only)
- DOC-023 — Research Domain Model (documentation only)
- DOC-024 — Knowledge Domain Model (documentation only)
- US025 — Architecture Consistency Review (documentation only)
- US026 — Documentation Numbering Cleanup (documentation only)
- US025A — ADR-007 Campaign Layer (documentation only)
- US025B — Documentation Sync (documentation only)
- US025C — Documentation Sync (final)
- US026 — Campaign API (POST /campaigns/run)
- US027 — Campaign UI API Integration (`runCampaign` client)
- US028 — Campaign Run Page (MVP)
- US029 — Campaign Results Page (MVP)
- US030 — Campaign History (MVP)
- US031 — Deterministic Research Analysis (`ResearchAnalysisService`)
- US032 — Research Analysis API + UI (`POST /campaigns/analyze`, CampaignAnalysisView)
- US033 — Multi-dataset Campaign Service (`MultiDatasetCampaignService`)
- US034 — Multi-dataset Campaign API (`POST /campaigns/run-multi`)
- US035 — Multi-dataset Campaign UI (`MultiDatasetCampaignPage`)
- US036 — Documentation Sync + ADR Extension (ADR-008, ADR-009)
- US037 — Walk-Forward Testing Foundation (`WalkForwardCampaignService` stub)
- US038 — Walk-Forward Window Builder (`buildWalkForwardWindows`)
- US039 — Walk-Forward Campaign Runner (one ResearchCampaign per window)
- US040 — Walk-Forward Aggregate Report (averages + overallVerdict)
- US041 — Walk-Forward Analysis Service (deterministic stability/consistency)
- US041A — Documentation Sync (Walk-Forward status + roadmap cleanup)
- US042 — Walk-Forward API (`POST /campaigns/run-walk-forward`)
- US043 — Walk-Forward UI (`WalkForwardCampaignPage`)
- US043A — Walk-Forward Architecture Freeze (ADR-010)
- US044 — ADR-011 Dataset Slice Architecture
- US045 — Dataset Slice Domain Model (`createSliceRef` / `resolveSlice`)
- US046 — Experiment Slice Support (`runExperiment` + optional `sliceIdentity`)
- US047 — Campaign Slice Support (`ResearchCampaignService` + optional `sliceRef`)
- US048 — True Walk-Forward Execution (Train SliceRef campaign; test provenance)
- US049 — Walk-Forward Test Evaluation (best train params on Test SliceRef)
- US050 — Walk-Forward Aggregate v2 (Train + Test Aggregate; overall from Test)
- US051 — Persistence Domain (CampaignRecord / Repository / Mapper / InMemory)
- US052 — Campaign Persistence Service (entry point; Report ↔ Record via mapper)
- US053 — Campaign Session Model (execution entity + factory; not wired)
- US054 — Persist Campaign Session (Session ↔ Record via CampaignSessionMapper)
- US055 — Integrate Campaign Persistence (Campaign run → Session → save)
- US056 — Campaign History Query Service (read-only getById / getAll / exists)
- US057 — Campaign History Search & Filters (`HistoryQuery` AND filters in-service)
- US058 — Campaign History Pagination & Sorting (`HistoryPage` + sort)
- US059 — Campaign History API (`GET /campaign-history`)
- US060 — RC-06 Architecture Audit (Campaign Session Persistence stack)
- US061 — Export Foundation (JSON/CSV Strategy exporters for CampaignSession)
- US062 — Export API (`GET /campaign-history/:sessionId/export`)
- RC-07 — Campaign Session Persistence + History + Export finalized
- US063 — Import Foundation (JSON Strategy importer for CampaignSession)
- US064 — JSON Import Validation (`CampaignSessionValidator` + `ImportValidationError`)
- US065 — Import API (`POST /campaign-import`)
- US066 — Replay Foundation (`CampaignReplayService` prepare-only)
- US067 — Replay Execution (`execute` via ResearchCampaignService; transient)
- RC-08 — Campaign Import + Replay foundation finalized
- US069 — Job Domain Model (`Job` / `JobStatus` / `JobType` + JobService create-only)
- US070 — Job Queue Abstraction (`JobQueue` + `InMemoryJobQueue` via `JOB_QUEUE`)
- US071 — Background Campaign Runner (`BackgroundJobRunner` → Campaign/Replay)
- US072 — Job Status API (`GET /jobs`, `GET /jobs/:jobId`)
- US073 — Job Cancellation (`POST /jobs/:jobId/cancel`; PENDING only)
- RC-09 — Background Job Execution framework finalized
- US075 — Knowledge Domain Model (`KnowledgeEntry` + in-memory KnowledgeDomainService)
- US076 — Experiment Entity & Versioning (`Experiment` / `ExperimentVersion` + ExperimentDomainService)
- US077 — Knowledge Extraction Pipeline (`KnowledgeExtractionService` + createFromExperiment upsert)
- US078 — Experiment Comparison Service (`compareVersions` / `compareExperiments`; structural diffs)
- US079 — Knowledge Search API (`GET /knowledge?q&tag&experimentId`)
- RC-10 — Knowledge & Experiment Intelligence architecture finalized
- US081 — Pipeline Domain Model (`Pipeline` / `PipelineRun` + PipelineDomainService)
- US082 — Pipeline Step Contract (`PipelineStep` / `AbstractPipelineStep` / `PipelineRegistry`)
- US083 — Pipeline Executor (`PipelineExecutor`; order-resolved steps; run lifecycle)
- US084 — Pipeline Hooks (`PipelineHook` / `PipelineHookRegistry` / `LoggingPipelineHook`)
- US085 — Pipeline Templates (`PipelineTemplate` / `PipelineTemplateService`; built-in Campaign/Replay/Knowledge)
- US086 — RC-11 Architecture Audit (Research Pipeline Engine finalized)
- US087 — Campaign Pipeline Steps (`PrepareCampaignStep` … `PersistCampaignStep`; registry + template)
- US088 — Execute Campaign through PipelineExecutor (`ResearchCampaignService` orchestrator)
- US089 — Replay Pipeline Integration (`CampaignReplayService` orchestrator)
- US090 — Knowledge Extraction Pipeline Integration (`KnowledgeDomainService` orchestrator)
- US091 — RC-12 Architecture Audit (Pipeline Engine unified runtime finalized)
- US092 — Architecture Snapshot Synchronization (RC-12 docs aligned)
- US093 — Technical Debt Register (`docs/project/technical-debt.md`)
- US094 — Module Maturity Matrix (`docs/project/module-maturity.md`)
- US095 — Insight Domain (`InsightModule` + in-memory InsightDomainService)
- US096 — Insight Extraction Pipeline (`insights.prepare` / `extract` / `persist`)
- US097 — Cross-Campaign Analysis (`CrossCampaignAnalysisService` + cross-analysis pipeline)
- US098 — Recommendation Engine (`RecommendationModule` + in-memory RecommendationDomainService)
- US099 — Research Report Domain (`ResearchReportModule` + in-memory ResearchReportDomainService)
- US100 — Research Intelligence API (read-only REST for Insight / Recommendation / Report / Cross-Campaign Analysis)
- US101 — RC-13 Architecture Audit (Research Intelligence finalized; Living Next RC-14)
- RC-14 — Production SaaS foundation (`feat(rc14)` / tag `rc-14`)
- US115 — Market Data Domain
- US116 — Historical Data Import
- US117 — Market Data Provider Abstraction
- US118 — Backtesting Engine
- US119 — Walk-Forward Engine
- US120 — Portfolio Simulation
- US121 — Trade Execution Simulation
- US122 — Performance Metrics
- US123 — Strategy Comparison
- US124 — Simulation Report
- US125 — RC-15 Architecture Audit
- VS001 — Functional Validation (PASS)
- VS002 — Long-running Simulation & Stress Testing (PASS)
- VS003 — Consistency & Invariant Validation (PASS)
- VS004 — Production Readiness Review (PASS WITH RECOMMENDATIONS)
- RC-15.1 — Validation Release (validated fixes integrated; docs synced; repository quality green)
- RC-15.1 — Official release (`bf46b64`, tag `rc-15.1`)
- RC-15 Retrospective & Development Guide v2
- ✓ RC-16 — Planning Session (Paper Trading Platform scope approved)
- ✓ RC-16 — Architecture Freeze (ADR-012…ADR-018 accepted)
- ✓ RC-16 — Frozen Architecture Audit (PASS WITH MINOR RECOMMENDATIONS)
- ✓ RC-16 — M1 Live Market Data Foundation (US126–US152)
- ✓ RC-16 — M2 Durable Paper Order and Accounting Core (US153–US183)
- ✓ US183.1 — RC-15 / M2 Cluster Closure (validation + docs sync; READY FOR RC-16)
- ✓ RC-16 — M3 canonical path (US211–US223 / E13–E16): Strategy Deployment,
  Runtime, Signal Intent, CanonicalOrderPath, E2E candle → Fill → accounting
- ✓ RC-17 — Planning Package accepted (Release Planning, Roadmap E17–E21,
  Development Process, ADL seed, templates); implementation not started

---

## Current Phase

**RC-23 CLOSED · RC-24 CLOSED**

RC-16 paper path and RC-17 Runtime Recovery are baselined. RC-18 mandatory
residuals R1–R5 (US290–US294) are Done; **US295** (ADL-008) remains Open.
RC-19 integration skeleton is **CLOSED**.
RC-20 Command Center foundation (Epics 1–6) is **CLOSED** —
[`rc-20-closure-report.md`](./rc-20-closure-report.md).

**RC-21** Knowledge Lake is **CLOSED** (tag `v1.0.0-rc21`) —
[`rc-21-closure-report.md`](./rc-21-closure-report.md). IDE shell remains
**deferred** (Plan §0).

**RC-22** Strategy Library is **CLOSED** (tag `v1.0.0-rc22`) —
[`rc-22-closure-report.md`](./rc-22-closure-report.md). Domain certified;
Nest ports / persistence / Orchestrator remain deferred.

**RC-23** Runtime Enforcement is **CLOSED** (tag `v1.0.0-rc23`) —
[`rc-23-closure-report.md`](./rc-23-closure-report.md). Gate certified;
Orchestrator / Selection remain deferred. Sequencing:
[`v2-implementation-roadmap.md`](./v2-implementation-roadmap.md).

**RC-24** Reporting, AI Analytics & Notification Delivery is **CLOSED**
(tag `v1.0.0-rc24`) —
[`rc-24-closure-report.md`](./rc-24-closure-report.md).

**RC-25** Market Qualification + Market Profile is **CLOSED**
(tag `v1.0.0-rc25`) —
[`rc-25-closure-report.md`](./rc-25-closure-report.md).

**RC-26** Trading Orchestrator + Market State is **CLOSED**
(tag `v1.0.0-rc26`) —
[`rc-26-closure-report.md`](./rc-26-closure-report.md).

**RC-27** Multi-Exchange Scope — **CLOSED** (`v1.0.0-rc27`)
implemented, awaiting review —
[`rc-27-epic5-consumer-read-ports.md`](./rc-27-epic5-consumer-read-ports.md).
Planning package: [`rc-27-implementation-plan.md`](./rc-27-implementation-plan.md).

Story IDs: **US240–US299** — [`story-id-allocation.md`](./story-id-allocation.md).

Release table: [`release-history.md`](./release-history.md).

Architecture Spec v2.0 is the V2 constitution:
[`trp-architecture-specification-v2.md`](./trp-architecture-specification-v2.md).
Architecture Freeze ADR-012…ADR-018 remains ACTIVE. Chronological evolution:
[`../Architecture/ADR/ADL.md`](../Architecture/ADR/ADL.md).

---

## RC-16 implementation milestones (historical plan)

- M1 — Live Market Data Foundation — **complete** (US126–US152)
- M2 — Durable Paper Order and Accounting Core — **complete** (US153–US183)
- M3 — Strategy Trading Sessions — **canonical path complete** (US211–US223);
  historical recovery-hook stories US224–US227 **transferred to RC-17 E17**
- M4 — Risk and Safety Controls — **transferred to RC-17 E19**
- M5 — Recovery and Reconciliation — **transferred to RC-17 E17**
- M6 — Operations Experience — **transferred to RC-17 E19**
- M7 — RC-16 Validation and Closeout — **superseded by RC-17 release validation**

Historical 2026-07-18 final-release audit (M1/M2 only):
[`rc-16-release-summary.md`](./rc-16-release-summary.md) — FAIL preserved for
audit; living baseline is ACCEPTED via scope transfer
([`release-history.md`](./release-history.md)).

M1/M2 detail remains in
[`rc-16-paper-trading-plan.md`](./rc-16-paper-trading-plan.md) and
[`rc-16-m2-mini-validation.md`](./rc-16-m2-mini-validation.md).

---

## RC-17 epics (baselined / forwarded)

| Epic | Name                    | Status                                                              |
| ---- | ----------------------- | ------------------------------------------------------------------- |
| E17  | Runtime Recovery        | **BASELINED** (US240–US249 + US244A); R1–R4 residuals Done in RC-18 |
| E18  | Event Processing        | Forwarded to RC-18+                                                 |
| E19  | Operations              | Forwarded to RC-18+                                                 |
| E20  | Market Data             | Forwarded to RC-18+                                                 |
| E21  | Multi-Strategy Platform | Forwarded to RC-18+                                                 |

Detail: [`rc-17-roadmap.md`](./rc-17-roadmap.md),
[`rc-17-retrospective.md`](./rc-17-retrospective.md).

---

## RC-18 progress

| Workstream                          | Status                                    |
| ----------------------------------- | ----------------------------------------- |
| US290 Force/confirm `RECOVERING`    | **Done**                                  |
| US291 Real reconcile ports          | **Done**                                  |
| US292 Durable RecoveryState + phase | **Done**                                  |
| US293 Durable Incident fail-closed  | **Done**                                  |
| US294 Chaos/restart evidence        | **Done**                                  |
| US295 ADL-008 closure               | **Open**                                  |
| E18–E21 product epics               | Forwarded into V2 RC-20+ where applicable |

Authority: [`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md),
[`rc-18-residual-register.md`](./rc-18-residual-register.md).

---

## RC-19 progress

| Workstream                          | Status                                |
| ----------------------------------- | ------------------------------------- |
| Migration Plan                      | **Closed**                            |
| Epic 1 Exchange Scope Identity      | **Done**                              |
| Epic 2 Bot Facade                   | **Done**                              |
| Epic 3 Tactical Envelope Foundation | **Done**                              |
| Closure Report                      | **CLOSED** — awaiting review approval |

Authority: [`rc-19-closure-report.md`](./rc-19-closure-report.md),
[`rc-19-migration-plan.md`](./rc-19-migration-plan.md).

---

## Future Milestones

**Version 1 (`v1.0.0`) is complete.** RC-19…RC-26 V2 path through Trading
Orchestrator + Market State is **CLOSED** (tag `v1.0.0-rc26`).
**RC-27** Multi-Exchange Scope is **CLOSED** (`v1.0.0-rc27`). Next: **RC-28 Planning**.
Parallel **US295** ADL-008 closeout for production-claim language continues.
Sequencing: [`v2-implementation-roadmap.md`](./v2-implementation-roadmap.md).

Later themes (new ADR required where architecture changes):

- Research OS enhancements
- AI Research Assistant
- Portfolio Research
- Real-capital Trading (requires future ADR; not V1)
- Continuous Learning

---

## Parking Lot

Ideas deliberately deferred:

- Monte Carlo
- Genetic Optimization
- Bayesian Optimization
- Reinforcement Learning
- Multi-Agent AI
- Cloud Distributed Research

---

## Rules

Roadmap does not describe technical implementation. It shows only the direction of project development. Details live in User Stories and ADR.
