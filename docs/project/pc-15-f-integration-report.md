# PC-15 Slice 15-f — Integration Report

**Package:** PC-15 slice 15-f  
**Date:** 2026-08-15  
**Verdict:** Existing owner reads compose into existing Dashboard and Command Center projections. No owner import reversal. No new SoT.

---

## Integration map

```text
15-a Session create
15-b Qualification → Profile
15-c ReportRun → generateNarrative()
15-d ReportRun → deliver()
15-e deliver() → channel adapters
        ↓
OperatorProjectionService (product-flow composition, not a BC)
        ↓
Dashboard projection (in-process OperatorDashboardView)
Command Center GET /v1/trading-sessions/:id (latestReport, delivery)
Home (existing listTradingSessions + getRuntimeHealth only)
```

---

## Direction

| From         | To                                                                          | Allowed?                                                      |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| product-flow | Reporting / Notification / AI / Session / Runtime / Qualification / Profile | Yes (composition)                                             |
| Reporting    | product-flow / Notification / AI                                            | **No**                                                        |
| Notification | product-flow / Reporting                                                    | **No**                                                        |
| product-flow | bot-facade                                                                  | **No** (avoids cycle; Command Center consumes the projection) |
| bot-facade   | product-flow                                                                | Yes (optional OperatorProjection on existing GET)             |

---

## What was not integrated

- No Reporting REST
- No Notification REST
- No new Dashboard HTTP resource
- No RCC `/dashboard` relabel
- No second Session store
- No re-call of `deliver()` from projections

---

**End of Integration Report.**
