# V3-S01 Authentication & Session — Implementation Package

**Package:** V3-S01  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Status:** **READY FOR IMPLEMENTATION** — pending **Approval** (no production code in this task)  
**Nature:** Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.  
**Process:** [`version-3-implementation-policy.md`](./version-3-implementation-policy.md)

**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Annexes used (read-only):** Execution Roadmap, Security Vision, Capability Inventory, Product Roadmap.

**Companions:**

| Document                                                   | Role                             |
| ---------------------------------------------------------- | -------------------------------- |
| [`v3-s01-product-scope.md`](./v3-s01-product-scope.md)     | IN / OUT and customer acceptance |
| [`v3-s01-security-review.md`](./v3-s01-security-review.md) | Security Vision applied to S01   |
| [`v3-s01-validation-plan.md`](./v3-s01-validation-plan.md) | How Close is proven              |

**Planning question:** Can implementation of V3-S01 begin immediately **without changing planning**?

**Answer: YES.** Scope, owners, and exit criteria are already in the frozen Master Plan. This package only sequences work inside that freeze.

**STOP.** Do not write production code until this package is **Approved**.

---

## Part 1 — Master Plan verification

V3-S01 in this package **matches** Master Plan §14, Wave 1, SEC-01 / SEC-05, and freeze F7 (account recovery on S01).

| Field        | Master Plan / annex                        | This package                                                     |
| ------------ | ------------------------------------------ | ---------------------------------------------------------------- |
| ID           | V3-S01                                     | V3-S01                                                           |
| Name         | Authentication & Session                   | Authentication & Session                                         |
| Wave         | **1** Security Foundation                  | 1                                                                |
| Capabilities | SEC-01, SEC-05 (includes account recovery) | Same. Recovery is in scope. MFA product is **not** (see Part 3). |
| Complexity   | M                                          | M                                                                |
| After this   | V3-S02 RBAC Product                        | Unchanged                                                        |

### Objectives

1. Prove who the operator is with production-grade **password** credentials (SEC-01).
2. Issue, refresh, revoke, and expire **sessions** so a stolen or leftover token cannot keep acting (SEC-05).
3. Let a customer **register, log in, recover an account, and manage sessions** in the product (Master Plan §14 and Wave 1 exit lines owned by S01).
4. Keep Identity/Auth as the existing owner. Do not enable live UI, collect exchange keys, or amend Spec v2.0.

### Dependencies

From Execution Roadmap Wave 1:

- Version 2 Identity (**PC-18**) — durable `User`, register, login, `/me`
- Workspace (**PC-14**) — `WorkspaceAccessService`, `X-Workspace-Id`
- Existing `Role` enum, `JwtAuthGuard`, `RolesGuard`, `CommandAuthorizationService`
- helmet, rate-limit, ValidationPipe (keep; do not turn S01 into V3-S04)

S01 does **not** depend on Vault, Connections, or Email Notification (V3-N02). Recovery uses host transactional mail as infrastructure (Part 3).

### Product principles affected

| Principle                        | How S01 applies it                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Customer First**               | Register, login, recovery, session revoke in the UI. No SSH, no customer `.env`, no SQL. Host JWT/mail/DB remain server-operated. |
| **Security Before Convenience**  | Lockout, short access, refresh rotation, revoke. No “remember me” that lengthens access. No passwordless customer path.           |
| **One Source of Truth**          | One Authentication module. One Identity profile. Auth sessions are not trading sessions.                                          |
| **Paper First**                  | Unchanged. S01 does not touch execution.                                                                                          |
| **Live Must Be Earned**          | S01 must not unhide live UI.                                                                                                      |
| **Honest Product**               | No fake “email sent”. No MFA theater. Seed admin is not the product path.                                                         |
| **AI Never Controls Capital**    | Untouched.                                                                                                                        |
| **Everything Is Auditable**      | Structured auth events (login, lockout, revoke, recover). Audit **product** is V3-S05.                                            |
| **No Hidden Configuration**      | Session and recovery settings are product behavior, not a customer `.env` ritual. Host mail is host infrastructure.               |
| **Architecture Is a Constraint** | Major **extension** of Identity/Auth (Master Plan §10). No new IAM bounded context.                                               |

### Execution wave

**Wave 1 — Security Foundation.** Package order remains S01 → S02 → S03 → S04 → S05 → S06. S01 is first. It does not close the wave.

### Business value

Stops shared/dev identity and irrevocable JWTs from standing in front of later secrets and capital. Unblocks the rest of Wave 1 (RBAC, vault, isolation) with a revocable operator session.

Master Plan metrics S01 must meet or not regress: time to register **< 2 min**; time to secure login **< 30 s**; credential exposure **0**; default misconfig incidents **0**.

### Exit criteria (this package)

Customer (Master Plan §14 / Wave 1 lines S01 owns):

- [ ] A customer can register, log in, recover an account, and manage sessions.
- [ ] Sessions can be revoked; production cookies/headers are secure-by-default **for the session transport**.
- [ ] No live trading UI enabled. No `.env` as the customer secret path.

Technical (SEC-01 / SEC-05):

- [ ] Password policy + lockout on the existing bcrypt users.
- [ ] Short access + refresh rotation + server-side revocation.
- [ ] Self-service session list, revoke one, revoke all, server logout.
- [ ] Documented recovery path without SSH or manual DB edits.

**Not** S01 exit (later Wave 1): Admin assigns Reader/Researcher/Trader/Admin (S02); encrypted vault secret (S03); global CSP/OWASP product (S04); append-only audit product (S05); cross-workspace isolation suite (S06).

---

## Part 2 — Current state analysis (Version 2)

Certified baseline: PC-18 Identity Product, `v2.0.1`. Architecture: Auth JWT on Identity; Identity is password-free; passwords live in `PasswordCredentialStore` on `User.passwordHash`.

| Capability             | Status                           | Evidence                                                                                                                                                  |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**     | **Already exists**               | `POST /v1/auth/register`, `/login`; `GET /v1/auth/me`; `AuthenticationService`; global `JwtAuthGuard`; UI `/login`.                                       |
| **Authorization**      | **Needs extension** (not in S01) | `RolesGuard`, `CommandAuthorizationService` (Trader/Admin + workspace). TD-006 remainder and People UI → **V3-S02**.                                      |
| **Sessions**           | **Missing**                      | Stateless JWT only. No Auth session table. `SessionRecovery*` is **trading** recovery, not login.                                                         |
| **JWT**                | **Needs extension**              | Bearer access JWT, payload `{ sub, email, role }`, default TTL **8h** (`JWT_EXPIRES_IN`). `JwtStrategy.validate` re-loads Identity (disabled users fail). |
| **Refresh tokens**     | **Missing**                      | No model, no rotation. Historical auth notes postponed them.                                                                                              |
| **Password storage**   | **Already exists**               | bcrypt cost 10; `PasswordCredentialStore`; Prisma `User.passwordHash`.                                                                                    |
| **Password reset**     | **Missing**                      | No token, no UI, no mail.                                                                                                                                 |
| **Registration**       | **Already exists**               | Public register; default **Researcher**; UI create-account mode; duplicate email 409.                                                                     |
| **Email verification** | **Missing**                      | Out of S01 (Part 3).                                                                                                                                      |
| **Device management**  | **Missing**                      | No trusted-device product. S01 ships **session inventory metadata**, not device trust.                                                                    |
| **Logout**             | **Needs extension**              | `AppLayout` only `clearAccessToken()` (`localStorage`). No `POST /v1/auth/logout`.                                                                        |
| **Session revocation** | **Missing**                      | Disable user blocks **future** validate; outstanding JWT still works until 8h expiry.                                                                     |
| **MFA**                | **Missing**                      | Out of S01 product. Session model must stay MFA-capable.                                                                                                  |
| **RBAC**               | **Needs extension** (not in S01) | Roles in code. No assign-role product. → **V3-S02**.                                                                                                      |
| **Audit logging**      | **Needs extension** (not in S01) | App logs for register/login success/failure only. Durable audit → **V3-S05**. S01 keeps structured logs.                                                  |
| **Secret handling**    | **Already exists** (JWT)         | US158 / TD-005: production rejects default/short `JWT_SECRET`. Customer vendor secrets still `.env` → **V3-S03**.                                         |
| **Workspace identity** | **Already exists**               | `WorkspaceRecord.ownerUserId`; `X-Workspace-Id`; owner-only membership. Isolation hardening → **V3-S06**. Teams → Wave 9.                                 |

### Version 2 facts implementers must not forget

- Transport today: `Authorization: Bearer` + `localStorage` key `trp_access_token`. No auth cookies.
- Password policy today: `@MinLength(8)` only.
- Rate limit today: global Fastify + Throttler (~200/min). No per-account lockout.
- Engineer seed `admin@trp.local` / `trp-admin-change-me` exists in `prisma/seed.ts`. Product form must stay empty (PC-18 tests).
- Runtime identity bootstrap is unwired (`shouldBootstrapDevelopmentIdentity` always false).
- Ownership split is certified: **Identity** = profile/role/status; **Authentication** = password hash + tokens.

---

## Part 3 — Scope

Detail: [`v3-s01-product-scope.md`](./v3-s01-product-scope.md). Summary:

### IN SCOPE

Registration (extend policy) · Login (add lockout) · Logout (server) · Session list · Session revoke (one + all) · Password recovery (host transactional mail + authenticated change) · Refresh rotation · Session expiration · Account lockout · Password policy · Secure session transport (cookies/headers for the chosen transport) · Session inventory client metadata · MFA-**capable** session records · Keep workspace header authorization.

### OUT OF SCOPE

Email verification gate · MFA/TOTP/passkeys/OAuth · Remember me · Trusted-device enrollment · Invite-only registration · Workspace role admin · RBAC product (S02) · Vault (S03) · Platform OWASP (S04) · Audit product (S05) · Isolation product (S06) · Exchange keys / live UI · Notification SMTP (N02) · ABAC · Seed as product login.

Nothing above is invented. Recovery is Master Plan F7 / §14. Host mail is host infrastructure (same class as JWT signing), **not** a new Notification domain.

---

## Part 4 — Product acceptance criteria

Detail: [`v3-s01-product-scope.md`](./v3-s01-product-scope.md).

The customer can:

1. Register a durable account without a shared password.
2. Sign in securely into the existing paper-first shell.
3. Sign out so the **server** rejects that session.
4. See sessions and revoke them, including everywhere.
5. Change password while signed in (other sessions die).
6. Recover a forgotten password in the product when host mail is configured; see an **honest** unavailable state when it is not.
7. Be locked out after password spray, with generic errors.

The customer never uses SSH, `.env`, or manual database edits for those journeys.

The product does not grow live trading, connection wizards, vault, or role administration in this package.

---

## Part 5 — Security review

Detail: [`v3-s01-security-review.md`](./v3-s01-security-review.md).

S01 implements Security Vision **Authentication** and **Session Management** plus the S01-owned pieces of Secure by Default / Zero Trust / Least Privilege / Everything Is Auditable:

- bcrypt kept; complexity + lockout added
- short access; refresh rotation; reuse detection
- revoke and logout-all
- hashed refresh and reset tokens
- production cookie flags if cookies are used; CSRF if cookies are used; production must not leave access tokens in JS storage
- US158 JWT secret rules kept
- structured auth logs for S05; no audit product here
- default role Researcher; no Admin-by-register
- MFA not shipped; session can carry a future second factor

Replay protection for **live orders** stays V3-L05. Vault, CSP-as-product, SSRF, RBAC UI stay later packages.

---

## Part 6 — Architecture review

### Constraints (Master Plan §10–11, §16)

| Rule                                    | S01 decision                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless justified | **None.** Credential Vault is the only new security domain in Version 3, and it is **V3-S03**.                                                                                                                             |
| No ownership drift                      | Identity keeps profile/role/status. Authentication keeps credentials **and** gains session/refresh/reset persistence. Trading Session / recovery incidents stay trading. Notification Delivery does not own identity mail. |
| No duplicate authentication             | Extend `AuthModule` / `AuthenticationService` / `JwtAuthGuard` (or replace the guard **in place**). Do not add a second login stack.                                                                                       |
| No duplicate session owner              | New **Auth session** records ≠ runtime/trading session ≠ `SessionRecoveryState`.                                                                                                                                           |
| No Source of Truth changes              | Ledger, Risk, Gate, Library, Workspace aggregate unchanged. `User` table may gain **no** competing identity store. New tables are Auth persistence, not a new SoT for people.                                              |
| Spec v2.0 / Matrix / Alias              | **Unchanged.** No ADR. No RC.                                                                                                                                                                                              |

### Justified additions (not new domains)

These are persistence and ports **inside Authentication**:

1. **Auth session store** (session id, user id, refresh hash, expires, revoked, user-agent, IP, timestamps). Required for SEC-05 revocation. Cannot be done with stateless 8h JWT.
2. **Password reset token store** (hashed token, expiry, consumed). Required for Master Plan recovery.
3. **Lockout state** (failed attempts, locked-until) — Auth-owned, may live on session/auth tables or user-adjacent Auth columns. Not a new Identity product.
4. **Host transactional mail port** used only for reset messages. Infrastructure, like `JWT_SECRET`. **Must not** go through Notification catalog, Telegram, or Wave 5 adapters.

### Implementation choice (allowed by Security Vision)

Token type: continue JWT **or** opaque server sessions, provided **revocation works**.

**Recommended (not a plan change):** short-lived access JWT including `sid` (session id), rotating hashed refresh, production **httpOnly Secure SameSite=Strict** cookies. Global guard keeps one authenticate path: load session by `sid`, reject if revoked.

**Forbidden:** a parallel OAuth/SSO service; a Device Trust context; moving passwords into Identity; using trading session recovery as login sessions.

### HTTP and UI

HTTP remains transport. UI remains not Source of Truth. Session truth is the Auth store. The Sessions page is a projection.

---

## Part 7 — Implementation plan (slices)

Do not implement in this task. Each slice is independently reviewable. Merge order is a → e.

### S01-a — Registration and password policy

**Goal:** Keep PC-18 register; enforce Security Vision complexity; keep default Researcher; keep empty login form.

**Touch (expected):** `auth.dto.ts`, `AuthenticationService.assertPassword`, `LoginPage` client validation, register specs.

**Done when:** Weak passwords fail in API and UI; durable register still works; no new routes required except none; J-01 register path still green.

### S01-b — Login and lockout

**Goal:** Keep login; add per-account lockout; generic errors; disabled users still fail closed.

**Touch (expected):** `AuthenticationService.login`, lockout persistence, login specs, existing `LoginPage` copy.

**Done when:** Spray locks; cooldown recovers; message stays “Invalid email or password.”

### S01-c — Session issuance, refresh, secure transport

**Goal:** Replace irrevocable 8h Bearer-in-`localStorage` with revocable sessions: short access, rotating refresh, production-secure cookies/headers, CSRF stance if cookies.

**Touch (expected):** `AuthModule` JWT TTL, `AuthController` login/register/refresh, `JwtStrategy` / guard session lookup, Prisma Auth session model, `apps/web/src/shared/auth.ts` + `api.ts` (stop persisting access tokens in JS for production).

**Done when:** Refresh rotation and reuse detection pass unit/integration tests; authenticated `/me` works via the new transport; US158 still holds.

**Must not:** Second auth module; 8h access as the remaining product default.

### S01-d — Session management product

**Goal:** Server logout; list sessions; revoke one; sign out everywhere; shell Logout uses the server; session rows show enough client metadata to recognize a device **without** a trusted-device product.

**Touch (expected):** new Auth session routes under `/v1/auth/...`, Sessions UI in the signed-in shell (account/security — not a new bounded UI platform), `AppLayout` logout.

**Done when:** Manual walkthrough steps 3–6 pass without SSH.

### S01-e — Password recovery and change

**Goal:** Authenticated change-password; unauthenticated forgot/reset via single-use hashed token; host mail port; honest unavailable if mail is off; revoke sessions on reset (and on change, except optionally the current session).

**Touch (expected):** reset token model, recover endpoints, forgot/reset pages, change-password UI, mail port (no Notification module).

**Done when:** Walkthrough steps 7–8 pass; tokens never returned in JSON or logs.

---

## Part 8 — Validation plan

Detail: [`v3-s01-validation-plan.md`](./v3-s01-validation-plan.md).

Close requires: unit tests, Prisma integration tests, UI tests, manual product walkthrough (no SSH / `.env` / SQL), security verification, architecture verification, customer acceptance of Master Plan S01 outcomes.

---

## Part 9 — Deliverables

| File                                                        | Status                                   |
| ----------------------------------------------------------- | ---------------------------------------- |
| `docs/project/version-3/v3-s01-implementation-package.md`   | This file                                |
| `docs/project/version-3/v3-s01-validation-plan.md`          | Written                                  |
| `docs/project/version-3/v3-s01-product-scope.md`            | Written                                  |
| `docs/project/version-3/v3-s01-security-review.md`          | Written                                  |
| `docs/project/version-3/version-3-implementation-policy.md` | Written (lifecycle for every V3 package) |

**Not created (forbidden in this task):** production code, Master Plan edits, Version 2 edits, RC, ADR.

---

## Lifecycle position

```text
Master Plan          ACCEPTED / FROZEN
        ↓
Implementation Package   ← YOU ARE HERE
        ↓
Review
        ↓
Approval                 ← required before code
        ↓
Implementation           ← S01-a … S01-e only
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close                    → then V3-S02 Implementation Package
```

---

**READY FOR IMPLEMENTATION.**

**STOP.** Wait for approval before writing any production code.
