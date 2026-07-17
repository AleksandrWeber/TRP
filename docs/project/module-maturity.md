# TRP — Module Maturity Matrix

Last updated: 2026-07-17

Living matrix of implementation maturity for major Research OS modules. Documentation only (US094).

Related:

- Project Status: [`project-status.md`](./project-status.md)
- Architecture Snapshot: [`architecture-snapshot.md`](./architecture-snapshot.md)
- Technical Debt: [`technical-debt.md`](./technical-debt.md)
- Roadmap: [`roadmap.md`](./roadmap.md)

---

## Status legend

| Status          | Meaning                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| **Stable**      | Production-shaped for current Research OS phase; contracts frozen unless story-scoped |
| **Mature**      | Feature-complete for current RC scope; known limitations accepted                     |
| **Foundation**  | Core behavior ready; intentional gaps (no HTTP, no persist, etc.)                     |
| **In progress** | Actively evolving within the current phase                                            |

---

## Summary table

| Module          | Status     | Next milestone                                          |
| --------------- | ---------- | ------------------------------------------------------- |
| Research Engine | Stable     | RC-13 (observability / provenance extensions as needed) |
| Campaign        | Mature     | RC-13 (optional Campaign UI / analytics)                |
| Pipeline        | Mature     | RC-13+ (PipelineRun persistence / observability)        |
| Replay          | Foundation | RC-13+ (Replay HTTP API if productized)                 |
| Knowledge       | Mature     | RC-15+ (vector search / richer intelligence)            |
| Experiment      | Mature     | RC-13+ (env metadata / accountingVersion / equity)      |
| Persistence     | Foundation | RC-13+ (durable Repository)                             |
| History         | Mature     | RC-13+ (follows Persistence durability)                 |
| Import          | Mature     | RC-13 (additional formats if needed)                    |
| Export          | Mature     | RC-13 (additional formats if needed)                    |
| Jobs            | Foundation | RC-13+ (durable queue); RC-14 (Scheduler)               |

---

## Modules

### Research Engine

| Field                   | Value                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Stable                                                                                                                                                                                                                                                       |
| **Scope**               | Deterministic backtest, validation (`pass` / `needs_review` / `fail`), Strategy Contract + Registry + Resolver (`ema-crossover`, `donchian-breakout`), dataset import (Binance paginated klines), Dataset Slice / Walk-Forward primitives in `@trp/research` |
| **Current limitations** | No separate `accountingVersion` field; no equity-curve persistence; UI research surfaces still EMA-centric                                                                                                                                                   |
| **Next milestone**      | RC-13 — provenance / observability extensions only as product stories require                                                                                                                                                                                |

### Campaign

| Field                   | Value                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                                                                                                                   |
| **Scope**               | `ResearchCampaignService` orchestrator → Pipeline Engine; multi-config runs; Campaign Report; REST (`POST /research-campaigns`, `POST /campaigns/run`); Walk-Forward / Multi-Dataset campaign services; session persist on COMPLETED/FAILED when enabled |
| **Current limitations** | Orchestration is sequential; no Campaign-level Knowledge summary; UI campaign analysis still limited                                                                                                                                                     |
| **Next milestone**      | RC-13 — optional Campaign UI / analysis polish                                                                                                                                                                                                           |

### Pipeline

| Field                   | Value                                                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature (RC-12 unified runtime)                                                                                                                                                                                                   |
| **Scope**               | `PipelineTemplateService` → `PipelineExecutor` → `PipelineRegistry`; Campaign / Replay / Knowledge steps; immutable metadata-only templates; lifecycle hooks (`PipelineHook` / `LoggingPipelineHook`); generic `PipelineContext` |
| **Current limitations** | `PipelineRun` not persisted; no Pipeline HTTP API; `forwardRef` Nest wiring for Knowledge ↔ Pipeline (TD-009)                                                                                                                    |
| **Next milestone**      | RC-13+ — PipelineRun durability / observability (TD-003)                                                                                                                                                                         |

### Replay

| Field                   | Value                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                                     |
| **Scope**               | `CampaignReplayService` orchestrator → Replay Pipeline Steps; `ReplayResult` / `ReplayStatus`; reuses Campaign with `persistSession: false`; Job type `REPLAY` |
| **Current limitations** | No Replay HTTP API; transient (no History/Repository writes on execute)                                                                                        |
| **Next milestone**      | RC-13+ — optional public Replay API if productized                                                                                                             |

### Knowledge

| Field                   | Value                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                                                        |
| **Scope**               | In-memory `KnowledgeDomainService` (CRUD + search); deterministic extraction via Pipeline Steps; one entry per Experiment (upsert); `GET /knowledge`; coexists with Prisma `research_outcome` |
| **Current limitations** | No vector search; dual Knowledge stacks (domain vs Prisma); Prisma-spec `any` lint debt (TD-008)                                                                                              |
| **Next milestone**      | RC-15+ — vector / similarity search (TD-007)                                                                                                                                                  |

### Experiment

| Field                   | Value                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Mature                                                                                                                                                                   |
| **Scope**               | Prisma `ExperimentsService` (backtest runner + `POST /experiments`); in-memory `ExperimentDomainService` (session → versioned Experiment); `ExperimentComparisonService` |
| **Current limitations** | Domain Experiment not durable; missing env metadata / accountingVersion / equity curve; dual Experiment stacks                                                           |
| **Next milestone**      | RC-13+ — provenance field extensions                                                                                                                                     |

### Persistence

| Field                   | Value                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                               |
| **Scope**               | `CampaignPersistenceService` + `InMemoryCampaignRepository`; `CampaignSession` ↔ `CampaignRecord` mapping; used by Campaign persist step |
| **Current limitations** | In-memory only (TD-001); process restart loses sessions                                                                                  |
| **Next milestone**      | RC-13+ — durable Repository                                                                                                              |

### History

| Field                   | Value                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                               |
| **Scope**               | `CampaignHistoryService` (get / search / filter / sort / paginate); REST `GET /campaign-history`, `GET /campaign-history/:sessionId`; returns `CampaignSession` only |
| **Current limitations** | Backed by in-memory Persistence; no cross-process history                                                                                                            |
| **Next milestone**      | RC-13+ — follows Persistence durability                                                                                                                              |

### Import

| Field                   | Value                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Mature                                                                                                                                                 |
| **Scope**               | `CampaignImportService` + `JsonCampaignImporter`; `CampaignSessionValidator`; `POST /campaign-import` → validated `CampaignSession` (does not persist) |
| **Current limitations** | JSON format only; import does not auto-persist                                                                                                         |
| **Next milestone**      | RC-13 — additional formats if required                                                                                                                 |

### Export

| Field                   | Value                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                      |
| **Scope**               | `CampaignExportService` + JSON/CSV exporters; `GET /campaign-history/:sessionId/export`; Session-only input |
| **Current limitations** | JSON/CSV only; tied to History availability                                                                 |
| **Next milestone**      | RC-13 — additional formats if required                                                                      |

### Jobs

| Field                   | Value                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                    |
| **Scope**               | `Job` / `JobQueue` / `InMemoryJobQueue`; `JobService` create/list/get/cancel; `BackgroundJobRunner` for CAMPAIGN/REPLAY; REST status + cancel |
| **Current limitations** | In-memory queue (TD-002); no Scheduler (TD-004); no job persistence                                                                           |
| **Next milestone**      | RC-13+ durable queue; RC-14 Scheduler                                                                                                         |

---

## Maintenance

Update this matrix after each RC audit or when a module’s public contract / maturity status changes.
