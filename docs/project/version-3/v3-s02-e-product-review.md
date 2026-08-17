# V3-S02-e Product Review

**Package:** V3-S02 RBAC Product
**Slice:** S02-e — Privilege Constraints & Authorization Events
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Master Plan outcomes owned by S02:** Admin assigns a role; operator cannot perform another role’s actions; J3-02
**Outcomes owned by this slice:** Role changes are auditable; privilege decisions are traceable; an Administrator who tries to change their own role is denied with a clear explanation
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)
**Overview:** [`authorization-events-overview.md`](./authorization-events-overview.md)
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full RBAC Walkthrough (J3-02) recorded as a live operator pass. This slice evidences privilege constraints, authorization events, and the own-role People journey. It does not Close the package.

---

## 1. Customer receives

- Customer receives: when an Administrator changes another person’s role, the product records who changed it, whose role changed, the previous role, and the new role. When someone without permission tries, they are refused and that refusal is recorded. When an Administrator tries to change their own role in People, the change is denied and a clear explanation is shown.
- How they do it: Administration → People. No SSH, customer `.env`, or SQL. They do not open a log viewer.
- Master Plan: Wave 1 / SEC-02, **complete for implementation slices**. Package Close still needs Product Owner review and the live J3-02 recording.

**Verdict (this slice):** **PASS**
**Verdict (package Close):** **REQUIRES ACTION** — Product Owner review and live J3-02 remain.

## 2. Customer does NOT receive

- Customer does NOT receive: a security-history page; workspace invitations; membership management; vault; connections; exchange permissions; live authorization; new roles; role hierarchy; disable-user.
- Owner later: V3-S05 audit product; V3-S03; Wave 2; Wave 4; Wave 6; Wave 9.

**Verdict (this slice):** **PASS** — events are not an audit product.

## 3. Business value delivered

- Business value: role changes are attributable. Privilege refusals on People are traceable. Admin is still not a skip around Gate or Risk.
- Metric: register / login not re-timed. Public auth routes unchanged.
- Residue: operators cannot search the record yet; first Admin is still host bootstrap.

**Verdict (this slice):** **PASS**

## 4. Customer journey impact

- Journey step(s) affected: People own-role attempt now uses the same confirm path as changing someone else, then shows the refusal. Recording is silent after a successful change of another person.
- Unchanged: research, paper, sign-in sessions, password.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **none inside S02.** Implementation slices are complete.
- Next _package_ after S02 Close: **V3-S03 Secret Vault** — **not** unlocked. Do not start it.

**Verdict:** **PASS**

## 6. Manual product walkthrough

This is a full operator journey in People — not an API-only check.

```text
Privilege Constraints & Authorization Events Walkthrough (S02-e)

□ Admin changes another user's role
□ Event recorded
□ Unauthorized role change denied
□ Denied authorization event recorded
□ Admin tries to change own role
    ↓
    Denied
    ↓
    Clear explanation shown

PASS
```

| Check                           | Verdict                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| Walkthrough script exists       | **PASS**                                                                  |
| Executed in the product UI      | **PASS** at component level (`PeoplePage.spec.tsx`) plus HTTP event specs |
| No SSH                          | **PASS**                                                                  |
| No customer `.env`              | **PASS**                                                                  |
| No manual database edits        | **PASS**                                                                  |
| Honest unavailable/error states | **PASS** — own-role refusal is on screen; non-Admin still unavailable     |

**Walkthrough evidence:**

| Step                                | What the operator does / sees                                                                      | Evidence                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Admin changes another user's role   | Opens People, chooses a role for someone else, confirms, sees success                              | Confirmation prompt; success copy; HTTP 200 assign |
| Event recorded                      | No new page. The product records who, whom, from, to                                               | `authz.role-change` outcome `assigned`             |
| Unauthorized role change denied     | A non-Administrator cannot use People. A Trader cannot assign                                      | Forbidden panel; HTTP 403                          |
| Denied authorization event recorded | That refusal is recorded as a Role-admin denial                                                    | `authz.deny` permission C6                         |
| Admin tries to change own role      | Row labeled **You**. Chooses another role. Sees the same confirm question                          | `PeoplePage.spec.tsx` pending on the signed-in row |
| Denied                              | Confirm does not apply the change                                                                  | Identity `SelfRoleChangeError`; HTTP 409           |
| Clear explanation shown             | “You cannot change your own role.” plus a short sentence that you cannot change the signed-in role | Error banner + `people-own-role-denied`            |

Overall:

| Field                   | Value                                                |
| ----------------------- | ---------------------------------------------------- |
| Walkthrough name        | Privilege Constraints & Authorization Events (S02-e) |
| Executed in the product | Component / HTTP (not live two-browser J3-02)        |
| Overall                 | **PASS**                                             |

## 7. UX reviewed

| Check                                                            | Verdict  |
| ---------------------------------------------------------------- | -------- |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **PASS** |
| Existing certified shell reused                                  | **PASS** |
| No live trading surfaced                                         | **PASS** |
| No simulated Connected                                           | **PASS** |
| Empty/error/unavailable states honest                            | **PASS** |
| Debug prefill forbidden                                          | **PASS** |

**UX notes:** Own-role is an attempt then a refusal, not a hidden control with no way to try. Explanation appears after the deny. No events console.

## 8. Documentation updated

| Check                                      | Verdict                                       |
| ------------------------------------------ | --------------------------------------------- |
| Slice reports exist                        | **PASS**                                      |
| Customer-facing overview                   | **PASS** — `authorization-events-overview.md` |
| Version 2 certification docs not rewritten | **PASS**                                      |
| Master Plan not edited                     | **PASS**                                      |
| No RC or ADR                               | **PASS**                                      |

---

## Product Principles

| Principle                    | How this slice respects it                       | Verdict            |
| ---------------------------- | ------------------------------------------------ | ------------------ |
| Customer First               | Own-role refusal is visible in People            | **PASS**           |
| Security Before Convenience  | Attempt still cannot succeed                     | **PASS**           |
| One Source of Truth          | Identity denies; logs do not store a second role | **PASS**           |
| Paper First                  | Shell unchanged                                  | **PASS**           |
| Live Must Be Earned          | No live chrome; C7 unbound                       | **PASS**           |
| Honest Product               | Denied is explained; events overview is not S05  | **PASS**           |
| AI Never Controls Capital    | Untouched                                        | **NOT APPLICABLE** |
| Everything Is Auditable      | Role change and C6 deny recorded                 | **PASS**           |
| No Hidden Configuration      | No Admin skip                                    | **PASS**           |
| Architecture Is a Constraint | Existing Logger; three owners                    | **PASS**           |

---

**STOP.** Wait for Product Owner review before V3-S02 Package Close. Do not begin V3-S03.

**End of S02-e Product Review.**
