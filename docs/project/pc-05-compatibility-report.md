# PC-05 Reporting Product — Compatibility Report

**Package:** PC-05  
**Date:** 2026-08-15  
**Verdict:** Additive RC-24 Reporting REST and UI. Research `/v1/reports` unchanged. AI and Notification product REST remain later packages. Dashboard and Command Center projections unchanged except an additive ReportRun link.

---

## REST

| Endpoint                                         | Compatibility                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `GET /v1/reports`                                | Unchanged research reports (not RC-24)                                  |
| `GET /v1/report-runs`                            | **New** — existing `listRuns` + product filters                         |
| `GET /v1/report-runs/:reportRunId`               | **New** — existing `getRun` + aggregations + narrative + delivery reads |
| `GET /v1/report-definitions`                     | **New** — existing `listDefinitions`                                    |
| `GET /v1/report-definitions/:reportDefinitionId` | **New** — existing `getDefinition`                                      |
| Notification HTTP                                | Unchanged (none; PC-06 not started)                                     |
| AI HTTP                                          | Unchanged (none; PC-17 not started)                                     |
| Command Center session GET                       | Unchanged fields; UI adds a link                                        |

No new API version. No renamed Reporting domain fields. No generate-report POST.

---

## Frontend compatibility

| Path                      | Compatibility                                                                     |
| ------------------------- | --------------------------------------------------------------------------------- |
| `/reporting`              | **New** Reporting Home / browser                                                  |
| `/reporting/history`      | **New** history                                                                   |
| `/reporting/:reportRunId` | **New** detail                                                                    |
| `/reports`                | **Not mounted** as RC-24 product                                                  |
| Operator Shell bands      | Same Research / Paper trading / Administration frame; Reporting added to Research |
| Command Center session    | Additive “Open in Reporting” when a ReportRun already exists                      |
| Home                      | Additive Reporting tile; still does not call research `/reports`                  |

---

## Downstream

- Reporting remains the report owner.
- AI Analytics remains narrative only (PC-17 product UI not started).
- Notification remains delivery only (PC-06 not started).
- Dashboard remains projection (PC-15 15-f).
- PC-06 Notification Product is next after review.

---

**End of Compatibility Report.**
