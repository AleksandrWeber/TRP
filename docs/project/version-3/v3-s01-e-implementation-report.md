# V3-S01-e Implementation Report

**Package:** V3-S01 Authentication & Session
**Slice:** S01-e — Password recovery and authenticated password change
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Status:** Slice implemented — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Package:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)
**Nature:** Implementation report. Not an RC. Not an ADR. Not a Master Plan revision.

This report covers **S01-e only**. V3-S02 was not started. V3-S01 is not Closed until this slice is reviewed.

---

## What shipped

Operators can recover a forgotten password when host mail is configured, see an honest unavailable state when it is not, and change a password while signed in. Auth remains the only owner. Reset tokens are hashed, single-use, and time-limited. Notification Delivery is not used.

| Behavior               | Result                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forgot password        | `/forgot-password` from Sign in. Email only                                                                                                         |
| Recovery request       | `POST /v1/auth/forgot-password`. Same public copy for known and unknown emails when mail is on                                                      |
| Host mail              | Port inside Auth. `MAIL_HOST` unset → recovery unavailable. Not Notification SMTP, not Telegram                                                     |
| Reset token            | 32-byte secret, SHA-256 at rest, 1 hour, single use. Previous outstanding token for the user is consumed                                            |
| Reset completion       | `/reset-password?token=…`. Product password policy. All sessions revoked. Lockout cleared                                                           |
| Authenticated change   | Preferences → **Password**. Current password required. Other sessions revoked; this device stays signed in                                          |
| Confirmations / errors | Confirm before change. Invalid/expired/reused link: **This recovery link is invalid or has expired.** Mail off does **not** claim an email was sent |
| Tokens in JSON/logs    | **Never**                                                                                                                                           |

---

## Files touched

| Area                 | Path                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Reset policy / store | `password-reset.ts`, `password-reset.store.ts`, repositories, Prisma `AuthPasswordReset` + migration |
| Host mail            | `host-mail.ts`, `host-mail.factory.ts`, `host-mail.smtp.ts`                                          |
| Application          | `authentication.service.ts` request/reset/change                                                     |
| HTTP                 | `GET /v1/auth/recovery`, `POST /forgot-password`, `POST /reset-password`, `POST /change-password`    |
| UI                   | `ForgotPasswordPage`, `ResetPasswordPage`, `PasswordPage`, Login **Forgot password?**                |
| Example env          | `.env.example` `MAIL_*` / `PUBLIC_APP_URL` (commented; optional host infra)                          |

---

## Done-when (package slice)

| Criterion                                                                | Result                                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Walkthrough steps 7–8 (change + recover)                                 | **Met** at product-path tests. Live operator browser session **not** recorded |
| Tokens never returned in JSON or logs                                    | **Met**                                                                       |
| Host mail off is honest unavailable                                      | **Met**                                                                       |
| Must not: Notification module, second session owner, new bounded context | **Met**                                                                       |

---

## Honest limitations

- Without `MAIL_HOST`, recovery is unavailable. That is the approved honest path, not a fake “sent”.
- SMTP send failures for a real account are logged without the link and still return the generic accepted copy so existence is not leaked.
- No live operator browser session was recorded. Package Close still needs the full S01 walkthrough.
- MFA / OAuth / passkeys remain out.

---

## What this slice did not do

| Item                                                   | Result         |
| ------------------------------------------------------ | -------------- |
| V3-S02 RBAC                                            | Not started    |
| MFA / OAuth / passkeys / trusted devices / remember me | Out of package |
| Notification Email channel                             | Out — V3-N02   |
| Master Plan / accepted S01-a…d reports                 | Unmodified     |
| RC / ADR                                               | None           |

---

## Next (not this task)

After this slice is **accepted**, V3-S01 can Close. The next package is **V3-S02 RBAC Product**.

Do not start it in this task.

---

**STOP.** Wait for review before beginning V3-S02.

**End of S01-e Implementation Report.**
