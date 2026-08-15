# PC-02 Certification Product — Compatibility Report

**Package:** PC-02  
**Date:** 2026-08-15  
**Verdict:** Additive Certification REST and UI. Library Lookup unchanged except that successful certify now fills membership. Legacy `/strategies` unchanged. Runtime and Deployment unchanged.

---

## REST

| Endpoint                                             | Compatibility                                  |
| ---------------------------------------------------- | ---------------------------------------------- |
| `/v1/strategies`                                     | Unchanged US005 CRUD                           |
| `GET /v1/strategy-library`                           | Unchanged Lookup (PC-01)                       |
| `POST /v1/strategy-library/certifications`           | **New** — certify command                      |
| `GET /v1/strategy-library/certifications`            | **New** — history                              |
| `GET /v1/strategy-library/certifications/:attemptId` | **New** — status / result / reasons / metadata |

No new API version. No renamed Library domain fields. `/strategies` is not an alias of Certification or Library.

---

## Frontend compatibility

| Path                                          | Compatibility                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `/strategies`                                 | Still research CRUD; now offers a Certify link into the wizard                  |
| `/strategy-library`                           | Unchanged browser; Certify and History CTAs added                               |
| `/strategy-library/:libraryEntryId`           | Still read-only immutable inspector (no recertify)                              |
| `/strategy-library/certify`                   | **New** wizard                                                                  |
| `/strategy-library/certifications`            | **New** history                                                                 |
| `/strategy-library/certifications/:attemptId` | **New** result                                                                  |
| Operator Shell bands                          | Same Research / Paper trading / Administration frame; Certify added to Research |

---

## Downstream

- Library remains the landing catalog (PC-01). Certification admits into it.
- PC-04 Runtime Validation continues to consume Lookup / Eligibility in-process. Not started.
- Deployment (PC-03) is unchanged and still not a customer product.

---

**End of Compatibility Report.**
