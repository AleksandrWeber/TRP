# V3-S02-b Security Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-b — Surface Coverage  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s02-security-review.md`](./v3-s02-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S02-b**. Items owned by later S02 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S02-b.** Allow-by-omission on customer HTTP is closed. Every handler is `@Public()` (C0) or `@RequirePermission` from C0–C9. Unclassified routes deny. Live mutations are C7 and denied for every role. No anonymous access on non-public routes. No new privilege class. No People assignment path to escalate through.

Package security exit (People HTTP, last-Admin, authorization events) is **not** claimed.

---

## Checklist (S02-b evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                                 | Action |
| --- | -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **NOT APPLICABLE** | No new auth product. C0 remains S01 public. C1 consumes S01 sessions. Owner: **V3-S01**                                                                           |        |
| 2   | Authorization              | **PASS**           | Primary control of this slice. Every non-public handler classified. Guard fail-closed. JWT role remains a hint. No ABAC. Admin cannot skip Gate/Risk (C9 unbound) |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Broken access control is the in-scope class                                                                                                      |        |
| 4   | Input validation           | **NOT APPLICABLE** | No new HTTP bodies. People DTOs are **S02-c**                                                                                                                     |        |
| 5   | Output encoding            | **NOT APPLICABLE** | No new UI or JSON product surface                                                                                                                                 |        |
| 6   | Session review             | **NOT APPLICABLE** | Consumes S01 sessions. Owner: **V3-S01**                                                                                                                          |        |
| 7   | Credential review          | **NOT APPLICABLE** | Passwords untouched. Owner: **V3-S01**                                                                                                                            |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No vendor secrets collected. Owner: **V3-S03**                                                                                                                    |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | No new endpoints. Global throttle kept. Owner of tightening: **V3-S04**                                                                                           |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new tokens. **V3-S01** / **V3-L05**                                                                                                                            |        |
| 11  | CSRF                       | **NOT APPLICABLE** | No new cookie mutations. Existing S01 CSRF remains. People mutations are **S02-c**                                                                                |        |
| 12  | XSS                        | **NOT APPLICABLE** | No UI. **V3-S04** for platform CSP                                                                                                                                |        |
| 13  | Injection review           | **PASS**           | No SQL. Permission ids remain the enum catalog                                                                                                                    |        |
| 14  | Logging review             | **NOT APPLICABLE** | Structured role-change / C6 deny logs are **S02-e**                                                                                                               |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product **V3-S05**. Slice does not claim it                                                                                                                 |        |
| 16  | Error leakage review       | **PASS**           | Guard deny is 403 without enumerating users or foreign workspaces. Unknown permission does not change that                                                        |        |
| 17  | Permission review          | **PASS**           | No C10+. Default Researcher kept. C7/C8/C9 still empty. Telegram bind used C2 rather than inventing a class                                                       |        |
| 18  | Workspace isolation        | **PASS**           | Guard does not substitute role for membership. Controllers still call Workspace. Isolation product **V3-S06**. Horizontal suite **S02-e**                         |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched. C5 paper only. C7 denied. C9 never                                                                                                              |        |
| 20  | Secure-by-default review   | **PASS**           | Unclassified HTTP denied. Live mutations denied. No Admin-by-register                                                                                             |        |
| 21  | Zero Trust review          | **PASS**           | Non-public APIs require a proven session _and_ an explicit class. Network location is not a role                                                                  |        |
| 22  | Least Privilege review     | **PASS**           | Reader projections/self/workspace only. Researcher no paper. Trader no C6. Admin no live/bypass                                                                   |        |
| 23  | AI safety review           | **PASS**           | `/v1/ai/execute` and AI analytics generate are C4. They do not become paper or live commands                                                                      |        |
| 24  | Connection security review | **NOT APPLICABLE** | C8 remains empty. Exchange-adapter connect kept as existing Trader/Admin paper gate, not a Connection Management product. Owner: Wave 2 / **V3-S03**              |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                                        |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| Broken access control                      | **PASS**           | Vertical matrix on HTTP. Unclassified deny. Public list explicit. Remaining People HTTP is **S02-c** |
| Cryptographic failures                     | **NOT APPLICABLE** | **V3-S01** / **V3-S03**                                                                              |
| Injection                                  | **PASS**           | Enum catalog                                                                                         |
| Insecure design                            | **PASS**           | No hierarchy; no Admin-as-bypass; no second gate                                                     |
| Security misconfiguration                  | **PASS**           | Allow-by-omission closed for this slice. Platform hardening **V3-S04**                               |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No new framework. **V3-S04**                                                                         |
| Identification and authentication failures | **NOT APPLICABLE** | **V3-S01**                                                                                           |
| Software and data integrity failures       | **PASS**           | Server policy; UI is not SoT                                                                         |
| Security logging and monitoring failures   | **NOT APPLICABLE** | Events **S02-e**; product **V3-S05**                                                                 |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / Wave 2                                                                                  |

---

## Threat Review (lightweight STRIDE)

Not a full threat model. One table for this slice.

| Category                   | What PASS requires (this package)                                  | Verdict            | Notes / owner                                                                                      |
| -------------------------- | ------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------- |
| **Spoofing**               | Attacker cannot pretend to be an operator on this slice’s surfaces | **NOT APPLICABLE** | Session proof remains **V3-S01**. Guard consumes an already proven user                            |
| **Tampering**              | Client cannot alter role/membership in a way the server honors     | **PASS**           | Decision uses Identity role already on the request user. Omitting decorator metadata is now a deny |
| **Repudiation**            | Role assignment and C6 deny are attributable                       | **NOT APPLICABLE** | Assignment/events are **S02-c / S02-e**                                                            |
| **Information Disclosure** | No secrets; People is Admin-only                                   | **PASS**           | No People API. Public list is explicit. 403 does not leak foreign records                          |
| **Denial of Service**      | Expensive unbounded People work considered                         | **NOT APPLICABLE** | No People list. **S02-c** / **V3-S04**                                                             |
| **Elevation of Privilege** | No Admin/live/workspace power as convenience. Default-deny         | **PASS**           | Primary STRIDE row. Unclassified deny. C7 denied. Reader cannot research or paper-command          |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added.

| Surface                                | What PASS requires (this package)                                       | Verdict            | Notes / owner                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| **Authentication**                     | Known vs unknown identity timing                                        | **NOT APPLICABLE** | **V3-S01**                                                                     |
| **Credential validation**              | Password compare timing                                                 | **NOT APPLICABLE** | **V3-S01**                                                                     |
| **Recovery flow**                      | Recovery enumeration timing                                             | **NOT APPLICABLE** | **V3-S01**                                                                     |
| **Session validation**                 | Valid/invalid/revoked session timing                                    | **NOT APPLICABLE** | **V3-S01**                                                                     |
| **People / role lookup**               | Timing must not oracle user existence across workspaces                 | **NOT APPLICABLE** | No People/role HTTP. Owner: **S02-c**                                          |
| **Permission decision** _(this slice)_ | Matrix lookup must not become a practical oracle beyond the deny itself | **PASS**           | Same 403 path for missing vs unknown vs wrong role from the HTTP caller’s view |

```text
Missing permission     403
Unknown role           403
Wrong role (Reader C4) 403
Unauthenticated C4     403

PASS (HTTP). Operator enumeration remains S02-c.
```

---

## Abuse Assessment

Assessment only. No new edge mitigations shipped in this review.

| Category                         | What PASS requires (this package)                                                     | Verdict            | Notes / owner                                     |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------- |
| **Credential stuffing**          | Auth surfaces                                                                         | **NOT APPLICABLE** | **V3-S01** lockout                                |
| **Brute force**                  | Secret guessing                                                                       | **NOT APPLICABLE** | Role enum is not a secret. **V3-S01**             |
| **Enumeration**                  | User existence not disclosed to non-Admin                                             | **NOT APPLICABLE** | No People API. **S02-c**                          |
| **Replay attempts**              | Token replay                                                                          | **NOT APPLICABLE** | **V3-S01**                                        |
| **Resource exhaustion**          | Unbounded People list/assign                                                          | **NOT APPLICABLE** | No list. **S02-c** / **V3-S04**                   |
| **Automation abuse**             | Scripted role grants                                                                  | **NOT APPLICABLE** | No assign API. **S02-c**                          |
| **Distributed attacks**          | Edge / IP                                                                             | **NOT APPLICABLE** | **V3-S04** / host infrastructure                  |
| **Policy bypass** _(this slice)_ | Caller cannot obtain a class by omitting metadata or by hitting an unclassified route | **PASS**           | Unclassified deny. Inventory test covers all HTTP |

```text
Unclassified known role     Denied     PASS
Reader on certify           Denied     PASS
Researcher on paper create  Denied     PASS
Admin on live start         Denied     PASS
Public register/login       Allowed    PASS

PASS
```

---

## Privilege escalation review

An operator with a lower role must not obtain a higher class except by a later Admin assignment (**S02-c**).

| Attack                              | Control in S02-b                                      | Verdict  |
| ----------------------------------- | ----------------------------------------------------- | -------- |
| Act as Admin without the Admin role | C6 only on `GET /v1/auth/admin`; matrix denies others | **PASS** |
| Researcher issues paper commands    | C5 on paper HTTP; Researcher denied                   | **PASS** |
| Reader certifies / runs research    | C4 denied                                             | **PASS** |
| Any role starts live                | C7 denied                                             | **PASS** |
| Omit `@RequirePermission` to allow  | Guard denies unclassified                             | **PASS** |
| Self-escalate via HTTP              | **NOT APPLICABLE** — no role-assign API (**S02-c**)   |          |

---

## Horizontal access review

A role must not substitute for workspace membership.

| Attack                                  | Control in S02-b                                                            | Verdict                                     |
| --------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| Role used as foreign membership         | Guard does not check membership; Workspace controllers still `assertMember` | **PASS** for non-bypass. Suite is **S02-e** |
| Admin C5 in a workspace they do not own | Unchanged US158 / `WorkspaceAccessService`                                  | **PASS**                                    |
| Non-Admin lists operators               | No People API                                                               | **PASS** (absence). HTTP lock is **S02-c**  |

---

## Vertical access review

Higher-class actions stay closed to lower roles even when a UI would hide the control.

| Attack                            | Control in S02-b | Verdict  |
| --------------------------------- | ---------------- | -------- |
| Reader C4 / C5 / C6               | Denied           | **PASS** |
| Researcher C5 / C6                | Denied           | **PASS** |
| Trader C6                         | Denied           | **PASS** |
| Any role C7 / C9                  | Denied           | **PASS** |
| Unclassified HTTP by a known role | Denied           | **PASS** |
| Anonymous on non-public HTTP      | Denied           | **PASS** |

---

## Threats this slice reduced

| Threat                                                   | Control in S02-b                                |
| -------------------------------------------------------- | ----------------------------------------------- |
| Implicit “authenticated means allowed” on remaining HTTP | Fail-closed unclassified + `@RequirePermission` |
| Live mutations reachable because the controller existed  | C7 on live commands                             |
| Reader completing research/certify/paper                 | C4/C5 on those handlers                         |
| Public list growing by omission                          | Inventory test of every handler                 |

Not reduced here: self-escalation HTTP (S02-c), People enumeration (S02-c), authorization event log (S02-e), isolation product (S06).

---

**STOP.** Wait for Product Owner review before beginning V3-S02-c Role Assignment API.

**End of S02-b Security Review.**
