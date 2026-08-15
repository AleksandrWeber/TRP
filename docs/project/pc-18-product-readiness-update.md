# PC-18 Identity Product — Product Readiness Update

**Date:** 2026-08-15  
**Planning freeze (unchanged):** [Product Completion Readiness Report](./product-completion-readiness-report.md)  
**This document:** Implementation outcome for PC-18. It does not reopen planning. It does not amend Spec v2.0, the Authority Matrix, or the Alias Dictionary.

Audit baselines remain the 2026-08-14 Product Readiness Audit. The scores below are the **current product** after PC-18 closed.

---

## Product Readiness Delta

| Surface                       | Before package | After package |
| ----------------------------- | -------------- | ------------- |
| **Identity Product**          | 18%            | **100%**      |
| **Overall Product Readiness** | 55%            | **58%**       |
| **Journey J-01**              | Blocked        | **Complete**  |

---

## New customer capabilities

- Persistent accounts
- Production login
- Restart-safe authentication

---

## Remaining blockers

The Identity door is open. The canonical loop is not.

- Workspace
- Strategy Library
- Reporting
- … (Operator Shell, Certification, and the rest of J-02…J-14)

Certified paper path remains **Blocked at Certification**. Next package after review: **PC-19 Operator Shell**.

---

## Verdict

**PC-18 CLOSED** (pending review). Identity is a durable customer-account product.

| Question                                                     | Answer                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| Is planning still closed?                                    | **Yes.**                                                       |
| Did PC-18 change Spec / Authority Matrix / Alias Dictionary? | **No.**                                                        |
| Is J-01 complete?                                            | **Yes.**                                                       |
| Identity Product score                                       | **100%** (was 18%)                                             |
| Overall Product Readiness                                    | **58%** (was 55%)                                              |
| May PC-19 begin?                                             | **After review of PC-18.** Do not start PC-19 in this package. |

---

## Product slice (what moved the score)

| Before PC-18                            | After PC-18                                     |
| --------------------------------------- | ----------------------------------------------- |
| Passwords in process-local memory       | Password hashes on existing `User.passwordHash` |
| Identity in process-local memory        | Identity profiles on existing `User` table      |
| Prefill `admin@trp.local`               | Empty professional sign-in / create-account     |
| Restart dropped users                   | Restart preserves users                         |
| Development bootstrap as the login path | Bootstrap unwired from the product              |

---

**End of Product Readiness Update.**
