# V3-S01-c Security Review

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-c — Session issuance, refresh, secure transport  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s01-security-review.md`](./v3-s01-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S01-c**. Items owned by later S01 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S01-c.** Access JWTs are short-lived and bound to a server session. Refresh rotates. Reuse of an old refresh revokes the family. Production auth cookies are `HttpOnly` `SameSite=Strict` `Secure`. Access tokens are not persisted in JavaScript-readable storage. US158 still holds.

Package security exit (session inventory UI, recovery tokens) is **not** claimed.

---

## Checklist (S01-c evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                                  | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Authentication             | **PASS**           | Login/register still `@Public()`. Issued access is bound to `sid` and looked up on every authenticate. Disabled users fail closed. No passwordless path.           |        |
| 2   | Authorization              | **PASS**           | Refresh/logout operate on the caller’s session only. Role assignment remains V3-S02. JWT role remains a hint; Identity is re-resolved.                             |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Classes not in this slice cite owners.                                                                                                            |        |
| 4   | Input validation           | **PASS**           | Existing login/register DTOs. Optional `RefreshBodyDto.refreshToken`. Unknown refresh fails closed with a generic session error.                                   |        |
| 5   | Output encoding            | **PASS**           | React defaults kept. HTTP login JSON omits the refresh secret. Passwords not returned.                                                                             |        |
| 6   | Session review             | **PASS**           | Short access (15m). Rotating refresh. Reuse revokes family. Revoked `sid` fails authenticate. Auth sessions are not trading sessions.                              |        |
| 7   | Credential review          | **PASS**           | Passwords remain bcrypt. Refresh secrets hashed (SHA-256) at rest. Seed/admin defaults are not the product path. No debug prefill.                                 |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No customer vendor secrets. Host JWT remains host infrastructure. Vault is **V3-S03**.                                                                             |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | Existing global limits kept. Auth-route quota tightening remains **V3-S04**. Lockout remains S01-b.                                                                |        |
| 10  | Replay protection          | **PASS**           | Refresh reuse revokes the family. Reset-token reuse is **S01-e**. Live-order replay is **V3-L05**.                                                                 |        |
| 11  | CSRF                       | **PASS**           | Cookie-authenticated Auth mutations require matching `X-CSRF-Token`. `SameSite=Strict`. Login/register exempt. Bearer-only clients without auth cookies skip CSRF. |        |
| 12  | XSS                        | **PASS**           | Access token is not stored in `localStorage`. Auth cookies are `HttpOnly`. React defaults kept. Production CSP product remains **V3-S04**.                         |        |
| 13  | Injection review           | **PASS**           | Prisma session persistence. No string-built SQL.                                                                                                                   |        |
| 14  | Logging review             | **PASS**           | Structured `auth.session` create/refresh/logout. No passwords, tokens, hashes, or CSRF secrets in logs.                                                            |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product is **V3-S05**. Structured session events kept.                                                                                                       |        |
| 16  | Error leakage review       | **PASS**           | Invalid, expired, reused, and revoked refresh share **Invalid session.** Login errors unchanged from S01-b.                                                        |        |
| 17  | Permission review          | **PASS**           | Default Researcher unchanged. No Admin-by-session.                                                                                                                 |        |
| 18  | Workspace isolation        | **PASS**           | No membership change. Workspace header still server-checked. JWT does not trust `workspaceId`.                                                                     |        |
| 19  | Financial Integrity review | **NOT APPLICABLE** | Ledger / orders untouched.                                                                                                                                         |        |
| 20  | Secure-by-default review   | **PASS**           | US158 kept. Production cookies include `Secure`. Leftover `JWT_EXPIRES_IN=8h` coerced to 15m. No debug prefill. Live remains off.                                  |        |
| 21  | Zero Trust review          | **PASS**           | Non-public APIs still go through `JwtAuthGuard` + session lookup. Public routes: register, login, refresh, logout, csrf.                                           |        |
| 22  | Least Privilege review     | **PASS**           | Logout/refresh are self-session only. Admin revoke-others is out (S01-d does not add it either as people-admin).                                                   |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Slice does not touch AI.                                                                                                                                           |        |
| 24  | Connection security review | **NOT APPLICABLE** | Slice does not touch connections.                                                                                                                                  |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                   |
| ------------------------------------------ | ------------------ | --------------------------------------------------------------- |
| Broken access control                      | **PASS**           | Session lookup on authenticate; logout is self-session          |
| Cryptographic failures                     | **PASS**           | bcrypt kept; refresh hashed; US158 JWT secret rules kept        |
| Injection                                  | **PASS**           | Prisma session persistence                                      |
| Insecure design                            | **PASS**           | Stateless 8h JWT replaced; rotation + reuse detection           |
| Security misconfiguration                  | **PASS**           | Production cookie flags fail closed (`Secure`); US158           |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No new runtime dependency. Platform review **V3-S04**           |
| Identification and authentication failures | **PASS**           | Short access, rotation, revocation; MFA Wave 6                  |
| Software and data integrity failures       | **NOT APPLICABLE** | No update pipeline in this slice                                |
| Security logging and monitoring failures   | **PASS**           | Structured session events; no secrets; audit product **V3-S05** |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / connections                                        |

---

## Threat Review (lightweight STRIDE)

Not a full threat model. One table for this slice.

| Category                   | Verdict  | Notes / owner                                                                                                                                                     |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing**               | **PASS** | Access JWT is useless without a live server session. Refresh is an unguessable secret. Public login/register/refresh remain the allowed unauthenticated surfaces. |
| **Tampering**              | **PASS** | Session revoke/rotate state is server-side. Client cannot resurrect a revoked family.                                                                             |
| **Repudiation**            | **PASS** | Structured `auth.session` create/refresh/logout with user id and session id. Audit product remains **V3-S05**.                                                    |
| **Information Disclosure** | **PASS** | Refresh omitted from HTTP JSON. Tokens not logged. Generic invalid-session error. Access not in `localStorage`.                                                   |
| **Denial of Service**      | **PASS** | Refresh is high-entropy (not brute-forceable as passwords are). Lockout remains S01-b. Platform flooding **V3-S04**.                                              |
| **Elevation of Privilege** | **PASS** | Session issue does not grant Admin, live, or extra workspace power.                                                                                               |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added.

| Surface                   | Verdict            | Notes / owner                                                                                                                                                    |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**        | **PASS**           | Login timing unchanged from S01-b (dummy compare for unknown users). This slice does not add an account-existence oracle.                                        |
| **Credential validation** | **PASS**           | Password path unchanged. Refresh compare is SHA-256 of a high-entropy secret, not a password oracle.                                                             |
| **Recovery flow**         | **NOT APPLICABLE** | Recovery is **S01-e**.                                                                                                                                           |
| **Session validation**    | **PASS**           | Missing, expired, revoked, and reused refresh share **Invalid session.** High-entropy tokens make hash-miss vs revoked-hit timing impractical. No padding added. |

```text
Known email      ≈ same response time (S01-b dummy compare; unchanged)
Unknown email    ≈ same response time
Valid refresh vs invalid refresh    same public error

PASS
```

---

## Abuse Assessment

Assessment only. No new edge mitigations shipped in this review.

| Category                | Verdict            | Notes / owner                                                                         |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| **Credential stuffing** | **PASS**           | Login lockout remains S01-b. Stolen refresh is rotated; reuse kills the family.       |
| **Brute force**         | **PASS**           | Password spray: S01-b lockout. Refresh guessing is not practical (32-byte secret).    |
| **Enumeration**         | **PASS**           | Login errors unchanged. Session errors are generic.                                   |
| **Replay attempts**     | **PASS**           | Refresh reuse revokes the family. Access JWT replay dies when the session is revoked. |
| **Resource exhaustion** | **PASS**           | Refresh/issue work is bounded. Platform quotas **V3-S04**.                            |
| **Automation abuse**    | **PASS**           | Existing global throttle kept. Auth-route tightening **V3-S04**.                      |
| **Distributed attacks** | **NOT APPLICABLE** | **V3-S04** / host infrastructure                                                      |

```text
Repeated login attempts    Rate limited?     PASS (S01-b lockout + global throttle)
Credential stuffing        Mitigated?        PASS (lockout + rotating refresh)
Distributed attack         Out of scope      NOT APPLICABLE (V3-S04 / host)

PASS
```

---

## Threats this slice reduced

| Threat                              | Control in S01-c                                                       |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Stolen leftover access token        | 15m access + server session lookup; revoke fails closed                |
| Stolen refresh token                | Rotation; reuse revokes the family                                     |
| XSS token theft from `localStorage` | Access not persisted in JS storage; HttpOnly cookies                   |
| CSRF on cookie session              | `SameSite=Strict` + CSRF header on cookie-authenticated Auth mutations |
| Session fixation                    | New session issued on login/register; refresh rotates `sid`            |

Not reduced here: session inventory UI (S01-d), recovery abuse (S01-e), platform-wide auth flooding (V3-S04).

---

**STOP.** Wait for review before beginning S01-d.

**End of S01-c Security Review.**
