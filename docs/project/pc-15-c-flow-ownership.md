# PC-15 Slice 15-c — Flow Ownership

**Package:** PC-15 slice 15-c  
**Date:** 2026-08-15

This slice does not transfer ownership. It names who produces, who consumes, and who remains SoT.

---

## Certified Reporting → AI flow (15-c)

| Step                             | Owner                   | Role                                     |
| -------------------------------- | ----------------------- | ---------------------------------------- |
| Request ReportRun                | Reporting               | Producer                                 |
| Store run + aggregations         | Reporting               | Report owner                             |
| Read completed run               | Product-flow adapter    | Consumer wiring (not a BC)               |
| Generate Analytical Narrative    | AI Analytics            | Narrative owner                          |
| Attach narrative to ReportRun    | Product-flow projection | Attachment only (`reportMutated: false`) |
| Expose narrative to Reporting UI | Product-flow projection | Not ReportRun SoT                        |
| Preserve ReportRun               | Reporting               | Immutable records                        |
| Lake reads                       | Reporting               | Read-only; Lake unchanged                |

---

## Invariants

| Invariant                          | Status   |
| ---------------------------------- | -------- |
| Reporting is the sole report owner | **Held** |
| AI is narrative only               | **Held** |
| AI never owns ReportRuns           | **Held** |
| Reporting never owns narratives    | **Held** |
| Lake unchanged                     | **Held** |
| No new SoT                         | **Held** |
| No AI decisions / trade authority  | **Held** |
| Narratives remain deterministic    | **Held** |

---

## Not this slice

- Qualification → Profile (15-b, already Closed)
- Reporting → Notification (15-d)
- Notification → Channels (15-e)
- Dashboard tiles (15-f)
- PC-05 Reporting product UI
- PC-17 AI Analytics product UI

---

**End of Flow Ownership.**
