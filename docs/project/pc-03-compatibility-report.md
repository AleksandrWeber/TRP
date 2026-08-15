# PC-03 Deployment Product — Compatibility Report

**Package:** PC-03  
**Date:** 2026-08-15  
**Verdict:** Additive Deployment UI over existing REST. Library Lookup unchanged. Certification unchanged. Runtime Validation unchanged. Trading Session unchanged.

---

## REST

| Endpoint                                    | Compatibility                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `/v1/strategies`                            | Unchanged US005 CRUD                                                   |
| `GET /v1/strategy-library`                  | Unchanged Lookup (PC-01)                                               |
| `/v1/strategy-library/certifications`       | Unchanged Certification (PC-02)                                        |
| `/v1/runtime-validations`                   | Unchanged Gate pre-check (PC-04)                                       |
| `POST /v1/strategy-deployments`             | Existing create; optional `libraryEntryId` additive                    |
| `POST /v1/strategy-deployments/:id/approve` | Unchanged approve                                                      |
| `GET /v1/strategy-deployments`              | Unchanged list; product view adds `exchangeScopeId` / `libraryEntryId` |
| `GET /v1/strategy-deployments/:id`          | Unchanged get; same additive view fields                               |
| Session / paper start                       | Unchanged                                                              |

No new API version. No Deploy Engine path. `/production` remains retired.

---

## Frontend compatibility

| Path                                | Compatibility                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `/strategy-library`                 | Unchanged browser; Deployment link added                                           |
| `/strategy-library/:libraryEntryId` | Still read-only inspector; Create Deployment CTA added                             |
| `/runtime-validation`               | Unchanged inspector (still not a deploy page)                                      |
| `/runtime-validation/:validationId` | PASS result may link to the Deployment Wizard                                      |
| `/deployments`                      | **New** list                                                                       |
| `/deployments/new`                  | **New** wizard                                                                     |
| `/deployments/history`              | **New** history                                                                    |
| `/deployments/:deploymentId`        | **New** details                                                                    |
| Operator Shell bands                | Same Research / Paper trading / Administration frame; Deployment added to Research |
| Paper create `/trading/paper`       | Unchanged sandbox — still not certified session start                              |

---

## Downstream

- Library remains the Strategy SoT (PC-01). Certification still admits into it (PC-02).
- Runtime Validation remains the visible Gate (PC-04). Deployment still consumes it on create/approve.
- PC-11 Trading Orchestrator remains the next product. This package does not emit session handoff or start bots.
- Exchange Scope product (PC-12) is not this package. Create uses the existing Deployment default scope.

---

**End of Compatibility Report.**
