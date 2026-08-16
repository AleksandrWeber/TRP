# V3-S01-b Validation Report

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-b — Login & Lockout  
**Date:** 2026-08-16  
**Nature:** Slice validation evidence. Not package Close. Not an RC. Not an ADR.  
**Plan:** [`v3-s01-validation-plan.md`](./v3-s01-validation-plan.md) (unmodified; executed only for S01-b rows)

---

## Verdict

**PASS for S01-b.** Spray locks. Cooldown then allows a correct password. Public error stays “Invalid email or password.” bcrypt still hashes. Disabled users still fail closed. Sessions, recovery, and refresh rows were **not** executed because those slices were not implemented.

V3-S01 **cannot Close** on this evidence.

---

## 1. Unit tests (S01-b)

| Area                                    | Plan requirement                                                                                            | Result                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Password policy                         | —                                                                                                           | **NOT RE-RUN as new work** — S01-a still green in the auth suite           |
| bcrypt                                  | Hashes not reversible; verify uses `PasswordCredentialStore`                                                | **PASS** — store spec; dummy compare never returns true for missing users  |
| Lockout                                 | Nth failure locks; cooldown then allows a correct password; lockout does not change the public error string | **PASS** — `login-lockout.store.spec.ts`, `authentication.service.spec.ts` |
| Session / refresh / revoke / logout-all | —                                                                                                           | **NOT RUN** — S01-c/d                                                      |
| Recovery token                          | —                                                                                                           | **NOT RUN** — S01-e                                                        |
| Disabled user                           | Keep PC-18                                                                                                  | **PASS** — same generic login message                                      |
| JWT secret                              | US158                                                                                                       | **PASS** — `jwt-secret.spec.ts`                                            |
| No second Identity                      | `UserDomainService` + `AuthenticationService`                                                               | **PASS**                                                                   |

Command: `pnpm --filter @trp/api exec vitest run src/modules/auth` — **37 passed**.

## 2. Integration tests (S01-b)

| Case                                   | Result                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| Register survives process restart      | **PASS** — PC-18 identity persistence spec still green          |
| Login lockout survives process restart | **PASS** — same spec, new case; Prisma `auth_login_lockouts`    |
| Login issues revocable session         | **NOT RUN** — S01-c                                             |
| Logout / revoke / recover HTTP         | **NOT RUN** — S01-d/e                                           |
| Host mail off                          | **NOT RUN** — S01-e                                             |
| Workspace header                       | **NOT RUN** this slice (unchanged; not re-proven here)          |
| Public login still `@Public()`         | **PASS** — controller still public; only request metadata added |

## 3. UI tests (S01-b)

| Case                                         | Result                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Login page no seed prefill                   | **PASS** — `LoginPage.spec.tsx`                                                                                                  |
| Sign-in generic error                        | **PASS** — `loginForm.spec.ts` maps Unauthorized / invalid credentials / lockout-shaped API text to “Invalid email or password.” |
| Register policy errors in product language   | **PASS** — unchanged from S01-a                                                                                                  |
| Sign-in happy path to paper shell            | **NOT RE-RUN as e2e** — login wiring unchanged except error mapping; J-01 not executed in this task                              |
| Logout / Sessions / Forgot / Change password | **NOT RUN** — later slices                                                                                                       |
| No leaked S02–S06                            | **PASS** — no role-admin, vault, or live controls added                                                                          |

Web command: `pnpm --filter @trp/web exec vitest run src/pages/loginForm.spec.ts src/pages/LoginPage.spec.tsx src/shared/mapApiError.spec.ts` — **19 passed**.

## 4. Manual product walkthrough

See [`v3-s01-b-product-review.md`](./v3-s01-b-product-review.md) §6.

The Login & Lockout Walkthrough artifact is present. Product-path tests cover each customer step. No live operator browser session was recorded in this task. Package plan steps 3–8 and 10 belong to later slices or Close.

Any claim that a non-engineer completed the full S01 journey would be false.

## 5. Security verification (slice)

| Check                                                          | Result                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Lockout                                                        | **PASS** — spray does not yield a session                        |
| Password never in responses or logs                            | **PASS**                                                         |
| Enumeration                                                    | **PASS** — login messages identical for unknown vs bad vs locked |
| Seed form empty                                                | **PASS**                                                         |
| MFA theater                                                    | **PASS** — none                                                  |
| JWT secret production rules                                    | **PASS** — unchanged                                             |
| Revoked session / refresh reuse / cookies / CSRF / reset token | **NOT RUN** — later slices                                       |

STRIDE Threat Review: see [`v3-s01-b-security-review.md`](./v3-s01-b-security-review.md). All six categories **PASS** for this slice.

## 6. Architecture verification (slice)

See [`v3-s01-b-architecture-review.md`](./v3-s01-b-architecture-review.md). Owner remains Authentication. No new bounded context. `auth_login_lockouts` is Auth persistence, not an Identity product and not an auth session store.

## 7. Customer acceptance

Not requested for package Close. Slice-level: a reviewer can sign in on the happy path; repeated failures lock; the message stays generic.

Master Plan S01 checkboxes (recover, sessions) remain **unchecked**. Secure login + lockout is the increment.

## 8. Close criteria

| Gate                                                          | Result                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Slices S01-a … S01-e merged                                   | **NOT DONE** — S01-a accepted; S01-b implemented; S01-c…e not started |
| Unit / integration / UI for the **package**                   | **NOT DONE**                                                          |
| Manual walkthrough recorded                                   | **NOT DONE** for the full package; slice artifact present             |
| Architecture / Security / Product reviews for the **package** | Slice reviews only                                                    |
| Honest limitations recorded                                   | **PASS** — implementation report                                      |
| No Master Plan change                                         | **PASS**                                                              |

---

## Package Summary Standard (S01-b answers)

These answers are for **this slice**. They are not a V3-S01 Close.

1. **What did the customer receive?**  
   Sign-in in the product UI with per-account lockout after 5 failed passwords, a 15-minute cooldown, generic “Invalid email or password.” errors, structured login/lockout logs, and no password in API responses.

2. **What did the customer NOT receive?**  
   Refresh tokens, session management, server logout, password recovery, email verification, MFA, OAuth, passkeys, trusted devices, or remember me.

3. **What business problem was solved?**  
   A single account could be password-sprayed without a cooldown. That product path is closed.

4. **What remains?**  
   S01-c revocable sessions and secure transport; S01-d session management UI; S01-e recovery and authenticated password change. Then V3-S02.

5. **Which slice becomes available next?**  
   **S01-c Session issuance, refresh, secure transport.** Not V3-S02.

6. **Was the Master Plan respected?**  
   **Yes.** Login and lockout only. Refresh, recovery, and MFA were not added.

7. **Were Product Principles respected?**  
   **Yes.** Customer First, Security Before Convenience, Honest Product, No Hidden Configuration, and Architecture Is a Constraint were applied. Live remains unearned.

8. **Were any architectural deviations introduced?**  
   **No.**

---

**STOP.** Wait for review before beginning S01-c Session Management.

**End of S01-b Validation Report.**
