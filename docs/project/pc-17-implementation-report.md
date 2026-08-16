# PC-17 AI Analytics Product — Implementation Report

**Package:** PC-17 AI Analytics Product  
**Wave:** E — evidence and delivery (AI Analytics product UI)  
**Date:** 2026-08-16  
**Journey:** J-11 AI Narrative **COMPLETE**  
**Status:** Ready for review (stop before PC-20)  
**Readiness:** AI Analytics declared scope **100%**. Overall Product Readiness **88% → 95%**.

This package exposes the certified RC-24 AI Analytics as a customer product. It does not redesign AI Analytics, introduce a new Source of Truth, or persist narratives. Current AI Analytics implementation remains the owner. Generation still consumes Reporting query ports only.

---

## What was exposed

| Surface   | Change                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**  | Existing AI generation at `GET/POST /v1/ai-analytics`. Distinct from research `/v1/ai/execute`.                                                                       |
| **UI**    | AI Analytics Home, analysis browser, generate, history, narrative details, recommendations, reasoning, source viewer, comparison, knowledge / report / strategy refs. |
| **Shell** | AI Analytics nav item in the PC-19 Research band, immediately after Knowledge Lake. Home tile. Research AI (`/ai`) is unchanged.                                      |

No new domain. No new Source of Truth. AI Analytics remains narrative/analysis only. Knowledge Lake remains warehouse owner. Reporting remains report owner. Notification remains delivery owner. Trading owners are unchanged.

---

## Product path (not a redesign)

| File                                         | Role                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/modules/ai-analytics/`         | Existing owner: `AIAnalyticsPort` + AnalyticalNarrative    |
| `apps/api/src/modules/ai-analytics-product/` | HTTP product adapter. Generation + composed reads.         |
| `apps/api/src/modules/reporting/`            | Existing `ReportingQueryPort` / `compareRuns`              |
| `apps/api/src/modules/knowledge-lake/`       | Existing `KnowledgeLakeQueryPort` for cited facts          |
| `apps/api/src/modules/strategy-library/`     | Existing `StrategyLibraryLookupPort` for cited library ids |
| `apps/web/src/ai-analytics/`                 | Home, browser, generate, history, detail                   |

Ports used: existing `AIAnalyticsPort.explain` / `summarize` / `identifyTrends` / `generateNarrative`; Reporting `listRuns` / `getRun` / `compareRuns`; Knowledge Lake `getByEventId`; Strategy Library `getByLibraryEntryId`. UI and REST delegate. No shadow API. No `requestReportRun`. No `admit()`. No `deliver()`. No new storage.

History is the existing deterministic catalog of narratives for workspace ReportRuns, newest `createdAt` first. It is not a second warehouse.

---

## REST contract

Existing AI Analytics generation (product transport):

- `GET /v1/ai-analytics` — browse analyses derived from existing ReportRuns. Optional `kind`, `reportRunId`, `libraryEntryId`, `q`, `limit`.
- `GET /v1/ai-analytics/:analysisId` — narrative, recommendations, reasoning, provenance, sources, knowledge / report / strategy / market refs.
- `POST /v1/ai-analytics/generate` — invoke existing generation kinds from an existing ReportRun (optional compare report / strategy).
- `GET /v1/ai-analytics/history` — existing analyses, newest first.
- `GET /v1/ai-analytics/provenance?analysisId=` — model metadata, sourceRefs, ownership chain.

Unchanged:

- Research `POST /v1/ai/execute` (OpenRouter gateway)
- Reporting REST (`/v1/report-runs`)
- Knowledge Lake REST (`/v1/knowledge-lake`)
- AI Analytics domain `rest: false` / `persistence: false`

Missing workspace header is **400**. Foreign workspace is **403**. Unknown analysis is **404**. Generate without an existing ReportRun is **400**. There is no persistence write and no order / report / knowledge / notification write.

---

## UI

- AI Analytics Home: generate from existing data, analysis browser, kind / report / strategy filters
- Narrative details: text, disclaimer, metadata
- Recommendations (non-trading)
- Insights / reasoning / provenance
- Source viewer
- Comparison view (two existing reports)
- Knowledge / Report / Strategy / market-session references
- History
- Empty, loading, and error states
- `/ai` remains the OpenRouter gateway

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

AI Analytics domain generation posture is unchanged. HTTP is a sibling product adapter. AI Analytics still does not import Knowledge Lake, Strategy Library, or the product adapter.

---

## Definition of Done

| #   | Gate                               | Result                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — existing narratives, generate, compare, provenance, refs operable      |
| 2   | REST transport complete            | **TRUE** — existing AI ports + product views                                      |
| 3   | UI complete                        | **TRUE** — home, browser, generate, history, detail, comparison, refs             |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no new warehouse                                        |
| 5   | Integration wiring complete        | **TRUE** — Reporting, Lake, and Library reads composed, not reimplemented         |
| 6   | Tests PASS                         | **TRUE** — web 211, api 3251, research 24                                         |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched |
| 8   | Release Notes written              | **TRUE** — [`pc-17-release-notes.md`](./pc-17-release-notes.md)                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-17 Closed                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-11 AI Narrative; UI Policy not violated                              |

```text
Package: PC-17
Journey steps enabled: J-11
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-16
```

---

## Companions

- [Architecture Impact](./pc-17-architecture-impact.md)
- [Compatibility Report](./pc-17-compatibility-report.md)
- [AI Analytics UX Audit](./pc-17-ai-analytics-ux-audit.md)
- [Product Surface](./pc-17-product-surface.md)
- [Authority Consumption](./pc-17-authority-consumption.md)
- [System Boundaries](./pc-17-system-boundaries.md)
- [Customer-visible Changes](./pc-17-customer-visible-changes.md)
- [Validation Report](./pc-17-validation-report.md)
- [Release Notes](./pc-17-release-notes.md)
- [Product Readiness Delta](./pc-17-product-readiness-delta.md)

**STOP.** Next package is PC-20 Product UX Polish. Do not begin PC-20 until this package is reviewed.

---

**End of Implementation Report.**
