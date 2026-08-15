# PC-15 Slice 15-a — Compatibility Report

**Package:** PC-15 slice 15-a  
**Date:** 2026-08-15  
**Verdict:** Additive consume on existing Session create. Orchestrator, Deployment, Runtime, and Trading Session domain unchanged.

---

## REST

| Endpoint                                      | Compatibility                                      |
| --------------------------------------------- | -------------------------------------------------- |
| `POST /v1/orchestrations/runs/:runId/handoff` | Unchanged emit                                     |
| `GET /v1/orchestrations/handoffs/:id`         | Unchanged; `createsSession: false`                 |
| `POST /v1/trading-sessions`                   | Existing create; optional `sessionHandoffIntentId` |
| `GET /v1/trading-sessions/:id`                | Additive `sessionHandoff` consume projection       |
| `POST /v1/trading-sessions/:id/start`         | Unchanged                                          |
| `/v1/strategy-deployments`                    | Unchanged (PC-03)                                  |
| `/v1/runtime-validations`                     | Unchanged (PC-04)                                  |

No new API version. No Orchestrator create-session path. `/production` remains retired.

---

## Frontend compatibility

| Path                           | Compatibility                                                   |
| ------------------------------ | --------------------------------------------------------------- |
| `/orchestrator`                | Unchanged wizard; still no Start session                        |
| `/command-center`              | Unchanged console; new sessions appear in the existing list     |
| `/command-center/new`          | Existing wizard may pass `sessionHandoffIntentId`               |
| `/command-center/sessions/:id` | Existing detail; prefers server consume projection when present |
| Operator Shell bands           | Unchanged                                                       |

---

## Downstream

- Trading Session remains Session owner.
- Orchestrator `createsSession` remains false.
- PC-15 15-b (Qualification → Profile) is not this slice.
- Orders / Execution / Risk remain unwired.

---

**End of Compatibility Report.**
