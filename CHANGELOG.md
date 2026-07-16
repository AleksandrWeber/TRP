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
- Project documentation workflow: living Project Status, ADR Index, Version History, Release Process, Roadmap.
- Root `CHANGELOG.md` (this file).
- Release Candidate docs: Ready for Commit for Research OS (US003–US019, US020A–US020B) + documentation (DOC-021–DOC-024, US025–US026, US025A–US025C), pending explicit commit sequence.
- Architecture Snapshot: `docs/project/architecture-snapshot.md` (current-state only).
- Campaign Domain Model: `docs/project/campaign-domain-model.md` (implemented Campaign Layer only).
- Research Domain Model: `docs/project/research-domain-model.md` (implemented Research Layer only).
- Knowledge Domain Model: `docs/project/knowledge-domain-model.md` (implemented Knowledge Layer only).
- ADR-007 — Campaign Layer: `docs/adr/ADR-007-campaign-layer.md` (Accepted).

### Fixed

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
