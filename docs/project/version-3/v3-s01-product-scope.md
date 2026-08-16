# V3-S01 Product Scope

**Package:** V3-S01 Authentication & Session  
**Wave:** 1 — Security Foundation  
**Status:** Implementation package — **not implementation**  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Umbrella:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)

This document freezes **IN / OUT** and **customer-visible acceptance** for V3-S01. It does not add journeys the Master Plan did not already name.

---

## Customer outcomes (Master Plan)

From Master Plan §14 and Wave 1 security outcomes that **this package** owns:

- I can register an account that survives restart.
- I can log in securely (no shared default password on the product path).
- I can recover an account through a supported recovery path.
- I can see and sign out sessions (including sign out everywhere).

**Must not (Master Plan §14):** enable live UI; collect exchange keys; amend Spec v2.0.

Wave 1 outcomes owned by **later** packages (not this one): admin assigns roles (V3-S02); vaulted secrets (V3-S03); production OWASP defaults as a platform (V3-S04); append-only security audit product (V3-S05); cross-workspace isolation hardening (V3-S06).

---

## IN SCOPE

| Capability                        | Customer meaning                                                                                     | Notes                                                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Registration**                  | A new operator creates an account in the product UI.                                                 | Already exists (PC-18). Extend password policy only. Default role remains **Researcher**. Account is durable (Prisma `User`). |
| **Login**                         | An existing operator signs in with email and password.                                               | Already exists. Add lockout. Keep generic failure copy. No prefilled `admin@trp.local`.                                       |
| **Logout**                        | Sign out ends the **server** session, not only the browser token.                                    | New. Today logout only clears `localStorage`.                                                                                 |
| **Session list**                  | The signed-in user sees their active sessions.                                                       | New. Each row is recognizable (created, last seen, coarse client metadata such as user-agent / IP).                           |
| **Session revoke**                | The user can revoke one session or sign out everywhere.                                              | New. Stolen or leftover sessions cannot keep calling the API after revoke.                                                    |
| **Refresh token rotation**        | Sessions can continue without an 8-hour static JWT; refresh tokens rotate.                           | New. Required by Security Vision session controls.                                                                            |
| **Session expiration**            | Access is short-lived; idle or expired refresh cannot be reused.                                     | New policy on top of today’s 8h access JWT.                                                                                   |
| **Password recovery**             | A user who cannot sign in can reset a password without SSH or a database edit.                       | New. Documented recovery path (Master Plan F7 / Security Vision).                                                             |
| **Authenticated password change** | A signed-in user can change their password.                                                          | New companion to recovery. Existing sessions other than the current one are revoked after change.                             |
| **Password policy**               | Passwords are stronger than “length ≥ 8” alone.                                                      | Security Vision: add complexity. Keep bcrypt.                                                                                 |
| **Account lockout**               | Repeated failed logins lock the account for a cooldown.                                              | Security Vision. Fail closed. Honest, generic errors.                                                                         |
| **Secure session transport**      | Production session cookies/headers are secure-by-default **for the transport this package chooses**. | Wave 1 S01 exit: revocation plus secure cookies/headers. CSRF stance is required if cookies are used.                         |
| **Workspace binding on requests** | `X-Workspace-Id` remains authorized server-side.                                                     | Already exists (`WorkspaceAccessService`). Do not invent a second membership model.                                           |
| **MFA-capable session model**     | Sign-in issues a session that can later require a second factor.                                     | Journey J3-01 says **MFA-capable**, not “MFA shipped”. No TOTP product in this package.                                       |

### Recovery path (the one allowed path)

Notification Email (V3-N02) is **Wave 5** and is **out**. V3-S01 must still offer recovery without SSH.

**Supported path:**

1. User requests reset with the account email.
2. Authentication issues a **time-limited, single-use** reset token (Auth-owned persistence, not a new domain).
3. Delivery uses **host transactional mail** — host infrastructure, like `DATABASE_URL` and JWT signing. This is **not** the Notification Platform, not Telegram, and not a customer `.env` vendor secret.
4. User sets a new password in the product UI. All sessions for that user are revoked.
5. If host mail is not configured, the product **does not pretend** the email was sent (Honest Product). Recovery is shown as unavailable until the host configures mail. The customer still never SSHs or edits the database.

Authenticated password change (user still knows the current password) does not require mail.

---

## OUT OF SCOPE

Do not implement these in V3-S01. Several are real Version 3 work on **later** packages.

| Capability                                                                     | Why out                                                                                                                                                 | Owner later                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Email verification as a gate**                                               | Not a Master Plan S01 outcome. PC-18 registers and signs in immediately. Keep that product behavior.                                                    | Not scheduled                                   |
| **MFA / TOTP / WebAuthn**                                                      | Required before **live** capital; optional for paper. Live is Wave 6. Shipping MFA UI now would invent a product the S01 exit line does not require.    | Live MFA: Wave 6; optional paper MFA not in S01 |
| **OAuth / social login**                                                       | Security Vision: passwordless is not the production customer path.                                                                                      | Not in plan                                     |
| **Passkeys**                                                                   | Same: not the production customer path.                                                                                                                 | Not in plan                                     |
| **Remember me** (longer-lived access)                                          | Security Before Convenience. Session continuation is refresh rotation, not a weaker access token.                                                       | —                                               |
| **Trusted-device enrollment**                                                  | Not in Master Plan S01 outcomes. Session list with client metadata is enough to recognize a session.                                                    | —                                               |
| **Invite-only / approval registration**                                        | Wave 9 teams. Public register remains the V2 product path.                                                                                              | V3-W01+                                         |
| **Workspace roles / People admin UI**                                          | Master Plan next package after S01.                                                                                                                     | **V3-S02**                                      |
| **RBAC surface completion (TD-006 remainder)**                                 | Authorization product, not session product.                                                                                                             | **V3-S02**                                      |
| **Credential Vault / encryption**                                              | Justified new domain, later in Wave 1.                                                                                                                  | **V3-S03**                                      |
| **Platform OWASP (CSP default, SSRF, helmet review, global throttle product)** | Separate package. S01 only secures **its** session transport.                                                                                           | **V3-S04**                                      |
| **Security audit log product**                                                 | Login logs already exist as application logs. Durable audit UI/store is S05. S01 must keep structured login success/failure logs S05 can later persist. | **V3-S05**                                      |
| **Workspace isolation hardening**                                              | Membership checks exist. Isolation product is S06.                                                                                                      | **V3-S06**                                      |
| **Exchange keys, Connections, live UI**                                        | Explicit S01 “must not”.                                                                                                                                | Waves 2 / 4 / 6                                 |
| **Notification SMTP channel**                                                  | Operator alerts, not identity mail.                                                                                                                     | **V3-N02**                                      |
| **ABAC engine**                                                                | Deferred; not justified.                                                                                                                                | Out of Version 3                                |
| **Engineer seed as product login**                                             | Seed `admin@trp.local` remains an engineer tool, not a customer path (PC-18). Do not re-prefill it.                                                     | —                                               |

---

## Product acceptance criteria (customer-visible)

A reviewer who is not an engineer must be able to do all of the following **in the product UI**:

| #   | Outcome                                                                                                                                                        | Fail if                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **Register** with name, email, and a policy-compliant password in under **2 minutes**. The account still works after API restart.                              | Shared/prefilled password; account gone after restart; SSH or SQL required.                    |
| 2   | **Sign in** on the happy path in under **30 seconds**. No JWT jargon. No seed credentials on the form.                                                         | Prefill of `admin@trp.local` / `trp-admin-change-me`; login only via curl.                     |
| 3   | After sign-in, land in the existing paper-first shell with an existing workspace bootstrap.                                                                    | New shell; live trading surfaced.                                                              |
| 4   | **Sign out** from the shell. That session cannot be reused.                                                                                                    | Only the browser forgot the token; the same token still works against the API.                 |
| 5   | Open **Sessions**, see the current session and any others, **revoke one**, and **sign out everywhere**.                                                        | Sessions invisible; revoke requires database or `.env`.                                        |
| 6   | **Change password** while signed in. Other sessions die.                                                                                                       | Other devices keep working on the old password’s sessions.                                     |
| 7   | **Recover** a forgotten password through the documented path (mail when host mail is configured; honest unavailable otherwise). Sign in with the new password. | Recovery requires SSH, `.env` editing by the customer, or a manual `User.passwordHash` update. |
| 8   | After enough failed logins, the account **locks** for a cooldown. The message does not reveal whether the email exists.                                        | Unlimited password spray; different errors for “unknown email” vs “bad password”.              |
| 9   | A revoked or expired session cannot call authenticated APIs.                                                                                                   | Access JWT remains valid for hours after logout.                                               |
| 10  | No live bots, no exchange-key wizards, no vault UI, no role-admin UI.                                                                                          | S02–S06 or Wave 2+ product leaked into S01.                                                    |

**Metrics (Master Plan §6) that this package must not regress:**

- Time to register **< 2 min**
- Time to secure login **< 30 s**
- Credential exposure in product/logs/UI: **0 tolerated** (no password or reset token in responses or logs)
- Security incidents from default misconfig: **0 tolerated** at package release (insecure JWT already rejected in production — keep US158)

---

## Honest product rules for this package

- Do not show **Connected** to an exchange.
- Do not show MFA as available.
- Do not show “email sent” if host mail is not configured.
- Do not present engineer seed as the way customers start.
- Roles remain visible as the user’s current role on `/me`; assigning roles is V3-S02.
