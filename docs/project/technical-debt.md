# TRP — Technical Debt Register

Last updated: 2026-07-17

Living register of known technical debt. Documentation only — no implementation changes in this story (US093).

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

---

## Current debt

| ID     | Item                                      | Status          | Notes                                                                                                                                                                                                                                                 | Future milestone                           |
| ------ | ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| TD-001 | InMemory Repository                       | Accepted        | Campaign / Knowledge / Experiment domain stores use in-memory Maps; no durable Repository abstraction yet                                                                                                                                             | Possible RC-13+ (Persistence hardening)    |
| TD-002 | InMemory Job Queue                        | Accepted        | `InMemoryJobQueue` via `JOB_QUEUE`; FIFO; no durable job store                                                                                                                                                                                        | Possible RC-13+ (Jobs durability)          |
| TD-003 | PipelineRun not persisted                 | Accepted        | `PipelineRun` is in-memory only (`PipelineDomainService`); lost on process restart                                                                                                                                                                    | Possible RC-13+ (Pipeline observability)   |
| TD-004 | No Scheduler                              | Deferred        | Jobs are processed by `BackgroundJobRunner` when invoked; no cron / background scheduler                                                                                                                                                              | Possible RC-14 (Background scheduling)     |
| TD-005 | No Authentication                         | Deferred        | REST APIs are unauthenticated in the Research OS foundation                                                                                                                                                                                           | Possible RC-14+ (Security)                 |
| TD-006 | No Authorization                          | Deferred        | No role / permission model on Campaign / Jobs / Knowledge APIs                                                                                                                                                                                        | Possible RC-14+ (Security)                 |
| TD-007 | No Vector Search                          | Deferred        | Knowledge search is deterministic in-memory text / tag / experimentId filters only                                                                                                                                                                    | Possible RC-15+ (Knowledge intelligence)   |
| TD-008 | Prisma `any` in legacy tests              | Accepted        | Pre-existing `@typescript-eslint/no-explicit-any` in experiments / knowledge Prisma integration specs; pipeline orchestration lint scope is clean                                                                                                     | Planned (lint hygiene; non-blocking)       |
| TD-009 | `forwardRef` for Pipeline module wiring   | Accepted        | `KnowledgeModule` uses `forwardRef(() => PipelineModule)` to break Nest cycle `Knowledge → Pipeline → Experiments → Knowledge`                                                                                                                        | Planned (optional module-boundary cleanup) |
| TD-010 | Extract `InsightGenerationService`        | Planned         | Deterministic Insight draft generation currently lives in pipeline step rule helpers (`insight-extraction.rules`, cross-analysis persist mapping); extract a dedicated `InsightGenerationService` for reuse across Insight / Cross-Campaign pipelines | Possible RC-14+                            |
| TD-011 | Legacy `CampaignReport.recommendations`   | Accepted Legacy | Pre-RC-13 string[] guidance on Campaign Report; overlaps Recommendation domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                       | RC-14+                                     |
| TD-012 | Legacy `KnowledgeEntry.insights` string[] | Accepted Legacy | Free-text bullets (often copied from campaign recommendations); name collides with Insight domain. **Do not expand.** Migration planned in RC-14+.                                                                                                    | RC-14+                                     |
| TD-013 | Legacy `ResearchAnalysis` parallel stack  | Accepted Legacy | Deterministic `ResearchAnalysis` / `POST /campaigns/analyze` duplicates Insight / Recommendation / ResearchReport concerns. **Do not expand.** Migration planned in RC-14+.                                                                           | RC-14+                                     |

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

### Planned

- TD-008 — Prisma `any` in legacy tests (cleanup when touching those specs)
- TD-009 — `forwardRef` module wiring (optional Nest layering cleanup)
- TD-010 — Extract `InsightGenerationService` (shared deterministic Insight drafting)

---

## Future milestones (possible RCs)

| Possible RC   | Theme                                   | Candidate debt                                 |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| RC-13+        | Persistence / durability                | TD-001, TD-002, TD-003                         |
| RC-14+        | Scheduling, security & legacy migration | TD-004, TD-005, TD-006, TD-011, TD-012, TD-013 |
| RC-15+        | Knowledge intelligence                  | TD-007                                         |
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
