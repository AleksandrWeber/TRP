# V3-S02-c Security Review

**Package:** V3-S02 RBAC Product
**Slice:** S02-c — Role Assignment API
**Wave:** 1 — Security Foundation
**Date:** 2026-08-16
**Stage:** Post-implementation slice review — **not** package Close
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)
**Planning review:** [`v3-s02-security-review.md`](./v3-s02-security-review.md) (unmodified)
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S02-c**. Items owned by later S02 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S02-c.** Only Admin may assign roles. Self-escalation is denied. Horizontal privilege via role-as-membership is not granted. Invalid roles are rejected. Last Active Admin cannot be demoted. Authorization Philosophy is preserved. JWT `role` remains a hint.

Package security exit (People UI, structured events, full horizontal suite, Gate/Risk non-bypass confirmation) is **not** claimed.

---

## Checklist (S02-c evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                   | Action |
| --- | -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **PASS**           | People routes are not `@Public()`. Unauthenticated → 401. Sessions remain **V3-S01**                                                |        |
| 2   | Authorization              | **PASS**           | C6 RoleAdmin on list and assign. Matrix allows C6 for Admin only. Guard runs before Identity. JWT role is not trusted for the write |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Broken access control is in scope for this API                                                                     |        |
| 4   | Input validation           | **PASS**           | Canonical `Role` enum. UUID user id. Unknown fields forbidden. Unknown role 400                                                     |        |
| 5   | Output encoding            | **PASS**           | Operator view is id/email/displayName/role/status only. No HTML product                                                             |        |
| 6   | Session review             | **NOT APPLICABLE** | Consumes S01 sessions. Owner: **V3-S01**                                                                                            |        |
| 7   | Credential review          | **PASS**           | Passwords untouched. People responses contain no hashes                                                                             |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No vendor secrets. Owner: **V3-S03**                                                                                                |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | Global throttle kept. Tightening: **V3-S04**                                                                                        |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new tokens. **V3-S01**                                                                                                           |        |
| 11  | CSRF                       | **PASS**           | Cookie-authenticated PATCH `/v1/people/:id/role` is not in the S01 skip list; matching CSRF header required                         |        |
| 12  | XSS                        | **NOT APPLICABLE** | No UI. **S02-d** / **V3-S04**                                                                                                       |        |
| 13  | Injection review           | **PASS**           | Enum + UUID. Prisma parameterized upsert. No concatenated SQL                                                                       |        |
| 14  | Logging review             | **NOT APPLICABLE** | Structured role-change / C6 deny logs are **S02-e**. Not moved into this slice                                                      |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product **V3-S05**. Slice does not claim it. Assignment is still attributable later (Admin session + Identity write)          |        |
| 16  | Error leakage review       | **PASS**           | Non-Admin never reaches user lookup (403). Missing user 404 “User not found”. Last Admin 409 honest copy. No secrets in bodies      |        |
| 17  | Permission review          | **PASS**           | Existing four roles only. Default register remains Researcher. No extra privilege as convenience                                    |        |
| 18  | Workspace isolation        | **PASS**           | Assign does not add members. Isolation product **V3-S06**. Full horizontal suite **S02-e**                                          |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched. Role change is not a money event                                                                                  |        |
| 20  | Secure-by-default review   | **PASS**           | Default deny on C6. Last Admin protected. No Admin-by-register                                                                      |        |
| 21  | Zero Trust review          | **PASS**           | Signed-in is not a grant. C6 is explicit                                                                                            |        |
| 22  | Least Privilege review     | **PASS**           | Reader / Researcher / Trader cannot assign. Admin still cannot skip Gate/Risk (C9 empty)                                            |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Slice does not touch AI                                                                                                             |        |
| 24  | Connection security review | **NOT APPLICABLE** | C8 unchanged. Connection product is Wave 2                                                                                          |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                               |
| ------------------------------------------ | ------------------ | --------------------------------------------------------------------------- |
| Broken access control                      | **PASS**           | C6 only Admin. Self-escalation 403. Last Admin 409. Vertical HTTP evidenced |
| Cryptographic failures                     | **NOT APPLICABLE** | **V3-S01** / **V3-S03**                                                     |
| Injection                                  | **PASS**           | Enum / UUID / Prisma                                                        |
| Insecure design                            | **PASS**           | No hierarchy; no membership grant; last-Admin in Identity                   |
| Security misconfiguration                  | **PASS**           | People routes classified C6; not public                                     |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No new framework. **V3-S04**                                                |
| Identification and authentication failures | **NOT APPLICABLE** | **V3-S01**                                                                  |
| Software and data integrity failures       | **PASS**           | Identity is SoT; UI is not this slice                                       |
| Security logging and monitoring failures   | **NOT APPLICABLE** | Events **S02-e**; product **V3-S05**                                        |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / Wave 2                                                         |

---

## Threat Review (lightweight STRIDE)

Not a full threat model. One table for this slice.

| Category                   | What PASS requires (this package)                          | Verdict            | Notes / owner                                                                    |
| -------------------------- | ---------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| **Spoofing**               | Attacker cannot pretend to be an Admin on People/role HTTP | **PASS**           | S01 session required. Unauthenticated 401. Forged JWT role is not the write path |
| **Tampering**              | Client cannot set an unknown role or skip last-Admin       | **PASS**           | Enum DTO. Identity last-Admin. Extra fields rejected                             |
| **Repudiation**            | Role assignment and C6 deny are attributable               | **NOT APPLICABLE** | Structured events are **S02-e**. Assignment path exists for later logging        |
| **Information Disclosure** | No secrets; People is Admin-only                           | **PASS**           | Non-Admin list/assign 403 without a directory body. Views have no credentials    |
| **Denial of Service**      | Expensive unbounded People work considered                 | **PASS**           | List is in-memory Identity cache, Wave 1 small. Platform limits **V3-S04**       |
| **Elevation of Privilege** | No Admin/live/workspace power as convenience. Default-deny | **PASS**           | Primary STRIDE row. Self-escalation denied. Role ≠ membership                    |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added.

| Surface                   | What PASS requires (this package)                                       | Verdict            | Notes / owner                                                                 |
| ------------------------- | ----------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| **Authentication**        | Known vs unknown identity timing                                        | **NOT APPLICABLE** | **V3-S01**                                                                    |
| **Credential validation** | Password compare timing                                                 | **NOT APPLICABLE** | **V3-S01**                                                                    |
| **Recovery flow**         | Recovery enumeration timing                                             | **NOT APPLICABLE** | **V3-S01**                                                                    |
| **Session validation**    | Valid/invalid/revoked session timing                                    | **NOT APPLICABLE** | **V3-S01**                                                                    |
| **People / role lookup**  | Timing must not oracle user existence to non-Admin                      | **PASS**           | Non-Admin is 403 in the guard before Identity lookup. Admin 404 is authorized |
| **Permission decision**   | Matrix lookup must not become a practical oracle beyond the deny itself | **PASS**           | Same 403 for Reader / Researcher / Trader on C6                               |

```text
Unauthenticated PATCH /v1/people/:id/role     401
Reader / Researcher / Trader assign           403
Trader GET /v1/people                         403
Invalid role (Admin)                          400
Missing user (Admin)                          404
Last Admin demote (Admin)                     409
Admin assign known role                       200

PASS
```

Non-Admin does not learn whether `userId` exists. Admin 404 vs 200 is an authorized directory function, not a cross-workspace oracle (role is Identity-global in Wave 1).

---

## Abuse Assessment

Assessment only. No new edge mitigations shipped beyond C6, validation, last-Admin, and existing S01 CSRF/lockout.

| Category                | What PASS requires (this package)                                    | Verdict            | Notes / owner                                  |
| ----------------------- | -------------------------------------------------------------------- | ------------------ | ---------------------------------------------- |
| **Credential stuffing** | Auth surfaces                                                        | **NOT APPLICABLE** | **V3-S01** lockout                             |
| **Brute force**         | Secret guessing                                                      | **PASS**           | Role enum is not a secret. Invalid role is 400 |
| **Enumeration**         | User existence not disclosed to non-Admin                            | **PASS**           | C6 403 before lookup                           |
| **Replay attempts**     | Token replay                                                         | **NOT APPLICABLE** | **V3-S01**                                     |
| **Resource exhaustion** | Unbounded People list/assign                                         | **PASS**           | Wave 1 list is small. Platform cap **V3-S04**  |
| **Automation abuse**    | Scripted role grants                                                 | **PASS**           | Requires Admin session + CSRF for cookies      |
| **Distributed attacks** | Edge / IP                                                            | **NOT APPLICABLE** | **V3-S04** / host infrastructure               |
| **Policy bypass**       | Caller cannot obtain C6 without Admin; cannot use role as membership | **PASS**           | Guard + membership non-bypass test             |

```text
Reader assign                         Denied     PASS
Researcher assign                     Denied     PASS
Trader assign (including self)        Denied     PASS
Trader list operators                 Denied     PASS
Unknown role                          Rejected   PASS
Last Active Admin demote              Refused    PASS
Assign does not add workspace member  Held       PASS

PASS
```

---

## Privilege escalation review

An operator with a lower role must not obtain a higher class except by an Admin assignment.

| Attack                              | Control in S02-c                                          | Verdict  |
| ----------------------------------- | --------------------------------------------------------- | -------- |
| Act as Admin without the Admin role | C6 on People HTTP; matrix denies Reader/Researcher/Trader | **PASS** |
| Self-escalate via HTTP              | Trader/Reader PATCH self → 403 before Identity            | **PASS** |
| Invalid role as a fifth grant       | `@IsEnum(Role)` + Identity `isKnownRole`                  | **PASS** |
| Demote last Admin to seize the host | Last-Admin in Identity; HTTP 409                          | **PASS** |
| Any role starts live via assignment | Assignment does not grant C7. C7 remains empty            | **PASS** |

---

## Horizontal access review

A role must not substitute for workspace membership.

| Attack                                  | Control in S02-c                                                              | Verdict                                     |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| Role used as foreign membership         | `assignRole` does not write Workspace. `isMember` unchanged after Admin grant | **PASS** for non-bypass. Suite is **S02-e** |
| Admin C5 in a workspace they do not own | Unchanged US158 / `WorkspaceAccessService`                                    | **PASS**                                    |
| Non-Admin lists operators               | GET `/v1/people` is C6                                                        | **PASS**                                    |

---

## Vertical access review

Higher-class actions stay closed to lower roles even when a UI would hide the control.

| Attack                   | Control in S02-c | Verdict  |
| ------------------------ | ---------------- | -------- |
| Reader C6                | Denied           | **PASS** |
| Researcher C6            | Denied           | **PASS** |
| Trader C6                | Denied           | **PASS** |
| Any role C7 / C9         | Unchanged deny   | **PASS** |
| Anonymous on People HTTP | 401              | **PASS** |

---

## Threats this slice reduced

| Threat                                     | Control in S02-c                |
| ------------------------------------------ | ------------------------------- |
| SQL / seed as the only way to grant a role | Admin People PATCH              |
| Self-escalation via HTTP                   | C6 deny                         |
| Leaving the host with zero Active Admins   | Last-Admin Identity invariant   |
| Unknown / extra role identifiers           | Enum DTO + domain `isKnownRole` |
| Non-Admin operator directory               | C6 on GET `/v1/people`          |
| Role grant used as a workspace invite      | No Workspace write on assign    |

Not reduced here: structured authorization events (S02-e), People UI (S02-d), isolation product (S06), audit product (S05).

---

**STOP.** Wait for Product Owner review before beginning V3-S02-d People Product.

**End of S02-c Security Review.**
