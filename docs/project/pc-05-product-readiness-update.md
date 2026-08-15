# PC-05 Reporting Product — Product Readiness Update

**Date:** 2026-08-15  
**Planning freeze (unchanged):** [Product Completion Readiness Report](./product-completion-readiness-report.md)  
**This document:** Implementation outcome for PC-05. It does not reopen planning. It does not amend Spec v2.0, the Authority Matrix, or the Alias Dictionary.

Audit baselines remain the 2026-08-14 Product Readiness Audit. Overall Product Readiness after Wave A / B / PC-03 / PC-11 / PC-13 / PC-15 was **58%**. This package does **not** invent a new overall percentage.

---

## Product Readiness Delta

| Surface                          | Before package                        | After package                                                      |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Reporting Product (PC-05)**    | Not started (wiring only; no UI/REST) | **100%** of declared PC-05 scope                                   |
| **Command Center Product**       | 100% of declared PC-13 scope          | **100%** (ReportRun link added inside existing session projection) |
| **Operator Shell Product**       | 100% of declared PC-19 scope          | **100%** (Reporting nav added inside the shell)                    |
| **Notification Product (PC-06)** | Not started                           | **Not started**                                                    |
| **AI Analytics Product (PC-17)** | Not started                           | **Not started** (narratives visible inside Reporting)              |
| **Overall Product Readiness**    | 58%                                   | **58%** (unchanged until reviewer scores)                          |
| **Journey J-10 Reporting**       | Blocked / Not Started                 | **Complete**                                                       |
| **Journey J-11 AI Narrative**    | Not Started (wiring complete)         | **Not Started** (product UI; next value after J-10)                |
| **Journey J-12 Notification**    | Not Started                           | **Not Started** (next package after review)                        |

---

## Product Capability Matrix

| Capability                 | Before PC-05                           | After PC-05                 |
| -------------------------- | -------------------------------------- | --------------------------- |
| See existing ReportRuns    | No (in-process / dashboard tiles only) | **Yes**                     |
| Open report details        | No                                     | **Yes**                     |
| Read report metadata       | No                                     | **Yes**                     |
| Read AI narrative on a run | No product UI                          | **Yes** (inside Reporting)  |
| See delivery status        | No product UI                          | **Yes**                     |
| Search / filter runs       | No                                     | **Yes**                     |
| Report history             | No                                     | **Yes**                     |
| Export existing projection | No                                     | **Yes** (JSON aggregations) |
| Generate new report types  | No                                     | **Still no**                |
| PDF engine                 | No                                     | **Still no**                |
| Notification settings      | No                                     | No — PC-06                  |
| Standalone AI product      | No                                     | No — PC-17                  |

---

## New customer capabilities

- Work with Reporting as a product
- Browse, search, and filter existing ReportRuns
- Read narrative and delivery without leaving Reporting
- Export the existing aggregation projection

---

## Remaining blockers

Wave E continues. The canonical loop is now **Blocked at Notification** (J-12 / PC-06) for delivery configuration, with AI product UI (PC-17) still optional after J-10.

- Notification (PC-06) — next after review
- Telegram (PC-07)
- AI Analytics product UI (PC-17)
- Knowledge Lake product UI (PC-16)

---

## Wave Progress

| Wave                      | Status                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| A — Trust and shell       | Closed (PC-18, PC-19, PC-14)                                                                   |
| B — Strategy admission    | Closed (PC-01, PC-02, PC-04)                                                                   |
| C–D — Certified paper     | Closed (PC-03, PC-11, PC-13, PC-15 15-a/15-b)                                                  |
| E — Evidence and delivery | **PC-15 15-c … 15-f Closed. PC-05 Closed (review).** PC-06 / PC-07 / PC-17 / PC-16 not started |
| F — UX closeout           | Not started                                                                                    |

---

## Canonical Journey Progress

```text
Login ✓ → Workspace ✓ → Research ✓ → Certification ✓ → Strategy Library ✓
  → Runtime Validation ✓ → Deployment ✓ → Orchestrator ✓ → Session ✓
  → Reporting ✓ → AI Narrative ✗ → Notification ✗ → Telegram ✗ → Command Center ✓
```

J-10 Complete. Next operable product package after review is J-12 Notification (PC-06). J-11 AI product UI remains later (narratives are already visible on the report).

---

## Verdict

**PC-05 CLOSED** (pending review). Reporting is a customer product. Reporting remains the sole report owner.

| Question                                                     | Answer                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Is planning still closed?                                    | **Yes.**                                                       |
| Did PC-05 change Spec / Authority Matrix / Alias Dictionary? | **No.**                                                        |
| Did Reporting ownership move?                                | **No.**                                                        |
| New SoT / domain / report engine?                            | **No.**                                                        |
| Reporting declared scope                                     | **100%**                                                       |
| Overall Product Readiness                                    | **58%** (not re-scored here)                                   |
| Live Trading implied?                                        | **No.**                                                        |
| May PC-06 begin?                                             | **After review of PC-05.** Do not start PC-06 in this package. |

---

## Product slice (what moved)

| Before PC-05                                               | After PC-05                                          |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| ReportRuns existed in-process; `rest: false`; no RC-24 UI  | Same queries + HTTP `/v1/report-runs` + `/reporting` |
| Canonical journey hard-stopped at Reporting                | User can browse and read ReportRuns                  |
| Narratives and deliveries wired but invisible as a product | Visible on report detail                             |

---

**End of Product Readiness Update.**
