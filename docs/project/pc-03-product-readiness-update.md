# PC-03 Deployment Product — Product Readiness Update

**Date:** 2026-08-15  
**Planning freeze (unchanged):** [Product Completion Readiness Report](./product-completion-readiness-report.md)  
**This document:** Implementation outcome for PC-03. It does not reopen planning. It does not amend Spec v2.0, the Authority Matrix, or the Alias Dictionary.

Audit baselines remain the 2026-08-14 Product Readiness Audit. Overall Product Readiness after Wave A / PC-01 / PC-02 / PC-04 was **58%**. This package does **not** invent a new overall percentage.

---

## Product Readiness Delta

| Surface                               | Before package                         | After package                                    |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| **Deployment Product**                | 0% (REST existed; no customer product) | **100%** of declared PC-03 scope                 |
| **Runtime Validation Product**        | 100% (PC-04)                           | **100%** (unchanged)                             |
| **Certification Product**             | 100% (PC-02)                           | **100%** (unchanged)                             |
| **Strategy Library Product**          | 100% (PC-01)                           | **100%** (unchanged)                             |
| **Identity Product**                  | 100% (PC-18)                           | **100%** (unchanged)                             |
| **Operator Shell Product**            | 100% of declared PC-19 scope           | **100%** (Deployment nav added inside the shell) |
| **Workspace Management**              | 100% of declared PC-14 scope           | **100%** (unchanged)                             |
| **Overall Product Readiness**         | 58%                                    | **58%** (unchanged until reviewer scores)        |
| **Journey J-01**                      | Complete                               | **Complete**                                     |
| **Journey J-02**                      | Complete                               | **Complete**                                     |
| **Journey J-04**                      | Complete                               | **Complete**                                     |
| **Journey J-05**                      | Complete                               | **Complete**                                     |
| **Journey J-06**                      | Complete                               | **Complete**                                     |
| **Journey J-07 Deployment**           | Blocked / Not Started                  | **Complete**                                     |
| **Journey J-08 Trading Orchestrator** | Not Started                            | **Not Started** (next canonical blocker)         |

---

## Product Capability Matrix

| Capability                       | Before PC-03     | After PC-03          |
| -------------------------------- | ---------------- | -------------------- |
| Create Deployment                | No (REST only)   | **Yes**              |
| View Deployment                  | No               | **Yes**              |
| Approve Deployment               | No (REST only)   | **Yes**              |
| Observe Deployment status        | No               | **Yes**              |
| Read Deployment history          | No               | **Yes**              |
| View Runtime Validation result   | No on Deployment | **Yes** (Gate stamp) |
| View Library Version             | No on Deployment | **Yes**              |
| View Deployment metadata         | No               | **Yes**              |
| Start certified paper session    | No               | No — PC-11 / PC-15   |
| Automatic deploy / Deploy Engine | No               | **Still no**         |

---

## New customer capabilities

- Create a paper Deployment from a certified Library Version
- Approve and freeze the Deployment
- See status, history, metadata, Library Version, and Gate result

---

## Remaining blockers

Wave C began with this package. The canonical loop is now **Blocked at Trading Orchestrator**.

- Trading Orchestrator (PC-11) — next after review
- Certified session start (PC-15 15-a), Reporting, and the rest of J-08…J-14

---

## Wave Progress

| Wave                   | Status                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| A — Trust and shell    | Closed (PC-18, PC-19, PC-14)                                                                |
| B — Strategy admission | Closed (PC-01, PC-02, PC-04)                                                                |
| C — begins             | **PC-03 Closed (review).** Market-context packages (PC-12, PC-08, PC-09, PC-10) not started |
| D–F                    | Not started (PC-11 wait for review)                                                         |

---

## Canonical Journey Progress

```text
Login ✓ → Workspace ✓ → Research ✓ → Certification ✓ → Strategy Library ✓
  → Runtime Validation ✓ → Deployment ✓ → Trading Orchestrator ✗ → …
```

J-07 Complete. Next operable step is J-08 Trading Orchestrator (PC-11). Certified paper session start remains later.

---

## Verdict

**PC-03 CLOSED** (pending review). Deployment is a customer product. Deployment remains the workflow owner.

| Question                                                     | Answer                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Is planning still closed?                                    | **Yes.**                                                       |
| Did PC-03 change Spec / Authority Matrix / Alias Dictionary? | **No.**                                                        |
| Did Deployment ownership move?                               | **No.**                                                        |
| New SoT / domain / Deploy Engine?                            | **No.**                                                        |
| Deployment declared scope                                    | **100%**                                                       |
| Overall Product Readiness                                    | **58%** (not re-scored here)                                   |
| Live Trading implied?                                        | **No.**                                                        |
| May PC-11 begin?                                             | **After review of PC-03.** Do not start PC-11 in this package. |

---

## Product slice (what moved)

| Before PC-03                                            | After PC-03                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Strategy Deployment REST existed; `/production` retired | Same owner + customer wizard / list / details / history                  |
| Canonical journey hard-stopped at Deployment            | User can create, view, approve, and inspect a paper Deployment           |
| Paper Bots looked like the only path                    | Sandbox remains; certified bind is now a product. Session start is later |

---

**End of Product Readiness Update.**
