# PC-17 AI Analytics Product — Compatibility Report

**Package:** PC-17  
**Date:** 2026-08-16  
**Verdict:** Additive AI Analytics REST and UI. Research `/v1/ai/execute` unchanged. Knowledge Lake and Reporting product REST unchanged. No ownership transfer.

---

## REST

| Endpoint                           | Compatibility                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `POST /v1/ai/execute`              | Unchanged OpenRouter gateway (not RC-24 AI Analytics)                               |
| `GET /v1/ai-analytics`             | **New** — existing generation catalog over ReportRuns                               |
| `GET /v1/ai-analytics/:analysisId` | **New** — existing narrative + composed refs                                        |
| `POST /v1/ai-analytics/generate`   | **New** — existing `explain` / `summarize` / `identifyTrends` / `generateNarrative` |
| `GET /v1/ai-analytics/history`     | **New** — existing analyses ordered by `createdAt`                                  |
| `GET /v1/ai-analytics/provenance`  | **New** — existing modelMeta / sourceRefs                                           |
| `GET /v1/report-runs`              | Unchanged (PC-05)                                                                   |
| `GET /v1/knowledge-lake`           | Unchanged (PC-16)                                                                   |

No new API version. No renamed AI domain fields. No persistence write. No report / knowledge / notification / order write.

---

## Frontend compatibility

| Path                        | Compatibility                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `/ai-analytics`             | **New** AI Analytics Home                                                                     |
| `/ai-analytics/history`     | **New** history                                                                               |
| `/ai-analytics/:analysisId` | **New** narrative details                                                                     |
| `/ai`                       | **Unchanged** Implementation 016 OpenRouter gateway                                           |
| Operator Shell bands        | Same Research / Paper trading / Administration frame; AI Analytics added after Knowledge Lake |
| Home                        | Additive AI Analytics tile; AI tile still points at `/ai`                                     |

---

## Downstream

Knowledge Lake, Reporting, Notification, Strategy Library, Qualification, Profile, Market State, Deployment, and Trading Session remain owners of their artifacts. Connected panels are citations, not copies.

---

**End of Compatibility Report.**
