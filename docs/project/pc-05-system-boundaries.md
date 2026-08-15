# PC-05 Reporting Product — System Boundaries

**Package:** PC-05  
**Date:** 2026-08-15  
**Verdict:** Boundaries held.

---

## Reporting

Reporting remains the report owner. The product adapter lists and reads `ReportDefinition`, `ReportRun`, and `AggregationSlice` through `ReportingQueryPort`. It does not call `requestReportRun`. It does not add kinds, metrics, or storage.

The Reporting bounded context still does not import AI Analytics, Notification Delivery, or product-flow. Domain `rest: false` is unchanged. HTTP lives in sibling `reporting-product`.

## AI Analytics

AI remains narrative only. Detail reads the existing attached narrative via PC-15 `getAttachedNarrative`. Reporting does not own narrative text. ReportRun is not mutated (`reportMutated: false`). PC-17 product UI is not this package.

## Notification Delivery

Notification remains delivery only. List and detail read existing `listDeliveries`. The product adapter does not call `deliver()`, connect Telegram, or change preferences. PC-06 product UI is not this package.

## Dashboard

Dashboard remains projection. PC-15 15-f composition is unchanged. This package does not add a Dashboard report engine.

## Distinct surfaces

Research `/v1/reports` and `/reports` remain a different slice. RC-24 product paths are `/v1/report-runs` and `/reporting`.

---

**End of System Boundaries.**
