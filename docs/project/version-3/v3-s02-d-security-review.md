# V3-S02-d Security Review

**Package:** V3-S02 RBAC Product  
**Slice:** S02-d — People Product  
**Wave:** 1 — Security Foundation  
**Date:** 2026-08-16  
**Stage:** Post-implementation slice review — **not** package Close  
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md) §7 · [`v3-security-vision.md`](./v3-security-vision.md)  
**Planning review:** [`v3-s02-security-review.md`](./v3-s02-security-review.md) (unmodified)  
**Checklist:** [`version-3-security-checklist.md`](./version-3-security-checklist.md)  
**Nature:** Security review. Not an RC. Not an ADR. Not the audit product.

---

## Slice verdict

**PASS for S02-d.** Only Admin can open a working People directory or change roles. Self-role change is denied even when last-Admin would allow it. Invalid roles are rejected. Authorization Philosophy is preserved.

Package security exit (structured events, full horizontal suite, Gate/Risk non-bypass) is **not** claimed — **S02-e**.

---

## Checklist (S02-d evidence)

| #   | Control                    | Verdict            | Evidence or owner                                                                          | Action |
| --- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------ | ------ |
| 1   | Authentication             | **PASS**           | People is behind `RequireAuth` + S01 session. Unauthenticated never sees the shell         |        |
| 2   | Authorization              | **PASS**           | C6 on list/assign. Non-Admin 403 → honest unavailable UI. JWT role not written by the page |        |
| 3   | OWASP Top 10 review        | **PASS**           | Worksheet below                                                                            |        |
| 4   | Input validation           | **PASS**           | Four roles in the select. Server enum + `isKnownRole`. Unknown rejected                    |        |
| 5   | Output encoding            | **PASS**           | React text. No HTML from the API interpolated unsafely                                     |        |
| 6   | Session review             | **NOT APPLICABLE** | **V3-S01**                                                                                 |        |
| 7   | Credential review          | **PASS**           | No passwords on People                                                                     |        |
| 8   | Secret storage             | **NOT APPLICABLE** | **V3-S03**                                                                                 |        |
| 9   | Rate limiting              | **NOT APPLICABLE** | **V3-S04**                                                                                 |        |
| 10  | Replay protection          | **NOT APPLICABLE** | **V3-S01**                                                                                 |        |
| 11  | CSRF                       | **PASS**           | Existing cookie CSRF on People PATCH (S02-c). Page uses the shared API client              |        |
| 12  | XSS                        | **PASS**           | Operator names rendered as text. No markdown HTML                                          |        |
| 13  | Injection review           | **PASS**           | Role enum. User id from Identity list, not free-typed SQL                                  |        |
| 14  | Logging review             | **NOT APPLICABLE** | Structured events **S02-e**                                                                |        |
| 15  | Audit review               | **NOT APPLICABLE** | Audit product **V3-S05**                                                                   |        |
| 16  | Error leakage review       | **PASS**           | Non-Admin does not receive the directory. Mapped operator copy. No JSON in the UI          |        |
| 17  | Permission review          | **PASS**           | Four roles. Self-role denied. No extra privilege as convenience                            |        |
| 18  | Workspace isolation        | **PASS**           | People does not write membership. Isolation product **V3-S06**. Suite **S02-e**            |        |
| 19  | Financial Integrity review | **PASS**           | Ledger untouched                                                                           |        |
| 20  | Secure-by-default review   | **PASS**           | Own-role blocked. Last-Admin kept                                                          |        |
| 21  | Zero Trust review          | **PASS**           | Signed-in is not Admin                                                                     |        |
| 22  | Least Privilege review     | **PASS**           | Reader/Trader cannot use People. Admin cannot strip their own role                         |        |
| 23  | AI safety review           | **NOT APPLICABLE** | Untouched                                                                                  |        |
| 24  | Connection security review | **NOT APPLICABLE** | Wave 2                                                                                     |        |

---

## OWASP Top 10 worksheet

| OWASP class                                | Verdict            | Notes / owner                                    |
| ------------------------------------------ | ------------------ | ------------------------------------------------ |
| Broken access control                      | **PASS**           | C6 + self-role + last-Admin + UI forbidden state |
| Cryptographic failures                     | **NOT APPLICABLE** | S01 / S03                                        |
| Injection                                  | **PASS**           | Enum roles                                       |
| Insecure design                            | **PASS**           | Self-role in Identity, not only hidden UI        |
| Security misconfiguration                  | **PASS**           | People not public                                |
| Vulnerable and outdated components         | **NOT APPLICABLE** | S04                                              |
| Identification and authentication failures | **NOT APPLICABLE** | S01                                              |
| Software and data integrity failures       | **PASS**           | UI is not SoT                                    |
| Security logging and monitoring failures   | **NOT APPLICABLE** | S02-e / S05                                      |
| SSRF                                       | **NOT APPLICABLE** | S04                                              |

---

## Threat Review (lightweight STRIDE)

| Category                   | What PASS requires                                       | Verdict            | Notes                                      |
| -------------------------- | -------------------------------------------------------- | ------------------ | ------------------------------------------ |
| **Spoofing**               | Cannot open People as another operator without a session | **PASS**           | RequireAuth + C6                           |
| **Tampering**              | Cannot set an unknown role or change own role            | **PASS**           | Select + server enum + SelfRoleChangeError |
| **Repudiation**            | Role change attributable                                 | **NOT APPLICABLE** | Events **S02-e**                           |
| **Information Disclosure** | Non-Admin does not get the directory                     | **PASS**           | 403 before list; UI shows no operators     |
| **Denial of Service**      | Unbounded People UI considered                           | **PASS**           | Wave 1 list small. S04 platform            |
| **Elevation of Privilege** | No self-escalation; no self-demotion as convenience      | **PASS**           | C6 + own-role invariant                    |

---

## Timing Assessment

Assessment only. No dummy delays.

| Surface              | Verdict  | Notes                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------- |
| People / role lookup | **PASS** | Non-Admin fails on the list request (403) before a directory is shown |
| Permission decision  | **PASS** | Same unavailable copy; no existence oracle in the UI                  |

```text
Non-Admin opens People     Unavailable (no list)     PASS
Admin opens People         Operators listed          PASS
Admin changes another      Confirm → success         PASS
Admin changes own role     Control absent; API 409   PASS

PASS
```

---

## Abuse Assessment

| Category            | Verdict            | Notes                               |
| ------------------- | ------------------ | ----------------------------------- |
| Enumeration         | **PASS**           | Non-Admin UI has no directory       |
| Automation abuse    | **PASS**           | Admin session + CSRF + confirmation |
| Policy bypass       | **PASS**           | Own-role in Identity, not only UI   |
| Resource exhaustion | **PASS**           | S04 for platform caps               |
| Credential stuffing | **NOT APPLICABLE** | S01                                 |

```text
Trader opens People              Unavailable     PASS
Trader cannot assign             No change control; API 403     PASS
Admin self-demote (2 Admins)     Denied          PASS
Last Admin demote                Denied          PASS
Unknown role                     Rejected        PASS

PASS
```

---

## Privilege escalation review

| Attack                       | Control              | Verdict  |
| ---------------------------- | -------------------- | -------- |
| Non-Admin uses People        | C6 + forbidden UI    | **PASS** |
| Admin removes own Admin role | SelfRoleChangeError  | **PASS** |
| Invalid fifth role from UI   | Select + server enum | **PASS** |
| Last Admin demotion          | Last-Admin (kept)    | **PASS** |

---

## Horizontal / vertical

Horizontal: People does not add workspace members. Full suite **S02-e**.

Vertical: Reader / Researcher / Trader remain without C6. Admin still cannot skip Gate/Risk (no new bypass UI).

---

## Threats this slice reduced

| Threat                                       | Control                     |
| -------------------------------------------- | --------------------------- |
| SQL as the customer Admin path               | People page                 |
| Accidental self-demotion with a second Admin | Own-role Identity invariant |
| Non-Admin directory                          | Forbidden UI without a list |
| Fake empty “no people yet”                   | Honest unavailable copy     |

Not reduced here: structured events (S02-e), isolation product (S06), audit product (S05).

---

**STOP.** Wait for Product Owner review before beginning V3-S02-e.

**End of S02-d Security Review.**
