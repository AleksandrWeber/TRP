# PC-04 Runtime Validation Product — Runtime Validation UX Audit

**Package:** PC-04  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — Runtime Validation is a real customer product over the existing Gate

This is not a visual redesign audit. The question is: **can the operator run validation, see progress, PASS / FAIL, deterministic reasons, Strategy Version, timestamp, and history — and does every control do the job it claims?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Control                      | Answer                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Runtime Validation nav       | **Yes** — opens the inspector over `POST /v1/runtime-validations`              |
| Select Strategy Version      | **Yes** — lists Library versions from Lookup; does not claim they are deployed |
| Run validation               | **Yes** — calls the existing Gate; purpose is pre-check `deployment_bind`      |
| Progress                     | **Yes** — in-flight copy while the command runs (command is synchronous)       |
| PASS / FAIL                  | **Yes** — outcome from EnforcementDecision                                     |
| Deterministic reasons        | **Yes** — locked RC-23 catalog, presented as labels                            |
| Strategy Version + timestamp | **Yes** — snapshot + `checkedAt`                                               |
| History                      | **Yes** — lists Gate invocations for the workspace                             |
| Read-only details            | **Yes** — no edit, no override                                                 |
| Deploy / Force / Coming Soon | **Absent**                                                                     |

---

## Policy rules

| Rule                                      | Result   | Evidence                                          |
| ----------------------------------------- | -------- | ------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | No Deploy, session start, or Orchestrator         |
| Never expose disabled production buttons  | **PASS** | No unavailable danger controls                    |
| Never expose “Coming Soon”                | **PASS** | Validation UI contains none                       |
| Never expose placeholder pages            | **PASS** | Page / history / result call real REST            |
| Hide unfinished functionality             | **PASS** | PC-03 stays out of this page                      |
| Navigation represents actual capabilities | **PASS** | Runtime Validation is operable today              |
| Research-only tools clearly identified    | **PASS** | Gate is labeled a pre-check, not deploy           |
| Never imply Live Trading                  | **PASS** | Paper-first shell; validation does not start live |

---

## Required UX surfaces

| Surface                      | Status                                    |
| ---------------------------- | ----------------------------------------- |
| Validation page              | Present at `/runtime-validation`          |
| Validation progress          | Present while POST is in flight           |
| PASS / FAIL indicator        | Present on result and history             |
| Deterministic reasons        | Present on FAIL (and listed when present) |
| Affected Strategy Version    | Present on result and history             |
| Validation timestamp         | Present (`checkedAt`)                     |
| Validation history           | Present at `/runtime-validation/history`  |
| Read-only validation details | Present on result                         |

---

## What was not redesigned

- Runtime Enforcement Gate / reason catalog
- Strategy Library domain / Lookup browser
- Deployment / Sessions
- Header / main `max-w-6xl` frame
- Research / Paper trading / Administration bands

---

**End of Runtime Validation UX Audit.**
