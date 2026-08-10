# RC-24 Epic 3 — Reporting Domain Model

**Status:** Epic 3 approved — Epic 4 implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Immutable Reporting domain entities only — no report generation / aggregation / AI runtime  
**Parent:** [RC-24 Implementation Plan](./rc-24-implementation-plan.md) · [Epic Breakdown](./rc-24-epic-breakdown.md)  
**Contracts:** [Reporting Domain Model](./rc-24-reporting-domain-model.md) · [API Contract](./rc-24-api-contract.md)  
**Predecessor:** [Epic 2 Lake Read](./rc-24-epic2-knowledge-lake-read-integration.md) (**approved**)

---

## Implementation Report

### What shipped

- Immutable Reporting domain factories/types per Domain Model Contract:
  - `ReportDefinition` (projection config / report metadata template)
  - `HistoricalWindow` (non-SoT parameter object)
  - `ReportRun` / `ReportSnapshot` (immutable materialization record)
  - `AggregationSlice` / `ReportSection` (projection section)
  - `ReportingSourceRef` (Lake / history / Library **references only**)
- Metric catalogs: allowlist + money-adjacent mode requirement + forbidden shadow-accounting keys
- `AnalyticalNarrative` in `ai-analytics` (authority `narrative`; owned by AI Analytics — not Reporting)
- Boundary owned-concerns updated to include domain entities
- No Nest providers for generation ports; no persistence / REST / UI

### Modules touched

| Path                                                                | Change                                   |
| ------------------------------------------------------------------- | ---------------------------------------- |
| `apps/api/src/modules/reporting/domain/reporting-domain-shared.ts`  | **New** modes / metrics / freeze helpers |
| `apps/api/src/modules/reporting/domain/reporting-source-ref.ts`     | **New** reference pointers               |
| `apps/api/src/modules/reporting/domain/historical-window.ts`        | **New**                                  |
| `apps/api/src/modules/reporting/domain/report-definition.ts`        | **New**                                  |
| `apps/api/src/modules/reporting/domain/report-run.ts`               | **New**                                  |
| `apps/api/src/modules/reporting/domain/aggregation-slice.ts`        | **New**                                  |
| `apps/api/src/modules/reporting/domain/reporting-boundary.ts`       | Owned concerns expanded                  |
| `apps/api/src/modules/ai-analytics/domain/analytical-narrative.ts`  | **New** narrative artifact               |
| `apps/api/src/modules/ai-analytics/domain/ai-analytics-boundary.ts` | Owned concerns expanded                  |

### Ports / APIs affected

| Port / surface                                | Status                      |
| --------------------------------------------- | --------------------------- |
| Domain create factories                       | **Active** (structure only) |
| Lake Query consumer (Epic 2)                  | Unchanged                   |
| `ReportingServicePort` / `ReportingQueryPort` | **Inactive**                |
| `AIAnalyticsPort`                             | **Inactive**                |
| REST / persistence / queues                   | **None**                    |

### Explicit out of scope (confirmed absent)

- Report generation / aggregation / summarization behaviour
- AI provider calls / narrative generation runtime
- Persistence product / REST / UI
- Trading Session / Runtime Enforcement / Strategy Library changes
- Knowledge Lake ownership transfer or fact copying as SoT

### Product alias mapping (Contract ↔ task examples)

| Task example             | Canonical contract entity                  |
| ------------------------ | ------------------------------------------ |
| Report / Report Metadata | `ReportDefinition` (+ run metadata fields) |
| Report Snapshot          | `ReportRun`                                |
| Report Section           | `AggregationSlice`                         |

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Entities already locked in RC-24 Reporting Domain Model Contract;
this epic materializes immutable domain factories only)

Canonical ownership changed:
None (Lake remains analytical fact owner; Reporting owns report models only;
AI Analytics owns AnalyticalNarrative)

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                          | Result                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Spec v2.0 §5.14 / §5.15                          | **Compatible** — Reporting projection models; AI narrative artifact |
| Authority Matrix                                 | **Compatible** — Projection + Narrative; never financial SoT        |
| Alias Dictionary                                 | **Compatible** — Report / AI Analytics; `tradingSessionId` on runs  |
| Knowledge Lake                                   | **Preserved** — referenced via `ReportingSourceRef`; never owned    |
| Strategy Library / Runtime Enforcement / Session | **Untouched**                                                       |
| Reporting remains projection-only                | **PASS**                                                            |
| No shadow accounting metric keys                 | **PASS** (rejected by factories)                                    |

### Architecture validation checklist

| Check                                    | Result   |
| ---------------------------------------- | -------- |
| Spec v2.0 compatibility                  | **PASS** |
| Authority Matrix compatibility           | **PASS** |
| Alias Dictionary compatibility           | **PASS** |
| Reporting ownership preserved            | **PASS** |
| Immutable domain models                  | **PASS** |
| Lake references only (no ownership copy) | **PASS** |
| No report generation behaviour           | **PASS** |

---

## Tests Summary

| Suite                   | File                                                | Result       |
| ----------------------- | --------------------------------------------------- | ------------ |
| Domain model            | `reporting/domain/reporting-domain-model.spec.ts`   | **PASS** (9) |
| Boundary owned concerns | `reporting/domain/reporting-boundary.spec.ts`       | **PASS** (8) |
| AnalyticalNarrative     | `ai-analytics/domain/analytical-narrative.spec.ts`  | **PASS** (3) |
| AI boundary             | `ai-analytics/domain/ai-analytics-boundary.spec.ts` | **PASS** (7) |
| Prior Epic 1–2 suites   | reporting + ai-analytics remainder                  | **PASS**     |

**Gate:** `pnpm --filter api exec vitest run src/modules/reporting src/modules/ai-analytics` → **42/42 PASS** (after AI owned-concern test)

Coverage intent:

- Immutable frozen definitions / windows / runs / slices / narratives
- Projection vs narrative authority classes
- Money-adjacent mode labeling required
- Forbidden shadow-accounting metric keys rejected
- Source refs required; Lake ownership not transferred
- No generate / aggregate / summarize / recomputeLedger helpers on domain modules

---

## Documentation Update Summary

| Document                                                    | Update                                        |
| ----------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                            | **New**                                       |
| [Domain Model Contract](./rc-24-reporting-domain-model.md)  | Status → Epic 3 implemented (awaiting review) |
| [RC-24 Epic Breakdown](./rc-24-epic-breakdown.md)           | Epic 3 DoD checked                            |
| [RC-24 Implementation Plan](./rc-24-implementation-plan.md) | Status → Epic 3 awaiting review               |
| `docs/README.md`                                            | Index Epic 3                                  |
| Module READMEs                                              | Reporting + AI Analytics domain notes         |

---

## Epic 3 Definition of Done

- [x] Domain entities match Domain Model contract (fields, immutability, authority class).
- [x] Every Aggregation Slice carries `authorityClass: projection` and mode labeling where money-adjacent.
- [x] Narrative Artifact carries `authorityClass: narrative` and source refs (AI Analytics owned).
- [x] No Ledger / Fill / Order / Session SoT mutation APIs introduced.
- [x] Unit tests for paper vs live labeling requirements and forbidden shadow-accounting helpers.
- [x] Compiles and passes tests independently of AI provider calls.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
