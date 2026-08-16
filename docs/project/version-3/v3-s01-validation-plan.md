# V3-S01 Validation Plan

**Package:** V3-S01 Authentication & Session  
**Wave:** 1 — Security Foundation  
**Status:** Planning — **not** executed  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Scope:** [`v3-s01-product-scope.md`](./v3-s01-product-scope.md)  
**Security:** [`v3-s01-security-review.md`](./v3-s01-security-review.md)  
**Umbrella:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)

Validation runs after implementation and the implementation report. This package is **not Closed** until every section below has a recorded result.

---

## 1. Unit tests

Extend existing Auth/Identity specs; do not replace them.

| Area               | Must prove                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Password policy    | Compliant passwords accepted; non-compliant rejected on register, change, and reset.                         |
| bcrypt             | Hashes are not reversible; verify still uses `PasswordCredentialStore`.                                      |
| Lockout            | Nth failure locks; cooldown then allows a correct password; lockout does not change the public error string. |
| Session issue      | Access is short-lived; refresh is stored hashed; session bound to user.                                      |
| Refresh rotation   | New refresh invalidates old; reuse of old refresh revokes the family.                                        |
| Revoke             | Revoked session id fails authenticate; other users’ sessions unaffected.                                     |
| Logout-all         | All sessions for the user fail; other users unaffected.                                                      |
| Recovery token     | Expired / used / unknown token fails; success sets password and consumes token.                              |
| Disabled user      | Cannot login; existing sessions fail validation (keep PC-18 behavior, extend to new session store).          |
| JWT secret         | US158 still rejects production default/short secrets (`jwt-secret.spec.ts`).                                 |
| No second Identity | Tests still go through `UserDomainService` + `AuthenticationService`.                                        |

Primary files today: `authentication.service.spec.ts`, `password-credential.store.spec.ts`, `jwt-secret.spec.ts`, `jwt-auth.guard` / `jwt.strategy` specs if present.

---

## 2. Integration tests

Prisma-backed tests (same pattern as `pc18-identity-persistence.integration.spec.ts`).

| Case                             | Must prove                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Register survives API restart    | User + password hash + **session records** still authenticate after process restart.                       |
| Login issues a revocable session | Row exists in Auth session persistence.                                                                    |
| Logout HTTP                      | `POST` logout (or equivalent) makes the next authenticated call 401.                                       |
| Revoke HTTP                      | List → revoke id → that refresh/access fails.                                                              |
| Recover HTTP                     | Request → complete with token → login with new password; old sessions 401.                                 |
| Host mail off                    | Recover request does **not** return a reset token in the JSON body; UI-safe message; no fake “sent”.       |
| Workspace header                 | Authenticated calls still require authorized `X-Workspace-Id` (no regression of `WorkspaceAccessService`). |
| Public surface                   | Unauthenticated register/login/recover still `@Public()`; `/me` and session routes are not.                |

---

## 3. UI tests

Frontend unit/component tests plus any existing Playwright path used for J-01.

| Case              | Must prove                                                                              |
| ----------------- | --------------------------------------------------------------------------------------- |
| Login page        | No `admin@trp.local` / `trp-admin-change-me` prefill (keep `LoginPage.spec.tsx`).       |
| Register          | Policy errors shown in product language, not JWT jargon.                                |
| Sign-in           | Happy path still reaches the paper-first shell.                                         |
| Logout            | Shell control calls server logout, then `/login`; token/cookie gone.                    |
| Sessions page     | Lists sessions; revoke one; sign out everywhere.                                        |
| Forgot / reset    | Forms exist; honest empty state when recovery is unavailable.                           |
| Change password   | Reachable from the signed-in product (account/security), not a hidden route-only trick. |
| No leaked S02–S06 | No role-admin, vault, or live controls introduced by this package.                      |

Do not require a full Playwright rewrite of J-02…J-14. Do require that J-01 still passes and that the new session/recovery journeys are covered at least at component or e2e smoke level.

---

## 4. Manual product walkthrough

Perform as an ordinary operator. **No SSH. No `.env`. No SQL.**

1. Create a new account (policy-compliant password). Confirm time **< 2 min**.
2. Restart the API. Sign in again (**< 30 s**). Confirm the same account.
3. Open Sessions. Confirm the current session is listed.
4. Sign in from a second browser (or private window). Confirm two sessions.
5. Revoke the other session. Confirm the second browser is signed out.
6. Sign out everywhere. Confirm both are signed out.
7. Sign in. Change password. Confirm the other session (if any) dies.
8. Sign out. Use Forgot password. If host mail is on: complete reset from the message, sign in with the new password. If host mail is off: confirm the product says recovery is unavailable — it must not claim an email was sent.
9. Fail login repeatedly. Confirm lockout, then wait cooldown and sign in correctly.
10. Confirm the paper-first shell, workspace switcher, and certified V2 journeys are still the product. Confirm **no** live trading, **no** exchange keys, **no** vault.

Record pass/fail in the package closeout. Any SSH or database step is an automatic fail of Customer First.

---

## 5. Security verification

| Check                            | Pass                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Revoked session                  | API 401 with old access and old refresh                                                                                     |
| Refresh reuse                    | Family revoked                                                                                                              |
| Cookie flags (production config) | `Secure` `HttpOnly` `SameSite=Strict` on auth cookies                                                                       |
| CSRF                             | Forged cross-site mutation rejected if cookies are used                                                                     |
| Lockout                          | Spray does not yield a session                                                                                              |
| Reset token                      | Not in logs; hashed at rest; single use                                                                                     |
| Password                         | Never in responses or logs                                                                                                  |
| JWT secret                       | Production still refuses default/short secret                                                                               |
| Enumeration                      | Register may still 409 on duplicate email (existing PC-18); login/recover messages stay generic for unknown vs bad password |
| MFA theater                      | No fake MFA UI                                                                                                              |
| Seed                             | Product login form still empty                                                                                              |

---

## 6. Architecture verification

| Check                                           | Pass                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| Owner                                           | Sessions, refresh, reset tokens owned by **Authentication**               |
| Identity                                        | Still owns profile/role/status; still password-free                       |
| No new bounded context                          | No “IAM”, “SSO”, or “Device Trust” module                                 |
| No duplicate auth                               | Still one `AuthModule` / `AuthenticationService` path                     |
| No trading-session confusion                    | Auth sessions ≠ `SessionRecoveryState` / trading Session                  |
| SoT                                             | Ledger, Risk, Gate, Library untouched                                     |
| Spec v2.0 / Authority Matrix / Alias Dictionary | Unchanged                                                                 |
| Workspace                                       | Still PC-14 owner model; no membership table invented here                |
| Mail                                            | Host transactional port on Auth — **not** Notification Delivery / catalog |
| HTTP                                            | Transport only; UI not Source of Truth                                    |

---

## 7. Customer acceptance

Product Owner (or delegate) signs that Master Plan S01 outcomes are true:

- [ ] I can register an account that survives restart.
- [ ] I can log in securely (no shared default password on the product path).
- [ ] I can recover an account through a supported recovery path (or the product honestly says recovery is unavailable until host mail is configured — and that limitation is accepted for the host under test).
- [ ] I can see and sign out sessions (including sign out everywhere).
- [ ] I did not use SSH, customer `.env`, or manual database edits.
- [ ] Live UI, exchange keys, and Spec v2.0 were not touched.

Metrics: time-to-register and time-to-login recorded against Master Plan §6.

---

## 8. Close criteria

V3-S01 may **Close** only when:

1. All implementation slices S01-a … S01-e are merged and independently reviewed.
2. Unit, integration, and UI tests above are green in CI.
3. Manual walkthrough is recorded.
4. Architecture Review, Security Review, and Product Review (post-implementation) are recorded against this plan.
5. Implementation Report lists honest limitations (especially host-mail dependency for unauthenticated recovery).
6. No Master Plan change was required. If one was required, this validation is void until the plan is revised and the package is re-approved.

Next package after Close: **V3-S02 RBAC Product** — start at Implementation Package, not at code.
