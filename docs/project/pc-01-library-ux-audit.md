# PC-01 Strategy Library Product — Library UX Audit

**Package:** PC-01  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Strategy Library is a real customer product, distinct from research CRUD

This is not a visual redesign audit. The question is: **can the operator browse and inspect certified Library membership, and does every control do the job it claims?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                                     | Answer                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| Strategy Library nav                        | **Yes** — opens `/strategy-library` over Lookup                                  |
| Search                                      | **Yes** — filters listed Lookup records                                          |
| Membership filter                           | **Yes** — certified / deprecated / archived / uncertified / all via Lookup query |
| Version row                                 | **Yes** — opens immutable version detail                                         |
| Certification badge                         | **Yes** — Lookup membership / certification status                               |
| Eligibility badge                           | **Yes** — stored eligibility + live Eligibility port on detail                   |
| Envelope state                              | **Yes** — present or empty from Lookup                                           |
| Research strategies nav                     | **Yes** — US005 CRUD, labeled not Library                                        |
| Certify / Edit / Deploy / Deprecate buttons | **Absent** — write ports and later packages not exposed                          |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                |
| ----------------------------------------- | -------- | ------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No certify, Gate, deploy, or lifecycle writes           |
| Never expose disabled production buttons  | **PASS** | No unavailable danger controls                          |
| Never expose “Coming Soon”                | **PASS** | Library UI contains none                                |
| Never expose placeholder pages            | **PASS** | Browser and detail call real REST                       |
| Hide unfinished functionality             | **PASS** | PC-02 / PC-04 / PC-03 stay out of this page             |
| Navigation represents actual capabilities | **PASS** | Library and research CRUD are separate items            |
| Research-only tools clearly identified    | **PASS** | Research strategies copy + link to Library              |
| Never imply Live Trading                  | **PASS** | Paper-first shell; Library is membership, not live desk |

---

## Required UX surfaces

| Surface                        | Status                                       |
| ------------------------------ | -------------------------------------------- |
| Official Strategy Library page | Present at `/strategy-library`               |
| Library browser                | Family groups + version rows                 |
| Version history                | Versions listed under family                 |
| Certification badge            | Present                                      |
| Eligibility badge              | Present                                      |
| Envelope state                 | Present / empty                              |
| Filtering                      | Membership chips                             |
| Searching                      | Search field                                 |
| Read-only immutable versions   | Detail page; no edit                         |
| Deprecation state              | Membership filter + badge                    |
| Empty state                    | “No certified strategies in this workspace.” |
| Loading / error                | Present; mapped API errors                   |
| Legacy CRUD separated          | Research strategies page + nav label         |

---

## What was not redesigned

- Strategy Library domain / ports
- Runtime Enforcement
- Certification write flow
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Library UX Audit.**
