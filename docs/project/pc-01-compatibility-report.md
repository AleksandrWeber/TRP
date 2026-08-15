# PC-01 Strategy Library Product — Compatibility Report

**Package:** PC-01  
**Date:** 2026-08-15  
**Verdict:** Additive Library REST and UI. Legacy `/strategies` unchanged. Operator Shell bands unchanged except the new official Library nav item.

---

## REST

| Endpoint                                                                | Compatibility                        |
| ----------------------------------------------------------------------- | ------------------------------------ |
| `/v1/strategies`                                                        | Unchanged US005 CRUD                 |
| `GET /v1/strategy-library`                                              | **New** — Lookup list                |
| `GET /v1/strategy-library/:libraryEntryId`                              | **New** — Lookup by id               |
| `GET /v1/strategy-library/families/:strategyFamilyId/versions/:version` | **New** — Lookup by family + version |
| `GET /v1/strategy-library/:libraryEntryId/eligibility`                  | **New** — Eligibility check          |

No new API version. No renamed Library domain fields. `/strategies` is not an alias of Library.

---

## Frontend compatibility

| Path                                | Compatibility                                        |
| ----------------------------------- | ---------------------------------------------------- |
| `/strategies`                       | Still research CRUD; copy states it is not Library   |
| `/strategy-library`                 | **New** official Library browser                     |
| `/strategy-library/:libraryEntryId` | **New** immutable version inspector                  |
| Operator Shell bands                | Same Research / Paper trading / Administration frame |
| `X-Workspace-Id`                    | Still injected by the Shared API Client              |

---

## Downstream

- PC-02 Certification will admit into this catalog. It must not invent a second Library.
- PC-04 Runtime Validation continues to consume Lookup / Eligibility in-process.
- Deployment and Orchestrator UIs may later read these facts; they must not copy SoT.

---

**End of Compatibility Report.**
