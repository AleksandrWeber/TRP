# V3-S01-e Security Review

**Package:** V3-S01 Authentication & Session  
**Slice:** S01-e — Password recovery and authenticated password change  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s01-security-review.md`](./v3-s01-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S01-e**. Package Close cannot occur until this slice is accepted.

---

## Slice verdict

**PASS for S01-e.** Reset secrets are hashed, single-use, and expire in one hour. Reuse fails closed. Recovery does not enumerate accounts. Host mail off is honest unavailable. Password change requires the current password, enforces the product policy, revokes other sessions, and keeps the current session. Reset revokes every session.

---

## Required security topics

| Topic                    | Verdict  | Notes                                                                                                                                                  |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Password reset abuse** | **PASS** | Outstanding tokens replaced on a new request. Single use. Expiry 1h. Policy on the new password. Sessions revoked on success                           |
| **Replay**               | **PASS** | Consumed or expired token → same generic invalid-link error. Refresh reuse family-revoke remains S01-c                                                 |
| **Reset token theft**    | **PASS** | Secret only in the mail link, never JSON or logs. Hash at rest. Thief who uses it first sets the password and kills sessions; second use fails         |
| **Enumeration**          | **PASS** | Mail on: identical **accepted** copy for known and unknown. Mail off: identical **unavailable** for everyone. Disabled users treated as non-recipients |

---

## Checklist (S01-e evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                           | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **PASS**           | Forgot/reset are `@Public()` as planned. Change-password requires a live session. Disabled users cannot complete reset                      |        |
| 2   | Authorization              | **PASS**           | Change-password is self only. Reset binds to the token’s user                                                                               |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below                                                                                                                             |        |
| 4   | Input validation           | **PASS**           | Email DTO; reset/change new password `IsProductPassword`; current password min length                                                       |        |
| 5   | Output encoding            | **PASS**           | React defaults. Reset secret omitted from HTTP JSON                                                                                         |        |
| 6   | Session review             | **PASS**           | Reset revokes all. Change revokes others, keeps current. Auth ≠ trading sessions                                                            |        |
| 7   | Credential review          | **PASS**           | bcrypt kept. Reset hashed SHA-256. Seed password still rejected on product set paths                                                        |        |
| 8   | Secret storage             | **NOT APPLICABLE** | Host `MAIL_PASSWORD` is host infrastructure, like `DATABASE_URL`. Vault **V3-S03**                                                          |        |
| 9   | Rate limiting              | **PASS**           | Existing global throttle kept. Auth-route tightening **V3-S04**. Recover is unauthenticated and internet-facing; platform quotas remain S04 |        |
| 10  | Replay protection          | **PASS**           | Reset tokens single use. Refresh reuse remains S01-c                                                                                        |        |
| 11  | CSRF                       | **PASS**           | Forgot/reset exempt like login (secret/email proof). Change-password is a cookie-authenticated mutation and still requires CSRF             |        |
| 12  | XSS                        | **PASS**           | Access still not in `localStorage`. Token is a query param on the reset page, posted once, not stored                                       |        |
| 13  | Injection review           | **PASS**           | Prisma reset persistence                                                                                                                    |        |
| 14  | Logging review             | **PASS**           | `auth.recover` requested/completed/invalid/unavailable. No passwords, tokens, or URLs                                                       |        |
| 15  | Audit review               | **NOT APPLICABLE** | **V3-S05**. Structured events kept                                                                                                          |        |
| 16  | Error leakage review       | **PASS**           | Generic recovery messages. Wrong current password is 400 (not 401, so the client is not signed out)                                         |        |
| 17  | Permission review          | **PASS**           | Default Researcher unchanged                                                                                                                |        |
| 18  | Workspace isolation        | **PASS**           | No membership change                                                                                                                        |        |
| 19  | Financial Integrity review | **NOT APPLICABLE** | Ledger untouched                                                                                                                            |        |
| 20  | Secure-by-default review   | **PASS**           | Mail off does not fake send. US158 kept                                                                                                     |        |
| 21  | Zero Trust review          | **PASS**           | Public surface: register, login, refresh, logout, csrf, recovery, forgot, reset. Change-password authenticated                              |        |
| 22  | Least Privilege review     | **PASS**           | Self change only. No people-admin reset                                                                                                     |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Untouched                                                                                                                                   |        |
| 24  | Connection security review | **NOT APPLICABLE** | Untouched                                                                                                                                   |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                          |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------- |
| Broken access control                      | **PASS**           | Change is self-session; reset is possession of the secret              |
| Cryptographic failures                     | **PASS**           | bcrypt + hashed reset                                                  |
| Injection                                  | **PASS**           | Prisma                                                                 |
| Insecure design                            | **PASS**           | Single-use short-lived reset; honest mail-off                          |
| Security misconfiguration                  | **PASS**           | Mail off is fail-closed for sending                                    |
| Vulnerable and outdated components         | **PASS**           | `nodemailer` only on the host mail adapter. Platform review **V3-S04** |
| Identification and authentication failures | **PASS**           | Recovery + change; MFA Wave 6                                          |
| Software and data integrity failures       | **NOT APPLICABLE** | No update pipeline                                                     |
| Security logging and monitoring failures   | **PASS**           | Structured recover events; **V3-S05**                                  |
| SSRF                                       | **NOT APPLICABLE** | Host SMTP, not customer-supplied URLs. **V3-S04** / connections        |

---

## Threat Review (lightweight STRIDE)

| Category                   | Verdict  | Notes / owner                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| **Spoofing**               | **PASS** | Reset requires the mailed secret. Change requires the current password plus a live session |
| **Tampering**              | **PASS** | Client cannot revive a consumed token                                                      |
| **Repudiation**            | **PASS** | Structured recover/change events. Audit product **V3-S05**                                 |
| **Information Disclosure** | **PASS** | No enumeration copy. Token not in JSON/logs. SMTP failure still returns accepted           |
| **Denial of Service**      | **PASS** | One outstanding token per user. Platform flooding **V3-S04**                               |
| **Elevation of Privilege** | **PASS** | Reset/change do not grant Admin or live                                                    |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added beyond a hash of a dummy secret for unknown emails.

| Surface                   | Verdict  | Notes / owner                                                                                                                                                                                     |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**        | **PASS** | Login timing unchanged (S01-b dummy bcrypt)                                                                                                                                                       |
| **Credential validation** | **PASS** | Change-password verifies the current password for an already authenticated user                                                                                                                   |
| **Recovery flow**         | **PASS** | Public message identical. Unknown emails do a dummy hash instead of issue+send. Residual: a known account may wait on SMTP. Send errors are swallowed after log so HTTP does not become an oracle |
| **Session validation**    | **PASS** | Unchanged from S01-c/d                                                                                                                                                                            |

```text
Known email (mail on)     same public accepted copy
Unknown email (mail on)   same public accepted copy
Mail off                  same unavailable copy for everyone
Valid vs reused reset     same invalid-link error

PASS
```

---

## Abuse Assessment

| Category                | Verdict            | Notes / owner                                                                              |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| **Credential stuffing** | **PASS**           | Lockout remains S01-b. Recovery does not bypass lockout until a successful reset clears it |
| **Brute force**         | **PASS**           | Reset secrets are 32-byte. Link guessing is not practical                                  |
| **Enumeration**         | **PASS**           | Generic accepted / unavailable copy                                                        |
| **Replay attempts**     | **PASS**           | Consumed token fails. Refresh reuse still kills the family                                 |
| **Resource exhaustion** | **PASS**           | New request consumes prior tokens. Platform quotas **V3-S04**                              |
| **Automation abuse**    | **PASS**           | Global throttle kept. Recover tightening **V3-S04**                                        |
| **Distributed attacks** | **NOT APPLICABLE** | **V3-S04** / host                                                                          |

```text
Repeated login attempts    Rate limited?     PASS (S01-b lockout + global throttle)
Credential stuffing        Mitigated?        PASS (lockout + recovery does not reveal accounts)
Distributed attack         Out of scope      NOT APPLICABLE (V3-S04 / host)

PASS
```

---

## Threats this slice reduced

| Threat                                | Control in S01-e                     |
| ------------------------------------- | ------------------------------------ |
| Forgotten password requires SSH/SQL   | Product recover path                 |
| Stolen leftover sessions after reset  | All sessions revoked                 |
| Stolen leftover sessions after change | Other sessions revoked; current kept |
| Recovery enumeration                  | Generic copy; mail-off unavailable   |
| Reset replay                          | Single use + expiry                  |

Not reduced here: MFA (Wave 6), platform-wide auth flooding (V3-S04).

---

**STOP.** Wait for review before beginning V3-S02.

**End of S01-e Security Review.**
