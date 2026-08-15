# PC-15 Slice 15-b — Flow Ownership

**Package:** PC-15 slice 15-b  
**Date:** 2026-08-15

This slice does not transfer ownership. It names who produces, who consumes, and who remains SoT.

---

## Certified Qualification → Profile flow (15-b)

| Step                            | Owner                | Role                       |
| ------------------------------- | -------------------- | -------------------------- |
| Request / confirm Qualification | Market Qualification | Producer                   |
| Complete / fail / cancel        | Market Qualification | Producer (owner)           |
| Read completed run              | Product-flow adapter | Consumer wiring (not a BC) |
| Publish profile version         | Market Profile       | Profile owner              |
| Serve latest / history          | Market Profile       | Query + consumer read      |
| Preserve Qualification history  | Market Qualification | Immutable run records      |
| Preserve prior Profile versions | Market Profile       | Append-only versions       |

---

## Invariants

| Invariant                                     | Status   |
| --------------------------------------------- | -------- |
| Qualification is the sole qualification owner | **Held** |
| Profile is the sole profile-version owner     | **Held** |
| Qualification never imports Profile           | **Held** |
| Profile never owns Qualification              | **Held** |
| Profile versions remain immutable             | **Held** |
| No new SoT                                    | **Held** |
| No scoring / new profile calculations         | **Held** |
| No new authority                              | **Held** |

---

## Not this slice

- Orchestrator → Session (15-a, already Closed)
- Reporting → AI (15-c)
- Reporting → Notification (15-d)
- Notification → Channels (15-e)
- Dashboard tiles (15-f)
- PC-08 Qualification product UI
- PC-09 Market Profile product UI

---

**End of Flow Ownership.**
