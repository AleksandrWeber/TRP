# V3-S01-b Security Review

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-b — Login & Lockout  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s01-security-review.md`](./v3-s01-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S01-b**. Items owned by later S01 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S01-b.** Password spray against a single account locks after 5 failures for 15 minutes. Public errors stay **Invalid email or password.** Disabled users fail closed. Passwords are not returned in API bodies or logs.

Package security exit (revocation, refresh rotation, recovery tokens, production cookie flags) is **not** claimed.

---

## Checklist (S01-b evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                               | Action |
| --- | -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **PASS**           | Public login still `@Public()`. Lockout checked before success. Dummy/stored bcrypt compare on every attempt. Disabled users fail closed. No passwordless path. |        |
| 2   | Authorization              | **NOT APPLICABLE** | No new mutating authenticated routes. Role assignment is V3-S02.                                                                                                |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Classes not in this slice cite owners.                                                                                                         |        |
| 4   | Input validation           | **PASS**           | Existing `LoginBodyDto` (email + min length 8). No new body fields.                                                                                             |        |
| 5   | Output encoding            | **PASS**           | Login response does not include password or hash. React defaults kept.                                                                                          |        |
| 6   | Session review             | **NOT APPLICABLE** | Login still issues the existing PC-18 JWT. Revocation / short access / refresh are **S01-c / S01-d**.                                                           |        |
| 7   | Credential review          | **PASS**           | bcrypt cost 10 kept. Plaintext not stored. Login does not force register complexity onto existing hashes.                                                       |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No customer vendor secrets. Host JWT remains host infrastructure. Vault is **V3-S03**.                                                                          |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | No new public routes. Existing global limits kept. Per-account lockout is this slice’s spray control. Auth-route quota tightening is **V3-S04**.                |        |
| 10  | Replay protection          | **NOT APPLICABLE** | Reset-token reuse is **S01-e**. Refresh reuse is **S01-c**. Live-order replay is **V3-L05**.                                                                    |        |
| 11  | CSRF                       | **NOT APPLICABLE** | No cookie session in this slice. Cookie CSRF is **S01-c**.                                                                                                      |        |
| 12  | XSS                        | **NOT APPLICABLE** | Session transport / JS storage exit is **S01-c**. React defaults unchanged.                                                                                     |        |
| 13  | Injection review           | **PASS**           | Prisma parameterized lockout upsert. No string-built SQL.                                                                                                       |        |
| 14  | Logging review             | **PASS**           | Structured `auth.login` with outcome, userId when known, IP, user-agent. Tests assert passwords are absent.                                                     |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product is **V3-S05**. Structured login/lockout logs kept.                                                                                                |        |
| 16  | Error leakage review       | **PASS**           | Unknown email, bad password, disabled, and locked all return the same generic message.                                                                          |        |
| 17  | Permission review          | **PASS**           | Login does not change role. Default Researcher untouched.                                                                                                       |        |
| 18  | Workspace isolation        | **PASS**           | No membership change. Workspace header unchanged.                                                                                                               |        |
| 19  | Financial Integrity review | **NOT APPLICABLE** | Ledger / orders untouched.                                                                                                                                      |        |
| 20  | Secure-by-default review   | **PASS**           | US158 JWT secret rules untouched. No debug prefill. Live remains off. Lockout is code policy, not customer `.env`.                                              |        |
| 21  | Zero Trust review          | **PASS**           | Login remains the existing public route. `/me` still authenticated. Network location is not trusted as identity.                                                |        |
| 22  | Least Privilege review     | **PASS**           | No extra privilege on login. No role-assignment API.                                                                                                            |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Slice does not touch AI.                                                                                                                                        |        |
| 24  | Connection security review | **NOT APPLICABLE** | Slice does not touch connections.                                                                                                                               |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                           |
| ------------------------------------------ | ------------------ | ----------------------------------------------------------------------- |
| Broken access control                      | **NOT APPLICABLE** | No new privileged routes. V3-S02 for role admin.                        |
| Cryptographic failures                     | **PASS**           | bcrypt kept; plaintext not stored or returned                           |
| Injection                                  | **PASS**           | Prisma lockout persistence                                              |
| Insecure design                            | **PASS**           | Lockout before success; generic errors; dummy compare for missing users |
| Security misconfiguration                  | **NOT APPLICABLE** | JWT production secret rules already US158; cookies **S01-c**            |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No dependency change. Platform review **V3-S04**                        |
| Identification and authentication failures | **PASS**           | Per-account lockout shipped; MFA not shipped (Wave 6)                   |
| Software and data integrity failures       | **NOT APPLICABLE** | No update pipeline in this slice                                        |
| Security logging and monitoring failures   | **PASS**           | Structured login/lockout; no secrets; durable audit product **V3-S05**  |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / connections                                                |

---

## Threat Review (lightweight STRIDE)

Not a full threat model. One table for this slice.

| Category                   | Verdict  | Notes / owner                                                                                                                                                                                                       |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing**               | **PASS** | Login still requires the account password. Lockout does not create a bypass. Public login remains the allowed unauthenticated surface.                                                                              |
| **Tampering**              | **PASS** | Failed-attempt and locked-until state are server-side. The client cannot reset the counter.                                                                                                                         |
| **Repudiation**            | **PASS** | Structured `auth.login` events (`success` / `failure` / `lockout` / `locked`) with user id when known. Audit product remains **V3-S05**.                                                                            |
| **Information Disclosure** | **PASS** | Same generic error for unknown, wrong, disabled, and locked. Password never in responses or logs.                                                                                                                   |
| **Denial of Service**      | **PASS** | Per-account lockout is the S01 spray control (5 / 15 minutes). A known email can be locked — accepted tradeoff; cooldown recovers. IP/platform quota tightening is **V3-S04**, not skipped as this slice’s control. |
| **Elevation of Privilege** | **PASS** | Login does not grant Admin, live, or extra workspace power. Default role unchanged.                                                                                                                                 |

---

## Threats this slice reduced

| Threat                                      | Control in S01-b                                   |
| ------------------------------------------- | -------------------------------------------------- |
| Password spray / brute force on one account | 5 failures → 15 minute lockout                     |
| User enumeration via login errors           | Same “Invalid email or password.” for all failures |
| Password in API/logs                        | Not returned; log assertions                       |

Not reduced here: stolen token (S01-c/d), recovery abuse (S01-e), platform-wide auth flooding (V3-S04).

---

**STOP.** Wait for review before beginning S01-c.

**End of S01-b Security Review.**
