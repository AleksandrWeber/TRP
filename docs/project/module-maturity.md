# TRP — Module Maturity Matrix

Last updated: 2026-07-18 (RC-15.1 Validation Release)

Living matrix of implementation maturity for major Research OS modules. Documentation only (US094 / US125).

> RC-15.1: the Simulation Platform modules below (MarketData, HistoricalImport, MarketDataProvider, Backtesting, Portfolio, Trade, Performance, WalkForward, StrategyComparison, SimulationReport) were validated by Validation Sprint V1 (VS001–VS004). They remain **Foundation** maturity — validation confirmed correctness and determinism, not productization. RC-16 hardening candidates are tracked as TD-028…TD-033.

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

| Module             | Status     | Next milestone                                          |
| ------------------ | ---------- | ------------------------------------------------------- |
| Research Engine    | Stable     | RC-14 (observability / provenance extensions as needed) |
| Campaign           | Mature     | RC-14 (optional Campaign UI / analytics)                |
| Pipeline           | Mature     | RC-14+ (PipelineRun persistence / observability)        |
| Replay             | Foundation | RC-14+ (Replay HTTP API if productized)                 |
| Knowledge          | Mature     | RC-15+ (vector search / richer intelligence)            |
| Insight            | Foundation | RC-14 (write / analysis API as productized)             |
| Cross-Campaign     | Foundation | RC-14 (write / reporting as productized)                |
| Recommendation     | Foundation | RC-14 (write / Report Builder as productized)           |
| Research Report    | Foundation | RC-14 (export / write API as productized)               |
| Experiment         | Mature     | RC-14+ (env metadata / accountingVersion / equity)      |
| Persistence        | Foundation | RC-14+ (durable Repository)                             |
| History            | Mature     | RC-14+ (follows Persistence durability)                 |
| Import             | Mature     | RC-14 (additional formats if needed)                    |
| Export             | Mature     | RC-14 (additional formats if needed)                    |
| Jobs               | Foundation | RC-14+ (durable queue); RC-14 (Scheduler)               |
| MarketData         | Foundation | RC-16+ (Prisma / exchange providers)                    |
| HistoricalImport   | Foundation | RC-16+ (additional formats / REST if productized)       |
| MarketDataProvider | Foundation | RC-16+ (Binance / Bybit / Polygon adapters)             |
| Backtesting        | Foundation | RC-16+ (paper trading / richer strategy tooling)        |
| Portfolio          | Foundation | RC-16+ (multi-instrument / positions book)              |
| Trade              | Foundation | RC-16+ (slippage / commission models)                   |
| Performance        | Foundation | RC-16+ (benchmarks / tear sheets)                       |
| WalkForward        | Foundation | RC-16+ (optimization hooks — out of scope today)        |
| StrategyComparison | Foundation | RC-16+ (UI / batch research workflows)                  |
| SimulationReport   | Foundation | RC-16+ (export / persistence)                           |

---

## Modules

### Research Engine

| Field                   | Value                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Stable                                                                                                                                                                                                                                                       |
| **Scope**               | Deterministic backtest, validation (`pass` / `needs_review` / `fail`), Strategy Contract + Registry + Resolver (`ema-crossover`, `donchian-breakout`), dataset import (Binance paginated klines), Dataset Slice / Walk-Forward primitives in `@trp/research` |
| **Current limitations** | No separate `accountingVersion` field; no equity-curve persistence; UI research surfaces still EMA-centric                                                                                                                                                   |
| **Next milestone**      | RC-14 — provenance / observability extensions only as product stories require                                                                                                                                                                                |

### Campaign

| Field                   | Value                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                                                                                                                   |
| **Scope**               | `ResearchCampaignService` orchestrator → Pipeline Engine; multi-config runs; Campaign Report; REST (`POST /research-campaigns`, `POST /campaigns/run`); Walk-Forward / Multi-Dataset campaign services; session persist on COMPLETED/FAILED when enabled |
| **Current limitations** | Orchestration is sequential; no Campaign-level Knowledge summary; UI campaign analysis still limited; legacy `CampaignReport.recommendations` (Accepted Legacy)                                                                                          |
| **Next milestone**      | RC-14 — optional Campaign UI / analysis polish                                                                                                                                                                                                           |

### Pipeline

| Field                   | Value                                                                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature (RC-13 Execution + Analysis)                                                                                                                                                                                                       |
| **Scope**               | `PipelineTemplateService` → `PipelineExecutor` → `PipelineRegistry`; Execution (Campaign / Replay / Knowledge) + Analysis (Insight / Cross-Campaign) steps; immutable metadata-only templates; lifecycle hooks; generic `PipelineContext` |
| **Current limitations** | `PipelineRun` not persisted; no Pipeline HTTP API; `forwardRef` Nest wiring for Knowledge ↔ Pipeline (TD-009)                                                                                                                             |
| **Next milestone**      | RC-14+ — PipelineRun durability / observability (TD-003)                                                                                                                                                                                  |

### Replay

| Field                   | Value                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                                     |
| **Scope**               | `CampaignReplayService` orchestrator → Replay Pipeline Steps; `ReplayResult` / `ReplayStatus`; reuses Campaign with `persistSession: false`; Job type `REPLAY` |
| **Current limitations** | No Replay HTTP API; transient (no History/Repository writes on execute)                                                                                        |
| **Next milestone**      | RC-14+ — optional public Replay API if productized                                                                                                             |

### Knowledge

| Field                   | Value                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                                                        |
| **Scope**               | In-memory `KnowledgeDomainService` (CRUD + search); deterministic extraction via Pipeline Steps; one entry per Experiment (upsert); `GET /knowledge`; coexists with Prisma `research_outcome` |
| **Current limitations** | No vector search; dual Knowledge stacks (domain vs Prisma); Prisma-spec `any` lint debt (TD-008); legacy `insights: string[]` (Accepted Legacy)                                               |
| **Next milestone**      | RC-15+ — vector / similarity search (TD-007)                                                                                                                                                  |

### Insight

| Field                   | Value                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Foundation                                                                                                                                                         |
| **Scope**               | In-memory `InsightDomainService` (CRUD + `extractFromKnowledge`); Insight Pipeline; built-in Insight template; read-only REST `GET /insights` (US095–US096, US100) |
| **Current limitations** | No write REST; no AI reasoning; no Report Builder; no persistence / Repository                                                                                     |
| **Next milestone**      | RC-14 — write / analysis API as productized                                                                                                                        |

### Cross-Campaign Analysis

| Field                   | Value                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                                                          |
| **Scope**               | `CrossCampaignAnalysisService.analyze` + in-memory result store; pipeline; writes Insights via `InsightDomainService`; read-only REST `GET /cross-campaign-analysis` (US097, US100) |
| **Current limitations** | No write REST (analyze not exposed); no AI; no Report Builder                                                                                                                       |
| **Next milestone**      | RC-14 — write / reporting as productized                                                                                                                                            |

### Recommendation

| Field                   | Value                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                         |
| **Scope**               | In-memory `RecommendationDomainService` (CRUD + `generateFromInsights`); deterministic rules; read-only REST `GET /recommendations` (US098, US100) |
| **Current limitations** | No write REST; no LLM / AI; no Report Builder; no Pipeline coupling; no persistence                                                                |
| **Next milestone**      | RC-14 — write / Report Builder as productized                                                                                                      |

### Research Report

| Field                   | Value                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Foundation                                                                                                                                             |
| **Scope**               | In-memory `ResearchReportDomainService` (`create` / `getById` / `search` / `build`); structured sections; read-only REST `GET /reports` (US099, US100) |
| **Current limitations** | No PDF / HTML / Markdown export; no write REST (`build` not exposed); no AI narrative                                                                  |
| **Next milestone**      | RC-14 — export / write API as productized                                                                                                              |

### Experiment

| Field                   | Value                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Mature                                                                                                                                                                   |
| **Scope**               | Prisma `ExperimentsService` (backtest runner + `POST /experiments`); in-memory `ExperimentDomainService` (session → versioned Experiment); `ExperimentComparisonService` |
| **Current limitations** | Domain Experiment not durable; missing env metadata / accountingVersion / equity curve; dual Experiment stacks                                                           |
| **Next milestone**      | RC-14+ — provenance field extensions                                                                                                                                     |

### Persistence

| Field                   | Value                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                               |
| **Scope**               | `CampaignPersistenceService` + `InMemoryCampaignRepository`; `CampaignSession` ↔ `CampaignRecord` mapping; used by Campaign persist step |
| **Current limitations** | In-memory only (TD-001); process restart loses sessions                                                                                  |
| **Next milestone**      | RC-14+ — durable Repository                                                                                                              |

### History

| Field                   | Value                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                                                                               |
| **Scope**               | `CampaignHistoryService` (get / search / filter / sort / paginate); REST `GET /campaign-history`, `GET /campaign-history/:sessionId`; returns `CampaignSession` only |
| **Current limitations** | Backed by in-memory Persistence; no cross-process history                                                                                                            |
| **Next milestone**      | RC-14+ — follows Persistence durability                                                                                                                              |

### Import

| Field                   | Value                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**              | Mature                                                                                                                                                 |
| **Scope**               | `CampaignImportService` + `JsonCampaignImporter`; `CampaignSessionValidator`; `POST /campaign-import` → validated `CampaignSession` (does not persist) |
| **Current limitations** | JSON format only; import does not auto-persist                                                                                                         |
| **Next milestone**      | RC-14 — additional formats if required                                                                                                                 |

### Export

| Field                   | Value                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Status**              | Mature                                                                                                      |
| **Scope**               | `CampaignExportService` + JSON/CSV exporters; `GET /campaign-history/:sessionId/export`; Session-only input |
| **Current limitations** | JSON/CSV only; tied to History availability                                                                 |
| **Next milestone**      | RC-14 — additional formats if required                                                                      |

### Jobs

| Field                   | Value                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                                                    |
| **Scope**               | `Job` / `JobQueue` / `InMemoryJobQueue`; `JobService` create/list/get/cancel; `BackgroundJobRunner` for CAMPAIGN/REPLAY; REST status + cancel |
| **Current limitations** | In-memory queue (TD-002); no Scheduler (TD-004); no job persistence                                                                           |
| **Next milestone**      | RC-14 durable queue / Scheduler                                                                                                               |

### MarketData (RC-15)

| Field                   | Value                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Status**              | Foundation                                                                                       |
| **Scope**               | `MarketBar` / Instrument / Timeframe; `MarketDataDomainService`; InMemory repo; workspace-scoped |
| **Current limitations** | No Prisma; no REST                                                                               |
| **Next milestone**      | RC-16+ — durable store / provider-backed ingest                                                  |

### HistoricalImport (RC-15)

| Field                   | Value                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                    |
| **Scope**               | `HistoricalDataImporter` + `CsvImporter`; validation; persists via MarketData |
| **Current limitations** | CSV only; no REST                                                             |
| **Next milestone**      | RC-16+ — more formats / import API if productized                             |

### MarketDataProvider (RC-15)

| Field                   | Value                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Status**              | Foundation                                                                                             |
| **Scope**               | `MarketDataProvider` / `ProviderRegistry`; `LocalRepositoryProvider`; source enum for future exchanges |
| **Current limitations** | Local only; no external API calls                                                                      |
| **Next milestone**      | RC-16+ — Binance / Bybit / Polygon / Yahoo / Alpaca adapters                                           |

### Backtesting (RC-15)

| Field                   | Value                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                          |
| **Scope**               | `BacktestEngine` + `Strategy` / `StrategyContext`; owns Portfolio + Trade per session; attaches `PerformanceReport` |
| **Current limitations** | No paper/live trading; no REST; optional `snapshotSink` only (no SimulationReport coupling)                         |
| **Next milestone**      | RC-16+ — strategy tooling / paper trading                                                                           |

### Portfolio / Trade / Performance (RC-15)

| Field                   | Value                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                              |
| **Scope**               | PortfolioEngine state; TradeEngine virtual fills; PerformanceAnalyzer immutable metrics |
| **Current limitations** | Single-instrument trades; no slippage/commission/leverage                               |
| **Next milestone**      | RC-16+ — richer execution & analytics                                                   |

### WalkForward / StrategyComparison / SimulationReport (RC-15)

| Field                   | Value                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Status**              | Foundation                                                                                                     |
| **Scope**               | WalkForwardEngine (sequential BacktestEngine); comparison rankings + weighted winner; immutable report builder |
| **Current limitations** | No optimization; no UI/REST                                                                                    |
| **Next milestone**      | RC-16+ — research workflows / export                                                                           |

---

## Maintenance

Update this matrix after each RC audit or when a module’s public contract / maturity status changes.
