# PC-15 Slice 15-a — Flow Ownership

**Package:** PC-15 slice 15-a  
**Date:** 2026-08-15

This slice does not transfer ownership. It names who produces, who consumes, and who remains SoT.

---

## Certified paper flow (15-a)

| Step                           | Owner                | Role                               |
| ------------------------------ | -------------------- | ---------------------------------- |
| Coordinate certified selection | Trading Orchestrator | Producer                           |
| Emit `SessionHandoffIntent`    | Trading Orchestrator | Producer (`createsSession: false`) |
| Read the intent                | Product-flow adapter | Consumer wiring (not a BC)         |
| Create paper Trading Session   | Trading Session      | Session owner                      |
| Start / pause / resume / stop  | Trading Session      | Session owner                      |
| Reflect the session            | Command Center       | Command UI + projection            |
| Preserve orchestration history | Trading Orchestrator | Immutable coordination store       |

---

## Invariants

| Invariant                                 | Status   |
| ----------------------------------------- | -------- |
| Trading Session is the sole Session owner | **Held** |
| Orchestrator `createsSession` is false    | **Held** |
| Orchestrator never imports Session        | **Held** |
| Intent remains immutable                  | **Held** |
| No new SoT                                | **Held** |
| No Orders / Execution / Risk approvals    | **Held** |

---

## Not this slice

- Qualification → Profile (15-b)
- Reporting → AI / Notification (15-c / 15-d)
- Notification → Channels (15-e)
- Dashboard tiles (15-f)

---

**End of Flow Ownership.**
