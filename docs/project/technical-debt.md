# TRP — Technical Debt Register

Last updated: 2026-08-17 (TD-W2-001 added from W2-S01-c validation; Version 2 residuals TD-045…TD-052 remain)

Living register of known technical debt. Reviewed at RC-15.1 closeout after Validation Sprint V1 (VS001–VS004); TD-028…TD-033 added from Validation Sprint findings. TD-035 and TD-038 resolved by M2 US155 PostgreSQL runtime wiring. Version 2 Product Completion residuals (formerly duplicated in Audit v2) are indexed here. Wave 2 flaky-test residual TD-W2-001 is recorded below; it is not a Wave 2 blocker.

Related:

- Canonical Product Completion Status: [`product-completion-status.md`](./product-completion-status.md)
- Product Readiness Audit v2: [`product-readiness-audit-v2.md`](./product-readiness-audit-v2.md)
- Project Status: [`project-status.md`](./project-status.md)
- Release History: [`release-history.md`](./release-history.md)
- Architecture Snapshot: [`architecture-snapshot.md`](./architecture-snapshot.md)
- Roadmap: [`roadmap.md`](./roadmap.md)
- Story ID Allocation: [`story-id-allocation.md`](./story-id-allocation.md)

---

## Status legend

| Status              | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| **Accepted**        | Known and intentionally carried for the current Research OS phase |
| **Accepted Legacy** | Pre-existing dual path; do not expand; migrate in a later RC      |
| **Open**            | Recorded and unowned for the current slice; not a release blocker |
| **Deferred**        | Acknowledged; not scheduled for the current RC                    |
| **Planned**         | Intended for a future milestone / possible RC                     |
| **Future**          | Product-level enhancement; no committed milestone                 |
| **In progress**     | Partially delivered across the current RC milestones              |
| **Partial**         | Risk reduced, but the item is not fully resolved                  |
| **Mitigated**       | Current scope is protected; later scope still requires validation |
| **Resolved**        | Completed and retained for historical traceability                |

---

## Current debt

| ID        | Item                                                  | Status             | Notes                                                                                                                                                                                                                                                                                                                     | Future milestone                            |
| --------- | ----------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| TD-001    | InMemory Repository                                   | Accepted           | Campaign / Knowledge / Experiment domain stores use in-memory Maps; no durable Repository abstraction yet                                                                                                                                                                                                                 | Possible RC-13+ (Persistence hardening)     |
| TD-002    | InMemory-authoritative Job Queue                      | Planned            | BullMQ mirrors enqueue/retry state, but authoritative Job lookup/dequeue remains in-process. RC-16 event durability uses PostgreSQL Outbox/Inbox; scheduler/worker durability must not rely on the current mirror.                                                                                                        | RC-16 runtime implementation                |
| TD-003    | PipelineRun not persisted                             | Accepted           | `PipelineRun` is in-memory only (`PipelineDomainService`); lost on process restart                                                                                                                                                                                                                                        | Possible RC-13+ (Pipeline observability)    |
| TD-004    | No Scheduler                                          | Deferred           | Jobs are processed by `BackgroundJobRunner` when invoked; no cron / background scheduler                                                                                                                                                                                                                                  | Possible RC-14 (Background scheduling)      |
| TD-005    | Authentication hardening                              | Partial (M2)       | US158 rejects insecure production JWT fallbacks and short secrets at Auth module construction. Login remains passwordless/in-memory Identity for development; durable credential store remains later.                                                                                                                     | RC-16 safety foundation                     |
| TD-006    | Production authorization/workspace scope              | Partial (M2)       | US158 adds Trader role, CommandAuthorizationService (Trader/Admin), and WorkspaceAccessService membership checks for trading commands. The retired Stage-1 `production/` execution path no longer bypasses that gate; remaining authorization migration is limited to later runtime surfaces.                             | RC-16 safety foundation                     |
| TD-007    | No Vector Search                                      | Deferred           | Knowledge search is deterministic in-memory text / tag / experimentId filters only                                                                                                                                                                                                                                        | Possible RC-15+ (Knowledge intelligence)    |
| TD-008    | Prisma `any` in legacy tests                          | Accepted           | RC-15.1: repository lint restored to green. `@typescript-eslint/no-explicit-any` is now scoped **off for test files only** (`**/*.spec.ts`, `**/*.test.ts`, `**/validation/**`); production code remains strict. Underlying loose Prisma mock typing persists — tighten opportunistically.                                | Planned (test-typing hygiene; non-blocking) |
| TD-009    | `forwardRef` for Pipeline module wiring               | Accepted           | `KnowledgeModule` uses `forwardRef(() => PipelineModule)` to break Nest cycle `Knowledge → Pipeline → Experiments → Knowledge`                                                                                                                                                                                            | Planned (optional module-boundary cleanup)  |
| TD-010    | Extract `InsightGenerationService`                    | Planned            | Deterministic Insight draft generation currently lives in pipeline step rule helpers (`insight-extraction.rules`, cross-analysis persist mapping); extract a dedicated `InsightGenerationService` for reuse across Insight / Cross-Campaign pipelines                                                                     | Possible RC-14+                             |
| TD-011    | Legacy `CampaignReport.recommendations`               | Accepted Legacy    | Pre-RC-13 string[] guidance on Campaign Report; overlaps Recommendation domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                                                           | RC-14+                                      |
| TD-012    | Legacy `KnowledgeEntry.insights` string[]             | Accepted Legacy    | Free-text bullets (often copied from campaign recommendations); name collides with Insight domain. **Do not expand.** Migration planned in RC-14+.                                                                                                                                                                        | RC-14+                                      |
| TD-013    | Legacy `ResearchAnalysis` parallel stack              | Accepted Legacy    | Deterministic `ResearchAnalysis` / `POST /campaigns/analyze` duplicates Insight / Recommendation / ResearchReport concerns. **Do not expand.** Migration planned in RC-14+.                                                                                                                                               | RC-14+                                      |
| TD-028    | Execution Model                                       | In progress        | US159–US178 + M3 US221–US223 complete the durable canonical Order/Risk/Execution/Fill/accounting path including strategy origin. Remaining work is continuous safety, recovery, and operations under **RC-17**.                                                                                                           | RC-17 (ADR-012)                             |
| TD-029    | Advanced Performance Metrics                          | Planned            | `PerformanceReport` covers net profit, total return, CAGR, drawdown, volatility, win rate, profit factor; risk-adjusted metrics (Sharpe, Sortino, Calmar) not yet computed. (VS001/VS004)                                                                                                                                 | RC-16+ (Performance analytics)              |
| TD-030    | Scoring Strategy                                      | Deferred           | Strategy Comparison uses a fixed weighted-score model with hardcoded weights; deterministic but not configurable/pluggable. (VS001/VS003)                                                                                                                                                                                 | RC-16+ (Comparison configurability)         |
| TD-031    | Report Exporters                                      | Future             | `SimulationReport` is an immutable in-memory / JSON artifact; no PDF / CSV / HTML exporters. (VS004)                                                                                                                                                                                                                      | Future (Reporting)                          |
| TD-032    | Operational Metadata Isolation                        | Mitigated (M2)     | ADR-013/014/018 semantic vs operational split is enforced in market events and in M2 Fill, valuation, Portfolio source-hash, and deterministic rebuild inputs. Continue validation across RC-17 runtime artifacts.                                                                                                        | RC-17                                       |
| TD-033    | Large Dataset Scalability                             | Deferred           | Million-bar workloads retain full per-bar snapshot arrays in memory (~2.7 GB at 1m×10 in VS002) and required an iterative peak/trough fix (spread over large arrays overflowed the call stack). Consider streaming / aggregated snapshots. (VS002)                                                                        | RC-16+ (Scalability)                        |
| TD-034    | Stage-1 Production Path Consolidation                 | Resolved (M3 gate) | RC-16 Phase0 retired the manual `ProductionService.tick` path, removed the Stage-1 paper adapter, and disabled the direct paper session execution bypass so paper execution can only proceed through the canonical Order → Risk → Execution Engine → Paper Execution Adapter → Fill → Position → Ledger → Portfolio path. | Completed 2026-07-29                        |
| TD-035    | Durable Event Delivery                                | Resolved (M2)      | US155 binds Nest runtime to Prisma Outbox/Inbox/checkpoints and transactional writer, with lifecycle-managed polling. The process-local Event Bus remains activity-only; retries/dead letters remain durable. **This is paper runtime event durability. It is not the Notification durable delivery queue (TD-045).**     | Completed in RC-16 M2                       |
| TD-036    | Runtime Recovery and Reconciliation                   | Partial (RC-18)    | **RC-17 BASELINED + RC-18 R1–R5 Done (2026-08-01):** US290–US294 Implemented (chaos Evidence Package attached). Remaining mandatory: US295 ADL-008. See residual ownership table / Residual Register.                                                                                                                     | RC-18 (US295) / E19 / backlog               |
| TD-037    | Decimal Ledger Migration                              | Resolved (M2)      | US153 and US172–US178 provide exact decimal contracts, immutable Fill-derived Position accounting, balanced append-only Ledger entries, atomic idempotent Fill application, decimal valuation/Portfolio, and deterministic reconciliation.                                                                                | Completed in RC-16 M2                       |
| TD-038    | Live Market Nest Outbox Wiring                        | Resolved (M2)      | US155 switched `EventProcessingModule` to Prisma Outbox/Inbox/ConsumerCheckpoint providers and lifecycle polling without changing ADR-013 contracts.                                                                                                                                                                      | Completed in RC-16 M2                       |
| TD-039    | Exact Decimal Mark Source                             | Resolved (M3 gate) | Canonical `MarkPriceEvent.price` / `MarkPriceDraft.price` are exact decimal text. Binance bookTicker midpoints are computed with `FinancialDecimal` (no `Number` authority). Valuation consumes the decimal string without accepting JavaScript numbers as the mark source.                                               | Completed 2026-07-29                        |
| TD-040    | Position Fill Application Ordering                    | Resolved (M3 gate) | Explicit per-Position Fill application ordinals persist in `position_fill_applications` under the Position lock. Rebuild prefers that durable order over Fill timestamps so interleaved delivery remains reproducible after restart/replay; unique `fill_id` blocks duplicate reordering.                                 | Completed 2026-07-29                        |
| TD-041    | Ledger History Pagination                             | Planned            | US178 Ledger history is workspace/account scoped and read-only but currently unbounded. Add stable cursor pagination before RC-17 E19 operational history grows.                                                                                                                                                          | RC-17 E19                                   |
| TD-042    | Durable Consumer Fan-out Progress                     | Resolved (M3 gate) | Outbox stores durable per-consumer delivery acknowledgements in `outbox_consumer_deliveries`. The dispatcher skips already-acked consumers on retry/restart, records ack after successful handle, and only then marks the Outbox row published — preserving at-least-once transport with idempotent fan-out progress.     | Completed 2026-07-29                        |
| TD-043    | Playwright regression suite                           | Deferred           | RC-17 deliberately skipped introducing Playwright. CANONICAL stack intent still lists Playwright. Shipped product tests are Vitest. Add browser regression coverage (Login, Lab, Strategies, Campaign, Knowledge, Production, AI) in a later RC once tooling is approved.                                                 | Future RC (E2E tooling)                     |
| TD-044    | Gradual web Error Stack                               | Deferred           | RC-17 mapped API errors in existing `shared/api` / research-control clients (`mapHttpError`). A fuller shared ErrorAlert / useApiError stack remains optional and should not block production readiness.                                                                                                                  | Future RC (UX hardening)                    |
| TD-045    | Notification durable delivery queue                   | Deferred           | Distinct from TD-035 (paper Outbox/Inbox, resolved). RC-24 non-goal. Notification delivery is in-process. Restart can lose in-flight adapter state. Not a Product Completion package.                                                                                                                                     | Infrastructure                              |
| TD-046    | IDE shell                                             | Deferred           | Residual `ide-shell`. PC-19 delivered paper-first chrome, not an IDE. Operators use classic Research / Paper / Administration nav.                                                                                                                                                                                        | Version 3                                   |
| TD-047    | Durable paper Kill Switch                             | Deferred           | Durable Kill Switch REST is live-only. Paper product hides the control. Pause / resume / stop remain.                                                                                                                                                                                                                     | Version 3                                   |
| TD-048    | Process-local V2 analytical stores                    | Deferred           | Certified `persistence: false` on several V2 analytical modules. Residual `durable-persistence-product`. Restart can drop Reporting, Notification, Orchestrator, and related analytical artifacts. Identity / workspace / paper sessions are durable.                                                                     | Infrastructure                              |
| TD-049    | Telegram production Bot API                           | Deferred           | RC-24 deferred production Bot network. `InMemoryTelegramAdapter` is the certified path. Connect / test / receive work in-process. They do not hit Telegram’s production Bot API. PC-07 Notification Channels Product remains Closed on that path.                                                                         | Infrastructure                              |
| TD-050    | Reserved notification channels                        | Deferred           | SMTP, Slack, Discord, Teams, and Push are reserved-inactive. No email / Slack / Discord / Teams / push notifications.                                                                                                                                                                                                     | Version 3                                   |
| TD-051    | Additional venue adapters                             | Deferred           | Residual `additional-venue-adapters`. Real BINANCE / BYBIT / OKX I/O is stubbed. MOCK / paper path works.                                                                                                                                                                                                                 | Version 3                                   |
| TD-052    | Live capital                                          | Deferred           | Paper Freeze ADR-012…018. Residual `live-capital`. Version 2 is paper-first. Live capital is unauthorized.                                                                                                                                                                                                                | Version 3                                   |
| TD-W2-001 | Intermittent timeout in `market-state.module.spec.ts` | Open               | Flaky full-suite timeout discovered during W2-S01-c validation. Passes in isolation. Outside Connection Management / W2-S01. Do not fix during W2-S01.                                                                                                                                                                    | Future platform stabilization               |

---

## Wave 2 debt detail

### TD-W2-001 — Intermittent timeout in market-state.module.spec.ts

| Field                 | Value                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | TD-W2-001                                                                                                                                                                                                       |
| **Title**             | Intermittent timeout in market-state.module.spec.ts                                                                                                                                                             |
| **Discovered during** | W2-S01-c Validation                                                                                                                                                                                             |
| **Description**       | The full repository test suite exposed an intermittent timeout in `market-state.module.spec.ts`. The test passes when executed independently. No evidence currently links the timeout to Connection Management. |
| **Status**            | Open                                                                                                                                                                                                            |
| **Priority**          | Low                                                                                                                                                                                                             |
| **Classification**    | Flaky Test                                                                                                                                                                                                      |
| **Owner**             | Platform Engineering                                                                                                                                                                                            |
| **Scope**             | Outside W2-S01                                                                                                                                                                                                  |
| **Resolution**        | Future platform stabilization. Do not fix during W2-S01.                                                                                                                                                        |

This item is not a Wave 2 blocker and must not delay Wave 2.

---

## By status

### Accepted

- TD-001 — InMemory Repository
- TD-003 — PipelineRun not persisted
- TD-008 — Prisma `any` in legacy tests
- TD-009 — `forwardRef` for Pipeline module wiring

### Open

- TD-W2-001 — Intermittent timeout in `market-state.module.spec.ts` (flaky; outside W2-S01)

### Accepted Legacy

- TD-011 — `CampaignReport.recommendations` (do not expand; migrate RC-14+)
- TD-012 — `KnowledgeEntry.insights` string[] (do not expand; migrate RC-14+)
- TD-013 — `ResearchAnalysis` parallel stack (do not expand; migrate RC-14+)

### Deferred

- TD-004 — No Scheduler
- TD-007 — No Vector Search
- TD-030 — Scoring Strategy (configurable comparison weights)
- TD-033 — Large Dataset Scalability (streaming / aggregated snapshots)
- TD-043 — Playwright regression suite (deferred from RC-17; CANONICAL lists stack intent)
- TD-044 — Gradual web Error Stack (mapHttpError shipped; full stack optional)
- TD-045 — Notification durable delivery queue (not TD-035)
- TD-046 — IDE shell
- TD-047 — Durable paper Kill Switch
- TD-048 — Process-local V2 analytical stores
- TD-049 — Telegram production Bot API
- TD-050 — Reserved notification channels (SMTP / Slack / Discord / Teams / Push)
- TD-051 — Additional venue adapters
- TD-052 — Live capital

### Mitigated / Partial

- TD-005 — Authentication hardening (production JWT secret validation; passwordless Identity remains)
- TD-006 — Production authorization/workspace scope (trading command gate; Stage-1 production path pending)
- TD-032 — Operational Metadata Isolation (mitigated for M1 market events and M2 Fill/valuation/Portfolio/rebuild; extend in M3+)

### Resolved

- TD-035 — Durable Event Delivery (PostgreSQL Nest runtime + lifecycle poller; **not** Notification queue TD-045)
- TD-034 — Stage-1 Production Path Consolidation (legacy tick/direct paper execution removed)
- TD-037 — Decimal Ledger Migration (including valuation/Portfolio/reconciliation)
- TD-038 — Live Market Nest Outbox Wiring
- TD-039 — Exact Decimal Mark Source (canonical MarkPriceEvent/Draft decimal text + book mid)
- TD-040 — Position Fill Application Ordering (durable per-Position ordinals + rebuild)
- TD-042 — Durable Consumer Fan-out Progress (per-consumer Outbox acknowledgement)

### Planned

- TD-002 — Durable runtime queue/scheduler ownership
- TD-010 — Extract `InsightGenerationService` (shared deterministic Insight drafting)
- TD-028 — Execution Model (M2 US159–US178 complete; M3–M6 runtime work remains)
- TD-029 — Advanced Performance Metrics (Sharpe / Sortino / Calmar)
- TD-036 — Runtime Recovery and Reconciliation (RC-17 baselined; residuals below)
- TD-041 — Ledger History Pagination

### Future

- TD-031 — Report Exporters (PDF / CSV / HTML)

---

## TD-036 residual ownership (RC-17 closure / RC-18 progress)

Authoritative after RC-17 BASELINED. Every residual has an explicit owner role.
Living mid-release detail: [`rc-18-residual-register.md`](./rc-18-residual-register.md).

| Residual                                                               | Class                  | Owner                                               | Target                   | Mid-release (2026-08-01)                                                         |
| ---------------------------------------------------------------------- | ---------------------- | --------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Force/confirm Session `RECOVERING` on discovery                        | **RC-18 mandatory**    | E17 / Runtime Recovery owner                        | RC-18                    | **Closed (US290)**                                                               |
| Real `RECOVERY_RECONCILIATION_PORTS` adapters (retire production stub) | **RC-18 mandatory**    | E17 / Runtime Recovery owner                        | RC-18                    | **Closed (US291)**                                                               |
| Durable RecoveryState persistence + phase machine                      | **RC-18 mandatory**    | E17 / Runtime Recovery owner                        | RC-18                    | **Closed (US292)**                                                               |
| Durable Incident on ambiguity / corruption                             | **RC-18 mandatory**    | E17 / Runtime Recovery owner (+ E19 Incident model) | RC-18                    | **Closed (US293)**                                                               |
| Chaos/restart + fail-safe evidence suites                              | **RC-18 mandatory**    | RC-18 Release lead + Runtime Recovery owner         | RC-18                    | **Closed (US294)** — [Evidence Package](./rc-18-us294-chaos-restart-evidence.md) |
| ADL-008 promotion to ACCEPTED (or explicit accepted deferral)          | **RC-18 mandatory**    | Architecture owner                                  | RC-18                    | **Open (US295)**                                                                 |
| Durable Kill Switch policy for admission/arming                        | **E19 operational**    | E19 Operations owner                                | E19 / RC-18+             | Open                                                                             |
| Operator recovery status / phase API                                   | **E19 operational**    | E19 Operations owner                                | E19 / RC-18+             | Open                                                                             |
| Auth hardening / authorization leftovers (TD-005 / TD-006)             | **E19 operational**    | Platform / Auth owner                               | E19 / RC-18+             | Open                                                                             |
| Order proposal from recovery SignalIntent                              | **Future backlog**     | Orders / Canonical path owner                       | Future epic              | Open                                                                             |
| In-process stage cache durability (lastResult/Sets)                    | **Future backlog**     | Runtime Recovery owner (with RecoveryState)         | After RecoveryState      | Open                                                                             |
| Local vs original story-title dual scoping notes                       | **Documentation only** | Documentation / Release lead                        | Maintained in epic notes | Open                                                                             |
| E18 Event Processing epic delivery                                     | **Future backlog**     | E18 owner                                           | RC-18+                   | Open                                                                             |
| E20 Market Data / E21 Multi-Strategy epics                             | **Future backlog**     | E20 / E21 owners                                    | RC-18+                   | Open                                                                             |

Evidence: [`e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md),
[`rc-17-retrospective.md`](./rc-17-retrospective.md),
[`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md).

---

## RC-16 final review classification (historical)

> Pre-M3 gate debts TD-034/039/040/042 are resolved. Remaining items below are
> owned by **RC-17** as of 2026-07-30 — [`release-history.md`](./release-history.md).

### Must resolve before M3 execution is enabled

- _(none remaining — TD-034, TD-039, TD-040, and TD-042 resolved)_

### Open under RC-17 (formerly “during M3–M6”)

- TD-002 — durable runtime queue/scheduler ownership (E17/E18 clarification).
- TD-005 — authentication hardening beyond the current development identity.
- TD-006 — complete authorization migration on remaining runtime surfaces.
- TD-028 — continue the canonical execution model through RC-17 ops/safety.
- TD-032 — extend semantic/operational metadata validation to RC-17 artifacts.
- TD-036 — implement runtime recovery and reconciliation (**RC-17 E17**).
- TD-041 — add stable Ledger-history pagination before E19 operational growth.

### Backlog only

- TD-001, TD-003, TD-004, TD-007…TD-013 — legacy persistence, scheduling,
  intelligence, typing, layering, and duplicate-domain cleanup.
- TD-029…TD-031 and TD-033 — analytics, scoring, exporters, and large-dataset
  scalability.

TD-042 was exposed by this final audit; all identified release blockers are now
explicit. No additional hidden blocker was found.

---

## Future milestones (possible RCs)

| Possible RC   | Theme                              | Candidate debt                                         |
| ------------- | ---------------------------------- | ------------------------------------------------------ |
| RC-13+        | Persistence / durability           | TD-001, TD-002, TD-003                                 |
| RC-14+        | Legacy migration                   | TD-004, TD-011, TD-012, TD-013                         |
| RC-15+        | Knowledge intelligence             | TD-007                                                 |
| RC-16         | Paper runtime baseline (delivered) | TD-034…TD-042 (gates resolved where marked)            |
| RC-17         | Production readiness / ops runtime | TD-002, TD-005, TD-006, TD-028, TD-032, TD-036, TD-041 |
| RC-16+        | Simulation analytics & scale       | TD-029, TD-030, TD-033                                 |
| Future        | Reporting                          | TD-031, TD-043, TD-044                                 |
| Opportunistic | Hygiene                            | TD-008, TD-009, TD-010                                 |

Exact RC numbering follows [`release-history.md`](./release-history.md) and
[`roadmap.md`](./roadmap.md).

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

Update this file when debt is added, resolved, or reclassified after a User Story, RC audit, or Product Completion closeout. Do not duplicate this inventory in Audit v2, README, or Project Status.
