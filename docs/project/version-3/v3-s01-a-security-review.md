# V3-S01-a Security Review

**Package:** V3-S01 Authentication & Session
**Slice:** S01-a — Registration & Password Policy
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)
**Planning review:** [`v3-s01-security-review.md`](./v3-s01-security-review.md) (unmodified)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S01-a**. Items owned by later S01 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S01-a.** Weak product passwords are rejected. bcrypt is unchanged. Passwords are not returned in API bodies. Seed credentials are not the product register path.

Package security exit (revocation, refresh rotation, lockout, recovery tokens, production cookie flags) is **not** claimed.

---

## Checklist (S01-a evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                                                                | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Authentication             | **PASS**           | Public register still `@Public()`. Policy enforced on register. Disabled-user behavior unchanged. No passwordless path. Seed password rejected on register.                                      |        |
| 2   | Authorization              | **NOT APPLICABLE** | No new mutating authenticated routes. Role assignment is V3-S02. Default register role remains Researcher.                                                                                       |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Classes not in this slice cite owners.                                                                                                                                          |        |
| 4   | Input validation           | **PASS**           | `RegisterBodyDto` + `IsProductPassword` + service `assertProductPassword`. Login DTO length-only unchanged.                                                                                      |        |
| 5   | Output encoding            | **PASS**           | React defaults kept. Register response does not include password or hash. Validation 400s redact `password` values.                                                                              |        |
| 6   | Session review             | **NOT APPLICABLE** | Register still issues the existing PC-18 JWT. Revocation / short access / refresh are **S01-c / S01-d**.                                                                                         |        |
| 7   | Credential review          | **PASS**           | bcrypt cost 10 kept. Plaintext not stored. Seed `trp-admin-change-me` rejected on product register. Login form still empty. Engineer `setPassword` still allows the seed (not the product path). |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No customer vendor secrets. Host JWT remains host infrastructure. Vault is **V3-S03**.                                                                                                           |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | No new public routes. Existing global limits kept. Auth-route tightening may still be added later in S01; platform quotas remain **V3-S04**.                                                     |        |
| 10  | Replay protection          | **NOT APPLICABLE** | Reset-token reuse is **S01-e**. Refresh reuse is **S01-c**. Live-order replay is **V3-L05**.                                                                                                     |        |
| 11  | CSRF                       | **NOT APPLICABLE** | No cookie session in this slice. Cookie CSRF is **S01-c**.                                                                                                                                       |        |
| 12  | XSS                        | **NOT APPLICABLE** | Session transport / JS storage exit is **S01-c**. React defaults unchanged. No tokens added to markup.                                                                                           |        |
| 13  | Injection review           | **PASS**           | Prisma / existing Identity create path. No string-built SQL.                                                                                                                                     |        |
| 14  | Logging review             | **PASS**           | Register still logs user id / email, not password or hash.                                                                                                                                       |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product is **V3-S05**. Structured register log kept.                                                                                                                                       |        |
| 16  | Error leakage review       | **PASS**           | Policy messages are operator language. Duplicate email still 409 (PC-18, allowed). Password values redacted in validation errors.                                                                |        |
| 17  | Permission review          | **PASS**           | New users remain Researcher. No Admin-by-register.                                                                                                                                               |        |
| 18  | Workspace isolation        | **PASS**           | No membership change. Existing workspace bootstrap after register unchanged.                                                                                                                     |        |
| 19  | Financial Integrity review | **NOT APPLICABLE** | Ledger / orders untouched.                                                                                                                                                                       |        |
| 20  | Secure-by-default review   | **PASS**           | US158 JWT secret rules untouched. No debug prefill. Live remains off.                                                                                                                            |        |
| 21  | Zero Trust review          | **PASS**           | Register remains the existing public route. `/me` still authenticated.                                                                                                                           |        |
| 22  | Least Privilege review     | **PASS**           | Default Researcher. No role-assignment API.                                                                                                                                                      |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Slice does not touch AI.                                                                                                                                                                         |        |
| 24  | Connection security review | **NOT APPLICABLE** | Slice does not touch connections.                                                                                                                                                                |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                                |
| ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------- |
| Broken access control                      | **NOT APPLICABLE** | No new privileged routes. V3-S02 for role admin.                                             |
| Cryptographic failures                     | **PASS**           | bcrypt kept; plaintext not stored or returned                                                |
| Injection                                  | **PASS**           | Existing parameterized persistence                                                           |
| Insecure design                            | **PASS**           | Policy on credential-setting register path; login complexity not forced onto existing hashes |
| Security misconfiguration                  | **NOT APPLICABLE** | JWT production secret rules already US158; cookies **S01-c**                                 |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No dependency change. Platform review **V3-S04**                                             |
| Identification and authentication failures | **PASS**           | Complexity on register; lockout **S01-b**; MFA not shipped (Wave 6)                          |
| Software and data integrity failures       | **NOT APPLICABLE** | No update pipeline in this slice                                                             |
| Security logging and monitoring failures   | **PASS**           | No secrets in logs; durable audit product **V3-S05**                                         |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / connections                                                                     |

---

## Threats this slice reduced

| Threat                           | Control in S01-a                           |
| -------------------------------- | ------------------------------------------ |
| Weak product passwords           | Letter + number + length 8                 |
| Shared/dev identity on register  | Seed password rejected on product register |
| Password reflected in 400 bodies | `password` field values redacted           |

Not reduced here: password spray (S01-b), stolen token (S01-c/d), recovery abuse (S01-e).

---

**STOP.** Wait for review before beginning S01-b.

**End of S01-a Security Review.**
