# PC-17 AI Analytics Product — System Boundaries

**Package:** PC-17  
**Date:** 2026-08-16  
**Verdict:** Boundaries held. No new SoT. No ownership changes. No dependency cycles.

---

## AI Analytics

AI Analytics remains narrative owner. The product adapter generates through `AIAnalyticsPort` only. It does not persist. It does not add storage. Domain `rest: false` / `persistence: false` are unchanged. HTTP lives in sibling `ai-analytics-product`. AI Analytics does not import Knowledge Lake, Strategy Library, Notification, or the product adapter.

## Knowledge Lake

Knowledge Lake remains warehouse owner. Cited facts are `KnowledgeLakeQueryPort.getByEventId`. The adapter does not call `admit`. Knowledge Lake does not import the product adapter.

## Reporting

Reporting remains report owner. Analyses are generated from existing ReportRuns. Comparison uses existing `compareRuns`. The adapter does not call `requestReportRun`. Reporting does not import the product adapter.

## Notification

Notification remains delivery owner. PC-17 does not send notifications.

## Trading

Orders, Risk, Execution, Trading Session, and Strategy Deployment remain owners. Session and deployment appear only as citations. No trading decisions. No order generation.

## Research AI gateway

`/ai` and `/v1/ai/execute` remain the OpenRouter gateway. They are not this product.

---

**End of System Boundaries.**
