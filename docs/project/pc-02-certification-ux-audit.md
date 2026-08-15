# PC-02 Certification Product — Certification UX Audit

**Package:** PC-02  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Certification is a real customer product over the existing Library admit port

This is not a visual redesign audit. The question is: **can the operator submit a candidate for certification and see progress, result, history, reasons, and Library badges — and does every control do the job it claims?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                            | Answer                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Certify nav                        | **Yes** — opens the wizard over `POST /v1/strategy-library/certifications`                 |
| Wizard candidate step              | **Yes** — lists research strategies as candidates; does not claim they are Library members |
| Evidence checklist                 | **Yes** — required backtesting + walk-forward refs; optional types allowed by domain       |
| Confirm / submit                   | **Yes** — irreversible-admit copy; calls certify; `certifiedBy` is the signed-in operator  |
| Progress                           | **Yes** — in-flight copy while the command runs (command is synchronous)                   |
| Result                             | **Yes** — certified / rejected / conflict with reasons and metadata                        |
| History                            | **Yes** — lists certify attempts for the workspace                                         |
| View in Strategy Library           | **Yes** — opens the Lookup record; badges reflect certified membership                     |
| Gate / Deploy / Coming Soon        | **Absent**                                                                                 |
| Recertify / edit certified version | **Absent** on the immutable Library detail                                                 |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                      |
| ----------------------------------------- | -------- | ------------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No Gate, deploy, lifecycle writes, or Strategy Approval       |
| Never expose disabled production buttons  | **PASS** | No unavailable danger controls                                |
| Never expose “Coming Soon”                | **PASS** | Certification UI contains none                                |
| Never expose placeholder pages            | **PASS** | Wizard / history / result call real REST                      |
| Hide unfinished functionality             | **PASS** | PC-04 / PC-03 stay out of this page                           |
| Navigation represents actual capabilities | **PASS** | Certify is operable today                                     |
| Research-only tools clearly identified    | **PASS** | Candidates come from Research strategies                      |
| Never imply Live Trading                  | **PASS** | Paper-first shell; certify admits into Library, not live desk |

---

## Required UX surfaces

| Surface                          | Status                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| Certification Wizard             | Present at `/strategy-library/certify`                     |
| Certification status             | Present on result (`progress: complete` after command)     |
| Certification history            | Present at `/strategy-library/certifications`              |
| Failure reasons                  | Present on rejected / conflict attempts                    |
| Success summary                  | Present on certified attempts                              |
| Read-only certification metadata | Present on result                                          |
| Library badges after certify     | Lookup membership / certification / eligibility / envelope |

---

## What was not redesigned

- Strategy Library domain / Lookup browser
- Runtime Enforcement
- Deployment / Sessions
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Certification UX Audit.**
