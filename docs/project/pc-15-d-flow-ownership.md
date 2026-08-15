# PC-15 Slice 15-d — Flow Ownership

**Package:** PC-15 slice 15-d  
**Date:** 2026-08-15

This slice does not transfer ownership. It names who produces, who consumes, and who remains SoT.

---

## Certified Reporting → Notification flow (15-d)

| Step                         | Owner                   | Role                                     |
| ---------------------------- | ----------------------- | ---------------------------------------- |
| Request ReportRun            | Reporting               | Producer                                 |
| Store run + aggregations     | Reporting               | Report owner                             |
| Read completed run           | Product-flow adapter    | Consumer wiring (not a BC)               |
| `deliver()`                  | Notification Delivery   | Delivery owner                           |
| Apply routing rules          | Notification Delivery   | Existing routing                         |
| Evaluate channel eligibility | Notification Delivery   | Existing catalog / prefs / connect state |
| Record DeliveryResult        | Notification Delivery   | Delivery projection SoT                  |
| Expose delivery to later UI  | Product-flow projection | Not ReportRun SoT                        |
| Preserve ReportRun           | Reporting               | Immutable records                        |

---

## Invariants

| Invariant                                  | Status   |
| ------------------------------------------ | -------- |
| Reporting is the sole report owner         | **Held** |
| Notification Delivery is delivery only     | **Held** |
| Notification never owns reports            | **Held** |
| Notification never generates reports       | **Held** |
| No scheduler / cron / retries              | **Held** |
| No delivery authority                      | **Held** |
| No Email / Slack / Telegram Bot activation | **Held** |
| No new SoT                                 | **Held** |

---

## Not this slice

- Reporting → AI (15-c, already Closed)
- Notification → Channels / Telegram adapter path (15-e)
- Dashboard tiles (15-f)
- PC-05 Reporting product UI
- PC-06 Notification product UI
- PC-07 Telegram product UI

---

**End of Flow Ownership.**
