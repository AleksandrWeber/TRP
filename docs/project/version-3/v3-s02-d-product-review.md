# V3-S02-d Product Review

**Package:** V3-S02 RBAC Product
**Slice:** S02-d — People Product
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Master Plan outcomes owned by S02:** Admin assigns a role; operator cannot perform another role’s actions; J3-02
**Outcomes owned by this slice:** Administrators no longer need API tools to assign roles; role management is a normal product feature
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)
**Overview:** [`people-product-overview.md`](./people-product-overview.md)
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full RBAC Walkthrough (J3-02) recorded as a live operator pass. This slice evidences the UI-visible steps. It does not Close the package.

---

## 1. Customer receives

- Customer receives: an Administrator opens People in the signed-in shell, sees people and current roles, and assigns Reader / Researcher / Trader / Administrator with confirmation. The new role applies immediately. The signed-in Administrator is marked **You** and cannot change their own role. A non-Administrator who opens People is told it is unavailable.
- How they do it: Administration → People. No SSH, customer `.env`, or SQL.
- Master Plan: Wave 1 / SEC-02, **partial** (People UI). Package Close still needs S02-e and the live J3-02 recording.

**Verdict (this slice):** **PASS**
**Verdict (package Close):** **REQUIRES ACTION** — S02-e and live J3-02 remain.

## 2. Customer does NOT receive

- Customer does NOT receive: workspace invitations; membership management; vault; connections; exchange permissions; live authorization; new roles; role hierarchy; structured audit events; disable-user.
- Owner later: S02-e; S03; Wave 2; Wave 4; Wave 6; Wave 9.

**Verdict (this slice):** **PASS** — People is not an invite product.

## 3. Business value delivered

- Business value: role management is a normal Administration feature. Least privilege can be applied without API tools.
- Metric: register / login not re-timed. Public auth routes unchanged.
- Residue: first Admin is still host bootstrap; events are S02-e.

**Verdict (this slice):** **PASS**

## 4. Customer journey impact

- Journey step(s) affected: after sign-in, Administration includes People.
- Unchanged: research, paper, sign-in sessions, password.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S02-e Privilege constraints and authorization events**
- Next customer-visible capability: none required in S02-e (tests and logs). Next _package_ after S02 Close: V3-S03 — **not** unlocked yet.

**Verdict:** **PASS**

## 6. Manual product walkthrough

```text
People Product Walkthrough (S02-d)

□ Admin opens People
□ Users listed
□ Current roles visible
□ Role changed successfully
□ Invalid role rejected
□ Unauthorized user denied

PASS
```

| Check                           | Verdict                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| Walkthrough script exists       | **PASS**                                                         |
| Executed in the product UI      | **PASS** at component level (`PeoplePage.spec.tsx`, shell specs) |
| No SSH                          | **PASS**                                                         |
| No customer `.env`              | **PASS**                                                         |
| No manual database edits        | **PASS**                                                         |
| Honest unavailable/error states | **PASS** — forbidden is not an empty directory                   |

**Walkthrough evidence:**

| Step                      | Evidence                                                   |
| ------------------------- | ---------------------------------------------------------- |
| Admin opens People        | Catalog `/people`; App route; PageHeader People            |
| Users listed              | Panel lists display name and email                         |
| Current roles visible     | “Current role: Administrator / Reader”                     |
| Role changed successfully | Confirm copy; success banner copy in product strings       |
| Invalid role rejected     | Select is four roles; `isPeopleRole('Superuser')` is false |
| Unauthorized user denied  | Forbidden panel; no change control; no operator rows       |

Self-role (extra, requested): signed-in row labeled **You**; “You cannot change your own role.” API 409.

Overall:

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Walkthrough name        | People Product Walkthrough (S02-d)   |
| Executed in the product | Component / shell (not live browser) |
| Overall                 | **PASS**                             |

## 7. UX reviewed

| Check                                                            | Verdict  |
| ---------------------------------------------------------------- | -------- |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **PASS** |
| Existing certified shell reused                                  | **PASS** |
| No live trading surfaced                                         | **PASS** |
| No simulated Connected                                           | **PASS** |
| Empty/error/unavailable states honest                            | **PASS** |
| Debug prefill forbidden                                          | **PASS** |

**UX notes:** Confirmation before a role change. Own row has no assign control.

## 8. Documentation updated

| Check                                      | Verdict                                 |
| ------------------------------------------ | --------------------------------------- |
| Slice reports exist                        | **PASS**                                |
| Customer-facing overview                   | **PASS** — `people-product-overview.md` |
| Version 2 certification docs not rewritten | **PASS**                                |
| Master Plan not edited                     | **PASS**                                |
| No RC or ADR                               | **PASS**                                |

---

## Product Principles

| Principle                    | How this slice respects it     | Verdict            |
| ---------------------------- | ------------------------------ | ------------------ |
| Customer First               | Assign in Administration       | **PASS**           |
| Security Before Convenience  | Own-role blocked; confirmation | **PASS**           |
| One Source of Truth          | Identity persists; UI projects | **PASS**           |
| Paper First                  | Shell unchanged                | **PASS**           |
| Live Must Be Earned          | No live chrome                 | **PASS**           |
| Honest Product               | Unavailable ≠ empty directory  | **PASS**           |
| AI Never Controls Capital    | Untouched                      | **NOT APPLICABLE** |
| Everything Is Auditable      | Events stay S02-e              | **PASS**           |
| No Hidden Configuration      | Four named roles               | **PASS**           |
| Architecture Is a Constraint | Projection, not a new domain   | **PASS**           |

---

**STOP.** Wait for Product Owner review before beginning V3-S02-e.

**End of S02-d Product Review.**
