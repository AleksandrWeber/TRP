# TRP — Technical Debt Register

Last updated: 2026-07-18 (RC-16 final release review)

Living register of known technical debt. Reviewed at RC-15.1 closeout after Validation Sprint V1 (VS001–VS004); TD-028…TD-033 added from Validation Sprint findings. TD-035 and TD-038 resolved by M2 US155 PostgreSQL runtime wiring.

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
| **In progress**     | Partially delivered across the current RC milestones              |
| **Partial**         | Risk reduced, but the item is not fully resolved                  |
| **Mitigated**       | Current scope is protected; later scope still requires validation |
| **Resolved**        | Completed and retained for historical traceability                |

---

## Current debt

| ID     | Item                                      | Status          | Notes                                                                                                                                                                                                                                                                                                                               | Future milestone                            |
| ------ | ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| TD-001 | InMemory Repository                       | Accepted        | Campaign / Knowledge / Experiment domain stores use in-memory Maps; no durable Repository abstraction yet                                                                                                                                                                                                                           | Possible RC-13+ (Persistence hardening)     |
| TD-002 | InMemory-authoritative Job Queue          | Planned         | BullMQ mirrors enqueue/retry state, but authoritative Job lookup/dequeue remains in-process. RC-16 event durability uses PostgreSQL Outbox/Inbox; scheduler/worker durability must not rely on the current mirror.                                                                                                                  | RC-16 runtime implementation                |
| TD-003 | PipelineRun not persisted                 | Accepted        | `PipelineRun` is in-memory only (`PipelineDomainService`); lost on process restart                                                                                                                                                                                                                                                  | Possible RC-13+ (Pipeline observability)    |
| TD-004 | No Scheduler                              | Deferred        | Jobs are processed by `BackgroundJobRunner` when invoked; no cron / background scheduler                                                                                                                                                                                                                                            | Possible RC-14 (Background scheduling)      |
| TD-005 | Authentication hardening                  | Partial (M2)    | US158 rejects insecure production JWT fallbacks and short secrets at Auth module construction. Login remains passwordless/in-memory Identity for development; durable credential store remains later.                                                                                                                               | RC-16 safety foundation                     |
| TD-006 | Production authorization/workspace scope  | Partial (M2)    | US158 adds Trader role, CommandAuthorizationService (Trader/Admin), and WorkspaceAccessService membership checks for trading commands. Stage-1 `production/` endpoints are not yet migrated onto this gate.                                                                                                                         | RC-16 safety foundation                     |
| TD-007 | No Vector Search                          | Deferred        | Knowledge search is deterministic in-memory text / tag / experimentId filters only                                                                                                                                                                                                                                                  | Possible RC-15+ (Knowledge intelligence)    |
| TD-008 | Prisma `any` in legacy tests              | Accepted        | RC-15.1: repository lint restored to green. `@typescript-eslint/no-explicit-any` is now scoped **off for test files only** (`**/*.spec.ts`, `**/*.test.ts`, `**/validation/**`); production code remains strict. Underlying loose Prisma mock typing persists — tighten opportunistically.                                          | Planned (test-typing hygiene; non-blocking) |
| TD-009 | `forwardRef` for Pipeline module wiring   | Accepted        | `KnowledgeModule` uses `forwardRef(() => PipelineModule)` to break Nest cycle `Knowledge → Pipeline → Experiments → Knowledge`                                                                                                                                                                                                      | Planned (optional module-boundary cleanup)  |
| TD-010 | Extract `InsightGenerationService`        | Planned         | Deterministic Insight draft generation currently lives in pipeline step rule helpers (`insight-extraction.rules`, cross-analysis persist mapping); extract a dedicated `InsightGenerationService` for reuse across Insight / Cross-Campaign pipelines                                                                               | Possible RC-14+                             |
| TD-011 | Legacy `CampaignReport.recommendations`   | Accepted Legacy | Pre-RC-13 string[] guidance on Campaign Report; overlaps Recommendation domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                                                                     | RC-14+                                      |
| TD-012 | Legacy `KnowledgeEntry.insights` string[] | Accepted Legacy | Free-text bullets (often copied from campaign recommendations); name collides with Insight domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                                                  | RC-14+                                      |
| TD-013 | Legacy `ResearchAnalysis` parallel stack  | Accepted Legacy | Deterministic `ResearchAnalysis` / `POST /campaigns/analyze` duplicates Insight / Recommendation / ResearchReport concerns. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                         | RC-14+                                      |
| TD-028 | Execution Model                           | In progress     | US159–US178 complete the durable M2 Order/Risk/Execution/Fill/accounting path, including valuation, Portfolio, reconciliation fencing, and reads. Remaining RC-16 work is Strategy runtime, continuous safety, recovery, and operations.                                                                                            | RC-16 (ADR-012)                             |
| TD-029 | Advanced Performance Metrics              | Planned         | `PerformanceReport` covers net profit, total return, CAGR, drawdown, volatility, win rate, profit factor; risk-adjusted metrics (Sharpe, Sortino, Calmar) not yet computed. (VS001/VS004)                                                                                                                                           | RC-16+ (Performance analytics)              |
| TD-030 | Scoring Strategy                          | Deferred        | Strategy Comparison uses a fixed weighted-score model with hardcoded weights; deterministic but not configurable/pluggable. (VS001/VS003)                                                                                                                                                                                           | RC-16+ (Comparison configurability)         |
| TD-031 | Report Exporters                          | Future          | `SimulationReport` is an immutable in-memory / JSON artifact; no PDF / CSV / HTML exporters. (VS004)                                                                                                                                                                                                                                | Future (Reporting)                          |
| TD-032 | Operational Metadata Isolation            | Mitigated (M2)  | ADR-013/014/018 semantic vs operational split is enforced in market events and in M2 Fill, valuation, Portfolio source-hash, and deterministic rebuild inputs. Continue validation across M3+ runtime artifacts.                                                                                                                    | RC-16 M3+                                   |
| TD-033 | Large Dataset Scalability                 | Deferred        | Million-bar workloads retain full per-bar snapshot arrays in memory (~2.7 GB at 1m×10 in VS002) and required an iterative peak/trough fix (spread over large arrays overflowed the call stack). Consider streaming / aggregated snapshots. (VS002)                                                                                  | RC-16+ (Scalability)                        |
| TD-034 | Stage-1 Production Path Consolidation     | Planned         | Current manual `ProductionService.tick` and RC-15 simulation Trade/Portfolio abstractions are parallel paths. ADR-012/015/017 require one canonical Session → Order → Execution → accounting path.                                                                                                                                  | RC-16 M2–M3                                 |
| TD-035 | Durable Event Delivery                    | Resolved (M2)   | US155 binds Nest runtime to Prisma Outbox/Inbox/checkpoints and transactional writer, with lifecycle-managed polling. The process-local Event Bus remains activity-only; retries/dead letters remain durable.                                                                                                                       | Completed in RC-16 M2                       |
| TD-036 | Runtime Recovery and Reconciliation       | Planned         | Active deployments persist, but no always-on ownership lease, semantic checkpoint, startup recovery, or reconciliation exists. ADR-014 freezes the required lifecycle.                                                                                                                                                              | RC-16 M3–M5                                 |
| TD-037 | Decimal Ledger Migration                  | Resolved (M2)   | US153 and US172–US178 provide exact decimal contracts, immutable Fill-derived Position accounting, balanced append-only Ledger entries, atomic idempotent Fill application, decimal valuation/Portfolio, and deterministic reconciliation.                                                                                          | Completed in RC-16 M2                       |
| TD-038 | Live Market Nest Outbox Wiring            | Resolved (M2)   | US155 switched `EventProcessingModule` to Prisma Outbox/Inbox/ConsumerCheckpoint providers and lifecycle polling without changing ADR-013 contracts.                                                                                                                                                                                | Completed in RC-16 M2                       |
| TD-039 | Exact Decimal Mark Source                 | Planned         | M1 `MarkPriceEvent.price` originates as a JavaScript number; M2 immediately converts and quantizes it at the valuation boundary. Move the canonical market event contract and provider midpoint calculation to exact decimal text before M3 strategy execution.                                                                     | RC-16 M3 prerequisite                       |
| TD-040 | Position Fill Application Ordering        | Planned         | M2 immediate manual Fills rebuild deterministically by immutable event timestamps and identity. Before concurrent M3 strategy execution, persist explicit per-Position Fill application order so cross-Order delivery order can always be reproduced exactly.                                                                       | RC-16 M3 prerequisite                       |
| TD-041 | Ledger History Pagination                 | Planned         | US178 Ledger history is workspace/account scoped and read-only but currently unbounded. Add stable cursor pagination before M3/M6 operational history grows.                                                                                                                                                                        | RC-16 M3/M6                                 |
| TD-042 | Durable Consumer Fan-out Progress         | Planned         | The Outbox dispatcher stores one publication state per event while multiple runtime consumers fan out in-process. Position valuation has transactional progress, but Portfolio refresh relies on source-hash idempotency without its own Inbox record. Add durable per-consumer acknowledgement/progress before M3 expands fan-out. | RC-16 M3 prerequisite                       |

---

## By status

### Accepted

- TD-001 — InMemory Repository
- TD-003 — PipelineRun not persisted
- TD-008 — Prisma `any` in legacy tests
- TD-009 — `forwardRef` for Pipeline module wiring

### Accepted Legacy

- TD-011 — `CampaignReport.recommendations` (do not expand; migrate RC-14+)
- TD-012 — `KnowledgeEntry.insights` string[] (do not expand; migrate RC-14+)
- TD-013 — `ResearchAnalysis` parallel stack (do not expand; migrate RC-14+)

### Deferred

- TD-004 — No Scheduler
- TD-007 — No Vector Search
- TD-030 — Scoring Strategy (configurable comparison weights)
- TD-033 — Large Dataset Scalability (streaming / aggregated snapshots)

### Mitigated / Partial

- TD-005 — Authentication hardening (production JWT secret validation; passwordless Identity remains)
- TD-006 — Production authorization/workspace scope (trading command gate; Stage-1 production path pending)
- TD-032 — Operational Metadata Isolation (mitigated for M1 market events; extend in M2+)

### Resolved

- TD-035 — Durable Event Delivery (PostgreSQL Nest runtime + lifecycle poller)
- TD-037 — Decimal Ledger Migration (including valuation/Portfolio/reconciliation)
- TD-038 — Live Market Nest Outbox Wiring

### Planned

- TD-002 — Durable runtime queue/scheduler ownership
- TD-010 — Extract `InsightGenerationService` (shared deterministic Insight drafting)
- TD-028 — Execution Model (M2 US159–US178 complete; M3–M6 runtime work remains)
- TD-029 — Advanced Performance Metrics (Sharpe / Sortino / Calmar)
- TD-034 — Stage-1 Production Path Consolidation
- TD-036 — Runtime Recovery and Reconciliation
- TD-039 — Exact Decimal Mark Source
- TD-040 — Position Fill Application Ordering
- TD-041 — Ledger History Pagination
- TD-042 — Durable Consumer Fan-out Progress

### Future

- TD-031 — Report Exporters (PDF / CSV / HTML)

---

## RC-16 final review classification

### Must resolve before M3 execution is enabled

- TD-034 — retire or disable the Stage-1 parallel execution path.
- TD-039 — move the canonical mark-price source to exact decimal text.
- TD-040 — persist explicit per-Position Fill application order.
- TD-042 — persist per-consumer Inbox/acknowledgement progress for fan-out.

### May be resolved during M3

- TD-002 — durable runtime queue/scheduler ownership.
- TD-005 — authentication hardening beyond the current development identity.
- TD-006 — complete authorization migration as Stage-1 is consolidated.
- TD-028 — continue the canonical execution model through M3–M6.
- TD-032 — extend semantic/operational metadata validation to M3 artifacts.
- TD-036 — implement runtime recovery and reconciliation through M3–M5.
- TD-041 — add stable Ledger-history pagination before operational growth.

### Backlog only

- TD-001, TD-003, TD-004, TD-007…TD-013 — legacy persistence, scheduling,
  intelligence, typing, layering, and duplicate-domain cleanup.
- TD-029…TD-031 and TD-033 — analytics, scoring, exporters, and large-dataset
  scalability.

TD-042 was exposed by this final audit; all identified release blockers are now
explicit. No additional hidden blocker was found.

---

## Future milestones (possible RCs)

| Possible RC   | Theme                              | Candidate debt                                        |
| ------------- | ---------------------------------- | ----------------------------------------------------- |
| RC-13+        | Persistence / durability           | TD-001, TD-002, TD-003                                |
| RC-14+        | Legacy migration                   | TD-004, TD-011, TD-012, TD-013                        |
| RC-15+        | Knowledge intelligence             | TD-007                                                |
| RC-16         | Paper runtime, safety & durability | TD-002, TD-005, TD-006, TD-028, TD-032, TD-034…TD-042 |
| RC-16+        | Simulation analytics & scale       | TD-029, TD-030, TD-033                                |
| Future        | Reporting                          | TD-031                                                |
| Opportunistic | Hygiene                            | TD-008, TD-009, TD-010                                |

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
