# PC-17 AI Analytics Product — Product Surface

**Package:** PC-17  
**Date:** 2026-08-16

AI Analytics is now a customer product: operators generate and inspect existing narratives from existing products. The current AI Analytics implementation remains the only narrative owner.

---

## Operator path

```text
Research
  ↓
AI Analytics Home
  ↓
Generate / Analysis Browser
  ↓
Narrative details
  ├── Recommendations
  ├── Insights
  ├── Reasoning
  ├── Source viewer
  ├── Provenance
  ├── History (workspace)
  ├── Knowledge references
  ├── Report references
  ├── Strategy references
  └── Comparison view (when two reports are compared)
```

Generation is from existing ReportRuns. There is no manual AI authoring.

## HTTP

Transport only. Delegates to `AIAnalyticsPort.explain` / `summarize` / `identifyTrends` / `generateNarrative`. Extra filters (`q`, `libraryEntryId`) are applied to existing generation results. Provenance and recommendations are derived from the narrative. Knowledge, report, and strategy panels are existing owner reads. Comparison consumes Reporting `compareRuns` plus two narratives.

## Not this product

| Item                  | Owner / later package       |
| --------------------- | --------------------------- |
| OpenRouter AI gateway | `/ai` · `/v1/ai/execute`    |
| Report generation     | Reporting                   |
| Knowledge editing     | Forbidden                   |
| Strategy editing      | Strategy Library            |
| Notification sending  | Notification (PC-06 / 15-d) |
| Product UX polish     | PC-20                       |

---

**End of Product Surface.**
