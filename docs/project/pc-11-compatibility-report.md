# PC-11 Trading Orchestrator Product — Compatibility Report

**Package:** PC-11  
**Date:** 2026-08-15  
**Verdict:** Additive Orchestrator UI and REST over existing ports. Library, Certification, Runtime Validation, Deployment, and Trading Session unchanged.

---

## REST

| Endpoint                              | Compatibility                                     |
| ------------------------------------- | ------------------------------------------------- |
| `/v1/strategies`                      | Unchanged US005 CRUD                              |
| `GET /v1/strategy-library`            | Unchanged Lookup (PC-01)                          |
| `/v1/strategy-library/certifications` | Unchanged Certification (PC-02)                   |
| `/v1/runtime-validations`             | Unchanged Gate pre-check (PC-04)                  |
| `/v1/strategy-deployments`            | Unchanged Deployment (PC-03)                      |
| `/v1/orchestrations/*`                | **New** transport for existing Orchestrator ports |
| Session / paper start                 | Unchanged                                         |

No new API version. No create-session path. `/production` remains retired.

---

## Frontend compatibility

| Path                          | Compatibility                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `/strategy-library`           | Unchanged                                                                            |
| `/runtime-validation`         | Unchanged                                                                            |
| `/deployments`                | Unchanged list; approved detail may link to Orchestrator                             |
| `/deployments/:deploymentId`  | Still Deployment owner; optional Orchestrate CTA                                     |
| `/orchestrator`               | **New** wizard                                                                       |
| `/orchestrator/plans`         | **New** plans                                                                        |
| `/orchestrator/plans/:planId` | **New** lifecycle / intent                                                           |
| `/orchestrator/history`       | **New** history                                                                      |
| `/orchestrator/runs/:runId`   | **New** lifecycle + handoff preview                                                  |
| Operator Shell bands          | Same Research / Paper trading / Administration frame; Orchestrator added to Research |
| Paper create `/trading/paper` | Unchanged sandbox — still not certified session start                                |

---

## Downstream

- Library remains the Strategy SoT (PC-01). Certification still admits into it (PC-02).
- Runtime Validation remains the visible Gate (PC-04). Orchestrator still consumes it on handoff.
- Deployment remains the bind workflow (PC-03). Orchestrator stores a bind ref only.
- PC-15 15-a remains the Session consumer of `SessionHandoffIntent`. This package does not start bots.
- Exchange Scope product (PC-12) is not this package. Create uses the existing paper scope id (`binance-spot`).

---

**End of Compatibility Report.**
