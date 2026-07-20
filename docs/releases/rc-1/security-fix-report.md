# RC-1.1 — Security Fix Report

**Date:** 2026-07-20  
**Task:** Security Hardening  
**Validator:** `SecurityValidator`

## Gaps addressed

| Gap                   | Remediation                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Helmet missing        | Added `@fastify/helmet`; registered in `main.ts`                                                                      |
| Rate limiting missing | Added `@fastify/rate-limit` (Fastify) + `@nestjs/throttler` + global `ThrottlerGuard`                                 |
| Passwordless login    | `PasswordCredentialStore` with `bcrypt.hash` / `bcrypt.compare`; `login(email, password)` / `register(..., password)` |
| Weak exchange authz   | `@Roles(Role.Trader, Role.Admin)` on connect/disconnect                                                               |
| Env secret guidance   | Documented rate-limit + seed password vars in `.env.example`; existing `JWT_SECRET` production checks retained        |

## Design notes

- Identity profile remains password-free; credentials live in the Auth layer.
- Development bootstrap assigns `SEED_USER_PASSWORD` (default `trp-admin-change-me`) to `admin@trp.local`.
- CORS, `JwtAuthGuard`, and `RolesGuard` were already present and retained.

## Verification

```text
SecurityValidator → PASS (0 critical)
helmet=true, rateLimit=true
```

## Verdict

**PASS**
