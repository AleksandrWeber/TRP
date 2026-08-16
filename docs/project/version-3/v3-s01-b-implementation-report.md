# V3-S01-b Implementation Report

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-b — Login & Lockout  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Status:** Slice implemented — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Package:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)  
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S01-b only**. S01-c through S01-e were not started. V3-S01 is not Closed.

---

## What shipped

PC-18 public login remains the product path. Per-account lockout now stops password spray. The public error stays generic.

| Behavior              | Result                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Secure login          | Unchanged journey: email and password on `/login`; existing length-only passwords still sign in; paper-first shell unchanged          |
| Failed login tracking | Auth-owned `auth_login_lockouts` counts failures per account                                                                          |
| Account lockout       | 5 failed password checks lock the account for 15 minutes                                                                              |
| Lockout recovery      | After cooldown, a correct password signs in and clears the counter. A successful login before lockout also clears the counter         |
| User-friendly errors  | API and UI both use **Invalid email or password.** Unknown email, wrong password, disabled user, and locked account share that string |
| Security logging      | Structured `auth.login` events: `success`, `failure`, `lockout`, `locked`, with user id when known, IP, and user-agent. No passwords  |
| Disabled users        | Still fail closed with the same generic message                                                                                       |

Policy numbers are product behavior in code (`LOGIN_LOCKOUT_MAX_FAILURES`, `LOGIN_LOCKOUT_COOLDOWN_MS`). Not a customer `.env`.

---

## Files touched

| Area                        | Path                                                                          |
| --------------------------- | ----------------------------------------------------------------------------- |
| Lockout policy              | `apps/api/src/modules/auth/login-lockout.ts`                                  |
| Lockout store / persistence | `login-lockout.store.ts`, repositories, Prisma `AuthLoginLockout` + migration |
| Login enforcement           | `apps/api/src/modules/auth/authentication.service.ts`                         |
| Dummy compare               | `apps/api/src/modules/auth/password-credential.store.ts`                      |
| Request metadata            | `apps/api/src/modules/auth/auth.controller.ts`, `auth.module.ts`              |
| Sign-in copy                | `apps/web/src/pages/loginForm.ts`, `LoginPage.tsx`                            |

Tests: `login-lockout.store.spec.ts`, `authentication.service.spec.ts`, `password-credential.store.spec.ts`, `loginForm.spec.ts`, `pc18-identity-persistence.integration.spec.ts`.

---

## Done-when (package slice)

From the Implementation Package S01-b:

| Criterion                                  | Result                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Spray locks                                | **Met** — 5th failure locks                          |
| Cooldown recovers                          | **Met** — correct password after 15 minutes succeeds |
| Message stays “Invalid email or password.” | **Met** — API exception and UI mapping               |
| Disabled users still fail closed           | **Met**                                              |
| Login otherwise unchanged                  | **Met** — no refresh, cookies, or recovery           |

---

## Honest limitations

- Login still issues the existing PC-18 access JWT. Revocable sessions are **S01-c**.
- Lockout is per account, not per IP. Platform auth-route quota tightening remains **V3-S04**.
- A known email can be locked by an attacker (availability tradeoff vs spray). Cooldown then allows the owner back in.
- Unknown emails are not persisted as lockout rows. Global rate limits already exist.
- No live operator browser session was recorded in this task. Product-path tests cover the customer-visible contract. Package Close still needs the full S01 walkthrough.
- Password change and reset do not exist yet (**S01-e**).

---

## What this slice did not do

| Item                                           | Result            |
| ---------------------------------------------- | ----------------- |
| S01-c Sessions / refresh / cookies             | Not started       |
| S01-d Session management UI                    | Not started       |
| S01-e Password recovery / change               | Not started       |
| Refresh tokens / Remember me / Trusted devices | Out of this slice |
| MFA / OAuth / passkeys / email verification    | Out of package    |
| Version 2 documents                            | Unmodified        |
| Master Plan / Policy / Template                | Unmodified        |
| RC / ADR                                       | None              |
| Live UI / vault / role admin                   | None              |

---

## Next slice (not this task)

**S01-c Session issuance, refresh, secure transport.**

Do not start it in this task.

---

**STOP.** Wait for review before beginning S01-c.

**End of S01-b Implementation Report.**
