# V3-S01-a Implementation Report

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-a — Registration & Password Policy  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Status:** Slice implemented — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Package:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)  
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S01-a only**. S01-b through S01-e were not started. V3-S01 is not Closed.

---

## What shipped

PC-18 public registration remains the product path. The product password policy is now stronger than length ≥ 8.

| Behavior                | Result                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| User registration       | Unchanged journey: name, email, password in the product UI; default role **Researcher**; durable `User` + bcrypt hash |
| Password policy         | At least 8 characters **and** a letter **and** a number; engineer seed `trp-admin-change-me` rejected on register     |
| Secure hashing          | bcrypt cost 10 via existing `PasswordCredentialStore`                                                                 |
| Registration validation | API DTO + service + UI form; operator-language messages                                                               |
| Duplicate accounts      | Existing 409; UI still shows “An account with this email already exists.”                                             |
| Email verification gate | **Not implemented** — out of the approved package (see Honest limitations)                                            |

---

## Files touched

| Area                       | Path                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| Policy (API)               | `apps/api/src/modules/auth/password-policy.ts`                        |
| Policy (UI)                | `apps/web/src/shared/passwordPolicy.ts`                               |
| Register enforcement       | `apps/api/src/modules/auth/authentication.service.ts`                 |
| Register DTO               | `apps/api/src/validation/dto/auth.dto.ts`                             |
| Validator                  | `apps/api/src/validation/is-product-password.validator.ts`            |
| Password redaction in 400s | `apps/api/src/validation/class-validator-error.mapper.ts`             |
| Register UI                | `apps/web/src/pages/LoginPage.tsx`, `apps/web/src/pages/loginForm.ts` |
| API error mapping          | `apps/web/src/shared/mapApiError.ts`                                  |

Tests: `password-policy.spec.ts`, `authentication.service.spec.ts`, `password-credential.store.spec.ts`, `validation.spec.ts`, `passwordPolicy.spec.ts`, `loginForm.spec.ts`, `LoginPage.spec.tsx`, `mapApiError.spec.ts`. PC-18 persistence integration remains green.

---

## Done-when (package slice)

From the Implementation Package S01-a:

| Criterion                                    | Result                                                           |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Weak passwords fail in API and UI            | **Met**                                                          |
| Durable register still works                 | **Met** (PC-18 integration still green; default Researcher kept) |
| No new routes                                | **Met**                                                          |
| Empty login form / no seed prefill           | **Met**                                                          |
| Login, lockout, sessions, recovery unchanged | **Met** — not started                                            |

---

## Honest limitations

- Register still issues the existing PC-18 access JWT. Revocable sessions are **S01-c**.
- Login lockout is **S01-b**. Login still accepts existing length-only passwords so current accounts can sign in.
- `setPassword` (engineer seed / bootstrap) is **not** the product path and still allows `trp-admin-change-me`.
- Password change and reset do not exist yet. They will reuse `evaluateProductPasswordPolicy` in **S01-e**.
- No browser-operated manual walkthrough was recorded in this task. Automated tests cover the S01-a messages and API rules.
- **Email verification as a sign-in gate was not implemented.** The task prompt named an email verification flow. The approved Implementation Package and Product Scope put that gate **out of S01**. PC-18 still registers and signs in immediately. Host transactional mail is the planned infrastructure for **password recovery (S01-e)**, not an email-verification product.

---

## What this slice did not do

| Item                               | Result         |
| ---------------------------------- | -------------- |
| S01-b Login & Lockout              | Not started    |
| S01-c Sessions / refresh / cookies | Not started    |
| S01-d Session management UI        | Not started    |
| S01-e Password recovery / change   | Not started    |
| MFA / OAuth / passkeys             | Out of package |
| Version 2 documents                | Unmodified     |
| Master Plan / Policy / Template    | Unmodified     |
| RC / ADR                           | None           |
| Live UI / vault / role admin       | None           |

---

## Next slice (not this task)

**S01-b Login & Lockout.**

Do not start it in this task.

---

**STOP.** Wait for review before beginning S01-b.

**End of S01-a Implementation Report.**
