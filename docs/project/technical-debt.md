# TRP — Technical Debt Register

Last updated: 2026-07-18 (RC-15.1 Validation Release)

Living register of known technical debt. Reviewed at RC-15.1 closeout after Validation Sprint V1 (VS001–VS004); TD-028…TD-033 added from Validation Sprint findings.

Related:

- Project Status: [`project-status.md`](./project-status.md)
- Architecture Snapshot: [`architecture-snapshot.md`](./architecture-snapshot.md)
- Roadmap: [`roadmap.md`](./roadmap.md)

---

## Status legend

| Status              | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| **Accepted**        | Known and intentionally carried for the current Research OS phase |
| **Accepted Legacy** | Pre-existing dual path; do not expand; migrate in a later RC      |
| **Deferred**        | Acknowledged; not scheduled for the current RC                    |
| **Planned**         | Intended for a future milestone / possible RC                     |
| **Future**          | Product-level enhancement; no committed milestone                 |

---

## Current debt

| ID     | Item                                      | Status          | Notes                                                                                                                                                                                                                                                                                      | Future milestone                            |
| ------ | ----------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| TD-001 | InMemory Repository                       | Accepted        | Campaign / Knowledge / Experiment domain stores use in-memory Maps; no durable Repository abstraction yet                                                                                                                                                                                  | Possible RC-13+ (Persistence hardening)     |
| TD-002 | InMemory Job Queue                        | Accepted        | `InMemoryJobQueue` via `JOB_QUEUE`; FIFO; no durable job store                                                                                                                                                                                                                             | Possible RC-13+ (Jobs durability)           |
| TD-003 | PipelineRun not persisted                 | Accepted        | `PipelineRun` is in-memory only (`PipelineDomainService`); lost on process restart                                                                                                                                                                                                         | Possible RC-13+ (Pipeline observability)    |
| TD-004 | No Scheduler                              | Deferred        | Jobs are processed by `BackgroundJobRunner` when invoked; no cron / background scheduler                                                                                                                                                                                                   | Possible RC-14 (Background scheduling)      |
| TD-005 | No Authentication                         | Deferred        | REST APIs are unauthenticated in the Research OS foundation                                                                                                                                                                                                                                | Possible RC-14+ (Security)                  |
| TD-006 | No Authorization                          | Deferred        | No role / permission model on Campaign / Jobs / Knowledge APIs                                                                                                                                                                                                                             | Possible RC-14+ (Security)                  |
| TD-007 | No Vector Search                          | Deferred        | Knowledge search is deterministic in-memory text / tag / experimentId filters only                                                                                                                                                                                                         | Possible RC-15+ (Knowledge intelligence)    |
| TD-008 | Prisma `any` in legacy tests              | Accepted        | RC-15.1: repository lint restored to green. `@typescript-eslint/no-explicit-any` is now scoped **off for test files only** (`**/*.spec.ts`, `**/*.test.ts`, `**/validation/**`); production code remains strict. Underlying loose Prisma mock typing persists — tighten opportunistically. | Planned (test-typing hygiene; non-blocking) |
| TD-009 | `forwardRef` for Pipeline module wiring   | Accepted        | `KnowledgeModule` uses `forwardRef(() => PipelineModule)` to break Nest cycle `Knowledge → Pipeline → Experiments → Knowledge`                                                                                                                                                             | Planned (optional module-boundary cleanup)  |
| TD-010 | Extract `InsightGenerationService`        | Planned         | Deterministic Insight draft generation currently lives in pipeline step rule helpers (`insight-extraction.rules`, cross-analysis persist mapping); extract a dedicated `InsightGenerationService` for reuse across Insight / Cross-Campaign pipelines                                      | Possible RC-14+                             |
| TD-011 | Legacy `CampaignReport.recommendations`   | Accepted Legacy | Pre-RC-13 string[] guidance on Campaign Report; overlaps Recommendation domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                            | RC-14+                                      |
| TD-012 | Legacy `KnowledgeEntry.insights` string[] | Accepted Legacy | Free-text bullets (often copied from campaign recommendations); name collides with Insight domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                         | RC-14+                                      |
| TD-013 | Legacy `ResearchAnalysis` parallel stack  | Accepted Legacy | Deterministic `ResearchAnalysis` / `POST /campaigns/analyze` duplicates Insight / Recommendation / ResearchReport concerns. **Do not expand.** Migration planned in RC-14+.                                                                                                                | RC-14+                                      |
| TD-028 | Execution Model                           | Deferred        | Backtest execution is single-pass with next-bar fills, flat fee/slippage; no intrabar fills, partial fills, or order-type modeling. Deterministic and adequate for research; revisit for realistic fill simulation. (VS002/VS004)                                                          | RC-16+ (Execution realism)                  |
| TD-029 | Advanced Performance Metrics              | Planned         | `PerformanceReport` covers net profit, total return, CAGR, drawdown, volatility, win rate, profit factor; risk-adjusted metrics (Sharpe, Sortino, Calmar) not yet computed. (VS001/VS004)                                                                                                  | RC-16+ (Performance analytics)              |
| TD-030 | Scoring Strategy                          | Deferred        | Strategy Comparison uses a fixed weighted-score model with hardcoded weights; deterministic but not configurable/pluggable. (VS001/VS003)                                                                                                                                                  | RC-16+ (Comparison configurability)         |
| TD-031 | Report Exporters                          | Future          | `SimulationReport` is an immutable in-memory / JSON artifact; no PDF / CSV / HTML exporters. (VS004)                                                                                                                                                                                       | Future (Reporting)                          |
| TD-032 | Operational Metadata Isolation            | Planned         | Operational metadata (`startedAt` / `finishedAt` / `durationMs` / UUID / `traceId`) is interleaved with semantic results; VS001–VS003 required per-assertion filtering (`stableComparison`) to prove determinism. Formalize a semantic/operational split.                                  | RC-16 (Determinism ergonomics)              |
| TD-033 | Large Dataset Scalability                 | Deferred        | Million-bar workloads retain full per-bar snapshot arrays in memory (~2.7 GB at 1m×10 in VS002) and required an iterative peak/trough fix (spread over large arrays overflowed the call stack). Consider streaming / aggregated snapshots. (VS002)                                         | RC-16+ (Scalability)                        |

---

## By status

### Accepted

- TD-001 — InMemory Repository
- TD-002 — InMemory Job Queue
- TD-003 — PipelineRun not persisted
- TD-008 — Prisma `any` in legacy tests
- TD-009 — `forwardRef` for Pipeline module wiring

### Accepted Legacy

- TD-011 — `CampaignReport.recommendations` (do not expand; migrate RC-14+)
- TD-012 — `KnowledgeEntry.insights` string[] (do not expand; migrate RC-14+)
- TD-013 — `ResearchAnalysis` parallel stack (do not expand; migrate RC-14+)

### Deferred

- TD-004 — No Scheduler
- TD-005 — No Authentication
- TD-006 — No Authorization
- TD-007 — No Vector Search
- TD-028 — Execution Model (realistic fills / order types)
- TD-030 — Scoring Strategy (configurable comparison weights)
- TD-033 — Large Dataset Scalability (streaming / aggregated snapshots)

### Planned

- TD-008 — Prisma `any` in legacy tests (tighten test mock typing; lint now green via scoped config)
- TD-009 — `forwardRef` module wiring (optional Nest layering cleanup)
- TD-010 — Extract `InsightGenerationService` (shared deterministic Insight drafting)
- TD-029 — Advanced Performance Metrics (Sharpe / Sortino / Calmar)
- TD-032 — Operational Metadata Isolation (semantic vs operational split)

### Future

- TD-031 — Report Exporters (PDF / CSV / HTML)

---

## Future milestones (possible RCs)

| Possible RC   | Theme                                   | Candidate debt                                 |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| RC-13+        | Persistence / durability                | TD-001, TD-002, TD-003                         |
| RC-14+        | Scheduling, security & legacy migration | TD-004, TD-005, TD-006, TD-011, TD-012, TD-013 |
| RC-15+        | Knowledge intelligence                  | TD-007                                         |
| RC-16         | Simulation determinism & analytics      | TD-032                                         |
| RC-16+        | Simulation realism & scale              | TD-028, TD-029, TD-030, TD-033                 |
| Future        | Reporting                               | TD-031                                         |
| Opportunistic | Hygiene                                 | TD-008, TD-009, TD-010                         |

Exact RC numbering is directional only — product roadmap remains authoritative.

---

## Related historical notes

Items historically listed under Project Status “Open Technical Debt” that are **research/data** concerns (not runtime infrastructure) remain tracked there or in Architecture Snapshot until promoted:

- Legacy Knowledge entries without version fields
- Donchian(10) pre-accounting PASS via earliest configHash
- EMA grid experiments not all persisted via API
- Missing `accountingVersion` / env metadata / equity curve on Experiment
- Research UI EMA-centric; no strategy filter

---

## Maintenance

Update this file when debt is added, resolved, or reclassified after a User Story or RC audit.
