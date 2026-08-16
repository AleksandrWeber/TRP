# V3-S02-a Security Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-a — Permission Model  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s02-security-review.md`](./v3-s02-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

This review records evidence for **S02-a**. Items owned by later S02 slices are **NOT APPLICABLE** here with that owner. They are not PASS. Package Close cannot occur while those remain unimplemented.

---

## Slice verdict

**PASS for S02-a.** The Version 3 permission matrix is the server-side policy. Default is deny. Unknown role, unknown permission, unknown action, and missing permission fail closed. Ownership denies a listed role that is not a workspace member. There is no inheritance engine. Live, vault/connections, and Gate/Risk bypass are not granted to any role.

Package security exit (People HTTP, last-Admin, surface coverage of remaining routes) is **not** claimed.

---

## Checklist (S02-a evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                                                                                                                           | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Authentication             | **NOT APPLICABLE** | No new routes. Sessions remain **V3-S01**. Decision service consumes an already proven Identity role                                                                                        |        |
| 2   | Authorization              | **PASS**           | Primary control of this slice. Matrix + `AuthorizationDecisionService` + `RolesGuard` `@RequirePermission`. JWT role remains a hint. No ABAC engine. Admin cannot skip Gate/Risk (C9 empty) |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below. Broken access control is in scope for the policy                                                                                                                           |        |
| 4   | Input validation           | **NOT APPLICABLE** | No new HTTP bodies. Role/permission identifiers are catalog-checked. People DTOs are **S02-c**                                                                                              |        |
| 5   | Output encoding            | **NOT APPLICABLE** | No new UI or JSON product surface                                                                                                                                                           |        |
| 6   | Session review             | **NOT APPLICABLE** | Consumes S01 sessions. Owner: **V3-S01**                                                                                                                                                    |        |
| 7   | Credential review          | **NOT APPLICABLE** | Passwords untouched. Owner: **V3-S01**                                                                                                                                                      |        |
| 8   | Secret storage             | **NOT APPLICABLE** | No vendor secrets. Owner: **V3-S03**                                                                                                                                                        |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | No new endpoints. Global throttle kept. Owner of tightening: **V3-S04**                                                                                                                     |        |
| 10  | Replay protection          | **NOT APPLICABLE** | No new tokens. **V3-S01** / **V3-L05**                                                                                                                                                      |        |
| 11  | CSRF                       | **NOT APPLICABLE** | No new cookie mutations. People mutations are **S02-c**                                                                                                                                     |        |
| 12  | XSS                        | **NOT APPLICABLE** | No UI. **V3-S04** for platform CSP                                                                                                                                                          |        |
| 13  | Injection review           | **PASS**           | No SQL. Permission ids are an enum catalog, not concatenated queries                                                                                                                        |        |
| 14  | Logging review             | **NOT APPLICABLE** | Structured role-change / C6 deny logs are **S02-e**. Decision reasons exist in-process; not a log product                                                                                   |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product **V3-S05**. Slice does not claim it                                                                                                                                           |        |
| 16  | Error leakage review       | **PASS**           | Decision reasons are internal. No People directory. Unknown permission does not enumerate users                                                                                             |        |
| 17  | Permission review          | **PASS**           | This **is** the permission model. Default Researcher kept. No extra privilege as convenience. C7/C8/C9 empty                                                                                |        |
| 18  | Workspace isolation        | **PASS**           | Role never substitutes for membership (`not_member`). No membership table invented. Isolation product **V3-S06**                                                                            |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched. C5 is paper command only. C9 never. Live orders not enabled                                                                                                               |        |
| 20  | Secure-by-default review   | **PASS**           | Default deny. No Admin-by-register. Live off                                                                                                                                                |        |
| 21  | Zero Trust review          | **PASS**           | Policy does not treat “signed in” as a grant. Network location is not a role                                                                                                                |        |
| 22  | Least Privilege review     | **PASS**           | Explicit allows only. Admin is not unrestricted. Reader is projections-only in the matrix                                                                                                   |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Slice does not touch AI                                                                                                                                                                     |        |
| 24  | Connection security review | **NOT APPLICABLE** | C8 denied for every role. Connection product is Wave 2                                                                                                                                      |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                                                                                |
| ------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Broken access control                      | **PASS**           | Vertical matrix, unknown-deny, no inheritance, ownership wins. Remaining HTTP classification is **S02-b**    |
| Cryptographic failures                     | **NOT APPLICABLE** | **V3-S01** / **V3-S03**                                                                                      |
| Injection                                  | **PASS**           | Enum catalog                                                                                                 |
| Insecure design                            | **PASS**           | No hierarchy; no Admin-as-bypass; no new SoT                                                                 |
| Security misconfiguration                  | **NOT APPLICABLE** | Platform **V3-S04**. Allow-by-omission on unclassified routes is an honest S02-a leftover owned by **S02-b** |
| Vulnerable and outdated components         | **NOT APPLICABLE** | No new framework. **V3-S04**                                                                                 |
| Identification and authentication failures | **NOT APPLICABLE** | **V3-S01**                                                                                                   |
| Software and data integrity failures       | **PASS**           | Matrix is server policy; UI is not SoT                                                                       |
| Security logging and monitoring failures   | **NOT APPLICABLE** | Events **S02-e**; product **V3-S05**                                                                         |
| Server-side request forgery (SSRF)         | **NOT APPLICABLE** | **V3-S04** / Wave 2                                                                                          |

---

## Threat Review (lightweight STRIDE)

Not a full threat model. One table for this slice.

| Category                   | What PASS requires (this package)                                  | Verdict            | Notes / owner                                                                                        |
| -------------------------- | ------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Spoofing**               | Attacker cannot pretend to be an operator on this slice’s surfaces | **NOT APPLICABLE** | No new HTTP. Session proof remains **V3-S01**                                                        |
| **Tampering**              | Client cannot alter role/membership in a way the server honors     | **PASS**           | Decision uses Identity role + optional membership fact. JWT role is not consulted by the matrix      |
| **Repudiation**            | Role assignment and C6 deny are attributable                       | **NOT APPLICABLE** | Assignment/events are **S02-c / S02-e**. Decision reasons exist for later logging                    |
| **Information Disclosure** | No secrets; People is Admin-only                                   | **PASS**           | No People API. Catalog has no secrets                                                                |
| **Denial of Service**      | Expensive unbounded People work considered                         | **NOT APPLICABLE** | No People list. **S02-c** / **V3-S04**                                                               |
| **Elevation of Privilege** | No Admin/live/workspace power as convenience. Default-deny         | **PASS**           | Primary STRIDE row for this slice. Unknown role denied. C7/C8/C9 closed. Register remains Researcher |

---

## Timing Assessment

Could observable timing reveal protected information?

Assessment only. No dummy delays were added.

| Surface                                | What PASS requires (this package)                                       | Verdict            | Notes / owner                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**                     | Known vs unknown identity timing                                        | **NOT APPLICABLE** | **V3-S01**                                                                                                                                           |
| **Credential validation**              | Password compare timing                                                 | **NOT APPLICABLE** | **V3-S01**                                                                                                                                           |
| **Recovery flow**                      | Recovery enumeration timing                                             | **NOT APPLICABLE** | **V3-S01**                                                                                                                                           |
| **Session validation**                 | Valid/invalid/revoked session timing                                    | **NOT APPLICABLE** | **V3-S01**                                                                                                                                           |
| **People / role lookup**               | Timing must not oracle user existence across workspaces                 | **NOT APPLICABLE** | No People/role HTTP in this slice. Owner: **S02-c**                                                                                                  |
| **Permission decision** _(this slice)_ | Matrix lookup must not become a practical oracle beyond the deny itself | **PASS**           | In-process catalog/set lookup. Same deny path for unknown role vs missing permission from the caller’s view of HTTP (no new route). No padding added |

```text
Unknown role         denied (unknown_role)
Unknown permission   denied (unknown_permission)
Missing permission   denied (missing_permission)

PASS (policy). HTTP enumeration of operators remains S02-c.
```

---

## Abuse Assessment

Assessment only. No new edge mitigations shipped in this review.

| Category                         | What PASS requires (this package)                                                                  | Verdict            | Notes / owner                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| **Credential stuffing**          | Auth surfaces                                                                                      | **NOT APPLICABLE** | **V3-S01** lockout                                                                |
| **Brute force**                  | Secret guessing                                                                                    | **NOT APPLICABLE** | Role enum is not a secret to brute. **V3-S01**                                    |
| **Enumeration**                  | User existence not disclosed to non-Admin                                                          | **NOT APPLICABLE** | No People API. **S02-c**                                                          |
| **Replay attempts**              | Token replay                                                                                       | **NOT APPLICABLE** | **V3-S01**                                                                        |
| **Resource exhaustion**          | Unbounded People list/assign                                                                       | **NOT APPLICABLE** | No list. **S02-c** / **V3-S04**                                                   |
| **Automation abuse**             | Scripted role grants                                                                               | **NOT APPLICABLE** | No assign API. **S02-c**                                                          |
| **Distributed attacks**          | Edge / IP                                                                                          | **NOT APPLICABLE** | **V3-S04** / host infrastructure                                                  |
| **Policy bypass** _(this slice)_ | Caller cannot obtain a class by omitting metadata on a classified permission or by an unknown role | **PASS**           | `@RequirePermission` fail-closed. Unknown role denied even on unclassified routes |

```text
Unknown role on unclassified route    Denied     PASS
Missing C5 on Researcher              Denied     PASS
Distributed attack                    Out of scope  NOT APPLICABLE (V3-S04 / host)

PASS
```

---

## Privilege escalation review

An operator with a lower role must not obtain a higher class except by a later Admin assignment (**S02-c**).

| Attack                              | Control in S02-a                                                                   | Verdict  |
| ----------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Act as Admin without the Admin role | C6 not in Reader/Researcher/Trader allows                                          | **PASS** |
| Researcher issues paper commands    | C5 denied                                                                          | **PASS** |
| Register as Admin                   | Identity create default remains Researcher; matrix does not grant C6 to Researcher | **PASS** |
| Unknown / forged role string        | `isKnownRole` fail-closed                                                          | **PASS** |
| Admin “force Gate pass”             | C9 never granted                                                                   | **PASS** |
| Self-escalate via HTTP              | **NOT APPLICABLE** — no role-assign API yet (**S02-c**)                            |          |

---

## Horizontal access review

A role must not substitute for workspace membership.

| Attack                                  | Control in S02-a                                                              | Verdict                                    |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Admin C5 in a workspace they do not own | `workspaceMember: false` → `not_member`. US158 `workspace access denied` kept | **PASS**                                   |
| Role change adds foreign membership     | No membership writes in this slice                                            | **PASS**                                   |
| Non-Admin lists operators               | No People API                                                                 | **PASS** (absence). HTTP lock is **S02-c** |

---

## Vertical access review

Higher-class actions stay closed to lower roles even when a UI would hide the control.

| Attack                                                      | Control in S02-a              | Verdict                                                        |
| ----------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| Reader C4 / C5 / C6                                         | Denied                        | **PASS**                                                       |
| Researcher C5 / C6                                          | Denied                        | **PASS**                                                       |
| Trader C6                                                   | Denied                        | **PASS**                                                       |
| Any role C7 / C8 / C9                                       | Denied                        | **PASS**                                                       |
| Remaining unclassified HTTP still reachable by a known role | Honest leftover for **S02-b** | **NOT APPLICABLE** to S02-a done-when; **S02-b** must close it |

---

## Threats this slice reduced

| Threat                                                            | Control in S02-a                              |
| ----------------------------------------------------------------- | --------------------------------------------- |
| Implicit “authenticated means allowed” for classified permissions | `@RequirePermission` + matrix default deny    |
| Permission inheritance (`Admin ⊃ Trader ⊃ live`)                  | No hierarchy module; explicit cells; C7 empty |
| Unknown role treated as authenticated-any                         | Guard denies unknown roles                    |
| Role used as foreign membership                                   | Ownership check on workspace-scoped classes   |
| Live / vault / Gate bypass as convenience                         | C7 / C8 / C9 empty for every role             |

Not reduced here: TD-006 remaining HTTP (S02-b), self-escalation HTTP (S02-c), People enumeration (S02-c), authorization event log (S02-e).

---

**STOP.** Wait for review before beginning S02-b.

**End of S02-a Security Review.**
