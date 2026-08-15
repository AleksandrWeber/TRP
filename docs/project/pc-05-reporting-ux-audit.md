# PC-05 Reporting Product — Reporting UX Audit

**Package:** PC-05  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Reporting is a real customer product over existing ReportRuns

This is not a visual redesign audit. The question is: **can the operator browse existing reports, open details, read narrative and delivery status, search/filter, and export the existing projection — without implying ledger SoT, a new report engine, or live capital?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                                 | Answer                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| Reporting nav                           | **Yes** — opens `/reporting` over `GET /v1/report-runs`            |
| Report list / browser                   | **Yes** — existing ReportRuns for the workspace                    |
| Search / filters                        | **Yes** — name/id/session search; kind, status, mode filters       |
| Report details                          | **Yes** — metadata, window, session, aggregations                  |
| Narrative panel                         | **Yes** — attached AI narrative; ReportRun not mutated             |
| Delivery panel                          | **Yes** — existing delivery outcome; page does not send            |
| History                                 | **Yes** — same ReportRun list, newest first                        |
| Export projection (JSON)                | **Yes** — existing aggregations only; labeled not PDF / not ledger |
| Empty / loading / errors                | **Yes**                                                            |
| Generate new report type / PDF / ledger | **Absent**                                                         |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                  |
| ----------------------------------------- | -------- | --------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No PDF engine, no generate POST, no Notification settings |
| Never expose disabled production buttons  | **PASS** | No send/retry/force                                       |
| Never expose “Coming Soon”                | **PASS** | Reporting UI contains none                                |
| Never expose placeholder pages            | **PASS** | Home / history / detail call real REST                    |
| Hide unfinished functionality             | **PASS** | PC-06 / PC-17 stay out of this page as products           |
| Navigation represents actual capabilities | **PASS** | Reporting is operable today                               |
| Research-only tools clearly identified    | **PASS** | Copy states projection, not ledger SoT                    |
| Never imply Live Trading                  | **PASS** | Live mode is a labeled projection badge                   |

---

## Required UX surfaces

| Surface                      | Status                               |
| ---------------------------- | ------------------------------------ |
| Reporting Home               | Present at `/reporting`              |
| Report browser               | Present (list + search + filters)    |
| Detail page                  | Present at `/reporting/:reportRunId` |
| History                      | Present at `/reporting/history`      |
| Narrative panel              | Present on detail                    |
| Delivery panel               | Present on detail                    |
| Search                       | Present                              |
| Filters                      | Present (kind / status / mode)       |
| Empty state                  | Present                              |
| Loading                      | Present                              |
| Errors                       | Present                              |
| Export (existing capability) | Present as projection JSON           |

---

## What was not redesigned

- Reporting generation / kinds / metrics
- AI Analytics product (PC-17)
- Notification product (PC-06)
- Dashboard composition
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Reporting UX Audit.**
