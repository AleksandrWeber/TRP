# V3-S02-b Product Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-b — Surface Coverage  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Master Plan outcomes owned by S02:** Admin assigns a role; operator cannot perform another role’s actions; J3-02  
**Outcomes owned by this slice:** every protected customer action uses the same permission model; unauthorized operators are denied before business logic  
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)  
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full RBAC Walkthrough (J3-02). This slice does not claim it. No visible UI changes shipped.

---

## 1. Customer receives

- Customer receives: consistent permission enforcement on every customer-visible HTTP action already in Version 2. A Reader cannot research or paper-trade. A Researcher can research and cannot issue paper commands. A Trader can issue paper commands and cannot administer roles. An Admin can administer the existing admin probe and still cannot start live or skip Gate/Risk.
- How they do it: no new UI. The existing signed-in product now fails closed on the server for the wrong role.
- Master Plan: Wave 1 / SEC-02 / SEC-03, **partial** (surface coverage). J3-02 People path is S02-c/d.

**Verdict (this slice):** **PASS**  
**Verdict (package Close):** **REQUIRES ACTION** — remaining S02 customer outcomes not shipped.

## 2. Customer does NOT receive

- Customer does NOT receive: People management UI; role assignment UI; workspace invitations; Credential Vault; Connection Management; exchange permissions; live trading authorization; last-Admin product.
- Owner later: S02-c … S02-e; S03; Wave 2; Wave 4; Wave 6; Wave 9.

**Verdict (this slice):** **PASS** — UI does not imply those capabilities.

## 3. Business value delivered

- Business value: privilege is no longer “signed in means allowed” on remaining HTTP. Operators with fixture roles already behave as the matrix says. Assignment in the product is still a later slice.
- Metric: time to register / login must not regress (Master Plan §6). Public C0 routes unchanged. Not re-timed in a live walkthrough in this task.
- Production-readiness residue: no People product (S02-d); no assignment API (S02-c).

**Verdict (this slice):** **PASS** for the coverage increment.

## 4. Customer journey impact

- Journey step(s) affected: after sign-in, who may research vs paper-command vs read projections is now enforced on HTTP, not only in the matrix unit tests.
- Journey steps explicitly unchanged: sign-in (S01); Researcher research/certify (C4 allowed); Trader/Admin paper commands (C5 allowed).
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S02-c Role assignment API**
- Next customer-visible capability after S02-c: Admin can persist a role without SQL
- Wave exit claimed? **No**
- Next package after S02 Close: V3-S03 — **not** unlocked yet

**Verdict:** **PASS**

## 6. Manual product walkthrough

This is not a unit test in intent. There is no People UI. The walkthrough is the permission model applied to real HTTP handlers (guard + metadata) and an HTTP probe (403/2xx).

```text
Surface Coverage Walkthrough (S02-b)

□ Reader blocked where expected
□ Researcher allowed only research actions
□ Trader allowed paper-trading actions
□ Admin allowed administration
□ Missing permission denied
□ Unknown permission denied
□ Public endpoints remain public

PASS
```

| Check                           | Verdict                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Walkthrough script exists       | **PASS** — artifact above                                                                                              |
| Executed in the product UI      | **NOT APPLICABLE** — this slice has no UI; executed via `surface-coverage.spec.ts` and `surface-coverage.http.spec.ts` |
| No SSH                          | **PASS**                                                                                                               |
| No customer `.env`              | **PASS**                                                                                                               |
| No manual database edits        | **PASS**                                                                                                               |
| Honest unavailable/error states | **PASS** — HTTP 403 on deny; public C0 still 200                                                                       |

**Walkthrough evidence:**

| Step                                 | Evidence                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Reader blocked where expected        | Reader certify / paper create → guard false; HTTP 403 on research and paper probes             |
| Researcher allowed only research     | Certify and research-control start allowed; paper create denied; HTTP 2xx research / 403 paper |
| Trader allowed paper-trading actions | Paper create allowed; `GET /auth/admin` denied; HTTP 2xx paper / 403 admin                     |
| Admin allowed administration         | `GET /auth/admin` allowed; live start denied; HTTP 2xx admin / 403 live                        |
| Missing permission denied            | Reader on qualification request (C4); unauthenticated research probe 403                       |
| Unknown permission denied            | Guard still denies `C99`; unknown role on research probe 403                                   |
| Public endpoints remain public       | Register/login/health/root allowed without a session                                           |

Overall:

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Walkthrough name        | Surface Coverage Walkthrough (S02-b) |
| Executed in the product | NOT APPLICABLE (no UI in this slice) |
| Overall                 | **PASS**                             |

## 7. UX reviewed

| Check                                                            | Verdict                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **NOT APPLICABLE** — no customer-facing copy added |
| Existing certified shell reused                                  | **PASS** — shell untouched                         |
| No live trading surfaced                                         | **PASS**                                           |
| No simulated Connected                                           | **PASS**                                           |
| Empty/error/unavailable states honest                            | **NOT APPLICABLE** — no new UI states              |
| Debug prefill forbidden                                          | **PASS** — login form untouched                    |

**UX notes:** No visible UI changes are required in this slice and none were made.

## 8. Documentation updated

| Check                                      | Verdict                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Slice reports exist                        | **PASS** — implementation, architecture, security, product, validation |
| Customer-facing help/runbook               | **NOT APPLICABLE** — no new journey                                    |
| Version 2 certification docs not rewritten | **PASS**                                                               |
| Master Plan not edited                     | **PASS**                                                               |
| No RC or ADR                               | **PASS**                                                               |

**Doc paths:** `docs/project/version-3/v3-s02-b-*.md`

---

## Product Principles

| Principle                    | How this slice respects it                                             | Verdict  |
| ---------------------------- | ---------------------------------------------------------------------- | -------- |
| Customer First               | Wrong-role actions fail in the product HTTP, not only in a policy file | **PASS** |
| Security Before Convenience  | Unclassified deny; no C10 invented to keep old allow-by-omission       | **PASS** |
| One Source of Truth          | Identity role; Workspace membership; Authz decides only                | **PASS** |
| Paper First                  | Paper commands stay Trader/Admin; live mutations denied                | **PASS** |
| Live Must Be Earned          | C7 denied                                                              | **PASS** |
| Honest Product               | No People UI theater; public routes remain listed public               | **PASS** |
| AI Never Controls Capital    | AI HTTP is research, not capital                                       | **PASS** |
| Everything Is Auditable      | Structured deny reasons unchanged; audit product is S05                | **PASS** |
| No Hidden Configuration      | Classification is not a customer `.env`                                | **PASS** |
| Architecture Is a Constraint | Auth extended; controllers stay transport                              | **PASS** |

---

**STOP.** Wait for Product Owner review before beginning V3-S02-c Role Assignment API.

**End of S02-b Product Review.**
