# PC-16 Knowledge Lake Product — System Boundaries

**Package:** PC-16  
**Date:** 2026-08-16  
**Verdict:** Boundaries held. No new SoT. No ownership changes. No dependency cycles.

---

## Knowledge Lake

Knowledge Lake remains the warehouse owner. The product adapter lists and reads `AnalyticalFact` through `KnowledgeLakeQueryPort`. It does not call `admit`. It does not add storage, indexes, or semantic search. Domain query posture is unchanged. HTTP lives in sibling `knowledge-lake-product`. Knowledge Lake does not import the product adapter or Reporting.

## Reporting

Reporting remains report owner. Connected Reports are `ReportingQueryPort.listRuns` filtered by existing `lakeEventIds` / sourceRefs. The adapter does not call `requestReportRun`.

## AI Analytics

AI remains narrative only. Connected AI Narratives are references to Reporting detail (`authorsNarrative: false`). `generateNarrative` is not invoked. PC-17 product UI is not this package.

## Research

Research remains research owner. `/knowledge` and `/v1/knowledge` are unchanged. Lake does not absorb KnowledgeEntry / Insight / Recommendation.

## Strategy Library

Library remains membership SoT. Lookup is read-only for cited ids.

---

**End of System Boundaries.**
