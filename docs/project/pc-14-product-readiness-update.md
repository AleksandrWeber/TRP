# PC-14 Workspace Management — Product Readiness Update

**Date:** 2026-08-15  
**Planning freeze (unchanged):** [Product Completion Readiness Report](./product-completion-readiness-report.md)  
**This document:** Implementation outcome for PC-14. It does not reopen planning. It does not amend Spec v2.0, the Authority Matrix, or the Alias Dictionary.

Audit baselines remain the 2026-08-14 Product Readiness Audit. Overall Product Readiness after PC-18 / PC-19 was **58%**. This package does **not** invent a new overall percentage.

---

## Product Readiness Delta

| Surface                       | Before package                                             | After package                              |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| **Workspace Management**      | Bootstrap-only (`POST /workspaces/bootstrap`; header name) | **100%** of declared PC-14 scope           |
| **Identity Product**          | 100% (PC-18)                                               | **100%** (unchanged)                       |
| **Operator Shell Product**    | 100% of declared PC-19 scope                               | **100%** (switcher added inside the shell) |
| **Overall Product Readiness** | 58%                                                        | **58%** (unchanged until reviewer scores)  |
| **Journey J-01**              | Complete                                                   | **Complete**                               |
| **Journey J-02**              | In Progress (bootstrap name only)                          | **Complete**                               |

---

## New customer capabilities

- Create a workspace
- Rename a workspace
- Archive a workspace
- Switch the active workspace
- See the current workspace
- Keep the selection across refresh
- Use the Operator Shell against the selected workspace

---

## Remaining blockers

Wave A (Identity, Operator Shell, Workspace) is complete for declared scope. The canonical loop is not.

- Strategy Library (PC-01)
- Reporting
- … (Certification and the rest of J-03…J-14)

Certified paper path remains **Blocked at Certification**. Next package after review: **PC-01 Strategy Library Product**.

---

## Verdict

**PC-14 CLOSED** (pending review). Workspace is a customer product, not a bootstrap artifact.

| Question                                                     | Answer                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Is planning still closed?                                    | **Yes.**                                                       |
| Did PC-14 change Spec / Authority Matrix / Alias Dictionary? | **No.**                                                        |
| Did Workspace ownership move?                                | **No.**                                                        |
| Did Identity start owning Workspace?                         | **No.**                                                        |
| New SoT / domain?                                            | **No.**                                                        |
| Workspace declared scope                                     | **100%**                                                       |
| Overall Product Readiness                                    | **58%** (not re-scored here)                                   |
| Live Trading implied?                                        | **No.**                                                        |
| May PC-01 begin?                                             | **After review of PC-14.** Do not start PC-01 in this package. |

---

## Product slice (what moved)

| Before PC-14                                      | After PC-14                                        |
| ------------------------------------------------- | -------------------------------------------------- |
| Only `POST /v1/workspaces/bootstrap`              | List / create / get / rename / archive + bootstrap |
| Header showed a bootstrap name                    | Switcher: list, create, rename, archive, switch    |
| Refresh re-bootstrapped to the earliest workspace | Persisted selection restored when still Active     |
| One implicit workspace                            | Multiple owned workspaces                          |

---

**End of Product Readiness Update.**
