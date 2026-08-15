# PC-03 Deployment Product — Deployment UX Audit

**Package:** PC-03  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Deployment is a real customer product over the existing Strategy Deployment workflow

This is not a visual redesign audit. The question is: **can the operator create, view, approve, observe status, read history, and see Runtime Validation result, Library Version, and metadata — and does every control do the job it claims?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                             | Answer                                                             |
| ----------------------------------- | ------------------------------------------------------------------ |
| Deployment nav                      | **Yes** — opens `/deployments` over existing REST                  |
| Create Deployment                   | **Yes** — wizard → `POST /v1/strategy-deployments`                 |
| Select Library Version              | **Yes** — lists certified Lookup versions                          |
| Envelope point                      | **Yes** — instrument / timeframe from the Library envelope         |
| Confirm create                      | **Yes** — creates a draft; copy states it does not start a session |
| Progress                            | **Yes** — in-flight copy while create runs                         |
| List / history                      | **Yes** — workspace Deployments with status                        |
| Details                             | **Yes** — metadata, Library Version, Gate stamp                    |
| Approve                             | **Yes** — `POST .../approve` on drafts only                        |
| Start session / auto-deploy / Force | **Absent**                                                         |

---

## Policy rules

| Rule                                      | Result   | Evidence                                               |
| ----------------------------------------- | -------- | ------------------------------------------------------ |
| Never expose unavailable functionality    | **PASS** | No session start, Orchestrator, or live capital        |
| Never expose disabled production buttons  | **PASS** | No unavailable danger controls                         |
| Never expose “Coming Soon”                | **PASS** | Deployment UI contains none                            |
| Never expose placeholder pages            | **PASS** | Wizard / list / history / details call real REST       |
| Hide unfinished functionality             | **PASS** | PC-11 / certified session start stay out               |
| Navigation represents actual capabilities | **PASS** | Deployment is operable today                           |
| Research-only tools clearly identified    | **PASS** | Paper Deployment; Paper Bots remain sandbox            |
| Never imply Live Trading                  | **PASS** | Paper-first shell; paper configuration identities only |

---

## Required UX surfaces

| Surface                   | Status                                  |
| ------------------------- | --------------------------------------- |
| Deployment Wizard         | Present at `/deployments/new`           |
| Deployment list           | Present at `/deployments`               |
| Deployment details        | Present at `/deployments/:deploymentId` |
| Deployment history        | Present at `/deployments/history`       |
| Deployment metadata       | Present on details                      |
| Runtime Validation result | Present (Gate stamp on the Deployment)  |
| Library Version           | Present on list, history, and details   |

---

## What was not redesigned

- Strategy Deployment domain / approval freeze
- Runtime Enforcement Gate
- Strategy Library domain / Lookup browser
- Trading Session / Paper Bots sandbox
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Deployment UX Audit.**
