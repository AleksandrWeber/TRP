# TRP — Technical Debt Register

Last updated: 2026-07-17

Living register of known technical debt. Documentation only — no implementation changes in this story (US093).

Related:

- Project Status: [`project-status.md`](./project-status.md)
- Architecture Snapshot: [`architecture-snapshot.md`](./architecture-snapshot.md)
- Roadmap: [`roadmap.md`](./roadmap.md)

---

## Status legend

| Status       | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Accepted** | Known and intentionally carried for the current Research OS phase |
| **Deferred** | Acknowledged; not scheduled for the current RC                    |
| **Planned**  | Intended for a future milestone / possible RC                     |

---

## Current debt

| ID     | Item                                    | Status   | Notes                                                                                                                                             | Future milestone                           |
| ------ | --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| TD-001 | InMemory Repository                     | Accepted | Campaign / Knowledge / Experiment domain stores use in-memory Maps; no durable Repository abstraction yet                                         | Possible RC-13+ (Persistence hardening)    |
| TD-002 | InMemory Job Queue                      | Accepted | `InMemoryJobQueue` via `JOB_QUEUE`; FIFO; no durable job store                                                                                    | Possible RC-13+ (Jobs durability)          |
| TD-003 | PipelineRun not persisted               | Accepted | `PipelineRun` is in-memory only (`PipelineDomainService`); lost on process restart                                                                | Possible RC-13+ (Pipeline observability)   |
| TD-004 | No Scheduler                            | Deferred | Jobs are processed by `BackgroundJobRunner` when invoked; no cron / background scheduler                                                          | Possible RC-14 (Background scheduling)     |
| TD-005 | No Authentication                       | Deferred | REST APIs are unauthenticated in the Research OS foundation                                                                                       | Possible RC-14+ (Security)                 |
| TD-006 | No Authorization                        | Deferred | No role / permission model on Campaign / Jobs / Knowledge APIs                                                                                    | Possible RC-14+ (Security)                 |
| TD-007 | No Vector Search                        | Deferred | Knowledge search is deterministic in-memory text / tag / experimentId filters only                                                                | Possible RC-15+ (Knowledge intelligence)   |
| TD-008 | Prisma `any` in legacy tests            | Accepted | Pre-existing `@typescript-eslint/no-explicit-any` in experiments / knowledge Prisma integration specs; pipeline orchestration lint scope is clean | Planned (lint hygiene; non-blocking)       |
| TD-009 | `forwardRef` for Pipeline module wiring | Accepted | `KnowledgeModule` uses `forwardRef(() => PipelineModule)` to break Nest cycle `Knowledge → Pipeline → Experiments → Knowledge`                    | Planned (optional module-boundary cleanup) |

---

## By status

### Accepted

- TD-001 — InMemory Repository
- TD-002 — InMemory Job Queue
- TD-003 — PipelineRun not persisted
- TD-008 — Prisma `any` in legacy tests
- TD-009 — `forwardRef` for Pipeline module wiring

### Deferred

- TD-004 — No Scheduler
- TD-005 — No Authentication
- TD-006 — No Authorization
- TD-007 — No Vector Search

### Planned

- TD-008 — Prisma `any` in legacy tests (cleanup when touching those specs)
- TD-009 — `forwardRef` module wiring (optional Nest layering cleanup)

---

## Future milestones (possible RCs)

| Possible RC   | Theme                    | Candidate debt         |
| ------------- | ------------------------ | ---------------------- |
| RC-13+        | Persistence / durability | TD-001, TD-002, TD-003 |
| RC-14+        | Scheduling & security    | TD-004, TD-005, TD-006 |
| RC-15+        | Knowledge intelligence   | TD-007                 |
| Opportunistic | Hygiene                  | TD-008, TD-009         |

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
