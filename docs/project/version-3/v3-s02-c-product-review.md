# V3-S02-c Product Review

**Package:** V3-S02 RBAC Product
**Slice:** S02-c — Role Assignment API
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Master Plan outcomes owned by S02:** Admin assigns a role; operator cannot perform another role’s actions; J3-02
**Outcomes owned by this slice:** authorized administrators can change a user's role through the product API; the platform applies the new role immediately
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full RBAC Walkthrough (J3-02) in the People UI. This slice does not claim it. No visible UI changes shipped.

---

## 1. Customer receives

- Customer receives: an Administrator can assign Reader, Researcher, Trader, or Admin to an existing operator through the product API. The new role is in force immediately. A Reader or Trader cannot assign roles. An invalid role is refused. The last active Administrator cannot be removed by a role change.
- How they do it: no new UI in this slice. The signed-in Admin calls the People role API (the same API S02-d will project). No SSH, customer `.env`, or SQL.
- Master Plan: Wave 1 / SEC-02, **partial** (assignment API). J3-02 People path completes in **S02-d**.

**Verdict (this slice):** **PASS**
**Verdict (package Close):** **REQUIRES ACTION** — People UI and remaining S02 outcomes not shipped.

## 2. Customer does NOT receive

- Customer does NOT receive: People management UI; workspace invitations; workspace ownership transfer; Credential Vault; Connection Management; exchange permissions; live trading authorization; new roles; role hierarchy; disable-user; structured audit event product; authorization event log (S02-e).
- Owner later: S02-d (People UI); S02-e (events, horizontal suite); S03; Wave 2; Wave 4; Wave 6; Wave 9.

**Verdict (this slice):** **PASS** — API does not imply those capabilities. List/assign is not an invite product.

## 3. Business value delivered

- Business value: privilege can be granted and reduced in the product without sharing an Admin password or editing the database. Least privilege can be applied immediately.
- Metric: time to register / login must not regress (Master Plan §6). Register path unchanged. Not re-timed in a live walkthrough in this task.
- Production-readiness residue: no People UI (S02-d); no structured role-change log (S02-e); first Admin is still host bootstrap.

**Verdict (this slice):** **PASS** for the assignment increment.

## 4. Customer journey impact

- Journey step(s) affected: after sign-in, an Administrator can change who may research, paper-trade, or administer roles.
- Journey steps explicitly unchanged: sign-in (S01); Researcher research/certify; Trader/Admin paper commands; live still not a product.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S02-d People product**
- Next customer-visible capability after S02-d: Admin lists operators and assigns roles in the signed-in shell
- Wave exit claimed? **No**
- Next package after S02 Close: V3-S03 — **not** unlocked yet

**Verdict:** **PASS**

## 6. Manual product walkthrough

This is not a unit test in intent. There is no People UI. The walkthrough is the Role Assignment API on real HTTP (C6 + Identity).

```text
Role Assignment Walkthrough (S02-c)

□ Admin assigns a role
□ Role changes immediately
□ Unauthorized assignment denied
□ Invalid role rejected
□ Reader cannot assign
□ Trader cannot assign

PASS
```

| Check                           | Verdict                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Walkthrough script exists       | **PASS** — artifact above                                                                                       |
| Executed in the product UI      | **NOT APPLICABLE** — this slice has no UI; executed via `people.http.spec.ts` plus Identity persistence / `/me` |
| No SSH                          | **PASS**                                                                                                        |
| No customer `.env`              | **PASS**                                                                                                        |
| No manual database edits        | **PASS**                                                                                                        |
| Honest unavailable/error states | **PASS** — 401 / 403 / 400 / 404 / 409 with operator copy                                                       |

**Walkthrough evidence:**

| Step                           | Evidence                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Admin assigns a role           | PATCH `/v1/people/:userId/role` as Admin → 200; body shows Trader                               |
| Role changes immediately       | Identity `getById` is Trader; list contains the new role; `/me` returns Trader on the next call |
| Unauthorized assignment denied | Unauthenticated 401; Researcher 403                                                             |
| Invalid role rejected          | `{ role: "Superuser" }` → 400; Identity unchanged                                               |
| Reader cannot assign           | Reader PATCH → 403; Identity unchanged                                                          |
| Trader cannot assign           | Trader PATCH (including self → Admin) → 403; Trader GET list → 403                              |

Last-Admin (package done-when, not this walkthrough box): demote last Active Admin → 409; role remains Admin.

Overall:

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Walkthrough name        | Role Assignment Walkthrough (S02-c)  |
| Executed in the product | NOT APPLICABLE (no UI in this slice) |
| Overall                 | **PASS**                             |

## 7. UX reviewed

| Check                                                            | Verdict                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **PASS** — “User not found”; “Cannot change the last active Administrator.”; “Role is not recognized.” |
| Existing certified shell reused                                  | **PASS** — shell untouched                                                                             |
| No live trading surfaced                                         | **PASS**                                                                                               |
| No simulated Connected                                           | **PASS**                                                                                               |
| Empty/error/unavailable states honest                            | **PASS** — 403 is forbidden, not an empty directory for non-Admin                                      |
| Debug prefill forbidden                                          | **PASS** — login form untouched                                                                        |

**UX notes:** No visible UI changes are required in this slice and none were made. S02-d will project this API.

## 8. Documentation updated

| Check                                      | Verdict                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Slice reports exist                        | **PASS** — implementation, architecture, security, product, validation |
| Customer-facing help/runbook               | **NOT APPLICABLE** — no new UI journey                                 |
| Version 2 certification docs not rewritten | **PASS**                                                               |
| Master Plan not edited                     | **PASS**                                                               |
| No RC or ADR                               | **PASS**                                                               |

**Doc paths:** `docs/project/version-3/v3-s02-c-*.md`

---

## Product Principles

| Principle                    | How this slice respects it                                           | Verdict            |
| ---------------------------- | -------------------------------------------------------------------- | ------------------ |
| Customer First               | Admin grants a role in the product API without SQL                   | **PASS**           |
| Security Before Convenience  | C6 only; last-Admin; no fifth role                                   | **PASS**           |
| One Source of Truth          | Identity role; Workspace membership unchanged                        | **PASS**           |
| Paper First                  | Unchanged                                                            | **PASS**           |
| Live Must Be Earned          | Assignment does not enable live                                      | **PASS**           |
| Honest Product               | No People UI theater; events not claimed                             | **PASS**           |
| AI Never Controls Capital    | Untouched                                                            | **NOT APPLICABLE** |
| Everything Is Auditable      | Events stay S02-e as planned; assignment is still later-attributable | **PASS**           |
| No Hidden Configuration      | Existing Role enum only                                              | **PASS**           |
| Architecture Is a Constraint | Identity extended; no new BC                                         | **PASS**           |

---

**STOP.** Wait for Product Owner review before beginning V3-S02-d People Product.

**End of S02-c Product Review.**
