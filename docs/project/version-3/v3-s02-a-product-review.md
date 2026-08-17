# V3-S02-a Product Review

**Package:** V3-S02 RBAC Product
**Slice:** S02-a — Permission Model
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Master Plan outcomes owned by S02:** Admin assigns a role; operator cannot perform another role’s actions; J3-02
**Outcomes owned by this slice:** the platform can consistently decide who may perform which action
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full RBAC Walkthrough (J3-02). This slice does not claim it. No visible UI changes shipped.

---

## 1. Customer receives

- Customer receives: a consistent server-side answer to “may this role perform this action?” Default is deny. Reader, Researcher, Trader, and Admin each have named privileges. Live, vault/connections, and Gate/Risk bypass are not granted.
- How they do it: no new UI in this slice. The decision is used by the existing Auth guard and paper-command gate. People assignment remains a later slice.
- Master Plan: Wave 1 / SEC-02 / SEC-03, **partial** (permission model only). J3-02 People path is S02-c/d.

**Verdict (this slice):** **PASS**
**Verdict (package Close):** **REQUIRES ACTION** — remaining S02 customer outcomes not shipped.

## 2. Customer does NOT receive

- Customer does NOT receive: People management UI; role assignment UI; workspace invitations; Credential Vault; Connection Management; exchange permissions; live trading authorization; last-Admin product; HTTP coverage of remaining research/live routes.
- Owner later: S02-b … S02-e; S03; Wave 2; Wave 4; Wave 6; Wave 9.

**Verdict (this slice):** **PASS** — UI does not imply those capabilities.

## 3. Business value delivered

- Business value: privilege is no longer tribal policy in scattered `Set`s. The same matrix will bind later surfaces. Operators still cannot assign roles in the product yet.
- Metric: time to register / login must not regress (Master Plan §6). Register path unchanged. Not re-timed in a live walkthrough in this task.
- Production-readiness residue: remaining HTTP allow-by-omission (S02-b); no People product (S02-d).

**Verdict (this slice):** **PASS** for the policy increment.

## 4. Customer journey impact

- Journey step(s) affected: after sign-in, **who** may research vs paper-command vs administer people — **policy only**. No journey UI change.
- Journey steps explicitly unchanged: sign-in (S01); workspace; research/paper HTTP as they exist today except the existing US158 paper gate now reads C5.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S02-b Surface coverage**
- Next customer-visible capability after S02-b: remaining in-scope HTTP uses the same matrix (still no People UI)
- Wave exit claimed? **No**
- Next package after S02 Close: V3-S03 — **not** unlocked yet

**Verdict:** **PASS**

## 6. Manual product walkthrough

This is not a unit test in intent. This is the customer validation checklist for this slice. There is no People UI to operate. The walkthrough is the permission model itself, executed against the real decision service (not a mocked matrix).

```text
Permission Model Walkthrough (S02-a)

□ Authorized action succeeds
□ Missing permission denied
□ Unknown permission denied
□ Unknown role denied
□ Unauthorized action denied

PASS
```

| Check                           | Verdict                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Walkthrough script exists       | **PASS** — artifact above                                                                                          |
| Executed in the product UI      | **NOT APPLICABLE** — this slice has no UI; executed via `authorization-decision.service.spec.ts` walkthrough block |
| No SSH                          | **PASS**                                                                                                           |
| No customer `.env`              | **PASS**                                                                                                           |
| No manual database edits        | **PASS**                                                                                                           |
| Honest unavailable/error states | **PASS** — deny reasons are explicit; no fake allow                                                                |

**Walkthrough evidence:**

| Step                       | Evidence                                          |
| -------------------------- | ------------------------------------------------- |
| Authorized action succeeds | Trader + C5 + member → allowed                    |
| Missing permission denied  | Researcher + C5 → `missing_permission`            |
| Unknown permission denied  | Admin + `not-a-permission` → `unknown_permission` |
| Unknown role denied        | `Operator` + C1 → `unknown_role`                  |
| Unauthorized action denied | Reader + C4 → `missing_permission`                |

Overall:

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Walkthrough name        | Permission Model Walkthrough (S02-a) |
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

**Doc paths:** `docs/project/version-3/v3-s02-a-*.md`

---

## Product Principles

| Principle                    | How this slice respects it                                                                   | Verdict            |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ------------------ |
| Customer First               | Consistent authorization is the foundation for a later People product; no SSH for the policy | **PASS**           |
| Security Before Convenience  | Default deny; unknown fail-closed; no Admin-by-register                                      | **PASS**           |
| One Source of Truth          | Identity role; Workspace membership; Authz decides only                                      | **PASS**           |
| Paper First                  | Paper commands stay Trader/Admin listed cells                                                | **PASS**           |
| Live Must Be Earned          | C7 denied                                                                                    | **PASS**           |
| Honest Product               | No People UI theater                                                                         | **PASS**           |
| AI Never Controls Capital    | Untouched                                                                                    | **NOT APPLICABLE** |
| Everything Is Auditable      | Structured deny reasons; audit product is S05                                                | **PASS**           |
| No Hidden Configuration      | Matrix is not a customer `.env`                                                              | **PASS**           |
| Architecture Is a Constraint | Auth extended, not replaced                                                                  | **PASS**           |

---

**STOP.** Wait for review before beginning S02-b.

**End of S02-a Product Review.**
