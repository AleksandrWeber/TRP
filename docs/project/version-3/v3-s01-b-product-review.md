# V3-S01-b Product Review

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-b — Login & Lockout  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Master Plan outcomes owned by S01:** register, secure login, recovery, session revoke  
**Outcomes owned by this slice:** sign in securely; lockout after password spray with generic errors  
**Checklist:** [`version-3-product-checklist.md`](./version-3-product-checklist.md)  
**Nature:** Product review. Not an RC. Not an ADR.

Package Close requires the full S01 walkthrough. This slice does not claim it.

---

## 1. Customer receives

- Customer receives: the existing sign-in journey, now protected against password spray. After enough failed attempts the account locks for a cooldown. The message never says whether the email exists or that the account is locked.
- How they do it: `/login` → email, password → Sign in. Wrong or unknown credentials show “Invalid email or password.” After a valid sign-in they still enter the paper-first shell (PC-18).
- Master Plan: Wave 1 / §14 login line, **partial** (secure login + lockout). Recovery and sessions are later slices.

**Verdict (this slice):** **PASS**  
**Verdict (package Close):** **REQUIRES ACTION** — remaining S01 customer outcomes not shipped.

## 2. Customer does NOT receive

- Customer does NOT receive: email verification as a gate; server logout; session list/revoke; refresh; password recovery; MFA; OAuth; passkeys; remember me; trusted devices; role admin; vault; live trading.
- Owner later: S01-c … S01-e; MFA Wave 6; S02–S06 as already planned.

**Verdict (this slice):** **PASS** — UI does not imply those capabilities.

## 3. Business value delivered

- Business value: an attacker can no longer spray passwords against a single account without a cooldown.
- Metric: time to secure login must stay **< 30 s** on the happy path. Lockout is not on the happy path. Not re-timed in a live walkthrough in this task.
- Production-readiness residue: sessions still irrevocable 8h JWT; recovery still missing.

**Verdict (this slice):** **PASS** for the lockout increment.

## 4. Customer journey impact

- Journey step(s) affected: **Sign in securely** (login + lockout).
- Journey steps explicitly unchanged: register (S01-a), workspace, connect, research → Command Center, paper/live.
- Paper remains default: **Yes**.

**Verdict:** **PASS**

## 5. Next customer capability unlocked

- Next slice: **S01-c Session issuance, refresh, secure transport**
- Next customer-visible capability after S01-c: a stolen leftover token cannot keep acting
- Wave exit claimed? **No**
- Next package after S01 Close: V3-S02 — **not** unlocked yet

**Verdict:** **PASS**

## 6. Manual product walkthrough

This is not a unit test. This is not an integration test. This is not a UI test. This is the customer validation checklist for this slice.

```text
Login & Lockout Walkthrough

□ Open Sign in
□ Enter valid email and password
□ Sign in succeeds
□ Wrong password shows “Invalid email or password.”
□ Unknown email shows the same message
□ Repeated failures lock the account
□ Correct password while locked shows the same message
□ After cooldown, correct password signs in
□ Password never exposed

PASS
```

| Check                           | Verdict                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Walkthrough script exists       | **PASS** — artifact above; package validation plan step 9                                                                     |
| Executed in the product UI      | **NOT APPLICABLE** for this slice closeout — product-path API and UI-mapping tests; no live operator browser session recorded |
| No SSH                          | **PASS** — no SSH used                                                                                                        |
| No customer `.env`              | **PASS**                                                                                                                      |
| No manual database edits        | **PASS** — operator path does not require SQL; persistence is Auth-owned                                                      |
| Honest unavailable/error states | **PASS** — generic login errors; no “account locked” copy that would enumerate                                                |

**Walkthrough evidence:** `authentication.service.spec.ts` (lock, cooldown, generic message, no password in payload/logs), `loginForm.spec.ts` (same UI copy for Unauthorized / invalid credentials / lockout-shaped API message), PC-18 integration lockout restart. Full package walkthrough remains for Close.

Overall:

| Field                   | Value                                                 |
| ----------------------- | ----------------------------------------------------- |
| Walkthrough name        | Login & Lockout Walkthrough                           |
| Executed in the product | NOT APPLICABLE (slice; live browser at package Close) |
| Overall                 | **PASS** for this slice’s customer contract           |

## 7. UX reviewed

| Check                                                            | Verdict                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| Operator language, no JWT / Prisma / slice IDs in the happy path | **PASS**                                             |
| Existing certified shell reused                                  | **PASS**                                             |
| No live trading surfaced                                         | **PASS**                                             |
| No simulated Connected                                           | **NOT APPLICABLE**                                   |
| Empty/error/unavailable states honest                            | **PASS** — generic sign-in error; no lockout theater |
| Debug prefill forbidden                                          | **PASS**                                             |

**UX notes:** Sign-in still uses length-only client validation so existing accounts can submit. Lockout is not announced in the UI on purpose (enumeration). Register policy hint from S01-a is unchanged.

## 8. Documentation updated

| Check                                      | Verdict                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Slice reports exist                        | **PASS** — implementation, architecture, security, product, validation |
| Customer-facing help/runbook               | **NOT APPLICABLE** — no new journey; same sign-in form                 |
| Version 2 certification docs not rewritten | **PASS**                                                               |
| Master Plan not edited                     | **PASS**                                                               |
| No RC or ADR                               | **PASS**                                                               |

**Doc paths:** `docs/project/version-3/v3-s01-b-*.md`

---

## Product Principles

| Principle                    | How this slice respects it                           | Verdict            |
| ---------------------------- | ---------------------------------------------------- | ------------------ |
| Customer First               | Sign-in stays in the UI; no SSH                      | **PASS**           |
| Security Before Convenience  | Lockout after spray; no remember-me                  | **PASS**           |
| One Source of Truth          | One Auth lockout store                               | **PASS**           |
| Paper First                  | Paper-first copy unchanged                           | **PASS**           |
| Live Must Be Earned          | Live not offered                                     | **PASS**           |
| Honest Product               | Generic errors; no MFA theater; no fake lockout copy | **PASS**           |
| AI Never Controls Capital    | Untouched                                            | **NOT APPLICABLE** |
| Everything Is Auditable      | Login/lockout logs kept; no secrets                  | **PASS**           |
| No Hidden Configuration      | 5 / 15 minutes in product code                       | **PASS**           |
| Architecture Is a Constraint | Auth extended, not replaced                          | **PASS**           |

---

**STOP.** Wait for review before beginning S01-c.

**End of S01-b Product Review.**
