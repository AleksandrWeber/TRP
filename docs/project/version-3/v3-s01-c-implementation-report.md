# V3-S01-c Implementation Report

**Package:** V3-S01 Authentication & Session
**Slice:** S01-c — Session issuance, refresh, secure transport
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S01-c only**. S01-d and S01-e were not started. V3-S01 is not Closed.

---

## What shipped

Login and register now issue a revocable Auth session instead of an irrevocable 8h Bearer stored in `localStorage`.

| Behavior                  | Result                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secure session issuance   | Access JWT is bound to a server session id (`sid`). Default access lifetime is **15m**. Leftover `JWT_EXPIRES_IN=8h` is treated as unset                               |
| Refresh                   | `POST /v1/auth/refresh` rotates the refresh secret and issues a new access JWT                                                                                         |
| Refresh rotation          | Previous refresh is invalidated. Reuse of the old refresh revokes the session family                                                                                   |
| Session expiration        | Access is short. Refresh is bounded (7 days). Expired or revoked sessions fail authenticate                                                                            |
| Server-side tracking      | Auth-owned `auth_sessions` rows. Refresh secret stored as SHA-256, never plaintext                                                                                     |
| Revocation infrastructure | Logout revokes the current session. Validate looks up the session on every authenticate                                                                                |
| Secure cookies            | `trp_access`, `trp_refresh`, `trp_csrf`: `HttpOnly`, `SameSite=Strict`; `Secure` in production                                                                         |
| CSRF                      | Cookie-authenticated Auth mutations require `X-CSRF-Token`. Login/register are exempt (password proof). Bearer-only clients without auth cookies skip CSRF             |
| Frontend transport        | Access token is kept in memory. `localStorage` no longer stores `trp_access_token`. Fetch uses `credentials: 'include'`. Expired access refreshes once, then signs out |
| `/me`                     | Still authenticated; now requires a live Auth session, not a stateless JWT                                                                                             |
| Logging                   | Structured `auth.session` events: `create`, `refresh`, `logout`. No access, refresh, CSRF, or password values                                                          |

---

## Files touched

| Area                        | Path                                                                      |
| --------------------------- | ------------------------------------------------------------------------- |
| Session policy              | `apps/api/src/modules/auth/auth-session.ts`                               |
| Session store / persistence | `auth-session.store.ts`, repositories, Prisma `AuthSession` + migration   |
| Cookies / CSRF              | `auth-cookies.ts`, `auth-csrf.guard.ts`                                   |
| Issue / refresh / logout    | `authentication.service.ts`, `auth.controller.ts`, `auth.module.ts`       |
| Session lookup              | `jwt.strategy.ts`                                                         |
| Global CSRF                 | `apps/api/src/app.module.ts`                                              |
| DTO                         | `apps/api/src/validation/dto/auth.dto.ts`                                 |
| Frontend transport          | `apps/web/src/shared/auth.ts`, `api.ts`, `LoginPage.tsx`, `AppLayout.tsx` |
| Example env                 | `.env.example` (`JWT_EXPIRES_IN=15m`)                                     |

Tests: `auth-session.store.spec.ts`, `auth-cookies.spec.ts`, `auth-csrf.guard.spec.ts`, `authentication.service.spec.ts`, `pc18-identity-persistence.integration.spec.ts`, `auth.spec.ts`, `api.spec.ts`.

---

## Done-when (package slice)

From the Implementation Package S01-c:

| Criterion                                                        | Result                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Refresh rotation and reuse detection pass unit/integration tests | **Met**                                                          |
| Authenticated `/me` works via the new transport                  | **Met** — JWT `sid` + session lookup; cookies + in-memory Bearer |
| US158 still holds                                                | **Met** — `jwt-secret.spec.ts` unchanged                         |
| Must not: second auth module                                     | **Met**                                                          |
| Must not: 8h access as the remaining product default             | **Met** — 15m default; `8h` env value coerced to 15m             |

---

## Honest limitations

- Session list, revoke-one, and sign-out-everywhere UI are **S01-d**. The existing Logout control now calls `POST /v1/auth/logout` (infrastructure, not a sessions product).
- Access tokens are still returned in the login JSON for Bearer clients. The product UI does **not** persist them in `localStorage`.
- `mfaSatisfied` is reserved on the session row. MFA is not shipped (Wave 6).
- Password recovery remains **S01-e**.
- No live operator browser session was recorded in this task. Product-path tests cover the customer-visible contract. Package Close still needs the full S01 walkthrough.
- Platform auth-route quota tightening remains **V3-S04**.

---

## What this slice did not do

| Item                                        | Result         |
| ------------------------------------------- | -------------- |
| S01-d Session management UI                 | Not started    |
| S01-e Password recovery / change            | Not started    |
| Remember me / Trusted devices               | Out of package |
| MFA / OAuth / passkeys / email verification | Out of package |
| Version 2 documents                         | Unmodified     |
| Master Plan / Policy / Template             | Unmodified     |
| RC / ADR                                    | None           |
| Live UI / vault / role admin                | None           |

---

## Next slice (not this task)

**S01-d Session management product.**

Do not start it in this task.

---

**STOP.** Wait for review before beginning S01-d.

**End of S01-c Implementation Report.**
