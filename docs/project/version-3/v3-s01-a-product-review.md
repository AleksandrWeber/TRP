# V3-S01-a Product Review

**Package:** V3-S01 Authentication & Session
**Slice:** S01-a — Registration & Password Policy
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Master Plan outcomes owned by S01:** register, secure login, recovery, session revoke
**Outcomes owned by this slice:** register with a policy-compliant password
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full S01 walkthrough. This slice does not claim it.

---

## 1. Customer receives

- Customer receives: the existing create-account journey, now with a stronger password rule they can read on the form.
- How they do it: `/login` → Create one → name, email, password. Hint: “Use at least 8 characters with a letter and a number.” Weak passwords are refused in product language. Duplicate email still says an account already exists. After a valid register they still enter the paper-first shell (PC-18).
- Master Plan: Wave 1 / §14 register line, **partial** (durable register). Login, recovery, and sessions are later slices.

**Verdict (this slice):** **PASS**
**Verdict (package Close):** **REQUIRES ACTION** — remaining S01 customer outcomes not shipped.

## 2. Customer does NOT receive

- Customer does NOT receive: email verification as a gate; login lockout; server logout; session list/revoke; refresh; password recovery; MFA; OAuth; passkeys; role admin; vault; live trading.
- Owner later: S01-b … S01-e; MFA Wave 6; S02–S06 as already planned.

**Verdict (this slice):** **PASS** — UI does not imply those capabilities.

## 3. Business value delivered

- Business value: new accounts can no longer be created with length-only or seed passwords.
- Metric: time to register must stay **< 2 min**. Policy is one extra constraint, not a new journey. Not re-timed in a live walkthrough in this task.
- Production-readiness residue: sessions still irrevocable 8h JWT; lockout and recovery still missing.

**Verdict (this slice):** **PASS** for the policy increment.

## 4. Customer journey impact

- Journey step(s) affected: **Sign in securely** (register half only).
- Journey steps explicitly unchanged: workspace, connect, research → Command Center, paper/live.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S01-b Login & Lockout**
- Next customer-visible capability after S01-b: lockout after password spray, still generic errors
- Wave exit claimed? **No**
- Next package after S01 Close: V3-S02 — **not** unlocked yet

**Verdict:** **PASS**

## 6. Manual product walkthrough

| Check                           | Verdict                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Walkthrough script exists       | **PASS** — package validation plan step 1 (register)                                                        |
| Executed in the product UI      | **NOT APPLICABLE** for this slice closeout — automated UI/API tests only; no live operator session recorded |
| No SSH                          | **PASS** — no SSH used                                                                                      |
| No customer `.env`              | **PASS**                                                                                                    |
| No manual database edits        | **PASS**                                                                                                    |
| Honest unavailable/error states | **PASS** — policy and duplicate messages are honest; no fake “email sent” / MFA                             |

**Walkthrough evidence:** unit and component tests listed in the S01-a Validation Report. Full package walkthrough remains for Close.

## 7. UX reviewed

| Check                                                            | Verdict            |
| ---------------------------------------------------------------- | ------------------ |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **PASS**           |
| Existing certified shell reused                                  | **PASS**           |
| No live trading surfaced                                         | **PASS**           |
| No simulated Connected                                           | **NOT APPLICABLE** |
| Empty/error/unavailable states honest                            | **PASS**           |
| Debug prefill forbidden                                          | **PASS**           |

**UX notes:** Register shows the policy hint. Sign-in keeps length-only client validation so existing accounts are not blocked by the new rule before S01-e password change exists.

## 8. Documentation updated

| Check                                      | Verdict                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Slice reports exist                        | **PASS** — implementation, architecture, security, product, validation |
| Customer-facing help/runbook               | **NOT APPLICABLE** — no new journey; hint is on the form               |
| Version 2 certification docs not rewritten | **PASS**                                                               |
| Master Plan not edited                     | **PASS**                                                               |
| No RC or ADR                               | **PASS**                                                               |

**Doc paths:** `docs/project/version-3/v3-s01-a-*.md`

---

## Product Principles

| Principle                    | How this slice respects it                    | Verdict            |
| ---------------------------- | --------------------------------------------- | ------------------ |
| Customer First               | Register stays in the UI; no SSH              | **PASS**           |
| Security Before Convenience  | Complexity + seed rejection on register       | **PASS**           |
| One Source of Truth          | One Auth policy                               | **PASS**           |
| Paper First                  | Paper-first copy unchanged                    | **PASS**           |
| Live Must Be Earned          | Live not offered                              | **PASS**           |
| Honest Product               | No email-verification theater; no MFA theater | **PASS**           |
| AI Never Controls Capital    | Untouched                                     | **NOT APPLICABLE** |
| Everything Is Auditable      | Register log kept; no secrets                 | **PASS**           |
| No Hidden Configuration      | Policy visible on the form                    | **PASS**           |
| Architecture Is a Constraint | Auth extended, not replaced                   | **PASS**           |

---

**STOP.** Wait for review before beginning S01-b.

**End of S01-a Product Review.**
