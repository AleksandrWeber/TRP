# PC-11 Trading Orchestrator Product — Orchestrator UX Audit

**Package:** PC-11  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

**Yes** for every control this package ships.

---

## Surfaces

| Surface                           | Policy check                                    | Result   |
| --------------------------------- | ----------------------------------------------- | -------- |
| Research nav **Orchestrator**     | User can request coordination today             | **PASS** |
| Wizard                            | Plan → selection → handoff intent. Paper only   | **PASS** |
| Plans / lifecycle                 | Existing plan domain, visible                   | **PASS** |
| Handoff preview                   | Shows `createsSession: false`. No Start session | **PASS** |
| History                           | Existing run list                               | **PASS** |
| Approved Deployment CTA           | Orchestrates a bind the user already has        | **PASS** |
| Hide unfinished functionality     | PC-13 / certified session start stay out        | **PASS** |
| Never Coming Soon                 | Absent                                          | **PASS** |
| Never Live Trading                | Product DTO rejects `live`; UI is paper         | **PASS** |
| Never disabled production buttons | No unavailable emergency / start-bot control    | **PASS** |

---

## Explicit absences (correct)

- No Start session / Create Bot on this page (PC-15 / PC-13)
- No order ticket
- No risk approval
- No Gate override
- No live mode picker

---

**End of Orchestrator UX Audit.**
