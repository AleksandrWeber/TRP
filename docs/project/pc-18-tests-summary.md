# PC-18 Identity Product — Tests Summary

**Package:** PC-18  
**Date:** 2026-08-15  
**Verdict:** PASS

---

## Slice tests

| Area                    | Evidence                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Identity domain         | `user-domain.service.spec.ts` — create / get / update / disable                        |
| Role mapping            | `prisma-role.mapping.spec.ts` — Identity ↔ existing Prisma enum                        |
| Development bootstrap   | `development-identity.bootstrap.spec.ts` — gate always false; no user created          |
| Auth bootstrap          | `auth-development.bootstrap.spec.ts` — no development password                         |
| Password store          | `password-credential.store.spec.ts` — verify + hydrate after restart                   |
| Authentication          | `authentication.service.spec.ts` — register / login / JWT / disable                    |
| Persistence integration | `pc18-identity-persistence.integration.spec.ts` — register, new process hydrate, login |
| Login UI                | `LoginPage.spec.tsx` — no developer credentials, no JWT jargon                         |
| Error mapping           | `mapApiError.spec.ts` — 409 duplicate account                                          |

---

## Full suites (this package)

| Suite                                           | Result                         |
| ----------------------------------------------- | ------------------------------ |
| `@trp/api` vitest                               | **442 files, 2947 tests PASS** |
| `@trp/web` vitest                               | **24 files, 98 tests PASS**    |
| `tsc --noEmit` (`apps/api`, `apps/web`)         | PASS                           |
| eslint on changed Identity / Auth / Login files | PASS                           |

Architecture conformance tests were not used as the sole evidence. The persistence integration test and login UI test cover the product slice.

---

## Restart evidence

`PC-18 — Identity credentials survive restart`:

1. Register user against Prisma `User`
2. Construct a new `UserDomainService` + `PasswordCredentialStore`
3. Hydrate from Prisma
4. Login with the same password succeeds; user id is unchanged

---

**End of Tests Summary.**
