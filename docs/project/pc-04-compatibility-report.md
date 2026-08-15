# PC-04 Runtime Validation Product — Compatibility Report

**Package:** PC-04  
**Date:** 2026-08-15  
**Verdict:** Additive Runtime Validation REST and UI. Library Lookup unchanged. Certification unchanged. Deployment and Session unchanged.

---

## REST

| Endpoint                                    | Compatibility                             |
| ------------------------------------------- | ----------------------------------------- |
| `/v1/strategies`                            | Unchanged US005 CRUD                      |
| `GET /v1/strategy-library`                  | Unchanged Lookup (PC-01)                  |
| `/v1/strategy-library/certifications`       | Unchanged Certification (PC-02)           |
| `POST /v1/runtime-validations`              | **New** — `validateDeployment` pre-check  |
| `GET /v1/runtime-validations`               | **New** — history                         |
| `GET /v1/runtime-validations/:validationId` | **New** — PASS / FAIL / reasons / details |

No new API version. No renamed Enforcement domain fields. `/bots/.../enforce` is not used as SoT.

---

## Frontend compatibility

| Path                                | Compatibility                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `/strategy-library`                 | Unchanged browser; Runtime Validation CTA added                                            |
| `/strategy-library/:libraryEntryId` | Still read-only inspector; pre-check link added                                            |
| `/strategy-library/certify`         | Unchanged wizard                                                                           |
| `/runtime-validation`               | **New** validation page                                                                    |
| `/runtime-validation/history`       | **New** history                                                                            |
| `/runtime-validation/:validationId` | **New** result                                                                             |
| Operator Shell bands                | Same Research / Paper trading / Administration frame; Runtime Validation added to Research |
| Paper create `/trading/paper`       | Unchanged sandbox — still not certified deploy                                             |

---

## Downstream

- Library remains the Strategy SoT (PC-01). Certification still admits into it (PC-02).
- PC-03 Deployment remains the bind product. This package does not start sessions.
- Orchestrator is unchanged and still not a customer product.

---

**End of Compatibility Report.**
