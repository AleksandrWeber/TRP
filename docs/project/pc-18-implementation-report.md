# PC-18 Identity Product — Implementation Report

**Package:** PC-18 Identity Product  
**Wave:** A — Trust and shell (order 1)  
**Date:** 2026-08-15  
**Journey:** J-01 Login — **COMPLETE**  
**Status:** Ready for review (stop before PC-19)  
**Readiness:** Identity 18% → **100%**. Overall 55% → **58%**. J-01 **Complete**.

This package exposes the existing Identity / Authentication capabilities as a customer-facing product. It does not redesign authentication, authorization, JWT, or Identity ownership.

---

## What was exposed

| Surface        | Change                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Durability** | Identity profiles and Auth password hashes persist on the existing Prisma `User` table. Restart preserves accounts.                                                                                    |
| **REST**       | Existing `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me`. No new routes.                                                                                                                          |
| **UI**         | `/login` is a professional sign-in / create-account product. No prefilled admin credentials. No JWT jargon. Logout remains the existing shell control.                                                 |
| **Bootstrap**  | Runtime development identity / password bootstrap is unwired. `shouldBootstrapDevelopmentIdentity` is always false. Engineer `prisma db seed` remains an explicit operator tool, not the product path. |

Ports used: existing `UserDomainService`, `AuthenticationService`, `PasswordCredentialStore`, JWT guard. UI and REST still delegate to those ports. No shadow API.

---

## Persistence (existing SoT)

Identity remains the profile/role owner. Authentication remains the credential owner.

| Record                                                        | Owner          | Store                                                                 |
| ------------------------------------------------------------- | -------------- | --------------------------------------------------------------------- |
| User profile (`id`, `email`, `displayName`, `status`, `role`) | Identity       | Existing Prisma `User` table via `PrismaUserRepository`               |
| Password hash                                                 | Authentication | Existing `User.passwordHash` via `PrismaPasswordCredentialRepository` |

`displayName` and `status` columns were added to the **existing** `User` table so the already-certified Identity aggregate can survive restart. `passwordHash` is nullable until Authentication stores a hash. This is not a new Source of Truth and not a new Identity domain.

Reads stay synchronous after hydrate (same pattern as Workspace) so JWT validation is unchanged.

---

## REST contract

Unchanged:

- `POST /v1/auth/register` — public; email, displayName, password ≥ 8
- `POST /v1/auth/login` — public; email, password ≥ 8
- `GET /v1/auth/me` — JWT
- `GET /v1/auth/admin` — JWT + Admin

Logout remains client-side token clear (existing auth model). No new logout endpoint.

---

## UI

`LoginPage`:

- Empty email and password (no `admin@trp.local` / `trp-admin-change-me`)
- Client validation and loading state
- Clear failures (`Invalid email or password.`, duplicate-account message)
- Create account uses existing `POST /v1/auth/register`
- After success: existing JWT localStorage + workspace bootstrap
- Session remains across browser refresh while the JWT is valid; API restart no longer drops the user

---

## Architecture freeze

| Artifact                        | Edited |
| ------------------------------- | ------ |
| Architecture Specification v2.0 | **No** |
| Authority Matrix                | **No** |
| Alias Dictionary                | **No** |
| RC-19 … RC-28 history           | **No** |

---

## Definition of Done

| #   | Gate                               | Result                                                                                 |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Backend functionality complete     | **TRUE** — durable Identity + credentials                                              |
| 2   | REST transport complete            | **TRUE** — existing `/auth` surface                                                    |
| 3   | UI complete                        | **TRUE** — sign-in, register, logout, errors                                           |
| 4   | Existing application ports exposed | **TRUE** — no shadow API                                                               |
| 5   | Integration wiring complete        | **TRUE** — N/A producer→consumer edges; login uses existing Auth + Workspace bootstrap |
| 6   | Tests PASS                         | **TRUE** — API 2947, web 98                                                            |
| 7   | Documentation updated              | **TRUE** — this report + companions; Spec / Matrix / Alias / RC history untouched      |
| 8   | Release Notes written              | **TRUE** — [`pc-18-release-notes.md`](./pc-18-release-notes.md)                        |
| 9   | CHANGELOG updated                  | **TRUE**                                                                               |
| 10  | Backlog updated                    | **TRUE** — PC-18 Closed                                                                |
| 11  | Canonical user journey works       | **TRUE** — J-01 Complete                                                               |

```text
Package: PC-18
Journey steps enabled: J-01
Definition of Done: ALL items 1–11 TRUE
Spec v2.0 unchanged: YES
Authority Matrix unchanged: YES
Alias Dictionary unchanged: YES
RC-19…RC-28 unaltered: YES
Live Trading implied: NO
Closed by: implementation  Date: 2026-08-15
```

---

## Companions

- [Architecture Impact](./pc-18-architecture-impact.md)
- [Compatibility Report](./pc-18-compatibility-report.md)
- [Tests Summary](./pc-18-tests-summary.md)
- [Validation Report](./pc-18-validation-report.md)
- [Documentation Summary](./pc-18-documentation-summary.md)
- [Release Notes](./pc-18-release-notes.md)
- [Product Readiness Update](./pc-18-product-readiness-update.md)

**STOP.** Next package is PC-19 Operator Shell. Do not begin PC-19 until this package is reviewed.
