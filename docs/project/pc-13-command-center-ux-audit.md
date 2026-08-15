# PC-13 Command Center Product — Command Center UX Audit

**Package:** PC-13  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

**Yes** for every control this package ships.

---

## Surfaces

| Surface                                            | Policy check                                                  | Result   |
| -------------------------------------------------- | ------------------------------------------------------------- | -------- |
| Paper trading nav **Command Center**               | User can operate paper sessions today                         | **PASS** |
| Create paper bot                                   | Approved Deployment → Paper Account → Session create/start    | **PASS** |
| Session list / Bot list                            | Existing `/v1/trading-sessions`                               | **PASS** |
| Pause / Resume / Stop                              | Existing Session commands                                     | **PASS** |
| Start on CREATED                                   | Existing Session start                                        | **PASS** |
| Health / runtime / Deployment / Orchestration refs | Reads existing owners; handoff shows `createsSession: false`  | **PASS** |
| Hide unfinished functionality                      | Emergency Controls stay hidden (no durable paper Kill Switch) | **PASS** |
| Never Coming Soon                                  | Absent                                                        | **PASS** |
| Never Live Trading                                 | Product DTO rejects `live`; UI is paper                       | **PASS** |
| Never disabled production buttons                  | No unavailable emergency danger zone                          | **PASS** |

---

## Explicit absences (correct)

- No Emergency Stop / Clear Kill Switch (live-only / unwired; UI Policy)
- No order ticket
- No risk approval
- No live mode picker
- No Orchestrator start-session (PC-15 15-a)
- Paper Bots `/trading/paper` remains labeled sandbox

---

**End of Command Center UX Audit.**
