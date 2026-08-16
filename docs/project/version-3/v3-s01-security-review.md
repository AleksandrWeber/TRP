# V3-S01 Security Review (planning)

**Package:** V3-S01 Authentication & Session  
**Wave:** 1 — Security Foundation  
**Status:** Planning security review — **not** a post-implementation closeout  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 and [`v3-security-vision.md`](./v3-security-vision.md)  
**Umbrella:** [`v3-s01-implementation-package.md`](./v3-s01-implementation-package.md)

This review describes **only** controls that belong in V3-S01. Later Wave 1 packages keep their owners.

---

## Threats this package must reduce

From the Security Vision threat model, S01 is the primary control for **account takeover** (password spray, stolen token) and a contributing control for **request tampering** (forged session) and **XSS-stolen session**.

| Threat                       | S01 control                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Password spray / brute force | Lockout + existing global rate limit (platform tightening remains V3-S04)                  |
| Stolen access token          | Short access lifetime; server-side session; revoke; logout-all                             |
| Stolen refresh token         | Rotation + reuse detection; revoke family                                                  |
| XSS token theft              | Prefer `HttpOnly` `Secure` `SameSite` cookies over `localStorage` Bearer                   |
| CSRF (if cookies)            | `SameSite=strict` plus CSRF token or equivalent; mutating APIs must not be cookie-forgible |
| Shared/dev identity          | No product-path default password; US158 JWT secret rules kept                              |
| Recovery abuse               | Single-use short-lived reset tokens; no user enumeration; revoke sessions on reset         |
| Insider leftover access      | Self-service session inventory and revoke                                                  |

Out of this review: vault theft, SSRF, live-order replay, ABAC, financial action log.

---

## Control-by-control (S01 only)

### Authentication

| Rule                 | S01 requirement                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password credentials | Keep bcrypt on `User.passwordHash` via `PasswordCredentialStore`. Identity stays password-free.                                                                                                       |
| Password policy      | Complexity **in addition to** minimum length 8. Reject known-weak defaults used in seed (`trp-admin-change-me`) on the **product** register/change/reset paths.                                       |
| Lockout              | After a bounded number of failed password checks, lock for a cooldown. Check lockout before verifying the password’s success path is distinguishable only by timing-safe compare, not by API message. |
| MFA                  | **Do not ship** TOTP/WebAuthn. Session records must be able to store a later `mfaSatisfied` (or equivalent) so J3-01 remains MFA-capable.                                                             |
| Passwordless         | Forbidden as the customer path.                                                                                                                                                                       |
| Recovery             | See password recovery below. No shared `admin@trp.local` product path.                                                                                                                                |
| Disabled users       | Keep fail-closed: `JwtStrategy` / `resolveAuthUser` must still reject `Disabled` even if a token is presented.                                                                                        |

### Session management

| Rule             | S01 requirement                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token type       | Implementation choice allowed by Security Vision: continue JWT **or** opaque server sessions. **Revocation must work.** Recommended: short-lived access JWT **bound to a server session id** plus rotating refresh, or fully opaque sessions. Stateless 8h JWT-only is **not** acceptable. |
| Expiry           | Access lifetime **short** (minutes, not 8 hours). Refresh lifetime bounded; idle expiry allowed.                                                                                                                                                                                           |
| Refresh rotation | Every refresh issues a new refresh secret and invalidates the previous. Reuse of an old refresh **revokes the session family**.                                                                                                                                                            |
| Revoke           | Self-service: one session; all sessions. Logout calls the server.                                                                                                                                                                                                                          |
| Binding          | Workspace id is not a client honor system. Keep server-side membership checks. Do not put `workspaceId` trust in the JWT alone.                                                                                                                                                            |
| Inventory        | Durable session records owned by **Authentication**, not by Trading Session / `SessionRecoveryState`.                                                                                                                                                                                      |

### Password policy

- Minimum length remains **at least 8**.
- Require mixed classes (for example letter + number, or equivalent complexity). Do **not** invent a breach-corpus product or password-history product; those are not in the Master Plan.
- Policy is enforced on register, change, and reset.

### Refresh token security

- Store only a **hash** of the refresh secret (not the raw token).
- Bind refresh to `userId` + session id.
- Rotate on use.
- Reuse detection revokes the family (replay protection **for sessions**, not the Wave 6 financial replay package).
- Never log refresh or access tokens. Never return them in HTML or JSON logs.

### Replay protection (session, not live orders)

- Refresh reuse = revoke family.
- Reset tokens: single use.
- Financial place/cancel replay remains **V3-L05**. Do not build order nonces here.

### Brute-force protection

- Per-account lockout is the S01 product control.
- Keep generic `"Invalid email or password."` (already the UI copy).
- Existing Fastify / Throttler global limits stay; **do not** wait for V3-S04 to ship lockout. V3-S04 still owns tightening auth-route quotas as a platform control.

### Rate limiting

- S01 may attach a **stricter throttle to public auth routes** (`/login`, `/register`, `/recover`) because they are unauthenticated and internet-facing. That is defense in depth for this package, not a takeover of SEC-08.
- Research API burst remains a V3-S04 concern.

### Secure cookies

Wave 1 exit for S01: “production cookies/headers are secure-by-default.”

If the session transport uses cookies:

- `Secure`, `HttpOnly`, `SameSite=Strict` in production.
- Distinct cookie names for access vs refresh if both exist.
- Production refuses to set auth cookies without `Secure` (fail closed).

If implementation keeps Bearer-in-`localStorage`, XSS remains the session-theft path. That choice **fails** this review unless it is a documented temporary dual-stack during a slice — the package **exit** must not leave the access token in JavaScript-readable storage in production.

### CSRF

- Bearer-only mutating APIs: CSRF is low if the browser does not auto-attach the secret. S01 must **not** also accept the same session from a cookie without CSRF defenses.
- Cookie session: `SameSite=Strict` **and** a CSRF token (or double-submit) on state-changing `/v1/auth/*` and any cookie-authenticated mutation.
- Full CSRF platform policy remains listed under V3-S04; S01 must not ship a cookie session that V3-S04 would immediately reject.

### JWT lifetime

- Replace default **8h** access as the product session. Access: short. Refresh: rotating.
- Keep US158: production rejects missing / `dev-only-change-me` / short `JWT_SECRET`.
- JWT `role` is a hint; authorization still re-resolves Identity (already true in `JwtStrategy.validate`).

### Session revocation

- Revoke must be immediate for **new** requests (session lookup or denylist on each authenticate).
- User disable continues to fail JWT validation (already exists) **and** must revoke existing sessions.
- Password change and password reset revoke all sessions (optionally keep the current session on change-while-logged-in).

### Credential storage

- Passwords: bcrypt, cost factor **at least 10** (current). Do not store plaintext.
- Refresh secrets and reset tokens: hashed at rest.
- Reset links: token in the link, not in server logs.
- Host mail configuration is host infrastructure, not a vaulted customer exchange key.

### Audit logging

- **Do not** build the SEC-09 audit product.
- **Do** keep (and structure) login success, login failure, lockout, logout, revoke, recover-request, recover-success. Fields: user id when known, outcome, client IP, user-agent. No secrets.
- V3-S05 will persist these. S01 must not log passwords, tokens, or hashes.

### Zero Trust

- Every non-`@Public()` API call remains authenticated (global `JwtAuthGuard` or its session successor).
- Public routes stay only: register, login, recovery request, recovery complete, and existing health/public surfaces.
- Workspace membership stays server-side.
- Vendor callbacks (Telegram) are **not** this package.

### Least Privilege

- New users remain **Researcher** (never Admin, never live-capable Trader by default).
- S01 does not add role-assignment APIs (that would steal V3-S02).
- Session list/revoke is **self** only. Admin revoke-others is V3-S02/S09 unless already implied — Master Plan S01 is self-service sessions. **Admin force-logout of another user is out** (People/admin product).

### Secure by Default

- Production: no insecure JWT secret; no missing cookie flags if cookies are used; no debug credential prefill (PC-18).
- Live remains off. Integrations remain disconnected.
- Recovery does not fall back to a well-known password.

### Everything Is Auditable

- Session create, refresh, revoke, lockout, and recovery must be attributable in logs S05 can later store.
- S01 does not need a customer audit UI.

---

## Explicitly not S01

| Control                                                                                    | Package                                                  |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| RBAC product / TD-006 remaining surfaces                                                   | V3-S02                                                   |
| Vault, encryption at rest for vendor secrets                                               | V3-S03                                                   |
| CSP on by default, SSRF allowlists, helmet/CORP review, financial API unknown-field reject | V3-S04                                                   |
| Append-only audit product, incident class=`security`                                       | V3-S05                                                   |
| Cross-workspace isolation tests as a product                                               | V3-S06                                                   |
| MFA required for live                                                                      | Wave 6                                                   |
| Financial replay / order idempotency keys                                                  | V3-L05                                                   |
| Kill Switch                                                                                | V3-O04 / existing live-only remnant — do not extend here |

---

## Security exit for this package

S01 security is done when:

1. A revoked session cannot authenticate.
2. Refresh rotation and reuse detection work in tests.
3. Production session cookies/headers fail closed if misconfigured (or Bearer is gone from JS storage).
4. Lockout stops password spray on a single account.
5. Recovery tokens are single-use, short-lived, hashed, and not logged.
6. Passwords remain bcrypt; no plaintext in API or logs.
7. No MFA theater, no vault, no live UI.
