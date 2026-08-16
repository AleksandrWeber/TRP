# V3-S01-a Validation Report

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-a — Registration & Password Policy  
**Date:** 2026-08-16  
**Nature:** Slice validation evidence. Not package Close. Not an RC. Not an ADR.  
**Plan:** [`v3-s01-validation-plan.md`](./v3-s01-validation-plan.md) (unmodified; executed only for S01-a rows)

---

## Verdict

**PASS for S01-a.** Weak passwords fail in API and UI. Durable register still works. bcrypt still hashes. Duplicate email still 409. Login, sessions, recovery, and lockout rows were **not** executed because those slices were not implemented.

V3-S01 **cannot Close** on this evidence.

---

## 1. Unit tests (S01-a)

| Area                                    | Plan requirement                                             | Result                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Password policy                         | Compliant accepted; non-compliant rejected on register       | **PASS** — `password-policy.spec.ts`, `authentication.service.spec.ts`, `validation.spec.ts`. Change/reset **not run** (S01-e). |
| bcrypt                                  | Hashes not reversible; verify uses `PasswordCredentialStore` | **PASS** — store spec + register hash assertion (`$2…`, not plaintext)                                                          |
| Lockout                                 | —                                                            | **NOT RUN** — S01-b                                                                                                             |
| Session / refresh / revoke / logout-all | —                                                            | **NOT RUN** — S01-c/d                                                                                                           |
| Recovery token                          | —                                                            | **NOT RUN** — S01-e                                                                                                             |
| Disabled user                           | Keep PC-18                                                   | **PASS** — existing authentication spec still green                                                                             |
| JWT secret                              | US158                                                        | **PASS** — `jwt-secret.spec.ts`                                                                                                 |
| No second Identity                      | `UserDomainService` + `AuthenticationService`                | **PASS**                                                                                                                        |

Command: `pnpm --filter @trp/api exec vitest run src/modules/auth` — 31 passed. Plus `validation.spec.ts` and `pc18-identity-persistence.integration.spec.ts`.

## 2. Integration tests (S01-a)

| Case                              | Result                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| Register survives process restart | **PASS** — PC-18 identity persistence spec still green (`password-123`) |
| Login issues revocable session    | **NOT RUN** — S01-c                                                     |
| Logout / revoke / recover HTTP    | **NOT RUN** — S01-d/e                                                   |
| Host mail off                     | **NOT RUN** — S01-e                                                     |
| Workspace header                  | **NOT RUN** this slice (unchanged; not re-proven here)                  |
| Public register still `@Public()` | **PASS** — controller unchanged                                         |

## 3. UI tests (S01-a)

| Case                                         | Result                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Login page no seed prefill                   | **PASS** — `LoginPage.spec.tsx`                                                         |
| Register policy errors in product language   | **PASS** — `loginForm.spec.ts`, register markup shows the hint, no JWT                  |
| Sign-in happy path to paper shell            | **NOT RE-RUN as e2e** — register/login wiring unchanged; J-01 not executed in this task |
| Logout / Sessions / Forgot / Change password | **NOT RUN** — later slices                                                              |
| No leaked S02–S06                            | **PASS** — no role-admin, vault, or live controls added                                 |

Web command: `pnpm --filter @trp/web exec vitest run src/shared/passwordPolicy.spec.ts src/pages/loginForm.spec.ts src/pages/LoginPage.spec.tsx src/shared/mapApiError.spec.ts` — 21 passed.

## 4. Manual product walkthrough

Not executed in a live browser in this task. Automated tests cover slice step 1 (policy-compliant vs weak register). Steps 2–10 of the package plan belong to later slices or Close.

Any claim that a non-engineer completed the full S01 journey would be false.

## 5. Security verification (slice)

| Check                                                                    | Result                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Password never in responses                                              | **PASS** — register payload has no password/hash; validation `password` value is `[redacted]` |
| Seed not product register                                                | **PASS**                                                                                      |
| MFA theater                                                              | **PASS** — none                                                                               |
| Seed form empty                                                          | **PASS**                                                                                      |
| Revoked session / refresh reuse / cookies / CSRF / lockout / reset token | **NOT RUN** — later slices                                                                    |
| JWT secret production rules                                              | **PASS** — unchanged                                                                          |
| Enumeration                                                              | **PASS** — register 409 on duplicate remains PC-18; login messages unchanged                  |

## 6. Architecture verification (slice)

See [`v3-s01-a-architecture-review.md`](./v3-s01-a-architecture-review.md). Owner remains Authentication. No new bounded context.

## 7. Customer acceptance

Not requested for package Close. Slice-level: a reviewer can register with a compliant password in the product form; weak and seed passwords are refused.

Master Plan S01 checkboxes (login, recover, sessions) remain **unchecked**.

## 8. Close criteria

| Gate                                                          | Result                           |
| ------------------------------------------------------------- | -------------------------------- |
| Slices S01-a … S01-e merged                                   | **NOT DONE** — only S01-a        |
| Unit / integration / UI for the **package**                   | **NOT DONE**                     |
| Manual walkthrough recorded                                   | **NOT DONE**                     |
| Architecture / Security / Product reviews for the **package** | Slice reviews only               |
| Honest limitations recorded                                   | **PASS** — implementation report |
| No Master Plan change                                         | **PASS**                         |

---

## Package Summary Standard (S01-a answers)

These answers are for **this slice**. They are not a V3-S01 Close.

1. **What did the customer receive?**  
   Create-account in the product UI with a stronger password rule (length 8 + letter + number), bcrypt hashing, duplicate-email handling, and operator-language errors. Default role remains Researcher. The login form stays empty.

2. **What did the customer NOT receive?**  
   Email verification as a gate, login lockout, server logout, session list/revoke, refresh tokens, password recovery, MFA, OAuth, passkeys, role admin, vault, or live trading.

3. **What business problem was solved?**  
   New operators could previously register with length-only or known-weak seed passwords. That product path is closed.

4. **What remains?**  
   S01-b lockout; S01-c revocable sessions and secure transport; S01-d session management UI; S01-e recovery and authenticated password change. Then V3-S02.

5. **What package/slice is next?**  
   **S01-b Login & Lockout.** Not V3-S02.

6. **Was the Master Plan respected?**  
   **Yes.** Registration and password policy only. Email verification was not added because it is not a Master Plan S01 outcome.

7. **Were Product Principles respected?**  
   **Yes.** Customer First, Security Before Convenience, Honest Product, and Architecture Is a Constraint were applied. Live remains unearned.

8. **Were any architectural deviations introduced?**  
   **No.**

---

**STOP.** Wait for review before beginning S01-b Login & Lockout.

**End of S01-a Validation Report.**
