# PC-05 Reporting Product — Implementation Report

**Package:** PC-05 Reporting Product  
**Wave:** E — evidence and delivery (Reporting product UI)  
**Date:** 2026-08-15  
**Journey:** J-10 Reporting — **COMPLETE**  
**Status:** Ready for review (stop before PC-06)  
**Readiness:** Reporting declared scope **100%**. Overall Product Readiness remains **58%** (no invented overall score).

This package exposes the certified RC-24 Reporting capability as a customer product. It does not redesign Reporting, AI Analytics, Notification, or Dashboard, and does not introduce a new report engine, report types, or storage.

---

## What was exposed

| Surface   | Change                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST**  | Existing Reporting queries at `GET /v1/report-runs` and `GET /v1/report-definitions`. Distinct from research `/v1/reports`.                          |
| **UI**    | Reporting Home, report browser, detail, history, narrative panel, delivery panel, search, filters, empty / loading / errors, projection JSON export. |
| **Shell** | Reporting nav item in the PC-19 Research band. Home tile. Command Center link to an existing ReportRun.                                              |

No new domain. No new Source of Truth. Reporting remains the report owner. AI remains narrative only. Notification remains delivery only. Dashboard remains projection.

---

## Product path (not a redesign)

| File                                                                     | Role                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| `apps/api/src/modules/reporting/reporting-query.service.ts`              | Existing owner: definitions / runs / aggregations |
| `apps/api/src/modules/reporting-product/`                                | HTTP product adapter. Queries only.               |
| `apps/api/src/modules/product-flow/report-narrative-consumer.service.ts` | Existing attached-narrative read                  |
| `apps/api/src/modules/notification-delivery/`                            | Existing `listDeliveries` read                    |
| `apps/web/src/reporting/`                                                | Home, browser, detail, history                    |

Ports used: existing `ReportingQueryPort`; PC-15 `getAttachedNarrative`; Notification `listDeliveries`. UI and REST delegate. No shadow API. No `requestReportRun` in this adapter. No `deliver()`.

History is the existing ReportRun list, newest first. It is not a second report owner.

---

## REST contract

Existing Reporting queries (product transport):

- `GET /v1/report-runs` — list for the workspace. Optional `reportDefinitionId`, `kind`, `status`, `mode`, `tradingSessionId`, `q`, `limit`.
- `GET /v1/report-runs/:reportRunId` — metadata, aggregations, attached narrative, delivery status, projection export payload.
- `GET /v1/report-definitions` — catalog for filters.
- `GET /v1/report-definitions/:reportDefinitionId` — definition metadata.

Unchanged:

- Research `GET /v1/reports` (not RC-24)
- Notification REST (none; PC-06)
- AI REST (none; PC-17)
- Dashboard / Command Center projections (PC-15 15-f)

Missing workspace header is **400**. Foreign workspace is **403**. Unknown run / definition is **404**. There is no generate-report POST, no PDF engine, and no delivery send.

---

## UI

- Reporting Home: search, kind / status / mode filters, report list
- Report history: chronological existing ReportRuns
- Report details: metadata, aggregations, narrative panel, delivery panel
- Export: existing aggregation projection as JSON (not PDF)
- Empty, loading, and error states
- Paper / live mode labels stay projection badges, never ledger SoT

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

Reporting domain `rest: false` posture is unchanged. HTTP is a sibling product adapter. Reporting still does not import AI, Notification, or product-flow.

---

## Definition of Done

| #   | Gate                               | Result                                                                            |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — existing ReportRuns, narratives, delivery status, metadata operable    |
| 2   | REST transport complete            | **TRUE** — existing Reporting queries + product view                              |
| 3   | UI complete                        | **TRUE** — home, browser, detail, history, narrative, delivery, search, filters   |
| 4   | Existing application ports exposed | **TRUE** — no shadow API; no new report engine                                    |
| 5   | Integration wiring complete        | **TRUE** — PC-15 narrative and delivery reads composed, not reimplemented         |
| 6   | Tests PASS                         | **TRUE** — web 179, api 3122                                                      |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched |
| 8   | Release Notes written              | **TRUE** — [`pc-05-release-notes.md`](./pc-05-release-notes.md)                   |
| 9   | CHANGELOG updated                  | **TRUE**                                                                          |
| 10  | Backlog updated                    | **TRUE** — PC-05 Closed                                                           |
| 11  | Canonical user journey works       | **TRUE** — J-10 Complete; UI Policy not violated                                  |

```text
Package: PC-05
Journey steps enabled: J-10
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

---

## Companions

- [Architecture Impact](./pc-05-architecture-impact.md)
- [Compatibility Report](./pc-05-compatibility-report.md)
- [Reporting UX Audit](./pc-05-reporting-ux-audit.md)
- [User Value](./pc-05-user-value.md)
- [System Boundaries](./pc-05-system-boundaries.md)
- [Authority Consumption](./pc-05-authority-consumption.md)
- [Customer-visible Changes](./pc-05-customer-visible-changes.md)
- [Tests Summary](./pc-05-tests-summary.md)
- [Validation Report](./pc-05-validation-report.md)
- [Documentation Summary](./pc-05-documentation-summary.md)
- [Release Notes](./pc-05-release-notes.md)
- [Product Readiness Update](./pc-05-product-readiness-update.md)

**STOP.** Next package is PC-06 Notification Product. Do not begin PC-06 until this package is reviewed.

---

**End of Implementation Report.**
