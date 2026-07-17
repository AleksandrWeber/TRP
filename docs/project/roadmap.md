# TRP Research OS — Roadmap

Last updated: 2026-07-16

Living roadmap for product direction.

Related:

- Project Status: [`project-status.md`](./project-status.md)
- ADR Index: [`../adr/README.md`](../adr/README.md)
- Release Process: [`release-process.md`](./release-process.md)
- Changelog: [`../../CHANGELOG.md`](../../CHANGELOG.md)

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

---

## Current Phase

**Research OS Foundation**

---

## Next User Stories

- RC-08

---

## Future Milestones

- Research OS
- AI Research Assistant
- Portfolio Research
- Production Trading
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
