# RC-24 Epic 4 — Report Generation

**Status:** Approved — Epics 1–6 complete; awaiting Validation & Release  
**Date:** 2026-08-10  
**Nature:** Deterministic report generation from Reporting domain models + Knowledge Lake projections — no AI / REST / persistence product  
**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md) · [Epic Breakdown](./rc-24-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-24-api-contract.md) §§4–5 · [Reporting Domain Model](./rc-24-reporting-domain-model.md)  
**Predecessor:** [Epic 3 Domain Model](./rc-24-epic3-reporting-domain-model.md) (**approved**)  
**Successor:** [Epic 5 AI Analytical Narratives](./rc-24-epic5-ai-analytical-narratives.md)

---

## Implementation Report

### What shipped

- `ReportingGenerationService` (`ReportingServicePort`):
  - `registerDefinition`
  - `requestReportRun` — deterministic ReportRun + AggregationSlice[] from Lake reads
  - `compareRuns` — projection comparison slices between two runs
- `ReportingQueryService` (`ReportingQueryPort`):
  - `getDefinition` / `listDefinitions` / `getRun` / `listRuns` / `listAggregations`
- Pure deterministic aggregation (`aggregateReportingFacts`) with stable sort + stable slice ids
- Deterministic `reportRunId` derivation (`deriveReportRunId`) when not supplied
- Process-local `InMemoryReportingStore` (not a DB/persistence product)
- Nest wiring: `REPORTING_SERVICE_PORT` / `REPORTING_QUERY_PORT` active
- Boundary posture: `reportingService` + `reportingQuery` = `true`
- Inputs: Reporting read models + Knowledge Lake only (no Session / Orders / Library / Enforcement ports)

### Modules touched

| Path                                                | Change                                   |
| --------------------------------------------------- | ---------------------------------------- |
| `reporting/ports/reporting.port.ts`                 | Full Epic 4 port contracts; ports active |
| `reporting/generation/aggregate-reporting-facts.ts` | **New** deterministic aggregation        |
| `reporting/generation/derive-report-run-id.ts`      | **New** stable ids                       |
| `reporting/adapters/in-memory-reporting-store.ts`   | **New** process-local artifact store     |
| `reporting/reporting-generation.service.ts`         | **New** generation service               |
| `reporting/reporting-query.service.ts`              | **New** query service                    |
| `reporting/reporting.module.ts`                     | Wire service + query ports               |
| `reporting/domain/reporting-boundary.ts`            | Activate generation ports                |

### Ports / APIs affected

| Port / surface                                          | Status                                          |
| ------------------------------------------------------- | ----------------------------------------------- |
| `ReportingServicePort`                                  | **Active**                                      |
| `ReportingQueryPort`                                    | **Active**                                      |
| `KnowledgeLakeQueryPort` (consume)                      | Active (unchanged)                              |
| `AIAnalyticsPort`                                       | Activated in Epic 5 (report-primary narratives) |
| REST / UI / persistence product / jobs / Telegram / PDF | **None**                                        |

### Explicit out of scope (confirmed absent)

- AI narratives / explanations / provider calls
- REST / UI / scheduled jobs / notifications / Telegram / PDF
- Durable persistence schema
- Direct Trading Session / Orders / Strategy Library / Runtime Enforcement reads
- Shadow ledger recompute

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Report generation already locked in Spec §5.14 + RC-24 API Contract;
this epic activates Nest application ports over approved domain + Lake reads)

Canonical ownership changed:
None (Lake remains analytical fact owner; Reporting owns generated projections)

New runtime:
None (no schedulers / transport / AI runtime)

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                       | Result                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| Spec v2.0 §5.14 / §6                          | **Compatible** — Reporting generates human-facing aggregations from Lake |
| Authority Matrix                              | **Compatible** — reports remain Projection; never financial SoT          |
| Alias Dictionary                              | **Compatible** — `tradingSessionId` filters; Report language             |
| Knowledge Lake                                | **Preserved** — Query Port only; no ownership transfer                   |
| Strategy Library / Runtime / Session / Orders | **Untouched** — not imported by Reporting generation                     |
| AI Analytics                                  | Activated in Epic 5 — narratives consume ReportRun only                  |
| Reporting ownership preserved                 | **PASS**                                                                 |

### Architecture validation checklist

| Check                                              | Result   |
| -------------------------------------------------- | -------- |
| Spec v2.0 compatibility                            | **PASS** |
| Authority Matrix compatibility                     | **PASS** |
| Alias Dictionary compatibility                     | **PASS** |
| Reporting ownership preserved                      | **PASS** |
| Deterministic identical inputs → identical outputs | **PASS** |
| Immutable report snapshots                         | **PASS** |
| No AI behaviour                                    | **PASS** |

---

## Tests Summary

| Suite                                 | File                                              | Result       |
| ------------------------------------- | ------------------------------------------------- | ------------ |
| Report generation                     | `reporting/reporting-generation.spec.ts`          | **PASS** (6) |
| Lake + wiring                         | `reporting/reporting-knowledge-lake-read.spec.ts` | **PASS** (5) |
| Ports / boundary / domain / direction | prior reporting + ai-analytics suites             | **PASS**     |

**Gate:** `pnpm --filter api exec vitest run src/modules/reporting src/modules/ai-analytics` → **48/48 PASS**

Coverage intent:

- Identical inputs → identical ReportRun + aggregations
- Empty historical windows → `empty` outcome
- Aggregation correctness (counts, category groups, display PnL projection with mode)
- Comparison deltas between runs
- Immutable frozen snapshots
- Query port list/get surfaces
- Rejection of ambiguous definition / unknown modes
- No AI helpers on service/ports

---

## Documentation Update Summary

| Document                                                    | Update                           |
| ----------------------------------------------------------- | -------------------------------- |
| This Epic Report                                            | **New**                          |
| [RC-24 Epic Breakdown](./rc-24-epic-breakdown.md)           | Epic 4 DoD checked               |
| [RC-24 Implementation Plan](./rc-24-implementation-plan.md) | Status → Epic 4 awaiting review  |
| [API Contract](./rc-24-api-contract.md)                     | Status note: Epic 4 ports active |
| `docs/README.md`                                            | Index Epic 4                     |
| Module README                                               | Generation surfaces              |

---

## Epic 4 Definition of Done

- [x] `ReportingServicePort` can create/request Report Runs from Definitions + Historical Windows.
- [x] `ReportingQueryPort` can list/get Report Runs and Aggregation Slices.
- [x] Aggregations summarize/compare Lake-backed facts; do not authorize or trade.
- [x] Money-adjacent outputs label `paper` vs `live` (mode required on those slices).
- [x] No ad-hoc ledger balance recompute helpers.
- [x] Unit/integration tests for happy path + empty data + mode labeling + determinism.
- [x] Compiles and passes tests independently of AI provider.

**Approved.** Epic 5 follow-on: [rc-24-epic5-ai-analytical-narratives.md](./rc-24-epic5-ai-analytical-narratives.md).
