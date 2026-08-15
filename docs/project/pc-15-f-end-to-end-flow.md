# PC-15 Slice 15-f — End-to-End Flow

**Package:** PC-15 slice 15-f  
**Date:** 2026-08-15

---

## Certified operator projection path

```text
Existing product flows (15-a … 15-e)
  → owners record Session / ReportRun / Narrative / Delivery / Profile
  → OperatorProjectionService reads those owners
  → OperatorDashboardView (in-process Dashboard)
  → Command Center GET /v1/trading-sessions/:id
       latestReport + delivery + existing lifecycle/runtime
  → Session detail / inspector render projections
  → Home shows paper session count + runtime health from existing APIs
```

---

## Honest empty path

```text
Session with no ReportRun
  → latestReport: null
  → delivery: null
  → UI: "No report run for this session yet."
       "No delivery recorded for this session yet."
  → not Coming Soon, not a fake tile, not /reports
```

---

## What the projection does not do

```text
projectDashboard / projectSession
  ↛ deliver()
  ↛ requestReportRun()
  ↛ Session create
  ↛ Profile publish
  ↛ new REST resource
```

---

## Composed with 15-a … 15-e

```text
15-a Session exists
15-c Narrative attached (projection)
15-d/15-e Delivery recorded (skipped or delivered)
15-b Profile latest if qualification target is parseable
  → 15-f Dashboard / Command Center reflect those facts
```

---

**End of End-to-End Flow.**
