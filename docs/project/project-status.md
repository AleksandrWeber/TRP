# TRP Research OS — Project Status

Last updated:
2026-07-16

---

# Current Phase

Research OS Foundation

---

# Current Goal

Побудувати Evidence-driven Research OS: reproducible experiments, immutable Knowledge, і чітке provenance/versioning результатів.

Зараз у working tree / local commits готові Research Layer extensions, Multi-Strategy, Knowledge Layer, Campaign Runner/Report і Campaign API. Remote release ще не запушено.

Next: US020 — Campaign UI.

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

---

# Release Readiness

Status: NOT READY for remote release / push

## Release Candidate

Status: Ready for Commit

Scope: Research OS (US003–US019, US020A–US020B) + documentation (DOC-021–DOC-024, US025–US026, US025A–US025C). Product next remains US020 — Campaign UI.

Current Research OS implementation exists in working tree.
Release will be created only after explicit commit sequence.
Push only after explicit user command.

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

Next: US020 — Campaign UI.

---

## Knowledge Layer

Status:
✅ Frozen (working tree; not yet released as dedicated commits)

Completed:

- `research_outcome` для PASS / FAIL / NEEDS_REVIEW.
- Payload: hypothesis, evidence, conclusion + strategy/params/dataset/metrics/validation/configHash.
- Result Identity dedup: `configIdentityKey` + `researchEngineVersion` + `validationVersion`.
- Immutable lineage: `supersedesKnowledgeId` + reverse lookup через `getLineage()`.
- Structural legacy detection (без hardcode package versions).
- Single source of truth: `knowledge.version.ts`.
- Integration/unit tests для create / duplicate / lineage / version consistency.

Next: US020 — Campaign UI.

---

## Experiment Provenance

Status:
🟡 Active (working tree; not yet released as dedicated commits)

Completed:

- Provenance audit (US015): що є / чого бракує для reproducibility.
- `Experiment.report` зберігає `researchEngineVersion` і `validationVersion` (ті самі константи, що Knowledge).
- `gitCommit` лишається окремим provenance-полем (не version).

Next: US020 — Campaign UI.

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

Next: US020 — Campaign UI.

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

---

# Current Version

Research Engine:
1.0.3

Validation:
1.0.2

Knowledge Schema:
2

Note: ці версії стосуються working-tree Research OS semantics; окремий git release ще не створено.

---

# Open Technical Debt

- Legacy Knowledge entries (pre-versioning) без `resultIdentityKey` / version fields — живуть через structural legacy detection.
- Donchian(10) Knowledge може відображати pre-accounting PASS (dedup за configHash першого run).
- EMA campaign (9 configs на 4344 bars) не всі збережені як окремі Experiments у БД (частина runs була поза API).
- Experiment не зберігає окремо `accountingVersion`, runtime/env metadata, equity curve.
- UI Research Page ще EMA-centric у copy; фільтр по strategyId відсутній.
- Research OS RC commit існує локально; remote push ще не виконано.

---

# Future Backlog

High Priority

- US020 — Campaign UI.
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
