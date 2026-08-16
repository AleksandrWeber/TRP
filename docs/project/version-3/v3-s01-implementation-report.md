# V3-S01 Implementation Report

**Package:** V3-S01 Authentication & Session  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Status:** Package implementation complete — Close recorded separately  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Package:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)  
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report rolls up **S01-a … S01-e**. Slice reports remain the per-slice record and are not rewritten.

---

## What shipped

Operators can register, sign in (with lockout), keep a revocable sign-in, see and end sign-ins, recover a password when host mail is configured, and change a password while signed in. Auth remains the only authentication owner.

| Slice | Customer result                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------- |
| S01-a | Product password policy on Create account                                                       |
| S01-b | Login lockout; generic “Invalid email or password.”                                             |
| S01-c | Revocable sessions, short access, refresh rotation, reuse → family revoke, secure cookies, CSRF |
| S01-d | Sign-in sessions page: list, end one, end others, sign out everywhere                           |
| S01-e | Forgot / reset (honest unavailable if mail off); signed-in Password page                        |

---

## Close-time corrections (not new scope)

Found while executing the package walkthrough against a booting product:

| Issue                                                                                                               | Fix                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Nest watch failed to type `jwt.signAsync` `expiresIn` (string vs `StringValue`)                                     | Same `as never` stance already used in `AuthModule`    |
| **End this sign-in** returned a generic 400 because DELETE sent `Content-Type: application/json` with an empty body | DELETE now sends `{}` like the other session mutations |

---

## Honest limitations

- Unauthenticated recovery requires host mail. This host under Close test had mail off; the product said recovery was unavailable and did not claim an email was sent.
- MFA, OAuth, passkeys, trusted devices, remember me, vault, RBAC, and Connection Management are out.
- Wave 1 is not exited.

---

## What this package did not do

V3-S02 was not started. Master Plan, Version 2 certification, Spec v2.0, and accepted slice reports were not rewritten. No RC. No ADR.

---

**End of V3-S01 Implementation Report.**
