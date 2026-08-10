# RC-24 Epic Breakdown — Reporting & AI Analytics

**Document:** RC-24 Epic Breakdown  
**Status:** CLOSED — Epics 1–6 complete · Validation PASS · `v1.0.0-rc24`
**Date:** 2026-08-10  
**Nature:** Thin architectural epics. Each Epic must independently compile, test, and be reviewable.

**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md)  
**API:** [API Contract](./rc-24-api-contract.md)  
**Domain:** [Reporting Domain Model](./rc-24-reporting-domain-model.md)  
**Integration:** [Reporting Integration Diagram](./rc-24-reporting-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.13–§5.15, §6, §10  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessors:** [RC-21 CLOSED](./rc-21-closure-report.md) · [RC-22 CLOSED](./rc-22-closure-report.md) · [RC-23 CLOSED](./rc-23-closure-report.md)

---

## Release epic map

```text
Epic 1  Reporting & AI boundary + ownership
  ↓
Epic 2  Knowledge Lake Query Port read integration
  ↓
Epic 3  Reporting Domain Model + read-model contracts
  ↓
Epic 4  Reporting services + query ports
  ↓
Epic 5  AI Analytics narrative layer
  ↓
Epic 6  Notification Delivery Layer (Telegram channel)
  ↓
Validation & Release  Historical / authority close readiness (separate task)
```

**Sequencing note:** Approved implementation order places Lake Query Port consumption
immediately after the boundary (Epic 2). Reporting Domain Model entities
(ReportDefinition / ReportRun / AggregationSlice) follow as Epic 3. Distinct
trading/paper history facades may land with Domain Model / services when needed;
Epic 2 covers Lake Query Port only.

Each Epic must independently compile and pass tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Reporting & AI boundary + ownership

### Objective

Establish the Reporting and AI Analytics module boundaries and publish hard ownership vs Knowledge Lake, Strategy Library, Runtime Enforcement, Trading Session, Ledger, and future Orchestrator.

### Dependencies

- RC-21 / RC-22 / RC-23 CLOSED; Spec §5.14 / §5.15 / §10; Authority Matrix; Alias Dictionary
- Implementation Plan §§3–5

### Definition of Done

- [x] Modules named and documented (canonical: **Reporting**, **AI Analytics** — not Orchestrator, not Enforcement, not Library).
- [x] Ownership table accepted: Lake = Projection warehouse; Reporting = Projection aggregations; AI = Narrative; SoT owners unchanged.
- [x] Explicit: Reporting never authorizes / trades / validates strategies / mutates business state.
- [x] Explicit: AI never becomes SoT; never makes trading decisions; never replaces Enforcement or Library.
- [x] Forbidden dependencies listed (no Lake-as-SoT via reports; no AI → Orders/Risk; no Reporting → certify).
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.14 / §5.15 modules.

**Epic 1 report:** [rc-24-epic1-reporting-boundary.md](./rc-24-epic1-reporting-boundary.md)  
**Boundary diagram:** [rc-24-epic1-boundary-diagram.md](./rc-24-epic1-boundary-diagram.md)

### Expected user value

Shared vocabulary: reports and AI explain what happened — they do not run the platform.

---

## Epic 2 — Knowledge Lake Query Port read integration

### Objective

Wire Reporting as a **consumer** of the approved `KnowledgeLakeQueryPort`. Reporting reads analytical facts only. No report generation. No Lake redesign. No ownership transfer.

### Dependencies

- Epic 1 accepted
- RC-21 `KnowledgeLakeQueryPort`
- RC-24 API Contract §7.1 consumer ports

### Definition of Done

- [x] Reporting reads Lake via Query Port (categories / time / session / scope / producers / correlation filters as contracted).
- [x] Immutable Reporting analytical read models (`authorityClass: projection`).
- [x] Dependency injection wires `KNOWLEDGE_LAKE_QUERY_CONSUMER` → Lake Query Port.
- [x] Empty / missing results handled; tenancy (`workspaceId`) isolation respected.
- [x] No admit path / SoT mutation from Reporting; no report generation / aggregation / narratives.
- [x] Lake never imports Reporting (dependency direction tests).
- [x] No Orchestrator / Market State / Enforcement / Library changes.

**Epic 2 report:** [rc-24-epic2-knowledge-lake-read-integration.md](./rc-24-epic2-knowledge-lake-read-integration.md)

### Expected user value

Reporting can ask Lake authoritative analytical questions without inventing a second warehouse.

---

## Epic 3 — Reporting Domain Model + read-model contracts

### Objective

Implement the locked Reporting Domain Model entities as non-authoritative projection concepts: Report Definition, Report Run, Aggregation Slice, Historical Window, and Narrative Artifact bindings — without persistence product inventiveness beyond what is required to compile/test domain invariants. Optional distinct trading/paper history read facades may be added here if still required.

### Dependencies

- Epic 2 accepted
- [Reporting Domain Model](./rc-24-reporting-domain-model.md)

### Definition of Done

- [x] Domain entities match Domain Model contract (fields, immutability, authority class).
- [x] Every Aggregation Slice carries `authorityClass: projection` and mode labeling where money-adjacent.
- [x] Narrative Artifact carries `authorityClass: narrative` and source refs.
- [x] No Ledger / Fill / Order / Session SoT mutation APIs introduced.
- [x] Unit tests for paper vs live labeling requirements and forbidden shadow-accounting helpers.
- [x] Compiles and passes tests independently of AI provider calls.

**Epic 3 report:** [rc-24-epic3-reporting-domain-model.md](./rc-24-epic3-reporting-domain-model.md)

### Expected user value

Report artifacts have a single canonical shape reviewers can trust as non-SoT.

---

## Epic 4 — Reporting services + query ports

### Objective

Implement Reporting application ports: define/request runs, resolve aggregations, query historical report outputs. Services may aggregate, summarize, compare, and prepare visualization-oriented read models — still projection-only.

### Dependencies

- Epic 2 Lake read consumption + Epic 3 Domain Model
- API Contract `ReportingQueryPort` / `ReportingServicePort`
- Domain Model

### Definition of Done

- [x] `ReportingServicePort` can create/request Report Runs from Definitions + Historical Windows.
- [x] `ReportingQueryPort` can list/get Report Runs and Aggregation Slices.
- [x] Aggregations summarize/compare Lake-backed facts; do not authorize or trade.
- [x] Money-adjacent outputs label `paper` vs `live` (and reject unlabeled money claims in tests).
- [x] No ad-hoc ledger balance recompute helpers.
- [x] Unit/integration tests for happy path + empty data + mode labeling.
- [x] Compiles/tests without requiring live AI provider.

**Epic 4 report:** [rc-24-epic4-report-generation.md](./rc-24-epic4-report-generation.md)

### Expected user value

Operators can obtain deterministic report projections over analytical history.

---

## Epic 5 — AI Analytics narrative layer

### Objective

Implement AI Analytics ports that explain, summarize, identify trends, and generate explainable narratives over Reporting outputs only (analytical facts arrive via reports; no direct Lake query). Narrative-only.

### Dependencies

- Epic 4 Reporting ports
- Spec §10 AI allow/deny
- API Contract `AIAnalyticsPort`
- Existing AI Gateway access pattern (CANONICAL)

### Definition of Done

- [x] `AIAnalyticsPort` supports explain / summarize / trends / narrative generation over Reporting ReportRun outputs (Lake only via Reporting; no direct Lake query).
- [x] Outputs are Narrative Artifacts with source citations and `authorityClass: narrative`.
- [x] Port **must not** expose trade / approve / certify / enforce / mutate-config operations.
- [x] Fail-soft when report context unavailable (core platform continues) — aligned with AI Gateway doctrine.
- [x] Tests: narrative cites Reporting sources; forbidden capability methods absent; SoT-wins disclaimer preserved.
- [x] No Runtime Enforcement or Strategy Library replacement logic.

**Epic 5 report:** [rc-24-epic5-ai-analytical-narratives.md](./rc-24-epic5-ai-analytical-narratives.md)

### Expected user value

Humans get explainable analytical narratives — AI clarifies, it does not trade.

---

## Epic 6 — Notification Delivery Layer

### Objective

Implement the Notification Delivery Layer: deliver completed reports / ops notifications through configured channels. Telegram is the first active channel; other channels remain reserved. Notification never generates reports and never becomes a control plane.

### Dependencies

- Epic 4 Reporting ports (report payloads as opaque delivery input)
- Epic 5 AI narratives complete (no AI changes in this epic)
- Spec §5.16 / Authority Matrix (Telegram = notification projection)

### Definition of Done

- [x] Notification Service delivers via channel abstraction; does not generate reports.
- [x] Telegram Adapter active; Email / Slack / Discord / Teams / Push reserved inactive.
- [x] User preferences: enable, channels, per-type routing, daily time / timezone / quiet hours / critical bypass.
- [x] Telegram connection workflow: connect / verify / disconnect / test (chat id auto-stored).
- [x] Delivery routing respects preferences; critical types can bypass quiet hours.
- [x] No Telegram trading commands / runtime control / Strategy Library coupling.
- [x] Tests: connection, routing, preferences, test notification; Reporting + AI unchanged.

**Epic 6 report:** [rc-24-epic6-notification-delivery.md](./rc-24-epic6-notification-delivery.md)

### Expected user value

Operators receive reports and alerts on Telegram without Telegram becoming a trading control plane.

### Deferred to Validation & Release

Historical window hardening, residual/deferred register closeout, and RC-24 Closure Report remain a **separate Validation & Release** task (formerly planning Epic 6 close-readiness scope).

---

## Cross-epic constraints

| Constraint                                             | Applies to |
| ------------------------------------------------------ | ---------- |
| No architecture redesign / Spec rewrite                | All        |
| No Trading Orchestrator / Market State / Selection     | All        |
| No Market Qualification / Multi Exchange               | All        |
| No Runtime Enforcement redesign                        | All        |
| No Paper Trading product redesign                      | All        |
| No Strategy Library domain redesign                    | All        |
| No Knowledge Lake redesign / Lake-as-SoT               | All        |
| No AI trading decisions / capital control              | Epic 5–6   |
| No shadow accounting                                   | Epics 2–6  |
| No REST / transport / queue inventiveness in contracts | All        |
| Each epic independently compiles + passes tests        | All        |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
