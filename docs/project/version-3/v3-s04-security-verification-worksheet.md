# V3-S04 Security Verification Standard — Close Worksheet

**Package:** V3-S04 OWASP & API Hardening
**Authority:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)
**Close Security Review:** [`v3-s04-e-security-review.md`](./v3-s04-e-security-review.md)
**Certification finding:** F-06
**Date:** 2026-08-17
**Nature:** Certification Close evidence only. No implementation change. Reuses existing S04 regressions and reviews.

```text
Verdicts used: PASS | NOT APPLICABLE | REQUIRES ACTION
Blank rows are forbidden.
```

**Summary:** Every §4–§18 category row and every §19 regression-suite row is filled. **Zero REQUIRES ACTION.** OWASP Top 10 and OWASP API Top 10 mappings remain aligned with implemented S04 platform controls only (no Wave 2 expansion).

---

## 4. Injection

| #    | Item               | Verdict        | Evidence or owner                                                                                                                          |
| ---- | ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1  | SQL Injection      | PASS           | Platform uses Prisma parameterized access only; no string-built SQL added in S04 — `v3-s04-e-security-review.md`; architecture reviews a–e |
| 1.2  | NoSQL Injection    | NOT APPLICABLE | No document/key-value query surface in S04                                                                                                 |
| 1.3  | Command Injection  | PASS           | No shell/process spawn from untrusted input in Security Platform — S04 implementation/architecture reviews                                 |
| 1.4  | LDAP Injection     | NOT APPLICABLE | No directory query surface in S04                                                                                                          |
| 1.5  | Template Injection | NOT APPLICABLE | No server/email/report template evaluation surface in S04                                                                                  |
| 1.6  | Header Injection   | PASS           | CR/LF/NUL header values rejected — `apps/api/src/security-platform/security-platform.http.spec.ts`; `v3-s04-b-security-review.md`          |
| 1.7  | CRLF Injection     | PASS           | Same as 1.6 — `security-platform.http.spec.ts`; `v3-s04-b-validation-report.md`                                                            |
| 1.8  | XXE                | NOT APPLICABLE | No XML parser surface in S04                                                                                                               |
| 1.9  | CSV Injection      | NOT APPLICABLE | No export surface in S04                                                                                                                   |
| 1.10 | Prompt Injection   | NOT APPLICABLE | AI not in this package / later wave                                                                                                        |

---

## 5. Cross-site attacks

| #   | Item            | Verdict | Evidence or owner                                                                                                                                                               |
| --- | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | XSS             | PASS    | Production CSP + browser policy; no unsanitized HTML reflection introduced — `browser-security.spec.ts`; `apps/web/src/browser-security.spec.ts`; `v3-s04-c-security-review.md` |
| 2.2 | Stored XSS      | PASS    | Same CSP/frame posture; S04 does not persist operator HTML for execution — `v3-s04-c-security-review.md`; `security-platform.integration.spec.ts`                               |
| 2.3 | Reflected XSS   | PASS    | Error sanitization + CSP; request values not reflected as HTML — `security-error.spec.ts`; `browser-security.spec.ts`                                                           |
| 2.4 | DOM XSS         | PASS    | Web production headers deny unsafe script posture; no S04-owned client HTML sinks added — `apps/web/src/browser-security.spec.ts`                                               |
| 2.5 | CSRF            | PASS    | Cookie mutations require CSRF; Path=/ CSRF cookie alignment — `auth-csrf.guard.spec.ts`; `v3-s04-e-implementation-report.md`                                                    |
| 2.6 | Clickjacking    | PASS    | `frame-ancestors 'none'` + frameguard deny — `browser-security.spec.ts`; `security-platform.integration.spec.ts`; `v3-s04-c-security-review.md`                                 |
| 2.7 | Open Redirect   | PASS    | Relative or allowlisted targets only — `open-redirect.spec.ts`; `v3-s04-b-security-review.md`                                                                                   |
| 2.8 | CORS validation | PASS    | Explicit origin allowlist (env or documented defaults); credentials not reflected to arbitrary origins — `apps/api/src/main.ts` CORS config; `v3-s04-c-security-review.md`      |

---

## 6. Authentication

| #    | Item                             | Verdict        | Evidence or owner                                                                                                        |
| ---- | -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3.1  | Password policy                  | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.2  | Password reuse                   | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.3  | Minimum length                   | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.4  | Maximum length                   | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.5  | Extremely long password handling | NOT APPLICABLE | V3-S01 (body bounds complemented by S04-b)                                                                               |
| 3.6  | Weak password handling           | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.7  | Credential stuffing resistance   | PASS           | Sensitive-route abuse quotas complement S01 lockout — `platform-abuse-protection.spec.ts`; `v3-s04-d-security-review.md` |
| 3.8  | Brute-force resistance           | PASS           | Same sensitive quota + S01 lockout ownership — `platform-abuse-protection.spec.ts`; `v3-s04-d-security-review.md`        |
| 3.9  | Account lockout                  | NOT APPLICABLE | V3-S01 owns lockout; S04 does not replace it                                                                             |
| 3.10 | Session fixation                 | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.11 | Session hijacking                | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.12 | Refresh replay                   | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.13 | Logout correctness               | NOT APPLICABLE | V3-S01                                                                                                                   |
| 3.14 | Session timeout                  | NOT APPLICABLE | V3-S01                                                                                                                   |

---

## 7. Authorization

| #   | Item                            | Verdict        | Evidence or owner                                                                                                                       |
| --- | ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Horizontal privilege escalation | NOT APPLICABLE | V3-S02 / V3-S03 object authorization; S04 adds platform deny shape only                                                                 |
| 4.2 | Vertical privilege escalation   | NOT APPLICABLE | V3-S02                                                                                                                                  |
| 4.3 | IDOR                            | NOT APPLICABLE | V3-S02 / V3-S03                                                                                                                         |
| 4.4 | Forced browsing                 | PASS           | Host allowlist + authenticated platform edge; undocumented hosts refused — `security-platform.http.spec.ts`; `http-security-surface.md` |
| 4.5 | Mass assignment                 | PASS           | Whitelist validation rejects unexpected privileged fields — `validation-foundation.spec.ts`; `people.http.spec.ts`                      |
| 4.6 | Default deny                    | NOT APPLICABLE | V3-S02 permission matrix primary; platform preserves fail-closed boot — `security-config.spec.ts`                                       |
| 4.7 | Unknown permission              | NOT APPLICABLE | V3-S02                                                                                                                                  |
| 4.8 | Unknown role                    | NOT APPLICABLE | V3-S02                                                                                                                                  |
| 4.9 | Unknown action                  | NOT APPLICABLE | V3-S02                                                                                                                                  |

---

## 8. API security

| #    | Item                           | Verdict        | Evidence or owner                                                                                                                                  |
| ---- | ------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | Input validation               | PASS           | Platform validation pipe foundation — `validation-foundation.spec.ts`; `v3-s04-a-security-review.md`                                               |
| 5.2  | Output encoding                | PASS           | Client errors sanitized; no unsanitized HTML/secret emission — `security-error.spec.ts`; `security-platform.integration.spec.ts`                   |
| 5.3  | JSON validation                | PASS           | Malformed/oversized bodies fail closed via Fastify + platform hooks — `security-platform.http.spec.ts`; `security-platform.integration.spec.ts`    |
| 5.4  | Unexpected fields              | PASS           | `forbidNonWhitelisted` platform foundation — `validation-foundation.spec.ts`                                                                       |
| 5.5  | Parameter pollution            | PASS           | Conflicting duplicate query values rejected — `request-normalization.spec.ts`; integration echo coverage                                           |
| 5.6  | HTTP verb confusion            | PASS           | Platform does not open mutations on unexpected verbs; CSRF still required for cookie mutations — `auth-csrf.guard.spec.ts`; S04 surface reviews    |
| 5.7  | Rate limiting                  | PASS           | Platform + sensitive quotas aligned with Throttler — `platform-abuse-protection.spec.ts`; `security-config.spec.ts`; `v3-s04-d-security-review.md` |
| 5.8  | Pagination abuse               | NOT APPLICABLE | No new list endpoints owned by S04                                                                                                                 |
| 5.9  | Error leakage                  | PASS           | Generic client errors where enumeration/secret leak would result — `security-error.spec.ts`; `anti-enumeration.spec.ts`                            |
| 5.10 | Version leakage                | PASS           | Convenience version/product banners not exposed — `security-platform.http.spec.ts`; `v3-s04-b-security-review.md`                                  |
| 5.11 | Stack trace leakage            | PASS           | No stack in serialized responses — `security-error.spec.ts`                                                                                        |
| 5.12 | Framework leakage              | PASS           | Prisma/Nest markers redacted — `security-error.spec.ts`; `v3-s04-a-security-review.md`                                                             |
| 5.13 | Server header leakage          | PASS           | `Server` / `X-Powered-By` removed — `security-platform.http.spec.ts`; `v3-s04-b-security-review.md`                                                |
| 5.14 | Technology fingerprint leakage | PASS           | Sanitized errors + disclosure header removal — `security-error.spec.ts`; `security-platform.integration.spec.ts`                                   |

---

## 9. URL security

| #   | Item                       | Verdict        | Evidence or owner                                                                                                              |
| --- | -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 6.1 | Predictable identifiers    | NOT APPLICABLE | Object access owned by V3-S02 / V3-S03                                                                                         |
| 6.2 | Sequential IDs             | NOT APPLICABLE | V3-S02 / V3-S03                                                                                                                |
| 6.3 | Guessable resources        | PASS           | No long-lived capability secrets placed in S04 URLs — `http-security-surface.md`; S04 product/security reviews                 |
| 6.4 | Hidden endpoints           | PASS           | Host allowlist + platform auth edge; no shadow admin APIs added — `security-platform.http.spec.ts`; `http-security-surface.md` |
| 6.5 | Enumeration                | PASS           | Platform anti-enumeration shapes existence oracles — `anti-enumeration.spec.ts`; `security-error.spec.ts`                      |
| 6.6 | Sensitive query parameters | PASS           | Secrets/tokens not carried in S04 query strings; auth cookies/headers remain S01 — `http-security-surface.md`                  |
| 6.7 | Secrets in URL             | PASS           | Platform does not place passwords/tokens/vault material in URLs — `http-security-surface.md`; S04-e security review            |

---

## 10. Transport

| #   | Item                            | Verdict        | Evidence or owner                                                                                                                                    |
| --- | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | HTTPS only                      | PASS           | Production assumes HTTPS; insecure transport not introduced — `security-default-policy.md` alignment in `security-foundation-certification-audit.md` |
| 7.2 | Secure cookies                  | PASS           | Auth cookies use `Secure` in production; S04 preserved/aligned CSRF cookie path — `auth-cookies.spec.ts`; `v3-s04-e-implementation-report.md`        |
| 7.3 | HttpOnly                        | PASS           | Credential cookies are HttpOnly — `auth-cookies.spec.ts`                                                                                             |
| 7.4 | SameSite                        | PASS           | Credential cookies use `SameSite=Strict` — `auth-cookies.spec.ts`; `auth-csrf.guard.spec.ts`                                                         |
| 7.5 | HSTS                            | PASS           | Production API HSTS via helmet — `browser-security.spec.ts`; `security-platform.integration.spec.ts`                                                 |
| 7.6 | TLS configuration               | NOT APPLICABLE | Host/edge owns TLS termination; S04 does not weaken TLS                                                                                              |
| 7.7 | No secrets in GET               | PASS           | Sensitive actions not carried in GET query strings by platform — `http-security-surface.md`                                                          |
| 7.8 | Sensitive actions not cacheable | PASS           | Default `Cache-Control: no-store` — `security-platform.http.spec.ts`; `v3-s04-b-security-review.md`                                                  |

---

## 11. Secrets

| #   | Item                         | Verdict        | Evidence or owner                                                                          |
| --- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| 8.1 | Never returned by API        | NOT APPLICABLE | V3-S03 vault readback ban; S04 adds no secret-read API                                     |
| 8.2 | Never logged                 | PASS           | Platform security events emit non-secret structured fields only — `security-event.spec.ts` |
| 8.3 | Never serialized             | NOT APPLICABLE | V3-S03 / V3-S01 own secret persist paths                                                   |
| 8.4 | Never exported               | NOT APPLICABLE | No plaintext export feature in S04                                                         |
| 8.5 | Never displayed              | NOT APPLICABLE | No secret UI in S04                                                                        |
| 8.6 | Memory cleared when possible | NOT APPLICABLE | Crypto buffer ownership remains V3-S03                                                     |
| 8.7 | Encryption verified          | NOT APPLICABLE | V3-S03                                                                                     |
| 8.8 | Integrity verified           | NOT APPLICABLE | V3-S03                                                                                     |

---

## 12. File upload

| #   | Item                    | Verdict        | Evidence or owner         |
| --- | ----------------------- | -------------- | ------------------------- |
| 9.1 | Content type validation | NOT APPLICABLE | No upload in this package |
| 9.2 | Extension validation    | NOT APPLICABLE | No upload in this package |
| 9.3 | MIME validation         | NOT APPLICABLE | No upload in this package |
| 9.4 | Zip bombs               | NOT APPLICABLE | No upload in this package |
| 9.5 | Oversized uploads       | NOT APPLICABLE | No upload in this package |
| 9.6 | Path traversal          | NOT APPLICABLE | No upload in this package |
| 9.7 | Malicious filenames     | NOT APPLICABLE | No upload in this package |

---

## 13. Availability

| #    | Item                 | Verdict        | Evidence or owner                                                                                                                        |
| ---- | -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | Rate limiting        | PASS           | Platform + sensitive quotas — `platform-abuse-protection.spec.ts`; `v3-s04-d-security-review.md`                                         |
| 10.2 | Resource exhaustion  | PASS           | Body size limit, timeout, pre-parse Content-Length — `security-platform.http.spec.ts`; `security-platform.integration.spec.ts` (413)     |
| 10.3 | Queue flooding       | NOT APPLICABLE | No queue producer surface in S04                                                                                                         |
| 10.4 | Replay               | NOT APPLICABLE | Auth token replay owned by V3-S01; live order replay owned by V3-L05                                                                     |
| 10.5 | DoS resilience       | PASS           | Size + timeout + quotas considered for platform edge — `v3-s04-b-security-review.md`; `v3-s04-d-security-review.md`                      |
| 10.6 | Graceful degradation | PASS           | Hardening faults deny the owned surface; no Gate/Risk/auth disable — `v3-s04-security-review.md` Failure philosophy; certification audit |

---

## 14. Financial integrity

| #    | Item                             | Verdict        | Evidence or owner                                                                               |
| ---- | -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| 11.1 | Cannot bypass Gate               | PASS           | No Gate skip added — S04 architecture reviews a–e; `security-foundation-certification-audit.md` |
| 11.2 | Cannot bypass Risk               | PASS           | No Risk skip added — same evidence                                                              |
| 11.3 | Cannot create fake fills         | PASS           | No fill forgery path added — same evidence                                                      |
| 11.4 | Cannot modify portfolio directly | PASS           | No portfolio mutation path added — same evidence                                                |
| 11.5 | Cannot bypass ledger             | PASS           | No silent balance edit path — same evidence                                                     |
| 11.6 | Cannot replay orders             | NOT APPLICABLE | V3-L05                                                                                          |
| 11.7 | Cannot forge notifications       | NOT APPLICABLE | Notification product not in S04                                                                 |
| 11.8 | Cannot forge reports             | NOT APPLICABLE | Reporting SoT not owned by S04                                                                  |

---

## 15. AI

| #    | Item                             | Verdict        | Evidence or owner                   |
| ---- | -------------------------------- | -------------- | ----------------------------------- |
| 12.1 | Prompt injection                 | NOT APPLICABLE | AI not in this package / Wave later |
| 12.2 | Model jailbreak resistance       | NOT APPLICABLE | AI not in this package / Wave later |
| 12.3 | Secrets hidden from prompts      | NOT APPLICABLE | AI not in this package / Wave later |
| 12.4 | No hidden system prompt exposure | NOT APPLICABLE | AI not in this package / Wave later |
| 12.5 | No customer isolation break      | NOT APPLICABLE | AI not in this package / Wave later |
| 12.6 | AI never controls capital        | NOT APPLICABLE | AI not in this package / Wave later |

---

## 16. Privacy

| #    | Item                 | Verdict        | Evidence or owner                                                                                                                     |
| ---- | -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 13.1 | PII exposure         | PASS           | Platform errors/logs minimize PII — `security-error.spec.ts`; `security-event.spec.ts`                                                |
| 13.2 | Workspace isolation  | NOT APPLICABLE | V3-S06 isolation suite                                                                                                                |
| 13.3 | Cross-tenant leakage | NOT APPLICABLE | V3-S06                                                                                                                                |
| 13.4 | Sensitive logs       | PASS           | Platform security events omit secrets — `security-event.spec.ts`                                                                      |
| 13.5 | Audit integrity      | PASS           | Platform emits attributable non-secret events; searchable audit **product** is V3-S05 — `security-event.spec.ts`; certification audit |

---

## 17. Secure headers

| #    | Item                              | Verdict | Evidence or owner                                                                                                   |
| ---- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| 14.1 | CSP                               | PASS    | Production CSP without development allowances — `browser-security.spec.ts`; `apps/web/src/browser-security.spec.ts` |
| 14.2 | X-Frame-Options / frame-ancestors | PASS    | Frame denial — `browser-security.spec.ts`; `security-platform.integration.spec.ts`                                  |
| 14.3 | Referrer-Policy                   | PASS    | `no-referrer` — `browser-security.spec.ts`; `v3-s04-c-security-review.md`                                           |
| 14.4 | Permissions-Policy                | PASS    | Camera/geolocation/microphone/payment/usb disabled — `browser-security.ts`; `v3-s04-c-security-review.md`           |
| 14.5 | X-Content-Type-Options            | PASS    | `nosniff` — `browser-security.spec.ts`; `security-platform.integration.spec.ts`                                     |

---

## 18. OWASP mapping

### 18.1 OWASP Top 10

| OWASP class                                | Verdict        | Notes / owner                                                                                                                    |
| ------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Broken access control                      | PASS           | Platform anti-enumeration + host allowlist; object IDOR remains V3-S02/S03 — `anti-enumeration.spec.ts`; Coverage Matrix         |
| Cryptographic failures                     | NOT APPLICABLE | V3-S01 passwords / V3-S03 vault crypto                                                                                           |
| Injection                                  | PASS           | Prisma posture + header/CRLF rejection + validation foundation — S04-a/b specs                                                   |
| Insecure design                            | PASS           | Secure-by-default production boot refuse — `security-config.spec.ts`; `security-foundation-certification-audit.md`               |
| Security misconfiguration                  | PASS           | Headers, HSTS, fail-closed boot, disclosure removal — S04-b/c/e specs                                                            |
| Vulnerable and outdated components         | PASS           | S04 introduced no new framework; continuous CVE scanning owned by CI/host (`.github/workflows/security.yml`)                     |
| Identification and authentication failures | PASS           | Flood/throttle complement to S01 — `platform-abuse-protection.spec.ts`                                                           |
| Software and data integrity failures       | PASS           | No unsafe deserialize; production refuses insecure security-off bypass — `security-config.spec.ts`                               |
| Security logging and monitoring failures   | PASS           | Non-secret platform event emit; searchable monitoring product remains V3-S05 — `security-event.spec.ts`                          |
| Server-side request forgery (SSRF)         | PASS           | Foundation allowlist helper only; webhook product later — `ssrf-allowlist.spec.ts`; `security-foundation-certification-audit.md` |

### 18.2 OWASP API Top 10

| OWASP API class                                 | Verdict        | Notes / owner                                                                                          |
| ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| Broken object level authorization               | PASS           | Enumeration oracle shaping at platform edge; primary object checks remain V3-S02/S03                   |
| Broken authentication                           | PASS           | Sensitive-route throttle complement; core authn V3-S01                                                 |
| Broken object property level authorization      | PASS           | Mass assignment / unexpected fields — `validation-foundation.spec.ts`                                  |
| Unrestricted resource consumption               | PASS           | Rate + size bounds — S04-b/d regressions                                                               |
| Broken function level authorization             | NOT APPLICABLE | V3-S02 primary                                                                                         |
| Unrestricted access to sensitive business flows | PASS           | Sensitive auth/recovery quotas; live trading flows remain later owners — `v3-s04-d-security-review.md` |
| Server side request forgery                     | PASS           | SSRF foundation — `ssrf-allowlist.spec.ts`                                                             |
| Security misconfiguration                       | PASS           | Headers, boot guards, disclosure controls                                                              |
| Improper inventory management                   | PASS           | Hidden/undocumented hosts still protected; no shadow admin APIs — `http-security-surface.md`           |
| Unsafe consumption of APIs                      | NOT APPLICABLE | Outbound vendor clients owned by later packages                                                        |

---

## 19. Security Regression Suite

All listed regressions run in the ordinary `pnpm test` suite (`v3-s04-e-validation-report.md`).

| Class            | Verdict        | Evidence (test path / name)                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL Injection    | NOT APPLICABLE | No SQL-injection fix of this class landed in S04; Prisma posture unchanged                                                                                                                                                                                                                                                                                                                                |
| IDOR             | NOT APPLICABLE | Object IDOR regressions owned by V3-S02/S03 suites                                                                                                                                                                                                                                                                                                                                                        |
| XSS              | PASS           | CSP/browser policy regressions — `browser-security.spec.ts`; `apps/web/src/browser-security.spec.ts`                                                                                                                                                                                                                                                                                                      |
| CSRF             | PASS           | Cookie mutation without CSRF denied — `auth-csrf.guard.spec.ts`                                                                                                                                                                                                                                                                                                                                           |
| Prompt Injection | NOT APPLICABLE | No AI fix in this package                                                                                                                                                                                                                                                                                                                                                                                 |
| Session Fixation | NOT APPLICABLE | No session-fixation fix in S04; owned by V3-S01                                                                                                                                                                                                                                                                                                                                                           |
| Refresh Replay   | NOT APPLICABLE | Owned by V3-S01 suite                                                                                                                                                                                                                                                                                                                                                                                     |
| Mass Assignment  | PASS           | Unexpected privileged field rejected — `validation-foundation.spec.ts`; `people.http.spec.ts`                                                                                                                                                                                                                                                                                                             |
| Header Injection | PASS           | CRLF/header smuggling rejected — `security-platform.http.spec.ts`                                                                                                                                                                                                                                                                                                                                         |
| Other (name it)  | PASS           | SSRF foundation — `ssrf-allowlist.spec.ts`; anti-enumeration — `anti-enumeration.spec.ts`, `security-error.spec.ts`; open redirect — `open-redirect.spec.ts`; abuse quotas — `platform-abuse-protection.spec.ts`; HPP — `request-normalization.spec.ts`; HSTS/headers — `security-platform.integration.spec.ts`; fail-closed boot — `security-config.spec.ts`; security events — `security-event.spec.ts` |

---

## Cross-references (existing evidence only)

| Artifact                       | Path                                                   |
| ------------------------------ | ------------------------------------------------------ |
| Verification Standard          | `version-3-security-verification-standard.md`          |
| S04-e Security Review          | `v3-s04-e-security-review.md`                          |
| S04 Close Report               | `v3-s04-close-report.md` (unchanged by this worksheet) |
| Coverage Matrix                | `security-coverage-matrix.md`                          |
| Foundation certification audit | `security-foundation-certification-audit.md`           |
| Validation                     | `v3-s04-e-validation-report.md`                        |
| HTTP surface                   | `http-security-surface.md`                             |
| Security Platform regressions  | `apps/api/src/security-platform/*.spec.ts`             |

---

**STOP.** F-06 worksheet complete. Do not implement F-07. Await Product Owner review.
